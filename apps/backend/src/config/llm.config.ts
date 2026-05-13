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
  [LLMModel.MISTRAL_SMALL]: {
    id: LLMModel.MISTRAL_SMALL,
    provider: LLMProvider.MISTRAL,
    displayName: 'Mistral Small',
    rpmLimit: Number(process.env.MISTRAL_RPM_LIMIT) || 60,
    rpdLimit: Number(process.env.MISTRAL_RPD_LIMIT) || 1000,
    tpmLimit: Number(process.env.MISTRAL_TPM_LIMIT) || 500_000,
    isMultimodal: false,
    maxTokensOutput: 8192,
    contextWindow: 32_000,
    fallbackOrder: 2,
  },
  [LLMModel.GPT_4O]: {
    id: LLMModel.GPT_4O,
    provider: LLMProvider.OPENAI,
    displayName: 'GPT-4o',
    rpmLimit: Number(process.env.GPT4O_RPM_LIMIT) || 10,
    rpdLimit: Number(process.env.GPT4O_RPD_LIMIT) || 50,
    tpmLimit: Number(process.env.GPT4O_TPM_LIMIT) || 300_000,
    isMultimodal: false,
    maxTokensOutput: 4096,
    contextWindow: 128_000,
    fallbackOrder: 3,
  },
};

// Ordre de fallback : Gemini → Mistral → GPT-4o
export const FALLBACK_CHAIN: LLMModel[] = [
  LLMModel.GEMINI_2_FLASH,
  LLMModel.MISTRAL_SMALL,
  LLMModel.GPT_4O,
];

export const MAX_FILE_TEXT_CHARS = 50_000;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
];
