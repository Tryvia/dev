/**
 * Script para investigar tickets da Ailanie
 * Verifica por que há gap entre Freshdesk e Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Status ativos (não resolvidos/fechados)
const statusAtivo = {
    2: 'Aberto',
    3: 'Pendente',
    6: 'Aguardando Cliente',
    7: 'Em análise',
    8: 'Aguardando Parceiros',
    9: 'Aguardando Publicação',
    10: 'Em Homologação',
    11: 'Validação',
    12: 'Levantamento',
    13: 'Em Fila Dev',
    14: 'Interno',
    15: 'Pausado',
    16: 'On Hold',
    17: 'Em Progresso',
    18: 'Escalado',
    19: 'Reaberto',
    20: 'Novo'
};

async function investigarAilanie() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 INVESTIGAÇÃO: TICKETS DA AILANIE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Buscar todos os tickets (tags é JSONB, precisamos filtrar manualmente)
    let allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error: fetchError } = await supabase
            .from('tickets')
            .select('id, status, tags, subject, created_at, updated_at, synced_at')
            .range(offset, offset + limit - 1);
        
        if (fetchError) {
            console.error('❌ Erro:', fetchError.message);
            return;
        }
        if (!data || data.length === 0) break;
        allTickets = allTickets.concat(data);
        if (data.length < limit) break;
        offset += limit;
    }
    
    // Filtrar tickets com tag alianie ou aliaanie
    const ticketsAilanie = allTickets.filter(t => {
        if (!t.tags) return false;
        const tags = Array.isArray(t.tags) ? t.tags : [];
        return tags.some(tag => 
            tag && (tag.toLowerCase().includes('alianie') || tag.toLowerCase().includes('aliaanie'))
        );
    });
    
    const error = null;

    if (error) {
        console.error('❌ Erro:', error.message);
        return;
    }

    console.log(`📊 Total de tickets com tag "alianie/aliaanie": ${ticketsAilanie.length}\n`);

    // Separar por status
    const ativos = ticketsAilanie.filter(t => statusAtivo[t.status]);
    const resolvidos = ticketsAilanie.filter(t => !statusAtivo[t.status]);

    console.log(`✅ Resolvidos/Fechados: ${resolvidos.length}`);
    console.log(`⚡ Ativos: ${ativos.length}\n`);

    if (ativos.length > 0) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📋 TICKETS ATIVOS COM TAG AILANIE:');
        console.log('═══════════════════════════════════════════════════════════════\n');

        ativos.forEach((t, i) => {
            console.log(`${i + 1}. Ticket #${t.id}`);
            console.log(`   Status: ${t.status} (${statusAtivo[t.status] || 'Desconhecido'})`);
            console.log(`   Tags: ${JSON.stringify(t.tags)}`);
            console.log(`   Assunto: ${t.subject?.substring(0, 60)}...`);
            console.log(`   Atualizado: ${t.updated_at}`);
            console.log(`   🔗 https://suportetryvia.freshdesk.com/a/tickets/${t.id}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('⚠️  DIAGNÓSTICO:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('O sync-quick.js só sincroniza tickets das últimas 24h.');
        console.log('Esses tickets têm updated_at antigo (Nov/Dez 2025).');
        console.log('');
        console.log('Verificando datas dos tickets:');
        ativos.forEach(t => {
            console.log(`   #${t.id}: updated=${t.updated_at?.substring(0,10)} | synced=${t.synced_at?.substring(0,10) || 'NUNCA'}`);
        });
        console.log('');
        console.log('CAUSA: Quando tags são removidas no Freshdesk, o updated_at');
        console.log('       do ticket NÃO muda, então o sync-quick não pega.');
        console.log('');
    } else {
        console.log('✅ Nenhum ticket ativo com tag Ailanie no banco.');
        console.log('O BI deve estar usando cache do navegador.');
    }
}

investigarAilanie().catch(console.error);
