/**
 * Configuration des modèles LLM
 * Quotas gratuits selon les fournisseurs
 */
import { LLMModel, LLMProvider } from '@omniai/types';

export interface ModelConfig {
  id: LLMModel;
  provider: LLMProvider;
  displayName: string;
  rpmLimit: number;
  rpdLimit: number;
  tpmLimit: number;
  isMultimodal: boolean;        // Supporte les images
  maxTokensOutput: number;
  contextWindow: number;
  fallbackOrder: number;        // 1 = principal, 2 = secondaire, 3 = dernier recours
}

export const MODEL_CONFIGS: Record<LLMModel, ModelConfig> = {
  [LLMModel.GEMINI_2_FLASH]: {
    id: LLMModel.GEMINI_2_FLASH,
    provider: LLMProvider.GEMINI,
    displayName: 'Gemini 2.0 Flash',
    rpmLimit: Number(process.env.GEMINI_RPM_LIMIT) || 15,
    rpdLimit: Number(process.env.GEMINI_RPD_LIMIT) || 1500,
    tpmLimit: Number(process.env.GEMINI_TPM_LIMIT) || 1_000_000,
    isMultimodal: true,
    maxTokensOutput: 8192,
    contextWindow: 1_000_000,
    fallbackOrder: 1,
  },
  [LLMModel.LLAMA_3_3_70B]: {
    id: LLMModel.LLAMA_3_3_70B,
    provider: LLMProvider.GROQ,
    displayName: 'Llama 3.3 70B',
    rpmLimit: Number(process.env.GROQ_RPM_LIMIT) || 30,
    rpdLimit: Number(process.env.GROQ_RPD_LIMIT) || 1000,
    tpmLimit: Number(process.env.GROQ_TPM_LIMIT) || 500_000,
    isMultimodal: false,
    maxTokensOutput: 8192,
    contextWindow: 128_000,
    fallbackOrder: 2,
  },
  [LLMModel.GPT_4O]: {
    id: LLMModel.GPT_4O,
    provider: LLMProvider.OPENAI,
    displayName: 'GPT-4o',
    rpmLimit: Number(process.env.GPT4O_RPM_LIMIT) || 10,
    rpdLimit: Number(process.env.GPT4O_RPD_LIMIT) || 50,
    tpmLimit: Number(process.env.GPT4O_TPM_LIMIT) || 300_000,
    isMultimodal: false,         // GPT-4o supporte les images mais on restreint selon RG12
    maxTokensOutput: 4096,
    contextWindow: 128_000,
    fallbackOrder: 3,
  },
};

// Ordre de fallback: Gemini → Llama → GPT-4o
export const FALLBACK_CHAIN: LLMModel[] = [
  LLMModel.GEMINI_2_FLASH,
  LLMModel.LLAMA_3_3_70B,
  LLMModel.GPT_4O,
];

// Limite extraction texte (environ 20 pages = 50k chars)
export const MAX_FILE_TEXT_CHARS = 50_000;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
export const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg'];
