# 📋 STATUS DOS SCRIPTS DE SYNC

## ✅ SCRIPTS PRINCIPAIS (Usar estes)

| Script | Função | Execução |
|--------|--------|----------|
| **sync-smart.js** | Script unificado inteligente | `node sync-smart.js quick\|full\|verify` |
| **integrity-check.js** | Verificação diária de integridade | Automático via GitHub Actions |

---

## ⚠️ SCRIPTS LEGADOS (Mantidos para compatibilidade)

| Script | Substituído Por | Pode Remover? |
|--------|-----------------|---------------|
| sync-tickets-v2.js | sync-smart.js full | ❌ Não (workflow pode usar) |
| sync-quick.js | sync-smart.js quick | ✅ Sim |
| sync-quick-recent.js | sync-smart.js quick | ✅ Sim |
| sync-quick-status.js | sync-smart.js quick | ✅ Sim |
| sync-conversations.js | sync-smart.js full | ✅ Sim |
| sync-csat.js | sync-smart.js full | ✅ Sim |
| sync-metadata.js | sync-smart.js full | ✅ Sim |

---

## 🔧 SCRIPTS UTILITÁRIOS (Manter)

| Script | Função |
|--------|--------|
| fix-incomplete-tickets.js | Corrige tickets sem subject |
| sync-conversations-missing.js | Sincroniza conversas faltantes |

---

## 📅 WORKFLOWS DO GITHUB ACTIONS

### ✅ Ativos
| Workflow | Frequência | Script |
|----------|------------|--------|
| sync-freshdesk.yml | A cada 3h | sync-smart.js quick |
| integrity-check.yml | Diário 6h UTC | integrity-check.js |

### ❌ Desabilitados (em `.github/workflows/deprecated/`)
| Arquivo | Status |
|---------|--------|
| scheduled-sync.yml.disabled | Renomeado - NÃO executa |
| sync-quick.yml.disabled | Renomeado - NÃO executa |
| sync-conversations.yml.disabled | Renomeado - NÃO executa |
| sync-csat.yml.disabled | Renomeado - NÃO executa |
| sync-metadata.yml.disabled | Renomeado - NÃO executa |
| sync-full.yml.disabled | Renomeado - NÃO executa |
| sync-quick-recent.yml.disabled | Renomeado - NÃO executa |
| sync-quick-status.yml.disabled | Renomeado - NÃO executa |

---

## 🛡️ PROTEÇÕES IMPLEMENTADAS

1. **Problema Ailanie**: Tags desatualizadas são detectadas e corrigidas automaticamente
2. **Tickets Faltantes**: Comparação Freshdesk vs Supabase em cada sync
3. **Auto-correção**: Se integrity-check detecta problemas, executa sync quick
4. **Nunca Deleta**: Scripts apenas inserem/atualizam, nunca deletam dados
