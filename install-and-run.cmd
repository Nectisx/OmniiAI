@echo off
:: ============================================================
:: OmniAI - Installation + lancement automatique (Windows)
:: Double-clic pour tout faire d'un coup
:: ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo   OmniAI - Setup automatique
echo ========================================
echo.

:: 1. Verifier Node
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js n'est pas installe.
  echo Telechargez la version 18+ sur https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo Node detecte : %%v

:: 2. Creation des .env s'ils n'existent pas
if not exist .env (
  copy .env.example .env >nul
  echo [OK] .env cree depuis le template
  echo.
  echo *** IMPORTANT *** Editez .env maintenant avec :
  echo   - DATABASE_URL ^(TiDB Cloud^)
  echo   - GEMINI_API_KEY, GROQ_API_KEY, GITHUB_TOKEN
  echo   - JWT_SECRET, JWT_REFRESH_SECRET
  echo.
  echo Appuyez sur une touche pour ouvrir .env dans le bloc-notes...
  pause >nul
  notepad .env
)

if not exist apps\backend\.env (
  copy .env apps\backend\.env >nul
  echo [OK] apps\backend\.env synchronise
)

if not exist apps\frontend\.env.local (
  copy apps\frontend\.env.local.example apps\frontend\.env.local >nul
  echo [OK] apps\frontend\.env.local cree
)

:: 3. Installer les dependances
echo.
echo === Installation des dependances ^(2-5 min^) ===
call npm install
if errorlevel 1 (
  echo [ERREUR] npm install a echoue
  pause
  exit /b 1
)

:: 4. Build du package partage @omniai/types
echo.
echo === Build de @omniai/types ===
call npm run build:types
if errorlevel 1 (
  echo [ERREUR] build:types a echoue
  pause
  exit /b 1
)

:: 5. Prisma : generation, migration, seed
echo.
echo === Configuration de la base de donnees ===
call npm run prisma:generate
if errorlevel 1 (
  echo [ERREUR] prisma generate a echoue
  pause
  exit /b 1
)

call npm run prisma:migrate
if errorlevel 1 (
  echo [ATTENTION] prisma migrate a echoue
  echo Verifiez DATABASE_URL dans .env
  pause
  exit /b 1
)

call npm run prisma:seed
if errorlevel 1 (
  echo [ATTENTION] prisma seed a echoue ^(non bloquant^)
)

:: 6. Lancement
echo.
echo ========================================
echo   Installation terminee !
echo ========================================
echo.
echo Frontend  http://localhost:3000
echo Backend   http://localhost:3001/api/health
echo.
echo Appuyez sur une touche pour lancer l'application...
pause >nul

call npm run dev
