-- ========================================
-- SCRIPT SQL COMPLETO - FRESHDESK SYNC
-- Execute no Supabase SQL Editor
-- ========================================

-- ========================================
-- 1. TABELA DE AGENTES
-- ========================================
CREATE TABLE IF NOT EXISTS agents (
    id BIGINT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    occasional BOOLEAN DEFAULT false,
    ticket_scope INTEGER,
    group_ids JSONB DEFAULT '[]',
    role_ids JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(active);

-- ========================================
-- 2. TABELA DE GRUPOS
-- ========================================
CREATE TABLE IF NOT EXISTS groups (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    escalate_to BIGINT,
    auto_ticket_assign BOOLEAN DEFAULT false,
    agent_ids JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

-- ========================================
-- 3. TABELA DE EMPRESAS
-- ========================================
CREATE TABLE IF NOT EXISTS companies (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    domains JSONB DEFAULT '[]',
    note TEXT,
    health_score TEXT,
    account_tier TEXT,
    renewal_date DATE,
    industry TEXT,
    custom_fields JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- ========================================
-- 4. TABELA DE PRODUTOS
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ========================================
-- 5. TABELA DE BUSINESS HOURS
-- ========================================
CREATE TABLE IF NOT EXISTS business_hours (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    time_zone TEXT,
    business_hours JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 6. TABELA DE SURVEYS
-- ========================================
CREATE TABLE IF NOT EXISTS surveys (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    questions JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 7. TABELA DE TICKETS (se não existir)
-- ========================================
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
    company_name TEXT,
    product_id BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    due_by TIMESTAMPTZ,
    fr_due_by TIMESTAMPTZ,
    is_escalated BOOLEAN DEFAULT false,
    fr_escalated BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
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

-- Índices para tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_responder_id ON tickets(responder_id);
CREATE INDEX IF NOT EXISTS idx_tickets_group_id ON tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_product_id ON tickets(product_id);

-- ========================================
-- 8. TABELA DE CONVERSAS
-- ========================================
CREATE TABLE IF NOT EXISTS ticket_conversations (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    user_id BIGINT,
    from_email TEXT,
    to_emails JSONB DEFAULT '[]',
    cc_emails JSONB DEFAULT '[]',
    body TEXT,
    body_text TEXT,
    incoming BOOLEAN DEFAULT false,
    private BOOLEAN DEFAULT false,
    source INTEGER,
    category INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_ticket_id ON ticket_conversations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON ticket_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ticket_conversations(created_at);

-- ========================================
-- 9. TABELA DE TIME ENTRIES
-- ========================================
CREATE TABLE IF NOT EXISTS time_entries (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    agent_id BIGINT,
    time_spent TEXT,
    time_spent_minutes INTEGER DEFAULT 0,
    billable BOOLEAN DEFAULT false,
    note TEXT,
    timer_running BOOLEAN DEFAULT false,
    executed_at TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_ticket_id ON time_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_agent_id ON time_entries(agent_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_executed_at ON time_entries(executed_at);

-- ========================================
-- 10. TABELA DE SATISFACTION RATINGS (CSAT)
-- ========================================
CREATE TABLE IF NOT EXISTS satisfaction_ratings (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    survey_id BIGINT,
    user_id BIGINT,
    agent_id BIGINT,
    group_id BIGINT,
    score INTEGER,              -- Convertido para 1-5
    score_raw INTEGER,          -- Valor original do Freshdesk
    feedback TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satisfaction_ticket_id ON satisfaction_ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_agent_id ON satisfaction_ratings(agent_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_score ON satisfaction_ratings(score);
CREATE INDEX IF NOT EXISTS idx_satisfaction_created_at ON satisfaction_ratings(created_at);

-- ========================================
-- HABILITAR RLS (Row Level Security)
-- ========================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (ajuste conforme necessário)
CREATE POLICY IF NOT EXISTS "Allow read access" ON agents FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON groups FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON companies FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON products FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON business_hours FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON surveys FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON tickets FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON ticket_conversations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON time_entries FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow read access" ON satisfaction_ratings FOR SELECT USING (true);

-- ========================================
-- VIEWS PARA BI ANALYTICS
-- ========================================

-- View: Estatísticas CSAT
CREATE OR REPLACE VIEW csat_stats AS
SELECT 
    COUNT(*) as total_ratings,
    AVG(score) as avg_score,
    COUNT(CASE WHEN score >= 4 THEN 1 END) as satisfied_count,
    COUNT(CASE WHEN score <= 2 THEN 1 END) as unsatisfied_count,
    ROUND(COUNT(CASE WHEN score >= 4 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as csat_percentage
FROM satisfaction_ratings
WHERE score IS NOT NULL;

-- View: CSAT por Mês
CREATE OR REPLACE VIEW csat_by_month AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_ratings,
    AVG(score) as avg_score,
    ROUND(COUNT(CASE WHEN score >= 4 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as csat_percentage
FROM satisfaction_ratings
WHERE score IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View: CSAT por Agente
CREATE OR REPLACE VIEW csat_by_agent AS
SELECT 
    sr.agent_id,
    a.name as agent_name,
    COUNT(*) as total_ratings,
    AVG(sr.score) as avg_score,
    ROUND(COUNT(CASE WHEN sr.score >= 4 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as csat_percentage
FROM satisfaction_ratings sr
LEFT JOIN agents a ON sr.agent_id = a.id
WHERE sr.score IS NOT NULL AND sr.agent_id IS NOT NULL
GROUP BY sr.agent_id, a.name
ORDER BY csat_percentage DESC;

-- View: Tempo por Agente
CREATE OR REPLACE VIEW time_by_agent AS
SELECT 
    te.agent_id,
    a.name as agent_name,
    COUNT(*) as total_entries,
    SUM(te.time_spent_minutes) as total_minutes,
    AVG(te.time_spent_minutes) as avg_minutes_per_entry,
    COUNT(DISTINCT te.ticket_id) as tickets_worked
FROM time_entries te
LEFT JOIN agents a ON te.agent_id = a.id
WHERE te.agent_id IS NOT NULL
GROUP BY te.agent_id, a.name
ORDER BY total_minutes DESC;

-- View: Tempo por Ticket
CREATE OR REPLACE VIEW time_by_ticket AS
SELECT 
    te.ticket_id,
    t.subject,
    t.status,
    t.priority,
    COUNT(*) as total_entries,
    SUM(te.time_spent_minutes) as total_minutes
FROM time_entries te
LEFT JOIN tickets t ON te.ticket_id = t.id
GROUP BY te.ticket_id, t.subject, t.status, t.priority
ORDER BY total_minutes DESC;

-- View: Dashboard Geral
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM tickets) as total_tickets,
    (SELECT COUNT(*) FROM tickets WHERE status = 2) as open_tickets,
    (SELECT COUNT(*) FROM tickets WHERE status = 3) as pending_tickets,
    (SELECT COUNT(*) FROM tickets WHERE status IN (4, 5)) as resolved_tickets,
    (SELECT COUNT(*) FROM agents WHERE active = true) as active_agents,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT AVG(score) FROM satisfaction_ratings WHERE score IS NOT NULL) as avg_csat,
    (SELECT SUM(time_spent_minutes) FROM time_entries) as total_time_minutes;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
SELECT 'Todas as tabelas e views foram criadas com sucesso!' as status;
