/**
 * CONFIGURAÇÃO DE LOGS DO SYNC
 * 
 * Este arquivo configura para onde os logs de validação serão enviados.
 * Edite as variáveis abaixo ou use variáveis de ambiente.
 */

module.exports = {
  // ============================================
  // GITHUB - Enviar logs como Issues
  // ============================================
  
  // Habilitar envio para GitHub Issues
  SEND_TO_GITHUB: process.env.SEND_LOGS_TO_GITHUB === 'true' || false,
  
  // Repositórios para receber os logs (separados por vírgula)
  // Formato: "owner/repo,owner2/repo2"
  // Exemplos:
  //   - "supabasedas/atendimento"
  //   - "OnJoaoclosed/atendimento"
  //   - "supabasedas/atendimento,OnJoaoclosed/atendimento" (ambos)
  GITHUB_REPOS: process.env.LOG_GITHUB_REPOS || 'supabasedas/atendimento',
  
  // Token do GitHub com permissão para criar issues
  // Obtenha em: https://github.com/settings/tokens
  // Permissões necessárias: repo (para repos privados) ou public_repo (para públicos)
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  
  // Labels para as issues criadas
  GITHUB_LABELS: ['sync-log', 'automated'],

  // ============================================
  // SUPABASE - Enviar logs para tabela
  // ============================================
  
  // Habilitar envio para Supabase
  SEND_TO_SUPABASE: process.env.SEND_LOGS_TO_SUPABASE === 'true' || false,
  
  // Credenciais (usadas das variáveis de ambiente existentes)
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Tabela para armazenar logs
  SUPABASE_LOG_TABLE: 'sync_logs',

  // ============================================
  // FILTROS DE LOG
  // ============================================
  
  // Nível mínimo para enviar (info, warning, error)
  // - info: todos os logs
  // - warning: apenas warnings e errors
  // - error: apenas errors críticos
  MIN_LOG_LEVEL: process.env.LOG_MIN_LEVEL || 'warning',
  
  // Criar issue apenas se houver mais de X problemas
  MIN_ISSUES_TO_REPORT: parseInt(process.env.LOG_MIN_ISSUES || '1'),
  
  // Máximo de detalhes por relatório
  MAX_DETAILS_PER_REPORT: 50,

  // ============================================
  // CONSOLE
  // ============================================
  
  // Sempre mostrar no console (não desativável)
  SHOW_IN_CONSOLE: true,
  
  // Mostrar campos opcionais faltando no console
  SHOW_OPTIONAL_MISSING: false
};
