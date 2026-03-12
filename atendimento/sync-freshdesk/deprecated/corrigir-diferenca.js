/**
 * CORRIGIR DIFERENÇA EXATA - Tickets #7041 e #7042
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

const STATUS_NAMES = {
    2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado',
    6: 'Aguard. Cliente', 7: 'Aguard. Terceiros', 8: 'Aguard. Interno',
    10: 'Aguard. Priorização', 11: 'Em Desenvolvimento', 12: 'Deploy Pendente',
    13: 'Aguard. Validação', 14: 'Em Análise DEV', 15: 'Aguard. Retorno Int',
    16: 'Indefinido', 17: 'Aguard. Abertura OS', 18: 'Consulta Retorno',
    19: 'Validado', 20: 'Aprovado p/ Prod.', 21: 'Aguard. Implantação'
};

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║           CORRIGIR DIFERENÇA - TICKETS 7041 E 7042        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const ticketIds = [7041, 7042];
    
    for (const id of ticketIds) {
        console.log(`\n🔍 Verificando ticket #${id}...\n`);
        
        // 1. Buscar no Freshdesk
        const fdUrl = `${FRESHDESK_BASE_URL}/tickets/${id}?include=stats`;
        const fdResponse = await fetch(fdUrl, { headers: freshdeskHeaders });
        
        if (!fdResponse.ok) {
            console.log(`   ❌ Freshdesk: Erro ${fdResponse.status}`);
            continue;
        }
        
        const fdTicket = await fdResponse.json();
        console.log(`   Freshdesk:`);
        console.log(`     Status: ${fdTicket.status} (${STATUS_NAMES[fdTicket.status] || 'Desconhecido'})`);
        console.log(`     Criado: ${fdTicket.created_at}`);
        console.log(`     Atualizado: ${fdTicket.updated_at}`);
        
        // 2. Buscar no Supabase
        const sbUrl = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,created_at,updated_at&id=eq.${id}`;
        const sbResponse = await fetch(sbUrl, { headers: supabaseHeaders });
        const sbTickets = await sbResponse.json();
        
        if (sbTickets.length > 0) {
            const sbTicket = sbTickets[0];
            console.log(`   Supabase:`);
            console.log(`     Status: ${sbTicket.status} (${STATUS_NAMES[sbTicket.status] || 'Desconhecido'})`);
            console.log(`     Atualizado: ${sbTicket.updated_at}`);
            
            if (sbTicket.status !== fdTicket.status) {
                console.log(`\n   ⚠️ STATUS DIFERENTE! Atualizando...`);
            }
        } else {
            console.log(`   Supabase: NÃO ENCONTRADO`);
        }
        
        // 3. Atualizar no Supabase com dados do Freshdesk
        const cf = fdTicket.custom_fields || {};
        const updateData = {
            id: fdTicket.id,
            subject: fdTicket.subject,
            status: fdTicket.status,
            priority: fdTicket.priority,
            source: fdTicket.source,
            type: fdTicket.type,
            updated_at: fdTicket.updated_at,
            created_at: fdTicket.created_at,
            due_by: fdTicket.due_by,
            fr_due_by: fdTicket.fr_due_by,
            responder_id: fdTicket.responder_id,
            group_id: fdTicket.group_id,
            company_id: fdTicket.company_id,
            requester_id: fdTicket.requester_id,
            tags: fdTicket.tags || [],
            is_escalated: fdTicket.is_escalated || false,
            fr_escalated: fdTicket.fr_escalated || false,
            cf_tratativa: cf.cf_tratativa || cf.cf_tratativa1684353202918 || null,
            cf_grupo_tratativa: cf.cf_grupo_tratativa || cf.cf_grupo_tratativa1684353283756 || null,
            cf_sistema: cf.cf_sistema || null,
            cf_acompanhamento_atendimento: cf.cf_analista || null,
            stats_resolved_at: fdTicket.stats?.resolved_at || null,
            stats_closed_at: fdTicket.stats?.closed_at || null,
            stats_first_responded_at: fdTicket.stats?.first_responded_at || null,
            synced_at: new Date().toISOString()
        };
        
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify([updateData])
        });
        
        if (updateResponse.ok) {
            console.log(`   ✅ Ticket #${id} atualizado no Supabase com status ${fdTicket.status}`);
        } else {
            console.log(`   ❌ Erro ao atualizar: ${await updateResponse.text()}`);
        }
    }
    
    // 4. Contagem final
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 CONTAGEM FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const PENDING_STATUSES = [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const statusFilter = PENDING_STATUSES.map(s => `status.eq.${s}`).join(',');
    
    let total = 0;
    let offset = 0;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&or=(${statusFilter})&offset=${offset}&limit=1000`;
        const response = await fetch(url, { headers: supabaseHeaders });
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        total += tickets.length;
        if (tickets.length < 1000) break;
        offset += 1000;
    }
    
    console.log(`   Supabase pendentes: ${total}`);
    console.log(`   Freshdesk esperado: 305`);
    console.log(`   Diferença: ${total - 305}`);
    
    if (total === 305) {
        console.log('\n   ✅ 100% SINCRONIZADO!');
    } else {
        console.log('\n   ⚠️ Ainda há diferença');
        console.log('   → Os tickets 7041 e 7042 podem ter status 10 (pendente)');
        console.log('   → O Freshdesk pode estar usando filtro diferente');
    }
}

main().catch(console.error);
