# Documentação Técnica - Sistema de BI e Analytics de Tickets

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARQUITETURA GERAL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────────┐    │
│  │  FRESHDESK   │◄───────►│ PROXY LOCAL  │◄───────►│    FRONTEND      │    │
│  │  (API REST)  │         │ (Node.js)    │         │ (HTML/JS/Canvas) │    │
│  └──────────────┘         └──────────────┘         └──────────────────┘    │
│         │                        │                          │              │
│         │                        │                          │              │
│         ▼                        ▼                          ▼              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────────┐    │
│  │  SYNC JOB    │────────►│   SUPABASE   │◄───────►│   BI ANALYTICS   │    │
│  │ (GitHub Act) │         │ (PostgreSQL) │         │    (Gráficos)    │    │
│  └──────────────┘         └──────────────┘         └──────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. FONTE DE DADOS - Freshdesk API

### 1.1 Configuração
| Parâmetro | Valor |
|-----------|-------|
| **Domínio** | `https://suportetryvia.freshdesk.com` |
| **Versão da API** | v2 |
| **Autenticação** | Basic Auth (API Key + `:X`) |
| **Rate Limit** | ~400 requests/minuto |

### 1.2 Endpoints Utilizados

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v2/tickets` | GET | Lista de tickets (paginado, 100/página) |
| `/api/v2/tickets/{id}` | GET | Detalhes de um ticket |
| `/api/v2/tickets/{id}/conversations` | GET | Conversas do ticket |
| `/api/v2/tickets/{id}/time_entries` | GET | Tempo trabalhado |
| `/api/v2/tickets/{id}/satisfaction_ratings` | GET | CSAT do ticket |
| `/api/v2/agents` | GET | Lista de agentes |
| `/api/v2/groups` | GET | Lista de grupos/times |
| `/api/v2/companies` | GET | Lista de empresas |
| `/api/v2/products` | GET | Lista de produtos |
| `/api/v2/business_hours` | GET | Horários comerciais |
| `/api/v2/surveys/satisfaction_ratings` | GET | Todas as avaliações CSAT |

### 1.3 Estrutura de um Ticket Freshdesk
```javascript
{
  id: 12345,
  subject: "Assunto do ticket",
  description: "<html>...</html>",
  status: 2,                    // 2=Aberto, 3=Pendente, 4=Resolvido, 5=Fechado
  priority: 2,                  // 1=Baixa, 2=Média, 3=Alta, 4=Urgente
  source: 2,                    // 1=Email, 2=Portal, 3=Telefone...
  type: "Incidente",
  requester_id: 1001,
  responder_id: 2001,
  group_id: 3001,
  company_id: 4001,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T14:30:00Z",
  due_by: "2024-01-16T10:30:00Z",
  fr_due_by: "2024-01-15T14:30:00Z",   // First Response Due
  custom_fields: {
    cf_tratativa: "Nome do Analista",
    cf_grupo_tratativa: "Time X",
    cf_sistema: "Sistema Y"
  },
  stats: {
    first_responded_at: "2024-01-15T11:00:00Z",
    resolved_at: "2024-01-15T16:00:00Z",
    closed_at: null
  }
}
```

---

## 2. PROXY LOCAL (Node.js)

### 2.1 Por que usar Proxy?
A API do Freshdesk **NÃO** permite chamadas diretas do navegador devido a restrições de CORS. O proxy atua como intermediário.

### 2.2 Arquivo: `freshdesk-proxy.js`

**Tecnologias:**
- **Express.js** (v4.18.2) - Framework web
- **Cors** (v2.8.5) - Middleware CORS
- **Axios** (v1.6.0) - Cliente HTTP

**Porta padrão:** `3003` (fallback: 3002, 3001)

### 2.3 Endpoints do Proxy

| Endpoint Proxy | Endpoint Freshdesk | Descrição |
|----------------|-------------------|-----------|
| `GET /api/tickets` | `/api/v2/tickets` | Lista tickets |
| `GET /api/tickets-all` | Multi-período | TODOS os tickets (inclui fechados) |
| `GET /api/agents` | `/api/v2/agents` | Lista agentes |
| `GET /api/groups` | `/api/v2/groups` | Lista grupos |
| `GET /api/companies` | `/api/v2/companies` | Lista empresas |
| `GET /api/satisfaction-ratings` | `/api/v2/surveys/satisfaction_ratings` | CSAT |
| `GET /test` | - | Teste de conexão |

### 2.4 Fluxo de Requisição
```
Browser (localhost:porta)
    │
    ▼
┌─────────────────────────┐
│     freshdesk-proxy     │
│   (Express + CORS)      │
├─────────────────────────┤
│ 1. Recebe requisição    │
│ 2. Adiciona Auth Header │
│ 3. Faz chamada Axios    │
│ 4. Retorna JSON         │
└─────────────────────────┘
    │
    ▼
Freshdesk API (suportetryvia.freshdesk.com)
```

### 2.5 Como Executar
```bash
# Instalar dependências
npm install

# Iniciar proxy
npm start
# ou
node freshdesk-proxy.js
```

---

## 3. SINCRONIZAÇÃO COM SUPABASE

### 3.1 Configuração Supabase

| Parâmetro | Valor |
|-----------|-------|
| **URL** | `https://mzjdmhgkrroajmsfwryu.supabase.co` |
| **Banco** | PostgreSQL |
| **Auth** | API Key (anon + service role) |

### 3.2 Tabelas no Supabase

| Tabela | Campos Principais |
|--------|-------------------|
| `tickets` | id, subject, status, priority, created_at, custom_fields, stats_* |
| `agents` | id, name, email, active, group_ids |
| `groups` | id, name, description |
| `companies` | id, name, domains |
| `ticket_conversations` | id, ticket_id, body, incoming, created_at |
| `time_entries` | id, ticket_id, agent_id, time_spent_minutes |
| `satisfaction_ratings` | id, ticket_id, score, feedback |
| `products` | id, name, description |
| `business_hours` | id, name, time_zone, business_hours |
| `surveys` | id, title, questions |

### 3.3 Script de Sincronização: `sync-freshdesk/sync-tickets-v2.js`

**Execução:** GitHub Actions (automática) ou manual

**Variáveis de Ambiente Necessárias:**
```bash
FRESHDESK_DOMAIN=suportetryvia
FRESHDESK_API_KEY=sua_api_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=sua_service_key
```

**Fluxo de Sincronização:**
```
┌─────────────────────────────────────────────────────────┐
│               SYNC-TICKETS-V2.JS                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  FASE 1: BUSCAR DO FRESHDESK                           │
│  ├── Agentes (paginado)                                │
│  ├── Grupos                                            │
│  ├── Empresas (paginado)                               │
│  ├── Tickets (paginado, com stats)                     │
│  ├── Conversas (por ticket)                            │
│  ├── Time Entries (por ticket)                         │
│  ├── Satisfaction Ratings                               │
│  ├── Products                                          │
│  └── Business Hours                                    │
│                                                         │
│  FASE 2: ENVIAR PARA SUPABASE                          │
│  ├── Upsert Agentes                                    │
│  ├── Upsert Grupos                                     │
│  ├── Upsert Empresas                                   │
│  ├── Upsert Tickets (transformados)                    │
│  ├── Upsert Conversas                                  │
│  ├── Upsert Time Entries                               │
│  └── Upsert Satisfaction Ratings                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Transformação de Dados (Ticket)
```javascript
// Freshdesk -> Supabase
{
  id: ticket.id,
  subject: ticket.subject,
  status: ticket.status,
  priority: ticket.priority,
  requester_id: ticket.requester_id,
  requester_name: ticket.requester?.name,
  responder_id: ticket.responder_id,
  responder_name: agentsMap[ticket.responder_id],  // Resolvido via lookup
  group_id: ticket.group_id,
  group_name: groupsMap[ticket.group_id],          // Resolvido via lookup
  company_id: ticket.company_id,
  company_name: companiesMap[ticket.company_id],   // Resolvido via lookup
  custom_fields: ticket.custom_fields,
  stats_first_responded_at: ticket.stats?.first_responded_at,
  stats_resolved_at: ticket.stats?.resolved_at,
  synced_at: new Date().toISOString()
}
```

---

## 4. FRONTEND - Carregamento de Dados

### 4.1 Arquivo: `js/supabase-loader.js`

**Responsabilidade:** Inicializar cliente Supabase no browser

```javascript
// Configuração
const SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';

// Singleton
window.SupabaseLoader = {
  getClient(),   // Retorna cliente inicializado
  isReady(),     // Verifica se está pronto
  reset()        // Reseta conexão
};
```

### 4.2 Arquivo: `js/core-data.js`

**Responsabilidade:** Gerenciar dados e lookups

**Estruturas Globais:**
```javascript
window.DATA = { 
  times: [],      // Lista de times
  dados: {},      // Dados por time
  rawData: []     // Todos os tickets
};

window.FD_LOOKUPS = {
  agents: Map,     // id -> nome
  groups: Map,     // id -> nome
  companies: Map,  // id -> nome
  loaded: boolean
};
```

**Fluxo de Carregamento:**
```
┌─────────────────────────────────────────────────────────┐
│                  CORE-DATA.JS                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. loadFreshdeskLookups()                             │
│     ├── checkProxyAvailable() ?                        │
│     │   ├── SIM: Busca do Proxy                        │
│     │   │   └── syncLookupsFromProxyToSupabase()       │
│     │   └── NÃO: loadLookupsFromSupabase() (fallback)  │
│                                                         │
│  2. buildDATAFromTickets(tickets)                      │
│     ├── Agrupa por group_id                            │
│     ├── Calcula métricas (SLA, taxa fechamento)        │
│     └── Retorna { times, dados, consolidado }          │
│                                                         │
│  3. Event: 'tickets:updated'                           │
│     └── updateGlobalDATAFromTickets()                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Carregamento de Tickets

**Duas fontes possíveis:**

1. **Via Proxy (tempo real):**
```javascript
const response = await fetch('http://localhost:3003/api/tickets-all');
const data = await response.json();
window.allTicketsCache = data.tickets;
```

2. **Via Supabase (fallback/persistido):**
```javascript
const client = await SupabaseLoader.getClient();
const { data } = await client
  .from('tickets')
  .select('*')
  .order('created_at', { ascending: false });
window.allTicketsCache = data;
```

---

## 5. BI ANALYTICS - Renderização

### 5.1 Arquivos do Módulo BI

| Arquivo | Responsabilidade |
|---------|------------------|
| `bi-analytics.js` | Estrutura principal, modal expandido |
| `bi-analytics-charts.js` | Renderização de gráficos (Canvas 2D) |
| `bi-analytics-methods.js` | Métodos auxiliares, modais de tickets |
| `bi-analytics-metrics.js` | Cálculo de métricas |
| `bi-analytics-init.js` | Inicialização |

### 5.2 Fluxo de Renderização

```
┌─────────────────────────────────────────────────────────┐
│              FLUXO BI ANALYTICS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. initializeBI()                                     │
│     └── Verifica se há dados em allTicketsCache        │
│                                                         │
│  2. biAnalytics.filterData()                           │
│     ├── Aplica filtro de período (7, 30, 90 dias...)   │
│     ├── Separa createdInPeriod / resolvedInPeriod      │
│     └── Atualiza filteredData                          │
│                                                         │
│  3. biAnalytics.calculateMetrics()                     │
│     ├── total, resolvidos, abertos                     │
│     ├── statusCounts por status                        │
│     ├── prioridades, sistemas                          │
│     └── SLA, tempo médio resposta                      │
│                                                         │
│  4. biAnalytics.renderAllCharts()                      │
│     ├── renderKPICards()                               │
│     ├── renderVolumeChart()                            │
│     ├── renderStatusChart()                            │
│     ├── renderPriorityChart()                          │
│     ├── renderTop10Chart()                             │
│     ├── renderSLAChart()                               │
│     ├── renderTendenciaChart()                         │
│     ├── renderRankingSLAChart()                        │
│     └── ... (20+ gráficos)                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Tecnologia de Gráficos

**Canvas 2D API (nativo do browser)**

```javascript
// Exemplo: setupCanvas()
function setupCanvas(canvas, height) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height };
}
```

**Interatividade:**
- Tooltips customizados com `setupCanvasTooltip()`
- Eventos de clique para mostrar tickets
- Hover effects com re-render

---

## 6. DIAGRAMA COMPLETO DO FLUXO

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO COMPLETO DE DADOS                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                             │
│  │  FRESHDESK  │                                                             │
│  │  (Origem)   │                                                             │
│  └──────┬──────┘                                                             │
│         │                                                                    │
│         ├──────────────────────────────┐                                     │
│         │                              │                                     │
│         ▼                              ▼                                     │
│  ┌─────────────┐               ┌─────────────────┐                          │
│  │   PROXY     │               │   SYNC JOB      │                          │
│  │   LOCAL     │               │ (GitHub Actions)│                          │
│  │  :3003      │               │  sync-v2.js     │                          │
│  └──────┬──────┘               └────────┬────────┘                          │
│         │                               │                                    │
│         │ (tempo real)                  │ (batch)                           │
│         │                               │                                    │
│         ▼                               ▼                                    │
│  ┌─────────────┐               ┌─────────────────┐                          │
│  │  FRONTEND   │◄─────────────►│    SUPABASE     │                          │
│  │  (Browser)  │   (fallback)  │   (PostgreSQL)  │                          │
│  └──────┬──────┘               └─────────────────┘                          │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        CAMADA DE DADOS                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ allTickets   │  │  FD_LOOKUPS  │  │    DATA      │              │    │
│  │  │   Cache      │  │   (agents,   │  │  (agregado)  │              │    │
│  │  │              │  │   groups)    │  │              │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        BI ANALYTICS                                  │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │    │
│  │  │ filterData │►│ calculate  │►│ render     │►│  Canvas    │       │    │
│  │  │            │ │  Metrics   │ │ AllCharts  │ │  (Gráficos)│       │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. ESTRUTURA DE ARQUIVOS

```
Projeto Atendimento V-2/
├── BI_por_Time(2).html          # Interface principal
├── freshdesk-proxy.js           # Servidor proxy Node.js
├── package.json                 # Dependências Node.js
├── credenciais.txt              # Credenciais (NÃO commitar!)
├── DOCUMENTACAO_TECNICA.md      # Este documento
│
├── js/
│   ├── supabase-loader.js       # Inicialização Supabase
│   ├── core-data.js             # Gerenciamento de dados
│   ├── status-config.js         # Configuração de status
│   ├── ticket-status-manager.js # Gerenciador de status
│   │
│   ├── bi-analytics.js          # BI principal + modal expandido
│   ├── bi-analytics-charts.js   # Renderização de gráficos
│   ├── bi-analytics-methods.js  # Métodos auxiliares
│   ├── bi-analytics-metrics.js  # Cálculo de métricas
│   ├── bi-analytics-init.js     # Inicialização BI
│   │
│   ├── chatbot.js               # Chatbot IA
│   ├── insights-module.js       # Módulo de insights
│   ├── ai-transformers.js       # IA com Transformers.js
│   └── ...
│
├── sync-freshdesk/
│   ├── sync-tickets-v2.js       # Sincronização completa
│   └── sync-conversations.js    # Sincronização de conversas
│
├── styles/
│   └── reports-premium.css      # Estilos premium
│
└── node_modules/                # Dependências instaladas
```

---

## 8. VARIÁVEIS DE AMBIENTE

### 8.1 Para Proxy Local
```env
# Não necessário - configurado no código
FRESHDESK_DOMAIN=suportetryvia
FRESHDESK_API_KEY=s9GQtphoZqeRNz7Enl
```

### 8.2 Para Sincronização (GitHub Actions)
```env
FRESHDESK_DOMAIN=suportetryvia
FRESHDESK_API_KEY=sua_api_key_aqui
SUPABASE_URL=https://mzjdmhgkrroajmsfwryu.supabase.co
SUPABASE_SERVICE_KEY=sua_service_key_aqui
```

---

## 9. COMO EXECUTAR O SISTEMA

### 9.1 Modo Desenvolvimento (com Proxy)
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar proxy
npm start

# 3. Abrir BI_por_Time(2).html no navegador
# O sistema detectará o proxy e carregará dados em tempo real
```

### 9.2 Modo Produção (sem Proxy)
```bash
# 1. Executar sincronização (ou via GitHub Actions)
node sync-freshdesk/sync-tickets-v2.js

# 2. Abrir BI_por_Time(2).html
# O sistema carregará dados do Supabase (fallback)
```

---

## 10. GLOSSÁRIO TÉCNICO

| Termo | Descrição |
|-------|-----------|
| **CORS** | Cross-Origin Resource Sharing - Política de segurança do browser |
| **Proxy** | Servidor intermediário que faz chamadas à API |
| **Supabase** | Backend-as-a-Service com PostgreSQL |
| **Upsert** | Insert ou Update baseado na existência do registro |
| **Canvas 2D** | API nativa para renderização de gráficos |
| **Rate Limit** | Limite de requisições por minuto da API |
| **SLA** | Service Level Agreement - Tempo de resposta acordado |
| **CSAT** | Customer Satisfaction Score - Nota de satisfação |
| **Lookups** | Tabelas auxiliares para resolução de nomes |

---

## 11. TROUBLESHOOTING

### Problema: "Proxy não encontrado"
**Solução:** Executar `npm start` na pasta do projeto

### Problema: "Dados não carregam"
**Solução:** 
1. Verificar se proxy está rodando
2. Verificar console do navegador para erros
3. Verificar se Supabase está acessível

### Problema: "Rate limit atingido"
**Solução:** Aguardar alguns minutos ou aumentar delays no código

### Problema: "Gráficos em branco"
**Solução:** 
1. Verificar se há dados no período selecionado
2. Verificar console para erros de renderização

---

**Última atualização:** Janeiro 2026
**Versão:** 2.0
