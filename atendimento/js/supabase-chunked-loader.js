/**
 * Supabase Chunked Loader
 * Otimizado para carregar grandes volumes de dados evitando timeout
 */

class SupabaseChunkedLoader {
    constructor() {
        this.DEFAULT_CHUNK_SIZE = 500;
        this.SMALL_CHUNK_SIZE = 100;
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 segundo
        this.MAX_TICKETS = 10000;
    }

    /**
     * Carrega tickets em chunks com retry automático
     * @param {Object} client - Cliente Supabase
     * @param {Object} options - Opções de carregamento
     * @returns {Promise<Array>} Array de tickets
     */
    async loadTickets(client, options = {}) {
        const {
            tableName = 'Tickets',
            chunkSize = this.DEFAULT_CHUNK_SIZE,
            maxTickets = this.MAX_TICKETS,
            onProgress = null,
            orderBy = 'updated_at',
            ascending = false
        } = options;

        let allData = [];
        let offset = 0;
        let hasMore = true;
        let currentChunkSize = chunkSize;
        let consecutiveErrors = 0;

        console.log(`📦 Iniciando carregamento em chunks de ${chunkSize} tickets...`);

        while (hasMore && allData.length < maxTickets) {
            try {
                // Notificar progresso
                if (onProgress) {
                    onProgress({
                        loaded: allData.length,
                        current: offset,
                        chunkSize: currentChunkSize,
                        message: `Carregando tickets ${offset + 1} a ${offset + currentChunkSize}...`
                    });
                }

                // Buscar chunk
                const result = await this.fetchChunk(
                    client, 
                    tableName, 
                    offset, 
                    currentChunkSize,
                    orderBy,
                    ascending
                );

                if (result.data && result.data.length > 0) {
                    allData = allData.concat(result.data);
                    consecutiveErrors = 0; // Reset erro counter
                    
                    // Se retornou menos que o chunk size, não há mais dados
                    if (result.data.length < currentChunkSize) {
                        hasMore = false;
                    } else {
                        offset += currentChunkSize;
                    }

                    // Restaurar chunk size se estava reduzido
                    if (currentChunkSize < chunkSize) {
                        currentChunkSize = chunkSize;
                        console.log(`✅ Restaurando chunk size para ${chunkSize}`);
                    }
                } else {
                    hasMore = false;
                }

                // Pequena pausa entre requests
                if (hasMore) {
                    await this.sleep(100);
                }

            } catch (error) {
                console.error(`❌ Erro ao buscar chunk ${offset}:`, error);
                consecutiveErrors++;

                // Se for timeout, reduzir chunk size
                if (error.code === '57014') {
                    currentChunkSize = Math.max(this.SMALL_CHUNK_SIZE, Math.floor(currentChunkSize / 2));
                    console.log(`⚠️ Timeout detectado. Reduzindo chunk size para ${currentChunkSize}`);
                    await this.sleep(this.RETRY_DELAY);
                } 
                // Se muitos erros consecutivos, parar
                else if (consecutiveErrors >= this.MAX_RETRIES) {
                    console.error('❌ Muitos erros consecutivos. Parando carregamento.');
                    hasMore = false;
                } 
                // Tentar novamente com delay
                else {
                    console.log(`🔄 Tentando novamente em ${this.RETRY_DELAY}ms...`);
                    await this.sleep(this.RETRY_DELAY);
                }
            }
        }

        console.log(`✅ Carregamento completo: ${allData.length} tickets`);
        return allData;
    }

    /**
     * Busca um chunk de dados
     */
    async fetchChunk(client, tableName, offset, limit, orderBy, ascending) {
        const query = client
            .from(tableName)
            .select('*')
            .order(orderBy, { ascending })
            .range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { data };
    }

    /**
     * Carrega apenas campos essenciais para performance
     */
    async loadTicketsOptimized(client, options = {}) {
        const {
            tableName = 'Tickets',
            fields = 'id,subject,status,priority,created_at,updated_at,responder_name,group_name,cf_tratativa,cf_grupo_tratativa,custom_fields,source,description_text,stats_resolved_at,stats_closed_at,stats_first_responded_at',
            ...restOptions
        } = options;

        console.log('🚀 Modo otimizado: carregando apenas campos essenciais');

        let allData = [];
        let offset = 0;
        let hasMore = true;
        const chunkSize = 1000; // Maior chunk para campos limitados

        while (hasMore && allData.length < this.MAX_TICKETS) {
            try {
                if (options.onProgress) {
                    options.onProgress({
                        loaded: allData.length,
                        message: `Carregando ${offset + 1} a ${offset + chunkSize} (modo otimizado)...`
                    });
                }

                const { data, error } = await client
                    .from(tableName)
                    .select(fields)
                    .order('updated_at', { ascending: false })
                    .range(offset, offset + chunkSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = allData.concat(data);
                    
                    if (data.length < chunkSize) {
                        hasMore = false;
                    } else {
                        offset += chunkSize;
                    }
                } else {
                    hasMore = false;
                }

                if (hasMore) {
                    await this.sleep(50); // Pausa menor no modo otimizado
                }

            } catch (error) {
                console.error('Erro no modo otimizado:', error);
                // Fallback para modo normal se falhar
                console.log('⚠️ Fallback para modo normal...');
                return this.loadTickets(client, restOptions);
            }
        }

        console.log(`✅ Carregamento otimizado completo: ${allData.length} tickets`);
        return allData;
    }

    /**
     * Conta total de tickets sem carregar todos os dados
     */
    async countTickets(client, tableName = 'Tickets') {
        try {
            const { count, error } = await client
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (error) throw error;

            console.log(`📊 Total de tickets no Supabase: ${count}`);
            return count;
        } catch (error) {
            console.error('Erro ao contar tickets:', error);
            return null;
        }
    }

    /**
     * Helper para sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exportar instância global
window.SupabaseChunkedLoader = new SupabaseChunkedLoader();
