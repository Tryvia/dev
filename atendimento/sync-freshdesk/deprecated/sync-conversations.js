/**
 * Script de Sincronização de Conversas - Freshdesk -> Supabase
 * Versão leve para rodar em intervalos curtos (10-20 min)
 * Busca apenas conversas de tickets atualizados recentemente
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Intervalo de busca em minutos
const MINUTES_LOOKBACK = parseInt(process.env.MINUTES_LOOKBACK) || 30;

// Normalizar domínio (aceita 'subdominio', 'subdominio.freshdesk.com', ou URL completa)
let domain = FRESHDESK_DOMAIN.replace('https://', '').replace('http://', '').split('.')[0];
const FRESHDESK_BASE_URL = `https://${domain}.freshdesk.com/api/v2`;

console.log(`🌐 Domínio configurado: ${domain}.freshdesk.com`);

// Headers para Freshdesk
const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

// Headers para Supabase
const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch com retry automático para rate limiting
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

// Buscar tickets atualizados recentemente
async function fetchRecentlyUpdatedTickets() {
    const lookbackDate = new Date(Date.now() - MINUTES_LOOKBACK * 60 * 1000);
    const formattedDate = lookbackDate.toISOString().split('.')[0] + 'Z';

    console.log(`🔍 Buscando tickets atualizados desde ${formattedDate}...`);

    const allTickets = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        // Busca tickets atualizados após a data especificada
        const url = `${FRESHDESK_BASE_URL}/tickets?per_page=${perPage}&page=${page}&updated_since=${formattedDate}&include=stats`;

        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erro na API: ${response.status} - ${errorText}`);
            break;
        }

        const tickets = await response.json();

        if (!tickets || tickets.length === 0) {
            break;
        }

        allTickets.push(...tickets);
        console.log(`   ✓ Página ${page}: ${tickets.length} tickets (total: ${allTickets.length})`);

        if (tickets.length < perPage) {
            break;
        }

        page++;
        await sleep(300);
    }

    console.log(`✅ ${allTickets.length} tickets atualizados encontrados`);
    return allTickets;
}

// Buscar conversas de um ticket
async function fetchConversations(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}/conversations`;

    try {
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error(`   ⚠️ Erro ao buscar conversas do ticket ${ticketId}: ${error.message}`);
        return [];
    }
}

// Transformar conversa para o formato do Supabase
function transformConversation(conv, ticketId) {
    return {
        id: conv.id,
        ticket_id: ticketId,
        body: conv.body || null,
        body_text: conv.body_text || null,
        incoming: conv.incoming || false,
        private: conv.private || false,
        user_id: conv.user_id || null,
        from_email: conv.from_email || null,
        to_emails: conv.to_emails || [],
        cc_emails: conv.cc_emails || [],
        bcc_emails: conv.bcc_emails || [],
        source: conv.source || null,
        support_email: conv.support_email || null,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        attachments: conv.attachments || []
    };
}

// Enviar conversas para Supabase
async function upsertConversations(conversations) {
    if (conversations.length === 0) return { updated: 0, inserted: 0 };

    const batchSize = 100;
    let updated = 0;
    let inserted = 0;

    for (let i = 0; i < conversations.length; i += batchSize) {
        const batch = conversations.slice(i, i + batchSize);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(batch)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ❌ Erro ao enviar conversas: ${errorText}`);
            continue;
        }

        updated += batch.length;

        if ((i + batchSize) % 200 === 0 || i + batchSize >= conversations.length) {
            console.log(`   ✓ ${Math.min(i + batchSize, conversations.length)}/${conversations.length} conversas`);
        }
    }

    return { updated, inserted };
}

// Atualizar updated_at dos tickets no Supabase
async function updateTicketTimestamps(tickets) {
    if (tickets.length === 0) return;

    const updates = tickets.map(t => ({
        id: t.id,
        updated_at: t.updated_at,
        status: t.status,
        stats_agent_responded_at: t.stats?.agent_responded_at || null,
        stats_resolved_at: t.stats?.resolved_at || null,
        stats_closed_at: t.stats?.closed_at || null
    }));

    const batchSize = 50;

    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
            method: 'POST',
            headers: supabaseHeaders,
            body: JSON.stringify(batch)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ⚠️ Erro ao atualizar timestamps: ${errorText}`);
        }
    }
}

// Função principal
async function main() {
    const startTime = Date.now();

    console.log('══════════════════════════════════════════════════');
    console.log('🔄 SINCRONIZAÇÃO RÁPIDA DE CONVERSAS');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`⏱️ Buscando atualizações dos últimos ${MINUTES_LOOKBACK} minutos`);
    console.log('══════════════════════════════════════════════════\n');

    try {
        // FASE 1: Buscar tickets atualizados recentemente
        console.log('📥 FASE 1: Buscando tickets atualizados...\n');
        const tickets = await fetchRecentlyUpdatedTickets();

        if (tickets.length === 0) {
            console.log('\n✅ Nenhum ticket atualizado no período. Nada a fazer.');
            return;
        }

        // FASE 2: Buscar conversas dos tickets
        console.log('\n💬 FASE 2: Buscando conversas...\n');
        const allConversations = [];
        let processedCount = 0;

        for (const ticket of tickets) {
            const convs = await fetchConversations(ticket.id);

            for (const conv of convs) {
                allConversations.push(transformConversation(conv, ticket.id));
            }

            processedCount++;

            if (processedCount % 10 === 0 || processedCount === tickets.length) {
                console.log(`   ✓ ${processedCount}/${tickets.length} tickets (${allConversations.length} conversas)`);
            }

            // Rate limiting suave
            await sleep(200);
        }

        console.log(`✅ Total: ${allConversations.length} conversas de ${tickets.length} tickets`);

        // FASE 3: Enviar para Supabase
        console.log('\n📤 FASE 3: Enviando para Supabase...\n');

        // Atualizar timestamps dos tickets
        console.log('   📋 Atualizando tickets...');
        await updateTicketTimestamps(tickets);
        console.log(`   ✓ ${tickets.length} tickets atualizados`);

        // Enviar conversas
        if (allConversations.length > 0) {
            console.log('   💬 Enviando conversas...');
            const result = await upsertConversations(allConversations);
            console.log(`   ✅ ${result.updated} conversas sincronizadas`);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n══════════════════════════════════════════════════');
        console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA em ${elapsed}s`);
        console.log(`   📊 ${tickets.length} tickets verificados`);
        console.log(`   💬 ${allConversations.length} conversas sincronizadas`);
        console.log('══════════════════════════════════════════════════');

    } catch (error) {
        console.error('\n❌ ERRO NA SINCRONIZAÇÃO:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Executar
main();
