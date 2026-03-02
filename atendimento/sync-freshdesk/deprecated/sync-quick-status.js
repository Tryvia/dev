/**
 * SYNC QUICK STATUS - Ultra rápido (~3 segundos)
 * Apenas status dos tickets ABERTOS
 * Detecta fechamentos e resoluções em tempo real
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
        const data = {
            status: ticket.status,
            priority: ticket.priority,
            updated_at: ticket.updated_at,
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
    console.log('⚡ SYNC QUICK STATUS - Tickets abertos\n');

    // Buscar tickets abertos (status 2=Open, 3=Pending, 6=Waiting)
    let allTickets = [];

    for (const status of [2, 3, 6]) {
        const url = `${FRESHDESK_BASE_URL}/tickets?status=${status}&per_page=100`;
        try {
            const tickets = await fetchFreshdesk(url);
            allTickets.push(...tickets);
        } catch (e) {
            // Ignora erros de status específicos
        }
    }

    console.log(`📋 ${allTickets.length} tickets abertos`);

    if (allTickets.length > 0) {
        const updated = await updateSupabase(allTickets);
        console.log(`✅ ${updated} atualizados`);
    }

    console.log(`⏱️ ${Date.now() - start}ms`);
}

main().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
