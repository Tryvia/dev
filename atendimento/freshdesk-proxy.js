/**
 * Servidor Proxy Local para API Freshdesk
 * Resolve problemas de CORS ao acessar a API do Freshdesk
 * 
 * Como usar:
 * 1. Instale as dependências: npm install express cors axios
 * 2. Execute o servidor: node freshdesk-proxy.js
 * 3. O proxy estará disponível em http://localhost:3002
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3003; // Mudando para porta 3003

// Configurações do Freshdesk (mesmas do sistema)
const FRESHDESK_DOMAIN = 'https://suportetryvia.freshdesk.com';
const FRESHDESK_API_KEY = 's9GQtphoZqeRNz7Enl';

// Habilitar CORS para todas as origens locais
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Proxy Freshdesk funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Proxy: listar COMPANHIAS (empresas)
app.get('/api/companies', async (req, res) => {
  try {
    console.log(' Buscando lista de empresas');
    const perPage = 100;
    let page = 1;
    const companies = [];
    while (true) {
      const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/companies?page=${page}&per_page=${perPage}`;
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      const data = Array.isArray(response.data) ? response.data : [];
      data.forEach(c => companies.push({
        id: c.id,
        name: c.name || `Empresa ${c.id}`,
        domains: c.domains || null,
        health_score: c.health_score || null
      }));
      if (data.length < perPage) break;
      page++;
      await new Promise(r => setTimeout(r, 400));
    }
    console.log(`✅ ${companies.length} empresas carregadas`);
    res.json({ total: companies.length, companies });
  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Proxy para listar tickets
app.get('/api/tickets', async (req, res) => {
  try {
    console.log('📋 Requisição recebida para listar tickets');
    console.log('📝 Parâmetros recebidos:', req.query);
    
    // Construir query string com todos os parâmetros
    // Nota: A API do Freshdesk usa query strings especiais, precisamos preservar o formato
    let queryString = '';
    const params = [];
    
    // Adicionar parâmetros básicos
    if (req.query.per_page) params.push(`per_page=${req.query.per_page}`);
    if (req.query.page) params.push(`page=${req.query.page}`);
    if (req.query.order_by) params.push(`order_by=${req.query.order_by}`);
    if (req.query.order_type) params.push(`order_type=${req.query.order_type}`);
    
    // O parâmetro query precisa ser tratado especialmente
    if (req.query.query) {
      // Decodificar se estiver encoded
      let decodedQuery = decodeURIComponent(req.query.query);
      
      // Para queries de data (created_at, updated_at), NÃO adicione aspas
      // Para outras queries, adicione aspas duplas
      if (decodedQuery.includes('created_at') || decodedQuery.includes('updated_at')) {
        // Query de data - sem aspas
        params.push(`query=${decodedQuery}`);
        console.log(`🔍 Query de data processada SEM aspas: query=${decodedQuery}`);
      } else if (decodedQuery.includes('"') || decodedQuery.includes("'")) {
        // Query já tem aspas
        params.push(`query=${decodedQuery}`);
        console.log(`🔍 Query com aspas existentes: query=${decodedQuery}`);
      } else {
        // Outras queries - adicione aspas
        params.push(`query="${decodedQuery}"`);
        console.log(`🔍 Query processada COM aspas: query="${decodedQuery}"`);
      }
    }
    
    queryString = params.join('&');
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/tickets${queryString ? '?' + queryString : ''}`;
    
    console.log('🔗 URL da API:', apiUrl);
    
    // Fazer requisição para a API do Freshdesk
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${response.data.length} tickets carregados`);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar tickets:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Proxy: listar AGENTES (com paginação)
app.get('/api/agents', async (req, res) => {
  try {
    console.log('👥 Buscando lista de agentes');
    const perPage = 100;
    let page = 1;
    const agents = [];
    while (true) {
      const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/agents?page=${page}&per_page=${perPage}`;
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      const data = Array.isArray(response.data) ? response.data : [];
      data.forEach(a => agents.push({
        id: a.id,
        name: a.contact?.name || a.name || `Agente ${a.id}`,
        email: a.contact?.email || a.email || null,
        active: a.active !== false
      }));
      if (data.length < perPage) break;
      page++;
      await new Promise(r => setTimeout(r, 400));
    }
    console.log(`✅ ${agents.length} agentes carregados`);
    res.json({ total: agents.length, agents });
  } catch (error) {
    console.error('❌ Erro ao buscar agentes:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Proxy: listar GRUPOS (times)
app.get('/api/groups', async (req, res) => {
  try {
    console.log('👥 Buscando lista de grupos');
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/groups`;
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    const groups = Array.isArray(response.data) ? response.data.map(g => ({
      id: g.id,
      name: g.name || `Grupo ${g.id}`,
      description: g.description || null
    })) : [];
    console.log(`✅ ${groups.length} grupos carregados`);
    res.json({ total: groups.length, groups });
  } catch (error) {
    console.error('❌ Erro ao buscar grupos:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Proxy para buscar um ticket específico
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    console.log(`📋 Buscando ticket #${ticketId}`);
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/tickets/${ticketId}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Ticket #${ticketId} carregado`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`❌ Erro ao buscar ticket #${req.params.id}:`, error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Proxy para criar ticket
app.post('/api/tickets', async (req, res) => {
  try {
    console.log('➕ Criando novo ticket');
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/tickets`;
    
    const response = await axios.post(apiUrl, req.body, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Ticket criado com ID #${response.data.id}`);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro ao criar ticket:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// Proxy para atualizar ticket
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    console.log(`📝 Atualizando ticket #${ticketId}`);
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/tickets/${ticketId}`;
    
    const response = await axios.put(apiUrl, req.body, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Ticket #${ticketId} atualizado`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`❌ Erro ao atualizar ticket #${req.params.id}:`, error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// NOVO ENDPOINT - Buscar TODOS os tickets incluindo fechados
app.get('/api/tickets-all', async (req, res) => {
  try {
    console.log('🔍 NOVO MÉTODO: Buscando TODOS os tickets (incluindo fechados)');
    
    let allTickets = [];
    let totalFetched = 0;
    const ticketMap = new Map(); // Para evitar duplicatas
    
    // Estratégia: Buscar por diferentes períodos de tempo
    const periods = [
      { days: 30, label: 'Último mês' },
      { days: 60, label: 'Últimos 2 meses' },
      { days: 90, label: 'Últimos 3 meses' },
      { days: 180, label: 'Últimos 6 meses' },
      { days: 365, label: 'Último ano' },
      { days: 730, label: 'Últimos 2 anos' },
      { days: 1095, label: 'Últimos 3 anos' },
      { days: 1825, label: 'Últimos 5 anos' }
    ];
    
    // Buscar para cada período
    for (const period of periods) {
      console.log(`\n📅 Buscando tickets: ${period.label}`);
      
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - period.days);
      const updatedSince = sinceDate.toISOString().split('T')[0] + 'T00:00:00Z';
      
      let page = 1;
      let hasMore = true;
      let periodCount = 0;
      
      while (hasMore && page <= 50) { // Máximo 50 páginas por período
        try {
          // Construir URL com parâmetros para buscar TODOS os tickets
          let apiUrl = `${FRESHDESK_DOMAIN}/api/v2/tickets`;
          const params = [];
          
          params.push(`page=${page}`);
          params.push('per_page=100');
          params.push('order_by=created_at');
          params.push('order_type=desc');
          params.push(`updated_since=${updatedSince}`);
          
          // Incluir informações extras incluindo SLA
          params.push('include=description,requester,stats,company');
          
          apiUrl += '?' + params.join('&');
          
          console.log(`   📋 Período: ${period.label}, Página ${page}`);
        
          const response = await axios.get(apiUrl, {
            headers: {
              'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 segundos timeout
          });
          
          if (response.data && Array.isArray(response.data)) {
            const pageCount = response.data.length;
            
            // Adicionar apenas tickets únicos (evitar duplicatas)
            response.data.forEach(ticket => {
              if (!ticketMap.has(ticket.id)) {
                ticketMap.set(ticket.id, ticket);
                periodCount++;
              }
            });
            
            console.log(`   ✅ Página ${page}: ${pageCount} tickets novos`);
            
            // Se retornou menos de 100, é a última página deste período
            if (pageCount < 100) {
              hasMore = false;
              console.log(`   📊 Fim do período: ${periodCount} tickets únicos encontrados`);
            } else {
              page++;
              // Delay de 5 segundos entre páginas (como você sugeriu)
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } else {
            hasMore = false;
          }
          
        } catch (pageError) {
          if (pageError.response && pageError.response.status === 400) {
            console.log(`   ⚠️ Período ${period.label} não disponível ou sem dados`);
          } else if (pageError.response && pageError.response.status === 429) {
            console.log(`   ⏸️ Rate limit atingido, aguardando 10 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            // Tenta novamente
            continue;
          } else {
            console.log(`   ❌ Erro: ${pageError.message}`);
          }
          hasMore = false;
        }
      }
      
      // Delay de 10 segundos entre períodos diferentes
      if (period !== periods[periods.length - 1]) {
        console.log(`   ⏳ Aguardando 10 segundos antes do próximo período...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    // Converter Map para Array
    allTickets = Array.from(ticketMap.values());
    
    // Ordenar por data de criação (mais recentes primeiro)
    allTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`\n📊 TOTAL GERAL: ${allTickets.length} tickets únicos encontrados`);
    console.log(`✅ Tickets com SLA: ${allTickets.filter(t => t.stats).length}`);
    console.log(`📈 Tickets fechados: ${allTickets.filter(t => t.status === 5).length}`);
    console.log(`📈 Tickets resolvidos: ${allTickets.filter(t => t.status === 4).length}`);
    console.log(`📈 Tickets abertos: ${allTickets.filter(t => t.status === 2).length}`);
    
    res.json({
      success: true,
      total: allTickets.length,
      tickets: allTickets,
      method: 'multi-period',
      stats: {
        withSLA: allTickets.filter(t => t.stats).length,
        closed: allTickets.filter(t => t.status === 5).length,
        resolved: allTickets.filter(t => t.status === 4).length,
        open: allTickets.filter(t => t.status === 2).length
      }
    });
    
  } catch (error) {
    console.error('❌ Erro geral ao buscar todos os tickets:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// NOVO ENDPOINT - Buscar SATISFACTION RATINGS (CSAT)
app.get('/api/satisfaction-ratings', async (req, res) => {
  try {
    console.log('⭐ Buscando avaliações de satisfação (CSAT)');
    
    const allRatings = [];
    const ratingsMap = new Map();
    let page = 1;
    let hasMore = true;
    
    // Data inicial padrão: 2015-01-01
    const createdSince = req.query.created_since || '2015-01-01T00:00:00Z';
    
    while (hasMore && page <= 100) { // Máximo 100 páginas
      try {
        const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/surveys/satisfaction_ratings?created_since=${createdSince}&page=${page}&per_page=100`;
        
        console.log(`   📋 Página ${page}...`);
        
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        if (response.data && Array.isArray(response.data)) {
          const pageCount = response.data.length;
          
          response.data.forEach(rating => {
            if (!ratingsMap.has(rating.id)) {
              ratingsMap.set(rating.id, rating);
            }
          });
          
          console.log(`   ✅ Página ${page}: ${pageCount} avaliações`);
          
          if (pageCount < 100) {
            hasMore = false;
          } else {
            page++;
            // Delay para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          hasMore = false;
        }
        
      } catch (pageError) {
        if (pageError.response?.status === 429) {
          console.log(`   ⏸️ Rate limit, aguardando 10s...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        } else {
          console.log(`   ❌ Erro: ${pageError.message}`);
          hasMore = false;
        }
      }
    }
    
    const ratings = Array.from(ratingsMap.values());
    
    // Calcular estatísticas
    const stats = {
      total: ratings.length,
      satisfied: ratings.filter(r => r.ratings?.default_question >= 4).length,
      neutral: ratings.filter(r => r.ratings?.default_question === 3).length,
      dissatisfied: ratings.filter(r => r.ratings?.default_question <= 2 && r.ratings?.default_question > 0).length,
      byScore: {}
    };
    
    // Contar por score
    ratings.forEach(r => {
      const score = r.ratings?.default_question || 0;
      stats.byScore[score] = (stats.byScore[score] || 0) + 1;
    });
    
    // Calcular CSAT %
    const respondedCount = ratings.filter(r => r.ratings?.default_question > 0).length;
    stats.csatPercent = respondedCount > 0 ? 
      Math.round((stats.satisfied / respondedCount) * 100) : 0;
    
    console.log(`\n⭐ TOTAL: ${ratings.length} avaliações de satisfação`);
    console.log(`   📊 CSAT: ${stats.csatPercent}%`);
    console.log(`   ✅ Satisfeitos: ${stats.satisfied}`);
    console.log(`   😐 Neutros: ${stats.neutral}`);
    console.log(`   ❌ Insatisfeitos: ${stats.dissatisfied}`);
    
    res.json({
      success: true,
      total: ratings.length,
      ratings: ratings,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar satisfaction ratings:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

// NOVO ENDPOINT - Buscar satisfaction rating de um ticket específico
app.get('/api/tickets/:id/satisfaction-rating', async (req, res) => {
  try {
    const ticketId = req.params.id;
    console.log(`⭐ Buscando satisfação do ticket #${ticketId}`);
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/tickets/${ticketId}/satisfaction_ratings`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Satisfação do ticket #${ticketId} carregada`);
    res.json(response.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      res.json({ message: 'Sem avaliação de satisfação para este ticket', rating: null });
    } else {
      console.error(`❌ Erro ao buscar satisfação do ticket #${req.params.id}:`, error.message);
      res.status(error.response?.status || 500).json({
        error: error.message,
        status: error.response?.status,
        details: error.response?.data
      });
    }
  }
});

// NOVO ENDPOINT - Time Entries de um ticket
app.get('/api/tickets/:id/time_entries', async (req, res) => {
  try {
    const ticketId = req.params.id;
    console.log(`⏱️ Buscando time entries do ticket #${ticketId}`);
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/tickets/${ticketId}/time_entries`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${response.data.length} time entries do ticket #${ticketId}`);
    res.json(response.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      res.json([]);
    } else {
      console.error(`❌ Erro ao buscar time entries:`, error.message);
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  }
});

// NOVO ENDPOINT - Listar Products
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Buscando produtos');
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/products`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${response.data.length} produtos carregados`);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// NOVO ENDPOINT - Listar Business Hours
app.get('/api/business_hours', async (req, res) => {
  try {
    console.log('🕐 Buscando business hours');
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/business_hours`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${response.data.length} business hours carregados`);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar business hours:', error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// NOVO ENDPOINT - Listar Surveys
app.get('/api/surveys', async (req, res) => {
  try {
    console.log('📊 Buscando surveys');
    
    const apiUrl = `${FRESHDESK_DOMAIN}/api/v2/surveys`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FRESHDESK_API_KEY + ':X').toString('base64'),
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${response.data.length} surveys carregados`);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar surveys:', error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Proxy Freshdesk iniciado!');
  console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🌐 Domínio Freshdesk: ${FRESHDESK_DOMAIN}`);
  console.log('\n📋 Endpoints disponíveis:');
  console.log('  GET  /test                           - Testar conexão');
  console.log('  GET  /api/tickets                    - Listar tickets');
  console.log('  GET  /api/tickets-all                - Listar TODOS os tickets');
  console.log('  GET  /api/agents                     - Listar agentes');
  console.log('  GET  /api/groups                     - Listar grupos (times)');
  console.log('  GET  /api/companies                  - Listar empresas');
  console.log('  GET  /api/products                   - Listar produtos');
  console.log('  GET  /api/business_hours             - Listar business hours');
  console.log('  GET  /api/surveys                    - Listar surveys');
  console.log('  GET  /api/tickets/:id                - Buscar ticket específico');
  console.log('  GET  /api/tickets/:id/time_entries   - Time entries de um ticket');
  console.log('  GET  /api/satisfaction-ratings       - Listar avaliações CSAT');
  console.log('  GET  /api/tickets/:id/satisfaction-rating - CSAT de um ticket');
  console.log('  POST /api/tickets                    - Criar novo ticket');
  console.log('  PUT  /api/tickets/:id                - Atualizar ticket');
  console.log('\n✨ Proxy pronto para uso!');
});
