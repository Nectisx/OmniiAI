# OmniAI — Démarrage rapide

> Pour les détails complets, voir [SETUP.md](./SETUP.md).

## TL;DR — Local

```bash
# 1. Créer les .env
cp .env.example .env
cp .env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local

# 2. Éditer .env et apps/backend/.env avec :
#    - DATABASE_URL (TiDB Cloud)
#    - GEMINI_API_KEY, GROQ_API_KEY, GITHUB_TOKEN
#    - JWT_SECRET, JWT_REFRESH_SECRET

# 3. Installer + builder les types partagés
npm install
npm run build:types

# 4. Préparer la base
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Lancer
npm run dev
```

→ Frontend sur http://localhost:3000

## TL;DR — Render

1. `git push` sur GitHub (avec les migrations Prisma commit)
2. Render → New → Blueprint → connecter le repo
3. Configurer les variables `sync: false` dans le dashboard Render
4. ✅ Render build et déploie automatiquement

## Comptes test

Après `npm run prisma:seed`, inscrivez-vous sur http://localhost:3000/auth/register
(mot de passe : 8 chars + 1 majuscule + 1 chiffre, ex: `Password123`)

## Vérifications

| URL | Réponse attendue |
|---|---|
| http://localhost:3001/api/health | `{"success":true,"status":"healthy"}` |
| http://localhost:3000 | Redirige vers /auth/login |
| http://localhost:5000/health (optionnel) | `{"success":true,"service":"OmniAI Python Service"}` |

## En cas de problème

| Erreur | Solution |
|---|---|
| `Cannot find module '@omniai/types'` | `npm run build:types` |
| `DATABASE_URL not found` | Copier `.env` dans `apps/backend/.env` |
| `Identifiants incorrects` | Pas de compte — inscrivez-vous d'abord |
| Port 3000 occupé | `cd apps/frontend && npx next dev -p 3001` |

Voir [SETUP.md](./SETUP.md) pour le guide complet.
