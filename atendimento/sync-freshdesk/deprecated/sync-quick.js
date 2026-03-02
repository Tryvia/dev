/**
 * SYNC QUICK - Sincronização rápida (segundos)
 * Apenas atualiza campos customizados dos tickets das últimas 24h
 * Não bate rate limit - máximo ~50 requisições
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!FRESHDESK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente faltando');
    process.exit(1);
}

// Normalizar domínio
let domain = FRESHDESK_DOMAIN.replace('https://', '').replace('http://', '').split('.')[0];
const FRESHDESK_BASE_URL = `https://${domain}.freshdesk.com/api/v2`;

console.log(`🌐 Domínio configurado: ${domain}.freshdesk.com`);
const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || 60;
                console.log(`⏳ Rate limited. Aguardando ${retryAfter}s...`);
                await sleep(retryAfter * 1000);
                continue;
            }
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(2000);
        }
    }
}

async function upsertToSupabase(table, data) {
    if (!data || data.length === 0) return { updated: 0, errors: 0 };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`❌ Erro no UPSERT em ${table}: ${response.status} - ${errBody}`);
            return { updated: 0, errors: data.length };
        }

        return { updated: data.length, errors: 0 };
    } catch (error) {
        console.error(`❌ Erro fatal no UPSERT em ${table}:`, error);
        return { updated: 0, errors: data.length };
    }
}

async function syncQuick() {
    console.log('⚡ SYNC QUICK - Iniciando sincronização rápida...\n');
    const startTime = Date.now();

    // Buscar tickets das últimas 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log(`📅 Buscando tickets atualizados desde: ${since}`);

    let allTickets = [];
    let page = 1;

    while (page <= 10) { // Máximo 1000 tickets (10 páginas de 100)
        const url = `${FRESHDESK_BASE_URL}/tickets?updated_since=${since}&per_page=100&page=${page}`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) break;

        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;

        allTickets.push(...tickets);
        console.log(`   Página ${page}: ${tickets.length} tickets`);

        if (tickets.length < 100) break;
        page++;
        await sleep(500);
    }

    console.log(`\n📊 Total: ${allTickets.length} tickets para atualizar`);

    if (allTickets.length === 0) {
        console.log('✅ Nenhum ticket para sincronizar');
        return;
    }

    // Transformar e enviar para Supabase - DADOS COMPLETOS para novos tickets
    const ticketsData = allTickets.map(ticket => {
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
            cf_prioridade_dev: cf.cf_prioridade_dev || null,
            cf_situacao: cf.cf_situacao || cf.cf_situao || null,
            synced_at: new Date().toISOString()
        };
    });

    const result = await upsertToSupabase('tickets', ticketsData);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ SYNC QUICK concluído em ${elapsed}s`);
    console.log(`   ${result.updated} tickets atualizados`);
    console.log(`   ${result.errors} erros`);
}

syncQuick().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
