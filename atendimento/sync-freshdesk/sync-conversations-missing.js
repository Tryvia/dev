/**
 * SYNC CONVERSATIONS MISSING
 * Sincroniza conversas de tickets que não têm conversas no banco
 * Foca em tickets recentes (#6500+) para economizar rate limit
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!FRESHDESK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente faltando');
    console.error('   FRESHDESK_API_KEY:', FRESHDESK_API_KEY ? '✓' : '✗');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
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

// Buscar todos os IDs de tickets no Supabase
async function getTicketIds() {
    console.log('📋 Buscando IDs de tickets no Supabase...');
    
    let allIds = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&order=id.desc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        
        if (!response.ok) break;
        const data = await response.json();
        if (!data || data.length === 0) break;
        
        allIds = allIds.concat(data.map(t => t.id));
        if (data.length < limit) break;
        offset += limit;
    }
    
    console.log(`   ✓ ${allIds.length} tickets no banco`);
    return allIds;
}

// Buscar IDs de tickets que já têm conversas
async function getTicketsWithConversations() {
    console.log('💬 Buscando tickets que já têm conversas...');
    
    let ticketIds = new Set();
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/conversations?select=ticket_id&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        
        if (!response.ok) break;
        const data = await response.json();
        if (!data || data.length === 0) break;
        
        data.forEach(c => ticketIds.add(c.ticket_id));
        if (data.length < limit) break;
        offset += limit;
    }
    
    console.log(`   ✓ ${ticketIds.size} tickets com conversas`);
    return ticketIds;
}

// Buscar conversas de um ticket do Freshdesk
async function fetchConversations(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}/conversations`;
    
    try {
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        return [];
    }
}

// Transformar conversa para o formato do Supabase
function transformConversation(conv, ticketId) {
    return {
        id: conv.id,
        ticket_id: ticketId,
        user_id: conv.user_id,
        from_email: conv.from_email || null,
        to_emails: conv.to_emails || [],
        cc_emails: conv.cc_emails || [],
        body: conv.body || null,
        body_text: conv.body_text || null,
        incoming: conv.incoming || false,
        private: conv.private || false,
        source: conv.source,
        created_at: conv.created_at,
        updated_at: conv.updated_at
    };
}

// Enviar conversas para Supabase
async function upsertConversations(conversations) {
    if (conversations.length === 0) return 0;
    
    const batchSize = 100;
    let total = 0;
    
    for (let i = 0; i < conversations.length; i += batchSize) {
        const batch = conversations.slice(i, i + batchSize);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(batch)
        });
        
        if (response.ok) {
            total += batch.length;
        } else {
            const err = await response.text();
            console.error(`   ❌ Erro: ${err}`);
        }
    }
    
    return total;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔄 SYNC CONVERSATIONS MISSING');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 ${new Date().toISOString()}\n`);
    
    const startTime = Date.now();
    
    // 1. Identificar tickets sem conversas
    const allTicketIds = await getTicketIds();
    const ticketsWithConvs = await getTicketsWithConversations();
    
    // Filtrar apenas tickets recentes (#6000+) para economizar tempo
    const MIN_TICKET_ID = parseInt(process.env.MIN_TICKET_ID) || 6000;
    
    const ticketsSemConvs = allTicketIds
        .filter(id => id >= MIN_TICKET_ID && !ticketsWithConvs.has(id))
        .sort((a, b) => b - a); // Mais recentes primeiro
    
    console.log(`\n🔍 ${ticketsSemConvs.length} tickets (#${MIN_TICKET_ID}+) sem conversas\n`);
    
    if (ticketsSemConvs.length === 0) {
        console.log('✅ Todos os tickets recentes já têm conversas!');
        return;
    }
    
    // 2. Buscar e sincronizar conversas
    let totalConvs = 0;
    let ticketsProcessados = 0;
    let ticketsComNovasConvs = 0;
    
    for (const ticketId of ticketsSemConvs) {
        const convs = await fetchConversations(ticketId);
        
        if (convs.length > 0) {
            const transformed = convs.map(c => transformConversation(c, ticketId));
            const saved = await upsertConversations(transformed);
            totalConvs += saved;
            ticketsComNovasConvs++;
        }
        
        ticketsProcessados++;
        
        if (ticketsProcessados % 20 === 0 || ticketsProcessados === ticketsSemConvs.length) {
            console.log(`   ${ticketsProcessados}/${ticketsSemConvs.length} tickets | ${totalConvs} conversas`);
        }
        
        await sleep(300); // Rate limiting
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`✅ CONCLUÍDO em ${elapsed}s`);
    console.log(`   📋 ${ticketsProcessados} tickets verificados`);
    console.log(`   💬 ${totalConvs} conversas sincronizadas`);
    console.log(`   📊 ${ticketsComNovasConvs} tickets tinham conversas`);
    console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
