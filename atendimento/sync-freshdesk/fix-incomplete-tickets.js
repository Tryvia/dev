/**
 * FIX INCOMPLETE TICKETS
 * Re-sincroniza tickets que estão incompletos no banco (sem subject, etc)
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

console.log(`🌐 Domínio: ${domain}.freshdesk.com`);

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
            const retryAfter = response.headers.get('Retry-After') || 60;
            console.log(`⏳ Rate limited. Aguardando ${retryAfter}s...`);
            await sleep(retryAfter * 1000);
            continue;
        }
        return response;
    }
    throw new Error('Max retries exceeded');
}

// Buscar tickets incompletos (sem subject)
async function getIncompleteTickets() {
    console.log('🔍 Buscando tickets incompletos...');
    
    const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&subject=is.null&order=id.desc`;
    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
    });
    
    if (!response.ok) {
        console.error('❌ Erro ao buscar tickets');
        return [];
    }
    
    const data = await response.json();
    console.log(`   ✓ ${data.length} tickets incompletos encontrados`);
    return data.map(t => t.id);
}

// Buscar ticket completo do Freshdesk
async function fetchTicket(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}?include=stats,requester`;
    
    try {
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`   ⚠️ Ticket #${ticketId} não existe no Freshdesk`);
                return null;
            }
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`   ❌ Erro ao buscar ticket #${ticketId}: ${error.message}`);
        return null;
    }
}

// Transformar ticket para o formato do Supabase
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
        cf_tratativa: cf.cf_tratativa || null,
        cf_grupo_tratativa: cf.cf_grupo_tratativa || null,
        cf_sistema: cf.cf_sistema || null,
        cf_tipo_primario: cf.cf_tipo_primario || null,
        cf_prioridade_dev: cf.cf_prioridade_dev || null,
        cf_situacao: cf.cf_situacao || null,
        stats_agent_responded_at: ticket.stats?.agent_responded_at || null,
        stats_first_responded_at: ticket.stats?.first_responded_at || null,
        stats_resolved_at: ticket.stats?.resolved_at || null,
        stats_closed_at: ticket.stats?.closed_at || null,
        synced_at: new Date().toISOString()
    };
}

// Atualizar ticket no Supabase
async function upsertTicket(ticketData) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify([ticketData])
    });
    
    return response.ok;
}

// Deletar ticket que não existe mais no Freshdesk
async function deleteTicket(ticketId) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketId}`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
    });
    
    return response.ok;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔧 FIX INCOMPLETE TICKETS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 ${new Date().toISOString()}\n`);
    
    const startTime = Date.now();
    
    // 1. Buscar tickets incompletos
    const incompleteIds = await getIncompleteTickets();
    
    if (incompleteIds.length === 0) {
        console.log('\n✅ Nenhum ticket incompleto!');
        return;
    }
    
    // 2. Processar cada ticket
    let atualizados = 0;
    let deletados = 0;
    let erros = 0;
    
    console.log(`\n📋 Processando ${incompleteIds.length} tickets...\n`);
    
    for (let i = 0; i < incompleteIds.length; i++) {
        const ticketId = incompleteIds[i];
        const ticket = await fetchTicket(ticketId);
        
        if (ticket) {
            const transformed = transformTicket(ticket);
            const ok = await upsertTicket(transformed);
            if (ok) {
                atualizados++;
                console.log(`   ✅ #${ticketId} atualizado`);
            } else {
                erros++;
                console.log(`   ❌ #${ticketId} erro ao atualizar`);
            }
        } else {
            // Ticket não existe no Freshdesk - deletar do banco
            const deleted = await deleteTicket(ticketId);
            if (deleted) {
                deletados++;
                console.log(`   🗑️ #${ticketId} deletado (não existe no Freshdesk)`);
            }
        }
        
        await sleep(300);
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`✅ CONCLUÍDO em ${elapsed}s`);
    console.log(`   ✅ ${atualizados} tickets atualizados`);
    console.log(`   🗑️ ${deletados} tickets deletados`);
    console.log(`   ❌ ${erros} erros`);
    console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
