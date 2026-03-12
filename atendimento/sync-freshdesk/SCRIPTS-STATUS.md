# 📋 STATUS DOS SCRIPTS DE SYNC

**Última atualização:** 10/03/2026

---

## ✅ SCRIPTS PRINCIPAIS (USAR ESTES)

| Script | Função | Execução |
|--------|--------|----------|
| **sync-integrity.js** | 🌟 PRINCIPAL - Verifica + corrige automaticamente | `node sync-integrity.js` |
| **sync-smart.js** | Script unificado (quick/full/verify) | `node sync-smart.js quick` |
| **sync-scheduler.js** | Agendador local (roda continuamente) | `node sync-scheduler.js` |
| **verificar-final.js** | Verificação rápida de contagem | `node verificar-final.js` |

---

## 🔧 SCRIPTS UTILITÁRIOS (MANTER)

| Script | Função |
|--------|--------|
| integrity-check.js | Verificação de integridade (legado) |
| fix-incomplete-tickets.js | Corrige tickets sem subject |
| sync-conversations-missing.js | Sincroniza conversas faltantes |
| field-validator.js | Validação de campos |
| logs-config.js | Configuração de logs |
| webhook-handler.js | Handler para webhooks Freshdesk |

---

## ⚠️ SCRIPTS DE DIAGNÓSTICO (Usar quando necessário)

| Script | Função |
|--------|--------|
| comparar-status.js | Compara status FD vs SB |
| diagnostico-discrepancia.js | Diagnóstico detalhado |
| verificacao-completa.js | Verificação pesada completa |

---

## �️ DEPRECATED (Mover para deprecated/)

| Script | Substituído Por |
|--------|-----------------|
| sync-tickets-v2.js | sync-smart.js |
| sync-pendentes-rapido.js | sync-integrity.js |
| corrigir-deletados.js | sync-integrity.js |
| corrigir-diferenca.js | sync-integrity.js |
| encontrar-diferenca.js | sync-integrity.js |
| investigar-7041-7042.js | (específico, pode deletar) |
| update-cf-analista.js | sync-smart.js |
| update-cf-tratativa.js | sync-smart.js |
| update-all-custom-fields.js | sync-smart.js |
| verificar-acompanhamento.js | sync-integrity.js |
| verify-data.js | sync-integrity.js |

---

## 📅 WORKFLOWS DO GITHUB ACTIONS

### ✅ ATIVOS (Usar estes)
| Workflow | Frequência | Script | Função |
|----------|------------|--------|--------|
| **sync-completo.yml** | A cada 15 min | sync-integrity.js | 🌟 PRINCIPAL |
| sync-freshdesk.yml | A cada 3h | sync-smart.js | Backup |
| integrity-check.yml | Diário 6h UTC | integrity-check.js | Verificação |

### ⚠️ DEPRECATED
Mover para `.github/workflows/deprecated/`:
- Todos os workflows antigos já estão lá

---

## 🛡️ PROTEÇÕES IMPLEMENTADAS

1. **Tickets Deletados**: Detecta e marca como fechados automaticamente
2. **Status Desatualizado**: Corrige automaticamente qualquer diferença
3. **Tickets Faltantes**: Adiciona tickets que existem no FD mas não no SB
4. **Verificação Final**: Confirma que contagem está 100% igual
5. **Nunca Deleta**: Scripts apenas inserem/atualizam

---

## � COMO USAR

```bash
# Verificação + correção automática (RECOMENDADO)
node sync-freshdesk/sync-integrity.js

# Apenas verificar (não altera nada)
node sync-freshdesk/sync-integrity.js --dry-run

# Sync rápido (últimas 48h)
node sync-freshdesk/sync-smart.js quick

# Sync completo (tudo)
node sync-freshdesk/sync-smart.js full
```
