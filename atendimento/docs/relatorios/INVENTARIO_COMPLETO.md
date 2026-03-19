# ════════════════════════════════════════════════════════════════════════════════
# INVENTÁRIO COMPLETO DO SISTEMA
# ════════════════════════════════════════════════════════════════════════════════

---

# 1. ESTRUTURA DE DIRETÓRIOS

```
c:\Users\Operaciona-19\Desktop\Projeto atendimento V-2\
│
├── BI_por_Time(2).html          # Arquivo principal (393 KB)
├── tryvia.png                    # Logo
│
├── js/                           # Scripts JavaScript
│   ├── config/                   # Configurações
│   │   └── team-members.js       # 2.5 KB
│   │
│   ├── ai-transformers.js        # 26 KB - IA local
│   ├── annotations-module.js     # 54 KB - Anotações
│   ├── bi-acompanhamento-module.js # 177 KB - BI Acompanhamento
│   ├── bi-analytics.js           # 195 KB - BI Principal
│   ├── bi-analytics-charts.js    # 151 KB - Gráficos BI
│   ├── bi-analytics-init.js      # 2 KB - Init BI
│   ├── bi-analytics-methods.js   # 265 KB - Métodos BI
│   ├── bi-analytics-metrics.js   # 18 KB - Métricas BI
│   ├── bi-csat-time-module.js    # 91 KB - CSAT e Tempo
│   ├── bi-extra-data-module.js   # 30 KB - Dados extras
│   ├── bi-helpers.js             # 24 KB - Tooltips (?)
│   ├── chatbot.js                # 285 KB - Chatbot principal
│   ├── chatbot-intelligence.js   # 35 KB - IA Chatbot
│   ├── chatbot-premium.js        # 73 KB - UI Premium
│   ├── chatbot-utils.js          # 22 KB - Utils Chatbot
│   ├── core-data.js              # 15 KB - Dados core
│   ├── date-range-picker.js      # 45 KB - Seletor datas
│   ├── env-config.js             # 3 KB - Variáveis ambiente
│   ├── gamification.js           # 35 KB - Gamificação
│   ├── gamification-badges.js    # 50 KB - Badges
│   ├── global-search.js          # 24 KB - Busca global
│   ├── glossary-data.js          # 378 KB - Dados glossário
│   ├── glossary-module.js        # 15 KB - Módulo glossário
│   ├── insights-module.js        # 96 KB - Insights
│   ├── interactive-charts.js     # 25 KB - Gráficos interativos
│   ├── logger.js                 # 4 KB - Sistema de logs
│   ├── navigation-functions.js   # 16 KB - Navegação
│   ├── premium-icons.js          # 6 KB - Ícones SVG
│   ├── presentation-mode-v2.js   # 184 KB - Apresentação
│   ├── realtime-dashboard.js     # 26 KB - Dashboard realtime
│   ├── reports-module.js         # 99 KB - Relatórios v1 ❌ DEPRECADO
│   ├── reports-module-v2.js      # 46 KB - Relatórios v2 ❌ DEPRECADO
│   ├── reports-module-v3.js      # 115 KB - Relatórios v3 ✅ ATUAL
│   ├── status-config.js          # 4.5 KB - Status Freshdesk
│   ├── supabase-chunked-loader.js # 8.5 KB - Loader chunks
│   ├── supabase-loader.js        # 3 KB - Loader simples
│   ├── theme-colors-config.js    # 7 KB - Cores temas
│   ├── tryviano-knowledge-base.js # 73 KB - Base conhecimento
│   └── accessibility-module.js   # 21 KB - Acessibilidade
│
├── styles/                       # Estilos CSS
│   ├── base/                     # Estilos base
│   ├── components/               # Componentes
│   ├── themes/                   # Temas
│   ├── accessibility.css         # 13 KB
│   ├── animations.css            # 4 KB
│   ├── bi-dashboard.css          # 24 KB
│   ├── cards.css                 # 4 KB
│   ├── charts.css                # 5 KB
│   ├── modals.css                # 2 KB
│   ├── presentation.css          # 2 KB
│   ├── presentation-premium.css  # 25 KB
│   ├── reports-premium.css       # 14 KB
│   ├── responsive.css            # 4 KB
│   ├── sidebar.css               # 5 KB
│   ├── sidebar-premium.css       # 10 KB
│   └── topbar.css                # 2 KB
│
├── docs/                         # Documentação
│   ├── arquitetura/              # Docs arquitetura
│   ├── guias/                    # Guias de uso
│   ├── keys/                     # Chaves API
│   ├── relatorios/               # Relatórios (este)
│   ├── sync/                     # Sincronização
│   └── README.md                 # Readme principal
│
└── proxy/                        # Proxy Node.js
    └── freshdesk-proxy.js        # Proxy Freshdesk
```

---

# 2. ANÁLISE POR ARQUIVO

## 2.1 Arquivos de Configuração

### env-config.js (3 KB)
```
LOCALIZAÇÃO: js/env-config.js
RESPONSABILIDADE: Variáveis de ambiente (Supabase URL, API keys)
DEPENDÊNCIAS: Nenhuma (carrega primeiro)
EXPÕE: window.EnvConfig

CONTEÚDO:
- Credenciais Supabase
- Configurações de ambiente
- Deve ser carregado PRIMEIRO

STATUS: ✅ BEM ESTRUTURADO
```

### status-config.js (4.5 KB)
```
LOCALIZAÇÃO: js/status-config.js
RESPONSABILIDADE: Mapeamento de status do Freshdesk
DEPENDÊNCIAS: Nenhuma
EXPÕE: window.FRESHDESK_STATUS

CONTEÚDO:
- MAP: Mapa completo de status (ID → label, color, icon, category)
- CATEGORIES: Agrupamentos para gráficos
- CLOSED_IDS: [4, 5]
- OPEN_IDS: [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
- Métodos helpers: getLabel(), getColor(), isClosed()

STATUS: ✅ BEM ESTRUTURADO - USAR COMO REFERÊNCIA ÚNICA
```

### theme-colors-config.js (7 KB)
```
LOCALIZAÇÃO: js/theme-colors-config.js
RESPONSABILIDADE: Paleta de cores para temas
DEPENDÊNCIAS: Nenhuma
EXPÕE: 
- window.THEME_COLORS_CONFIG
- window.getThemeColor(name)
- window.getCurrentThemeColors()

TEMAS:
- 'dark': Tema escuro padrão
- 'tryvia-cyan': Tema claro

STATUS: ✅ BEM ESTRUTURADO - USAR COMO REFERÊNCIA ÚNICA
```

### config/team-members.js (2.5 KB)
```
LOCALIZAÇÃO: js/config/team-members.js
RESPONSABILIDADE: Lista de membros da equipe
DEPENDÊNCIAS: Nenhuma
EXPÕE: window.TEAM_MEMBERS_CONFIG

CONTEÚDO:
- teams: { 'Atendimento': [...], 'DEV': [...] }
- aliases: { 'adriana': 'Adriana Florencio', ... }

STATUS: ✅ BEM ESTRUTURADO
```

---

## 2.2 Arquivos Core

### core-data.js (15 KB, ~355 linhas)
```
LOCALIZAÇÃO: js/core-data.js
RESPONSABILIDADE: Gerenciamento de dados e lookups
DEPENDÊNCIAS: Supabase (opcional)
EXPÕE:
- window.DATA
- window.FD_LOOKUPS
- window.resolveAgentName()
- window.resolveGroupName()
- window.resolveCompanyName()
- window.loadFreshdeskLookups()
- window.buildDATAFromTickets()

FUNÇÕES PRINCIPAIS:
1. loadFreshdeskLookups() - Carrega agentes, grupos, empresas
2. loadLookupsFromSupabase() - Fallback para Supabase
3. syncLookupsFromProxyToSupabase() - Sincroniza lookups
4. buildDATAFromTickets() - Constrói estrutura DATA
5. updateGlobalDATAFromTickets() - Atualiza dados globais

STATUS: ✅ BEM ESTRUTURADO
```

### navigation-functions.js (16 KB, ~414 linhas)
```
LOCALIZAÇÃO: js/navigation-functions.js
RESPONSABILIDADE: Navegação entre abas do sistema
DEPENDÊNCIAS: Nenhuma direta
EXPÕE:
- window.toggleSidebar()
- window.showTickets()
- window.showBIAnalytics()
- window.showPresentationSetup()
- window.showInsights()
- window.showReports()
- window.showGlossary()
- window.showThemes()
- window.showPreferences()

FUNÇÕES:
1. toggleSidebar() - Alterna sidebar
2. showTickets() - Mostra aba Tickets
3. showBIAnalytics() - Mostra BI Analytics
4. showReports() - Mostra Relatórios V3
5. ... outras navegações

STATUS: ✅ BEM ESTRUTURADO
```

---

## 2.3 Módulos BI Analytics

### bi-analytics.js (195 KB, ~4174 linhas)
```
LOCALIZAÇÃO: js/bi-analytics.js
RESPONSABILIDADE: Classe principal do BI Analytics
DEPENDÊNCIAS: status-config.js, theme-colors-config.js
EXPÕE:
- class BIAnalytics
- window.biAnalytics (instância)
- window.expandChart()
- window.expandChartNavigate()
- window.setupCanvas()

CLASSE BIAnalytics:
- constructor() - Inicializa estado
- getThemeColors() - Obtém cores do tema
- loadData() - Carrega dados
- applyFilters() - Aplica filtros
- calculateMetrics() - Calcula métricas
- render() - Renderiza interface

PROBLEMAS IDENTIFICADOS:
- Arquivo muito grande (195 KB)
- Algumas funções poderiam ser extraídas
- Função expandChart() deveria estar em arquivo separado

RECOMENDAÇÃO: Manter, mas considerar extrair expandChart para 
              js/components/chart-expander.js
```

### bi-analytics-methods.js (265 KB, ~4891 linhas)
```
LOCALIZAÇÃO: js/bi-analytics-methods.js
RESPONSABILIDADE: Métodos adicionais da classe BIAnalytics
DEPENDÊNCIAS: bi-analytics.js (DEVE carregar depois)
PADRÃO: Object.assign(BIAnalytics.prototype, { ... })

MÉTODOS ADICIONADOS:
1. getStatusLabel() / getStatusColor() - Helpers de status
2. normalizePersonName() - Normaliza nomes
3. calculateBusinessHours() - Cálculo horas úteis ⚠️ DUPLICADO
4. Métodos de análise de SLA
5. Métodos de métricas por pessoa/time

PROBLEMAS IDENTIFICADOS:
- Arquivo muito grande (265 KB)
- PERSON_ALIASES duplicado (linha 99-122)
- calculateBusinessHours() duplicado

RECOMENDAÇÃO: 
- Mover PERSON_ALIASES para team-members.js
- Mover calculateBusinessHours() para utils/business-hours.js
```

### bi-analytics-charts.js (151 KB, ~2885 linhas)
```
LOCALIZAÇÃO: js/bi-analytics-charts.js
RESPONSABILIDADE: Renderização de todos os gráficos
DEPENDÊNCIAS: bi-analytics.js
PADRÃO: Object.assign(BIAnalytics.prototype, { ... })

GRÁFICOS IMPLEMENTADOS:
- renderCharts() - Orquestra todos os gráficos
- renderTop10Chart() - Top 10 pessoas/times
- renderTicketsPorTratativaChart() - Por tratativa
- renderResolutionChart() - Taxa de resolução
- renderStatusChart() - Distribuição por status
- renderPriorityChart() - Por prioridade
- renderTimelineChart() - Timeline temporal
- renderSystemsChart() - Por sistema
- renderSLAChart() - SLA geral
- renderSLAByEntityChart() - SLA por pessoa/time
- renderFirstResponseChart() - 1ª resposta
- renderByDayOfWeekChart() - Por dia da semana
- renderByHourChart() - Por hora
- renderHeatmapChart() - Mapa de calor
- renderWorkloadChart() - Carga de trabalho
- renderComparativoMensalChart() - Comparativo mensal
- renderTendenciaChart() - Tendência
- renderAgingHistogramChart() - Aging
- renderPendentesChart() - Pendentes

PROBLEMAS:
- Código de renderização duplicado com outros módulos
- Poderia usar ChartRenderers centralizado

RECOMENDAÇÃO: Extrair lógica comum para js/components/chart-renderers.js
```

### bi-analytics-metrics.js (18 KB, ~400 linhas)
```
LOCALIZAÇÃO: js/bi-analytics-metrics.js
RESPONSABILIDADE: Cálculos de métricas e KPIs
DEPENDÊNCIAS: bi-analytics.js
EXPÕE: Métodos adicionados a BIAnalytics.prototype

MÉTRICAS:
- calculateSummaryMetrics()
- calculateSLAMetrics()
- calculateProductivityMetrics()
- calculateTrendMetrics()

STATUS: ✅ BEM ESTRUTURADO - Tamanho adequado
```

### bi-analytics-init.js (2 KB, ~50 linhas)
```
LOCALIZAÇÃO: js/bi-analytics-init.js
RESPONSABILIDADE: Inicialização do módulo BI
DEPENDÊNCIAS: bi-analytics.js e todos os *-methods.js

FUNÇÃO:
- Cria instância window.biAnalytics
- Configura event listeners
- Inicia carregamento de dados

STATUS: ✅ BEM ESTRUTURADO
```

### bi-helpers.js (24 KB, ~695 linhas)
```
LOCALIZAÇÃO: js/bi-helpers.js
RESPONSABILIDADE: Tooltips informativos (botões ?)
DEPENDÊNCIAS: Nenhuma direta
EXPÕE: window.BIHelpers

FUNCIONALIDADES:
- HELPERS_CONFIG: Configuração de tooltips por gráfico
- showTooltip() - Mostra tooltip
- hideTooltip() - Esconde tooltip
- refresh() - Atualiza tooltips

STATUS: ✅ BEM ESTRUTURADO
```

### bi-acompanhamento-module.js (177 KB, ~3479 linhas)
```
LOCALIZAÇÃO: js/bi-acompanhamento-module.js
RESPONSABILIDADE: BI por cf_acompanhamento_atendimento
DEPENDÊNCIAS: allTicketsCache
EXPÕE: window.BIAcompanhamentoModule

PROBLEMAS IDENTIFICADOS:
- MUITO GRANDE (177 KB)
- allowedPeople duplicado (linha 57-67) ⚠️
- nameMapping duplicado (linha 69-84) ⚠️
- Código de gráficos duplicado

RECOMENDAÇÃO:
- Usar window.TEAM_MEMBERS_CONFIG para pessoas
- Usar ChartRenderers para gráficos
- Reduzir tamanho em ~50%
```

### bi-consolidado-module.js (~35 KB, ~850 linhas)
```
LOCALIZAÇÃO: js/bi-consolidado-module.js
RESPONSABILIDADE: BI Consolidado (Tratativa + Acompanhamento)
DEPENDÊNCIAS: allTicketsCache
EXPÕE: window.BIConsolidadoModule

FUNCIONALIDADES:
- Combina cf_tratativa + cf_acompanhamento_atendimento
- Evita duplicação de tickets por pessoa
- Ranking com clique para ver tickets
- Análise de cruzamento de dados (fontes)

CAMPOS UTILIZADOS:
- cf_tratativa: Pessoa que tratou
- cf_acompanhamento_atendimento: Pessoa que acompanhou
- custom_fields.cf_teste: Sistema/Produto (SING, OPTZ, etc.)

STATUS: ✅ NOVO MÓDULO (Março/2026)
```

### bi-csat-time-module.js (91 KB, ~1745 linhas)
```
LOCALIZAÇÃO: js/bi-csat-time-module.js
RESPONSABILIDADE: CSAT e tempo registrado
DEPENDÊNCIAS: Supabase, env-config.js
EXPÕE: window.BICSATModule

FUNCIONALIDADES:
- Carrega dados de CSAT do Supabase
- Carrega time entries
- Renderiza cards e gráficos

PROBLEMAS:
- colors hardcoded (linha 93-100) ⚠️

RECOMENDAÇÃO: Usar window.getCurrentThemeColors()
```

### bi-extra-data-module.js (30 KB, ~700 linhas)
```
LOCALIZAÇÃO: js/bi-extra-data-module.js
RESPONSABILIDADE: Dados extras para BI
DEPENDÊNCIAS: bi-analytics.js

STATUS: ✅ TAMANHO ADEQUADO
```

---

## 2.4 Módulos Chatbot

### chatbot.js (285 KB, ~6149 linhas) ⚠️ CRÍTICO
```
LOCALIZAÇÃO: js/chatbot.js
RESPONSABILIDADE: Chatbot principal com IA
DEPENDÊNCIAS: allTicketsCache, glossary-data.js
EXPÕE: window.Chatbot

CONTEÚDO (MUITO MISTURADO):
1. businessRules (~100 linhas) - Regras SLA, horário, feriados
2. organizacao (~50 linhas) - Hierarquia, gestores
3. findPerson() (~40 linhas) - Busca fuzzy
4. getRequesterHistory() (~25 linhas) - Histórico solicitante
5. getPersonWorkload() (~25 linhas) - Carga pessoa
6. predictVolume() (~80 linhas) - Previsão volume
7. ... + ~5700 linhas de UI, patterns, IA

PROBLEMAS CRÍTICOS:
- ARQUIVO MUITO GRANDE (285 KB)
- Mistura de responsabilidades
- feriados duplicados (linha 44-57)
- businessRules deveria ser centralizado
- Impossível testar unitariamente

RECOMENDAÇÃO: Dividir em 5-6 arquivos menores
```

### chatbot-utils.js (22 KB, ~560 linhas)
```
LOCALIZAÇÃO: js/chatbot-utils.js
RESPONSABILIDADE: Funções compartilhadas
DEPENDÊNCIAS: Nenhuma
EXPÕE: window.ChatbotUtils

CONTEÚDO:
- slaPorPrioridade (DUPLICADO de chatbot.js)
- horarioComercial (DUPLICADO)
- carregarFeriados() - Carrega do Supabase
- getFeriadosFallback() - Fallback hardcoded (DUPLICADO)
- isDiaUtil() - Verifica dia útil
- calcularHorasUteis() - Calcula horas (DUPLICADO)

PROBLEMAS:
- Duplicação com chatbot.js
- Deveria ser a ÚNICA fonte

RECOMENDAÇÃO: Centralizar em business-hours.js
```

### chatbot-premium.js (73 KB, ~1853 linhas)
```
LOCALIZAÇÃO: js/chatbot-premium.js
RESPONSABILIDADE: UI Premium do chatbot
DEPENDÊNCIAS: chatbot.js
EXPÕE: Adiciona estilos e funcionalidades premium

CONTEÚDO:
- CSS inline premium (~500 linhas)
- Animações
- Layout avançado

STATUS: OK - Separação correta de UI
```

### chatbot-intelligence.js (35 KB, ~852 linhas)
```
LOCALIZAÇÃO: js/chatbot-intelligence.js
RESPONSABILIDADE: Análise preditiva e padrões
DEPENDÊNCIAS: chatbot.js
EXPÕE: window.TryvianoIntelligence

CONTEÚDO:
- predictVolume() - Previsão de volume
- detectAnomalies() - Detecção de anomalias
- getDailyCounts() - Contagem diária
- calculateMovingAverage() - Média móvel
- calculateTrend() - Tendência

STATUS: ✅ BEM ESTRUTURADO - Boa separação
```

### tryviano-knowledge-base.js (73 KB, ~1500 linhas)
```
LOCALIZAÇÃO: js/tryviano-knowledge-base.js
RESPONSABILIDADE: Base de conhecimento do chatbot
DEPENDÊNCIAS: Nenhuma
EXPÕE: window.TryvianoKB

CONTEÚDO:
- Respostas predefinidas
- Padrões de perguntas
- Templates de resposta

STATUS: ✅ OK - Dados estáticos separados
```

---

## 2.5 Módulos de Relatórios

### reports-module.js (99 KB) ❌ DEPRECADO
```
LOCALIZAÇÃO: js/reports-module.js
STATUS: ❌ DEPRECADO - EXCLUIR
MOTIVO: Substituído por reports-module-v3.js
```

### reports-module-v2.js (46 KB) ❌ DEPRECADO
```
LOCALIZAÇÃO: js/reports-module-v2.js
STATUS: ❌ DEPRECADO - EXCLUIR
MOTIVO: Substituído por reports-module-v3.js

PROBLEMAS ENCONTRADOS:
- statusMap duplicado (linha 34-54)
- colors duplicado (linha 18-30)
```

### reports-module-v3.js (115 KB, ~1997 linhas) ✅ ATUAL
```
LOCALIZAÇÃO: js/reports-module-v3.js
RESPONSABILIDADE: Sistema de relatórios V3
DEPENDÊNCIAS: allTicketsCache
EXPÕE: window.reportsModuleV3, window.reportsV3

TIPOS DE RELATÓRIO:
1. executive - Resumo Executivo
2. performance - Performance por Agente
3. sla - Análise de SLA
4. trends - Tendências
5. backlog - Backlog & Aging

FUNCIONALIDADES:
- Filtros (período, time, agente, prioridade, status, SLA)
- Geração de gráficos
- Exportação Excel/PDF
- Modais de ajuda

STATUS: ✅ USAR ESTE - É o módulo atual
```

---

## 2.6 Outros Módulos

### presentation-mode-v2.js (184 KB, ~3807 linhas)
```
LOCALIZAÇÃO: js/presentation-mode-v2.js
RESPONSABILIDADE: Modo apresentação para reuniões
EXPÕE: window.presentationMode

PROBLEMAS:
- statusMap com fallback extenso (linha 110-139) ⚠️
- Código de gráficos duplicado
- MUITO GRANDE (184 KB)

RECOMENDAÇÃO:
- Usar window.FRESHDESK_STATUS
- Usar ChartRenderers
```

### insights-module.js (96 KB, ~2330 linhas)
```
LOCALIZAÇÃO: js/insights-module.js
RESPONSABILIDADE: Análise inteligente de tickets
EXPÕE: window.insightsModule

PROBLEMAS:
- colors hardcoded (linha 57-70) ⚠️

RECOMENDAÇÃO: Usar getCurrentThemeColors()
```

### gamification.js (35 KB, ~745 linhas)
```
LOCALIZAÇÃO: js/gamification.js
RESPONSABILIDADE: Sistema de gamificação
EXPÕE: window.Gamification

PROBLEMAS:
- colors hardcoded (linha 55-65) ⚠️

RECOMENDAÇÃO: Usar getCurrentThemeColors()
```

### glossary-data.js (378 KB, ~8000 linhas) ⚠️ MUITO GRANDE
```
LOCALIZAÇÃO: js/glossary-data.js
RESPONSABILIDADE: Dados do glossário
EXPÕE: window.GLOSSARY_DATA

PROBLEMA CRÍTICO:
- MUITO GRANDE (378 KB)
- Carrega mesmo sem usar glossário
- Tempo de parse ~300ms

RECOMENDAÇÃO: Implementar lazy loading
```

### glossary-module.js (15 KB, ~277 linhas)
```
LOCALIZAÇÃO: js/glossary-module.js
RESPONSABILIDADE: Renderização do glossário
EXPÕE: window.glossaryModule

PROBLEMAS:
- getColors() com fallback extenso (linha 7-38) ⚠️

RECOMENDAÇÃO: Usar getCurrentThemeColors()
```

### global-search.js (24 KB, ~627 linhas)
```
LOCALIZAÇÃO: js/global-search.js
RESPONSABILIDADE: Busca global de tickets
EXPÕE: window.GlobalSearch

PROBLEMAS:
- colors hardcoded (linha 16-26) ⚠️

RECOMENDAÇÃO: Usar getCurrentThemeColors()
```

### date-range-picker.js (45 KB, ~1070 linhas)
```
LOCALIZAÇÃO: js/date-range-picker.js
RESPONSABILIDADE: Seletor de intervalo de datas
EXPÕE: window.DateRangePicker

PROBLEMAS:
- colors hardcoded (linha 18-30) ⚠️

RECOMENDAÇÃO: Usar getCurrentThemeColors()
```

### annotations-module.js (54 KB, ~1212 linhas)
```
LOCALIZAÇÃO: js/annotations-module.js
RESPONSABILIDADE: Sistema de anotações
EXPÕE: window.annotationsModule

STATUS: ✅ OK
```

---

# 3. RESUMO DE PROBLEMAS POR ARQUIVO

| Arquivo | Tamanho | Problemas | Ação |
|---------|---------|-----------|------|
| reports-module.js | 99 KB | Deprecado | EXCLUIR |
| reports-module-v2.js | 46 KB | Deprecado | EXCLUIR |
| chatbot.js | 285 KB | Muito grande | DIVIDIR |
| bi-analytics-methods.js | 265 KB | Duplicações | REFATORAR |
| bi-acompanhamento-module.js | 177 KB | Duplicações | REFATORAR |
| presentation-mode-v2.js | 184 KB | Duplicações | REFATORAR |
| glossary-data.js | 378 KB | Muito grande | LAZY LOAD |
| gamification.js | 35 KB | Cores duplicadas | ATUALIZAR |
| global-search.js | 24 KB | Cores duplicadas | ATUALIZAR |
| insights-module.js | 96 KB | Cores duplicadas | ATUALIZAR |
| glossary-module.js | 15 KB | Cores duplicadas | ATUALIZAR |
| date-range-picker.js | 45 KB | Cores duplicadas | ATUALIZAR |
| bi-csat-time-module.js | 91 KB | Cores duplicadas | ATUALIZAR |

---

# 4. PRIORIZAÇÃO DE AÇÕES

## Prioridade 1 (Imediata - Baixo Risco)
1. Excluir reports-module.js
2. Excluir reports-module-v2.js
3. Criar business-hours.js
4. Criar business-rules.js

## Prioridade 2 (Curto Prazo - Médio Risco)
1. Substituir cores duplicadas (15 arquivos)
2. Substituir statusMap duplicados (3 arquivos)
3. Implementar lazy loading para glossary-data.js

## Prioridade 3 (Médio Prazo - Alto Risco)
1. Dividir chatbot.js
2. Criar ChartRenderers
3. Extrair JS do HTML

---

*Inventário Completo - Março 2026*
