# 📚 Documentação de Componentes

> Sistema de BI e Análise de Tickets - Tryvia
> Última atualização: Março 2026

---

## 📁 Estrutura de Arquivos

```
📦 Projeto Atendimento V-2
├── 📄 BI_por_Time(2).html      # Arquivo principal
├── 📂 js/                       # Módulos JavaScript (43 arquivos)
│   ├── 📊 BI Analytics
│   │   ├── bi-analytics.js          # Classe principal BI Analytics
│   │   ├── bi-analytics-methods.js  # Métodos de cálculo
│   │   ├── bi-analytics-charts.js   # Renderização de gráficos
│   │   ├── bi-analytics-metrics.js  # Métricas avançadas
│   │   ├── bi-analytics-init.js     # Inicialização
│   │   ├── bi-helpers.js            # Helpers do BI
│   │   ├── bi-acompanhamento-module.js # Módulo Acompanhamento
│   │   ├── bi-consolidado-module.js # Módulo Consolidado (Tratativa+Acomp)
│   │   ├── bi-csat-time-module.js   # Módulo CSAT e Tempo
│   │   └── bi-extra-data-module.js  # Dados extras
│   ├── 📈 Relatórios
│   │   ├── reports-module-v3.js     # Gerador de relatórios (PDF)
│   │   ├── reports-enhanced-metrics.js # Métricas avançadas
│   │   ├── reports-enhanced-sections.js # Seções do relatório
│   │   └── reports-insights-engine.js # Motor de insights
│   ├── 🤖 Chatbot/IA
│   │   ├── chatbot.js               # Chatbot principal
│   │   ├── chatbot-intelligence.js  # IA do chatbot
│   │   ├── chatbot-premium.js       # Funcionalidades premium
│   │   ├── chatbot-utils.js         # Utilitários
│   │   ├── ai-transformers.js       # Transformadores de IA
│   │   └── tryviano-knowledge-base.js # Base de conhecimento
│   ├── 🎯 Funcionalidades
│   │   ├── navigation-functions.js  # Funções de navegação
│   │   ├── insights-module.js       # Insights com IA
│   │   ├── glossary-module.js       # Glossário de termos
│   │   ├── glossary-data.js         # Dados do glossário
│   │   ├── presentation-mode-v2.js  # Modo apresentação
│   │   ├── interactive-charts.js    # Gráficos interativos
│   │   ├── global-search.js         # Busca global (Ctrl+K)
│   │   ├── gamification.js          # Gamificação
│   │   ├── gamification-badges.js   # Badges/conquistas
│   │   ├── realtime-dashboard.js    # Dashboard em tempo real
│   │   └── annotations-module.js    # Anotações
│   ├── ⚙️ Configuração
│   │   ├── config/team-members.js   # Membros do time
│   │   ├── status-config.js         # Configuração de status
│   │   ├── theme-colors-config.js   # Cores do tema
│   │   ├── env-config.js            # Variáveis de ambiente
│   │   └── premium-icons.js         # Ícones premium
│   ├── 🔧 Utilitários
│   │   ├── date-range-picker.js     # Seletor de datas
│   │   ├── csat-module.js           # Módulo CSAT
│   │   ├── core-data.js             # Dados core
│   │   ├── logger.js                # Sistema de logs
│   │   └── accessibility-module.js  # Acessibilidade
│   └── 🗄️ Supabase
│       ├── supabase-loader.js       # Cliente Supabase
│       └── supabase-chunked-loader.js # Carregamento em chunks
├── 📂 styles/                   # Estilos CSS modulares
│   ├── bi-dashboard.css         # Variáveis e reset
│   ├── sidebar.css              # Sidebar lateral
│   ├── topbar.css               # Barra superior
│   ├── cards.css                # Cards e KPIs
│   ├── charts.css               # Gráficos
│   ├── modals.css               # Modais
│   ├── animations.css           # Animações e efeitos
│   └── responsive.css           # Media queries
└── 📂 docs/                     # Documentação
```

---

## 🎯 Componentes Principais

### 1. BIAnalytics (Classe Principal)

**Arquivo:** `js/bi-analytics.js`

```javascript
// Instância global
window.biAnalytics

// Propriedades principais
biAnalytics.filteredData      // Dados filtrados atuais
biAnalytics.selectedEntities  // Set de entidades selecionadas
biAnalytics.currentView       // 'pessoa' | 'time' | 'produtividade'
biAnalytics.colors            // Paleta de cores
biAnalytics.gradients         // Array de gradientes
```

**Métodos:**

| Método | Descrição | Parâmetros |
|--------|-----------|------------|
| `renderBI()` | Renderiza a interface completa | - |
| `switchView(view)` | Alterna entre abas | `'pessoa'`, `'time'`, `'produtividade'` |
| `toggleEntity(entity)` | Seleciona/deseleciona entidade | `string` |
| `selectAll()` | Seleciona todas as entidades | - |
| `clearSelection()` | Limpa seleção | - |
| `applyFilters()` | Aplica filtros e recarrega dados | - |
| `renderCharts(metrics)` | Renderiza todos os gráficos | `object` |

---

### 2. Navegação

**Arquivo:** `js/navigation-functions.js`

```javascript
// Funções globais de navegação
window.showTickets()        // Abre aba Tickets
window.showBIAnalytics()    // Abre aba BI Analytics
window.showPresentationMode() // Abre Apresentação
window.showInsights()       // Abre Insights
window.showReports()        // Abre Relatórios
window.showGlossary()       // Abre Glossário
window.toggleSidebar()      // Alterna sidebar

// Helpers
window.showTopbar(show)     // Mostra/esconde topbar
window.hideBIAnalyticsContainer() // Esconde container BI
```

---

### 3. DateRangePicker (Seletor de Datas)

**Arquivo:** `js/date-range-picker.js`

```javascript
// Instância global
window.dateRangePicker

// Propriedades
dateRangePicker.startDate   // Data início selecionada
dateRangePicker.endDate     // Data fim selecionada
dateRangePicker.isOpen      // Estado do picker

// Métodos
dateRangePicker.open(inputRef, callback)  // Abre o picker
dateRangePicker.close()                   // Fecha o picker
dateRangePicker.setRange(start, end)      // Define intervalo
dateRangePicker.getRange()                // Retorna { start, end }
```

**Uso:**
```javascript
dateRangePicker.open(document.getElementById('dateInput'), (range) => {
    console.log('Período:', range.start, 'até', range.end);
});
```

---

### 4. Reports Module V3 (Relatórios)

**Arquivo:** `js/reports-module-v3.js`

```javascript
// Instância global
window.reportsModuleV3

// Tipos de relatório disponíveis
reportsModuleV3.reportTypes = [
    { id: 'executive', name: 'Resumo Executivo', icon: '📊' },
    { id: 'performance', name: 'Performance por Pessoa', icon: '👤' },
    { id: 'sla', name: 'Análise de SLA', icon: '⏱️' },
    { id: 'trends', name: 'Tendências e Volume', icon: '📈' },
    { id: 'backlog', name: 'Backlog e Aging', icon: '📋' },
    { id: 'resolution_time', name: 'Tempo de Resolução', icon: '⏳' }
]

// Métodos
reportsModuleV3.render()             // Renderiza interface
reportsModuleV3.generatePDF()        // Gera PDF do relatório
reportsModuleV3.selectReport(type)   // Seleciona tipo de relatório
```

**Arquivos auxiliares:**
- `reports-enhanced-metrics.js` - Métricas avançadas para relatórios
- `reports-enhanced-sections.js` - Seções customizadas
- `reports-insights-engine.js` - Motor de insights automáticos

---

### 5. Insights Module (Análise Inteligente)

**Arquivo:** `js/insights-module.js`

```javascript
// Instância global
window.insightsModule

// Configurações
insightsModule.config = {
    minSimilarity: 0.6,      // Similaridade para agrupar
    topProblemsCount: 10,    // Quantidade de problemas
    trendDays: 30,           // Dias para tendência
    useAI: true              // Habilitar IA
}

// Métodos
insightsModule.initialize()       // Inicializa
insightsModule.analyzeData()      // Análise básica
insightsModule.runAIAnalysis()    // Análise com IA
insightsModule.exportInsights()   // Exporta JSON
```

---

### 6. Glossary Module (Glossário)

**Arquivo:** `js/glossary-module.js`

```javascript
// Instância global
window.glossaryModule

// Categorias disponíveis
glossaryModule.glossaryData = {
    conceitos: { ... },    // Conceitos básicos
    metricas: { ... },     // Métricas e KPIs
    sla: { ... },          // SLA e tempos
    status: { ... },       // Status de tickets
    filtros: { ... }       // Filtros e campos
}

// Métodos
glossaryModule.initialize()       // Inicializa
glossaryModule.searchTerm(query)  // Busca termo
glossaryModule.showCategory(cat)  // Exibe categoria
```

---

### 7. Presentation Mode (Apresentação)

**Arquivo:** `js/presentation-mode-v2.js`

```javascript
// Instância global
window.presentationMode

// Slides disponíveis
presentationMode.availableSlides = [
    { id: 'overview', title: 'Visão Geral', type: 'kpi' },
    { id: 'chartTop10', title: 'Top 10 - Volume', type: 'chart' },
    // ... mais slides
]

// Métodos
presentationMode.initialize()              // Inicializa
presentationMode.startPresentation()       // Inicia apresentação
presentationMode.stopPresentation()        // Para apresentação
presentationMode.nextSlide()               // Próximo slide
presentationMode.prevSlide()               // Slide anterior
presentationMode.goToSlide(index)          // Ir para slide
presentationMode.generateQuickPresentation(type) // Gera apresentação rápida
// type: 'executive' | 'performance' | 'sla' | 'complete'
```

---

### 8. Supabase Loader

**Arquivo:** `js/supabase-loader.js`

```javascript
// Instância global
window.SupabaseLoader

// Métodos
await SupabaseLoader.getClient()    // Retorna cliente inicializado
SupabaseLoader.isReady()            // Verifica se está pronto

// Cliente compartilhado
window.supabaseClient               // Cliente Supabase
window.supabaseClientBI             // Alias para BI
```

**Uso:**
```javascript
const client = await SupabaseLoader.getClient();
const { data, error } = await client
    .from('Tickets')
    .select('*')
    .limit(100);
```

---

### 9. Status Config (Configuração de Status)

**Arquivo:** `js/status-config.js`

```javascript
// Objeto global
window.FRESHDESK_STATUS

// Métodos
FRESHDESK_STATUS.getLabel(statusCode)     // Retorna label
FRESHDESK_STATUS.getColor(statusCode)     // Retorna cor
FRESHDESK_STATUS.isClosed(statusCode)     // Verifica se fechado
FRESHDESK_STATUS.getSimplifiedCategory(statusCode) // Categoria simplificada

// Mapeamento de status
// 2 = Aberto
// 3 = Pendente
// 4 = Resolvido
// 5 = Fechado
// 6 = Aguardando Cliente
// 7 = Aguardando Terceiro
```

---

## 🎨 Variáveis CSS

**Arquivo:** `styles/bi-dashboard.css`

```css
:root {
  /* Backgrounds */
  --bg: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --card: #1e1e1e;
  --card-hover: #252525;
  --sidebar: #141414;
  --surface: #2a2a3e;
  
  /* Text */
  --text-primary: #e4e4e7;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;
  
  /* Primary */
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --secondary: #8b5cf6;
  
  /* Borders */
  --border: #27272a;
  --border-light: #3f3f46;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

---

## 🔧 Classes de Utilidade

**Arquivo:** `styles/animations.css`

| Classe | Descrição |
|--------|-----------|
| `.truncate` | Trunca texto com ellipsis |
| `.btn-loading` | Estado de loading em botões |
| `.sr-only` | Texto apenas para screen readers |
| `.skip-link` | Link para pular conteúdo |
| `.slide-animation` | Animação de entrada suave |

---

## 📊 Gráficos Disponíveis

| ID do Canvas | Nome | Tipo |
|--------------|------|------|
| `chartTop10` | Top 10 Volume | Barras horizontais |
| `chartResolution` | Taxa de Resolução | Barras verticais |
| `chartStatus` | Por Status | Donut |
| `chartPriority` | Por Prioridade | Barras horizontais |
| `chartTimeline` | Evolução Temporal | Linha |
| `chartSystems` | Por Sistema | Barras horizontais |
| `chartSLA` | Conformidade SLA | Donut |
| `chartSLATrend` | Tendência SLA | Linha com pontos |
| `chartSLAByEntity` | SLA por Pessoa | Barras horizontais |
| `chartProductivityRanking` | Ranking Produtividade | Barras horizontais |
| `chartByDayOfWeek` | Por Dia da Semana | Barras verticais |
| `chartByHour` | Por Hora | Barras verticais |

---

## 🔄 Eventos Globais

```javascript
// Evento de dados carregados
window.addEventListener('ticketsLoaded', (e) => {
    console.log('Tickets carregados:', e.detail.count);
});

// Evento de filtros aplicados
window.addEventListener('filtersApplied', (e) => {
    console.log('Filtros:', e.detail);
});

// Evento de navegação
window.addEventListener('viewChanged', (e) => {
    console.log('Nova view:', e.detail.view);
});
```

---

## 🔐 Dados Globais

```javascript
// Cache de tickets (principal fonte de dados)
window.allTicketsCache      // Todos os tickets carregados

// Dados filtrados atuais
window.ticketsData          // Tickets após filtros

// Dados processados
window.processedData        // Dados processados para gráficos

// Configurações
window.userPreferences      // Preferências do usuário
```

---

## 📱 Breakpoints Responsivos

| Breakpoint | Descrição |
|------------|-----------|
| `1920px+` | Telas grandes (4K) |
| `1440px - 1919px` | Desktop grande |
| `1024px - 1439px` | Desktop médio |
| `900px - 1400px` | Tablet landscape |
| `768px - 900px` | Tablet portrait |
| `< 768px` | Mobile |

---

## 🚀 Quick Start

```javascript
// 1. Carregar dados do Supabase
await SupabaseLoader.getClient();
await loadTicketsFromSupabase();

// 2. Abrir BI Analytics
showBIAnalytics();

// 3. Selecionar entidades
biAnalytics.selectAll();
biAnalytics.applyFilters();

// 4. Gerar relatório
reportsModule.generateReport('executive');
```

---

## ❓ Troubleshooting

### Erro: "BIAnalytics is not defined"
Verifique a ordem de carregamento dos scripts. `bi-analytics.js` deve vir antes dos outros módulos.

### Erro: "Supabase não disponível"
Aguarde a inicialização ou use `await SupabaseLoader.getClient()`.

### Gráficos não aparecem
Verifique se `window.allTicketsCache` tem dados e se as entidades estão selecionadas.

### Tooltips não funcionam
Certifique-se de que o canvas tem as regiões de hover configuradas.

---

---

## 🔍 Global Search (Busca Global)

**Arquivo:** `js/global-search.js`

```javascript
// Instância global
window.GlobalSearch

// Métodos
GlobalSearch.open()           // Abre modal de busca (ou Ctrl+K)
GlobalSearch.close()          // Fecha modal
GlobalSearch.search(query)    // Executa busca
```

**Sintaxes especiais:**

| Sintaxe | O que faz |
|---------|-----------|
| `#123` | Busca ticket por ID |
| `@nome` | Busca por agente |
| `!urgente` | Busca por prioridade (baixa, media, alta, urgente) |
| `status:aberto` | Busca por status (aberto, pendente, resolvido, fechado) |

**Atalhos:**
- `Ctrl+K` - Abrir busca
- `↑↓` - Navegar resultados
- `Enter` - Selecionar
- `ESC` - Fechar

---

## 📊 Interactive Charts (Gráficos Interativos)

**Arquivo:** `js/interactive-charts.js`

```javascript
// Instância global
window.InteractiveCharts

// Métodos
InteractiveCharts.onChartClick(type, data)    // Chamado ao clicar
InteractiveCharts.showDetails(type, data)     // Mostra modal de detalhes
InteractiveCharts.addFilter(type, data)       // Adiciona filtro
InteractiveCharts.clearAllFilters()           // Limpa filtros
InteractiveCharts.exportDetails()             // Exporta CSV
```

**Tipos de gráfico suportados:**
- `status` - Por status
- `priority` - Por prioridade
- `person` - Por pessoa
- `team` - Por time
- `system` - Por sistema
- `month` - Por mês
- `sla` - Por SLA

---

## 🎮 Gamification (Gamificação)

**Arquivo:** `js/gamification.js`

```javascript
// Instância global
window.Gamification

// Métodos
Gamification.open()                  // Abre painel
Gamification.close()                 // Fecha painel
Gamification.showTab('ranking')      // Mostra aba (ranking, badges, levels)
Gamification.calculateStats(name)    // Calcula stats de uma pessoa
Gamification.getLevel(resolved)      // Retorna nível baseado em tickets
Gamification.calculateScore(stats)   // Calcula pontuação
```

### Fórmula de Pontuação

```javascript
score = (resolved × 10) + (slaPercent/100 × resolved × 5) + (urgentResolved × 5) + (maxStreak × 2)
```

| Componente | Fórmula | Exemplo |
|------------|---------|---------|
| Base | Tickets × 10 | 100 tkt = 1000 pts |
| Bônus SLA | (SLA%/100) × Tkt × 5 | 90% × 100 = 450 pts |
| Bônus Urgentes | Urgentes × 5 | 20 = 100 pts |
| Bônus Streak | Dias × 2 | 15 = 30 pts |

### Sistema de Níveis

| Nível | Nome | Tickets | Cor |
|-------|------|---------|-----|
| 1 | Novato | 0+ | Cinza |
| 2 | Iniciante | 50+ | Azul |
| 3 | Aprendiz | 150+ | Verde |
| 4 | Competente | 300+ | Roxo |
| 5 | Proficiente | 500+ | Amarelo |
| 6 | Especialista | 800+ | Vermelho |
| 7 | Mestre | 1200+ | Rosa |
| 8 | Grão-Mestre | 1800+ | Teal |
| 9 | Lenda | 2500+ | Laranja |
| 10 | Imortal | 5000+ | Dourado |

### Conquistas (22 badges)

**Volume:**
- 🎯 Primeiro Passo (1 ticket)
- 🔥 Esquentando (10 tickets)
- ⚡ Produtivo (50 tickets)
- 💯 Centurião (100 tickets)
- 🏅 Veterano (500 tickets)
- 👑 Lendário (1000 tickets)

**SLA:**
- 🛡️ Guardião do SLA (>= 90%)
- 💎 Mestre do SLA (>= 98%)
- 🏆 SLA Perfeito (100% com 10+ tickets)

**Velocidade:**
- 🚀 Velocista (tempo médio < 4h)
- ⏱️ Resposta Rápida (1ª resposta < 1h)
- ✅ Resolutor (taxa > 80%)
- 🎖️ Fechador (taxa > 95%)

**Especiais:**
- 🧯 Bombeiro (20+ urgentes)
- 🦸 Guerreiro de FDS (5+ no fim de semana)
- 🦉 Coruja Noturna (10+ após 22h)
- 🐦 Madrugador (10+ antes das 7h)
- 🔥 Sequência de 7 (7 dias seguidos)
- 💪 Sequência de 30 (30 dias seguidos)
- 🎪 Pau pra Toda Obra (5+ tipos)
- 🤝 Jogador de Equipe (3+ times)

---

---

## 🔄 BI Consolidado Module (NOVO)

**Arquivo:** `js/bi-consolidado-module.js`

```javascript
// Instância global
window.BIConsolidadoModule

// Métodos
BIConsolidadoModule.render(containerId)      // Renderiza aba
BIConsolidadoModule.setPeriod(period)        // Define período
BIConsolidadoModule.showTicketsModal(index)  // Mostra tickets da pessoa
BIConsolidadoModule.calculateConsolidatedStats(tickets) // Calcula estatísticas
```

**Funcionalidades:**
- Combina dados de `cf_tratativa` + `cf_acompanhamento_atendimento`
- Evita duplicação de tickets por pessoa
- Ranking clicável para ver tickets
- Análise de cruzamento de dados (fontes)

---

## 🤖 Chatbot / Tryviano

**Arquivos:**
- `chatbot.js` - Interface principal do chatbot
- `chatbot-intelligence.js` - Lógica de IA e respostas
- `chatbot-premium.js` - Funcionalidades premium
- `chatbot-utils.js` - Utilitários
- `tryviano-knowledge-base.js` - Base de conhecimento

```javascript
// Instância global
window.Chatbot

// Métodos
Chatbot.open()           // Abre chatbot
Chatbot.close()          // Fecha chatbot
Chatbot.sendMessage(msg) // Envia mensagem
```

---

## ⚙️ Configurações do Sistema

### Team Members
**Arquivo:** `js/config/team-members.js`

```javascript
// Configuração global
window.TEAM_MEMBERS_CONFIG = {
    'Atendimento': ['Adriana Florencio', 'Jéssica Dias', ...],
    'DEV': ['Isaac Alvim', 'Lucas Rodrigues', ...],
    // ...
}
```

### Theme Colors
**Arquivo:** `js/theme-colors-config.js`

```javascript
// Temas disponíveis
window.THEME_COLORS = {
    dark: { primary: '#8b5cf6', ... },
    'tryvia-cyan': { primary: '#00e4ff', ... }
}
```

### Environment Config
**Arquivo:** `js/env-config.js`

```javascript
// Configurações de ambiente
window.ENV_CONFIG = {
    SUPABASE_URL: '...',
    SUPABASE_ANON_KEY: '...',
    // ...
}
```

---

## 📊 Campos de Dados Importantes

| Campo | Localização | Descrição |
|-------|-------------|-----------|
| `cf_tratativa` | Ticket | Pessoa responsável pela tratativa |
| `cf_grupo_tratativa` | Ticket | Time responsável |
| `cf_acompanhamento_atendimento` | Ticket | Pessoa de acompanhamento |
| `custom_fields.cf_teste` | JSON | **Sistema/Produto** (SING, OPTZ, Telemetria) |
| `type` | Ticket | Tipo do ticket |
| `status` | Ticket | Status numérico (2=Aberto, 4=Resolvido, etc.) |

> **⚠️ Nota:** Os campos `cf_sistema` e `cf_produto` existem mas estão geralmente vazios. Use `custom_fields.cf_teste` para o Sistema/Produto.

---

*Documentação atualizada - Março 2026*
