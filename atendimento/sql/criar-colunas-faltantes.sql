-- ============================================================
-- CRIAR TODAS AS COLUNAS E TABELAS PARA SYNC COMPLETO
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. TODAS AS COLUNAS FALTANTES NA TABELA TICKETS
-- ============================================================
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS cf_tratativa TEXT,
ADD COLUMN IF NOT EXISTS cf_grupo_tratativa TEXT,
ADD COLUMN IF NOT EXISTS cf_sistema TEXT,
ADD COLUMN IF NOT EXISTS cf_tipo_primario TEXT,
ADD COLUMN IF NOT EXISTS cf_prioridade_dev TEXT,
ADD COLUMN IF NOT EXISTS cf_situacao TEXT,
ADD COLUMN IF NOT EXISTS cf_acompanhamento_atendimento TEXT,
ADD COLUMN IF NOT EXISTS cf_acompanhamento_implantacao TEXT,
ADD COLUMN IF NOT EXISTS cf_acompanhamento_produto TEXT,
ADD COLUMN IF NOT EXISTS stats_agent_responded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stats_requester_responded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stats_first_responded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stats_status_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stats_reopened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stats_resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stats_closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stats_pending_since TIMESTAMPTZ;

-- 2. COLUNA NA TABELA SATISFACTION_RATINGS
-- ============================================================
ALTER TABLE satisfaction_ratings 
ADD COLUMN IF NOT EXISTS score_raw INTEGER;

-- 3. RECRIAR TABELA SURVEYS COM TODAS AS COLUNAS
-- ============================================================
DROP TABLE IF EXISTS surveys;
CREATE TABLE surveys (
    id BIGINT PRIMARY KEY,
    title TEXT,
    active BOOLEAN DEFAULT false,
    questions JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VIEW TICKET_CONVERSATIONS
-- ============================================================
CREATE OR REPLACE VIEW ticket_conversations AS 
SELECT * FROM conversations;
