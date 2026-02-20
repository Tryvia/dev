-- =====================================================
-- Script de Setup da Tabela de Tickets no Supabase
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =============================================
-- TABELA DE CONVERSAS
-- =============================================
CREATE TABLE IF NOT EXISTS ticket_conversations (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    user_id BIGINT,
    from_email TEXT,
    to_emails TEXT[],
    cc_emails TEXT[],
    bcc_emails TEXT[],
    body TEXT,
    body_text TEXT,
    incoming BOOLEAN DEFAULT FALSE,
    private BOOLEAN DEFAULT FALSE,
    source INTEGER,
    source_additional_info TEXT,
    category INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para conversas
CREATE INDEX IF NOT EXISTS idx_conversations_ticket_id ON ticket_conversations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ticket_conversations(created_at);

-- Desabilitar RLS para conversas
ALTER TABLE ticket_conversations DISABLE ROW LEVEL SECURITY;
GRANT ALL ON ticket_conversations TO anon, authenticated, service_role;

-- =============================================
-- TABELA DE TICKETS (existente)
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Criar tabela de tickets (se não existir)
CREATE TABLE IF NOT EXISTS tickets (
    id BIGINT PRIMARY KEY,
    subject TEXT,
    description TEXT,
    description_text TEXT,
    status INTEGER,
    priority INTEGER,
    source INTEGER,
    type TEXT,
    requester_id BIGINT,
    requester_name TEXT,
    requester_email TEXT,
    responder_id BIGINT,
    responder_name TEXT,
    group_id BIGINT,
    group_name TEXT,
    company_id BIGINT,
    product_id BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    due_by TIMESTAMPTZ,
    fr_due_by TIMESTAMPTZ,
    is_escalated BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    custom_fields JSONB,
    stats_agent_responded_at TIMESTAMPTZ,
    stats_requester_responded_at TIMESTAMPTZ,
    stats_first_responded_at TIMESTAMPTZ,
    stats_status_updated_at TIMESTAMPTZ,
    stats_reopened_at TIMESTAMPTZ,
    stats_resolved_at TIMESTAMPTZ,
    stats_closed_at TIMESTAMPTZ,
    stats_pending_since TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas que podem estar faltando (para tabelas existentes)
DO $$ 
BEGIN
    -- synced_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'synced_at') THEN
        ALTER TABLE tickets ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- responder_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'responder_name') THEN
        ALTER TABLE tickets ADD COLUMN responder_name TEXT;
    END IF;
    
    -- group_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'group_name') THEN
        ALTER TABLE tickets ADD COLUMN group_name TEXT;
    END IF;
    
    -- requester_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'requester_name') THEN
        ALTER TABLE tickets ADD COLUMN requester_name TEXT;
    END IF;
    
    -- requester_email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'requester_email') THEN
        ALTER TABLE tickets ADD COLUMN requester_email TEXT;
    END IF;
    
    -- description (HTML completo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'description') THEN
        ALTER TABLE tickets ADD COLUMN description TEXT;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_group_id ON tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_responder_id ON tickets(responder_id);
CREATE INDEX IF NOT EXISTS idx_tickets_synced_at ON tickets(synced_at);

-- Habilitar RLS (Row Level Security) - Opcional
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (para o dashboard)
-- CREATE POLICY "Allow public read" ON tickets FOR SELECT USING (true);

-- Política para permitir insert/update via service role
-- CREATE POLICY "Allow service role write" ON tickets FOR ALL USING (auth.role() = 'service_role');

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW tickets_stats AS
SELECT 
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status IN (4, 5)) as resolved_tickets,
    COUNT(*) FILTER (WHERE status = 2) as open_tickets,
    COUNT(*) FILTER (WHERE status = 3) as pending_tickets,
    COUNT(*) FILTER (WHERE status NOT IN (2, 3, 4, 5)) as in_progress_tickets,
    MAX(synced_at) as last_sync
FROM tickets;

-- Verificar estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;
