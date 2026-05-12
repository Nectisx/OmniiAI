# OmniAI — LLM Entreprise Hub

<div align="center">
  <img src="docs/logo.png" alt="OmniAI Logo" width="120" />

  **Centralisez vos modèles IA. Gemini 2.0 Flash · Llama 3.3 70B · GPT-4o**

  [![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org)
  [![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org)
  [![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

  [Démo live](https://omniai.onrender.com) · [Documentation API](#api) · [Déploiement](#deploiement)
</div>

---

## 📋 Table des matières

- [Présentation](#présentation)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [API Documentation](#api-documentation)
- [Déploiement Render](#déploiement-render)
- [Fonctionnalités](#fonctionnalités)
- [Roadmap](#roadmap)

---

## 🎯 Présentation

**OmniAI** est une plateforme web d'entreprise qui centralise l'accès à plusieurs modèles de langage (LLM) depuis une interface unique. Elle gère automatiquement les quotas des APIs gratuites, effectue un **fallback automatique** entre les modèles, persiste les conversations en base de données, et fournit un tableau de bord de monitoring en temps réel.

### Problème résolu

| Problème | Solution OmniAI |
|---|---|
| Éparpillement des outils IA | Interface unique multi-modèles |
| Blocage par les quotas API | Fallback automatique Gemini→Llama→GPT-4o |
| Perte de l'historique | Persistance MySQL complète |
| Absence de visibilité | Dashboard monitoring temps réel |

---

## 🏗️ Architecture

```
omniai/
├── apps/
│   ├── backend/          # Node.js + Express + Prisma
│   │   ├── src/
│   │   │   ├── controllers/    # Couche contrôleur (MVC)
│   │   │   ├── services/       # Logique métier
│   │   │   ├── repositories/   # Accès données
│   │   │   ├── middleware/     # Auth, validation, erreurs
│   │   │   ├── routes/         # Définition des routes API
│   │   │   ├── config/         # Config BDD, LLM
│   │   │   └── utils/          # JWT, logger, chiffrement
│   │   └── prisma/             # Schéma + migrations
│   │
│   ├── frontend/         # Next.js 14 + TypeScript
│   │   └── src/
│   │       ├── app/            # Pages (App Router)
│   │       ├── components/     # Composants React
│   │       ├── hooks/          # Custom hooks
│   │       ├── stores/         # Zustand stores
│   │       └── services/       # Appels API
│   │
│   └── python-service/   # Flask microservice
│       └── app.py              # PDF/DOCX extract + STT
│
└── packages/
    └── types/            # Types TypeScript partagés
```

### Flux de données

```
Client (Next.js)
    │ HTTP/SSE
    ▼
Backend (Express)
    │ Auth JWT ─── Prisma ──► TiDB Cloud (MySQL)
    │ Quota check
    ▼
LLM Service (abstraction)
    ├── Gemini 2.0 Flash   (Google AI Studio)
    ├── Llama 3.3 70B      (Groq)
    └── GPT-4o             (GitHub Models)

Backend ──HTTP──► Python Flask
                    ├── PDF/DOCX extraction
                    └── Speech-to-Text
```

---

## 🛠️ Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS | SSR, performance, type-safety |
| **UI** | shadcn/ui, Framer Motion, Lucide | Design system + animations |
| **State** | Zustand + React Query | État global + cache serveur |
| **Backend** | Node.js, Express.js, TypeScript | Async natif, cohérence JS |
| **ORM** | Prisma + MySQL/TiDB Cloud | Type-safe, migrations |
| **Auth** | JWT + bcrypt | Sécurité standard |
| **Python** | Flask + PyMuPDF + Whisper | Extraction PDF, STT |
| **LLM 1** | Gemini 2.0 Flash | 15 RPM · 1500 RPD · 1M TPM · Multimodal |
| **LLM 2** | Llama 3.3 70B (Groq) | 30 RPM · 1000 RPD · Ultra-rapide |
| **LLM 3** | GPT-4o (GitHub Models) | 10 RPM · 50 RPD · Fallback |
| **DevOps** | Docker, Docker Compose, Render | Déploiement simple |
| **CI/CD** | GitHub Actions | Déploiement continu |

---

## 🚀 Installation

### Prérequis

- Node.js ≥ 18
- npm ≥ 9
- Python 3.11+
- Docker (optionnel)
- Compte TiDB Cloud (base de données MySQL gratuite)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-org/omniai.git
cd omniai
```

### 2. Variables d'environnement

```bash
cp .env.example .env
# Éditez .env avec vos clés API
```

Variables obligatoires :
```env
DATABASE_URL="mysql://user:pass@host:4000/omniai?ssl-mode=verify-full"
JWT_SECRET="votre-secret-32-chars-minimum"
JWT_REFRESH_SECRET="votre-refresh-secret-32-chars"
GEMINI_API_KEY="AIzaSy..."
GROQ_API_KEY="gsk_..."
GITHUB_TOKEN="ghp_..."
```

### 3. Installation des dépendances

```bash
npm install
```

### 4. Base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables (migration)
npm run prisma:migrate

# Données initiales (quotas serveur)
npm run prisma:seed
```

### 5. Python service

```bash
cd apps/python-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## ⚙️ Configuration

### Clés API LLM (gratuites)

| Service | URL | Offre gratuite |
|---------|-----|----------------|
| **Gemini** | [Google AI Studio](https://aistudio.google.com/apikey) | 15 RPM / 1500 RPD / 1M TPM |
| **Groq** | [console.groq.com](https://console.groq.com/keys) | 30 RPM / 1000 RPD |
| **GitHub Models** | [github.com/settings/tokens](https://github.com/settings/tokens) | 10-15 RPM / 50 RPD |

### Base de données TiDB Cloud

1. Créez un compte sur [tidbcloud.com](https://tidbcloud.com)
2. Créez un cluster **Serverless** (gratuit)
3. Créez la base `omniai`
4. Récupérez la connection string et mettez-la dans `DATABASE_URL`

---

## 🏃 Lancement

### Mode développement

```bash
# Terminal 1: Backend + Frontend en parallèle
npm run dev

# Terminal 2: Python service
cd apps/python-service && python app.py
```

URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Python service: http://localhost:5000
- Prisma Studio: `npm run prisma:studio`

### Mode Docker (production local)

```bash
# Build et lancement de tous les services
npm run docker:build
npm run docker:up

# Vérifier les logs
docker-compose logs -f

# Arrêter
npm run docker:down
```

---

## 📡 API Documentation

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/register` | Inscription |
| `POST` | `/api/auth/login` | Connexion |
| `POST` | `/api/auth/refresh` | Refresh token |
| `GET` | `/api/auth/me` | Profil courant |

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
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    conversationId: 42,          // Optionnel: crée une nouvelle conv si absent
    contenu: "Explique les microservices",
    modelId: "gemini-2.0-flash",  // Optionnel: défaut = Gemini
    dynamicRouting: true          // Fallback automatique
  })
});

// Lire les chunks SSE
const reader = response.body.getReader();
// Chaque event: { type: "chunk"|"done"|"error"|"model_switch", content: "..." }
```

### Conversations

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/conversations` | Lister les conversations |
| `GET` | `/api/conversations/:id` | Messages d'une conversation |
| `POST` | `/api/conversations` | Créer une conversation |
| `PATCH` | `/api/conversations/:id` | Renommer |
| `DELETE` | `/api/conversations/:id` | Supprimer |

### Quotas & Modèles

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/quotas` | Quotas RPM/RPD/TPM en temps réel |
| `GET` | `/api/models` | Modèles disponibles + quotas |

### Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/dashboard` | KPIs + graphiques + quotas |

### Settings

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/settings` | Paramètres complets |
| `PATCH` | `/api/settings/profile` | Mettre à jour le profil |
| `POST` | `/api/settings/api-keys` | Sauvegarder une clé API |
| `DELETE` | `/api/settings/api-keys/:provider` | Supprimer une clé |
| `PATCH` | `/api/settings/notifications` | Préférences notifications |

### Upload

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/upload` | Upload fichier (PDF/DOCX/TXT/PNG/JPG) |

---

## 🌐 Déploiement Render

### Déploiement automatique via render.yaml

```bash
# 1. Pushez sur GitHub
git push origin main

# 2. Dans Render Dashboard
# → New → Blueprint → Connectez votre repo
# → Render lit render.yaml et crée les 3 services automatiquement
```

### Variables à configurer manuellement dans Render

Pour chaque service, dans **Environment Variables** :

**Backend:**
```
DATABASE_URL         → Votre TiDB Cloud connection string
GEMINI_API_KEY       → Clé Google AI Studio
GROQ_API_KEY         → Clé Groq
GITHUB_TOKEN         → Personal Access Token GitHub
PYTHON_SERVICE_URL   → https://omniai-python.onrender.com
FRONTEND_URL         → https://omniai-frontend.onrender.com
```

**Frontend:**
```
NEXT_PUBLIC_API_URL  → https://omniai-backend.onrender.com/api
```

### Migrations en production

```bash
# Les migrations sont exécutées automatiquement au démarrage
# (npx prisma migrate deploy dans le start command)
```

---

## ✨ Fonctionnalités

### Must Have ✅
- [x] **F01** — Authentification (inscription / connexion / JWT)
- [x] **F02** — Interface de chat avec streaming SSE
- [x] **F03** — Sélection du modèle LLM (modal dédié)
- [x] **F04** — Affichage quotas en temps réel (RPM/RPD/TPM)
- [x] **F05** — Fallback automatique (Gemini → Llama → GPT-4o)
- [x] **F06** — Persistance des conversations en MySQL
- [x] **F07** — Historique et reprise de conversation
- [x] **F08** — Routage dynamique toggle

### Should Have ✅
- [x] **F09** — Dashboard monitoring (KPIs + graphiques 7j)
- [x] **F10** — Upload fichiers (PDF/DOCX/TXT)
- [x] **F11** — Support images pour Gemini multimodal
- [x] **F12** — Dark mode (défaut) + Light mode
- [x] **F13** — Multilingue FR/EN
- [x] **F14** — Gestion profil utilisateur
- [x] **F15** — Clés API personnelles (priorité sur serveur)

### Could Have 🔄
- [ ] **F17** — Dictée vocale Speech-to-Text (Web API intégrée)
- [ ] **F19** — Export conversation PDF

---

## 🗺️ Roadmap

### Version 2.0
- [ ] Panel d'administration multi-utilisateurs
- [ ] Support Mistral / Cohere
- [ ] Export conversations PDF/Markdown
- [ ] Recherche dans l'historique
- [ ] Prompts système personnalisés
- [ ] Mode SaaS avec abonnements

---

## 👥 Équipe

| Membre | Rôle |
|--------|------|
| AMOUSSOU Solène | Cheffe de projet & Back-end |
| SOW Alimatou | Designer UI/UX & Front-end |
| SALOBO Kevin | Responsable gestion de projet |
| FULCRAND Johan | Architecte logiciel & UI/UX |

**Encadrants:** M. Mohamed-Amine LASHEB & M. Meihdi DJEBLI  
**Institution:** CNAM — Module USAL59 — 2025-2026

---

## 📄 Licence

MIT © 2026 OmniAI Team — CNAM
