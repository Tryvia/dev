// Script para verificar campos de SLA no banco - COMPARAÇÃO COM MATRIZ
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabaseHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function verificarSLADev2025() {
    console.log('\n' + '='.repeat(80));
    console.log('� VERIFICAÇÃO DE SLA - GRUPO DEV - ANO 2025');
    console.log('='.repeat(80));
    
    // Valores exibidos na matriz (da imagem)
    const matrizExibida = {
        'jan': { total: 153, violated: 41, within: 112, pct: 73.20 },
        'fev': { total: 154, violated: 31, within: 123, pct: 79.87 },
        'mar': { total: 118, violated: 17, within: 101, pct: 85.59 },
        'abr': { total: 139, violated: 43, within: 96, pct: 69.06 },
        'mai': { total: 262, violated: 45, within: 217, pct: 82.82 },
        'jun': { total: 161, violated: 45, within: 116, pct: 72.05 },
        'jul': { total: 170, violated: 29, within: 141, pct: 82.94 },
        'ago': { total: 144, violated: 47, within: 97, pct: 67.36 },
        'set': { total: 149, violated: 59, within: 90, pct: 60.40 },
        'out': { total: 157, violated: 35, within: 122, pct: 77.71 },
        'nov': { total: 121, violated: 33, within: 88, pct: 72.73 },
        'dez': { total: 65, violated: 38, within: 27, pct: 41.54 }
    };
    
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    console.log('\n🔍 CONSULTANDO BANCO DE DADOS...\n');
    
    let totalGeralBanco = 0;
    let totalVioladoBanco = 0;
    let totalDentroBanco = 0;
    
    for (let m = 0; m < 12; m++) {
        const mesNum = String(m + 1).padStart(2, '0');
        const mesNome = meses[m];
        const inicioMes = `2025-${mesNum}-01`;
        const fimMes = m < 11 ? `2025-${String(m + 2).padStart(2, '0')}-01` : '2026-01-01';
        
        // Buscar total de tickets DEV no mês
        const urlTotal = `${SUPABASE_URL}/rest/v1/tickets?select=id&cf_grupo_tratativa=eq.DEV&created_at=gte.${inicioMes}&created_at=lt.${fimMes}`;
        const respTotal = await fetch(urlTotal, { headers: supabaseHeaders });
        const ticketsTotal = await respTotal.json();
        const total = Array.isArray(ticketsTotal) ? ticketsTotal.length : 0;
        
        // Buscar tickets com is_escalated=true (SLA violado)
        const urlViolado = `${SUPABASE_URL}/rest/v1/tickets?select=id&cf_grupo_tratativa=eq.DEV&is_escalated=eq.true&created_at=gte.${inicioMes}&created_at=lt.${fimMes}`;
        const respViolado = await fetch(urlViolado, { headers: supabaseHeaders });
        const ticketsViolado = await respViolado.json();
        const violated = Array.isArray(ticketsViolado) ? ticketsViolado.length : 0;
        
        const within = total - violated;
        const pct = total > 0 ? ((within / total) * 100).toFixed(2) : 0;
        
        totalGeralBanco += total;
        totalVioladoBanco += violated;
        totalDentroBanco += within;
        
        // Comparar com matriz
        const esperado = matrizExibida[mesNome];
        const match = esperado.total === total && esperado.violated === violated;
        const status = match ? '✅' : '❌';
        
        console.log(`${status} ${mesNome.toUpperCase()}/25:`);
        console.log(`   BANCO:  Total=${total}, Violated=${violated}, Within=${within}, %SLA=${pct}%`);
        console.log(`   MATRIZ: Total=${esperado.total}, Violated=${esperado.violated}, Within=${esperado.within}, %SLA=${esperado.pct}%`);
        if (!match) {
            console.log(`   ⚠️  DIFERENÇA: Total ${total - esperado.total}, Violated ${violated - esperado.violated}`);
        }
        console.log('');
    }
    
    // Totais acumulados
    const pctGeralBanco = totalGeralBanco > 0 ? ((totalDentroBanco / totalGeralBanco) * 100).toFixed(2) : 0;
    
    console.log('-'.repeat(80));
    console.log('📊 ACUMULADO 2025:');
    console.log(`   BANCO:  Total=${totalGeralBanco}, Violated=${totalVioladoBanco}, Within=${totalDentroBanco}, %SLA=${pctGeralBanco}%`);
    console.log(`   MATRIZ: Total=1793, Violated=463, Within=1330, %SLA=74.18%`);
    
    const matchAcum = totalGeralBanco === 1793 && totalVioladoBanco === 463;
    console.log(`   ${matchAcum ? '✅ VALORES CONFEREM!' : '❌ DIFERENÇA ENCONTRADA'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 EXPLICAÇÃO DO CÁLCULO:');
    console.log('-'.repeat(80));
    console.log(`
1. CAMPO UTILIZADO: is_escalated (boolean)
   - Campo do Freshdesk que indica se o SLA foi violado
   - true = SLA violado (ticket não foi resolvido no prazo)
   - false = Dentro do SLA (ticket resolvido dentro do prazo)

2. FÓRMULA DO %SLA:
   %SLA = (Tickets Dentro do SLA / Total de Tickets) × 100
   %SLA = (Within / Total) × 100

3. EXEMPLO MÊS JANEIRO:
   - Total de tickets DEV em Jan/25: 153
   - Tickets com is_escalated=true: 41 (SLA Violated)
   - Tickets com is_escalated=false: 112 (Within SLA)
   - %SLA = (112 / 153) × 100 = 73.20%

4. ACUMULADO ANUAL:
   - Total: 1793 tickets
   - SLA Violated: 463 tickets
   - Within SLA: 1330 tickets
   - %SLA = (1330 / 1793) × 100 = 74.18%
`);
    
    console.log('='.repeat(80));
}

verificarSLADev2025().catch(console.error);
