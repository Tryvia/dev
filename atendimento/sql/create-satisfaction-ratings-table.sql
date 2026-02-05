-- ============================================
-- TABELA: satisfaction_ratings (CSAT)
-- Armazena avaliações de satisfação do Freshdesk
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS public.satisfaction_ratings (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT REFERENCES public.tickets(id),
    user_id BIGINT,
    agent_id BIGINT,
    group_id BIGINT,
    survey_id BIGINT,
    score INTEGER,  -- 1-5 (escala de satisfação)
    feedback TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.satisfaction_ratings IS 'Avaliações de satisfação do cliente (CSAT) do Freshdesk';
COMMENT ON COLUMN public.satisfaction_ratings.score IS 'Nota de 1-5: 1-2 insatisfeito, 3 neutro, 4-5 satisfeito';
COMMENT ON COLUMN public.satisfaction_ratings.feedback IS 'Feedback textual do cliente';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_ticket_id ON public.satisfaction_ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_score ON public.satisfaction_ratings(score);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_created_at ON public.satisfaction_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_agent_id ON public.satisfaction_ratings(agent_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_group_id ON public.satisfaction_ratings(group_id);

-- RLS (Row Level Security)
ALTER TABLE public.satisfaction_ratings ENABLE ROW LEVEL SECURITY;

-- Policy para leitura (todos podem ler)
CREATE POLICY "Permitir leitura de satisfaction_ratings" ON public.satisfaction_ratings
    FOR SELECT USING (true);

-- Policy para service role (escrita)
CREATE POLICY "Service role pode inserir satisfaction_ratings" ON public.satisfaction_ratings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role pode atualizar satisfaction_ratings" ON public.satisfaction_ratings
    FOR UPDATE USING (true);

-- View para estatísticas de CSAT
CREATE OR REPLACE VIEW public.csat_stats AS
SELECT 
    COUNT(*) AS total_ratings,
    COUNT(CASE WHEN score >= 4 THEN 1 END) AS satisfied,
    COUNT(CASE WHEN score = 3 THEN 1 END) AS neutral,
    COUNT(CASE WHEN score <= 2 AND score > 0 THEN 1 END) AS dissatisfied,
    ROUND(
        (COUNT(CASE WHEN score >= 4 THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(CASE WHEN score > 0 THEN 1 END), 0)) * 100, 
        2
    ) AS csat_percent,
    ROUND(AVG(score)::NUMERIC, 2) AS avg_score
FROM public.satisfaction_ratings
WHERE score IS NOT NULL AND score > 0;

-- View para CSAT por mês
CREATE OR REPLACE VIEW public.csat_by_month AS
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS total_ratings,
    COUNT(CASE WHEN score >= 4 THEN 1 END) AS satisfied,
    ROUND(
        (COUNT(CASE WHEN score >= 4 THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(CASE WHEN score > 0 THEN 1 END), 0)) * 100, 
        2
    ) AS csat_percent,
    ROUND(AVG(score)::NUMERIC, 2) AS avg_score
FROM public.satisfaction_ratings
WHERE score IS NOT NULL AND score > 0
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View para CSAT por agente
CREATE OR REPLACE VIEW public.csat_by_agent AS
SELECT 
    agent_id,
    COUNT(*) AS total_ratings,
    COUNT(CASE WHEN score >= 4 THEN 1 END) AS satisfied,
    ROUND(
        (COUNT(CASE WHEN score >= 4 THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(CASE WHEN score > 0 THEN 1 END), 0)) * 100, 
        2
    ) AS csat_percent,
    ROUND(AVG(score)::NUMERIC, 2) AS avg_score
FROM public.satisfaction_ratings
WHERE score IS NOT NULL AND score > 0 AND agent_id IS NOT NULL
GROUP BY agent_id
ORDER BY csat_percent DESC;

-- Verificar criação
SELECT 'Tabela satisfaction_ratings criada com sucesso!' AS status;
