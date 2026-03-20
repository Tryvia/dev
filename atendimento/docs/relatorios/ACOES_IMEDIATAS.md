# ════════════════════════════════════════════════════════════════════════════════
# AÇÕES IMEDIATAS - IMPLEMENTAÇÃO RÁPIDA
# ════════════════════════════════════════════════════════════════════════════════

Este documento contém as ações que podem ser executadas imediatamente com baixo risco.

---

# 1. EXCLUIR ARQUIVOS DEPRECADOS

## 1.1 Arquivos para Excluir

| Arquivo | Tamanho | Motivo |
|---------|---------|--------|
| js/reports-module.js | 99 KB | Versão antiga, substituída por V3 |
| js/reports-module-v2.js | 46 KB | Versão antiga, substituída por V3 |

**Economia Total**: 145 KB

## 1.2 Passos para Excluir

1. **Backup** (obrigatório):
```
Copiar para pasta backup/
- js/reports-module.js → backup/reports-module.js.bak
- js/reports-module-v2.js → backup/reports-module-v2.js.bak
```

2. **Verificar referências** no HTML:
```html
<!-- Buscar no BI_por_Time(2).html -->
<!-- Se existir, REMOVER: -->
<script src="js/reports-module.js"></script>
<script src="js/reports-module-v2.js"></script>
```

3. **Excluir arquivos** após confirmar que V3 funciona

---

# 2. SUBSTITUIÇÕES RÁPIDAS

## 2.1 Status do Freshdesk

### Arquivos para Modificar:
- js/presentation-mode-v2.js (linha 110-139)

### Código Atual (REMOVER):
```javascript
this.statusMap = window.FRESHDESK_STATUS?.MAP ?
    Object.fromEntries(Object.entries(window.FRESHDESK_STATUS.MAP).map(([k, v]) => [k, {
        label: v.label,
        color: v.color,
        group: v.category === 'resolved' ? 'resolved' : ...
    }])) : {
        2: { label: 'Aberto', color: '#3b82f6', group: 'open' },
        // ... muitas linhas
    };
```

### Código Novo (USAR):
```javascript
// Usar diretamente window.FRESHDESK_STATUS
getStatusLabel(status) {
    return window.FRESHDESK_STATUS?.getLabel(status) || `Status ${status}`;
}

getStatusColor(status) {
    return window.FRESHDESK_STATUS?.getColor(status) || '#6b7280';
}

isResolved(status) {
    return window.FRESHDESK_STATUS?.isClosed(status) || [4, 5].includes(status);
}
```

---

## 2.2 Cores do Tema

### Padrão a Buscar em Todos os Arquivos:
```javascript
// BUSCAR padrões como:
colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    // ...
}

// ou
this.colors = {
    bg: '#1e1e2e',
    // ...
}
```

### Substituir Por:
```javascript
// Método 1: Getter dinâmico
get colors() {
    return window.getCurrentThemeColors() || {
        primary: '#3b82f6',
        text: '#e4e4e7',
        textMuted: '#a1a1aa',
        // fallback mínimo
    };
}

// Método 2: Função getColors()
getColors() {
    return window.getCurrentThemeColors();
}
```

### Lista de Arquivos com Cores Duplicadas:
1. js/gamification.js (linha 55-65)
2. js/global-search.js (linha 16-26)
3. js/insights-module.js (linha 57-70)
4. js/glossary-module.js (linha 7-38)
5. js/date-range-picker.js (linha 18-30)
6. js/annotations-module.js (inline)
7. js/bi-csat-time-module.js (linha 93-100)

---

# 3. CÓDIGO PRONTO PARA COPIAR

## 3.1 Adicionar ao theme-colors-config.js (se não existir)

```javascript
// Adicionar ao final de js/theme-colors-config.js

/**
 * Helper para verificar tema atual
 */
window.getTheme = function() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
};

window.isLightTheme = function() {
    return window.getTheme() === 'tryvia-cyan';
};

window.isDarkTheme = function() {
    return window.getTheme() !== 'tryvia-cyan';
};

console.log('✅ Theme helpers carregados');
```

## 3.2 Criar js/utils/business-hours.js

```javascript
/**
 * Business Hours Calculator v1.0
 * Centraliza cálculos de horas úteis
 */
(function() {
    'use strict';
    
    window.BusinessHours = {
        // Configuração
        config: {
            startHour: 8,
            endHour: 18,
            workDays: [1, 2, 3, 4, 5], // Seg-Sex
            holidays: []
        },
        
        // SLA por prioridade (horas)
        SLA_HOURS: {
            4: 4,   // Urgente
            3: 8,   // Alta
            2: 24,  // Média
            1: 48   // Baixa
        },
        
        // Carregar feriados do Supabase
        async loadHolidays() {
            try {
                const client = window.supabaseClient;
                if (!client) return;
                
                const year = new Date().getFullYear();
                const { data } = await client
                    .from('feriados')
                    .select('data')
                    .gte('ano', year - 1)
                    .lte('ano', year + 1);
                    
                if (data) {
                    this.config.holidays = data.map(h => h.data);
                    console.log(`📅 ${this.config.holidays.length} feriados carregados`);
                }
            } catch (e) {
                console.warn('⚠️ Erro ao carregar feriados:', e);
            }
        },
        
        // Verificar se é dia útil
        isBusinessDay(date) {
            const d = new Date(date);
            const dow = d.getDay();
            const dateStr = d.toISOString().slice(0, 10);
            
            return this.config.workDays.includes(dow) && 
                   !this.config.holidays.includes(dateStr);
        },
        
        // Verificar se é horário comercial
        isBusinessHour(date) {
            const hour = new Date(date).getHours();
            return hour >= this.config.startHour && 
                   hour < this.config.endHour;
        },
        
        // Calcular horas úteis entre duas datas
        calculate(startDate, endDate) {
            if (!startDate || !endDate) return 0;
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (start >= end) return 0;
            
            let hours = 0;
            let current = new Date(start);
            
            // Avançar hora a hora
            while (current < end) {
                if (this.isBusinessDay(current) && this.isBusinessHour(current)) {
                    hours++;
                }
                current.setHours(current.getHours() + 1);
            }
            
            return hours;
        },
        
        // Obter limite de SLA em horas
        getSLALimit(priority) {
            return this.SLA_HOURS[priority] || 24;
        },
        
        // Verificar se ticket está dentro do SLA
        isWithinSLA(ticket) {
            if (!ticket.created_at) return null;
            
            const responseTime = ticket.stats_first_responded_at;
            if (!responseTime) return null; // Ainda sem resposta
            
            const hours = this.calculate(ticket.created_at, responseTime);
            const limit = this.getSLALimit(ticket.priority);
            
            return hours <= limit;
        },
        
        // Formatar horas para exibição
        formatHours(hours) {
            if (hours < 1) return '< 1h';
            if (hours < 24) return `${Math.round(hours)}h`;
            const days = Math.floor(hours / 24);
            const remainingHours = Math.round(hours % 24);
            return `${days}d ${remainingHours}h`;
        }
    };
    
    // Auto-carregar feriados quando Supabase estiver disponível
    const checkAndLoad = () => {
        if (window.supabaseClient) {
            window.BusinessHours.loadHolidays();
        } else {
            setTimeout(checkAndLoad, 1000);
        }
    };
    
    document.addEventListener('DOMContentLoaded', checkAndLoad);
    
    console.log('✅ BusinessHours module carregado');
})();
```

## 3.3 Criar js/config/business-rules.js

```javascript
/**
 * Business Rules - Regras de negócio centralizadas
 */
window.BUSINESS_RULES = {
    // SLA de primeira resposta (horas)
    SLA_RESPONSE: {
        4: 1,   // Urgente: 1h
        3: 4,   // Alta: 4h
        2: 8,   // Média: 8h
        1: 24   // Baixa: 24h
    },
    
    // SLA de resolução (horas)
    SLA_RESOLUTION: {
        4: 4,   // Urgente: 4h
        3: 8,   // Alta: 8h
        2: 24,  // Média: 24h
        1: 48   // Baixa: 48h
    },
    
    // Horário comercial
    WORK_HOURS: {
        START: 8,
        END: 18
    },
    
    // Dias úteis (0=Dom, 6=Sáb)
    WORK_DAYS: [1, 2, 3, 4, 5],
    
    // Capacidade por pessoa
    CAPACITY: {
        DEFAULT: 15,        // Tickets simultâneos
        OVERLOAD: 80,       // % para alerta amarelo
        CRITICAL: 100       // % para alerta vermelho
    },
    
    // Escalação
    ESCALATION: {
        NO_RESPONSE_HOURS: 24,  // Horas sem resposta
        NO_UPDATE_HOURS: 48     // Horas sem atualização
    },
    
    // Helpers
    getPriorityName(priority) {
        const names = {
            4: 'Urgente',
            3: 'Alta',
            2: 'Média',
            1: 'Baixa'
        };
        return names[priority] || 'Desconhecida';
    },
    
    getPriorityColor(priority) {
        const colors = {
            4: '#ef4444', // Vermelho
            3: '#f59e0b', // Laranja
            2: '#3b82f6', // Azul
            1: '#6b7280'  // Cinza
        };
        return colors[priority] || '#6b7280';
    },
    
    getPriorityIcon(priority) {
        const icons = {
            4: '🔴',
            3: '🟠',
            2: '🔵',
            1: '⚪'
        };
        return icons[priority] || '❓';
    }
};

console.log('✅ Business Rules carregadas');
```

---

# 4. ORDEM DE IMPLEMENTAÇÃO

## Dia 1: Limpeza
1. [ ] Fazer backup completo
2. [ ] Excluir reports-module.js
3. [ ] Excluir reports-module-v2.js
4. [ ] Testar relatórios V3

## Dia 2: Novos Utilitários
1. [ ] Criar js/utils/ (pasta)
2. [ ] Criar js/utils/business-hours.js
3. [ ] Criar js/config/business-rules.js
4. [ ] Adicionar scripts no HTML (antes dos módulos que usam)

## Dia 3: Centralização de Cores
1. [ ] Adicionar helpers ao theme-colors-config.js
2. [ ] Substituir cores em gamification.js
3. [ ] Substituir cores em global-search.js
4. [ ] Substituir cores em insights-module.js
5. [ ] Testar tema claro e escuro

## Dia 4: Centralização de Status
1. [ ] Refatorar presentation-mode-v2.js
2. [ ] Testar gráficos de status
3. [ ] Verificar chatbot

## Dia 5: Testes Finais
1. [ ] Testar todas as funcionalidades
2. [ ] Verificar console por erros
3. [ ] Documentar mudanças

---

# 5. TESTES RÁPIDOS

## Verificar no Console do Browser:

```javascript
// Testar configurações carregadas
console.log('Status config:', window.FRESHDESK_STATUS ? '✅' : '❌');
console.log('Theme colors:', window.getCurrentThemeColors ? '✅' : '❌');
console.log('Team members:', window.TEAM_MEMBERS_CONFIG ? '✅' : '❌');
console.log('Business Hours:', window.BusinessHours ? '✅' : '❌');
console.log('Business Rules:', window.BUSINESS_RULES ? '✅' : '❌');

// Testar funções
if (window.FRESHDESK_STATUS) {
    console.log('Status 4:', window.FRESHDESK_STATUS.getLabel(4));
    console.log('Cor status 2:', window.FRESHDESK_STATUS.getColor(2));
}

if (window.getCurrentThemeColors) {
    const colors = window.getCurrentThemeColors();
    console.log('Primary color:', colors.primary);
    console.log('Tema atual:', window.getTheme?.() || 'N/A');
}

if (window.BusinessHours) {
    console.log('É dia útil hoje:', window.BusinessHours.isBusinessDay(new Date()));
    console.log('SLA Urgente:', window.BusinessHours.getSLALimit(4) + 'h');
}
```

---

# 6. ROLLBACK (Se Algo Der Errado)

## Restaurar Arquivos do Backup:
```
Copiar de volta:
- backup/reports-module.js.bak → js/reports-module.js
- backup/reports-module-v2.js.bak → js/reports-module-v2.js
```

## Restaurar Referências no HTML:
```html
<!-- Adicionar de volta se necessário -->
<script src="js/reports-module.js"></script>
<script src="js/reports-module-v2.js"></script>
```

---

*Ações Imediatas - Implementação Segura*
