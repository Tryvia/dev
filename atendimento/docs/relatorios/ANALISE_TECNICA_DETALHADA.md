# ════════════════════════════════════════════════════════════════════════════════
# ANÁLISE TÉCNICA DETALHADA - PARTE 2
# ════════════════════════════════════════════════════════════════════════════════

---

# 1. MAPA DE DEPENDÊNCIAS COMPLETO

## 1.1 Fluxo de Carregamento de Scripts (Ordem Crítica)

```
ORDEM DE CARREGAMENTO RECOMENDADA:
══════════════════════════════════

[1] CONFIGURAÇÕES (devem carregar primeiro)
    ├── env-config.js
    ├── status-config.js
    ├── theme-colors-config.js
    └── config/team-members.js

[2] CORE DATA
    └── core-data.js

[3] SUPABASE
    ├── supabase-loader.js
    └── supabase-chunked-loader.js

[4] BI ANALYTICS (ordem específica!)
    ├── bi-analytics.js          (classe base)
    ├── bi-analytics-methods.js  (métodos adicionais)
    ├── bi-analytics-charts.js   (gráficos)
    ├── bi-analytics-metrics.js  (métricas)
    └── bi-analytics-init.js     (inicialização)

[5] MÓDULOS BI AUXILIARES
    ├── bi-helpers.js
    ├── bi-acompanhamento-module.js
    ├── bi-csat-time-module.js
    └── bi-extra-data-module.js

[6] UTILITÁRIOS
    ├── logger.js
    ├── date-range-picker.js
    ├── navigation-functions.js
    └── global-search.js

[7] CHATBOT
    ├── chatbot-utils.js         (primeiro!)
    ├── chatbot.js
    ├── chatbot-premium.js
    ├── chatbot-intelligence.js
    └── tryviano-knowledge-base.js

[8] RELATÓRIOS
    └── reports-module-v3.js     (ÚNICO!)

[9] OUTROS MÓDULOS
    ├── presentation-mode-v2.js
    ├── insights-module.js
    ├── glossary-data.js
    ├── glossary-module.js
    ├── gamification-badges.js
    ├── gamification.js
    ├── annotations-module.js
    ├── interactive-charts.js
    ├── realtime-dashboard.js
    ├── accessibility-module.js
    ├── ai-transformers.js
    └── premium-icons.js
```

## 1.2 Variáveis Globais Utilizadas

| Variável | Definida em | Usada por | Tipo |
|----------|-------------|-----------|------|
| window.allTicketsCache | BI_por_Time(2).html | 18 arquivos | Array |
| window.biAnalytics | bi-analytics.js | 12 arquivos | Object |
| window.FRESHDESK_STATUS | status-config.js | 8 arquivos | Object |
| window.THEME_COLORS_CONFIG | theme-colors-config.js | 6 arquivos | Object |
| window.TEAM_MEMBERS_CONFIG | team-members.js | 4 arquivos | Object |
| window.supabaseClient | BI_por_Time(2).html | 10 arquivos | Object |
| window.Chatbot | chatbot.js | 5 arquivos | Object |
| window.reportsV3 | reports-module-v3.js | 3 arquivos | Object |
| window.BICharts | bi-analytics-charts.js | 5 arquivos | Object |
| window.DATA | core-data.js | 8 arquivos | Object |
| window.FD_LOOKUPS | core-data.js | 5 arquivos | Object |

---

# 2. PROBLEMAS TÉCNICOS DETALHADOS

## 2.1 Problema: HTML com JavaScript Inline

### Localização
`BI_por_Time(2).html` linhas 6500-8700 (~4000 linhas de JS)

### Código Problemático (Exemplo)
```javascript
// Linha 6636-6639 do HTML
let ticketsData = [];
let allTicketsCache = [];
window.ticketsData = ticketsData;
window.allTicketsCache = allTicketsCache;

// Linha 6667-6697 - initSupabase inline
async function initSupabase() {
  if (supabaseClient) return supabaseClient;
  // ... 30 linhas de código
}

// Linha 6699-6770 - mapTicketToDbRow inline
function mapTicketToDbRow(t) {
  // ... 70 linhas de código
}

// ... mais ~3800 linhas
```

### Solução: Extrair para js/main-app.js
```javascript
// js/main-app.js (NOVO)
(function() {
  'use strict';
  
  // Estado global
  window.ticketsData = [];
  window.allTicketsCache = [];
  
  // Inicialização do Supabase
  window.initSupabase = async function() {
    // código extraído do HTML
  };
  
  // Mapeamento de tickets
  window.mapTicketToDbRow = function(ticket) {
    // código extraído do HTML
  };
  
  // ... resto do código extraído
})();
```

### Impacto
- **Antes**: HTML 393 KB, não cacheável como JS
- **Depois**: HTML ~100 KB + main-app.js ~150 KB (cacheável)
- **Benefício**: Carregamento 30% mais rápido em visitas subsequentes

---

## 2.2 Problema: Chatbot Monolítico

### Localização
`js/chatbot.js` - 285 KB, ~6149 linhas

### Análise de Responsabilidades
```
chatbot.js contém:
├── UI/Renderização (~1500 linhas)
│   ├── createChatWindow()
│   ├── renderMessages()
│   └── animações CSS inline
│
├── Processamento de Perguntas (~2000 linhas)
│   ├── processQuestion()
│   ├── findPerson()
│   ├── padrões de regex
│   └── responses predefinidas
│
├── Análise de Tickets (~1500 linhas)
│   ├── getRequesterHistory()
│   ├── getPersonWorkload()
│   ├── predictVolume()
│   └── detectAnomalies()
│
├── Regras de Negócio (~500 linhas)
│   ├── businessRules.slaPorPrioridade
│   ├── businessRules.horarioComercial
│   └── businessRules.feriados
│
└── Integração IA (~650 linhas)
    ├── callGroqAPI()
    ├── buildSystemPrompt()
    └── parseAIResponse()
```

### Solução: Dividir em Módulos
```
js/modules/chatbot/
├── index.js              # Exporta API pública
├── chatbot-core.js       # UI, estado, renderização (~800 linhas)
├── chatbot-patterns.js   # Padrões de perguntas (~600 linhas)
├── chatbot-analytics.js  # Análise de tickets (~800 linhas)
├── chatbot-sla.js        # Cálculos de SLA (~400 linhas)
└── chatbot-ai.js         # Integração IA (~500 linhas)
```

### Exemplo de Refatoração
```javascript
// js/modules/chatbot/chatbot-sla.js
window.ChatbotSLA = {
  // Movido de chatbot.js businessRules
  slaPorPrioridade: {
    4: { nome: 'Urgente', resposta: 1, resolucao: 4 },
    3: { nome: 'Alta', resposta: 4, resolucao: 8 },
    2: { nome: 'Média', resposta: 8, resolucao: 24 },
    1: { nome: 'Baixa', resposta: 24, resolucao: 48 }
  },
  
  calcularSLA(ticket) {
    // código movido de chatbot.js
  },
  
  verificarViolacao(ticket) {
    // código movido de chatbot.js
  }
};

// js/modules/chatbot/chatbot-core.js
window.Chatbot = {
  // Usa ChatbotSLA
  getSLAInfo(ticket) {
    return window.ChatbotSLA.calcularSLA(ticket);
  }
};
```

---

## 2.3 Problema: Renderização de Gráficos Duplicada

### Localizações
| Arquivo | Função | Linhas |
|---------|--------|--------|
| bi-analytics-charts.js | renderTop10Chart | ~150 |
| bi-analytics-charts.js | renderTicketsPorTratativaChart | ~120 |
| bi-acompanhamento-module.js | renderBarChart | ~200 |
| presentation-mode-v2.js | renderSlideChart | ~180 |
| reports-module-v3.js | drawBarChart | ~100 |

### Código Duplicado (Comparação)
```javascript
// Em bi-analytics-charts.js
renderTicketsPorTratativaChart(metrics, hoverIndex = null) {
  const canvas = document.getElementById('chartTicketsTratativa');
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas, 320);
  // ... desenha barras horizontais
  sorted.forEach(([name, count], i) => {
    const y = startY + i * (barHeight + gap);
    const barWidth = (count / maxVal) * barMaxWidth;
    ctx.fillStyle = barColor;
    ctx.fillRect(labelWidth, y, barWidth, barHeight);
    // ...
  });
}

// Em presentation-mode-v2.js (DUPLICADO!)
renderBarChart(data, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  // ... MESMO CÓDIGO com pequenas variações
}

// Em reports-module-v3.js (DUPLICADO!)
drawBarChart(ctx, data, options) {
  // ... MESMO CÓDIGO com pequenas variações
}
```

### Solução: Componente Unificado
```javascript
// js/components/chart-renderers.js
window.ChartRenderers = {
  setupCanvas(canvas, height = 300) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 400;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    
    return { ctx, width, height };
  },
  
  barChart(canvas, data, options = {}) {
    const { ctx, width, height } = this.setupCanvas(canvas, options.height);
    const colors = options.colors || window.getCurrentThemeColors();
    
    // Renderização unificada
    // ...
    
    return { regions: data }; // Para tooltips
  },
  
  donutChart(canvas, data, options = {}) {
    // ...
  },
  
  lineChart(canvas, data, options = {}) {
    // ...
  }
};
```

### Uso nos Módulos
```javascript
// Em bi-analytics-charts.js (REFATORADO)
renderTicketsPorTratativaChart(metrics) {
  const canvas = document.getElementById('chartTicketsTratativa');
  if (!canvas) return;
  
  const data = this.prepareBarData(metrics);
  window.ChartRenderers.barChart(canvas, data, {
    height: 320,
    barColor: '#2196F3'
  });
}

// Em presentation-mode-v2.js (REFATORADO)
renderSlideChart(slideData) {
  window.ChartRenderers.barChart(canvas, slideData, {
    height: 400,
    colors: this.colors
  });
}
```

---

# 3. ARQUIVOS PARA CRIAR

## 3.1 js/utils/business-hours.js

```javascript
/**
 * Business Hours Calculator
 * Centraliza cálculos de horas úteis para todo o sistema
 */
window.BusinessHours = {
  config: {
    startHour: 8,
    endHour: 18,
    workDays: [1, 2, 3, 4, 5],
    holidays: []
  },
  
  async loadHolidays() {
    try {
      if (window.supabaseClient) {
        const { data } = await window.supabaseClient
          .from('feriados')
          .select('data')
          .gte('ano', new Date().getFullYear() - 1);
        this.config.holidays = (data || []).map(h => h.data);
      }
    } catch (e) {
      console.warn('Erro ao carregar feriados:', e);
      this.config.holidays = this.getDefaultHolidays();
    }
  },
  
  getDefaultHolidays() {
    return [
      '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03',
      '2026-04-21', '2026-05-01', '2026-06-04', '2026-09-07',
      '2026-10-12', '2026-11-02', '2026-11-15', '2026-12-25'
    ];
  },
  
  isBusinessDay(date) {
    const d = new Date(date);
    const dow = d.getDay();
    const dateStr = d.toISOString().slice(0, 10);
    return this.config.workDays.includes(dow) && 
           !this.config.holidays.includes(dateStr);
  },
  
  isBusinessHour(date) {
    const hour = new Date(date).getHours();
    return hour >= this.config.startHour && hour < this.config.endHour;
  },
  
  calculateHours(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return 0;
    
    let hours = 0;
    let current = new Date(start);
    
    while (current < end) {
      if (this.isBusinessDay(current) && this.isBusinessHour(current)) {
        hours++;
      }
      current.setHours(current.getHours() + 1);
    }
    
    return hours;
  },
  
  getSLAHours(priority) {
    const sla = { 4: 4, 3: 8, 2: 24, 1: 48 };
    return sla[priority] || 24;
  },
  
  isWithinSLA(ticket) {
    if (!ticket.created_at || !ticket.stats_first_responded_at) return null;
    
    const hours = this.calculateHours(
      ticket.created_at, 
      ticket.stats_first_responded_at
    );
    const limit = this.getSLAHours(ticket.priority);
    
    return hours <= limit;
  }
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
  window.BusinessHours.loadHolidays();
});
```

## 3.2 js/config/business-rules.js

```javascript
/**
 * Business Rules - Regras de negócio centralizadas
 */
window.BUSINESS_RULES = {
  // SLA por prioridade (em horas)
  SLA: {
    RESPONSE: { 4: 1, 3: 4, 2: 8, 1: 24 },
    RESOLUTION: { 4: 4, 3: 8, 2: 24, 1: 48 }
  },
  
  // Horário comercial
  WORK_HOURS: {
    START: 8,
    END: 18,
    DAYS: [1, 2, 3, 4, 5]
  },
  
  // Capacidade
  CAPACITY: {
    DEFAULT_PER_PERSON: 15,
    OVERLOAD_THRESHOLD: 80,
    CRITICAL_THRESHOLD: 100
  },
  
  // Escalação
  ESCALATION: {
    NO_RESPONSE_HOURS: 24,
    HIGH_PRIORITY_HOURS: 4
  },
  
  // Helpers
  getPriorityName(priority) {
    const names = { 4: 'Urgente', 3: 'Alta', 2: 'Média', 1: 'Baixa' };
    return names[priority] || 'Desconhecida';
  },
  
  getPriorityColor(priority) {
    const colors = { 
      4: '#ef4444', 
      3: '#f59e0b', 
      2: '#3b82f6', 
      1: '#6b7280' 
    };
    return colors[priority] || '#6b7280';
  }
};
```

---

# 4. GUIA DE MIGRAÇÃO PASSO A PASSO

## Passo 1: Excluir Arquivos Deprecados

```bash
# Backup primeiro!
cp js/reports-module.js js/reports-module.js.bak
cp js/reports-module-v2.js js/reports-module-v2.js.bak

# Remover
rm js/reports-module.js
rm js/reports-module-v2.js
```

## Passo 2: Atualizar Referências no HTML

```html
<!-- REMOVER do BI_por_Time(2).html -->
<script src="js/reports-module.js"></script>
<script src="js/reports-module-v2.js"></script>

<!-- MANTER apenas -->
<script src="js/reports-module-v3.js"></script>
```

## Passo 3: Buscar e Substituir Status

```javascript
// Buscar em todos os arquivos:
// Padrão: this.statusMap ou statusMap = {

// Substituir por:
// Usar window.FRESHDESK_STATUS.MAP ou métodos helpers

// Exemplo de busca com grep:
// grep -r "statusMap" js/
// grep -r "status.*label.*Aberto" js/
```

## Passo 4: Buscar e Substituir Cores

```javascript
// Buscar padrão:
// colors: { ou colors = { ou this.colors = {
// primary: '#3b82f6'

// Substituir por:
const colors = window.getCurrentThemeColors();
// ou
get colors() { return window.getCurrentThemeColors(); }
```

## Passo 5: Testar Cada Módulo

```javascript
// Adicionar no console para testar:
console.assert(window.FRESHDESK_STATUS, 'Status config não carregado');
console.assert(window.getCurrentThemeColors, 'Theme colors não disponível');
console.assert(window.reportsV3, 'Reports V3 não carregado');
```

---

# 5. CHECKLIST DE IMPLEMENTAÇÃO

## Fase 1: Limpeza
- [ ] Backup de todos os arquivos
- [ ] Excluir reports-module.js
- [ ] Excluir reports-module-v2.js
- [ ] Atualizar referências no HTML
- [ ] Testar módulo de relatórios

## Fase 2: Centralização de Status
- [ ] Verificar status-config.js está carregando primeiro
- [ ] Substituir statusMap em reports-module-v2.js (se ainda existir referência)
- [ ] Substituir statusMap em presentation-mode-v2.js
- [ ] Testar todos os gráficos de status

## Fase 3: Centralização de Cores
- [ ] Criar lista de arquivos com cores hardcoded
- [ ] Substituir em cada arquivo
- [ ] Testar em tema claro e escuro

## Fase 4: Criar Utilitários
- [ ] Criar js/utils/business-hours.js
- [ ] Criar js/config/business-rules.js
- [ ] Atualizar chatbot.js para usar novos utilitários
- [ ] Testar cálculos de SLA

## Fase 5: Criar Componentes
- [ ] Criar js/components/chart-renderers.js
- [ ] Migrar bi-analytics-charts.js
- [ ] Migrar presentation-mode-v2.js
- [ ] Migrar reports-module-v3.js
- [ ] Testar todos os gráficos

## Fase 6: Extrair JS do HTML
- [ ] Criar js/main-app.js
- [ ] Mover funções de BI_por_Time(2).html
- [ ] Atualizar HTML para carregar main-app.js
- [ ] Testar carregamento de dados

## Fase 7: Testes Finais
- [ ] Testar todas as abas do sistema
- [ ] Testar tema claro e escuro
- [ ] Testar chatbot
- [ ] Testar relatórios
- [ ] Testar modo apresentação
- [ ] Verificar console por erros

---

# 6. MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Total de código JS | 2.5 MB | ~1.5 MB | -40% |
| Arquivos duplicados | 3 | 0 | -100% |
| Definições de status | 4 | 1 | -75% |
| Definições de cores | 15 | 1 | -93% |
| Linhas de JS no HTML | 4000 | 0 | -100% |
| Tempo de carregamento | ~3s | ~2s | -33% |

---

*Documento técnico complementar - Março 2026*
