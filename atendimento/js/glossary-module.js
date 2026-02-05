/**
 * Glossário - Módulo de Documentação de Cálculos e Métricas
 * Explica todas as métricas, cálculos e onde são utilizados no sistema
 */

window.glossaryModule = {
    colors: {
        bg: '#1e1e2e',
        card: '#252536',
        text: '#e4e4e7',
        textMuted: '#a1a1aa',
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        purple: '#8b5cf6',
        pink: '#ec4899',
        border: '#3f3f5a'
    },
    
    // Dados do glossário organizados por categoria
    glossaryData: {
        conceitos: {
            title: '📚 Conceitos Básicos',
            description: 'Terminologia e conceitos fundamentais do sistema de tickets',
            items: [
                {
                    name: 'Contato (Requester)',
                    formula: 'Campo: requester_id, requester_name, requester_email',
                    where: 'Filtro "Todos os Contatos", Tabela de tickets, Relatórios',
                    interpretation: 'É o CLIENTE que abriu o ticket pedindo suporte.',
                    icon: '📞',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        O <span style="color:#3b82f6;font-weight:bold">Contato</span> é a pessoa ou empresa que 
                        <strong>abriu o ticket</strong> solicitando suporte ou atendimento.<br><br>
                        
                        <strong>🎯 Para que serve o filtro:</strong><br>
                        • Ver todos os tickets de um cliente específico<br>
                        • Analisar histórico de solicitações de um cliente<br>
                        • Identificar clientes com muitos problemas<br>
                        • Verificar frequência de abertura de tickets<br><br>
                        
                        <strong>📊 Exemplo prático:</strong><br>
                        Se você filtrar por Contato = "João da Empresa X", verá todos os tickets 
                        que o João abriu, independente de quem atendeu.<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Campos utilizados:</strong><br>
                        • <code>requester_id</code> - ID único do contato<br>
                        • <code>requester_name</code> - Nome do contato<br>
                        • <code>requester_email</code> - Email do contato<br><br>
                        
                        <strong>⚠️ Não confundir com:</strong><br>
                        • <strong>Agente:</strong> Funcionário que atende o ticket<br>
                        • <strong>Time:</strong> Grupo de agentes
                    `
                },
                {
                    name: 'Agente (Responder)',
                    formula: 'Campo: responder_id',
                    where: 'Filtro "Todos os Agentes", Métricas de produtividade, Relatórios',
                    interpretation: 'É o FUNCIONÁRIO individual que atende/resolve o ticket.',
                    icon: '👤',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        O <span style="color:#10b981;font-weight:bold">Agente</span> é o funcionário da empresa que 
                        <strong>atende e resolve</strong> os tickets dos clientes.<br><br>
                        
                        <strong>🎯 Para que serve o filtro:</strong><br>
                        • Ver tickets de um atendente específico<br>
                        • Medir produtividade individual<br>
                        • Calcular SLA por agente<br>
                        • Identificar carga de trabalho<br><br>
                        
                        <strong>📊 Exemplo prático:</strong><br>
                        Se você filtrar por Agente = "Maria Silva", verá todos os tickets 
                        que a Maria está atendendo ou atendeu.<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Campos utilizados:</strong><br>
                        • <code>responder_id</code> - ID do agente responsável<br><br>
                        
                        <strong>🏢 Hierarquia:</strong><br>
                        <div style="background:#3f3f5a;padding:1rem;border-radius:8px;margin:1rem 0;font-family:monospace;">
                        Time (Grupo)<br>
                        &nbsp;&nbsp;├── Agente 1 (pessoa)<br>
                        &nbsp;&nbsp;├── Agente 2 (pessoa)<br>
                        &nbsp;&nbsp;└── Agente 3 (pessoa)
                        </div>
                    `
                },
                {
                    name: 'Time / Grupo (Group)',
                    formula: 'Campo: group_id',
                    where: 'Filtro "Todos os Times", BI Analytics, Relatórios por equipe',
                    interpretation: 'É uma EQUIPE de agentes que trabalham juntos.',
                    icon: '👥',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        O <span style="color:#8b5cf6;font-weight:bold">Time</span> (ou Grupo) é uma 
                        <strong>equipe de atendentes</strong> que trabalham juntos em determinado tipo de demanda.<br><br>
                        
                        <strong>🎯 Para que serve o filtro:</strong><br>
                        • Ver todos os tickets de uma equipe<br>
                        • Comparar performance entre times<br>
                        • Analisar carga de trabalho por equipe<br>
                        • Medir SLA coletivo do time<br><br>
                        
                        <strong>📊 Exemplo prático:</strong><br>
                        Se você filtrar por Time = "Time CS", verá os 84 tickets que o time inteiro 
                        atendeu (soma de todos os agentes do time).<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Campos utilizados:</strong><br>
                        • <code>group_id</code> - ID do time/grupo<br><br>
                        
                        <strong>📊 Diferença importante:</strong><br>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Filtro</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">O que mostra</th>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;">📞 Contato = "Time CS"</td>
                                <td style="border:1px solid #555;">Tickets abertos por alguém chamado "Time CS"</td>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;">👥 Time = "Time CS"</td>
                                <td style="border:1px solid #555;">Tickets atendidos pela equipe "Time CS"</td>
                            </tr>
                        </table>
                    `
                },
                {
                    name: 'Diferença: Contato vs Agente vs Time',
                    formula: 'Filtros diferentes = métricas diferentes',
                    where: 'Todos os filtros do dashboard',
                    interpretation: 'Cada filtro analisa o ticket por um ângulo diferente.',
                    icon: '🔄',
                    details: `
                        <strong>💡 Resumo visual:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:13px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:10px;text-align:left;border:1px solid #555;">Termo</th>
                                <th style="padding:10px;text-align:left;border:1px solid #555;">Quem é</th>
                                <th style="padding:10px;text-align:left;border:1px solid #555;">O que faz</th>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>📞 Contato</strong></td>
                                <td style="border:1px solid #555;">Cliente externo</td>
                                <td style="border:1px solid #555;"><span style="color:#3b82f6;">ABRE</span> tickets pedindo ajuda</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>👤 Agente</strong></td>
                                <td style="border:1px solid #555;">Funcionário individual</td>
                                <td style="border:1px solid #555;"><span style="color:#10b981;">RESOLVE</span> tickets</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>👥 Time</strong></td>
                                <td style="border:1px solid #555;">Equipe de funcionários</td>
                                <td style="border:1px solid #555;"><span style="color:#8b5cf6;">GERENCIA</span> tickets coletivamente</td>
                            </tr>
                        </table>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Exemplo com números:</strong><br><br>
                        
                        <div style="background:#252536;padding:1rem;border-radius:8px;border:1px solid #3f3f5a;">
                            <p style="margin:0 0 0.5rem 0;"><strong>Cenário:</strong> Cliente "João" abriu um ticket que foi atendido por "Maria" do "Time CS"</p>
                            
                            <p style="margin:0.5rem 0;color:#3b82f6;">📞 Filtrar por <strong>Contato = João</strong>: mostra esse ticket (João abriu)</p>
                            <p style="margin:0.5rem 0;color:#10b981;">👤 Filtrar por <strong>Agente = Maria</strong>: mostra esse ticket (Maria atendeu)</p>
                            <p style="margin:0.5rem 0;color:#8b5cf6;">👥 Filtrar por <strong>Time = Time CS</strong>: mostra esse ticket (Time CS é responsável)</p>
                        </div>
                    `
                },
                {
                    name: 'Tratativa (cf_tratativa)',
                    formula: 'Campo customizado: cf_tratativa, cf_grupo_tratativa',
                    where: 'BI Analytics (Pessoa/Time), Filtros de produtividade, Métricas individuais',
                    interpretation: 'É quem REALMENTE trabalhou no ticket. Diferente de responder_id que é só atribuição.',
                    icon: '🎯',
                    details: `
                        <strong>💡 O que é Tratativa:</strong><br>
                        A <span style="color:#ec4899;font-weight:bold">Tratativa</span> é um campo customizado do Freshdesk que indica 
                        <strong>quem realmente trabalhou/resolveu o ticket</strong>, não apenas quem foi atribuído.<br><br>
                        
                        <strong>🎯 Por que é importante:</strong><br>
                        • <strong>Responsabilidade real</strong> - identifica quem de fato trabalhou<br>
                        • <strong>Métricas justas</strong> - não penaliza quem só recebeu atribuição<br>
                        • <strong>Produtividade precisa</strong> - mede entregas reais, não apenas atribuições<br>
                        • <strong>Múltiplas pessoas</strong> - suporta tickets trabalhados por mais de uma pessoa<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Campos utilizados:</strong><br>
                        • <code>cf_tratativa</code> - Nome da pessoa que trabalhou no ticket<br>
                        • <code>cf_grupo_tratativa</code> - Time/grupo responsável pela tratativa<br><br>
                        
                        <strong>⚠️ Diferença importante:</strong><br>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Campo</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">O que representa</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Uso no BI</th>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;"><code>responder_id</code></td>
                                <td style="border:1px solid #555;">Quem foi <strong>atribuído</strong> ao ticket</td>
                                <td style="border:1px solid #555;">❌ NÃO usado no BI Analytics</td>
                            </tr>
                            <tr style="background:#ec489920;">
                                <td style="padding:6px;border:1px solid #555;font-weight:bold;"><code>cf_tratativa</code></td>
                                <td style="border:1px solid #555;">Quem <strong>trabalhou/resolveu</strong> o ticket</td>
                                <td style="border:1px solid #555;">✅ Usado no BI Analytics</td>
                            </tr>
                        </table>
                        
                        <strong>📊 Exemplo prático:</strong><br>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Cenário:</strong> Ticket atribuído para João, mas Maria resolveu<br><br>
                            • <code>responder_id</code> = João (atribuição)<br>
                            • <code>cf_tratativa</code> = Maria (quem trabalhou)<br><br>
                            
                            <strong>No BI Analytics:</strong><br>
                            • ❌ NÃO conta para João<br>
                            • ✅ Conta para Maria
                        </div>
                    `
                },
                {
                    name: 'Atribuídos vs Resolvidos (Nova Lógica)',
                    formula: 'Atribuídos = todos com tratativa | Resolvidos = tratativa + status 4/5',
                    where: 'BI Analytics - Cards, Tabela de Métricas, Gráficos',
                    interpretation: 'Separa quem RECEBEU demandas de quem ENTREGOU. Fundamental para medir produtividade real.',
                    icon: '⚖️',
                    details: `
                        <strong>💡 Nova Lógica de Métricas:</strong><br>
                        O BI Analytics agora diferencia claramente entre tickets <span style="color:#3b82f6;font-weight:bold">ATRIBUÍDOS</span> 
                        (recebidos para trabalhar) e <span style="color:#10b981;font-weight:bold">RESOLVIDOS</span> (efetivamente finalizados).<br><br>
                        
                        <strong>📊 Definições:</strong><br>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#3b82f620;padding:1rem;border-radius:8px;border:1px solid #3b82f6;">
                                <strong style="font-size:1.2rem;">📋 Atribuídos</strong><br>
                                <span style="font-size:12px;">Todos os tickets com <code>cf_tratativa</code> = pessoa</span><br><br>
                                <strong>Inclui:</strong><br>
                                • Tickets abertos<br>
                                • Tickets pendentes<br>
                                • Tickets em andamento<br>
                                • Tickets resolvidos
                            </div>
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong style="font-size:1.2rem;">✅ Resolvidos</strong><br>
                                <span style="font-size:12px;">Atribuídos + status = 4 ou 5</span><br><br>
                                <strong>Apenas:</strong><br>
                                • Status 4 (Resolvido)<br>
                                • Status 5 (Fechado)<br>
                                • Finalizados de fato
                            </div>
                        </div>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📈 Métricas Derivadas:</strong><br>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Métrica</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Fórmula</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><strong>Taxa de Resolução</strong></td><td style="border:1px solid #555;"><code>Resolvidos / Atribuídos × 100%</code></td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><strong>Backlog</strong></td><td style="border:1px solid #555;"><code>Atribuídos - Resolvidos</code></td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><strong>Resolvidos no Período</strong></td><td style="border:1px solid #555;"><code>Atribuídos + status 4/5 + resolução no período</code></td></tr>
                        </table>
                        
                        <strong>📊 Exemplo:</strong><br>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Maria no período de 7 dias:</strong><br>
                            • Atribuídos: 20 tickets<br>
                            • Resolvidos: 15 tickets<br>
                            • Backlog: 5 tickets<br>
                            • Taxa: 75%<br><br>
                            
                            <span style="color:#f59e0b;">⚠️ Maria tem 5 tickets pendentes para resolver</span>
                        </div>
                    `
                }
            ]
        },
        kpis: {
            title: '📊 KPIs Principais',
            description: 'Indicadores chave de desempenho exibidos nos cards do dashboard',
            items: [
                {
                    name: 'Total de Tickets',
                    formula: 'Contagem simples de todos os tickets no período filtrado',
                    where: 'Card principal do BI Analytics, Relatórios, Header de todas as abas',
                    interpretation: 'Volume total de demandas. Útil para dimensionar equipe e recursos.',
                    icon: '🎫',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Total de Tickets representa o <span style="color:#3b82f6;font-weight:bold">volume bruto de demandas</span> recebidas no período.
                        É a métrica mais básica e fundamental para entender a carga de trabalho.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Dimensionar equipe</strong> - saber se precisa contratar ou redistribuir<br>
                        • <strong>Identificar tendências</strong> - volume crescendo ou diminuindo?<br>
                        • <strong>Planejar capacidade</strong> - quantos tickets a equipe consegue atender?<br>
                        • <strong>Comparar períodos</strong> - este mês vs mês anterior<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • Crescimento constante sem aumento de equipe = sobrecarga futura<br>
                        • Volume muito variável = demanda imprevisível<br>
                        • Volume estável = operação madura<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linha ~665)<br>
                        • Variável: <code>totalTickets = this.filteredData.length</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • Não depende de nenhum campo específico<br>
                        • Conta todos os registros no array <code>filteredData</code><br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>totalTickets = this.filteredData.length</code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Todos os tickets que passaram pelos filtros de período<br>
                        • Todos os tickets que passaram pelos filtros de entidade selecionada<br>
                        • Não filtra por status - conta TODOS<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket é contado apenas UMA vez<br>
                        • Se um ticket tem múltiplas pessoas em cf_tratativa, ele aparece 1x no total geral<br>
                        • MAS: na visão por pessoa, ele conta +1 para CADA pessoa mencionada
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📈 Análise de Tendência de Volume</h4>
                        
                        <p>O volume de tickets é influenciado por diversos fatores:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Fator</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Impacto no Volume</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">📅 Dia da semana</td><td style="border:1px solid #555;">Segunda-feira geralmente tem mais tickets</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🗓️ Época do mês</td><td style="border:1px solid #555;">Início/fim de mês pode ter picos</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🚀 Lançamentos</td><td style="border:1px solid #555;">Novos recursos = mais dúvidas</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🐛 Bugs</td><td style="border:1px solid #555;">Problemas causam pico de tickets</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">📣 Marketing</td><td style="border:1px solid #555;">Campanhas = mais clientes = mais tickets</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Métricas Relacionadas</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#3b82f620;padding:1rem;border-radius:8px;border:1px solid #3b82f6;">
                                <strong>Tickets/Dia</strong><br>
                                <span style="font-size:12px;">Total ÷ Dias do período</span>
                            </div>
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong>Crescimento</strong><br>
                                <span style="font-size:12px;">(Atual - Anterior) ÷ Anterior × 100</span>
                            </div>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Cuidados na Análise</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Comparar períodos iguais!</strong><br>
                            • 30 dias vs 30 dias (não 30 vs 7)<br>
                            • Mesmo dia da semana (seg vs seg)<br>
                            • Considerar sazonalidade (dezembro vs janeiro)
                        </div>
                    `
                },
                {
                    name: 'Tickets Abertos',
                    formula: 'Tickets com status ≠ 4 (Resolvido) e ≠ 5 (Fechado)',
                    where: 'Card do BI Analytics, filtros, indicador de backlog',
                    interpretation: 'Backlog atual. Se crescer constantemente, indica capacidade insuficiente.',
                    icon: '📬',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Tickets Abertos representa o <span style="color:#f59e0b;font-weight:bold">backlog atual</span> - demandas que ainda precisam ser resolvidas.
                        É o "trabalho pendente" da equipe.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir backlog</strong> - quanto trabalho está acumulado?<br>
                        • <strong>Detectar gargalos</strong> - backlog crescendo = problema<br>
                        • <strong>Priorizar ações</strong> - muito aberto = precisa de ação imediata<br>
                        • <strong>Balancear carga</strong> - quem tem mais abertos precisa de ajuda<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">Abertos < 10% do total</span> = Saudável<br>
                        • <span style="color:#f59e0b">Abertos 10-30% do total</span> = Atenção<br>
                        • <span style="color:#ef4444">Abertos > 30% do total</span> = Crítico<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linha ~667-670)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>status</code> - Status numérico do ticket<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>openTickets = filteredData.filter(t => t.status === 2).length</code><br>
                        <code>backlogTickets = filteredData.filter(t => !(t.status === 4 || t.status === 5)).length</code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Status 2 = Aberto (contado como "open")<br>
                        • Status 3 = Pendente (contado separadamente)<br>
                        • Status 4 e 5 = NÃO são contados como abertos<br>
                        • Outros status = contados como "em progresso"<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Mesmo tratamento do Total de Tickets<br>
                        • Cada ticket conta 1x no total de abertos
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🏷️ Composição do Backlog por Status</h4>
                        
                        <p>Tickets "abertos" incluem diversos status intermediários:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:11px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;text-align:left;border:1px solid #555;">ID</th>
                                <th style="padding:6px;text-align:left;border:1px solid #555;">Status</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Categoria</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">No Backlog?</th>
                            </tr>
                            <tr style="background:#ef444420;"><td style="padding:4px;border:1px solid #555;">2</td><td style="border:1px solid #555;">Aberto</td><td style="text-align:center;border:1px solid #555;">🔴 Novo</td><td style="text-align:center;border:1px solid #555;">✅ Sim</td></tr>
                            <tr style="background:#f59e0b20;"><td style="padding:4px;border:1px solid #555;">3</td><td style="border:1px solid #555;">Pendente</td><td style="text-align:center;border:1px solid #555;">⏸️ Parado</td><td style="text-align:center;border:1px solid #555;">✅ Sim</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:4px;border:1px solid #555;">4</td><td style="border:1px solid #555;">Resolvido</td><td style="text-align:center;border:1px solid #555;">✅ Fechado</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:4px;border:1px solid #555;">5</td><td style="border:1px solid #555;">Fechado</td><td style="text-align:center;border:1px solid #555;">✅ Fechado</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr style="background:#8b5cf620;"><td style="padding:4px;border:1px solid #555;">6</td><td style="border:1px solid #555;">Em Homologação</td><td style="text-align:center;border:1px solid #555;">🔄 Progresso</td><td style="text-align:center;border:1px solid #555;">✅ Sim</td></tr>
                            <tr style="background:#f59e0b20;"><td style="padding:4px;border:1px solid #555;">7</td><td style="border:1px solid #555;">Aguardando Cliente</td><td style="text-align:center;border:1px solid #555;">⏸️ Parado</td><td style="text-align:center;border:1px solid #555;">✅ Sim</td></tr>
                            <tr style="background:#06b6d420;"><td style="padding:4px;border:1px solid #555;">8-11</td><td style="border:1px solid #555;">Em Tratativa/Análise</td><td style="text-align:center;border:1px solid #555;">🔄 Progresso</td><td style="text-align:center;border:1px solid #555;">✅ Sim</td></tr>
                            <tr style="background:#3b82f620;"><td style="padding:4px;border:1px solid #555;">12-21</td><td style="border:1px solid #555;">Outros</td><td style="text-align:center;border:1px solid #555;">🔄 Varia</td><td style="text-align:center;border:1px solid #555;">✅ Sim</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Análise de Saúde do Backlog</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Fórmula de saúde:</strong><br>
                            <code>backlogHealthy = backlog / totalDias <= capacidadeDiaria</code><br><br>
                            
                            <strong>Exemplo:</strong><br>
                            • Backlog: 50 tickets<br>
                            • Capacidade: 10 resoluções/dia<br>
                            • Dias para zerar: 50 ÷ 10 = 5 dias ✅
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Sinais de Alerta</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Backlog crescendo significa:</strong><br>
                            • Criando mais do que resolvendo<br>
                            • Equipe subdimensionada<br>
                            • Tickets travados em algum status<br>
                            • Processo com gargalo
                        </div>
                    `
                },
                {
                    name: 'Tickets Resolvidos',
                    formula: 'Tickets com status = 4 (Resolvido) ou status = 5 (Fechado)',
                    where: 'Card do BI Analytics, gráficos de produtividade, cálculo de taxa',
                    interpretation: 'Volume de entregas. Compare com criados para ver tendência.',
                    icon: '✅',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Tickets Resolvidos representa o <span style="color:#10b981;font-weight:bold">volume de entregas</span> - demandas que foram finalizadas com sucesso.
                        É a métrica de "trabalho concluído".<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir produtividade</strong> - quantos tickets a equipe resolveu?<br>
                        • <strong>Comparar com criados</strong> - resolvendo mais ou menos do que recebe?<br>
                        • <strong>Calcular taxa de resolução</strong> - base para o cálculo de eficiência<br>
                        • <strong>Acompanhar tendência</strong> - produtividade melhorando ou piorando?<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • Resolvidos > Criados = Equipe reduzindo backlog ✅<br>
                        • Resolvidos = Criados = Equipe mantendo ritmo ⚠️<br>
                        • Resolvidos < Criados = Backlog acumulando ❌<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linha ~666)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>status</code> - Status numérico do ticket<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>resolvedTickets = filteredData.filter(t => t.status === 4 || t.status === 5).length</code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Status 4 = Resolvido (solução aplicada)<br>
                        • Status 5 = Fechado (confirmado pelo cliente ou auto-fechado)<br>
                        • Ambos são considerados "resolvidos" para efeito de produtividade<br>
                        • Não diferencia QUEM resolveu no total geral<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Na visão por pessoa: ticket conta +1 para CADA pessoa no cf_tratativa<br>
                        • No total geral: ticket conta apenas 1x
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📈 Análise de Throughput</h4>
                        
                        <p>O número de resolvidos indica a <strong>capacidade de entrega</strong> da equipe:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Métrica</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Fórmula</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Uso</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Throughput diário</td><td style="border:1px solid #555;">Resolvidos ÷ Dias</td><td style="border:1px solid #555;">Capacidade média</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Throughput pessoa</td><td style="border:1px solid #555;">Resolvidos ÷ Pessoas</td><td style="border:1px solid #555;">Produtividade individual</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Velocidade</td><td style="border:1px solid #555;">Resolvidos ÷ Tempo médio</td><td style="border:1px solid #555;">Eficiência de fluxo</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Comparativo Criados vs Resolvidos</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;text-align:center;">
                                <strong style="font-size:1.5rem;">↗️</strong><br>
                                <span style="font-size:11px;">Res > Cri</span><br>
                                <span style="font-size:10px;color:#10b981;">Reduzindo backlog</span>
                            </div>
                            <div style="background:#f59e0b20;padding:1rem;border-radius:8px;border:1px solid #f59e0b;text-align:center;">
                                <strong style="font-size:1.5rem;">→</strong><br>
                                <span style="font-size:11px;">Res = Cri</span><br>
                                <span style="font-size:10px;color:#f59e0b;">Mantendo ritmo</span>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;text-align:center;">
                                <strong style="font-size:1.5rem;">↘️</strong><br>
                                <span style="font-size:11px;">Res < Cri</span><br>
                                <span style="font-size:10px;color:#ef4444;">Acumulando</span>
                            </div>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Status que contam como Resolvido</h4>
                        
                        <div style="background:#065f46;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Apenas 2 status:</strong><br>
                            • <strong>4</strong> - Resolvido (solução aplicada)<br>
                            • <strong>5</strong> - Fechado (confirmado/auto-fechado)<br><br>
                            
                            ⚠️ "Em Produção" (21) NÃO conta como resolvido!<br>
                            ⚠️ "Em Homologação" (6) NÃO conta como resolvido!
                        </div>
                    `
                },
                {
                    name: 'Taxa de Resolução',
                    formula: '(Resolvidos / Atribuídos) × 100%',
                    where: 'Card do BI Analytics, Tabela de Produtividade (coluna TAXA), Gráfico de Barras',
                    interpretation: 'Eficiência de entrega. Mede quantos tickets atribuídos foram efetivamente finalizados.',
                    icon: '📈',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        A Taxa de Resolução mede a <span style="color:#10b981;font-weight:bold">eficiência de entrega</span> de um atendente ou time. 
                        Indica qual percentual dos tickets <strong>ATRIBUÍDOS</strong> (via cf_tratativa) foram efetivamente <strong>RESOLVIDOS</strong>.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • Avaliar a <strong>produtividade real</strong> - não basta receber tickets, precisa resolver<br>
                        • Identificar <strong>gargalos</strong> - taxa baixa indica tickets acumulando<br>
                        • Comparar <strong>performance entre pessoas/times</strong><br>
                        • Medir <strong>capacidade de entrega</strong> vs demanda recebida<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">≥ 90%</span> = Excelente - resolvendo quase tudo que recebe<br>
                        • <span style="color:#f59e0b">70-89%</span> = Regular - há acúmulo de pendências<br>
                        • <span style="color:#ef4444">< 70%</span> = Crítico - muitos tickets sem resolução<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code><br>
                        • Propriedades: <code>allAssignedTickets</code>, <code>resolvedInPeriod</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>cf_tratativa</code> - Identifica quem trabalhou no ticket<br>
                        • <code>status</code> - Status 4 (Resolvido) ou 5 (Fechado)<br>
                        • <code>stats_resolved_at</code> - Data de resolução (para filtro de período)<br><br>
                        
                        <strong>🧮 Cálculo exato (NOVA LÓGICA):</strong><br>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <code>
                            // 1. Tickets ATRIBUÍDOS (todos com cf_tratativa = pessoa)<br>
                            atribuidos = tickets.filter(t => t.cf_tratativa.includes(pessoa))<br><br>
                            
                            // 2. Tickets RESOLVIDOS (atribuídos + status fechado)<br>
                            resolvidos = atribuidos.filter(t => status IN [4, 5])<br><br>
                            
                            // 3. Taxa de Resolução<br>
                            taxa = (resolvidos / atribuidos) × 100%
                            </code>
                        </div>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • <strong>Atribuídos</strong>: Todos os tickets onde cf_tratativa contém a pessoa<br>
                        • <strong>Resolvidos</strong>: Atribuídos com status = 4 OU status = 5<br>
                        • Calculado individualmente por pessoa/time quando agrupado<br>
                        • Se atribuídos = 0, retorna 0%
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🏷️ Status Considerados como "Resolvido"</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">ID</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Status</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Conta como Resolvido?</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">2</td><td style="border:1px solid #555;">Aberto</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">3</td><td style="border:1px solid #555;">Pendente</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">4</td><td style="border:1px solid #555;font-weight:bold;">Resolvido</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ SIM</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">5</td><td style="border:1px solid #555;font-weight:bold;">Fechado</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ SIM</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">6</td><td style="border:1px solid #555;">Em Homologação</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">7</td><td style="border:1px solid #555;">Aguardando Cliente</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">8</td><td style="border:1px solid #555;">Em Tratativa</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">10</td><td style="border:1px solid #555;">Em Análise</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">11</td><td style="border:1px solid #555;">Interno</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">12-21</td><td style="border:1px solid #555;">Outros status customizados</td><td style="text-align:center;border:1px solid #555;">❌ Não</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Exemplo de Cálculo</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Dados:</strong><br>
                            • Total de tickets: 100<br>
                            • Status 4 (Resolvido): 45<br>
                            • Status 5 (Fechado): 30<br>
                            • Outros status: 25<br><br>
                            
                            <strong>Cálculo:</strong><br>
                            <code>Taxa = (45 + 30) / 100 × 100 = 75%</code>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Cuidados na Interpretação</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Taxa baixa NEM SEMPRE é ruim!</strong><br>
                            • Período recente = tickets ainda não deram tempo de resolver<br>
                            • Muitos tickets em "Aguardando Cliente" = depende do cliente<br>
                            • Tickets de desenvolvimento = naturalmente demoram mais<br><br>
                            
                            <strong>Analise junto com:</strong><br>
                            • Tempo médio de resolução<br>
                            • Distribuição por status<br>
                            • Tipo de ticket
                        </div>
                    `
                },
                {
                    name: 'Backlog (Pendentes)',
                    formula: 'Atribuídos - Resolvidos = Tickets ainda não finalizados',
                    where: 'BI Analytics - Cards, Indicador de carga pendente',
                    interpretation: 'Quantidade de tickets atribuídos que ainda não foram resolvidos. Indica carga de trabalho pendente.',
                    icon: '📦',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Backlog representa a <span style="color:#f59e0b;font-weight:bold">carga de trabalho pendente</span> de uma pessoa ou time.
                        São tickets que foram atribuídos (via cf_tratativa) mas ainda não foram finalizados.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir carga pendente</strong> - quantos tickets ainda precisam ser resolvidos?<br>
                        • <strong>Identificar sobrecarga</strong> - pessoa com muito backlog precisa de ajuda<br>
                        • <strong>Planejar recursos</strong> - distribuir demandas de forma equilibrada<br>
                        • <strong>Previsão de entregas</strong> - estimar quando o backlog será zerado<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">0-5 tickets</span> = Saudável<br>
                        • <span style="color:#f59e0b">6-15 tickets</span> = Atenção - acumulando<br>
                        • <span style="color:#ef4444">> 15 tickets</span> = Crítico - precisa de ação<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <code>
                            // Backlog = Atribuídos que NÃO estão resolvidos<br>
                            backlog = atribuidos.filter(t => status NOT IN [4, 5])<br><br>
                            
                            // Ou simplesmente:<br>
                            backlog = atribuidos - resolvidos
                            </code>
                        </div>
                        
                        <strong>📊 Exemplo:</strong><br>
                        <div style="background:#252536;padding:1rem;border-radius:8px;margin:1rem 0;">
                            <strong>João:</strong><br>
                            • Atribuídos: 25 tickets<br>
                            • Resolvidos: 18 tickets<br>
                            • <strong>Backlog: 7 tickets</strong><br><br>
                            
                            <span style="color:#f59e0b;">⚠️ João tem 7 tickets para finalizar</span>
                        </div>
                        
                        <strong>⚙️ Diferença de Backlog vs Abertos:</strong><br>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Métrica</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">O que mede</th>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;"><strong>Backlog</strong></td>
                                <td style="border:1px solid #555;">Tickets ATRIBUÍDOS à pessoa que não foram resolvidos</td>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;"><strong>Abertos</strong></td>
                                <td style="border:1px solid #555;">Tickets com status = 2 (Aberto) apenas</td>
                            </tr>
                        </table>
                    `
                },
                {
                    name: 'Resolvidos no Período',
                    formula: 'Atribuídos + status 4/5 + stats_resolved_at no período',
                    where: 'BI Analytics - Métricas de produtividade do período selecionado',
                    interpretation: 'Tickets que foram RESOLVIDOS dentro do período selecionado (7, 30, 90 dias).',
                    icon: '📅',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Resolvidos no Período conta apenas os tickets que foram <span style="color:#10b981;font-weight:bold">finalizados DENTRO do período selecionado</span>.
                        Usa o campo <code>stats_resolved_at</code> para determinar a data de resolução.<br><br>
                        
                        <strong>🎯 Por que é importante:</strong><br>
                        • <strong>Produtividade recente</strong> - quantos tickets a pessoa resolveu ESTA semana/mês?<br>
                        • <strong>Comparação justa</strong> - não conta tickets antigos resolvidos há muito tempo<br>
                        • <strong>Tendência</strong> - produtividade aumentando ou diminuindo?<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Diferença importante:</strong><br>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#3b82f620;padding:1rem;border-radius:8px;border:1px solid #3b82f6;">
                                <strong>Resolvidos (Total)</strong><br>
                                <span style="font-size:12px;">TODOS os tickets resolvidos atribuídos à pessoa</span><br><br>
                                <strong>Independente de quando foi resolvido</strong>
                            </div>
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong>Resolvidos no Período</strong><br>
                                <span style="font-size:12px;">Apenas tickets resolvidos DENTRO do período</span><br><br>
                                <strong>Usa stats_resolved_at para filtrar</strong>
                            </div>
                        </div>
                        
                        <strong>📊 Exemplo:</strong><br>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Maria nos últimos 7 dias:</strong><br>
                            • Atribuídos totais: 50 tickets<br>
                            • Resolvidos totais: 40 tickets<br>
                            • <strong>Resolvidos no período (7 dias): 8 tickets</strong><br><br>
                            
                            <span style="color:#a1a1aa;">Os outros 32 foram resolvidos antes do período</span>
                        </div>
                        
                        <strong>📂 Campo utilizado:</strong><br>
                        • <code>stats_resolved_at</code> - Data/hora em que o ticket foi resolvido<br>
                        • Se não existir, usa <code>stats_closed_at</code> como fallback
                    `
                },
                {
                    name: 'Índice de Produtividade',
                    formula: '(Resolvidos no Período / Tempo Médio de Resolução) × 10',
                    where: 'BI Analytics - Métricas avançadas',
                    interpretation: 'Índice que combina quantidade resolvida com velocidade de resolução.',
                    icon: '⚡',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Índice de Produtividade é uma métrica composta que mede <span style="color:#8b5cf6;font-weight:bold">eficiência geral</span>.
                        Quanto mais tickets resolvidos em menos tempo, maior o índice.<br><br>
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <code>
                            // Baseado em tickets RESOLVIDOS NO PERÍODO<br>
                            resolved = resolvedInPeriod.length<br>
                            avgTime = tempoMedioResolucaoEmHoras<br><br>
                            
                            // Fórmula<br>
                            indice = (resolved / avgTime) × 10<br>
                            indice = Math.min(100, indice)  // Máximo 100
                            </code>
                        </div>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">80-100</span> = Excelente produtividade<br>
                        • <span style="color:#3b82f6">50-79</span> = Boa produtividade<br>
                        • <span style="color:#f59e0b">30-49</span> = Regular<br>
                        • <span style="color:#ef4444">0-29</span> = Baixa produtividade<br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • <strong>Quantidade</strong>: Mais tickets resolvidos = maior índice<br>
                        • <strong>Velocidade</strong>: Menor tempo de resolução = maior índice<br>
                        • Retorna 0 se não houver tickets resolvidos no período
                    `
                }
            ]
        },
        
        tendencias: {
            title: '📈 Indicadores de Tendência',
            description: 'Os percentuais que sobem e descem nos cards de KPI - como são calculados',
            items: [
                {
                    name: 'Variação Percentual (↑ ↓)',
                    formula: '((Valor Atual - Valor Anterior) / Valor Anterior) × 100%',
                    where: 'Abaixo de cada KPI nos cards principais (ex: +0.6%, -23.1%)',
                    interpretation: 'Compara o período atual com o período ANTERIOR de mesmo tamanho.',
                    icon: '📊',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Os percentuais mostram a <span style="color:#3b82f6;font-weight:bold">variação comparativa</span> entre dois períodos iguais.
                        Se você está vendo "Últimos 30 dias", ele compara com os 30 dias anteriores a esse período.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Identificar tendências</strong> - volume está crescendo ou diminuindo?<br>
                        • <strong>Detectar anomalias</strong> - variação muito grande indica algo aconteceu<br>
                        • <strong>Avaliar evolução</strong> - estamos melhorando ou piorando?<br>
                        • <strong>Tomar decisões</strong> - precisa de mais gente? processo mudou?<br><br>
                        
                        <strong>📊 Como interpretar as cores:</strong><br>
                        • <span style="color:#10b981">Verde (↑ ou ↓)</span> = BOM (depende da métrica)<br>
                        • <span style="color:#ef4444">Vermelho (↑ ou ↓)</span> = RUIM (depende da métrica)<br>
                        • <span style="color:#94a3b8">Cinza (→ 0%)</span> = Sem mudança significativa<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é calculado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateTrends()</code> (linhas 151-258)<br><br>
                        
                        <strong>🧮 Fórmula:</strong><br>
                        <code>
                        variacao = ((atual - anterior) / anterior) × 100<br><br>
                        Exemplo: 2336 tickets atual, 2322 anterior<br>
                        variacao = ((2336 - 2322) / 2322) × 100 = +0.6%
                        </code>
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📅 Como o Período é Definido</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Filtro Selecionado</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Período Atual</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Período Anterior</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Últimos 7 dias</td><td style="border:1px solid #555;">Últimos 7 dias</td><td style="border:1px solid #555;">7 dias antes disso</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Últimos 30 dias</td><td style="border:1px solid #555;">Últimos 30 dias</td><td style="border:1px solid #555;">30 dias antes disso</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Últimos 90 dias</td><td style="border:1px solid #555;">Últimos 90 dias</td><td style="border:1px solid #555;">90 dias antes disso</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Personalizado</td><td style="border:1px solid #555;">Datas selecionadas</td><td style="border:1px solid #555;">Mesmo intervalo antes</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Tudo</td><td style="border:1px solid #555;">Últimos 30 dias</td><td style="border:1px solid #555;">30 dias anteriores</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Exemplo Visual</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Se você está com filtro "Últimos 30 dias" em 23/Dez/2025:</strong><br><br>
                            • <strong>Período Atual:</strong> 24/Nov - 23/Dez (30 dias)<br>
                            • <strong>Período Anterior:</strong> 25/Out - 23/Nov (30 dias)<br><br>
                            
                            O sistema compara os números entre esses dois períodos.
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Cuidados na Interpretação</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Lembre-se:</strong><br>
                            • Variações podem ser sazonais (dezembro vs janeiro)<br>
                            • Feriados afetam o volume<br>
                            • Período muito curto = muita variação<br>
                            • Período muito longo = esconde detalhes
                        </div>
                    `
                },
                {
                    name: 'Métricas com Tendência Invertida',
                    formula: 'Algumas métricas têm lógica INVERTIDA de cores',
                    where: 'Cards: Em Aberto, Backlog, Tempo Médio Resposta',
                    interpretation: 'Para essas métricas, AUMENTO é ruim e DIMINUIÇÃO é bom.',
                    icon: '🔄',
                    details: `
                        <strong>💡 O que significa "Tendência Invertida":</strong><br>
                        Em algumas métricas, <span style="color:#ef4444;font-weight:bold">aumentar é ruim</span> e 
                        <span style="color:#10b981;font-weight:bold">diminuir é bom</span>. O sistema ajusta as cores automaticamente.<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Métricas com Tendência NORMAL:</strong><br>
                        <div style="background:#10b98120;padding:1rem;border-radius:8px;margin:1rem 0;border:1px solid #10b981;">
                            <strong>↑ Aumentar = BOM (verde)</strong><br>
                            • Total de Tickets (mais demanda = mais negócio)<br>
                            • Resolvidos (mais entregas)<br>
                            • Taxa de Resolução (mais eficiência)<br>
                            • SLA % (melhor cumprimento)<br>
                            • Em Andamento (trabalhando mais)
                        </div>
                        
                        <strong>📊 Métricas com Tendência INVERTIDA:</strong><br>
                        <div style="background:#ef444420;padding:1rem;border-radius:8px;margin:1rem 0;border:1px solid #ef4444;">
                            <strong>↑ Aumentar = RUIM (vermelho)</strong><br>
                            • Em Aberto (mais pendências)<br>
                            • Backlog (mais acumulado)<br>
                            • Tempo Médio Resposta (mais lento)<br>
                            • Violações SLA (mais falhas)
                        </div>
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📋 Tabela Completa de Tendências</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:11px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;text-align:left;border:1px solid #555;">Métrica</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Se ↑</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Se ↓</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Invertida?</th>
                            </tr>
                            <tr><td style="padding:4px;border:1px solid #555;">Total de Tickets</td><td style="text-align:center;border:1px solid #555;color:#10b981;">Verde</td><td style="text-align:center;border:1px solid #555;color:#ef4444;">Vermelho</td><td style="text-align:center;border:1px solid #555;">Não</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">Resolvidos</td><td style="text-align:center;border:1px solid #555;color:#10b981;">Verde</td><td style="text-align:center;border:1px solid #555;color:#ef4444;">Vermelho</td><td style="text-align:center;border:1px solid #555;">Não</td></tr>
                            <tr style="background:#ef444410;"><td style="padding:4px;border:1px solid #555;font-weight:bold;">Em Aberto</td><td style="text-align:center;border:1px solid #555;color:#ef4444;font-weight:bold;">Vermelho</td><td style="text-align:center;border:1px solid #555;color:#10b981;font-weight:bold;">Verde</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ SIM</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">Taxa de Resolução</td><td style="text-align:center;border:1px solid #555;color:#10b981;">Verde</td><td style="text-align:center;border:1px solid #555;color:#ef4444;">Vermelho</td><td style="text-align:center;border:1px solid #555;">Não</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">Em Andamento</td><td style="text-align:center;border:1px solid #555;color:#10b981;">Verde</td><td style="text-align:center;border:1px solid #555;color:#ef4444;">Vermelho</td><td style="text-align:center;border:1px solid #555;">Não</td></tr>
                            <tr style="background:#ef444410;"><td style="padding:4px;border:1px solid #555;font-weight:bold;">Backlog</td><td style="text-align:center;border:1px solid #555;color:#ef4444;font-weight:bold;">Vermelho</td><td style="text-align:center;border:1px solid #555;color:#10b981;font-weight:bold;">Verde</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ SIM</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">SLA 1ª Resposta</td><td style="text-align:center;border:1px solid #555;color:#10b981;">Verde</td><td style="text-align:center;border:1px solid #555;color:#ef4444;">Vermelho</td><td style="text-align:center;border:1px solid #555;">Não</td></tr>
                            <tr style="background:#ef444410;"><td style="padding:4px;border:1px solid #555;font-weight:bold;">Tempo Médio Resp.</td><td style="text-align:center;border:1px solid #555;color:#ef4444;font-weight:bold;">Vermelho</td><td style="text-align:center;border:1px solid #555;color:#10b981;font-weight:bold;">Verde</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ SIM</td></tr>
                            <tr style="background:#ef444410;"><td style="padding:4px;border:1px solid #555;font-weight:bold;">Violações SLA</td><td style="text-align:center;border:1px solid #555;color:#ef4444;font-weight:bold;">Vermelho</td><td style="text-align:center;border:1px solid #555;color:#10b981;font-weight:bold;">Verde</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ SIM</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">💡 Dica de Leitura Rápida</h4>
                        
                        <div style="background:#065f46;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Regra simples:</strong><br>
                            • <strong>Verde</strong> = Situação melhorando<br>
                            • <strong>Vermelho</strong> = Situação piorando<br>
                            • <strong>Cinza</strong> = Sem mudança<br><br>
                            
                            O sistema já faz a inversão automática, então você só precisa olhar a COR!
                        </div>
                    `
                },
                {
                    name: 'Variação em Pontos Percentuais (pp)',
                    formula: 'Taxa Atual - Taxa Anterior (não é percentual do percentual)',
                    where: 'Taxa de Resolução, SLA %',
                    interpretation: 'Para taxas, mostra a diferença em pontos percentuais.',
                    icon: '📐',
                    details: `
                        <strong>💡 O que são Pontos Percentuais:</strong><br>
                        Para métricas que já são percentuais (como Taxa de Resolução), a variação é calculada de forma diferente.<br><br>
                        
                        <strong>🎯 Diferença importante:</strong><br>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#3b82f620;padding:1rem;border-radius:8px;border:1px solid #3b82f6;">
                                <strong>Variação Percentual</strong><br>
                                <span style="font-size:12px;">Usado para números absolutos</span><br><br>
                                <code>Ex: 100 → 120 = +20%</code>
                            </div>
                            <div style="background:#8b5cf620;padding:1rem;border-radius:8px;border:1px solid #8b5cf6;">
                                <strong>Pontos Percentuais</strong><br>
                                <span style="font-size:12px;">Usado para taxas/percentuais</span><br><br>
                                <code>Ex: 80% → 85% = +5pp</code>
                            </div>
                        </div>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Exemplo prático:</strong><br>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Taxa de Resolução:</strong><br>
                            • Mês anterior: 85%<br>
                            • Mês atual: 90%<br>
                            • Variação: 90 - 85 = <strong>+5 pontos percentuais</strong><br><br>
                            
                            (NÃO é +5.9% que seria (90-85)/85×100)
                        </div>
                        
                        <strong>🧮 Cálculo no código:</strong><br>
                        <code>
                        // Para taxas:<br>
                        resolutionRateChange = current.resolutionRate - previous.resolutionRate<br>
                        slaChange = current.slaPercent - previous.slaPercent
                        </code>
                    `
                }
            ]
        },
        
        sla: {
            title: '⏱️ Métricas de SLA',
            description: 'Service Level Agreement - Acordos de nível de serviço',
            items: [
                {
                    name: 'SLA 1ª Resposta',
                    formula: '(Tickets respondidos em ≤ 4h / Total com resposta) × 100%',
                    where: 'Card SLA, Tabela de Produtividade (coluna SLA), Gráfico SLA',
                    interpretation: 'Meta: ≥ 95%. Cliente deve receber primeira resposta em até 4 horas.',
                    icon: '⚡',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O SLA de 1ª Resposta mede a <span style="color:#3b82f6;font-weight:bold">agilidade no primeiro contato</span> com o cliente.
                        Indica se a equipe está respondendo rapidamente quando um novo ticket chega.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Garantir experiência do cliente</strong> - ninguém gosta de esperar<br>
                        • <strong>Cumprir acordos contratuais</strong> - muitos contratos exigem SLA<br>
                        • <strong>Identificar gargalos de triagem</strong> - demora = fila ou falta de gente<br>
                        • <strong>Medir eficiência do primeiro atendimento</strong><br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">≥ 95%</span> = Excelente - quase todos respondidos a tempo<br>
                        • <span style="color:#f59e0b">80-94%</span> = Atenção - alguns escapando<br>
                        • <span style="color:#ef4444">< 80%</span> = Crítico - muitos clientes esperando<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linhas 672-688)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>stats_first_responded_at</code> ou <code>stats_first_response_at</code><br>
                        • <code>created_at</code> - data de criação do ticket<br>
                        • <code>type</code> - para ignorar tipos específicos<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        SLA_LIMIT = 4 * 60 * 60 * 1000  // 4 horas em ms<br>
                        tempo_resposta = first_responded_at - created_at<br>
                        dentro_sla = tempo_resposta <= SLA_LIMIT<br>
                        slaPercent = (slaWithin / slaTotal) * 100
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Apenas tickets que TÊM data de primeira resposta<br>
                        • Ignora tickets sem resposta (não conta no total)<br>
                        • Pode ignorar tipos específicos (ex: "Requisição" sem SLA)<br>
                        • Limite padrão: 4 horas (configurável)<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket conta apenas 1x no cálculo de SLA geral<br>
                        • Na visão por pessoa: considera quem RESPONDEU, não quem está no cf_tratativa
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">⏰ Limite de 4 Horas - O que significa</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Meta:</strong> Toda primeira resposta deve ocorrer em até <strong>4 horas</strong> após a criação do ticket.<br><br>
                            
                            <strong>Cálculo:</strong><br>
                            <code>
                            horasParaResponder = (first_responded_at - created_at) / (1000 × 60 × 60)<br>
                            dentroDoSLA = horasParaResponder <= 4
                            </code>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Exemplo Prático</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Ticket</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Criado</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">1ª Resposta</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Tempo</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">SLA</th>
                            </tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;">#1001</td><td style="text-align:center;border:1px solid #555;">09:00</td><td style="text-align:center;border:1px solid #555;">10:30</td><td style="text-align:center;border:1px solid #555;">1.5h</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ OK</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;">#1002</td><td style="text-align:center;border:1px solid #555;">09:00</td><td style="text-align:center;border:1px solid #555;">12:59</td><td style="text-align:center;border:1px solid #555;">3.98h</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ OK</td></tr>
                            <tr style="background:#ef444420;"><td style="padding:6px;border:1px solid #555;">#1003</td><td style="text-align:center;border:1px solid #555;">09:00</td><td style="text-align:center;border:1px solid #555;">14:00</td><td style="text-align:center;border:1px solid #555;">5h</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">❌ Violou</td></tr>
                            <tr style="background:#3b82f620;"><td style="padding:6px;border:1px solid #555;">#1004</td><td style="text-align:center;border:1px solid #555;">09:00</td><td style="text-align:center;border:1px solid #555;">—</td><td style="text-align:center;border:1px solid #555;">—</td><td style="text-align:center;border:1px solid #555;">⏳ Não conta</td></tr>
                        </table>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Resultado:</strong> 2 dentro / 3 com resposta = <span style="color:#f59e0b;">66.7%</span><br>
                            <small>⚠️ O ticket #1004 sem resposta NÃO entra no cálculo!</small>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ IMPORTANTE: Tickets sem Resposta</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Tickets sem 1ª resposta são IGNORADOS!</strong><br><br>
                            
                            Isso significa que:<br>
                            • Se você tem 100 tickets e apenas 50 foram respondidos<br>
                            • O SLA considera apenas os 50 respondidos<br>
                            • Os outros 50 "desaparecem" do cálculo<br><br>
                            
                            <strong>Consequência:</strong> SLA pode parecer alto mesmo com muitos tickets sem resposta!<br><br>
                            
                            <strong>Solução:</strong> Acompanhe também o número absoluto de tickets sem resposta.
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📈 Métricas Complementares</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#3b82f620;padding:1rem;border-radius:8px;border:1px solid #3b82f6;">
                                <strong>Tempo Médio 1ª Resposta</strong><br>
                                <span style="font-size:12px;">Média de horas até primeira resposta</span>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;">
                                <strong>Sem Resposta</strong><br>
                                <span style="font-size:12px;">Tickets ainda aguardando 1ª resposta</span>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'SLA Resolução',
                    formula: '(Tickets resolvidos em ≤ 24h / Total resolvidos) × 100%',
                    where: 'Relatórios, análise avançada',
                    interpretation: 'Meta: ≥ 80%. Tickets devem ser resolvidos em até 24 horas.',
                    icon: '🎯',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O SLA de Resolução mede a <span style="color:#10b981;font-weight:bold">velocidade de conclusão</span> dos tickets.
                        Indica se a equipe está resolvendo as demandas dentro do prazo acordado.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir eficiência operacional</strong> - quanto tempo leva para resolver?<br>
                        • <strong>Cumprir contratos</strong> - SLAs de resolução são comuns em contratos<br>
                        • <strong>Identificar tickets travados</strong> - quem demora demais?<br>
                        • <strong>Comparar complexidade</strong> - alguns tipos demoram mais<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">≥ 80%</span> = Saudável<br>
                        • <span style="color:#f59e0b">60-79%</span> = Atenção<br>
                        • <span style="color:#ef4444">< 60%</span> = Crítico - muitos tickets estourando prazo<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Utilizado em relatórios e análises avançadas<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>stats_resolved_at</code> ou <code>resolved_at</code><br>
                        • <code>created_at</code><br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        tempo_resolucao = resolved_at - created_at<br>
                        dentro_sla = tempo_resolucao <= 24 horas<br>
                        slaResolucao = (dentro_sla / total_resolvidos) * 100
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Apenas tickets com status 4 ou 5 (resolvidos)<br>
                        • Apenas tickets que têm data de resolução<br>
                        • Limite padrão: 24 horas<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket conta 1x no cálculo
                    `
                },
                {
                    name: 'Tempo Médio de Resposta',
                    formula: 'Σ(first_responded_at - created_at) / quantidade',
                    where: 'Card de métricas, Insights, Relatórios',
                    interpretation: 'Agilidade média. Ideal < 2h. Considere picos de horário.',
                    icon: '⏰',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Tempo Médio de Resposta indica <span style="color:#f59e0b;font-weight:bold">quanto tempo em média</span> o cliente espera 
                        até receber a primeira resposta da equipe.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir agilidade</strong> - a equipe responde rápido?<br>
                        • <strong>Identificar horários problemáticos</strong> - demora mais à noite?<br>
                        • <strong>Comparar atendentes</strong> - quem responde mais rápido?<br>
                        • <strong>Definir expectativas</strong> - informar cliente do tempo esperado<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">< 1h</span> = Excelente<br>
                        • <span style="color:#3b82f6">1-2h</span> = Bom<br>
                        • <span style="color:#f59e0b">2-4h</span> = Regular<br>
                        • <span style="color:#ef4444">> 4h</span> = Crítico<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linha ~689-690)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>stats_first_responded_at</code><br>
                        • <code>created_at</code><br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        responseTimes = [array de tempos em ms]<br>
                        avgResponseMs = soma(responseTimes) / quantidade<br>
                        avgResponseHours = avgResponseMs / (1000*60*60)
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Apenas tickets com data de primeira resposta<br>
                        • Resultado em horas (1 casa decimal)<br>
                        • Não filtra outliers - pode ser distorcido por tickets muito antigos<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket contribui 1x para a média
                    `
                },
                {
                    name: 'Tempo Médio de Resolução',
                    formula: 'Σ(resolved_at - created_at) / quantidade',
                    where: 'Tabela de Produtividade (TEMPO MÉDIO), Relatórios, Cards',
                    interpretation: 'Complexidade média dos tickets. Varia por tipo de demanda.',
                    icon: '⌛',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Tempo Médio de Resolução indica <span style="color:#8b5cf6;font-weight:bold">quanto tempo leva em média</span> para resolver 
                        completamente um ticket, do momento da abertura até o fechamento.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir complexidade</strong> - tickets mais complexos demoram mais<br>
                        • <strong>Planejar capacidade</strong> - quanto tempo reservar por ticket?<br>
                        • <strong>Comparar por tipo</strong> - bugs demoram mais que dúvidas?<br>
                        • <strong>Identificar ineficiências</strong> - por que está demorando?<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">< 4h</span> = Resoluções rápidas<br>
                        • <span style="color:#3b82f6">4-24h</span> = Normal para suporte<br>
                        • <span style="color:#f59e0b">24-72h</span> = Tickets complexos<br>
                        • <span style="color:#ef4444">> 72h</span> = Investigar causa da demora<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linhas 632-640 e 658-661)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>stats_resolved_at</code> ou <code>resolved_at</code><br>
                        • <code>created_at</code><br>
                        • <code>status</code> - apenas 4 ou 5<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        // Para cada ticket resolvido:<br>
                        hours = (resolved_at - created_at) / (1000*60*60)<br>
                        if (hours > 0 && hours < 10000) { avgTime.push(hours) }<br><br>
                        // Média final:<br>
                        avgTimeHours = soma(avgTime) / avgTime.length
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Apenas tickets com status 4 ou 5 (resolvidos)<br>
                        • Apenas tickets com data de resolução válida<br>
                        • Ignora tempos negativos ou > 10.000 horas (outliers)<br>
                        • Arredondado para número inteiro de horas<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Na visão por pessoa: cada pessoa no cf_tratativa recebe o tempo do ticket<br>
                        • No total geral: cada ticket conta 1x
                    `
                }
            ]
        },
        
        ticketsView: {
            title: '🎫 KPIs da Aba Tickets',
            description: 'Métricas exibidas nos cards da aba "Tickets Freshdesk" - Atenção às diferenças!',
            items: [
                {
                    name: 'SLA 1ª Resposta (Dentro) %',
                    formula: '(Tickets com 1ª resposta ANTES do fr_due_by / Tickets com fr_due_by) × 100%',
                    where: 'Card "SLA 1ª Resposta (Dentro)" na aba Tickets',
                    interpretation: 'Percentual de tickets onde a primeira resposta foi dada dentro do prazo.',
                    icon: '⏱️',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Percentual de tickets onde a <span style="color:#10b981;font-weight:bold">primeira resposta</span> foi enviada 
                        ANTES do prazo de SLA definido pelo Freshdesk (campo <code>fr_due_by</code>).<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • Medir a <strong>agilidade da equipe</strong> em dar o primeiro retorno ao cliente<br>
                        • Cumprir <strong>acordos contratuais</strong> de tempo de resposta<br>
                        • Identificar <strong>gargalos na triagem</strong> inicial<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">≥ 90%</span> = Excelente<br>
                        • <span style="color:#f59e0b">70-89%</span> = Atenção<br>
                        • <span style="color:#ef4444">< 70%</span> = Crítico<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>fr_due_by</code> - Prazo da primeira resposta<br>
                        • <code>stats_first_responded_at</code> - Data/hora da 1ª resposta<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        Se ticket TEM fr_due_by:<br>
                        &nbsp;&nbsp;Se stats_first_responded_at ≤ fr_due_by → "1ª OK"<br>
                        &nbsp;&nbsp;Se stats_first_responded_at > fr_due_by → "1ª SLA" (violou)<br>
                        &nbsp;&nbsp;Se não respondeu E agora > fr_due_by → "1ª SLA"<br>
                        &nbsp;&nbsp;Se não respondeu E agora ≤ fr_due_by → "1ª pend."<br><br>
                        SLA% = (qtd "1ª OK" / total com fr_due_by) × 100
                        </code>
                    `
                },
                {
                    name: 'SLA Resolução (Dentro) %',
                    formula: '(Tickets resolvidos ANTES do due_by / Tickets com due_by) × 100%',
                    where: 'Card "SLA Resolução (Dentro)" na aba Tickets',
                    interpretation: 'Percentual de tickets resolvidos dentro do prazo. ⚠️ DIFERENTE de "Vencidos"!',
                    icon: '📦',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Percentual de tickets <span style="color:#10b981;font-weight:bold">resolvidos dentro do prazo</span> de SLA 
                        definido pelo Freshdesk (campo <code>due_by</code>).<br><br>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:8px;margin:1rem 0">
                        <strong>⚠️ ATENÇÃO - DIFERENÇA IMPORTANTE:</strong><br><br>
                        <strong>SLA Resolução (42%) ≠ Vencidos (8)</strong><br><br>
                        
                        O <strong>SLA Resolução</strong> considera TODOS os tickets com prazo (due_by):<br>
                        • Resolvidos dentro do prazo → conta como OK ✅<br>
                        • Resolvidos FORA do prazo → conta como VIOLOU ❌<br>
                        • Não resolvidos com prazo vencido → conta como VIOLOU ❌<br>
                        • Não resolvidos com prazo futuro → conta como PENDENTE ⏳<br><br>
                        
                        Já os <strong>Vencidos</strong> conta APENAS tickets:<br>
                        • NÃO resolvidos + prazo JÁ passou<br>
                        • São tickets que precisam de ação AGORA!
                        </div>
                        
                        <strong>📊 Exemplo prático:</strong><br>
                        Se você tem 78 tickets com prazo e:<br>
                        • 33 resolvidos dentro do prazo = 42% ✅<br>
                        • 37 resolvidos fora do prazo = 47% ❌ (violaram mas estão fechados)<br>
                        • 8 não resolvidos com prazo vencido = os "Vencidos" atuais<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>due_by</code> - Prazo de resolução<br>
                        • <code>stats_resolved_at</code> - Data da resolução<br>
                        • <code>stats_closed_at</code> - Data do fechamento<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        finishedAt = stats_resolved_at OU stats_closed_at<br><br>
                        Se ticket TEM due_by:<br>
                        &nbsp;&nbsp;Se finishedAt ≤ due_by → "Res OK"<br>
                        &nbsp;&nbsp;Se finishedAt > due_by → "Res SLA" (violou)<br>
                        &nbsp;&nbsp;Se não resolveu E agora > due_by → "Res SLA"<br>
                        &nbsp;&nbsp;Se não resolveu E agora ≤ due_by → "Res pend."<br><br>
                        SLA% = (qtd "Res OK" / total com due_by) × 100
                        </code>
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🔍 Entendendo a Diferença: SLA% vs Vencidos</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong style="color:#10b981;">📦 SLA Resolução %</strong><br>
                                <p style="margin:0.5rem 0;font-size:12px;">% de tickets resolvidos DENTRO do prazo</p>
                                <ul style="font-size:11px;margin:0;padding-left:1rem;">
                                    <li>Considera TODOS com prazo (due_by)</li>
                                    <li>Resolvidos dentro = OK ✅</li>
                                    <li>Resolvidos fora = Violou ❌</li>
                                    <li>Não resolvidos vencidos = Violou ❌</li>
                                    <li>Não resolvidos pendentes = Pendente ⏳</li>
                                </ul>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;">
                                <strong style="color:#ef4444;">⏰ Vencidos</strong><br>
                                <p style="margin:0.5rem 0;font-size:12px;">Tickets que precisam de AÇÃO AGORA</p>
                                <ul style="font-size:11px;margin:0;padding-left:1rem;">
                                    <li>APENAS não resolvidos</li>
                                    <li>APENAS com prazo vencido</li>
                                    <li>Resolvidos NÃO contam</li>
                                    <li>Prazo futuro NÃO conta</li>
                                    <li>🚨 Ação urgente!</li>
                                </ul>
                            </div>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Exemplo Prático</h4>
                        <p>Suponha que você tem <strong>78 tickets com prazo</strong>:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Situação</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Qtd</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">No SLA%</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Em Vencidos</th>
                            </tr>
                            <tr style="background:#10b98120;">
                                <td style="padding:6px;border:1px solid #555;">✅ Resolvidos DENTRO do prazo</td>
                                <td style="text-align:center;border:1px solid #555;">33</td>
                                <td style="text-align:center;border:1px solid #555;">Conta OK</td>
                                <td style="text-align:center;border:1px solid #555;">❌ Não</td>
                            </tr>
                            <tr style="background:#f59e0b20;">
                                <td style="padding:6px;border:1px solid #555;">⚠️ Resolvidos FORA do prazo</td>
                                <td style="text-align:center;border:1px solid #555;">37</td>
                                <td style="text-align:center;border:1px solid #555;">Conta VIOLOU</td>
                                <td style="text-align:center;border:1px solid #555;">❌ Não</td>
                            </tr>
                            <tr style="background:#ef444420;">
                                <td style="padding:6px;border:1px solid #555;">🚨 NÃO resolvidos + prazo VENCIDO</td>
                                <td style="text-align:center;border:1px solid #555;font-weight:bold;">8</td>
                                <td style="text-align:center;border:1px solid #555;">Conta VIOLOU</td>
                                <td style="text-align:center;border:1px solid #555;font-weight:bold;">✅ SIM!</td>
                            </tr>
                        </table>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Resultado:</strong><br>
                            • <strong>SLA Resolução:</strong> 33/78 = <span style="color:#f59e0b;">42%</span><br>
                            • <strong>Vencidos:</strong> <span style="color:#ef4444;">8 tickets</span> (precisam de ação AGORA!)
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">🏷️ Todos os Status e seu Impacto</h4>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:11px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;text-align:left;border:1px solid #555;">ID</th>
                                <th style="padding:6px;text-align:left;border:1px solid #555;">Status</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Pode estar em "Vencidos"?</th>
                            </tr>
                            <tr><td style="padding:4px;border:1px solid #555;">2</td><td style="border:1px solid #555;">Aberto</td><td style="text-align:center;border:1px solid #555;">✅ Sim (se due_by < agora)</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">3</td><td style="border:1px solid #555;">Pendente</td><td style="text-align:center;border:1px solid #555;">✅ Sim</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:4px;border:1px solid #555;">4</td><td style="border:1px solid #555;">Resolvido</td><td style="text-align:center;border:1px solid #555;">❌ Não (já resolvido)</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:4px;border:1px solid #555;">5</td><td style="border:1px solid #555;">Fechado</td><td style="text-align:center;border:1px solid #555;">❌ Não (já fechado)</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">6-21</td><td style="border:1px solid #555;">Outros (Em Análise, etc)</td><td style="text-align:center;border:1px solid #555;">✅ Sim (se due_by < agora)</td></tr>
                        </table>
                    `
                },
                {
                    name: 'Vencidos',
                    formula: 'Tickets NÃO resolvidos onde now > due_by',
                    where: 'Card "Vencidos" na aba Tickets',
                    interpretation: 'Tickets atrasados que AINDA precisam de ação! Diferente do SLA%.',
                    icon: '⏰',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Quantidade de tickets que estão <span style="color:#ef4444;font-weight:bold">atualmente vencidos</span> - 
                        ou seja, passaram do prazo e AINDA NÃO foram resolvidos.<br><br>
                        
                        <div style="background:#065f46;padding:1rem;border-radius:8px;margin:1rem 0">
                        <strong>✅ DIFERENÇA DO SLA%:</strong><br><br>
                        
                        <strong>"Vencidos" = Ação URGENTE necessária</strong><br>
                        São tickets que:<br>
                        • ❌ Ainda NÃO estão resolvidos (status ≠ 4 ou 5)<br>
                        • ❌ O prazo (due_by) JÁ passou<br>
                        • 🚨 Precisam de atenção IMEDIATA!<br><br>
                        
                        <strong>NÃO inclui:</strong><br>
                        • Tickets que foram resolvidos (mesmo que fora do prazo)<br>
                        • Tickets com prazo futuro<br>
                        • Tickets sem prazo definido
                        </div>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Priorização imediata</strong> - atacar esses tickets primeiro!<br>
                        • <strong>Alerta operacional</strong> - problema precisa de ação agora<br>
                        • <strong>Evitar acúmulo</strong> - não deixar o número crescer<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">0</span> = Perfeito - nenhum atrasado<br>
                        • <span style="color:#f59e0b">1-5</span> = Atenção - resolver logo<br>
                        • <span style="color:#ef4444">> 5</span> = Crítico - equipe sobrecarregada<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        vencidos = tickets.filter(t => {<br>
                        &nbsp;&nbsp;const due = new Date(t.due_by)<br>
                        &nbsp;&nbsp;const agora = new Date()<br>
                        &nbsp;&nbsp;const resolvido = t.stats_resolved_at || t.stats_closed_at<br>
                        &nbsp;&nbsp;return due && agora > due && !resolvido<br>
                        }).length
                        </code>
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🚨 Por que "Vencidos" é Crítico</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Cada ticket vencido significa:</strong><br>
                            • Cliente esperando além do prometido<br>
                            • SLA sendo violado continuamente<br>
                            • Risco de reclamação formal<br>
                            • Possível impacto em contrato
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Priorização de Vencidos</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Tempo Vencido</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Prioridade</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Ação</th>
                            </tr>
                            <tr style="background:#f59e0b20;"><td style="padding:6px;border:1px solid #555;">< 24h</td><td style="text-align:center;border:1px solid #555;">⚠️ Alta</td><td style="border:1px solid #555;">Resolver hoje</td></tr>
                            <tr style="background:#ef444420;"><td style="padding:6px;border:1px solid #555;">1-3 dias</td><td style="text-align:center;border:1px solid #555;">🚨 Urgente</td><td style="border:1px solid #555;">Prioridade máxima</td></tr>
                            <tr style="background:#ef444440;"><td style="padding:6px;border:1px solid #555;">> 3 dias</td><td style="text-align:center;border:1px solid #555;">🔴 Crítico</td><td style="border:1px solid #555;">Escalar imediatamente</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">🛠️ Como Resolver</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong>✅ Boas Práticas</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Revisar vencidos diário</li>
                                    <li>Alertas automáticos</li>
                                    <li>Redistribuir carga</li>
                                    <li>Escalar se necessário</li>
                                </ul>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;">
                                <strong>❌ Evitar</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Ignorar vencidos</li>
                                    <li>Deixar acumular</li>
                                    <li>Não comunicar cliente</li>
                                    <li>Fechar sem resolver</li>
                                </ul>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Escalados',
                    formula: 'Tickets onde is_escalated = true',
                    where: 'Card "Escalados" na aba Tickets',
                    interpretation: 'Tickets que foram escalados para níveis superiores.',
                    icon: '🚨',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Quantidade de tickets que foram <span style="color:#ef4444;font-weight:bold">escalados</span> - 
                        geralmente quando ultrapassam regras de tempo ou são marcados manualmente como críticos.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • Identificar <strong>problemas graves</strong> que precisaram de atenção especial<br>
                        • Detectar <strong>padrões de escalação</strong> - certos tipos sempre escalam?<br>
                        • Medir <strong>eficiência da primeira linha</strong> - muito escalonamento = problema<br><br>
                        
                        <strong>📊 Motivos comuns de escalação:</strong><br>
                        • Prazo de SLA ultrapassado (automático)<br>
                        • Cliente VIP com problema<br>
                        • Complexidade técnica alta<br>
                        • Reclamação formal<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>escalados = tickets.filter(t => t.is_escalated === true).length</code>
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📊 Análise de Escalações</h4>
                        
                        <p>Escalações podem ser <strong>automáticas</strong> ou <strong>manuais</strong>:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Tipo</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Gatilho</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Ação</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">⏰ Automática</td><td style="border:1px solid #555;">SLA próximo de vencer</td><td style="border:1px solid #555;">Alerta para supervisor</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">⏰ Automática</td><td style="border:1px solid #555;">Sem resposta em X horas</td><td style="border:1px solid #555;">Redistribuição</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">👤 Manual</td><td style="border:1px solid #555;">Cliente VIP</td><td style="border:1px solid #555;">Prioridade especial</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">👤 Manual</td><td style="border:1px solid #555;">Complexidade técnica</td><td style="border:1px solid #555;">Especialista assume</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📈 Indicadores de Saúde</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;text-align:center;">
                                <strong style="font-size:1.2rem;">< 5%</strong><br>
                                <span style="font-size:11px;color:#10b981;">Saudável</span>
                            </div>
                            <div style="background:#f59e0b20;padding:1rem;border-radius:8px;border:1px solid #f59e0b;text-align:center;">
                                <strong style="font-size:1.2rem;">5-15%</strong><br>
                                <span style="font-size:11px;color:#f59e0b;">Atenção</span>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;text-align:center;">
                                <strong style="font-size:1.2rem;">> 15%</strong><br>
                                <span style="font-size:11px;color:#ef4444;">Crítico</span>
                            </div>
                        </div>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>⚠️ Muitas escalações indicam:</strong><br>
                            • Equipe sobrecarregada<br>
                            • Triagem ineficiente<br>
                            • Falta de treinamento<br>
                            • Processos mal definidos
                        </div>
                    `
                },
                {
                    name: 'Reabertos',
                    formula: 'Tickets onde stats_reopened_at não é nulo',
                    where: 'Card "Reabertos" na aba Tickets',
                    interpretation: 'Tickets que foram resolvidos mas precisaram ser reabertos.',
                    icon: '🔄',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Quantidade de tickets que foram <span style="color:#f59e0b;font-weight:bold">reabertos</span> após serem 
                        resolvidos - indica que a solução inicial não foi efetiva.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • Medir <strong>qualidade das soluções</strong> - resoluções ruins = reaberturas<br>
                        • Identificar <strong>problemas recorrentes</strong><br>
                        • Avaliar <strong>treinamento necessário</strong><br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">< 5% do total</span> = Saudável<br>
                        • <span style="color:#f59e0b">5-10%</span> = Atenção - revisar processos<br>
                        • <span style="color:#ef4444">> 10%</span> = Crítico - soluções não estão funcionando<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>reabertos = tickets.filter(t => t.stats_reopened_at !== null).length</code>
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🔄 Por que Tickets são Reabertos?</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Motivo</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Frequência</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Solução</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🚫 Solução não funcionou</td><td style="text-align:center;border:1px solid #555;">~40%</td><td style="border:1px solid #555;">Testar antes de fechar</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">📝 Cliente não entendeu</td><td style="text-align:center;border:1px solid #555;">~25%</td><td style="border:1px solid #555;">Explicar melhor</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🔄 Problema voltou</td><td style="text-align:center;border:1px solid #555;">~20%</td><td style="border:1px solid #555;">Tratar causa raiz</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">❓ Dúvida adicional</td><td style="text-align:center;border:1px solid #555;">~15%</td><td style="border:1px solid #555;">Ser mais completo</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Impacto de Reaberturas</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Cada reabertura custa:</strong><br>
                            • <strong>Tempo:</strong> Reler, entender, resolver de novo<br>
                            • <strong>SLA:</strong> Pode violar prazos na 2ª tentativa<br>
                            • <strong>Satisfação:</strong> Cliente frustrado<br>
                            • <strong>Produtividade:</strong> Retrabalho = menos tickets novos
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">✅ Como Reduzir Reaberturas</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong>Antes de Fechar</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Confirmar com cliente</li>
                                    <li>Testar a solução</li>
                                    <li>Documentar passos</li>
                                    <li>Aguardar feedback</li>
                                </ul>
                            </div>
                            <div style="background:#3b82f620;padding:1rem;border-radius:8px;border:1px solid #3b82f6;">
                                <strong>Análise de Padrões</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Quem mais reabre?</li>
                                    <li>Que tipo de ticket?</li>
                                    <li>Qual categoria?</li>
                                    <li>Horário específico?</li>
                                </ul>
                            </div>
                        </div>
                    `
                }
            ]
        },
        
        productivity: {
            title: '🏆 Métricas de Produtividade',
            description: 'Indicadores de desempenho individual e por equipe',
            items: [
                {
                    name: 'Índice de Produtividade',
                    formula: `(Taxa Resolução × 30%) + (SLA × 30%) + (Tickets/Dia × 20%) + (Velocidade × 20%)`,
                    where: 'Tabela de Produtividade (coluna ÍNDICE), Ranking, Gráfico de Barras',
                    interpretation: 'Score 0-100. Verde ≥70, Amarelo ≥40, Vermelho <40.',
                    icon: '📊',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Índice de Produtividade é um <span style="color:#8b5cf6;font-weight:bold">score composto</span> que avalia o desempenho 
                        global de uma pessoa ou time, combinando múltiplos fatores em uma nota única de 0 a 100.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Ranking justo</strong> - não olha só volume, considera qualidade também<br>
                        • <strong>Identificar top performers</strong> - quem tem melhor desempenho geral<br>
                        • <strong>Feedback objetivo</strong> - dar nota baseada em dados<br>
                        • <strong>Balancear métricas</strong> - evita otimizar só uma coisa<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">≥ 70</span> = Excelente - alta performance<br>
                        • <span style="color:#f59e0b">40-69</span> = Regular - precisa melhorar<br>
                        • <span style="color:#ef4444">< 40</span> = Crítico - requer ação imediata<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateProductivityMetrics()</code> (linhas 1322-1420)<br><br>
                        
                        <strong>📊 Componentes (peso):</strong><br>
                        • <span style="color:#10b981">30%</span> Taxa de Resolução (resolvidos/total × 100)<br>
                        • <span style="color:#3b82f6">30%</span> SLA 1ª Resposta (% dentro de 4h)<br>
                        • <span style="color:#f59e0b">20%</span> Volume (resolvidos/dia, max 5/dia = 100%)<br>
                        • <span style="color:#8b5cf6">20%</span> Velocidade (100 - tempo médio, min 0)<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        taxaScore = (resolvidos / total) * 100<br>
                        slaScore = (dentroSLA / totalComResposta) * 100<br>
                        volumeScore = Math.min(resolvidosPorDia / 5 * 100, 100)<br>
                        velocidadeScore = Math.max(100 - tempoMedioHoras, 0)<br><br>
                        indice = (taxaScore * 0.30) + (slaScore * 0.30) + (volumeScore * 0.20) + (velocidadeScore * 0.20)
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Taxa de Resolução: status 4 ou 5 vs total<br>
                        • SLA: primeira resposta em até 4h<br>
                        • Volume: resolvidos por dia (5/dia = máximo)<br>
                        • Velocidade: inverso do tempo médio de resolução<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Calculado individualmente para cada pessoa/time<br>
                        • Tickets com múltiplas pessoas afetam todas elas
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📦 Componente: Volume (20%)</h4>
                        <p>Mede quantos tickets a pessoa <strong>RESOLVE por dia</strong>.</p>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;font-family:monospace;">
                        volumeScore = Math.min(100, resolvedPerDay × 20) × 0.2
                        </div>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Resolvidos/Dia</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Pontos Volume</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Contribuição (×0.2)</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">0</td><td style="text-align:center;border:1px solid #555;">0</td><td style="text-align:center;border:1px solid #555;">0 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">1</td><td style="text-align:center;border:1px solid #555;">20</td><td style="text-align:center;border:1px solid #555;">4 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">2</td><td style="text-align:center;border:1px solid #555;">40</td><td style="text-align:center;border:1px solid #555;">8 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">3</td><td style="text-align:center;border:1px solid #555;">60</td><td style="text-align:center;border:1px solid #555;">12 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">4</td><td style="text-align:center;border:1px solid #555;">80</td><td style="text-align:center;border:1px solid #555;">16 pts</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">5+</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">100 (max)</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">20 pts (max)</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚡ Componente: Velocidade (20%)</h4>
                        <p>Mede quão <strong>rápido</strong> os tickets são resolvidos (inverso do tempo médio).</p>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;font-family:monospace;">
                        velocidadeScore = Math.max(0, 100 - avgResolutionHours) × 0.2
                        </div>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Tempo Médio Resolução</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Pontos Velocidade</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Contribuição (×0.2)</th>
                            </tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;">0h (instantâneo)</td><td style="text-align:center;border:1px solid #555;">100</td><td style="text-align:center;border:1px solid #555;">20 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">10h</td><td style="text-align:center;border:1px solid #555;">90</td><td style="text-align:center;border:1px solid #555;">18 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">24h (1 dia)</td><td style="text-align:center;border:1px solid #555;">76</td><td style="text-align:center;border:1px solid #555;">15.2 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">50h (~2 dias)</td><td style="text-align:center;border:1px solid #555;">50</td><td style="text-align:center;border:1px solid #555;">10 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">72h (3 dias)</td><td style="text-align:center;border:1px solid #555;">28</td><td style="text-align:center;border:1px solid #555;">5.6 pts</td></tr>
                            <tr style="background:#ef444420;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">100h+</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">0 (min)</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">0 pts</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">🏷️ Status Considerados no Cálculo</h4>
                        <p>O índice <strong>NÃO filtra por status</strong> na entrada - considera TODOS os tickets.</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Componente</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Status Considerados</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><strong>Taxa Resolução (30%)</strong></td><td style="border:1px solid #555;padding:6px;">Numerador: <span style="color:#10b981;">4, 5</span><br>Denominador: <strong>TODOS</strong></td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><strong>SLA 1ª Resposta (30%)</strong></td><td style="border:1px solid #555;padding:6px;">Apenas tickets com <code>first_responded_at</code><br>⚠️ Sem resposta = ignorado!</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><strong>Volume/Dia (20%)</strong></td><td style="border:1px solid #555;padding:6px;"><strong>TODOS</strong> (conta total)</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><strong>Velocidade (20%)</strong></td><td style="border:1px solid #555;padding:6px;">Apenas <span style="color:#10b981;">4, 5</span> (precisa de resolved_at)</td></tr>
                        </table>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>⚠️ Atenção sobre SLA:</strong><br>
                            Tickets "Em Análise" ou outros status <strong>SEM resposta</strong> são <strong>completamente ignorados</strong> no cálculo do SLA. 
                            Isso pode inflar artificialmente o percentual!
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Resumo do Índice</h4>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Componente</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Peso</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Máximo</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Taxa de Resolução</td><td style="text-align:center;border:1px solid #555;">30%</td><td style="text-align:center;border:1px solid #555;">30 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">SLA 1ª Resposta</td><td style="text-align:center;border:1px solid #555;">30%</td><td style="text-align:center;border:1px solid #555;">30 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Volume</td><td style="text-align:center;border:1px solid #555;">20%</td><td style="text-align:center;border:1px solid #555;">20 pts</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Velocidade</td><td style="text-align:center;border:1px solid #555;">20%</td><td style="text-align:center;border:1px solid #555;">20 pts</td></tr>
                            <tr style="background:#10b98120;font-weight:bold;"><td style="padding:6px;border:1px solid #555;">TOTAL</td><td style="text-align:center;border:1px solid #555;">100%</td><td style="text-align:center;border:1px solid #555;">100 pts</td></tr>
                        </table>
                    `
                },
                {
                    name: 'Tickets por Dia',
                    formula: 'Total de tickets / Dias no período',
                    where: 'Gráfico Tickets/Dia, Tabela (coluna TICKETS/DIA)',
                    interpretation: 'Volume diário de trabalho. Ajuda a identificar sobrecarga.',
                    icon: '📅',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Tickets por Dia mostra a <span style="color:#3b82f6;font-weight:bold">média de tickets recebidos/atribuídos por dia</span>.
                        Indica o ritmo de entrada de demandas.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir carga de trabalho</strong> - quantos tickets por dia?<br>
                        • <strong>Planejar escala</strong> - dias com mais demanda precisam mais gente<br>
                        • <strong>Comparar pessoas</strong> - quem recebe mais por dia?<br>
                        • <strong>Identificar picos</strong> - segundas têm mais tickets?<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">< 5/dia</span> = Carga leve<br>
                        • <span style="color:#f59e0b">5-10/dia</span> = Carga moderada<br>
                        • <span style="color:#ef4444">> 10/dia</span> = Carga pesada<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateProductivityMetrics()</code><br>
                        • Gráfico: <code>renderTicketsPerDayChart()</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>created_at</code> - para determinar o período<br>
                        • Contagem de tickets por entidade<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        diasPeriodo = (dataFim - dataInicio) / (1000*60*60*24)<br>
                        ticketsPorDia = totalTickets / diasPeriodo
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Período entre primeiro e último ticket<br>
                        • Todos os tickets (não só resolvidos)<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Ticket com múltiplas pessoas: conta para cada uma
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📅 Análise de Padrões Diários</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Dia</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Padrão Típico</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Ação</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🟢 Segunda</td><td style="text-align:center;border:1px solid #555;">+40-60%</td><td style="border:1px solid #555;">Reforçar equipe</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Terça-Quinta</td><td style="text-align:center;border:1px solid #555;">Normal</td><td style="border:1px solid #555;">Padrão</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Sexta</td><td style="text-align:center;border:1px solid #555;">-10-20%</td><td style="border:1px solid #555;">Resolver backlog</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🔴 Sáb/Dom</td><td style="text-align:center;border:1px solid #555;">-70-90%</td><td style="border:1px solid #555;">Plantão mínimo</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📈 Planejamento de Capacidade</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Fórmula de dimensionamento:</strong><br>
                            <code>
                            pessoasNecessárias = ticketsPorDia / capacidadePessoa<br>
                            Ex: 50 tickets/dia ÷ 8 tickets/pessoa = ~7 pessoas
                            </code>
                        </div>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong>✅ Saudável</strong><br>
                                <span style="font-size:12px;">Tickets/dia < Capacidade</span>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;">
                                <strong>❌ Sobrecarga</strong><br>
                                <span style="font-size:12px;">Tickets/dia > Capacidade</span>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Resolvidos por Dia',
                    formula: 'Total resolvidos / Dias no período',
                    where: 'Cálculo interno do índice de produtividade, componente de Volume',
                    interpretation: 'Capacidade de entrega diária. Ideal: ≥ criados/dia.',
                    icon: '✔️',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Resolvidos por Dia mostra a <span style="color:#10b981;font-weight:bold">capacidade de entrega diária</span>.
                        Indica quantos tickets são finalizados em média por dia.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir produtividade real</strong> - quantos finaliza por dia?<br>
                        • <strong>Comparar com recebidos</strong> - resolvendo mais do que recebe?<br>
                        • <strong>Projetar capacidade</strong> - consegue absorver aumento de demanda?<br>
                        • <strong>Componente do índice</strong> - usado no cálculo de produtividade<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • Resolvidos/dia > Recebidos/dia = Reduzindo backlog ✅<br>
                        • Resolvidos/dia = Recebidos/dia = Equilibrado ⚠️<br>
                        • Resolvidos/dia < Recebidos/dia = Acumulando backlog ❌<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateProductivityMetrics()</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>status</code> - apenas 4 ou 5<br>
                        • <code>stats_resolved_at</code> - para período<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        totalResolvidos = tickets.filter(t => t.status === 4 || t.status === 5).length<br>
                        diasPeriodo = (dataFim - dataInicio) / (1000*60*60*24)<br>
                        resolvidosPorDia = totalResolvidos / diasPeriodo
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Apenas tickets resolvidos (status 4 ou 5)<br>
                        • Período calculado automaticamente<br>
                        • No índice: máximo de 5/dia = 100%<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Ticket com múltiplas pessoas: cada uma recebe +1 resolvido
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🎯 Meta de 5 Resolvidos/Dia</h4>
                        
                        <p>No cálculo do Índice de Produtividade, <strong>5 resolvidos/dia = 100%</strong> no componente de Volume:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Resolvidos/Dia</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">% do Máximo</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Avaliação</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">0-1</td><td style="text-align:center;border:1px solid #555;">0-20%</td><td style="text-align:center;border:1px solid #555;color:#ef4444;">🔴 Baixo</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">2-3</td><td style="text-align:center;border:1px solid #555;">40-60%</td><td style="text-align:center;border:1px solid #555;color:#f59e0b;">🟡 Regular</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">4</td><td style="text-align:center;border:1px solid #555;">80%</td><td style="text-align:center;border:1px solid #555;color:#10b981;">🟢 Bom</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">5+</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">100%</td><td style="text-align:center;border:1px solid #555;color:#10b981;font-weight:bold;">⭐ Excelente</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Por que 5/dia?</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Justificativa:</strong><br>
                            • Jornada de 8h = ~1.5h por ticket<br>
                            • Inclui tempo de análise, resposta e documentação<br>
                            • Mantém qualidade sem rush<br>
                            • Permite pausas e reuniões<br><br>
                            
                            <strong>Ajuste conforme complexidade:</strong><br>
                            • Tickets simples: meta pode ser 8-10/dia<br>
                            • Tickets complexos: meta pode ser 2-3/dia
                        </div>
                    `
                }
            ]
        },
        
        distribution: {
            title: '📈 Distribuições e Análises',
            description: 'Gráficos e análises de distribuição dos dados',
            items: [
                {
                    name: 'Por Status',
                    formula: 'Contagem agrupada por status do ticket',
                    where: 'Gráfico de Status (pizza/donut), Cards, Filtros',
                    interpretation: 'Visão do funil. Muitos "Pendente" pode indicar gargalo.',
                    icon: '🔄',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        A distribuição por Status mostra o <span style="color:#3b82f6;font-weight:bold">estado atual de cada ticket</span> no funil de atendimento.
                        Permite visualizar em qual etapa os tickets estão parados.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Identificar gargalos</strong> - muitos pendentes = travados em algum lugar<br>
                        • <strong>Medir fluxo</strong> - tickets passando rapidamente de aberto para fechado<br>
                        • <strong>Priorizar ações</strong> - atacar o status com mais acúmulo<br>
                        • <strong>Acompanhar tendência</strong> - status estão mudando?<br><br>
                        
                        <strong>📊 Status possíveis (Freshdesk):</strong><br>
                        • <span style="color:#ef4444">2 = Aberto</span> - Recém criado, aguardando atendimento<br>
                        • <span style="color:#f59e0b">3 = Pendente</span> - Aguardando algo (cliente, terceiro)<br>
                        • <span style="color:#10b981">4 = Resolvido</span> - Solução aplicada<br>
                        • <span style="color:#6b7280">5 = Fechado</span> - Confirmado ou auto-fechado<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linhas 712-717)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>status</code> - código numérico<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        statusCounts = {}<br>
                        tickets.forEach(t => {<br>
                        &nbsp;&nbsp;statusCounts[t.status] = (statusCounts[t.status] || 0) + 1<br>
                        })
                        </code><br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket tem UM status apenas<br>
                        • Não há duplicação nesta métrica
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🏷️ Todos os Status Disponíveis</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:11px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;text-align:left;border:1px solid #555;">ID</th>
                                <th style="padding:6px;text-align:left;border:1px solid #555;">Nome</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Cor</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Categoria</th>
                            </tr>
                            <tr><td style="padding:4px;border:1px solid #555;">2</td><td style="border:1px solid #555;">Aberto</td><td style="text-align:center;border:1px solid #555;background:#3b82f6;"> </td><td style="text-align:center;border:1px solid #555;">Novo</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">3</td><td style="border:1px solid #555;">Pendente</td><td style="text-align:center;border:1px solid #555;background:#f59e0b;"> </td><td style="text-align:center;border:1px solid #555;">Parado</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">4</td><td style="border:1px solid #555;">Resolvido</td><td style="text-align:center;border:1px solid #555;background:#10b981;"> </td><td style="text-align:center;border:1px solid #555;">Fechado</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">5</td><td style="border:1px solid #555;">Fechado</td><td style="text-align:center;border:1px solid #555;background:#6b7280;"> </td><td style="text-align:center;border:1px solid #555;">Fechado</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">6</td><td style="border:1px solid #555;">Em Homologação</td><td style="text-align:center;border:1px solid #555;background:#8b5cf6;"> </td><td style="text-align:center;border:1px solid #555;">Progresso</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">7</td><td style="border:1px solid #555;">Aguardando Cliente</td><td style="text-align:center;border:1px solid #555;background:#f59e0b;"> </td><td style="text-align:center;border:1px solid #555;">Aguardando</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">8</td><td style="border:1px solid #555;">Em Tratativa</td><td style="text-align:center;border:1px solid #555;background:#06b6d4;"> </td><td style="text-align:center;border:1px solid #555;">Progresso</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">10</td><td style="border:1px solid #555;">Em Análise</td><td style="text-align:center;border:1px solid #555;background:#06b6d4;"> </td><td style="text-align:center;border:1px solid #555;">Progresso</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">11</td><td style="border:1px solid #555;">Interno</td><td style="text-align:center;border:1px solid #555;background:#64748b;"> </td><td style="text-align:center;border:1px solid #555;">Progresso</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;">12-21</td><td style="border:1px solid #555;">Outros</td><td style="text-align:center;border:1px solid #555;background:#a855f7;"> </td><td style="text-align:center;border:1px solid #555;">Varia</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Distribuição Ideal</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Operação saudável:</strong><br>
                            • Resolvido/Fechado: <strong>> 60%</strong><br>
                            • Em Progresso: <strong>20-30%</strong><br>
                            • Aberto: <strong>< 10%</strong><br>
                            • Pendente/Aguardando: <strong>< 10%</strong>
                        </div>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>⚠️ Sinais de problema:</strong><br>
                            • Muitos "Aberto" = fila de espera grande<br>
                            • Muitos "Pendente" = tickets travados<br>
                            • Poucos "Resolvido" = baixa produtividade
                        </div>
                    `
                },
                {
                    name: 'Por Prioridade',
                    formula: 'Contagem agrupada por nível de prioridade',
                    where: 'Gráfico de Prioridade (pizza), Filtros, Análises',
                    interpretation: 'Alta concentração em "Alta/Urgente" requer revisão de critérios.',
                    icon: '🚨',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        A distribuição por Prioridade mostra <span style="color:#ef4444;font-weight:bold">a criticidade</span> das demandas.
                        Indica se há excesso de tickets críticos ou se as prioridades estão bem calibradas.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Calibrar critérios</strong> - tudo urgente = nada é urgente<br>
                        • <strong>Planejar atendimento</strong> - urgentes primeiro<br>
                        • <strong>Identificar padrões</strong> - certos clientes sempre marcam urgente?<br>
                        • <strong>Dimensionar equipe</strong> - muitos urgentes = precisa mais gente<br><br>
                        
                        <strong>📊 Prioridades (Freshdesk):</strong><br>
                        • <span style="color:#10b981">1 = Baixa</span> - Pode esperar<br>
                        • <span style="color:#f59e0b">2 = Média</span> - Normal<br>
                        • <span style="color:#f97316">3 = Alta</span> - Precisa de atenção<br>
                        • <span style="color:#ef4444">4 = Urgente</span> - Prioridade máxima<br><br>
                        
                        <strong>📊 Distribuição ideal:</strong><br>
                        • Baixa: 30-40%<br>
                        • Média: 40-50%<br>
                        • Alta: 10-15%<br>
                        • Urgente: < 5%<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linhas 647-652)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>priority</code> - código numérico (1-4)<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        priorities = { low: 0, medium: 0, high: 0, urgent: 0 }<br>
                        if (priority === 1) priorities.low++<br>
                        else if (priority === 2) priorities.medium++<br>
                        else if (priority === 3) priorities.high++<br>
                        else if (priority === 4) priorities.urgent++
                        </code><br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket tem UMA prioridade<br>
                        • Na visão por pessoa: conta para cada pessoa no cf_tratativa
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🚨 Prioridades e seus Critérios</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:center;border:1px solid #555;">ID</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Nome</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Critério</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">SLA</th>
                            </tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;text-align:center;">1</td><td style="border:1px solid #555;">Baixa</td><td style="border:1px solid #555;">Dúvida, melhoria, info</td><td style="text-align:center;border:1px solid #555;">72h</td></tr>
                            <tr style="background:#f59e0b20;"><td style="padding:6px;border:1px solid #555;text-align:center;">2</td><td style="border:1px solid #555;">Média</td><td style="border:1px solid #555;">Problema sem impacto crítico</td><td style="text-align:center;border:1px solid #555;">24h</td></tr>
                            <tr style="background:#f9731620;"><td style="padding:6px;border:1px solid #555;text-align:center;">3</td><td style="border:1px solid #555;">Alta</td><td style="border:1px solid #555;">Impacta operação parcial</td><td style="text-align:center;border:1px solid #555;">8h</td></tr>
                            <tr style="background:#ef444420;"><td style="padding:6px;border:1px solid #555;text-align:center;font-weight:bold;">4</td><td style="border:1px solid #555;font-weight:bold;">Urgente</td><td style="border:1px solid #555;font-weight:bold;">Sistema parado/crítico</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">2h</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Problema de Inflação de Prioridade</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Quando tudo é urgente, nada é urgente!</strong><br><br>
                            
                            Se > 20% dos tickets são "Urgente":<br>
                            • Revisar critérios de classificação<br>
                            • Treinar quem abre tickets<br>
                            • Automatizar triagem inicial<br>
                            • Criar categoria "Crítico" separada
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Distribuição Ideal</h4>
                        
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:0.75rem;border-radius:8px;border:1px solid #10b981;text-align:center;">
                                <strong>Baixa</strong><br>
                                <span style="font-size:1.2rem;">30-40%</span>
                            </div>
                            <div style="background:#f59e0b20;padding:0.75rem;border-radius:8px;border:1px solid #f59e0b;text-align:center;">
                                <strong>Média</strong><br>
                                <span style="font-size:1.2rem;">40-50%</span>
                            </div>
                            <div style="background:#f9731620;padding:0.75rem;border-radius:8px;border:1px solid #f97316;text-align:center;">
                                <strong>Alta</strong><br>
                                <span style="font-size:1.2rem;">10-15%</span>
                            </div>
                            <div style="background:#ef444420;padding:0.75rem;border-radius:8px;border:1px solid #ef4444;text-align:center;">
                                <strong>Urgente</strong><br>
                                <span style="font-size:1.2rem;">< 5%</span>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Por Tipo',
                    formula: 'Contagem agrupada pelo campo "type" do ticket',
                    where: 'Gráfico de Tipos, Filtros, Relatórios',
                    interpretation: 'Identifica demandas mais frequentes para automação.',
                    icon: '📋',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        A distribuição por Tipo mostra a <span style="color:#8b5cf6;font-weight:bold">natureza das demandas</span>.
                        Indica quais tipos de problema/solicitação são mais comuns.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Identificar padrões</strong> - quais tipos são mais frequentes?<br>
                        • <strong>Priorizar automação</strong> - automatizar o que mais aparece<br>
                        • <strong>Treinar equipe</strong> - especializar em tipos comuns<br>
                        • <strong>Melhorar produto</strong> - tipo frequente = problema recorrente<br><br>
                        
                        <strong>📊 Tipos comuns:</strong><br>
                        • Bug / Incidente<br>
                        • Dúvida / Question<br>
                        • Feature Request<br>
                        • Requisição / Task<br>
                        • Suporte Técnico<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Campo: <code>type</code> do ticket<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>type</code> - string com o tipo<br>
                        • Fallback: "Sem tipo" se vazio<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        typeCount = {}<br>
                        tickets.forEach(t => {<br>
                        &nbsp;&nbsp;const tipo = t.type || 'Sem tipo'<br>
                        &nbsp;&nbsp;typeCount[tipo] = (typeCount[tipo] || 0) + 1<br>
                        })
                        </code><br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket tem UM tipo<br>
                        • Não há duplicação nesta métrica
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📊 Análise de Tipos para Tomada de Decisão</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Se tipo mais comum é...</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Ação recomendada</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🐛 Bug/Incidente</td><td style="border:1px solid #555;">Investir em qualidade/testes</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">❓ Dúvida</td><td style="border:1px solid #555;">Melhorar documentação/FAQ</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">✨ Feature Request</td><td style="border:1px solid #555;">Priorizar roadmap com dados</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🛠️ Requisição</td><td style="border:1px solid #555;">Automatizar processos comuns</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">🎯 Estratégias por Volume</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong>✅ Alto Volume (>30%)</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Criar templates</li>
                                    <li>Treinar especialistas</li>
                                    <li>Automatizar</li>
                                    <li>Self-service</li>
                                </ul>
                            </div>
                            <div style="background:#3b82f620;padding:1rem;border-radius:8px;border:1px solid #3b82f6;">
                                <strong>🟦 Baixo Volume (<5%)</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Pode ser complexo</li>
                                    <li>Escalar quando aparecer</li>
                                    <li>Documentar soluções</li>
                                    <li>Base de conhecimento</li>
                                </ul>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Timeline (Criados vs Resolvidos)',
                    formula: 'Contagem diária de tickets criados e resolvidos',
                    where: 'Gráfico Timeline (linha), Dashboard, Apresentação',
                    interpretation: 'Tendência. Linhas divergentes indicam acúmulo de backlog.',
                    icon: '📉',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        A Timeline mostra a <span style="color:#3b82f6;font-weight:bold">evolução temporal</span> de criação vs resolução.
                        Permite visualizar se a equipe está acompanhando a demanda ao longo do tempo.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Ver tendência</strong> - demanda crescendo ou estável?<br>
                        • <strong>Detectar divergência</strong> - criando mais do que resolvendo?<br>
                        • <strong>Identificar picos</strong> - dias/semanas atípicas<br>
                        • <strong>Medir impacto de ações</strong> - contratação melhorou resolução?<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • Linhas juntas = equipe acompanhando demanda ✅<br>
                        • Linha "criados" acima = acumulando backlog ❌<br>
                        • Linha "resolvidos" acima = reduzindo backlog ✅<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>renderTimelineChart()</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>created_at</code> - para linha de criados<br>
                        • <code>stats_resolved_at</code> - para linha de resolvidos<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        // Agrupa por dia<br>
                        criadosPorDia = {}<br>
                        resolvidosPorDia = {}<br>
                        tickets.forEach(t => {<br>
                        &nbsp;&nbsp;const diaCriado = t.created_at.split('T')[0]<br>
                        &nbsp;&nbsp;criadosPorDia[diaCriado]++<br>
                        &nbsp;&nbsp;if (t.stats_resolved_at) {<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;const diaResolvido = t.stats_resolved_at.split('T')[0]<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;resolvidosPorDia[diaResolvido]++<br>
                        &nbsp;&nbsp;}<br>
                        })
                        </code><br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket conta 1x em "criados" (no dia da criação)<br>
                        • Cada ticket resolvido conta 1x em "resolvidos" (no dia da resolução)
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📈 Interpretando o Gráfico de Timeline</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;text-align:center;">
                                <strong style="font-size:1.5rem;">↗️</strong><br>
                                <span style="font-size:11px;">Res > Cri</span><br>
                                <span style="font-size:10px;color:#10b981;">Zerando backlog</span>
                            </div>
                            <div style="background:#f59e0b20;padding:1rem;border-radius:8px;border:1px solid #f59e0b;text-align:center;">
                                <strong style="font-size:1.5rem;">→</strong><br>
                                <span style="font-size:11px;">Res = Cri</span><br>
                                <span style="font-size:10px;color:#f59e0b;">Equilibrado</span>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;text-align:center;">
                                <strong style="font-size:1.5rem;">↘️</strong><br>
                                <span style="font-size:11px;">Res < Cri</span><br>
                                <span style="font-size:10px;color:#ef4444;">Acumulando</span>
                            </div>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Sinais de Alerta</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Linha de criados constantemente ACIMA = PROBLEMA!</strong><br><br>
                            
                            Significa que:<br>
                            • Backlog crescendo dia após dia<br>
                            • Equipe não dá conta da demanda<br>
                            • Precisará de ação (contratar, automatizar, priorizar)<br><br>
                            
                            <strong>Calcule o déficit:</strong><br>
                            <code>déficit/dia = média_criados - média_resolvidos</code>
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Métricas Derivadas</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Métrica</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Fórmula</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Tendência</td><td style="border:1px solid #555;">(Atual - Anterior) / Anterior × 100</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Dias para zerar</td><td style="border:1px solid #555;">Backlog / (Res - Cri por dia)</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Capacidade ociosa</td><td style="border:1px solid #555;">(Res - Cri) × dias</td></tr>
                        </table>
                    `
                },
                {
                    name: 'Por Dia da Semana',
                    formula: 'Contagem agrupada pelo dia da semana de criação',
                    where: 'Gráfico Dia da Semana (barras), Análise de Padrões',
                    interpretation: 'Padrão semanal. Segundas geralmente têm pico.',
                    icon: '📆',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        A distribuição por Dia da Semana mostra <span style="color:#f59e0b;font-weight:bold">padrões semanais</span> de demanda.
                        Indica quais dias são mais movimentados.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Planejar escala</strong> - mais gente nos dias pesados<br>
                        • <strong>Antecipar picos</strong> - preparar para segunda-feira<br>
                        • <strong>Otimizar manutenções</strong> - agendar em dias calmos<br>
                        • <strong>Analisar SLA</strong> - sexta à noite estoura mais?<br><br>
                        
                        <strong>📊 Padrão típico:</strong><br>
                        • Segunda: PICO (acúmulo do fim de semana)<br>
                        • Terça-Quinta: Normal alto<br>
                        • Sexta: Normal (ou menor se RH sair cedo)<br>
                        • Sábado/Domingo: Baixo (se não 24/7)<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>renderByDayOfWeekChart()</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>created_at</code> - extrai dia da semana (0-6)<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        diasSemana = [0,0,0,0,0,0,0] // Dom a Sáb<br>
                        tickets.forEach(t => {<br>
                        &nbsp;&nbsp;const dia = new Date(t.created_at).getDay()<br>
                        &nbsp;&nbsp;diasSemana[dia]++<br>
                        })
                        </code><br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket conta 1x (no dia que foi criado)
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📅 Padrões Típicos de Semana</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Dia</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Volume</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Motivo</th>
                            </tr>
                            <tr style="background:#ef444420;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">🟢 Segunda</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">+60%</td><td style="border:1px solid #555;">Acúmulo do fim de semana</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Terça</td><td style="text-align:center;border:1px solid #555;">+10%</td><td style="border:1px solid #555;">Ainda resolvendo segunda</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Quarta</td><td style="text-align:center;border:1px solid #555;">Normal</td><td style="border:1px solid #555;">Dia padrão</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Quinta</td><td style="text-align:center;border:1px solid #555;">Normal</td><td style="border:1px solid #555;">Dia padrão</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Sexta</td><td style="text-align:center;border:1px solid #555;">-20%</td><td style="border:1px solid #555;">Pessoas saem mais cedo</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;">Sábado</td><td style="text-align:center;border:1px solid #555;">-70%</td><td style="border:1px solid #555;">Fim de semana</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;">Domingo</td><td style="text-align:center;border:1px solid #555;">-80%</td><td style="border:1px solid #555;">Fim de semana</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">👥 Planejamento de Escala</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Recomendação:</strong><br>
                            • <strong>Segunda:</strong> Equipe completa + reforço<br>
                            • <strong>Terça-Quinta:</strong> Equipe padrão<br>
                            • <strong>Sexta:</strong> Resolver backlog, não criar novas demandas<br>
                            • <strong>FDS:</strong> Plantão mínimo ou automação
                        </div>
                    `
                },
                {
                    name: 'Por Hora',
                    formula: 'Contagem agrupada pela hora de criação (0-23)',
                    where: 'Gráfico Por Hora (linha), Análise de Padrões',
                    interpretation: 'Horários de pico. Útil para escalar equipe.',
                    icon: '🕐',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        A distribuição por Hora mostra <span style="color:#ec4899;font-weight:bold">padrões diários</span> de demanda.
                        Indica em quais horários os tickets são mais criados.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Planejar plantão</strong> - ter gente nos horários de pico<br>
                        • <strong>Definir horário de suporte</strong> - quando os clientes mais precisam?<br>
                        • <strong>Identificar urgências noturnas</strong> - tickets fora de horário<br>
                        • <strong>Otimizar resposta</strong> - focar nos horários críticos<br><br>
                        
                        <strong>📊 Padrão típico (horário comercial):</strong><br>
                        • 00-06: Muito baixo<br>
                        • 07-08: Início do expediente<br>
                        • 09-12: PICO da manhã<br>
                        • 12-14: Almoço (queda)<br>
                        • 14-17: PICO da tarde<br>
                        • 18-23: Queda gradual<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>renderByHourChart()</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>created_at</code> - extrai hora (0-23)<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        horas = Array(24).fill(0)<br>
                        tickets.forEach(t => {<br>
                        &nbsp;&nbsp;const hora = new Date(t.created_at).getHours()<br>
                        &nbsp;&nbsp;horas[hora]++<br>
                        })
                        </code><br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Cada ticket conta 1x (na hora que foi criado)
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🕒 Horários Típicos de Pico</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:11px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Horário</th>
                                <th style="padding:6px;text-align:center;border:1px solid #555;">Volume</th>
                                <th style="padding:6px;text-align:left;border:1px solid #555;">Recomendação</th>
                            </tr>
                            <tr style="background:#10b98120;"><td style="padding:4px;border:1px solid #555;text-align:center;">00-06h</td><td style="text-align:center;border:1px solid #555;">🟢 5%</td><td style="border:1px solid #555;">Bot/automação</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;text-align:center;">07-08h</td><td style="text-align:center;border:1px solid #555;">🟡 10%</td><td style="border:1px solid #555;">Equipe entrando</td></tr>
                            <tr style="background:#ef444420;"><td style="padding:4px;border:1px solid #555;text-align:center;font-weight:bold;">09-11h</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">🔴 PICO</td><td style="border:1px solid #555;font-weight:bold;">Equipe completa</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;text-align:center;">12-13h</td><td style="text-align:center;border:1px solid #555;">🟡 -20%</td><td style="border:1px solid #555;">Revezamento almoço</td></tr>
                            <tr style="background:#ef444420;"><td style="padding:4px;border:1px solid #555;text-align:center;font-weight:bold;">14-17h</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">🔴 PICO</td><td style="border:1px solid #555;font-weight:bold;">Equipe completa</td></tr>
                            <tr><td style="padding:4px;border:1px solid #555;text-align:center;">18-19h</td><td style="text-align:center;border:1px solid #555;">🟡 -30%</td><td style="border:1px solid #555;">Equipe reduzida</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:4px;border:1px solid #555;text-align:center;">20-23h</td><td style="text-align:center;border:1px solid #555;">🟢 10%</td><td style="border:1px solid #555;">Plantão noturno</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">💡 Insights de Horário</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#7f1d1d;padding:1rem;border-radius:8px;">
                                <strong>⚠️ Se pico for FORA do horário</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Clientes de outro fuso?</li>
                                    <li>Ampliar horário suporte?</li>
                                    <li>Bot para noite?</li>
                                </ul>
                            </div>
                            <div style="background:#065f46;padding:1rem;border-radius:8px;">
                                <strong>✅ Se pico coincidir</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Escala correta</li>
                                    <li>Manter padrão</li>
                                    <li>Otimizar intervalos</li>
                                </ul>
                            </div>
                        </div>
                    `
                }
            ]
        },
        
        entities: {
            title: '👥 Entidades e Agrupamentos',
            description: 'Como os dados são agrupados por pessoa, time ou origem',
            items: [
                {
                    name: 'Por Pessoa (Tratativa)',
                    formula: 'Agrupamento pelo campo cf_tratativa',
                    where: 'BI Analytics modo "Por Pessoa", Tabela Detalhamento, Ranking',
                    interpretation: 'Análise individual de cada atendente.',
                    icon: '👤',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O agrupamento por Pessoa mostra <span style="color:#3b82f6;font-weight:bold">métricas individuais</span> de cada atendente.
                        Permite avaliar performance, carga e produtividade de cada membro da equipe.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Avaliação individual</strong> - como cada pessoa está performando?<br>
                        • <strong>Identificar top performers</strong> - quem são os melhores?<br>
                        • <strong>Detectar sobrecarga</strong> - alguém com muito volume?<br>
                        • <strong>Feedback 1:1</strong> - dados para conversas de desenvolvimento<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linhas 607-610)<br>
                        • Extração: <code>detectEntities()</code><br><br>
                        
                        <strong>📊 Campo utilizado:</strong><br>
                        • <code>cf_tratativa</code> - Campo customizado do Freshdesk<br><br>
                        
                        <strong>🧮 Extração:</strong><br>
                        <code>
                        // Separa múltiplos nomes<br>
                        pessoas = ticket.cf_tratativa.split(/[,;\\/]/)<br>
                        &nbsp;&nbsp;.map(p => p.trim())<br>
                        &nbsp;&nbsp;.filter(p => p.length > 0)
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Campo <code>cf_tratativa</code> do ticket<br>
                        • Separadores: vírgula (,), ponto-e-vírgula (;), barra (/)<br>
                        • Ignora espaços em branco<br>
                        • Se vazio: não aparece no agrupamento<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • <span style="color:#f59e0b;font-weight:bold">IMPORTANTE:</span> Um ticket pode ter MÚLTIPLAS pessoas<br>
                        • Se "João, Maria" no cf_tratativa: o ticket conta para AMBOS<br>
                        • Isso significa que a SOMA dos tickets por pessoa pode ser > total de tickets<br>
                        • Exemplo: 100 tickets, mas soma por pessoa = 150 (50 tickets compartilhados)
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">⚠️ Entendendo a Duplicidade</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Por que a soma de tickets por pessoa > total?</strong><br><br>
                            
                            Se um ticket tem <code>cf_tratativa = "João, Maria"</code>:<br>
                            • João: +1 ticket<br>
                            • Maria: +1 ticket<br>
                            • Total geral: ainda 1 ticket<br><br>
                            
                            <strong>Resultado:</strong> Soma por pessoa = 2, Total = 1
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Exemplo Prático</h4>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Pessoa</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Tickets</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Observação</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">João</td><td style="text-align:center;border:1px solid #555;">45</td><td style="border:1px solid #555;">30 solo + 15 compartilhados</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Maria</td><td style="text-align:center;border:1px solid #555;">38</td><td style="border:1px solid #555;">25 solo + 13 compartilhados</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Pedro</td><td style="text-align:center;border:1px solid #555;">32</td><td style="border:1px solid #555;">22 solo + 10 compartilhados</td></tr>
                            <tr style="background:#3f3f5a;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">SOMA</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">115</td><td style="border:1px solid #555;">Inclui duplicações</td></tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;font-weight:bold;">TOTAL REAL</td><td style="text-align:center;border:1px solid #555;font-weight:bold;">100</td><td style="border:1px solid #555;">Tickets únicos</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">🔍 Como o cf_tratativa é Parseado</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;font-family:monospace;font-size:11px;">
                            <strong>Entrada:</strong> "João Silva, Maria Santos / Pedro"<br><br>
                            <strong>Separadores detectados:</strong> , ; / \<br><br>
                            <strong>Saída:</strong><br>
                            • "João Silva"<br>
                            • "Maria Santos"<br>
                            • "Pedro"
                        </div>
                    `
                },
                {
                    name: 'Por Time (Grupo Tratativa)',
                    formula: 'Agrupamento pelo campo cf_grupo_tratativa',
                    where: 'BI Analytics modo "Por Time", Filtros, Comparativo',
                    interpretation: 'Performance comparativa entre equipes.',
                    icon: '👥',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O agrupamento por Time mostra <span style="color:#10b981;font-weight:bold">métricas por equipe</span>.
                        Permite comparar a performance entre diferentes grupos ou departamentos.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Comparar equipes</strong> - qual time está melhor?<br>
                        • <strong>Identificar gargalos por área</strong> - qual time está sobrecarregado?<br>
                        • <strong>Planejar recursos</strong> - qual time precisa de mais gente?<br>
                        • <strong>Análise de alto nível</strong> - visão gerencial<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linhas 607-610)<br>
                        • Extração: <code>detectEntities()</code><br><br>
                        
                        <strong>📊 Campo utilizado:</strong><br>
                        • <code>cf_grupo_tratativa</code> - Campo customizado do Freshdesk<br><br>
                        
                        <strong>🧮 Extração:</strong><br>
                        <code>
                        // Separa múltiplos times (raro, mas possível)<br>
                        times = ticket.cf_grupo_tratativa.split(/[,;\\/]/)<br>
                        &nbsp;&nbsp;.map(t => t.trim())<br>
                        &nbsp;&nbsp;.filter(t => t.length > 0)
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Campo <code>cf_grupo_tratativa</code> do ticket<br>
                        • Mesmos separadores que pessoa<br>
                        • Se vazio: não aparece no agrupamento<br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Similar a pessoas: ticket pode ter múltiplos times<br>
                        • Na prática, geralmente é 1 time por ticket<br>
                        • Não confundir time (grupo) com pessoa (indivíduo)
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📊 Comparação entre Times</h4>
                        
                        <p>Métricas que ajudam a comparar times:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Métrica</th>
                                <th style="padding:8px;text-align:left;border:1px solid #555;">O que mostra</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Volume</td><td style="border:1px solid #555;">Demanda recebida</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Taxa Resolução</td><td style="border:1px solid #555;">Eficiência de entrega</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">SLA</td><td style="border:1px solid #555;">Velocidade de resposta</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Índice</td><td style="border:1px solid #555;">Performance geral</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">⚠️ Cuidados na Comparação</h4>
                        
                        <div style="background:#7f1d1d;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Times diferentes têm contextos diferentes!</strong><br><br>
                            
                            • Time de BUGS vs Time de Dúvidas<br>
                            • Time de Clientes VIP vs Time Geral<br>
                            • Time de 5 pessoas vs Time de 2 pessoas<br><br>
                            
                            Sempre normalize por <strong>per capita</strong> quando tamanhos diferem.
                        </div>
                    `
                },
                {
                    name: 'Top 10',
                    formula: 'Ordenação decrescente por total de tickets, limitado a 10',
                    where: 'Gráfico Top 10 (barras horizontais), Dashboard',
                    interpretation: 'Principais responsáveis/times por volume.',
                    icon: '🏅',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Top 10 mostra as <span style="color:#f59e0b;font-weight:bold">10 entidades com mais tickets</span>.
                        É uma visão rápida de quem está recebendo mais demandas.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Visão rápida</strong> - quem são os principais?<br>
                        • <strong>Identificar concentração</strong> - demanda muito concentrada?<br>
                        • <strong>Benchmark</strong> - quanto o top performer tem?<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>renderTop10Chart()</code> (linha ~936-940)<br><br>
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <code>
                        allSorted = Array.from(entityMap.entries())<br>
                        &nbsp;&nbsp;.sort((a, b) => b[1].total - a[1].total)<br>
                        top10 = allSorted.slice(0, 10)
                        </code><br><br>
                        
                        <strong>🔄 Duplicidade:</strong><br>
                        • Herda o comportamento de pessoa/time<br>
                        • Tickets compartilhados contam para múltiplas pessoas
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🏆 Interpretação do Top 10</h4>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0;">
                            <div style="background:#10b98120;padding:1rem;border-radius:8px;border:1px solid #10b981;">
                                <strong>✅ Bom sinal se Top 10...</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>Distribuição equilibrada</li>
                                    <li>Alta taxa resolução</li>
                                    <li>SLA > 90%</li>
                                    <li>Sem sobrecarga</li>
                                </ul>
                            </div>
                            <div style="background:#ef444420;padding:1rem;border-radius:8px;border:1px solid #ef4444;">
                                <strong>❌ Alerta se Top 10...</strong><br>
                                <ul style="font-size:11px;margin:0.5rem 0 0 0;padding-left:1rem;">
                                    <li>1º tem 50%+ do total</li>
                                    <li>Baixa resolução</li>
                                    <li>SLA < 80%</li>
                                    <li>Volume muito desigual</li>
                                </ul>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Ranking por Volume',
                    formula: 'Ordenação decrescente por quantidade total de tickets atribuídos',
                    where: 'Gráfico Top 10, Tabela de Detalhamento, Ranking Produtividade',
                    interpretation: 'Mostra quem recebe mais demandas. Útil para balancear carga.',
                    icon: '📊',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Ranking por Volume mostra a <span style="color:#3b82f6;font-weight:bold">distribuição de demandas</span> entre pessoas ou times.
                        Indica quem está recebendo mais tickets para atender, independente de ter resolvido ou não.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • Identificar <strong>sobrecarga</strong> - quem está recebendo demandas demais<br>
                        • <strong>Balancear distribuição</strong> - redistribuir tickets quando há desigualdade<br>
                        • Medir <strong>demanda por área/pessoa</strong> - entender onde está a pressão<br>
                        • Dimensionar <strong>capacidade da equipe</strong> - decidir contratações<br>
                        • Identificar <strong>especialistas</strong> - quem recebe mais tickets de certo tipo<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • Volume muito <strong>concentrado</strong> em poucas pessoas = risco de gargalo<br>
                        • Volume <strong>bem distribuído</strong> = equipe balanceada<br>
                        • Pessoa com muito volume + baixa resolução = precisa de apoio<br>
                        • Pessoa com pouco volume + alta resolução = pode assumir mais<br><br>
                        
                        <strong>⚠️ Atenção:</strong><br>
                        Volume alto NÃO significa necessariamente bom desempenho. 
                        Deve ser analisado junto com Taxa de Resolução e SLA.<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-analytics-methods.js</code><br>
                        • Função: <code>calculateMetrics()</code> (linhas 604-663)<br>
                        • Renderização: <code>renderTop10Chart()</code> (linha ~936)<br>
                        • Tabela: <code>renderTable()</code> (linha ~864)<br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>cf_tratativa</code> - Campo de pessoa responsável<br>
                        • <code>cf_grupo_tratativa</code> - Campo de time/grupo<br>
                        • Separadores aceitos: vírgula (,), ponto-e-vírgula (;), barra (/)<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        1. Para cada ticket:<br>
                        &nbsp;&nbsp;- Extrai pessoa(s) do cf_tratativa<br>
                        &nbsp;&nbsp;- Incrementa contador total dessa pessoa<br>
                        2. Ordena por total decrescente<br>
                        3. Limita aos Top 10 (ou Top 20 na tabela)
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Um ticket pode ter múltiplas pessoas (separadas por , ; /)<br>
                        • Cada pessoa recebe +1 no contador quando mencionada<br>
                        • Filtra apenas entidades selecionadas no painel<br>
                        • Considera todos os status (aberto, pendente, resolvido, fechado)<br>
                        • Se cf_tratativa vazio: ignora no ranking de pessoas<br>
                        • Se cf_grupo_tratativa vazio: ignora no ranking de times
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">📊 Volume vs Performance</h4>
                        
                        <p>Volume alto <strong>NÃO significa</strong> bom desempenho:</p>
                        
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;text-align:left;border:1px solid #555;">Cenário</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Volume</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Taxa</th>
                                <th style="padding:8px;text-align:center;border:1px solid #555;">Diagnóstico</th>
                            </tr>
                            <tr style="background:#10b98120;"><td style="padding:6px;border:1px solid #555;">Alto + Alta</td><td style="text-align:center;border:1px solid #555;">🟢 100</td><td style="text-align:center;border:1px solid #555;">🟢 90%</td><td style="text-align:center;border:1px solid #555;">⭐ Top performer</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Alto + Baixa</td><td style="text-align:center;border:1px solid #555;">🟢 100</td><td style="text-align:center;border:1px solid #555;">🔴 50%</td><td style="text-align:center;border:1px solid #555;">⚠️ Sobrecarregado</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">Baixo + Alta</td><td style="text-align:center;border:1px solid #555;">🟡 30</td><td style="text-align:center;border:1px solid #555;">🟢 95%</td><td style="text-align:center;border:1px solid #555;">✅ Pode assumir mais</td></tr>
                            <tr style="background:#ef444420;"><td style="padding:6px;border:1px solid #555;">Baixo + Baixa</td><td style="text-align:center;border:1px solid #555;">🟡 30</td><td style="text-align:center;border:1px solid #555;">🔴 40%</td><td style="text-align:center;border:1px solid #555;">🚨 Precisa apoio</td></tr>
                        </table>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">🎯 Análise de Concentração</h4>
                        
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;">
                            <strong>Fórmula de concentração:</strong><br>
                            <code>concentração = tickets_top3 / total_tickets × 100</code><br><br>
                            
                            <strong>Interpretação:</strong><br>
                            • <span style="color:#10b981;">< 50%</span> = Bem distribuído<br>
                            • <span style="color:#f59e0b;">50-70%</span> = Concentrado<br>
                            • <span style="color:#ef4444;">> 70%</span> = Muito concentrado (risco!)
                        </div>
                    `
                }
            ]
        },
        
        filters: {
            title: '🔍 Filtros Disponíveis',
            description: 'Opções de filtragem dos dados antes dos cálculos',
            items: [
                {
                    name: 'Período',
                    formula: 'Filtra created_at entre data inicial e final',
                    where: 'Seletor de período em todas as abas, Date Range Picker',
                    interpretation: 'Define a janela temporal de análise.',
                    icon: '📅',
                    details: `
                        <strong>💡 O que este filtro representa:</strong><br>
                        O filtro de Período define o <span style="color:#3b82f6;font-weight:bold">intervalo de datas</span> que será analisado.
                        Todos os cálculos serão feitos apenas com tickets desse período.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Análise temporal</strong> - comparar mês a mês, semana a semana<br>
                        • <strong>Foco em eventos</strong> - analisar período de pico<br>
                        • <strong>Relatórios periódicos</strong> - dados do mês/trimestre<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é aplicado:</strong><br>
                        • Arquivo: <code>js/bi-analytics.js</code><br>
                        • Função: <code>filterByPeriod()</code><br>
                        • Aplicado em: <code>this.filteredData</code><br><br>
                        
                        <strong>📊 Campo utilizado:</strong><br>
                        • <code>created_at</code> - data de criação do ticket<br><br>
                        
                        <strong>🧮 Lógica:</strong><br>
                        <code>
                        filteredData = allTickets.filter(t => {<br>
                        &nbsp;&nbsp;const created = new Date(t.created_at)<br>
                        &nbsp;&nbsp;return created >= startDate && created <= endDate<br>
                        })
                        </code><br><br>
                        
                        <strong>⚙️ Comportamento:</strong><br>
                        • Filtro é INCLUSIVO (inclui os dias de início e fim)<br>
                        • Se não selecionado: usa últimos 30 dias como padrão<br>
                        • Afeta TODAS as métricas calculadas
                    `
                },
                {
                    name: 'Entidade (Pessoa/Time)',
                    formula: 'Filtra pelo valor selecionado no chip',
                    where: 'Chips de seleção no BI Analytics',
                    interpretation: 'Foco em uma pessoa ou time específico.',
                    icon: '🎯',
                    details: `
                        <strong>💡 O que este filtro representa:</strong><br>
                        O filtro de Entidade permite <span style="color:#10b981;font-weight:bold">selecionar quais pessoas ou times</span> analisar.
                        Você pode selecionar múltiplas entidades para comparação.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Análise focada</strong> - ver só uma pessoa ou time<br>
                        • <strong>Comparação</strong> - selecionar 2-3 para comparar<br>
                        • <strong>Visão completa</strong> - selecionar todos<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é aplicado:</strong><br>
                        • Arquivo: <code>js/bi-analytics.js</code><br>
                        • Estado: <code>this.selectedEntities</code> (Set)<br><br>
                        
                        <strong>🧮 Lógica:</strong><br>
                        <code>
                        // Só processa entidades selecionadas<br>
                        if (this.selectedEntities.has(entity)) {<br>
                        &nbsp;&nbsp;// calcula métricas<br>
                        }
                        </code><br><br>
                        
                        <strong>⚙️ Comportamento:</strong><br>
                        • Chips azuis = selecionado<br>
                        • Chips cinza = não selecionado<br>
                        • Múltipla seleção permitida<br>
                        • Afeta gráficos e tabelas
                    `
                },
                {
                    name: 'Status',
                    formula: 'Filtra pelo status do ticket (Aberto, Fechado, etc)',
                    where: 'Filtros na aba Tickets, algumas análises',
                    interpretation: 'Ver apenas tickets em determinado estado.',
                    icon: '🔘',
                    details: `
                        <strong>💡 O que este filtro representa:</strong><br>
                        O filtro de Status permite ver <span style="color:#f59e0b;font-weight:bold">apenas tickets em determinado estado</span>.
                        Útil para focar em backlog (abertos) ou produtividade (resolvidos).<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Ver backlog</strong> - filtrar só abertos/pendentes<br>
                        • <strong>Ver produtividade</strong> - filtrar só resolvidos<br>
                        • <strong>Análise de funil</strong> - ver cada etapa<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Valores possíveis:</strong><br>
                        • 2 = Aberto<br>
                        • 3 = Pendente<br>
                        • 4 = Resolvido<br>
                        • 5 = Fechado<br><br>
                        
                        <strong>⚙️ Comportamento:</strong><br>
                        • Filtro aplicado antes dos cálculos<br>
                        • "Todos" = não filtra por status
                    `
                }
            ]
        },
        
        fields: {
            title: '🗄️ Campos do Ticket',
            description: 'Campos do Freshdesk utilizados nos cálculos - origem dos dados',
            items: [
                {
                    name: 'created_at',
                    formula: 'Data/hora de criação do ticket (ISO 8601)',
                    where: 'Base para TODOS os cálculos de tempo e período',
                    interpretation: 'Momento em que o cliente abriu o chamado.',
                    icon: '📝',
                    details: `
                        <strong>💡 O que este campo representa:</strong><br>
                        Data e hora exatas em que o ticket foi <span style="color:#3b82f6;font-weight:bold">criado no Freshdesk</span>.
                        É a referência temporal principal para todos os cálculos.<br><br>
                        
                        <strong>📊 Formato:</strong><br>
                        • ISO 8601: <code>2024-12-04T10:30:00Z</code><br>
                        • Fuso: UTC (convertido para local na exibição)<br><br>
                        
                        <strong>🧮 Usado em:</strong><br>
                        • Filtro de período<br>
                        • Cálculo de tempo de resolução<br>
                        • Cálculo de tempo de resposta<br>
                        • Agrupamento por dia/hora<br>
                        • Timeline<br><br>
                        
                        <strong>⚙️ Observações:</strong><br>
                        • Nunca é nulo (todo ticket tem)<br>
                        • Não muda após criação<br>
                        • Origem: API Freshdesk
                    `
                },
                {
                    name: 'stats_resolved_at / resolved_at',
                    formula: 'Data/hora em que o ticket foi resolvido',
                    where: 'Cálculo de tempo de resolução, identificação de resolvidos',
                    interpretation: 'Momento em que a solução foi aplicada.',
                    icon: '✅',
                    details: `
                        <strong>💡 O que este campo representa:</strong><br>
                        Data e hora em que o ticket foi <span style="color:#10b981;font-weight:bold">marcado como resolvido</span>.
                        O "stats_" é a versão estatística mais precisa do Freshdesk.<br><br>
                        
                        <strong>📊 Variações:</strong><br>
                        • <code>stats_resolved_at</code> - preferido (mais preciso)<br>
                        • <code>resolved_at</code> - fallback<br><br>
                        
                        <strong>🧮 Usado em:</strong><br>
                        • Tempo médio de resolução<br>
                        • SLA de resolução<br>
                        • Timeline de resolvidos<br>
                        • Identificação de tickets finalizados<br><br>
                        
                        <strong>⚙️ Observações:</strong><br>
                        • Pode ser nulo (ticket não resolvido)<br>
                        • Pode mudar se ticket for reaberto/refechado<br>
                        • Só existe para status 4 ou 5
                    `
                },
                {
                    name: 'stats_first_responded_at',
                    formula: 'Data/hora da primeira resposta pública ao cliente',
                    where: 'Cálculo de SLA de primeira resposta',
                    interpretation: 'Momento da primeira interação do atendente.',
                    icon: '💬',
                    details: `
                        <strong>💡 O que este campo representa:</strong><br>
                        Data e hora da <span style="color:#f59e0b;font-weight:bold">primeira resposta pública</span> enviada ao cliente.
                        Usado para medir a agilidade do primeiro contato.<br><br>
                        
                        <strong>📊 Variações:</strong><br>
                        • <code>stats_first_responded_at</code> - preferido<br>
                        • <code>stats_first_response_at</code> - alternativo<br>
                        • <code>first_responded_at</code> - fallback<br><br>
                        
                        <strong>🧮 Usado em:</strong><br>
                        • SLA de 1ª Resposta<br>
                        • Tempo médio de resposta<br><br>
                        
                        <strong>⚙️ Observações:</strong><br>
                        • Pode ser nulo (sem resposta ainda)<br>
                        • Apenas respostas PÚBLICAS contam<br>
                        • Notas internas NÃO contam como resposta<br>
                        • Uma vez definido, não muda
                    `
                },
                {
                    name: 'status',
                    formula: 'Código numérico do status atual',
                    where: 'Filtros, gráficos de status, identificação de resolvidos',
                    interpretation: '2=Aberto, 3=Pendente, 4=Resolvido, 5=Fechado',
                    icon: '🏷️',
                    details: `
                        <strong>💡 O que este campo representa:</strong><br>
                        Código numérico que indica o <span style="color:#8b5cf6;font-weight:bold">estado atual</span> do ticket no workflow.<br><br>
                        
                        <strong>📊 Valores padrão Freshdesk:</strong><br>
                        • <span style="color:#ef4444">2</span> = Aberto (novo, aguardando atendimento)<br>
                        • <span style="color:#f59e0b">3</span> = Pendente (aguardando cliente/terceiro)<br>
                        • <span style="color:#10b981">4</span> = Resolvido (solução aplicada)<br>
                        • <span style="color:#6b7280">5</span> = Fechado (confirmado ou auto-fechado)<br><br>
                        
                        <strong>🧮 Usado em:</strong><br>
                        • Contagem de abertos/resolvidos<br>
                        • Taxa de resolução<br>
                        • Gráfico de status<br>
                        • Filtros<br><br>
                        
                        <strong>⚙️ Observações:</strong><br>
                        • Status customizados podem existir (ex: 6, 7...)<br>
                        • Para cálculos: 4 e 5 = "resolvido"
                    `
                },
                {
                    name: 'priority',
                    formula: 'Código numérico da prioridade',
                    where: 'Gráficos de prioridade, filtros, análises',
                    interpretation: '1=Baixa, 2=Média, 3=Alta, 4=Urgente',
                    icon: '⚡',
                    details: `
                        <strong>💡 O que este campo representa:</strong><br>
                        Código numérico que indica a <span style="color:#ef4444;font-weight:bold">criticidade</span> do ticket.<br><br>
                        
                        <strong>📊 Valores Freshdesk:</strong><br>
                        • <span style="color:#10b981">1</span> = Baixa - pode esperar<br>
                        • <span style="color:#f59e0b">2</span> = Média - prioridade normal<br>
                        • <span style="color:#f97316">3</span> = Alta - precisa de atenção<br>
                        • <span style="color:#ef4444">4</span> = Urgente - prioridade máxima<br><br>
                        
                        <strong>🧮 Usado em:</strong><br>
                        • Gráfico de prioridades<br>
                        • Métricas por pessoa (breakdown)<br>
                        • Filtros<br><br>
                        
                        <strong>⚙️ Observações:</strong><br>
                        • Definido na criação do ticket<br>
                        • Pode ser alterado durante o atendimento
                    `
                },
                {
                    name: 'cf_tratativa',
                    formula: 'Campo customizado com nome(s) do(s) atendente(s)',
                    where: 'Agrupamento por pessoa, ranking, tabelas',
                    interpretation: 'Identifica o responsável pelo ticket.',
                    icon: '👤',
                    details: `
                        <strong>💡 O que este campo representa:</strong><br>
                        Campo customizado da Tryvia que armazena o <span style="color:#3b82f6;font-weight:bold">nome da pessoa responsável</span> pelo ticket.
                        Pode conter múltiplos nomes separados por vírgula.<br><br>
                        
                        <strong>📊 Formato:</strong><br>
                        • Um nome: <code>João Silva</code><br>
                        • Múltiplos: <code>João Silva, Maria Santos</code><br>
                        • Separadores: <code>, ; /</code><br><br>
                        
                        <strong>🧮 Usado em:</strong><br>
                        • BI Analytics "Por Pessoa"<br>
                        • Ranking de volume<br>
                        • Tabela de produtividade<br>
                        • Cálculo de métricas individuais<br><br>
                        
                        <strong>⚙️ Observações:</strong><br>
                        • Pode estar vazio (ticket sem atribuição)<br>
                        • Múltiplas pessoas = ticket conta para TODAS<br>
                        • Nome deve ser EXATO para agrupar corretamente<br>
                        • "João" ≠ "Joao" ≠ "JOÃO"
                    `
                },
                {
                    name: 'cf_grupo_tratativa',
                    formula: 'Campo customizado com nome do time/equipe',
                    where: 'Agrupamento por time, filtros, comparativo',
                    interpretation: 'Identifica a equipe responsável pelo ticket.',
                    icon: '👥',
                    details: `
                        <strong>💡 O que este campo representa:</strong><br>
                        Campo customizado que armazena o <span style="color:#10b981;font-weight:bold">nome do time</span> responsável pelo ticket.
                        Usado para análises em nível de equipe.<br><br>
                        
                        <strong>📊 Formato:</strong><br>
                        • Geralmente um único time: <code>Suporte N1</code><br>
                        • Exemplos: <code>Desenvolvimento</code>, <code>Infra</code>, <code>Comercial</code><br><br>
                        
                        <strong>🧮 Usado em:</strong><br>
                        • BI Analytics "Por Time"<br>
                        • Modo Apresentação (filtro de time)<br>
                        • Comparativo entre equipes<br>
                        • Relatórios gerenciais<br><br>
                        
                        <strong>⚙️ Observações:</strong><br>
                        • Pode estar vazio<br>
                        • Geralmente 1 time por ticket<br>
                        • Diferente de pessoa (1 time pode ter N pessoas)
                    `
                }
            ]
        },
        
        csat: {
            title: '⭐ CSAT - Satisfação do Cliente',
            description: 'Métricas de satisfação do cliente baseadas em pesquisas pós-atendimento',
            items: [
                {
                    name: 'CSAT %',
                    formula: '(Avaliações positivas / Total de avaliações) × 100%',
                    where: 'Card CSAT no BI Analytics, Aba CSAT, Gráfico de Satisfação',
                    interpretation: 'Meta: ≥ 85%. Indica a satisfação geral dos clientes.',
                    icon: '⭐',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O CSAT (Customer Satisfaction Score) mede a <span style="color:#10b981;font-weight:bold">satisfação do cliente</span> após o atendimento.
                        É baseado em pesquisas enviadas automaticamente quando um ticket é resolvido.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir qualidade</strong> - os clientes estão satisfeitos?<br>
                        • <strong>Identificar problemas</strong> - avaliar feedbacks negativos<br>
                        • <strong>Avaliar agentes</strong> - ranking por satisfação<br>
                        • <strong>Tendência</strong> - satisfação melhorando ou piorando?<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">≥ 85%</span> = Excelente<br>
                        • <span style="color:#f59e0b">70-84%</span> = Regular<br>
                        • <span style="color:#ef4444">< 70%</span> = Crítico<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Tabela: <code>satisfaction_ratings</code> (Supabase)<br>
                        • Arquivo: <code>js/bi-csat-time-module.js</code><br>
                        • Função: <code>loadCSATData()</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>ratings.default</code> - Score de 1-5<br>
                        • <code>created_at</code> - Data da avaliação<br>
                        • <code>agent_id</code> - Agente avaliado<br><br>
                        
                        <strong>🧮 Cálculo exato:</strong><br>
                        <code>
                        satisfeitos = ratings.filter(r => r.ratings.default >= 4).length<br>
                        csatPercent = (satisfeitos / total) * 100
                        </code><br><br>
                        
                        <strong>⚙️ O que leva em consideração:</strong><br>
                        • Score ≥ 4 = Satisfeito (positivo)<br>
                        • Score < 4 = Insatisfeito (negativo)<br>
                        • Dados vêm do Supabase (sincronizado do Freshdesk)
                    `
                },
                {
                    name: 'Ranking de Agentes por CSAT',
                    formula: 'Ordenação por CSAT % decrescente por agente',
                    where: 'Aba CSAT, Tabela de Ranking',
                    interpretation: 'Mostra quais agentes têm melhor avaliação.',
                    icon: '🏆',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O ranking mostra <span style="color:#3b82f6;font-weight:bold">quais agentes têm melhor satisfação</span> do cliente.
                        Permite identificar melhores práticas e oportunidades de melhoria.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Reconhecimento</strong> - premiar melhores agentes<br>
                        • <strong>Treinamento</strong> - aprender com os melhores<br>
                        • <strong>Coaching</strong> - ajudar quem precisa melhorar<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-csat-time-module.js</code><br>
                        • Função: <code>calculateCSATStats()</code><br><br>
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <code>
                        byAgent = groupBy(ratings, 'agent_id')<br>
                        ranking = byAgent.map(a => ({<br>
                        &nbsp;&nbsp;agent: a.name,<br>
                        &nbsp;&nbsp;csat: calcCSAT(a.ratings),<br>
                        &nbsp;&nbsp;total: a.ratings.length<br>
                        })).sort((a,b) => b.csat - a.csat)
                        </code>
                    `
                },
                {
                    name: 'Tendência CSAT Mensal',
                    formula: 'CSAT % agrupado por mês',
                    where: 'Aba CSAT, Gráfico de Tendência',
                    interpretation: 'Evolução da satisfação ao longo do tempo.',
                    icon: '📈',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Mostra a <span style="color:#8b5cf6;font-weight:bold">evolução do CSAT ao longo dos meses</span>.
                        Permite identificar se a satisfação está melhorando ou piorando.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Acompanhar evolução</strong> - tendência de melhoria?<br>
                        • <strong>Correlacionar eventos</strong> - queda coincidiu com algo?<br>
                        • <strong>Definir metas</strong> - estabelecer objetivos mensais<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-csat-time-module.js</code><br>
                        • Função: <code>calculateCSATStats()</code><br><br>
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <code>
                        byMonth = groupBy(ratings, month(created_at))<br>
                        trend = byMonth.map(m => ({<br>
                        &nbsp;&nbsp;month: m.key,<br>
                        &nbsp;&nbsp;csat: calcCSAT(m.ratings)<br>
                        }))
                        </code>
                    `
                }
            ]
        },
        
        timeEntries: {
            title: '⏱️ Tempo de Atendimento',
            description: 'Métricas de tempo registrado pelos agentes nos tickets',
            items: [
                {
                    name: 'Tempo Total por Agente',
                    formula: 'Soma das horas registradas por cada agente',
                    where: 'Aba Tempo, Ranking de Tempo',
                    interpretation: 'Total de horas trabalhadas por agente.',
                    icon: '⏰',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Tempo Total mostra <span style="color:#3b82f6;font-weight:bold">quantas horas cada agente registrou</span> trabalhando em tickets.
                        É baseado nos time entries do Freshdesk.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir esforço</strong> - quanto tempo é gasto por ticket?<br>
                        • <strong>Identificar complexidade</strong> - tickets que consomem mais tempo<br>
                        • <strong>Balancear carga</strong> - quem está trabalhando mais?<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Tabela: <code>time_entries</code> (Supabase)<br>
                        • Arquivo: <code>js/bi-csat-time-module.js</code><br>
                        • Função: <code>loadTimeEntriesData()</code><br><br>
                        
                        <strong>📊 Campos utilizados:</strong><br>
                        • <code>time_spent</code> - Tempo em segundos<br>
                        • <code>agent_id</code> - Agente que registrou<br>
                        • <code>ticket_id</code> - Ticket associado<br><br>
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <code>
                        tempoHoras = time_spent / 3600<br>
                        totalPorAgente = entries<br>
                        &nbsp;&nbsp;.groupBy(agent_id)<br>
                        &nbsp;&nbsp;.sum(time_spent)
                        </code>
                    `
                },
                {
                    name: 'Tempo Médio por Ticket',
                    formula: 'Total de horas / Número de tickets',
                    where: 'Aba Tempo, KPI Card',
                    interpretation: 'Média de tempo gasto por ticket.',
                    icon: '📊',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        O Tempo Médio mostra <span style="color:#f59e0b;font-weight:bold">quanto tempo em média</span> é gasto para atender um ticket.
                        Útil para estimar capacidade e dimensionar equipe.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Planejar capacidade</strong> - quantos tickets cabem em 8h?<br>
                        • <strong>Identificar outliers</strong> - tickets que fogem da média<br>
                        • <strong>Otimizar processos</strong> - reduzir tempo médio<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • Tempo alto = tickets complexos ou processo ineficiente<br>
                        • Tempo baixo = tickets simples ou equipe eficiente<br>
                        • Comparar por tipo de ticket para insights<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <code>
                        tempoMedio = totalHoras / totalTickets
                        </code>
                    `
                }
            ]
        },
        
        businessHours: {
            title: '🏢 Horário Comercial',
            description: 'Análise de tickets por horário de expediente',
            items: [
                {
                    name: '% Dentro do Expediente',
                    formula: '(Tickets 08h-18h Seg-Sex / Total) × 100%',
                    where: 'Card Horário Comercial, Seção Pipeline',
                    interpretation: 'Percentual de tickets criados no horário comercial.',
                    icon: '🏢',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Mostra <span style="color:#10b981;font-weight:bold">qual percentual dos tickets</span> foi criado dentro do horário comercial (08h-18h, Segunda a Sexta).
                        Útil para dimensionar plantões e turnos.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Dimensionar turnos</strong> - precisa de plantão noturno?<br>
                        • <strong>Planejar escala</strong> - quantos no fim de semana?<br>
                        • <strong>Identificar urgências</strong> - tickets fora de horário são urgentes?<br><br>
                        
                        <strong>📊 Como interpretar:</strong><br>
                        • <span style="color:#10b981">≥ 70%</span> = Maioria no expediente<br>
                        • <span style="color:#f59e0b">50-69%</span> = Distribuição equilibrada<br>
                        • <span style="color:#ef4444">< 50%</span> = Muita demanda fora de horário<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Onde é buscado:</strong><br>
                        • Arquivo: <code>js/bi-csat-time-module.js</code><br>
                        • Função: <code>analyzeBusinessHours()</code><br><br>
                        
                        <strong>📊 Definição de Horário Comercial:</strong><br>
                        • <strong>Dias:</strong> Segunda a Sexta (Day 1-5)<br>
                        • <strong>Horário:</strong> 08:00 às 18:00<br>
                        • <strong>Fora:</strong> Sábado, Domingo, antes das 8h, após 18h<br><br>
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <code>
                        isWeekday = day >= 1 && day <= 5<br>
                        isBusinessHour = hour >= 8 && hour < 18<br>
                        dentro = isWeekday && isBusinessHour<br>
                        percent = (dentro / total) * 100
                        </code>
                    `
                },
                {
                    name: 'Horário de Pico',
                    formula: 'Hora com maior número de tickets criados',
                    where: 'Card Horário Comercial, Análise de Padrões',
                    interpretation: 'Identifica o horário de maior demanda.',
                    icon: '⏰',
                    details: `
                        <strong>💡 O que este dado representa:</strong><br>
                        Mostra <span style="color:#ec4899;font-weight:bold">em qual horário</span> a equipe recebe mais tickets.
                        Útil para garantir capacidade nos momentos críticos.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Escalar equipe</strong> - mais gente no pico<br>
                        • <strong>Evitar gargalos</strong> - não agendar reuniões no pico<br>
                        • <strong>Otimizar resposta</strong> - foco no horário crítico<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📊 Padrão típico:</strong><br>
                        • <strong>Manhã:</strong> 09h-11h (pico principal)<br>
                        • <strong>Almoço:</strong> 12h-13h (queda)<br>
                        • <strong>Tarde:</strong> 14h-16h (segundo pico)<br>
                        • <strong>Final:</strong> 17h-18h (queda)<br><br>
                        
                        <strong>🧮 Cálculo:</strong><br>
                        <code>
                        byHour = new Array(24).fill(0)<br>
                        tickets.forEach(t => byHour[t.hour]++)<br>
                        peakHour = byHour.indexOf(Math.max(...byHour))
                        </code>
                    `
                }
            ]
        },
        
        tabConcepts: {
            title: '📑 Conceito das Abas',
            description: 'Explicação detalhada de cada aba do sistema, funcionalidades e como utilizá-las',
            items: [
                {
                    name: 'Dashboard',
                    formula: 'Tela principal carregada com dados do Excel',
                    where: 'Aba inicial do sistema, acessível ao carregar arquivo Excel',
                    interpretation: 'Visão consolidada de todos os times com KPIs gerais e gráficos.',
                    icon: '📊',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        O Dashboard é a <span style="color:#3b82f6;font-weight:bold">tela principal do sistema</span>, exibida após o carregamento de um arquivo Excel.
                        Apresenta uma visão consolidada de todos os dados com KPIs, gráficos e rankings.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Visão executiva</strong> - resumo rápido de toda operação<br>
                        • <strong>Identificar tendências</strong> - gráficos mensais e de tipos<br>
                        • <strong>Comparar times</strong> - ranking de performance<br>
                        • <strong>Monitorar backlog</strong> - tickets abertos vs fechados<br><br>
                        
                        <strong>📊 O que mostra:</strong><br>
                        • <strong>KPIs principais:</strong> Total de tickets, Resolvidos, Abertos, Taxa de Resolução<br>
                        • <strong>Gráfico Mensal:</strong> Evolução de tickets por mês<br>
                        • <strong>Gráfico de Tipos:</strong> Distribuição por tipo de demanda<br>
                        • <strong>Gráfico de Estados:</strong> Distribuição por status<br>
                        • <strong>Ranking de Times:</strong> Comparativo de performance<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivo de origem:</strong><br>
                        • <code>BI_por_Time(2).html</code> - Estrutura principal<br>
                        • Funções: <code>updateDashboard()</code>, <code>renderMonthlyChart()</code>, <code>renderTypesChart()</code>, <code>renderEstadoChart()</code><br><br>
                        
                        <strong>📋 Dados necessários:</strong><br>
                        • Arquivo Excel exportado do Freshdesk<br>
                        • Colunas obrigatórias: ID, Status, Tipo, Data de criação, cf_tratativa, cf_grupo_tratativa<br><br>
                        
                        <strong>⚙️ Filtros disponíveis:</strong><br>
                        • <strong>Período:</strong> Últimos X dias<br>
                        • <strong>Time:</strong> Selecionar time específico<br>
                        • <strong>Pessoa:</strong> Filtrar por atendente
                    `
                },
                {
                    name: 'BI Charts',
                    formula: 'Gráficos interativos com dados do Supabase',
                    where: 'Menu principal → BI Charts',
                    interpretation: 'Análises visuais em tempo real com dados sincronizados do Freshdesk.',
                    icon: '📈',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        O BI Charts é a aba de <span style="color:#10b981;font-weight:bold">gráficos interativos em tempo real</span>, conectada diretamente ao banco Supabase 
                        que sincroniza com o Freshdesk automaticamente.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Análises em tempo real</strong> - sem precisar exportar Excel<br>
                        • <strong>Gráficos interativos</strong> - hover com detalhes, zoom, filtros<br>
                        • <strong>Múltiplas visualizações</strong> - linhas, barras, pizza, radar<br>
                        • <strong>Comparativos visuais</strong> - lado a lado entre períodos<br><br>
                        
                        <strong>📊 Gráficos disponíveis:</strong><br>
                        • <strong>Timeline:</strong> Evolução de tickets ao longo do tempo<br>
                        • <strong>Por Status:</strong> Distribuição de estados<br>
                        • <strong>Por Prioridade:</strong> Tickets por nível de urgência<br>
                        • <strong>Por Tipo:</strong> Categorias de demanda<br>
                        • <strong>SLA:</strong> Conformidade com prazos<br>
                        • <strong>Heatmap:</strong> Mapa de calor por horário/dia<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/bi-charts-interface.js</code> - Interface e renderização<br>
                        • <code>js/bi-charts-supabase.js</code> - Conexão com banco<br>
                        • <code>js/bi-charts-filters.js</code> - Sistema de filtros<br><br>
                        
                        <strong>🔗 Conexão com Supabase:</strong><br>
                        • URL: <code>mzjdmhgkrroajmsfwryu.supabase.co</code><br>
                        • Tabela: <code>Tickets</code><br>
                        • Sincronização: Via GitHub Actions a cada 30 minutos<br><br>
                        
                        <strong>⚙️ Diferença do Dashboard:</strong><br>
                        • Dashboard: Dados do Excel (estático)<br>
                        • BI Charts: Dados do Supabase (tempo real)
                    `
                },
                {
                    name: 'BI Analytics',
                    formula: 'Análise detalhada por Pessoas e Times',
                    where: 'Menu principal → BI Analytics',
                    interpretation: 'Métricas individualizadas com seleção múltipla de entidades.',
                    icon: '👥',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        O BI Analytics é a aba de <span style="color:#8b5cf6;font-weight:bold">análise por entidades</span> (Pessoas ou Times), 
                        permitindo selecionar múltiplas entidades e comparar métricas.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Analisar pessoas individualmente</strong> - performance de cada atendente<br>
                        • <strong>Analisar times</strong> - comparar equipes<br>
                        • <strong>Seleção múltipla</strong> - selecionar várias pessoas/times de uma vez<br>
                        • <strong>Métricas detalhadas</strong> - taxa de resolução, tempo médio, SLA<br><br>
                        
                        <strong>📊 O que mostra:</strong><br>
                        • <strong>KPI Cards:</strong> Total, Resolvidos, Abertos, Taxa de Resolução<br>
                        • <strong>Top 10:</strong> Ranking horizontal com gradientes<br>
                        • <strong>Taxa de Resolução:</strong> Barras verticais por entidade<br>
                        • <strong>Tabela Detalhada:</strong> Todas as métricas por pessoa/time<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/bi-analytics.js</code> - Classe principal<br>
                        • <code>js/bi-analytics-methods.js</code> - Métodos de cálculo<br>
                        • <code>js/bi-analytics-charts.js</code> - Renderização de gráficos<br>
                        • <code>js/bi-analytics-metrics.js</code> - Métricas avançadas<br><br>
                        
                        <strong>🎛️ Sub-abas internas:</strong><br>
                        • <strong>👤 Pessoas:</strong> Análise por atendente (cf_tratativa)<br>
                        • <strong>👥 Times:</strong> Análise por time (cf_grupo_tratativa)<br><br>
                        
                        <strong>⚙️ Como usar:</strong><br>
                        1. Escolher sub-aba (Pessoas ou Times)<br>
                        2. Selecionar entidades nos chips<br>
                        3. Usar busca para filtrar<br>
                        4. Clicar "Aplicar Filtros"
                    `
                },
                {
                    name: 'Comparativo',
                    formula: 'Comparação lado a lado de múltiplas entidades',
                    where: 'Menu principal → Comparativo',
                    interpretation: 'Análise comparativa com gráficos radar, heatmap e insights automáticos.',
                    icon: '⚖️',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        O Comparativo permite <span style="color:#f59e0b;font-weight:bold">comparar até 5 entidades lado a lado</span> 
                        (Times, Pessoas ou Sistemas) com múltiplas métricas e visualizações avançadas.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Comparar desempenho</strong> - quem está melhor em cada métrica<br>
                        • <strong>Identificar gaps</strong> - onde cada entidade precisa melhorar<br>
                        • <strong>Análise multidimensional</strong> - várias métricas ao mesmo tempo<br>
                        • <strong>Insights automáticos</strong> - sistema detecta disparidades<br><br>
                        
                        <strong>📊 Visualizações disponíveis:</strong><br>
                        • <strong>Summary Cards:</strong> Melhor performer por métrica<br>
                        • <strong>Gráfico de Barras:</strong> Comparação visual da métrica principal<br>
                        • <strong>Gráfico Radar:</strong> Análise multidimensional (até 6 métricas)<br>
                        • <strong>Timeline:</strong> Evolução temporal mensal<br>
                        • <strong>Heatmap:</strong> Mapa de calor métricas vs entidades<br>
                        • <strong>Tabela Detalhada:</strong> Todos os dados com destaque<br>
                        • <strong>Insights:</strong> Recomendações automáticas<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/comparative-module.js</code> - Módulo principal<br>
                        • <code>js/comparative-functions.js</code> - Funções de processamento<br>
                        • <code>js/comparative-charts.js</code> - Renderização de gráficos<br><br>
                        
                        <strong>🎛️ Métricas disponíveis:</strong><br>
                        • Total de Tickets, Tempo Médio de Resolução, Tempo Médio 1ª Resposta<br>
                        • Conformidade SLA (%), Tickets por Dia, Tickets Críticos<br>
                        • Tickets Fechados/Abertos, Índice de Produtividade, Satisfação do Cliente<br><br>
                        
                        <strong>⚙️ Como usar:</strong><br>
                        1. Escolher tipo (Times, Pessoas, Sistemas)<br>
                        2. Selecionar 2-5 entidades nos chips<br>
                        3. Marcar métricas desejadas<br>
                        4. Definir período<br>
                        5. Clicar "Gerar Comparação"
                    `
                },
                {
                    name: 'CSAT',
                    formula: 'Análise de satisfação do cliente',
                    where: 'Menu principal → CSAT (dentro de BI Analytics)',
                    interpretation: 'Métricas de pesquisas de satisfação pós-atendimento.',
                    icon: '⭐',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        A aba CSAT (Customer Satisfaction) mostra <span style="color:#fbbf24;font-weight:bold">métricas de satisfação do cliente</span> 
                        baseadas nas pesquisas respondidas após o fechamento dos tickets.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir satisfação</strong> - os clientes estão satisfeitos?<br>
                        • <strong>Identificar problemas</strong> - quais atendentes têm notas baixas?<br>
                        • <strong>Acompanhar evolução</strong> - satisfação melhorando ou piorando?<br>
                        • <strong>Ler feedbacks</strong> - o que os clientes dizem?<br><br>
                        
                        <strong>📊 O que mostra:</strong><br>
                        • <strong>Nota Média:</strong> Média das avaliações (1-5 estrelas)<br>
                        • <strong>Total de Avaliações:</strong> Quantas pesquisas respondidas<br>
                        • <strong>Distribuição:</strong> Gráfico por nota (1 a 5)<br>
                        • <strong>Ranking por Agente:</strong> Quem tem melhor nota<br>
                        • <strong>Feedbacks Recentes:</strong> Comentários dos clientes<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/bi-csat-time-module.js</code> - Módulo CSAT e Tempo<br>
                        • Tabela Supabase: <code>TicketSurveys</code><br><br>
                        
                        <strong>🔗 Origem dos dados:</strong><br>
                        • Freshdesk API: <code>/surveys/satisfaction_ratings</code><br>
                        • Campos: rating (1-5), feedback, agent_id, ticket_id<br><br>
                        
                        <strong>📅 Filtro de Período:</strong><br>
                        • Botão com calendário visual<br>
                        • Atalhos: 7 dias, 30 dias, 90 dias, Este mês, 1 ano, Todo período<br>
                        • Período personalizado: Selecionar datas no calendário
                    `
                },
                {
                    name: 'Tempo',
                    formula: 'Análise de tempo registrado pelos agentes',
                    where: 'Menu principal → Tempo (dentro de BI Analytics)',
                    interpretation: 'Métricas de horas trabalhadas em cada ticket.',
                    icon: '⏱️',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        A aba Tempo mostra <span style="color:#06b6d4;font-weight:bold">análise de tempo registrado</span> pelos agentes nos tickets, 
                        medindo quanto tempo cada pessoa gastou em atendimentos.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir produtividade</strong> - quanto tempo gastando em tickets?<br>
                        • <strong>Distribuição de carga</strong> - quem está trabalhando mais?<br>
                        • <strong>Custo por ticket</strong> - tempo médio por demanda<br>
                        • <strong>Acompanhar horas</strong> - evolução ao longo do período<br><br>
                        
                        <strong>📊 O que mostra:</strong><br>
                        • <strong>Total de Horas:</strong> Soma de todo tempo registrado<br>
                        • <strong>Total de Entradas:</strong> Quantos registros de tempo<br>
                        • <strong>Tempo Médio:</strong> Média por registro<br>
                        • <strong>Por Agente:</strong> Ranking de horas por pessoa<br>
                        • <strong>Por Dia:</strong> Distribuição ao longo do período<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/bi-csat-time-module.js</code> - Módulo CSAT e Tempo<br>
                        • Tabela Supabase: <code>TimeEntries</code><br><br>
                        
                        <strong>🔗 Origem dos dados:</strong><br>
                        • Freshdesk API: <code>/tickets/{id}/time_entries</code><br>
                        • Campos: time_spent (segundos), agent_id, executed_at<br><br>
                        
                        <strong>📅 Filtro de Período:</strong><br>
                        • Botão com calendário visual<br>
                        • Atalhos: 7 dias, 30 dias, 90 dias, Este mês, 1 ano, Todo período<br>
                        • Período personalizado: Selecionar datas no calendário
                    `
                },
                {
                    name: 'Acompanhamento',
                    formula: 'Análise de tickets por tags de acompanhamento',
                    where: 'Menu principal → Acompanhamento (dentro de BI Analytics)',
                    interpretation: 'Métricas de tratativa indireta baseadas na coluna tags.',
                    icon: '🏷️',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        A aba Acompanhamento mostra <span style="color:#ec4899;font-weight:bold">métricas de tratativa indireta</span> 
                        baseadas na coluna <code>tags</code> do ticket, identificando quem está acompanhando tickets de outros.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Medir acompanhamento</strong> - quem está ajudando em tickets de outros?<br>
                        • <strong>Tratativa indireta</strong> - suporte não-oficial a colegas<br>
                        • <strong>Colaboração</strong> - identificar quem colabora mais<br>
                        • <strong>Distribuição de carga oculta</strong> - trabalho não visível no cf_tratativa<br><br>
                        
                        <strong>📊 O que mostra:</strong><br>
                        • <strong>Total de Tickets Acompanhados:</strong> Quantos tickets têm tags<br>
                        • <strong>Por Pessoa:</strong> Ranking de acompanhamentos por nome<br>
                        • <strong>Taxa de Resolução:</strong> % de resolvidos entre acompanhados<br>
                        • <strong>Tabela Detalhada:</strong> Lista de tickets com links<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/bi-acompanhamento-module.js</code><br><br>
                        
                        <strong>🔗 Origem dos dados:</strong><br>
                        • Coluna: <code>tags</code> do ticket<br>
                        • Formato: Array de nomes ou string JSON<br>
                        • Filtro: Lista de pessoas permitidas (whitelist)<br><br>
                        
                        <strong>👥 Membros do Time Atendimento (Whitelist):</strong><br>
                        • Adriana Florencio, Alianie Lanes, Andreia Ribeiro<br>
                        • Francisco Nascimento, Gabriel Oliveira, Gustavo Martins<br>
                        • João Peres, Jéssica Dias, Marciele Quintanilha<br>
                        • Configurado em: <code>TEAM_MEMBERS_CONFIG</code> (bi-analytics.js)<br>
                        • Matching: Case-sensitive, nome completo<br><br>
                        
                        <strong>📅 Filtro de Período:</strong><br>
                        • Botão com calendário visual<br>
                        • Atalhos: 7 dias, 30 dias, 90 dias, Este mês, 1 ano, Todo período
                    `
                },
                {
                    name: 'Tickets (Freshdesk)',
                    formula: 'Listagem de tickets em tempo real via API',
                    where: 'Menu principal → Tickets',
                    interpretation: 'Tabela navegável de tickets diretamente do Freshdesk.',
                    icon: '🎫',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        A aba Tickets mostra uma <span style="color:#ef4444;font-weight:bold">listagem em tempo real</span> dos tickets 
                        carregados diretamente da API do Freshdesk via proxy local.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Ver tickets atuais</strong> - sem precisar exportar Excel<br>
                        • <strong>Filtrar rapidamente</strong> - por status, prioridade, período<br>
                        • <strong>Navegar pela lista</strong> - paginação com 10/30/50/100 por página<br>
                        • <strong>Acessar ticket</strong> - link direto para o Freshdesk<br><br>
                        
                        <strong>📊 O que mostra:</strong><br>
                        • <strong>Stats Cards:</strong> Total, Abertos, Pendentes, Resolvidos<br>
                        • <strong>Tabela:</strong> ID, Assunto, Status, Prioridade, Data<br>
                        • <strong>Paginação:</strong> Navegação entre páginas<br>
                        • <strong>Filtros:</strong> Período, Status, Prioridade<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>BI_por_Time(2).html</code> - Funções de tickets<br>
                        • <code>freshdesk-proxy.js</code> - Proxy para API<br><br>
                        
                        <strong>🔗 Conexão:</strong><br>
                        • API: <code>https://suportetryvia.freshdesk.com/api/v2/tickets</code><br>
                        • Proxy Local: Porta 3003 (necessário para evitar CORS)<br><br>
                        
                        <strong>⚠️ Requisitos:</strong><br>
                        • Proxy local deve estar rodando (<code>npm start</code>)<br>
                        • API Key configurada nas Preferências<br>
                        • Limite padrão: 6000 tickets
                    `
                },
                {
                    name: 'Relatórios',
                    formula: 'Geração de relatórios executivos para impressão',
                    where: 'Menu principal → Relatórios',
                    interpretation: 'Relatórios formatados para apresentação e exportação.',
                    icon: '📄',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        A aba Relatórios permite gerar <span style="color:#6366f1;font-weight:bold">relatórios executivos formatados</span> 
                        prontos para impressão, apresentação ou exportação em PDF.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Apresentar para gestão</strong> - relatórios profissionais<br>
                        • <strong>Documentar período</strong> - registro histórico<br>
                        • <strong>Exportar dados</strong> - PDF ou impressão<br>
                        • <strong>Resumo executivo</strong> - visão consolidada<br><br>
                        
                        <strong>📊 Seções do relatório:</strong><br>
                        • <strong>Resumo Executivo:</strong> Visão geral com highlights<br>
                        • <strong>KPIs Principais:</strong> Cards com métricas-chave<br>
                        • <strong>Gráficos:</strong> Visualizações em alta resolução<br>
                        • <strong>Tabelas Detalhadas:</strong> Dados completos<br>
                        • <strong>Análise SLA:</strong> Conformidade com metas<br>
                        • <strong>Rankings:</strong> Top performers<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>BI_por_Time(2).html</code> - Funções de geração<br>
                        • Funções: <code>generateExecutiveSummary()</code>, <code>generateKPIs()</code>, <code>generateCharts()</code><br><br>
                        
                        <strong>🎨 Tema:</strong><br>
                        • Dark mode nativo<br>
                        • Cores semânticas (verde=bom, vermelho=ruim)<br>
                        • Gráficos em alta resolução (800x500)<br>
                        • Gradientes e sombras sutis
                    `
                },
                {
                    name: 'Modo Apresentação',
                    formula: 'Slideshow automático de BIs para reuniões',
                    where: 'Menu principal → Apresentação',
                    interpretation: 'Modo tela cheia com slides animados, anotações ao vivo e modo apresentador.',
                    icon: '🎬',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        O Modo Apresentação transforma os BIs em um <span style="color:#a855f7;font-weight:bold">slideshow profissional</span> 
                        para exibição em reuniões, com animações, anotações ao vivo e modo apresentador.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Reuniões de equipe</strong> - apresentar métricas com animações<br>
                        • <strong>Monitores na parede</strong> - dashboard rotativo<br>
                        • <strong>Apresentações executivas</strong> - visão profissional com comparativos<br>
                        • <strong>Anotações ao vivo</strong> - destacar pontos durante a apresentação<br><br>
                        
                        <strong>🆕 Novas Funcionalidades:</strong><br>
                        • <strong>✨ Animações:</strong> Gráficos animam ao entrar (fade + scale)<br>
                        • <strong>💬 Tooltip Rico:</strong> Informações detalhadas ao passar o mouse<br>
                        • <strong>🎤 Modo Apresentador:</strong> Janela separada com preview e notas<br>
                        • <strong>📊 Comparativo:</strong> Variação vs período anterior no rodapé<br>
                        • <strong>✏️ Anotações ao Vivo:</strong> Desenhar e destacar na tela<br><br>
                        
                        <strong>⌨️ Atalhos de Teclado:</strong><br>
                        • <strong>→ / Espaço:</strong> Próximo slide<br>
                        • <strong>←:</strong> Slide anterior<br>
                        • <strong>D:</strong> Toggle modo desenho<br>
                        • <strong>P:</strong> Abrir modo apresentador<br>
                        • <strong>C:</strong> Limpar anotações<br>
                        • <strong>Esc:</strong> Sair da apresentação<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/presentation-mode-v2.js</code> - Classe PresentationModeV2<br><br>
                        
                        <strong>🔄 Modos de Dados:</strong><br>
                        • <strong>Tratativa:</strong> Usa campos <code>cf_tratativa</code> e <code>cf_grupo_tratativa</code><br>
                        • <strong>Tags:</strong> Usa coluna <code>tags</code> para identificar acompanhamento<br><br>
                        
                        <strong>👥 Filtro de Time (Whitelist):</strong><br>
                        • Time Atendimento/Acompanhamento: 9 membros fixos<br>
                        • Membros: Adriana Florencio, Alianie Lanes, Andreia Ribeiro, Francisco Nascimento,<br>
                        &nbsp;&nbsp;Gabriel Oliveira, Gustavo Martins, João Peres, Jéssica Dias, Marciele Quintanilha<br>
                        • Config: <code>TEAM_MEMBERS_CONFIG</code> em bi-analytics.js<br>
                        • Gráficos filtrados: Top 10, Workload, Rankings SLA/Resolução, Eficiência, Tempo Agente<br><br>
                        
                        <strong>📊 Categorias de Slides (24 tipos):</strong><br>
                        • <strong>Visão Geral:</strong> Overview, Top 10, Status, Prioridade, Timeline, Sistemas<br>
                        • <strong>Performance/SLA:</strong> Taxa Resolução, Conformidade SLA, Tempo Médio, First Response, CSAT<br>
                        • <strong>Produtividade:</strong> Por Dia da Semana, Por Hora, Heatmap, Backlog, Carga de Trabalho<br>
                        • <strong>Comparativos:</strong> Comparativo Mensal, Tendência Semanal<br>
                        • <strong>Rankings:</strong> Por SLA, Por Resolução, Eficiência<br>
                        • <strong>Pipeline:</strong> Funil de Status, Tickets Parados, Aguardando Cliente<br>
                        • <strong>Acompanhamento:</strong> Tags de Acompanhamento, Resolução por Acompanhamento<br>
                        • <strong>Tempo:</strong> Tempo Registrado, Tempo por Agente
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">🎤 Modo Apresentador</h4>
                        <p>Janela separada para o apresentador com:</p>
                        <ul style="font-size:12px;margin:0.5rem 0;padding-left:1rem;">
                            <li><strong>Slide atual:</strong> Título e categoria</li>
                            <li><strong>Preview:</strong> Slide anterior e próximo</li>
                            <li><strong>Timer:</strong> Tempo decorrido da apresentação</li>
                            <li><strong>Comparativo:</strong> Total, taxa resolução, variação %</li>
                            <li><strong>Notas:</strong> Área para notas do slide</li>
                            <li><strong>Controles:</strong> Botões para navegar</li>
                        </ul>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">✏️ Sistema de Anotações</h4>
                        <p>Desenhe diretamente sobre os slides:</p>
                        <ul style="font-size:12px;margin:0.5rem 0;padding-left:1rem;">
                            <li><strong>Ativar:</strong> Botão ✏️ ou tecla D</li>
                            <li><strong>Cor:</strong> Seletor de cor na barra</li>
                            <li><strong>Limpar:</strong> Botão 🗑️ ou tecla C</li>
                            <li><strong>Persistência:</strong> Anotações mantidas entre slides</li>
                        </ul>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">📊 Comparativo Automático</h4>
                        <p>O sistema calcula automaticamente o período anterior equivalente:</p>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;font-size:12px;">
                            <strong>Exemplo:</strong><br>
                            • Período selecionado: 01/12 a 15/12 (15 dias)<br>
                            • Período anterior: 16/11 a 30/11 (15 dias)<br>
                            • Mostra: "↑ 12.5% vs anterior"
                        </div>
                        
                        <h4 style="color:#8b5cf6;margin:1.5rem 0 1rem 0;">🎨 Animações</h4>
                        <p>Gráficos animam ao entrar:</p>
                        <ul style="font-size:12px;margin:0.5rem 0;padding-left:1rem;">
                            <li><strong>Duração:</strong> 800ms</li>
                            <li><strong>Easing:</strong> ease-out-cubic</li>
                            <li><strong>Efeito:</strong> Fade + scale progressivo</li>
                        </ul>
                    `
                },
                {
                    name: 'Preferências',
                    formula: 'Configurações do sistema',
                    where: 'Menu principal → Preferências (engrenagem)',
                    interpretation: 'Ajustes de API, aparência e comportamento do sistema.',
                    icon: '⚙️',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        As Preferências permitem <span style="color:#64748b;font-weight:bold">configurar o sistema</span> 
                        incluindo credenciais de API, aparência e comportamentos.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Configurar API</strong> - Freshdesk e Supabase<br>
                        • <strong>Ajustar tema</strong> - cores e aparência<br>
                        • <strong>Definir padrões</strong> - filtros iniciais<br>
                        • <strong>Gerenciar cache</strong> - limpar dados salvos<br><br>
                        
                        <strong>📊 Configurações disponíveis:</strong><br>
                        • <strong>Freshdesk:</strong> Domínio e API Key<br>
                        • <strong>Supabase:</strong> URL e chave anônima<br>
                        • <strong>Proxy:</strong> Porta do servidor local<br>
                        • <strong>Tema:</strong> Cores e modo escuro<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Armazenamento:</strong><br>
                        • <code>localStorage</code> - Configurações persistem no navegador<br><br>
                        
                        <strong>🔑 API Keys necessárias:</strong><br>
                        • <strong>Freshdesk:</strong> Perfil → API Key<br>
                        • <strong>Supabase:</strong> Projeto → Settings → API<br><br>
                        
                        <strong>⚠️ Segurança:</strong><br>
                        • Nunca compartilhe suas API Keys<br>
                        • Use variáveis de ambiente em produção<br>
                        • Keys são salvas localmente, não enviadas a servidores
                    `
                },
                {
                    name: 'Glossário',
                    formula: 'Documentação de métricas e cálculos',
                    where: 'Menu principal → Glossário (livro)',
                    interpretation: 'Esta aba! Explicações detalhadas de todas as métricas.',
                    icon: '📖',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        O Glossário é a <span style="color:#14b8a6;font-weight:bold">central de documentação</span> do sistema, 
                        explicando cada métrica, como é calculada e onde é usada.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Entender métricas</strong> - o que cada número significa<br>
                        • <strong>Ver fórmulas</strong> - como os cálculos são feitos<br>
                        • <strong>Localizar no código</strong> - onde cada dado é buscado<br>
                        • <strong>Interpretar resultados</strong> - o que é bom ou ruim<br><br>
                        
                        <strong>📊 Categorias:</strong><br>
                        • <strong>KPIs Principais:</strong> Total, Resolvidos, Abertos, Taxa<br>
                        • <strong>Métricas de SLA:</strong> 1ª Resposta, Resolução, Conformidade<br>
                        • <strong>Produtividade:</strong> Por pessoa, por time, rankings<br>
                        • <strong>Distribuições:</strong> Por status, tipo, prioridade<br>
                        • <strong>Campos do Ticket:</strong> Mapeamento de dados do Freshdesk<br>
                        • <strong>Conceito das Abas:</strong> Explicação de cada aba do sistema<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/glossary-module.js</code><br><br>
                        
                        <strong>🔍 Funcionalidades:</strong><br>
                        • <strong>Busca:</strong> Filtrar por termo<br>
                        • <strong>Navegação:</strong> Ir para categoria<br>
                        • <strong>Expandir detalhes:</strong> Ver código e fórmulas<br>
                        • <strong>Explicação avançada:</strong> Exemplos e tabelas
                    `
                },
                {
                    name: 'Insights com IA',
                    formula: 'Análise inteligente usando modelos de IA no browser',
                    where: 'Menu principal → Insights',
                    interpretation: 'Insights automáticos com análise de sentimento e categorização.',
                    icon: '💡',
                    details: `
                        <strong>💡 O que é esta aba:</strong><br>
                        A aba Insights usa <span style="color:#10b981;font-weight:bold">Inteligência Artificial</span> 
                        (Transformers.js) rodando diretamente no browser para analisar tickets e gerar insights automáticos.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Análise de Sentimento:</strong> Detectar tom negativo/positivo nos tickets<br>
                        • <strong>Categorização Inteligente:</strong> Classificar tickets automaticamente<br>
                        • <strong>Similaridade Semântica:</strong> Encontrar tickets relacionados<br>
                        • <strong>Tendências:</strong> Identificar padrões e alertas<br><br>
                        
                        <strong>🤖 Análise Básica (sem IA):</strong><br>
                        • Resumo geral (total, taxa resolução, tempo médio)<br>
                        • Tendências (volume semanal, alertas)<br>
                        • Problemas frequentes (categorias, palavras-chave)<br>
                        • Performance por time<br>
                        • Padrões detectados (dia/hora pico)<br><br>
                        
                        <strong>🧠 Análise com IA (Transformers.js):</strong><br>
                        • Análise de Sentimento usando DistilBERT<br>
                        • Embeddings para similaridade usando MiniLM<br>
                        • Recomendações em linguagem natural<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/insights-module.js</code> - Módulo principal<br>
                        • <code>js/ai-transformers.js</code> - Integração com IA<br><br>
                        
                        <strong>⚙️ Características:</strong><br>
                        • 100% grátis (roda no browser)<br>
                        • Sem API key necessária<br>
                        • Funciona offline após primeiro carregamento<br>
                        • Fallback para análise básica se IA falhar
                    `
                }
            ]
        },
        
        integrations: {
            title: '🔗 Integrações e APIs',
            description: 'Conexões com serviços externos: Freshdesk, Supabase, GitHub',
            items: [
                {
                    name: 'Supabase',
                    formula: 'Banco de dados PostgreSQL na nuvem',
                    where: 'Fonte de dados principal para BIs em tempo real',
                    interpretation: 'Armazena tickets sincronizados do Freshdesk para consultas rápidas.',
                    icon: '🗄️',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        <span style="color:#3b82f6;font-weight:bold">Supabase</span> é um banco de dados PostgreSQL na nuvem 
                        usado para armazenar tickets sincronizados do Freshdesk.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Consultas rápidas:</strong> Muito mais rápido que API Freshdesk<br>
                        • <strong>Histórico:</strong> Armazena todo histórico de tickets<br>
                        • <strong>Análises complexas:</strong> Permite SQL avançado<br>
                        • <strong>Real-time:</strong> Suporta atualizações em tempo real<br><br>
                        
                        <strong>📊 Tabelas principais:</strong><br>
                        • <code>Tickets</code> - Todos os tickets e campos customizados<br>
                        • <code>TicketSurveys</code> - Avaliações de satisfação<br>
                        • <code>TimeEntries</code> - Tempo registrado por agente<br>
                        • <code>Conversations</code> - Conversas dos tickets<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>🔑 Configuração:</strong><br>
                        • URL: <code>https://mzjdmhgkrroajmsfwryu.supabase.co</code><br>
                        • Chave: Configurada nas Preferências<br><br>
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>js/supabase-loader.js</code> - Inicialização<br>
                        • <code>js/bi-charts-supabase.js</code> - Queries de dados
                    `
                },
                {
                    name: 'Freshdesk API',
                    formula: 'API REST do sistema de tickets',
                    where: 'Fonte primária de dados via proxy local',
                    interpretation: 'Conexão direta com o Freshdesk para dados em tempo real.',
                    icon: '🎫',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        A <span style="color:#ef4444;font-weight:bold">API do Freshdesk</span> é a interface para acessar 
                        tickets, agentes, grupos e outras informações diretamente do sistema.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Dados em tempo real:</strong> Sempre atualizados<br>
                        • <strong>Sincronização:</strong> Alimentar o Supabase<br>
                        • <strong>Operações:</strong> Criar, atualizar tickets (futuro)<br><br>
                        
                        <strong>🔗 Endpoints usados:</strong><br>
                        • <code>/api/v2/tickets</code> - Lista de tickets<br>
                        • <code>/api/v2/tickets/{id}</code> - Detalhes do ticket<br>
                        • <code>/api/v2/tickets/{id}/conversations</code> - Conversas<br>
                        • <code>/api/v2/tickets/{id}/time_entries</code> - Tempo<br>
                        • <code>/api/v2/surveys/satisfaction_ratings</code> - CSAT<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>🔑 Configuração:</strong><br>
                        • Domínio: <code>suportetryvia.freshdesk.com</code><br>
                        • API Key: Configurada nas Preferências<br><br>
                        
                        <strong>⚠️ Requisitos:</strong><br>
                        • <strong>Proxy local obrigatório</strong> - API não permite CORS<br>
                        • Porta: 3003 (fallback: 3002, 3001)<br>
                        • Comando: <code>npm start</code> na pasta raiz
                    `
                },
                {
                    name: 'GitHub Actions',
                    formula: 'Automação de sincronização na nuvem',
                    where: '.github/workflows/sync-freshdesk.yml',
                    interpretation: 'Sincronização automática diária sem servidor local.',
                    icon: '⚡',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        <span style="color:#8b5cf6;font-weight:bold">GitHub Actions</span> executa a sincronização 
                        automaticamente na nuvem, sem precisar de servidor local.<br><br>
                        
                        <strong>🎯 Para que serve:</strong><br>
                        • <strong>Sincronização automática:</strong> Roda 2x ao dia (6h e 18h)<br>
                        • <strong>Sem servidor:</strong> Não precisa deixar máquina ligada<br>
                        • <strong>Gratuito:</strong> 2000 minutos/mês no plano free<br>
                        • <strong>Logs:</strong> Histórico de execuções no GitHub<br><br>
                        
                        <strong>📅 Schedule:</strong><br>
                        • <code>0 6 * * *</code> - Todos os dias às 6h (UTC-3: 3h)<br>
                        • <code>0 18 * * *</code> - Todos os dias às 18h (UTC-3: 15h)<br>
                        • Executar manualmente: workflow_dispatch<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>📂 Arquivos relacionados:</strong><br>
                        • <code>.github/workflows/sync-freshdesk.yml</code> - Workflow<br>
                        • <code>sync-freshdesk/sync-tickets-v2.js</code> - Script de sync<br>
                        • <code>sync-freshdesk/sync-conversations.js</code> - Sync conversas<br><br>
                        
                        <strong>🔑 Secrets necessários no GitHub:</strong><br>
                        • <code>FRESHDESK_DOMAIN</code><br>
                        • <code>FRESHDESK_API_KEY</code><br>
                        • <code>SUPABASE_URL</code><br>
                        • <code>SUPABASE_SERVICE_KEY</code>
                    `,
                    extraDetails: `
                        <h4 style="color:#8b5cf6;margin:0 0 1rem 0;">⚙️ Configurando GitHub Actions</h4>
                        
                        <p><strong>Passo 1:</strong> Criar Secrets no repositório</p>
                        <ol style="font-size:12px;margin:0.5rem 0;padding-left:1.5rem;">
                            <li>Ir em Settings → Secrets → Actions</li>
                            <li>Clicar "New repository secret"</li>
                            <li>Adicionar cada variável</li>
                        </ol>
                        
                        <p><strong>Passo 2:</strong> Verificar workflow</p>
                        <div style="background:#1e1e2e;padding:1rem;border-radius:6px;margin:1rem 0;font-size:11px;font-family:monospace;">
                        name: Sync Freshdesk to Supabase<br>
                        on:<br>
                        &nbsp;&nbsp;schedule:<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;- cron: '0 6 * * *'<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;- cron: '0 18 * * *'<br>
                        &nbsp;&nbsp;workflow_dispatch:
                        </div>
                        
                        <p><strong>Passo 3:</strong> Monitorar execuções</p>
                        <ul style="font-size:12px;margin:0.5rem 0;padding-left:1rem;">
                            <li>Aba "Actions" no GitHub</li>
                            <li>Ver logs de cada execução</li>
                            <li>Configurar notificações de falha</li>
                        </ul>
                    `
                }
            ]
        },
        
        sync: {
            title: '🔄 Sincronização',
            description: 'Scripts e processos de sincronização de dados',
            items: [
                {
                    name: 'sync-tickets-v2.js',
                    formula: 'Script Node.js para sincronizar tickets',
                    where: 'sync-freshdesk/sync-tickets-v2.js',
                    interpretation: 'Busca tickets do Freshdesk e insere/atualiza no Supabase.',
                    icon: '📥',
                    details: `
                        <strong>💡 O que faz:</strong><br>
                        Script que <span style="color:#10b981;font-weight:bold">sincroniza tickets</span> do Freshdesk para o Supabase,
                        buscando páginas de 100 tickets e fazendo upsert no banco.<br><br>
                        
                        <strong>🎯 Funcionalidades:</strong><br>
                        • <strong>Busca paginada:</strong> 100 tickets por página<br>
                        • <strong>Upsert:</strong> Insere novos ou atualiza existentes<br>
                        • <strong>Campos customizados:</strong> Processa cf_tratativa, cf_grupo, etc<br>
                        • <strong>Retry automático:</strong> Tenta novamente em caso de erro<br>
                        • <strong>Rate limiting:</strong> Respeita limites da API<br><br>
                        
                        <strong>📊 Campos sincronizados:</strong><br>
                        • Dados básicos: id, subject, status, priority, type<br>
                        • Datas: created_at, updated_at, due_by, fr_due_by<br>
                        • Stats: first_responded_at, resolved_at, closed_at<br>
                        • Customizados: cf_tratativa, cf_grupo_tratativa, tags<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>⚙️ Como executar:</strong><br>
                        <code>node sync-freshdesk/sync-tickets-v2.js</code><br><br>
                        
                        <strong>📂 Variáveis de ambiente:</strong><br>
                        • <code>FRESHDESK_DOMAIN</code><br>
                        • <code>FRESHDESK_API_KEY</code><br>
                        • <code>SUPABASE_URL</code><br>
                        • <code>SUPABASE_SERVICE_KEY</code>
                    `
                },
                {
                    name: 'sync-conversations.js',
                    formula: 'Script para sincronizar conversas dos tickets',
                    where: 'sync-freshdesk/sync-conversations.js',
                    interpretation: 'Busca e armazena todas as conversas/respostas dos tickets.',
                    icon: '💬',
                    details: `
                        <strong>💡 O que faz:</strong><br>
                        Script que <span style="color:#3b82f6;font-weight:bold">sincroniza conversas</span> (replies, notes) 
                        de cada ticket para análise de comunicação.<br><br>
                        
                        <strong>🎯 Funcionalidades:</strong><br>
                        • <strong>Busca por ticket:</strong> Itera sobre tickets do Supabase<br>
                        • <strong>Conversas:</strong> Replies públicos e notas privadas<br>
                        • <strong>Incremental:</strong> Só busca tickets novos/atualizados<br><br>
                        
                        <strong>📊 Campos sincronizados:</strong><br>
                        • id, ticket_id, body, body_text<br>
                        • from_email, to_emails, cc_emails<br>
                        • created_at, updated_at<br>
                        • incoming, private, source<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>⚙️ Como executar:</strong><br>
                        <code>node sync-freshdesk/sync-conversations.js</code>
                    `
                },
                {
                    name: 'Proxy Local',
                    formula: 'Servidor proxy para evitar CORS',
                    where: 'freshdesk-proxy.js',
                    interpretation: 'Intermediário necessário para acessar API Freshdesk do browser.',
                    icon: '🔀',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        <span style="color:#f59e0b;font-weight:bold">Servidor proxy</span> Node.js que 
                        contorna a limitação de CORS da API Freshdesk, permitindo chamadas do browser.<br><br>
                        
                        <strong>🎯 Por que é necessário:</strong><br>
                        • API Freshdesk não permite chamadas de browsers (CORS)<br>
                        • Proxy roda localmente e repassa requisições<br>
                        • Adiciona headers de autenticação<br><br>
                        
                        <strong>📊 Portas:</strong><br>
                        • Padrão: 3003<br>
                        • Fallback: 3002, 3001<br><br>
                        
                        <hr style="border-color:#3f3f5a;margin:1rem 0">
                        
                        <strong>⚙️ Como executar:</strong><br>
                        <code>npm install</code><br>
                        <code>npm start</code><br><br>
                        
                        <strong>📂 Arquivo:</strong><br>
                        • <code>freshdesk-proxy.js</code><br><br>
                        
                        <strong>⚠️ Importante:</strong><br>
                        O proxy deve estar rodando para a aba "Tickets" funcionar!
                    `
                }
            ]
        },
        
        statusPrioridade: {
            title: '🚦 Status e Prioridades',
            description: 'Códigos de status e níveis de prioridade dos tickets no Freshdesk',
            items: [
                {
                    name: 'Status 2 - Aberto',
                    formula: 'status === 2',
                    where: 'Filtros, KPIs, Tabela de tickets',
                    interpretation: 'Ticket novo aguardando primeira resposta ou ação.',
                    icon: '🔵',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        O ticket está <span style="color:#3b82f6;font-weight:bold">ABERTO</span> e aguardando atendimento.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Ticket acabou de ser criado<br>
                        • Aguardando primeira resposta do suporte<br>
                        • Voltou a ficar aberto após resposta do cliente<br><br>
                        
                        <strong>📊 Cor associada:</strong><br>
                        <span style="display:inline-block;width:20px;height:20px;background:#3b82f6;border-radius:4px;vertical-align:middle;"></span> Azul
                    `
                },
                {
                    name: 'Status 3 - Pendente',
                    formula: 'status === 3',
                    where: 'Filtros, KPIs, Tabela de tickets',
                    interpretation: 'Aguardando resposta ou ação do cliente.',
                    icon: '🟡',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        O ticket está <span style="color:#f59e0b;font-weight:bold">PENDENTE</span> de ação do cliente.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Aguardando resposta do cliente<br>
                        • Aguardando informação adicional<br>
                        • Cliente precisa fazer alguma ação<br><br>
                        
                        <strong>📊 Cor associada:</strong><br>
                        <span style="display:inline-block;width:20px;height:20px;background:#f59e0b;border-radius:4px;vertical-align:middle;"></span> Amarelo
                    `
                },
                {
                    name: 'Status 4 - Resolvido',
                    formula: 'status === 4',
                    where: 'Filtros, KPIs, Tabela de tickets',
                    interpretation: 'Problema foi solucionado, aguardando confirmação.',
                    icon: '🟢',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        O ticket foi <span style="color:#10b981;font-weight:bold">RESOLVIDO</span> pelo suporte.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Problema foi solucionado<br>
                        • Aguardando confirmação do cliente<br>
                        • Pode ser reaberto se cliente responder<br><br>
                        
                        <strong>📊 Cor associada:</strong><br>
                        <span style="display:inline-block;width:20px;height:20px;background:#10b981;border-radius:4px;vertical-align:middle;"></span> Verde
                    `
                },
                {
                    name: 'Status 5 - Fechado',
                    formula: 'status === 5',
                    where: 'Filtros, KPIs, Tabela de tickets',
                    interpretation: 'Ticket finalizado definitivamente.',
                    icon: '⚫',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        O ticket está <span style="color:#6b7280;font-weight:bold">FECHADO</span> definitivamente.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Ticket foi concluído e confirmado<br>
                        • Não pode mais ser reaberto (normalmente)<br>
                        • Entra nas estatísticas de finalizados<br><br>
                        
                        <strong>📊 Cor associada:</strong><br>
                        <span style="display:inline-block;width:20px;height:20px;background:#6b7280;border-radius:4px;vertical-align:middle;"></span> Cinza
                    `
                },
                {
                    name: 'Prioridade 1 - Baixa',
                    formula: 'priority === 1',
                    where: 'Filtros, Tabela de tickets, Ordenação',
                    interpretation: 'Ticket de baixa urgência, pode aguardar.',
                    icon: '🟢',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        Prioridade <span style="color:#10b981;font-weight:bold">BAIXA</span> - menor urgência.<br><br>
                        
                        <strong>🎯 Exemplos de uso:</strong><br>
                        • Dúvidas gerais<br>
                        • Solicitações de informação<br>
                        • Melhorias não urgentes<br><br>
                        
                        <strong>⏱️ SLA típico:</strong> Mais flexível
                    `
                },
                {
                    name: 'Prioridade 2 - Média',
                    formula: 'priority === 2',
                    where: 'Filtros, Tabela de tickets, Ordenação',
                    interpretation: 'Ticket padrão, atendimento normal.',
                    icon: '🔵',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        Prioridade <span style="color:#3b82f6;font-weight:bold">MÉDIA</span> - urgência padrão.<br><br>
                        
                        <strong>🎯 Exemplos de uso:</strong><br>
                        • Problemas que afetam o trabalho<br>
                        • Bugs não críticos<br>
                        • Maioria dos tickets<br><br>
                        
                        <strong>⏱️ SLA típico:</strong> Padrão
                    `
                },
                {
                    name: 'Prioridade 3 - Alta',
                    formula: 'priority === 3',
                    where: 'Filtros, Tabela de tickets, Ordenação',
                    interpretation: 'Ticket urgente, requer atenção rápida.',
                    icon: '🟠',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        Prioridade <span style="color:#f59e0b;font-weight:bold">ALTA</span> - urgente.<br><br>
                        
                        <strong>🎯 Exemplos de uso:</strong><br>
                        • Problemas que impedem o trabalho<br>
                        • Bugs que afetam vários usuários<br>
                        • Prazos apertados<br><br>
                        
                        <strong>⏱️ SLA típico:</strong> Reduzido
                    `
                },
                {
                    name: 'Prioridade 4 - Urgente',
                    formula: 'priority === 4',
                    where: 'Filtros, Tabela de tickets, Ordenação',
                    interpretation: 'CRÍTICO - atendimento imediato necessário.',
                    icon: '🔴',
                    details: `
                        <strong>💡 O que significa:</strong><br>
                        Prioridade <span style="color:#ef4444;font-weight:bold">URGENTE</span> - crítico!<br><br>
                        
                        <strong>🎯 Exemplos de uso:</strong><br>
                        • Sistema fora do ar<br>
                        • Perda de dados<br>
                        • Impacto financeiro direto<br>
                        • Muitos usuários afetados<br><br>
                        
                        <strong>⏱️ SLA típico:</strong> Imediato
                    `
                }
            ]
        },
        
        coresAlertas: {
            title: '🎨 Cores e Alertas',
            description: 'Significado das cores e indicadores visuais do sistema',
            items: [
                {
                    name: 'Verde - Excelente/OK',
                    formula: 'Valor >= 85% ou dentro do esperado',
                    where: 'KPIs, SLA, Gráficos, Badges',
                    interpretation: 'Métrica está boa, dentro ou acima da meta.',
                    icon: '🟢',
                    details: `
                        <strong>💡 Quando aparece:</strong><br>
                        A cor <span style="color:#10b981;font-weight:bold">VERDE</span> indica sucesso ou bom desempenho.<br><br>
                        
                        <strong>📊 Exemplos:</strong><br>
                        • SLA >= 85% - Meta atingida<br>
                        • CSAT >= 85% - Satisfação excelente<br>
                        • Ticket resolvido dentro do prazo<br>
                        • 1ª resposta no prazo<br><br>
                        
                        <strong>🎯 Ação necessária:</strong><br>
                        Nenhuma - continue o bom trabalho!
                    `
                },
                {
                    name: 'Amarelo - Atenção',
                    formula: 'Valor entre 70% e 84%',
                    where: 'KPIs, SLA, Gráficos, Badges',
                    interpretation: 'Métrica precisa de atenção, risco de cair.',
                    icon: '🟡',
                    details: `
                        <strong>💡 Quando aparece:</strong><br>
                        A cor <span style="color:#f59e0b;font-weight:bold">AMARELA</span> indica alerta ou atenção.<br><br>
                        
                        <strong>📊 Exemplos:</strong><br>
                        • SLA entre 70-84% - Precisa melhorar<br>
                        • CSAT entre 70-84% - Alguns clientes insatisfeitos<br>
                        • Ticket próximo do prazo<br>
                        • Pendente há muito tempo<br><br>
                        
                        <strong>🎯 Ação necessária:</strong><br>
                        Monitorar de perto e tomar ações preventivas.
                    `
                },
                {
                    name: 'Vermelho - Crítico',
                    formula: 'Valor < 70% ou fora do prazo',
                    where: 'KPIs, SLA, Gráficos, Badges',
                    interpretation: 'Métrica crítica, ação imediata necessária.',
                    icon: '🔴',
                    details: `
                        <strong>💡 Quando aparece:</strong><br>
                        A cor <span style="color:#ef4444;font-weight:bold">VERMELHA</span> indica problema crítico.<br><br>
                        
                        <strong>📊 Exemplos:</strong><br>
                        • SLA < 70% - Meta não atingida<br>
                        • CSAT < 70% - Muitos insatisfeitos<br>
                        • Ticket vencido (passou do prazo)<br>
                        • 1ª resposta atrasada<br><br>
                        
                        <strong>🎯 Ação necessária:</strong><br>
                        URGENTE - investigar causa e corrigir imediatamente!
                    `
                },
                {
                    name: 'Azul - Informativo',
                    formula: 'Contagem ou valor neutro',
                    where: 'Totais, contadores, informações',
                    interpretation: 'Informação neutra, apenas para conhecimento.',
                    icon: '🔵',
                    details: `
                        <strong>💡 Quando aparece:</strong><br>
                        A cor <span style="color:#3b82f6;font-weight:bold">AZUL</span> indica informação neutra.<br><br>
                        
                        <strong>📊 Exemplos:</strong><br>
                        • Total de tickets (contagem)<br>
                        • Tickets abertos (status)<br>
                        • Links e ações clicáveis<br><br>
                        
                        <strong>🎯 Ação necessária:</strong><br>
                        Apenas informativo - analise conforme necessário.
                    `
                },
                {
                    name: 'Cinza - Neutro/Sem dados',
                    formula: 'Sem valor ou não aplicável',
                    where: 'Campos vazios, dados indisponíveis',
                    interpretation: 'Dado não disponível ou não aplicável.',
                    icon: '⚪',
                    details: `
                        <strong>💡 Quando aparece:</strong><br>
                        A cor <span style="color:#6b7280;font-weight:bold">CINZA</span> indica ausência de dados.<br><br>
                        
                        <strong>📊 Exemplos:</strong><br>
                        • "--" em campos sem valor<br>
                        • SLA não configurado para o ticket<br>
                        • Campo opcional não preenchido<br><br>
                        
                        <strong>🎯 Ação necessária:</strong><br>
                        Verificar se o dado deveria existir ou se é esperado estar vazio.
                    `
                }
            ]
        },
        
        periodosDatas: {
            title: '📅 Períodos e Datas',
            description: 'Como os filtros de período afetam os dados exibidos',
            items: [
                {
                    name: 'Últimos 7 dias',
                    formula: 'created_at >= (hoje - 7 dias)',
                    where: 'Filtro de período em todas as abas',
                    interpretation: 'Visão da última semana de trabalho.',
                    icon: '📆',
                    details: `
                        <strong>💡 O que mostra:</strong><br>
                        Tickets criados nos <span style="color:#3b82f6;font-weight:bold">últimos 7 dias</span>.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Acompanhamento diário/semanal<br>
                        • Verificar tickets recentes<br>
                        • Reuniões semanais de equipe<br><br>
                        
                        <strong>⚠️ Importante:</strong><br>
                        Tickets criados antes de 7 dias não aparecem, mesmo que ainda estejam abertos.
                    `
                },
                {
                    name: 'Últimos 30 dias',
                    formula: 'created_at >= (hoje - 30 dias)',
                    where: 'Filtro de período em todas as abas',
                    interpretation: 'Visão mensal dos tickets.',
                    icon: '📆',
                    details: `
                        <strong>💡 O que mostra:</strong><br>
                        Tickets criados nos <span style="color:#3b82f6;font-weight:bold">últimos 30 dias</span>.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Relatórios mensais<br>
                        • Análise de tendências<br>
                        • Comparação com mês anterior<br><br>
                        
                        <strong>📊 Dica:</strong><br>
                        Este é o período mais usado para análises gerais.
                    `
                },
                {
                    name: 'Últimos 90 dias',
                    formula: 'created_at >= (hoje - 90 dias)',
                    where: 'Filtro de período em todas as abas',
                    interpretation: 'Visão trimestral dos tickets.',
                    icon: '📆',
                    details: `
                        <strong>💡 O que mostra:</strong><br>
                        Tickets criados nos <span style="color:#3b82f6;font-weight:bold">últimos 3 meses</span>.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Relatórios trimestrais<br>
                        • Análise de sazonalidade<br>
                        • Identificar padrões de longo prazo
                    `
                },
                {
                    name: 'Todo o período',
                    formula: 'Sem filtro de data',
                    where: 'Filtro de período em todas as abas',
                    interpretation: 'Todos os tickets disponíveis no sistema.',
                    icon: '📆',
                    details: `
                        <strong>💡 O que mostra:</strong><br>
                        <span style="color:#8b5cf6;font-weight:bold">TODOS</span> os tickets sincronizados.<br><br>
                        
                        <strong>🎯 Quando usar:</strong><br>
                        • Análise histórica completa<br>
                        • Buscar ticket específico antigo<br>
                        • Relatórios anuais<br><br>
                        
                        <strong>⚠️ Atenção:</strong><br>
                        Pode ser mais lento com muitos dados.
                    `
                },
                {
                    name: 'Data de Criação vs Data de Atualização',
                    formula: 'created_at vs updated_at',
                    where: 'Filtros e ordenação',
                    interpretation: 'Diferença entre quando foi criado e quando foi modificado.',
                    icon: '🔄',
                    details: `
                        <strong>💡 Diferença:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;border:1px solid #555;">Campo</th>
                                <th style="padding:8px;border:1px solid #555;">Significado</th>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>created_at</strong></td>
                                <td style="border:1px solid #555;">Quando o ticket foi CRIADO (nunca muda)</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>updated_at</strong></td>
                                <td style="border:1px solid #555;">Última vez que foi MODIFICADO (muda a cada ação)</td>
                            </tr>
                        </table><br>
                        
                        <strong>📊 Exemplo:</strong><br>
                        Ticket criado em 01/12 (created_at), última resposta em 15/12 (updated_at).
                    `
                }
            ]
        },
        
        faqProblemas: {
            title: '❓ FAQ e Problemas Comuns',
            description: 'Perguntas frequentes e soluções para erros comuns',
            items: [
                {
                    name: 'Erro CORS - Bloqueio de requisição',
                    formula: 'Access-Control-Allow-Origin blocked',
                    where: 'Console do navegador, Aba Tickets',
                    interpretation: 'Navegador bloqueou requisição por segurança.',
                    icon: '🚫',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        O navegador <span style="color:#ef4444;font-weight:bold">bloqueou</span> a requisição para a API do Freshdesk por segurança (CORS).<br><br>
                        
                        <strong>🛠️ Soluções:</strong><br>
                        
                        <strong>1. Usar Proxy Local (Recomendado):</strong><br>
                        <code style="background:#3f3f5a;padding:4px 8px;border-radius:4px;display:block;margin:8px 0;">
                        cd pasta-do-projeto<br>
                        npm install<br>
                        npm start
                        </code><br>
                        
                        <strong>2. Extensão Chrome (Temporário):</strong><br>
                        Instalar "Allow CORS" extension<br><br>
                        
                        <strong>⚠️ Importante:</strong><br>
                        Este erro NÃO afeta dados do Supabase, apenas requisições diretas ao Freshdesk.
                    `
                },
                {
                    name: 'Dados mostrando "--" ou zerados',
                    formula: 'textContent === "--" || value === 0',
                    where: 'KPIs, Cards, Tabelas',
                    interpretation: 'Dado não foi carregado ou não existe.',
                    icon: '⚪',
                    details: `
                        <strong>💡 Possíveis causas:</strong><br><br>
                        
                        <strong>1. Dados ainda carregando:</strong><br>
                        • Aguarde alguns segundos<br>
                        • Verifique barra de progresso<br><br>
                        
                        <strong>2. Filtro muito restritivo:</strong><br>
                        • Mude para "Todo período"<br>
                        • Remova filtros de status/prioridade<br><br>
                        
                        <strong>3. Sincronização não executada:</strong><br>
                        • Verifique se sync-tickets.js foi executado<br>
                        • Execute: <code>node sync-tickets.js</code><br><br>
                        
                        <strong>4. Campo não existe no Freshdesk:</strong><br>
                        • Alguns campos customizados podem não estar configurados
                    `
                },
                {
                    name: 'Timeout - Requisição demorou demais',
                    formula: 'Error: statement timeout (57014)',
                    where: 'Console, Carregamento de dados',
                    interpretation: 'Consulta ao banco demorou mais que o limite.',
                    icon: '⏱️',
                    details: `
                        <strong>💡 O que aconteceu:</strong><br>
                        A consulta ao Supabase <span style="color:#f59e0b;font-weight:bold">demorou demais</span> e foi cancelada.<br><br>
                        
                        <strong>🛠️ Soluções:</strong><br>
                        
                        <strong>1. Reduzir período:</strong><br>
                        • Use "Últimos 30 dias" em vez de "Todo período"<br><br>
                        
                        <strong>2. Recarregar página:</strong><br>
                        • Ctrl+F5 para limpar cache<br><br>
                        
                        <strong>3. Aguardar e tentar novamente:</strong><br>
                        • Banco pode estar sobrecarregado temporariamente
                    `
                },
                {
                    name: 'SLA mostrando 0% mesmo com tickets',
                    formula: 'SLA = 0% com tickets existentes',
                    where: 'KPIs de SLA',
                    interpretation: 'Tickets não têm prazo de SLA configurado.',
                    icon: '📉',
                    details: `
                        <strong>💡 Possíveis causas:</strong><br><br>
                        
                        <strong>1. Tickets sem prazo (due_by/fr_due_by):</strong><br>
                        • O cálculo só considera tickets que TÊM prazo definido<br>
                        • Tickets sem SLA configurado não entram na conta<br><br>
                        
                        <strong>2. Fórmula do SLA:</strong><br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;">
                        SLA % = (tickets com prazo cumprido) ÷ (tickets com prazo) × 100
                        </code><br>
                        
                        <strong>3. Verificar no Freshdesk:</strong><br>
                        • Confirme que as políticas de SLA estão configuradas
                    `
                },
                {
                    name: 'Números diferentes entre abas',
                    formula: 'Aba Tickets ≠ Aba Dashboard',
                    where: 'Comparação entre abas',
                    interpretation: 'Cada aba pode ter filtros e fontes diferentes.',
                    icon: '🔢',
                    details: `
                        <strong>💡 Por que isso acontece:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;border:1px solid #555;">Aba</th>
                                <th style="padding:8px;border:1px solid #555;">Fonte de dados</th>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;">Dashboard</td>
                                <td style="border:1px solid #555;">Supabase (dados sincronizados)</td>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;">Tickets</td>
                                <td style="border:1px solid #555;">Supabase ou API Freshdesk</td>
                            </tr>
                            <tr>
                                <td style="padding:6px;border:1px solid #555;">BI Analytics</td>
                                <td style="border:1px solid #555;">Supabase com cálculos próprios</td>
                            </tr>
                        </table><br>
                        
                        <strong>🛠️ Para igualar:</strong><br>
                        • Use o mesmo filtro de período em todas as abas<br>
                        • Execute sincronização para atualizar dados
                    `
                },
                {
                    name: 'Como atualizar os dados?',
                    formula: 'Sync / Refresh',
                    where: 'Geral',
                    interpretation: 'Métodos para atualizar os dados do sistema.',
                    icon: '🔄',
                    details: `
                        <strong>💡 Opções de atualização:</strong><br><br>
                        
                        <strong>1. Recarregar página (rápido):</strong><br>
                        • F5 ou Ctrl+R - recarrega dados do Supabase<br><br>
                        
                        <strong>2. Hard refresh (limpa cache):</strong><br>
                        • Ctrl+F5 - força recarregamento completo<br><br>
                        
                        <strong>3. Sincronizar Freshdesk → Supabase:</strong><br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;">
                        node sync-tickets.js
                        </code>
                        Ou executar via GitHub Actions<br><br>
                        
                        <strong>⏱️ Sincronização automática:</strong><br>
                        GitHub Actions roda a cada 3 horas automaticamente.
                    `
                }
            ]
        },
        
        relatorios: {
            title: '📋 Relatórios',
            description: 'Como gerar e interpretar relatórios do sistema',
            items: [
                {
                    name: 'Relatório em PDF',
                    formula: 'Botão "Gerar Relatório" no BI Analytics',
                    where: 'Aba BI Analytics',
                    interpretation: 'Exporta análise completa em formato PDF.',
                    icon: '📄',
                    details: `
                        <strong>💡 O que inclui:</strong><br>
                        O relatório PDF contém:<br><br>
                        
                        • <strong>Resumo Executivo:</strong> KPIs principais<br>
                        • <strong>Gráfico de Timeline:</strong> Evolução mensal<br>
                        • <strong>Análise de SLA:</strong> Performance por prazo<br>
                        • <strong>Distribuições:</strong> Por tipo, status, prioridade<br>
                        • <strong>Rankings:</strong> Top agentes/times<br>
                        • <strong>Insights:</strong> Observações automáticas<br><br>
                        
                        <strong>🎯 Como gerar:</strong><br>
                        1. Vá para BI Analytics<br>
                        2. Aplique os filtros desejados<br>
                        3. Clique em "📊 Gerar Relatório"<br>
                        4. Aguarde o download do PDF
                    `
                },
                {
                    name: 'Exportar para Excel',
                    formula: 'Botão de exportação na tabela',
                    where: 'Aba Tickets, Tabelas de dados',
                    interpretation: 'Exporta dados em formato planilha.',
                    icon: '📊',
                    details: `
                        <strong>💡 O que exporta:</strong><br>
                        Dados da tabela atual em formato CSV/Excel.<br><br>
                        
                        <strong>🎯 Dicas:</strong><br>
                        • Aplique filtros ANTES de exportar<br>
                        • Verifique quais colunas estão visíveis<br>
                        • Dados exportados respeitam ordenação atual
                    `
                },
                {
                    name: 'Modo Apresentação',
                    formula: 'Botão "Apresentação" no BI Analytics',
                    where: 'Aba BI Analytics',
                    interpretation: 'Cria slides para apresentação de resultados.',
                    icon: '🎬',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        Modo de <span style="color:#8b5cf6;font-weight:bold">apresentação em slides</span> para reuniões.<br><br>
                        
                        <strong>🎯 Tipos de apresentação:</strong><br>
                        • 📊 Relatório Executivo (6 slides)<br>
                        • 🏆 Performance (8 slides)<br>
                        • ⏱️ Análise SLA (7 slides)<br>
                        • 📑 Completo (12+ slides)<br><br>
                        
                        <strong>⌨️ Controles:</strong><br>
                        • Setas: Navegar entre slides<br>
                        • ESC: Sair da apresentação<br>
                        • F: Tela cheia
                    `
                }
            ]
        },
        
        funcionalidadesExtras: {
            title: '🚀 Funcionalidades Extras',
            description: 'Recursos avançados: Busca Global, Gráficos Interativos e Gamificação',
            items: [
                {
                    name: 'Busca Global (Ctrl+K)',
                    formula: 'GlobalSearch.open() | Ctrl+K',
                    where: 'Botão na topbar ou atalho de teclado',
                    interpretation: 'Busca rápida por tickets em qualquer campo.',
                    icon: '🔍',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        Ferramenta de <span style="color:#3b82f6;font-weight:bold">busca instantânea</span> que permite encontrar tickets rapidamente.<br><br>
                        
                        <strong>⌨️ Como acessar:</strong><br>
                        • Clique no botão "🔍 Buscar" na barra superior<br>
                        • Ou pressione <kbd style="background:#3f3f5a;padding:2px 6px;border-radius:4px;">Ctrl+K</kbd><br><br>
                        
                        <strong>🎯 Sintaxes especiais:</strong><br>
                        <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
                            <tr style="background:#3f3f5a;"><th style="padding:6px;border:1px solid #555;">Sintaxe</th><th style="padding:6px;border:1px solid #555;">O que faz</th></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>#123</code></td><td style="border:1px solid #555;">Busca ticket por ID</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>@nome</code></td><td style="border:1px solid #555;">Busca por agente</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>!urgente</code></td><td style="border:1px solid #555;">Busca por prioridade</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>status:aberto</code></td><td style="border:1px solid #555;">Busca por status</td></tr>
                        </table><br>
                        
                        <strong>⌨️ Navegação:</strong><br>
                        • ↑↓ - Navegar resultados<br>
                        • Enter - Selecionar<br>
                        • ESC - Fechar
                    `
                },
                {
                    name: 'Gráficos Interativos',
                    formula: 'InteractiveCharts.onChartClick()',
                    where: 'Todos os gráficos do sistema',
                    interpretation: 'Clique em gráficos para filtrar e ver detalhes.',
                    icon: '📊',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        Sistema de <span style="color:#10b981;font-weight:bold">drill-down</span> que permite explorar dados clicando nos gráficos.<br><br>
                        
                        <strong>🎯 Como usar:</strong><br>
                        1. Passe o mouse sobre um gráfico (verá "👆 Clique para filtrar")<br>
                        2. Clique na barra/fatia desejada<br>
                        3. Um modal mostra os detalhes<br>
                        4. Clique "Aplicar como filtro" para filtrar dados<br><br>
                        
                        <strong>📋 O modal mostra:</strong><br>
                        • Total de tickets do segmento<br>
                        • Taxa de resolução<br>
                        • Tempo médio<br>
                        • Lista dos tickets<br><br>
                        
                        <strong>💾 Exportação:</strong><br>
                        Botão "📥 Exportar" gera CSV com os tickets filtrados.
                    `
                },
                {
                    name: 'Gamificação',
                    formula: 'Menu: 🎮 Gamificação',
                    where: 'Menu lateral ou Gamification.open()',
                    interpretation: 'Sistema de rankings, níveis e conquistas.',
                    icon: '🎮',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        Sistema de <span style="color:#fbbf24;font-weight:bold">gamificação</span> para motivar e reconhecer desempenho.<br><br>
                        
                        <strong>🏆 Abas disponíveis:</strong><br>
                        • <strong>Ranking:</strong> Top performers com pontuação<br>
                        • <strong>Conquistas:</strong> 22 badges para desbloquear<br>
                        • <strong>Níveis:</strong> 10 níveis de progressão<br><br>
                        
                        <strong>📊 Como é calculada a pontuação:</strong><br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;font-size:11px;">
                        Pontos = (Tickets × 10) + (SLA% × Tickets × 5) + (Urgentes × 5) + (Streak × 2)
                        </code><br>
                        
                        Ver detalhes completos na categoria "Gamificação" abaixo.
                    `
                }
            ]
        },
        
        gamificacao: {
            title: '🎮 Gamificação - Regras Completas',
            description: 'Sistema completo de pontuação, níveis e conquistas',
            items: [
                {
                    name: 'Cálculo de Pontuação',
                    formula: 'score = (resolved × 10) + (slaBonus) + (urgentBonus) + (streakBonus)',
                    where: 'Ranking de Gamificação',
                    interpretation: 'Fórmula usada para calcular a pontuação total.',
                    icon: '🧮',
                    details: `
                        <strong>📊 Fórmula Detalhada:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:8px;border:1px solid #555;">Componente</th>
                                <th style="padding:8px;border:1px solid #555;">Fórmula</th>
                                <th style="padding:8px;border:1px solid #555;">Exemplo</th>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>Base</strong></td>
                                <td style="border:1px solid #555;">Tickets Resolvidos × 10</td>
                                <td style="border:1px solid #555;">100 tickets = 1000 pts</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>Bônus SLA</strong></td>
                                <td style="border:1px solid #555;">(SLA% ÷ 100) × Resolvidos × 5</td>
                                <td style="border:1px solid #555;">90% SLA, 100 tkt = 450 pts</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>Bônus Urgentes</strong></td>
                                <td style="border:1px solid #555;">Urgentes Resolvidos × 5</td>
                                <td style="border:1px solid #555;">20 urgentes = 100 pts</td>
                            </tr>
                            <tr>
                                <td style="padding:8px;border:1px solid #555;"><strong>Bônus Streak</strong></td>
                                <td style="border:1px solid #555;">Dias Consecutivos × 2</td>
                                <td style="border:1px solid #555;">30 dias = 60 pts</td>
                            </tr>
                        </table><br>
                        
                        <strong>📝 Exemplo Completo:</strong><br>
                        João tem: 100 resolvidos, 90% SLA, 20 urgentes, 15 dias streak<br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;">
                        (100 × 10) + (0.9 × 100 × 5) + (20 × 5) + (15 × 2)<br>
                        = 1000 + 450 + 100 + 30<br>
                        = <strong style="color:#fbbf24;">1580 pontos</strong>
                        </code>
                    `
                },
                {
                    name: 'Sistema de Níveis',
                    formula: 'Baseado em tickets resolvidos',
                    where: 'Aba "📊 Níveis" na Gamificação',
                    interpretation: 'Progressão de nível baseada no total de tickets.',
                    icon: '📈',
                    details: `
                        <strong>🎯 Níveis e Requisitos:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;border:1px solid #555;">Nível</th>
                                <th style="padding:6px;border:1px solid #555;">Nome</th>
                                <th style="padding:6px;border:1px solid #555;">Tickets</th>
                                <th style="padding:6px;border:1px solid #555;">Cor</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">1</td><td style="border:1px solid #555;">Novato</td><td style="border:1px solid #555;">0+</td><td style="border:1px solid #555;color:#6b7280;">Cinza</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">2</td><td style="border:1px solid #555;">Iniciante</td><td style="border:1px solid #555;">50+</td><td style="border:1px solid #555;color:#3b82f6;">Azul</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">3</td><td style="border:1px solid #555;">Aprendiz</td><td style="border:1px solid #555;">150+</td><td style="border:1px solid #555;color:#10b981;">Verde</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">4</td><td style="border:1px solid #555;">Competente</td><td style="border:1px solid #555;">300+</td><td style="border:1px solid #555;color:#8b5cf6;">Roxo</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">5</td><td style="border:1px solid #555;">Proficiente</td><td style="border:1px solid #555;">500+</td><td style="border:1px solid #555;color:#f59e0b;">Amarelo</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">6</td><td style="border:1px solid #555;">Especialista</td><td style="border:1px solid #555;">800+</td><td style="border:1px solid #555;color:#ef4444;">Vermelho</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">7</td><td style="border:1px solid #555;">Mestre</td><td style="border:1px solid #555;">1200+</td><td style="border:1px solid #555;color:#ec4899;">Rosa</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">8</td><td style="border:1px solid #555;">Grão-Mestre</td><td style="border:1px solid #555;">1800+</td><td style="border:1px solid #555;color:#14b8a6;">Teal</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">9</td><td style="border:1px solid #555;">Lenda</td><td style="border:1px solid #555;">2500+</td><td style="border:1px solid #555;color:#f97316;">Laranja</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">10</td><td style="border:1px solid #555;">Imortal</td><td style="border:1px solid #555;">5000+</td><td style="border:1px solid #555;color:#fbbf24;">Dourado</td></tr>
                        </table>
                    `
                },
                {
                    name: 'Conquistas de Volume',
                    formula: 'Baseado em quantidade de tickets',
                    where: 'Aba "🎖️ Conquistas" na Gamificação',
                    interpretation: 'Badges desbloqueados por volume de tickets.',
                    icon: '📋',
                    details: `
                        <strong>🎯 Badges de Volume:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;border:1px solid #555;">Badge</th>
                                <th style="padding:6px;border:1px solid #555;">Nome</th>
                                <th style="padding:6px;border:1px solid #555;">Requisito</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🎯</td><td style="border:1px solid #555;">Primeiro Passo</td><td style="border:1px solid #555;">Resolver 1 ticket</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🔥</td><td style="border:1px solid #555;">Esquentando</td><td style="border:1px solid #555;">Resolver 10 tickets</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">⚡</td><td style="border:1px solid #555;">Produtivo</td><td style="border:1px solid #555;">Resolver 50 tickets</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">💯</td><td style="border:1px solid #555;">Centurião</td><td style="border:1px solid #555;">Resolver 100 tickets</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🏅</td><td style="border:1px solid #555;">Veterano</td><td style="border:1px solid #555;">Resolver 500 tickets</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">👑</td><td style="border:1px solid #555;">Lendário</td><td style="border:1px solid #555;">Resolver 1000 tickets</td></tr>
                        </table>
                    `
                },
                {
                    name: 'Conquistas de SLA',
                    formula: 'Baseado em conformidade SLA',
                    where: 'Aba "🎖️ Conquistas" na Gamificação',
                    interpretation: 'Badges por manter bom SLA.',
                    icon: '🛡️',
                    details: `
                        <strong>🎯 Badges de SLA:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;border:1px solid #555;">Badge</th>
                                <th style="padding:6px;border:1px solid #555;">Nome</th>
                                <th style="padding:6px;border:1px solid #555;">Requisito</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🛡️</td><td style="border:1px solid #555;">Guardião do SLA</td><td style="border:1px solid #555;">SLA >= 90%</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">💎</td><td style="border:1px solid #555;">Mestre do SLA</td><td style="border:1px solid #555;">SLA >= 98%</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🏆</td><td style="border:1px solid #555;">SLA Perfeito</td><td style="border:1px solid #555;">SLA = 100% (mín 10 tickets)</td></tr>
                        </table><br>
                        
                        <strong>📊 Como é calculado o SLA:</strong><br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;">
                        SLA% = (Tickets com 1ª resposta em até 4h ÷ Total com SLA) × 100
                        </code>
                    `
                },
                {
                    name: 'Conquistas de Velocidade',
                    formula: 'Baseado em tempo de resolução',
                    where: 'Aba "🎖️ Conquistas" na Gamificação',
                    interpretation: 'Badges por resolver rapidamente.',
                    icon: '🚀',
                    details: `
                        <strong>🎯 Badges de Velocidade:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;border:1px solid #555;">Badge</th>
                                <th style="padding:6px;border:1px solid #555;">Nome</th>
                                <th style="padding:6px;border:1px solid #555;">Requisito</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🚀</td><td style="border:1px solid #555;">Velocista</td><td style="border:1px solid #555;">Tempo médio resolução < 4h</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">⏱️</td><td style="border:1px solid #555;">Resposta Rápida</td><td style="border:1px solid #555;">Tempo médio 1ª resposta < 1h</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">✅</td><td style="border:1px solid #555;">Resolutor</td><td style="border:1px solid #555;">Taxa de resolução > 80%</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🎖️</td><td style="border:1px solid #555;">Fechador</td><td style="border:1px solid #555;">Taxa de resolução > 95%</td></tr>
                        </table>
                    `
                },
                {
                    name: 'Conquistas Especiais',
                    formula: 'Baseado em comportamentos específicos',
                    where: 'Aba "🎖️ Conquistas" na Gamificação',
                    interpretation: 'Badges por comportamentos diferenciados.',
                    icon: '⭐',
                    details: `
                        <strong>🎯 Badges Especiais:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;border:1px solid #555;">Badge</th>
                                <th style="padding:6px;border:1px solid #555;">Nome</th>
                                <th style="padding:6px;border:1px solid #555;">Requisito</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🧯</td><td style="border:1px solid #555;">Bombeiro</td><td style="border:1px solid #555;">20+ tickets urgentes resolvidos</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🦸</td><td style="border:1px solid #555;">Guerreiro de FDS</td><td style="border:1px solid #555;">5+ tickets no fim de semana</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🦉</td><td style="border:1px solid #555;">Coruja Noturna</td><td style="border:1px solid #555;">10+ tickets após 22h</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🐦</td><td style="border:1px solid #555;">Madrugador</td><td style="border:1px solid #555;">10+ tickets antes das 7h</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🔥</td><td style="border:1px solid #555;">Sequência de 7</td><td style="border:1px solid #555;">7 dias consecutivos resolvendo</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">💪</td><td style="border:1px solid #555;">Sequência de 30</td><td style="border:1px solid #555;">30 dias consecutivos resolvendo</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🎪</td><td style="border:1px solid #555;">Pau pra Toda Obra</td><td style="border:1px solid #555;">Resolveu 5+ tipos diferentes</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">🤝</td><td style="border:1px solid #555;">Jogador de Equipe</td><td style="border:1px solid #555;">Trabalhou com 3+ times</td></tr>
                        </table>
                    `
                }
            ]
        },
        
        chatbotIA: {
            title: '🤖 Chatbot IA Tryviano',
            description: 'Assistente inteligente com Agent Loop, RAG e memória de decisões',
            items: [
                {
                    name: 'Agent Loop',
                    formula: 'Intent → Plan → Execute → Verify → Memory Update',
                    where: 'Chatbot IA (botão flutuante no canto inferior direito)',
                    interpretation: 'Sistema autônomo que planeja e executa ações sem precisar de IA para tudo.',
                    icon: '🔄',
                    details: `
                        <strong>💡 O que é o Agent Loop:</strong><br>
                        O Agent Loop é o <span style="color:#3b82f6;font-weight:bold">motor de autonomia</span> do chatbot. 
                        Ele detecta a intenção, cria um plano, executa ferramentas e verifica a resposta.<br><br>
                        
                        <strong>🔄 Fluxo do Agent:</strong><br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;font-size:11px;">
                        1. Intent Detection → Classifica a pergunta (QUERY_PERSON, GET_RANKING, etc.)<br>
                        2. Entity Extraction → Extrai nomes, períodos, times<br>
                        3. Planner → Cria sequência de ferramentas a chamar<br>
                        4. Tool Execution → Executa cada ferramenta<br>
                        5. Response Formatter → Formata a resposta<br>
                        6. Memory Update → Salva contexto para próximas perguntas
                        </code><br>
                        
                        <strong>🤖 Badge Visual:</strong><br>
                        Respostas via Agent mostram o badge 🤖 ao lado da mensagem.
                    `
                },
                {
                    name: '12 Tools Disponíveis',
                    formula: 'Chatbot.tools.definitions',
                    where: 'Chatbot.toolExecutors',
                    interpretation: 'Ferramentas formais que o Agent pode chamar.',
                    icon: '🔧',
                    details: `
                        <strong>🔧 Ferramentas do Agent:</strong><br><br>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <tr style="background:#3f3f5a;">
                                <th style="padding:6px;border:1px solid #555;">Tool</th>
                                <th style="padding:6px;border:1px solid #555;">Descrição</th>
                            </tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>query_tickets</code></td><td style="border:1px solid #555;">Buscar tickets com filtros</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>get_person_stats</code></td><td style="border:1px solid #555;">Estatísticas de uma pessoa</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>get_team_stats</code></td><td style="border:1px solid #555;">Estatísticas de um time</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>get_sla</code></td><td style="border:1px solid #555;">Calcular SLA geral ou por pessoa</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>get_alerts</code></td><td style="border:1px solid #555;">Obter alertas e problemas</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>get_ranking</code></td><td style="border:1px solid #555;">Ranking de pessoas/times</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>predict_volume</code></td><td style="border:1px solid #555;">Previsão de volume futuro</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>compare_periods</code></td><td style="border:1px solid #555;">Comparar períodos</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>search_knowledge</code></td><td style="border:1px solid #555;">Buscar na base de conhecimento</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>save_decision</code></td><td style="border:1px solid #555;">Salvar nota/decisão</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>navigate_to</code></td><td style="border:1px solid #555;">Navegar entre views do BI</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>get_ticket_details</code></td><td style="border:1px solid #555;">Detalhes de um ticket</td></tr>
                        </table>
                    `
                },
                {
                    name: 'RAG (Retrieval Augmented Generation)',
                    formula: 'Chatbot.rag.enrichPrompt(query)',
                    where: 'Quando o Agent delega para IA (Gemini/Groq)',
                    interpretation: 'Busca documentos relevantes para enriquecer o prompt da IA.',
                    icon: '📚',
                    details: `
                        <strong>💡 O que é RAG:</strong><br>
                        RAG significa <span style="color:#8b5cf6;font-weight:bold">Retrieval Augmented Generation</span>.
                        Ele busca informações relevantes da base de conhecimento antes de perguntar à IA.<br><br>
                        
                        <strong>📚 O que é indexado:</strong><br>
                        • Soluções conhecidas do glossário<br>
                        • Métricas e suas explicações<br>
                        • Decisões salvas pelo usuário<br><br>
                        
                        <strong>🔍 Como funciona:</strong><br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;font-size:11px;">
                        1. Usuário pergunta "O que é SLA?"<br>
                        2. RAG busca documentos com "SLA" no índice<br>
                        3. Encontra definição no glossário<br>
                        4. Adiciona contexto ao prompt da IA<br>
                        5. IA responde com base no conhecimento real
                        </code>
                    `
                },
                {
                    name: 'Memória de Decisões',
                    formula: 'Chatbot.decisions.save(texto)',
                    where: 'Comando "Anotar: [texto]" no chatbot',
                    interpretation: 'Salva notas/decisões com tags automáticas para consulta futura.',
                    icon: '📝',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        Sistema para <span style="color:#f59e0b;font-weight:bold">salvar e buscar decisões</span> da equipe.<br><br>
                        
                        <strong>📝 Comandos:</strong><br>
                        <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
                            <tr style="background:#3f3f5a;"><th style="padding:6px;border:1px solid #555;">Comando</th><th style="padding:6px;border:1px solid #555;">Ação</th></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">"Anotar: [texto]"</td><td style="border:1px solid #555;">Salva nota com data/hora</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">"Ver notas"</td><td style="border:1px solid #555;">Lista últimas notas</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;">"Por que escalamos?"</td><td style="border:1px solid #555;">Busca notas sobre escalação</td></tr>
                        </table><br>
                        
                        <strong>🏷️ Tags automáticas:</strong><br>
                        O sistema detecta automaticamente tags como: escalação, priorização, SLA, cliente, urgente, resolução, atribuição, ticket.<br><br>
                        
                        <strong>💾 Armazenamento:</strong><br>
                        • localStorage (até 100 notas)<br>
                        • Supabase (opcional)
                    `
                },
                {
                    name: 'Evaluator (Anti-Alucinação)',
                    formula: 'Chatbot.evaluator.verify(response, intent, results)',
                    where: 'Após cada resposta do Agent',
                    interpretation: 'Verifica se a resposta é válida e não contém dados inventados.',
                    icon: '✅',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        Sistema que <span style="color:#10b981;font-weight:bold">verifica a qualidade</span> das respostas.<br><br>
                        
                        <strong>✅ Verificações:</strong><br>
                        • <strong>hasContent:</strong> Resposta tem conteúdo suficiente?<br>
                        • <strong>hasData:</strong> Tem dados reais (não apenas texto)?<br>
                        • <strong>isRelevant:</strong> Relevante à intenção do usuário?<br>
                        • <strong>noHallucination:</strong> Números existem nos dados reais?<br><br>
                        
                        <strong>📊 Score:</strong><br>
                        <code style="background:#3f3f5a;padding:8px;border-radius:4px;display:block;margin:8px 0;">
                        score = verificações_ok / total_verificações<br>
                        válido = score >= 0.5
                        </code>
                    `
                },
                {
                    name: 'Test Suite',
                    formula: 'Chatbot.testSuite.runAll()',
                    where: 'Console do navegador (DevTools)',
                    interpretation: 'Testes automáticos para validar o chatbot.',
                    icon: '🧪',
                    details: `
                        <strong>💡 O que é:</strong><br>
                        Suite de <span style="color:#ef4444;font-weight:bold">testes automáticos</span> para garantir que o chatbot funciona.<br><br>
                        
                        <strong>🧪 Comandos de teste (Console):</strong><br>
                        <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
                            <tr style="background:#3f3f5a;"><th style="padding:6px;border:1px solid #555;">Comando</th><th style="padding:6px;border:1px solid #555;">Descrição</th></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>Chatbot.testSuite.runAll()</code></td><td style="border:1px solid #555;">Executa todos os testes</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>Chatbot.testSuite.stressTest(50)</code></td><td style="border:1px solid #555;">Teste de carga</td></tr>
                            <tr><td style="padding:6px;border:1px solid #555;"><code>Chatbot.testSuite.benchmark()</code></td><td style="border:1px solid #555;">Benchmark de performance</td></tr>
                        </table><br>
                        
                        <strong>📊 O que testa:</strong><br>
                        • Intent Detection (classifica corretamente?)<br>
                        • Entity Extraction (extrai nomes/períodos?)<br>
                        • Planner (cria plano correto?)<br>
                        • Tools (executam sem erro?)
                    `
                }
            ]
        }
    },
    
    initialize() {
        const container = document.getElementById('glossaryContainer');
        if (!container) return;
        
        container.innerHTML = this.generateHTML();
        this.setupInteractions();
    },
    
    generateHTML() {
        const categories = Object.entries(this.glossaryData);
        
        return `
            <div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
                <!-- Header -->
                <div style="margin-bottom: 2rem;">
                    <h1 style="color: ${this.colors.text}; font-size: 2rem; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 12px;">
                        <span>📖</span> Glossário de Métricas e Cálculos
                    </h1>
                    <p style="color: ${this.colors.textMuted}; margin: 0; font-size: 1rem;">
                        Documentação completa de todas as métricas, fórmulas e onde são utilizadas no sistema
                    </p>
                </div>
                
                <!-- Search -->
                <div style="margin-bottom: 2rem;">
                    <input type="text" id="glossarySearch" placeholder="🔍 Buscar métrica..." 
                        style="width: 100%; max-width: 400px; padding: 12px 16px; border-radius: 8px; 
                               border: 1px solid ${this.colors.border}; background: ${this.colors.card}; 
                               color: ${this.colors.text}; font-size: 14px; outline: none;"
                        oninput="glossaryModule.filterItems(this.value)">
                </div>
                
                <!-- Categories Navigation -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 2rem;">
                    ${categories.map(([key, cat]) => `
                        <button onclick="glossaryModule.scrollToCategory('${key}')" 
                            style="padding: 8px 16px; border-radius: 20px; border: 1px solid ${this.colors.border}; 
                                   background: ${this.colors.card}; color: ${this.colors.text}; cursor: pointer;
                                   font-size: 13px; transition: all 0.2s;">
                            ${cat.title}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Categories Content -->
                <div id="glossaryContent">
                    ${categories.map(([key, category]) => this.generateCategoryHTML(key, category)).join('')}
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 3rem; padding: 1.5rem; background: ${this.colors.card}; border-radius: 12px; border-left: 4px solid ${this.colors.primary};">
                    <h3 style="color: ${this.colors.text}; margin: 0 0 0.5rem 0; font-size: 1rem;">💡 Dica</h3>
                    <p style="color: ${this.colors.textMuted}; margin: 0; font-size: 14px; line-height: 1.6;">
                        Se alguma métrica aparecer zerada ou sem dados, verifique se os campos necessários estão sendo 
                        retornados pela API do Freshdesk. Os campos mais importantes são: <code style="background: #3f3f5a; padding: 2px 6px; border-radius: 4px;">stats_resolved_at</code>, 
                        <code style="background: #3f3f5a; padding: 2px 6px; border-radius: 4px;">stats_first_responded_at</code> e 
                        <code style="background: #3f3f5a; padding: 2px 6px; border-radius: 4px;">cf_tratativa</code>.
                    </p>
                </div>
            </div>
        `;
    },
    
    generateCategoryHTML(key, category) {
        return `
            <div id="category-${key}" class="glossary-category" style="margin-bottom: 2rem;">
                <div style="background: ${this.colors.card}; border-radius: 12px; padding: 1.5rem; border: 1px solid ${this.colors.border};">
                    <h2 style="color: ${this.colors.text}; margin: 0 0 0.5rem 0; font-size: 1.25rem;">
                        ${category.title}
                    </h2>
                    <p style="color: ${this.colors.textMuted}; margin: 0 0 1.5rem 0; font-size: 14px;">
                        ${category.description}
                    </p>
                    
                    <div style="display: grid; gap: 1rem;">
                        ${category.items.map((item, i) => this.generateItemHTML(item, key, i)).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    generateItemHTML(item, categoryKey, index) {
        const hasDetails = item.details;
        const hasExtraDetails = item.extraDetails;
        
        return `
            <div class="glossary-item" data-search="${item.name.toLowerCase()} ${item.formula.toLowerCase()}"
                style="background: ${this.colors.bg}; border-radius: 8px; padding: 1rem; border: 1px solid ${this.colors.border}; transition: all 0.2s;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <span style="font-size: 1.5rem; flex-shrink: 0;">${item.icon}</span>
                    <div style="flex: 1; min-width: 0;">
                        <h3 style="color: ${this.colors.text}; margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600;">
                            ${item.name}
                        </h3>
                        
                        <div style="display: grid; gap: 8px; font-size: 13px;">
                            <div>
                                <span style="color: ${this.colors.primary}; font-weight: 500;">Fórmula:</span>
                                <span style="color: ${this.colors.text}; margin-left: 8px; font-family: monospace; background: #3f3f5a; padding: 2px 8px; border-radius: 4px;">
                                    ${item.formula}
                                </span>
                            </div>
                            
                            <div>
                                <span style="color: ${this.colors.success}; font-weight: 500;">Onde é usado:</span>
                                <span style="color: ${this.colors.textMuted}; margin-left: 8px;">${item.where}</span>
                            </div>
                            
                            <div>
                                <span style="color: ${this.colors.warning}; font-weight: 500;">Interpretação:</span>
                                <span style="color: ${this.colors.textMuted}; margin-left: 8px;">${item.interpretation}</span>
                            </div>
                            
                            ${hasDetails || hasExtraDetails ? `
                                <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${hasDetails ? `
                                        <button onclick="glossaryModule.toggleDetails('${categoryKey}-${index}')" 
                                            style="background: transparent; border: 1px solid ${this.colors.border}; color: ${this.colors.primary}; 
                                                   padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            ▶ Ver detalhes técnicos
                                        </button>
                                    ` : ''}
                                    ${hasExtraDetails ? `
                                        <button onclick="glossaryModule.toggleExtraDetails('${categoryKey}-${index}')" 
                                            style="background: ${this.colors.purple}20; border: 1px solid ${this.colors.purple}; color: ${this.colors.purple}; 
                                                   padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
                                            🎓 Explicação Avançada
                                        </button>
                                    ` : ''}
                                </div>
                                ${hasDetails ? `
                                    <div id="details-${categoryKey}-${index}" style="display: none; margin-top: 12px; padding: 12px; 
                                         background: ${this.colors.card}; border-radius: 6px; font-size: 13px; color: ${this.colors.textMuted}; line-height: 1.6;">
                                        ${item.details}
                                    </div>
                                ` : ''}
                                ${hasExtraDetails ? `
                                    <div id="extra-${categoryKey}-${index}" style="display: none; margin-top: 12px; padding: 16px; 
                                         background: linear-gradient(135deg, ${this.colors.purple}15, ${this.colors.primary}10); 
                                         border-radius: 8px; font-size: 13px; color: ${this.colors.text}; line-height: 1.7;
                                         border: 1px solid ${this.colors.purple}40;">
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid ${this.colors.border};">
                                            <span style="font-size: 1.25rem;">🎓</span>
                                            <span style="font-weight: 600; color: ${this.colors.purple};">Explicação Avançada</span>
                                        </div>
                                        ${item.extraDetails}
                                    </div>
                                ` : ''}
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupInteractions() {
        // Add hover effects
        document.querySelectorAll('.glossary-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = this.colors.primary;
                item.style.transform = 'translateX(4px)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.borderColor = this.colors.border;
                item.style.transform = 'translateX(0)';
            });
        });
    },
    
    filterItems(query) {
        const items = document.querySelectorAll('.glossary-item');
        const q = query.toLowerCase().trim();
        
        items.forEach(item => {
            const searchText = item.getAttribute('data-search') || '';
            const matches = !q || searchText.includes(q);
            item.style.display = matches ? 'block' : 'none';
        });
        
        // Show/hide categories based on visible items
        document.querySelectorAll('.glossary-category').forEach(cat => {
            const visibleItems = cat.querySelectorAll('.glossary-item[style*="display: block"], .glossary-item:not([style*="display: none"])');
            const hasVisible = Array.from(cat.querySelectorAll('.glossary-item')).some(i => i.style.display !== 'none');
            cat.style.display = hasVisible ? 'block' : 'none';
        });
    },
    
    scrollToCategory(key) {
        const el = document.getElementById(`category-${key}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    toggleDetails(id) {
        const details = document.getElementById(`details-${id}`);
        if (details) {
            const isHidden = details.style.display === 'none';
            details.style.display = isHidden ? 'block' : 'none';
            
            // Update button text
            const container = details.parentElement;
            const btn = container?.querySelector('button[onclick*="toggleDetails"]');
            if (btn) {
                btn.textContent = isHidden ? '▼ Ocultar detalhes técnicos' : '▶ Ver detalhes técnicos';
            }
        }
    },
    
    toggleExtraDetails(id) {
        const extra = document.getElementById(`extra-${id}`);
        if (extra) {
            const isHidden = extra.style.display === 'none';
            extra.style.display = isHidden ? 'block' : 'none';
            
            // Update button text
            const container = extra.parentElement;
            const btn = container?.querySelector('button[onclick*="toggleExtraDetails"]');
            if (btn) {
                btn.innerHTML = isHidden ? '🎓 Ocultar Explicação' : '🎓 Explicação Avançada';
            }
        }
    }
};

console.log('✅ Glossary Module carregado');
