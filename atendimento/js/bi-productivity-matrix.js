/**
 * BI Productivity Matrix - Matriz de Produtividade
 * Análise de Tickets tratados vs Atribuído Acumulado
 */

window.BIProductivityMatrix = {
    currentYear: new Date().getFullYear(),
    selectedTeam: 'all', // 'all' = Geral, ou nome do time
    
    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    
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
        const { matrix, monthsInYear, prevYear, createdByMonth, resolvedByMonth, herdadosByMonth, totalResolvedByCreation, totalPendingByCreation, productivityRate, resolvedInSameMonth, acumuladoByMonth } = data;
        
        // Calcular totais gerais
        let totalCreatedYear = 0;
        let totalResolvedYear = 0;
        
        monthsInYear.forEach(m => {
            totalCreatedYear += createdByMonth[m] || 0;
            totalResolvedYear += resolvedByMonth[m] || 0;
        });
        
        const teamLabel = this.selectedTeam === 'all' ? 'Geral' : this.selectedTeam;
        
        // Gerar HTML
        container.innerHTML = `
            <div style="padding: 1rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:1rem;">
                    <div>
                        <h2 style="margin:0;color:#f4f4f5;font-size:1.3rem;">📊 Matriz de Produtividade ${this.currentYear}</h2>
                        <p style="margin:4px 0 0;color:#94a3b8;font-size:0.85rem;">Tickets tratados vs Atribuído Acumulado - <span style="color:#0ea5e9;font-weight:600;">${teamLabel}</span></p>
                    </div>
                    <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
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
                    ${this.renderTable(data)}
                </div>
                
                <div style="margin-top:1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
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
                </div>
                
                <div style="margin-top:1rem;padding:1rem;background:#1e293b;border-radius:8px;border:1px solid #334155;">
                    <div style="font-size:0.8rem;color:#94a3b8;">
                        <strong>Legenda:</strong><br>
                        • <span style="color:#1e3a5f;">■</span> Células azuis = tickets resolvidos<br>
                        • <strong>Colunas</strong> = mês de criação do ticket<br>
                        • <strong>Linhas</strong> = mês da tratativa (resolução)<br>
                        • <span style="color:#10b981;">Verde</span> = % > 100% | <span style="color:#f59e0b;">Amarelo</span> = 90-100% | <span style="color:#ef4444;">Vermelho</span> = < 90%
                    </div>
                </div>
            </div>
        `;
    },
    
    renderTable(data) {
        const { matrix, monthsInYear, prevYear, createdByMonth, resolvedByMonth, herdadosByMonth, totalResolvedByCreation, totalPendingByCreation, productivityRate, resolvedInSameMonth, acumuladoByMonth } = data;
        
        const allCreationMonths = [`${prevYear}`, ...monthsInYear];
        const shortMonths = { '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez' };
        
        let html = '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;">';
        
        // Header
        html += '<thead><tr style="background:#0d4a6b;">';
        html += '<th style="padding:8px;color:#fff;text-align:left;border:1px solid #1e5f8a;min-width:120px;">Mês da Tratativa ↓</th>';
        html += `<th style="padding:8px;color:#fff;text-align:center;border:1px solid #1e5f8a;background:#0a3d5c;">${this.currentYear - 1}<br>Herdados</th>`;
        
        monthsInYear.forEach(m => {
            const [, month] = m.split('-');
            html += `<th style="padding:8px;color:#fff;text-align:center;border:1px solid #1e5f8a;">${shortMonths[month]}</th>`;
        });
        
        html += '<th style="padding:8px;color:#fff;text-align:center;border:1px solid #1e5f8a;background:#065f46;">Resolvido<br>dentro do mês</th>';
        html += '<th style="padding:8px;color:#fff;text-align:center;border:1px solid #1e5f8a;background:#065f46;">Total<br>Herdados</th>';
        html += '<th style="padding:8px;color:#fff;text-align:center;border:1px solid #1e5f8a;background:#065f46;">Acumulado<br>Tratativas</th>';
        html += `<th style="padding:8px;color:#fff;text-align:center;border:1px solid #1e5f8a;background:#7c3aed;">Criado<br>${this.currentYear}</th>`;
        html += '<th style="padding:8px;color:#fff;text-align:center;border:1px solid #1e5f8a;background:#7c3aed;">%Tratativas</th>';
        html += '</tr></thead>';
        
        // Body
        html += '<tbody>';
        
        // Linha de totais de criação (header secundário)
        html += '<tr style="background:#1e3a5f;color:#94a3b8;font-size:0.7rem;">';
        html += '<td style="padding:4px 8px;border:1px solid #334155;">Contagem Abertura</td>';
        html += `<td style="padding:4px;text-align:center;border:1px solid #334155;">${createdByMonth[`${prevYear}`] || 0}</td>`;
        monthsInYear.forEach(m => {
            html += `<td style="padding:4px;text-align:center;border:1px solid #334155;">${createdByMonth[m] || 0}</td>`;
        });
        html += '<td colspan="5" style="border:1px solid #334155;"></td>';
        html += '</tr>';
        
        // Linhas de dados por mês de tratativa
        monthsInYear.forEach((treatMonth, idx) => {
            const [year, month] = treatMonth.split('-');
            const rowData = matrix[treatMonth];
            
            const createdThisMonth = createdByMonth[treatMonth] || 0;
            const resolvedThisMonth = resolvedByMonth[treatMonth] || 0;
            const herdados = herdadosByMonth[treatMonth] || 0;
            const acumulado = acumuladoByMonth[treatMonth] || 0;
            const pctRate = parseFloat(productivityRate[treatMonth] || 0);
            const pctColor = pctRate >= 100 ? '#10b981' : pctRate >= 97 ? '#84cc16' : pctRate >= 95 ? '#f59e0b' : pctRate >= 90 ? '#fb923c' : '#ef4444';
            
            html += `<tr style="background:${idx % 2 === 0 ? '#0f172a' : '#1e293b'};">`;
            html += `<td style="padding:8px;color:#e2e8f0;border:1px solid #334155;font-weight:500;">${shortMonths[month]}. de ${year}</td>`;
            
            // Células da matriz
            allCreationMonths.forEach(createMonth => {
                const value = rowData.byCreationMonth[createMonth] || 0;
                const isDiagonal = createMonth === treatMonth;
                const isBeforeTreat = createMonth <= treatMonth;
                
                let cellStyle = 'padding:6px;text-align:center;border:1px solid #334155;';
                if (value > 0 && isBeforeTreat) {
                    cellStyle += 'background:#1e3a5f;color:#60a5fa;font-weight:600;';
                } else if (isDiagonal) {
                    cellStyle += 'background:#1e3a5f;color:#60a5fa;';
                } else if (!isBeforeTreat) {
                    cellStyle += 'background:#1e293b;color:#475569;';
                } else {
                    cellStyle += 'color:#64748b;';
                }
                
                html += `<td style="${cellStyle}">${value > 0 ? value : ''}</td>`;
            });
            
            // Colunas de resumo - Ticket (diagonal), Herdados, Acumulado, Criado, %Resolvido
            const ticketDiagonal = resolvedInSameMonth[treatMonth] || 0;
            html += `<td style="padding:6px;text-align:center;border:1px solid #334155;background:#065f46;color:#10b981;font-weight:600;">${ticketDiagonal}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid #334155;background:#064e3b;color:#6ee7b7;">${herdados}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid #334155;background:#064e3b;color:#6ee7b7;">${acumulado}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid #334155;background:#5b21b6;color:#c4b5fd;">${createdThisMonth}</td>`;
            html += `<td style="padding:6px;text-align:center;border:1px solid #334155;background:${pctColor}22;color:${pctColor};font-weight:600;">${pctRate.toFixed(0)}%</td>`;
            html += '</tr>';
        });
        
        // Linha de totais resolvidos
        html += '<tr style="background:#0d4a6b;font-weight:600;">';
        html += '<td style="padding:8px;color:#fff;border:1px solid #1e5f8a;">✓ TOTAL RESOLVIDO</td>';
        allCreationMonths.forEach(cm => {
            html += `<td style="padding:6px;text-align:center;border:1px solid #1e5f8a;color:#10b981;">${totalResolvedByCreation[cm] || 0}</td>`;
        });
        const totalResolved = Object.values(totalResolvedByCreation).reduce((a, b) => a + b, 0);
        html += `<td colspan="3" style="padding:6px;text-align:center;border:1px solid #1e5f8a;color:#10b981;">${totalResolved}</td>`;
        html += '<td colspan="2" style="border:1px solid #1e5f8a;"></td>';
        html += '</tr>';
        
        // Linha de pendentes
        html += '<tr style="background:#7f1d1d;">';
        html += '<td style="padding:8px;color:#fca5a5;border:1px solid #991b1b;">⚠ TOTAL PENDENTE</td>';
        allCreationMonths.forEach(cm => {
            const pending = totalPendingByCreation[cm] || 0;
            html += `<td style="padding:6px;text-align:center;border:1px solid #991b1b;color:${pending > 0 ? '#fca5a5' : '#64748b'};">${pending}</td>`;
        });
        const totalPending = Object.values(totalPendingByCreation).reduce((a, b) => a + b, 0);
        html += `<td colspan="3" style="padding:6px;text-align:center;border:1px solid #991b1b;color:#fca5a5;">${totalPending}</td>`;
        html += '<td colspan="2" style="border:1px solid #991b1b;"></td>';
        html += '</tr>';
        
        // Linha de % resolução por mês de criação (diagonal / criado)
        html += '<tr style="background:#1e293b;">';
        html += '<td style="padding:8px;color:#94a3b8;border:1px solid #334155;font-size:0.7rem;">% Resolução no mês</td>';
        html += '<td style="border:1px solid #334155;"></td>'; // Coluna ano anterior
        monthsInYear.forEach(cm => {
            const created = createdByMonth[cm] || 0;
            const diagonal = resolvedInSameMonth[cm] || 0;
            const rate = created > 0 ? ((diagonal / created) * 100).toFixed(0) : '0';
            const rateNum = parseFloat(rate);
            const color = rateNum >= 80 ? '#10b981' : rateNum >= 60 ? '#f59e0b' : '#ef4444';
            html += `<td style="padding:6px;text-align:center;border:1px solid #334155;color:${color};font-size:0.7rem;">${rate}%</td>`;
        });
        html += '<td colspan="5" style="border:1px solid #334155;"></td>';
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
    
    init() {
        console.log('📊 BI Productivity Matrix initialized');
    }
};

window.BIProductivityMatrix.init();
