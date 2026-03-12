/**
 * VERIFICAÇÃO COMPLETA - Diagnóstico Pesado
 * 
 * Verifica TODA a diferença entre Supabase e Freshdesk
 * - Total de tickets em cada sistema
 * - IDs faltantes
 * - Status diferentes
 * - Tickets duplicados
 * 
 * EXECUTAR: node sync-freshdesk/verificacao-completa.js
 */

// Carregar dotenv se disponível
try { require('dotenv').config(); } catch(e) {}

// Credenciais (fallback para valores conhecidos se não estiverem no .env)
const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY || 's9GQtphoZqeRNz7Enl';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

console.log('🔑 Credenciais carregadas');
console.log(`   Freshdesk: ${FRESHDESK_DOMAIN}`);
console.log(`   Supabase: ${SUPABASE_URL.substring(0, 40)}...`);

const domain = FRESHDESK_DOMAIN.replace('https://', '').replace('http://', '').split('.')[0];
const FRESHDESK_BASE_URL = `https://${domain}.freshdesk.com/api/v2`;

const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                console.log(`   ⏳ Rate limited. Aguardando ${retryAfter}s...`);
                await sleep(retryAfter * 1000);
                continue;
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(2000);
        }
    }
    throw new Error('Max retries exceeded');
}

// ========================================
// COLETA DE DADOS
// ========================================

async function getSupabaseTicketIds() {
    console.log('📊 Buscando IDs de tickets do Supabase...');
    const ids = new Set();
    let offset = 0;
    const limit = 1000;

    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,updated_at&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, { headers: supabaseHeaders });
        
        if (!response.ok) {
            console.error('   ❌ Erro ao buscar do Supabase:', await response.text());
            break;
        }
        
        const data = await response.json();
        if (!data || data.length === 0) break;
        
        data.forEach(t => ids.add(t.id));
        console.log(`   Carregados ${ids.size} IDs...`);
        
        if (data.length < limit) break;
        offset += limit;
    }

    console.log(`   ✅ Total no Supabase: ${ids.size} tickets\n`);
    return ids;
}

async function getSupabaseTicketsData() {
    console.log('📊 Buscando dados completos do Supabase...');
    const tickets = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,updated_at,created_at&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, { headers: supabaseHeaders });
        
        if (!response.ok) break;
        
        const data = await response.json();
        if (!data || data.length === 0) break;
        
        tickets.push(...data);
        if (data.length < limit) break;
        offset += limit;
    }

    return tickets;
}

async function getFreshdeskTicketCount() {
    console.log('🔢 Contando tickets no Freshdesk...');
    
    // Método 1: Buscar por status e contar
    const statusCounts = {};
    const statusNames = {
        2: 'Aberto',
        3: 'Pendente', 
        4: 'Resolvido',
        5: 'Fechado',
        6: 'Aguard. Cliente',
        7: 'Aguard. Terceiros'
    };
    
    let total = 0;
    
    for (const status of [2, 3, 4, 5, 6, 7]) {
        let count = 0;
        let page = 1;
        
        while (page <= 100) {
            const url = `${FRESHDESK_BASE_URL}/tickets?status=${status}&per_page=100&page=${page}`;
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            
            if (!response.ok) break;
            
            const tickets = await response.json();
            if (!tickets || tickets.length === 0) break;
            
            count += tickets.length;
            if (tickets.length < 100) break;
            page++;
            await sleep(200);
        }
        
        statusCounts[status] = count;
        total += count;
        console.log(`   Status ${status} (${statusNames[status]}): ${count}`);
        await sleep(300);
    }
    
    console.log(`   ✅ Total no Freshdesk: ${total} tickets\n`);
    return { total, byStatus: statusCounts };
}

async function getAllFreshdeskTicketIds() {
    console.log('📥 Buscando TODOS os IDs do Freshdesk (pode demorar)...');
    const ids = new Set();
    let page = 1;
    
    while (page <= 200) { // Máximo de 200 páginas (20.000 tickets)
        const url = `${FRESHDESK_BASE_URL}/tickets?per_page=100&page=${page}`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        
        if (!response.ok) {
            if (response.status === 404) break;
            console.error(`   ❌ Erro página ${page}:`, response.status);
            break;
        }
        
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        
        tickets.forEach(t => ids.add(t.id));
        
        if (page % 10 === 0) {
            console.log(`   ${ids.size} IDs (página ${page})...`);
        }
        
        if (tickets.length < 100) break;
        page++;
        await sleep(200);
    }
    
    console.log(`   ✅ Total de IDs do Freshdesk: ${ids.size}\n`);
    return ids;
}

// ========================================
// ANÁLISE
// ========================================

function findMissingIds(freshdeskIds, supabaseIds) {
    const missing = [];
    const extra = [];
    
    for (const id of freshdeskIds) {
        if (!supabaseIds.has(id)) {
            missing.push(id);
        }
    }
    
    for (const id of supabaseIds) {
        if (!freshdeskIds.has(id)) {
            extra.push(id);
        }
    }
    
    return { missing, extra };
}

async function verifySpecificTickets(ticketIds) {
    console.log(`🔍 Verificando ${ticketIds.length} tickets específicos no Freshdesk...`);
    const results = [];
    
    for (const id of ticketIds.slice(0, 20)) {
        const url = `${FRESHDESK_BASE_URL}/tickets/${id}`;
        try {
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            if (response.ok) {
                const ticket = await response.json();
                results.push({
                    id: ticket.id,
                    status: ticket.status,
                    created: ticket.created_at,
                    exists: true
                });
                console.log(`   ✅ #${id}: existe (status=${ticket.status})`);
            } else if (response.status === 404) {
                results.push({ id, exists: false });
                console.log(`   ❌ #${id}: não encontrado`);
            }
        } catch (err) {
            console.log(`   ⚠️ #${id}: erro - ${err.message}`);
        }
        await sleep(250);
    }
    
    return results;
}

// ========================================
// SINCRONIZAÇÃO
// ========================================

async function syncMissingTickets(missingIds) {
    if (missingIds.length === 0) return 0;
    
    console.log(`\n🔄 SINCRONIZANDO ${missingIds.length} tickets faltantes...`);
    let synced = 0;
    
    const supabaseUpsertHeaders = {
        ...supabaseHeaders,
        'Prefer': 'resolution=merge-duplicates'
    };
    
    for (let i = 0; i < missingIds.length; i++) {
        const id = missingIds[i];
        const url = `${FRESHDESK_BASE_URL}/tickets/${id}?include=stats,requester`;
        
        try {
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            
            if (response.ok) {
                const ticket = await response.json();
                const cf = ticket.custom_fields || {};
                
                const transformed = {
                    id: ticket.id,
                    subject: ticket.subject,
                    description: ticket.description || null,
                    description_text: ticket.description_text || null,
                    status: ticket.status,
                    priority: ticket.priority,
                    source: ticket.source,
                    type: ticket.type,
                    requester_id: ticket.requester_id,
                    requester_name: ticket.requester?.name || null,
                    requester_email: ticket.requester?.email || null,
                    responder_id: ticket.responder_id,
                    group_id: ticket.group_id,
                    company_id: ticket.company_id,
                    created_at: ticket.created_at,
                    updated_at: ticket.updated_at,
                    due_by: ticket.due_by,
                    fr_due_by: ticket.fr_due_by,
                    is_escalated: ticket.is_escalated || false,
                    fr_escalated: ticket.fr_escalated || false,
                    tags: ticket.tags || [],
                    custom_fields: ticket.custom_fields || null,
                    cf_tratativa: cf.cf_tratativa || cf.cf_tratativa1684353202918 || null,
                    cf_grupo_tratativa: cf.cf_grupo_tratativa || cf.cf_grupo_tratativa1684353283756 || null,
                    cf_sistema: cf.cf_sistema || null,
                    cf_tipo_primario: cf.cf_tipo_primario || null,
                    cf_acompanhamento_atendimento: cf.cf_analista || null,
                    stats_agent_responded_at: ticket.stats?.agent_responded_at || null,
                    stats_first_responded_at: ticket.stats?.first_responded_at || null,
                    stats_status_updated_at: ticket.stats?.status_updated_at || null,
                    stats_resolved_at: ticket.stats?.resolved_at || null,
                    stats_closed_at: ticket.stats?.closed_at || null,
                    stats_pending_since: ticket.stats?.pending_since || null,
                    synced_at: new Date().toISOString()
                };
                
                // Upsert no Supabase
                const upsertResponse = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
                    method: 'POST',
                    headers: supabaseUpsertHeaders,
                    body: JSON.stringify([transformed])
                });
                
                if (upsertResponse.ok) {
                    synced++;
                    if (synced % 50 === 0) {
                        console.log(`   ${synced}/${missingIds.length} sincronizados...`);
                    }
                } else {
                    console.error(`   ❌ Erro upsert #${id}:`, await upsertResponse.text());
                }
            } else if (response.status === 404) {
                console.log(`   ⚠️ #${id}: não existe no Freshdesk (deletado?)`);
            }
        } catch (err) {
            console.error(`   ❌ Erro #${id}:`, err.message);
        }
        
        await sleep(300);
    }
    
    console.log(`   ✅ ${synced} tickets sincronizados\n`);
    return synced;
}

// ========================================
// RELATÓRIO
// ========================================

function generateReport(supabaseCount, freshdeskCount, missing, extra, statusCounts) {
    console.log('\n' + '═'.repeat(70));
    console.log('📋 RELATÓRIO DE VERIFICAÇÃO');
    console.log('═'.repeat(70));
    
    console.log(`\n📊 CONTAGEM TOTAL:`);
    console.log(`   Supabase:  ${supabaseCount} tickets`);
    console.log(`   Freshdesk: ${freshdeskCount.total} tickets`);
    console.log(`   Diferença: ${supabaseCount - freshdeskCount.total}`);
    
    console.log(`\n📈 POR STATUS (Freshdesk):`);
    const statusNames = {
        2: 'Aberto',
        3: 'Pendente',
        4: 'Resolvido', 
        5: 'Fechado',
        6: 'Aguard. Cliente',
        7: 'Aguard. Terceiros'
    };
    for (const [status, count] of Object.entries(freshdeskCount.byStatus)) {
        console.log(`   ${statusNames[status]}: ${count}`);
    }
    
    if (missing.length > 0) {
        console.log(`\n🚨 FALTANDO NO SUPABASE: ${missing.length} tickets`);
        console.log(`   Primeiros 20: ${missing.slice(0, 20).join(', ')}`);
    } else {
        console.log(`\n✅ NENHUM TICKET FALTANDO NO SUPABASE`);
    }
    
    if (extra.length > 0) {
        console.log(`\n⚠️ EXTRAS NO SUPABASE (não existem no Freshdesk?): ${extra.length} tickets`);
        console.log(`   Primeiros 20: ${extra.slice(0, 20).join(', ')}`);
    }
    
    console.log('\n' + '═'.repeat(70));
}

// ========================================
// MAIN
// ========================================

async function main() {
    const startTime = Date.now();
    
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║         VERIFICAÇÃO COMPLETA - SUPABASE vs FRESHDESK              ║');
    console.log('╠' + '═'.repeat(68) + '╣');
    console.log(`║ Data: ${new Date().toISOString()}                          ║`);
    console.log('╚' + '═'.repeat(68) + '╝\n');
    
    // 1. Buscar contagem do Freshdesk por status
    const freshdeskCount = await getFreshdeskTicketCount();
    
    // 2. Buscar IDs do Supabase
    const supabaseIds = await getSupabaseTicketIds();
    
    // 3. Buscar TODOS os IDs do Freshdesk
    const freshdeskIds = await getAllFreshdeskTicketIds();
    
    // 4. Encontrar diferenças
    const { missing, extra } = findMissingIds(freshdeskIds, supabaseIds);
    
    // 5. Gerar relatório
    generateReport(supabaseIds.size, freshdeskCount, missing, extra);
    
    // 6. Perguntar se deve sincronizar
    if (missing.length > 0) {
        console.log('\n🔄 SINCRONIZANDO TICKETS FALTANTES...\n');
        await syncMissingTickets(missing);
        
        // Verificar novamente
        console.log('\n🔍 VERIFICANDO NOVAMENTE...\n');
        const newSupabaseIds = await getSupabaseTicketIds();
        const newMissing = [];
        for (const id of freshdeskIds) {
            if (!newSupabaseIds.has(id)) newMissing.push(id);
        }
        
        if (newMissing.length === 0) {
            console.log('✅ TODOS os tickets estão sincronizados!');
        } else {
            console.log(`⚠️ Ainda faltam ${newMissing.length} tickets`);
        }
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n⏱️ Verificação concluída em ${duration} minutos`);
}

main().catch(err => {
    console.error('\n❌ ERRO FATAL:', err);
    process.exit(1);
});
