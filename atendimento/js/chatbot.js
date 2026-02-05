/**
 * Chatbot Interno - Assistente de Dados v3.0 (IA-Powered)
 * Permite fazer perguntas em linguagem natural sobre os tickets
 * Integrado com glossário + IA para respostas fluidas
 * 
 * Modos de operação:
 * 1. Com API key (Groq/OpenAI): Respostas inteligentes via LLM
 * 2. Sem API: Matching de padrões + conhecimento local
 */

(function() {
    'use strict';

    const Chatbot = {
        isOpen: false,
        messages: [],
        isTyping: false,
        
        // Configuração do sistema
        freshdeskDomain: 'suportetryvia',
        
        // Gerar link do ticket no Freshdesk
        getTicketLink(ticketId) {
            return `https://${this.freshdeskDomain}.freshdesk.com/helpdesk/tickets/${ticketId}`;
        },
        
        // REGRAS DE NEGÓCIO (Melhorias 11-16)
        businessRules: {
            // SLA por prioridade (em horas)
            slaPorPrioridade: {
                4: { nome: 'Urgente', resposta: 1, resolucao: 4 },
                3: { nome: 'Alta', resposta: 4, resolucao: 8 },
                2: { nome: 'Média', resposta: 8, resolucao: 24 },
                1: { nome: 'Baixa', resposta: 24, resolucao: 48 }
            },
            // Horário comercial
            horarioComercial: {
                inicio: 8,  // 8h
                fim: 18,    // 18h
                diasUteis: [1, 2, 3, 4, 5] // seg-sex
            },
            // Feriados 2025
            feriados: [
                '2025-01-01', // Ano Novo
                '2025-03-03', // Carnaval
                '2025-03-04', // Carnaval
                '2025-04-18', // Sexta-feira Santa
                '2025-04-21', // Tiradentes
                '2025-05-01', // Dia do Trabalho
                '2025-06-19', // Corpus Christi
                '2025-09-07', // Independência
                '2025-10-12', // Nossa Senhora
                '2025-11-02', // Finados
                '2025-11-15', // Proclamação
                '2025-12-25'  // Natal
            ],
            // Capacidade por pessoa (tickets simultâneos)
            capacidadePadrao: 15,
            // Limite para escalar
            tempoParaEscalar: 24 // horas sem resposta
        },

        // CONHECIMENTO ORGANIZACIONAL (Melhorias 17-21)
        organizacao: {
            // Hierarquia (gestor de cada time)
            gestores: {
                'DEV': 'Gestor DEV',
                'Suporte': 'Gestor Suporte',
                'CS': 'Gestor CS',
                'Comercial': 'Gestor Comercial'
            },
            // Férias/Ausências (atualizar conforme necessário)
            ausencias: [
                // { nome: 'João Silva', inicio: '2025-01-10', fim: '2025-01-20', motivo: 'Férias' }
            ],
            // Contatos de emergência
            emergencia: {
                telefone: '(XX) XXXXX-XXXX',
                email: 'suporte@empresa.com'
            }
        },

        // Contexto da última pergunta para follow-up
        lastContext: {
            topic: null,      // 'sla', 'pessoa', 'ticket', etc
            entity: null,     // nome da pessoa, ID do ticket, etc
            question: null    // última pergunta
        },

        // Busca fuzzy por pessoa (encontra nomes similares)
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
            
            // Busca exata primeiro
            for (const person of allPeople) {
                if (person.toLowerCase() === searchName) {
                    return { found: true, exact: true, name: person };
                }
            }
            
            // Busca parcial (contém o nome)
            const partialMatches = [];
            for (const person of allPeople) {
                if (person.toLowerCase().includes(searchName) || 
                    searchName.includes(person.toLowerCase().split(' ')[0])) {
                    partialMatches.push(person);
                }
            }
            
            if (partialMatches.length === 1) {
                return { found: true, exact: false, name: partialMatches[0], suggestion: true };
            } else if (partialMatches.length > 1) {
                return { found: false, suggestions: partialMatches.slice(0, 5) };
            }
            
            // Nenhuma correspondência - sugerir nomes similares
            const allNames = Array.from(allPeople);
            return { found: false, allPeople: allNames.slice(0, 10) };
        },

        // ============== NOVAS FUNCIONALIDADES (50 MELHORIAS) ==============

        // 1. Histórico do solicitante
        getRequesterHistory(email, tickets) {
            if (!email) return null;
            const requesterTickets = tickets.filter(t => 
                (t.requester_email || '').toLowerCase() === email.toLowerCase()
            );
            if (requesterTickets.length === 0) return null;
            
            const sorted = requesterTickets.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );
            const resolved = requesterTickets.filter(t => [4, 5].includes(Number(t.status))).length;
            
            return {
                email,
                totalTickets: requesterTickets.length,
                resolved,
                open: requesterTickets.length - resolved,
                resolutionRate: ((resolved / requesterTickets.length) * 100).toFixed(1),
                lastTicket: sorted[0],
                recentTickets: sorted.slice(0, 5),
                avgTicketsPerMonth: (requesterTickets.length / 12).toFixed(1),
                isFrequent: requesterTickets.length > 10
            };
        },

        // 2. Carga atual por pessoa
        getPersonWorkload(personName, tickets) {
            const activeStatus = [2, 3, 6, 7, 8, 10, 12, 13, 15, 16, 17, 18, 19];
            const personTickets = tickets.filter(t => 
                (t.cf_tratativa || '').toLowerCase().includes(personName.toLowerCase())
            );
            const activeTickets = personTickets.filter(t => activeStatus.includes(Number(t.status)));
            const urgentActive = activeTickets.filter(t => t.priority == 4);
            
            const capacidade = this.businessRules.capacidadePadrao;
            const cargaPercent = ((activeTickets.length / capacidade) * 100).toFixed(0);
            
            return {
                name: personName,
                total: personTickets.length,
                active: activeTickets.length,
                urgent: urgentActive.length,
                capacity: capacidade,
                loadPercent: cargaPercent,
                status: cargaPercent > 100 ? '🔴 Sobrecarregado' : 
                        cargaPercent > 80 ? '🟡 Alta carga' : 
                        cargaPercent > 50 ? '🟢 Normal' : '⚪ Disponível',
                canTakeMore: capacidade - activeTickets.length
            };
        },

        // 3. Previsão de volume (regressão linear simples)
        predictVolume(tickets, daysAhead = 7) {
            const dailyCounts = {};
            const now = new Date();
            
            // Contar tickets por dia nos últimos 30 dias
            for (let i = 30; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const key = date.toISOString().slice(0, 10);
                dailyCounts[key] = 0;
            }
            
            tickets.forEach(t => {
                if (t.created_at) {
                    const key = t.created_at.slice(0, 10);
                    if (dailyCounts[key] !== undefined) {
                        dailyCounts[key]++;
                    }
                }
            });
            
            const values = Object.values(dailyCounts);
            const n = values.length;
            const avgDaily = values.reduce((a, b) => a + b, 0) / n;
            
            // Tendência simples
            const firstHalf = values.slice(0, Math.floor(n/2));
            const secondHalf = values.slice(Math.floor(n/2));
            const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            const trend = avgSecond - avgFirst;
            
            // Previsão
            const predictions = [];
            for (let i = 1; i <= daysAhead; i++) {
                const predicted = Math.max(0, Math.round(avgDaily + (trend * i / 15)));
                const date = new Date(now);
                date.setDate(date.getDate() + i);
                predictions.push({
                    date: date.toLocaleDateString('pt-BR'),
                    predicted,
                    dayOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]
                });
            }
            
            return {
                avgDaily: avgDaily.toFixed(1),
                trend: trend > 0 ? '📈 Aumentando' : trend < 0 ? '📉 Diminuindo' : '➡️ Estável',
                trendValue: trend.toFixed(1),
                predictions,
                totalPredicted: predictions.reduce((a, b) => a + b.predicted, 0),
                confidence: n >= 30 ? 'Alta' : n >= 14 ? 'Média' : 'Baixa'
            };
        },

        // 4. Detecção de anomalias
        detectAnomalies(tickets) {
            const anomalies = [];
            const now = new Date();
            const today = now.toISOString().slice(0, 10);
            
            // Tickets de hoje
            const todayTickets = tickets.filter(t => 
                t.created_at && t.created_at.slice(0, 10) === today
            );
            
            // Média histórica
            const last30Days = {};
            for (let i = 1; i <= 30; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                last30Days[d.toISOString().slice(0, 10)] = 0;
            }
            tickets.forEach(t => {
                if (t.created_at) {
                    const key = t.created_at.slice(0, 10);
                    if (last30Days[key] !== undefined) last30Days[key]++;
                }
            });
            
            const values = Object.values(last30Days);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);
            
            // Anomalia: mais de 2 desvios padrão
            if (todayTickets.length > avg + 2 * stdDev) {
                anomalies.push({
                    type: 'volume_alto',
                    severity: 'alta',
                    message: `📈 Volume anormalmente ALTO hoje: ${todayTickets.length} tickets (média: ${avg.toFixed(0)})`,
                    value: todayTickets.length,
                    expected: avg.toFixed(0)
                });
            }
            
            // Tickets urgentes sem resposta
            const urgentNoResponse = tickets.filter(t => 
                t.priority == 4 && 
                !t.stats_first_responded_at && 
                ![4, 5].includes(Number(t.status))
            );
            if (urgentNoResponse.length > 0) {
                anomalies.push({
                    type: 'urgentes_sem_resposta',
                    severity: 'critica',
                    message: `🚨 ${urgentNoResponse.length} ticket(s) URGENTE(S) sem resposta!`,
                    tickets: urgentNoResponse.slice(0, 5).map(t => t.id)
                });
            }
            
            // Tickets muito antigos
            const veryOld = tickets.filter(t => {
                if (t.status == 2 && t.created_at) {
                    const age = (now - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
                    return age > 30;
                }
                return false;
            });
            if (veryOld.length > 0) {
                anomalies.push({
                    type: 'tickets_antigos',
                    severity: 'media',
                    message: `⏰ ${veryOld.length} ticket(s) aberto(s) há mais de 30 dias`,
                    tickets: veryOld.slice(0, 5).map(t => ({ id: t.id, age: Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24)) }))
                });
            }
            
            // SLA em risco
            const slaAtRisk = tickets.filter(t => {
                if (!t.stats_first_responded_at && t.created_at && ![4, 5].includes(Number(t.status))) {
                    const hours = (now - new Date(t.created_at)) / (1000 * 60 * 60);
                    const slaLimit = this.businessRules.slaPorPrioridade[t.priority]?.resposta || 4;
                    return hours > slaLimit * 0.8 && hours < slaLimit;
                }
                return false;
            });
            if (slaAtRisk.length > 0) {
                anomalies.push({
                    type: 'sla_risco',
                    severity: 'alta',
                    message: `⚠️ ${slaAtRisk.length} ticket(s) próximo(s) de estourar SLA`,
                    tickets: slaAtRisk.slice(0, 5).map(t => t.id)
                });
            }
            
            return {
                hasAnomalies: anomalies.length > 0,
                count: anomalies.length,
                critical: anomalies.filter(a => a.severity === 'critica').length,
                anomalies
            };
        },

        // 5. Encontrar tickets similares (Jaccard)
        findSimilarTickets(ticketId, tickets, topK = 5) {
            const ticket = tickets.find(t => String(t.id) === String(ticketId));
            if (!ticket) return [];
            
            const getWords = (text) => {
                if (!text) return new Set();
                return new Set(text.toLowerCase()
                    .replace(/[^\w\sáéíóúãõâêîôûç]/g, '')
                    .split(/\s+/)
                    .filter(w => w.length > 3)
                );
            };
            
            const ticketWords = getWords(ticket.subject + ' ' + (ticket.description_text || ''));
            const ticketTags = new Set(ticket.tags || []);
            
            const similarities = tickets
                .filter(t => t.id !== ticket.id)
                .map(t => {
                    const words = getWords(t.subject + ' ' + (t.description_text || ''));
                    const tags = new Set(t.tags || []);
                    
                    // Jaccard similarity para palavras
                    const intersection = new Set([...ticketWords].filter(x => words.has(x)));
                    const union = new Set([...ticketWords, ...words]);
                    const wordSim = union.size > 0 ? intersection.size / union.size : 0;
                    
                    // Similaridade de tags
                    const tagIntersection = new Set([...ticketTags].filter(x => tags.has(x)));
                    const tagUnion = new Set([...ticketTags, ...tags]);
                    const tagSim = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;
                    
                    // Score combinado
                    const score = (wordSim * 0.7) + (tagSim * 0.3);
                    
                    return { ticket: t, score, wordSim, tagSim };
                })
                .filter(s => s.score > 0.1)
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);
            
            return similarities.map(s => ({
                id: s.ticket.id,
                subject: s.ticket.subject,
                status: s.ticket.status,
                similarity: (s.score * 100).toFixed(0) + '%',
                link: this.getTicketLink(s.ticket.id)
            }));
        },

        // 6. Sugestão de atribuição
        suggestAssignment(ticket, tickets) {
            const workloads = {};
            const specialties = {};
            
            // Calcular carga e especialidades de cada pessoa
            const people = new Set();
            tickets.forEach(t => {
                if (t.cf_tratativa) {
                    t.cf_tratativa.split(/[,;\/]/).forEach(p => {
                        const name = p.trim();
                        if (name.length > 2) people.add(name);
                    });
                }
            });
            
            people.forEach(person => {
                workloads[person] = this.getPersonWorkload(person, tickets);
                
                // Detectar especialidade por tags mais frequentes
                const personTickets = tickets.filter(t => 
                    (t.cf_tratativa || '').toLowerCase().includes(person.toLowerCase())
                );
                const tagCounts = {};
                personTickets.forEach(t => {
                    (t.tags || []).forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                });
                specialties[person] = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([tag]) => tag);
            });
            
            // Pontuar cada pessoa
            const ticketTags = new Set(ticket.tags || []);
            const scores = Array.from(people).map(person => {
                const workload = workloads[person];
                const specialty = specialties[person] || [];
                
                // Penalidade por carga alta
                let score = 100 - Number(workload.loadPercent);
                
                // Bônus por especialidade
                const matchingTags = specialty.filter(t => ticketTags.has(t)).length;
                score += matchingTags * 20;
                
                // Bônus se pode receber mais tickets
                if (workload.canTakeMore > 5) score += 10;
                
                return {
                    person,
                    score,
                    workload: workload.status,
                    active: workload.active,
                    specialty: specialty.slice(0, 2).join(', ') || 'Geral',
                    matchingTags
                };
            })
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
            
            return {
                recommended: scores[0] || null,
                alternatives: scores.slice(1),
                reason: scores[0] ? 
                    `${scores[0].person} tem ${scores[0].workload} e ${scores[0].matchingTags > 0 ? 'especialidade compatível' : 'disponibilidade'}` :
                    'Nenhuma sugestão disponível'
            };
        },

        // 7. Tempo estimado de resolução
        estimateResolutionTime(ticket, tickets) {
            // Buscar tickets similares resolvidos
            const resolved = tickets.filter(t => 
                [4, 5].includes(Number(t.status)) && 
                t.created_at && 
                t.stats_resolved_at
            );
            
            // Filtrar por prioridade similar
            const samePriority = resolved.filter(t => t.priority == ticket.priority);
            
            // Filtrar por tags similares
            const ticketTags = new Set(ticket.tags || []);
            const sameTags = resolved.filter(t => {
                const tags = new Set(t.tags || []);
                return [...ticketTags].some(tag => tags.has(tag));
            });
            
            const calculateAvg = (arr) => {
                if (arr.length === 0) return null;
                const times = arr.map(t => 
                    (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60)
                ).filter(t => t > 0 && t < 720); // Excluir outliers (>30 dias)
                
                if (times.length === 0) return null;
                return times.reduce((a, b) => a + b, 0) / times.length;
            };
            
            const avgSameTags = calculateAvg(sameTags);
            const avgSamePriority = calculateAvg(samePriority);
            const avgGeneral = calculateAvg(resolved);
            
            const estimate = avgSameTags || avgSamePriority || avgGeneral || 24;
            
            return {
                hours: estimate.toFixed(1),
                formatted: estimate < 24 ? `${estimate.toFixed(0)}h` : `${(estimate / 24).toFixed(1)} dias`,
                confidence: avgSameTags ? 'Alta' : avgSamePriority ? 'Média' : 'Baixa',
                basedOn: avgSameTags ? 'Tickets similares' : avgSamePriority ? 'Mesma prioridade' : 'Média geral',
                sampleSize: (avgSameTags ? sameTags : avgSamePriority ? samePriority : resolved).length
            };
        },

        // 8. Alertas proativos
        getProactiveAlerts(tickets) {
            const alerts = [];
            const now = new Date();
            const anomalies = this.detectAnomalies(tickets);
            
            // Adicionar anomalias críticas
            anomalies.anomalies
                .filter(a => a.severity === 'critica' || a.severity === 'alta')
                .forEach(a => alerts.push({
                    type: a.type,
                    priority: a.severity === 'critica' ? 1 : 2,
                    message: a.message,
                    action: a.type === 'urgentes_sem_resposta' ? 
                        'Responder imediatamente' : 
                        'Verificar tickets'
                }));
            
            // Verificar pessoas sobrecarregadas
            const people = new Set();
            tickets.forEach(t => {
                if (t.cf_tratativa) people.add(t.cf_tratativa.split(/[,;\/]/)[0].trim());
            });
            
            people.forEach(person => {
                if (person.length > 2) {
                    const workload = this.getPersonWorkload(person, tickets);
                    if (workload.loadPercent > 100) {
                        alerts.push({
                            type: 'sobrecarga',
                            priority: 2,
                            message: `👤 ${person} está sobrecarregado (${workload.active}/${workload.capacity} tickets)`,
                            action: 'Redistribuir tickets'
                        });
                    }
                }
            });
            
            // Verificar SLA geral
            const slaTickets = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (slaTickets.length > 0) {
                const withinSLA = slaTickets.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time <= 4;
                }).length;
                const slaRate = (withinSLA / slaTickets.length) * 100;
                
                if (slaRate < 70) {
                    alerts.push({
                        type: 'sla_baixo',
                        priority: 2,
                        message: `📉 SLA está em ${slaRate.toFixed(0)}% (meta: 85%)`,
                        action: 'Priorizar respostas rápidas'
                    });
                }
            }
            
            return alerts.sort((a, b) => a.priority - b.priority);
        },

        // Calcular SLA específico de uma pessoa COM informações de período
        getPersonSLA(personName, tickets) {
            const personTickets = tickets.filter(t => {
                const tratativa = (t.cf_tratativa || '').toLowerCase();
                return tratativa.includes(personName.toLowerCase());
            });
            
            if (personTickets.length === 0) {
                return null;
            }
            
            // Calcular período dos tickets da pessoa
            const ticketsWithDate = personTickets.filter(t => t.created_at);
            let oldestDate = null, newestDate = null;
            if (ticketsWithDate.length > 0) {
                const dates = ticketsWithDate.map(t => new Date(t.created_at)).sort((a, b) => a - b);
                oldestDate = dates[0];
                newestDate = dates[dates.length - 1];
            }
            
            const withResponse = personTickets.filter(t => t.stats_first_responded_at && t.created_at);
            let slaRate = 0;
            let withinSLA = 0;
            let avgResponseTime = 0;
            
            if (withResponse.length > 0) {
                const times = withResponse.map(t => 
                    (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60)
                );
                avgResponseTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
                withinSLA = times.filter(t => t <= 4).length;
                slaRate = ((withinSLA / withResponse.length) * 100).toFixed(1);
            }
            
            const resolved = personTickets.filter(t => [4, 5].includes(Number(t.status))).length;
            const open = personTickets.filter(t => ![4, 5].includes(Number(t.status))).length;
            
            // Formatar período
            const formatDate = (d) => d ? d.toLocaleDateString('pt-BR') : 'N/A';
            const periodDays = oldestDate && newestDate ? 
                Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)) : 0;
            
            return {
                name: personName,
                total: personTickets.length,
                resolved,
                open,
                resolutionRate: ((resolved / personTickets.length) * 100).toFixed(1),
                withResponse: withResponse.length,
                withoutResponse: personTickets.length - withResponse.length,
                withinSLA,
                outsideSLA: withResponse.length - withinSLA,
                slaRate,
                avgResponseTime,
                // Informações de período
                oldestDate: formatDate(oldestDate),
                newestDate: formatDate(newestDate),
                periodDays,
                periodDescription: periodDays > 0 ? 
                    `${formatDate(oldestDate)} a ${formatDate(newestDate)} (${periodDays} dias)` : 
                    'Período não disponível'
            };
        },

        // BASE DE CONHECIMENTO EXPANDIDA (Melhorias 29-30)
        solucoesConhecidas: {
            'erro de login': 'Verificar se o usuário está ativo no sistema e se a senha foi alterada recentemente.',
            'lentidão': 'Verificar conexão de internet, limpar cache do navegador, testar em outro navegador.',
            'integração falhou': 'Verificar logs de erro, confirmar credenciais da API, testar endpoint manualmente.',
            'relatório não gera': 'Verificar se há dados no período selecionado, verificar permissões do usuário.',
            'importação falhou': 'Verificar formato do arquivo (CSV/Excel), verificar se campos obrigatórios estão preenchidos.',
            'tela branca': 'Limpar cache do navegador, verificar console (F12), tentar modo anônimo.',
            'erro 500': 'Erro no servidor. Verificar logs do backend, reiniciar serviço se necessário.',
            'erro 404': 'Página não encontrada. Verificar URL e se o recurso existe.',
            'timeout': 'Operação demorou demais. Verificar conexão e tentar novamente.',
            'não sincroniza': 'Verificar conexão, limpar cache, verificar logs de sincronização.',
            'notificação não chega': 'Verificar configurações de e-mail, verificar pasta de spam, confirmar endereço.',
            'permissão negada': 'Verificar perfil do usuário, confirmar permissões com administrador.',
            'dados duplicados': 'Verificar integridade do banco, executar script de limpeza se necessário.',
            'pdf não abre': 'Atualizar leitor de PDF, tentar baixar novamente, verificar se arquivo está corrompido.'
        },

        // 9. Análise de satisfação (CSAT)
        analyzeCSAT(tickets) {
            const withRating = tickets.filter(t => t.satisfaction_rating && t.satisfaction_rating.rating);
            if (withRating.length === 0) return { available: false };
            
            const positive = withRating.filter(t => t.satisfaction_rating.rating === 'positive').length;
            const negative = withRating.filter(t => t.satisfaction_rating.rating === 'negative').length;
            
            return {
                available: true,
                total: withRating.length,
                positive,
                negative,
                neutral: withRating.length - positive - negative,
                csatScore: ((positive / withRating.length) * 100).toFixed(1),
                nps: ((positive - negative) / withRating.length * 100).toFixed(0),
                trend: positive >= negative ? '📈 Positivo' : '📉 Precisa melhorar'
            };
        },

        // 10. Análise por dia da semana e hora
        analyzePatterns(tickets) {
            const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
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
            const lowDay = byDayOfWeek.indexOf(Math.min(...byDayOfWeek.filter((_, i) => i >= 1 && i <= 5)));
            const peakHour = byHour.indexOf(Math.max(...byHour));
            
            return {
                byDayOfWeek: dayNames.map((name, i) => ({ day: name, count: byDayOfWeek[i] })),
                byHour: byHour.map((count, hour) => ({ hour: `${hour.toString().padStart(2, '0')}:00`, count })),
                peakDay: dayNames[peakDay],
                lowDay: dayNames[lowDay + 1] || 'Segunda',
                peakHour: `${peakHour}:00`,
                peakHourRange: `${peakHour}:00 - ${(peakHour + 1) % 24}:00`,
                insights: [
                    `📊 Maior volume: ${dayNames[peakDay]} (${byDayOfWeek[peakDay]} tickets)`,
                    `🕐 Horário de pico: ${peakHour}:00 (${byHour[peakHour]} tickets)`,
                    `💡 Considere reforçar equipe em ${dayNames[peakDay]} às ${peakHour}:00`
                ]
            };
        },

        // 11. Análise por produto/sistema
        analyzeByProduct(tickets) {
            const byProduct = {};
            const bySystem = {};
            
            tickets.forEach(t => {
                const product = t.cf_produto || 'Não especificado';
                const system = t.cf_sistema || 'Não especificado';
                
                byProduct[product] = (byProduct[product] || 0) + 1;
                bySystem[system] = (bySystem[system] || 0) + 1;
            });
            
            const topProducts = Object.entries(byProduct)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count, percent: ((count / tickets.length) * 100).toFixed(1) }));
            
            const topSystems = Object.entries(bySystem)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count, percent: ((count / tickets.length) * 100).toFixed(1) }));
            
            return { topProducts, topSystems };
        },

        // 12. Análise por canal de origem
        analyzeByChannel(tickets) {
            const bySource = {};
            
            tickets.forEach(t => {
                const source = t.source_name || t.source || 'Desconhecido';
                bySource[source] = (bySource[source] || 0) + 1;
            });
            
            return Object.entries(bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([channel, count]) => ({
                    channel,
                    count,
                    percent: ((count / tickets.length) * 100).toFixed(1)
                }));
        },

        // 13. Comparativo de períodos
        comparePeriods(tickets, currentDays = 7) {
            const now = new Date();
            const currentStart = new Date(now);
            currentStart.setDate(currentStart.getDate() - currentDays);
            
            const previousStart = new Date(currentStart);
            previousStart.setDate(previousStart.getDate() - currentDays);
            
            const current = tickets.filter(t => {
                const d = new Date(t.created_at);
                return d >= currentStart && d <= now;
            });
            
            const previous = tickets.filter(t => {
                const d = new Date(t.created_at);
                return d >= previousStart && d < currentStart;
            });
            
            const calcMetrics = (arr) => {
                const resolved = arr.filter(t => [4, 5].includes(Number(t.status))).length;
                const withResponse = arr.filter(t => t.stats_first_responded_at);
                const withinSLA = withResponse.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time <= 4;
                }).length;
                
                return {
                    total: arr.length,
                    resolved,
                    resolutionRate: arr.length > 0 ? (resolved / arr.length * 100).toFixed(1) : 0,
                    slaRate: withResponse.length > 0 ? (withinSLA / withResponse.length * 100).toFixed(1) : 0
                };
            };
            
            const currentMetrics = calcMetrics(current);
            const previousMetrics = calcMetrics(previous);
            
            const volumeChange = previousMetrics.total > 0 ? 
                ((currentMetrics.total - previousMetrics.total) / previousMetrics.total * 100).toFixed(1) : 0;
            
            return {
                current: currentMetrics,
                previous: previousMetrics,
                period: `${currentDays} dias`,
                changes: {
                    volume: Number(volumeChange),
                    volumeText: volumeChange > 0 ? `📈 +${volumeChange}%` : `📉 ${volumeChange}%`,
                    resolution: (Number(currentMetrics.resolutionRate) - Number(previousMetrics.resolutionRate)).toFixed(1),
                    sla: (Number(currentMetrics.slaRate) - Number(previousMetrics.slaRate)).toFixed(1)
                }
            };
        },

        // 14. Ranking de pessoas
        getRanking(tickets, metric = 'resolved') {
            const people = {};
            
            tickets.forEach(t => {
                const person = t.cf_tratativa;
                if (person && person.length > 2) {
                    if (!people[person]) {
                        people[person] = { name: person, total: 0, resolved: 0, withinSLA: 0 };
                    }
                    people[person].total++;
                    if ([4, 5].includes(Number(t.status))) people[person].resolved++;
                    if (t.stats_first_responded_at && t.created_at) {
                        const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                        if (time <= 4) people[person].withinSLA++;
                    }
                }
            });
            
            const rankings = Object.values(people).map(p => ({
                ...p,
                resolutionRate: p.total > 0 ? (p.resolved / p.total * 100).toFixed(1) : 0,
                slaRate: p.total > 0 ? (p.withinSLA / p.total * 100).toFixed(1) : 0
            }));
            
            switch(metric) {
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

        // 15. Buscar soluções conhecidas
        findKnownSolution(problemText) {
            const text = problemText.toLowerCase();
            const solutions = [];
            
            for (const [problem, solution] of Object.entries(this.solucoesConhecidas)) {
                if (text.includes(problem) || problem.split(' ').some(word => text.includes(word))) {
                    solutions.push({ problem, solution, match: 'parcial' });
                }
            }
            
            return solutions.length > 0 ? solutions : null;
        },

        // 16. Análise de reaberturas
        analyzeReopens(tickets) {
            // Tickets que voltaram de Resolvido para outro status
            const reopened = tickets.filter(t => {
                // Heurística: se tem histórico de status ou se foi resolvido mas está aberto
                return t.reopened || (t.was_resolved && ![4, 5].includes(Number(t.status)));
            });
            
            const reopenRate = tickets.length > 0 ? (reopened.length / tickets.length * 100).toFixed(1) : 0;
            
            return {
                total: reopened.length,
                rate: reopenRate,
                status: reopenRate > 10 ? '🔴 Alto' : reopenRate > 5 ? '🟡 Médio' : '🟢 Baixo',
                samples: reopened.slice(0, 5).map(t => ({ id: t.id, subject: t.subject }))
            };
        },

        // 17. Estatísticas gerais rápidas
        getQuickStats(tickets) {
            const now = new Date();
            const today = tickets.filter(t => t.created_at && t.created_at.slice(0, 10) === now.toISOString().slice(0, 10));
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status)));
            const open = tickets.filter(t => ![4, 5].includes(Number(t.status)));
            const urgent = tickets.filter(t => t.priority == 4);
            
            // Calcular tempo médio de resposta
            const withResponse = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            let avgResponseTime = 0;
            if (withResponse.length > 0) {
                avgResponseTime = withResponse.reduce((sum, t) => {
                    return sum + (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                }, 0) / withResponse.length;
            }
            
            // SLA
            const withinSLA = withResponse.filter(t => {
                const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                return time <= 4;
            }).length;
            
            return {
                total: tickets.length,
                today: today.length,
                resolved: resolved.length,
                open: open.length,
                urgent: urgent.length,
                resolutionRate: ((resolved.length / tickets.length) * 100).toFixed(1),
                avgResponseTime: avgResponseTime.toFixed(1),
                slaRate: withResponse.length > 0 ? ((withinSLA / withResponse.length) * 100).toFixed(1) : 'N/A',
                urgentOpen: urgent.filter(t => ![4, 5].includes(Number(t.status))).length
            };
        },

        // Configuração de IA
        aiConfig: {
            enabled: true,
            // Ordem de prioridade: Gemini > Groq > Local
            provider: 'gemini', // 'gemini', 'groq', 'openai', 'local'
            
            // API Keys (obtenha em https://aistudio.google.com/app/apikey)
            geminiKey: localStorage.getItem('chatbot_gemini_key') || 'AIzaSyAf1Y_iJxafTDKIw_IpSrFdKYx7DQ3pVuc',
            groqKey: localStorage.getItem('chatbot_groq_key') || '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',
            
            // Modelos - Atualizados em Dez/2024
            geminiModel: 'gemini-2.0-flash-exp', // Novo modelo gratuito e rápido
            groqModel: 'llama-3.3-70b-versatile', // Modelo mais capaz
            
            maxTokens: 500,
            temperature: 0.7
        },
        
        context: {
            lastQuestion: null,
            lastEntity: null,
            lastMetric: null,
            lastTopic: null,
            conversationHistory: []
        },

        // ============= MEMÓRIA DE DECISÕES =============
        decisions: {
            // Carregar decisões do localStorage
            load() {
                try {
                    return JSON.parse(localStorage.getItem('chatbot_decisions') || '[]');
                } catch { return []; }
            },
            
            // Salvar decisão
            save(decision) {
                const decisions = this.load();
                const newDecision = {
                    id: Date.now(),
                    date: new Date().toISOString(),
                    dateFormatted: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
                    text: decision,
                    tags: this.extractTags(decision)
                };
                decisions.unshift(newDecision);
                localStorage.setItem('chatbot_decisions', JSON.stringify(decisions.slice(0, 100))); // Max 100
                return newDecision;
            },
            
            // Extrair tags automaticamente
            extractTags(text) {
                const tags = [];
                const lower = text.toLowerCase();
                if (lower.includes('escal')) tags.push('escalação');
                if (lower.includes('prioriz')) tags.push('priorização');
                if (lower.includes('sla')) tags.push('SLA');
                if (lower.includes('client')) tags.push('cliente');
                if (lower.includes('urgent')) tags.push('urgente');
                if (lower.includes('resolv')) tags.push('resolução');
                if (lower.includes('atribu')) tags.push('atribuição');
                if (lower.includes('ticket')) tags.push('ticket');
                return tags;
            },
            
            // Buscar decisões
            search(query) {
                const decisions = this.load();
                if (!query) return decisions.slice(0, 10);
                const lower = query.toLowerCase();
                return decisions.filter(d => 
                    d.text.toLowerCase().includes(lower) ||
                    d.tags.some(t => t.includes(lower))
                ).slice(0, 10);
            },
            
            // Deletar decisão
            delete(id) {
                const decisions = this.load().filter(d => d.id !== id);
                localStorage.setItem('chatbot_decisions', JSON.stringify(decisions));
            }
        },

        // ============= INTEGRAÇÃO SUPABASE DIRETA =============
        supabase: {
            client: null,
            
            // Inicializar cliente
            async init() {
                if (this.client) return this.client;
                
                // Usar o cliente global se existir
                if (window.supabaseClient) {
                    this.client = window.supabaseClient;
                    return this.client;
                }
                
                // Tentar criar novo cliente
                if (window.supabase?.createClient) {
                    const url = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
                    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc';
                    this.client = window.supabase.createClient(url, key);
                    return this.client;
                }
                
                return null;
            },
            
            // Query customizada
            async query(table, options = {}) {
                const client = await this.init();
                if (!client) return { data: null, error: 'Supabase não disponível' };
                
                try {
                    let query = client.from(table).select(options.select || '*');
                    
                    if (options.filter) {
                        Object.entries(options.filter).forEach(([key, value]) => {
                            query = query.eq(key, value);
                        });
                    }
                    if (options.order) query = query.order(options.order.column, { ascending: options.order.asc ?? false });
                    if (options.limit) query = query.limit(options.limit);
                    
                    return await query;
                } catch (error) {
                    return { data: null, error: error.message };
                }
            },
            
            // Buscar tickets em tempo real
            async getTickets(filters = {}) {
                const options = {
                    select: '*',
                    order: { column: 'created_at', asc: false },
                    limit: filters.limit || 100
                };
                
                if (filters.status) options.filter = { status: filters.status };
                if (filters.priority) options.filter = { ...options.filter, priority: filters.priority };
                if (filters.person) options.filter = { ...options.filter, cf_tratativa: filters.person };
                
                return await this.query('tickets', options);
            },
            
            // Salvar nota/decisão no Supabase (opcional)
            async saveDecision(decision) {
                const client = await this.init();
                if (!client) return null;
                
                try {
                    // Tentar salvar na tabela de notas (se existir)
                    const { data, error } = await client
                        .from('chatbot_decisions')
                        .insert([{
                            text: decision.text,
                            tags: decision.tags,
                            created_at: decision.date
                        }]);
                    return { data, error };
                } catch {
                    // Tabela não existe, usar só localStorage
                    return null;
                }
            }
        },

        // ============= INTEGRAÇÃO BI ANALYTICS =============
        biAnalytics: {
            // Navegar para uma view específica
            goToView(view) {
                const viewMap = {
                    'dashboard': () => window.showDashboard?.() || this.clickMenu('Dashboard'),
                    'tickets': () => window.showTickets?.() || this.clickMenu('Tickets'),
                    'bi': () => window.showBIAnalytics?.() || this.clickMenu('BI Analytics'),
                    'charts': () => window.showBICharts?.() || this.clickMenu('BI Charts'),
                    'insights': () => window.showInsights?.() || this.clickMenu('Insights'),
                    'relatorio': () => window.showRelatorio?.() || this.clickMenu('Relatório')
                };
                
                const action = viewMap[view.toLowerCase()];
                if (action) {
                    action();
                    return true;
                }
                return false;
            },
            
            // Clicar no menu (fallback)
            clickMenu(name) {
                const menuItems = document.querySelectorAll('.menu-item, .nav-item, [onclick*="show"]');
                for (const item of menuItems) {
                    if (item.textContent.toLowerCase().includes(name.toLowerCase())) {
                        item.click();
                        return true;
                    }
                }
                return false;
            },
            
            // Obter dados do dashboard atual
            getCurrentData() {
                const data = {
                    currentView: document.querySelector('.active-view, .container:not([style*="none"])')?.id || 'unknown',
                    metrics: {}
                };
                
                // Tentar capturar KPIs visíveis
                document.querySelectorAll('.kpi-value, .metric-value, .stat-value').forEach(el => {
                    const label = el.closest('.kpi-card, .metric-card, .stat-card')?.querySelector('.kpi-label, .metric-label, .stat-label')?.textContent;
                    if (label) data.metrics[label] = el.textContent;
                });
                
                return data;
            },
            
            // Filtrar dados do dashboard
            applyFilter(filterType, value) {
                // Tentar aplicar filtro via biAnalytics global
                if (window.biAnalytics?.applyFilters) {
                    window.biAnalytics.applyFilters({ [filterType]: value });
                    return true;
                }
                
                // Tentar via select elements
                const selects = document.querySelectorAll('select');
                for (const select of selects) {
                    if (select.id?.toLowerCase().includes(filterType.toLowerCase()) ||
                        select.name?.toLowerCase().includes(filterType.toLowerCase())) {
                        select.value = value;
                        select.dispatchEvent(new Event('change'));
                        return true;
                    }
                }
                
                return false;
            },
            
            // Gerar gráfico via código
            generateChart(type, data) {
                // Integrar com Chart.js se disponível
                if (window.Chart) {
                    return { available: true, type, data };
                }
                return { available: false };
            }
        },

        // ============= AGENT SYSTEM (AUTONOMIA) =============
        
        // 1. TOOLS - Ferramentas formais que o agente pode chamar
        tools: {
            // Definição das ferramentas disponíveis
            definitions: {
                query_tickets: {
                    name: 'query_tickets',
                    description: 'Buscar tickets com filtros',
                    parameters: ['status', 'priority', 'days', 'person', 'team', 'limit'],
                    execute: (args, ctx) => ctx.toolExecutors.queryTickets(args)
                },
                get_person_stats: {
                    name: 'get_person_stats',
                    description: 'Obter estatísticas de uma pessoa',
                    parameters: ['name'],
                    execute: (args, ctx) => ctx.toolExecutors.getPersonStats(args)
                },
                get_team_stats: {
                    name: 'get_team_stats',
                    description: 'Obter estatísticas de um time',
                    parameters: ['name'],
                    execute: (args, ctx) => ctx.toolExecutors.getTeamStats(args)
                },
                get_sla: {
                    name: 'get_sla',
                    description: 'Calcular SLA geral ou de uma pessoa',
                    parameters: ['person', 'period'],
                    execute: (args, ctx) => ctx.toolExecutors.getSLA(args)
                },
                get_alerts: {
                    name: 'get_alerts',
                    description: 'Obter alertas e anomalias',
                    parameters: [],
                    execute: (args, ctx) => ctx.toolExecutors.getAlerts(args)
                },
                search_knowledge: {
                    name: 'search_knowledge',
                    description: 'Buscar na base de conhecimento',
                    parameters: ['query'],
                    execute: (args, ctx) => ctx.toolExecutors.searchKnowledge(args)
                },
                navigate_to: {
                    name: 'navigate_to',
                    description: 'Navegar para uma view do dashboard',
                    parameters: ['view'],
                    execute: (args, ctx) => ctx.biAnalytics.goToView(args.view)
                },
                save_decision: {
                    name: 'save_decision',
                    description: 'Salvar uma nota/decisão',
                    parameters: ['text'],
                    execute: (args, ctx) => ctx.decisions.save(args.text)
                },
                get_ticket_details: {
                    name: 'get_ticket_details',
                    description: 'Obter detalhes de um ticket específico',
                    parameters: ['id'],
                    execute: (args, ctx) => ctx.toolExecutors.getTicketDetails(args)
                },
                compare_periods: {
                    name: 'compare_periods',
                    description: 'Comparar métricas entre períodos',
                    parameters: ['metric', 'period1', 'period2'],
                    execute: (args, ctx) => ctx.toolExecutors.comparePeriods(args)
                },
                get_ranking: {
                    name: 'get_ranking',
                    description: 'Obter ranking de pessoas ou times',
                    parameters: ['type', 'metric', 'order', 'limit'],
                    execute: (args, ctx) => ctx.toolExecutors.getRanking(args)
                },
                predict_volume: {
                    name: 'predict_volume',
                    description: 'Prever volume de tickets',
                    parameters: ['days'],
                    execute: (args, ctx) => ctx.toolExecutors.predictVolume(args)
                }
            },
            
            // Lista para o LLM
            getToolList() {
                return Object.values(this.definitions).map(t => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                }));
            }
        },

        // 2. TOOL EXECUTORS - Implementação das ferramentas
        toolExecutors: {
            queryTickets(args) {
                const tickets = window.allTicketsCache || [];
                let filtered = [...tickets];
                
                if (args.status) {
                    const statuses = Array.isArray(args.status) ? args.status : [args.status];
                    filtered = filtered.filter(t => statuses.includes(Number(t.status)));
                }
                if (args.priority) {
                    filtered = filtered.filter(t => Number(t.priority) === Number(args.priority));
                }
                if (args.days) {
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - args.days);
                    filtered = filtered.filter(t => new Date(t.created_at) >= cutoff);
                }
                if (args.person) {
                    filtered = filtered.filter(t => 
                        (t.cf_tratativa || '').toLowerCase().includes(args.person.toLowerCase())
                    );
                }
                if (args.team) {
                    filtered = filtered.filter(t => 
                        (t.cf_grupo_tratativa || '').toLowerCase().includes(args.team.toLowerCase())
                    );
                }
                
                const limit = args.limit || 100;
                return {
                    success: true,
                    count: filtered.length,
                    tickets: filtered.slice(0, limit),
                    summary: {
                        total: filtered.length,
                        open: filtered.filter(t => t.status == 2).length,
                        resolved: filtered.filter(t => [4,5].includes(Number(t.status))).length
                    }
                };
            },
            
            getPersonStats(args) {
                const tickets = window.allTicketsCache || [];
                const name = args.name?.toLowerCase() || '';
                
                // Buscar pessoa
                const personTickets = tickets.filter(t => 
                    (t.cf_tratativa || '').toLowerCase().includes(name)
                );
                
                if (personTickets.length === 0) {
                    // Sugerir nomes similares
                    const allPeople = [...new Set(tickets.map(t => t.cf_tratativa).filter(Boolean))];
                    const suggestions = allPeople.filter(p => 
                        p.toLowerCase().includes(name) || name.includes(p.toLowerCase().split(' ')[0])
                    ).slice(0, 5);
                    
                    return { success: false, error: 'Pessoa não encontrada', suggestions };
                }
                
                // Calcular SLA da pessoa
                const slaData = Chatbot.getPersonSLA(args.name, tickets);
                
                return {
                    success: true,
                    name: args.name,
                    stats: {
                        total: personTickets.length,
                        resolved: personTickets.filter(t => [4,5].includes(Number(t.status))).length,
                        open: personTickets.filter(t => ![4,5].includes(Number(t.status))).length,
                        urgent: personTickets.filter(t => t.priority == 4).length
                    },
                    sla: slaData,
                    period: slaData?.periodDescription || 'N/A'
                };
            },
            
            getTeamStats(args) {
                const tickets = window.allTicketsCache || [];
                const name = args.name?.toLowerCase() || '';
                
                const teamTickets = tickets.filter(t => 
                    (t.cf_grupo_tratativa || '').toLowerCase().includes(name)
                );
                
                if (teamTickets.length === 0) {
                    const allTeams = [...new Set(tickets.map(t => t.cf_grupo_tratativa).filter(Boolean))];
                    return { success: false, error: 'Time não encontrado', suggestions: allTeams.slice(0, 5) };
                }
                
                const resolved = teamTickets.filter(t => [4,5].includes(Number(t.status))).length;
                
                return {
                    success: true,
                    name: args.name,
                    stats: {
                        total: teamTickets.length,
                        resolved,
                        open: teamTickets.length - resolved,
                        resolutionRate: ((resolved / teamTickets.length) * 100).toFixed(1)
                    }
                };
            },
            
            getSLA(args) {
                const tickets = window.allTicketsCache || [];
                
                if (args.person) {
                    return Chatbot.getPersonSLA(args.person, tickets);
                }
                
                // SLA geral
                let filtered = tickets;
                if (args.period) {
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - args.period);
                    filtered = tickets.filter(t => new Date(t.created_at) >= cutoff);
                }
                
                const withResponse = filtered.filter(t => t.stats_first_responded_at && t.created_at);
                if (withResponse.length === 0) {
                    return { success: false, error: 'Sem dados de SLA' };
                }
                
                const times = withResponse.map(t => 
                    (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60)
                );
                const withinSLA = times.filter(t => t <= 4).length;
                
                return {
                    success: true,
                    slaRate: ((withinSLA / withResponse.length) * 100).toFixed(1),
                    withinSLA,
                    total: withResponse.length,
                    avgResponseTime: (times.reduce((a,b) => a+b, 0) / times.length).toFixed(1)
                };
            },
            
            getAlerts(args) {
                return Chatbot.detectAnomalies(window.allTicketsCache || []);
            },
            
            searchKnowledge(args) {
                const query = args.query?.toLowerCase() || '';
                const results = [];
                
                // Buscar em soluções conhecidas
                Object.entries(Chatbot.solucoesConhecidas || {}).forEach(([key, value]) => {
                    if (key.includes(query) || value.toLowerCase().includes(query)) {
                        results.push({ type: 'solucao', key, value, score: 0.8 });
                    }
                });
                
                // Buscar em knowledge base
                Object.entries(Chatbot.knowledge?.metrics || {}).forEach(([key, data]) => {
                    if (key.includes(query) || data.explanation?.toLowerCase().includes(query)) {
                        results.push({ type: 'metrica', key, data, score: 0.7 });
                    }
                });
                
                // Buscar em decisões salvas
                const decisions = Chatbot.decisions.search(query);
                decisions.forEach(d => results.push({ type: 'decisao', data: d, score: 0.6 }));
                
                return { success: true, results: results.slice(0, 10) };
            },
            
            getTicketDetails(args) {
                const tickets = window.allTicketsCache || [];
                const ticket = tickets.find(t => String(t.id) === String(args.id));
                
                if (!ticket) {
                    return { success: false, error: 'Ticket não encontrado' };
                }
                
                return {
                    success: true,
                    ticket: {
                        id: ticket.id,
                        subject: ticket.subject,
                        status: ticket.status,
                        priority: ticket.priority,
                        person: ticket.cf_tratativa,
                        team: ticket.cf_grupo_tratativa,
                        created: ticket.created_at,
                        updated: ticket.updated_at
                    }
                };
            },
            
            comparePeriods(args) {
                const tickets = window.allTicketsCache || [];
                const now = new Date();
                
                // Período 1 (atual)
                const p1Days = args.period1 || 7;
                const p1Start = new Date(now - p1Days * 24 * 60 * 60 * 1000);
                const p1Tickets = tickets.filter(t => new Date(t.created_at) >= p1Start);
                
                // Período 2 (anterior)
                const p2Days = args.period2 || 7;
                const p2Start = new Date(p1Start - p2Days * 24 * 60 * 60 * 1000);
                const p2Tickets = tickets.filter(t => {
                    const d = new Date(t.created_at);
                    return d >= p2Start && d < p1Start;
                });
                
                return {
                    success: true,
                    period1: { days: p1Days, count: p1Tickets.length },
                    period2: { days: p2Days, count: p2Tickets.length },
                    change: p2Tickets.length > 0 ? 
                        (((p1Tickets.length - p2Tickets.length) / p2Tickets.length) * 100).toFixed(1) : 'N/A'
                };
            },
            
            getRanking(args) {
                const tickets = window.allTicketsCache || [];
                const type = args.type || 'person';
                const metric = args.metric || 'total';
                const order = args.order || 'desc';
                const limit = args.limit || 10;
                
                const field = type === 'person' ? 'cf_tratativa' : 'cf_grupo_tratativa';
                const stats = {};
                
                tickets.forEach(t => {
                    const key = t[field] || 'Não atribuído';
                    if (!stats[key]) stats[key] = { total: 0, resolved: 0 };
                    stats[key].total++;
                    if ([4,5].includes(Number(t.status))) stats[key].resolved++;
                });
                
                let ranked = Object.entries(stats).map(([name, data]) => ({
                    name,
                    ...data,
                    rate: ((data.resolved / data.total) * 100).toFixed(1)
                }));
                
                // Ordenar
                const sortKey = metric === 'rate' ? 'rate' : 'total';
                ranked.sort((a, b) => order === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
                
                return { success: true, ranking: ranked.slice(0, limit), type, metric };
            },
            
            predictVolume(args) {
                const tickets = window.allTicketsCache || [];
                const days = args.days || 7;
                
                // Média dos últimos 30 dias
                const last30 = new Date();
                last30.setDate(last30.getDate() - 30);
                const recent = tickets.filter(t => new Date(t.created_at) >= last30);
                const avgPerDay = recent.length / 30;
                
                // Tendência
                const last7 = tickets.filter(t => {
                    const d = new Date(t.created_at);
                    return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                });
                const trendFactor = last7.length / 7 / avgPerDay;
                
                return {
                    success: true,
                    prediction: Math.round(avgPerDay * trendFactor * days),
                    avgPerDay: avgPerDay.toFixed(1),
                    trend: trendFactor > 1.1 ? 'alta' : trendFactor < 0.9 ? 'baixa' : 'estável',
                    confidence: recent.length > 100 ? 'alta' : 'média'
                };
            }
        },

        // 3. INTENT DETECTOR - Detectar intenção do usuário
        intentDetector: {
            intents: {
                QUERY_PERSON: { keywords: ['sla', 'taxa', 'tickets', 'performance', 'métricas'], entities: ['person'] },
                QUERY_TEAM: { keywords: ['time', 'equipe', 'grupo'], entities: ['team'] },
                QUERY_TICKET: { keywords: ['ticket', 'chamado', '#'], entities: ['ticket_id'] },
                GET_RANKING: { keywords: ['ranking', 'melhor', 'pior', 'top', 'quem mais', 'quem menos'] },
                GET_ALERTS: { keywords: ['alerta', 'problema', 'urgente', 'crítico', 'anomalia'] },
                COMPARE: { keywords: ['comparar', 'versus', 'vs', 'diferença', 'evolução'] },
                PREDICT: { keywords: ['prever', 'previsão', 'amanhã', 'próximos'] },
                NAVIGATE: { keywords: ['ir para', 'abrir', 'mostrar', 'ver dashboard', 'ver bi'] },
                SAVE_NOTE: { keywords: ['anotar', 'lembrar', 'salvar nota', 'registrar'] },
                SEARCH: { keywords: ['buscar', 'procurar', 'encontrar', 'como resolver'] },
                GENERAL: { keywords: [] }
            },
            
            detect(text) {
                const lower = text.toLowerCase();
                let bestMatch = { intent: 'GENERAL', confidence: 0.3, entities: {} };
                
                for (const [intentName, config] of Object.entries(this.intents)) {
                    const matches = config.keywords.filter(k => lower.includes(k)).length;
                    const confidence = config.keywords.length > 0 ? matches / config.keywords.length : 0;
                    
                    if (confidence > bestMatch.confidence) {
                        bestMatch = { intent: intentName, confidence, entities: {} };
                    }
                }
                
                // Extrair entidades
                bestMatch.entities = this.extractEntities(text);
                
                return bestMatch;
            },
            
            extractEntities(text) {
                const entities = {};
                
                // Extrair ID de ticket
                const ticketMatch = text.match(/#?(\d{4,})/);
                if (ticketMatch) entities.ticket_id = ticketMatch[1];
                
                // Extrair nome de pessoa (heurística: palavra após "do/da/de")
                const personMatch = text.match(/(?:do|da|de|para)\s+([A-Z][a-zà-ú]+(?:\s+[A-Z][a-zà-ú]+)?)/i);
                if (personMatch) entities.person = personMatch[1];
                
                // Extrair período
                const periodMatch = text.match(/(\d+)\s*(?:dias?|semanas?|meses?)/i);
                if (periodMatch) {
                    let days = parseInt(periodMatch[1]);
                    if (text.includes('semana')) days *= 7;
                    if (text.includes('mes') || text.includes('mês')) days *= 30;
                    entities.period = days;
                }
                
                // Extrair time
                const teamKeywords = ['atendimento', 'dev', 'suporte', 'cs', 'comercial', 'implantação'];
                for (const team of teamKeywords) {
                    if (text.toLowerCase().includes(team)) {
                        entities.team = team;
                        break;
                    }
                }
                
                return entities;
            }
        },

        // 4. PLANNER - Criar plano de ações
        planner: {
            createPlan(intent, entities, context) {
                const plans = {
                    QUERY_PERSON: () => {
                        if (!entities.person) {
                            return [{ tool: 'get_ranking', args: { type: 'person', limit: 5 } }];
                        }
                        return [
                            { tool: 'get_person_stats', args: { name: entities.person } },
                            { tool: 'get_sla', args: { person: entities.person } }
                        ];
                    },
                    QUERY_TEAM: () => {
                        if (!entities.team) {
                            return [{ tool: 'get_ranking', args: { type: 'team', limit: 5 } }];
                        }
                        return [{ tool: 'get_team_stats', args: { name: entities.team } }];
                    },
                    QUERY_TICKET: () => {
                        if (!entities.ticket_id) {
                            return [{ tool: 'query_tickets', args: { limit: 5, status: [2] } }];
                        }
                        return [{ tool: 'get_ticket_details', args: { id: entities.ticket_id } }];
                    },
                    GET_RANKING: () => [
                        { tool: 'get_ranking', args: { type: 'person', metric: 'total', limit: 10 } }
                    ],
                    GET_ALERTS: () => [
                        { tool: 'get_alerts', args: {} }
                    ],
                    COMPARE: () => [
                        { tool: 'compare_periods', args: { period1: 7, period2: 7 } }
                    ],
                    PREDICT: () => [
                        { tool: 'predict_volume', args: { days: entities.period || 7 } }
                    ],
                    NAVIGATE: () => {
                        const view = entities.view || 'dashboard';
                        return [{ tool: 'navigate_to', args: { view } }];
                    },
                    SAVE_NOTE: () => [
                        { tool: 'save_decision', args: { text: context.originalText } }
                    ],
                    SEARCH: () => [
                        { tool: 'search_knowledge', args: { query: context.originalText } }
                    ],
                    GENERAL: () => []
                };
                
                return plans[intent.intent]?.() || [];
            }
        },

        // 5. AGENT EXECUTOR - Loop principal do agente
        agent: {
            async process(userMessage, chatbot) {
                const startTime = Date.now();
                const trace = { steps: [], tools: [], duration: 0 };
                
                try {
                    // Step 1: Detectar intenção
                    trace.steps.push('intent_detection');
                    const intent = chatbot.intentDetector.detect(userMessage);
                    trace.intent = intent;
                    
                    // Step 2: Criar plano
                    trace.steps.push('planning');
                    const plan = chatbot.planner.createPlan(intent, intent.entities, {
                        originalText: userMessage,
                        history: chatbot.context.conversationHistory
                    });
                    trace.plan = plan;
                    
                    // Step 3: Executar plano (se houver)
                    trace.steps.push('execution');
                    const results = [];
                    for (const step of plan) {
                        const tool = chatbot.tools.definitions[step.tool];
                        if (tool) {
                            try {
                                const result = await tool.execute(step.args, chatbot);
                                results.push({ tool: step.tool, success: true, result });
                                trace.tools.push({ name: step.tool, success: true });
                            } catch (e) {
                                results.push({ tool: step.tool, success: false, error: e.message });
                                trace.tools.push({ name: step.tool, success: false, error: e.message });
                            }
                        }
                    }
                    trace.results = results;
                    
                    // Step 4: Verificar e formatar resposta
                    trace.steps.push('verification');
                    const response = await this.formatResponse(intent, results, userMessage, chatbot);
                    
                    // Step 5: Atualizar memória
                    trace.steps.push('memory_update');
                    chatbot.memory.update({
                        intent: intent.intent,
                        entities: intent.entities,
                        results: results,
                        timestamp: new Date().toISOString()
                    });
                    
                    trace.duration = Date.now() - startTime;
                    trace.success = true;
                    
                    // Log para debug
                    console.log('🤖 Agent trace:', trace);
                    
                    return { response, trace, useAI: plan.length === 0 };
                    
                } catch (error) {
                    trace.error = error.message;
                    trace.duration = Date.now() - startTime;
                    console.error('❌ Agent error:', error);
                    return { response: null, trace, useAI: true };
                }
            },
            
            async formatResponse(intent, results, originalMessage, chatbot) {
                // Se não teve resultados, deixa pro LLM
                if (results.length === 0) return null;
                
                // Verificar se todos falharam
                const allFailed = results.every(r => !r.success);
                if (allFailed) return null;
                
                // Formatar baseado na intenção
                const formatters = {
                    QUERY_PERSON: (results) => {
                        const stats = results.find(r => r.tool === 'get_person_stats')?.result;
                        const sla = results.find(r => r.tool === 'get_sla')?.result;
                        
                        if (!stats?.success) {
                            return `❌ ${stats?.error || 'Pessoa não encontrada'}
                                ${stats?.suggestions ? `\n💡 Você quis dizer: ${stats.suggestions.join(', ')}?` : ''}`;
                        }
                        
                        return `👤 <strong>${stats.name}</strong>
                            <br><br>📊 <strong>Estatísticas</strong> (${sla?.period || 'período total'}):
                            <br>• Total: ${stats.stats.total} tickets
                            <br>• Resolvidos: ${stats.stats.resolved}
                            <br>• Em aberto: ${stats.stats.open}
                            <br>• Urgentes: ${stats.stats.urgent}
                            <br><br>⏱️ <strong>SLA</strong>: ${sla?.slaRate || 'N/A'}%
                            <br>• Respondidos no prazo: ${sla?.withinSLA || 0}/${sla?.withResponse || 0}
                            <br>• Tempo médio resposta: ${sla?.avgResponseTime || 'N/A'}h`;
                    },
                    
                    QUERY_TEAM: (results) => {
                        const stats = results.find(r => r.tool === 'get_team_stats')?.result;
                        if (!stats?.success) {
                            return `❌ ${stats?.error}
                                ${stats?.suggestions ? `\n💡 Times disponíveis: ${stats.suggestions.join(', ')}` : ''}`;
                        }
                        return `🏢 <strong>Time: ${stats.name}</strong>
                            <br>• Total: ${stats.stats.total} tickets
                            <br>• Resolvidos: ${stats.stats.resolved}
                            <br>• Taxa: ${stats.stats.resolutionRate}%`;
                    },
                    
                    GET_RANKING: (results) => {
                        const ranking = results.find(r => r.tool === 'get_ranking')?.result;
                        if (!ranking?.success) return null;
                        
                        const emoji = ranking.type === 'person' ? '👤' : '🏢';
                        return `🏆 <strong>Ranking por ${ranking.metric}</strong>
                            <br><br><ul class="cb-list">${ranking.ranking.map((r, i) => 
                                `<li>${i+1}. ${emoji} ${r.name}: ${r.total} tickets (${r.rate}%)</li>`
                            ).join('')}</ul>`;
                    },
                    
                    GET_ALERTS: (results) => {
                        const alerts = results.find(r => r.tool === 'get_alerts')?.result;
                        if (!alerts || alerts.length === 0) {
                            return `✅ Nenhum alerta no momento. Tudo está sob controle!`;
                        }
                        return `🚨 <strong>${alerts.length} Alertas Detectados</strong>
                            <br><br><ul class="cb-list">${alerts.map(a => 
                                `<li><strong>${a.type}</strong>: ${a.message}</li>`
                            ).join('')}</ul>`;
                    },
                    
                    COMPARE: (results) => {
                        const comp = results.find(r => r.tool === 'compare_periods')?.result;
                        if (!comp?.success) return null;
                        
                        const trend = parseFloat(comp.change) > 0 ? '📈' : parseFloat(comp.change) < 0 ? '📉' : '➡️';
                        return `📊 <strong>Comparação de Períodos</strong>
                            <br><br>• Últimos ${comp.period1.days} dias: ${comp.period1.count} tickets
                            <br>• ${comp.period2.days} dias anteriores: ${comp.period2.count} tickets
                            <br><br>${trend} Variação: ${comp.change}%`;
                    },
                    
                    PREDICT: (results) => {
                        const pred = results.find(r => r.tool === 'predict_volume')?.result;
                        if (!pred?.success) return null;
                        
                        return `🔮 <strong>Previsão de Volume</strong>
                            <br><br>• Estimativa: ~${pred.prediction} tickets
                            <br>• Média atual: ${pred.avgPerDay} tickets/dia
                            <br>• Tendência: ${pred.trend}
                            <br>• Confiança: ${pred.confidence}`;
                    }
                };
                
                const formatter = formatters[intent.intent];
                return formatter ? formatter(results) : null;
            }
        },

        // 6. MEMORY MANAGER - Memória curta e longa
        memory: {
            shortTerm: [],
            workingMemory: null,
            
            update(data) {
                // Memória curta (últimas 20 interações)
                this.shortTerm.push(data);
                if (this.shortTerm.length > 20) this.shortTerm.shift();
                
                // Memória de trabalho (o que está fazendo agora)
                this.workingMemory = {
                    lastIntent: data.intent,
                    lastEntities: data.entities,
                    lastTimestamp: data.timestamp
                };
                
                // Salvar preferências detectadas (memória longa)
                if (data.entities?.person) {
                    this.savePreference('lastPerson', data.entities.person);
                }
                if (data.entities?.team) {
                    this.savePreference('lastTeam', data.entities.team);
                }
            },
            
            savePreference(key, value) {
                try {
                    const prefs = JSON.parse(localStorage.getItem('chatbot_preferences') || '{}');
                    prefs[key] = value;
                    prefs.lastUpdated = new Date().toISOString();
                    localStorage.setItem('chatbot_preferences', JSON.stringify(prefs));
                } catch (e) {}
            },
            
            getPreference(key) {
                try {
                    const prefs = JSON.parse(localStorage.getItem('chatbot_preferences') || '{}');
                    return prefs[key];
                } catch (e) { return null; }
            },
            
            getContext() {
                return {
                    shortTerm: this.shortTerm.slice(-5),
                    working: this.workingMemory,
                    preferences: JSON.parse(localStorage.getItem('chatbot_preferences') || '{}')
                };
            }
        },

        // 7. RAG - Retrieval Augmented Generation
        rag: {
            // Índice de conhecimento
            index: [],
            
            // Construir índice
            buildIndex() {
                this.index = [];
                
                // Indexar soluções conhecidas
                Object.entries(Chatbot.solucoesConhecidas || {}).forEach(([key, value]) => {
                    this.index.push({
                        type: 'solution',
                        key,
                        content: value,
                        keywords: key.split(/\s+/).concat(value.toLowerCase().split(/\s+/))
                    });
                });
                
                // Indexar knowledge base
                Object.entries(Chatbot.knowledge?.metrics || {}).forEach(([key, data]) => {
                    this.index.push({
                        type: 'metric',
                        key,
                        content: JSON.stringify(data),
                        keywords: [key, ...(data.explanation?.toLowerCase().split(/\s+/) || [])]
                    });
                });
                
                // Indexar decisões salvas
                const decisions = Chatbot.decisions.load();
                decisions.forEach(d => {
                    this.index.push({
                        type: 'decision',
                        key: d.id,
                        content: d.text,
                        keywords: d.text.toLowerCase().split(/\s+/).concat(d.tags || [])
                    });
                });
                
                console.log(`📚 RAG index built: ${this.index.length} items`);
            },
            
            // Buscar documentos relevantes
            search(query, limit = 5) {
                if (this.index.length === 0) this.buildIndex();
                
                const queryWords = query.toLowerCase().split(/\s+/);
                
                // Calcular score de relevância
                const scored = this.index.map(item => {
                    const matches = queryWords.filter(w => 
                        item.keywords.some(k => k.includes(w) || w.includes(k))
                    ).length;
                    return { ...item, score: matches / queryWords.length };
                }).filter(item => item.score > 0);
                
                // Ordenar por score
                scored.sort((a, b) => b.score - a.score);
                
                return scored.slice(0, limit);
            },
            
            // Enriquecer prompt com contexto
            enrichPrompt(query) {
                const relevant = this.search(query, 3);
                
                if (relevant.length === 0) return '';
                
                return `\n\n📚 CONTEXTO RELEVANTE DA BASE DE CONHECIMENTO:\n${relevant.map(r => 
                    `[${r.type}] ${r.key}: ${r.content.slice(0, 200)}...`
                ).join('\n')}`;
            }
        },

        // 8. EVALUATOR - Verificar qualidade da resposta
        evaluator: {
            // Verificar se resposta é válida
            verify(response, intent, results) {
                const checks = {
                    hasContent: response && response.length > 10,
                    hasData: results.some(r => r.success),
                    isRelevant: this.checkRelevance(response, intent),
                    noHallucination: this.checkHallucination(response, results)
                };
                
                const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
                
                return {
                    valid: score >= 0.5,
                    score,
                    checks
                };
            },
            
            checkRelevance(response, intent) {
                // Verificar se a resposta contém termos relacionados à intenção
                const intentKeywords = {
                    QUERY_PERSON: ['ticket', 'resolvid', 'sla', 'taxa'],
                    QUERY_TEAM: ['time', 'equipe', 'ticket', 'taxa'],
                    GET_RANKING: ['ranking', 'top', 'maior', 'menor'],
                    GET_ALERTS: ['alerta', 'urgent', 'problema', 'atenção']
                };
                
                const keywords = intentKeywords[intent.intent] || [];
                const lower = response?.toLowerCase() || '';
                
                return keywords.some(k => lower.includes(k));
            },
            
            checkHallucination(response, results) {
                // Verificar se números na resposta existem nos resultados
                const numbersInResponse = response?.match(/\d+/g) || [];
                const numbersInResults = JSON.stringify(results).match(/\d+/g) || [];
                
                // Se tem números, pelo menos alguns devem estar nos resultados
                if (numbersInResponse.length === 0) return true;
                
                const matches = numbersInResponse.filter(n => numbersInResults.includes(n));
                return matches.length > 0 || numbersInResponse.length < 3;
            }
        },

        // 9. TEST SUITE - Testes automáticos para validar o chatbot
        testSuite: {
            // Casos de teste
            testCases: [
                // Testes de Intent Detection
                { input: 'Qual o SLA da Jéssica?', expectedIntent: 'QUERY_PERSON', expectedEntity: 'person' },
                { input: 'Como está o time de Atendimento?', expectedIntent: 'QUERY_TEAM', expectedEntity: 'team' },
                { input: 'Ticket #12345', expectedIntent: 'QUERY_TICKET', expectedEntity: 'ticket_id' },
                { input: 'Quem tem mais tickets?', expectedIntent: 'GET_RANKING' },
                { input: 'Tem algum alerta?', expectedIntent: 'GET_ALERTS' },
                { input: 'Comparar semanas', expectedIntent: 'COMPARE' },
                { input: 'Previsão para amanhã', expectedIntent: 'PREDICT' },
                
                // Testes de Extração de Entidades
                { input: 'Tickets do João Silva', expectedPerson: 'João Silva' },
                { input: 'Últimos 30 dias', expectedPeriod: 30 },
                { input: 'Time de dev', expectedTeam: 'dev' },
                
                // Testes de Tools
                { input: 'Ranking de pessoas', expectedTool: 'get_ranking' },
                { input: 'Alertas urgentes', expectedTool: 'get_alerts' },
                { input: 'Performance da equipe', expectedTool: 'get_ranking' }
            ],
            
            // Executar todos os testes
            async runAll() {
                console.log('🧪 Iniciando Test Suite...\n');
                const results = { passed: 0, failed: 0, details: [] };
                
                for (const test of this.testCases) {
                    const result = await this.runTest(test);
                    if (result.passed) {
                        results.passed++;
                    } else {
                        results.failed++;
                    }
                    results.details.push(result);
                }
                
                console.log('\n📊 Resultado dos Testes:');
                console.log(`✅ Passou: ${results.passed}/${this.testCases.length}`);
                console.log(`❌ Falhou: ${results.failed}/${this.testCases.length}`);
                console.log(`📈 Taxa: ${((results.passed / this.testCases.length) * 100).toFixed(1)}%`);
                
                // Mostrar falhas
                const failures = results.details.filter(r => !r.passed);
                if (failures.length > 0) {
                    console.log('\n❌ Falhas:');
                    failures.forEach(f => console.log(`  - "${f.input}": ${f.reason}`));
                }
                
                return results;
            },
            
            // Executar um teste individual
            async runTest(test) {
                const result = {
                    input: test.input,
                    passed: true,
                    reason: ''
                };
                
                try {
                    // Testar Intent Detection
                    const intent = Chatbot.intentDetector.detect(test.input);
                    
                    if (test.expectedIntent && intent.intent !== test.expectedIntent) {
                        result.passed = false;
                        result.reason = `Intent: esperado ${test.expectedIntent}, recebido ${intent.intent}`;
                        return result;
                    }
                    
                    // Testar extração de entidades
                    if (test.expectedPerson && !intent.entities.person?.toLowerCase().includes(test.expectedPerson.toLowerCase().split(' ')[0])) {
                        result.passed = false;
                        result.reason = `Person: esperado ${test.expectedPerson}, recebido ${intent.entities.person}`;
                        return result;
                    }
                    
                    if (test.expectedPeriod && intent.entities.period !== test.expectedPeriod) {
                        result.passed = false;
                        result.reason = `Period: esperado ${test.expectedPeriod}, recebido ${intent.entities.period}`;
                        return result;
                    }
                    
                    if (test.expectedTeam && !intent.entities.team?.toLowerCase().includes(test.expectedTeam.toLowerCase())) {
                        result.passed = false;
                        result.reason = `Team: esperado ${test.expectedTeam}, recebido ${intent.entities.team}`;
                        return result;
                    }
                    
                    // Testar planejamento
                    if (test.expectedTool) {
                        const plan = Chatbot.planner.createPlan(intent, intent.entities, { originalText: test.input });
                        const hasTool = plan.some(p => p.tool === test.expectedTool);
                        if (!hasTool) {
                            result.passed = false;
                            result.reason = `Tool: esperado ${test.expectedTool}, plano: ${plan.map(p => p.tool).join(', ')}`;
                            return result;
                        }
                    }
                    
                    console.log(`✅ "${test.input}" - OK`);
                    
                } catch (error) {
                    result.passed = false;
                    result.reason = `Erro: ${error.message}`;
                }
                
                return result;
            },
            
            // Teste de stress (muitas perguntas)
            async stressTest(iterations = 50) {
                console.log(`🔥 Stress Test: ${iterations} iterações...`);
                const start = Date.now();
                const questions = [
                    'Quantos tickets?', 'SLA geral', 'Ranking', 'Alertas',
                    'Time de dev', 'Tickets urgentes', 'Previsão', 'Comparar'
                ];
                
                for (let i = 0; i < iterations; i++) {
                    const q = questions[i % questions.length];
                    await Chatbot.agent.process(q, Chatbot);
                }
                
                const duration = Date.now() - start;
                console.log(`✅ Stress Test completo: ${iterations} em ${duration}ms (${(duration/iterations).toFixed(1)}ms/iteração)`);
                return { iterations, duration, avgTime: duration/iterations };
            },
            
            // Benchmark de performance
            async benchmark() {
                console.log('⚡ Benchmark de Performance...\n');
                
                const tests = [
                    { name: 'Intent Detection', fn: () => Chatbot.intentDetector.detect('Qual o SLA da Jessica?') },
                    { name: 'Entity Extraction', fn: () => Chatbot.intentDetector.extractEntities('Tickets do João nos últimos 30 dias') },
                    { name: 'Planner', fn: () => Chatbot.planner.createPlan({ intent: 'QUERY_PERSON' }, { person: 'Test' }, {}) },
                    { name: 'RAG Search', fn: () => Chatbot.rag.search('sla resposta') },
                    { name: 'Tool Execution', fn: () => Chatbot.toolExecutors.getRanking({ type: 'person', limit: 5 }) }
                ];
                
                const results = [];
                
                for (const test of tests) {
                    const iterations = 100;
                    const start = performance.now();
                    
                    for (let i = 0; i < iterations; i++) {
                        test.fn();
                    }
                    
                    const duration = performance.now() - start;
                    const avgTime = duration / iterations;
                    
                    results.push({ name: test.name, avgTime: avgTime.toFixed(3), total: duration.toFixed(1) });
                    console.log(`  ${test.name}: ${avgTime.toFixed(3)}ms (média de ${iterations} execuções)`);
                }
                
                return results;
            }
        },

        // Base de conhecimento expandida (extraída do glossário)
        knowledge: {
            metrics: {
                'taxa de resolução': {
                    formula: '(Tickets Resolvidos ÷ Total de Tickets) × 100',
                    explanation: 'Percentual de tickets que foram finalizados em relação ao total.',
                    goodValue: '> 80%',
                    badValue: '< 60%',
                    tips: ['Priorize tickets antigos', 'Evite reaberturas', 'Documente soluções']
                },
                'sla': {
                    formula: '(Tickets respondidos em até 4h ÷ Total COM resposta) × 100',
                    explanation: 'Service Level Agreement - Acordo de nível de serviço para primeira resposta.',
                    goodValue: '> 85%',
                    badValue: '< 70%',
                    tips: ['Configure alertas', 'Priorize por prazo', 'Use templates de resposta'],
                    warning: 'ATENÇÃO: Tickets sem resposta (Em Análise, etc.) são IGNORADOS no cálculo! O SLA só considera tickets que JÁ foram respondidos. Isso pode inflar artificialmente o percentual.',
                    calculation: 'Exemplo: Se você tem 100 tickets, 50 respondidos (40 no prazo) e 50 sem resposta, o SLA mostra 80% (40/50), mas o real seria 40% (40/100).',
                    howItWorks: 'O cálculo usa: Data da 1ª resposta - Data de criação. Se não houver resposta, o ticket não entra no cálculo.'
                },
                'tempo médio': {
                    formula: 'Soma dos tempos ÷ Quantidade de tickets',
                    explanation: 'Média de tempo para resolver ou responder tickets.',
                    goodValue: '< 4h para resposta, < 24h para resolução',
                    tips: ['Categorize bem os tickets', 'Use base de conhecimento', 'Escale quando necessário']
                },
                'backlog': {
                    formula: 'Tickets abertos + pendentes',
                    explanation: 'Quantidade de tickets aguardando resolução.',
                    goodValue: '< 30% do volume mensal',
                    tips: ['Monitore diariamente', 'Distribua carga entre equipe', 'Identifique gargalos']
                },
                'first response time': {
                    formula: 'Data primeira resposta - Data criação',
                    explanation: 'Tempo entre a abertura do ticket e a primeira resposta do atendente.',
                    goodValue: '< 4 horas',
                    tips: ['Use respostas automáticas', 'Priorize por SLA', 'Monitore em tempo real']
                },
                'resolution time': {
                    formula: 'Data resolução - Data criação',
                    explanation: 'Tempo total desde a abertura até o fechamento do ticket.',
                    goodValue: '< 24 horas',
                    tips: ['Escale tickets complexos', 'Documente soluções', 'Automatize tarefas repetitivas']
                }
            },
            
            status: {
                2:  { name: 'Aberto', color: '#ef4444', desc: 'Não iniciado', icon: '🔴' },
                3:  { name: 'Pendente', color: '#f59e0b', desc: 'Aguardando algo', icon: '🟡' },
                4:  { name: 'Resolvido', color: '#10b981', desc: 'Solução aplicada', icon: '✅' },
                5:  { name: 'Fechado', color: '#6b7280', desc: 'Encerrado', icon: '✔️' },
                6:  { name: 'Em Homologação', color: '#8b5cf6', desc: 'Teste em HML', icon: '🧪' },
                7:  { name: 'Aguardando Cliente', color: '#f59e0b', desc: 'Esperando retorno', icon: '⏸️' },
                8:  { name: 'Em Tratativa', color: '#06b6d4', desc: 'Sendo trabalhado', icon: '🔄' },
                10: { name: 'Em Análise', color: '#06b6d4', desc: 'Investigando', icon: '🔍' },
                11: { name: 'Interno', color: '#64748b', desc: 'Ticket interno', icon: '🏠' },
                12: { name: 'Aguardando Publicar HML', color: '#3b82f6', desc: 'Esperando deploy HML', icon: '📦' },
                13: { name: 'Aguardando Publicar PROD', color: '#8b5cf6', desc: 'Esperando deploy PROD', icon: '🚀' },
                14: { name: 'MVP', color: '#ec4899', desc: 'Projeto MVP', icon: '⭐' },
                15: { name: 'Validação-Atendimento', color: '#f97316', desc: 'Validando', icon: '✍️' },
                16: { name: 'Aguardando Parceiros', color: '#a855f7', desc: 'Depende de terceiros', icon: '🤝' },
                17: { name: 'Pausado', color: '#64748b', desc: 'Temporariamente parado', icon: '⏸️' },
                18: { name: 'Validação-CS', color: '#f97316', desc: 'CS validando', icon: '✍️' },
                19: { name: 'Levantamento de Esforço', color: '#6366f1', desc: 'Estimando esforço', icon: '📊' }
            },
            
            priority: {
                1: { name: 'Baixa', color: '#6b7280', sla: '48h' },
                2: { name: 'Média', color: '#3b82f6', sla: '24h' },
                3: { name: 'Alta', color: '#f59e0b', sla: '8h' },
                4: { name: 'Urgente', color: '#ef4444', sla: '4h' }
            },
            
            // Sinônimos para melhor compreensão
            synonyms: {
                'aberto': ['abertos', 'em aberto', 'não resolvido', 'pendente de atendimento', 'novo', 'novos'],
                'fechado': ['fechados', 'resolvido', 'resolvidos', 'finalizado', 'finalizados', 'concluído', 'concluídos', 'encerrado'],
                'pendente': ['pendentes', 'aguardando', 'esperando', 'em espera'],
                'urgente': ['urgentes', 'crítico', 'críticos', 'emergência', 'prioridade máxima', 'vermelho'],
                'alta': ['alto', 'importante', 'importantes'],
                'sla': ['acordo de nível', 'prazo', 'tempo de resposta', 'meta'],
                'tempo': ['duração', 'quanto tempo', 'demora', 'velocidade'],
                'pessoa': ['pessoas', 'agente', 'agentes', 'atendente', 'atendentes', 'responsável', 'responsáveis', 'quem'],
                'time': ['times', 'equipe', 'equipes', 'grupo', 'grupos', 'setor', 'setores'],
                'hoje': ['dia de hoje', 'neste dia', 'agora'],
                'semana': ['semanal', 'essa semana', 'esta semana', '7 dias', 'últimos 7 dias'],
                'mês': ['mensal', 'esse mês', 'este mês', '30 dias', 'últimos 30 dias'],
                'melhor': ['melhores', 'top', 'ranking', 'primeiro', 'primeiros', 'campeão', 'destaque'],
                'problema': ['problemas', 'erro', 'erros', 'falha', 'falhas', 'issue', 'bug', 'incidente'],
                'ticket': ['tickets', 'chamado', 'chamados', 'solicitação', 'solicitações', 'atendimento', 'atendimentos']
            }
        },

        colors: {
            bg: '#1e1e2e',
            surface: '#2a2a3e',
            border: '#3f3f46',
            primary: '#3b82f6',
            text: '#e4e4e7',
            textMuted: '#a1a1aa',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            bot: '#8b5cf6'
        },

        // Padrões de perguntas e respostas
        patterns: [
            // Contagens básicas
            { 
                regex: /quantos?\s+tickets?\s+(abertos?|em\s+aberto)/i,
                handler: 'countOpenTickets'
            },
            { 
                regex: /quantos?\s+tickets?\s+(fechados?|resolvidos?|finalizados?)/i,
                handler: 'countClosedTickets'
            },
            { 
                regex: /quantos?\s+tickets?\s+(pendentes?|aguardando)/i,
                handler: 'countPendingTickets'
            },
            { 
                regex: /quantos?\s+tickets?\s+(urgentes?|cr[íi]ticos?)/i,
                handler: 'countUrgentTickets'
            },
            { 
                regex: /quantos?\s+tickets?\s+(total|todos?|temos)/i,
                handler: 'countTotalTickets'
            },
            { 
                regex: /quantos?\s+tickets?\s+hoje/i,
                handler: 'countTodayTickets'
            },
            { 
                regex: /quantos?\s+tickets?\s+(essa|esta|nessa|nesta)\s+semana/i,
                handler: 'countWeekTickets'
            },
            { 
                regex: /quantos?\s+tickets?\s+(esse|este|nesse|neste)\s+m[êe]s/i,
                handler: 'countMonthTickets'
            },

            // SLA
            { 
                regex: /(qual|como\s+est[áa]|quanto\s+[ée])\s+(o\s+)?sla/i,
                handler: 'getSLAInfo'
            },
            { 
                regex: /tickets?\s+(fora|viol\w+)\s+(do\s+)?sla/i,
                handler: 'getOutsideSLA'
            },

            // Rankings e tops
            { 
                regex: /quem\s+(mais\s+)?(resolveu|atendeu|fechou)/i,
                handler: 'getTopResolver'
            },
            { 
                regex: /(top|melhores?|ranking)\s+(\d+)?\s*(pessoas?|agentes?|atendentes?)/i,
                handler: 'getTopAgents'
            },
            { 
                regex: /(top|melhores?|ranking)\s+(\d+)?\s*times?/i,
                handler: 'getTopTeams'
            },

            // Tempos
            { 
                regex: /tempo\s+m[ée]dio\s+(de\s+)?(resolu[çc][ãa]o|resolver)/i,
                handler: 'getAvgResolutionTime'
            },
            { 
                regex: /tempo\s+m[ée]dio\s+(de\s+)?(primeira\s+)?resposta/i,
                handler: 'getAvgFirstResponseTime'
            },

            // Por pessoa/time
            { 
                regex: /tickets?\s+(de|do|da)\s+(.+)/i,
                handler: 'getTicketsByEntity'
            },
            { 
                regex: /como\s+est[áa]\s+(o|a)?\s*(.+)/i,
                handler: 'getEntityStatus'
            },

            // Tendências
            { 
                regex: /(tend[êe]ncia|evolu[çc][ãa]o|hist[óo]rico)/i,
                handler: 'getTrend'
            },

            // Problemas
            { 
                regex: /(problemas?|alertas?|aten[çc][ãa]o)/i,
                handler: 'getProblems'
            },

            // Ajuda
            { 
                regex: /(ajuda|help|comandos|o\s+que\s+(voc[êe]|vc)\s+(faz|pode))/i,
                handler: 'showHelp'
            },

            // Saudações
            { 
                regex: /^(oi|ol[áa]|hey|e\s*a[íi]|bom\s+dia|boa\s+tarde|boa\s+noite)/i,
                handler: 'greet'
            },

            // Explicações de conceitos (integração com glossário)
            {
                regex: /(o\s+que\s+[ée]|como\s+funciona|explica|me\s+explique|significado|significa)\s+(.+)/i,
                handler: 'explainConcept'
            },
            {
                regex: /(como\s+[ée]\s+calculad[oa]|f[óo]rmula|c[áa]lculo)\s+(d[aoe]\s+)?(.+)/i,
                handler: 'explainFormula'
            },
            {
                regex: /(qual\s+[ée]\s+a?\s*meta|qual\s+deveria\s+ser|valor\s+ideal)\s+(d[aoe]\s+)?(.+)/i,
                handler: 'explainTarget'
            },
            {
                regex: /(dicas?|como\s+melhorar|sugest[õo]es?)\s+(para\s+)?(.+)?/i,
                handler: 'giveTips'
            },

            // Comparações
            {
                regex: /compar(ar|e|ativo|a[çc][ãa]o)\s+(.+)\s+(com|e|vs|versus)\s+(.+)/i,
                handler: 'compare'
            },

            // Por que / análise
            {
                regex: /(por\s*qu[eê]|qual\s+motivo|causa|raz[ãa]o)\s+(.+)/i,
                handler: 'analyzeWhy'
            },

            // Previsões simples
            {
                regex: /(previs[ãa]o|vai\s+dar|conseguimos|vamos\s+bater|estimativa)/i,
                handler: 'predict'
            },

            // Resumo / Overview
            {
                regex: /(resumo|overview|vis[ãa]o\s+geral|status\s+geral|como\s+estamos)/i,
                handler: 'getOverview'
            },

            // Mais perguntas / continuar
            {
                regex: /(mais|continua|detalhe|aprofunda|explica\s+mais)/i,
                handler: 'continueContext'
            },

            // Ver por outro ângulo / perspectiva alternativa
            {
                regex: /(ver\s+por\s+outro|outro\s+[âa]ngulo|outra\s+perspectiva|de\s+outra\s+forma)/i,
                handler: 'handleAlternativeView'
            },

            // Mais detalhes (botão de sugestão)
            {
                regex: /^mais\s+detalhes$/i,
                handler: 'handleMoreDetails'
            },

            // ============= SUGESTÕES CONTEXTUAIS =============
            
            // Ver tickets fora do SLA
            {
                regex: /(ver\s+)?tickets?\s+(fora|violando|atrasados?)\s+(do\s+)?sla/i,
                handler: 'handleTicketsOutsideSLA'
            },

            // Comparar SLA semanal
            {
                regex: /comparar?\s+sla\s+(semanal|por\s+semana)/i,
                handler: 'handleCompareSLAWeekly'
            },

            // Ver por time
            {
                regex: /^ver\s+por\s+time$/i,
                handler: 'handleViewByTeam'
            },

            // Ver por pessoa
            {
                regex: /^ver\s+por\s+pessoa$/i,
                handler: 'handleViewByPerson'
            },

            // Qual time precisa de atenção
            {
                regex: /qual\s+time\s+(precisa|necessita|requer)\s+(de\s+)?aten[çc][ãa]o/i,
                handler: 'handleTeamNeedsAttention'
            },

            // Listar urgentes abertos
            {
                regex: /listar?\s+urgentes?\s+abertos?/i,
                handler: 'handleListUrgentOpen'
            },

            // Quem está com urgentes
            {
                regex: /quem\s+(est[áa]|tem)\s+(com\s+)?urgentes?/i,
                handler: 'handleWhoHasUrgent'
            },

            // Ver avaliações negativas
            {
                regex: /(ver\s+)?avalia[çc][õo]es?\s+negativas?/i,
                handler: 'handleNegativeReviews'
            },

            // Ranking de satisfação
            {
                regex: /ranking\s+(de\s+)?satisfa[çc][ãa]o/i,
                handler: 'handleSatisfactionRanking'
            },

            // O que priorizar hoje
            {
                regex: /o\s+que\s+priorizar\s+(hoje|agora)/i,
                handler: 'handleWhatToPrioritize'
            },

            // Ver tendência mensal
            {
                regex: /(ver\s+)?tend[êe]ncia\s+mensal/i,
                handler: 'handleMonthlyTrend'
            },

            // Qual dia tem mais tickets
            {
                regex: /qual\s+dia\s+(tem|recebe)\s+mais\s+tickets?/i,
                handler: 'handlePeakDay'
            },

            // ============= NOVOS PATTERNS (50 MELHORIAS) =============
            
            // Alertas e anomalias
            {
                regex: /(alertas?|anomalias?|problemas?\s+cr[íi]ticos?|urg[êe]ncia)/i,
                handler: 'handleAlerts'
            },

            // Previsão de volume
            {
                regex: /(prever|previs[ãa]o|quantos?\s+tickets?\s+amanh[ãa]|pr[óo]ximos?\s+dias?)/i,
                handler: 'handlePrediction'
            },

            // Carga de trabalho
            {
                regex: /(carga|sobrecarga|disponibilidade|quem\s+pode\s+(receber|pegar)|capacidade)/i,
                handler: 'handleWorkload'
            },

            // Tickets similares
            {
                regex: /(tickets?\s+similares?|parecidos?|relacionados?)\s*(ao?|com|do)?\s*#?(\d+)?/i,
                handler: 'handleSimilarTickets'
            },

            // Sugestão de atribuição
            {
                regex: /(quem\s+deve|atribuir|designar|escalar|para\s+quem)\s*(ticket|chamado)?\s*#?(\d+)?/i,
                handler: 'handleAssignmentSuggestion'
            },

            // Tempo estimado
            {
                regex: /(quanto\s+tempo|estimativa|previs[ãa]o)\s*(para|de)?\s*(resolver|resoluc[ãa]o|fechar)?\s*#?(\d+)?/i,
                handler: 'handleTimeEstimate'
            },

            // Histórico do solicitante
            {
                regex: /(hist[óo]rico|tickets?)\s+(do|da|de)?\s*(cliente|solicitante|usu[áa]rio|requester)/i,
                handler: 'handleRequesterHistory'
            },

            // Padrões (dia/hora)
            {
                regex: /(padr[ãõ]es?|hor[áa]rio\s+de\s+pico|dia\s+(mais|de\s+maior)|quando\s+(mais|chegam?))/i,
                handler: 'handlePatterns'
            },

            // CSAT / Satisfação
            {
                regex: /(satisfa[çc][ãa]o|csat|nps|avalia[çc][ãõo]es?|feedback)/i,
                handler: 'handleCSAT'
            },

            // Comparativo de períodos
            {
                regex: /(comparar?\s+per[íi]odos?|semana\s+passada|m[êe]s\s+passado|vs\s+anterior)/i,
                handler: 'handlePeriodComparison'
            },

            // Por canal
            {
                regex: /(canais?|origem|fonte|source|de\s+onde\s+vem|v[êe]m)/i,
                handler: 'handleChannels'
            },

            // Por produto/sistema
            {
                regex: /(produtos?|sistemas?|m[óo]dulos?|qual\s+produto)/i,
                handler: 'handleProducts'
            },

            // Ranking específico
            {
                regex: /(ranking|top|melhor)\s+(sla|resolu[çc][ãa]o|volume|tickets?)/i,
                handler: 'handleRanking'
            },

            // Soluções conhecidas
            {
                regex: /(solu[çc][ãa]o|como\s+resolver|fix|corre[çc][ãa]o)\s+(para|de|do)?\s*(.+)/i,
                handler: 'handleKnownSolution'
            },

            // Status rápido
            {
                regex: /(status\s+r[áa]pido|resumo\s+r[áa]pido|quick\s+status|dashboard)/i,
                handler: 'handleQuickStatus'
            },

            // ============= MEMÓRIA DE DECISÕES =============
            
            // Salvar nota/decisão
            {
                regex: /(anot(ar|e)|salv(ar|e)\s+nota|registr(ar|e)\s+decis[ãa]o|lembr(ar|e)|guardar)\s*:?\s*(.+)/i,
                handler: 'handleSaveDecision'
            },

            // Buscar notas/decisões
            {
                regex: /(ver|mostrar|buscar|listar)\s+(notas?|decis[õo]es?|anota[çc][õo]es?|hist[óo]rico\s+de\s+decis[õo]es?)/i,
                handler: 'handleListDecisions'
            },

            // Por que escalamos/priorizamos (busca específica)
            {
                regex: /(por\s*qu[eê]|quando|como)\s+(escalamos|priorizamos|decidimos|resolvemos)/i,
                handler: 'handleSearchDecisions'
            },

            // ============= NAVEGAÇÃO/BI ANALYTICS =============
            
            // Ir para view
            {
                regex: /(ir\s+para|abrir|mostrar|ver)\s+(o\s+)?(dashboard|tickets|bi\s*(analytics)?|charts|insights|relat[óo]rio)/i,
                handler: 'handleNavigate'
            },

            // Atualizar dados do Supabase
            {
                regex: /(atualizar|recarregar|refresh|buscar)\s+(dados|tickets)\s*(do\s+supabase|em\s+tempo\s+real)?/i,
                handler: 'handleRefreshData'
            },

            // Query Supabase customizada
            {
                regex: /(buscar|query|consultar)\s+(tickets?|dados?)\s+(urgentes?|abertos?|fechados?|do\s+time|da\s+pessoa)/i,
                handler: 'handleSupabaseQuery'
            }
        ],

        init() {
            this.createChatWindow();
            this.addChatButton();
            this.loadHistory();
            this.checkAIConfig();
            console.log('🤖 Chatbot v3.0 inicializado', this.aiConfig.apiKey ? '(IA ativa)' : '(modo local)');
        },

        checkAIConfig() {
            // Verificar se tem API keys salvas
            const savedGemini = localStorage.getItem('chatbot_gemini_key');
            const savedGroq = localStorage.getItem('chatbot_groq_key');
            if (savedGemini) this.aiConfig.geminiKey = savedGemini;
            if (savedGroq) this.aiConfig.groqKey = savedGroq;
        },

        setGeminiKey(key) {
            this.aiConfig.geminiKey = key;
            localStorage.setItem('chatbot_gemini_key', key);
            this.updateStatus();
            this.addMessage('✅ Gemini configurado! Agora uso Google Gemini como IA principal.', 'bot');
        },

        setGroqKey(key) {
            this.aiConfig.groqKey = key;
            localStorage.setItem('chatbot_groq_key', key);
            this.updateStatus();
            this.addMessage('✅ Groq configurado como fallback!', 'bot');
        },

        updateStatus() {
            const status = document.getElementById('cbStatus');
            if (status) {
                if (this.aiConfig.geminiKey) {
                    status.textContent = '🟢 Gemini ativo';
                } else if (this.aiConfig.groqKey) {
                    status.textContent = '🟡 Groq ativo';
                } else {
                    status.textContent = '⚪ Modo local';
                }
            }
        },

        showSettings() {
            const geminiStatus = this.aiConfig.geminiKey ? '🟢 ' + this.aiConfig.geminiKey.slice(-6) : '⚪ Não configurado';
            const groqStatus = this.aiConfig.groqKey ? '🟢 ' + this.aiConfig.groqKey.slice(-6) : '⚪ Não configurado';
            
            const settingsHtml = `
                <div style="padding:10px;">
                    <strong>⚙️ Configurações de IA</strong><br><br>
                    
                    <strong>📊 Status dos Providers:</strong><br>
                    <table style="width:100%;font-size:0.9em;margin:8px 0;">
                        <tr><td>🥇 Gemini (principal):</td><td>${geminiStatus}</td></tr>
                        <tr><td>🥈 Groq (fallback):</td><td>${groqStatus}</td></tr>
                    </table>
                    
                    <strong>💎 Configurar Gemini (GRATUITO):</strong><br>
                    1. Acesse: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#3b82f6;">aistudio.google.com</a><br>
                    2. Crie uma API key<br>
                    3. Digite no chat:<br>
                    <code style="background:#3f3f5a;padding:4px 8px;border-radius:4px;">/gemini SUA_API_KEY</code><br><br>
                    
                    <strong>⚡ Configurar Groq (fallback):</strong><br>
                    <code style="background:#3f3f5a;padding:4px 8px;border-radius:4px;">/groq SUA_API_KEY</code><br><br>
                    
                    <span style="color:#a1a1aa;font-size:0.85em;">
                    Ordem de prioridade: Gemini → Groq → Local<br>
                    Ambos são gratuitos!
                    </span>
                </div>
            `;
            
            // Remover welcome se existir
            const welcome = document.querySelector('.cb-welcome');
            if (welcome) welcome.remove();
            
            this.addMessage(settingsHtml, 'bot');
        },

        // Gerar contexto do sistema para a IA
        generateSystemContext() {
            const tickets = window.allTicketsCache || [];
            const now = new Date();
            
            // Calcular período dos dados (data mais antiga e mais recente)
            const ticketsWithDate = tickets.filter(t => t.created_at);
            let dataOldest = null, dataNewest = null, dataPeriodDays = 0;
            if (ticketsWithDate.length > 0) {
                const dates = ticketsWithDate.map(t => new Date(t.created_at)).sort((a, b) => a - b);
                dataOldest = dates[0];
                dataNewest = dates[dates.length - 1];
                dataPeriodDays = Math.ceil((dataNewest - dataOldest) / (1000 * 60 * 60 * 24));
            }
            const formatDateBR = (d) => d ? d.toLocaleDateString('pt-BR') : 'N/A';
            
            // Estatísticas gerais
            const total = tickets.length;
            const open = tickets.filter(t => t.status == 2).length;
            // Todos os status "em andamento" (não abertos e não fechados)
            const inProgressStatus = [3, 6, 7, 8, 10, 12, 13, 15, 16, 17, 18, 19];
            const pending = tickets.filter(t => inProgressStatus.includes(Number(t.status))).length;
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status))).length;
            const urgent = tickets.filter(t => t.priority == 4).length;
            const urgentOpen = tickets.filter(t => t.priority == 4 && ![4, 5].includes(Number(t.status))).length;
            
            // Estatísticas temporais
            const today = now.toISOString().slice(0, 10);
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            
            const todayTickets = tickets.filter(t => t.created_at?.slice(0, 10) === today);
            const weekTickets = tickets.filter(t => t.created_at && new Date(t.created_at) >= weekAgo);
            const monthTickets = tickets.filter(t => t.created_at && new Date(t.created_at) >= monthAgo);
            
            const todayResolved = todayTickets.filter(t => [4,5].includes(Number(t.status))).length;
            const weekResolved = weekTickets.filter(t => [4,5].includes(Number(t.status))).length;
            
            // SLA
            const withSLA = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            let slaRate = 0;
            let avgResponseTime = 0;
            if (withSLA.length > 0) {
                const times = withSLA.map(t => 
                    (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60)
                );
                avgResponseTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
                const withinSLA = times.filter(t => t <= 4).length;
                slaRate = ((withinSLA / withSLA.length) * 100).toFixed(1);
            }

            // Tempo médio de resolução
            const resolvedWithTime = tickets.filter(t => t.stats_resolved_at && t.created_at && [4,5].includes(Number(t.status)));
            let avgResolutionTime = 0;
            if (resolvedWithTime.length > 0) {
                const times = resolvedWithTime.map(t => 
                    (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60)
                );
                avgResolutionTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
            }

            // Top pessoas (com mais detalhes)
            const personStats = {};
            tickets.forEach(t => {
                const person = t.cf_tratativa || 'Não atribuído';
                person.split(/[,;\/]/).forEach(p => {
                    const name = p.trim();
                    if (name && name.length > 2) {
                        if (!personStats[name]) personStats[name] = { total: 0, resolved: 0 };
                        personStats[name].total++;
                        if ([4,5].includes(Number(t.status))) personStats[name].resolved++;
                    }
                });
            });
            const topPeople = Object.entries(personStats)
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? ((stats.resolved/stats.total)*100).toFixed(0) : 0 }))
                .sort((a, b) => b.resolved - a.resolved)
                .slice(0, 10);

            // Times
            const teamStats = {};
            tickets.forEach(t => {
                const team = t.cf_grupo_tratativa || t.group_name || 'Sem time';
                if (!teamStats[team]) teamStats[team] = { total: 0, resolved: 0, open: 0 };
                teamStats[team].total++;
                if ([4,5].includes(Number(t.status))) teamStats[team].resolved++;
                if (t.status == 2) teamStats[team].open++;
            });
            const topTeams = Object.entries(teamStats)
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? ((stats.resolved/stats.total)*100).toFixed(0) : 0 }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // Tickets problemáticos
            const oldOpenTickets = tickets
                .filter(t => t.status == 2 && t.created_at)
                .map(t => ({ ...t, age: Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24)) }))
                .filter(t => t.age > 7)
                .sort((a, b) => b.age - a.age)
                .slice(0, 5);

            const outsideSLA = withSLA
                .filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time > 4;
                }).length;

            // Tendência (comparar semana atual vs anterior)
            const prevWeekStart = new Date(now - 14 * 24 * 60 * 60 * 1000);
            const prevWeekTickets = tickets.filter(t => {
                if (!t.created_at) return false;
                const d = new Date(t.created_at);
                return d >= prevWeekStart && d < weekAgo;
            });
            const weekTrend = prevWeekTickets.length > 0 
                ? (((weekTickets.length - prevWeekTickets.length) / prevWeekTickets.length) * 100).toFixed(0)
                : 0;

            // Por dia da semana
            const byDayOfWeek = [0,0,0,0,0,0,0];
            tickets.forEach(t => {
                if (t.created_at) {
                    const day = new Date(t.created_at).getDay();
                    byDayOfWeek[day]++;
                }
            });
            const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            const peakDay = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));

            // Por hora
            const byHour = {};
            tickets.forEach(t => {
                if (t.created_at) {
                    const hour = new Date(t.created_at).getHours();
                    byHour[hour] = (byHour[hour] || 0) + 1;
                }
            });
            const peakHour = Object.entries(byHour).sort((a,b) => b[1] - a[1])[0];

            // TAGS - Estatísticas
            const tagStats = {};
            tickets.forEach(t => {
                const ticketTags = t.tags || [];
                const tagsArray = Array.isArray(ticketTags) ? ticketTags : 
                    (typeof ticketTags === 'string' ? ticketTags.split(',').map(s => s.trim()) : []);
                
                tagsArray.forEach(tag => {
                    if (tag && tag.length > 0) {
                        if (!tagStats[tag]) tagStats[tag] = { total: 0, resolved: 0, open: 0 };
                        tagStats[tag].total++;
                        if ([4,5].includes(Number(t.status))) tagStats[tag].resolved++;
                        if (t.status == 2) tagStats[tag].open++;
                    }
                });
            });
            const topTags = Object.entries(tagStats)
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? ((stats.resolved/stats.total)*100).toFixed(0) : 0 }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);

            // MELHORIA 1: Dados de Acompanhamento (cf_pessoa_acompanhamento)
            const acompanhamentoStats = {};
            tickets.forEach(t => {
                // Verificar campos de acompanhamento
                const campos = [t.cf_pessoa_acompanhamento, t.cf_pessoa_acompanhamento_1, 
                               t.cf_pessoa_acompanhamento_2, t.cf_pessoa_acompanhamento_3];
                campos.forEach(pessoa => {
                    if (pessoa && pessoa.trim().length > 2) {
                        const name = pessoa.trim();
                        if (!acompanhamentoStats[name]) acompanhamentoStats[name] = { total: 0, resolved: 0, open: 0, pending: 0 };
                        acompanhamentoStats[name].total++;
                        if ([4,5].includes(Number(t.status))) acompanhamentoStats[name].resolved++;
                        if (t.status == 2) acompanhamentoStats[name].open++;
                        if ([3,6,7].includes(Number(t.status))) acompanhamentoStats[name].pending++;
                    }
                });
            });
            const topAcompanhamento = Object.entries(acompanhamentoStats)
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);

            // MELHORIA 3: Comparação Temporal Detalhada
            const prevWeekResolved = prevWeekTickets.filter(t => [4,5].includes(Number(t.status))).length;
            const weekSLATickets = weekTickets.filter(t => t.stats_first_responded_at && t.created_at);
            const prevWeekSLATickets = prevWeekTickets.filter(t => t.stats_first_responded_at && t.created_at);
            let weekSLA = 0, prevWeekSLA = 0;
            if (weekSLATickets.length > 0) {
                const withinSLA = weekSLATickets.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time <= 4;
                }).length;
                weekSLA = ((withinSLA / weekSLATickets.length) * 100).toFixed(1);
            }
            if (prevWeekSLATickets.length > 0) {
                const withinSLA = prevWeekSLATickets.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time <= 4;
                }).length;
                prevWeekSLA = ((withinSLA / prevWeekSLATickets.length) * 100).toFixed(1);
            }

            // MELHORIA 10: Dados de Satisfação
            const surveys = window.surveysCache || [];
            let satisfactionData = { total: 0, positive: 0, negative: 0, avgRating: 0 };
            if (surveys.length > 0) {
                satisfactionData.total = surveys.length;
                satisfactionData.positive = surveys.filter(s => s.rating >= 4).length;
                satisfactionData.negative = surveys.filter(s => s.rating <= 2).length;
                const totalRating = surveys.reduce((sum, s) => sum + (s.rating || 0), 0);
                satisfactionData.avgRating = (totalRating / surveys.length).toFixed(1);
            }

            // MELHORIA 9: Por Canal de origem
            const channelNames = { 1: 'Email', 2: 'Portal', 3: 'Telefone', 7: 'Chat', 9: 'Widget', 10: 'API' };
            const channelStats = {};
            tickets.forEach(t => {
                const channel = channelNames[t.source] || `Canal ${t.source}`;
                if (!channelStats[channel]) channelStats[channel] = { total: 0, resolved: 0 };
                channelStats[channel].total++;
                if ([4,5].includes(Number(t.status))) channelStats[channel].resolved++;
            });
            const topChannels = Object.entries(channelStats)
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? ((stats.resolved/stats.total)*100).toFixed(0) : 0 }))
                .sort((a, b) => b.total - a.total);

            // MELHORIA 8: Por Produto
            const productStats = {};
            tickets.forEach(t => {
                const produto = t.cf_produto || t.product_name || 'Não especificado';
                if (!productStats[produto]) productStats[produto] = { total: 0, resolved: 0 };
                productStats[produto].total++;
                if ([4,5].includes(Number(t.status))) productStats[produto].resolved++;
            });
            const topProducts = Object.entries(productStats)
                .filter(([name]) => name !== 'Não especificado')
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? ((stats.resolved/stats.total)*100).toFixed(0) : 0 }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // MELHORIA 10: Por Empresa
            const companyStats = {};
            tickets.forEach(t => {
                const empresa = t.company_name || t.company || 'Sem empresa';
                if (!companyStats[empresa]) companyStats[empresa] = { total: 0, resolved: 0 };
                companyStats[empresa].total++;
                if ([4,5].includes(Number(t.status))) companyStats[empresa].resolved++;
            });
            const topCompanies = Object.entries(companyStats)
                .filter(([name]) => name !== 'Sem empresa')
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // MELHORIA 7: Por Tipo
            const typeStats = {};
            tickets.forEach(t => {
                const tipo = t.type || 'Não classificado';
                if (!typeStats[tipo]) typeStats[tipo] = 0;
                typeStats[tipo]++;
            });
            
            const worstTags = Object.entries(tagStats)
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? (stats.resolved/stats.total)*100 : 0 }))
                .filter(t => t.total >= 5)
                .sort((a, b) => a.rate - b.rate)
                .slice(0, 5);

            return `
CONTEXTO DO SISTEMA DE TICKETS (dados em tempo real):

📅 PERÍODO DOS DADOS (IMPORTANTE - SEMPRE INFORME ISSO AO USUÁRIO):
- Data do ticket mais antigo: ${formatDateBR(dataOldest)}
- Data do ticket mais recente: ${formatDateBR(dataNewest)}
- Período total: ${dataPeriodDays} dias
- Data de hoje: ${formatDateBR(now)}
⚠️ TODAS as métricas (SLA, taxa de resolução, etc) são calculadas sobre ESTE PERÍODO COMPLETO, não apenas últimos 30 dias!

📊 ESTATÍSTICAS GERAIS (período: ${formatDateBR(dataOldest)} a ${formatDateBR(dataNewest)}):
- Total de tickets no sistema: ${total.toLocaleString()}
- Abertos: ${open} (${total > 0 ? ((open/total)*100).toFixed(1) : 0}%)
- Pendentes: ${pending}
- Resolvidos/Fechados: ${resolved} (${total > 0 ? ((resolved/total)*100).toFixed(1) : 0}%)
- Taxa de resolução: ${total > 0 ? ((resolved/total)*100).toFixed(1) : 0}% (meta: >80%)

📅 DADOS TEMPORAIS:
- Tickets criados HOJE: ${todayTickets.length} (${todayResolved} já resolvidos)
- Tickets últimos 7 dias: ${weekTickets.length} (${weekResolved} resolvidos)
- Tickets últimos 30 dias: ${monthTickets.length}
- Tendência semanal: ${weekTrend > 0 ? '+' : ''}${weekTrend}% vs semana anterior

⏱️ SLA E TEMPOS:
- SLA primeira resposta (4h): ${slaRate}% (meta: >85%) ${Number(slaRate) >= 85 ? '✅' : '⚠️'}
- Tickets analisados para SLA: ${withSLA.length} (com resposta registrada)
- Tickets SEM resposta (ignorados no SLA): ${total - withSLA.length}
- Tempo médio primeira resposta: ${avgResponseTime}h
- Tempo médio resolução: ${avgResolutionTime}h (meta: <24h) ${Number(avgResolutionTime) <= 24 ? '✅' : '⚠️'}
- Tickets fora do SLA: ${outsideSLA}

⚠️ IMPORTANTE SOBRE SLA (SEMPRE EXPLIQUE ISSO AO USUÁRIO):
O cálculo do SLA considera APENAS tickets que já foram respondidos.
- Tickets "Em Análise", "Pendentes" ou qualquer status SEM primeira resposta NÃO entram no cálculo.
- Isso pode fazer o SLA parecer melhor do que realmente é.
- Fórmula: (Respondidos em até 4h) ÷ (Total COM resposta) × 100
- Meta de SLA de 1ª resposta: 4 horas
EXEMPLO DE RESPOSTA CORRETA:
"O SLA da Jéssica é 28,6% no período de X a Y. Isso significa que de ${withSLA.length} tickets com resposta, apenas X foram respondidos dentro de 4 horas."

🚨 URGÊNCIAS:
- Total urgentes: ${urgent}
- Urgentes ainda abertos: ${urgentOpen} ${urgentOpen > 0 ? '⚠️ ATENÇÃO!' : '✅'}

👥 DADOS POR TRATATIVA/PESSOA (coluna: cf_tratativa) - TOP 10:
${topPeople.map((p, i) => {
    const personSLA = this.getPersonSLA(p.name, tickets);
    const slaInfo = personSLA ? ` | SLA: ${personSLA.slaRate}% (${personSLA.withinSLA}/${personSLA.withResponse} dentro do prazo)` : '';
    const periodInfo = personSLA?.periodDescription ? ` | Período: ${personSLA.periodDescription}` : '';
    return `${i+1}. ${p.name}: ${p.total} tickets, ${p.resolved} resolvidos (${p.rate}%)${slaInfo}${periodInfo}`;
}).join('\n')}

📋 LISTA DE TODAS AS PESSOAS (para busca):
${Object.keys(personStats).filter(n => n !== 'Não atribuído').slice(0, 20).join(', ')}

📉 TRATATIVA - MENOR TAXA (possíveis "piores", sem "Não atribuído"):
${Object.entries(personStats)
    .filter(([name]) => name !== 'Não atribuído' && name.length > 2)
    .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? (stats.resolved/stats.total)*100 : 0 }))
    .filter(p => p.total >= 10)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
    .map((p, i) => `${i+1}. ${p.name}: ${p.rate.toFixed(0)}% taxa (${p.resolved}/${p.total})`)
    .join('\n') || '- Todos acima de 90%'}

🏢 DADOS POR GRUPO/TIME (coluna: cf_grupo_tratativa):
${topTeams.map(t => `- ${t.name}: ${t.total} total, ${t.resolved} resolvidos (${t.rate}%), ${t.open} abertos`).join('\n')}

📉 GRUPO/TIME - MENOR TAXA (sem "Não atribuído"):
${Object.entries(teamStats)
    .filter(([name]) => name !== 'Sem time' && name !== 'Não atribuído')
    .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? (stats.resolved/stats.total)*100 : 0 }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
    .map((t, i) => `${i+1}. ${t.name}: ${t.rate.toFixed(0)}% taxa (${t.open} abertos)`)
    .join('\n') || '- Todos acima de 90%'}

⚠️ TICKETS PROBLEMÁTICOS (abertos há mais de 7 dias) - TOP 10:
${oldOpenTickets.length > 0 
    ? oldOpenTickets.slice(0, 10).map(t => `- #${t.id}: ${t.age} dias aberto | ${t.cf_tratativa || 'Não atribuído'} | ${(t.subject || 'Sem assunto').slice(0, 50)}${t.priority == 4 ? ' [URGENTE]' : ''}`).join('\n')
    : '- Nenhum ticket antigo em aberto ✅'}

🏷️ DADOS POR TAGS (coluna: tags):
${topTags.length > 0 
    ? topTags.map((t, i) => `${i+1}. "${t.name}": ${t.total} tickets, ${t.resolved} resolvidos (${t.rate}%), ${t.open} abertos`).join('\n')
    : '- Nenhuma tag encontrada nos tickets'}

📉 TAGS COM MENOR TAXA DE RESOLUÇÃO:
${worstTags.length > 0 
    ? worstTags.map((t, i) => `${i+1}. "${t.name}": ${t.rate.toFixed(0)}% taxa (${t.resolved}/${t.total})`).join('\n')
    : '- Todas as tags acima de 90%'}

📈 PADRÕES:
- Dia com mais tickets: ${days[peakDay]}
- Horário de pico: ${peakHour ? peakHour[0] + 'h' : 'N/A'}

👁️ DADOS POR ACOMPANHAMENTO (coluna: cf_pessoa_acompanhamento):
${topAcompanhamento.length > 0 
    ? topAcompanhamento.map((p, i) => `${i+1}. ${p.name}: ${p.total} tickets (${p.resolved} resolvidos, ${p.open} abertos, ${p.pending} pendentes)`).join('\n')
    : '- Nenhum dado de acompanhamento encontrado'}

📊 COMPARAÇÃO TEMPORAL (semana atual vs anterior):
- Tickets esta semana: ${weekTickets.length} | Semana anterior: ${prevWeekTickets.length} | Variação: ${weekTrend > 0 ? '+' : ''}${weekTrend}%
- Resolvidos esta semana: ${weekResolved} | Semana anterior: ${prevWeekResolved}
- SLA esta semana: ${weekSLA}% | Semana anterior: ${prevWeekSLA}%
- Tendência SLA: ${Number(weekSLA) > Number(prevWeekSLA) ? '📈 Melhorando' : Number(weekSLA) < Number(prevWeekSLA) ? '📉 Piorando' : '➡️ Estável'}

⭐ SATISFAÇÃO DO CLIENTE:
${satisfactionData.total > 0 
    ? `- Total de avaliações: ${satisfactionData.total}
- Média de rating: ${satisfactionData.avgRating}/5
- Avaliações positivas (4-5): ${satisfactionData.positive} (${((satisfactionData.positive/satisfactionData.total)*100).toFixed(0)}%)
- Avaliações negativas (1-2): ${satisfactionData.negative} (${((satisfactionData.negative/satisfactionData.total)*100).toFixed(0)}%)`
    : '- Nenhuma avaliação de satisfação disponível'}

📡 TICKETS POR CANAL DE ORIGEM:
${topChannels.map(c => `- ${c.name}: ${c.total} tickets (${c.rate}% resolvidos)`).join('\n')}

📦 TICKETS POR PRODUTO (Top 5):
${topProducts.length > 0 
    ? topProducts.map((p, i) => `${i+1}. ${p.name}: ${p.total} tickets (${p.rate}% resolvidos)`).join('\n')
    : '- Nenhum produto especificado'}

🏢 TICKETS POR EMPRESA (Top 5):
${topCompanies.length > 0 
    ? topCompanies.map((c, i) => `${i+1}. ${c.name}: ${c.total} tickets`).join('\n')
    : '- Nenhuma empresa especificada'}

📂 TICKETS POR TIPO:
${Object.entries(typeStats).map(([tipo, qtd]) => `- ${tipo}: ${qtd}`).join('\n')}

📋 RESUMO DAS FONTES DE DADOS:
- TRATATIVA (cf_tratativa): ${Object.keys(personStats).length} pessoas diferentes
- ACOMPANHAMENTO (cf_pessoa_acompanhamento): ${Object.keys(acompanhamentoStats).length} pessoas
- GRUPO/TIME (cf_grupo_tratativa): ${Object.keys(teamStats).length} times diferentes  
- TAGS: ${Object.keys(tagStats).length} tags diferentes

🎯 METAS E ANÁLISE:
- SLA: ${Number(slaRate) >= 85 ? 'ACIMA da meta ✅' : Number(slaRate) >= 70 ? 'PRÓXIMO da meta ⚡' : 'ABAIXO da meta ⚠️'}
- Taxa resolução: ${(resolved/total)*100 >= 80 ? 'ACIMA da meta ✅' : 'ABAIXO da meta ⚠️'}
- Backlog (abertos): ${open} tickets (${((open/total)*100).toFixed(1)}% do total)
`;
        },

        // MELHORIA 2: Buscar detalhes de ticket específico (expandido com mais campos)
        getTicketDetails(ticketId) {
            const tickets = window.allTicketsCache || [];
            const ticket = tickets.find(t => String(t.id) === String(ticketId));
            
            if (!ticket) return null;
            
            // Mapa completo de status
            const statusNames = this.knowledge.status;
            const priorityNames = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
            const channelNames = { 1: 'Email', 2: 'Portal', 3: 'Telefone', 7: 'Chat', 9: 'Widget', 10: 'API' };
            
            const created = ticket.created_at ? new Date(ticket.created_at) : null;
            const updated = ticket.updated_at ? new Date(ticket.updated_at) : null;
            const resolved = ticket.stats_resolved_at ? new Date(ticket.stats_resolved_at) : null;
            const firstResponse = ticket.stats_first_responded_at ? new Date(ticket.stats_first_responded_at) : null;
            
            let responseTime = null;
            if (firstResponse && created) {
                responseTime = ((firstResponse - created) / (1000 * 60 * 60)).toFixed(1);
            }
            
            let resolutionTime = null;
            if (resolved && created) {
                resolutionTime = ((resolved - created) / (1000 * 60 * 60)).toFixed(1);
            }
            
            // SLA baseado na prioridade
            const prioridade = ticket.priority || 2;
            const slaConfig = this.businessRules.slaPorPrioridade[prioridade];
            const slaResposta = slaConfig ? slaConfig.resposta : 4;
            let slaStatus = '⏳ Aguardando resposta';
            if (responseTime) {
                slaStatus = Number(responseTime) <= slaResposta ? '✅ Dentro do SLA' : '⚠️ Fora do SLA';
            }
            
            return {
                id: ticket.id,
                subject: ticket.subject || 'Sem assunto',
                description: ticket.description_text || ticket.description || 'Sem descrição',
                status: statusNames[ticket.status]?.name || `Status ${ticket.status}`,
                statusCode: ticket.status,
                priority: priorityNames[ticket.priority] || ticket.priority,
                priorityCode: ticket.priority,
                tratativa: ticket.cf_tratativa || 'Não atribuído',
                grupo: ticket.cf_grupo_tratativa || ticket.group_name || 'Sem grupo',
                // Novos campos (Melhorias 1-10)
                requester: ticket.requester_name || ticket.requester_email || 'Desconhecido',
                requesterEmail: ticket.requester_email || '',
                empresa: ticket.company_name || ticket.company || 'Sem empresa',
                agente: ticket.responder_name || 'Não atribuído',
                agenteId: ticket.responder_id,
                canal: channelNames[ticket.source] || `Canal ${ticket.source}`,
                produto: ticket.cf_produto || ticket.product_name || 'Não especificado',
                sistema: ticket.cf_sistema || 'Não especificado',
                tipo: ticket.type || 'Não classificado',
                // Datas
                created: created ? created.toLocaleDateString('pt-BR') : 'N/A',
                createdFull: created ? created.toLocaleString('pt-BR') : 'N/A',
                updated: updated ? updated.toLocaleString('pt-BR') : 'N/A',
                // Tempos
                responseTime: responseTime ? `${responseTime}h` : 'Sem resposta',
                resolutionTime: resolutionTime ? `${resolutionTime}h` : 'Não resolvido',
                slaStatus: slaStatus,
                slaLimite: `${slaResposta}h resposta / ${slaConfig?.resolucao || 24}h resolução`,
                // Outros
                tags: ticket.tags || [],
                acompanhamento: ticket.cf_pessoa_acompanhamento || 'Ninguém',
                // Dados brutos para a IA
                raw: ticket
            };
        },

        // MELHORIA 7: Gerar mini-gráfico de barras ASCII
        generateMiniChart(data, maxWidth = 20) {
            if (!data || data.length === 0) return '';
            
            const maxValue = Math.max(...data.map(d => d.value));
            return data.map(d => {
                const barLength = Math.round((d.value / maxValue) * maxWidth);
                const bar = '█'.repeat(barLength) + '░'.repeat(maxWidth - barLength);
                return `${d.label.padEnd(12).slice(0, 12)} ${bar} ${d.value}`;
            }).join('\n');
        },

        // MELHORIA 2: Formatar detalhes do ticket (expandido)
        formatTicketDetails(ticket) {
            const link = this.getTicketLink(ticket.id);
            const descPreview = ticket.description ? 
                (ticket.description.length > 200 ? ticket.description.slice(0, 200) + '...' : ticket.description) : '';
            
            return `🎫 <strong>Ticket #${ticket.id}</strong>
                <br><br><strong>📋 ${ticket.subject}</strong>
                ${descPreview ? `<br><br><em style="color:#a1a1aa;font-size:0.85em;">${descPreview}</em>` : ''}
                <br><br>
                <table style="width:100%;font-size:0.9em;">
                    <tr><td><strong>Status:</strong></td><td>${ticket.status}</td></tr>
                    <tr><td><strong>Prioridade:</strong></td><td>${ticket.priority}</td></tr>
                    <tr><td><strong>SLA Limite:</strong></td><td>${ticket.slaLimite}</td></tr>
                    <tr><td><strong>Responsável:</strong></td><td>${ticket.tratativa}</td></tr>
                    <tr><td><strong>Agente:</strong></td><td>${ticket.agente}</td></tr>
                    <tr><td><strong>Grupo:</strong></td><td>${ticket.grupo}</td></tr>
                    <tr><td><strong>Solicitante:</strong></td><td>${ticket.requester}</td></tr>
                    <tr><td><strong>Empresa:</strong></td><td>${ticket.empresa}</td></tr>
                    <tr><td><strong>Canal:</strong></td><td>${ticket.canal}</td></tr>
                    <tr><td><strong>Produto:</strong></td><td>${ticket.produto}</td></tr>
                    <tr><td><strong>Sistema:</strong></td><td>${ticket.sistema}</td></tr>
                    <tr><td><strong>Criado em:</strong></td><td>${ticket.createdFull}</td></tr>
                    <tr><td><strong>Atualizado:</strong></td><td>${ticket.updated}</td></tr>
                    <tr><td><strong>Tempo 1ª resposta:</strong></td><td>${ticket.responseTime}</td></tr>
                    <tr><td><strong>Tempo resolução:</strong></td><td>${ticket.resolutionTime}</td></tr>
                    <tr><td><strong>SLA:</strong></td><td>${ticket.slaStatus}</td></tr>
                    <tr><td><strong>Acompanhamento:</strong></td><td>${ticket.acompanhamento}</td></tr>
                </table>
                ${ticket.tags && ticket.tags.length > 0 ? `<br><strong>Tags:</strong> ${Array.isArray(ticket.tags) ? ticket.tags.join(', ') : ticket.tags}` : ''}
                <br><br>🔗 <a href="${link}" target="_blank" style="color:#3b82f6;">Abrir no Freshdesk</a>`;
        },

        // MELHORIA 4: Gerar ações contextuais baseadas na pergunta/resposta
        getContextualActions(question, response) {
            const q = question.toLowerCase();
            const actions = [];
            
            // Baseado no tipo de pergunta
            if (q.includes('sla') || q.includes('tempo')) {
                actions.push('Ver tickets fora do SLA');
                actions.push('Comparar SLA semanal');
            }
            else if (q.includes('resolveu') || q.includes('resolução') || q.includes('pessoa') || q.includes('tratativa')) {
                actions.push('Ver por time');
                actions.push('Comparar com semana anterior');
            }
            else if (q.includes('time') || q.includes('grupo') || q.includes('equipe')) {
                actions.push('Ver por pessoa');
                actions.push('Qual time precisa de atenção?');
            }
            else if (q.includes('urgente') || q.includes('crítico') || q.includes('prioridade')) {
                actions.push('Listar urgentes abertos');
                actions.push('Quem está com urgentes?');
            }
            else if (q.includes('satisfação') || q.includes('avaliação')) {
                actions.push('Ver avaliações negativas');
                actions.push('Ranking de satisfação');
            }
            else if (q.includes('situação') || q.includes('resumo') || q.includes('geral')) {
                actions.push('O que priorizar hoje?');
                actions.push('Quais problemas temos?');
            }
            else if (q.includes('semana') || q.includes('comparar') || q.includes('anterior')) {
                actions.push('Ver tendência mensal');
                actions.push('Qual dia tem mais tickets?');
            }
            else {
                // Sugestões genéricas
                actions.push('Mais detalhes');
                actions.push('Ver por outro ângulo');
            }
            
            return actions.slice(0, 3); // Máximo 3 ações
        },

        // MELHORIA 4: Adicionar botões de ação rápida
        addActionButtons(actions) {
            const container = document.getElementById('cbMessages');
            if (!container) return;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'cb-actions';
            actionsDiv.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 8px 48px;';
            
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'cb-action-btn';
                btn.style.cssText = `
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 0.8em;
                    cursor: pointer;
                    transition: transform 0.2s, opacity 0.2s;
                `;
                btn.textContent = action;
                btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
                btn.onmouseout = () => btn.style.transform = 'scale(1)';
                btn.onclick = () => {
                    document.getElementById('cbInput').value = action;
                    this.send();
                    actionsDiv.remove();
                };
                actionsDiv.appendChild(btn);
            });
            
            container.appendChild(actionsDiv);
            container.scrollTop = container.scrollHeight;
        },

        // MELHORIA 9: Gerar sugestões dinâmicas baseadas nos dados
        getDynamicSuggestions() {
            const tickets = window.allTicketsCache || [];
            if (tickets.length === 0) return ['Carregar dados primeiro'];
            
            const suggestions = [];
            
            // Baseado em urgências
            const urgentOpen = tickets.filter(t => t.priority == 4 && t.status == 2).length;
            if (urgentOpen > 0) {
                suggestions.push(`🚨 ${urgentOpen} urgentes abertos`);
            }
            
            // Baseado em SLA
            const withSLA = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (withSLA.length > 0) {
                const outsideSLA = withSLA.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time > 4;
                }).length;
                if (outsideSLA > 10) {
                    suggestions.push('⚠️ Analisar SLA');
                }
            }
            
            // Comparação semanal
            suggestions.push('📊 Comparar semanas');
            
            // Satisfação
            if (window.surveysCache && window.surveysCache.length > 0) {
                suggestions.push('⭐ Ver satisfação');
            }
            
            // Tickets antigos
            const now = new Date();
            const oldTickets = tickets.filter(t => {
                if (t.status != 2 || !t.created_at) return false;
                const age = (now - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
                return age > 7;
            }).length;
            if (oldTickets > 0) {
                suggestions.push(`📅 ${oldTickets} tickets antigos`);
            }
            
            return suggestions.slice(0, 4);
        },

        // Chamar API de IA (com fallback automático)
        async callAI(userMessage) {
            // Tentar Gemini primeiro
            if (this.aiConfig.geminiKey) {
                const geminiResponse = await this.callGemini(userMessage);
                if (geminiResponse) return geminiResponse;
            }
            
            // Fallback para Groq
            if (this.aiConfig.groqKey) {
                const groqResponse = await this.callGroqOrOpenAI(userMessage, 'groq');
                if (groqResponse) return groqResponse;
            }
            
            // Fallback para modo local
            return null;
        },

        // Chamar Google Gemini com fallback de modelos
        async callGemini(userMessage, modelIndex = 0, retryCount = 0) {
            if (!this.aiConfig.geminiKey) return null;

            // Lista de modelos para tentar (do mais recente ao mais estável)
            const models = [
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash-latest', 
                'gemini-1.5-flash',
                'gemini-pro'
            ];
            
            const model = models[modelIndex] || models[0];
            const systemPrompt = this.getSystemPrompt();
            
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.aiConfig.geminiKey}`;
                
                // Construir histórico no formato Gemini
                const contents = [];
                
                // Adicionar histórico (se houver)
                const history = this.context.conversationHistory.slice(-6);
                history.forEach(h => {
                    contents.push({
                        role: h.type === 'user' ? 'user' : 'model',
                        parts: [{ text: h.content.replace(/<[^>]*>/g, '') }]
                    });
                });
                
                // Adicionar mensagem atual
                contents.push({
                    role: 'user',
                    parts: [{ text: userMessage }]
                });
                
                const body = {
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: this.aiConfig.temperature,
                        maxOutputTokens: this.aiConfig.maxTokens
                    }
                };

                console.log('🚀 Chamando Gemini...');
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(`❌ Gemini (${model}) erro:`, response.status, errorData);
                    
                    // Se 429 (rate limit), aguardar e tentar novamente
                    if (response.status === 429) {
                        const baseWait = [3000, 6000, 10000]; // 3s, 6s, 10s
                        const waitTime = baseWait[retryCount] || 10000;
                        console.log(`⏳ Rate limit Gemini (retry ${retryCount + 1}/3). Aguardando ${waitTime/1000}s...`);
                        
                        // Máximo 3 retries para 429
                        if (retryCount < 2) {
                            await new Promise(r => setTimeout(r, waitTime));
                            console.log(`🔄 Retry Gemini após rate limit...`);
                            return this.callGemini(userMessage, modelIndex, retryCount + 1);
                        } else {
                            console.log(`⚠️ Rate limit persistente após 3 tentativas, mudando para Groq...`);
                            return null; // Fallback para Groq
                        }
                    }
                    
                    // Se 404 ou 400, tentar próximo modelo
                    if ((response.status === 404 || response.status === 400) && modelIndex < 3) {
                        console.log(`🔄 Tentando modelo alternativo: ${models[modelIndex + 1]}`);
                        return this.callGemini(userMessage, modelIndex + 1, 0); // Reset retryCount para novo modelo
                    }
                    
                    return null; // Fallback para Groq
                }

                const data = await response.json();
                const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (aiResponse) {
                    console.log('✅ Resposta via Gemini');
                    return this.formatAIResponse(aiResponse);
                }
                
                console.error('❌ Gemini: resposta vazia', data);
                return null;
            } catch (error) {
                console.error('❌ Erro Gemini:', error);
                return null; // Fallback para Groq
            }
        },

        // Chamar Groq ou OpenAI (fallback) com retry para rate limiting
        async callGroqOrOpenAI(userMessage, provider = 'groq', retryCount = 0) {
            const apiKey = provider === 'groq' ? this.aiConfig.groqKey : this.aiConfig.openaiKey;
            if (!apiKey) return null;

            const systemPrompt = this.getSystemPrompt();
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.context.conversationHistory.slice(-6).map(h => ({
                    role: h.type === 'user' ? 'user' : 'assistant',
                    content: h.content.replace(/<[^>]*>/g, '')
                })),
                { role: 'user', content: userMessage }
            ];

            try {
                const endpoint = provider === 'groq' 
                    ? 'https://api.groq.com/openai/v1/chat/completions'
                    : 'https://api.openai.com/v1/chat/completions';
                
                const model = provider === 'groq' ? this.aiConfig.groqModel : 'gpt-3.5-turbo';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages,
                        max_tokens: this.aiConfig.maxTokens,
                        temperature: this.aiConfig.temperature
                    })
                });

                // Retry para rate limiting (429)
                if (response.status === 429 && retryCount < 2) {
                    const delay = (retryCount + 1) * 2000; // 2s, 4s
                    console.warn(`⏳ ${provider} rate limit, aguardando ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.callGroqOrOpenAI(userMessage, provider, retryCount + 1);
                }

                if (!response.ok) {
                    console.error(`${provider} erro:`, response.status);
                    return null;
                }

                const data = await response.json();
                const aiResponse = data.choices?.[0]?.message?.content;
                
                if (aiResponse) {
                    console.log(`✅ Resposta via ${provider}`);
                    return this.formatAIResponse(aiResponse);
                }
                
                return null;
            } catch (error) {
                console.error(`Erro ${provider}:`, error);
                return null;
            }
        },

        // System prompt compartilhado
        getSystemPrompt() {
            return `Você é um assistente de BI integrado a um sistema REAL de tickets de suporte.

🚨 IMPORTANTE - LEIA COM ATENÇÃO:
- Você TEM acesso aos dados REAIS do sistema. Os dados abaixo são REAIS, não fictícios.
- Você ESTÁ integrado ao sistema de tickets da empresa.
- Você PODE e DEVE usar os dados fornecidos para responder perguntas.
- NUNCA diga que "não tem acesso" ou que os dados são "fictícios" - eles são REAIS.
- Os tickets mencionados no contexto EXISTEM no sistema real.
- Quando o usuário perguntar sobre um ticket específico, USE os dados do contexto.

🔗 LINKS DOS TICKETS:
O sistema usa Freshdesk. Para qualquer ticket, o link é:
https://suportetryvia.freshdesk.com/helpdesk/tickets/ID
Exemplo: Ticket #2434 → https://suportetryvia.freshdesk.com/helpdesk/tickets/2434
Sempre forneça o link quando pedirem!

⏰ SLA POR PRIORIDADE (Melhoria 11):
| Prioridade | 1ª Resposta | Resolução |
|------------|-------------|-----------|
| 4-Urgente  | 1 hora      | 4 horas   |
| 3-Alta     | 4 horas     | 8 horas   |
| 2-Média    | 8 horas     | 24 horas  |
| 1-Baixa    | 24 horas    | 48 horas  |

🏢 HORÁRIO COMERCIAL (Melhoria 12):
- Seg a Sex: 08:00 às 18:00
- Sábados, Domingos e Feriados: NÃO CONTA para SLA

📅 FERIADOS 2025 (Melhoria 13):
01/01 (Ano Novo), 03-04/03 (Carnaval), 18/04 (Sexta Santa), 21/04 (Tiradentes), 
01/05 (Trabalho), 19/06 (Corpus), 07/09 (Independência), 12/10 (N.S.Aparecida), 
02/11 (Finados), 15/11 (Proclamação), 25/12 (Natal)

👥 CAPACIDADE E ESCALAÇÃO (Melhorias 14-15):
- Capacidade padrão: 15 tickets simultâneos por pessoa
- Escalar para gestor: Se ticket sem resposta há mais de 24h
- Gestores: DEV, Suporte, CS, Comercial (cada time tem seu gestor)

📞 CONTATOS DE EMERGÊNCIA (Melhoria 21):
- Email: suporte@empresa.com

🔧 FUNCIONALIDADES DISPONÍVEIS (Melhorias 22-28):
Quando o usuário pedir para AGIR em um ticket, informe:
- "Para criar/atribuir/fechar tickets, use o link do Freshdesk"
- Forneça sempre o link: https://suportetryvia.freshdesk.com/helpdesk/tickets/ID

🧠 MEMÓRIA DE DECISÕES (NOVO):
Você pode ajudar a salvar e buscar notas/decisões:
- "Anotar: [texto]" → Salva uma nota com data/hora e tags automáticas
- "Ver notas" ou "Listar decisões" → Mostra últimas notas salvas
- "Por que escalamos?" → Busca notas sobre escalações
Exemplo de resposta: "Posso salvar essa decisão? Use: Anotar: [descrição da decisão]"

🔗 INTEGRAÇÃO COM BI ANALYTICS (NOVO):
Você pode navegar entre views:
- "Ir para Dashboard" → Navega para o Dashboard
- "Abrir Tickets" → Navega para lista de Tickets
- "Ver BI Analytics" → Navega para análises
- "Mostrar Insights" → Navega para insights

🔄 INTEGRAÇÃO SUPABASE (NOVO):
Você pode buscar dados em tempo real:
- "Atualizar dados" → Recarrega tickets do Supabase
- "Buscar tickets urgentes" → Query direta no banco
- "Consultar tickets abertos" → Query filtrada

📚 SOLUÇÕES CONHECIDAS (Melhorias 29-30):
- Erro de login: Verificar se usuário ativo e se senha foi alterada
- Lentidão: Limpar cache, testar outro navegador, verificar internet
- Integração falhou: Verificar logs, confirmar credenciais da API
- Relatório não gera: Verificar dados no período, verificar permissões
- Importação falhou: Verificar formato do arquivo, campos obrigatórios

🔍 BUSCA POR PESSOA:
Quando perguntarem sobre uma pessoa específica (SLA do João, tickets do Maria):
1. Busque o nome na coluna cf_tratativa
2. Se não encontrar exato, busque parcialmente (João pode ser João Silva)
3. Se encontrar múltiplos, liste as opções
4. Se não encontrar, liste 5 pessoas disponíveis para sugestão
5. SEMPRE calcule métricas ESPECÍFICAS daquela pessoa, não o geral
6. SEMPRE informe o PERÍODO dos dados (ex: "Analisando período de 01/01/2024 a 18/12/2024...")

📅 REGRA CRÍTICA - PERÍODO DOS DADOS:
SEMPRE que fornecer qualquer métrica (SLA, taxa, total de tickets), você DEVE informar:
1. O período dos dados analisados (data início a data fim)
2. Quantos tickets foram analisados
3. Como o cálculo foi feito
Exemplo: "O SLA da Jéssica é 28,6% no período de 15/03/2024 a 18/12/2024 (292 tickets analisados, sendo 84 com resposta registrada)"

💬 PERGUNTAS DE FOLLOW-UP:
Se a pergunta for curta como "Como é calculado?", "Por quê?", "Mais detalhes":
- Use o contexto da mensagem ANTERIOR para entender
- Se antes falamos de SLA, responda sobre cálculo de SLA
- Se antes falamos de uma pessoa, continue falando dela
- NUNCA diga "não entendi" para perguntas de follow-up óbvias

REGRAS OBRIGATÓRIAS:
1. Responda de forma concisa e direta em português brasileiro.
2. Use emojis para deixar as respostas mais visuais.
3. Baseie suas respostas nos dados REAIS fornecidos no contexto abaixo.
4. Nunca invente dados - use apenas o que está no contexto.
5. Formate números grandes com separadores (ex: 1.234).
6. NUNCA diga que não tem acesso ao sistema - você TEM acesso via este contexto.

📊 TIPOS DE INFORMAÇÃO:
1. MÉTRICAS CALCULADAS (não são colunas, são cálculos):
   - SLA, Taxa de Resolução, Tempo Médio, Backlog, Tendências
   - Para estas, diga "Analisando a métrica de SLA..." ou "Calculando a taxa..."
   
2. DADOS POR AGRUPAMENTO (precisam de coluna):
   - Por PESSOA → use coluna cf_tratativa
   - Por TIME → use coluna cf_grupo_tratativa  
   - Por ACOMPANHAMENTO → use coluna cf_pessoa_acompanhamento
   - Por CATEGORIA → use coluna tags
   - Para estes, diga "Analisando pela coluna X..."

NUNCA diga "coluna não especificada" - se for métrica, não precisa de coluna!

📋 ESTRUTURA DOS DADOS:

| Coluna | Campo | O que contém |
|--------|-------|--------------|
| TRATATIVA | cf_tratativa | Pessoa responsável pelo ticket |
| ACOMPANHAMENTO | cf_pessoa_acompanhamento | Pessoa que está acompanhando |
| GRUPO/TIME | cf_grupo_tratativa | Time/setor responsável |
| TAGS | tags | Categorias/etiquetas do ticket |
| PRIORIDADE | priority | 1=Baixa, 2=Média, 3=Alta, 4=Urgente |
| STATUS | status | Ver tabela completa abaixo |

📋 MAPA COMPLETO DE STATUS:
- 2: Aberto (não iniciado)
- 3: Pendente (aguardando algo)
- 4: Resolvido ✅
- 5: Fechado ✅
- 6: Em Homologação
- 7: Aguardando Cliente
- 8: Em Tratativa (sendo trabalhado)
- 10: Em Análise
- 11: Interno
- 12: Aguardando Publicar HML
- 13: Aguardando Publicar PROD
- 14: MVP
- 15: Validação-Atendimento
- 16: Aguardando Parceiros
- 17: Pausado
- 18: Validação-CS
- 19: Levantamento de Esforço

AGRUPAMENTO PARA CÁLCULOS:
- FECHADOS: status 4 e 5 (usados para taxa de resolução)
- ABERTOS: status 2
- EM ANDAMENTO: status 3, 6, 7, 8, 10, 12, 13, 15, 16, 17, 18, 19
- O SLA considera APENAS tickets que já tiveram primeira resposta

📊 COMO O SISTEMA CALCULA:
- "Abertos" = status 2 (aguardando início)
- "Em Andamento" = status 3,6,7,8,10,12,13,15,16,17,18,19 (sendo trabalhados)
- "Resolvidos/Fechados" = status 4, 5 (finalizados)
- "Urgentes não resolvidos" = prioridade 4 + status diferente de 4 ou 5
- O SLA usa: (primeira resposta em até 4h) / (total com resposta) × 100
- Taxa de Resolução usa: (status 4 ou 5) / (total) × 100

QUANDO O USUÁRIO PERGUNTAR:
- "por tratativa/pessoa" → Use cf_tratativa
- "por acompanhamento" → Use cf_pessoa_acompanhamento
- "por tags/etiqueta" → Use tags
- "por time/grupo" → Use cf_grupo_tratativa
- Se não especificar, PERGUNTE qual coluna usar.

🔄 PERGUNTAS SOBRE O SISTEMA:
Se o usuário perguntar "o sistema considera X?", "como funciona?", "leva em conta?":
- NÃO repita os dados
- EXPLIQUE como o cálculo é feito
- Diga quais status são considerados
- Exemplo: "Sim! O sistema considera tickets 'Em Análise' (status 7). Eles estão agrupados em 'Pendentes' junto com status 3 e 6."

SEMPRE INFORME A FONTE: "Analisando pela coluna X..."

⚠️ METAS (CRÍTICO - PRESTE ATENÇÃO):
- Taxa/SLA MAIOR que meta = ✅ BOM (ex: 94% > 80% = EXCELENTE)
- Taxa/SLA MENOR que meta = ⚠️ RUIM (ex: 50% < 85% = PRECISA MELHORAR)
- Tempo MENOR que meta = ✅ BOM
- Tempo MAIOR que meta = ⚠️ RUIM

PIOR/MELHOR:
- Pior = MENOR taxa (desconsidere "Não atribuído")
- Melhor = MAIOR taxa
- Só considere quem tem >10 tickets

${this.generateSystemContext()}`;
        },

        formatAIResponse(text) {
            // Converter markdown básico para HTML
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code style="background:#3f3f5a;padding:2px 6px;border-radius:4px;">$1</code>')
                .replace(/^• /gm, '• ')
                .replace(/^- /gm, '• ')
                .replace(/\n/g, '<br>');
        },

        addChatButton() {
            const btn = document.createElement('div');
            btn.id = 'chatbotButton';
            btn.innerHTML = '<img src="tryvia.png" alt="IA Tryviano" style="width:70%;height:70%;object-fit:contain;">';
            btn.title = 'IA Tryviano';
            btn.onclick = () => this.toggle();
            
            const style = document.createElement('style');
            style.textContent = `
                #chatbotButton {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 56px;
                    height: 56px;
                    background: #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 99998;
                    animation: chatBtnPulse 2s ease-in-out infinite;
                    border: 3px solid ${this.colors.primary};
                }
                #chatbotButton:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 30px rgba(139, 92, 246, 0.6);
                }
                @keyframes chatBtnPulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4); }
                    50% { box-shadow: 0 4px 30px rgba(139, 92, 246, 0.6); }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(btn);
        },

        createChatWindow() {
            const chat = document.createElement('div');
            chat.id = 'chatbotWindow';
            chat.innerHTML = `
                <div class="cb-header">
                    <div class="cb-header-info">
                        <div class="cb-avatar"><img src="tryvia.png" alt="Tryvia" style="width:100%;height:100%;object-fit:contain;border-radius:50%;"></div>
                        <div>
                            <div class="cb-name">IA Tryviano</div>
                            <div class="cb-status" id="cbStatus">${this.aiConfig.geminiKey ? '🟢 Gemini ativo' : this.aiConfig.groqKey ? '🟡 Groq ativo' : '⚪ Modo local'}</div>
                        </div>
                    </div>
                    <div class="cb-header-actions">
                        <button class="cb-action" onclick="Chatbot.showSettings()" title="Configurar IA">⚙️</button>
                        <button class="cb-action" onclick="Chatbot.clearChat()" title="Limpar conversa">🗑️</button>
                        <button class="cb-action" onclick="Chatbot.close()" title="Fechar">✕</button>
                    </div>
                </div>
                <div class="cb-messages" id="cbMessages">
                    <div class="cb-welcome">
                        <div class="cb-welcome-icon">👋</div>
                        <div class="cb-welcome-title">Olá! Sou seu assistente de dados.</div>
                        <div class="cb-welcome-text">Pergunte qualquer coisa sobre os tickets!</div>
                        <div class="cb-suggestions" id="cbSuggestions">
                            <button onclick="Chatbot.askSuggestion('Status rápido')">📊 Status rápido</button>
                            <button onclick="Chatbot.askSuggestion('Alertas')">🚨 Alertas</button>
                            <button onclick="Chatbot.askSuggestion('Previsão próximos dias')">🔮 Previsão</button>
                            <button onclick="Chatbot.askSuggestion('Carga da equipe')">👥 Carga</button>
                            <button onclick="Chatbot.askSuggestion('Comparar períodos')">📈 Comparar</button>
                        </div>
                    </div>
                </div>
                <div class="cb-input-area">
                    <input type="text" id="cbInput" placeholder="Digite sua pergunta..." 
                        onkeypress="if(event.key==='Enter')Chatbot.send()">
                    <button class="cb-send" onclick="Chatbot.send()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                #chatbotWindow {
                    display: none;
                    position: fixed;
                    bottom: 90px;
                    right: 24px;
                    width: 380px;
                    height: 520px;
                    background: ${this.colors.bg};
                    border: 1px solid ${this.colors.border};
                    border-radius: 16px;
                    box-shadow: 0 10px 50px rgba(0,0,0,0.5);
                    z-index: 99999;
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    animation: cbSlideUp 0.3s ease-out;
                }
                #chatbotWindow.active {
                    display: flex;
                }
                @keyframes cbSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .cb-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: linear-gradient(135deg, ${this.colors.bot} 0%, ${this.colors.primary} 100%);
                    color: white;
                }
                .cb-header-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .cb-avatar {
                    width: 40px;
                    height: 40px;
                    background: #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    overflow: hidden;
                    padding: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .cb-name {
                    font-weight: 600;
                    font-size: 1rem;
                }
                .cb-status {
                    font-size: 0.75rem;
                    opacity: 0.9;
                }
                .cb-header-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .cb-action {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                    color: white;
                    font-size: 1rem;
                    transition: all 0.15s;
                }
                .cb-action:hover {
                    background: rgba(255,255,255,0.2);
                }
                .cb-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .cb-welcome {
                    text-align: center;
                    padding: 2rem 1rem;
                }
                .cb-welcome-icon {
                    font-size: 3rem;
                    margin-bottom: 0.5rem;
                }
                .cb-welcome-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: ${this.colors.text};
                    margin-bottom: 0.25rem;
                }
                .cb-welcome-text {
                    color: ${this.colors.textMuted};
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                .cb-suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    justify-content: center;
                }
                .cb-suggestions button {
                    background: ${this.colors.surface};
                    border: 1px solid ${this.colors.border};
                    color: ${this.colors.text};
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .cb-suggestions button:hover {
                    background: ${this.colors.primary};
                    border-color: ${this.colors.primary};
                }
                .cb-message {
                    max-width: 85%;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    animation: cbMsgIn 0.2s ease-out;
                }
                @keyframes cbMsgIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .cb-message.user {
                    align-self: flex-end;
                    background: ${this.colors.primary};
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .cb-message.bot {
                    align-self: flex-start;
                    background: ${this.colors.surface};
                    color: ${this.colors.text};
                    border-bottom-left-radius: 4px;
                }
                .cb-message.bot .cb-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: ${this.colors.primary};
                    margin: 0.5rem 0;
                }
                .cb-message.bot .cb-detail {
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                    margin-top: 0.5rem;
                }
                .cb-message.bot .cb-list {
                    margin: 0.5rem 0;
                    padding-left: 1rem;
                }
                .cb-message.bot .cb-list li {
                    margin: 0.25rem 0;
                }
                .cb-agent-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                    color: white;
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 10px;
                    margin-right: 8px;
                    vertical-align: middle;
                    animation: agentPulse 2s ease-in-out infinite;
                }
                @keyframes agentPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                .cb-typing {
                    display: flex;
                    gap: 4px;
                    padding: 1rem;
                    align-self: flex-start;
                }
                .cb-typing span {
                    width: 8px;
                    height: 8px;
                    background: ${this.colors.textMuted};
                    border-radius: 50%;
                    animation: cbTyping 1s ease-in-out infinite;
                }
                .cb-typing span:nth-child(2) { animation-delay: 0.2s; }
                .cb-typing span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes cbTyping {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .cb-input-area {
                    display: flex;
                    gap: 0.5rem;
                    padding: 1rem;
                    border-top: 1px solid ${this.colors.border};
                    background: ${this.colors.surface};
                }
                .cb-input-area input {
                    flex: 1;
                    background: ${this.colors.bg};
                    border: 1px solid ${this.colors.border};
                    border-radius: 24px;
                    padding: 0.75rem 1rem;
                    color: ${this.colors.text};
                    font-size: 0.9rem;
                    outline: none;
                    transition: border-color 0.15s;
                }
                .cb-input-area input:focus {
                    border-color: ${this.colors.primary};
                }
                .cb-send {
                    width: 44px;
                    height: 44px;
                    background: ${this.colors.primary};
                    border: none;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                }
                .cb-send:hover {
                    background: #2563eb;
                    transform: scale(1.05);
                }
                .cb-alert {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 8px;
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: ${this.colors.danger};
                }
                .cb-success {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 8px;
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: ${this.colors.success};
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(chat);
        },

        toggle() {
            this.isOpen ? this.close() : this.open();
        },

        open() {
            document.getElementById('chatbotWindow').classList.add('active');
            document.getElementById('cbInput').focus();
            this.isOpen = true;
        },

        close() {
            document.getElementById('chatbotWindow').classList.remove('active');
            this.isOpen = false;
        },

        askSuggestion(text) {
            document.getElementById('cbInput').value = text;
            this.send();
        },

        async send() {
            const input = document.getElementById('cbInput');
            const text = input.value.trim();
            if (!text) return;

            // Comando para configurar Gemini
            if (text.startsWith('/gemini ')) {
                const key = text.replace('/gemini ', '').trim();
                this.setGeminiKey(key);
                input.value = '';
                return;
            }

            // Comando para configurar Groq
            if (text.startsWith('/groq ')) {
                const key = text.replace('/groq ', '').trim();
                this.setGroqKey(key);
                input.value = '';
                return;
            }

            // Comando legado /key (usa Gemini por padrão)
            if (text.startsWith('/key ')) {
                const key = text.replace('/key ', '').trim();
                this.setGeminiKey(key);
                input.value = '';
                return;
            }

            // Adicionar mensagem do usuário
            this.addMessage(text, 'user');
            input.value = '';

            // Salvar no histórico de conversa
            this.context.conversationHistory.push({ type: 'user', content: text });

            // Remover welcome se existir
            const welcome = document.querySelector('.cb-welcome');
            if (welcome) welcome.remove();

            // Mostrar typing
            this.showTyping();

            // ============= AGENT LOOP (NOVO) =============
            let response;
            let usedAgent = false;
            
            console.log('🤖 Iniciando Agent Loop para:', text);
            
            try {
                // STEP 1: Executar Agent Loop (Planejar → Executar → Verificar)
                const agentResult = await this.agent.process(text, this);
                
                console.log('🔄 Agent result:', {
                    hasResponse: !!agentResult.response,
                    useAI: agentResult.useAI,
                    trace: agentResult.trace
                });
                
                // Se o agent conseguiu responder com ferramentas
                if (agentResult.response && !agentResult.useAI) {
                    response = agentResult.response;
                    usedAgent = true;
                    console.log('✅ Resposta via Agent (tools)');
                }
                // Se o agent pede para usar IA (complementar com contexto)
                else if (agentResult.useAI || !agentResult.response) {
                    console.log('🧠 Agent delegou para IA');
                    
                    // Enriquecer prompt com RAG
                    const ragContext = this.rag.enrichPrompt(text);
                    const enrichedText = ragContext ? text + ragContext : text;
                    
                    // Adicionar contexto da memória
                    const memoryContext = this.memory.getContext();
                    if (memoryContext.working?.lastIntent) {
                        console.log('📝 Contexto de memória:', memoryContext.working);
                    }
                    
                    // STEP 2: Tentar IA (Gemini/Groq) com contexto enriquecido
                    response = await this.callAI(enrichedText);
                    
                    // STEP 3: Fallback para processamento local
                    if (!response) {
                        console.log('⚠️ IA não respondeu, usando modo local');
                        response = this.processQuestion(text);
                    }
                }
            } catch (agentError) {
                console.error('❌ Erro no Agent:', agentError);
                // Fallback completo
                response = await this.callAI(text);
                if (!response) {
                    response = this.processQuestion(text);
                }
            }

            this.hideTyping();
            
            // Adicionar badge se usou agent
            const agentBadge = usedAgent ? '<span class="cb-agent-badge" title="Resposta via Agent">🤖</span>' : '';
            this.addMessage(agentBadge + response, 'bot');
            
            // Salvar resposta no histórico
            this.context.conversationHistory.push({ type: 'bot', content: response });
            
            // MELHORIA 4: Adicionar ações rápidas contextuais
            const contextActions = this.getContextualActions(text, response);
            if (contextActions.length > 0) {
                this.addActionButtons(contextActions);
            }
            
            // Manter apenas últimas 10 mensagens no contexto
            if (this.context.conversationHistory.length > 10) {
                this.context.conversationHistory = this.context.conversationHistory.slice(-10);
            }
        },

        addMessage(content, type) {
            const container = document.getElementById('cbMessages');
            const msg = document.createElement('div');
            msg.className = `cb-message ${type}`;
            msg.innerHTML = content;
            container.appendChild(msg);
            container.scrollTop = container.scrollHeight;

            // Salvar no histórico
            this.messages.push({ content, type, time: Date.now() });
            this.saveHistory();
        },

        showTyping() {
            const container = document.getElementById('cbMessages');
            const typing = document.createElement('div');
            typing.className = 'cb-typing';
            typing.id = 'cbTyping';
            typing.innerHTML = '<span></span><span></span><span></span>';
            container.appendChild(typing);
            container.scrollTop = container.scrollHeight;
            this.isTyping = true;
        },

        hideTyping() {
            const typing = document.getElementById('cbTyping');
            if (typing) typing.remove();
            this.isTyping = false;
        },

        processQuestion(text) {
            // Verificar se tem dados
            const tickets = window.allTicketsCache || window.ticketsData || [];
            if (tickets.length === 0) {
                return `⚠️ Nenhum dado carregado.<br><br>
                    <span class="cb-detail">Carregue os tickets primeiro para que eu possa responder suas perguntas.</span>`;
            }

            // Tentar encontrar padrão correspondente
            for (const pattern of this.patterns) {
                const match = text.match(pattern.regex);
                if (match) {
                    return this[pattern.handler](tickets, match, text);
                }
            }

            // Resposta padrão se não encontrar padrão
            return this.defaultResponse(text);
        },

        // ===== HANDLERS =====

        countOpenTickets(tickets) {
            const open = tickets.filter(t => t.status == 2).length;
            const percent = ((open / tickets.length) * 100).toFixed(1);
            return `📂 <strong>Tickets Abertos</strong>
                <div class="cb-value">${open}</div>
                <span class="cb-detail">${percent}% do total de ${tickets.length} tickets</span>`;
        },

        countClosedTickets(tickets) {
            const closed = tickets.filter(t => [4, 5].includes(Number(t.status))).length;
            const percent = ((closed / tickets.length) * 100).toFixed(1);
            return `✅ <strong>Tickets Resolvidos/Fechados</strong>
                <div class="cb-value">${closed}</div>
                <span class="cb-detail">${percent}% do total • Taxa de resolução</span>`;
        },

        countPendingTickets(tickets) {
            const pending = tickets.filter(t => [3, 6, 7].includes(Number(t.status))).length;
            return `⏳ <strong>Tickets Pendentes/Aguardando</strong>
                <div class="cb-value">${pending}</div>
                <span class="cb-detail">Aguardando ação ou resposta</span>`;
        },

        countUrgentTickets(tickets) {
            const urgent = tickets.filter(t => t.priority == 4).length;
            const high = tickets.filter(t => t.priority == 3).length;
            const openUrgent = tickets.filter(t => t.priority == 4 && t.status == 2).length;
            
            let alert = '';
            if (openUrgent > 0) {
                alert = `<div class="cb-alert">⚠️ ${openUrgent} urgente(s) ainda aberto(s)!</div>`;
            }
            
            return `🚨 <strong>Tickets Urgentes</strong>
                <div class="cb-value">${urgent}</div>
                <span class="cb-detail">+ ${high} com prioridade alta</span>
                ${alert}`;
        },

        countTotalTickets(tickets) {
            const byStatus = {
                abertos: tickets.filter(t => t.status == 2).length,
                pendentes: tickets.filter(t => [3, 6, 7].includes(Number(t.status))).length,
                resolvidos: tickets.filter(t => [4, 5].includes(Number(t.status))).length
            };
            return `📊 <strong>Total de Tickets</strong>
                <div class="cb-value">${tickets.length}</div>
                <ul class="cb-list">
                    <li>📂 ${byStatus.abertos} abertos</li>
                    <li>⏳ ${byStatus.pendentes} pendentes</li>
                    <li>✅ ${byStatus.resolvidos} resolvidos</li>
                </ul>`;
        },

        countTodayTickets(tickets) {
            const today = new Date().toISOString().slice(0, 10);
            const todayTickets = tickets.filter(t => 
                t.created_at && t.created_at.slice(0, 10) === today
            );
            const resolved = todayTickets.filter(t => [4, 5].includes(Number(t.status))).length;
            return `📅 <strong>Tickets Hoje</strong>
                <div class="cb-value">${todayTickets.length}</div>
                <span class="cb-detail">${resolved} já resolvido(s)</span>`;
        },

        countWeekTickets(tickets) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekTickets = tickets.filter(t => 
                t.created_at && new Date(t.created_at) >= weekAgo
            );
            const resolved = weekTickets.filter(t => [4, 5].includes(Number(t.status))).length;
            return `📆 <strong>Tickets Esta Semana</strong>
                <div class="cb-value">${weekTickets.length}</div>
                <span class="cb-detail">${resolved} resolvido(s) • ${weekTickets.length - resolved} pendente(s)</span>`;
        },

        countMonthTickets(tickets) {
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const monthTickets = tickets.filter(t => 
                t.created_at && new Date(t.created_at) >= monthStart
            );
            const resolved = monthTickets.filter(t => [4, 5].includes(Number(t.status))).length;
            const rate = monthTickets.length > 0 ? ((resolved / monthTickets.length) * 100).toFixed(0) : 0;
            return `🗓️ <strong>Tickets Este Mês</strong>
                <div class="cb-value">${monthTickets.length}</div>
                <span class="cb-detail">${resolved} resolvidos (${rate}%)</span>`;
        },

        getSLAInfo(tickets) {
            const withSLA = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (withSLA.length === 0) {
                return `⏱️ <strong>Conformidade SLA</strong>
                    <div class="cb-value">--</div>
                    <span class="cb-detail">Sem dados de SLA disponíveis</span>`;
            }

            const withinSLA = withSLA.filter(t => {
                const responseTime = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                return responseTime <= 4;
            });
            const slaPercent = ((withinSLA.length / withSLA.length) * 100).toFixed(1);
            
            let status = 'cb-success';
            let icon = '✅';
            if (slaPercent < 70) { status = 'cb-alert'; icon = '⚠️'; }
            else if (slaPercent < 85) { status = ''; icon = '⚡'; }

            return `⏱️ <strong>Conformidade SLA (1ª Resposta)</strong>
                <div class="cb-value">${slaPercent}%</div>
                <span class="cb-detail">${withinSLA.length} de ${withSLA.length} dentro do prazo (4h)</span>
                <div class="${status}">${icon} ${slaPercent >= 85 ? 'Dentro da meta!' : slaPercent >= 70 ? 'Atenção necessária' : 'Abaixo da meta!'}</div>`;
        },

        getOutsideSLA(tickets) {
            const withSLA = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            const outsideSLA = withSLA.filter(t => {
                const responseTime = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                return responseTime > 4;
            });
            return `⚠️ <strong>Tickets Fora do SLA</strong>
                <div class="cb-value">${outsideSLA.length}</div>
                <span class="cb-detail">Primeira resposta após 4 horas</span>`;
        },

        getTopResolver(tickets) {
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status)));
            const byPerson = {};
            
            resolved.forEach(t => {
                const person = t.cf_tratativa || 'Não atribuído';
                person.split(/[,;\/]/).forEach(p => {
                    const name = p.trim();
                    if (name) byPerson[name] = (byPerson[name] || 0) + 1;
                });
            });

            const sorted = Object.entries(byPerson)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (sorted.length === 0) {
                return `🏆 Nenhum ticket resolvido encontrado com responsável atribuído.`;
            }

            return `🏆 <strong>Top Resolvedores</strong>
                <ol class="cb-list">
                    ${sorted.map(([name, count], i) => 
                        `<li><strong>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''} ${name}</strong>: ${count} tickets</li>`
                    ).join('')}
                </ol>`;
        },

        getTopAgents(tickets, match) {
            const limit = parseInt(match[2]) || 5;
            return this.getTopResolver(tickets);
        },

        getTopTeams(tickets) {
            const byTeam = {};
            tickets.forEach(t => {
                const team = t.cf_grupo_tratativa || t.group_name || 'Sem time';
                byTeam[team] = (byTeam[team] || 0) + 1;
            });

            const sorted = Object.entries(byTeam)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            return `👥 <strong>Top Times por Volume</strong>
                <ol class="cb-list">
                    ${sorted.map(([name, count]) => 
                        `<li><strong>${name}</strong>: ${count} tickets</li>`
                    ).join('')}
                </ol>`;
        },

        getAvgResolutionTime(tickets) {
            const resolved = tickets.filter(t => t.stats_resolved_at && t.created_at);
            if (resolved.length === 0) {
                return `⏱️ <strong>Tempo Médio de Resolução</strong>
                    <div class="cb-value">--</div>
                    <span class="cb-detail">Sem dados disponíveis</span>`;
            }

            const times = resolved.map(t => 
                (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60)
            );
            const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);

            return `⏱️ <strong>Tempo Médio de Resolução</strong>
                <div class="cb-value">${avg}h</div>
                <span class="cb-detail">Baseado em ${resolved.length} tickets resolvidos</span>`;
        },

        getAvgFirstResponseTime(tickets) {
            const withResponse = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (withResponse.length === 0) {
                return `⏱️ <strong>Tempo Médio 1ª Resposta</strong>
                    <div class="cb-value">--</div>
                    <span class="cb-detail">Sem dados disponíveis</span>`;
            }

            const times = withResponse.map(t => 
                (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60)
            );
            const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);

            return `⏱️ <strong>Tempo Médio 1ª Resposta</strong>
                <div class="cb-value">${avg}h</div>
                <span class="cb-detail">Baseado em ${withResponse.length} tickets</span>`;
        },

        getTicketsByEntity(tickets, match) {
            const entity = match[2].trim().toLowerCase();
            const filtered = tickets.filter(t => {
                const searchFields = [
                    t.cf_tratativa || '',
                    t.cf_grupo_tratativa || '',
                    t.requester_name || '',
                    t.group_name || ''
                ].join(' ').toLowerCase();
                return searchFields.includes(entity);
            });

            if (filtered.length === 0) {
                return `🔍 Nenhum ticket encontrado para "<strong>${entity}</strong>"`;
            }

            const resolved = filtered.filter(t => [4, 5].includes(Number(t.status))).length;
            const rate = ((resolved / filtered.length) * 100).toFixed(0);

            return `🔍 <strong>Tickets de "${entity}"</strong>
                <div class="cb-value">${filtered.length}</div>
                <span class="cb-detail">${resolved} resolvidos (${rate}%)</span>`;
        },

        getEntityStatus(tickets, match) {
            return this.getTicketsByEntity(tickets, match);
        },

        getTrend(tickets) {
            const last30 = tickets.filter(t => {
                if (!t.created_at) return false;
                const date = new Date(t.created_at);
                const ago = new Date();
                ago.setDate(ago.getDate() - 30);
                return date >= ago;
            }).length;

            const prev30 = tickets.filter(t => {
                if (!t.created_at) return false;
                const date = new Date(t.created_at);
                const start = new Date();
                start.setDate(start.getDate() - 60);
                const end = new Date();
                end.setDate(end.getDate() - 30);
                return date >= start && date < end;
            }).length;

            const change = prev30 > 0 ? (((last30 - prev30) / prev30) * 100).toFixed(0) : 0;
            const trend = last30 > prev30 ? '📈' : last30 < prev30 ? '📉' : '➡️';

            return `${trend} <strong>Tendência de Volume</strong>
                <div class="cb-value">${last30} tickets</div>
                <span class="cb-detail">Últimos 30 dias vs anterior: ${change > 0 ? '+' : ''}${change}%</span>`;
        },

        getProblems(tickets) {
            const problems = [];
            
            // Verificar SLA
            const withSLA = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            if (withSLA.length > 0) {
                const slaRate = (withSLA.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time <= 4;
                }).length / withSLA.length) * 100;
                if (slaRate < 80) problems.push(`⚠️ SLA em ${slaRate.toFixed(0)}% (meta: 80%)`);
            }

            // Verificar urgentes abertos
            const urgentOpen = tickets.filter(t => t.priority == 4 && t.status == 2).length;
            if (urgentOpen > 0) problems.push(`🚨 ${urgentOpen} ticket(s) urgente(s) aberto(s)`);

            // Verificar backlog
            const open = tickets.filter(t => t.status == 2).length;
            const total = tickets.length;
            if (open / total > 0.3) problems.push(`📈 Backlog alto: ${open} tickets abertos (${((open/total)*100).toFixed(0)}%)`);

            if (problems.length === 0) {
                return `✅ <strong>Nenhum problema crítico detectado!</strong>
                    <span class="cb-detail">Os indicadores estão dentro dos parâmetros normais.</span>`;
            }

            return `⚠️ <strong>Alertas Detectados</strong>
                <ul class="cb-list">
                    ${problems.map(p => `<li>${p}</li>`).join('')}
                </ul>`;
        },

        showHelp() {
            const aiStatus = this.aiConfig.apiKey ? '🟢 IA ativa - Pergunte qualquer coisa!' : '🟡 Modo local - Configure IA para respostas mais inteligentes';
            
            return `<strong>Como posso ajudar?</strong>
                <br><br><span style="background:${this.aiConfig.apiKey ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'};padding:4px 8px;border-radius:4px;font-size:0.85em;">${aiStatus}</span>
                
                <br><br><strong>💬 Com IA ativa, pergunte qualquer coisa:</strong>
                <ul class="cb-list">
                    <li>"Me explique a situação atual"</li>
                    <li>"O que devo priorizar hoje?"</li>
                    <li>"Faça uma análise do time X"</li>
                    <li>"Como posso melhorar meu desempenho?"</li>
                </ul>
                
                <strong>📊 Dados e Métricas:</strong>
                <ul class="cb-list">
                    <li>"Quantos tickets abertos?"</li>
                    <li>"Como está o SLA?"</li>
                    <li>"Resumo geral"</li>
                </ul>
                
                <strong>⚙️ Comandos:</strong>
                <ul class="cb-list">
                    <li><code>/key API_KEY</code> - Configurar IA</li>
                    <li><code>/provider groq</code> - Trocar provider</li>
                </ul>
                
                <span class="cb-detail">💡 Clique em ⚙️ para instruções de configuração.</span>`;
        },

        greet() {
            const hour = new Date().getHours();
            let greeting = 'Olá';
            if (hour < 12) greeting = 'Bom dia';
            else if (hour < 18) greeting = 'Boa tarde';
            else greeting = 'Boa noite';

            const aiInfo = this.aiConfig.apiKey 
                ? '🟢 <strong>IA ativa!</strong> Pergunte qualquer coisa em linguagem natural.'
                : '🟡 <strong>Modo local.</strong> Clique em ⚙️ para ativar a IA e respostas mais inteligentes.';

            return `👋 <strong>${greeting}!</strong>
                <br><br>Sou seu assistente de dados com IA.
                <br><br>${aiInfo}
                <br><br><span class="cb-detail">💡 Dica: Digite "ajuda" para ver o que posso fazer.</span>`;
        },

        defaultResponse(text) {
            // Tentar busca fuzzy antes de desistir
            const fuzzyResult = this.fuzzySearch(text);
            if (fuzzyResult) {
                return fuzzyResult;
            }

            return `🤔 Não entendi sua pergunta sobre "<em>${this.escapeHtml(text)}</em>".
                <br><br>Tente perguntar de outra forma, como:
                <ul class="cb-list">
                    <li>"Quantos tickets abertos?"</li>
                    <li>"O que é SLA?"</li>
                    <li>"Como melhorar a taxa de resolução?"</li>
                    <li>"Resumo geral"</li>
                </ul>
                <span class="cb-detail">💡 Posso explicar métricas e dar dicas de melhoria!</span>`;
        },

        // ===== FUNÇÕES INTELIGENTES =====

        // Normalizar texto removendo acentos e convertendo para minúsculo
        normalizeText(text) {
            return text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        },

        // Encontrar termo mais similar
        findSimilarTerm(text) {
            const normalized = this.normalizeText(text);
            
            // Verificar nas métricas
            for (const [key, data] of Object.entries(this.knowledge.metrics)) {
                if (normalized.includes(this.normalizeText(key))) {
                    return { type: 'metric', key, data };
                }
            }

            // Verificar sinônimos
            for (const [key, synonyms] of Object.entries(this.knowledge.synonyms)) {
                if (normalized.includes(key) || synonyms.some(s => normalized.includes(s))) {
                    return { type: 'synonym', key, synonyms };
                }
            }

            return null;
        },

        // Busca fuzzy para tentar entender a pergunta
        fuzzySearch(text) {
            const normalized = this.normalizeText(text);
            const tickets = window.allTicketsCache || [];

            // Detectar se está perguntando sobre uma pessoa ou time específico
            const entityMatch = this.detectEntity(text);
            if (entityMatch && tickets.length > 0) {
                return this.getTicketsByEntity(tickets, [null, 'de', entityMatch]);
            }

            // Detectar se está perguntando sobre um conceito
            const conceptMatch = this.findSimilarTerm(text);
            if (conceptMatch && conceptMatch.type === 'metric') {
                return this.explainConcept(tickets, [null, 'o que é', conceptMatch.key]);
            }

            return null;
        },

        // Detectar entidade (pessoa ou time) no texto
        detectEntity(text) {
            const tickets = window.allTicketsCache || [];
            if (tickets.length === 0) return null;

            const normalized = this.normalizeText(text);
            
            // Coletar todos os nomes de pessoas e times
            const entities = new Set();
            tickets.forEach(t => {
                if (t.cf_tratativa) {
                    t.cf_tratativa.split(/[,;\/]/).forEach(p => {
                        const name = p.trim();
                        if (name && name.length > 2) entities.add(name);
                    });
                }
                if (t.cf_grupo_tratativa) entities.add(t.cf_grupo_tratativa);
                if (t.group_name) entities.add(t.group_name);
            });

            // Verificar se alguma entidade está no texto
            for (const entity of entities) {
                if (normalized.includes(this.normalizeText(entity))) {
                    return entity;
                }
            }

            return null;
        },

        // Explicar um conceito do glossário
        explainConcept(tickets, match) {
            const concept = (match[2] || '').toLowerCase().replace(/[?!.,]/g, '').trim();
            
            // Buscar no conhecimento
            for (const [key, data] of Object.entries(this.knowledge.metrics)) {
                if (concept.includes(key) || key.includes(concept)) {
                    this.context.lastMetric = key;
                    this.context.lastTopic = 'concept';
                    
                    return `📖 <strong>${key.toUpperCase()}</strong>
                        <br><br>${data.explanation}
                        <br><br><strong>📐 Fórmula:</strong><br>
                        <code style="background:#3f3f5a;padding:6px 10px;border-radius:4px;display:inline-block;margin:4px 0;">
                        ${data.formula}
                        </code>
                        <br><br><strong>✅ Valor ideal:</strong> ${data.goodValue}
                        <br><strong>⚠️ Atenção se:</strong> ${data.badValue}
                        ${this.getSuggestedQuestions(['formula', 'tips', 'current'])}`;
                }
            }

            // Verificar se é sobre status
            if (concept.includes('status')) {
                return this.explainStatus();
            }

            // Verificar se é sobre prioridade
            if (concept.includes('prioridade') || concept.includes('urgente')) {
                return this.explainPriority();
            }

            return `🔍 Não encontrei informações sobre "<em>${concept}</em>".
                <br><br>Posso explicar sobre:
                <ul class="cb-list">
                    <li>Taxa de resolução</li>
                    <li>SLA</li>
                    <li>Tempo médio</li>
                    <li>Backlog</li>
                    <li>Status dos tickets</li>
                    <li>Prioridades</li>
                </ul>`;
        },

        explainStatus() {
            const statusList = Object.entries(this.knowledge.status)
                .map(([id, s]) => `<li><span style="color:${s.color}">●</span> <strong>${s.name}</strong>: ${s.desc}</li>`)
                .join('');
            
            return `📊 <strong>STATUS DOS TICKETS</strong>
                <ul class="cb-list">${statusList}</ul>
                <span class="cb-detail">💡 Use "quantos [status]?" para ver contagens.</span>`;
        },

        explainPriority() {
            const priorityList = Object.entries(this.knowledge.priority)
                .map(([id, p]) => `<li><span style="color:${p.color}">●</span> <strong>${p.name}</strong>: SLA ${p.sla}</li>`)
                .join('');
            
            return `🚨 <strong>PRIORIDADES</strong>
                <ul class="cb-list">${priorityList}</ul>
                <span class="cb-detail">💡 Prioridade define o prazo de SLA.</span>`;
        },

        // Explicar fórmula específica
        explainFormula(tickets, match) {
            const metric = (match[3] || this.context.lastMetric || '').toLowerCase();
            
            for (const [key, data] of Object.entries(this.knowledge.metrics)) {
                if (metric.includes(key) || key.includes(metric)) {
                    this.context.lastMetric = key;
                    
                    return `📐 <strong>Fórmula: ${key.toUpperCase()}</strong>
                        <br><br><code style="background:#3f3f5a;padding:10px;border-radius:6px;display:block;margin:8px 0;font-size:1.1em;">
                        ${data.formula}
                        </code>
                        <br>${data.explanation}
                        ${this.getSuggestedQuestions(['current', 'tips'])}`;
                }
            }

            return this.explainConcept(tickets, [null, 'o que é', metric]);
        },

        // Explicar meta/valor ideal
        explainTarget(tickets, match) {
            const metric = (match[3] || this.context.lastMetric || '').toLowerCase();
            
            for (const [key, data] of Object.entries(this.knowledge.metrics)) {
                if (metric.includes(key) || key.includes(metric)) {
                    return `🎯 <strong>Meta: ${key.toUpperCase()}</strong>
                        <br><br><strong>✅ Valor ideal:</strong> ${data.goodValue}
                        <br><strong>⚠️ Atenção se:</strong> ${data.badValue}
                        <br><br><span class="cb-detail">💡 Pergunte "como está o ${key}?" para ver o valor atual.</span>`;
                }
            }

            return `🎯 Metas gerais do sistema:
                <ul class="cb-list">
                    <li><strong>SLA:</strong> > 85%</li>
                    <li><strong>Taxa de Resolução:</strong> > 80%</li>
                    <li><strong>Tempo 1ª Resposta:</strong> < 4h</li>
                    <li><strong>Tempo Resolução:</strong> < 24h</li>
                    <li><strong>Backlog:</strong> < 30% do volume</li>
                </ul>`;
        },

        // Dar dicas de melhoria
        giveTips(tickets, match) {
            const topic = (match[3] || this.context.lastMetric || '').toLowerCase();
            
            for (const [key, data] of Object.entries(this.knowledge.metrics)) {
                if (topic.includes(key) || key.includes(topic) || topic === '') {
                    const tips = data.tips.map(t => `<li>✨ ${t}</li>`).join('');
                    return `💡 <strong>Dicas para melhorar ${key.toUpperCase()}</strong>
                        <ul class="cb-list">${tips}</ul>
                        <span class="cb-detail">Quer saber mais sobre outra métrica?</span>`;
                }
            }

            // Dicas gerais
            return `💡 <strong>Dicas Gerais de Melhoria</strong>
                <ul class="cb-list">
                    <li>✨ <strong>SLA:</strong> Configure alertas, use templates de resposta</li>
                    <li>✨ <strong>Resolução:</strong> Documente soluções, crie base de conhecimento</li>
                    <li>✨ <strong>Backlog:</strong> Priorize por idade e urgência</li>
                    <li>✨ <strong>Produtividade:</strong> Distribua carga, identifique gargalos</li>
                </ul>
                <span class="cb-detail">Pergunte "dicas para [métrica]" para sugestões específicas.</span>`;
        },

        // Comparar duas entidades
        compare(tickets, match) {
            const entity1 = match[2].trim();
            const entity2 = match[4].trim();

            const stats1 = this.getEntityStats(tickets, entity1);
            const stats2 = this.getEntityStats(tickets, entity2);

            if (!stats1.total && !stats2.total) {
                return `❌ Não encontrei dados para comparar "${entity1}" e "${entity2}".`;
            }

            return `📊 <strong>Comparativo</strong>
                <table style="width:100%;border-collapse:collapse;font-size:0.85em;margin:10px 0;">
                    <tr style="background:#3f3f5a;">
                        <th style="padding:8px;border:1px solid #555;">Métrica</th>
                        <th style="padding:8px;border:1px solid #555;">${entity1}</th>
                        <th style="padding:8px;border:1px solid #555;">${entity2}</th>
                    </tr>
                    <tr>
                        <td style="padding:6px;border:1px solid #555;">Total</td>
                        <td style="border:1px solid #555;text-align:center;"><strong>${stats1.total}</strong></td>
                        <td style="border:1px solid #555;text-align:center;"><strong>${stats2.total}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:6px;border:1px solid #555;">Resolvidos</td>
                        <td style="border:1px solid #555;text-align:center;">${stats1.resolved} (${stats1.rate}%)</td>
                        <td style="border:1px solid #555;text-align:center;">${stats2.resolved} (${stats2.rate}%)</td>
                    </tr>
                    <tr>
                        <td style="padding:6px;border:1px solid #555;">Abertos</td>
                        <td style="border:1px solid #555;text-align:center;">${stats1.open}</td>
                        <td style="border:1px solid #555;text-align:center;">${stats2.open}</td>
                    </tr>
                </table>
                <span class="cb-detail">🏆 ${stats1.rate > stats2.rate ? entity1 : entity2} tem melhor taxa de resolução.</span>`;
        },

        getEntityStats(tickets, entity) {
            const normalized = this.normalizeText(entity);
            const filtered = tickets.filter(t => {
                const searchFields = [
                    t.cf_tratativa || '',
                    t.cf_grupo_tratativa || '',
                    t.group_name || ''
                ].join(' ');
                return this.normalizeText(searchFields).includes(normalized);
            });

            const resolved = filtered.filter(t => [4, 5].includes(Number(t.status))).length;
            const open = filtered.filter(t => t.status == 2).length;
            const rate = filtered.length > 0 ? ((resolved / filtered.length) * 100).toFixed(0) : 0;

            return { total: filtered.length, resolved, open, rate };
        },

        // Analisar por que algo está acontecendo
        analyzeWhy(tickets, match) {
            const topic = (match[2] || '').toLowerCase();

            // Analisar SLA baixo
            if (topic.includes('sla') && topic.includes('baix')) {
                const withSLA = tickets.filter(t => t.stats_first_responded_at && t.created_at);
                const outsideSLA = withSLA.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time > 4;
                });

                // Analisar padrões
                const byHour = {};
                const byDay = {};
                outsideSLA.forEach(t => {
                    const d = new Date(t.created_at);
                    const hour = d.getHours();
                    const day = d.getDay();
                    byHour[hour] = (byHour[hour] || 0) + 1;
                    byDay[day] = (byDay[day] || 0) + 1;
                });

                const peakHour = Object.entries(byHour).sort((a,b) => b[1] - a[1])[0];
                const peakDay = Object.entries(byDay).sort((a,b) => b[1] - a[1])[0];
                const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

                return `🔍 <strong>Análise: SLA Baixo</strong>
                    <br><br><strong>Padrões identificados:</strong>
                    <ul class="cb-list">
                        <li>📊 ${outsideSLA.length} tickets fora do SLA</li>
                        ${peakHour ? `<li>⏰ Pico às ${peakHour[0]}h (${peakHour[1]} tickets)</li>` : ''}
                        ${peakDay ? `<li>📅 Mais problemas em ${days[peakDay[0]]} (${peakDay[1]} tickets)</li>` : ''}
                    </ul>
                    <strong>💡 Sugestões:</strong>
                    <ul class="cb-list">
                        ${peakHour && peakHour[0] >= 12 ? '<li>Reforce equipe à tarde</li>' : ''}
                        <li>Configure alertas de SLA próximo do limite</li>
                        <li>Use respostas automáticas para primeiro contato</li>
                    </ul>`;
            }

            return `🔍 Para analisar problemas, posso ajudar com:
                <ul class="cb-list">
                    <li>"Por que o SLA está baixo?"</li>
                    <li>"Problemas detectados"</li>
                    <li>"Tickets urgentes abertos"</li>
                </ul>`;
        },

        // Fazer previsão simples
        predict(tickets) {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const daysElapsed = Math.max(1, Math.floor((now - monthStart) / (1000 * 60 * 60 * 24)));
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

            const monthTickets = tickets.filter(t => 
                t.created_at && new Date(t.created_at) >= monthStart
            );
            const monthResolved = monthTickets.filter(t => [4, 5].includes(Number(t.status))).length;

            const dailyRate = monthResolved / daysElapsed;
            const projection = Math.round(dailyRate * daysInMonth);
            const currentRate = monthTickets.length > 0 ? ((monthResolved / monthTickets.length) * 100).toFixed(0) : 0;

            return `🔮 <strong>Projeção para o Mês</strong>
                <br><br><strong>Dados atuais (${daysElapsed} dias):</strong>
                <ul class="cb-list">
                    <li>📥 ${monthTickets.length} tickets criados</li>
                    <li>✅ ${monthResolved} resolvidos (${currentRate}%)</li>
                    <li>📈 Média: ${dailyRate.toFixed(1)} resoluções/dia</li>
                </ul>
                <strong>📊 Projeção fim do mês:</strong>
                <div class="cb-value">~${projection} resoluções</div>
                <span class="cb-detail">Baseado no ritmo atual de ${dailyRate.toFixed(1)}/dia</span>`;
        },

        // Visão geral / resumo
        getOverview(tickets) {
            const total = tickets.length;
            const open = tickets.filter(t => t.status == 2).length;
            const pending = tickets.filter(t => [3, 6, 7].includes(Number(t.status))).length;
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status))).length;
            const urgent = tickets.filter(t => t.priority == 4 && t.status == 2).length;
            
            const rate = total > 0 ? ((resolved / total) * 100).toFixed(0) : 0;

            // Calcular SLA
            const withSLA = tickets.filter(t => t.stats_first_responded_at && t.created_at);
            let slaRate = 0;
            if (withSLA.length > 0) {
                const withinSLA = withSLA.filter(t => {
                    const time = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return time <= 4;
                });
                slaRate = ((withinSLA.length / withSLA.length) * 100).toFixed(0);
            }

            let health = '✅ Saudável';
            if (rate < 60 || slaRate < 70 || urgent > 5) {
                health = '⚠️ Atenção necessária';
            }
            if (rate < 40 || slaRate < 50 || urgent > 10) {
                health = '🚨 Crítico';
            }

            this.context.lastTopic = 'overview';

            return `📊 <strong>Visão Geral</strong>
                <br><br><strong>Status:</strong> ${health}
                <br><br><table style="width:100%;border-collapse:collapse;font-size:0.85em;">
                    <tr>
                        <td style="padding:6px;">📥 Total</td>
                        <td style="padding:6px;text-align:right;"><strong>${total}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:6px;">📂 Abertos</td>
                        <td style="padding:6px;text-align:right;color:#3b82f6;"><strong>${open}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:6px;">⏳ Pendentes</td>
                        <td style="padding:6px;text-align:right;color:#f59e0b;"><strong>${pending}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:6px;">✅ Resolvidos</td>
                        <td style="padding:6px;text-align:right;color:#10b981;"><strong>${resolved}</strong> (${rate}%)</td>
                    </tr>
                    <tr>
                        <td style="padding:6px;">🚨 Urgentes abertos</td>
                        <td style="padding:6px;text-align:right;color:#ef4444;"><strong>${urgent}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:6px;">⏱️ SLA</td>
                        <td style="padding:6px;text-align:right;"><strong>${slaRate}%</strong></td>
                    </tr>
                </table>
                ${this.getSuggestedQuestions(['problems', 'tips', 'predict'])}`;
        },

        // Continuar contexto da conversa anterior
        continueContext(tickets) {
            if (this.context.lastMetric) {
                return this.giveTips(tickets, [null, null, this.context.lastMetric]);
            }
            if (this.context.lastTopic === 'overview') {
                return this.getProblems(tickets);
            }
            
            return `🤔 Sobre o que você gostaria de saber mais?
                <br><br>Você pode perguntar:
                <ul class="cb-list">
                    <li>"Dicas para SLA"</li>
                    <li>"Como está a taxa de resolução?"</li>
                    <li>"Quais problemas temos?"</li>
                </ul>`;
        },

        // Sugestões contextuais
        getSuggestedQuestions(types) {
            const suggestions = {
                formula: 'Como é calculado?',
                tips: 'Como melhorar?',
                current: 'Como está atualmente?',
                problems: 'Algum problema?',
                predict: 'Qual a previsão?'
            };

            const buttons = types.map(t => suggestions[t] ? 
                `<button onclick="Chatbot.askSuggestion('${suggestions[t]}')" style="background:#3f3f5a;border:1px solid #555;color:#e4e4e7;padding:4px 8px;border-radius:12px;font-size:0.75em;cursor:pointer;margin:2px;">${suggestions[t]}</button>` 
                : ''
            ).join('');

            return `<div style="margin-top:10px;">${buttons}</div>`;
        },

        // ============= NOVOS HANDLERS (50 MELHORIAS) =============

        // Handler: Ver por outro ângulo
        handleAlternativeView(tickets) {
            // Baseado no contexto anterior, mostrar dados de outro ponto de vista
            const lastTopic = this.context.lastTopic;
            const stats = this.getQuickStats(tickets);
            
            // Escolher uma análise diferente baseada no contexto
            const analyses = [
                {
                    title: '🔍 Visão por Prioridade',
                    content: () => {
                        const byPriority = [0, 0, 0, 0, 0];
                        tickets.forEach(t => byPriority[t.priority || 1]++);
                        return `<ul class="cb-list">
                            <li>🔴 Urgente: ${byPriority[4]} tickets</li>
                            <li>🟠 Alta: ${byPriority[3]} tickets</li>
                            <li>🟡 Média: ${byPriority[2]} tickets</li>
                            <li>🟢 Baixa: ${byPriority[1]} tickets</li>
                        </ul>`;
                    }
                },
                {
                    title: '📅 Visão Temporal',
                    content: () => {
                        const now = new Date();
                        const today = tickets.filter(t => t.created_at?.slice(0, 10) === now.toISOString().slice(0, 10)).length;
                        const week = tickets.filter(t => t.created_at && new Date(t.created_at) > new Date(now - 7 * 24 * 60 * 60 * 1000)).length;
                        const month = tickets.filter(t => t.created_at && new Date(t.created_at) > new Date(now - 30 * 24 * 60 * 60 * 1000)).length;
                        return `<ul class="cb-list">
                            <li>📆 Hoje: ${today} tickets</li>
                            <li>📅 Últimos 7 dias: ${week} tickets</li>
                            <li>🗓️ Últimos 30 dias: ${month} tickets</li>
                        </ul>`;
                    }
                },
                {
                    title: '👥 Visão por Carga de Trabalho',
                    content: () => {
                        const byPerson = {};
                        tickets.filter(t => t.status == 2).forEach(t => {
                            const person = t.cf_tratativa || 'Não atribuído';
                            byPerson[person] = (byPerson[person] || 0) + 1;
                        });
                        const top = Object.entries(byPerson).sort((a, b) => b[1] - a[1]).slice(0, 5);
                        return `<strong>Tickets abertos por pessoa:</strong><ul class="cb-list">
                            ${top.map(([p, c]) => `<li>${p}: ${c} abertos</li>`).join('')}
                        </ul>`;
                    }
                }
            ];
            
            // Escolher análise diferente da última
            const analysis = analyses[Math.floor(Math.random() * analyses.length)];
            
            return `${analysis.title}
                <br><br>${analysis.content()}
                <br><span class="cb-detail">💡 Pergunte "ver por outro ângulo" novamente para mais perspectivas.</span>`;
        },

        // Handler: Mais detalhes
        handleMoreDetails(tickets) {
            const lastTopic = this.context.lastTopic;
            const lastMetric = this.context.lastMetric;
            
            // Se tem métrica específica, dar detalhes sobre ela
            if (lastMetric) {
                return this.giveTips(tickets, [null, null, lastMetric]);
            }
            
            // Se tem tópico, expandir
            if (lastTopic === 'overview') {
                return this.getProblems(tickets);
            }
            
            // Detalhes gerais
            const stats = this.getQuickStats(tickets);
            const patterns = this.analyzePatterns(tickets);
            
            return `📊 <strong>Detalhes Adicionais</strong>
                <br><br><strong>Distribuição:</strong>
                <ul class="cb-list">
                    <li>📂 ${stats.open} abertos (${((stats.open / stats.total) * 100).toFixed(0)}%)</li>
                    <li>✅ ${stats.resolved} resolvidos (${stats.resolutionRate}%)</li>
                    <li>🚨 ${stats.urgentOpen} urgentes abertos</li>
                </ul>
                <br><strong>Padrões detectados:</strong>
                <ul class="cb-list">${patterns.insights.slice(0, 3).map(i => `<li>${i}</li>`).join('')}</ul>`;
        },

        // ============= HANDLERS PARA SUGESTÕES CONTEXTUAIS =============

        // Handler: Ver tickets fora do SLA
        handleTicketsOutsideSLA(tickets) {
            const outsideSLA = tickets.filter(t => {
                if (!t.stats_first_responded_at || !t.created_at) return false;
                const hours = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                return hours > 4; // SLA de 4 horas
            });
            
            if (outsideSLA.length === 0) {
                return `✅ <strong>Excelente!</strong> Nenhum ticket fora do SLA de primeira resposta (4h).`;
            }
            
            const samples = outsideSLA.slice(0, 5).map(t => {
                const hours = ((new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60)).toFixed(1);
                return `<li><a href="${this.getTicketLink(t.id)}" target="_blank" style="color:#ef4444">#${t.id}</a> - ${hours}h (${t.subject?.slice(0, 30) || 'Sem título'}...)</li>`;
            });
            
            return `⚠️ <strong>${outsideSLA.length} Tickets Fora do SLA</strong>
                <br><br>Exemplos (tempo de 1ª resposta > 4h):
                <ul class="cb-list">${samples.join('')}</ul>`;
        },

        // Handler: Comparar SLA semanal
        handleCompareSLAWeekly(tickets) {
            const now = new Date();
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
            
            const thisWeek = tickets.filter(t => t.created_at && new Date(t.created_at) >= weekAgo);
            const lastWeek = tickets.filter(t => t.created_at && new Date(t.created_at) >= twoWeeksAgo && new Date(t.created_at) < weekAgo);
            
            const calcSLA = (tks) => {
                const withResponse = tks.filter(t => t.stats_first_responded_at && t.created_at);
                if (withResponse.length === 0) return 0;
                const within = withResponse.filter(t => {
                    const hours = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    return hours <= 4;
                });
                return ((within.length / withResponse.length) * 100).toFixed(1);
            };
            
            const thisWeekSLA = calcSLA(thisWeek);
            const lastWeekSLA = calcSLA(lastWeek);
            const diff = (thisWeekSLA - lastWeekSLA).toFixed(1);
            
            return `📊 <strong>Comparativo SLA Semanal</strong>
                <br><br><table style="width:100%;font-size:0.9em;">
                    <tr><td>Esta semana</td><td style="text-align:right"><strong>${thisWeekSLA}%</strong> (${thisWeek.length} tickets)</td></tr>
                    <tr><td>Semana passada</td><td style="text-align:right"><strong>${lastWeekSLA}%</strong> (${lastWeek.length} tickets)</td></tr>
                    <tr><td>Variação</td><td style="text-align:right;color:${diff >= 0 ? '#10b981' : '#ef4444'}">${diff >= 0 ? '+' : ''}${diff}%</td></tr>
                </table>`;
        },

        // Handler: Ver por time
        handleViewByTeam(tickets) {
            const byTeam = {};
            tickets.forEach(t => {
                const team = t.cf_grupo_tratativa || t.group_name || 'Sem time';
                if (!byTeam[team]) byTeam[team] = { total: 0, open: 0, resolved: 0 };
                byTeam[team].total++;
                if (t.status == 2) byTeam[team].open++;
                if ([4, 5].includes(Number(t.status))) byTeam[team].resolved++;
            });
            
            const sorted = Object.entries(byTeam)
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0 }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 8);
            
            return `👥 <strong>Visão por Time</strong>
                <br><br><table style="width:100%;font-size:0.85em;">
                    <tr><th>Time</th><th>Total</th><th>Abertos</th><th>Taxa</th></tr>
                    ${sorted.map(t => `<tr><td>${t.name.slice(0, 15)}</td><td>${t.total}</td><td style="color:#3b82f6">${t.open}</td><td>${t.rate}%</td></tr>`).join('')}
                </table>`;
        },

        // Handler: Ver por pessoa
        handleViewByPerson(tickets) {
            const byPerson = {};
            tickets.forEach(t => {
                const person = t.cf_tratativa || 'Não atribuído';
                if (!byPerson[person]) byPerson[person] = { total: 0, open: 0, resolved: 0 };
                byPerson[person].total++;
                if (t.status == 2) byPerson[person].open++;
                if ([4, 5].includes(Number(t.status))) byPerson[person].resolved++;
            });
            
            const sorted = Object.entries(byPerson)
                .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0 }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
            
            return `👤 <strong>Visão por Pessoa</strong>
                <br><br><table style="width:100%;font-size:0.85em;">
                    <tr><th>Pessoa</th><th>Total</th><th>Abertos</th><th>Taxa</th></tr>
                    ${sorted.map(p => `<tr><td>${p.name.slice(0, 12)}</td><td>${p.total}</td><td style="color:#3b82f6">${p.open}</td><td>${p.rate}%</td></tr>`).join('')}
                </table>`;
        },

        // Handler: Qual time precisa de atenção
        handleTeamNeedsAttention(tickets) {
            const byTeam = {};
            tickets.forEach(t => {
                const team = t.cf_grupo_tratativa || t.group_name || 'Sem time';
                if (!byTeam[team]) byTeam[team] = { total: 0, open: 0, urgent: 0, old: 0 };
                byTeam[team].total++;
                if (t.status == 2) {
                    byTeam[team].open++;
                    if (t.priority == 4) byTeam[team].urgent++;
                    if (t.created_at) {
                        const age = (Date.now() - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
                        if (age > 7) byTeam[team].old++;
                    }
                }
            });
            
            // Score de atenção: urgentes * 3 + antigos * 2 + abertos
            const ranked = Object.entries(byTeam)
                .map(([name, s]) => ({ name, ...s, score: s.urgent * 3 + s.old * 2 + s.open }))
                .filter(t => t.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
            
            if (ranked.length === 0) {
                return `✅ <strong>Todos os times estão bem!</strong> Nenhum requer atenção especial.`;
            }
            
            return `🚨 <strong>Times que Precisam de Atenção</strong>
                <br><br><ul class="cb-list">${ranked.map(t => 
                    `<li><strong>${t.name}</strong>: ${t.urgent} urgentes, ${t.old} antigos, ${t.open} abertos</li>`
                ).join('')}</ul>`;
        },

        // Handler: Listar urgentes abertos
        handleListUrgentOpen(tickets) {
            const urgent = tickets.filter(t => t.priority == 4 && t.status == 2);
            
            if (urgent.length === 0) {
                return `✅ <strong>Nenhum ticket urgente aberto!</strong> Ótimo trabalho da equipe.`;
            }
            
            const list = urgent.slice(0, 8).map(t => {
                const age = t.created_at ? Math.floor((Date.now() - new Date(t.created_at)) / (1000 * 60 * 60 * 24)) : '?';
                return `<li><a href="${this.getTicketLink(t.id)}" target="_blank" style="color:#ef4444">#${t.id}</a> - ${age}d - ${(t.subject || '').slice(0, 25)}...</li>`;
            });
            
            return `🚨 <strong>${urgent.length} Urgentes Abertos</strong>
                <br><br><ul class="cb-list">${list.join('')}</ul>
                ${urgent.length > 8 ? `<br><span class="cb-detail">...e mais ${urgent.length - 8}</span>` : ''}`;
        },

        // Handler: Quem está com urgentes
        handleWhoHasUrgent(tickets) {
            const urgent = tickets.filter(t => t.priority == 4 && t.status == 2);
            const byPerson = {};
            
            urgent.forEach(t => {
                const person = t.cf_tratativa || 'Não atribuído';
                byPerson[person] = (byPerson[person] || 0) + 1;
            });
            
            const sorted = Object.entries(byPerson).sort((a, b) => b[1] - a[1]);
            
            if (sorted.length === 0) {
                return `✅ <strong>Ninguém está com tickets urgentes abertos!</strong>`;
            }
            
            return `🚨 <strong>Quem Está com Urgentes</strong>
                <br><br><ul class="cb-list">${sorted.slice(0, 10).map(([p, c]) => 
                    `<li><strong>${p}</strong>: ${c} urgente(s)</li>`
                ).join('')}</ul>`;
        },

        // Handler: Ver avaliações negativas
        handleNegativeReviews(tickets) {
            const negative = tickets.filter(t => t.satisfaction_rating === 'negative' || t.satisfaction_rating === 1);
            
            if (negative.length === 0) {
                return `✅ <strong>Nenhuma avaliação negativa encontrada!</strong>
                    <br><span class="cb-detail">Parabéns pela qualidade do atendimento.</span>`;
            }
            
            const list = negative.slice(0, 5).map(t => 
                `<li><a href="${this.getTicketLink(t.id)}" target="_blank" style="color:#ef4444">#${t.id}</a> - ${(t.subject || '').slice(0, 30)}...</li>`
            );
            
            return `👎 <strong>${negative.length} Avaliações Negativas</strong>
                <br><br><ul class="cb-list">${list.join('')}</ul>`;
        },

        // Handler: Ranking de satisfação
        handleSatisfactionRanking(tickets) {
            const byPerson = {};
            tickets.forEach(t => {
                if (!t.satisfaction_rating || !t.cf_tratativa) return;
                const person = t.cf_tratativa;
                if (!byPerson[person]) byPerson[person] = { positive: 0, negative: 0, total: 0 };
                byPerson[person].total++;
                if (t.satisfaction_rating === 'positive' || t.satisfaction_rating > 3) byPerson[person].positive++;
                if (t.satisfaction_rating === 'negative' || t.satisfaction_rating <= 2) byPerson[person].negative++;
            });
            
            const ranked = Object.entries(byPerson)
                .filter(([_, s]) => s.total >= 3)
                .map(([name, s]) => ({ name, ...s, rate: ((s.positive / s.total) * 100).toFixed(0) }))
                .sort((a, b) => b.rate - a.rate);
            
            if (ranked.length === 0) {
                return `⚠️ <strong>Poucos dados de satisfação</strong>
                    <br><span class="cb-detail">Não há dados suficientes para um ranking.</span>`;
            }
            
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            
            return `⭐ <strong>Ranking de Satisfação</strong>
                <br><br><table style="width:100%;font-size:0.85em;">
                    ${ranked.slice(0, 5).map((p, i) => 
                        `<tr><td>${medals[i]} ${p.name.slice(0, 12)}</td><td style="text-align:right">${p.rate}% (${p.total} aval.)</td></tr>`
                    ).join('')}
                </table>`;
        },

        // Handler: O que priorizar hoje
        handleWhatToPrioritize(tickets) {
            const priorities = [];
            
            // 1. Urgentes abertos
            const urgent = tickets.filter(t => t.priority == 4 && t.status == 2);
            if (urgent.length > 0) {
                priorities.push(`🔴 <strong>${urgent.length} tickets urgentes</strong> precisam de atenção imediata`);
            }
            
            // 2. Tickets antigos (> 7 dias)
            const old = tickets.filter(t => t.status == 2 && t.created_at && 
                (Date.now() - new Date(t.created_at)) / (1000 * 60 * 60 * 24) > 7);
            if (old.length > 0) {
                priorities.push(`⏰ <strong>${old.length} tickets antigos</strong> (> 7 dias) precisam de follow-up`);
            }
            
            // 3. Fora do SLA
            const outsideSLA = tickets.filter(t => t.status == 2 && t.stats_first_responded_at && t.created_at &&
                (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60) > 4);
            if (outsideSLA.length > 0) {
                priorities.push(`⚠️ <strong>${outsideSLA.length} tickets</strong> violaram SLA de primeira resposta`);
            }
            
            // 4. Sem atribuição
            const unassigned = tickets.filter(t => t.status == 2 && !t.cf_tratativa);
            if (unassigned.length > 0) {
                priorities.push(`👤 <strong>${unassigned.length} tickets</strong> sem responsável atribuído`);
            }
            
            if (priorities.length === 0) {
                return `✅ <strong>Tudo sob controle!</strong>
                    <br><br>Não há itens críticos para priorizar hoje. Continue o bom trabalho!`;
            }
            
            return `📋 <strong>O Que Priorizar Hoje</strong>
                <br><br><ul class="cb-list">${priorities.map(p => `<li>${p}</li>`).join('')}</ul>`;
        },

        // Handler: Ver tendência mensal
        handleMonthlyTrend(tickets) {
            const months = {};
            tickets.forEach(t => {
                if (!t.created_at) return;
                const month = t.created_at.slice(0, 7); // YYYY-MM
                if (!months[month]) months[month] = { total: 0, resolved: 0 };
                months[month].total++;
                if ([4, 5].includes(Number(t.status))) months[month].resolved++;
            });
            
            const sorted = Object.entries(months)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 6)
                .reverse();
            
            const monthNames = { '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
                                 '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez' };
            
            return `📈 <strong>Tendência Mensal</strong>
                <br><br><table style="width:100%;font-size:0.85em;">
                    <tr><th>Mês</th><th>Total</th><th>Resolvidos</th><th>Taxa</th></tr>
                    ${sorted.map(([m, s]) => {
                        const [y, mm] = m.split('-');
                        const rate = s.total > 0 ? ((s.resolved / s.total) * 100).toFixed(0) : 0;
                        return `<tr><td>${monthNames[mm]}/${y.slice(2)}</td><td>${s.total}</td><td>${s.resolved}</td><td>${rate}%</td></tr>`;
                    }).join('')}
                </table>`;
        },

        // Handler: Qual dia tem mais tickets
        handlePeakDay(tickets) {
            const byDay = [0, 0, 0, 0, 0, 0, 0];
            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            
            tickets.forEach(t => {
                if (t.created_at) {
                    const day = new Date(t.created_at).getDay();
                    byDay[day]++;
                }
            });
            
            const peakIndex = byDay.indexOf(Math.max(...byDay));
            const lowIndex = byDay.indexOf(Math.min(...byDay.filter((_, i) => i !== 0 && i !== 6))); // Ignora fim de semana
            
            return `📅 <strong>Volume por Dia da Semana</strong>
                <br><br><table style="width:100%;font-size:0.85em;">
                    ${dayNames.map((name, i) => {
                        const highlight = i === peakIndex ? 'color:#ef4444;font-weight:bold' : '';
                        return `<tr><td>${name}</td><td style="text-align:right;${highlight}">${byDay[i]} tickets</td></tr>`;
                    }).join('')}
                </table>
                <br>📊 <strong>${dayNames[peakIndex]}</strong> é o dia com mais tickets
                <br>📉 <strong>${dayNames[lowIndex]}</strong> é o dia com menos (dias úteis)`;
        },

        // Handler: Alertas e anomalias
        handleAlerts(tickets) {
            const alerts = this.getProactiveAlerts(tickets);
            
            if (alerts.length === 0) {
                return `✅ <strong>Tudo sob controle!</strong>
                    <br><br>Não há alertas críticos no momento.
                    <br><span class="cb-detail">Continue monitorando para manter a qualidade.</span>`;
            }
            
            const alertsHtml = alerts.slice(0, 5).map(a => 
                `<li>${a.message}<br><span class="cb-detail">→ ${a.action}</span></li>`
            ).join('');
            
            return `🚨 <strong>Alertas Ativos (${alerts.length})</strong>
                <br><br><ul class="cb-list">${alertsHtml}</ul>
                ${this.getSuggestedQuestions(['tips', 'current'])}`;
        },

        // Handler: Previsão de volume
        handlePrediction(tickets) {
            const prediction = this.predictVolume(tickets, 7);
            
            const predictionsHtml = prediction.predictions.slice(0, 5).map(p =>
                `<tr><td>${p.dayOfWeek}</td><td>${p.date}</td><td style="text-align:right"><strong>${p.predicted}</strong></td></tr>`
            ).join('');
            
            return `🔮 <strong>Previsão de Volume</strong>
                <br><br>📊 Média diária: <strong>${prediction.avgDaily}</strong> tickets
                <br>📈 Tendência: ${prediction.trend}
                <br>🎯 Confiança: ${prediction.confidence}
                <br><br><strong>Próximos dias:</strong>
                <table style="width:100%;font-size:0.85em;">
                    <tr><th>Dia</th><th>Data</th><th>Previsto</th></tr>
                    ${predictionsHtml}
                </table>
                <br><span class="cb-detail">Total previsto: ${prediction.totalPredicted} tickets em 7 dias</span>`;
        },

        // Handler: Carga de trabalho
        handleWorkload(tickets) {
            const people = new Set();
            tickets.forEach(t => {
                if (t.cf_tratativa) {
                    t.cf_tratativa.split(/[,;\/]/)[0].trim().length > 2 && 
                    people.add(t.cf_tratativa.split(/[,;\/]/)[0].trim());
                }
            });
            
            const workloads = Array.from(people)
                .map(p => this.getPersonWorkload(p, tickets))
                .sort((a, b) => b.active - a.active);
            
            const available = workloads.filter(w => w.canTakeMore > 3);
            const overloaded = workloads.filter(w => w.loadPercent > 100);
            
            let html = `👥 <strong>Carga de Trabalho da Equipe</strong><br><br>`;
            
            if (overloaded.length > 0) {
                html += `🔴 <strong>Sobrecarregados (${overloaded.length}):</strong>
                    <ul class="cb-list">${overloaded.slice(0, 3).map(w => 
                        `<li>${w.name}: ${w.active}/${w.capacity} tickets (${w.loadPercent}%)</li>`
                    ).join('')}</ul><br>`;
            }
            
            if (available.length > 0) {
                html += `🟢 <strong>Disponíveis (${available.length}):</strong>
                    <ul class="cb-list">${available.slice(0, 5).map(w => 
                        `<li>${w.name}: ${w.status} - pode receber +${w.canTakeMore}</li>`
                    ).join('')}</ul>`;
            }
            
            return html;
        },

        // Handler: Tickets similares
        handleSimilarTickets(tickets, match, text) {
            // Extrair ID do ticket
            const idMatch = text.match(/#?(\d{3,})/);
            if (!idMatch) {
                return `🔍 Para encontrar tickets similares, informe o ID do ticket.
                    <br><br>Exemplo: "tickets similares ao #12345"`;
            }
            
            const ticketId = idMatch[1];
            const similar = this.findSimilarTickets(ticketId, tickets);
            
            if (similar.length === 0) {
                return `🔍 Não encontrei tickets similares ao #${ticketId}.`;
            }
            
            const html = similar.map(s => 
                `<li><a href="${s.link}" target="_blank" style="color:#3b82f6">#${s.id}</a> - ${s.subject.slice(0, 40)}... (${s.similarity} similar)</li>`
            ).join('');
            
            return `🔍 <strong>Tickets Similares ao #${ticketId}</strong>
                <br><br><ul class="cb-list">${html}</ul>`;
        },

        // Handler: Sugestão de atribuição
        handleAssignmentSuggestion(tickets, match, text) {
            const idMatch = text.match(/#?(\d{3,})/);
            if (!idMatch) {
                // Sugestão geral
                const pending = tickets.filter(t => !t.cf_tratativa && t.status == 2);
                if (pending.length === 0) {
                    return `✅ Todos os tickets abertos já têm responsável atribuído.`;
                }
                
                const ticket = pending[0];
                const suggestion = this.suggestAssignment(ticket, tickets);
                
                return `💡 <strong>Ticket #${ticket.id} sem responsável</strong>
                    <br><br>📝 "${ticket.subject.slice(0, 50)}..."
                    <br><br>🎯 <strong>Sugestão: ${suggestion.recommended?.person || 'N/A'}</strong>
                    <br>Motivo: ${suggestion.reason}
                    <br><br>Alternativas: ${suggestion.alternatives.map(a => a.person).join(', ') || 'Nenhuma'}`;
            }
            
            const ticketId = idMatch[1];
            const ticket = tickets.find(t => String(t.id) === ticketId);
            if (!ticket) {
                return `❌ Ticket #${ticketId} não encontrado.`;
            }
            
            const suggestion = this.suggestAssignment(ticket, tickets);
            
            return `💡 <strong>Sugestão de Atribuição - #${ticketId}</strong>
                <br><br>🎯 <strong>Recomendado: ${suggestion.recommended?.person || 'N/A'}</strong>
                <br>${suggestion.reason}
                <br><br>Alternativas:
                <ul class="cb-list">${suggestion.alternatives.map(a => 
                    `<li>${a.person} (${a.workload}, ${a.active} ativos)</li>`
                ).join('') || '<li>Nenhuma</li>'}</ul>`;
        },

        // Handler: Tempo estimado
        handleTimeEstimate(tickets, match, text) {
            const idMatch = text.match(/#?(\d{3,})/);
            if (!idMatch) {
                // Estimativa geral
                const avgResolution = this.estimateResolutionTime({ priority: 2 }, tickets);
                return `⏱️ <strong>Tempo Médio de Resolução</strong>
                    <br><br>📊 Estimativa geral: <strong>${avgResolution.formatted}</strong>
                    <br>Confiança: ${avgResolution.confidence}
                    <br>Baseado em: ${avgResolution.sampleSize} tickets`;
            }
            
            const ticketId = idMatch[1];
            const ticket = tickets.find(t => String(t.id) === ticketId);
            if (!ticket) {
                return `❌ Ticket #${ticketId} não encontrado.`;
            }
            
            const estimate = this.estimateResolutionTime(ticket, tickets);
            const priority = this.knowledge.priority[ticket.priority]?.name || 'N/A';
            
            return `⏱️ <strong>Estimativa - Ticket #${ticketId}</strong>
                <br><br>📊 Prioridade: ${priority}
                <br>⏱️ Tempo estimado: <strong>${estimate.formatted}</strong>
                <br>🎯 Confiança: ${estimate.confidence}
                <br>📈 Baseado em: ${estimate.basedOn} (${estimate.sampleSize} tickets)`;
        },

        // Handler: Histórico do solicitante
        handleRequesterHistory(tickets, match, text) {
            // Tentar extrair email
            const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (!emailMatch) {
                // Mostrar solicitantes frequentes
                const requesters = {};
                tickets.forEach(t => {
                    const email = t.requester_email;
                    if (email) requesters[email] = (requesters[email] || 0) + 1;
                });
                
                const frequent = Object.entries(requesters)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                
                return `👤 <strong>Solicitantes Frequentes</strong>
                    <br><br><ul class="cb-list">${frequent.map(([email, count]) => 
                        `<li>${email}: ${count} tickets</li>`
                    ).join('')}</ul>
                    <br><span class="cb-detail">Para ver histórico completo, informe o email.</span>`;
            }
            
            const email = emailMatch[0];
            const history = this.getRequesterHistory(email, tickets);
            
            if (!history) {
                return `❌ Nenhum ticket encontrado para ${email}`;
            }
            
            return `👤 <strong>Histórico: ${email}</strong>
                <br><br>📊 Total: <strong>${history.totalTickets}</strong> tickets
                <br>✅ Resolvidos: ${history.resolved} (${history.resolutionRate}%)
                <br>📂 Em aberto: ${history.open}
                <br>${history.isFrequent ? '⭐ Cliente frequente' : ''}
                <br><br><strong>Últimos tickets:</strong>
                <ul class="cb-list">${history.recentTickets.slice(0, 3).map(t => 
                    `<li><a href="${this.getTicketLink(t.id)}" target="_blank" style="color:#3b82f6">#${t.id}</a> - ${(t.subject || '').slice(0, 30)}...</li>`
                ).join('')}</ul>`;
        },

        // Handler: Padrões
        handlePatterns(tickets) {
            const patterns = this.analyzePatterns(tickets);
            
            return `📊 <strong>Padrões de Volume</strong>
                <br><br><strong>Por dia da semana:</strong>
                <table style="width:100%;font-size:0.85em;">
                    ${patterns.byDayOfWeek.map(d => 
                        `<tr><td>${d.day}</td><td style="text-align:right"><strong>${d.count}</strong></td></tr>`
                    ).join('')}
                </table>
                <br><strong>Insights:</strong>
                <ul class="cb-list">${patterns.insights.map(i => `<li>${i}</li>`).join('')}</ul>`;
        },

        // Handler: CSAT
        handleCSAT(tickets) {
            const csat = this.analyzeCSAT(tickets);
            
            if (!csat.available) {
                return `📊 <strong>Satisfação do Cliente</strong>
                    <br><br>⚠️ Não há dados de avaliação disponíveis.
                    <br><span class="cb-detail">As pesquisas de satisfação precisam estar habilitadas no Freshdesk.</span>`;
            }
            
            return `📊 <strong>Satisfação do Cliente (CSAT)</strong>
                <br><br>⭐ <strong>CSAT Score: ${csat.csatScore}%</strong>
                <br>📊 NPS: ${csat.nps}
                <br><br>Avaliações (${csat.total}):
                <ul class="cb-list">
                    <li>👍 Positivas: ${csat.positive}</li>
                    <li>😐 Neutras: ${csat.neutral}</li>
                    <li>👎 Negativas: ${csat.negative}</li>
                </ul>
                <br>Tendência: ${csat.trend}`;
        },

        // Handler: Comparativo de períodos
        handlePeriodComparison(tickets) {
            const weekly = this.comparePeriods(tickets, 7);
            const monthly = this.comparePeriods(tickets, 30);
            
            return `📈 <strong>Comparativo de Períodos</strong>
                <br><br><strong>Última semana vs anterior:</strong>
                <table style="width:100%;font-size:0.85em;">
                    <tr><td>Volume</td><td style="text-align:right">${weekly.current.total} ${weekly.changes.volumeText}</td></tr>
                    <tr><td>Resolução</td><td style="text-align:right">${weekly.current.resolutionRate}% (${weekly.changes.resolution > 0 ? '+' : ''}${weekly.changes.resolution}%)</td></tr>
                    <tr><td>SLA</td><td style="text-align:right">${weekly.current.slaRate}% (${weekly.changes.sla > 0 ? '+' : ''}${weekly.changes.sla}%)</td></tr>
                </table>
                <br><strong>Último mês vs anterior:</strong>
                <table style="width:100%;font-size:0.85em;">
                    <tr><td>Volume</td><td style="text-align:right">${monthly.current.total} ${monthly.changes.volumeText}</td></tr>
                    <tr><td>Resolução</td><td style="text-align:right">${monthly.current.resolutionRate}%</td></tr>
                </table>`;
        },

        // Handler: Canais
        handleChannels(tickets) {
            const channels = this.analyzeByChannel(tickets);
            
            return `📡 <strong>Tickets por Canal de Origem</strong>
                <br><br><table style="width:100%;font-size:0.85em;">
                    <tr><th>Canal</th><th>Qtd</th><th>%</th></tr>
                    ${channels.slice(0, 8).map(c => 
                        `<tr><td>${c.channel}</td><td style="text-align:right">${c.count}</td><td style="text-align:right">${c.percent}%</td></tr>`
                    ).join('')}
                </table>`;
        },

        // Handler: Produtos
        handleProducts(tickets) {
            const analysis = this.analyzeByProduct(tickets);
            
            let html = `📦 <strong>Análise por Produto/Sistema</strong><br><br>`;
            
            html += `<strong>Top Produtos:</strong>
                <table style="width:100%;font-size:0.85em;">
                    ${analysis.topProducts.map(p => 
                        `<tr><td>${p.name}</td><td style="text-align:right">${p.count}</td><td style="text-align:right">${p.percent}%</td></tr>`
                    ).join('')}
                </table><br>`;
            
            html += `<strong>Top Sistemas:</strong>
                <table style="width:100%;font-size:0.85em;">
                    ${analysis.topSystems.map(s => 
                        `<tr><td>${s.name}</td><td style="text-align:right">${s.count}</td><td style="text-align:right">${s.percent}%</td></tr>`
                    ).join('')}
                </table>`;
            
            return html;
        },

        // Handler: Ranking
        handleRanking(tickets, match, text) {
            let metric = 'resolved';
            if (/sla/i.test(text)) metric = 'sla';
            else if (/resolu[çc][ãa]o|taxa/i.test(text)) metric = 'resolution_rate';
            else if (/volume|tickets?/i.test(text)) metric = 'volume';
            
            const ranking = this.getRanking(tickets, metric);
            const metricName = {
                'resolved': 'Resolvidos',
                'sla': 'SLA',
                'resolution_rate': 'Taxa de Resolução',
                'volume': 'Volume'
            }[metric];
            
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            
            return `🏆 <strong>Ranking por ${metricName}</strong>
                <br><br><table style="width:100%;font-size:0.85em;">
                    ${ranking.map((p, i) => 
                        `<tr>
                            <td>${medals[i]} ${p.name}</td>
                            <td style="text-align:right">${
                                metric === 'sla' ? p.slaRate + '%' :
                                metric === 'resolution_rate' ? p.resolutionRate + '%' :
                                metric === 'volume' ? p.total :
                                p.resolved
                            }</td>
                        </tr>`
                    ).join('')}
                </table>`;
        },

        // Handler: Soluções conhecidas
        handleKnownSolution(tickets, match, text) {
            const problem = match[3] || text;
            const solutions = this.findKnownSolution(problem);
            
            if (!solutions) {
                return `🔍 Não encontrei soluções conhecidas para "${problem}".
                    <br><br><span class="cb-detail">Problemas conhecidos: erro de login, lentidão, integração, relatório, timeout, etc.</span>`;
            }
            
            return `💡 <strong>Soluções Encontradas</strong>
                <br><br><ul class="cb-list">${solutions.map(s => 
                    `<li><strong>${s.problem}:</strong><br>${s.solution}</li>`
                ).join('')}</ul>`;
        },

        // Handler: Status rápido
        handleQuickStatus(tickets) {
            const stats = this.getQuickStats(tickets);
            const anomalies = this.detectAnomalies(tickets);
            
            let html = `📊 <strong>Status Rápido</strong>
                <br><br><table style="width:100%;font-size:0.9em;">
                    <tr><td>📥 Total</td><td style="text-align:right"><strong>${stats.total}</strong></td></tr>
                    <tr><td>📆 Hoje</td><td style="text-align:right"><strong>${stats.today}</strong></td></tr>
                    <tr><td>📂 Abertos</td><td style="text-align:right;color:#3b82f6"><strong>${stats.open}</strong></td></tr>
                    <tr><td>✅ Resolvidos</td><td style="text-align:right;color:#10b981"><strong>${stats.resolved}</strong> (${stats.resolutionRate}%)</td></tr>
                    <tr><td>🚨 Urgentes</td><td style="text-align:right;color:#ef4444"><strong>${stats.urgentOpen}</strong></td></tr>
                    <tr><td>⏱️ SLA</td><td style="text-align:right"><strong>${stats.slaRate}%</strong></td></tr>
                    <tr><td>⏱️ Tempo 1ª resp</td><td style="text-align:right"><strong>${stats.avgResponseTime}h</strong></td></tr>
                </table>`;
            
            if (anomalies.hasAnomalies) {
                html += `<br><br>⚠️ <strong>${anomalies.count} alerta(s)</strong> - ${anomalies.critical} crítico(s)`;
            }
            
            return html;
        },

        clearChat() {
            const container = document.getElementById('cbMessages');
            container.innerHTML = `
                <div class="cb-welcome">
                    <div class="cb-welcome-icon">👋</div>
                    <div class="cb-welcome-title">Olá! Sou seu assistente de dados.</div>
                    <div class="cb-welcome-text">Pergunte qualquer coisa sobre os tickets!</div>
                    <div class="cb-suggestions">
                        <button onclick="Chatbot.askSuggestion('Status rápido')">📊 Status</button>
                        <button onclick="Chatbot.askSuggestion('Alertas')">🚨 Alertas</button>
                        <button onclick="Chatbot.askSuggestion('Previsão')">🔮 Previsão</button>
                        <button onclick="Chatbot.askSuggestion('Ranking')">🏆 Ranking</button>
                    </div>
                </div>
            `;
            this.messages = [];
            this.saveHistory();
        },

        // ============= HANDLERS MEMÓRIA DE DECISÕES =============

        // Handler: Salvar nota/decisão
        handleSaveDecision(tickets, match, text) {
            // Extrair o texto da nota após o comando
            let noteText = text.replace(/^(anot(ar|e)|salv(ar|e)\s+nota|registr(ar|e)\s+decis[ãa]o|lembr(ar|e)|guardar)\s*:?\s*/i, '').trim();
            
            if (!noteText || noteText.length < 5) {
                return `📝 <strong>Para salvar uma nota, use:</strong>
                    <br><br>"Anotar: Escalamos ticket #123 porque cliente VIP estava reclamando"
                    <br>"Lembrar: Prioridade definida pelo João para release de quinta"
                    <br><br>💡 A nota será salva com data/hora e tags automáticas.`;
            }
            
            const decision = this.decisions.save(noteText);
            
            // Tentar salvar no Supabase também (se disponível)
            this.supabase.saveDecision(decision);
            
            return `✅ <strong>Nota salva!</strong>
                <br><br>📝 "${noteText}"
                <br><br>📅 ${decision.dateFormatted}
                <br>🏷️ Tags: ${decision.tags.length > 0 ? decision.tags.join(', ') : 'nenhuma'}
                <br><br><span class="cb-detail">💾 Salvo localmente. Use "ver notas" para listar.</span>`;
        },

        // Handler: Listar decisões
        handleListDecisions(tickets, match, text) {
            const decisions = this.decisions.load();
            
            if (decisions.length === 0) {
                return `📝 <strong>Nenhuma nota salva ainda</strong>
                    <br><br>Use "Anotar: [texto]" para salvar decisões.
                    <br><br>Exemplos:
                    <ul class="cb-list">
                        <li>"Anotar: Escalamos para gestor por atraso crítico"</li>
                        <li>"Lembrar: Cliente pediu priorização"</li>
                    </ul>`;
            }
            
            const recent = decisions.slice(0, 8);
            
            return `📋 <strong>Últimas ${recent.length} Notas/Decisões</strong>
                <br><br><ul class="cb-list">${recent.map(d => 
                    `<li><strong>${d.dateFormatted}</strong><br>${d.text}<br><span class="cb-detail">🏷️ ${d.tags.join(', ') || 'sem tags'}</span></li>`
                ).join('')}</ul>
                <br><span class="cb-detail">Total: ${decisions.length} notas salvas</span>`;
        },

        // Handler: Buscar decisões
        handleSearchDecisions(tickets, match, text) {
            // Extrair termo de busca
            const searchTerms = ['escalamos', 'priorizamos', 'decidimos', 'resolvemos'];
            let query = '';
            for (const term of searchTerms) {
                if (text.toLowerCase().includes(term)) {
                    query = term.replace('mos', '');
                    break;
                }
            }
            
            const results = this.decisions.search(query);
            
            if (results.length === 0) {
                return `🔍 Nenhuma nota encontrada sobre "${query}"
                    <br><br>💡 Use "ver notas" para listar todas.`;
            }
            
            return `🔍 <strong>Notas sobre "${query}"</strong>
                <br><br><ul class="cb-list">${results.map(d => 
                    `<li><strong>${d.dateFormatted}</strong><br>${d.text}</li>`
                ).join('')}</ul>`;
        },

        // ============= HANDLERS NAVEGAÇÃO/BI =============

        // Handler: Navegar para view
        handleNavigate(tickets, match, text) {
            const viewMap = {
                'dashboard': 'Dashboard',
                'tickets': 'Tickets',
                'bi': 'BI Analytics',
                'analytics': 'BI Analytics',
                'charts': 'BI Charts',
                'insights': 'Insights',
                'relatorio': 'Relatório',
                'relatório': 'Relatório'
            };
            
            // Encontrar qual view
            let targetView = null;
            for (const [key, name] of Object.entries(viewMap)) {
                if (text.toLowerCase().includes(key)) {
                    targetView = { key, name };
                    break;
                }
            }
            
            if (!targetView) {
                return `🧭 <strong>Navegação disponível:</strong>
                    <ul class="cb-list">
                        <li>"Ir para Dashboard"</li>
                        <li>"Abrir Tickets"</li>
                        <li>"Ver BI Analytics"</li>
                        <li>"Mostrar Insights"</li>
                    </ul>`;
            }
            
            // Tentar navegar
            const success = this.biAnalytics.goToView(targetView.key);
            
            if (success) {
                return `✅ Navegando para <strong>${targetView.name}</strong>...`;
            }
            
            return `⚠️ Não consegui navegar para ${targetView.name}. Tente clicar no menu.`;
        },

        // Handler: Atualizar dados
        async handleRefreshData(tickets, match, text) {
            this.addMessage('🔄 Atualizando dados do Supabase...', 'bot');
            
            try {
                // Tentar recarregar dados
                if (window.loadTicketsFromSupabase) {
                    await window.loadTicketsFromSupabase();
                    return `✅ <strong>Dados atualizados!</strong>
                        <br><br>📊 ${(window.allTicketsCache || []).length} tickets carregados do Supabase.`;
                }
                
                // Fallback: usar integração direta
                const result = await this.supabase.getTickets({ limit: 1000 });
                if (result.data) {
                    window.allTicketsCache = result.data;
                    return `✅ <strong>Dados atualizados!</strong>
                        <br><br>📊 ${result.data.length} tickets carregados.`;
                }
                
                return `⚠️ Não foi possível atualizar. Verifique a conexão com Supabase.`;
            } catch (error) {
                return `❌ Erro ao atualizar: ${error.message}`;
            }
        },

        // Handler: Query Supabase customizada
        async handleSupabaseQuery(tickets, match, text) {
            const lower = text.toLowerCase();
            let filters = { limit: 20 };
            let description = '';
            
            // Detectar filtros
            if (lower.includes('urgent')) {
                filters.priority = 4;
                description = 'urgentes';
            } else if (lower.includes('abert')) {
                filters.status = 2;
                description = 'abertos';
            } else if (lower.includes('fechad')) {
                filters.status = 5;
                description = 'fechados';
            }
            
            this.addMessage(`🔍 Buscando tickets ${description}...`, 'bot');
            
            try {
                const result = await this.supabase.getTickets(filters);
                
                if (!result.data || result.data.length === 0) {
                    return `📭 Nenhum ticket ${description} encontrado.`;
                }
                
                return `📊 <strong>${result.data.length} Tickets ${description}</strong>
                    <br><br><ul class="cb-list">${result.data.slice(0, 10).map(t => 
                        `<li><a href="${this.getTicketLink(t.id)}" target="_blank" style="color:#3b82f6">#${t.id}</a> - ${(t.subject || 'Sem assunto').slice(0, 40)}... ${t.priority == 4 ? '🔴' : ''}</li>`
                    ).join('')}</ul>
                    ${result.data.length > 10 ? `<br><span class="cb-detail">... e mais ${result.data.length - 10} tickets</span>` : ''}`;
            } catch (error) {
                return `❌ Erro na consulta: ${error.message}`;
            }
        },

        loadHistory() {
            try {
                const saved = localStorage.getItem('chatbotHistory');
                this.messages = saved ? JSON.parse(saved) : [];
                
                // Carregar últimas mensagens
                if (this.messages.length > 0) {
                    const welcome = document.querySelector('.cb-welcome');
                    if (welcome) welcome.remove();
                    
                    // Mostrar apenas últimas 20 mensagens
                    this.messages.slice(-20).forEach(msg => {
                        const container = document.getElementById('cbMessages');
                        const el = document.createElement('div');
                        el.className = `cb-message ${msg.type}`;
                        el.innerHTML = msg.content;
                        container.appendChild(el);
                    });
                }
            } catch (e) {
                this.messages = [];
            }
        },

        saveHistory() {
            try {
                // Manter apenas últimas 50 mensagens
                const toSave = this.messages.slice(-50);
                localStorage.setItem('chatbotHistory', JSON.stringify(toSave));
            } catch (e) {}
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Expor globalmente
    window.Chatbot = Chatbot;

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Chatbot.init());
    } else {
        Chatbot.init();
    }
})();
