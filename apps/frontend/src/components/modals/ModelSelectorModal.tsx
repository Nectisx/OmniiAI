'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { LLMModel, LLMProvider } from '@omniai/types';
import { useChatStore } from '@/stores/chat.store';
import { useQuotas } from '@/hooks/useQuotas';
import { cn, getModelDisplayName, formatTokens } from '@/lib/utils';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODEL_META: Record<LLMModel, {
  icon: string;
  provider: string;
  providerColor: string;
  badge: string;
  badgeColor: string;
  desc: string;
}> = {
  [LLMModel.GEMINI_2_FLASH]: {
    icon: 'G',
    provider: 'Google AI Studio',
    providerColor: '#1a73e8',
    badge: 'Principal',
    badgeColor: 'bg-blue-500/15 text-blue-400',
    desc: '15 RPM · 1 500 RPD · 1M TPM. Multimodal (images, PDF). Offre gratuite.',
  },
  [LLMModel.LLAMA_3_3_70B]: {
    icon: 'L',
    provider: 'Groq',
    providerColor: '#7B4FD4',
    badge: 'Ultra-rapide',
    badgeColor: 'bg-violet-500/15 text-violet-400',
    desc: '30 RPM · 1 000 RPD. Ultra-rapide. Offre gratuite permanente.',
  },
  [LLMModel.GPT_4O]: {
    icon: 'G',
    provider: 'GitHub Models',
    providerColor: '#10a37f',
    badge: 'Fallback',
    badgeColor: 'bg-green-500/15 text-green-400',
    desc: '10-15 RPM · 50 RPD. Compte GitHub suffit. Offre gratuite.',
  },
};

export function ModelSelectorModal({ isOpen, onClose }: ModelSelectorModalProps) {
  const { selectedModel, setSelectedModel, dynamicRouting, setDynamicRouting } = useChatStore();
  const { quotas, getQuotaPercentage, getQuotaStatus, isModelAvailable } = useQuotas();
  const [pending, setPending] = useState<LLMModel>(selectedModel);

  const handleConfirm = () => {
    setSelectedModel(pending);
    onClose();
  };

  const models = Object.values(LLMModel);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-[400px] rounded-2xl border border-[var(--border2)] p-5 shadow-2xl"
            style={{ background: 'var(--bg2)' }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">Choisir votre modèle IA</h2>
                <p className="text-xs text-[var(--text3)] mt-0.5">
                  Sélectionnez le modèle pour cette conversation
                </p>
              </div>
              <button onClick={onClose} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Models */}
            <div className="space-y-2 mb-4">
              {models.map((model) => {
                const meta = MODEL_META[model];
                const quota = quotas.find((q) => q.model === model);
                const available = isModelAvailable(model);
                const pct = quota ? getQuotaPercentage(quota) : 100;
                const status = quota ? getQuotaStatus(quota) : 'ok';
                const isSelected = pending === model;

                const statusColor = {
                  ok: 'bg-green-500',
                  warn: 'bg-yellow-500',
                  danger: 'bg-red-500',
                  exhausted: 'bg-red-500',
                }[status];

                return (
                  <button
                    key={model}
                    onClick={() => available && setPending(model)}
                    disabled={!available}
                    className={cn(
                      'w-full text-left rounded-xl border p-3 transition-all relative',
                      isSelected
                        ? 'border-[var(--cyan)] bg-[rgba(0,180,204,0.07)]'
                        : 'border-[var(--border)] bg-[var(--bg3)]',
                      !available && 'opacity-40 cursor-not-allowed',
                      available && !isSelected && 'hover:border-[var(--border2)]',
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-[var(--cyan)]">
                        <Check size={15} />
                      </div>
                    )}

                    {/* Model header */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: meta.providerColor }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-[var(--text)]">
                            {getModelDisplayName(model)}
                          </span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', meta.badgeColor)}>
                            {meta.badge}
                          </span>
                          {!available && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-500/15 text-red-400">
                              Quota épuisé
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text3)]">{meta.provider}</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text2)] mb-2 leading-relaxed">{meta.desc}</p>

                    {/* Quota bar */}
                    {quota && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', statusColor)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text3)] shrink-0">
                          RPD: {quota.rpdRestant}/{quota.rpdLimit}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic routing toggle */}
            <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
              <div>
                <div className="text-[13px] text-[var(--text)]">Routage dynamique</div>
                <div className="text-[11px] text-[var(--text3)]">
                  Bascule auto si quota dépassé (Gemini → Llama → GPT-4o)
                </div>
              </div>
              <button
                onClick={() => setDynamicRouting(!dynamicRouting)}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative flex-shrink-0',
                  dynamicRouting ? 'bg-[var(--cyan)]' : 'bg-[var(--border)]',
                )}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  animate={{ left: dynamicRouting ? '1.25rem' : '0.25rem' }}
                  transition={{ duration: 0.15 }}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-[var(--border)] text-[var(--text2)] text-sm hover:border-[var(--border2)] hover:text-[var(--text)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-2 rounded-lg bg-[var(--cyan)] text-[#0a1520] text-sm font-semibold hover:bg-[var(--cyan2)] transition-colors"
              >
                Confirmer la sélection
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
