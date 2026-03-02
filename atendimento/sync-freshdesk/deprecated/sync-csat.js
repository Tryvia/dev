/**
 * SYNC CSAT - Sincronização de Satisfaction Ratings
 * Focado apenas em CSAT - executa em segundos
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

    const url = `${SUPABASE_URL}/rest/v1/${table}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            return { updated: data.length, errors: 0 };
        } else {
            console.error(`Supabase error: ${response.status}`);
            return { updated: 0, errors: data.length };
        }
    } catch (err) {
        return { updated: 0, errors: data.length };
    }
}

async function syncCSAT() {
    console.log('⭐ SYNC CSAT - Iniciando sincronização...\n');
    const startTime = Date.now();

    // Buscar ratings dos últimos 30 dias
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`📅 Buscando CSAT desde: ${since}`);

    let allRatings = [];
    let page = 1;

    while (page <= 20) {
        const url = `${FRESHDESK_BASE_URL}/surveys/satisfaction_ratings?created_since=${since}&per_page=100&page=${page}`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('ℹ️ Endpoint CSAT não disponível ou sem dados');
                break;
            }
            console.error(`Erro: ${response.status}`);
            break;
        }

        const ratings = await response.json();
        if (!ratings || ratings.length === 0) break;

        allRatings.push(...ratings);
        console.log(`   Página ${page}: ${ratings.length} ratings`);

        if (ratings.length < 100) break;
        page++;
        await sleep(500);
    }

    console.log(`\n📊 Total: ${allRatings.length} ratings para sincronizar`);

    if (allRatings.length === 0) {
        console.log('✅ Nenhum CSAT para sincronizar');
        return;
    }

    // Transformar dados
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

    const result = await upsertToSupabase('satisfaction_ratings', ratingsData);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ SYNC CSAT concluído em ${elapsed}s`);
    console.log(`   ${result.updated} ratings sincronizados`);
    console.log(`   ${result.errors} erros`);
}

syncCSAT().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
