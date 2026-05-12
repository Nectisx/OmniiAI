# OmniAI — Guide d'installation et de déploiement

> Ce guide vous accompagne pas à pas du clonage du projet jusqu'au déploiement sur Render.

---

## 1. Prérequis

| Outil | Version min. | Lien |
|-------|--------------|------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | (inclus avec Node) |
| Python | 3.11+ | https://python.org (optionnel — pour le service Python) |
| Git | n'importe | https://git-scm.com |

Sur Windows, ouvrez **PowerShell** ou **CMD** (pas Git Bash, certains scripts diffèrent).

---

## 2. Étape 1 — Créer la base de données TiDB Cloud (gratuit, sans CB)

1. Allez sur https://tidbcloud.com et créez un compte
2. Créez un **Serverless Cluster** (free tier permanent)
3. Cliquez **Connect** → choisissez `General` → notez les valeurs `Host`, `User`, `Password`
4. Construisez votre `DATABASE_URL` :

```
mysql://<USER>:<PASSWORD>@<HOST>:4000/omniai?sslaccept=strict
```

Exemple complet :
```
mysql://2Dqe8abcXYZ.root:monMotDePasse@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/omniai?sslaccept=strict
```

⚠️ Le paramètre `?sslaccept=strict` est **obligatoire** pour TiDB Cloud.

---

## 3. Étape 2 — Récupérer les clés API LLM (toutes gratuites)

| Clé | Service | URL |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio | https://aistudio.google.com/apikey |
| `GROQ_API_KEY` | Groq (Llama 3.3) | https://console.groq.com/keys |
| `GITHUB_TOKEN` | GitHub Models (GPT-4o) | https://github.com/settings/tokens → `Generate new token (classic)` → aucun scope requis |

---

## 4. Étape 3 — Installation locale

### 4.a — Méthode rapide (script automatique)

**Linux / Mac :**
```bash
bash scripts/setup.sh
```

**Windows :**
```cmd
scripts\setup.cmd
```

### 4.b — Méthode manuelle

```bash
# 1. Variables d'environnement
cp .env.example .env
cp .env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local

# 2. Ouvrez .env et apps/backend/.env, remplissez :
#    - DATABASE_URL (TiDB Cloud)
#    - GEMINI_API_KEY, GROQ_API_KEY, GITHUB_TOKEN
#    - JWT_SECRET et JWT_REFRESH_SECRET (chaînes aléatoires longues)

# 3. Dépendances
npm install

# 4. Build du package partagé @omniai/types (obligatoire avant le 1er run)
npm run build:types

# 5. Prisma : génération du client + création des tables
npm run prisma:generate
npm run prisma:migrate

# 6. Seed des quotas serveur initiaux
npm run prisma:seed
```

---

## 5. Étape 4 — Lancement local

### Option A — Un seul terminal
```bash
npm run dev
```

Cette commande démarre **backend (port 3001)** et **frontend (port 3000)** en parallèle.

### Option B — Deux terminaux (plus stable sur Windows)
```bash
# Terminal 1
cd apps/backend
npm run dev

# Terminal 2
cd apps/frontend
npm run dev
```

### Option C — Service Python pour PDF/DOCX/STT (optionnel)
```bash
cd apps/python-service
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

---

## 6. Accéder à l'application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Interface utilisateur |
| Backend API | http://localhost:3001/api/health | Health check |
| Prisma Studio | `npm run prisma:studio` | UI base de données |
| Python service | http://localhost:5000/health | Microservice Flask |

### Créer votre premier compte

1. Allez sur http://localhost:3000/auth/register
2. Mot de passe valide = **8 caractères + 1 majuscule + 1 chiffre** (ex: `Password123`)
3. Vous êtes automatiquement connecté et redirigé vers `/chat`

---

## 7. Déploiement Docker local (production-like)

```bash
# 1. .env doit être renseigné à la racine

# 2. Build et lancement
docker-compose up -d --build

# 3. Vérifier les logs
docker-compose logs -f

# 4. Arrêter
docker-compose down
```

---

## 8. Déploiement sur Render

### 8.a — Préparer le repo

1. Pousser le code sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "feat: initial OmniAI release"
   git remote add origin https://github.com/<vous>/omniai.git
   git push -u origin main
   ```

2. **IMPORTANT** : les migrations Prisma (`apps/backend/prisma/migrations/`) doivent être commit. Si elles n'existent pas encore, créez-les :
   ```bash
   npm run prisma:migrate
   git add apps/backend/prisma/migrations
   git commit -m "chore: initial Prisma migrations"
   git push
   ```

### 8.b — Créer le Blueprint sur Render

1. Connectez-vous sur https://dashboard.render.com
2. Cliquez **New** → **Blueprint**
3. Connectez votre repo GitHub `omniai`
4. Render lit `render.yaml` automatiquement et propose 3 services :
   - `omniai-backend` (Node.js)
   - `omniai-frontend` (Next.js)
   - `omniai-python` (Python Flask)

### 8.c — Configurer les variables marquées `sync: false`

Pour **omniai-backend** :
```
DATABASE_URL         → votre TiDB Cloud connection string
GEMINI_API_KEY       → AIzaSy...
GROQ_API_KEY         → gsk_...
GITHUB_TOKEN         → ghp_...
PYTHON_SERVICE_URL   → https://omniai-python.onrender.com
FRONTEND_URL         → https://omniai-frontend.onrender.com
```

Pour **omniai-frontend** :
```
NEXT_PUBLIC_API_URL  → https://omniai-backend.onrender.com/api
```

Pour **omniai-python** :
```
PYTHON_SERVICE_SECRET → même valeur que dans le backend
BACKEND_URL           → https://omniai-backend.onrender.com
```

### 8.d — Déployer

Render lance les builds automatiquement. Premier build ≈ 5-10 min.

**Vérifier** :
- Backend : https://omniai-backend.onrender.com/api/health doit retourner `{"success":true,"status":"healthy"}`
- Frontend : https://omniai-frontend.onrender.com doit afficher la page de login

### 8.e — Migrations en production

Les migrations sont exécutées automatiquement au démarrage du backend grâce au startCommand :
```
cd apps/backend && npx prisma migrate deploy && node -r tsconfig-paths/register dist/server.js
```

---

## 9. Erreurs fréquentes

| Erreur | Cause | Solution |
|---|---|---|
| `Cannot find module '@omniai/types'` | types pas compilés | `npm run build:types` |
| `connections using insecure transport` | SSL manquant dans `DATABASE_URL` | Ajoutez `?sslaccept=strict` |
| `DATABASE_URL not found` | `.env` manquant dans `apps/backend/` | `cp .env apps/backend/.env` |
| `Identifiants incorrects` | Pas encore de compte | Inscrivez-vous d'abord sur `/auth/register` |
| Port 3000 occupé | Autre app sur le port | `cd apps/frontend && npx next dev -p 3001` |
| `ECONNREFUSED 127.0.0.1:5000` | Service Python pas démarré | Optionnel — extraction texte basique disponible sans |
| Render free tier dort | Cold start après 15 min d'inactivité | Premier hit prend ~30s |
| `Prisma migrate deploy` échoue sur Render | Migrations non commit | Voir étape 8.a point 2 |

---

## 10. Commandes utiles

```bash
# Développement
npm run dev                  # Backend + Frontend
npm run dev:backend          # Backend seul
npm run dev:frontend         # Frontend seul
npm run dev:python           # Service Python

# Build
npm run build                # Tout
npm run build:types          # Package types seul
npm run build:backend        # Backend seul
npm run build:frontend       # Frontend seul

# Prisma
npm run prisma:studio        # UI BDD (port 5555)
npm run prisma:migrate       # Nouvelle migration
npm run prisma:seed          # Reseed les quotas
npm run prisma:generate      # Régénérer le client

# Docker
npm run docker:up            # Lance tout
npm run docker:logs          # Suit les logs
npm run docker:down          # Arrête tout

# Nettoyage
npm run clean                # Supprime dist/, .next/, node_modules
```
