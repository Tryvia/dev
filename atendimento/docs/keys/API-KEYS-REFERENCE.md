# 🔑 Referência de API Keys e Credenciais

**Dashboard Tryvia BI v2.0**  
**Última Atualização:** 24/02/2026

---

## ⚠️ IMPORTANTE - SEGURANÇA

> **NUNCA compartilhe este arquivo publicamente!**  
> Adicione ao `.gitignore` se necessário.

---

## 📋 Resumo das Credenciais

| Serviço | Tipo | Usado em |
|---------|------|----------|
| Supabase | URL + Anon Key | Dashboard, Bot WhatsApp |
| Gemini (Google AI) | API Key | IA Tryviano |
| Groq | API Key | IA Tryviano (fallback) |
| OpenRouter | API Key | IA Tryviano (fallback) |
| Freshdesk | URL Base | Bot WhatsApp, Links |

---

## 🗄️ SUPABASE

**Propósito:** Banco de dados PostgreSQL hospedado para armazenar tickets, configurações, métricas e histórico.

| Variável | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://ifzypptlhpzuydjeympr.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8` |

**Onde obter nova key:** https://supabase.com/dashboard/project/ifzypptlhpzuydjeympr/settings/api

**Arquivos que usam:**
- `js/supabase-loader.js`
- `js/env-config.js`
- `whatsapp-bot/bot.js`

---

## 🤖 GEMINI (Google AI)

**Propósito:** IA generativa principal para respostas do chatbot Tryviano.

| Variável | Valor |
|----------|-------|
| `GEMINI_API_KEY` | `AIzaSyAf1Y_iJxafTDKIw_IpSrFdKYx7DQ3pVuc` |
| `GEMINI_MODEL` | `gemini-1.5-flash` |

**Onde obter nova key:** https://aistudio.google.com/app/apikey

**Limites (tier gratuito):**
- 15 RPM (requests per minute)
- 1M tokens/dia

**Arquivos que usam:**
- `js/chatbot.js`
- `js/chatbot-premium.js`
- `js/env-config.js`

---

## ⚡ GROQ

**Propósito:** IA de fallback rápida (usa Llama 3.3 70B).

| Variável | Valor |
|----------|-------|
| `GROQ_API_KEY` | `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` |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

**Onde obter nova key:** https://console.groq.com/keys

**Limites (tier gratuito):**
- 30 RPM
- 6000 tokens/min

**Arquivos que usam:**
- `js/chatbot.js`
- `js/chatbot-premium.js`
- `js/env-config.js`

---

## 🌐 OPENROUTER

**Propósito:** IA de fallback alternativa (acesso a múltiplos modelos).

| Variável | Valor |
|----------|-------|
| `OPENROUTER_API_KEY` | `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` |
| `OPENROUTER_MODEL` | `google/gemini-flash-1.5` |

**Onde obter nova key:** https://openrouter.ai/keys

**Limites:**
- Depende do plano e modelo

**Arquivos que usam:**
- `js/chatbot-premium.js`
- `js/env-config.js`

---

## 🎫 FRESHDESK

**Propósito:** URL base para links de tickets.

| Variável | Valor |
|----------|-------|
| `FRESHDESK_TICKET_URL` | `https://suportetryvia.freshdesk.com/a/tickets` |

**Arquivos que usam:**
- `whatsapp-bot/bot.js`
- `js/env-config.js`

---

## 📱 BOT WHATSAPP

**Propósito:** Configurações do bot de notificações.

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `BOT_PORT` | `3001` | Porta do servidor web |
| `BOT_MAX_RETRIES` | `3` | Tentativas de reenvio |
| `BOT_RETRY_DELAY_MS` | `5000` | Delay entre tentativas (ms) |

---

## 📁 Estrutura de Arquivos de Configuração

```
Projeto Atendimento V-2/
├── .env                    # Variáveis de ambiente (NÃO COMMITAR)
├── .env.example            # Modelo sem valores sensíveis
├── js/
│   └── env-config.js       # Carrega variáveis no browser
└── whatsapp-bot/
    └── bot.js              # Usa process.env via dotenv
```

---

## 🔄 Como Atualizar uma Key

### Frontend (Dashboard)
1. Edite o arquivo `.env` na raiz do projeto
2. Ou edite `js/env-config.js` diretamente
3. Recarregue a página (Ctrl+F5)

### Backend (Bot WhatsApp)
1. Edite o arquivo `.env` na raiz do projeto
2. Reinicie o bot: `node bot.js`

### Via LocalStorage (temporário)
```javascript
// No console do navegador
EnvConfig.set('GEMINI_API_KEY', 'nova_key_aqui');
// Para remover override
EnvConfig.clear('GEMINI_API_KEY');
```

---

## 🔒 Boas Práticas de Segurança

1. **Nunca commite o `.env`** - Adicione ao `.gitignore`
2. **Rotação periódica** - Troque as keys a cada 3-6 meses
3. **Mínimo privilégio** - Use keys de "anon" quando possível
4. **Monitoramento** - Verifique uso nas dashboards dos provedores
5. **Backup seguro** - Mantenha cópia em local seguro (não no código)

---

## 📊 Status das Keys (verificar periodicamente)

| Serviço | Última Verificação | Status |
|---------|-------------------|--------|
| Supabase | 24/02/2026 | ✅ Ativo |
| Gemini | 24/02/2026 | ✅ Ativo |
| Groq | 24/02/2026 | ✅ Ativo |
| OpenRouter | 24/02/2026 | ✅ Ativo |

---

*Documento gerado em 24/02/2026*
