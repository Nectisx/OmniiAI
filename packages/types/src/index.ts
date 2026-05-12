// ============================================================
// @omniai/types — Types partagés frontend / backend
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export enum Language {
  FR = 'FR',
  EN = 'EN',
}

export enum Theme {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  SYSTEM = 'SYSTEM',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum LLMProvider {
  GEMINI = 'gemini',
  GROQ = 'groq',
  OPENAI = 'openai',
}

export enum LLMModel {
  GEMINI_2_FLASH = 'gemini-2.0-flash',
  LLAMA_3_3_70B = 'llama-3.3-70b-versatile',
  GPT_4O = 'gpt-4o',
}

// ── User ─────────────────────────────────────────────────────

export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  avatar?: string | null;
  company?: string | null;
  langue: Language;
  theme: Theme;
  createdAt: Date;
}

export interface UserPublic extends Omit<User, 'createdAt'> {
  createdAt: string;
}

export interface RegisterPayload {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  company?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfilePayload {
  prenom?: string;
  nom?: string;
  company?: string;
  langue?: Language;
  theme?: Theme;
  avatar?: string;
}

// ── Conversation ─────────────────────────────────────────────

export interface Conversation {
  id: number;
  userId: number;
  titre: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

export interface CreateConversationPayload {
  titre?: string;
}

// ── Message ──────────────────────────────────────────────────

export interface Message {
  id: number;
  conversationId: number;
  role: MessageRole;
  contenu: string;
  modeleUtilise?: string | null;
  fichierJoint?: string | null;
  tokensConsommes: number;
  createdAt: string;
}

export interface SendMessagePayload {
  conversationId?: number;     // Si null, crée une nouvelle conv
  contenu: string;
  modelId?: LLMModel;
  dynamicRouting?: boolean;
  fileBase64?: string;
  fileName?: string;
  fileType?: string;
}

export interface StreamChunk {
  type: 'chunk' | 'done' | 'error' | 'model_switch';
  content?: string;
  model?: string;
  provider?: string;
  tokens?: number;
  conversationId?: number;
  messageId?: number;
  error?: string;
}

// ── API Keys ─────────────────────────────────────────────────

export interface ApiKey {
  id: number;
  userId: number;
  modele: string;
  provider: LLMProvider;
  rpmLimit: number;
  rpmRestant: number;
  rpdLimit: number;
  rpdRestant: number;
  tpmLimit: number;
  tpmRestant: number;
  tokensConsommes: number;
  isActive: boolean;
  isMultimodal: boolean;
  derniereMaj: string;
  createdAt: string;
}

export interface UpsertApiKeyPayload {
  provider: LLMProvider;
  cle: string;
}

export interface QuotaStatus {
  provider: LLMProvider;
  model: LLMModel;
  rpmLimit: number;
  rpmRestant: number;
  rpdLimit: number;
  rpdRestant: number;
  tpmLimit: number;
  tpmRestant: number;
  tokensConsommes: number;
  isActive: boolean;
  isMultimodal: boolean;
  lastReset: string;
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardKPIs {
  totalRequests: number;
  totalTokens: number;
  activeModels: number;
  totalConversations: number;
  requestsDelta: number;    // % vs semaine précédente
  tokensDelta: number;
  conversationsDelta: number;
}

export interface DailyUsage {
  date: string;
  gemini: number;
  groq: number;
  openai: number;
  total: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  dailyUsage: DailyUsage[];
  quotaStatus: QuotaStatus[];
  recentConversations: Conversation[];
}

// ── Upload ───────────────────────────────────────────────────

export interface UploadResponse {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  extractedText?: string;     // PDF / DOCX / TXT
  isImage: boolean;
  base64?: string;            // Pour envoi direct à Gemini
}

// ── Usage Metrics ─────────────────────────────────────────────

export interface UsageMetric {
  id: number;
  userId: number;
  provider: LLMProvider;
  model: string;
  tokens: number;
  requestCount: number;
  date: string;
}

// ── API Response wrapper ──────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ── Settings ─────────────────────────────────────────────────

export interface NotificationSettings {
  quotaAlerts: boolean;
  weeklyReport: boolean;
  emailAlerts: boolean;
}

export interface AppSettings {
  profile: UserPublic;
  notifications: NotificationSettings;
  apiKeys: {
    gemini: boolean;    // Indique si une clé est configurée (pas la clé elle-même)
    groq: boolean;
    openai: boolean;
  };
}
