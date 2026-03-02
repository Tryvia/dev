/**
 * Chatbot Utils - Módulo Compartilhado v1.0
 * Funções comuns entre chatbot.js e chatbot-premium.js
 * Evita duplicação de código e garante consistência
 */

(function() {
    'use strict';

    const ChatbotUtils = {
        // ============================================================
        // CONFIGURAÇÕES DO SISTEMA
        // ============================================================
        
        freshdeskDomain: 'suportetryvia',
        
        // SLA por prioridade (em horas)
        slaPorPrioridade: {
            4: { nome: 'Urgente', resposta: 1, resolucao: 4 },
            3: { nome: 'Alta', resposta: 4, resolucao: 8 },
            2: { nome: 'Média', resposta: 8, resolucao: 24 },
            1: { nome: 'Baixa', resposta: 24, resolucao: 48 }
        },

        // Horário comercial
        horarioComercial: {
            inicio: 8,
            fim: 18,
            diasUteis: [1, 2, 3, 4, 5]
        },

        // Capacidade por pessoa
        capacidadePadrao: 15,

        // Cache de feriados (carregado do Supabase)
        feriadosCache: null,
        feriadosCacheExpiry: null,

        // ============================================================
        // FERIADOS DINÂMICOS (do Supabase)
        // ============================================================

        /**
         * Carrega feriados do Supabase
         */
        async carregarFeriados() {
            // Usar cache se válido (24h)
            if (this.feriadosCache && this.feriadosCacheExpiry > Date.now()) {
                return this.feriadosCache;
            }

            try {
                if (window.supabaseClient) {
                    const anoAtual = new Date().getFullYear();
                    const { data, error } = await window.supabaseClient
                        .from('feriados')
                        .select('data')
                        .gte('ano', anoAtual - 1)
                        .lte('ano', anoAtual + 1);

                    if (!error && data) {
                        this.feriadosCache = data.map(f => f.data);
                        this.feriadosCacheExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24h
                        console.log(`📅 ${this.feriadosCache.length} feriados carregados do Supabase`);
                        return this.feriadosCache;
                    }
                }
            } catch (e) {
                console.warn('⚠️ Erro ao carregar feriados do Supabase:', e);
            }

            // Fallback: feriados hardcoded 2025-2027
            return this.getFeriadosFallback();
        },

        /**
         * Feriados fallback (caso Supabase não disponível)
         */
        getFeriadosFallback() {
            return [
                // 2025
                '2025-01-01', '2025-03-03', '2025-03-04', '2025-04-18', '2025-04-21',
                '2025-05-01', '2025-06-19', '2025-09-07', '2025-10-12', '2025-11-02',
                '2025-11-15', '2025-12-25',
                // 2026
                '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03', '2026-04-21',
                '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
                '2026-11-15', '2026-12-25',
                // 2027
                '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21',
                '2027-05-01', '2027-05-27', '2027-09-07', '2027-10-12', '2027-11-02',
                '2027-11-15', '2027-12-25'
            ];
        },

        /**
         * Verifica se uma data é dia útil
         */
        async isDiaUtil(date) {
            const d = new Date(date);
            const dayOfWeek = d.getDay();
            
            // Fim de semana
            if (dayOfWeek === 0 || dayOfWeek === 6) return false;
            
            // Verificar feriados
            const feriados = await this.carregarFeriados();
            const dateStr = d.toISOString().slice(0, 10);
            return !feriados.includes(dateStr);
        },

        // ============================================================
        // CÁLCULOS DE SLA
        // ============================================================

        /**
         * Obtém limite de SLA baseado na prioridade
         */
        getSLALimit(priority, tipo = 'resposta') {
            const config = this.slaPorPrioridade[priority] || this.slaPorPrioridade[2];
            return config[tipo] || 4;
        },

        /**
         * Verifica se ticket está dentro do SLA
         */
        isWithinSLA(ticket) {
            if (!ticket.stats_first_responded_at || !ticket.created_at) return null;
            
            const responseTime = (new Date(ticket.stats_first_responded_at) - new Date(ticket.created_at)) / (1000 * 60 * 60);
            const slaLimit = this.getSLALimit(ticket.priority, 'resposta');
            
            return responseTime <= slaLimit;
        },

        /**
         * Calcula taxa de SLA de um conjunto de tickets
         */
        calcularTaxaSLA(tickets) {
            const comResposta = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (comResposta.length === 0) return { taxa: 0, dentroSLA: 0, foraSLA: 0, total: 0 };

            let dentroSLA = 0;
            comResposta.forEach(t => {
                if (this.isWithinSLA(t)) dentroSLA++;
            });

            return {
                taxa: ((dentroSLA / comResposta.length) * 100).toFixed(1),
                dentroSLA,
                foraSLA: comResposta.length - dentroSLA,
                total: comResposta.length
            };
        },

        // ============================================================
        // ANÁLISE DE TICKETS
        // ============================================================

        /**
         * Estatísticas rápidas dos tickets
         */
        getQuickStats(tickets) {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            
            const today = tickets.filter(t => t.created_at && t.created_at.slice(0, 10) === todayStr);
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status)));
            const open = tickets.filter(t => ![4, 5].includes(Number(t.status)));
            const urgent = tickets.filter(t => t.priority == 4);
            const urgentOpen = urgent.filter(t => ![4, 5].includes(Number(t.status)));

            // Tempo médio de resposta
            const comResposta = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            let avgResponseTime = 0;
            if (comResposta.length > 0) {
                avgResponseTime = comResposta.reduce((sum, t) => {
                    return sum + (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                }, 0) / comResposta.length;
            }

            const slaStats = this.calcularTaxaSLA(tickets);

            return {
                total: tickets.length,
                today: today.length,
                resolved: resolved.length,
                open: open.length,
                urgent: urgent.length,
                urgentOpen: urgentOpen.length,
                resolutionRate: ((resolved.length / tickets.length) * 100).toFixed(1),
                avgResponseTime: avgResponseTime.toFixed(1),
                slaRate: slaStats.taxa
            };
        },

        /**
         * Detecta anomalias nos tickets
         */
        detectAnomalies(tickets) {
            const anomalies = [];
            const now = new Date();

            // 1. Tickets urgentes sem resposta há mais de 1h
            const urgentNoResponse = tickets.filter(t => {
                if (t.priority != 4 || [4, 5].includes(Number(t.status))) return false;
                if (t.stats_first_responded_at) return false;
                const hours = (now - new Date(t.created_at)) / (1000 * 60 * 60);
                return hours > 1;
            });

            if (urgentNoResponse.length > 0) {
                anomalies.push({
                    type: 'urgentes_sem_resposta',
                    severity: 'critica',
                    count: urgentNoResponse.length,
                    message: `🚨 ${urgentNoResponse.length} ticket(s) URGENTE(s) sem resposta há mais de 1h!`,
                    tickets: urgentNoResponse.slice(0, 5).map(t => ({ id: t.id, subject: t.subject }))
                });
            }

            // 2. Tickets parados há mais de 24h
            const stale24h = tickets.filter(t => {
                if ([4, 5].includes(Number(t.status))) return false;
                const lastUpdate = t.updated_at || t.created_at;
                const hours = (now - new Date(lastUpdate)) / (1000 * 60 * 60);
                return hours > 24;
            });

            if (stale24h.length > 5) {
                anomalies.push({
                    type: 'tickets_parados',
                    severity: 'alta',
                    count: stale24h.length,
                    message: `⚠️ ${stale24h.length} tickets sem atualização há mais de 24h`,
                    tickets: stale24h.slice(0, 5).map(t => ({ id: t.id, subject: t.subject }))
                });
            }

            // 3. Volume alto hoje comparado à média
            const todayStr = now.toISOString().slice(0, 10);
            const todayTickets = tickets.filter(t => t.created_at && t.created_at.slice(0, 10) === todayStr);
            
            // Calcular média dos últimos 7 dias
            const last7Days = {};
            tickets.forEach(t => {
                if (!t.created_at) return;
                const date = t.created_at.slice(0, 10);
                const daysDiff = Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
                if (daysDiff > 0 && daysDiff <= 7) {
                    last7Days[date] = (last7Days[date] || 0) + 1;
                }
            });

            const avgDaily = Object.values(last7Days).length > 0 
                ? Object.values(last7Days).reduce((a, b) => a + b, 0) / Object.values(last7Days).length 
                : 0;

            if (todayTickets.length > avgDaily * 1.5 && todayTickets.length > 10) {
                anomalies.push({
                    type: 'volume_alto',
                    severity: 'media',
                    count: todayTickets.length,
                    message: `📈 Volume de hoje (${todayTickets.length}) está ${((todayTickets.length / avgDaily - 1) * 100).toFixed(0)}% acima da média (${avgDaily.toFixed(0)}/dia)`
                });
            }

            return {
                hasAnomalies: anomalies.length > 0,
                anomalies,
                summary: anomalies.length > 0 
                    ? `${anomalies.length} anomalia(s) detectada(s)` 
                    : 'Nenhuma anomalia detectada'
            };
        },

        /**
         * Calcula carga de trabalho de uma pessoa
         */
        getPersonWorkload(personName, tickets) {
            const personTickets = tickets.filter(t => {
                const tratativa = (t.cf_tratativa || '').toLowerCase();
                return tratativa.includes(personName.toLowerCase());
            });

            const active = personTickets.filter(t => ![4, 5].includes(Number(t.status))).length;
            const capacity = this.capacidadePadrao;
            const loadPercent = (active / capacity) * 100;

            return {
                name: personName,
                total: personTickets.length,
                active,
                resolved: personTickets.length - active,
                capacity,
                loadPercent: loadPercent.toFixed(0),
                status: loadPercent > 100 ? '🔴 Sobrecarregado' : 
                        loadPercent > 80 ? '🟡 Alta carga' : 
                        loadPercent > 50 ? '🟢 Normal' : '⚪ Baixa carga'
            };
        },

        /**
         * Ranking de pessoas por métrica
         */
        getRanking(tickets, metric = 'resolved') {
            const people = {};

            tickets.forEach(t => {
                const person = t.cf_tratativa;
                if (person && person.length > 2) {
                    const nome = person.split(/[,;\/]/)[0].trim();
                    if (!people[nome]) {
                        people[nome] = { name: nome, total: 0, resolved: 0, withinSLA: 0 };
                    }
                    people[nome].total++;
                    if ([4, 5].includes(Number(t.status))) people[nome].resolved++;
                    if (this.isWithinSLA(t)) people[nome].withinSLA++;
                }
            });

            const rankings = Object.values(people).map(p => ({
                ...p,
                resolutionRate: p.total > 0 ? (p.resolved / p.total * 100).toFixed(1) : 0,
                slaRate: p.total > 0 ? (p.withinSLA / p.total * 100).toFixed(1) : 0
            }));

            switch (metric) {
                case 'resolved':
                    return rankings.sort((a, b) => b.resolved - a.resolved).slice(0, 10);
                case 'resolution_rate':
                    return rankings.filter(p => p.total >= 5).sort((a, b) => b.resolutionRate - a.resolutionRate).slice(0, 10);
                case 'sla':
                    return rankings.filter(p => p.total >= 5).sort((a, b) => b.slaRate - a.slaRate).slice(0, 10);
                case 'volume':
                    return rankings.sort((a, b) => b.total - a.total).slice(0, 10);
                default:
                    return rankings.sort((a, b) => b.resolved - a.resolved).slice(0, 10);
            }
        },

        /**
         * Análise por padrões (dia/hora)
         */
        analyzePatterns(tickets) {
            const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
            const byHour = Array(24).fill(0);
            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

            tickets.forEach(t => {
                if (t.created_at) {
                    const date = new Date(t.created_at);
                    byDayOfWeek[date.getDay()]++;
                    byHour[date.getHours()]++;
                }
            });

            const peakDay = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));
            const peakHour = byHour.indexOf(Math.max(...byHour));

            return {
                byDayOfWeek: dayNames.map((name, i) => ({ day: name, count: byDayOfWeek[i] })),
                byHour: byHour.map((count, hour) => ({ hour: `${hour.toString().padStart(2, '0')}:00`, count })),
                peakDay: dayNames[peakDay],
                peakHour: `${peakHour}:00`,
                insights: [
                    `📊 Maior volume: ${dayNames[peakDay]} (${byDayOfWeek[peakDay]} tickets)`,
                    `🕐 Horário de pico: ${peakHour}:00 (${byHour[peakHour]} tickets)`
                ]
            };
        },

        // ============================================================
        // MÉTRICAS DE IA (Supabase)
        // ============================================================

        /**
         * Registra métrica de chamada de IA
         */
        async registrarMetricaIA(provider, sucesso, tempoMs, tokens = 0, isFallback = false) {
            try {
                if (window.supabaseClient) {
                    await window.supabaseClient.rpc('registrar_metrica_ia', {
                        p_provider: provider,
                        p_sucesso: sucesso,
                        p_tempo_ms: tempoMs,
                        p_tokens: tokens,
                        p_is_fallback: isFallback
                    });
                }
            } catch (e) {
                console.warn('⚠️ Erro ao registrar métrica:', e);
            }
        },

        /**
         * Salva conversa no histórico
         */
        async salvarConversa(sessionId, tipo, conteudo, provider = null, sentimento = null) {
            try {
                if (window.supabaseClient) {
                    await window.supabaseClient.from('ia_conversas').insert({
                        session_id: sessionId,
                        tipo,
                        conteudo,
                        provider,
                        sentimento
                    });
                }
            } catch (e) {
                console.warn('⚠️ Erro ao salvar conversa:', e);
            }
        },

        /**
         * Registra alerta de sentimento
         */
        async registrarAlertaSentimento(sessionId, sentimento, mensagem, ticketId = null) {
            try {
                if (window.supabaseClient) {
                    await window.supabaseClient.from('ia_alertas_sentimento').insert({
                        session_id: sessionId,
                        sentimento,
                        mensagem_usuario: mensagem,
                        ticket_id: ticketId
                    });
                    console.log(`🚨 Alerta de sentimento "${sentimento}" registrado`);
                }
            } catch (e) {
                console.warn('⚠️ Erro ao registrar alerta:', e);
            }
        },

        // ============================================================
        // UTILITÁRIOS
        // ============================================================

        /**
         * Gera link do ticket no Freshdesk
         */
        getTicketLink(ticketId) {
            return `https://${this.freshdeskDomain}.freshdesk.com/helpdesk/tickets/${ticketId}`;
        },

        /**
         * Formata número com separadores
         */
        formatNumber(num) {
            return num.toLocaleString('pt-BR');
        },

        /**
         * Gera ID de sessão único
         */
        generateSessionId() {
            return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
        },

        /**
         * Busca fuzzy por pessoa
         */
        findPerson(name, tickets) {
            const searchName = name.toLowerCase().trim();
            const allPeople = new Set();

            tickets.forEach(t => {
                if (t.cf_tratativa) {
                    t.cf_tratativa.split(/[,;\/]/).forEach(p => {
                        const n = p.trim();
                        if (n.length > 2) allPeople.add(n);
                    });
                }
            });

            // Busca exata
            for (const person of allPeople) {
                if (person.toLowerCase() === searchName) {
                    return { found: true, exact: true, name: person };
                }
            }

            // Busca parcial
            const partialMatches = [];
            for (const person of allPeople) {
                const personLower = person.toLowerCase();
                if (personLower.includes(searchName) || searchName.includes(personLower.split(' ')[0])) {
                    partialMatches.push(person);
                }
            }

            if (partialMatches.length === 1) {
                return { found: true, exact: false, name: partialMatches[0], suggestion: true };
            } else if (partialMatches.length > 1) {
                return { found: false, suggestions: partialMatches.slice(0, 5) };
            }

            return { found: false, allPeople: Array.from(allPeople).slice(0, 10) };
        },

        /**
         * Normaliza texto para comparação
         */
        normalizeText(text) {
            return (text || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        },

        /**
         * Calcula similaridade de Jaccard entre dois textos
         */
        jaccardSimilarity(text1, text2) {
            const words1 = new Set(this.normalizeText(text1).split(' ').filter(w => w.length > 2));
            const words2 = new Set(this.normalizeText(text2).split(' ').filter(w => w.length > 2));

            const intersection = new Set([...words1].filter(x => words2.has(x)));
            const union = new Set([...words1, ...words2]);

            return union.size > 0 ? intersection.size / union.size : 0;
        },

        /**
         * Busca tickets similares resolvidos
         */
        buscarTicketsSimilares(texto, tickets, limit = 5) {
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status)));
            
            const scored = resolved.map(t => {
                const ticketText = `${t.subject || ''} ${t.description_text || ''}`;
                const similarity = this.jaccardSimilarity(texto, ticketText);
                return { ticket: t, similarity };
            });

            return scored
                .filter(s => s.similarity > 0.15)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .map(s => ({
                    id: s.ticket.id,
                    subject: s.ticket.subject,
                    similarity: (s.similarity * 100).toFixed(0) + '%',
                    link: this.getTicketLink(s.ticket.id)
                }));
        }
    };

    // Exportar globalmente
    window.ChatbotUtils = ChatbotUtils;

    // Carregar feriados ao iniciar
    ChatbotUtils.carregarFeriados();

    console.log('🔧 ChatbotUtils carregado');

})();
