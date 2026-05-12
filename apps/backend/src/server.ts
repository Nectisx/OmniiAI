/**
 * OmniAI Backend — Point d'entrée du serveur Express
 * Architecture: MVC + Services + Repositories
 */
import { config } from 'dotenv';
import { resolve } from 'path';
// Charge le .env depuis la racine du monorepo ET depuis apps/backend/
config({ path: resolve(__dirname, '../../../.env') });
config({ path: resolve(__dirname, '../.env') });

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { quotaResetScheduler } from './services/quota.service';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// ── Vérification des variables d'env critiques ───────────────
function checkRequiredEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
    logger.error('   Vérifiez votre fichier .env');
    process.exit(1);
  }

  const recommended = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'GITHUB_TOKEN'];
  const missingApi = recommended.filter((k) => !process.env[k]);
  if (missingApi.length > 0) {
    logger.warn(`⚠️  Clés API manquantes : ${missingApi.join(', ')}`);
    logger.warn('   Les utilisateurs devront fournir leurs propres clés.');
  }
}

// ── Démarrage du serveur ──────────────────────────────────────
async function startServer() {
  try {
    checkRequiredEnv();

    // Test de connexion BDD
    await prisma.$connect();
    logger.info('✅ Connexion base de données établie');

    // Démarrage des schedulers (reset quotas)
    quotaResetScheduler.start();
    logger.info('✅ Scheduler quotas démarré');

    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Serveur OmniAI démarré sur http://${HOST}:${PORT}`);
      logger.info(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
}

// ── Gestion arrêt propre ──────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`${signal} reçu — arrêt propre...`);
  try {
    quotaResetScheduler.stop();
    await prisma.$disconnect();
  } catch (e) {
    logger.error('Erreur lors de l\'arrêt:', e);
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Gestion erreurs non catchées ──────────────────────────────
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();
