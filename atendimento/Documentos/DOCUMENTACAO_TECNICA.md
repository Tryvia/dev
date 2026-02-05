# 📋 DOCUMENTAÇÃO TÉCNICA - Sistema BI de Tickets Tryvia

**Versão:** 2.0  
**Última Atualização:** Dezembro 2025  
**Desenvolvido para:** Tryvia

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [APIs e Integrações](#apis-e-integrações)
5. [Banco de Dados](#banco-de-dados)
6. [Funcionalidades](#funcionalidades)
7. [Regras de Negócio](#regras-de-negócio)
8. [Mecânicas do Sistema](#mecânicas-do-sistema)
9. [Sincronização Automatizada](#sincronização-automatizada)
10. [Capacidade e Performance](#capacidade-e-performance)
11. [Estrutura de Arquivos](#estrutura-de-arquivos)
12. [Configuração e Deploy](#configuração-e-deploy)
13. [Segurança](#segurança)
14. [Manutenção](#manutenção)

---

## 🎯 Visão Geral

### Propósito

O **Sistema BI de Tickets Tryvia** é uma plataforma de Business Intelligence desenvolvida para análise e gestão de tickets de suporte. O sistema integra dados do Freshdesk (plataforma de helpdesk) com um banco de dados Supabase, oferecendo visualizações avançadas, métricas de SLA, análise de produtividade e geração de relatórios.

### Objetivos Principais

- **Centralização de Dados:** Consolidar todos os tickets de suporte em um único dashboard
- **Análise de Performance:** Métricas de SLA, tempo de resposta e resolução
- **Gestão de Equipe:** Análise por pessoa, time e sistemas
- **Automação:** Sincronização automática de dados sem intervenção manual
- **Tomada de Decisão:** Insights baseados em dados para gestão

### Público-Alvo

- Gestores de Suporte
- Líderes de Time
- Analistas de BI
- Diretoria (relatórios executivos)

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              BI_por_Time(2).html                         │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │Dashboard│ │Analytics│ │Apresent.│ │Relatório│        │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CAMADA DE DADOS                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Supabase   │◄───│ Proxy Local  │◄───│   Freshdesk  │       │
│  │  (PostgreSQL)│    │  (Node.js)   │    │    (API)     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMAÇÃO (GitHub Actions)                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  sync-freshdesk.yml → sync-tickets.js                    │    │
│  │  Execução: A cada 3 horas (cron: 0 */3 * * *)           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Freshdesk** → API REST fornece dados de tickets, agentes, grupos e conversas
2. **Proxy Local** → Resolve CORS e adiciona autenticação
3. **Supabase** → Armazena dados persistentes (PostgreSQL)
4. **Frontend** → Consome dados via REST API do Supabase
5. **GitHub Actions** → Sincronização automática periódica

---

## 💻 Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| HTML5 | - | Estrutura da aplicação |
| CSS3 | - | Estilização (dark mode nativo) |
| JavaScript (ES6+) | - | Lógica de aplicação |
| Chart.js | - | Gráficos e visualizações |

### Backend / Servidor

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20.x | Runtime do servidor e scripts |
| Express.js | 4.18.2 | Framework web (proxy) |
| Axios | 1.6.0 | Cliente HTTP |
| CORS | 2.8.5 | Middleware de CORS |

### Banco de Dados

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Supabase | - | BaaS (Backend as a Service) |
| PostgreSQL | 15.x | Banco de dados relacional |

### Automação / CI-CD

| Tecnologia | Uso |
|------------|-----|
| GitHub Actions | Sincronização automática |
| Cron Jobs | Agendamento (a cada 3h) |

### Integrações

| Serviço | Uso |
|---------|-----|
| Freshdesk API v2 | Fonte de dados de tickets |
| Supabase REST API | Persistência e consulta |

---

## 🔌 APIs e Integrações

### Freshdesk API v2

**Base URL:** `https://suportetryvia.freshdesk.com/api/v2`

**Autenticação:** Basic Auth (API Key + X)

#### Endpoints Utilizados

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/tickets` | GET | Lista todos os tickets |
| `/tickets/{id}` | GET | Detalhes de um ticket |
| `/tickets/{id}/conversations` | GET | Conversas de um ticket |
| `/agents` | GET | Lista de agentes |
| `/groups` | GET | Lista de grupos |
| `/companies` | GET | Lista de empresas |

#### Parâmetros Comuns

```
?per_page=100          # Itens por página (máx 100)
&page=1                # Número da página
&include=stats,requester  # Incluir estatísticas e requisitante
&updated_since=2020-01-01 # Filtro de data
```

#### Rate Limiting

- **Limite:** 1000 requests/hora (plano padrão)
- **Header de resposta:** `Retry-After` indica tempo de espera
- **Tratamento:** Sistema aguarda automaticamente quando limitado

### Supabase REST API

**Base URL:** `https://mzjdmhgkrroajmsfwryu.supabase.co`

**Autenticação:** API Key + Bearer Token

#### Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/rest/v1/tickets` | GET/POST/PATCH | CRUD de tickets |
| `/rest/v1/ticket_conversations` | GET/POST/PATCH | CRUD de conversas |
| `/rest/v1/FreshdeskAgents` | GET | Lookup de agentes |
| `/rest/v1/FreshdeskGroups` | GET | Lookup de grupos |
| `/rest/v1/TicketSurveys` | GET | Pesquisas de satisfação |

#### Headers Requeridos

```javascript
{
  'apikey': 'SUPABASE_ANON_KEY',
  'Authorization': 'Bearer SUPABASE_ANON_KEY',
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates' // Para upsert
}
```

---

## 🗄️ Banco de Dados

### Estrutura de Tabelas

#### Tabela: `tickets`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | BIGINT (PK) | ID único do ticket (Freshdesk) |
| subject | TEXT | Assunto do ticket |
| description | TEXT | Descrição HTML |
| description_text | TEXT | Descrição em texto puro |
| status | INTEGER | Código do status |
| priority | INTEGER | Prioridade (1-4) |
| source | INTEGER | Origem do ticket |
| type | TEXT | Tipo/categoria |
| requester_id | BIGINT | ID do solicitante |
| requester_name | TEXT | Nome do solicitante |
| requester_email | TEXT | Email do solicitante |
| requester_phone | VARCHAR | Telefone |
| requester_mobile | VARCHAR | Celular |
| responder_id | BIGINT | ID do agente responsável |
| responder_name | TEXT | Nome do agente |
| group_id | BIGINT | ID do grupo |
| group_name | TEXT | Nome do grupo |
| company_id | BIGINT | ID da empresa |
| company_name | VARCHAR | Nome da empresa |
| product_id | BIGINT | ID do produto |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Última atualização |
| due_by | TIMESTAMPTZ | Prazo de resolução |
| fr_due_by | TIMESTAMPTZ | Prazo primeira resposta |
| is_escalated | BOOLEAN | Se está escalado |
| tags | TEXT[] | Tags do ticket |
| custom_fields | JSONB | Campos customizados |
| stats_first_responded_at | TIMESTAMPTZ | Data primeira resposta |
| stats_resolved_at | TIMESTAMPTZ | Data de resolução |
| stats_closed_at | TIMESTAMPTZ | Data de fechamento |
| stats_pending_since | TIMESTAMPTZ | Pendente desde |
| stats_reopened_at | TIMESTAMPTZ | Data de reabertura |
| synced_at | TIMESTAMPTZ | Última sincronização |

#### Tabela: `ticket_conversations`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | BIGINT (PK) | ID da conversa |
| ticket_id | BIGINT (FK) | ID do ticket |
| user_id | BIGINT | ID do usuário |
| from_email | TEXT | Email do remetente |
| to_emails | TEXT[] | Destinatários |
| cc_emails | TEXT[] | Cópias |
| bcc_emails | TEXT[] | Cópias ocultas |
| body | TEXT | Conteúdo HTML |
| body_text | TEXT | Conteúdo texto |
| incoming | BOOLEAN | Se é entrada |
| private | BOOLEAN | Se é nota privada |
| source | INTEGER | Origem |
| category | INTEGER | Categoria |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Última atualização |
| synced_at | TIMESTAMPTZ | Última sincronização |

#### Tabela: `TicketSurveys`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | BIGINT (PK) | ID da pesquisa |
| ticket_id | BIGINT | ID do ticket |
| rating | INTEGER | Nota (1-5) |
| feedback | TEXT | Feedback do cliente |
| created_at | TIMESTAMPTZ | Data de criação |

### Índices

```sql
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX idx_tickets_group_id ON tickets(group_id);
CREATE INDEX idx_tickets_responder_id ON tickets(responder_id);
CREATE INDEX idx_conversations_ticket_id ON ticket_conversations(ticket_id);
```

---

## ⚙️ Funcionalidades

### 1. Dashboard Principal

- **KPIs em Tempo Real:** Total de tickets, resolvidos, abertos, pendentes
- **Gráfico de Status:** Distribuição por status
- **Gráfico de Prioridade:** Distribuição por prioridade
- **Timeline:** Evolução temporal de tickets

### 2. BI Analytics

- **Análise por Pessoa:** Performance individual de agentes
- **Análise por Time:** Performance de grupos/equipes
- **Métricas Avançadas:**
  - Taxa de resolução
  - Tempo médio de resposta
  - Tempo médio de resolução
  - Conformidade SLA
  - Produtividade

### 3. Modo Apresentação

- **30+ Templates de Slides:** KPIs, gráficos, rankings
- **Temas:** Dark, Corporate, Modern, Gradient
- **Auto-Geração:** Relatórios executivos, performance, SLA
- **Exportação:** Preparado para projeção

### 4. Módulo Comparativo

- **Comparação Multi-Entidade:** Até 5 entidades simultâneas
- **Visualizações:** Radar, barras, heatmap, timeline
- **Métricas Selecionáveis:** 10+ métricas disponíveis
- **Exportação Excel:** Dados detalhados

### 5. Sistema de Relatórios

- **Relatório Executivo:** Resumo para diretoria
- **Relatório Analítico:** Dados detalhados
- **Relatório de SLA:** Análise de conformidade
- **Exportação:** PDF, Excel

### 6. Glossário de Termos

- Definições de métricas
- Explicação de status
- Fórmulas de cálculo

### 7. Insights Automáticos

- Detecção de anomalias
- Sugestões de melhoria
- Alertas de SLA

### 8. Chatbot IA Tryviano

O sistema inclui um assistente de IA integrado com capacidades avançadas:

#### Agent Loop (Autonomia)
```
Usuário → Intent Detection → Planner → Tool Execution → Verification → Memory Update → Resposta
```

#### 12 Tools Disponíveis

| Tool | Descrição |
|------|-----------|
| `query_tickets` | Buscar tickets com filtros |
| `get_person_stats` | Estatísticas de uma pessoa |
| `get_team_stats` | Estatísticas de um time |
| `get_sla` | Calcular SLA geral ou por pessoa |
| `get_alerts` | Obter alertas e problemas |
| `search_knowledge` | Buscar na base de conhecimento |
| `navigate_to` | Navegar entre views do BI |
| `save_decision` | Salvar nota/decisão |
| `get_ticket_details` | Detalhes de um ticket |
| `compare_periods` | Comparar períodos |
| `get_ranking` | Ranking de pessoas/times |
| `predict_volume` | Previsão de volume |

#### Memória
- **Short-term**: Últimas 20 interações
- **Working memory**: Contexto da tarefa atual
- **Long-term**: Preferências salvas no localStorage

#### RAG (Retrieval Augmented Generation)
- Indexa soluções conhecidas, métricas e decisões
- Busca documentos relevantes para enriquecer prompts
- Método `enrichPrompt(query)` adiciona contexto ao LLM

#### Evaluator (Anti-Alucinação)
- Verifica se resposta tem conteúdo suficiente
- Verifica se contém dados reais
- Verifica relevância à intenção
- Detecta números inventados

#### Test Suite
```javascript
Chatbot.testSuite.runAll()       // Executa todos os testes
Chatbot.testSuite.stressTest(50) // Teste de carga
Chatbot.testSuite.benchmark()    // Performance
```

### 9. Módulo CSAT/Tempo

- Análise de satisfação do cliente (1-5 estrelas)
- Tempo médio de primeira resposta
- Tempo médio de resolução
- Filtros por período e time
- Gráficos de tendência

### 10. Módulo Acompanhamento

- Visão geral de produtividade
- Tickets por pessoa/time
- Taxa de resolução
- Evolução temporal
- Exportação de dados

---

## 📜 Regras de Negócio

### Mapeamento de Status (Freshdesk Tryvia)

| Código | Status | Cor | Categoria |
|--------|--------|-----|-----------|
| 2 | Aberto | #3b82f6 | open |
| 3 | Pendente | #f59e0b | pending |
| 4 | Resolvido | #10b981 | resolved |
| 5 | Fechado | #6b7280 | resolved |
| 6 | Em Homologação | #8b5cf6 | validation |
| 7 | Aguardando Cliente | #f59e0b | waiting |
| 8 | Em Tratativa | #06b6d4 | in_progress |
| 10 | Em Análise | #06b6d4 | in_progress |
| 11 | Interno | #64748b | in_progress |
| 12 | Aguardando Publicar HML | #3b82f6 | waiting_deploy |
| 13 | Aguardando Publicar PROD | #8b5cf6 | waiting_deploy |
| 14 | MVP | #ec4899 | special |
| 15 | Validação-Atendimento | #f97316 | validation |
| 16 | Aguardando Parceiros | #a855f7 | waiting |
| 17 | Pausado | #64748b | pending |
| 18 | Validação-CS | #f97316 | validation |
| 19 | Levantamento de Esforço | #6366f1 | in_progress |
| 20 | Em Fila DEV | #ef4444 | in_progress |
| 21 | Em Produção | #10b981 | deployed |

### Mapeamento de Prioridade

| Código | Prioridade | Cor |
|--------|------------|-----|
| 1 | Baixa | Verde |
| 2 | Média | Amarelo |
| 3 | Alta | Laranja |
| 4 | Urgente | Vermelho |

### Mapeamento de Fonte (Source)

| Código | Fonte |
|--------|-------|
| 1 | Email |
| 2 | Portal |
| 3 | Telefone |
| 7 | Chat |
| 9 | Feedback Widget |
| 10 | Outbound Email |

### Regras de SLA

1. **SLA de Primeira Resposta:**
   - Prazo definido em `fr_due_by`
   - Cumprido se `stats_first_responded_at < fr_due_by`
   - Violado se resposta após o prazo

2. **SLA de Resolução:**
   - Prazo definido em `due_by`
   - Cumprido se `stats_resolved_at < due_by`
   - Violado se resolução após o prazo

3. **Cálculo de Conformidade:**
   ```
   SLA % = (Tickets dentro do prazo / Total de tickets) × 100
   ```

### Regras de Tempo

1. **Tempo de Primeira Resposta:**
   ```
   FR Time = stats_first_responded_at - created_at
   ```

2. **Tempo de Resolução:**
   ```
   Resolution Time = stats_resolved_at - created_at
   ```

3. **Tempo em Pendência:**
   ```
   Pending Time = NOW() - stats_pending_since
   ```

### Regras de Produtividade

1. **Tickets por Pessoa/Dia:**
   ```
   Produtividade = Total Tickets / Dias no Período
   ```

2. **Taxa de Resolução:**
   ```
   Taxa = (Resolvidos / Total) × 100
   ```

### Campos Customizados (custom_fields)

| Campo | Descrição |
|-------|-----------|
| cf_empresa | Nome da empresa |
| cf_grupo_empresa | Grupo empresarial |
| cf_analista | Analista responsável |
| cf_tratativa | Pessoa em tratativa |
| cf_grupo_tratativa | Time de tratativa |
| cf_tipo_primrio | Tipo primário do ticket |
| cf_complexidade | Nível de complexidade |
| cf_situao | Situação atual |

---

## 🔧 Mecânicas do Sistema

### Carregamento de Dados

1. **Fonte Primária:** Supabase (dados sincronizados)
2. **Fonte Secundária:** Excel (upload manual)
3. **Carregamento em Chunks:** Paginação de 1000 registros

### Filtros

- **Período:** 7, 30, 90, 180, 365 dias ou personalizado
- **Status:** Todos ou específico
- **Prioridade:** Todas ou específica
- **Time:** Todos ou específico
- **Pessoa:** Todos ou específica

### Cache

- **allTicketsCache:** Array com todos os tickets carregados
- **Invalidação:** Ao recarregar dados ou trocar fonte

### Virtualização de Tabela

- Renderiza apenas linhas visíveis
- Melhora performance com grandes volumes

### Web Workers

- Processamento pesado em background
- UI permanece responsiva

---

## 🔄 Sincronização Automatizada

### GitHub Actions Workflow

**Arquivo:** `.github/workflows/sync-freshdesk.yml`

```yaml
name: Sync Freshdesk to Supabase
on:
  schedule:
    - cron: '0 */3 * * *'  # A cada 3 horas
  workflow_dispatch:        # Manual

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node sync-freshdesk/sync-tickets.js
        env:
          FRESHDESK_DOMAIN: ${{ secrets.FRESHDESK_DOMAIN }}
          FRESHDESK_API_KEY: ${{ secrets.FRESHDESK_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### Fluxo de Sincronização

```
FASE 1: BUSCAR DO FRESHDESK
├── 1.1 Buscar agentes
├── 1.2 Buscar grupos
├── 1.3 Buscar empresas
├── 1.4 Buscar tickets (paginado)
├── 1.5 Transformar tickets
└── 1.6 Buscar conversas de cada ticket

FASE 2: ENVIAR PARA SUPABASE
├── 2.1 Upsert tickets (check → update ou insert)
└── 2.2 Upsert conversas
```

### Secrets Necessários

| Secret | Descrição |
|--------|-----------|
| FRESHDESK_DOMAIN | `suportetryvia` |
| FRESHDESK_API_KEY | Chave da API Freshdesk |
| SUPABASE_URL | `https://xxx.supabase.co` |
| SUPABASE_SERVICE_KEY | Service Role Key |

---

## 📊 Capacidade e Performance

### Limites Testados

| Métrica | Valor |
|---------|-------|
| Tickets processados | 50.000+ |
| Conversas processadas | 100.000+ |
| Tempo de carregamento (1000 tickets) | < 2s |
| Tempo de renderização de gráfico | < 100ms |
| Memória utilizada | ~200MB |

### Otimizações Implementadas

1. **Paginação:** Carrega dados em chunks
2. **Virtualização:** Renderiza apenas elementos visíveis
3. **Memoização:** Cache de cálculos frequentes
4. **Debounce:** Evita chamadas excessivas
5. **Web Workers:** Processamento em background
6. **Lazy Loading:** Carrega componentes sob demanda

### Limites da API Freshdesk

| Plano | Rate Limit |
|-------|------------|
| Free | 50 requests/hora |
| Growth | 200 requests/hora |
| Pro | 400 requests/hora |
| Enterprise | 1000 requests/hora |

### Tempo de Sincronização Estimado

| Tickets | Conversas | Tempo Aproximado |
|---------|-----------|------------------|
| 100 | ~300 | 2-3 min |
| 500 | ~1500 | 8-12 min |
| 1000 | ~3000 | 15-20 min |

---

## 📁 Estrutura de Arquivos

```
Projeto Atendimento V-2/
├── .github/
│   └── workflows/
│       └── sync-freshdesk.yml      # Workflow de automação
│
├── Documentos/
│   ├── DOCUMENTACAO_TECNICA.md     # Esta documentação
│   └── HISTORICO_DESENVOLVIMENTO.md # Histórico de melhorias
│
├── docs/
│   ├── README.md                   # Documentação principal
│   ├── COMPONENTES.md              # Documentação de componentes
│   ├── ESTILOS.md                  # Guia de estilos
│   └── API_DADOS.md                # Documentação de API
│
├── js/
│   ├── bi-analytics.js             # Classe principal BI
│   ├── bi-analytics-methods.js     # Métodos de cálculo
│   ├── bi-analytics-charts.js      # Renderização de gráficos
│   ├── bi-analytics-metrics.js     # Métricas avançadas
│   ├── bi-analytics-init.js        # Inicialização
│   ├── bi-csat-time-module.js      # Módulo CSAT/Tempo
│   ├── bi-acompanhamento-module.js # Módulo Acompanhamento
│   ├── chatbot.js                  # Chatbot IA Tryviano
│   ├── navigation-functions.js     # Navegação entre abas
│   ├── presentation-mode-v2.js     # Modo apresentação
│   ├── insights-module.js          # Insights automáticos
│   ├── glossary-module.js          # Glossário de termos
│   ├── gamification.js             # Sistema de gamificação
│   ├── global-search.js            # Busca global (Ctrl+K)
│   ├── releases.js                 # Release notes
│   ├── reports-module.js           # Gerador de relatórios
│   ├── ai-transformers.js          # Transformadores de IA
│   ├── supabase-loader.js          # Carregador Supabase
│   ├── supabase-chunked-loader.js  # Carregador com chunks
│   ├── status-config.js            # Configuração de status
│   ├── ticket-status-manager.js    # Gerenciador de status
│   ├── date-range-picker.js        # Seletor de período
│   └── interactive-charts.js       # Gráficos interativos
│
├── styles/
│   └── *.css                       # Estilos modulares
│
├── sync-freshdesk/
│   ├── sync-tickets.js             # Script de sincronização
│   ├── sync-surveys-standalone.js  # Sync de avaliações
│   ├── setup-supabase.sql          # SQL de setup
│   └── README.md                   # Documentação sync
│
├── whatsapp-bot/
│   └── bot.js                      # Bot de notificações WhatsApp
│
├── BI_por_Time(2).html             # Aplicação principal
├── freshdesk-proxy.js              # Proxy local
├── sync-conversations.js           # Sync de conversas
├── package.json                    # Dependências Node
└── ABRIR_SISTEMA.bat               # Script de inicialização
```

---

## 🚀 Configuração e Deploy

### Requisitos

- Node.js 18+ (recomendado 20.x)
- Navegador moderno (Chrome, Firefox, Edge)
- Conta Supabase
- Conta Freshdesk com API Key
- Conta GitHub (para automação)

### Instalação Local

```bash
# 1. Clonar repositório
git clone https://github.com/zVritra/projeto-atendimento.git
cd projeto-atendimento

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Criar arquivo .env ou configurar no sistema
FRESHDESK_DOMAIN=suportetryvia
FRESHDESK_API_KEY=sua_api_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=sua_service_key

# 4. Iniciar proxy (opcional, para dev)
npm start

# 5. Abrir BI_por_Time(2).html no navegador
# Ou usar ABRIR_SISTEMA.bat
```

### Configuração Supabase

1. Criar projeto no Supabase
2. Executar SQL de setup (`sync-freshdesk/setup-supabase.sql`)
3. Copiar URL e chaves
4. Configurar no HTML ou secrets do GitHub

### Configuração GitHub Actions

1. Fork/clone do repositório
2. Settings → Secrets → Actions
3. Adicionar secrets:
   - `FRESHDESK_DOMAIN`
   - `FRESHDESK_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
4. Habilitar Actions no repositório

---

## 🔒 Segurança

### Credenciais

- **Nunca committar** API keys no código
- Usar **GitHub Secrets** para CI/CD
- Usar **variáveis de ambiente** localmente

### Supabase RLS

- Row Level Security desabilitado para tabelas de sync
- Usar Service Role Key apenas no backend
- Anon Key para leitura no frontend

### CORS

- Proxy local resolve CORS em desenvolvimento
- GitHub Actions não tem problema de CORS

### Dados Sensíveis

- Emails de clientes armazenados
- Implementar política de retenção se necessário
- Considerar anonimização para ambientes de teste

---

## 🔧 Manutenção

### Monitoramento

- Verificar execuções do GitHub Actions
- Monitorar logs de sincronização
- Acompanhar uso de rate limit da API

### Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| 401 Unauthorized | Verificar API Key |
| 404 Not Found | Verificar domínio Freshdesk |
| 405 Method Not Allowed | Verificar URL do Supabase |
| 409 Conflict | Ajustar headers de upsert |
| 429 Rate Limited | Aguardar ou aumentar delays |
| Schema cache error | Executar NOTIFY pgrst |

### Atualizações

1. **Novos campos Freshdesk:**
   - Adicionar coluna no Supabase
   - Atualizar `transformTicket()` no script
   - Atualizar mapeamentos no frontend

2. **Novos status:**
   - Atualizar `status-config.js`
   - Verificar `bi-analytics.js` para cores

3. **Novos relatórios:**
   - Criar template em presentation-mode-v2.js
   - Adicionar opção no menu

### Backup

- Supabase faz backup automático (plano pago)
- Exportar dados periodicamente via Excel
- Manter versões do código no Git

---

## 📞 Suporte

### Contatos

- **Repositório:** github.com/zVritra/projeto-atendimento
- **Freshdesk:** suportetryvia.freshdesk.com
- **Supabase:** supabase.com/dashboard

### Logs

- **GitHub Actions:** Actions → Workflow runs
- **Browser:** DevTools → Console
- **Supabase:** Database → Logs

---

## 📝 Changelog

### v3.0 (Dezembro 2025)
- **Chatbot IA Tryviano** com Agent Loop autônomo
- **12 Tools formais** para consultas estruturadas
- **RAG** (Retrieval Augmented Generation) para contexto
- **Memória de Decisões** com tags automáticas
- **Test Suite** para validação automática do chatbot
- **Módulo CSAT/Tempo** para análise de satisfação
- **Módulo Acompanhamento** para produtividade
- **Date Pickers corrigidos** (position: absolute)
- **Retry automático** para rate limit (429) no Gemini
- **Badge visual** 🤖 para respostas do Agent
- **Evaluator anti-alucinação** para verificar respostas

### v2.0 (Dezembro 2025)
- Sincronização automatizada via GitHub Actions
- Sincronização de conversas e avaliações
- Reorganização do fluxo de sync
- Status centralizado (status-config.js)
- Gamificação com 10 níveis e 22 conquistas
- Busca Global (Ctrl+K) com sintaxes especiais
- Gráficos interativos com drill-down
- Sistema de Relatórios PDF/Excel
- Documentação técnica completa

### v1.5
- Modo Apresentação v2
- Módulo Comparativo
- Web Workers

### v1.0
- Dashboard inicial
- Integração Freshdesk
- Integração Supabase

---

**Documento gerado em:** Dezembro 2025  
**Autor:** Sistema Automatizado  
**Revisão:** v3.0
