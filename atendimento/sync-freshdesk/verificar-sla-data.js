// Credenciais hardcoded (mesmo padrão dos outros scripts)
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabaseHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function verificarDadosSLA() {
    console.log('\n🔍 VERIFICAÇÃO DE DADOS DE SLA\n');
    console.log('='.repeat(60));

    // Últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total de tickets nos últimos 30 dias
    const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,created_at,stats_first_responded_at,stats_resolved_at,status&created_at=gte.${thirtyDaysAgo.toISOString()}&order=created_at.desc&limit=1000`;
    
    const response = await fetch(url, { headers: supabaseHeaders });
    if (!response.ok) {
        console.error('Erro:', response.statusText);
        return;
    }
    
    const recentTickets = await response.json();

    const total = recentTickets.length;
    const comFirstResponse = recentTickets.filter(t => t.stats_first_responded_at).length;
    const semFirstResponse = total - comFirstResponse;
    const comResolved = recentTickets.filter(t => t.stats_resolved_at).length;

    console.log(`\n📊 Tickets dos ultimos 30 dias: ${total}`);
    console.log(`   ✓ Com stats_first_responded_at: ${comFirstResponse} (${total > 0 ? ((comFirstResponse/total)*100).toFixed(1) : 0}%)`);
    console.log(`   ✗ Sem stats_first_responded_at: ${semFirstResponse} (${total > 0 ? ((semFirstResponse/total)*100).toFixed(1) : 0}%)`);
    console.log(`   📋 Com stats_resolved_at: ${comResolved}`);

    // Amostra de tickets sem first_response
    const amostraSem = recentTickets.filter(t => !t.stats_first_responded_at).slice(0, 5);
    console.log('\n📝 Amostra de tickets SEM first_responded_at:');
    amostraSem.forEach(t => {
        console.log(`   #${t.id} - Status: ${t.status} - Criado: ${t.created_at?.split('T')[0]}`);
    });

    // Amostra de tickets com first_response
    const amostraCom = recentTickets.filter(t => t.stats_first_responded_at).slice(0, 5);
    console.log('\n📝 Amostra de tickets COM first_responded_at:');
    if (amostraCom.length === 0) {
        console.log('   Nenhum ticket encontrado com esse campo!');
    } else {
        amostraCom.forEach(t => {
            console.log(`   #${t.id} - First Response: ${t.stats_first_responded_at?.split('T')[0]}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    
    if (comFirstResponse === 0) {
        console.log('⚠️  PROBLEMA: Nenhum ticket tem dados de SLA!');
        console.log('   Isso explica porque o grafico Tendencia SLA esta vazio.');
        console.log('\n💡 Solucao: Executar sincronizacao para atualizar campo stats');
    } else if (comFirstResponse < total * 0.5) {
        console.log('⚠️  ALERTA: Menos de 50% dos tickets tem dados de SLA.');
    } else {
        console.log('✓ Dados de SLA parecem OK!');
    }
    console.log('');
}

verificarDadosSLA().catch(console.error);
