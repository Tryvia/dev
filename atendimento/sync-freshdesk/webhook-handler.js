/**
 * WEBHOOK HANDLER - Processa eventos do Freshdesk em tempo real
 * 
 * CONFIGURAÇÃO NO FRESHDESK:
 * 1. Admin > Workflows > Automations > Ticket Updates
 * 2. Criar regra: "Quando ticket for criado/atualizado"
 * 3. Ação: Webhook para http://SEU_SERVIDOR:3003/webhook/freshdesk
 * 
 * Este arquivo adiciona os endpoints ao freshdesk-proxy.js existente
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
};

/**
 * Transforma ticket do Freshdesk para formato do Supabase
 */
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

/**
 * Processa webhook do Freshdesk
 * Adicione este código ao freshdesk-proxy.js
 */
function setupWebhookRoutes(app) {
    // Endpoint para receber webhooks do Freshdesk
    app.post('/webhook/freshdesk', async (req, res) => {
        const startTime = Date.now();
        
        try {
            const payload = req.body;
            
            console.log('\n📨 WEBHOOK RECEBIDO');
            console.log(`   Tipo: ${payload.event || 'unknown'}`);
            console.log(`   Ticket ID: ${payload.ticket?.id || payload.freshdesk_webhook?.ticket_id || 'N/A'}`);
            
            // Extrair dados do ticket
            let ticketData = null;
            
            if (payload.ticket) {
                ticketData = payload.ticket;
            } else if (payload.freshdesk_webhook) {
                ticketData = payload.freshdesk_webhook;
            }
            
            if (!ticketData || !ticketData.id) {
                console.log('   ⚠️ Payload sem dados de ticket válidos');
                return res.status(200).json({ status: 'ignored', reason: 'no_ticket_data' });
            }
            
            // Transformar e salvar no Supabase
            const transformed = transformTicket(ticketData);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify([transformed])
            });
            
            if (response.ok) {
                const duration = Date.now() - startTime;
                console.log(`   ✅ Ticket #${ticketData.id} sincronizado em ${duration}ms`);
                
                res.status(200).json({
                    status: 'success',
                    ticket_id: ticketData.id,
                    duration_ms: duration
                });
            } else {
                const error = await response.text();
                console.log(`   ❌ Erro ao salvar: ${error}`);
                res.status(500).json({ status: 'error', message: error });
            }
            
        } catch (error) {
            console.error('   ❌ Erro no webhook:', error.message);
            res.status(500).json({ status: 'error', message: error.message });
        }
    });
    
    // Endpoint para verificar se webhook está funcionando
    app.get('/webhook/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Webhook handler is running'
        });
    });
    
    // Endpoint para deletar ticket (quando deletado no Freshdesk)
    app.post('/webhook/freshdesk/delete', async (req, res) => {
        try {
            const { ticket_id } = req.body;
            
            if (!ticket_id) {
                return res.status(400).json({ error: 'ticket_id required' });
            }
            
            console.log(`\n🗑️ WEBHOOK DELETE - Ticket #${ticket_id}`);
            
            // Marcar como fechado no Supabase
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticket_id}`, {
                method: 'PATCH',
                headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                    status: 5, // Fechado
                    synced_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                console.log(`   ✅ Ticket #${ticket_id} marcado como fechado`);
                res.json({ status: 'success', ticket_id });
            } else {
                res.status(500).json({ error: await response.text() });
            }
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    console.log('📡 Webhook routes configurados:');
    console.log('   POST /webhook/freshdesk - Recebe eventos de ticket');
    console.log('   POST /webhook/freshdesk/delete - Processa deleção');
    console.log('   GET  /webhook/health - Verificar status');
}

module.exports = { setupWebhookRoutes, transformTicket };
