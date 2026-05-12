/**
 * Prisma Seed — Données initiales OmniAI
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger le .env depuis la racine du projet ET depuis apps/backend
config({ path: resolve(__dirname, '../../../.env') });
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient, LLMProvider } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const serverQuotas = [
    {
      modele: 'gemini-2.0-flash',
      provider: LLMProvider.gemini,
      rpmRestant: 15,
      rpdRestant: 1500,
      tpmRestant: 1000000,
    },
    {
      modele: 'llama-3.3-70b-versatile',
      provider: LLMProvider.groq,
      rpmRestant: 30,
      rpdRestant: 1000,
      tpmRestant: 500000,
    },
    {
      modele: 'gpt-4o',
      provider: LLMProvider.openai,
      rpmRestant: 10,
      rpdRestant: 50,
      tpmRestant: 300000,
    },
  ];

  for (const quota of serverQuotas) {
    await prisma.quotaServeur.upsert({
      where: { provider: quota.provider },
      update: {},
      create: quota,
    });
    console.log(`  ✅ Quota serveur ${quota.provider} créé`);
  }

  console.log('✨ Seeding terminé!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
