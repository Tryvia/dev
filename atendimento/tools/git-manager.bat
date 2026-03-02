@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Git Manager - Gerenciador de Repositórios

:MENU
cls
echo ════════════════════════════════════════════════════════════════
echo                    GIT MANAGER - Gerenciador
echo ════════════════════════════════════════════════════════════════
echo.
echo  Repositório atual: 
git remote get-url origin 2>nul || echo   (nenhum configurado)
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo  [1] Ver status do repositório
echo  [2] Fazer commit e push (repositório atual)
echo  [3] Adicionar novo repositório remoto
echo  [4] Trocar repositório remoto (origin)
echo  [5] Listar todos os remotes
echo  [6] Push para repositório específico
echo  [7] Clonar projeto para novo repositório
echo  [8] Sair
echo.
echo ════════════════════════════════════════════════════════════════
set /p opcao="Escolha uma opção: "

if "%opcao%"=="1" goto STATUS
if "%opcao%"=="2" goto COMMIT_PUSH
if "%opcao%"=="3" goto ADD_REMOTE
if "%opcao%"=="4" goto CHANGE_ORIGIN
if "%opcao%"=="5" goto LIST_REMOTES
if "%opcao%"=="6" goto PUSH_SPECIFIC
if "%opcao%"=="7" goto CLONE_NEW
if "%opcao%"=="8" exit
goto MENU

:STATUS
cls
echo.
echo ═══ STATUS DO REPOSITÓRIO ═══
echo.
git status
echo.
pause
goto MENU

:COMMIT_PUSH
cls
echo.
echo ═══ COMMIT E PUSH ═══
echo.
git status --short
echo.
set /p msg="Mensagem do commit (ou ENTER para cancelar): "
if "%msg%"=="" goto MENU

git add .
git commit -m "%msg%"
git push
echo.
echo ✅ Push realizado com sucesso!
pause
goto MENU

:ADD_REMOTE
cls
echo.
echo ═══ ADICIONAR NOVO REMOTE ═══
echo.
echo Remotes atuais:
git remote -v
echo.
set /p nome="Nome do remote (ex: backup, github2): "
if "%nome%"=="" goto MENU
set /p url="URL do repositório (ex: https://github.com/user/repo.git): "
if "%url%"=="" goto MENU

git remote add %nome% %url%
echo.
echo ✅ Remote '%nome%' adicionado!
pause
goto MENU

:CHANGE_ORIGIN
cls
echo.
echo ═══ TROCAR REPOSITÓRIO ORIGIN ═══
echo.
echo Origin atual:
git remote get-url origin 2>nul || echo   (nenhum configurado)
echo.
set /p url="Nova URL do origin (ex: https://github.com/user/repo.git): "
if "%url%"=="" goto MENU

git remote remove origin 2>nul
git remote add origin %url%
echo.
echo ✅ Origin alterado para: %url%
echo.
set /p confirma="Deseja fazer push agora? (S/N): "
if /i "%confirma%"=="S" (
    git push -u origin main
    echo ✅ Push realizado!
)
pause
goto MENU

:LIST_REMOTES
cls
echo.
echo ═══ REPOSITÓRIOS REMOTOS CONFIGURADOS ═══
echo.
git remote -v
echo.
pause
goto MENU

:PUSH_SPECIFIC
cls
echo.
echo ═══ PUSH PARA REPOSITÓRIO ESPECÍFICO ═══
echo.
echo Remotes disponíveis:
git remote -v
echo.
set /p remote="Nome do remote para push (ex: origin, backup): "
if "%remote%"=="" goto MENU
set /p branch="Branch (pressione ENTER para 'main'): "
if "%branch%"=="" set branch=main

git push %remote% %branch%
echo.
echo ✅ Push para %remote%/%branch% realizado!
pause
goto MENU

:CLONE_NEW
cls
echo.
echo ═══ ENVIAR PROJETO PARA NOVO REPOSITÓRIO ═══
echo.
echo Este comando vai:
echo  1. Adicionar um novo remote
echo  2. Fazer push de todo o projeto para lá
echo.
set /p nome="Nome do remote (ex: onjoao): "
if "%nome%"=="" goto MENU
set /p url="URL do novo repositório: "
if "%url%"=="" goto MENU

git remote add %nome% %url%
git push -u %nome% main --force
echo.
echo ✅ Projeto enviado para %url%!
pause
goto MENU
