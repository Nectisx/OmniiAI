@echo off
:: ============================================================
:: OmniAI - Redeploy : commit toutes les corrections et push vers Render
:: Double-clic pour declencher un re-deploiement
:: ============================================================
cd /d "%~dp0"

echo.
echo ========================================
echo   OmniAI - Push des corrections
echo ========================================
echo.

:: Verifier qu'on est bien dans un repo git
git status >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Pas dans un depot git. Lancez d'abord git init.
  pause
  exit /b 1
)

:: Verifier qu'il y a des changements
git diff --quiet
if not errorlevel 1 (
  git diff --cached --quiet
  if not errorlevel 1 (
    echo Aucun changement a committer.
    pause
    exit /b 0
  )
)

echo Etat actuel du depot :
git status --short
echo.

echo === Ajout des fichiers modifies ===
git add .

echo.
echo === Commit ===
git commit -m "feat: Mistral replaces Groq + avatar modal + Gemini key validation"
if errorlevel 1 (
  echo [ERREUR] Le commit a echoue
  pause
  exit /b 1
)

echo.
echo === Push vers GitHub ===
git push
if errorlevel 1 (
  echo [ERREUR] Le push a echoue
  echo Verifiez votre authentification GitHub
  pause
  exit /b 1
)

echo.
echo ========================================
echo   Push reussi !
echo ========================================
echo.
echo Render va detecter le nouveau commit et redeployer automatiquement
echo les 3 services. Suivez l'avancement sur :
echo.
echo   https://dashboard.render.com
echo.
echo Le build prend 5-10 minutes par service.
echo.
pause
