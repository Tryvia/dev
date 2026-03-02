/**
 * Script para corrigir tags desatualizadas
 * Busca tickets específicos do Freshdesk e atualiza no Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

// API Key do Freshdesk - buscar do GitHub Secrets ou configurar aqui
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const FRESHDESK_BASE_URL = 'https://suportetryvia.freshdesk.com/api/v2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tickets da Ailanie que precisam ser verificados
const ticketsParaVerificar = [5422, 5279, 5761, 5739, 5825, 5576, 5056];

async function buscarTicketFreshdesk(ticketId) {
    if (!FRESHDESK_API_KEY) {
        console.error('❌ FRESHDESK_API_KEY não configurada');
        return null;
    }

    const url = `${FRESHDESK_BASE_URL}/tickets/${ticketId}`;
    const headers = {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.error(`❌ Erro ao buscar ticket #${ticketId}: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Erro ao buscar ticket #${ticketId}:`, error.message);
        return null;
    }
}

async function atualizarTicketSupabase(ticketId, tags, status) {
    const { error } = await supabase
        .from('tickets')
        .update({ 
            tags: tags,
            status: status,
            synced_at: new Date().toISOString()
        })
        .eq('id', ticketId);

    if (error) {
        console.error(`❌ Erro ao atualizar ticket #${ticketId} no Supabase:`, error.message);
        return false;
    }
    return true;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔧 CORREÇÃO DE TAGS - TICKETS AILANIE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!FRESHDESK_API_KEY) {
        console.log('⚠️  FRESHDESK_API_KEY não configurada.');
        console.log('');
        console.log('Execute com:');
        console.log('  $env:FRESHDESK_API_KEY="sua_api_key"; node fix-tags-ailanie.js');
        console.log('');
        console.log('Ou configure no GitHub Actions secrets.');
        return;
    }

    console.log(`📋 Verificando ${ticketsParaVerificar.length} tickets...\n`);

    let atualizados = 0;
    let erros = 0;

    for (const ticketId of ticketsParaVerificar) {
        console.log(`🔍 Ticket #${ticketId}:`);
        
        const ticketFreshdesk = await buscarTicketFreshdesk(ticketId);
        if (!ticketFreshdesk) {
            erros++;
            continue;
        }

        const tagsFreshdesk = ticketFreshdesk.tags || [];
        const statusFreshdesk = ticketFreshdesk.status;
        const temAilanie = tagsFreshdesk.some(t => 
            t.toLowerCase().includes('alianie') || t.toLowerCase().includes('aliaanie')
        );

        console.log(`   Freshdesk: tags=${JSON.stringify(tagsFreshdesk)}, status=${statusFreshdesk}`);
        console.log(`   Tem tag Ailanie: ${temAilanie ? 'SIM' : 'NÃO'}`);

        // Atualizar no Supabase
        const ok = await atualizarTicketSupabase(ticketId, tagsFreshdesk, statusFreshdesk);
        if (ok) {
            console.log(`   ✅ Atualizado no Supabase`);
            atualizados++;
        } else {
            erros++;
        }
        console.log('');

        // Delay para não bater rate limit
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Concluído: ${atualizados} atualizados, ${erros} erros`);
    console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
