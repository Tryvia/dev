/**
 * SYNC SMART - Sincronização Inteligente Unificada
 * 
 * Combina todas as funcionalidades em um único script:
 * - Modo FULL: Sincroniza TUDO (tickets, conversas, CSAT, metadata)
 * - Modo QUICK: Apenas tickets recentes + verificação de integridade
 * - Modo VERIFY: Apenas verifica inconsistências sem modificar
 * 
 * PROTEÇÕES:
 * - Detecta tickets que mudaram no Freshdesk mas não no banco
 * - Verifica se todos os tickets do Freshdesk estão no banco
 * - Nunca deleta dados - apenas adiciona/atualiza
 * - Valida campos obrigatórios e loga faltantes (opcional)
 * 
 * USO:
 *   node sync-smart.js full              # Sync completo com validação
 *   node sync-smart.js quick             # Sync rápido com validação
 *   node sync-smart.js verify            # Apenas verifica
 *   node sync-smart.js quick --no-validate   # Sync sem validação
 *   node sync-smart.js full --no-validate    # Sync completo sem validação
 * 
 * FLAGS:
 *   --no-validate   Desabilita validação de campos
 *   --send-logs     Força envio de logs (GitHub/Supabase conforme config)
 */

// Validador de campos
const { validateAndLog, flushLogs, resetLogs } = require('./field-validator');

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Flags de execução
const args = process.argv.slice(2);
const MODE = (args.find(a => !a.startsWith('--')) || 'quick').toLowerCase();
const VALIDATE_ENABLED = !args.includes('--no-validate');
const SEND_LOGS_ENABLED = args.includes('--send-logs');
const VALID_MODES = ['full', 'quick', 'verify'];

if (!VALID_MODES.includes(MODE)) {
    console.error(`❌ Modo inválido: ${MODE}`);
    console.error(`   Modos válidos: ${VALID_MODES.join(', ')}`);
    process.exit(1);
}

if (!FRESHDESK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente faltando:');
    console.error(`   FRESHDESK_API_KEY: ${FRESHDESK_API_KEY ? '✓' : '✗'}`);
    console.error(`   SUPABASE_URL: ${SUPABASE_URL ? '✓' : '✗'}`);
    console.error(`   SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? '✓' : '✗'}`);
    process.exit(1);
}

let domain = FRESHDESK_DOMAIN.replace('https://', '').replace('http://', '').split('.')[0];
const FRESHDESK_BASE_URL = `https://${domain}.freshdesk.com/api/v2`;

const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

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

async function upsertToSupabase(table, data) {
    if (!data || data.length === 0) return { inserted: 0, updated: 0 };

    const batchSize = 500;
    let total = 0;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(batch)
        });

        if (response.ok) {
            total += batch.length;
        } else {
            const err = await response.text();
            console.error(`   ❌ Erro em ${table}: ${err.substring(0, 200)}`);
        }
    }

    return { inserted: 0, updated: total };
}

// ========================================
// FUNÇÕES DE BUSCA - FRESHDESK
// ========================================

async function fetchAllTicketsFreshdesk() {
    console.log('📥 Buscando TODOS os tickets do Freshdesk...');
    const allTickets = [];
    let page = 1;

    while (true) {
        const url = `${FRESHDESK_BASE_URL}/tickets?per_page=100&page=${page}&include=stats,requester`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) {
            if (response.status === 404) break;
            throw new Error(`Freshdesk error: ${response.status}`);
        }

        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;

        allTickets.push(...tickets);

        if (page % 10 === 0) {
            console.log(`   ${allTickets.length} tickets...`);
        }

        if (tickets.length < 100) break;
        page++;
        await sleep(250);
    }

    console.log(`   ✅ ${allTickets.length} tickets obtidos do Freshdesk`);
    return allTickets;
}

async function fetchRecentTicketsFreshdesk(hours = 48) {
    console.log(`📥 Buscando tickets atualizados nas últimas ${hours}h...`);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const allTickets = [];
    let page = 1;

    while (page <= 20) {
        const url = `${FRESHDESK_BASE_URL}/tickets?updated_since=${since}&per_page=100&page=${page}&include=stats,requester`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) break;

        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;

        allTickets.push(...tickets);
        if (tickets.length < 100) break;
        page++;
        await sleep(250);
    }

    console.log(`   ✅ ${allTickets.length} tickets recentes`);
    return allTickets;
}

async function fetchConversations(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}/conversations`;
    try {
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ========================================
// FUNÇÕES DE BUSCA - SUPABASE
// ========================================

async function getSupabaseTickets() {
    console.log('📊 Buscando tickets do Supabase...');
    let allTickets = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,tags,updated_at,synced_at&order=id.desc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });

        if (!response.ok) break;
        const data = await response.json();
        if (!data || data.length === 0) break;

        allTickets = allTickets.concat(data);
        if (data.length < limit) break;
        offset += limit;
    }

    console.log(`   ✅ ${allTickets.length} tickets no Supabase`);
    return allTickets;
}

async function getSupabaseConversationTickets() {
    console.log('💬 Verificando tickets com conversas...');
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

    console.log(`   ✅ ${ticketIds.size} tickets com conversas`);
    return ticketIds;
}

// ========================================
// TRANSFORMAÇÃO DE DADOS
// ========================================

function transformTicket(ticket) {
    const cf = ticket.custom_fields || {};
    return {
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
        product_id: ticket.product_id || null,
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
        cf_prioridade_dev: cf.cf_prioridade_dev || null,
        cf_situacao: cf.cf_situacao || cf.cf_situao || null,
        cf_acompanhamento_atendimento: cf.cf_analista || null,
        cf_acompanhamento_implantacao: cf.cf_acompanhamento_implantao || cf.cf_acompanhamento_implantacao || null,
        cf_acompanhamento_produto: cf.cf_acompanhamento_produto || null,
        stats_agent_responded_at: ticket.stats?.agent_responded_at || null,
        stats_first_responded_at: ticket.stats?.first_responded_at || null,
        stats_status_updated_at: ticket.stats?.status_updated_at || null,
        stats_resolved_at: ticket.stats?.resolved_at || null,
        stats_closed_at: ticket.stats?.closed_at || null,
        stats_pending_since: ticket.stats?.pending_since || null,
        synced_at: new Date().toISOString()
    };
}

function transformConversation(conv, ticketId) {
    return {
        id: conv.id,
        ticket_id: ticketId,
        user_id: conv.user_id,
        from_email: conv.from_email || null,
        to_emails: conv.to_emails || [],
        cc_emails: conv.cc_emails || [],
        body: conv.body || null,
        body_text: conv.body_text || null,
        incoming: conv.incoming || false,
        private: conv.private || false,
        source: conv.source,
        created_at: conv.created_at,
        updated_at: conv.updated_at
    };
}

// ========================================
// VERIFICAÇÃO DE INTEGRIDADE
// ========================================

async function verifyIntegrity(freshdeskTickets, supabaseTickets) {
    console.log('\n🔍 VERIFICAÇÃO DE INTEGRIDADE');
    console.log('─'.repeat(50));

    const supabaseMap = new Map(supabaseTickets.map(t => [t.id, t]));
    const issues = {
        missingInSupabase: [],
        outdatedInSupabase: [],
        tagsMismatch: []
    };

    for (const fdTicket of freshdeskTickets) {
        const sbTicket = supabaseMap.get(fdTicket.id);

        if (!sbTicket) {
            issues.missingInSupabase.push(fdTicket.id);
            continue;
        }

        // Verificar se updated_at é diferente (ticket mudou no Freshdesk)
        const fdUpdated = new Date(fdTicket.updated_at).getTime();
        const sbUpdated = new Date(sbTicket.updated_at).getTime();

        if (fdUpdated > sbUpdated) {
            issues.outdatedInSupabase.push({
                id: fdTicket.id,
                freshdesk: fdTicket.updated_at,
                supabase: sbTicket.updated_at
            });
        }

        // Verificar tags (problema da Ailanie)
        const fdTags = JSON.stringify(fdTicket.tags?.sort() || []);
        const sbTags = JSON.stringify(sbTicket.tags?.sort() || []);

        if (fdTags !== sbTags) {
            issues.tagsMismatch.push({
                id: fdTicket.id,
                freshdesk: fdTicket.tags,
                supabase: sbTicket.tags
            });
        }
    }

    // Reportar problemas
    if (issues.missingInSupabase.length > 0) {
        console.log(`   ❌ ${issues.missingInSupabase.length} tickets faltando no Supabase`);
        if (issues.missingInSupabase.length <= 10) {
            console.log(`      IDs: ${issues.missingInSupabase.join(', ')}`);
        }
    }

    if (issues.outdatedInSupabase.length > 0) {
        console.log(`   ⚠️ ${issues.outdatedInSupabase.length} tickets desatualizados`);
        if (issues.outdatedInSupabase.length <= 5) {
            issues.outdatedInSupabase.forEach(t => {
                console.log(`      #${t.id}: FD=${t.freshdesk.substring(0, 10)} | SB=${t.supabase.substring(0, 10)}`);
            });
        }
    }

    if (issues.tagsMismatch.length > 0) {
        console.log(`   🏷️ ${issues.tagsMismatch.length} tickets com tags diferentes`);
        issues.tagsMismatch.slice(0, 5).forEach(t => {
            console.log(`      #${t.id}: FD=[${t.freshdesk?.join(',')}] | SB=[${t.supabase?.join(',')}]`);
        });
    }

    const totalIssues = issues.missingInSupabase.length + issues.outdatedInSupabase.length + issues.tagsMismatch.length;

    if (totalIssues === 0) {
        console.log(`   ✅ Nenhuma inconsistência encontrada!`);
    }

    return issues;
}

// ========================================
// SYNC QUICK - Rápido com verificação
// ========================================

async function syncQuick() {
    console.log('⚡ SYNC QUICK - Sincronização rápida com verificação\n');

    // 1. Buscar dados
    const [freshdeskTickets, supabaseTickets] = await Promise.all([
        fetchRecentTicketsFreshdesk(48), // Últimas 48h
        getSupabaseTickets()
    ]);

    // 2. Verificar integridade
    const issues = await verifyIntegrity(freshdeskTickets, supabaseTickets);

    // 3. Sincronizar tickets
    console.log('\n📤 Sincronizando tickets...');
    const transformedTickets = freshdeskTickets.map(transformTicket);
    if (VALIDATE_ENABLED) validateAndLog(transformedTickets, 'ticket');
    const result = await upsertToSupabase('tickets', transformedTickets);
    console.log(`   ✅ ${result.updated} tickets sincronizados`);

    // 4. Sincronizar tickets faltantes (se houver)
    if (issues.missingInSupabase.length > 0) {
        console.log(`\n🔄 Buscando ${issues.missingInSupabase.length} tickets faltantes...`);
        for (const ticketId of issues.missingInSupabase.slice(0, 50)) {
            const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}?include=stats,requester`;
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            if (response.ok) {
                const ticket = await response.json();
                await upsertToSupabase('tickets', [transformTicket(ticket)]);
            }
            await sleep(300);
        }
        console.log(`   ✅ Tickets faltantes sincronizados`);
    }

    // 5. Corrigir tags desatualizadas (problema Ailanie)
    if (issues.tagsMismatch.length > 0) {
        console.log(`\n🏷️ Corrigindo ${issues.tagsMismatch.length} tickets com tags diferentes...`);
        const ticketsToFix = [];
        for (const issue of issues.tagsMismatch) {
            const fdTicket = freshdeskTickets.find(t => t.id === issue.id);
            if (fdTicket) {
                ticketsToFix.push(transformTicket(fdTicket));
            }
        }
        if (ticketsToFix.length > 0) {
            await upsertToSupabase('tickets', ticketsToFix);
            console.log(`   ✅ Tags corrigidas`);
        }
    }

    return { tickets: transformedTickets.length, issues };
}

// ========================================
// SYNC FULL - Completo
// ========================================

async function syncFull() {
    console.log('🔄 SYNC FULL - Sincronização completa\n');

    // 1. Buscar TODOS os tickets
    if (VALIDATE_ENABLED) resetLogs();
    const freshdeskTickets = await fetchAllTicketsFreshdesk();
    const transformedTickets = freshdeskTickets.map(transformTicket);
    if (VALIDATE_ENABLED) validateAndLog(transformedTickets, 'ticket');

    // 2. Sincronizar tickets
    console.log('\n📤 Sincronizando tickets...');
    await upsertToSupabase('tickets', transformedTickets);
    console.log(`   ✅ ${transformedTickets.length} tickets`);

    // 3. Buscar e sincronizar conversas
    console.log('\n💬 Sincronizando conversas...');
    const ticketsComConvs = await getSupabaseConversationTickets();
    const ticketsSemConvs = freshdeskTickets
        .filter(t => !ticketsComConvs.has(t.id))
        .slice(0, 500); // Limitar para não demorar muito

    let totalConvs = 0;
    for (let i = 0; i < ticketsSemConvs.length; i++) {
        const convs = await fetchConversations(ticketsSemConvs[i].id);
        if (convs.length > 0) {
            const transformed = convs.map(c => transformConversation(c, ticketsSemConvs[i].id));
            await upsertToSupabase('conversations', transformed);
            totalConvs += transformed.length;
        }

        if ((i + 1) % 50 === 0) {
            console.log(`   ${i + 1}/${ticketsSemConvs.length} tickets | ${totalConvs} conversas`);
        }
        await sleep(250);
    }
    console.log(`   ✅ ${totalConvs} conversas`);

    // 4. Metadata (agents, groups, companies)
    console.log('\n📋 Sincronizando metadata...');
    await syncMetadata();

    // 5. CSAT
    console.log('\n⭐ Sincronizando CSAT...');
    await syncCSAT();

    return { tickets: transformedTickets.length, conversations: totalConvs };
}

async function syncMetadata() {
    const now = new Date().toISOString();

    // Agents
    const agentsRes = await fetchWithRetry(`${FRESHDESK_BASE_URL}/agents?per_page=100`, { headers: freshdeskHeaders });
    if (agentsRes.ok) {
        const agents = await agentsRes.json();
        const agentsData = agents.map(a => ({
            id: a.id,
            contact_id: a.contact_id,
            name: a.contact?.name || a.name,
            email: a.contact?.email || a.email,
            active: a.active,
            group_ids: a.group_ids,
            synced_at: now
        }));
        await upsertToSupabase('agents', agentsData);
        console.log(`   ✅ ${agentsData.length} agents`);
    }

    // Groups
    const groupsRes = await fetchWithRetry(`${FRESHDESK_BASE_URL}/groups?per_page=100`, { headers: freshdeskHeaders });
    if (groupsRes.ok) {
        const groups = await groupsRes.json();
        const groupsData = groups.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            synced_at: now
        }));
        await upsertToSupabase('groups', groupsData);
        console.log(`   ✅ ${groupsData.length} groups`);
    }

    // Companies
    let allCompanies = [];
    let page = 1;
    while (page <= 10) {
        const res = await fetchWithRetry(`${FRESHDESK_BASE_URL}/companies?per_page=100&page=${page}`, { headers: freshdeskHeaders });
        if (!res.ok) break;
        const data = await res.json();
        if (!data || data.length === 0) break;
        allCompanies.push(...data);
        if (data.length < 100) break;
        page++;
        await sleep(300);
    }
    const companiesData = allCompanies.map(c => ({
        id: c.id,
        name: c.name,
        domains: c.domains,
        synced_at: now
    }));
    await upsertToSupabase('companies', companiesData);
    console.log(`   ✅ ${companiesData.length} companies`);
}

async function syncCSAT() {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 dias
    let allRatings = [];
    let page = 1;

    while (page <= 20) {
        const url = `${FRESHDESK_BASE_URL}/surveys/satisfaction_ratings?created_since=${since}&per_page=100&page=${page}`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        if (!response.ok) break;

        const ratings = await response.json();
        if (!ratings || ratings.length === 0) break;

        allRatings.push(...ratings);
        if (ratings.length < 100) break;
        page++;
        await sleep(300);
    }

    if (allRatings.length > 0) {
        const ratingsData = allRatings.map(r => ({
            id: r.id,
            ticket_id: r.ticket_id,
            survey_id: r.survey_id,
            user_id: r.user_id,
            agent_id: r.agent_id,
            group_id: r.group_id,
            feedback: r.feedback,
            ratings: r.ratings,
            created_at: r.created_at,
            updated_at: r.updated_at,
            synced_at: new Date().toISOString()
        }));
        await upsertToSupabase('satisfaction_ratings', ratingsData);
        console.log(`   ✅ ${ratingsData.length} ratings`);
    }
}

// ========================================
// VERIFY ONLY
// ========================================

async function verifyOnly() {
    console.log('🔍 VERIFY - Apenas verificação\n');

    const [freshdeskTickets, supabaseTickets] = await Promise.all([
        fetchRecentTicketsFreshdesk(168), // Última semana
        getSupabaseTickets()
    ]);

    await verifyIntegrity(freshdeskTickets, supabaseTickets);

    // Verificar conversas
    const ticketsComConvs = await getSupabaseConversationTickets();
    const recentTickets = freshdeskTickets.filter(t => t.id > 6000);
    const semConvs = recentTickets.filter(t => !ticketsComConvs.has(t.id));

    console.log(`\n💬 Conversas:`);
    console.log(`   ${ticketsComConvs.size} tickets têm conversas`);
    console.log(`   ${semConvs.length} tickets recentes sem conversas`);

    return { verified: freshdeskTickets.length };
}

// ========================================
// MAIN
// ========================================

async function main() {
    const startTime = Date.now();

    console.log('═'.repeat(60));
    console.log(`🔄 SYNC SMART - Modo: ${MODE.toUpperCase()}`);
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🌐 Freshdesk: ${domain}.freshdesk.com`);
    console.log('═'.repeat(60) + '\n');

    let result;

    switch (MODE) {
        case 'full':
            result = await syncFull();
            break;
        case 'quick':
            result = await syncQuick();
            break;
        case 'verify':
            result = await verifyOnly();
            break;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Enviar logs de validação (se habilitado)
    if (VALIDATE_ENABLED && SEND_LOGS_ENABLED) {
        await flushLogs();
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`✅ CONCLUÍDO em ${duration}s`);
    console.log(`📊 Validação: ${VALIDATE_ENABLED ? 'ON' : 'OFF'} | Envio de logs: ${SEND_LOGS_ENABLED ? 'ON' : 'OFF'}`);
    console.log('═'.repeat(60));
}

main().catch(async (err) => {
    console.error('\n❌ ERRO:', err.message);
    console.error(err.stack);
    if (VALIDATE_ENABLED && SEND_LOGS_ENABLED) await flushLogs();
    process.exit(1);
});
