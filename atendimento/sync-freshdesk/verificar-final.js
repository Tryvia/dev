const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';
const PENDING = [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

async function main() {
    let total = 0;
    let offset = 0;
    
    while (true) {
        const filter = PENDING.map(s => `status.eq.${s}`).join(',');
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&or=(${filter})&offset=${offset}&limit=1000`;
        
        const response = await fetch(url, {
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        
        const data = await response.json();
        if (!data || data.length === 0) break;
        
        total += data.length;
        if (data.length < 1000) break;
        offset += 1000;
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO FINAL');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Supabase pendentes: ${total}`);
    console.log(`   Freshdesk esperado: 305`);
    console.log(`   Diferença: ${total - 305}`);
    
    if (total === 305) {
        console.log('\n   ✅ 100% SINCRONIZADO!');
    } else {
        console.log(`\n   ⚠️ Ainda há diferença de ${total - 305}`);
    }
}

main().catch(console.error);
