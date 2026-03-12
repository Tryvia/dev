/**
 * Reports Module V3 - Sistema de Relatórios Reformulado
 * 5 tipos de relatórios com filtros, ajuda e suporte a temas
 */

class ReportsModuleV3 {
    constructor() {
        this.containerId = 'reports-container';
        this.selectedReport = 'executive';
        this.filters = {
            period: '30',
            team: 'all',
            agent: 'all',
            priority: 'all',
            status: 'all',
            slaStatus: 'all',
            startDate: null,
            endDate: null
        };

        // 5 Tipos de Relatórios
        this.reportTypes = [
            {
                id: 'executive',
                name: 'Relatório Executivo',
                icon: '📊',
                color: '#6366f1',
                description: 'Visão estratégica para gestão com KPIs principais, tendências e insights automáticos.',
                details: [
                    'Total de tickets e taxa de resolução',
                    'Comparativo com período anterior',
                    'Top 5 problemas mais frequentes',
                    'Alertas e pontos de atenção',
                    'Recomendações automáticas'
                ]
            },
            {
                id: 'performance',
                name: 'Performance da Equipe',
                icon: '🏆',
                color: '#10b981',
                description: 'Análise detalhada de produtividade individual e por time com rankings.',
                details: [
                    'Ranking de agentes por volume',
                    'Taxa de resolução por pessoa',
                    'Tempo médio de atendimento',
                    'Comparativo entre times',
                    'Evolução de produtividade'
                ]
            },
            {
                id: 'sla',
                name: 'Análise de SLA',
                icon: '⏱️',
                color: '#f59e0b',
                description: 'Monitoramento completo de prazos, violações e conformidade de SLA.',
                details: [
                    'Taxa de cumprimento de SLA',
                    'Tickets fora do prazo',
                    'Tempo médio de 1ª resposta',
                    'Tempo médio de resolução',
                    'Análise por prioridade'
                ]
            },
            {
                id: 'trends',
                name: 'Tendências e Evolução',
                icon: '📈',
                color: '#8b5cf6',
                description: 'Análise temporal com gráficos de evolução e projeções futuras.',
                details: [
                    'Volume diário/semanal/mensal',
                    'Tendência de crescimento',
                    'Sazonalidade detectada',
                    'Projeção para próximo período',
                    'Comparativo ano a ano'
                ]
            },
            {
                id: 'backlog',
                name: 'Backlog e Aging',
                icon: '📋',
                color: '#ef4444',
                description: 'Gestão de tickets pendentes com análise de envelhecimento e priorização.',
                details: [
                    'Tickets pendentes por idade',
                    'Distribuição por status',
                    'Tickets críticos (>7 dias)',
                    'Fila de trabalho priorizada',
                    'Estimativa de limpeza'
                ]
            },
            {
                id: 'resolution_time',
                name: 'Tempo de Resolução',
                icon: '⏱️',
                color: '#06b6d4',
                description: 'Tempo médio de resolução por pessoa/time, excluindo Melhorias e Projetos.',
                details: [
                    'Tempo médio de resolução por pessoa',
                    'Ranking dos mais rápidos',
                    'Exclui Melhorias e Projetos',
                    'Mínimo, máximo e mediana',
                    'Detalhamento por ticket'
                ]
            }
        ];

        // Status map
        this.statusMap = {
            2: { label: 'Aberto', color: '#3b82f6' },
            3: { label: 'Pendente', color: '#f59e0b' },
            4: { label: 'Resolvido', color: '#10b981' },
            5: { label: 'Fechado', color: '#6b7280' },
            6: { label: 'Em Homologação', color: '#8b5cf6' },
            7: { label: 'Aguardando Cliente', color: '#f59e0b' },
            8: { label: 'Em Tratativa', color: '#06b6d4' }
        };

        // Priority map
        this.priorityMap = {
            1: { label: 'Baixa', color: '#6b7280' },
            2: { label: 'Média', color: '#3b82f6' },
            3: { label: 'Alta', color: '#f59e0b' },
            4: { label: 'Urgente', color: '#ef4444' }
        };
    }

    // Detectar tema atual
    getTheme() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        return theme === 'tryvia-cyan' ? 'light' : 'dark';
    }

    // Detectar modo de dados atual (tratativa ou tags)
    getDataMode() {
        // Tenta pegar do presentation mode
        if (window.presentationModeV2?.dataMode) {
            return window.presentationModeV2.dataMode;
        }
        // Fallback: verifica se há dados de acompanhamento
        const data = this.getData();
        const hasAcompanhamento = data.some(t => t.cf_acompanhamento_atendimento);
        const hasTratativa = data.some(t => t.cf_tratativa);
        
        // Se tiver mais dados de acompanhamento, assume modo tags
        if (hasAcompanhamento && !hasTratativa) return 'tags';
        return 'tratativa';
    }

    // Obter pessoa responsável baseado no modo
    getResponsavel(ticket) {
        const mode = this.getDataMode();
        if (mode === 'tags') {
            // Modo Tags: usa cf_acompanhamento_atendimento ou tags
            if (ticket.cf_acompanhamento_atendimento) {
                return ticket.cf_acompanhamento_atendimento;
            }
            // Fallback para tags
            const tags = this.getTagsArray(ticket);
            const allowedPeople = window.BIAcompanhamentoModule?.allowedPeople || [];
            for (const tag of tags) {
                if (allowedPeople.some(p => p.toLowerCase() === tag.toLowerCase())) {
                    return tag;
                }
            }
            return null;
        } else {
            // Modo Tratativa: usa cf_tratativa
            return ticket.cf_tratativa || null;
        }
    }

    // Extrair tags do ticket
    getTagsArray(ticket) {
        if (!ticket.tags) return [];
        if (Array.isArray(ticket.tags)) return ticket.tags;
        if (typeof ticket.tags === 'string') {
            return ticket.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        return [];
    }

    // Cores baseadas no tema
    getColors() {
        const isLight = this.getTheme() === 'light';
        return {
            bg: isLight ? '#ffffff' : '#0a0a1a',
            surface: isLight ? '#f8fafc' : '#1a1a2e',
            card: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            border: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
            text: isLight ? '#1e293b' : '#e4e4e7',
            textMuted: isLight ? '#64748b' : '#a1a1aa',
            textSecondary: isLight ? '#94a3b8' : '#71717a'
        };
    }

    // Obter dados (retorna cópia para evitar mutações)
    getData() {
        let source = [];
        let sourceName = '';

        if (window.allTicketsCache?.length > 0) {
            source = window.allTicketsCache;
            sourceName = 'allTicketsCache';
        } else if (window.BICharts?.cache?.tickets?.length > 0) {
            source = window.BICharts.cache.tickets;
            sourceName = 'BICharts.cache.tickets';
        } else if (window.biAnalytics?.allData?.length > 0) {
            source = window.biAnalytics.allData;
            sourceName = 'biAnalytics.allData';
        }

        console.log(`📦 Fonte de dados: ${sourceName} (${source.length} tickets)`);
        return source;
    }

    // Obter equipes/pessoas baseado no modo
    getTeams() {
        const data = this.getData();
        const teams = new Set();
        const mode = this.getDataMode();
        
        data.forEach(t => {
            const responsavel = this.getResponsavel(t);
            if (responsavel) teams.add(responsavel);
        });
        return Array.from(teams).sort();
    }

    // Gerar badge de modo para exibir nos relatórios
    getModeBadge(colors) {
        const mode = this.getDataMode();
        const isTagsMode = mode === 'tags';
        const modeColor = isTagsMode ? '#ec4899' : '#8b5cf6';
        const modeIcon = isTagsMode ? '🏷️' : '👤';
        const modeText = isTagsMode ? 'Modo: Tags/Acompanhamento' : 'Modo: Tratativa';
        const modeDesc = isTagsMode 
            ? 'Dados extraídos de cf_acompanhamento_atendimento e tags' 
            : 'Dados extraídos de cf_tratativa (quem resolveu)';
        
        return `
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: ${modeColor}20; border: 1px solid ${modeColor}50; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">
                <span>${modeIcon}</span>
                <span style="font-weight: 600; color: ${modeColor};">${modeText}</span>
                <span style="color: ${colors.textMuted}; font-size: 0.7rem;">| ${modeDesc}</span>
            </div>
        `;
    }

    // Obter agentes
    getAgents() {
        const data = this.getData();
        const agents = new Map();
        data.forEach(t => {
            if (t.responder_name) {
                agents.set(t.responder_id, t.responder_name);
            }
        });
        return Array.from(agents.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }

    // Filtrar dados
    filterData() {
        // Criar cópia dos dados para não modificar o original
        const rawData = this.getData();
        let data = [...rawData];
        const f = this.filters;

        console.log('🔍 Filtros ativos:', JSON.stringify(f));
        console.log('🔍 Dados antes de filtrar:', data.length);

        // Filtro de período
        if (f.period === 'custom' && f.startDate && f.endDate) {
            const start = new Date(f.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(f.endDate);
            end.setHours(23, 59, 59, 999);
            const beforeCount = data.length;
            data = data.filter(t => {
                if (!t.created_at) return false;
                const created = new Date(t.created_at);
                return !isNaN(created.getTime()) && created >= start && created <= end;
            });
            console.log(`🔍 Após filtro período custom: ${beforeCount} -> ${data.length}`);
        } else if (f.period && f.period !== 'all' && f.period !== 'custom') {
            const days = parseInt(f.period);
            if (!isNaN(days) && days > 0) {
                const now = new Date();
                const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
                const beforeCount = data.length;

                // Debug: mostrar cutoff
                console.log(`🔍 Cutoff para ${days} dias:`, cutoff.toISOString());

                data = data.filter(t => {
                    if (!t.created_at) return false;
                    const created = new Date(t.created_at);
                    if (isNaN(created.getTime())) return false;
                    return created >= cutoff;
                });
                console.log(`🔍 Após filtro período ${days} dias: ${beforeCount} -> ${data.length}`);
            }
        }

        // Filtro de time/pessoa (baseado no modo)
        if (f.team && f.team !== 'all') {
            const beforeCount = data.length;
            data = data.filter(t => this.getResponsavel(t) === f.team);
            console.log(`🔍 Após filtro time '${f.team}': ${beforeCount} -> ${data.length}`);
        }

        // Filtro de agente
        if (f.agent && f.agent !== 'all') {
            const beforeCount = data.length;
            data = data.filter(t => String(t.responder_id) === String(f.agent));
            console.log(`🔍 Após filtro agente '${f.agent}': ${beforeCount} -> ${data.length}`);
        }

        // Filtro de prioridade
        if (f.priority && f.priority !== 'all') {
            const beforeCount = data.length;
            data = data.filter(t => String(t.priority) === String(f.priority));
            console.log(`🔍 Após filtro prioridade '${f.priority}': ${beforeCount} -> ${data.length}`);
        }

        // Filtro de status
        if (f.status && f.status !== 'all') {
            const beforeCount = data.length;
            if (f.status === 'pending') {
                data = data.filter(t => t.status !== 4 && t.status !== 5);
            } else if (f.status === 'resolved') {
                data = data.filter(t => t.status === 4 || t.status === 5);
            } else {
                data = data.filter(t => String(t.status) === String(f.status));
            }
            console.log(`🔍 Após filtro status '${f.status}': ${beforeCount} -> ${data.length}`);
        }

        // Filtro de SLA
        if (f.slaStatus !== 'all') {
            data = data.filter(t => {
                if (!t.fr_due_by) return f.slaStatus === 'na';
                const responded = t.stats_first_responded_at ? new Date(t.stats_first_responded_at) : null;
                const due = new Date(t.fr_due_by);
                if (f.slaStatus === 'ok') return responded && responded <= due;
                if (f.slaStatus === 'violated') return !responded || responded > due;
                return true;
            });
        }

        return data;
    }

    // Renderizar interface principal
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const colors = this.getColors();
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        if (!this.filters.startDate) this.filters.startDate = thirtyDaysAgo.toISOString().split('T')[0];
        if (!this.filters.endDate) this.filters.endDate = today.toISOString().split('T')[0];

        container.innerHTML = this.buildHTML(colors);
        this.setupEventListeners();
        this.populateFilters();
    }

    buildHTML(colors) {
        const currentReport = this.reportTypes.find(r => r.id === this.selectedReport);

        const isDark = this.getTheme() === 'dark';
        return `
        <style>
            .reports-v3 select {
                background-color: ${isDark ? '#1a1a2e' : '#ffffff'} !important;
                color: ${colors.text} !important;
                color-scheme: ${isDark ? 'dark' : 'light'};
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${isDark ? '%23a1a1aa' : '%2364748b'}' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 10px center;
                padding-right: 30px !important;
            }
            .reports-v3 select option {
                background-color: ${isDark ? '#1a1a2e' : '#ffffff'} !important;
                color: ${isDark ? '#e4e4e7' : '#1e293b'} !important;
            }
            .reports-v3 select:focus {
                outline: 2px solid #6366f1;
                outline-offset: -2px;
            }
            .reports-v3 input[type="date"] {
                background-color: ${isDark ? '#1a1a2e' : '#ffffff'} !important;
                color: ${colors.text} !important;
                color-scheme: ${isDark ? 'dark' : 'light'};
            }
        </style>
        <div class="reports-v3" style="padding: 1.5rem; color: ${colors.text};">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        📑 Central de Relatórios
                        <button onclick="reportsV3.showHelp('main')" style="background: rgba(99,102,241,0.2); border: none; border-radius: 50%; width: 24px; height: 24px; color: #6366f1; cursor: pointer; font-size: 12px; font-weight: bold;">?</button>
                    </h2>
                    <p style="color: ${colors.textMuted}; margin: 0.5rem 0 0 0; font-size: 0.9rem;">Selecione um tipo de relatório e configure os filtros</p>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button onclick="reportsV3.exportPDF()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.75rem 1.25rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        PDF
                    </button>
                    <button onclick="reportsV3.exportExcel()" style="background: #10b981; color: white; border: none; border-radius: 8px; padding: 0.75rem 1.25rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                        Excel
                    </button>
                </div>
            </div>
            
            <!-- Report Type Selector -->
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 2rem;">
                ${this.reportTypes.map(r => `
                    <div onclick="reportsV3.selectReport('${r.id}')" 
                        class="report-type-card ${this.selectedReport === r.id ? 'active' : ''}"
                        style="background: ${this.selectedReport === r.id ? r.color + '20' : colors.surface}; 
                               border: 2px solid ${this.selectedReport === r.id ? r.color : colors.border}; 
                               border-radius: 12px; padding: 1rem; cursor: pointer; transition: all 0.2s; position: relative;">
                        <button onclick="event.stopPropagation(); reportsV3.showHelp('${r.id}')" 
                            style="position: absolute; top: 8px; right: 8px; background: ${colors.border}; border: none; border-radius: 50%; width: 20px; height: 20px; color: ${colors.textMuted}; cursor: pointer; font-size: 11px; font-weight: bold;">?</button>
                        <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">${r.icon}</div>
                        <div style="font-weight: 600; font-size: 0.85rem; color: ${this.selectedReport === r.id ? r.color : colors.text};">${r.name}</div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Filters Section -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="font-size: 1rem; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        🔍 Filtros
                        <button onclick="reportsV3.showHelp('filters')" style="background: ${colors.border}; border: none; border-radius: 50%; width: 18px; height: 18px; color: ${colors.textMuted}; cursor: pointer; font-size: 10px; font-weight: bold;">?</button>
                    </h3>
                    <button onclick="reportsV3.resetFilters()" style="background: ${colors.border}; border: none; border-radius: 6px; padding: 0.5rem 1rem; color: ${colors.textMuted}; cursor: pointer; font-size: 0.8rem;">
                        🔄 Limpar Filtros
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                    <!-- Período -->
                    <div>
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Período</label>
                        <select id="reportFilterPeriod" onchange="reportsV3.updateFilter('period', this.value)" 
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                            <option value="7">Últimos 7 dias</option>
                            <option value="15">Últimos 15 dias</option>
                            <option value="30" selected>Últimos 30 dias</option>
                            <option value="60">Últimos 60 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="custom">Personalizado</option>
                            <option value="all">Todo o período</option>
                        </select>
                    </div>
                    
                    <!-- Datas Personalizadas -->
                    <div id="customDateContainer" style="display: none;">
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Data Início</label>
                        <input type="date" id="reportFilterStartDate" onchange="reportsV3.updateFilter('startDate', this.value)"
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                    </div>
                    <div id="customDateEndContainer" style="display: none;">
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Data Fim</label>
                        <input type="date" id="reportFilterEndDate" onchange="reportsV3.updateFilter('endDate', this.value)"
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                    </div>
                    
                    <!-- Time -->
                    <div>
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Time</label>
                        <select id="reportFilterTeam" onchange="reportsV3.updateFilter('team', this.value)"
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                            <option value="all">Todos os times</option>
                        </select>
                    </div>
                    
                    <!-- Agente -->
                    <div>
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Agente</label>
                        <select id="reportFilterAgent" onchange="reportsV3.updateFilter('agent', this.value)"
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                            <option value="all">Todos os agentes</option>
                        </select>
                    </div>
                    
                    <!-- Prioridade -->
                    <div>
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Prioridade</label>
                        <select id="reportFilterPriority" onchange="reportsV3.updateFilter('priority', this.value)"
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                            <option value="all">Todas</option>
                            <option value="4">Urgente</option>
                            <option value="3">Alta</option>
                            <option value="2">Média</option>
                            <option value="1">Baixa</option>
                        </select>
                    </div>
                    
                    <!-- Status -->
                    <div>
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Status</label>
                        <select id="reportFilterStatus" onchange="reportsV3.updateFilter('status', this.value)"
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                            <option value="all">Todos</option>
                            <option value="pending">Pendentes</option>
                            <option value="resolved">Resolvidos</option>
                        </select>
                    </div>
                    
                    <!-- SLA -->
                    <div>
                        <label style="color: ${colors.textMuted}; font-size: 0.75rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">SLA</label>
                        <select id="reportFilterSLA" onchange="reportsV3.updateFilter('slaStatus', this.value)"
                            style="width: 100%; padding: 0.6rem; background: ${colors.card}; color: ${colors.text}; border: 1px solid ${colors.border}; border-radius: 8px; font-size: 0.9rem;">
                            <option value="all">Todos</option>
                            <option value="ok">Dentro do SLA</option>
                            <option value="violated">Fora do SLA</option>
                        </select>
                    </div>
                </div>
                
                <!-- Generate Button -->
                <div style="margin-top: 1.25rem; text-align: center;">
                    <button onclick="reportsV3.generateReport()" 
                        style="background: linear-gradient(135deg, ${currentReport.color}, ${currentReport.color}dd); color: white; border: none; border-radius: 10px; padding: 1rem 3rem; cursor: pointer; font-weight: 700; font-size: 1rem; display: inline-flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 15px ${currentReport.color}40;">
                        ${currentReport.icon} Gerar ${currentReport.name}
                    </button>
                </div>
            </div>
            
            <!-- Report Content Area -->
            <div id="reportContent" style="min-height: 400px;">
                <div style="text-align: center; padding: 4rem 2rem; color: ${colors.textMuted};">
                    <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;">${currentReport.icon}</div>
                    <h3 style="color: ${colors.text}; margin-bottom: 0.5rem;">${currentReport.name}</h3>
                    <p style="max-width: 400px; margin: 0 auto 1rem;">${currentReport.description}</p>
                    <p style="font-size: 0.85rem;">Configure os filtros e clique em <strong>"Gerar ${currentReport.name}"</strong></p>
                </div>
            </div>
        </div>
        `;
    }

    setupEventListeners() {
        // Event listener for period change to show/hide custom dates
        const periodSelect = document.getElementById('reportFilterPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                const customDateContainer = document.getElementById('customDateContainer');
                const customDateEndContainer = document.getElementById('customDateEndContainer');
                if (e.target.value === 'custom') {
                    customDateContainer.style.display = 'block';
                    customDateEndContainer.style.display = 'block';
                } else {
                    customDateContainer.style.display = 'none';
                    customDateEndContainer.style.display = 'none';
                }
            });
        }
    }

    populateFilters() {
        // Populate teams
        const teamSelect = document.getElementById('reportFilterTeam');
        if (teamSelect) {
            const teams = this.getTeams();
            teams.forEach(team => {
                const opt = document.createElement('option');
                opt.value = team;
                opt.textContent = team;
                teamSelect.appendChild(opt);
            });
        }

        // Populate agents
        const agentSelect = document.getElementById('reportFilterAgent');
        if (agentSelect) {
            const agents = this.getAgents();
            agents.forEach(([id, name]) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = name;
                agentSelect.appendChild(opt);
            });
        }

        // Set dates
        const startInput = document.getElementById('reportFilterStartDate');
        const endInput = document.getElementById('reportFilterEndDate');
        if (startInput) startInput.value = this.filters.startDate;
        if (endInput) endInput.value = this.filters.endDate;
    }

    selectReport(reportId) {
        this.selectedReport = reportId;
        this.render();
    }

    updateFilter(key, value) {
        console.log(`🔧 Filtro atualizado: ${key} = ${value}`);
        this.filters[key] = value;
    }

    resetFilters() {
        this.filters = {
            period: '30',
            team: 'all',
            agent: 'all',
            priority: 'all',
            status: 'all',
            slaStatus: 'all',
            startDate: null,
            endDate: null
        };
        this.render();
    }

    showHelp(type) {
        const report = this.reportTypes.find(r => r.id === type);
        const colors = this.getColors();

        let title, content;

        // Mapa de ajuda detalhada para cada seção
        const helpContent = {
            main: {
                title: '📑 Central de Relatórios',
                content: `
                    <p>A Central de Relatórios permite gerar análises detalhadas dos seus tickets de atendimento com visualizações profissionais.</p>
                    <h4 style="margin-top: 1rem; color: #6366f1;">🎯 Como usar:</h4>
                    <ol style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong>Selecione o tipo</strong> de relatório clicando em um dos 5 cards</li>
                        <li><strong>Configure os filtros</strong> (período, time, agente, prioridade, status, SLA)</li>
                        <li><strong>Clique em "Gerar Relatório"</strong> para visualizar</li>
                        <li><strong>Exporte</strong> em PDF ou Excel se necessário</li>
                    </ol>
                    <h4 style="margin-top: 1rem; color: #6366f1;">📊 Tipos de Relatório Disponíveis:</h4>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        ${this.reportTypes.map(r => `<li><strong>${r.icon} ${r.name}:</strong> ${r.description}</li>`).join('')}
                    </ul>
                    <div style="margin-top: 1rem; padding: 0.75rem; background: #6366f115; border-radius: 8px; border-left: 3px solid #6366f1;">
                        <strong>💡 Dica:</strong> Os relatórios se adaptam automaticamente ao tema claro ou escuro do sistema.
                    </div>
                `
            },
            filters: {
                title: '🔍 Filtros do Relatório',
                content: `
                    <p>Use os filtros para refinar e personalizar os dados do seu relatório:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong>📅 Período:</strong> Define o intervalo de datas dos tickets (7, 15, 30, 60, 90 dias ou personalizado)</li>
                        <li><strong>👥 Time:</strong> Filtra por tratativa/área responsável pelo ticket</li>
                        <li><strong>👤 Agente:</strong> Filtra por pessoa específica que atendeu</li>
                        <li><strong>🎯 Prioridade:</strong> Filtra por nível de urgência (Baixa, Média, Alta, Urgente)</li>
                        <li><strong>📋 Status:</strong> Filtra por estado atual (Pendentes ou Resolvidos)</li>
                        <li><strong>⏱️ SLA:</strong> Filtra por cumprimento de prazo (Dentro ou Fora do SLA)</li>
                    </ul>
                    <div style="margin-top: 1rem; padding: 0.75rem; background: #f59e0b15; border-radius: 8px; border-left: 3px solid #f59e0b;">
                        <strong>💡 Dica:</strong> Use "Limpar Filtros" para voltar aos valores padrão. Combine múltiplos filtros para análises específicas.
                    </div>
                `
            },
            status: {
                title: '📊 Distribuição por Status',
                content: `
                    <p>Este gráfico mostra como os tickets estão distribuídos entre os diferentes status:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong style="color: #3b82f6;">Aberto:</strong> Tickets recém-criados aguardando atendimento</li>
                        <li><strong style="color: #f59e0b;">Pendente:</strong> Tickets aguardando alguma ação ou informação</li>
                        <li><strong style="color: #10b981;">Resolvido:</strong> Tickets com solução aplicada</li>
                        <li><strong style="color: #6b7280;">Fechado:</strong> Tickets finalizados e arquivados</li>
                    </ul>
                    <p style="margin-top: 1rem;">Uma distribuição saudável deve ter a maioria dos tickets em "Resolvido" ou "Fechado".</p>
                `
            },
            insights: {
                title: '💡 Insights e Alertas',
                content: `
                    <p>Esta seção exibe alertas automáticos baseados na análise dos seus dados:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong style="color: #ef4444;">🚨 Alertas Críticos:</strong> Indicam problemas sérios que precisam de ação imediata</li>
                        <li><strong style="color: #f59e0b;">⚠️ Avisos:</strong> Pontos de atenção que podem se tornar problemas</li>
                        <li><strong style="color: #10b981;">✅ Positivos:</strong> Indicadores dentro ou acima das metas</li>
                    </ul>
                    <h4 style="margin-top: 1rem; color: #6366f1;">Métricas Analisadas:</h4>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                        <li>Taxa de resolução (meta: >70%)</li>
                        <li>SLA de primeira resposta (meta: >90%)</li>
                        <li>Proporção pendentes vs resolvidos</li>
                    </ul>
                `
            },
            ranking: {
                title: '🏆 Ranking de Agentes',
                content: `
                    <p>Tabela com os 10 agentes mais ativos no período selecionado:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong>Total:</strong> Quantidade de tickets atribuídos ao agente</li>
                        <li><strong>Resolvidos:</strong> Quantos foram efetivamente resolvidos</li>
                        <li><strong>Taxa:</strong> Percentual de resolução (verde >80%, amarelo 60-80%, vermelho <60%)</li>
                        <li><strong>Tempo Médio:</strong> Média de horas para resolver um ticket</li>
                    </ul>
                    <p style="margin-top: 1rem;">Os 3 primeiros recebem medalhas de ouro 🥇, prata 🥈 e bronze 🥉.</p>
                `
            },
            teams: {
                title: '👥 Comparativo por Time',
                content: `
                    <p>Gráfico de barras comparando o volume e resolução entre diferentes times/tratativas:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong style="color: #6366f140;">Barra clara:</strong> Total de tickets recebidos</li>
                        <li><strong style="color: #10b981;">Barra verde:</strong> Tickets resolvidos</li>
                    </ul>
                    <p style="margin-top: 1rem;">Use este gráfico para identificar times com alta demanda ou baixa taxa de resolução.</p>
                `
            },
            slapriority: {
                title: '🎯 SLA por Prioridade',
                content: `
                    <p>Mostra o cumprimento de SLA segmentado por nível de prioridade:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong style="color: #6b7280;">Baixa:</strong> Tickets sem urgência, prazos mais longos</li>
                        <li><strong style="color: #3b82f6;">Média:</strong> Tickets normais, prazo padrão</li>
                        <li><strong style="color: #f59e0b;">Alta:</strong> Tickets importantes, prazo reduzido</li>
                        <li><strong style="color: #ef4444;">Urgente:</strong> Tickets críticos, prazo mínimo</li>
                    </ul>
                    <p style="margin-top: 1rem;">Espera-se que tickets de maior prioridade tenham maior atenção e melhor SLA.</p>
                `
            },
            dailyvolume: {
                title: '� Volume Diário de Tickets',
                content: `
                    <p>Gráfico de linha mostrando a quantidade de tickets criados por dia:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong>Eixo X:</strong> Dias do período selecionado</li>
                        <li><strong>Eixo Y:</strong> Quantidade de tickets</li>
                        <li><strong>Pontos:</strong> Cada ponto representa um dia</li>
                    </ul>
                    <p style="margin-top: 1rem;">Use este gráfico para identificar picos de demanda, tendências de crescimento ou queda.</p>
                `
            },
            weekdist: {
                title: '📅 Distribuição por Dia da Semana',
                content: `
                    <p>Mostra quais dias da semana têm mais tickets:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li>Barras mais altas = dias com mais tickets</li>
                        <li>Útil para planejar escala de equipe</li>
                        <li>Identifica padrões semanais</li>
                    </ul>
                    <p style="margin-top: 1rem;">Geralmente segunda-feira tem mais volume devido ao acúmulo do fim de semana.</p>
                `
            },
            aging: {
                title: '⏳ Distribuição por Idade (Aging)',
                content: `
                    <p>Análise de quanto tempo os tickets pendentes estão aguardando resolução:</p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong style="color: #10b981;">0-3 dias:</strong> Tickets recentes, dentro do esperado</li>
                        <li><strong style="color: #3b82f6;">4-7 dias:</strong> Tickets com uma semana, atenção moderada</li>
                        <li><strong style="color: #f59e0b;">8-15 dias:</strong> Tickets atrasados, precisam de ação</li>
                        <li><strong style="color: #ef4444;">16-30 dias:</strong> Tickets muito atrasados, prioridade alta</li>
                        <li><strong style="color: #dc2626;">>30 dias:</strong> Tickets críticos, ação urgente necessária</li>
                    </ul>
                    <p style="margin-top: 1rem;">O ideal é minimizar tickets nas categorias vermelhas.</p>
                `
            }
        };

        if (helpContent[type]) {
            title = helpContent[type].title;
            content = helpContent[type].content;
        } else if (report) {
            title = `${report.icon} ${report.name}`;
            content = `
                <p>${report.description}</p>
                <h4 style="margin-top: 1rem; color: ${report.color};">O que este relatório inclui:</h4>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">
                    ${report.details.map(d => `<li>${d}</li>`).join('')}
                </ul>
                <div style="margin-top: 1rem; padding: 0.75rem; background: ${report.color}15; border-radius: 8px; border-left: 3px solid ${report.color};">
                    <strong>💡 Dica:</strong> Combine com filtros para análises mais específicas.
                </div>
            `;
        } else {
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'reportHelpModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 16px; padding: 2rem; max-width: 550px; width: 90%; max-height: 80vh; overflow-y: auto; color: ${colors.text};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; font-size: 1.25rem;">${title}</h3>
                    <button onclick="document.getElementById('reportHelpModal').remove()" 
                        style="background: ${colors.border}; border: none; border-radius: 8px; padding: 8px 12px; color: ${colors.textMuted}; cursor: pointer;">✕</button>
                </div>
                <div style="line-height: 1.6; color: ${colors.textMuted};">
                    ${content}
                </div>
                <div style="margin-top: 1.5rem; text-align: center;">
                    <button onclick="document.getElementById('reportHelpModal').remove()" 
                        style="background: #6366f1; color: white; border: none; border-radius: 8px; padding: 0.75rem 2rem; cursor: pointer; font-weight: 600;">
                        Entendi
                    </button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    generateReport() {
        // Read filters from UI first
        const periodSelect = document.getElementById('reportFilterPeriod');
        const teamSelect = document.getElementById('reportFilterTeam');
        const agentSelect = document.getElementById('reportFilterAgent');
        const prioritySelect = document.getElementById('reportFilterPriority');
        const statusSelect = document.getElementById('reportFilterStatus');
        const slaSelect = document.getElementById('reportFilterSLA');
        const startDateInput = document.getElementById('reportFilterStartDate');
        const endDateInput = document.getElementById('reportFilterEndDate');

        // Debug: mostrar valores dos elementos
        console.log('📊 Elementos encontrados:', {
            period: periodSelect?.value,
            team: teamSelect?.value,
            agent: agentSelect?.value,
            priority: prioritySelect?.value,
            status: statusSelect?.value,
            sla: slaSelect?.value
        });

        if (periodSelect) this.filters.period = periodSelect.value;
        if (teamSelect) this.filters.team = teamSelect.value;
        if (agentSelect) this.filters.agent = agentSelect.value;
        if (prioritySelect) this.filters.priority = prioritySelect.value;
        if (statusSelect) this.filters.status = statusSelect.value;
        if (slaSelect) this.filters.slaStatus = slaSelect.value;

        // Se período for custom, usar datas
        if (this.filters.period === 'custom') {
            if (startDateInput?.value) this.filters.startDate = startDateInput.value;
            if (endDateInput?.value) this.filters.endDate = endDateInput.value;
        } else {
            // Limpar datas quando não for custom
            this.filters.startDate = null;
            this.filters.endDate = null;
        }

        console.log('📊 Gerando relatório com filtros:', JSON.stringify(this.filters));

        // Debug: verificar total de dados disponíveis antes de filtrar
        const allData = this.getData();
        console.log('📊 Total de dados disponíveis:', allData.length);

        const data = this.filterData();
        console.log('📊 Dados após aplicar filtros:', data.length);
        const colors = this.getColors();
        const report = this.reportTypes.find(r => r.id === this.selectedReport);
        const container = document.getElementById('reportContent');

        if (!container) return;

        console.log('📊 Dados filtrados:', data.length, 'tickets');

        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; color: ${colors.textMuted};">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
                    <h3 style="color: ${colors.text};">Nenhum dado encontrado</h3>
                    <p>Ajuste os filtros e tente novamente.</p>
                </div>
            `;
            return;
        }

        // Generate based on report type
        switch (this.selectedReport) {
            case 'executive':
                container.innerHTML = this.generateExecutiveReport(data, colors, report);
                break;
            case 'performance':
                container.innerHTML = this.generatePerformanceReport(data, colors, report);
                break;
            case 'sla':
                container.innerHTML = this.generateSLAReport(data, colors, report);
                break;
            case 'trends':
                container.innerHTML = this.generateTrendsReport(data, colors, report);
                break;
            case 'backlog':
                container.innerHTML = this.generateBacklogReport(data, colors, report);
                break;
            case 'resolution_time':
                container.innerHTML = this.generateResolutionTimeReport(data, colors, report);
                break;
        }

        // Render charts after DOM update
        setTimeout(() => this.renderCharts(), 100);
    }

    // ========== RELATÓRIO EXECUTIVO COM INSIGHTS INTELIGENTES ==========
    generateExecutiveReport(data, colors, report) {
        const mode = this.getDataMode();
        
        // Usar motor de insights
        const engine = window.ReportsInsightsEngine;
        const analysis = engine ? engine.analyzeExecutive(data, mode) : null;
        
        const { total, resolved, pending, resolutionRate, slaRate, slaOk, slaTotal } = analysis?.metrics || {
            total: data.length,
            resolved: data.filter(t => [4,5].includes(Number(t.status))).length,
            pending: data.filter(t => ![4,5].includes(Number(t.status))).length,
            resolutionRate: 0, slaRate: 0, slaOk: 0, slaTotal: 0
        };

        // Top problems (by subject keywords)
        const problems = {};
        const problemKeywords = ['erro', 'bug', 'falha', 'lentidão', 'não funciona', 'travando', 'problema', 'urgente', 'crítico', 'parado', 'não abre', 'não carrega'];
        data.forEach(t => {
            const subject = (t.subject || '').toLowerCase();
            problemKeywords.forEach(kw => {
                if (subject.includes(kw)) {
                    problems[kw] = (problems[kw] || 0) + 1;
                }
            });
        });
        const topProblems = Object.entries(problems).sort((a, b) => b[1] - a[1]).slice(0, 8);

        // Status distribution
        const statusDist = {};
        data.forEach(t => {
            const s = this.statusMap[t.status]?.label || 'Outro';
            statusDist[s] = (statusDist[s] || 0) + 1;
        });

        // Combinar alertas e insights
        const allInsights = [...(analysis?.alerts || []), ...(analysis?.insights || [])];
        const recommendations = analysis?.recommendations || [];
        const summary = analysis?.summary || { health: 'regular', healthColor: '#f59e0b', text: 'Análise em andamento...' };

        return `
        <div style="animation: fadeIn 0.3s ease;">
            <!-- Report Header -->
            <div style="background: linear-gradient(135deg, ${report.color}15, ${report.color}05); border: 1px solid ${report.color}30; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${report.icon} ${report.name}
                        </h3>
                        <p style="margin: 0 0 0.75rem 0; color: ${colors.textMuted}; font-size: 0.9rem;">
                            Período: ${this.getFilterSummary()} | ${total.toLocaleString('pt-BR')} tickets analisados
                        </p>
                        ${this.getModeBadge(colors)}
                    </div>
                    <div style="text-align: right; color: ${colors.textMuted}; font-size: 0.8rem;">
                        Gerado em: ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>

            <!-- RESUMO EXECUTIVO / HEALTH CHECK -->
            <div style="background: linear-gradient(135deg, ${summary.healthColor}20, ${summary.healthColor}05); border: 2px solid ${summary.healthColor}50; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: ${summary.healthColor}; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 1.5rem; filter: grayscale(1) brightness(10);">${summary.health === 'excelente' ? '🏆' : summary.health === 'bom' ? '✅' : summary.health === 'regular' ? '⚠️' : '🚨'}</span>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.25rem; color: ${summary.healthColor}; text-transform: uppercase;">
                            Saúde do Atendimento: ${summary.health.toUpperCase()}
                        </h4>
                        <p style="margin: 0.25rem 0 0 0; color: ${colors.text}; font-size: 0.95rem;">${summary.text}</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid ${summary.healthColor}30;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${colors.text};">${total.toLocaleString('pt-BR')}</div>
                        <div style="font-size: 0.75rem; color: ${colors.textMuted};">Total Tickets</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${resolutionRate.toFixed(1)}%</div>
                        <div style="font-size: 0.75rem; color: ${colors.textMuted};">Taxa Resolução</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${slaRate >= 90 ? '#10b981' : slaRate >= 70 ? '#f59e0b' : '#ef4444'};">${slaRate.toFixed(1)}%</div>
                        <div style="font-size: 0.75rem; color: ${colors.textMuted};">SLA 1ª Resposta</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${pending.toLocaleString('pt-BR')}</div>
                        <div style="font-size: 0.75rem; color: ${colors.textMuted};">Pendentes</div>
                    </div>
                </div>
            </div>
            
            <!-- EXECUTIVO: Não repetir KPIs detalhados - já estão no resumo acima -->

            <!-- ALERTAS CRÍTICOS (se houver) -->
            ${allInsights.filter(i => i.type === 'danger').length > 0 ? `
            <div style="background: #ef444410; border: 2px solid #ef444450; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 1rem 0; font-size: 1rem; color: #ef4444; display: flex; align-items: center; gap: 0.5rem;">
                    🚨 ALERTAS CRÍTICOS - Ação Imediata Necessária
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${allInsights.filter(i => i.type === 'danger').map(i => `
                        <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; background: #ef444415; border-radius: 8px;">
                            <span style="font-size: 1.5rem;">${i.icon}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #ef4444; margin-bottom: 0.25rem;">${i.title}</div>
                                <div style="color: ${colors.text}; font-size: 0.9rem; line-height: 1.5;">${i.text}</div>
                            </div>
                            ${i.metric ? `<div style="background: #ef4444; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">${i.metric}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- EXECUTIVO: Apenas resumo rápido de pontos de atenção (insights detalhados em outros relatórios) -->
            ${allInsights.filter(i => i.type === 'warning').length > 0 ? `
            <div style="background: #f59e0b10; border: 1px solid #f59e0b30; border-radius: 12px; padding: 1rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #f59e0b;">⚠️ Pontos de Atenção</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${allInsights.filter(i => i.type === 'warning').slice(0, 3).map(i => `
                        <span style="background: #f59e0b20; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; color: ${colors.text};">
                            ${i.icon} ${i.title}${i.metric ? ` (${i.metric})` : ''}
                        </span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Charts Row -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <!-- Status Distribution Chart -->
                <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                        <span style="font-size: 1.1rem;">📊</span> Distribuição por Status
                    </h4>
                    <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                        Visualização de como os tickets estão distribuídos entre os diferentes estados do fluxo de atendimento.
                    </p>
                    <canvas id="chartStatusDist" width="450" height="280"></canvas>
                </div>
                
                <!-- SLA Summary Detalhado -->
                <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                        <span style="font-size: 1.1rem;">⏱️</span> Análise de SLA
                    </h4>
                    <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                        O SLA (Service Level Agreement) mede o tempo de resposta ao cliente. Meta recomendada: 90%+
                    </p>
                    <div style="display: flex; justify-content: center; align-items: center; height: 160px;">
                        <div style="text-align: center;">
                            <div style="font-size: 3.5rem; font-weight: 700; color: ${slaRate >= 90 ? '#10b981' : slaRate >= 70 ? '#f59e0b' : '#ef4444'};">${slaRate.toFixed(1)}%</div>
                            <div style="color: ${colors.textMuted}; font-size: 0.9rem;">SLA de Primeira Resposta</div>
                            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: ${colors.textSecondary};">
                                <span style="color: #10b981; font-weight: 600;">${slaOk}</span> dentro do prazo de 
                                <span style="font-weight: 600;">${slaTotal}</span> tickets com SLA
                            </div>
                            <div style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: ${slaRate >= 90 ? '#10b98120' : slaRate >= 70 ? '#f59e0b20' : '#ef444420'}; border-radius: 8px; font-size: 0.8rem; color: ${slaRate >= 90 ? '#10b981' : slaRate >= 70 ? '#f59e0b' : '#ef4444'};">
                                ${slaRate >= 90 ? '✅ Excelente! Meta atingida' : slaRate >= 70 ? '⚠️ Atenção: abaixo da meta de 90%' : '🚨 Crítico: muito abaixo da meta'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Top Problems -->
            ${topProblems.length > 0 ? `
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">🔥</span> Palavras-chave Detectadas nos Tickets
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Termos mais frequentes encontrados nos assuntos dos tickets. Útil para identificar padrões de problemas.
                </p>
                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                    ${topProblems.map(([kw, count], i) => `
                        <div style="background: ${i === 0 ? '#ef444420' : i < 3 ? '#f59e0b20' : colors.border}; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; border: 1px solid ${i === 0 ? '#ef444450' : i < 3 ? '#f59e0b50' : 'transparent'};">
                            <strong style="color: ${i === 0 ? '#ef4444' : i < 3 ? '#f59e0b' : colors.text};">${kw}</strong> 
                            <span style="color: ${colors.textMuted};">(${count} tickets - ${((count/total)*100).toFixed(1)}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- EXECUTIVO: Removido tabelas de times e tickets (estão em outros relatórios específicos) -->

            <!-- Explicação Didática -->
            <div style="background: linear-gradient(135deg, ${colors.border}50, ${colors.surface}); border: 1px dashed ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-top: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: ${colors.textMuted};">
                    📚 Como interpretar este relatório
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.8rem; color: ${colors.textMuted};">
                    <div><strong>Taxa de Resolução:</strong> Porcentagem de tickets que foram resolvidos. Meta ideal: acima de 80%.</div>
                    <div><strong>SLA 1ª Resposta:</strong> Mede se o primeiro contato com o cliente foi dentro do prazo acordado.</div>
                    <div><strong>Tickets Pendentes:</strong> Tickets que ainda precisam de ação. Quanto menor, melhor.</div>
                    <div><strong>Saúde do Atendimento:</strong> Avaliação geral baseada em todos os indicadores combinados.</div>
                </div>
            </div>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        `;
    }

    // ========== RELATÓRIO DE PERFORMANCE COM INSIGHTS ==========
    generatePerformanceReport(data, colors, report) {
        const mode = this.getDataMode();
        
        // Usar motor de insights
        const engine = window.ReportsInsightsEngine;
        const analysis = engine ? engine.analyzePerformance(data, mode) : null;
        
        // Agent rankings com métricas completas
        const agentStats = {};
        data.forEach(t => {
            if (t.responder_name) {
                if (!agentStats[t.responder_name]) {
                    agentStats[t.responder_name] = { total: 0, resolved: 0, avgTime: [], pending: 0 };
                }
                agentStats[t.responder_name].total++;
                if ([4, 5].includes(Number(t.status))) {
                    agentStats[t.responder_name].resolved++;
                    if (t.stats_resolved_at && t.created_at) {
                        const hours = (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                        if (hours > 0 && hours < 720) agentStats[t.responder_name].avgTime.push(hours);
                    }
                } else {
                    agentStats[t.responder_name].pending++;
                }
            }
        });

        const agentRanking = Object.entries(agentStats)
            .map(([name, stats]) => ({
                name,
                total: stats.total,
                resolved: stats.resolved,
                pending: stats.pending,
                rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0,
                avgHours: stats.avgTime.length > 0 ? (stats.avgTime.reduce((a, b) => a + b, 0) / stats.avgTime.length).toFixed(1) : null
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 15);

        // Team/Pessoa stats baseado no modo
        const teamStats = {};
        data.forEach(t => {
            const team = this.getResponsavel(t) || 'Sem Responsável';
            if (!teamStats[team]) teamStats[team] = { total: 0, resolved: 0, pending: 0 };
            teamStats[team].total++;
            if ([4, 5].includes(Number(t.status))) teamStats[team].resolved++;
            else teamStats[team].pending++;
        });

        const teamRanking = Object.entries(teamStats)
            .map(([name, stats]) => ({
                name,
                total: stats.total,
                resolved: stats.resolved,
                pending: stats.pending,
                rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.total - a.total);

        // Calcular métricas agregadas
        const totalAgents = Object.keys(agentStats).length;
        const avgPerAgent = totalAgents > 0 ? Math.round(data.length / totalAgents) : 0;
        const bestRate = agentRanking.length > 0 ? Math.max(...agentRanking.map(a => parseFloat(a.rate))) : 0;
        const avgRate = agentRanking.length > 0 ? (agentRanking.reduce((s, a) => s + parseFloat(a.rate), 0) / agentRanking.length).toFixed(1) : 0;
        
        // Identificar destaques
        const topByVolume = agentRanking[0];
        const topByRate = [...agentRanking].filter(a => a.total >= 5).sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))[0];
        const topBySpeed = [...agentRanking].filter(a => a.avgHours).sort((a, b) => parseFloat(a.avgHours) - parseFloat(b.avgHours))[0];
        
        const insights = analysis?.insights || [];
        const alerts = analysis?.alerts || [];
        const recommendations = analysis?.recommendations || [];
        const allInsights = [...alerts, ...insights];

        const teamLabel = mode === 'tags' ? 'Pessoa (Acompanhamento)' : 'Time/Tratativa';

        return `
        <div style="animation: fadeIn 0.3s ease;">
            <!-- Report Header -->
            <div style="background: linear-gradient(135deg, ${report.color}15, ${report.color}05); border: 1px solid ${report.color}30; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${report.icon} ${report.name}
                        </h3>
                        <p style="margin: 0 0 0.75rem 0; color: ${colors.textMuted}; font-size: 0.9rem;">
                            Período: ${this.getFilterSummary()} | ${data.length.toLocaleString('pt-BR')} tickets | ${totalAgents} agentes ativos
                        </p>
                        ${this.getModeBadge(colors)}
                    </div>
                    <div style="text-align: right; color: ${colors.textMuted}; font-size: 0.8rem;">
                        Gerado em: ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>

            <!-- DESTAQUES DA EQUIPE -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                ${topByVolume ? `
                <div style="background: linear-gradient(135deg, #ffd70020, #ffd70005); border: 2px solid #ffd70050; border-radius: 12px; padding: 1.25rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🥇</div>
                    <div style="font-size: 0.8rem; color: ${colors.textMuted}; text-transform: uppercase; margin-bottom: 0.25rem;">Maior Volume</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: ${colors.text}; margin-bottom: 0.25rem;">${topByVolume.name}</div>
                    <div style="font-size: 0.9rem; color: #ffd700; font-weight: 600;">${topByVolume.total} tickets</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted}; margin-top: 0.5rem;">Taxa: ${topByVolume.rate}%</div>
                </div>
                ` : ''}
                ${topByRate ? `
                <div style="background: linear-gradient(135deg, #10b98120, #10b98105); border: 2px solid #10b98150; border-radius: 12px; padding: 1.25rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</div>
                    <div style="font-size: 0.8rem; color: ${colors.textMuted}; text-transform: uppercase; margin-bottom: 0.25rem;">Melhor Eficiência</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: ${colors.text}; margin-bottom: 0.25rem;">${topByRate.name}</div>
                    <div style="font-size: 0.9rem; color: #10b981; font-weight: 600;">${topByRate.rate}% resolução</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted}; margin-top: 0.5rem;">${topByRate.total} tickets</div>
                </div>
                ` : ''}
                ${topBySpeed ? `
                <div style="background: linear-gradient(135deg, #3b82f620, #3b82f605); border: 2px solid #3b82f650; border-radius: 12px; padding: 1.25rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
                    <div style="font-size: 0.8rem; color: ${colors.textMuted}; text-transform: uppercase; margin-bottom: 0.25rem;">Mais Rápido</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: ${colors.text}; margin-bottom: 0.25rem;">${topBySpeed.name}</div>
                    <div style="font-size: 0.9rem; color: #3b82f6; font-weight: 600;">${topBySpeed.avgHours}h média</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted}; margin-top: 0.5rem;">${topBySpeed.resolved} resolvidos</div>
                </div>
                ` : ''}
            </div>

            <!-- PERFORMANCE: Foco apenas em alertas sobre agentes (sem insights genéricos) -->
            ${alerts.length > 0 ? `
            <div style="background: #ef444410; border: 1px solid #ef444430; border-radius: 12px; padding: 1rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #ef4444;">🚨 Agentes que Precisam de Atenção</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${alerts.map(i => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: ${colors.text};">
                            <span>${i.icon}</span> ${i.text}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- PERFORMANCE: KPIs específicos de pessoas (sem repetir totais de tickets) -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
                ${this.renderKPICard('Agentes Ativos', totalAgents.toString(), '👥', '#3b82f6', colors, 'Pessoas com tickets')}
                ${this.renderKPICard('Média/Agente', avgPerAgent.toString(), '📊', '#8b5cf6', colors, 'Carga por pessoa')}
                ${this.renderKPICard('Melhor Eficiência', bestRate.toFixed(0) + '%', '🏆', '#10b981', colors, 'Top performer')}
                ${this.renderKPICard('Eficiência Média', avgRate + '%', '📈', '#f59e0b', colors, 'Média da equipe')}
            </div>
            
            <!-- Agent Ranking Table -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">🏆</span> Ranking Completo de Agentes
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Lista dos agentes ordenados por volume de atendimento, com métricas de eficiência e velocidade.
                </p>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid ${colors.border}; background: ${colors.border}30;">
                                <th style="text-align: left; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">#</th>
                                <th style="text-align: left; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">Agente</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">Total</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">Resolvidos</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">Pendentes</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">Taxa</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">Tempo Médio</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted}; font-weight: 600;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${agentRanking.map((a, i) => {
                                const rate = parseFloat(a.rate);
                                const status = rate >= 80 ? { text: 'Excelente', color: '#10b981', bg: '#10b98120' } :
                                              rate >= 60 ? { text: 'Bom', color: '#3b82f6', bg: '#3b82f620' } :
                                              rate >= 40 ? { text: 'Regular', color: '#f59e0b', bg: '#f59e0b20' } :
                                              { text: 'Atenção', color: '#ef4444', bg: '#ef444420' };
                                return `
                                <tr style="border-bottom: 1px solid ${colors.border};">
                                    <td style="padding: 0.75rem;">
                                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: ${i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : colors.border}; color: ${i < 3 ? '#000' : colors.text}; font-weight: 600; font-size: 0.75rem;">
                                            ${i + 1}
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem; font-weight: 500;">${a.name}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: #3b82f6; font-weight: 600;">${a.total}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: #10b981; font-weight: 600;">${a.resolved}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: #f59e0b;">${a.pending}</td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="background: ${status.bg}; color: ${status.color}; padding: 0.25rem 0.5rem; border-radius: 8px; font-weight: 600; font-size: 0.8rem;">${a.rate}%</span>
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${colors.textMuted};">${a.avgHours ? a.avgHours + 'h' : '-'}</td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="background: ${status.bg}; color: ${status.color}; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 500;">${status.text}</span>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Team Comparison -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">👥</span> Comparativo por ${teamLabel}
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Visualização da distribuição de tickets entre ${mode === 'tags' ? 'pessoas' : 'times'}, comparando volume total vs resolvidos.
                </p>
                <canvas id="chartTeamComparison" width="700" height="280"></canvas>
            </div>
            
            <!-- Team Detailed Table -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">📋</span> Detalhamento por ${teamLabel}
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Análise detalhada da performance de cada ${mode === 'tags' ? 'pessoa responsável pelo acompanhamento' : 'time/tratativa'}.
                </p>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid ${colors.border}; background: ${colors.border}30;">
                                <th style="text-align: left; padding: 0.75rem; color: ${colors.textMuted};">${mode === 'tags' ? 'Pessoa' : 'Time'}</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Total</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Resolvidos</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Pendentes</th>
                                <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Taxa</th>
                                <th style="text-align: left; padding: 0.75rem; color: ${colors.textMuted};">Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teamRanking.slice(0, 12).map(t => `
                                <tr style="border-bottom: 1px solid ${colors.border};">
                                    <td style="padding: 0.75rem; font-weight: 500;">${t.name}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: #3b82f6; font-weight: 600;">${t.total}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: #10b981; font-weight: 600;">${t.resolved}</td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="background: ${parseFloat(t.rate) >= 70 ? '#10b98120' : '#f59e0b20'}; color: ${parseFloat(t.rate) >= 70 ? '#10b981' : '#f59e0b'}; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">${t.rate}%</span>
                                    </td>
                                    <td style="padding: 0.75rem;">
                                        <div style="width: 100%; max-width: 150px; height: 8px; background: ${colors.border}; border-radius: 4px; overflow: hidden;">
                                            <div style="width: ${t.rate}%; height: 100%; background: ${parseFloat(t.rate) >= 70 ? '#10b981' : '#f59e0b'};"></div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Agent Performance Distribution -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                <h4 style="margin: 0 0 1rem 0; font-size: 1rem; color: ${colors.text};"><span style="font-size: 1.1rem;">📈</span> Distribuição de Performance dos Agentes</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                    ${[
                { label: 'Excelente (>80%)', min: 80, max: 101, color: '#10b981' },
                { label: 'Bom (60-80%)', min: 60, max: 80, color: '#3b82f6' },
                { label: 'Regular (40-60%)', min: 40, max: 60, color: '#f59e0b' },
                { label: 'Baixo (<40%)', min: 0, max: 40, color: '#ef4444' }
            ].map(tier => {
                const count = agentRanking.filter(a => parseFloat(a.rate) >= tier.min && parseFloat(a.rate) < tier.max).length;
                return `
                            <div style="text-align: center; padding: 1rem; background: ${tier.color}15; border-radius: 8px; border: 1px solid ${tier.color}30;">
                                <div style="font-size: 1.75rem; font-weight: 700; color: ${tier.color};">${count}</div>
                                <div style="font-size: 0.8rem; color: ${colors.textMuted};">${tier.label}</div>
                            </div>
                        `;
            }).join('')}
                </div>
            </div>
        </div>
        `;
    }

    // ========== RELATÓRIO DE SLA COM INSIGHTS ==========
    generateSLAReport(data, colors, report) {
        // Usar motor de insights
        const engine = window.ReportsInsightsEngine;
        const analysis = engine ? engine.analyzeSLA(data) : null;
        
        // SLA metrics detalhadas
        let firstResponseOK = 0, firstResponseTotal = 0;
        let resolutionOK = 0, resolutionTotal = 0;
        let totalResponseTime = 0, responseTimeCount = 0;
        const slaByPriority = {};
        const slaViolations = [];

        data.forEach(t => {
            const priority = this.priorityMap[t.priority]?.label || 'Média';
            if (!slaByPriority[priority]) slaByPriority[priority] = { ok: 0, violated: 0, total: 0 };

            if (t.fr_due_by) {
                firstResponseTotal++;
                slaByPriority[priority].total++;
                const responded = t.stats_first_responded_at ? new Date(t.stats_first_responded_at) : null;
                const due = new Date(t.fr_due_by);
                
                if (responded) {
                    const responseTime = (responded - new Date(t.created_at)) / (1000 * 60 * 60);
                    totalResponseTime += responseTime;
                    responseTimeCount++;
                }
                
                if (responded && responded <= due) {
                    firstResponseOK++;
                    slaByPriority[priority].ok++;
                } else {
                    slaByPriority[priority].violated++;
                    slaViolations.push({
                        id: t.id,
                        subject: t.subject?.substring(0, 45) + '...',
                        priority,
                        dueDate: due.toLocaleDateString('pt-BR'),
                        status: this.statusMap[t.status]?.label || 'Pendente'
                    });
                }
            }

            if (t.due_by) {
                resolutionTotal++;
                const resolved = t.stats_resolved_at ? new Date(t.stats_resolved_at) : null;
                const due = new Date(t.due_by);
                if (resolved && resolved <= due) resolutionOK++;
            }
        });

        const firstRate = firstResponseTotal > 0 ? ((firstResponseOK / firstResponseTotal) * 100) : 0;
        const resRate = resolutionTotal > 0 ? ((resolutionOK / resolutionTotal) * 100) : 0;
        const avgResponseTime = responseTimeCount > 0 ? (totalResponseTime / responseTimeCount) : null;
        const violationsCount = slaViolations.length;
        
        // Insights e alertas
        const allInsights = [...(analysis?.alerts || []), ...(analysis?.insights || [])];
        const recommendations = analysis?.recommendations || [];

        // Determinar saúde do SLA
        const slaHealth = firstRate >= 90 ? 'excelente' : firstRate >= 70 ? 'bom' : firstRate >= 50 ? 'regular' : 'crítico';
        const healthColors = { excelente: '#10b981', bom: '#3b82f6', regular: '#f59e0b', crítico: '#ef4444' };

        return `
        <div style="animation: fadeIn 0.3s ease;">
            <!-- Report Header -->
            <div style="background: linear-gradient(135deg, ${report.color}15, ${report.color}05); border: 1px solid ${report.color}30; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${report.icon} ${report.name}
                        </h3>
                        <p style="margin: 0 0 0.75rem 0; color: ${colors.textMuted}; font-size: 0.9rem;">
                            Período: ${this.getFilterSummary()} | ${data.length.toLocaleString('pt-BR')} tickets | ${violationsCount} violações
                        </p>
                        ${this.getModeBadge(colors)}
                    </div>
                    <div style="text-align: right; color: ${colors.textMuted}; font-size: 0.8rem;">
                        Gerado em: ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>

            <!-- SAÚDE DO SLA -->
            <div style="background: linear-gradient(135deg, ${healthColors[slaHealth]}20, ${healthColors[slaHealth]}05); border: 2px solid ${healthColors[slaHealth]}50; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: ${healthColors[slaHealth]}; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                        <span style="font-size: 1.25rem; font-weight: 700; color: white;">${firstRate.toFixed(0)}%</span>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: ${healthColors[slaHealth]}; text-transform: uppercase;">
                            Conformidade SLA: ${slaHealth.toUpperCase()}
                        </h4>
                        <p style="margin: 0.25rem 0 0 0; color: ${colors.text}; font-size: 0.9rem;">
                            ${slaHealth === 'excelente' ? 'Parabéns! O SLA está sendo cumprido de forma exemplar.' :
                              slaHealth === 'bom' ? 'O SLA está bom, mas há espaço para melhorias.' :
                              slaHealth === 'regular' ? 'Atenção! O SLA precisa de melhorias significativas.' :
                              'CRÍTICO: O SLA está muito abaixo do esperado. Ação urgente necessária!'}
                        </p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding-top: 1rem; border-top: 1px solid ${healthColors[slaHealth]}30;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${firstResponseOK}/${firstResponseTotal}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">1ª Resposta no Prazo</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #ef4444;">${violationsCount}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Violações Totais</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${avgResponseTime ? avgResponseTime.toFixed(1) + 'h' : '-'}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Tempo Médio Resposta</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${resRate >= 90 ? '#10b981' : resRate >= 70 ? '#f59e0b' : '#ef4444'};">${resRate.toFixed(1)}%</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">SLA Resolução</div>
                    </div>
                </div>
            </div>

            <!-- SLA: Apenas alertas críticos de SLA (diagnóstico focado) -->
            ${allInsights.filter(i => i.type === 'danger' || i.type === 'warning').length > 0 ? `
            <div style="background: ${allInsights.some(i => i.type === 'danger') ? '#ef444410' : '#f59e0b10'}; border: 1px solid ${allInsights.some(i => i.type === 'danger') ? '#ef444430' : '#f59e0b30'}; border-radius: 12px; padding: 1rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: ${allInsights.some(i => i.type === 'danger') ? '#ef4444' : '#f59e0b'};">
                    ${allInsights.some(i => i.type === 'danger') ? '🚨 Problemas de SLA Detectados' : '⚠️ Alertas de SLA'}
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${allInsights.filter(i => i.type === 'danger' || i.type === 'warning').map(i => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: ${colors.text};">
                            <span>${i.icon}</span> <strong>${i.metric || ''}</strong> ${i.title}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- SLA Cards Detalhados -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.5rem;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <div style="font-size: 0.85rem; color: ${colors.textMuted}; margin-bottom: 0.5rem;">SLA de Primeira Resposta</div>
                        <div style="font-size: 3rem; font-weight: 700; color: ${firstRate >= 90 ? '#10b981' : firstRate >= 70 ? '#f59e0b' : '#ef4444'};">${firstRate.toFixed(1)}%</div>
                        <div style="font-size: 0.8rem; color: ${colors.textSecondary};">${firstResponseOK} de ${firstResponseTotal} no prazo</div>
                    </div>
                    <div style="padding-top: 1rem; border-top: 1px solid ${colors.border};">
                        <p style="margin: 0; font-size: 0.8rem; color: ${colors.textMuted}; line-height: 1.5;">
                            <strong>O que é:</strong> Mede se a equipe respondeu ao cliente dentro do prazo estabelecido para primeira resposta. 
                            ${firstRate >= 90 ? '✅ Excelente performance!' : firstRate >= 70 ? '⚠️ Precisa de atenção' : '🚨 Requer ação imediata'}
                        </p>
                    </div>
                </div>
                <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.5rem;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <div style="font-size: 0.85rem; color: ${colors.textMuted}; margin-bottom: 0.5rem;">SLA de Resolução</div>
                        <div style="font-size: 3rem; font-weight: 700; color: ${resRate >= 90 ? '#10b981' : resRate >= 70 ? '#f59e0b' : '#ef4444'};">${resRate.toFixed(1)}%</div>
                        <div style="font-size: 0.8rem; color: ${colors.textSecondary};">${resolutionOK} de ${resolutionTotal} no prazo</div>
                    </div>
                    <div style="padding-top: 1rem; border-top: 1px solid ${colors.border};">
                        <p style="margin: 0; font-size: 0.8rem; color: ${colors.textMuted}; line-height: 1.5;">
                            <strong>O que é:</strong> Mede se o ticket foi resolvido dentro do prazo acordado para resolução completa.
                            ${resRate >= 90 ? '✅ Excelente performance!' : resRate >= 70 ? '⚠️ Precisa de atenção' : '🚨 Requer ação imediata'}
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- SLA by Priority -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">🎯</span> SLA por Nível de Prioridade
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Análise do cumprimento de SLA segmentado por prioridade do ticket. Tickets urgentes devem ter atenção especial.
                </p>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                    ${Object.entries(slaByPriority).map(([priority, stats]) => {
            const rate = stats.total > 0 ? ((stats.ok / stats.total) * 100).toFixed(0) : 0;
            const color = this.priorityMap[Object.keys(this.priorityMap).find(k => this.priorityMap[k].label === priority)]?.color || '#6b7280';
            const isProblematic = stats.violated > 0 && priority === 'Urgente';
            return `
                            <div style="text-align: center; padding: 1rem; background: ${color}10; border-radius: 8px; border: 2px solid ${isProblematic ? '#ef4444' : color + '30'};">
                                <div style="font-weight: 600; color: ${color}; margin-bottom: 0.5rem;">${priority}</div>
                                <div style="font-size: 1.75rem; font-weight: 700; color: ${parseFloat(rate) >= 90 ? '#10b981' : parseFloat(rate) >= 70 ? '#f59e0b' : '#ef4444'};">${rate}%</div>
                                <div style="font-size: 0.75rem; color: ${colors.textMuted};">${stats.ok} ok / ${stats.violated} violados</div>
                                ${isProblematic ? '<div style="margin-top: 0.5rem; font-size: 0.7rem; color: #ef4444; font-weight: 600;">⚠️ ATENÇÃO</div>' : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
            
            <!-- Recent Violations -->
            ${slaViolations.length > 0 ? `
            <div style="background: #ef444410; border: 2px solid #ef444430; border-radius: 12px; padding: 1.25rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: #ef4444;">
                    <span style="font-size: 1.1rem;">🚨</span> Tickets com Violação de SLA (${Math.min(slaViolations.length, 15)} de ${slaViolations.length})
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Lista de tickets que não cumpriram o SLA de primeira resposta. Revise estes casos para evitar recorrência.
                </p>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid ${colors.border}; background: ${colors.border}30;">
                                <th style="text-align: left; padding: 0.6rem; color: ${colors.textMuted};">ID</th>
                                <th style="text-align: left; padding: 0.6rem; color: ${colors.textMuted};">Assunto</th>
                                <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Prioridade</th>
                                <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Status</th>
                                <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Prazo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${slaViolations.slice(0, 15).map(v => `
                                <tr style="border-bottom: 1px solid ${colors.border};">
                                    <td style="padding: 0.6rem; color: #3b82f6; font-weight: 500;">#${v.id}</td>
                                    <td style="padding: 0.6rem;">${v.subject}</td>
                                    <td style="padding: 0.6rem; text-align: center;">
                                        <span style="background: ${this.priorityMap[Object.keys(this.priorityMap).find(k => this.priorityMap[k].label === v.priority)]?.color || '#6b7280'}20; color: ${this.priorityMap[Object.keys(this.priorityMap).find(k => this.priorityMap[k].label === v.priority)]?.color || '#6b7280'}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${v.priority}</span>
                                    </td>
                                    <td style="padding: 0.6rem; text-align: center; font-size: 0.8rem; color: ${colors.textMuted};">${v.status}</td>
                                    <td style="padding: 0.6rem; text-align: center; color: #ef4444; font-weight: 500;">${v.dueDate}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : `
            <div style="background: #10b98110; border: 2px solid #10b98130; border-radius: 12px; padding: 2rem; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <h4 style="margin: 0 0 0.5rem 0; color: #10b981;">Nenhuma Violação de SLA!</h4>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 0.9rem;">Parabéns! Todos os tickets foram respondidos dentro do prazo no período analisado.</p>
            </div>
            `}

            <!-- Explicação Didática -->
            <div style="background: linear-gradient(135deg, ${colors.border}50, ${colors.surface}); border: 1px dashed ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-top: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: ${colors.textMuted};">
                    📚 Entendendo as Métricas de SLA
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.8rem; color: ${colors.textMuted};">
                    <div><strong>SLA 1ª Resposta:</strong> Tempo máximo para dar a primeira resposta ao cliente após a abertura do ticket.</div>
                    <div><strong>SLA Resolução:</strong> Tempo máximo para resolver completamente o problema do cliente.</div>
                    <div><strong>Violação:</strong> Quando o prazo estabelecido não foi cumprido. Impacta satisfação do cliente.</div>
                    <div><strong>Meta Ideal:</strong> Manter SLA acima de 90% é considerado excelente em operações de suporte.</div>
                </div>
            </div>
        </div>
        `;
    }

    // ========== RELATÓRIO DE TENDÊNCIAS COM INSIGHTS ==========
    generateTrendsReport(data, colors, report) {
        // Usar motor de insights
        const engine = window.ReportsInsightsEngine;
        const analysis = engine ? engine.analyzeTrends(data) : null;

        // Daily volume
        const dailyVolume = {};
        const weeklyVolume = {};

        data.forEach(t => {
            const date = new Date(t.created_at);
            const dayKey = date.toISOString().split('T')[0];
            const weekKey = this.getWeekNumber(date);
            dailyVolume[dayKey] = (dailyVolume[dayKey] || 0) + 1;
            weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + 1;
        });

        const sortedDays = Object.keys(dailyVolume).sort();
        const avgDaily = sortedDays.length > 0 ? (data.length / sortedDays.length) : 0;

        // Calculate trend
        const recentDays = sortedDays.slice(-7);
        const olderDays = sortedDays.slice(-14, -7);
        const recentAvg = recentDays.length > 0 ? recentDays.reduce((sum, d) => sum + dailyVolume[d], 0) / recentDays.length : 0;
        const olderAvg = olderDays.length > 0 ? olderDays.reduce((sum, d) => sum + dailyVolume[d], 0) / olderDays.length : 0;
        const trend = olderAvg > 0 ? (((recentAvg - olderAvg) / olderAvg) * 100) : 0;

        // Busiest days
        const dayOfWeekStats = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        data.forEach(t => {
            const day = new Date(t.created_at).getDay();
            dayOfWeekStats[day]++;
        });
        const dayNamesFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const busiestDay = Object.entries(dayOfWeekStats).sort((a, b) => b[1] - a[1])[0];
        const quietestDay = Object.entries(dayOfWeekStats).sort((a, b) => a[1] - b[1])[0];

        // Pico e vale
        const maxDayVolume = sortedDays.length > 0 ? Math.max(...sortedDays.map(d => dailyVolume[d])) : 0;
        const minDayVolume = sortedDays.length > 0 ? Math.min(...sortedDays.map(d => dailyVolume[d])) : 0;
        const peakDay = sortedDays.find(d => dailyVolume[d] === maxDayVolume);

        // Projeções
        const projection7Days = Math.round(avgDaily * 7);
        const projection30Days = Math.round(avgDaily * 30);

        // Insights e alertas
        const allInsights = [...(analysis?.alerts || []), ...(analysis?.insights || [])];
        const recommendations = analysis?.recommendations || [];

        // Determinar status da tendência
        const trendStatus = Math.abs(trend) < 10 ? 'estável' : trend > 0 ? 'crescente' : 'decrescente';
        const trendColor = trendStatus === 'estável' ? '#3b82f6' : trend > 0 ? '#ef4444' : '#10b981';

        return `
        <div style="animation: fadeIn 0.3s ease;">
            <!-- Report Header -->
            <div style="background: linear-gradient(135deg, ${report.color}15, ${report.color}05); border: 1px solid ${report.color}30; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${report.icon} ${report.name}
                        </h3>
                        <p style="margin: 0 0 0.75rem 0; color: ${colors.textMuted}; font-size: 0.9rem;">
                            Período: ${this.getFilterSummary()} | ${data.length.toLocaleString('pt-BR')} tickets | ${sortedDays.length} dias analisados
                        </p>
                        ${this.getModeBadge(colors)}
                    </div>
                    <div style="text-align: right; color: ${colors.textMuted}; font-size: 0.8rem;">
                        Gerado em: ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>

            <!-- RESUMO DE TENDÊNCIA -->
            <div style="background: linear-gradient(135deg, ${trendColor}20, ${trendColor}05); border: 2px solid ${trendColor}50; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: ${trendColor}; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 2rem;">${trend > 10 ? '📈' : trend < -10 ? '📉' : '➡️'}</span>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: ${trendColor}; text-transform: uppercase;">
                            Tendência: ${trendStatus.toUpperCase()} (${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%)
                        </h4>
                        <p style="margin: 0.25rem 0 0 0; color: ${colors.text}; font-size: 0.9rem;">
                            ${trendStatus === 'estável' ? 'O volume de tickets está estável, sem grandes variações nos últimos dias.' :
                              trend > 0 ? 'O volume está aumentando! Verifique se há algum problema no produto ou campanha em andamento.' :
                              'O volume está diminuindo, o que pode indicar melhoria no produto ou menor demanda.'}
                        </p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding-top: 1rem; border-top: 1px solid ${trendColor}30;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${avgDaily.toFixed(1)}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Média Diária</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${maxDayVolume}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Pico (dia)</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${dayNamesFull[busiestDay[0]]}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Dia Mais Movimentado</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${projection30Days}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Projeção 30 dias</div>
                    </div>
                </div>
            </div>

            <!-- TENDÊNCIAS: Apenas alertas de volume (sem insights genéricos) -->
            ${allInsights.filter(i => i.type === 'warning' || i.type === 'danger').length > 0 ? `
            <div style="background: #f59e0b10; border: 1px solid #f59e0b30; border-radius: 12px; padding: 1rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #f59e0b;">📊 Alertas de Volume</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${allInsights.filter(i => i.type === 'warning' || i.type === 'danger').map(i => `
                        <span style="background: #f59e0b20; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; color: ${colors.text};">
                            ${i.icon} ${i.title} ${i.metric ? `(${i.metric})` : ''}
                        </span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- TENDÊNCIAS: KPIs específicos de tempo (sem repetir totais) -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
                ${this.renderKPICard('Média Diária', avgDaily.toFixed(1), '📊', '#3b82f6', colors, 'Tickets/dia')}
                ${this.renderKPICard('Variação Semanal', (trend >= 0 ? '+' : '') + trend.toFixed(1) + '%', trend >= 0 ? '📈' : '📉', trendColor, colors, 'vs semana anterior')}
                ${this.renderKPICard('Projeção 30d', projection30Days.toString(), '🔮', '#8b5cf6', colors, 'Estimativa mensal')}
                ${this.renderKPICard('Pico', maxDayVolume + ' tickets', '🔥', '#ef4444', colors, 'Maior volume dia')}
            </div>
            
            <!-- Daily Volume Chart -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">📈</span> Evolução do Volume Diário
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Gráfico mostrando a quantidade de tickets abertos por dia no período analisado. Útil para identificar picos e padrões.
                </p>
                <canvas id="chartDailyVolume" width="800" height="250"></canvas>
            </div>
            
            <!-- Day of Week Distribution -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">📅</span> Padrão Semanal de Tickets
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Distribuição por dia da semana para identificar sazonalidade e planejar escala da equipe.
                </p>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem;">
                    ${dayNames.map((name, i) => {
            const count = dayOfWeekStats[i];
            const max = Math.max(...Object.values(dayOfWeekStats));
            const pct = max > 0 ? (count / max) * 100 : 0;
            const isBusiest = parseInt(busiestDay[0]) === i;
            const isQuietest = parseInt(quietestDay[0]) === i;
            return `
                            <div style="text-align: center; ${isBusiest ? 'background: #ef444415; border-radius: 8px; padding: 0.5rem;' : isQuietest ? 'background: #10b98115; border-radius: 8px; padding: 0.5rem;' : ''}">
                                <div style="font-size: 0.8rem; color: ${isBusiest ? '#ef4444' : isQuietest ? '#10b981' : colors.textMuted}; margin-bottom: 0.5rem; font-weight: ${isBusiest || isQuietest ? '600' : '400'};">${name}</div>
                                <div style="height: 80px; display: flex; align-items: flex-end; justify-content: center;">
                                    <div style="width: 100%; max-width: 40px; background: linear-gradient(to top, ${isBusiest ? '#ef4444' : isQuietest ? '#10b981' : '#6366f1'}, ${isBusiest ? '#f87171' : isQuietest ? '#34d399' : '#8b5cf6'}); height: ${pct}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                                </div>
                                <div style="font-size: 0.9rem; font-weight: 600; margin-top: 0.5rem; color: ${isBusiest ? '#ef4444' : isQuietest ? '#10b981' : colors.text};">${count}</div>
                                ${isBusiest ? '<div style="font-size: 0.65rem; color: #ef4444;">🔥 Pico</div>' : ''}
                                ${isQuietest ? '<div style="font-size: 0.65rem; color: #10b981;">✨ Menor</div>' : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>

            <!-- Explicação Didática -->
            <div style="background: linear-gradient(135deg, ${colors.border}50, ${colors.surface}); border: 1px dashed ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: ${colors.textMuted};">
                    📚 Como Usar Este Relatório
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.8rem; color: ${colors.textMuted};">
                    <div><strong>Tendência Crescente:</strong> Pode indicar problemas no produto, campanha de marketing ativa ou sazonalidade. Prepare a equipe!</div>
                    <div><strong>Tendência Decrescente:</strong> Geralmente positivo - menos problemas ou produto mais estável. Mas verifique se não é perda de clientes.</div>
                    <div><strong>Padrão Semanal:</strong> Use para escalar a equipe. Mais pessoas nos dias de pico, menos nos dias tranquilos.</div>
                    <div><strong>Projeção:</strong> Estimativa baseada na média atual. Útil para planejamento de recursos e capacidade.</div>
                </div>
            </div>
        </div>
        `;
    }

    // ========== RELATÓRIO DE BACKLOG COM INSIGHTS ==========
    generateBacklogReport(data, colors, report) {
        // Usar motor de insights
        const engine = window.ReportsInsightsEngine;
        const analysis = engine ? engine.analyzeBacklog(data) : null;

        const now = new Date();
        const pending = data.filter(t => ![4, 5].includes(Number(t.status)));

        // Aging analysis detalhado
        const aging = { '0-3 dias': 0, '4-7 dias': 0, '8-15 dias': 0, '16-30 dias': 0, '>30 dias': 0 };
        const criticalTickets = [];
        const urgentPending = [];

        pending.forEach(t => {
            const created = new Date(t.created_at);
            const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));

            if (days <= 3) aging['0-3 dias']++;
            else if (days <= 7) aging['4-7 dias']++;
            else if (days <= 15) aging['8-15 dias']++;
            else if (days <= 30) aging['16-30 dias']++;
            else aging['>30 dias']++;

            if (days > 7) {
                criticalTickets.push({
                    id: t.id,
                    subject: t.subject?.substring(0, 40) + '...',
                    days,
                    priority: this.priorityMap[t.priority]?.label || 'Média',
                    priorityNum: t.priority || 2,
                    status: this.statusMap[t.status]?.label || 'Pendente'
                });
            }
            
            if (t.priority === 4) {
                urgentPending.push(t);
            }
        });

        // Ordenar por urgência (prioridade + idade)
        criticalTickets.sort((a, b) => {
            const scoreA = (5 - a.priorityNum) * 100 + a.days;
            const scoreB = (5 - b.priorityNum) * 100 + b.days;
            return scoreB - scoreA;
        });

        // Status distribution
        const statusDist = {};
        pending.forEach(t => {
            const s = this.statusMap[t.status]?.label || 'Outro';
            statusDist[s] = (statusDist[s] || 0) + 1;
        });

        const avgAge = pending.length > 0
            ? (pending.reduce((sum, t) => sum + Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24)), 0) / pending.length)
            : 0;

        // Calcular estimativa de limpeza
        const resolvedLast7Days = data.filter(t => {
            if (![4, 5].includes(Number(t.status))) return false;
            const resolved = t.stats_resolved_at ? new Date(t.stats_resolved_at) : null;
            if (!resolved) return false;
            return (now - resolved) / (1000 * 60 * 60 * 24) <= 7;
        }).length;
        const dailyResolutionRate = resolvedLast7Days / 7;
        const daysToClean = dailyResolutionRate > 0 ? Math.ceil(pending.length / dailyResolutionRate) : null;

        // Saúde do backlog
        const criticalPercent = pending.length > 0 ? ((criticalTickets.length / pending.length) * 100) : 0;
        const backlogHealth = criticalPercent <= 10 ? 'saudável' : criticalPercent <= 25 ? 'atenção' : criticalPercent <= 50 ? 'preocupante' : 'crítico';
        const healthColors = { saudável: '#10b981', atenção: '#f59e0b', preocupante: '#ef4444', crítico: '#dc2626' };

        // Insights e alertas
        const allInsights = [...(analysis?.alerts || []), ...(analysis?.insights || [])];
        const recommendations = analysis?.recommendations || [];

        return `
        <div style="animation: fadeIn 0.3s ease;">
            <!-- Report Header -->
            <div style="background: linear-gradient(135deg, ${report.color}15, ${report.color}05); border: 1px solid ${report.color}30; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${report.icon} ${report.name}
                        </h3>
                        <p style="margin: 0 0 0.75rem 0; color: ${colors.textMuted}; font-size: 0.9rem;">
                            ${pending.length.toLocaleString('pt-BR')} tickets pendentes | ${criticalTickets.length} críticos (>7 dias)
                        </p>
                        ${this.getModeBadge(colors)}
                    </div>
                    <div style="text-align: right; color: ${colors.textMuted}; font-size: 0.8rem;">
                        Gerado em: ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>

            <!-- SAÚDE DO BACKLOG -->
            <div style="background: linear-gradient(135deg, ${healthColors[backlogHealth]}20, ${healthColors[backlogHealth]}05); border: 2px solid ${healthColors[backlogHealth]}50; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: ${healthColors[backlogHealth]}; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 2rem;">${backlogHealth === 'saudável' ? '✅' : backlogHealth === 'atenção' ? '⚠️' : '🚨'}</span>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: ${healthColors[backlogHealth]}; text-transform: uppercase;">
                            Backlog: ${backlogHealth.toUpperCase()}
                        </h4>
                        <p style="margin: 0.25rem 0 0 0; color: ${colors.text}; font-size: 0.9rem;">
                            ${backlogHealth === 'saudável' ? 'O backlog está sob controle! A maioria dos tickets são recentes.' :
                              backlogHealth === 'atenção' ? 'Há tickets acumulando. Considere priorizar os mais antigos.' :
                              backlogHealth === 'preocupante' ? 'Muitos tickets antigos! É necessário uma força-tarefa para limpar.' :
                              'CRÍTICO: O backlog está fora de controle. Ação urgente necessária!'}
                        </p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; padding-top: 1rem; border-top: 1px solid ${healthColors[backlogHealth]}30;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${pending.length}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Total Pendente</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${avgAge <= 5 ? '#10b981' : avgAge <= 10 ? '#f59e0b' : '#ef4444'};">${avgAge.toFixed(1)}d</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Idade Média</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #ef4444;">${criticalTickets.length}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Críticos (>7d)</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #dc2626;">${urgentPending.length}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Urgentes Pendentes</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${colors.text};">${daysToClean ? daysToClean + 'd' : '-'}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Est. p/ Zerar</div>
                    </div>
                </div>
            </div>

            <!-- BACKLOG: Apenas alertas de tickets antigos (sem insights genéricos) -->
            ${allInsights.filter(i => i.type === 'danger').length > 0 ? `
            <div style="background: #ef444410; border: 1px solid #ef444430; border-radius: 12px; padding: 1rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #ef4444;">🚨 Alertas de Backlog</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${allInsights.filter(i => i.type === 'danger').map(i => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: ${colors.text};">
                            <span>${i.icon}</span> ${i.title} <strong style="color: #ef4444;">${i.metric || ''}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- BACKLOG: KPIs específicos de aging (sem repetir totais genéricos) -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
                ${this.renderKPICard('Idade Média', avgAge.toFixed(1) + 'd', '⏳', '#8b5cf6', colors, 'Tempo em fila')}
                ${this.renderKPICard('Críticos >7d', criticalTickets.length.toString(), '🚨', '#ef4444', colors, 'Precisam atenção')}
                ${this.renderKPICard('Muito Antigos', aging['>30 dias'].toString(), '💀', '#dc2626', colors, '>30 dias')}
                ${this.renderKPICard('Est. p/ Zerar', daysToClean ? daysToClean + 'd' : 'N/A', '🎯', '#10b981', colors, 'Ritmo atual')}
            </div>
            
            <!-- Aging Chart -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                    <span style="font-size: 1.1rem;">⏳</span> Distribuição por Idade (Aging)
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Mostra há quanto tempo os tickets estão pendentes. Tickets mais antigos (cores mais quentes) precisam de atenção prioritária.
                </p>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
                    ${Object.entries(aging).map(([range, count], i) => {
            const agingColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626'];
            const agingLabels = ['Recentes', 'Novos', 'Atenção', 'Críticos', 'Urgente!'];
            const pct = pending.length > 0 ? ((count / pending.length) * 100).toFixed(0) : 0;
            return `
                            <div style="text-align: center; padding: 1rem; background: ${agingColors[i]}15; border-radius: 8px; border: 2px solid ${agingColors[i]}${count > 0 && i >= 3 ? '' : '30'};">
                                <div style="font-size: 1.75rem; font-weight: 700; color: ${agingColors[i]};">${count}</div>
                                <div style="font-size: 0.75rem; color: ${colors.textMuted}; margin-top: 0.25rem;">${range}</div>
                                <div style="font-size: 0.7rem; color: ${agingColors[i]}; margin-top: 0.25rem;">${pct}% - ${agingLabels[i]}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>

            <!-- BACKLOG: Removido distribuição por status (já está no Executivo) -->
            
            <!-- Critical Tickets Table -->
            ${criticalTickets.length > 0 ? `
            <div style="background: #ef444410; border: 2px solid #ef444430; border-radius: 12px; padding: 1.25rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: #ef4444;">
                    <span style="font-size: 1.1rem;">🚨</span> Fila de Prioridade - Tickets para Ação Imediata
                </h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                    Lista ordenada por urgência (prioridade + idade). Comece pelos de cima para maior impacto.
                </p>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid ${colors.border}; background: ${colors.border}30;">
                                <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted}; width: 40px;">#</th>
                                <th style="text-align: left; padding: 0.6rem; color: ${colors.textMuted};">ID</th>
                                <th style="text-align: left; padding: 0.6rem; color: ${colors.textMuted};">Assunto</th>
                                <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Idade</th>
                                <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Prioridade</th>
                                <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${criticalTickets.slice(0, 20).map((t, idx) => `
                                <tr style="border-bottom: 1px solid ${colors.border}; ${idx < 3 ? 'background: #ef444408;' : ''}">
                                    <td style="padding: 0.6rem; text-align: center;">
                                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: ${idx < 3 ? '#ef4444' : colors.border}; color: ${idx < 3 ? 'white' : colors.text}; font-size: 0.75rem; font-weight: 600;">${idx + 1}</span>
                                    </td>
                                    <td style="padding: 0.6rem; color: #3b82f6; font-weight: 500;">#${t.id}</td>
                                    <td style="padding: 0.6rem;">${t.subject}</td>
                                    <td style="padding: 0.6rem; text-align: center;">
                                        <span style="background: ${t.days > 30 ? '#dc262630' : t.days > 15 ? '#ef444430' : '#f59e0b30'}; color: ${t.days > 30 ? '#dc2626' : t.days > 15 ? '#ef4444' : '#f59e0b'}; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 600;">${t.days}d</span>
                                    </td>
                                    <td style="padding: 0.6rem; text-align: center;">
                                        <span style="background: ${this.priorityMap[t.priorityNum]?.color || '#6b7280'}20; color: ${this.priorityMap[t.priorityNum]?.color || '#6b7280'}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${t.priority}</span>
                                    </td>
                                    <td style="padding: 0.6rem; text-align: center; font-size: 0.8rem; color: ${colors.textMuted};">${t.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${criticalTickets.length > 20 ? `<div style="margin-top: 1rem; text-align: center; color: ${colors.textMuted}; font-size: 0.85rem;">... e mais ${criticalTickets.length - 20} tickets críticos</div>` : ''}
            </div>
            ` : `
            <div style="background: #10b98110; border: 2px solid #10b98130; border-radius: 12px; padding: 2rem; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <h4 style="margin: 0 0 0.5rem 0; color: #10b981;">Nenhum Ticket Crítico!</h4>
                <p style="margin: 0; color: ${colors.textMuted}; font-size: 0.9rem;">Parabéns! Não há tickets pendentes há mais de 7 dias.</p>
            </div>
            `}

            <!-- Explicação Didática -->
            <div style="background: linear-gradient(135deg, ${colors.border}50, ${colors.surface}); border: 1px dashed ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-top: 2rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: ${colors.textMuted};">
                    📚 Como Gerenciar o Backlog
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.8rem; color: ${colors.textMuted};">
                    <div><strong>Aging (Envelhecimento):</strong> Quanto mais tempo um ticket fica pendente, mais difícil se torna resolver e maior a insatisfação do cliente.</div>
                    <div><strong>Fila de Prioridade:</strong> Sempre resolva os tickets urgentes primeiro, depois os mais antigos. Isso evita que problemas simples virem crises.</div>
                    <div><strong>Meta Ideal:</strong> Mantenha a idade média abaixo de 5 dias e menos de 10% do backlog com mais de 7 dias.</div>
                    <div><strong>Estimativa de Limpeza:</strong> Baseada na taxa de resolução atual. Se for muito alta, considere aumentar a equipe ou rever processos.</div>
                </div>
            </div>
        </div>
        `;
    }

    // ========== RELATÓRIO DE TEMPO DE RESOLUÇÃO ==========
    // Exclui Melhorias e Projetos - foco em atendimento real
    generateResolutionTimeReport(data, colors, report) {
        const mode = this.getDataMode();
        
        // Tipos a ignorar (Melhorias e Projetos)
        const ignoreTypes = new Set([
            'melhoria', 'melhoria api', 'melhoria app motorista', 'melhoria bi',
            'melhoria etrip', 'melhoria optz', 'melhoria sing', 'melhoria telemetria', 'melhoria yuv',
            'projeto', 'projeto api', 'projeto app motorista', 'projeto bi',
            'projeto etrip', 'projeto optz', 'projeto sing', 'projeto telemetria', 'projeto yuv', 'project'
        ]);

        // Filtrar tickets resolvidos, excluindo melhorias e projetos
        const resolvedTickets = data.filter(t => {
            const status = Number(t.status);
            if (![4, 5].includes(status)) return false;
            
            const typeNorm = (t.type || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
            if (ignoreTypes.has(typeNorm)) return false;
            
            const resolved = t.stats_resolved_at || t.stats_closed_at || t.resolved_at || t.closed_at;
            if (!resolved || !t.created_at) return false;
            
            const resolutionTimeHours = (new Date(resolved) - new Date(t.created_at)) / (1000 * 60 * 60);
            return resolutionTimeHours > 0 && resolutionTimeHours <= 720; // Ignora outliers > 30 dias
        });

        // Contar tickets ignorados
        const ignoredCount = data.filter(t => {
            const typeNorm = (t.type || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
            return ignoreTypes.has(typeNorm);
        }).length;

        // Campo de agrupamento baseado no modo
        const entityField = mode === 'tags' ? 'cf_grupo_tratativa' : 'cf_tratativa';

        // Agregar por pessoa
        const byPerson = new Map();
        resolvedTickets.forEach(t => {
            const resolved = t.stats_resolved_at || t.stats_closed_at || t.resolved_at || t.closed_at;
            const resolutionTimeHours = (new Date(resolved) - new Date(t.created_at)) / (1000 * 60 * 60);
            
            const persons = t[entityField] ? t[entityField].split(/[,;\/]/).map(e => e.trim()).filter(e => e) : ['Sem Responsável'];
            
            persons.forEach(person => {
                if (!byPerson.has(person)) byPerson.set(person, { times: [], tickets: [] });
                const d = byPerson.get(person);
                d.times.push(resolutionTimeHours);
                d.tickets.push(t);
            });
        });

        // Calcular estatísticas por pessoa
        const personStats = Array.from(byPerson.entries()).map(([name, d]) => {
            const times = d.times.sort((a, b) => a - b);
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const min = times[0];
            const max = times[times.length - 1];
            const median = times[Math.floor(times.length / 2)];
            return { name, avg, min, max, median, count: times.length, tickets: d.tickets };
        }).sort((a, b) => a.avg - b.avg); // Ordenar por menor tempo (melhor)

        // Estatísticas globais
        const allTimes = resolvedTickets.map(t => {
            const resolved = t.stats_resolved_at || t.stats_closed_at || t.resolved_at || t.closed_at;
            return (new Date(resolved) - new Date(t.created_at)) / (1000 * 60 * 60);
        });
        const globalAvg = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
        const globalMin = allTimes.length > 0 ? Math.min(...allTimes) : 0;
        const globalMax = allTimes.length > 0 ? Math.max(...allTimes) : 0;

        // Helpers de formatação
        const formatTime = (hours) => {
            if (hours < 1) return `${Math.round(hours * 60)} min`;
            if (hours < 24) return `${hours.toFixed(1)} horas`;
            return `${(hours / 24).toFixed(1)} dias`;
        };

        const getColor = (hours) => {
            if (hours <= 24) return '#10b981'; // Verde
            if (hours <= 48) return '#f59e0b'; // Amarelo
            return '#ef4444'; // Vermelho
        };

        // Contagem por faixa
        const within24h = personStats.filter(p => p.avg <= 24).length;
        const between24and48 = personStats.filter(p => p.avg > 24 && p.avg <= 48).length;
        const above48h = personStats.filter(p => p.avg > 48).length;

        return `
        <div style="padding: 1.5rem;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid ${colors.border};">
                <div>
                    <h2 style="margin: 0; font-size: 1.5rem; color: ${report.color};">${report.icon} ${report.name}</h2>
                    <p style="margin: 0.25rem 0 0 0; color: ${colors.textMuted}; font-size: 0.85rem;">
                        Período: ${this.getFilterSummary()} | Modo: ${mode === 'tags' ? 'Tags' : 'Tratativa'}
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Gerado em</div>
                    <div style="font-weight: 600; color: ${colors.text};">${new Date().toLocaleString('pt-BR')}</div>
                </div>
            </div>

            <!-- Aviso de exclusão -->
            <div style="background: #f59e0b15; border: 1px solid #f59e0b50; border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">⚠️</span>
                <div>
                    <strong style="color: #f59e0b;">Melhorias e Projetos Excluídos</strong>
                    <div style="font-size: 0.8rem; color: ${colors.textMuted};">${ignoredCount} tickets de Melhoria/Projeto foram ignorados para refletir apenas o tempo de atendimento real.</div>
                </div>
            </div>

            <!-- KPIs Globais -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
                ${this.renderKPICard('Tickets Analisados', resolvedTickets.length.toLocaleString(), '🎫', report.color, colors)}
                ${this.renderKPICard('Tempo Médio Global', formatTime(globalAvg), '⏱️', getColor(globalAvg), colors)}
                ${this.renderKPICard('Mais Rápido', formatTime(globalMin), '🚀', '#10b981', colors)}
                ${this.renderKPICard('Mais Lento', formatTime(globalMax), '🐢', '#ef4444', colors)}
            </div>

            <!-- Resumo por Faixa -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #10b98115; border: 1px solid #10b98150; border-radius: 12px; padding: 1rem; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${within24h}</div>
                    <div style="font-size: 0.85rem; color: ${colors.textMuted};">🟢 Dentro de 24h</div>
                    <div style="font-size: 0.75rem; color: ${colors.textSecondary};">${personStats.length > 0 ? Math.round(within24h / personStats.length * 100) : 0}% das pessoas</div>
                </div>
                <div style="background: #f59e0b15; border: 1px solid #f59e0b50; border-radius: 12px; padding: 1rem; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${between24and48}</div>
                    <div style="font-size: 0.85rem; color: ${colors.textMuted};">🟡 Entre 24h e 48h</div>
                    <div style="font-size: 0.75rem; color: ${colors.textSecondary};">${personStats.length > 0 ? Math.round(between24and48 / personStats.length * 100) : 0}% das pessoas</div>
                </div>
                <div style="background: #ef444415; border: 1px solid #ef444450; border-radius: 12px; padding: 1rem; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">${above48h}</div>
                    <div style="font-size: 0.85rem; color: ${colors.textMuted};">🔴 Acima de 48h</div>
                    <div style="font-size: 0.75rem; color: ${colors.textSecondary};">${personStats.length > 0 ? Math.round(above48h / personStats.length * 100) : 0}% das pessoas</div>
                </div>
            </div>

            <!-- Ranking de Tempo de Resolução -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: ${colors.text}; display: flex; align-items: center; gap: 0.5rem;">
                    🏆 Ranking: Tempo Médio de Resolução por ${mode === 'tags' ? 'Time' : 'Pessoa'}
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: ${colors.border}40;">
                            <th style="padding: 0.75rem; text-align: left; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">#</th>
                            <th style="padding: 0.75rem; text-align: left; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">${mode === 'tags' ? 'Time' : 'Pessoa'}</th>
                            <th style="padding: 0.75rem; text-align: center; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">Tempo Médio</th>
                            <th style="padding: 0.75rem; text-align: center; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">Mínimo</th>
                            <th style="padding: 0.75rem; text-align: center; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">Máximo</th>
                            <th style="padding: 0.75rem; text-align: center; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">Mediana</th>
                            <th style="padding: 0.75rem; text-align: center; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">Tickets</th>
                            <th style="padding: 0.75rem; text-align: center; color: ${colors.text}; border-bottom: 1px solid ${colors.border};">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${personStats.map((p, i) => `
                            <tr style="background: ${i % 2 === 0 ? 'transparent' : colors.border + '20'};">
                                <td style="padding: 0.75rem; color: ${colors.textMuted}; border-bottom: 1px solid ${colors.border}20;">${i + 1}</td>
                                <td style="padding: 0.75rem; color: ${colors.text}; font-weight: 500; border-bottom: 1px solid ${colors.border}20;">
                                    ${i < 3 ? ['🥇', '🥈', '🥉'][i] : ''} ${p.name}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: ${getColor(p.avg)}; border-bottom: 1px solid ${colors.border}20;">
                                    ${formatTime(p.avg)}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; color: ${colors.textMuted}; border-bottom: 1px solid ${colors.border}20;">${formatTime(p.min)}</td>
                                <td style="padding: 0.75rem; text-align: center; color: ${colors.textMuted}; border-bottom: 1px solid ${colors.border}20;">${formatTime(p.max)}</td>
                                <td style="padding: 0.75rem; text-align: center; color: ${colors.textMuted}; border-bottom: 1px solid ${colors.border}20;">${formatTime(p.median)}</td>
                                <td style="padding: 0.75rem; text-align: center; color: ${colors.text}; border-bottom: 1px solid ${colors.border}20;">${p.count}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid ${colors.border}20;">
                                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${getColor(p.avg)};"></span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Top 5 Mais Rápidos -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 1.5rem;">
                <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #10b981; display: flex; align-items: center; gap: 0.5rem;">
                        🚀 Top 5 Mais Rápidos
                    </h4>
                    ${personStats.slice(0, 5).map((p, i) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid ${colors.border}30;">
                            <span style="color: ${colors.text};">${['🥇', '🥈', '🥉', '4.', '5.'][i]} ${p.name}</span>
                            <span style="font-weight: 600; color: #10b981;">${formatTime(p.avg)}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #ef4444; display: flex; align-items: center; gap: 0.5rem;">
                        🐢 Top 5 Mais Lentos (Oportunidade de Melhoria)
                    </h4>
                    ${personStats.slice(-5).reverse().map((p, i) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid ${colors.border}30;">
                            <span style="color: ${colors.text};">${p.name}</span>
                            <span style="font-weight: 600; color: #ef4444;">${formatTime(p.avg)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Explicação Didática -->
            <div style="background: linear-gradient(135deg, ${colors.border}50, ${colors.surface}); border: 1px dashed ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-top: 1rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: ${colors.textMuted};">
                    📚 Como Interpretar Este Relatório
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.8rem; color: ${colors.textMuted};">
                    <div><strong>🟢 Verde (≤24h):</strong> Excelente! Tempo de resolução dentro da meta ideal.</div>
                    <div><strong>🟡 Amarelo (24-48h):</strong> Aceitável, mas há espaço para melhorias.</div>
                    <div><strong>🔴 Vermelho (>48h):</strong> Atenção necessária. Investigar causas de atraso.</div>
                    <div><strong>Excluídos:</strong> Melhorias e Projetos têm ciclos diferentes e não devem afetar métricas de atendimento.</div>
                </div>
            </div>
        </div>
        `;
    }

    // ========== HELPER METHODS ==========
    renderKPICard(label, value, icon, color, colors, description = null) {
        return `
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; background: ${color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                    ${icon}
                </div>
                <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${color};">${value}</div>
                    <div style="font-size: 0.8rem; color: ${colors.textMuted};">${label}</div>
                    ${description ? `<div style="font-size: 0.7rem; color: ${colors.textSecondary}; margin-top: 0.2rem;">${description}</div>` : ''}
                </div>
            </div>
        `;
    }

    getFilterSummary() {
        const f = this.filters;
        if (f.period === 'custom' && f.startDate && f.endDate) {
            return `${new Date(f.startDate).toLocaleDateString('pt-BR')} - ${new Date(f.endDate).toLocaleDateString('pt-BR')}`;
        }
        if (f.period === 'all') return 'Todo o período';
        return `Últimos ${f.period} dias`;
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
    }

    renderCharts() {
        const colors = this.getColors();
        const data = this.filterData();

        // Status Distribution Chart (Executive)
        const statusCanvas = document.getElementById('chartStatusDist');
        if (statusCanvas) {
            const ctx = statusCanvas.getContext('2d');
            const statusDist = {};
            data.forEach(t => {
                const s = this.statusMap[t.status]?.label || 'Outro';
                statusDist[s] = (statusDist[s] || 0) + 1;
            });
            this.drawDonutChart(ctx, statusCanvas.width, statusCanvas.height, statusDist, colors);
        }

        // Team Comparison Chart (Performance)
        const teamCanvas = document.getElementById('chartTeamComparison');
        if (teamCanvas) {
            const ctx = teamCanvas.getContext('2d');
            const teamStats = {};
            data.forEach(t => {
                const team = t.cf_tratativa || 'Sem Time';
                if (!teamStats[team]) teamStats[team] = { total: 0, resolved: 0 };
                teamStats[team].total++;
                if (t.status === 4 || t.status === 5) teamStats[team].resolved++;
            });
            this.drawBarChart(ctx, teamCanvas.width, teamCanvas.height, teamStats, colors);
        }

        // Daily Volume Chart (Trends)
        const dailyCanvas = document.getElementById('chartDailyVolume');
        if (dailyCanvas) {
            const ctx = dailyCanvas.getContext('2d');
            const dailyVolume = {};
            data.forEach(t => {
                const day = new Date(t.created_at).toISOString().split('T')[0];
                dailyVolume[day] = (dailyVolume[day] || 0) + 1;
            });
            this.drawLineChart(ctx, dailyCanvas.width, dailyCanvas.height, dailyVolume, colors);
        }
    }

    drawDonutChart(ctx, width, height, data, colors) {
        const entries = Object.entries(data);
        const total = entries.reduce((sum, [, v]) => sum + v, 0);
        if (total === 0) return;

        // Chart on the left, legend on the right
        const chartAreaWidth = width * 0.45;
        const centerX = chartAreaWidth / 2;
        const centerY = height / 2;
        const radius = Math.min(chartAreaWidth, height) / 2.2;
        const innerRadius = radius * 0.55;

        const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
        let startAngle = -Math.PI / 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw slices
        entries.forEach(([label, value], i) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = chartColors[i % chartColors.length];
            ctx.fill();
            startAngle += sliceAngle;
        });

        // Center text
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(total.toLocaleString('pt-BR'), centerX, centerY - 5);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = colors.textMuted;
        ctx.fillText('Total', centerX, centerY + 12);
        ctx.textAlign = 'left';

        // Legend on the right side
        const legendX = chartAreaWidth + 20;
        let legendY = 15;
        const lineHeight = Math.min(22, (height - 20) / entries.length);

        entries.forEach(([label, value], i) => {
            const pct = ((value / total) * 100).toFixed(1);

            // Color box
            ctx.fillStyle = chartColors[i % chartColors.length];
            ctx.fillRect(legendX, legendY, 14, 14);

            // Label and value
            ctx.fillStyle = colors.text;
            ctx.font = '12px sans-serif';
            ctx.fillText(`${label}`, legendX + 20, legendY + 11);

            // Value and percentage
            ctx.fillStyle = colors.textMuted;
            ctx.font = '11px sans-serif';
            ctx.fillText(`${value} (${pct}%)`, legendX + 20, legendY + 24);

            legendY += lineHeight + 8;
        });
    }

    drawBarChart(ctx, width, height, data, colors) {
        const entries = Object.entries(data).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
        const maxVal = Math.max(...entries.map(e => e[1].total));
        const barWidth = (width - 100) / entries.length - 10;
        const chartHeight = height - 60;

        entries.forEach(([team, stats], i) => {
            const x = 50 + i * (barWidth + 10);
            const barHeight = (stats.total / maxVal) * chartHeight;
            const resolvedHeight = (stats.resolved / maxVal) * chartHeight;

            // Total bar
            ctx.fillStyle = '#6366f140';
            ctx.fillRect(x, height - 30 - barHeight, barWidth, barHeight);

            // Resolved bar
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x, height - 30 - resolvedHeight, barWidth, resolvedHeight);

            // Label
            ctx.fillStyle = colors.textMuted;
            ctx.font = '10px sans-serif';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - 10);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(team.substring(0, 12), 0, 0);
            ctx.restore();

            // Value
            ctx.fillStyle = colors.text;
            ctx.fillText(stats.total, x + barWidth / 2 - 8, height - 35 - barHeight);
        });
    }

    drawLineChart(ctx, width, height, data, colors) {
        const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
        if (entries.length === 0) return;

        const maxVal = Math.max(...entries.map(e => e[1]));
        const chartWidth = width - 80;
        const chartHeight = height - 60;
        const stepX = chartWidth / (entries.length - 1 || 1);

        // Draw grid
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = 30 + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(60, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
            ctx.fillStyle = colors.textMuted;
            ctx.font = '10px sans-serif';
            ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), 30, y + 4);
        }

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        entries.forEach(([date, value], i) => {
            const x = 60 + i * stepX;
            const y = 30 + chartHeight - (value / maxVal) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw points
        entries.forEach(([date, value], i) => {
            const x = 60 + i * stepX;
            const y = 30 + chartHeight - (value / maxVal) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
        });
    }

    // ========== AUXILIARY REPORT METHODS ==========
    generateExecutiveAdditionalMetrics(data, colors) {
        // Calculate additional metrics
        const now = new Date();
        const avgResolutionTime = this.calculateAvgResolutionTime(data);
        const avgFirstResponseTime = this.calculateAvgFirstResponseTime(data);

        // Priority distribution
        const priorityDist = {};
        data.forEach(t => {
            const p = this.priorityMap[t.priority]?.label || 'Média';
            priorityDist[p] = (priorityDist[p] || 0) + 1;
        });

        // Tickets by source
        const sourceDist = {};
        data.forEach(t => {
            const source = t.source === 1 ? 'Email' : t.source === 2 ? 'Portal' : t.source === 3 ? 'Telefone' : t.source === 7 ? 'Chat' : 'Outro';
            sourceDist[source] = (sourceDist[source] || 0) + 1;
        });

        return `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <!-- Priority Distribution -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                <h4 style="margin: 0 0 1rem 0; font-size: 1rem;">🎯 Distribuição por Prioridade</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
                    ${Object.entries(this.priorityMap).map(([key, val]) => {
            const count = priorityDist[val.label] || 0;
            const pct = data.length > 0 ? ((count / data.length) * 100).toFixed(0) : 0;
            return `
                            <div style="text-align: center; padding: 0.75rem; background: ${val.color}15; border-radius: 8px; border: 1px solid ${val.color}30;">
                                <div style="font-size: 1.25rem; font-weight: 700; color: ${val.color};">${count}</div>
                                <div style="font-size: 0.75rem; color: ${colors.textMuted};">${val.label}</div>
                                <div style="font-size: 0.7rem; color: ${colors.textSecondary};">${pct}%</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
            
            <!-- Time Metrics -->
            <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
                <h4 style="margin: 0 0 1rem 0; font-size: 1rem;">⏱️ Métricas de Tempo</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: #3b82f615; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${avgFirstResponseTime}</div>
                        <div style="font-size: 0.8rem; color: ${colors.textMuted};">Tempo Médio 1ª Resposta</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #10b98115; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${avgResolutionTime}</div>
                        <div style="font-size: 0.8rem; color: ${colors.textMuted};">Tempo Médio Resolução</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Source Distribution -->
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 1rem 0; font-size: 1rem;">📬 Tickets por Canal de Origem</h4>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                ${Object.entries(sourceDist).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
            const pct = data.length > 0 ? ((count / data.length) * 100).toFixed(1) : 0;
            const sourceColors = { 'Email': '#3b82f6', 'Portal': '#10b981', 'Telefone': '#f59e0b', 'Chat': '#8b5cf6', 'Outro': '#6b7280' };
            return `
                        <div style="flex: 1; min-width: 120px; text-align: center; padding: 1rem; background: ${sourceColors[source] || '#6b7280'}15; border-radius: 8px; border: 1px solid ${sourceColors[source] || '#6b7280'}30;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: ${sourceColors[source] || '#6b7280'};">${count}</div>
                            <div style="font-size: 0.85rem; color: ${colors.text};">${source}</div>
                            <div style="font-size: 0.75rem; color: ${colors.textMuted};">${pct}%</div>
                        </div>
                    `;
        }).join('')}
            </div>
        </div>
        `;
    }

    generateTopTeamsTable(data, colors) {
        const mode = this.getDataMode();
        const teamStats = {};
        data.forEach(t => {
            const team = this.getResponsavel(t) || 'Sem Responsável';
            if (!teamStats[team]) teamStats[team] = { total: 0, resolved: 0, pending: 0 };
            teamStats[team].total++;
            if (t.status === 4 || t.status === 5) teamStats[team].resolved++;
            else teamStats[team].pending++;
        });

        const teams = Object.entries(teamStats)
            .map(([name, stats]) => ({
                name,
                ...stats,
                rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);

        if (teams.length === 0) return '';

        const tableTitle = mode === 'tags' ? '👥 Resumo por Pessoa (Acompanhamento)' : '👥 Resumo por Time/Tratativa';
        const colTitle = mode === 'tags' ? 'Pessoa' : 'Time';

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 1rem 0; font-size: 1rem;">${tableTitle}</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid ${colors.border};">
                            <th style="text-align: left; padding: 0.75rem; color: ${colors.textMuted};">${colTitle}</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Total</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Pendentes</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Resolvidos</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${colors.textMuted};">Taxa</th>
                            <th style="text-align: left; padding: 0.75rem; color: ${colors.textMuted};">Progresso</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teams.map(t => `
                            <tr style="border-bottom: 1px solid ${colors.border};">
                                <td style="padding: 0.75rem; font-weight: 500;">${t.name}</td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 600; color: #3b82f6;">${t.total}</td>
                                <td style="padding: 0.75rem; text-align: center; color: #f59e0b;">${t.pending}</td>
                                <td style="padding: 0.75rem; text-align: center; color: #10b981;">${t.resolved}</td>
                                <td style="padding: 0.75rem; text-align: center;">
                                    <span style="background: ${parseFloat(t.rate) >= 70 ? '#10b98120' : '#f59e0b20'}; color: ${parseFloat(t.rate) >= 70 ? '#10b981' : '#f59e0b'}; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">${t.rate}%</span>
                                </td>
                                <td style="padding: 0.75rem;">
                                    <div style="width: 100%; height: 8px; background: ${colors.border}; border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${t.rate}%; height: 100%; background: ${parseFloat(t.rate) >= 70 ? '#10b981' : '#f59e0b'};"></div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    generateRecentTicketsTable(data, colors, limit = 10) {
        const recent = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);

        if (recent.length === 0) return '';

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem;">
            <h4 style="margin: 0 0 1rem 0; font-size: 1rem;">📋 Tickets Recentes (últimos ${limit})</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid ${colors.border};">
                            <th style="text-align: left; padding: 0.5rem; color: ${colors.textMuted};">ID</th>
                            <th style="text-align: left; padding: 0.5rem; color: ${colors.textMuted};">Assunto</th>
                            <th style="text-align: center; padding: 0.5rem; color: ${colors.textMuted};">Status</th>
                            <th style="text-align: center; padding: 0.5rem; color: ${colors.textMuted};">Prioridade</th>
                            <th style="text-align: left; padding: 0.5rem; color: ${colors.textMuted};">Agente</th>
                            <th style="text-align: center; padding: 0.5rem; color: ${colors.textMuted};">Criado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(t => {
            const status = this.statusMap[t.status] || { label: 'Outro', color: '#6b7280' };
            const priority = this.priorityMap[t.priority] || { label: 'Média', color: '#3b82f6' };
            return `
                                <tr style="border-bottom: 1px solid ${colors.border};">
                                    <td style="padding: 0.5rem; color: #3b82f6; font-weight: 600;">#${t.id}</td>
                                    <td style="padding: 0.5rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${(t.subject || '').substring(0, 50)}${(t.subject || '').length > 50 ? '...' : ''}</td>
                                    <td style="padding: 0.5rem; text-align: center;">
                                        <span style="background: ${status.color}20; color: ${status.color}; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem;">${status.label}</span>
                                    </td>
                                    <td style="padding: 0.5rem; text-align: center;">
                                        <span style="background: ${priority.color}20; color: ${priority.color}; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem;">${priority.label}</span>
                                    </td>
                                    <td style="padding: 0.5rem; color: ${colors.textMuted};">${t.responder_name || '-'}</td>
                                    <td style="padding: 0.5rem; text-align: center; color: ${colors.textMuted};">${new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    calculateAvgResolutionTime(data) {
        const resolved = data.filter(t => t.stats_resolved_at && t.created_at);
        if (resolved.length === 0) return '-';

        const totalHours = resolved.reduce((sum, t) => {
            const hours = (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            return sum + hours;
        }, 0);

        const avgHours = totalHours / resolved.length;
        if (avgHours < 1) return Math.round(avgHours * 60) + ' min';
        if (avgHours < 24) return avgHours.toFixed(1) + ' horas';
        return (avgHours / 24).toFixed(1) + ' dias';
    }

    calculateAvgFirstResponseTime(data) {
        const responded = data.filter(t => t.stats_first_responded_at && t.created_at);
        if (responded.length === 0) return '-';

        const totalHours = responded.reduce((sum, t) => {
            const hours = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            return sum + hours;
        }, 0);

        const avgHours = totalHours / responded.length;
        if (avgHours < 1) return Math.round(avgHours * 60) + ' min';
        if (avgHours < 24) return avgHours.toFixed(1) + ' horas';
        return (avgHours / 24).toFixed(1) + ' dias';
    }

    // ========== EXPORT METHODS ==========
    async exportPDF() {
        const data = this.filterData();
        if (data.length === 0) {
            alert('Por favor, gere um relatório primeiro antes de exportar.');
            return;
        }

        // Show loading indicator
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'pdfLoadingOverlay';
        loadingOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);';
        loadingOverlay.innerHTML = `
            <div style="background:white;border-radius:16px;padding:2.5rem 3rem;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="width:48px;height:48px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem;"></div>
                <div style="font-size:1.1rem;font-weight:600;color:#1e1e2e;">Gerando PDF...</div>
                <div style="font-size:0.85rem;color:#6b7280;margin-top:0.5rem;">Aguarde enquanto o relatório é preparado</div>
            </div>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        `;
        document.body.appendChild(loadingOverlay);

        try {
            await this._loadPDFLibraries();

            const report = this.reportTypes.find(r => r.id === this.selectedReport);
            const reportTitle = report?.name || 'Relatório';
            const reportColor = report?.color || '#3b82f6';
            const dateStr = new Date().toLocaleDateString('pt-BR');
            const timeStr = new Date().toLocaleTimeString('pt-BR');
            const filterSummary = this.getFilterSummary();

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let y = 0;
            let pageNum = 1;

            // Helper functions
            const addPage = () => {
                pdf.addPage();
                pageNum++;
                y = margin;
                drawHeader();
            };

            const checkPageBreak = (neededHeight) => {
                if (y + neededHeight > pageHeight - 25) {
                    drawFooter();
                    addPage();
                    return true;
                }
                return false;
            };

            const mode = this.getDataMode();
            const modeText = mode === 'tags' ? 'Modo: Tags/Acompanhamento' : 'Modo: Tratativa';

            const drawHeader = () => {
                const barColors = this._hexToRgb(reportColor);
                pdf.setFillColor(barColors.r, barColors.g, barColors.b);
                pdf.rect(0, 0, pageWidth, 5, 'F');
                
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.setTextColor(30, 30, 46);
                pdf.text(reportTitle, margin, 15);
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Periodo: ${filterSummary}  |  ${data.length} tickets`, margin, 21);
                pdf.text(`${modeText}  |  Gerado em ${dateStr} as ${timeStr}`, margin, 26);
                
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text(`Pagina ${pageNum}`, pageWidth - margin, 15, { align: 'right' });
                
                pdf.setDrawColor(200, 200, 200);
                pdf.line(margin, 30, pageWidth - margin, 30);
                y = 38;
            };

            const drawFooter = () => {
                pdf.setDrawColor(200, 200, 200);
                pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7);
                pdf.setTextColor(150, 150, 150);
                pdf.text('Sistema de Atendimento Tryvia - Relatorio gerado automaticamente', margin, pageHeight - 10);
                pdf.text(`${dateStr} ${timeStr}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            };

            const drawCard = (x, w, label, value, color) => {
                const cardH = 22;
                checkPageBreak(cardH + 5);
                
                pdf.setFillColor(248, 250, 252);
                pdf.roundedRect(x, y, w, cardH, 3, 3, 'F');
                
                const rgb = this._hexToRgb(color);
                pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                pdf.roundedRect(x, y, 4, cardH, 2, 2, 'F');
                
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(16);
                pdf.setTextColor(30, 30, 46);
                pdf.text(String(value), x + 10, y + 10);
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(label, x + 10, y + 17);
            };

            const drawSectionTitle = (title) => {
                checkPageBreak(15);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(11);
                pdf.setTextColor(30, 30, 46);
                pdf.text(title, margin, y);
                y += 8;
            };

            const drawBarChart = (items, maxValue, showPercent = false) => {
                const barHeight = 8;
                const spacing = 12;
                const labelWidth = 50;
                const barWidth = contentWidth - labelWidth - 30;
                
                items.forEach(item => {
                    checkPageBreak(spacing + 2);
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(60, 60, 60);
                    const shortLabel = item.label.length > 18 ? item.label.substring(0, 16) + '..' : item.label;
                    pdf.text(shortLabel, margin, y + 5);
                    
                    pdf.setFillColor(230, 230, 235);
                    pdf.roundedRect(margin + labelWidth, y, barWidth, barHeight, 2, 2, 'F');
                    
                    const fillW = maxValue > 0 ? (item.value / maxValue) * barWidth : 0;
                    if (fillW > 0) {
                        const rgb = this._hexToRgb(item.color || '#3b82f6');
                        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                        pdf.roundedRect(margin + labelWidth, y, Math.max(fillW, 4), barHeight, 2, 2, 'F');
                    }
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(8);
                    pdf.setTextColor(30, 30, 46);
                    const valueText = showPercent ? `${item.value}%` : String(item.value);
                    pdf.text(valueText, margin + labelWidth + barWidth + 3, y + 5);
                    
                    y += spacing;
                });
            };

            const drawTable = (headers, rows, colWidths) => {
                const rowHeight = 8;
                const headerHeight = 10;
                
                checkPageBreak(headerHeight + rowHeight * Math.min(rows.length, 3));
                
                pdf.setFillColor(240, 242, 245);
                pdf.rect(margin, y, contentWidth, headerHeight, 'F');
                
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(7);
                pdf.setTextColor(80, 80, 80);
                let xPos = margin + 2;
                headers.forEach((h, i) => {
                    pdf.text(h, xPos, y + 6);
                    xPos += colWidths[i];
                });
                y += headerHeight;
                
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(50, 50, 50);
                
                rows.forEach((row, rowIdx) => {
                    if (checkPageBreak(rowHeight + 2)) {
                        pdf.setFillColor(240, 242, 245);
                        pdf.rect(margin, y, contentWidth, headerHeight, 'F');
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(7);
                        pdf.setTextColor(80, 80, 80);
                        let xP = margin + 2;
                        headers.forEach((h, i) => {
                            pdf.text(h, xP, y + 6);
                            xP += colWidths[i];
                        });
                        y += headerHeight;
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(50, 50, 50);
                    }
                    
                    if (rowIdx % 2 === 1) {
                        pdf.setFillColor(250, 250, 252);
                        pdf.rect(margin, y, contentWidth, rowHeight, 'F');
                    }
                    
                    xPos = margin + 2;
                    row.forEach((cell, i) => {
                        const cellText = String(cell || '-').substring(0, Math.floor(colWidths[i] / 2));
                        pdf.text(cellText, xPos, y + 5);
                        xPos += colWidths[i];
                    });
                    y += rowHeight;
                });
                y += 5;
            };

            // ===== START BUILDING PDF - CONTEÚDO ESPECÍFICO POR RELATÓRIO =====
            drawHeader();

            const cardW = (contentWidth - 15) / 4;
            const total = data.length;
            const pending = data.filter(t => ![4, 5].includes(Number(t.status))).length;
            const resolved = data.filter(t => [4, 5].includes(Number(t.status))).length;

            // ========== RELATÓRIO: TEMPO DE RESOLUÇÃO ==========
            if (this.selectedReport === 'resolution_time') {
                const ignoreTypes = new Set(['melhoria', 'melhoria api', 'melhoria app motorista', 'melhoria bi', 'melhoria etrip', 'melhoria optz', 'melhoria sing', 'melhoria telemetria', 'melhoria yuv', 'projeto', 'projeto api', 'projeto app motorista', 'projeto bi', 'projeto etrip', 'projeto optz', 'projeto sing', 'projeto telemetria', 'projeto yuv', 'project']);
                
                const resolvedTickets = data.filter(t => {
                    if (![4, 5].includes(Number(t.status))) return false;
                    const typeNorm = (t.type || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
                    if (ignoreTypes.has(typeNorm)) return false;
                    const resolvedAt = t.stats_resolved_at || t.stats_closed_at || t.resolved_at || t.closed_at;
                    if (!resolvedAt || !t.created_at) return false;
                    const hours = (new Date(resolvedAt) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return hours > 0 && hours <= 720;
                });

                const entityField = mode === 'tags' ? 'cf_grupo_tratativa' : 'cf_tratativa';
                const byPerson = new Map();
                resolvedTickets.forEach(t => {
                    const resolvedAt = t.stats_resolved_at || t.stats_closed_at || t.resolved_at || t.closed_at;
                    const hours = (new Date(resolvedAt) - new Date(t.created_at)) / (1000 * 60 * 60);
                    const persons = t[entityField] ? t[entityField].split(/[,;\/]/).map(e => e.trim()).filter(e => e) : ['Sem Responsavel'];
                    persons.forEach(person => {
                        if (!byPerson.has(person)) byPerson.set(person, []);
                        byPerson.get(person).push(hours);
                    });
                });

                const personStats = Array.from(byPerson.entries()).map(([name, times]) => {
                    times.sort((a, b) => a - b);
                    const avg = times.reduce((a, b) => a + b, 0) / times.length;
                    return { name, avg, min: times[0], max: times[times.length - 1], median: times[Math.floor(times.length / 2)], count: times.length };
                }).sort((a, b) => a.avg - b.avg);

                const allTimes = resolvedTickets.map(t => {
                    const r = t.stats_resolved_at || t.stats_closed_at || t.resolved_at || t.closed_at;
                    return (new Date(r) - new Date(t.created_at)) / (1000 * 60 * 60);
                });
                const globalAvg = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
                const globalMin = allTimes.length > 0 ? Math.min(...allTimes) : 0;
                const globalMax = allTimes.length > 0 ? Math.max(...allTimes) : 0;

                const formatTime = (h) => h < 1 ? `${Math.round(h * 60)} min` : h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
                const getColor = (h) => h <= 24 ? '#10b981' : h <= 48 ? '#f59e0b' : '#ef4444';

                // KPIs específicos de tempo
                drawCard(margin, cardW, 'Tickets Analisados', resolvedTickets.length, '#6366f1');
                drawCard(margin + cardW + 5, cardW, 'Tempo Medio Global', formatTime(globalAvg), getColor(globalAvg));
                drawCard(margin + (cardW + 5) * 2, cardW, 'Mais Rapido', formatTime(globalMin), '#10b981');
                drawCard(margin + (cardW + 5) * 3, cardW, 'Mais Lento', formatTime(globalMax), '#ef4444');
                y += 30;

                // Faixas de tempo
                const within24h = personStats.filter(p => p.avg <= 24).length;
                const between24and48 = personStats.filter(p => p.avg > 24 && p.avg <= 48).length;
                const above48h = personStats.filter(p => p.avg > 48).length;
                
                drawSectionTitle('Distribuicao por Faixa de Tempo');
                const faixaItems = [
                    { label: 'Dentro de 24h', value: within24h, color: '#10b981' },
                    { label: 'Entre 24h e 48h', value: between24and48, color: '#f59e0b' },
                    { label: 'Acima de 48h', value: above48h, color: '#ef4444' }
                ];
                drawBarChart(faixaItems, Math.max(...faixaItems.map(i => i.value), 1));
                y += 10;

                // Ranking de tempo de resolução (com MEDIANA e STATUS)
                drawSectionTitle(`Ranking: Tempo de Resolucao por ${mode === 'tags' ? 'Time' : 'Pessoa'}`);
                const timeRows = personStats.slice(0, 20).map((p, i) => [
                    i < 3 ? ['1o', '2o', '3o'][i] : (i + 1) + 'o',
                    p.name.substring(0, 16),
                    formatTime(p.avg),
                    formatTime(p.min),
                    formatTime(p.max),
                    formatTime(p.median),
                    p.count,
                    p.avg <= 24 ? 'OK' : p.avg <= 48 ? 'ALERTA' : 'CRIT'
                ]);
                drawTable(['#', mode === 'tags' ? 'TIME' : 'PESSOA', 'MEDIO', 'MIN', 'MAX', 'MEDIANA', 'QTD', 'STATUS'], timeRows, [12, 40, 22, 20, 20, 22, 15, 18]);
                y += 5;

                // Top 5 Mais Rápidos
                drawSectionTitle('Top 5 Mais Rapidos');
                const top5Fast = personStats.slice(0, 5).map((p, i) => [
                    ['1o', '2o', '3o', '4o', '5o'][i],
                    p.name.substring(0, 25),
                    formatTime(p.avg),
                    p.count + ' tickets'
                ]);
                drawTable(['#', 'PESSOA', 'TEMPO MEDIO', 'VOLUME'], top5Fast, [15, 70, 40, 40]);
                y += 5;

                // Top 5 Mais Lentos
                drawSectionTitle('Top 5 Mais Lentos (Oportunidade de Melhoria)');
                const top5Slow = personStats.slice(-5).reverse().map((p, i) => [
                    ['1o', '2o', '3o', '4o', '5o'][i],
                    p.name.substring(0, 25),
                    formatTime(p.avg),
                    p.count + ' tickets'
                ]);
                drawTable(['#', 'PESSOA', 'TEMPO MEDIO', 'VOLUME'], top5Slow, [15, 70, 40, 40]);
                y += 5;

                // Legenda
                checkPageBreak(20);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.setTextColor(30, 30, 46);
                pdf.text('Como Interpretar:', margin, y);
                y += 5;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(16, 185, 129);
                pdf.text('Verde (<24h): Excelente', margin, y);
                pdf.setTextColor(245, 158, 11);
                pdf.text('Amarelo (24-48h): Aceitavel', margin + 45, y);
                pdf.setTextColor(239, 68, 68);
                pdf.text('Vermelho (>48h): Atencao necessaria', margin + 95, y);
                y += 8;

            // ========== RELATÓRIO: PERFORMANCE ==========
            } else if (this.selectedReport === 'performance') {
                const agentStats = {};
                data.forEach(t => {
                    const agent = this.getResponsavel(t) || 'Sem Responsavel';
                    if (!agentStats[agent]) agentStats[agent] = { total: 0, resolved: 0, times: [] };
                    agentStats[agent].total++;
                    if ([4, 5].includes(Number(t.status))) {
                        agentStats[agent].resolved++;
                        const r = t.stats_resolved_at || t.stats_closed_at;
                        if (r && t.created_at) {
                            agentStats[agent].times.push((new Date(r) - new Date(t.created_at)) / (1000 * 60 * 60));
                        }
                    }
                });
                const agents = Object.entries(agentStats).map(([name, s]) => ({
                    name, total: s.total, resolved: s.resolved, pending: s.total - s.resolved,
                    rate: s.total > 0 ? (s.resolved / s.total) * 100 : 0,
                    avgHours: s.times.length > 0 ? s.times.reduce((a, b) => a + b, 0) / s.times.length : null
                })).sort((a, b) => b.total - a.total);

                const totalAgents = agents.length;
                const avgPerAgent = totalAgents > 0 ? Math.round(total / totalAgents) : 0;
                const bestRate = agents.length > 0 ? Math.max(...agents.filter(a => a.total >= 3).map(a => a.rate)) : 0;
                const avgRate = agents.length > 0 ? (agents.reduce((s, a) => s + a.rate, 0) / agents.length).toFixed(0) : 0;

                // Identificar destaques
                const topByVolume = agents[0];
                const topByRate = [...agents].filter(a => a.total >= 5).sort((a, b) => b.rate - a.rate)[0];
                const topBySpeed = [...agents].filter(a => a.avgHours).sort((a, b) => a.avgHours - b.avgHours)[0];

                // DESTAQUES DA EQUIPE
                drawSectionTitle('Destaques da Equipe');
                checkPageBreak(25);
                const destW = (contentWidth - 10) / 3;
                if (topByVolume) {
                    pdf.setFillColor(255, 215, 0, 0.1);
                    pdf.roundedRect(margin, y, destW, 22, 3, 3, 'F');
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(255, 215, 0);
                    pdf.text('Maior Volume', margin + 5, y + 8);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(60, 60, 60);
                    pdf.text(topByVolume.name.substring(0, 15), margin + 5, y + 15);
                    pdf.text(topByVolume.total + ' tickets', margin + 5, y + 20);
                }
                if (topByRate) {
                    pdf.setFillColor(16, 185, 129, 0.1);
                    pdf.roundedRect(margin + destW + 5, y, destW, 22, 3, 3, 'F');
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(16, 185, 129);
                    pdf.text('Melhor Eficiencia', margin + destW + 10, y + 8);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(60, 60, 60);
                    pdf.text(topByRate.name.substring(0, 15), margin + destW + 10, y + 15);
                    pdf.text(topByRate.rate.toFixed(0) + '% resolucao', margin + destW + 10, y + 20);
                }
                if (topBySpeed) {
                    pdf.setFillColor(59, 130, 246, 0.1);
                    pdf.roundedRect(margin + (destW + 5) * 2, y, destW, 22, 3, 3, 'F');
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(59, 130, 246);
                    pdf.text('Mais Rapido', margin + (destW + 5) * 2 + 5, y + 8);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(60, 60, 60);
                    pdf.text(topBySpeed.name.substring(0, 15), margin + (destW + 5) * 2 + 5, y + 15);
                    const spTime = topBySpeed.avgHours < 24 ? topBySpeed.avgHours.toFixed(1) + 'h' : (topBySpeed.avgHours / 24).toFixed(1) + 'd';
                    pdf.text(spTime + ' media', margin + (destW + 5) * 2 + 5, y + 20);
                }
                y += 30;

                // KPIs de performance
                drawCard(margin, cardW, 'Agentes Ativos', totalAgents, '#3b82f6');
                drawCard(margin + cardW + 5, cardW, 'Media/Agente', avgPerAgent, '#8b5cf6');
                drawCard(margin + (cardW + 5) * 2, cardW, 'Melhor Eficiencia', bestRate.toFixed(0) + '%', '#10b981');
                drawCard(margin + (cardW + 5) * 3, cardW, 'Eficiencia Media', avgRate + '%', '#f59e0b');
                y += 30;

                // Ranking completo com STATUS
                drawSectionTitle('Ranking Completo de Agentes');
                const getStatus = (rate) => rate >= 80 ? 'EXCEL' : rate >= 60 ? 'BOM' : rate >= 40 ? 'REG' : 'ATEN';
                const perfRows = agents.slice(0, 20).map((a, i) => [
                    i < 3 ? ['1o', '2o', '3o'][i] : (i + 1) + 'o',
                    a.name.substring(0, 14),
                    a.total,
                    a.resolved,
                    a.pending,
                    a.rate.toFixed(0) + '%',
                    a.avgHours ? (a.avgHours < 24 ? a.avgHours.toFixed(1) + 'h' : (a.avgHours / 24).toFixed(1) + 'd') : '-',
                    getStatus(a.rate)
                ]);
                drawTable(['#', mode === 'tags' ? 'TIME' : 'PESSOA', 'TOT', 'RES', 'PEND', 'TAXA', 'TEMPO', 'STATUS'], perfRows, [12, 38, 18, 18, 18, 20, 22, 22]);
                y += 5;

                // Legenda de status
                checkPageBreak(15);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.setTextColor(30, 30, 46);
                pdf.text('Legenda:', margin, y);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(16, 185, 129);
                pdf.text('EXCEL (>=80%)', margin + 20, y);
                pdf.setTextColor(59, 130, 246);
                pdf.text('BOM (>=60%)', margin + 55, y);
                pdf.setTextColor(245, 158, 11);
                pdf.text('REG (>=40%)', margin + 85, y);
                pdf.setTextColor(239, 68, 68);
                pdf.text('ATEN (<40%)', margin + 115, y);
                y += 8;

            // ========== RELATÓRIO: SLA ==========
            } else if (this.selectedReport === 'sla') {
                const slaOk = data.filter(t => !t.fr_escalated && t.fr_due_by).length;
                const slaTotal = data.filter(t => t.fr_due_by).length;
                const slaRate = slaTotal > 0 ? (slaOk / slaTotal) * 100 : 100;
                const violations = data.filter(t => t.fr_escalated);

                // Calcular SLA de resolução
                const resOk = data.filter(t => !t.resolution_escalated && t.resolution_due_by).length;
                const resTotal = data.filter(t => t.resolution_due_by).length;
                const resRate = resTotal > 0 ? (resOk / resTotal) * 100 : 100;

                // Calcular por prioridade
                const byPriority = {};
                data.forEach(t => {
                    if (!t.fr_due_by) return;
                    const p = this.priorityMap[t.priority]?.label || 'Media';
                    if (!byPriority[p]) byPriority[p] = { ok: 0, violated: 0, total: 0 };
                    byPriority[p].total++;
                    if (t.fr_escalated) byPriority[p].violated++;
                    else byPriority[p].ok++;
                });

                // SAÚDE DO SLA
                const slaHealth = slaRate >= 90 ? 'EXCELENTE' : slaRate >= 70 ? 'BOM' : slaRate >= 50 ? 'REGULAR' : 'CRITICO';
                const healthColor = slaRate >= 90 ? '#10b981' : slaRate >= 70 ? '#3b82f6' : slaRate >= 50 ? '#f59e0b' : '#ef4444';
                
                checkPageBreak(35);
                pdf.setFillColor(...this._hexToRgbArray(healthColor + '20'));
                pdf.roundedRect(margin, y, contentWidth, 30, 5, 5, 'F');
                pdf.setDrawColor(...this._hexToRgbArray(healthColor));
                pdf.roundedRect(margin, y, contentWidth, 30, 5, 5, 'S');
                
                // Círculo com porcentagem
                const circleX = margin + 20;
                const circleY = y + 15;
                pdf.setFillColor(...this._hexToRgbArray(healthColor));
                pdf.circle(circleX, circleY, 10, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(255, 255, 255);
                pdf.text(slaRate.toFixed(0) + '%', circleX, circleY + 3, { align: 'center' });
                
                // Texto de saúde
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.setTextColor(...this._hexToRgbArray(healthColor));
                pdf.text('Conformidade SLA: ' + slaHealth, margin + 35, y + 12);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(100, 100, 100);
                const healthMsg = slaHealth === 'EXCELENTE' ? 'Parabens! O SLA esta sendo cumprido de forma exemplar.' :
                                  slaHealth === 'BOM' ? 'O SLA esta bom, mas ha espaco para melhorias.' :
                                  slaHealth === 'REGULAR' ? 'Atencao! O SLA precisa de melhorias significativas.' :
                                  'CRITICO: O SLA esta muito abaixo do esperado!';
                pdf.text(healthMsg, margin + 35, y + 20);
                y += 38;

                // KPIs de SLA (2x2)
                const halfW = (contentWidth - 5) / 2;
                drawCard(margin, halfW, 'SLA 1a Resposta', slaRate.toFixed(1) + '%', slaRate >= 90 ? '#10b981' : slaRate >= 70 ? '#f59e0b' : '#ef4444');
                drawCard(margin + halfW + 5, halfW, 'SLA Resolucao', resRate.toFixed(1) + '%', resRate >= 90 ? '#10b981' : resRate >= 70 ? '#f59e0b' : '#ef4444');
                y += 28;
                drawCard(margin, halfW, 'Dentro do Prazo', slaOk + ' de ' + slaTotal, '#10b981');
                drawCard(margin + halfW + 5, halfW, 'Violacoes', violations.length.toString(), '#ef4444');
                y += 30;

                // SLA por prioridade (tabela)
                drawSectionTitle('SLA por Nivel de Prioridade');
                const prioRows = Object.entries(byPriority).map(([label, s]) => {
                    const rate = s.total > 0 ? ((s.ok / s.total) * 100).toFixed(0) : 100;
                    return [label, s.total, s.ok, s.violated, rate + '%', parseFloat(rate) >= 90 ? 'OK' : parseFloat(rate) >= 70 ? 'ALERTA' : 'CRIT'];
                });
                drawTable(['PRIORIDADE', 'TOTAL', 'OK', 'VIOLADO', 'TAXA', 'STATUS'], prioRows, [35, 25, 25, 28, 25, 25]);
                y += 5;

                // Violações recentes
                if (violations.length > 0) {
                    drawSectionTitle('Tickets com Violacao de SLA (' + violations.length + ')');
                    const violRows = violations.slice(0, 12).map(t => [
                        '#' + t.id,
                        (t.subject || '').substring(0, 28),
                        this.priorityMap[t.priority]?.label || '-',
                        this.getResponsavel(t)?.substring(0, 12) || '-',
                        new Date(t.created_at).toLocaleDateString('pt-BR')
                    ]);
                    drawTable(['ID', 'ASSUNTO', 'PRIOR', 'RESPONSAVEL', 'DATA'], violRows, [20, 58, 25, 38, 25]);
                } else {
                    checkPageBreak(20);
                    pdf.setFillColor(16, 185, 129, 0.1);
                    pdf.roundedRect(margin, y, contentWidth, 18, 3, 3, 'F');
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(16, 185, 129);
                    pdf.text('Nenhuma Violacao de SLA! Parabens!', margin + contentWidth / 2, y + 11, { align: 'center' });
                    y += 22;
                }

                // Legenda explicativa
                checkPageBreak(25);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.setTextColor(100, 100, 100);
                pdf.text('Entendendo as Metricas de SLA:', margin, y);
                y += 5;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7);
                pdf.text('SLA 1a Resposta: Tempo maximo para dar a primeira resposta ao cliente.', margin, y);
                y += 4;
                pdf.text('SLA Resolucao: Tempo maximo para resolver completamente o problema.', margin, y);
                y += 4;
                pdf.text('Meta Ideal: Manter SLA acima de 90% e considerado excelente.', margin, y);
                y += 6;

            // ========== RELATÓRIO: TENDÊNCIAS ==========
            } else if (this.selectedReport === 'trends') {
                const dailyVolume = {};
                data.forEach(t => {
                    const date = new Date(t.created_at).toISOString().split('T')[0];
                    dailyVolume[date] = (dailyVolume[date] || 0) + 1;
                });
                const sortedDays = Object.keys(dailyVolume).sort();
                const avgDaily = sortedDays.length > 0 ? total / sortedDays.length : 0;
                
                const recentDays = sortedDays.slice(-7);
                const olderDays = sortedDays.slice(-14, -7);
                const recentAvg = recentDays.length > 0 ? recentDays.reduce((s, d) => s + dailyVolume[d], 0) / recentDays.length : 0;
                const olderAvg = olderDays.length > 0 ? olderDays.reduce((s, d) => s + dailyVolume[d], 0) / olderDays.length : recentAvg;
                const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
                const projection30d = Math.round(avgDaily * 30);
                const maxDayVolume = Math.max(...Object.values(dailyVolume), 0);

                // KPIs de tendências
                drawCard(margin, cardW, 'Media Diaria', avgDaily.toFixed(1), '#3b82f6');
                drawCard(margin + cardW + 5, cardW, 'Variacao Semanal', (trend >= 0 ? '+' : '') + trend.toFixed(1) + '%', trend > 10 ? '#ef4444' : trend < -10 ? '#10b981' : '#f59e0b');
                drawCard(margin + (cardW + 5) * 2, cardW, 'Projecao 30d', projection30d, '#8b5cf6');
                drawCard(margin + (cardW + 5) * 3, cardW, 'Pico Diario', maxDayVolume, '#ef4444');
                y += 30;

                // Volume por dia da semana
                const dayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
                data.forEach(t => { dayOfWeek[new Date(t.created_at).getDay()]++; });
                const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
                
                drawSectionTitle('Volume por Dia da Semana');
                const dayItems = Object.entries(dayOfWeek).map(([d, v]) => ({
                    label: dayNames[d],
                    value: v,
                    color: v === Math.max(...Object.values(dayOfWeek)) ? '#ef4444' : v === Math.min(...Object.values(dayOfWeek)) ? '#10b981' : '#3b82f6'
                }));
                drawBarChart(dayItems, Math.max(...dayItems.map(i => i.value), 1));
                y += 10;

                // Evolução diária (últimos 14 dias)
                drawSectionTitle('Evolucao Diaria (ultimos dias)');
                const recentVolume = sortedDays.slice(-14).map(d => ({
                    label: d.substring(5),
                    value: dailyVolume[d],
                    color: '#3b82f6'
                }));
                drawBarChart(recentVolume, Math.max(...recentVolume.map(i => i.value), 1));

            // ========== RELATÓRIO: BACKLOG ==========
            } else if (this.selectedReport === 'backlog') {
                const pendingTickets = data.filter(t => ![4, 5].includes(Number(t.status)));
                const now = new Date();
                
                const aging = { '0-3d': 0, '4-7d': 0, '8-14d': 0, '15-30d': 0, '>30d': 0 };
                let totalAge = 0;
                pendingTickets.forEach(t => {
                    const days = Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
                    totalAge += days;
                    if (days <= 3) aging['0-3d']++;
                    else if (days <= 7) aging['4-7d']++;
                    else if (days <= 14) aging['8-14d']++;
                    else if (days <= 30) aging['15-30d']++;
                    else aging['>30d']++;
                });
                const avgAge = pendingTickets.length > 0 ? totalAge / pendingTickets.length : 0;
                const critical = aging['8-14d'] + aging['15-30d'] + aging['>30d'];

                // KPIs de backlog
                drawCard(margin, cardW, 'Idade Media', avgAge.toFixed(1) + 'd', '#8b5cf6');
                drawCard(margin + cardW + 5, cardW, 'Criticos >7d', critical, '#ef4444');
                drawCard(margin + (cardW + 5) * 2, cardW, 'Muito Antigos', aging['>30d'], '#dc2626');
                drawCard(margin + (cardW + 5) * 3, cardW, 'Total Pendente', pendingTickets.length, '#f59e0b');
                y += 30;

                // Distribuição por aging
                drawSectionTitle('Distribuicao por Idade (Aging)');
                const agingColors = ['#10b981', '#84cc16', '#f59e0b', '#ef4444', '#dc2626'];
                const agingItems = Object.entries(aging).map(([label, value], i) => ({
                    label,
                    value,
                    color: agingColors[i]
                }));
                drawBarChart(agingItems, Math.max(...agingItems.map(i => i.value), 1));
                y += 10;

                // Tickets críticos
                if (critical > 0) {
                    drawSectionTitle('Tickets Criticos (>7 dias)');
                    const criticalTickets = pendingTickets
                        .map(t => ({ ...t, days: Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24)) }))
                        .filter(t => t.days > 7)
                        .sort((a, b) => b.days - a.days)
                        .slice(0, 15);
                    const critRows = criticalTickets.map(t => [
                        '#' + t.id,
                        (t.subject || '').substring(0, 28),
                        t.days + 'd',
                        this.priorityMap[t.priority]?.label || '-',
                        this.getResponsavel(t)?.substring(0, 12) || '-'
                    ]);
                    drawTable(['ID', 'ASSUNTO', 'IDADE', 'PRIOR', 'RESP'], critRows, [20, 60, 20, 25, 40]);
                }

            // ========== RELATÓRIO: EXECUTIVO (padrão) ==========
            } else {
                const resRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0';
                const slaOk = data.filter(t => !t.fr_escalated && t.fr_due_by).length;
                const slaTotal = data.filter(t => t.fr_due_by).length;
                const slaRate = slaTotal > 0 ? ((slaOk / slaTotal) * 100).toFixed(1) : '100';

                // KPIs executivos
                drawCard(margin, cardW, 'Total Tickets', total, '#3b82f6');
                drawCard(margin + cardW + 5, cardW, 'Taxa Resolucao', resRate + '%', parseFloat(resRate) >= 80 ? '#10b981' : '#f59e0b');
                drawCard(margin + (cardW + 5) * 2, cardW, 'SLA 1a Resposta', slaRate + '%', parseFloat(slaRate) >= 90 ? '#10b981' : '#f59e0b');
                drawCard(margin + (cardW + 5) * 3, cardW, 'Pendentes', pending, '#f59e0b');
                y += 30;

                // Status distribution
                drawSectionTitle('Distribuicao por Status');
                const statusCounts = {};
                data.forEach(t => { statusCounts[this.statusMap[t.status]?.label || 'Outro'] = (statusCounts[this.statusMap[t.status]?.label || 'Outro'] || 0) + 1; });
                const statusItems = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({
                    label, value, color: this.statusMap[Object.keys(this.statusMap).find(k => this.statusMap[k].label === label)]?.color || '#6b7280'
                }));
                drawBarChart(statusItems, Math.max(...statusItems.map(i => i.value), 1));
                y += 10;

                // Top problemas (keywords)
                drawSectionTitle('Principais Problemas Detectados');
                const keywords = {};
                const keywordList = ['erro', 'bug', 'lento', 'travando', 'nao funciona', 'problema', 'urgente', 'critico', 'falha', 'parado'];
                data.forEach(t => {
                    const text = ((t.subject || '') + ' ' + (t.description_text || '')).toLowerCase();
                    keywordList.forEach(kw => { if (text.includes(kw)) keywords[kw] = (keywords[kw] || 0) + 1; });
                });
                const topProblems = Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({
                    label, value, color: value > 10 ? '#ef4444' : value > 5 ? '#f59e0b' : '#3b82f6'
                }));
                if (topProblems.length > 0) {
                    drawBarChart(topProblems, Math.max(...topProblems.map(i => i.value), 1));
                }
            }

            // Draw final footer
            drawFooter();

            // Save
            const filename = `relatorio_${this.selectedReport}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(filename);
            console.log(`PDF exportado: ${filename}`);

        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao gerar o PDF. Verifique o console.');
        } finally {
            const overlay = document.getElementById('pdfLoadingOverlay');
            if (overlay) overlay.remove();
        }
    }

    async _loadPDFLibraries() {
        if (!window.jspdf) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                s.onload = resolve;
                s.onerror = () => reject(new Error('Falha ao carregar jsPDF'));
                document.head.appendChild(s);
            });
            await new Promise(r => setTimeout(r, 100));
        }
    }

    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 59, g: 130, b: 246 };
    }

    _hexToRgbArray(hex) {
        const clean = hex.replace('#', '').substring(0, 6);
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [59, 130, 246];
    }

    async exportExcel() {
        const data = this.filterData();
        if (data.length === 0) {
            alert('Nenhum dado para exportar. Gere um relatório primeiro.');
            return;
        }

        // Preparar dados
        const headers = ['ID', 'Assunto', 'Status', 'Prioridade', 'Criado em', 'Resolvido em', 'Agente', 'Time', 'Empresa', 'SLA Resposta'];
        const rows = data.map(t => [
            t.id,
            (t.subject || '').replace(/"/g, '""'),
            this.statusMap[t.status]?.label || t.status,
            this.priorityMap[t.priority]?.label || t.priority,
            new Date(t.created_at).toLocaleString('pt-BR'),
            t.stats_resolved_at ? new Date(t.stats_resolved_at).toLocaleString('pt-BR') : '',
            t.responder_name || '',
            t.cf_tratativa || '',
            t.company_name || '',
            t.fr_escalated ? 'Violado' : 'Dentro'
        ]);

        // Tentar usar SheetJS se disponível, senão criar XLSX manualmente
        if (window.XLSX) {
            this.exportWithSheetJS(headers, rows);
        } else {
            // Carregar SheetJS dinamicamente
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
            script.onload = () => this.exportWithSheetJS(headers, rows);
            script.onerror = () => this.exportAsCSV(headers, rows); // Fallback para CSV
            document.head.appendChild(script);
        }
    }

    exportWithSheetJS(headers, rows) {
        try {
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

            // Ajustar largura das colunas
            ws['!cols'] = [
                { wch: 10 },  // ID
                { wch: 50 },  // Assunto
                { wch: 15 },  // Status
                { wch: 12 },  // Prioridade
                { wch: 18 },  // Criado em
                { wch: 18 },  // Resolvido em
                { wch: 20 },  // Agente
                { wch: 15 },  // Time
                { wch: 20 },  // Empresa
                { wch: 12 }   // SLA
            ];

            const wb = XLSX.utils.book_new();
            const reportName = this.reportTypes.find(r => r.id === this.selectedReport)?.title || 'Relatório';
            XLSX.utils.book_append_sheet(wb, ws, reportName.substring(0, 31));

            const filename = `relatorio_${this.selectedReport}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

            console.log(`✅ Exportado: ${filename} (${rows.length} registros)`);
        } catch (e) {
            console.error('Erro ao exportar XLSX:', e);
            this.exportAsCSV(headers, rows);
        }
    }

    exportAsCSV(headers, rows) {
        const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_${this.selectedReport}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('📄 Exportado como CSV (fallback)');
    }
}

// Initialize
const reportsV3 = new ReportsModuleV3();
window.reportsModuleV3 = reportsV3;
