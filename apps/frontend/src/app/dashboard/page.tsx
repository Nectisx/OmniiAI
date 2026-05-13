'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Cpu, Activity, RefreshCw } from 'lucide-react';
import { dashboardApi } from '@/services/api.service';
import { cn, formatTokens, formatRelativeTime, getModelDisplayName } from '@/lib/utils';
import { LLMProvider } from '@omniai/types';
import { useT } from '@/lib/i18n';

const PROVIDER_COLORS: Record<string, string> = {
  [LLMProvider.GEMINI]: '#1a73e8',
  [LLMProvider.GROQ]: '#7B4FD4',
  [LLMProvider.OPENAI]: '#10a37f',
};

const DAY_LABELS: Record<string, string> = {
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu', Fri: 'Ven', Sat: 'Sam', Sun: 'Dim',
};

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[d.getDay()];
}

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg4)] border border-[var(--border2)] rounded-xl p-3 shadow-xl text-[12px]">
      <p className="font-semibold text-[var(--text)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text2)] capitalize">{p.name}</span>
          <span className="text-[var(--text)] font-medium ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const t = useT();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-omni flex items-center justify-center text-white font-bold animate-pulse">O</div>
          <div className="flex gap-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const chartData = data?.dailyUsage?.map(d => ({
    name: getDayLabel(d.date),
    Gemini: d.gemini,
    Llama: d.groq,
    'GPT-4o': d.openai,
  })) || [];

  const kpiCards = [
    {
      label: t('dashboard.totalRequests'),
      value: kpis?.totalRequests?.toLocaleString() || '0',
      delta: kpis?.requestsDelta || 0,
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: t('dashboard.tokensUsed'),
      value: formatTokens(kpis?.totalTokens || 0),
      delta: kpis?.tokensDelta || 0,
      icon: Cpu,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: t('dashboard.activeModels'),
      value: (kpis?.activeModels || 3).toString(),
      delta: 0,
      icon: Cpu,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      subtitle: 'Gemini / Llama / GPT-4o',
    },
    {
      label: t('dashboard.conversations'),
      value: (kpis?.totalConversations || 0).toString(),
      delta: kpis?.conversationsDelta || 0,
      icon: MessageSquare,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">{t('dashboard.title')}</h1>
          <p className="text-[13px] text-[var(--text2)] mt-0.5">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] text-[var(--text2)] border border-[var(--border)] hover:border-[var(--border2)] hover:text-[var(--text)] transition-colors"
        >
          <RefreshCw size={13} className={cn(isFetching && 'animate-spin')} />
          {t('dashboard.refresh')}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-[var(--text3)] uppercase tracking-wider font-semibold">
                {kpi.label}
              </span>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', kpi.bg)}>
                <kpi.icon size={13} className={kpi.color} />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--text)] mb-1.5">{kpi.value}</div>
            {kpi.subtitle ? (
              <div className="text-[11px] text-[var(--text3)]">{kpi.subtitle}</div>
            ) : (
              <div className={cn('flex items-center gap-1 text-[11px]', kpi.delta >= 0 ? 'text-green-400' : 'text-red-400')}>
                {kpi.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {kpi.delta >= 0 ? '+' : ''}{kpi.delta}% {t('dashboard.vsLastWeek')}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <motion.div
        className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 mb-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] font-semibold text-[var(--text)]">
            {t('dashboard.dailyRequests')}
          </h2>
          <div className="flex items-center gap-4">
            {[
              { label: 'Gemini', color: '#1a73e8' },
              { label: 'Llama', color: '#7B4FD4' },
              { label: 'GPT-4o', color: '#10a37f' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-[var(--text2)]">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={10} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="Gemini" fill="#1a73e8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Llama" fill="#7B4FD4" radius={[3, 3, 0, 0]} />
            <Bar dataKey="GPT-4o" fill="#10a37f" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom grid: Quota Status + Recent Conversations */}
      <div className="grid grid-cols-2 gap-5">
        {/* Quota Status */}
        <motion.div
          className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
        >
          <h2 className="text-[13px] font-semibold text-[var(--text)] mb-4">{t('dashboard.quotaStatus')}</h2>
          <div className="space-y-4">
            {data?.quotaStatus?.map((quota: any) => {
              const rpdPct = Math.round((quota.rpdRestant / quota.rpdLimit) * 100);
              const rpmPct = Math.round((quota.rpmRestant / quota.rpmLimit) * 100);
              const color = rpdPct > 50 ? '#22c55e' : rpdPct > 20 ? '#f59e0b' : '#ef4444';
              const statusLabel = quota.isActive ? t('dashboard.active') : t('dashboard.limited');

              return (
                <div key={quota.provider}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-[13px] font-medium text-[var(--text)]">
                        {getModelDisplayName(quota.model)}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${color}20`, color }}>
                      {statusLabel}
                    </span>
                  </div>
                  {/* RPM */}
                  <div className="flex justify-between text-[11px] text-[var(--text3)] mb-1">
                    <span>RPM</span>
                    <span>{quota.rpmRestant}/{quota.rpmLimit}</span>
                  </div>
                  <div className="h-[3px] bg-[var(--border)] rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${rpmPct}%`, background: color, transition: 'width 0.5s' }} />
                  </div>
                  {/* TPM */}
                  <div className="flex justify-between text-[11px] text-[var(--text3)] mb-1">
                    <span>TPM restant</span>
                    <span>{formatTokens(quota.tpmRestant)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Conversations */}
        <motion.div
          className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <h2 className="text-[13px] font-semibold text-[var(--text)] mb-4">{t('dashboard.recentConv')}</h2>
          <div className="space-y-2">
            {data?.recentConversations?.map((conv: any) => (
              <div
                key={conv.id}
                className="flex items-start justify-between p-2.5 rounded-xl hover:bg-[var(--bg4)] transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-[13px] font-medium text-[var(--text)] truncate">{conv.titre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {conv.lastModel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,180,204,0.1)] text-[var(--cyan)] font-medium">
                        {getModelDisplayName(conv.lastModel)}
                      </span>
                    )}
                    {conv.lastTokens > 0 && (
                      <span className="text-[11px] text-[var(--text3)]">
                        {formatTokens(conv.lastTokens)} tokens
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-[var(--text3)] flex-shrink-0 mt-0.5">
                  {formatRelativeTime(conv.updatedAt)}
                </span>
              </div>
            ))}
            {(!data?.recentConversations || data.recentConversations.length === 0) && (
              <p className="text-[13px] text-[var(--text3)] text-center py-6">
                {t('dashboard.noConv')}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
