-- ============================================
-- SQL PARA MELHORIAS NO SISTEMA DE ATENDIMENTO
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELA: BusinessHours (Horário Comercial)
-- Necessário para cálculo correto de SLA
-- ============================================

CREATE TABLE IF NOT EXISTS "BusinessHours" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Horário Padrão',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Horários por dia da semana (formato HH:MM)
    monday_start TIME DEFAULT '08:00',
    monday_end TIME DEFAULT '18:00',
    monday_enabled BOOLEAN DEFAULT true,
    
    tuesday_start TIME DEFAULT '08:00',
    tuesday_end TIME DEFAULT '18:00',
    tuesday_enabled BOOLEAN DEFAULT true,
    
    wednesday_start TIME DEFAULT '08:00',
    wednesday_end TIME DEFAULT '18:00',
    wednesday_enabled BOOLEAN DEFAULT true,
    
    thursday_start TIME DEFAULT '08:00',
    thursday_end TIME DEFAULT '18:00',
    thursday_enabled BOOLEAN DEFAULT true,
    
    friday_start TIME DEFAULT '08:00',
    friday_end TIME DEFAULT '18:00',
    friday_enabled BOOLEAN DEFAULT true,
    
    saturday_start TIME DEFAULT NULL,
    saturday_end TIME DEFAULT NULL,
    saturday_enabled BOOLEAN DEFAULT false,
    
    sunday_start TIME DEFAULT NULL,
    sunday_end TIME DEFAULT NULL,
    sunday_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir horário padrão
INSERT INTO "BusinessHours" (name, timezone) 
VALUES ('Horário Comercial Padrão', 'America/Sao_Paulo')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. TABELA: Products (Catálogo de Produtos)
-- Para análise por produto
-- ============================================

CREATE TABLE IF NOT EXISTS "Products" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir produtos baseados nos dados existentes
INSERT INTO "Products" (name, category, active) VALUES
('SING', 'Sistema', true),
('OPTZ', 'Sistema', true),
('Telemetria', 'Sistema', true),
('Portal', 'Sistema', true),
('Mobile', 'Aplicativo', true),
('API', 'Integração', true),
('Relatórios', 'Sistema', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. TABELA: TicketSurveys (Pesquisas CSAT)
-- Para satisfação do cliente
-- ============================================

CREATE TABLE IF NOT EXISTS "TicketSurveys" (
    id SERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    survey_type VARCHAR(50) DEFAULT 'csat',
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_surveys_ticket_id ON "TicketSurveys"(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_surveys_rating ON "TicketSurveys"(rating);

-- ============================================
-- 4. TABELA: FreshdeskCompanies (Empresas Detalhadas)
-- Para análise por cliente
-- ============================================

CREATE TABLE IF NOT EXISTS "FreshdeskCompanies" (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domains TEXT[], -- Array de domínios
    health_score VARCHAR(50),
    account_tier VARCHAR(50),
    renewal_date DATE,
    industry VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freshdesk_companies_name ON "FreshdeskCompanies"(name);

-- ============================================
-- 5. VIEW: vw_ticket_metrics
-- Métricas calculadas por ticket
-- ============================================

CREATE OR REPLACE VIEW vw_ticket_metrics AS
SELECT 
    t.id,
    t.subject,
    t.status,
    t.priority,
    t.type,
    t.created_at,
    t.updated_at,
    t.company_id,
    t.company_name,
    t.cf_tratativa,
    t.cf_grupo_tratativa,
    
    -- Tempos calculados
    t.stats_first_responded_at,
    t.stats_resolved_at,
    
    -- Tempo de 1ª resposta em horas
    CASE 
        WHEN t.stats_first_responded_at IS NOT NULL AND t.created_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.stats_first_responded_at - t.created_at)) / 3600
        ELSE NULL 
    END AS response_time_hours,
    
    -- Tempo de resolução em horas
    CASE 
        WHEN t.stats_resolved_at IS NOT NULL AND t.created_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.stats_resolved_at - t.created_at)) / 3600
        ELSE NULL 
    END AS resolution_time_hours,
    
    -- SLA 1ª resposta (4 horas)
    CASE 
        WHEN t.stats_first_responded_at IS NOT NULL AND t.created_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.stats_first_responded_at - t.created_at)) / 3600 <= 4
        ELSE NULL 
    END AS sla_first_response_met,
    
    -- SLA resolução baseado em due_by
    CASE 
        WHEN t.stats_resolved_at IS NOT NULL AND t.due_by IS NOT NULL
        THEN t.stats_resolved_at <= t.due_by
        ELSE NULL 
    END AS sla_resolution_met,
    
    -- Idade do ticket em dias
    EXTRACT(DAY FROM (NOW() - t.created_at)) AS age_days,
    
    -- Status simplificado
    CASE 
        WHEN t.status IN (4, 5) THEN 'Resolvido'
        WHEN t.status = 2 THEN 'Aberto'
        WHEN t.status = 3 THEN 'Pendente'
        ELSE 'Em Andamento'
    END AS status_category,
    
    -- Prioridade texto
    CASE 
        WHEN t.priority = 1 THEN 'Baixa'
        WHEN t.priority = 2 THEN 'Média'
        WHEN t.priority = 3 THEN 'Alta'
        WHEN t.priority = 4 THEN 'Urgente'
        ELSE 'Desconhecida'
    END AS priority_label,
    
    -- Flags
    t.is_escalated,
    t.stats_reopened_at IS NOT NULL AS was_reopened
    
FROM tickets t;

-- ============================================
-- 6. VIEW: vw_time_entries_summary
-- Resumo de horas por ticket
-- ============================================

CREATE OR REPLACE VIEW vw_time_entries_summary AS
SELECT 
    ticket_id,
    COUNT(*) AS entry_count,
    SUM(time_spent_minutes) AS total_minutes,
    ROUND(SUM(time_spent_minutes) / 60.0, 2) AS total_hours,
    MIN(created_at) AS first_entry,
    MAX(created_at) AS last_entry,
    COUNT(DISTINCT agent_id) AS agents_involved
FROM time_entries
WHERE ticket_id IS NOT NULL
GROUP BY ticket_id;

-- ============================================
-- 7. VIEW: vw_agent_performance
-- Performance por agente
-- ============================================

CREATE OR REPLACE VIEW vw_agent_performance AS
SELECT 
    cf_tratativa AS agent_name,
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE status IN (4, 5)) AS resolved_tickets,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status IN (4, 5)) / NULLIF(COUNT(*), 0), 1) AS resolution_rate,
    
    -- SLA 1ª Resposta
    COUNT(*) FILTER (
        WHERE stats_first_responded_at IS NOT NULL 
        AND EXTRACT(EPOCH FROM (stats_first_responded_at - created_at)) / 3600 <= 4
    ) AS sla_first_met,
    ROUND(100.0 * COUNT(*) FILTER (
        WHERE stats_first_responded_at IS NOT NULL 
        AND EXTRACT(EPOCH FROM (stats_first_responded_at - created_at)) / 3600 <= 4
    ) / NULLIF(COUNT(*) FILTER (WHERE stats_first_responded_at IS NOT NULL), 0), 1) AS sla_first_rate,
    
    -- Tempos médios
    ROUND(AVG(
        CASE WHEN stats_first_responded_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (stats_first_responded_at - created_at)) / 3600 
        END
    )::numeric, 1) AS avg_response_hours,
    
    ROUND(AVG(
        CASE WHEN stats_resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (stats_resolved_at - created_at)) / 3600 
        END
    )::numeric, 1) AS avg_resolution_hours,
    
    -- Reaberturas
    COUNT(*) FILTER (WHERE stats_reopened_at IS NOT NULL) AS reopened_count,
    
    -- Escalações
    COUNT(*) FILTER (WHERE is_escalated = true) AS escalated_count
    
FROM tickets
WHERE cf_tratativa IS NOT NULL AND cf_tratativa != ''
GROUP BY cf_tratativa
ORDER BY total_tickets DESC;

-- ============================================
-- 8. VIEW: vw_company_performance
-- Performance por empresa
-- ============================================

CREATE OR REPLACE VIEW vw_company_performance AS
SELECT 
    company_name,
    company_id,
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE status IN (4, 5)) AS resolved_tickets,
    COUNT(*) FILTER (WHERE status NOT IN (4, 5)) AS open_tickets,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status IN (4, 5)) / NULLIF(COUNT(*), 0), 1) AS resolution_rate,
    
    -- SLA
    ROUND(100.0 * COUNT(*) FILTER (
        WHERE stats_first_responded_at IS NOT NULL 
        AND EXTRACT(EPOCH FROM (stats_first_responded_at - created_at)) / 3600 <= 4
    ) / NULLIF(COUNT(*) FILTER (WHERE stats_first_responded_at IS NOT NULL), 0), 1) AS sla_rate,
    
    -- Tempos
    ROUND(AVG(
        CASE WHEN stats_resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (stats_resolved_at - created_at)) / 3600 
        END
    )::numeric, 1) AS avg_resolution_hours,
    
    -- Prioridades
    COUNT(*) FILTER (WHERE priority = 4) AS urgent_count,
    COUNT(*) FILTER (WHERE priority = 3) AS high_count,
    
    -- Último ticket
    MAX(created_at) AS last_ticket_date
    
FROM tickets
WHERE company_name IS NOT NULL AND company_name != ''
GROUP BY company_name, company_id
HAVING COUNT(*) >= 3
ORDER BY total_tickets DESC;

-- ============================================
-- 9. VIEW: vw_daily_volume
-- Volume diário para tendências
-- ============================================

CREATE OR REPLACE VIEW vw_daily_volume AS
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS created,
    COUNT(*) FILTER (WHERE status IN (4, 5)) AS resolved,
    COUNT(*) FILTER (WHERE status NOT IN (4, 5)) AS pending,
    
    -- Por prioridade
    COUNT(*) FILTER (WHERE priority = 4) AS urgent,
    COUNT(*) FILTER (WHERE priority = 3) AS high,
    COUNT(*) FILTER (WHERE priority = 2) AS medium,
    COUNT(*) FILTER (WHERE priority = 1) AS low,
    
    -- SLA do dia
    ROUND(100.0 * COUNT(*) FILTER (
        WHERE stats_first_responded_at IS NOT NULL 
        AND EXTRACT(EPOCH FROM (stats_first_responded_at - created_at)) / 3600 <= 4
    ) / NULLIF(COUNT(*) FILTER (WHERE stats_first_responded_at IS NOT NULL), 0), 1) AS sla_rate
    
FROM tickets
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- 10. FUNCTION: Calcular horas úteis
-- ============================================

CREATE OR REPLACE FUNCTION calculate_business_hours(
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    business_start TIME DEFAULT '08:00',
    business_end TIME DEFAULT '18:00'
) RETURNS NUMERIC AS $$
DECLARE
    total_hours NUMERIC := 0;
    current_day DATE;
    day_start TIMESTAMP WITH TIME ZONE;
    day_end TIMESTAMP WITH TIME ZONE;
    work_start TIMESTAMP WITH TIME ZONE;
    work_end TIMESTAMP WITH TIME ZONE;
BEGIN
    IF start_time IS NULL OR end_time IS NULL THEN
        RETURN NULL;
    END IF;
    
    current_day := DATE(start_time);
    
    WHILE current_day <= DATE(end_time) LOOP
        -- Pular fins de semana
        IF EXTRACT(DOW FROM current_day) NOT IN (0, 6) THEN
            day_start := current_day + business_start;
            day_end := current_day + business_end;
            
            work_start := GREATEST(start_time, day_start);
            work_end := LEAST(end_time, day_end);
            
            IF work_end > work_start THEN
                total_hours := total_hours + EXTRACT(EPOCH FROM (work_end - work_start)) / 3600;
            END IF;
        END IF;
        
        current_day := current_day + 1;
    END LOOP;
    
    RETURN ROUND(total_hours, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. Índices para performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_cf_tratativa ON tickets(cf_tratativa);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_time_entries_ticket_id ON time_entries(ticket_id);

-- ============================================
-- 12. Permissões RLS (Row Level Security)
-- ============================================

ALTER TABLE "BusinessHours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TicketSurveys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FreshdeskCompanies" ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (ajuste conforme necessário)
CREATE POLICY "Allow public read BusinessHours" ON "BusinessHours" FOR SELECT USING (true);
CREATE POLICY "Allow public read Products" ON "Products" FOR SELECT USING (true);
CREATE POLICY "Allow public read TicketSurveys" ON "TicketSurveys" FOR SELECT USING (true);
CREATE POLICY "Allow public read FreshdeskCompanies" ON "FreshdeskCompanies" FOR SELECT USING (true);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para verificar se tudo foi criado:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT viewname FROM pg_views WHERE schemaname = 'public';
