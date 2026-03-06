-- Adicionar colunas faltantes nas tabelas
ALTER TABLE public.satisfaction_ratings ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE public.satisfaction_ratings ADD COLUMN IF NOT EXISTS survey_id BIGINT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS audit_actor_id BIGINT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS audit_actor_name TEXT;
ALTER TABLE public.business_hours ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
