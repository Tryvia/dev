/**
 * Script para verificar dados do BI Acompanhamento com o Supabase
 * Compara os valores mostrados no dashboard com os dados reais do banco
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dados esperados do BI (das imagens)
const dadosEsperados = [
    { pessoa: 'João Peres', ativos: 105, resolvidos: 330, total: 435, taxa: 76 },
    { pessoa: 'Adriana Florencio', ativos: 83, resolvidos: 1337, total: 1420, taxa: 94 },
    { pessoa: 'Andreia Ribeiro', ativos: 62, resolvidos: 1372, total: 1434, taxa: 96 },
    { pessoa: 'Gustavo Martins', ativos: 59, resolvidos: 1324, total: 1383, taxa: 96 },
    { pessoa: 'Jéssica Dias', ativos: 44, resolvidos: 659, total: 703, taxa: 94 },
    { pessoa: 'Gabriel CS', ativos: 11, resolvidos: 26, total: 37, taxa: 70 },
    { pessoa: 'Ailanie Lanes', ativos: 7, resolvidos: 211, total: 218, taxa: 97 },
    { pessoa: 'Francisco Nascimento', ativos: 0, resolvidos: 448, total: 448, taxa: 100 },
    { pessoa: 'Marciele Quintanilha', ativos: 0, resolvidos: 3, total: 3, taxa: 100 }
];

// Mapeamento de tags reais do banco para nomes do BI
// Baseado nas tags encontradas no banco de dados
const tagParaNome = {
    'joão peres': 'joão peres',
    'joao peres': 'joão peres',
    'adriana': 'adriana florencio',
    'andreia': 'andreia ribeiro',
    'gustavo': 'gustavo martins',
    'jéssica': 'jéssica dias',
    'jessica': 'jéssica dias',
    'gabriel cs': 'gabriel cs',
    'alianie': 'ailanie lanes',
    'aliaanie': 'ailanie lanes',
    'francisco': 'francisco nascimento',
    'marciele': 'marciele quintanilha'
};

function normalizarNome(tag) {
    if (!tag) return null;
    const tagLower = tag.toLowerCase().trim();
    
    // Verificar mapeamento direto
    if (tagParaNome[tagLower]) {
        return tagParaNome[tagLower];
    }
    return null;
}

function getTagsArray(ticket) {
    if (!ticket.tags) return [];
    if (Array.isArray(ticket.tags)) return ticket.tags;
    if (typeof ticket.tags === 'string') {
        return ticket.tags.split(',').map(t => t.trim()).filter(t => t);
    }
    return [];
}

async function verificarDados() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAÇÃO DE DADOS DO BI ACOMPANHAMENTO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
    console.log('');

    // Buscar TODOS os tickets
    console.log('📥 Buscando tickets do Supabase...');
    
    let allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('tickets')
            .select('id, status, tags, created_at')
            .range(offset, offset + limit - 1);
        
        if (error) {
            console.error('❌ Erro ao buscar tickets:', error.message);
            process.exit(1);
        }
        
        if (!data || data.length === 0) break;
        
        allTickets = allTickets.concat(data);
        console.log(`   Carregados: ${allTickets.length} tickets...`);
        
        if (data.length < limit) break;
        offset += limit;
    }
    
    console.log(`✅ Total de tickets no banco: ${allTickets.length}`);
    console.log('');

    // Status que indicam resolvido (4=Resolvido, 5=Fechado)
    const statusResolvido = [4, 5];

    // Calcular estatísticas por pessoa
    const statsPorPessoa = {};

    allTickets.forEach(ticket => {
        const tags = getTagsArray(ticket);
        const isResolved = statusResolvido.includes(ticket.status);
        
        tags.forEach(tag => {
            const pessoaNormalizada = normalizarNome(tag);
            if (!pessoaNormalizada) return;
            
            if (!statsPorPessoa[pessoaNormalizada]) {
                statsPorPessoa[pessoaNormalizada] = {
                    total: 0,
                    resolvidos: 0,
                    ativos: 0,
                    ticketIds: []
                };
            }
            
            statsPorPessoa[pessoaNormalizada].total++;
            statsPorPessoa[pessoaNormalizada].ticketIds.push(ticket.id);
            
            if (isResolved) {
                statsPorPessoa[pessoaNormalizada].resolvidos++;
            } else {
                statsPorPessoa[pessoaNormalizada].ativos++;
            }
        });
    });

    // Comparar com dados esperados
    console.log('📊 COMPARAÇÃO: BI vs BANCO DE DADOS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    let temDiscrepancia = false;
    const resultados = [];

    for (const esperado of dadosEsperados) {
        const chave = esperado.pessoa.toLowerCase();
        const real = statsPorPessoa[chave] || { total: 0, resolvidos: 0, ativos: 0 };
        const taxaReal = real.total > 0 ? Math.round((real.resolvidos / real.total) * 100) : 0;
        
        const diffAtivos = real.ativos - esperado.ativos;
        const diffResolvidos = real.resolvidos - esperado.resolvidos;
        const diffTotal = real.total - esperado.total;
        const diffTaxa = taxaReal - esperado.taxa;
        
        const temErro = diffAtivos !== 0 || diffResolvidos !== 0 || diffTotal !== 0;
        if (temErro) temDiscrepancia = true;
        
        resultados.push({
            pessoa: esperado.pessoa,
            esperado,
            real: { ...real, taxa: taxaReal },
            diff: { ativos: diffAtivos, resolvidos: diffResolvidos, total: diffTotal, taxa: diffTaxa },
            temErro
        });
    }

    // Exibir resultados
    for (const r of resultados) {
        const status = r.temErro ? '❌' : '✅';
        console.log(`${status} ${r.pessoa.toUpperCase()}`);
        console.log('─────────────────────────────────────────────────────────');
        console.log(`   📊 BI:    Ativos=${r.esperado.ativos}  Resolvidos=${r.esperado.resolvidos}  Total=${r.esperado.total}  Taxa=${r.esperado.taxa}%`);
        console.log(`   💾 Banco: Ativos=${r.real.ativos}  Resolvidos=${r.real.resolvidos}  Total=${r.real.total}  Taxa=${r.real.taxa}%`);
        
        if (r.temErro) {
            console.log(`   ⚠️  DIFERENÇA: Ativos=${r.diff.ativos > 0 ? '+' : ''}${r.diff.ativos}  Resolvidos=${r.diff.resolvidos > 0 ? '+' : ''}${r.diff.resolvidos}  Total=${r.diff.total > 0 ? '+' : ''}${r.diff.total}`);
        }
        console.log('');
    }

    // Resumo final
    console.log('═══════════════════════════════════════════════════════════════');
    if (temDiscrepancia) {
        console.log('⚠️  RESULTADO: Foram encontradas DISCREPÂNCIAS entre BI e Banco');
        console.log('');
        console.log('Possíveis causas:');
        console.log('  1. Cache do navegador com dados antigos');
        console.log('  2. Tickets foram modificados/criados após carregamento do BI');
        console.log('  3. Diferença na normalização de nomes/tags');
        console.log('  4. Filtro de período aplicado no BI');
    } else {
        console.log('✅ RESULTADO: Todos os dados CONFEREM!');
    }
    console.log('═══════════════════════════════════════════════════════════════');

    // Mostrar pessoas encontradas no banco que não estão na lista esperada
    console.log('');
    console.log('📋 Outras pessoas encontradas no banco (não listadas no BI):');
    const pessoasEsperadas = dadosEsperados.map(d => d.pessoa.toLowerCase());
    for (const [pessoa, stats] of Object.entries(statsPorPessoa)) {
        if (!pessoasEsperadas.includes(pessoa)) {
            console.log(`   - ${pessoa}: ${stats.total} tickets (${stats.ativos} ativos, ${stats.resolvidos} resolvidos)`);
        }
    }
}

async function listarTodasTags() {
    console.log('\n📋 LISTANDO TODAS AS TAGS ÚNICAS DO BANCO...\n');
    
    let allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('tickets')
            .select('tags')
            .range(offset, offset + limit - 1);
        
        if (error || !data || data.length === 0) break;
        allTickets = allTickets.concat(data);
        if (data.length < limit) break;
        offset += limit;
    }
    
    const todasTags = new Set();
    allTickets.forEach(t => {
        const tags = getTagsArray(t);
        tags.forEach(tag => todasTags.add(tag.toLowerCase().trim()));
    });
    
    const tagsArray = [...todasTags].sort();
    console.log('Tags encontradas:');
    tagsArray.forEach(tag => console.log(`  - "${tag}"`));
    console.log(`\nTotal: ${tagsArray.length} tags únicas`);
}

// Executar verificação
verificarDados().then(() => listarTodasTags()).catch(console.error);
