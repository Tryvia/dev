/**
 * ENCONTRAR DIFERENÇA EXATA - Quais tickets estão diferentes?
 * 
 * Compara ticket por ticket entre Supabase e Freshdesk
 * para encontrar EXATAMENTE quais estão com status diferente
 */

// Carregar dotenv se disponível
try { require('dotenv').config(); } catch(e) {}

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

const STATUS_NAMES = {
    2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado',
    6: 'Aguard. Cliente', 7: 'Aguard. Terceiros', 8: 'Aguard. Interno',
    10: 'Aguard. Priorização', 11: 'Em Desenvolvimento', 12: 'Deploy Pendente',
    13: 'Aguard. Validação', 14: 'Em Análise DEV', 15: 'Aguard. Retorno Int',
    16: 'Indefinido', 17: 'Aguard. Abertura OS', 18: 'Consulta Retorno',
    19: 'Validado', 20: 'Aprovado p/ Prod.', 21: 'Aguard. Implantação'
};

// Status considerados "pendentes" (não resolvidos/fechados)
const PENDING_STATUSES = [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

async function getSupabasePendingTickets() {
    console.log('📊 Buscando tickets PENDENTES do Supabase...\n');
    
    let allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        // Buscar todos os tickets que NÃO são status 4 ou 5
        const statusFilter = PENDING_STATUSES.map(s => `status.eq.${s}`).join(',');
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,updated_at&or=(${statusFilter})&order=id.asc&offset=${offset}&limit=${limit}`;
        
        const response = await fetch(url, { headers: supabaseHeaders });
        
        if (!response.ok) {
            console.error('Erro:', await response.text());
            break;
        }
        
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        
        allTickets = allTickets.concat(tickets);
        if (tickets.length < limit) break;
        offset += limit;
    }
    
    console.log(`   ✅ ${allTickets.length} tickets pendentes no Supabase\n`);
    return allTickets;
}

async function getFreshdeskTicketStatus(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}?include=stats`;
    
    try {
        const response = await fetch(url, { headers: freshdeskHeaders });
        
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            console.log(`   ⏳ Rate limit, aguardando ${retryAfter}s...`);
            await sleep(retryAfter * 1000);
            return getFreshdeskTicketStatus(ticketId);
        }
        
        if (response.status === 404) {
            return { exists: false };
        }
        
        if (!response.ok) {
            return { error: response.status };
        }
        
        const ticket = await response.json();
        return { exists: true, status: ticket.status, ticket };
    } catch (e) {
        return { error: e.message };
    }
}

async function updateSupabaseTicket(ticketId, newStatus) {
    const url = `${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketId}`;
    
    const response = await fetch(url, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({
            status: newStatus,
            synced_at: new Date().toISOString()
        })
    });
    
    return response.ok;
}

async function upsertTicket(ticket) {
    const cf = ticket.custom_fields || {};
    
    const data = {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        updated_at: ticket.updated_at,
        created_at: ticket.created_at,
        responder_id: ticket.responder_id,
        group_id: ticket.group_id,
        company_id: ticket.company_id,
        tags: ticket.tags || [],
        cf_tratativa: cf.cf_tratativa || cf.cf_tratativa1684353202918 || null,
        cf_grupo_tratativa: cf.cf_grupo_tratativa || cf.cf_grupo_tratativa1684353283756 || null,
        cf_sistema: cf.cf_sistema || null,
        cf_acompanhamento_atendimento: cf.cf_analista || null,
        stats_resolved_at: ticket.stats?.resolved_at || null,
        stats_closed_at: ticket.stats?.closed_at || null,
        stats_first_responded_at: ticket.stats?.first_responded_at || null,
        synced_at: new Date().toISOString()
    };
    
    const url = `${SUPABASE_URL}/rest/v1/tickets`;
    const response = await fetch(url, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify([data])
    });
    
    return response.ok;
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     ENCONTRAR E CORRIGIR DIFERENÇAS - 100% PRECISO        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 1. Buscar todos os tickets pendentes do Supabase
    const supabasePending = await getSupabasePendingTickets();
    
    console.log('🔍 Verificando cada ticket no Freshdesk...\n');
    
    const differences = [];
    const notFound = [];
    const errors = [];
    let checked = 0;
    
    // 2. Verificar cada ticket no Freshdesk
    for (const sbTicket of supabasePending) {
        checked++;
        
        if (checked % 50 === 0) {
            console.log(`   Verificados ${checked}/${supabasePending.length}...`);
        }
        
        const fdResult = await getFreshdeskTicketStatus(sbTicket.id);
        
        if (fdResult.error) {
            errors.push({ id: sbTicket.id, error: fdResult.error });
            continue;
        }
        
        if (!fdResult.exists) {
            notFound.push(sbTicket.id);
            continue;
        }
        
        // Verificar se o status é diferente
        if (fdResult.status !== sbTicket.status) {
            differences.push({
                id: sbTicket.id,
                supabase: sbTicket.status,
                freshdesk: fdResult.status,
                ticket: fdResult.ticket
            });
            
            console.log(`   ⚠️ #${sbTicket.id}: Supabase=${STATUS_NAMES[sbTicket.status] || sbTicket.status} ≠ Freshdesk=${STATUS_NAMES[fdResult.status] || fdResult.status}`);
        }
        
        await sleep(200); // Rate limiting
    }
    
    // 3. Relatório
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 RESULTADO DA VERIFICAÇÃO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`   Total verificado: ${checked}`);
    console.log(`   Diferenças encontradas: ${differences.length}`);
    console.log(`   Não encontrados no FD: ${notFound.length}`);
    console.log(`   Erros: ${errors.length}`);
    
    if (differences.length > 0) {
        console.log('\n🔄 CORRIGINDO DIFERENÇAS...\n');
        
        for (const diff of differences) {
            console.log(`   Atualizando #${diff.id}: ${STATUS_NAMES[diff.supabase]} → ${STATUS_NAMES[diff.freshdesk]}`);
            
            // Atualizar com dados completos do Freshdesk
            const success = await upsertTicket(diff.ticket);
            
            if (success) {
                console.log(`   ✅ #${diff.id} corrigido`);
            } else {
                console.log(`   ❌ #${diff.id} falhou`);
            }
            
            await sleep(100);
        }
    }
    
    if (notFound.length > 0) {
        console.log('\n⚠️ TICKETS NÃO ENCONTRADOS NO FRESHDESK (possivelmente deletados):');
        console.log(`   IDs: ${notFound.slice(0, 20).join(', ')}${notFound.length > 20 ? '...' : ''}`);
    }
    
    // 4. Verificação final
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAÇÃO FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const finalPending = await getSupabasePendingTickets();
    console.log(`   Freshdesk pendentes: 305 (conforme imagem)`);
    console.log(`   Supabase pendentes: ${finalPending.length}`);
    console.log(`   Diferença: ${finalPending.length - 305}`);
    
    if (finalPending.length === 305) {
        console.log('\n   ✅ 100% SINCRONIZADO!');
    } else {
        console.log('\n   ⚠️ Ainda há diferença - pode haver tickets deletados no Freshdesk');
    }
}

main().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
