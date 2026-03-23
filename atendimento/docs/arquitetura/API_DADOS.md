# 🔌 API e Estrutura de Dados

> Documentação da integração com Supabase e Freshdesk
> Última atualização: Março 2026

---

## 📊 Estrutura de Dados - Ticket

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | ID único do ticket |
| `subject` | string | Assunto do ticket |
| `description` | string | Descrição detalhada |
| `status` | number | Código do status |
| `priority` | number | Código da prioridade |
| `type` | string | Tipo do ticket |
| `created_at` | datetime | Data de criação |
| `updated_at` | datetime | Última atualização |

### Campos de SLA

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `stats_first_responded_at` | datetime | Primeira resposta |
| `stats_resolved_at` | datetime | Data de resolução |
| `fr_due_by` | datetime | Prazo 1ª resposta |
| `due_by` | datetime | Prazo resolução |
| `is_escalated` | boolean | Se foi escalado |
| `nr_escalated` | number | Vezes escalado |
| `nr_reopened` | number | Vezes reaberto |

### Campos de Relacionamento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `requester_id` | number | ID do solicitante |
| `requester_name` | string | Nome do solicitante |
| `responder_id` | number | ID do agente |
| `group_id` | number | ID do time/grupo |
| `company_id` | number | ID da empresa |

### Campos Customizados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cf_tratativa` | string | Pessoa(s) responsável(eis) |
| `cf_grupo_tratativa` | string | Time(s) responsável(eis) |
| `cf_acompanhamento_atendimento` | string | Pessoa de acompanhamento |
| `custom_fields` | object | Campos customizados JSON |

### Campos dentro de custom_fields (JSON)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cf_teste` | string | **Sistema/Produto** (SING, OPTZ, Telemetria, Light, E-Trip, YUV, Suporte, etc.) |
| `cf_empresa` | string | Nome da empresa do ticket |
| `cf_analista` | string | Analista responsável |
| `cf_tipo_primrio` | string | Tipo primário (Bug, Atendimento, etc.) |
| `cf_grupo_tryvia` | string | Grupo Tryvia (News, Quadri, etc.) |
| `cf_grupo_empresa` | string | Grupo empresarial |
| `cf_situao` | string | Situação do ticket |

> **Nota:** Os campos `cf_sistema` e `cf_produto` existem mas geralmente estão vazios. Use `custom_fields.cf_teste` para obter o Sistema/Produto.

---

## 📈 Códigos de Status

| Código | Nome | Cor | Categoria |
|--------|------|-----|-----------|
| 2 | Aberto | 🔵 `#3b82f6` | open |
| 3 | Pendente | ⏳ `#f59e0b` | pending |
| 4 | Resolvido | ✅ `#10b981` | resolved |
| 5 | Fechado | ✔️ `#6b7280` | resolved |
| 6 | Em Homologação | 🧪 `#8b5cf6` | validation |
| 7 | Aguardando Cliente | ⏸️ `#f59e0b` | waiting |
| 8 | Em Tratativa | 🔄 `#06b6d4` | in_progress |
| 10 | Em Análise | 🔍 `#06b6d4` | in_progress |
| 11 | Interno | 🏠 `#64748b` | in_progress |
| 12 | Aguardando Publicar HML | 📦 `#3b82f6` | waiting_deploy |
| 13 | Aguardando Publicar PROD | 🚀 `#8b5cf6` | waiting_deploy |
| 14 | MVP | ⭐ `#ec4899` | special |
| 15 | Validação-Atendimento | ✍️ `#f97316` | validation |
| 16 | Aguardando Parceiros | 🤝 `#a855f7` | waiting |
| 17 | Pausado | ⏸️ `#64748b` | pending |
| 18 | Validação-CS | ✍️ `#f97316` | validation |
| 19 | Levantamento de Esforço | 📊 `#6366f1` | in_progress |
| 20 | Em Fila DEV | 👨‍💻 `#ef4444` | in_progress |
| 21 | Em Produção | 🟢 `#10b981` | deployed |

### Categorias Simplificadas

| Categoria | Status IDs |
|-----------|------------|
| **Resolvido** | 4, 5 |
| **Aberto** | 2, 10 |
| **Pendente** | 3, 17 |
| **Aguardando** | 7, 16 |
| **Em Progresso** | 8, 10, 11, 19, 20 |

### Verificar Status Fechado

```javascript
// Usando o módulo centralizado
window.FRESHDESK_STATUS.isClosed(status)

// Verificação manual
[4, 5].includes(Number(status))

// Obter label/cor/descrição
FRESHDESK_STATUS.getLabel(status)
FRESHDESK_STATUS.getColor(status)
FRESHDESK_STATUS.getDesc(status)
```

---

## ⚡ Códigos de Prioridade

| Código | Nome | Cor |
|--------|------|-----|
| 1 | Baixa | `#10b981` (verde) |
| 2 | Média | `#3b82f6` (azul) |
| 3 | Alta | `#f59e0b` (amarelo) |
| 4 | Urgente | `#ef4444` (vermelho) |

---

## 🔗 Integração Supabase

### Configuração

```javascript
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

### Obter Cliente

```javascript
// Método recomendado
const client = await SupabaseLoader.getClient();

// Acesso direto (após inicialização)
const client = window.supabaseClient;
```

### Consultas Comuns

```javascript
// Buscar todos os tickets
const { data, error } = await client
    .from('Tickets')
    .select('*')
    .order('created_at', { ascending: false });

// Buscar com filtro de data
const { data, error } = await client
    .from('Tickets')
    .select('*')
    .gte('created_at', '2024-01-01')
    .lte('created_at', '2024-12-31');

// Buscar por status
const { data, error } = await client
    .from('Tickets')
    .select('*')
    .in('status', [2, 3]); // Aberto ou Pendente

// Buscar com limite e offset (paginação)
const { data, error } = await client
    .from('Tickets')
    .select('*')
    .range(0, 999); // Primeiros 1000

// Contar registros
const { count, error } = await client
    .from('Tickets')
    .select('*', { count: 'exact', head: true });
```

### Tabelas Disponíveis

| Tabela | Descrição |
|--------|-----------|
| `Tickets` | Tickets principais |
| `TicketSurveys` | Avaliações de satisfação |
| `Conversations` | Conversas dos tickets |

---

## 🔄 Freshdesk API (via Proxy)

### Configuração do Proxy

```bash
# Iniciar proxy
cd Projeto Atendimento V-2
npm start
# Roda em localhost:3003
```

### Endpoints

```javascript
// Base URL (via proxy)
const PROXY_URL = 'http://localhost:3003';

// Buscar tickets
GET /api/tickets?per_page=100&page=1

// Buscar ticket específico
GET /api/tickets/:id

// Buscar conversas
GET /api/tickets/:id/conversations
```

### Verificar Proxy

```javascript
const available = await checkProxyAvailable();
// Testa portas 3003, 3002, 3001
```

---

## 📦 Cache de Dados

### Variáveis Globais

```javascript
// Cache principal de tickets
window.allTicketsCache = [];

// Tickets filtrados para exibição
window.ticketsData = [];

// Dados processados para gráficos
window.processedData = {};
```

### Usar Cache

```javascript
// Verificar se tem dados em cache
if (window.allTicketsCache && window.allTicketsCache.length > 0) {
    // Usar cache
    filterTicketsFromCache();
} else {
    // Carregar do Supabase
    await loadTicketsFromSupabase();
}
```

---

## 🧮 Métricas Calculadas

### Estrutura de Métricas

```javascript
const metrics = {
    // Totais
    total: 1000,
    resolved: 800,
    open: 150,
    pending: 50,
    
    // Taxas
    resolutionRate: 80,      // %
    slaCompliance: 85,       // %
    
    // Tempos (em horas)
    avgFirstResponse: 2.5,
    avgResolution: 18.3,
    
    // Por dimensão
    byStatus: { 2: 150, 3: 50, 4: 700, 5: 100 },
    byPriority: { 1: 200, 2: 500, 3: 250, 4: 50 },
    byMonth: { '2024-01': 100, '2024-02': 120 },
    
    // Entidades
    entityMap: Map(), // Map<nome, dados>
};
```

### Calcular Métricas

```javascript
// Usando o BIAnalytics
const metrics = biAnalytics.calculateMetrics(tickets, 'pessoa');

// Campos retornados por entidade
{
    name: 'João',
    total: 100,
    resolved: 85,
    open: 15,
    resolutionRate: 85,
    avgResolutionTime: 12.5, // horas
    slaWithin: 80,
    slaOutside: 20,
    slaPercent: 80
}
```

---

## 🔍 Filtros

### Estrutura de Filtros

```javascript
const filters = {
    period: 'month',           // 'all' | 'week' | 'month' | 'quarter' | 'year'
    startDate: '2024-01-01',   // Para período customizado
    endDate: '2024-12-31',
    status: 'all',             // 'all' | 2 | 3 | 4 | 5
    priority: 'all',           // 'all' | 1 | 2 | 3 | 4
    team: 'all',               // 'all' | nome do time
    agent: 'all',              // 'all' | nome do agente
    system: 'all',             // 'all' | nome do sistema
};
```

### Aplicar Filtros

```javascript
// Filtro de período
function filterByPeriod(tickets, period) {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'week': startDate = new Date(now - 7*24*60*60*1000); break;
        case 'month': startDate = new Date(now - 30*24*60*60*1000); break;
        case 'quarter': startDate = new Date(now - 90*24*60*60*1000); break;
        case 'year': startDate = new Date(now - 365*24*60*60*1000); break;
        default: return tickets;
    }
    
    return tickets.filter(t => new Date(t.created_at) >= startDate);
}

// Filtro de status
function filterByStatus(tickets, status) {
    if (status === 'all') return tickets;
    return tickets.filter(t => t.status == status);
}
```

---

## 📤 Exportação

### Exportar para Excel

```javascript
// Usando SheetJS (xlsx)
function exportToExcel(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

### Exportar para JSON

```javascript
function exportToJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
}
```

---

## ⚠️ Tratamento de Erros

### Erro de Conexão

```javascript
try {
    const { data, error } = await client.from('Tickets').select('*');
    
    if (error) {
        if (error.code === 'PGRST116') {
            // Tabela vazia
            console.log('Nenhum dado encontrado');
        } else if (error.code === '42P01') {
            // Tabela não existe
            console.error('Tabela não encontrada');
        } else if (error.code === '57014') {
            // Timeout
            console.error('Timeout - tente com menos dados');
        } else {
            throw error;
        }
    }
} catch (err) {
    console.error('Erro de conexão:', err);
    showErrorToUser('Não foi possível conectar ao banco de dados');
}
```

### Erro de Dados Inválidos

```javascript
function validateTicket(ticket) {
    if (!ticket.id) return false;
    if (!ticket.created_at) return false;
    if (typeof ticket.status !== 'number') return false;
    return true;
}

// Filtrar dados inválidos
const validTickets = tickets.filter(validateTicket);
```

---

*Documentação de API - Março 2026*
