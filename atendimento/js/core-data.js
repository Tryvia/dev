/**
 * Core Data Module - Gerenciamento de dados e lookups do Freshdesk
 * Extraído do HTML inline para melhor organização
 */

(function() {
  'use strict';

  // ============================================
  // INICIALIZAÇÃO DE ESTRUTURAS GLOBAIS
  // ============================================

  // Inicializa DATA como objeto global
  window.DATA = { times: [], dados: {}, rawData: [] };

  // Freshdesk lookups (agentes, grupos, empresas)
  window.FD_LOOKUPS = {
    agents: new Map(),
    groups: new Map(),
    companies: new Map(),
    loaded: false,
    loadingPromise: null
  };

  // ============================================
  // FUNÇÕES DE RESOLUÇÃO DE NOMES
  // ============================================

  window.resolveAgentName = function(id) {
    if (!id) return 'Sem Agente';
    return window.FD_LOOKUPS.agents.get(id) || `Agente ${id}`;
  };

  window.resolveGroupName = function(id) {
    if (!id) return 'Sem Grupo';
    return window.FD_LOOKUPS.groups.get(id) || `Grupo ${id}`;
  };

  window.resolveCompanyName = function(name, id) {
    if (name) return name;
    if (id && window.FD_LOOKUPS.companies.has(id)) return window.FD_LOOKUPS.companies.get(id);
    return '—';
  };

  // ============================================
  // CARREGAMENTO DE LOOKUPS
  // ============================================

  window.loadFreshdeskLookups = async function() {
    if (window.FD_LOOKUPS.loaded) return;
    if (window.FD_LOOKUPS.loadingPromise) return window.FD_LOOKUPS.loadingPromise;
    
    window.FD_LOOKUPS.loadingPromise = (async () => {
      try {
        const ok = typeof checkProxyAvailable === 'function' ? await checkProxyAvailable() : false;
        if (!ok) {
          // Sem proxy: tentar carregar do Supabase como fallback
          await window.loadLookupsFromSupabase();
          return;
        }
        const base = `http://localhost:${window.PROXY_PORT || 3003}`;
        const [agentsRes, groupsRes, companiesRes] = await Promise.all([
          fetch(`${base}/api/agents`, { mode: 'cors' }).then(r => r.ok ? r.json() : { agents: [] }).catch(() => ({ agents: [] })),
          fetch(`${base}/api/groups`, { mode: 'cors' }).then(r => r.ok ? r.json() : { groups: [] }).catch(() => ({ groups: [] })),
          fetch(`${base}/api/companies`, { mode: 'cors' }).then(r => r.ok ? r.json() : { companies: [] }).catch(() => ({ companies: [] })),
        ]);
        // Popular mapas
        window.FD_LOOKUPS.agents.clear();
        (agentsRes.agents || []).forEach(a => window.FD_LOOKUPS.agents.set(a.id, a.name));
        window.FD_LOOKUPS.groups.clear();
        (groupsRes.groups || []).forEach(g => window.FD_LOOKUPS.groups.set(g.id, g.name));
        window.FD_LOOKUPS.companies.clear();
        (companiesRes.companies || []).forEach(c => window.FD_LOOKUPS.companies.set(c.id, c.name));
        window.FD_LOOKUPS.loaded = true;
        console.log(`🔎 Lookups carregados: ${window.FD_LOOKUPS.agents.size} agentes, ${window.FD_LOOKUPS.groups.size} grupos`);
        // Persistir no Supabase para fallback offline
        await window.syncLookupsFromProxyToSupabase();
      } catch (e) {
        console.warn('Falha ao carregar lookups Freshdesk (usando IDs como fallback):', e);
      }
    })();
    
    try {
      await window.FD_LOOKUPS.loadingPromise;
    } finally {
      window.FD_LOOKUPS.loadingPromise = null;
    }
  };

  // Fallback: carregar lookups do Supabase
  window.loadLookupsFromSupabase = async function() {
    try {
      const client = typeof initSupabase === 'function' ? await initSupabase() : null;
      if (!client) return;
      
      const tableAgents = window.SUPABASE_TABLE_AGENTS || 'agents';
      const tableGroups = window.SUPABASE_TABLE_GROUPS || 'groups';
      const tableCompanies = window.SUPABASE_TABLE_COMPANIES || 'companies';
      
      const [a, g, c] = await Promise.all([
        client.from(tableAgents).select('id,name').limit(10000),
        client.from(tableGroups).select('id,name').limit(10000),
        client.from(tableCompanies).select('id,name').limit(100000)
      ]);
      window.FD_LOOKUPS.agents.clear();
      (a.data || []).forEach(row => window.FD_LOOKUPS.agents.set(row.id, row.name));
      window.FD_LOOKUPS.groups.clear();
      (g.data || []).forEach(row => window.FD_LOOKUPS.groups.set(row.id, row.name));
      (c.data || []).forEach(row => window.FD_LOOKUPS.companies.set(row.id, row.name));
      window.FD_LOOKUPS.loaded = (window.FD_LOOKUPS.agents.size + window.FD_LOOKUPS.groups.size) > 0;
      console.log(`🗄️ Lookups carregados do Supabase (fallback)`);
    } catch (e) {
      console.warn('Falha ao carregar lookups do Supabase:', e);
    }
  };

  // Persistir lookups atuais no Supabase
  window.syncLookupsFromProxyToSupabase = async function() {
    try {
      const client = typeof initSupabase === 'function' ? await initSupabase() : null;
      if (!client) return;
      
      const tableAgents = window.SUPABASE_TABLE_AGENTS || 'agents';
      const tableGroups = window.SUPABASE_TABLE_GROUPS || 'groups';
      const tableCompanies = window.SUPABASE_TABLE_COMPANIES || 'companies';
      
      const batchUpsert = async (table, rows, size = 500) => {
        for (let i = 0; i < rows.length; i += size) {
          const slice = rows.slice(i, i + size);
          const { error } = await client.from(table).upsert(slice, { onConflict: 'id' });
          if (error) console.warn(`Erro ao upsert ${table}:`, error);
        }
      };
      const agents = Array.from(window.FD_LOOKUPS.agents, ([id, name]) => ({ id, name }));
      const groups = Array.from(window.FD_LOOKUPS.groups, ([id, name]) => ({ id, name }));
      const companies = Array.from(window.FD_LOOKUPS.companies, ([id, name]) => ({ id, name }));
      await batchUpsert(tableAgents, agents);
      await batchUpsert(tableGroups, groups);
      if (companies.length) await batchUpsert(tableCompanies, companies);
      console.log('✅ Lookups sincronizados no Supabase');
    } catch (e) {
      console.warn('Falha ao sincronizar lookups no Supabase:', e);
    }
  };

  // ============================================
  // CONSTRUÇÃO DE DADOS A PARTIR DOS TICKETS
  // ============================================

  window.buildDATAFromTickets = function(tickets) {
    const byGroup = new Map();
    const groupLabel = (id) => window.resolveGroupName(id);
    const sourceMap = { 1:'Email', 2:'Portal', 3:'Telefone', 4:'Feedback', 5:'Chat', 6:'Saída', 7:'Facebook', 8:'Twitter' };
    const prioMap = { 1:'Baixa', 2:'Média', 3:'Alta', 4:'Urgente' };
    
    const monthKey = (d) => {
      if (!d) return '1970-01';
      const dt = new Date(d);
      if (isNaN(dt)) return '1970-01';
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };
    
    const hoursBetween = (a, b) => {
      if (!a || !b) return null;
      const da = new Date(a), db = new Date(b);
      if (isNaN(da) || isNaN(db)) return null;
      return (db - da) / 36e5;
    };

    tickets.forEach(t => {
      const key = groupLabel(t.group_id);
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(t);
    });

    const makeTeamData = (arr) => {
      const total = arr.length;
      let closed = 0, open = 0;
      let slaFirstSum = 0, slaFirstN = 0;
      let slaResSum = 0, slaResN = 0;
      let resolved24 = 0, resolvedTot = 0;
      const typeAgg = new Map();
      const prioAgg = new Map();
      const origemAgg = new Map();
      const agentesAgg = new Map();
      const empresasAgg = new Map();
      const produtoAgg = new Map();
      const sistemaAgg = new Map();
      const timeline = new Map();
      const estadoAgg = new Map();

      arr.forEach(t => {
        const isClosed = t.status === 4 || t.status === 5;
        if (isClosed) closed++; else open++;

        const hFirst = hoursBetween(t.created_at, t.stats_first_responded_at);
        if (hFirst !== null && isFinite(hFirst)) { slaFirstSum += hFirst; slaFirstN++; }

        const finishAt = t.stats_resolved_at || t.stats_closed_at;
        const hRes = hoursBetween(t.created_at, finishAt);
        if (hRes !== null && isFinite(hRes)) { slaResSum += hRes; slaResN++; }
        if (finishAt) {
          resolvedTot++;
          if (hRes !== null && hRes <= 24) resolved24++;
        }

        typeAgg.set(t.type || '—', (typeAgg.get(t.type || '—') || 0) + 1);
        prioAgg.set(prioMap[t.priority] || String(t.priority || '—'), (prioAgg.get(prioMap[t.priority] || String(t.priority || '—')) || 0) + 1);
        origemAgg.set(sourceMap[t.source] || String(t.source || '—'), (origemAgg.get(sourceMap[t.source] || String(t.source || '—')) || 0) + 1);
        
        const agenteNome = window.resolveAgentName(t.responder_id);
        agentesAgg.set(agenteNome, (agentesAgg.get(agenteNome) || 0) + 1);
        const empresaNome = window.resolveCompanyName(t.company_name, t.company_id);
        empresasAgg.set(empresaNome, (empresasAgg.get(empresaNome) || 0) + 1);

        // Produto e Sistema a partir de custom_fields
        const cf = t.custom_fields || {};
        const produtoKeyCandidates = ['cf_produto', 'produto', 'product', 'cf_produto_afetado', 'cf_produto_relacionado'];
        const sistemaKeyCandidates = ['cf_sistema', 'sistema', 'system', 'cf_sistema_afetado', 'cf_sistema_relacionado', 'cf_sistema_impactado'];
        
        const firstDefined = (obj, keys) => {
          for (const k of keys) {
            if (obj && obj[k] != null && obj[k] !== '') return obj[k];
          }
          return null;
        };
        
        const produtoVal = firstDefined(cf, produtoKeyCandidates) || '—';
        const sistemaVal = firstDefined(cf, sistemaKeyCandidates) || '—';
        produtoAgg.set(produtoVal, (produtoAgg.get(produtoVal) || 0) + 1);
        sistemaAgg.set(sistemaVal, (sistemaAgg.get(sistemaVal) || 0) + 1);
        
        const mk = monthKey(t.created_at);
        timeline.set(mk, (timeline.get(mk) || 0) + 1);

        const est = ({ 2:'Aberto', 3:'Pendente', 4:'Resolvido', 5:'Fechado' })[t.status] || 'Outro';
        estadoAgg.set(est, (estadoAgg.get(est) || 0) + 1);
      });

      const topAgentesArr = Array.from(agentesAgg, ([agente, qtd]) => ({ agente, qtd }))
        .sort((a, b) => b.qtd - a.qtd).slice(0, 10);

      // Mapeia para estrutura legado esperada pelos gráficos (top_tratativa)
      const topTratativaArr = topAgentesArr.map(a => ({ pessoa: a.agente, qtd: a.qtd }));

      return {
        total_tickets: total,
        tickets_fechados: closed,
        tickets_abertos: open,
        taxa_fechamento: total ? ((closed / total) * 100).toFixed(1) : 0,
        sla_primeira_resposta_h_media: slaFirstN ? (slaFirstSum / slaFirstN) : 0,
        sla_resolucao_h_media: slaResN ? (slaResSum / slaResN) : 0,
        sla_24h_pct: resolvedTot ? ((resolved24 / resolvedTot) * 100).toFixed(1) : 0,
        por_tipo_primario: Array.from(typeAgg, ([tipo, qtd]) => ({ tipo_primario: tipo, qtd })).sort((a, b) => b.qtd - a.qtd),
        por_prioridade_dev: Array.from(prioAgg, ([prioridade_dev, qtd]) => ({ prioridade_dev, qtd })).sort((a, b) => b.qtd - a.qtd),
        por_origem: Array.from(origemAgg, ([origem, qtd]) => ({ origem, qtd })).sort((a, b) => b.qtd - a.qtd),
        top_agentes: topAgentesArr,
        top_tratativa: topTratativaArr,
        top_empresas: Array.from(empresasAgg, ([empresa, qtd]) => ({ empresa, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 10),
        timeline_mes: Array.from(timeline, ([mes, qtd]) => ({ mes, qtd })).sort((a, b) => a.mes.localeCompare(b.mes)),
        por_estado: Array.from(estadoAgg, ([estado, qtd]) => ({ estado, qtd })),
        por_produto: Array.from(produtoAgg, ([produto, qtd]) => ({ produto, qtd })).sort((a, b) => b.qtd - a.qtd),
        por_sistema: Array.from(sistemaAgg, ([sistema, qtd]) => ({ sistema, qtd })).sort((a, b) => b.qtd - a.qtd),
        por_situacao: [],
        rawData: arr
      };
    };

    const dados = {};
    const times = [];
    byGroup.forEach((arr, label) => {
      dados[label] = makeTeamData(arr);
      times.push(label);
    });

    return { times, dados, consolidado: makeTeamData(tickets) };
  };

  window.updateGlobalDATAFromTickets = function() {
    const tickets = window.allTicketsCache || [];
    const built = window.buildDATAFromTickets(tickets);
    window.DATA.times = built.times;
    window.DATA.dados = built.dados;
    window.DATA.rawData = tickets;
  };

  // ============================================
  // EVENT LISTENERS
  // ============================================

  // Notifica BI/Relatórios quando tickets são atualizados
  document.addEventListener('tickets:updated', () => {
    (async () => {
      try {
        // Garantir nomes antes de montar DATA
        await window.loadFreshdeskLookups();
        // Semear companies map a partir do cache atual
        (window.allTicketsCache || []).forEach(t => {
          if (t.company_id && t.company_name) {
            window.FD_LOOKUPS.companies.set(t.company_id, t.company_name);
          }
        });
        window.updateGlobalDATAFromTickets();
        if (document.getElementById('biContainer')?.classList.contains('active')) {
          if (typeof initializeBI === 'function') {
            initializeBI();
          }
        }
        if (typeof window.refreshReportsUsingDATA === 'function') {
          window.refreshReportsUsingDATA();
        }
      } catch (e) {
        console.warn('tickets:updated handler falhou:', e);
      }
    })();
  });

  // Restore sidebar state on page load
  window.addEventListener('DOMContentLoaded', () => {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const icon = document.getElementById('toggleIcon');
    
    if (sidebar && toggle && icon) {
      if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        icon.textContent = '☰';
        toggle.style.left = '0';
      } else {
        icon.textContent = '‹';
        toggle.style.left = '280px';
      }
    }

    // Inicialização de lookups (fallback do Supabase + atualização via proxy se possível)
    (async () => {
      try {
        await window.loadLookupsFromSupabase();
        const ok = typeof checkProxyAvailable === 'function' ? await checkProxyAvailable() : false;
        if (ok) await window.loadFreshdeskLookups();
      } catch (e) {
        console.warn('Falha ao inicializar lookups:', e);
      }
      if (typeof setupLookupsAutoSync === 'function') {
        setupLookupsAutoSync();
      }
    })();
  });

  console.log('✅ Core Data Module carregado');
})();
