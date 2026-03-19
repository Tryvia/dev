# 📊 Guia Completo do BI Analytics

> **Uma explicação clara e objetiva de cada sub-aba do módulo de Business Intelligence**

---

## 🎯 Visão Geral

O BI Analytics é o coração analítico do sistema. Ele transforma dados brutos de tickets em informações visuais que ajudam gestores e equipes a entender o desempenho do atendimento.

Pense nele como um painel de controle de um carro: você não precisa saber como o motor funciona internamente, mas precisa entender o que cada indicador significa para dirigir bem.

O módulo possui **7 sub-abas**, cada uma com um propósito específico:

| Sub-aba | Foco Principal | Para quem é útil |
|---------|---------------|------------------|
| 👤 Pessoas | Desempenho individual | Gestores, RH |
| 👥 Times | Desempenho por equipe | Coordenadores |
| 📈 Produtividade | Eficiência e tendências | Diretoria |
| ⭐ CSAT | Satisfação do cliente | Qualidade |
| ⏱️ Tempo | Horas trabalhadas | Gestores |
| 🏷️ Acompanhamento | Quem acompanhou cada caso | Supervisores |
| 🔄 Consolidado | **TOTAL** Tratativa + Acompanhamento | Gestores, Diretoria |

### Campos de Dados Utilizados

| Campo | Localização | Descrição |
|-------|-------------|-----------|
| `cf_tratativa` | Ticket | Pessoa responsável pela tratativa |
| `cf_grupo_tratativa` | Ticket | Time responsável |
| `cf_acompanhamento_atendimento` | Ticket | Pessoa de acompanhamento |
| `custom_fields.cf_teste` | JSON | **Sistema/Produto** (SING, OPTZ, Telemetria, etc.) |
| `type` | Ticket | Tipo do ticket (Ajuste OPTZ, Melhoria SING, etc.) |

> **⚠️ Nota:** Os campos `cf_sistema` e `cf_produto` existem mas estão geralmente vazios. Use `custom_fields.cf_teste` para o Sistema/Produto.

---

## 👤 Sub-aba: PESSOAS

### O que faz?
Mostra o desempenho **individual** de cada pessoa do time. Permite comparar quem está resolvendo mais tickets, quem está mais rápido e quem precisa de atenção.

### Quando usar?
- Reuniões de feedback individual (1:1)
- Avaliações de desempenho
- Identificar quem precisa de suporte
- Reconhecer quem está se destacando

### Como interpretar?

#### 🎫 Total de Tickets
Quantidade de tickets em que a pessoa aparece como responsável pela tratativa.

> **Dica:** Um número muito baixo pode indicar ociosidade. Um número muito alto pode indicar sobrecarga.

#### ✅ Tickets Resolvidos
Quantidade de tickets que foram encerrados com sucesso (status "Resolvido" ou "Fechado").

> **Importante:** Este número considera apenas tickets que foram **finalizados dentro do período selecionado**.

#### 📊 Taxa de Resolução
É a porcentagem de tickets resolvidos em relação ao total.

**Como é calculado:**
```
Taxa de Resolução = (Tickets Resolvidos ÷ Total de Tickets) × 100
```

**Exemplo prático:**
- João tem 50 tickets no total
- Desses, 40 foram resolvidos
- Taxa: (40 ÷ 50) × 100 = **80%**

> **O que é bom?** Acima de 70% é considerado saudável. Acima de 85% é excelente.

#### ⏱️ Tempo Médio de Primeira Resposta
Quanto tempo, em média, a pessoa leva para dar a primeira resposta ao cliente após o ticket ser criado.

**Como é calculado:**
```
Tempo = Data/Hora da Primeira Resposta − Data/Hora de Criação do Ticket
```

> **Meta recomendada:** Menos de 4 horas (SLA padrão).

#### ⏳ Tempo Médio de Resolução
Quanto tempo, em média, a pessoa leva para resolver completamente um ticket desde sua criação.

**Como é calculado:**
```
Tempo = Data/Hora da Resolução − Data/Hora de Criação do Ticket
```

> **Interpretação:** Tempos muito longos podem indicar tickets complexos OU falta de foco. Analise caso a caso.

---

## 👥 Sub-aba: TIMES

### O que faz?
Agrupa os dados por **equipe** em vez de indivíduo. Permite comparar o desempenho entre diferentes times da empresa.

### Quando usar?
- Reuniões de gestão
- Planejamento de recursos
- Identificar times sobrecarregados
- Balancear a distribuição de demandas

### Como interpretar?

#### 🎫 Volume por Time
Mostra quantos tickets cada time recebeu no período. Um gráfico de barras facilita a comparação visual.

> **Atenção:** Times com volume muito desigual podem precisar de redistribuição de pessoas.

#### 📈 Comparativo de Resolução
Compara a taxa de resolução entre times lado a lado.

**Exemplo:**
- Time Suporte: 85% de resolução
- Time Desenvolvimento: 72% de resolução
- Time Comercial: 91% de resolução

> **Por que o Dev tem taxa menor?** Tickets de desenvolvimento geralmente são mais complexos e demoram mais. Compare times similares entre si.

#### 🕐 Tempo Médio por Time
Compara quanto tempo cada time leva, em média, para resolver tickets.

> **Insight:** Use para identificar gargalos. Se um time está muito mais lento, investigue: falta de pessoal? Complexidade maior? Processos ineficientes?

---

## 📈 Sub-aba: PRODUTIVIDADE

### O que faz?
Oferece uma visão mais **estratégica** do atendimento. Mostra tendências, horários de pico e um índice geral de produtividade.

### Quando usar?
- Apresentações para diretoria
- Planejamento de escalas
- Análise de tendências mensais
- Justificar contratações ou mudanças

### Como interpretar?

#### 📊 Índice de Produtividade
Um número de 0 a 100 que resume a eficiência geral do atendimento.

**Como é calculado:**
```
Índice = (Tickets Resolvidos ÷ Tempo Médio de Resolução) × 10
```

> **Traduzindo:** Quanto mais tickets resolvidos em menos tempo, maior o índice. É um equilíbrio entre quantidade e velocidade.

**Escala de referência:**
- 0-30: Precisa de atenção urgente
- 31-50: Abaixo do esperado
- 51-70: Na média
- 71-85: Bom desempenho
- 86-100: Excelente

#### 🕐 Horários de Pico
Identifica em quais horas do dia mais tickets são criados.

**Por que isso importa?**
- Ajuda a planejar escalas de trabalho
- Mostra quando o time precisa estar mais atento
- Permite antecipar demandas

**Exemplo:**
```
Pico: 10:00 às 11:00 (47 tickets)
```
> Isso significa que a maioria dos clientes abre tickets por volta das 10h da manhã.

#### 📅 Tickets por Dia
Média de tickets criados por dia no período analisado.

**Como é calculado:**
```
Média = Total de Tickets ÷ Número de Dias do Período
```

> **Útil para:** Dimensionar equipe. Se a média é 50 tickets/dia e cada pessoa resolve 10, você precisa de pelo menos 5 pessoas.

#### 📉 Tendência
Mostra se o volume está subindo, estável ou caindo ao longo do tempo.

- **↗️ Subindo:** Pode indicar crescimento da base de clientes OU problemas no produto
- **→ Estável:** Situação controlada
- **↘️ Caindo:** Menos demanda OU clientes satisfeitos precisando de menos suporte

---

## ⭐ Sub-aba: CSAT (Satisfação do Cliente)

### O que faz?
Mostra as avaliações que os clientes deixaram após terem seus tickets resolvidos. CSAT significa "Customer Satisfaction Score".

### Quando usar?
- Medir qualidade do atendimento
- Identificar padrões de insatisfação
- Premiar atendentes bem avaliados
- Treinar com base em feedbacks negativos

### Como interpretar?

#### 😊 Nota Média (CSAT Score)
A nota média das avaliações, geralmente de 1 a 5 estrelas.

**Escala de interpretação:**
- ⭐ (1.0-1.9): Crítico - precisa de ação imediata
- ⭐⭐ (2.0-2.9): Ruim - muitos clientes insatisfeitos
- ⭐⭐⭐ (3.0-3.4): Regular - espaço para melhorar
- ⭐⭐⭐⭐ (3.5-4.4): Bom - clientes satisfeitos
- ⭐⭐⭐⭐⭐ (4.5-5.0): Excelente - referência de qualidade

#### 📊 Distribuição de Notas
Gráfico mostrando quantas avaliações cada nota recebeu.

**Exemplo:**
```
⭐⭐⭐⭐⭐ (5): ████████████ 120 avaliações
⭐⭐⭐⭐ (4):   ██████ 60 avaliações
⭐⭐⭐ (3):    ███ 30 avaliações
⭐⭐ (2):      █ 10 avaliações
⭐ (1):        █ 5 avaliações
```

> **Ideal:** A maioria das avaliações concentrada em 4 e 5 estrelas.

#### 💬 Feedbacks Recentes
Lista dos comentários mais recentes deixados pelos clientes.

> **Dica de ouro:** Leia os feedbacks negativos com atenção. Eles revelam problemas que números não mostram.

#### 👤 CSAT por Agente
Mostra a nota média de cada atendente individualmente.

> **Cuidado:** Não use apenas para punir. Use para identificar quem precisa de treinamento e quem pode ser mentor.

---

## ⏱️ Sub-aba: TEMPO (Time Entries)

### O que faz?
Analisa as **horas trabalhadas** registradas nos tickets. Diferente das outras abas que focam em quantidade e velocidade, esta foca no **esforço real**.

### Quando usar?
- Calcular custo de atendimento
- Identificar tickets que consomem muito tempo
- Justificar horas extras
- Analisar eficiência (horas vs. resultado)

### Como interpretar?

#### ⏰ Total de Horas
Soma de todas as horas registradas no período.

> **Contexto:** Compare com o total de horas contratadas para ver se há sobrecarga ou ociosidade.

#### 📊 Horas por Pessoa
Quanto cada membro do time registrou de tempo.

**Análise sugerida:**
- Muito acima da média: Pode estar sobrecarregado
- Muito abaixo da média: Pode não estar registrando corretamente OU está com poucas demandas

#### 🎫 Tempo Médio por Ticket
Quanto tempo, em média, é gasto em cada ticket.

**Como é calculado:**
```
Tempo Médio = Total de Horas ÷ Número de Tickets com Registro
```

> **Insight:** Se a média é 2 horas e alguns tickets têm 10 horas, esses são os casos que merecem atenção especial.

#### 📈 Distribuição por Dia
Mostra como as horas estão distribuídas ao longo dos dias.

> **Útil para:** Identificar dias mais pesados e planejar escalas.

---

## 🏷️ Sub-aba: ACOMPANHAMENTO

### O que faz?
Diferente das outras abas que medem quem **resolveu**, esta mede quem **acompanhou** cada ticket. Usa as **tags** para identificar participação.

### Por que isso é diferente?
Um ticket pode ser resolvido por uma pessoa, mas várias outras podem ter participado:
- Quem fez a triagem inicial
- Quem deu suporte técnico
- Quem escalou para outro time
- Quem acompanhou até o fim

### Quando usar?
- Medir contribuição indireta
- Reconhecer trabalho em equipe
- Identificar pessoas "ponte" entre times
- Analisar colaboração

### Como interpretar?

#### 🏷️ Tickets Acompanhados
Quantidade de tickets em que a pessoa foi marcada via tag.

> **Diferença importante:** 
> - "Tratativa" = quem resolveu
> - "Acompanhamento" = quem participou

#### ✅ Taxa de Sucesso do Acompanhamento
Dos tickets que a pessoa acompanhou, quantos foram resolvidos com sucesso?

**Como é calculado:**
```
Taxa = (Tickets Acompanhados que foram Resolvidos ÷ Total Acompanhados) × 100
```

> **O que isso mostra?** Quando alguém participa de um ticket, as chances de sucesso aumentam ou diminuem?

#### 🤝 Mapa de Colaboração
Mostra quais pessoas frequentemente trabalham juntas nos mesmos tickets.

> **Insight:** Identifica duplas ou trios que funcionam bem juntos.

---

## 🎛️ Filtros Globais

Todas as sub-abas compartilham filtros que afetam os dados exibidos:

### 📅 Período
- **7 dias:** Visão da última semana
- **30 dias:** Visão do último mês (padrão)
- **90 dias:** Visão trimestral
- **180 dias:** Visão semestral
- **365 dias:** Visão anual
- **Todo período:** Todos os dados disponíveis
- **Personalizado:** Você escolhe as datas

### 🔄 Atualização
Os dados são carregados do banco de dados e ficam em cache por 5 minutos. Clique em "Atualizar" para forçar uma nova consulta.

---

## 📐 Resumo das Principais Métricas

| Métrica | O que mede | Como ler |
|---------|-----------|----------|
| Taxa de Resolução | % de tickets fechados | Maior = melhor |
| Tempo de 1ª Resposta | Rapidez inicial | Menor = melhor |
| Tempo de Resolução | Rapidez total | Menor = melhor (com ressalvas) |
| Índice Produtividade | Eficiência geral | 0-100, maior = melhor |
| CSAT | Satisfação | 1-5 estrelas, maior = melhor |
| SLA Compliance | % dentro do prazo | Meta: >90% |

---

## 💡 Dicas de Uso

1. **Não compare maçãs com laranjas**
   - Times de desenvolvimento têm métricas diferentes de suporte
   - Tickets de bug são diferentes de dúvidas simples

2. **Olhe tendências, não momentos**
   - Um dia ruim não define o mês
   - Compare períodos iguais (este mês vs. mês passado)

3. **Combine quantidade com qualidade**
   - Muitos tickets resolvidos + CSAT baixo = problema
   - Poucos tickets + CSAT alto = possível oportunidade

4. **Use os feedbacks**
   - Números mostram O QUE está acontecendo
   - Feedbacks mostram POR QUE

5. **Ação > Análise**
   - Dados sem ação são apenas números bonitos
   - Defina o que fazer com cada insight

---

## 🆘 Perguntas Frequentes

**P: Por que meus números parecem diferentes do que eu esperava?**
R: Verifique o período selecionado e se os filtros estão corretos. Tickets sem data de resolução não aparecem em métricas de resolução.

**P: O que significa quando a taxa de resolução é baixa?**
R: Pode indicar tickets em andamento (normal), tickets abandonados (problema) ou tickets muito complexos (esperado para dev).

**P: Como sei se meu CSAT é bom?**
R: A média do mercado de suporte técnico é entre 3.8 e 4.2. Acima de 4.5 é excelente.

**P: Por que o tempo de resolução de algumas pessoas é muito alto?**
R: Analise os tickets específicos. Pode ser complexidade genuína ou tickets "esquecidos" que foram fechados tarde.

---

## 🔄 Sub-aba: CONSOLIDADO

### O que faz?
Combina dados de **Tratativa** (quem resolveu) e **Acompanhamento** (quem acompanhou) em uma única visão **TOTAL**. Mostra a produtividade real somando ambas as fontes.

### Quando usar?
- Visão completa da carga de trabalho
- Comparar produtividade total da equipe
- Identificar quem trabalha em mais tickets (independente da fonte)

### Como interpretar?

#### 🎫 Total Atribuído
Soma de todos os tickets onde a pessoa aparece em **Tratativa** OU **Acompanhamento** (sem duplicação).

#### 📊 Análise de Cruzamento de Dados
Mostra de onde vêm os tickets:
- **Apenas Tratativa:** Tickets só com `cf_tratativa` preenchido
- **Apenas Acompanhamento:** Tickets só com `cf_acompanhamento_atendimento` ou tags
- **Ambas as Fontes:** Tickets com ambos os campos preenchidos

#### 🏆 Ranking Consolidado
Tabela ordenada por total de tickets, mostrando:
- **Total:** Quantidade total de tickets
- **Abertos:** Em andamento + Pendentes
- **Resolvidos:** Finalizados com sucesso
- **Taxa:** Percentual de resolução
- **Fonte:** T:X A:Y (origem dos tickets - Tratativa vs Acompanhamento)

> **💡 Dica:** Clique em qualquer linha do ranking para ver a lista completa de tickets da pessoa!

---

*Documento criado para facilitar a interpretação do módulo BI Analytics. Última atualização: Março/2026*
