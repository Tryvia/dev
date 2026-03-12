/**
 * ATUALIZAÇÃO EM MASSA - cf_acompanhamento_atendimento
 * 
 * Este script atualiza TODOS os tickets históricos no Supabase
 * buscando o campo cf_analista do Freshdesk e salvando em cf_acompanhamento_atendimento
 * 
 * O campo cf_analista no Freshdesk tem o label "Acompanhamento Atendimento"
 * e é usado no dashboard do Freshdesk para mostrar tickets por pessoa.
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getAllTicketIdsFromSupabase() {
    console.log('📥 Buscando IDs de todos os tickets do Supabase...');
    let allIds = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } });
        const tickets = await response.json();
        
        if (!Array.isArray(tickets) || tickets.length === 0) break;
        
        allIds = allIds.concat(tickets.map(t => t.id));
        console.log(`   Carregados ${allIds.length} IDs...`);
        offset += limit;
        
        if (tickets.length < limit) break;
    }
    
    console.log(`✅ Total: ${allIds.length} tickets no Supabase\n`);
    return allIds;
}

async function fetchTicketFromFreshdesk(ticketId) {
    const url = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2/tickets/${ticketId}`;
    
    try {
        const response = await fetch(url, { headers: freshdeskHeaders });
        
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || 30;
            console.log(`   ⏳ Rate limited. Aguardando ${retryAfter}s...`);
            await sleep(parseInt(retryAfter) * 1000);
            return fetchTicketFromFreshdesk(ticketId);
        }
        
        if (response.status === 404) {
            return null; // Ticket não existe mais no Freshdesk
        }
        
        if (!response.ok) {
            console.log(`   ⚠️ Erro ao buscar #${ticketId}: ${response.status}`);
            return null;
        }
        
        return response.json();
    } catch (err) {
        console.log(`   ❌ Erro ao buscar #${ticketId}: ${err.message}`);
        return null;
    }
}

async function updateSupabaseTicket(ticketId, cfAnalista, status) {
    const url = `${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketId}`;
    
    const body = {
        cf_acompanhamento_atendimento: cfAnalista,
        status: status,
        synced_at: new Date().toISOString()
    };
    
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify(body)
        });
        
        return response.ok;
    } catch (err) {
        return false;
    }
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   ATUALIZAÇÃO EM MASSA: cf_acompanhamento_atendimento         ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║ Data: ${new Date().toISOString()}                   ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    // 1. Buscar todos os IDs do Supabase
    const ticketIds = await getAllTicketIdsFromSupabase();
    
    // 2. Processar em lotes
    const BATCH_SIZE = 50;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let notFound = 0;
    
    console.log(`📤 Processando ${ticketIds.length} tickets em lotes de ${BATCH_SIZE}...\n`);
    
    for (let i = 0; i < ticketIds.length; i += BATCH_SIZE) {
        const batch = ticketIds.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(ticketIds.length / BATCH_SIZE);
        
        console.log(`📦 Lote ${batchNum}/${totalBatches} (tickets ${i + 1} a ${Math.min(i + BATCH_SIZE, ticketIds.length)})...`);
        
        for (const ticketId of batch) {
            const fdTicket = await fetchTicketFromFreshdesk(ticketId);
            
            if (!fdTicket) {
                notFound++;
                continue;
            }
            
            const cf = fdTicket.custom_fields || {};
            const cfAnalista = cf.cf_analista || null;
            const status = fdTicket.status;
            
            if (cfAnalista || status) {
                const success = await updateSupabaseTicket(ticketId, cfAnalista, status);
                if (success) {
                    updated++;
                } else {
                    errors++;
                }
            } else {
                skipped++;
            }
            
            // Rate limiting - Freshdesk permite ~50 req/min
            await sleep(100);
        }
        
        // Pausa entre lotes
        console.log(`   ✅ Lote concluído. Atualizado: ${updated}, Skipped: ${skipped}, Erros: ${errors}, Não encontrados: ${notFound}`);
        
        if (i + BATCH_SIZE < ticketIds.length) {
            console.log(`   ⏳ Aguardando 5s antes do próximo lote...\n`);
            await sleep(5000);
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO FINAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ⏭️ Sem cf_analista: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   🔍 Não encontrados no Freshdesk: ${notFound}`);
    console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
