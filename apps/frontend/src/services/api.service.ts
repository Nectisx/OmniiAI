/**
 * Services API OmniAI
 * Toutes les fonctions d'appel API vers le backend
 */
import apiClient from './api.client';
import type {
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  Conversation,
  Message,
  QuotaStatus,
  DashboardData,
  AppSettings,
  UpdateProfilePayload,
  UploadResponse,
} from '@omniai/types';
import { LLMProvider } from '@omniai/types';

// ── Auth ──────────────────────────────────────────────────────

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', payload);
    return res.data.data;
  },

  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

// ── Conversations ─────────────────────────────────────────────

export const conversationApi = {
  list: async (page = 1, limit = 30): Promise<{ conversations: Conversation[]; total: number; hasMore: boolean }> => {
    const res = await apiClient.get('/conversations', { params: { page, limit } });
    return res.data;
  },

  getOne: async (id: number): Promise<{ conversation: Conversation; messages: Message[] }> => {
    const res = await apiClient.get(`/conversations/${id}`);
    return res.data.data;
  },

  create: async (titre?: string): Promise<Conversation> => {
    const res = await apiClient.post('/conversations', { titre });
    return res.data.data;
  },

  rename: async (id: number, titre: string): Promise<void> => {
    await apiClient.patch(`/conversations/${id}`, { titre });
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`);
  },
};

// ── Chat (streaming SSE) ──────────────────────────────────────

export interface ChatStreamOptions {
  conversationId?: number;
  contenu: string;
  modelId?: string;
  dynamicRouting?: boolean;
  fileBase64?: string;
  fileName?: string;
  fileType?: string;
  onChunk: (chunk: string) => void;
  onModelSwitch: (model: string, provider: string) => void;
  onConversationCreated: (id: number, titre: string) => void;
  onDone: (meta: { messageId: number; tokens: number; model: string; modelSwitched?: boolean }) => void;
  onError: (error: string) => void;
}

export const chatApi = {
  /**
   * Envoi d'un message avec streaming SSE
   * Utilise fetch directement pour supporter les Server-Sent Events
   */
  sendStream: async (options: ChatStreamOptions): Promise<void> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const { useAuthStore } = await import('@/stores/auth.store');
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(`${API_URL}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: options.conversationId,
        contenu: options.contenu,
        modelId: options.modelId,
        dynamicRouting: options.dynamicRouting ?? true,
        fileBase64: options.fileBase64,
        fileName: options.fileName,
        fileType: options.fileType,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      options.onError(err.error || 'Erreur interne');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      options.onError('Stream non supporté');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case 'chunk':
                if (event.content) options.onChunk(event.content);
                break;
              case 'model_switch':
                options.onModelSwitch(event.model, event.provider);
                break;
              case 'conversation_created':
                options.onConversationCreated(event.conversationId, event.titre);
                break;
              case 'done':
                options.onDone({
                  messageId: event.messageId,
                  tokens: event.tokens,
                  model: event.model,
                  modelSwitched: event.modelSwitched,
                });
                break;
              case 'error':
                options.onError(event.error);
                break;
            }
          } catch {
            // JSON mal formé: ignorer
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

// ── Quotas ────────────────────────────────────────────────────

export const quotaApi = {
  getQuotas: async (): Promise<QuotaStatus[]> => {
    const res = await apiClient.get('/quotas');
    return res.data.data;
  },

  getModels: async () => {
    const res = await apiClient.get('/models');
    return res.data.data;
  },
};

// ── Dashboard ─────────────────────────────────────────────────

export const dashboardApi = {
  getData: async (): Promise<DashboardData> => {
    const res = await apiClient.get('/dashboard');
    return res.data.data;
  },
};

// ── Settings ──────────────────────────────────────────────────

export const settingsApi = {
  getSettings: async (): Promise<AppSettings> => {
    const res = await apiClient.get('/settings');
    return res.data.data;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const res = await apiClient.patch('/settings/profile', payload);
    return res.data.data;
  },

  upsertApiKey: async (provider: LLMProvider, cle: string) => {
    const res = await apiClient.post('/settings/api-keys', { provider, cle });
    return res.data;
  },

  deleteApiKey: async (provider: LLMProvider) => {
    const res = await apiClient.delete(`/settings/api-keys/${provider}`);
    return res.data;
  },

  updateNotifications: async (settings: {
    quotaAlerts?: boolean;
    weeklyReport?: boolean;
    emailAlerts?: boolean;
  }) => {
    const res = await apiClient.patch('/settings/notifications', settings);
    return res.data;
  },
};

// ── Upload ────────────────────────────────────────────────────

export const uploadApi = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    return res.data.data;
  },
};
