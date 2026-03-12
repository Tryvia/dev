/**
 * SYNC SCHEDULER - Agendador de Sincronização Automática
 * 
 * Executa sincronizações periódicas para manter dados consistentes
 * 
 * MODOS DE EXECUÇÃO:
 *   node sync-scheduler.js              # Inicia o agendador (roda continuamente)
 *   node sync-scheduler.js --once       # Executa uma vez e sai
 *   node sync-scheduler.js --interval 5 # Intervalo em minutos (default: 15)
 * 
 * PARA PRODUÇÃO:
 *   Use PM2: pm2 start sync-scheduler.js --name "freshdesk-sync"
 *   Ou Windows Task Scheduler para rodar sync-integrity.js a cada 15 min
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuração
const args = process.argv.slice(2);
const ONCE = args.includes('--once');
const intervalIndex = args.indexOf('--interval');
const INTERVAL_MINUTES = intervalIndex !== -1 ? parseInt(args[intervalIndex + 1]) : 15;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

// Estado
let isRunning = false;
let lastRun = null;
let lastResult = null;
let runCount = 0;

/**
 * Executa o script de integridade
 */
function runIntegrityCheck() {
    return new Promise((resolve) => {
        if (isRunning) {
            console.log('⚠️ Sincronização anterior ainda em execução, pulando...');
            resolve({ skipped: true });
            return;
        }
        
        isRunning = true;
        runCount++;
        const startTime = Date.now();
        
        console.log('\n' + '═'.repeat(60));
        console.log(`🔄 EXECUÇÃO #${runCount} - ${new Date().toISOString()}`);
        console.log('═'.repeat(60) + '\n');
        
        const scriptPath = path.join(__dirname, 'sync-integrity.js');
        const child = spawn('node', [scriptPath], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        child.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            isRunning = false;
            lastRun = new Date();
            lastResult = code === 0 ? 'success' : 'error';
            
            console.log(`\n⏱️ Execução #${runCount} concluída em ${duration}s (código: ${code})`);
            console.log(`📅 Próxima execução em ${INTERVAL_MINUTES} minutos\n`);
            
            resolve({ code, duration });
        });
        
        child.on('error', (err) => {
            console.error('❌ Erro ao executar script:', err.message);
            isRunning = false;
            lastResult = 'error';
            resolve({ error: err.message });
        });
    });
}

/**
 * Mostra status atual
 */
function showStatus() {
    console.log('\n📊 STATUS DO AGENDADOR');
    console.log('─'.repeat(40));
    console.log(`   Intervalo: ${INTERVAL_MINUTES} minutos`);
    console.log(`   Execuções: ${runCount}`);
    console.log(`   Última execução: ${lastRun ? lastRun.toISOString() : 'N/A'}`);
    console.log(`   Último resultado: ${lastResult || 'N/A'}`);
    console.log(`   Em execução: ${isRunning ? 'Sim' : 'Não'}`);
    console.log('─'.repeat(40) + '\n');
}

/**
 * Main
 */
async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║        SYNC SCHEDULER - Agendador de Sincronização        ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║ Intervalo: ${INTERVAL_MINUTES} minutos                                      ║`);
    console.log(`║ Modo: ${ONCE ? 'Execução única' : 'Contínuo'}                                      ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    if (ONCE) {
        // Execução única
        await runIntegrityCheck();
        process.exit(0);
    }
    
    // Execução contínua
    console.log('🚀 Iniciando agendador...');
    console.log(`   Sincronização será executada a cada ${INTERVAL_MINUTES} minutos`);
    console.log('   Pressione Ctrl+C para parar\n');
    
    // Primeira execução imediata
    await runIntegrityCheck();
    
    // Agendar execuções periódicas
    setInterval(async () => {
        await runIntegrityCheck();
    }, INTERVAL_MS);
    
    // Mostrar status a cada hora
    setInterval(() => {
        showStatus();
    }, 60 * 60 * 1000);
    
    // Manter processo rodando
    process.on('SIGINT', () => {
        console.log('\n\n👋 Agendador encerrado pelo usuário');
        showStatus();
        process.exit(0);
    });
}

main().catch(console.error);
