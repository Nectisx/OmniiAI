/**
 * Store Zustand — Chat
 * Gère les conversations, messages, streaming et état du modèle sélectionné
 */
import { create } from 'zustand';
import type { Conversation, Message } from '@omniai/types';
import { LLMModel } from '@omniai/types';

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  base64?: string;
  extractedText?: string;
  isImage: boolean;
  serverFileName?: string;
}

interface StreamingState {
  isStreaming: boolean;
  streamContent: string;
  streamModel: LLMModel | null;
  modelSwitched: boolean;
  previousModel: LLMModel | null;
}

interface ChatState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Message[];
  isLoadingMessages: boolean;

  // Modèle sélectionné
  selectedModel: LLMModel;
  dynamicRouting: boolean;

  // Streaming
  streaming: StreamingState;

  // Upload
  attachedFiles: AttachedFile[];

  // UI
  sidebarOpen: boolean;
  infoPanelOpen: boolean;

  // Actions — Conversations
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: number, data: Partial<Conversation>) => void;
  removeConversation: (id: number) => void;
  setActiveConversation: (id: number | null) => void;

  // Actions — Messages
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoadingMessages: (loading: boolean) => void;

  // Actions — Modèle
  setSelectedModel: (model: LLMModel) => void;
  setDynamicRouting: (enabled: boolean) => void;

  // Actions — Streaming
  startStreaming: (model: LLMModel) => void;
  appendStreamChunk: (chunk: string) => void;
  setStreamModelSwitch: (model: LLMModel, previous: LLMModel) => void;
  stopStreaming: () => void;

  // Actions — Fichiers
  addAttachedFile: (file: AttachedFile) => void;
  removeAttachedFile: (index: number) => void;
  clearAttachedFiles: () => void;

  // Actions — UI
  setSidebarOpen: (open: boolean) => void;
  setInfoPanelOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingMessages: false,

  selectedModel: LLMModel.GEMINI_2_FLASH,
  dynamicRouting: true,

  streaming: {
    isStreaming: false,
    streamContent: '',
    streamModel: null,
    modelSwitched: false,
    previousModel: null,
  },

  attachedFiles: [],
  sidebarOpen: true,
  infoPanelOpen: true,

  // ── Conversations ────────────────────────────────────────
  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, data) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
      messages: state.activeConversationId === id ? [] : state.messages,
    })),

  setActiveConversation: (id) =>
    set({ activeConversationId: id, messages: [] }),

  // ── Messages ─────────────────────────────────────────────
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  // ── Modèle ───────────────────────────────────────────────
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setDynamicRouting: (dynamicRouting) => set({ dynamicRouting }),

  // ── Streaming ────────────────────────────────────────────
  startStreaming: (model) =>
    set({
      streaming: {
        isStreaming: true,
        streamContent: '',
        streamModel: model,
        modelSwitched: false,
        previousModel: null,
      },
    }),

  appendStreamChunk: (chunk) =>
    set((state) => ({
      streaming: {
        ...state.streaming,
        streamContent: state.streaming.streamContent + chunk,
      },
    })),

  setStreamModelSwitch: (model, previous) =>
    set((state) => ({
      streaming: {
        ...state.streaming,
        streamModel: model,
        modelSwitched: true,
        previousModel: previous,
      },
    })),

  stopStreaming: () =>
    set((state) => ({
      streaming: {
        ...state.streaming,
        isStreaming: false,
      },
    })),

  // ── Fichiers ─────────────────────────────────────────────
  addAttachedFile: (file) =>
    set((state) => ({ attachedFiles: [...state.attachedFiles, file] })),

  removeAttachedFile: (index) =>
    set((state) => ({
      attachedFiles: state.attachedFiles.filter((_, i) => i !== index),
    })),

  clearAttachedFiles: () => set({ attachedFiles: [] }),

  // ── UI ───────────────────────────────────────────────────
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setInfoPanelOpen: (infoPanelOpen) => set({ infoPanelOpen }),
}));
