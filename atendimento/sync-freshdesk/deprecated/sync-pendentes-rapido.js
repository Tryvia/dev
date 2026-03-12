/**
 * SYNC PENDENTES RÁPIDO - Busca todos os pendentes do Freshdesk e atualiza
 */

const FRESHDESK_DOMAIN = 'suportetryvia';
const FRESHDESK_API_KEY = 's9GQtphoZqeRNz7Enl';
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const FRESHDESK_BASE_URL = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2`;

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

async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        const response = await fetch(url, options);
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            console.log(`   ⏳ Rate limit, aguardando ${retryAfter}s...`);
            await sleep(retryAfter * 1000);
            continue;
        }
        return response;
    }
    throw new Error('Max retries');
}

async function getAllFreshdeskPendingTickets() {
    console.log('📥 Buscando TODOS os tickets pendentes do Freshdesk...\n');
    
    const allTickets = [];
    
    // Buscar por filter_name que retorna todos não-fechados
    // Opção 1: usar filter all_tickets
    // Opção 2: buscar por updated_since com data antiga
    
    const updatedSince = '2020-01-01T00:00:00Z';
    let page = 1;
    
    while (page <= 100) {
        const url = `${FRESHDESK_BASE_URL}/tickets?updated_since=${updatedSince}&per_page=100&page=${page}&include=stats`;
        
        try {
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            
            if (!response.ok) {
                console.log(`   Página ${page}: erro ${response.status}`);
                break;
            }
            
            const tickets = await response.json();
            if (!tickets || tickets.length === 0) break;
            
            // Filtrar apenas pendentes (não 4 ou 5)
            const pending = tickets.filter(t => t.status !== 4 && t.status !== 5);
            allTickets.push(...pending);
            
            console.log(`   Página ${page}: ${tickets.length} tickets, ${pending.length} pendentes`);
            
            if (tickets.length < 100) break;
            page++;
            await sleep(300);
        } catch (e) {
            console.log(`   Erro: ${e.message}`);
            break;
        }
    }
    
    console.log(`\n   ✅ Total pendentes no Freshdesk: ${allTickets.length}\n`);
    return allTickets;
}

async function getSupabasePendingIds() {
    console.log('📊 Buscando IDs pendentes do Supabase...\n');
    
    const PENDING_STATUSES = [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const statusFilter = PENDING_STATUSES.map(s => `status.eq.${s}`).join(',');
    
    let allIds = new Map();
    let offset = 0;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status&or=(${statusFilter})&order=id.asc&offset=${offset}&limit=1000`;
        const response = await fetch(url, { headers: supabaseHeaders });
        
        if (!response.ok) break;
        
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        
        tickets.forEach(t => allIds.set(t.id, t.status));
        if (tickets.length < 1000) break;
        offset += 1000;
    }
    
    console.log(`   ✅ ${allIds.size} pendentes no Supabase\n`);
    return allIds;
}

async function upsertTickets(tickets) {
    if (tickets.length === 0) return;
    
    const data = tickets.map(t => {
        const cf = t.custom_fields || {};
        return {
            id: t.id,
            subject: t.subject,
            status: t.status,
            priority: t.priority,
            source: t.source,
            type: t.type,
            updated_at: t.updated_at,
            created_at: t.created_at,
            due_by: t.due_by,
            fr_due_by: t.fr_due_by,
            responder_id: t.responder_id,
            group_id: t.group_id,
            company_id: t.company_id,
            requester_id: t.requester_id,
            tags: t.tags || [],
            is_escalated: t.is_escalated || false,
            fr_escalated: t.fr_escalated || false,
            cf_tratativa: cf.cf_tratativa || cf.cf_tratativa1684353202918 || null,
            cf_grupo_tratativa: cf.cf_grupo_tratativa || cf.cf_grupo_tratativa1684353283756 || null,
            cf_sistema: cf.cf_sistema || null,
            cf_acompanhamento_atendimento: cf.cf_analista || null,
            stats_resolved_at: t.stats?.resolved_at || null,
            stats_closed_at: t.stats?.closed_at || null,
            stats_first_responded_at: t.stats?.first_responded_at || null,
            synced_at: new Date().toISOString()
        };
    });
    
    // Upsert em lotes de 100
    for (let i = 0; i < data.length; i += 100) {
        const batch = data.slice(i, i + 100);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(batch)
        });
        
        if (!response.ok) {
            console.log(`   ❌ Erro no batch ${i}: ${await response.text()}`);
        }
    }
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║        SINCRONIZAÇÃO RÁPIDA DE TICKETS PENDENTES          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 1. Buscar todos os pendentes do Freshdesk
    const fdPending = await getAllFreshdeskPendingTickets();
    
    // 2. Buscar IDs pendentes do Supabase
    const sbPendingMap = await getSupabasePendingIds();
    
    // 3. Identificar diferenças
    console.log('🔍 Analisando diferenças...\n');
    
    const fdIds = new Set(fdPending.map(t => t.id));
    
    // Tickets que estão pendentes no Supabase mas não no Freshdesk (mudaram de status)
    const changedToResolved = [];
    for (const [id, status] of sbPendingMap) {
        if (!fdIds.has(id)) {
            changedToResolved.push(id);
        }
    }
    
    console.log(`   Freshdesk pendentes: ${fdPending.length}`);
    console.log(`   Supabase pendentes: ${sbPendingMap.size}`);
    console.log(`   Tickets que foram resolvidos/fechados: ${changedToResolved.length}`);
    
    if (changedToResolved.length > 0) {
        console.log(`\n   IDs: ${changedToResolved.join(', ')}`);
    }
    
    // 4. Atualizar todos os pendentes do Freshdesk no Supabase
    console.log('\n📤 Atualizando tickets no Supabase...\n');
    await upsertTickets(fdPending);
    console.log(`   ✅ ${fdPending.length} tickets atualizados`);
    
    // 5. Buscar e atualizar os que mudaram para resolvido/fechado
    if (changedToResolved.length > 0) {
        console.log(`\n🔄 Verificando ${changedToResolved.length} tickets que podem ter sido resolvidos...\n`);
        
        for (const id of changedToResolved.slice(0, 50)) {
            const url = `${FRESHDESK_BASE_URL}/tickets/${id}?include=stats`;
            try {
                const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
                if (response.ok) {
                    const ticket = await response.json();
                    await upsertTickets([ticket]);
                    console.log(`   ✅ #${id}: status ${ticket.status}`);
                }
            } catch (e) {
                console.log(`   ⚠️ #${id}: ${e.message}`);
            }
            await sleep(300);
        }
    }
    
    // 6. Verificação final
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICAÇÃO FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const finalSbPending = await getSupabasePendingIds();
    
    console.log(`   Freshdesk: ${fdPending.length} pendentes`);
    console.log(`   Supabase:  ${finalSbPending.size} pendentes`);
    console.log(`   Diferença: ${finalSbPending.size - fdPending.length}`);
    
    if (finalSbPending.size === fdPending.length) {
        console.log('\n   ✅ 100% SINCRONIZADO!');
    }
}

main().catch(console.error);
