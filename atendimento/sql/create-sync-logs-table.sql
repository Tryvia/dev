-- ============================================
-- TABELA PARA LOGS DE SINCRONIZAÇÃO
-- ============================================
-- Esta tabela armazena logs de validação de campos
-- durante a sincronização Freshdesk → Supabase

CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type VARCHAR(50),                    -- ticket, conversation, agent, etc
    record_id BIGINT,                    -- ID do registro com problema
    level VARCHAR(20),                   -- info, warning, error
    missing_critical TEXT[],             -- Campos críticos faltando
    missing_important TEXT[],            -- Campos importantes faltando
    missing_optional TEXT[],             -- Campos opcionais faltando
    sync_run_id UUID DEFAULT gen_random_uuid(), -- ID desta execução de sync
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_level ON sync_logs(level);
CREATE INDEX IF NOT EXISTS idx_sync_logs_record_id ON sync_logs(record_id);

-- Comentários
COMMENT ON TABLE sync_logs IS 'Logs de validação de campos durante sincronização';
COMMENT ON COLUMN sync_logs.type IS 'Tipo do registro: ticket, conversation, agent, etc';
COMMENT ON COLUMN sync_logs.level IS 'Nível do log: info, warning, error';
COMMENT ON COLUMN sync_logs.missing_critical IS 'Campos críticos que estão faltando';
COMMENT ON COLUMN sync_logs.missing_important IS 'Campos importantes que estão faltando';

-- Limpar logs antigos (mais de 30 dias) - Execute periodicamente
-- DELETE FROM sync_logs WHERE timestamp < NOW() - INTERVAL '30 days';
