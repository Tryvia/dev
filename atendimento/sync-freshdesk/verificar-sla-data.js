// Credenciais hardcoded (mesmo padrão dos outros scripts)
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabaseHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function verificarGrupos() {
    console.log('\n🔍 VERIFICAÇÃO DE GRUPOS/TIMES NO SUPABASE\n');
    console.log('='.repeat(60));

    // Verificar tabela groups
    const urlGroups = `${SUPABASE_URL}/rest/v1/groups?select=id,name&limit=50`;
    const respGroups = await fetch(urlGroups, { headers: supabaseHeaders });
    
    if (!respGroups.ok) {
        console.log('❌ Tabela "groups" nao existe ou erro:', respGroups.status);
    } else {
        const groups = await respGroups.json();
        console.log(`\n📊 Grupos na tabela "groups": ${groups.length}`);
        groups.forEach(g => console.log(`   ${g.id} => ${g.name}`));
    }

    // Verificar group_id nos tickets
    const urlTickets = `${SUPABASE_URL}/rest/v1/tickets?select=group_id&limit=1000`;
    const respTickets = await fetch(urlTickets, { headers: supabaseHeaders });
    const tickets = await respTickets.json();
    
    const groupIds = new Set();
    tickets.forEach(t => { if (t.group_id) groupIds.add(t.group_id); });
    
    console.log(`\n📊 Group IDs unicos nos tickets: ${groupIds.size}`);
    groupIds.forEach(id => console.log(`   ${id}`));
    
    console.log('\n' + '='.repeat(60));
    console.log('');
}

verificarGrupos().catch(console.error);
