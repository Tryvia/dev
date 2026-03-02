@echo off
REM Arquivo para executar o servidor local do TryviaBI
REM Data: 27 de janeiro de 2026

setlocal enabledelayedexpansion

REM Obter diretório do script
cd /d "%~dp0"

echo.
echo ====================================
echo     HAHAHAHA- Servidor Local
echo ====================================
echo.
echo Iniciando servidor...
echo.
echo lembrar de ajustar o caminho do arquivo de gestao no banco de dados...
echo.

REM Tentar usar Python (mais compatível)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Usando Python para servir arquivos...
    echo [INFO] Acesse: http://localhost:8000
    echo [INFO] Pressione Ctrl+C para parar o servidor
    echo.
    
    REM Garantir pasta de logs
    if not exist "logs" mkdir "logs"
    REM Criar arquivo de log dentro da pasta logs
    set "logfile=logs\tryvia_logs_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"
    
    echo [%date% %time%] Servidor iniciado > !logfile!"
    python -m http.server 8000 >> !logfile! 2>&1
    
    goto fim
)

REM Se Python não estiver disponível, tentar Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Usando Node.js para servir arquivos...
    echo [INFO] Acesse: http://localhost:3000
    echo [INFO] Pressione Ctrl+C para parar o servidor
    echo.
    
    REM Criar arquivo de log
    set "logfile=tryvia_logs_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"
    
    echo [%date% %time%] Servidor iniciado com Node.js > !logfile!
    
    REM Verificar se existe package.json
    if exist "package.json" (
        npm install >> !logfile! 2>&1
        npm start >> !logfile! 2>&1
    ) else (
        REM Usar http-server se disponível
        npx http-server -p 3000 >> !logfile! 2>&1
    )
    
    goto fim
)

REM Se nenhum interpretador estiver disponível, informar ao usuário
echo.
echo [ERRO] Nenhum servidor disponível foi encontrado!
echo.
echo Solução: Instale um dos seguintes:
echo   1. Python: https://www.python.org/downloads/
echo   2. Node.js: https://nodejs.org/
echo.
pause
goto fim

:fim
echo.
echo [%date% %time%] Servidor finalizado
pause
endlocal
