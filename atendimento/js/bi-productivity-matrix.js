/**
 * BI Productivity Matrix - Matriz de Produtividade
 * Análise de Tickets tratados vs Atribuído Acumulado
 */

window.BIProductivityMatrix = {
    currentYear: new Date().getFullYear(),
    selectedTeam: 'all', // 'all' = Geral, ou nome do time
    matrixType: 'produtividade', // 'produtividade' ou 'sla'
    
    MATRIX_TYPES: [
        { value: 'produtividade', label: '📊 Produtividade' },
        { value: 'sla', label: '⏱️ SLA' },
        { value: 'resumo_atendimento', label: '👥 Resumo Atendimento' }
    ],
    
    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    
    // Cores do tema - adaptáveis ao tema atual
    getColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        const isCyan = theme === 'tryvia-cyan';
        
        return {
            // Backgrounds
            headerBg: isCyan ? '#0369a1' : '#0d4a6b',
            headerBgAlt: isCyan ? '#0c4a6e' : '#0a3d5c',
            rowEven: isCyan ? '#f8fafc' : '#0f172a',
            rowOdd: isCyan ? '#f1f5f9' : '#1e293b',
            subHeaderBg: isCyan ? '#e0f2fe' : '#1e3a5f',
            
            // Texts
            headerText: '#ffffff',
            rowText: isCyan ? '#1e293b' : '#e2e8f0',
            mutedText: isCyan ? '#64748b' : '#94a3b8',
            
            // Borders
            headerBorder: isCyan ? '#0284c7' : '#1e5f8a',
            cellBorder: isCyan ? '#cbd5e1' : '#334155',
            
            // Matrix cells
            cellBg: isCyan ? '#dbeafe' : '#1e3a5f',
            cellText: isCyan ? '#1d4ed8' : '#60a5fa',
            cellEmpty: isCyan ? '#f1f5f9' : '#1e293b',
            cellEmptyText: isCyan ? '#94a3b8' : '#475569',
            
            // Summary columns
            resolvedBg: isCyan ? '#dcfce7' : '#065f46',
            resolvedText: isCyan ? '#15803d' : '#10b981',
            herdadosBg: isCyan ? '#fee2e2' : '#7f1d1d',
            herdadosText: isCyan ? '#dc2626' : '#fca5a5',
            acumuladoBg: isCyan ? '#d1fae5' : '#064e3b',
            acumuladoText: isCyan ? '#059669' : '#6ee7b7',
            criadoBg: isCyan ? '#ede9fe' : '#5b21b6',
            criadoText: isCyan ? '#7c3aed' : '#c4b5fd',
            
            // Totals
            totalResolvedBg: isCyan ? '#0369a1' : '#0d4a6b',
            pendenteBg: isCyan ? '#fef2f2' : '#7f1d1d',
            pendenteBorder: isCyan ? '#fecaca' : '#991b1b',
            pendenteText: isCyan ? '#dc2626' : '#fca5a5',
            
            // % colors
            pctGreen: '#10b981',
            pctLime: '#84cc16',
            pctYellow: '#f59e0b',
            pctOrange: '#fb923c',
            pctRed: '#ef4444'
        };
    },
    
    get colors() {
        return this.getColors();
    },
    
    // Times válidos conhecidos
    VALID_TEAMS: ['Atendimento', 'Acompanhamento', 'DEV', 'Técnico', 'Produto', 'Implantação', 'Comercial', 'CS'],
    
    getTeamsFromTickets(tickets) {
        const teams = new Set();
        tickets.forEach(t => {
            const teamField = t.cf_grupo_tratativa || t.group_name;
            if (teamField) {
                teamField.split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(team => {
                    if (this.VALID_TEAMS.includes(team)) {
                        teams.add(team);
                    }
                });
            }
        });
        return Array.from(teams).sort();
    },
    
    filterTicketsByTeam(tickets, team) {
        if (team === 'all') return tickets;
        return tickets.filter(t => {
            const teamField = t.cf_grupo_tratativa || t.group_name || '';
            return teamField.split(/[,;\/]/).map(x => x.trim()).includes(team);
        });
    },
    
    getMonthKey(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    },
    
    getMonthLabel(date) {
        const d = new Date(date);
        return `${this.months[d.getMonth()]}. de ${d.getFullYear()}`;
    },
    
    calculateMatrix(tickets, year) {
        const matrix = {};
        const monthsInYear = [];
        const prevYear = year - 1;
        
        // Gerar meses do ano
        for (let m = 0; m < 12; m++) {
            monthsInYear.push(`${year}-${String(m + 1).padStart(2, '0')}`);
        }
        
        // Inicializar matriz - linhas são meses de tratativa (resolução)
        monthsInYear.forEach(treatMonth => {
            matrix[treatMonth] = {
                byCreationMonth: {},
                totalResolvedThisMonth: 0  // Total resolvido NESTE mês de tratativa
            };
            // Coluna do ano anterior
            matrix[treatMonth].byCreationMonth[`${prevYear}`] = 0;
            // Colunas de cada mês do ano
            monthsInYear.forEach(createMonth => {
                matrix[treatMonth].byCreationMonth[createMonth] = 0;
            });
        });
        
        // Contadores
        const createdByMonth = {};
        const resolvedByMonth = {};  // Total resolvido EM cada mês (linha)
        monthsInYear.forEach(m => { 
            createdByMonth[m] = 0; 
            resolvedByMonth[m] = 0;
        });
        createdByMonth[`${prevYear}`] = 0;
        
        // Herdados = tickets pendentes no INÍCIO de cada mês
        const herdadosByMonth = {};
        monthsInYear.forEach(m => { herdadosByMonth[m] = 0; });
        
        // Popular matriz e contadores
        tickets.forEach(t => {
            if (!t.created_at) return;
            
            const created = new Date(t.created_at);
            const createdYear = created.getFullYear();
            const createdMonth = this.getMonthKey(t.created_at);
            
            const isResolved = t.status === 4 || t.status === 5 || t.status === '4' || t.status === '5';
            const resolvedAt = t.stats_resolved_at || t.stats_closed_at;
            const resolvedMonth = resolvedAt ? this.getMonthKey(resolvedAt) : null;
            const resolvedYear = resolvedAt ? new Date(resolvedAt).getFullYear() : null;
            
            // Contar criados por mês
            if (createdYear === year) {
                createdByMonth[createdMonth] = (createdByMonth[createdMonth] || 0) + 1;
            } else if (createdYear < year) {
                createdByMonth[`${prevYear}`] = (createdByMonth[`${prevYear}`] || 0) + 1;
            }
            
            // Popular matriz: se resolvido no ano atual
            if (isResolved && resolvedAt && resolvedYear === year) {
                if (matrix[resolvedMonth]) {
                    // Determinar coluna de criação
                    let createCol;
                    if (createdYear === year) {
                        createCol = createdMonth;
                    } else if (createdYear < year) {
                        createCol = `${prevYear}`;
                    } else {
                        return; // Criado no futuro, ignorar
                    }
                    
                    if (matrix[resolvedMonth].byCreationMonth[createCol] !== undefined) {
                        matrix[resolvedMonth].byCreationMonth[createCol]++;
                        matrix[resolvedMonth].totalResolvedThisMonth++;
                        resolvedByMonth[resolvedMonth] = (resolvedByMonth[resolvedMonth] || 0) + 1;
                    }
                }
            }
            
            // Calcular herdados: tickets pendentes no INÍCIO de cada mês
            // Um ticket é "herdado" para um mês se foi criado ANTES desse mês e ainda não estava resolvido
            monthsInYear.forEach(refMonth => {
                const refDate = new Date(refMonth + '-01');
                const createdDate = new Date(t.created_at);
                
                // Ticket foi criado antes do início do mês de referência?
                if (createdDate < refDate) {
                    // Estava pendente no início do mês?
                    if (!isResolved) {
                        // Ainda não resolvido
                        herdadosByMonth[refMonth]++;
                    } else if (resolvedAt) {
                        const resolvedDate = new Date(resolvedAt);
                        // Foi resolvido depois do início do mês?
                        if (resolvedDate >= refDate) {
                            herdadosByMonth[refMonth]++;
                        }
                    }
                }
            });
        });
        
        // Calcular totais por coluna (mês de criação) - quantos foram resolvidos de cada mês de criação
        const totalResolvedByCreation = {};
        const totalPendingByCreation = {};
        const allCreationCols = [`${prevYear}`, ...monthsInYear];
        
        allCreationCols.forEach(cm => {
            totalResolvedByCreation[cm] = 0;
        });
        
        monthsInYear.forEach(tm => {
            allCreationCols.forEach(cm => {
                totalResolvedByCreation[cm] += matrix[tm].byCreationMonth[cm] || 0;
            });
        });
        
        allCreationCols.forEach(cm => {
            totalPendingByCreation[cm] = Math.max(0, (createdByMonth[cm] || 0) - (totalResolvedByCreation[cm] || 0));
        });
        
        // Calcular %Resolvido por mês = Resolvidos no mês / Criados no mês × 100
        // Se > 100% = limpou backlog (entregou mais do que recebeu)
        const productivityRate = {};
        monthsInYear.forEach(m => {
            const created = createdByMonth[m] || 0;
            const resolved = resolvedByMonth[m] || 0;
            productivityRate[m] = created > 0 ? ((resolved / created) * 100).toFixed(2) : '0.00';
        });
        
        // Ticket coluna = resolvidos dentro do mesmo mês de criação (diagonal)
        const resolvedInSameMonth = {};
        monthsInYear.forEach(m => {
            resolvedInSameMonth[m] = matrix[m]?.byCreationMonth[m] || 0;
        });
        
        // Herdados RESOLVIDOS no mês = total resolvido - diagonal (resolvidos de meses anteriores)
        const herdadosResolvidosByMonth = {};
        monthsInYear.forEach(m => {
            const totalResolved = resolvedByMonth[m] || 0;
            const diagonal = resolvedInSameMonth[m] || 0;
            herdadosResolvidosByMonth[m] = totalResolved - diagonal;
        });
        
        // Acumulado de tratativas
        let acumulado = 0;
        const acumuladoByMonth = {};
        monthsInYear.forEach(m => {
            acumulado += resolvedByMonth[m] || 0;
            acumuladoByMonth[m] = acumulado;
        });
        
        return {
            matrix,
            monthsInYear,
            prevYear,
            createdByMonth,
            resolvedByMonth,
            herdadosByMonth,
            herdadosResolvidosByMonth,
            totalResolvedByCreation,
            totalPendingByCreation,
            productivityRate,
            resolvedInSameMonth,
            acumuladoByMonth
        };
    },
    
    render(containerId = 'biProductivityMatrixContent') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const allTickets = window.allTicketsCache || [];
        if (!allTickets.length) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Nenhum dado disponível</div>';
            return;
        }
        
        // Obter lista de times disponíveis
        const availableTeams = this.getTeamsFromTickets(allTickets);
        
        // Filtrar tickets pelo time selecionado
        const tickets = this.filterTicketsByTeam(allTickets, this.selectedTeam);
        
        const data = this.calculateMatrix(tickets, this.currentYear);
        const { matrix, monthsInYear, prevYear, createdByMonth, resolvedByMonth, herdadosByMonth, herdadosResolvidosByMonth, totalResolvedByCreation, totalPendingByCreation, productivityRate, resolvedInSameMonth, acumuladoByMonth } = data;
        
        // Calcular totais gerais
        let totalCreatedYear = 0;
        let totalResolvedYear = 0;
        
        monthsInYear.forEach(m => {
            totalCreatedYear += createdByMonth[m] || 0;
            totalResolvedYear += resolvedByMonth[m] || 0;
        });
        
        const teamLabel = this.selectedTeam === 'all' ? 'Geral' : this.selectedTeam;
        const matrixTypeLabel = this.MATRIX_TYPES.find(t => t.value === this.matrixType)?.label || 'Matriz';
        
        // Gerar seletor de tipo de matriz
        const matrixTypeSelector = `
            <select id="matrixTypeSelector" onchange="BIProductivityMatrix.setMatrixType(this.value)" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;min-width:150px;">
                ${this.MATRIX_TYPES.map(t => `
                    <option value="${t.value}" ${this.matrixType === t.value ? 'selected' : ''}>${t.label}</option>
                `).join('')}
            </select>
        `;
        
        // Renderizar conteúdo baseado no tipo de matriz
        let tableContent = '';
        let summaryContent = '';
        let legendContent = '';
        
        if (this.matrixType === 'sla') {
            // Matriz SLA
            const slaData = this.calculateSLAMatrix(tickets, this.currentYear);
            tableContent = this.renderSLATable(slaData);
            
            // Calcular totais SLA
            let totalTickets = 0, totalViolated = 0, totalWithin = 0;
            Object.values(slaData.groups).forEach(g => {
                totalTickets += g.acumulado.total;
                totalViolated += g.acumulado.violated;
                totalWithin += g.acumulado.within;
            });
            const slaRate = totalTickets > 0 ? (totalWithin / totalTickets * 100) : 0;
            
            summaryContent = `
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">Total Tickets ${this.currentYear}</div>
                    <div style="color:#f4f4f5;font-size:1.5rem;font-weight:bold;">${totalTickets.toLocaleString()}</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">Within SLA</div>
                    <div style="color:#10b981;font-size:1.5rem;font-weight:bold;">${totalWithin.toLocaleString()}</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">SLA Violated</div>
                    <div style="color:#ef4444;font-size:1.5rem;font-weight:bold;">${totalViolated.toLocaleString()}</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">%SLA Geral</div>
                    <div style="color:#8b5cf6;font-size:1.5rem;font-weight:bold;">${slaRate.toFixed(2)}%</div>
                </div>
            `;
            
            legendContent = `
                <strong>Legenda SLA:</strong><br>
                • <span style="color:#10b981;">Verde</span> = %SLA ≥ 95% | <span style="color:#eab308;">Amarelo</span> = 90-95% | <span style="color:#ea580c;">Laranja</span> = 80-90% | <span style="color:#ef4444;">Vermelho</span> = < 80%<br>
                • <strong>SLA Violated</strong> = tickets que ultrapassaram o prazo de SLA<br>
                • <strong>Within SLA</strong> = tickets dentro do prazo de SLA
            `;
        } else if (this.matrixType === 'resumo_atendimento') {
            // Matriz Resumo Atendimento (individual por pessoa)
            const resumoData = this.calculateResumoAtendimentoMatrix(allTickets, this.currentYear);
            tableContent = this.renderResumoAtendimentoTable(resumoData);
            
            // Calcular totais
            const totalPessoas = Object.keys(resumoData.people).length;
            let totalAcomp = 0, totalResolvidos = 0, totalSlaWithin = 0, totalSlaTotal = 0;
            Object.values(resumoData.people).forEach(p => {
                totalAcomp += p.acumulado.acompanhados;
                totalResolvidos += p.acumulado.resolvidos;
                totalSlaWithin += p.acumulado.slaWithin;
                totalSlaTotal += p.acumulado.slaTotal;
            });
            const avgResolucao = totalAcomp > 0 ? (totalResolvidos / totalAcomp * 100) : 0;
            const avgSla = totalSlaTotal > 0 ? (totalSlaWithin / totalSlaTotal * 100) : 0;
            
            summaryContent = `
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">Pessoas Atendimento</div>
                    <div style="color:#f4f4f5;font-size:1.5rem;font-weight:bold;">${totalPessoas}</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">Total Tickets ${this.currentYear}</div>
                    <div style="color:#0ea5e9;font-size:1.5rem;font-weight:bold;">${resumoData.totalTicketsYear.toLocaleString()}</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">%Resolução Geral</div>
                    <div style="color:#10b981;font-size:1.5rem;font-weight:bold;">${avgResolucao.toFixed(1)}%</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">%SLA Geral</div>
                    <div style="color:#8b5cf6;font-size:1.5rem;font-weight:bold;">${avgSla.toFixed(1)}%</div>
                </div>
            `;
            
            legendContent = `
                <strong>Legenda Resumo Atendimento:</strong><br>
                • <strong>%Acompanhamento</strong> = tickets acompanhados pela pessoa / total de tickets do mês<br>
                • <strong>%Resolvido</strong> = tickets resolvidos / tickets acompanhados (baseado em cf_acompanhamento)<br>
                • <strong>%SLA</strong> = 1ª resposta em até 4h | <strong>%Satisfação</strong> = CSAT positivo<br>
                • <span style="color:#22c55e;">Verde</span> ≥100% | <span style="color:#84cc16;">Verde claro</span> ≥95% | <span style="color:#eab308;">Amarelo</span> ≥90% | <span style="color:#fb923c;">Laranja</span> ≥80% | <span style="color:#ef4444;">Vermelho</span> <80%
            `;
        } else {
            // Matriz de Produtividade (padrão)
            tableContent = this.renderTable(data);
            
            summaryContent = `
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">Total Criado ${this.currentYear}</div>
                    <div style="color:#f4f4f5;font-size:1.5rem;font-weight:bold;">${totalCreatedYear.toLocaleString()}</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">Total Resolvido</div>
                    <div style="color:#10b981;font-size:1.5rem;font-weight:bold;">${totalResolvedYear.toLocaleString()}</div>
                </div>
                <div style="background:#1e293b;padding:1rem;border-radius:8px;border:1px solid #334155;">
                    <div style="color:#94a3b8;font-size:0.8rem;">Taxa Geral</div>
                    <div style="color:#8b5cf6;font-size:1.5rem;font-weight:bold;">${totalCreatedYear > 0 ? ((totalResolvedYear / totalCreatedYear) * 100).toFixed(1) : 0}%</div>
                </div>
            `;
            
            legendContent = `
                <strong>Legenda Produtividade:</strong><br>
                • <span style="color:#60a5fa;">■ Azul</span> = resolvido no mesmo mês | <span style="color:#fca5a5;">■ Vermelho</span> = herdados (meses anteriores)<br>
                • <strong>Colunas</strong> = mês de criação | <strong>Linhas</strong> = mês da tratativa<br>
                • <span style="color:#10b981;">Verde</span> = % ≥ 100% | <span style="color:#f59e0b;">Amarelo</span> = 90-100% | <span style="color:#ef4444;">Vermelho</span> = < 90%
            `;
        }
        
        // Gerar HTML
        container.innerHTML = `
            <div style="padding: 1rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:1rem;">
                    <div>
                        <h2 style="margin:0;color:#f4f4f5;font-size:1.3rem;">📊 ${this.matrixType === 'sla' ? 'Matriz de SLA' : this.matrixType === 'resumo_atendimento' ? 'Resumo Atendimento' : 'Matriz de Produtividade'} ${this.currentYear}</h2>
                        <p style="margin:4px 0 0;color:#94a3b8;font-size:0.85rem;">${this.matrixType === 'sla' ? 'Análise de SLA por Grupo' : this.matrixType === 'resumo_atendimento' ? 'Desempenho individual - Time Atendimento' : 'Tickets tratados vs Atribuído Acumulado'} - <span style="color:#0ea5e9;font-weight:600;">${teamLabel}</span></p>
                    </div>
                    <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
                        ${matrixTypeSelector}
                        <select id="matrixTeamFilter" onchange="BIProductivityMatrix.setTeam(this.value)" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;">
                            <option value="all" ${this.selectedTeam === 'all' ? 'selected' : ''}>🌐 Geral (Todos)</option>
                            ${availableTeams.map(team => `
                                <option value="${team}" ${this.selectedTeam === team ? 'selected' : ''}>${team}</option>
                            `).join('')}
                        </select>
                        <button onclick="BIProductivityMatrix.changeYear(-1)" style="background:#334155;border:none;color:#e2e8f0;padding:8px 12px;border-radius:6px;cursor:pointer;">◀ ${this.currentYear - 1}</button>
                        <button onclick="BIProductivityMatrix.changeYear(1)" style="background:#334155;border:none;color:#e2e8f0;padding:8px 12px;border-radius:6px;cursor:pointer;">${this.currentYear + 1} ▶</button>
                    </div>
                </div>
                
                <div style="overflow-x:auto;border-radius:8px;border:1px solid #334155;">
                    ${tableContent}
                </div>
                
                <div style="margin-top:1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;">
                    ${summaryContent}
                </div>
                
                <div style="margin-top:1rem;padding:1rem;background:#1e293b;border-radius:8px;border:1px solid #334155;">
                    <div style="font-size:0.8rem;color:#94a3b8;">
                        ${legendContent}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderTable(data) {
        const { matrix, monthsInYear, prevYear, createdByMonth, resolvedByMonth, herdadosByMonth, herdadosResolvidosByMonth, totalResolvedByCreation, totalPendingByCreation, productivityRate, resolvedInSameMonth, acumuladoByMonth } = data;
        const c = this.colors; // Cores do tema atual
        
        const allCreationMonths = [`${prevYear}`, ...monthsInYear];
        const shortMonths = { '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez' };
        
        let html = '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">';
        
        // Header
        html += `<thead><tr style="background:${c.headerBg};">`;
        html += `<th style="padding:8px;color:${c.headerText};text-align:left;border:1px solid ${c.headerBorder};min-width:120px;">Mês da Tratativa ↓</th>`;
        html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:${c.headerBgAlt};">${this.currentYear - 1}<br>Herdados</th>`;
        
        monthsInYear.forEach(m => {
            const [, month] = m.split('-');
            html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};">${shortMonths[month]}</th>`;
        });
        
        html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:${c.resolvedBg};">Resolvido<br>dentro do mês</th>`;
        html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:#991b1b;">Herdados<br>Resolvidos</th>`;
        html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:${c.acumuladoBg};">Total<br>Tratativas</th>`;
        html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:${c.criadoBg};">Criado<br>${this.currentYear}</th>`;
        html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:#7c3aed;">%Tratativas</th>`;
        html += '</tr></thead>';
        
        // Body
        html += '<tbody>';
        
        // Linha de totais de criação (header secundário)
        html += `<tr style="background:${c.subHeaderBg};color:${c.mutedText};font-size:0.7rem;">`;
        html += `<td style="padding:4px 8px;border:1px solid ${c.cellBorder};">Contagem Abertura</td>`;
        html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};">${createdByMonth[`${prevYear}`] || 0}</td>`;
        monthsInYear.forEach(m => {
            html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};">${createdByMonth[m] || 0}</td>`;
        });
        html += `<td colspan="5" style="border:1px solid ${c.cellBorder};"></td>`;
        html += '</tr>';
        
        // Linhas de dados por mês de tratativa
        monthsInYear.forEach((treatMonth, idx) => {
            const [year, month] = treatMonth.split('-');
            const rowData = matrix[treatMonth];
            
            const createdThisMonth = createdByMonth[treatMonth] || 0;
            const resolvedThisMonth = resolvedByMonth[treatMonth] || 0;
            const herdadosResolvidos = herdadosResolvidosByMonth[treatMonth] || 0;
            const acumulado = acumuladoByMonth[treatMonth] || 0;
            const pctRate = parseFloat(productivityRate[treatMonth] || 0);
            // Cores sólidas para %TRATATIVAS conforme faixas de desempenho
            const theme = document.documentElement.getAttribute('data-theme');
            const isCyan = theme === 'tryvia-cyan';
            let pctColor, pctBg;
            if (pctRate >= 100) {
                pctColor = '#ffffff'; pctBg = '#22c55e'; // Verde
            } else if (pctRate >= 97) {
                pctColor = '#ffffff'; pctBg = '#3b82f6'; // Azul
            } else if (pctRate >= 95) {
                pctColor = '#ffffff'; pctBg = '#84cc16'; // Verde claro/limão
            } else if (pctRate >= 90) {
                pctColor = '#000000'; pctBg = '#eab308'; // Amarelo
            } else {
                // ≤89%: Dark = fundo branco/texto preto, Cyan = fundo preto/texto branco
                pctColor = isCyan ? '#ffffff' : '#000000';
                pctBg = isCyan ? '#000000' : '#ffffff';
            }
            
            html += `<tr style="background:${idx % 2 === 0 ? c.rowEven : c.rowOdd};">`;
            html += `<td style="padding:8px;color:${c.rowText};border:1px solid ${c.cellBorder};font-weight:500;">${shortMonths[month]}. de ${year}</td>`;
            
            // Células da matriz
            allCreationMonths.forEach(createMonth => {
                const value = rowData.byCreationMonth[createMonth] || 0;
                const isDiagonal = createMonth === treatMonth;
                const isHerdado = createMonth < treatMonth; // Criado ANTES do mês de tratativa
                const isAfterTreat = createMonth > treatMonth; // Futuro (impossível)
                
                let cellStyle = `padding:6px;text-align:center;border:1px solid ${c.cellBorder};`;
                if (isDiagonal && value > 0) {
                    // Diagonal = resolvido no mesmo mês (AZUL)
                    cellStyle += `background:${c.cellBg};color:${c.cellText};font-weight:600;`;
                } else if (isHerdado && value > 0) {
                    // Herdado = criado antes, resolvido depois (VERMELHO)
                    cellStyle += `background:${c.herdadosBg};color:${c.herdadosText};font-weight:600;`;
                } else if (isAfterTreat) {
                    // Futuro = impossível (cinza)
                    cellStyle += `background:${c.cellEmpty};color:${c.cellEmptyText};`;
                } else {
                    // Sem valor
                    cellStyle += `color:${c.mutedText};`;
                }
                
                html += `<td style="${cellStyle}">${value > 0 ? value : ''}</td>`;
            });
            
            // Colunas de resumo - Ticket (diagonal), Herdados Resolvidos, Total Tratativas (soma), Criado, %Resolvido
            const ticketDiagonal = resolvedInSameMonth[treatMonth] || 0;
            const totalTratativas = ticketDiagonal + herdadosResolvidos; // Tratados dentro + Herdados = Total do mês
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};background:${c.resolvedBg};color:${c.resolvedText};font-weight:600;">${ticketDiagonal}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};background:${c.herdadosBg};color:${c.herdadosText};font-weight:600;">${herdadosResolvidos}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};background:${c.acumuladoBg};color:${c.acumuladoText};">${totalTratativas}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};background:${c.criadoBg};color:${c.criadoText};">${createdThisMonth}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};background:${pctBg};color:${pctColor};font-weight:600;">${pctRate.toFixed(0)}%</td>`;
            html += '</tr>';
        });
        
        // Calcular totais das colunas de resumo
        let totalResolvidoDentro = 0;
        let totalHerdadosResolvidos = 0;
        let totalTratativasGeral = 0;
        monthsInYear.forEach(m => {
            totalResolvidoDentro += resolvedInSameMonth[m] || 0;
            totalHerdadosResolvidos += herdadosResolvidosByMonth[m] || 0;
        });
        totalTratativasGeral = totalResolvidoDentro + totalHerdadosResolvidos;
        
        // Linha de totais resolvidos
        html += `<tr style="background:${c.totalResolvedBg};font-weight:600;">`;
        html += `<td style="padding:8px;color:${c.headerText};border:1px solid ${c.headerBorder};">✓ TOTAL RESOLVIDO</td>`;
        allCreationMonths.forEach(cm => {
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.headerBorder};color:${c.resolvedText};">${totalResolvedByCreation[cm] || 0}</td>`;
        });
        // Totais individuais: Resolvido Dentro, Herdados Resolvidos, Total Tratativas
        html += `<td style="padding:6px;text-align:center;border:1px solid ${c.headerBorder};background:${c.resolvedBg};color:${c.resolvedText};">${totalResolvidoDentro}</td>`;
        html += `<td style="padding:6px;text-align:center;border:1px solid ${c.headerBorder};background:${c.herdadosBg};color:${c.herdadosText};">${totalHerdadosResolvidos}</td>`;
        html += `<td style="padding:6px;text-align:center;border:1px solid ${c.headerBorder};background:${c.acumuladoBg};color:${c.acumuladoText};">${totalTratativasGeral}</td>`;
        html += `<td colspan="2" style="border:1px solid ${c.headerBorder};"></td>`;
        html += '</tr>';
        
        // Linha de pendentes
        html += `<tr style="background:${c.pendenteBg};">`;
        html += `<td style="padding:8px;color:${c.pendenteText};border:1px solid ${c.pendenteBorder};">⚠ TOTAL PENDENTE</td>`;
        allCreationMonths.forEach(cm => {
            const pending = totalPendingByCreation[cm] || 0;
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.pendenteBorder};color:${pending > 0 ? c.pendenteText : c.mutedText};">${pending}</td>`;
        });
        const totalPending = Object.values(totalPendingByCreation).reduce((a, b) => a + b, 0);
        html += `<td colspan="3" style="padding:6px;text-align:center;border:1px solid ${c.pendenteBorder};color:${c.pendenteText};">${totalPending}</td>`;
        html += `<td colspan="2" style="border:1px solid ${c.pendenteBorder};"></td>`;
        html += '</tr>';
        
        // Linha de % resolução por mês de criação (diagonal / criado)
        html += `<tr style="background:${c.rowOdd};">`;
        html += `<td style="padding:8px;color:${c.mutedText};border:1px solid ${c.cellBorder};font-size:0.7rem;">% Resolução no mês</td>`;
        html += `<td style="border:1px solid ${c.cellBorder};"></td>`; // Coluna ano anterior
        monthsInYear.forEach(cm => {
            const created = createdByMonth[cm] || 0;
            const diagonal = resolvedInSameMonth[cm] || 0;
            const rate = created > 0 ? ((diagonal / created) * 100).toFixed(0) : '0';
            const rateNum = parseFloat(rate);
            const color = rateNum >= 80 ? c.pctGreen : rateNum >= 60 ? c.pctYellow : c.pctRed;
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};color:${color};font-size:0.7rem;">${rate}%</td>`;
        });
        html += `<td colspan="5" style="border:1px solid ${c.cellBorder};"></td>`;
        html += '</tr>';
        
        html += '</tbody></table>';
        return html;
    },
    
    changeYear(delta) {
        this.currentYear += delta;
        this.render();
    },
    
    setTeam(team) {
        this.selectedTeam = team;
        this.render();
    },
    
    setMatrixType(type) {
        this.matrixType = type;
        this.render();
    },
    
    // Calcular matriz de SLA por grupo (apenas times válidos, não pessoas)
    calculateSLAMatrix(tickets, year) {
        const groups = {};
        const monthsInYear = [];
        
        // Gerar meses do ano
        for (let m = 1; m <= 12; m++) {
            monthsInYear.push(`${year}-${String(m).padStart(2, '0')}`);
        }
        
        // Processar tickets
        tickets.forEach(ticket => {
            if (!ticket.created_at) return;
            
            const createdDate = new Date(ticket.created_at);
            const createdYear = createdDate.getFullYear();
            const createdMonth = `${createdYear}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Só considerar tickets do ano selecionado
            if (createdYear !== year) return;
            
            // Obter grupo - APENAS times válidos, ignorar nomes de pessoas
            const rawGroup = ticket.cf_grupo_tratativa || ticket.group_name || '';
            
            // Verificar se é um time válido ou extrair time válido do campo
            let group = 'Sem Grupo';
            if (rawGroup) {
                // Pode ter múltiplos valores separados por vírgula/ponto-e-vírgula
                const parts = rawGroup.split(/[,;\/]/).map(x => x.trim()).filter(x => x);
                // Encontrar o primeiro que seja um time válido
                const validTeam = parts.find(p => this.VALID_TEAMS.includes(p));
                if (validTeam) {
                    group = validTeam;
                } else {
                    // Se não encontrou time válido, pode ser que o grupo seja "Terceiros" ou outro
                    // Verificar se contém alguma palavra-chave de time
                    const lowerRaw = rawGroup.toLowerCase();
                    if (lowerRaw.includes('terceiro')) group = 'Terceiros';
                    else if (lowerRaw.includes('dev') || lowerRaw.includes('desenvolvimento')) group = 'DEV';
                    else if (lowerRaw.includes('atendimento')) group = 'Atendimento';
                    else if (lowerRaw.includes('acompanhamento')) group = 'Acompanhamento';
                    else if (lowerRaw.includes('técnico') || lowerRaw.includes('tecnico')) group = 'Técnico';
                    else if (lowerRaw.includes('produto')) group = 'Produto';
                    else if (lowerRaw.includes('implantação') || lowerRaw.includes('implantacao')) group = 'Implantação';
                    else if (lowerRaw.includes('comercial')) group = 'Comercial';
                    else if (lowerRaw.includes('cs')) group = 'CS';
                    // Se ainda não encontrou, é "Sem Grupo" (provavelmente nome de pessoa)
                }
            }
            
            if (!groups[group]) {
                groups[group] = {};
                monthsInYear.forEach(m => {
                    groups[group][m] = { total: 0, violated: 0, within: 0 };
                });
                groups[group].acumulado = { total: 0, violated: 0, within: 0 };
            }
            
            // Verificar SLA - is_escalated é o campo para SLA geral/resolução
            // fr_escalated = SLA 1ª resposta, is_escalated = SLA resolução/geral
            // true = SLA violado, false/undefined = dentro do SLA
            const slaViolated = ticket.is_escalated === true;
            
            groups[group][createdMonth].total++;
            groups[group].acumulado.total++;
            
            if (slaViolated) {
                groups[group][createdMonth].violated++;
                groups[group].acumulado.violated++;
            } else {
                groups[group][createdMonth].within++;
                groups[group].acumulado.within++;
            }
        });
        
        return { groups, monthsInYear };
    },
    
    // Renderizar tabela de SLA
    renderSLATable(data) {
        const { groups, monthsInYear } = data;
        const c = this.colors;
        const shortMonths = { '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun', '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
        
        let html = '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">';
        
        // Header
        html += `<thead><tr style="background:${c.headerBg};">`;
        html += `<th style="padding:8px;color:${c.headerText};text-align:left;border:1px solid ${c.headerBorder};min-width:100px;">SLA<br>GRUPO</th>`;
        monthsInYear.forEach(m => {
            const [, month] = m.split('-');
            html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};">${shortMonths[month]}/${this.currentYear.toString().slice(-2)}</th>`;
        });
        html += `<th style="padding:8px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:${c.headerBgAlt};">Acumulado</th>`;
        html += '</tr></thead>';
        
        html += '<tbody>';
        
        // Ordenar grupos
        const sortedGroups = Object.keys(groups).sort();
        
        sortedGroups.forEach((groupName, gIdx) => {
            const groupData = groups[groupName];
            const rowBg = gIdx % 2 === 0 ? c.rowEven : c.rowOdd;
            
            // Linha do grupo (Total)
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:6px;color:${c.rowText};border:1px solid ${c.cellBorder};font-weight:600;">${groupName}</td>`;
            monthsInYear.forEach(m => {
                const val = groupData[m]?.total || 0;
                html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};color:${c.rowText};">${val || ''}</td>`;
            });
            html += `<td style="padding:6px;text-align:center;border:1px solid ${c.cellBorder};background:${c.subHeaderBg};color:${c.rowText};font-weight:600;">${groupData.acumulado.total}</td>`;
            html += '</tr>';
            
            // Linha SLA Violated
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:4px 6px;color:${c.herdadosText};border:1px solid ${c.cellBorder};font-size:0.7rem;padding-left:16px;">SLA Violated</td>`;
            monthsInYear.forEach(m => {
                const val = groupData[m]?.violated || 0;
                html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};color:${val > 0 ? c.herdadosText : c.mutedText};font-size:0.7rem;">${val || ''}</td>`;
            });
            html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};background:${c.herdadosBg};color:${c.herdadosText};font-size:0.7rem;">${groupData.acumulado.violated}</td>`;
            html += '</tr>';
            
            // Linha Within SLA
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:4px 6px;color:${c.resolvedText};border:1px solid ${c.cellBorder};font-size:0.7rem;padding-left:16px;">Within SLA</td>`;
            monthsInYear.forEach(m => {
                const val = groupData[m]?.within || 0;
                html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};color:${val > 0 ? c.resolvedText : c.mutedText};font-size:0.7rem;">${val || ''}</td>`;
            });
            html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};background:${c.resolvedBg};color:${c.resolvedText};font-size:0.7rem;">${groupData.acumulado.within}</td>`;
            html += '</tr>';
            
            // Linha %SLA
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:4px 6px;color:${c.mutedText};border:1px solid ${c.cellBorder};font-size:0.7rem;padding-left:16px;">%SLA</td>`;
            // Cores conforme faixas de desempenho SLA
            const theme = document.documentElement.getAttribute('data-theme');
            const isCyan = theme === 'tryvia-cyan';
            monthsInYear.forEach(m => {
                const total = groupData[m]?.total || 0;
                const within = groupData[m]?.within || 0;
                const pct = total > 0 ? (within / total * 100) : 0;
                let pctBg, pctColor;
                if (total === 0) {
                    pctBg = 'transparent'; pctColor = c.mutedText;
                } else if (pct >= 100) {
                    pctBg = '#22c55e'; pctColor = '#ffffff'; // Verde
                } else if (pct >= 97) {
                    pctBg = '#3b82f6'; pctColor = '#ffffff'; // Azul
                } else if (pct >= 95) {
                    pctBg = '#84cc16'; pctColor = '#ffffff'; // Verde claro/limão
                } else if (pct >= 90) {
                    pctBg = '#eab308'; pctColor = '#000000'; // Amarelo
                } else {
                    // ≤89%: Dark = fundo branco/texto preto, Cyan = fundo preto/texto branco
                    pctBg = isCyan ? '#000000' : '#ffffff';
                    pctColor = isCyan ? '#ffffff' : '#000000';
                }
                html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};background:${pctBg};color:${pctColor};font-size:0.7rem;font-weight:600;">${total > 0 ? pct.toFixed(2) + '%' : ''}</td>`;
            });
            // Acumulado %SLA
            const acTotal = groupData.acumulado.total;
            const acWithin = groupData.acumulado.within;
            const acPct = acTotal > 0 ? (acWithin / acTotal * 100) : 0;
            let acBg, acColor;
            if (acTotal === 0) {
                acBg = 'transparent'; acColor = c.mutedText;
            } else if (acPct >= 100) {
                acBg = '#22c55e'; acColor = '#ffffff'; // Verde
            } else if (acPct >= 97) {
                acBg = '#3b82f6'; acColor = '#ffffff'; // Azul
            } else if (acPct >= 95) {
                acBg = '#84cc16'; acColor = '#ffffff'; // Verde claro/limão
            } else if (acPct >= 90) {
                acBg = '#eab308'; acColor = '#000000'; // Amarelo
            } else {
                // ≤89%: Dark = fundo branco/texto preto, Cyan = fundo preto/texto branco
                acBg = isCyan ? '#000000' : '#ffffff';
                acColor = isCyan ? '#ffffff' : '#000000';
            }
            html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};background:${acBg};color:${acColor};font-size:0.7rem;font-weight:600;">${acTotal > 0 ? acPct.toFixed(2) + '%' : ''}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    },
    
    // Calcular matriz de Resumo Atendimento (por pessoa individual)
    calculateResumoAtendimentoMatrix(tickets, year) {
        const people = {};
        const monthsInYear = [];
        
        // Gerar meses do ano
        for (let m = 1; m <= 12; m++) {
            monthsInYear.push(`${year}-${String(m).padStart(2, '0')}`);
        }
        
        // Obter whitelist do time Atendimento
        const atendimentoMembers = window.TEAM_MEMBERS_CONFIG?.Atendimento || [];
        const atendimentoSet = new Set(atendimentoMembers);
        
        // Filtrar apenas pessoas do time Atendimento
        const atendimentoTickets = tickets.filter(t => {
            const grupo = (t.cf_grupo_tratativa || t.group_name || '').toLowerCase();
            return grupo.includes('atendimento');
        });
        
        // Processar tickets
        atendimentoTickets.forEach(ticket => {
            if (!ticket.created_at) return;
            
            const createdDate = new Date(ticket.created_at);
            const createdYear = createdDate.getFullYear();
            const createdMonth = `${createdYear}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Só considerar tickets do ano selecionado
            if (createdYear !== year) return;
            
            // Obter pessoas do acompanhamento (cf_acompanhamento)
            const acompanhamento = ticket.cf_acompanhamento || '';
            const pessoasAcomp = acompanhamento.split(/[,;]/).map(p => p.trim()).filter(p => p);
            
            // Se não tem acompanhamento, pegar tratativa
            const tratativa = ticket.cf_tratativa || '';
            const pessoasTrat = tratativa.split(/[,;]/).map(p => p.trim()).filter(p => p);
            
            // Combinar pessoas únicas (priorizar acompanhamento para métricas)
            // FILTRAR apenas pessoas que pertencem ao time Atendimento
            const todasPessoas = [...new Set([...pessoasAcomp, ...pessoasTrat])]
                .filter(p => atendimentoSet.has(p));
            
            todasPessoas.forEach(pessoa => {
                if (!pessoa) return;
                
                if (!people[pessoa]) {
                    people[pessoa] = {};
                    monthsInYear.forEach(m => {
                        people[pessoa][m] = { 
                            tickets: 0, 
                            acompanhados: 0, 
                            resolvidos: 0, 
                            slaWithin: 0, 
                            slaTotal: 0,
                            csatPositive: 0,
                            csatTotal: 0
                        };
                    });
                    people[pessoa].acumulado = { 
                        tickets: 0, 
                        acompanhados: 0, 
                        resolvidos: 0, 
                        slaWithin: 0, 
                        slaTotal: 0,
                        csatPositive: 0,
                        csatTotal: 0
                    };
                }
                
                // Contagem de tickets
                people[pessoa][createdMonth].tickets++;
                people[pessoa].acumulado.tickets++;
                
                // Verificar se pessoa está no acompanhamento OU na tratativa (ambos contam como "acompanhado")
                const estaNoAcomp = pessoasAcomp.includes(pessoa);
                const estaNaTrat = pessoasTrat.includes(pessoa);
                
                if (estaNoAcomp || estaNaTrat) {
                    people[pessoa][createdMonth].acompanhados++;
                    people[pessoa].acumulado.acompanhados++;
                    
                    // Verificar se resolvido
                    const isResolved = ticket.status === 4 || ticket.status === 5;
                    if (isResolved) {
                        people[pessoa][createdMonth].resolvidos++;
                        people[pessoa].acumulado.resolvidos++;
                    }
                }
                
                // SLA
                if (ticket.stats_first_responded_at) {
                    people[pessoa][createdMonth].slaTotal++;
                    people[pessoa].acumulado.slaTotal++;
                    
                    const created = new Date(ticket.created_at);
                    const responded = new Date(ticket.stats_first_responded_at);
                    const hoursToRespond = (responded - created) / (1000 * 60 * 60);
                    
                    if (hoursToRespond <= 4) {
                        people[pessoa][createdMonth].slaWithin++;
                        people[pessoa].acumulado.slaWithin++;
                    }
                }
                
                // CSAT (satisfação)
                if (ticket.csat_rating !== undefined && ticket.csat_rating !== null) {
                    people[pessoa][createdMonth].csatTotal++;
                    people[pessoa].acumulado.csatTotal++;
                    
                    // CSAT positivo = 4 ou 5 (ou escala similar)
                    if (ticket.csat_rating >= 4 || ticket.csat_rating === 'positive' || ticket.csat_rating === 'happy') {
                        people[pessoa][createdMonth].csatPositive++;
                        people[pessoa].acumulado.csatPositive++;
                    }
                }
            });
        });
        
        // Calcular total geral de tickets por mês (para % acompanhamento)
        const totalTicketsByMonth = {};
        monthsInYear.forEach(m => { totalTicketsByMonth[m] = 0; });
        let totalTicketsYear = 0;
        
        atendimentoTickets.forEach(ticket => {
            if (!ticket.created_at) return;
            const createdDate = new Date(ticket.created_at);
            if (createdDate.getFullYear() !== year) return;
            const createdMonth = `${year}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
            totalTicketsByMonth[createdMonth]++;
            totalTicketsYear++;
        });
        
        return { people, monthsInYear, totalTicketsByMonth, totalTicketsYear };
    },
    
    // Renderizar tabela de Resumo Atendimento
    renderResumoAtendimentoTable(data) {
        const { people, monthsInYear, totalTicketsByMonth, totalTicketsYear } = data;
        const c = this.colors;
        const theme = document.documentElement.getAttribute('data-theme');
        const isCyan = theme === 'tryvia-cyan';
        const shortMonths = { '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun', '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
        
        // Função para cor de porcentagem
        const getPctColor = (pct) => {
            if (pct >= 100) return { bg: '#22c55e', color: '#ffffff' }; // Verde
            if (pct >= 95) return { bg: '#84cc16', color: '#ffffff' }; // Verde claro
            if (pct >= 90) return { bg: '#eab308', color: '#000000' }; // Amarelo
            if (pct >= 80) return { bg: '#fb923c', color: '#000000' }; // Laranja
            return { bg: '#ef4444', color: '#ffffff' }; // Vermelho
        };
        
        let html = '<table style="width:100%;border-collapse:collapse;font-size:0.7rem;">';
        
        // Header
        html += `<thead><tr style="background:${c.headerBg};">`;
        html += `<th style="padding:6px;color:${c.headerText};text-align:left;border:1px solid ${c.headerBorder};min-width:80px;">Desempenho</th>`;
        monthsInYear.forEach(m => {
            const [, month] = m.split('-');
            html += `<th style="padding:6px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};font-size:0.65rem;">${shortMonths[month]}/${this.currentYear.toString().slice(-2)}</th>`;
        });
        html += `<th style="padding:6px;color:${c.headerText};text-align:center;border:1px solid ${c.headerBorder};background:${c.headerBgAlt};">Acumulado</th>`;
        html += '</tr></thead>';
        
        // Linha de Tickets/Mês
        html += '<tbody>';
        html += `<tr style="background:${c.subHeaderBg};">`;
        html += `<td style="padding:4px 6px;color:${c.mutedText};border:1px solid ${c.cellBorder};font-size:0.65rem;">Tickets/Mês</td>`;
        monthsInYear.forEach(m => {
            html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};color:${c.mutedText};font-size:0.65rem;">${totalTicketsByMonth[m] || ''}</td>`;
        });
        html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};background:${c.headerBgAlt};color:${c.headerText};font-weight:600;">${totalTicketsYear}</td>`;
        html += '</tr>';
        
        // Ordenar pessoas por total de tickets (decrescente)
        const sortedPeople = Object.keys(people).sort((a, b) => people[b].acumulado.tickets - people[a].acumulado.tickets);
        
        sortedPeople.forEach((personName, pIdx) => {
            const personData = people[personName];
            const rowBg = pIdx % 2 === 0 ? c.rowEven : c.rowOdd;
            
            // Linha do nome da pessoa (total de tickets)
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:6px;color:${c.rowText};border:1px solid ${c.cellBorder};font-weight:600;" colspan="1">${personName}</td>`;
            monthsInYear.forEach(m => {
                const val = personData[m]?.tickets || 0;
                html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};color:${c.rowText};">${val || ''}</td>`;
            });
            html += `<td style="padding:4px;text-align:center;border:1px solid ${c.cellBorder};background:${c.subHeaderBg};color:${c.rowText};font-weight:600;">${personData.acumulado.tickets}</td>`;
            html += '</tr>';
            
            // Linha %Acompanhamento
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:3px 6px;color:${c.mutedText};border:1px solid ${c.cellBorder};font-size:0.65rem;padding-left:12px;">%Acompanhamento</td>`;
            monthsInYear.forEach(m => {
                const acomp = personData[m]?.acompanhados || 0;
                const total = totalTicketsByMonth[m] || 0;
                const pct = total > 0 ? (acomp / total * 100) : 0;
                html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};color:${c.mutedText};font-size:0.65rem;">${total > 0 ? pct.toFixed(2) + '%' : ''}</td>`;
            });
            const acAcomp = personData.acumulado.acompanhados || 0;
            const acTotal = totalTicketsYear || 0;
            const acPctAcomp = acTotal > 0 ? (acAcomp / acTotal * 100) : 0;
            html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};background:${c.subHeaderBg};color:${c.mutedText};font-size:0.65rem;">${acTotal > 0 ? acPctAcomp.toFixed(2) + '%' : ''}</td>`;
            html += '</tr>';
            
            // Linha %Resolvido (baseado em acompanhamento)
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:3px 6px;color:${c.resolvedText};border:1px solid ${c.cellBorder};font-size:0.65rem;padding-left:12px;">%Resolvido</td>`;
            monthsInYear.forEach(m => {
                const resolvidos = personData[m]?.resolvidos || 0;
                const acomp = personData[m]?.acompanhados || 0;
                const pct = acomp > 0 ? (resolvidos / acomp * 100) : 0;
                const pctStyle = acomp > 0 ? getPctColor(pct) : { bg: 'transparent', color: c.mutedText };
                html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};background:${pctStyle.bg};color:${pctStyle.color};font-size:0.65rem;font-weight:500;">${acomp > 0 ? pct.toFixed(2) + '%' : ''}</td>`;
            });
            const acResolvidos = personData.acumulado.resolvidos || 0;
            const acAcompTotal = personData.acumulado.acompanhados || 0;
            const acPctRes = acAcompTotal > 0 ? (acResolvidos / acAcompTotal * 100) : 0;
            const acResStyle = acAcompTotal > 0 ? getPctColor(acPctRes) : { bg: 'transparent', color: c.mutedText };
            html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};background:${acResStyle.bg};color:${acResStyle.color};font-size:0.65rem;font-weight:600;">${acAcompTotal > 0 ? acPctRes.toFixed(2) + '%' : ''}</td>`;
            html += '</tr>';
            
            // Linha %SLA
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:3px 6px;color:#3b82f6;border:1px solid ${c.cellBorder};font-size:0.65rem;padding-left:12px;">%SLA</td>`;
            monthsInYear.forEach(m => {
                const within = personData[m]?.slaWithin || 0;
                const total = personData[m]?.slaTotal || 0;
                const pct = total > 0 ? (within / total * 100) : 0;
                const pctStyle = total > 0 ? getPctColor(pct) : { bg: 'transparent', color: c.mutedText };
                html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};background:${pctStyle.bg};color:${pctStyle.color};font-size:0.65rem;font-weight:500;">${total > 0 ? pct.toFixed(2) + '%' : ''}</td>`;
            });
            const acSlaWithin = personData.acumulado.slaWithin || 0;
            const acSlaTotal = personData.acumulado.slaTotal || 0;
            const acPctSla = acSlaTotal > 0 ? (acSlaWithin / acSlaTotal * 100) : 0;
            const acSlaStyle = acSlaTotal > 0 ? getPctColor(acPctSla) : { bg: 'transparent', color: c.mutedText };
            html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};background:${acSlaStyle.bg};color:${acSlaStyle.color};font-size:0.65rem;font-weight:600;">${acSlaTotal > 0 ? acPctSla.toFixed(2) + '%' : ''}</td>`;
            html += '</tr>';
            
            // Linha % Satisfação (CSAT)
            html += `<tr style="background:${rowBg};">`;
            html += `<td style="padding:3px 6px;color:#f59e0b;border:1px solid ${c.cellBorder};font-size:0.65rem;padding-left:12px;">% Satisfação</td>`;
            monthsInYear.forEach(m => {
                const positive = personData[m]?.csatPositive || 0;
                const total = personData[m]?.csatTotal || 0;
                const pct = total > 0 ? (positive / total * 100) : 0;
                const pctStyle = total > 0 ? getPctColor(pct) : { bg: 'transparent', color: c.mutedText };
                html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};background:${total > 0 ? pctStyle.bg : 'transparent'};color:${total > 0 ? pctStyle.color : c.mutedText};font-size:0.65rem;font-weight:500;">${total > 0 ? pct.toFixed(2) + '%' : ''}</td>`;
            });
            const acCsatPos = personData.acumulado.csatPositive || 0;
            const acCsatTotal = personData.acumulado.csatTotal || 0;
            const acPctCsat = acCsatTotal > 0 ? (acCsatPos / acCsatTotal * 100) : 0;
            const acCsatStyle = acCsatTotal > 0 ? getPctColor(acPctCsat) : { bg: 'transparent', color: c.mutedText };
            html += `<td style="padding:3px;text-align:center;border:1px solid ${c.cellBorder};background:${acCsatTotal > 0 ? acCsatStyle.bg : 'transparent'};color:${acCsatTotal > 0 ? acCsatStyle.color : c.mutedText};font-size:0.65rem;font-weight:600;">${acCsatTotal > 0 ? acPctCsat.toFixed(2) + '%' : ''}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    },
    
    init() {
        console.log('📊 BI Productivity Matrix initialized');
    }
};

window.BIProductivityMatrix.init();
