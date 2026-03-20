# 📚 Documentação do Sistema

> **BI Analytics - Sistema de Análise de Tickets**
> Tryvia - Dezembro 2025 (v3.0)

---

## 📂 Estrutura de Pastas

```
docs/
├── arquitetura/          # Documentação técnica e arquitetura
│   ├── ANALISE_BIs.md
│   ├── API_DADOS.md
│   ├── COMPONENTES.md
│   ├── DOCUMENTACAO_TECNICA.md
│   └── ESTILOS.md
├── guias/                # Tutoriais e modos de uso
│   ├── GUIA-IA-TRYVIANO.md
│   ├── GUIA_BI_ANALYTICS.md
│   ├── LOGS-VALIDACAO-CONFIG.md
│   ├── THEME-SYSTEM-GUIDE.md
│   └── guides/
├── keys/                 # Credenciais e API Keys
│   ├── API-KEYS-REFERENCE.md
│   ├── GITHUB-SECRETS-COMPLETO.md
│   ├── GITHUB-TOKENS-TUTORIAL.md
│   └── credenciais.txt
├── relatorios/           # Relatórios e auditorias
│   ├── RELATORIO-30-MELHORIAS.md
│   ├── RELATORIO-AUDITORIA-SISTEMA.md
│   ├── RELATORIO-DIAGNOSTICO-SYNC.md
│   ├── RELATORIO-IA-TRYVIANO.md
│   ├── RELATORIO-MODULARIZACAO.md
│   └── RELATORIO-VERIFICACAO-BIS.md
├── sync/                 # Sincronização Freshdesk
│   ├── MANUAL-EXECUCAO-TERMINAL.md  ⭐ NOVO
│   └── SYNC-SMART-MANUAL.md
└── README.md             # Este arquivo
```

---

## 📖 Índice de Documentação

### 🏗️ Arquitetura
| Documento | Descrição |
|-----------|-----------|
| [COMPONENTES.md](./arquitetura/COMPONENTES.md) | Documentação completa de todos os componentes JavaScript |
| [ESTILOS.md](./arquitetura/ESTILOS.md) | Guia de estilos, cores, tipografia e CSS |
| [API_DADOS.md](./arquitetura/API_DADOS.md) | Integração com Supabase, estrutura de dados e API |
| [DOCUMENTACAO_TECNICA.md](./arquitetura/DOCUMENTACAO_TECNICA.md) | Documentação técnica completa |

### 🔐 Keys e Credenciais
| Documento | Descrição |
|-----------|-----------|
| [GITHUB-SECRETS-COMPLETO.md](./keys/GITHUB-SECRETS-COMPLETO.md) | Todas as secrets para GitHub Actions |
| [API-KEYS-REFERENCE.md](./keys/API-KEYS-REFERENCE.md) | Referência de API keys do projeto |
| [GITHUB-TOKENS-TUTORIAL.md](./keys/GITHUB-TOKENS-TUTORIAL.md) | Como criar tokens GitHub |

### 📘 Guias e Tutoriais
| Documento | Descrição |
|-----------|-----------|
| [GUIA_BI_ANALYTICS.md](./guias/GUIA_BI_ANALYTICS.md) | Guia completo do BI Analytics |
| [GUIA-IA-TRYVIANO.md](./guias/GUIA-IA-TRYVIANO.md) | Guia do chatbot IA Tryviano |
| [THEME-SYSTEM-GUIDE.md](./guias/THEME-SYSTEM-GUIDE.md) | Sistema de temas |

### 🔄 Sincronização
| Documento | Descrição |
|-----------|-----------|
| [MANUAL-EXECUCAO-TERMINAL.md](./sync/MANUAL-EXECUCAO-TERMINAL.md) | ⭐ **Passo-a-passo para rodar sync no terminal** |
| [SYNC-SMART-MANUAL.md](./sync/SYNC-SMART-MANUAL.md) | Manual completo do sync-smart.js |

### 📊 Relatórios
| Documento | Descrição |
|-----------|-----------|
| [RELATORIO-DIAGNOSTICO-SYNC.md](./relatorios/RELATORIO-DIAGNOSTICO-SYNC.md) | Diagnóstico do sistema de sync |
| [RELATORIO-AUDITORIA-SISTEMA.md](./relatorios/RELATORIO-AUDITORIA-SISTEMA.md) | Auditoria geral do sistema |

---

## 🆕 Novidades v3.0 (Dezembro 2025)

### 🤖 Chatbot IA Tryviano
- **Agent Loop**: Sistema autônomo de planejamento e execução
- **12 Tools formais**: query_tickets, get_ranking, get_alerts, predict_volume, etc.
- **RAG**: Busca em base de conhecimento para enriquecer respostas
- **Memória**: Short-term, working memory e long-term (localStorage)
- **Avaliador**: Verifica qualidade das respostas (anti-alucinação)
- **Test Suite**: Testes automáticos, stress test e benchmark

### 📊 Novos Módulos BI
- **CSAT/Tempo**: Análise de satisfação e tempo médio de atendimento
- **Acompanhamento**: Visão geral de produtividade por período
- **Date Pickers Corrigidos**: Ficam fixos na posição ao scrollar

### 🧠 Memória de Decisões
- Salvar notas/decisões com tags automáticas
- Busca semântica em decisões anteriores
- Integração com RAG do chatbot

---

## 🚀 Quick Start

### 1. Requisitos
- Navegador moderno (Chrome, Firefox, Edge)
- Node.js 18+ (para o proxy Freshdesk)
- Acesso ao Supabase configurado

### 2. Iniciar o Sistema

```bash
# Instalar dependências do proxy
npm install

# Iniciar proxy Freshdesk (opcional)
npm start

# Abrir o arquivo HTML no navegador
# BI_por_Time(2).html
```

### 3. Carregar Dados

1. Clique em **🎫 Tickets** no menu
2. Clique em **Carregar Tickets** 
3. Aguarde o carregamento do Supabase

---

## 🗂️ Estrutura de Abas

| Aba | Ícone | Descrição |
|-----|-------|-----------|
| Dashboard | 🏠 | Visão geral com KPIs principais |
| Tickets | 🎫 | Lista e filtros de tickets |
| BI Analytics | 📊 | Análises por pessoa/time/produtividade |
| CSAT/Tempo | ⭐ | Satisfação do cliente e tempos de atendimento |
| Acompanhamento | 📈 | Acompanhamento de produtividade |
| Apresentação | 🎥 | Modo slides para reuniões |
| Insights | 💡 | Análise inteligente com IA |
| Relatórios | 📋 | Gerador de relatórios |
| Glossário | 📖 | Documentação de termos |
| Gamificação | 🎮 | Rankings, badges e níveis |
| Releases | 📋 | Histórico de versões |
| Preferências | ⚙️ | Configurações do sistema |

---

## 🚀 Funcionalidades Extras

### 🔍 Busca Global
- Acesse com `Ctrl+K` ou botão na topbar
- Busque por ID (`#123`), agente (`@nome`), prioridade (`!urgente`) ou status (`status:aberto`)

### 📊 Gráficos Interativos
- Clique em qualquer gráfico para ver detalhes
- Aplique como filtro ou exporte para CSV

### 🎮 Gamificação
- **10 níveis** de Novato a Imortal
- **22 conquistas** para desbloquear
- **Ranking** com pontuação baseada em performance

### 🤖 Chatbot IA Tryviano
- Acesse clicando no botão flutuante no canto inferior direito
- Pergunte sobre métricas, SLA, rankings, alertas
- Use comandos como "Anotar: [texto]" para salvar decisões
- O chatbot usa IA (Gemini/Groq) com fallback automático

### 📊 Comandos do Chatbot
| Comando | Exemplo |
|---------|---------|
| Consultar pessoa | "Qual o SLA da Jessica?" |
| Consultar time | "Como está o Time CS?" |
| Ranking | "Quem tem mais tickets?" |
| Alertas | "Tem algum alerta?" |
| Salvar nota | "Anotar: Decidimos priorizar urgentes" |
| Ver notas | "Listar decisões" |
| Navegar | "Ir para Dashboard" |

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+K` | 🔍 Abrir Busca Global |
| `F5` | Recarregar dados |
| `Ctrl+F5` | Hard refresh (limpa cache) |
| `ESC` | Fechar modal/sair de apresentação |
| `←` `→` | Navegar slides (apresentação) |
| `↑` `↓` | Navegar resultados (busca) |
| `Enter` | Selecionar item (busca) |
| `Ctrl+Ç` | Easter egg 🐊 |

---

## 🔧 Configuração

### Supabase
```javascript
// js/supabase-loader.js
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';
```

### Freshdesk (Proxy)
```javascript
// Porta padrão: 3003
// Fallback: 3002, 3001
```

---

## 📱 Responsividade

O sistema é responsivo e funciona em:
- ✅ Desktop (1920px+)
- ✅ Laptop (1024px - 1919px)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (< 768px)

---

## 🆘 Suporte

### Problemas Comuns

**Dados não carregam:**
- Verifique conexão com internet
- Verifique configuração do Supabase
- Tente `Ctrl+F5` para limpar cache

**Gráficos não aparecem:**
- Certifique-se de selecionar entidades
- Clique em "Aplicar Filtros"

**Proxy não conecta:**
- Execute `npm start` na pasta do projeto
- Verifique se a porta 3003 está livre

---

## 📝 Changelog

### Dezembro 2025 (v3.0)
- ✅ **Chatbot IA Tryviano** com Agent Loop autônomo
- ✅ **12 Tools formais** para consultas estruturadas
- ✅ **RAG** (Retrieval Augmented Generation) para contexto
- ✅ **Memória de Decisões** com tags automáticas
- ✅ **Test Suite** para validação automática
- ✅ **Módulo CSAT/Tempo** para satisfação e tempos
- ✅ **Módulo Acompanhamento** para produtividade
- ✅ **Date Pickers corrigidos** (position: absolute)
- ✅ **Retry automático** para rate limit (429) no Gemini
- ✅ **Badge visual** 🤖 para respostas do Agent

### Dezembro 2024 (v2.x)
- ✅ **Busca Global** (Ctrl+K) com sintaxes especiais
- ✅ **Gráficos Interativos** com drill-down e exportação
- ✅ **Gamificação** com ranking, níveis e 22 conquistas
- ✅ **Modo Apresentação** com 30+ templates
- ✅ **Sistema de Relatórios** PDF/Excel
- ✅ **Sincronização Supabase** via GitHub Actions
- ✅ **Web Workers** para performance
- ✅ Tooltips em gráficos expandidos
- ✅ Paginação no ranking de produtividade
- ✅ Clique em barras para ver tickets
- ✅ Melhorias de acessibilidade
- ✅ Responsividade mobile corrigida

---

*Desenvolvido com ❤️ por Tryvia*
