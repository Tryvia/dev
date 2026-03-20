# 📘 MANUAL COMPLETO: SYNC-SMART E INTEGRITY-CHECK

Este documento detalha o funcionamento completo dos scripts de sincronização unificados.

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [sync-smart.js](#sync-smartjs)
3. [integrity-check.js](#integrity-checkjs)
4. [Modos de Uso](#modos-de-uso)
5. [Flags e Opções](#flags-e-opções)
6. [Configuração](#configuração)
7. [Limitações](#limitações)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 VISÃO GERAL

### Arquitetura de Sync

```
┌─────────────────────────────────────────────────────────────┐
│                      FRESHDESK API                          │
│         https://suportetryvia.freshdesk.com/api/v2          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     SYNC-SMART.JS                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  MODE: FULL │  │ MODE: QUICK │  │MODE: VERIFY │         │
│  │  ~15 min    │  │   ~30 seg   │  │   ~10 seg   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FIELD-VALIDATOR (opcional)                          │   │
│  │  Valida campos obrigatórios antes do upsert          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                              │
│          https://ifzypptlhpzuydjeympr.supabase.co           │
│                                                             │
│  tickets | conversations | agents | groups | companies      │
│  satisfaction_ratings | surveys | time_entries              │
└─────────────────────────────────────────────────────────────┘
```

### Scripts Principais

| Script | Função | Frequência Recomendada |
|--------|--------|------------------------|
| `sync-smart.js` | Sincronização unificada | A cada 3h (quick) |
| `integrity-check.js` | Verificação de integridade | Diária |

---

## ⚡ SYNC-SMART.JS

### Descrição

Script unificado que substitui todos os scripts de sync antigos. Combina sincronização de tickets, conversas, metadata e CSAT em um único arquivo com diferentes modos de operação.

### Localização

```
sync-freshdesk/sync-smart.js
```

### Variáveis de Ambiente Necessárias

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `FRESHDESK_DOMAIN` | Domínio do Freshdesk (ex: `suportetryvia`) | Sim |
| `FRESHDESK_API_KEY` | API Key do Freshdesk | Sim |
| `SUPABASE_URL` | URL do projeto Supabase | Sim |
| `SUPABASE_SERVICE_KEY` | Service Key do Supabase | Sim |

### Modos de Operação

#### 1. QUICK (Padrão)

```bash
node sync-smart.js quick
```

**O que faz:**
- Busca tickets atualizados nas últimas 48 horas
- Verifica integridade contra o banco
- Sincroniza tickets recentes
- Corrige tickets faltantes (até 50)
- Corrige tags desatualizadas

**Duração:** ~30 segundos a 2 minutos

**Quando usar:** Execução agendada regular (a cada 3h)

---

#### 2. FULL

```bash
node sync-smart.js full
```

**O que faz:**
- Busca TODOS os tickets do Freshdesk
- Sincroniza TODOS os tickets
- Busca conversas de tickets sem conversas (até 500)
- Sincroniza metadata (agents, groups, companies)
- Sincroniza CSAT dos últimos 90 dias

**Duração:** ~10 a 20 minutos

**Quando usar:**
- Primeira execução
- Após longo período offline
- Mensalmente para garantir consistência total

---

#### 3. VERIFY

```bash
node sync-smart.js verify
```

**O que faz:**
- Busca tickets da última semana
- Compara com dados no Supabase
- Lista inconsistências encontradas
- **NÃO MODIFICA DADOS**

**Duração:** ~10 segundos

**Quando usar:**
- Diagnóstico de problemas
- Verificação após sync
- Debug

---

### Flags e Opções

| Flag | Descrição |
|------|-----------|
| `--no-validate` | Desabilita validação de campos |
| `--send-logs` | Força envio de logs para GitHub/Supabase |

**Exemplos:**

```bash
# Sync rápido sem validação (mais rápido)
node sync-smart.js quick --no-validate

# Sync completo com envio de logs
node sync-smart.js full --send-logs

# Sync completo sem validação e sem logs
node sync-smart.js full --no-validate
```

---

### Proteções Implementadas

1. **Nunca deleta dados** - Apenas adiciona ou atualiza
2. **Detecta tickets faltantes** - Compara IDs Freshdesk x Supabase
3. **Detecta tags desatualizadas** - Problema específico corrigido
4. **Retry automático** - Tentativas em caso de erro 429 (rate limit)
5. **Batching** - Envia em lotes de 500 para evitar timeout

---

## 🔍 INTEGRITY-CHECK.JS

### Descrição

Script de verificação de integridade que detecta problemas no banco de dados. Projetado para rodar diariamente e alertar sobre inconsistências.

### Localização

```
sync-freshdesk/integrity-check.js
```

### O que Verifica

| Verificação | Descrição |
|-------------|-----------|
| Tickets faltantes | IDs que existem no Freshdesk mas não no Supabase |
| Tickets desatualizados | `updated_at` diferente entre sistemas |
| Tags diferentes | Tags do Freshdesk ≠ Tags do Supabase |
| Tickets sem subject | Dados incompletos |
| Tickets sem conversas | Tickets abertos sem interações |

### Saída

```
╔════════════════════════════════════════════════════════════╗
║          RELATÓRIO DE INTEGRIDADE DO BANCO                 ║
╠════════════════════════════════════════════════════════════╣
║ Data: 2026-02-26T10:47:00.000Z                             ║
║ Freshdesk: suportetryvia                                   ║
╚════════════════════════════════════════════════════════════╝

📊 ESTATÍSTICAS GERAIS
   Freshdesk (última semana): 150 tickets
   Supabase (total): 5000 tickets
   Tickets com conversas: 4500

🔎 VERIFICAÇÃO DE INTEGRIDADE
   ✅ Nenhum ticket faltando
   ⚠️ 3 tickets com tags diferentes
   ✅ Todos os tickets têm subject

📋 RESUMO
   Status: OK
   Ação recomendada: Nenhuma
```

### Integração com GitHub Actions

O workflow `integrity-check.yml` executa diariamente às 06:00 UTC:
- Se encontrar problemas críticos → dispara `sync-smart.js quick`
- Se encontrar problemas menores → apenas loga

---

## ⚙️ CONFIGURAÇÃO

### 1. Variáveis de Ambiente Locais

Crie um arquivo `.env` na raiz:

```env
FRESHDESK_DOMAIN=suportetryvia
FRESHDESK_API_KEY=sua_api_key_aqui
SUPABASE_URL=https://ifzypptlhpzuydjeympr.supabase.co
SUPABASE_SERVICE_KEY=sua_service_key_aqui
```

### 2. GitHub Secrets

Configure em **Settings → Secrets → Actions**:

| Secret | Valor |
|--------|-------|
| `FRESHDESK_DOMAIN` | `suportetryvia` |
| `FRESHDESK_API_KEY` | API Key |
| `SUPABASE_URL` | URL do Supabase |
| `SUPABASE_SERVICE_KEY` | Service Key |

### 3. Validação de Campos (Opcional)

Edite `sync-freshdesk/logs-config.js`:

```javascript
// Enviar logs para GitHub Issues
SEND_TO_GITHUB: true,
GITHUB_REPOS: 'supabasedas/atendimento',
GITHUB_TOKEN: 'ghp_xxx',

// Enviar logs para Supabase
SEND_TO_SUPABASE: true,
```

---

## ⚠️ LIMITAÇÕES

### Rate Limiting

O Freshdesk tem limite de **50 requisições por minuto**. O script implementa:
- Sleep de 250ms entre requisições
- Retry automático quando recebe 429
- Respeito ao header `Retry-After`

### Volume de Dados

| Operação | Limite |
|----------|--------|
| Tickets faltantes (quick) | 50 por execução |
| Conversas (full) | 500 tickets por execução |
| Batch size | 500 registros por upsert |

### Campos Não Sincronizados

- Attachments (apenas referências)
- Private notes (apenas `private: true/false`)
- Email CC/BCC
- Forward emails

---

## 🔧 TROUBLESHOOTING

### Erro: "401 Unauthorized"

**Causa:** API Key inválida ou expirada

**Solução:**
1. Verifique a API Key no Freshdesk
2. Gere nova key se necessário
3. Atualize a variável de ambiente

---

### Erro: "429 Too Many Requests"

**Causa:** Rate limit excedido

**Solução:**
1. O script já trata automaticamente
2. Se persistir, aumente o sleep entre requisições
3. Execute em horário com menos uso

---

### Erro: "Tickets faltando no Supabase"

**Causa:** Sync não executou ou falhou

**Solução:**
1. Execute `node sync-smart.js full`
2. Verifique logs de erros
3. Confirme variáveis de ambiente

---

### Tags não atualizando

**Causa:** Problema específico corrigido no sync-smart

**Solução:**
1. Execute `node sync-smart.js quick`
2. O script detecta e corrige automaticamente

---

## 📅 CRONOGRAMA RECOMENDADO

| Horário (UTC) | Script | Modo |
|---------------|--------|------|
| 00:00, 06:00, 12:00, 18:00 | sync-smart.js | quick |
| 03:00 | integrity-check.js | - |
| Domingo 02:00 | sync-smart.js | full |

---

## 📁 ARQUIVOS RELACIONADOS

| Arquivo | Função |
|---------|--------|
| `sync-freshdesk/sync-smart.js` | Script principal |
| `sync-freshdesk/integrity-check.js` | Verificação de integridade |
| `sync-freshdesk/field-validator.js` | Validação de campos |
| `sync-freshdesk/logs-config.js` | Configuração de logs |
| `.github/workflows/sync-freshdesk.yml` | Workflow principal |
| `.github/workflows/integrity-check.yml` | Workflow de integridade |

---

## 📊 MÉTRICAS DE SUCESSO

Após execução bem-sucedida:

```
════════════════════════════════════════════════════════════
✅ CONCLUÍDO em 45.2s
📊 Validação: ON | Envio de logs: OFF
════════════════════════════════════════════════════════════
```

---

*Última atualização: Fevereiro 2026*
