# ============================================================
# Backend OmniAI — Node 20
# Build depuis la racine du monorepo (pour avoir packages/types)
# Usage: docker build -f apps/backend/Dockerfile -t omniai-backend .
# ============================================================

# ── Stage 1 : Builder ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Outils nécessaires pour bcrypt et Prisma
RUN apk add --no-cache python3 make g++ openssl

# Manifests
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/backend/package*.json ./apps/backend/

# Install workspaces avec dev deps
RUN npm install --include=dev

# Sources
COPY packages/types ./packages/types
COPY apps/backend ./apps/backend
COPY tsconfig.json ./

# Build types puis backend (+ génération Prisma)
RUN npm run build:types
RUN cd apps/backend && npx prisma generate && npm run build

# ── Stage 2 : Runtime production ────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl openssl

# On garde les dev deps (Prisma CLI est nécessaire pour db push au start)
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/backend/package*.json ./apps/backend/

RUN npm install --include=dev

# Artefacts compilés
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/tsconfig.json ./apps/backend/tsconfig.json

# Dossiers runtime
RUN mkdir -p /app/apps/backend/uploads /app/apps/backend/logs

WORKDIR /app/apps/backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -fsS http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/server.js"]
