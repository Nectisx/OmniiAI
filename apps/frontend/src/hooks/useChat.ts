/**
 * Hook useChat — gestion du chat et du streaming
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/stores/chat.store';
import { chatApi, conversationApi } from '@/services/api.service';
import { LLMModel } from '@omniai/types';
import type { Message } from '@omniai/types';

export function useChat() {
  const queryClient = useQueryClient();
  const {
    activeConversationId,
    messages,
    selectedModel,
    dynamicRouting,
    streaming,
    attachedFiles,
    setMessages,
    addMessage,
    setActiveConversation,
    addConversation,
    updateConversation,
    startStreaming,
    appendStreamChunk,
    setStreamModelSwitch,
    stopStreaming,
    clearAttachedFiles,
    setSelectedModel,
  } = useChatStore();

  const [sessionTokens, setSessionTokens] = useState(0);
  const [sessionMessages, setSessionMessages] = useState(0);
  const abortRef = useRef<boolean>(false);

  // ── Charger les messages d'une conversation ──────────────
  const { isLoading: isLoadingMessages } = useQuery({
    queryKey: ['conversation', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return null;
      const data = await conversationApi.getOne(activeConversationId);
      setMessages(data.messages);
      return data;
    },
    enabled: !!activeConversationId,
  });

  // ── Envoyer un message ────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() && attachedFiles.length === 0) return;
    if (streaming.isStreaming) return;

    abortRef.current = false;

    // Construire le message utilisateur optimiste
    const userMessage: Message = {
      id: Date.now(),
      conversationId: activeConversationId || 0,
      role: 'user' as const,
      contenu: content,
      tokensConsommes: 0,
      createdAt: new Date().toISOString(),
      fichierJoint: attachedFiles[0]?.name || null,
    };

    addMessage(userMessage);
    setSessionMessages(prev => prev + 1);

    // Préparer les données du fichier si présent
    const file = attachedFiles[0];
    const fileData = file ? {
      fileBase64: file.base64,
      fileName: file.name,
      fileType: file.type,
    } : {};

    // Si fichier avec texte extrait: l'ajouter au contenu
    let fullContent = content;
    if (file?.extractedText) {
      fullContent = `${content}\n\n[Contenu du fichier "${file.name}"]:\n${file.extractedText}`;
    }

    clearAttachedFiles();
    startStreaming(selectedModel);

    // Accumuler le contenu streamé pour créer le message final
    let streamedContent = '';
    let finalMeta: { messageId: number; tokens: number; model: string } | null = null;

    try {
      await chatApi.sendStream({
        conversationId: activeConversationId || undefined,
        contenu: fullContent,
        modelId: selectedModel,
        dynamicRouting,
        ...fileData,

        onChunk: (chunk) => {
          if (abortRef.current) return;
          streamedContent += chunk;
          appendStreamChunk(chunk);
        },

        onModelSwitch: (model, _provider) => {
          const prev = useChatStore.getState().streaming.streamModel || selectedModel;
          setStreamModelSwitch(model as LLMModel, prev);
          // Bascule réelle du modèle sélectionné pour que l'UI reflète le fallback
          setSelectedModel(model as LLMModel);
        },

        onConversationCreated: (id, titre) => {
          const newConv = {
            id,
            userId: 0,
            titre,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addConversation(newConv);
          setActiveConversation(id);
          // Mettre à jour l'ID du message utilisateur
          userMessage.conversationId = id;
        },

        onDone: (meta) => {
          finalMeta = meta;
          // Synchronise le sélecteur sur le modèle réellement utilisé
          if (meta.model && meta.model !== selectedModel) {
            setSelectedModel(meta.model as LLMModel);
          }
        },

        onError: (error) => {
          stopStreaming();
          addMessage({
            id: Date.now(),
            conversationId: activeConversationId || 0,
            role: 'assistant' as const,
            contenu: `❌ Erreur: ${error}`,
            tokensConsommes: 0,
            createdAt: new Date().toISOString(),
          });
        },
      });

      // Ajouter le message assistant final
      if (streamedContent && finalMeta) {
        const assistantMessage: Message = {
          id: finalMeta.messageId,
          conversationId: activeConversationId || 0,
          role: 'assistant' as const,
          contenu: streamedContent,
          modeleUtilise: finalMeta.model,
          tokensConsommes: finalMeta.tokens,
          createdAt: new Date().toISOString(),
        };

        addMessage(assistantMessage);
        setSessionTokens(prev => prev + finalMeta!.tokens);
        setSessionMessages(prev => prev + 1);

        // Actualiser la liste des conversations
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['quotas'] });
      }

    } finally {
      stopStreaming();
    }
  }, [
    activeConversationId, selectedModel, dynamicRouting,
    attachedFiles, streaming.isStreaming,
    addMessage, addConversation, setActiveConversation,
    startStreaming, appendStreamChunk, setStreamModelSwitch,
    stopStreaming, clearAttachedFiles, queryClient,
    setSelectedModel,
  ]);

  // ── Supprimer une conversation ────────────────────────────
  const deleteConversationMutation = useMutation({
    mutationFn: conversationApi.delete,
    onSuccess: (_, id) => {
      useChatStore.getState().removeConversation(id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // ── Renommer une conversation ─────────────────────────────
  const renameConversationMutation = useMutation({
    mutationFn: ({ id, titre }: { id: number; titre: string }) =>
      conversationApi.rename(id, titre),
    onSuccess: (_, { id, titre }) => {
      updateConversation(id, { titre });
    },
  });

  return {
    messages,
    isLoadingMessages,
    streaming,
    sessionTokens,
    sessionMessages,
    sendMessage,
    deleteConversation: deleteConversationMutation.mutate,
    renameConversation: renameConversationMutation.mutate,
  };
}
