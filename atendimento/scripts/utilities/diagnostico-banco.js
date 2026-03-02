/**
 * DIAGNÓSTICO COMPLETO DO BANCO DE DADOS
 * Analisa inconsistências, duplicações e dados faltantes
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const problemas = [];
const avisos = [];

async function contarRegistros(tabela) {
    const { count, error } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });
    
    if (error) return { count: 0, error: error.message };
    return { count, error: null };
}

async function buscarTodos(tabela, campos = 'id') {
    let allData = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from(tabela)
            .select(campos)
            .range(offset, offset + limit - 1);
        
        if (error) return { data: [], error: error.message };
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < limit) break;
        offset += limit;
    }
    
    return { data: allData, error: null };
}

async function analisarTickets() {
    console.log('\n📋 ANALISANDO TICKETS...');
    
    const { data: tickets, error } = await buscarTodos('tickets', 'id, status, tags, subject, created_at, updated_at, synced_at');
    if (error) {
        problemas.push(`❌ Erro ao buscar tickets: ${error}`);
        return { min: 0, max: 0, total: 0, ids: [] };
    }
    
    const ids = tickets.map(t => t.id);
    const minId = Math.min(...ids);
    const maxId = Math.max(...ids);
    
    console.log(`   Total: ${tickets.length}`);
    console.log(`   Range: #${minId} - #${maxId}`);
    
    // Verificar tickets sem subject (dados incompletos)
    const semSubject = tickets.filter(t => !t.subject);
    if (semSubject.length > 0) {
        problemas.push(`⚠️ ${semSubject.length} tickets sem subject (dados incompletos): ${semSubject.slice(0, 10).map(t => '#' + t.id).join(', ')}...`);
    }
    
    // Verificar tickets sem synced_at
    const semSync = tickets.filter(t => !t.synced_at);
    if (semSync.length > 0) {
        avisos.push(`📌 ${semSync.length} tickets sem synced_at (nunca sincronizados completamente)`);
    }
    
    // Verificar duplicados
    const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicados.length > 0) {
        problemas.push(`❌ ${duplicados.length} tickets DUPLICADOS: ${duplicados.join(', ')}`);
    }
    
    // Verificar IDs faltantes no range
    const idsFaltantes = [];
    for (let i = minId; i <= maxId; i++) {
        if (!ids.includes(i)) idsFaltantes.push(i);
    }
    if (idsFaltantes.length > 0 && idsFaltantes.length < 100) {
        avisos.push(`📌 ${idsFaltantes.length} IDs faltantes no range: ${idsFaltantes.slice(0, 20).join(', ')}${idsFaltantes.length > 20 ? '...' : ''}`);
    } else if (idsFaltantes.length >= 100) {
        avisos.push(`📌 ${idsFaltantes.length} IDs faltantes no range (muitos para listar)`);
    }
    
    return { min: minId, max: maxId, total: tickets.length, ids };
}

async function analisarConversations() {
    console.log('\n💬 ANALISANDO CONVERSATIONS...');
    
    const { data: convs, error } = await buscarTodos('conversations', 'id, ticket_id');
    if (error) {
        problemas.push(`❌ Erro ao buscar conversations: ${error}`);
        return { ticketIds: [] };
    }
    
    const ticketIds = [...new Set(convs.map(c => c.ticket_id))];
    const minTicket = Math.min(...ticketIds);
    const maxTicket = Math.max(...ticketIds);
    
    console.log(`   Total conversas: ${convs.length}`);
    console.log(`   Tickets únicos: ${ticketIds.length}`);
    console.log(`   Range ticket_id: #${minTicket} - #${maxTicket}`);
    
    // Verificar duplicados
    const ids = convs.map(c => c.id);
    const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicados.length > 0) {
        problemas.push(`❌ ${duplicados.length} conversations DUPLICADAS`);
    }
    
    return { ticketIds, total: convs.length, maxTicket };
}

async function analisarTimeEntries() {
    console.log('\n⏱️ ANALISANDO TIME_ENTRIES...');
    
    const { data: entries, error } = await buscarTodos('time_entries', 'id, ticket_id');
    if (error) {
        problemas.push(`❌ Erro ao buscar time_entries: ${error}`);
        return { ticketIds: [] };
    }
    
    const ticketIds = [...new Set(entries.map(e => e.ticket_id))];
    
    console.log(`   Total: ${entries.length}`);
    console.log(`   Tickets únicos: ${ticketIds.length}`);
    
    return { ticketIds, total: entries.length };
}

async function analisarSatisfactionRatings() {
    console.log('\n⭐ ANALISANDO SATISFACTION_RATINGS...');
    
    const { data: ratings, error } = await buscarTodos('satisfaction_ratings', 'id, ticket_id, score');
    if (error) {
        problemas.push(`❌ Erro ao buscar satisfaction_ratings: ${error}`);
        return { ticketIds: [] };
    }
    
    const ticketIds = [...new Set(ratings.map(r => r.ticket_id))];
    
    console.log(`   Total: ${ratings.length}`);
    console.log(`   Tickets únicos: ${ticketIds.length}`);
    
    // Verificar ratings sem score
    const semScore = ratings.filter(r => r.score === null || r.score === undefined);
    if (semScore.length > 0) {
        avisos.push(`📌 ${semScore.length} ratings sem score`);
    }
    
    return { ticketIds, total: ratings.length };
}

async function analisarAgentes() {
    console.log('\n👥 ANALISANDO AGENTS...');
    
    const { count } = await contarRegistros('agents');
    console.log(`   Total: ${count}`);
    return count;
}

async function analisarGrupos() {
    console.log('\n👥 ANALISANDO GROUPS...');
    
    const { count } = await contarRegistros('groups');
    console.log(`   Total: ${count}`);
    return count;
}

async function analisarEmpresas() {
    console.log('\n🏢 ANALISANDO COMPANIES...');
    
    const { count } = await contarRegistros('companies');
    console.log(`   Total: ${count}`);
    return count;
}

async function compararTicketsConversations(ticketIds, convTicketIds) {
    console.log('\n🔍 COMPARANDO TICKETS vs CONVERSATIONS...');
    
    // Tickets que não têm conversas
    const ticketsSemConv = ticketIds.filter(id => !convTicketIds.includes(id));
    
    // Conversas de tickets que não existem
    const convsOrfas = convTicketIds.filter(id => !ticketIds.includes(id));
    
    if (ticketsSemConv.length > 0) {
        // Filtrar apenas os mais recentes (provavelmente os que faltam sync)
        const recentes = ticketsSemConv.filter(id => id > 6500);
        if (recentes.length > 0) {
            problemas.push(`⚠️ ${recentes.length} tickets RECENTES (#6500+) sem conversas: ${recentes.slice(0, 15).map(id => '#' + id).join(', ')}${recentes.length > 15 ? '...' : ''}`);
        }
        avisos.push(`📌 Total de ${ticketsSemConv.length} tickets sem conversas (pode ser normal para tickets sem interação)`);
    }
    
    if (convsOrfas.length > 0) {
        problemas.push(`❌ ${convsOrfas.length} conversas de tickets que NÃO EXISTEM: ${convsOrfas.slice(0, 10).map(id => '#' + id).join(', ')}...`);
    }
    
    return { ticketsSemConv, convsOrfas };
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 ${new Date().toISOString()}`);
    
    // 1. Analisar cada tabela
    const ticketsInfo = await analisarTickets();
    const convsInfo = await analisarConversations();
    const timeInfo = await analisarTimeEntries();
    const ratingsInfo = await analisarSatisfactionRatings();
    const agentsCount = await analisarAgentes();
    const groupsCount = await analisarGrupos();
    const companiesCount = await analisarEmpresas();
    
    // 2. Comparar tickets vs conversations
    await compararTicketsConversations(ticketsInfo.ids, convsInfo.ticketIds);
    
    // 3. Verificar gap entre max ticket e max conversation ticket
    if (ticketsInfo.max > convsInfo.maxTicket) {
        const gap = ticketsInfo.max - convsInfo.maxTicket;
        problemas.push(`⚠️ GAP de ${gap} tickets: tickets vai até #${ticketsInfo.max}, conversations vai até ticket #${convsInfo.maxTicket}`);
    }
    
    // 4. Resumo
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   📋 Tickets: ${ticketsInfo.total} (#${ticketsInfo.min} - #${ticketsInfo.max})`);
    console.log(`   💬 Conversations: ${convsInfo.total} (${convsInfo.ticketIds?.length || 0} tickets)`);
    console.log(`   ⏱️ Time Entries: ${timeInfo.total}`);
    console.log(`   ⭐ Ratings: ${ratingsInfo.total}`);
    console.log(`   👥 Agents: ${agentsCount}`);
    console.log(`   👥 Groups: ${groupsCount}`);
    console.log(`   🏢 Companies: ${companiesCount}`);
    
    // 5. Problemas encontrados
    if (problemas.length > 0) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('❌ PROBLEMAS ENCONTRADOS (' + problemas.length + ')');
        console.log('═══════════════════════════════════════════════════════════════');
        problemas.forEach(p => console.log(p));
    }
    
    // 6. Avisos
    if (avisos.length > 0) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📌 AVISOS (' + avisos.length + ')');
        console.log('═══════════════════════════════════════════════════════════════');
        avisos.forEach(a => console.log(a));
    }
    
    if (problemas.length === 0 && avisos.length === 0) {
        console.log('\n✅ Nenhum problema encontrado!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
