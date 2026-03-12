@echo off
:: SYNC AUTOMÁTICO - Execute via Task Scheduler do Windows
:: 
:: CONFIGURAR NO TASK SCHEDULER:
:: 1. Abrir "Agendador de Tarefas" do Windows
:: 2. Criar Tarefa Básica > Nome: "Freshdesk Sync"
:: 3. Disparar: A cada 15 minutos
:: 4. Ação: Iniciar programa
:: 5. Programa: Este arquivo .bat
:: 6. Iniciar em: C:\Users\Operaciona-19\Desktop\Projeto atendimento V-2

cd /d "C:\Users\Operaciona-19\Desktop\Projeto atendimento V-2"

echo ===============================================
echo SYNC INTEGRITY - %date% %time%
echo ===============================================

node sync-freshdesk/sync-integrity.js

echo.
echo Concluído em %time%
