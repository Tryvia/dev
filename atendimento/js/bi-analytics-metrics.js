// Métricas e Análises Adicionais para BI Analytics

// Verificar se BIAnalytics existe antes de adicionar métodos
if (typeof BIAnalytics === 'undefined') {
    console.error('❌ BIAnalytics não está definido! bi-analytics.js deve ser carregado antes deste arquivo.');
} else {
    console.log('✅ Adicionando métricas avançadas ao BIAnalytics...');
}

// Adicionar métodos à classe BIAnalytics
if (typeof BIAnalytics !== 'undefined') {
Object.assign(BIAnalytics.prototype, {
    
    // Cálculo de métricas avançadas
    calculateAdvancedMetrics() {
        const metrics = {
            // Métricas de Tempo
            avgResponseTime: this.calculateAverageResponseTime(),
            avgResolutionTime: this.calculateAverageResolutionTime(),
            slaCompliance: this.calculateSLACompliance(),
            
            // Métricas de Volume
            ticketsPerDay: this.calculateTicketsPerDay(),
            peakHours: this.calculatePeakHours(),
            
            // Métricas de Produtividade
            productivityIndex: this.calculateProductivityIndex(),
            workloadDistribution: this.calculateWorkloadDistribution(),
            
            // Métricas de Tendência
            trend: this.calculateTrend(),
            forecast: this.calculateForecast()
        };
        
        return metrics;
    },
    
    calculateAverageResponseTime() {
        let totalTime = 0;
        let count = 0;
        
        this.filteredData.forEach(ticket => {
            const responseTime = this.getResponseTimeMs ? this.getResponseTimeMs(ticket) : null;
            if (responseTime !== null && responseTime > 0) {
                totalTime += responseTime;
                count++;
            }
        });
        
        if (count === 0) return 0;
        
        const avgMs = totalTime / count;
        const avgHours = avgMs / (1000 * 60 * 60);
        return Math.round(avgHours * 10) / 10; // Retorna em horas com 1 decimal
    },
    
    calculateAverageResolutionTime() {
        let totalTime = 0;
        let count = 0;
        
        // Usar resolvedInPeriod para calcular tempo médio dos tickets RESOLVIDOS no período
        const ticketsToAnalyze = this.resolvedInPeriod || this.filteredData;
        
        ticketsToAnalyze.forEach(ticket => {
            const resolutionTime = this.getResolutionTimeMs
                ? this.getResolutionTimeMs(ticket, true)
                : (ticket.stats_resolved_at && ticket.created_at
                    ? (new Date(ticket.stats_resolved_at) - new Date(ticket.created_at))
                    : null);

            if (resolutionTime && resolutionTime > 0) {
                totalTime += resolutionTime;
                count++;
            }
        });
        
        if (count === 0) return 0;
        
        const avgMs = totalTime / count;
        const avgHours = avgMs / (1000 * 60 * 60);
        return Math.round(avgHours * 10) / 10;
    },
    
    calculateSLACompliance() {
        let withinSLA = 0;
        let total = 0;
        
        this.filteredData.forEach(ticket => {
            const slaStatus = this.isWithinSLA ? this.isWithinSLA(ticket, 4) : null;
            if (slaStatus === null) return;
            total++;
            if (slaStatus) withinSLA++;
        });
        
        if (total === 0) return 100;
        return Math.round((withinSLA / total) * 100);
    },
    
    calculateTicketsPerDay() {
        const dayMap = new Map();
        
        this.filteredData.forEach(ticket => {
            if (ticket.created_at) {
                const date = new Date(ticket.created_at).toISOString().split('T')[0];
                dayMap.set(date, (dayMap.get(date) || 0) + 1);
            }
        });
        
        if (dayMap.size === 0) return 0;
        
        const total = Array.from(dayMap.values()).reduce((a, b) => a + b, 0);
        return Math.round(total / dayMap.size);
    },
    
    calculatePeakHours() {
        const hourMap = new Map();
        
        this.filteredData.forEach(ticket => {
            if (ticket.created_at) {
                const hour = new Date(ticket.created_at).getHours();
                hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
            }
        });
        
        let maxHour = 0;
        let maxCount = 0;
        
        hourMap.forEach((count, hour) => {
            if (count > maxCount) {
                maxCount = count;
                maxHour = hour;
            }
        });
        
        return {
            hour: maxHour,
            count: maxCount,
            label: `${maxHour}:00 - ${maxHour + 1}:00`
        };
    },
    
    // REMOVIDO: calculateReopenRate - não temos dados reais de reabertura
    // REMOVIDO: calculateFirstContactResolution - requer dados de interações que não temos
    
    calculateProductivityIndex() {
        // Índice de produtividade baseado em tickets RESOLVIDOS NO PERÍODO
        // Usa resolvedInPeriod em vez de filtrar filteredData novamente
        const resolved = (this.resolvedInPeriod || []).length;
        const avgTime = this.calculateAverageResolutionTime();
        
        if (avgTime === 0 || resolved === 0) return 0;
        
        // Fórmula: tickets resolvidos / tempo médio * 10
        // Quanto mais resolvido em menos tempo, maior o índice
        const index = (resolved / avgTime) * 10;
        return Math.min(100, Math.round(index));
    },
    
    calculateWorkloadDistribution() {
        const distribution = new Map();
        
        this.filteredData.forEach(ticket => {
            // Usar APENAS cf_tratativa ou cf_grupo_tratativa (sem fallback)
            const entityField = this.currentView === 'pessoa' ?
                ticket.cf_tratativa :
                ticket.cf_grupo_tratativa;
            const entities = entityField ? entityField.split(/[,;\/]/).map(e => e.trim()).filter(e => e) : [];
            
            entities.forEach(entity => {
                if (this.selectedEntities.has(entity)) {
                    distribution.set(entity, (distribution.get(entity) || 0) + 1);
                }
            });
        });
        
        const total = this.filteredData.length;
        const result = {};
        
        distribution.forEach((count, entity) => {
            result[entity] = {
                count: count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            };
        });
        
        return result;
    },
    
    calculateTrend() {
        // Calcular tendência dos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recent = this.filteredData.filter(ticket => {
            if (!ticket.created_at) return false;
            return new Date(ticket.created_at) >= thirtyDaysAgo;
        });
        
        const older = this.filteredData.filter(ticket => {
            if (!ticket.created_at) return false;
            return new Date(ticket.created_at) < thirtyDaysAgo;
        });
        
        if (older.length === 0) return 'stable';
        
        const growth = ((recent.length - older.length) / older.length) * 100;
        
        if (growth > 10) return 'increasing';
        if (growth < -10) return 'decreasing';
        return 'stable';
    },
    
    calculateForecast() {
        // Previsão simples para próximos 7 dias
        const avgPerDay = this.calculateTicketsPerDay();
        return {
            nextWeek: avgPerDay * 7,
            nextMonth: avgPerDay * 30,
            confidence: 'medium'
        };
    },
    
    // Renderizar cards de métricas adicionais
    renderAdvancedMetricsCards() {
        const metrics = this.calculateAdvancedMetrics();
        
        const cards = `
            <!-- Métricas de Tempo -->
            <div class="bi-metrics-section" style="margin: 2rem 0;">
                <h3 style="color: ${this.colors.text}; margin-bottom: 1rem;">⏱️ Métricas de Tempo</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.primary};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Tempo Médio de Resposta</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ${metrics.avgResponseTime}h
                        </div>
                        <div style="color: ${metrics.avgResponseTime <= 4 ? this.colors.secondary : this.colors.danger}; font-size: 0.875rem;">
                            ${metrics.avgResponseTime <= 4 ? '✓ Dentro do SLA' : '⚠️ Acima do SLA'}
                        </div>
                    </div>
                    
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.secondary};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Tempo Médio de Resolução</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ${metrics.avgResolutionTime}h
                        </div>
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">
                            ${metrics.avgResolutionTime <= 24 ? 'Excelente' : metrics.avgResolutionTime <= 48 ? 'Bom' : 'Precisa melhorar'}
                        </div>
                    </div>
                    
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.accent};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Conformidade SLA</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ${metrics.slaCompliance}%
                        </div>
                        <div style="
                            width: 100%;
                            height: 6px;
                            background: ${this.colors.border};
                            border-radius: 3px;
                            overflow: hidden;
                            margin-top: 0.5rem;
                        ">
                            <div style="
                                width: ${metrics.slaCompliance}%;
                                height: 100%;
                                background: ${metrics.slaCompliance >= 90 ? this.colors.secondary : 
                                           metrics.slaCompliance >= 70 ? this.colors.accent : this.colors.danger};
                            "></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Métricas de Volume -->
            <div class="bi-metrics-section" style="margin: 2rem 0;">
                <h3 style="color: ${this.colors.text}; margin-bottom: 1rem;">📊 Métricas de Volume</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.primary};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Tickets por Dia</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ${metrics.ticketsPerDay}
                        </div>
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">
                            Média diária
                        </div>
                    </div>
                    
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.accent};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Horário de Pico</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ${metrics.peakHours.label}
                        </div>
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">
                            ${metrics.peakHours.count} tickets
                        </div>
                    </div>
                    
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.secondary};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Tendência</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ${metrics.trend === 'increasing' ? '📈 Crescente' : 
                              metrics.trend === 'decreasing' ? '📉 Decrescente' : '➡️ Estável'}
                        </div>
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">
                            Últimos 30 dias
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Métricas de Produtividade -->
            <div class="bi-metrics-section" style="margin: 2rem 0;">
                <h3 style="color: ${this.colors.text}; margin-bottom: 1rem;">📈 Métricas de Produtividade</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.primary};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Índice de Produtividade</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ${metrics.productivityIndex}
                        </div>
                        <div style="
                            width: 100%;
                            height: 6px;
                            background: ${this.colors.border};
                            border-radius: 3px;
                            overflow: hidden;
                            margin-top: 0.5rem;
                        ">
                            <div style="
                                width: ${metrics.productivityIndex}%;
                                height: 100%;
                                background: linear-gradient(90deg, ${this.colors.primary}, ${this.colors.secondary});
                            "></div>
                        </div>
                    </div>
                    
                    <div class="bi-metric-card" style="
                        background: ${this.colors.surface};
                        padding: 1.5rem;
                        border-radius: 12px;
                        border-left: 4px solid ${this.colors.secondary};
                    ">
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">Previsão Próxima Semana</div>
                        <div style="font-size: 2rem; font-weight: bold; color: ${this.colors.text}; margin: 0.5rem 0;">
                            ~${metrics.forecast.nextWeek}
                        </div>
                        <div style="color: ${this.colors.textMuted}; font-size: 0.875rem;">
                            tickets esperados
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return cards;
    }
});
} // Fechamento do if (typeof BIAnalytics !== 'undefined')
