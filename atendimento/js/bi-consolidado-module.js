/**
 * BI Consolidado Module - TOTAL Combinado de Tratativa + Acompanhamento
 * 
 * Este módulo SOMA os dados de duas fontes para cada pessoa:
 * 1. cf_tratativa - Tickets onde a pessoa trabalhou/resolveu
 * 2. tags / cf_acompanhamento_atendimento - Tickets onde a pessoa acompanhou
 * 
 * IMPORTANTE: Mostra o TOTAL de produtividade combinando ambas as métricas
 * Tickets que aparecem em ambas as fontes para a mesma pessoa são contados UMA vez
 */

window.BIConsolidadoModule = {
    // Cores do tema
    getColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'tryvia-cyan') {
            return {
                primary: '#00e4ff',
                accent: '#0099cc',
                success: '#059669',
                warning: '#d97706',
                danger: '#dc2626',
                text: '#1e293b',
                textMuted: '#64748b',
                surface: '#ffffff',
                background: '#f5f7fa',
                border: '#e2e8f0',
                cardBg: '#ffffff'
            };
        }
        return {
            primary: '#10b981',
            accent: '#06b6d4',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            text: '#e2e8f0',
            textMuted: '#94a3b8',
            surface: '#1e293b',
            background: '#0f172a',
            border: '#334155',
            cardBg: '#1e293b'
        };
    },

    get colors() {
        return this.getColors();
    },

    // Lista de pessoas válidas do time
    allowedPeople: [
        'Adriana Florencio', 'Adriana',
        'Alianie Lanes', 'Alianie',
        'Andreia Ribeiro', 'Andreia', 'Andréia',
        'Francisco Nascimento', 'Francisco',
        'Gabriel Oliveira', 'Gabriel CS', 'Gabriel',
        'Gustavo Martins', 'Gustavo',
        'João Peres', 'Joao Peres',
        'Jéssica Dias', 'Jéssica', 'Jessica',
        'Marciele Quintanilha', 'Marciele'
    ],

    // Mapeamento para normalização de nomes
    nameMapping: {
        'adriana': 'Adriana Florencio',
        'adriana florencio': 'Adriana Florencio',
        'alianie': 'Alianie Lanes',
        'alianie lanes': 'Alianie Lanes',
        'andreia': 'Andreia Ribeiro',
        'andréia': 'Andreia Ribeiro',
        'andreia ribeiro': 'Andreia Ribeiro',
        'andréia ribeiro': 'Andreia Ribeiro',
        'francisco': 'Francisco Nascimento',
        'francisco nascimento': 'Francisco Nascimento',
        'gabriel cs': 'Gabriel CS',
        'gabriel oliveira': 'Gabriel CS',
        'gabriel': 'Gabriel CS',
        'gustavo': 'Gustavo Martins',
        'gustavo martins': 'Gustavo Martins',
        'gustavo queblas': 'Gustavo Martins',
        'joão peres': 'João Peres',
        'joao peres': 'João Peres',
        'jéssica': 'Jéssica Dias',
        'jessica': 'Jéssica Dias',
        'jéssica dias': 'Jéssica Dias',
        'jessica dias': 'Jéssica Dias',
        'marciele': 'Marciele Quintanilha',
        'marciele quintanilha': 'Marciele Quintanilha'
    },

    // Filtros
    periodFilter: '30',
    customDateRange: { start: null, end: null },

    /**
     * Remove acentos para comparação
     */
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * Normaliza nome da pessoa
     */
    getNormalizedPersonName(name) {
        if (!name) return null;
        const nameLower = name.toLowerCase().trim();
        const normalized = this.removeAccents(nameLower);
        
        // Busca direta no mapeamento (com acento)
        if (this.nameMapping[nameLower]) {
            return this.nameMapping[nameLower];
        }
        
        // Busca no mapeamento (sem acento)
        if (this.nameMapping[normalized]) {
            return this.nameMapping[normalized];
        }
        
        // Busca parcial
        for (const [key, value] of Object.entries(this.nameMapping)) {
            const keyNormalized = this.removeAccents(key);
            if (normalized.includes(keyNormalized) || keyNormalized.includes(normalized)) {
                return value;
            }
        }
        
        return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    },

    /**
     * Verifica se é pessoa válida do time
     */
    isAllowedPerson(name) {
        if (!name) return false;
        const normalized = this.removeAccents(name.toLowerCase().trim());
        return this.allowedPeople.some(person => {
            const normalizedPerson = this.removeAccents(person.toLowerCase().trim());
            return normalized.includes(normalizedPerson) || normalizedPerson.includes(normalized);
        });
    },

    /**
     * Extrai tags como array
     */
    getTagsArray(ticket) {
        if (!ticket.tags) return [];
        let tags = ticket.tags;
        
        if (Array.isArray(tags)) {
            return tags.map(t => String(t).trim()).filter(t => t);
        }
        
        if (typeof tags === 'string') {
            tags = tags.trim();
            if ((tags.startsWith('[') && tags.endsWith(']')) || 
                (tags.startsWith('{') && tags.endsWith('}'))) {
                try {
                    const parsed = JSON.parse(tags);
                    if (Array.isArray(parsed)) {
                        return parsed.map(t => String(t).trim()).filter(t => t);
                    }
                } catch (e) {
                    let cleaned = tags.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '');
                    return cleaned.split(',').map(t => t.replace(/^"|"$/g, '').trim()).filter(t => t);
                }
            }
            return tags.split(/[,;\/]/).map(t => t.trim()).filter(t => t);
        }
        
        return [];
    },

    /**
     * Obtém pessoa responsável pela TRATATIVA (cf_tratativa)
     */
    getTratativaPessoa(ticket) {
        const tratativa = ticket.cf_tratativa || ticket.cf_tratativa1684353202918;
        if (tratativa && tratativa.trim()) {
            const pessoas = tratativa.split(/[,;\/]/).map(p => p.trim()).filter(p => p);
            return pessoas[0] || null; // Retorna primeira pessoa
        }
        return null;
    },

    /**
     * Obtém pessoa responsável pelo ACOMPANHAMENTO (cf_acompanhamento_atendimento ou tags)
     */
    getAcompanhamentoPessoa(ticket) {
        // Prioridade: cf_acompanhamento_atendimento
        const cfAcomp = ticket.cf_acompanhamento_atendimento;
        if (cfAcomp && cfAcomp.trim()) {
            const normalized = this.getNormalizedPersonName(cfAcomp.trim());
            if (this.isAllowedPerson(cfAcomp)) {
                return normalized;
            }
            return cfAcomp.trim();
        }
        
        // Fallback: tags
        const tags = this.getTagsArray(ticket);
        for (const tag of tags) {
            if (this.isAllowedPerson(tag)) {
                return this.getNormalizedPersonName(tag);
            }
        }
        
        return null;
    },

    /**
     * Obtém TODAS as pessoas associadas ao ticket (Tratativa + Acompanhamento)
     * Retorna array de pessoas únicas normalizadas
     */
    getAllPessoasFromTicket(ticket) {
        const pessoas = new Set();
        
        // Pessoa da Tratativa
        const tratativaPessoa = this.getTratativaPessoa(ticket);
        if (tratativaPessoa) {
            const normalized = this.getNormalizedPersonName(tratativaPessoa);
            if (this.isAllowedPerson(normalized)) {
                pessoas.add(normalized);
            }
        }
        
        // Pessoa do Acompanhamento
        const acompPessoa = this.getAcompanhamentoPessoa(ticket);
        if (acompPessoa) {
            const normalized = this.getNormalizedPersonName(acompPessoa);
            if (this.isAllowedPerson(normalized)) {
                pessoas.add(normalized);
            }
        }
        
        return Array.from(pessoas);
    },

    /**
     * Verifica se ticket está resolvido
     */
    isTicketResolved(ticket) {
        const status = Number(ticket.status);
        return status === 4 || status === 5;
    },

    /**
     * Filtra tickets por período
     */
    filterByPeriod(tickets, period) {
        if (period === 'all') return tickets;
        
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
     * Calcula estatísticas CONSOLIDADAS - SOMA de Tratativa + Acompanhamento
     * Para cada pessoa, soma todos os tickets onde ela aparece em qualquer fonte
     * Tickets duplicados (mesma pessoa em ambas fontes) são contados UMA vez
     */
    calculateConsolidatedStats(tickets) {
        const filteredTickets = this.filterByPeriod(tickets, this.periodFilter);
        
        console.log(`📊 BI Consolidado TOTAL: ${filteredTickets.length} tickets no período ${this.periodFilter}`);
        
        // Mapa: pessoa -> { ticketIds: Set, stats }
        const statsMap = new Map();
        
        // Contadores globais
        let totalComTratativa = 0;
        let totalComAcompanhamento = 0;
        let totalComAmbos = 0;
        let totalSemNenhum = 0;
        let totalTicketsUnicos = 0;
        
        // Processar cada ticket
        filteredTickets.forEach(ticket => {
            const tratativaPessoa = this.getTratativaPessoa(ticket);
            const acompPessoa = this.getAcompanhamentoPessoa(ticket);
            
            const temTratativa = !!tratativaPessoa && this.isAllowedPerson(tratativaPessoa);
            const temAcompanhamento = !!acompPessoa && this.isAllowedPerson(acompPessoa);
            
            // Contadores de fontes
            if (temTratativa) totalComTratativa++;
            if (temAcompanhamento) totalComAcompanhamento++;
            if (temTratativa && temAcompanhamento) totalComAmbos++;
            if (!temTratativa && !temAcompanhamento) totalSemNenhum++;
            
            // Obter todas as pessoas associadas a este ticket
            const pessoas = this.getAllPessoasFromTicket(ticket);
            
            // Para cada pessoa, adicionar o ticket às suas estatísticas
            pessoas.forEach(pessoa => {
                if (!statsMap.has(pessoa)) {
                    statsMap.set(pessoa, {
                        person: pessoa,
                        ticketIds: new Set(),
                        tickets: [], // Lista completa de tickets para exibição
                        total: 0,
                        resolved: 0,
                        open: 0,
                        pending: 0,
                        fromTratativa: 0,
                        fromAcompanhamento: 0,
                        fromBoth: 0
                    });
                }
                
                const stats = statsMap.get(pessoa);
                
                // Evitar duplicação: só conta se ainda não processou este ticket para esta pessoa
                if (!stats.ticketIds.has(ticket.id)) {
                    stats.ticketIds.add(ticket.id);
                    stats.total++;
                    
                    // Armazenar dados do ticket para exibição
                    stats.tickets.push({
                        id: ticket.id,
                        subject: ticket.subject || `Ticket #${ticket.id}`,
                        status: ticket.status,
                        created_at: ticket.created_at,
                        company_name: ticket.company_name || '--'
                    });
                    
                    if (this.isTicketResolved(ticket)) {
                        stats.resolved++;
                    } else if (ticket.status === 3) {
                        stats.pending++;
                    } else {
                        stats.open++;
                    }
                    
                    // Rastrear fonte do ticket para esta pessoa
                    // Verificar se a pessoa aparece em cada fonte (com normalização e validação)
                    const pessoaTratativa = (tratativaPessoa && this.isAllowedPerson(tratativaPessoa)) 
                        ? this.getNormalizedPersonName(tratativaPessoa) : null;
                    const pessoaAcomp = (acompPessoa && this.isAllowedPerson(acompPessoa)) 
                        ? this.getNormalizedPersonName(acompPessoa) : null;
                    
                    const estaEmTratativa = pessoaTratativa === pessoa;
                    const estaEmAcomp = pessoaAcomp === pessoa;
                    
                    if (estaEmTratativa && estaEmAcomp) {
                        stats.fromBoth++;
                    } else if (estaEmTratativa) {
                        stats.fromTratativa++;
                    } else if (estaEmAcomp) {
                        stats.fromAcompanhamento++;
                    }
                }
            });
            
            if (pessoas.length > 0) totalTicketsUnicos++;
        });
        
        // Converter para array e calcular métricas
        const results = Array.from(statsMap.values()).map(stats => {
            const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total * 100) : 0;
            
            return {
                person: stats.person,
                total: stats.total,
                resolved: stats.resolved,
                open: stats.open,
                pending: stats.pending,
                fromTratativa: stats.fromTratativa,
                fromAcompanhamento: stats.fromAcompanhamento,
                fromBoth: stats.fromBoth,
                percentResolved: Math.round(resolutionRate),
                productivity: stats.total,
                tickets: stats.tickets // Incluir lista de tickets
            };
        });
        
        // Ordenar por total decrescente
        results.sort((a, b) => b.total - a.total);
        
        // Calcular totais consolidados
        const totalResolved = results.reduce((sum, r) => sum + r.resolved, 0);
        const totalOpen = results.reduce((sum, r) => sum + r.open, 0);
        const totalPending = results.reduce((sum, r) => sum + r.pending, 0);
        const totalAtribuido = results.reduce((sum, r) => sum + r.total, 0);
        
        const totals = {
            totalTickets: filteredTickets.length,
            totalAtribuido: totalAtribuido,
            totalResolved: totalResolved,
            totalOpen: totalOpen,
            totalPending: totalPending,
            totalPeople: results.length,
            avgPerPerson: results.length > 0 ? (totalAtribuido / results.length).toFixed(1) : 0,
            resolutionRate: totalAtribuido > 0 ? Math.round((totalResolved / totalAtribuido) * 100) : 0,
            productivityPerDay: results.length > 0 ? (totalAtribuido / (parseInt(this.periodFilter) || 30) / results.length).toFixed(2) : 0,
            // Análise de fontes
            fontes: {
                apenasTratatia: totalComTratativa - totalComAmbos,
                apenasAcompanhamento: totalComAcompanhamento - totalComAmbos,
                ambos: totalComAmbos,
                semNenhum: totalSemNenhum
            },
            topPerformer: results[0] || null
        };
        
        return {
            results,
            totals
        };
    },

    /**
     * Renderiza o conteúdo da aba Consolidado
     */
    render(containerId = 'biConsolidadoContent') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const tickets = window.allTicketsCache || [];
        const stats = this.calculateConsolidatedStats(tickets);
        const colors = this.colors;
        
        // Salvar resultados para acesso ao clicar nas linhas
        this.lastResults = stats.results;
        
        // Formatar datas do período
        let periodLabel = 'Todo o período';
        if (this.periodFilter !== 'all') {
            if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
                const startDate = new Date(this.customDateRange.start);
                const endDate = new Date(this.customDateRange.end);
                periodLabel = `${startDate.toLocaleDateString('pt-BR')} — ${endDate.toLocaleDateString('pt-BR')}`;
            } else {
                const days = parseInt(this.periodFilter);
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                periodLabel = `${startDate.toLocaleDateString('pt-BR')} — ${endDate.toLocaleDateString('pt-BR')}`;
            }
        }
        
        container.innerHTML = `
            <!-- Header da aba -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: ${colors.text}; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.primary}" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        BI Consolidado — TOTAL (Tratativa + Acompanhamento)
                    </h2>
                    <p style="margin: 0; font-size: 0.85rem; color: ${colors.textMuted};">
                        Soma completa das métricas de <strong style="color: #3b82f6;">Tratativa</strong> e <strong style="color: #8b5cf6;">Acompanhamento</strong> — visão total de produtividade
                    </p>
                </div>
                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                    <select id="consolidadoPeriod" onchange="BIConsolidadoModule.setPeriod(this.value)" style="
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        border: 1px solid ${colors.border};
                        background: ${colors.surface};
                        color: ${colors.text};
                        font-size: 0.85rem;
                        cursor: pointer;
                    ">
                        <option value="7" ${this.periodFilter === '7' ? 'selected' : ''}>Últimos 7 dias</option>
                        <option value="30" ${this.periodFilter === '30' ? 'selected' : ''}>Últimos 30 dias</option>
                        <option value="90" ${this.periodFilter === '90' ? 'selected' : ''}>Últimos 90 dias</option>
                        <option value="180" ${this.periodFilter === '180' ? 'selected' : ''}>Últimos 180 dias</option>
                        <option value="365" ${this.periodFilter === '365' ? 'selected' : ''}>Últimos 365 dias</option>
                        <option value="all" ${this.periodFilter === 'all' ? 'selected' : ''}>Todo período</option>
                    </select>
                    <span style="padding: 0.5rem 1rem; background: ${colors.success}22; color: ${colors.success}; border-radius: 8px; font-size: 0.8rem; font-weight: 500;">
                        ${periodLabel}
                    </span>
                </div>
            </div>
            
            <!-- Cards de métricas principais -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                ${this.renderKPICard('TOTAL ATRIBUÍDO', stats.totals.totalAtribuido, colors.primary, 'soma de tratativa + acompanhamento')}
                ${this.renderKPICard('TICKETS RESOLVIDOS', stats.totals.totalResolved, colors.success, 'total combinado')}
                ${this.renderKPICard('ABERTOS + PENDENTES', stats.totals.totalOpen + stats.totals.totalPending, colors.warning, `${stats.totals.totalOpen} abertos, ${stats.totals.totalPending} pendentes`)}
                ${this.renderKPICard('TAXA DE RESOLUÇÃO', stats.totals.resolutionRate + '%', colors.success, 'produtividade geral')}
            </div>
            
            <!-- Cards de produtividade -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                ${this.renderWideCard('PRODUTIVIDADE/DIA/PESSOA', stats.totals.productivityPerDay, colors.accent, ' tickets', 'média diária por colaborador')}
                ${this.renderWideCard('MÉDIA POR PESSOA', stats.totals.avgPerPerson, colors.primary, ' tickets', 'no período selecionado')}
            </div>
            
            <!-- Cards de métricas adicionais -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                ${this.renderSmallCard('COLABORADORES', stats.totals.totalPeople, colors.primary)}
                ${this.renderSmallCard('TICKETS BASE', stats.totals.totalTickets, colors.textMuted, ' no período')}
                ${this.renderSmallCard('EM ABERTO (%)', 
                    stats.totals.totalAtribuido > 0 ? Math.round((stats.totals.totalOpen + stats.totals.totalPending) / stats.totals.totalAtribuido * 100) + '%' : '0%', 
                    colors.warning)}
            </div>
            
            <!-- Análise de Fontes -->
            <div style="background: ${colors.surface}; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid ${colors.border};">
                <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: ${colors.text}; display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.accent}" stroke-width="2">
                        <path d="M12 20V10"/>
                        <path d="M18 20V4"/>
                        <path d="M6 20v-4"/>
                    </svg>
                    Análise de Cruzamento de Dados
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: ${colors.primary}11; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${colors.primary};">${stats.totals.fontes.apenasTratatia}</div>
                        <div style="font-size: 0.8rem; color: ${colors.textMuted};">Apenas Tratativa</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: ${colors.accent}11; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${colors.accent};">${stats.totals.fontes.apenasAcompanhamento}</div>
                        <div style="font-size: 0.8rem; color: ${colors.textMuted};">Apenas Acompanhamento</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: ${colors.success}11; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${colors.success};">${stats.totals.fontes.ambos}</div>
                        <div style="font-size: 0.8rem; color: ${colors.textMuted};">Ambas as Fontes</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: ${colors.textMuted}11; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${colors.textMuted};">${stats.totals.fontes.semNenhum}</div>
                        <div style="font-size: 0.8rem; color: ${colors.textMuted};">Sem Responsável</div>
                    </div>
                </div>
            </div>
            
            <!-- Top Performer e Métricas -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                ${this.renderTopPerformerCard(stats.totals.topPerformer, colors)}
                ${this.renderSmallCard('DIAS ANALISADOS', this.periodFilter === 'all' ? '∞' : this.periodFilter, colors.textMuted)}
            </div>
            
            <!-- Tabela de ranking -->
            <div style="background: ${colors.surface}; border-radius: 12px; padding: 1.25rem; border: 1px solid ${colors.border};">
                <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: ${colors.text}; display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.success}" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Ranking Consolidado por Pessoa
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid ${colors.border};">
                                <th style="text-align: left; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">#</th>
                                <th style="text-align: left; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">PESSOA</th>
                                <th style="text-align: center; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">TOTAL</th>
                                <th style="text-align: center; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">ABERTOS</th>
                                <th style="text-align: center; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">RESOLVIDOS</th>
                                <th style="text-align: center; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">TAXA</th>
                                <th style="text-align: center; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">FONTE</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.results.map((person, idx) => `
                                <tr style="border-bottom: 1px solid ${colors.border}22; cursor: pointer; transition: background 0.15s;"
                                    onclick="BIConsolidadoModule.showTicketsModal(${idx})"
                                    onmouseover="this.style.background='${colors.primary}11'"
                                    onmouseout="this.style.background='transparent'"
                                    title="Clique para ver os ${person.total} tickets">
                                    <td style="padding: 0.75rem 0.5rem; color: ${idx < 3 ? colors.warning : colors.textMuted}; font-weight: ${idx < 3 ? '700' : '400'};">
                                        ${idx < 3 ? ['🥇', '🥈', '🥉'][idx] : (idx + 1) + 'º'}
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.text}; font-weight: 500;">
                                        ${person.person}
                                        <span style="margin-left: 0.5rem; font-size: 0.7rem; color: ${colors.textMuted};">🔍</span>
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.primary}; text-align: center; font-weight: 600;">
                                        ${person.total}
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.warning}; text-align: center;">
                                        ${person.open + person.pending}
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.success}; text-align: center;">
                                        ${person.resolved}
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; text-align: center;">
                                        <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;
                                            background: ${person.percentResolved >= 70 ? colors.success : person.percentResolved >= 40 ? colors.warning : colors.danger}22;
                                            color: ${person.percentResolved >= 70 ? colors.success : person.percentResolved >= 40 ? colors.warning : colors.danger};">
                                            ${person.percentResolved}%
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; text-align: center; font-size: 0.75rem; color: ${colors.textMuted};">
                                        <span title="Tratativa: ${person.fromTratativa} | Acomp: ${person.fromAcompanhamento} | Ambos: ${person.fromBoth}">
                                            T:${person.fromTratativa} A:${person.fromAcompanhamento}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza card KPI principal
     */
    renderKPICard(title, value, color, subtitle = '') {
        const colors = this.colors;
        return `
            <div style="background: ${colors.surface}; border-radius: 12px; padding: 1.25rem; border: 1px solid ${colors.border}; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${color};"></div>
                <div style="font-size: 0.7rem; color: ${colors.textMuted}; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">${title}</div>
                <div style="font-size: 2rem; font-weight: 700; color: ${color};">${value}</div>
                ${subtitle ? `<div style="font-size: 0.7rem; color: ${colors.textMuted}; margin-top: 0.25rem;">${subtitle}</div>` : ''}
            </div>
        `;
    },

    /**
     * Renderiza card largo
     */
    renderWideCard(title, value, color, suffix = '', subtitle = '') {
        const colors = this.colors;
        return `
            <div style="background: ${color}11; border-radius: 12px; padding: 1.25rem; border: 1px solid ${color}33;">
                <div style="font-size: 0.7rem; color: ${color}; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">${title}</div>
                <div style="font-size: 2.5rem; font-weight: 700; color: ${color};">${value}${suffix ? `<span style="font-size: 1rem; opacity: 0.7;">${suffix}</span>` : ''}</div>
                ${subtitle ? `<div style="font-size: 0.7rem; color: ${colors.textMuted}; margin-top: 0.25rem;">${subtitle}</div>` : ''}
            </div>
        `;
    },

    /**
     * Renderiza card pequeno
     */
    renderSmallCard(title, value, color, suffix = '') {
        const colors = this.colors;
        return `
            <div style="background: ${colors.surface}; border-radius: 10px; padding: 1rem; border: 1px solid ${colors.border}; text-align: center;">
                <div style="font-size: 0.65rem; color: ${colors.textMuted}; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.3px;">${title}</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${color};">${value}<span style="font-size: 0.75rem; opacity: 0.7;">${suffix}</span></div>
            </div>
        `;
    },

    /**
     * Renderiza card do Top Performer
     */
    renderTopPerformerCard(topPerformer, colors) {
        if (!topPerformer) {
            return this.renderSmallCard('TOP PERFORMER', '--', colors.success);
        }
        return `
            <div style="background: linear-gradient(135deg, ${colors.success}22, ${colors.success}11); border-radius: 10px; padding: 1rem; border: 1px solid ${colors.success}44; text-align: center;">
                <div style="font-size: 0.65rem; color: ${colors.success}; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.3px;">TOP PERFORMER ⭐</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: ${colors.success};">${topPerformer.person.split(' ')[0]}</div>
                <div style="font-size: 0.7rem; color: ${colors.textMuted};">${topPerformer.total} tickets</div>
            </div>
        `;
    },

    /**
     * Define período
     */
    setPeriod(period) {
        this.periodFilter = period;
        this.render();
    },

    // Cache dos resultados para acesso ao clicar
    lastResults: [],

    /**
     * Obter label do status
     */
    getStatusLabel(status) {
        const statusMap = {
            2: 'Aberto',
            3: 'Pendente',
            4: 'Resolvido',
            5: 'Fechado',
            6: 'Em Homologação',
            7: 'Aguardando Cliente',
            8: 'Em Tratativa'
        };
        return statusMap[status] || `Status ${status}`;
    },

    /**
     * Obter cor do status
     */
    getStatusColor(status) {
        const colorMap = {
            2: '#3b82f6', // Aberto - azul
            3: '#f59e0b', // Pendente - amarelo
            4: '#10b981', // Resolvido - verde
            5: '#6b7280', // Fechado - cinza
            6: '#8b5cf6', // Em Homologação - roxo
            7: '#f59e0b', // Aguardando Cliente - laranja
            8: '#06b6d4'  // Em Tratativa - ciano
        };
        return colorMap[status] || '#64748b';
    },

    /**
     * Mostrar modal com tickets da pessoa
     */
    showTicketsModal(personIndex) {
        const person = this.lastResults[personIndex];
        if (!person) return;

        const colors = this.colors;
        const tickets = person.tickets || [];

        // Criar modal
        const modalId = 'consolidadoTicketsModal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: ${colors.surface}; border-radius: 16px; 
                max-width: 900px; width: 95%; max-height: 80vh;
                overflow: hidden; border: 1px solid ${colors.border};
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            ">
                <div style="
                    padding: 1.25rem 1.5rem; 
                    border-bottom: 1px solid ${colors.border};
                    display: flex; justify-content: space-between; align-items: center;
                ">
                    <div>
                        <h3 style="margin: 0; color: ${colors.text}; font-size: 1.1rem;">
                            📋 Tickets de ${person.person}
                        </h3>
                        <p style="margin: 0.25rem 0 0 0; color: ${colors.textMuted}; font-size: 0.8rem;">
                            ${tickets.length} tickets | ${person.resolved} resolvidos | ${person.open + person.pending} em aberto
                        </p>
                    </div>
                    <button onclick="document.getElementById('${modalId}').remove()" style="
                        background: transparent; border: none; color: ${colors.textMuted};
                        cursor: pointer; font-size: 1.5rem; line-height: 1;
                    ">&times;</button>
                </div>
                <div style="max-height: calc(80vh - 120px); overflow-y: auto; padding: 1rem;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid ${colors.border}; position: sticky; top: 0; background: ${colors.surface};">
                                <th style="text-align: left; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">ID</th>
                                <th style="text-align: left; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">ASSUNTO</th>
                                <th style="text-align: left; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">EMPRESA</th>
                                <th style="text-align: center; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">STATUS</th>
                                <th style="text-align: right; padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-weight: 500;">DATA</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tickets.map(ticket => `
                                <tr style="border-bottom: 1px solid ${colors.border}22; cursor: pointer;" 
                                    onclick="window.open('https://tryvia.freshdesk.com/a/tickets/${ticket.id}', '_blank')"
                                    onmouseover="this.style.background='${colors.primary}11'"
                                    onmouseout="this.style.background='transparent'">
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.primary}; font-weight: 500;">
                                        #${ticket.id}
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.text}; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        ${ticket.subject}
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.textMuted}; font-size: 0.8rem;">
                                        ${ticket.company_name}
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; text-align: center;">
                                        <span style="
                                            padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem;
                                            background: ${this.getStatusColor(ticket.status)}22;
                                            color: ${this.getStatusColor(ticket.status)};
                                        ">${this.getStatusLabel(ticket.status)}</span>
                                    </td>
                                    <td style="padding: 0.75rem 0.5rem; color: ${colors.textMuted}; text-align: right; font-size: 0.8rem;">
                                        ${new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

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
    },

    /**
     * Inicializa o módulo
     */
    init() {
        console.log('✅ BI Consolidado Module inicializado');
        this.render();
    }
};

// Auto-inicializar quando o container existir
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('biConsolidadoContent')) {
        window.BIConsolidadoModule.init();
    }
});
