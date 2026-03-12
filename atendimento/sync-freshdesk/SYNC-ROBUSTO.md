# 🔄 Estratégia de Sincronização Robusta - Freshdesk ↔ Supabase

## � INÍCIO RÁPIDO

```bash
# Verificação e correção imediata (recomendado)
node sync-freshdesk/sync-integrity.js

# Agendar verificação a cada 15 minutos
node sync-freshdesk/sync-scheduler.js

# Apenas verificar sem corrigir
node sync-freshdesk/sync-integrity.js --dry-run
```

---

## �📋 Problemas Identificados

### 1. **Tickets Deletados**
- Tickets deletados no Freshdesk continuam ativos no Supabase
- Causa: A API de listagem não retorna tickets deletados
- Impacto: Contagem de pendentes maior no BI

### 2. **Sincronização Incompleta**
- A API do Freshdesk usa paginação e tem rate limits
- Tickets podem ser perdidos entre páginas
- `updated_since` pode não pegar todos os tickets

### 3. **Status Desatualizado**
- Tickets mudam de status no Freshdesk mas não são atualizados no Supabase
- Causa: Sincronização baseada apenas em `updated_since`

### 4. **Falta de Verificação**
- Não há verificação automática após sincronização
- Discrepâncias só são detectadas manualmente

---

## ✅ Soluções Propostas

### Solução 1: **Webhook do Freshdesk** (RECOMENDADO)
```
Freshdesk → Webhook → Servidor Node → Supabase
```
- **Vantagem**: Atualização em tempo real
- **Como funciona**: Freshdesk dispara webhook a cada mudança de ticket
- **Implementação**: Criar endpoint que recebe eventos e atualiza Supabase

### Solução 2: **Sincronização por Hash**
- Calcular hash do ticket (status + updated_at + tags)
- Comparar hashes entre Freshdesk e Supabase
- Atualizar apenas tickets com hash diferente

### Solução 3: **Verificação Periódica de Integridade**
- Script que roda a cada 15-30 minutos
- Compara contagens por status
- Alerta se houver diferença > 0

### Solução 4: **Detecção de Tickets Deletados**
- Buscar ticket por ticket no Freshdesk
- Marcar como deletado se retornar 404 ou `deleted: true`
- Atualizar status para Fechado (5)

---

## 🛠️ Implementação Recomendada

### Fase 1: Verificação Automática (Imediato)
1. Script `sync-integrity.js` que roda a cada 15 min
2. Compara contagem de pendentes FD vs SB
3. Se diferença > 0, executa correção automática

### Fase 2: Detecção de Deletados (Curto prazo)
1. Adicionar flag `deleted` na tabela tickets
2. Verificar tickets pendentes antigos no FD
3. Marcar deletados automaticamente

### Fase 3: Webhook (Médio prazo)
1. Configurar webhook no Freshdesk
2. Criar endpoint no proxy
3. Processar eventos em tempo real

---

## 📊 Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Diferença de pendentes | 0 |
| Tempo de sincronização | < 5 min |
| Detecção de deletados | 100% |
| Uptime do webhook | 99.9% |

---

## 🔧 Scripts a Criar/Melhorar

1. `sync-integrity.js` - Verificação e correção automática
2. `sync-deleted.js` - Detecta e marca tickets deletados
3. `webhook-handler.js` - Processa webhooks do Freshdesk
4. `sync-scheduler.js` - Agenda execuções periódicas

