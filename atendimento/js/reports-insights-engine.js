/**
 * Reports Insights Engine - Motor de Análise Inteligente para Relatórios
 * Gera insights, diagnósticos e recomendações automáticas baseadas nos dados
 */

class ReportsInsightsEngine {
    constructor() {
        this.thresholds = {
            slaGood: 90,
            slaWarning: 70,
            resolutionGood: 80,
            resolutionWarning: 60,
            backlogCriticalDays: 7,
            backlogDangerDays: 14,
            trendSignificant: 15, // % de variação significativa
            highVolumeMultiplier: 1.5 // 50% acima da média = alto volume
        };
    }

    // ==================== ANÁLISE EXECUTIVA ====================
    analyzeExecutive(data, mode) {
        const insights = [];
        const recommendations = [];
        const alerts = [];
        
        const total = data.length;
        const resolved = data.filter(t => [4, 5].includes(Number(t.status))).length;
        const pending = total - resolved;
        const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

        // Análise de Taxa de Resolução
        if (resolutionRate >= this.thresholds.resolutionGood) {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'Excelente Taxa de Resolução',
                text: `A taxa de resolução está em ${resolutionRate.toFixed(1)}%, acima da meta de ${this.thresholds.resolutionGood}%. A equipe está performando muito bem.`,
                metric: resolutionRate.toFixed(1) + '%'
            });
        } else if (resolutionRate >= this.thresholds.resolutionWarning) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Taxa de Resolução Moderada',
                text: `A taxa está em ${resolutionRate.toFixed(1)}%. Há espaço para melhoria. Analise os gargalos no processo.`,
                metric: resolutionRate.toFixed(1) + '%'
            });
            recommendations.push('Revisar tickets parados há mais de 3 dias para identificar bloqueios');
        } else {
            alerts.push({
                type: 'danger',
                icon: '🚨',
                title: 'Taxa de Resolução Crítica',
                text: `Apenas ${resolutionRate.toFixed(1)}% dos tickets foram resolvidos. Isso indica problemas sérios no fluxo de atendimento.`,
                metric: resolutionRate.toFixed(1) + '%'
            });
            recommendations.push('URGENTE: Realizar reunião com a equipe para identificar causas do baixo desempenho');
            recommendations.push('Considerar redistribuição de tickets entre agentes');
        }

        // Análise de Backlog
        const backlogRatio = total > 0 ? (pending / total) * 100 : 0;
        if (pending > resolved) {
            alerts.push({
                type: 'warning',
                icon: '📊',
                title: 'Backlog Acumulando',
                text: `Existem ${pending} tickets pendentes contra ${resolved} resolvidos. O backlog está crescendo e pode virar uma bola de neve.`,
                metric: `${pending} pendentes`
            });
            recommendations.push('Priorizar resolução de tickets antigos antes de pegar novos');
        }

        // Análise de SLA
        const slaData = this.calculateSLAMetrics(data);
        if (slaData.rate < this.thresholds.slaWarning) {
            alerts.push({
                type: 'danger',
                icon: '⏱️',
                title: 'SLA em Risco',
                text: `O SLA de primeira resposta está em ${slaData.rate.toFixed(1)}%, bem abaixo da meta de ${this.thresholds.slaGood}%. Isso pode afetar a satisfação dos clientes.`,
                metric: slaData.rate.toFixed(1) + '%'
            });
            recommendations.push('Configurar alertas para tickets próximos de vencer SLA');
            recommendations.push('Aumentar frequência de verificação da fila de tickets');
        } else if (slaData.rate < this.thresholds.slaGood) {
            insights.push({
                type: 'warning',
                icon: '⏱️',
                title: 'SLA Precisa de Atenção',
                text: `SLA em ${slaData.rate.toFixed(1)}%. Está razoável mas pode melhorar com pequenos ajustes no processo.`,
                metric: slaData.rate.toFixed(1) + '%'
            });
        } else {
            insights.push({
                type: 'success',
                icon: '⏱️',
                title: 'SLA Dentro da Meta',
                text: `Excelente! ${slaData.rate.toFixed(1)}% dos tickets foram respondidos dentro do prazo.`,
                metric: slaData.rate.toFixed(1) + '%'
            });
        }

        // Análise de Prioridades
        const priorityAnalysis = this.analyzePriorities(data);
        if (priorityAnalysis.urgentPending > 0) {
            alerts.push({
                type: 'danger',
                icon: '🔴',
                title: 'Tickets Urgentes Pendentes',
                text: `Existem ${priorityAnalysis.urgentPending} tickets URGENTES ainda não resolvidos. Estes devem ser tratados imediatamente.`,
                metric: priorityAnalysis.urgentPending + ' urgentes'
            });
            recommendations.push('Focar primeiro nos tickets urgentes antes de qualquer outra tarefa');
        }

        // Análise de Distribuição por Time/Pessoa
        const teamAnalysis = this.analyzeTeamDistribution(data, mode);
        if (teamAnalysis.imbalance) {
            insights.push({
                type: 'info',
                icon: '👥',
                title: 'Distribuição Desbalanceada',
                text: `${teamAnalysis.topTeam} está com ${teamAnalysis.topCount} tickets (${teamAnalysis.topPercent.toFixed(0)}% do total). Considere redistribuir a carga.`,
                metric: teamAnalysis.topPercent.toFixed(0) + '% concentrado'
            });
            recommendations.push(`Avaliar se ${teamAnalysis.topTeam} precisa de suporte adicional`);
        }

        // Resumo Executivo
        const summary = this.generateExecutiveSummary(data, resolutionRate, slaData.rate, pending);

        return { insights, recommendations, alerts, summary, metrics: {
            total, resolved, pending, resolutionRate, slaRate: slaData.rate,
            slaOk: slaData.ok, slaTotal: slaData.total
        }};
    }

    // ==================== ANÁLISE DE PERFORMANCE ====================
    analyzePerformance(data, mode) {
        const insights = [];
        const recommendations = [];
        const alerts = [];

        // Calcular métricas por agente
        const agentStats = this.calculateAgentMetrics(data);
        const agents = Object.entries(agentStats).map(([name, stats]) => ({
            name, ...stats,
            rate: stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0,
            avgHours: stats.resolutionTimes.length > 0 
                ? stats.resolutionTimes.reduce((a, b) => a + b, 0) / stats.resolutionTimes.length 
                : null
        })).sort((a, b) => b.total - a.total);

        if (agents.length === 0) {
            return { insights: [], recommendations: [], alerts: [], agents: [], teamStats: {} };
        }

        // Top performer
        const topByVolume = agents[0];
        const topByRate = [...agents].filter(a => a.total >= 5).sort((a, b) => b.rate - a.rate)[0];
        const topBySpeed = [...agents].filter(a => a.avgHours !== null).sort((a, b) => a.avgHours - b.avgHours)[0];

        if (topByVolume) {
            insights.push({
                type: 'success',
                icon: '🏆',
                title: 'Maior Volume de Atendimento',
                text: `${topByVolume.name} lidera em volume com ${topByVolume.total} tickets atendidos no período.`,
                metric: topByVolume.total + ' tickets'
            });
        }

        if (topByRate && topByRate.rate >= 80) {
            insights.push({
                type: 'success',
                icon: '⭐',
                title: 'Melhor Taxa de Resolução',
                text: `${topByRate.name} tem a melhor eficiência com ${topByRate.rate.toFixed(1)}% de resolução.`,
                metric: topByRate.rate.toFixed(1) + '%'
            });
        }

        if (topBySpeed && topBySpeed.avgHours !== null) {
            insights.push({
                type: 'info',
                icon: '⚡',
                title: 'Resolução Mais Rápida',
                text: `${topBySpeed.name} resolve tickets em média em ${topBySpeed.avgHours.toFixed(1)} horas.`,
                metric: topBySpeed.avgHours.toFixed(1) + 'h'
            });
        }

        // Identificar quem precisa de ajuda
        const struggling = agents.filter(a => a.total >= 5 && a.rate < 50);
        if (struggling.length > 0) {
            alerts.push({
                type: 'warning',
                icon: '📉',
                title: 'Agentes com Baixa Performance',
                text: `${struggling.map(a => a.name).join(', ')} ${struggling.length === 1 ? 'está' : 'estão'} com taxa de resolução abaixo de 50%. Pode precisar de suporte ou treinamento.`,
                metric: struggling.length + ' agente(s)'
            });
            recommendations.push('Agendar 1:1 com agentes de baixa performance para entender dificuldades');
            recommendations.push('Verificar se tickets atribuídos a eles são compatíveis com seu nível');
        }

        // Análise de carga de trabalho
        const avgLoad = agents.reduce((sum, a) => sum + a.total, 0) / agents.length;
        const overloaded = agents.filter(a => a.total > avgLoad * 1.5);
        const underloaded = agents.filter(a => a.total < avgLoad * 0.5 && a.total > 0);

        if (overloaded.length > 0) {
            insights.push({
                type: 'warning',
                icon: '⚖️',
                title: 'Sobrecarga Detectada',
                text: `${overloaded.map(a => a.name).join(', ')} ${overloaded.length === 1 ? 'está' : 'estão'} com carga 50% acima da média da equipe.`,
                metric: 'Desbalanceado'
            });
            recommendations.push('Redistribuir tickets dos agentes sobrecarregados');
        }

        // Calcular métricas por time
        const teamStats = this.calculateTeamMetrics(data, mode);

        return { insights, recommendations, alerts, agents, teamStats, avgLoad };
    }

    // ==================== ANÁLISE DE SLA ====================
    analyzeSLA(data) {
        const insights = [];
        const recommendations = [];
        const alerts = [];

        // Métricas de SLA detalhadas
        const slaMetrics = this.calculateDetailedSLAMetrics(data);

        // Análise geral
        if (slaMetrics.firstResponse.rate >= this.thresholds.slaGood) {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'SLA de Primeira Resposta Excelente',
                text: `${slaMetrics.firstResponse.rate.toFixed(1)}% dos tickets foram respondidos dentro do prazo. A equipe está ágil no primeiro contato.`,
                metric: slaMetrics.firstResponse.rate.toFixed(1) + '%'
            });
        } else if (slaMetrics.firstResponse.rate >= this.thresholds.slaWarning) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'SLA de Primeira Resposta Moderado',
                text: `${slaMetrics.firstResponse.rate.toFixed(1)}% no prazo. Há margem para melhoria na velocidade de primeira resposta.`,
                metric: slaMetrics.firstResponse.rate.toFixed(1) + '%'
            });
            recommendations.push('Monitorar fila de tickets novos com mais frequência');
        } else {
            alerts.push({
                type: 'danger',
                icon: '🚨',
                title: 'SLA de Primeira Resposta Crítico',
                text: `Apenas ${slaMetrics.firstResponse.rate.toFixed(1)}% no prazo! Muitos clientes estão esperando demais pela primeira resposta.`,
                metric: slaMetrics.firstResponse.rate.toFixed(1) + '%'
            });
            recommendations.push('URGENTE: Implementar sistema de notificação para tickets não respondidos');
            recommendations.push('Considerar automação de primeira resposta para horários de pico');
        }

        // Análise por prioridade
        const prioritySLA = slaMetrics.byPriority;
        const urgentViolations = prioritySLA['Urgente']?.violated || 0;
        if (urgentViolations > 0) {
            alerts.push({
                type: 'danger',
                icon: '🔴',
                title: 'Violações em Tickets Urgentes',
                text: `${urgentViolations} tickets URGENTES violaram o SLA. Isso é inaceitável e requer ação imediata.`,
                metric: urgentViolations + ' violações'
            });
            recommendations.push('Criar regra de escalonamento automático para tickets urgentes');
        }

        // Tempo médio de resposta
        if (slaMetrics.avgResponseTime !== null) {
            const avgHours = slaMetrics.avgResponseTime;
            insights.push({
                type: avgHours <= 4 ? 'success' : avgHours <= 12 ? 'info' : 'warning',
                icon: '⏳',
                title: 'Tempo Médio de Primeira Resposta',
                text: avgHours <= 4 
                    ? `Excelente! Média de ${avgHours.toFixed(1)} horas para primeira resposta.`
                    : `A primeira resposta leva em média ${avgHours.toFixed(1)} horas. ${avgHours > 12 ? 'Isso pode frustrar clientes.' : ''}`,
                metric: avgHours.toFixed(1) + 'h'
            });
        }

        // Violações recentes
        const violations = data.filter(t => {
            if (!t.fr_due_by) return false;
            const responded = t.stats_first_responded_at ? new Date(t.stats_first_responded_at) : null;
            const due = new Date(t.fr_due_by);
            return !responded || responded > due;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return { insights, recommendations, alerts, metrics: slaMetrics, violations };
    }

    // ==================== ANÁLISE DE TENDÊNCIAS ====================
    analyzeTrends(data) {
        const insights = [];
        const recommendations = [];
        const alerts = [];

        // Agrupar por dia
        const dailyVolume = {};
        data.forEach(t => {
            const date = new Date(t.created_at).toISOString().split('T')[0];
            dailyVolume[date] = (dailyVolume[date] || 0) + 1;
        });

        const sortedDays = Object.keys(dailyVolume).sort();
        if (sortedDays.length < 3) {
            return { insights: [{ type: 'info', icon: 'ℹ️', title: 'Dados Insuficientes', text: 'Precisa de pelo menos 3 dias de dados para análise de tendências.' }], recommendations: [], alerts: [], dailyVolume, trend: 0 };
        }

        // Calcular tendência
        const recentDays = sortedDays.slice(-7);
        const olderDays = sortedDays.slice(-14, -7);
        const recentAvg = recentDays.reduce((sum, d) => sum + dailyVolume[d], 0) / recentDays.length;
        const olderAvg = olderDays.length > 0 ? olderDays.reduce((sum, d) => sum + dailyVolume[d], 0) / olderDays.length : recentAvg;
        const trendPercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

        // Análise de tendência
        if (Math.abs(trendPercent) >= this.thresholds.trendSignificant) {
            if (trendPercent > 0) {
                alerts.push({
                    type: 'warning',
                    icon: '📈',
                    title: 'Volume Crescendo Significativamente',
                    text: `O volume de tickets aumentou ${trendPercent.toFixed(0)}% nos últimos 7 dias comparado à semana anterior. Média atual: ${recentAvg.toFixed(1)} tickets/dia.`,
                    metric: '+' + trendPercent.toFixed(0) + '%'
                });
                recommendations.push('Investigar causa do aumento (problema no produto? campanha? sazonalidade?)');
                recommendations.push('Considerar reforço temporário na equipe se tendência continuar');
            } else {
                insights.push({
                    type: 'success',
                    icon: '📉',
                    title: 'Volume Diminuindo',
                    text: `O volume caiu ${Math.abs(trendPercent).toFixed(0)}% nos últimos 7 dias. Pode indicar melhoria no produto ou menos problemas.`,
                    metric: trendPercent.toFixed(0) + '%'
                });
            }
        } else {
            insights.push({
                type: 'info',
                icon: '📊',
                title: 'Volume Estável',
                text: `O volume está estável com variação de apenas ${trendPercent.toFixed(0)}%. Média de ${recentAvg.toFixed(1)} tickets por dia.`,
                metric: recentAvg.toFixed(1) + '/dia'
            });
        }

        // Análise de dias da semana
        const dayOfWeekStats = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        data.forEach(t => {
            const day = new Date(t.created_at).getDay();
            dayOfWeekStats[day]++;
        });
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const busiestDay = Object.entries(dayOfWeekStats).sort((a, b) => b[1] - a[1])[0];
        const quietestDay = Object.entries(dayOfWeekStats).sort((a, b) => a[1] - b[1])[0];

        insights.push({
            type: 'info',
            icon: '📅',
            title: 'Padrão Semanal Identificado',
            text: `${dayNames[busiestDay[0]]} é o dia mais movimentado (${busiestDay[1]} tickets) e ${dayNames[quietestDay[0]]} é o mais tranquilo (${quietestDay[1]} tickets).`,
            metric: dayNames[busiestDay[0]]
        });

        if (dayOfWeekStats[0] > 0 || dayOfWeekStats[6] > 0) {
            const weekendTotal = dayOfWeekStats[0] + dayOfWeekStats[6];
            insights.push({
                type: 'info',
                icon: '🗓️',
                title: 'Tickets no Final de Semana',
                text: `${weekendTotal} tickets foram abertos no fim de semana. Considere se há cobertura adequada.`,
                metric: weekendTotal + ' no FDS'
            });
        }

        // Projeção
        const projection = this.calculateProjection(sortedDays, dailyVolume, recentAvg);

        return { 
            insights, recommendations, alerts, 
            dailyVolume, trend: trendPercent, 
            dayOfWeekStats, busiestDay: dayNames[busiestDay[0]], 
            projection, avgDaily: recentAvg 
        };
    }

    // ==================== ANÁLISE DE BACKLOG ====================
    analyzeBacklog(data) {
        const insights = [];
        const recommendations = [];
        const alerts = [];

        const now = new Date();
        const pending = data.filter(t => ![4, 5].includes(Number(t.status)));
        
        if (pending.length === 0) {
            return { 
                insights: [{ type: 'success', icon: '🎉', title: 'Backlog Zerado!', text: 'Não há tickets pendentes. Excelente trabalho da equipe!' }], 
                recommendations: [], alerts: [], aging: {}, criticalTickets: [], pending: [] 
            };
        }

        // Análise de aging
        const aging = {
            '0-3 dias': { count: 0, tickets: [] },
            '4-7 dias': { count: 0, tickets: [] },
            '8-14 dias': { count: 0, tickets: [] },
            '15-30 dias': { count: 0, tickets: [] },
            '>30 dias': { count: 0, tickets: [] }
        };

        pending.forEach(t => {
            const days = Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
            const ticketInfo = { ...t, daysOld: days };
            
            if (days <= 3) aging['0-3 dias'].tickets.push(ticketInfo);
            else if (days <= 7) aging['4-7 dias'].tickets.push(ticketInfo);
            else if (days <= 14) aging['8-14 dias'].tickets.push(ticketInfo);
            else if (days <= 30) aging['15-30 dias'].tickets.push(ticketInfo);
            else aging['>30 dias'].tickets.push(ticketInfo);
        });

        Object.keys(aging).forEach(k => aging[k].count = aging[k].tickets.length);

        // Análise de saúde do backlog
        const criticalCount = aging['8-14 dias'].count + aging['15-30 dias'].count + aging['>30 dias'].count;
        const criticalPercent = (criticalCount / pending.length) * 100;

        if (criticalPercent > 30) {
            alerts.push({
                type: 'danger',
                icon: '🚨',
                title: 'Backlog em Estado Crítico',
                text: `${criticalPercent.toFixed(0)}% do backlog (${criticalCount} tickets) está com mais de 7 dias. Isso indica problemas graves no fluxo de resolução.`,
                metric: criticalCount + ' críticos'
            });
            recommendations.push('URGENTE: Organizar força-tarefa para limpar tickets antigos');
            recommendations.push('Identificar e resolver bloqueios que impedem a resolução');
        } else if (criticalPercent > 15) {
            alerts.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Backlog Acumulando',
                text: `${criticalCount} tickets (${criticalPercent.toFixed(0)}%) estão há mais de 7 dias sem resolução. Tendência preocupante.`,
                metric: criticalCount + ' antigos'
            });
            recommendations.push('Priorizar resolução de tickets com mais de 7 dias');
        } else {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'Backlog Saudável',
                text: `Apenas ${criticalPercent.toFixed(0)}% do backlog está acima de 7 dias. O fluxo de resolução está funcionando bem.`,
                metric: criticalPercent.toFixed(0) + '% antigos'
            });
        }

        // Tickets muito antigos (>30 dias)
        if (aging['>30 dias'].count > 0) {
            alerts.push({
                type: 'danger',
                icon: '💀',
                title: 'Tickets Muito Antigos',
                text: `${aging['>30 dias'].count} tickets estão pendentes há mais de 30 dias! Estes precisam de atenção especial.`,
                metric: aging['>30 dias'].count + ' tickets'
            });
            recommendations.push('Revisar tickets >30 dias - podem precisar de escalonamento ou fechamento');
        }

        // Idade média
        const avgAge = pending.reduce((sum, t) => {
            return sum + Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
        }, 0) / pending.length;

        insights.push({
            type: avgAge <= 5 ? 'success' : avgAge <= 10 ? 'info' : 'warning',
            icon: '📊',
            title: 'Idade Média do Backlog',
            text: `Os tickets pendentes têm em média ${avgAge.toFixed(1)} dias. ${avgAge > 10 ? 'Isso indica lentidão no processamento.' : 'Está dentro do esperado.'}`,
            metric: avgAge.toFixed(1) + ' dias'
        });

        // Estimativa de limpeza
        const resolvedLast7Days = data.filter(t => {
            if (![4, 5].includes(Number(t.status))) return false;
            const resolved = t.stats_resolved_at ? new Date(t.stats_resolved_at) : null;
            if (!resolved) return false;
            const daysAgo = (now - resolved) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
        }).length;

        const dailyResolutionRate = resolvedLast7Days / 7;
        const daysToClean = dailyResolutionRate > 0 ? Math.ceil(pending.length / dailyResolutionRate) : null;

        if (daysToClean) {
            insights.push({
                type: 'info',
                icon: '🧮',
                title: 'Estimativa de Limpeza',
                text: `No ritmo atual (${dailyResolutionRate.toFixed(1)} tickets/dia), o backlog seria zerado em aproximadamente ${daysToClean} dias, se nenhum novo ticket chegasse.`,
                metric: daysToClean + ' dias'
            });
        }

        // Priorização inteligente (tickets que precisam de atenção primeiro)
        const priorityScore = (t) => {
            let score = 0;
            const days = Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
            score += days * 10; // Mais antigo = mais urgente
            score += (5 - (t.priority || 2)) * 20; // Maior prioridade = mais urgente
            if (t.fr_escalated) score += 50; // SLA violado
            return score;
        };

        const criticalTickets = pending
            .map(t => ({ ...t, urgencyScore: priorityScore(t), daysOld: Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24)) }))
            .sort((a, b) => b.urgencyScore - a.urgencyScore)
            .slice(0, 20);

        return { insights, recommendations, alerts, aging, criticalTickets, pending, avgAge, daysToClean };
    }

    // ==================== HELPERS ====================
    calculateSLAMetrics(data) {
        let ok = 0, total = 0;
        data.forEach(t => {
            if (t.fr_due_by) {
                total++;
                const responded = t.stats_first_responded_at ? new Date(t.stats_first_responded_at) : null;
                const due = new Date(t.fr_due_by);
                if (responded && responded <= due) ok++;
            }
        });
        return { ok, total, rate: total > 0 ? (ok / total) * 100 : 100 };
    }

    calculateDetailedSLAMetrics(data) {
        let firstResponseOK = 0, firstResponseTotal = 0;
        let resolutionOK = 0, resolutionTotal = 0;
        let totalResponseTime = 0, responseTimeCount = 0;
        const byPriority = {};

        const priorityLabels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };

        data.forEach(t => {
            const priorityLabel = priorityLabels[t.priority] || 'Média';
            if (!byPriority[priorityLabel]) {
                byPriority[priorityLabel] = { ok: 0, violated: 0, total: 0 };
            }

            if (t.fr_due_by) {
                firstResponseTotal++;
                byPriority[priorityLabel].total++;
                const responded = t.stats_first_responded_at ? new Date(t.stats_first_responded_at) : null;
                const due = new Date(t.fr_due_by);
                
                if (responded) {
                    const responseTime = (responded - new Date(t.created_at)) / (1000 * 60 * 60);
                    totalResponseTime += responseTime;
                    responseTimeCount++;
                    
                    if (responded <= due) {
                        firstResponseOK++;
                        byPriority[priorityLabel].ok++;
                    } else {
                        byPriority[priorityLabel].violated++;
                    }
                } else {
                    byPriority[priorityLabel].violated++;
                }
            }

            if (t.due_by) {
                resolutionTotal++;
                const resolved = t.stats_resolved_at ? new Date(t.stats_resolved_at) : null;
                const due = new Date(t.due_by);
                if (resolved && resolved <= due) resolutionOK++;
            }
        });

        return {
            firstResponse: {
                ok: firstResponseOK,
                total: firstResponseTotal,
                rate: firstResponseTotal > 0 ? (firstResponseOK / firstResponseTotal) * 100 : 100
            },
            resolution: {
                ok: resolutionOK,
                total: resolutionTotal,
                rate: resolutionTotal > 0 ? (resolutionOK / resolutionTotal) * 100 : 100
            },
            avgResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : null,
            byPriority
        };
    }

    analyzePriorities(data) {
        const pending = data.filter(t => ![4, 5].includes(Number(t.status)));
        return {
            urgentPending: pending.filter(t => t.priority === 4).length,
            highPending: pending.filter(t => t.priority === 3).length,
            totalPending: pending.length
        };
    }

    analyzeTeamDistribution(data, mode) {
        const stats = {};
        data.forEach(t => {
            let team;
            if (mode === 'tags') {
                team = t.cf_acompanhamento_atendimento || 'Sem Responsável';
            } else {
                team = t.cf_tratativa || 'Sem Time';
            }
            stats[team] = (stats[team] || 0) + 1;
        });

        const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        const topTeam = sorted[0]?.[0] || 'N/A';
        const topCount = sorted[0]?.[1] || 0;
        const topPercent = data.length > 0 ? (topCount / data.length) * 100 : 0;

        return {
            topTeam,
            topCount,
            topPercent,
            imbalance: topPercent > 40 && sorted.length > 2
        };
    }

    calculateAgentMetrics(data) {
        const stats = {};
        data.forEach(t => {
            if (!t.responder_name) return;
            if (!stats[t.responder_name]) {
                stats[t.responder_name] = { total: 0, resolved: 0, resolutionTimes: [] };
            }
            stats[t.responder_name].total++;
            if ([4, 5].includes(Number(t.status))) {
                stats[t.responder_name].resolved++;
                if (t.stats_resolved_at && t.created_at) {
                    const hours = (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    if (hours > 0 && hours < 720) { // Ignora outliers > 30 dias
                        stats[t.responder_name].resolutionTimes.push(hours);
                    }
                }
            }
        });
        return stats;
    }

    calculateTeamMetrics(data, mode) {
        const stats = {};
        data.forEach(t => {
            let team;
            if (mode === 'tags') {
                team = t.cf_acompanhamento_atendimento || 'Sem Responsável';
            } else {
                team = t.cf_tratativa || 'Sem Time';
            }
            if (!stats[team]) {
                stats[team] = { total: 0, resolved: 0, pending: 0 };
            }
            stats[team].total++;
            if ([4, 5].includes(Number(t.status))) {
                stats[team].resolved++;
            } else {
                stats[team].pending++;
            }
        });
        return stats;
    }

    generateExecutiveSummary(data, resolutionRate, slaRate, pending) {
        const health = resolutionRate >= 80 && slaRate >= 90 ? 'excelente' :
                       resolutionRate >= 60 && slaRate >= 70 ? 'bom' :
                       resolutionRate >= 40 && slaRate >= 50 ? 'regular' : 'crítico';

        const healthColor = {
            'excelente': '#10b981',
            'bom': '#3b82f6', 
            'regular': '#f59e0b',
            'crítico': '#ef4444'
        };

        return {
            health,
            healthColor: healthColor[health],
            text: health === 'excelente' 
                ? 'O atendimento está funcionando de forma excelente! Continue monitorando para manter este padrão.'
                : health === 'bom'
                ? 'O atendimento está indo bem, mas há oportunidades de melhoria em alguns indicadores.'
                : health === 'regular'
                ? 'O atendimento precisa de atenção. Alguns indicadores estão abaixo do esperado.'
                : 'ATENÇÃO: O atendimento está em estado crítico e requer ação imediata da gestão.'
        };
    }

    calculateProjection(sortedDays, dailyVolume, avgDaily) {
        // Projeção simples baseada na média
        const next7Days = Math.round(avgDaily * 7);
        const next30Days = Math.round(avgDaily * 30);
        
        return {
            next7Days,
            next30Days,
            dailyAvg: avgDaily
        };
    }
}

// Instância global
window.ReportsInsightsEngine = new ReportsInsightsEngine();
