/**
 * INVESTIGAR TICKETS 7041 E 7042
 * Por que não aparecem no Dashboard Freshdesk?
 */

const FRESHDESK_DOMAIN = 'suportetryvia';
const FRESHDESK_API_KEY = 's9GQtphoZqeRNz7Enl';

const FRESHDESK_BASE_URL = `https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2`;

const freshdeskHeaders = {
    'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
    'Content-Type': 'application/json'
};

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║        INVESTIGAR TICKETS #7041 E #7042                   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const ticketIds = [7041, 7042];
    
    for (const id of ticketIds) {
        console.log(`\n🔍 TICKET #${id}`);
        console.log('═══════════════════════════════════════════════════════════\n');
        
        const url = `${FRESHDESK_BASE_URL}/tickets/${id}?include=stats,requester,company`;
        const response = await fetch(url, { headers: freshdeskHeaders });
        
        if (!response.ok) {
            console.log(`   ❌ Erro: ${response.status}`);
            continue;
        }
        
        const ticket = await response.json();
        
        console.log(`   Subject: ${ticket.subject}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Priority: ${ticket.priority}`);
        console.log(`   Type: ${ticket.type || 'N/A'}`);
        console.log(`   Source: ${ticket.source}`);
        console.log(`   Group ID: ${ticket.group_id}`);
        console.log(`   Responder ID: ${ticket.responder_id || 'N/A'}`);
        console.log(`   Company ID: ${ticket.company_id || 'N/A'}`);
        console.log(`   Created: ${ticket.created_at}`);
        console.log(`   Updated: ${ticket.updated_at}`);
        console.log(`   Due By: ${ticket.due_by || 'N/A'}`);
        console.log(`   FR Due By: ${ticket.fr_due_by || 'N/A'}`);
        console.log(`   Is Escalated: ${ticket.is_escalated}`);
        console.log(`   FR Escalated: ${ticket.fr_escalated}`);
        console.log(`   Tags: ${JSON.stringify(ticket.tags)}`);
        console.log(`   Spam: ${ticket.spam}`);
        console.log(`   Deleted: ${ticket.deleted}`);
        
        if (ticket.custom_fields) {
            console.log(`\n   Custom Fields:`);
            for (const [key, value] of Object.entries(ticket.custom_fields)) {
                if (value) console.log(`     ${key}: ${value}`);
            }
        }
        
        console.log('');
    }
    
    // Buscar todos os tickets com status 10 do Freshdesk para ver quantos existem
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 CONTANDO TICKETS COM STATUS 10 NO FRESHDESK');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let count = 0;
    let page = 1;
    
    while (page <= 10) {
        const url = `${FRESHDESK_BASE_URL}/tickets?status=10&per_page=100&page=${page}`;
        const response = await fetch(url, { headers: freshdeskHeaders });
        
        if (!response.ok) break;
        
        const tickets = await response.json();
        if (!tickets || tickets.length === 0) break;
        
        count += tickets.length;
        console.log(`   Página ${page}: ${tickets.length} tickets`);
        
        // Verificar se 7041 e 7042 estão na lista
        const ids = tickets.map(t => t.id);
        if (ids.includes(7041)) console.log(`   → #7041 encontrado!`);
        if (ids.includes(7042)) console.log(`   → #7042 encontrado!`);
        
        if (tickets.length < 100) break;
        page++;
    }
    
    console.log(`\n   Total com status 10: ${count}`);
}

main().catch(console.error);
