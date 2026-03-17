/**
 * Reports Enhanced Metrics - Métricas Avançadas para Relatórios
 * Integra Time Entries, Análise por Empresa, SLA de Resolução e mais
 */

window.ReportsEnhancedMetrics = {
    
    // Cache de dados
    cache: {
        timeEntries: null,
        timeEntriesByTicket: null,
        timeEntriesByAgent: null,
        companiesStats: null,
        lastLoaded: null
    },

    // ============================================
    // CARREGAMENTO DE TIME ENTRIES
    // ============================================
    
    async loadTimeEntries() {
        if (this.cache.timeEntries && Date.now() - this.cache.lastLoaded < 300000) {
            return this.cache.timeEntries;
        }

        try {
            const client = window.supabaseClient;
            if (!client) {
                console.warn('⚠️ Supabase não disponível para time entries');
                return [];
            }

            const { data, error } = await client
                .from('time_entries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.cache.timeEntries = data || [];
            this.cache.lastLoaded = Date.now();
            this.processTimeEntries();
            
            console.log(`✅ ${this.cache.timeEntries.length} time entries carregados`);
            return this.cache.timeEntries;
        } catch (e) {
            console.error('Erro ao carregar time entries:', e);
            return [];
        }
    },

    processTimeEntries() {
        const entries = this.cache.timeEntries || [];
        
        // Por ticket
        this.cache.timeEntriesByTicket = new Map();
        entries.forEach(e => {
            if (!e.ticket_id) return;
            if (!this.cache.timeEntriesByTicket.has(e.ticket_id)) {
                this.cache.timeEntriesByTicket.set(e.ticket_id, {
                    totalMinutes: 0,
                    entries: [],
                    agents: new Set()
                });
            }
            const data = this.cache.timeEntriesByTicket.get(e.ticket_id);
            data.totalMinutes += e.time_spent_minutes || 0;
            data.entries.push(e);
            if (e.agent_id) data.agents.add(e.agent_id);
        });

        // Por agente
        this.cache.timeEntriesByAgent = new Map();
        entries.forEach(e => {
            if (!e.agent_id) return;
            if (!this.cache.timeEntriesByAgent.has(e.agent_id)) {
                this.cache.timeEntriesByAgent.set(e.agent_id, {
                    totalMinutes: 0,
                    ticketCount: new Set(),
                    entries: []
                });
            }
            const data = this.cache.timeEntriesByAgent.get(e.agent_id);
            data.totalMinutes += e.time_spent_minutes || 0;
            if (e.ticket_id) data.ticketCount.add(e.ticket_id);
            data.entries.push(e);
        });
    },

    // ============================================
    // MÉTRICAS DE TIME ENTRIES
    // ============================================

    getTicketTimeSpent(ticketId) {
        const data = this.cache.timeEntriesByTicket?.get(ticketId);
        return data ? {
            minutes: data.totalMinutes,
            hours: (data.totalMinutes / 60).toFixed(1),
            entries: data.entries.length,
            agents: data.agents.size
        } : null;
    },

    getTimeEntriesStats(tickets) {
        if (!this.cache.timeEntriesByTicket) return null;

        let totalMinutes = 0;
        let ticketsWithTime = 0;
        let ticketsWithoutTime = 0;
        const timeByTicket = [];

        tickets.forEach(t => {
            const time = this.cache.timeEntriesByTicket.get(t.id);
            if (time && time.totalMinutes > 0) {
                totalMinutes += time.totalMinutes;
                ticketsWithTime++;
                timeByTicket.push({
                    ticketId: t.id,
                    subject: t.subject,
                    minutes: time.totalMinutes,
                    agents: time.agents.size
                });
            } else {
                ticketsWithoutTime++;
            }
        });

        const avgMinutesPerTicket = ticketsWithTime > 0 ? totalMinutes / ticketsWithTime : 0;

        return {
            totalMinutes,
            totalHours: (totalMinutes / 60).toFixed(1),
            ticketsWithTime,
            ticketsWithoutTime,
            avgMinutesPerTicket: avgMinutesPerTicket.toFixed(0),
            avgHoursPerTicket: (avgMinutesPerTicket / 60).toFixed(1),
            topTimeConsumers: timeByTicket.sort((a, b) => b.minutes - a.minutes).slice(0, 10)
        };
    },

    // ============================================
    // MÉTRICAS POR EMPRESA
    // ============================================

    getCompanyStats(tickets) {
        const companyMap = new Map();

        tickets.forEach(t => {
            const companyName = t.company_name || 'Sem Empresa';
            const companyId = t.company_id;
            
            if (!companyMap.has(companyName)) {
                companyMap.set(companyName, {
                    id: companyId,
                    name: companyName,
                    total: 0,
                    resolved: 0,
                    pending: 0,
                    urgent: 0,
                    high: 0,
                    slaWithin: 0,
                    slaOutside: 0,
                    responseTimesMs: [],
                    resolutionTimesMs: [],
                    escalated: 0
                });
            }

            const data = companyMap.get(companyName);
            data.total++;

            // Status
            const status = Number(t.status);
            if (status === 4 || status === 5) {
                data.resolved++;
            } else {
                data.pending++;
            }

            // Prioridade
            if (t.priority === 4) data.urgent++;
            if (t.priority === 3) data.high++;

            // Escalação
            if (t.is_escalated) data.escalated++;

            // SLA 1ª resposta
            if (t.stats_first_responded_at && t.created_at) {
                const responseMs = new Date(t.stats_first_responded_at) - new Date(t.created_at);
                data.responseTimesMs.push(responseMs);
                if (responseMs <= 4 * 60 * 60 * 1000) {
                    data.slaWithin++;
                } else {
                    data.slaOutside++;
                }
            }

            // Tempo de resolução
            if (t.stats_resolved_at && t.created_at) {
                const resolutionMs = new Date(t.stats_resolved_at) - new Date(t.created_at);
                data.resolutionTimesMs.push(resolutionMs);
            }
        });

        // Calcular métricas agregadas
        const companies = Array.from(companyMap.values()).map(c => {
            const slaTotal = c.slaWithin + c.slaOutside;
            const avgResponseHours = c.responseTimesMs.length > 0
                ? (c.responseTimesMs.reduce((a, b) => a + b, 0) / c.responseTimesMs.length) / (1000 * 60 * 60)
                : null;
            const avgResolutionHours = c.resolutionTimesMs.length > 0
                ? (c.resolutionTimesMs.reduce((a, b) => a + b, 0) / c.resolutionTimesMs.length) / (1000 * 60 * 60)
                : null;

            return {
                ...c,
                resolutionRate: c.total > 0 ? ((c.resolved / c.total) * 100).toFixed(1) : 0,
                slaRate: slaTotal > 0 ? ((c.slaWithin / slaTotal) * 100).toFixed(1) : null,
                avgResponseHours: avgResponseHours ? avgResponseHours.toFixed(1) : null,
                avgResolutionHours: avgResolutionHours ? avgResolutionHours.toFixed(1) : null,
                escalationRate: c.total > 0 ? ((c.escalated / c.total) * 100).toFixed(1) : 0
            };
        });

        return companies.filter(c => c.name !== 'Sem Empresa').sort((a, b) => b.total - a.total);
    },

    // ============================================
    // SLA DE RESOLUÇÃO
    // ============================================

    getResolutionSLAStats(tickets) {
        let withinSLA = 0;
        let outsideSLA = 0;
        let noDeadline = 0;
        const byPriority = {
            urgent: { within: 0, outside: 0, times: [] },
            high: { within: 0, outside: 0, times: [] },
            medium: { within: 0, outside: 0, times: [] },
            low: { within: 0, outside: 0, times: [] }
        };

        // SLA em horas por prioridade (padrão)
        const slaLimits = {
            4: 4,    // Urgente: 4h
            3: 8,    // Alta: 8h
            2: 24,   // Média: 24h
            1: 72    // Baixa: 72h
        };

        tickets.forEach(t => {
            if (!t.stats_resolved_at) return;

            const resolvedAt = new Date(t.stats_resolved_at);
            const createdAt = new Date(t.created_at);
            const dueBy = t.due_by ? new Date(t.due_by) : null;
            const resolutionHours = (resolvedAt - createdAt) / (1000 * 60 * 60);

            const prioKey = t.priority === 4 ? 'urgent' : t.priority === 3 ? 'high' : t.priority === 2 ? 'medium' : 'low';
            const slaLimit = slaLimits[t.priority] || 72;

            byPriority[prioKey].times.push(resolutionHours);

            // Verificar SLA
            let metSLA = false;
            if (dueBy) {
                metSLA = resolvedAt <= dueBy;
            } else {
                metSLA = resolutionHours <= slaLimit;
                noDeadline++;
            }

            if (metSLA) {
                withinSLA++;
                byPriority[prioKey].within++;
            } else {
                outsideSLA++;
                byPriority[prioKey].outside++;
            }
        });

        const total = withinSLA + outsideSLA;
        
        // Calcular médias por prioridade
        Object.keys(byPriority).forEach(key => {
            const p = byPriority[key];
            p.avgHours = p.times.length > 0 
                ? (p.times.reduce((a, b) => a + b, 0) / p.times.length).toFixed(1)
                : null;
            p.total = p.within + p.outside;
            p.rate = p.total > 0 ? ((p.within / p.total) * 100).toFixed(1) : null;
        });

        return {
            withinSLA,
            outsideSLA,
            total,
            rate: total > 0 ? ((withinSLA / total) * 100).toFixed(1) : 0,
            noDeadline,
            byPriority
        };
    },

    // ============================================
    // MÉTRICAS DE ESCALAÇÃO
    // ============================================

    getEscalationStats(tickets) {
        let escalated = 0;
        let notEscalated = 0;
        const byAgent = new Map();
        const byType = new Map();
        const escalatedTickets = [];

        tickets.forEach(t => {
            if (t.is_escalated) {
                escalated++;
                escalatedTickets.push({
                    id: t.id,
                    subject: t.subject,
                    priority: t.priority,
                    type: t.type,
                    agent: t.cf_tratativa || t.responder_name
                });

                // Por agente
                const agent = t.cf_tratativa || 'Sem Agente';
                byAgent.set(agent, (byAgent.get(agent) || 0) + 1);

                // Por tipo
                const type = t.type || 'Sem Tipo';
                byType.set(type, (byType.get(type) || 0) + 1);
            } else {
                notEscalated++;
            }
        });

        const total = escalated + notEscalated;

        return {
            escalated,
            notEscalated,
            total,
            rate: total > 0 ? ((escalated / total) * 100).toFixed(1) : 0,
            byAgent: Array.from(byAgent.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            byType: Array.from(byType.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topEscalated: escalatedTickets.slice(0, 20)
        };
    },

    // ============================================
    // MÉTRICAS DE REABERTURA
    // ============================================

    getReopenStats(tickets) {
        let reopened = 0;
        const byAgent = new Map();
        const reopenedTickets = [];

        tickets.forEach(t => {
            if (t.stats_reopened_at) {
                reopened++;
                reopenedTickets.push({
                    id: t.id,
                    subject: t.subject,
                    reopenedAt: t.stats_reopened_at,
                    agent: t.cf_tratativa || t.responder_name
                });

                const agent = t.cf_tratativa || 'Sem Agente';
                byAgent.set(agent, (byAgent.get(agent) || 0) + 1);
            }
        });

        const total = tickets.length;

        return {
            reopened,
            total,
            rate: total > 0 ? ((reopened / total) * 100).toFixed(1) : 0,
            byAgent: Array.from(byAgent.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            topReopened: reopenedTickets.slice(0, 10)
        };
    },

    // ============================================
    // MÉTRICAS DE VELOCITY E THROUGHPUT
    // ============================================

    getVelocityMetrics(tickets, periodDays = 30) {
        const now = new Date();
        const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
        
        // Tickets criados no período
        const createdInPeriod = tickets.filter(t => new Date(t.created_at) >= periodStart);
        
        // Tickets resolvidos no período
        const resolvedInPeriod = tickets.filter(t => 
            t.stats_resolved_at && new Date(t.stats_resolved_at) >= periodStart
        );

        // Dias úteis (aproximado - excluindo fins de semana)
        const businessDays = Math.ceil(periodDays * 5 / 7);

        // Velocity = tickets resolvidos por dia útil
        const velocity = businessDays > 0 ? (resolvedInPeriod.length / businessDays).toFixed(1) : 0;

        // Throughput = entrada vs saída
        const inputRate = createdInPeriod.length;
        const outputRate = resolvedInPeriod.length;
        const throughputRatio = inputRate > 0 ? (outputRate / inputRate * 100).toFixed(1) : 100;

        // Tendência de backlog
        const backlogTrend = outputRate >= inputRate ? 'diminuindo' : 'aumentando';

        return {
            createdInPeriod: createdInPeriod.length,
            resolvedInPeriod: resolvedInPeriod.length,
            velocity,
            velocityLabel: `${velocity} tickets/dia útil`,
            inputRate,
            outputRate,
            throughputRatio,
            throughputStatus: parseFloat(throughputRatio) >= 100 ? 'saudável' : 'atenção',
            backlogTrend,
            businessDays
        };
    },

    // ============================================
    // DISTRIBUIÇÃO POR CANAL/FONTE
    // ============================================

    getSourceStats(tickets) {
        const sourceMap = {
            1: 'Email',
            2: 'Portal',
            3: 'Telefone',
            4: 'Feedback',
            5: 'Chat',
            6: 'Saída',
            7: 'Facebook',
            8: 'Twitter',
            9: 'API'
        };

        const bySource = new Map();
        
        tickets.forEach(t => {
            const sourceName = sourceMap[t.source] || `Fonte ${t.source}`;
            if (!bySource.has(sourceName)) {
                bySource.set(sourceName, { total: 0, resolved: 0, slaWithin: 0, slaTotal: 0 });
            }
            const data = bySource.get(sourceName);
            data.total++;
            
            if ([4, 5].includes(Number(t.status))) data.resolved++;
            
            if (t.stats_first_responded_at && t.created_at) {
                data.slaTotal++;
                const responseMs = new Date(t.stats_first_responded_at) - new Date(t.created_at);
                if (responseMs <= 4 * 60 * 60 * 1000) data.slaWithin++;
            }
        });

        return Array.from(bySource.entries())
            .map(([name, data]) => ({
                name,
                total: data.total,
                resolved: data.resolved,
                resolutionRate: data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(1) : 0,
                slaRate: data.slaTotal > 0 ? ((data.slaWithin / data.slaTotal) * 100).toFixed(1) : null
            }))
            .sort((a, b) => b.total - a.total);
    },

    // ============================================
    // HEATMAP DE VOLUME (hora x dia da semana)
    // ============================================

    getVolumeHeatmap(tickets) {
        // Matriz 7 dias x 24 horas
        const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        tickets.forEach(t => {
            if (!t.created_at) return;
            const date = new Date(t.created_at);
            const day = date.getDay(); // 0-6
            const hour = date.getHours(); // 0-23
            heatmap[day][hour]++;
        });

        // Encontrar max para normalização
        let max = 0;
        heatmap.forEach(row => row.forEach(val => { if (val > max) max = val; }));

        // Transformar em dados estruturados
        const data = [];
        heatmap.forEach((row, dayIndex) => {
            row.forEach((count, hourIndex) => {
                data.push({
                    day: dayIndex,
                    dayName: dayNames[dayIndex],
                    hour: hourIndex,
                    count,
                    intensity: max > 0 ? count / max : 0
                });
            });
        });

        // Horários de pico
        const sortedByCount = [...data].sort((a, b) => b.count - a.count);
        const peakHours = sortedByCount.slice(0, 5).map(d => ({
            day: d.dayName,
            hour: `${d.hour}:00`,
            count: d.count
        }));

        return {
            matrix: heatmap,
            data,
            max,
            peakHours,
            dayNames
        };
    },

    // ============================================
    // ANÁLISE COMPLETA CONSOLIDADA
    // ============================================

    async getEnhancedMetrics(tickets) {
        // Carregar time entries se não carregado
        await this.loadTimeEntries();

        return {
            // Dados de Time Entries
            timeEntries: this.getTimeEntriesStats(tickets),
            
            // Análise por Empresa
            companies: this.getCompanyStats(tickets),
            
            // SLA de Resolução
            resolutionSLA: this.getResolutionSLAStats(tickets),
            
            // Escalações
            escalations: this.getEscalationStats(tickets),
            
            // Reaberturas
            reopens: this.getReopenStats(tickets),
            
            // Velocity e Throughput
            velocity: this.getVelocityMetrics(tickets),
            
            // Por Canal/Fonte
            sources: this.getSourceStats(tickets),
            
            // Heatmap de Volume
            heatmap: this.getVolumeHeatmap(tickets)
        };
    }
};

console.log('✅ Reports Enhanced Metrics carregado');
