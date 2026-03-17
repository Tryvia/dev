// Análise Completa de Dados do Supabase
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function analisarEstruturaDados() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANÁLISE COMPLETA DE DADOS DO SISTEMA DE ATENDIMENTO');
    console.log('='.repeat(80));

    // 1. Buscar amostra de tickets para identificar todos os campos
    console.log('\n\n📋 1. ESTRUTURA DE CAMPOS DOS TICKETS');
    console.log('-'.repeat(60));
    
    const urlSample = `${SUPABASE_URL}/rest/v1/tickets?limit=5&order=created_at.desc`;
    const respSample = await fetch(urlSample, { headers });
    const sampleTickets = await respSample.json();
    
    if (sampleTickets.length > 0) {
        const allFields = Object.keys(sampleTickets[0]);
        console.log(`\nTotal de campos disponíveis: ${allFields.length}`);
        console.log('\nCampos encontrados:');
        allFields.sort().forEach(f => console.log(`   • ${f}`));
    }

    // 2. Análise de preenchimento dos campos
    console.log('\n\n📈 2. ANÁLISE DE PREENCHIMENTO DOS CAMPOS');
    console.log('-'.repeat(60));
    
    const urlAll = `${SUPABASE_URL}/rest/v1/tickets?select=*&limit=2000&order=created_at.desc`;
    const respAll = await fetch(urlAll, { headers });
    const allTickets = await respAll.json();
    
    const total = allTickets.length;
    console.log(`\nTotal de tickets analisados: ${total}`);
    
    const fieldStats = {};
    const allFields = Object.keys(allTickets[0] || {});
    
    allFields.forEach(field => {
        fieldStats[field] = {
            preenchidos: 0,
            vazios: 0,
            valores: new Set()
        };
    });
    
    allTickets.forEach(ticket => {
        allFields.forEach(field => {
            const value = ticket[field];
            if (value !== null && value !== undefined && value !== '') {
                fieldStats[field].preenchidos++;
                if (typeof value !== 'object' && fieldStats[field].valores.size < 20) {
                    fieldStats[field].valores.add(String(value).substring(0, 50));
                }
            } else {
                fieldStats[field].vazios++;
            }
        });
    });

    // Ordenar por % de preenchimento
    const sortedFields = Object.entries(fieldStats)
        .map(([field, stats]) => ({
            field,
            preenchidos: stats.preenchidos,
            pct: ((stats.preenchidos / total) * 100).toFixed(1),
            valores: Array.from(stats.valores).slice(0, 5)
        }))
        .sort((a, b) => b.preenchidos - a.preenchidos);

    console.log('\n📊 Campos por taxa de preenchimento:\n');
    console.log('Campo'.padEnd(35) + 'Preench.'.padStart(10) + '  %'.padStart(8) + '   Exemplos de valores');
    console.log('-'.repeat(100));
    
    sortedFields.forEach(f => {
        const exemplos = f.valores.length > 0 ? f.valores.join(', ').substring(0, 40) : '-';
        console.log(`${f.field.padEnd(35)}${String(f.preenchidos).padStart(10)}  ${f.pct.padStart(6)}%   ${exemplos}`);
    });

    // 3. Campos críticos para SLA e Performance
    console.log('\n\n⏱️ 3. ANÁLISE DE CAMPOS DE SLA E PERFORMANCE');
    console.log('-'.repeat(60));
    
    const slaFields = [
        'stats_first_responded_at',
        'stats_resolved_at', 
        'stats_closed_at',
        'stats_agent_responded_at',
        'stats_requester_responded_at',
        'stats_reopened_at',
        'stats_status_updated_at',
        'fr_due_by',
        'due_by',
        'fr_escalated',
        'is_escalated'
    ];
    
    console.log('\nCampos de SLA/Performance:\n');
    slaFields.forEach(field => {
        const stats = fieldStats[field];
        if (stats) {
            const pct = ((stats.preenchidos / total) * 100).toFixed(1);
            const status = parseFloat(pct) > 80 ? '✅' : parseFloat(pct) > 50 ? '⚠️' : '❌';
            console.log(`   ${status} ${field.padEnd(30)} ${pct}% preenchido`);
        } else {
            console.log(`   ❓ ${field.padEnd(30)} NÃO EXISTE no banco`);
        }
    });

    // 4. Análise de campos customizados (cf_*)
    console.log('\n\n🔧 4. CAMPOS CUSTOMIZADOS (cf_*)');
    console.log('-'.repeat(60));
    
    const customFields = sortedFields.filter(f => f.field.startsWith('cf_'));
    console.log(`\nTotal de campos customizados: ${customFields.length}\n`);
    
    customFields.forEach(f => {
        const status = parseFloat(f.pct) > 80 ? '✅' : parseFloat(f.pct) > 50 ? '⚠️' : '❌';
        console.log(`   ${status} ${f.field.padEnd(30)} ${f.pct}% - Valores: ${f.valores.join(', ').substring(0, 50) || '-'}`);
    });

    // 5. Análise temporal
    console.log('\n\n📅 5. ANÁLISE TEMPORAL DOS DADOS');
    console.log('-'.repeat(60));
    
    const dates = allTickets
        .map(t => new Date(t.created_at))
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b);
    
    if (dates.length > 0) {
        console.log(`\n   Ticket mais antigo: ${dates[0].toISOString().split('T')[0]}`);
        console.log(`   Ticket mais recente: ${dates[dates.length - 1].toISOString().split('T')[0]}`);
        console.log(`   Período total: ${Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))} dias`);
    }

    // 6. Distribuição por Status
    console.log('\n\n📊 6. DISTRIBUIÇÃO POR STATUS');
    console.log('-'.repeat(60));
    
    const statusCount = {};
    allTickets.forEach(t => {
        const s = t.status || 'null';
        statusCount[s] = (statusCount[s] || 0) + 1;
    });
    
    const statusMap = { 2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado', 6: 'Aguardando', 7: 'Em Progresso', 10: 'Novo', 11: 'Backlog' };
    Object.entries(statusCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const name = statusMap[status] || `Status ${status}`;
            const pct = ((count / total) * 100).toFixed(1);
            console.log(`   ${name.padEnd(20)} ${String(count).padStart(6)} (${pct}%)`);
        });

    // 7. Distribuição por Prioridade
    console.log('\n\n🎯 7. DISTRIBUIÇÃO POR PRIORIDADE');
    console.log('-'.repeat(60));
    
    const prioCount = {};
    allTickets.forEach(t => {
        const p = t.priority || 'null';
        prioCount[p] = (prioCount[p] || 0) + 1;
    });
    
    const prioMap = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
    Object.entries(prioCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([prio, count]) => {
            const name = prioMap[prio] || `Prioridade ${prio}`;
            const pct = ((count / total) * 100).toFixed(1);
            console.log(`   ${name.padEnd(20)} ${String(count).padStart(6)} (${pct}%)`);
        });

    // 8. Análise de Tempos
    console.log('\n\n⏰ 8. ANÁLISE DE TEMPOS DE ATENDIMENTO');
    console.log('-'.repeat(60));
    
    const tempos = {
        primeiraResposta: [],
        resolucao: []
    };
    
    allTickets.forEach(t => {
        if (t.created_at && t.stats_first_responded_at) {
            const diff = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            if (diff > 0 && diff < 1000) tempos.primeiraResposta.push(diff);
        }
        if (t.created_at && t.stats_resolved_at) {
            const diff = (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            if (diff > 0 && diff < 5000) tempos.resolucao.push(diff);
        }
    });

    const calcStats = (arr) => {
        if (arr.length === 0) return null;
        arr.sort((a, b) => a - b);
        return {
            min: arr[0].toFixed(1),
            max: arr[arr.length - 1].toFixed(1),
            media: (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
            mediana: arr[Math.floor(arr.length / 2)].toFixed(1),
            p90: arr[Math.floor(arr.length * 0.9)].toFixed(1)
        };
    };

    const statsResp = calcStats(tempos.primeiraResposta);
    const statsRes = calcStats(tempos.resolucao);

    if (statsResp) {
        console.log(`\n   Tempo de 1ª Resposta (${tempos.primeiraResposta.length} tickets):`);
        console.log(`      Mínimo: ${statsResp.min}h | Máximo: ${statsResp.max}h`);
        console.log(`      Média: ${statsResp.media}h | Mediana: ${statsResp.mediana}h | P90: ${statsResp.p90}h`);
    }

    if (statsRes) {
        console.log(`\n   Tempo de Resolução (${tempos.resolucao.length} tickets):`);
        console.log(`      Mínimo: ${statsRes.min}h | Máximo: ${statsRes.max}h`);
        console.log(`      Média: ${statsRes.media}h | Mediana: ${statsRes.mediana}h | P90: ${statsRes.p90}h`);
    }

    // 9. Tabelas auxiliares
    console.log('\n\n📁 9. TABELAS AUXILIARES NO SUPABASE');
    console.log('-'.repeat(60));
    
    const tables = ['agents', 'groups', 'companies', 'Products', 'FreshdeskCompanies', 'BusinessHours', 'TicketSurveys', 'feriados', 'time_entries'];
    
    for (const table of tables) {
        try {
            const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`;
            const resp = await fetch(url, { headers });
            if (resp.ok) {
                const data = await resp.json();
                const urlCount = `${SUPABASE_URL}/rest/v1/${table}?select=count`;
                const respCount = await fetch(urlCount, { headers: { ...headers, 'Prefer': 'count=exact' } });
                const count = respCount.headers.get('content-range')?.split('/')[1] || '?';
                console.log(`   ✅ ${table.padEnd(25)} ${count} registros`);
            } else {
                console.log(`   ❌ ${table.padEnd(25)} Não existe ou erro ${resp.status}`);
            }
        } catch (e) {
            console.log(`   ❌ ${table.padEnd(25)} Erro: ${e.message}`);
        }
    }

    // 10. Campos com potencial não explorado
    console.log('\n\n💡 10. CAMPOS COM POTENCIAL NÃO EXPLORADO');
    console.log('-'.repeat(60));
    
    const camposPotencial = sortedFields.filter(f => 
        parseFloat(f.pct) > 30 && 
        parseFloat(f.pct) < 90 &&
        !f.field.includes('_at') &&
        !['id', 'created_at', 'updated_at'].includes(f.field)
    );
    
    console.log('\nCampos com 30-90% de preenchimento (potencial de melhoria):\n');
    camposPotencial.forEach(f => {
        console.log(`   📌 ${f.field.padEnd(30)} ${f.pct}%`);
        if (f.valores.length > 0) {
            console.log(`      Valores: ${f.valores.join(', ')}`);
        }
    });

    console.log('\n\n' + '='.repeat(80));
    console.log('FIM DA ANÁLISE');
    console.log('='.repeat(80) + '\n');
}

analisarEstruturaDados().catch(console.error);
