/**
 * AI Transformers Module - IA no Browser com Transformers.js
 * Análise de sentimento, categorização e similaridade de tickets
 */

class AITransformers {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
        this.models = {
            sentiment: null,
            embeddings: null,
            classifier: null
        };
        
        // Cache de embeddings para não recalcular
        this.embeddingsCache = new Map();
        
        // Status de carregamento
        this.loadingStatus = {
            sentiment: 'pending',
            embeddings: 'pending'
        };
        
        // Configuração
        this.config = {
            // Modelos menores e mais rápidos para browser
            sentimentModel: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            embeddingsModel: 'Xenova/all-MiniLM-L6-v2',
            maxTokens: 512,
            batchSize: 10
        };
        
        // Categorias customizadas para tickets de suporte
        this.ticketCategories = {
            'acesso': {
                keywords: ['login', 'senha', 'acesso', 'autenticação', 'permissão', 'bloqueado', 'credencial', 'usuário'],
                label: '🔐 Acesso/Autenticação'
            },
            'erro': {
                keywords: ['erro', 'bug', 'falha', 'crash', 'quebrado', 'não funciona', 'parou', 'travou', 'exception'],
                label: '🐛 Erro/Bug'
            },
            'performance': {
                keywords: ['lento', 'lentidão', 'demora', 'travando', 'performance', 'carregando', 'timeout'],
                label: '⚡ Performance'
            },
            'integracao': {
                keywords: ['integração', 'api', 'sincronização', 'conexão', 'webhook', 'endpoint'],
                label: '🔗 Integração/API'
            },
            'dados': {
                keywords: ['dados', 'relatório', 'exportar', 'importar', 'duplicado', 'faltando', 'incorreto'],
                label: '📊 Dados/Relatórios'
            },
            'melhoria': {
                keywords: ['melhoria', 'sugestão', 'novo', 'criar', 'adicionar', 'implementar', 'feature'],
                label: '✨ Melhoria/Feature'
            },
            'duvida': {
                keywords: ['como', 'dúvida', 'ajuda', 'explicar', 'funciona', 'onde', 'qual'],
                label: '❓ Dúvida/Suporte'
            },
            'configuracao': {
                keywords: ['configurar', 'configuração', 'setup', 'parametrização', 'ajuste', 'alterar'],
                label: '⚙️ Configuração'
            }
        };
    }
    
    /**
     * Inicializa os modelos de IA
     */
    async initialize(progressCallback = null) {
        if (this.isLoaded || this.isLoading) return;
        
        this.isLoading = true;
        console.log('🤖 Inicializando Transformers.js...');
        
        try {
            // Verificar se Transformers.js está disponível
            if (typeof window.transformers === 'undefined') {
                // Carregar dinamicamente
                await this.loadTransformersLibrary();
            }
            
            const { pipeline, env } = window.transformers;
            
            // Configurar para usar cache local
            env.allowLocalModels = false;
            env.useBrowserCache = true;
            
            // Carregar modelo de sentimento
            if (progressCallback) progressCallback('Carregando análise de sentimento...', 30);
            this.loadingStatus.sentiment = 'loading';
            
            try {
                this.models.sentiment = await pipeline(
                    'sentiment-analysis',
                    this.config.sentimentModel,
                    { progress_callback: (p) => this.onProgress(p, progressCallback) }
                );
                this.loadingStatus.sentiment = 'ready';
                console.log('✅ Modelo de sentimento carregado');
            } catch (e) {
                console.warn('⚠️ Modelo de sentimento não disponível, usando fallback');
                this.loadingStatus.sentiment = 'fallback';
            }
            
            // Carregar modelo de embeddings para similaridade
            if (progressCallback) progressCallback('Carregando análise de similaridade...', 60);
            this.loadingStatus.embeddings = 'loading';
            
            try {
                this.models.embeddings = await pipeline(
                    'feature-extraction',
                    this.config.embeddingsModel,
                    { progress_callback: (p) => this.onProgress(p, progressCallback) }
                );
                this.loadingStatus.embeddings = 'ready';
                console.log('✅ Modelo de embeddings carregado');
            } catch (e) {
                console.warn('⚠️ Modelo de embeddings não disponível, usando fallback');
                this.loadingStatus.embeddings = 'fallback';
            }
            
            this.isLoaded = true;
            this.isLoading = false;
            
            if (progressCallback) progressCallback('IA pronta!', 100);
            console.log('🤖 Transformers.js inicializado com sucesso!');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Transformers.js:', error);
            this.isLoading = false;
            
            // Usar fallback sem IA
            this.isLoaded = true;
            this.loadingStatus.sentiment = 'fallback';
            this.loadingStatus.embeddings = 'fallback';
            
            return false;
        }
    }
    
    /**
     * Carrega a biblioteca Transformers.js dinamicamente
     */
    async loadTransformersLibrary() {
        return new Promise((resolve, reject) => {
            if (window.transformers) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = `
                import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
                window.transformers = { pipeline, env };
                window.dispatchEvent(new Event('transformers-loaded'));
            `;
            
            window.addEventListener('transformers-loaded', () => resolve(), { once: true });
            
            document.head.appendChild(script);
            
            // Timeout de 30 segundos
            setTimeout(() => {
                if (!window.transformers) {
                    reject(new Error('Timeout ao carregar Transformers.js'));
                }
            }, 30000);
        });
    }
    
    onProgress(progress, callback) {
        if (callback && progress.progress) {
            const percent = Math.round(progress.progress * 100);
            callback(`Baixando modelo... ${percent}%`, percent);
        }
    }
    
    /**
     * Analisa o sentimento de um texto
     */
    async analyzeSentiment(text) {
        if (!text || text.length < 10) {
            return { label: 'NEUTRAL', score: 0.5 };
        }
        
        // Se modelo não está disponível, usar análise baseada em keywords
        if (this.loadingStatus.sentiment !== 'ready') {
            return this.analyzeSentimentFallback(text);
        }
        
        try {
            const truncated = text.substring(0, this.config.maxTokens * 4);
            const result = await this.models.sentiment(truncated);
            
            return {
                label: result[0].label,
                score: result[0].score,
                isNegative: result[0].label === 'NEGATIVE',
                isPositive: result[0].label === 'POSITIVE'
            };
        } catch (e) {
            return this.analyzeSentimentFallback(text);
        }
    }
    
    /**
     * Fallback de análise de sentimento baseado em keywords
     */
    analyzeSentimentFallback(text) {
        const lowerText = text.toLowerCase();
        
        const negativeWords = [
            'urgente', 'crítico', 'grave', 'erro', 'falha', 'problema',
            'não funciona', 'travou', 'parou', 'lento', 'péssimo',
            'horrível', 'absurdo', 'inaceitável', 'frustrado', 'irritado',
            'decepcionado', 'insatisfeito', 'reclamação', 'prejudicado'
        ];
        
        const positiveWords = [
            'obrigado', 'agradeço', 'excelente', 'ótimo', 'perfeito',
            'resolvido', 'funcionando', 'satisfeito', 'bom', 'legal'
        ];
        
        let negScore = 0;
        let posScore = 0;
        
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negScore++;
        });
        
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) posScore++;
        });
        
        const total = negScore + posScore || 1;
        const sentiment = posScore > negScore ? 'POSITIVE' : 
                         negScore > posScore ? 'NEGATIVE' : 'NEUTRAL';
        
        return {
            label: sentiment,
            score: sentiment === 'POSITIVE' ? 0.5 + (posScore / total) * 0.5 :
                   sentiment === 'NEGATIVE' ? 0.5 + (negScore / total) * 0.5 : 0.5,
            isNegative: sentiment === 'NEGATIVE',
            isPositive: sentiment === 'POSITIVE',
            isFallback: true
        };
    }
    
    /**
     * Yield para não bloquear a UI - essencial para evitar travamentos
     */
    async yieldToMain() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    
    /**
     * Analisa sentimento de múltiplos tickets com yields para não travar UI
     */
    async analyzeSentimentBatch(tickets, progressCallback = null) {
        const results = [];
        const total = tickets.length;
        const YIELD_INTERVAL = 5; // Yield a cada 5 tickets para manter UI responsiva
        
        for (let i = 0; i < total; i++) {
            const ticket = tickets[i];
            const text = (ticket.subject || '') + ' ' + (ticket.description_text || '');
            
            const sentiment = await this.analyzeSentiment(text);
            results.push({
                ticketId: ticket.id,
                subject: ticket.subject,
                sentiment
            });
            
            // Yield periodicamente para manter UI responsiva
            if (i % YIELD_INTERVAL === 0) {
                await this.yieldToMain();
                if (progressCallback) {
                    progressCallback(`Analisando sentimentos... ${i}/${total}`, Math.round(i / total * 100));
                }
            }
        }
        
        return results;
    }
    
    /**
     * Gera embedding de um texto
     */
    async getEmbedding(text) {
        if (!text) return null;
        
        // Verificar cache
        const cacheKey = text.substring(0, 100);
        if (this.embeddingsCache.has(cacheKey)) {
            return this.embeddingsCache.get(cacheKey);
        }
        
        // Se modelo não está disponível, retornar null
        if (this.loadingStatus.embeddings !== 'ready') {
            return null;
        }
        
        try {
            const truncated = text.substring(0, this.config.maxTokens * 4);
            const result = await this.models.embeddings(truncated, {
                pooling: 'mean',
                normalize: true
            });
            
            const embedding = Array.from(result.data);
            
            // Cachear
            this.embeddingsCache.set(cacheKey, embedding);
            
            return embedding;
        } catch (e) {
            console.warn('Erro ao gerar embedding:', e);
            return null;
        }
    }
    
    /**
     * Calcula similaridade entre dois textos usando embeddings
     */
    async calculateSimilarity(text1, text2) {
        const emb1 = await this.getEmbedding(text1);
        const emb2 = await this.getEmbedding(text2);
        
        if (!emb1 || !emb2) {
            // Fallback: usar Jaccard com palavras
            return this.calculateJaccardSimilarity(text1, text2);
        }
        
        return this.cosineSimilarity(emb1, emb2);
    }
    
    /**
     * Calcula similaridade do cosseno
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    /**
     * Fallback: similaridade de Jaccard
     */
    calculateJaccardSimilarity(text1, text2) {
        const words1 = new Set(this.tokenize(text1));
        const words2 = new Set(this.tokenize(text2));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    tokenize(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);
    }
    
    /**
     * Encontra tickets similares usando IA - com yields para não travar UI
     */
    async findSimilarTicketsAI(tickets, progressCallback = null) {
        const groups = [];
        const processed = new Set();
        
        // Limitar para performance - reduzido para evitar travamentos
        const maxTickets = Math.min(100, tickets.length);
        const sample = tickets.slice(0, maxTickets);
        
        // Pré-calcular embeddings com yields
        if (progressCallback) progressCallback('Calculando embeddings...', 10);
        
        const embeddings = [];
        const YIELD_INTERVAL = 3; // Yield a cada 3 tickets
        
        for (let i = 0; i < sample.length; i++) {
            const ticket = sample[i];
            const text = (ticket.subject || '') + ' ' + (ticket.description_text || '').substring(0, 200);
            const emb = await this.getEmbedding(text);
            embeddings.push({ ticket, embedding: emb, text });
            
            // Yield periodicamente
            if (i % YIELD_INTERVAL === 0) {
                await this.yieldToMain();
                if (progressCallback) {
                    progressCallback(`Processando tickets... ${i}/${maxTickets}`, 10 + Math.round(i / maxTickets * 50));
                }
            }
        }
        
        // Agrupar similares com yields
        if (progressCallback) progressCallback('Agrupando similares...', 60);
        
        let processedCount = 0;
        for (let i = 0; i < embeddings.length; i++) {
            if (processed.has(i)) continue;
            
            const current = embeddings[i];
            if (!current.embedding) continue;
            
            const similar = [current.ticket];
            const similarities = [];
            
            for (let j = i + 1; j < embeddings.length; j++) {
                if (processed.has(j)) continue;
                
                const other = embeddings[j];
                if (!other.embedding) continue;
                
                const sim = this.cosineSimilarity(current.embedding, other.embedding);
                
                if (sim >= 0.7) {
                    similar.push(other.ticket);
                    similarities.push(sim);
                    processed.add(j);
                }
            }
            
            if (similar.length >= 2) {
                groups.push({
                    count: similar.length,
                    avgSimilarity: similarities.length > 0 
                        ? similarities.reduce((a, b) => a + b, 0) / similarities.length 
                        : 1,
                    sample: similar.slice(0, 5),
                    representativeText: current.text.substring(0, 100)
                });
                processed.add(i);
            }
            
            // Yield a cada iteração do loop externo
            processedCount++;
            if (processedCount % 5 === 0) {
                await this.yieldToMain();
                if (progressCallback) {
                    progressCallback(`Agrupando... ${processedCount}/${embeddings.length}`, 60 + Math.round(processedCount / embeddings.length * 35));
                }
            }
        }
        
        if (progressCallback) progressCallback('Concluído!', 100);
        
        return groups.sort((a, b) => b.count - a.count);
    }
    
    /**
     * Categoriza um ticket usando IA + keywords
     */
    async categorizeTicket(ticket) {
        const text = ((ticket.subject || '') + ' ' + (ticket.description_text || '')).toLowerCase();
        
        // Primeiro, tentar categorização por keywords (mais rápido)
        const categories = [];
        
        for (const [key, config] of Object.entries(this.ticketCategories)) {
            const matches = config.keywords.filter(kw => text.includes(kw));
            if (matches.length > 0) {
                categories.push({
                    category: key,
                    label: config.label,
                    confidence: Math.min(1, matches.length * 0.3),
                    matchedKeywords: matches
                });
            }
        }
        
        // Ordenar por confiança
        categories.sort((a, b) => b.confidence - a.confidence);
        
        return categories.length > 0 ? categories : [{
            category: 'outros',
            label: '📌 Outros',
            confidence: 0.5,
            matchedKeywords: []
        }];
    }
    
    /**
     * Categoriza múltiplos tickets - com yields para não travar UI
     */
    async categorizeTicketsBatch(tickets, progressCallback = null) {
        const categoryCounts = {};
        const YIELD_INTERVAL = 20; // Yield a cada 20 tickets
        
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const categories = await this.categorizeTicket(ticket);
            const mainCategory = categories[0];
            
            if (!categoryCounts[mainCategory.category]) {
                categoryCounts[mainCategory.category] = {
                    label: mainCategory.label,
                    count: 0,
                    tickets: []
                };
            }
            
            categoryCounts[mainCategory.category].count++;
            if (categoryCounts[mainCategory.category].tickets.length < 5) {
                categoryCounts[mainCategory.category].tickets.push({
                    id: ticket.id,
                    subject: ticket.subject,
                    confidence: mainCategory.confidence
                });
            }
            
            // Yield periodicamente
            if (i % YIELD_INTERVAL === 0) {
                await this.yieldToMain();
                if (progressCallback) {
                    progressCallback(`Categorizando... ${i}/${tickets.length}`, Math.round(i / tickets.length * 100));
                }
            }
        }
        
        return Object.entries(categoryCounts)
            .map(([key, data]) => ({
                category: key,
                ...data
            }))
            .sort((a, b) => b.count - a.count);
    }
    
    /**
     * Gera insights baseados em IA
     */
    async generateAIInsights(tickets, progressCallback = null) {
        const insights = {
            sentiment: null,
            categories: null,
            similarGroups: null,
            criticalTickets: [],
            summary: null
        };
        
        try {
            // 1. Análise de sentimento
            if (progressCallback) progressCallback('Analisando sentimentos...', 10);
            
            const sentiments = await this.analyzeSentimentBatch(
                tickets.slice(0, 100), 
                (msg, pct) => progressCallback && progressCallback(msg, 10 + pct * 0.2)
            );
            
            const negativeCount = sentiments.filter(s => s.sentiment.isNegative).length;
            const positiveCount = sentiments.filter(s => s.sentiment.isPositive).length;
            
            insights.sentiment = {
                analyzed: sentiments.length,
                negative: negativeCount,
                positive: positiveCount,
                neutral: sentiments.length - negativeCount - positiveCount,
                negativePercent: (negativeCount / sentiments.length * 100).toFixed(1),
                criticalTickets: sentiments
                    .filter(s => s.sentiment.isNegative && s.sentiment.score > 0.8)
                    .slice(0, 10)
            };
            
            // 2. Categorização
            if (progressCallback) progressCallback('Categorizando tickets...', 40);
            
            insights.categories = await this.categorizeTicketsBatch(
                tickets,
                (msg, pct) => progressCallback && progressCallback(msg, 40 + pct * 0.3)
            );
            
            // 3. Tickets similares (se IA disponível)
            if (this.loadingStatus.embeddings === 'ready') {
                if (progressCallback) progressCallback('Encontrando similares...', 70);
                
                insights.similarGroups = await this.findSimilarTicketsAI(
                    tickets,
                    (msg, pct) => progressCallback && progressCallback(msg, 70 + pct * 0.25)
                );
            }
            
            // 4. Gerar resumo textual
            if (progressCallback) progressCallback('Gerando resumo...', 95);
            
            insights.summary = this.generateTextSummary(tickets, insights);
            
            if (progressCallback) progressCallback('Análise de IA concluída!', 100);
            
        } catch (error) {
            console.error('Erro na análise de IA:', error);
        }
        
        return insights;
    }
    
    /**
     * Gera resumo textual dos insights
     */
    generateTextSummary(tickets, insights) {
        const parts = [];
        
        // Total
        parts.push(`📊 Foram analisados ${tickets.length.toLocaleString()} tickets.`);
        
        // Sentimento
        if (insights.sentiment) {
            if (insights.sentiment.negativePercent > 30) {
                parts.push(`⚠️ Atenção: ${insights.sentiment.negativePercent}% dos tickets analisados têm tom negativo, indicando possível insatisfação dos clientes.`);
            } else if (insights.sentiment.negativePercent < 10) {
                parts.push(`✅ Bom indicador: apenas ${insights.sentiment.negativePercent}% dos tickets têm tom negativo.`);
            }
        }
        
        // Categorias principais
        if (insights.categories && insights.categories.length > 0) {
            const top3 = insights.categories.slice(0, 3);
            const topCategories = top3.map(c => `${c.label} (${c.count})`).join(', ');
            parts.push(`🏷️ Principais categorias: ${topCategories}.`);
            
            // Alerta se muitos erros
            const erros = insights.categories.find(c => c.category === 'erro');
            if (erros && erros.count > tickets.length * 0.3) {
                parts.push(`🐛 Alto volume de tickets sobre erros (${erros.count}). Considere revisar a qualidade do sistema.`);
            }
        }
        
        // Tickets similares
        if (insights.similarGroups && insights.similarGroups.length > 0) {
            const totalSimilar = insights.similarGroups.reduce((sum, g) => sum + g.count, 0);
            parts.push(`🔗 Encontrados ${insights.similarGroups.length} grupos de tickets similares (${totalSimilar} tickets). Isso pode indicar problemas recorrentes que precisam de solução definitiva.`);
        }
        
        return parts.join('\n\n');
    }
    
    /**
     * Verifica se a IA está disponível
     */
    isAIAvailable() {
        return this.isLoaded && (
            this.loadingStatus.sentiment === 'ready' || 
            this.loadingStatus.embeddings === 'ready'
        );
    }
    
    /**
     * Retorna status de carregamento
     */
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            models: this.loadingStatus,
            cacheSize: this.embeddingsCache.size
        };
    }
}

// Criar instância global
window.aiTransformers = new AITransformers();
console.log('🤖 AI Transformers Module carregado');
