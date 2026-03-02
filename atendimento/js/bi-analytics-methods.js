/**
 * BI Analytics Methods - Continuação dos métodos da classe BIAnalytics
 */

// Verificar se BIAnalytics existe antes de adicionar métodos
if (typeof BIAnalytics === 'undefined') {
    console.error('❌ BIAnalytics não está definido! bi-analytics.js deve ser carregado antes deste arquivo.');
} else {
    console.log('✅ Adicionando métodos ao BIAnalytics...');
}

// Adicionar métodos à classe BIAnalytics
if (typeof BIAnalytics !== 'undefined') {
    Object.assign(BIAnalytics.prototype, {

        // ============ HELPER PARA STATUS (USA MÓDULO CENTRALIZADO) ============

        getStatusLabel(status) {
            if (status === null || status === undefined) return 'Sem Status';

            // Se já é uma string legível (não é número), retornar direto
            if (typeof status === 'string' && isNaN(parseInt(status))) {
                return status; // Ex: "Aguardando subir em PROD"
            }

            const numStatus = parseInt(status);

            // USAR MÓDULO CENTRALIZADO se disponível
            if (window.FRESHDESK_STATUS && !isNaN(numStatus)) {
                return window.FRESHDESK_STATUS.getLabel(numStatus);
            }

            // Fallback para mapa local
            if (!isNaN(numStatus) && this.statusLabels && this.statusLabels[numStatus]) {
                return this.statusLabels[numStatus];
            }

            // Fallback final
            return !isNaN(numStatus) ? `Status ${numStatus}` : String(status);
        },

        getStatusColor(status) {
            const numStatus = parseInt(status);

            // USAR MÓDULO CENTRALIZADO se disponível
            if (window.FRESHDESK_STATUS && !isNaN(numStatus)) {
                return window.FRESHDESK_STATUS.getColor(numStatus);
            }

            // Fallback: cores baseadas em palavras-chave do status
            const statusStr = String(status).toLowerCase();

            if (statusStr.includes('fechado') || statusStr.includes('closed')) return '#059669';
            if (statusStr.includes('resolvido') || statusStr.includes('resolved')) return '#10b981';
            if (statusStr.includes('aberto') || statusStr.includes('open')) return '#ef4444';
            if (statusStr.includes('pendente') || statusStr.includes('pending')) return '#f59e0b';
            if (statusStr.includes('progresso') || statusStr.includes('progress')) return '#3b82f6';
            if (statusStr.includes('aguardando') || statusStr.includes('waiting')) return '#8b5cf6';
            if (statusStr.includes('prod')) return '#a855f7';
            if (statusStr.includes('cancelado') || statusStr.includes('cancel')) return '#6b7280';

            // Fallback para mapa local
            if (!isNaN(numStatus) && this.statusColors && this.statusColors[numStatus]) {
                return this.statusColors[numStatus];
            }

            return this.colors?.primary || '#6366f1';
        },

        /**
         * Verifica se um ticket está fechado (resolvido/fechado)
         */
        isTicketClosed(ticket) {
            if (window.FRESHDESK_STATUS) {
                return window.FRESHDESK_STATUS.isClosed(ticket.status);
            }
            return [4, 5].includes(Number(ticket.status));
        },

        /**
         * Obtém a categoria simplificada do status
         */
        getSimplifiedStatus(status) {
            if (window.FRESHDESK_STATUS) {
                return window.FRESHDESK_STATUS.getSimplifiedCategory(status);
            }
            // Fallback
            const numStatus = Number(status);
            if ([4, 5].includes(numStatus)) return 'Resolvido';
            if (numStatus === 2) return 'Aberto';
            if ([3, 17].includes(numStatus)) return 'Pendente';
            if ([7, 16].includes(numStatus)) return 'Aguardando';
            return 'Em Progresso';
        },

        // ============ HELPERS PARA CAMPOS DE SLA (NORMALIZADOS) ============

        // Aliases para normalização de nomes
        PERSON_ALIASES: {
            // Variações comuns
            'joao': 'João Peres',
            'joão': 'João Peres',
            'joao peres': 'João Peres',
            'gabriel': 'Gabriel CS',
            'gabriel cs': 'Gabriel CS',
            'andreia': 'Andreia Ribeiro',
            'andréia': 'Andreia Ribeiro',
            'andreia ribeiro': 'Andreia Ribeiro',
            'adriana': 'Adriana Florencio',
            'adriana florencio': 'Adriana Florencio',
            'alianie': 'Alianie Lanes',
            'alianie lanes': 'Alianie Lanes',
            'francisco': 'Francisco Nascimento',
            'francisco nascimento': 'Francisco Nascimento',
            'gustavo': 'Gustavo Martins',
            'gustavo martins': 'Gustavo Martins',
            'jessica': 'Jéssica Dias',
            'jéssica': 'Jéssica Dias',
            'jessica dias': 'Jéssica Dias',
            'marciele': 'Marciele Quintanilha',
            'marciele quintanilha': 'Marciele Quintanilha'
        },

        /**
         * Normaliza o nome da pessoa usando mapa de aliases
         * @param {string} name - Nome para normalizar
         * @returns {string} - Nome canônico ou original formatado
         */
        normalizePersonName(name) {
            if (!name) return '';
            const cleanName = name.toLowerCase().trim();
            return this.PERSON_ALIASES[cleanName] || name.trim();
        },

        /**
         * Calcula horas úteis entre duas datas
         * Regra: Seg-Sex, 08:00 às 18:00
         * @param {Date} start - Data inicial
         * @param {Date} end - Data final
         * @returns {number} - Horas úteis em ms
         */
        calculateBusinessHours(start, end) {
            if (start >= end) return 0;

            const startHour = 8;
            const endHour = 18;
            let totalMs = 0;
            let current = new Date(start);

            // Ajustar start para dentro do horário útil se necessário
            if (current.getDay() === 0) { // Domingo -> Segunda 08:00
                current.setDate(current.getDate() + 1);
                current.setHours(startHour, 0, 0, 0);
            } else if (current.getDay() === 6) { // Sábado -> Segunda 08:00
                current.setDate(current.getDate() + 2);
                current.setHours(startHour, 0, 0, 0);
            } else if (current.getHours() < startHour) { // Antes das 08:00 -> 08:00
                current.setHours(startHour, 0, 0, 0);
            } else if (current.getHours() >= endHour) { // Depois das 18:00 -> Amanhã 08:00
                current.setDate(current.getDate() + 1);
                current.setHours(startHour, 0, 0, 0);
                // Re-verificar fim de semana após adicionar um dia
                if (current.getDay() === 6) current.setDate(current.getDate() + 2);
                if (current.getDay() === 0) current.setDate(current.getDate() + 1);
            }

            while (current < end) {
                // Se chegou no dia do fim
                if (current.toDateString() === end.toDateString()) {
                    // Se o fim é antes do início do expediente, não conta nada hoje
                    if (end.getHours() < startHour) break;

                    // O fim efetivo é o menor entre: hora real do fim e 18:00
                    const effectiveEnd = new Date(end);
                    if (effectiveEnd.getHours() >= endHour) {
                        effectiveEnd.setHours(endHour, 0, 0, 0);
                    }

                    // Se current já passou do effectiveEnd (ex: start era 17h, end era 18h30 -> effective 18h)
                    if (current < effectiveEnd) {
                        totalMs += effectiveEnd - current;
                    }
                    break;
                }

                // Dia completo (08:00 as 18:00 = 10 horas)
                // Verificar se current ainda está no horário útil (deveria estar pelo ajuste inicial)
                const endOfDay = new Date(current);
                endOfDay.setHours(endHour, 0, 0, 0);

                if (current < endOfDay) {
                    totalMs += endOfDay - current;
                }

                // Avançar para próximo dia 08:00
                current.setDate(current.getDate() + 1);
                current.setHours(startHour, 0, 0, 0);

                // Pular fim de semana
                if (current.getDay() === 6) current.setDate(current.getDate() + 2);
                if (current.getDay() === 0) current.setDate(current.getDate() + 1);
            }

            return totalMs;
        },

        /**
         * Obtém o timestamp da primeira resposta de um ticket
         * Unifica todos os possíveis nomes de campos usados pelo Freshdesk/Supabase
         * @param {Object} ticket - Objeto do ticket
         * @returns {string|null} - Timestamp da primeira resposta ou null
         */
        getFirstResponseTime(ticket) {
            if (!ticket) return null;

            // Ordem de prioridade dos campos
            return ticket.stats_first_responded_at ||
                ticket.stats_first_response_at ||
                ticket.first_responded_at ||
                ticket.first_response_time ||
                (ticket.stats && (ticket.stats.first_responded_at || ticket.stats.first_response_at)) ||
                null;
        },

        /**
         * Calcula o tempo de resposta em milissegundos (BUSINESS HOURS)
         * @param {Object} ticket - Objeto do ticket
         * @returns {number|null} - Tempo em ms ou null se não disponível
         */
        getResponseTimeMs(ticket) {
            const firstResponse = this.getFirstResponseTime(ticket);
            if (!firstResponse || !ticket.created_at) return null;

            const start = new Date(ticket.created_at);
            const end = new Date(firstResponse);

            // Usar cálculo de horas úteis
            return this.calculateBusinessHours(start, end);
        },

        /**
         * Verifica se o ticket está dentro do SLA de primeira resposta
         * @param {Object} ticket - Objeto do ticket  
         * @param {number} slaLimitHours - Limite do SLA em horas (padrão: 4)
         * @returns {boolean|null} - true se dentro, false se fora, null se não aplicável
         */
        isWithinSLA(ticket, slaLimitHours = 4) {
            // Verificar tipos ignorados
            const typeNorm = (ticket.type || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
            if (this.ignoreTypesForSLA && this.ignoreTypesForSLA.has(typeNorm)) {
                return null; // Não aplicável
            }

            const responseTimeMs = this.getResponseTimeMs(ticket);
            if (responseTimeMs === null) return null;

            const slaLimitMs = slaLimitHours * 60 * 60 * 1000;
            return responseTimeMs <= slaLimitMs;
        },

        // ============ CÁLCULO DE TENDÊNCIAS E COMPARATIVO ============

        calculateTrends(currentMetrics) {
            // Calcular métricas baseado no período SELECIONADO pelo usuário
            const now = new Date();
            let currentStart, currentEnd, previousStart, previousEnd;
            let periodDays = 30; // padrão

            if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
                // Período personalizado
                currentStart = new Date(this.customDateRange.start);
                currentEnd = new Date(this.customDateRange.end);
                periodDays = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1;

                // Período anterior: mesmo número de dias antes do início
                previousEnd = new Date(currentStart.getTime() - 1);
                previousStart = new Date(previousEnd.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
            } else if (this.periodFilter !== 'all') {
                // Período pré-definido (7, 30, 90, 365 dias)
                periodDays = parseInt(this.periodFilter) || 30;

                currentEnd = now;
                currentStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

                previousEnd = new Date(currentStart.getTime() - 1);
                previousStart = new Date(previousEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);
            } else {
                // "Tudo" - usar últimos 30 dias vs anterior
                periodDays = 30;
                currentEnd = now;
                currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                previousEnd = new Date(currentStart.getTime() - 1);
                previousStart = new Date(previousEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            // Armazenar informação do período para exibição
            this._trendPeriodDays = periodDays;

            // Usar ticketsData completo para período anterior (não filteredData que já está filtrado)
            const allData = this.ticketsData || this.filteredData;

            // Período atual
            const currentPeriod = allData.filter(t => {
                const d = new Date(t.created_at);
                return d >= currentStart && d <= currentEnd;
            });

            // Período anterior
            const previousPeriod = allData.filter(t => {
                const d = new Date(t.created_at);
                return d >= previousStart && d <= previousEnd;
            });

            const self = this; // Referência para usar nos helpers
            const calcPeriodMetrics = (data) => {
                const total = data.length;
                const resolved = data.filter(t => [4, 5].includes(Number(t.status))).length;
                const open = data.filter(t => Number(t.status) === 2).length;
                const inProgress = data.filter(t => [3, 6, 7, 8, 9, 10, 11].includes(Number(t.status))).length;

                // SLA - usando helpers normalizados
                const slaWithin = data.filter(t => self.isWithinSLA(t, 4) === true).length;
                const slaTotal = data.filter(t => self.getFirstResponseTime(t) !== null).length;

                // Tempo médio de resposta - usando helper normalizado
                let totalResponseTime = 0, responseCount = 0;
                data.forEach(t => {
                    const responseMs = self.getResponseTimeMs(t);
                    if (responseMs !== null) {
                        const hours = responseMs / (1000 * 60 * 60);
                        if (hours > 0 && hours < 720) { // Menos de 30 dias
                            totalResponseTime += hours;
                            responseCount++;
                        }
                    }
                });

                return {
                    total,
                    resolved,
                    open,
                    inProgress,
                    resolutionRate: total > 0 ? (resolved / total * 100) : 0,
                    slaPercent: slaTotal > 0 ? (slaWithin / slaTotal * 100) : 0,
                    backlog: data.filter(t => ![4, 5].includes(Number(t.status))).length,
                    avgResponseHours: responseCount > 0 ? (totalResponseTime / responseCount) : 0
                };
            };

            const current = calcPeriodMetrics(currentPeriod);
            const previous = calcPeriodMetrics(previousPeriod);

            const calcChange = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return ((curr - prev) / prev * 100);
            };

            return {
                totalChange: calcChange(current.total, previous.total),
                resolvedChange: calcChange(current.resolved, previous.resolved),
                openChange: calcChange(current.open, previous.open),
                inProgressChange: calcChange(current.inProgress, previous.inProgress),
                resolutionRateChange: current.resolutionRate - previous.resolutionRate,
                slaChange: current.slaPercent - previous.slaPercent,
                backlogChange: calcChange(current.backlog, previous.backlog),
                avgResponseChange: calcChange(current.avgResponseHours, previous.avgResponseHours),
                currentPeriod: current,
                previousPeriod: previous,
                periodDays: periodDays
            };
        },

        // Texto dinâmico para o badge de tendências
        getTrendBadgeText() {
            const days = this._trendPeriodDays || 30;
            if (days === 1) return '1 dia vs anterior';
            if (days === 7) return '7d vs semana anterior';
            if (days === 30) return '30d vs mês anterior';
            if (days === 90) return '90d vs trimestre anterior';
            if (days === 365) return '1 ano vs ano anterior';
            return `${days}d vs período anterior`;
        },

        formatTrend(value, invertColors = false) {
            const absVal = Math.abs(value).toFixed(1);
            const isPositive = value > 0;
            const isNeutral = Math.abs(value) < 0.5;

            if (isNeutral) {
                return `<span style="color: #94a3b8; font-size: 0.75rem;">→ 0%</span>`;
            }

            // Para algumas métricas, aumento é ruim (ex: backlog)
            const goodColor = invertColors ? '#ef4444' : '#10b981';
            const badColor = invertColors ? '#10b981' : '#ef4444';
            const color = isPositive ? goodColor : badColor;
            const arrow = isPositive ? '↑' : '↓';

            return `<span style="color: ${color}; font-size: 0.75rem; font-weight: 600;">${arrow} ${absVal}%</span>`;
        },

        // ============ ALERTAS DE SLA ============

        checkSLAAlerts(metrics) {
            const alerts = [];

            // Alerta SLA crítico (< 70%)
            if (metrics.slaPercent < 70) {
                alerts.push({
                    type: 'critical',
                    icon: '🚨',
                    title: 'SLA Crítico!',
                    message: `SLA de 1ª resposta em ${metrics.slaPercent}% - Abaixo do aceitável`,
                    color: '#ef4444'
                });
            } else if (metrics.slaPercent < 85) {
                alerts.push({
                    type: 'warning',
                    icon: '⚠️',
                    title: 'SLA em Atenção',
                    message: `SLA de 1ª resposta em ${metrics.slaPercent}% - Monitorar`,
                    color: '#f59e0b'
                });
            }

            // Alerta backlog alto
            if (metrics.backlogOver7Percent > 40) {
                alerts.push({
                    type: 'warning',
                    icon: '📦',
                    title: 'Backlog Elevado',
                    message: `${metrics.backlogOver7Percent}% do backlog tem mais de 7 dias`,
                    color: '#f59e0b'
                });
            }

            // Alerta violações SLA
            if (metrics.slaOutside > 10) {
                alerts.push({
                    type: 'warning',
                    icon: '⏰',
                    title: 'Violações de SLA',
                    message: `${metrics.slaOutside} tickets violaram o SLA de 1ª resposta`,
                    color: '#ef4444'
                });
            }

            return alerts;
        },

        renderSLAAlerts(alerts) {
            if (alerts.length === 0) return '';

            return `
            <div style="margin-bottom: 1.5rem;">
                ${alerts.map(alert => `
                    <div style="
                        background: ${alert.color}15;
                        border-left: 4px solid ${alert.color};
                        padding: 1rem 1.5rem;
                        border-radius: 0 8px 8px 0;
                        margin-bottom: 0.75rem;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    ">
                        <span style="font-size: 1.5rem;">${alert.icon}</span>
                        <div>
                            <div style="font-weight: 600; color: ${alert.color};">${alert.title}</div>
                            <div style="font-size: 0.9rem; color: #94a3b8;">${alert.message}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        },

        // ============ DRILL-DOWN ============

        showDrillDown(category, filter, title) {
            // Filtrar tickets baseado na categoria
            let tickets = [];

            switch (category) {
                case 'status':
                    tickets = this.filteredData.filter(t => Number(t.status) === filter);
                    break;
                case 'resolved':
                    // Status 4 (Resolvido) e 5 (Fechado)
                    tickets = this.filteredData.filter(t => [4, 5].includes(Number(t.status)));
                    break;
                case 'in_progress':
                    // Qualquer status exceto 2 (Aberto), 3 (Pendente), 4 (Resolvido), 5 (Fechado)
                    tickets = this.filteredData.filter(t => ![2, 3, 4, 5].includes(Number(t.status)));
                    break;
                case 'backlog':
                    // Todos os tickets não resolvidos/fechados
                    tickets = this.filteredData.filter(t => ![4, 5].includes(Number(t.status)));
                    break;
                case 'sla_violated':
                    // Usar helper normalizado para consistência
                    tickets = this.filteredData.filter(t => this.isWithinSLA(t, 4) === false);
                    break;
                case 'backlog_old':
                    tickets = this.filteredData.filter(t => {
                        if ([4, 5].includes(Number(t.status))) return false;
                        const age = (new Date() - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
                        return age > 7;
                    });
                    break;
                case 'new_in_period':
                    // Tickets NOVOS criados dentro do período
                    tickets = this.newTicketsInPeriod || [];
                    break;
                case 'inherited':
                    // Tickets HERDADOS (criados antes do período)
                    tickets = this.inheritedTickets || [];
                    break;
                case 'resolved_new':
                    // Tickets novos que foram resolvidos no período
                    tickets = this.resolvedNewTickets || [];
                    break;
                case 'resolved_inherited':
                    // Tickets herdados que foram resolvidos no período
                    tickets = this.resolvedInheritedTickets || [];
                    break;
                case 'entity':
                    const entityField = this.currentView === 'pessoa' ? 'responder_name' : 'group_name';
                    tickets = this.filteredData.filter(t => t[entityField] === filter);
                    break;
                case 'system':
                    tickets = this.filteredData.filter(t => {
                        let sistema = null;
                        if (t.custom_fields) {
                            let cf = t.custom_fields;
                            if (typeof cf === 'string') try { cf = JSON.parse(cf); } catch { /* JSON inválido */ }
                            if (cf && typeof cf === 'object') sistema = cf.cf_teste || cf.cf_sistema;
                        }
                        return sistema === filter;
                    });
                    break;
                default:
                    tickets = this.filteredData.slice(0, 50);
            }

            // Limitar a 100 tickets
            tickets = tickets.slice(0, 100);

            const self = this; // Referência para usar nos templates

            const modal = document.createElement('div');
            modal.id = 'drillDownModal';
            modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            padding: 2rem;
        `;
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            modal.innerHTML = `
            <div style="
                background: #1e293b; border-radius: 16px; max-width: 900px; width: 100%;
                max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;
            ">
                <div style="padding: 1.5rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: white;">🔍 ${title} (${tickets.length} tickets)</h3>
                    <button onclick="this.closest('#drillDownModal').remove()" style="
                        background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;
                    ">×</button>
                </div>
                <div style="overflow-y: auto; padding: 1rem;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: #0f172a;">
                                <th style="padding: 0.75rem; text-align: left; color: #94a3b8;">ID</th>
                                <th style="padding: 0.75rem; text-align: left; color: #94a3b8;">Assunto</th>
                                <th style="padding: 0.75rem; text-align: center; color: #94a3b8;">Status</th>
                                <th style="padding: 0.75rem; text-align: center; color: #94a3b8;">Criado</th>
                                <th style="padding: 0.75rem; text-align: left; color: #94a3b8;">Responsável</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tickets.map(t => `
                                <tr style="border-bottom: 1px solid #334155;">
                                    <td style="padding: 0.75rem; color: #60a5fa;">#${t.id}</td>
                                    <td style="padding: 0.75rem; color: white; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        ${(t.subject || 'Sem assunto').substring(0, 50)}${(t.subject || '').length > 50 ? '...' : ''}
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="padding: 0.25rem 0.5rem; border-radius: 4px; background: ${self.getStatusColor(t.status)}33; color: ${self.getStatusColor(t.status)}; font-size: 0.8rem; font-weight: 500;">
                                            ${self.getStatusLabel(t.status)}
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center; color: #94a3b8;">
                                        ${t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td style="padding: 0.75rem; color: #94a3b8;">${t.responder_name || t.group_name || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${tickets.length === 0 ? '<p style="text-align: center; color: #94a3b8; padding: 2rem;">Nenhum ticket encontrado</p>' : ''}
                </div>
            </div>
        `;

            document.body.appendChild(modal);
        },

        // ============ FILTRO DE PERÍODO ============

        setPeriodFilter(period) {
            this.periodFilter = period;
            // Se não for 'custom', limpar datas personalizadas
            if (period !== 'custom') {
                this.customDateRange = { start: null, end: null };
            }
            // analyzeData já usa getPeriodDates() internamente
            this.analyzeData();
        },

        setCustomDateRange(startDate, endDate) {
            this.customDateRange = {
                start: startDate ? new Date(startDate) : null,
                end: endDate ? new Date(endDate) : null
            };
            this.periodFilter = 'custom';
            // analyzeData já usa getPeriodDates() internamente
            this.analyzeData();
        },

        // DEPRECATED: mantido para compatibilidade, mas não é mais usado
        // A lógica de filtro agora está em analyzeData() usando getPeriodDates()
        applyPeriodFilter() {
            // Não faz nada - lógica movida para analyzeData()
            return;
        },

        // Texto para exibição do período selecionado
        getDateRangeDisplayText() {
            if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
                const formatDate = (d) => {
                    const date = new Date(d);
                    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                };
                return `${formatDate(this.customDateRange.start)} → ${formatDate(this.customDateRange.end)}`;
            }
            return 'Personalizado';
        },

        // Texto informativo do período
        getPeriodInfoText() {
            if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
                const diffTime = Math.abs(this.customDateRange.end - this.customDateRange.start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return `${diffDays} dias selecionados`;
            }

            const labels = {
                '7': 'Últimos 7 dias',
                '30': 'Últimos 30 dias',
                '90': 'Últimos 90 dias',
                '365': 'Último ano',
                'all': 'Todo o período'
            };
            return labels[this.periodFilter] || 'Período selecionado';
        },

        // Abrir Date Range Picker - Usa o picker visual unificado
        openDateRangePicker() {
            const existing = document.getElementById('biDatePickerModal');
            if (existing) { existing.remove(); return; }

            const btn = document.getElementById('biDateRangeBtn');
            if (!btn) return;

            const modal = document.createElement('div');
            modal.id = 'biDatePickerModal';
            modal.style.cssText = `
            position: absolute;
            z-index: 10001;
            background: #1e1e2e;
            border: 1px solid #3f3f46;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            min-width: 340px;
        `;

            const picker = window.dateRangePicker || new DateRangePicker();
            picker.currentMonth = new Date();
            if (this.customDateRange.start) picker.startDate = new Date(this.customDateRange.start);
            if (this.customDateRange.end) picker.endDate = new Date(this.customDateRange.end);
            picker.anchorDate = null;

            const self = this;

            const renderModal = () => {
                const year = picker.currentMonth.getFullYear();
                const month = picker.currentMonth.getMonth();

                modal.innerHTML = `
                <h4 style="color: white; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">📅 Selecionar Período</h4>
                
                <!-- Atalhos rápidos -->
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <button class="bi-drp-quick" data-preset="7" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 7 dias</button>
                    <button class="bi-drp-quick" data-preset="30" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 30 dias</button>
                    <button class="bi-drp-quick" data-preset="90" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 90 dias</button>
                    <button class="bi-drp-quick" data-preset="thisMonth" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Este mês</button>
                    <button class="bi-drp-quick" data-preset="365" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Último ano</button>
                </div>
                
                <div style="border-top: 1px solid #3f3f46; padding-top: 1rem;">
                    <!-- Navegação do calendário -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <button class="bi-cal-nav" data-dir="-12" style="background:transparent;border:1px solid #3f3f46;color:#6b7280;padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.75rem;">◀◀</button>
                        <button class="bi-cal-nav" data-dir="-1" style="background:transparent;border:1px solid #3f3f46;color:#e4e4e7;padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;">◀</button>
                        <span style="color: white; font-weight: 600;">${picker.monthNames[month]} ${year}</span>
                        <button class="bi-cal-nav" data-dir="1" style="background:transparent;border:1px solid #3f3f46;color:#e4e4e7;padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;">▶</button>
                        <button class="bi-cal-nav" data-dir="12" style="background:transparent;border:1px solid #3f3f46;color:#6b7280;padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.75rem;">▶▶</button>
                    </div>
                    
                    <!-- Status -->
                    <div id="biDrpStatus" style="text-align:center;padding:0.5rem;background:#334155;border-radius:6px;margin-bottom:0.75rem;font-size:0.8rem;color:#94a3b8;">
                        ${getStatusText()}
                    </div>
                    
                    <!-- Dias da semana -->
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 0.5rem;">
                        ${picker.dayNames.map(d => `<div style="text-align:center;font-size:0.7rem;color:#6b7280;padding:0.25rem;">${d}</div>`).join('')}
                    </div>
                    
                    <!-- Grid de dias -->
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
                        ${renderDays(year, month)}
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #3f3f46;">
                    <button id="biDrpClear" style="padding:0.5rem 1rem;background:transparent;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;">Limpar</button>
                    <button id="biDrpCancel" style="padding:0.5rem 1rem;background:#334155;border:1px solid #475569;border-radius:6px;color:white;cursor:pointer;">Cancelar</button>
                    <button id="biDrpApply" style="padding:0.5rem 1rem;background:#3b82f6;border:none;border-radius:6px;color:white;cursor:pointer;font-weight:600;">Aplicar</button>
                </div>
            `;

                attachEvents();
            };

            function getStatusText() {
                if (picker.anchorDate) {
                    const d = picker.anchorDate.toLocaleDateString('pt-BR');
                    return `🎯 Âncora: ${d} — Clique em outro dia`;
                }
                if (picker.startDate && picker.endDate) {
                    const s = picker.startDate.toLocaleDateString('pt-BR');
                    const e = picker.endDate.toLocaleDateString('pt-BR');
                    const days = Math.ceil((picker.endDate - picker.startDate) / (1000 * 60 * 60 * 24)) + 1;
                    return `✅ ${s} → ${e} (${days} dias)`;
                }
                return '👆 Clique em um dia para iniciar';
            }

            function renderDays(year, month) {
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startPadding = firstDay.getDay();
                const totalDays = lastDay.getDate();
                const today = new Date(); today.setHours(0, 0, 0, 0);

                let html = '';
                for (let i = 0; i < startPadding; i++) html += `<div></div>`;

                for (let day = 1; day <= totalDays; day++) {
                    const date = new Date(year, month, day);
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = date.getTime() === today.getTime();
                    const isAnchor = picker.anchorDate && date.getTime() === picker.anchorDate.getTime();
                    const isStart = picker.startDate && date.getTime() === picker.startDate.getTime();
                    const isEnd = picker.endDate && date.getTime() === picker.endDate.getTime();
                    const isInRange = picker.startDate && picker.endDate && date >= picker.startDate && date <= picker.endDate;

                    let bg = 'transparent', color = '#e4e4e7', border = 'transparent';
                    if (isInRange) bg = 'rgba(59,130,246,0.2)';
                    if (isStart || isEnd) { bg = '#3b82f6'; color = 'white'; }
                    if (isAnchor) { bg = '#f59e0b'; color = 'white'; }
                    if (isToday) border = '#10b981';

                    html += `<div class="bi-cal-day" data-date="${dateStr}" style="
                    text-align:center;padding:0.4rem;cursor:pointer;border-radius:6px;
                    background:${bg};color:${color};border:2px solid ${border};
                    font-size:0.85rem;transition:all 0.1s;
                ">${day}</div>`;
                }
                return html;
            }

            function attachEvents() {
                // Navegação
                modal.querySelectorAll('.bi-cal-nav').forEach(nav => {
                    nav.onclick = (e) => {
                        e.stopPropagation();
                        picker.currentMonth.setMonth(picker.currentMonth.getMonth() + parseInt(nav.dataset.dir));
                        renderModal();
                    };
                });

                // Clique nos dias
                modal.querySelectorAll('.bi-cal-day').forEach(dayEl => {
                    dayEl.onclick = (e) => {
                        e.stopPropagation();
                        const date = new Date(dayEl.dataset.date + 'T00:00:00');

                        if (!picker.anchorDate) {
                            picker.anchorDate = date;
                            picker.startDate = null;
                            picker.endDate = null;
                        } else {
                            if (date < picker.anchorDate) {
                                picker.startDate = date;
                                picker.endDate = picker.anchorDate;
                            } else {
                                picker.startDate = picker.anchorDate;
                                picker.endDate = date;
                            }
                            picker.anchorDate = null;
                        }
                        renderModal();
                    };
                });

                // Atalhos rápidos
                modal.querySelectorAll('.bi-drp-quick').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const preset = btn.dataset.preset;
                        const today = new Date(); today.setHours(0, 0, 0, 0);

                        if (preset === 'thisMonth') {
                            picker.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                            picker.endDate = new Date(today);
                        } else {
                            const days = parseInt(preset);
                            picker.endDate = new Date(today);
                            picker.startDate = new Date(today);
                            picker.startDate.setDate(picker.startDate.getDate() - days + 1);
                        }
                        picker.anchorDate = null;
                        picker.currentMonth = new Date(picker.startDate);
                        renderModal();
                    };
                    btn.onmouseenter = () => { btn.style.borderColor = '#3b82f6'; btn.style.background = 'rgba(59,130,246,0.2)'; };
                    btn.onmouseleave = () => { btn.style.borderColor = '#475569'; btn.style.background = '#334155'; };
                });

                // Botões
                document.getElementById('biDrpClear').onclick = () => {
                    picker.startDate = null;
                    picker.endDate = null;
                    picker.anchorDate = null;
                    renderModal();
                };

                document.getElementById('biDrpCancel').onclick = () => modal.remove();

                document.getElementById('biDrpApply').onclick = () => {
                    if (picker.startDate && picker.endDate) {
                        self.setCustomDateRange(picker.startDate, picker.endDate);
                    }
                    modal.remove();
                };
            }

            document.body.appendChild(modal);

            // Posicionar (usando coordenadas do documento, não da viewport)
            const rect = btn.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;

            let top = rect.bottom + scrollY + 8;
            let left = rect.left + scrollX;

            const modalRect = modal.getBoundingClientRect();
            if (rect.bottom + modalRect.height + 8 > window.innerHeight) {
                top = Math.max(scrollY + 8, rect.top + scrollY - modalRect.height - 8);
            }
            if (rect.left + modalRect.width > window.innerWidth) {
                left = scrollX + window.innerWidth - modalRect.width - 16;
            }
            top = Math.max(scrollY + 8, top);
            left = Math.max(scrollX + 8, left);

            modal.style.top = `${top}px`;
            modal.style.left = `${left}px`;

            renderModal();

            // Fechar ao clicar fora
            setTimeout(() => {
                const closeHandler = (e) => {
                    if (!modal.contains(e.target) && e.target !== btn) {
                        modal.remove();
                        document.removeEventListener('click', closeHandler);
                    }
                };
                document.addEventListener('click', closeHandler);
            }, 100);
        },

        // Aplicar período personalizado do modal
        applyCustomDateRange() {
            const startInput = document.getElementById('biCustomStartDate');
            const endInput = document.getElementById('biCustomEndDate');

            if (startInput?.value && endInput?.value) {
                const start = new Date(startInput.value);
                const end = new Date(endInput.value);

                if (start > end) {
                    alert('A data de início deve ser anterior à data de fim.');
                    return;
                }

                this.setCustomDateRange(start, end);
            }

            document.getElementById('biDatePickerModal')?.remove();
        },

        // Atalhos rápidos de período
        setQuickDateRange(preset) {
            const today = new Date();
            let start, end;

            switch (preset) {
                case 'thisWeek':
                    start = new Date(today);
                    start.setDate(today.getDate() - today.getDay()); // Domingo
                    end = new Date(today);
                    break;
                case 'lastWeek':
                    start = new Date(today);
                    start.setDate(today.getDate() - today.getDay() - 7);
                    end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    break;
                case 'thisMonth':
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today);
                    break;
                case 'lastMonth':
                    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    end = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case 'last3Months':
                    start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                    end = new Date(today);
                    break;
            }

            // Atualizar inputs do modal
            const startInput = document.getElementById('biCustomStartDate');
            const endInput = document.getElementById('biCustomEndDate');

            if (startInput && endInput) {
                startInput.value = start.toISOString().split('T')[0];
                endInput.value = end.toISOString().split('T')[0];
            }
        },

        toggleEntity(entity) {
            if (this.selectedEntities.has(entity)) {
                this.selectedEntities.delete(entity);
            } else {
                this.selectedEntities.add(entity);
            }

            // Sincronizar com set da view atual
            this.syncSelections();
            this.updateEntityChips();

            // Atualizar análises se houver seleção
            if (this.selectedEntities.size > 0) {
                this.analyzeData();
            } else {
                const biContent = document.getElementById('biContent');
            if (biContent) biContent.innerHTML = this.renderEmptyState();
            }
        },

        selectAll() {
            const entities = this.currentView === 'pessoa' ? this.allPessoas : this.allTimes;
            this.selectedEntities = new Set(entities);
            this.syncSelections();
            this.updateEntityChips();
            this.analyzeData();
        },

        clearSelection() {
            this.selectedEntities.clear();
            this.syncSelections();
            this.updateEntityChips();
            const biContent = document.getElementById('biContent');
            if (biContent) biContent.innerHTML = this.renderEmptyState();
        },

        // Sincronizar seleções com o set da view atual
        syncSelections() {
            if (this.currentView === 'pessoa') {
                this.selectedPessoas = new Set(this.selectedEntities);
            } else if (this.currentView === 'time') {
                this.selectedTimes = new Set(this.selectedEntities);
            }
        },

        // Tooltip helpers (shared by all charts)
        getTooltipEl() {
            let el = document.getElementById('biTooltip');
            if (!el) {
                el = document.createElement('div');
                el.id = 'biTooltip';
                el.className = 'bi-tooltip';
                document.body.appendChild(el);
            }
            return el;
        },
        showTooltip(clientX, clientY, html) {
            const el = this.getTooltipEl();
            el.innerHTML = html;
            el.style.display = 'block';
            const pad = 12;
            el.style.left = (clientX + pad) + 'px';
            el.style.top = (clientY + pad) + 'px';
        },
        hideTooltip() {
            const el = this.getTooltipEl();
            el.style.display = 'none';
        },
        setupCanvasTooltip(canvas, regions, getContent, onHoverChange, onClick) {
            // regions: [{ contains:(mx,my)=>bool, data:any }]
            canvas._regions = regions || [];

            // CORREÇÃO MEMORY LEAK: Remover handlers antigos antes de adicionar novos
            if (canvas._biHandlers) {
                canvas.removeEventListener('mousemove', canvas._biHandlers.move);
                canvas.removeEventListener('mouseleave', canvas._biHandlers.leave);
                canvas.removeEventListener('click', canvas._biHandlers.click);
            }

            const self = this;
            const handleMove = (e) => {
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                let hit = null;
                for (const r of canvas._regions) {
                    try {
                        if (r.contains(mx, my)) { hit = r; break; }
                    } catch { }
                }
                if (hit) {
                    canvas.style.cursor = 'pointer';
                    const html = getContent ? getContent(hit.data) : `${hit.data.label}: ${hit.data.value}`;
                    if (html) self.showTooltip(e.clientX, e.clientY, html);
                    else self.hideTooltip();
                    if (onHoverChange && !hit.data.action) { // Não hover em botões
                        const key = hit && hit.data ? (hit.data.key ?? hit.data.index ?? hit.data.label) : null;
                        if (canvas._hoverKey !== key) {
                            canvas._hoverKey = key;
                            onHoverChange(hit);
                        }
                    }
                } else {
                    canvas.style.cursor = 'default';
                    self.hideTooltip();
                    if (onHoverChange && canvas._hoverKey !== null) {
                        canvas._hoverKey = null;
                        onHoverChange(null);
                    }
                }
            };
            const handleLeave = () => {
                canvas.style.cursor = 'default';
                self.hideTooltip();
                if (onHoverChange && canvas._hoverKey !== null) {
                    canvas._hoverKey = null;
                    onHoverChange(null);
                }
            };
            const handleClick = (e) => {
                if (!onClick) return;
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                let hit = null;
                for (const r of canvas._regions) {
                    try {
                        if (r.contains(mx, my)) { hit = r; break; }
                    } catch { }
                }
                if (hit) onClick(hit);
            };

            // Armazenar referências para poder remover depois
            canvas._biHandlers = { move: handleMove, leave: handleLeave, click: handleClick };

            canvas.addEventListener('mousemove', handleMove);
            canvas.addEventListener('mouseleave', handleLeave);
            canvas.addEventListener('click', handleClick);
        },

        updateEntityChips() {
            const grid = document.getElementById('entitiesGrid');
            if (grid) {
                grid.innerHTML = this.renderEntityChips();
            }

            // Atualizar contador
            const counters = document.querySelectorAll('.bi-selector-container span');
            counters.forEach(counter => {
                if (counter.textContent.includes('selecionado')) {
                    counter.textContent = this.selectedEntities.size + ' selecionado(s)';
                }
            });
        },

        filterEntities(searchTerm) {
            const entities = this.currentView === 'pessoa' ?
                Array.from(this.allPessoas) :
                Array.from(this.allTimes);

            const filtered = entities.filter(e =>
                e.toLowerCase().includes(searchTerm.toLowerCase())
            );

            const grid = document.getElementById('entitiesGrid');
            if (grid) {
                grid.innerHTML = filtered.map(entity => `
                <div class="bi-entity-chip ${this.selectedEntities.has(entity) ? 'selected' : ''}"
                     onclick="window.biAnalytics.toggleEntity('${entity.replace(/'/g, "\\'")}')"
                     title="${entity}">
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${entity}
                    </div>
                </div>
            `).join('');
            }
        },

        switchView(view) {
            // Salvar seleções da view atual antes de trocar
            if (this.currentView === 'pessoa') {
                this.selectedPessoas = new Set(this.selectedEntities);
            } else if (this.currentView === 'time') {
                this.selectedTimes = new Set(this.selectedEntities);
            }

            this.currentView = view;

            // Restaurar seleções da nova view
            if (view === 'pessoa') {
                this.selectedEntities = new Set(this.selectedPessoas);
            } else if (view === 'time') {
                this.selectedEntities = new Set(this.selectedTimes);
            } else {
                this.selectedEntities.clear();
            }

            this.render();

            // Se há seleções restauradas, re-analisar dados
            if (this.selectedEntities.size > 0) {
                setTimeout(() => this.analyzeData(), 100);
            }
        },

        applyFilters() {
            if (this.selectedEntities.size === 0) {
                alert('Por favor, selecione pelo menos uma ' +
                    (this.currentView === 'pessoa' ? 'pessoa' : 'time'));
                return;
            }

            // Reset paginação ao aplicar filtros
            this.pagination.top10.page = 0;
            this.pagination.slaByEntity.page = 0;
            if (this.pagination.slaResolutionByEntity) this.pagination.slaResolutionByEntity.page = 0;
            if (this.pagination.slaCountByEntity) this.pagination.slaCountByEntity.page = 0;

            this.analyzeData();
        },

        analyzeData() {
            // ========== DIAGNÓSTICO DE DADOS ==========
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 DIAGNÓSTICO BI ANALYTICS - analyzeData()');
            console.log('═══════════════════════════════════════════════════════');
            console.log(`📊 ticketsData (fonte): ${this.ticketsData?.length || 0} tickets`);
            console.log(`📊 window.allTicketsCache: ${window.allTicketsCache?.length || 0} tickets`);
            console.log(`📊 Período selecionado: ${this.periodFilter}`);
            console.log(`📊 Entidades selecionadas: ${this.selectedEntities.size} (${Array.from(this.selectedEntities).join(', ')})`);
            console.log(`📊 View atual: ${this.currentView}`);

            // Verificar se ticketsData está atualizado
            if (this.ticketsData?.length !== window.allTicketsCache?.length) {
                console.warn(`⚠️ DISCREPÂNCIA: ticketsData (${this.ticketsData?.length}) != allTicketsCache (${window.allTicketsCache?.length})`);
                console.log('🔄 Atualizando ticketsData com allTicketsCache...');
                this.ticketsData = window.allTicketsCache || [];
            }

            // NOVA LÓGICA: Separar tickets ATRIBUÍDOS de RESOLVIDOS
            // Um ticket é ATRIBUÍDO quando cf_tratativa contém a pessoa
            // Um ticket é RESOLVIDO quando cf_tratativa contém a pessoa E status é fechado (4 ou 5)

            // Helper para verificar se ticket pertence a uma pessoa selecionada
            const ticketBelongsToSelected = (ticket) => {
                if (this.currentView === 'pessoa') {
                    // IMPORTANTE: Usar APENAS cf_tratativa para pessoas (não responder_name)
                    // Isso garante que só conta tickets onde a pessoa realmente trabalhou
                    const tratativa = ticket.cf_tratativa;
                    if (!tratativa) return false;

                    // Normalizar nomes do ticket e comparar com selecionados
                    const pessoas = tratativa.split(/[,;\/]/).map(p => this.normalizePersonName(p)).filter(p => p);
                    return pessoas.some(p => {
                        // Verificar se o nome normalizado está no set de selecionados (assumindo que selecionados já estão normalizados ou comparar raw)
                        // Na verdade, this.selectedEntities guarda o nome como aparece no chip.
                        // Idealmente, normalizamos ambos os lados.
                        for (let selected of this.selectedEntities) {
                            if (this.normalizePersonName(selected) === p) return true;
                        }
                        return false;
                    });
                } else {
                    // Para times, usa cf_grupo_tratativa
                    const grupoTratativa = ticket.cf_grupo_tratativa;
                    if (!grupoTratativa) return false;
                    const times = grupoTratativa.split(/[,;\/]/).map(t => t.trim()).filter(t => t);
                    return times.some(t => this.selectedEntities.has(t));
                }
            };

            // Helper para verificar se ticket está fechado/resolvido
            const isResolved = (ticket) => {
                const status = Number(ticket.status);
                return status === 4 || status === 5; // Resolvido ou Fechado
            };

            // Obter datas do período selecionado
            const { startDate, endDate } = this.getPeriodDates();

            // Helper para verificar se ticket foi RESOLVIDO no período
            const resolvedInPeriod = (ticket) => {
                if (!isResolved(ticket)) return false;
                if (!startDate || !endDate) return true; // Sem filtro de período

                // Usar stats_resolved_at, stats_closed_at ou updated_at para data de resolução
                // IMPORTANTE: updated_at é o fallback mais confiável para tickets resolvidos
                const resolvedAt = ticket.stats_resolved_at || ticket.stats_closed_at || ticket.updated_at;
                if (!resolvedAt) return false;

                const resolvedDate = new Date(resolvedAt);
                return resolvedDate >= startDate && resolvedDate <= endDate;
            };

            // Helper para verificar se ticket foi CRIADO no período
            const createdInPeriod = (ticket) => {
                if (!startDate || !endDate) return true;
                if (!ticket.created_at) return false;
                const createdDate = new Date(ticket.created_at);
                return createdDate >= startDate && createdDate <= endDate;
            };

            // Helper para verificar se ticket teve TRABALHO REAL no período
            // Inclui: criado no período, resolvido no período, ou atualizado no período (se tem tratativa)
            const activeInPeriod = (ticket) => {
                if (!startDate || !endDate) return true;

                // Criado no período - ticket novo atribuído
                if (ticket.created_at) {
                    const createdDate = new Date(ticket.created_at);
                    if (createdDate >= startDate && createdDate <= endDate) return true;
                }

                // Resolvido no período - trabalho efetivo de resolução
                // IMPORTANTE: Usar updated_at como fallback se stats_resolved_at não existir
                // Para tickets com status 4 ou 5, updated_at geralmente é a data de resolução
                const status = Number(ticket.status);
                const isResolvedStatus = status === 4 || status === 5;

                const resolvedAt = ticket.stats_resolved_at || ticket.stats_closed_at ||
                    (isResolvedStatus ? ticket.updated_at : null);

                if (resolvedAt) {
                    const resolvedDate = new Date(resolvedAt);
                    if (resolvedDate >= startDate && resolvedDate <= endDate) return true;
                }

                // Para tickets não resolvidos com tratativa, verificar se foi atualizado no período
                // Isso captura trabalho em andamento (mudanças de status, respostas, etc.)
                if (!isResolvedStatus && ticket.updated_at) {
                    const updatedDate = new Date(ticket.updated_at);
                    if (updatedDate >= startDate && updatedDate <= endDate) return true;
                }

                return false;
            };

            // TODOS os tickets atribuídos às pessoas selecionadas (independente de período)
            this.allAssignedTickets = this.ticketsData.filter(ticketBelongsToSelected);

            // DEBUG: Log detalhado dos tickets atribuídos
            console.log(`📊 Tickets atribuídos às entidades selecionadas: ${this.allAssignedTickets.length}`);

            // Verificar distribuição por pessoa
            if (this.currentView === 'pessoa') {
                const countByPerson = {};
                this.ticketsData.forEach(t => {
                    if (t.cf_tratativa) {
                        t.cf_tratativa.split(/[,;\/]/).map(p => p.trim()).filter(p => p).forEach(p => {
                            countByPerson[p] = (countByPerson[p] || 0) + 1;
                        });
                    }
                });
                console.log('📊 Total de tickets por pessoa (cf_tratativa):');
                Object.entries(countByPerson).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([p, c]) => {
                    console.log(`   ${p}: ${c} tickets`);
                });
            }

            // Tickets RESOLVIDOS pelas pessoas no período selecionado
            this.resolvedInPeriod = this.allAssignedTickets.filter(resolvedInPeriod);

            // Tickets com ATIVIDADE no período (para KPIs e gráficos)
            // Isso inclui tickets criados, atualizados ou resolvidos no período
            this.createdInPeriod = this.allAssignedTickets.filter(activeInPeriod);

            // filteredData = tickets com atividade no período
            this.filteredData = this.createdInPeriod;

            // Calcular backlog (atribuídos mas não resolvidos)
            this.backlogTickets = this.allAssignedTickets.filter(t => !isResolved(t));

            // ========== ANÁLISE HERDADOS vs NOVOS ==========
            // Tickets NOVOS = criados dentro do período selecionado
            this.newTicketsInPeriod = this.allAssignedTickets.filter(createdInPeriod);

            // DEBUG: Log detalhado para identificar o problema
            if (startDate && endDate) {
                console.log(`🔍 DEBUG newTicketsInPeriod:`);
                console.log(`   Total allAssignedTickets: ${this.allAssignedTickets.length}`);
                console.log(`   startDate: ${startDate.toISOString()}`);
                console.log(`   endDate: ${endDate.toISOString()}`);

                // Verificar sample de tickets
                const sample = this.allAssignedTickets.slice(0, 5);
                sample.forEach((t, i) => {
                    const cd = t.created_at ? new Date(t.created_at) : null;
                    const inPeriod = cd ? (cd >= startDate && cd <= endDate) : false;
                    console.log(`   Ticket ${i}: id=${t.id}, created_at=${t.created_at}, parsed=${cd?.toISOString()}, inPeriod=${inPeriod}`);
                });

                // Verificar se há tickets com datas recentes
                const recentTickets = this.allAssignedTickets.filter(t => {
                    if (!t.created_at) return false;
                    const d = new Date(t.created_at);
                    return d.getFullYear() >= 2026;
                });
                console.log(`   Tickets criados em 2026+: ${recentTickets.length}`);
                if (recentTickets.length > 0) {
                    console.log(`   Exemplo:`, recentTickets[0]);
                }
            }

            // Tickets HERDADOS = criados ANTES do período E que:
            // - Ainda estão em ABERTO (backlog), OU
            // - Foram RESOLVIDOS DURANTE o período
            // NÃO incluir tickets que já estavam fechados antes do período
            this.inheritedTickets = this.allAssignedTickets.filter(t => {
                if (!startDate || !endDate) return false;
                if (!t.created_at) return false;
                const createdDate = new Date(t.created_at);
                if (createdDate >= startDate) return false; // Não é herdado se foi criado no período

                // Se ainda está aberto, é herdado (backlog)
                if (!isResolved(t)) return true;

                // Se está resolvido, só conta se foi resolvido DURANTE o período
                const resolvedAt = t.stats_resolved_at || t.stats_closed_at || t.updated_at;
                if (!resolvedAt) return false;
                const resolvedDate = new Date(resolvedAt);
                return resolvedDate >= startDate && resolvedDate <= endDate;
            });

            // Resolvidos que eram NOVOS (criados e resolvidos no mesmo período)
            this.resolvedNewTickets = this.resolvedInPeriod.filter(createdInPeriod);

            // Resolvidos que eram HERDADOS (criados antes, resolvidos no período)
            this.resolvedInheritedTickets = this.resolvedInPeriod.filter(t => {
                if (!startDate || !endDate) return false;
                if (!t.created_at) return false;
                const createdDate = new Date(t.created_at);
                return createdDate < startDate;
            });

            // Herdados ainda em ABERTO (backlog herdado)
            this.openInheritedTickets = this.inheritedTickets.filter(t => !isResolved(t));

            // Taxa de absorção = % de tickets novos que foram resolvidos no próprio período
            this.absorptionRate = this.newTicketsInPeriod.length > 0
                ? (this.resolvedNewTickets.length / this.newTicketsInPeriod.length) * 100
                : 0;

            console.log(`📊 Análise de ${this.selectedEntities.size} entidade(s) [Período: ${this.periodFilter}]:`);
            console.log(`   🗓️ Período: ${startDate ? startDate.toISOString() : 'null'} até ${endDate ? endDate.toISOString() : 'null'}`);
            console.log(`   📋 Total atribuídos (histórico): ${this.allAssignedTickets.length}`);
            console.log(`   ✅ Resolvidos no período: ${this.resolvedInPeriod.length}`);
            console.log(`   📥 Com atividade no período: ${this.createdInPeriod.length}`);
            console.log(`   ⏳ Backlog (não resolvidos): ${this.backlogTickets.length}`);
            console.log(`   --- Análise Herdados vs Novos ---`);
            console.log(`   📥 Novos no período: ${this.newTicketsInPeriod.length}`);
            console.log(`   📦 Herdados (carryover): ${this.inheritedTickets.length}`);
            console.log(`   ✅ Resolvidos - Novos: ${this.resolvedNewTickets.length}`);
            console.log(`   ✅ Resolvidos - Herdados: ${this.resolvedInheritedTickets.length}`);
            console.log(`   📈 Taxa de Absorção: ${this.absorptionRate.toFixed(1)}%`);

            // DEBUG: Verificar se há tickets com created_at no período
            if (this.newTicketsInPeriod.length === 0 && startDate && endDate) {
                console.warn('⚠️ DEBUG: Nenhum ticket novo encontrado. Verificando dados...');
                const ticketsComData = this.allAssignedTickets.filter(t => t.created_at);
                console.log(`   Tickets com created_at: ${ticketsComData.length}`);
                if (ticketsComData.length > 0) {
                    const datas = ticketsComData.map(t => new Date(t.created_at)).sort((a, b) => b - a);
                    console.log(`   Data mais recente: ${datas[0].toISOString()}`);
                    console.log(`   Data mais antiga: ${datas[datas.length - 1].toISOString()}`);
                    // Verificar quantos estão dentro do período
                    const dentroPeríodo = ticketsComData.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= startDate && d <= endDate;
                    });
                    console.log(`   Tickets com created_at DENTRO do período: ${dentroPeríodo.length}`);
                    if (dentroPeríodo.length > 0) {
                        console.log('   Exemplos:', dentroPeríodo.slice(0, 3).map(t => ({ id: t.id, created_at: t.created_at, cf_tratativa: t.cf_tratativa })));
                    }
                }
            }

            // Mostrar aviso se não há dados
            if (this.resolvedInPeriod.length === 0 && this.allAssignedTickets.length === 0) {
                console.warn(`⚠️ Nenhum ticket com tratativa encontrado para as entidades selecionadas`);
            }

            // Renderizar análises
            const content = document.getElementById('biContent');
            if (content) {
                content.innerHTML = this.renderAnalytics();

                // Renderizar gráficos após DOM estar pronto
                setTimeout(() => {
                    const metrics = this.calculateMetrics();
                    this.renderCharts(metrics);
                }, 100);
            }

            // Atualizar timestamp
            this.updateLastUpdateTime();
        },

        // Obter datas do período selecionado
        getPeriodDates() {
            if (this.periodFilter === 'all') {
                return { startDate: null, endDate: null };
            }

            let startDate, endDate;

            if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
                startDate = new Date(this.customDateRange.start);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(this.customDateRange.end);
                endDate.setHours(23, 59, 59, 999);
            } else {
                const days = parseInt(this.periodFilter);
                if (isNaN(days)) return { startDate: null, endDate: null };

                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                startDate.setHours(0, 0, 0, 0);
            }

            return { startDate, endDate };
        },

        // Atualizar indicador de última atualização
        updateLastUpdateTime() {
            const el = document.getElementById('biLastUpdate');
            if (el) {
                const now = new Date();
                el.textContent = `🕐 Atualizado: ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            }
        },

        // Função de diagnóstico - execute window.biAnalytics.diagnostico() no console
        diagnostico() {
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 DIAGNÓSTICO COMPLETO DO BI ANALYTICS');
            console.log('═══════════════════════════════════════════════════════');

            // 1. Verificar fontes de dados
            console.log('\n📦 FONTES DE DADOS:');
            console.log(`   window.allTicketsCache: ${window.allTicketsCache?.length || 0} tickets`);
            console.log(`   this.ticketsData: ${this.ticketsData?.length || 0} tickets`);
            console.log(`   this.filteredData: ${this.filteredData?.length || 0} tickets`);
            console.log(`   this.allAssignedTickets: ${this.allAssignedTickets?.length || 0} tickets`);

            // 2. Verificar configurações
            console.log('\n⚙️ CONFIGURAÇÕES:');
            console.log(`   Período: ${this.periodFilter}`);
            console.log(`   View: ${this.currentView}`);
            console.log(`   Entidades selecionadas: ${this.selectedEntities.size}`);
            if (this.selectedEntities.size > 0) {
                console.log(`   Lista: ${Array.from(this.selectedEntities).join(', ')}`);
            }

            // 3. Verificar distribuição de cf_tratativa
            console.log('\n👥 DISTRIBUIÇÃO POR cf_tratativa (top 15):');
            const countByPerson = {};
            const ticketsComTratativa = [];
            const ticketsSemTratativa = [];

            (window.allTicketsCache || []).forEach(t => {
                if (t.cf_tratativa && t.cf_tratativa.trim()) {
                    ticketsComTratativa.push(t);
                    t.cf_tratativa.split(/[,;\/]/).map(p => p.trim()).filter(p => p).forEach(p => {
                        countByPerson[p] = (countByPerson[p] || 0) + 1;
                    });
                } else {
                    ticketsSemTratativa.push(t);
                }
            });

            console.log(`   Tickets COM cf_tratativa: ${ticketsComTratativa.length}`);
            console.log(`   Tickets SEM cf_tratativa: ${ticketsSemTratativa.length}`);

            Object.entries(countByPerson)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .forEach(([p, c]) => {
                    console.log(`   ${p}: ${c} tickets`);
                });

            // 4. Verificar datas dos tickets
            console.log('\n📅 DATAS DOS TICKETS:');
            const ticketsComData = (window.allTicketsCache || []).filter(t => t.created_at);
            if (ticketsComData.length > 0) {
                const datas = ticketsComData.map(t => new Date(t.created_at)).sort((a, b) => b - a);
                console.log(`   Mais recente: ${datas[0].toISOString()}`);
                console.log(`   Mais antigo: ${datas[datas.length - 1].toISOString()}`);

                // Contar por ano
                const porAno = {};
                ticketsComData.forEach(t => {
                    const ano = new Date(t.created_at).getFullYear();
                    porAno[ano] = (porAno[ano] || 0) + 1;
                });
                console.log('   Por ano:', porAno);
            }

            // 5. Verificar status
            console.log('\n📊 DISTRIBUIÇÃO POR STATUS:');
            const porStatus = {};
            (window.allTicketsCache || []).forEach(t => {
                const s = t.status || 'null';
                porStatus[s] = (porStatus[s] || 0) + 1;
            });
            Object.entries(porStatus).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
                const label = window.FRESHDESK_STATUS?.getLabel(Number(s)) || s;
                console.log(`   Status ${s} (${label}): ${c} tickets`);
            });

            console.log('\n═══════════════════════════════════════════════════════');
            console.log('💡 Para forçar atualização: window.biAnalytics.forceRefresh()');
            console.log('═══════════════════════════════════════════════════════');

            return {
                totalCache: window.allTicketsCache?.length || 0,
                ticketsData: this.ticketsData?.length || 0,
                filteredData: this.filteredData?.length || 0,
                comTratativa: ticketsComTratativa.length,
                semTratativa: ticketsSemTratativa.length,
                distribuicao: countByPerson
            };
        },

        // Força atualização completa dos dados
        forceRefresh() {
            console.log('🔄 Forçando atualização completa...');
            this.ticketsData = window.allTicketsCache || [];
            console.log(`📊 ticketsData atualizado: ${this.ticketsData.length} tickets`);
            this.extractEntities();
            if (this.selectedEntities.size > 0) {
                this.analyzeData();
            }
            console.log('✅ Atualização completa!');
        },

        // Função de refresh completa
        async refreshData() {
            const statusEl = document.getElementById('biSyncStatus');
            const updateEl = document.getElementById('biLastUpdate');

            if (statusEl) statusEl.innerHTML = '<span style="color: #f59e0b;">⏳ Atualizando dados...</span>';
            if (updateEl) updateEl.textContent = '🔄 Atualizando...';

            try {
                // Limpar cache do módulo CSAT
                if (window.BICSATModule) {
                    window.BICSATModule._csatCache = null;
                    window.BICSATModule._timeEntriesCache = null;
                    window.BICSATModule._cacheTime = null;
                }

                // Recarregar dados do Supabase
                if (window.loadTicketsFromSupabase) {
                    await window.loadTicketsFromSupabase();
                } else if (window.allTicketsCache) {
                    // Se tem cache, atualizar o ticketsData
                    this.ticketsData = window.allTicketsCache;
                    this.extractEntities();
                }

                // Re-analisar dados
                if (this.selectedEntities.size > 0) {
                    this.analyzeData();
                } else {
                    this.render();
                }

                if (statusEl) statusEl.innerHTML = '<span style="color: #10b981;">✅ Dados atualizados!</span>';
                setTimeout(() => { if (statusEl) statusEl.innerHTML = ''; }, 3000);

            } catch (error) {
                console.error('❌ Erro ao atualizar dados:', error);
                if (statusEl) statusEl.innerHTML = `<span style="color: #ef4444;">❌ Erro: ${error.message}</span>`;
            }
        },

        calculateMetrics() {
            const entityMap = new Map();

            // Helper para obter campo tratativa
            const getTratativa = (ticket) => {
                if (this.currentView === 'pessoa') {
                    return ticket.cf_tratativa || '';
                } else {
                    return ticket.cf_grupo_tratativa || '';
                }
            };

            // Processar tickets CRIADOS NO PERÍODO (para métricas que refletem o período)
            (this.createdInPeriod || []).forEach(ticket => {
                const entityField = getTratativa(ticket);
                let entities = [];

                if (this.currentView === 'pessoa') {
                    entities = entityField ? entityField.split(/[,;\/]/).map(e => this.normalizePersonName(e)).filter(e => e) : [];
                } else {
                    entities = entityField ? entityField.split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                }

                entities.forEach(entity => {
                    // Normalizar também a verificação com selectedEntities
                    let isSelected = false;
                    let selectedName = entity; // Nome a ser usado como chave no mapa

                    if (this.currentView === 'pessoa') {
                        for (let s of this.selectedEntities) {
                            if (this.normalizePersonName(s) === entity) {
                                isSelected = true;
                                selectedName = s; // Usar o nome do filtro como chave para consistência visual
                                break;
                            }
                        }
                    } else {
                        isSelected = this.selectedEntities.has(entity);
                    }

                    if (isSelected) {
                        if (!entityMap.has(selectedName)) {
                            entityMap.set(selectedName, {
                                assigned: 0,           // Total atribuídos
                                resolved: 0,           // Resolvidos (status 4 ou 5)
                                resolvedInPeriod: 0,   // Resolvidos NO PERÍODO
                                newInPeriod: 0,        // Novos criados no período
                                inherited: 0,          // Herdados (criados antes)
                                inheritedOpen: 0,      // Herdados ainda em aberto
                                resolvedNew: 0,        // Novos resolvidos
                                resolvedInherited: 0,  // Herdados resolvidos
                                open: 0,
                                pending: 0,
                                inProgress: 0,
                                avgTime: [],
                                priorities: { low: 0, medium: 0, high: 0, urgent: 0 }
                            });
                        }

                        const data = entityMap.get(entity);
                        data.assigned++;

                        const status = Number(ticket.status);

                        // Contagem por status
                        if (status === 4 || status === 5) {
                            data.resolved++;
                        } else if (status === 2) {
                            data.open++;
                        } else if (status === 3) {
                            data.pending++;
                        } else {
                            data.inProgress++;
                        }

                        // Prioridade
                        const priority = ticket.priority || 1;
                        if (priority === 1) data.priorities.low++;
                        else if (priority === 2) data.priorities.medium++;
                        else if (priority === 3) data.priorities.high++;
                        else if (priority === 4) data.priorities.urgent++;
                    }
                });
            });

            // Processar tickets RESOLVIDOS NO PERÍODO (para métricas de produtividade)
            (this.resolvedInPeriod || []).forEach(ticket => {
                const entityField = getTratativa(ticket);
                let entities = [];

                if (this.currentView === 'pessoa') {
                    entities = entityField ? entityField.split(/[,;\/]/).map(e => this.normalizePersonName(e)).filter(e => e) : [];
                } else {
                    entities = entityField ? entityField.split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                }

                entities.forEach(entity => {
                    let isSelected = false;
                    let selectedName = entity;

                    if (this.currentView === 'pessoa') {
                        for (let s of this.selectedEntities) {
                            if (this.normalizePersonName(s) === entity) {
                                isSelected = true;
                                selectedName = s;
                                break;
                            }
                        }
                    } else {
                        isSelected = this.selectedEntities.has(entity);
                    }

                    if (isSelected && entityMap.has(selectedName)) {
                        const data = entityMap.get(selectedName);
                        data.resolvedInPeriod++;

                        // Tempo de resolução
                        const resolvedAt = ticket.stats_resolved_at || ticket.stats_closed_at;
                        if (ticket.created_at && resolvedAt) {
                            const created = new Date(ticket.created_at);
                            const resolved = new Date(resolvedAt);
                            const hours = (resolved - created) / (1000 * 60 * 60);
                            if (hours > 0 && hours < 10000) {
                                data.avgTime.push(hours);
                            }
                        }
                    }
                });
            });

            // Processar tickets HERDADOS (criados antes do período) por entidade
            const { startDate } = this.getPeriodDates();
            if (startDate) {
                // Herdados em aberto
                (this.openInheritedTickets || []).forEach(ticket => {
                    const entityField = getTratativa(ticket);
                    let entities = [];
                    if (this.currentView === 'pessoa') {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => this.normalizePersonName(e)).filter(e => e) : [];
                    } else {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                    }

                    entities.forEach(entity => {
                        let selectedName = entity;
                        if (this.currentView === 'pessoa') {
                            for (let s of this.selectedEntities) {
                                if (this.normalizePersonName(s) === entity) {
                                    selectedName = s;
                                    break;
                                }
                            }
                        }

                        if (entityMap.has(selectedName)) {
                            entityMap.get(selectedName).inheritedOpen++;
                            entityMap.get(selectedName).inherited++;
                        }
                    });
                });

                // Novos no período
                (this.newTicketsInPeriod || []).forEach(ticket => {
                    const entityField = getTratativa(ticket);
                    let entities = [];
                    if (this.currentView === 'pessoa') {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => this.normalizePersonName(e)).filter(e => e) : [];
                    } else {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                    }

                    entities.forEach(entity => {
                        let selectedName = entity;
                        if (this.currentView === 'pessoa') {
                            for (let s of this.selectedEntities) {
                                if (this.normalizePersonName(s) === entity) {
                                    selectedName = s;
                                    break;
                                }
                            }
                        }

                        if (entityMap.has(selectedName)) {
                            entityMap.get(selectedName).newInPeriod++;
                        }
                    });
                });

                // Novos resolvidos
                (this.resolvedNewTickets || []).forEach(ticket => {
                    const entityField = getTratativa(ticket);
                    let entities = [];
                    if (this.currentView === 'pessoa') {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => this.normalizePersonName(e)).filter(e => e) : [];
                    } else {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                    }

                    entities.forEach(entity => {
                        let selectedName = entity;
                        if (this.currentView === 'pessoa') {
                            for (let s of this.selectedEntities) {
                                if (this.normalizePersonName(s) === entity) {
                                    selectedName = s;
                                    break;
                                }
                            }
                        }

                        if (entityMap.has(selectedName)) {
                            entityMap.get(selectedName).resolvedNew++;
                        }
                    });
                });

                // Herdados resolvidos
                (this.resolvedInheritedTickets || []).forEach(ticket => {
                    const entityField = getTratativa(ticket);
                    let entities = [];
                    if (this.currentView === 'pessoa') {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => this.normalizePersonName(e)).filter(e => e) : [];
                    } else {
                        entities = entityField ? entityField.split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                    }

                    entities.forEach(entity => {
                        let selectedName = entity;
                        if (this.currentView === 'pessoa') {
                            for (let s of this.selectedEntities) {
                                if (this.normalizePersonName(s) === entity) {
                                    selectedName = s;
                                    break;
                                }
                            }
                        }

                        if (entityMap.has(selectedName)) {
                            entityMap.get(selectedName).resolvedInherited++;
                            entityMap.get(selectedName).inherited++;
                        }
                    });
                });
            }

            // Calcular métricas derivadas
            entityMap.forEach((data, entity) => {
                const avgHours = data.avgTime.length > 0 ?
                    data.avgTime.reduce((a, b) => a + b, 0) / data.avgTime.length : 0;
                data.avgTimeHours = Math.round(avgHours);

                // Taxa de resolução simples = resolvidos / atribuídos
                data.resolutionRate = data.assigned > 0 ? (data.resolved / data.assigned * 100).toFixed(1) : 0;

                // ========== TAXA DE RESOLUÇÃO REAL ==========
                // Demanda total = herdados em aberto + novos no período
                const totalDemanda = data.inheritedOpen + data.newInPeriod;
                const totalResolvidos = data.resolvedNew + data.resolvedInherited;
                data.realResolutionRate = totalDemanda > 0
                    ? (totalResolvidos / totalDemanda * 100).toFixed(1)
                    : data.resolutionRate; // Fallback para taxa simples
                data.totalDemanda = totalDemanda;
                data.totalResolvidos = totalResolvidos;

                // Backlog = atribuídos - resolvidos
                data.backlog = data.assigned - data.resolved;

                // Para compatibilidade, total = assigned
                data.total = data.assigned;
            });

            // Métricas globais - FILTRADAS pelo período selecionado
            // Usar createdInPeriod para que os KPIs reflitam o período
            const ticketsNoPeriodo = this.createdInPeriod || [];

            const totalAssigned = ticketsNoPeriodo.length;
            const totalResolvedAll = ticketsNoPeriodo.filter(t => {
                const s = Number(t.status);
                return s === 4 || s === 5;
            }).length;
            const resolvedInPeriodCount = (this.resolvedInPeriod || []).length;

            // Backlog = tickets do período que ainda não foram resolvidos
            const backlogNoPeriodo = ticketsNoPeriodo.filter(t => {
                const s = Number(t.status);
                return s !== 4 && s !== 5;
            });
            const backlogCount = backlogNoPeriodo.length;

            // Contagem por status (do período)
            const openTickets = ticketsNoPeriodo.filter(t => Number(t.status) === 2).length;
            const pendingTickets = ticketsNoPeriodo.filter(t => Number(t.status) === 3).length;
            const inProgressTickets = ticketsNoPeriodo.filter(t => ![2, 3, 4, 5].includes(Number(t.status))).length;

            // Manter compatibilidade com código antigo
            const totalTickets = totalAssigned;
            const resolvedTickets = totalResolvedAll;
            const backlogTickets = backlogCount;

            // SLA 1ª Resposta metrics - usando helpers normalizados
            let slaWithin = 0, slaOutside = 0, slaConsidered = 0;
            const responseTimes = [];
            this.filteredData.forEach(ticket => {
                const slaResult = this.isWithinSLA(ticket, 4);
                if (slaResult === null) return; // Tipo ignorado ou sem dados

                slaConsidered++;
                const responseMs = this.getResponseTimeMs(ticket);
                if (responseMs !== null) {
                    responseTimes.push(responseMs);
                }

                if (slaResult === true) slaWithin++;
                else slaOutside++;
            });
            const slaTotal = slaWithin + slaOutside;
            const slaPercent = slaTotal > 0 ? Math.round((slaWithin / slaTotal) * 100) : 0;
            const avgResponseMs = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
            const avgResponseHours = Math.round(avgResponseMs / (1000 * 60 * 60) * 10) / 10; // 1 decimal

            // Backlog Aging metrics
            const now = new Date();
            const backlogTicketsList = this.filteredData.filter(t => !(t.status === 4 || t.status === 5));
            let backlogAges = [];
            let backlogOver7Days = 0;
            const agingBuckets = { '0-2d': 0, '3-7d': 0, '8-14d': 0, '15-30d': 0, '>30d': 0 };
            backlogTicketsList.forEach(t => {
                if (!t.created_at) return;
                const days = Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
                backlogAges.push(days);
                if (days > 7) backlogOver7Days++;
                if (days <= 2) agingBuckets['0-2d']++;
                else if (days <= 7) agingBuckets['3-7d']++;
                else if (days <= 14) agingBuckets['8-14d']++;
                else if (days <= 30) agingBuckets['15-30d']++;
                else agingBuckets['>30d']++;
            });
            const avgBacklogAgeDays = backlogAges.length > 0 ? Math.round(backlogAges.reduce((a, b) => a + b, 0) / backlogAges.length) : 0;
            const backlogOver7Percent = backlogTickets > 0 ? Math.round((backlogOver7Days / backlogTickets) * 100) : 0;

            // Status breakdown
            const statusCounts = {};
            this.filteredData.forEach(t => {
                const s = t.status || 0;
                statusCounts[s] = (statusCounts[s] || 0) + 1;
            });

            // Taxa de resolução global
            const globalResolutionRate = totalAssigned > 0 ?
                ((totalResolvedAll / totalAssigned) * 100).toFixed(1) : 0;

            // Tickets SEM tratativa - apenas quando todos os times estiverem selecionados
            // Verifica se estamos vendo todos os times (currentView === 'time' e todos selecionados)
            const isAllTimesSelected = this.currentView === 'time' &&
                this.selectedEntities.size === this.allTimes.size;

            let ticketsSemTratativa = [];
            if (isAllTimesSelected) {
                // Buscar tickets que não têm cf_tratativa preenchido
                ticketsSemTratativa = this.ticketsData.filter(t => {
                    const tratativa = t.cf_tratativa;
                    return !tratativa || tratativa.trim() === '';
                });
            }
            const ticketsSemTratativaCount = ticketsSemTratativa.length;

            // ========== MÉTRICAS HERDADOS vs NOVOS ==========
            const newTicketsCount = this.newTicketsInPeriod?.length || 0;
            const inheritedTicketsCount = this.inheritedTickets?.length || 0;
            const resolvedNewCount = this.resolvedNewTickets?.length || 0;
            const resolvedInheritedCount = this.resolvedInheritedTickets?.length || 0;
            const openInheritedCount = this.openInheritedTickets?.length || 0;
            const absorptionRate = this.absorptionRate || 0;

            // Taxa de limpeza de backlog = % dos herdados que foram resolvidos
            const backlogClearanceRate = inheritedTicketsCount > 0
                ? ((resolvedInheritedCount / inheritedTicketsCount) * 100).toFixed(1)
                : 0;

            // ========== TAXA DE RESOLUÇÃO REAL ==========
            // Fórmula: Resolvidos no período / (Herdados em aberto + Novos no período)
            // Isso mostra se a pessoa está dando conta da demanda total (backlog + novos)
            const totalDemanda = openInheritedCount + newTicketsCount;
            const totalResolvidos = resolvedNewCount + resolvedInheritedCount;
            const realResolutionRate = totalDemanda > 0
                ? ((totalResolvidos / totalDemanda) * 100).toFixed(1)
                : 0;

            // ========== TAXA DE RESOLUÇÃO DO PERÍODO (PRODUTIVIDADE) ==========
            // Fórmula: Resolvidos no período / Tickets com atividade no período
            // Mede a produtividade real do trabalho feito no período
            const ticketsAtivosNoPeriodo = totalTickets; // createdInPeriod já é filteredData
            const periodResolutionRate = ticketsAtivosNoPeriodo > 0
                ? ((resolvedInPeriodCount / ticketsAtivosNoPeriodo) * 100).toFixed(1)
                : 0;

            return {
                entityMap,
                // Métricas novas (atribuídos vs resolvidos)
                totalAssigned,
                totalResolvedAll,
                resolvedInPeriodCount,
                globalResolutionRate,
                // Compatibilidade com código antigo
                totalTickets,
                resolvedTickets,
                openTickets,
                pendingTickets,
                inProgressTickets,
                backlogTickets,
                // SLA 1ª Resposta
                slaWithin,
                slaOutside,
                slaConsidered,
                slaPercent,
                avgResponseHours,
                // Backlog Aging
                avgBacklogAgeDays,
                backlogOver7Days,
                backlogOver7Percent,
                agingBuckets,
                statusCounts,
                // Tickets sem tratativa (apenas quando todos os times selecionados)
                ticketsSemTratativaCount,
                ticketsSemTratativa,
                isAllTimesSelected,
                // ========== HERDADOS vs NOVOS ==========
                newTicketsCount,
                inheritedTicketsCount,
                resolvedNewCount,
                resolvedInheritedCount,
                openInheritedCount,
                absorptionRate,
                backlogClearanceRate,
                // Taxa de Resolução Real (considera demanda total)
                realResolutionRate,
                totalDemanda,
                totalResolvidos,
                // Taxa de Resolução do Período (produtividade)
                periodResolutionRate,
                ticketsAtivosNoPeriodo
            };
        },

        renderKPICards(metrics) {
            const resolutionRate = metrics.totalTickets > 0 ?
                ((metrics.resolvedTickets / metrics.totalTickets) * 100).toFixed(1) : 0;

            // Calcular tendências
            const trends = this.calculateTrends(metrics);

            // Ícones SVG para os cards (sem emojis)
            const svgIcons = {
                total: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>',
                resolved: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
                open: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
                rate: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
                progress: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/><circle cx="12" cy="12" r="3"/></svg>',
                backlog: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
                sla: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                time: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                alert: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                calendar: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                clock: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="4" y1="4" x2="20" y2="20" stroke-width="2.5"/></svg>',
                star: '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
                noUser: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><line x1="4" y1="4" x2="20" y2="20" stroke-width="2.5"/></svg>'
            };

            const cards = [
                {
                    icon: svgIcons.total,
                    value: metrics.totalTickets.toLocaleString('pt-BR'),
                    label: 'Total de Tickets',
                    gradient: this.gradients[0],
                    trend: trends.totalChange,
                    invertTrend: false,
                    drilldown: null
                },
                {
                    icon: svgIcons.resolved,
                    value: metrics.resolvedTickets.toLocaleString('pt-BR'),
                    label: 'Resolvidos',
                    gradient: this.gradients[1],
                    trend: trends.resolvedChange,
                    invertTrend: false,
                    drilldown: "biAnalytics.showDrillDown('resolved', null, 'Tickets Resolvidos')"
                },
                {
                    icon: svgIcons.open,
                    value: metrics.openTickets.toLocaleString('pt-BR'),
                    label: 'Em Aberto',
                    gradient: this.gradients[2],
                    trend: trends.openChange,
                    invertTrend: true,
                    drilldown: "biAnalytics.showDrillDown('status', 2, 'Tickets Abertos')"
                },
                {
                    icon: svgIcons.rate,
                    value: this.periodFilter !== 'all' ? metrics.realResolutionRate + '%' : resolutionRate + '%',
                    label: this.periodFilter !== 'all' ? 'Taxa Resolução Real' : 'Taxa de Resolução',
                    subtitle: this.periodFilter !== 'all' ? `${metrics.totalResolvidos}/${metrics.totalDemanda} tickets` : null,
                    tooltip: this.periodFilter !== 'all'
                        ? 'Mede a capacidade de REDUZIR O BACKLOG TOTAL. Considera todos os tickets pendentes (herdados de períodos anteriores + novos que chegaram). Taxa baixa indica acúmulo de trabalho.'
                        : 'Percentual de tickets resolvidos em relação ao total de tickets atribuídos.',
                    formula: this.periodFilter !== 'all'
                        ? 'Resolvidos no Período ÷ (Herdados em Aberto + Novos no Período) × 100'
                        : 'Resolvidos ÷ Total Atribuídos × 100',
                    dataSource: this.periodFilter !== 'all'
                        ? 'Herdados em Aberto: tickets criados ANTES do período que ainda estão abertos. Novos: tickets criados DENTRO do período. Resolvidos: tickets fechados no período.'
                        : 'Campos: status (4=Resolvido, 5=Fechado), cf_tratativa',
                    gradient: (() => {
                        const rate = this.periodFilter !== 'all' ? parseFloat(metrics.realResolutionRate) : parseFloat(resolutionRate);
                        if (rate >= 80) return ['#10b981', '#059669'];
                        if (rate >= 50) return ['#f59e0b', '#d97706'];
                        return ['#ef4444', '#dc2626'];
                    })(),
                    trend: trends.resolutionRateChange,
                    invertTrend: false,
                    drilldown: null
                },
                {
                    icon: svgIcons.progress,
                    value: metrics.inProgressTickets.toLocaleString('pt-BR'),
                    label: 'Em Andamento',
                    gradient: this.gradients[4],
                    trend: trends.inProgressChange,
                    invertTrend: false,
                    drilldown: "biAnalytics.showDrillDown('in_progress', null, 'Tickets Em Andamento')"
                },
                {
                    icon: svgIcons.backlog,
                    value: metrics.backlogTickets.toLocaleString('pt-BR'),
                    label: 'Backlog',
                    gradient: this.gradients[5],
                    trend: trends.backlogChange,
                    invertTrend: true,
                    drilldown: "biAnalytics.showDrillDown('backlog', null, 'Backlog (Não Resolvidos)')"
                },
                {
                    icon: svgIcons.sla,
                    value: metrics.slaPercent + '%',
                    label: 'SLA 1ª Resposta',
                    gradient: metrics.slaPercent >= 90 ? ['#10b981', '#059669'] : metrics.slaPercent >= 70 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626'],
                    trend: trends.slaChange,
                    invertTrend: false,
                    drilldown: null
                },
                {
                    icon: svgIcons.time,
                    value: metrics.avgResponseHours + 'h',
                    label: 'Tempo Médio 1ª Resp',
                    gradient: this.gradients[7],
                    trend: trends.avgResponseChange,
                    invertTrend: true,
                    drilldown: null
                },
                {
                    icon: svgIcons.alert,
                    value: metrics.slaOutside.toLocaleString('pt-BR'),
                    label: 'Violações SLA',
                    gradient: ['#ef4444', '#b91c1c'],
                    trend: null,
                    invertTrend: true,
                    drilldown: "biAnalytics.showDrillDown('sla_violated', null, 'Violações de SLA')"
                },
                {
                    icon: svgIcons.calendar,
                    value: metrics.avgBacklogAgeDays + 'd',
                    label: 'Idade Média Backlog',
                    gradient: metrics.avgBacklogAgeDays <= 7 ? ['#10b981', '#059669'] : metrics.avgBacklogAgeDays <= 14 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626'],
                    trend: null,
                    drilldown: null
                },
                {
                    icon: svgIcons.clock,
                    value: metrics.backlogOver7Percent + '%',
                    label: 'Backlog > 7 dias',
                    gradient: metrics.backlogOver7Percent <= 20 ? ['#10b981', '#059669'] : metrics.backlogOver7Percent <= 40 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626'],
                    trend: null,
                    drilldown: "biAnalytics.showDrillDown('backlog_old', null, 'Backlog > 7 dias')"
                }
            ];

            // ========== KPIs HERDADOS vs NOVOS (apenas quando há filtro de período) ==========
            if (this.periodFilter !== 'all') {
                // Ícones específicos para Herdados vs Novos
                const inheritedIcon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3 9 4-18 3 9h4"/></svg>';
                const newIcon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
                const absorptionIcon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16l4-4-4-4M8 12h8"/></svg>';
                const productivityIcon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';

                cards.push(
                    {
                        icon: newIcon,
                        value: metrics.newTicketsCount.toLocaleString('pt-BR'),
                        label: 'Novos no Período',
                        tooltip: 'Quantidade de tickets CRIADOS dentro do período selecionado. São demandas novas que chegaram.',
                        formula: 'Contagem de tickets onde created_at >= início do período',
                        dataSource: 'Campo: created_at (data de criação do ticket)',
                        gradient: ['#3b82f6', '#2563eb'],
                        trend: null,
                        drilldown: "biAnalytics.showDrillDown('new_in_period', null, 'Tickets Novos no Período')"
                    },
                    {
                        icon: inheritedIcon,
                        value: metrics.inheritedTicketsCount.toLocaleString('pt-BR'),
                        label: 'Herdados (Carryover)',
                        tooltip: 'Tickets criados ANTES do período que ainda tinham atividade ou foram resolvidos no período. É o backlog que veio de períodos anteriores.',
                        formula: 'Tickets onde created_at < início do período E (status aberto OU resolvido no período)',
                        dataSource: 'Campos: created_at, status, stats_resolved_at',
                        gradient: ['#8b5cf6', '#7c3aed'],
                        trend: null,
                        drilldown: "biAnalytics.showDrillDown('inherited', null, 'Tickets Herdados')"
                    },
                    {
                        icon: svgIcons.resolved,
                        value: `${metrics.resolvedNewCount}/${metrics.resolvedInheritedCount}`,
                        label: 'Resolvidos (Novos/Herd.)',
                        subtitle: `${metrics.resolvedNewCount} novos + ${metrics.resolvedInheritedCount} herdados = ${metrics.resolvedNewCount + metrics.resolvedInheritedCount} total`,
                        tooltip: 'Mostra quantos tickets NOVOS foram resolvidos vs quantos HERDADOS foram resolvidos. Formato: Novos/Herdados.',
                        formula: 'Novos Resolvidos: tickets criados no período com status 4 ou 5. Herdados Resolvidos: tickets criados antes do período mas resolvidos dentro dele.',
                        dataSource: 'Campos: created_at, status (4=Resolvido, 5=Fechado), stats_resolved_at',
                        gradient: ['#10b981', '#059669'],
                        trend: null,
                        drilldown: null
                    },
                    {
                        icon: productivityIcon,
                        value: metrics.periodResolutionRate + '%',
                        label: 'Taxa Resolução Período',
                        subtitle: `${metrics.resolvedInPeriodCount}/${metrics.ticketsAtivosNoPeriodo} ativos`,
                        tooltip: 'Mede a PRODUTIVIDADE do trabalho feito. Considera apenas tickets que tiveram atividade no período (criados, atualizados ou resolvidos). Ignora backlog parado.',
                        formula: 'Resolvidos no Período ÷ Tickets com Atividade no Período × 100',
                        dataSource: 'Tickets Ativos: criados OU atualizados OU resolvidos dentro do período. Exclui tickets antigos sem movimentação.',
                        gradient: (() => {
                            const rate = parseFloat(metrics.periodResolutionRate);
                            if (rate >= 50) return ['#10b981', '#059669'];
                            if (rate >= 25) return ['#f59e0b', '#d97706'];
                            return ['#3b82f6', '#2563eb'];
                        })(),
                        trend: null,
                        drilldown: null
                    },
                    {
                        icon: absorptionIcon,
                        value: metrics.absorptionRate.toFixed(1) + '%',
                        label: 'Taxa de Absorção',
                        subtitle: metrics.newTicketsCount > 0 ? `${metrics.resolvedNewCount}/${metrics.newTicketsCount} novos` : 'Sem novos',
                        tooltip: 'Mede a capacidade de ABSORVER DEMANDA NOVA. Mostra quantos dos tickets novos que chegaram foram resolvidos. 100% = resolveu todos os novos.',
                        formula: 'Novos Resolvidos ÷ Total de Novos × 100',
                        dataSource: 'Novos: tickets criados no período. Novos Resolvidos: novos com status 4 ou 5.',
                        gradient: metrics.absorptionRate >= 80 ? ['#10b981', '#059669'] : metrics.absorptionRate >= 50 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626'],
                        trend: null,
                        drilldown: null
                    }
                );
            }

            // KPI condicional: Tickets sem tratativa (apenas quando TODOS os times estão selecionados)
            if (metrics.isAllTimesSelected && metrics.ticketsSemTratativaCount > 0) {
                cards.push({
                    icon: svgIcons.noUser,
                    value: metrics.ticketsSemTratativaCount.toLocaleString('pt-BR'),
                    label: 'Sem Tratativa',
                    gradient: ['#f97316', '#ea580c'], // Laranja de alerta
                    trend: null,
                    invertTrend: true,
                    drilldown: "biAnalytics.showTicketsSemTratativa()",
                    special: true // Marca como card especial
                });
            }

            // Estilo Premium SaaS
            return cards.map((card, index) => {
                // Determinar cor do valor baseado no tipo de card
                const valueColor = card.gradient[0];
                const isAlertCard = card.label.includes('Violações') || card.label.includes('Backlog');
                const isSuccessCard = card.label.includes('Resolvidos') || card.label.includes('Taxa');

                // Cards de alerta têm fundo com gradiente sutil
                let cardBg, borderStyle, valueStyle;
                if (isAlertCard && parseFloat(card.value) > 0) {
                    cardBg = `linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(180,83,9,0.1) 100%)`;
                    borderStyle = `border: 1px solid rgba(239,68,68,0.3);`;
                    valueStyle = `color: #fbbf24;`;
                } else {
                    cardBg = `#1a1a2e`;
                    borderStyle = `border: 1px solid rgba(255,255,255,0.08);`;
                    valueStyle = `color: ${valueColor};`;
                }

                // Gerar ID único para o tooltip
                const tooltipId = `kpi-tooltip-${index}-${Date.now()}`;

                return `
            <div class="bi-card" style="
                background: ${cardBg};
                padding: 1rem 1.25rem;
                border-radius: 12px;
                ${borderStyle}
                ${card.drilldown ? 'cursor: pointer;' : ''}
                transition: all 0.2s ease;
                position: relative;
                overflow: visible;
            " ${card.drilldown ? `onclick="${card.drilldown}" onmouseover="this.style.borderColor='${valueColor}40';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';this.style.transform='translateY(0)'"` : ''}>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div style="color: #71717a; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${card.label}</div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        ${card.tooltip ? `
                            <button onclick="event.stopPropagation(); biAnalytics.showKPIInfo('${card.label.replace(/'/g, "\\'")}', '${(card.tooltip || '').replace(/'/g, "\\'")}', '${(card.formula || '').replace(/'/g, "\\'")}', '${(card.dataSource || '').replace(/'/g, "\\'")}')" 
                                style="background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 18px; height: 18px; color: #94a3b8; cursor: pointer; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                                onmouseover="this.style.background='rgba(59,130,246,0.3)';this.style.color='#60a5fa'"
                                onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.color='#94a3b8'"
                                title="Clique para ver detalhes">?</button>
                        ` : ''}
                        <div style="color: ${valueColor}; opacity: 0.6;">${card.icon.replace(/width="32"/g, 'width="16"').replace(/height="32"/g, 'height="16"')}</div>
                    </div>
                </div>
                <div style="font-size: 2rem; font-weight: 700; ${valueStyle} line-height: 1;">${card.value}</div>
                ${card.subtitle ? `<div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem;">${card.subtitle}</div>` : ''}
                ${card.trend !== null ? `<div style="margin-top: 0.5rem; font-size: 0.75rem;">${this.formatTrend(card.trend, card.invertTrend)}</div>` : ''}
                ${card.drilldown ? '<div style="font-size: 0.65rem; color: #52525b; margin-top: 0.35rem;">Clique para detalhes</div>' : ''}
            </div>
        `}).join('');
        },

        showKPIInfo(label, tooltip, formula, dataSource) {
            // Modal com informações completas do KPI
            const modal = document.createElement('div');
            modal.id = 'kpi-info-modal';
            modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;

            modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #252536 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                animation: slideUp 0.3s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; color: #f1f5f9; font-size: 1.25rem;">
                        <span style="color: #3b82f6;">?</span> ${label}
                    </h3>
                    <button onclick="document.getElementById('kpi-info-modal').remove()" 
                        style="background: rgba(255,255,255,0.1); border: none; border-radius: 8px; padding: 8px 12px; color: #94a3b8; cursor: pointer; font-size: 14px;"
                        onmouseover="this.style.background='rgba(239,68,68,0.2)';this.style.color='#ef4444'"
                        onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.color='#94a3b8'">✕</button>
                </div>
                
                <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="color: #60a5fa; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">O que este KPI mede</div>
                    <div style="color: #e2e8f0; font-size: 0.95rem; line-height: 1.5;">${tooltip || 'Sem descrição disponível.'}</div>
                </div>
                
                ${formula ? `
                <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="color: #34d399; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Fórmula</div>
                    <div style="color: #e2e8f0; font-size: 0.9rem; font-family: monospace; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px;">${formula}</div>
                </div>
                ` : ''}
                
                ${dataSource ? `
                <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 1rem;">
                    <div style="color: #a78bfa; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">Dados utilizados</div>
                    <div style="color: #e2e8f0; font-size: 0.9rem; line-height: 1.5;">${dataSource}</div>
                </div>
                ` : ''}
                
                <div style="margin-top: 1.5rem; text-align: center;">
                    <button onclick="document.getElementById('kpi-info-modal').remove()" 
                        style="background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 8px; padding: 10px 24px; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Entendi
                    </button>
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

        renderTable(metrics) {
            const rows = Array.from(metrics.entityMap.entries())
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 20)
                .map(([entity, data], index) => {
                    const rateColor = data.resolutionRate >= 80 ? this.colors.secondary :
                        data.resolutionRate >= 50 ? this.colors.accent : this.colors.danger;

                    return `
                    <tr style="border-bottom: 1px solid ${this.colors.border};">
                        <td style="padding: 1rem; font-weight: 600;">
                            <span style="
                                display: inline-block;
                                width: 30px;
                                height: 30px;
                                line-height: 30px;
                                text-align: center;
                                border-radius: 50%;
                                background: ${index < 3 ?
                            `linear-gradient(135deg, ${this.gradients[index][0]}, ${this.gradients[index][1]})` :
                            this.colors.surface};
                                color: white;
                                margin-right: 0.5rem;
                            ">${index + 1}</span>
                            ${entity}
                        </td>
                        <td style="padding: 1rem; text-align: center;">${data.total}</td>
                        <td style="padding: 1rem; text-align: center;">${data.resolved}</td>
                        <td style="padding: 1rem; text-align: center;">
                            <span style="
                                padding: 0.25rem 0.5rem;
                                border-radius: 6px;
                                background: ${rateColor}22;
                                color: ${rateColor};
                                font-weight: 600;
                            ">${data.resolutionRate}%</span>
                        </td>
                        <td style="padding: 1rem; text-align: center;">${data.avgTimeHours ? data.avgTimeHours + 'h' : '-'}</td>
                    </tr>
                `;
                }).join('');

            return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: ${this.colors.dark};">
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid ${this.colors.border};">
                            ${this.currentView === 'pessoa' ? 'Pessoa' : 'Time'}
                        </th>
                        <th style="padding: 1rem; text-align: center; border-bottom: 2px solid ${this.colors.border};">
                            Total
                        </th>
                        <th style="padding: 1rem; text-align: center; border-bottom: 2px solid ${this.colors.border};">
                            Resolvidos
                        </th>
                        <th style="padding: 1rem; text-align: center; border-bottom: 2px solid ${this.colors.border};">
                            Taxa
                        </th>
                        <th style="padding: 1rem; text-align: center; border-bottom: 2px solid ${this.colors.border};">
                            Tempo Médio
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
        },

        renderTop10Chart(metrics, hoverIndex = null) {
            const canvas = document.getElementById('chartTop10');
            if (!canvas) return;

            // Ordenar todos por total
            const allSorted = Array.from(metrics.entityMap.entries())
                .sort((a, b) => b[1].total - a[1].total);

            const { ctx, width, height } = window.setupCanvas(canvas, 300);

            if (allSorted.length === 0) {
                ctx.fillStyle = this.colors.textMuted;
                ctx.font = '14px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('Sem dados', width / 2, 125);
                return;
            }

            // Paginação
            const perPage = this.pagination.top10.perPage;
            const totalPages = Math.ceil(allSorted.length / perPage);
            const currentPage = Math.min(this.pagination.top10.page, totalPages - 1);
            this.pagination.top10.page = currentPage;
            const startIdx = currentPage * perPage;
            const sortedByTotal = allSorted.slice(startIdx, startIdx + perPage);

            // Configuração do gráfico
            const padding = { top: 20, right: 60, bottom: 40, left: 120 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            const barHeight = 22;
            const gap = 6;
            const maxValue = Math.max(...allSorted.map(([, d]) => d.total)); // usar max global
            const borderRadius = 6;

            // Paleta premium - tons de azul/roxo elegantes
            const premiumColors = [
                { main: '#6366f1', glow: '#818cf8', dark: '#4f46e5' },  // Indigo
                { main: '#8b5cf6', glow: '#a78bfa', dark: '#7c3aed' },  // Violet
                { main: '#3b82f6', glow: '#60a5fa', dark: '#2563eb' },  // Blue
                { main: '#06b6d4', glow: '#22d3ee', dark: '#0891b2' },  // Cyan
                { main: '#10b981', glow: '#34d399', dark: '#059669' },  // Emerald
            ];

            const regions = [];
            sortedByTotal.forEach(([entity, data], index) => {
                const globalIndex = startIdx + index;
                const y = padding.top + index * (barHeight + gap);
                const barWidth = Math.max(8, (data.total / maxValue) * chartWidth);

                // Selecionar cor baseada na posição (degradê de intensidade)
                const colorSet = premiumColors[globalIndex % premiumColors.length];
                const intensity = 1 - (globalIndex * 0.06); // Fade suave

                const isHover = index === hoverIndex;
                const h = isHover ? barHeight + 4 : barHeight;
                const yTop = isHover ? y - 2 : y;

                ctx.save();

                // Sombra para profundidade
                if (isHover) {
                    ctx.shadowColor = colorSet.glow;
                    ctx.shadowBlur = 20;
                    ctx.shadowOffsetY = 2;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetY = 1;
                }

                // Fundo da barra (track)
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.beginPath();
                ctx.roundRect(padding.left, y, chartWidth, barHeight, borderRadius);
                ctx.fill();

                // Reset shadow para a barra principal
                ctx.shadowColor = isHover ? colorSet.glow : 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = isHover ? 16 : 6;
                ctx.shadowOffsetY = isHover ? 2 : 1;

                // Gradiente premium - horizontal com brilho
                const gradient = ctx.createLinearGradient(padding.left, yTop, padding.left + barWidth, yTop);
                gradient.addColorStop(0, colorSet.dark);
                gradient.addColorStop(0.3, colorSet.main);
                gradient.addColorStop(0.7, colorSet.main);
                gradient.addColorStop(1, colorSet.glow);

                // Barra principal com bordas arredondadas
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(padding.left, yTop, barWidth, h, borderRadius);
                ctx.fill();

                // Brilho interno (highlight no topo)
                const highlightGradient = ctx.createLinearGradient(0, yTop, 0, yTop + h);
                highlightGradient.addColorStop(0, 'rgba(255,255,255,0.25)');
                highlightGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
                highlightGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
                ctx.fillStyle = highlightGradient;
                ctx.beginPath();
                ctx.roundRect(padding.left, yTop, barWidth, h, borderRadius);
                ctx.fill();

                // Borda sutil no hover
                if (isHover) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(padding.left, yTop, barWidth, h, borderRadius);
                    ctx.stroke();
                }

                ctx.restore();

                regions.push({
                    contains: (mx, my) => mx >= padding.left && mx <= padding.left + barWidth && my >= y && my <= y + barHeight,
                    data: { label: entity, value: data.total, color: colorSet.main, index, globalIndex }
                });

                // Nome e posição - estilo premium (usa cores do tema)
                ctx.fillStyle = this.colors.text;
                ctx.font = isHover ? '600 12px system-ui' : '500 12px system-ui';
                ctx.textAlign = 'right';
                const displayName = entity.length > 14 ? entity.substring(0, 14) + '..' : entity;
                ctx.fillText(`${globalIndex + 1}. ${displayName}`, padding.left - 10, y + barHeight / 2 + 4);

                // Valor com badge effect (usa cores do tema)
                ctx.fillStyle = this.colors.text;
                ctx.font = 'bold 11px system-ui';
                ctx.textAlign = 'left';
                ctx.fillText(data.total.toString(), padding.left + barWidth + 8, y + barHeight / 2 + 4);
            });

            // Controles de paginação
            if (totalPages > 1) {
                const btnY = height - 12;
                ctx.font = '12px system-ui';

                // Botão Anterior (esquerda)
                const btnPrevX = 20;
                ctx.fillStyle = currentPage > 0 ? this.colors.primary : this.colors.border;
                ctx.textAlign = 'left';
                ctx.fillText('◀', btnPrevX, btnY);

                // Info central compacta
                ctx.fillStyle = this.colors.textMuted;
                ctx.textAlign = 'center';
                ctx.fillText(`${currentPage + 1} / ${totalPages}`, width / 2, btnY);

                // Botão Próximo (direita)
                const btnNextX = width - 20;
                ctx.fillStyle = currentPage < totalPages - 1 ? this.colors.primary : this.colors.border;
                ctx.textAlign = 'right';
                ctx.fillText('▶', btnNextX, btnY);

                // Regiões de clique para paginação
                regions.push({
                    contains: (mx, my) => mx >= btnPrevX - 10 && mx <= btnPrevX + 20 && my >= btnY - 12 && my <= btnY + 6,
                    data: { action: 'prevPage', chart: 'top10' }
                });
                regions.push({
                    contains: (mx, my) => mx >= btnNextX - 20 && mx <= btnNextX + 10 && my >= btnY - 12 && my <= btnY + 6,
                    data: { action: 'nextPage', chart: 'top10' }
                });
            }

            // Tooltip e cliques (separados)
            this.setupCanvasTooltip(canvas, regions, (d) => {
                if (d.action) return null; // sem tooltip para botões
                return `<div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value}</span>
            </div>`;
            }, (hit) => {
                // Apenas hover para barras (não para botões)
                const idx = hit ? hit.data.index : null;
                if (this._lastMetrics) this.renderTop10Chart(this._lastMetrics, idx);
            }, (hit) => {
                // Clique para paginação ou ver tickets
                if (hit && hit.data) {
                    if (hit.data.action) {
                        if (hit.data.action === 'prevPage' && this.pagination.top10.page > 0) {
                            this.pagination.top10.page--;
                            this.renderTop10Chart(this._lastMetrics);
                        } else if (hit.data.action === 'nextPage' && this.pagination.top10.page < totalPages - 1) {
                            this.pagination.top10.page++;
                            this.renderTop10Chart(this._lastMetrics);
                        }
                    } else if (hit.data.label) {
                        this.showEntityTickets(hit.data.label);
                    }
                }
            });
        },

        // Mostrar modal com tickets da entidade
        showEntityTickets(entityName) {
            const tickets = (this.createdInPeriod || []).filter(t => {
                const field = this.currentView === 'pessoa' ? t.cf_tratativa : t.cf_grupo_tratativa;

                // Caso especial: "Sem atribuição" significa campo vazio/null
                if (entityName === 'Sem atribuição' || entityName === 'Não atribuído') {
                    return !field || field.trim() === '';
                }

                if (!field) return false;
                return field.split(/[,;\/]/).map(e => e.trim()).includes(entityName);
            });

            if (!tickets.length) {
                alert('Nenhum ticket encontrado para ' + entityName);
                return;
            }

            const existingModal = document.getElementById('entityTicketsModal');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = 'entityTicketsModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;';

            const statusLabels = { 2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado', 6: 'Em Homologação', 7: 'Aguardando Cliente', 8: 'Em Tratativa', 10: 'Em Análise' };
            const statusColors = { 2: '#3b82f6', 3: '#f59e0b', 4: '#10b981', 5: '#6b7280', 6: '#8b5cf6', 7: '#f59e0b', 8: '#06b6d4', 10: '#06b6d4' };
            const prioLabels = ['', 'Baixa', 'Média', 'Alta', 'Urgente'];
            const prioColors = ['', '#6b7280', '#3b82f6', '#f59e0b', '#ef4444'];

            const rows = tickets.slice(0, 100).map(t => {
                const sc = statusColors[t.status] || '#6b7280';
                const sl = statusLabels[t.status] || 'Status ' + t.status;
                const pc = prioColors[t.priority] || '#6b7280';
                const pl = prioLabels[t.priority] || t.priority;
                const dt = t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '-';
                return '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' +
                    '<td style="padding:0.6rem;color:#6366f1;font-weight:600;">#' + t.id + '</td>' +
                    '<td style="padding:0.6rem;color:#e4e4e7;max-width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (t.subject || 'Sem assunto') + '</td>' +
                    '<td style="padding:0.6rem;"><span style="background:' + sc + '22;color:' + sc + ';padding:0.2rem 0.5rem;border-radius:6px;font-size:0.75rem;">' + sl + '</span></td>' +
                    '<td style="padding:0.6rem;color:' + pc + ';font-weight:500;">' + pl + '</td>' +
                    '<td style="padding:0.6rem;color:#a1a1aa;font-size:0.85rem;">' + dt + '</td></tr>';
            }).join('');

            const periodText = this.periodFilter === 'all' ? 'Todo período' : 'últimos ' + this.periodFilter + ' dias';

            modal.innerHTML = '<div style="background:#1e1e2e;border-radius:16px;padding:1.5rem;max-width:1000px;max-height:85vh;overflow-y:auto;width:95%;border:1px solid rgba(99,102,241,0.3);">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.1);">' +
                '<div><h3 style="color:#fff;margin:0;">📋 Tickets de <span style="color:#6366f1;">' + entityName + '</span></h3>' +
                '<p style="color:#a1a1aa;margin:0.5rem 0 0;font-size:0.875rem;">' + tickets.length + ' tickets (' + periodText + ')</p></div>' +
                '<button onclick="document.getElementById(\'entityTicketsModal\').remove()" style="background:#ef4444;border:none;color:#fff;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-weight:600;">✕ Fechar</button></div>' +
                '<table style="width:100%;border-collapse:collapse;">' +
                '<thead><tr style="background:rgba(255,255,255,0.05);">' +
                '<th style="padding:0.6rem;text-align:left;color:#a1a1aa;font-size:0.7rem;text-transform:uppercase;">ID</th>' +
                '<th style="padding:0.6rem;text-align:left;color:#a1a1aa;font-size:0.7rem;text-transform:uppercase;">Assunto</th>' +
                '<th style="padding:0.6rem;text-align:left;color:#a1a1aa;font-size:0.7rem;text-transform:uppercase;">Status</th>' +
                '<th style="padding:0.6rem;text-align:left;color:#a1a1aa;font-size:0.7rem;text-transform:uppercase;">Prioridade</th>' +
                '<th style="padding:0.6rem;text-align:left;color:#a1a1aa;font-size:0.7rem;text-transform:uppercase;">Criado</th></tr></thead>' +
                '<tbody>' + rows + '</tbody></table></div>';

            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            document.body.appendChild(modal);
        },

        // Mostrar tickets por status
        showTicketsByStatus(statusId, statusLabel) {
            const tickets = (this.createdInPeriod || []).filter(t => Number(t.status) === statusId);
            this._showTicketsModal(tickets, 'Status: ' + statusLabel, statusLabel);
        },

        // Mostrar tickets por prioridade
        showTicketsByPriority(priority, prioLabel) {
            const tickets = (this.createdInPeriod || []).filter(t => t.priority === priority);
            this._showTicketsModal(tickets, 'Prioridade: ' + prioLabel, prioLabel);
        },

        // Mostrar tickets por sistema
        showTicketsBySystem(system) {
            const tickets = (this.createdInPeriod || []).filter(t => (t.cf_sistemas || '').toLowerCase().includes(system.toLowerCase()));
            this._showTicketsModal(tickets, 'Sistema: ' + system, system);
        },

        // Mostrar tickets SEM TRATATIVA (apenas quando todos os times selecionados)
        showTicketsSemTratativa() {
            // Buscar tickets sem tratativa do banco completo
            const tickets = this.ticketsData.filter(t => {
                const tratativa = t.cf_tratativa;
                return !tratativa || tratativa.trim() === '';
            });

            if (!tickets.length) {
                alert('Nenhum ticket sem tratativa encontrado.');
                return;
            }

            // Guardar referência para paginação
            window._semTratativaTickets = tickets;
            window._semTratativaPage = 1;
            window._semTratativaPerPage = 50;
            window._semTratativaFilter = 'all';

            // Criar modal
            const existingModal = document.getElementById('semTratativaModal');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = 'semTratativaModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;';

            // Agrupar por grupo para o filtro
            const byGroup = {};
            tickets.forEach(t => {
                const group = t.cf_grupo_tratativa || t.group_name || 'Sem Grupo';
                if (!byGroup[group]) byGroup[group] = [];
                byGroup[group].push(t);
            });
            window._semTratativaByGroup = byGroup;

            // Criar opções de filtro por grupo
            const groupOptions = Object.entries(byGroup)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([group, gTickets]) => `<option value="${group}">${group} (${gTickets.length})</option>`)
                .join('');

            modal.innerHTML = `
            <div id="semTratativaContent" style="background:#1a1a2e;border-radius:16px;width:95%;max-width:1200px;height:90vh;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.1);resize:both;overflow:hidden;min-width:600px;min-height:400px;">
                <div style="padding:1rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <div>
                        <h3 style="margin:0;color:#f97316;font-size:1.25rem;">Tickets Sem Tratativa</h3>
                        <p style="margin:0.25rem 0 0;color:#a1a1aa;font-size:0.85rem;">${tickets.length} tickets sem campo tratativa preenchido</p>
                    </div>
                    <div style="display:flex;gap:0.75rem;align-items:center;">
                        <button onclick="window._semTratativaShowSummary = !window._semTratativaShowSummary; document.getElementById('summarySection').style.display = window._semTratativaShowSummary ? 'block' : 'none';" style="padding:0.4rem 0.75rem;background:rgba(249,115,22,0.2);border:1px solid rgba(249,115,22,0.3);border-radius:6px;color:#f97316;cursor:pointer;font-size:0.8rem;">Resumo</button>
                        <button onclick="document.getElementById('semTratativaModal').remove()" style="background:transparent;border:none;color:#71717a;font-size:1.5rem;cursor:pointer;padding:0 0.5rem;">&times;</button>
                    </div>
                </div>
                
                <!-- Resumo colapsável -->
                <div id="summarySection" style="display:none;padding:0.75rem 1.5rem;background:rgba(249,115,22,0.05);border-bottom:1px solid rgba(255,255,255,0.08);max-height:200px;overflow-y:auto;flex-shrink:0;">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:0.5rem;">
                        ${Object.entries(byGroup).sort((a, b) => b[1].length - a[1].length).map(([group, gTickets]) => {
                const resolvidos = gTickets.filter(t => t.status === 4 || t.status === 5).length;
                const abertos = gTickets.length - resolvidos;
                return `<div style="display:flex;justify-content:space-between;padding:0.4rem 0.75rem;background:rgba(255,255,255,0.03);border-radius:6px;font-size:0.8rem;">
                                <span style="color:#e4e4e7;">${group}</span>
                                <span style="color:#f97316;">${gTickets.length}</span>
                            </div>`;
            }).join('')}
                    </div>
                </div>
                
                <!-- Filtros e controles -->
                <div style="padding:0.75rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;flex-shrink:0;">
                    <div style="display:flex;gap:0.75rem;align-items:center;">
                        <select id="stGroupFilter" onchange="window.biAnalytics._filterSemTratativa()" style="padding:0.4rem 0.75rem;background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e4e4e7;font-size:0.85rem;">
                            <option value="all">Todos os Grupos</option>
                            ${groupOptions}
                        </select>
                        <select id="stStatusFilter" onchange="window.biAnalytics._filterSemTratativa()" style="padding:0.4rem 0.75rem;background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e4e4e7;font-size:0.85rem;">
                            <option value="all">Todos Status</option>
                            <option value="open">Abertos</option>
                            <option value="resolved">Resolvidos</option>
                        </select>
                    </div>
                    <div style="display:flex;gap:0.75rem;align-items:center;">
                        <span style="color:#71717a;font-size:0.85rem;">Por página:</span>
                        <select id="stPerPage" onchange="window._semTratativaPerPage = parseInt(this.value); window._semTratativaPage = 1; window.biAnalytics._renderSemTratativaTable();" style="padding:0.4rem 0.5rem;background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e4e4e7;font-size:0.85rem;">
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="500">500</option>
                        </select>
                    </div>
                </div>
                
                <!-- Tabela com scroll -->
                <div id="stTableContainer" style="flex:1;overflow-y:auto;padding:0;">
                    <!-- Tabela será renderizada aqui -->
                </div>
                
                <!-- Paginação -->
                <div id="stPagination" style="padding:0.75rem 1.5rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <!-- Paginação será renderizada aqui -->
                </div>
            </div>
        `;

            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            document.body.appendChild(modal);

            // Renderizar tabela inicial
            this._renderSemTratativaTable();
        },

        // Filtrar tickets sem tratativa
        _filterSemTratativa() {
            const groupFilter = document.getElementById('stGroupFilter')?.value || 'all';
            const statusFilter = document.getElementById('stStatusFilter')?.value || 'all';

            let filtered = window._semTratativaTickets || [];

            if (groupFilter !== 'all') {
                filtered = filtered.filter(t => {
                    const group = t.cf_grupo_tratativa || t.group_name || 'Sem Grupo';
                    return group === groupFilter;
                });
            }

            if (statusFilter === 'open') {
                filtered = filtered.filter(t => t.status !== 4 && t.status !== 5);
            } else if (statusFilter === 'resolved') {
                filtered = filtered.filter(t => t.status === 4 || t.status === 5);
            }

            window._semTratativaFiltered = filtered;
            window._semTratativaPage = 1;
            this._renderSemTratativaTable();
        },

        // Renderizar tabela de tickets sem tratativa
        _renderSemTratativaTable() {
            const tickets = window._semTratativaFiltered || window._semTratativaTickets || [];
            const page = window._semTratativaPage || 1;
            const perPage = window._semTratativaPerPage || 50;

            const totalPages = Math.ceil(tickets.length / perPage);
            const start = (page - 1) * perPage;
            const end = start + perPage;
            const pageTickets = tickets.slice(start, end);

            const statusLabels = { 2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado', 6: 'Em Homologação', 7: 'Aguardando Cliente', 8: 'Em Tratativa', 10: 'Em Análise', 11: 'Interno', 12: 'Aguardando HML', 13: 'Aguardando PROD', 17: 'Pausado' };
            const statusColors = { 2: '#3b82f6', 3: '#f59e0b', 4: '#10b981', 5: '#6b7280', 6: '#8b5cf6', 7: '#f59e0b', 8: '#06b6d4', 10: '#06b6d4', 11: '#64748b', 12: '#3b82f6', 13: '#8b5cf6', 17: '#64748b' };

            const rows = pageTickets.map((t, idx) => {
                const sc = statusColors[t.status] || '#6b7280';
                const sl = statusLabels[t.status] || 'Status ' + t.status;
                const dt = t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '-';
                const group = t.cf_grupo_tratativa || t.group_name || '-';
                const rowNum = start + idx + 1;
                return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.5rem 1rem;color:#71717a;font-size:0.8rem;width:50px;">${rowNum}</td>
                <td style="padding:0.5rem;color:#6366f1;font-weight:600;width:80px;">#${t.id}</td>
                <td style="padding:0.5rem;color:#e4e4e7;max-width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${(t.subject || '').replace(/"/g, '&quot;')}">${t.subject || 'Sem assunto'}</td>
                <td style="padding:0.5rem;width:120px;"><span style="background:${sc}20;color:${sc};padding:0.2rem 0.5rem;border-radius:4px;font-size:0.75rem;">${sl}</span></td>
                <td style="padding:0.5rem;color:#a1a1aa;width:150px;">${group}</td>
                <td style="padding:0.5rem;color:#71717a;font-size:0.85rem;width:100px;">${dt}</td>
            </tr>`;
            }).join('');

            const tableContainer = document.getElementById('stTableContainer');
            if (tableContainer) {
                tableContainer.innerHTML = `
                <table style="width:100%;border-collapse:collapse;">
                    <thead style="position:sticky;top:0;background:#1a1a2e;z-index:1;">
                        <tr style="background:rgba(255,255,255,0.03);">
                            <th style="padding:0.75rem 1rem;text-align:left;color:#71717a;font-weight:500;width:50px;">#</th>
                            <th style="padding:0.75rem;text-align:left;color:#71717a;font-weight:500;width:80px;">ID</th>
                            <th style="padding:0.75rem;text-align:left;color:#71717a;font-weight:500;">Assunto</th>
                            <th style="padding:0.75rem;text-align:left;color:#71717a;font-weight:500;width:120px;">Status</th>
                            <th style="padding:0.75rem;text-align:left;color:#71717a;font-weight:500;width:150px;">Grupo</th>
                            <th style="padding:0.75rem;text-align:left;color:#71717a;font-weight:500;width:100px;">Criado</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
            }

            // Paginação
            const pagination = document.getElementById('stPagination');
            if (pagination) {
                const maxButtons = 7;
                let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
                let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                if (endPage - startPage < maxButtons - 1) {
                    startPage = Math.max(1, endPage - maxButtons + 1);
                }

                let pageButtons = '';
                if (startPage > 1) {
                    pageButtons += `<button onclick="window._semTratativaPage=1;window.biAnalytics._renderSemTratativaTable()" style="padding:0.4rem 0.6rem;background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#e4e4e7;cursor:pointer;">1</button>`;
                    if (startPage > 2) pageButtons += `<span style="color:#71717a;">...</span>`;
                }

                for (let i = startPage; i <= endPage; i++) {
                    const isActive = i === page;
                    pageButtons += `<button onclick="window._semTratativaPage=${i};window.biAnalytics._renderSemTratativaTable()" style="padding:0.4rem 0.6rem;background:${isActive ? '#f97316' : '#0d0d1a'};border:1px solid ${isActive ? '#f97316' : 'rgba(255,255,255,0.1)'};border-radius:4px;color:${isActive ? '#fff' : '#e4e4e7'};cursor:pointer;font-weight:${isActive ? '600' : '400'};">${i}</button>`;
                }

                if (endPage < totalPages) {
                    if (endPage < totalPages - 1) pageButtons += `<span style="color:#71717a;">...</span>`;
                    pageButtons += `<button onclick="window._semTratativaPage=${totalPages};window.biAnalytics._renderSemTratativaTable()" style="padding:0.4rem 0.6rem;background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#e4e4e7;cursor:pointer;">${totalPages}</button>`;
                }

                pagination.innerHTML = `
                <div style="color:#a1a1aa;font-size:0.85rem;">
                    Mostrando <strong style="color:#f97316;">${start + 1}-${Math.min(end, tickets.length)}</strong> de <strong style="color:#f97316;">${tickets.length}</strong> tickets
                </div>
                <div style="display:flex;gap:0.5rem;align-items:center;">
                    <button onclick="if(window._semTratativaPage>1){window._semTratativaPage--;window.biAnalytics._renderSemTratativaTable();}" ${page <= 1 ? 'disabled' : ''} style="padding:0.4rem 0.75rem;background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:${page <= 1 ? '#4b5563' : '#e4e4e7'};cursor:${page <= 1 ? 'not-allowed' : 'pointer'};">← Anterior</button>
                    ${pageButtons}
                    <button onclick="if(window._semTratativaPage<${totalPages}){window._semTratativaPage++;window.biAnalytics._renderSemTratativaTable();}" ${page >= totalPages ? 'disabled' : ''} style="padding:0.4rem 0.75rem;background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:${page >= totalPages ? '#4b5563' : '#e4e4e7'};cursor:${page >= totalPages ? 'not-allowed' : 'pointer'};">Próxima →</button>
                </div>
            `;
            }
        },

        // Mostrar tickets parados (backlog antigo)
        showStaleTickets(ageBucket) {
            const now = Date.now();
            const tickets = (this.backlogTickets || []).filter(t => {
                const created = new Date(t.created_at);
                const days = (now - created) / 86400000;
                if (ageBucket === '0-7') return days <= 7;
                if (ageBucket === '8-14') return days > 7 && days <= 14;
                if (ageBucket === '15-30') return days > 14 && days <= 30;
                if (ageBucket === '30+') return days > 30;
                return true;
            });
            this._showTicketsModal(tickets, 'Tickets ' + ageBucket + ' dias', ageBucket);
        },

        // Modal genérico para exibir tickets
        _showTicketsModal(tickets, title, filterInfo) {
            if (!tickets.length) {
                alert('Nenhum ticket encontrado para: ' + filterInfo);
                return;
            }

            const existingModal = document.getElementById('entityTicketsModal');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = 'entityTicketsModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;';

            const statusLabels = { 2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado', 6: 'Em Homologação', 7: 'Aguardando Cliente', 8: 'Em Tratativa', 10: 'Em Análise' };
            const statusColors = { 2: '#3b82f6', 3: '#f59e0b', 4: '#10b981', 5: '#6b7280', 6: '#8b5cf6', 7: '#f59e0b', 8: '#06b6d4', 10: '#06b6d4' };
            const prioLabels = ['', 'Baixa', 'Média', 'Alta', 'Urgente'];
            const prioColors = ['', '#6b7280', '#3b82f6', '#f59e0b', '#ef4444'];

            const rows = tickets.slice(0, 100).map(t => {
                const sc = statusColors[t.status] || '#6b7280';
                const sl = statusLabels[t.status] || 'Status ' + t.status;
                const pc = prioColors[t.priority] || '#6b7280';
                const pl = prioLabels[t.priority] || t.priority;
                const dt = t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '-';
                const tratativa = t.cf_tratativa || '-';
                return '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' +
                    '<td style="padding:0.5rem;color:#6366f1;font-weight:600;">#' + t.id + '</td>' +
                    '<td style="padding:0.5rem;color:#e4e4e7;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (t.subject || 'Sem assunto') + '</td>' +
                    '<td style="padding:0.5rem;color:#a1a1aa;font-size:0.8rem;max-width:120px;overflow:hidden;text-overflow:ellipsis;">' + tratativa + '</td>' +
                    '<td style="padding:0.5rem;"><span style="background:' + sc + '22;color:' + sc + ';padding:0.2rem 0.4rem;border-radius:4px;font-size:0.7rem;">' + sl + '</span></td>' +
                    '<td style="padding:0.5rem;color:' + pc + ';font-weight:500;font-size:0.8rem;">' + pl + '</td>' +
                    '<td style="padding:0.5rem;color:#a1a1aa;font-size:0.8rem;">' + dt + '</td></tr>';
            }).join('');

            const periodText = this.periodFilter === 'all' ? 'Todo período' : 'últimos ' + this.periodFilter + ' dias';

            modal.innerHTML = '<div style="background:#1e1e2e;border-radius:16px;padding:1.5rem;max-width:1100px;max-height:85vh;overflow-y:auto;width:95%;border:1px solid rgba(99,102,241,0.3);">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.1);">' +
                '<div><h3 style="color:#fff;margin:0;">📋 ' + title + '</h3>' +
                '<p style="color:#a1a1aa;margin:0.5rem 0 0;font-size:0.875rem;">' + tickets.length + ' tickets (' + periodText + ')</p></div>' +
                '<button onclick="document.getElementById(\'entityTicketsModal\').remove()" style="background:#ef4444;border:none;color:#fff;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-weight:600;">✕ Fechar</button></div>' +
                '<table style="width:100%;border-collapse:collapse;">' +
                '<thead><tr style="background:rgba(255,255,255,0.05);">' +
                '<th style="padding:0.5rem;text-align:left;color:#a1a1aa;font-size:0.65rem;text-transform:uppercase;">ID</th>' +
                '<th style="padding:0.5rem;text-align:left;color:#a1a1aa;font-size:0.65rem;text-transform:uppercase;">Assunto</th>' +
                '<th style="padding:0.5rem;text-align:left;color:#a1a1aa;font-size:0.65rem;text-transform:uppercase;">Tratativa</th>' +
                '<th style="padding:0.5rem;text-align:left;color:#a1a1aa;font-size:0.65rem;text-transform:uppercase;">Status</th>' +
                '<th style="padding:0.5rem;text-align:left;color:#a1a1aa;font-size:0.65rem;text-transform:uppercase;">Prioridade</th>' +
                '<th style="padding:0.5rem;text-align:left;color:#a1a1aa;font-size:0.65rem;text-transform:uppercase;">Criado</th></tr></thead>' +
                '<tbody>' + rows + '</tbody></table></div>';

            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            document.body.appendChild(modal);
        },

        renderResolutionChart(metrics, hoverIndex = null) {
            const canvas = document.getElementById('chartResolution');
            if (!canvas) return;

            // Contar entidades para dimensionar corretamente
            const sortedCount = Array.from(metrics.entityMap.entries()).filter(([, d]) => d.total >= 1).length;

            // Calcular largura mínima: cada barra precisa de ~55px para caber o label
            const minWidthPerEntity = 55;
            const baseWidth = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 400;
            const minRequiredWidth = sortedCount * minWidthPerEntity + 100; // +100 para padding
            const width = Math.max(baseWidth, minRequiredWidth);

            // Setup manual para suportar largura dinâmica
            const dpr = window.devicePixelRatio || 1;
            const height = 280; // Aumentar altura também

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            const ctx = canvas.getContext('2d');
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, width, height);

            // Filtrar e ordenar todas as entidades selecionadas por taxa de resolução
            // Usar realResolutionRate quando há período selecionado
            const useRealRate = this.periodFilter !== 'all';
            const sortedEntities = Array.from(metrics.entityMap.entries())
                .filter(([, data]) => data.total >= 1 || data.totalDemanda > 0) // Incluir quem tem demanda
                .sort((a, b) => {
                    const rateA = useRealRate ? parseFloat(a[1].realResolutionRate || 0) : parseFloat(a[1].resolutionRate);
                    const rateB = useRealRate ? parseFloat(b[1].realResolutionRate || 0) : parseFloat(b[1].resolutionRate);
                    return rateB - rateA;
                });

            if (sortedEntities.length === 0) {
                ctx.fillStyle = this.colors.textMuted;
                ctx.font = '14px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('Sem dados suficientes', width / 2, height / 2);
                return;
            }

            const padding = { top: 40, bottom: 60, left: 50, right: 30 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // Ajustar dinamicamente o tamanho das barras baseado na quantidade de entidades
            const maxBarWidth = 80;
            const minBarWidth = 40; // Mínimo maior para caber o texto
            const idealBarWidth = chartWidth / (sortedEntities.length * 1.3);
            const barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, idealBarWidth));
            const gap = Math.max(8, (chartWidth - barWidth * sortedEntities.length) / (sortedEntities.length + 1));

            // Desenhar eixos
            ctx.strokeStyle = this.colors.border;
            ctx.lineWidth = 1;

            // Eixo Y
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, height - padding.bottom);
            ctx.stroke();

            // Eixo X
            ctx.beginPath();
            ctx.moveTo(padding.left, height - padding.bottom);
            ctx.lineTo(width - padding.right, height - padding.bottom);
            ctx.stroke();

            // Labels do eixo Y (0%, 50%, 100%)
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '11px system-ui';
            ctx.textAlign = 'right';

            [0, 50, 100].forEach(value => {
                const y = height - padding.bottom - (value / 100) * chartHeight;
                ctx.fillText(value + '%', padding.left - 10, y + 4);

                // Grid lines
                if (value > 0) {
                    ctx.strokeStyle = this.colors.border;
                    ctx.globalAlpha = 0.2;
                    ctx.beginPath();
                    ctx.moveTo(padding.left + 1, y);
                    ctx.lineTo(width - padding.right, y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            });

            // Paleta premium para Taxa de Resolução
            const rateColors = {
                excellent: { main: '#10b981', glow: '#34d399', dark: '#059669' },  // Verde - 80%+
                good: { main: '#f59e0b', glow: '#fbbf24', dark: '#d97706' },       // Amarelo - 50-79%
                low: { main: '#ef4444', glow: '#f87171', dark: '#dc2626' }         // Vermelho - <50%
            };
            const borderRadius = 8;

            // Regiões para tooltip
            const regions = [];
            // Barras
            sortedEntities.forEach(([entity, data], index) => {
                // Usar taxa real quando há período selecionado
                const rate = useRealRate ? parseFloat(data.realResolutionRate || 0) : parseFloat(data.resolutionRate);
                const bHeight = Math.max(4, (rate / 100) * chartHeight);
                const x = padding.left + gap + index * (barWidth + gap);
                const y = height - padding.bottom - bHeight;

                // Selecionar paleta baseada na taxa
                const colorSet = rate >= 80 ? rateColors.excellent : rate >= 50 ? rateColors.good : rateColors.low;

                const isHover = index === hoverIndex;
                const extra = isHover ? 4 : 0;

                ctx.save();

                // Fundo da barra (track) - visual premium
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.beginPath();
                ctx.roundRect(x, padding.top, barWidth, chartHeight, borderRadius);
                ctx.fill();

                // Sombra premium
                if (isHover) {
                    ctx.shadowColor = colorSet.glow;
                    ctx.shadowBlur = 20;
                    ctx.shadowOffsetY = -2;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 6;
                    ctx.shadowOffsetY = 2;
                }

                // Gradiente premium vertical
                const gradient = ctx.createLinearGradient(0, y - extra, 0, height - padding.bottom);
                gradient.addColorStop(0, colorSet.glow);
                gradient.addColorStop(0.3, colorSet.main);
                gradient.addColorStop(0.7, colorSet.main);
                gradient.addColorStop(1, colorSet.dark);

                // Barra com bordas arredondadas
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, y - extra, barWidth, bHeight + extra, [borderRadius, borderRadius, 4, 4]);
                ctx.fill();

                // Brilho interno (glass effect)
                const glassGradient = ctx.createLinearGradient(x, y - extra, x + barWidth, y - extra);
                glassGradient.addColorStop(0, 'rgba(255,255,255,0.2)');
                glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
                glassGradient.addColorStop(1, 'rgba(255,255,255,0.15)');
                ctx.fillStyle = glassGradient;
                ctx.beginPath();
                ctx.roundRect(x, y - extra, barWidth, bHeight + extra, [borderRadius, borderRadius, 4, 4]);
                ctx.fill();

                // Borda sutil no hover
                if (isHover) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(x, y - extra, barWidth, bHeight + extra, [borderRadius, borderRadius, 4, 4]);
                    ctx.stroke();
                }

                ctx.restore();

                // Região para tooltip
                regions.push({
                    contains: (mx, my) => mx >= x && mx <= x + barWidth && my >= y && my <= y + bHeight,
                    data: {
                        label: entity,
                        value: `${rate}%`,
                        color: colorSet.main,
                        index,
                        key: `res-${index}`
                    }
                });

                // Percentual - mostrar DENTRO da barra se tiver espaço, senão acima
                const fontSize = sortedEntities.length > 8 ? 9 : 11;
                ctx.font = `bold ${fontSize}px system-ui`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isHover ? '#ffffff' : 'rgba(255,255,255,0.95)';

                // Se a barra for muito pequena, mostrar acima
                if (bHeight < 30) {
                    ctx.fillText(rate.toFixed(0) + '%', x + barWidth / 2, y - 12);
                } else {
                    ctx.fillText(rate.toFixed(0) + '%', x + barWidth / 2, y + bHeight / 2);
                }

                // Nome abaixo - estilo premium
                ctx.save();
                ctx.translate(x + barWidth / 2, height - padding.bottom + 15);
                ctx.rotate(-45 * Math.PI / 180);
                ctx.fillStyle = isHover ? '#ffffff' : 'rgba(255,255,255,0.7)';
                const nameFontSize = sortedEntities.length > 10 ? 9 : 11;
                ctx.font = `500 ${nameFontSize}px system-ui`;
                ctx.textAlign = 'right';
                const maxNameLength = sortedEntities.length > 10 ? 8 : 12;
                const displayName = entity.length > maxNameLength ? entity.substring(0, maxNameLength) + '..' : entity;
                ctx.fillText(displayName, 0, 0);
                ctx.restore();
            });
            // Ativar tooltip
            this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value}</span>
            </div>
        `, (hit) => {
                const idx = hit ? hit.data.index : null;
                if (this._lastMetrics) this.renderResolutionChart(this._lastMetrics, idx);
            });
        },

        showNoDataMessage() {
            const container = document.getElementById('biAnalyticsContainer');
            if (container) {
                container.innerHTML = '<div style="' +
                    'background: ' + this.colors.dark + ';' +
                    'color: ' + this.colors.text + ';' +
                    'min-height: 100vh;' +
                    'padding: 3rem;' +
                    'text-align: center;' +
                    'display: flex;' +
                    'flex-direction: column;' +
                    'justify-content: center;' +
                    'align-items: center;' +
                    '">' +
                    '<h2 style="font-size: 2rem; margin-bottom: 1rem;">📊 Sem dados para exibir</h2>' +
                    '<p style="color: ' + this.colors.textMuted + '; font-size: 1.1rem;">' +
                    'Por favor, carregue um arquivo Excel com os dados de tickets' +
                    '</p>' +
                    '</div>';
            }
        },

        // ============ BI DE PRODUTIVIDADE ============

        // Estado de seleção para produtividade
        _prodSelectedEntities: new Set(),
        _prodAllEntities: new Set(),

        renderProductivitySelector() {
            // Inicializar entidades se não existirem
            if (!this._prodSelectedEntities) this._prodSelectedEntities = new Set();
            if (!this._prodAllEntities) this._prodAllEntities = new Set();

            return `
            <div class="bi-selector-container" style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                        📈 Análise de Produtividade
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <span style="color: ${this.colors.textMuted};">Período:</span>
                        <select id="prodPeriodFilter" onchange="window.biAnalytics.loadProductivityData()" style="
                            background: ${this.colors.surface}; border: 1px solid ${this.colors.border};
                            border-radius: 6px; padding: 0.5rem 1rem; color: white;
                        ">
                            <option value="7">Últimos 7 dias</option>
                            <option value="30" selected>Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Último ano</option>
                            <option value="all">Todo período</option>
                        </select>
                        <span style="color: ${this.colors.textMuted}; margin-left: 1rem;">Agrupar por:</span>
                        <select id="prodGroupBy" onchange="window.biAnalytics.onProdGroupByChange()" style="
                            background: ${this.colors.surface}; border: 1px solid ${this.colors.border};
                            border-radius: 6px; padding: 0.5rem 1rem; color: white;
                        ">
                            <option value="pessoa">Pessoa</option>
                            <option value="time">Time</option>
                        </select>
                    </div>
                </div>
                
                <!-- Filtro de Seleção -->
                <div style="background: ${this.colors.surface}; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span style="color: ${this.colors.textMuted}; font-size: 0.9rem;">Filtrar:</span>
                            <button onclick="window.biAnalytics.prodSelectAll()" style="
                                padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid ${this.colors.border};
                                background: transparent; color: ${this.colors.text}; cursor: pointer; font-size: 0.8rem;
                            ">✅ Todos</button>
                            <button onclick="window.biAnalytics.prodSelectNone()" style="
                                padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid ${this.colors.border};
                                background: transparent; color: ${this.colors.text}; cursor: pointer; font-size: 0.8rem;
                            ">❌ Nenhum</button>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span id="prodSelectedCount" style="color: ${this.colors.accent}; font-size: 0.85rem; font-weight: 600;">0 selecionados</span>
                            <button onclick="window.biAnalytics.applyProdFilter()" style="
                                padding: 0.5rem 1rem; border-radius: 8px; border: none;
                                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.accent});
                                color: white; cursor: pointer; font-weight: 600; font-size: 0.85rem;
                            ">🔍 Aplicar</button>
                        </div>
                    </div>
                    
                    <!-- Search Box -->
                    <div style="position: relative; margin-bottom: 0.75rem;">
                        <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: ${this.colors.textMuted};">🔍</span>
                        <input type="text" id="prodEntitySearch"
                               placeholder="Buscar pessoa ou time..."
                               onkeyup="window.biAnalytics.filterProdEntities(this.value)"
                               style="
                                   width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem;
                                   background: ${this.colors.dark}; border: 1px solid ${this.colors.border};
                                   border-radius: 8px; color: ${this.colors.text}; font-size: 0.85rem;
                               ">
                    </div>
                    
                    <!-- Entity Grid -->
                    <div id="prodEntitiesGrid" style="
                        display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                        gap: 0.5rem; max-height: 200px; overflow-y: auto; padding: 0.5rem;
                        background: ${this.colors.dark}; border-radius: 8px;
                    ">
                        <div style="text-align: center; padding: 1rem; color: ${this.colors.textMuted};">
                            Carregando...
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="productivityContent">
                <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
                    <p>Carregando dados de produtividade...</p>
                </div>
            </div>
        `;
        },

        // Quando muda o agrupamento, resetar seleções e recarregar entidades
        onProdGroupByChange() {
            this._prodSelectedEntities = new Set();
            this._prodAllEntities = new Set();
            this.loadProductivityEntities();
        },

        // Carregar lista de entidades disponíveis
        loadProductivityEntities() {
            const groupByEl = document.getElementById('prodGroupBy');
            const groupBy = groupByEl ? groupByEl.value : 'pessoa';
            const entityField = groupBy === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';

            // Extrair entidades únicas dos dados
            const entities = new Set();
            this.ticketsData.forEach(ticket => {
                const vals = ticket[entityField] ?
                    ticket[entityField].split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                vals.forEach(v => entities.add(v));
            });

            // Ordenar alfabeticamente
            const sortedEntities = [...entities].sort((a, b) => a.localeCompare(b));
            this._prodAllEntities = new Set(sortedEntities);

            // Se nenhum selecionado, selecionar todos por padrão
            if (this._prodSelectedEntities.size === 0) {
                this._prodSelectedEntities = new Set(sortedEntities);
            }

            this.renderProdEntityChips();
            this.updateProdSelectedCount();
            this.loadProductivityData();
        },

        // Renderizar chips de entidades
        renderProdEntityChips(filter = '') {
            const grid = document.getElementById('prodEntitiesGrid');
            if (!grid) return;

            const filterLower = filter.toLowerCase();
            const filtered = [...this._prodAllEntities].filter(e =>
                !filter || e.toLowerCase().includes(filterLower)
            );

            if (filtered.length === 0) {
                grid.innerHTML = `<div style="text-align: center; padding: 1rem; color: ${this.colors.textMuted}; grid-column: 1/-1;">
                Nenhum resultado encontrado
            </div>`;
                return;
            }

            grid.innerHTML = filtered.map(entity => {
                const isSelected = this._prodSelectedEntities.has(entity);
                return `
                <div onclick="window.biAnalytics.toggleProdEntity('${entity.replace(/'/g, "\\'")}')" 
                     class="prod-entity-chip" 
                     data-entity="${entity}"
                     style="
                        padding: 0.5rem 0.75rem; border-radius: 8px; cursor: pointer;
                        font-size: 0.8rem; text-align: center; transition: all 0.2s;
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                        background: ${isSelected ? 'linear-gradient(135deg, ' + this.colors.primary + ', ' + this.colors.accent + ')' : this.colors.surface};
                        border: 1px solid ${isSelected ? 'transparent' : this.colors.border};
                        color: ${isSelected ? 'white' : this.colors.text};
                        font-weight: ${isSelected ? '600' : '400'};
                     " title="${entity}">
                    ${isSelected ? '✓ ' : ''}${entity}
                </div>
            `;
            }).join('');
        },

        // Toggle seleção de entidade
        toggleProdEntity(entity) {
            if (this._prodSelectedEntities.has(entity)) {
                this._prodSelectedEntities.delete(entity);
            } else {
                this._prodSelectedEntities.add(entity);
            }
            this.renderProdEntityChips(document.getElementById('prodEntitySearch')?.value || '');
            this.updateProdSelectedCount();
        },

        // Selecionar todos
        prodSelectAll() {
            this._prodSelectedEntities = new Set(this._prodAllEntities);
            this.renderProdEntityChips(document.getElementById('prodEntitySearch')?.value || '');
            this.updateProdSelectedCount();
        },

        // Selecionar nenhum
        prodSelectNone() {
            this._prodSelectedEntities = new Set();
            this.renderProdEntityChips(document.getElementById('prodEntitySearch')?.value || '');
            this.updateProdSelectedCount();
        },

        // Filtrar entidades pelo search
        filterProdEntities(value) {
            this.renderProdEntityChips(value);
        },

        // Atualizar contador de selecionados
        updateProdSelectedCount() {
            const countEl = document.getElementById('prodSelectedCount');
            if (countEl) {
                const count = this._prodSelectedEntities.size;
                const total = this._prodAllEntities.size;
                countEl.textContent = `${count}/${total} selecionados`;
            }
        },

        // Aplicar filtro e recarregar dados
        applyProdFilter() {
            if (this._prodSelectedEntities.size === 0) {
                alert('Selecione pelo menos uma pessoa ou time!');
                return;
            }
            this.loadProductivityData();
        },

        loadProductivityData() {
            const periodEl = document.getElementById('prodPeriodFilter');
            const groupByEl = document.getElementById('prodGroupBy');
            const period = periodEl ? periodEl.value : '30';
            const groupBy = groupByEl ? groupByEl.value : 'pessoa';
            const entityField = groupBy === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';

            // Filtrar por período
            let data = [...this.ticketsData];
            if (period !== 'all') {
                const days = parseInt(period);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                data = data.filter(t => new Date(t.created_at) >= cutoff);
            }

            // Filtrar por entidades selecionadas
            if (this._prodSelectedEntities && this._prodSelectedEntities.size > 0 &&
                this._prodSelectedEntities.size < this._prodAllEntities.size) {
                data = data.filter(ticket => {
                    const vals = ticket[entityField] ?
                        ticket[entityField].split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                    return vals.some(v => this._prodSelectedEntities.has(v));
                });
            }

            // IMPORTANTE: Atualizar filteredData para os gráficos de bi-analytics-charts.js
            this.filteredData = data;

            // Resetar paginação do ranking
            this._rankingPage = 0;

            const metrics = this.calculateProductivityMetrics(data, groupBy);
            this.renderProductivityDashboard(metrics, groupBy);
        },

        calculateProductivityMetrics(data, groupBy) {
            const entityField = groupBy === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
            const entityMap = new Map();

            // Determinar período de análise
            const dates = data.map(t => new Date(t.created_at)).filter(d => !isNaN(d));
            const minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
            const maxDate = dates.length ? new Date(Math.max(...dates)) : new Date();
            const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));

            data.forEach(ticket => {
                const entities = ticket[entityField] ?
                    ticket[entityField].split(/[,;\/]/).map(e => e.trim()).filter(e => e) : ['Sem atribuição'];

                entities.forEach(entity => {
                    if (!entityMap.has(entity)) {
                        entityMap.set(entity, {
                            total: 0,
                            resolved: 0,
                            slaWithin: 0,
                            slaTotal: 0,
                            resolutionTimes: [],
                            responseTimes: [],
                            byHour: Array(24).fill(0),
                            byDayOfWeek: Array(7).fill(0),
                            byMonth: {}
                        });
                    }

                    const e = entityMap.get(entity);
                    e.total++;

                    // Hora e dia da semana - verificação robusta de data
                    const created = new Date(ticket.created_at);
                    if (created && !isNaN(created.getTime())) {
                        const hour = created.getHours();
                        const dayOfWeek = created.getDay();
                        if (hour >= 0 && hour < 24) e.byHour[hour]++;
                        if (dayOfWeek >= 0 && dayOfWeek < 7) e.byDayOfWeek[dayOfWeek]++;
                        const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
                        e.byMonth[monthKey] = (e.byMonth[monthKey] || 0) + 1;
                    }

                    // Resolvidos
                    if ([4, 5].includes(Number(ticket.status))) {
                        e.resolved++;

                        // Tempo de resolução - tentar vários campos possíveis
                        const resolvedAt = ticket.stats_resolved_at || ticket.resolved_at ||
                            (ticket.stats && ticket.stats.resolved_at);
                        if (resolvedAt && ticket.created_at) {
                            const hours = (new Date(resolvedAt) - new Date(ticket.created_at)) / (1000 * 60 * 60);
                            if (hours > 0 && hours < 720) e.resolutionTimes.push(hours);
                        }
                    }

                    // SLA 1ª resposta - tentar vários campos possíveis
                    const resp = ticket.stats_first_responded_at || ticket.first_responded_at ||
                        ticket.stats_first_response_at || ticket.first_response_time ||
                        (ticket.stats && (ticket.stats.first_responded_at || ticket.stats.first_response_at));
                    if (resp && ticket.created_at) {
                        const hours = (new Date(resp) - new Date(ticket.created_at)) / (1000 * 60 * 60);
                        e.slaTotal++;
                        if (hours <= 4) e.slaWithin++;
                        if (hours > 0 && hours < 168) e.responseTimes.push(hours);
                    }
                });
            });

            // Calcular métricas derivadas
            const results = [];
            entityMap.forEach((e, name) => {
                const avgResolution = e.resolutionTimes.length ?
                    e.resolutionTimes.reduce((a, b) => a + b, 0) / e.resolutionTimes.length : 0;
                const avgResponse = e.responseTimes.length ?
                    e.responseTimes.reduce((a, b) => a + b, 0) / e.responseTimes.length : 0;
                const ticketsPerDay = e.total / totalDays;
                const resolvedPerDay = e.resolved / totalDays;
                const slaPercent = e.slaTotal > 0 ? (e.slaWithin / e.slaTotal * 100) : 0;
                const resolutionRate = e.total > 0 ? (e.resolved / e.total * 100) : 0;

                // Índice de produtividade (0-100)
                const productivityIndex = Math.min(100, Math.round(
                    (resolutionRate * 0.3) +
                    (slaPercent * 0.3) +
                    (Math.min(100, resolvedPerDay * 20) * 0.2) +
                    (Math.max(0, 100 - avgResolution) * 0.2)
                ));

                results.push({
                    name,
                    total: e.total,
                    resolved: e.resolved,
                    resolutionRate: resolutionRate.toFixed(1),
                    ticketsPerDay: ticketsPerDay.toFixed(1),
                    resolvedPerDay: resolvedPerDay.toFixed(1),
                    avgResolutionHours: avgResolution.toFixed(1),
                    avgResponseHours: avgResponse.toFixed(1),
                    slaPercent: slaPercent.toFixed(1),
                    productivityIndex,
                    byHour: e.byHour,
                    byDayOfWeek: e.byDayOfWeek,
                    byMonth: e.byMonth
                });
            });

            return results.sort((a, b) => b.productivityIndex - a.productivityIndex);
        },

        renderProductivityDashboard(metrics, groupBy) {
            const content = document.getElementById('productivityContent');
            if (!content) return;

            if (metrics.length === 0) {
                content.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                    <p>Nenhum dado encontrado para o período selecionado</p>
                </div>
            `;
                return;
            }

            // Top 5 e métricas globais
            const top5 = metrics.slice(0, 5);
            const totalTickets = metrics.reduce((a, b) => a + b.total, 0);
            const totalResolved = metrics.reduce((a, b) => a + b.resolved, 0);
            const avgProductivity = metrics.reduce((a, b) => a + b.productivityIndex, 0) / metrics.length;

            content.innerHTML = `
            <!-- KPIs Globais - Estilo Premium SaaS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div class="bi-card prod-kpi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); transform: translateY(20px); opacity: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">${groupBy === 'pessoa' ? 'Pessoas' : 'Times'} Analisados</div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div class="prod-kpi-value" data-target="${metrics.length}" style="font-size: 2rem; font-weight: 700; color: #8b5cf6;">0</div>
                </div>
                <div class="bi-card prod-kpi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); transform: translateY(20px); opacity: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Total Tickets</div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                    </div>
                    <div class="prod-kpi-value" data-target="${totalTickets}" style="font-size: 2rem; font-weight: 700; color: #3b82f6;">0</div>
                </div>
                <div class="bi-card prod-kpi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); transform: translateY(20px); opacity: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Resolvidos</div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" opacity="0.6"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="prod-kpi-value" data-target="${totalResolved}" style="font-size: 2rem; font-weight: 700; color: #10b981;">0</div>
                </div>
                <div class="bi-card prod-kpi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); transform: translateY(20px); opacity: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div style="color: #71717a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Índice Produtividade</div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <div class="prod-kpi-value" data-target="${avgProductivity.toFixed(0)}" style="font-size: 2rem; font-weight: 700; color: #f59e0b;">0</div>
                </div>
            </div>
            
            <!-- Gráficos -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                <!-- Ranking com paginação -->
                <div class="bi-card" style="padding: 1.5rem; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0;">🏆 Ranking de Produtividade</h3>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <button onclick="window.biAnalytics.prevRankingPage()" id="btnPrevRanking" style="
                                background: rgba(102,126,234,0.15); border: 1px solid rgba(102,126,234,0.3);
                                color: #667eea; width: 28px; height: 28px; border-radius: 6px;
                                cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
                            " title="Anterior">◀</button>
                            <span id="rankingPageInfo" style="font-size: 0.8rem; color: ${this.colors.textMuted}; min-width: 50px; text-align: center;">1/${Math.ceil(metrics.length / 10)}</span>
                            <button onclick="window.biAnalytics.nextRankingPage()" id="btnNextRanking" style="
                                background: rgba(102,126,234,0.15); border: 1px solid rgba(102,126,234,0.3);
                                color: #667eea; width: 28px; height: 28px; border-radius: 6px;
                                cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
                            " title="Próximo">▶</button>
                            <button onclick="expandChart('chartProductivityRanking', '🏆 Ranking de Produtividade')" title="Expandir" style="
                                background: rgba(102,126,234,0.15); border: 1px solid rgba(102,126,234,0.3);
                                color: #667eea; width: 28px; height: 28px; border-radius: 6px;
                                cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
                            ">⛶</button>
                        </div>
                    </div>
                    <canvas id="chartProductivityRanking" height="300"></canvas>
                </div>
                ${window.createChartCard ? window.createChartCard('chartTicketsPerDay', '📊 Tickets por Dia', 300) : `<div class="bi-card" style="padding: 1.5rem;"><h3 style="margin: 0 0 1rem 0;">📊 Tickets por Dia</h3><canvas id="chartTicketsPerDay" height="300"></canvas></div>`}
                ${window.createChartCard ? window.createChartCard('chartByDayOfWeek', '🗓️ Atividade por Dia da Semana', 250) : `<div class="bi-card" style="padding: 1.5rem;"><h3 style="margin: 0 0 1rem 0;">🗓️ Atividade por Dia da Semana</h3><canvas id="chartByDayOfWeek" height="250"></canvas></div>`}
                ${window.createChartCard ? window.createChartCard('chartByHour', '⏰ Atividade por Hora', 250) : `<div class="bi-card" style="padding: 1.5rem;"><h3 style="margin: 0 0 1rem 0;">⏰ Atividade por Hora</h3><canvas id="chartByHour" height="250"></canvas></div>`}
            </div>
            
            <!-- Tabela Detalhada -->
            <div class="bi-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h3 style="margin: 0;">📋 Detalhamento por ${groupBy === 'pessoa' ? 'Pessoa' : 'Time'}</h3>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button onclick="window.biAnalytics.expandTable()" title="Expandir tabela" style="
                            background: rgba(102,126,234,0.15);
                            border: 1px solid rgba(102,126,234,0.3);
                            color: #667eea;
                            width: 32px;
                            height: 32px;
                            border-radius: 6px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                            font-size: 1rem;
                        " onmouseover="this.style.background='rgba(102,126,234,0.3)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(102,126,234,0.15)'; this.style.transform='scale(1)'">
                            ⛶
                        </button>
                        <span style="font-size: 0.85rem; color: ${this.colors.textMuted};">Exibir:</span>
                        <select id="prodTablePageSize" onchange="window.biAnalytics.updateProductivityTable()" style="padding: 0.4rem 0.6rem; border-radius: 6px; background: ${this.colors.surface}; border: 1px solid ${this.colors.border}; color: ${this.colors.text}; cursor: pointer;">
                            <option value="10">10</option>
                            <option value="20" selected>20</option>
                            <option value="50">50</option>
                            <option value="100">Todos</option>
                        </select>
                    </div>
                </div>
                <div id="productivityTableContainer" style="overflow-x: auto;"></div>
                <div id="productivityTablePagination" style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid ${this.colors.border};"></div>
            </div>
        `;

            // Salvar métricas e estado da tabela
            this._productivityTableMetrics = metrics;
            this._productivityTableGroupBy = groupBy;
            this._productivityTableSort = { field: 'productivityIndex', dir: 'desc' };
            this._productivityTablePage = 0;

            // Animar KPIs, renderizar gráficos e tabela
            setTimeout(() => {
                this.animateProductivityKPIs();
                this.renderProductivityRankingChart(metrics);
                this.renderTicketsPerDayChart(metrics);
                this.renderByDayOfWeekChart(metrics);
                this.renderByHourChart(metrics);
                this.updateProductivityTable();
            }, 100);
        },

        // Expandir tabela em modal fullscreen
        expandTable() {
            const container = document.getElementById('productivityTableContainer');
            if (!container || !this._productivityTableMetrics) return;

            const groupBy = this._productivityTableGroupBy;
            const title = `📋 Detalhamento por ${groupBy === 'pessoa' ? 'Pessoa' : 'Time'}`;

            // Criar modal
            const modal = document.createElement('div');
            modal.id = 'tableExpandModal';
            modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.92);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.2s ease;
        `;

            // Gerar tabela completa para o modal
            const metrics = this._productivityTableMetrics;
            const sort = this._productivityTableSort;
            const sorted = [...metrics].sort((a, b) => {
                let aVal, bVal;
                switch (sort.field) {
                    case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                    case 'total': aVal = a.total; bVal = b.total; break;
                    case 'resolved': aVal = a.resolved; bVal = b.resolved; break;
                    case 'resolutionRate': aVal = parseFloat(a.resolutionRate); bVal = parseFloat(b.resolutionRate); break;
                    default: aVal = a.productivityIndex; bVal = b.productivityIndex;
                }
                if (typeof aVal === 'string') return sort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                return sort.dir === 'asc' ? aVal - bVal : bVal - aVal;
            });

            const tableHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: rgba(102,126,234,0.2); border-bottom: 2px solid rgba(102,126,234,0.4);">
                        <th style="padding: 12px 16px; text-align: left; color: #a5b4fc; font-weight: 600;">${groupBy === 'pessoa' ? 'PESSOA' : 'TIME'}</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">TOTAL</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">RESOLVIDOS</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">ABERTOS</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">% RESOLUÇÃO</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">TICKETS/DIA</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">TEMPO RESOL.</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">SLA 1ª RESP.</th>
                        <th style="padding: 12px 16px; text-align: center; color: #a5b4fc; font-weight: 600;">PRODUTIVIDADE</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map((m, i) => {
                const rateColor = parseFloat(m.resolutionRate) >= 80 ? '#10b981' : parseFloat(m.resolutionRate) >= 50 ? '#f59e0b' : '#ef4444';
                const slaColor = parseFloat(m.slaPercent) >= 80 ? '#10b981' : parseFloat(m.slaPercent) >= 50 ? '#f59e0b' : '#ef4444';
                const prodColor = m.productivityIndex >= 70 ? '#10b981' : m.productivityIndex >= 40 ? '#f59e0b' : '#ef4444';
                return `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); ${i % 2 === 0 ? 'background: rgba(255,255,255,0.02);' : ''}">
                                <td style="padding: 12px 16px; color: white; font-weight: 500;">${m.name}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #e2e8f0; font-weight: 600;">${m.total}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #10b981;">${m.resolved}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #f59e0b;">${m.total - m.resolved}</td>
                                <td style="padding: 12px 16px; text-align: center;">
                                    <span style="background: ${rateColor}22; color: ${rateColor}; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${m.resolutionRate}%</span>
                                </td>
                                <td style="padding: 12px 16px; text-align: center; color: #e2e8f0;">${m.ticketsPerDay}</td>
                                <td style="padding: 12px 16px; text-align: center; color: #e2e8f0;">${m.avgResolutionHours}h</td>
                                <td style="padding: 12px 16px; text-align: center;">
                                    <span style="background: ${slaColor}22; color: ${slaColor}; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${m.slaPercent}%</span>
                                </td>
                                <td style="padding: 12px 16px; text-align: center;">
                                    <span style="background: ${prodColor}22; color: ${prodColor}; padding: 4px 10px; border-radius: 12px; font-weight: 600;">${m.productivityIndex}</span>
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
                        ${title}
                        <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 400;">(${metrics.length} registros)</span>
                    </h2>
                    <button onclick="document.getElementById('tableExpandModal').remove()" style="
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
            const handleKey = (e) => {
                if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleKey); }
            };
            document.addEventListener('keydown', handleKey);

            document.body.appendChild(modal);
        },

        // Atualizar tabela de produtividade com ordenação e paginação
        updateProductivityTable() {
            const container = document.getElementById('productivityTableContainer');
            const pagination = document.getElementById('productivityTablePagination');
            if (!container || !this._productivityTableMetrics) return;

            const metrics = this._productivityTableMetrics;
            const groupBy = this._productivityTableGroupBy;
            const sort = this._productivityTableSort;
            const pageSize = parseInt(document.getElementById('prodTablePageSize')?.value || '20');

            // Ordenar
            const sorted = [...metrics].sort((a, b) => {
                let aVal, bVal;
                switch (sort.field) {
                    case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                    case 'total': aVal = a.total; bVal = b.total; break;
                    case 'resolved': aVal = a.resolved; bVal = b.resolved; break;
                    case 'resolutionRate': aVal = parseFloat(a.resolutionRate); bVal = parseFloat(b.resolutionRate); break;
                    case 'ticketsPerDay': aVal = parseFloat(a.ticketsPerDay); bVal = parseFloat(b.ticketsPerDay); break;
                    case 'avgResolutionHours': aVal = parseFloat(a.avgResolutionHours); bVal = parseFloat(b.avgResolutionHours); break;
                    case 'slaPercent': aVal = parseFloat(a.slaPercent); bVal = parseFloat(b.slaPercent); break;
                    default: aVal = a.productivityIndex; bVal = b.productivityIndex;
                }
                if (typeof aVal === 'string') {
                    return sort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return sort.dir === 'asc' ? aVal - bVal : bVal - aVal;
            });

            // Paginar
            const totalPages = pageSize >= 100 ? 1 : Math.ceil(sorted.length / pageSize);
            const page = Math.min(this._productivityTablePage, totalPages - 1);
            this._productivityTablePage = Math.max(0, page);
            const start = pageSize >= 100 ? 0 : page * pageSize;
            const end = pageSize >= 100 ? sorted.length : start + pageSize;
            const pageData = sorted.slice(start, end);

            // Header com ordenação
            const sortIcon = (field) => {
                if (sort.field !== field) return '↕';
                return sort.dir === 'asc' ? '↑' : '↓';
            };
            const thStyle = `padding: 0.75rem; text-align: center; border-bottom: 2px solid ${this.colors.border}; cursor: pointer; user-select: none; white-space: nowrap;`;

            container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: ${this.colors.dark};">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid ${this.colors.border};">#</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('name')" style="${thStyle} text-align: left;">${groupBy === 'pessoa' ? 'Pessoa' : 'Time'} ${sortIcon('name')}</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('total')" style="${thStyle}">Tickets ${sortIcon('total')}</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('resolved')" style="${thStyle}">Resolvidos ${sortIcon('resolved')}</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('resolutionRate')" style="${thStyle}">Taxa ${sortIcon('resolutionRate')}</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('ticketsPerDay')" style="${thStyle}">Tickets/Dia ${sortIcon('ticketsPerDay')}</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('avgResolutionHours')" style="${thStyle}">Tempo Médio ${sortIcon('avgResolutionHours')}</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('slaPercent')" style="${thStyle}">SLA ${sortIcon('slaPercent')}</th>
                        <th onclick="window.biAnalytics.sortProductivityTable('productivityIndex')" style="${thStyle}">Índice ${sortIcon('productivityIndex')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageData.map((m, i) => {
                const globalIndex = start + i;
                return `
                        <tr style="border-bottom: 1px solid ${this.colors.border};">
                            <td style="padding: 0.75rem;">
                                <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background: ${globalIndex < 3 ? `linear-gradient(135deg, ${this.gradients[globalIndex][0]}, ${this.gradients[globalIndex][1]})` : this.colors.surface}; color: white; font-size: 0.8rem;">
                                    ${globalIndex + 1}
                                </span>
                            </td>
                            <td style="padding: 0.75rem; font-weight: 500;">${m.name}</td>
                            <td style="padding: 0.75rem; text-align: center;">${m.total}</td>
                            <td style="padding: 0.75rem; text-align: center;">${m.resolved}</td>
                            <td style="padding: 0.75rem; text-align: center;">
                                <span style="color: ${parseFloat(m.resolutionRate) >= 80 ? '#10b981' : parseFloat(m.resolutionRate) >= 50 ? '#f59e0b' : '#ef4444'};">
                                    ${m.resolutionRate}%
                                </span>
                            </td>
                            <td style="padding: 0.75rem; text-align: center;">${m.ticketsPerDay}</td>
                            <td style="padding: 0.75rem; text-align: center;">${m.avgResolutionHours}h</td>
                            <td style="padding: 0.75rem; text-align: center;">
                                <span style="color: ${parseFloat(m.slaPercent) >= 90 ? '#10b981' : parseFloat(m.slaPercent) >= 70 ? '#f59e0b' : '#ef4444'};">
                                    ${m.slaPercent}%
                                </span>
                            </td>
                            <td style="padding: 0.75rem; text-align: center;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                    <div style="width: 50px; height: 8px; background: ${this.colors.surface}; border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${m.productivityIndex}%; height: 100%; background: ${m.productivityIndex >= 70 ? '#10b981' : m.productivityIndex >= 40 ? '#f59e0b' : '#ef4444'};"></div>
                                    </div>
                                    <span style="font-weight: 600; color: ${m.productivityIndex >= 70 ? '#10b981' : m.productivityIndex >= 40 ? '#f59e0b' : '#ef4444'};">
                                        ${m.productivityIndex}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    `;
            }).join('')}
                </tbody>
            </table>
        `;

            // Paginação
            if (totalPages > 1) {
                pagination.innerHTML = `
                <button onclick="window.biAnalytics.goToProductivityPage(0)" ${page === 0 ? 'disabled' : ''} 
                    style="padding: 0.4rem 0.8rem; border-radius: 6px; background: ${page === 0 ? this.colors.surface : this.colors.primary}; border: none; color: white; cursor: ${page === 0 ? 'not-allowed' : 'pointer'}; opacity: ${page === 0 ? '0.5' : '1'};">
                    ⏮ Início
                </button>
                <button onclick="window.biAnalytics.goToProductivityPage(${page - 1})" ${page === 0 ? 'disabled' : ''} 
                    style="padding: 0.4rem 0.8rem; border-radius: 6px; background: ${page === 0 ? this.colors.surface : this.colors.primary}; border: none; color: white; cursor: ${page === 0 ? 'not-allowed' : 'pointer'}; opacity: ${page === 0 ? '0.5' : '1'};">
                    ◀ Anterior
                </button>
                <span style="color: ${this.colors.text}; font-size: 0.9rem;">
                    Página <strong>${page + 1}</strong> de <strong>${totalPages}</strong> (${sorted.length} itens)
                </span>
                <button onclick="window.biAnalytics.goToProductivityPage(${page + 1})" ${page >= totalPages - 1 ? 'disabled' : ''} 
                    style="padding: 0.4rem 0.8rem; border-radius: 6px; background: ${page >= totalPages - 1 ? this.colors.surface : this.colors.primary}; border: none; color: white; cursor: ${page >= totalPages - 1 ? 'not-allowed' : 'pointer'}; opacity: ${page >= totalPages - 1 ? '0.5' : '1'};">
                    Próximo ▶
                </button>
                <button onclick="window.biAnalytics.goToProductivityPage(${totalPages - 1})" ${page >= totalPages - 1 ? 'disabled' : ''} 
                    style="padding: 0.4rem 0.8rem; border-radius: 6px; background: ${page >= totalPages - 1 ? this.colors.surface : this.colors.primary}; border: none; color: white; cursor: ${page >= totalPages - 1 ? 'not-allowed' : 'pointer'}; opacity: ${page >= totalPages - 1 ? '0.5' : '1'};">
                    Fim ⏭
                </button>
            `;
            } else {
                pagination.innerHTML = `<span style="color: ${this.colors.textMuted}; font-size: 0.9rem;">Mostrando ${sorted.length} itens</span>`;
            }
        },

        sortProductivityTable(field) {
            if (this._productivityTableSort.field === field) {
                this._productivityTableSort.dir = this._productivityTableSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                this._productivityTableSort = { field, dir: 'desc' };
            }
            this._productivityTablePage = 0;
            this.updateProductivityTable();
        },

        goToProductivityPage(page) {
            this._productivityTablePage = Math.max(0, page);
            this.updateProductivityTable();
        },

        animateProductivityKPIs() {
            // Animar entrada dos cards
            const cards = document.querySelectorAll('.prod-kpi-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    card.style.transform = 'translateY(0)';
                    card.style.opacity = '1';
                }, index * 100);
            });

            // Animar números
            const values = document.querySelectorAll('.prod-kpi-value');
            values.forEach((el, index) => {
                const target = parseInt(el.dataset.target) || 0;
                const duration = 1500;
                const startTime = performance.now();
                const startDelay = index * 100;

                setTimeout(() => {
                    const animate = (currentTime) => {
                        const elapsed = currentTime - startTime - startDelay;
                        const progress = Math.min(elapsed / duration, 1);

                        // Easing function (easeOutExpo)
                        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

                        const current = Math.floor(easeProgress * target);
                        el.textContent = current.toLocaleString('pt-BR');

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            el.textContent = target.toLocaleString('pt-BR');
                        }
                    };

                    requestAnimationFrame(animate);
                }, startDelay);
            });
        },

        // Estado de paginação do ranking
        _rankingPage: 0,

        prevRankingPage() {
            if (this._rankingPage > 0) {
                this._rankingPage--;
                this.renderProductivityRankingChart(this._lastProductivityMetrics);
            }
        },

        nextRankingPage() {
            const totalPages = Math.ceil((this._lastProductivityMetrics?.length || 0) / 10);
            if (this._rankingPage < totalPages - 1) {
                this._rankingPage++;
                this.renderProductivityRankingChart(this._lastProductivityMetrics);
            }
        },

        updateRankingPageInfo() {
            const pageInfo = document.getElementById('rankingPageInfo');
            if (pageInfo && this._lastProductivityMetrics) {
                const totalPages = Math.ceil(this._lastProductivityMetrics.length / 10);
                pageInfo.textContent = `${this._rankingPage + 1}/${totalPages}`;
            }
        },

        renderProductivityRankingChart(metrics, hoverIndex = null) {
            const canvas = document.getElementById('chartProductivityRanking');
            if (!canvas) return;

            // Salvar para re-render no hover
            this._lastProductivityMetrics = metrics;

            // Paginação
            const page = this._rankingPage || 0;
            const startIdx = page * 10;
            const top10 = metrics.slice(startIdx, startIdx + 10);

            // Atualizar info de página
            this.updateRankingPageInfo();
            const { ctx, width, height } = window.setupCanvas(canvas, 300);

            const padding = { top: 20, bottom: 20, left: 120, right: 60 };
            const chartWidth = width - padding.left - padding.right;
            const barHeight = (height - padding.top - padding.bottom) / top10.length - 4;

            const regions = [];
            top10.forEach((m, i) => {
                const y = padding.top + i * (barHeight + 4);
                const barWidth = (m.productivityIndex / 100) * chartWidth;
                const color = m.productivityIndex >= 70 ? '#10b981' : m.productivityIndex >= 40 ? '#f59e0b' : '#ef4444';
                const isHover = i === hoverIndex;

                // Barra
                ctx.save();
                if (isHover) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
                ctx.fillStyle = color;
                const hAdj = isHover ? barHeight + 4 : barHeight;
                const yAdj = isHover ? y - 2 : y;
                ctx.fillRect(padding.left, yAdj, barWidth, hAdj);
                if (isHover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(padding.left, yAdj, barWidth, hAdj); }
                ctx.restore();

                // Nome
                ctx.fillStyle = isHover ? this.colors.text : this.colors.text;
                ctx.font = isHover ? 'bold 12px system-ui' : '11px system-ui';
                ctx.textAlign = 'right';
                const name = m.name.length > 15 ? m.name.substring(0, 15) + '..' : m.name;
                ctx.fillText(name, padding.left - 8, y + barHeight / 2 + 4);

                // Valor
                ctx.fillStyle = this.colors.text;
                ctx.textAlign = 'left';
                ctx.font = 'bold 11px system-ui';
                ctx.fillText(`${m.productivityIndex}`, padding.left + barWidth + 8, y + barHeight / 2 + 4);

                // Região de hover
                regions.push({
                    contains: (mx, my) => mx >= padding.left && mx <= padding.left + barWidth && my >= y && my <= y + barHeight,
                    data: { index: i, label: m.name, value: m.productivityIndex, color }
                });
            });

            // Tooltip
            this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">Índice: ${d.value}</span>
            </div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:4px;">🖱️ Clique para ver tickets</div>
        `, (hit) => {
                const idx = hit ? hit.data.index : null;
                if (this._lastProductivityMetrics) this.renderProductivityRankingChart(this._lastProductivityMetrics, idx);
            });

            // Clique para mostrar tickets
            canvas.style.cursor = 'pointer';
            canvas.onclick = (e) => {
                const rect = canvas.getBoundingClientRect();
                // CORREÇÃO: Usar mesma escala que setupCanvasTooltip (sem scale)
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                for (const region of regions) {
                    if (region.contains(mx, my)) {
                        this.showEntityTickets(region.data.label, 'pessoa');
                        break;
                    }
                }
            };
        },

        // Mostrar tickets de uma entidade (pessoa ou time)
        showEntityTickets(entityName, type = 'pessoa') {
            const entityField = type === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';

            // Filtrar tickets da entidade
            const tickets = this.filteredData.filter(ticket => {
                const vals = ticket[entityField] ?
                    ticket[entityField].split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
                return vals.some(v => v === entityName);
            });

            if (tickets.length === 0) {
                alert('Nenhum ticket encontrado para: ' + entityName);
                return;
            }

            // Remover modal existente
            const existing = document.getElementById('entityTicketsModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'entityTicketsModal';
            modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.92); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
            padding: 2rem; animation: fadeIn 0.2s ease;
        `;

            // Ordenar por data mais recente
            const sortedTickets = [...tickets].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            const ticketsHTML = sortedTickets.slice(0, 100).map((t, i) => {
                const statusColor = t.status == 4 || t.status == 5 ? '#10b981' : '#f59e0b';
                const statusLabel = this.getStatusLabel(t.status);
                const date = new Date(t.created_at).toLocaleDateString('pt-BR');
                return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); ${i % 2 === 0 ? 'background: rgba(255,255,255,0.02);' : ''}">
                    <td style="padding: 10px 12px; color: #a5b4fc; font-weight: 500;">#${t.id}</td>
                    <td style="padding: 10px 12px; color: white; max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${(t.subject || '').replace(/"/g, '&quot;')}">${t.subject || 'Sem assunto'}</td>
                    <td style="padding: 10px 12px; text-align: center;">
                        <span style="background: ${statusColor}22; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">${statusLabel}</span>
                    </td>
                    <td style="padding: 10px 12px; text-align: center; color: #94a3b8;">${date}</td>
                    <td style="padding: 10px 12px; text-align: center; color: #e2e8f0;">${t.type || '-'}</td>
                </tr>
            `;
            }).join('');

            modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border-radius: 20px;
                max-width: 95vw;
                max-height: 92vh;
                width: 1100px;
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
                        🎫 Tickets de ${entityName}
                        <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 400;">(${tickets.length} tickets${tickets.length > 100 ? ', mostrando 100' : ''})</span>
                    </h2>
                    <button onclick="document.getElementById('entityTicketsModal').remove()" style="
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
                    padding: 1.5rem;
                    flex: 1;
                    overflow: auto;
                ">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: rgba(102,126,234,0.2); border-bottom: 2px solid rgba(102,126,234,0.4);">
                                <th style="padding: 12px; text-align: left; color: #a5b4fc; font-weight: 600; width: 80px;">ID</th>
                                <th style="padding: 12px; text-align: left; color: #a5b4fc; font-weight: 600;">ASSUNTO</th>
                                <th style="padding: 12px; text-align: center; color: #a5b4fc; font-weight: 600; width: 140px;">STATUS</th>
                                <th style="padding: 12px; text-align: center; color: #a5b4fc; font-weight: 600; width: 100px;">DATA</th>
                                <th style="padding: 12px; text-align: center; color: #a5b4fc; font-weight: 600; width: 100px;">TIPO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ticketsHTML}
                        </tbody>
                    </table>
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

        renderTicketsPerDayChart(metrics, hoverIndex = null) {
            const canvas = document.getElementById('chartTicketsPerDay');
            if (!canvas) return;

            const top10 = metrics.slice(0, 10);
            const { ctx, width, height } = window.setupCanvas(canvas, 300);

            const padding = { top: 20, bottom: 60, left: 50, right: 20 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            const barWidth = chartWidth / top10.length - 8;
            const maxVal = Math.max(...top10.map(m => parseFloat(m.ticketsPerDay)), 1);

            const regions = [];
            top10.forEach((m, i) => {
                const x = padding.left + i * (barWidth + 8) + 4;
                const barH = (parseFloat(m.ticketsPerDay) / maxVal) * chartHeight;
                const y = padding.top + chartHeight - barH;
                const isHover = i === hoverIndex;

                // Gradient
                const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
                gradient.addColorStop(0, this.gradients[i % 10][0]);
                gradient.addColorStop(1, this.gradients[i % 10][1]);

                ctx.save();
                if (isHover) { ctx.shadowColor = this.gradients[i % 10][1]; ctx.shadowBlur = 14; }
                ctx.fillStyle = gradient;
                const xDraw = isHover ? x - 2 : x;
                const wDraw = isHover ? barWidth + 4 : barWidth;
                ctx.fillRect(xDraw, y, wDraw, barH);
                if (isHover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(xDraw, y, wDraw, barH); }
                ctx.restore();

                // Valor
                ctx.fillStyle = this.colors.text;
                ctx.font = isHover ? 'bold 12px system-ui' : 'bold 10px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(m.ticketsPerDay, x + barWidth / 2, y - 5);

                // Nome
                ctx.save();
                ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
                ctx.rotate(-45 * Math.PI / 180);
                ctx.fillStyle = isHover ? this.colors.text : this.colors.textMuted;
                ctx.font = isHover ? 'bold 10px system-ui' : '9px system-ui';
                ctx.textAlign = 'right';
                const name = m.name.length > 10 ? m.name.substring(0, 10) + '..' : m.name;
                ctx.fillText(name, 0, 0);
                ctx.restore();

                // Região de hover
                regions.push({
                    contains: (mx, my) => mx >= x && mx <= x + barWidth && my >= y && my <= y + barH,
                    data: { index: i, label: m.name, value: m.ticketsPerDay, color: this.gradients[i % 10][0] }
                });
            });

            // Tooltip
            this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value} tickets/dia</span>
            </div>
        `, (hit) => {
                const idx = hit ? hit.data.index : null;
                if (this._lastProductivityMetrics) this.renderTicketsPerDayChart(this._lastProductivityMetrics, idx);
            });
        },

        renderByDayOfWeekChart(metrics, hoverIndex = null) {
            const canvas = document.getElementById('chartByDayOfWeek');
            if (!canvas) return;

            this._lastDayOfWeekMetrics = metrics;
            const { ctx, width, height } = window.setupCanvas(canvas, 250);

            // Agregar todos os dados por dia da semana
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const totals = Array(7).fill(0);
            metrics.forEach(m => {
                if (m.byDayOfWeek && Array.isArray(m.byDayOfWeek)) {
                    m.byDayOfWeek.forEach((v, i) => totals[i] += (v || 0));
                }
            });

            const padding = { top: 20, bottom: 40, left: 50, right: 20 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            const barWidth = chartWidth / 7 - 8;
            const maxVal = Math.max(...totals, 1);

            const regions = [];
            totals.forEach((val, i) => {
                const x = padding.left + i * (barWidth + 8) + 4;
                const barH = (val / maxVal) * chartHeight;
                const y = padding.top + chartHeight - barH;
                const color = i === 0 || i === 6 ? '#8b5cf6' : '#3b82f6';
                const isHover = i === hoverIndex;

                ctx.save();
                if (isHover) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
                ctx.fillStyle = color;
                const xDraw = isHover ? x - 2 : x;
                const wDraw = isHover ? barWidth + 4 : barWidth;
                ctx.fillRect(xDraw, y, wDraw, barH);
                if (isHover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(xDraw, y, wDraw, barH); }
                ctx.restore();

                ctx.fillStyle = this.colors.text;
                ctx.font = isHover ? 'bold 13px system-ui' : 'bold 11px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(val.toString(), x + barWidth / 2, y - 5);

                ctx.fillStyle = isHover ? this.colors.text : this.colors.textMuted;
                ctx.font = isHover ? 'bold 12px system-ui' : '11px system-ui';
                ctx.fillText(days[i], x + barWidth / 2, height - 15);

                regions.push({
                    contains: (mx, my) => mx >= x && mx <= x + barWidth && my >= y && my <= y + barH,
                    data: { index: i, label: days[i], value: val, color }
                });
            });

            this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value} tickets</span>
            </div>
        `, (hit) => {
                const idx = hit ? hit.data.index : null;
                if (this._lastDayOfWeekMetrics) this.renderByDayOfWeekChart(this._lastDayOfWeekMetrics, idx);
            });
        },

        renderByHourChart(metrics, hoverIndex = null) {
            const canvas = document.getElementById('chartByHour');
            if (!canvas) return;

            this._lastByHourMetrics = metrics;
            const { ctx, width, height } = window.setupCanvas(canvas, 250);

            // Agregar por hora
            const totals = Array(24).fill(0);
            metrics.forEach(m => {
                if (m.byHour && Array.isArray(m.byHour)) {
                    m.byHour.forEach((v, i) => totals[i] += (v || 0));
                }
            });

            const padding = { top: 20, bottom: 40, left: 40, right: 20 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            const maxVal = Math.max(...totals, 1);

            // Linha
            ctx.strokeStyle = '#3b82f6';
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
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fill();

            // Pontos
            const regions = [];
            points.forEach((p, i) => {
                const isHover = i === hoverIndex;
                const radius = isHover ? 8 : 3;

                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = isHover ? '#fff' : '#3b82f6';
                ctx.fill();
                if (isHover) {
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Mostrar valor no hover
                    ctx.fillStyle = this.colors.text;
                    ctx.font = 'bold 12px system-ui';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${p.val}`, p.x, p.y - 15);
                }

                regions.push({
                    contains: (mx, my) => Math.hypot(mx - p.x, my - p.y) <= 12,
                    data: { index: i, label: `${p.hour}h`, value: p.val, color: '#3b82f6' }
                });
            });

            // Labels de hora
            [0, 6, 12, 18, 23].forEach(h => {
                const x = padding.left + (h / 23) * chartWidth;
                ctx.fillStyle = hoverIndex === h ? this.colors.text : this.colors.textMuted;
                ctx.font = hoverIndex === h ? 'bold 11px system-ui' : '10px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(`${h}h`, x, height - 15);
            });

            this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value} tickets</span>
            </div>
        `, (hit) => {
                const idx = hit ? hit.data.index : null;
                if (this._lastByHourMetrics) this.renderByHourChart(this._lastByHourMetrics, idx);
            });
        }
    });
} // Fechamento do if (typeof BIAnalytics !== 'undefined')
