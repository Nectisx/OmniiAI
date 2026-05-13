/**
 * Service de gestion des quotas API
 * RG14: RPM reset chaque minute, RPD reset à minuit UTC
 */
import { LLMProvider, LLMModel } from '@omniai/types';
import { prisma } from '../config/database';
import { MODEL_CONFIGS } from '../config/llm.config';
import { logger } from '../utils/logger';

// Map en mémoire pour les compteurs RPM (reset chaque minute)
const rpmCounters = new Map<string, { count: number; resetAt: number }>();

class QuotaService {

  /**
   * Vérifie si le quota est disponible et décrémente
   * Priorité: clé utilisateur > clé serveur (RG19/RG20)
   */
  async checkAndDecrement(
    userId: number,
    provider: LLMProvider,
    userApiKeys?: Partial<Record<LLMProvider, string>>,
  ): Promise<boolean> {
    const hasUserKey = !!userApiKeys?.[provider];

    if (hasUserKey) {
      // Clé personnelle: vérifier les quotas dans api_keys
      return this.checkUserQuota(userId, provider);
    } else {
      // Clé serveur: vérifier les quotas serveur
      return this.checkServerQuota(provider);
    }
  }

  /** Vérifie et décrémente les quotas de la clé utilisateur */
  private async checkUserQuota(userId: number, provider: LLMProvider): Promise<boolean> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!apiKey || !apiKey.isActive) return false;

    // Vérifier RPM (en mémoire)
    const rpmKey = `user:${userId}:${provider}:rpm`;
    if (!this.checkRPM(rpmKey, apiKey.rpmLimit)) return false;

    // Vérifier RPD
    if (apiKey.rpdRestant <= 0) return false;

    // Décrémenter RPD
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        rpdRestant: { decrement: 1 },
        rpmRestant: { decrement: 1 },
      },
    });

    return true;
  }

  /** Vérifie et décrémente les quotas serveur */
  private async checkServerQuota(provider: LLMProvider): Promise<boolean> {
    let quota = await prisma.quotaServeur.findUnique({
      where: { provider },
    });

    // Auto-création de la ligne quota si absente (1er run après db push)
    if (!quota) {
      const config = Object.values(MODEL_CONFIGS).find(c => c.provider === provider);
      if (!config) return false;

      try {
        quota = await prisma.quotaServeur.create({
          data: {
            modele: config.id,
            provider,
            rpmRestant: config.rpmLimit,
            rpdRestant: config.rpdLimit,
            tpmRestant: config.tpmLimit,
          },
        });
        logger.info(`✨ Quota serveur ${provider} créé automatiquement`);
      } catch (e) {
        // Race condition possible : un autre process l'a créé entre-temps
        quota = await prisma.quotaServeur.findUnique({ where: { provider } });
        if (!quota) {
          logger.error(`Impossible de créer le quota serveur ${provider}:`, e);
          return false;
        }
      }
    }

    // Vérifier RPM (en mémoire)
    const rpmKey = `server:${provider}:rpm`;
    const config = Object.values(MODEL_CONFIGS).find(c => c.provider === provider);
    const rpmLimit = config?.rpmLimit || 15;

    if (!this.checkRPM(rpmKey, rpmLimit)) return false;

    // Vérifier RPD
    if (quota.rpdRestant <= 0) return false;

    // Décrémenter
    await prisma.quotaServeur.update({
      where: { provider },
      data: { rpdRestant: { decrement: 1 } },
    });

    return true;
  }

  /**
   * Compteur RPM en mémoire — reset chaque minute
   */
  private checkRPM(key: string, limit: number): boolean {
    const now = Date.now();
    const counter = rpmCounters.get(key);

    if (!counter || now > counter.resetAt) {
      rpmCounters.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }

    if (counter.count >= limit) return false;

    counter.count++;
    return true;
  }

  /** Enregistre une utilisation dans les métriques */
  async recordUsage(
    userId: number,
    provider: LLMProvider,
    model: LLMModel,
    tokens: number,
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // findFirst + update/create (Prisma n'accepte pas de clé composite sans @@unique)
      const existing = await prisma.usageMetric.findFirst({
        where: { userId, provider, model, date: today },
      });

      if (existing) {
        await prisma.usageMetric.update({
          where: { id: existing.id },
          data: {
            tokens: { increment: tokens },
            requestCount: { increment: 1 },
          },
        });
      } else {
        await prisma.usageMetric.create({
          data: { userId, provider, model, tokens, requestCount: 1, date: today },
        });
      }

      // Mettre à jour les tokens consommés sur la clé API user si elle existe
      await prisma.apiKey.updateMany({
        where: { userId, provider },
        data: {
          tokensConsommes: { increment: tokens },
          tpmRestant: { decrement: tokens },
        },
      });

    } catch (error) {
      logger.error('Erreur enregistrement usage:', error);
      // Ne pas bloquer la réponse pour une erreur de métriques
    }
  }

  /** Marque un provider comme épuisé (suite à erreur 429) */
  async markExhausted(provider: LLMProvider): Promise<void> {
    await prisma.quotaServeur.updateMany({
      where: { provider },
      data: { rpdRestant: 0 },
    });
  }

  /** Retourne les quotas actuels pour un user */
  async getQuotas(userId: number): Promise<object[]> {
    const [serverQuotas, userKeys] = await Promise.all([
      prisma.quotaServeur.findMany(),
      prisma.apiKey.findMany({ where: { userId } }),
    ]);

    return Object.values(MODEL_CONFIGS).map(config => {
      const serverQuota = serverQuotas.find(q => q.provider === config.provider);
      const userKey = userKeys.find(k => k.provider === config.provider);

      const rpmKey = `server:${config.provider}:rpm`;
      const rpmCounter = rpmCounters.get(rpmKey);
      const rpmUsed = rpmCounter && Date.now() < rpmCounter.resetAt ? rpmCounter.count : 0;

      const source = userKey ? 'personal' : 'server';
      const quota = userKey || serverQuota;

      return {
        provider: config.provider,
        model: config.id,
        displayName: config.displayName,
        isMultimodal: config.isMultimodal,
        source,
        rpmLimit: config.rpmLimit,
        rpmRestant: Math.max(0, config.rpmLimit - rpmUsed),
        rpdLimit: config.rpdLimit,
        rpdRestant: quota?.rpdRestant ?? config.rpdLimit,
        tpmLimit: config.tpmLimit,
        tpmRestant: quota ? Math.max(0, config.tpmLimit - (userKey?.tokensConsommes ?? 0)) : config.tpmLimit,
        tokensConsommes: userKey?.tokensConsommes ?? 0,
        isActive: (quota?.rpdRestant ?? 1) > 0,
        lastReset: quota?.derniereMaj?.toISOString() ?? new Date().toISOString(),
      };
    });
  }
}

// ── Scheduler de reset des quotas ────────────────────────────

class QuotaResetScheduler {
  private rpmInterval: NodeJS.Timeout | null = null;
  private rpdInterval: NodeJS.Timeout | null = null;

  start() {
    // Reset RPM en mémoire toutes les minutes (déjà géré dans checkRPM)
    // On nettoie juste les anciennes entrées
    this.rpmInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, counter] of rpmCounters.entries()) {
        if (now > counter.resetAt) rpmCounters.delete(key);
      }
    }, 60_000);

    // Reset RPD à minuit UTC chaque jour
    this.scheduleRpdReset();

    logger.info('📅 Scheduler quotas démarré (RPM: 1min, RPD: minuit UTC)');
  }

  private scheduleRpdReset() {
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(async () => {
      await this.resetDailyQuotas();
      // Répéter chaque 24h
      this.rpdInterval = setInterval(() => this.resetDailyQuotas(), 24 * 60 * 60_000);
    }, msUntilMidnight);

    logger.info(`🕛 Reset RPD planifié dans ${Math.round(msUntilMidnight / 3600_000)}h`);
  }

  private async resetDailyQuotas() {
    logger.info('🔄 Reset quotas RPD (minuit UTC)...');
    try {
      const configs = Object.values(MODEL_CONFIGS);

      // Reset quotas serveur
      for (const config of configs) {
        await prisma.quotaServeur.updateMany({
          where: { provider: config.provider },
          data: {
            rpdRestant: config.rpdLimit,
            tpmRestant: config.tpmLimit,
            derniereMaj: new Date(),
          },
        });
      }

      // Reset quotas utilisateurs
      for (const config of configs) {
        await prisma.apiKey.updateMany({
          where: { provider: config.provider },
          data: {
            rpdRestant: config.rpdLimit,
            tpmRestant: config.tpmLimit,
            tokensConsommes: 0,
            derniereMaj: new Date(),
          },
        });
      }

      logger.info('✅ Reset quotas RPD terminé');
    } catch (error) {
      logger.error('❌ Erreur reset quotas:', error);
    }
  }

  stop() {
    if (this.rpmInterval) clearInterval(this.rpmInterval);
    if (this.rpdInterval) clearInterval(this.rpdInterval);
  }
}

export const quotaService = new QuotaService();
export const quotaResetScheduler = new QuotaResetScheduler();
