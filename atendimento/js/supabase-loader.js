/**
 * Módulo para garantir carregamento correto do Supabase
 * Centraliza e gerencia a inicialização do cliente
 */

(function () {
  // Configuração Centralizada do Supabase
  // Requer EnvConfig carregado (js/env-config.js)
  const getEnvValue = (key) => {
    if (window.EnvConfig && window.EnvConfig.get) {
      return window.EnvConfig.get(key);
    }
    console.error(`⚠️ EnvConfig não disponível. Certifique-se de que env-config.js foi carregado antes.`);
    return null;
  };
  
  const SUPABASE_URL = getEnvValue('SUPABASE_URL');
  const SUPABASE_ANON_KEY = getEnvValue('SUPABASE_ANON_KEY');

  let initPromise = null;
  let client = null;

  /**
   * Garante que o Supabase está carregado e retorna o cliente
   * @returns {Promise} Cliente Supabase inicializado
   */
  async function getSupabaseClient() {
    // Se já temos o cliente, retorna
    if (client) {
      return client;
    }

    // Se já estamos inicializando, aguarda
    if (initPromise) {
      return initPromise;
    }

    // Inicia o processo de inicialização
    initPromise = new Promise(async (resolve, reject) => {
      try {
        // Aguarda até 5 segundos pela biblioteca
        let attempts = 0;
        while (!window.supabase && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }

        if (!window.supabase) {
          throw new Error('Biblioteca Supabase não carregou após 5 segundos');
        }

        // Cria o cliente
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Compartilha globalmente
        window.supabaseClient = client;
        window.supabaseClientBI = client;

        console.log('✅ Cliente Supabase inicializado com sucesso');

        // Testa a conexão
        const { error } = await client
          .from('tickets')
          .select('id')
          .limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 = tabela vazia
          console.warn('⚠️ Aviso ao testar conexão:', error.message);
        }

        resolve(client);
      } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        initPromise = null; // Reset para permitir retry
        reject(error);
      }
    });

    return initPromise;
  }

  /**
   * Verifica se o Supabase está pronto
   * @returns {boolean}
   */
  function isReady() {
    return client !== null;
  }

  /**
   * Reseta o cliente (útil para reconexão)
   */
  function reset() {
    client = null;
    initPromise = null;
    window.supabaseClient = null;
    window.supabaseClientBI = null;
  }

  // Exporta as funções
  window.SupabaseLoader = {
    getClient: getSupabaseClient,
    isReady: isReady,
    reset: reset,
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY
  };

  // Inicia o carregamento automaticamente
  document.addEventListener('DOMContentLoaded', () => {
    // Aguarda um pouco para garantir que todos os scripts foram carregados
    setTimeout(() => {
      getSupabaseClient().catch(console.error);
    }, 500);
  });

  console.log('📦 SupabaseLoader carregado');
})();
