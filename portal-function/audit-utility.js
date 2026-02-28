// ============================================
// AUDIT UTILITY - Sistema de Auditoria
// ============================================
// Este arquivo fornece funções para integrar o sistema de auditoria
// Deve ser incluído ANTES de outros scripts que fazem operações no banco

/**
 * Configura o contexto de auditoria antes de operações no banco de dados
 * Esta função DEVE ser chamada antes de qualquer INSERT, UPDATE ou DELETE
 * 
 * @param {Object} client - (Opcional) Cliente Supabase específico a usar. Se não fornecido, usa supabaseClient ou releaseClient
 * @returns {Promise<boolean>} true se configurado com sucesso, false caso contrário
 */
async function setAuditContext(client = null) {
    try {
        // Obter dados do usuário logado do localStorage
        const userId = localStorage.getItem('user_id');
        const userName = localStorage.getItem('username');

        console.log('🔍 [DEBUG] setAuditContext iniciado');
        console.log('🔍 [DEBUG] userId:', userId);
        console.log('🔍 [DEBUG] userName:', userName);
        console.log('🔍 [DEBUG] Cliente fornecido:', client ? 'Sim' : 'Não');

        // Validar se os dados existem
        if (!userId || !userName) {
            console.warn('⚠️ Auditoria: Dados do usuário não encontrados. Operação será registrada sem identificação do usuário.');
            console.warn('⚠️ [DEBUG] localStorage completo:', {
                user_id: localStorage.getItem('user_id'),
                username: localStorage.getItem('username'),
                user_email: localStorage.getItem('user_email')
            });
            return false;
        }

        // Usar o cliente fornecido ou o cliente padrão disponível
        const targetClient = client || supabaseClient || releaseClient;

        if (!targetClient) {
            console.error('❌ Auditoria: Cliente Supabase não disponível');
            return false;
        }

        console.log('🔍 [DEBUG] Cliente Supabase:', targetClient ? 'Disponível' : 'Indisponível');

        // Chamar a função RPC do Supabase para configurar o contexto
        console.log('🔍 [DEBUG] Chamando set_audit_context com:', { user_id: userId, user_name: userName });

        const { data, error } = await targetClient.rpc('set_audit_context', {
            user_id: userId,
            user_name: userName
        });

        if (error) {
            console.error('❌ Erro ao configurar contexto de auditoria:', error);
            console.error('❌ [DEBUG] Detalhes do erro:', JSON.stringify(error, null, 2));
            return false;
        }

        console.log('✅ Contexto de auditoria configurado:', { userId, userName });
        console.log('✅ [DEBUG] Resposta do RPC:', data);
        return true;

    } catch (error) {
        console.error('❌ Erro ao configurar auditoria:', error);
        console.error('❌ [DEBUG] Stack trace:', error.stack);
        return false;
    }
}

/**
 * Wrapper para operações INSERT com auditoria automática ATÔMICA
 * Usa RPC para garantir que o contexto e o insert ocorram na mesma transação.
 * 
 * @param {Object} client - Cliente Supabase
 * @param {string} tableName - Nome da tabela
 * @param {Object|Array} data - Dados a inserir (Objeto único ou Array)
 * @returns {Promise<Object>} Resultado da operação { data, error }
 */
async function auditedInsert(client, tableName, data) {
    try {
        const userId = localStorage.getItem('user_id');
        const userName = localStorage.getItem('username');

        if (!userId || !userName) {
            console.warn('⚠️ Auditoria: Dados do usuário não encontrados. Usando insert padrão.');
            return await client.from(tableName).insert(data).select();
        }

        // Converter para array se for objeto único
        const payload = Array.isArray(data) ? data : [data];

        console.log(`🔍 [AUDIT] Inserindo em ${tableName} via RPC audited_insert`);

        // Chamar RPC atômico
        const { data: result, error } = await client.rpc('audited_insert', {
            table_name: tableName,
            data: payload,
            user_id: userId,
            user_name: userName
        });

        if (error) {
            console.error('❌ Erro no RPC audited_insert:', error);
            throw error;
        }

        return { data: result, error: null };

    } catch (error) {
        console.error('❌ Falha na auditoria, tentando fallback direto:', error);
        // Fallback: tenta insert normal se o RPC falhar (mas sem auditoria de usuário garantida)
        return await client.from(tableName).insert(data).select();
    }
}

/**
 * Wrapper para operações UPDATE com auditoria automática ATÔMICA
 * 
 * @param {Object} client - Cliente Supabase
 * @param {string} tableName - Nome da tabela
 * @param {string|number} recordId - ID do registro a atualizar
 * @param {Object} data - Dados a atualizar
 * @returns {Promise<Object>} Resultado da operação { data, error }
 */
async function auditedUpdate(client, tableName, recordId, data) {
    try {
        const userId = localStorage.getItem('user_id');
        const userName = localStorage.getItem('username');

        if (!userId || !userName) {
            console.warn('⚠️ Auditoria: Dados do usuário não encontrados. Usando update padrão.');
            return await client.from(tableName).update(data).eq('id', recordId).select();
        }

        console.log(`🔍 [AUDIT] Atualizando ${tableName}:${recordId} via RPC audited_update`);

        const { data: result, error } = await client.rpc('audited_update', {
            table_name: tableName,
            data: data,
            record_id: String(recordId),
            user_id: userId,
            user_name: userName
        });

        if (error) {
            console.error('❌ Erro no RPC audited_update:', error);
            throw error;
        }

        return { data: result, error: null };

    } catch (error) {
        console.error('❌ Falha na auditoria (Update), tentando fallback:', error);
        return await client.from(tableName).update(data).eq('id', recordId).select();
    }
}

/**
 * Wrapper para operações DELETE com auditoria automática ATÔMICA
 * 
 * @param {Object} client - Cliente Supabase
 * @param {string} tableName - Nome da tabela
 * @param {string|number} recordId - ID do registro a excluir
 * @returns {Promise<Object>} Resultado da operação { data, error }
 */
async function auditedDelete(client, tableName, recordId) {
    try {
        const userId = localStorage.getItem('user_id');
        const userName = localStorage.getItem('username');

        if (!userId || !userName) {
            console.warn('⚠️ Auditoria: Dados do usuário não encontrados. Usando delete padrão.');
            return await client.from(tableName).delete().eq('id', recordId).select();
        }

        console.log(`🔍 [AUDIT] Excluindo ${tableName}:${recordId} via RPC audited_delete`);

        const { data: result, error } = await client.rpc('audited_delete', {
            table_name: tableName,
            record_id: String(recordId),
            user_id: userId,
            user_name: userName
        });

        if (error) {
            console.error('❌ Erro no RPC audited_delete:', error);
            throw error;
        }

        return { data: result, error: null };

    } catch (error) {
        console.error('❌ Falha na auditoria (Delete), tentando fallback:', error);
        return await client.from(tableName).delete().eq('id', recordId);
    }
}

/**
 * Wrapper para operações UPDATE com auditoria automática
 * 
 * @param {Object} client - Cliente Supabase
 * @param {string} tableName - Nome da tabela
 * @param {Object} data - Dados a atualizar
 * @returns {Object} Query builder para continuar a query
 */
async function auditedUpdate(client, tableName, data) {
    await setAuditContext();
    return client.from(tableName).update(data);
}

/**
 * Wrapper para operações DELETE com auditoria automática
 * 
 * @param {Object} client - Cliente Supabase
 * @param {string} tableName - Nome da tabela
 * @returns {Object} Query builder para continuar a query
 */
async function auditedDelete(client, tableName) {
    await setAuditContext();
    return client.from(tableName).delete();
}

/**
 * Wrapper para operações UPSERT com auditoria automática
 * 
 * @param {Object} client - Cliente Supabase
 * @param {string} tableName - Nome da tabela
 * @param {Object|Array} data - Dados a fazer upsert
 * @param {Object} options - Opções do upsert
 * @returns {Promise<Object>} Resultado da operação
 */
async function auditedUpsert(client, tableName, data, options = {}) {
    await setAuditContext();
    return await client.from(tableName).upsert(data, options);
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
    window.setAuditContext = setAuditContext;
    window.auditedInsert = auditedInsert;
    window.auditedUpdate = auditedUpdate;
    window.auditedDelete = auditedDelete;
    window.auditedUpsert = auditedUpsert;
}

console.log('✅ Audit Utility carregado com sucesso');
