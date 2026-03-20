# 📊 Análise Completa dos BIs do Sistema

> Documento de análise para otimização e enxugamento de visualizações

---

## 1. INVENTÁRIO COMPLETO DOS BIs

### Sub-aba: PESSOAS / TIMES (Visão Geral)

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 1 | **Top 10 Entidades** | Barras Horizontais | Quantidade de tickets por pessoa/time | `renderTop10Chart` |
| 2 | **Taxa de Resolução** | Barras Horizontais | % resolução por entidade | `renderResolutionChart` |
| 3 | **Distribuição por Status** | Barras Horizontais | Tickets por status (5 categorias) | `renderStatusChart` |
| 4 | **Distribuição por Prioridade** | Barras Horizontais | Tickets por prioridade (4 níveis) | `renderPriorityChart` |
| 5 | **Timeline Criados vs Resolvidos** | Linha Dupla | Evolução diária (30 dias) | `renderTimelineChart` |
| 6 | **Por Sistema** | Barras Horizontais | Top 10 sistemas | `renderSystemsChart` |

### Sub-aba: PESSOAS / TIMES (Performance/SLA)

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 7 | **SLA Geral** | Gauge (semicírculo) | % dentro do SLA | `renderSLAChart` |
| 8 | **Tendência SLA** | Linha | SLA% por dia (30 dias) | `renderSLATrendChart` |
| 9 | **SLA por Entidade** | Barras Horizontais | % SLA por pessoa/time | `renderSLAByEntityChart` |
| 10 | **First Response** | Barras Verticais | Distribuição por faixa de tempo | `renderFirstResponseChart` |

### Sub-aba: PRODUTIVIDADE

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 11 | **Por Dia da Semana** | Barras Verticais | Tickets por dia (Dom-Sáb) | `renderByDayOfWeekChart` |
| 12 | **Por Hora** | Barras Verticais | Tickets por hora (0-23h) | `renderByHourChart` |
| 13 | **Heatmap Dia x Hora** | Mapa de Calor | Intensidade por combinação | `renderHeatmapChart` |
| 14 | **Carga de Trabalho** | Barras Horizontais | Top 6 com tickets abertos | `renderWorkloadChart` |
| 15 | **Status Detalhado** | Barras Horizontais | Todos os status com contagem | `renderStatusStackedChart` |

### Sub-aba: PRODUTIVIDADE (Comparativos)

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 16 | **Comparativo Mensal** | Barras Verticais | Período anterior vs atual | `renderComparativoMensalChart` |
| 17 | **Tendência Semanal** | Linha | Tickets por semana | `renderTendenciaChart` |

### Sub-aba: PRODUTIVIDADE (Rankings)

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 18 | **Ranking SLA** | Barras Horizontais | Top pessoas por % SLA | `renderRankingSLAChart` |
| 19 | **Ranking Resolução** | Barras Horizontais | Top pessoas por % resolução | `renderRankingResolucaoChart` |
| 20 | **Ranking Eficiência** | Barras Horizontais | Top por tickets/dia | `renderEficienciaChart` |

### Sub-aba: PRODUTIVIDADE (Pipeline)

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 21 | **Idade do Backlog** | Barras Verticais | Tickets por faixa de dias | `renderAgingHistogramChart` |
| 22 | **Pipeline Ativos** | Barras Horizontais | Tickets por estágio | `renderPipelineFunnelChart` |
| 23 | **Tickets Parados** | Lista/Cards | Tickets sem atividade | `renderParadosChart` |
| 24 | **Aguardando** | Lista/Cards | Tickets aguardando algo | `renderAguardandoChart` |
| 25 | **Finalizados** | Barra Empilhada | Resolvido vs Fechado | `renderFinalizedChart` |

### Sub-aba: CSAT

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 26 | **CSAT Score** | Donut/Gauge | Nota média geral | `renderCSATChart` |
| 27 | **Distribuição CSAT** | Barras | Avaliações por nota (1-5) | `BICSATModule` |
| 28 | **CSAT por Agente** | Barras Horizontais | Média por pessoa | `BICSATModule` |
| 29 | **Feedbacks Recentes** | Lista | Comentários dos clientes | `BICSATModule` |

### Sub-aba: TEMPO

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 30 | **Total de Horas** | Card/KPI | Soma de horas | `BICSATModule` |
| 31 | **Horas por Pessoa** | Barras Horizontais | Distribuição por agente | `BICSATModule` |
| 32 | **Business Hours** | Card | Tickets dentro/fora horário | `renderBusinessHoursCard` |

### Sub-aba: ACOMPANHAMENTO

| # | Nome do BI | Tipo Atual | Dados | Localização |
|---|-----------|------------|-------|-------------|
| 33 | **Tickets por Tag** | Barras Horizontais | Quem acompanhou (por tags) | `BIAcompanhamentoModule` |
| 34 | **Taxa Sucesso Acompanhamento** | Barras | % resolvidos que acompanhou | `BIAcompanhamentoModule` |

---

## 2. ANÁLISE: TIPO DE GRÁFICO vs. IDEAL

### ⚠️ BIs com tipo de visualização INADEQUADO

| BI | Tipo Atual | Problema | Tipo Ideal | Justificativa |
|----|------------|----------|------------|---------------|
| **Status (3)** | Barras Horiz. | Mostra % mas é quantidade | **Donut** | São 5 categorias fixas, composição do todo |
| **Prioridade (4)** | Barras Horiz. | Mostra composição | **Donut** | São 4 categorias fixas que somam 100% |
| **Por Sistema (6)** | Barras Horiz. | OK para ranking | Barras ✅ | Ranking de Top 10 |
| **SLA Geral (7)** | Gauge | OK | Gauge ✅ | Mostra % de meta |
| **Por Dia Semana (11)** | Barras Vert. | Seria melhor visualizar ciclo | **Radar** ou Barras | Padrão semanal cíclico |
| **Heatmap (13)** | Mapa de Calor | OK | Heatmap ✅ | Ideal para 2 dimensões |
| **Comparativo (16)** | Barras Vert. | OK | Barras ✅ | Comparação direta |
| **Finalizados (25)** | Barra Empilhada | São só 2 valores | **Donut** | Composição simples |

### ✅ BIs com tipo de visualização ADEQUADO

| BI | Tipo | Por quê está correto |
|----|------|---------------------|
| Top 10 Entidades | Barras Horiz. | Ranking ordenado |
| Taxa de Resolução | Barras Horiz. | Comparação de % entre entidades |
| Timeline | Linha Dupla | Evolução temporal |
| SLA Geral | Gauge | % de meta |
| First Response | Barras Vert. | Distribuição em faixas |
| Por Hora | Barras Vert. | 24 valores sequenciais |
| Heatmap | Mapa de Calor | Duas dimensões |
| Tendência | Linha | Evolução temporal |
| Rankings | Barras Horiz. | Ordenação por valor |
| Idade Backlog | Barras Vert. | Histograma de faixas |
| CSAT Score | Donut/Gauge | % ou média |

---

## 3. BIs REDUNDANTES OU SEM NECESSIDADE ESTRATÉGICA

### 🔴 ALTA REDUNDÂNCIA (Candidatos a remoção)

| BI | Problema | Recomendação |
|----|----------|--------------|
| **Status (3) + Status Detalhado (15)** | DUPLICADO - Mesmo dado em 2 lugares | **Manter apenas 1** (o detalhado é mais completo) |
| **Ranking SLA (18) + SLA por Entidade (9)** | REDUNDANTE - Mesmo dado, apresentação similar | **Manter apenas 1** (SLA por Entidade tem mais contexto) |
| **Ranking Resolução (19) + Taxa de Resolução (2)** | REDUNDANTE - Mesma métrica, visões diferentes | **Manter apenas 1** (Taxa de Resolução é mais útil) |
| **Tendência SLA (8)** | BAIXO USO - Raramente consultado | **Remover** ou mover para relatórios |
| **Tickets Parados (23) + Aguardando (24)** | SOBREPOSIÇÃO - Conceitos similares | **Unificar** em um único BI |

### 🟡 BAIXA NECESSIDADE ESTRATÉGICA

| BI | Problema | Recomendação |
|----|----------|--------------|
| **Pipeline Ativos (22)** | Informação já presente em Status | **Avaliar remoção** |
| **Finalizados (25)** | Resolvido vs Fechado é detalhe operacional | **Remover** (informação está no Status) |
| **Business Hours (32)** | Uso específico, não estratégico | **Mover para relatórios** |
| **Ranking Eficiência (20)** | Cálculo confuso (tickets/dia) | **Refatorar fórmula** ou remover |

### 🟢 ESSENCIAIS (Manter)

| BI | Justificativa |
|----|---------------|
| Top 10 Entidades | Core - quem está trabalhando |
| Taxa de Resolução | Core - eficácia |
| Status | Core - visão geral |
| SLA Geral | Core - meta principal |
| Timeline | Core - tendência |
| CSAT Score | Core - satisfação |
| Heatmap | Estratégico - planejamento |
| Idade Backlog | Estratégico - saúde do backlog |
| Acompanhamento por Tags | Único - não duplicado |

---

## 4. PROPOSTA DE CONSOLIDAÇÃO

### Antes: 34 BIs
### Depois: ~22 BIs (redução de 35%)

**Remoções sugeridas:**
1. ~~Status Detalhado~~ → Manter apenas Status simplificado
2. ~~Ranking SLA~~ → Manter SLA por Entidade
3. ~~Ranking Resolução~~ → Manter Taxa de Resolução
4. ~~Ranking Eficiência~~ → Fórmula confusa
5. ~~Tendência SLA~~ → Mover para relatórios
6. ~~Pipeline Ativos~~ → Redundante com Status
7. ~~Finalizados~~ → Redundante com Status
8. ~~Business Hours~~ → Mover para relatórios
9. ~~Tickets Parados~~ → Unificar com Aguardando
10. ~~Aguardando~~ → Unificar como "Tickets Pendentes"

---

## 5. ANÁLISE: NECESSIDADE DE NOVA SUB-ABA

### ❌ NÃO recomendo nova sub-aba

**Motivos:**
1. **6 sub-abas já é muito** - Usuários têm dificuldade de navegar
2. **Dados dispersos** - Melhor consolidar os existentes
3. **Overhead de manutenção** - Mais código para manter

### ✅ ALTERNATIVAS melhores:

1. **Consolidar CSAT + Tempo** em uma única aba "Qualidade"
2. **Mover BIs de baixo uso para Relatórios** (sob demanda)
3. **Criar filtros mais inteligentes** em vez de novas abas

### Possível nova aba APENAS se:
- Houver demanda por **análise de TAGS** mais profunda
- Implementar **análise preditiva/IA** (separado dos dados atuais)
- Criar **visão executiva resumida** (dashboard de 1 página)

---

## 6. RESUMO EXECUTIVO

### Problemas identificados:
- **12 BIs redundantes ou de baixo valor** (35%)
- **4 BIs com tipo de gráfico inadequado**
- **Fragmentação** de informação similar em múltiplos lugares

### Recomendações:
1. **Consolidar Status** - manter apenas 1 versão
2. **Eliminar Rankings duplicados** - SLA e Resolução já existem
3. **Mudar para Donut**: Status, Prioridade, Finalizados
4. **Unificar "Parados" + "Aguardando"** em "Pendentes"
5. **NÃO criar nova sub-aba** - enxugar as existentes

### Próximos passos sugeridos:
1. Aprovar quais BIs remover
2. Implementar mudanças de tipo de gráfico
3. Consolidar abas CSAT + Tempo (opcional)
4. Criar sistema de "favoritos" para BIs mais usados

---

*Análise gerada em Janeiro/2026*
