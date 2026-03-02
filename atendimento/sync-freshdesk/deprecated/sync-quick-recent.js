/**
 * SYNC QUICK RECENT - Ultra rápido (~5 segundos)
 * Apenas tickets das últimas 2 HORAS
 * Para sensação de "ao vivo"
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!FRESHDESK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente faltando');
    process.exit(1);
}

const FRESHDESK_BASE_URL = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2`;
const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

async function fetchFreshdesk(url) {
    const response = await fetch(url, { headers: freshdeskHeaders });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function updateSupabase(tickets) {
    let updated = 0;
    for (const ticket of tickets) {
        const cf = ticket.custom_fields || {};
        const data = {
            status: ticket.status,
            priority: ticket.priority,
            updated_at: ticket.updated_at,
            cf_tratativa: cf.cf_tratativa || cf.cf_tratativa1684353202918 || null,
            cf_grupo_tratativa: cf.cf_grupo_tratativa || cf.cf_grupo_tratativa1684353283756 || null,
            cf_situacao: cf.cf_situacao || cf.cf_situao || null,
            synced_at: new Date().toISOString()
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticket.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) updated++;
    }
    return updated;
}

async function main() {
    const start = Date.now();
    console.log('⚡ SYNC QUICK RECENT - Últimas 2 horas\n');

    // Últimas 2 horas apenas
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const url = `${FRESHDESK_BASE_URL}/tickets?updated_since=${since}&per_page=100`;

    const tickets = await fetchFreshdesk(url);
    console.log(`📋 ${tickets.length} tickets encontrados`);

    if (tickets.length > 0) {
        const updated = await updateSupabase(tickets);
        console.log(`✅ ${updated} atualizados`);
    }

    console.log(`⏱️ ${Date.now() - start}ms`);
}

main().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
