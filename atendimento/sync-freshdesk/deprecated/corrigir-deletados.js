/**
 * CORRIGIR TICKETS DELETADOS
 * Marca os tickets como deletados/fechados no Supabase
 */

const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
};

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         CORRIGIR TICKETS DELETADOS NO SUPABASE            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // Tickets que foram deletados no Freshdesk
    const deletedTickets = [7041, 7042];
    
    console.log('🗑️ Atualizando tickets deletados para status 5 (Fechado)...\n');
    
    for (const id of deletedTickets) {
        // Atualizar status para 5 (Fechado) para não contar como pendente
        const url = `${SUPABASE_URL}/rest/v1/tickets?id=eq.${id}`;
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify({
                status: 5, // Fechado
                deleted: true,
                synced_at: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            console.log(`   ✅ Ticket #${id} marcado como Fechado (deletado no Freshdesk)`);
        } else {
            console.log(`   ❌ Erro ao atualizar #${id}: ${await response.text()}`);
        }
    }
    
    // Verificação final
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICAÇÃO FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const PENDING_STATUSES = [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const statusFilter = PENDING_STATUSES.map(s => `status.eq.${s}`).join(',');
    
    let total = 0;
    let offset = 0;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&or=(${statusFilter})&offset=${offset}&limit=1000`;
        const response = await fetch(url, { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } });
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        total += tickets.length;
        if (tickets.length < 1000) break;
        offset += 1000;
    }
    
    console.log(`   Supabase pendentes: ${total}`);
    console.log(`   Freshdesk esperado: 305`);
    console.log(`   Diferença: ${total - 305}`);
    
    if (total === 305) {
        console.log('\n   ✅ 100% SINCRONIZADO! Os números agora são iguais.');
    } else {
        console.log(`\n   ⚠️ Diferença de ${total - 305} ticket(s)`);
    }
}

main().catch(console.error);
