'use client';

import { motion } from 'framer-motion';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { useChatStore } from '@/stores/chat.store';
import { useQuotas } from '@/hooks/useQuotas';
import { cn, getModelDisplayName, formatTokens } from '@/lib/utils';
import { LLMModel, LLMProvider } from '@omniai/types';

interface SessionInfoPanelProps {
  sessionTokens: number;
  sessionMessages: number;
}

const PROVIDER_COLORS: Record<LLMProvider, string> = {
  [LLMProvider.GEMINI]: '#1a73e8',
  [LLMProvider.GROQ]: '#7B4FD4',
  [LLMProvider.OPENAI]: '#10a37f',
};

export function SessionInfoPanel({ sessionTokens, sessionMessages }: SessionInfoPanelProps) {
  const { selectedModel, dynamicRouting, setDynamicRouting } = useChatStore();
  const { quotas, getQuotaPercentage, getQuotaStatus, refetch } = useQuotas();

  return (
    <div
      className="w-[260px] flex-shrink-0 border-l border-[var(--border)] flex flex-col overflow-y-auto"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="p-4 space-y-4">

        {/* Session Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-wider">
              Session Info
            </span>
          </div>
          <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-[var(--text3)]">Modèle actif</span>
              <span className="text-[var(--cyan)] font-medium text-[11px] truncate max-w-[120px]">
                {getModelDisplayName(selectedModel)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-[var(--text3)]">Tokens session</span>
              <span className="text-[var(--text)] font-medium">{formatTokens(sessionTokens)}</span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-[var(--text3)]">Messages</span>
              <span className="text-[var(--text)] font-medium">{sessionMessages}</span>
            </div>

            {/* Dynamic routing toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-[12px] text-[var(--text2)]">Routage dynamique</span>
              <button
                onClick={() => setDynamicRouting(!dynamicRouting)}
                className={cn(
                  'w-9 h-5 rounded-full transition-colors relative flex-shrink-0',
                  dynamicRouting ? 'bg-[var(--cyan)]' : 'bg-[var(--border)]',
                )}
              >
                <motion.div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                  animate={{ left: dynamicRouting ? '1.1rem' : '0.125rem' }}
                  transition={{ duration: 0.15 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Model Quotas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-wider">
              Quotas API
            </span>
            <button
              onClick={() => refetch()}
              className="text-[var(--text3)] hover:text-[var(--text)] transition-colors"
              title="Actualiser"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="space-y-2">
            {quotas.map((quota, i) => {
              const pct = getQuotaPercentage(quota);
              const status = getQuotaStatus(quota);
              const isActive = quota.model === selectedModel;
              const providerColor = PROVIDER_COLORS[quota.provider] || 'var(--cyan)';

              const barColor = {
                ok: 'bg-green-500',
                warn: 'bg-yellow-500',
                danger: 'bg-red-500',
                exhausted: 'bg-red-500',
              }[status];

              const dotColor = {
                ok: 'bg-green-500',
                warn: 'bg-yellow-500',
                danger: 'bg-red-500',
                exhausted: 'bg-red-500',
              }[status];

              return (
                <div
                  key={quota.provider}
                  className={cn(
                    'bg-[var(--bg3)] border rounded-xl p-3 transition-colors',
                    isActive ? 'border-[var(--cyan)]/40' : 'border-[var(--border)]',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
                      <span className="text-[12px] font-medium text-[var(--text)]">
                        {quota.model.split('-')[0].charAt(0).toUpperCase() + quota.model.split('-')[0].slice(1)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-semibold',
                        isActive
                          ? 'bg-[rgba(0,180,204,0.15)] text-[var(--cyan)] border border-[rgba(0,180,204,0.3)]'
                          : 'bg-[var(--bg4)] text-[var(--text3)] border border-[var(--border)]',
                      )}
                    >
                      {isActive ? 'Actif' : 'Fallback'}
                    </span>
                  </div>

                  {/* RPM */}
                  <div className="flex justify-between text-[11px] text-[var(--text2)] mb-1">
                    <span>RPM</span>
                    <span>{quota.rpmRestant} / {quota.rpmLimit}</span>
                  </div>
                  <div className="h-[3px] bg-[var(--border)] rounded-full overflow-hidden mb-2">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', barColor)}
                      style={{ width: `${Math.round((quota.rpmRestant / quota.rpmLimit) * 100)}%` }}
                    />
                  </div>

                  {/* RPD */}
                  <div className="flex justify-between text-[11px] text-[var(--text2)] mb-1">
                    <span>RPD</span>
                    <span>{quota.rpdRestant} / {quota.rpdLimit}</span>
                  </div>
                  <div className="h-[3px] bg-[var(--border)] rounded-full overflow-hidden mb-2">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', barColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* TPM restant */}
                  <div className="flex justify-between text-[11px] text-[var(--text3)]">
                    <span>TPM restant</span>
                    <span className="text-[var(--text2)]">{formatTokens(quota.tpmRestant)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
