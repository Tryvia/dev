/**
 * Script de atualização em massa de TODOS os custom fields
 * Garante que cf_tratativa, cf_acompanhamento_atendimento e outros estejam corretos
 * 
 * Uso: node sync-freshdesk/update-all-custom-fields.js
 * 
 * Este script é a versão completa que atualiza:
 * - cf_tratativa
 * - cf_acompanhamento_atendimento (cf_analista no Freshdesk)
 * - cf_grupo_tratativa
 * - cf_sistema
 * - cf_tipo_primario
 * - cf_tipo_secundario
 */

// dotenv opcional
try { require('dotenv').config(); } catch(e) {}

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!FRESHDESK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente necessárias:');
    console.error('   FRESHDESK_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const freshdeskAuth = Buffer.from(`${FRESHDESK_API_KEY}:X`).toString('base64');

// Controle de rate limit
let requestCount = 0;
let lastMinuteStart = Date.now();
const MAX_REQUESTS_PER_MINUTE = 45;

async function respectRateLimit() {
    requestCount++;
    const elapsed = Date.now() - lastMinuteStart;
    
    if (elapsed >= 60000) {
        requestCount = 1;
        lastMinuteStart = Date.now();
        return;
    }
    
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        const waitTime = 60000 - elapsed + 1000;
        console.log(`   ⏳ Rate limit: aguardando ${Math.ceil(waitTime/1000)}s...`);
        await new Promise(r => setTimeout(r, waitTime));
        requestCount = 1;
        lastMinuteStart = Date.now();
    }
}

async function getAllTicketsFromSupabase() {
    console.log('📥 Buscando tickets do Supabase...');
    const allTickets = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        
        if (!response.ok) throw new Error(`Erro Supabase: ${response.status}`);
        
        const tickets = await response.json();
        if (tickets.length === 0) break;
        
        allTickets.push(...tickets);
        offset += limit;
        process.stdout.write(`\r   ${allTickets.length} tickets carregados...`);
    }
    
    console.log(`\n   ✅ ${allTickets.length} tickets no Supabase`);
    return allTickets;
}

async function getTicketFromFreshdesk(ticketId) {
    await respectRateLimit();
    
    const url = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2/tickets/${ticketId}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Basic ${freshdeskAuth}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (response.status === 404) return null;
    
    if (!response.ok) {
        if (response.status === 429) {
            console.log('   ⚠️ Rate limit atingido, aguardando 60s...');
            await new Promise(r => setTimeout(r, 60000));
            return getTicketFromFreshdesk(ticketId);
        }
        throw new Error(`Freshdesk error ${response.status}`);
    }
    
    return response.json();
}

function extractCustomFields(fdTicket) {
    const cf = fdTicket.custom_fields || {};
    return {
        cf_tratativa: cf.cf_tratativa || cf.cf_tratativa1684353202918 || null,
        cf_acompanhamento_atendimento: cf.cf_analista || null,
        cf_grupo_tratativa: cf.cf_grupo_tratativa || cf.cf_grupo_tratativa1684353283756 || null,
        cf_sistema: cf.cf_sistema || null,
        cf_tipo_primario: cf.cf_tipo_primario || null,
        cf_tipo_secundario: cf.cf_tipo_secundario || null
    };
}

async function updateSupabase(ticketId, fields) {
    const url = `${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(fields)
    });
    
    if (!response.ok) throw new Error(`Erro update Supabase: ${response.status}`);
    return true;
}

async function main() {
    console.log('═'.repeat(60));
    console.log('🔄 ATUALIZAÇÃO EM MASSA - TODOS OS CUSTOM FIELDS');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('═'.repeat(60));
    console.log('');
    console.log('📋 Campos que serão atualizados:');
    console.log('   • cf_tratativa');
    console.log('   • cf_acompanhamento_atendimento (cf_analista)');
    console.log('   • cf_grupo_tratativa');
    console.log('   • cf_sistema');
    console.log('   • cf_tipo_primario');
    console.log('   • cf_tipo_secundario');
    console.log('');
    
    const startTime = Date.now();
    const tickets = await getAllTicketsFromSupabase();
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    console.log('\n🔄 Atualizando custom fields de cada ticket...\n');
    
    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const progress = ((i + 1) / tickets.length * 100).toFixed(1);
        
        try {
            const fdTicket = await getTicketFromFreshdesk(ticket.id);
            
            if (!fdTicket) {
                notFound++;
                continue;
            }
            
            const fields = extractCustomFields(fdTicket);
            await updateSupabase(ticket.id, fields);
            updated++;
            
            // Log de progresso a cada 50 tickets
            if ((i + 1) % 50 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                const eta = ((tickets.length - i - 1) / (i + 1) * (Date.now() - startTime) / 1000 / 60).toFixed(0);
                console.log(`   📊 [${progress}%] ${i + 1}/${tickets.length} | Atualizados: ${updated} | Tempo: ${elapsed}min | ETA: ${eta}min`);
            }
            
        } catch (err) {
            errors++;
            console.error(`   ❌ Erro ticket #${ticket.id}: ${err.message}`);
        }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA');
    console.log('═'.repeat(60));
    console.log(`   📊 Total de tickets: ${tickets.length}`);
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ❓ Não encontrados: ${notFound}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   ⏱️ Tempo total: ${totalTime} minutos`);
    console.log('═'.repeat(60));
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
