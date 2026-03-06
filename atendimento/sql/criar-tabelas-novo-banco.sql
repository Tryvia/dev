-- ============================================
-- SQL PARA CRIAR TABELAS NO NOVO BANCO SUPABASE
-- Banco: ifzypptlhpzuydjeympr.supabase.co
-- Baseado na estrutura exata do banco antigo
-- ============================================

-- 1. TABELA: agents
CREATE TABLE public.agents (
    id BIGINT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    occasional BOOLEAN DEFAULT false,
    ticket_scope INTEGER,
    group_ids JSONB,
    role_ids JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: groups
CREATE TABLE public.groups (
    id BIGINT PRIMARY KEY,
    name TEXT,
    description TEXT,
    escalate_to BIGINT,
    auto_ticket_assign BOOLEAN DEFAULT false,
    agent_ids JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA: companies
CREATE TABLE public.companies (
    id BIGINT PRIMARY KEY,
    name TEXT,
    description TEXT,
    domains JSONB,
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

-- 4. TABELA: tickets (PRINCIPAL)
CREATE TABLE public.tickets (
    id BIGINT PRIMARY KEY,
    subject TEXT,
    status INTEGER,
    priority INTEGER,
    type TEXT,
    source INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    due_by TIMESTAMPTZ,
    fr_due_by TIMESTAMPTZ,
    description TEXT,
    description_text TEXT,
    requester_id BIGINT,
    requester_name TEXT,
    requester_email TEXT,
    requester_phone TEXT,
    requester_mobile TEXT,
    responder_id BIGINT,
    responder_name TEXT,
    group_id BIGINT,
    group_name TEXT,
    company_id BIGINT,
    company_name TEXT,
    company_domains JSONB,
    company_health_score TEXT,
    product_id TEXT,
    stats_first_responded_at TIMESTAMPTZ,
    stats_resolved_at TIMESTAMPTZ,
    stats_closed_at TIMESTAMPTZ,
    stats_pending_since TIMESTAMPTZ,
    stats_reopened_at TIMESTAMPTZ,
    stats_status_updated_at TIMESTAMPTZ,
    stats_agent_responded_at TIMESTAMPTZ,
    stats_requester_responded_at TIMESTAMPTZ,
    is_escalated BOOLEAN DEFAULT false,
    fr_escalated BOOLEAN DEFAULT false,
    tags JSONB,
    custom_fields JSONB,
    imported_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    -- Campos customizados extraídos
    cf_tipo_de_campo TEXT,
    cf_grupo_tratativa TEXT,
    cf_tratativa TEXT,
    cf_pessoa_acompanhamento_1 TEXT,
    cf_pessoa_acompanhamento_2 TEXT,
    cf_pessoa_acompanhamento_3 TEXT,
    cf_sla_resoluo TEXT,
    cf_sla_primeira_resposta TEXT,
    cf_produto TEXT,
    cf_sistema TEXT,
    -- Campos legados
    cf_tipo_de_campo1684353202918 TEXT,
    cf_grupo_tratativa1684353202918 TEXT,
    cf_tratativa1684353202918 TEXT,
    cf_tempo1684353202918 TEXT,
    cf_pessoa_acompanhamento_11684353202918 TEXT,
    cf_pessoa_acompanhamento_21684353202918 TEXT,
    cf_pessoa_acompanhamento_31684353202918 TEXT,
    cf_sla_resoluo1684353202918 TEXT,
    cf_sla_primeira_resposta1684353202918 TEXT,
    cf_produto1684353202918 TEXT,
    cf_sistema1684353202918 TEXT
);

-- 5. TABELA: conversations
CREATE TABLE public.conversations (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT,
    body TEXT,
    body_text TEXT,
    incoming BOOLEAN,
    private BOOLEAN,
    user_id BIGINT,
    support_email TEXT,
    source INTEGER,
    category INTEGER,
    to_emails JSONB,
    from_email TEXT,
    cc_emails JSONB,
    bcc_emails JSONB,
    attachments JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA: time_entries
CREATE TABLE public.time_entries (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT,
    agent_id BIGINT,
    time_spent TEXT,
    time_spent_minutes INTEGER,
    billable BOOLEAN DEFAULT false,
    note TEXT,
    timer_running BOOLEAN DEFAULT false,
    executed_at TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA: satisfaction_ratings
CREATE TABLE public.satisfaction_ratings (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT,
    user_id BIGINT,
    agent_id BIGINT,
    group_id BIGINT,
    rating INTEGER,
    feedback TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA: products
CREATE TABLE public.products (
    id BIGINT PRIMARY KEY,
    name TEXT,
    description TEXT,
    primary_email TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA: business_hours
CREATE TABLE public.business_hours (
    id BIGINT PRIMARY KEY,
    name TEXT,
    description TEXT,
    time_zone TEXT,
    business_hours JSONB,
    list_of_holidays JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX idx_tickets_updated_at ON public.tickets(updated_at);
CREATE INDEX idx_tickets_responder_id ON public.tickets(responder_id);
CREATE INDEX idx_tickets_group_id ON public.tickets(group_id);
CREATE INDEX idx_tickets_company_id ON public.tickets(company_id);
CREATE INDEX idx_tickets_tags ON public.tickets USING GIN(tags);

CREATE INDEX idx_conversations_ticket_id ON public.conversations(ticket_id);
CREATE INDEX idx_time_entries_ticket_id ON public.time_entries(ticket_id);
CREATE INDEX idx_time_entries_agent_id ON public.time_entries(agent_id);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
