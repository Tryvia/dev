/**
 * Modo Apresentação V2 - Simplificado e Funcional
 * Facilita a visualização de dados de BI em reuniões
 */

class PresentationModeV2 {
    constructor() {
        this.selectedTeam = null;
        this.selectedPeople = new Set();
        this.availableTeams = [];
        this.teamMembers = {};
        this.startDate = null;
        this.endDate = null;
        this.selectedPeriod = 'all'; // Período selecionado atual
        this.dataMode = 'tratativa'; // 'tratativa' ou 'tags'
        
        // Lista de pessoas permitidas para acompanhamento (usa TEAM_MEMBERS_CONFIG)
        this.allowedPeople = [
            'Adriana Florencio', 'Alianie Lanes', 'Andreia Ribeiro',
            'Francisco Nascimento', 'Gabriel Oliveira', 'Gustavo Martins',
            'João Peres', 'Jéssica Dias', 'Marciele Quintanilha'
        ];
        
        this.filteredData = [];
        this.previousPeriodData = []; // Dados do período anterior para comparativo
        this.isPresenting = false;
        this.currentSlide = 0;
        this.chartBars = []; // Para armazenar posições das barras para tooltip
        
        // Sistema de animação
        this.animationProgress = 0;
        this.animationFrame = null;
        this.isAnimating = false;
        
        // Sistema de anotações
        this.isDrawingMode = false;
        this.annotations = [];
        this.currentPath = [];
        this.drawingColor = '#ef4444';
        this.drawingWidth = 3;
        
        // Modo apresentador
        this.presenterWindow = null;
        
        this.availableSlides = [
            // Visão Geral
            { id: 'overview', title: 'Visão Geral', icon: '📊', type: 'kpi', category: 'geral' },
            { id: 'chartTop10', title: 'Top 10 - Volume', icon: '🏆', type: 'chart', category: 'geral' },
            { id: 'chartStatus', title: 'Por Status', icon: '📈', type: 'chart', category: 'geral' },
            { id: 'chartPriority', title: 'Por Prioridade', icon: '⚡', type: 'chart', category: 'geral' },
            { id: 'chartTimeline', title: 'Timeline', icon: '📅', type: 'chart', category: 'geral' },
            { id: 'chartSystems', title: 'Por Sistema/Produto', icon: '💻', type: 'chart', category: 'geral' },
            
            // Performance / SLA
            { id: 'chartResolution', title: 'Taxa de Resolução', icon: '✅', type: 'chart', category: 'performance' },
            { id: 'chartSLA', title: 'Conformidade SLA', icon: '⏱️', type: 'chart', category: 'performance' },
            { id: 'chartTempoMedio', title: 'Tempo Médio Resolução', icon: '⏳', type: 'chart', category: 'performance' },
            { id: 'chartFirstResponse', title: 'First Response Time', icon: '💬', type: 'chart', category: 'performance' },
            { id: 'chartCSAT', title: 'Satisfação (CSAT)', icon: '⭐', type: 'chart', category: 'performance' },
            
            // Produtividade
            { id: 'chartByDayOfWeek', title: 'Por Dia da Semana', icon: '🗓️', type: 'chart', category: 'produtividade' },
            { id: 'chartByHour', title: 'Por Hora do Dia', icon: '⏰', type: 'chart', category: 'produtividade' },
            { id: 'chartHeatmap', title: 'Heatmap Semanal', icon: '🔥', type: 'chart', category: 'produtividade' },
            { id: 'chartBacklog', title: 'Backlog / Aging', icon: '📦', type: 'chart', category: 'produtividade' },
            { id: 'chartWorkload', title: 'Carga de Trabalho', icon: '📋', type: 'chart', category: 'produtividade' },
            
            // Comparativos
            { id: 'chartComparativoMensal', title: 'Comparativo Mensal', icon: '📊', type: 'chart', category: 'comparativo' },
            { id: 'chartTendencia', title: 'Tendência Semanal', icon: '📈', type: 'chart', category: 'comparativo' },
            
            // Rankings
            { id: 'chartRankingSLA', title: 'Ranking por SLA', icon: '🥇', type: 'chart', category: 'ranking' },
            { id: 'chartRankingResolucao', title: 'Ranking por Resolução', icon: '🏅', type: 'chart', category: 'ranking' },
            { id: 'chartEficiencia', title: 'Eficiência por Pessoa', icon: '⚡', type: 'chart', category: 'ranking' },
            
            // Pipeline
            { id: 'chartFunil', title: 'Funil de Status', icon: '🔄', type: 'chart', category: 'pipeline' },
            { id: 'chartParados', title: 'Tickets Parados', icon: '⚠️', type: 'chart', category: 'pipeline' },
            { id: 'chartAguardando', title: 'Aguardando Cliente', icon: '👤', type: 'chart', category: 'pipeline' },
            
            // Acompanhamento (Tags)
            { id: 'chartAcompanhamento', title: 'Acompanhamento (Tags)', icon: '🏷️', type: 'chart', category: 'acompanhamento' },
            { id: 'chartAcompanhamentoResolucao', title: 'Resolução por Acomp.', icon: '✅', type: 'chart', category: 'acompanhamento' },
            
            // Tempo Registrado
            { id: 'chartTempoRegistrado', title: 'Tempo Registrado', icon: '⏰', type: 'chart', category: 'tempo' },
            { id: 'chartTempoAgente', title: 'Tempo por Agente', icon: '👤', type: 'chart', category: 'tempo' },
        ];
        
        this.selectedSlides = new Set(this.availableSlides.map(s => s.id));
        
        this.colors = {
            bg: '#0a0a1a',
            surface: '#1a1a2e',
            surfaceHover: '#252542',
            primary: '#667eea',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            text: '#e2e8f0',
            textMuted: '#94a3b8',
            border: '#334155'
        };
        
        // Status do Freshdesk - Usar módulo centralizado se disponível
        this.statusMap = window.FRESHDESK_STATUS?.MAP ? 
            Object.fromEntries(Object.entries(window.FRESHDESK_STATUS.MAP).map(([k, v]) => [k, { 
                label: v.label, 
                color: v.color, 
                group: v.category === 'resolved' ? 'resolved' : 
                       v.category === 'open' ? 'open' : 
                       v.category === 'pending' ? 'pending' : 
                       v.category === 'waiting' || v.category === 'waiting_deploy' ? 'pending' : 'open'
            }])) : {
            2:  { label: 'Aberto', color: '#3b82f6', group: 'open' },
            3:  { label: 'Pendente', color: '#f59e0b', group: 'pending' },
            4:  { label: 'Resolvido', color: '#10b981', group: 'resolved' },
            5:  { label: 'Fechado', color: '#6b7280', group: 'closed' },
            6:  { label: 'Em Homologação', color: '#8b5cf6', group: 'pending' },
            7:  { label: 'Aguardando Cliente', color: '#f59e0b', group: 'pending' },
            8:  { label: 'Em Tratativa', color: '#06b6d4', group: 'open' },
            10: { label: 'Em Análise', color: '#06b6d4', group: 'open' },
            11: { label: 'Interno', color: '#64748b', group: 'open' },
            12: { label: 'Aguardando Publicar HML', color: '#3b82f6', group: 'pending' },
            13: { label: 'Aguardando Publicar PROD', color: '#8b5cf6', group: 'pending' },
            14: { label: 'MVP', color: '#ec4899', group: 'pending' },
            15: { label: 'Validação-Atendimento', color: '#f97316', group: 'open' },
            16: { label: 'Aguardando Parceiros', color: '#a855f7', group: 'pending' },
            17: { label: 'Pausado', color: '#64748b', group: 'pending' },
            18: { label: 'Validação-CS', color: '#f97316', group: 'open' },
            19: { label: 'Levantamento de Esforço', color: '#6366f1', group: 'open' },
            20: { label: 'Em Fila DEV', color: '#ef4444', group: 'open' },
            21: { label: 'Em Produção', color: '#10b981', group: 'closed' }
        };
    }
    
    render() {
        const container = document.getElementById('presentation-container');
        if (!container) return;
        
        this.detectTeamsAndPeople();
        
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        if (!this.startDate) this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
        if (!this.endDate) this.endDate = today.toISOString().split('T')[0];
        
        container.innerHTML = this.buildHTML();
        this.applyFilters();
        
        // Inicializar Date Range Picker
        this.initDateRangePicker();
    }
    
    initDateRangePicker() {
        setTimeout(() => {
            const startInput = document.getElementById('filterStartDate');
            const endInput = document.getElementById('filterEndDate');
            
            if (startInput && endInput && window.dateRangePicker) {
                window.dateRangePicker.attachTo(startInput, endInput, (start, end) => {
                    this.startDate = start.toISOString().split('T')[0];
                    this.endDate = end.toISOString().split('T')[0];
                    this.applyFilters();
                });
            }
        }, 100);
    }
    
    buildHTML() {
        return `
        <div class="presentation-premium">
            <div class="pres-header">
                <div>
                    <h1><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Modo Apresentação</h1>
                    <p>Apresente os dados de BI em reuniões com estilo profissional</p>
                </div>
                <button onclick="presentationModeV2.startPresentation()" class="btn-start-presentation">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Iniciar Apresentação
                </button>
            </div>
            
            <div class="pres-layout">
                ${this.buildSidebar()}
                ${this.buildMainArea()}
            </div>
        </div>`;
    }
    
    buildSidebar() {
        return `
        <div class="pres-sidebar">
            <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg> Filtros de Dados</h3>
            
            <div class="pres-filter-section">
                <label class="pres-filter-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    Modo de Dados
                </label>
                <div class="pres-mode-buttons">
                    <button onclick="presentationModeV2.setDataMode('tratativa')" class="pres-mode-btn ${this.dataMode === 'tratativa' ? 'active' : ''}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                        Tratativa
                    </button>
                    <button onclick="presentationModeV2.setDataMode('tags')" class="pres-mode-btn ${this.dataMode === 'tags' ? 'active' : ''}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        Tags
                    </button>
                </div>
            </div>
            
            <div class="pres-filter-section">
                <label class="pres-filter-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Período
                </label>
                <div class="pres-period-buttons">
                    ${this.renderPeriodButtonPremium(7, '7 dias')}
                    ${this.renderPeriodButtonPremium(30, '30 dias')}
                    ${this.renderPeriodButtonPremium(90, '90 dias')}
                    ${this.renderPeriodButtonPremium('month', 'Este mês')}
                    ${this.renderPeriodButtonPremium('year', 'Este ano')}
                    ${this.renderPeriodButtonPremium('all', 'Tudo')}
                </div>
                <div class="pres-date-range">
                    <input type="date" id="filterStartDate" value="${this.startDate}" onchange="presentationModeV2.setStartDate(this.value)" class="pres-date-input">
                    <span>—</span>
                    <input type="date" id="filterEndDate" value="${this.endDate}" onchange="presentationModeV2.setEndDate(this.value)" class="pres-date-input">
                </div>
            </div>
            
            <div class="pres-filter-section">
                <label class="pres-filter-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Time
                </label>
                <select id="filterTeam" onchange="presentationModeV2.setTeam(this.value)" class="pres-select">
                    <option value="">Todos os Times</option>
                    ${this.availableTeams.map(t => `<option value="${t}" ${this.selectedTeam === t ? 'selected' : ''}>${t} (${this.teamMembers[t]?.length || 0})</option>`).join('')}
                </select>
            </div>
            
            <div class="pres-filter-section">
                <div class="pres-people-header">
                    <label class="pres-filter-label" style="margin-bottom:0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                        Pessoas ${this.selectedTeam ? `(${this.selectedPeople.size})` : ''}
                    </label>
                    ${this.selectedTeam ? `<div class="pres-people-actions">
                        <button onclick="presentationModeV2.selectAllPeople()" class="pres-people-btn select-all">Todos</button>
                        <button onclick="presentationModeV2.clearPeople()" class="pres-people-btn clear">Limpar</button>
                    </div>` : ''}
                </div>
                <div class="pres-people-list">
                    ${this.renderPeopleListPremium()}
                </div>
            </div>
            
            <button onclick="presentationModeV2.applyFilters()" class="btn-apply-filters">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Aplicar Filtros
            </button>
            
            <div class="pres-status-box">
                ${this.renderDataStatusPremium()}
            </div>
            
            <hr class="pres-divider">
            
            <h3 style="font-size:0.95rem;margin-bottom:0.75rem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Slides
            </h3>
            <div style="max-height:400px;overflow-y:auto;padding-right:0.5rem">
            ${this.renderSlideCategoryPremium('geral', 'Visão Geral', '#667eea')}
            ${this.renderSlideCategoryPremium('performance', 'Performance / SLA', '#10b981')}
            ${this.renderSlideCategoryPremium('produtividade', 'Produtividade', '#f59e0b')}
            ${this.renderSlideCategoryPremium('comparativo', 'Comparativos', '#8b5cf6')}
            ${this.renderSlideCategoryPremium('ranking', 'Rankings', '#ec4899')}
            ${this.renderSlideCategoryPremium('pipeline', 'Pipeline', '#06b6d4')}
            ${this.renderSlideCategoryPremium('acompanhamento', 'Acompanhamento', '#f472b6')}
            ${this.renderSlideCategoryPremium('tempo', 'Tempo', '#14b8a6')}
            </div>
        </div>`;
    }
    
    renderSlideCategory(category, title, color) {
        const slides = this.availableSlides.filter(s => s.category === category);
        if (!slides.length) return '';
        return `
        <div style="margin-bottom:0.75rem">
            <div style="font-size:0.7rem;color:${color};font-weight:600;margin-bottom:0.4rem;text-transform:uppercase">${title}</div>
            ${slides.map(s => `
                <label style="display:flex;align-items:center;gap:0.4rem;padding:0.3rem 0.4rem;background:${this.selectedSlides.has(s.id) ? color + '20' : 'transparent'};border-radius:5px;cursor:pointer;font-size:0.8rem">
                    <input type="checkbox" ${this.selectedSlides.has(s.id) ? 'checked' : ''} onchange="presentationModeV2.toggleSlide('${s.id}')" style="accent-color:${color};width:14px;height:14px">
                    <span>${s.icon} ${s.title}</span>
                </label>
            `).join('')}
        </div>`;
    }
    
    // === FUNÇÕES PREMIUM ===
    
    renderPeriodButtonPremium(value, label) {
        const isActive = this.selectedPeriod == value;
        return `<button onclick="presentationModeV2.setPeriod('${value}')" class="pres-period-btn ${isActive ? 'active' : ''}">${label}</button>`;
    }
    
    setPeriod(period) {
        // Usa a função existente setQuickPeriod
        this.setQuickPeriod(period);
        // Atualiza os botões premium
        this.updatePeriodButtonsPremium();
    }
    
    updatePeriodButtonsPremium() {
        const container = document.querySelector('.pres-period-buttons');
        if (container) {
            container.innerHTML = `
                ${this.renderPeriodButtonPremium(7, '7 dias')}
                ${this.renderPeriodButtonPremium(30, '30 dias')}
                ${this.renderPeriodButtonPremium(90, '90 dias')}
                ${this.renderPeriodButtonPremium('month', 'Este mês')}
                ${this.renderPeriodButtonPremium('year', 'Este ano')}
                ${this.renderPeriodButtonPremium('all', 'Tudo')}
            `;
        }
    }
    
    renderPeopleListPremium() {
        if (!this.selectedTeam) {
            return `<p style="color:#64748b;font-size:0.85rem;margin:0;text-align:center;padding:1.25rem">Selecione um time para ver as pessoas</p>`;
        }
        const people = this.teamMembers[this.selectedTeam] || [];
        if (!people.length) {
            return `<p style="color:#64748b;font-size:0.85rem;margin:0;text-align:center;padding:1.25rem">Nenhuma pessoa encontrada</p>`;
        }
        return people.map(p => `
            <label class="pres-person-item ${this.selectedPeople.has(p) ? 'selected' : ''}">
                <input type="checkbox" ${this.selectedPeople.has(p) ? 'checked' : ''} onchange="presentationModeV2.togglePerson('${p.replace(/'/g, "\\'")}')">
                <span>${p}</span>
            </label>
        `).join('');
    }
    
    renderDataStatusPremium() {
        const total = window.allTicketsCache?.length || 0;
        const filtered = this.filteredData.length;
        const periodText = (!this.startDate || this.startDate === '') ? 'Todo período' : 
            `${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`;
        const modeIcon = this.dataMode === 'tratativa' ? 
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>' :
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>';
        const modeText = this.dataMode === 'tratativa' ? 'Tratativa' : 'Tags';
        
        return `
            <div class="pres-status-row">
                <span class="pres-status-label">Modo</span>
                <span class="pres-status-value highlight" style="display:flex;align-items:center;gap:0.35rem">${modeIcon} ${modeText}</span>
            </div>
            <div class="pres-status-row">
                <span class="pres-status-label">Total</span>
                <span class="pres-status-value">${total.toLocaleString()}</span>
            </div>
            <div class="pres-status-row">
                <span class="pres-status-label">Filtrado</span>
                <span class="pres-status-value success">${filtered.toLocaleString()}</span>
            </div>
            <div class="pres-status-row">
                <span class="pres-status-label">Período</span>
                <span class="pres-status-value" style="font-size:0.8rem;color:#f59e0b">${periodText}</span>
            </div>
            ${this.selectedTeam ? `
            <div class="pres-status-row">
                <span class="pres-status-label">${this.dataMode === 'tags' ? 'Grupo' : 'Time'}</span>
                <span class="pres-status-value highlight">${this.selectedTeam}</span>
            </div>` : ''}
        `;
    }
    
    renderSlideCategoryPremium(category, title, color) {
        const slides = this.availableSlides.filter(s => s.category === category);
        if (!slides.length) return '';
        return `
        <div class="pres-slides-section">
            <div class="pres-slides-category" style="color:${color}">${title}</div>
            ${slides.map(s => `
                <label class="pres-slide-item ${this.selectedSlides.has(s.id) ? 'selected' : ''}" style="${this.selectedSlides.has(s.id) ? `background:${color}20` : ''}">
                    <input type="checkbox" ${this.selectedSlides.has(s.id) ? 'checked' : ''} onchange="presentationModeV2.toggleSlide('${s.id}')" style="accent-color:${color}">
                    <span>${s.icon} ${s.title}</span>
                </label>
            `).join('')}
        </div>`;
    }
    
    buildMainArea() {
        return `
        <div class="pres-main">
            <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                Preview dos Slides
                <span class="pres-slides-count">${this.selectedSlides.size} selecionados</span>
            </h3>
            <div id="slidesPreview" class="pres-slides-grid">
                ${this.renderSlidesPreviewPremium()}
            </div>
        </div>`;
    }
    
    renderSlidesPreviewPremium() {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        if (!slides.length) {
            return `<div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;background:rgba(102,126,234,0.05);border-radius:16px;border:1px dashed rgba(102,126,234,0.3)">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="1.5" style="margin-bottom:1rem;opacity:0.5">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <p style="color:#94a3b8;font-size:1rem;margin:0">Selecione slides na sidebar para visualizar</p>
            </div>`;
        }
        return slides.map((s, i) => this.renderSlideCardPremium(s, i)).join('');
    }
    
    renderSlideCardPremium(slide, index) {
        return `
        <div class="pres-slide-card" style="animation-delay:${index * 0.05}s">
            <div class="pres-slide-header">
                <div class="pres-slide-number">${index + 1}</div>
                <span class="pres-slide-icon">${slide.icon}</span>
                <span class="pres-slide-title">${slide.title}</span>
            </div>
            <div class="pres-slide-content">
                ${this.renderSlideContentPremium(slide)}
            </div>
        </div>`;
    }
    
    renderSlideContentPremium(slide) {
        if (slide.type === 'kpi') {
            return this.renderKPIPreviewPremium();
        }
        return `<canvas id="preview-${slide.id}" width="320" height="180" class="pres-chart-canvas"></canvas>`;
    }
    
    renderKPIPreviewPremium() {
        const total = this.filteredData.length;
        const resolved = this.filteredData.filter(t => [4,5].includes(Number(t.status))).length;
        const open = this.filteredData.filter(t => Number(t.status) === 2).length;
        const pending = this.filteredData.filter(t => [3,6,7,17].includes(Number(t.status))).length;
        
        return `
        <div class="pres-kpi-grid">
            <div class="pres-kpi-card total">
                <div class="pres-kpi-value blue">${total.toLocaleString()}</div>
                <div class="pres-kpi-label">Total</div>
            </div>
            <div class="pres-kpi-card open">
                <div class="pres-kpi-value yellow">${open.toLocaleString()}</div>
                <div class="pres-kpi-label">Abertos</div>
            </div>
            <div class="pres-kpi-card resolved">
                <div class="pres-kpi-value green">${resolved.toLocaleString()}</div>
                <div class="pres-kpi-label">Resolvidos</div>
            </div>
            <div class="pres-kpi-card pending">
                <div class="pres-kpi-value purple">${pending.toLocaleString()}</div>
                <div class="pres-kpi-label">Pendentes</div>
            </div>
        </div>`;
    }
    
    detectTeamsAndPeople() {
        const data = window.allTicketsCache || [];
        this.availableTeams = [];
        this.teamMembers = {};
        
        const teamSet = new Set();
        const peopleByTeam = {};
        
        if (this.dataMode === 'tags') {
            // Modo Tags: usa a lista fixa de pessoas permitidas (mesma do BI Acompanhamento)
            teamSet.add('Acompanhamento');
            peopleByTeam['Acompanhamento'] = new Set(this.allowedPeople);
        } else {
            // Modo Tratativa: usa campos customizados
            data.forEach(ticket => {
                const team = this.getField(ticket, 'cf_grupo_tratativa');
                const person = this.getField(ticket, 'cf_tratativa');
                
                if (team) {
                    team.split(/[,;\/]/).map(t => t.trim()).filter(t => t).forEach(t => {
                        teamSet.add(t);
                        if (!peopleByTeam[t]) peopleByTeam[t] = new Set();
                        if (person) {
                            person.split(/[,;\/]/).map(p => p.trim()).filter(p => p).forEach(p => peopleByTeam[t].add(p));
                        }
                    });
                }
            });
        }
        
        this.availableTeams = Array.from(teamSet).sort();
        for (const team of this.availableTeams) {
            this.teamMembers[team] = Array.from(peopleByTeam[team] || []).sort();
        }
    }
    
    setDataMode(mode) {
        this.dataMode = mode;
        this.selectedTeam = null;
        this.selectedPeople.clear();
        this.detectTeamsAndPeople();
        
        // No modo Tags, selecionar automaticamente o grupo "Acompanhamento" e todas as pessoas
        if (mode === 'tags') {
            this.selectedTeam = 'Acompanhamento';
            this.allowedPeople.forEach(p => this.selectedPeople.add(p));
        }
        
        this.render();
        this.showToast(`📊 Modo alterado para: ${mode === 'tratativa' ? 'Tratativa' : 'Tags'}`);
    }
    
    getField(ticket, fieldName) {
        const variants = [fieldName, fieldName + '1684353202918'];
        for (const v of variants) {
            if (ticket[v]) return ticket[v];
            if (ticket.custom_fields?.[v]) return ticket.custom_fields[v];
        }
        return null;
    }
    
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    getTagsArray(ticket) {
        if (!ticket.tags) return [];
        let tags = ticket.tags;
        
        if (Array.isArray(tags)) {
            return tags.map(t => String(t).trim()).filter(t => t);
        }
        
        if (typeof tags === 'string') {
            tags = tags.trim();
            if ((tags.startsWith('[') && tags.endsWith(']'))) {
                try {
                    const parsed = JSON.parse(tags);
                    if (Array.isArray(parsed)) {
                        return parsed.map(t => String(t).trim()).filter(t => t);
                    }
                } catch (e) {
                    let cleanedTags = tags.replace(/^\[|\]$/g, '');
                    return cleanedTags.split(',').map(t => t.replace(/^"|"$/g, '').trim()).filter(t => t);
                }
            }
            return tags.split(/[,;\/]/).map(t => t.trim()).filter(t => t);
        }
        
        return [];
    }
    
    renderPeopleList() {
        if (!this.selectedTeam) return `<p style="color:${this.colors.textMuted};font-size:0.85rem;margin:0;text-align:center;padding:1rem">Selecione um time</p>`;
        const people = this.teamMembers[this.selectedTeam] || [];
        if (!people.length) return `<p style="color:${this.colors.textMuted};font-size:0.85rem;margin:0;text-align:center;padding:1rem">Nenhuma pessoa</p>`;
        return people.map(p => `
            <label style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0.5rem;cursor:pointer;border-radius:4px">
                <input type="checkbox" ${this.selectedPeople.has(p) ? 'checked' : ''} onchange="presentationModeV2.togglePerson('${p.replace(/'/g, "\\'")}')" style="accent-color:${this.colors.primary}">
                <span style="font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p}</span>
            </label>
        `).join('');
    }
    
    renderDataStatus() {
        const total = window.allTicketsCache?.length || 0;
        const filtered = this.filteredData.length;
        const periodText = (!this.startDate || this.startDate === '') ? 'Todo período' : 
            `${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`;
        const modeText = this.dataMode === 'tratativa' ? '👤 Tratativa' : '🏷️ Tags';
        const modeColor = this.dataMode === 'tratativa' ? '#8b5cf6' : '#ec4899';
        return `<div style="display:flex;flex-direction:column;gap:0.5rem">
            <div style="display:flex;justify-content:space-between"><span style="color:${this.colors.textMuted}">Modo:</span><span style="font-weight:600;color:${modeColor}">${modeText}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:${this.colors.textMuted}">Total:</span><span style="font-weight:600">${total.toLocaleString()}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:${this.colors.textMuted}">Filtrado:</span><span style="font-weight:600;color:${this.colors.success}">${filtered.toLocaleString()}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:${this.colors.textMuted}">Período:</span><span style="font-weight:600;color:${this.colors.warning};font-size:0.75rem">${periodText}</span></div>
            ${this.selectedTeam ? `<div style="display:flex;justify-content:space-between"><span style="color:${this.colors.textMuted}">${this.dataMode === 'tags' ? 'Grupo:' : 'Time:'}</span><span style="font-weight:600;color:${this.colors.primary}">${this.selectedTeam}</span></div>` : ''}
        </div>`;
    }
    
    renderSlidesPreview() {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        if (!slides.length) return `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:${this.colors.textMuted}">📭 Nenhum slide selecionado</div>`;
        return slides.map((s, i) => `
            <div style="background:${this.colors.surface};border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.3)">
                <div style="padding:0.75rem 1rem;background:linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2));display:flex;align-items:center;gap:0.75rem">
                    <span style="background:${this.colors.primary};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem">${i + 1}</span>
                    <span style="font-weight:600">${s.icon} ${s.title}</span>
                </div>
                <div style="aspect-ratio:16/9;background:${this.colors.bg};display:flex;align-items:center;justify-content:center">
                    <canvas id="preview-${s.id}" width="400" height="225" style="width:100%;height:100%"></canvas>
                </div>
            </div>
        `).join('');
    }
    
    setStartDate(date) { 
        this.startDate = date;
        this.selectedPeriod = 'custom';
        this.updatePeriodUI();
        this.applyFilters();
    }
    
    setEndDate(date) { 
        this.endDate = date;
        this.selectedPeriod = 'custom';
        this.updatePeriodUI();
        this.applyFilters();
    }
    
    renderPeriodButton(period, label) {
        const isSelected = this.selectedPeriod == period;
        const bgColor = isSelected ? `${this.colors.primary}30` : this.colors.bg;
        const borderColor = isSelected ? this.colors.primary : this.colors.border;
        const textColor = isSelected ? this.colors.primary : this.colors.textMuted;
        const fontWeight = isSelected ? '600' : 'normal';
        
        return `<button onclick="presentationModeV2.setQuickPeriod('${period}')" 
            style="padding:0.3rem 0.6rem;background:${bgColor};border:1px solid ${borderColor};
            border-radius:4px;color:${textColor};font-size:0.7rem;cursor:pointer;font-weight:${fontWeight};
            transition:all 0.2s">${label}</button>`;
    }
    
    setQuickPeriod(period) {
        this.selectedPeriod = period;
        
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        let start = new Date(today);
        
        if (period === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (period === 'year') {
            start = new Date(today.getFullYear(), 0, 1);
        } else if (period === 'all') {
            this.startDate = null;
            this.endDate = null;
            this.updatePeriodUI();
            this.applyFilters();
            return;
        } else {
            const days = parseInt(period);
            start.setDate(start.getDate() - days + 1);
        }
        
        this.startDate = start.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];
        
        this.updatePeriodUI();
        this.applyFilters();
    }
    
    updatePeriodUI() {
        // Atualizar inputs de data
        const startInput = document.getElementById('filterStartDate');
        const endInput = document.getElementById('filterEndDate');
        
        if (startInput) startInput.value = this.startDate || '';
        if (endInput) endInput.value = this.endDate || '';
        
        // Atualizar botões de período
        const container = document.getElementById('periodButtons');
        if (container) {
            container.innerHTML = `
                ${this.renderPeriodButton(7, '7 dias')}
                ${this.renderPeriodButton(30, '30 dias')}
                ${this.renderPeriodButton(90, '90 dias')}
                ${this.renderPeriodButton('month', 'Este mês')}
                ${this.renderPeriodButton('year', 'Este ano')}
                ${this.renderPeriodButton('all', 'Tudo')}
            `;
        }
    }
    
    setTeam(team) {
        this.selectedTeam = team || null;
        this.selectedPeople.clear();
        if (team && this.teamMembers[team]) {
            this.teamMembers[team].forEach(p => this.selectedPeople.add(p));
        }
        this.render();
    }
    
    togglePerson(person) {
        if (this.selectedPeople.has(person)) this.selectedPeople.delete(person);
        else this.selectedPeople.add(person);
        // Atualizar visualmente o item (sem re-renderizar toda a lista)
        const list = document.querySelector('.pres-people-list');
        if (list) list.innerHTML = this.renderPeopleListPremium();
    }
    
    selectAllPeople() {
        if (this.selectedTeam && this.teamMembers[this.selectedTeam]) {
            this.teamMembers[this.selectedTeam].forEach(p => this.selectedPeople.add(p));
            const list = document.querySelector('.pres-people-list');
            if (list) list.innerHTML = this.renderPeopleListPremium();
        }
    }
    
    clearPeople() {
        this.selectedPeople.clear();
        const list = document.querySelector('.pres-people-list');
        if (list) list.innerHTML = this.renderPeopleListPremium();
    }
    
    toggleSlide(id) {
        if (this.selectedSlides.has(id)) this.selectedSlides.delete(id);
        else this.selectedSlides.add(id);
        const preview = document.getElementById('slidesPreview');
        if (preview) {
            preview.innerHTML = this.renderSlidesPreviewPremium();
        }
        // Atualizar contador
        const counter = document.querySelector('.pres-slides-count');
        if (counter) counter.textContent = `${this.selectedSlides.size} selecionados`;
        setTimeout(() => this.renderAllPreviews(), 100);
    }
    
    applyFilters() {
        const allData = window.allTicketsCache || [];
        
        this.filteredData = allData.filter(ticket => {
            // Filtro de período (só aplica se tiver datas definidas)
            if (this.startDate && this.startDate !== '') {
                const ticketDate = new Date(ticket.created_at);
                if (ticketDate < new Date(this.startDate)) return false;
            }
            if (this.endDate && this.endDate !== '') {
                const ticketDate = new Date(ticket.created_at);
                const end = new Date(this.endDate);
                end.setHours(23, 59, 59, 999);
                if (ticketDate > end) return false;
            }
            
            if (this.dataMode === 'tags') {
                // Modo Tags: filtra por tags que correspondem às pessoas selecionadas
                if (this.selectedPeople.size > 0) {
                    const tags = this.getTagsArray(ticket);
                    
                    // Verifica se alguma tag corresponde a uma pessoa selecionada
                    const hasMatchingPerson = tags.some(tag => {
                        const normalizedTag = this.removeAccents(tag.toLowerCase().trim());
                        return Array.from(this.selectedPeople).some(person => {
                            const normalizedPerson = this.removeAccents(person.toLowerCase().trim());
                            return normalizedTag.includes(normalizedPerson) || 
                                   normalizedPerson.includes(normalizedTag);
                        });
                    });
                    
                    if (!hasMatchingPerson) return false;
                }
            } else {
                // Modo Tratativa: usa campos customizados
                if (this.selectedTeam) {
                    const team = this.getField(ticket, 'cf_grupo_tratativa');
                    if (!team || !team.includes(this.selectedTeam)) return false;
                }
                
                if (this.selectedPeople.size > 0 && this.selectedTeam) {
                    const person = this.getField(ticket, 'cf_tratativa');
                    if (!person) return false;
                    const ticketPeople = person.split(/[,;\/]/).map(p => p.trim()).filter(p => p);
                    if (!ticketPeople.some(p => this.selectedPeople.has(p))) return false;
                }
            }
            
            return true;
        });
        
        // Atualizar status - versão premium
        const dataStatusEl = document.querySelector('.pres-status-box');
        if (dataStatusEl) dataStatusEl.innerHTML = this.renderDataStatusPremium();
        
        // Atualizar preview dos slides
        const preview = document.getElementById('slidesPreview');
        if (preview) preview.innerHTML = this.renderSlidesPreviewPremium();
        
        setTimeout(() => this.renderAllPreviews(), 100);
        this.showToast(`✅ ${this.filteredData.length.toLocaleString()} tickets filtrados`);
    }
    
    renderAllPreviews() {
        this.availableSlides.forEach(s => {
            if (this.selectedSlides.has(s.id)) this.renderPreview(s.id);
        });
    }
    
    showToast(msg) {
        const existing = document.getElementById('pToast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'pToast';
        toast.className = 'pres-toast';
        toast.innerHTML = msg;
        document.body.appendChild(toast);
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ========== RENDER PREVIEW ==========
    renderPreview(slideId) {
        const canvas = document.getElementById(`preview-${slideId}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, w, h);
        const data = this.filteredData;
        if (!data.length) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados', w / 2, h / 2);
            return;
        }
        this.drawChart(ctx, w, h, slideId, data);
    }
    
    drawChart(ctx, w, h, slideId, data, isFullscreen = false) {
        this.chartBars = []; // Reset bars
        switch (slideId) {
            // Visão Geral
            case 'overview': this.drawOverview(ctx, w, h, data); break;
            case 'chartTop10': this.drawTop10(ctx, w, h, data, isFullscreen); break;
            case 'chartStatus': this.drawStatus(ctx, w, h, data); break;
            case 'chartPriority': this.drawPriority(ctx, w, h, data, isFullscreen); break;
            case 'chartTimeline': this.drawTimeline(ctx, w, h, data, isFullscreen); break;
            case 'chartSystems': this.drawSystems(ctx, w, h, data, isFullscreen); break;
            // Performance
            case 'chartResolution': this.drawResolution(ctx, w, h, data); break;
            case 'chartSLA': this.drawSLA(ctx, w, h, data); break;
            case 'chartTempoMedio': this.drawTempoMedio(ctx, w, h, data, isFullscreen); break;
            case 'chartFirstResponse': this.drawFirstResponse(ctx, w, h, data, isFullscreen); break;
            case 'chartCSAT': this.drawCSAT(ctx, w, h, data, isFullscreen); break;
            // Produtividade
            case 'chartByDayOfWeek': this.drawByDayOfWeek(ctx, w, h, data, isFullscreen); break;
            case 'chartByHour': this.drawByHour(ctx, w, h, data, isFullscreen); break;
            case 'chartHeatmap': this.drawHeatmap(ctx, w, h, data, isFullscreen); break;
            case 'chartBacklog': this.drawBacklog(ctx, w, h, data, isFullscreen); break;
            case 'chartWorkload': this.drawWorkload(ctx, w, h, data, isFullscreen); break;
            // Comparativos
            case 'chartComparativoMensal': this.drawComparativoMensal(ctx, w, h, data, isFullscreen); break;
            case 'chartTendencia': this.drawTendencia(ctx, w, h, data, isFullscreen); break;
            // Rankings
            case 'chartRankingSLA': this.drawRankingSLA(ctx, w, h, data, isFullscreen); break;
            case 'chartRankingResolucao': this.drawRankingResolucao(ctx, w, h, data, isFullscreen); break;
            case 'chartEficiencia': this.drawEficiencia(ctx, w, h, data, isFullscreen); break;
            // Pipeline
            case 'chartFunil': this.drawFunil(ctx, w, h, data, isFullscreen); break;
            case 'chartParados': this.drawParados(ctx, w, h, data, isFullscreen); break;
            case 'chartAguardando': this.drawAguardando(ctx, w, h, data, isFullscreen); break;
            // Acompanhamento
            case 'chartAcompanhamento': this.drawAcompanhamento(ctx, w, h, data, isFullscreen); break;
            case 'chartAcompanhamentoResolucao': this.drawAcompanhamentoResolucao(ctx, w, h, data, isFullscreen); break;
            // Tempo
            case 'chartTempoRegistrado': this.drawTempoRegistrado(ctx, w, h, data, isFullscreen); break;
            case 'chartTempoAgente': this.drawTempoAgente(ctx, w, h, data, isFullscreen); break;
        }
    }
    
    drawOverview(ctx, w, h, data) {
        const total = data.length;
        // Usar grupos de status
        const resolved = data.filter(t => {
            const s = this.statusMap[t.status];
            return s && (s.group === 'resolved' || s.group === 'closed');
        }).length;
        const pending = data.filter(t => {
            const s = this.statusMap[t.status];
            return s && s.group === 'pending';
        }).length;
        const open = data.filter(t => {
            const s = this.statusMap[t.status];
            return s && s.group === 'open';
        }).length;
        const cards = [
            { label: 'Total', value: total, color: this.colors.primary },
            { label: 'Abertos', value: open, color: this.colors.danger },
            { label: 'Resolvidos', value: resolved, color: this.colors.success },
            { label: 'Pendentes', value: pending, color: this.colors.warning }
        ];
        const cw = (w - 50) / 4, ch = 70, sy = (h - ch) / 2;
        cards.forEach((c, i) => {
            const x = 10 + i * (cw + 10);
            ctx.fillStyle = c.color + '30';
            ctx.beginPath(); ctx.roundRect(x, sy, cw, ch, 8); ctx.fill();
            ctx.strokeStyle = c.color; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = c.color;
            ctx.font = 'bold 22px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(c.value.toLocaleString(), x + cw / 2, sy + 32);
            ctx.fillStyle = this.colors.text;
            ctx.font = '11px system-ui';
            ctx.fillText(c.label, x + cw / 2, sy + 52);
        });
    }
    
    drawTop10(ctx, w, h, data, isFullscreen = false) {
        const map = new Map();
        
        // Obter whitelist do time selecionado (se configurado)
        const teamConfig = window.TEAM_MEMBERS_CONFIG || {};
        const whitelist = this.selectedTeam && teamConfig[this.selectedTeam] 
            ? new Set(teamConfig[this.selectedTeam]) 
            : null;
        
        data.forEach(t => {
            const p = this.getField(t, 'cf_tratativa');
            if (p) {
                p.split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(x => {
                    // Se temos whitelist, filtrar apenas pessoas permitidas
                    if (!whitelist || whitelist.has(x)) {
                        map.set(x, (map.get(x) || 0) + 1);
                    }
                });
            }
        });
        const topN = isFullscreen ? 10 : 5;
        const topItems = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, topN);
        if (!topItems.length) return;
        const maxVal = topItems[0][1];
        const barH = isFullscreen ? 35 : 25;
        const pad = isFullscreen ? { top: 30, left: 200, right: 80 } : { top: 20, left: 120, right: 50 };
        const gap = isFullscreen ? 12 : 8;
        
        // Paleta premium
        const premiumColors = [
            { main: '#6366f1', glow: '#818cf8', dark: '#4f46e5' },
            { main: '#8b5cf6', glow: '#a78bfa', dark: '#7c3aed' },
            { main: '#3b82f6', glow: '#60a5fa', dark: '#2563eb' },
            { main: '#06b6d4', glow: '#22d3ee', dark: '#0891b2' },
            { main: '#10b981', glow: '#34d399', dark: '#059669' },
            { main: '#f59e0b', glow: '#fbbf24', dark: '#d97706' },
            { main: '#ec4899', glow: '#f472b6', dark: '#db2777' },
            { main: '#f97316', glow: '#fb923c', dark: '#ea580c' },
            { main: '#14b8a6', glow: '#2dd4bf', dark: '#0d9488' },
            { main: '#a855f7', glow: '#c084fc', dark: '#9333ea' },
        ];
        const borderRadius = isFullscreen ? 8 : 6;
        const chartWidth = w - pad.left - pad.right;
        
        topItems.forEach(([name, count], i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(8, (count / maxVal) * chartWidth);
            const colorSet = premiumColors[i % premiumColors.length];
            
            ctx.save();
            
            // Fundo (track)
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.roundRect(pad.left, y, chartWidth, barH, borderRadius);
            ctx.fill();
            
            // Sombra premium
            ctx.shadowColor = colorSet.glow;
            ctx.shadowBlur = isFullscreen ? 14 : 8;
            ctx.shadowOffsetY = 2;
            
            // Gradiente premium
            const grad = ctx.createLinearGradient(pad.left, y, pad.left + bw, y);
            grad.addColorStop(0, colorSet.dark);
            grad.addColorStop(0.3, colorSet.main);
            grad.addColorStop(0.7, colorSet.main);
            grad.addColorStop(1, colorSet.glow);
            
            // Barra principal
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(pad.left, y, bw, barH, borderRadius);
            ctx.fill();
            
            // Glass effect
            const glassGrad = ctx.createLinearGradient(0, y, 0, y + barH);
            glassGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
            glassGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            glassGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.roundRect(pad.left, y, bw, barH, borderRadius);
            ctx.fill();
            
            ctx.restore();
            
            // Armazenar posição para tooltip
            if (isFullscreen) {
                this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: count, label: name });
            }
            
            // Nome
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = isFullscreen ? '500 14px system-ui' : '500 11px system-ui';
            ctx.textAlign = 'right';
            const maxNameLen = isFullscreen ? 25 : 15;
            ctx.fillText(name.length > maxNameLen ? name.slice(0, maxNameLen - 2) + '..' : name, pad.left - 10, y + barH / 2 + 5);
            
            // Valor
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 16px system-ui' : 'bold 11px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(count.toString(), pad.left + bw + 10, y + barH / 2 + 5);
        });
    }
    
    drawStatus(ctx, w, h, data) {
        // Agrupar por grupos de status
        const groupCounts = { open: 0, pending: 0, resolved: 0, closed: 0 };
        data.forEach(t => {
            const s = this.statusMap[t.status];
            if (s) groupCounts[s.group] = (groupCounts[s.group] || 0) + 1;
        });
        const groupMap = {
            open: { label: 'Abertos', color: '#ef4444' },
            pending: { label: 'Pendentes', color: '#f59e0b' },
            resolved: { label: 'Resolvidos', color: '#10b981' },
            closed: { label: 'Fechados', color: '#059669' }
        };
        const items = Object.entries(groupCounts).filter(([, c]) => c > 0).map(([g, c]) => ({ ...groupMap[g], count: c }));
        if (!items.length) return;
        const total = items.reduce((s, i) => s + i.count, 0);
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 40;
        let startAngle = -Math.PI / 2;
        items.forEach(item => {
            const slice = (item.count / total) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, startAngle, startAngle + slice);
            ctx.fillStyle = item.color; ctx.fill();
            startAngle += slice;
        });
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.bg; ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(total.toLocaleString(), cx, cy + 6);
    }
    
    drawPriority(ctx, w, h, data, isFullscreen = false) {
        // Paleta premium semântica para prioridades
        const pMap = { 
            1: { label: 'Baixa', main: '#10b981', glow: '#34d399', dark: '#059669' }, 
            2: { label: 'Média', main: '#3b82f6', glow: '#60a5fa', dark: '#2563eb' }, 
            3: { label: 'Alta', main: '#f59e0b', glow: '#fbbf24', dark: '#d97706' }, 
            4: { label: 'Urgente', main: '#ef4444', glow: '#f87171', dark: '#dc2626' } 
        };
        const counts = {};
        data.forEach(t => { const p = t.priority || 2; counts[p] = (counts[p] || 0) + 1; });
        const items = Object.entries(counts).map(([p, c]) => ({ ...pMap[p], count: c, priority: p })).filter(i => i.count > 0);
        if (!items.length) return;
        const maxCount = Math.max(...items.map(i => i.count));
        const pad = isFullscreen ? { left: 80, right: 80, top: 60, bottom: 80 } : { left: 30, right: 30, top: 30, bottom: 25 };
        const gap = isFullscreen ? 40 : 15;
        const barW = (w - pad.left - pad.right - gap * (items.length - 1)) / items.length;
        const chartH = h - pad.top - pad.bottom;
        const borderRadius = isFullscreen ? 10 : 6;
        
        items.forEach((item, i) => {
            const x = pad.left + i * (barW + gap);
            const barH = Math.max(4, (item.count / maxCount) * chartH);
            const y = h - pad.bottom - barH;
            
            ctx.save();
            
            // Fundo (track)
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.roundRect(x, pad.top, barW, chartH, borderRadius);
            ctx.fill();
            
            // Sombra premium
            ctx.shadowColor = item.glow;
            ctx.shadowBlur = isFullscreen ? 16 : 10;
            ctx.shadowOffsetY = -2;
            
            // Gradiente premium vertical
            const grad = ctx.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, item.glow);
            grad.addColorStop(0.3, item.main);
            grad.addColorStop(0.7, item.main);
            grad.addColorStop(1, item.dark);
            
            // Barra principal
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, [borderRadius, borderRadius, 3, 3]);
            ctx.fill();
            
            // Glass effect
            const glassGrad = ctx.createLinearGradient(x, y, x + barW, y);
            glassGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
            glassGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            glassGrad.addColorStop(1, 'rgba(255,255,255,0.15)');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, [borderRadius, borderRadius, 3, 3]);
            ctx.fill();
            
            ctx.restore();
            
            // Armazenar para tooltip
            if (isFullscreen) {
                this.chartBars.push({ x, y, w: barW, h: barH, value: item.count, label: item.label });
            }
            
            // Valor acima da barra
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = isFullscreen ? 'bold 20px system-ui' : 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(item.count.toString(), x + barW / 2, y - 10);
            
            // Label abaixo
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = isFullscreen ? '500 16px system-ui' : '500 10px system-ui';
            ctx.fillText(item.label, x + barW / 2, h - (isFullscreen ? 40 : 10));
        });
    }
    
    drawResolution(ctx, w, h, data) {
        const resolved = data.filter(t => {
            const s = this.statusMap[t.status];
            return s && (s.group === 'resolved' || s.group === 'closed');
        }).length;
        const rate = (resolved / (data.length || 1)) * 100;
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 35;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0.75 * Math.PI, 2.25 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.stroke();
        const progressAngle = 0.75 * Math.PI + (rate / 100) * 1.5 * Math.PI;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0.75 * Math.PI, progressAngle);
        ctx.strokeStyle = '#10b981'; ctx.stroke();
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 28px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`${rate.toFixed(1)}%`, cx, cy + 8);
        ctx.font = '11px system-ui'; ctx.fillStyle = this.colors.textMuted;
        ctx.fillText('Resolução', cx, cy + 28);
    }
    
    drawSLA(ctx, w, h, data) {
        const SLA = 4 * 60 * 60 * 1000;
        let within = 0, outside = 0;
        data.forEach(t => {
            const first = t.stats_first_responded_at || t.stats_first_response_at;
            if (!first || !t.created_at) return;
            if (new Date(first) - new Date(t.created_at) <= SLA) within++; else outside++;
        });
        const total = within + outside;
        if (!total) { ctx.fillStyle = this.colors.textMuted; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Sem dados SLA', w / 2, h / 2); return; }
        const rate = (within / total) * 100;
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 35;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 20; ctx.stroke();
        const angle = (rate / 100) * Math.PI * 2 - Math.PI / 2;
        const color = rate >= 90 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#ef4444';
        ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, angle);
        ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 26px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`${rate.toFixed(1)}%`, cx, cy + 8);
        ctx.font = '11px system-ui'; ctx.fillStyle = this.colors.textMuted;
        ctx.fillText('SLA', cx, cy + 28);
    }
    
    drawTimeline(ctx, w, h, data, isFullscreen = false) {
        const byDay = {};
        data.forEach(t => {
            const date = new Date(t.created_at);
            if (isNaN(date.getTime())) return;
            const key = date.toISOString().split('T')[0];
            byDay[key] = (byDay[key] || 0) + 1;
        });
        const days = Object.keys(byDay).sort().slice(-14);
        if (!days.length) return;
        const values = days.map(d => byDay[d]);
        const maxVal = Math.max(...values, 1);
        const pad = isFullscreen ? { top: 40, bottom: 60, left: 60, right: 40 } : { top: 20, bottom: 30, left: 30, right: 20 };
        const chartW = w - pad.left - pad.right, chartH = h - pad.top - pad.bottom;
        const gap = isFullscreen ? 10 : 5;
        const barW = Math.max(8, (chartW - gap * (values.length - 1)) / values.length);
        const borderRadius = isFullscreen ? 6 : 4;
        
        // Paleta premium para timeline
        const colorSet = { main: '#667eea', glow: '#818cf8', dark: '#4f46e5' };
        
        // Limpar e armazenar posições das barras para tooltip (só no fullscreen)
        if (isFullscreen) this.chartBars = [];
        
        values.forEach((val, i) => {
            const x = pad.left + i * (barW + gap);
            const barH = Math.max(4, (val / maxVal) * chartH);
            const y = pad.top + chartH - barH;
            
            ctx.save();
            
            // Fundo (track)
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.roundRect(x, pad.top, barW, chartH, borderRadius);
            ctx.fill();
            
            // Sombra premium
            ctx.shadowColor = colorSet.glow;
            ctx.shadowBlur = isFullscreen ? 12 : 6;
            ctx.shadowOffsetY = -2;
            
            // Gradiente premium
            const grad = ctx.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, colorSet.glow);
            grad.addColorStop(0.3, colorSet.main);
            grad.addColorStop(0.7, colorSet.main);
            grad.addColorStop(1, colorSet.dark);
            
            // Barra principal
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, [borderRadius, borderRadius, 2, 2]);
            ctx.fill();
            
            // Glass effect
            const glassGrad = ctx.createLinearGradient(x, y, x + barW, y);
            glassGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
            glassGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            glassGrad.addColorStop(1, 'rgba(255,255,255,0.15)');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, [borderRadius, borderRadius, 2, 2]);
            ctx.fill();
            
            ctx.restore();
            
            // Armazenar posição para tooltip (fullscreen)
            if (isFullscreen) {
                const dateLabel = new Date(days[i]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                this.chartBars.push({ x, y, w: barW, h: barH, value: val, label: dateLabel });
                
                // Mostrar valor SEMPRE acima da barra
                if (val > 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.95)';
                    ctx.font = 'bold 11px system-ui';
                    ctx.textAlign = 'center';
                    ctx.fillText(val.toString(), x + barW / 2, y - 6);
                }
            }
            
            // Mostrar data no eixo X (fullscreen)
            if (isFullscreen && (i % 2 === 0 || values.length <= 10)) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '500 12px system-ui';
                ctx.textAlign = 'center';
                const dateLabel = new Date(days[i]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                ctx.fillText(dateLabel, x + barW / 2, h - 20);
            }
        });
        
        // Eixo Y com valores (fullscreen)
        if (isFullscreen) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 4; i++) {
                const val = Math.round((maxVal / 4) * i);
                const y = pad.top + chartH - (chartH / 4) * i;
                ctx.fillText(val.toString(), pad.left - 10, y + 4);
                // Linha de grade
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.moveTo(pad.left, y);
                ctx.lineTo(w - pad.right, y);
                ctx.stroke();
            }
        }
    }
    
    // ========== NOVOS GRÁFICOS DE PRODUTIVIDADE ==========
    
    drawTempoMedio(ctx, w, h, data, isFullscreen = false) {
        // Calcular tempo médio de resolução
        const resolvedTickets = data.filter(t => {
            const s = this.statusMap[t.status];
            return s && (s.group === 'resolved' || s.group === 'closed') && t.created_at && (t.resolved_at || t.updated_at);
        });
        
        if (resolvedTickets.length === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados de resolução', w / 2, h / 2);
            return;
        }
        
        const tempos = resolvedTickets.map(t => {
            const created = new Date(t.created_at);
            const resolved = new Date(t.resolved_at || t.updated_at);
            return (resolved - created) / (1000 * 60 * 60); // Em horas
        }).filter(t => t > 0 && t < 720); // Até 30 dias
        
        const avgHours = tempos.reduce((a, b) => a + b, 0) / tempos.length;
        
        // Distribuição por faixas de tempo
        const faixas = [
            { label: '< 4h', min: 0, max: 4, color: '#10b981', count: 0 },
            { label: '4-24h', min: 4, max: 24, color: '#3b82f6', count: 0 },
            { label: '1-3 dias', min: 24, max: 72, color: '#f59e0b', count: 0 },
            { label: '3-7 dias', min: 72, max: 168, color: '#f97316', count: 0 },
            { label: '> 7 dias', min: 168, max: Infinity, color: '#ef4444', count: 0 }
        ];
        
        tempos.forEach(t => {
            const faixa = faixas.find(f => t >= f.min && t < f.max);
            if (faixa) faixa.count++;
        });
        
        const items = faixas.filter(f => f.count > 0);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const pad = isFullscreen ? { left: 100, right: 60, top: 80, bottom: 80 } : { left: 60, right: 30, top: 50, bottom: 40 };
        const gap = isFullscreen ? 20 : 10;
        const barW = (w - pad.left - pad.right - gap * (items.length - 1)) / items.length;
        const chartH = h - pad.top - pad.bottom;
        
        // Título com média
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 18px system-ui' : 'bold 12px system-ui';
        ctx.textAlign = 'center';
        const avgText = avgHours < 24 ? `${avgHours.toFixed(1)}h` : `${(avgHours / 24).toFixed(1)} dias`;
        ctx.fillText(`Tempo Médio: ${avgText}`, w / 2, isFullscreen ? 40 : 25);
        
        items.forEach((item, i) => {
            const x = pad.left + i * (barW + gap);
            const barH = (item.count / maxCount) * chartH;
            const y = h - pad.bottom - barH;
            ctx.fillStyle = item.color;
            ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 6); ctx.fill();
            
            if (isFullscreen) this.chartBars.push({ x, y, w: barW, h: barH, value: item.count, label: item.label });
            
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? 'bold 16px system-ui' : 'bold 11px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(item.count.toString(), x + barW / 2, y - 8);
            ctx.font = isFullscreen ? '14px system-ui' : '10px system-ui';
            ctx.fillText(item.label, x + barW / 2, h - (isFullscreen ? 40 : 15));
        });
    }
    
    drawByDayOfWeek(ctx, w, h, data, isFullscreen = false) {
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        
        data.forEach(t => {
            const date = new Date(t.created_at);
            if (!isNaN(date.getTime())) counts[date.getDay()]++;
        });
        
        const maxCount = Math.max(...counts, 1);
        const pad = isFullscreen ? { left: 80, right: 60, top: 50, bottom: 80 } : { left: 40, right: 30, top: 30, bottom: 40 };
        const gap = isFullscreen ? 15 : 8;
        const barW = (w - pad.left - pad.right - gap * 6) / 7;
        const chartH = h - pad.top - pad.bottom;
        const colors = ['#ef4444', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#ef4444'];
        
        counts.forEach((count, i) => {
            const x = pad.left + i * (barW + gap);
            const barH = (count / maxCount) * chartH;
            const y = h - pad.bottom - barH;
            ctx.fillStyle = colors[i];
            ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 6); ctx.fill();
            
            if (isFullscreen) this.chartBars.push({ x, y, w: barW, h: barH, value: count, label: diasSemana[i] });
            
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(count.toString(), x + barW / 2, y - 6);
            ctx.font = isFullscreen ? '14px system-ui' : '10px system-ui';
            ctx.fillText(diasSemana[i], x + barW / 2, h - (isFullscreen ? 40 : 15));
        });
    }
    
    drawByHour(ctx, w, h, data, isFullscreen = false) {
        const hours = new Array(24).fill(0);
        
        data.forEach(t => {
            const date = new Date(t.created_at);
            if (!isNaN(date.getTime())) hours[date.getHours()]++;
        });
        
        const maxCount = Math.max(...hours, 1);
        const pad = isFullscreen ? { left: 60, right: 40, top: 40, bottom: 60 } : { left: 30, right: 20, top: 20, bottom: 35 };
        const chartH = h - pad.top - pad.bottom;
        const barW = (w - pad.left - pad.right) / 24 - 2;
        
        hours.forEach((count, i) => {
            const x = pad.left + i * (barW + 2);
            const barH = (count / maxCount) * chartH;
            const y = pad.top + chartH - barH;
            
            // Cor baseada em horário comercial
            const isBusinessHour = i >= 8 && i <= 18;
            const grad = ctx.createLinearGradient(x, y, x, y + barH);
            if (isBusinessHour) {
                grad.addColorStop(0, '#10b981'); grad.addColorStop(1, '#059669');
            } else {
                grad.addColorStop(0, '#6366f1'); grad.addColorStop(1, '#4f46e5');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barW, barH);
            
            if (isFullscreen) {
                this.chartBars.push({ x, y, w: barW, h: barH, value: count, label: `${i}:00` });
                
                // Mostrar valor SEMPRE acima da barra (não apenas no hover)
                if (count > 0 && barH > 20) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px system-ui';
                    ctx.textAlign = 'center';
                    ctx.fillText(count.toString(), x + barW / 2, y - 5);
                }
            }
            
            // Labels apenas em algumas horas
            if (i % (isFullscreen ? 3 : 6) === 0) {
                ctx.fillStyle = this.colors.textMuted;
                ctx.font = isFullscreen ? '11px system-ui' : '9px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(`${i}h`, x + barW / 2, h - (isFullscreen ? 25 : 12));
            }
        });
    }
    
    drawBacklog(ctx, w, h, data, isFullscreen = false) {
        // Tickets abertos agrupados por idade
        const now = new Date();
        const openTickets = data.filter(t => {
            const s = this.statusMap[t.status];
            return s && (s.group === 'open' || s.group === 'pending');
        });
        
        const faixas = [
            { label: 'Hoje', min: 0, max: 1, color: '#10b981', count: 0 },
            { label: '1-3 dias', min: 1, max: 3, color: '#3b82f6', count: 0 },
            { label: '3-7 dias', min: 3, max: 7, color: '#f59e0b', count: 0 },
            { label: '7-15 dias', min: 7, max: 15, color: '#f97316', count: 0 },
            { label: '15-30 dias', min: 15, max: 30, color: '#ef4444', count: 0 },
            { label: '> 30 dias', min: 30, max: Infinity, color: '#dc2626', count: 0 }
        ];
        
        openTickets.forEach(t => {
            const created = new Date(t.created_at);
            const ageDays = (now - created) / (1000 * 60 * 60 * 24);
            const faixa = faixas.find(f => ageDays >= f.min && ageDays < f.max);
            if (faixa) faixa.count++;
        });
        
        const items = faixas.filter(f => f.count > 0);
        if (items.length === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum ticket em backlog', w / 2, h / 2);
            return;
        }
        
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const pad = isFullscreen ? { left: 120, right: 60, top: 50, bottom: 60 } : { left: 70, right: 30, top: 30, bottom: 30 };
        const gap = isFullscreen ? 12 : 6;
        const barH = isFullscreen ? 35 : 22;
        
        items.forEach((item, i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (item.count / maxCount) * (w - pad.left - pad.right));
            ctx.fillStyle = item.color;
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 6); ctx.fill();
            
            if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: item.count, label: item.label });
            
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? '13px system-ui' : '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(item.label, pad.left - 8, y + barH / 2 + 4);
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(item.count.toString(), pad.left + bw + 8, y + barH / 2 + 4);
        });
        
        // Total de backlog
        ctx.fillStyle = this.colors.textMuted;
        ctx.font = isFullscreen ? '14px system-ui' : '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Total em backlog: ${openTickets.length}`, w / 2, h - 15);
    }
    
    drawSystems(ctx, w, h, data, isFullscreen = false) {
        const systemMap = {};
        data.forEach(t => {
            const sys = this.getField(t, 'cf_sistema') || this.getField(t, 'cf_produto') || 'N/A';
            systemMap[sys] = (systemMap[sys] || 0) + 1;
        });
        
        const sorted = Object.entries(systemMap).sort((a, b) => b[1] - a[1]).slice(0, isFullscreen ? 8 : 5);
        if (sorted.length === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados de sistema', w / 2, h / 2);
            return;
        }
        
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea'];
        const total = sorted.reduce((s, [, v]) => s + v, 0);
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) / 2 - (isFullscreen ? 60 : 40);
        
        let startAngle = -Math.PI / 2;
        sorted.forEach(([name, val], i) => {
            const slice = (val / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, startAngle + slice);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            // Label externo
            if (isFullscreen) {
                const midAngle = startAngle + slice / 2;
                const labelR = r + 25;
                const lx = cx + Math.cos(midAngle) * labelR;
                const ly = cy + Math.sin(midAngle) * labelR;
                ctx.fillStyle = this.colors.text;
                ctx.font = '12px system-ui';
                ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
                const displayName = name.length > 15 ? name.slice(0, 13) + '..' : name;
                ctx.fillText(`${displayName} (${val})`, lx, ly);
            }
            
            startAngle += slice;
        });
        
        // Centro
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.bg;
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 20px system-ui' : 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(total.toLocaleString(), cx, cy + 6);
    }
    
    // ========== NOVOS GRÁFICOS ==========
    
    drawFirstResponse(ctx, w, h, data, isFullscreen = false) {
        const ticketsWithFR = data.filter(t => t.stats_first_responded_at && t.created_at);
        if (!ticketsWithFR.length) {
            this.drawNoData(ctx, w, h, 'Sem dados de First Response');
            return;
        }
        const faixas = [
            { label: '< 1h', min: 0, max: 1, color: '#10b981', count: 0 },
            { label: '1-4h', min: 1, max: 4, color: '#3b82f6', count: 0 },
            { label: '4-8h', min: 4, max: 8, color: '#f59e0b', count: 0 },
            { label: '8-24h', min: 8, max: 24, color: '#f97316', count: 0 },
            { label: '> 24h', min: 24, max: Infinity, color: '#ef4444', count: 0 }
        ];
        let totalHours = 0;
        ticketsWithFR.forEach(t => {
            const hours = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            if (hours > 0) {
                totalHours += hours;
                const f = faixas.find(fx => hours >= fx.min && hours < fx.max);
                if (f) f.count++;
            }
        });
        const avgHours = totalHours / ticketsWithFR.length;
        const items = faixas.filter(f => f.count > 0);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const pad = isFullscreen ? { left: 80, right: 60, top: 70, bottom: 70 } : { left: 50, right: 30, top: 45, bottom: 35 };
        const gap = isFullscreen ? 15 : 8;
        const barW = (w - pad.left - pad.right - gap * (items.length - 1)) / items.length;
        const chartH = h - pad.top - pad.bottom;
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 16px system-ui' : 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Média: ${avgHours.toFixed(1)}h`, w / 2, isFullscreen ? 35 : 22);
        items.forEach((item, i) => {
            const x = pad.left + i * (barW + gap);
            const barH = (item.count / maxCount) * chartH;
            const y = h - pad.bottom - barH;
            ctx.fillStyle = item.color;
            ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 6); ctx.fill();
            if (isFullscreen) this.chartBars.push({ x, y, w: barW, h: barH, value: item.count, label: item.label });
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(item.count.toString(), x + barW / 2, y - 6);
            ctx.font = isFullscreen ? '12px system-ui' : '9px system-ui';
            ctx.fillText(item.label, x + barW / 2, h - (isFullscreen ? 35 : 12));
        });
    }
    
    drawCSAT(ctx, w, h, data, isFullscreen = false) {
        // Tentar obter dados do módulo BICSATModule primeiro
        const csatModule = window.BICSATModule;
        let csatData = csatModule?._csatCache || [];
        
        let satisfied = 0;
        let unsatisfied = 0;
        let total = 0;
        let csatPercent = 0;
        
        if (csatData.length > 0) {
            // Aplicar filtros de data
            if (this.startDate && this.startDate !== '') {
                const startMs = new Date(this.startDate).getTime();
                csatData = csatData.filter(r => new Date(r.created_at).getTime() >= startMs);
            }
            if (this.endDate && this.endDate !== '') {
                const end = new Date(this.endDate);
                end.setHours(23, 59, 59, 999);
                const endMs = end.getTime();
                csatData = csatData.filter(r => new Date(r.created_at).getTime() <= endMs);
            }
            
            // Aplicar filtro de time/pessoa via ticket_id
            // Se temos filtro de time, só incluir ratings de tickets que passaram no filtro
            if (this.selectedTeam && data.length > 0) {
                const ticketIds = new Set(data.map(t => t.id));
                csatData = csatData.filter(r => ticketIds.has(r.ticket_id));
            }
            
            // Calcular estatísticas
            csatData.forEach(rating => {
                const score = rating.rating || rating.score || 0;
                const isFreshdeskFormat = Math.abs(score) > 5;
                
                if (isFreshdeskFormat) {
                    if (score > 0) satisfied++;
                    else if (score < 0) unsatisfied++;
                } else if (score >= 1 && score <= 5) {
                    if (score >= 4) satisfied++;
                    else if (score <= 2) unsatisfied++;
                }
                total++;
            });
            csatPercent = total > 0 ? Math.round((satisfied / total) * 100) : 0;
        } else {
            // Fallback: buscar nos dados dos tickets filtrados
            const ratings = data.filter(t => t.satisfaction_rating).map(t => {
                const sr = t.satisfaction_rating;
                return typeof sr === 'object' ? sr.score : (typeof sr === 'number' ? sr : null);
            }).filter(r => r !== null && r !== 0);
            
            if (ratings.length > 0) {
                ratings.forEach(r => {
                    const isFreshdeskFormat = Math.abs(r) > 5;
                    if (isFreshdeskFormat) {
                        if (r > 0) satisfied++;
                        else if (r < 0) unsatisfied++;
                    } else {
                        if (r >= 4) satisfied++;
                        else if (r <= 2) unsatisfied++;
                    }
                    total++;
                });
                csatPercent = total > 0 ? Math.round((satisfied / total) * 100) : 0;
            }
        }
        
        if (total === 0) {
            this.drawNoData(ctx, w, h, 'Sem dados de satisfação');
            return;
        }
        
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - (isFullscreen ? 60 : 40);
        const color = csatPercent >= 85 ? '#10b981' : csatPercent >= 70 ? '#f59e0b' : '#ef4444';
        
        // Círculo de fundo
        ctx.beginPath(); 
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; 
        ctx.fill();
        
        // Arco de progresso
        ctx.beginPath(); 
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (csatPercent / 100) * Math.PI * 2);
        ctx.strokeStyle = color; 
        ctx.lineWidth = isFullscreen ? 25 : 18; 
        ctx.lineCap = 'round'; 
        ctx.stroke();
        
        // Percentual central
        ctx.fillStyle = color;
        ctx.font = isFullscreen ? 'bold 48px system-ui' : 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${csatPercent}%`, cx, cy + (isFullscreen ? 5 : 3));
        
        // Total de avaliações
        ctx.font = isFullscreen ? '14px system-ui' : '10px system-ui';
        ctx.fillStyle = this.colors.textMuted;
        ctx.fillText(`${total} avaliações`, cx, cy + (isFullscreen ? 35 : 22));
        
        // Satisfeitos / Insatisfeitos
        if (isFullscreen) {
            const infoY = cy + 70;
            ctx.font = '13px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.fillText(`😊 ${satisfied} satisfeitos`, cx - 80, infoY);
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`😞 ${unsatisfied} insatisfeitos`, cx + 80, infoY);
        }
    }
    
    drawHeatmap(ctx, w, h, data, isFullscreen = false) {
        const heatmap = {};
        for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) heatmap[`${d}-${h}`] = 0;
        data.forEach(t => {
            const date = new Date(t.created_at);
            if (!isNaN(date.getTime())) heatmap[`${date.getDay()}-${date.getHours()}`]++;
        });
        const maxVal = Math.max(...Object.values(heatmap), 1);
        const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const pad = isFullscreen ? { left: 50, right: 20, top: 30, bottom: 20 } : { left: 35, right: 10, top: 20, bottom: 10 };
        const cellW = (w - pad.left - pad.right) / 24;
        const cellH = (h - pad.top - pad.bottom) / 7;
        for (let d = 0; d < 7; d++) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = isFullscreen ? '11px system-ui' : '9px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(dias[d], pad.left - 5, pad.top + d * cellH + cellH / 2 + 4);
            for (let hr = 0; hr < 24; hr++) {
                const val = heatmap[`${d}-${hr}`];
                const intensity = val / maxVal;
                const x = pad.left + hr * cellW;
                const y = pad.top + d * cellH;
                ctx.fillStyle = `rgba(102, 126, 234, ${0.1 + intensity * 0.9})`;
                ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
                if (isFullscreen && val > 0) {
                    this.chartBars.push({ x: x + 1, y: y + 1, w: cellW - 2, h: cellH - 2, value: val, label: `${dias[d]} ${hr}h` });
                }
            }
        }
        for (let hr = 0; hr < 24; hr += (isFullscreen ? 3 : 6)) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = isFullscreen ? '10px system-ui' : '8px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${hr}h`, pad.left + hr * cellW + cellW / 2, pad.top - 6);
        }
    }
    
    drawWorkload(ctx, w, h, data, isFullscreen = false) {
        const openTickets = data.filter(t => {
            const s = this.statusMap[t.status];
            return s && (s.group === 'open' || s.group === 'pending');
        });
        
        // Obter whitelist do time selecionado (se configurado)
        const teamConfig = window.TEAM_MEMBERS_CONFIG || {};
        const whitelist = this.selectedTeam && teamConfig[this.selectedTeam] 
            ? new Set(teamConfig[this.selectedTeam]) 
            : null;
        
        const workload = {};
        openTickets.forEach(t => {
            const p = this.getField(t, 'cf_tratativa');
            if (p) p.split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(x => {
                if (!whitelist || whitelist.has(x)) {
                    workload[x] = (workload[x] || 0) + 1;
                }
            });
        });
        const sorted = Object.entries(workload).sort((a, b) => b[1] - a[1]).slice(0, isFullscreen ? 10 : 6);
        if (!sorted.length) { this.drawNoData(ctx, w, h, 'Sem tickets em aberto'); return; }
        const maxVal = sorted[0][1];
        const pad = isFullscreen ? { left: 180, right: 60, top: 30 } : { left: 100, right: 40, top: 20 };
        const barH = isFullscreen ? 32 : 22;
        const gap = isFullscreen ? 10 : 6;
        sorted.forEach(([name, count], i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (count / maxVal) * (w - pad.left - pad.right));
            const grad = ctx.createLinearGradient(pad.left, 0, pad.left + bw, 0);
            grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#ef4444');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 5); ctx.fill();
            if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: count, label: name });
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? '12px system-ui' : '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(name.length > 20 ? name.slice(0, 18) + '..' : name, pad.left - 8, y + barH / 2 + 4);
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 13px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(count.toString(), pad.left + bw + 8, y + barH / 2 + 4);
        });
    }
    
    drawComparativoMensal(ctx, w, h, data, isFullscreen = false) {
        const now = new Date();
        const thisMonth = now.getMonth();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const thisYear = now.getFullYear();
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        let thisMonthCount = 0, lastMonthCount = 0;
        data.forEach(t => {
            const d = new Date(t.created_at);
            if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) thisMonthCount++;
            else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) lastMonthCount++;
        });
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const items = [
            { label: months[lastMonth], value: lastMonthCount, color: '#64748b' },
            { label: months[thisMonth], value: thisMonthCount, color: '#667eea' }
        ];
        const maxVal = Math.max(...items.map(i => i.value), 1);
        const pad = isFullscreen ? { left: 100, right: 100, top: 60, bottom: 80 } : { left: 60, right: 60, top: 40, bottom: 50 };
        const barW = (w - pad.left - pad.right - 40) / 2;
        const chartH = h - pad.top - pad.bottom;
        const diff = lastMonthCount > 0 ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100) : 0;
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 16px system-ui' : 'bold 12px system-ui';
        ctx.textAlign = 'center';
        const diffColor = diff >= 0 ? '#10b981' : '#ef4444';
        ctx.fillStyle = diffColor;
        ctx.fillText(`${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, w / 2, isFullscreen ? 35 : 25);
        items.forEach((item, i) => {
            const x = pad.left + i * (barW + 40);
            const barH = (item.value / maxVal) * chartH;
            const y = h - pad.bottom - barH;
            ctx.fillStyle = item.color;
            ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 8); ctx.fill();
            if (isFullscreen) this.chartBars.push({ x, y, w: barW, h: barH, value: item.value, label: item.label });
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? 'bold 20px system-ui' : 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(item.value.toString(), x + barW / 2, y - 10);
            ctx.font = isFullscreen ? '16px system-ui' : '12px system-ui';
            ctx.fillText(item.label, x + barW / 2, h - (isFullscreen ? 40 : 20));
        });
    }
    
    drawTendencia(ctx, w, h, data, isFullscreen = false) {
        const weeks = [];
        const now = new Date();
        for (let i = 3; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(start.getDate() - (i + 1) * 7);
            const end = new Date(start);
            end.setDate(end.getDate() + 7);
            weeks.push({ start, end, count: 0, label: `Sem ${4 - i}` });
        }
        data.forEach(t => {
            const d = new Date(t.created_at);
            weeks.forEach(w => { if (d >= w.start && d < w.end) w.count++; });
        });
        const maxVal = Math.max(...weeks.map(w => w.count), 1);
        const pad = isFullscreen ? { left: 60, right: 40, top: 40, bottom: 60 } : { left: 40, right: 20, top: 25, bottom: 40 };
        const chartW = w - pad.left - pad.right;
        const chartH = h - pad.top - pad.bottom;
        const stepX = chartW / (weeks.length - 1);
        // Linha
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = isFullscreen ? 4 : 2;
        ctx.beginPath();
        weeks.forEach((wk, i) => {
            const x = pad.left + i * stepX;
            const y = pad.top + chartH - (wk.count / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // Pontos
        weeks.forEach((wk, i) => {
            const x = pad.left + i * stepX;
            const y = pad.top + chartH - (wk.count / maxVal) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, isFullscreen ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = '#667eea';
            ctx.fill();
            if (isFullscreen) this.chartBars.push({ x: x - 10, y: y - 10, w: 20, h: 20, value: wk.count, label: wk.label });
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(wk.count.toString(), x, y - (isFullscreen ? 15 : 10));
            ctx.font = isFullscreen ? '12px system-ui' : '9px system-ui';
            ctx.fillStyle = this.colors.textMuted;
            ctx.fillText(wk.label, x, h - (isFullscreen ? 25 : 15));
        });
    }
    
    drawRankingSLA(ctx, w, h, data, isFullscreen = false) {
        const SLA_LIMIT = 4 * 60 * 60 * 1000;
        
        // Obter whitelist do time selecionado (se configurado)
        const teamConfig = window.TEAM_MEMBERS_CONFIG || {};
        const whitelist = this.selectedTeam && teamConfig[this.selectedTeam] 
            ? new Set(teamConfig[this.selectedTeam]) 
            : null;
        
        const personSLA = {};
        data.forEach(t => {
            const p = this.getField(t, 'cf_tratativa');
            const fr = t.stats_first_responded_at;
            if (!p || !fr || !t.created_at) return;
            const time = new Date(fr) - new Date(t.created_at);
            p.split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => {
                if (!whitelist || whitelist.has(name)) {
                    if (!personSLA[name]) personSLA[name] = { within: 0, total: 0 };
                    personSLA[name].total++;
                    if (time <= SLA_LIMIT) personSLA[name].within++;
                }
            });
        });
        const sorted = Object.entries(personSLA)
            .filter(([, v]) => v.total >= 5)
            .map(([name, v]) => ({ name, rate: (v.within / v.total) * 100, total: v.total }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, isFullscreen ? 10 : 5);
        if (!sorted.length) { this.drawNoData(ctx, w, h, 'Dados insuficientes'); return; }
        this.drawRankingBars(ctx, w, h, sorted, 'rate', '%', isFullscreen);
    }
    
    drawRankingResolucao(ctx, w, h, data, isFullscreen = false) {
        // Obter whitelist do time selecionado (se configurado)
        const teamConfig = window.TEAM_MEMBERS_CONFIG || {};
        const whitelist = this.selectedTeam && teamConfig[this.selectedTeam] 
            ? new Set(teamConfig[this.selectedTeam]) 
            : null;
        
        const personRes = {};
        data.forEach(t => {
            const p = this.getField(t, 'cf_tratativa');
            if (!p) return;
            const s = this.statusMap[t.status];
            const resolved = s && (s.group === 'resolved' || s.group === 'closed');
            p.split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => {
                if (!whitelist || whitelist.has(name)) {
                    if (!personRes[name]) personRes[name] = { resolved: 0, total: 0 };
                    personRes[name].total++;
                    if (resolved) personRes[name].resolved++;
                }
            });
        });
        const sorted = Object.entries(personRes)
            .filter(([, v]) => v.total >= 5)
            .map(([name, v]) => ({ name, rate: (v.resolved / v.total) * 100, total: v.total }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, isFullscreen ? 10 : 5);
        if (!sorted.length) { this.drawNoData(ctx, w, h, 'Dados insuficientes'); return; }
        this.drawRankingBars(ctx, w, h, sorted, 'rate', '%', isFullscreen);
    }
    
    drawEficiencia(ctx, w, h, data, isFullscreen = false) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentData = data.filter(t => new Date(t.created_at) >= thirtyDaysAgo);
        
        // Obter whitelist do time selecionado (se configurado)
        const teamConfig = window.TEAM_MEMBERS_CONFIG || {};
        const whitelist = this.selectedTeam && teamConfig[this.selectedTeam] 
            ? new Set(teamConfig[this.selectedTeam]) 
            : null;
        
        const personEff = {};
        recentData.forEach(t => {
            const p = this.getField(t, 'cf_tratativa');
            const s = this.statusMap[t.status];
            if (!p || !s || !(s.group === 'resolved' || s.group === 'closed')) return;
            p.split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => {
                if (!whitelist || whitelist.has(name)) {
                    personEff[name] = (personEff[name] || 0) + 1;
                }
            });
        });
        const sorted = Object.entries(personEff)
            .map(([name, count]) => ({ name, rate: count / 30, total: count }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, isFullscreen ? 10 : 5);
        if (!sorted.length) { this.drawNoData(ctx, w, h, 'Sem dados de eficiência'); return; }
        this.drawRankingBars(ctx, w, h, sorted, 'rate', '/dia', isFullscreen);
    }
    
    drawRankingBars(ctx, w, h, items, valueKey, suffix, isFullscreen) {
        const maxVal = Math.max(...items.map(i => i[valueKey]), 1);
        const pad = isFullscreen ? { left: 180, right: 80, top: 30 } : { left: 100, right: 50, top: 20 };
        const barH = isFullscreen ? 32 : 22;
        const gap = isFullscreen ? 10 : 6;
        const colors = ['#fbbf24', '#94a3b8', '#cd7f32', '#667eea', '#667eea', '#667eea', '#667eea', '#667eea', '#667eea', '#667eea'];
        items.forEach((item, i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (item[valueKey] / maxVal) * (w - pad.left - pad.right));
            ctx.fillStyle = colors[i] || '#667eea';
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 5); ctx.fill();
            if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: item[valueKey].toFixed(1) + suffix, label: item.name });
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? '12px system-ui' : '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(item.name.length > 18 ? item.name.slice(0, 16) + '..' : item.name, pad.left - 8, y + barH / 2 + 4);
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 13px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(`${item[valueKey].toFixed(1)}${suffix}`, pad.left + bw + 8, y + barH / 2 + 4);
        });
    }
    
    drawFunil(ctx, w, h, data, isFullscreen = false) {
        const stages = [
            { id: 'open', label: 'Abertos', color: '#ef4444', count: 0 },
            { id: 'pending', label: 'Pendentes', color: '#f59e0b', count: 0 },
            { id: 'resolved', label: 'Resolvidos', color: '#10b981', count: 0 },
            { id: 'closed', label: 'Fechados', color: '#059669', count: 0 }
        ];
        data.forEach(t => {
            const s = this.statusMap[t.status];
            if (s) {
                const stage = stages.find(st => st.id === s.group);
                if (stage) stage.count++;
            }
        });
        const maxCount = Math.max(...stages.map(s => s.count), 1);
        const pad = isFullscreen ? { top: 40, bottom: 40, left: 100, right: 100 } : { top: 25, bottom: 25, left: 60, right: 60 };
        const funnelH = h - pad.top - pad.bottom;
        const stepH = funnelH / stages.length;
        const maxWidth = w - pad.left - pad.right;
        stages.forEach((stage, i) => {
            const widthRatio = stage.count / maxCount;
            const barW = Math.max(30, widthRatio * maxWidth);
            const x = (w - barW) / 2;
            const y = pad.top + i * stepH;
            ctx.fillStyle = stage.color;
            ctx.beginPath(); ctx.roundRect(x, y + 2, barW, stepH - 4, 6); ctx.fill();
            if (isFullscreen) this.chartBars.push({ x, y: y + 2, w: barW, h: stepH - 4, value: stage.count, label: stage.label });
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 16px system-ui' : 'bold 11px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${stage.label}: ${stage.count}`, w / 2, y + stepH / 2 + 5);
        });
    }
    
    drawParados(ctx, w, h, data, isFullscreen = false) {
        const now = new Date();
        const staleTickets = data.filter(t => {
            const s = this.statusMap[t.status];
            if (!s || s.group === 'resolved' || s.group === 'closed') return false;
            const lastUpdate = new Date(t.updated_at || t.created_at);
            const daysSince = (now - lastUpdate) / (1000 * 60 * 60 * 24);
            return daysSince >= 3;
        });
        const faixas = [
            { label: '3-7 dias', min: 3, max: 7, color: '#f59e0b', count: 0 },
            { label: '7-15 dias', min: 7, max: 15, color: '#f97316', count: 0 },
            { label: '15-30 dias', min: 15, max: 30, color: '#ef4444', count: 0 },
            { label: '> 30 dias', min: 30, max: Infinity, color: '#dc2626', count: 0 }
        ];
        staleTickets.forEach(t => {
            const lastUpdate = new Date(t.updated_at || t.created_at);
            const days = (now - lastUpdate) / (1000 * 60 * 60 * 24);
            const f = faixas.find(fx => days >= fx.min && days < fx.max);
            if (f) f.count++;
        });
        const items = faixas.filter(f => f.count > 0);
        if (!items.length) { this.drawNoData(ctx, w, h, 'Nenhum ticket parado'); return; }
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Total parados: ${staleTickets.length}`, w / 2, isFullscreen ? 25 : 18);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const pad = isFullscreen ? { left: 120, right: 60, top: 50, bottom: 30 } : { left: 80, right: 40, top: 35, bottom: 20 };
        const barH = isFullscreen ? 35 : 24;
        const gap = isFullscreen ? 12 : 8;
        items.forEach((item, i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (item.count / maxCount) * (w - pad.left - pad.right));
            ctx.fillStyle = item.color;
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 5); ctx.fill();
            if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: item.count, label: item.label });
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? '12px system-ui' : '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(item.label, pad.left - 8, y + barH / 2 + 4);
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(item.count.toString(), pad.left + bw + 8, y + barH / 2 + 4);
        });
    }
    
    drawAguardando(ctx, w, h, data, isFullscreen = false) {
        const aguardando = data.filter(t => t.status === 7);
        const now = new Date();
        const faixas = [
            { label: '< 1 dia', min: 0, max: 1, color: '#10b981', count: 0 },
            { label: '1-3 dias', min: 1, max: 3, color: '#3b82f6', count: 0 },
            { label: '3-7 dias', min: 3, max: 7, color: '#f59e0b', count: 0 },
            { label: '> 7 dias', min: 7, max: Infinity, color: '#ef4444', count: 0 }
        ];
        aguardando.forEach(t => {
            const lastUpdate = new Date(t.updated_at || t.created_at);
            const days = (now - lastUpdate) / (1000 * 60 * 60 * 24);
            const f = faixas.find(fx => days >= fx.min && days < fx.max);
            if (f) f.count++;
        });
        const items = faixas.filter(f => f.count > 0);
        if (!items.length) { this.drawNoData(ctx, w, h, 'Nenhum aguardando cliente'); return; }
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Total aguardando: ${aguardando.length}`, w / 2, isFullscreen ? 25 : 18);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const pad = isFullscreen ? { left: 100, right: 60, top: 50, bottom: 30 } : { left: 70, right: 40, top: 35, bottom: 20 };
        const barH = isFullscreen ? 38 : 26;
        const gap = isFullscreen ? 12 : 8;
        items.forEach((item, i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (item.count / maxCount) * (w - pad.left - pad.right));
            ctx.fillStyle = item.color;
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 5); ctx.fill();
            if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: item.count, label: item.label });
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? '12px system-ui' : '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(item.label, pad.left - 8, y + barH / 2 + 4);
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(item.count.toString(), pad.left + bw + 8, y + barH / 2 + 4);
        });
    }
    
    drawNoData(ctx, w, h, msg) {
        ctx.fillStyle = this.colors.textMuted;
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(msg, w / 2, h / 2);
    }
    
    // ========== ACOMPANHAMENTO (TAGS) ==========
    
    // Lista de pessoas permitidas para acompanhamento (usa TEAM_MEMBERS_CONFIG)
    getAllowedPeople() {
        // Usa a configuração global se disponível, senão usa lista fixa
        if (window.TEAM_MEMBERS_CONFIG?.Acompanhamento) {
            return window.TEAM_MEMBERS_CONFIG.Acompanhamento;
        }
        return this.allowedPeople;
    }
    
    normalizeForMatch(str) {
        return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
    
    extractTagsFromTicket(ticket) {
        const tags = ticket.tags;
        if (!tags) return [];
        
        // Se for array
        if (Array.isArray(tags)) return tags.map(t => (t || '').toString().trim()).filter(t => t);
        
        // Se for string JSON
        if (typeof tags === 'string') {
            const trimmed = tags.trim();
            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) return parsed.map(t => (t || '').toString().trim()).filter(t => t);
                } catch (e) { /* continua */ }
            }
            // String simples com delimitadores
            return tags.split(/[,;|]/).map(t => t.trim()).filter(t => t);
        }
        
        return [];
    }
    
    drawAcompanhamento(ctx, w, h, data, isFullscreen = false) {
        const allowedPeople = this.getAllowedPeople();
        const allowedNorm = allowedPeople.map(p => this.normalizeForMatch(p));
        const personCount = {};
        
        data.forEach(ticket => {
            const ticketTags = this.extractTagsFromTicket(ticket);
            ticketTags.forEach(tag => {
                const tagNorm = this.normalizeForMatch(tag);
                const matchIdx = allowedNorm.findIndex(n => tagNorm.includes(n) || n.includes(tagNorm));
                if (matchIdx !== -1) {
                    const canonicalName = allowedPeople[matchIdx];
                    personCount[canonicalName] = (personCount[canonicalName] || 0) + 1;
                }
            });
        });
        
        const sorted = Object.entries(personCount).sort((a, b) => b[1] - a[1]);
        if (!sorted.length) {
            this.drawNoData(ctx, w, h, 'Nenhum acompanhamento encontrado');
            return;
        }
        
        const total = sorted.reduce((s, [, v]) => s + v, 0);
        const maxVal = sorted[0][1];
        const pad = isFullscreen ? { left: 180, right: 80, top: 60 } : { left: 100, right: 50, top: 40 };
        const barH = isFullscreen ? 35 : 25;
        const gap = isFullscreen ? 12 : 8;
        const colors = ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#fdf2f8', '#fff1f5', '#fafafa'];
        
        // Título
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 16px system-ui' : 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`Total: ${total} acompanhamentos em ${data.length} tickets`, w / 2, isFullscreen ? 30 : 22);
        
        sorted.slice(0, isFullscreen ? 8 : 5).forEach(([name, count], i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (count / maxVal) * (w - pad.left - pad.right));
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 6); ctx.fill();
            
            if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: count, label: name });
            
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? '13px system-ui' : '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(name, pad.left - 10, y + barH / 2 + 4);
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(count.toString(), pad.left + bw + 10, y + barH / 2 + 4);
        });
    }
    
    drawAcompanhamentoResolucao(ctx, w, h, data, isFullscreen = false) {
        const allowedPeople = this.getAllowedPeople();
        const allowedNorm = allowedPeople.map(p => this.normalizeForMatch(p));
        const personStats = {};
        
        data.forEach(ticket => {
            const ticketTags = this.extractTagsFromTicket(ticket);
            const s = this.statusMap[ticket.status];
            const isResolved = s && (s.group === 'resolved' || s.group === 'closed');
            
            ticketTags.forEach(tag => {
                const tagNorm = this.normalizeForMatch(tag);
                const matchIdx = allowedNorm.findIndex(n => tagNorm.includes(n) || n.includes(tagNorm));
                if (matchIdx !== -1) {
                    const canonicalName = allowedPeople[matchIdx];
                    if (!personStats[canonicalName]) personStats[canonicalName] = { total: 0, resolved: 0 };
                    personStats[canonicalName].total++;
                    if (isResolved) personStats[canonicalName].resolved++;
                }
            });
        });
        
        const sorted = Object.entries(personStats)
            .filter(([, v]) => v.total >= 3)
            .map(([name, v]) => ({ name, rate: (v.resolved / v.total) * 100, total: v.total, resolved: v.resolved }))
            .sort((a, b) => b.rate - a.rate);
        
        if (!sorted.length) {
            this.drawNoData(ctx, w, h, 'Dados insuficientes');
            return;
        }
        
        this.drawRankingBars(ctx, w, h, sorted, 'rate', '%', isFullscreen);
    }
    
    // ========== TEMPO REGISTRADO ==========
    
    drawTempoRegistrado(ctx, w, h, data, isFullscreen = false) {
        // Buscar dados de time entries do Supabase se disponível
        const timeEntries = window.timeEntriesCache || [];
        
        if (!timeEntries.length) {
            // Fallback: calcular baseado em tempo de resolução
            const resolvedTickets = data.filter(t => {
                const s = this.statusMap[t.status];
                return s && (s.group === 'resolved' || s.group === 'closed') && t.created_at && (t.resolved_at || t.updated_at);
            });
            
            if (!resolvedTickets.length) {
                this.drawNoData(ctx, w, h, 'Sem dados de tempo');
                return;
            }
            
            // Calcular distribuição por faixas de horas
            const tempos = resolvedTickets.map(t => {
                const created = new Date(t.created_at);
                const resolved = new Date(t.resolved_at || t.updated_at);
                return (resolved - created) / (1000 * 60 * 60);
            }).filter(t => t > 0 && t < 720);
            
            const totalHours = tempos.reduce((a, b) => a + b, 0);
            const avgHours = totalHours / tempos.length;
            
            const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - (isFullscreen ? 60 : 40);
            
            // Círculo de progresso baseado na média vs meta (24h)
            const meta = 24; // 24 horas de meta
            const progress = Math.min(100, (meta / avgHours) * 100);
            const color = avgHours <= 8 ? '#10b981' : avgHours <= 24 ? '#f59e0b' : '#ef4444';
            
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = isFullscreen ? 25 : 18;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.min(100, progress) / 100) * Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? 'bold 28px system-ui' : 'bold 20px system-ui';
            ctx.textAlign = 'center';
            const avgText = avgHours < 24 ? `${avgHours.toFixed(1)}h` : `${(avgHours / 24).toFixed(1)}d`;
            ctx.fillText(avgText, cx, cy + 5);
            ctx.font = isFullscreen ? '14px system-ui' : '11px system-ui';
            ctx.fillStyle = this.colors.textMuted;
            ctx.fillText('Tempo Médio', cx, cy + (isFullscreen ? 35 : 25));
            ctx.fillText(`${resolvedTickets.length} tickets`, cx, cy + (isFullscreen ? 55 : 40));
            
            return;
        }
        
        // Com timeEntries disponível
        const totalSeconds = timeEntries.reduce((s, e) => s + (e.time_spent || 0), 0);
        const totalHours = totalSeconds / 3600;
        const avgMinutes = (totalSeconds / timeEntries.length) / 60;
        
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - (isFullscreen ? 60 : 40);
        
        ctx.fillStyle = this.colors.text;
        ctx.font = isFullscreen ? 'bold 32px system-ui' : 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${totalHours.toFixed(1)}h`, cx, cy);
        ctx.font = isFullscreen ? '14px system-ui' : '11px system-ui';
        ctx.fillStyle = this.colors.textMuted;
        ctx.fillText('Total Registrado', cx, cy + 25);
        ctx.fillText(`${timeEntries.length} entradas | Média: ${avgMinutes.toFixed(0)}min`, cx, cy + 45);
    }
    
    drawTempoAgente(ctx, w, h, data, isFullscreen = false) {
        const timeEntries = window.timeEntriesCache || [];
        
        // Obter whitelist do time selecionado (se configurado)
        const teamConfig = window.TEAM_MEMBERS_CONFIG || {};
        const whitelist = this.selectedTeam && teamConfig[this.selectedTeam] 
            ? new Set(teamConfig[this.selectedTeam]) 
            : null;
        
        if (!timeEntries.length) {
            // Fallback: usar tickets resolvidos por pessoa
            const personTime = {};
            data.forEach(t => {
                const p = this.getField(t, 'cf_tratativa');
                const s = this.statusMap[t.status];
                if (!p || !(s && (s.group === 'resolved' || s.group === 'closed'))) return;
                if (!t.created_at || !(t.resolved_at || t.updated_at)) return;
                
                const hours = (new Date(t.resolved_at || t.updated_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                if (hours <= 0 || hours > 720) return;
                
                p.split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => {
                    if (!whitelist || whitelist.has(name)) {
                        if (!personTime[name]) personTime[name] = { total: 0, count: 0 };
                        personTime[name].total += hours;
                        personTime[name].count++;
                    }
                });
            });
            
            const sorted = Object.entries(personTime)
                .filter(([, v]) => v.count >= 3)
                .map(([name, v]) => ({ name, rate: v.total / v.count, total: v.count }))
                .sort((a, b) => a.rate - b.rate) // Menor tempo = melhor
                .slice(0, isFullscreen ? 10 : 6);
            
            if (!sorted.length) {
                this.drawNoData(ctx, w, h, 'Dados insuficientes');
                return;
            }
            
            // Desenhar ranking (invertido - menor = melhor)
            const maxVal = Math.max(...sorted.map(i => i.rate));
            const pad = isFullscreen ? { left: 180, right: 80, top: 50 } : { left: 100, right: 50, top: 30 };
            const barH = isFullscreen ? 32 : 22;
            const gap = isFullscreen ? 10 : 6;
            const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'];
            
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? 'bold 14px system-ui' : 'bold 11px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Tempo Médio por Resolução (menores = melhores)', w / 2, isFullscreen ? 25 : 18);
            
            sorted.forEach((item, i) => {
                const y = pad.top + i * (barH + gap);
                const bw = Math.max(10, (item.rate / maxVal) * (w - pad.left - pad.right));
                ctx.fillStyle = colors[i % colors.length];
                ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 5); ctx.fill();
                
                if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: `${item.rate.toFixed(1)}h`, label: item.name });
                
                ctx.fillStyle = this.colors.text;
                ctx.font = isFullscreen ? '12px system-ui' : '10px system-ui';
                ctx.textAlign = 'right';
                ctx.fillText(item.name.length > 18 ? item.name.slice(0, 16) + '..' : item.name, pad.left - 8, y + barH / 2 + 4);
                ctx.fillStyle = '#fff';
                ctx.font = isFullscreen ? 'bold 13px system-ui' : 'bold 10px system-ui';
                ctx.textAlign = 'left';
                const timeText = item.rate < 24 ? `${item.rate.toFixed(1)}h` : `${(item.rate / 24).toFixed(1)}d`;
                ctx.fillText(timeText, pad.left + bw + 8, y + barH / 2 + 4);
            });
            
            return;
        }
        
        // Com timeEntries disponível
        const agentTime = {};
        timeEntries.forEach(e => {
            const agent = e.agent_name || e.agent_id || 'Desconhecido';
            if (!agentTime[agent]) agentTime[agent] = 0;
            agentTime[agent] += (e.time_spent || 0) / 3600; // Em horas
        });
        
        const sorted = Object.entries(agentTime).sort((a, b) => b[1] - a[1]).slice(0, isFullscreen ? 10 : 6);
        if (!sorted.length) {
            this.drawNoData(ctx, w, h, 'Sem dados por agente');
            return;
        }
        
        const maxVal = sorted[0][1];
        const pad = isFullscreen ? { left: 180, right: 80, top: 30 } : { left: 100, right: 50, top: 20 };
        const barH = isFullscreen ? 32 : 22;
        const gap = isFullscreen ? 10 : 6;
        
        sorted.forEach(([name, hours], i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (hours / maxVal) * (w - pad.left - pad.right));
            const grad = ctx.createLinearGradient(pad.left, 0, pad.left + bw, 0);
            grad.addColorStop(0, '#14b8a6'); grad.addColorStop(1, '#0d9488');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 5); ctx.fill();
            
            if (isFullscreen) this.chartBars.push({ x: pad.left, y, w: bw, h: barH, value: `${hours.toFixed(1)}h`, label: name });
            
            ctx.fillStyle = this.colors.text;
            ctx.font = isFullscreen ? '12px system-ui' : '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(name.length > 18 ? name.slice(0, 16) + '..' : name, pad.left - 8, y + barH / 2 + 4);
            ctx.fillStyle = '#fff';
            ctx.font = isFullscreen ? 'bold 13px system-ui' : 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(`${hours.toFixed(1)}h`, pad.left + bw + 8, y + barH / 2 + 4);
        });
    }
    
    // ========== FULLSCREEN ==========
    async startPresentation() {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        if (!slides.length) { alert('Selecione pelo menos um slide.'); return; }
        if (!this.filteredData.length) { alert('Nenhum dado. Ajuste os filtros.'); return; }
        
        // Pré-carregar dados de CSAT se o slide estiver selecionado
        if (this.selectedSlides.has('chartCSAT') && window.BICSATModule) {
            try {
                console.log('📊 Carregando dados CSAT para apresentação...');
                await window.BICSATModule.loadCSATData(true); // forceRefresh
            } catch (e) {
                console.warn('⚠️ Erro ao carregar CSAT:', e);
            }
        }
        
        // Calcular dados do período anterior para comparativo
        this.calculatePreviousPeriodData();
        console.log(`📊 Comparativo: ${this.filteredData.length} tickets atual vs ${this.previousPeriodData.length} tickets período anterior`);
        
        // Reset estados
        this.currentSlide = 0;
        this.isPresenting = true;
        this.presenterStartTime = null; // Reset timer do apresentador
        this.annotations = []; // Limpar anotações anteriores
        this.isDrawingMode = false;
        this.isAnimating = true; // Iniciar com animação
        
        this.renderFullscreen();
        document.documentElement.requestFullscreen?.();
        this.keyHandler = (e) => this.handleKey(e);
        document.addEventListener('keydown', this.keyHandler);
    }
    
    stopPresentation() {
        this.isPresenting = false;
        this.isAnimating = false;
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        document.removeEventListener('keydown', this.keyHandler);
        document.exitFullscreen?.();
        document.getElementById('presentationFS')?.remove();
        
        // Fechar janela do apresentador
        if (this.presenterWindow && !this.presenterWindow.closed) {
            this.presenterWindow.close();
        }
        this.presenterStartTime = null;
    }
    
    handleKey(e) {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        if (e.key === 'ArrowRight' || e.key === ' ') { 
            if (this.currentSlide < slides.length - 1) { 
                this.currentSlide++; 
                this.renderSlideAnimated(); 
            } 
        }
        else if (e.key === 'ArrowLeft') { 
            if (this.currentSlide > 0) { 
                this.currentSlide--; 
                this.renderSlideAnimated(); 
            } 
        }
        else if (e.key === 'Escape') this.stopPresentation();
        else if (e.key.toLowerCase() === 'd') this.toggleDrawMode();
        else if (e.key.toLowerCase() === 'p') this.openPresenterView();
        else if (e.key.toLowerCase() === 'c') this.clearAnnotations();
    }
    
    renderFullscreen() {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        const overlay = document.createElement('div');
        overlay.id = 'presentationFS';
        overlay.innerHTML = `
        <div class="pres-fullscreen">
            <div class="pres-fullscreen-header">
                <div class="pres-fullscreen-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <h2>Modo Apresentação</h2>
                </div>
                <div class="pres-fullscreen-controls">
                    <button id="btnDrawMode" onclick="presentationModeV2.toggleDrawMode()" class="pres-fullscreen-btn" title="Desenhar (D)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                        Desenhar
                    </button>
                    <button onclick="presentationModeV2.clearAnnotations()" class="pres-fullscreen-btn" title="Limpar (C)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Limpar
                    </button>
                    <input type="color" id="drawColor" value="#ef4444" onchange="presentationModeV2.drawingColor=this.value" style="width:36px;height:36px;border:none;border-radius:8px;cursor:pointer" title="Cor do desenho">
                    <button onclick="presentationModeV2.openPresenterView()" class="pres-fullscreen-btn" title="Modo Apresentador (P)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        Apresentador
                    </button>
                    <button onclick="presentationModeV2.stopPresentation()" class="pres-fullscreen-btn danger">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Sair
                    </button>
                </div>
            </div>
            
            <div class="pres-fullscreen-content">
                <div id="fsContent" class="pres-fullscreen-slide">
                    <canvas id="annotationCanvas" style="position:absolute;inset:0;z-index:10;pointer-events:none;width:100%;height:100%"></canvas>
                </div>
            </div>
            
            <div class="pres-fullscreen-footer">
                <button onclick="presentationModeV2.prevSlide()" class="pres-nav-btn" ${this.currentSlide === 0 ? 'disabled' : ''}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Anterior
                </button>
                
                <div class="pres-progress">
                    <div class="pres-progress-bar">
                        <div class="pres-progress-fill" style="width:${((this.currentSlide + 1) / slides.length) * 100}%"></div>
                    </div>
                    <span id="slideCounter" class="pres-progress-text">${this.currentSlide + 1} / ${slides.length}</span>
                    <div id="slideNav" style="display:flex;gap:6px">
                        ${slides.map((s, i) => `<button onclick="presentationModeV2.goToSlide(${i})" style="width:10px;height:10px;border-radius:50%;border:none;background:${i === this.currentSlide ? '#667eea' : 'rgba(255,255,255,0.25)'};cursor:pointer;transition:all 0.2s" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></button>`).join('')}
                    </div>
                </div>
                
                <button onclick="presentationModeV2.nextSlide()" class="pres-nav-btn" ${this.currentSlide === slides.length - 1 ? 'disabled' : ''}>
                    Próximo
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        
        // Setup do canvas de anotações
        this.setupAnnotationCanvas();
        
        this.renderSlide();
    }
    
    // ========== SISTEMA DE ANOTAÇÕES ==========
    toggleDrawMode() {
        this.isDrawingMode = !this.isDrawingMode;
        const btn = document.getElementById('btnDrawMode');
        const annotCanvas = document.getElementById('annotationCanvas');
        if (btn) btn.style.background = this.isDrawingMode ? this.colors.primary : 'rgba(255,255,255,0.1)';
        if (annotCanvas) annotCanvas.style.pointerEvents = this.isDrawingMode ? 'auto' : 'none';
        if (annotCanvas) annotCanvas.style.cursor = this.isDrawingMode ? 'crosshair' : 'default';
    }
    
    setupAnnotationCanvas() {
        const annotCanvas = document.getElementById('annotationCanvas');
        if (!annotCanvas) return;
        
        const content = document.getElementById('fsContent');
        annotCanvas.width = content.offsetWidth;
        annotCanvas.height = content.offsetHeight;
        
        let isDrawing = false;
        
        annotCanvas.onmousedown = (e) => {
            if (!this.isDrawingMode) return;
            isDrawing = true;
            const rect = annotCanvas.getBoundingClientRect();
            this.currentPath = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
        };
        
        annotCanvas.onmousemove = (e) => {
            if (!isDrawing || !this.isDrawingMode) return;
            const rect = annotCanvas.getBoundingClientRect();
            const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            this.currentPath.push(point);
            this.drawAnnotations();
        };
        
        annotCanvas.onmouseup = () => {
            if (isDrawing && this.currentPath.length > 1) {
                this.annotations.push({
                    points: [...this.currentPath],
                    color: this.drawingColor,
                    width: this.drawingWidth
                });
            }
            isDrawing = false;
            this.currentPath = [];
        };
        
        annotCanvas.onmouseleave = () => {
            isDrawing = false;
        };
    }
    
    drawAnnotations() {
        const canvas = document.getElementById('annotationCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar anotações salvas
        this.annotations.forEach(ann => {
            if (ann.points.length < 2) return;
            ctx.strokeStyle = ann.color;
            ctx.lineWidth = ann.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            ann.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        });
        
        // Desenhar path atual
        if (this.currentPath.length > 1) {
            ctx.strokeStyle = this.drawingColor;
            ctx.lineWidth = this.drawingWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
            this.currentPath.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }
    }
    
    clearAnnotations() {
        this.annotations = [];
        this.currentPath = [];
        this.drawAnnotations();
    }
    
    // ========== MODO APRESENTADOR ==========
    openPresenterView() {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        const currentSlide = slides[this.currentSlide];
        const nextSlide = slides[this.currentSlide + 1];
        
        // Fechar janela anterior se existir
        if (this.presenterWindow && !this.presenterWindow.closed) {
            this.presenterWindow.close();
        }
        
        // Abrir nova janela para apresentador
        this.presenterWindow = window.open('', 'presenterView', 'width=800,height=600');
        if (!this.presenterWindow) {
            alert('Permita popups para usar o modo apresentador');
            return;
        }
        
        this.updatePresenterView();
    }
    
    updatePresenterView() {
        if (!this.presenterWindow || this.presenterWindow.closed) return;
        
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        const currentSlide = slides[this.currentSlide];
        const nextSlide = slides[this.currentSlide + 1];
        const prevSlide = slides[this.currentSlide - 1];
        
        // Calcular comparativo com período anterior
        const comparison = this.calculateComparison();
        
        this.presenterWindow.document.body.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: system-ui, sans-serif; background: #0a0a1a; color: white; padding: 1.5rem; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; }
                .current { background: #1a1a2e; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
                .next-prev { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                .next, .prev { background: #1a1a2e; border-radius: 8px; padding: 1rem; }
                .next h4, .prev h4 { color: #94a3b8; font-size: 0.8rem; margin-bottom: 0.5rem; }
                .comparison { background: #1a1a2e; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
                .comparison h4 { color: #94a3b8; font-size: 0.8rem; margin-bottom: 0.75rem; }
                .comparison-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
                .comp-item { background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 8px; text-align: center; }
                .comp-item .label { font-size: 0.75rem; color: #94a3b8; }
                .comp-item .value { font-size: 1.25rem; font-weight: bold; }
                .comp-item .change { font-size: 0.8rem; margin-top: 0.25rem; }
                .up { color: #10b981; }
                .down { color: #ef4444; }
                .neutral { color: #94a3b8; }
                .notes { background: #1a1a2e; border-radius: 8px; padding: 1rem; }
                .notes textarea { width: 100%; height: 100px; background: rgba(255,255,255,0.05); border: 1px solid #334155; border-radius: 6px; color: white; padding: 0.75rem; resize: none; font-family: inherit; }
                .timer { font-size: 2rem; font-weight: bold; color: #667eea; }
                .controls { display: flex; gap: 0.5rem; }
                .controls button { padding: 0.5rem 1rem; background: rgba(255,255,255,0.1); border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 1rem; }
                .controls button:hover { background: rgba(255,255,255,0.2); }
            </style>
            <div class="header">
                <div>
                    <h2>🎤 Modo Apresentador</h2>
                    <p style="color:#94a3b8;font-size:0.9rem">Slide ${this.currentSlide + 1} de ${slides.length}</p>
                </div>
                <div class="timer" id="timer">00:00</div>
            </div>
            
            <div class="current">
                <h3 style="font-size:1.5rem;margin-bottom:0.5rem">${currentSlide?.icon || ''} ${currentSlide?.title || 'Slide'}</h3>
                <p style="color:#94a3b8">Categoria: ${currentSlide?.category || 'N/A'}</p>
            </div>
            
            <div class="next-prev">
                <div class="prev">
                    <h4>⬅️ Slide Anterior</h4>
                    <p>${prevSlide ? `${prevSlide.icon} ${prevSlide.title}` : '—'}</p>
                </div>
                <div class="next">
                    <h4>➡️ Próximo Slide</h4>
                    <p>${nextSlide ? `${nextSlide.icon} ${nextSlide.title}` : '— Fim —'}</p>
                </div>
            </div>
            
            <div class="comparison">
                <h4>📊 Comparativo vs Período Anterior</h4>
                <div class="comparison-grid">
                    <div class="comp-item">
                        <div class="label">Total de Tickets</div>
                        <div class="value">${comparison.current.total}</div>
                        <div class="change ${comparison.totalChange >= 0 ? 'up' : 'down'}">${comparison.totalChange >= 0 ? '↑' : '↓'} ${Math.abs(comparison.totalChange).toFixed(1)}%</div>
                    </div>
                    <div class="comp-item">
                        <div class="label">Taxa Resolução</div>
                        <div class="value">${comparison.current.resolutionRate.toFixed(1)}%</div>
                        <div class="change ${comparison.resolutionChange >= 0 ? 'up' : 'down'}">${comparison.resolutionChange >= 0 ? '↑' : '↓'} ${Math.abs(comparison.resolutionChange).toFixed(1)}pp</div>
                    </div>
                    <div class="comp-item">
                        <div class="label">Período Anterior</div>
                        <div class="value">${comparison.previous.total}</div>
                        <div class="change neutral">tickets</div>
                    </div>
                </div>
            </div>
            
            <div class="notes">
                <h4 style="color:#94a3b8;font-size:0.8rem;margin-bottom:0.5rem">📝 Notas do Slide</h4>
                <textarea placeholder="Digite suas notas aqui...">${this.getSlideNotes(currentSlide?.id) || ''}</textarea>
            </div>
            
            <div style="margin-top:1rem;display:flex;justify-content:center">
                <div class="controls">
                    <button onclick="window.opener.presentationModeV2.prevSlide();window.opener.presentationModeV2.updatePresenterView()">⬅️ Anterior</button>
                    <button onclick="window.opener.presentationModeV2.nextSlide();window.opener.presentationModeV2.updatePresenterView()">Próximo ➡️</button>
                </div>
            </div>
        `;
        
        // Iniciar timer
        if (!this.presenterStartTime) this.presenterStartTime = Date.now();
        this.updatePresenterTimer();
    }
    
    updatePresenterTimer() {
        if (!this.presenterWindow || this.presenterWindow.closed) return;
        const elapsed = Math.floor((Date.now() - this.presenterStartTime) / 1000);
        const min = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const sec = (elapsed % 60).toString().padStart(2, '0');
        const timer = this.presenterWindow.document.getElementById('timer');
        if (timer) timer.textContent = `${min}:${sec}`;
        setTimeout(() => this.updatePresenterTimer(), 1000);
    }
    
    getSlideNotes(slideId) {
        // Notas padrão por slide
        const defaultNotes = {
            'overview': 'Visão geral dos tickets do período selecionado.',
            'chartTop10': 'Ranking das pessoas com maior volume de tickets.',
            'chartStatus': 'Distribuição por status atual.',
            'chartResolution': 'Taxa de tickets resolvidos/fechados.',
            'chartSLA': 'Conformidade com SLA de primeira resposta (4h).'
        };
        return defaultNotes[slideId] || '';
    }
    
    calculateComparison() {
        const current = this.filteredData;
        const previous = this.previousPeriodData;
        
        const currentResolved = current.filter(t => {
            const s = this.statusMap[t.status];
            return s && (s.group === 'resolved' || s.group === 'closed');
        }).length;
        
        const previousResolved = previous.filter(t => {
            const s = this.statusMap[t.status];
            return s && (s.group === 'resolved' || s.group === 'closed');
        }).length;
        
        const currentRate = current.length ? (currentResolved / current.length) * 100 : 0;
        const previousRate = previous.length ? (previousResolved / previous.length) * 100 : 0;
        
        return {
            current: { total: current.length, resolutionRate: currentRate },
            previous: { total: previous.length, resolutionRate: previousRate },
            totalChange: previous.length ? ((current.length - previous.length) / previous.length) * 100 : 0,
            resolutionChange: currentRate - previousRate
        };
    }
    
    // Calcular dados do período anterior
    calculatePreviousPeriodData() {
        if (!this.startDate || !this.endDate) {
            this.previousPeriodData = [];
            return;
        }
        
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const duration = end - start;
        
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);
        
        const allData = window.allTicketsCache || [];
        this.previousPeriodData = allData.filter(t => {
            const ticketDate = new Date(t.created_at);
            return ticketDate >= prevStart && ticketDate <= prevEnd;
        });
    }
    
    prevSlide() { 
        if (this.currentSlide > 0) { 
            this.currentSlide--; 
            this.renderSlideAnimated(); 
            this.updatePresenterView();
        } 
    }
    
    nextSlide() {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        if (this.currentSlide < slides.length - 1) { 
            this.currentSlide++; 
            this.renderSlideAnimated(); 
            this.updatePresenterView();
        }
    }
    
    goToSlide(i) { 
        this.currentSlide = i; 
        this.renderSlideAnimated(); 
        this.updatePresenterView();
    }
    
    // Renderização com animação de entrada
    renderSlideAnimated() {
        this.animationProgress = 0;
        this.isAnimating = true;
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.renderSlide();
    }
    
    renderSlide() {
        const slides = this.availableSlides.filter(s => this.selectedSlides.has(s.id));
        const slide = slides[this.currentSlide];
        if (!slide) return;
        const content = document.getElementById('fsContent');
        const counter = document.getElementById('slideCounter');
        const nav = document.getElementById('slideNav');
        
        // Comparativo
        const comparison = this.calculateComparison();
        const changeIcon = comparison.totalChange >= 0 ? '↑' : '↓';
        const changeColor = comparison.totalChange >= 0 ? '#10b981' : '#ef4444';
        
        if (counter) counter.textContent = `${this.currentSlide + 1} / ${slides.length}`;
        if (nav) nav.innerHTML = slides.map((s, i) => `<button onclick="presentationModeV2.goToSlide(${i})" style="width:10px;height:10px;border-radius:50%;border:none;background:${i === this.currentSlide ? '#667eea' : 'rgba(255,255,255,0.25)'};cursor:pointer;transition:all 0.2s" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></button>`).join('');
        
        // Atualizar barra de progresso
        const progressFill = document.querySelector('.pres-progress-fill');
        if (progressFill) progressFill.style.width = `${((this.currentSlide + 1) / slides.length) * 100}%`;
        
        // Atualizar estados dos botões
        const prevBtn = document.querySelector('.pres-fullscreen-footer .pres-nav-btn:first-child');
        const nextBtn = document.querySelector('.pres-fullscreen-footer .pres-nav-btn:last-child');
        if (prevBtn) prevBtn.disabled = this.currentSlide === 0;
        if (nextBtn) nextBtn.disabled = this.currentSlide === slides.length - 1;
        
        if (content) {
            // Manter canvas de anotações
            const annotCanvas = document.getElementById('annotationCanvas');
            
            content.innerHTML = `
                <canvas id="annotationCanvas" style="position:absolute;inset:0;z-index:10;pointer-events:${this.isDrawingMode ? 'auto' : 'none'};width:100%;height:100%;cursor:${this.isDrawingMode ? 'crosshair' : 'default'}"></canvas>
                <div style="width:100%;max-width:1200px;text-align:center;animation:slideIn 0.4s cubic-bezier(0.4,0,0.2,1)">
                    <style>
                        @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
                        @keyframes growBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
                        @keyframes growPie{from{transform:scale(0) rotate(-90deg)}to{transform:scale(1) rotate(0deg)}}
                        @keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
                    </style>
                    <h2 style="font-size:2.5rem;margin-bottom:1.5rem;color:white;animation:countUp 0.5s ease 0.1s both">${slide.icon} ${slide.title}</h2>
                    <div style="background:${this.colors.surface};border-radius:16px;padding:2rem;min-height:400px;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
                        <canvas id="fsCanvas" width="1000" height="500" style="max-width:100%;cursor:crosshair"></canvas>
                        <div id="chartTooltip" style="position:absolute;background:linear-gradient(135deg,rgba(26,26,46,0.98),rgba(15,15,30,0.98));color:white;padding:12px 18px;border-radius:12px;font-size:14px;pointer-events:none;opacity:0;transition:all 0.2s cubic-bezier(0.4,0,0.2,1);z-index:1000;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid rgba(102,126,234,0.3);backdrop-filter:blur(10px)"></div>
                    </div>
                    <div style="margin-top:1rem;color:${this.colors.textMuted};font-size:0.9rem;display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;animation:countUp 0.5s ease 0.3s both">
                        ${this.selectedTeam ? `<span>Time: <strong style="color:${this.colors.primary}">${this.selectedTeam}</strong></span>` : ''}
                        <span>Período: <strong>${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}</strong></span>
                        <span>${this.filteredData.length.toLocaleString()} tickets</span>
                        ${this.previousPeriodData.length > 0 ? `<span style="color:${changeColor};font-weight:600">${changeIcon} ${Math.abs(comparison.totalChange).toFixed(1)}% vs anterior</span>` : ''}
                    </div>
                </div>`;
            
            // Re-setup anotações
            this.setupAnnotationCanvas();
            this.drawAnnotations();
            
            setTimeout(() => {
                const canvas = document.getElementById('fsCanvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    
                    // Animar o gráfico
                    if (this.isAnimating) {
                        this.animateChart(ctx, 1000, 500, slide.id);
                    } else {
                        ctx.fillStyle = this.colors.surface;
                        ctx.fillRect(0, 0, 1000, 500);
                        this.drawChart(ctx, 1000, 500, slide.id, this.filteredData, true);
                    }
                    
                    // Adicionar tooltip interativo
                    this.setupTooltip(canvas);
                }
            }, 100);
        }
    }
    
    // Animar gráficos com efeito de crescimento
    animateChart(ctx, w, h, slideId) {
        const duration = 800; // ms
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            this.animationProgress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out-cubic)
            const eased = 1 - Math.pow(1 - this.animationProgress, 3);
            
            ctx.fillStyle = this.colors.surface;
            ctx.fillRect(0, 0, w, h);
            
            // Desenhar com progresso de animação
            this.drawChartAnimated(ctx, w, h, slideId, this.filteredData, true, eased);
            
            if (this.animationProgress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                // Redesenhar final sem animação para garantir precisão
                ctx.fillStyle = this.colors.surface;
                ctx.fillRect(0, 0, w, h);
                this.drawChart(ctx, w, h, slideId, this.filteredData, true);
            }
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    // Desenho animado dos gráficos
    drawChartAnimated(ctx, w, h, slideId, data, isFullscreen, progress) {
        ctx.save();
        
        // Aplicar progresso de animação baseado no tipo de gráfico
        const barCharts = ['chartTop10', 'chartPriority', 'chartTimeline', 'chartSystems', 'chartByDayOfWeek', 'chartByHour', 
                          'chartTempoMedio', 'chartFirstResponse', 'chartBacklog', 'chartWorkload', 'chartParados', 
                          'chartAguardando', 'chartTempoAgente', 'chartRankingSLA', 'chartRankingResolucao', 'chartEficiencia'];
        const pieCharts = ['chartStatus', 'chartResolution', 'chartSLA', 'chartCSAT', 'chartFunil'];
        
        if (barCharts.includes(slideId)) {
            // Para gráficos de barra: escalar horizontalmente
            ctx.globalAlpha = progress;
        } else if (pieCharts.includes(slideId)) {
            // Para gráficos de pizza: escalar do centro
            ctx.globalAlpha = progress;
        } else {
            ctx.globalAlpha = progress;
        }
        
        this.drawChart(ctx, w, h, slideId, data, isFullscreen);
        ctx.restore();
    }
    
    setupTooltip(canvas) {
        const tooltip = document.getElementById('chartTooltip');
        if (!tooltip) return;
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Verificar se mouse está sobre alguma barra
            let found = null;
            for (const bar of this.chartBars) {
                if (x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h) {
                    found = bar;
                    break;
                }
            }
            
            if (found) {
                // Tooltip rico com mais informações
                const value = typeof found.value === 'number' ? found.value.toLocaleString() : found.value;
                const percentage = found.percentage ? `<br><span style="color:#667eea">${found.percentage}%</span>` : '';
                const extra = found.extra ? `<br><span style="font-size:12px;color:#94a3b8">${found.extra}</span>` : '';
                
                tooltip.innerHTML = `
                    <div style="font-weight:600;margin-bottom:4px;color:#667eea">${found.label}</div>
                    <div style="font-size:18px;font-weight:bold">${value}</div>
                    ${percentage}${extra}
                `;
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'scale(1)';
                
                // Posicionar tooltip
                let left = e.clientX - rect.left + 15;
                let top = e.clientY - rect.top - 10;
                
                // Evitar que saia da tela
                if (left + 150 > rect.width) left = e.clientX - rect.left - 160;
                if (top + 80 > rect.height) top = e.clientY - rect.top - 80;
                
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            } else {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'scale(0.95)';
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'scale(0.95)';
        });
    }
    
    formatDate(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : 'N/A'; }
}

// Inicializar
window.presentationModeV2 = new PresentationModeV2();
