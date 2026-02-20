/**
 * Módulo CSAT - Customer Satisfaction
 * Busca e processa dados de satisfação do Freshdesk
 */

window.CSATModule = {
    // Cache dos dados
    _cache: null,
    _cacheTime: null,
    _cacheDuration: 5 * 60 * 1000, // 5 minutos
    
    // URL do proxy
    proxyUrl: 'http://localhost:3003',
    
    /**
     * Busca todas as avaliações de satisfação
     * @param {boolean} forceRefresh - Força atualização ignorando cache
     * @returns {Promise<Object>} - Dados de satisfação com estatísticas
     */
    async fetchRatings(forceRefresh = false) {
        // Verificar cache
        if (!forceRefresh && this._cache && this._cacheTime) {
            const age = Date.now() - this._cacheTime;
            if (age < this._cacheDuration) {
                console.log('📦 CSAT: Usando dados do cache');
                return this._cache;
            }
        }
        
        try {
            console.log('⭐ CSAT: Buscando avaliações de satisfação...');
            
            const response = await fetch(`${this.proxyUrl}/api/satisfaction-ratings`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Processar dados adicionais
                data.processed = this.processRatings(data.ratings);
                
                // Salvar no cache
                this._cache = data;
                this._cacheTime = Date.now();
                
                console.log(`✅ CSAT: ${data.total} avaliações carregadas`);
                return data;
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }
            
        } catch (error) {
            console.error('❌ CSAT: Erro ao buscar avaliações:', error);
            throw error;
        }
    },
    
    /**
     * Processa os ratings para extrair métricas úteis
     */
    processRatings(ratings) {
        const processed = {
            // Por período
            byMonth: {},
            byYear: {},
            
            // Por ticket
            byTicket: {},
            
            // Por agente (se disponível)
            byAgent: {},
            
            // Tendência (últimos 6 meses)
            trend: [],
            
            // Feedback textual
            feedback: []
        };
        
        ratings.forEach(rating => {
            const createdAt = new Date(rating.created_at);
            const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
            const yearKey = createdAt.getFullYear().toString();
            const score = rating.ratings?.default_question || 0;
            
            // Por mês
            if (!processed.byMonth[monthKey]) {
                processed.byMonth[monthKey] = { total: 0, satisfied: 0, scores: [] };
            }
            processed.byMonth[monthKey].total++;
            processed.byMonth[monthKey].scores.push(score);
            if (score >= 4) processed.byMonth[monthKey].satisfied++;
            
            // Por ano
            if (!processed.byYear[yearKey]) {
                processed.byYear[yearKey] = { total: 0, satisfied: 0, scores: [] };
            }
            processed.byYear[yearKey].total++;
            processed.byYear[yearKey].scores.push(score);
            if (score >= 4) processed.byYear[yearKey].satisfied++;
            
            // Por ticket
            if (rating.ticket_id) {
                processed.byTicket[rating.ticket_id] = {
                    score: score,
                    createdAt: rating.created_at,
                    feedback: rating.feedback || null
                };
            }
            
            // Feedback textual
            if (rating.feedback) {
                processed.feedback.push({
                    ticketId: rating.ticket_id,
                    score: score,
                    text: rating.feedback,
                    date: rating.created_at
                });
            }
        });
        
        // Calcular CSAT % por mês
        Object.keys(processed.byMonth).forEach(month => {
            const data = processed.byMonth[month];
            data.csatPercent = data.total > 0 ? Math.round((data.satisfied / data.total) * 100) : 0;
            data.avgScore = data.scores.length > 0 ? 
                (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1) : 0;
        });
        
        // Calcular tendência (últimos 6 meses)
        const sortedMonths = Object.keys(processed.byMonth).sort().slice(-6);
        processed.trend = sortedMonths.map(month => ({
            month,
            ...processed.byMonth[month]
        }));
        
        return processed;
    },
    
    /**
     * Obtém a satisfação de um ticket específico
     */
    async getTicketRating(ticketId) {
        try {
            const response = await fetch(`${this.proxyUrl}/api/tickets/${ticketId}/satisfaction-rating`);
            return await response.json();
        } catch (error) {
            console.error(`❌ CSAT: Erro ao buscar satisfação do ticket #${ticketId}:`, error);
            return null;
        }
    },
    
    /**
     * Vincula ratings aos tickets carregados
     * @param {Array} tickets - Array de tickets
     * @returns {Array} - Tickets com rating de satisfação vinculado
     */
    async enrichTicketsWithCSAT(tickets) {
        try {
            const data = await this.fetchRatings();
            
            return tickets.map(ticket => {
                const rating = data.processed.byTicket[ticket.id];
                return {
                    ...ticket,
                    csat_score: rating?.score || null,
                    csat_feedback: rating?.feedback || null
                };
            });
        } catch (error) {
            console.warn('⚠️ CSAT: Não foi possível enriquecer tickets com CSAT');
            return tickets;
        }
    },
    
    /**
     * Renderiza card de CSAT para o dashboard
     */
    renderCSATCard(containerId) {
        this.fetchRatings().then(data => {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const stats = data.stats;
            const csatColor = stats.csatPercent >= 80 ? '#10b981' : 
                             stats.csatPercent >= 60 ? '#f59e0b' : '#ef4444';
            
            container.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-radius: 12px;
                    padding: 1.5rem;
                    border: 1px solid #334155;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="color: #f1f5f9; margin: 0; font-size: 1rem;">⭐ Satisfação do Cliente</h3>
                        <span style="color: #64748b; font-size: 0.75rem;">${stats.total} avaliações</span>
                    </div>
                    
                    <div style="font-size: 2.5rem; font-weight: bold; color: ${csatColor}; margin-bottom: 1rem;">
                        ${stats.csatPercent}%
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.875rem;">
                        <div style="text-align: center;">
                            <div style="color: #10b981; font-weight: bold;">${stats.satisfied}</div>
                            <div style="color: #64748b;">Satisfeitos</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #f59e0b; font-weight: bold;">${stats.neutral}</div>
                            <div style="color: #64748b;">Neutros</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #ef4444; font-weight: bold;">${stats.dissatisfied}</div>
                            <div style="color: #64748b;">Insatisf.</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem; height: 8px; background: #334155; border-radius: 4px; overflow: hidden;">
                        <div style="
                            width: ${stats.csatPercent}%;
                            height: 100%;
                            background: linear-gradient(90deg, ${csatColor}, ${csatColor}aa);
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                </div>
            `;
        }).catch(err => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div style="
                        background: #1e293b;
                        border-radius: 12px;
                        padding: 1.5rem;
                        border: 1px solid #334155;
                        text-align: center;
                        color: #64748b;
                    ">
                        <div>⚠️ Não foi possível carregar dados de CSAT</div>
                        <div style="font-size: 0.75rem; margin-top: 0.5rem;">Inicie o proxy: node freshdesk-proxy.js</div>
                    </div>
                `;
            }
        });
    },
    
    /**
     * Renderiza gráfico de tendência CSAT
     */
    renderCSATTrendChart(canvasId) {
        this.fetchRatings().then(data => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const trend = data.processed.trend;
            
            if (trend.length === 0) {
                ctx.fillStyle = '#64748b';
                ctx.font = '14px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('Sem dados de tendência', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            const width = canvas.width;
            const height = canvas.height;
            const padding = { top: 20, right: 20, bottom: 40, left: 50 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            
            // Limpar canvas
            ctx.clearRect(0, 0, width, height);
            
            // Desenhar eixos
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, height - padding.bottom);
            ctx.lineTo(width - padding.right, height - padding.bottom);
            ctx.stroke();
            
            // Linha de meta (80%)
            const metaY = padding.top + chartHeight * (1 - 0.8);
            ctx.strokeStyle = '#f59e0b';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding.left, metaY);
            ctx.lineTo(width - padding.right, metaY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Desenhar linha de CSAT
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            trend.forEach((point, i) => {
                const x = padding.left + (i / (trend.length - 1 || 1)) * chartWidth;
                const y = padding.top + chartHeight * (1 - point.csatPercent / 100);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            
            // Pontos
            trend.forEach((point, i) => {
                const x = padding.left + (i / (trend.length - 1 || 1)) * chartWidth;
                const y = padding.top + chartHeight * (1 - point.csatPercent / 100);
                
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Label do mês
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(point.month.slice(5), x, height - padding.bottom + 15);
                
                // Valor
                ctx.fillText(point.csatPercent + '%', x, y - 10);
            });
            
        }).catch(err => {
            console.error('Erro ao renderizar tendência CSAT:', err);
        });
    }
};

console.log('✅ CSATModule carregado - Use window.CSATModule.fetchRatings() para buscar dados');
