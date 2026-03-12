/**
 * Verificar estrutura das tabelas no Supabase
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificar() {
    console.log('Verificando tabelas...\n');

    // Tentar tabela 'tickets' (lowercase)
    const { data: tickets1, error: e1 } = await supabase
        .from('tickets')
        .select('id, synced_at')
        .limit(3);
    
    console.log('Tabela "tickets" (lowercase):');
    console.log('  Erro:', e1?.message || 'nenhum');
    console.log('  Dados:', tickets1?.length || 0, 'registros');
    if (tickets1?.[0]) console.log('  Exemplo synced_at:', tickets1[0].synced_at);

    // Tentar tabela 'Tickets' (uppercase)
    const { data: tickets2, error: e2 } = await supabase
        .from('Tickets')
        .select('id, synced_at')
        .limit(3);
    
    console.log('\nTabela "Tickets" (uppercase):');
    console.log('  Erro:', e2?.message || 'nenhum');
    console.log('  Dados:', tickets2?.length || 0, 'registros');
    if (tickets2?.[0]) console.log('  Exemplo synced_at:', tickets2[0].synced_at);

    // Verificar ticket específico #5056 em ambas
    console.log('\n--- Ticket #5056 ---');
    
    const { data: t1 } = await supabase.from('tickets').select('*').eq('id', 5056).single();
    const { data: t2 } = await supabase.from('Tickets').select('*').eq('id', 5056).single();
    
    if (t1) {
        console.log('Em "tickets": tags=', t1.tags, 'synced_at=', t1.synced_at);
    }
    if (t2) {
        console.log('Em "Tickets": tags=', t2.tags, 'synced_at=', t2.synced_at);
    }
}

verificar().catch(console.error);
