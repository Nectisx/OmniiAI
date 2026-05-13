/**
 * Service de gestion des paramètres utilisateur
 * Profil, clés API, notifications
 */
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';
import { MODEL_CONFIGS } from '../config/llm.config';
import { LLMProvider } from '@omniai/types';
import type { UpdateProfilePayload } from '@omniai/types';

export class SettingsService {

  /** Met à jour le profil utilisateur */
  async updateProfile(userId: number, payload: UpdateProfilePayload) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.prenom && { prenom: payload.prenom }),
        ...(payload.nom && { nom: payload.nom }),
        ...(payload.company !== undefined && { company: payload.company }),
        ...(payload.langue && { langue: payload.langue as 'FR' | 'EN' }),
        ...(payload.theme && { theme: payload.theme as 'DARK' | 'LIGHT' | 'SYSTEM' }),
        ...(payload.avatar !== undefined && { avatar: payload.avatar || null }),
      },
      select: {
        id: true, prenom: true, nom: true, email: true,
        avatar: true, company: true, langue: true,
        theme: true, createdAt: true,
      },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /** Enregistre ou met à jour une clé API utilisateur (chiffrée) */
  async upsertApiKey(userId: number, provider: LLMProvider, plainKey: string) {
    const config = Object.values(MODEL_CONFIGS).find(c => c.provider === provider);
    if (!config) throw new AppError('Provider inconnu', 400);

    const cleChiffree = encryptApiKey(plainKey);

    await prisma.apiKey.upsert({
      where: { userId_provider: { userId, provider } },
      update: {
        cleChiffree,
        isActive: true,
        derniereMaj: new Date(),
      },
      create: {
        userId,
        modele: config.id,
        provider,
        cleChiffree,
        rpmLimit: config.rpmLimit,
        rpmRestant: config.rpmLimit,
        rpdLimit: config.rpdLimit,
        rpdRestant: config.rpdLimit,
        tpmLimit: config.tpmLimit,
        tpmRestant: config.tpmLimit,
        isMultimodal: config.isMultimodal,
      },
    });
  }

  /** Supprime une clé API utilisateur */
  async deleteApiKey(userId: number, provider: LLMProvider) {
    await prisma.apiKey.deleteMany({
      where: { userId, provider },
    });
  }

  /** Récupère les clés API déchiffrées de l'utilisateur (pour les appels LLM) */
  async getUserApiKeys(userId: number): Promise<Partial<Record<LLMProvider, string>>> {
    const keys = await prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: { provider: true, cleChiffree: true },
    });

    const result: Partial<Record<LLMProvider, string>> = {};
    for (const key of keys) {
      try {
        result[key.provider as LLMProvider] = decryptApiKey(key.cleChiffree);
      } catch {
        // Clé corrompue: ignorer
      }
    }

    return result;
  }

  /** Récupère les paramètres complets de l'utilisateur */
  async getSettings(userId: number) {
    const [user, notifications, apiKeys] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, prenom: true, nom: true, email: true,
          avatar: true, company: true, langue: true,
          theme: true, createdAt: true,
        },
      }),
      prisma.notificationSetting.findUnique({
        where: { userId },
      }),
      prisma.apiKey.findMany({
        where: { userId },
        select: { provider: true, isActive: true },
      }),
    ]);

    if (!user) throw new AppError('Utilisateur introuvable', 404);

    return {
      profile: { ...user, createdAt: user.createdAt.toISOString() },
      notifications: {
        quotaAlerts: notifications?.quotaAlerts ?? true,
        weeklyReport: notifications?.weeklyReport ?? true,
        emailAlerts: notifications?.emailAlerts ?? false,
      },
      apiKeys: {
        gemini: apiKeys.some(k => k.provider === LLMProvider.GEMINI && k.isActive),
        mistral: apiKeys.some(k => k.provider === LLMProvider.MISTRAL && k.isActive),
        openai: apiKeys.some(k => k.provider === LLMProvider.OPENAI && k.isActive),
      },
    };
  }

  /** Met à jour les préférences de notification */
  async updateNotifications(userId: number, settings: {
    quotaAlerts?: boolean;
    weeklyReport?: boolean;
    emailAlerts?: boolean;
  }) {
    await prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, ...settings },
      update: settings,
    });
  }
}

export const settingsService = new SettingsService();
