/**
 * DIAGNÓSTICO DE DISCREPÂNCIA - Supabase vs Freshdesk
 * 
 * Analisa por que os números de tickets ativos não batem entre o BI e o Freshdesk
 * 
 * Freshdesk mostra (Acompanhamento Atendimento):
 * - João Peres: 123
 * - Adriana Florencio: 59
 * - Andreia Ribeiro: 46
 * - Gustavo Martins: 34
 * - Jéssica Dias: 24
 * 
 * BI mostra (ATIVOS):
 * - João Peres: 137
 * - Adriana Florencio: 95
 * - etc.
 * 
 * Hipóteses:
 * 1. Tickets com múltiplas tags sendo contados múltiplas vezes
 * 2. Status incorreto no Supabase
 * 3. cf_acompanhamento_atendimento vs tags
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
};

const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

// Mapeamento de nomes
const nameMapping = {
    'adriana': 'Adriana Florencio',
    'alianie': 'Alianie Lanes',
    'andreia': 'Andreia Ribeiro',
    'andréia': 'Andreia Ribeiro',
    'francisco': 'Francisco Nascimento',
    'gabriel cs': 'Gabriel CS',
    'gabriel': 'Gabriel CS',
    'gustavo': 'Gustavo Martins',
    'joão peres': 'João Peres',
    'joao peres': 'João Peres',
    'joao': 'João Peres',
    'jéssica': 'Jéssica Dias',
    'jessica': 'Jéssica Dias',
    'marciele': 'Marciele Quintanilha'
};

function normalizePersonName(tag) {
    if (!tag) return null;
    const normalized = tag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return nameMapping[normalized] || null;
}

async function getAllTicketsFromSupabase() {
    console.log('📥 Buscando TODOS os tickets do Supabase...');
    let allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,tags,cf_acompanhamento_atendimento,created_at,subject&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, { headers: supabaseHeaders });
        const tickets = await response.json();
        
        if (!Array.isArray(tickets) || tickets.length === 0) break;
        
        allTickets = allTickets.concat(tickets);
        console.log(`   Carregados ${allTickets.length} tickets...`);
        offset += limit;
        
        if (tickets.length < limit) break;
    }
    
    console.log(`✅ Total: ${allTickets.length} tickets no Supabase\n`);
    return allTickets;
}

async function getTicketsFromFreshdesk(cfAcompanhamentoValue) {
    // Buscar tickets com cf_acompanhamento_atendimento específico
    console.log(`🔍 Buscando tickets no Freshdesk com cf_acompanhamento_atendimento="${cfAcompanhamentoValue}"...`);
    
    const encoded = encodeURIComponent(`cf_acompanhamento_atendimento:'${cfAcompanhamentoValue}'`);
    const url = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2/search/tickets?query="${encoded}"`;
    
    try {
        const response = await fetch(url, { headers: freshdeskHeaders });
        const data = await response.json();
        return data.results || [];
    } catch (err) {
        console.log(`   ⚠️ Erro ao buscar: ${err.message}`);
        return [];
    }
}

async function analyzeSupabaseData(tickets) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 ANÁLISE DO SUPABASE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 1. Análise por TAGS (como o BI faz)
    const byTagsPerson = {};
    let ticketsComTagDePessoa = 0;
    let ticketsComMultiplasTags = 0;
    
    // 2. Análise por CF_ACOMPANHAMENTO_ATENDIMENTO
    const byCfPerson = {};
    let ticketsComCf = 0;
    
    // Status counts
    const statusNames = {
        2: 'Aberto',
        3: 'Pendente',
        4: 'Resolvido',
        5: 'Fechado',
        6: 'Aguard. Cliente',
        7: 'Aguard. Terceiros'
    };
    
    tickets.forEach(t => {
        // Análise por TAGS
        let tags = t.tags || [];
        if (typeof tags === 'string') {
            try { tags = JSON.parse(tags); } catch { tags = []; }
        }
        
        const pessoasNasTags = [];
        if (Array.isArray(tags)) {
            tags.forEach(tag => {
                const pessoa = normalizePersonName(tag);
                if (pessoa) pessoasNasTags.push(pessoa);
            });
        }
        
        if (pessoasNasTags.length > 0) {
            ticketsComTagDePessoa++;
            if (pessoasNasTags.length > 1) {
                ticketsComMultiplasTags++;
            }
            
            // PROBLEMA POTENCIAL: cada pessoa na tag é contada separadamente
            pessoasNasTags.forEach(pessoa => {
                if (!byTagsPerson[pessoa]) {
                    byTagsPerson[pessoa] = { total: 0, ativos: 0, resolvidos: 0, porStatus: {} };
                }
                byTagsPerson[pessoa].total++;
                
                const status = t.status;
                byTagsPerson[pessoa].porStatus[status] = (byTagsPerson[pessoa].porStatus[status] || 0) + 1;
                
                if (status === 4 || status === 5) {
                    byTagsPerson[pessoa].resolvidos++;
                } else {
                    byTagsPerson[pessoa].ativos++;
                }
            });
        }
        
        // Análise por CF_ACOMPANHAMENTO_ATENDIMENTO
        const cf = t.cf_acompanhamento_atendimento;
        if (cf && cf.trim()) {
            ticketsComCf++;
            const pessoa = normalizePersonName(cf) || cf;
            
            if (!byCfPerson[pessoa]) {
                byCfPerson[pessoa] = { total: 0, ativos: 0, resolvidos: 0, porStatus: {} };
            }
            byCfPerson[pessoa].total++;
            
            const status = t.status;
            byCfPerson[pessoa].porStatus[status] = (byCfPerson[pessoa].porStatus[status] || 0) + 1;
            
            if (status === 4 || status === 5) {
                byCfPerson[pessoa].resolvidos++;
            } else {
                byCfPerson[pessoa].ativos++;
            }
        }
    });
    
    // Mostrar análise por TAGS
    console.log('📌 ANÁLISE POR TAGS (como o BI calcula)');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`   Tickets com tag de pessoa do time: ${ticketsComTagDePessoa}`);
    console.log(`   Tickets com MÚLTIPLAS tags de pessoa: ${ticketsComMultiplasTags}`);
    console.log('');
    console.log('   Pessoa                  | ATIVOS | Resolv. | Total  |');
    console.log('   ──────────────────────────────────────────────────────');
    
    Object.entries(byTagsPerson)
        .sort((a, b) => b[1].ativos - a[1].ativos)
        .forEach(([pessoa, stats]) => {
            const nome = pessoa.padEnd(24);
            const ativos = String(stats.ativos).padStart(6);
            const resolvidos = String(stats.resolvidos).padStart(7);
            const total = String(stats.total).padStart(6);
            console.log(`   ${nome} | ${ativos} | ${resolvidos} | ${total} |`);
        });
    
    // Mostrar análise por CF_ACOMPANHAMENTO_ATENDIMENTO
    console.log('\n');
    console.log('📌 ANÁLISE POR CF_ACOMPANHAMENTO_ATENDIMENTO');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`   Tickets com cf_acompanhamento preenchido: ${ticketsComCf}`);
    console.log('');
    console.log('   Pessoa                  | ATIVOS | Resolv. | Total  |');
    console.log('   ──────────────────────────────────────────────────────');
    
    Object.entries(byCfPerson)
        .sort((a, b) => b[1].ativos - a[1].ativos)
        .forEach(([pessoa, stats]) => {
            const nome = pessoa.substring(0, 24).padEnd(24);
            const ativos = String(stats.ativos).padStart(6);
            const resolvidos = String(stats.resolvidos).padStart(7);
            const total = String(stats.total).padStart(6);
            console.log(`   ${nome} | ${ativos} | ${resolvidos} | ${total} |`);
        });
    
    // Valores esperados do Freshdesk
    const expected = {
        'João Peres': 123,
        'Adriana Florencio': 59,
        'Andreia Ribeiro': 46,
        'Gustavo Martins': 34,
        'Jéssica Dias': 24
    };
    
    console.log('\n');
    console.log('📌 COMPARAÇÃO COM FRESHDESK (Acompanhamento Atendimento)');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('   Pessoa                  | FD Esperado | Tags | CF   | Diff Tags |');
    console.log('   ────────────────────────────────────────────────────────────────');
    
    Object.entries(expected).forEach(([pessoa, fdAtivos]) => {
        const nome = pessoa.padEnd(24);
        const tagsAtivos = byTagsPerson[pessoa]?.ativos || 0;
        const cfAtivos = byCfPerson[pessoa]?.ativos || 0;
        const diff = tagsAtivos - fdAtivos;
        const diffStr = diff > 0 ? `+${diff}` : String(diff);
        
        console.log(`   ${nome} | ${String(fdAtivos).padStart(11)} | ${String(tagsAtivos).padStart(4)} | ${String(cfAtivos).padStart(4)} | ${diffStr.padStart(9)} |`);
    });
    
    return { byTagsPerson, byCfPerson, ticketsComMultiplasTags };
}

async function findDuplicateTickets(tickets) {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICANDO TICKETS DUPLICADOS NO SUPABASE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const idCounts = {};
    tickets.forEach(t => {
        idCounts[t.id] = (idCounts[t.id] || 0) + 1;
    });
    
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    
    if (duplicates.length > 0) {
        console.log(`⚠️ ENCONTRADOS ${duplicates.length} IDs DUPLICADOS:`);
        duplicates.slice(0, 20).forEach(([id, count]) => {
            console.log(`   ID #${id}: ${count}x`);
        });
    } else {
        console.log('✅ Nenhum ticket duplicado encontrado.');
    }
    
    return duplicates;
}

async function checkStatusDiscrepancy(tickets) {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICANDO DISCREPÂNCIA DE STATUS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Pegar alguns tickets ativos do João Peres e verificar no Freshdesk
    const joaoTickets = tickets.filter(t => {
        let tags = t.tags || [];
        if (typeof tags === 'string') {
            try { tags = JSON.parse(tags); } catch { tags = []; }
        }
        return Array.isArray(tags) && tags.some(tag => 
            tag.toLowerCase().includes('joao') || tag.toLowerCase().includes('joão')
        ) && t.status !== 4 && t.status !== 5;
    }).slice(0, 10);
    
    console.log(`Verificando ${joaoTickets.length} tickets ATIVOS de João Peres no Freshdesk...\n`);
    
    let statusDiffs = 0;
    
    for (const ticket of joaoTickets) {
        const url = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2/tickets/${ticket.id}`;
        try {
            const response = await fetch(url, { headers: freshdeskHeaders });
            const fdTicket = await response.json();
            
            if (fdTicket.status !== ticket.status) {
                statusDiffs++;
                console.log(`   ⚠️ #${ticket.id}: Supabase status=${ticket.status}, Freshdesk status=${fdTicket.status}`);
            } else {
                console.log(`   ✅ #${ticket.id}: status=${ticket.status} (igual)`);
            }
            
            // Rate limiting
            await new Promise(r => setTimeout(r, 200));
        } catch (err) {
            console.log(`   ❌ #${ticket.id}: Erro - ${err.message}`);
        }
    }
    
    console.log(`\n📊 Resultado: ${statusDiffs} tickets com status diferente entre Supabase e Freshdesk`);
    
    return statusDiffs;
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║    DIAGNÓSTICO COMPLETO: DISCREPÂNCIA SUPABASE vs FRESHDESK   ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║ Data: ${new Date().toISOString()}                   ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    // 1. Buscar todos os tickets do Supabase
    const tickets = await getAllTicketsFromSupabase();
    
    // 2. Analisar dados
    const analysis = await analyzeSupabaseData(tickets);
    
    // 3. Verificar duplicados
    await findDuplicateTickets(tickets);
    
    // 4. Verificar discrepância de status
    const statusDiffs = await checkStatusDiscrepancy(tickets);
    
    // 5. Conclusões
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 CONCLUSÕES E RECOMENDAÇÕES');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (statusDiffs > 0) {
        console.log('⚠️ PROBLEMA ENCONTRADO: Status desatualizado no Supabase');
        console.log('   → Solução: Rodar sync-smart.js full para atualizar todos os tickets\n');
    }
    
    if (analysis.ticketsComMultiplasTags > 0) {
        console.log(`⚠️ POSSÍVEL PROBLEMA: ${analysis.ticketsComMultiplasTags} tickets têm múltiplas tags de pessoa`);
        console.log('   → Isso pode causar contagem duplicada se o BI conta cada tag separadamente\n');
    }
    
    console.log('💡 O dashboard Freshdesk usa cf_acompanhamento_atendimento, não tags.');
    console.log('   → O BI deve usar cf_acompanhamento_atendimento para bater com Freshdesk.\n');
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
