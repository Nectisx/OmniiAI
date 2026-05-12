#!/usr/bin/env bash
# ============================================================
# OmniAI — Script d'installation Linux / Mac
# Usage: bash scripts/setup.sh
# ============================================================
set -e

echo "🚀 OmniAI — Installation"
echo "========================"

# 1. Vérifs prérequis
command -v node >/dev/null 2>&1 || { echo "❌ Node.js requis (>=18). Installez sur https://nodejs.org"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "❌ npm requis"; exit 1; }

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ requis (vous avez v$NODE_VERSION)"
  exit 1
fi
echo "✅ Node $(node -v)"

# 2. Création des .env s'ils n'existent pas
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env créé — pensez à le remplir"
fi
if [ ! -f apps/backend/.env ]; then
  cp .env.example apps/backend/.env
  echo "✅ apps/backend/.env créé"
fi
if [ ! -f apps/frontend/.env.local ]; then
  cp apps/frontend/.env.local.example apps/frontend/.env.local
  echo "✅ apps/frontend/.env.local créé"
fi

# 3. Installation des dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

# 4. Compilation du package types
echo ""
echo "🔨 Build de @omniai/types..."
npm run build:types

# 5. Prisma
echo ""
echo "🗄️  Génération du client Prisma..."
npm run prisma:generate

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Prochaines étapes :"
echo "  1. Éditez .env et apps/backend/.env avec vos clés API"
echo "  2. npm run prisma:migrate     # crée les tables"
echo "  3. npm run prisma:seed        # quotas serveur initiaux"
echo "  4. npm run dev                # démarre frontend + backend"
echo ""
echo "Frontend → http://localhost:3000"
echo "Backend  → http://localhost:3001/api/health"
