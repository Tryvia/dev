/**
 * Script para verificar dados no Supabase após sync
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'count=exact'
};

async function countTable(table) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, { headers });
    const range = response.headers.get('content-range');
    if (range) {
        const total = range.split('/')[1];
        return parseInt(total) || 0;
    }
    return 0;
}

async function getRecentTickets() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets?select=id,subject,status,tags,synced_at&order=synced_at.desc&limit=10`, { headers });
    return response.json();
}

async function getTicketsByTag(tag) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets?select=id,subject,tags&tags=cs.{${tag}}&limit=5`, { headers });
    return response.json();
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║        RELATÓRIO DE VERIFICAÇÃO DO SUPABASE                ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Data: ${new Date().toISOString()}                ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Contar registros em cada tabela
    console.log('📊 CONTAGEM DE REGISTROS');
    console.log('────────────────────────────────────────────────────────────');
    
    const tables = ['tickets', 'conversations', 'agents', 'groups', 'companies', 'satisfaction_ratings'];
    
    for (const table of tables) {
        const count = await countTable(table);
        console.log(`   ${table.padEnd(25)} ${count.toString().padStart(6)} registros`);
    }

    // Tickets recém sincronizados
    console.log('\n🕐 ÚLTIMOS 10 TICKETS SINCRONIZADOS');
    console.log('────────────────────────────────────────────────────────────');
    
    const recent = await getRecentTickets();
    for (const t of recent) {
        const syncTime = new Date(t.synced_at).toLocaleTimeString('pt-BR');
        const tags = t.tags?.length > 0 ? `[${t.tags.join(', ')}]` : '';
        console.log(`   #${t.id} | ${t.subject?.substring(0, 40)}... | ${syncTime} ${tags}`);
    }

    // Verificar tickets com tags específicas (problema Ailanie)
    console.log('\n🏷️ TICKETS COM TAG "Andreia"');
    console.log('────────────────────────────────────────────────────────────');
    
    const andreiaTickets = await getTicketsByTag('Andreia');
    if (andreiaTickets.length === 0) {
        console.log('   Nenhum ticket encontrado com essa tag');
    } else {
        for (const t of andreiaTickets) {
            console.log(`   #${t.id} | ${t.subject?.substring(0, 50)}... | Tags: [${t.tags?.join(', ')}]`);
        }
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA');
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
