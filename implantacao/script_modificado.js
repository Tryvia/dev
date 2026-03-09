// Função para agrupar status consecutivos iguais
function agruparStatusConsecutivos(statusArray) {
    if (!statusArray || statusArray.length === 0) return [];

    const grupos = [];
    let statusAtual = statusArray[0];
    let quantidade = 1;

    for (let i = 1; i < statusArray.length; i++) {
        if (statusArray[i] === statusAtual) {
            quantidade++;
        } else {
            grupos.push({ status: statusAtual, quantidade: quantidade });
            statusAtual = statusArray[i];
            quantidade = 1;
        }
    }

    // Adicionar o último grupo
    grupos.push({ status: statusAtual, quantidade: quantidade });

    return grupos;
}

// Função para verificar se o projeto tem Go Live concluído
function temGoLiveConcluido(implantacao) {
    if (!implantacao.fases) return false;

    const goLiveFase = implantacao.fases.find(fase =>
        fase.nome.toLowerCase().includes('go live') || fase.nome.toLowerCase().includes('golive')
    );

    return goLiveFase && (goLiveFase.status === 'concluido-prazo' || goLiveFase.status === 'concluido-fora');
}

// Função para verificar se o projeto tem Kick Off concluído
function temKickOffConcluido(implantacao) {
    if (!implantacao.fases) return false;

    const kickOffFase = implantacao.fases.find(fase =>
        fase.nome.toLowerCase().includes('kick off') || fase.nome.toLowerCase().includes('kickoff')
    );

    return kickOffFase && (kickOffFase.status === 'concluido-prazo' || kickOffFase.status === 'concluido-fora');
}

// Função para obter a data de Go Live
function getDataGoLive(implantacao) {
    if (!implantacao.fases) return null;

    const goLiveFase = implantacao.fases.find(fase =>
        fase.nome.toLowerCase().includes('go live') || fase.nome.toLowerCase().includes('golive')
    );

    if (goLiveFase && goLiveFase.fim && (goLiveFase.status === 'concluido-prazo' || goLiveFase.status === 'concluido-fora')) {
        return new Date(goLiveFase.fim);
    }

    return null;
}

// Função para obter a data de Kick Off
function getDataKickOff(implantacao) {
    if (!implantacao.fases) return null;

    const kickOffFase = implantacao.fases.find(fase =>
        fase.nome.toLowerCase().includes('kick off') || fase.nome.toLowerCase().includes('kickoff')
    );

    if (kickOffFase && kickOffFase.inicio) {
        return new Date(kickOffFase.inicio);
    }

    return null;
}

// Função para verificar se deve mostrar "sem dados" baseado no Go Live e Kick Off
function deveExibirSemDados(implantacao, ano, mes) {
    const dataGoLive = getDataGoLive(implantacao);
    const dataKickOff = getDataKickOff(implantacao);

    // Verificar Go Live (meses posteriores)
    if (dataGoLive) {
        const anoGoLive = dataGoLive.getFullYear();
        const mesGoLive = dataGoLive.getMonth();

        // Se o ano solicitado é posterior ao ano do Go Live, sempre "sem dados"
        if (ano > anoGoLive) return true;

        // Se é o mesmo ano do Go Live, verificar se o mês é posterior ao Go Live
        if (ano === anoGoLive && mes > mesGoLive) return true;
    }

    // Verificar Kick Off (meses anteriores)
    if (dataKickOff) {
        const anoKickOff = dataKickOff.getFullYear();
        const mesKickOff = dataKickOff.getMonth();

        // Se o ano solicitado é anterior ao ano do Kick Off, sempre "sem dados"
        if (ano < anoKickOff) return true;

        // Se é o mesmo ano do Kick Off, verificar se o mês é anterior ao Kick Off
        if (ano === anoKickOff && mes < mesKickOff) return true;
    }

    return false;
}

// Função para verificar se o projeto deve aparecer no ano selecionado
function projetoDeveAparecerNoAno(implantacao, ano) {
    const dataGoLive = getDataGoLive(implantacao);
    const dataKickOff = getDataKickOff(implantacao);

    // Se tem Go Live concluído, só mostrar até o ano do Go Live
    if (dataGoLive && ano > dataGoLive.getFullYear()) {
        return false;
    }

    // Se tem Kick Off definido, só mostrar a partir do ano do Kick Off
    if (dataKickOff && ano < dataKickOff.getFullYear()) {
        return false;
    }

    // Se não tem Kick Off nem Go Live definidos, usar lógica original
    if (!dataKickOff && !dataGoLive) {
        const anoInicio = implantacao.anoInicio || new Date().getFullYear();
        return (anoInicio <= ano && (implantacao.statusMeses[ano] || implantacao.statusMeses.janeiro)) ||
            implantacao.fases.some(fase => {
                if (fase.inicio && fase.fim) {
                    const dataInicio = new Date(fase.inicio);
                    const dataFim = new Date(fase.fim);
                    const anoFaseInicio = dataInicio.getFullYear();
                    const anoFaseFim = dataFim.getFullYear();
                    return (anoFaseInicio <= ano && anoFaseFim >= ano);
                }
                return false;
            });
    }

    return true;
}

// Variáveis globais
let implantacoes = [];
let implantacaoAtual = null;
let anoSelecionado = new Date().getFullYear(); // Ano atual por padrão
let modoVisualizacao = 'tabela'; // 'tabela' ou 'gantt'
const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Inicialização
document.addEventListener('DOMContentLoaded', async function () {
    // Verificar conexão com Supabase
    const conexaoOk = await SupabaseService.verificarConexao();
    if (!conexaoOk) {
        mostrarMensagem('Erro na conexão com o banco de dados. Usando dados locais.', 'erro');
        carregarDadosLocais(); // Fallback para dados locais
    } else {
        await carregarDadosSupabase();
    }

    inicializarFiltroAno();
    inicializarToggleVisualizacao();
    carregarPainelProjetos();
    renderDashboard();
    configurarEventListeners();
});

// Inicializar filtro por ano
function inicializarFiltroAno() {
    const filtroAno = document.getElementById('filtro-ano');
    const anoAtual = new Date().getFullYear();

    // Adicionar opções de anos (do ano atual até 3 anos atrás e 2 anos à frente)
    for (let ano = anoAtual - 3; ano <= anoAtual + 2; ano++) {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        if (ano === anoAtual) {
            option.selected = true;
        }
        filtroAno.appendChild(option);
    }

    // Event listener para mudança de ano
    filtroAno.addEventListener('change', function () {
        anoSelecionado = parseInt(this.value);
        document.getElementById('ano-selecionado').textContent = anoSelecionado;
        carregarPainelProjetos();
    });
}

// Carregar dados do Supabase
async function carregarDadosSupabase() {
    try {
        mostrarMensagem('Carregando dados...', 'info');
        const dados = await SupabaseService.carregarImplantacoes();

        // Converter dados do Supabase para o formato esperado
        implantacoes = dados.map(item => ({
            id: item.id,
            empresa: item.empresa,
            projeto: item.projeto,
            sistema: item.sistema,
            gestor: item.gestor,
            especialista: item.especialista,
            logo: item.logo_url,
            progresso: item.progresso,
            status: item.status,
            statusMeses: item.status_meses,
            fases: item.fases,
            resumoOperacional: item.resumo_operacional,
            anoInicio: new Date(item.created_at).getFullYear() // Adicionar ano de início baseado na data de criação
        }));

        console.log('Dados carregados do Supabase:', implantacoes);

        if (implantacoes.length === 0) {
            mostrarMensagem('Nenhuma implantação encontrada. Adicione a primeira!', 'info');
        }
    } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
        mostrarMensagem('Erro ao carregar dados. Usando dados locais.', 'erro');
        carregarDadosLocais(); // Fallback
    }
}

// Carregar dados locais (fallback)
function carregarDadosLocais() {
    const dadosSalvos = localStorage.getItem('implantacoes');
    if (dadosSalvos) {
        implantacoes = JSON.parse(dadosSalvos);
    } else {
        // Dados de exemplo se não houver dados salvos
        implantacoes = [
            {
                id: 1,
                empresa: "Costa Verde",
                projeto: "Implantação",
                sistema: "OPTZ",
                gestor: "João Silva",
                especialista: "Maria Santos",
                logo: null,
                progresso: 85,
                status: "Em andamento",
                statusMeses: {
                    janeiro: ["concluido-prazo", "concluido-prazo", "concluido-prazo", "concluido-prazo"],
                    fevereiro: ["concluido-prazo", "concluido-prazo", "concluido-prazo", "concluido-prazo"],
                    marco: ["concluido-prazo", "concluido-prazo", "concluido-prazo", "concluido-prazo"],
                    abril: ["concluido-fora", "concluido-fora", "andamento", "andamento"],
                    maio: ["pendente", "pendente", "pendente", "pendente"],
                    junho: ["pendente", "pendente", "pendente", "pendente"],
                    julho: ["pendente", "pendente", "pendente", "pendente"],
                    agosto: ["pendente", "pendente", "pendente", "pendente"],
                    setembro: ["pendente", "pendente", "pendente", "pendente"],
                    outubro: ["pendente", "pendente", "pendente", "pendente"],
                    novembro: ["pendente", "pendente", "pendente", "pendente"],
                    dezembro: ["pendente", "pendente", "pendente", "pendente"]
                },
                fases: [
                    { nome: "Kick Off", previsto: 1, realizado: 1, status: "concluido-prazo", inicio: "2024-03-01", fim: "2024-03-01" },
                    { nome: "Treinamento", previsto: 1, realizado: 1, status: "concluido-prazo", inicio: "2024-03-15", fim: "2024-03-20" },
                    { nome: "Cadastros", previsto: 6, realizado: 6, status: "concluido-prazo", inicio: "2024-04-01", fim: "2024-04-10" },
                    { nome: "Integrações", previsto: 2, realizado: 1, status: "andamento", inicio: "2024-04-15", fim: "2024-04-25" },
                    { nome: "Testes", previsto: 1, realizado: 0, status: "pendente", inicio: "2024-05-01", fim: "2024-05-05" },
                    { nome: "Validação", previsto: 1, realizado: 0, status: "pendente", inicio: "2024-05-10", fim: "2024-05-15" },
                    { nome: "Go Live", previsto: 1, realizado: 0, status: "pendente", inicio: "2024-05-20", fim: "2024-05-20" }
                ],
                resumoOperacional: [
                    "Cliente implantado desde 04/04.",
                    "Aguardando ok do cliente para ativar o E-Check."
                ]
            }
        ];
    }
}

// Configurar event listeners
{
    // Botão adicionar nova implantação
    document.getElementById('btn-adicionar').addEventListener('click', abrirModalAdicionar);

    // Botão voltar
    document.getElementById('btn-voltar').addEventListener('click', voltarPainelProjetos);

    // Botões de edição e exclusão
    document.getElementById('btn-editar-timeline').addEventListener('click', abrirModalEditarTimeline);
    document.getElementById('btn-excluir-implantacao').addEventListener('click', abrirModalConfirmarExclusao);

    // Modal adicionar implantação
    document.getElementById('modal-close').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
    document.getElementById('form-adicionar').addEventListener('submit', adicionarNovaImplantacao);

    // Modal editar timeline
    document.getElementById('modal-editar-close').addEventListener('click', fecharModalEditarTimeline);
    document.getElementById('btn-adicionar-fase').addEventListener('click', adicionarNovaFase);
    document.getElementById('btn-salvar-timeline').addEventListener('click', salvarAlteracoesTimeline);

    // Modal confirmar exclusão
    document.getElementById('modal-exclusao-close').addEventListener('click', fecharModalConfirmarExclusao);
    document.getElementById('btn-cancelar-exclusao').addEventListener('click', fecharModalConfirmarExclusao);
    document.getElementById('btn-confirmar-exclusao').addEventListener('click', excluirImplantacao);

    // Filtro de busca
    document.getElementById('filtro-busca').addEventListener('input', filtrarImplantacoes);

    // Fechar modal clicando fora
    document.getElementById('modal-adicionar').addEventListener('click', function (e) {
        if (e.target === this) {
            fecharModal();
        }
    });

    document.getElementById('modal-editar-timeline').addEventListener('click', function (e) {
        if (e.target === this) {
            fecharModalEditarTimeline();
        }
    });

    document.getElementById('modal-confirmar-exclusao').addEventListener('click', function (e) {
        if (e.target === this) {
            fecharModalConfirmarExclusao();
        }
    });
}

// Carregar painel de projetos
function carregarPainelProjetos() {
    if (modoVisualizacao === 'gantt') {
        renderizarGantt();
        // atualizar dashboard para o ano atual também
        renderDashboard();
        return;
    }

    const tbody = document.getElementById('tabela-body');
    tbody.innerHTML = '';

    // Filtrar implantações baseado no Go Live e Kick Off
    let implantacoesFiltradas = implantacoes.filter(implantacao => {
        return projetoDeveAparecerNoAno(implantacao, anoSelecionado);
    });

    implantacoesFiltradas.forEach(implantacao => {
        const row = criarLinhaImplantacao(implantacao);
        tbody.appendChild(row);
    });

    // Mostrar mensagem se não houver dados para o ano
    if (implantacoesFiltradas.length === 0 && implantacoes.length > 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="16" style="text-align: center; padding: 20px; color: #666;">
                Nenhuma implantação encontrada para o ano ${anoSelecionado}
            </td>
        `;
        tbody.appendChild(row);
    }
    // Atualizar dashboard após carregar a tabela
    renderDashboard();
}

// Criar linha da tabela para uma implantação
function criarLinhaImplantacao(implantacao) {
    const row = document.createElement('tr');
    row.dataset.id = implantacao.id;

    // Obter status dos meses para o ano selecionado
    const statusMesesAno = obterStatusMesesPorAno(implantacao, anoSelecionado);

    // Verificar se o projeto tem Go Live concluído
    const goLiveConcluido = temGoLiveConcluido(implantacao);
    const kickOffConcluido = temKickOffConcluido(implantacao);
    const dataGoLive = getDataGoLive(implantacao);
    const dataKickOff = getDataKickOff(implantacao);

    // Adicionar classe destacado se houver atraso
    const temAtraso = Object.values(statusMesesAno).some(semanas =>
        Array.isArray(semanas) && semanas.some(status => status === 'atrasado')
    );
    if (temAtraso) {
        row.classList.add('destacado');
    }

    // Se Go Live concluído, adicionar classe especial
    if (goLiveConcluido) {
        row.classList.add('projeto-finalizado');
        row.style.backgroundColor = '#f0f8f0';
        row.style.borderLeft = '4px solid #4CAF50';
    }

    // Se projeto não iniciou (sem Kick Off), adicionar classe especial
    if (dataKickOff && !kickOffConcluido) {
        row.classList.add('projeto-nao-iniciado');
        row.style.backgroundColor = '#f8f8f0';
        row.style.borderLeft = '4px solid #FF9800';
    }

    // Verificar se tem Kick Off e Go Live
    const temKickOff = implantacao.fases && implantacao.fases.some(fase =>
        fase.nome.toLowerCase().includes('kick off') || fase.nome.toLowerCase().includes('kickoff')
    );
    const temGoLive = implantacao.fases && implantacao.fases.some(fase =>
        fase.nome.toLowerCase().includes('go live') || fase.nome.toLowerCase().includes('golive')
    );

    // Obter status do Kick Off e Go Live
    const kickOffFase = implantacao.fases && implantacao.fases.find(fase =>
        fase.nome.toLowerCase().includes('kick off') || fase.nome.toLowerCase().includes('kickoff')
    );
    const goLiveFase = implantacao.fases && implantacao.fases.find(fase =>
        fase.nome.toLowerCase().includes('go live') || fase.nome.toLowerCase().includes('golive')
    );

    // Determinar o status do projeto
    let statusProjeto = implantacao.status;
    if (goLiveConcluido) {
        statusProjeto = "Finalizado";
    } else if (dataKickOff && !kickOffConcluido) {
        statusProjeto = "Não Iniciado";
    }

    // Células básicas
    row.innerHTML = `
        <td>${implantacao.empresa}</td>
        <td>${implantacao.projeto}</td>
        <td>${implantacao.sistema}</td>
        <td>${goLiveConcluido ? '100' : implantacao.progresso}%</td>
    `;

    // Células dos meses
    meses.forEach((mes, indexMes) => {
        const cell = document.createElement('td');

        // Verificar se deve mostrar "sem dados" para este mês
        if (deveExibirSemDados(implantacao, anoSelecionado, indexMes)) {
            const motivo = dataGoLive && anoSelecionado === dataGoLive.getFullYear() && indexMes > dataGoLive.getMonth()
                ? "Projeto finalizado - sem dados"
                : "Projeto não iniciado - sem dados";

            cell.innerHTML = '<div class="sem-dados" title="' + motivo + '">-</div>';
            cell.style.textAlign = 'center';
            cell.style.color = '#999';
            cell.style.fontStyle = 'italic';
        } else {
            const statusSemanas = statusMesesAno[mes] || ["pendente", "pendente", "pendente", "pendente"];

            // Agrupar status consecutivos iguais
            const gruposStatus = agruparStatusConsecutivos(statusSemanas);

            gruposStatus.forEach(grupo => {
                const statusBar = document.createElement('div');
                statusBar.className = `status-bar status-${grupo.status}`;
                statusBar.style.width = `${(grupo.quantidade / statusSemanas.length) * 100}%`;
                statusBar.title = `${nomesMeses[meses.indexOf(mes)]} ${anoSelecionado}: ${grupo.status.replace('-', ' ')} (${grupo.quantidade} semana${grupo.quantidade > 1 ? 's' : ''})`;
                cell.appendChild(statusBar);
            });

            // Adicionar ícones de Kick Off e Go Live se a fase ocorrer neste mês
            if (implantacao.fases) {
                implantacao.fases.forEach(fase => {
                    const faseNomeLower = fase.nome.toLowerCase();
                    const isKickOff = faseNomeLower.includes('kick off') || faseNomeLower.includes('kickoff');
                    const isGoLive = faseNomeLower.includes('go live') || faseNomeLower.includes('golive');

                    if ((isKickOff || isGoLive) && fase.inicio && fase.fim) {
                        const dataInicio = new Date(fase.inicio);
                        const dataFim = new Date(fase.fim);
                        const mesFaseInicio = dataInicio.getMonth();
                        const mesFaseFim = dataFim.getMonth();
                        const anoFaseInicio = dataInicio.getFullYear();
                        const anoFaseFim = dataFim.getFullYear();

                        // Verificar se a fase ocorre no mês e ano atual da iteração
                        if (anoFaseInicio <= anoSelecionado && anoFaseFim >= anoSelecionado &&
                            indexMes >= mesFaseInicio && indexMes <= mesFaseFim) {

                            const icone = document.createElement('span');
                            icone.className = `icone-fase ${isKickOff ? 'icone-inicio' : 'icone-golive'} ${fase.status === 'concluido-prazo' ? 'concluido' : fase.status === 'andamento' ? 'andamento' : 'pendente'}`;
                            icone.title = `${fase.nome}: ${fase.status.replace('-', ' ')}`;
                            icone.textContent = isKickOff ? '➣' : '🏴';

                            // Se é Go Live concluído, destacar com cor especial
                            if (isGoLive && (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora')) {
                                icone.style.color = '#4CAF50';
                                icone.style.fontSize = '16px';
                                icone.title += ' - PROJETO FINALIZADO';
                            }

                            // Se é Kick Off concluído, destacar
                            if (isKickOff && (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora')) {
                                icone.style.color = '#000000';
                                icone.style.fontSize = '16px';
                                icone.title += ' - PROJETO INICIADO';
                            }

                            cell.appendChild(icone);
                        }
                    }
                });
            }
        }

        row.appendChild(cell);
    });

    // Event listener para clique na linha
    row.addEventListener('click', () => exibirStatusImplantacao(implantacao));

    return row;
}

// Obter status dos meses para um ano específico
function obterStatusMesesPorAno(implantacao, ano) {
    // Verificar se deve mostrar "sem dados" para todo o ano
    const dataGoLive = getDataGoLive(implantacao);
    const dataKickOff = getDataKickOff(implantacao);

    // Se ano posterior ao Go Live, todos os meses são "sem dados"
    if (dataGoLive && ano > dataGoLive.getFullYear()) {
        const statusSemDados = {};
        meses.forEach(mes => {
            statusSemDados[mes] = ["sem-dados", "sem-dados", "sem-dados", "sem-dados"];
        });
        return statusSemDados;
    }

    // Se ano anterior ao Kick Off, todos os meses são "sem dados"
    if (dataKickOff && ano < dataKickOff.getFullYear()) {
        const statusSemDados = {};
        meses.forEach(mes => {
            statusSemDados[mes] = ["sem-dados", "sem-dados", "sem-dados", "sem-dados"];
        });
        return statusSemDados;
    }

    // Se existe dados específicos para o ano
    if (implantacao.statusMeses && implantacao.statusMeses[ano]) {
        const statusAno = implantacao.statusMeses[ano];

        // Aplicar limitações do Kick Off e Go Live no mesmo ano
        if ((dataKickOff && ano === dataKickOff.getFullYear()) || (dataGoLive && ano === dataGoLive.getFullYear())) {
            const mesKickOff = dataKickOff ? dataKickOff.getMonth() : -1;
            const mesGoLive = dataGoLive ? dataGoLive.getMonth() : 12;
            const statusLimitado = {};

            meses.forEach((mes, index) => {
                if (index < mesKickOff || index > mesGoLive) {
                    statusLimitado[mes] = ["sem-dados", "sem-dados", "sem-dados", "sem-dados"];
                } else {
                    statusLimitado[mes] = statusAno[mes] || ["pendente", "pendente", "pendente", "pendente"];
                }
            });

            return statusLimitado;
        }

        return statusAno;
    }

    // Se existe o formato antigo (sem separação por ano)
    if (implantacao.statusMeses && !implantacao.statusMeses[ano] && typeof implantacao.statusMeses.janeiro !== 'undefined') {
        // Assumir que os dados são do ano atual ou ano de início
        if (ano === new Date().getFullYear() || ano === implantacao.anoInicio) {
            const statusAntigo = implantacao.statusMeses;

            // Aplicar limitações do Kick Off e Go Live
            if ((dataKickOff && ano === dataKickOff.getFullYear()) || (dataGoLive && ano === dataGoLive.getFullYear())) {
                const mesKickOff = dataKickOff ? dataKickOff.getMonth() : -1;
                const mesGoLive = dataGoLive ? dataGoLive.getMonth() : 12;
                const statusLimitado = {};

                meses.forEach((mes, index) => {
                    if (index < mesKickOff || index > mesGoLive) {
                        statusLimitado[mes] = ["sem-dados", "sem-dados", "sem-dados", "sem-dados"];
                    } else {
                        statusLimitado[mes] = statusAntigo[mes] || ["pendente", "pendente", "pendente", "pendente"];
                    }
                });

                return statusLimitado;
            }

            return statusAntigo;
        }
    }

    // Gerar status baseado nas fases para o ano específico
    return gerarStatusMesesPorFases(implantacao, ano);
}

// Gerar status dos meses baseado nas fases
function gerarStatusMesesPorFases(implantacao, ano) {
    const statusMeses = {};

    // Inicializar todos os meses como pendente
    meses.forEach(mes => {
        statusMeses[mes] = ["pendente", "pendente", "pendente", "pendente"];
    });

    if (!implantacao.fases) return statusMeses;

    // Verificar limitações do Kick Off e Go Live
    const dataKickOff = getDataKickOff(implantacao);
    const dataGoLive = getDataGoLive(implantacao);

    let mesInicial = 0; // Janeiro por padrão
    let mesFinal = 11; // Dezembro por padrão

    // Limitar início baseado no Kick Off
    if (dataKickOff && ano === dataKickOff.getFullYear()) {
        mesInicial = dataKickOff.getMonth();
    } else if (dataKickOff && ano < dataKickOff.getFullYear()) {
        // Se o ano é anterior ao Kick Off, todos os meses são "sem dados"
        meses.forEach(mes => {
            statusMeses[mes] = ["sem-dados", "sem-dados", "sem-dados", "sem-dados"];
        });
        return statusMeses;
    }

    // Limitar fim baseado no Go Live
    if (dataGoLive && ano === dataGoLive.getFullYear()) {
        mesFinal = dataGoLive.getMonth();
    } else if (dataGoLive && ano > dataGoLive.getFullYear()) {
        // Se o ano é posterior ao Go Live, todos os meses são "sem dados"
        meses.forEach(mes => {
            statusMeses[mes] = ["sem-dados", "sem-dados", "sem-dados", "sem-dados"];
        });
        return statusMeses;
    }

    // Marcar meses fora do período como "sem dados"
    meses.forEach((mes, index) => {
        if (index < mesInicial || index > mesFinal) {
            statusMeses[mes] = ["sem-dados", "sem-dados", "sem-dados", "sem-dados"];
        }
    });

    // Aplicar status das fases aos meses válidos
    implantacao.fases.forEach(fase => {
        if (fase.inicio && fase.fim) {
            const dataInicio = new Date(fase.inicio);
            const dataFim = new Date(fase.fim);
            const anoInicio = dataInicio.getFullYear();
            const anoFim = dataFim.getFullYear();

            // Verificar se a fase ocorre no ano especificado
            if (anoInicio <= ano && anoFim >= ano) {
                const mesInicioFase = anoInicio === ano ? dataInicio.getMonth() : 0;
                const mesFimFase = anoFim === ano ? dataFim.getMonth() : 11;

                // Aplicar o status da fase aos meses correspondentes, respeitando os limites
                for (let mes = Math.max(mesInicioFase, mesInicial); mes <= Math.min(mesFimFase, mesFinal); mes++) {
                    const nomeMes = meses[mes];
                    statusMeses[nomeMes] = [fase.status, fase.status, fase.status, fase.status];
                }
            }
        }
    });

    return statusMeses;
}

// Exibir status de implantação
function exibirStatusImplantacao(implantacao) {
    implantacaoAtual = implantacao;

    // Verificar se o projeto está finalizado ou não iniciado
    const goLiveConcluido = temGoLiveConcluido(implantacao);
    const kickOffConcluido = temKickOffConcluido(implantacao);
    const dataKickOff = getDataKickOff(implantacao);

    document.getElementById('painel-projetos').classList.add('hidden');
    document.getElementById('status-implantacao').classList.remove('hidden');

    // Preencher dados da empresa
    const empresaDados = document.getElementById('empresa-dados');
    empresaDados.innerHTML = `
        <td>${implantacao.empresa}</td>
        <td>${implantacao.sistema}</td>
        <td>${implantacao.gestor}</td>
        <td>${implantacao.especialista}</td>
    `;

    // Configurar logo
    const logoImg = document.getElementById('logo-img');
    const logoText = document.getElementById('logo-text');

    if (implantacao.logo) {
        logoImg.src = implantacao.logo;
        logoImg.style.display = 'block';
        logoText.style.display = 'none';
    } else {
        logoImg.style.display = 'none';
        logoText.style.display = 'block';
        logoText.textContent = implantacao.empresa.substring(0, 3).toUpperCase();
    }

    // Atualizar progresso
    let progressoFinal = implantacao.progresso;
    if (goLiveConcluido) {
        progressoFinal = 100;
    } else if (dataKickOff && !kickOffConcluido) {
        progressoFinal = 0;
    }
    atualizarBarraProgresso(progressoFinal);

    // Carregar timeline detalhada
    carregarTimelineDetalhada(implantacao);

    // Preencher resumo e status
    preencherResumoStatus(implantacao);

    // Adicionar indicações visuais baseado no status
    const headerContent = document.querySelector('.header-content h1');

    // Remover badges anteriores
    const badgeAnterior = headerContent.querySelector('.projeto-status-badge');
    if (badgeAnterior) {
        badgeAnterior.remove();
    }

    if (goLiveConcluido) {
        const statusBadge = document.getElementById('status-badge');
        statusBadge.textContent = 'Finalizado';
        statusBadge.className = 'status-badge status-finalizado';
        statusBadge.style.backgroundColor = '#4CAF50';
        statusBadge.style.color = 'white';

        // Adicionar badge de projeto finalizado
        const badge = document.createElement('span');
        badge.className = 'projeto-status-badge';
        badge.textContent = '✅ FINALIZADO';
        badge.style.cssText = `
            background: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
            font-weight: bold;
        `;
        headerContent.appendChild(badge);
    } else if (dataKickOff && !kickOffConcluido) {
        const statusBadge = document.getElementById('status-badge');
        statusBadge.textContent = 'Não Iniciado';
        statusBadge.className = 'status-badge status-nao-iniciado';
        statusBadge.style.backgroundColor = '#FF9800';
        statusBadge.style.color = 'white';

        // Adicionar badge de projeto não iniciado
        const badge = document.createElement('span');
        badge.className = 'projeto-status-badge';
        badge.textContent = '⏳ NÃO INICIADO';
        badge.style.cssText = `
            background: #FF9800;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
            font-weight: bold;
        `;
        headerContent.appendChild(badge);
    }
}

// Atualizar barra de progresso
function atualizarBarraProgresso(progresso) {
    const progressoFill = document.getElementById('progresso-fill');
    const progressoTexto = document.getElementById('progresso-texto');

    progressoFill.style.width = `${progresso}%`;
    progressoTexto.textContent = `${progresso}%`;

    // Alterar cor baseado no progresso
    if (progresso === 100) {
        progressoFill.style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
    } else if (progresso === 0) {
        progressoFill.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
    } else if (progresso >= 75) {
        progressoFill.style.background = 'linear-gradient(90deg, #2196F3, #1976D2)';
    } else if (progresso >= 50) {
        progressoFill.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
    } else {
        progressoFill.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
    }
}

// Recalcular progresso baseado nas fases
function recalcularProgresso() {
    if (!implantacaoAtual) return;

    let totalPrevisto = 0;
    let totalRealizado = 0;

    implantacaoAtual.fases.forEach(fase => {
        totalPrevisto += parseInt(fase.previsto) || 0;
        totalRealizado += parseInt(fase.realizado) || 0;
    });

    let novoProgresso = 0;
    if (totalPrevisto > 0) {
        novoProgresso = Math.round((totalRealizado / totalPrevisto) * 100);
    }

    // Se Go Live está concluído, progresso é sempre 100%
    if (temGoLiveConcluido(implantacaoAtual)) {
        novoProgresso = 100;
    }
    // Se Kick Off não foi concluído, progresso é 0%
    else if (getDataKickOff(implantacaoAtual) && !temKickOffConcluido(implantacaoAtual)) {
        novoProgresso = 0;
    }

    implantacaoAtual.progresso = novoProgresso;
    atualizarBarraProgresso(novoProgresso);
}

// Atualizar status dos meses baseado nas fases
function atualizarStatusMeses() {
    if (!implantacaoAtual) return;

    const anoAtual = new Date().getFullYear();
    const statusMesesAtualizado = gerarStatusMesesPorFases(implantacaoAtual, anoAtual);

    // Atualizar ou criar estrutura de anos
    if (!implantacaoAtual.statusMeses) {
        implantacaoAtual.statusMeses = {};
    }

    implantacaoAtual.statusMeses[anoAtual] = statusMesesAtualizado;

    // Atualizar status geral baseado no estado do projeto
    if (temGoLiveConcluido(implantacaoAtual)) {
        implantacaoAtual.status = "Finalizado";
    } else if (getDataKickOff(implantacaoAtual) && !temKickOffConcluido(implantacaoAtual)) {
        implantacaoAtual.status = "Não Iniciado";
    } else {
        implantacaoAtual.status = "Em andamento";
    }
}

// Carregar timeline detalhada
function carregarTimelineDetalhada(implantacao) {
    const timelineBody = document.getElementById('timeline-body');
    timelineBody.innerHTML = '';

    if (!implantacao.fases || implantacao.fases.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="100%">Nenhuma fase definida</td>';
        timelineBody.appendChild(row);
        return;
    }

    // Verificar se o projeto está finalizado ou não iniciado
    const goLiveConcluido = temGoLiveConcluido(implantacao);
    const kickOffConcluido = temKickOffConcluido(implantacao);
    const dataGoLive = getDataGoLive(implantacao);
    const dataKickOff = getDataKickOff(implantacao);

    // Calcular intervalo de datas
    let minDate = null;
    let maxDate = null;

    implantacao.fases.forEach(fase => {
        if (fase.inicio && fase.fim) {
            const inicio = new Date(fase.inicio + "T00:00:00");
            const fim = new Date(fase.fim + "T00:00:00");

            if (!minDate || inicio < minDate) minDate = inicio;
            if (!maxDate || fim > maxDate) maxDate = fim;
        }
    });

    if (!minDate || !maxDate) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="100%">Datas das fases não definidas</td>';
        timelineBody.appendChild(row);
        return;
    }

    // Se projeto finalizado, limitar maxDate até a data do Go Live
    if (dataGoLive && dataGoLive < maxDate) {
        maxDate = dataGoLive;
    }

    const totalDias = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

    // Atualizar cabeçalho dos dias
    atualizarCabecalhoDias(minDate, maxDate);

    // Criar linhas para cada fase
    implantacao.fases.forEach(fase => {
        const row = document.createElement("tr");

        // Célula da fase
        const faseCell = document.createElement("td");
        faseCell.className = "fase-nome";
        faseCell.textContent = fase.nome;

        // Destacar fases especiais
        const faseNomeLower = fase.nome.toLowerCase();
        const isKickOff = faseNomeLower.includes('kick off') || faseNomeLower.includes('kickoff');
        const isGoLive = faseNomeLower.includes('go live') || faseNomeLower.includes('golive');

        if (isGoLive && (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora')) {
            faseCell.style.fontWeight = 'bold';
            faseCell.style.color = '#4CAF50';
            faseCell.innerHTML += ' ✅';
        } else if (isKickOff && (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora')) {
            faseCell.style.fontWeight = 'bold';
            faseCell.style.color = '#2196F3';
            faseCell.innerHTML += ' 📍';
        }

        row.appendChild(faseCell);

        // Célula do previsto
        const previstoCell = document.createElement("td");
        previstoCell.className = "previsto-nome";
        previstoCell.textContent = fase.previsto;
        row.appendChild(previstoCell);

        // Célula do realizado
        const realizadoCell = document.createElement("td");
        realizadoCell.className = "realizado-nome";
        realizadoCell.textContent = fase.realizado;
        row.appendChild(realizadoCell);

        // Células dos dias
        const timelineCells = [];
        for (let i = 0; i < totalDias; i++) {
            timelineCells.push(document.createElement("td"));
        }

        if (fase.inicio && fase.fim) {
            const dataInicioFase = new Date(fase.inicio + "T00:00:00");
            const dataFimFase = new Date(fase.fim + "T00:00:00");

            const startIndex = Math.max(0, Math.floor((dataInicioFase - minDate) / (1000 * 60 * 60 * 24)));
            const endIndex = Math.min(totalDias - 1, Math.floor((dataFimFase - minDate) / (1000 * 60 * 60 * 24)));
            const duration = endIndex - startIndex + 1;

            if (duration > 0) {
                const statusBar = document.createElement("div");
                statusBar.className = `status-bar status-${fase.status}`;
                statusBar.style.width = `calc(${duration} * var(--day-cell-width) + ${duration - 1} * var(--day-cell-spacing))`;
                statusBar.style.position = "absolute";
                statusBar.style.left = `calc(${startIndex} * var(--day-cell-width) + ${startIndex} * var(--day-cell-spacing))`;
                statusBar.style.height = "25px";
                statusBar.style.top = "50%";
                statusBar.style.transform = "translateY(-50%)";
                statusBar.style.borderRadius = "12px";
                statusBar.style.display = "flex";
                statusBar.style.alignItems = "center";
                statusBar.style.justifyContent = "center";
                statusBar.style.color = "white";
                statusBar.style.fontSize = "12px";
                statusBar.style.fontWeight = "bold";
                statusBar.textContent = fase.nome;

                // Adicionar marcadores especiais
                if (isKickOff) {
                    statusBar.innerHTML = "⭐";
                    statusBar.className += " tooltip";
                    statusBar.setAttribute("data-tooltip", "Reunião de alinhamento");

                    if (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora') {
                        statusBar.innerHTML = "⭐📍";
                        statusBar.setAttribute("data-tooltip", "Kick Off - PROJETO INICIADO");
                        statusBar.style.backgroundColor = "#000000";
                    }
                } else if (isGoLive) {
                    statusBar.innerHTML = "🏴";
                    statusBar.className += " tooltip";
                    statusBar.setAttribute("data-tooltip", "Go Live");

                    if (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora') {
                        statusBar.innerHTML = "🏴✅";
                        statusBar.setAttribute("data-tooltip", "Go Live - PROJETO FINALIZADO");
                        statusBar.style.backgroundColor = "#4CAF50";
                    }
                }

                timelineCells[0].style.position = "relative";
                timelineCells[0].appendChild(statusBar);
            }
        }

        timelineCells.forEach(cell => row.appendChild(cell));
        timelineBody.appendChild(row);
    });
}

// Atualizar cabeçalho dos dias dinamicamente
function atualizarCabecalhoDias(minDate, maxDate) {
    const diasHeader = document.getElementById("dias-header");
    const mesesHeader = document.getElementById("meses-header");
    diasHeader.innerHTML = "<th></th><th></th><th></th>"; // Células vazias para fase, previsto, realizado
    mesesHeader.innerHTML = "<th></th><th></th><th></th>"; // Células vazias para fase, previsto, realizado

    let currentMonth = new Date(minDate);
    let monthColspan = 0;

    while (currentMonth <= maxDate) {
        const monthName = nomesMeses[currentMonth.getMonth()];
        const daysInMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
        ).getDate();

        let startDay = 1;
        let endDay = daysInMonth;

        if (currentMonth.getMonth() === minDate.getMonth() && currentMonth.getFullYear() === minDate.getFullYear()) {
            startDay = minDate.getDate();
        }
        if (currentMonth.getMonth() === maxDate.getMonth() && currentMonth.getFullYear() === maxDate.getFullYear()) {
            endDay = maxDate.getDate();
        }

        const currentMonthDays = endDay - startDay + 1;
        monthColspan += currentMonthDays;

        const thMonth = document.createElement("th");
        thMonth.setAttribute("colspan", currentMonthDays);
        thMonth.textContent = monthName;
        mesesHeader.appendChild(thMonth);

        for (let i = startDay; i <= endDay; i++) {
            const thDay = document.createElement("th");
            thDay.textContent = i;
            diasHeader.appendChild(thDay);
        }

        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
}

// Preencher resumo operacional e status
function preencherResumoStatus(implantacao) {
    const resumoConteudo = document.getElementById('resumo-conteudo');
    resumoConteudo.innerHTML = '';

    // Verificar status do projeto
    const goLiveConcluido = temGoLiveConcluido(implantacao);
    const kickOffConcluido = temKickOffConcluido(implantacao);
    const dataKickOff = getDataKickOff(implantacao);
    const projetoNaoIniciado = dataKickOff && !kickOffConcluido;

    // Adicionar mensagem especial baseado no status
    if (goLiveConcluido) {
        const mensagemFinalizado = document.createElement('div');
        mensagemFinalizado.style.cssText = `
            background: #e8f5e8;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
        `;
        mensagemFinalizado.innerHTML = `
            <h4 style="color: #4CAF50; margin: 0 0 10px 0;">🎉 PROJETO FINALIZADO</h4>
            <p style="margin: 0; color: #2e7d32;">O Go Live foi concluído com sucesso. Este projeto está finalizado.</p>
        `;
        resumoConteudo.appendChild(mensagemFinalizado);
    } else if (projetoNaoIniciado) {
        const mensagemNaoIniciado = document.createElement('div');
        mensagemNaoIniciado.style.cssText = `
            background: #fff3e0;
            border: 2px solid #FF9800;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
        `;
        mensagemNaoIniciado.innerHTML = `
            <h4 style="color: #FF9800; margin: 0 0 10px 0;">⏳ PROJETO NÃO INICIADO</h4>
            <p style="margin: 0; color: #e65100;">O Kick Off ainda não foi realizado. O projeto aguarda início.</p>
        `;
        resumoConteudo.appendChild(mensagemNaoIniciado);
    }

    // Criar container para as frases editáveis
    const frasesContainer = document.createElement('div');
    frasesContainer.id = 'frases-container';

    implantacao.resumoOperacional.forEach((item, index) => {
        const fraseDiv = document.createElement('div');
        fraseDiv.className = 'frase-item';
        fraseDiv.style.marginBottom = '15px';
        fraseDiv.style.padding = '10px';
        fraseDiv.style.border = '1px solid #e0e0e0';
        fraseDiv.style.borderRadius = '5px';
        fraseDiv.style.backgroundColor = '#f9f9f9';

        const fraseTexto = document.createElement('p');
        fraseTexto.textContent = `• ${item}`;
        fraseTexto.style.marginBottom = '8px';
        fraseTexto.style.cursor = goLiveConcluido ? 'default' : 'pointer';
        fraseTexto.title = goLiveConcluido ? 'Projeto finalizado - edição desabilitada' : 'Clique para editar';

        if (goLiveConcluido) {
            fraseTexto.style.color = '#666';
        }

        const fraseInput = document.createElement('textarea');
        fraseInput.value = item;
        fraseInput.style.width = '100%';
        fraseInput.style.minHeight = '60px';
        fraseInput.style.display = 'none';
        fraseInput.style.border = '1px solid #ccc';
        fraseInput.style.borderRadius = '3px';
        fraseInput.style.padding = '5px';
        fraseInput.style.fontSize = '14px';
        fraseInput.style.resize = 'vertical';
        fraseInput.disabled = goLiveConcluido;

        const botoesDiv = document.createElement('div');
        botoesDiv.style.display = 'none';
        botoesDiv.style.marginTop = '8px';

        const btnSalvar = document.createElement('button');
        btnSalvar.textContent = 'Salvar';
        btnSalvar.style.marginRight = '8px';
        btnSalvar.style.padding = '5px 12px';
        btnSalvar.style.backgroundColor = '#4CAF50';
        btnSalvar.style.color = 'white';
        btnSalvar.style.border = 'none';
        btnSalvar.style.borderRadius = '3px';
        btnSalvar.style.cursor = 'pointer';
        btnSalvar.disabled = goLiveConcluido;

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.padding = '5px 12px';
        btnCancelar.style.backgroundColor = '#f44336';
        btnCancelar.style.color = 'white';
        btnCancelar.style.border = 'none';
        btnCancelar.style.borderRadius = '3px';
        btnCancelar.style.cursor = 'pointer';

        const btnRemover = document.createElement('button');
        btnRemover.textContent = '🗑️';
        btnRemover.title = goLiveConcluido ? 'Projeto finalizado - edição desabilitada' : 'Remover observação';
        btnRemover.style.padding = '5px 8px';
        btnRemover.style.backgroundColor = goLiveConcluido ? '#ccc' : '#ff9800';
        btnRemover.style.color = 'white';
        btnRemover.style.border = 'none';
        btnRemover.style.borderRadius = '3px';
        btnRemover.style.cursor = goLiveConcluido ? 'not-allowed' : 'pointer';
        btnRemover.style.marginLeft = '8px';
        btnRemover.style.fontSize = '12px';
        btnRemover.disabled = goLiveConcluido;

        // Event listeners para edição (só se projeto não finalizado)
        if (!goLiveConcluido) {
            fraseTexto.addEventListener('click', () => {
                fraseTexto.style.display = 'none';
                fraseInput.style.display = 'block';
                botoesDiv.style.display = 'block';
                fraseInput.focus();
            });

            btnSalvar.addEventListener('click', async () => {
                const novoTexto = fraseInput.value.trim();
                if (novoTexto) {
                    implantacaoAtual.resumoOperacional[index] = novoTexto;
                    fraseTexto.textContent = `• ${novoTexto}`;

                    try {
                        // Salvar no Supabase
                        await SupabaseService.atualizarImplantacao(implantacaoAtual.id, implantacaoAtual);

                        // Atualizar na lista local
                        const indexImplantacao = implantacoes.findIndex(imp => imp.id === implantacaoAtual.id);
                        if (indexImplantacao !== -1) {
                            implantacoes[indexImplantacao] = { ...implantacaoAtual };
                        }

                        mostrarMensagem('Observação atualizada com sucesso!', 'sucesso');
                    } catch (error) {
                        console.error('Erro ao salvar observação:', error);
                        mostrarMensagem('Erro ao salvar observação. Tente novamente.', 'erro');
                    }
                }

                fraseTexto.style.display = 'block';
                fraseInput.style.display = 'none';
                botoesDiv.style.display = 'none';
            });

            btnCancelar.addEventListener('click', () => {
                fraseInput.value = implantacaoAtual.resumoOperacional[index];
                fraseTexto.style.display = 'block';
                fraseInput.style.display = 'none';
                botoesDiv.style.display = 'none';
            });

            btnRemover.addEventListener('click', () => {
                removerObservacao(index);
            });
        }

        botoesDiv.appendChild(btnSalvar);
        botoesDiv.appendChild(btnCancelar);
        botoesDiv.appendChild(btnRemover);

        fraseDiv.appendChild(fraseTexto);
        fraseDiv.appendChild(fraseInput);
        fraseDiv.appendChild(botoesDiv);

        frasesContainer.appendChild(fraseDiv);
    });

    // Botão para adicionar nova frase (só se projeto não finalizado)
    if (!goLiveConcluido) {
        const btnAdicionarFrase = document.createElement('button');
        btnAdicionarFrase.textContent = '+ Adicionar Nova Observação';
        btnAdicionarFrase.style.padding = '10px 15px';
        btnAdicionarFrase.style.backgroundColor = '#2196F3';
        btnAdicionarFrase.style.color = 'white';
        btnAdicionarFrase.style.border = 'none';
        btnAdicionarFrase.style.borderRadius = '5px';
        btnAdicionarFrase.style.cursor = 'pointer';
        btnAdicionarFrase.style.marginTop = '15px';

        btnAdicionarFrase.addEventListener('click', () => {
            adicionarNovaObservacao();
        });

        resumoConteudo.appendChild(frasesContainer);
        resumoConteudo.appendChild(btnAdicionarFrase);
    } else {
        resumoConteudo.appendChild(frasesContainer);
    }

    const statusBadge = document.getElementById('status-badge');
    let statusFinal = implantacao.status;

    if (goLiveConcluido) {
        statusFinal = 'Finalizado';
    } else if (projetoNaoIniciado) {
        statusFinal = 'Não Iniciado';
    }

    statusBadge.textContent = statusFinal;
    statusBadge.className = 'status-badge';

    switch (statusFinal.toLowerCase()) {
        case 'finalizado':
            statusBadge.classList.add('status-finalizado');
            statusBadge.style.backgroundColor = '#4CAF50';
            statusBadge.style.color = 'white';
            break;
        case 'não iniciado':
            statusBadge.classList.add('status-nao-iniciado');
            statusBadge.style.backgroundColor = '#FF9800';
            statusBadge.style.color = 'white';
            break;
        case 'em andamento':
            statusBadge.classList.add('status-em-andamento');
            break;
        case 'atrasado':
            statusBadge.classList.add('status-atrasado');
            break;
    }
}

// Abrir modal para editar timeline
function abrirModalEditarTimeline() {
    if (!implantacaoAtual) return;

    // Verificar se projeto está finalizado
    if (temGoLiveConcluido(implantacaoAtual)) {
        mostrarMensagem('Não é possível editar a timeline de um projeto finalizado!', 'erro');
        return;
    }

    document.getElementById('modal-empresa-nome').textContent = implantacaoAtual.empresa;
    document.getElementById('modal-editar-timeline').classList.remove('hidden');

    carregarFasesEditor();
}

// Fechar modal de editar timeline
function fecharModalEditarTimeline() {
    document.getElementById('modal-editar-timeline').classList.add('hidden');
}

// Carregar fases no editor
function carregarFasesEditor() {
    const fasesEditor = document.getElementById('fases-editor');
    fasesEditor.innerHTML = '';

    const goLiveConcluido = temGoLiveConcluido(implantacaoAtual);

    implantacaoAtual.fases.forEach((fase, index) => {
        const faseItem = criarItemFaseEditor(fase, index, goLiveConcluido);
        fasesEditor.appendChild(faseItem);
    });
}

// Criar item de fase no editor
function criarItemFaseEditor(fase, index, projetoFinalizado = false) {
    const faseDiv = document.createElement('div');
    faseDiv.className = 'fase-item';
    faseDiv.dataset.index = index;

    const faseNomeLower = fase.nome.toLowerCase();
    const isKickOff = faseNomeLower.includes('kick off') || faseNomeLower.includes('kickoff');
    const isGoLive = faseNomeLower.includes('go live') || faseNomeLower.includes('golive');
    const kickOffConcluido = isKickOff && (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora');
    const goLiveConcluido = isGoLive && (fase.status === 'concluido-prazo' || fase.status === 'concluido-fora');

    faseDiv.innerHTML = `
        <div class="fase-header">
            <div class="fase-titulo">
                Fase ${index + 1}
                ${kickOffConcluido ? ' 📍 INICIADO' : ''}
                ${goLiveConcluido ? ' ✅ FINALIZADO' : ''}
            </div>
            <div class="fase-actions">
                <button type="button" class="btn-fase-action btn-remover-fase" onclick="removerFase(${index})" 
                    ${projetoFinalizado ? 'disabled title="Projeto finalizado - edição desabilitada"' : ''}>
                    🗑️ Remover
                </button>
            </div>
        </div>
        <div class="fase-form">
            <div class="form-field">
                <label>Nome da Fase</label>
                <input type="text" value="${fase.nome}" data-field="nome" 
                    ${projetoFinalizado ? 'disabled' : ''}>
            </div>
            <div class="form-field">
                <label>Previsto</label>
                <input type="number" value="${fase.previsto}" data-field="previsto" min="0" 
                    ${projetoFinalizado ? 'disabled' : ''}>
            </div>
            <div class="form-field">
                <label>Realizado</label>
                <input type="number" value="${fase.realizado}" data-field="realizado" min="0" 
                    onchange="atualizarProgressoEmTempoReal()" 
                    ${projetoFinalizado ? 'disabled' : ''}>
            </div>
            <div class="form-field">
                <label>Status</label>
                <select data-field="status" ${projetoFinalizado ? 'disabled' : ''}>
                    <option value="pendente" ${fase.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="andamento" ${fase.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="concluido-prazo" ${fase.status === 'concluido-prazo' ? 'selected' : ''}>Concluído no Prazo</option>
                    <option value="concluido-fora" ${fase.status === 'concluido-fora' ? 'selected' : ''}>Concluído Fora do Prazo</option>
                    <option value="atrasado" ${fase.status === 'atrasado' ? 'selected' : ''}>Atrasado</option>
                </select>
            </div>
            <div class="form-field">
                <label>Data Início</label>
                <input type="date" value="${fase.inicio}" data-field="inicio" 
                    ${projetoFinalizado ? 'disabled' : ''}>
            </div>
            <div class="form-field">
                <label>Data Fim</label>
                <input type="date" value="${fase.fim}" data-field="fim" 
                    ${projetoFinalizado ? 'disabled' : ''}>
            </div>
        </div>
    `;

    // Destacar visualmente fases especiais
    if (kickOffConcluido) {
        faseDiv.style.backgroundColor = '#e3f2fd';
        faseDiv.style.border = '2px solid #2196F3';
    } else if (goLiveConcluido) {
        faseDiv.style.backgroundColor = '#e8f5e8';
        faseDiv.style.border = '2px solid #4CAF50';
    }

    return faseDiv;
}

// Adicionar nova fase
function adicionarNovaFase() {
    if (temGoLiveConcluido(implantacaoAtual)) {
        mostrarMensagem('Não é possível adicionar fases a um projeto finalizado!', 'erro');
        return;
    }

    const novaFase = {
        nome: "Nova Fase",
        previsto: 1,
        realizado: 0,
        status: "pendente",
        inicio: "",
        fim: ""
    };

    implantacaoAtual.fases.push(novaFase);
    carregarFasesEditor();
    mostrarMensagem('Nova fase adicionada!', 'sucesso');
}

// Remover fase
function removerFase(index) {
    if (temGoLiveConcluido(implantacaoAtual)) {
        mostrarMensagem('Não é possível remover fases de um projeto finalizado!', 'erro');
        return;
    }

    if (implantacaoAtual.fases.length <= 1) {
        mostrarMensagem('Não é possível remover a última fase!', 'erro');
        return;
    }

    if (confirm('Tem certeza que deseja remover esta fase?')) {
        implantacaoAtual.fases.splice(index, 1);
        carregarFasesEditor();
        mostrarMensagem('Fase removida com sucesso!', 'sucesso');
    }
}

// Salvar alterações da timeline
async function salvarAlteracoesTimeline() {
    if (temGoLiveConcluido(implantacaoAtual)) {
        mostrarMensagem('Não é possível editar a timeline de um projeto finalizado!', 'erro');
        return;
    }

    const fasesItems = document.querySelectorAll('.fase-item');

    fasesItems.forEach((item, index) => {
        const fase = implantacaoAtual.fases[index];
        if (!fase) return;

        const inputs = item.querySelectorAll('[data-field]');
        inputs.forEach(input => {
            const field = input.dataset.field;
            fase[field] = input.value;
        });
    });

    // Recalcular progresso baseado nas fases
    recalcularProgresso();

    // Atualizar status dos meses baseado nas fases
    atualizarStatusMeses();

    try {
        mostrarMensagem('Salvando alterações...', 'info');

        // Salvar no Supabase
        await SupabaseService.atualizarImplantacao(implantacaoAtual.id, implantacaoAtual);

        // Atualizar na lista local
        const index = implantacoes.findIndex(imp => imp.id === implantacaoAtual.id);
        if (index !== -1) {
            implantacoes[index] = { ...implantacaoAtual };
        }

        // Recarregar interfaces
        carregarPainelProjetos();
        carregarTimelineDetalhada(implantacaoAtual);
        atualizarBarraProgresso(implantacaoAtual.progresso);
        preencherResumoStatus(implantacaoAtual);

        fecharModalEditarTimeline();
        mostrarMensagem('Timeline atualizada com sucesso!', 'sucesso');

        // Verificar mudanças de status importantes
        if (temGoLiveConcluido(implantacaoAtual)) {
            mostrarMensagem('🎉 Parabéns! O Go Live foi concluído. O projeto está finalizado!', 'sucesso');
        } else if (temKickOffConcluido(implantacaoAtual)) {
            mostrarMensagem('🚀 Kick Off concluído! O projeto foi iniciado oficialmente.', 'sucesso');
        }

        // Recarregar a página de status para mostrar as mudanças
        setTimeout(() => {
            exibirStatusImplantacao(implantacaoAtual);
        }, 1000);

    } catch (error) {
        console.error('Erro ao salvar timeline:', error);
        mostrarMensagem('Erro ao salvar alterações. Tente novamente.', 'erro');
    }
}

// Abrir modal para confirmar exclusão
function abrirModalConfirmarExclusao() {
    if (!implantacaoAtual) return;

    document.getElementById('exclusao-empresa-nome').textContent = implantacaoAtual.empresa;
    document.getElementById('modal-confirmar-exclusao').classList.remove('hidden');
}

// Fechar modal de confirmar exclusão
function fecharModalConfirmarExclusao() {
    document.getElementById('modal-confirmar-exclusao').classList.add('hidden');
}

// Excluir implantação
async function excluirImplantacao() {
    if (!implantacaoAtual) return;

    try {
        mostrarMensagem('Excluindo implantação...', 'info');

        // Excluir do Supabase
        await SupabaseService.excluirImplantacao(implantacaoAtual.id);

        // Remover da lista local
        const index = implantacoes.findIndex(imp => imp.id === implantacaoAtual.id);
        if (index !== -1) {
            implantacoes.splice(index, 1);
        }

        // Recarregar painel e voltar
        carregarPainelProjetos();
        voltarPainelProjetos();
        fecharModalConfirmarExclusao();

        mostrarMensagem(`Implantação "${implantacaoAtual.empresa}" excluída com sucesso!`, 'sucesso');

    } catch (error) {
        console.error('Erro ao excluir implantação:', error);
        mostrarMensagem('Erro ao excluir implantação. Tente novamente.', 'erro');
    }
}

// Voltar ao painel de projetos
function voltarPainelProjetos() {
    document.getElementById('status-implantacao').classList.add('hidden');
    document.getElementById('painel-projetos').classList.remove('hidden');
    implantacaoAtual = null;
}

// Abrir modal para adicionar nova implantação
function abrirModalAdicionar() {
    document.getElementById('modal-adicionar').classList.remove('hidden');
    document.getElementById('form-adicionar').reset();
}

// Fechar modal
function fecharModal() {
    document.getElementById('modal-adicionar').classList.add('hidden');
}

// Adicionar nova implantação
async function adicionarNovaImplantacao(e) {
    e.preventDefault();

    const empresa = document.getElementById('nova-empresa').value;
    const projeto = document.getElementById('novo-projeto').value;
    const sistema = document.getElementById('novo-sistema').value;
    const gestor = document.getElementById('novo-gestor').value;
    const especialista = document.getElementById('especialista').value;
    const logoFile = document.getElementById('logo-cliente').files[0];

    try {
        // Processar logo se foi fornecida
        let logoUrl = null;
        if (logoFile) {
            mostrarMensagem('Fazendo upload do logo...', 'info');
            const fileName = `${Date.now()}_${logoFile.name}`;
            logoUrl = await SupabaseService.uploadLogo(logoFile, fileName);
        }

        const novaImplantacao = {
            empresa: empresa,
            projeto: projeto,
            sistema: sistema,
            gestor: gestor,
            especialista: especialista,
            logo: logoUrl,
            progresso: 0,
            status: "Não Iniciado",
            statusMeses: {
                janeiro: ["pendente", "pendente", "pendente", "pendente"],
                fevereiro: ["pendente", "pendente", "pendente", "pendente"],
                marco: ["pendente", "pendente", "pendente", "pendente"],
                abril: ["pendente", "pendente", "pendente", "pendente"],
                maio: ["pendente", "pendente", "pendente", "pendente"],
                junho: ["pendente", "pendente", "pendente", "pendente"],
                julho: ["pendente", "pendente", "pendente", "pendente"],
                agosto: ["pendente", "pendente", "pendente", "pendente"],
                setembro: ["pendente", "pendente", "pendente", "pendente"],
                outubro: ["pendente", "pendente", "pendente", "pendente"],
                novembro: ["pendente", "pendente", "pendente", "pendente"],
                dezembro: ["pendente", "pendente", "pendente", "pendente"]
            },
            fases: [
                { nome: "Kick Off", previsto: 1, realizado: 0, status: "pendente", inicio: "", fim: "" },
                { nome: "Treinamento", previsto: 1, realizado: 0, status: "pendente", inicio: "", fim: "" },
                { nome: "Cadastros", previsto: 6, realizado: 0, status: "pendente", inicio: "", fim: "" },
                { nome: "Integrações", previsto: 2, realizado: 0, status: "pendente", inicio: "", fim: "" },
                { nome: "Testes", previsto: 1, realizado: 0, status: "pendente", inicio: "", fim: "" },
                { nome: "Validação", previsto: 1, realizado: 0, status: "pendente", inicio: "", fim: "" },
                { nome: "Go Live", previsto: 1, realizado: 0, status: "pendente", inicio: "", fim: "" }
            ],
            resumoOperacional: [
                "Projeto recém-criado.",
                "Aguardando definição de datas e início das atividades."
            ]
        };

        mostrarMensagem('Salvando implantação...', 'info');

        // Salvar no Supabase
        const implantacaoSalva = await SupabaseService.salvarImplantacao(novaImplantacao);

        // Adicionar à lista local
        const implantacaoCompleta = {
            id: implantacaoSalva.id,
            empresa: implantacaoSalva.empresa,
            projeto: implantacaoSalva.projeto,
            sistema: implantacaoSalva.sistema,
            gestor: implantacaoSalva.gestor,
            especialista: implantacaoSalva.especialista,
            logo: implantacaoSalva.logo_url,
            progresso: implantacaoSalva.progresso,
            status: implantacaoSalva.status,
            statusMeses: implantacaoSalva.status_meses,
            fases: implantacaoSalva.fases,
            resumoOperacional: implantacaoSalva.resumo_operacional
        };

        implantacoes.push(implantacaoCompleta);

        // Definir a implantação recém-adicionada como a implantação atual
        implantacaoAtual = implantacaoCompleta;

        // Recarregar painel
        carregarPainelProjetos();
        fecharModal();

        // Mostrar mensagem de sucesso
        mostrarMensagem(`Implantação "${empresa}" adicionada com sucesso!`, 'sucesso');

    } catch (error) {
        console.error('Erro ao adicionar implantação:', error);
        mostrarMensagem('Erro ao salvar implantação. Tente novamente.', 'erro');
    }
}

// Filtrar implantações
function filtrarImplantacoes() {
    const filtro = (document.getElementById('filtro-busca') && document.getElementById('filtro-busca').value || '').toLowerCase();
    const rows = document.querySelectorAll('#tabela-body tr');

    rows.forEach(row => {
        // Ignorar linhas que não tenham as células esperadas (ex.: linha "Nenhuma implantação encontrada")
        if (!row.cells || row.cells.length < 3) {
            // Mostrar mensagem de "nenhum dado" apenas quando não houver filtro
            if (row.cells && row.cells.length === 1) {
                row.style.display = filtro ? 'none' : '';
            }
            return;
        }

        const empresa = (row.cells[0].textContent || '').toLowerCase();
        const projeto = (row.cells[1].textContent || '').toLowerCase();
        const sistema = (row.cells[2].textContent || '').toLowerCase();

        const corresponde = empresa.includes(filtro) || projeto.includes(filtro) || sistema.includes(filtro);

        row.style.display = corresponde ? '' : 'none';
    });

    // Se estivermos no modo Gantt, re-renderizar o Gantt para aplicar o filtro
    if (modoVisualizacao === 'gantt') {
        renderizarGantt();
    }
    // Atualizar dashboard também
    renderDashboard();
}

// Mostrar mensagem de feedback
function mostrarMensagem(texto, tipo) {
    const mensagem = document.createElement('div');
    mensagem.className = `mensagem mensagem-${tipo}`;
    mensagem.textContent = texto;
    mensagem.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    if (tipo === 'sucesso') {
        mensagem.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    } else if (tipo === 'erro') {
        mensagem.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    } else if (tipo === 'info') {
        mensagem.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
    }

    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.remove();
    }, 3000);
}

// Adicionar animação CSS para mensagens
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .sem-dados {
        font-size: 14px;
        color: #999;
        font-style: italic;
    }
    
    .projeto-finalizado {
        background-color: #f0f8f0 !important;
        border-left: 4px solid #4CAF50 !important;
    }
    
    .projeto-nao-iniciado {
        background-color: #f8f8f0 !important;
        border-left: 4px solid #FF9800 !important;
    }
    
    .status-finalizado {
        background-color: #4CAF50 !important;
        color: white !important;
    }
    
    .status-nao-iniciado {
        background-color: #FF9800 !important;
        color: white !important;
    }
    /* Dashboard styles (improved) */
    .dashboard { padding: 18px; background: #fff; border-radius:10px; margin: 12px 0; box-shadow: 0 6px 18px rgba(0,0,0,0.06);} 
    .dashboard .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:18px; }
    .kpi-card { background: linear-gradient(180deg,#fff,#fbfbfb); border-radius:10px; padding:18px 14px; text-align:center; border:1px solid #eee; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
    .kpi-value { font-size:28px; font-weight:800; color:#222; }
    .kpi-label { font-size:13px; color:#777; margin-top:6px; }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap:16px; }
    .chart { background:#fff; border-radius:10px; padding:18px; border:1px solid #eee; min-height:220px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
    .chart-title { font-weight:700; margin-bottom:12px; font-size:16px; color:#222; }
    .chart-body { display:flex; align-items:center; gap:18px; }
    .pie-container { flex:0 0 54%; display:flex; align-items:center; justify-content:center; }
    .legend { flex:1; padding-left:10px; }
    .legend-item { display:flex; align-items:center; gap:10px; font-size:14px; color:#444; margin-bottom:8px; }
    .legend-dot { width:14px; height:14px; border-radius:50%; display:inline-block; }
    .lt-chart { display:flex; align-items:flex-end; gap:10px; height:160px; padding:10px 4px; }
    .lt-bar { width:28px; display:flex; flex-direction:column; align-items:center; }
    .lt-bar-fill { width:100%; background:linear-gradient(180deg,#4facfe,#36a2f5); border-radius:6px 6px 0 0; transition:height 0.25s; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
    .lt-bar-label { font-size:12px; margin-top:8px; color:#555; }
    .lt-debug { margin-top:10px; font-size:12px; color:#666; background:#fafafa; padding:8px; border-radius:6px; max-height:120px; overflow:auto; display:block; }
`;
document.head.appendChild(style);

// Funcionalidades extras
document.addEventListener('keydown', function (e) {
    // Esc para fechar modal
    if (e.key === 'Escape') {
        fecharModal();
    }

    // Ctrl+N para nova implantação
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        abrirModalAdicionar();
    }

    // Backspace para voltar (quando não estiver em input)
    if (e.key === 'Backspace' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        if (!document.getElementById('status-implantacao').classList.contains('hidden')) {
            voltarPainelProjetos();
        }
    }
});

// Função para atualizar progresso em tempo real quando o campo "realizado" é alterado
function atualizarProgressoEmTempoReal() {
    if (!implantacaoAtual) return;

    // Recalcular progresso baseado nos valores atuais dos campos
    let totalPrevisto = 0;
    let totalRealizado = 0;

    const fasesItems = document.querySelectorAll('.fase-item');
    fasesItems.forEach((item, index) => {
        const previstoInput = item.querySelector('[data-field="previsto"]');
        const realizadoInput = item.querySelector('[data-field="realizado"]');

        if (previstoInput && realizadoInput) {
            totalPrevisto += parseInt(previstoInput.value) || 0;
            totalRealizado += parseInt(realizadoInput.value) || 0;
        }
    });

    let novoProgresso = 0;
    if (totalPrevisto > 0) {
        novoProgresso = Math.round((totalRealizado / totalPrevisto) * 100);
    }

    // Aplicar regras especiais de progresso
    if (temGoLiveConcluido(implantacaoAtual)) {
        novoProgresso = 100;
    } else if (getDataKickOff(implantacaoAtual) && !temKickOffConcluido(implantacaoAtual)) {
        novoProgresso = 0;
    }

    // Atualizar a barra de progresso na tela de status se estiver visível
    if (!document.getElementById('status-implantacao').classList.contains('hidden')) {
        atualizarBarraProgresso(novoProgresso);
    }

    // Mostrar feedback visual
    mostrarMensagem(`Progresso atualizado: ${novoProgresso}%`, 'info');
}

// Função para adicionar nova observação
async function adicionarNovaObservacao() {
    if (!implantacaoAtual) return;

    // Verificar se projeto está finalizado
    if (temGoLiveConcluido(implantacaoAtual)) {
        mostrarMensagem('Não é possível adicionar observações a um projeto finalizado!', 'erro');
        return;
    }

    const novaObservacao = "Nova observação";
    implantacaoAtual.resumoOperacional.push(novaObservacao);

    try {
        // Salvar no Supabase
        await SupabaseService.atualizarImplantacao(implantacaoAtual.id, implantacaoAtual);

        // Atualizar na lista local
        const indexImplantacao = implantacoes.findIndex(imp => imp.id === implantacaoAtual.id);
        if (indexImplantacao !== -1) {
            implantacoes[indexImplantacao] = { ...implantacaoAtual };
        }

        // Recarregar o resumo para mostrar a nova observação
        preencherResumoStatus(implantacaoAtual);

        mostrarMensagem('Nova observação adicionada! Clique nela para editar.', 'sucesso');
    } catch (error) {
        console.error('Erro ao adicionar observação:', error);
        mostrarMensagem('Erro ao adicionar observação. Tente novamente.', 'erro');
        // Remover a observação da lista se houve erro
        implantacaoAtual.resumoOperacional.pop();
    }
}

// Função para remover observação
async function removerObservacao(index) {
    if (!implantacaoAtual || index < 0 || index >= implantacaoAtual.resumoOperacional.length) return;

    // Verificar se projeto está finalizado
    if (temGoLiveConcluido(implantacaoAtual)) {
        mostrarMensagem('Não é possível remover observações de um projeto finalizado!', 'erro');
        return;
    }

    if (implantacaoAtual.resumoOperacional.length <= 1) {
        mostrarMensagem('Deve haver pelo menos uma observação!', 'erro');
        return;
    }

    if (confirm('Tem certeza que deseja remover esta observação?')) {
        const observacaoRemovida = implantacaoAtual.resumoOperacional[index];
        implantacaoAtual.resumoOperacional.splice(index, 1);

        try {
            // Salvar no Supabase
            await SupabaseService.atualizarImplantacao(implantacaoAtual.id, implantacaoAtual);

            // Atualizar na lista local
            const indexImplantacao = implantacoes.findIndex(imp => imp.id === implantacaoAtual.id);
            if (indexImplantacao !== -1) {
                implantacoes[indexImplantacao] = { ...implantacaoAtual };
            }

            // Recarregar o resumo
            preencherResumoStatus(implantacaoAtual);

            mostrarMensagem('Observação removida com sucesso!', 'sucesso');
        } catch (error) {
            console.error('Erro ao remover observação:', error);
            mostrarMensagem('Erro ao remover observação. Tente novamente.', 'erro');
            // Restaurar a observação se houve erro
            implantacaoAtual.resumoOperacional.splice(index, 0, observacaoRemovida);
        }
    }
}

// =============================================
// GANTT VIEW
// =============================================

// ---------- Dashboard / Indicadores ----------
function obterImplantacoesVisiveis() {
    const filtroBusca = (document.getElementById('filtro-busca') && document.getElementById('filtro-busca').value || '').toLowerCase();
    return implantacoes.filter(imp => {
        if (!projetoDeveAparecerNoAno(imp, anoSelecionado)) return false;
        if (!filtroBusca) return true;
        const empresa = (imp.empresa || '').toLowerCase();
        const projeto = (imp.projeto || '').toLowerCase();
        const sistema = (imp.sistema || '').toLowerCase();
        return empresa.includes(filtroBusca) || projeto.includes(filtroBusca) || sistema.includes(filtroBusca);
    });
}

function renderDashboard() {
    const container = document.getElementById('dashboard');
    if (!container) return;

    const visiveis = obterImplantacoesVisiveis();
    console.log('[Dashboard] anoSelecionado:', anoSelecionado, 'implantações visíveis:', visiveis.length);

    // Resumo geral
    const total = visiveis.length;
    const concluidos = visiveis.filter(i => temGoLiveConcluido(i)).length;
    const atrasados = visiveis.filter(i => obterStatusDominante(i) === 'atrasado').length;

    document.getElementById('kpi-total-value').textContent = total;
    document.getElementById('kpi-concluidos-value').textContent = total > 0 ? Math.round((concluidos / total) * 100) + '%' : '0%';
    document.getElementById('kpi-atrasados-value').textContent = atrasados;

    // SLA
    const sla = calcularMetricasSLA(visiveis);
    document.getElementById('kpi-sla-value').textContent = sla.mediaDias !== null ? `${Math.round(sla.mediaDias)}d` : '-';

    // Mapa de status (pie)
    renderMapaStatus('chart-status', visiveis);

    // Linha do tempo agregada
    renderLinhaTempoAgregada('chart-linha-tempo', visiveis);
}

function calcularMetricasSLA(lista) {
    // Considerar datas planejadas: Kick Off (inicio) e Go Live (fim) mesmo que não tenham status concluído
    const withBoth = lista.filter(i => {
        const k = getDataKickOff(i); // retorna inicio do kick off se existir
        const g = getDataGoLiveAny(i); // nova função retorna fim do go live se existir (independente do status)
        return k && g;
    });
    if (withBoth.length === 0) return { mediaDias: null, dentroPrazoPct: null };
    let somaDias = 0;
    let dentroPrazo = 0;
    withBoth.forEach(i => {
        const k = getDataKickOff(i);
        const g = getDataGoLiveAny(i);
        if (k && g) {
            const dias = Math.ceil((g - k) / (1000 * 60 * 60 * 24));
            somaDias += dias;
            // considerar concluído quando o Go Live está com status concluído
            if (temGoLiveConcluido(i)) dentroPrazo += 1;
        }
    });
    const mediaDias = somaDias / withBoth.length;
    const dentroPrazoPct = Math.round((dentroPrazo / withBoth.length) * 100);
    return { mediaDias, dentroPrazoPct };
}

// Retorna a data de término do Go Live mesmo que não esteja marcado como concluído
function getDataGoLiveAny(implantacao) {
    if (!implantacao.fases) return null;
    const goLiveFase = implantacao.fases.find(fase =>
        fase.nome.toLowerCase().includes('go live') || fase.nome.toLowerCase().includes('golive')
    );
    if (goLiveFase && goLiveFase.fim) {
        return new Date(goLiveFase.fim);
    }
    return null;
}

function renderMapaStatus(containerId, lista) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const counts = { pendente: 0, andamento: 0, atrasado: 0, 'concluido-prazo': 0, 'concluido-fora': 0 };
    lista.forEach(i => {
        const s = obterStatusDominante(i) || 'pendente';
        counts[s] = (counts[s] || 0) + 1;
    });
    const entries = Object.entries(counts).filter(([k,v]) => v>0);
    // montar um SVG de pizza simples
    const width = 220, height = 220, cx = width/2, cy = height/2, r = Math.min(cx,cy)-6;
    const total = entries.reduce((s,[,v])=>s+v,0) || 1;
    let start = -Math.PI/2;
    const colors = { pendente:'#f39c12', andamento:'#3498db', atrasado:'#e74c3c', 'concluido-prazo':'#27ae60', 'concluido-fora':'#e67e22' };
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`;
    entries.forEach(([k,v])=>{
        const slice = v/total;
        const end = start + slice * Math.PI * 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        svg += `<path d="${path}" fill="${colors[k]||'#999'}" stroke="#fff" stroke-width="1"></path>`;
        start = end;
    });
    svg += `</svg>`;
    // legenda
    let legend = `<div class="chart-legend">`;
    entries.forEach(([k,v])=>{
        legend += `<div class="legend-item"><span class="legend-dot" style="background:${colors[k]||'#999'}"></span><span class="legend-label">${getStatusLabel(k)} (${v})</span></div>`;
    });
    legend += `</div>`;
    el.innerHTML = `<div class="chart-title">Mapa de Status</div><div class="chart-body">${svg}${legend}</div>`;
}

function renderLinhaTempoAgregada(containerId, lista) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const ano = anoSelecionado;
    const valores = new Array(12).fill(0);
    console.log('[LinhaTempo] calculando para ano', ano, 'itens:', lista.length);
    lista.forEach(i => {
        const statusMeses = obterStatusMesesPorAno(i, ano) || {};
        console.log('[LinhaTempo] implantacao:', (i.empresa || i.projeto), 'statusMeses keys:', Object.keys(statusMeses || {}));
        meses.forEach((m, idx)=>{
            const semanas = statusMeses[m];
            let ativo = false;
            if (Array.isArray(semanas)) {
                activo = semanas.some(s => s && s !== 'sem-dados');
            } else if (typeof semanas === 'string') {
                activo = semanas && semanas !== 'sem-dados';
            } else if (semanas && typeof semanas === 'object') {
                // object with week keys or counts
                activo = Object.values(semanas).some(v => v && v !== 'sem-dados');
            } else if (typeof semanas === 'number') {
                activo = semanas > 0;
            }
            if (activo) valores[idx] += 1;
        });
    });
    // Se todos os valores forem zero, tentar extrair dos períodos das fases (datas planejadas)
    const somaInicial = valores.reduce((s,v)=>s+v,0);
    if (somaInicial === 0) {
        console.log('[LinhaTempo] nenhum mês com status; tentando usar datas das fases como fallback');
        lista.forEach(i => {
            // aceitar fases com apenas inicio OU fim, e também fases que cruzem o ano
            if (!i.fases) return;
            i.fases.forEach(f => {
                const temIni = !!f.inicio;
                const temFim = !!f.fim;
                if (!temIni && !temFim) return;
                const ini = temIni ? new Date(f.inicio) : null;
                const fim = temFim ? new Date(f.fim) : null;
                console.log('[LinhaTempo] fase:', f.nome, 'inicio:', f.inicio, 'fim:', f.fim);
                // determinar se a fase toca o ano selecionado
                const anoIni = ini ? ini.getFullYear() : null;
                const anoFim = fim ? fim.getFullYear() : null;
                // se ambos não possuem ano igual ao selecionado, ainda podemos considerar se cruzam
                const cruza = (anoIni === null || anoIni <= ano) && (anoFim === null || anoFim >= ano);
                if (!cruza) return;
                const mesIni = ini && anoIni === ano ? ini.getMonth() : 0;
                const mesFim = fim && anoFim === ano ? fim.getMonth() : 11;
                for (let m = mesIni; m <= mesFim; m++) valores[m] += 1;
            });
        });
    }

}

// ---------- /Dashboard ----------

function inicializarToggleVisualizacao() {
    // Criar botões de alternância de visualização
    const controls = document.querySelector('.controls');
    if (!controls) return;

    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'toggle-visualizacao';
    toggleContainer.innerHTML = `
        <button id="btn-view-tabela" class="btn-view active" title="Visualização em tabela">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="4" height="4"/><rect x="6" y="1" width="4" height="4"/><rect x="11" y="1" width="4" height="4"/>
                <rect x="1" y="6" width="4" height="4"/><rect x="6" y="6" width="4" height="4"/><rect x="11" y="6" width="4" height="4"/>
                <rect x="1" y="11" width="4" height="4"/><rect x="6" y="11" width="4" height="4"/><rect x="11" y="11" width="4" height="4"/>
            </svg>
            Tabela
        </button>
        <button id="btn-view-gantt" class="btn-view" title="Visualização Gantt">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="8" height="3" rx="1"/>
                <rect x="4" y="7" width="10" height="3" rx="1"/>
                <rect x="2" y="12" width="6" height="3" rx="1"/>
            </svg>
            Gantt
        </button>
    `;
    controls.appendChild(toggleContainer);

    // Criar container Gantt (oculto inicialmente)
    const tabelaContainer = document.querySelector('.tabela-container');
    const ganttContainer = document.createElement('div');
    ganttContainer.id = 'gantt-container';
    ganttContainer.className = 'gantt-container';
    ganttContainer.style.display = 'none';
    tabelaContainer.parentNode.insertBefore(ganttContainer, tabelaContainer.nextSibling);

    document.getElementById('btn-view-tabela').addEventListener('click', () => {
        modoVisualizacao = 'tabela';
        document.getElementById('btn-view-tabela').classList.add('active');
        document.getElementById('btn-view-gantt').classList.remove('active');
        tabelaContainer.style.display = '';
        ganttContainer.style.display = 'none';
        carregarPainelProjetos();
    });

    document.getElementById('btn-view-gantt').addEventListener('click', () => {
        modoVisualizacao = 'gantt';
        document.getElementById('btn-view-gantt').classList.add('active');
        document.getElementById('btn-view-tabela').classList.remove('active');
        tabelaContainer.style.display = 'none';
        ganttContainer.style.display = 'block';
        console.log('[Gantt] Container visível, chamando renderizarGantt...');
        renderizarGantt();
    });
}

function obterStatusDominante(implantacao) {
    if (!implantacao.fases || implantacao.fases.length === 0) return implantacao.status || 'pendente';
    if (temGoLiveConcluido(implantacao)) return 'concluido-prazo';
    const hasAtrasado = implantacao.fases.some(f => f.status === 'atrasado');
    if (hasAtrasado) return 'atrasado';
    const hasAndamento = implantacao.fases.some(f => f.status === 'andamento');
    if (hasAndamento) return 'andamento';
    const hasConcluido = implantacao.fases.some(f => f.status === 'concluido-prazo' || f.status === 'concluido-fora');
    if (hasConcluido) return 'andamento';
    return 'pendente';
}

function getStatusLabel(status) {
    const labels = {
        'pendente': 'Aguardando',
        'andamento': 'Em andamento',
        'atrasado': 'Atrasado',
        'concluido-prazo': 'Concluído dentro do prazo',
        'concluido-fora': 'Concluído fora do prazo',
    };
    return labels[status] || status;
}

function renderizarGantt() {
    const ganttContainer = document.getElementById('gantt-container');
    if (!ganttContainer) {
        console.error('[Gantt] ERRO: #gantt-container não encontrado no DOM!');
        return;
    }

    console.log('[Gantt] Total implantacoes:', implantacoes.length, '| Ano:', anoSelecionado);
    console.log('[Gantt] Container:', ganttContainer, 'display:', ganttContainer.style.display);

    const filtroBusca = (document.getElementById('filtro-busca') && document.getElementById('filtro-busca').value || '').toLowerCase();
    function correspondeFiltro(imp) {
        if (!filtroBusca) return true;
        const empresa = (imp.empresa || '').toLowerCase();
        const projeto = (imp.projeto || '').toLowerCase();
        const sistema = (imp.sistema || '').toLowerCase();
        return empresa.includes(filtroBusca) || projeto.includes(filtroBusca) || sistema.includes(filtroBusca);
    }

    const implantacoesFiltradas = implantacoes.filter(imp => projetoDeveAparecerNoAno(imp, anoSelecionado) && correspondeFiltro(imp));
    console.log('[Gantt] Filtradas para o ano:', implantacoesFiltradas.length);
    implantacoesFiltradas.forEach(imp => {
        const fasesComDatas = (imp.fases || []).filter(f => f.inicio && f.fim);
        console.log('[Gantt] -', imp.empresa, '| fases:', (imp.fases || []).length, '| fases c/ datas:', fasesComDatas.length, '| statusMeses keys:', Object.keys(imp.statusMeses || {}));
    });

    // Calcular range de datas (meses do ano selecionado)
    const dataInicio = new Date(anoSelecionado, 0, 1);
    const dataFim = new Date(anoSelecionado, 11, 31);
    const totalDias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;

    // Construir HTML do Gantt
    let html = `
        <div class="gantt-wrapper">
            <div class="gantt-header-row">
                <div class="gantt-label-col">Projeto</div>
                <div class="gantt-chart-col">
                    <div class="gantt-months-header">
                        ${nomesMeses.map((m, i) => {
                            const diasNoMes = new Date(anoSelecionado, i + 1, 0).getDate();
                            const pct = (diasNoMes / totalDias * 100).toFixed(3);
                            return `<div class="gantt-month-label" style="width:${pct}%">${m}</div>`;
                        }).join('')}
                    </div>
                    <div class="gantt-today-marker" id="gantt-today-marker"></div>
                </div>
            </div>
            <div class="gantt-rows">
    `;

    if (implantacoesFiltradas.length === 0) {
        html += `<div class="gantt-empty">Nenhuma implantação encontrada para ${anoSelecionado}</div>`;
    }

    implantacoesFiltradas.forEach(imp => {
        const statusDom = obterStatusDominante(imp);
        const progresso = temGoLiveConcluido(imp) ? 100 : (imp.progresso || 0);
        const rowMinHeight = 52;
        const barHeight = 26;
        const topPx = (rowMinHeight - barHeight) / 2;

        html += `
            <div class="gantt-row" data-id="${imp.id}" style="min-height:${rowMinHeight}px;">
                <div class="gantt-label-col" style="min-height:${rowMinHeight}px;">
                    <div class="gantt-label-empresa">${imp.empresa}</div>
                    <div class="gantt-label-meta">${imp.projeto} · ${imp.sistema}</div>
                    <div class="gantt-label-progress">
                        <div class="gantt-progress-mini" style="width:${progresso}%" title="${progresso}%"></div>
                    </div>
                </div>
                <div class="gantt-chart-col gantt-bars-area" style="position:relative;min-height:${rowMinHeight}px;">
        `;

        // Calcular range do projeto: início da 1ª fase até fim da última fase
        const fasesComDatas = (imp.fases || []).filter(f => f.inicio && f.fim);
        let barLeft = null, barRight = null;

        // CAMADA 1: fases com datas explícitas
        if (fasesComDatas.length > 0) {
            fasesComDatas.forEach(f => {
                const ini = new Date(f.inicio);
                const fim = new Date(f.fim);
                if (!barLeft || ini < barLeft) barLeft = ini;
                if (!barRight || fim > barRight) barRight = fim;
            });
        }

        // CAMADA 2: statusMeses via obterStatusMesesPorAno
        if (!barLeft) {
            const statusMesesAno = obterStatusMesesPorAno(imp, anoSelecionado);
            let primeiroMes = -1, ultimoMes = -1;
            meses.forEach((m, i) => {
                const semanas = statusMesesAno[m] || [];
                if (semanas.some(s => s && s !== 'sem-dados')) {
                    if (primeiroMes === -1) primeiroMes = i;
                    ultimoMes = i;
                }
            });
            if (primeiroMes >= 0) {
                barLeft = new Date(anoSelecionado, primeiroMes, 1);
                barRight = new Date(anoSelecionado, ultimoMes + 1, 0);
            }
        }

        // CAMADA 3: statusMeses formato antigo (chaves diretas de mês)
        if (!barLeft && imp.statusMeses) {
            let primeiroMes = -1, ultimoMes = -1;
            meses.forEach((m, i) => {
                const semanas = imp.statusMeses[m] || [];
                if (Array.isArray(semanas) && semanas.some(s => s && s !== 'sem-dados')) {
                    if (primeiroMes === -1) primeiroMes = i;
                    ultimoMes = i;
                }
            });
            if (primeiroMes >= 0) {
                barLeft = new Date(anoSelecionado, primeiroMes, 1);
                barRight = new Date(anoSelecionado, ultimoMes + 1, 0);
            }
        }

        // CAMADA 4: statusMeses com chave do ano (ex: { 2025: { janeiro: [...] } })
        if (!barLeft && imp.statusMeses && imp.statusMeses[anoSelecionado]) {
            const sm = imp.statusMeses[anoSelecionado];
            let primeiroMes = -1, ultimoMes = -1;
            meses.forEach((m, i) => {
                const semanas = sm[m] || [];
                if (Array.isArray(semanas) && semanas.some(s => s && s !== 'sem-dados')) {
                    if (primeiroMes === -1) primeiroMes = i;
                    ultimoMes = i;
                }
            });
            if (primeiroMes >= 0) {
                barLeft = new Date(anoSelecionado, primeiroMes, 1);
                barRight = new Date(anoSelecionado, ultimoMes + 1, 0);
            }
        }

        // CAMADA 5: fases sem data mas com previsto > 0 — estimar posição pelo progresso
        if (!barLeft && imp.fases && imp.fases.length > 0) {
            // Nenhuma data disponível: mostrar barra ocupando o ano inteiro com cor do status
            barLeft = dataInicio;
            barRight = dataFim;
        }

        console.log('[Gantt Bar]', imp.empresa, '| barLeft:', barLeft, '| barRight:', barRight,
            '| fases c/ data:', fasesComDatas.length,
            '| statusMeses keys:', imp.statusMeses ? Object.keys(imp.statusMeses).slice(0,3) : 'null');

        if (barLeft && barRight) {
            // Clampar ao ano selecionado
            const clampIni = barLeft < dataInicio ? dataInicio : barLeft;
            const clampFim = barRight > dataFim ? dataFim : barRight;

            if (clampIni <= dataFim && clampFim >= dataInicio) {
                const offsetDias = Math.floor((clampIni - dataInicio) / (1000 * 60 * 60 * 24));
                const duracaoDias = Math.ceil((clampFim - clampIni) / (1000 * 60 * 60 * 24)) + 1;
                const left = (offsetDias / totalDias * 100).toFixed(3);
                const width = Math.max(duracaoDias / totalDias * 100, 0.8).toFixed(3);

                const fmtDate = d => d.toLocaleDateString('pt-BR');
                const barTitle = `${imp.empresa} | ${getStatusLabel(statusDom)} | ${fmtDate(barLeft)} → ${fmtDate(barRight)} | ${progresso}%`;

                // Barra com preenchimento de progresso interno
                const progressWidth = Math.min(progresso, 100);
                html += `
                    <div class="gantt-bar gantt-bar-${statusDom} gantt-bar-single"
                         style="left:${left}%;width:${width}%;top:${topPx}px;height:${barHeight}px;transform:none;"
                         title="${barTitle}">
                        <div class="gantt-bar-progress" style="width:${progressWidth}%"></div>
                        <span class="gantt-bar-label">${imp.empresa}</span>
                    </div>
                `;
            }
        } else {
            // Sem dados: barra fantasma
            html += `
                <div class="gantt-bar gantt-bar-semDados gantt-bar-single"
                     style="left:2%;width:96%;top:${topPx}px;height:${barHeight}px;transform:none;"
                     title="Sem dados de período">
                    <span class="gantt-bar-label" style="opacity:0.5">${imp.empresa}</span>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    ganttContainer.innerHTML = html;

    // Posicionar marcador de hoje
    const hoje = new Date();
    if (hoje.getFullYear() === anoSelecionado) {
        const diasPassados = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
        const pct = (diasPassados / totalDias * 100).toFixed(3);
        const marker = document.getElementById('gantt-today-marker');
        if (marker) {
            marker.style.left = pct + '%';
            marker.style.display = 'block';
        }
    }

    // Event listeners para tooltip e clique
    // Tooltip global único (fora do scroll container)
    let globalTooltip = document.getElementById('gantt-global-tooltip');
    if (!globalTooltip) {
        globalTooltip = document.createElement('div');
        globalTooltip.id = 'gantt-global-tooltip';
        globalTooltip.className = 'gantt-tooltip';
        document.body.appendChild(globalTooltip);
    }

    ganttContainer.querySelectorAll('.gantt-row').forEach(row => {
        const id = parseInt(row.dataset.id);
        const imp = implantacoes.find(i => i.id == id);
        if (!imp) return;

        const statusDomRow = obterStatusDominante(imp);
        const progressoRow = temGoLiveConcluido(imp) ? 100 : (imp.progresso || 0);
        const tooltipHTML = buildTooltipData(imp, statusDomRow, progressoRow);

        row.addEventListener('mouseenter', () => {
            globalTooltip.innerHTML = tooltipHTML;
            globalTooltip.classList.add('visible');
        });
        row.addEventListener('mouseleave', () => {
            globalTooltip.classList.remove('visible');
        });
        row.addEventListener('mousemove', (e) => {
            const ttW = 320;
            const ttH = globalTooltip.offsetHeight || 280;
            let x = e.clientX + 18;
            let y = e.clientY + 12;

            if (x + ttW > window.innerWidth - 10) x = e.clientX - ttW - 18;
            if (y + ttH > window.innerHeight - 10) y = e.clientY - ttH - 12;
            if (y < 10) y = 10;
            if (x < 10) x = 10;

            globalTooltip.style.left = x + 'px';
            globalTooltip.style.top = y + 'px';
        });
    });

    // Esconder tooltip ao sair do container inteiro
    ganttContainer.addEventListener('mouseleave', () => {
        globalTooltip.classList.remove('visible');
    });

    // Clique nas rows
    ganttContainer.querySelectorAll('.gantt-row').forEach(row => {
        const id = parseInt(row.dataset.id);
        const imp = implantacoes.find(i => i.id == id);
        if (imp) {
            row.addEventListener('click', () => exibirStatusImplantacao(imp));
        }
    });
}

function buildTooltipData(imp, statusDom, progresso) {
    const statusLabel = getStatusLabel(statusDom);
    const statusColor = {
        'pendente': '#f39c12',
        'andamento': '#3498db',
        'atrasado': '#e74c3c',
        'concluido-prazo': '#27ae60',
        'concluido-fora': '#e67e22',
    }[statusDom] || '#999';

    const kickOff = getDataKickOff(imp);
    const goLive = getDataGoLive(imp);
    const fmtDate = d => d ? d.toLocaleDateString('pt-BR') : '-';

    const fasesHtml = (imp.fases || []).slice(0, 6).map(f => {
        const cor = {
            'pendente': '#f39c12', 'andamento': '#3498db', 'atrasado': '#e74c3c',
            'concluido-prazo': '#27ae60', 'concluido-fora': '#e67e22'
        }[f.status] || '#ccc';
        return `<div class="tt-fase"><span class="tt-fase-dot" style="background:${cor}"></span>${f.nome}</div>`;
    }).join('');

    return `
        <div class="tt-header">
            <strong>${imp.empresa}</strong>
            <span class="tt-badge" style="background:${statusColor}">${statusLabel}</span>
        </div>
        <div class="tt-row"><span>Projeto</span><span>${imp.projeto}</span></div>
        <div class="tt-row"><span>Sistema</span><span>${imp.sistema}</span></div>
        <div class="tt-row"><span>Gestor</span><span>${imp.gestor || '-'}</span></div>
        <div class="tt-row"><span>Especialista</span><span>${imp.especialista || '-'}</span></div>
        <div class="tt-row"><span>Progresso</span><span>${progresso}%</span></div>
        <div class="tt-row"><span>Kick Off</span><span>${fmtDate(kickOff)}</span></div>
        <div class="tt-row"><span>Go Live</span><span>${fmtDate(goLive)}</span></div>
        ${fasesHtml ? `<div class="tt-fases-title">Fases</div>${fasesHtml}` : ''}
    `;
}
