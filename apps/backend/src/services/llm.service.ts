/**
 * Couche d'abstraction LLM — OmniAI
 * Gère les 3 providers avec fallback automatique
 * Gemini 2.0 Flash → Llama 3.3 70B (Groq) → GPT-4o (GitHub Models)
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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

function getMistralClient(apiKey: string) {
  // Mistral expose une API compatible OpenAI
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.mistral.ai/v1',
  });
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
      [LLMProvider.MISTRAL]: process.env.MISTRAL_API_KEY,
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
    if (!apiKey || !apiKey.startsWith('AIza')) {
      throw new AppError(
        `Clé Gemini invalide (format attendu: AIzaSy...). Reçue: ${apiKey ? apiKey.slice(0, 6) + '...' : 'vide'}`,
        401,
      );
    }
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
      // Gemini 2.0 attend un objet Content pour systemInstruction
      systemInstruction: systemMsg?.content
        ? { role: 'system', parts: [{ text: systemMsg.content }] }
        : undefined,
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
   * Appel à Mistral Small via l'API Mistral (compatible OpenAI)
   */
  private async callMistral(
    messages: LLMMessage[],
    apiKey: string,
    onChunk?: StreamCallback,
  ): Promise<{ content: string; tokens: number }> {
    const mistral = getMistralClient(apiKey);

    const formattedMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    if (onChunk) {
      const stream = await mistral.chat.completions.create({
        model: LLMModel.MISTRAL_SMALL,
        messages: formattedMessages,
        max_tokens: 8192,
        stream: true,
      });

      let fullContent = '';
      let totalTokens = 0;

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullContent += text;
        if (text) onChunk(text, false, { model: LLMModel.MISTRAL_SMALL, provider: LLMProvider.MISTRAL });
        if (chunk.usage) totalTokens = chunk.usage.total_tokens;
      }

      onChunk('', true, { model: LLMModel.MISTRAL_SMALL, provider: LLMProvider.MISTRAL });
      const tokens = totalTokens || Math.ceil(fullContent.length / 4);
      return { content: fullContent, tokens };
    } else {
      const response = await mistral.chat.completions.create({
        model: LLMModel.MISTRAL_SMALL,
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
      case LLMProvider.MISTRAL:
        return this.callMistral(messages, apiKey, onChunk);
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
        const errMsg = (error as Error).message || '';
        const errStatus = (error as any)?.status
          ?? (error as any)?.statusCode
          ?? (error as any)?.response?.status;
        const errLower = errMsg.toLowerCase();
        logger.warn(`Erreur ${modelId}: ${errMsg}`);

        // Erreur quota (429) → fallback
        const isQuotaError = errStatus === 429
          || errMsg.includes('429')
          || errLower.includes('quota')
          || errLower.includes('rate limit')
          || errLower.includes('rate_limit')
          || errLower.includes('resource has been exhausted');

        // Erreur clé invalide (401/403)
        const isAuthError = errStatus === 401 || errStatus === 403
          || errLower.includes('unauthorized')
          || errLower.includes('invalid api key')
          || errLower.includes('api key not valid')
          || errLower.includes('api_key_invalid')
          || errLower.includes('permission_denied')
          || errLower.includes('forbidden');

        if (isQuotaError && dynamicRouting) {
          await quotaService.markExhausted(config.provider);
          previousModel = previousModel || modelId;
          modelSwitched = true;
          continue;
        }

        // Clé invalide → message explicite (pas de fallback automatique,
        // car si l'user utilise sa clé perso il veut savoir qu'elle est invalide)
        if (isAuthError) {
          const usingUserKey = !!userApiKeys?.[config.provider];
          throw new AppError(
            usingUserKey
              ? `Votre clé API personnelle pour ${config.displayName} est invalide ou expirée. Vérifiez-la dans Paramètres > Clés API.`
              : `La clé API serveur pour ${config.displayName} est invalide. Contactez l'administrateur ou utilisez votre propre clé.`,
            401,
          );
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
