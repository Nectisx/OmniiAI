/**
 * Service Dashboard — KPIs et métriques d'usage
 */
import { prisma } from '../config/database';
import { LLMProvider } from '@omniai/types';
import type { DashboardData, DashboardKPIs, DailyUsage } from '@omniai/types';
import { quotaService } from './quota.service';

export class DashboardService {

  async getDashboardData(userId: number): Promise<DashboardData> {
    const [kpis, dailyUsage, quotaStatus, recentConversations] = await Promise.all([
      this.getKPIs(userId),
      this.getDailyUsage(userId, 7),
      quotaService.getQuotas(userId),
      this.getRecentConversations(userId),
    ]);

    return {
      kpis,
      dailyUsage,
      quotaStatus: quotaStatus as DashboardData['quotaStatus'],
      recentConversations,
    };
  }

  private async getKPIs(userId: number): Promise<DashboardKPIs> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3600_000);

    // Métriques semaine actuelle
    const [currentWeek, previousWeek, conversationCount, conversationPrevious] = await Promise.all([
      prisma.usageMetric.aggregate({
        where: { userId, date: { gte: weekAgo } },
        _sum: { requestCount: true, tokens: true },
      }),
      prisma.usageMetric.aggregate({
        where: { userId, date: { gte: twoWeeksAgo, lt: weekAgo } },
        _sum: { requestCount: true, tokens: true },
      }),
      prisma.conversation.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.conversation.count({ where: { userId, createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    ]);

    const currentRequests = currentWeek._sum.requestCount ?? 0;
    const previousRequests = previousWeek._sum.requestCount ?? 0;
    const currentTokens = currentWeek._sum.tokens ?? 0;
    const previousTokens = previousWeek._sum.tokens ?? 0;

    const delta = (cur: number, prev: number) =>
      prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

    // Compter les modèles actifs (qui ont été utilisés)
    const activeProviders = await prisma.usageMetric.findMany({
      where: { userId, date: { gte: weekAgo } },
      distinct: ['provider'],
      select: { provider: true },
    });

    return {
      totalRequests: currentRequests,
      totalTokens: currentTokens,
      activeModels: activeProviders.length || 3, // Par défaut 3 si pas encore utilisé
      totalConversations: conversationCount,
      requestsDelta: delta(currentRequests, previousRequests),
      tokensDelta: delta(currentTokens, previousTokens),
      conversationsDelta: conversationCount - conversationPrevious,
    };
  }

  private async getDailyUsage(userId: number, days: number): Promise<DailyUsage[]> {
    const result: DailyUsage[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date.getTime() + 24 * 3600_000);

      const metrics = await prisma.usageMetric.findMany({
        where: { userId, date: { gte: date, lt: nextDate } },
        select: { provider: true, requestCount: true },
      });

      const byProvider = {
        [LLMProvider.GEMINI]: 0,
        [LLMProvider.MISTRAL]: 0,
        [LLMProvider.OPENAI]: 0,
      };

      metrics.forEach(m => {
        byProvider[m.provider] = (byProvider[m.provider] || 0) + m.requestCount;
      });

      result.push({
        date: date.toISOString().split('T')[0],
        gemini: byProvider[LLMProvider.GEMINI],
        mistral: byProvider[LLMProvider.MISTRAL],
        openai: byProvider[LLMProvider.OPENAI],
        total: byProvider[LLMProvider.GEMINI] + byProvider[LLMProvider.MISTRAL] + byProvider[LLMProvider.OPENAI],
      });
    }

    return result;
  }

  private async getRecentConversations(userId: number) {
    const convs = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { tokensConsommes: true, modeleUtilise: true },
        },
      },
    });

    return convs.map(c => ({
      id: c.id,
      userId: c.userId,
      titre: c.titre,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messageCount: c._count.messages,
      lastTokens: c.messages[0]?.tokensConsommes ?? 0,
      lastModel: c.messages[0]?.modeleUtilise ?? null,
    }));
  }
}

export const dashboardService = new DashboardService();
