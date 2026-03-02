-- ================================================================
-- SQL Setup - IA Tryviano
-- Tabelas para suporte ao assistente inteligente
-- ================================================================

-- ================================================================
-- 1. TABELA DE FERIADOS (dinâmica, sem hardcode)
-- ================================================================
CREATE TABLE IF NOT EXISTS feriados (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'nacional', -- nacional, estadual, municipal, ponto_facultativo
    ano INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM data)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscas por ano
CREATE INDEX IF NOT EXISTS idx_feriados_ano ON feriados(ano);
CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados(data);

-- Inserir feriados de 2025
INSERT INTO feriados (data, nome, tipo) VALUES
    ('2025-01-01', 'Ano Novo', 'nacional'),
    ('2025-03-03', 'Carnaval', 'nacional'),
    ('2025-03-04', 'Carnaval', 'nacional'),
    ('2025-04-18', 'Sexta-feira Santa', 'nacional'),
    ('2025-04-21', 'Tiradentes', 'nacional'),
    ('2025-05-01', 'Dia do Trabalho', 'nacional'),
    ('2025-06-19', 'Corpus Christi', 'nacional'),
    ('2025-09-07', 'Independência', 'nacional'),
    ('2025-10-12', 'Nossa Senhora Aparecida', 'nacional'),
    ('2025-11-02', 'Finados', 'nacional'),
    ('2025-11-15', 'Proclamação da República', 'nacional'),
    ('2025-12-25', 'Natal', 'nacional')
ON CONFLICT (data) DO NOTHING;

-- Inserir feriados de 2026
INSERT INTO feriados (data, nome, tipo) VALUES
    ('2026-01-01', 'Ano Novo', 'nacional'),
    ('2026-02-16', 'Carnaval', 'nacional'),
    ('2026-02-17', 'Carnaval', 'nacional'),
    ('2026-04-03', 'Sexta-feira Santa', 'nacional'),
    ('2026-04-21', 'Tiradentes', 'nacional'),
    ('2026-05-01', 'Dia do Trabalho', 'nacional'),
    ('2026-06-04', 'Corpus Christi', 'nacional'),
    ('2026-09-07', 'Independência', 'nacional'),
    ('2026-10-12', 'Nossa Senhora Aparecida', 'nacional'),
    ('2026-11-02', 'Finados', 'nacional'),
    ('2026-11-15', 'Proclamação da República', 'nacional'),
    ('2026-12-25', 'Natal', 'nacional')
ON CONFLICT (data) DO NOTHING;

-- Inserir feriados de 2027
INSERT INTO feriados (data, nome, tipo) VALUES
    ('2027-01-01', 'Ano Novo', 'nacional'),
    ('2027-02-08', 'Carnaval', 'nacional'),
    ('2027-02-09', 'Carnaval', 'nacional'),
    ('2027-03-26', 'Sexta-feira Santa', 'nacional'),
    ('2027-04-21', 'Tiradentes', 'nacional'),
    ('2027-05-01', 'Dia do Trabalho', 'nacional'),
    ('2027-05-27', 'Corpus Christi', 'nacional'),
    ('2027-09-07', 'Independência', 'nacional'),
    ('2027-10-12', 'Nossa Senhora Aparecida', 'nacional'),
    ('2027-11-02', 'Finados', 'nacional'),
    ('2027-11-15', 'Proclamação da República', 'nacional'),
    ('2027-12-25', 'Natal', 'nacional')
ON CONFLICT (data) DO NOTHING;

-- ================================================================
-- 2. TABELA DE HISTÓRICO DE CONVERSAS DA IA
-- ================================================================
CREATE TABLE IF NOT EXISTS ia_conversas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100), -- opcional, se tiver autenticação
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('user', 'bot')),
    conteudo TEXT NOT NULL,
    provider VARCHAR(50), -- gemini, openrouter, groq, local
    tokens_usados INTEGER,
    tempo_resposta_ms INTEGER,
    sentimento VARCHAR(20), -- positivo, negativo, neutro, irritado, urgente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_ia_conversas_session ON ia_conversas(session_id);
CREATE INDEX IF NOT EXISTS idx_ia_conversas_created ON ia_conversas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_conversas_sentimento ON ia_conversas(sentimento);

-- ================================================================
-- 3. TABELA DE MÉTRICAS DE USO DA IA
-- ================================================================
CREATE TABLE IF NOT EXISTS ia_metricas (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    provider VARCHAR(50) NOT NULL,
    total_chamadas INTEGER DEFAULT 0,
    chamadas_sucesso INTEGER DEFAULT 0,
    chamadas_erro INTEGER DEFAULT 0,
    chamadas_fallback INTEGER DEFAULT 0,
    tempo_medio_ms INTEGER DEFAULT 0,
    tokens_total INTEGER DEFAULT 0,
    perguntas_frequentes JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data, provider)
);

CREATE INDEX IF NOT EXISTS idx_ia_metricas_data ON ia_metricas(data DESC);

-- ================================================================
-- 4. TABELA DE ALERTAS DE SENTIMENTO
-- ================================================================
CREATE TABLE IF NOT EXISTS ia_alertas_sentimento (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    ticket_id INTEGER,
    sentimento VARCHAR(20) NOT NULL,
    mensagem_usuario TEXT,
    acao_tomada VARCHAR(100),
    resolvido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ia_alertas_resolvido ON ia_alertas_sentimento(resolvido);
CREATE INDEX IF NOT EXISTS idx_ia_alertas_created ON ia_alertas_sentimento(created_at DESC);

-- ================================================================
-- 5. TABELA DE DECISÕES REGISTRADAS
-- ================================================================
CREATE TABLE IF NOT EXISTS ia_decisoes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    texto TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    ticket_relacionado INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ia_decisoes_tags ON ia_decisoes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ia_decisoes_created ON ia_decisoes(created_at DESC);

-- ================================================================
-- 6. FUNÇÃO PARA VERIFICAR SE É DIA ÚTIL
-- ================================================================
CREATE OR REPLACE FUNCTION is_dia_util(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se é fim de semana
    IF EXTRACT(DOW FROM check_date) IN (0, 6) THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se é feriado
    IF EXISTS (SELECT 1 FROM feriados WHERE data = check_date) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 7. FUNÇÃO PARA CALCULAR DIAS ÚTEIS ENTRE DATAS
-- ================================================================
CREATE OR REPLACE FUNCTION dias_uteis_entre(data_inicio DATE, data_fim DATE)
RETURNS INTEGER AS $$
DECLARE
    dias INTEGER := 0;
    curr_date DATE := data_inicio;
BEGIN
    WHILE curr_date <= data_fim LOOP
        IF is_dia_util(curr_date) THEN
            dias := dias + 1;
        END IF;
        curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN dias;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 8. FUNÇÃO PARA REGISTRAR MÉTRICA DE IA
-- ================================================================
CREATE OR REPLACE FUNCTION registrar_metrica_ia(
    p_provider VARCHAR,
    p_sucesso BOOLEAN,
    p_tempo_ms INTEGER,
    p_tokens INTEGER DEFAULT 0,
    p_is_fallback BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO ia_metricas (data, provider, total_chamadas, chamadas_sucesso, chamadas_erro, chamadas_fallback, tempo_medio_ms, tokens_total)
    VALUES (CURRENT_DATE, p_provider, 1, 
            CASE WHEN p_sucesso THEN 1 ELSE 0 END,
            CASE WHEN NOT p_sucesso THEN 1 ELSE 0 END,
            CASE WHEN p_is_fallback THEN 1 ELSE 0 END,
            p_tempo_ms, p_tokens)
    ON CONFLICT (data, provider) DO UPDATE SET
        total_chamadas = ia_metricas.total_chamadas + 1,
        chamadas_sucesso = ia_metricas.chamadas_sucesso + CASE WHEN p_sucesso THEN 1 ELSE 0 END,
        chamadas_erro = ia_metricas.chamadas_erro + CASE WHEN NOT p_sucesso THEN 1 ELSE 0 END,
        chamadas_fallback = ia_metricas.chamadas_fallback + CASE WHEN p_is_fallback THEN 1 ELSE 0 END,
        tempo_medio_ms = (ia_metricas.tempo_medio_ms * ia_metricas.total_chamadas + p_tempo_ms) / (ia_metricas.total_chamadas + 1),
        tokens_total = ia_metricas.tokens_total + p_tokens,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 9. VIEW PARA DASHBOARD DE MÉTRICAS
-- ================================================================
CREATE OR REPLACE VIEW vw_ia_metricas_resumo AS
SELECT 
    data,
    SUM(total_chamadas) as total_chamadas,
    SUM(chamadas_sucesso) as total_sucesso,
    SUM(chamadas_erro) as total_erro,
    SUM(chamadas_fallback) as total_fallback,
    ROUND(AVG(tempo_medio_ms)) as tempo_medio_ms,
    SUM(tokens_total) as tokens_total,
    ROUND(SUM(chamadas_sucesso)::numeric / NULLIF(SUM(total_chamadas), 0) * 100, 1) as taxa_sucesso
FROM ia_metricas
GROUP BY data
ORDER BY data DESC;

-- ================================================================
-- 10. VIEW PARA ALERTAS PENDENTES
-- ================================================================
CREATE OR REPLACE VIEW vw_alertas_pendentes AS
SELECT 
    id,
    session_id,
    ticket_id,
    sentimento,
    mensagem_usuario,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_aberto
FROM ia_alertas_sentimento
WHERE resolvido = FALSE
ORDER BY 
    CASE sentimento WHEN 'irritado' THEN 1 WHEN 'urgente' THEN 2 ELSE 3 END,
    created_at;

-- ================================================================
-- PERMISSÕES (ajustar conforme necessário)
-- ================================================================
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ================================================================
-- COMENTÁRIOS
-- ================================================================
COMMENT ON TABLE feriados IS 'Feriados nacionais para cálculo de SLA em dias úteis';
COMMENT ON TABLE ia_conversas IS 'Histórico de conversas com a IA Tryviano';
COMMENT ON TABLE ia_metricas IS 'Métricas diárias de uso dos provedores de IA';
COMMENT ON TABLE ia_alertas_sentimento IS 'Alertas quando usuário demonstra irritação ou urgência';
COMMENT ON TABLE ia_decisoes IS 'Decisões importantes registradas pelo usuário via chatbot';
COMMENT ON FUNCTION is_dia_util IS 'Verifica se uma data é dia útil (não é feriado nem fim de semana)';
COMMENT ON FUNCTION dias_uteis_entre IS 'Calcula quantidade de dias úteis entre duas datas';
COMMENT ON FUNCTION registrar_metrica_ia IS 'Registra uma chamada de IA para métricas';
