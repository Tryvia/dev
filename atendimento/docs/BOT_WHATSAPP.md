# 🤖 Bot WhatsApp - Notificações de Tickets

## Visão Geral

O Bot WhatsApp é um sistema automatizado que monitora novas conversas em tickets do Freshdesk (via Supabase) e envia notificações pelo WhatsApp para os responsáveis pelo atendimento.

---

## 📁 Localização dos Arquivos

```
whatsapp-bot/
├── bot.js                 # Código principal do bot
├── package.json           # Dependências Node.js
├── INICIAR_BOT.bat        # Script para iniciar no Windows
├── whatsapp-session/      # Sessão do WhatsApp (cookies, auth)
└── node_modules/          # Dependências instaladas
```

---

## ⚙️ Como Funciona

### Fluxo de Funcionamento

1. **Conexão WhatsApp**: O bot conecta ao WhatsApp Web usando a biblioteca `whatsapp-web.js`
2. **Escuta Supabase**: Monitora a tabela `ticket_conversations` via Realtime
3. **Detecção**: Quando uma nova conversa é inserida, o bot é notificado
4. **Filtragem**: Só notifica a partir da 3ª mensagem do ticket:
   - 1ª mensagem = Cliente abre o ticket (ignorada)
   - 2ª mensagem = Equipe responde (ignorada)
   - 3ª+ mensagem = Retorno do cliente (NOTIFICA ✅)
5. **Identificação**: Busca as tags do ticket para identificar o responsável
6. **Envio**: Envia mensagem WhatsApp para o responsável mapeado

### Mapeamento TAG → WhatsApp

O bot usa um mapeamento de nomes (tags) para números de WhatsApp:

```javascript
const TAG_TO_WHATSAPP = {
    'Jéssica': '5521995716679',
    'Gustavo': '5521972955579',
    'João Peres': '5521999344560',
};
```

**Para adicionar novas pessoas:**
1. Abra o arquivo `whatsapp-bot/bot.js`
2. Adicione no objeto `TAG_TO_WHATSAPP`:
   ```javascript
   'Nome da Pessoa': '55DDNNNNNNNNN',  // DD = DDD, N = número
   ```
3. Reinicie o bot

---

## 🚀 Como Iniciar o Bot

### Método 1: Script BAT (Windows)
```
Dê duplo clique em: whatsapp-bot/INICIAR_BOT.bat
```

### Método 2: Linha de Comando
```bash
cd whatsapp-bot
npm install          # Apenas na primeira vez
node bot.js
```

### Primeira Execução
Na primeira execução, será exibido um **QR Code** no terminal. Escaneie com o WhatsApp que será usado para enviar as notificações.

---

## 🔄 Como Alterar a Sessão do WhatsApp

Se você precisar trocar o número do WhatsApp (usar outro celular/chip), siga estes passos:

### Passo 1: Parar o Bot
Feche o terminal onde o bot está rodando (Ctrl+C ou feche a janela).

### Passo 2: Apagar a Sessão Atual

**Windows (CMD/PowerShell):**
```powershell
# Navegue até a pasta do projeto
cd "c:\Users\Operacional-25\CascadeProjects\Projeto Atendimento\Projeto Atendimento V-2"

# Apague a pasta de sessão
rmdir /s /q whatsapp-bot\whatsapp-session
```

**Ou manualmente:**
1. Vá até a pasta `whatsapp-bot`
2. Delete a pasta `whatsapp-session` inteira

### Passo 3: Reiniciar o Bot
```bash
cd whatsapp-bot
node bot.js
```

### Passo 4: Escanear Novo QR Code
Um novo QR Code será exibido. Escaneie com o WhatsApp do novo número/celular.

---

## 📱 Usando um Número Dedicado para o Bot

**Recomendação:** Use um chip pré-pago dedicado para o bot, assim as mensagens não saem do seu número pessoal.

### Passos:
1. Compre um chip pré-pago (~R$10-15)
2. Ative o WhatsApp nesse número em qualquer celular
3. Apague a sessão atual do bot (passos acima)
4. Inicie o bot e escaneie o QR com o novo WhatsApp
5. O bot passa a enviar mensagens pelo novo número

### Alternativas:
- **WhatsApp Business API**: Número comercial verificado (pago, mais profissional)
- **Número Virtual**: Serviços como TextNow (pode não funcionar no Brasil)

---

## 🌐 API do Bot

O bot expõe uma API HTTP na porta `3001`:

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status do bot e conexão WhatsApp |
| GET | `/people` | Lista pessoas mapeadas |
| POST | `/test/:ticketId` | Teste manual de notificação |

### Exemplos:

```bash
# Verificar status
curl http://localhost:3001/health

# Listar pessoas
curl http://localhost:3001/people

# Testar notificação para ticket #12345
curl -X POST http://localhost:3001/test/12345
```

---

## 📝 Formato da Mensagem Enviada

```
🔔 *Ticket #12345 Atualizado*

📋 *Assunto:* Problema no sistema
👤 *Cliente:* João Silva
💬 Nova resposta recebida

🔗 Ver ticket: https://suportetryvia.freshdesk.com/a/tickets/12345
```

---

## 🔧 Configurações Importantes

### Arquivo: `bot.js`

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `PORT` | 3001 | Porta da API HTTP |
| `MIN_MESSAGES_TO_NOTIFY` | 3 | A partir de qual mensagem notificar |
| `SUPABASE_URL` | URL do Supabase | Conexão com banco de dados |
| `TAG_TO_WHATSAPP` | Objeto | Mapeamento nome → telefone |

---

## ⚠️ Troubleshooting

### Bot não conecta ao WhatsApp
1. Verifique sua conexão com a internet
2. Apague a sessão e escaneie novamente
3. Verifique se o WhatsApp Web está funcionando no navegador

### Mensagens não são enviadas
1. Verifique se o WhatsApp está conectado (`/health`)
2. Verifique se a pessoa está no mapeamento `TAG_TO_WHATSAPP`
3. Verifique se a tag do ticket corresponde exatamente ao nome mapeado

### QR Code não aparece
1. Apague a pasta `whatsapp-session`
2. Reinicie o bot

### Erro "Session closed"
O WhatsApp pode ter deslogado. Apague a sessão e reconecte.

---

## 📊 Logs do Bot

O bot exibe logs detalhados no terminal:

```
📨 Nova conversa detectada!
   Ticket: #12345
   📊 Mensagem #3 do ticket
   Assunto: Problema no sistema
   Cliente: João Silva
   Tags: Jéssica, Suporte
   👤 Responsável: Jéssica
   📱 WhatsApp: 5521995716679
   ✅ Mensagem enviada para Jéssica!
```

---

## 🔐 Segurança

- A sessão do WhatsApp é armazenada localmente em `whatsapp-session/`
- Não compartilhe esta pasta - ela contém as credenciais da sessão
- A chave do Supabase é a `anon key` (pública, apenas leitura)

---

## 📅 Última Atualização

Dezembro 2024
