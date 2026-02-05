/**
 * BI CSAT & Time Entries Module
 * Integra dados de satisfação do cliente e tempo de atendimento ao BI Analytics
 */

// Usa credenciais do SupabaseLoader (não redeclara para evitar conflito)
const _CSAT_SUPABASE_URL = window.SupabaseLoader?.SUPABASE_URL || 'https://mzjdmhgkrroajmsfwryu.supabase.co';
const _CSAT_SUPABASE_KEY = window.SupabaseLoader?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc';

// Injetar estilos de scrollbar para evitar flickering
(function() {
    if (document.getElementById('csat-scrollbar-styles')) return;
    const style = document.createElement('style');
    style.id = 'csat-scrollbar-styles';
    style.textContent = `
        /* Scrollbar estável para containers com overflow */
        .bi-csat-section *::-webkit-scrollbar,
        .bi-tempo-section *::-webkit-scrollbar,
        .bi-card *::-webkit-scrollbar,
        [style*="overflow"]::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        .bi-csat-section *::-webkit-scrollbar-track,
        .bi-tempo-section *::-webkit-scrollbar-track,
        .bi-card *::-webkit-scrollbar-track,
        [style*="overflow"]::-webkit-scrollbar-track {
            background: #27272a;
            border-radius: 4px;
        }
        
        .bi-csat-section *::-webkit-scrollbar-thumb,
        .bi-tempo-section *::-webkit-scrollbar-thumb,
        .bi-card *::-webkit-scrollbar-thumb,
        [style*="overflow"]::-webkit-scrollbar-thumb {
            background: #52525b;
            border-radius: 4px;
            border: 2px solid #27272a;
        }
        
        .bi-csat-section *::-webkit-scrollbar-thumb:hover,
        .bi-tempo-section *::-webkit-scrollbar-thumb:hover,
        .bi-card *::-webkit-scrollbar-thumb:hover,
        [style*="overflow"]::-webkit-scrollbar-thumb:hover {
            background: #71717a;
        }
        
        /* Evitar que hover nos itens cause reflow do scrollbar */
        .bi-csat-section [onmouseover],
        .bi-tempo-section [onmouseover] {
            will-change: transform, box-shadow;
            backface-visibility: hidden;
        }
        
        /* Firefox scrollbar */
        .bi-csat-section *,
        .bi-tempo-section *,
        .bi-card * {
            scrollbar-width: thin;
            scrollbar-color: #52525b #27272a;
        }
    `;
    document.head.appendChild(style);
})();

// Módulo de CSAT e Time Entries
window.BICSATModule = {
    // Cache
    _csatCache: null,
    _timeEntriesCache: null,
    _agentsCache: null,
    _cacheTime: null,
    _cacheDuration: 5 * 60 * 1000, // 5 minutos
    
    // Filtros de período
    csatPeriodFilter: '30',       // 7, 30, 90, 180, 365, 'all', 'custom'
    tempoPeriodFilter: '30',      // 7, 30, 90, 180, 365, 'all', 'custom'
    
    // Datas customizadas
    csatCustomDateRange: { start: null, end: null },
    tempoCustomDateRange: { start: null, end: null },
    
    // Filtro por agente
    csatAgentFilter: 'all',       // 'all' ou agent_id
    
    // Mostrar todos os feedbacks
    showAllFeedbacks: false,
    feedbackPage: 1,
    feedbacksPerPage: 10,
    
    // Cores para gráficos
    colors: {
        satisfied: '#10b981',    // Verde
        neutral: '#f59e0b',      // Amarelo
        unsatisfied: '#ef4444',  // Vermelho
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#1e1e2e',
        surface: '#27272a',
        text: '#e4e4e7',
        textMuted: '#a1a1aa',
        border: '#3f3f46'
    },
    
    /**
     * Carrega dados de CSAT do Supabase
     */
    async loadCSATData(forceRefresh = false) {
        if (!forceRefresh && this._csatCache && this._cacheTime && (Date.now() - this._cacheTime < this._cacheDuration)) {
            console.log('📦 CSAT: Usando cache');
            return this._csatCache;
        }
        
        try {
            console.log('⭐ Carregando dados de CSAT do Supabase...');
            
            const response = await fetch(`${_CSAT_SUPABASE_URL}/rest/v1/satisfaction_ratings?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': _CSAT_SUPABASE_KEY,
                    'Authorization': `Bearer ${_CSAT_SUPABASE_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this._csatCache = data;
            this._cacheTime = Date.now();
            
            console.log(`✅ ${data.length} avaliações CSAT carregadas`);
            return data;
            
        } catch (error) {
            console.error('❌ Erro ao carregar CSAT:', error);
            return [];
        }
    },
    
    /**
     * Carrega dados de Time Entries do Supabase
     */
    async loadTimeEntriesData(forceRefresh = false) {
        if (!forceRefresh && this._timeEntriesCache && this._cacheTime && (Date.now() - this._cacheTime < this._cacheDuration)) {
            console.log('📦 Time Entries: Usando cache');
            return this._timeEntriesCache;
        }
        
        try {
            console.log('⏱️ Carregando dados de Time Entries do Supabase...');
            
            const response = await fetch(`${_CSAT_SUPABASE_URL}/rest/v1/time_entries?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': _CSAT_SUPABASE_KEY,
                    'Authorization': `Bearer ${_CSAT_SUPABASE_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this._timeEntriesCache = data;
            
            console.log(`✅ ${data.length} time entries carregados`);
            return data;
            
        } catch (error) {
            console.error('❌ Erro ao carregar Time Entries:', error);
            return [];
        }
    },
    
    /**
     * Carrega dados de agentes do Supabase
     */
    async loadAgentsData() {
        if (this._agentsCache) {
            return this._agentsCache;
        }
        
        try {
            const response = await fetch(`${_CSAT_SUPABASE_URL}/rest/v1/agents?select=id,name,email`, {
                headers: {
                    'apikey': _CSAT_SUPABASE_KEY,
                    'Authorization': `Bearer ${_CSAT_SUPABASE_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this._agentsCache = {};
            data.forEach(agent => {
                this._agentsCache[agent.id] = agent.name || agent.email || `Agent ${agent.id}`;
            });
            
            return this._agentsCache;
            
        } catch (error) {
            console.error('❌ Erro ao carregar agentes:', error);
            return {};
        }
    },
    
    /**
     * Calcula estatísticas de CSAT
     */
    calculateCSATStats(ratings) {
        if (!ratings || ratings.length === 0) {
            return {
                total: 0,
                csatPercent: 0,
                avgScore: 0,
                satisfied: 0,
                neutral: 0,
                unsatisfied: 0,
                byAgent: {},
                byMonth: {},
                recentFeedback: []
            };
        }
        
        const stats = {
            total: ratings.length,
            satisfied: 0,
            neutral: 0,
            unsatisfied: 0,
            totalScore: 0,
            byAgent: {},
            byMonth: {},
            recentFeedback: []
        };
        
        ratings.forEach(rating => {
            // Freshdesk usa 'rating' (1-5), alguns sistemas usam 'score'
            // Freshdesk também pode usar: positivo = satisfeito, negativo = insatisfeito
            const score = rating.rating || rating.score || 0;
            
            // Detectar formato Freshdesk (valores absolutos grandes como 103, -103)
            const isFreshdeskFormat = Math.abs(score) > 5;
            
            if (isFreshdeskFormat) {
                // Formato Freshdesk: positivo = satisfeito, negativo = insatisfeito
                if (score > 0) stats.satisfied++;
                else if (score < 0) stats.unsatisfied++;
                // score === 0 é ignorado
            } else {
                // Formato padrão 1-5: 4-5 = satisfeito, 3 = neutro, 1-2 = insatisfeito
                if (score >= 4) stats.satisfied++;
                else if (score === 3) stats.neutral++;
                else if (score >= 1) stats.unsatisfied++;
            }
            
            // Normalizar score para cálculo de média
            // Formato Freshdesk: converter para escala 1-5
            const normalizedScore = isFreshdeskFormat 
                ? (score > 0 ? 5 : (score < 0 ? 1 : 3))  // positivo=5, negativo=1, zero=3
                : (score >= 1 && score <= 5 ? score : 3);
            stats.totalScore += normalizedScore;
            
            // Por agente
            if (rating.agent_id) {
                if (!stats.byAgent[rating.agent_id]) {
                    stats.byAgent[rating.agent_id] = { total: 0, satisfied: 0, scores: [] };
                }
                stats.byAgent[rating.agent_id].total++;
                stats.byAgent[rating.agent_id].scores.push(normalizedScore);
                // Usar mesma lógica de satisfação
                const isSatisfied = isFreshdeskFormat ? (score > 0) : (score >= 4);
                if (isSatisfied) stats.byAgent[rating.agent_id].satisfied++;
            }
            
            // Por mês
            if (rating.created_at) {
                const date = new Date(rating.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!stats.byMonth[monthKey]) {
                    stats.byMonth[monthKey] = { total: 0, satisfied: 0, scores: [] };
                }
                stats.byMonth[monthKey].total++;
                stats.byMonth[monthKey].scores.push(normalizedScore);
                // Usar mesma lógica de satisfação
                const isSatisfied = isFreshdeskFormat ? (score > 0) : (score >= 4);
                if (isSatisfied) stats.byMonth[monthKey].satisfied++;
            }
            
            // Feedback recente (incluir todos os tickets com avaliação, não só com comentário)
            stats.recentFeedback.push({
                feedback: rating.feedback || '',
                score: score,
                ticketId: rating.ticket_id,
                agentId: rating.agent_id,
                date: rating.created_at
            });
        });
        
        // Calcular CSAT %
        const respondedCount = stats.satisfied + stats.neutral + stats.unsatisfied;
        stats.csatPercent = respondedCount > 0 ? Math.round((stats.satisfied / respondedCount) * 100) : 0;
        stats.avgScore = stats.total > 0 ? (stats.totalScore / stats.total).toFixed(1) : 0;
        
        // Ordenar feedback por data (mais recente primeiro) - mantém todos
        stats.recentFeedback.sort((a, b) => new Date(b.date) - new Date(a.date));
        stats.allFeedbacks = [...stats.recentFeedback]; // Guardar todos
        
        return stats;
    },
    
    /**
     * Calcula estatísticas de Time Entries
     */
    calculateTimeStats(entries) {
        if (!entries || entries.length === 0) {
            return {
                total: 0,
                totalMinutes: 0,
                avgMinutes: 0,
                byAgent: {},
                byTicket: {}
            };
        }
        
        const stats = {
            total: entries.length,
            totalMinutes: 0,
            byAgent: {},
            byTicket: {}
        };
        
        entries.forEach(entry => {
            const minutes = entry.time_spent_minutes || 0;
            stats.totalMinutes += minutes;
            
            // Por agente
            if (entry.agent_id) {
                if (!stats.byAgent[entry.agent_id]) {
                    stats.byAgent[entry.agent_id] = { total: 0, minutes: 0, tickets: new Set() };
                }
                stats.byAgent[entry.agent_id].total++;
                stats.byAgent[entry.agent_id].minutes += minutes;
                stats.byAgent[entry.agent_id].tickets.add(entry.ticket_id);
            }
            
            // Por ticket
            if (entry.ticket_id) {
                if (!stats.byTicket[entry.ticket_id]) {
                    stats.byTicket[entry.ticket_id] = { entries: 0, minutes: 0 };
                }
                stats.byTicket[entry.ticket_id].entries++;
                stats.byTicket[entry.ticket_id].minutes += minutes;
            }
        });
        
        // Converter Set para count
        Object.values(stats.byAgent).forEach(agent => {
            agent.ticketCount = agent.tickets.size;
            delete agent.tickets;
        });
        
        stats.avgMinutes = stats.total > 0 ? Math.round(stats.totalMinutes / stats.total) : 0;
        stats.totalHours = Math.round(stats.totalMinutes / 60 * 10) / 10;
        
        return stats;
    },
    
    /**
     * Formata minutos para exibição
     */
    formatTime(minutes) {
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    },
    
    /**
     * Renderiza card de CSAT para a visão geral
     */
    renderCSATCard(stats) {
        const csatColor = stats.csatPercent >= 85 ? this.colors.satisfied : 
                         stats.csatPercent >= 70 ? this.colors.neutral : this.colors.unsatisfied;
        
        return `
            <div class="bi-card" style="
                background: linear-gradient(135deg, #f59e0b, #f97316);
                padding: 1.25rem;
                border-radius: 12px;
                color: white;
                text-align: center;
            ">
                <div style="font-size: 1.5rem;">⭐</div>
                <div style="font-size: 2rem; font-weight: 700;">${stats.csatPercent}%</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">CSAT</div>
                <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.25rem;">
                    ${stats.total} avaliações
                </div>
            </div>
        `;
    },
    
    /**
     * Renderiza card de Tempo para a visão geral
     */
    renderTimeCard(stats) {
        return `
            <div class="bi-card" style="
                background: linear-gradient(135deg, #06b6d4, #0891b2);
                padding: 1.25rem;
                border-radius: 12px;
                color: white;
                text-align: center;
            ">
                <div style="font-size: 1.5rem;">⏱️</div>
                <div style="font-size: 2rem; font-weight: 700;">${this.formatTime(stats.avgMinutes)}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Tempo Médio/Ticket</div>
                <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.25rem;">
                    ${stats.totalHours}h total
                </div>
            </div>
        `;
    },
    
    /**
     * Filtra dados por período
     */
    filterByPeriod(data, period, dateField = 'created_at', type = 'csat') {
        if (period === 'all' || !period) return data;
        
        // Período customizado
        if (period === 'custom') {
            const customRange = type === 'csat' ? this.csatCustomDateRange : this.tempoCustomDateRange;
            if (customRange.start && customRange.end) {
                const startDate = new Date(customRange.start);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(customRange.end);
                endDate.setHours(23, 59, 59, 999);
                
                return data.filter(item => {
                    const itemDate = new Date(item[dateField]);
                    return itemDate >= startDate && itemDate <= endDate;
                });
            }
            return data;
        }
        
        const days = parseInt(period);
        if (isNaN(days)) return data;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return data.filter(item => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= cutoffDate;
        });
    },
    
    /**
     * Muda o filtro de período do CSAT e re-renderiza
     */
    async setCSATFilter(days) {
        this.csatPeriodFilter = days;
        if (days !== 'custom') {
            this.csatCustomDateRange = { start: null, end: null };
        }
        const container = document.getElementById('biCSATContent');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#a1a1aa;">⏳ Carregando...</div>';
            container.innerHTML = await this.renderCSATSection();
        }
    },
    
    /**
     * Muda o filtro de período do Tempo e re-renderiza
     */
    async setTempoFilter(days) {
        this.tempoPeriodFilter = days;
        if (days !== 'custom') {
            this.tempoCustomDateRange = { start: null, end: null };
        }
        const container = document.getElementById('biTimeContent');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#a1a1aa;">⏳ Carregando...</div>';
            container.innerHTML = await this.renderTimeSection();
        }
    },
    
    /**
     * Abre o ticket no Freshdesk
     */
    openTicket(ticketId) {
        if (ticketId) {
            window.open(`https://suportetryvia.freshdesk.com/a/tickets/${ticketId}`, '_blank');
        }
    },
    
    /**
     * Define o filtro de agente e re-renderiza
     */
    async setAgentFilter(agentId) {
        this.csatAgentFilter = agentId;
        const container = document.getElementById('biCSATContent');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#a1a1aa;">⏳ Carregando...</div>';
            container.innerHTML = await this.renderCSATSection();
        }
    },
    
    /**
     * Alterna visualização de todos os feedbacks
     */
    async toggleAllFeedbacks() {
        this.showAllFeedbacks = !this.showAllFeedbacks;
        this.feedbackPage = 1;
        const container = document.getElementById('biCSATContent');
        if (container) {
            container.innerHTML = await this.renderCSATSection();
        }
    },
    
    /**
     * Navega páginas de feedback
     */
    async changeFeedbackPage(direction) {
        this.feedbackPage += direction;
        const container = document.getElementById('biCSATContent');
        if (container) {
            container.innerHTML = await this.renderCSATSection();
        }
    },
    
    // Picker temporário para os calendários
    _csatTempPicker: null,
    _tempoTempPicker: null,
    
    /**
     * Abre date picker visual para CSAT
     */
    openCSATDatePicker() {
        this.openDatePickerPopup('csat');
    },
    
    /**
     * Abre date picker visual para Tempo
     */
    openTempoDatePicker() {
        this.openDatePickerPopup('tempo');
    },
    
    /**
     * Abre o popup com calendário visual
     */
    openDatePickerPopup(type) {
        const popupId = type + 'DatePickerPopup';
        const existing = document.getElementById(popupId);
        if (existing) { existing.remove(); return; }
        
        const btnId = type + 'PeriodBtn';
        const btn = document.getElementById(btnId);
        const rect = btn ? btn.getBoundingClientRect() : { left: window.innerWidth / 2 - 180, bottom: 100 };
        
        const customRange = type === 'csat' ? this.csatCustomDateRange : this.tempoCustomDateRange;
        const tempPicker = { 
            startDate: customRange.start ? new Date(customRange.start) : null,
            endDate: customRange.end ? new Date(customRange.end) : null,
            currentMonth: new Date()
        };
        
        if (type === 'csat') this._csatTempPicker = tempPicker;
        else this._tempoTempPicker = tempPicker;
        
        // Calcular posição usando coordenadas do documento (não da viewport)
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const popupTop = Math.min(rect.bottom + scrollY + 8, scrollY + window.innerHeight - 450);
        const popupLeft = Math.min(rect.left + scrollX, scrollX + window.innerWidth - 380);
        
        const popup = document.createElement('div');
        popup.id = popupId;
        popup.style.cssText = `
            position: absolute;
            top: ${popupTop}px;
            left: ${popupLeft}px;
            z-index: 10001;
            background: #1e1e2e;
            border: 1px solid #3f3f46;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            min-width: 360px;
        `;
        
        popup.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4 style="color: white; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">📅 Selecionar Período</h4>
                
                <!-- Atalhos rápidos -->
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <button class="drp-quick-${type}" data-preset="7" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 7 dias</button>
                    <button class="drp-quick-${type}" data-preset="30" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 30 dias</button>
                    <button class="drp-quick-${type}" data-preset="90" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 90 dias</button>
                    <button class="drp-quick-${type}" data-preset="month" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Este mês</button>
                    <button class="drp-quick-${type}" data-preset="365" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Último ano</button>
                    <button class="drp-quick-${type}" data-preset="all" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Todo período</button>
                </div>
                
                <div id="${type}Calendar" style="border-top: 1px solid #3f3f46; padding-top: 1rem;"></div>
                
                <p id="${type}Hint" style="color: #f59e0b; font-size: 0.8rem; text-align: center; margin: 0.75rem 0;">
                    👆 Clique em um dia para iniciar
                </p>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #3f3f46; padding-top: 1rem;">
                <button id="${type}ClearBtn" style="padding:0.5rem 1rem;background:transparent;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;">Limpar</button>
                <button id="${type}CancelBtn" style="padding:0.5rem 1rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#e4e4e7;cursor:pointer;">Cancelar</button>
                <button id="${type}ApplyBtn" style="padding:0.5rem 1rem;background:#8b5cf6;border:none;border-radius:6px;color:white;cursor:pointer;font-weight:600;">Aplicar</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Renderizar calendário
        const calendarContainer = document.getElementById(type + 'Calendar');
        this.renderCalendar(calendarContainer, tempPicker, type);
        
        // Event listeners para atalhos rápidos
        popup.querySelectorAll(`.drp-quick-${type}`).forEach(btn => {
            btn.onclick = () => {
                const preset = btn.dataset.preset;
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                
                if (preset === 'month') {
                    tempPicker.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    tempPicker.endDate = today;
                } else if (preset === 'all') {
                    if (type === 'csat') {
                        this.csatPeriodFilter = 'all';
                        this.csatCustomDateRange = { start: null, end: null };
                    } else {
                        this.tempoPeriodFilter = 'all';
                        this.tempoCustomDateRange = { start: null, end: null };
                    }
                    popup.remove();
                    this.refreshSection(type);
                    return;
                } else {
                    const days = parseInt(preset);
                    tempPicker.startDate = new Date(today);
                    tempPicker.startDate.setDate(tempPicker.startDate.getDate() - days + 1);
                    tempPicker.endDate = today;
                }
                this.renderCalendar(calendarContainer, tempPicker, type);
                document.getElementById(type + 'Hint').textContent = 
                    `📅 ${tempPicker.startDate.toLocaleDateString('pt-BR')} → ${tempPicker.endDate.toLocaleDateString('pt-BR')}`;
            };
        });
        
        // Botões de ação
        document.getElementById(type + 'ClearBtn').onclick = () => {
            tempPicker.startDate = null;
            tempPicker.endDate = null;
            this.renderCalendar(calendarContainer, tempPicker, type);
            document.getElementById(type + 'Hint').textContent = '👆 Clique em um dia para iniciar';
        };
        
        document.getElementById(type + 'CancelBtn').onclick = () => popup.remove();
        
        document.getElementById(type + 'ApplyBtn').onclick = () => {
            if (tempPicker.startDate && tempPicker.endDate) {
                if (type === 'csat') {
                    this.csatCustomDateRange = {
                        start: tempPicker.startDate.toISOString().split('T')[0],
                        end: tempPicker.endDate.toISOString().split('T')[0]
                    };
                    this.csatPeriodFilter = 'custom';
                } else {
                    this.tempoCustomDateRange = {
                        start: tempPicker.startDate.toISOString().split('T')[0],
                        end: tempPicker.endDate.toISOString().split('T')[0]
                    };
                    this.tempoPeriodFilter = 'custom';
                }
                popup.remove();
                this.refreshSection(type);
            }
        };
        
        // Fechar ao clicar fora (mas não nos dias do calendário)
        const closeHandler = (e) => {
            // Não fechar se clicar dentro do popup
            if (popup.contains(e.target)) return;
            // Não fechar se clicar no botão que abre o popup
            if (e.target.id === btnId || e.target.closest('#' + btnId)) return;
            popup.remove();
            document.removeEventListener('mousedown', closeHandler);
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 100);
    },
    
    /**
     * Renderiza o calendário visual
     */
    renderCalendar(container, picker, type) {
        const month = picker.currentMonth || new Date();
        const year = month.getFullYear();
        const monthNum = month.getMonth();
        
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        const firstDay = new Date(year, monthNum, 1).getDay();
        const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
        
        let calendarHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <button onclick="window.BICSATModule.navigateMonth(-1, '${type}')" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">◀◀</button>
                <button onclick="window.BICSATModule.navigateMonth(-1, '${type}')" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">◀</button>
                <span style="color:white;font-weight:600;">${monthNames[monthNum]} ${year}</span>
                <button onclick="window.BICSATModule.navigateMonth(1, '${type}')" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">▶</button>
                <button onclick="window.BICSATModule.navigateMonth(1, '${type}')" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">▶▶</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center;">
                <div style="color:#64748b;font-size:0.75rem;padding:0.5rem;">Dom</div>
                <div style="color:#64748b;font-size:0.75rem;padding:0.5rem;">Seg</div>
                <div style="color:#64748b;font-size:0.75rem;padding:0.5rem;">Ter</div>
                <div style="color:#64748b;font-size:0.75rem;padding:0.5rem;">Qua</div>
                <div style="color:#64748b;font-size:0.75rem;padding:0.5rem;">Qui</div>
                <div style="color:#64748b;font-size:0.75rem;padding:0.5rem;">Sex</div>
                <div style="color:#64748b;font-size:0.75rem;padding:0.5rem;">Sáb</div>
        `;
        
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += `<div></div>`;
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthNum, day);
            const isStart = picker.startDate && date.toDateString() === picker.startDate.toDateString();
            const isEnd = picker.endDate && date.toDateString() === picker.endDate.toDateString();
            const isInRange = picker.startDate && picker.endDate && date > picker.startDate && date < picker.endDate;
            const isToday = date.toDateString() === new Date().toDateString();
            
            let bgColor = 'transparent';
            let textColor = '#e4e4e7';
            let border = 'none';
            
            if (isStart || isEnd) {
                bgColor = '#8b5cf6';
                textColor = 'white';
            } else if (isInRange) {
                bgColor = 'rgba(139, 92, 246, 0.3)';
            }
            if (isToday) {
                border = '2px solid #10b981';
            }
            
            calendarHTML += `
                <div onclick="window.BICSATModule.selectDate(${year}, ${monthNum}, ${day}, '${type}')" 
                     style="padding:0.5rem;cursor:pointer;border-radius:6px;background:${bgColor};color:${textColor};border:${border};transition:all 0.2s;"
                     onmouseover="this.style.background='${isStart || isEnd ? '#7c3aed' : 'rgba(139,92,246,0.2)'}'"
                     onmouseout="this.style.background='${bgColor}'">${day}</div>
            `;
        }
        
        calendarHTML += '</div>';
        container.innerHTML = calendarHTML;
    },
    
    /**
     * Navega entre meses
     */
    navigateMonth(direction, type) {
        const picker = type === 'csat' ? this._csatTempPicker : this._tempoTempPicker;
        if (!picker) return;
        picker.currentMonth.setMonth(picker.currentMonth.getMonth() + direction);
        const container = document.getElementById(type + 'Calendar');
        if (container) this.renderCalendar(container, picker, type);
    },
    
    /**
     * Seleciona uma data no calendário
     */
    selectDate(year, month, day, type) {
        const picker = type === 'csat' ? this._csatTempPicker : this._tempoTempPicker;
        if (!picker) return;
        
        const selectedDate = new Date(year, month, day);
        
        if (!picker.startDate || (picker.startDate && picker.endDate)) {
            picker.startDate = selectedDate;
            picker.endDate = null;
            document.getElementById(type + 'Hint').textContent = '👆 Clique em outro dia para finalizar';
        } else {
            if (selectedDate < picker.startDate) {
                picker.endDate = picker.startDate;
                picker.startDate = selectedDate;
            } else {
                picker.endDate = selectedDate;
            }
            document.getElementById(type + 'Hint').textContent = 
                `📅 ${picker.startDate.toLocaleDateString('pt-BR')} → ${picker.endDate.toLocaleDateString('pt-BR')}`;
        }
        
        const container = document.getElementById(type + 'Calendar');
        if (container) this.renderCalendar(container, picker, type);
    },
    
    /**
     * Atualiza a seção após mudança de filtro
     */
    async refreshSection(type) {
        if (type === 'csat') {
            const container = document.getElementById('biCSATContent');
            if (container) {
                container.innerHTML = '<div style="text-align:center;padding:2rem;color:#a1a1aa;">⏳ Carregando...</div>';
                container.innerHTML = await this.renderCSATSection();
            }
        } else {
            const container = document.getElementById('biTimeContent');
            if (container) {
                container.innerHTML = '<div style="text-align:center;padding:2rem;color:#a1a1aa;">⏳ Carregando...</div>';
                container.innerHTML = await this.renderTimeSection();
            }
        }
    },
    
    /**
     * Retorna texto descritivo do período
     */
    getDateRangeText(type) {
        const customRange = type === 'csat' ? this.csatCustomDateRange : this.tempoCustomDateRange;
        const periodFilter = type === 'csat' ? this.csatPeriodFilter : this.tempoPeriodFilter;
        
        if (periodFilter === 'custom' && customRange.start && customRange.end) {
            const start = new Date(customRange.start);
            const end = new Date(customRange.end);
            return `${start.toLocaleDateString('pt-BR')} → ${end.toLocaleDateString('pt-BR')}`;
        }
        const labels = { '7': '7 dias', '30': '30 dias', '90': '90 dias', '180': '180 dias', '365': '1 ano', 'all': 'Tudo' };
        return labels[periodFilter] || 'Personalizado';
    },
    
    /**
     * Renderiza o botão de filtro de período (abre calendário visual)
     */
    renderPeriodFilter(currentValue, type = 'csat') {
        const isCustom = currentValue === 'custom';
        const btnId = type + 'PeriodBtn';
        const datePickerFn = type === 'csat' ? 'openCSATDatePicker' : 'openTempoDatePicker';
        
        return `
            <button id="${btnId}" onclick="window.BICSATModule.${datePickerFn}()" style="
                padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s;
                background: ${isCustom ? '#8b5cf6' : '#334155'};
                color: ${isCustom ? 'white' : '#e4e4e7'};
                border: 1px solid ${isCustom ? '#8b5cf6' : '#475569'};
                display: flex; align-items: center; gap: 0.5rem;
                font-size: 0.9rem;
            ">
                <span>📅</span>
                <span>${this.getDateRangeText(type)}</span>
                <span style="color: ${isCustom ? 'rgba(255,255,255,0.7)' : '#6b7280'};">▼</span>
            </button>
        `;
    },
    
    /**
     * Renderiza seção completa de CSAT
     */
    async renderCSATSection() {
        const allRatings = await this.loadCSATData();
        const periodRatings = this.filterByPeriod(allRatings, this.csatPeriodFilter, 'created_at', 'csat');
        const agents = await this.loadAgentsData();
        
        // Aplicar filtro de agente aos ratings (para cards e gráfico de tendência)
        const ratings = this.csatAgentFilter !== 'all' 
            ? periodRatings.filter(r => String(r.agent_id) === String(this.csatAgentFilter))
            : periodRatings;
        
        const stats = this.calculateCSATStats(ratings);
        
        // Para o ranking de agentes, sempre usar todos os ratings do período (sem filtro de agente)
        const allAgentsStats = this.calculateCSATStats(periodRatings);
        
        // Calcular CSAT por agente com nomes (usando stats de todos os agentes)
        const agentRankingArray = Object.entries(allAgentsStats.byAgent)
            .map(([agentId, data]) => ({
                id: agentId,
                name: agents[agentId] || `Agent ${agentId}`,
                total: data.total,
                satisfied: data.satisfied,
                csat: data.total > 0 ? Math.round((data.satisfied / data.total) * 100) : 0,
                avgScore: data.scores.length > 0 ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1) : 0
            }))
            .sort((a, b) => b.csat - a.csat);
        
        // Calcular tendência mensal
        const monthlyData = Object.entries(stats.byMonth)
            .map(([month, data]) => ({
                month,
                csat: data.total > 0 ? Math.round((data.satisfied / data.total) * 100) : 0,
                total: data.total
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12); // Últimos 12 meses
        
        const csatColor = stats.csatPercent >= 85 ? this.colors.satisfied : 
                         stats.csatPercent >= 70 ? this.colors.neutral : this.colors.unsatisfied;
        
        const periodLabel = this.csatPeriodFilter === 'all' ? '' : ` (Últimos ${this.csatPeriodFilter} dias)`;
        
        // Label do agente selecionado
        const selectedAgentName = this.csatAgentFilter !== 'all' 
            ? agentRankingArray.find(a => String(a.id) === String(this.csatAgentFilter))?.name || 'Agente'
            : null;
        const agentLabel = selectedAgentName ? ` - ${selectedAgentName}` : '';
        
        return `
            <div class="bi-csat-section" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <h2 style="color: ${this.colors.text}; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        ⭐ Satisfação do Cliente (CSAT)${periodLabel}
                    </h2>
                    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                        <!-- Filtro por Agente -->
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span style="color: ${this.colors.textMuted}; font-size: 0.85rem;">👤 Agente:</span>
                            <select onchange="window.BICSATModule.setAgentFilter(this.value)" style="
                                padding: 0.4rem 0.8rem;
                                border-radius: 6px;
                                border: 1px solid ${this.colors.border};
                                background: ${this.colors.surface};
                                color: ${this.colors.text};
                                cursor: pointer;
                                font-size: 0.8rem;
                            ">
                                <option value="all" ${this.csatAgentFilter === 'all' ? 'selected' : ''}>Todos</option>
                                ${agentRankingArray.map(agent => `
                                    <option value="${agent.id}" ${this.csatAgentFilter === agent.id ? 'selected' : ''}>
                                        ${agent.name} (${agent.total})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        ${this.renderPeriodFilter(this.csatPeriodFilter, 'csat')}
                    </div>
                </div>
                
                <!-- KPIs Principais -->
                ${selectedAgentName ? `
                    <div style="background: ${this.colors.primary}22; border: 1px solid ${this.colors.primary}; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.1rem;">👤</span>
                        <span style="color: ${this.colors.text}; font-size: 0.9rem;">Filtrando por: <strong style="color: ${this.colors.primary};">${selectedAgentName}</strong></span>
                        <button onclick="window.BICSATModule.setAgentFilter('all')" style="
                            margin-left: auto;
                            background: ${this.colors.primary};
                            color: white;
                            border: none;
                            padding: 0.25rem 0.5rem;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.75rem;
                        ">✕ Limpar</button>
                    </div>
                ` : ''}
                <!-- KPIs Premium SaaS -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 2rem;">
                    <!-- CSAT % -->
                    <div class="bi-card" style="
                        background: #1a1a2e;
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.08);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">CSAT${selectedAgentName ? '' : ' Geral'}</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${csatColor}" stroke-width="2" opacity="0.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: ${csatColor}; line-height: 1;">${stats.csatPercent}%</div>
                        <div style="color: #52525b; font-size: 0.65rem; margin-top: 0.35rem;">Meta: ≥85%</div>
                    </div>
                    
                    <!-- Total Avaliações -->
                    <div class="bi-card csat-clickable-card" onclick="window.BICSATModule.openTicketsModal('all')" style="
                        background: #1a1a2e;
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.08);
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.borderColor='rgba(99,102,241,0.4)'; this.style.transform='translateY(-2px)';"
                       onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'; this.style.transform='none';">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Total de Avaliações</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: #e4e4e7; line-height: 1;">${stats.total}</div>
                        <div style="color: #6366f1; font-size: 0.6rem; margin-top: 0.35rem;">Clique para ver</div>
                    </div>
                    
                    <!-- Satisfeitos -->
                    <div class="bi-card csat-clickable-card" onclick="window.BICSATModule.openTicketsModal('satisfied')" style="
                        background: #1a1a2e;
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.08);
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.borderColor='rgba(16,185,129,0.4)'; this.style.transform='translateY(-2px)';"
                       onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'; this.style.transform='none';">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Satisfeitos</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" opacity="0.6"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: #10b981; line-height: 1;">${stats.satisfied}</div>
                        <div style="color: #10b981; font-size: 0.6rem; margin-top: 0.35rem;">Clique para ver</div>
                    </div>
                    
                    <!-- Insatisfeitos -->
                    <div class="bi-card csat-clickable-card" onclick="window.BICSATModule.openTicketsModal('unsatisfied')" style="
                        background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(127,29,29,0.1) 100%);
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(239,68,68,0.25);
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.borderColor='rgba(239,68,68,0.5)'; this.style.transform='translateY(-2px)';"
                       onmouseout="this.style.borderColor='rgba(239,68,68,0.25)'; this.style.transform='none';">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Insatisfeitos</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.6"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: #ef4444; line-height: 1;">${stats.unsatisfied}</div>
                        <div style="color: #ef4444; font-size: 0.6rem; margin-top: 0.35rem;">Clique para ver</div>
                    </div>
                </div>
                
                <!-- Gráficos e Tabelas -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
                    
                    <!-- Tendência Mensal - Premium -->
                    <div class="bi-card" style="background: #1a1a2e; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            <h3 style="color: #e4e4e7; margin: 0; font-size: 1rem; font-weight: 600;">Tendência CSAT${agentLabel} (Últimos 12 meses)</h3>
                        </div>
                        <div style="height: 220px; display: flex; align-items: flex-end; gap: 8px; padding: 1rem 0; position: relative;">
                            ${monthlyData.map(m => {
                                const barColor = m.csat >= 85 ? this.colors.satisfied : 
                                               m.csat >= 70 ? this.colors.neutral : this.colors.unsatisfied;
                                return `
                                    <div class="csat-bar-container" style="flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; cursor: pointer;"
                                         onmouseover="this.querySelector('.csat-tooltip').style.opacity='1'; this.querySelector('.csat-tooltip').style.visibility='visible';"
                                         onmouseout="this.querySelector('.csat-tooltip').style.opacity='0'; this.querySelector('.csat-tooltip').style.visibility='hidden';">
                                        <div class="csat-tooltip" style="
                                            position: absolute;
                                            bottom: calc(${Math.max(10, m.csat * 1.8)}px + 30px);
                                            background: #1e1e2e;
                                            color: #fff;
                                            padding: 6px 10px;
                                            border-radius: 6px;
                                            font-size: 0.75rem;
                                            white-space: nowrap;
                                            opacity: 0;
                                            visibility: hidden;
                                            transition: all 0.2s;
                                            z-index: 100;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                            pointer-events: none;
                                        ">
                                            <strong>${m.month}</strong><br>
                                            CSAT: ${m.csat}%<br>
                                            ${m.total} avaliações
                                        </div>
                                        <div style="
                                            width: 100%;
                                            height: ${Math.max(10, m.csat * 1.8)}px;
                                            background: ${barColor};
                                            border-radius: 4px 4px 0 0;
                                            transition: all 0.3s;
                                        "></div>
                                        <div style="font-size: 0.65rem; color: ${this.colors.textMuted}; margin-top: 4px; transform: rotate(-45deg); white-space: nowrap;">
                                            ${m.month.slice(5)}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- Ranking por Agente - Premium -->
                    <div class="bi-card" style="background: #1a1a2e; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <h3 style="color: #e4e4e7; margin: 0; font-size: 1rem; font-weight: 600;">Ranking CSAT por Agente</h3>
                        </div>
                        <div style="max-height: 250px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                        <th style="text-align: left; padding: 0.5rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">#</th>
                                        <th style="text-align: left; padding: 0.5rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Agente</th>
                                        <th style="text-align: center; padding: 0.5rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">CSAT</th>
                                        <th style="text-align: center; padding: 0.5rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Avaliações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${agentRankingArray.slice(0, 10).map((agent, i) => {
                                        const agentCsatColor = agent.csat >= 85 ? '#10b981' : 
                                                             agent.csat >= 70 ? '#f59e0b' : '#ef4444';
                                        return `
                                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                                <td style="padding: 0.5rem; color: ${i < 3 ? '#fbbf24' : '#71717a'}; font-weight: ${i < 3 ? '600' : '400'};">${i + 1}</td>
                                                <td style="padding: 0.5rem; color: #e4e4e7; font-weight: 500;">
                                                    ${agent.name.length > 20 ? agent.name.slice(0, 18) + '...' : agent.name}
                                                </td>
                                                <td style="padding: 0.5rem; text-align: center;">
                                                    <span style="
                                                        background: ${agentCsatColor}20;
                                                        color: ${agentCsatColor};
                                                        padding: 2px 10px;
                                                        border-radius: 4px;
                                                        font-weight: 600;
                                                        font-size: 0.85rem;
                                                    ">${agent.csat}%</span>
                                                </td>
                                                <td style="padding: 0.5rem; text-align: center; color: #a1a1aa;">${agent.total}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Avaliações dos Tickets -->
                ${stats.allFeedbacks && stats.allFeedbacks.length > 0 ? (() => {
                    // Filtrar por agente se selecionado
                    let filteredFeedbacks = stats.allFeedbacks;
                    if (this.csatAgentFilter !== 'all') {
                        filteredFeedbacks = stats.allFeedbacks.filter(fb => String(fb.agentId) === String(this.csatAgentFilter));
                    }
                    
                    // Paginação
                    const totalPages = Math.ceil(filteredFeedbacks.length / this.feedbacksPerPage);
                    const startIdx = (this.feedbackPage - 1) * this.feedbacksPerPage;
                    const pageItems = this.showAllFeedbacks 
                        ? filteredFeedbacks.slice(startIdx, startIdx + this.feedbacksPerPage)
                        : filteredFeedbacks.slice(0, 5);
                    
                    return `
                    <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                <h3 style="color: #e4e4e7; margin: 0; font-size: 0.95rem; font-weight: 600;">Avaliações dos Tickets <span style="color: #71717a; font-weight: 400;">(${filteredFeedbacks.length})</span></h3>
                            </div>
                            <button onclick="window.BICSATModule.toggleAllFeedbacks()" style="
                                padding: 0.35rem 0.75rem;
                                border-radius: 6px;
                                border: 1px solid rgba(99,102,241,0.3);
                                background: ${this.showAllFeedbacks ? 'rgba(99,102,241,0.15)' : 'transparent'};
                                color: #a5b4fc;
                                cursor: pointer;
                                font-size: 0.75rem;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='rgba(99,102,241,0.2)'" onmouseout="this.style.background='${this.showAllFeedbacks ? 'rgba(99,102,241,0.15)' : 'transparent'}'">${this.showAllFeedbacks ? 'Mostrar Resumo' : 'Ver Todos'}</button>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem; ${this.showAllFeedbacks ? '' : 'max-height: 350px;'} overflow-y: auto;">
                            ${pageItems.map(fb => {
                                // Detectar formato Freshdesk (valores absolutos grandes como 103, -103)
                                const isFreshdeskFormat = Math.abs(fb.score) > 5;
                                
                                // Determinar satisfação baseado no formato
                                let isSatisfied, isNeutral;
                                if (isFreshdeskFormat) {
                                    isSatisfied = fb.score > 0;
                                    isNeutral = fb.score === 0;
                                } else {
                                    isSatisfied = fb.score >= 4;
                                    isNeutral = fb.score === 3;
                                }
                                
                                const displayScore = isFreshdeskFormat 
                                    ? (fb.score > 0 ? '👍 Satisfeito' : '👎 Insatisfeito')
                                    : fb.score + '/5';
                                const scoreColor = isSatisfied ? this.colors.satisfied : 
                                                 isNeutral ? this.colors.neutral : this.colors.unsatisfied;
                                const scoreEmoji = isSatisfied ? '😊' : isNeutral ? '😐' : '😞';
                                const agentName = agents[fb.agentId] || 'N/A';
                                return `
                                    <div onclick="window.BICSATModule.openTicket(${fb.ticketId})" style="
                                        background: ${this.colors.background};
                                        padding: 1rem;
                                        border-radius: 8px;
                                        border-left: 3px solid ${scoreColor};
                                        cursor: pointer;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.2)';"
                                       onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                            <span style="color: ${scoreColor}; font-weight: 600;">${scoreEmoji} ${displayScore}</span>
                                            <span style="color: ${this.colors.primary}; font-size: 0.8rem; text-decoration: underline;">
                                                🔗 Ticket #${fb.ticketId}
                                            </span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                            <span style="color: ${this.colors.textMuted}; font-size: 0.75rem;">
                                                👤 ${agentName}
                                            </span>
                                            <span style="color: ${this.colors.textMuted}; font-size: 0.75rem;">
                                                ${new Date(fb.date).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        ${fb.feedback ? `
                                            <p style="color: ${this.colors.text}; margin: 0; font-size: 0.85rem; line-height: 1.4; font-style: italic;">
                                                "${fb.feedback}"
                                            </p>
                                        ` : `
                                            <p style="color: ${this.colors.textMuted}; margin: 0; font-size: 0.8rem;">
                                                (Sem comentário)
                                            </p>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        ${this.showAllFeedbacks && totalPages > 1 ? `
                            <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid ${this.colors.border};">
                                <button onclick="window.BICSATModule.changeFeedbackPage(-1)" 
                                    ${this.feedbackPage <= 1 ? 'disabled' : ''} 
                                    style="padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid ${this.colors.border}; background: transparent; color: ${this.feedbackPage <= 1 ? this.colors.textMuted : this.colors.text}; cursor: ${this.feedbackPage <= 1 ? 'not-allowed' : 'pointer'};">
                                    ← Anterior
                                </button>
                                <span style="color: ${this.colors.text}; font-size: 0.85rem;">
                                    Página ${this.feedbackPage} de ${totalPages}
                                </span>
                                <button onclick="window.BICSATModule.changeFeedbackPage(1)" 
                                    ${this.feedbackPage >= totalPages ? 'disabled' : ''} 
                                    style="padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid ${this.colors.border}; background: transparent; color: ${this.feedbackPage >= totalPages ? this.colors.textMuted : this.colors.text}; cursor: ${this.feedbackPage >= totalPages ? 'not-allowed' : 'pointer'};">
                                    Próxima →
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    `;
                })() : ''}
            </div>
        `;
    },
    
    /**
     * Renderiza seção completa de Time Entries
     */
    async renderTimeSection() {
        const allEntries = await this.loadTimeEntriesData();
        const entries = this.filterByPeriod(allEntries, this.tempoPeriodFilter, 'created_at', 'tempo');
        const agents = await this.loadAgentsData();
        const stats = this.calculateTimeStats(entries);
        
        // Ranking de agentes por tempo
        const agentTimeRanking = Object.entries(stats.byAgent)
            .map(([agentId, data]) => ({
                id: agentId,
                name: agents[agentId] || `Agent ${agentId}`,
                totalMinutes: data.minutes,
                ticketCount: data.ticketCount,
                avgMinutes: data.ticketCount > 0 ? Math.round(data.minutes / data.ticketCount) : 0
            }))
            .sort((a, b) => b.totalMinutes - a.totalMinutes);
        
        const periodLabel = this.tempoPeriodFilter === 'all' ? '' : ` (Últimos ${this.tempoPeriodFilter} dias)`;
        
        return `
            <div class="bi-time-section" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <h2 style="color: ${this.colors.text}; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        ⏱️ Tempo de Atendimento${periodLabel}
                    </h2>
                    ${this.renderPeriodFilter(this.tempoPeriodFilter, 'tempo')}
                </div>
                
                <!-- KPIs Premium SaaS -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 2rem;">
                    <!-- Tempo Total -->
                    <div class="bi-card" style="
                        background: linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(8,145,178,0.1) 100%);
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(6,182,212,0.3);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tempo Total Registrado</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: #06b6d4; line-height: 1;">${stats.totalHours}h</div>
                    </div>
                    
                    <!-- Tempo Médio -->
                    <div class="bi-card" style="
                        background: #1a1a2e;
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.08);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tempo Médio/Entry</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: #e4e4e7; line-height: 1;">${this.formatTime(stats.avgMinutes)}</div>
                    </div>
                    
                    <!-- Total Entries -->
                    <div class="bi-card" style="
                        background: #1a1a2e;
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.08);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Registros de Tempo</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: #f59e0b; line-height: 1;">${stats.total}</div>
                    </div>
                    
                    <!-- Tickets com Tempo -->
                    <div class="bi-card" style="
                        background: #1a1a2e;
                        padding: 1.25rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.08);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tickets com Tempo</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.6"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: #3b82f6; line-height: 1;">${Object.keys(stats.byTicket).length}</div>
                    </div>
                </div>
                
                <!-- Ranking por Agente - Premium -->
                <div class="bi-card" style="background: #1a1a2e; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <h3 style="color: #e4e4e7; margin: 0; font-size: 1rem; font-weight: 600;">Tempo por Agente</h3>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                    <th style="text-align: left; padding: 0.75rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">#</th>
                                    <th style="text-align: left; padding: 0.75rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Agente</th>
                                    <th style="text-align: center; padding: 0.75rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tempo Total</th>
                                    <th style="text-align: center; padding: 0.75rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tickets</th>
                                    <th style="text-align: center; padding: 0.75rem; color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Média/Ticket</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${agentTimeRanking.slice(0, 15).map((agent, i) => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 0.75rem; color: ${i < 3 ? '#fbbf24' : '#71717a'}; font-weight: ${i < 3 ? '600' : '400'};">${i + 1}</td>
                                        <td style="padding: 0.75rem; color: #e4e4e7; font-weight: 500;">
                                            ${agent.name.length > 25 ? agent.name.slice(0, 23) + '...' : agent.name}
                                        </td>
                                        <td style="padding: 0.75rem; text-align: center; color: #06b6d4; font-weight: 600;">
                                            ${this.formatTime(agent.totalMinutes)}
                                        </td>
                                        <td style="padding: 0.75rem; text-align: center; color: #a1a1aa;">
                                            ${agent.ticketCount}
                                        </td>
                                        <td style="padding: 0.75rem; text-align: center;">
                                            <span style="background: rgba(139,92,246,0.15); color: #a78bfa; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${this.formatTime(agent.avgMinutes)}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Analisa tickets por horário comercial
     * Horário comercial: Segunda a Sexta, 08:00 às 18:00 (América/São_Paulo)
     */
    analyzeBusinessHours(tickets) {
        if (!tickets || !tickets.length) {
            return {
                withinHours: 0,
                outsideHours: 0,
                percentWithin: 0,
                percentOutside: 0,
                byDayOfWeek: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
                peakHour: null
            };
        }
        
        let withinHours = 0;
        let outsideHours = 0;
        const byDayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const byHour = new Array(24).fill(0);
        
        tickets.forEach(ticket => {
            if (!ticket.created_at) return;
            
            const date = new Date(ticket.created_at);
            const day = date.getDay(); // 0 = domingo
            const hour = date.getHours();
            
            byDayOfWeek[day]++;
            byHour[hour]++;
            
            // Verificar se está dentro do horário comercial
            // Segunda (1) a Sexta (5), 08:00 às 18:00
            const isWeekday = day >= 1 && day <= 5;
            const isBusinessHour = hour >= 8 && hour < 18;
            
            if (isWeekday && isBusinessHour) {
                withinHours++;
            } else {
                outsideHours++;
            }
        });
        
        const total = withinHours + outsideHours;
        const peakHourValue = Math.max(...byHour);
        const peakHour = byHour.indexOf(peakHourValue);
        
        return {
            withinHours,
            outsideHours,
            percentWithin: total > 0 ? Math.round((withinHours / total) * 100) : 0,
            percentOutside: total > 0 ? Math.round((outsideHours / total) * 100) : 0,
            byDayOfWeek,
            byHour,
            peakHour,
            peakHourValue
        };
    },
    
    /**
     * Renderiza seção de Business Hours
     */
    renderBusinessHoursCard(tickets) {
        const stats = this.analyzeBusinessHours(tickets);
        
        const withinColor = stats.percentWithin >= 70 ? this.colors.satisfied : 
                           stats.percentWithin >= 50 ? '#f59e0b' : this.colors.unsatisfied;
        
        return `
            <div style="
                background: ${this.colors.surface};
                padding: 1.5rem;
                border-radius: 12px;
                border: 1px solid ${this.colors.border};
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        🏢 Horário Comercial
                    </h4>
                    <span style="font-size: 0.75rem; color: ${this.colors.textMuted};">
                        Seg-Sex 08h-18h
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: ${withinColor}22; border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: ${withinColor};">
                            ${stats.percentWithin}%
                        </div>
                        <div style="font-size: 0.8rem; color: ${this.colors.textMuted};">
                            Dentro do expediente
                        </div>
                        <div style="font-size: 0.75rem; color: ${this.colors.textMuted};">
                            ${stats.withinHours.toLocaleString()} tickets
                        </div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: ${this.colors.text};">
                            ${stats.percentOutside}%
                        </div>
                        <div style="font-size: 0.8rem; color: ${this.colors.textMuted};">
                            Fora do expediente
                        </div>
                        <div style="font-size: 0.75rem; color: ${this.colors.textMuted};">
                            ${stats.outsideHours.toLocaleString()} tickets
                        </div>
                    </div>
                </div>
                
                ${stats.peakHour !== null ? `
                <div style="text-align: center; padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                    <span style="color: ${this.colors.textMuted};">⏰ Pico de demanda:</span>
                    <strong style="color: ${this.colors.primary}; margin-left: 0.5rem;">
                        ${stats.peakHour}h - ${stats.peakHour + 1}h
                    </strong>
                    <span style="color: ${this.colors.textMuted}; font-size: 0.8rem; margin-left: 0.5rem;">
                        (${stats.peakHourValue} tickets)
                    </span>
                </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Abre modal com tickets filtrados por categoria CSAT
     */
    async openTicketsModal(filter = 'all') {
        const ratings = await this.loadCSATData();
        const agents = await this.loadAgentsData();
        
        // Aplicar filtro de período
        const filteredRatings = this.filterByPeriod(ratings, this.csatPeriodFilter, 'created_at', 'csat');
        
        // Aplicar filtro de agente se não for 'all'
        let displayRatings = this.csatAgentFilter !== 'all' 
            ? filteredRatings.filter(r => String(r.agent_id) === String(this.csatAgentFilter))
            : filteredRatings;
        
        // Filtrar por categoria
        const filterLabels = {
            'all': { title: '📝 Todas as Avaliações', icon: '📝', color: this.colors.primary },
            'satisfied': { title: '😊 Tickets Satisfeitos', icon: '😊', color: this.colors.satisfied },
            'unsatisfied': { title: '😞 Tickets Insatisfeitos', icon: '😞', color: this.colors.unsatisfied }
        };
        
        const filterInfo = filterLabels[filter] || filterLabels['all'];
        
        // Aplicar filtro de satisfação
        displayRatings = displayRatings.filter(rating => {
            const score = rating.rating || rating.score || 0;
            const isFreshdeskFormat = Math.abs(score) > 5;
            
            if (filter === 'satisfied') {
                return isFreshdeskFormat ? score > 0 : score >= 4;
            } else if (filter === 'unsatisfied') {
                return isFreshdeskFormat ? score < 0 : (score >= 1 && score <= 2);
            }
            return true; // 'all'
        });
        
        // Ordenar por data (mais recente primeiro)
        displayRatings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Criar modal
        const existingModal = document.getElementById('csatTicketsModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'csatTicketsModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 2rem;
        `;
        
        modal.innerHTML = `
            <div style="
                background: ${this.colors.background};
                border-radius: 16px;
                width: 100%;
                max-width: 900px;
                max-height: 85vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                border: 1px solid ${this.colors.border};
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            ">
                <!-- Header -->
                <div style="
                    padding: 1.5rem;
                    border-bottom: 1px solid ${this.colors.border};
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: ${this.colors.surface};
                ">
                    <div>
                        <h2 style="margin: 0; color: ${filterInfo.color}; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${filterInfo.title}
                        </h2>
                        <p style="margin: 0.5rem 0 0 0; color: ${this.colors.textMuted}; font-size: 0.9rem;">
                            ${displayRatings.length} ticket(s) encontrado(s)
                        </p>
                    </div>
                    <button onclick="document.getElementById('csatTicketsModal').remove()" style="
                        background: transparent;
                        border: none;
                        color: ${this.colors.textMuted};
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        line-height: 1;
                    " onmouseover="this.style.color='${this.colors.text}'" 
                       onmouseout="this.style.color='${this.colors.textMuted}'">✕</button>
                </div>
                
                <!-- Content -->
                <div style="
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                ">
                    ${displayRatings.length === 0 ? `
                        <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                            <p>Nenhum ticket encontrado nesta categoria.</p>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${displayRatings.map(rating => {
                                const score = rating.rating || rating.score || 0;
                                const isFreshdeskFormat = Math.abs(score) > 5;
                                const isSatisfied = isFreshdeskFormat ? score > 0 : score >= 4;
                                const scoreColor = isSatisfied ? this.colors.satisfied : this.colors.unsatisfied;
                                const scoreEmoji = isSatisfied ? '😊' : '😞';
                                const displayScore = isFreshdeskFormat 
                                    ? (score > 0 ? '👍 Satisfeito' : '👎 Insatisfeito')
                                    : score + '/5';
                                const agentName = agents[rating.agent_id] || 'N/A';
                                const feedback = rating.feedback || '';
                                
                                return `
                                    <div onclick="window.BICSATModule.openTicket(${rating.ticket_id})" style="
                                        background: ${this.colors.surface};
                                        padding: 1rem 1.25rem;
                                        border-radius: 10px;
                                        border-left: 4px solid ${scoreColor};
                                        cursor: pointer;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.transform='translateX(4px)'; this.style.background='${this.colors.surface}ee';"
                                       onmouseout="this.style.transform='none'; this.style.background='${this.colors.surface}';">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                            <div style="display: flex; align-items: center; gap: 1rem;">
                                                <span style="color: ${scoreColor}; font-weight: 600; font-size: 0.95rem;">
                                                    ${scoreEmoji} ${displayScore}
                                                </span>
                                                <span style="color: ${this.colors.primary}; font-weight: 600;">
                                                    🎫 Ticket #${rating.ticket_id}
                                                </span>
                                            </div>
                                            <span style="color: ${this.colors.textMuted}; font-size: 0.8rem;">
                                                ${new Date(rating.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="color: ${this.colors.textMuted}; font-size: 0.85rem;">
                                                👤 ${agentName}
                                            </span>
                                        </div>
                                        ${feedback ? `
                                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid ${this.colors.border};">
                                                <p style="color: ${this.colors.text}; margin: 0; font-size: 0.9rem; font-style: italic; line-height: 1.5;">
                                                    "${feedback}"
                                                </p>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
                
                <!-- Footer -->
                <div style="
                    padding: 1rem 1.5rem;
                    border-top: 1px solid ${this.colors.border};
                    display: flex;
                    justify-content: flex-end;
                    background: ${this.colors.surface};
                ">
                    <button onclick="document.getElementById('csatTicketsModal').remove()" style="
                        padding: 0.6rem 1.5rem;
                        border: none;
                        border-radius: 8px;
                        background: ${this.colors.primary};
                        color: white;
                        cursor: pointer;
                        font-weight: 500;
                    ">Fechar</button>
                </div>
            </div>
        `;
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Fechar com ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        document.body.appendChild(modal);
    },
    
    /**
     * Inicializa e carrega todos os dados
     */
    async initialize() {
        console.log('🚀 Inicializando módulo CSAT & Time Entries...');
        await Promise.all([
            this.loadCSATData(),
            this.loadTimeEntriesData(),
            this.loadAgentsData()
        ]);
        console.log('✅ Módulo CSAT & Time Entries pronto');
    }
};

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => {
    window.BICSATModule.initialize();
});

console.log('✅ Módulo BI CSAT & Time Entries carregado');
