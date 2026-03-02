/**
 * SYNC METADATA - Sincronização de dados de apoio
 * Agents, Groups, Companies, Products (executa em segundos)
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Normalizar domínio (aceita 'subdominio', 'subdominio.freshdesk.com', ou URL completa)
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
    if (!data || data.length === 0) return 0;

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

        return response.ok ? data.length : 0;
    } catch (err) {
        console.error(`Erro em ${table}:`, err.message);
        return 0;
    }
}

async function fetchAll(endpoint) {
    let all = [];
    let page = 1;

    while (page <= 10) {
        const url = `${FRESHDESK_BASE_URL}/${endpoint}?per_page=100&page=${page}`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) {
            console.error(`❌ Erro em ${url} (Status: ${response.status})`);
            break;
        }

        const data = await response.json();
        if (!data || data.length === 0) break;

        all.push(...data);
        if (data.length < 100) break;
        page++;
        await sleep(300);
    }

    return all;
}

async function syncMetadata() {
    console.log('📋 SYNC METADATA - Iniciando sincronização...\n');
    const startTime = Date.now();
    const now = new Date().toISOString();

    // 1. Agents
    console.log('👤 Sincronizando agents...');
    const agents = await fetchAll('agents');
    const agentsData = agents.map(a => ({
        id: a.id,
        contact_id: a.contact_id,
        name: a.contact?.name || a.name,
        email: a.contact?.email || a.email,
        active: a.active,
        job_title: a.contact?.job_title,
        group_ids: a.group_ids,
        role_ids: a.role_ids,
        created_at: a.created_at,
        updated_at: a.updated_at,
        synced_at: now
    }));
    const agentsCount = await upsertToSupabase('agents', agentsData);
    console.log(`   ✅ ${agentsCount} agents sincronizados`);
    await sleep(500);

    // 2. Groups
    console.log('👥 Sincronizando groups...');
    const groups = await fetchAll('groups');
    const groupsData = groups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        business_hour_id: g.business_hour_id,
        escalate_to: g.escalate_to,
        created_at: g.created_at,
        updated_at: g.updated_at,
        synced_at: now
    }));
    const groupsCount = await upsertToSupabase('groups', groupsData);
    console.log(`   ✅ ${groupsCount} groups sincronizados`);
    await sleep(500);

    // 3. Companies
    console.log('🏢 Sincronizando companies...');
    const companies = await fetchAll('companies');
    const companiesData = companies.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        domains: c.domains,
        note: c.note,
        created_at: c.created_at,
        updated_at: c.updated_at,
        synced_at: now
    }));
    const companiesCount = await upsertToSupabase('companies', companiesData);
    console.log(`   ✅ ${companiesCount} companies sincronizadas`);
    await sleep(500);

    // 4. Products
    console.log('📦 Sincronizando products...');
    const products = await fetchAll('products');
    const productsData = products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        created_at: p.created_at,
        updated_at: p.updated_at,
        synced_at: now
    }));
    const productsCount = await upsertToSupabase('products', productsData);
    console.log(`   ✅ ${productsCount} products sincronizados`);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ SYNC METADATA concluído em ${elapsed}s`);
    console.log(`   Total: ${agentsCount + groupsCount + companiesCount + productsCount} registros`);
}

syncMetadata().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
