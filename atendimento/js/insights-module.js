/**
 * Insights Module - Análise Inteligente de Tickets
 * Fornece resumos, padrões, recomendações e análise de problemas frequentes
 */

class InsightsModule {
    constructor() {
        this.ticketsData = [];
        this.insights = null;
        this.aiInsights = null;
        this.isAnalyzing = false;
        this.isAIAnalyzing = false;
        this.lastAnalysis = null;
        this.aiInitialized = false;
        
        // Configurações
        this.config = {
            minSimilarity: 0.6, // Similaridade mínima para agrupar tickets
            topProblemsCount: 10, // Quantidade de problemas mais frequentes
            trendDays: 30, // Dias para análise de tendência
            useAI: true // Habilitar análise com IA
        };
        
        // Stopwords em português para análise de texto
        this.stopwords = new Set([
            'a', 'o', 'e', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
            'um', 'uma', 'uns', 'umas', 'para', 'por', 'com', 'como', 'que', 'se', 'não',
            'mais', 'mas', 'ou', 'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas',
            'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'isso',
            'aquele', 'aquela', 'aqueles', 'aquelas', 'aquilo', 'isto', 'ser', 'estar',
            'ter', 'haver', 'fazer', 'poder', 'ir', 'ver', 'dar', 'saber', 'querer',
            'quando', 'onde', 'quem', 'qual', 'quais', 'quanto', 'quantos', 'quantas',
            'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca', 'poucos', 'poucas',
            'todo', 'toda', 'todos', 'todas', 'outro', 'outra', 'outros', 'outras',
            'mesmo', 'mesma', 'mesmos', 'mesmas', 'próprio', 'própria', 'próprios',
            'já', 'ainda', 'também', 'só', 'apenas', 'sempre', 'nunca', 'agora',
            'bem', 'mal', 'assim', 'aqui', 'ali', 'lá', 'cá', 'então', 'pois',
            'porque', 'porquê', 'portanto', 'contudo', 'entretanto', 'todavia',
            'ticket', 'erro', 'problema', 'sistema', 'usuário', 'cliente', 'favor',
            'olá', 'oi', 'bom', 'dia', 'boa', 'tarde', 'noite', 'obrigado', 'obrigada',
            'prezado', 'prezada', 'atenciosamente', 'cordialmente', 'grato', 'grata'
        ]);
        
        // Categorias de problemas comuns
        this.problemCategories = {
            'acesso': ['login', 'senha', 'acesso', 'autenticação', 'permissão', 'bloqueado', 'liberação'],
            'performance': ['lento', 'lentidão', 'demora', 'travando', 'performance', 'carregando'],
            'erro': ['erro', 'bug', 'falha', 'crash', 'quebrado', 'não funciona', 'parou'],
            'integração': ['integração', 'api', 'sincronização', 'conexão', 'webhook'],
            'dados': ['dados', 'relatório', 'exportar', 'importar', 'duplicado', 'faltando'],
            'interface': ['tela', 'botão', 'menu', 'layout', 'visual', 'interface'],
            'configuração': ['configurar', 'configuração', 'setup', 'parametrização'],
            'novo': ['novo', 'criar', 'adicionar', 'implementar', 'feature', 'melhoria']
        };
        
        // Design
        this.colors = {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#f59e0b',
            danger: '#ef4444',
            warning: '#f97316',
            info: '#06b6d4',
            dark: '#1e1e2e',
            surface: '#2a2a3e',
            surfaceLight: '#363652',
            border: '#374151',
            text: '#e5e7eb',
            textMuted: '#9ca3af'
        };
    }
    
    initialize() {
        console.log('💡 Inicializando módulo de Insights...');
        
        if (!window.allTicketsCache || window.allTicketsCache.length === 0) {
            this.showNoDataMessage();
            return;
        }
        
        this.ticketsData = window.allTicketsCache;
        this.injectStyles();
        
        // Verificar se já temos análise em cache
        if (this.insights && this.lastAnalysis) {
            console.log('💡 Restaurando insights do cache...');
            
            // Se temos análise com IA, restaurar ela
            if (this.aiInsights) {
                this.render();
                this.renderInsightsWithAI(this.insights, this.aiInsights);
            } else {
                // Restaurar análise básica
                this.render();
                this.renderInsights(this.insights);
            }
        } else {
            // Primeira vez - renderizar e analisar
            this.render();
            this.analyzeData();
        }
    }
    
    showNoDataMessage() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; color: ${this.colors.textMuted};">
                <div style="font-size: 4rem; margin-bottom: 1rem;">💡</div>
                <h2 style="color: ${this.colors.text}; margin-bottom: 0.5rem;">Nenhum dado disponível</h2>
                <p>Carregue tickets da aba Tickets ou conecte ao Supabase para gerar insights.</p>
            </div>
        `;
    }
    
    render() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;
        
        const aiStatus = window.aiTransformers?.getStatus();
        const aiAvailable = aiStatus?.isLoaded;
        const hasAIInsights = this.aiInsights !== null;
        const hasCachedInsights = this.insights !== null && this.lastAnalysis !== null;
        
        // Texto do banner baseado no estado
        let bannerIcon, bannerText, bannerClass;
        if (hasAIInsights) {
            bannerIcon = '🧠';
            bannerText = `IA ativa! Última análise: ${this.lastAnalysis?.toLocaleString('pt-BR') || 'agora'}`;
            bannerClass = 'ready';
        } else if (aiAvailable) {
            bannerIcon = '✅';
            bannerText = 'IA carregada e pronta! Clique em "Análise com IA" para insights avançados.';
            bannerClass = 'ready';
        } else {
            bannerIcon = '💡';
            bannerText = 'Clique em "Carregar IA" para habilitar análise de sentimento e similaridade avançada (Transformers.js)';
            bannerClass = 'not-loaded';
        }
        
        container.innerHTML = `
            <div class="insights-page">
                <!-- Header -->
                <div class="insights-header">
                    <div>
                        <h1 class="insights-title">💡 Insights Inteligentes</h1>
                        <p style="color: ${this.colors.textMuted}; margin: 0;">
                            Análise automatizada de padrões, problemas frequentes e recomendações
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                        <button onclick="window.insightsModule.analyzeData()" class="insights-btn primary">
                            🔄 Análise Rápida
                        </button>
                        <button onclick="window.insightsModule.runAIAnalysis()" class="insights-btn ai ${aiAvailable || hasAIInsights ? 'ready' : ''}">
                            🤖 ${hasAIInsights ? 'Reanalisar com IA' : (aiAvailable ? 'Análise com IA' : 'Carregar IA')}
                        </button>
                        <button onclick="window.insightsModule.exportInsights()" class="insights-btn secondary">
                            📥 Exportar
                        </button>
                    </div>
                </div>
                
                <!-- AI Status Banner -->
                <div id="aiStatusBanner" class="ai-status-banner ${bannerClass}">
                    <span class="ai-status-icon">${bannerIcon}</span>
                    <span class="ai-status-text">${bannerText}</span>
                </div>
                
                <!-- Loading State -->
                <div id="insightsLoading" style="display: none;">
                    <div class="insights-loading">
                        <div class="loading-spinner"></div>
                        <p id="loadingText">Analisando ${this.ticketsData.length.toLocaleString()} tickets...</p>
                        <p id="loadingSubtext" style="font-size: 0.85rem; color: ${this.colors.textMuted};">
                            Identificando padrões e gerando recomendações
                        </p>
                        <div id="loadingProgress" class="loading-progress" style="display: none;">
                            <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
                            <span class="progress-text">0%</span>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div id="insightsContent">
                    <div class="insights-loading">
                        <p>Clique em "Análise Rápida" ou "Carregar IA" para iniciar</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    async runAIAnalysis() {
        if (this.isAIAnalyzing) return;
        
        const loading = document.getElementById('insightsLoading');
        const content = document.getElementById('insightsContent');
        const progressDiv = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        const loadingSubtext = document.getElementById('loadingSubtext');
        
        if (loading) loading.style.display = 'block';
        if (content) content.style.display = 'none';
        if (progressDiv) progressDiv.style.display = 'block';
        
        const updateProgress = (text, percent) => {
            if (loadingSubtext) loadingSubtext.textContent = text;
            const fill = document.querySelector('.progress-fill');
            const pctText = document.querySelector('.progress-text');
            if (fill) fill.style.width = `${percent}%`;
            if (pctText) pctText.textContent = `${percent}%`;
        };
        
        try {
            this.isAIAnalyzing = true;
            
            // Inicializar IA se necessário
            if (!window.aiTransformers?.isLoaded) {
                if (loadingText) loadingText.textContent = '🤖 Carregando modelos de IA...';
                updateProgress('Baixando Transformers.js (primeira vez pode demorar)...', 5);
                
                await window.aiTransformers.initialize(updateProgress);
                
                // Atualizar banner
                const banner = document.getElementById('aiStatusBanner');
                if (banner) {
                    banner.className = 'ai-status-banner ready';
                    banner.innerHTML = `
                        <span class="ai-status-icon">✅</span>
                        <span class="ai-status-text">IA carregada e pronta!</span>
                    `;
                }
            }
            
            // Executar análise rápida primeiro
            if (loadingText) loadingText.textContent = '📊 Executando análise básica...';
            updateProgress('Calculando métricas...', 20);
            
            await this.analyzeData();
            
            // Executar análise de IA
            if (loadingText) loadingText.textContent = '🤖 Executando análise de IA...';
            
            this.aiInsights = await window.aiTransformers.generateAIInsights(
                this.ticketsData,
                updateProgress
            );
            
            // Renderizar com insights de IA
            this.renderInsightsWithAI(this.insights, this.aiInsights);
            
        } catch (error) {
            console.error('Erro na análise de IA:', error);
            if (content) {
                content.innerHTML = `
                    <div class="insights-error">
                        <p>❌ Erro na análise de IA: ${error.message}</p>
                        <p>A análise básica ainda está disponível.</p>
                        <button onclick="window.insightsModule.analyzeData()" class="insights-btn primary">
                            Executar Análise Básica
                        </button>
                    </div>
                `;
                content.style.display = 'block';
            }
        } finally {
            this.isAIAnalyzing = false;
            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'block';
        }
    }
    
    renderInsightsWithAI(basicInsights, aiInsights) {
        const content = document.getElementById('insightsContent');
        if (!content || !basicInsights) return;
        
        // Usar o render básico como base
        this.renderInsights(basicInsights);
        
        // Adicionar seção de IA no topo
        if (aiInsights) {
            const aiSection = document.createElement('div');
            aiSection.innerHTML = this.renderAISection(aiInsights);
            
            // Inserir após o resumo geral
            const firstSection = content.querySelector('.insights-section');
            if (firstSection && firstSection.nextSibling) {
                firstSection.parentNode.insertBefore(aiSection.firstElementChild, firstSection.nextSibling);
            }
        }
    }
    
    renderAISection(aiInsights) {
        if (!aiInsights) return '';
        
        return `
            <section class="insights-section ai-section">
                <h2 class="section-title">🤖 Análise de IA</h2>
                
                <!-- Resumo da IA -->
                ${aiInsights.summary ? `
                <div class="ai-summary">
                    <h3>📝 Resumo Inteligente</h3>
                    <div class="ai-summary-text">
                        ${aiInsights.summary.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Análise de Sentimento -->
                ${aiInsights.sentiment ? `
                <div class="ai-sentiment">
                    <h3>🎭 Análise de Sentimento</h3>
                    <div class="sentiment-grid">
                        <div class="sentiment-card negative">
                            <div class="sentiment-value">${aiInsights.sentiment.negativePercent}%</div>
                            <div class="sentiment-label">😠 Negativo</div>
                            <div class="sentiment-count">${aiInsights.sentiment.negative} tickets</div>
                        </div>
                        <div class="sentiment-card neutral">
                            <div class="sentiment-value">${(100 - aiInsights.sentiment.negativePercent - (aiInsights.sentiment.positive / aiInsights.sentiment.analyzed * 100)).toFixed(1)}%</div>
                            <div class="sentiment-label">😐 Neutro</div>
                            <div class="sentiment-count">${aiInsights.sentiment.neutral} tickets</div>
                        </div>
                        <div class="sentiment-card positive">
                            <div class="sentiment-value">${(aiInsights.sentiment.positive / aiInsights.sentiment.analyzed * 100).toFixed(1)}%</div>
                            <div class="sentiment-label">😊 Positivo</div>
                            <div class="sentiment-count">${aiInsights.sentiment.positive} tickets</div>
                        </div>
                    </div>
                    
                    ${aiInsights.sentiment.criticalTickets?.length > 0 ? `
                    <div class="critical-tickets">
                        <h4>⚠️ Tickets com Tom Muito Negativo</h4>
                        <ul>
                            ${aiInsights.sentiment.criticalTickets.slice(0, 5).map(t => `
                                <li>
                                    <span class="ticket-id">#${t.ticketId}</span>
                                    <span class="ticket-subject">${(t.subject || '').substring(0, 60)}${(t.subject || '').length > 60 ? '...' : ''}</span>
                                    <span class="sentiment-score">${(t.sentiment.score * 100).toFixed(0)}% negativo</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <!-- Categorização por IA -->
                ${aiInsights.categories ? `
                <div class="ai-categories">
                    <h3>🏷️ Categorização Inteligente</h3>
                    <div class="categories-grid">
                        ${aiInsights.categories.slice(0, 8).map(cat => `
                            <div class="category-card">
                                <div class="category-label">${cat.label}</div>
                                <div class="category-count">${cat.count}</div>
                                <div class="category-bar">
                                    <div class="bar-fill" style="width: ${(cat.count / this.ticketsData.length * 100)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Tickets Similares (IA) -->
                ${aiInsights.similarGroups?.length > 0 ? `
                <div class="ai-similar">
                    <h3>🔗 Tickets Similares (detectados por IA)</h3>
                    <p style="color: ${this.colors.textMuted}; font-size: 0.9rem; margin-bottom: 1rem;">
                        Grupos de tickets com alta similaridade semântica - podem indicar problemas recorrentes
                    </p>
                    <div class="similar-groups">
                        ${aiInsights.similarGroups.slice(0, 5).map((group, i) => `
                            <div class="similar-group-ai">
                                <div class="group-header-ai">
                                    <span class="group-badge">${group.count} tickets</span>
                                    <span class="similarity-score">${(group.avgSimilarity * 100).toFixed(0)}% similar</span>
                                </div>
                                <p class="group-preview">"${group.representativeText}..."</p>
                                <ul class="group-tickets">
                                    ${group.sample.slice(0, 3).map(t => `
                                        <li>#${t.id} - ${(t.subject || '').substring(0, 50)}...</li>
                                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </section>
        `;
    }
    
    async analyzeData() {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        const loading = document.getElementById('insightsLoading');
        const content = document.getElementById('insightsContent');
        
        if (loading) loading.style.display = 'block';
        if (content) content.style.display = 'none';
        
        try {
            // Executar análises em paralelo usando setTimeout para não bloquear UI
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const insights = {
                summary: this.generateSummary(),
                trends: this.analyzeTrends(),
                frequentProblems: this.analyzeFrequentProblems(),
                similarTickets: this.findSimilarTickets(),
                recommendations: this.generateRecommendations(),
                slaAnalysis: this.analyzeSLA(),
                teamPerformance: this.analyzeTeamPerformance(),
                patterns: this.detectPatterns(),
                // Novas análises
                acompanhamento: this.analyzeAcompanhamento(),
                statusAnalysis: this.analyzeStatusDetailed(),
                csatAnalysis: this.analyzeCSAT(),
                timestamp: new Date()
            };
            
            this.insights = insights;
            this.lastAnalysis = new Date();
            
            this.renderInsights(insights);
            
        } catch (error) {
            console.error('Erro na análise:', error);
            if (content) {
                content.innerHTML = `
                    <div class="insights-error">
                        <p>❌ Erro ao analisar dados: ${error.message}</p>
                    </div>
                `;
                content.style.display = 'block';
            }
        } finally {
            this.isAnalyzing = false;
            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'block';
        }
    }
    
    generateSummary() {
        const total = this.ticketsData.length;
        const resolved = this.ticketsData.filter(t => [4, 5].includes(Number(t.status))).length;
        const open = this.ticketsData.filter(t => Number(t.status) === 2).length;
        const pending = this.ticketsData.filter(t => Number(t.status) === 3).length;
        
        // Tempo médio de resolução
        const resolvedTickets = this.ticketsData.filter(t => 
            t.stats_resolved_at && t.created_at && [4, 5].includes(Number(t.status))
        );
        
        let avgResolutionHours = 0;
        if (resolvedTickets.length > 0) {
            const totalHours = resolvedTickets.reduce((sum, t) => {
                const created = new Date(t.created_at);
                const resolved = new Date(t.stats_resolved_at);
                return sum + (resolved - created) / (1000 * 60 * 60);
            }, 0);
            avgResolutionHours = totalHours / resolvedTickets.length;
        }
        
        // Tickets por prioridade
        const byPriority = {
            urgent: this.ticketsData.filter(t => t.priority === 4).length,
            high: this.ticketsData.filter(t => t.priority === 3).length,
            medium: this.ticketsData.filter(t => t.priority === 2).length,
            low: this.ticketsData.filter(t => t.priority === 1).length
        };
        
        // Tickets últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7Days = this.ticketsData.filter(t => new Date(t.created_at) >= sevenDaysAgo).length;
        
        // Tickets últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30Days = this.ticketsData.filter(t => new Date(t.created_at) >= thirtyDaysAgo).length;
        
        return {
            total,
            resolved,
            open,
            pending,
            resolutionRate: total > 0 ? (resolved / total * 100) : 0,
            avgResolutionHours,
            byPriority,
            last7Days,
            last30Days,
            avgPerDay: last30Days / 30
        };
    }
    
    analyzeTrends() {
        const now = new Date();
        const trends = [];
        
        // Agrupar por semana nos últimos 8 semanas
        const weeks = [];
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            
            const count = this.ticketsData.filter(t => {
                const d = new Date(t.created_at);
                return d >= weekStart && d < weekEnd;
            }).length;
            
            weeks.push({
                start: weekStart,
                count
            });
        }
        
        // Calcular tendência
        if (weeks.length >= 2) {
            const recent = weeks.slice(-2).reduce((sum, w) => sum + w.count, 0) / 2;
            const previous = weeks.slice(-4, -2).reduce((sum, w) => sum + w.count, 0) / 2;
            
            if (previous > 0) {
                const change = ((recent - previous) / previous) * 100;
                trends.push({
                    type: change > 10 ? 'warning' : change < -10 ? 'success' : 'info',
                    icon: change > 10 ? '📈' : change < -10 ? '📉' : '➡️',
                    title: 'Volume de Tickets',
                    description: change > 10 
                        ? `Aumento de ${Math.abs(change).toFixed(0)}% nas últimas 2 semanas`
                        : change < -10 
                            ? `Redução de ${Math.abs(change).toFixed(0)}% nas últimas 2 semanas`
                            : 'Volume estável nas últimas semanas'
                });
            }
        }
        
        // Análise de prioridade crítica
        const urgentRecent = this.ticketsData.filter(t => {
            const d = new Date(t.created_at);
            return d >= new Date(now - 7 * 24 * 60 * 60 * 1000) && t.priority === 4;
        }).length;
        
        if (urgentRecent > 5) {
            trends.push({
                type: 'danger',
                icon: '🚨',
                title: 'Alta Criticidade',
                description: `${urgentRecent} tickets urgentes nos últimos 7 dias`
            });
        }
        
        return { weeks, trends };
    }
    
    analyzeFrequentProblems() {
        const wordFrequency = new Map();
        const phraseFrequency = new Map();
        const categoryCount = {};
        
        // Inicializar categorias
        Object.keys(this.problemCategories).forEach(cat => {
            categoryCount[cat] = { count: 0, tickets: [] };
        });
        
        this.ticketsData.forEach(ticket => {
            const text = this.normalizeText(
                (ticket.subject || '') + ' ' + (ticket.description_text || '')
            );
            
            const words = this.tokenize(text);
            
            // Contar palavras
            words.forEach(word => {
                if (word.length > 3 && !this.stopwords.has(word)) {
                    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
                }
            });
            
            // Extrair bigramas (pares de palavras)
            for (let i = 0; i < words.length - 1; i++) {
                if (words[i].length > 2 && words[i+1].length > 2 &&
                    !this.stopwords.has(words[i]) && !this.stopwords.has(words[i+1])) {
                    const bigram = words[i] + ' ' + words[i+1];
                    phraseFrequency.set(bigram, (phraseFrequency.get(bigram) || 0) + 1);
                }
            }
            
            // Categorizar
            Object.entries(this.problemCategories).forEach(([category, keywords]) => {
                if (keywords.some(kw => text.includes(kw))) {
                    categoryCount[category].count++;
                    if (categoryCount[category].tickets.length < 5) {
                        categoryCount[category].tickets.push(ticket);
                    }
                }
            });
        });
        
        // Top palavras
        const topWords = Array.from(wordFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));
        
        // Top frases
        const topPhrases = Array.from(phraseFrequency.entries())
            .filter(([_, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([phrase, count]) => ({ phrase, count }));
        
        // Ordenar categorias
        const sortedCategories = Object.entries(categoryCount)
            .sort((a, b) => b[1].count - a[1].count)
            .filter(([_, data]) => data.count > 0);
        
        return {
            topWords,
            topPhrases,
            categories: sortedCategories
        };
    }
    
    findSimilarTickets() {
        const groups = [];
        const processed = new Set();
        
        // Criar índice de palavras-chave por ticket
        const ticketKeywords = this.ticketsData.map(ticket => {
            const text = this.normalizeText(ticket.subject || '');
            const words = this.tokenize(text).filter(w => w.length > 3 && !this.stopwords.has(w));
            return { ticket, words: new Set(words) };
        });
        
        // Encontrar tickets similares (apenas os primeiros 500 para performance)
        const sampleSize = Math.min(500, ticketKeywords.length);
        const sample = ticketKeywords.slice(0, sampleSize);
        
        sample.forEach((item, i) => {
            if (processed.has(i) || item.words.size < 2) return;
            
            const similar = [item.ticket];
            
            for (let j = i + 1; j < sample.length; j++) {
                if (processed.has(j)) continue;
                
                const similarity = this.calculateJaccard(item.words, sample[j].words);
                
                if (similarity >= this.config.minSimilarity) {
                    similar.push(sample[j].ticket);
                    processed.add(j);
                }
            }
            
            if (similar.length >= 3) {
                groups.push({
                    count: similar.length,
                    sample: similar.slice(0, 5),
                    commonWords: Array.from(item.words).slice(0, 5)
                });
                processed.add(i);
            }
        });
        
        return groups.sort((a, b) => b.count - a.count).slice(0, 10);
    }
    
    generateRecommendations() {
        const recommendations = [];
        const summary = this.generateSummary();
        
        // Taxa de resolução baixa
        if (summary.resolutionRate < 70) {
            recommendations.push({
                priority: 'high',
                icon: '⚠️',
                title: 'Taxa de Resolução Baixa',
                description: `Apenas ${summary.resolutionRate.toFixed(1)}% dos tickets estão resolvidos. Considere revisar o processo de atendimento.`,
                actions: [
                    'Revisar tickets pendentes há mais de 7 dias',
                    'Identificar gargalos no fluxo de atendimento',
                    'Considerar automação para tickets simples'
                ]
            });
        }
        
        // Muitos tickets urgentes
        if (summary.byPriority.urgent > summary.total * 0.15) {
            recommendations.push({
                priority: 'high',
                icon: '🚨',
                title: 'Alto Volume de Tickets Urgentes',
                description: `${summary.byPriority.urgent} tickets urgentes (${(summary.byPriority.urgent / summary.total * 100).toFixed(1)}% do total).`,
                actions: [
                    'Revisar critérios de classificação de prioridade',
                    'Implementar triagem automática',
                    'Criar escalation policies'
                ]
            });
        }
        
        // Tempo médio de resolução alto
        if (summary.avgResolutionHours > 48) {
            recommendations.push({
                priority: 'medium',
                icon: '⏱️',
                title: 'Tempo de Resolução Elevado',
                description: `Média de ${Math.round(summary.avgResolutionHours)} horas para resolver tickets.`,
                actions: [
                    'Criar base de conhecimento com soluções comuns',
                    'Implementar respostas automáticas para FAQs',
                    'Treinar equipe em problemas frequentes'
                ]
            });
        }
        
        // Volume crescente
        if (summary.avgPerDay > 50) {
            recommendations.push({
                priority: 'medium',
                icon: '📈',
                title: 'Alto Volume Diário',
                description: `Média de ${summary.avgPerDay.toFixed(0)} tickets por dia.`,
                actions: [
                    'Considerar expansão da equipe',
                    'Implementar self-service',
                    'Automatizar categorização de tickets'
                ]
            });
        }
        
        // Backlog grande
        const backlog = summary.open + summary.pending;
        if (backlog > 100) {
            recommendations.push({
                priority: 'high',
                icon: '📋',
                title: 'Backlog Elevado',
                description: `${backlog} tickets em aberto precisam de atenção.`,
                actions: [
                    'Priorizar tickets mais antigos',
                    'Organizar mutirão de resolução',
                    'Revisar tickets que podem ser fechados'
                ]
            });
        }
        
        // Análise de acompanhamento
        const acompanhamento = this.analyzeAcompanhamento();
        if (acompanhamento.percentWithAcompanhamento < 30 && acompanhamento.ranking.length > 0) {
            recommendations.push({
                priority: 'medium',
                icon: '🏷️',
                title: 'Baixo Uso de Acompanhamento',
                description: `Apenas ${acompanhamento.percentWithAcompanhamento.toFixed(1)}% dos tickets têm acompanhamento via tags.`,
                actions: [
                    'Incentivar uso de tags para tratativa indireta',
                    'Padronizar nomes nas tags de acompanhamento',
                    'Monitorar tickets sem responsável definido'
                ]
            });
        }
        
        // Análise de CSAT
        const csat = this.analyzeCSAT();
        if (csat.hasData) {
            if (csat.average < 3.5) {
                recommendations.push({
                    priority: 'high',
                    icon: '⭐',
                    title: 'Satisfação do Cliente Baixa',
                    description: `CSAT médio de ${csat.average.toFixed(1)}/5 precisa de atenção imediata.`,
                    actions: [
                        'Analisar tickets com avaliação 1-2 estrelas',
                        'Implementar follow-up em tickets críticos',
                        'Treinar equipe em atendimento ao cliente',
                        'Revisar tempo de resposta e resolução'
                    ]
                });
            } else if (csat.nps < 0) {
                recommendations.push({
                    priority: 'medium',
                    icon: '📉',
                    title: 'NPS Negativo',
                    description: `NPS de ${csat.nps.toFixed(0)} indica mais detratores que promotores.`,
                    actions: [
                        'Identificar causas de insatisfação',
                        'Implementar pesquisa de feedback',
                        'Criar programa de recuperação de clientes'
                    ]
                });
            }
        }
        
        // Análise de aging
        const status = this.analyzeStatusDetailed();
        if (status.aging && status.aging.moreThanWeek > 10) {
            recommendations.push({
                priority: 'high',
                icon: '⏰',
                title: 'Tickets Antigos em Aberto',
                description: `${status.aging.moreThanWeek} tickets abertos há mais de 7 dias.`,
                actions: [
                    'Priorizar resolução de tickets antigos',
                    'Verificar se há bloqueios externos',
                    'Considerar escalar para níveis superiores'
                ]
            });
        }
        
        // Sempre adicionar boas práticas
        recommendations.push({
            priority: 'info',
            icon: '💡',
            title: 'Boas Práticas',
            description: 'Dicas para melhorar o atendimento:',
            actions: [
                'Documentar soluções para problemas recorrentes',
                'Usar templates de resposta para agilizar',
                'Manter comunicação proativa com clientes',
                'Revisar métricas semanalmente'
            ]
        });
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2, info: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    
    analyzeSLA() {
        const SLA_FIRST_RESPONSE = 4 * 60 * 60 * 1000; // 4 horas
        const SLA_RESOLUTION = 24 * 60 * 60 * 1000; // 24 horas
        
        let withinFirstResponse = 0;
        let outsideFirstResponse = 0;
        let withinResolution = 0;
        let outsideResolution = 0;
        
        const violations = [];
        
        this.ticketsData.forEach(ticket => {
            // SLA Primeira Resposta
            if (ticket.stats_first_responded_at && ticket.created_at) {
                const responseTime = new Date(ticket.stats_first_responded_at) - new Date(ticket.created_at);
                if (responseTime <= SLA_FIRST_RESPONSE) {
                    withinFirstResponse++;
                } else {
                    outsideFirstResponse++;
                    if (violations.length < 10) {
                        violations.push({
                            id: ticket.id,
                            subject: ticket.subject,
                            type: 'first_response',
                            hours: Math.round(responseTime / (1000 * 60 * 60))
                        });
                    }
                }
            }
            
            // SLA Resolução
            if (ticket.stats_resolved_at && ticket.created_at) {
                const resolutionTime = new Date(ticket.stats_resolved_at) - new Date(ticket.created_at);
                if (resolutionTime <= SLA_RESOLUTION) {
                    withinResolution++;
                } else {
                    outsideResolution++;
                }
            }
        });
        
        const totalFirstResponse = withinFirstResponse + outsideFirstResponse;
        const totalResolution = withinResolution + outsideResolution;
        
        return {
            firstResponse: {
                within: withinFirstResponse,
                outside: outsideFirstResponse,
                rate: totalFirstResponse > 0 ? (withinFirstResponse / totalFirstResponse * 100) : 0
            },
            resolution: {
                within: withinResolution,
                outside: outsideResolution,
                rate: totalResolution > 0 ? (withinResolution / totalResolution * 100) : 0
            },
            violations
        };
    }
    
    analyzeTeamPerformance() {
        const teamStats = new Map();
        
        this.ticketsData.forEach(ticket => {
            const team = ticket.cf_grupo_tratativa || 'Não atribuído';
            
            if (!teamStats.has(team)) {
                teamStats.set(team, {
                    total: 0,
                    resolved: 0,
                    resolutionTimes: [],
                    responseTimes: []
                });
            }
            
            const stats = teamStats.get(team);
            stats.total++;
            
            if ([4, 5].includes(Number(ticket.status))) {
                stats.resolved++;
                
                if (ticket.created_at && ticket.stats_resolved_at) {
                    const hours = (new Date(ticket.stats_resolved_at) - new Date(ticket.created_at)) / (1000 * 60 * 60);
                    if (hours > 0 && hours < 10000) {
                        stats.resolutionTimes.push(hours);
                    }
                }
            }
            
            if (ticket.created_at && ticket.stats_first_responded_at) {
                const hours = (new Date(ticket.stats_first_responded_at) - new Date(ticket.created_at)) / (1000 * 60 * 60);
                if (hours > 0 && hours < 1000) {
                    stats.responseTimes.push(hours);
                }
            }
        });
        
        // Calcular métricas
        const teams = Array.from(teamStats.entries()).map(([name, stats]) => {
            const avgResolution = stats.resolutionTimes.length > 0
                ? stats.resolutionTimes.reduce((a, b) => a + b, 0) / stats.resolutionTimes.length
                : 0;
            
            const avgResponse = stats.responseTimes.length > 0
                ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
                : 0;
            
            return {
                name,
                total: stats.total,
                resolved: stats.resolved,
                resolutionRate: stats.total > 0 ? (stats.resolved / stats.total * 100) : 0,
                avgResolutionHours: avgResolution,
                avgResponseHours: avgResponse
            };
        });
        
        return teams.sort((a, b) => b.total - a.total).slice(0, 10);
    }
    
    detectPatterns() {
        const patterns = [];
        
        // Padrão por dia da semana
        const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
        this.ticketsData.forEach(t => {
            if (t.created_at) {
                byDayOfWeek[new Date(t.created_at).getDay()]++;
            }
        });
        
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const maxDayIdx = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));
        const minDayIdx = byDayOfWeek.indexOf(Math.min(...byDayOfWeek));
        
        patterns.push({
            icon: '📅',
            title: 'Padrão Semanal',
            description: `${dayNames[maxDayIdx]} é o dia com mais tickets (${byDayOfWeek[maxDayIdx]}). ${dayNames[minDayIdx]} tem menos (${byDayOfWeek[minDayIdx]}).`
        });
        
        // Padrão por hora
        const byHour = new Array(24).fill(0);
        this.ticketsData.forEach(t => {
            if (t.created_at) {
                byHour[new Date(t.created_at).getHours()]++;
            }
        });
        
        const peakHour = byHour.indexOf(Math.max(...byHour));
        patterns.push({
            icon: '⏰',
            title: 'Horário de Pico',
            description: `Maior volume de tickets às ${peakHour}h (${byHour[peakHour]} tickets).`
        });
        
        // Padrão de tipo
        const byType = new Map();
        this.ticketsData.forEach(t => {
            const type = t.type || 'Não classificado';
            byType.set(type, (byType.get(type) || 0) + 1);
        });
        
        const topType = Array.from(byType.entries()).sort((a, b) => b[1] - a[1])[0];
        if (topType) {
            patterns.push({
                icon: '📝',
                title: 'Tipo Mais Comum',
                description: `"${topType[0]}" representa ${(topType[1] / this.ticketsData.length * 100).toFixed(1)}% dos tickets.`
            });
        }
        
        return patterns;
    }
    
    // ========== NOVAS ANÁLISES ==========
    
    /**
     * Analisa acompanhamento por tags (tratativa indireta)
     */
    analyzeAcompanhamento() {
        const allowedPeople = ['Andreia', 'Gustavo', 'Adriana', 'Jéssica', 'Francisco', 'Alianie', 'Gabriel CS', 'João Peres'];
        const normalizeForMatch = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const allowedNorm = allowedPeople.map(p => normalizeForMatch(p));
        
        const extractTags = (ticket) => {
            const tags = ticket.tags;
            if (!tags) return [];
            if (Array.isArray(tags)) return tags.map(t => (t || '').toString().trim()).filter(t => t);
            if (typeof tags === 'string') {
                const trimmed = tags.trim();
                if (trimmed.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) return parsed.map(t => (t || '').toString().trim()).filter(t => t);
                    } catch (e) { /* continua */ }
                }
                return tags.split(/[,;|]/).map(t => t.trim()).filter(t => t);
            }
            return [];
        };
        
        const personStats = {};
        let ticketsWithAcompanhamento = 0;
        
        this.ticketsData.forEach(ticket => {
            const ticketTags = extractTags(ticket);
            let hasAcompanhamento = false;
            
            ticketTags.forEach(tag => {
                const tagNorm = normalizeForMatch(tag);
                const matchIdx = allowedNorm.findIndex(n => tagNorm.includes(n) || n.includes(tagNorm));
                if (matchIdx !== -1) {
                    const canonicalName = allowedPeople[matchIdx];
                    if (!personStats[canonicalName]) {
                        personStats[canonicalName] = { total: 0, resolved: 0 };
                    }
                    personStats[canonicalName].total++;
                    
                    // Verificar se resolvido
                    const status = Number(ticket.status);
                    if ([4, 5].includes(status)) {
                        personStats[canonicalName].resolved++;
                    }
                    hasAcompanhamento = true;
                }
            });
            
            if (hasAcompanhamento) ticketsWithAcompanhamento++;
        });
        
        const ranking = Object.entries(personStats)
            .map(([name, stats]) => ({
                name,
                total: stats.total,
                resolved: stats.resolved,
                resolutionRate: stats.total > 0 ? (stats.resolved / stats.total * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);
        
        return {
            totalTicketsWithAcompanhamento: ticketsWithAcompanhamento,
            percentWithAcompanhamento: this.ticketsData.length > 0 
                ? (ticketsWithAcompanhamento / this.ticketsData.length * 100) 
                : 0,
            ranking,
            topPerformer: ranking.length > 0 ? ranking[0] : null
        };
    }
    
    /**
     * Análise detalhada de status usando categorias
     */
    analyzeStatusDetailed() {
        // Usar TicketStatusManager se disponível
        const useStatusManager = window.TicketStatusManager && typeof window.TicketStatusManager.getStatusStatistics === 'function';
        
        if (useStatusManager) {
            return window.TicketStatusManager.getStatusStatistics(this.ticketsData);
        }
        
        // Fallback manual
        const statusGroups = {
            open: { label: 'Abertos', color: '#ef4444', tickets: [] },
            pending: { label: 'Pendentes', color: '#f59e0b', tickets: [] },
            waiting: { label: 'Aguardando', color: '#3b82f6', tickets: [] },
            resolved: { label: 'Resolvidos', color: '#10b981', tickets: [] }
        };
        
        const statusMap = {
            2: 'open',      // Open
            3: 'pending',   // Pending
            4: 'resolved',  // Resolved
            5: 'resolved',  // Closed
            6: 'waiting',   // Em Homologação
            7: 'waiting',   // Aguardando Cliente
            8: 'open',      // Em Tratativa
            10: 'open',     // Em Análise
            17: 'pending'   // Pausado
        };
        
        this.ticketsData.forEach(ticket => {
            const status = Number(ticket.status);
            const group = statusMap[status] || 'open';
            statusGroups[group].tickets.push(ticket);
        });
        
        const total = this.ticketsData.length;
        const result = {
            total,
            groups: Object.entries(statusGroups).map(([key, data]) => ({
                key,
                label: data.label,
                color: data.color,
                count: data.tickets.length,
                percent: total > 0 ? (data.tickets.length / total * 100) : 0
            }))
        };
        
        // Calcular aging de tickets abertos
        const now = new Date();
        const openTickets = [...statusGroups.open.tickets, ...statusGroups.pending.tickets, ...statusGroups.waiting.tickets];
        const aging = {
            lessThan1Day: 0,
            oneToThreeDays: 0,
            threeToSevenDays: 0,
            moreThanWeek: 0
        };
        
        openTickets.forEach(ticket => {
            const created = new Date(ticket.created_at);
            const days = (now - created) / (1000 * 60 * 60 * 24);
            if (days < 1) aging.lessThan1Day++;
            else if (days < 3) aging.oneToThreeDays++;
            else if (days < 7) aging.threeToSevenDays++;
            else aging.moreThanWeek++;
        });
        
        result.aging = aging;
        result.openCount = openTickets.length;
        
        return result;
    }
    
    /**
     * Análise de satisfação do cliente (CSAT)
     */
    analyzeCSAT() {
        const ratings = [];
        const byScore = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        this.ticketsData.forEach(ticket => {
            const sr = ticket.satisfaction_rating;
            if (!sr) return;
            
            let score = null;
            if (typeof sr === 'object' && sr.score) {
                score = sr.score;
            } else if (typeof sr === 'number') {
                score = sr;
            }
            
            if (score && score >= 1 && score <= 5) {
                ratings.push({
                    ticketId: ticket.id,
                    score,
                    subject: ticket.subject
                });
                byScore[score]++;
            }
        });
        
        if (ratings.length === 0) {
            return {
                hasData: false,
                message: 'Nenhum dado de satisfação disponível'
            };
        }
        
        const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
        const satisfaction = (avg / 5) * 100;
        
        // NPS simplificado (promotores 4-5, neutros 3, detratores 1-2)
        const promoters = byScore[4] + byScore[5];
        const detractors = byScore[1] + byScore[2];
        const nps = ((promoters - detractors) / ratings.length) * 100;
        
        return {
            hasData: true,
            total: ratings.length,
            average: avg,
            satisfaction,
            nps,
            distribution: byScore,
            lowScores: ratings.filter(r => r.score <= 2).slice(0, 5),
            highScores: ratings.filter(r => r.score >= 4).slice(0, 5)
        };
    }
    
    // Helpers
    normalizeText(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    tokenize(text) {
        return text.split(/\s+/).filter(w => w.length > 0);
    }
    
    calculateJaccard(setA, setB) {
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    renderInsights(insights) {
        const content = document.getElementById('insightsContent');
        if (!content) return;
        
        content.innerHTML = `
            <!-- Resumo Geral -->
            <section class="insights-section">
                <h2 class="section-title">📊 Resumo Geral</h2>
                <div class="insights-kpis">
                    <div class="kpi-card">
                        <div class="kpi-value">${insights.summary.total.toLocaleString()}</div>
                        <div class="kpi-label">Total de Tickets</div>
                    </div>
                    <div class="kpi-card success">
                        <div class="kpi-value">${insights.summary.resolutionRate.toFixed(1)}%</div>
                        <div class="kpi-label">Taxa de Resolução</div>
                    </div>
                    <div class="kpi-card warning">
                        <div class="kpi-value">${Math.round(insights.summary.avgResolutionHours)}h</div>
                        <div class="kpi-label">Tempo Médio Resolução</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-value">${insights.summary.avgPerDay.toFixed(1)}</div>
                        <div class="kpi-label">Tickets/Dia (30d)</div>
                    </div>
                </div>
            </section>
            
            <!-- Tendências -->
            ${insights.trends.trends.length > 0 ? `
            <section class="insights-section">
                <h2 class="section-title">📈 Tendências</h2>
                <div class="trend-cards">
                    ${insights.trends.trends.map(trend => `
                        <div class="trend-card ${trend.type}">
                            <span class="trend-icon">${trend.icon}</span>
                            <div>
                                <div class="trend-title">${trend.title}</div>
                                <div class="trend-desc">${trend.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}
            
            <!-- Recomendações -->
            <section class="insights-section">
                <h2 class="section-title">💡 Recomendações</h2>
                <div class="recommendations">
                    ${insights.recommendations.map(rec => `
                        <div class="recommendation-card ${rec.priority}">
                            <div class="rec-header">
                                <span class="rec-icon">${rec.icon}</span>
                                <span class="rec-title">${rec.title}</span>
                                <span class="rec-priority ${rec.priority}">${rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Info'}</span>
                            </div>
                            <p class="rec-desc">${rec.description}</p>
                            <ul class="rec-actions">
                                ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <!-- Problemas Frequentes -->
            <section class="insights-section">
                <h2 class="section-title">🔥 Problemas Frequentes</h2>
                <div class="problems-grid">
                    <div class="problems-categories">
                        <h3>Por Categoria</h3>
                        ${insights.frequentProblems.categories.map(([cat, data]) => `
                            <div class="category-item">
                                <span class="cat-name">${this.getCategoryIcon(cat)} ${this.getCategoryLabel(cat)}</span>
                                <span class="cat-count">${data.count}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="problems-words">
                        <h3>Palavras Mais Frequentes</h3>
                        <div class="word-cloud">
                            ${insights.frequentProblems.topWords.slice(0, 15).map((item, i) => `
                                <span class="word-tag" style="font-size: ${Math.max(0.8, 1.5 - i * 0.05)}rem; opacity: ${Math.max(0.6, 1 - i * 0.03)}">
                                    ${item.word} (${item.count})
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Tickets Similares -->
            ${insights.similarTickets.length > 0 ? `
            <section class="insights-section">
                <h2 class="section-title">🔗 Tickets Similares (Possíveis Duplicados)</h2>
                <p style="color: ${this.colors.textMuted}; margin-bottom: 1rem;">
                    Grupos de tickets com assuntos parecidos que podem ser tratados em conjunto
                </p>
                <div class="similar-groups">
                    ${insights.similarTickets.slice(0, 5).map((group, i) => `
                        <div class="similar-group">
                            <div class="group-header">
                                <span class="group-count">${group.count} tickets</span>
                                <span class="group-keywords">${group.commonWords.join(', ')}</span>
                            </div>
                            <ul class="group-samples">
                                ${group.sample.map(t => `
                                    <li title="${t.subject}">#${t.id} - ${(t.subject || '').substring(0, 60)}${(t.subject || '').length > 60 ? '...' : ''}</li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}
            
            <!-- Performance SLA -->
            <section class="insights-section">
                <h2 class="section-title">⏱️ Análise de SLA</h2>
                <div class="sla-grid">
                    <div class="sla-card">
                        <div class="sla-title">Primeira Resposta (Meta: 4h)</div>
                        <div class="sla-rate ${insights.slaAnalysis.firstResponse.rate >= 90 ? 'good' : insights.slaAnalysis.firstResponse.rate >= 70 ? 'warning' : 'bad'}">
                            ${insights.slaAnalysis.firstResponse.rate.toFixed(1)}%
                        </div>
                        <div class="sla-detail">
                            ✅ ${insights.slaAnalysis.firstResponse.within} dentro | 
                            ❌ ${insights.slaAnalysis.firstResponse.outside} fora
                        </div>
                    </div>
                    <div class="sla-card">
                        <div class="sla-title">Resolução (Meta: 24h)</div>
                        <div class="sla-rate ${insights.slaAnalysis.resolution.rate >= 90 ? 'good' : insights.slaAnalysis.resolution.rate >= 70 ? 'warning' : 'bad'}">
                            ${insights.slaAnalysis.resolution.rate.toFixed(1)}%
                        </div>
                        <div class="sla-detail">
                            ✅ ${insights.slaAnalysis.resolution.within} dentro | 
                            ❌ ${insights.slaAnalysis.resolution.outside} fora
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Performance por Time -->
            ${insights.teamPerformance.length > 0 ? `
            <section class="insights-section">
                <h2 class="section-title">👥 Performance por Time</h2>
                <div class="team-table-wrapper">
                    <table class="team-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Total</th>
                                <th>Resolvidos</th>
                                <th>Taxa</th>
                                <th>Tempo Médio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${insights.teamPerformance.map(team => `
                                <tr>
                                    <td>${team.name}</td>
                                    <td>${team.total}</td>
                                    <td>${team.resolved}</td>
                                    <td class="${team.resolutionRate >= 80 ? 'good' : team.resolutionRate >= 60 ? 'warning' : 'bad'}">
                                        ${team.resolutionRate.toFixed(1)}%
                                    </td>
                                    <td>${Math.round(team.avgResolutionHours)}h</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
            ` : ''}
            
            <!-- Padrões Detectados -->
            <section class="insights-section">
                <h2 class="section-title">🔍 Padrões Detectados</h2>
                <div class="patterns-grid">
                    ${insights.patterns.map(pattern => `
                        <div class="pattern-card">
                            <span class="pattern-icon">${pattern.icon}</span>
                            <div class="pattern-content">
                                <div class="pattern-title">${pattern.title}</div>
                                <div class="pattern-desc">${pattern.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <!-- Análise de Acompanhamento -->
            ${insights.acompanhamento && insights.acompanhamento.ranking.length > 0 ? `
            <section class="insights-section">
                <h2 class="section-title">🏷️ Análise de Acompanhamento (Tags)</h2>
                <div class="insights-kpis" style="margin-bottom: 1rem;">
                    <div class="kpi-card">
                        <div class="kpi-value">${insights.acompanhamento.totalTicketsWithAcompanhamento}</div>
                        <div class="kpi-label">Tickets com Acompanhamento</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-value">${insights.acompanhamento.percentWithAcompanhamento.toFixed(1)}%</div>
                        <div class="kpi-label">do Total</div>
                    </div>
                    ${insights.acompanhamento.topPerformer ? `
                    <div class="kpi-card success">
                        <div class="kpi-value">${insights.acompanhamento.topPerformer.name}</div>
                        <div class="kpi-label">Mais Acompanhamentos (${insights.acompanhamento.topPerformer.total})</div>
                    </div>
                    ` : ''}
                </div>
                <div class="team-table-wrapper">
                    <table class="team-table">
                        <thead>
                            <tr>
                                <th>Pessoa</th>
                                <th>Total Acomp.</th>
                                <th>Resolvidos</th>
                                <th>Taxa</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${insights.acompanhamento.ranking.slice(0, 8).map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td>${p.total}</td>
                                    <td>${p.resolved}</td>
                                    <td class="${p.resolutionRate >= 70 ? 'good' : p.resolutionRate >= 50 ? 'warning' : 'bad'}">${p.resolutionRate.toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
            ` : ''}
            
            <!-- Análise de Status Detalhada -->
            ${insights.statusAnalysis ? `
            <section class="insights-section">
                <h2 class="section-title">📊 Análise Detalhada de Status</h2>
                <div class="insights-kpis" style="margin-bottom: 1rem;">
                    ${insights.statusAnalysis.groups ? insights.statusAnalysis.groups.map(g => `
                        <div class="kpi-card" style="border-left: 4px solid ${g.color};">
                            <div class="kpi-value" style="color: ${g.color};">${g.count}</div>
                            <div class="kpi-label">${g.label} (${g.percent.toFixed(1)}%)</div>
                        </div>
                    `).join('') : ''}
                </div>
                ${insights.statusAnalysis.aging ? `
                <div style="background: ${this.colors.surfaceLight}; padding: 1rem; border-radius: 10px;">
                    <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem;">📅 Aging de Tickets Abertos (${insights.statusAnalysis.openCount || 0} tickets)</h4>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <span style="padding: 0.4rem 0.8rem; background: ${this.colors.secondary}33; border-radius: 20px; font-size: 0.85rem;">
                            <strong>${insights.statusAnalysis.aging.lessThan1Day}</strong> &lt; 1 dia
                        </span>
                        <span style="padding: 0.4rem 0.8rem; background: ${this.colors.primary}33; border-radius: 20px; font-size: 0.85rem;">
                            <strong>${insights.statusAnalysis.aging.oneToThreeDays}</strong> 1-3 dias
                        </span>
                        <span style="padding: 0.4rem 0.8rem; background: ${this.colors.accent}33; border-radius: 20px; font-size: 0.85rem;">
                            <strong>${insights.statusAnalysis.aging.threeToSevenDays}</strong> 3-7 dias
                        </span>
                        <span style="padding: 0.4rem 0.8rem; background: ${this.colors.danger}33; border-radius: 20px; font-size: 0.85rem;">
                            <strong>${insights.statusAnalysis.aging.moreThanWeek}</strong> &gt; 7 dias
                        </span>
                    </div>
                </div>
                ` : ''}
            </section>
            ` : ''}
            
            <!-- Análise de CSAT -->
            ${insights.csatAnalysis && insights.csatAnalysis.hasData ? `
            <section class="insights-section">
                <h2 class="section-title">⭐ Satisfação do Cliente (CSAT)</h2>
                <div class="insights-kpis" style="margin-bottom: 1rem;">
                    <div class="kpi-card ${insights.csatAnalysis.average >= 4 ? 'success' : insights.csatAnalysis.average >= 3 ? 'warning' : 'danger'}">
                        <div class="kpi-value">${insights.csatAnalysis.average.toFixed(1)}</div>
                        <div class="kpi-label">Média (de 5)</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${insights.csatAnalysis.total}</div>
                        <div class="kpi-label">Avaliações</div>
                    </div>
                    <div class="kpi-card ${insights.csatAnalysis.satisfaction >= 80 ? 'success' : insights.csatAnalysis.satisfaction >= 60 ? 'warning' : 'danger'}">
                        <div class="kpi-value">${insights.csatAnalysis.satisfaction.toFixed(0)}%</div>
                        <div class="kpi-label">Satisfação</div>
                    </div>
                    <div class="kpi-card ${insights.csatAnalysis.nps >= 50 ? 'success' : insights.csatAnalysis.nps >= 0 ? 'warning' : 'danger'}">
                        <div class="kpi-value">${insights.csatAnalysis.nps.toFixed(0)}</div>
                        <div class="kpi-label">NPS Score</div>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    ${[1,2,3,4,5].map(score => `
                        <div style="flex: 1; min-width: 60px; text-align: center; padding: 0.75rem; background: ${this.colors.surfaceLight}; border-radius: 8px;">
                            <div style="font-size: 1.5rem;">${'⭐'.repeat(score)}</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: ${score >= 4 ? this.colors.secondary : score >= 3 ? this.colors.accent : this.colors.danger};">${insights.csatAnalysis.distribution[score]}</div>
                        </div>
                    `).join('')}
                </div>
                ${insights.csatAnalysis.lowScores.length > 0 ? `
                <div style="background: rgba(239,68,68,0.1); padding: 1rem; border-radius: 10px;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: ${this.colors.danger};">⚠️ Tickets com Baixa Avaliação</h4>
                    <ul style="margin: 0; padding-left: 1.5rem; font-size: 0.85rem; color: ${this.colors.textMuted};">
                        ${insights.csatAnalysis.lowScores.map(t => `<li>#${t.ticketId} - ${(t.subject || '').substring(0, 50)}... (${t.score}⭐)</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </section>
            ` : ''}
            
            <div class="insights-footer">
                <p>Última análise: ${this.lastAnalysis.toLocaleString('pt-BR')}</p>
                <p>Total de tickets analisados: ${this.ticketsData.length.toLocaleString()}</p>
            </div>
        `;
    }
    
    getCategoryIcon(category) {
        const icons = {
            'acesso': '🔐',
            'performance': '⚡',
            'erro': '🐛',
            'integração': '🔗',
            'dados': '📊',
            'interface': '🖥️',
            'configuração': '⚙️',
            'novo': '✨'
        };
        return icons[category] || '📌';
    }
    
    getCategoryLabel(category) {
        const labels = {
            'acesso': 'Acesso/Autenticação',
            'performance': 'Performance',
            'erro': 'Erros/Bugs',
            'integração': 'Integração/API',
            'dados': 'Dados/Relatórios',
            'interface': 'Interface',
            'configuração': 'Configuração',
            'novo': 'Melhorias/Novos'
        };
        return labels[category] || category;
    }
    
    exportInsights() {
        if (!this.insights) {
            alert('Execute a análise primeiro!');
            return;
        }
        
        // Criar JSON para export
        const exportData = {
            timestamp: this.lastAnalysis,
            summary: this.insights.summary,
            recommendations: this.insights.recommendations,
            frequentProblems: {
                categories: this.insights.frequentProblems.categories,
                topWords: this.insights.frequentProblems.topWords
            },
            slaAnalysis: this.insights.slaAnalysis,
            teamPerformance: this.insights.teamPerformance,
            patterns: this.insights.patterns
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insights_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    injectStyles() {
        if (document.getElementById('insights-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'insights-styles';
        styles.textContent = `
            .insights-page {
                background: ${this.colors.dark};
                color: ${this.colors.text};
                min-height: 100vh;
                padding: 1.5rem;
            }
            
            .insights-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .insights-title {
                font-size: 2rem;
                font-weight: 700;
                margin: 0;
                background: linear-gradient(135deg, ${this.colors.accent}, ${this.colors.primary});
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .insights-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .insights-btn.primary {
                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.accent});
                color: white;
            }
            
            .insights-btn.secondary {
                background: ${this.colors.surface};
                color: ${this.colors.text};
                border: 1px solid ${this.colors.border};
            }
            
            .insights-btn:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                filter: brightness(1.1);
            }
            
            .insights-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4rem;
                color: ${this.colors.textMuted};
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid ${this.colors.surface};
                border-top-color: ${this.colors.primary};
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .insights-section {
                background: ${this.colors.surface};
                border-radius: 16px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .section-title {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0 0 1rem 0;
                color: ${this.colors.text};
            }
            
            /* KPIs */
            .insights-kpis {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .kpi-card {
                background: ${this.colors.surfaceLight};
                border-radius: 12px;
                padding: 1.25rem;
                text-align: center;
            }
            
            .kpi-value {
                font-size: 2rem;
                font-weight: 700;
                color: ${this.colors.text};
            }
            
            .kpi-label {
                font-size: 0.875rem;
                color: ${this.colors.textMuted};
                margin-top: 0.25rem;
            }
            
            .kpi-card.success .kpi-value { color: ${this.colors.secondary}; }
            .kpi-card.warning .kpi-value { color: ${this.colors.accent}; }
            .kpi-card.info .kpi-value { color: ${this.colors.info}; }
            .kpi-card.danger .kpi-value { color: ${this.colors.danger}; }
            
            /* Trends */
            .trend-cards {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .trend-card {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-radius: 10px;
                background: ${this.colors.surfaceLight};
            }
            
            .trend-card.warning { border-left: 4px solid ${this.colors.accent}; }
            .trend-card.success { border-left: 4px solid ${this.colors.secondary}; }
            .trend-card.danger { border-left: 4px solid ${this.colors.danger}; }
            .trend-card.info { border-left: 4px solid ${this.colors.info}; }
            
            .trend-icon { font-size: 1.5rem; }
            .trend-title { font-weight: 600; }
            .trend-desc { font-size: 0.9rem; color: ${this.colors.textMuted}; }
            
            /* Recommendations */
            .recommendations {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .recommendation-card {
                background: ${this.colors.surfaceLight};
                border-radius: 12px;
                padding: 1.25rem;
                border-left: 4px solid ${this.colors.border};
            }
            
            .recommendation-card.high { border-left-color: ${this.colors.danger}; }
            .recommendation-card.medium { border-left-color: ${this.colors.accent}; }
            .recommendation-card.info { border-left-color: ${this.colors.info}; }
            
            .rec-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .rec-icon { font-size: 1.25rem; }
            .rec-title { font-weight: 600; flex: 1; }
            
            .rec-priority {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-weight: 600;
            }
            
            .rec-priority.high { background: ${this.colors.danger}22; color: ${this.colors.danger}; }
            .rec-priority.medium { background: ${this.colors.accent}22; color: ${this.colors.accent}; }
            .rec-priority.info { background: ${this.colors.info}22; color: ${this.colors.info}; }
            
            .rec-desc {
                color: ${this.colors.textMuted};
                font-size: 0.9rem;
                margin: 0.5rem 0;
            }
            
            .rec-actions {
                margin: 0.5rem 0 0 1.5rem;
                padding: 0;
                color: ${this.colors.textMuted};
                font-size: 0.85rem;
            }
            
            .rec-actions li { margin-bottom: 0.25rem; }
            
            /* Problems */
            .problems-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
            }
            
            @media (max-width: 768px) {
                .problems-grid { grid-template-columns: 1fr; }
            }
            
            .problems-categories h3,
            .problems-words h3 {
                font-size: 1rem;
                margin: 0 0 1rem 0;
                color: ${this.colors.textMuted};
            }
            
            .category-item {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem;
                background: ${this.colors.surfaceLight};
                border-radius: 8px;
                margin-bottom: 0.5rem;
            }
            
            .cat-name { font-weight: 500; }
            .cat-count { 
                background: ${this.colors.primary}33;
                color: ${this.colors.primary};
                padding: 0.2rem 0.6rem;
                border-radius: 12px;
                font-size: 0.85rem;
                font-weight: 600;
            }
            
            .word-cloud {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            
            .word-tag {
                background: ${this.colors.surfaceLight};
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                color: ${this.colors.text};
            }
            
            /* Similar Tickets */
            .similar-groups {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .similar-group {
                background: ${this.colors.surfaceLight};
                border-radius: 10px;
                padding: 1rem;
            }
            
            .group-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.75rem;
            }
            
            .group-count {
                background: ${this.colors.accent}33;
                color: ${this.colors.accent};
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.85rem;
            }
            
            .group-keywords {
                color: ${this.colors.textMuted};
                font-size: 0.85rem;
            }
            
            .group-samples {
                margin: 0;
                padding-left: 1.5rem;
                color: ${this.colors.textMuted};
                font-size: 0.85rem;
            }
            
            .group-samples li { margin-bottom: 0.25rem; }
            
            /* SLA */
            .sla-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }
            
            .sla-card {
                background: ${this.colors.surfaceLight};
                border-radius: 12px;
                padding: 1.25rem;
                text-align: center;
            }
            
            .sla-title {
                font-size: 0.9rem;
                color: ${this.colors.textMuted};
                margin-bottom: 0.5rem;
            }
            
            .sla-rate {
                font-size: 2.5rem;
                font-weight: 700;
            }
            
            .sla-rate.good { color: ${this.colors.secondary}; }
            .sla-rate.warning { color: ${this.colors.accent}; }
            .sla-rate.bad { color: ${this.colors.danger}; }
            
            .sla-detail {
                font-size: 0.85rem;
                color: ${this.colors.textMuted};
                margin-top: 0.5rem;
            }
            
            /* Team Table */
            .team-table-wrapper {
                overflow-x: auto;
            }
            
            .team-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .team-table th,
            .team-table td {
                padding: 0.75rem 1rem;
                text-align: left;
                border-bottom: 1px solid ${this.colors.border};
            }
            
            .team-table th {
                background: ${this.colors.surfaceLight};
                font-weight: 600;
                color: ${this.colors.textMuted};
                font-size: 0.85rem;
            }
            
            .team-table td.good { color: ${this.colors.secondary}; font-weight: 600; }
            .team-table td.warning { color: ${this.colors.accent}; font-weight: 600; }
            .team-table td.bad { color: ${this.colors.danger}; font-weight: 600; }
            
            /* Patterns */
            .patterns-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1rem;
            }
            
            .pattern-card {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                background: ${this.colors.surfaceLight};
                border-radius: 10px;
                padding: 1rem;
            }
            
            .pattern-icon { font-size: 1.5rem; }
            .pattern-title { font-weight: 600; margin-bottom: 0.25rem; }
            .pattern-desc { font-size: 0.9rem; color: ${this.colors.textMuted}; }
            
            /* Footer */
            .insights-footer {
                text-align: center;
                padding: 1rem;
                color: ${this.colors.textMuted};
                font-size: 0.85rem;
            }
            
            .insights-footer p { margin: 0.25rem 0; }
            
            /* AI Button */
            .insights-btn.ai {
                background: linear-gradient(135deg, #8b5cf6, #ec4899);
                color: white;
                position: relative;
                overflow: hidden;
            }
            
            .insights-btn.ai::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
                to { left: 100%; }
            }
            
            .insights-btn.ai.ready {
                background: linear-gradient(135deg, #10b981, #3b82f6);
            }
            
            /* AI Status Banner */
            .ai-status-banner {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                border-radius: 10px;
                margin-bottom: 1.5rem;
                font-size: 0.9rem;
            }
            
            .ai-status-banner.not-loaded {
                background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15));
                border: 1px solid rgba(139,92,246,0.3);
            }
            
            .ai-status-banner.ready {
                background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15));
                border: 1px solid rgba(16,185,129,0.3);
            }
            
            .ai-status-icon { font-size: 1.25rem; }
            
            /* Loading Progress */
            .loading-progress {
                width: 300px;
                margin-top: 1rem;
            }
            
            .progress-bar {
                height: 8px;
                background: ${this.colors.surfaceLight};
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #8b5cf6, #ec4899);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .progress-text {
                display: block;
                text-align: center;
                margin-top: 0.5rem;
                font-size: 0.85rem;
            }
            
            /* AI Section */
            .ai-section {
                background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1));
                border: 1px solid rgba(139,92,246,0.2);
            }
            
            .ai-section .section-title {
                background: linear-gradient(135deg, #8b5cf6, #ec4899);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            /* AI Summary */
            .ai-summary {
                background: ${this.colors.surfaceLight};
                border-radius: 12px;
                padding: 1.25rem;
                margin-bottom: 1.5rem;
            }
            
            .ai-summary h3 {
                margin: 0 0 0.75rem 0;
                font-size: 1rem;
                color: ${this.colors.text};
            }
            
            .ai-summary-text p {
                margin: 0.5rem 0;
                line-height: 1.6;
                color: ${this.colors.textMuted};
            }
            
            /* Sentiment Analysis */
            .ai-sentiment {
                margin-bottom: 1.5rem;
            }
            
            .ai-sentiment h3 {
                margin: 0 0 1rem 0;
                font-size: 1rem;
            }
            
            .sentiment-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-bottom: 1rem;
            }
            
            .sentiment-card {
                background: ${this.colors.surfaceLight};
                border-radius: 12px;
                padding: 1.25rem;
                text-align: center;
            }
            
            .sentiment-card.negative { border-top: 3px solid ${this.colors.danger}; }
            .sentiment-card.neutral { border-top: 3px solid ${this.colors.textMuted}; }
            .sentiment-card.positive { border-top: 3px solid ${this.colors.secondary}; }
            
            .sentiment-value {
                font-size: 1.75rem;
                font-weight: 700;
            }
            
            .sentiment-card.negative .sentiment-value { color: ${this.colors.danger}; }
            .sentiment-card.neutral .sentiment-value { color: ${this.colors.textMuted}; }
            .sentiment-card.positive .sentiment-value { color: ${this.colors.secondary}; }
            
            .sentiment-label {
                font-size: 0.9rem;
                margin: 0.25rem 0;
            }
            
            .sentiment-count {
                font-size: 0.8rem;
                color: ${this.colors.textMuted};
            }
            
            /* Critical Tickets */
            .critical-tickets {
                background: rgba(239,68,68,0.1);
                border-radius: 10px;
                padding: 1rem;
                margin-top: 1rem;
            }
            
            .critical-tickets h4 {
                margin: 0 0 0.75rem 0;
                font-size: 0.9rem;
                color: ${this.colors.danger};
            }
            
            .critical-tickets ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .critical-tickets li {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 0.85rem;
            }
            
            .critical-tickets .ticket-id {
                background: ${this.colors.danger};
                color: white;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .critical-tickets .ticket-subject {
                flex: 1;
                color: ${this.colors.textMuted};
            }
            
            .critical-tickets .sentiment-score {
                color: ${this.colors.danger};
                font-size: 0.75rem;
            }
            
            /* AI Categories */
            .ai-categories {
                margin-bottom: 1.5rem;
            }
            
            .ai-categories h3 {
                margin: 0 0 1rem 0;
                font-size: 1rem;
            }
            
            .categories-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 0.75rem;
            }
            
            .category-card {
                background: ${this.colors.surfaceLight};
                border-radius: 10px;
                padding: 1rem;
            }
            
            .category-card .category-label {
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }
            
            .category-card .category-count {
                font-size: 1.5rem;
                font-weight: 700;
                color: ${this.colors.primary};
            }
            
            .category-card .category-bar {
                height: 4px;
                background: ${this.colors.dark};
                border-radius: 2px;
                margin-top: 0.5rem;
                overflow: hidden;
            }
            
            .category-card .bar-fill {
                height: 100%;
                background: linear-gradient(90deg, ${this.colors.primary}, ${this.colors.accent});
                border-radius: 2px;
            }
            
            /* AI Similar Groups */
            .ai-similar h3 {
                margin: 0 0 0.5rem 0;
                font-size: 1rem;
            }
            
            .similar-group-ai {
                background: ${this.colors.surfaceLight};
                border-radius: 10px;
                padding: 1rem;
                margin-bottom: 0.75rem;
            }
            
            .group-header-ai {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .group-badge {
                background: linear-gradient(135deg, #8b5cf6, #ec4899);
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
            }
            
            .similarity-score {
                color: ${this.colors.secondary};
                font-size: 0.85rem;
                font-weight: 500;
            }
            
            .group-preview {
                color: ${this.colors.textMuted};
                font-style: italic;
                font-size: 0.9rem;
                margin: 0.5rem 0;
            }
            
            .group-tickets {
                list-style: none;
                padding: 0;
                margin: 0.5rem 0 0 0;
            }
            
            .group-tickets li {
                font-size: 0.8rem;
                color: ${this.colors.textMuted};
                padding: 0.25rem 0;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .sentiment-grid {
                    grid-template-columns: 1fr;
                }
                
                .categories-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Criar instância global
window.insightsModule = new InsightsModule();
console.log('💡 Módulo de Insights carregado');
