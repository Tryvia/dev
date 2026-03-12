/**
 * COMPARAR STATUS - Supabase vs Freshdesk Dashboard
 * 
 * Verifica se os números de tickets por status batem
 */

// Carregar dotenv se disponível
try { require('dotenv').config(); } catch(e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const FRESHDESK_DOMAIN = 'suportetryvia';
const FRESHDESK_API_KEY = 's9GQtphoZqeRNz7Enl';
const FRESHDESK_BASE_URL = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2`;

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
};

const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const STATUS_NAMES = {
    2: 'Aberto',
    3: 'Pendente',
    4: 'Resolvido',
    5: 'Fechado',
    6: 'Aguard. Cliente',
    7: 'Aguard. Terceiros',
    8: 'Aguard. Interno',
    10: 'Aguard. Priorização',
    11: 'Em Desenvolvimento',
    12: 'Deploy Pendente',
    13: 'Aguard. Validação',
    14: 'Em Análise DEV',
    15: 'Aguard. Retorno Int',
    16: 'Indefinido',
    17: 'Aguard. Abertura OS',
    18: 'Consulta Retorno',
    19: 'Validado',
    20: 'Aprovado p/ Prod.',
    21: 'Aguard. Implantação'
};

async function getSupabaseStatusCount() {
    console.log('📊 Contando tickets por status no Supabase...\n');
    
    let allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=status&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, { headers: supabaseHeaders });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar do Supabase: ' + await response.text());
        }
        
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        
        allTickets = allTickets.concat(tickets);
        console.log(`   Carregados ${allTickets.length} tickets...`);
        
        if (tickets.length < limit) break;
        offset += limit;
    }
    
    // Contar por status
    const counts = {};
    allTickets.forEach(t => {
        const status = t.status;
        counts[status] = (counts[status] || 0) + 1;
    });
    
    return { total: allTickets.length, byStatus: counts };
}

async function getFreshdeskPendingCount() {
    console.log('📊 Buscando contagem de tickets PENDENTES no Freshdesk...\n');
    
    // Buscar usando filter para "open" ou "pending"
    // A API do Freshdesk usa filter_name ou query
    
    // Tentar buscar todos os tickets "não fechados"
    let allPending = [];
    const openStatuses = [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    
    for (const status of openStatuses) {
        let page = 1;
        let statusCount = 0;
        
        while (page <= 10) { // Max 10 páginas por status
            const url = `${FRESHDESK_BASE_URL}/tickets?status=${status}&per_page=100&page=${page}`;
            
            try {
                const response = await fetch(url, { headers: freshdeskHeaders });
                
                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                    console.log(`   ⏳ Rate limit, aguardando ${retryAfter}s...`);
                    await sleep(retryAfter * 1000);
                    continue;
                }
                
                if (!response.ok) break;
                
                const tickets = await response.json();
                if (!tickets || tickets.length === 0) break;
                
                statusCount += tickets.length;
                allPending.push(...tickets);
                
                if (tickets.length < 100) break;
                page++;
                await sleep(300);
            } catch (e) {
                console.log(`   ⚠️ Erro no status ${status}: ${e.message}`);
                break;
            }
        }
        
        if (statusCount > 0) {
            console.log(`   Status ${status} (${STATUS_NAMES[status] || 'Outro'}): ${statusCount}`);
        }
        
        await sleep(200);
    }
    
    return allPending.length;
}

async function getFreshdeskTotalViaSearch() {
    console.log('\n📊 Buscando total de tickets via Search API...\n');
    
    // Usar search para buscar tickets de todo o período
    let total = 0;
    
    // Buscar por ano desde 2020
    const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
    
    for (const year of years) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        // Query para tickets criados naquele ano
        const query = encodeURIComponent(`created_at:>'${startDate}' AND created_at:<'${endDate}'`);
        const url = `${FRESHDESK_BASE_URL}/search/tickets?query="${query}"`;
        
        try {
            const response = await fetch(url, { headers: freshdeskHeaders });
            
            if (response.status === 429) {
                console.log(`   ⏳ Rate limit, aguardando...`);
                await sleep(60000);
                continue;
            }
            
            if (response.ok) {
                const data = await response.json();
                const count = data.total || (data.results?.length || 0);
                total += count;
                console.log(`   ${year}: ${count} tickets`);
            }
        } catch (e) {
            console.log(`   ⚠️ Erro em ${year}: ${e.message}`);
        }
        
        await sleep(500);
    }
    
    return total;
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║      COMPARAÇÃO DE STATUS - SUPABASE vs FRESHDESK         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 1. Contagem no Supabase
    const supabase = await getSupabaseStatusCount();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUPABASE - CONTAGEM POR STATUS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let pendentes = 0;
    let resolvidos = 0;
    
    const sortedStatus = Object.entries(supabase.byStatus)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    
    for (const [status, count] of sortedStatus) {
        const statusNum = parseInt(status);
        const name = STATUS_NAMES[statusNum] || `Status ${status}`;
        console.log(`   ${name.padEnd(25)} : ${count}`);
        
        // Classificar
        if (statusNum === 4 || statusNum === 5) {
            resolvidos += count;
        } else {
            pendentes += count;
        }
    }
    
    console.log('\n   ─────────────────────────────────────');
    console.log(`   TOTAL                      : ${supabase.total}`);
    console.log(`   PENDENTES (não 4,5)        : ${pendentes}`);
    console.log(`   RESOLVIDOS/FECHADOS (4,5)  : ${resolvidos}`);
    
    // 2. Comparar com valores do Freshdesk (da imagem)
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 COMPARAÇÃO COM FRESHDESK (valores da imagem)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Valores da imagem do BI
    const biTotal = 6571;
    const biPendentes = 312;
    const biResolvidos = 6259;
    
    // Valores da imagem do Freshdesk
    const fdPendentes = 305;
    
    console.log('   BI (Supabase):');
    console.log(`     Total: ${biTotal}`);
    console.log(`     Pendentes: ${biPendentes}`);
    console.log(`     Resolvidos: ${biResolvidos}`);
    
    console.log('\n   Freshdesk Dashboard:');
    console.log(`     Pendentes: ${fdPendentes}`);
    
    console.log('\n   Diferenças:');
    console.log(`     Pendentes: ${biPendentes - fdPendentes} (BI tem ${biPendentes - fdPendentes} a mais)`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (Math.abs(pendentes - fdPendentes) <= 20) {
        console.log('   ✅ Diferença pequena nos pendentes (< 20 tickets)');
        console.log('   → Pode ser devido a tickets atualizados entre sincronizações');
    } else {
        console.log('   ⚠️ Diferença significativa nos pendentes');
        console.log('   → Verificar se há tickets com status incorreto no Supabase');
    }
    
    console.log('\n   💡 PRÓXIMOS PASSOS:');
    console.log('   1. Rodar sincronização com updated_since antigo');
    console.log('   2. Verificar tickets específicos com status divergente');
    console.log('   3. Atualizar status dos tickets desatualizados');
}

main().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
