/**
 * Script LOCAL de Sincronização de Conversas - Freshdesk -> Supabase
 * Para testes rápidos com bots - Executar fora do GitHub Actions
 * 
 * USO:
 *   1. Copie o arquivo .env.example para .env e preencha as credenciais
 *   2. Execute: node sync-conversations-local.js
 *   3. Opções:
 *      - node sync-conversations-local.js --minutes 60    (últimos 60 min)
 *      - node sync-conversations-local.js --ticket 12345  (ticket específico)
 *      - node sync-conversations-local.js --status open   (só tickets abertos)
 *      - node sync-conversations-local.js --limit 10      (máx 10 tickets)
 */

const fs = require('fs');
const path = require('path');

// Carregar .env se existir
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            if (!process.env[key.trim()]) {
                process.env[key.trim()] = value;
            }
        }
    });
    console.log('✅ Arquivo .env carregado\n');
}

// Configurações
const CONFIG = {
    FRESHDESK_DOMAIN: process.env.FRESHDESK_DOMAIN || 'suportetryvia',
    FRESHDESK_API_KEY: process.env.FRESHDESK_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
};

// Validar configurações
const missing = [];
if (!CONFIG.FRESHDESK_API_KEY) missing.push('FRESHDESK_API_KEY');
if (!CONFIG.SUPABASE_URL) missing.push('SUPABASE_URL');
if (!CONFIG.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY');

if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n📝 Crie um arquivo .env com:');
    console.error('   FRESHDESK_API_KEY=sua_api_key');
    console.error('   SUPABASE_URL=https://xxx.supabase.co');
    console.error('   SUPABASE_SERVICE_KEY=sua_service_key');
    process.exit(1);
}

// Parsear argumentos da linha de comando
const args = process.argv.slice(2);
const OPTIONS = {
    minutes: 30,
    ticketId: null,
    status: null,
    limit: 100,
    verbose: false,
    dryRun: false
};

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--minutes':
        case '-m':
            OPTIONS.minutes = parseInt(args[++i]) || 30;
            break;
        case '--ticket':
        case '-t':
            OPTIONS.ticketId = parseInt(args[++i]);
            break;
        case '--status':
        case '-s':
            OPTIONS.status = args[++i];
            break;
        case '--limit':
        case '-l':
            OPTIONS.limit = parseInt(args[++i]) || 100;
            break;
        case '--verbose':
        case '-v':
            OPTIONS.verbose = true;
            break;
        case '--dry-run':
        case '-d':
            OPTIONS.dryRun = true;
            break;
        case '--help':
        case '-h':
            showHelp();
            process.exit(0);
    }
}

function showHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     SYNC CONVERSATIONS LOCAL - Ajuda                         ║
╚══════════════════════════════════════════════════════════════╝

USO:
  node sync-conversations-local.js [opções]

OPÇÕES:
  -m, --minutes <n>   Buscar tickets atualizados nos últimos N minutos (padrão: 30)
  -t, --ticket <id>   Sincronizar apenas um ticket específico
  -s, --status <st>   Filtrar por status (open, pending, resolved, closed)
  -l, --limit <n>     Limitar quantidade de tickets (padrão: 100)
  -v, --verbose       Mostrar detalhes das conversas
  -d, --dry-run       Simular sem enviar para Supabase
  -h, --help          Mostrar esta ajuda

EXEMPLOS:
  node sync-conversations-local.js --minutes 60
  node sync-conversations-local.js --ticket 123456
  node sync-conversations-local.js --status open --limit 20
  node sync-conversations-local.js --dry-run --verbose

CONFIGURAÇÃO:
  Crie um arquivo .env na mesma pasta com:
    FRESHDESK_API_KEY=sua_api_key
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_KEY=sua_service_key
    FRESHDESK_DOMAIN=suportetryvia (opcional)
`);
}

// URLs base
const FRESHDESK_BASE_URL = `https://${CONFIG.FRESHDESK_DOMAIN}.freshdesk.com/api/v2`;

// Headers
const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(CONFIG.FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

const supabaseHeaders = {
    'apikey': CONFIG.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
};

// Utilitários
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    warn: (msg) => console.log(`⚠️  ${msg}`),
    error: (msg) => console.error(`❌ ${msg}`),
    verbose: (msg) => OPTIONS.verbose && console.log(`   ${msg}`),
    progress: (current, total, extra = '') => {
        const pct = Math.round((current / total) * 100);
        const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        process.stdout.write(`\r   [${bar}] ${pct}% (${current}/${total}) ${extra}    `);
    }
};

// Fetch com retry e rate limiting
async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
                log.warn(`Rate limited. Aguardando ${retryAfter}s...`);
                await sleep(retryAfter * 1000);
                continue;
            }
            
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            log.warn(`Tentativa ${i + 1} falhou, retentando em 2s...`);
            await sleep(2000);
        }
    }
    throw new Error('Max retries exceeded');
}

// Buscar ticket específico
async function fetchTicketById(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}?include=stats`;
    const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
    
    if (!response.ok) {
        if (response.status === 404) {
            log.error(`Ticket ${ticketId} não encontrado`);
            return null;
        }
        throw new Error(`Erro ao buscar ticket: ${response.status}`);
    }
    
    return await response.json();
}

// Buscar tickets recentes
async function fetchRecentTickets() {
    const lookbackDate = new Date(Date.now() - OPTIONS.minutes * 60 * 1000);
    const formattedDate = lookbackDate.toISOString().split('.')[0] + 'Z';
    
    log.info(`Buscando tickets atualizados desde ${formattedDate}`);
    
    const allTickets = [];
    let page = 1;
    const perPage = 100;
    
    while (allTickets.length < OPTIONS.limit) {
        let url = `${FRESHDESK_BASE_URL}/tickets?per_page=${perPage}&page=${page}&updated_since=${formattedDate}&include=stats`;
        
        // Filtrar por status se especificado
        if (OPTIONS.status) {
            const statusMap = { open: 2, pending: 3, resolved: 4, closed: 5 };
            const statusCode = statusMap[OPTIONS.status.toLowerCase()];
            if (statusCode) {
                url += `&status=${statusCode}`;
            }
        }
        
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }
        
        const tickets = await response.json();
        
        if (!tickets || tickets.length === 0) break;
        
        allTickets.push(...tickets);
        log.verbose(`Página ${page}: ${tickets.length} tickets`);
        
        if (tickets.length < perPage) break;
        
        page++;
        await sleep(300);
    }
    
    // Aplicar limite
    const limited = allTickets.slice(0, OPTIONS.limit);
    log.success(`${limited.length} tickets encontrados`);
    
    return limited;
}

// Buscar conversas de um ticket
async function fetchConversations(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}/conversations`;
    
    try {
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        
        if (!response.ok) {
            if (response.status === 404) return [];
            log.verbose(`Erro ao buscar conversas do ticket ${ticketId}: ${response.status}`);
            return [];
        }
        
        return await response.json();
    } catch (error) {
        log.verbose(`Erro: ${error.message}`);
        return [];
    }
}

// Transformar conversa
function transformConversation(conv, ticketId) {
    return {
        id: conv.id,
        ticket_id: ticketId,
        body: conv.body || null,
        body_text: conv.body_text || null,
        incoming: conv.incoming || false,
        private: conv.private || false,
        user_id: conv.user_id || null,
        from_email: conv.from_email || null,
        to_emails: conv.to_emails || [],
        cc_emails: conv.cc_emails || [],
        bcc_emails: conv.bcc_emails || [],
        source: conv.source || null,
        support_email: conv.support_email || null,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        attachments: conv.attachments || []
    };
}

// Enviar para Supabase
async function upsertToSupabase(table, data) {
    if (OPTIONS.dryRun) {
        log.info(`[DRY-RUN] Enviaria ${data.length} registros para ${table}`);
        return { success: data.length, errors: 0 };
    }
    
    if (data.length === 0) return { success: 0, errors: 0 };
    
    const batchSize = 100;
    let success = 0;
    let errors = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        try {
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify(batch)
            });
            
            if (response.ok) {
                success += batch.length;
            } else {
                const errorText = await response.text();
                log.verbose(`Erro Supabase: ${errorText}`);
                errors += batch.length;
            }
        } catch (error) {
            log.verbose(`Erro: ${error.message}`);
            errors += batch.length;
        }
    }
    
    return { success, errors };
}

// Exibir resumo da conversa
function showConversationSummary(conv, index) {
    const from = conv.incoming ? '📩 Cliente' : '📤 Agente';
    const priv = conv.private ? '🔒' : '🌐';
    const preview = (conv.body_text || '').substring(0, 100).replace(/\n/g, ' ');
    console.log(`\n   ${index + 1}. ${from} ${priv} [${new Date(conv.created_at).toLocaleString('pt-BR')}]`);
    console.log(`      "${preview}${preview.length >= 100 ? '...' : ''}"`);
}

// Função principal
async function main() {
    const startTime = Date.now();
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     🔄 SYNC CONVERSATIONS LOCAL                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`   📅 ${new Date().toLocaleString('pt-BR')}`);
    console.log(`   🌐 Freshdesk: ${CONFIG.FRESHDESK_DOMAIN}`);
    console.log(`   📊 Supabase: ${CONFIG.SUPABASE_URL.split('//')[1]?.split('.')[0] || 'configurado'}`);
    
    if (OPTIONS.ticketId) {
        console.log(`   🎫 Ticket específico: #${OPTIONS.ticketId}`);
    } else {
        console.log(`   ⏱️  Período: últimos ${OPTIONS.minutes} minutos`);
        if (OPTIONS.status) console.log(`   📋 Status: ${OPTIONS.status}`);
        console.log(`   🔢 Limite: ${OPTIONS.limit} tickets`);
    }
    
    if (OPTIONS.dryRun) console.log('   ⚠️  MODO DRY-RUN (não envia para Supabase)');
    console.log('');
    
    try {
        // FASE 1: Buscar tickets
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 FASE 1: Buscando tickets\n');
        
        let tickets = [];
        
        if (OPTIONS.ticketId) {
            const ticket = await fetchTicketById(OPTIONS.ticketId);
            if (ticket) tickets = [ticket];
        } else {
            tickets = await fetchRecentTickets();
        }
        
        if (tickets.length === 0) {
            log.warn('Nenhum ticket encontrado. Verifique os filtros.');
            return;
        }
        
        // FASE 2: Buscar conversas
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💬 FASE 2: Buscando conversas\n');
        
        const allConversations = [];
        
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const convs = await fetchConversations(ticket.id);
            
            for (const conv of convs) {
                const transformed = transformConversation(conv, ticket.id);
                allConversations.push(transformed);
                
                if (OPTIONS.verbose) {
                    showConversationSummary(transformed, allConversations.length - 1);
                }
            }
            
            log.progress(i + 1, tickets.length, `${allConversations.length} conversas`);
            await sleep(200);
        }
        
        console.log('\n');
        log.success(`${allConversations.length} conversas de ${tickets.length} tickets`);
        
        // FASE 3: Enviar para Supabase
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 FASE 3: Enviando para Supabase\n');
        
        // Preparar dados dos tickets para atualização
        const ticketUpdates = tickets.map(t => ({
            id: t.id,
            updated_at: t.updated_at,
            status: t.status,
            subject: t.subject,
            priority: t.priority,
            stats_resolved_at: t.stats?.resolved_at || null,
            stats_closed_at: t.stats?.closed_at || null
        }));
        
        // Enviar tickets
        log.info('Atualizando tickets...');
        const ticketResult = await upsertToSupabase('Tickets', ticketUpdates);
        log.success(`Tickets: ${ticketResult.success} ok, ${ticketResult.errors} erros`);
        
        // Enviar conversas
        if (allConversations.length > 0) {
            log.info('Enviando conversas...');
            const convResult = await upsertToSupabase('ticket_conversations', allConversations);
            log.success(`Conversas: ${convResult.success} ok, ${convResult.errors} erros`);
        }
        
        // Resumo final
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║     ✅ SINCRONIZAÇÃO CONCLUÍDA                               ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log(`   ⏱️  Tempo: ${elapsed}s`);
        console.log(`   📊 Tickets: ${tickets.length}`);
        console.log(`   💬 Conversas: ${allConversations.length}`);
        
        if (OPTIONS.verbose && allConversations.length > 0) {
            console.log('\n📋 Últimas conversas:');
            const lastFive = allConversations.slice(-5);
            lastFive.forEach((conv, i) => showConversationSummary(conv, allConversations.length - 5 + i));
        }
        
        console.log('');
        
    } catch (error) {
        log.error(`ERRO: ${error.message}`);
        if (OPTIONS.verbose) console.error(error.stack);
        process.exit(1);
    }
}

// Executar
main();
