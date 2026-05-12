/**
 * Hook useQuotas — quotas en temps réel avec polling
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { quotaApi } from '@/services/api.service';
import type { QuotaStatus } from '@omniai/types';
import { LLMProvider, LLMModel } from '@omniai/types';

export function useQuotas() {
  const { data: quotas = [], isLoading, refetch } = useQuery({
    queryKey: ['quotas'],
    queryFn: quotaApi.getQuotas,
    refetchInterval: 30_000, // Polling toutes les 30s
    staleTime: 15_000,
  });

  const getQuotaForProvider = (provider: LLMProvider): QuotaStatus | undefined =>
    quotas.find((q) => q.provider === provider);

  const getQuotaForModel = (model: LLMModel): QuotaStatus | undefined =>
    quotas.find((q) => q.model === model);

  const isModelAvailable = (model: LLMModel): boolean => {
    const quota = getQuotaForModel(model);
    return quota ? quota.rpdRestant > 0 : true;
  };

  const getQuotaPercentage = (quota: QuotaStatus): number => {
    if (quota.rpdLimit === 0) return 0;
    return Math.round((quota.rpdRestant / quota.rpdLimit) * 100);
  };

  const getQuotaStatus = (quota: QuotaStatus): 'ok' | 'warn' | 'danger' | 'exhausted' => {
    const pct = getQuotaPercentage(quota);
    if (pct === 0) return 'exhausted';
    if (pct > 50) return 'ok';
    if (pct > 20) return 'warn';
    return 'danger';
  };

  return {
    quotas,
    isLoading,
    refetch,
    getQuotaForProvider,
    getQuotaForModel,
    isModelAvailable,
    getQuotaPercentage,
    getQuotaStatus,
  };
}
