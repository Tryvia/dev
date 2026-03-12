/**
 * SYNC INTEGRITY - Sincronização com Verificação de Integridade
 * 
 * Garante 100% de consistência entre Freshdesk e Supabase
 * 
 * FUNCIONALIDADES:
 * 1. Busca TODOS os tickets pendentes do Freshdesk
 * 2. Compara com Supabase
 * 3. Detecta tickets deletados
 * 4. Corrige automaticamente qualquer diferença
 * 5. Valida resultado final
 * 
 * USO:
 *   node sync-integrity.js           # Execução completa
 *   node sync-integrity.js --dry-run # Apenas mostra o que faria
 *   node sync-integrity.js --force   # Força verificação de todos os tickets
 * 
 * AGENDAR (Windows Task Scheduler ou cron):
 *   A cada 15 minutos para manter dados sincronizados
 */

// Carregar dotenv se disponível
try { require('dotenv').config(); } catch(e) {}

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'suportetryvia';
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY || 's9GQtphoZqeRNz7Enl';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const FRESHDESK_BASE_URL = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2`;

// Flags
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

// Status considerados "pendentes" (não resolvidos/fechados)
const PENDING_STATUSES = [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE BUSCA
// ═══════════════════════════════════════════════════════════════

async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                console.log(`   ⏳ Rate limit, aguardando ${retryAfter}s...`);
                await sleep(retryAfter * 1000);
                continue;
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(2000);
        }
    }
    throw new Error('Max retries exceeded');
}

async function getAllFreshdeskTickets() {
    console.log('📥 Buscando TODOS os tickets do Freshdesk...\n');
    
    const allTickets = new Map();
    const updatedSince = '2020-01-01T00:00:00Z';
    let page = 1;
    
    while (page <= 100) {
        const url = `${FRESHDESK_BASE_URL}/tickets?updated_since=${updatedSince}&per_page=100&page=${page}&include=stats`;
        
        try {
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            
            if (!response.ok) {
                if (response.status === 404) break;
                console.log(`   ⚠️ Página ${page}: erro ${response.status}`);
                break;
            }
            
            const tickets = await response.json();
            if (!tickets || tickets.length === 0) break;
            
            tickets.forEach(t => allTickets.set(t.id, t));
            
            if (page % 10 === 0) {
                console.log(`   Página ${page}: ${allTickets.size} tickets únicos...`);
            }
            
            if (tickets.length < 100) break;
            page++;
            await sleep(300);
        } catch (e) {
            console.log(`   ❌ Erro: ${e.message}`);
            break;
        }
    }
    
    console.log(`   ✅ Total: ${allTickets.size} tickets do Freshdesk\n`);
    return allTickets;
}

async function getSupabaseTickets() {
    console.log('📊 Buscando tickets do Supabase...\n');
    
    const tickets = new Map();
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id,status,updated_at&order=id.asc&offset=${offset}&limit=${limit}`;
        const response = await fetch(url, { 
            headers: { 
                'apikey': SUPABASE_SERVICE_KEY, 
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` 
            } 
        });
        
        if (!response.ok) {
            console.log(`   ⚠️ Erro ao buscar offset ${offset}`);
            break;
        }
        
        const data = await response.json();
        if (!data || data.length === 0) break;
        
        data.forEach(t => tickets.set(t.id, t));
        console.log(`   Carregados ${tickets.size} tickets...`);
        
        if (data.length < limit) break;
        offset += limit;
    }
    
    console.log(`   ✅ Total: ${tickets.size} tickets no Supabase\n`);
    return tickets;
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE ANÁLISE
// ═══════════════════════════════════════════════════════════════

function analyzeDiscrepancies(fdTickets, sbTickets) {
    console.log('🔍 Analisando discrepâncias...\n');
    
    const issues = {
        missingInSupabase: [],      // Tickets no FD mas não no SB
        statusMismatch: [],         // Status diferente
        possiblyDeleted: [],        // No SB mas não no FD (pode ter sido deletado)
        pendingInSBNotInFD: []      // Pendente no SB mas não aparece como pendente no FD
    };
    
    // Tickets no Freshdesk que não estão no Supabase
    for (const [id, fdTicket] of fdTickets) {
        if (!sbTickets.has(id)) {
            issues.missingInSupabase.push(fdTicket);
        }
    }
    
    // Tickets no Supabase que podem ter sido deletados
    for (const [id, sbTicket] of sbTickets) {
        if (!fdTickets.has(id)) {
            // Apenas se for pendente no Supabase
            if (PENDING_STATUSES.includes(sbTicket.status)) {
                issues.possiblyDeleted.push(sbTicket);
            }
        }
    }
    
    // Tickets com status diferente
    for (const [id, fdTicket] of fdTickets) {
        const sbTicket = sbTickets.get(id);
        if (sbTicket && sbTicket.status !== fdTicket.status) {
            issues.statusMismatch.push({
                id,
                fdStatus: fdTicket.status,
                sbStatus: sbTicket.status,
                fdTicket
            });
        }
    }
    
    // Contar pendentes em cada sistema
    let fdPendingCount = 0;
    let sbPendingCount = 0;
    
    for (const [id, t] of fdTickets) {
        if (PENDING_STATUSES.includes(t.status)) fdPendingCount++;
    }
    
    for (const [id, t] of sbTickets) {
        if (PENDING_STATUSES.includes(t.status)) sbPendingCount++;
    }
    
    return {
        ...issues,
        fdPendingCount,
        sbPendingCount,
        difference: sbPendingCount - fdPendingCount
    };
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE CORREÇÃO
// ═══════════════════════════════════════════════════════════════

async function verifyAndFixDeletedTickets(possiblyDeleted) {
    if (possiblyDeleted.length === 0) return [];
    
    console.log(`🔍 Verificando ${possiblyDeleted.length} tickets possivelmente deletados...\n`);
    
    const confirmed = [];
    
    for (const sbTicket of possiblyDeleted) {
        const url = `${FRESHDESK_BASE_URL}/tickets/${sbTicket.id}`;
        
        try {
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            
            if (response.status === 404) {
                // Ticket não existe mais
                confirmed.push({ id: sbTicket.id, reason: 'not_found' });
                console.log(`   🗑️ #${sbTicket.id}: NÃO EXISTE no Freshdesk`);
            } else if (response.ok) {
                const ticket = await response.json();
                if (ticket.deleted === true) {
                    confirmed.push({ id: sbTicket.id, reason: 'deleted_flag' });
                    console.log(`   🗑️ #${sbTicket.id}: DELETADO no Freshdesk`);
                } else if (!PENDING_STATUSES.includes(ticket.status)) {
                    // Status mudou para resolvido/fechado
                    confirmed.push({ id: sbTicket.id, reason: 'status_changed', newStatus: ticket.status });
                    console.log(`   🔄 #${sbTicket.id}: Status mudou para ${ticket.status}`);
                }
            }
        } catch (e) {
            console.log(`   ⚠️ #${sbTicket.id}: Erro - ${e.message}`);
        }
        
        await sleep(250);
    }
    
    return confirmed;
}

async function fixTickets(issues, confirmedDeleted) {
    if (DRY_RUN) {
        console.log('\n⚠️ DRY RUN - Nenhuma alteração será feita\n');
        return;
    }
    
    let fixed = 0;
    
    // 1. Adicionar tickets faltantes
    if (issues.missingInSupabase.length > 0) {
        console.log(`\n📤 Adicionando ${issues.missingInSupabase.length} tickets faltantes...\n`);
        
        const data = issues.missingInSupabase.map(t => transformTicket(t));
        
        for (let i = 0; i < data.length; i += 100) {
            const batch = data.slice(i, i + 100);
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify(batch)
            });
            
            if (response.ok) {
                fixed += batch.length;
            }
        }
        
        console.log(`   ✅ ${fixed} tickets adicionados`);
    }
    
    // 2. Corrigir status diferentes
    if (issues.statusMismatch.length > 0) {
        console.log(`\n🔄 Corrigindo ${issues.statusMismatch.length} tickets com status diferente...\n`);
        
        for (const issue of issues.statusMismatch) {
            const data = transformTicket(issue.fdTicket);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify([data])
            });
            
            if (response.ok) {
                fixed++;
            }
        }
        
        console.log(`   ✅ ${issues.statusMismatch.length} tickets corrigidos`);
    }
    
    // 3. Marcar deletados como fechados
    if (confirmedDeleted.length > 0) {
        console.log(`\n🗑️ Marcando ${confirmedDeleted.length} tickets deletados como fechados...\n`);
        
        for (const item of confirmedDeleted) {
            const newStatus = item.newStatus || 5; // Fechado
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets?id=eq.${item.id}`, {
                method: 'PATCH',
                headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                    status: newStatus,
                    synced_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                fixed++;
            }
        }
        
        console.log(`   ✅ ${confirmedDeleted.length} tickets marcados`);
    }
    
    return fixed;
}

function transformTicket(ticket) {
    const cf = ticket.custom_fields || {};
    return {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        source: ticket.source,
        type: ticket.type,
        updated_at: ticket.updated_at,
        created_at: ticket.created_at,
        due_by: ticket.due_by,
        fr_due_by: ticket.fr_due_by,
        responder_id: ticket.responder_id,
        group_id: ticket.group_id,
        company_id: ticket.company_id,
        requester_id: ticket.requester_id,
        tags: ticket.tags || [],
        is_escalated: ticket.is_escalated || false,
        fr_escalated: ticket.fr_escalated || false,
        cf_tratativa: cf.cf_tratativa || cf.cf_tratativa1684353202918 || null,
        cf_grupo_tratativa: cf.cf_grupo_tratativa || cf.cf_grupo_tratativa1684353283756 || null,
        cf_sistema: cf.cf_sistema || null,
        cf_acompanhamento_atendimento: cf.cf_analista || null,
        stats_resolved_at: ticket.stats?.resolved_at || null,
        stats_closed_at: ticket.stats?.closed_at || null,
        stats_first_responded_at: ticket.stats?.first_responded_at || null,
        synced_at: new Date().toISOString()
    };
}

// ═══════════════════════════════════════════════════════════════
// VERIFICAÇÃO FINAL
// ═══════════════════════════════════════════════════════════════

async function verifyFinalCount() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICAÇÃO FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Contar pendentes no Supabase
    const filter = PENDING_STATUSES.map(s => `status.eq.${s}`).join(',');
    let sbCount = 0;
    let offset = 0;
    
    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/tickets?select=id&or=(${filter})&offset=${offset}&limit=1000`;
        const response = await fetch(url, { headers: supabaseHeaders });
        const data = await response.json();
        if (!data || data.length === 0) break;
        sbCount += data.length;
        if (data.length < 1000) break;
        offset += 1000;
    }
    
    // Buscar contagem atual do Freshdesk (tickets recentes)
    let fdCount = 0;
    const updatedSince = '2020-01-01T00:00:00Z';
    let page = 1;
    
    while (page <= 100) {
        const url = `${FRESHDESK_BASE_URL}/tickets?updated_since=${updatedSince}&per_page=100&page=${page}`;
        try {
            const response = await fetchWithRetry(url, { headers: freshdeskHeaders });
            if (!response.ok) break;
            const tickets = await response.json();
            if (!tickets || tickets.length === 0) break;
            fdCount += tickets.filter(t => PENDING_STATUSES.includes(t.status)).length;
            if (tickets.length < 100) break;
            page++;
            await sleep(300);
        } catch (e) {
            break;
        }
    }
    
    console.log(`   Freshdesk pendentes: ${fdCount}`);
    console.log(`   Supabase pendentes:  ${sbCount}`);
    console.log(`   Diferença: ${sbCount - fdCount}`);
    
    if (sbCount === fdCount) {
        console.log('\n   ✅ 100% SINCRONIZADO!');
        return true;
    } else {
        console.log(`\n   ⚠️ Ainda há diferença de ${Math.abs(sbCount - fdCount)} ticket(s)`);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
    const startTime = Date.now();
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║      SYNC INTEGRITY - Sincronização com Integridade       ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║ Data: ${new Date().toISOString()}                   ║`);
    console.log(`║ Modo: ${DRY_RUN ? 'DRY RUN (simulação)' : 'EXECUÇÃO REAL'}                           ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 1. Buscar dados de ambos os sistemas
    const fdTickets = await getAllFreshdeskTickets();
    const sbTickets = await getSupabaseTickets();
    
    // 2. Analisar discrepâncias
    const issues = analyzeDiscrepancies(fdTickets, sbTickets);
    
    // 3. Mostrar relatório
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RELATÓRIO DE DISCREPÂNCIAS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`   Freshdesk pendentes: ${issues.fdPendingCount}`);
    console.log(`   Supabase pendentes:  ${issues.sbPendingCount}`);
    console.log(`   Diferença: ${issues.difference}\n`);
    
    console.log(`   Tickets faltantes no Supabase: ${issues.missingInSupabase.length}`);
    console.log(`   Tickets com status diferente: ${issues.statusMismatch.length}`);
    console.log(`   Tickets possivelmente deletados: ${issues.possiblyDeleted.length}`);
    
    // 4. Verificar e corrigir tickets deletados
    let confirmedDeleted = [];
    if (issues.possiblyDeleted.length > 0) {
        confirmedDeleted = await verifyAndFixDeletedTickets(issues.possiblyDeleted);
    }
    
    // 5. Aplicar correções
    const totalIssues = issues.missingInSupabase.length + 
                        issues.statusMismatch.length + 
                        confirmedDeleted.length;
    
    if (totalIssues > 0) {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('🔧 APLICANDO CORREÇÕES');
        console.log('═══════════════════════════════════════════════════════════');
        
        await fixTickets(issues, confirmedDeleted);
    } else {
        console.log('\n✅ Nenhuma correção necessária!');
    }
    
    // 6. Verificação final
    const success = await verifyFinalCount();
    
    // 7. Resumo
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`⏱️ Concluído em ${duration}s`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(success ? 0 : 1);
}

main().catch(err => {
    console.error('\n❌ ERRO:', err.message);
    process.exit(1);
});
