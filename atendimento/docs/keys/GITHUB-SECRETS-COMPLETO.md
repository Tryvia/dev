# 🔐 GitHub Secrets - Configuração Completa

**Repositório:** `https://github.com/Onloaoclosed/atendimento`  
**URL de configuração:** `https://github.com/Onloaoclosed/atendimento/settings/secrets/actions`

---

## 📋 Secrets Obrigatórios (copie exatamente)

### 1. SUPABASE_URL
```
https://ifzypptlhpzuydjeympr.supabase.co
```

### 2. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8
```

### 3. SUPABASE_SERVICE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA3NDcyNiwiZXhwIjoyMDg0NjUwNzI2fQ.O-nuoTl6RLo6shIETWifLpsuj852IUmupGk4kBq_BKY
```

### 4. FRESHDESK_API_KEY
```
s9GQtphoZqeRNz7Enl
```

### 5. FRESHDESK_DOMAIN
```
suportetryvia
```

---

## 📋 Secrets Opcionais (para IA do Chatbot)

### 6. GEMINI_API_KEY
```
AIzaSyAf1Y_iJxafTDKIw_IpSrFdKYx7DQ3pVuc
```

### 7. GROQ_API_KEY
```
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
```

### 8. OPENROUTER_API_KEY
```
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
```

---

## 📝 Tabela Resumo para Copiar/Colar

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | `https://ifzypptlhpzuydjeympr.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA3NDcyNiwiZXhwIjoyMDg0NjUwNzI2fQ.O-nuoTl6RLo6shIETWifLpsuj852IUmupGk4kBq_BKY` |
| `FRESHDESK_API_KEY` | `s9GQtphoZqeRNz7Enl` |
| `FRESHDESK_DOMAIN` | `suportetryvia` |
| `GEMINI_API_KEY` | `AIzaSyAf1Y_iJxafTDKIw_IpSrFdKYx7DQ3pVuc` |
| `GROQ_API_KEY` | `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` |
| `OPENROUTER_API_KEY` | `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` |

---

## 🚀 Como Adicionar

1. Acesse: **Settings** → **Secrets and variables** → **Actions**
2. Clique em **"New repository secret"**
3. Cole o **Name** e o **Value** de cada secret
4. Clique em **"Add secret"**
5. Repita para todos os 8 secrets

---

## ✅ Verificação

Após adicionar todos os secrets, re-execute o workflow:
1. Vá em **Actions**
2. Selecione o workflow que falhou
3. Clique em **"Re-run all jobs"**

---

*Documento gerado em 25/02/2026*
