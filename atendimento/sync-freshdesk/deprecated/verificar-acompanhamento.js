/**
 * VERIFICAÇÃO - cf_acompanhamento_atendimento vs Freshdesk
 * 
 * Este script verifica se os números do Supabase batem com o Freshdesk
 * após a atualização do campo cf_acompanhamento_atendimento
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
};

// Mapeamento de nomes (normalização)
const nameMapping = {
    'adriana florencio': 'Adriana Florencio',
    'adriana': 'Adriana Florencio',
    'alianie lanes': 'Alianie Lanes',
    'alianie': 'Alianie Lanes',
    'andreia ribeiro': 'Andreia Ribeiro',
    'andréia ribeiro': 'Andreia Ribeiro',
    'andreia': 'Andreia Ribeiro',
    'andréia': 'Andreia Ribeiro',
    'francisco nascimento': 'Francisco Nascimento',
    'francisco': 'Francisco Nascimento',
    'gabriel cs': 'Gabriel CS',
    'gabriel oliveira': 'Gabriel CS',
    'gabriel': 'Gabriel CS',
    'gustavo martins': 'Gustavo Martins',
    'gustavo': 'Gustavo Martins',
    'joão peres': 'João Peres',
    'joao peres': 'João Peres',
    'joao': 'João Peres',
    'joão': 'João Peres',
    'jéssica dias': 'Jéssica Dias',
    'jessica dias': 'Jéssica Dias',
    'jéssica': 'Jéssica Dias',
    'jessica': 'Jéssica Dias',
    'marciele quintanilha': 'Marciele Quintanilha',
    'marciele': 'Marciele Quintanilha'
};

function normalizePersonName(name) {
    if (!name) return null;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return nameMapping[normalized] || name.trim();
}

async function getAllTicketsFromSupabase() {
    console.log('📥 Buscando TODOS os tickets do Supabase...');
    let allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,cf_acompanhamento_atendimento,tags&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, { headers: supabaseHeaders });
        const tickets = await response.json();
        
        if (!Array.isArray(tickets) || tickets.length === 0) break;
        
        allTickets = allTickets.concat(tickets);
        offset += limit;
        
        if (tickets.length < limit) break;
    }
    
    console.log(`✅ Total: ${allTickets.length} tickets no Supabase\n`);
    return allTickets;
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   VERIFICAÇÃO: cf_acompanhamento_atendimento vs Freshdesk     ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║ Data: ${new Date().toISOString()}                   ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    const tickets = await getAllTicketsFromSupabase();
    
    // Valores esperados do Freshdesk (dashboard Acompanhamento Atendimento)
    const expectedFreshdesk = {
        'João Peres': 123,
        'Adriana Florencio': 59,
        'Andreia Ribeiro': 46,
        'Gustavo Martins': 34,
        'Jéssica Dias': 24,
        'Gabriel CS': 9,
        'Alianie Lanes': 6
    };
    
    // Contar por cf_acompanhamento_atendimento
    const statsByCf = {};
    let ticketsComCf = 0;
    
    tickets.forEach(t => {
        const cf = t.cf_acompanhamento_atendimento;
        if (cf && cf.trim()) {
            ticketsComCf++;
            const pessoa = normalizePersonName(cf);
            
            if (!statsByCf[pessoa]) {
                statsByCf[pessoa] = { total: 0, ativos: 0, resolvidos: 0 };
            }
            
            statsByCf[pessoa].total++;
            if (t.status === 4 || t.status === 5) {
                statsByCf[pessoa].resolvidos++;
            } else {
                statsByCf[pessoa].ativos++;
            }
        }
    });
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 COMPARAÇÃO: SUPABASE vs FRESHDESK');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Tickets com cf_acompanhamento_atendimento preenchido: ${ticketsComCf}\n`);
    console.log('   Pessoa                  | FD Esperado | Supabase | Diff   | Status');
    console.log('   ────────────────────────────────────────────────────────────────────');
    
    let allMatch = true;
    
    Object.entries(expectedFreshdesk)
        .sort((a, b) => b[1] - a[1])
        .forEach(([pessoa, fdAtivos]) => {
            const sbStats = statsByCf[pessoa] || { ativos: 0, resolvidos: 0, total: 0 };
            const diff = sbStats.ativos - fdAtivos;
            const diffStr = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : String(diff));
            const status = diff === 0 ? '✅' : (Math.abs(diff) <= 2 ? '⚠️' : '❌');
            
            if (diff !== 0) allMatch = false;
            
            const nome = pessoa.padEnd(24);
            console.log(`   ${nome} | ${String(fdAtivos).padStart(11)} | ${String(sbStats.ativos).padStart(8)} | ${diffStr.padStart(6)} | ${status}`);
        });
    
    console.log('   ────────────────────────────────────────────────────────────────────');
    
    // Mostrar todas as pessoas no Supabase
    console.log('\n📊 TODAS AS PESSOAS NO SUPABASE (cf_acompanhamento_atendimento):');
    console.log('   ────────────────────────────────────────────────────────────────────');
    
    Object.entries(statsByCf)
        .sort((a, b) => b[1].ativos - a[1].ativos)
        .forEach(([pessoa, stats]) => {
            const nome = pessoa.padEnd(24);
            console.log(`   ${nome} | Ativos: ${String(stats.ativos).padStart(4)} | Resolv: ${String(stats.resolvidos).padStart(5)} | Total: ${String(stats.total).padStart(5)}`);
        });
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    if (allMatch) {
        console.log('✅ SUCESSO! Todos os números batem com o Freshdesk!');
    } else {
        console.log('⚠️ Ainda há diferenças. Possíveis causas:');
        console.log('   - Atualização em massa ainda não concluída');
        console.log('   - Tickets criados/atualizados após o snapshot do Freshdesk');
        console.log('   - Status dos tickets alterados no Freshdesk');
    }
    console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
