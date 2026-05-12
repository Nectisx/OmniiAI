/**
 * Couche d'abstraction LLM — OmniAI
 * Gère les 3 providers avec fallback automatique
 * Gemini 2.0 Flash → Llama 3.3 70B (Groq) → GPT-4o (GitHub Models)
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { LLMModel, LLMProvider, MessageRole } from '@omniai/types';
import { MODEL_CONFIGS, FALLBACK_CHAIN, ModelConfig } from '../config/llm.config';
import { quotaService } from './quota.service';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

export interface LLMMessage {
  role: MessageRole;
  content: string;
  imageBase64?: string;   // Pour Gemini multimodal
  imageMimeType?: string;
}

export interface LLMRequestOptions {
  messages: LLMMessage[];
  modelId?: LLMModel;
  dynamicRouting?: boolean;
  userId: number;
  userApiKeys?: Partial<Record<LLMProvider, string>>;  // Clés perso (RG19)
  stream?: boolean;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: LLMModel;
  provider: LLMProvider;
  tokensUsed: number;
  modelSwitched?: boolean;   // Si fallback activé
  previousModel?: LLMModel;
}

export type StreamCallback = (chunk: string, done: boolean, meta?: {
  model: LLMModel;
  provider: LLMProvider;
  modelSwitched?: boolean;
}) => void;

// ── Clients LLM ───────────────────────────────────────────────

function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

function getGroqClient(apiKey: string) {
  return new Groq({ apiKey });
}

function getOpenAIClient(apiKey: string) {
  // GitHub Models utilise le même endpoint OpenAI compatible
  return new OpenAI({
    apiKey,
    baseURL: 'https://models.inference.ai.azure.com',
  });
}

// ── Service principal ─────────────────────────────────────────

export class LLMService {

  /**
   * Sélectionne la clé API à utiliser
   * RG19: clé personnelle prioritaire sur clé serveur
   */
  private getApiKey(provider: LLMProvider, userKeys?: Partial<Record<LLMProvider, string>>): string {
    const userKey = userKeys?.[provider];
    if (userKey) {
      logger.debug(`Utilisation clé personnelle pour ${provider}`);
      return userKey;
    }

    const serverKey = {
      [LLMProvider.GEMINI]: process.env.GEMINI_API_KEY,
      [LLMProvider.GROQ]: process.env.GROQ_API_KEY,
      [LLMProvider.OPENAI]: process.env.GITHUB_TOKEN,
    }[provider];

    if (!serverKey) {
      throw new AppError(`Clé API non configurée pour ${provider}`, 503);
    }

    return serverKey;
  }

  /**
   * Appel à Gemini 2.0 Flash avec support multimodal
   */
  private async callGemini(
    messages: LLMMessage[],
    apiKey: string,
    onChunk?: StreamCallback,
  ): Promise<{ content: string; tokens: number }> {
    const genAI = getGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({
      model: LLMModel.GEMINI_2_FLASH,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Extraire le système prompt
    const systemMsg = messages.find(m => m.role === MessageRole.SYSTEM);
    const chatMessages = messages.filter(m => m.role !== MessageRole.SYSTEM);

    // Construire l'historique pour Gemini
    const history = chatMessages.slice(0, -1).map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg) throw new AppError('Aucun message à envoyer', 400);

    // Construction du contenu (texte + image si présente)
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: lastMsg.content },
    ];

    if (lastMsg.imageBase64 && lastMsg.imageMimeType) {
      parts.push({
        inlineData: {
          data: lastMsg.imageBase64,
          mimeType: lastMsg.imageMimeType,
        },
      });
    }

    const chat = model.startChat({
      history,
      generationConfig: { maxOutputTokens: 8192 },
      systemInstruction: systemMsg?.content,
    });

    if (onChunk) {
      // Mode streaming
      const result = await chat.sendMessageStream(parts);
      let fullContent = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullContent += text;
        onChunk(text, false, {
          model: LLMModel.GEMINI_2_FLASH,
          provider: LLMProvider.GEMINI,
        });
      }

      const finalResult = await result.response;
      const tokens = finalResult.usageMetadata?.totalTokenCount ?? Math.ceil(fullContent.length / 4);
      onChunk('', true, { model: LLMModel.GEMINI_2_FLASH, provider: LLMProvider.GEMINI });
      return { content: fullContent, tokens };
    } else {
      const result = await chat.sendMessage(parts);
      const content = result.response.text();
      const tokens = result.response.usageMetadata?.totalTokenCount ?? Math.ceil(content.length / 4);
      return { content, tokens };
    }
  }

  /**
   * Appel à Llama 3.3 70B via Groq
   */
  private async callGroq(
    messages: LLMMessage[],
    apiKey: string,
    onChunk?: StreamCallback,
  ): Promise<{ content: string; tokens: number }> {
    const groq = getGroqClient(apiKey);

    const formattedMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    if (onChunk) {
      const stream = await groq.chat.completions.create({
        model: LLMModel.LLAMA_3_3_70B,
        messages: formattedMessages,
        max_tokens: 8192,
        stream: true,
      });

      let fullContent = '';
      let totalTokens = 0;

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullContent += text;
        if (text) onChunk(text, false, { model: LLMModel.LLAMA_3_3_70B, provider: LLMProvider.GROQ });
        if (chunk.x_groq?.usage) totalTokens = chunk.x_groq.usage.total_tokens;
      }

      onChunk('', true, { model: LLMModel.LLAMA_3_3_70B, provider: LLMProvider.GROQ });
      const tokens = totalTokens || Math.ceil(fullContent.length / 4);
      return { content: fullContent, tokens };
    } else {
      const response = await groq.chat.completions.create({
        model: LLMModel.LLAMA_3_3_70B,
        messages: formattedMessages,
        max_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokens = response.usage?.total_tokens ?? Math.ceil(content.length / 4);
      return { content, tokens };
    }
  }

  /**
   * Appel à GPT-4o via GitHub Models
   */
  private async callOpenAI(
    messages: LLMMessage[],
    apiKey: string,
    onChunk?: StreamCallback,
  ): Promise<{ content: string; tokens: number }> {
    const openai = getOpenAIClient(apiKey);

    const formattedMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    if (onChunk) {
      const stream = await openai.chat.completions.create({
        model: LLMModel.GPT_4O,
        messages: formattedMessages,
        max_tokens: 4096,
        stream: true,
      });

      let fullContent = '';
      let totalTokens = 0;

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullContent += text;
        if (text) onChunk(text, false, { model: LLMModel.GPT_4O, provider: LLMProvider.OPENAI });
        if (chunk.usage) totalTokens = chunk.usage.total_tokens;
      }

      onChunk('', true, { model: LLMModel.GPT_4O, provider: LLMProvider.OPENAI });
      const tokens = totalTokens || Math.ceil(fullContent.length / 4);
      return { content: fullContent, tokens };
    } else {
      const response = await openai.chat.completions.create({
        model: LLMModel.GPT_4O,
        messages: formattedMessages,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokens = response.usage?.total_tokens ?? Math.ceil(content.length / 4);
      return { content, tokens };
    }
  }

  /**
   * Appel au provider selon le modèle
   */
  private async callProvider(
    config: ModelConfig,
    messages: LLMMessage[],
    apiKey: string,
    onChunk?: StreamCallback,
  ): Promise<{ content: string; tokens: number }> {
    switch (config.provider) {
      case LLMProvider.GEMINI:
        return this.callGemini(messages, apiKey, onChunk);
      case LLMProvider.GROQ:
        return this.callGroq(messages, apiKey, onChunk);
      case LLMProvider.OPENAI:
        return this.callOpenAI(messages, apiKey, onChunk);
      default:
        throw new AppError(`Provider inconnu: ${config.provider}`, 500);
    }
  }

  /**
   * Point d'entrée principal — avec fallback automatique
   * RG11: fallback si erreur 429 (quota) et routage dynamique activé
   * RG12: pas de fallback pour les images si Gemini indisponible
   */
  async complete(options: LLMRequestOptions, onChunk?: StreamCallback): Promise<LLMResponse> {
    const { messages, userId, userApiKeys, dynamicRouting = true } = options;
    const hasImage = messages.some(m => m.imageBase64);

    // Déterminer le modèle de départ
    const startModel = options.modelId || LLMModel.GEMINI_2_FLASH;
    const startIndex = FALLBACK_CHAIN.indexOf(startModel);
    const modelsToTry = FALLBACK_CHAIN.slice(startIndex);

    let lastError: Error | null = null;
    let modelSwitched = false;
    let previousModel: LLMModel | undefined;

    for (const modelId of modelsToTry) {
      const config = MODEL_CONFIGS[modelId];

      // RG12: images uniquement avec Gemini
      if (hasImage && config.provider !== LLMProvider.GEMINI) {
        throw new AppError(
          'Le traitement d\'images n\'est disponible qu\'avec Gemini 2.0 Flash. Modèle momentanément indisponible.',
          503,
        );
      }

      // Vérifier les quotas
      const quotaOk = await quotaService.checkAndDecrement(userId, config.provider, userApiKeys);
      if (!quotaOk) {
        logger.warn(`Quota épuisé pour ${modelId} (user: ${userId})`);

        if (!dynamicRouting) {
          throw new AppError(
            `Quota épuisé pour ${config.displayName}. Activez le routage dynamique ou attendez le reset.`,
            429,
          );
        }

        // Essayer le modèle suivant
        if (modelsToTry.indexOf(modelId) < modelsToTry.length - 1) {
          previousModel = previousModel || modelId;
          modelSwitched = true;
          continue;
        } else {
          // RG13: tous les modèles épuisés
          throw new AppError(
            'Tous les modèles sont temporairement indisponibles. Veuillez réessayer dans quelques minutes.',
            503,
          );
        }
      }

      try {
        const apiKey = this.getApiKey(config.provider, userApiKeys);

        // Notifier le client si le modèle a changé (fallback)
        if (modelSwitched && onChunk) {
          onChunk('', false, {
            model: modelId,
            provider: config.provider,
            modelSwitched: true,
          });
        }

        logger.info(`Appel LLM: ${modelId} (user: ${userId})`);

        const result = await this.callProvider(config, messages, apiKey, onChunk);

        // Enregistrer l'utilisation
        await quotaService.recordUsage(userId, config.provider, modelId, result.tokens);

        return {
          content: result.content,
          model: modelId,
          provider: config.provider,
          tokensUsed: result.tokens,
          modelSwitched,
          previousModel,
        };

      } catch (error: unknown) {
        lastError = error as Error;
        logger.warn(`Erreur ${modelId}:`, error);

        // Si erreur quota (429) et routage dynamique: essayer suivant
        const isQuotaError = (error as NodeJS.ErrnoException)?.status === 429
          || (error as Error).message?.includes('429')
          || (error as Error).message?.includes('quota')
          || (error as Error).message?.includes('rate limit');

        if (isQuotaError && dynamicRouting) {
          // Marquer le quota comme épuisé
          await quotaService.markExhausted(config.provider);
          previousModel = previousModel || modelId;
          modelSwitched = true;
          continue;
        }

        // Autre erreur: ne pas fallback
        throw error;
      }
    }

    // RG13: tous épuisés
    throw lastError || new AppError(
      'Tous les modèles sont temporairement indisponibles. Veuillez réessayer dans quelques minutes.',
      503,
    );
  }

  /**
   * Génère automatiquement le titre d'une conversation
   * RG08: à partir des 5 premiers mots du premier message
   */
  generateTitle(firstMessage: string): string {
    const words = firstMessage.trim().split(/\s+/);
    const titleWords = words.slice(0, 5).join(' ');
    return titleWords.length > 50 ? titleWords.slice(0, 47) + '...' : titleWords;
  }
}

export const llmService = new LLMService();
