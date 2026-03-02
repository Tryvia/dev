/**
 * BI Helpers Module
 * Sistema de tooltips informativos (?) para BIs, KPIs e Listas
 * @version 1.0.0
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO DOS HELPERS
  // ============================================

  const HELPERS_CONFIG = {
    // ========== VISÃO GERAL ==========
    'chartTop10': {
      title: 'Top 10 Pessoas/Times',
      description: 'Mostra as 10 pessoas ou times com mais tickets no período selecionado. No modo expandido, mostra todos com paginação.',
      formula: 'Contagem de tickets onde a entidade aparece no campo de tratativa.',
      tip: 'Números muito altos podem indicar sobrecarga.',
      unifies: null
    },
    'chartResolution': {
      title: 'Taxa de Resolução',
      description: 'Percentual de tickets resolvidos por cada entidade.',
      formula: 'Taxa = (Tickets Resolvidos ÷ Total de Tickets) × 100',
      tip: 'Acima de 70% é saudável. Acima de 85% é excelente.',
      unifies: ['Ranking Resolução']
    },
    'chartStatus': {
      title: 'Distribuição por Status',
      description: 'Composição dos tickets por categoria de status.',
      formula: 'Agrupa tickets em: Resolvido, Aberto, Pendente, Aguardando, Em Progresso.',
      tip: 'Ideal ter maioria em "Resolvido".',
      unifies: ['Status Detalhado']
    },
    'chartPriority': {
      title: 'Distribuição por Prioridade',
      description: 'Composição dos tickets por nível de prioridade.',
      formula: 'Agrupa em: Urgente, Alta, Média, Baixa.',
      tip: 'Muitos tickets urgentes podem indicar problemas sistêmicos.',
      unifies: null
    },
    'chartTimeline': {
      title: 'Timeline Criados vs Resolvidos',
      description: 'Evolução diária de tickets criados e resolvidos nos últimos 30 dias.',
      formula: 'Contagem por data de criação e data de resolução.',
      tip: 'Linhas próximas indicam equilíbrio. Criados acima = backlog crescendo.',
      unifies: null
    },
    'chartSystems': {
      title: 'Top Sistemas com Mais Tickets',
      description: 'Os 10 sistemas que mais geraram tickets no período.',
      formula: 'Contagem por campo cf_teste ou cf_sistema.',
      tip: 'Sistemas no topo podem precisar de melhorias.',
      unifies: null
    },

    // ========== PERFORMANCE / SLA ==========
    'chartSLA': {
      title: 'SLA Geral',
      description: 'Percentual de tickets respondidos dentro do SLA (4 horas).',
      formula: 'SLA% = (Respondidos em ≤4h ÷ Total com resposta) × 100',
      tip: 'Meta recomendada: acima de 80%.',
      unifies: null
    },
    'chartSLAByEntity': {
      title: 'SLA 1ª Resposta por Pessoa/Time',
      description: 'Percentual de tickets respondidos em até 4 horas, por pessoa ou time. Modo normal mostra Top 6, expandido mostra todos.',
      formula: 'SLA% = (Respondidos em ≤4h ÷ Total com resposta) × 100, agrupado por pessoa/time.',
      tip: 'Meta: acima de 80%. Compare pessoas/times similares entre si.',
      unifies: ['Ranking SLA', 'Tendência SLA']
    },
    'chartSLAResolutionByEntity': {
      title: 'SLA Resolução por Pessoa/Time',
      description: 'Percentual de tickets resolvidos em até 24 horas, por pessoa ou time. Modo normal mostra Top 6, expandido mostra todos.',
      formula: 'SLA% = (Resolvidos em ≤24h ÷ Total resolvidos) × 100, agrupado por pessoa/time.',
      tip: 'Meta: acima de 80%. Mede velocidade de conclusão.',
      unifies: null
    },
    'chartSLACountByEntity': {
      title: 'Volume SLA por Pessoa/Time',
      description: 'Números absolutos de tickets dentro e fora do SLA de 1ª resposta, por pessoa ou time. Modo normal mostra Top 6, expandido mostra todos.',
      formula: 'Contagem de tickets: Dentro (≤4h) + Fora (>4h) = Total.',
      tip: 'Barras empilhadas mostram volume real. Verde = dentro, Vermelho = fora.',
      unifies: null
    },
    'chartFirstResponse': {
      title: 'Distribuição First Response',
      description: 'Distribuição do tempo de primeira resposta por faixas.',
      formula: 'Faixas: <1h, 1-4h, 4-8h, 8-24h, >24h.',
      tip: 'Maioria deve estar nas primeiras faixas.',
      unifies: null
    },

    // ========== PRODUTIVIDADE ==========
    'chartByDayOfWeek': {
      title: 'Por Dia da Semana',
      description: 'Quantidade de tickets criados por dia da semana.',
      formula: 'Contagem por dia da semana (Domingo a Sábado).',
      tip: 'Útil para planejar escalas de trabalho.',
      unifies: null
    },
    'chartByHour': {
      title: 'Por Hora',
      description: 'Quantidade de tickets criados por hora do dia.',
      formula: 'Contagem por hora (0h às 23h).',
      tip: 'Identifica horários de pico para dimensionar equipe.',
      unifies: null
    },
    'chartHeatmap': {
      title: 'Mapa de Calor',
      description: 'Intensidade de tickets por combinação de dia e hora.',
      formula: 'Matriz 7x24 com contagem de tickets.',
      tip: 'Cores mais intensas = mais tickets naquele momento.',
      unifies: null
    },
    'chartWorkload': {
      title: 'Tickets em Aberto por Pessoa',
      description: 'Top 6 pessoas/times com mais tickets em aberto. Expandido mostra todos.',
      formula: 'Contagem de tickets com status ativo por pessoa/time.',
      tip: 'Ajuda a identificar sobrecarga e redistribuir demandas.',
      unifies: null
    },

    // ========== COMPARATIVOS ==========
    'chartComparativoMensal': {
      title: 'Comparativo: Atual vs Anterior',
      description: 'Compara volume do período atual com o período anterior equivalente.',
      formula: 'Variação% = ((Atual - Anterior) ÷ Anterior) × 100',
      tip: 'Verde = crescimento, Vermelho = redução.',
      unifies: null
    },
    'chartTendencia': {
      title: 'Tendência Semanal',
      description: 'Evolução de tickets por semana no período.',
      formula: 'Contagem de tickets agrupados por semana.',
      tip: 'Linha subindo = demanda crescente.',
      unifies: null
    },

    // ========== PIPELINE ==========
    'chartAgingHistogram': {
      title: 'Idade do Backlog',
      description: 'Distribuição de tickets abertos por tempo de vida.',
      formula: 'Faixas: 0-2d, 3-7d, 8-14d, 15-30d, >30d.',
      tip: 'Tickets antigos (>30d) precisam de atenção urgente.',
      unifies: null
    },
    'chartPendentes': {
      title: 'Tickets Aguardando Ação',
      description: 'Tickets parados, aguardando cliente ou parceiros que precisam de atenção.',
      formula: 'Agrupa: Aguardando Cliente + Aguardando Parceiros + Pausado + Sem atividade 5+ dias.',
      tip: 'Revise periodicamente para evitar esquecimentos. Clique para ver tickets.',
      unifies: ['Tickets Parados', 'Aguardando Cliente', 'Aguardando Parceiros', 'Pipeline Funil', 'Finalizados']
    },

    // ========== ESTADO (ABA TICKETS) ==========
    'chartEstado': {
      title: 'Status dos Tickets',
      description: 'Distribuição dos tickets por status atual.',
      formula: 'Contagem agrupada por status (Fechado, Aberto, Em análise, etc.).',
      tip: 'Ideal ter maioria em "Fechado". Clique nas fatias para ver detalhes.',
      unifies: null
    },

    // ========== CSAT ==========
    'chartCSAT': {
      title: 'CSAT Score',
      description: 'Nota média de satisfação do cliente (1-5 estrelas).',
      formula: 'Média = Soma das notas ÷ Quantidade de avaliações.',
      tip: '4.0+ é bom, 4.5+ é excelente.',
      unifies: null
    },
    'csatDistribution': {
      title: 'Distribuição CSAT',
      description: 'Quantidade de avaliações por nota.',
      formula: 'Contagem de avaliações 1★, 2★, 3★, 4★, 5★.',
      tip: 'Ideal ter maioria em 4★ e 5★.',
      unifies: null
    },
    'csatByAgent': {
      title: 'CSAT por Agente',
      description: 'Nota média de cada atendente.',
      formula: 'Média das avaliações recebidas por cada pessoa.',
      tip: 'Use para identificar necessidades de treinamento.',
      unifies: null
    },

    // ========== TEMPO ==========
    'tempoTotal': {
      title: 'Total de Horas',
      description: 'Soma de todas as horas registradas no período.',
      formula: 'Soma dos time entries de todos os tickets.',
      tip: 'Compare com horas contratadas da equipe.',
      unifies: null
    },
    'tempoByPerson': {
      title: 'Horas por Pessoa',
      description: 'Distribuição de horas trabalhadas por membro.',
      formula: 'Soma dos time entries por agente.',
      tip: 'Grandes variações podem indicar problemas de registro.',
      unifies: null
    },

    // ========== ACOMPANHAMENTO ==========
    'acompanhamentoTags': {
      title: 'Acompanhamento por Tags',
      description: 'Tickets onde cada pessoa participou (via tags).',
      formula: 'Contagem de tickets onde a tag da pessoa aparece.',
      tip: 'Diferente de "tratativa" - mede participação, não resolução.',
      unifies: null
    },
    'acompanhamentoSucesso': {
      title: 'Taxa de Sucesso do Acompanhamento',
      description: 'Dos tickets acompanhados, quantos foram resolvidos.',
      formula: 'Taxa = (Acompanhados Resolvidos ÷ Total Acompanhados) × 100',
      tip: 'Indica efetividade da participação.',
      unifies: null
    },
    'acompChartRanking': {
      title: 'Ranking por Volume',
      description: 'Top 10 pessoas com mais tickets acompanhados no período.',
      formula: 'Contagem de tickets onde a tag da pessoa aparece.',
      tip: 'Números altos podem indicar sobrecarga ou alta participação.',
      unifies: null
    },
    'acompChartResolution': {
      title: 'Taxa de Resolução por Pessoa',
      description: 'Percentual de tickets resolvidos por cada pessoa que acompanhou.',
      formula: 'Taxa = (Resolvidos ÷ Total Acompanhados) × 100',
      tip: 'Acima de 70% é saudável. Acima de 85% é excelente.',
      unifies: null
    },
    'acompChartStatus': {
      title: 'Status dos Tickets',
      description: 'Distribuição dos tickets acompanhados por status.',
      formula: 'Contagem agrupada por status atual do ticket.',
      tip: 'Clique nas legendas para ocultar/mostrar categorias.',
      unifies: null
    },
    'acompChartDayOfWeek': {
      title: 'Por Dia da Semana',
      description: 'Volume de tickets acompanhados por dia da semana.',
      formula: 'Contagem por dia da semana (Domingo a Sábado).',
      tip: 'Útil para identificar padrões de demanda.',
      unifies: null
    },
    'acompChartHour': {
      title: 'Por Hora do Dia',
      description: 'Volume de tickets acompanhados por hora.',
      formula: 'Contagem por hora (0h às 23h).',
      tip: 'Identifica horários de pico de atividade.',
      unifies: null
    },
    'acompChartTimeline': {
      title: 'Evolução Temporal',
      description: 'Evolução do volume de tickets acompanhados ao longo do tempo.',
      formula: 'Contagem agrupada por mês.',
      tip: 'Linha subindo = demanda crescente.',
      unifies: null
    },
    'acompChartSLA': {
      title: 'SLA 1ª Resposta por Pessoa',
      description: 'Conformidade SLA de primeira resposta para tickets acompanhados.',
      formula: 'SLA% = (Respondidos em ≤4h ÷ Total com resposta) × 100',
      tip: 'Meta: acima de 80%.',
      unifies: null
    },
    'acompChartProductivity': {
      title: 'Índice de Produtividade',
      description: 'Índice combinado de resolução, SLA e volume.',
      formula: 'Índice = (Resolução×30%) + (SLA×30%) + (Volume×20%) + (Tempo×20%)',
      tip: 'Acima de 80 é excelente, 50-80 é bom, abaixo de 50 precisa atenção.',
      unifies: null
    },

    // ========== KPIs REMOVIDOS (referência) ==========
    '_removed_statusStacked': {
      title: '⚠️ Removido: Status Detalhado',
      description: 'Este BI foi unificado com "Distribuição por Status".',
      unifiedInto: 'chartStatus'
    },
    '_removed_rankingSLA': {
      title: '⚠️ Removido: Ranking SLA',
      description: 'Este BI foi unificado com "SLA por Entidade".',
      unifiedInto: 'chartSLAByEntity'
    },
    '_removed_rankingResolucao': {
      title: '⚠️ Removido: Ranking Resolução',
      description: 'Este BI foi unificado com "Taxa de Resolução".',
      unifiedInto: 'chartResolution'
    },
    '_removed_rankingEficiencia': {
      title: '⚠️ Removido: Ranking Eficiência',
      description: 'Fórmula confusa. Dados disponíveis em outros BIs.',
      unifiedInto: null
    },
    '_removed_finalized': {
      title: '⚠️ Removido: Finalizados',
      description: 'Informação já presente em "Distribuição por Status".',
      unifiedInto: 'chartStatus'
    },
    '_removed_pipelineFunnel': {
      title: '⚠️ Removido: Pipeline Ativos',
      description: 'Redundante com "Distribuição por Status".',
      unifiedInto: 'chartStatus'
    }
  };

  // ============================================
  // ESTILOS CSS
  // ============================================

  function injectStyles() {
    if (document.getElementById('bi-helpers-styles')) return;

    const style = document.createElement('style');
    style.id = 'bi-helpers-styles';
    style.textContent = `
      /* Helper Button */
      .bi-helper-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(102, 126, 234, 0.2);
        border: 1px solid rgba(102, 126, 234, 0.4);
        color: #667eea;
        font-size: 11px;
        font-weight: 600;
        cursor: help;
        margin-left: 6px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .bi-helper-btn:hover {
        background: rgba(102, 126, 234, 0.4);
        border-color: #667eea;
        transform: scale(1.1);
      }

      .bi-helper-btn.has-unification {
        background: rgba(168, 85, 247, 0.2);
        border-color: rgba(168, 85, 247, 0.4);
        color: #a855f7;
      }

      .bi-helper-btn.has-unification:hover {
        background: rgba(168, 85, 247, 0.4);
        border-color: #a855f7;
      }

      /* Helper Tooltip */
      .bi-helper-tooltip {
        position: fixed;
        z-index: 100000;
        background: rgba(30, 30, 46, 0.98);
        border: 1px solid rgba(102, 126, 234, 0.3);
        border-radius: 12px;
        padding: 16px;
        max-width: 320px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        animation: helperFadeIn 0.2s ease;
        pointer-events: none;
      }

      @keyframes helperFadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .bi-helper-tooltip h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: #e4e4e7;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .bi-helper-tooltip h4 .icon {
        font-size: 16px;
      }

      .bi-helper-tooltip p {
        margin: 0 0 10px 0;
        font-size: 12px;
        color: #a1a1aa;
        line-height: 1.5;
      }

      .bi-helper-tooltip .formula {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        padding: 8px 10px;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 11px;
        color: #60a5fa;
        margin-bottom: 10px;
      }

      .bi-helper-tooltip .tip {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 11px;
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
        padding: 8px 10px;
        border-radius: 6px;
        margin-bottom: 10px;
      }

      .bi-helper-tooltip .tip::before {
        content: '💡';
        flex-shrink: 0;
      }

      .bi-helper-tooltip .unification {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
        color: #a855f7;
        background: rgba(168, 85, 247, 0.1);
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid rgba(168, 85, 247, 0.2);
      }

      .bi-helper-tooltip .unification-title {
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .bi-helper-tooltip .unification-title::before {
        content: '🔗';
      }

      .bi-helper-tooltip .unification-list {
        color: #c4b5fd;
        padding-left: 20px;
      }

      /* Card header com helper */
      .bi-card-header {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .bi-card-header h3,
      .bi-card-header h4 {
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // TOOLTIP HANDLER
  // ============================================

  let currentTooltip = null;

  function showTooltip(helperId, buttonElement) {
    hideTooltip();

    const config = HELPERS_CONFIG[helperId];
    if (!config) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'bi-helper-tooltip';
    tooltip.innerHTML = `
      <h4>
        <span class="icon">📊</span>
        ${config.title}
      </h4>
      <p>${config.description}</p>
      ${config.formula ? `<div class="formula">${config.formula}</div>` : ''}
      ${config.tip ? `<div class="tip">${config.tip}</div>` : ''}
      ${config.unifies && config.unifies.length > 0 ? `
        <div class="unification">
          <div class="unification-title">Este BI unifica:</div>
          <div class="unification-list">
            ${config.unifies.map(u => `• ${u}`).join('<br>')}
          </div>
        </div>
      ` : ''}
    `;

    document.body.appendChild(tooltip);
    currentTooltip = tooltip;

    // Posicionar tooltip
    const rect = buttonElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 8;

    // Ajustar se sair da tela
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = rect.top - tooltipRect.height - 8;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (currentTooltip) {
      currentTooltip.remove();
      currentTooltip = null;
    }
  }

  // ============================================
  // HELPER BUTTON CREATOR
  // ============================================

  function createHelperButton(helperId) {
    const config = HELPERS_CONFIG[helperId];
    if (!config) return null;

    const btn = document.createElement('span');
    btn.className = 'bi-helper-btn';
    if (config.unifies && config.unifies.length > 0) {
      btn.classList.add('has-unification');
    }
    btn.textContent = '?';
    btn.setAttribute('data-helper-id', helperId);
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', `Ajuda: ${config.title}`);
    btn.setAttribute('tabindex', '0');

    btn.addEventListener('mouseenter', () => showTooltip(helperId, btn));
    btn.addEventListener('mouseleave', hideTooltip);
    btn.addEventListener('focus', () => showTooltip(helperId, btn));
    btn.addEventListener('blur', hideTooltip);

    return btn;
  }

  // ============================================
  // AUTO-INJECT HELPERS
  // ============================================

  function injectHelpers() {
    // Mapear canvas IDs para títulos de cards
    const canvasToCard = {
      'chartTop10': 'Top 10',
      'chartResolution': 'Taxa de Resolução',
      'chartStatus': 'Status',
      'chartPriority': 'Prioridade',
      'chartTimeline': 'Timeline',
      'chartSystems': 'Sistema',
      'chartSLA': 'SLA',
      'chartSLAByEntity': 'SLA por',
      'chartFirstResponse': 'First Response',
      'chartByDayOfWeek': 'Dia da Semana',
      'chartByHour': 'Por Hora',
      'chartHeatmap': 'Mapa de Calor',
      'chartWorkload': 'Carga',
      'chartComparativoMensal': 'Comparativo',
      'chartTendencia': 'Tendência',
      'chartAgingHistogram': 'Idade',
      'chartCSAT': 'CSAT',
      'chartPendentes': 'Pendentes'
    };

    // Para cada canvas, encontrar o card pai e adicionar helper ao título
    Object.keys(canvasToCard).forEach(canvasId => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const card = canvas.closest('.bi-card, .chart-card, [class*="card"]');
      if (!card) return;

      // Encontrar título do card
      const titleEl = card.querySelector('h3, h4, .card-title, .chart-title');
      if (!titleEl) return;

      // Verificar se já tem helper
      if (titleEl.querySelector('.bi-helper-btn')) return;

      // Criar e adicionar helper
      const helper = createHelperButton(canvasId);
      if (helper) {
        titleEl.style.display = 'inline-flex';
        titleEl.style.alignItems = 'center';
        titleEl.appendChild(helper);
      }
    });
  }

  // ============================================
  // OBSERVER PARA NOVOS ELEMENTOS
  // ============================================

  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldInject = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && (
              node.querySelector?.('canvas') ||
              node.classList?.contains('bi-card') ||
              node.classList?.contains('chart-card')
            )) {
              shouldInject = true;
            }
          });
        }
      });

      if (shouldInject) {
        setTimeout(injectHelpers, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ============================================
  // API PÚBLICA
  // ============================================

  window.BIHelpers = {
    // Criar botão helper manualmente
    createButton: createHelperButton,
    
    // Mostrar tooltip programaticamente
    showTooltip: showTooltip,
    hideTooltip: hideTooltip,
    
    // Obter configuração de um helper
    getConfig: (id) => HELPERS_CONFIG[id],
    
    // Listar todos os helpers
    listAll: () => Object.keys(HELPERS_CONFIG).filter(k => !k.startsWith('_')),
    
    // Listar helpers removidos/unificados
    listRemoved: () => Object.keys(HELPERS_CONFIG).filter(k => k.startsWith('_removed')),
    
    // Re-injetar helpers (após mudanças dinâmicas)
    refresh: injectHelpers,
    
    // Adicionar novo helper dinamicamente
    addConfig: (id, config) => {
      HELPERS_CONFIG[id] = config;
    }
  };

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  function init() {
    injectStyles();
    
    // Injetar helpers quando DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectHelpers, 500);
        setupObserver();
      });
    } else {
      setTimeout(injectHelpers, 500);
      setupObserver();
    }
    
    console.log('❓ BIHelpers module loaded');
  }

  init();

})();
