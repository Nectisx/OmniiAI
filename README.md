# OmniAI — LLM Entreprise Hub

<div align="center">

  **Centralisez vos modèles IA. Gemini 2.0 Flash · Mistral Small · GPT-4o**

  [![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org)
  [![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?logo=prisma)](https://prisma.io)
  [![TiDB](https://img.shields.io/badge/TiDB_Cloud-Serverless-orange)](https://tidbcloud.com)
  [![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

  [Démo live](https://omniai-frontend.onrender.com) · [SETUP](./SETUP.md) · [QuickStart](./QUICKSTART.md)
</div>

---

## Présentation

**OmniAI** est une plateforme web d'entreprise qui centralise l'accès à plusieurs modèles de langage (LLM) depuis une interface unique. Elle gère automatiquement les quotas des APIs gratuites, effectue un **fallback automatique** entre les modèles, persiste les conversations en base de données, et fournit un tableau de bord de monitoring en temps réel.

### Problème résolu

| Problème | Solution OmniAI |
|---|---|
| Éparpillement des outils IA | Interface unique multi-modèles |
| Blocage par les quotas API | Fallback automatique Gemini → Mistral → GPT-4o |
| Perte de l'historique | Persistance MySQL complète |
| Absence de visibilité | Dashboard monitoring temps réel |

---

## Architecture

```
omniai/
├── apps/
│   ├── backend/          # Node.js + Express + Prisma
│   │   ├── src/
│   │   │   ├── controllers/    # MVC
│   │   │   ├── services/       # Logique métier (LLM, quotas, auth, conversations)
│   │   │   ├── middleware/     # Auth JWT, validation Zod, erreurs
│   │   │   ├── routes/         # API REST
│   │   │   ├── config/         # BDD, config LLM
│   │   │   └── utils/          # JWT, logger Winston, chiffrement AES-256
│   │   ├── scripts/            # Maintenance BDD (cleanup enum)
│   │   └── prisma/             # Schéma + seed
│   │
│   ├── frontend/         # Next.js 14 + TypeScript + Tailwind
│   │   └── src/
│   │       ├── app/            # Pages (App Router)
│   │       ├── components/     # Composants React (chat, modals, layout)
│   │       ├── hooks/          # useAuth, useChat, useQuotas, useToast
│   │       ├── stores/         # Zustand (auth, chat)
│   │       ├── services/       # Clients API
│   │       └── lib/            # i18n (FR/EN), utils, theme
│   │
│   └── python-service/   # Flask microservice (fallback PDF/STT)
│
└── packages/
    └── types/            # Types TypeScript partagés (compilé en JS)
```

### Flux de données

```
Client (Next.js) ──HTTP/SSE──► Backend (Express)
                                  │ Auth JWT
                                  │ Quota check + auto-create
                                  ▼
                            LLM Service (abstraction)
                                  ├── Gemini 2.0 Flash    (Google AI Studio)
                                  ├── Mistral Small       (Mistral La Plateforme)
                                  └── GPT-4o              (GitHub Models)

Backend ──Prisma──► TiDB Cloud (MySQL)
                       ├── users, conversations, messages
                       ├── api_keys (clés chiffrées AES-256)
                       ├── quotas_serveur, usage_metrics
                       └── notification_settings
```

---

## Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind | SSR, performance, type-safety |
| **UI** | Framer Motion, Lucide, Recharts | Animations, icônes, dashboards |
| **State** | Zustand + React Query | État global persistant + cache serveur |
| **i18n** | Dict FR/EN custom (hook `useT`) | Bascule live FR/EN, full coverage |
| **Theme** | CSS variables + classe `.dark/.light` | Dark/Light/System dynamique |
| **Backend** | Node.js 20, Express 4, TypeScript | Async natif, cohérence JS |
| **ORM** | Prisma 5 + MySQL/TiDB Cloud | Type-safe, migrations via `db push` |
| **Auth** | JWT (access 15min + refresh 7j) + bcrypt | Sécurité standard |
| **Crypto** | AES-256-CBC (clés API perso) | Clés jamais stockées en clair |
| **Validation** | Zod (body, params) | Validation stricte runtime + types |
| **Logger** | Winston (console + fichiers) | Logs structurés |
| **Extraction** | `pdf-parse`, `mammoth` (Node natif) | Pas de dépendance externe pour PDF/DOCX |
| **STT** | Web Speech API (navigateur) | Pas de serveur audio nécessaire |
| **Python** | Flask + PyMuPDF (fallback) | Backup pour formats exotiques |
| **LLM 1** | Gemini 2.0 Flash | 15 RPM · 1500 RPD · 1M TPM · Multimodal |
| **LLM 2** | Mistral Small | 60 RPM · 1000 RPD · Européen |
| **LLM 3** | GPT-4o (GitHub Models) | 10 RPM · 50 RPD · Fallback final |
| **DevOps** | Docker, docker-compose | Déploiement local production-like |
| **Hosting** | Render (3 services) | Free tier permanent, déploiement continu |
| **CI/CD** | GitHub Actions | Type-check + build sur push |

---

## Installation rapide

### Prérequis

- Node.js ≥ 18
- npm ≥ 9
- Compte TiDB Cloud (BDD MySQL gratuite)
- Clés API : Gemini, Mistral, GitHub Token (toutes gratuites)

### Démarrage en 4 commandes

```bash
# 1. Variables d'environnement
cp .env.example .env
cp .env.example apps/backend/.env

# 2. Éditer .env avec vos DATABASE_URL + clés API LLM

# 3. Installer et builder
npm install
npm run build:types
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Lancer
npm run dev
```

→ Frontend : http://localhost:3000

> Détails complets dans [SETUP.md](./SETUP.md) ou démarrage automatique avec `scripts/setup.cmd` (Windows) / `scripts/setup.sh` (Linux/Mac).

---

## Configuration des clés API (toutes gratuites)

| Service | URL inscription | Offre gratuite |
|---------|-----------------|----------------|
| **Gemini** | https://aistudio.google.com/apikey | 15 RPM / 1500 RPD / 1M TPM |
| **Mistral** | https://console.mistral.ai/api-keys | 60 RPM / 1000 RPD (Experiment plan) |
| **GitHub Models** | https://github.com/settings/tokens | 10 RPM / 50 RPD |

### Base de données TiDB Cloud

1. https://tidbcloud.com → compte gratuit
2. Créer un **Serverless Cluster** (Frankfurt recommandé)
3. **Connect** → noter `Host`, `User` (préfixe + `.root`), `Password`
4. Format de `DATABASE_URL` :
   ```
   mysql://PREFIX.root:PASSWORD@HOST:4000/omniai?sslaccept=strict
   ```

---

## Fonctionnalités

### Must Have (toutes implémentées)
- **F01** — Authentification JWT (inscription, connexion, refresh token, logout)
- **F02** — Interface de chat avec streaming SSE
- **F03** — Sélection du modèle LLM via modal (Gemini / Mistral / GPT-4o)
- **F04** — Affichage des quotas en temps réel (RPM, RPD, TPM)
- **F05** — Fallback automatique Gemini → Mistral → GPT-4o
- **F06** — Persistance des conversations en MySQL
- **F07** — Historique et reprise de conversation
- **F08** — Toggle de routage dynamique

### Should Have (toutes implémentées)
- **F09** — Dashboard monitoring (KPIs, chart 7 jours, statut quotas)
- **F10** — Upload de fichiers PDF, DOCX, TXT (extraction Node native via `pdf-parse` + `mammoth`)
- **F11** — Support des images PNG / JPG pour Gemini multimodal
- **F12** — Mode sombre / clair / système (toggle dans Paramètres)
- **F13** — Multilingue FR / EN avec bascule instantanée (toute l'app traduite)
- **F14** — Gestion du profil + avatar (12 emojis preset ou URL custom)
- **F15** — Clés API personnelles chiffrées AES-256 (priorité sur les clés serveur)
- **F16** — Notifications (alertes quota, rapport hebdo, alertes email)

### Could Have
- [x] **F17** — Dictée vocale Speech-to-Text (Web Speech API navigateur, gestion permissions)
- [ ] **F19** — Export de conversation en PDF (à venir)

---

## Améliorations majeures apportées

### Backend
- **Auto-création des quotas serveur** : la table `quotas_serveur` est auto-peuplée au 1er appel si une ligne manque, plus besoin de seed manuel après `db push`
- **Script de cleanup d'enum** : `scripts/cleanup-old-enum.js` retire automatiquement les vieilles valeurs d'enum (ex: `groq` → `mistral`) avant migration
- **Validation de clé Gemini en amont** : vérification du préfixe `AIza` avant d'appeler l'API, erreur claire si format invalide
- **Détection étendue des erreurs LLM** : reconnaissance des codes 401/403 (auth), 429 (quota), `api_key_invalid`, `permission_denied`, etc.
- **Fix Gemini 2.0** : `systemInstruction` passé comme objet `Content` `{ role, parts: [{ text }] }` (changement d'API)
- **Extraction PDF/DOCX en Node natif** : remplacement de la dépendance au service Python par `pdf-parse` et `mammoth`, plus fiable et plus rapide
- **Migration sécurisée** : utilisation de `prisma db push` (pas de migrations fichier requises) avec script de nettoyage préalable
- **Gestion d'erreur fine pour les clés perso** : message explicite "Votre clé Gemini est invalide" au lieu de "Tous les modèles indisponibles"

### Frontend
- **i18n complet FR/EN** : toute l'app (login, register, chat, dashboard, settings, modals, sidebar, welcome screen, etc.) est traduite via un hook `useT()` et un dictionnaire central
- **Thème dynamique** : nouveau `ThemeApplier` qui écoute le store user et bascule entre 3 thèmes (Sombre / Clair / Système) avec variables CSS
- **Sélecteur de modèle synchronisé avec le fallback** : quand le backend bascule sur Mistral, l'UI se met à jour instantanément (sélecteur top-bar + Session Info)
- **Modal d'avatar fonctionnel** : 12 emojis presets (🦊 🐱 🐼 ...) ou URL personnalisée, preview en temps réel, affichage dans Sidebar + Profil
- **Badge "Clé perso"** : visible dans Session Info et ModelSelectorModal pour identifier quelle clé est utilisée
- **Validation des clés API côté UI** : avertissement jaune si format inattendu (ex: clé Gemini sans préfixe `AIzaSy`)
- **Micro Speech-to-Text amélioré** : gestion explicite des permissions, détection HTTPS requis, indicateur visuel pulsant, support continuous mode (parle, transcript live), messages d'erreur localisés par type
- **Fix bug critique** : composant `Field` du formulaire d'inscription qui perdait le focus à chaque keystroke (recréation à chaque rendu) — réécrit avec des inputs directs
- **AuthGuard avec hasHydrated** : évite la redirection prématurée vers `/auth/login` avant que Zustand n'ait rehydraté le store depuis localStorage

### DevOps / Déploiement
- **render.yaml fonctionnel** : 3 services pré-configurés (backend, frontend, python) avec build depuis la racine du monorepo (support workspaces npm)
- **Dockerfiles multi-stage optimisés** : builder + runtime séparés, packages/types compilé une seule fois
- **`output: 'standalone'` retiré de Next.js** : incompatible avec `next start`, simplifie le déploiement Render
- **Scripts d'installation automatiques** : `install-and-run.cmd` (Windows) et `setup.sh` (Linux/Mac)
- **`postinstall` retiré** : évite les boucles d'install récursives
- **Variables d'env documentées** : préfixe Gemini, format Mistral, etc.

---

## API Documentation

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/register` | Inscription |
| `POST` | `/api/auth/login` | Connexion (JWT) |
| `POST` | `/api/auth/refresh` | Renouveler l'access token |
| `GET` | `/api/auth/me` | Profil courant |
| `POST` | `/api/auth/change-password` | Changer le mot de passe |

### Chat (SSE Streaming)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/chat/send` | Envoyer un message (streaming SSE) |
| `POST` | `/api/chat/send-sync` | Envoyer un message (synchrone) |

#### Exemple d'appel chat (streaming)

```javascript
const response = await fetch('/api/chat/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    conversationId: 42,            // Optionnel
    contenu: "Explique les microservices",
    modelId: "gemini-2.0-flash",   // Optionnel : défaut Gemini
    dynamicRouting: true,          // Fallback auto
  }),
});

// Events SSE : { type: "chunk"|"done"|"error"|"model_switch", ... }
```

### Conversations

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/conversations` | Lister (paginé) |
| `GET` | `/api/conversations/:id` | Détail + messages |
| `POST` | `/api/conversations` | Créer |
| `PATCH` | `/api/conversations/:id` | Renommer |
| `DELETE` | `/api/conversations/:id` | Supprimer |

### Quotas, Modèles, Dashboard, Settings, Upload

| Route | Description |
|-------|-------------|
| `GET /api/quotas` | Quotas temps réel RPM/RPD/TPM |
| `GET /api/models` | Liste des modèles + quotas |
| `GET /api/dashboard` | KPIs + chart + récents |
| `GET /api/settings` | Profil + clés API + notifs |
| `PATCH /api/settings/profile` | Update profil (incl. avatar) |
| `POST /api/settings/api-keys` | Sauvegarder clé API perso (chiffrée AES) |
| `DELETE /api/settings/api-keys/:provider` | Supprimer clé perso |
| `PATCH /api/settings/notifications` | Préférences notifs |
| `POST /api/upload` | Upload + extraction (PDF/DOCX/TXT/image) |

---

## Déploiement Render

### Avec render.yaml (recommandé — Blueprint)

1. `git push` sur GitHub
2. Render Dashboard → **New** → **Blueprint** → connecter le repo
3. Render lit `render.yaml` et crée 3 services automatiquement
4. Renseigner les vars `sync: false` :
   - `DATABASE_URL` (TiDB Cloud)
   - `GEMINI_API_KEY`, `MISTRAL_API_KEY`, `GITHUB_TOKEN`
   - `FRONTEND_URL`, `PYTHON_SERVICE_URL`
5. Premier déploiement = 5-10 min par service

### Migrations en production

Le `startCommand` du backend exécute automatiquement :
```bash
node scripts/cleanup-old-enum.js   # nettoyage transitoire d'enum
npx prisma db push --skip-generate --accept-data-loss   # schéma BDD
node dist/server.js                # démarrage serveur
```

---

## Roadmap

### Version 2.0
- Panel d'administration multi-utilisateurs
- Support Anthropic Claude, Cohere
- Export conversations PDF / Markdown
- Recherche dans l'historique
- Prompts système personnalisés par conversation
- Mode SaaS avec abonnements

---

## Équipe & Crédits

| Membre | Rôle |
|--------|------|
| AMOUSSOU Solène | Cheffe de projet & Back-end |
| SOW Alimatou | Designer UI/UX & Front-end |
| SALOBO Kevin | Responsable gestion de projet |
| FULCRAND Johan | Architecte logiciel & UI/UX |

**Encadrants** : M. Mohamed-Amine LASHEB & M. Meihdi DJEBLI
**Institution** : CNAM — Module USAL59 — 2025-2026

---

## Licence

MIT © 2026 OmniAI Team — CNAM
