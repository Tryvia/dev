/**
 * Módulo de Inteligência Avançada - IA Tryviano Premium
 * 
 * Funcionalidades:
 * - Análise preditiva de tickets
 * - Detecção de padrões e anomalias
 * - Sugestões proativas
 * - Aprendizado de preferências do usuário
 * - Insights automáticos
 */

(function () {
    'use strict';

    const TryvianoIntelligence = {
        // Cache de análises para performance
        analysisCache: {
            lastUpdate: null,
            predictions: null,
            patterns: null,
            anomalies: null,
            insights: null
        },

        // Configurações de análise
        config: {
            cacheTimeout: 5 * 60 * 1000, // 5 minutos
            predictionDays: 7,
            anomalyThreshold: 2, // desvios padrão
            minDataPoints: 10
        },

        /**
         * Análise Preditiva de Volume
         * Usa média móvel e tendência para prever volume futuro
         */
        predictVolume(tickets, daysAhead = 7) {
            if (!tickets || tickets.length < this.config.minDataPoints) {
                return { success: false, message: 'Dados insuficientes para previsão' };
            }

            // Agrupar por dia nos últimos 30 dias
            const dailyCounts = this.getDailyCounts(tickets, 30);
            const days = Object.keys(dailyCounts).sort();
            const values = days.map(d => dailyCounts[d]);

            if (values.length < 7) {
                return { success: false, message: 'Histórico muito curto' };
            }

            // Calcular média móvel (7 dias)
            const movingAvg = this.calculateMovingAverage(values, 7);

            // Calcular tendência (regressão linear simples)
            const trend = this.calculateTrend(values);

            // Gerar previsões
            const predictions = [];
            const lastAvg = movingAvg[movingAvg.length - 1];
            const baseDate = new Date();

            for (let i = 1; i <= daysAhead; i++) {
                const date = new Date(baseDate);
                date.setDate(date.getDate() + i);

                // Ajustar por dia da semana (menos tickets no fim de semana)
                const dayOfWeek = date.getDay();
                let weekendFactor = 1;
                if (dayOfWeek === 0) weekendFactor = 0.3; // Domingo
                if (dayOfWeek === 6) weekendFactor = 0.5; // Sábado

                const predicted = Math.round((lastAvg + (trend.slope * i)) * weekendFactor);

                predictions.push({
                    date: date.toISOString().slice(0, 10),
                    dateFormatted: date.toLocaleDateString('pt-BR'),
                    dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek],
                    predicted: Math.max(0, predicted),
                    confidence: this.calculateConfidence(values, i)
                });
            }

            // Resumo da previsão
            const totalPredicted = predictions.reduce((sum, p) => sum + p.predicted, 0);
            const avgDaily = (totalPredicted / daysAhead).toFixed(1);
            const trendDirection = trend.slope > 0.5 ? '📈 Aumentando' :
                trend.slope < -0.5 ? '📉 Diminuindo' : '➡️ Estável';

            return {
                success: true,
                predictions,
                summary: {
                    totalPredicted,
                    avgDaily,
                    trend: trendDirection,
                    trendValue: trend.slope.toFixed(2),
                    confidence: this.calculateOverallConfidence(values)
                },
                historical: {
                    last7Days: values.slice(-7).reduce((a, b) => a + b, 0),
                    avgLast7: (values.slice(-7).reduce((a, b) => a + b, 0) / 7).toFixed(1),
                    avgLast30: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
                }
            };
        },

        /**
         * Detecção de Anomalias
         * Identifica tickets ou métricas fora do padrão
         */
        detectAnomalies(tickets) {
            if (!tickets || tickets.length < this.config.minDataPoints) {
                return { success: false, anomalies: [] };
            }

            const anomalies = [];
            const now = new Date();

            // 1. Volume diário anômalo
            const dailyCounts = this.getDailyCounts(tickets, 30);
            const values = Object.values(dailyCounts);
            const stats = this.calculateStats(values);

            const today = now.toISOString().slice(0, 10);
            const todayCount = dailyCounts[today] || 0;

            if (todayCount > stats.mean + (this.config.anomalyThreshold * stats.stdDev)) {
                anomalies.push({
                    type: 'volume_alto',
                    severity: 'warning',
                    icon: '📈',
                    title: 'Volume acima do normal',
                    description: `Hoje: ${todayCount} tickets (média: ${stats.mean.toFixed(0)})`,
                    metric: todayCount,
                    expected: stats.mean,
                    deviation: ((todayCount - stats.mean) / stats.stdDev).toFixed(1)
                });
            }

            // 2. Tickets antigos sem resposta
            const oldWithoutResponse = tickets.filter(t => {
                if ([4, 5].includes(Number(t.status))) return false;
                if (t.stats_first_responded_at) return false;
                if (!t.created_at) return false;

                const age = (now - new Date(t.created_at)) / (1000 * 60 * 60);
                return age > 24; // Mais de 24h sem resposta
            });

            if (oldWithoutResponse.length > 0) {
                anomalies.push({
                    type: 'sem_resposta',
                    severity: 'critical',
                    icon: '🚨',
                    title: 'Tickets sem resposta há mais de 24h',
                    description: `${oldWithoutResponse.length} tickets aguardando primeira resposta`,
                    tickets: oldWithoutResponse.slice(0, 10).map(t => ({
                        id: t.id,
                        subject: t.subject?.substring(0, 50),
                        priority: t.priority,
                        age: Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60))
                    }))
                });
            }

            // 3. Acúmulo de urgentes
            const urgentOpen = tickets.filter(t =>
                t.priority == 4 && ![4, 5].includes(Number(t.status))
            );

            if (urgentOpen.length >= 5) {
                anomalies.push({
                    type: 'urgentes_acumulados',
                    severity: 'critical',
                    icon: '🔴',
                    title: 'Acúmulo de tickets urgentes',
                    description: `${urgentOpen.length} tickets urgentes não resolvidos`,
                    tickets: urgentOpen.slice(0, 5).map(t => ({
                        id: t.id,
                        subject: t.subject?.substring(0, 50)
                    }))
                });
            }

            // 4. SLA em risco
            const withResponse = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (withResponse.length > 0) {
                const outsideSLA = withResponse.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time > 4;
                });

                const slaRate = ((withResponse.length - outsideSLA.length) / withResponse.length) * 100;

                if (slaRate < 80) {
                    anomalies.push({
                        type: 'sla_baixo',
                        severity: 'warning',
                        icon: '⚠️',
                        title: 'SLA abaixo da meta',
                        description: `Taxa atual: ${slaRate.toFixed(1)}% (meta: 80%)`,
                        metric: slaRate
                    });
                }
            }

            // 5. Pessoa sobrecarregada
            const byPerson = {};
            tickets.filter(t => ![4, 5].includes(Number(t.status))).forEach(t => {
                const person = t.cf_tratativa;
                if (person && person.length > 2) {
                    byPerson[person] = (byPerson[person] || 0) + 1;
                }
            });

            const overloaded = Object.entries(byPerson)
                .filter(([_, count]) => count > 20)
                .sort((a, b) => b[1] - a[1]);

            if (overloaded.length > 0) {
                anomalies.push({
                    type: 'sobrecarga',
                    severity: 'warning',
                    icon: '😰',
                    title: 'Pessoas sobrecarregadas',
                    description: `${overloaded.length} pessoa(s) com mais de 20 tickets ativos`,
                    people: overloaded.slice(0, 5).map(([name, count]) => ({ name, count }))
                });
            }

            return {
                success: true,
                anomalies,
                totalCritical: anomalies.filter(a => a.severity === 'critical').length,
                totalWarning: anomalies.filter(a => a.severity === 'warning').length,
                timestamp: new Date().toISOString()
            };
        },

        /**
         * Detectar Padrões
         * Identifica padrões de comportamento nos tickets
         */
        detectPatterns(tickets) {
            if (!tickets || tickets.length < this.config.minDataPoints) {
                return { success: false, patterns: [] };
            }

            const patterns = [];

            // 1. Padrão de dia da semana
            const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
            tickets.forEach(t => {
                if (t.created_at) {
                    const day = new Date(t.created_at).getDay();
                    byDayOfWeek[day]++;
                }
            });

            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            const peakDay = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));
            const lowDay = byDayOfWeek.indexOf(Math.min(...byDayOfWeek.slice(1, 6))) + 1;

            patterns.push({
                type: 'day_pattern',
                icon: '📅',
                title: 'Padrão semanal',
                insight: `Pico: ${dayNames[peakDay]} (${byDayOfWeek[peakDay]} tickets)`,
                recommendation: `Reforce a equipe às ${dayNames[peakDay]}s`,
                data: dayNames.map((name, i) => ({ day: name, count: byDayOfWeek[i] }))
            });

            // 2. Padrão de horário
            const byHour = Array(24).fill(0);
            tickets.forEach(t => {
                if (t.created_at) {
                    const hour = new Date(t.created_at).getHours();
                    byHour[hour]++;
                }
            });

            const peakHour = byHour.indexOf(Math.max(...byHour));
            const peakPeriod = peakHour < 12 ? 'manhã' : peakHour < 18 ? 'tarde' : 'noite';

            patterns.push({
                type: 'hour_pattern',
                icon: '🕐',
                title: 'Padrão de horário',
                insight: `Horário de pico: ${peakHour}:00 (${byHour[peakHour]} tickets)`,
                recommendation: `Maior demanda pela ${peakPeriod}`,
                data: byHour.map((count, hour) => ({ hour: `${hour}:00`, count }))
            });

            // 3. Padrão de tipo/categoria
            const byType = {};
            tickets.forEach(t => {
                const type = t.type || t.tags?.[0] || 'Não categorizado';
                byType[type] = (byType[type] || 0) + 1;
            });

            const topTypes = Object.entries(byType)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (topTypes.length > 0) {
                const topTypePercent = ((topTypes[0][1] / tickets.length) * 100).toFixed(1);
                patterns.push({
                    type: 'category_pattern',
                    icon: '📊',
                    title: 'Principais categorias',
                    insight: `Top: ${topTypes[0][0]} (${topTypePercent}%)`,
                    recommendation: `Crie templates para "${topTypes[0][0]}"`,
                    data: topTypes.map(([name, count]) => ({
                        name,
                        count,
                        percent: ((count / tickets.length) * 100).toFixed(1)
                    }))
                });
            }

            // 4. Padrão de tempo de resolução
            const resolutionTimes = tickets
                .filter(t => t.resolved_at && t.created_at)
                .map(t => (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60));

            if (resolutionTimes.length >= 10) {
                const avgTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
                const sortedTimes = [...resolutionTimes].sort((a, b) => a - b);
                const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];

                patterns.push({
                    type: 'resolution_pattern',
                    icon: '⏱️',
                    title: 'Tempo de resolução',
                    insight: `Média: ${avgTime.toFixed(1)}h | Mediana: ${medianTime.toFixed(1)}h`,
                    recommendation: avgTime > 24 ? 'Tempo alto, revisar processos' : 'Tempo adequado',
                    data: {
                        avg: avgTime,
                        median: medianTime,
                        p90: sortedTimes[Math.floor(sortedTimes.length * 0.9)]
                    }
                });
            }

            return {
                success: true,
                patterns,
                timestamp: new Date().toISOString()
            };
        },

        /**
         * Gerar Insights Automáticos
         * Combina análises para gerar insights acionáveis
         */
        generateInsights(tickets) {
            if (!tickets || tickets.length === 0) {
                return { success: false, insights: [] };
            }

            const insights = [];
            const now = new Date();

            // Métricas básicas
            const total = tickets.length;
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status))).length;
            const resolutionRate = (resolved / total) * 100;

            // 1. Insight de produtividade
            if (resolutionRate < 50) {
                insights.push({
                    type: 'productivity',
                    priority: 'high',
                    icon: '📉',
                    title: 'Taxa de resolução baixa',
                    description: `Apenas ${resolutionRate.toFixed(1)}% dos tickets foram resolvidos`,
                    action: 'Verificar gargalos no processo de resolução'
                });
            } else if (resolutionRate > 80) {
                insights.push({
                    type: 'productivity',
                    priority: 'info',
                    icon: '🌟',
                    title: 'Excelente taxa de resolução',
                    description: `${resolutionRate.toFixed(1)}% dos tickets resolvidos`,
                    action: 'Manter o bom trabalho!'
                });
            }

            // 2. Insight de SLA
            const withResponse = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (withResponse.length > 0) {
                const withinSLA = withResponse.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time <= 4;
                }).length;
                const slaRate = (withinSLA / withResponse.length) * 100;

                if (slaRate < 70) {
                    insights.push({
                        type: 'sla',
                        priority: 'high',
                        icon: '⚠️',
                        title: 'SLA precisa de atenção',
                        description: `Apenas ${slaRate.toFixed(1)}% dentro do SLA`,
                        action: 'Priorizar respostas rápidas, especialmente em tickets urgentes'
                    });
                }
            }

            // 3. Insight de backlog
            const backlog = tickets.filter(t => ![4, 5].includes(Number(t.status))).length;
            const backlogPercent = (backlog / total) * 100;

            if (backlogPercent > 40) {
                insights.push({
                    type: 'backlog',
                    priority: 'medium',
                    icon: '📚',
                    title: 'Backlog elevado',
                    description: `${backlog} tickets em aberto (${backlogPercent.toFixed(1)}%)`,
                    action: 'Considerar redistribuição ou aumento de capacidade'
                });
            }

            // 4. Insight de urgentes
            const urgentOpen = tickets.filter(t => t.priority == 4 && ![4, 5].includes(Number(t.status)));
            if (urgentOpen.length > 0) {
                insights.push({
                    type: 'urgent',
                    priority: 'critical',
                    icon: '🔴',
                    title: `${urgentOpen.length} urgentes pendentes`,
                    description: 'Tickets de alta prioridade aguardando resolução',
                    action: 'Resolver urgentes primeiro - impacto direto no cliente'
                });
            }

            // 5. Insight de tendência
            const last7Days = tickets.filter(t => {
                if (!t.created_at) return false;
                const age = (now - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
                return age <= 7;
            }).length;

            const previous7Days = tickets.filter(t => {
                if (!t.created_at) return false;
                const age = (now - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
                return age > 7 && age <= 14;
            }).length;

            if (previous7Days > 0) {
                const change = ((last7Days - previous7Days) / previous7Days) * 100;

                if (Math.abs(change) > 20) {
                    insights.push({
                        type: 'trend',
                        priority: change > 0 ? 'medium' : 'info',
                        icon: change > 0 ? '📈' : '📉',
                        title: `Volume ${change > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(change).toFixed(0)}%`,
                        description: `Última semana: ${last7Days} | Semana anterior: ${previous7Days}`,
                        action: change > 0 ? 'Preparar equipe para maior demanda' : 'Oportunidade para reduzir backlog'
                    });
                }
            }

            // Ordenar por prioridade
            const priorityOrder = { critical: 0, high: 1, medium: 2, info: 3 };
            insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            return {
                success: true,
                insights,
                summary: {
                    total: insights.length,
                    critical: insights.filter(i => i.priority === 'critical').length,
                    high: insights.filter(i => i.priority === 'high').length,
                    actionRequired: insights.filter(i => ['critical', 'high'].includes(i.priority)).length
                },
                timestamp: new Date().toISOString()
            };
        },

        /**
         * Sugestões Proativas
         * Gera sugestões baseadas no contexto atual
         */
        getProactiveSuggestions(tickets, userContext = {}) {
            const suggestions = [];

            if (!tickets || tickets.length === 0) {
                return [{ text: 'Carregue dados para começar', action: 'load_data' }];
            }

            const now = new Date();
            const hour = now.getHours();

            // Sugestão baseada no horário
            if (hour === 9) {
                suggestions.push({
                    text: '☕ Bom dia! Veja o resumo de ontem',
                    action: 'summary_yesterday'
                });
            }

            // Sugestão baseada em urgentes
            const urgentOpen = tickets.filter(t => t.priority == 4 && ![4, 5].includes(Number(t.status)));
            if (urgentOpen.length > 0) {
                suggestions.push({
                    text: `🚨 ${urgentOpen.length} urgentes aguardando`,
                    action: 'show_urgent'
                });
            }

            // Sugestão baseada no SLA
            const pendingWithoutResponse = tickets.filter(t => {
                if ([4, 5].includes(Number(t.status))) return false;
                if (t.stats_first_responded_at) return false;
                if (!t.created_at) return false;
                const age = (now - new Date(t.created_at)) / (1000 * 60 * 60);
                return age > 2; // Mais de 2h
            });

            if (pendingWithoutResponse.length > 0) {
                suggestions.push({
                    text: `⏰ ${pendingWithoutResponse.length} tickets próximos do SLA`,
                    action: 'show_sla_risk'
                });
            }

            // Sugestão baseada no contexto do usuário
            if (userContext.lastIntent === 'sla') {
                suggestions.push({
                    text: '📊 Ver SLA por pessoa',
                    action: 'sla_by_person'
                });
            }

            // Sugestões padrão se não houver nada específico
            if (suggestions.length === 0) {
                suggestions.push(
                    { text: '📊 Ver resumo geral', action: 'summary' },
                    { text: '🔮 Previsão de volume', action: 'prediction' },
                    { text: '🏆 Ver ranking', action: 'ranking' }
                );
            }

            return suggestions.slice(0, 4);
        },

        /**
         * Formatação de Respostas Inteligentes
         */
        formatIntelligentResponse(type, data) {
            switch (type) {
                case 'prediction':
                    return this.formatPredictionResponse(data);
                case 'anomalies':
                    return this.formatAnomaliesResponse(data);
                case 'patterns':
                    return this.formatPatternsResponse(data);
                case 'insights':
                    return this.formatInsightsResponse(data);
                default:
                    return JSON.stringify(data, null, 2);
            }
        },

        formatPredictionResponse(data) {
            if (!data.success) {
                return `⚠️ ${data.message}`;
            }

            const { predictions, summary, historical } = data;

            let html = `
                <div style="margin-bottom:12px">
                    <span class="try-ai-badge">🔮 PREVISÃO IA</span>
                    <strong>Próximos ${predictions.length} dias</strong>
                </div>
                
                <div class="try-metrics-grid" style="margin-bottom:12px">
                    <div class="try-metric-card">
                        <div class="try-metric-value">${summary.totalPredicted}</div>
                        <div class="try-metric-label">Total Previsto</div>
                    </div>
                    <div class="try-metric-card">
                        <div class="try-metric-value">${summary.avgDaily}</div>
                        <div class="try-metric-label">Média/Dia</div>
                    </div>
                </div>
                
                <div style="font-size:0.85rem;margin-bottom:8px">
                    ${summary.trend} <span style="color:var(--try-text-muted)">(tendência: ${summary.trendValue}/dia)</span>
                </div>
                
                <div style="font-size:0.8rem;color:var(--try-text-muted);border-top:1px solid var(--try-border);padding-top:8px;margin-top:8px">
                    📊 Histórico: ${historical.avgLast7}/dia (7 dias) | ${historical.avgLast30}/dia (30 dias)
                </div>
            `;

            return html;
        },

        formatAnomaliesResponse(data) {
            if (!data.success || data.anomalies.length === 0) {
                return `
                    <div class="try-alert try-success-alert">
                        ✅ Nenhuma anomalia detectada! Sistema operando normalmente.
                    </div>
                `;
            }

            let html = `
                <div style="margin-bottom:12px">
                    <span class="try-ai-badge">🔍 ANÁLISE</span>
                    <strong>${data.anomalies.length} anomalia(s) detectada(s)</strong>
                </div>
            `;

            data.anomalies.forEach(anomaly => {
                const severityColor = anomaly.severity === 'critical' ? 'var(--try-danger)' : 'var(--try-warning)';
                html += `
                    <div class="try-alert" style="border-color:${severityColor};background:${severityColor}15">
                        <span style="font-size:1.2rem">${anomaly.icon}</span>
                        <div>
                            <strong style="color:${severityColor}">${anomaly.title}</strong>
                            <div style="font-size:0.8rem;opacity:0.8">${anomaly.description}</div>
                        </div>
                    </div>
                `;
            });

            return html;
        },

        formatPatternsResponse(data) {
            if (!data.success || data.patterns.length === 0) {
                return '⚠️ Dados insuficientes para detectar padrões.';
            }

            let html = `
                <div style="margin-bottom:12px">
                    <span class="try-ai-badge agent">📊 PADRÕES</span>
                    <strong>Padrões identificados</strong>
                </div>
            `;

            data.patterns.forEach(pattern => {
                html += `
                    <div style="background:var(--try-surface);border-radius:10px;padding:10px;margin-bottom:8px;border:1px solid var(--try-border)">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                            <span style="font-size:1.1rem">${pattern.icon}</span>
                            <strong style="font-size:0.9rem">${pattern.title}</strong>
                        </div>
                        <div style="font-size:0.85rem;margin-bottom:4px">${pattern.insight}</div>
                        <div style="font-size:0.75rem;color:var(--try-secondary)">💡 ${pattern.recommendation}</div>
                    </div>
                `;
            });

            return html;
        },

        formatInsightsResponse(data) {
            if (!data.success || data.insights.length === 0) {
                return '✅ Tudo operando dentro do esperado!';
            }

            let html = `
                <div style="margin-bottom:12px">
                    <span class="try-ai-badge">💡 INSIGHTS</span>
                    <strong>${data.summary.actionRequired} ação(ões) recomendada(s)</strong>
                </div>
            `;

            data.insights.slice(0, 5).forEach(insight => {
                const colors = {
                    critical: 'var(--try-danger)',
                    high: 'var(--try-warning)',
                    medium: 'var(--try-secondary)',
                    info: 'var(--try-success)'
                };
                const color = colors[insight.priority];

                html += `
                    <div style="background:var(--try-surface);border-radius:10px;padding:10px;margin-bottom:8px;border-left:3px solid ${color}">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                            <span style="font-size:1.1rem">${insight.icon}</span>
                            <strong style="font-size:0.9rem;color:${color}">${insight.title}</strong>
                        </div>
                        <div style="font-size:0.85rem;margin-bottom:4px">${insight.description}</div>
                        <div style="font-size:0.75rem;color:var(--try-text-muted)">🎯 ${insight.action}</div>
                    </div>
                `;
            });

            return html;
        },

        // ============ UTILITÁRIOS ============

        getDailyCounts(tickets, days) {
            const counts = {};
            const now = new Date();

            for (let i = 0; i < days; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const key = date.toISOString().slice(0, 10);
                counts[key] = 0;
            }

            tickets.forEach(t => {
                if (t.created_at) {
                    const key = t.created_at.slice(0, 10);
                    if (counts.hasOwnProperty(key)) {
                        counts[key]++;
                    }
                }
            });

            return counts;
        },

        calculateMovingAverage(values, window) {
            const result = [];
            for (let i = window - 1; i < values.length; i++) {
                const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
                result.push(sum / window);
            }
            return result;
        },

        calculateTrend(values) {
            const n = values.length;
            if (n < 2) return { slope: 0, intercept: 0 };

            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

            for (let i = 0; i < n; i++) {
                sumX += i;
                sumY += values[i];
                sumXY += i * values[i];
                sumX2 += i * i;
            }

            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            return { slope, intercept };
        },

        calculateStats(values) {
            if (values.length === 0) return { mean: 0, stdDev: 0 };

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            return { mean, stdDev };
        },

        calculateConfidence(values, daysAhead) {
            // Confiança diminui com o tempo
            const baseConfidence = 90;
            const decay = daysAhead * 5;
            return Math.max(50, baseConfidence - decay);
        },

        calculateOverallConfidence(values) {
            const stats = this.calculateStats(values);
            // Mais dados = maior confiança
            const dataFactor = Math.min(1, values.length / 30);
            // Menor variação = maior confiança
            const variationFactor = stats.mean > 0 ? Math.max(0.5, 1 - (stats.stdDev / stats.mean)) : 0.5;

            return Math.round((dataFactor * 0.4 + variationFactor * 0.6) * 100);
        }
    };

    // Expor globalmente
    window.TryvianoIntelligence = TryvianoIntelligence;

    // Integrar com TryvianoPremium se existir
    if (window.TryvianoPremium) {
        window.TryvianoPremium.intelligence = TryvianoIntelligence;
    }

    // Iniciar monitoramento proativo se houver permissão
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Sistema de Monitoramento Proativo
    TryvianoIntelligence.monitoringInterval = null;
    
    TryvianoIntelligence.startMonitoring = function () {
        // Limpar intervalo anterior se existir
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        console.log('👁️ Monitoramento proativo iniciado...');

        // Verificar a cada 5 minutos
        this.monitoringInterval = setInterval(() => {
            const tickets = window.allTicketsCache || [];
            if (tickets.length === 0) return;

            const analysis = this.detectAnomalies(tickets);

            if (analysis.success && analysis.anomalies.length > 0) {
                // Filtrar apenas críticas ou warnings novos
                const critical = analysis.anomalies.filter(a => a.severity === 'critical');

                if (critical.length > 0) {
                    this.sendNotification(
                        '🚨 Atenção Necessária',
                        `${critical.length} anomalias críticas detectadas no atendimento.`
                    );
                }
            }
        }, 5 * 60 * 1000);
    };
    
    TryvianoIntelligence.stopMonitoring = function () {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('👁️ Monitoramento proativo parado.');
        }
    };

    TryvianoIntelligence.sendNotification = function (title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'assets/tryviano-icon.png' // Ajustar caminho se necessário
            });
        } else if (window.showToast) {
            window.showToast(`${title}: ${body}`, 'warning');
        }
    };

    // Iniciar após breve delay para garantir carregamento
    setTimeout(() => TryvianoIntelligence.startMonitoring(), 10000);

    console.log('🧠 Módulo de Inteligência Tryviano carregado!');

})();
