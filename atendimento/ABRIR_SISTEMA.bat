@echo off
title Sistema de Tickets - Tryvia
color 0A
cd /d "%~dp0"

echo ========================================
echo    SISTEMA DE TICKETS - TRYVIA
echo ========================================
echo.

:: Iniciar Proxy NPM
echo [1/3] Iniciando Proxy Freshdesk...
if exist "package.json" (
    if not exist "node_modules" (
        call npm install
    )
    start /min cmd /c "cd /d "%cd%" && npm start"
    echo Proxy iniciado!
)

echo.
timeout /t 3 /nobreak >nul

:: Iniciar Servidor Web
echo [2/3] Iniciando Servidor Web...
python --version >nul 2>&1
if %errorlevel%==0 (
    start /min cmd /c "cd /d "%cd%" && python -m http.server 8000"
    echo Servidor rodando em http://localhost:8000
    timeout /t 2 /nobreak >nul
    
    :: Abrir navegador com URL codificada
    echo.
    echo [3/3] Abrindo navegador...
    start "" "http://localhost:8000/BI_por_Time%%282%%29.html"
) else (
    :: Fallback - abrir arquivo local
    echo Python nao encontrado. Abrindo arquivo local...
    start "" "%cd%\BI_por_Time(2).html"
)

echo.
echo ========================================
echo    SISTEMA INICIADO!
echo ========================================
echo.
pause
