/**
 * Nettoie les lignes en BDD utilisant l'ancien provider 'groq'
 * Doit tourner AVANT `prisma db push` quand on change l'enum.
 * Utilise du SQL brut pour contourner la validation Prisma.
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    // 1. quotas_serveur
    try {
      const r = await prisma.$executeRawUnsafe(
        "DELETE FROM quotas_serveur WHERE provider = 'groq'",
      );
      console.log(`  ✓ quotas_serveur cleaned: ${r} row(s)`);
    } catch (e) {
      console.warn(`  ⚠ quotas_serveur skipped:`, e.message);
    }

    // 2. api_keys
    try {
      const r = await prisma.$executeRawUnsafe(
        "DELETE FROM api_keys WHERE provider = 'groq'",
      );
      console.log(`  ✓ api_keys cleaned: ${r} row(s)`);
    } catch (e) {
      console.warn(`  ⚠ api_keys skipped:`, e.message);
    }

    // 3. usage_metrics
    try {
      const r = await prisma.$executeRawUnsafe(
        "DELETE FROM usage_metrics WHERE provider = 'groq'",
      );
      console.log(`  ✓ usage_metrics cleaned: ${r} row(s)`);
    } catch (e) {
      console.warn(`  ⚠ usage_metrics skipped:`, e.message);
    }

    console.log('✅ Cleanup terminé');
  } catch (e) {
    console.warn('⚠ Cleanup global échoué (premier deploy ?):', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
