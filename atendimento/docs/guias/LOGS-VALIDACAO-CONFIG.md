# 📋 CONFIGURAÇÃO DE LOGS DE VALIDAÇÃO

Este documento explica como configurar o sistema de logs de validação de campos do sync.

---

## 🔍 O que o sistema faz?

Durante a sincronização, o sistema verifica se todos os campos obrigatórios foram preenchidos:

| Nível | Campos | Exemplo |
|-------|--------|---------|
| **Crítico** | Campos essenciais | `id`, `subject`, `status` |
| **Importante** | Campos relevantes | `requester_id`, `created_at` |
| **Opcional** | Campos extras | `description_text`, `tags` |

**Importante:** Campos faltantes **NÃO bloqueiam** a inserção no banco. O registro é inserido normalmente, mas o problema é logado.

---

## ⚙️ Configuração via Variáveis de Ambiente

### Para enviar logs para GitHub Issues:

```bash
# Habilitar envio para GitHub
SEND_LOGS_TO_GITHUB=true

# Repositórios para receber os logs (separados por vírgula)
LOG_GITHUB_REPOS=supabasedas/atendimento,OnJoaoclosed/atendimento

# Token do GitHub com permissão de criar issues
GITHUB_TOKEN=ghp_xxxx
```

### Para enviar logs para Supabase:

```bash
# Habilitar envio para Supabase
SEND_LOGS_TO_SUPABASE=true

# Credenciais (já configuradas)
SUPABASE_URL=https://ifzypptlhpzuydjeympr.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

---

## 🔧 Configuração no GitHub Actions

Adicione os secrets no GitHub:

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione:

| Secret | Valor | Descrição |
|--------|-------|-----------|
| `SEND_LOGS_TO_GITHUB` | `true` | Habilitar logs no GitHub |
| `LOG_GITHUB_REPOS` | `supabasedas/atendimento` | Repositório para issues |
| `GITHUB_TOKEN` | `ghp_xxxx` | Token com permissão `repo` |
| `SEND_LOGS_TO_SUPABASE` | `true` | Habilitar logs no Supabase |

---

## 📊 Como os logs aparecem

### No Console (sempre):
```
❌ [ticket] ID 12345: Campos CRÍTICOS faltando: subject
⚠️ [ticket] ID 12346: Campos importantes faltando: requester_id

📊 RESUMO DE VALIDAÇÃO:
   Total de registros: 500
   Com campos faltantes: 3
   Críticos: 1
   Importantes: 2
```

### No GitHub (Issue criada automaticamente):
```markdown
# 📊 Relatório de Validação de Campos

**Data:** 2026-02-26
**Duração:** 45s

## 📈 Resumo

| Métrica | Valor |
|---------|-------|
| Total de registros | 500 |
| Registros com campos faltantes | 3 |

## ❌ Campos Críticos Faltantes

| Tipo | ID | Campos |
|------|-----|--------|
| ticket | 12345 | subject |
```

### No Supabase (tabela `sync_logs`):
Execute o SQL em `sql/create-sync-logs-table.sql` para criar a tabela.

---

## 📁 Arquivos do Sistema

| Arquivo | Função |
|---------|--------|
| `sync-freshdesk/field-validator.js` | Módulo de validação |
| `sync-freshdesk/logs-config.js` | Configuração padrão |
| `sql/create-sync-logs-table.sql` | SQL para criar tabela de logs |

---

## 🔄 Como funciona

1. **Antes de enviar para Supabase:** `validateAndLog(tickets, 'ticket')`
2. **Valida cada registro** contra os campos obrigatórios
3. **Loga no console** campos faltantes
4. **Acumula logs** durante a execução
5. **No final:** `flushLogs()` envia para GitHub e/ou Supabase

---

## 🛠️ Personalizar campos obrigatórios

Edite `sync-freshdesk/field-validator.js`:

```javascript
const REQUIRED_FIELDS = {
  ticket: {
    critical: ['id', 'subject', 'status'],  // Adicione campos aqui
    important: ['requester_id', 'created_at'],
    optional: ['description_text', 'tags']
  }
};
```

---

## 📞 Criar Token do GitHub

1. Acesse: https://github.com/settings/tokens
2. **Generate new token (classic)**
3. Selecione permissões: **repo**
4. Copie o token gerado

---

*Última atualização: Fevereiro 2026*
