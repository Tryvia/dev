/**
 * BI Acompanhamento Module - Análise por Tags
 * 
 * Este módulo analisa a "tratativa indireta" baseada na coluna tags:
 * - Mede quantos tickets cada pessoa do atendimento acompanhou
 * - Calcula % de tickets acompanhados que foram resolvidos
 * 
 * Diferente do BI por Tratativa (cf_tratativa) que mede quem RESOLVEU,
 * este BI mede quem ACOMPANHOU (tags).
 */

window.BIAcompanhamentoModule = {
    // Cores do tema
    colors: {
        primary: '#8b5cf6',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        text: '#e2e8f0',
        textMuted: '#94a3b8',
        surface: '#1e293b',
        background: '#0f172a',
        border: '#334155'
    },
    
    // Lista de pessoas do time de atendimento (sincronizada com TEAM_MEMBERS_CONFIG)
    // Nota: A whitelist oficial está em bi-analytics.js (TEAM_MEMBERS_CONFIG)
    allowedPeople: [
        'Adriana Florencio',
        'Alianie Lanes',
        'Andreia Ribeiro',
        'Francisco Nascimento',
        'Gabriel Oliveira',
        'Gustavo Martins',
        'João Peres',
        'Jéssica Dias',
        'Marciele Quintanilha'
    ],
    
    // Filtros
    periodFilter: '30', // all, 7, 30, 90, 180, 365, custom
    customDateRange: { start: null, end: null },
    
    /**
     * Remove acentos de uma string para comparação
     */
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
    
    /**
     * Verifica se uma tag corresponde a uma pessoa permitida
     * Faz busca case-insensitive, sem acentos, e parcial
     */
    isAllowedPerson(tag) {
        const normalizedTag = this.removeAccents(tag.toLowerCase().trim());
        return this.allowedPeople.some(person => {
            const normalizedPerson = this.removeAccents(person.toLowerCase().trim());
            // Verifica se a tag começa com o nome da pessoa ou é exatamente igual
            return normalizedTag.startsWith(normalizedPerson) || 
                   normalizedPerson.startsWith(normalizedTag) ||
                   normalizedTag.includes(normalizedPerson) ||
                   normalizedPerson.includes(normalizedTag);
        });
    },
    
    /**
     * Retorna o nome padronizado da pessoa (da lista allowedPeople)
     */
    getNormalizedPersonName(tag) {
        const normalizedTag = this.removeAccents(tag.toLowerCase().trim());
        for (const person of this.allowedPeople) {
            const normalizedPerson = this.removeAccents(person.toLowerCase().trim());
            if (normalizedTag.startsWith(normalizedPerson) || 
                normalizedPerson.startsWith(normalizedTag) ||
                normalizedTag.includes(normalizedPerson) ||
                normalizedPerson.includes(normalizedTag)) {
                return person; // Retorna o nome padronizado da lista
            }
        }
        return tag;
    },
    
    /**
     * Extrai todas as pessoas únicas das tags (apenas as permitidas)
     */
    extractPeopleFromTags(tickets) {
        const peopleSet = new Set();
        
        tickets.forEach(ticket => {
            const tags = this.getTagsArray(ticket);
            tags.forEach(tag => {
                if (this.isAllowedPerson(tag)) {
                    peopleSet.add(this.getNormalizedPersonName(tag));
                }
            });
        });
        
        return Array.from(peopleSet).sort();
    },
    
    /**
     * Converte tags do ticket para array
     * Tags podem vir como: array, string separada por vírgula, string JSON, ou objeto
     */
    getTagsArray(ticket) {
        if (!ticket.tags) return [];
        
        let tags = ticket.tags;
        
        // Se já é array
        if (Array.isArray(tags)) {
            return tags.map(t => String(t).trim()).filter(t => t);
        }
        
        // Se é string
        if (typeof tags === 'string') {
            // Limpar possíveis caracteres extras
            tags = tags.trim();
            
            // Se parece com array JSON ["..."] ou {...}
            if ((tags.startsWith('[') && tags.endsWith(']')) || 
                (tags.startsWith('{') && tags.endsWith('}'))) {
                try {
                    const parsed = JSON.parse(tags);
                    if (Array.isArray(parsed)) {
                        return parsed.map(t => String(t).trim()).filter(t => t);
                    }
                    // Se é objeto, tentar extrair valores
                    if (typeof parsed === 'object' && parsed !== null) {
                        return Object.values(parsed).map(t => String(t).trim()).filter(t => t);
                    }
                } catch (e) {
                    // Se falhou o parse, remover colchetes e aspas manualmente
                    let cleanedTags = tags.replace(/^\[|\]$/g, ''); // Remove [ e ]
                    cleanedTags = cleanedTags.replace(/^"|"$/g, ''); // Remove aspas externas
                    cleanedTags = cleanedTags.replace(/","/g, ','); // Substitui "," por ,
                    return cleanedTags.split(',').map(t => t.replace(/^"|"$/g, '').trim()).filter(t => t);
                }
            }
            
            // Separar por vírgula, ponto-e-vírgula ou barra
            return tags.split(/[,;\/]/).map(t => t.trim()).filter(t => t);
        }
        
        return [];
    },
    
    /**
     * Verifica se ticket está resolvido/fechado
     */
    isTicketResolved(ticket) {
        const status = Number(ticket.status);
        // Status 4 = Resolvido, 5 = Fechado
        return status === 4 || status === 5;
    },
    
    /**
     * Filtra tickets por período
     */
    filterByPeriod(tickets, period) {
        if (period === 'all') return tickets;
        
        // Período customizado
        if (period === 'custom' && this.customDateRange.start && this.customDateRange.end) {
            const startDate = new Date(this.customDateRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(this.customDateRange.end);
            endDate.setHours(23, 59, 59, 999);
            
            return tickets.filter(ticket => {
                const createdAt = new Date(ticket.created_at);
                return createdAt >= startDate && createdAt <= endDate;
            });
        }
        
        const days = parseInt(period);
        if (isNaN(days)) return tickets;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return tickets.filter(ticket => {
            const createdAt = new Date(ticket.created_at);
            return createdAt >= cutoffDate;
        });
    },
    
    /**
     * Calcula estatísticas de acompanhamento por pessoa
     * APENAS pessoas da lista allowedPeople são contabilizadas
     * Inclui métricas avançadas similares ao BI de Pessoas
     */
    calculateStats(tickets) {
        // Aplicar filtro de período
        const filteredTickets = this.filterByPeriod(tickets, this.periodFilter);
        
        // Mapa: pessoa -> { total, resolved, tickets[], byHour, byDayOfWeek, etc }
        const statsMap = new Map();
        
        // Contadores globais
        let ticketsComTagDoTime = 0;
        let ticketsResolvidosComTag = 0;
        const statusCounts = {};
        const priorityCounts = {};
        const systemCounts = {};
        const byMonth = {};
        const byDayOfWeek = Array(7).fill(0);
        const byHour = Array(24).fill(0);
        
        // Determinar período de análise
        const dates = filteredTickets.map(t => new Date(t.created_at)).filter(d => !isNaN(d.getTime()));
        const minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
        const maxDate = dates.length ? new Date(Math.max(...dates)) : new Date();
        const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000*60*60*24)));
        
        filteredTickets.forEach(ticket => {
            const tags = this.getTagsArray(ticket);
            const isResolved = this.isTicketResolved(ticket);
            const created = new Date(ticket.created_at);
            const validDate = created && !isNaN(created.getTime());
            
            // Verificar se este ticket tem pelo menos uma tag do time
            let temTagDoTime = false;
            
            tags.forEach(tag => {
                // FILTRO: Apenas pessoas permitidas
                if (!this.isAllowedPerson(tag)) return;
                
                temTagDoTime = true;
                const person = this.getNormalizedPersonName(tag);
                
                if (!statsMap.has(person)) {
                    statsMap.set(person, {
                        person: person,
                        total: 0,
                        resolved: 0,
                        open: 0,
                        tickets: [],
                        byHour: Array(24).fill(0),
                        byDayOfWeek: Array(7).fill(0),
                        byMonth: {},
                        resolutionTimes: [],
                        responseTimes: [],
                        slaWithin: 0,
                        slaTotal: 0
                    });
                }
                
                const stats = statsMap.get(person);
                stats.total++;
                if (isResolved) {
                    stats.resolved++;
                    
                    // Tempo de resolução
                    const resolvedAt = ticket.stats_resolved_at || ticket.resolved_at;
                    if (resolvedAt && ticket.created_at) {
                        const hours = (new Date(resolvedAt) - new Date(ticket.created_at)) / (1000*60*60);
                        if (hours > 0 && hours < 720) stats.resolutionTimes.push(hours);
                    }
                } else {
                    stats.open++;
                }
                
                // Hora e dia da semana
                if (validDate) {
                    const hour = created.getHours();
                    const dow = created.getDay();
                    if (hour >= 0 && hour < 24) stats.byHour[hour]++;
                    if (dow >= 0 && dow < 7) stats.byDayOfWeek[dow]++;
                    const monthKey = `${created.getFullYear()}-${String(created.getMonth()+1).padStart(2,'0')}`;
                    stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
                }
                
                // SLA 1ª resposta
                const resp = ticket.stats_first_responded_at || ticket.first_responded_at;
                if (resp && ticket.created_at) {
                    const hours = (new Date(resp) - new Date(ticket.created_at)) / (1000*60*60);
                    stats.slaTotal++;
                    if (hours <= 4) stats.slaWithin++;
                    if (hours > 0 && hours < 168) stats.responseTimes.push(hours);
                }
                
                stats.tickets.push({
                    id: ticket.id,
                    subject: ticket.subject,
                    status: ticket.status,
                    created_at: ticket.created_at,
                    resolved_at: ticket.stats_resolved_at || ticket.resolved_at
                });
            });
            
            // Contagens globais (apenas tickets com tag do time)
            if (temTagDoTime) {
                ticketsComTagDoTime++;
                if (isResolved) ticketsResolvidosComTag++;
                
                // Status
                const status = ticket.status || 'Desconhecido';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
                
                // Prioridade
                const priority = ticket.priority || 1;
                priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
                
                // Sistema
                const sistema = ticket.cf_sistema || ticket.cf_product || 'Não informado';
                systemCounts[sistema] = (systemCounts[sistema] || 0) + 1;
                
                // Temporal
                if (validDate) {
                    const hour = created.getHours();
                    const dow = created.getDay();
                    if (hour >= 0 && hour < 24) byHour[hour]++;
                    if (dow >= 0 && dow < 7) byDayOfWeek[dow]++;
                    const monthKey = `${created.getFullYear()}-${String(created.getMonth()+1).padStart(2,'0')}`;
                    byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
                }
            }
        });
        
        // Converter para array e calcular métricas derivadas
        const results = Array.from(statsMap.values()).map(stats => {
            const avgResolution = stats.resolutionTimes.length ? 
                stats.resolutionTimes.reduce((a,b)=>a+b,0) / stats.resolutionTimes.length : 0;
            const avgResponse = stats.responseTimes.length ? 
                stats.responseTimes.reduce((a,b)=>a+b,0) / stats.responseTimes.length : 0;
            const ticketsPerDay = stats.total / totalDays;
            const resolvedPerDay = stats.resolved / totalDays;
            const slaPercent = stats.slaTotal > 0 ? (stats.slaWithin / stats.slaTotal * 100) : 0;
            const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total * 100) : 0;
            
            // Índice de produtividade (0-100)
            const productivityIndex = Math.min(100, Math.round(
                (resolutionRate * 0.3) + 
                (slaPercent * 0.3) + 
                (Math.min(100, resolvedPerDay * 20) * 0.2) +
                (Math.max(0, 100 - avgResolution) * 0.2)
            ));
            
            return {
                ...stats,
                percentResolved: stats.total > 0 ? Math.round(resolutionRate) : 0,
                ticketsPerDay: ticketsPerDay.toFixed(1),
                resolvedPerDay: resolvedPerDay.toFixed(1),
                avgResolutionHours: avgResolution.toFixed(1),
                avgResponseHours: avgResponse.toFixed(1),
                slaPercent: slaPercent.toFixed(1),
                productivityIndex
            };
        });
        
        // Ordenar por total decrescente
        results.sort((a, b) => b.total - a.total);
        
        // Calcular métricas avançadas
        const totalOpen = results.reduce((sum, r) => sum + r.open, 0);
        const allResolutionTimes = results.flatMap(r => r.resolutionTimes);
        const allResponseTimes = results.flatMap(r => r.responseTimes);
        const totalSlaWithin = results.reduce((sum, r) => sum + r.slaWithin, 0);
        const totalSlaTotal = results.reduce((sum, r) => sum + r.slaTotal, 0);
        const topPerformer = results.length > 0 ? results[0] : null;
        
        // Calcular totais gerais
        const totals = {
            totalTickets: filteredTickets.length,
            ticketsComTag: ticketsComTagDoTime,
            totalResolved: ticketsResolvidosComTag,
            totalOpen: totalOpen,
            totalPeople: results.length,
            avgPercentResolved: results.length > 0 
                ? Math.round(results.reduce((sum, r) => sum + r.percentResolved, 0) / results.length)
                : 0,
            totalDays,
            avgTicketsPerDay: (ticketsComTagDoTime / totalDays).toFixed(1),
            avgTicketsPerPerson: results.length > 0 ? (ticketsComTagDoTime / results.length).toFixed(1) : 0,
            avgResolutionHours: allResolutionTimes.length > 0 
                ? (allResolutionTimes.reduce((a, b) => a + b, 0) / allResolutionTimes.length).toFixed(1) 
                : '--',
            avgResponseHours: allResponseTimes.length > 0 
                ? (allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(1) 
                : '--',
            slaPercent: totalSlaTotal > 0 ? Math.round((totalSlaWithin / totalSlaTotal) * 100) : '--',
            topPerformerName: topPerformer ? topPerformer.person.split(' ')[0] : '--',
            topPerformerCount: topPerformer ? topPerformer.total : 0
        };
        
        // Métricas globais para gráficos
        const globalMetrics = {
            statusCounts,
            priorityCounts,
            systemCounts,
            byMonth,
            byDayOfWeek,
            byHour
        };
        
        return { people: results, totals, filteredCount: filteredTickets.length, ticketsComTag: ticketsComTagDoTime, globalMetrics };
    },
    
    /**
     * Define o filtro de período
     */
    setPeriodFilter(period) {
        this.periodFilter = period;
        if (period !== 'custom') {
            this.customDateRange = { start: null, end: null };
        }
        this.renderAcompanhamentoSection();
    },
    
    /**
     * Abre o DateRangePicker visual (calendário)
     */
    openDatePicker() {
        if (!window.DateRangePicker) {
            console.error('DateRangePicker não disponível');
            return;
        }
        
        const existing = document.getElementById('acompanhamentoDatePickerPopup');
        const existingOverlay = document.getElementById('acompanhamentoDatePickerOverlay');
        if (existing) { 
            existing.remove(); 
            existingOverlay?.remove();
            return; 
        }
        
        // Criar overlay escuro
        const overlay = document.createElement('div');
        overlay.id = 'acompanhamentoDatePickerOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            cursor: pointer;
        `;
        overlay.onclick = () => {
            document.getElementById('acompanhamentoDatePickerPopup')?.remove();
            overlay.remove();
        };
        document.body.appendChild(overlay);
        
        const popup = document.createElement('div');
        popup.id = 'acompanhamentoDatePickerPopup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: #1e1e2e;
            border: 1px solid #3f3f46;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);
            min-width: 360px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
        `;
        
        // Inicializar picker temporário
        this._tempPicker = {
            startDate: this.customDateRange.start ? new Date(this.customDateRange.start) : null,
            endDate: this.customDateRange.end ? new Date(this.customDateRange.end) : null,
            currentMonth: new Date()
        };
        
        popup.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4 style="color: white; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Selecionar Período
                </h4>
                
                <!-- Atalhos rápidos -->
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <button class="drp-quick-acomp" data-preset="7" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 7 dias</button>
                    <button class="drp-quick-acomp" data-preset="30" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 30 dias</button>
                    <button class="drp-quick-acomp" data-preset="90" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 90 dias</button>
                    <button class="drp-quick-acomp" data-preset="month" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Este mês</button>
                    <button class="drp-quick-acomp" data-preset="365" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Último ano</button>
                    <button class="drp-quick-acomp" data-preset="all" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Todo período</button>
                </div>
                
                <div id="acompanhamentoCalendar" style="border-top: 1px solid #3f3f46; padding-top: 1rem;"></div>
                
                <p id="acompanhamentoHint" style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin: 0.75rem 0;">
                    Clique em um dia para iniciar
                </p>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #3f3f46; padding-top: 1rem;">
                <button id="acompClearBtn" style="padding:0.5rem 1rem;background:transparent;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;">Limpar</button>
                <button id="acompCancelBtn" style="padding:0.5rem 1rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#e4e4e7;cursor:pointer;">Cancelar</button>
                <button id="acompApplyBtn" style="padding:0.5rem 1rem;background:#8b5cf6;border:none;border-radius:6px;color:white;cursor:pointer;font-weight:600;">Aplicar</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Renderizar calendário
        const calendarContainer = document.getElementById('acompanhamentoCalendar');
        this.renderCalendar(calendarContainer, this._tempPicker);
        
        // Event listeners para atalhos rápidos
        popup.querySelectorAll('.drp-quick-acomp').forEach(btn => {
            btn.onclick = () => {
                const preset = btn.dataset.preset;
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                
                if (preset === 'month') {
                    this._tempPicker.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    this._tempPicker.endDate = today;
                } else if (preset === 'all') {
                    this.periodFilter = 'all';
                    this.customDateRange = { start: null, end: null };
                    document.removeEventListener('mousedown', closeHandler);
                    document.getElementById('acompanhamentoDatePickerOverlay')?.remove();
                    popup.remove();
                    this.renderAcompanhamentoSection();
                    return;
                } else {
                    const days = parseInt(preset);
                    this._tempPicker.startDate = new Date(today);
                    this._tempPicker.startDate.setDate(this._tempPicker.startDate.getDate() - days + 1);
                    this._tempPicker.endDate = today;
                }
                this.renderCalendar(calendarContainer, this._tempPicker);
                document.getElementById('acompanhamentoHint').textContent = 
                    `${this._tempPicker.startDate.toLocaleDateString('pt-BR')} → ${this._tempPicker.endDate.toLocaleDateString('pt-BR')}`;
            };
        });
        
        // Botões de ação
        document.getElementById('acompClearBtn').onclick = () => {
            this._tempPicker.startDate = null;
            this._tempPicker.endDate = null;
            this.renderCalendar(calendarContainer, this._tempPicker);
            document.getElementById('acompanhamentoHint').textContent = 'Clique em um dia para iniciar';
        };
        
        document.getElementById('acompCancelBtn').onclick = () => {
            document.getElementById('acompanhamentoDatePickerOverlay')?.remove();
            popup.remove();
        };
        
        document.getElementById('acompApplyBtn').onclick = () => {
            if (this._tempPicker.startDate && this._tempPicker.endDate) {
                this.customDateRange = {
                    start: this._tempPicker.startDate.toISOString().split('T')[0],
                    end: this._tempPicker.endDate.toISOString().split('T')[0]
                };
                this.periodFilter = 'custom';
                document.removeEventListener('mousedown', closeHandler);
                document.getElementById('acompanhamentoDatePickerOverlay')?.remove();
                popup.remove();
                this.renderAcompanhamentoSection();
            }
        };
        
        // Fechar ao clicar fora (mas não nos dias do calendário)
        const closeHandler = (e) => {
            // Não fechar se clicar dentro do popup
            if (popup.contains(e.target)) return;
            // Não fechar se clicar no botão que abre o popup
            if (e.target.id === 'acompanhamentoPeriodBtn' || e.target.closest('#acompanhamentoPeriodBtn')) return;
            document.getElementById('acompanhamentoDatePickerOverlay')?.remove();
            popup.remove();
            document.removeEventListener('mousedown', closeHandler);
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 100);
    },
    
    /**
     * Renderiza o calendário visual
     */
    renderCalendar(container, picker) {
        const month = picker.currentMonth || new Date();
        const year = month.getFullYear();
        const monthNum = month.getMonth();
        
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        const firstDay = new Date(year, monthNum, 1).getDay();
        const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
        
        let calendarHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <button onclick="window.BIAcompanhamentoModule.navigateMonth(-1)" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">◀◀</button>
                <button onclick="window.BIAcompanhamentoModule.navigateMonth(-1)" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">◀</button>
                <span style="color:white;font-weight:600;">${monthNames[monthNum]} ${year}</span>
                <button onclick="window.BIAcompanhamentoModule.navigateMonth(1)" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">▶</button>
                <button onclick="window.BIAcompanhamentoModule.navigateMonth(1)" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.2rem;">▶▶</button>
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
        
        // Dias vazios no início
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += `<div></div>`;
        }
        
        // Dias do mês
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
                <div onclick="window.BIAcompanhamentoModule.selectDate(${year}, ${monthNum}, ${day})" 
                     style="padding:0.5rem;cursor:pointer;border-radius:6px;background:${bgColor};color:${textColor};border:${border};transition:all 0.2s;"
                     onmouseover="this.style.background='${isStart || isEnd ? '#7c3aed' : 'rgba(139,92,246,0.2)'}'"
                     onmouseout="this.style.background='${bgColor}'">${day}</div>
            `;
        }
        
        calendarHTML += '</div>';
        container.innerHTML = calendarHTML;
    },
    
    // Picker temporário para o calendário
    _tempPicker: null,
    
    /**
     * Navega entre meses
     */
    navigateMonth(direction) {
        if (!this._tempPicker) this._tempPicker = { currentMonth: new Date() };
        this._tempPicker.currentMonth.setMonth(this._tempPicker.currentMonth.getMonth() + direction);
        const container = document.getElementById('acompanhamentoCalendar');
        if (container) this.renderCalendar(container, this._tempPicker);
    },
    
    /**
     * Seleciona uma data no calendário
     */
    selectDate(year, month, day) {
        if (!this._tempPicker) this._tempPicker = { startDate: null, endDate: null, currentMonth: new Date() };
        
        const selectedDate = new Date(year, month, day);
        
        if (!this._tempPicker.startDate || (this._tempPicker.startDate && this._tempPicker.endDate)) {
            // Primeiro clique ou reset
            this._tempPicker.startDate = selectedDate;
            this._tempPicker.endDate = null;
            document.getElementById('acompanhamentoHint').textContent = 'Clique em outro dia para finalizar';
        } else {
            // Segundo clique
            if (selectedDate < this._tempPicker.startDate) {
                this._tempPicker.endDate = this._tempPicker.startDate;
                this._tempPicker.startDate = selectedDate;
            } else {
                this._tempPicker.endDate = selectedDate;
            }
            document.getElementById('acompanhamentoHint').textContent = 
                `${this._tempPicker.startDate.toLocaleDateString('pt-BR')} → ${this._tempPicker.endDate.toLocaleDateString('pt-BR')}`;
        }
        
        const container = document.getElementById('acompanhamentoCalendar');
        if (container) this.renderCalendar(container, this._tempPicker);
    },
    
    /**
     * Retorna texto descritivo do período atual
     */
    getDateRangeText() {
        if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
            const start = new Date(this.customDateRange.start);
            const end = new Date(this.customDateRange.end);
            return `${start.toLocaleDateString('pt-BR')} → ${end.toLocaleDateString('pt-BR')}`;
        }
        const labels = { '7': '7 dias', '30': '30 dias', '90': '90 dias', '180': '180 dias', '365': '1 ano', 'all': 'Tudo' };
        return labels[this.periodFilter] || 'Personalizado';
    },
    
    /**
     * Renderiza o botão de filtro de período (abre o calendário visual)
     */
    renderPeriodFilter() {
        const isCustom = this.periodFilter === 'custom';
        
        return `
            <button id="acompanhamentoPeriodBtn" onclick="window.BIAcompanhamentoModule.openDatePicker()" style="
                padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s;
                background: ${isCustom ? '#8b5cf6' : '#252536'};
                color: ${isCustom ? 'white' : '#e4e4e7'};
                border: 1px solid ${isCustom ? '#8b5cf6' : 'rgba(63,63,90,0.5)'};
                display: flex; align-items: center; gap: 0.5rem;
                font-size: 0.85rem;
            ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>${this.getDateRangeText()}</span>
                <span style="color: ${isCustom ? 'rgba(255,255,255,0.7)' : '#6b7280'};">▼</span>
            </button>
        `;
    },
    
    /**
     * Abre ticket no Freshdesk
     */
    openTicket(ticketId) {
        window.open(`https://suportetryvia.freshdesk.com/a/tickets/${ticketId}`, '_blank');
    },
    
    // Estado de ordenação da tabela
    sortColumn: 'total',
    sortDirection: 'desc',
    
    // Último cálculo para expansão
    _lastPeople: [],
    _lastGlobalMetrics: null,
    
    // Gradientes para gráficos
    gradients: [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#a8edea', '#fed6e3'],
        ['#ff9a9e', '#fecfef'],
        ['#a18cd1', '#fbc2eb'],
        ['#ffecd2', '#fcb69f'],
        ['#667eea', '#764ba2']
    ],
    
    /**
     * Cria card de gráfico com botão de expansão - Premium SaaS
     */
    createChartCard(chartId, title, canvasHeight = 250) {
        return `
            <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="color: #e4e4e7; margin: 0; font-size: 0.9rem; font-weight: 600;">${title}</h4>
                    <button onclick="BIAcompanhamentoModule.expandChart('${chartId}', '${title}')" title="Expandir gráfico" style="
                        background: rgba(139,92,246,0.1);
                        border: 1px solid rgba(139,92,246,0.2);
                        color: #a78bfa;
                        width: 28px;
                        height: 28px;
                        border-radius: 6px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        font-size: 0.9rem;
                    " onmouseover="this.style.background='rgba(139,92,246,0.25)'; this.style.borderColor='rgba(139,92,246,0.4)'" onmouseout="this.style.background='rgba(139,92,246,0.1)'; this.style.borderColor='rgba(139,92,246,0.2)'">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                </div>
                <div style="position: relative;">
                    <canvas id="${chartId}" height="${canvasHeight}"></canvas>
                    <div id="${chartId}Tooltip" style="
                        position: absolute;
                        display: none;
                        background: #1a1a2e;
                        color: #e4e4e7;
                        padding: 8px 12px;
                        border-radius: 8px;
                        font-size: 0.8rem;
                        pointer-events: none;
                        z-index: 100;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                        border: 1px solid rgba(255,255,255,0.1);
                    "></div>
                </div>
            </div>
        `;
    },
    
    /**
     * Expande gráfico em modal
     */
    expandChart(chartId, title) {
        // Remover modal existente
        const existing = document.getElementById('acompExpandedChartModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'acompExpandedChartModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            padding: 2rem; animation: fadeIn 0.2s ease-out;
        `;
        
        modal.innerHTML = `
            <div style="background: #1e293b; border-radius: 16px; width: 90vw; max-width: 1200px; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #334155;">
                    <h2 style="margin: 0; color: white; font-size: 1.5rem;">${title}</h2>
                    <button onclick="document.getElementById('acompExpandedChartModal').remove()" style="
                        background: #ef4444; border: none; color: white; width: 36px; height: 36px;
                        border-radius: 8px; cursor: pointer; font-size: 1.2rem; display: flex;
                        align-items: center; justify-content: center;
                    ">✕</button>
                </div>
                <div style="padding: 2rem; overflow-y: auto; max-height: calc(90vh - 80px); position: relative;">
                    <canvas id="acompExpandedChart" height="500"></canvas>
                    <div id="acompExpandedTooltip" style="
                        position: absolute;
                        display: none;
                        background: rgba(15, 23, 42, 0.95);
                        color: white;
                        padding: 10px 14px;
                        border-radius: 8px;
                        font-size: 0.9rem;
                        pointer-events: none;
                        z-index: 1000;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                        border: 1px solid rgba(139,92,246,0.4);
                        max-width: 250px;
                    "></div>
                </div>
            </div>
        `;
        
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escHandler); }
        });
        
        document.body.appendChild(modal);
        
        // Renderizar gráfico expandido
        setTimeout(() => this.renderExpandedChart(chartId), 50);
    },
    
    /**
     * Expande gráfico de Taxa de Resolução em modal fullscreen
     */
    expandResolutionChart() {
        const people = this._lastPeople;
        if (!people || people.length === 0) return;
        
        // Remover modal existente
        const existing = document.getElementById('resolutionExpandModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'resolutionExpandModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.92); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
            padding: 2rem; animation: fadeIn 0.2s ease;
        `;
        
        // Ordenar por taxa de resolução
        const sortedPeople = [...people].sort((a, b) => b.percentResolved - a.percentResolved);
        
        const barsHTML = sortedPeople.map(p => {
            const barColor = p.percentResolved >= 80 ? '#10b981' :
                           p.percentResolved >= 50 ? '#f59e0b' : '#ef4444';
            return `
                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0;">
                    <div style="min-width: 180px; font-size: 0.95rem; color: #e2e8f0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${p.person}">
                        ${p.person}
                    </div>
                    <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 6px; height: 32px; position: relative; overflow: hidden;">
                        <div style="
                            position: absolute; left: 0; top: 0; height: 100%;
                            width: ${p.percentResolved}%;
                            background: linear-gradient(90deg, ${barColor}, ${barColor}cc);
                            border-radius: 6px;
                            transition: width 0.5s ease;
                        "></div>
                        <div style="
                            position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
                            font-size: 0.9rem; font-weight: 600; color: white;
                        ">${p.percentResolved}%</div>
                    </div>
                    <div style="min-width: 100px; text-align: right; font-size: 0.9rem; color: #94a3b8;">
                        ${p.resolved}/${p.total}
                    </div>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border-radius: 20px;
                max-width: 95vw;
                max-height: 92vh;
                width: 1000px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 80px rgba(0,0,0,0.6);
                border: 1px solid rgba(255,255,255,0.1);
                animation: scaleIn 0.25s ease;
            ">
                <div style="
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="margin: 0; color: white; font-size: 1.4rem; display: flex; align-items: center; gap: 0.75rem;">
                        📊 Taxa de Resolução por Pessoa
                        <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 400;">(${people.length} pessoas)</span>
                    </h2>
                    <button onclick="document.getElementById('resolutionExpandModal').remove()" style="
                        background: rgba(255,255,255,0.1);
                        border: none;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        font-size: 1.5rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(239,68,68,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        ✕
                    </button>
                </div>
                <div style="
                    padding: 1.5rem 2rem 2rem 2rem;
                    flex: 1;
                    overflow-y: auto;
                ">
                    ${barsHTML}
                </div>
            </div>
        `;
        
        // Fechar ao clicar fora
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        // Fechar com ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escHandler); }
        });
        
        document.body.appendChild(modal);
    },
    
    /**
     * Expande tabela de Detalhamento em modal fullscreen
     */
    expandDetailTable() {
        const people = this._lastPeople;
        if (!people || people.length === 0) return;
        
        // Remover modal existente
        const existing = document.getElementById('detailTableExpandModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'detailTableExpandModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.92); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
            padding: 2rem; animation: fadeIn 0.2s ease;
        `;
        
        // Ordenar por produtividade
        const sortedPeople = this.sortPeople(people);
        
        const tableHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: rgba(99,102,241,0.2); border-bottom: 2px solid rgba(99,102,241,0.4);">
                        <th style="padding: 12px 16px; text-align: left; color: #a5b4fc; font-weight: 600;">PESSOA</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">TOTAL</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">RESOLVIDOS</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">ABERTOS</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">% RESOLUÇÃO</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">TICKETS/DIA</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">RESOL./DIA</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">TEMPO RESOL.</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">SLA 1ª RESP.</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">PRODUTIVIDADE</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedPeople.map((p, i) => {
                        const rateColor = p.percentResolved >= 80 ? '#10b981' : p.percentResolved >= 50 ? '#f59e0b' : '#ef4444';
                        const slaColor = parseFloat(p.slaPercent) >= 90 ? '#10b981' : parseFloat(p.slaPercent) >= 70 ? '#f59e0b' : '#ef4444';
                        const prodColor = p.productivityIndex >= 80 ? '#10b981' : p.productivityIndex >= 50 ? '#f59e0b' : '#ef4444';
                        return `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); ${i % 2 === 0 ? 'background: rgba(255,255,255,0.02);' : ''}">
                                <td style="padding: 12px 16px; color: white; font-weight: 500;">${p.person}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #e2e8f0; font-weight: 600;">${p.total}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #10b981;">${p.resolved}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #f59e0b;">${p.open}</td>
                                <td style="padding: 12px 16px; text-align: center;">
                                    <span style="background: ${rateColor}22; color: ${rateColor}; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${p.percentResolved}%</span>
                                </td>
                                <td style="padding: 12px 16px; text-align: center; color: #e2e8f0;">${p.ticketsPerDay}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #e2e8f0;">${p.resolvedPerDay}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #e2e8f0;">${p.avgResolutionHours}h</td>
                                <td style="padding: 12px 16px; text-align: center;">
                                    <span style="background: ${slaColor}22; color: ${slaColor}; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${p.slaPercent}%</span>
                                </td>
                                <td style="padding: 12px 16px; text-align: center;">
                                    <span style="background: ${prodColor}22; color: ${prodColor}; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${p.productivityIndex}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border-radius: 20px;
                max-width: 95vw;
                max-height: 92vh;
                width: 1400px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 80px rgba(0,0,0,0.6);
                border: 1px solid rgba(255,255,255,0.1);
                animation: scaleIn 0.25s ease;
            ">
                <div style="
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="margin: 0; color: white; font-size: 1.4rem; display: flex; align-items: center; gap: 0.75rem;">
                        📋 Detalhamento por Pessoa
                        <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 400;">(${people.length} pessoas)</span>
                    </h2>
                    <button onclick="document.getElementById('detailTableExpandModal').remove()" style="
                        background: rgba(255,255,255,0.1);
                        border: none;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        font-size: 1.5rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(239,68,68,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        ✕
                    </button>
                </div>
                <div style="
                    padding: 1.5rem 2rem 2rem 2rem;
                    flex: 1;
                    overflow: auto;
                ">
                    ${tableHTML}
                </div>
            </div>
        `;
        
        // Fechar ao clicar fora
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        // Fechar com ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escHandler); }
        });
        
        document.body.appendChild(modal);
    },
    
    /**
     * Renderiza gráfico expandido no modal
     */
    renderExpandedChart(chartId) {
        const canvas = document.getElementById('acompExpandedChart');
        if (!canvas) return;
        
        const people = this._lastPeople;
        const globalMetrics = this._lastGlobalMetrics;
        
        // Usar tamanho do container para gráfico expandido
        const container = canvas.parentElement;
        const containerWidth = container ? container.offsetWidth - 40 : 1000;
        const { ctx, width, height } = this.setupExpandedCanvas(canvas, containerWidth, 450);
        
        // Renderizar baseado no chartId
        switch(chartId) {
            case 'acompChartRanking':
                this.renderExpandedRanking(ctx, width, height, people);
                this.setupExpandedBarTooltip(canvas, people.slice(0, 20), width, height, (m) => `
                    <strong>${m.person}</strong><br>
                    Total: ${m.total} tickets<br>
                    Resolvidos: ${m.resolved} (${m.percentResolved}%)<br>
                    Abertos: ${m.open}
                `);
                break;
            case 'acompChartResolution':
                this.renderExpandedResolution(ctx, width, height, people);
                this.setupExpandedBarTooltip(canvas, people.slice(0, 20), width, height, (m) => `
                    <strong>${m.person}</strong><br>
                    Taxa: ${m.percentResolved}%<br>
                    ${m.resolved} de ${m.total} tickets
                `);
                break;
            case 'acompChartStatus':
                this.renderExpandedStatus(ctx, width, height, globalMetrics);
                this.setupExpandedPieTooltip(canvas, globalMetrics, width, height);
                break;
            case 'acompChartDayOfWeek':
                this.renderExpandedDayOfWeek(ctx, width, height, globalMetrics);
                const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                const dowData = (globalMetrics?.byDayOfWeek || []).map((val, i) => ({ label: days[i], value: val }));
                this.setupExpandedBarTooltip(canvas, dowData, width, height, (d) => `
                    <strong>${d.label}</strong><br>
                    ${d.value} tickets
                `, 7);
                break;
            case 'acompChartHour':
                this.renderExpandedHour(ctx, width, height, globalMetrics);
                this.setupExpandedLineTooltip(canvas, globalMetrics?.byHour || [], width, height, (val, i) => `
                    <strong>${i}:00h</strong><br>
                    ${val} tickets
                `, 24);
                break;
            case 'acompChartTimeline':
                this.renderExpandedTimeline(ctx, width, height, globalMetrics);
                const months = Object.entries(globalMetrics?.byMonth || {}).sort((a, b) => a[0].localeCompare(b[0]));
                this.setupExpandedLineTooltip(canvas, months, width, height, (item) => `
                    <strong>${item[0]}</strong><br>
                    ${item[1]} tickets
                `, months.length);
                break;
            case 'acompChartSLA':
                this.renderExpandedSLA(ctx, width, height, people);
                const slaFiltered = people.filter(p => p.slaTotal > 0).slice(0, 20);
                this.setupExpandedBarTooltip(canvas, slaFiltered, width, height, (m) => `
                    <strong>${m.person}</strong><br>
                    SLA: ${m.slaPercent}%<br>
                    Dentro: ${m.slaWithin} de ${m.slaTotal}
                `);
                break;
            case 'acompChartProductivity':
                this.renderExpandedProductivity(ctx, width, height, people);
                const sorted = [...people].sort((a, b) => b.productivityIndex - a.productivityIndex).slice(0, 20);
                this.setupExpandedBarTooltip(canvas, sorted, width, height, (m) => `
                    <strong>${m.person}</strong><br>
                    Índice: ${m.productivityIndex}<br>
                    Resolução: ${m.percentResolved}%<br>
                    SLA: ${m.slaPercent}%
                `);
                break;
        }
    },
    
    /**
     * Tooltip para gráfico de barras expandido
     */
    setupExpandedBarTooltip(canvas, data, width, height, formatFn, barCount = null) {
        const tooltip = document.getElementById('acompExpandedTooltip');
        if (!tooltip || !data.length) return;
        
        const count = barCount || data.length;
        const padding = { left: 60, right: 40 };
        const chartWidth = width - padding.left - padding.right;
        const barWidth = chartWidth / count;
        
        canvas.onmousemove = (e) => {
            const x = e.offsetX - padding.left;
            const idx = Math.floor(x / barWidth);
            
            if (idx >= 0 && idx < data.length && x >= 0) {
                tooltip.innerHTML = formatFn(data[idx]);
                tooltip.style.display = 'block';
                tooltip.style.left = Math.min(e.offsetX + 15, width - 200) + 'px';
                tooltip.style.top = Math.max(e.offsetY - 80, 10) + 'px';
            } else {
                tooltip.style.display = 'none';
            }
        };
        
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
    },
    
    /**
     * Tooltip para gráfico de linha expandido
     */
    setupExpandedLineTooltip(canvas, data, width, height, formatFn, dataLength) {
        const tooltip = document.getElementById('acompExpandedTooltip');
        if (!tooltip || !data.length) return;
        
        const padding = { left: 80, right: 60 };
        const chartWidth = width - padding.left - padding.right;
        
        canvas.onmousemove = (e) => {
            const x = e.offsetX - padding.left;
            const idx = Math.round((x / chartWidth) * Math.max(dataLength - 1, 1));
            
            if (idx >= 0 && idx < data.length && x >= 0) {
                tooltip.innerHTML = formatFn(data[idx], idx);
                tooltip.style.display = 'block';
                tooltip.style.left = Math.min(e.offsetX + 15, width - 180) + 'px';
                tooltip.style.top = Math.max(e.offsetY - 60, 10) + 'px';
            } else {
                tooltip.style.display = 'none';
            }
        };
        
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
    },
    
    /**
     * Tooltip para gráfico de pizza expandido
     */
    setupExpandedPieTooltip(canvas, globalMetrics, width, height) {
        const tooltip = document.getElementById('acompExpandedTooltip');
        if (!tooltip) return;
        
        const statusLabels = {
            2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado',
            6: 'Aguardando Cliente', 7: 'Em análise', 8: 'Aguardando Parceiros',
            9: 'Aguardando Publicação', 10: 'Em Homologação', 11: 'Validação',
            12: 'Levantamento', 13: 'Em Fila Dev', 14: 'Interno',
            15: 'Pausado', 16: 'On Hold', 17: 'Em Progresso',
            18: 'Escalado', 19: 'Reaberto', 20: 'Novo'
        };
        
        const data = Object.entries(globalMetrics?.statusCounts || {})
            .map(([status, count]) => ({ label: statusLabels[status] || `Status ${status}`, value: count }))
            .sort((a, b) => b.value - a.value);
        
        const total = data.reduce((a, b) => a + b.value, 0);
        const cx = width / 3;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 60;
        
        canvas.onmousemove = (e) => {
            const x = e.offsetX - cx;
            const y = e.offsetY - cy;
            const dist = Math.sqrt(x*x + y*y);
            
            if (dist <= radius && dist > 0) {
                let angle = Math.atan2(y, x) + Math.PI / 2;
                if (angle < 0) angle += Math.PI * 2;
                
                let cumulative = 0;
                for (const d of data) {
                    const sliceAngle = (d.value / total) * Math.PI * 2;
                    if (angle >= cumulative && angle < cumulative + sliceAngle) {
                        const pct = ((d.value / total) * 100).toFixed(1);
                        tooltip.innerHTML = `<strong>${d.label}</strong><br>${d.value} tickets (${pct}%)`;
                        tooltip.style.display = 'block';
                        tooltip.style.left = Math.min(e.offsetX + 15, width - 200) + 'px';
                        tooltip.style.top = Math.max(e.offsetY - 60, 10) + 'px';
                        return;
                    }
                    cumulative += sliceAngle;
                }
            }
            tooltip.style.display = 'none';
        };
        
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
    },
    
    // Funções de renderização expandida
    renderExpandedRanking(ctx, width, height, people) {
        const all = people.slice(0, 20);
        const padding = { top: 40, bottom: 100, left: 60, right: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const barW = chartW / all.length - 10;
        const maxVal = Math.max(...all.map(m => m.total), 1);
        
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Ranking por Volume de Tickets', width/2, 25);
        
        all.forEach((m, i) => {
            const x = padding.left + i * (barW + 10) + 5;
            const barH = (m.total / maxVal) * chartH;
            const y = padding.top + chartH - barH;
            
            const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
            gradient.addColorStop(0, this.gradients[i % 10][0]);
            gradient.addColorStop(1, this.gradients[i % 10][1]);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barW, barH);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(m.total.toString(), x + barW/2, y - 8);
            
            ctx.save();
            ctx.translate(x + barW/2, height - padding.bottom + 15);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(m.person.substring(0, 15), 0, 0);
            ctx.restore();
        });
    },
    
    renderExpandedResolution(ctx, width, height, people) {
        const all = people.slice(0, 20);
        const padding = { top: 40, bottom: 100, left: 60, right: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const barW = chartW / all.length - 10;
        
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Taxa de Resolução por Pessoa', width/2, 25);
        
        all.forEach((m, i) => {
            const x = padding.left + i * (barW + 10) + 5;
            const barH = (m.percentResolved / 100) * chartH;
            const y = padding.top + chartH - barH;
            const color = m.percentResolved >= 80 ? '#10b981' : m.percentResolved >= 50 ? '#f59e0b' : '#ef4444';
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barW, barH);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${m.percentResolved}%`, x + barW/2, y - 8);
            
            ctx.save();
            ctx.translate(x + barW/2, height - padding.bottom + 15);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(m.person.substring(0, 15), 0, 0);
            ctx.restore();
        });
    },
    
    renderExpandedStatus(ctx, width, height, globalMetrics) {
        // Mapeamento completo de status do Freshdesk
        const statusLabels = {
            2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado',
            6: 'Aguardando Cliente', 7: 'Em análise', 8: 'Aguardando Parceiros',
            9: 'Aguardando Publicação', 10: 'Em Homologação', 11: 'Validação',
            12: 'Levantamento', 13: 'Em Fila Dev', 14: 'Interno',
            15: 'Pausado', 16: 'On Hold', 17: 'Em Progresso',
            18: 'Escalado', 19: 'Reaberto', 20: 'Novo'
        };
        const statusColors = {
            2: '#ef4444', 3: '#f59e0b', 4: '#10b981', 5: '#10b981',
            6: '#3b82f6', 7: '#8b5cf6', 8: '#a855f7', 9: '#06b6d4',
            10: '#ec4899', 11: '#f472b6', 12: '#6366f1', 13: '#14b8a6',
            14: '#64748b', 15: '#64748b', 16: '#64748b', 17: '#f59e0b',
            18: '#ef4444', 19: '#ef4444', 20: '#3b82f6'
        };
        
        const data = Object.entries(globalMetrics?.statusCounts || {})
            .map(([status, count]) => ({ label: statusLabels[status] || `Status ${status}`, value: count, color: statusColors[status] || '#64748b' }))
            .sort((a, b) => b.value - a.value);
        
        const total = data.reduce((a, b) => a + b.value, 0);
        const cx = width / 3;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 60;
        
        let startAngle = -Math.PI / 2;
        data.forEach(d => {
            const sliceAngle = (d.value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = d.color;
            ctx.fill();
            startAngle += sliceAngle;
        });
        
        const legendX = width * 0.55;
        let legendY = 80;
        data.forEach(d => {
            ctx.fillStyle = d.color;
            ctx.fillRect(legendX, legendY, 20, 20);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '14px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(`${d.label}: ${d.value} (${(d.value/total*100).toFixed(1)}%)`, legendX + 30, legendY + 15);
            legendY += 35;
        });
    },
    
    renderExpandedDayOfWeek(ctx, width, height, globalMetrics) {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const totals = globalMetrics?.byDayOfWeek || Array(7).fill(0);
        const padding = { top: 50, bottom: 60, left: 80, right: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const barW = chartW / 7 - 20;
        const maxVal = Math.max(...totals, 1);
        
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Distribuição por Dia da Semana', width/2, 30);
        
        totals.forEach((val, i) => {
            const x = padding.left + i * (barW + 20) + 10;
            const barH = (val / maxVal) * chartH;
            const y = padding.top + chartH - barH;
            const color = i === 0 || i === 6 ? '#8b5cf6' : '#3b82f6';
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barW, barH);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(val.toString(), x + barW/2, y - 10);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px system-ui';
            ctx.fillText(days[i], x + barW/2, height - 25);
        });
    },
    
    renderExpandedHour(ctx, width, height, globalMetrics) {
        const totals = globalMetrics?.byHour || Array(24).fill(0);
        const padding = { top: 50, bottom: 60, left: 60, right: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const maxVal = Math.max(...totals, 1);
        
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Distribuição por Hora do Dia', width/2, 30);
        
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        totals.forEach((val, i) => {
            const x = padding.left + (i / 23) * chartW;
            const y = padding.top + chartH - (val / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        totals.forEach((val, i) => {
            const x = padding.left + (i / 23) * chartW;
            const y = padding.top + chartH - (val / maxVal) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.fill();
            
            if (val > 0) {
                ctx.fillStyle = '#e2e8f0';
                ctx.font = '10px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(val.toString(), x, y - 12);
            }
        });
        
        for (let h = 0; h <= 23; h += 3) {
            const x = padding.left + (h / 23) * chartW;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${h}h`, x, height - 25);
        }
    },
    
    renderExpandedTimeline(ctx, width, height, globalMetrics) {
        const months = Object.entries(globalMetrics?.byMonth || {}).sort((a, b) => a[0].localeCompare(b[0]));
        if (!months.length) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados temporais', width/2, height/2);
            return;
        }
        
        const padding = { top: 60, bottom: 100, left: 80, right: 60 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const maxVal = Math.max(...months.map(m => m[1]), 1);
        
        ctx.font = 'bold 18px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Evolução Temporal', width/2, 35);
        
        // Desenhar linha primeiro (path completo)
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        months.forEach(([month, val], i) => {
            const x = padding.left + (i / Math.max(months.length - 1, 1)) * chartW;
            const y = padding.top + chartH - (val / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Área preenchida
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.fill();
        
        // Depois desenhar pontos e labels
        months.forEach(([month, val], i) => {
            const x = padding.left + (i / Math.max(months.length - 1, 1)) * chartW;
            const y = padding.top + chartH - (val / maxVal) * chartH;
            
            // Ponto
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Valor
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(val.toString(), x, y - 18);
            
            // Label do mês
            ctx.save();
            ctx.translate(x, height - padding.bottom + 25);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(month, 0, 0);
            ctx.restore();
        });
    },
    
    renderExpandedSLA(ctx, width, height, people) {
        const filtered = people.filter(p => p.slaTotal > 0).slice(0, 20);
        if (!filtered.length) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados de SLA disponíveis', width/2, height/2);
            return;
        }
        
        const padding = { top: 50, bottom: 100, left: 60, right: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const barW = chartW / filtered.length - 10;
        
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Conformidade SLA 1ª Resposta', width/2, 30);
        
        filtered.forEach((m, i) => {
            const x = padding.left + i * (barW + 10) + 5;
            const sla = parseFloat(m.slaPercent);
            const barH = (sla / 100) * chartH;
            const y = padding.top + chartH - barH;
            const color = sla >= 90 ? '#10b981' : sla >= 70 ? '#f59e0b' : '#ef4444';
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barW, barH);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${m.slaPercent}%`, x + barW/2, y - 8);
            
            ctx.save();
            ctx.translate(x + barW/2, height - padding.bottom + 15);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(m.person.substring(0, 15), 0, 0);
            ctx.restore();
        });
    },
    
    renderExpandedProductivity(ctx, width, height, people) {
        const sorted = [...people].sort((a, b) => b.productivityIndex - a.productivityIndex).slice(0, 20);
        const padding = { top: 50, bottom: 100, left: 60, right: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const barW = chartW / sorted.length - 10;
        
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Índice de Produtividade', width/2, 30);
        
        sorted.forEach((m, i) => {
            const x = padding.left + i * (barW + 10) + 5;
            const barH = (m.productivityIndex / 100) * chartH;
            const y = padding.top + chartH - barH;
            
            const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
            gradient.addColorStop(0, this.gradients[i % 10][0]);
            gradient.addColorStop(1, this.gradients[i % 10][1]);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barW, barH);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(m.productivityIndex.toString(), x + barW/2, y - 8);
            
            ctx.save();
            ctx.translate(x + barW/2, height - padding.bottom + 15);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(m.person.substring(0, 15), 0, 0);
            ctx.restore();
        });
    },
    
    /**
     * Altera ordenação da tabela
     */
    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc';
        }
        this.renderAcompanhamentoSection();
    },
    
    /**
     * Ordena os dados
     */
    sortPeople(people) {
        const col = this.sortColumn;
        const dir = this.sortDirection === 'desc' ? -1 : 1;
        
        return [...people].sort((a, b) => {
            let valA, valB;
            switch(col) {
                case 'person': valA = a.person.toLowerCase(); valB = b.person.toLowerCase(); break;
                case 'total': valA = a.total; valB = b.total; break;
                case 'resolved': valA = a.resolved; valB = b.resolved; break;
                case 'open': valA = a.open; valB = b.open; break;
                case 'percentResolved': valA = a.percentResolved; valB = b.percentResolved; break;
                case 'ticketsPerDay': valA = parseFloat(a.ticketsPerDay); valB = parseFloat(b.ticketsPerDay); break;
                case 'resolvedPerDay': valA = parseFloat(a.resolvedPerDay); valB = parseFloat(b.resolvedPerDay); break;
                case 'avgResolutionHours': valA = parseFloat(a.avgResolutionHours); valB = parseFloat(b.avgResolutionHours); break;
                case 'slaPercent': valA = parseFloat(a.slaPercent); valB = parseFloat(b.slaPercent); break;
                case 'productivityIndex': valA = a.productivityIndex; valB = b.productivityIndex; break;
                default: valA = a.total; valB = b.total;
            }
            if (typeof valA === 'string') return dir * valA.localeCompare(valB);
            return dir * (valA - valB);
        });
    },
    
    /**
     * Gera cabeçalho de coluna ordenável
     */
    sortableHeader(label, column) {
        const isActive = this.sortColumn === column;
        const arrow = isActive ? (this.sortDirection === 'desc' ? ' ▼' : ' ▲') : '';
        return `
            <th onclick="BIAcompanhamentoModule.sortTable('${column}')" style="
                padding: 0.6rem; 
                text-align: ${column === 'person' ? 'left' : 'center'}; 
                color: ${isActive ? '#8b5cf6' : this.colors.textMuted}; 
                border-bottom: 1px solid ${this.colors.border};
                cursor: pointer;
                user-select: none;
                transition: color 0.2s;
            " onmouseover="this.style.color='#a78bfa'" onmouseout="this.style.color='${isActive ? '#8b5cf6' : this.colors.textMuted}'">
                ${label}${arrow}
            </th>
        `;
    },
    
    /**
     * Setup de canvas expandido com tamanho fixo
     */
    setupExpandedCanvas(canvas, width, height) {
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        
        return { ctx, width, height, dpr };
    },
    
    /**
     * Setup de canvas com DPR correto
     */
    setupCanvas(canvas, height = 250) {
        const dpr = window.devicePixelRatio || 1;
        let width = canvas.offsetWidth || canvas.parentElement?.offsetWidth - 32 || 400;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        
        return { ctx, width, height, dpr };
    },
    
    /**
     * Renderiza gráfico de ranking por volume - VISUAL PREMIUM
     */
    renderRankingChart(people) {
        const canvas = document.getElementById('acompChartRanking');
        if (!canvas || !people.length) return;
        
        const top10 = people.slice(0, 10);
        const { ctx, width, height } = this.setupCanvas(canvas, 280);
        
        const padding = { top: 20, bottom: 60, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = chartWidth / top10.length - 10;
        const maxVal = Math.max(...top10.map(m => m.total), 1);
        const borderRadius = 6;
        
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
        
        top10.forEach((m, i) => {
            const x = padding.left + i * (barWidth + 10) + 5;
            const barH = Math.max(4, (m.total / maxVal) * chartHeight);
            const y = padding.top + chartHeight - barH;
            const colorSet = premiumColors[i % premiumColors.length];
            
            ctx.save();
            
            // Fundo (track)
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.roundRect(x, padding.top, barWidth, chartHeight, borderRadius);
            ctx.fill();
            
            // Sombra premium
            ctx.shadowColor = colorSet.glow;
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = -2;
            
            // Gradiente premium
            const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
            gradient.addColorStop(0, colorSet.glow);
            gradient.addColorStop(0.3, colorSet.main);
            gradient.addColorStop(0.7, colorSet.main);
            gradient.addColorStop(1, colorSet.dark);
            
            // Barra com bordas arredondadas
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [borderRadius, borderRadius, 3, 3]);
            ctx.fill();
            
            // Glass effect
            const glassGradient = ctx.createLinearGradient(x, y, x + barWidth, y);
            glassGradient.addColorStop(0, 'rgba(255,255,255,0.2)');
            glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            glassGradient.addColorStop(1, 'rgba(255,255,255,0.15)');
            ctx.fillStyle = glassGradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [borderRadius, borderRadius, 3, 3]);
            ctx.fill();
            
            ctx.restore();
            
            // Valor
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(m.total.toString(), x + barWidth / 2, y - 6);
            
            // Nome
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '500 9px system-ui';
            ctx.textAlign = 'right';
            const name = m.person.length > 10 ? m.person.substring(0, 10) + '..' : m.person;
            ctx.fillText(name, 0, 0);
            ctx.restore();
        });
    },
    
    /**
     * Renderiza gráfico de taxa de resolução - VISUAL PREMIUM
     */
    renderResolutionChart(people) {
        const canvas = document.getElementById('acompChartResolution');
        if (!canvas || !people.length) return;
        
        const top10 = people.slice(0, 10);
        const { ctx, width, height } = this.setupCanvas(canvas, 250);
        
        const padding = { top: 20, bottom: 60, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = chartWidth / top10.length - 10;
        const borderRadius = 6;
        
        // Cores semânticas premium
        const rateColors = {
            excellent: { main: '#10b981', glow: '#34d399', dark: '#059669' },
            good: { main: '#f59e0b', glow: '#fbbf24', dark: '#d97706' },
            low: { main: '#ef4444', glow: '#f87171', dark: '#dc2626' }
        };
        
        top10.forEach((m, i) => {
            const x = padding.left + i * (barWidth + 10) + 5;
            const barH = Math.max(4, (m.percentResolved / 100) * chartHeight);
            const y = padding.top + chartHeight - barH;
            
            const colorSet = m.percentResolved >= 80 ? rateColors.excellent : 
                            m.percentResolved >= 50 ? rateColors.good : rateColors.low;
            
            ctx.save();
            
            // Fundo (track)
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.roundRect(x, padding.top, barWidth, chartHeight, borderRadius);
            ctx.fill();
            
            // Sombra premium
            ctx.shadowColor = colorSet.glow;
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = -2;
            
            // Gradiente premium
            const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
            gradient.addColorStop(0, colorSet.glow);
            gradient.addColorStop(0.3, colorSet.main);
            gradient.addColorStop(0.7, colorSet.main);
            gradient.addColorStop(1, colorSet.dark);
            
            // Barra com bordas arredondadas
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [borderRadius, borderRadius, 3, 3]);
            ctx.fill();
            
            // Glass effect
            const glassGradient = ctx.createLinearGradient(x, y, x + barWidth, y);
            glassGradient.addColorStop(0, 'rgba(255,255,255,0.2)');
            glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            glassGradient.addColorStop(1, 'rgba(255,255,255,0.15)');
            ctx.fillStyle = glassGradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [borderRadius, borderRadius, 3, 3]);
            ctx.fill();
            
            ctx.restore();
            
            // Valor
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${m.percentResolved}%`, x + barWidth / 2, y - 6);
            
            // Nome
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '500 9px system-ui';
            ctx.textAlign = 'right';
            const name = m.person.length > 10 ? m.person.substring(0, 10) + '..' : m.person;
            ctx.fillText(name, 0, 0);
            ctx.restore();
        });
    },
    
    /**
     * Renderiza gráfico de status com interatividade
     */
    renderStatusChart(globalMetrics) {
        const canvas = document.getElementById('acompChartStatus');
        if (!canvas) return;
        
        const { ctx, width, height } = this.setupCanvas(canvas, 250);
        
        // Mapeamento completo de status do Freshdesk
        const statusLabels = {
            2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado',
            6: 'Aguardando Cliente', 7: 'Em análise', 8: 'Aguardando Parceiros',
            9: 'Aguardando Publicação', 10: 'Em Homologação', 11: 'Validação',
            12: 'Levantamento', 13: 'Em Fila Dev', 14: 'Interno',
            15: 'Pausado', 16: 'On Hold', 17: 'Em Progresso',
            18: 'Escalado', 19: 'Reaberto', 20: 'Novo'
        };
        const statusColors = {
            2: '#ef4444', 3: '#f59e0b', 4: '#10b981', 5: '#10b981',
            6: '#3b82f6', 7: '#8b5cf6', 8: '#a855f7', 9: '#06b6d4',
            10: '#ec4899', 11: '#f472b6', 12: '#6366f1', 13: '#14b8a6',
            14: '#64748b', 15: '#64748b', 16: '#64748b', 17: '#f59e0b',
            18: '#ef4444', 19: '#ef4444', 20: '#3b82f6'
        };
        
        // Estado para itens ocultos (toggle)
        if (!this.hiddenStatusItems) this.hiddenStatusItems = new Set();
        
        const allData = Object.entries(globalMetrics.statusCounts)
            .map(([status, count]) => ({
                label: statusLabels[status] || `Status ${status}`,
                value: count,
                color: statusColors[status] || '#64748b',
                status: status
            }))
            .sort((a, b) => b.value - a.value);
        
        // Dados visíveis (não ocultos)
        const data = allData.filter(d => !this.hiddenStatusItems.has(d.label));
        
        if (!allData.length) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados', width/2, height/2);
            return;
        }
        
        const total = data.reduce((a, b) => a + b.value, 0);
        const cx = width / 3;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 20;
        
        // Armazenar slices para detecção de hover
        const slices = [];
        let startAngle = -Math.PI / 2;
        
        data.forEach((d, i) => {
            const sliceAngle = (d.value / total) * Math.PI * 2;
            slices.push({
                ...d,
                startAngle,
                endAngle: startAngle + sliceAngle,
                midAngle: startAngle + sliceAngle / 2
            });
            startAngle += sliceAngle;
        });
        
        // Armazenar legendas para detecção de clique
        const legends = [];
        const legendX = width * 0.6;
        let legendY = 20;
        const legendHeight = 18;
        const legendSpacing = 20;
        
        // Função de renderização
        const render = (hoveredIndex = -1, hoveredLegendIndex = -1) => {
            ctx.clearRect(0, 0, width, height);
            
            // Desenhar fatias
            slices.forEach((slice, i) => {
                const isHovered = i === hoveredIndex;
                const offset = isHovered ? 12 : 0;
                const offsetX = Math.cos(slice.midAngle) * offset;
                const offsetY = Math.sin(slice.midAngle) * offset;
                
                ctx.beginPath();
                ctx.moveTo(cx + offsetX, cy + offsetY);
                ctx.arc(cx + offsetX, cy + offsetY, isHovered ? radius + 5 : radius, slice.startAngle, slice.endAngle);
                ctx.closePath();
                
                // Cor mais brilhante no hover
                if (isHovered) {
                    ctx.fillStyle = slice.color;
                    ctx.shadowColor = slice.color;
                    ctx.shadowBlur = 20;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // Borda branca
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = slice.color;
                    ctx.fill();
                }
            });
            
            // Desenhar legendas
            legends.length = 0;
            let ly = legendY;
            allData.forEach((d, i) => {
                const isHidden = this.hiddenStatusItems.has(d.label);
                const isHoveredLegend = i === hoveredLegendIndex;
                
                // Área clicável
                legends.push({
                    x: legendX - 5,
                    y: ly - 2,
                    width: width - legendX + 5,
                    height: legendHeight,
                    label: d.label
                });
                
                // Background de hover
                if (isHoveredLegend) {
                    ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
                    ctx.fillRect(legendX - 5, ly - 2, width - legendX + 5, legendHeight);
                }
                
                // Quadrado de cor
                ctx.fillStyle = isHidden ? '#4a5568' : d.color;
                ctx.fillRect(legendX, ly, 10, 10);
                
                // Risco se oculto
                if (isHidden) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(legendX - 2, ly + 5);
                    ctx.lineTo(legendX + 12, ly + 5);
                    ctx.stroke();
                }
                
                // Texto
                ctx.fillStyle = isHidden ? this.colors.textMuted : this.colors.text;
                ctx.font = isHidden ? 'italic 10px system-ui' : '10px system-ui';
                ctx.textAlign = 'left';
                const pct = ((d.value / allData.reduce((a,b) => a + b.value, 0)) * 100).toFixed(1);
                ctx.fillText(`${d.label}: ${d.value} (${pct}%)`, legendX + 15, ly + 9);
                
                ly += legendSpacing;
            });
            
            // Tooltip no hover de fatia
            if (hoveredIndex >= 0 && slices[hoveredIndex]) {
                const slice = slices[hoveredIndex];
                const pct = ((slice.value / total) * 100).toFixed(1);
                const tooltipText = `${slice.label}: ${slice.value} (${pct}%)`;
                
                ctx.font = 'bold 12px system-ui';
                const textWidth = ctx.measureText(tooltipText).width;
                const tooltipX = cx - textWidth / 2 - 10;
                const tooltipY = 10;
                
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.roundRect(tooltipX, tooltipY, textWidth + 20, 28, 6);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(tooltipText, cx, tooltipY + 18);
            }
        };
        
        // Função para detectar fatia pelo mouse
        const getSliceAt = (x, y) => {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > radius + 15) return -1;
            
            let angle = Math.atan2(dy, dx);
            if (angle < -Math.PI / 2) angle += Math.PI * 2;
            
            for (let i = 0; i < slices.length; i++) {
                let start = slices[i].startAngle;
                let end = slices[i].endAngle;
                if (start < -Math.PI / 2) start += Math.PI * 2;
                if (end < -Math.PI / 2) end += Math.PI * 2;
                if (angle >= start && angle <= end) return i;
            }
            return -1;
        };
        
        // Função para detectar legenda pelo mouse
        const getLegendAt = (x, y) => {
            for (let i = 0; i < legends.length; i++) {
                const l = legends[i];
                if (x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height) {
                    return i;
                }
            }
            return -1;
        };
        
        // Eventos
        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const sliceIndex = getSliceAt(x, y);
            const legendIndex = getLegendAt(x, y);
            
            canvas.style.cursor = (sliceIndex >= 0 || legendIndex >= 0) ? 'pointer' : 'default';
            render(sliceIndex, legendIndex);
        };
        
        canvas.onmouseleave = () => {
            canvas.style.cursor = 'default';
            render(-1, -1);
        };
        
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const legendIndex = getLegendAt(x, y);
            if (legendIndex >= 0 && legends[legendIndex]) {
                const label = legends[legendIndex].label;
                if (this.hiddenStatusItems.has(label)) {
                    this.hiddenStatusItems.delete(label);
                } else {
                    // Não permitir ocultar todos
                    if (this.hiddenStatusItems.size < allData.length - 1) {
                        this.hiddenStatusItems.add(label);
                    }
                }
                this.renderStatusChart(globalMetrics);
            }
        };
        
        // Renderização inicial
        render(-1, -1);
    },
    
    /**
     * Renderiza gráfico por dia da semana
     */
    renderByDayOfWeekChart(globalMetrics) {
        const canvas = document.getElementById('acompChartDayOfWeek');
        if (!canvas) return;
        
        const { ctx, width, height } = this.setupCanvas(canvas, 250);
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const totals = globalMetrics.byDayOfWeek || Array(7).fill(0);
        
        const padding = { top: 20, bottom: 40, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = chartWidth / 7 - 8;
        const maxVal = Math.max(...totals, 1);
        
        totals.forEach((val, i) => {
            const x = padding.left + i * (barWidth + 8) + 4;
            const barH = (val / maxVal) * chartHeight;
            const y = padding.top + chartHeight - barH;
            const color = i === 0 || i === 6 ? '#8b5cf6' : '#3b82f6';
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barH);
            
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 11px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(val.toString(), x + barWidth / 2, y - 5);
            
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '11px system-ui';
            ctx.fillText(days[i], x + barWidth / 2, height - 15);
        });
    },
    
    /**
     * Renderiza gráfico por hora
     */
    renderByHourChart(globalMetrics) {
        const canvas = document.getElementById('acompChartHour');
        if (!canvas) return;
        
        const { ctx, width, height } = this.setupCanvas(canvas, 250);
        const totals = globalMetrics.byHour || Array(24).fill(0);
        
        const padding = { top: 20, bottom: 40, left: 40, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const maxVal = Math.max(...totals, 1);
        
        // Linha
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const points = [];
        totals.forEach((val, i) => {
            const x = padding.left + (i / 23) * chartWidth;
            const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
            points.push({ x, y, val, hour: i });
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Área
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.fill();
        
        // Pontos
        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.fill();
        });
        
        // Labels de hora
        [0, 6, 12, 18, 23].forEach(h => {
            const x = padding.left + (h / 23) * chartWidth;
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${h}h`, x, height - 10);
        });
    },
    
    /**
     * Renderiza gráfico de evolução temporal
     */
    renderTimelineChart(globalMetrics) {
        const canvas = document.getElementById('acompChartTimeline');
        if (!canvas) return;
        
        const { ctx, width, height } = this.setupCanvas(canvas, 250);
        
        const months = Object.entries(globalMetrics.byMonth || {}).sort((a, b) => a[0].localeCompare(b[0]));
        if (!months.length) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados temporais', width/2, height/2);
            return;
        }
        
        const padding = { top: 20, bottom: 50, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const maxVal = Math.max(...months.map(m => m[1]), 1);
        
        // Desenhar linha primeiro
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        months.forEach(([month, val], i) => {
            const x = padding.left + (i / Math.max(months.length - 1, 1)) * chartWidth;
            const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Depois desenhar pontos e valores
        months.forEach(([month, val], i) => {
            const x = padding.left + (i / Math.max(months.length - 1, 1)) * chartWidth;
            const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
            
            // Ponto
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.fill();
            
            // Valor
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(val.toString(), x, y - 10);
        });
        
        // Labels
        const step = Math.ceil(months.length / 6);
        months.forEach(([month], i) => {
            if (i % step === 0 || i === months.length - 1) {
                const x = padding.left + (i / Math.max(months.length - 1, 1)) * chartWidth;
                ctx.fillStyle = this.colors.textMuted;
                ctx.font = '9px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(month.substring(2), x, height - 15);
            }
        });
    },
    
    /**
     * Renderiza gráfico de SLA por pessoa
     */
    renderSLAChart(people) {
        const canvas = document.getElementById('acompChartSLA');
        if (!canvas || !people.length) return;
        
        const top10 = people.filter(p => p.slaTotal > 0).slice(0, 10);
        if (!top10.length) {
            const { ctx, width, height } = this.setupCanvas(canvas, 250);
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados de SLA', width/2, height/2);
            return;
        }
        
        const { ctx, width, height } = this.setupCanvas(canvas, 250);
        
        const padding = { top: 20, bottom: 60, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = chartWidth / top10.length - 8;
        
        top10.forEach((m, i) => {
            const x = padding.left + i * (barWidth + 8) + 4;
            const sla = parseFloat(m.slaPercent);
            const barH = (sla / 100) * chartHeight;
            const y = padding.top + chartHeight - barH;
            
            const color = sla >= 90 ? '#10b981' : sla >= 70 ? '#f59e0b' : '#ef4444';
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barH);
            
            // Valor
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${m.slaPercent}%`, x + barWidth / 2, y - 5);
            
            // Nome
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '9px system-ui';
            ctx.textAlign = 'right';
            const name = m.person.length > 10 ? m.person.substring(0, 10) + '..' : m.person;
            ctx.fillText(name, 0, 0);
            ctx.restore();
        });
    },
    
    /**
     * Renderiza gráfico de produtividade
     */
    renderProductivityChart(people) {
        const canvas = document.getElementById('acompChartProductivity');
        if (!canvas || !people.length) return;
        
        const sorted = [...people].sort((a, b) => b.productivityIndex - a.productivityIndex).slice(0, 10);
        const { ctx, width, height } = this.setupCanvas(canvas, 280);
        
        const padding = { top: 20, bottom: 60, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = chartWidth / sorted.length - 8;
        
        sorted.forEach((m, i) => {
            const x = padding.left + i * (barWidth + 8) + 4;
            const barH = (m.productivityIndex / 100) * chartHeight;
            const y = padding.top + chartHeight - barH;
            
            // Gradient
            const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
            gradient.addColorStop(0, this.gradients[i % 10][0]);
            gradient.addColorStop(1, this.gradients[i % 10][1]);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barH);
            
            // Valor
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(m.productivityIndex.toString(), x + barWidth / 2, y - 5);
            
            // Nome
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '9px system-ui';
            ctx.textAlign = 'right';
            const name = m.person.length > 10 ? m.person.substring(0, 10) + '..' : m.person;
            ctx.fillText(name, 0, 0);
            ctx.restore();
        });
    },
    
    /**
     * Renderiza todos os gráficos
     */
    renderAllCharts(people, globalMetrics) {
        setTimeout(() => {
            this.renderRankingChart(people);
            this.renderResolutionChart(people);
            this.renderStatusChart(globalMetrics);
            this.renderByDayOfWeekChart(globalMetrics);
            this.renderByHourChart(globalMetrics);
            this.renderTimelineChart(globalMetrics);
            this.renderSLAChart(people);
            this.renderProductivityChart(people);
        }, 100);
    },
    
    /**
     * Renderiza a seção de Acompanhamento
     */
    async renderAcompanhamentoSection() {
        const container = document.getElementById('biAcompanhamentoContent');
        if (!container) {
            console.warn('Container biAcompanhamentoContent não encontrado');
            return;
        }
        
        // Obter dados dos tickets do BI principal
        const tickets = window.biAnalytics?.ticketsData || [];
        
        if (!tickets.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                    <p>Nenhum dado de ticket disponível.</p>
                    <p style="font-size: 0.85rem;">Carregue os dados primeiro na aba Pessoas ou Times.</p>
                </div>
            `;
            return;
        }
        
        // Calcular estatísticas
        const { people, totals, filteredCount, ticketsComTag, globalMetrics } = this.calculateStats(tickets);
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Header com Filtro de Período -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="color: #f4f4f5; margin: 0 0 0.5rem 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                            BI de Acompanhamento por Tags
                        </h2>
                        <p style="color: #a1a1aa; margin: 0; font-size: 0.85rem;">
                            Análise de tickets acompanhados (tratativa indireta) baseada na coluna <code style="background: #252536; padding: 2px 6px; border-radius: 4px; color: #e4e4e7;">tags</code>
                        </p>
                    </div>
                    
                    ${this.renderPeriodFilter()}
                </div>
                
                <!-- KPIs Linha 1 - Métricas Principais -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Total de Tickets</div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2" opacity="0.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #e4e4e7; line-height: 1;">${ticketsComTag.toLocaleString()}</div>
                        <div style="color: #52525b; font-size: 0.65rem; margin-top: 0.35rem;">de ${filteredCount.toLocaleString()} no período</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tickets Abertos</div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6; line-height: 1;">${totals.totalOpen}</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tickets Pendentes</div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" opacity="0.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #a1a1aa; line-height: 1;">${Math.max(0, ticketsComTag - totals.totalResolved - totals.totalOpen)}</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tickets Resolvidos</div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" opacity="0.6"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981; line-height: 1;">${totals.totalResolved.toLocaleString()}</div>
                    </div>
                </div>
                
                <!-- KPIs Linha 2 - SLA -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">SLA 1a Resposta <span style="color:#52525b">(Dentro)</span></div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" opacity="0.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: ${totals.slaPercent === '--' ? '#71717a' : (totals.slaPercent >= 80 ? '#10b981' : totals.slaPercent >= 60 ? '#f59e0b' : '#ef4444')}; line-height: 1;">${totals.slaPercent}${totals.slaPercent !== '--' ? '%' : ''}</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">SLA 1a Resolução <span style="color:#52525b">(Dentro)</span></div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" opacity="0.6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
                        </div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: ${totals.avgPercentResolved >= 80 ? '#10b981' : totals.avgPercentResolved >= 60 ? '#f59e0b' : '#ef4444'}; line-height: 1;">${totals.avgPercentResolved}%</div>
                    </div>
                </div>
                
                <!-- KPIs Linha 3 - Alertas (fundo colorido) -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
                    <div style="background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(180,83,9,0.1) 100%); padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(239,68,68,0.25);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Em Aberto</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #fbbf24; line-height: 1;">${totals.totalOpen} <span style="font-size: 0.9rem; font-weight: 500; color: #f59e0b;">${ticketsComTag > 0 ? ((totals.totalOpen / ticketsComTag) * 100).toFixed(1) : 0}%</span></div>
                    </div>
                    <div style="background: linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(127,29,29,0.15) 100%); padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(239,68,68,0.3);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M3 3l18 18M21 3L3 21"/></svg>
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Fora SLA</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444; line-height: 1;">${totals.slaPercent !== '--' ? (100 - totals.slaPercent) : '--'} <span style="font-size: 0.9rem; font-weight: 500; color: #dc2626;">${totals.slaPercent !== '--' ? '%' : ''}</span></div>
                    </div>
                    <div style="background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(180,83,9,0.1) 100%); padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(245,158,11,0.25);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                            <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Tempo Médio</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; color: #fbbf24; line-height: 1;">${totals.avgResolutionHours} <span style="font-size: 0.9rem; font-weight: 500; color: #f59e0b;">${totals.avgResolutionHours !== '--' ? 'horas' : ''}</span></div>
                    </div>
                </div>
                
                <!-- KPIs Linha 4 - Detalhes -->
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem;">
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Pessoas</div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #06b6d4; line-height: 1;">${totals.totalPeople}</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Tickets/Dia</div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #8b5cf6; line-height: 1;">${totals.avgTicketsPerDay}</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Tickets/Pessoa</div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" opacity="0.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #ec4899; line-height: 1;">${totals.avgTicketsPerPerson}</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">1ª Resposta</div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2" opacity="0.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #14b8a6; line-height: 1;">${totals.avgResponseHours}${totals.avgResponseHours !== '--' ? 'h' : ''}</div>
                    </div>
                    <div style="background: #1a1a2e; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Dias Analisados</div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.6"><circle cx="12" cy="12" r="10"/></svg>
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b; line-height: 1;">${totals.totalDays}</div>
                    </div>
                    <div style="background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,95,70,0.1) 100%); padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid rgba(16,185,129,0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="color: #71717a; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Top Performer</div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1" opacity="0.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #10b981; line-height: 1;">${totals.topPerformerName}</div>
                        <div style="color: #52525b; font-size: 0.6rem; margin-top: 0.25rem;">${totals.topPerformerCount} tickets</div>
                    </div>
                </div>
                
                ${people.length > 0 ? `
                    <!-- Gráficos - Visão Geral Premium -->
                    <div style="margin: 1rem 0 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
                        <h3 style="margin: 0; color: #e4e4e7; font-size: 0.95rem; font-weight: 600;">Visão Geral</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem;">
                        ${this.createChartCard('acompChartRanking', 'Ranking por Volume', 280)}
                        ${this.createChartCard('acompChartResolution', 'Taxa de Resolução', 250)}
                        ${this.createChartCard('acompChartStatus', 'Status dos Tickets', 250)}
                        ${this.createChartCard('acompChartTimeline', 'Evolução Temporal', 250)}
                    </div>
                    
                    <!-- Gráficos - Produtividade Premium -->
                    <div style="margin: 1.5rem 0 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        <h3 style="margin: 0; color: #e4e4e7; font-size: 0.95rem; font-weight: 600;">Produtividade</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem;">
                        ${this.createChartCard('acompChartDayOfWeek', 'Por Dia da Semana', 250)}
                        ${this.createChartCard('acompChartHour', 'Por Hora do Dia', 250)}
                        ${this.createChartCard('acompChartProductivity', 'Índice de Produtividade', 280)}
                        ${this.createChartCard('acompChartSLA', 'SLA 1ª Resposta', 250)}
                    </div>
                    
                    <!-- Barra de Taxa de Resolução - Premium -->
                    <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-top: 1.5rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                <h3 style="margin: 0; color: #e4e4e7; font-size: 0.9rem; font-weight: 600;">Taxa de Resolução por Pessoa</h3>
                            </div>
                            <button onclick="BIAcompanhamentoModule.expandResolutionChart()" title="Expandir" style="
                                background: rgba(16,185,129,0.1);
                                border: 1px solid rgba(16,185,129,0.2);
                                color: #34d399;
                                width: 28px;
                                height: 28px;
                                border-radius: 6px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='rgba(16,185,129,0.25)'; this.style.borderColor='rgba(16,185,129,0.4)'" onmouseout="this.style.background='rgba(16,185,129,0.1)'; this.style.borderColor='rgba(16,185,129,0.2)'">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${people.slice(0, 15).map(p => {
                                const barColor = p.percentResolved >= 80 ? this.colors.success :
                                               p.percentResolved >= 50 ? this.colors.warning : this.colors.danger;
                                return `
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="min-width: 140px; font-size: 0.85rem; color: ${this.colors.text}; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${p.person}">
                                            ${p.person}
                                        </div>
                                        <div style="flex: 1; background: ${this.colors.background}; border-radius: 4px; height: 24px; position: relative; overflow: hidden;">
                                            <div style="
                                                position: absolute;
                                                left: 0;
                                                top: 0;
                                                height: 100%;
                                                width: ${p.percentResolved}%;
                                                background: linear-gradient(90deg, ${barColor}, ${barColor}cc);
                                                border-radius: 4px;
                                                transition: width 0.5s ease;
                                            "></div>
                                            <div style="
                                                position: absolute;
                                                right: 8px;
                                                top: 50%;
                                                transform: translateY(-50%);
                                                font-size: 0.75rem;
                                                font-weight: 600;
                                                color: ${this.colors.text};
                                            ">${p.percentResolved}%</div>
                                        </div>
                                        <div style="min-width: 80px; text-align: right; font-size: 0.8rem; color: ${this.colors.textMuted};">
                                            ${p.resolved}/${p.total}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- Tabela Detalhada - Premium -->
                    <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-top: 1.5rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                                <h3 style="margin: 0; color: #e4e4e7; font-size: 0.9rem; font-weight: 600;">Detalhamento por Pessoa</h3>
                            </div>
                            <button onclick="BIAcompanhamentoModule.expandDetailTable()" title="Expandir" style="
                                background: rgba(99,102,241,0.1);
                                border: 1px solid rgba(99,102,241,0.2);
                                color: #a5b4fc;
                                width: 28px;
                                height: 28px;
                                border-radius: 6px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='rgba(99,102,241,0.25)'; this.style.borderColor='rgba(99,102,241,0.4)'" onmouseout="this.style.background='rgba(99,102,241,0.1)'; this.style.borderColor='rgba(99,102,241,0.2)'">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                        </div>
                        <div style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: #71717a; font-size: 0.7rem;">Clique nos cabeçalhos para ordenar</span>
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                        ${this.sortableHeader('Pessoa', 'person')}
                                        ${this.sortableHeader('Total', 'total')}
                                        ${this.sortableHeader('Resolvidos', 'resolved')}
                                        ${this.sortableHeader('Abertos', 'open')}
                                        ${this.sortableHeader('% Resolução', 'percentResolved')}
                                        ${this.sortableHeader('Tickets/Dia', 'ticketsPerDay')}
                                        ${this.sortableHeader('Resol./Dia', 'resolvedPerDay')}
                                        ${this.sortableHeader('Tempo Resol.', 'avgResolutionHours')}
                                        ${this.sortableHeader('SLA 1ª Resp.', 'slaPercent')}
                                        ${this.sortableHeader('Produtividade', 'productivityIndex')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.sortPeople(people).map(p => {
                                        const statusColor = p.percentResolved >= 80 ? this.colors.success :
                                                          p.percentResolved >= 50 ? this.colors.warning : this.colors.danger;
                                        const slaColor = parseFloat(p.slaPercent) >= 90 ? this.colors.success :
                                                        parseFloat(p.slaPercent) >= 70 ? this.colors.warning : this.colors.danger;
                                        const prodColor = p.productivityIndex >= 80 ? this.colors.success :
                                                         p.productivityIndex >= 50 ? this.colors.warning : this.colors.danger;
                                        return `
                                            <tr style="border-bottom: 1px solid ${this.colors.border}22;">
                                                <td style="padding: 0.6rem; color: ${this.colors.text};">
                                                    <strong>${p.person}</strong>
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center; color: ${this.colors.accent}; font-weight: 600;">
                                                    ${p.total}
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center; color: ${this.colors.success}; font-weight: 600;">
                                                    ${p.resolved}
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center; color: ${this.colors.warning}; font-weight: 600;">
                                                    ${p.open}
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center;">
                                                    <span style="background: ${statusColor}22; color: ${statusColor}; padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem;">
                                                        ${p.percentResolved}%
                                                    </span>
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center; color: ${this.colors.text};">
                                                    ${p.ticketsPerDay}
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center; color: ${this.colors.text};">
                                                    ${p.resolvedPerDay}
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center; color: ${this.colors.text};">
                                                    ${p.avgResolutionHours}h
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center;">
                                                    <span style="background: ${slaColor}22; color: ${slaColor}; padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem;">
                                                        ${p.slaPercent}%
                                                    </span>
                                                </td>
                                                <td style="padding: 0.6rem; text-align: center;">
                                                    <span style="background: ${prodColor}22; color: ${prodColor}; padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem;">
                                                        ${p.productivityIndex}
                                                    </span>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🏷️</div>
                        <p>Nenhum ticket com tags encontrado no período selecionado.</p>
                    </div>
                `}
            </div>
        `;
        
        // Salvar dados para expansão de gráficos
        this._lastPeople = people;
        this._lastGlobalMetrics = globalMetrics;
        
        // Renderizar gráficos após inserir o HTML
        if (people.length > 0) {
            this.renderAllCharts(people, globalMetrics);
            
            // Adicionar tooltips interativos aos gráficos
            this.setupChartTooltips(people, globalMetrics);
        }
    },
    
    /**
     * Configura tooltips interativos para os gráficos
     */
    setupChartTooltips(people, globalMetrics) {
        // Tooltip para Ranking
        this.setupBarChartTooltip('acompChartRanking', people.slice(0, 10), (m) => `
            <strong>${m.person}</strong><br>
            Total: ${m.total} tickets<br>
            Resolvidos: ${m.resolved} (${m.percentResolved}%)<br>
            Abertos: ${m.open}
        `);
        
        // Tooltip para Resolução
        this.setupBarChartTooltip('acompChartResolution', people.slice(0, 10), (m) => `
            <strong>${m.person}</strong><br>
            Taxa: ${m.percentResolved}%<br>
            ${m.resolved} de ${m.total} tickets
        `);
        
        // Tooltip para Produtividade
        const sorted = [...people].sort((a, b) => b.productivityIndex - a.productivityIndex).slice(0, 10);
        this.setupBarChartTooltip('acompChartProductivity', sorted, (m) => `
            <strong>${m.person}</strong><br>
            Índice: ${m.productivityIndex}<br>
            Taxa Resolução: ${m.percentResolved}%<br>
            SLA: ${m.slaPercent}%
        `);
        
        // Tooltip para SLA
        const slaFiltered = people.filter(p => p.slaTotal > 0).slice(0, 10);
        this.setupBarChartTooltip('acompChartSLA', slaFiltered, (m) => `
            <strong>${m.person}</strong><br>
            SLA: ${m.slaPercent}%<br>
            Dentro: ${m.slaWithin} de ${m.slaTotal}
        `);
        
        // Tooltip para Dia da Semana
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dowData = (globalMetrics?.byDayOfWeek || []).map((val, i) => ({ label: days[i], value: val }));
        this.setupBarChartTooltip('acompChartDayOfWeek', dowData, (d) => `
            <strong>${d.label}</strong><br>
            ${d.value} tickets
        `, 7);
        
        // Tooltip para Hora
        this.setupLineChartTooltip('acompChartHour', globalMetrics?.byHour || [], (val, i) => `
            <strong>${i}h</strong><br>
            ${val} tickets
        `);
        
        // Tooltip para Status (pizza)
        const statusLabels = {
            2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado',
            6: 'Aguardando Cliente', 7: 'Em análise', 8: 'Aguardando Parceiros',
            9: 'Aguardando Publicação', 10: 'Em Homologação', 11: 'Validação',
            12: 'Levantamento', 13: 'Em Fila Dev', 14: 'Interno',
            15: 'Pausado', 16: 'On Hold', 17: 'Em Progresso',
            18: 'Escalado', 19: 'Reaberto', 20: 'Novo'
        };
        const statusData = Object.entries(globalMetrics?.statusCounts || {})
            .map(([status, count]) => ({ label: statusLabels[status] || `Status ${status}`, value: count }))
            .sort((a, b) => b.value - a.value);
        const totalStatus = statusData.reduce((a, b) => a + b.value, 0);
        this.setupPieChartTooltip('acompChartStatus', statusData, totalStatus);
        
        // Tooltip para Evolução Temporal
        const months = Object.entries(globalMetrics?.byMonth || {}).sort((a, b) => a[0].localeCompare(b[0]));
        this.setupTimelineTooltip('acompChartTimeline', months);
    },
    
    /**
     * Configura tooltip para gráfico de pizza
     */
    setupPieChartTooltip(chartId, data, total) {
        const canvas = document.getElementById(chartId);
        const tooltip = document.getElementById(chartId + 'Tooltip');
        if (!canvas || !tooltip || !data.length) return;
        
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 3;
        const cy = rect.height / 2;
        const radius = Math.min(cx, cy) - 20;
        
        canvas.onmousemove = (e) => {
            const x = e.offsetX - cx;
            const y = e.offsetY - cy;
            const dist = Math.sqrt(x*x + y*y);
            
            if (dist <= radius && dist > 0) {
                let angle = Math.atan2(y, x) + Math.PI / 2;
                if (angle < 0) angle += Math.PI * 2;
                
                let cumulative = 0;
                for (const d of data) {
                    const sliceAngle = (d.value / total) * Math.PI * 2;
                    if (angle >= cumulative && angle < cumulative + sliceAngle) {
                        const pct = ((d.value / total) * 100).toFixed(1);
                        tooltip.innerHTML = `<strong>${d.label}</strong><br>${d.value} tickets (${pct}%)`;
                        tooltip.style.display = 'block';
                        tooltip.style.left = Math.min(e.offsetX + 10, rect.width - 150) + 'px';
                        tooltip.style.top = Math.max(e.offsetY - 50, 10) + 'px';
                        return;
                    }
                    cumulative += sliceAngle;
                }
            }
            tooltip.style.display = 'none';
        };
        
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
    },
    
    /**
     * Configura tooltip para gráfico de evolução temporal
     */
    setupTimelineTooltip(chartId, months) {
        const canvas = document.getElementById(chartId);
        const tooltip = document.getElementById(chartId + 'Tooltip');
        if (!canvas || !tooltip || !months.length) return;
        
        const rect = canvas.getBoundingClientRect();
        const padding = { left: 50, right: 20 };
        const chartWidth = rect.width - padding.left - padding.right;
        
        canvas.onmousemove = (e) => {
            const x = e.offsetX - padding.left;
            const idx = Math.round((x / chartWidth) * Math.max(months.length - 1, 1));
            
            if (idx >= 0 && idx < months.length && x >= 0) {
                const [month, val] = months[idx];
                tooltip.innerHTML = `<strong>${month}</strong><br>${val} tickets`;
                tooltip.style.display = 'block';
                tooltip.style.left = Math.min(e.offsetX + 10, rect.width - 120) + 'px';
                tooltip.style.top = Math.max(e.offsetY - 50, 10) + 'px';
            } else {
                tooltip.style.display = 'none';
            }
        };
        
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
    },
    
    /**
     * Configura tooltip para gráfico de barras
     */
    setupBarChartTooltip(chartId, data, formatFn, barCount = null) {
        const canvas = document.getElementById(chartId);
        const tooltip = document.getElementById(chartId + 'Tooltip');
        if (!canvas || !tooltip || !data.length) return;
        
        const count = barCount || data.length;
        const rect = canvas.getBoundingClientRect();
        const padding = { left: 50, right: 20 };
        const chartWidth = rect.width - padding.left - padding.right;
        const barWidth = chartWidth / count;
        
        canvas.onmousemove = (e) => {
            const x = e.offsetX - padding.left;
            const idx = Math.floor(x / barWidth);
            
            if (idx >= 0 && idx < data.length && x >= 0) {
                const item = data[idx];
                tooltip.innerHTML = formatFn(item);
                tooltip.style.display = 'block';
                tooltip.style.left = Math.min(e.offsetX + 10, rect.width - 150) + 'px';
                tooltip.style.top = Math.max(e.offsetY - 60, 10) + 'px';
            } else {
                tooltip.style.display = 'none';
            }
        };
        
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
    },
    
    /**
     * Configura tooltip para gráfico de linha
     */
    setupLineChartTooltip(chartId, data, formatFn) {
        const canvas = document.getElementById(chartId);
        const tooltip = document.getElementById(chartId + 'Tooltip');
        if (!canvas || !tooltip || !data.length) return;
        
        const rect = canvas.getBoundingClientRect();
        const padding = { left: 40, right: 20 };
        const chartWidth = rect.width - padding.left - padding.right;
        
        canvas.onmousemove = (e) => {
            const x = e.offsetX - padding.left;
            const idx = Math.round((x / chartWidth) * 23);
            
            if (idx >= 0 && idx < 24 && x >= 0) {
                tooltip.innerHTML = formatFn(data[idx], idx);
                tooltip.style.display = 'block';
                tooltip.style.left = Math.min(e.offsetX + 10, rect.width - 120) + 'px';
                tooltip.style.top = Math.max(e.offsetY - 50, 10) + 'px';
            } else {
                tooltip.style.display = 'none';
            }
        };
        
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.BIAcompanhamentoModule;
}
