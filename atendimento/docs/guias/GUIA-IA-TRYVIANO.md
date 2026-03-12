# 🤖 Guia Completo - IA Tryviano

**Versão:** 4.0 Premium  
**Última Atualização:** 24/02/2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Capacidades](#capacidades)
3. [Como Usar](#como-usar)
4. [Comandos e Perguntas](#comandos-e-perguntas)
5. [Configurações](#configurações)
6. [Provedores de IA](#provedores-de-ia)
7. [Integração com Supabase](#integração-com-supabase)
8. [Base de Conhecimento](#base-de-conhecimento)
9. [Limitações](#limitações)
10. [FAQ](#faq)

---

## 🎯 Visão Geral

A **IA Tryviano** é um assistente inteligente integrado ao Dashboard de Tickets da Tryvia. Ela combina:

- **Múltiplos provedores de IA** (Gemini, OpenRouter, Groq) com fallback automático
- **Base de conhecimento local** sobre sistemas Tryvia (SING, OPT+z, YUV, Telemetria)
- **Análise preditiva** de volume, anomalias e padrões
- **Detecção de sentimento** para identificar usuários insatisfeitos
- **Busca inteligente** de tickets similares já resolvidos

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    IA Tryviano Premium                   │
├─────────────────────────────────────────────────────────┤
│  chatbot-premium.js    │  Interface Premium + Fallback  │
│  chatbot.js            │  Análises e Ferramentas        │
│  chatbot-intelligence.js│ Análise Preditiva            │
│  tryviano-knowledge-base.js │ Base de Conhecimento     │
│  ai-transformers.js    │  IA no Browser (opcional)      │
│  chatbot-utils.js      │  Funções Compartilhadas        │
└─────────────────────────────────────────────────────────┘
```

---

## 💪 Capacidades

### 1. Análise de Tickets

| Capacidade | Descrição |
|------------|-----------|
| **Estatísticas Rápidas** | Total, abertos, resolvidos, urgentes, SLA |
| **Ranking de Pessoas** | Por resolvidos, taxa de resolução, SLA |
| **Análise por Período** | Comparativo semanal, mensal, personalizado |
| **Padrões Temporais** | Picos por dia da semana e hora |
| **Análise por Sistema** | SING, OPT+z, YUV, Telemetria, etc. |
| **Análise de Satisfação** | CSAT, NPS (quando disponível) |

### 2. Detecção de Anomalias

- 🚨 **Tickets urgentes sem resposta** há mais de 1h
- ⚠️ **Tickets parados** há mais de 24h
- 📈 **Volume acima da média** diária
- 👤 **Pessoas sobrecarregadas** (acima da capacidade)
- 📉 **SLA baixo** (abaixo de 70%)

### 3. Análise Preditiva

- **Previsão de volume** para próximos dias
- **Detecção de tendências** de abertura
- **Sugestão de atribuição** baseada em especialidade
- **Estimativa de tempo de resolução**

### 4. Base de Conhecimento

A IA conhece em profundidade:

| Sistema | Conhecimento |
|---------|--------------|
| **SING** | Gestão de transporte, CTe, MDFe, NFe, contratos |
| **OPT+z** | Otimização de rotas, Gantt, pedra, carro fujão |
| **YUV** | Gestão de frotas, manutenção, documentos |
| **Telemetria** | Rastreamento, cerca eletrônica, jornada |
| **App Motorista** | Coleta, entrega, checklist, romaneio |
| **BI** | Relatórios, dashboards, métricas |

### 5. Busca de Tickets Similares

Quando você pergunta sobre um problema, a IA:
1. Busca tickets resolvidos com problemas similares
2. Mostra as soluções aplicadas
3. Sugere procedimentos baseados em histórico

### 6. Detecção de Sentimento

A IA detecta automaticamente quando o usuário parece:
- 😤 **Irritado** - Alerta registrado no Supabase
- 🚨 **Urgente** - Alerta registrado no Supabase
- 😊 **Satisfeito** - Feedback positivo

---

## 🚀 Como Usar

### Acessar o Chatbot

1. Clique no **botão flutuante** no canto inferior direito (🤖)
2. A janela do Tryviano se abre
3. Digite sua pergunta ou clique em uma sugestão

### Interface

```
┌──────────────────────────────────────┐
│ 🤖 IA Tryviano          ⚙️ 🗑️ ✕     │ ← Cabeçalho com status
├──────────────────────────────────────┤
│                                      │
│   Mensagens da conversa              │ ← Área de mensagens
│                                      │
├──────────────────────────────────────┤
│ 📊 Status  🚨 Alertas  🔍 Buscar     │ ← Ações rápidas
├──────────────────────────────────────┤
│ [Digite sua pergunta...]       ➤     │ ← Input
└──────────────────────────────────────┘
```

### Ações Rápidas

- **📊 Status rápido** - Visão geral dos tickets
- **🚨 Alertas urgentes** - Anomalias e problemas
- **🔍 Buscar solução** - Ajuda com problemas
- **🏆 Ranking** - Quem mais resolve

---

## 💬 Comandos e Perguntas

### Estatísticas Gerais

```
"Qual o status atual?"
"Quantos tickets temos?"
"Me dá um resumo do dia"
"Como está o backlog?"
```

### SLA e Performance

```
"Qual nosso SLA?"
"SLA do João"
"Quem está com melhor SLA?"
"Tickets fora do SLA"
```

### Pessoas e Equipe

```
"Como está o João?"
"Tickets do Carlos"
"Quem está mais ocupado?"
"Ranking de resolução"
```

### Problemas e Soluções

```
"Como resolver erro no SING?"
"Veículo não aparece no rastreamento"
"Problema de login"
"Erro na integração"
```

### Análises Avançadas

```
"Previsão para amanhã"
"Tendência da semana"
"Padrão de abertura"
"Anomalias detectadas"
```

### Tickets Específicos

```
"Resumo do ticket #12345"
"Tickets similares ao #12345"
"Histórico do solicitante joao@empresa.com"
```

### Sistemas Específicos

```
"Problemas comuns do OPT+z"
"Como funciona o Gantt?"
"O que é pedra no roteirizador?"
"Procedimento para CTe"
```

---

## ⚙️ Configurações

Acesse clicando no **⚙️** no cabeçalho.

### Provedor de IA

Escolha o provedor primário:
- **🔵 Gemini** (Recomendado) - Google, rápido e gratuito
- **🟢 OpenRouter** - Múltiplos modelos
- **🟠 Groq** - Ultra rápido

### Personalidade

- **Conversacional** - Amigável, usa emojis
- **Formal** - Tom profissional e corporativo
- **Técnico** - Foco em dados e métricas

### API Keys

Configure suas próprias chaves para maior controle:
- Gemini: [Obter em Google AI Studio](https://aistudio.google.com/app/apikey)
- OpenRouter: [Obter em OpenRouter](https://openrouter.ai/keys)
- Groq: [Obter em Groq Console](https://console.groq.com/keys)

---

## 🔄 Provedores de IA

### Sistema de Fallback

Se o provedor primário falhar, o sistema tenta automaticamente o próximo:

```
Gemini → OpenRouter → Groq → Processamento Local
```

### Comparativo

| Provedor | Velocidade | Qualidade | Custo |
|----------|------------|-----------|-------|
| **Gemini** | ⚡⚡⚡ | ⭐⭐⭐⭐ | Gratuito |
| **OpenRouter** | ⚡⚡ | ⭐⭐⭐⭐⭐ | Pago/Gratuito |
| **Groq** | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | Gratuito |
| **Local** | ⚡⚡⚡⚡ | ⭐⭐ | Gratuito |

### Modelos Utilizados

- **Gemini:** `gemini-2.0-flash-exp`
- **OpenRouter:** `google/gemini-2.0-flash-exp:free`
- **Groq:** `llama-3.3-70b-versatile`

---

## 🗄️ Integração com Supabase

A IA Tryviano se integra com o Supabase para:

### Tabelas Utilizadas

| Tabela | Função |
|--------|--------|
| `feriados` | Feriados para cálculo de SLA |
| `ia_conversas` | Histórico de conversas |
| `ia_metricas` | Métricas de uso da IA |
| `ia_alertas_sentimento` | Alertas de usuários irritados |
| `ia_decisoes` | Decisões registradas |

### Métricas Coletadas

- Total de chamadas por provedor
- Taxa de sucesso/erro
- Tempo médio de resposta
- Uso de fallback
- Sentimentos detectados

### Executar SQL de Setup

Para habilitar as funcionalidades de Supabase, execute:

```sql
-- No Supabase SQL Editor
-- Arquivo: sql/setup-ia-tryviano.sql
```

---

## 📚 Base de Conhecimento

### Sistemas Cobertos

#### SING (Sistema de Gestão)
- Cadastros de clientes, motoristas, veículos
- Emissão de CTe, MDFe, NFe
- Contratos e tabelas de frete
- Financeiro e faturamento

#### OPT+z (Otimizador de Rotas)
- Roteirização automática
- Visualização Gantt
- Carro fujão e viagem vazia
- Pedras e restrições
- Conexões entre rotas

#### YUV (Gestão de Frotas)
- Cadastro de veículos
- Controle de manutenção
- Documentação (CRLV, seguro)
- Abastecimento e custos

#### Telemetria
- Rastreamento em tempo real
- Cerca eletrônica
- Jornada de motorista
- Alertas de velocidade

#### App Motorista
- Coleta e entrega
- Checklist de veículo
- Romaneio digital
- Comprovantes (foto/assinatura)

### Problemas Comuns

A IA conhece soluções para:
- Erros de login/acesso
- Problemas de sincronização
- Erros de integração
- Lentidão do sistema
- Dados não aparecem
- Relatórios não geram

---

## ⚠️ Limitações

### Limitações Técnicas

| Limitação | Descrição |
|-----------|-----------|
| **Contexto** | Máximo de 20 mensagens no histórico |
| **Tokens** | Respostas limitadas a ~800 tokens |
| **Offline** | Sem IA externa se não houver internet |
| **Dados** | Só analisa tickets carregados no dashboard |

### Limitações de Conhecimento

- **Não acessa sistemas externos** - Só analisa dados do dashboard
- **Não executa ações** - Apenas sugere, não modifica tickets
- **Não acessa arquivos** - Não lê anexos dos tickets
- **Conhecimento limitado** - Base de conhecimento manual

### Limitações de Precisão

- Previsões são estimativas baseadas em histórico
- Busca de similares usa algoritmo simples (Jaccard)
- Detecção de sentimento pode ter falsos positivos
- Respostas de IA podem conter imprecisões

---

## ❓ FAQ

### A IA pode modificar tickets?
**Não.** A IA apenas analisa e sugere. Modificações devem ser feitas manualmente.

### As conversas são salvas?
**Sim**, se o Supabase estiver configurado. Localmente, apenas as últimas 30 mensagens.

### Posso usar minhas próprias API keys?
**Sim.** Configure nas configurações (⚙️) para ter controle total.

### O que acontece se todas as APIs falharem?
O sistema usa **processamento local** com a base de conhecimento. Funciona offline.

### Como adicionar novos conhecimentos?
Edite o arquivo `tryviano-knowledge-base.js` e adicione entradas no objeto `conhecimento`.

### A IA aprende com minhas perguntas?
**Não automaticamente.** Mas as conversas são salvas para análise futura.

### Posso usar em dispositivos móveis?
**Sim.** A interface é responsiva e funciona em tablets e smartphones.

### Como reportar problemas?
Verifique o console do navegador (F12) para erros e reporte ao time de desenvolvimento.

---

## 📊 Métricas de Uso

### Ver Métricas no Supabase

```sql
-- Métricas dos últimos 7 dias
SELECT * FROM vw_ia_metricas_resumo 
WHERE data >= CURRENT_DATE - INTERVAL '7 days';

-- Alertas pendentes
SELECT * FROM vw_alertas_pendentes;

-- Perguntas mais frequentes (análise manual)
SELECT conteudo, COUNT(*) as vezes
FROM ia_conversas
WHERE tipo = 'user' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY conteudo
ORDER BY vezes DESC
LIMIT 20;
```

---

## 🔧 Arquivos do Sistema

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `chatbot.js` | ~6.150 | Chatbot original + ferramentas |
| `chatbot-premium.js` | ~1.850 | Interface premium + fallback |
| `chatbot-intelligence.js` | ~840 | Análise preditiva |
| `tryviano-knowledge-base.js` | ~1.150 | Base de conhecimento |
| `ai-transformers.js` | ~690 | IA no browser |
| `chatbot-utils.js` | ~450 | Funções compartilhadas |

### Ordem de Carregamento

```html
<script src="js/chatbot-utils.js"></script>
<script src="js/tryviano-knowledge-base.js"></script>
<script src="js/chatbot-intelligence.js"></script>
<script src="js/chatbot.js"></script>
<script src="js/chatbot-premium.js"></script>
<!-- Opcional -->
<script src="js/ai-transformers.js"></script>
```

---

## 📝 Changelog Recente

### v4.0.1 (24/02/2026)
- ✅ Corrigido bug de localStorage (personalidade)
- ✅ SLA agora usa prioridade do ticket (não fixo em 4h)
- ✅ Adicionado limite de cache de embeddings (500 itens)
- ✅ Feriados atualizados para 2025-2027
- ✅ Métricas de IA salvas no Supabase
- ✅ Alertas de sentimento persistidos
- ✅ Módulo compartilhado `chatbot-utils.js`
- ✅ SQL de setup para novas tabelas

---

*Documentação gerada em 24/02/2026*
