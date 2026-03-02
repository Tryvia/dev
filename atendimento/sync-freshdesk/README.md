# 🔄 Sincronização Automática Freshdesk → Supabase

Este módulo sincroniza automaticamente dados do Freshdesk para o Supabase a cada 3 horas usando GitHub Actions.

## 📊 Dados Sincronizados

| Endpoint | Tabela Supabase | Descrição |
|----------|-----------------|-----------|
| `/tickets` | `Tickets` | Todos os tickets e conversas |
| `/satisfaction_ratings` | `satisfaction_ratings` | Avaliações CSAT dos clientes |
| `/time_entries` | `time_entries` | Tempo registrado pelos agentes |
| `/agents` | `agents` | Lista de agentes |
| `/groups` | `groups` | Grupos/Times |
| `/companies` | `companies` | Empresas/Clientes |
| `/products` | `products` | Produtos |
| `/business_hours` | `business_hours` | Horários comerciais |
| `/surveys` | `surveys` | Pesquisas configuradas |

## 📋 Pré-requisitos

1. Repositório no GitHub
2. Conta Supabase com tabelas criadas (ver SQL abaixo)
3. API Key do Freshdesk

## 🚀 Configuração

### 1. Fazer push do código para o GitHub

```bash
git add .
git commit -m "Adicionar sincronização automática"
git push origin main
```

### 2. Configurar Secrets no GitHub

Vá em: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Adicione os seguintes secrets:

| Secret Name | Valor | Descrição |
|-------------|-------|-----------|
| `FRESHDESK_DOMAIN` | `trylogsupport` | Subdomínio do Freshdesk |
| `FRESHDESK_API_KEY` | `sua-api-key` | API Key do Freshdesk |
| `SUPABASE_URL` | `https://xxx.supabase.co` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | **Service Role Key** (não a anon key!) |

### 3. Obter as chaves

#### Freshdesk API Key:
1. Acesse Freshdesk → Perfil → Configurações do perfil
2. Copie a "API Key"

#### Supabase Service Key:
1. Acesse Supabase → Settings → API
2. Copie a **service_role key** (secret)

## ⏰ Agendamento

O workflow executa automaticamente:
- **A cada 3 horas** (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC)

### Alterar frequência

Edite o arquivo `.github/workflows/sync-freshdesk.yml`:

```yaml
schedule:
  - cron: '0 */3 * * *'  # A cada 3 horas
  # Outras opções:
  # - cron: '0 * * * *'    # A cada hora
  # - cron: '0 */6 * * *'  # A cada 6 horas
  # - cron: '0 0 * * *'    # Uma vez por dia (meia-noite)
```

## 🖐️ Execução Manual

1. Vá em: **Actions** → **Sincronizar Freshdesk → Supabase**
2. Clique em **Run workflow**
3. Clique no botão verde **Run workflow**

## 📊 Monitoramento

- Veja o histórico em: **Actions** → **Sincronizar Freshdesk → Supabase**
- Cada execução mostra logs detalhados
- Falhas são destacadas em vermelho

## 🗄️ Estrutura das Tabelas Supabase

Execute o SQL abaixo no Supabase SQL Editor para criar todas as tabelas:

```sql
-- ====== TABELA PRINCIPAL: TICKETS ======
CREATE TABLE IF NOT EXISTS "Tickets" (
    id BIGINT PRIMARY KEY,
    subject TEXT,
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
    cf_tratativa TEXT,
    cf_grupo_tratativa TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== TABELA: SATISFACTION RATINGS (CSAT) ======
CREATE TABLE IF NOT EXISTS satisfaction_ratings (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT,
    survey_id BIGINT,
    user_id BIGINT,
    agent_id BIGINT,
    group_id BIGINT,
    feedback TEXT,
    ratings JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== TABELA: TIME ENTRIES ======
CREATE TABLE IF NOT EXISTS time_entries (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT,
    agent_id BIGINT,
    billable BOOLEAN DEFAULT FALSE,
    time_spent INTEGER, -- em segundos
    timer_running BOOLEAN DEFAULT FALSE,
    note TEXT,
    executed_at TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== TABELA: AGENTS ======
CREATE TABLE IF NOT EXISTS agents (
    id BIGINT PRIMARY KEY,
    contact_id BIGINT,
    name TEXT,
    email TEXT,
    active BOOLEAN DEFAULT TRUE,
    job_title TEXT,
    language TEXT,
    time_zone TEXT,
    group_ids BIGINT[],
    role_ids BIGINT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== ÍNDICES PARA PERFORMANCE ======
CREATE INDEX IF NOT EXISTS idx_tickets_status ON "Tickets"(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON "Tickets"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_group_id ON "Tickets"(group_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ticket_id ON satisfaction_ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_agent_id ON satisfaction_ratings(agent_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_ticket_id ON time_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_agent_id ON time_entries(agent_id);
```

> 📝 **Nota:** O SQL completo com todas as tabelas está em `sql/create-all-freshdesk-tables.sql`

## ❓ Troubleshooting

### Erro: "Freshdesk API error: 401"
- Verifique se a API Key está correta
- A API Key deve ter permissões de leitura

### Erro: "Supabase error: 401"
- Verifique se está usando a **Service Role Key** (não a anon key)
- A Service Role Key começa com `eyJ...` e é bem longa

### Erro: "Rate limited"
- O script já trata isso automaticamente
- Se persistir, aumente o delay entre requisições

### Workflow não executa
- Verifique se o repositório tem Actions habilitado
- Vá em Settings → Actions → General → Allow all actions

## 🔒 Segurança

- **NUNCA** comite as chaves no código
- Use apenas GitHub Secrets
- A Service Role Key do Supabase tem acesso total ao banco
- Mantenha as chaves seguras

## 📈 Métricas Disponíveis no BI

Após a sincronização, as seguintes métricas estarão disponíveis:

### ⭐ CSAT (Customer Satisfaction)
- CSAT % geral
- Ranking de agentes por satisfação
- Tendência mensal de CSAT
- Feedbacks recentes

### ⏱️ Tempo de Atendimento
- Tempo total por agente
- Tempo médio por ticket
- Ranking de esforço por agente

### 🏢 Business Hours
- % de tickets no expediente
- % de tickets fora de horário
- Horário de pico de demanda

### 📊 Tickets
- Total, Abertos, Resolvidos
- Taxa de resolução
- SLA de 1ª resposta
- Backlog e idade média

## 📁 Arquivos do Módulo

### Scripts Principais (usar estes):
| Arquivo | Descrição |
|---------|-----------|
| `sync-smart.js` | **Script unificado de sincronização** (quick/full/verify) |
| `integrity-check.js` | Verificação de integridade do banco |

### Scripts Utilitários:
| Arquivo | Descrição |
|---------|-----------|
| `sync-tickets-v2.js` | Sync completo (mantido para compatibilidade) |
| `fix-incomplete-tickets.js` | Corrige tickets sem subject |
| `sync-conversations-missing.js` | Sincroniza conversas faltantes |

### Scripts Deprecated (pasta `deprecated/`):
| Arquivo | Substituído por |
|---------|-----------------|
| `sync-quick.js` | `sync-smart.js quick` |
| `sync-quick-recent.js` | `sync-smart.js quick` |
| `sync-quick-status.js` | `sync-smart.js quick` |
| `sync-conversations.js` | `sync-smart.js full` |
| `sync-csat.js` | `sync-smart.js full` |
| `sync-metadata.js` | `sync-smart.js full` |

### Workflows do GitHub Actions:
| Arquivo | Descrição |
|---------|-----------|
| `.github/workflows/sync-freshdesk.yml` | Sync a cada 3h (usa sync-smart.js) |
| `.github/workflows/integrity-check.yml` | Verificação diária de integridade |

## 🆕 Changelog

### v3.0 (Fev/2026)
- ✅ Novo script unificado `sync-smart.js` com modos quick/full/verify
- ✅ Novo `integrity-check.js` para verificação diária
- ✅ Scripts antigos movidos para `deprecated/`
- ✅ Proteção contra perda de dados e inconsistências
- ✅ Detecção automática de tags desatualizadas

### v2.0 (Dez/2024)
- ✅ Adicionado sync de `satisfaction_ratings` (CSAT)
- ✅ Adicionado sync de `time_entries`
- ✅ Adicionado sync de `agents`, `groups`, `companies`
- ✅ Adicionado sync de `products`, `business_hours`, `surveys`
- ✅ Novas métricas no BI: CSAT, Tempo, Business Hours
- ✅ Glossário atualizado com novas métricas
