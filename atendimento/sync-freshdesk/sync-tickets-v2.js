/**
 * Script de Sincronização Freshdesk -> Supabase (V2 - Completo)
 * Sincroniza: Tickets, Conversas, CSAT, Time Entries, Products, Business Hours
 * Executa automaticamente via GitHub Actions ou manualmente
 */

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validar variáveis de ambiente
if (!FRESHDESK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente faltando:');
    if (!FRESHDESK_API_KEY) console.error('   - FRESHDESK_API_KEY');
    if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
    if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const FRESHDESK_BASE_URL = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2`;

// Headers para Freshdesk
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
            console.log(`⚠️ Tentativa ${i + 1} falhou, retentando...`);
            await sleep(2000);
        }
    }
}

// ========================================
// FUNÇÕES AUXILIARES SUPABASE
// ========================================

async function upsertToSupabase(table, data, idField = 'id') {
    if (!data || data.length === 0) return { inserted: 0, updated: 0, errors: 0 };
    
    let updated = 0, inserted = 0, errors = 0;
    
    for (const item of data) {
        try {
            const checkUrl = `${SUPABASE_URL}/rest/v1/${table}?${idField}=eq.${item[idField]}&select=${idField}`;
            const checkResponse = await fetch(checkUrl, {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
            });
            const existing = await checkResponse.json();
            
            if (existing.length > 0) {
                const updateUrl = `${SUPABASE_URL}/rest/v1/${table}?${idField}=eq.${item[idField]}`;
                const updateResponse = await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item)
                });
                if (updateResponse.ok) updated++;
                else errors++;
            } else {
                const insertUrl = `${SUPABASE_URL}/rest/v1/${table}`;
                const insertResponse = await fetch(insertUrl, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item)
                });
                if (insertResponse.ok) inserted++;
                else errors++;
            }
        } catch (err) {
            errors++;
        }
    }
    
    return { inserted, updated, errors };
}

// ========================================
// 1. TICKETS
// ========================================

async function fetchAllTickets() {
    const allTickets = [];
    let page = 1;
    const perPage = 100;
    
    console.log('📋 Buscando tickets...');
    
    while (true) {
        const url = `${FRESHDESK_BASE_URL}/tickets?per_page=${perPage}&page=${page}&include=stats,requester,description`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        
        if (!response.ok) {
            throw new Error(`Freshdesk API error: ${response.status}`);
        }
        
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        
        allTickets.push(...tickets);
        console.log(`   Página ${page}: ${tickets.length} tickets (total: ${allTickets.length})`);
        
        if (tickets.length < perPage) break;
        page++;
        await sleep(500);
    }
    
    console.log(`✅ ${allTickets.length} tickets obtidos`);
    return allTickets;
}

function transformTicket(ticket, agentsMap, groupsMap, companiesMap) {
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
        requester_name: ticket.requester?.name || null,
        requester_email: ticket.requester?.email || null,
        responder_id: ticket.responder_id,
        responder_name: agentsMap[ticket.responder_id] || null,
        group_id: ticket.group_id,
        group_name: groupsMap[ticket.group_id] || null,
        company_id: ticket.company_id,
        company_name: companiesMap[ticket.company_id] || null,
        product_id: ticket.product_id || null,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        due_by: ticket.due_by,
        fr_due_by: ticket.fr_due_by,
        is_escalated: ticket.is_escalated || false,
        fr_escalated: ticket.fr_escalated || false,
        tags: ticket.tags || [],
        custom_fields: ticket.custom_fields || null,
        stats_agent_responded_at: ticket.stats?.agent_responded_at || null,
        stats_requester_responded_at: ticket.stats?.requester_responded_at || null,
        stats_first_responded_at: ticket.stats?.first_responded_at || null,
        stats_status_updated_at: ticket.stats?.status_updated_at || null,
        stats_reopened_at: ticket.stats?.reopened_at || null,
        stats_resolved_at: ticket.stats?.resolved_at || null,
        stats_closed_at: ticket.stats?.closed_at || null,
        stats_pending_since: ticket.stats?.pending_since || null,
        synced_at: new Date().toISOString()
    };
}

// ========================================
// 2. AGENTES, GRUPOS E EMPRESAS
// ========================================

async function fetchAgents() {
    console.log('👥 Buscando agentes...');
    const allAgents = [];
    let page = 1;
    
    while (true) {
        const response = await fetchWithRetry(`${FRESHDESK_BASE_URL}/agents?per_page=100&page=${page}`, { headers: freshdeskHeaders });
        if (!response.ok) break;
        
        const agents = await response.json();
        if (!agents || agents.length === 0) break;
        
        allAgents.push(...agents);
        if (agents.length < 100) break;
        page++;
        await sleep(300);
    }
    
    const map = {};
    const agentsData = allAgents.map(a => {
        map[a.id] = a.contact?.name || a.contact?.email || `Agent ${a.id}`;
        return {
            id: a.id,
            name: a.contact?.name || null,
            email: a.contact?.email || null,
            phone: a.contact?.phone || null,
            active: a.active || false,
            occasional: a.occasional || false,
            ticket_scope: a.ticket_scope || null,
            group_ids: a.group_ids || [],
            role_ids: a.role_ids || [],
            created_at: a.created_at,
            updated_at: a.updated_at,
            synced_at: new Date().toISOString()
        };
    });
    
    console.log(`   ✓ ${allAgents.length} agentes`);
    return { map, data: agentsData };
}

async function fetchGroups() {
    console.log('👥 Buscando grupos...');
    const response = await fetchWithRetry(`${FRESHDESK_BASE_URL}/groups?per_page=100`, { headers: freshdeskHeaders });
    if (!response.ok) return { map: {}, data: [] };
    
    const groups = await response.json();
    const map = {};
    const groupsData = groups.map(g => {
        map[g.id] = g.name;
        return {
            id: g.id,
            name: g.name,
            description: g.description || null,
            escalate_to: g.escalate_to || null,
            auto_ticket_assign: g.auto_ticket_assign || false,
            agent_ids: g.agent_ids || [],
            created_at: g.created_at,
            updated_at: g.updated_at,
            synced_at: new Date().toISOString()
        };
    });
    
    console.log(`   ✓ ${groups.length} grupos`);
    return { map, data: groupsData };
}

async function fetchCompanies() {
    console.log('🏢 Buscando empresas...');
    const allCompanies = [];
    let page = 1;
    
    while (true) {
        const response = await fetchWithRetry(`${FRESHDESK_BASE_URL}/companies?per_page=100&page=${page}`, { headers: freshdeskHeaders });
        if (!response.ok) break;
        
        const companies = await response.json();
        if (!companies || companies.length === 0) break;
        
        allCompanies.push(...companies);
        if (companies.length < 100) break;
        page++;
        await sleep(300);
    }
    
    const map = {};
    const companiesData = allCompanies.map(c => {
        map[c.id] = c.name;
        return {
            id: c.id,
            name: c.name,
            description: c.description || null,
            domains: c.domains || [],
            note: c.note || null,
            health_score: c.health_score || null,
            account_tier: c.account_tier || null,
            renewal_date: c.renewal_date || null,
            industry: c.industry || null,
            custom_fields: c.custom_fields || null,
            created_at: c.created_at,
            updated_at: c.updated_at,
            synced_at: new Date().toISOString()
        };
    });
    
    console.log(`   ✓ ${allCompanies.length} empresas`);
    return { map, data: companiesData };
}

// ========================================
// 3. CONVERSAS
// ========================================

async function fetchConversations(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}/conversations`;
    const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
    
    if (!response.ok) return [];
    return await response.json();
}

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
        category: conv.category,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        synced_at: new Date().toISOString()
    };
}

async function fetchAllConversations(ticketIds) {
    console.log('💬 Buscando conversas...');
    const allConversations = [];
    
    for (let i = 0; i < ticketIds.length; i++) {
        const conversations = await fetchConversations(ticketIds[i]);
        
        for (const conv of conversations) {
            allConversations.push(transformConversation(conv, ticketIds[i]));
        }
        
        if ((i + 1) % 100 === 0) {
            console.log(`   ${i + 1}/${ticketIds.length} tickets (${allConversations.length} conversas)`);
        }
        
        await sleep(200);
    }
    
    console.log(`✅ ${allConversations.length} conversas obtidas`);
    return allConversations;
}

// ========================================
// 4. SATISFACTION RATINGS (CSAT)
// ========================================

async function fetchSatisfactionRatings() {
    console.log('⭐ Buscando avaliações de satisfação (CSAT)...');
    const allRatings = [];
    let page = 1;
    const createdSince = '2020-01-01T00:00:00Z';
    
    while (true) {
        const url = `${FRESHDESK_BASE_URL}/surveys/satisfaction_ratings?created_since=${createdSince}&page=${page}&per_page=100`;
        const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('   ⚠️ API de satisfaction ratings não disponível');
                break;
            }
            break;
        }
        
        const ratings = await response.json();
        if (!ratings || ratings.length === 0) break;
        
        allRatings.push(...ratings);
        console.log(`   Página ${page}: ${ratings.length} avaliações (total: ${allRatings.length})`);
        
        if (ratings.length < 100) break;
        page++;
        await sleep(500);
    }
    
    console.log(`✅ ${allRatings.length} avaliações CSAT obtidas`);
    return allRatings;
}

function transformRating(rating) {
    // Extrair score - pode estar em diferentes formatos
    let score = null;
    if (rating.ratings) {
        score = rating.ratings.default_question;
        // Converter escala Freshdesk para 1-5
        if (score !== null && score !== undefined) {
            if (score >= 100) score = 5;      // 100-103 = muito satisfeito
            else if (score >= 0) score = 3;   // 0 = neutro
            else if (score >= -103) score = 1; // -100 a -103 = insatisfeito
        }
    }
    
    return {
        id: rating.id,
        ticket_id: rating.ticket_id,
        survey_id: rating.survey_id || null,
        user_id: rating.user_id,
        agent_id: rating.agent_id || null,
        group_id: rating.group_id || null,
        score: score,
        score_raw: rating.ratings?.default_question || null,
        feedback: rating.feedback || null,
        created_at: rating.created_at,
        updated_at: rating.updated_at,
        synced_at: new Date().toISOString()
    };
}

// ========================================
// 5. TIME ENTRIES (Tempo gasto)
// ========================================

async function fetchTimeEntries(ticketId) {
    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}/time_entries`;
    const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
    
    if (!response.ok) return [];
    return await response.json();
}

function transformTimeEntry(entry, ticketId) {
    // Converter time_spent de "HH:MM" para minutos
    let timeSpentMinutes = 0;
    if (entry.time_spent) {
        const parts = entry.time_spent.split(':');
        if (parts.length === 2) {
            timeSpentMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
    }
    
    return {
        id: entry.id,
        ticket_id: ticketId,
        agent_id: entry.agent_id,
        time_spent: entry.time_spent || null,
        time_spent_minutes: timeSpentMinutes,
        billable: entry.billable || false,
        note: entry.note || null,
        timer_running: entry.timer_running || false,
        executed_at: entry.executed_at || null,
        start_time: entry.start_time || null,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        synced_at: new Date().toISOString()
    };
}

async function fetchAllTimeEntries(ticketIds) {
    console.log('⏱️ Buscando time entries...');
    const allEntries = [];
    
    for (let i = 0; i < ticketIds.length; i++) {
        const entries = await fetchTimeEntries(ticketIds[i]);
        
        for (const entry of entries) {
            allEntries.push(transformTimeEntry(entry, ticketIds[i]));
        }
        
        if ((i + 1) % 100 === 0) {
            console.log(`   ${i + 1}/${ticketIds.length} tickets (${allEntries.length} time entries)`);
        }
        
        await sleep(200);
    }
    
    console.log(`✅ ${allEntries.length} time entries obtidos`);
    return allEntries;
}

// ========================================
// 6. PRODUCTS
// ========================================

async function fetchProducts() {
    console.log('📦 Buscando produtos...');
    const response = await fetchWithRetry(`${FRESHDESK_BASE_URL}/products`, { headers: freshdeskHeaders });
    
    if (!response.ok) {
        console.log('   ⚠️ Não foi possível buscar produtos');
        return [];
    }
    
    const products = await response.json();
    console.log(`   ✓ ${products.length} produtos`);
    
    return products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || null,
        created_at: p.created_at,
        updated_at: p.updated_at,
        synced_at: new Date().toISOString()
    }));
}

// ========================================
// 7. BUSINESS HOURS
// ========================================

async function fetchBusinessHours() {
    console.log('🕐 Buscando business hours...');
    const response = await fetchWithRetry(`${FRESHDESK_BASE_URL}/business_hours`, { headers: freshdeskHeaders });
    
    if (!response.ok) {
        console.log('   ⚠️ Não foi possível buscar business hours');
        return [];
    }
    
    const businessHours = await response.json();
    console.log(`   ✓ ${businessHours.length} business hours`);
    
    return businessHours.map(bh => ({
        id: bh.id,
        name: bh.name,
        description: bh.description || null,
        is_default: bh.is_default || false,
        time_zone: bh.time_zone || null,
        business_hours: bh.business_hours || null,
        created_at: bh.created_at,
        updated_at: bh.updated_at,
        synced_at: new Date().toISOString()
    }));
}

// ========================================
// 8. SURVEYS
// ========================================

async function fetchSurveys() {
    console.log('📊 Buscando surveys...');
    const response = await fetchWithRetry(`${FRESHDESK_BASE_URL}/surveys`, { headers: freshdeskHeaders });
    
    if (!response.ok) {
        console.log('   ⚠️ Não foi possível buscar surveys');
        return [];
    }
    
    const surveys = await response.json();
    console.log(`   ✓ ${surveys.length} surveys`);
    
    return surveys.map(s => ({
        id: s.id,
        title: s.title,
        active: s.active || false,
        questions: s.questions || null,
        created_at: s.created_at,
        updated_at: s.updated_at,
        synced_at: new Date().toISOString()
    }));
}

// ========================================
// MAIN - EXECUÇÃO PRINCIPAL
// ========================================

async function main() {
    const startTime = Date.now();
    console.log('═'.repeat(60));
    console.log('🚀 SINCRONIZAÇÃO FRESHDESK → SUPABASE (V2 - COMPLETO)');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('═'.repeat(60));
    
    try {
        // ========================================
        // FASE 1: BUSCAR TUDO DO FRESHDESK
        // ========================================
        console.log('\n' + '─'.repeat(60));
        console.log('📥 FASE 1: Buscando dados do Freshdesk');
        console.log('─'.repeat(60) + '\n');
        
        // 1.1 Dados auxiliares
        const [agentsResult, groupsResult, companiesResult] = await Promise.all([
            fetchAgents(),
            fetchGroups(),
            fetchCompanies()
        ]);
        
        // 1.2 Tickets
        const tickets = await fetchAllTickets();
        const transformedTickets = tickets.map(t => 
            transformTicket(t, agentsResult.map, groupsResult.map, companiesResult.map)
        );
        
        // 1.3 Dados relacionados a tickets
        const ticketIds = tickets.map(t => t.id);
        
        const [conversations, timeEntries, satisfactionRatings] = await Promise.all([
            fetchAllConversations(ticketIds),
            fetchAllTimeEntries(ticketIds),
            fetchSatisfactionRatings()
        ]);
        
        const transformedRatings = satisfactionRatings.map(transformRating);
        
        // 1.4 Dados de configuração
        const [products, businessHours, surveys] = await Promise.all([
            fetchProducts(),
            fetchBusinessHours(),
            fetchSurveys()
        ]);
        
        // ========================================
        // FASE 2: ENVIAR TUDO PARA O SUPABASE
        // ========================================
        console.log('\n' + '─'.repeat(60));
        console.log('📤 FASE 2: Enviando dados para Supabase');
        console.log('─'.repeat(60) + '\n');
        
        // 2.1 Agentes
        console.log('👥 Enviando agentes...');
        const agentsStats = await upsertToSupabase('agents', agentsResult.data);
        console.log(`   ✅ ${agentsStats.inserted} inseridos, ${agentsStats.updated} atualizados`);
        
        // 2.2 Grupos
        console.log('👥 Enviando grupos...');
        const groupsStats = await upsertToSupabase('groups', groupsResult.data);
        console.log(`   ✅ ${groupsStats.inserted} inseridos, ${groupsStats.updated} atualizados`);
        
        // 2.3 Empresas
        console.log('🏢 Enviando empresas...');
        const companiesStats = await upsertToSupabase('companies', companiesResult.data);
        console.log(`   ✅ ${companiesStats.inserted} inseridos, ${companiesStats.updated} atualizados`);
        
        // 2.4 Produtos
        console.log('📦 Enviando produtos...');
        const productsStats = await upsertToSupabase('products', products);
        console.log(`   ✅ ${productsStats.inserted} inseridos, ${productsStats.updated} atualizados`);
        
        // 2.5 Business Hours
        console.log('🕐 Enviando business hours...');
        const bhStats = await upsertToSupabase('business_hours', businessHours);
        console.log(`   ✅ ${bhStats.inserted} inseridos, ${bhStats.updated} atualizados`);
        
        // 2.6 Surveys
        console.log('📊 Enviando surveys...');
        const surveysStats = await upsertToSupabase('surveys', surveys);
        console.log(`   ✅ ${surveysStats.inserted} inseridos, ${surveysStats.updated} atualizados`);
        
        // 2.7 Tickets
        console.log('📋 Enviando tickets...');
        const ticketsStats = await upsertToSupabase('tickets', transformedTickets);
        console.log(`   ✅ ${ticketsStats.inserted} inseridos, ${ticketsStats.updated} atualizados`);
        
        // 2.8 Conversas
        console.log('💬 Enviando conversas...');
        const convsStats = await upsertToSupabase('ticket_conversations', conversations);
        console.log(`   ✅ ${convsStats.inserted} inseridos, ${convsStats.updated} atualizados`);
        
        // 2.9 Time Entries
        console.log('⏱️ Enviando time entries...');
        const timeStats = await upsertToSupabase('time_entries', timeEntries);
        console.log(`   ✅ ${timeStats.inserted} inseridos, ${timeStats.updated} atualizados`);
        
        // 2.10 Satisfaction Ratings
        console.log('⭐ Enviando satisfaction ratings...');
        const csatStats = await upsertToSupabase('satisfaction_ratings', transformedRatings);
        console.log(`   ✅ ${csatStats.inserted} inseridos, ${csatStats.updated} atualizados`);
        
        // ========================================
        // RESUMO FINAL
        // ========================================
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n' + '═'.repeat(60));
        console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA em ${duration}s`);
        console.log('═'.repeat(60));
        console.log(`   👥 ${agentsResult.data.length} agentes`);
        console.log(`   👥 ${groupsResult.data.length} grupos`);
        console.log(`   🏢 ${companiesResult.data.length} empresas`);
        console.log(`   📦 ${products.length} produtos`);
        console.log(`   🕐 ${businessHours.length} business hours`);
        console.log(`   📊 ${surveys.length} surveys`);
        console.log(`   📋 ${transformedTickets.length} tickets`);
        console.log(`   💬 ${conversations.length} conversas`);
        console.log(`   ⏱️ ${timeEntries.length} time entries`);
        console.log(`   ⭐ ${transformedRatings.length} avaliações CSAT`);
        console.log('═'.repeat(60));
        
    } catch (error) {
        console.error('\n' + '═'.repeat(60));
        console.error('❌ ERRO NA SINCRONIZAÇÃO:', error.message);
        console.error('═'.repeat(60));
        process.exit(1);
    }
}

main();
