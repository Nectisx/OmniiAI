# ============================================================
# Backend OmniAI — Node 20
# Build depuis la racine du monorepo (pour avoir packages/types)
# Usage: docker build -f apps/backend/Dockerfile -t omniai-backend .
# ============================================================

# ── Stage 1 : Builder ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Outils nécessaires pour bcrypt
RUN apk add --no-cache python3 make g++

# 2. Manifests
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/backend/package*.json ./apps/backend/

# 3. Install workspaces (dev incluses car on a besoin de tsc)
RUN npm install --include=dev --workspaces=false || true
RUN npm install --include=dev

# 4. Sources
COPY packages/types ./packages/types
COPY apps/backend ./apps/backend
COPY tsconfig.json ./

# 5. Build types puis backend (+ génération Prisma)
RUN npm run build:types
RUN cd apps/backend && npx prisma generate && npm run build

# ── Stage 2 : Runtime production ────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl openssl

# Production deps + workspace types compilé
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/backend/package*.json ./apps/backend/

RUN npm install --omit=dev

# Artefacts compilés
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma

# Dossiers runtime
RUN mkdir -p /app/apps/backend/uploads /app/apps/backend/logs

WORKDIR /app/apps/backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -fsS http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
