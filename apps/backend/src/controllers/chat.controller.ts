/**
 * Controller Chat — Streaming SSE
 * Gère l'envoi de messages avec streaming temps réel
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { llmService, LLMMessage } from '../services/llm.service';
import { conversationService } from '../services/conversation.service';
import { settingsService } from '../services/settings.service';
import { MessageRole, LLMModel } from '@omniai/types';
import { logger } from '../utils/logger';

export const chatController = {

  /**
   * POST /api/chat/send — Envoi d'un message avec streaming SSE
   * Le client reçoit les chunks en temps réel via Server-Sent Events
   */
  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {
      conversationId: existingConvId,
      contenu,
      modelId,
      dynamicRouting = true,
      fileBase64,
      fileName,
      fileType,
    } = req.body;

    // Configurer SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Récupérer les clés API personnelles de l'utilisateur (RG19)
      const userApiKeys = await settingsService.getUserApiKeys(userId);

      // Créer ou récupérer la conversation
      let conversationId = existingConvId;
      let isNewConversation = false;

      if (!conversationId) {
        // RG08: titre auto à partir des 5 premiers mots
        const titre = llmService.generateTitle(contenu);
        const conv = await conversationService.create(userId, titre);
        conversationId = conv.id;
        isNewConversation = true;

        sendEvent({
          type: 'conversation_created',
          conversationId,
          titre: conv.titre,
        });
      }

      // Sauvegarder le message utilisateur
      await conversationService.addMessage(
        conversationId,
        'user',
        contenu,
        undefined,
        0,
        fileName,
      );

      // Récupérer le contexte de la conversation (historique)
      const context = await conversationService.getContext(conversationId);

      // Construire les messages pour le LLM
      const messages: LLMMessage[] = [
        // System prompt
        {
          role: MessageRole.SYSTEM,
          content: 'Tu es OmniAI, un assistant IA professionnel et bienveillant. Tu réponds de façon précise, structurée et utile. Tu peux coder, analyser, rédiger et résoudre des problèmes complexes.',
        },
        // Historique de la conversation
        ...context.map(m => ({
          role: m.role === 'user' ? MessageRole.USER : MessageRole.ASSISTANT,
          content: m.content,
        })),
        // Message actuel (avec fichier si présent)
        {
          role: MessageRole.USER,
          content: contenu,
          ...(fileBase64 && fileType?.startsWith('image/') && {
            imageBase64: fileBase64,
            imageMimeType: fileType,
          }),
        },
      ];

      // Appel LLM avec streaming
      let finalContent = '';
      let finalModel = modelId || LLMModel.GEMINI_2_FLASH;
      let tokensUsed = 0;

      const result = await llmService.complete(
        {
          messages,
          modelId: modelId as LLMModel | undefined,
          dynamicRouting,
          userId,
          userApiKeys,
          stream: true,
        },
        (chunk, done, meta) => {
          if (meta?.modelSwitched) {
            // Notifier le client du changement de modèle (fallback)
            sendEvent({
              type: 'model_switch',
              model: meta.model,
              provider: meta.provider,
            });
            finalModel = meta.model;
          }

          if (!done && chunk) {
            finalContent += chunk;
            sendEvent({ type: 'chunk', content: chunk });
          }
        },
      );

      finalContent = result.content;
      finalModel = result.model;
      tokensUsed = result.tokensUsed;

      // Sauvegarder la réponse du modèle
      const savedMessage = await conversationService.addMessage(
        conversationId,
        'assistant',
        finalContent,
        finalModel,
        tokensUsed,
      );

      // Envoyer l'événement de fin avec métadonnées
      sendEvent({
        type: 'done',
        messageId: savedMessage.id,
        conversationId,
        model: finalModel,
        provider: result.provider,
        tokens: tokensUsed,
        modelSwitched: result.modelSwitched,
        previousModel: result.previousModel,
      });

    } catch (error: unknown) {
      logger.error('Erreur chat streaming:', error);
      sendEvent({
        type: 'error',
        error: (error as Error).message || 'Erreur interne',
      });
    } finally {
      res.end();
    }
  }),

  /**
   * POST /api/chat/send-sync — Version synchrone (sans streaming)
   * Utilisé pour les clients qui ne supportent pas SSE
   */
  sendMessageSync: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId: existingConvId, contenu, modelId, dynamicRouting = true, fileBase64, fileName, fileType } = req.body;

    const userApiKeys = await settingsService.getUserApiKeys(userId);

    let conversationId = existingConvId;
    if (!conversationId) {
      const titre = llmService.generateTitle(contenu);
      const conv = await conversationService.create(userId, titre);
      conversationId = conv.id;
    }

    await conversationService.addMessage(conversationId, 'user', contenu, undefined, 0, fileName);
    const context = await conversationService.getContext(conversationId);

    const messages: LLMMessage[] = [
      { role: MessageRole.SYSTEM, content: 'Tu es OmniAI, un assistant IA professionnel.' },
      ...context.map(m => ({
        role: m.role === 'user' ? MessageRole.USER : MessageRole.ASSISTANT,
        content: m.content,
      })),
      {
        role: MessageRole.USER,
        content: contenu,
        ...(fileBase64 && fileType?.startsWith('image/') && {
          imageBase64: fileBase64,
          imageMimeType: fileType,
        }),
      },
    ];

    const result = await llmService.complete({ messages, modelId: modelId as LLMModel | undefined, dynamicRouting, userId, userApiKeys });
    const savedMsg = await conversationService.addMessage(conversationId, 'assistant', result.content, result.model, result.tokensUsed);

    res.json({
      success: true,
      data: {
        message: savedMsg,
        conversationId,
        model: result.model,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
        modelSwitched: result.modelSwitched,
      },
    });
  }),
};
