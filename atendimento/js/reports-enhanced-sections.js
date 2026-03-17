/**
 * Reports Enhanced Sections - Seções HTML para Métricas Avançadas
 * Renderiza as novas seções de relatório usando dados de ReportsEnhancedMetrics
 */

window.ReportsEnhancedSections = {

    // ============================================
    // SEÇÃO: TIME ENTRIES (Horas Trabalhadas)
    // ============================================
    
    renderTimeEntriesSection(timeEntries, colors) {
        if (!timeEntries || timeEntries.ticketsWithTime === 0) {
            return '';
        }

        const topConsumers = timeEntries.topTimeConsumers || [];

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                <span style="font-size: 1.1rem;">⏱️</span> Horas Trabalhadas (Time Entries)
            </h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                Tempo real registrado pelos agentes nos tickets. Dados do Freshdesk Time Tracking.
            </p>
            
            <!-- KPIs de Tempo -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: ${colors.border}30; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${timeEntries.totalHours}h</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Total de Horas</div>
                </div>
                <div style="background: ${colors.border}30; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${timeEntries.ticketsWithTime}</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Tickets com Horas</div>
                </div>
                <div style="background: ${colors.border}30; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${timeEntries.avgHoursPerTicket}h</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Média por Ticket</div>
                </div>
                <div style="background: ${colors.border}30; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #8b5cf6;">${timeEntries.ticketsWithoutTime}</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Sem Horas Registradas</div>
                </div>
            </div>

            ${topConsumers.length > 0 ? `
            <!-- Top Consumidores de Tempo -->
            <h5 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: ${colors.text};">🔥 Tickets com Mais Horas</h5>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid ${colors.border};">
                            <th style="text-align: left; padding: 0.5rem; color: ${colors.textMuted};">Ticket</th>
                            <th style="text-align: left; padding: 0.5rem; color: ${colors.textMuted};">Assunto</th>
                            <th style="text-align: center; padding: 0.5rem; color: ${colors.textMuted};">Horas</th>
                            <th style="text-align: center; padding: 0.5rem; color: ${colors.textMuted};">Agentes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topConsumers.slice(0, 5).map(t => `
                        <tr style="border-bottom: 1px solid ${colors.border}30;">
                            <td style="padding: 0.5rem; color: #3b82f6;">#${t.ticketId}</td>
                            <td style="padding: 0.5rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${(t.subject || '').substring(0, 50)}...</td>
                            <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #ef4444;">${(t.minutes / 60).toFixed(1)}h</td>
                            <td style="padding: 0.5rem; text-align: center;">${t.agents}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>
        `;
    },

    // ============================================
    // SEÇÃO: ANÁLISE POR EMPRESA
    // ============================================
    
    renderCompaniesSection(companies, colors) {
        if (!companies || companies.length === 0) {
            return '';
        }

        const topCompanies = companies.slice(0, 10);

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                <span style="font-size: 1.1rem;">🏢</span> Análise por Empresa/Cliente
            </h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                Performance e volume de tickets por empresa. Identifique clientes que precisam de atenção.
            </p>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid ${colors.border}; background: ${colors.border}30;">
                            <th style="text-align: left; padding: 0.6rem; color: ${colors.textMuted};">Empresa</th>
                            <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Total</th>
                            <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Resolvidos</th>
                            <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Pendentes</th>
                            <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Taxa</th>
                            <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">SLA</th>
                            <th style="text-align: center; padding: 0.6rem; color: ${colors.textMuted};">Urgentes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topCompanies.map((c, i) => {
                            const rate = parseFloat(c.resolutionRate);
                            const sla = c.slaRate ? parseFloat(c.slaRate) : null;
                            const rateColor = rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444';
                            const slaColor = sla === null ? colors.textMuted : sla >= 80 ? '#10b981' : sla >= 60 ? '#f59e0b' : '#ef4444';
                            return `
                            <tr style="border-bottom: 1px solid ${colors.border}30;">
                                <td style="padding: 0.6rem; font-weight: ${i < 3 ? '600' : '400'};">
                                    ${i < 3 ? ['🥇', '🥈', '🥉'][i] : ''} ${c.name}
                                </td>
                                <td style="padding: 0.6rem; text-align: center; font-weight: 600; color: #3b82f6;">${c.total}</td>
                                <td style="padding: 0.6rem; text-align: center; color: #10b981;">${c.resolved}</td>
                                <td style="padding: 0.6rem; text-align: center; color: #f59e0b;">${c.pending}</td>
                                <td style="padding: 0.6rem; text-align: center;">
                                    <span style="background: ${rateColor}20; color: ${rateColor}; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">${c.resolutionRate}%</span>
                                </td>
                                <td style="padding: 0.6rem; text-align: center;">
                                    <span style="color: ${slaColor}; font-weight: 500;">${sla !== null ? sla + '%' : '-'}</span>
                                </td>
                                <td style="padding: 0.6rem; text-align: center;">
                                    ${c.urgent > 0 ? `<span style="background: #ef444420; color: #ef4444; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.75rem;">${c.urgent}</span>` : '-'}
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    },

    // ============================================
    // SEÇÃO: SLA DE RESOLUÇÃO
    // ============================================
    
    renderResolutionSLASection(resolutionSLA, colors) {
        if (!resolutionSLA || resolutionSLA.total === 0) {
            return '';
        }

        const { byPriority } = resolutionSLA;
        const priorities = [
            { key: 'urgent', label: 'Urgente', color: '#ef4444', limit: '4h' },
            { key: 'high', label: 'Alta', color: '#f59e0b', limit: '8h' },
            { key: 'medium', label: 'Média', color: '#3b82f6', limit: '24h' },
            { key: 'low', label: 'Baixa', color: '#10b981', limit: '72h' }
        ];

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                <span style="font-size: 1.1rem;">🎯</span> SLA de Resolução por Prioridade
            </h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                Análise do tempo de resolução comparado ao SLA esperado por nível de prioridade.
            </p>
            
            <!-- Resumo Geral -->
            <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; background: ${parseFloat(resolutionSLA.rate) >= 80 ? '#10b98115' : '#f59e0b15'}; border-radius: 10px; margin-bottom: 1.5rem;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: ${parseFloat(resolutionSLA.rate) >= 80 ? '#10b981' : '#f59e0b'}; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 1.1rem; font-weight: 700; color: white;">${resolutionSLA.rate}%</span>
                </div>
                <div>
                    <div style="font-weight: 600; color: ${colors.text};">Taxa de Cumprimento SLA Resolução</div>
                    <div style="font-size: 0.85rem; color: ${colors.textMuted};">
                        ${resolutionSLA.withinSLA} de ${resolutionSLA.total} tickets resolvidos dentro do prazo
                    </div>
                </div>
            </div>

            <!-- Por Prioridade -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                ${priorities.map(p => {
                    const data = byPriority[p.key];
                    const rate = data?.rate || 0;
                    const rateNum = parseFloat(rate);
                    return `
                    <div style="background: ${p.color}10; border: 1px solid ${p.color}30; border-radius: 10px; padding: 1rem; text-align: center;">
                        <div style="font-size: 0.75rem; color: ${colors.textMuted}; text-transform: uppercase; margin-bottom: 0.25rem;">${p.label}</div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${p.color};">${rate || 0}%</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">
                            ${data?.within || 0}/${data?.total || 0} no prazo
                        </div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted}; margin-top: 0.25rem;">
                            Média: ${data?.avgHours || '-'}h (SLA: ${p.limit})
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    },

    // ============================================
    // SEÇÃO: ESCALAÇÕES
    // ============================================
    
    renderEscalationsSection(escalations, colors) {
        if (!escalations || escalations.escalated === 0) {
            return '';
        }

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                <span style="font-size: 1.1rem;">🚨</span> Análise de Escalações
            </h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                Tickets que foram escalados. Taxa alta pode indicar problemas de capacitação ou processos.
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: #ef444415; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: #ef4444;">${escalations.escalated}</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Tickets Escalados</div>
                </div>
                <div style="background: ${colors.border}30; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${colors.text};">${escalations.rate}%</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Taxa de Escalação</div>
                </div>
                <div style="background: #10b98115; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: #10b981;">${escalations.notEscalated}</div>
                    <div style="font-size: 0.75rem; color: ${colors.textMuted};">Sem Escalação</div>
                </div>
            </div>

            ${escalations.byAgent.length > 0 ? `
            <h5 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: ${colors.textMuted};">Escalações por Agente</h5>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${escalations.byAgent.slice(0, 8).map(a => `
                    <span style="background: #ef444420; color: #ef4444; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem;">
                        ${a.name}: ${a.count}
                    </span>
                `).join('')}
            </div>
            ` : ''}
        </div>
        `;
    },

    // ============================================
    // SEÇÃO: VELOCITY E THROUGHPUT
    // ============================================
    
    renderVelocitySection(velocity, colors) {
        if (!velocity) {
            return '';
        }

        const throughputStatus = parseFloat(velocity.throughputRatio) >= 100;
        const trendIcon = velocity.backlogTrend === 'diminuindo' ? '📉' : '📈';
        const trendColor = velocity.backlogTrend === 'diminuindo' ? '#10b981' : '#ef4444';

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                <span style="font-size: 1.1rem;">⚡</span> Velocity e Throughput
            </h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                Métricas de fluxo: entrada vs saída de tickets e capacidade de processamento.
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                <div style="background: #3b82f615; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${velocity.velocity}</div>
                    <div style="font-size: 0.7rem; color: ${colors.textMuted};">Velocity</div>
                    <div style="font-size: 0.65rem; color: ${colors.textMuted};">tickets/dia útil</div>
                </div>
                <div style="background: #f59e0b15; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${velocity.inputRate}</div>
                    <div style="font-size: 0.7rem; color: ${colors.textMuted};">Entrada</div>
                    <div style="font-size: 0.65rem; color: ${colors.textMuted};">novos no período</div>
                </div>
                <div style="background: #10b98115; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${velocity.outputRate}</div>
                    <div style="font-size: 0.7rem; color: ${colors.textMuted};">Saída</div>
                    <div style="font-size: 0.65rem; color: ${colors.textMuted};">resolvidos no período</div>
                </div>
                <div style="background: ${throughputStatus ? '#10b98115' : '#ef444415'}; border-radius: 10px; padding: 1rem; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${throughputStatus ? '#10b981' : '#ef4444'};">${velocity.throughputRatio}%</div>
                    <div style="font-size: 0.7rem; color: ${colors.textMuted};">Throughput</div>
                    <div style="font-size: 0.65rem; color: ${colors.textMuted};">${trendIcon} Backlog ${velocity.backlogTrend}</div>
                </div>
            </div>
        </div>
        `;
    },

    // ============================================
    // SEÇÃO: DISTRIBUIÇÃO POR CANAL
    // ============================================
    
    renderSourcesSection(sources, colors) {
        if (!sources || sources.length === 0) {
            return '';
        }

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                <span style="font-size: 1.1rem;">📱</span> Volume por Canal de Entrada
            </h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                Distribuição de tickets por canal de origem (Email, Portal, Chat, etc).
            </p>
            
            <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                ${sources.slice(0, 6).map((s, i) => {
                    const colors_list = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
                    const color = colors_list[i % colors_list.length];
                    return `
                    <div style="flex: 1; min-width: 140px; background: ${color}10; border: 1px solid ${color}30; border-radius: 10px; padding: 1rem; text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${color};">${s.total}</div>
                        <div style="font-size: 0.8rem; font-weight: 500; color: ${colors.text};">${s.name}</div>
                        <div style="font-size: 0.7rem; color: ${colors.textMuted};">Taxa: ${s.resolutionRate}%</div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    },

    // ============================================
    // SEÇÃO: HEATMAP DE VOLUME
    // ============================================
    
    renderHeatmapSection(heatmap, colors) {
        if (!heatmap || !heatmap.peakHours) {
            return '';
        }

        return `
        <div style="background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: ${colors.text};">
                <span style="font-size: 1.1rem;">🔥</span> Horários de Pico
            </h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: ${colors.textMuted};">
                Momentos com maior volume de tickets criados. Útil para dimensionar equipe.
            </p>
            
            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                ${heatmap.peakHours.map((p, i) => `
                    <div style="background: ${i === 0 ? '#ef444420' : '#f59e0b15'}; border: 1px solid ${i === 0 ? '#ef444450' : '#f59e0b30'}; border-radius: 8px; padding: 0.75rem 1rem; text-align: center;">
                        <div style="font-size: 0.9rem; font-weight: 600; color: ${i === 0 ? '#ef4444' : '#f59e0b'};">${p.day} ${p.hour}</div>
                        <div style="font-size: 0.75rem; color: ${colors.textMuted};">${p.count} tickets</div>
                    </div>
                `).join('')}
            </div>
            
            <canvas id="chartHeatmap" width="700" height="200" style="margin-top: 1rem;"></canvas>
        </div>
        `;
    },

    // ============================================
    // MÉTODO PRINCIPAL: Renderizar todas as seções
    // ============================================
    
    renderAllSections(enhancedMetrics, colors, options = {}) {
        if (!enhancedMetrics) return '';

        const sections = [];

        // Velocity e Throughput (sempre útil)
        if (options.velocity !== false && enhancedMetrics.velocity) {
            sections.push(this.renderVelocitySection(enhancedMetrics.velocity, colors));
        }

        // Time Entries
        if (options.timeEntries !== false && enhancedMetrics.timeEntries) {
            sections.push(this.renderTimeEntriesSection(enhancedMetrics.timeEntries, colors));
        }

        // SLA de Resolução
        if (options.resolutionSLA !== false && enhancedMetrics.resolutionSLA) {
            sections.push(this.renderResolutionSLASection(enhancedMetrics.resolutionSLA, colors));
        }

        // Empresas
        if (options.companies !== false && enhancedMetrics.companies) {
            sections.push(this.renderCompaniesSection(enhancedMetrics.companies, colors));
        }

        // Escalações
        if (options.escalations !== false && enhancedMetrics.escalations) {
            sections.push(this.renderEscalationsSection(enhancedMetrics.escalations, colors));
        }

        // Canais
        if (options.sources !== false && enhancedMetrics.sources) {
            sections.push(this.renderSourcesSection(enhancedMetrics.sources, colors));
        }

        // Heatmap
        if (options.heatmap !== false && enhancedMetrics.heatmap) {
            sections.push(this.renderHeatmapSection(enhancedMetrics.heatmap, colors));
        }

        return sections.join('');
    }
};

console.log('✅ Reports Enhanced Sections carregado');
