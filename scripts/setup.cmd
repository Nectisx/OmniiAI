@echo off
:: ============================================================
:: OmniAI - Script d'installation Windows
:: Usage: scripts\setup.cmd
:: ============================================================

echo.
echo OmniAI - Installation
echo =====================

:: 1. Verifs prerequis
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js requis ^(^>=18^). Installez sur https://nodejs.org
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_V=%%v
echo OK Node %NODE_V%

:: 2. Creation des .env s'ils n'existent pas
if not exist .env (
  copy .env.example .env >nul
  echo OK .env cree - pensez a le remplir
)
if not exist apps\backend\.env (
  copy .env.example apps\backend\.env >nul
  echo OK apps\backend\.env cree
)
if not exist apps\frontend\.env.local (
  copy apps\frontend\.env.local.example apps\frontend\.env.local >nul
  echo OK apps\frontend\.env.local cree
)

:: 3. Installation des dependances
echo.
echo Installation des dependances...
call npm install
if errorlevel 1 exit /b 1

:: 4. Build du package types
echo.
echo Build de @omniai/types...
call npm run build:types
if errorlevel 1 exit /b 1

:: 5. Prisma
echo.
echo Generation du client Prisma...
call npm run prisma:generate
if errorlevel 1 exit /b 1

echo.
echo OK Installation terminee !
echo.
echo Prochaines etapes :
echo   1. Editez .env et apps\backend\.env avec vos cles API
echo   2. npm run prisma:migrate     ^(cree les tables^)
echo   3. npm run prisma:seed        ^(quotas serveur initiaux^)
echo   4. npm run dev                ^(demarre frontend + backend^)
echo.
echo Frontend  http://localhost:3000
echo Backend   http://localhost:3001/api/health
