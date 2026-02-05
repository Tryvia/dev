/**
 * Reports Module V2 - Sistema Premium de Relatórios
 * Módulo completo com análises avançadas, gráficos e exportação
 */

class ReportsModuleV2 {
    constructor() {
        this.containerId = 'reports-container';
        this.selectedType = 'executive';
        this.selectedPeriod = '30';
        this.selectedTeam = 'all';
        this.startDate = null;
        this.endDate = null;
        this.filteredData = [];
        this.reportResult = null;
        
        // Paleta premium
        this.colors = {
            primary: '#6366f1',
            secondary: '#8b5cf6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4',
            text: '#e4e4e7',
            textMuted: '#a1a1aa',
            bg: '#0a0a1a',
            card: 'rgba(255, 255, 255, 0.03)',
            border: 'rgba(255, 255, 255, 0.08)',
            chartColors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
        };
        
        // Status do Freshdesk
        this.statusMap = {
            2: { label: 'Aberto', group: 'open', color: '#3b82f6' },
            3: { label: 'Pendente', group: 'pending', color: '#f59e0b' },
            4: { label: 'Resolvido', group: 'resolved', color: '#10b981' },
            5: { label: 'Fechado', group: 'closed', color: '#6b7280' },
            6: { label: 'Em Homologação', group: 'validation', color: '#8b5cf6' },
            7: { label: 'Aguardando Cliente', group: 'waiting', color: '#f59e0b' },
            8: { label: 'Em Tratativa', group: 'progress', color: '#06b6d4' },
            10: { label: 'Em Análise', group: 'progress', color: '#06b6d4' },
            11: { label: 'Interno', group: 'progress', color: '#64748b' },
            12: { label: 'Aguardando Publicar HML', group: 'waiting', color: '#3b82f6' },
            13: { label: 'Aguardando Publicar PROD', group: 'waiting', color: '#8b5cf6' },
            14: { label: 'MVP', group: 'special', color: '#ec4899' },
            15: { label: 'Validação-Atendimento', group: 'validation', color: '#f97316' },
            16: { label: 'Aguardando Parceiros', group: 'waiting', color: '#a855f7' },
            17: { label: 'Pausado', group: 'pending', color: '#64748b' },
            18: { label: 'Validação-CS', group: 'validation', color: '#f97316' },
            19: { label: 'Levantamento de Esforço', group: 'progress', color: '#6366f1' },
            20: { label: 'Em Fila DEV', group: 'progress', color: '#ef4444' },
            21: { label: 'Em Produção', group: 'deployed', color: '#10b981' }
        };
        
        // Tipos de relatório
        this.reportTypes = [
            { id: 'executive', name: 'Resumo Executivo', icon: '📊', desc: 'Visão geral com KPIs e insights estratégicos' },
            { id: 'performance', name: 'Performance', icon: '🏆', desc: 'Ranking de agentes e métricas individuais' },
            { id: 'sla', name: 'Análise de SLA', icon: '⏱️', desc: 'Tempo de resposta e resolução por prioridade' },
            { id: 'trends', name: 'Tendências', icon: '📈', desc: 'Evolução temporal e projeções' },
            { id: 'teams', name: 'Comparativo Times', icon: '👥', desc: 'Benchmark entre equipes' },
            { id: 'backlog', name: 'Backlog & Aging', icon: '📋', desc: 'Tickets parados e análise de aging' },
            { id: 'priority', name: 'Prioridades', icon: '🎯', desc: 'Distribuição e tempo por prioridade' },
            { id: 'quality', name: 'Qualidade', icon: '⭐', desc: 'Score de qualidade e satisfação' }
        ];
    }
    
    // Obter dados de todas as fontes
    getData() {
        if (window.allTicketsCache?.length > 0) return window.allTicketsCache;
        if (window.BICharts?.cache?.tickets?.length > 0) return window.BICharts.cache.tickets;
        if (window.biAnalytics?.allData?.length > 0) return window.biAnalytics.allData;
        if (window.processedData?.length > 0) return window.processedData;
        return [];
    }
    
    // Renderizar interface
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        // Configurar datas padrão
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        if (!this.startDate) this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
        if (!this.endDate) this.endDate = today.toISOString().split('T')[0];
        
        container.innerHTML = this.buildHTML();
        this.setupEventListeners();
        this.updateTeamOptions();
    }
    
    buildHTML() {
        return `
        <div class="reports-premium">
            <div class="reports-header">
                <div>
                    <h1>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        Relatórios
                    </h1>
                    <p>Gere relatórios personalizados com análises detalhadas</p>
                </div>
                <button class="btn-generate-report" onclick="reportsModuleV2.generateReport()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    Gerar Relatório
                </button>
            </div>
            
            <div class="reports-layout">
                ${this.buildSidebar()}
                ${this.buildMainArea()}
            </div>
        </div>`;
    }
    
    buildSidebar() {
        return `
        <div class="reports-sidebar">
            <!-- Tipos de Relatório -->
            <div class="reports-section">
                <div class="reports-section-title">📑 Tipo de Relatório</div>
                ${this.reportTypes.map(type => `
                    <div class="report-type-card ${type.id === this.selectedType ? 'active' : ''}" 
                         data-type="${type.id}" onclick="reportsModuleV2.selectType('${type.id}')">
                        <div class="icon">${type.icon}</div>
                        <div class="info">
                            <h4>${type.name}</h4>
                            <p>${type.desc}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Filtros -->
            <div class="reports-section">
                <div class="reports-section-title">🔍 Filtros</div>
                
                <!-- Período -->
                <div class="filter-group">
                    <label class="filter-label">Período</label>
                    <div class="period-buttons">
                        <button class="period-btn ${this.selectedPeriod === '7' ? 'active' : ''}" 
                                onclick="reportsModuleV2.setPeriod('7')">7 dias</button>
                        <button class="period-btn ${this.selectedPeriod === '30' ? 'active' : ''}" 
                                onclick="reportsModuleV2.setPeriod('30')">30 dias</button>
                        <button class="period-btn ${this.selectedPeriod === '90' ? 'active' : ''}" 
                                onclick="reportsModuleV2.setPeriod('90')">90 dias</button>
                        <button class="period-btn ${this.selectedPeriod === '180' ? 'active' : ''}" 
                                onclick="reportsModuleV2.setPeriod('180')">6 meses</button>
                        <button class="period-btn ${this.selectedPeriod === '365' ? 'active' : ''}" 
                                onclick="reportsModuleV2.setPeriod('365')">1 ano</button>
                        <button class="period-btn ${this.selectedPeriod === 'custom' ? 'active' : ''}" 
                                onclick="reportsModuleV2.setPeriod('custom')">Custom</button>
                    </div>
                    <div class="date-range-container" id="customDateRange" style="display: ${this.selectedPeriod === 'custom' ? 'flex' : 'none'};">
                        <input type="date" class="date-input" id="reportStartDate" value="${this.startDate}" 
                               onchange="reportsModuleV2.startDate = this.value">
                        <input type="date" class="date-input" id="reportEndDate" value="${this.endDate}"
                               onchange="reportsModuleV2.endDate = this.value">
                    </div>
                </div>
                
                <!-- Time -->
                <div class="filter-group">
                    <label class="filter-label">Time</label>
                    <select class="filter-select" id="reportTeamFilter" onchange="reportsModuleV2.selectedTeam = this.value">
                        <option value="all">Todos os times</option>
                    </select>
                </div>
            </div>
            
            <button class="btn-apply-filters" onclick="reportsModuleV2.generateReport()">
                🔄 Aplicar e Gerar
            </button>
        </div>`;
    }
    
    buildMainArea() {
        return `
        <div class="reports-main" id="reportsMainContent">
            <div class="empty-state">
                <div class="icon">📊</div>
                <h3>Selecione um tipo de relatório</h3>
                <p>Escolha o tipo de relatório na barra lateral e clique em "Gerar Relatório"</p>
            </div>
        </div>`;
    }
    
    setupEventListeners() {
        // Event listeners serão configurados aqui se necessário
    }
    
    updateTeamOptions() {
        const select = document.getElementById('reportTeamFilter');
        if (!select) return;
        
        const data = this.getData();
        const teams = new Set();
        
        data.forEach(t => {
            const team = t.cf_grupo_tratativa || t.group_name;
            if (team) {
                team.split(/[,;\/]/).forEach(g => {
                    const trimmed = g.trim();
                    if (trimmed) teams.add(trimmed);
                });
            }
        });
        
        select.innerHTML = '<option value="all">Todos os times</option>' +
            Array.from(teams).sort().map(t => `<option value="${t}">${t}</option>`).join('');
    }
    
    selectType(type) {
        this.selectedType = type;
        document.querySelectorAll('.report-type-card').forEach(card => {
            card.classList.toggle('active', card.dataset.type === type);
        });
    }
    
    setPeriod(period) {
        this.selectedPeriod = period;
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(period) || 
                (period === 'custom' && btn.textContent === 'Custom'));
        });
        
        const customRange = document.getElementById('customDateRange');
        if (customRange) {
            customRange.style.display = period === 'custom' ? 'flex' : 'none';
        }
        
        if (period !== 'custom') {
            const days = parseInt(period);
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - days);
            this.startDate = start.toISOString().split('T')[0];
            this.endDate = end.toISOString().split('T')[0];
        }
    }
    
    // Filtrar dados
    filterData() {
        let data = this.getData();
        if (!data.length) return [];
        
        // Filtrar por período
        const start = new Date(this.startDate + 'T00:00:00');
        const end = new Date(this.endDate + 'T23:59:59');
        
        data = data.filter(t => {
            const created = new Date(t.created_at);
            return created >= start && created <= end;
        });
        
        // Filtrar por time
        if (this.selectedTeam !== 'all') {
            const teamLower = this.selectedTeam.toLowerCase();
            data = data.filter(t => {
                const team = (t.cf_grupo_tratativa || t.group_name || '').toLowerCase();
                return team.includes(teamLower);
            });
        }
        
        return data;
    }
    
    // Gerar relatório
    generateReport() {
        const data = this.filterData();
        
        if (!data.length) {
            this.showEmptyState('Nenhum dado encontrado', 'Ajuste os filtros ou carregue dados primeiro');
            return;
        }
        
        this.filteredData = data;
        this.reportResult = this.processData(data);
        this.renderReport();
    }
    
    // Processar dados
    processData(data) {
        const total = data.length;
        const closed = data.filter(t => [4, 5].includes(t.status)).length;
        const open = data.filter(t => t.status === 2).length;
        const pending = total - closed - open;
        
        // Métricas de tempo
        let totalResTime = 0, resCount = 0;
        let totalFRTime = 0, frCount = 0;
        const resTimes = [];
        
        data.forEach(t => {
            if (t.resolved_at && t.created_at) {
                const hours = (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000;
                if (hours > 0 && hours < 720) {
                    totalResTime += hours;
                    resCount++;
                    resTimes.push(hours);
                }
            }
            if (t.first_responded_at && t.created_at) {
                const hours = (new Date(t.first_responded_at) - new Date(t.created_at)) / 3600000;
                if (hours > 0 && hours < 168) {
                    totalFRTime += hours;
                    frCount++;
                }
            }
        });
        
        resTimes.sort((a, b) => a - b);
        
        // Por agente - guardar também os tickets de cada agente
        const byAgent = {};
        const ticketsByAgent = {}; // Guardar tickets por agente para consulta
        
        data.forEach(t => {
            const agent = t.cf_tratativa || t.responder_name || 'Não atribuído';
            agent.split(/[,;\/]/).forEach(a => {
                const name = a.trim();
                if (!name) return;
                if (!byAgent[name]) {
                    byAgent[name] = { total: 0, closed: 0, totalTime: 0, timeCount: 0 };
                    ticketsByAgent[name] = [];
                }
                byAgent[name].total++;
                ticketsByAgent[name].push(t); // Guardar referência do ticket
                if ([4, 5].includes(t.status)) {
                    byAgent[name].closed++;
                    if (t.resolved_at && t.created_at) {
                        const hours = (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000;
                        if (hours > 0 && hours < 720) {
                            byAgent[name].totalTime += hours;
                            byAgent[name].timeCount++;
                        }
                    }
                }
            });
        });
        
        // Guardar no módulo para consulta posterior
        this.ticketsByAgent = ticketsByAgent;
        
        // Debug: mostrar período e contagens
        console.log(`📊 Relatório - Período: ${this.startDate} a ${this.endDate}`);
        console.log(`📊 Total tickets filtrados: ${data.length}`);
        Object.entries(byAgent).slice(0, 5).forEach(([name, info]) => {
            console.log(`  - ${name}: ${info.total} tickets (${info.closed} fechados)`);
        });
        
        // Por time - guardar também tickets por time
        const byTeam = {};
        const ticketsByTeam = {};
        data.forEach(t => {
            const team = t.cf_grupo_tratativa || t.group_name || 'Sem time';
            if (!byTeam[team]) {
                byTeam[team] = { total: 0, closed: 0, urgent: 0 };
                ticketsByTeam[team] = [];
            }
            byTeam[team].total++;
            ticketsByTeam[team].push(t);
            if ([4, 5].includes(t.status)) byTeam[team].closed++;
            if (t.priority === 4) byTeam[team].urgent++;
        });
        this.ticketsByTeam = ticketsByTeam;
        
        // Por prioridade
        const byPriority = { 1: 0, 2: 0, 3: 0, 4: 0 };
        data.forEach(t => { if (byPriority[t.priority] !== undefined) byPriority[t.priority]++; });
        
        // Por status
        const byStatus = {};
        data.forEach(t => {
            const s = this.statusMap[t.status]?.label || `Status ${t.status}`;
            byStatus[s] = (byStatus[s] || 0) + 1;
        });
        
        // Por semana
        const byWeek = {};
        data.forEach(t => {
            const d = new Date(t.created_at);
            d.setDate(d.getDate() - d.getDay());
            const key = d.toISOString().split('T')[0];
            byWeek[key] = (byWeek[key] || 0) + 1;
        });
        
        // Tickets parados (>7 dias sem atualização)
        const stale = data.filter(t => {
            if ([4, 5].includes(t.status)) return false;
            const lastUpdate = new Date(t.updated_at || t.created_at);
            return (Date.now() - lastUpdate) / 86400000 > 7;
        });
        
        return {
            total, closed, open, pending,
            closedRate: total > 0 ? (closed / total * 100) : 0,
            avgResTime: resCount > 0 ? totalResTime / resCount : 0,
            avgFRTime: frCount > 0 ? totalFRTime / frCount : 0,
            p50: resTimes.length > 0 ? resTimes[Math.floor(resTimes.length * 0.5)] : 0,
            p90: resTimes.length > 0 ? resTimes[Math.floor(resTimes.length * 0.9)] : 0,
            byAgent, byTeam, byPriority, byStatus, byWeek,
            staleCount: stale.length,
            urgentCount: data.filter(t => t.priority === 4).length,
            highCount: data.filter(t => t.priority === 3).length
        };
    }
    
    // Renderizar relatório
    renderReport() {
        const main = document.getElementById('reportsMainContent');
        if (!main) return;
        
        const r = this.reportResult;
        const reportInfo = this.reportTypes.find(t => t.id === this.selectedType);
        
        main.innerHTML = `
            <!-- KPIs -->
            <div class="kpi-grid">
                ${this.renderKPI('Total', r.total, '#6366f1')}
                ${this.renderKPI('Fechados', r.closed, '#10b981', `${r.closedRate.toFixed(1)}%`)}
                ${this.renderKPI('Abertos', r.open, '#3b82f6')}
                ${this.renderKPI('Pendentes', r.pending, '#f59e0b')}
                ${this.renderKPI('Tempo Médio', this.formatHours(r.avgResTime), '#8b5cf6')}
                ${this.renderKPI('1ª Resposta', this.formatHours(r.avgFRTime), '#06b6d4')}
            </div>
            
            <!-- Conteúdo específico por tipo -->
            ${this.renderReportContent()}
            
            <!-- Insights -->
            ${this.renderInsights()}
            
            <!-- Ações de Exportação -->
            <div class="export-actions">
                <button class="btn-export excel" onclick="reportsModuleV2.exportExcel()">
                    📥 Exportar Excel
                </button>
                <button class="btn-export pdf" onclick="reportsModuleV2.exportPDF()">
                    📄 Exportar PDF
                </button>
                <button class="btn-export print" onclick="window.print()">
                    🖨️ Imprimir
                </button>
            </div>
        `;
        
        // Desenhar gráficos após renderizar
        setTimeout(() => this.drawCharts(), 100);
    }
    
    renderKPI(label, value, color, subtitle = '') {
        return `
        <div class="kpi-card" style="--kpi-color: ${color}">
            <div class="value">${value}</div>
            <div class="label">${label}</div>
            ${subtitle ? `<div class="trend">${subtitle}</div>` : ''}
        </div>`;
    }
    
    formatHours(hours) {
        if (!hours || hours === 0) return '0h';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${hours.toFixed(1)}h`;
        return `${(hours / 24).toFixed(1)}d`;
    }
    
    renderReportContent() {
        switch (this.selectedType) {
            case 'executive': return this.renderExecutive();
            case 'performance': return this.renderPerformance();
            case 'sla': return this.renderSLA();
            case 'trends': return this.renderTrends();
            case 'teams': return this.renderTeams();
            case 'backlog': return this.renderBacklog();
            case 'priority': return this.renderPriority();
            case 'quality': return this.renderQuality();
            default: return this.renderExecutive();
        }
    }
    
    renderExecutive() {
        const r = this.reportResult;
        return `
        <div class="report-content-section">
            <h3>📊 Resumo Executivo</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div class="chart-container">
                    <canvas id="chartStatus" height="250"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="chartPriority" height="250"></canvas>
                </div>
            </div>
        </div>
        <div class="report-content-section">
            <h3>📈 Evolução Semanal</h3>
            <div class="chart-container">
                <canvas id="chartTrend" height="200"></canvas>
            </div>
        </div>`;
    }
    
    renderPerformance() {
        const r = this.reportResult;
        const agents = Object.entries(r.byAgent)
            .map(([name, data]) => ({
                name, ...data,
                rate: data.total > 0 ? (data.closed / data.total * 100) : 0,
                avgTime: data.timeCount > 0 ? data.totalTime / data.timeCount : 0
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
        
        return `
        <div class="report-content-section">
            <h3>🏆 Top 10 Agentes por Volume</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Agente</th>
                        <th>Total</th>
                        <th>Fechados</th>
                        <th>Taxa</th>
                        <th>Tempo Médio</th>
                    </tr>
                </thead>
                <tbody>
                    ${agents.map((a, i) => `
                        <tr>
                            <td style="color: ${i < 3 ? '#fbbf24' : '#a1a1aa'}">${i + 1}°</td>
                            <td>${a.name}</td>
                            <td>${a.total}</td>
                            <td>${a.closed}</td>
                            <td style="color: ${a.rate >= 70 ? '#10b981' : a.rate >= 50 ? '#f59e0b' : '#ef4444'}">${a.rate.toFixed(1)}%</td>
                            <td>${this.formatHours(a.avgTime)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="report-content-section">
            <h3>📊 Distribuição por Agente</h3>
            <div class="chart-container">
                <canvas id="chartAgents" height="300"></canvas>
            </div>
        </div>`;
    }
    
    renderSLA() {
        const r = this.reportResult;
        return `
        <div class="report-content-section">
            <h3>⏱️ Métricas de SLA</h3>
            <div class="kpi-grid">
                ${this.renderKPI('Tempo Médio Resolução', this.formatHours(r.avgResTime), '#8b5cf6')}
                ${this.renderKPI('Percentil 50', this.formatHours(r.p50), '#06b6d4')}
                ${this.renderKPI('Percentil 90', this.formatHours(r.p90), '#f59e0b')}
                ${this.renderKPI('1ª Resposta', this.formatHours(r.avgFRTime), '#10b981')}
            </div>
        </div>
        <div class="report-content-section">
            <h3>📊 Distribuição de Tempo de Resolução</h3>
            <div class="chart-container">
                <canvas id="chartSLA" height="250"></canvas>
            </div>
        </div>`;
    }
    
    renderTrends() {
        return `
        <div class="report-content-section">
            <h3>📈 Evolução Temporal</h3>
            <div class="chart-container">
                <canvas id="chartTrend" height="300"></canvas>
            </div>
        </div>`;
    }
    
    renderTeams() {
        const r = this.reportResult;
        const teams = Object.entries(r.byTeam)
            .map(([name, data]) => ({
                name, ...data,
                rate: data.total > 0 ? (data.closed / data.total * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);
        
        return `
        <div class="report-content-section">
            <h3>👥 Comparativo de Times</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Total</th>
                        <th>Fechados</th>
                        <th>Taxa</th>
                        <th>Urgentes</th>
                    </tr>
                </thead>
                <tbody>
                    ${teams.map(t => `
                        <tr>
                            <td>${t.name}</td>
                            <td>${t.total}</td>
                            <td>${t.closed}</td>
                            <td style="color: ${t.rate >= 70 ? '#10b981' : '#f59e0b'}">${t.rate.toFixed(1)}%</td>
                            <td style="color: ${t.urgent > 0 ? '#ef4444' : '#a1a1aa'}">${t.urgent}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="report-content-section">
            <h3>📊 Volume por Time</h3>
            <div class="chart-container">
                <canvas id="chartTeams" height="250"></canvas>
            </div>
        </div>`;
    }
    
    renderBacklog() {
        const r = this.reportResult;
        return `
        <div class="report-content-section">
            <h3>📋 Análise de Backlog</h3>
            <div class="kpi-grid">
                ${this.renderKPI('Tickets Abertos', r.open, '#3b82f6')}
                ${this.renderKPI('Parados (>7d)', r.staleCount, '#ef4444')}
                ${this.renderKPI('Urgentes', r.urgentCount, '#f59e0b')}
                ${this.renderKPI('Alta Prioridade', r.highCount, '#8b5cf6')}
            </div>
        </div>
        <div class="report-content-section">
            <h3>📊 Distribuição por Status</h3>
            <div class="chart-container">
                <canvas id="chartStatus" height="250"></canvas>
            </div>
        </div>`;
    }
    
    renderPriority() {
        const r = this.reportResult;
        const labels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
        return `
        <div class="report-content-section">
            <h3>🎯 Distribuição por Prioridade</h3>
            <div class="kpi-grid">
                ${Object.entries(r.byPriority).map(([p, count]) => 
                    this.renderKPI(labels[p], count, this.colors.chartColors[p - 1])
                ).join('')}
            </div>
            <div class="chart-container" style="margin-top: 1rem;">
                <canvas id="chartPriority" height="250"></canvas>
            </div>
        </div>`;
    }
    
    renderQuality() {
        const r = this.reportResult;
        const score = Math.min(100, Math.round(r.closedRate * 0.6 + (100 - Math.min(100, r.avgResTime)) * 0.4));
        return `
        <div class="report-content-section">
            <h3>⭐ Score de Qualidade</h3>
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; font-weight: 700; color: ${score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}">
                    ${score}
                </div>
                <div style="color: #a1a1aa; font-size: 1.2rem;">Pontos de 100</div>
            </div>
            <div class="insights-grid">
                <div class="insight-card" style="--insight-color: #10b981">
                    <div class="icon">✅</div>
                    <div class="content">
                        <h4>Taxa de Resolução</h4>
                        <p>${r.closedRate.toFixed(1)}% dos tickets foram resolvidos</p>
                    </div>
                </div>
                <div class="insight-card" style="--insight-color: #06b6d4">
                    <div class="icon">⏱️</div>
                    <div class="content">
                        <h4>Tempo de Resposta</h4>
                        <p>Média de ${this.formatHours(r.avgFRTime)} para primeira resposta</p>
                    </div>
                </div>
            </div>
        </div>`;
    }
    
    renderInsights() {
        const r = this.reportResult;
        const insights = [];
        
        if (r.closedRate >= 80) {
            insights.push({ icon: '🎉', title: 'Excelente taxa de resolução', desc: `${r.closedRate.toFixed(1)}% fechados`, color: '#10b981' });
        } else if (r.closedRate < 50) {
            insights.push({ icon: '⚠️', title: 'Taxa de resolução baixa', desc: 'Considere priorizar o backlog', color: '#ef4444' });
        }
        
        if (r.staleCount > 0) {
            insights.push({ icon: '🔔', title: `${r.staleCount} tickets parados`, desc: 'Sem atualização há mais de 7 dias', color: '#f59e0b' });
        }
        
        if (r.urgentCount > 5) {
            insights.push({ icon: '🚨', title: `${r.urgentCount} tickets urgentes`, desc: 'Requerem atenção imediata', color: '#ef4444' });
        }
        
        if (r.avgResTime > 48) {
            insights.push({ icon: '⏰', title: 'Tempo de resolução alto', desc: `Média de ${this.formatHours(r.avgResTime)}`, color: '#f59e0b' });
        }
        
        if (!insights.length) {
            insights.push({ icon: '✅', title: 'Métricas saudáveis', desc: 'Nenhum alerta no momento', color: '#10b981' });
        }
        
        return `
        <div class="report-content-section">
            <h3>💡 Insights e Alertas</h3>
            <div class="insights-grid">
                ${insights.map(i => `
                    <div class="insight-card" style="--insight-color: ${i.color}">
                        <div class="icon">${i.icon}</div>
                        <div class="content">
                            <h4>${i.title}</h4>
                            <p>${i.desc}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    showEmptyState(title, desc) {
        const main = document.getElementById('reportsMainContent');
        if (main) {
            main.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>${title}</h3>
                    <p>${desc}</p>
                </div>`;
        }
    }
    
    // Desenhar gráficos com Chart.js
    drawCharts() {
        const r = this.reportResult;
        if (!r) return;
        
        // Status Chart
        this.drawDonut('chartStatus', r.byStatus, 'Status');
        
        // Priority Chart  
        const priorityLabels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
        const priorityData = {};
        Object.entries(r.byPriority).forEach(([k, v]) => priorityData[priorityLabels[k]] = v);
        this.drawDonut('chartPriority', priorityData, 'Prioridade');
        
        // Trend Chart
        this.drawLine('chartTrend', r.byWeek, 'Tickets por Semana');
        
        // Agents Chart
        const topAgents = Object.entries(r.byAgent)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 8);
        const agentData = {};
        topAgents.forEach(([name, data]) => agentData[name] = data.total);
        this.drawBar('chartAgents', agentData, 'Tickets por Agente');
        
        // Teams Chart
        const teamData = {};
        Object.entries(r.byTeam).forEach(([name, data]) => teamData[name] = data.total);
        this.drawBar('chartTeams', teamData, 'Tickets por Time');
    }
    
    drawDonut(canvasId, data, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !Object.keys(data).length) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * 2;
        const h = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        const total = values.reduce((a, b) => a + b, 0);
        
        const cx = w / 4, cy = h / 4;
        const radius = Math.min(cx, cy) * 0.7;
        let startAngle = -Math.PI / 2;
        
        values.forEach((val, i) => {
            const slice = (val / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
            ctx.fillStyle = this.colors.chartColors[i % this.colors.chartColors.length];
            ctx.fill();
            startAngle += slice;
        });
        
        // Centro
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a1a';
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(total.toString(), cx, cy + 6);
    }
    
    drawBar(canvasId, data, title, isAgentChart = false) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !Object.keys(data).length) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * 2;
        const h = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        const max = Math.max(...values);
        
        const pad = { top: 20, bottom: 40, left: 100, right: 20 };
        const barH = 25;
        const gap = 8;
        const chartW = w / 2 - pad.left - pad.right;
        
        // Guardar áreas clicáveis para eventos
        const barAreas = [];
        
        labels.forEach((label, i) => {
            const y = pad.top + i * (barH + gap);
            const barW = (values[i] / max) * chartW;
            
            // Guardar área para clique (coordenadas em escala 1x)
            barAreas.push({
                label,
                x: pad.left / 2,
                y: y / 2,
                w: (pad.left + barW) / 2,
                h: barH / 2
            });
            
            const grad = ctx.createLinearGradient(pad.left, 0, pad.left + barW, 0);
            grad.addColorStop(0, this.colors.chartColors[i % this.colors.chartColors.length]);
            grad.addColorStop(1, this.colors.chartColors[(i + 1) % this.colors.chartColors.length]);
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(pad.left, y, barW, barH, 4);
            ctx.fill();
            
            ctx.fillStyle = '#a1a1aa';
            ctx.font = '11px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(label.length > 15 ? label.slice(0, 12) + '...' : label, pad.left - 8, y + barH / 2 + 4);
            
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(values[i].toString(), pad.left + barW + 8, y + barH / 2 + 4);
        });
        
        // Adicionar evento de clique
        canvas.style.cursor = 'pointer';
        const isTeamChart = canvasId === 'chartTeams';
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            for (const bar of barAreas) {
                if (x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h) {
                    this.showAgentTickets(bar.label, isTeamChart);
                    break;
                }
            }
        };
    }
    
    // Mostrar modal com tickets do agente ou time
    showAgentTickets(name, isTeam = false) {
        const tickets = isTeam 
            ? (this.ticketsByTeam?.[name] || [])
            : (this.ticketsByAgent?.[name] || []);
        
        if (!tickets.length) {
            alert(`Nenhum ticket encontrado para ${name}`);
            return;
        }
        
        const entityType = isTeam ? 'Time' : 'Agente';
        
        // Criar modal
        const modal = document.createElement('div');
        modal.id = 'agentTicketsModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.8); 
            display: flex; align-items: center; justify-content: center; z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: #1e1e2e; border-radius: 16px; padding: 1.5rem; 
            max-width: 900px; max-height: 80vh; overflow-y: auto; width: 90%;
            border: 1px solid rgba(255,255,255,0.1);
        `;
        
        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="color: #fff; margin: 0;">
                    📋 Tickets de ${name}
                    <span style="color: #a1a1aa; font-size: 0.9rem; margin-left: 0.5rem;">(${tickets.length} tickets)</span>
                </h3>
                <button onclick="document.getElementById('agentTicketsModal').remove()" 
                        style="background: #ef4444; border: none; color: #fff; padding: 0.5rem 1rem; 
                               border-radius: 8px; cursor: pointer; font-weight: 600;">✕ Fechar</button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.05);">
                        <th style="padding: 0.75rem; text-align: left; color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase;">ID</th>
                        <th style="padding: 0.75rem; text-align: left; color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase;">Assunto</th>
                        <th style="padding: 0.75rem; text-align: left; color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase;">Status</th>
                        <th style="padding: 0.75rem; text-align: left; color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase;">Prioridade</th>
                        <th style="padding: 0.75rem; text-align: left; color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase;">Criado</th>
                    </tr>
                </thead>
                <tbody>
                    ${tickets.map(t => {
                        const statusInfo = this.statusMap[t.status] || { label: t.status, color: '#6b7280' };
                        const prioLabels = ['', 'Baixa', 'Média', 'Alta', 'Urgente'];
                        const prioColors = ['', '#6b7280', '#3b82f6', '#f59e0b', '#ef4444'];
                        return `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 0.75rem; color: #6366f1; font-weight: 600;">#${t.id}</td>
                                <td style="padding: 0.75rem; color: #e4e4e7; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${t.subject || 'Sem assunto'}
                                </td>
                                <td style="padding: 0.75rem;">
                                    <span style="background: ${statusInfo.color}22; color: ${statusInfo.color}; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">
                                        ${statusInfo.label}
                                    </span>
                                </td>
                                <td style="padding: 0.75rem;">
                                    <span style="color: ${prioColors[t.priority] || '#6b7280'}; font-weight: 500;">
                                        ${prioLabels[t.priority] || t.priority}
                                    </span>
                                </td>
                                <td style="padding: 0.75rem; color: #a1a1aa; font-size: 0.85rem;">
                                    ${t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '-'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        modal.appendChild(content);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }
    
    drawLine(canvasId, data, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !Object.keys(data).length) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * 2;
        const h = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        
        const labels = Object.keys(data).sort();
        const values = labels.map(k => data[k]);
        const max = Math.max(...values, 1);
        
        const pad = { top: 20, bottom: 30, left: 40, right: 20 };
        const chartW = w / 2 - pad.left - pad.right;
        const chartH = h / 2 - pad.top - pad.bottom;
        
        // Linha
        ctx.beginPath();
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        
        values.forEach((val, i) => {
            const x = pad.left + (i / (values.length - 1 || 1)) * chartW;
            const y = pad.top + chartH - (val / max) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Pontos
        values.forEach((val, i) => {
            const x = pad.left + (i / (values.length - 1 || 1)) * chartW;
            const y = pad.top + chartH - (val / max) * chartH;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.primary;
            ctx.fill();
        });
    }
    
    // Exportar Excel
    exportExcel() {
        if (!this.filteredData.length) return alert('Gere um relatório primeiro');
        
        const headers = ['ID', 'Assunto', 'Status', 'Prioridade', 'Responsável', 'Time', 'Criado', 'Resolvido'];
        const rows = this.filteredData.map(t => [
            t.id,
            t.subject || '',
            this.statusMap[t.status]?.label || t.status,
            ['', 'Baixa', 'Média', 'Alta', 'Urgente'][t.priority] || t.priority,
            t.cf_tratativa || t.responder_name || '',
            t.cf_grupo_tratativa || t.group_name || '',
            t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '',
            t.resolved_at ? new Date(t.resolved_at).toLocaleDateString('pt-BR') : ''
        ]);
        
        let csv = headers.join(';') + '\n' + rows.map(r => r.join(';')).join('\n');
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${this.selectedType}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
    
    // Exportar PDF (simplificado - usa impressão)
    exportPDF() {
        window.print();
    }
}

// Instância global
window.reportsModuleV2 = new ReportsModuleV2();
