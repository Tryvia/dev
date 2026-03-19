# 🚀 MANUAL DE EXECUÇÃO DO SYNC-SMART NO TERMINAL

> **Guia passo-a-passo para executar a sincronização Freshdesk → Supabase**

---

## 📋 PRÉ-REQUISITOS

1. **Node.js** instalado (v18+)
2. **Acesso ao terminal** (PowerShell no Windows)
3. **Pasta do projeto** aberta

---

## 🔐 PASSO 1: CONFIGURAR VARIÁVEIS DE AMBIENTE

Abra o **PowerShell** e cole o seguinte bloco **COMPLETO** (com todas as chaves já preenchidas):

```powershell
$env:FRESHDESK_DOMAIN="suportetryvia"
$env:FRESHDESK_API_KEY="s9GQtphoZqeRNz7Enl"
$env:SUPABASE_URL="https://ifzypptlhpzuydjeympr.supabase.co"
$env:SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA3NDcyNiwiZXhwIjoyMDg0NjUwNzI2fQ.O-nuoTl6RLo6shIETWifLpsuj852IUmupGk4kBq_BKY"
```

> ⚠️ **IMPORTANTE:** Cole todo o bloco acima de uma vez só!

---

## 📂 PASSO 2: NAVEGAR PARA A PASTA DO PROJETO

```powershell
cd "C:\Users\Operacional-25\CascadeProjects\Projeto Atendimento\Projeto Atendimento V-2"
```

---

## ⚡ PASSO 3: EXECUTAR O SYNC

### Opção A: Sync Rápido (Recomendado para uso diário)

```powershell
node sync-freshdesk/sync-smart.js quick
```

### Opção B: Sync Rápido SEM validação (mais rápido)

```powershell
node sync-freshdesk/sync-smart.js quick --no-validate
```

### Opção C: Sync Completo (sincroniza TUDO)

```powershell
node sync-freshdesk/sync-smart.js full
```

### Opção D: Apenas Verificação (não modifica nada)

```powershell
node sync-freshdesk/sync-smart.js verify
```

---

## 📝 COMANDO ÚNICO (COPIAR E COLAR)

Se preferir executar tudo em um único comando, copie e cole este bloco completo:

### Sync Rápido (Uma linha só):

```powershell
$env:FRESHDESK_DOMAIN="suportetryvia"; $env:FRESHDESK_API_KEY="s9GQtphoZqeRNz7Enl"; $env:SUPABASE_URL="https://ifzypptlhpzuydjeympr.supabase.co"; $env:SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA3NDcyNiwiZXhwIjoyMDg0NjUwNzI2fQ.O-nuoTl6RLo6shIETWifLpsuj852IUmupGk4kBq_BKY"; node sync-freshdesk/sync-smart.js quick --no-validate
```

### Sync Completo (Uma linha só):

```powershell
$env:FRESHDESK_DOMAIN="suportetryvia"; $env:FRESHDESK_API_KEY="s9GQtphoZqeRNz7Enl"; $env:SUPABASE_URL="https://ifzypptlhpzuydjeympr.supabase.co"; $env:SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA3NDcyNiwiZXhwIjoyMDg0NjUwNzI2fQ.O-nuoTl6RLo6shIETWifLpsuj852IUmupGk4kBq_BKY"; node sync-freshdesk/sync-smart.js full --no-validate
```

---

## 🔍 PASSO 4: VERIFICAR OS DADOS NO SUPABASE

Após o sync, execute para verificar:

```powershell
node sync-freshdesk/verify-data.js
```

---

## 📊 O QUE ESPERAR

### Saída de Sucesso:

```
════════════════════════════════════════════════════════════
🔄 SYNC SMART - Modo: QUICK
📅 2026-02-26T13:54:31.254Z
════════════════════════════════════════════════════════════

⚡ SYNC QUICK - Sincronização rápida com verificação

📥 Buscando tickets atualizados nas últimas 48h...
   ✅ 386 tickets recentes

📤 Sincronizando tickets...
   ✅ 386 tickets sincronizados

════════════════════════════════════════════════════════════
✅ CONCLUÍDO em 188.8s
════════════════════════════════════════════════════════════
```

---

## ⚠️ ERROS COMUNS

| Erro | Solução |
|------|---------|
| `FRESHDESK_API_KEY is required` | As variáveis de ambiente não foram configuradas. Cole o bloco do Passo 1 novamente. |
| `Rate limited` | Normal. O script aguarda automaticamente e continua. |
| `Cannot find module` | Execute `npm install` na pasta do projeto. |
| `ENOTFOUND` | Verifique sua conexão com a internet. |

---

## 🎯 RESUMO RÁPIDO

1. **Abra PowerShell**
2. **Cole as variáveis** (bloco do Passo 1)
3. **Navegue para a pasta** (comando do Passo 2)
4. **Execute o sync** (comando do Passo 3)
5. **Verifique os dados** (comando do Passo 4)

---

## 📁 LOCALIZAÇÃO DOS SCRIPTS

| Script | Caminho |
|--------|---------|
| Sync Principal | `sync-freshdesk/sync-smart.js` |
| Verificação de Integridade | `sync-freshdesk/integrity-check.js` |
| Verificação de Dados | `sync-freshdesk/verify-data.js` |

---

*Documento atualizado em 26/02/2026*
