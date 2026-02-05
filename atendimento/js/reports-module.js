/**
 * Módulo de Relatórios Avançado v2.0
 * Gera relatórios personalizados com insights inteligentes, gráficos e exportação
 */

window.reportsModule = {
    colors: {
        bg: '#1e1e2e',
        card: '#2a2a3e',
        surface: '#313147',
        text: '#e4e4e7',
        textMuted: '#a1a1aa',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        border: '#3f3f5a',
        info: '#06b6d4',
        chartColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
    },
    
    currentReport: null,
    lastResult: null,
    // SVG Icons Premium
    icons: {
        executive: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
        trends: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
        performance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
        teams: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        sla: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        backlog: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>',
        heatmap: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="6" y="13" width="4" height="4" rx="1"/><rect x="14" y="13" width="4" height="4" rx="1"/></svg>',
        csat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
    },

    reportTypes: [
        { id: 'executive', name: 'Resumo Executivo', description: 'Visão geral com KPIs principais e insights estratégicos' },
        { id: 'trends', name: 'Tendências e Volume', description: 'Gráficos de evolução, projeções e análise temporal' },
        { id: 'performance', name: 'Performance por Agente', description: 'Ranking detalhado e métricas individuais' },
        { id: 'teams', name: 'Comparativo de Times', description: 'Benchmark entre times com gráficos comparativos' },
        { id: 'sla', name: 'Análise de SLA', description: 'SLA por prioridade, FCR e tempo de resposta' },
        { id: 'backlog', name: 'Backlog e Aging', description: 'Tickets parados, aging analysis e alertas' },
        { id: 'heatmap', name: 'Heatmap de Atividade', description: 'Volume por dia/hora para identificar picos' },
        { id: 'csat', name: 'Satisfação (CSAT)', description: 'Análise de avaliações e feedbacks negativos' }
    ],
    
    initialize() {
        console.log('📋 Inicializando módulo de Relatórios...');
        const container = document.getElementById('reportsContainer');
        if (!container) {
            console.error('Container de relatórios não encontrado');
            return;
        }
        
        container.innerHTML = this.render();
        this.setupEventListeners();
        this.updateRecentReports();
    },
    
    render() {
        return `
            <div style="padding: 2rem; max-width: 1600px; margin: 0 auto;">
                <!-- Header -->
                <div style="margin-bottom: 2rem;">
                    <h1 style="font-size: 1.75rem; font-weight: 700; color: ${this.colors.text}; display: flex; align-items: center; gap: 0.75rem;">
                        <span style="color: ${this.colors.primary}">${this.icons.backlog}</span>
                        Relatórios
                    </h1>
                    <p style="color: ${this.colors.textMuted}; margin-top: 0.5rem;">
                        Gere relatórios personalizados a partir dos dados de tickets
                    </p>
                </div>
                
                <!-- Tipos de Relatório -->
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.25rem;
                    margin-bottom: 2rem;
                ">
                    ${this.reportTypes.map(type => `
                        <div class="report-type-card" data-report="${type.id}" style="
                            background: ${this.colors.card};
                            border: 1px solid ${this.colors.border};
                            border-radius: 12px;
                            padding: 1.5rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.borderColor='${this.colors.primary}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(59,130,246,0.15)';"
                           onmouseout="this.style.borderColor='${this.colors.border}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <span style="color: ${this.colors.primary}; display: flex; align-items: center;">${this.icons[type.id] || ''}</span>
                                <span style="font-size: 1.1rem; font-weight: 600; color: ${this.colors.text};">${type.name}</span>
                            </div>
                            <p style="color: ${this.colors.textMuted}; font-size: 0.875rem; line-height: 1.5;">
                                ${type.description}
                            </p>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Área de Configuração do Relatório -->
                <div id="reportConfigArea" style="display: none;">
                    <div style="
                        background: ${this.colors.card};
                        border: 1px solid ${this.colors.border};
                        border-radius: 12px;
                        padding: 1.5rem;
                        margin-bottom: 1.5rem;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h2 id="reportConfigTitle" style="font-size: 1.25rem; font-weight: 600; color: ${this.colors.text};">
                                Configurar Relatório
                            </h2>
                            <button onclick="window.reportsModule.closeConfig()" style="
                                padding: 0.5rem 1rem;
                                background: transparent;
                                border: 1px solid ${this.colors.border};
                                border-radius: 8px;
                                color: ${this.colors.textMuted};
                                cursor: pointer;
                            ">✕ Fechar</button>
                        </div>
                        
                        <div id="reportConfigContent">
                            <!-- Conteúdo dinâmico -->
                        </div>
                    </div>
                </div>
                
                <!-- Área de Resultado do Relatório -->
                <div id="reportResultArea" style="display: none;">
                    <div style="
                        background: ${this.colors.card};
                        border: 1px solid ${this.colors.border};
                        border-radius: 12px;
                        padding: 1.5rem;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h2 id="reportResultTitle" style="font-size: 1.25rem; font-weight: 600; color: ${this.colors.text};">
                                Resultado do Relatório
                            </h2>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="window.reportsModule.exportReport('excel')" style="
                                    padding: 0.5rem 1rem;
                                    background: ${this.colors.success};
                                    border: none;
                                    border-radius: 8px;
                                    color: white;
                                    cursor: pointer;
                                    font-weight: 500;
                                ">📥 Exportar Excel</button>
                                <button onclick="window.reportsModule.exportReport('pdf')" style="
                                    padding: 0.5rem 1rem;
                                    background: ${this.colors.danger};
                                    border: none;
                                    border-radius: 8px;
                                    color: white;
                                    cursor: pointer;
                                    font-weight: 500;
                                ">📄 Exportar PDF</button>
                                <button onclick="window.reportsModule.closeResult()" style="
                                    padding: 0.5rem 1rem;
                                    background: transparent;
                                    border: 1px solid ${this.colors.border};
                                    border-radius: 8px;
                                    color: ${this.colors.textMuted};
                                    cursor: pointer;
                                ">✕ Fechar</button>
                            </div>
                        </div>
                        
                        <div id="reportResultContent">
                            <!-- Resultado dinâmico -->
                        </div>
                    </div>
                </div>
                
                <!-- Relatórios Recentes -->
                <div style="margin-top: 2rem;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; color: ${this.colors.text}; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: ${this.colors.textMuted};">${this.icons.reports}</span>
                        Relatórios Recentes
                    </h3>
                    <div id="recentReports" style="
                        background: ${this.colors.card};
                        border: 1px solid ${this.colors.border};
                        border-radius: 12px;
                        padding: 1.5rem;
                    ">
                        <p style="color: ${this.colors.textMuted}; text-align: center;">
                            Nenhum relatório gerado ainda. Selecione um tipo de relatório acima para começar.
                        </p>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupEventListeners() {
        document.querySelectorAll('.report-type-card').forEach(card => {
            card.addEventListener('click', () => {
                const reportType = card.dataset.report;
                this.selectReportType(reportType);
            });
        });
    },
    
    selectReportType(type) {
        this.currentReport = type;
        const reportInfo = this.reportTypes.find(r => r.id === type);
        
        // Resetar seleções
        this.selectedTeam = 'all';
        this.selectedStatus = 'all';
        this.selectedDateRange = null;
        
        document.getElementById('reportConfigArea').style.display = 'block';
        document.getElementById('reportConfigTitle').innerHTML = `${reportInfo.icon} ${reportInfo.name}`;
        
        const configContent = document.getElementById('reportConfigContent');
        configContent.innerHTML = this.renderReportConfig(type);
    },
    
    renderReportConfig(type) {
        // Estilo padrão do sistema para selects
        const selectStyle = `
            width: 100%;
            padding: 0.6rem 1rem;
            background: ${this.colors.card};
            border: 1px solid ${this.colors.border};
            border-radius: 8px;
            color: ${this.colors.text};
            font-size: 0.9rem;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23a1a1aa' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
        `;
        
        // Datas padrão (últimos 30 dias)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
        const defaultEnd = today.toISOString().split('T')[0];
        
        // Configurações comuns a todos os relatórios
        const commonFilters = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <!-- Período com Date Range Picker -->
                <div>
                    <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text}; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem;">
                        📅 Período
                    </label>
                    <div id="reportPeriodWrapper" style="min-width: 200px;">
                        <select id="reportPeriodSelect" style="display: none;">
                            <option value="30" selected>Últimos 30 dias</option>
                        </select>
                    </div>
                </div>
                
                <!-- Time -->
                <div>
                    <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text}; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem;">
                        Time
                    </label>
                    <select id="reportTeamSelect" style="${selectStyle}" onchange="window.reportsModule.selectedTeam = this.value; console.log('🔄 Time:', this.value)">
                        <option value="all">Todos os times</option>
                        ${this.getTeamOptions()}
                    </select>
                </div>
                
                <!-- Status -->
                <div>
                    <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text}; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem;">
                        Status
                    </label>
                    <select id="reportStatusSelect" style="${selectStyle}" onchange="window.reportsModule.selectedStatus = this.value; console.log('🔄 Status:', this.value)">
                        <option value="all">Todos os status</option>
                        <option value="open">Abertos</option>
                        <option value="closed">Fechados</option>
                        <option value="pending">Pendentes/Aguardando</option>
                    </select>
                </div>
            </div>
        `;
        
        // Após renderizar, inicializar o DateRangePicker
        setTimeout(() => this.initDatePicker(), 50);
        
        // Configurações específicas por tipo
        let specificConfig = '';
        
        switch (type) {
            case 'performance':
                specificConfig = `
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: ${this.colors.textMuted}; font-size: 0.875rem; margin-bottom: 0.5rem;">
                            Métricas a incluir
                        </label>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" checked value="total"> Total de Tickets
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" checked value="resolved"> Taxa de Resolução
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" checked value="avgTime"> Tempo Médio
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" checked value="sla"> Conformidade SLA
                            </label>
                        </div>
                    </div>
                `;
                break;
                
            case 'sla':
                specificConfig = `
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: ${this.colors.textMuted}; font-size: 0.875rem; margin-bottom: 0.5rem;">
                            ⏱️ Tipo de SLA
                        </label>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" checked value="firstResponse"> Primeira Resposta
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" checked value="resolution"> Resolução
                            </label>
                        </div>
                    </div>
                `;
                break;
                
            case 'custom':
                specificConfig = `
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: ${this.colors.textMuted}; font-size: 0.875rem; margin-bottom: 0.5rem;">
                            ⚙️ Selecione as métricas
                        </label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="total"> Total de Tickets
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="resolved"> Resolvidos
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="open"> Em Aberto
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="avgTime"> Tempo Médio Resolução
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="firstResponse"> Tempo 1ª Resposta
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="slaResolution"> SLA Resolução
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="slaFirstResponse"> SLA 1ª Resposta
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="byPriority"> Por Prioridade
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="byType"> Por Tipo
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: ${this.colors.text};">
                                <input type="checkbox" value="byAgent"> Por Agente
                            </label>
                        </div>
                    </div>
                `;
                break;
        }
        
        return `
            ${commonFilters}
            ${specificConfig}
            
            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                <button onclick="window.reportsModule.generateReport()" style="
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                ">🔍 Gerar Relatório</button>
            </div>
        `;
    },
    
    getTeamOptions() {
        // Buscar times dos dados carregados
        if (window.allTicketsCache && window.allTicketsCache.length > 0) {
            const teams = new Set();
            window.allTicketsCache.forEach(ticket => {
                if (ticket.cf_grupo_tratativa) {
                    ticket.cf_grupo_tratativa.split(/[,;\/]/).forEach(t => {
                        const team = t.trim();
                        if (team) teams.add(team);
                    });
                }
            });
            return Array.from(teams).sort().map(team => `<option value="${team}">${team}</option>`).join('');
        }
        return '';
    },
    
    closeConfig() {
        document.getElementById('reportConfigArea').style.display = 'none';
        this.currentReport = null;
    },
    
    closeResult() {
        document.getElementById('reportResultArea').style.display = 'none';
    },
    
    // Inicializar DateRangePicker do sistema
    initDatePicker() {
        // Usar o método replaceSelectWithPicker do DateRangePicker
        if (typeof DateRangePicker !== 'undefined' && DateRangePicker.replaceSelectWithPicker) {
            console.log('📅 Inicializando DateRangePicker para relatórios...');
            
            DateRangePicker.replaceSelectWithPicker('reportPeriodSelect', (range) => {
                this.selectedDateRange = range;
                console.log('📅 Período selecionado:', range);
            });
        } else {
            console.warn('DateRangePicker não disponível');
        }
    },
    
    // Armazena valores selecionados
    selectedDateRange: null,
    selectedTeam: 'all',
    selectedStatus: 'all',
    
    generateReport() {
        // Pegar datas do DateRangePicker ou calcular a partir do preset
        let startDate = null;
        let endDate = null;
        
        if (this.selectedDateRange) {
            if (this.selectedDateRange.start && this.selectedDateRange.end) {
                startDate = this.selectedDateRange.start.toISOString().split('T')[0];
                endDate = this.selectedDateRange.end.toISOString().split('T')[0];
            } else if (this.selectedDateRange.preset) {
                const days = parseInt(this.selectedDateRange.preset);
                if (!isNaN(days) && days > 0) {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - days);
                    startDate = start.toISOString().split('T')[0];
                    endDate = end.toISOString().split('T')[0];
                }
            }
        } else {
            // Default: últimos 30 dias
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 30);
            startDate = start.toISOString().split('T')[0];
            endDate = end.toISOString().split('T')[0];
        }
        
        // Usar valores armazenados no módulo
        const team = this.selectedTeam || 'all';
        const status = this.selectedStatus || 'all';
        
        console.log('='.repeat(50));
        console.log(`📋 GERANDO RELATÓRIO: ${this.currentReport}`);
        console.log(`📅 Período: ${startDate} a ${endDate}`);
        console.log(`👥 Time: "${team}"`);
        console.log(`📊 Status: "${status}"`);
        console.log('='.repeat(50));
        
        // Verificar se há dados
        if (!window.allTicketsCache || window.allTicketsCache.length === 0) {
            alert('Nenhum dado disponível. Por favor, carregue os tickets primeiro.');
            return;
        }
        
        // Filtrar dados usando datas do DateRangePicker
        const filteredData = this.filterData(startDate, endDate, team, status);
        
        // Gerar resultado
        const result = this.processReport(filteredData);
        
        // Mostrar resultado
        this.showResult(result);
    },
    
    filterData(startDate, endDate, team, status) {
        let data = [...window.allTicketsCache];
        console.log(`📋 Dados iniciais: ${data.length} tickets`);
        
        // Filtrar por período usando datas
        if (startDate && endDate) {
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            
            data = data.filter(t => {
                const createdAt = new Date(t.created_at);
                return createdAt >= start && createdAt <= end;
            });
            console.log(`📅 Período ${startDate} a ${endDate}: ${data.length} tickets`);
        } else if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            data = data.filter(t => new Date(t.created_at) >= start);
            console.log(`📅 A partir de ${startDate}: ${data.length} tickets`);
        } else if (endDate) {
            const end = new Date(endDate + 'T23:59:59');
            data = data.filter(t => new Date(t.created_at) <= end);
            console.log(`📅 Até ${endDate}: ${data.length} tickets`);
        } else {
            console.log(`📅 Período: Todo o histórico`);
        }
        
        // Filtrar por time - comparação exata
        if (team && team !== 'all') {
            const teamLower = team.toLowerCase().trim();
            console.log(`👥 Filtrando por time: "${team}" (lowercase: "${teamLower}")`);
            
            const beforeCount = data.length;
            data = data.filter(t => {
                if (!t.cf_grupo_tratativa) return false;
                const ticketTeam = t.cf_grupo_tratativa.toLowerCase().trim();
                // Comparação direta ou parcial
                return ticketTeam === teamLower || 
                       ticketTeam.includes(teamLower) || 
                       teamLower.includes(ticketTeam);
            });
            console.log(`👥 Time "${team}": ${beforeCount} → ${data.length} tickets`);
        }
        
        // Filtrar por status - suporta número e string
        if (status && status !== 'all') {
            const statusMap = {
                'open': [2, '2', 'Open', 'Aberto'],
                'closed': [4, 5, '4', '5', 'Closed', 'Resolved', 'Fechado', 'Resolvido'],
                'pending': [3, 7, 16, 17, '3', '7', '16', '17', 'Pending', 'Pendente', 'Aguardando']
            };
            const validStatuses = statusMap[status] || [];
            data = data.filter(t => {
                const ticketStatus = t.status;
                return validStatuses.includes(ticketStatus) || 
                       validStatuses.includes(String(ticketStatus)) ||
                       validStatuses.some(s => String(s).toLowerCase() === String(ticketStatus).toLowerCase());
            });
            console.log(`📊 Após filtro status (${status}): ${data.length} tickets`);
        }
        
        console.log(`✅ Total filtrado: ${data.length} tickets`);
        return data;
    },
    
    processReport(data) {
        const total = data.length;
        const closed = data.filter(t => [4, 5].includes(t.status)).length;
        const open = data.filter(t => t.status === 2).length;
        const pending = total - closed - open;
        const urgent = data.filter(t => t.priority === 4).length;
        const high = data.filter(t => t.priority === 3).length;
        
        // Calcular tempos
        let totalResolutionTime = 0;
        let resolutionCount = 0;
        let totalFirstResponse = 0;
        let firstResponseCount = 0;
        const resolutionTimes = [];
        
        data.forEach(t => {
            if (t.resolved_at && t.created_at) {
                const resolvedAt = new Date(t.resolved_at);
                const createdAt = new Date(t.created_at);
                const diffHours = (resolvedAt - createdAt) / (1000 * 60 * 60);
                if (diffHours > 0 && diffHours < 720) {
                    totalResolutionTime += diffHours;
                    resolutionCount++;
                    resolutionTimes.push(diffHours);
                }
            }
            if (t.first_responded_at && t.created_at) {
                const firstResponse = new Date(t.first_responded_at);
                const createdAt = new Date(t.created_at);
                const diffHours = (firstResponse - createdAt) / (1000 * 60 * 60);
                if (diffHours > 0 && diffHours < 168) {
                    totalFirstResponse += diffHours;
                    firstResponseCount++;
                }
            }
        });
        
        const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;
        const avgFirstResponse = firstResponseCount > 0 ? totalFirstResponse / firstResponseCount : 0;
        
        // Calcular percentis
        resolutionTimes.sort((a, b) => a - b);
        const p50 = resolutionTimes.length > 0 ? resolutionTimes[Math.floor(resolutionTimes.length * 0.5)] : 0;
        const p90 = resolutionTimes.length > 0 ? resolutionTimes[Math.floor(resolutionTimes.length * 0.9)] : 0;
        
        // Por time com métricas detalhadas
        const byTeam = {};
        data.forEach(t => {
            if (t.cf_grupo_tratativa) {
                t.cf_grupo_tratativa.split(/[,;\/]/).forEach(team => {
                    const teamName = team.trim();
                    if (teamName) {
                        if (!byTeam[teamName]) {
                            byTeam[teamName] = { total: 0, closed: 0, open: 0, urgent: 0 };
                        }
                        byTeam[teamName].total++;
                        if ([4, 5].includes(t.status)) byTeam[teamName].closed++;
                        if (t.status === 2) byTeam[teamName].open++;
                        if (t.priority === 4) byTeam[teamName].urgent++;
                    }
                });
            }
        });
        
        // Por agente com métricas
        const byAgent = {};
        data.forEach(t => {
            if (t.cf_tratativa) {
                t.cf_tratativa.split(/[,;\/]/).forEach(agent => {
                    const agentName = agent.trim();
                    if (agentName) {
                        if (!byAgent[agentName]) {
                            byAgent[agentName] = { total: 0, closed: 0, totalTime: 0, timeCount: 0 };
                        }
                        byAgent[agentName].total++;
                        if ([4, 5].includes(t.status)) {
                            byAgent[agentName].closed++;
                            if (t.resolved_at && t.created_at) {
                                const diffHours = (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                                if (diffHours > 0 && diffHours < 720) {
                                    byAgent[agentName].totalTime += diffHours;
                                    byAgent[agentName].timeCount++;
                                }
                            }
                        }
                    }
                });
            }
        });
        
        // Por prioridade
        const byPriority = { 1: 0, 2: 0, 3: 0, 4: 0 };
        data.forEach(t => {
            if (t.priority && byPriority[t.priority] !== undefined) {
                byPriority[t.priority]++;
            }
        });
        
        // Tendência por semana
        const byWeek = {};
        data.forEach(t => {
            const date = new Date(t.created_at);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            byWeek[weekKey] = (byWeek[weekKey] || 0) + 1;
        });
        
        // Tickets parados (sem atualização > 7 dias)
        const staleTickets = data.filter(t => {
            if ([4, 5].includes(t.status)) return false;
            const lastUpdate = new Date(t.updated_at || t.created_at);
            const daysSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
            return daysSinceUpdate > 7;
        });
        
        return {
            total, closed, open, pending, urgent, high,
            closedRate: total > 0 ? ((closed / total) * 100) : 0,
            avgResolutionTime, avgFirstResponse,
            p50, p90,
            byTeam, byAgent, byPriority, byWeek,
            staleTickets: staleTickets.length,
            data
        };
    },
    
    showResult(result) {
        this.lastResult = result;
        const reportInfo = this.reportTypes.find(r => r.id === this.currentReport);
        
        document.getElementById('reportResultArea').style.display = 'block';
        document.getElementById('reportResultTitle').innerHTML = `${reportInfo.icon} ${reportInfo.name}`;
        
        // Gerar insights baseados nos dados
        const insights = this.generateInsights(result);
        
        const priorityLabels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
        const priorityColors = { 1: this.colors.textMuted, 2: this.colors.primary, 3: this.colors.warning, 4: this.colors.danger };
        
        // Top agentes por produtividade
        const agentRanking = Object.entries(result.byAgent)
            .map(([name, data]) => ({
                name,
                ...data,
                rate: data.total > 0 ? (data.closed / data.total * 100) : 0,
                avgTime: data.timeCount > 0 ? (data.totalTime / data.timeCount) : 0
            }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5);
        
        // Times ordenados
        const teamRanking = Object.entries(result.byTeam)
            .map(([name, data]) => ({
                name,
                ...data,
                rate: data.total > 0 ? (data.closed / data.total * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);
        
        document.getElementById('reportResultContent').innerHTML = `
            <!-- Insights Inteligentes -->
            <div style="
                background: linear-gradient(135deg, ${this.colors.primary}22, ${this.colors.secondary}22);
                border: 1px solid ${this.colors.primary}44;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            ">
                <h3 style="color: ${this.colors.text}; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    💡 Insights e Recomendações
                </h3>
                <div style="display: grid; gap: 1rem;">
                    ${insights.map(insight => `
                        <div style="
                            display: flex;
                            gap: 1rem;
                            padding: 1rem;
                            background: ${this.colors.card};
                            border-radius: 8px;
                            border-left: 4px solid ${insight.color};
                        ">
                            <span style="font-size: 1.5rem;">${insight.icon}</span>
                            <div>
                                <div style="color: ${this.colors.text}; font-weight: 600; margin-bottom: 0.25rem;">
                                    ${insight.title}
                                </div>
                                <div style="color: ${this.colors.textMuted}; font-size: 0.875rem; line-height: 1.5;">
                                    ${insight.description}
                                </div>
                                ${insight.action ? `
                                    <div style="color: ${insight.color}; font-size: 0.8rem; margin-top: 0.5rem; font-weight: 500;">
                                        💡 ${insight.action}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- KPIs Principais -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: ${this.colors.primary};">${result.total}</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Total de Tickets</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: ${this.colors.success};">${result.closedRate.toFixed(1)}%</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Taxa Resolução</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: ${this.colors.info};">${result.avgFirstResponse.toFixed(1)}h</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Tempo 1ª Resposta</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: ${this.colors.text};">${result.avgResolutionTime.toFixed(1)}h</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Tempo Médio Resolução</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: ${this.colors.danger};">${result.open}</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Em Aberto</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: ${this.colors.warning};">${result.staleTickets}</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Tickets Parados</div>
                </div>
            </div>
            
            <!-- Conteúdo Específico por Tipo de Relatório -->
            ${this.renderReportSpecificContent(result)}
            
            <!-- Gráficos e Detalhes Gerais -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <!-- Ranking de Agentes -->
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px;">
                    <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">🏆 Top 5 Agentes (Taxa de Resolução)</h4>
                    ${agentRanking.length > 0 ? agentRanking.map((agent, idx) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid ${this.colors.border};">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="
                                    width: 24px; height: 24px;
                                    display: flex; align-items: center; justify-content: center;
                                    background: ${idx === 0 ? this.colors.warning : idx === 1 ? this.colors.textMuted : idx === 2 ? '#cd7f32' : this.colors.surface};
                                    border-radius: 50%;
                                    font-size: 0.75rem;
                                    color: ${idx < 3 ? '#000' : this.colors.text};
                                ">${idx + 1}</span>
                                <span style="color: ${this.colors.text};">${agent.name}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: ${this.colors.success}; font-weight: 600;">${agent.rate.toFixed(1)}%</div>
                                <div style="color: ${this.colors.textMuted}; font-size: 0.75rem;">${agent.closed}/${agent.total} tickets</div>
                            </div>
                        </div>
                    `).join('') : '<p style="color: ' + this.colors.textMuted + ';">Sem dados de agentes</p>'}
                </div>
                
                <!-- Por Time -->
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px;">
                    <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">Volume por Time</h4>
                    <div style="max-height: 250px; overflow-y: auto;">
                        ${teamRanking.map(team => {
                            const pct = result.total > 0 ? (team.total / result.total * 100) : 0;
                            return `
                                <div style="margin-bottom: 0.75rem;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                        <span style="color: ${this.colors.text}; font-size: 0.9rem;">${team.name}</span>
                                        <span style="color: ${this.colors.textMuted}; font-size: 0.8rem;">${team.total} (${pct.toFixed(0)}%)</span>
                                    </div>
                                    <div style="background: ${this.colors.border}; border-radius: 4px; height: 8px; overflow: hidden;">
                                        <div style="background: linear-gradient(90deg, ${this.colors.primary}, ${this.colors.secondary}); width: ${pct}%; height: 100%; border-radius: 4px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Segunda Linha -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <!-- Por Prioridade -->
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px;">
                    <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">🎯 Distribuição por Prioridade</h4>
                    ${Object.entries(result.byPriority).map(([priority, count]) => {
                        const pct = result.total > 0 ? (count / result.total * 100) : 0;
                        return `
                            <div style="margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="color: ${priorityColors[priority]};">${priorityLabels[priority]}</span>
                                    <span style="color: ${this.colors.textMuted}; font-size: 0.8rem;">${count} (${pct.toFixed(0)}%)</span>
                                </div>
                                <div style="background: ${this.colors.border}; border-radius: 4px; height: 8px; overflow: hidden;">
                                    <div style="background: ${priorityColors[priority]}; width: ${pct}%; height: 100%; border-radius: 4px;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- Métricas de Tempo -->
                <div style="background: ${this.colors.surface}; padding: 1.25rem; border-radius: 10px;">
                    <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">⏱️ Métricas de Tempo</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div style="text-align: center; padding: 1rem; background: ${this.colors.card}; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: ${this.colors.info};">${result.avgFirstResponse.toFixed(1)}h</div>
                            <div style="color: ${this.colors.textMuted}; font-size: 0.75rem;">1ª Resposta (Média)</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: ${this.colors.card}; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: ${this.colors.text};">${result.avgResolutionTime.toFixed(1)}h</div>
                            <div style="color: ${this.colors.textMuted}; font-size: 0.75rem;">Resolução (Média)</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: ${this.colors.card}; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: ${this.colors.success};">${result.p50.toFixed(1)}h</div>
                            <div style="color: ${this.colors.textMuted}; font-size: 0.75rem;">Resolução (P50)</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: ${this.colors.card}; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: ${this.colors.warning};">${result.p90.toFixed(1)}h</div>
                            <div style="color: ${this.colors.textMuted}; font-size: 0.75rem;">Resolução (P90)</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Salvar no histórico
        this.saveToHistory(reportInfo, result);
        
        // Renderizar gráficos após o DOM estar pronto
        setTimeout(() => this.renderCharts(result), 100);
    },
    
    // Renderiza conteúdo específico baseado no tipo de relatório
    renderReportSpecificContent(result) {
        switch(this.currentReport) {
            case 'trends':
                return this.renderTrendsContent(result);
            case 'heatmap':
                return this.renderHeatmapContent(result);
            case 'backlog':
                return this.renderBacklogContent(result);
            case 'csat':
                return this.renderCSATContent(result);
            case 'sla':
                return this.renderSLAContent(result);
            case 'teams':
                return this.renderTeamsContent(result);
            default:
                return '';
        }
    },
    
    renderTrendsContent(result) {
        return `
            <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
                <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">📈 Evolução do Volume de Tickets</h4>
                <canvas id="trendsChart" width="800" height="300" style="width: 100%; max-height: 300px;"></canvas>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px;">
                    <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">Volume por Semana</h4>
                    <canvas id="weeklyChart" width="400" height="200" style="width: 100%; max-height: 200px;"></canvas>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px;">
                    <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">🔮 Projeção</h4>
                    <div style="padding: 1rem; background: ${this.colors.card}; border-radius: 8px;">
                        ${this.calculateProjection(result)}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderHeatmapContent(result) {
        return `
            <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
                <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">🗓️ Heatmap de Atividade</h4>
                <p style="color: ${this.colors.textMuted}; font-size: 0.85rem; margin-bottom: 1rem;">
                    Volume de tickets por dia da semana e hora. Cores mais intensas indicam maior volume.
                </p>
                <canvas id="heatmapChart" width="800" height="280" style="width: 100%; max-height: 280px;"></canvas>
            </div>
        `;
    },
    
    renderBacklogContent(result) {
        const backlog = this.processBacklogData(result.data);
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${this.colors.warning};">${backlog.totalOpen}</div>
                    <div style="color: ${this.colors.textMuted};">Tickets em Aberto</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${this.colors.danger};">${backlog.critical}</div>
                    <div style="color: ${this.colors.textMuted};">Críticos (+30 dias)</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${backlog.critical > 10 ? this.colors.danger : this.colors.success};">
                        ${backlog.totalOpen > 0 ? ((backlog.critical / backlog.totalOpen) * 100).toFixed(0) : 0}%
                    </div>
                    <div style="color: ${this.colors.textMuted};">% Críticos</div>
                </div>
            </div>
            <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
                <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">Aging Analysis</h4>
                <canvas id="agingChart" width="600" height="250" style="width: 100%; max-height: 250px;"></canvas>
            </div>
        `;
    },
    
    renderCSATContent(result) {
        const csat = this.processCSATData(result.data);
        const hasData = csat.ratings.length > 0;
        
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${this.colors.primary};">${hasData ? csat.avgRating.toFixed(1) : 'N/A'}</div>
                    <div style="color: ${this.colors.textMuted};">Média CSAT</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${this.colors.success};">${csat.positive}</div>
                    <div style="color: ${this.colors.textMuted};">Positivas (4-5)</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${this.colors.warning};">${csat.neutral}</div>
                    <div style="color: ${this.colors.textMuted};">Neutras (3)</div>
                </div>
                <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${this.colors.danger};">${csat.negative}</div>
                    <div style="color: ${this.colors.textMuted};">Negativas (1-2)</div>
                </div>
            </div>
            ${!hasData ? `
                <div style="background: ${this.colors.warning}22; border: 1px solid ${this.colors.warning}; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem; text-align: center;">
                    <span style="font-size: 2rem; color: ${this.colors.warning};">${this.icons.trends}</span>
                    <p style="color: ${this.colors.text}; margin-top: 0.5rem;">
                        Dados de satisfação não encontrados nos tickets.<br>
                        <span style="color: ${this.colors.textMuted}; font-size: 0.85rem;">
                            Verifique se as avaliações estão sendo sincronizadas corretamente.
                        </span>
                    </p>
                </div>
            ` : ''}
        `;
    },
    
    renderSLAContent(result) {
        const slaPriority = this.processSLAByPriority(result.data);
        const priorityLabels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
        const slaMetas = { 1: 72, 2: 48, 3: 24, 4: 4 };
        
        return `
            <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
                <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">⏱️ SLA por Prioridade</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid ${this.colors.border};">
                            <th style="text-align: left; padding: 0.75rem; color: ${this.colors.text};">Prioridade</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Meta SLA</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Tempo Médio</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Dentro SLA</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Conformidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[4, 3, 2, 1].map(p => {
                            const data = slaPriority[p] || { avg: 0, total: 0, withinSLA: 0, compliance: 0 };
                            const compliance = data.compliance || 0;
                            const complianceColor = compliance >= 90 ? this.colors.success : compliance >= 70 ? this.colors.warning : this.colors.danger;
                            return `
                                <tr style="border-bottom: 1px solid ${this.colors.border};">
                                    <td style="padding: 0.75rem; color: ${this.colors.text};">${priorityLabels[p]}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${this.colors.textMuted};">${slaMetas[p]}h</td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${this.colors.text};">${data.avg.toFixed(1)}h</td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${this.colors.text};">${data.withinSLA}/${data.total}</td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="
                                            padding: 0.25rem 0.75rem;
                                            background: ${complianceColor}22;
                                            color: ${complianceColor};
                                            border-radius: 20px;
                                            font-weight: 600;
                                        ">${compliance.toFixed(0)}%</span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    renderTeamsContent(result) {
        const teams = Object.entries(result.byTeam)
            .map(([name, data]) => ({
                name,
                ...data,
                rate: data.total > 0 ? (data.closed / data.total * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);
        
        return `
            <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
                <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">Comparativo de Times</h4>
                <canvas id="teamsChart" width="800" height="300" style="width: 100%; max-height: 300px;"></canvas>
            </div>
            <div style="background: ${this.colors.surface}; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;">
                <h4 style="color: ${this.colors.text}; margin-bottom: 1rem;">Detalhamento por Time</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid ${this.colors.border};">
                            <th style="text-align: left; padding: 0.75rem; color: ${this.colors.text};">Time</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Total</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Fechados</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Em Aberto</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Urgentes</th>
                            <th style="text-align: center; padding: 0.75rem; color: ${this.colors.text};">Taxa</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teams.map(team => {
                            const rateColor = team.rate >= 80 ? this.colors.success : team.rate >= 60 ? this.colors.warning : this.colors.danger;
                            return `
                                <tr style="border-bottom: 1px solid ${this.colors.border};">
                                    <td style="padding: 0.75rem; color: ${this.colors.text}; font-weight: 500;">${team.name}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${this.colors.text};">${team.total}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${this.colors.success};">${team.closed}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${this.colors.warning};">${team.open}</td>
                                    <td style="padding: 0.75rem; text-align: center; color: ${this.colors.danger};">${team.urgent}</td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="
                                            padding: 0.25rem 0.75rem;
                                            background: ${rateColor}22;
                                            color: ${rateColor};
                                            border-radius: 20px;
                                            font-weight: 600;
                                        ">${team.rate.toFixed(0)}%</span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    calculateProjection(result) {
        const weekValues = Object.values(result.byWeek);
        if (weekValues.length < 2) {
            return `<p style="color: ${this.colors.textMuted};">Dados insuficientes para projeção.</p>`;
        }
        
        const lastWeeks = weekValues.slice(-4);
        const avg = lastWeeks.reduce((a, b) => a + b, 0) / lastWeeks.length;
        const trend = weekValues.length > 1 ? 
            ((weekValues[weekValues.length - 1] - weekValues[weekValues.length - 2]) / weekValues[weekValues.length - 2] * 100) : 0;
        
        const projected = Math.round(avg * (1 + trend / 100));
        const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
        const trendColor = trend > 10 ? this.colors.warning : trend < -10 ? this.colors.success : this.colors.text;
        
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${this.colors.primary};">${projected}</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Projeção próx. semana</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${trendColor};">${trendIcon} ${trend >= 0 ? '+' : ''}${trend.toFixed(0)}%</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Tendência</div>
                </div>
            </div>
            <p style="color: ${this.colors.textMuted}; font-size: 0.8rem; margin-top: 1rem; text-align: center;">
                Baseado na média das últimas ${lastWeeks.length} semanas
            </p>
        `;
    },
    
    renderCharts(result) {
        // Gráfico de tendências
        if (document.getElementById('trendsChart')) {
            this.drawLineChart('trendsChart', result.byWeek, { title: 'Volume de Tickets por Semana' });
        }
        
        // Gráfico semanal
        if (document.getElementById('weeklyChart')) {
            this.drawBarChart('weeklyChart', result.byWeek);
        }
        
        // Heatmap
        if (document.getElementById('heatmapChart')) {
            const heatmapData = this.processHeatmapData(result.data);
            this.drawHeatmap('heatmapChart', heatmapData);
        }
        
        // Aging chart
        if (document.getElementById('agingChart')) {
            const backlog = this.processBacklogData(result.data);
            this.drawBarChart('agingChart', backlog.aging, { title: 'Tickets por Idade' });
        }
        
        // Teams chart
        if (document.getElementById('teamsChart')) {
            const teamsData = {};
            Object.entries(result.byTeam).forEach(([name, data]) => {
                teamsData[name] = data.total;
            });
            this.drawBarChart('teamsChart', teamsData, { title: 'Volume por Time' });
        }
    },
    
    // Gerar insights inteligentes baseados nos dados
    generateInsights(result) {
        const insights = [];
        
        // Insight 1: Taxa de resolução
        if (result.closedRate >= 80) {
            insights.push({
                icon: '✅',
                title: 'Excelente Taxa de Resolução',
                description: `Taxa de ${result.closedRate.toFixed(1)}% está acima da meta. A equipe está performando muito bem na resolução de tickets.`,
                color: this.colors.success
            });
        } else if (result.closedRate >= 60) {
            insights.push({
                icon: '⚠️',
                title: 'Taxa de Resolução Moderada',
                description: `Taxa de ${result.closedRate.toFixed(1)}% pode ser melhorada. Considere revisar processos de atendimento.`,
                color: this.colors.warning,
                action: 'Analisar tickets pendentes há mais tempo para identificar bloqueios.'
            });
        } else if (result.total > 0) {
            insights.push({
                icon: '🚨',
                title: 'Taxa de Resolução Baixa',
                description: `Taxa de ${result.closedRate.toFixed(1)}% está abaixo do esperado. Ação imediata necessária.`,
                color: this.colors.danger,
                action: 'Realizar reunião de alinhamento com a equipe e identificar gargalos.'
            });
        }
        
        // Insight 2: Tickets urgentes
        if (result.urgent > 0) {
            const urgentPct = (result.urgent / result.total * 100);
            if (urgentPct > 20) {
                insights.push({
                    icon: '🔥',
                    title: 'Alto Volume de Urgentes',
                    description: `${result.urgent} tickets urgentes (${urgentPct.toFixed(0)}% do total). Isso pode indicar problemas sistêmicos ou falta de triagem adequada.`,
                    color: this.colors.danger,
                    action: 'Revisar critérios de classificação de prioridade e investigar causa raiz.'
                });
            } else if (result.urgent > 0) {
                insights.push({
                    icon: '⚡',
                    title: 'Tickets Urgentes em Aberto',
                    description: `${result.urgent} tickets urgentes precisam de atenção prioritária.`,
                    color: this.colors.warning,
                    action: 'Priorizar atendimento destes tickets nas próximas horas.'
                });
            }
        }
        
        // Insight 3: Tickets parados
        if (result.staleTickets > 0) {
            const stalePct = (result.staleTickets / result.open * 100);
            insights.push({
                icon: '⏸️',
                title: 'Tickets Parados Detectados',
                description: `${result.staleTickets} tickets sem atualização há mais de 7 dias (${stalePct.toFixed(0)}% dos abertos).`,
                color: this.colors.warning,
                action: 'Revisar estes tickets e definir próximos passos ou escalar se necessário.'
            });
        }
        
        // Insight 4: Tempo de primeira resposta
        if (result.avgFirstResponse > 24) {
            insights.push({
                icon: '🐢',
                title: 'Tempo de 1ª Resposta Alto',
                description: `Média de ${result.avgFirstResponse.toFixed(1)}h para primeira resposta. O ideal é responder em até 4 horas.`,
                color: this.colors.danger,
                action: 'Implementar SLA de primeira resposta e monitorar em tempo real.'
            });
        } else if (result.avgFirstResponse > 8) {
            insights.push({
                icon: '⏰',
                title: 'Tempo de 1ª Resposta Moderado',
                description: `Média de ${result.avgFirstResponse.toFixed(1)}h. Há espaço para melhorar a agilidade.`,
                color: this.colors.warning
            });
        } else if (result.avgFirstResponse > 0) {
            insights.push({
                icon: '⚡',
                title: 'Excelente Tempo de 1ª Resposta',
                description: `Média de ${result.avgFirstResponse.toFixed(1)}h. A equipe está respondendo rapidamente!`,
                color: this.colors.success
            });
        }
        
        // Insight 5: Desbalanceamento entre times
        const teamTotals = Object.values(result.byTeam).map(t => t.total);
        if (teamTotals.length > 1) {
            const maxTeam = Math.max(...teamTotals);
            const minTeam = Math.min(...teamTotals);
            if (maxTeam > minTeam * 3) {
                const topTeam = Object.entries(result.byTeam).find(([_, t]) => t.total === maxTeam)?.[0];
                insights.push({
                    icon: '⚖️',
                    title: 'Carga de Trabalho Desbalanceada',
                    description: `O time "${topTeam}" tem muito mais tickets que outros times. Considere redistribuir a demanda.`,
                    color: this.colors.info,
                    action: 'Avaliar critérios de distribuição de tickets entre times.'
                });
            }
        }
        
        // Insight 6: Tendência semanal
        const weekValues = Object.values(result.byWeek);
        if (weekValues.length >= 2) {
            const lastWeek = weekValues[weekValues.length - 1] || 0;
            const prevWeek = weekValues[weekValues.length - 2] || 0;
            if (prevWeek > 0) {
                const change = ((lastWeek - prevWeek) / prevWeek * 100);
                if (change > 20) {
                    insights.push({
                        icon: '📈',
                        title: 'Aumento de Volume',
                        description: `Volume de tickets aumentou ${change.toFixed(0)}% em relação à semana anterior. Pode ser necessário reforço na equipe.`,
                        color: this.colors.warning,
                        action: 'Monitorar se é tendência ou pico pontual.'
                    });
                } else if (change < -20) {
                    insights.push({
                        icon: '📉',
                        title: 'Redução de Volume',
                        description: `Volume de tickets reduziu ${Math.abs(change).toFixed(0)}% em relação à semana anterior.`,
                        color: this.colors.success
                    });
                }
            }
        }
        
        // Se não há insights específicos, adicionar um genérico
        if (insights.length === 0) {
            insights.push({
                icon: '📊',
                title: 'Análise Geral',
                description: `${result.total} tickets analisados no período. Não foram identificados alertas críticos.`,
                color: this.colors.info
            });
        }
        
        return insights;
    },
    
    saveToHistory(reportInfo, result) {
        const history = JSON.parse(localStorage.getItem('reportsHistory') || '[]');
        history.unshift({
            id: Date.now(),
            type: this.currentReport,
            name: reportInfo.name,
            icon: reportInfo.icon,
            date: new Date().toLocaleString('pt-BR'),
            total: result.total
        });
        
        // Manter apenas os últimos 10
        if (history.length > 10) history.pop();
        
        localStorage.setItem('reportsHistory', JSON.stringify(history));
        this.updateRecentReports();
    },
    
    updateRecentReports() {
        const history = JSON.parse(localStorage.getItem('reportsHistory') || '[]');
        const container = document.getElementById('recentReports');
        
        if (history.length === 0) {
            container.innerHTML = `<p style="color: ${this.colors.textMuted}; text-align: center;">Nenhum relatório gerado ainda.</p>`;
            return;
        }
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${history.map(report => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 1rem;
                        background: ${this.colors.surface};
                        border-radius: 8px;
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.25rem;">${report.icon}</span>
                            <div>
                                <div style="color: ${this.colors.text}; font-weight: 500;">${report.name}</div>
                                <div style="color: ${this.colors.textMuted}; font-size: 0.75rem;">${report.date}</div>
                            </div>
                        </div>
                        <span style="color: ${this.colors.primary}; font-weight: 600;">${report.total} tickets</span>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    exportReport(format) {
        if (!this.lastResult) {
            alert('Nenhum relatório para exportar.');
            return;
        }
        
        const reportInfo = this.reportTypes.find(r => r.id === this.currentReport);
        const result = this.lastResult;
        
        if (format === 'excel') {
            this.exportToExcel(reportInfo, result);
        } else if (format === 'pdf') {
            this.exportToPDF(reportInfo, result);
        }
    },
    
    exportToExcel(reportInfo, result) {
        // Criar workbook manualmente (CSV compatível)
        const lines = [];
        const separator = ';';
        
        // Cabeçalho
        lines.push(`Relatório: ${reportInfo.name}`);
        lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        lines.push(`Total de Tickets: ${result.total}`);
        lines.push('');
        
        // KPIs
        lines.push('=== KPIs PRINCIPAIS ===');
        lines.push(`Métrica${separator}Valor`);
        lines.push(`Total de Tickets${separator}${result.total}`);
        lines.push(`Tickets Fechados${separator}${result.closed}`);
        lines.push(`Taxa de Resolução${separator}${result.closedRate.toFixed(1)}%`);
        lines.push(`Tempo Médio Resolução (h)${separator}${result.avgResolutionTime.toFixed(1)}`);
        lines.push(`Tempo 1ª Resposta (h)${separator}${result.avgFirstResponse.toFixed(1)}`);
        lines.push(`Tickets Parados${separator}${result.staleTickets}`);
        lines.push('');
        
        // Por Time
        lines.push('=== POR TIME ===');
        lines.push(`Time${separator}Total${separator}Fechados${separator}Taxa${separator}Urgentes`);
        Object.entries(result.byTeam).forEach(([team, data]) => {
            const rate = data.total > 0 ? (data.closed / data.total * 100).toFixed(1) : '0';
            lines.push(`${team}${separator}${data.total}${separator}${data.closed}${separator}${rate}%${separator}${data.urgent}`);
        });
        lines.push('');
        
        // Por Agente
        lines.push('=== POR AGENTE ===');
        lines.push(`Agente${separator}Total${separator}Fechados${separator}Taxa${separator}Tempo Médio (h)`);
        Object.entries(result.byAgent).forEach(([agent, data]) => {
            const rate = data.total > 0 ? (data.closed / data.total * 100).toFixed(1) : '0';
            const avgTime = data.timeCount > 0 ? (data.totalTime / data.timeCount).toFixed(1) : '0';
            lines.push(`${agent}${separator}${data.total}${separator}${data.closed}${separator}${rate}%${separator}${avgTime}`);
        });
        lines.push('');
        
        // Por Prioridade
        lines.push('=== POR PRIORIDADE ===');
        lines.push(`Prioridade${separator}Quantidade`);
        const priorityLabels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
        Object.entries(result.byPriority).forEach(([p, count]) => {
            lines.push(`${priorityLabels[p]}${separator}${count}`);
        });
        
        // Criar e baixar arquivo
        const csvContent = '\uFEFF' + lines.join('\n'); // BOM para UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${this.currentReport}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        console.log('📥 Relatório exportado para CSV/Excel');
    },
    
    exportToPDF(reportInfo, result) {
        // Criar versão para impressão
        const printWindow = window.open('', '_blank');
        const priorityLabels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${reportInfo.name} - Relatório</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                    h1 { color: #1e1e2e; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
                    h2 { color: #3b82f6; margin-top: 30px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                    .kpi { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
                    .kpi-value { font-size: 2rem; font-weight: bold; color: #3b82f6; }
                    .kpi-label { color: #666; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background: #3b82f6; color: white; }
                    tr:nth-child(even) { background: #f8f9fa; }
                    .success { color: #10b981; }
                    .warning { color: #f59e0b; }
                    .danger { color: #ef4444; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${reportInfo.icon} ${reportInfo.name}</h1>
                    <div>
                        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                </div>
                
                <div class="kpi-grid">
                    <div class="kpi">
                        <div class="kpi-value">${result.total}</div>
                        <div class="kpi-label">Total de Tickets</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-value success">${result.closedRate.toFixed(1)}%</div>
                        <div class="kpi-label">Taxa de Resolução</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-value">${result.avgResolutionTime.toFixed(1)}h</div>
                        <div class="kpi-label">Tempo Médio Resolução</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-value">${result.avgFirstResponse.toFixed(1)}h</div>
                        <div class="kpi-label">Tempo 1ª Resposta</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-value warning">${result.staleTickets}</div>
                        <div class="kpi-label">Tickets Parados</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-value danger">${result.urgent}</div>
                        <div class="kpi-label">Urgentes</div>
                    </div>
                </div>
                
                <h2>📊 Por Time</h2>
                <table>
                    <tr><th>Time</th><th>Total</th><th>Fechados</th><th>Taxa</th><th>Urgentes</th></tr>
                    ${Object.entries(result.byTeam).map(([team, data]) => `
                        <tr>
                            <td>${team}</td>
                            <td>${data.total}</td>
                            <td>${data.closed}</td>
                            <td>${data.total > 0 ? (data.closed / data.total * 100).toFixed(1) : 0}%</td>
                            <td>${data.urgent}</td>
                        </tr>
                    `).join('')}
                </table>
                
                <h2>👤 Top Agentes</h2>
                <table>
                    <tr><th>Agente</th><th>Total</th><th>Fechados</th><th>Taxa</th></tr>
                    ${Object.entries(result.byAgent)
                        .map(([agent, data]) => ({
                            agent,
                            ...data,
                            rate: data.total > 0 ? (data.closed / data.total * 100) : 0
                        }))
                        .sort((a, b) => b.rate - a.rate)
                        .slice(0, 10)
                        .map(a => `
                            <tr>
                                <td>${a.agent}</td>
                                <td>${a.total}</td>
                                <td>${a.closed}</td>
                                <td>${a.rate.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                </table>
                
                <h2>🎯 Por Prioridade</h2>
                <table>
                    <tr><th>Prioridade</th><th>Quantidade</th><th>%</th></tr>
                    ${Object.entries(result.byPriority).map(([p, count]) => `
                        <tr>
                            <td>${priorityLabels[p]}</td>
                            <td>${count}</td>
                            <td>${result.total > 0 ? (count / result.total * 100).toFixed(1) : 0}%</td>
                        </tr>
                    `).join('')}
                </table>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        console.log('📄 Relatório aberto para impressão/PDF');
    },
    
    // =====================================================
    // GRÁFICOS E VISUALIZAÇÕES
    // =====================================================
    
    drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;
        
        // Limpar canvas
        ctx.fillStyle = this.colors.card;
        ctx.fillRect(0, 0, width, height);
        
        if (Object.keys(data).length === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados para exibir', width / 2, height / 2);
            return;
        }
        
        const labels = Object.keys(data).sort();
        const values = labels.map(l => data[l]);
        const maxValue = Math.max(...values, 1);
        
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const stepX = chartWidth / (labels.length - 1 || 1);
        
        // Grid
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxValue - (maxValue / 5) * i), padding - 10, y + 4);
        }
        
        // Linha principal
        ctx.beginPath();
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 3;
        
        labels.forEach((label, i) => {
            const x = padding + stepX * i;
            const y = padding + chartHeight - (values[i] / maxValue * chartHeight);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Pontos
        labels.forEach((label, i) => {
            const x = padding + stepX * i;
            const y = padding + chartHeight - (values[i] / maxValue * chartHeight);
            
            ctx.beginPath();
            ctx.fillStyle = this.colors.primary;
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Label do eixo X
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(x, height - 10);
            ctx.rotate(-0.5);
            ctx.fillText(label.substring(5), 0, 0); // MM-DD
            ctx.restore();
        });
        
        // Título
        if (options.title) {
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(options.title, width / 2, 20);
        }
    },
    
    drawBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;
        
        ctx.fillStyle = this.colors.card;
        ctx.fillRect(0, 0, width, height);
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        if (labels.length === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados para exibir', width / 2, height / 2);
            return;
        }
        
        const maxValue = Math.max(...values, 1);
        const barWidth = Math.min(60, (width - padding * 2) / labels.length - 10);
        const chartHeight = height - padding * 2;
        
        labels.forEach((label, i) => {
            const barHeight = (values[i] / maxValue) * chartHeight;
            const x = padding + i * (barWidth + 10);
            const y = height - padding - barHeight;
            
            // Barra
            ctx.fillStyle = this.colors.chartColors[i % this.colors.chartColors.length];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Valor
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(values[i], x + barWidth / 2, y - 5);
            
            // Label
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '11px Arial';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding + 10);
            ctx.rotate(-0.5);
            ctx.fillText(label.substring(0, 12), 0, 0);
            ctx.restore();
        });
        
        if (options.title) {
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(options.title, width / 2, 20);
        }
    },
    
    drawHeatmap(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.fillStyle = this.colors.card;
        ctx.fillRect(0, 0, width, height);
        
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hours = Array.from({length: 24}, (_, i) => i);
        
        const cellWidth = (width - 60) / 24;
        const cellHeight = (height - 60) / 7;
        const maxValue = Math.max(...Object.values(data), 1);
        
        // Células
        days.forEach((day, dayIdx) => {
            hours.forEach(hour => {
                const key = `${dayIdx}-${hour}`;
                const value = data[key] || 0;
                const intensity = value / maxValue;
                
                const x = 50 + hour * cellWidth;
                const y = 40 + dayIdx * cellHeight;
                
                // Cor baseada na intensidade
                const r = Math.round(30 + intensity * 225);
                const g = Math.round(40 + (1 - intensity) * 100);
                const b = Math.round(50 + (1 - intensity) * 150);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);
                
                // Valor se significativo
                if (value > 0) {
                    ctx.fillStyle = intensity > 0.5 ? 'white' : this.colors.textMuted;
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(value, x + cellWidth / 2, y + cellHeight / 2 + 4);
                }
            });
            
            // Label do dia
            ctx.fillStyle = this.colors.text;
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(day, 45, 40 + dayIdx * cellHeight + cellHeight / 2 + 4);
        });
        
        // Labels das horas
        hours.forEach(hour => {
            if (hour % 3 === 0) {
                ctx.fillStyle = this.colors.textMuted;
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${hour}h`, 50 + hour * cellWidth + cellWidth / 2, 35);
            }
        });
        
        // Título
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Volume por Dia da Semana e Hora', width / 2, 18);
    },
    
    // =====================================================
    // PROCESSAMENTO ESPECÍFICO POR TIPO DE RELATÓRIO
    // =====================================================
    
    processHeatmapData(data) {
        const heatmap = {};
        data.forEach(t => {
            const date = new Date(t.created_at);
            const day = date.getDay();
            const hour = date.getHours();
            const key = `${day}-${hour}`;
            heatmap[key] = (heatmap[key] || 0) + 1;
        });
        return heatmap;
    },
    
    processCSATData(data) {
        // Buscar dados de satisfação se disponíveis
        let csatData = { ratings: [], avgRating: 0, negative: 0, positive: 0, neutral: 0 };
        
        data.forEach(t => {
            if (t.satisfaction_rating || t.survey_rating || t.csat_rating) {
                const rating = t.satisfaction_rating || t.survey_rating || t.csat_rating;
                csatData.ratings.push({
                    ticket_id: t.id,
                    rating: rating,
                    agent: t.cf_tratativa,
                    team: t.cf_grupo_tratativa
                });
                
                if (rating <= 2) csatData.negative++;
                else if (rating >= 4) csatData.positive++;
                else csatData.neutral++;
            }
        });
        
        if (csatData.ratings.length > 0) {
            csatData.avgRating = csatData.ratings.reduce((sum, r) => sum + r.rating, 0) / csatData.ratings.length;
        }
        
        return csatData;
    },
    
    processBacklogData(data) {
        const now = new Date();
        const aging = {
            '0-3 dias': 0,
            '4-7 dias': 0,
            '8-14 dias': 0,
            '15-30 dias': 0,
            '30+ dias': 0
        };
        
        const openTickets = data.filter(t => ![4, 5].includes(t.status));
        
        openTickets.forEach(t => {
            const created = new Date(t.created_at);
            const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
            
            if (days <= 3) aging['0-3 dias']++;
            else if (days <= 7) aging['4-7 dias']++;
            else if (days <= 14) aging['8-14 dias']++;
            else if (days <= 30) aging['15-30 dias']++;
            else aging['30+ dias']++;
        });
        
        return { aging, totalOpen: openTickets.length, critical: aging['30+ dias'] };
    },
    
    processSLAByPriority(data) {
        const slaPriority = { 1: [], 2: [], 3: [], 4: [] };
        
        data.forEach(t => {
            if (t.resolved_at && t.created_at && t.priority) {
                const hours = (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                if (hours > 0 && hours < 720) {
                    slaPriority[t.priority]?.push(hours);
                }
            }
        });
        
        // Metas de SLA por prioridade (em horas)
        const slaMetas = { 1: 72, 2: 48, 3: 24, 4: 4 };
        
        const result = {};
        Object.entries(slaPriority).forEach(([p, times]) => {
            if (times.length > 0) {
                const avg = times.reduce((a, b) => a + b, 0) / times.length;
                const withinSLA = times.filter(t => t <= slaMetas[p]).length;
                result[p] = {
                    avg: avg,
                    total: times.length,
                    withinSLA: withinSLA,
                    compliance: (withinSLA / times.length * 100)
                };
            }
        });
        
        return result;
    }
};

console.log('✅ Módulo de Relatórios v2.0 carregado');
