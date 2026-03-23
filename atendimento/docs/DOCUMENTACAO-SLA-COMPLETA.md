# 📊 Documentação Completa - Sistema de SLA

> **Versão:** 1.0  
> **Data:** 18/03/2026  
> **Autor:** Documentação Técnica  

---

## 📑 Índice

1. [Introdução ao SLA](#1-introdução-ao-sla)
2. [Como o Freshdesk Calcula o SLA](#2-como-o-freshdesk-calcula-o-sla)
3. [Políticas de SLA Configuradas](#3-políticas-de-sla-configuradas)
4. [Campos de SLA no Banco de Dados](#4-campos-de-sla-no-banco-de-dados)
5. [Como o Sistema BI Processa o SLA](#5-como-o-sistema-bi-processa-o-sla)
6. [Matriz de SLA - Explicação Detalhada](#6-matriz-de-sla---explicação-detalhada)
7. [Fórmulas e Cálculos](#7-fórmulas-e-cálculos)
8. [Verificação e Validação dos Dados](#8-verificação-e-validação-dos-dados)
9. [Interpretação das Cores](#9-interpretação-das-cores)
10. [FAQ - Perguntas Frequentes](#10-faq---perguntas-frequentes)
11. [Glossário de Termos](#11-glossário-de-termos)
12. [Arquivos do Sistema](#12-arquivos-do-sistema)

---

## 1. Introdução ao SLA

### O que é SLA?

**SLA (Service Level Agreement)** ou **Acordo de Nível de Serviço** é um compromisso documentado entre o provedor de serviço e o cliente que define os padrões de qualidade esperados, incluindo tempos de resposta e resolução de tickets.

### Por que o SLA é importante?

| Benefício | Descrição |
|-----------|-----------|
| **Expectativas claras** | Cliente sabe quanto tempo esperar |
| **Medição de qualidade** | Permite avaliar performance da equipe |
| **Priorização** | Ajuda a definir o que resolver primeiro |
| **Contratos** | Base para acordos comerciais |
| **Melhoria contínua** | Identifica gargalos e oportunidades |

### Tipos de SLA no Freshdesk

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TIPOS DE SLA                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1️⃣ SLA DE PRIMEIRA RESPOSTA (First Response)                       │
│     └── Tempo máximo para enviar a primeira resposta ao cliente     │
│     └── Campo: fr_due_by (prazo), fr_escalated (violou?)            │
│                                                                      │
│  2️⃣ SLA DE RESOLUÇÃO (Resolution)                                   │
│     └── Tempo máximo para resolver completamente o ticket           │
│     └── Campo: due_by (prazo), is_escalated (violou?)               │
│                                                                      │
│  3️⃣ SLA DE CADA RESPOSTA (Every Response) - Opcional                │
│     └── Tempo máximo para cada resposta subsequente                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Como o Freshdesk Calcula o SLA

### Fluxo de Cálculo Automático

Quando um ticket é criado, o Freshdesk executa automaticamente o seguinte processo:

```
    TICKET CRIADO
         │
         ▼
┌─────────────────────────────────────┐
│  1. IDENTIFICAR POLÍTICA DE SLA     │
│     ├── Verifica condições:         │
│     │   • Tipo do ticket            │
│     │   • Grupo                     │
│     │   • Produto                   │
│     │   • Prioridade                │
│     │   • Origem                    │
│     │   • Empresa/Cliente           │
│     │                               │
│     └── Seleciona política que      │
│         melhor se encaixa           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. CALCULAR PRAZOS                 │
│     ├── Pega tempo da política      │
│     │   baseado na PRIORIDADE       │
│     │                               │
│     ├── fr_due_by = created_at      │
│     │   + tempo_primeira_resposta   │
│     │                               │
│     └── due_by = created_at         │
│         + tempo_resolução           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. APLICAR HORÁRIO COMERCIAL       │
│     (se configurado)                │
│     ├── Pausa fins de semana        │
│     ├── Pausa feriados              │
│     └── Considera apenas horário    │
│         de funcionamento            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. MONITORAR CONTINUAMENTE         │
│     ├── Se NOW > fr_due_by          │
│     │   e não respondeu:            │
│     │   → fr_escalated = true       │
│     │                               │
│     └── Se NOW > due_by             │
│         e não resolveu:             │
│         → is_escalated = true       │
└─────────────────────────────────────┘
```

### Horário de Funcionamento

O Freshdesk pode calcular SLA de duas formas:

| Modo | Descrição | Exemplo |
|------|-----------|---------|
| **Business Hours** | Conta apenas horário comercial | Seg-Sex 9h-18h (9h/dia) |
| **Calendar Hours** | Conta 24h por dia, 7 dias | 24x7 |

**Exemplo prático com Business Hours:**
```
Ticket criado: Sexta 17h
SLA: 4 horas (business hours)
Horário comercial: 9h-18h

Cálculo:
- Sexta 17h-18h = 1 hora
- Sábado/Domingo = não conta
- Segunda 9h-12h = 3 horas
- Total = 4 horas

due_by = Segunda 12h (não Sexta 21h!)
```

---

## 3. Políticas de SLA Configuradas

### Política 1: Padrão SLA (Default)

Esta política se aplica a **todos os tickets** que não se encaixam em políticas específicas.

| Prioridade | Cor | Tempo 1ª Resposta | Tempo Resolução | Horário |
|------------|-----|-------------------|-----------------|---------|
| 🔴 **Urgente** | Vermelho | 1 hora | 24 horas | Comercial |
| 🟠 **Alta** | Laranja | 2 horas | 72 horas (3 dias) | Comercial |
| 🔵 **Média** | Azul | 3 horas | 96 horas (4 dias) | Comercial |
| 🟢 **Baixa** | Verde | 6 horas | 168 horas (7 dias) | Comercial |

#### Exemplos Práticos - Padrão SLA

```
╔════════════════════════════════════════════════════════════════════╗
║  EXEMPLO 1: Ticket Urgente                                          ║
╠════════════════════════════════════════════════════════════════════╣
║  Criado: Segunda 10:00                                              ║
║  Prioridade: Urgente                                                ║
║                                                                      ║
║  Prazos calculados:                                                  ║
║  • 1ª Resposta: Segunda 11:00 (1h depois)                           ║
║  • Resolução: Terça 10:00 (24h depois, em horário comercial)        ║
║                                                                      ║
║  Se não resolver até Terça 10:00 → is_escalated = true              ║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║  EXEMPLO 2: Ticket Baixa Prioridade                                 ║
╠════════════════════════════════════════════════════════════════════╣
║  Criado: Segunda 10:00                                              ║
║  Prioridade: Baixa                                                  ║
║                                                                      ║
║  Prazos calculados:                                                  ║
║  • 1ª Resposta: Segunda 16:00 (6h depois)                           ║
║  • Resolução: Próxima Segunda 10:00 (168h = 7 dias úteis)           ║
║                                                                      ║
║  Tem uma semana inteira para resolver!                              ║
╚════════════════════════════════════════════════════════════════════╝
```

### Política 2: MVP

Esta política se aplica **apenas** quando o **Tipo do ticket = "MVP"**.

| Prioridade | Tempo 1ª Resposta | Tempo Resolução | Horário |
|------------|-------------------|-----------------|---------|
| 🔴 **Urgente** | 365 dias | 365 dias | Comercial |
| 🟠 **Alta** | 365 dias | 365 dias | Comercial |
| 🔵 **Média** | 365 dias | 365 dias | Comercial |
| 🟢 **Baixa** | 45 dias | 45 dias | Comercial |

> ⚠️ **Nota:** A política MVP tem prazos muito longos (365 dias = 1 ano) porque tickets do tipo MVP geralmente são projetos de longo prazo que não seguem os SLAs tradicionais de suporte.

#### Por que MVP tem prazos tão longos?

```
┌─────────────────────────────────────────────────────────────────────┐
│  TICKETS TIPO MVP                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MVPs (Minimum Viable Products) são projetos especiais:             │
│                                                                      │
│  • Desenvolvimento de novas funcionalidades                         │
│  • Projetos de longo prazo                                          │
│  • Não são "suporte" tradicional                                    │
│  • Têm cronograma próprio do projeto                                │
│                                                                      │
│  Por isso, o SLA é configurado para 365 dias - basicamente          │
│  desabilitando o controle de SLA para esses tickets.                │
│                                                                      │
│  ✅ Isso significa que tickets MVP quase NUNCA vão violar SLA       │
│     (teriam que ficar abertos por mais de 1 ano!)                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Campos de SLA no Banco de Dados

### Tabela: tickets

Os seguintes campos são sincronizados do Freshdesk para o Supabase:

| Campo | Tipo | Descrição | Preenchido por |
|-------|------|-----------|----------------|
| `is_escalated` | boolean | SLA de **resolução** foi violado? | Freshdesk (automático) |
| `fr_escalated` | boolean | SLA de **1ª resposta** foi violado? | Freshdesk (automático) |
| `due_by` | timestamp | Prazo para **resolução** | Freshdesk (calculado) |
| `fr_due_by` | timestamp | Prazo para **1ª resposta** | Freshdesk (calculado) |
| `priority` | integer | Prioridade (1=Baixa, 2=Média, 3=Alta, 4=Urgente) | Freshdesk |
| `created_at` | timestamp | Data de criação do ticket | Freshdesk |
| `stats_first_responded_at` | timestamp | Data/hora da 1ª resposta | Freshdesk |
| `stats_resolved_at` | timestamp | Data/hora da resolução | Freshdesk |

### Significado dos Campos Booleanos

```
┌─────────────────────────────────────────────────────────────────────┐
│  is_escalated (SLA de Resolução)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  true  = O ticket NÃO foi resolvido dentro do prazo (due_by)        │
│          → SLA VIOLADO ❌                                            │
│                                                                      │
│  false = O ticket FOI resolvido dentro do prazo                     │
│          OU ainda está dentro do prazo                              │
│          → DENTRO DO SLA ✅                                          │
│                                                                      │
│  null  = O ticket não tem política de SLA aplicada                  │
│          (tratado como false no sistema)                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  fr_escalated (SLA de 1ª Resposta)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  true  = A primeira resposta NÃO foi enviada dentro do prazo        │
│          → SLA 1ª RESPOSTA VIOLADO ❌                                │
│                                                                      │
│  false = A primeira resposta FOI enviada dentro do prazo            │
│          OU ainda está dentro do prazo                              │
│          → DENTRO DO SLA ✅                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Consulta SQL de Exemplo

```sql
-- Buscar tickets DEV com SLA violado em Janeiro/2025
SELECT 
    id,
    subject,
    priority,
    is_escalated,
    fr_escalated,
    due_by,
    created_at,
    stats_resolved_at
FROM tickets
WHERE cf_grupo_tratativa = 'DEV'
  AND created_at >= '2025-01-01'
  AND created_at < '2025-02-01'
  AND is_escalated = true
ORDER BY created_at DESC;
```

---

## 5. Como o Sistema BI Processa o SLA

### Fluxo de Dados Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRESHDESK                                                           │
│  ├── Recebe ticket                                                   │
│  ├── Aplica política de SLA                                         │
│  ├── Calcula due_by e fr_due_by                                     │
│  └── Marca is_escalated/fr_escalated quando viola                   │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ Sincronização (sync-freshdesk)
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE (Banco de Dados)                                           │
│  ├── Tabela: tickets                                                 │
│  ├── Campos: is_escalated, fr_escalated, due_by, fr_due_by, etc.    │
│  └── Dados sincronizados do Freshdesk                               │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ API REST
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BI_por_Time(2).html                                                 │
│  ├── Função: loadTicketsFromSupabase()                              │
│  ├── Carrega campos: id, created_at, is_escalated, fr_escalated...  │
│  └── Armazena em: window.allTicketsCache                            │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ Array de tickets
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  js/bi-productivity-matrix.js                                        │
│  ├── Função: calculateSLAMatrix(tickets, year)                      │
│  ├── Agrupa por: cf_grupo_tratativa (grupo) e mês                   │
│  ├── Conta: is_escalated === true → violated++                      │
│  │          is_escalated !== true → within++                        │
│  └── Calcula: %SLA = (within / total) × 100                         │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ Dados calculados
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  RENDERIZAÇÃO (Matriz de SLA)                                        │
│  ├── Função: renderSLATable(data)                                   │
│  ├── Exibe tabela com:                                              │
│  │   • Linha GRUPO (total de tickets)                               │
│  │   • Linha SLA Violated (vermelho)                                │
│  │   • Linha Within SLA (verde)                                     │
│  │   • Linha %SLA (com cores gradientes)                            │
│  └── Coluna ACUMULADO (soma do ano)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Código-Fonte Relevante

#### 1. Carregamento dos Dados (BI_por_Time(2).html)

```javascript
// Linha ~7017-7033
const ESSENTIAL_FIELDS = [
    'id', 'subject', 'status', 'priority', 'type', 'source',
    'created_at', 'updated_at', 'due_by', 'fr_due_by',
    'responder_id', 'responder_name', 'group_id', 'group_name',
    'company_id', 'company_name', 'requester_id', 'requester_name',
    'cf_tratativa', 'cf_grupo_tratativa', 'cf_sistema', 'cf_produto',
    // ... outros campos ...
    'stats_resolved_at', 'stats_closed_at', 'stats_first_responded_at',
    // Campos de SLA - ESSENCIAIS!
    'is_escalated', 'fr_escalated'  // ← Estes campos são usados para o cálculo
].join(',');
```

#### 2. Cálculo da Matriz (js/bi-productivity-matrix.js)

```javascript
// Função calculateSLAMatrix - linhas ~576-625
calculateSLAMatrix(tickets, year) {
    const groups = {};
    
    tickets.forEach(ticket => {
        if (!ticket.created_at) return;
        
        const createdDate = new Date(ticket.created_at);
        const ticketYear = createdDate.getFullYear();
        const ticketMonth = `${ticketYear}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (ticketYear !== year) return;
        
        // Identificar o grupo
        const group = ticket.cf_grupo_tratativa || ticket.group_name || 'Sem Grupo';
        
        // Inicializar estrutura do grupo se não existir
        if (!groups[group]) {
            groups[group] = {
                months: {},
                accumulated: { violated: 0, within: 0, total: 0 }
            };
        }
        
        // Verificar SLA - ESTA É A LÓGICA PRINCIPAL!
        // is_escalated é o campo do Freshdesk que indica violação de SLA
        const slaViolated = ticket.is_escalated === true;
        
        // Contar no mês
        if (slaViolated) {
            groups[group].months[ticketMonth].violated++;
            groups[group].accumulated.violated++;
        } else {
            groups[group].months[ticketMonth].within++;
            groups[group].accumulated.within++;
        }
        
        groups[group].months[ticketMonth].total++;
        groups[group].accumulated.total++;
    });
    
    return groups;
}
```

---

## 6. Matriz de SLA - Explicação Detalhada

### Estrutura Visual

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 Matriz de SLA 2025                                                           │
│  Análise de SLA por Grupo - DEV                                                  │
├─────────┬───────┬───────┬───────┬───────┬───────┬─────────────┬─────────────────┤
│  SLA    │JAN/25 │FEV/25 │MAR/25 │ ...   │DEZ/25 │  ACUMULADO  │                 │
│  GRUPO  │       │       │       │       │       │             │                 │
├─────────┼───────┼───────┼───────┼───────┼───────┼─────────────┤                 │
│  DEV    │  153  │  154  │  118  │  ...  │   65  │    1793     │ Total tickets   │
├─────────┼───────┼───────┼───────┼───────┼───────┼─────────────┤                 │
│SLA      │   41  │   31  │   17  │  ...  │   38  │     463     │ Violaram SLA    │
│Violated │       │       │       │       │       │             │ (vermelho)      │
├─────────┼───────┼───────┼───────┼───────┼───────┼─────────────┤                 │
│Within   │  112  │  123  │  101  │  ...  │   27  │    1330     │ Dentro do SLA   │
│SLA      │       │       │       │       │       │             │ (verde)         │
├─────────┼───────┼───────┼───────┼───────┼───────┼─────────────┤                 │
│  %SLA   │73.20% │79.87% │85.59% │  ...  │41.54% │   74.18%    │ Percentual      │
│         │       │       │       │       │       │             │ (gradiente)     │
└─────────┴───────┴───────┴───────┴───────┴───────┴─────────────┴─────────────────┘
```

### Explicação de Cada Linha

| Linha | Descrição | Cálculo |
|-------|-----------|---------|
| **GRUPO** | Total de tickets criados no mês | `COUNT(*)` |
| **SLA Violated** | Tickets onde `is_escalated = true` | `COUNT(*) WHERE is_escalated = true` |
| **Within SLA** | Tickets onde `is_escalated ≠ true` | `Total - Violated` |
| **%SLA** | Percentual de tickets dentro do SLA | `(Within / Total) × 100` |

### Coluna ACUMULADO

A coluna **ACUMULADO** mostra a soma de todos os meses do ano:

```
ACUMULADO = Σ (todos os meses do ano)

Exemplo DEV 2025:
- Total: 153 + 154 + 118 + ... + 65 = 1793
- Violated: 41 + 31 + 17 + ... + 38 = 463
- Within: 112 + 123 + 101 + ... + 27 = 1330
- %SLA: 1330 / 1793 × 100 = 74.18%
```

---

## 7. Fórmulas e Cálculos

### Fórmula Principal do %SLA

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   %SLA = (Tickets Dentro do SLA / Total de Tickets) × 100           ║
║                                                                      ║
║   Ou seja:                                                           ║
║                                                                      ║
║   %SLA = (Within / Total) × 100                                      ║
║                                                                      ║
║   Onde:                                                              ║
║   • Within = tickets com is_escalated = false (ou null)             ║
║   • Total = todos os tickets do período                              ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════╝
```

### Exemplos de Cálculo

#### Exemplo 1: Janeiro/2025 - DEV

```
Dados do banco:
- Total de tickets DEV em Jan/25: 153
- Tickets com is_escalated = true: 41
- Tickets com is_escalated = false: 112

Cálculo:
%SLA = (112 / 153) × 100
%SLA = 0.7320 × 100
%SLA = 73.20%

Interpretação: 73.20% dos tickets foram resolvidos dentro do prazo
```

#### Exemplo 2: Acumulado 2025 - DEV

```
Dados do banco:
- Total de tickets DEV em 2025: 1793
- Tickets com is_escalated = true: 463
- Tickets com is_escalated = false: 1330

Cálculo:
%SLA = (1330 / 1793) × 100
%SLA = 0.7418 × 100
%SLA = 74.18%

Interpretação: 74.18% dos tickets do ano foram resolvidos dentro do prazo
```

### Código JavaScript do Cálculo

```javascript
// Para cada grupo, calcular o percentual de SLA
const total = group.accumulated.total;
const within = group.accumulated.within;
const violated = group.accumulated.violated;

const percentSLA = total > 0 
    ? ((within / total) * 100).toFixed(2) 
    : 0;

// Exemplo:
// total = 1793
// within = 1330
// violated = 463
// percentSLA = (1330 / 1793) * 100 = 74.18%
```

---

## 8. Verificação e Validação dos Dados

### Script de Verificação

Um script foi criado para verificar se os dados da matriz correspondem ao banco de dados:

**Arquivo:** `scripts/check-sla-fields.js`

```javascript
// Consulta ao Supabase para cada mês
const urlTotal = `${SUPABASE_URL}/rest/v1/tickets?select=id
    &cf_grupo_tratativa=eq.DEV
    &created_at=gte.${inicioMes}
    &created_at=lt.${fimMes}`;

const urlViolado = `${SUPABASE_URL}/rest/v1/tickets?select=id
    &cf_grupo_tratativa=eq.DEV
    &is_escalated=eq.true
    &created_at=gte.${inicioMes}
    &created_at=lt.${fimMes}`;
```

### Resultado da Verificação (18/03/2026)

```
╔════════════════════════════════════════════════════════════════════╗
║  VERIFICAÇÃO DE SLA - GRUPO DEV - ANO 2025                          ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ✅ JAN/25: BANCO Total=153, Violated=41  | MATRIZ Total=153, V=41  ║
║  ✅ FEV/25: BANCO Total=154, Violated=31  | MATRIZ Total=154, V=31  ║
║  ✅ MAR/25: BANCO Total=118, Violated=17  | MATRIZ Total=118, V=17  ║
║  ✅ ABR/25: BANCO Total=139, Violated=43  | MATRIZ Total=139, V=43  ║
║  ✅ MAI/25: BANCO Total=262, Violated=45  | MATRIZ Total=262, V=45  ║
║  ✅ JUN/25: BANCO Total=161, Violated=45  | MATRIZ Total=161, V=45  ║
║  ✅ JUL/25: BANCO Total=170, Violated=29  | MATRIZ Total=170, V=29  ║
║  ✅ AGO/25: BANCO Total=144, Violated=47  | MATRIZ Total=144, V=47  ║
║  ✅ SET/25: BANCO Total=149, Violated=59  | MATRIZ Total=149, V=59  ║
║  ✅ OUT/25: BANCO Total=157, Violated=35  | MATRIZ Total=157, V=35  ║
║  ✅ NOV/25: BANCO Total=121, Violated=33  | MATRIZ Total=121, V=33  ║
║  ✅ DEZ/25: BANCO Total=65,  Violated=38  | MATRIZ Total=65,  V=38  ║
║                                                                      ║
║  ════════════════════════════════════════════════════════════════   ║
║  ACUMULADO:                                                          ║
║  BANCO:  Total=1793, Violated=463, Within=1330, %SLA=74.18%         ║
║  MATRIZ: Total=1793, Violated=463, Within=1330, %SLA=74.18%         ║
║                                                                      ║
║  ✅ TODOS OS VALORES CONFEREM!                                       ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 9. Interpretação das Cores

### Escala de Cores do %SLA

O sistema usa uma escala de cores gradiente para facilitar a interpretação visual:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ESCALA DE CORES DO %SLA                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ██████████  ≥ 85%    EXCELENTE                                     │
│  (Verde)              SLA bem controlado, equipe performando bem    │
│                                                                      │
│  ██████████  70-84%   BOM                                           │
│  (Lima)               Aceitável, mas há espaço para melhorar        │
│                                                                      │
│  ██████████  50-69%   ATENÇÃO                                       │
│  (Amarelo)            Muitas violações, investigar causas           │
│                                                                      │
│  ██████████  30-49%   PREOCUPANTE                                   │
│  (Laranja)            Metade ou mais está violando SLA              │
│                                                                      │
│  ██████████  < 30%    CRÍTICO                                       │
│  (Vermelho)           Ação urgente necessária!                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Cores das Linhas

| Linha | Cor | Código Hex |
|-------|-----|------------|
| **SLA Violated** | Vermelho claro | `#ef444420` (fundo) |
| **Within SLA** | Verde claro | `#10b98120` (fundo) |
| **%SLA** | Gradiente | Baseado no valor |

### Código das Cores

```javascript
// Em bi-productivity-matrix.js - renderSLATable()
function getSLAColor(percent) {
    if (percent >= 85) return '#10b981';  // Verde - Excelente
    if (percent >= 70) return '#84cc16';  // Lima - Bom
    if (percent >= 50) return '#f59e0b';  // Amarelo - Atenção
    if (percent >= 30) return '#fb923c';  // Laranja - Preocupante
    return '#ef4444';                      // Vermelho - Crítico
}
```

---

## 10. FAQ - Perguntas Frequentes

### ❓ Por que o SLA mostra 100% para alguns grupos?

**Possíveis causas:**
1. O grupo usa política MVP (365 dias de prazo)
2. Os tickets são novos e ainda não venceram
3. O grupo realmente está cumprindo todos os SLAs

### ❓ Como sei se um ticket específico violou o SLA?

Verifique o campo `is_escalated` no banco de dados:
```sql
SELECT id, is_escalated, due_by, stats_resolved_at 
FROM tickets 
WHERE id = [ID_DO_TICKET];
```
- `is_escalated = true` → Violou o SLA
- `is_escalated = false` → Dentro do SLA

### ❓ O sistema calcula o tempo de SLA?

**Não!** O sistema apenas **lê** o campo `is_escalated` que o **Freshdesk já calculou automaticamente**. O tempo de SLA é definido nas políticas do Freshdesk.

### ❓ Posso alterar os tempos de SLA pelo sistema BI?

**Não.** As políticas de SLA são configuradas diretamente no **Freshdesk Admin**:
1. Acesse Admin > Workflows > SLA Policies
2. Crie ou edite políticas
3. Defina tempos por prioridade

### ❓ Por que tickets MVP têm SLA de 365 dias?

Tickets do tipo MVP são projetos especiais de longo prazo, não são suporte tradicional. O prazo de 365 dias basicamente desabilita o controle de SLA para esses tickets.

### ❓ O que acontece se um ticket mudar de prioridade?

O Freshdesk recalcula automaticamente os prazos (`due_by` e `fr_due_by`) baseado na nova prioridade.

### ❓ O SLA considera fins de semana?

Depende da configuração da política:
- **Business Hours**: Não conta fins de semana
- **Calendar Hours (24x7)**: Conta todos os dias

Nas políticas configuradas, ambas usam **Horário Comercial**.

### ❓ Como posso ver o prazo exato de um ticket?

O campo `due_by` contém a data/hora exata do prazo de resolução:
```sql
SELECT id, subject, due_by, created_at 
FROM tickets 
WHERE id = [ID_DO_TICKET];
```

---

## 11. Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **SLA** | Service Level Agreement - Acordo de Nível de Serviço |
| **is_escalated** | Campo booleano que indica se o SLA de resolução foi violado |
| **fr_escalated** | Campo booleano que indica se o SLA de 1ª resposta foi violado |
| **due_by** | Data/hora limite para resolução do ticket |
| **fr_due_by** | Data/hora limite para primeira resposta |
| **Violated** | Ticket que não foi resolvido dentro do prazo (SLA violado) |
| **Within SLA** | Ticket resolvido dentro do prazo |
| **%SLA** | Percentual de tickets dentro do SLA |
| **Business Hours** | Horário comercial (ex: seg-sex 9h-18h) |
| **Calendar Hours** | 24 horas por dia, 7 dias por semana |
| **Escalation** | Processo de notificação quando SLA é violado |
| **First Response** | Primeira resposta ao cliente após abertura do ticket |
| **Resolution Time** | Tempo total para resolver o ticket |
| **Priority** | Prioridade do ticket (Urgente, Alta, Média, Baixa) |
| **cf_grupo_tratativa** | Campo customizado que indica o grupo responsável pelo ticket |

---

## 12. Arquivos do Sistema

### Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `BI_por_Time(2).html` | Página principal do BI, carrega dados do Supabase |
| `js/bi-productivity-matrix.js` | Cálculo e renderização da Matriz de SLA |
| `js/supabase-chunked-loader.js` | Carregamento otimizado de dados do Supabase |
| `js/glossary-data.js` | Dados do glossário com explicações de métricas |
| `scripts/check-sla-fields.js` | Script de verificação de dados de SLA |

### Funções Relevantes

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `loadTicketsFromSupabase()` | BI_por_Time(2).html | Carrega tickets do banco |
| `calculateSLAMatrix()` | bi-productivity-matrix.js | Calcula estatísticas de SLA |
| `renderSLATable()` | bi-productivity-matrix.js | Renderiza a tabela de SLA |
| `getSLAColor()` | bi-productivity-matrix.js | Retorna cor baseada no %SLA |

### Campos Carregados do Banco

```javascript
// ESSENTIAL_FIELDS em BI_por_Time(2).html
[
    'id', 'subject', 'status', 'priority', 'type', 'source',
    'created_at', 'updated_at', 'due_by', 'fr_due_by',
    'responder_id', 'responder_name', 'group_id', 'group_name',
    'company_id', 'company_name', 'requester_id', 'requester_name',
    'cf_tratativa', 'cf_grupo_tratativa', 'cf_sistema', 'cf_produto',
    'cf_tipo_primario', 'cf_prioridade_dev', 'cf_situacao',
    'cf_acompanhamento_atendimento', 'cf_acompanhamento_implantacao', 
    'cf_acompanhamento_produto', 'custom_fields', 'tags',
    'stats_resolved_at', 'stats_closed_at', 'stats_first_responded_at',
    'stats_reopened_at', 'stats_pending_since', 'stats_status_updated_at',
    'stats_agent_responded_at', 'stats_requester_responded_at',
    'is_escalated', 'fr_escalated'  // ← Campos de SLA
]
```

---

## 📝 Histórico de Alterações

| Data | Versão | Alteração |
|------|--------|-----------|
| 18/03/2026 | 1.0 | Documentação inicial criada |

---

## 📞 Suporte

Em caso de dúvidas sobre o funcionamento do SLA:

1. Verifique esta documentação
2. Consulte o glossário no sistema (ícone ❓)
3. Execute o script de verificação (`scripts/check-sla-fields.js`)
4. Para alterações nas políticas de SLA, acesse o Freshdesk Admin

---

> **Nota:** Esta documentação reflete o estado do sistema em 18/03/2026. Políticas de SLA podem ser alteradas no Freshdesk a qualquer momento pelo administrador.
