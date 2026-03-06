/**
 * INTEGRITY CHECK - Verificação de Integridade do Banco
 * 
 * Detecta problemas como:
 * - Tickets faltando no banco
 * - Tickets com dados desatualizados (como o caso Ailanie)
 * - Tags diferentes entre Freshdesk e Supabase
 * - Tickets sem conversas
 * - Dados incompletos (sem subject, etc)
 * 
 * DEVE RODAR DIARIAMENTE para garantir consistência
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!FRESHDESK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente faltando');
    process.exit(1);
}

let domain = FRESHDESK_DOMAIN.replace('https://', '').replace('http://', '').split('.')[0];
const FRESHDESK_BASE_URL = `https://${domain}.freshdesk.com/api/v2`;

const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                await sleep(retryAfter * 1000);
                continue;
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(2000);
        }
    }
}

// ========================================
// COLETA DE DADOS
// ========================================

async function getSupabaseTickets() {
    let all = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,subject,status,tags,updated_at,synced_at&order=id.desc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });

        if (!response.ok) break;
        const data = await response.json();
        if (!data || data.length === 0) break;

        all = all.concat(data);
        if (data.length < limit) break;
        offset += limit;
    }

    return all;
}

async function getSupabaseConversations() {
    const ticketIds = new Set();
    let offset = 0;
    const limit = 1000;

    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/conversations?select=ticket_id&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });

        if (!response.ok) break;
        const data = await response.json();
        if (!data || data.length === 0) break;

        data.forEach(c => ticketIds.add(c.ticket_id));
        if (data.length < limit) break;
        offset += limit;
    }

    return ticketIds;
}

async function getFreshdeskTicketCount() {
    // Busca tickets abertos para ter uma ideia do total atual
    let total = 0;
    for (const status of [2, 3, 4, 5, 6, 7]) { // Todos os status
        const url = `${FRESHDESK_BASE_URL}/tickets?status=${status}&per_page=1`;
        try {
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            if (response.ok) {
                const link = response.headers.get('link');
                // Estimar pelo header ou contar
            }
        } catch {}
        await sleep(200);
    }
    return total;
}

async function getFreshdeskRecentTickets(hours = 168) { // Última semana
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const allTickets = [];
    let page = 1;

    while (page <= 30) {
        const url = `${FRESHDESK_BASE_URL}/tickets?updated_since=${since}&per_page=100&page=${page}`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) break;

        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;

        allTickets.push(...tickets);
        if (tickets.length < 100) break;
        page++;
        await sleep(250);
    }

    return allTickets;
}

// ========================================
// VERIFICAÇÕES
// ========================================

function checkIncompleteTickets(supabaseTickets) {
    const issues = [];

    for (const ticket of supabaseTickets) {
        if (!ticket.subject) {
            issues.push({ id: ticket.id, reason: 'sem subject' });
        }
    }

    return issues;
}

function checkMissingTickets(freshdeskTickets, supabaseMap) {
    const missing = [];

    for (const ticket of freshdeskTickets) {
        if (!supabaseMap.has(ticket.id)) {
            missing.push(ticket.id);
        }
    }

    return missing;
}

function checkOutdatedTickets(freshdeskTickets, supabaseMap) {
    const outdated = [];

    for (const fdTicket of freshdeskTickets) {
        const sbTicket = supabaseMap.get(fdTicket.id);
        if (!sbTicket) continue;

        const fdUpdated = new Date(fdTicket.updated_at).getTime();
        const sbUpdated = new Date(sbTicket.updated_at).getTime();

        // Se Freshdesk foi atualizado depois do Supabase
        if (fdUpdated > sbUpdated + 60000) { // 1 minuto de tolerância
            outdated.push({
                id: fdTicket.id,
                freshdeskUpdated: fdTicket.updated_at,
                supabaseUpdated: sbTicket.updated_at,
                diff: Math.round((fdUpdated - sbUpdated) / 1000 / 60) + ' min'
            });
        }
    }

    return outdated;
}

function checkTagsMismatch(freshdeskTickets, supabaseMap) {
    const mismatches = [];

    for (const fdTicket of freshdeskTickets) {
        const sbTicket = supabaseMap.get(fdTicket.id);
        if (!sbTicket) continue;

        const fdTags = (fdTicket.tags || []).sort().join(',');
        const sbTags = (sbTicket.tags || []).sort().join(',');

        if (fdTags !== sbTags) {
            mismatches.push({
                id: fdTicket.id,
                freshdeskTags: fdTicket.tags || [],
                supabaseTags: sbTicket.tags || []
            });
        }
    }

    return mismatches;
}

function checkMissingConversations(supabaseTickets, conversationTicketIds) {
    // Verificar apenas tickets recentes (últimos 500)
    const recentTickets = supabaseTickets
        .filter(t => t.status === 2 || t.status === 3 || t.status === 6) // Abertos
        .slice(0, 500);

    const missing = [];

    for (const ticket of recentTickets) {
        if (!conversationTicketIds.has(ticket.id)) {
            missing.push(ticket.id);
        }
    }

    return missing;
}

// ========================================
// RELATÓRIO
// ========================================

function generateReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            supabaseTickets: results.supabaseCount,
            freshdeskSampled: results.freshdeskCount,
            problems: 0
        },
        issues: {}
    };

    // Tickets incompletos
    if (results.incomplete.length > 0) {
        report.issues.incompleteTickets = {
            count: results.incomplete.length,
            severity: 'HIGH',
            tickets: results.incomplete.slice(0, 20)
        };
        report.summary.problems += results.incomplete.length;
    }

    // Tickets faltando
    if (results.missing.length > 0) {
        report.issues.missingTickets = {
            count: results.missing.length,
            severity: 'CRITICAL',
            tickets: results.missing.slice(0, 20)
        };
        report.summary.problems += results.missing.length;
    }

    // Tickets desatualizados
    if (results.outdated.length > 0) {
        report.issues.outdatedTickets = {
            count: results.outdated.length,
            severity: 'HIGH',
            tickets: results.outdated.slice(0, 20)
        };
        report.summary.problems += results.outdated.length;
    }

    // Tags diferentes (problema Ailanie)
    if (results.tagsMismatch.length > 0) {
        report.issues.tagsMismatch = {
            count: results.tagsMismatch.length,
            severity: 'CRITICAL', // Causa dados errados no BI
            tickets: results.tagsMismatch.slice(0, 20)
        };
        report.summary.problems += results.tagsMismatch.length;
    }

    // Tickets sem conversas
    if (results.missingConversations.length > 0) {
        report.issues.missingConversations = {
            count: results.missingConversations.length,
            severity: 'MEDIUM',
            tickets: results.missingConversations.slice(0, 20)
        };
    }

    return report;
}

// ========================================
// MAIN
// ========================================

async function main() {
    console.log('═'.repeat(60));
    console.log('🔍 INTEGRITY CHECK - Verificação de Integridade');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('═'.repeat(60) + '\n');

    const startTime = Date.now();

    // 1. Coletar dados
    console.log('📊 Coletando dados...\n');

    const [supabaseTickets, conversationTicketIds, freshdeskTickets] = await Promise.all([
        getSupabaseTickets(),
        getSupabaseConversations(),
        getFreshdeskRecentTickets(168) // Última semana
    ]);

    console.log(`   Supabase: ${supabaseTickets.length} tickets`);
    console.log(`   Supabase: ${conversationTicketIds.size} tickets com conversas`);
    console.log(`   Freshdesk (7 dias): ${freshdeskTickets.length} tickets`);

    // 2. Criar mapa do Supabase
    const supabaseMap = new Map(supabaseTickets.map(t => [t.id, t]));

    // 3. Executar verificações
    console.log('\n🔍 Executando verificações...\n');

    const results = {
        supabaseCount: supabaseTickets.length,
        freshdeskCount: freshdeskTickets.length,
        incomplete: checkIncompleteTickets(supabaseTickets),
        missing: checkMissingTickets(freshdeskTickets, supabaseMap),
        outdated: checkOutdatedTickets(freshdeskTickets, supabaseMap),
        tagsMismatch: checkTagsMismatch(freshdeskTickets, supabaseMap),
        missingConversations: checkMissingConversations(supabaseTickets, conversationTicketIds)
    };

    // 4. Gerar relatório
    const report = generateReport(results);

    // 5. Exibir resultados
    console.log('─'.repeat(60));
    console.log('📋 RESULTADOS');
    console.log('─'.repeat(60));

    if (results.incomplete.length > 0) {
        console.log(`\n❌ ${results.incomplete.length} TICKETS INCOMPLETOS (sem subject)`);
        results.incomplete.slice(0, 10).forEach(t => {
            console.log(`   #${t.id}: ${t.reason}`);
        });
    }

    if (results.missing.length > 0) {
        console.log(`\n🚨 ${results.missing.length} TICKETS FALTANDO NO SUPABASE`);
        console.log(`   IDs: ${results.missing.slice(0, 20).join(', ')}${results.missing.length > 20 ? '...' : ''}`);
    }

    if (results.outdated.length > 0) {
        console.log(`\n⚠️ ${results.outdated.length} TICKETS DESATUALIZADOS`);
        results.outdated.slice(0, 10).forEach(t => {
            console.log(`   #${t.id}: atrasado ${t.diff}`);
        });
    }

    if (results.tagsMismatch.length > 0) {
        console.log(`\n🏷️ ${results.tagsMismatch.length} TICKETS COM TAGS DIFERENTES (tipo Ailanie!)`);
        results.tagsMismatch.slice(0, 10).forEach(t => {
            console.log(`   #${t.id}: FD=[${t.freshdeskTags.join(',')}] ≠ SB=[${t.supabaseTags.join(',')}]`);
        });
    }

    if (results.missingConversations.length > 0) {
        console.log(`\n💬 ${results.missingConversations.length} TICKETS ABERTOS SEM CONVERSAS`);
    }

    // 6. Resumo final
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '═'.repeat(60));
    if (report.summary.problems === 0) {
        console.log('✅ NENHUM PROBLEMA ENCONTRADO!');
    } else {
        console.log(`⚠️ ${report.summary.problems} PROBLEMAS ENCONTRADOS`);
        console.log('\n   Execute: node sync-freshdesk/sync-smart.js quick');
        console.log('   Para corrigir automaticamente os problemas.');
    }
    console.log(`\n⏱️ Verificação concluída em ${duration}s`);
    console.log('═'.repeat(60));

    // Se houver problemas críticos, sair com erro
    if (results.missing.length > 0 || results.tagsMismatch.length > 10) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('\n❌ ERRO:', err.message);
    process.exit(1);
});
