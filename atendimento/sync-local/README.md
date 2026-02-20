# 🔄 Sync Conversations Local

Script para sincronizar conversas do Freshdesk para o Supabase **localmente**, sem depender do GitHub Actions. Ideal para testes rápidos com bots.

## ⚙️ Configuração

1. **Copie o arquivo de exemplo:**
   ```bash
   cd sync-local
   copy .env.example .env
   ```

2. **Edite o `.env` com suas credenciais:**
   ```env
   FRESHDESK_API_KEY=sua_api_key
   FRESHDESK_DOMAIN=suportetryvia
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=sua_service_key
   ```

## 🚀 Como Usar

### Uso básico (últimos 30 minutos)
```bash
node sync-conversations-local.js
```

### Sincronizar últimos 60 minutos
```bash
node sync-conversations-local.js --minutes 60
```

### Sincronizar ticket específico
```bash
node sync-conversations-local.js --ticket 123456
```

### Filtrar por status
```bash
node sync-conversations-local.js --status open
node sync-conversations-local.js --status pending
node sync-conversations-local.js --status resolved
```

### Limitar quantidade de tickets
```bash
node sync-conversations-local.js --limit 10
```

### Modo verbose (ver detalhes das conversas)
```bash
node sync-conversations-local.js --verbose
```

### Dry-run (simular sem enviar)
```bash
node sync-conversations-local.js --dry-run --verbose
```

### Combinando opções
```bash
node sync-conversations-local.js --minutes 120 --status open --limit 20 --verbose
```

## 📋 Opções Disponíveis

| Opção | Curto | Descrição |
|-------|-------|-----------|
| `--minutes <n>` | `-m` | Buscar tickets atualizados nos últimos N minutos (padrão: 30) |
| `--ticket <id>` | `-t` | Sincronizar apenas um ticket específico |
| `--status <st>` | `-s` | Filtrar por status: `open`, `pending`, `resolved`, `closed` |
| `--limit <n>` | `-l` | Limitar quantidade de tickets (padrão: 100) |
| `--verbose` | `-v` | Mostrar detalhes das conversas |
| `--dry-run` | `-d` | Simular sem enviar para Supabase |
| `--help` | `-h` | Mostrar ajuda |

## 📊 Saída

O script mostra:
- Progresso de busca de tickets e conversas
- Barra de progresso visual
- Resumo de conversas (em modo verbose)
- Estatísticas finais

## 🔧 Requisitos

- Node.js 18+ (para fetch nativo)
- Acesso ao Freshdesk API
- Acesso ao Supabase

## ⚠️ Notas

- O arquivo `.env` está no `.gitignore` para não expor credenciais
- A tabela `ticket_conversations` deve existir no Supabase
- Rate limiting do Freshdesk é respeitado automaticamente
