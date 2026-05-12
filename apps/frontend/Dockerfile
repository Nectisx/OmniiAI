# ============================================================
# Frontend OmniAI — Next.js 14 (standalone output)
# Build depuis la racine du monorepo
# Usage: docker build -f apps/frontend/Dockerfile -t omniai-frontend .
# ============================================================

# ── Stage 1 : Builder ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 1. Manifests
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/frontend/package*.json ./apps/frontend/

# 2. Install (dev incluses pour le build Next)
RUN npm install --include=dev

# 3. Sources
COPY packages/types ./packages/types
COPY apps/frontend ./apps/frontend
COPY tsconfig.json ./

# 4. Build types puis frontend
RUN npm run build:types
RUN cd apps/frontend && npm run build

# ── Stage 2 : Runtime production (standalone) ───────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone embarque déjà ses node_modules
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
