@echo off
chcp 65001 >nul
title Push para Todos os Repositórios

echo ════════════════════════════════════════════════════════════════
echo                PUSH PARA TODOS OS REPOSITÓRIOS
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0.."

echo 📁 Diretório: %CD%
echo.

:: Verificar se há mudanças
git status --short
echo.

set /p msg="Mensagem do commit (ou ENTER para 'update'): "
if "%msg%"=="" set msg=update

:: Commit
echo.
echo 📝 Fazendo commit...
git add .
git commit -m "%msg%"

echo.
echo ════════════════════════════════════════════════════════════════
echo                     ENVIANDO PARA REMOTES
echo ════════════════════════════════════════════════════════════════

:: Push para todos os remotes configurados
for /f "tokens=1" %%r in ('git remote') do (
    echo.
    echo 🚀 Enviando para: %%r
    git push %%r main 2>&1
    if errorlevel 1 (
        echo    ⚠️ Erro ao enviar para %%r
    ) else (
        echo    ✅ Enviado para %%r
    )
)

echo.
echo ════════════════════════════════════════════════════════════════
echo ✅ CONCLUÍDO!
echo ════════════════════════════════════════════════════════════════
pause
