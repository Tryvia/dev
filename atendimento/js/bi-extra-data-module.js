/**
 * BI Extra Data Module
 * Aproveita dados de tabelas pouco utilizadas: Products, Companies, BusinessHours, Conversations, Surveys
 */

window.BIExtraDataModule = {
    
    colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
        text: '#e4e4e7',
        textMuted: '#a1a1aa',
        surface: 'rgba(30, 30, 30, 0.8)',
        card: 'rgba(40, 40, 40, 0.6)',
        border: 'rgba(255, 255, 255, 0.1)'
    },
    
    // Cache de dados
    cache: {
        products: null,
        companies: null,
        businessHours: null,
        conversations: null,
        surveys: null
    },
    
    // ========================================
    // CARREGAR DADOS DO SUPABASE
    // ========================================
    
    async loadAllExtraData() {
        const supabase = window.supabaseClient;
        if (!supabase) {
            console.warn('⚠️ Supabase não disponível');
            return;
        }
        
        console.log('📦 Carregando dados extras...');
        
        await Promise.all([
            this.loadProducts(),
            this.loadCompanies(),
            this.loadBusinessHours(),
            this.loadSurveys()
        ]);
        
        console.log('✅ Dados extras carregados');
    },
    
    async loadProducts() {
        try {
            const { data, error } = await window.supabaseClient
                .from('Products')
                .select('*');
            if (!error) this.cache.products = data || [];
        } catch (e) {
            console.log('   Products: tabela não existe ou vazia');
            this.cache.products = [];
        }
    },
    
    async loadCompanies() {
        try {
            const { data, error } = await window.supabaseClient
                .from('FreshdeskCompanies')
                .select('*');
            if (!error) this.cache.companies = data || [];
        } catch (e) {
            console.log('   Companies: tabela não existe ou vazia');
            this.cache.companies = [];
        }
    },
    
    async loadBusinessHours() {
        try {
            const { data, error } = await window.supabaseClient
                .from('BusinessHours')
                .select('*');
            if (!error) this.cache.businessHours = data || [];
        } catch (e) {
            console.log('   BusinessHours: tabela não existe ou vazia');
            this.cache.businessHours = [];
        }
    },
    
    async loadSurveys() {
        try {
            const { data, error } = await window.supabaseClient
                .from('TicketSurveys')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);
            if (!error) this.cache.surveys = data || [];
        } catch (e) {
            console.log('   Surveys: tabela não existe ou vazia');
            this.cache.surveys = [];
        }
    },
    
    // ========================================
    // ANÁLISE POR PRODUTO
    // ========================================
    
    analyzeByProduct(tickets) {
        const byProduct = {};
        
        tickets.forEach(t => {
            const productId = t.product_id || 'sem_produto';
            const productName = this.getProductName(productId);
            
            if (!byProduct[productName]) {
                byProduct[productName] = {
                    total: 0,
                    open: 0,
                    closed: 0,
                    urgent: 0,
                    avgResolution: []
                };
            }
            
            byProduct[productName].total++;
            
            if ([4, 5].includes(Number(t.status))) {
                byProduct[productName].closed++;
                if (t.stats_resolved_at && t.created_at) {
                    const hours = (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                    if (hours > 0 && hours < 720) byProduct[productName].avgResolution.push(hours);
                }
            } else {
                byProduct[productName].open++;
            }
            
            if (Number(t.priority) === 4) byProduct[productName].urgent++;
        });
        
        // Calcular médias
        Object.values(byProduct).forEach(p => {
            p.avgResolutionHours = p.avgResolution.length > 0 
                ? p.avgResolution.reduce((a, b) => a + b, 0) / p.avgResolution.length 
                : 0;
            p.resolutionRate = p.total > 0 ? (p.closed / p.total * 100) : 0;
        });
        
        return byProduct;
    },
    
    getProductName(productId) {
        if (!productId || productId === 'sem_produto') return 'Sem Produto';
        const product = this.cache.products?.find(p => p.id === productId);
        return product?.name || `Produto ${productId}`;
    },
    
    // ========================================
    // ANÁLISE POR EMPRESA/CLIENTE
    // ========================================
    
    analyzeByCompany(tickets) {
        const byCompany = {};
        
        tickets.forEach(t => {
            const companyId = t.company_id;
            const companyName = this.getCompanyName(companyId);
            
            if (!byCompany[companyName]) {
                byCompany[companyName] = {
                    total: 0,
                    open: 0,
                    closed: 0,
                    urgent: 0,
                    avgResolution: [],
                    lastTicket: null
                };
            }
            
            byCompany[companyName].total++;
            
            if ([4, 5].includes(Number(t.status))) {
                byCompany[companyName].closed++;
            } else {
                byCompany[companyName].open++;
            }
            
            if (Number(t.priority) === 4) byCompany[companyName].urgent++;
            
            // Última atividade
            const created = new Date(t.created_at);
            if (!byCompany[companyName].lastTicket || created > byCompany[companyName].lastTicket) {
                byCompany[companyName].lastTicket = created;
            }
        });
        
        // Calcular taxas
        Object.values(byCompany).forEach(c => {
            c.resolutionRate = c.total > 0 ? (c.closed / c.total * 100) : 0;
        });
        
        return byCompany;
    },
    
    getCompanyName(companyId) {
        if (!companyId) return 'Sem Empresa';
        const company = this.cache.companies?.find(c => c.id === companyId);
        return company?.name || `Empresa ${companyId}`;
    },
    
    // ========================================
    // ANÁLISE DE HORÁRIO COMERCIAL
    // ========================================
    
    analyzeBusinessHours(tickets) {
        const analysis = {
            withinHours: 0,
            outsideHours: 0,
            byHour: Array(24).fill(0),
            byDayType: { weekday: 0, weekend: 0 },
            peakHours: [],
            distribution: {
                morning: 0,   // 6-12
                afternoon: 0, // 12-18
                evening: 0,   // 18-22
                night: 0      // 22-6
            }
        };
        
        // Definir horário comercial padrão (pode ser customizado com BusinessHours do Supabase)
        const businessStart = 8;
        const businessEnd = 18;
        
        tickets.forEach(t => {
            const created = new Date(t.created_at);
            if (isNaN(created.getTime())) return;
            
            const hour = created.getHours();
            const dayOfWeek = created.getDay();
            
            // Contar por hora
            analysis.byHour[hour]++;
            
            // Dentro ou fora do horário comercial
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
            const isBusinessHour = hour >= businessStart && hour < businessEnd;
            
            if (isWeekday && isBusinessHour) {
                analysis.withinHours++;
            } else {
                analysis.outsideHours++;
            }
            
            // Dia da semana vs fim de semana
            if (isWeekday) {
                analysis.byDayType.weekday++;
            } else {
                analysis.byDayType.weekend++;
            }
            
            // Distribuição por período
            if (hour >= 6 && hour < 12) analysis.distribution.morning++;
            else if (hour >= 12 && hour < 18) analysis.distribution.afternoon++;
            else if (hour >= 18 && hour < 22) analysis.distribution.evening++;
            else analysis.distribution.night++;
        });
        
        // Encontrar horários de pico (top 3)
        analysis.peakHours = analysis.byHour
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
        
        return analysis;
    },
    
    // ========================================
    // ANÁLISE DE CSAT/SURVEYS
    // ========================================
    
    analyzeSurveys() {
        const surveys = this.cache.surveys || [];
        
        if (surveys.length === 0) {
            return {
                total: 0,
                avgRating: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                positive: 0,
                negative: 0,
                neutral: 0,
                byAgent: {},
                recentComments: []
            };
        }
        
        const analysis = {
            total: surveys.length,
            avgRating: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            positive: 0,
            negative: 0,
            neutral: 0,
            byAgent: {},
            recentComments: []
        };
        
        let totalRating = 0;
        
        surveys.forEach(s => {
            const rating = Number(s.rating) || 0;
            if (rating >= 1 && rating <= 5) {
                analysis.distribution[rating]++;
                totalRating += rating;
                
                if (rating >= 4) analysis.positive++;
                else if (rating <= 2) analysis.negative++;
                else analysis.neutral++;
            }
            
            // Por agente
            const agentName = s.agent_name || 'Não identificado';
            if (!analysis.byAgent[agentName]) {
                analysis.byAgent[agentName] = { total: 0, sum: 0, positive: 0, negative: 0 };
            }
            analysis.byAgent[agentName].total++;
            analysis.byAgent[agentName].sum += rating;
            if (rating >= 4) analysis.byAgent[agentName].positive++;
            if (rating <= 2) analysis.byAgent[agentName].negative++;
            
            // Comentários recentes
            if (s.comment && analysis.recentComments.length < 5) {
                analysis.recentComments.push({
                    rating,
                    comment: s.comment,
                    date: s.created_at,
                    agent: agentName
                });
            }
        });
        
        analysis.avgRating = analysis.total > 0 ? totalRating / analysis.total : 0;
        
        // Calcular média por agente
        Object.values(analysis.byAgent).forEach(a => {
            a.avgRating = a.total > 0 ? a.sum / a.total : 0;
        });
        
        return analysis;
    },
    
    // ========================================
    // RENDERIZAÇÃO DE CARDS
    // ========================================
    
    renderProductsCard(tickets) {
        const byProduct = this.analyzeByProduct(tickets);
        const products = Object.entries(byProduct)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
        
        if (products.length === 0 || (products.length === 1 && products[0].name === 'Sem Produto')) {
            return `
                <div style="text-align: center; padding: 2rem; color: ${this.colors.textMuted};">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
                    <p>Nenhum produto configurado nos tickets</p>
                </div>
            `;
        }
        
        return `
            <div style="max-height: 300px; overflow-y: auto;">
                ${products.map((p, i) => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem;
                        background: ${i % 2 === 0 ? this.colors.surface : 'transparent'};
                        border-radius: 6px;
                        margin-bottom: 0.25rem;
                    ">
                        <div>
                            <div style="color: ${this.colors.text}; font-weight: 500;">${p.name}</div>
                            <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">
                                ${p.open} abertos · ${p.urgent} urgentes
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: ${this.colors.primary}; font-weight: 600;">${p.total}</div>
                            <div style="color: ${p.resolutionRate >= 70 ? this.colors.success : this.colors.warning}; font-size: 0.8rem;">
                                ${p.resolutionRate.toFixed(0)}% resolução
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    renderCompaniesCard(tickets) {
        const byCompany = this.analyzeByCompany(tickets);
        const companies = Object.entries(byCompany)
            .map(([name, data]) => ({ name, ...data }))
            .filter(c => c.name !== 'Sem Empresa')
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
        
        if (companies.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: ${this.colors.textMuted};">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏢</div>
                    <p>Nenhuma empresa vinculada aos tickets</p>
                </div>
            `;
        }
        
        return `
            <div style="max-height: 300px; overflow-y: auto;">
                ${companies.map((c, i) => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem;
                        background: ${i % 2 === 0 ? this.colors.surface : 'transparent'};
                        border-radius: 6px;
                        margin-bottom: 0.25rem;
                    ">
                        <div>
                            <div style="color: ${this.colors.text}; font-weight: 500;">${c.name}</div>
                            <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">
                                Última atividade: ${c.lastTicket ? this.formatDate(c.lastTicket) : 'N/A'}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: ${this.colors.primary}; font-weight: 600;">${c.total} tickets</div>
                            <div style="color: ${c.open > 0 ? this.colors.warning : this.colors.success}; font-size: 0.8rem;">
                                ${c.open} em aberto
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    renderBusinessHoursCard(tickets) {
        const analysis = this.analyzeBusinessHours(tickets);
        const total = analysis.withinHours + analysis.outsideHours;
        const withinPct = total > 0 ? (analysis.withinHours / total * 100) : 0;
        
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div style="text-align: center; padding: 1rem; background: ${this.colors.success}22; border-radius: 8px;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${this.colors.success};">${withinPct.toFixed(0)}%</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Horário Comercial</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: ${this.colors.warning}22; border-radius: 8px;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${this.colors.warning};">${(100 - withinPct).toFixed(0)}%</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Fora do Horário</div>
                </div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div style="color: ${this.colors.text}; font-weight: 500; margin-bottom: 0.5rem;">📊 Distribuição por Período</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
                    ${[
                        { label: '🌅 Manhã', value: analysis.distribution.morning, color: this.colors.warning },
                        { label: '☀️ Tarde', value: analysis.distribution.afternoon, color: this.colors.primary },
                        { label: '🌆 Noite', value: analysis.distribution.evening, color: this.colors.secondary },
                        { label: '🌙 Madrugada', value: analysis.distribution.night, color: this.colors.info }
                    ].map(p => `
                        <div style="text-align: center; padding: 0.5rem; background: ${this.colors.surface}; border-radius: 6px;">
                            <div style="font-size: 0.7rem; color: ${this.colors.textMuted};">${p.label}</div>
                            <div style="font-weight: 600; color: ${p.color};">${p.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <div style="color: ${this.colors.text}; font-weight: 500; margin-bottom: 0.5rem;">🔥 Horários de Pico</div>
                <div style="display: flex; gap: 0.5rem;">
                    ${analysis.peakHours.map((h, i) => `
                        <div style="
                            flex: 1;
                            text-align: center;
                            padding: 0.5rem;
                            background: ${i === 0 ? this.colors.danger + '33' : this.colors.surface};
                            border-radius: 6px;
                            border: 1px solid ${i === 0 ? this.colors.danger : this.colors.border};
                        ">
                            <div style="font-weight: 600; color: ${i === 0 ? this.colors.danger : this.colors.text};">${h.hour}:00</div>
                            <div style="font-size: 0.75rem; color: ${this.colors.textMuted};">${h.count} tickets</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    renderSurveysCard() {
        const analysis = this.analyzeSurveys();
        
        if (analysis.total === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: ${this.colors.textMuted};">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</div>
                    <p>Nenhuma avaliação de satisfação encontrada</p>
                </div>
            `;
        }
        
        const nps = analysis.total > 0 ? ((analysis.positive - analysis.negative) / analysis.total * 100) : 0;
        
        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                <div style="text-align: center; padding: 1rem; background: ${this.colors.primary}22; border-radius: 8px;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${this.colors.primary};">${analysis.avgRating.toFixed(1)}</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Média CSAT</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: ${nps >= 0 ? this.colors.success : this.colors.danger}22; border-radius: 8px;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${nps >= 0 ? this.colors.success : this.colors.danger};">${nps >= 0 ? '+' : ''}${nps.toFixed(0)}</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">NPS Score</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: ${this.colors.surface}; border-radius: 8px;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: ${this.colors.text};">${analysis.total}</div>
                    <div style="color: ${this.colors.textMuted}; font-size: 0.8rem;">Respostas</div>
                </div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div style="color: ${this.colors.text}; font-weight: 500; margin-bottom: 0.5rem;">Distribuição</div>
                <div style="display: flex; gap: 0.25rem; height: 24px; border-radius: 4px; overflow: hidden;">
                    ${[5, 4, 3, 2, 1].map(r => {
                        const pct = analysis.total > 0 ? (analysis.distribution[r] / analysis.total * 100) : 0;
                        const colors = {
                            5: this.colors.success,
                            4: '#86efac',
                            3: this.colors.warning,
                            2: '#fca5a5',
                            1: this.colors.danger
                        };
                        return pct > 0 ? `
                            <div style="
                                width: ${pct}%;
                                background: ${colors[r]};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.7rem;
                                font-weight: 600;
                                color: #000;
                            " title="${r} estrelas: ${analysis.distribution[r]} (${pct.toFixed(0)}%)">
                                ${pct > 8 ? r + '★' : ''}
                            </div>
                        ` : '';
                    }).join('')}
                </div>
            </div>
            
            ${analysis.recentComments.length > 0 ? `
                <div>
                    <div style="color: ${this.colors.text}; font-weight: 500; margin-bottom: 0.5rem;">💬 Comentários Recentes</div>
                    ${analysis.recentComments.slice(0, 3).map(c => `
                        <div style="
                            padding: 0.5rem;
                            background: ${this.colors.surface};
                            border-radius: 6px;
                            margin-bottom: 0.25rem;
                            border-left: 3px solid ${c.rating >= 4 ? this.colors.success : c.rating <= 2 ? this.colors.danger : this.colors.warning};
                        ">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                <span style="color: ${this.colors.text};">${'⭐'.repeat(c.rating)}</span>
                                <span style="color: ${this.colors.textMuted}; font-size: 0.75rem;">${c.agent}</span>
                            </div>
                            <div style="color: ${this.colors.textMuted}; font-size: 0.85rem; font-style: italic;">
                                "${c.comment.substring(0, 100)}${c.comment.length > 100 ? '...' : ''}"
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    },
    
    // ========================================
    // HELPERS
    // ========================================
    
    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    },
    
    // ========================================
    // INTEGRAÇÃO COM BI ANALYTICS
    // ========================================
    
    async injectIntoBI(biAnalytics) {
        if (!biAnalytics || !biAnalytics.filteredData) return;
        
        await this.loadAllExtraData();
        
        // Adicionar cards ao dashboard
        const container = document.querySelector('.bi-charts-grid');
        if (!container) return;
        
        // Adicionar seção de dados extras - Premium SaaS
        const section = document.createElement('div');
        section.id = 'extraDataSection';
        section.innerHTML = `
            <div style="margin: 2rem 1rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <h3 style="color: #e4e4e7; font-size: 1.1rem; font-weight: 600; margin: 0;">Dados Complementares</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; padding: 0 1rem;">
                <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        <h4 style="color: #e4e4e7; margin: 0; font-size: 0.9rem; font-weight: 600;">Por Produto</h4>
                    </div>
                    ${this.renderProductsCard(biAnalytics.filteredData)}
                </div>
                <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <h4 style="color: #e4e4e7; margin: 0; font-size: 0.9rem; font-weight: 600;">Por Empresa</h4>
                    </div>
                    ${this.renderCompaniesCard(biAnalytics.filteredData)}
                </div>
                <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <h4 style="color: #e4e4e7; margin: 0; font-size: 0.9rem; font-weight: 600;">Análise de Horário</h4>
                    </div>
                    ${this.renderBusinessHoursCard(biAnalytics.filteredData)}
                </div>
                <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <h4 style="color: #e4e4e7; margin: 0; font-size: 0.9rem; font-weight: 600;">Satisfação (CSAT)</h4>
                    </div>
                    ${this.renderSurveysCard()}
                </div>
            </div>
        `;
        
        // Remover seção anterior se existir
        document.getElementById('extraDataSection')?.remove();
        container.appendChild(section);
    }
};

// Auto-inicializar quando BI Analytics carregar dados
if (typeof BIAnalytics !== 'undefined') {
    const originalRenderCharts = BIAnalytics.prototype.renderCharts;
    BIAnalytics.prototype.renderCharts = function(metrics) {
        originalRenderCharts.call(this, metrics);
        
        // Injetar dados extras após renderização
        setTimeout(() => {
            window.BIExtraDataModule.injectIntoBI(this);
        }, 500);
    };
}

console.log('✅ BI Extra Data Module carregado');
