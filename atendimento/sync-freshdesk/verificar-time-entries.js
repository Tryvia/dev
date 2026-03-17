// Verificar estrutura da tabela time_entries
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function verificar() {
    const url = `${SUPABASE_URL}/rest/v1/time_entries?select=*&limit=3`;
    const resp = await fetch(url, { headers });
    const data = await resp.json();
    console.log('Estrutura time_entries:');
    if (data.length > 0) {
        Object.entries(data[0]).forEach(([key, value]) => {
            console.log(`  ${key}: ${typeof value} = ${value}`);
        });
    }
}

verificar().catch(console.error);
