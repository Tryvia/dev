# Análise Completa: Aba Pessoas/Time no BI Analytics

**Data:** 10/03/2026 (Atualizado)  
**Arquivos analisados:**
- `js/bi-analytics.js` (principal)
- `js/bi-analytics-methods.js` (métodos)
- `js/bi-analytics-metrics.js` (métricas)
- `js/config/team-members.js` (configuração de times)

---

## 1. ESTRUTURA ATUAL

### 1.1 Arquitetura
```
BIAnalytics (classe principal)
├── ticketsData        → Todos os tickets carregados (fonte)
├── filteredData       → Tickets filtrados por período/entidade
├── allAssignedTickets → Tickets atribuídos às entidades selecionadas
├── selectedEntities   → Set com entidades selecionadas
├── selectedPessoas    → Set separado para persistir seleção de pessoas
├── selectedTimes      → Set separado para persistir seleção de times
├── currentView        → 'pessoa' | 'time' | 'produtividade' | 'csat' | 'tempo' | 'acompanhamento'
└── periodFilter       → 'all' | '7' | '30' | '90' | '365' | 'custom'
```

### 1.2 Campos Utilizados
| Campo | Uso | Tem Dados? |
|-------|-----|------------|
| `cf_tratativa` | Identificar PESSOA responsável | ✅ SIM |
| `cf_grupo_tratativa` | Identificar TIME responsável | ✅ SIM |
| `responder_name` | Coluna existe mas NÃO é populada | ❌ VAZIO |
| `group_name` | Coluna existe mas NÃO é populada | ❌ VAZIO |

### 1.3 Decisões de Design (Intencionais)
- **Times hardcoded (`VALID_TEAMS`)**: Intencional para garantir separação correta entre times válidos e nomes de pessoas.
- **Whitelist por time (`TEAM_MEMBERS_CONFIG`)**: Intencional para controlar quais pessoas aparecem em cada time.

---

## 2. PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### ✅ CORRIGIDO: Bug no showDrillDown

**Arquivo:** `js/bi-analytics-methods.js` (linha 575)

**Problema:** Usava `responder_name` e `group_name` (campos vazios).

**Correção aplicada:**
```javascript
case 'entity':
    // Usar cf_tratativa/cf_grupo_tratativa (campos com dados reais)
    if (this.currentView === 'pessoa') {
        tickets = this.filteredData.filter(t => {
            const tratativa = t.cf_tratativa || '';
            return tratativa.split(/[,;\/]/).map(p => p.trim()).includes(filter);
        });
    } else {
        tickets = this.filteredData.filter(t => {
            const grupo = t.cf_grupo_tratativa || '';
            return grupo.split(/[,;\/]/).map(g => g.trim()).includes(filter);
        });
    }
    break;
```

---

## 3. ITENS QUE NÃO SÃO PROBLEMAS

| Item | Status | Motivo |
|------|--------|--------|
| Times hardcoded | ✅ OK | Intencional para separação correta |
| `cf_tratativa` como fonte | ✅ OK | É o campo correto com dados |
| Whitelist de membros | ✅ OK | Funciona como esperado |

---

## 4. FLUXO DE DADOS

```
1. initialize()
   └── ticketsData = window.allTicketsCache
   
2. extractEntities()
   └── Popula allPessoas e allTimes a partir de cf_tratativa e cf_grupo_tratativa
   └── Aplica whitelist de TEAM_MEMBERS_CONFIG
   
3. render()
   └── Renderiza UI com base em currentView
   
4. applyFilters() [quando usuário clica]
   └── analyzeData()
   
5. analyzeData()
   ├── ticketBelongsToSelected() - Filtra por cf_tratativa/cf_grupo_tratativa
   ├── Calcula allAssignedTickets, resolvedInPeriod, etc.
   ├── Aplica filtro de período
   └── Renderiza gráficos e KPIs
```

---

## 5. RESUMO

| Status | Item |
|--------|------|
| ✅ Corrigido | Bug do DrillDown (responder_name → cf_tratativa) |
| ✅ OK | Uso de cf_tratativa como fonte de dados |
| ✅ OK | Times hardcoded (intencional) |
| ✅ OK | Whitelist de membros por time |

**A aba Pessoas/Time está funcionando corretamente após a correção do DrillDown.**

---

*Relatório atualizado pelo Cascade - 10/03/2026*
