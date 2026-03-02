/**
 * Tryviano Knowledge Base - Base de Conhecimento Inteligente
 * 
 * Este módulo contém:
 * - Conhecimento sobre sistemas (SING, OPT+z, YUV, etc.)
 * - Procedimentos de resolução comuns
 * - FAQ de problemas frequentes
 * - Busca inteligente de tickets similares
 * - Cruzamento de informações
 */

(function () {
    'use strict';

    const TryvianoKnowledge = {
        /**
         * Analisa um ticket resolvido e sugere criação de conhecimento
         */
        sugerirConhecimento(ticket) {
            if (!ticket || (ticket.status !== '4' && ticket.status !== '5')) return null;

            // Ignorar se descrição for muito curta
            if (!ticket.description_text || ticket.description_text.length < 50) return null;

            return {
                titulo: `Sugestão baseada no Ticket #${ticket.id}`,
                pergunta: ticket.subject,
                resposta: `Resolução baseada no ticket #${ticket.id}: ${ticket.description_text.substring(0, 200)}...`,
                tags: ['auto-gerado', 'ticket-resolvido'],
                ticket_origem: ticket.id
            };
        },

        // ============================================
        // BASE DE CONHECIMENTO POR SISTEMA
        // ============================================

        sistemas: {
            'SING': {
                nome: 'SING',
                descricao: 'Sistema de Gestão Integrada',
                categorias: ['cadastro', 'login', 'relatórios', 'sincronização', 'permissões'],
                problemas_comuns: {
                    'cadastro': {
                        descricao: 'Problemas relacionados a cadastro de clientes, veículos, motoristas',
                        solucoes: [
                            'Verificar se todos os campos obrigatórios estão preenchidos',
                            'Confirmar se o CPF/CNPJ já não existe no sistema',
                            'Validar formato dos dados (telefone, email, placa)',
                            'Verificar permissões do usuário para cadastro'
                        ],
                        palavras_chave: ['cadastro', 'incluir', 'adicionar', 'novo', 'criar', 'registro']
                    },
                    'login': {
                        descricao: 'Problemas de acesso e autenticação',
                        solucoes: [
                            'Verificar se o usuário está ativo no sistema',
                            'Confirmar senha correta (case sensitive)',
                            'Limpar cache e cookies do navegador',
                            'Verificar se não há bloqueio por tentativas erradas'
                        ],
                        palavras_chave: ['login', 'acesso', 'senha', 'entrar', 'autenticação', 'bloqueado']
                    },
                    'sincronização': {
                        descricao: 'Problemas de sincronização de dados',
                        solucoes: [
                            'Verificar conexão com internet',
                            'Aguardar o ciclo de sincronização (a cada 5 minutos)',
                            'Verificar se há conflitos de dados',
                            'Forçar sincronização manual se disponível'
                        ],
                        palavras_chave: ['sincronizar', 'sync', 'atualizar', 'dados', 'não aparece']
                    }
                },
                links_uteis: [
                    { titulo: 'Manual SING', url: 'https://docs.tryvia.com/sing' }
                ]
            },

            'OPT+z': {
                nome: 'OPT+z (Otimizador de Rotas)',
                descricao: 'Sistema de otimização e gestão de rotas de transporte. Possui módulos de Tráfego, Coordenação, Planejamento, Cadastros Avançados, Conexão de Serviços, Viagem Vazia e Planilha Modelo de importação.',
                categorias: ['rotas', 'gantt', 'carro_fujao', 'pedras', 'coordenação', 'tráfego', 'conexão', 'viagem_vazia', 'cadastros', 'planilha', 'importação', 'otimização', 'liberação', 'encerramento', 'tripulante', 'motorista'],
                funcionalidades: {
                    // ===========================
                    // MÓDULO DE TRÁFEGO (COMPLETO)
                    // ===========================
                    'trafego': {
                        nome: 'Módulo de Tráfego',
                        descricao: 'Apresenta viagens em formato de lista com controle operacional completo. Tanto Tráfego quanto Coordenação exibem as mesmas informações, porém de formas distintas: Tráfego em formato de lista, Coordenação de forma mais interativa com pedras.',
                        funcoes_principais: [
                            'Liberação: registro do horário em que o veículo e motorista(s) deixam a localidade de origem do serviço',
                            'Encerramento: registro do horário em que o veículo e motorista(s) chegam à localidade de destino',
                            'Aba Liberação: exibe viagens que ainda aguardam registro de Liberação',
                            'Aba Encerramento: exibe viagens que já foram liberadas e aguardam o registro de Encerramento',
                            'Aba Realizado: exibe viagens com ambos registros (Liberação + Encerramento)',
                            'Aba Todas: exibe todas as viagens independente do status'
                        ],
                        como_acessar: 'Menu lateral (side-bar) > Tráfego. Use a seta no canto inferior esquerdo para expandir o menu.',
                        sinalizacoes_bolinhas: [
                            '1ª Bolinha - Ciência da Viagem: Amarela = pendente, Azul = motorista visualizou mas não confirmou, Verde = motorista confirmou a viagem',
                            '2ª Bolinha - Apresentação do Motorista: Amarela = pendente, Verde = motorista registrou início do expediente',
                            'A apresentação pode ser registrada: pelo próprio motorista (Portal Minha Escala), pela equipe de Tráfego (três pontinhos da viagem), ou por integração com sistemas de terceiros'
                        ],
                        opcoes_gestao: [
                            'Editar Serviço: acessar janela com todas as informações da viagem para alterar qualquer dado',
                            'Copiar Serviço: criar nova viagem usando dados de viagem existente como referência (origem, destino, etapas, duração, frequência, linha)',
                            'Detalhes: visualizar informações detalhadas da viagem selecionada',
                            'Trocar Veículo: informar novo veículo e motivo da alteração',
                            'Sugerir Veículo: ver lista de veículos disponíveis e selecionar o mais adequado',
                            'Cadastrar Ocorrência: abre janela de Nova Ocorrência com campo Serviço já preenchido',
                            'Trocar Tripulante: informar novo tripulante e motivo da substituição',
                            'Sugerir Tripulante: ver lista de tripulantes disponíveis para selecionar'
                        ],
                        pesquisa_filtros: [
                            'Barra de pesquisa: filtra viagens por código, linhas, origens e destinos',
                            'Filtros avançados: ícone no campo superior direito, permite critérios específicos'
                        ],
                        dicas: [
                            'Bolinha Amarela = Pendente (motorista não viu)',
                            'Bolinha Azul = Motorista visualizou mas NÃO confirmou',
                            'Bolinha Verde = Motorista confirmou/se apresentou',
                            'Use os "três pontinhos" no serviço para acessar todas as opções de gestão',
                            'Após Liberação, viagem vai para aba Encerramento automaticamente',
                            'Após Encerramento, viagem vai para aba Realizado',
                            'Se não houver viagens no dia selecionado, o sistema mostrará tela vazia'
                        ]
                    },

                    // ================================
                    // MÓDULO DE COORDENAÇÃO (COMPLETO)
                    // ================================
                    'coordenacao': {
                        nome: 'Módulo de Coordenação',
                        descricao: 'Gestão operacional interativa com representação por pedras (serviços). Exibe as mesmas informações do Tráfego porém com recursos de arraste e visualização Gantt. Disponível no menu lateral via side-bar > Coordenação.',
                        funcoes_principais: [
                            'Visualização Gantt: representação visual por pedras (serviços) com arraste',
                            'Visualizar Frota: ver toda a frota e sua distribuição',
                            'Painel de Ocorrências: visualiza eventos (atrasos, problemas)',
                            'Gestão de Entregas: status (pendente, em rota, entregue)',
                            'Comunicação: enviar mensagens via app ao motorista',
                            'Reprogramação: reagendar entregas em tempo real',
                            'Alertas SLA: notificações de risco de atraso'
                        ],
                        como_acessar: 'Menu lateral (side-bar) > Coordenação. Ao passar o mouse aparece modal flutuante com funcionalidades, use "Visualizar frota".',
                        dicas: [
                            'Use o filtro "Críticos" para ver entregas em risco',
                            'O ícone de mensagem permite falar diretamente com o motorista',
                            'Entregas em vermelho estão fora do SLA',
                            'Pedras podem ser arrastadas entre veículos'
                        ]
                    },

                    // ============================================
                    // CONEXÃO DE SERVIÇOS (MANUAL COMPLETO - 11 SEÇÕES)
                    // ============================================
                    'conexao_servicos': {
                        nome: 'Conexão de Serviços',
                        descricao: 'Permite informar ao otimizador que dois ou mais serviços devem ser tratados como um único bloco lógico indivisível. Durante todo o intervalo coberto pela conexão, o veículo envolvido não pode executar qualquer outro serviço, viagem vazia ou deslocamento. Do ponto de vista do algoritmo, uma conexão transforma múltiplos serviços independentes em uma única peça longa, equivalente a uma grande pedra de dominó.',
                        conceito_fundamental: 'A conexão transforma múltiplos serviços independentes em uma única peça longa (como uma grande pedra de dominó) que começa no início do primeiro serviço conectado e termina apenas no final do último. O veículo fica 100% dedicado.',
                        motivacao_negocio: 'Criada para cenários de fretamento, turismo e eventos onde o veículo precisa permanecer dedicado a um grupo por longos períodos, mesmo com grandes intervalos entre ida e volta.',
                        casos_uso: [
                            'Rock in Rio: ônibus sai de Vitória à tarde, chega ao RJ, e só retorna na madrugada. O veículo NÃO pode ser realocado durante todo esse período.',
                            'Beto Carrero World: ônibus leva passageiros, fica parado por 1-2 dias e depois retorna. Veículo bloqueado todo o período.',
                            'Fretamento contínuo: qualquer cenário onde o mesmo veículo deve fazer ida e volta de um grupo específico.',
                            'Resort: ônibus chega sexta à noite e só retorna domingo à tarde. Mesmo com 24h+ de intervalo, veículo permanece bloqueado.'
                        ],
                        como_definir: [
                            'A conexão é definida no momento da importação via planilha',
                            'Cada serviço na mesma conexão deve compartilhar o MESMO identificador de conexão',
                            'REGRA CRÍTICA: cada linha de serviço deve representar apenas UM dia da semana',
                            'Serviços com múltiplos dias na mesma linha INVIABILIZAM a identificação correta da conexão'
                        ],
                        validacoes_importacao: [
                            'Sistema verifica se serviços conectados realmente existem',
                            'Verifica se datas são compatíveis',
                            'Verifica se conexão ocorre sempre para frente no tempo',
                            'Verifica colagem de cabeceira entre serviços',
                            'BLOQUEADO: conectar serviço a ele mesmo',
                            'BLOQUEADO: conectar serviços que começam antes do anterior',
                            'BLOQUEADO: conectar serviços com origem incompatível'
                        ],
                        algoritmo_otimizacao: 'Antes de iniciar a otimização, o algoritmo identifica todas as conexões e transforma cada conjunto em uma única estrutura indivisível. Isso IMPEDE que o algoritmo encaixe serviços intermediários, viagens vazias ou deslocamentos dentro do intervalo.',
                        representacao_gantt: 'No Gantt, serviços conectados aparecem agrupados com CONTORNO TRACEJADO, indicando bloco contínuo e indivisível.',
                        relacao_viagem_vazia: [
                            'A Conexão de Serviços possui PRIORIDADE ABSOLUTA sobre a Viagem Vazia',
                            'NENHUMA viagem vazia pode ser inserida entre serviços conectados',
                            'Se fosse permitido, o objetivo da conexão seria violado (veículo deixaria de estar dedicado)'
                        ],
                        desconexao: [
                            'Pode ser realizada manualmente em um cenário específico',
                            'Libera o bloco apenas naquele cenário',
                            'A definição original na planilha permanece intacta',
                            'Voltará a ser aplicada em futuras otimizações'
                        ],
                        impacto_estrategico: 'A utilização de conexões REDUZ a eficiência da otimização em economia de frota (algoritmo perde flexibilidade). Essa perda é INTENCIONAL e necessária. A decisão de usar conexões é ESTRATÉGICA e deve ser tomada com base na operação real.',
                        visao_consolidada: 'A Conexão de Serviços é uma funcionalidade CRÍTICA para cenários que exigem dedicação exclusiva de veículos. Ela NÃO existe para otimizar frota, mas para GARANTIR confiabilidade operacional. Evita riscos, garante previsibilidade e mantém a integridade da operação.',
                        dicas: [
                            'Útil para garantir que o mesmo ônibus faça a ida e a volta',
                            'No Gantt aparecem com contorno tracejado',
                            'Cada linha de serviço deve representar apenas UM dia',
                            'A desconexão manual vale só para aquele cenário',
                            'Conexões reduzem eficiência da frota — isso é intencional e necessário'
                        ]
                    },

                    // ============================================
                    // VIAGEM VAZIA 2.0 (MANUAL COMPLETO)
                    // ============================================
                    'viagem_vazia': {
                        nome: 'Viagem Vazia 2.0',
                        descricao: 'Quando habilitada, permite que o otimizador considere deslocamentos sem passageiros (viagens vazias) para reposicionar veículos geograficamente e viabilizar novos serviços. A viagem vazia NÃO é desperdício — é uma estratégia operacional para melhorar a otimização da frota.',
                        definicao_completa: 'Uma viagem vazia é o deslocamento realizado por um veículo SEM passageiros, com o objetivo de reposicioná-lo até uma localidade onde possa atender a um serviço. Não é tratado como erro nem como desperdício.',
                        exemplo_pratico: 'Existe um serviço alocado em São Paulo e um novo serviço no Rio de Janeiro. O deslocamento SP→RJ sem passageiros é registrado como viagem vazia, permitindo atender o serviço seguinte.',
                        papel_no_sistema: [
                            'Quando habilitada, o sistema deixa de considerar apenas serviços imediatamente executáveis',
                            'Passa a considerar deslocamentos sem passageiros como parte do planejamento',
                            'Esses deslocamentos permitem reposicionar o veículo geograficamente',
                            'A viagem vazia NÃO é um objetivo final, mas um MEIO para alcançar um serviço real'
                        ],
                        sem_viagem_vazia: [
                            'Sem viagem vazia, o otimizador só pode alocar serviços que caibam na mesma posição geográfica',
                            'Veículo que termina em SP só pode pegar serviço que começa em SP',
                            'Resultado: mais veículos necessários, menor aproveitamento'
                        ],
                        com_viagem_vazia: [
                            'O otimizador busca "buracos" na escala e verifica se um deslocamento vazio viabiliza um novo serviço',
                            'Pode reduzir a frota necessária mas aumenta KM rodado',
                            'Trade-off: menos veículos vs mais quilometragem vazia'
                        ],
                        combinatoria: [
                            'Permite encadear múltiplas viagens vazias seguidas (padrão: até 5)',
                            'Exemplo: SP→Campinas (vazia) + Campinas→Ribeirão (vazia) + Ribeirão→Uberlândia (serviço)',
                            'Quanto maior a combinatória, mais possibilidades o otimizador encontra',
                            'CUIDADO: combinatória alta pode gerar tempos de cálculo muito longos'
                        ],
                        beneficios: [
                            'Redução de frota necessária',
                            'Aproveitamento de veículos ociosos',
                            'Oportunidade de venda de assentos em viagens vazias (receita extra)',
                            'Melhor distribuição geográfica da frota'
                        ],
                        regras: [
                            'Viagem vazia NÃO pode ser inserida entre serviços conectados (Conexão tem prioridade absoluta)',
                            'O otimizador calcula se o benefício (economia de veículo) compensa o custo (KM extra)',
                            'Resultado depende da distribuição geográfica dos serviços no cenário'
                        ],
                        dicas: [
                            'Habilite viagem vazia quando quer reduzir frota e aceita mais KM',
                            'Desabilite quando KM rodado é mais importante que redução de frota',
                            'A Combinatória controla quantas viagens vazias seguidas são permitidas',
                            'Combinatória muito alta pode tornar o cálculo lento',
                            'Avalie o trade-off: menos veículos vs mais quilometragem vazia'
                        ]
                    },

                    // ================================================
                    // CADASTROS AVANÇADOS (MANUAL COMPLETO)
                    // ================================================
                    'cadastros_avancados': {
                        nome: 'Cadastros e Parâmetros',
                        descricao: 'Gestão de Tipos de Serviço, Agrupadores (Tags) e Locais. Esses cadastros são fundamentais para o funcionamento do sistema.',
                        tipos_servico: {
                            descricao: 'Define como cada tipo de serviço se comporta no sistema (cor no Gantt, prioridade, GPS, etc.)',
                            como_cadastrar: [
                                'Botão verde "Novo Tipo" no canto superior esquerdo',
                                'Preencher CÓDIGO (ex: TS, HO, VE) — como o sistema se referirá ao tipo',
                                'Preencher DESCRIÇÃO — nome completo do tipo de serviço'
                            ],
                            parametrizacoes: [
                                'Prioridade na Otimização: se deve ter prioridade na hora da otimização',
                                'Validação do sistema de vendas: confere se o tipo existe no sistema de vendas',
                                'Captura de GPS: se terá captura de GPS (caso tenha integração)',
                                'Monitriip: caso utilize a integração com Monitriip',
                                'Exibir em Frota e Tripulante: SEMPRE manter ativadas (exibição no Gantt)',
                                'Plantão: somente selecionar se o tipo exige plantão',
                                'Cor: escolher cor DISTINTA para diferenciar no Gantt',
                                'Vigência: colocar 01/01/2025 até 01/01/9999 (ou 2099) para não expirar'
                            ]
                        },
                        agrupadores_tags: {
                            descricao: 'Recursos de classificação para organizar Veículos, Tripulantes e Serviços em grupos.',
                            o_que_classifica: ['Veículos', 'Tripulantes', 'Serviços'],
                            exemplo_pratico: 'Separar motoristas interestaduais em grupo específico.',
                            como_configurar: [
                                'No canto superior direito > "Criar Agrupador/Tag"',
                                'Preencher Código (ex: INTERESTADUAIS)',
                                'Preencher Nome/Descrição (ex: MOTORISTAS INTERESTADUAIS)',
                                'Escolher cor de identificação',
                                'Definir período de vigência (usar padrão sugerido)',
                                'Clicar em Salvar',
                                'Após criação, vincular ao cadastro de motoristas, veículos ou serviços',
                                'Use para aplicar filtros e organizar informações no sistema'
                            ]
                        },
                        locais: {
                            descricao: 'Cadastro de tipos de locais por onde os veículos passam (garagem, pedágio, rodoviária etc.).',
                            parametrizacoes: [
                                'Possui desembarque ou embarque',
                                'Possui troca de tripulantes',
                                'Possui integração com vendas'
                            ],
                            opcoes_tres_pontinhos: [
                                'Exportação de dados: exporta todos dados cadastrados',
                                'Importação de dados: importação massiva via planilha Excel',
                                'Exportar modelo: exporta planilha vazia para preenchimento'
                            ]
                        },
                        dicas: [
                            'SEMPRE defina vigência longa (até 2099) para evitar expiração',
                            'Use cores DISTINTAS para cada tipo de serviço no Gantt',
                            'SEMPRE mantenha "Exibir em Frota e Tripulante" ativadas',
                            'Use Agrupadores/Tags para melhor organização e filtros rápidos',
                            'Locais podem ser importados em massa via planilha Excel (3 pontinhos > Importação)',
                            'Código do tipo de serviço deve ser curto e descritivo (TS, HO, VE)'
                        ]
                    },

                    // ================================================
                    // PLANILHA MODELO / IMPORTAÇÃO (MANUAL COMPLETO)
                    // ================================================
                    'planilha_modelo': {
                        nome: 'Preenchimento da Planilha Modelo OPTZ',
                        descricao: 'Manual completo de preenchimento da planilha usada para importar cenários operacionais no OPTZ. Cada linha corresponde a uma ETAPA de um serviço. Mesmo serviço direto (origem→destino) precisa existir com pelo menos a Etapa 1.',
                        estrutura_conceitual: 'Cada linha = uma ETAPA de um serviço. O sistema trata cada serviço como entidade independente após importação. Qualquer inconsistência pode gerar conflito individual em apenas um dia do período.',
                        colunas_identificacao: [
                            'EMPRESA: define empresa proprietária do cenário (vinculação institucional, separação multiempresa)',
                            'SERVIÇO: código/nome identificador usado para edição por período, relatórios, conexão e rastreabilidade',
                            'ETAPA/SEÇÃO: divide serviço em partes sequenciais. Ex: SP→Aparecida→Penedo→Resende→RJ. Cada etapa gera uma sessão interna que impacta jornada, troca de tripulante, pedágio e conexões'
                        ],
                        classificacao_operacional: [
                            'FROTA: deve existir previamente no cadastro. Define restrições de veículo e regras de otimização',
                            'LINHA: deve estar cadastrada. Validação de rota permitida; pode gerar conflito se veículo não autorizado',
                            'TIPO: Ex: FT (Fretamento), VD (Vendas). Influencia prioridade na otimização e integração com vendas'
                        ],
                        frequencia: 'Preencher com "S" indica operação no dia. Vazio = sem operação. Sistema gera serviços apenas para dias marcados. Marcação incorreta gera serviços indesejados ou ausência de serviços.',
                        tempos_operacionais: [
                            'LOCAL (LIB.): local de saída operacional',
                            'D.O. (LIB.): tempo de organização antes da partida',
                            'T.E.: tempo de embarque',
                            'T.D.: tempo de desembarque',
                            'LOCAL (REC.): local de recolhimento',
                            'D.O. (REC.): tempo de recolhimento',
                            'T.P.: tempo de preparação para próxima viagem',
                            'IMPACTO: Esses tempos afetam disponibilidade do veículo e podem gerar sobreposição de escala'
                        ],
                        horarios_vigencia: [
                            'PARTIDA e CHEGADA devem ser coerentes com duração real',
                            'Viagem que atravessa meia-noite: sistema ajusta dia relativo automaticamente',
                            'INI VIGÊNCIA recomendado: 01/01/2000',
                            'FIM VIGÊNCIA recomendado: 01/01/2999',
                            'Serviços fora da vigência NÃO são considerados em otimizações futuras'
                        ],
                        tripulantes: {
                            descricao: 'Seção que impacta jornada, troca de motorista, validações sindicais e possíveis conflitos na escala.',
                            intervalos: 'Formato: I [dia] [hora início] [hora fim]. Ex: I 0 10:30 11:00; I 0 14:00 14:30 — dois intervalos no dia inicial da viagem. Usado para validar jornada máxima e descanso mínimo.',
                            diarias: 'Formato: [dia] [refeições]. Ex: 1 CAJ; 2 CAJ — No dia 1 e 2, Café, Almoço e Janta. Utilizado para cálculo de custo operacional e relatórios.'
                        },
                        validacoes_importacao: [
                            'Conflito de horário entre serviços',
                            'Extrapolação de jornada',
                            'Intervalo insuficiente',
                            'Incompatibilidade de veículo com linha',
                            'Incompatibilidade de tripulante com base operacional',
                            'Quando ocorre conflito, sistema pode BLOQUEAR importação ou enviar para ÁREA DE TRANSFERÊNCIA'
                        ],
                        impacto_otimizacao: [
                            'Dados INCORRETOS: mais frota necessária, impossibilidade de conexão, viagens vazias excessivas, conflitos na coordenação',
                            'Dados CORRETOS: melhor aproveitamento de veículos, menor frota, estabilidade operacional'
                        ],
                        boas_praticas: [
                            'Conferir coerência de horários antes de importar',
                            'Validar jornada antes de importar',
                            'Garantir que cadastros base estejam corretos (Frota, Linha, Tipo)',
                            'Cada linha deve representar apenas UM dia da semana',
                            'Vigência longa para não perder serviços em otimizações futuras'
                        ]
                    },

                    // ===========================
                    // GANTT E PEDRAS
                    // ===========================
                    'gantt': {
                        nome: 'Visualização Gantt e Pedras',
                        descricao: 'Linha do tempo visual usada na Coordenação. As "pedras" representam serviços e podem ser manipuladas.',
                        tipos_pedras: [
                            'Verde: Concluída/No prazo',
                            'Amarela: Em andamento/Atenção',
                            'Vermelha: Atraso crítico/Problema',
                            'Cinza: Cancelada/Não iniciada',
                            'Azul: Em pausa',
                            'Contorno Tracejado: indica serviço CONECTADO (parte de uma Conexão de Serviços)'
                        ],
                        funcionalidades: [
                            'Arrasto: mover serviço entre veículos',
                            'Alt+Arrasto: ajustar horário do serviço',
                            'Desmembrar: dividir viagem (ex: em caso de quebra)',
                            'Assistente de Escala: sugere próxima viagem ideal para o veículo'
                        ],
                        dicas: [
                            'Pedra com contorno tracejado = serviço conectado — não pode ser separado',
                            'Use "Área de Transferência" para serviços que sumiram',
                            'Cores dos tipos de serviço são definidas nos Cadastros'
                        ]
                    },

                    // ===========================
                    // CARRO FUJÃO
                    // ===========================
                    'carro_fujao': {
                        nome: 'Carro Fujão 2.0',
                        descricao: 'Detecção automática de desvios de rota comparando GPS real com trajeto planejado.',
                        configuracoes: ['Tolerância de desvio (padrão 500m)', 'Tempo mínimo fora da rota (padrão 5min)'],
                        dicas: [
                            'Sempre verifique GPS antes de cobrar o motorista',
                            'Desvios podem ser legítimos (trânsito, obra)',
                            'O sistema compara posição GPS real com a rota planejada'
                        ]
                    }
                },
                problemas_comuns: {
                    'importacao': {
                        descricao: 'Erros na importação da Planilha Modelo',
                        solucoes: [
                            'Verificar se colunas obrigatórias estão preenchidas (Empresa, Serviço, Etapa)',
                            'Validar formato de hora e datas',
                            'Garantir que Frota e Linha já estão cadastrados no sistema',
                            'Cada linha deve representar apenas UM dia',
                            'Vigência recomendada: 01/01/2000 a 01/01/2999',
                            'Verificar PARTIDA e CHEGADA coerentes com duração real',
                            'Viagem que cruza meia-noite: sistema ajusta automaticamente',
                            'Se serviço for para Área de Transferência, verificar conflitos de horário ou jornada'
                        ],
                        palavras_chave: ['importar', 'planilha', 'excel', 'erro', 'falha', 'etapa', 'coluna', 'modelo']
                    },
                    'gantt': {
                        descricao: 'Dúvidas sobre pedras e visualização',
                        solucoes: [
                            'Pedra Vermelha = Atraso Crítico',
                            'Serviço sumiu? Verifique filtros de data ou "Área de Transferência"',
                            'Contorno tracejado indica serviço CONECTADO',
                            'Cores das pedras são configuráveis nos Cadastros > Tipos de Serviço'
                        ],
                        palavras_chave: ['pedra', 'cor', 'vermelha', 'tracejado', 'sumiu', 'gantt']
                    },
                    'otimizacao': {
                        descricao: 'Dúvidas sobre resultado da otimização',
                        solucoes: [
                            'Viagem vazia pode aumentar KM rodado para reduzir necessidade de frota',
                            'Conexão de serviços reduz eficiência de frota mas garante atendimento — é intencional',
                            'Verifique se a Combinatória (nº de viagens vazias seguidas) está limitando',
                            'Dados incorretos na planilha geram resultados ruins de otimização',
                            'Garanta que cadastros base (Frota, Linha, Tipo) estejam corretos'
                        ],
                        palavras_chave: ['otimização', 'frota', 'km', 'custo', 'eficiência', 'resultado', 'combinatória']
                    },
                    'liberacao_encerramento': {
                        descricao: 'Problemas com Liberação e Encerramento de viagens no Tráfego',
                        solucoes: [
                            'Liberação = registrar horário de saída da origem (veículo + motorista)',
                            'Encerramento = registrar horário de chegada ao destino',
                            'Se viagem não aparece na aba Encerramento, verifique se Liberação foi registrada',
                            'Use os "três pontinhos" do serviço para acessar as opções',
                            'Viagem só vai para "Realizado" após ambos registros'
                        ],
                        palavras_chave: ['liberação', 'encerramento', 'realizado', 'aba', 'registrar', 'saída', 'chegada']
                    },
                    'bolinhas': {
                        descricao: 'Dúvidas sobre bolinhas coloridas do Portal Minha Escala',
                        solucoes: [
                            '1ª bolinha: ciência da viagem. Amarela=pendente, Azul=visualizou, Verde=confirmou',
                            '2ª bolinha: apresentação. Amarela=não se apresentou, Verde=se apresentou',
                            'Apresentação pode ser registrada pelo motorista, equipe de tráfego ou integração',
                            'Se bolinha não muda, verificar se motorista acessou o Portal Minha Escala'
                        ],
                        palavras_chave: ['bolinha', 'amarela', 'azul', 'verde', 'minha escala', 'portal', 'motorista', 'apresentação']
                    },
                    'conexao': {
                        descricao: 'Problemas com Conexão de Serviços',
                        solucoes: [
                            'Verificar se serviços têm o mesmo ID de conexão na planilha',
                            'Cada linha deve representar apenas UM dia',
                            'Verificar se datas são compatíveis e avançam no tempo',
                            'Não é possível conectar serviço a ele mesmo',
                            'Não é possível conectar serviço que começa antes do anterior',
                            'Desconexão manual vale apenas para aquele cenário específico'
                        ],
                        palavras_chave: ['conexão', 'conectar', 'desconectar', 'bloco', 'dedicado', 'indivisível']
                    },
                    'cadastros': {
                        descricao: 'Problemas com cadastros do sistema',
                        solucoes: [
                            'Tipo de Serviço não aparece no Gantt? Verificar se "Exibir em Frota e Tripulante" está ativado',
                            'Vigência expirou? Alterar para data futura longa (01/01/2099)',
                            'Para importação massiva de locais: usar os 3 pontinhos > Importação de dados',
                            'Se cadastro de Frota ou Linha não existe, a importação da planilha será bloqueada'
                        ],
                        palavras_chave: ['cadastro', 'tipo', 'agrupador', 'tag', 'local', 'vigência', 'expirou']
                    }
                },
                documentacao: {
                    manual_trafego_coordenacao: 'Manual completo cobrindo: abas (Liberação, Encerramento, Realizado, Todas), bolinhas coloridas, opções de gestão (editar, copiar, trocar veículo/tripulante, sugerir, ocorrência).',
                    manual_conexao_servicos: 'Manual de 11 seções cobrindo: conceito, motivação, definição na planilha, validações, algoritmo, representação Gantt, impacto operacional, relação com viagem vazia, desconexão, impacto estratégico.',
                    manual_viagem_vazia: 'Manual completo cobrindo: definição, papel no sistema, funcionamento sem/com viagem vazia, combinatória, benefícios, regras, relação com conexão.',
                    manual_cadastros: 'Manual cobrindo: Tipos de Serviço (código, descrição, parametrizações), Agrupadores/Tags (classificação de veículos/tripulantes/serviços), Locais (tipos, importação massiva).',
                    manual_planilha_modelo: 'Manual de 10 seções cobrindo: estrutura conceitual, identificação, classificação, frequência, tempos operacionais, horários/vigência, tripulantes (intervalos, diárias), validações, impacto na otimização, boas práticas.'
                }
            },

            'YUV': {
                nome: 'YUV',
                descricao: 'Sistema de gestão de frotas e veículos',
                categorias: ['frota', 'manutenção', 'abastecimento', 'documentos'],
                problemas_comuns: {
                    'frota': {
                        descricao: 'Gestão de frota de veículos',
                        solucoes: [
                            'Verificar cadastro completo do veículo',
                            'Confirmar vínculo com motorista',
                            'Validar documentação em dia'
                        ],
                        palavras_chave: ['frota', 'veículo', 'carro', 'caminhão', 'placa']
                    },
                    'manutenção': {
                        descricao: 'Controle de manutenção preventiva e corretiva',
                        solucoes: [
                            'Verificar agenda de manutenção',
                            'Registrar ocorrência no sistema',
                            'Acompanhar histórico do veículo'
                        ],
                        palavras_chave: ['manutenção', 'reparo', 'oficina', 'pneu', 'óleo']
                    }
                }
            },

            'Telemetria': {
                nome: 'Telemetria',
                descricao: 'Sistema de monitoramento de veículos em tempo real',
                categorias: ['rastreamento', 'alertas', 'relatórios', 'hardware'],
                problemas_comuns: {
                    'rastreamento': {
                        descricao: 'Monitoramento GPS de veículos',
                        solucoes: [
                            'Verificar se equipamento está ligado',
                            'Confirmar sinal GPS na região',
                            'Verificar último ponto recebido',
                            'Reiniciar equipamento se necessário'
                        ],
                        palavras_chave: ['rastreamento', 'gps', 'localização', 'posição', 'tempo real']
                    },
                    'hardware': {
                        descricao: 'Problemas com equipamento de telemetria',
                        solucoes: [
                            'Verificar alimentação do equipamento',
                            'Testar comunicação via SMS de diagnóstico',
                            'Verificar antena GPS e GSM',
                            'Agendar visita técnica se necessário'
                        ],
                        palavras_chave: ['equipamento', 'hardware', 'rastreador', 'antena', 'bateria']
                    }
                }
            },

            'BI': {
                nome: 'BI (Business Intelligence)',
                descricao: 'Sistema de relatórios e análises',
                categorias: ['relatórios', 'dashboards', 'exportação', 'filtros'],
                problemas_comuns: {
                    'relatórios': {
                        descricao: 'Geração e visualização de relatórios',
                        solucoes: [
                            'Verificar período selecionado',
                            'Confirmar permissões de acesso',
                            'Aguardar processamento para períodos longos',
                            'Limpar filtros e tentar novamente'
                        ],
                        palavras_chave: ['relatório', 'report', 'análise', 'dados', 'indicador']
                    }
                }
            },

            'App Motorista': {
                nome: 'App Motorista',
                descricao: 'Aplicativo móvel para motoristas',
                categorias: ['instalação', 'login', 'entregas', 'ocorrências', 'bateria'],
                problemas_comuns: {
                    'app': {
                        descricao: 'Problemas gerais do aplicativo',
                        solucoes: [
                            'Verificar versão do app (atualizar se necessário)',
                            'Limpar cache do aplicativo',
                            'Verificar permissões (GPS, câmera, armazenamento)',
                            'Reinstalar se persistir',
                            'Verificar conexão de internet'
                        ],
                        palavras_chave: ['app', 'aplicativo', 'celular', 'mobile', 'android', 'ios']
                    },
                    'entregas': {
                        descricao: 'Registro de entregas no app',
                        solucoes: [
                            'Verificar se está na rota correta',
                            'Tirar foto com boa iluminação',
                            'Coletar assinatura digital',
                            'Registrar ocorrência se houver problema'
                        ],
                        palavras_chave: ['entrega', 'baixa', 'confirmação', 'assinatura', 'foto']
                    }
                }
            }
        },

        // ============================================
        // FAQ - PERGUNTAS FREQUENTES
        // ============================================

        faq: [
            {
                pergunta: 'O que é Conexão de Serviços no OPT+z?',
                resposta: 'É uma funcionalidade que permite unir dois ou mais serviços como um bloco único. O veículo fica dedicado exclusivamente a esse grupo e não pode receber outras tarefas no intervalo.',
                tags: ['conexão', 'serviço', 'bloco', 'opt+z']
            },
            {
                pergunta: 'Como funciona a Viagem Vazia 2.0?',
                resposta: 'Permite ao otimizador criar deslocamentos sem passageiros para reposicionar veículos, visando reduzir o tamanho total da frota necessária.',
                tags: ['viagem vazia', 'frota', 'otimização', 'deslocamento']
            },
            {
                pergunta: 'O que é a Combinatória na Viagem Vazia?',
                resposta: 'É a configuração que define quantas viagens vazias consecutivas o sistema pode encadear (ex: 2 a 5) para levar o veículo até o próximo serviço.',
                tags: ['combinatória', 'viagem vazia', 'regras']
            },
            {
                pergunta: 'Para que servem os Agrupadores/Tags no Cadastros?',
                resposta: 'Servem para classificar Motoristas, Veículos ou Serviços (ex: "Motoristas Interestaduais"), facilitando filtros e regras específicas.',
                tags: ['agrupador', 'tag', 'classificação', 'filtro']
            },
            {
                pergunta: 'Como resetar senha de usuário?',
                resposta: 'Para resetar senha: 1) Acessar painel Admin, 2) Buscar usuário, 3) Clicar em "Resetar Senha", 4) Nova senha será enviada por email',
                tags: ['senha', 'reset', 'esqueci', 'acesso']
            },
            {
                pergunta: 'Veículo não aparece no mapa',
                resposta: 'Verificar: 1) Equipamento ligado, 2) Última posição recebida, 3) Sinal GPS/GSM na região, 4) Se necessário, solicitar visita técnica',
                tags: ['mapa', 'gps', 'rastreamento', 'não aparece', 'veículo']
            },
            {
                pergunta: 'Como cadastrar novo cliente?',
                resposta: 'Menu Cadastros > Clientes > Novo. Preencher dados obrigatórios: Nome, CNPJ/CPF, Endereço, Contato. Salvar e vincular aos serviços',
                tags: ['cadastro', 'cliente', 'novo', 'incluir']
            },
            {
                pergunta: 'Rota não otimiza corretamente',
                resposta: 'Verificar: 1) Endereços geocodificados, 2) Janelas de horário corretas, 3) Capacidade do veículo, 4) Restrições de acesso. Reprocessar após ajustes',
                tags: ['rota', 'otimização', 'erro', 'incorreto']
            },
            {
                pergunta: 'Erro ao exportar relatório',
                resposta: 'Verificar: 1) Volume de dados (muito grande pode falhar), 2) Formato de exportação, 3) Pop-up blocker do navegador. Tentar período menor ou formato diferente',
                tags: ['exportar', 'relatório', 'erro', 'download']
            },
            {
                pergunta: 'Como funciona a coordenação no OPT+z?',
                resposta: 'O módulo de Coordenação permite gestão operacional em tempo real. Acesse via Menu > Operação > Coordenação. Funções: painel de ocorrências, gestão de entregas, comunicação com motoristas, reprogramação de rotas e alertas de SLA.',
                tags: ['coordenação', 'coordenacao', 'optz', 'opt+z', 'funciona', 'como']
            },
            {
                pergunta: 'O que são as pedras no Gantt?',
                resposta: 'As pedras são indicadores visuais no Gantt do OPT+z: Verde = concluído no prazo, Amarela = atenção necessária, Vermelha = atraso crítico, Cinza = cancelado/não iniciado, Azul = em pausa.',
                tags: ['pedra', 'pedras', 'gantt', 'cor', 'cores', 'significado']
            },
            {
                pergunta: 'O que é Carro Fujão?',
                resposta: 'Carro Fujão 2.0 é o sistema de detecção de desvios de rota. Detecta automaticamente quando um veículo sai do trajeto planejado, gerando alertas para a coordenação investigar.',
                tags: ['carro', 'fujão', 'fujao', 'desvio', 'rota', 'alerta']
            },
            {
                pergunta: 'Como acessar o módulo de Tráfego?',
                resposta: 'Menu principal > Operação > Tráfego. O mapa carrega com veículos ativos. Clique em um veículo para ver detalhes da viagem. Use timeline para histórico de posições.',
                tags: ['tráfego', 'trafego', 'acessar', 'mapa', 'veículos']
            },
            {
                pergunta: 'Qual o procedimento padrão para problemas de cadastro no SING?',
                resposta: 'Procedimento: 1) Verificar campos obrigatórios preenchidos, 2) Conferir se CPF/CNPJ já existe, 3) Validar formato de dados (telefone, email, placa), 4) Verificar permissões do usuário, 5) Se persistir, escalar para desenvolvimento.',
                tags: ['procedimento', 'padrão', 'cadastro', 'sing', 'problema']
            }
        ],

        // ============================================
        // FUNÇÕES DE BUSCA INTELIGENTE
        // ============================================

        /**
         * Busca tickets similares resolvidos para ajudar na solução
         */
        buscarTicketsSimilaresResolvidos(pergunta, tickets, topK = 5) {
            if (!tickets || tickets.length === 0) return [];

            // Extrair palavras-chave da pergunta
            const palavrasChave = this.extrairPalavrasChave(pergunta);

            // Filtrar apenas tickets resolvidos
            const resolvidos = tickets.filter(t => [4, 5].includes(Number(t.status)));

            // Calcular similaridade de cada ticket
            const scored = resolvidos.map(ticket => {
                let score = 0;
                const textoTicket = `${ticket.subject || ''} ${ticket.description_text || ''} ${(ticket.tags || []).join(' ')}`.toLowerCase();

                // Pontuação por palavras-chave encontradas
                palavrasChave.forEach(palavra => {
                    if (textoTicket.includes(palavra)) {
                        score += 10;
                    }
                });

                // Bonus por match exato no assunto
                if (ticket.subject) {
                    const subjectLower = ticket.subject.toLowerCase();
                    palavrasChave.forEach(palavra => {
                        if (subjectLower.includes(palavra)) {
                            score += 5;
                        }
                    });
                }

                // Bonus por sistema mencionado
                const sistemasDetectados = this.detectarSistemas(pergunta);
                const ticketSistemas = this.detectarSistemas(textoTicket);
                sistemasDetectados.forEach(sys => {
                    if (ticketSistemas.includes(sys)) {
                        score += 15;
                    }
                });

                // Bonus se tem resolução/resposta
                if (ticket.conversations && ticket.conversations.length > 0) {
                    score += 3;
                }

                return { ticket, score };
            })
                .filter(s => s.score > 5) // Mínimo de relevância
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);

            return scored.map(s => ({
                id: s.ticket.id,
                subject: s.ticket.subject,
                score: s.score,
                resolved_at: s.ticket.stats_resolved_at,
                tratativa: s.ticket.cf_tratativa,
                tags: s.ticket.tags,
                link: `https://suportetryvia.freshdesk.com/helpdesk/tickets/${s.ticket.id}`
            }));
        },

        /**
         * Normaliza texto: lowercase, remove acentos e caracteres especiais
         */
        normalizeText(text) {
            if (!text) return '';
            return text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s]/g, ' ')
                .trim();
        },

        /**
         * Extrai palavras-chave relevantes de uma pergunta
         */
        extrairPalavrasChave(texto) {
            if (!texto) return [];

            // Palavras a ignorar
            const stopWords = new Set([
                'como', 'fazer', 'para', 'que', 'qual', 'quais', 'quando', 'onde', 'porque',
                'por', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
                'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'e', 'ou', 'mas',
                'se', 'não', 'sim', 'com', 'sem', 'muito', 'mais', 'menos', 'está',
                'ser', 'ter', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela',
                'resolver', 'solucionar', 'ajudar', 'preciso', 'quero', 'gostaria'
            ]);

            return this.normalizeText(texto)
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.has(w));
        },

        /**
         * Detecta sistemas mencionados no texto
         */
        detectarSistemas(texto) {
            if (!texto) return [];
            const lower = texto.toLowerCase();
            const sistemas = [];

            if (/sing|gestão integrada/i.test(lower)) sistemas.push('SING');
            if (/opt\+?z|otimizador|rotas|roteiriz|conexão|viagem vazia|gantt|pedra|carro fujão|fujao/i.test(lower)) sistemas.push('OPT+z');
            if (/yuv|frota|veículo/i.test(lower)) sistemas.push('YUV');
            if (/telemetria|rastreamento|gps/i.test(lower)) sistemas.push('Telemetria');
            if (/\bbi\b|business intelligence|relatório|dashboard/i.test(lower)) sistemas.push('BI');
            if (/app motorista|aplicativo/i.test(lower)) sistemas.push('App Motorista');

            return [...new Set(sistemas)];
        },

        /**
         * Busca conhecimento relevante para uma pergunta
         */
        buscarConhecimento(pergunta) {
            let sistemasParaBuscar = this.detectarSistemas(pergunta);
            const palavrasChave = this.extrairPalavrasChave(pergunta);
            const lowerNorm = this.normalizeText(pergunta);
            const conhecimento = [];

            // Se nenhum sistema foi detectado, buscar em todos como fallback
            if (sistemasParaBuscar.length === 0) {
                sistemasParaBuscar = Object.keys(this.sistemas);
            }

            // Buscar em cada sistema selecionado
            sistemasParaBuscar.forEach(nomeSistema => {
                const sistema = this.sistemas[nomeSistema];
                if (!sistema) return;

                conhecimento.push({
                    tipo: 'sistema',
                    nome: sistema.nome,
                    descricao: sistema.descricao
                });

                // Buscar funcionalidades detalhadas
                if (sistema.funcionalidades) {
                    Object.entries(sistema.funcionalidades).forEach(([key, func]) => {
                        const funcNomeNorm = this.normalizeText(func.nome);
                        const funcDescNorm = this.normalizeText(func.descricao);
                        const keyNorm = this.normalizeText(key.replace(/_/g, ' '));

                        const isMatch = lowerNorm.includes(keyNorm) ||
                            lowerNorm.includes(funcNomeNorm) ||
                            palavrasChave.some(p => funcNomeNorm.includes(p) || funcDescNorm.includes(p) || keyNorm.includes(p));

                        if (isMatch) {
                            conhecimento.push({
                                tipo: 'funcionalidade',
                                sistema: nomeSistema,
                                ...func
                            });
                        }
                    });
                }

                // Buscar problemas comuns relevantes
                Object.entries(sistema.problemas_comuns || {}).forEach(([categoria, info]) => {
                    const catNorm = this.normalizeText(categoria);
                    const descNorm = this.normalizeText(info.descricao);
                    const pkNorm = (info.palavras_chave || []).map(pk => this.normalizeText(pk));

                    const match = lowerNorm.includes(catNorm) ||
                        palavrasChave.some(p =>
                            catNorm.includes(p) ||
                            pkNorm.some(pk => pk.includes(p) || p.includes(pk))
                        );

                    if (match) {
                        conhecimento.push({
                            tipo: 'problema_comum',
                            sistema: nomeSistema,
                            categoria,
                            descricao: info.descricao,
                            solucoes: info.solucoes
                        });
                    }
                });
            });

            // Buscar no FAQ (busca mais flexível)
            this.faq.forEach(item => {
                const perguntaNorm = this.normalizeText(item.pergunta);
                const respostaNorm = this.normalizeText(item.resposta);
                const tagsNorm = item.tags.map(t => this.normalizeText(t));

                // Match por tags
                const tagMatch = palavrasChave.some(p =>
                    tagsNorm.some(t => t.includes(p) || p.includes(t))
                );

                // Match por conteúdo da pergunta/resposta
                const contentMatch = lowerNorm.includes(perguntaNorm) ||
                    palavrasChave.some(p =>
                        perguntaNorm.includes(p) || respostaNorm.includes(p)
                    );

                if (tagMatch || contentMatch) {
                    conhecimento.push({
                        tipo: 'faq',
                        pergunta: item.pergunta,
                        resposta: item.resposta
                    });
                }
            });

            return conhecimento;
        },

        /**
         * Responde diretamente uma pergunta usando a base de conhecimento
         * Retorna null se não souber responder
         */
        responderDireto(pergunta) {
            const conhecimento = this.buscarConhecimento(pergunta);

            if (conhecimento.length === 0) return null;

            let resposta = '';

            // Priorizar funcionalidades detalhadas
            const funcionalidades = conhecimento.filter(k => k.tipo === 'funcionalidade');
            if (funcionalidades.length > 0) {
                // Ordenar por relevância: priorizar funcionalidade cujo nome tem mais palavras na pergunta
                const perguntaNorm = this.normalizeText(pergunta);
                const palavrasChave = this.extrairPalavrasChave(pergunta);
                funcionalidades.sort((a, b) => {
                    const aWords = this.normalizeText(a.nome).split(/\s+/).filter(w => w.length > 1);
                    const bWords = this.normalizeText(b.nome).split(/\s+/).filter(w => w.length > 1);
                    const aScore = aWords.filter(w => perguntaNorm.includes(w)).length;
                    const bScore = bWords.filter(w => perguntaNorm.includes(w)).length;
                    if (aScore !== bScore) return bScore - aScore;
                    // Desempatar por número de campos (mais detalhado = mais relevante)
                    return Object.keys(b).length - Object.keys(a).length;
                });
                const func = funcionalidades[0];
                resposta += `<div style="margin-bottom: 12px;"><strong>📘 ${func.nome}</strong></div>`;
                resposta += `<p style="margin: 8px 0; color: #d1d5db;">${func.descricao}</p>`;

                // Helper para renderizar array como lista
                const renderList = (title, icon, color, items) => {
                    if (!items || items.length === 0) return '';
                    let html = `<div style="margin: 12px 0;"><strong style="color: ${color};">${icon} ${title}:</strong></div>`;
                    html += `<ul style="margin: 8px 0; padding-left: 20px; color: #d1d5db;">`;
                    items.forEach(item => { html += `<li style="margin: 4px 0;">${item}</li>`; });
                    html += `</ul>`;
                    return html;
                };

                // Helper para renderizar texto simples com destaque
                const renderText = (title, icon, text) => {
                    if (!text) return '';
                    return `<div style="margin: 12px 0; padding: 10px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 3px solid #8b5cf6;"><strong>${icon} ${title}:</strong> ${text}</div>`;
                };

                // Conceito / Motivação
                resposta += renderText('Conceito', '🧠', func.conceito_fundamental);
                resposta += renderText('Motivação', '🎯', func.motivacao_negocio);
                resposta += renderText('Definição completa', '📖', func.definicao_completa);
                resposta += renderText('Exemplo prático', '💡', func.exemplo_pratico);
                resposta += renderText('Estrutura conceitual', '🏗️', func.estrutura_conceitual);
                resposta += renderText('Frequência', '📅', func.frequencia);
                resposta += renderText('Algoritmo de otimização', '⚙️', func.algoritmo_otimizacao);
                resposta += renderText('Representação no Gantt', '📊', func.representacao_gantt);
                resposta += renderText('Impacto estratégico', '📈', func.impacto_estrategico);
                resposta += renderText('Visão consolidada', '🏆', func.visao_consolidada);

                // Listas de conteúdo
                resposta += renderList('Funções principais', '🔧', '#a78bfa', func.funcoes_principais);
                resposta += renderList('Casos de uso', '🎪', '#60a5fa', func.casos_uso);
                resposta += renderList('Como definir', '📋', '#34d399', func.como_definir);
                resposta += renderList('Validações na importação', '🔍', '#f87171', func.validacoes_importacao);
                resposta += renderList('Relação com Viagem Vazia', '🔗', '#c084fc', func.relacao_viagem_vazia);
                resposta += renderList('Desconexão', '✂️', '#fb923c', func.desconexao);
                resposta += renderList('Papel no sistema', '🎭', '#a78bfa', func.papel_no_sistema);
                resposta += renderList('Sem viagem vazia', '❌', '#f87171', func.sem_viagem_vazia);
                resposta += renderList('Com viagem vazia', '✅', '#34d399', func.com_viagem_vazia);
                resposta += renderList('Combinatória', '🔢', '#60a5fa', func.combinatoria);
                resposta += renderList('Benefícios', '🌟', '#fbbf24', func.beneficios);
                resposta += renderList('Regras', '📏', '#fb923c', func.regras);
                resposta += renderList('Sinalizações (bolinhas)', '🔴🟡🟢', '#a78bfa', func.sinalizacoes_bolinhas);
                resposta += renderList('Opções de gestão', '⚡', '#60a5fa', func.opcoes_gestao);
                resposta += renderList('Pesquisa e filtros', '🔎', '#34d399', func.pesquisa_filtros);
                resposta += renderList('Tipos de Pedras', '🔮', '#c084fc', func.tipos_pedras);
                resposta += renderList('Funcionalidades Gantt', '🖱️', '#a78bfa', func.funcionalidades);
                resposta += renderList('Colunas de identificação', '🏷️', '#a78bfa', func.colunas_identificacao);
                resposta += renderList('Classificação operacional', '📦', '#60a5fa', func.classificacao_operacional);
                resposta += renderList('Tempos operacionais', '⏱️', '#34d399', func.tempos_operacionais);
                resposta += renderList('Horários e vigência', '📆', '#fbbf24', func.horarios_vigencia);
                resposta += renderList('Impacto na otimização', '📊', '#f87171', func.impacto_otimizacao);
                resposta += renderList('Boas práticas', '✅', '#34d399', func.boas_praticas);
                resposta += renderList('Configurações', '⚙️', '#a78bfa', func.configuracoes);

                // Sub-objetos (tipos_servico, agrupadores_tags, locais, tripulantes)
                if (func.tipos_servico) {
                    resposta += renderText('Tipos de Serviço', '🏷️', func.tipos_servico.descricao);
                    resposta += renderList('Como cadastrar', '➕', '#34d399', func.tipos_servico.como_cadastrar);
                    resposta += renderList('Parametrizações', '⚙️', '#a78bfa', func.tipos_servico.parametrizacoes);
                }
                if (func.agrupadores_tags) {
                    resposta += renderText('Agrupadores/Tags', '🏷️', func.agrupadores_tags.descricao);
                    resposta += renderText('Exemplo prático', '💡', func.agrupadores_tags.exemplo_pratico);
                    resposta += renderList('Como configurar', '⚙️', '#60a5fa', func.agrupadores_tags.como_configurar);
                }
                if (func.locais) {
                    resposta += renderText('Locais', '📍', func.locais.descricao);
                    resposta += renderList('Parametrizações', '⚙️', '#34d399', func.locais.parametrizacoes);
                    resposta += renderList('Opções (3 pontinhos)', '⋮', '#fbbf24', func.locais.opcoes_tres_pontinhos);
                }
                if (func.tripulantes) {
                    resposta += renderText('Tripulantes', '👨‍✈️', func.tripulantes.descricao);
                    resposta += renderText('Intervalos', '⏸️', func.tripulantes.intervalos);
                    resposta += renderText('Diárias', '💰', func.tripulantes.diarias);
                }

                // Como acessar
                if (func.como_acessar) {
                    resposta += renderText('Como acessar', '📍', func.como_acessar);
                }

                // Dicas no final
                resposta += renderList('Dicas', '💡', '#fbbf24', func.dicas);

                return resposta;
            }

            // Problemas comuns
            const problemas = conhecimento.filter(k => k.tipo === 'problema_comum');
            if (problemas.length > 0) {
                const prob = problemas[0];
                resposta += `<div style="margin-bottom: 12px;"><strong>📌 ${prob.sistema} - ${prob.descricao}</strong></div>`;
                resposta += `<div style="margin: 12px 0;"><strong style="color: #10b981;">✅ Soluções:</strong></div>`;
                resposta += `<ol style="margin: 8px 0; padding-left: 20px; color: #d1d5db;">`;
                prob.solucoes.forEach(s => {
                    resposta += `<li style="margin: 4px 0;">${s}</li>`;
                });
                resposta += `</ol>`;
                return resposta;
            }

            // FAQ
            const faqs = conhecimento.filter(k => k.tipo === 'faq');
            if (faqs.length > 0) {
                const faq = faqs[0];
                resposta += `<div style="margin-bottom: 12px;"><strong>❓ ${faq.pergunta}</strong></div>`;
                resposta += `<p style="margin: 8px 0; color: #d1d5db;">${faq.resposta}</p>`;
                return resposta;
            }

            return null;
        },

        /**
         * Gera contexto enriquecido para a IA
         */
        gerarContextoEnriquecido(pergunta, tickets) {
            const resultados = this.buscarConhecimento(pergunta);

            // Separar tipos de resultados
            const funcionalidades = resultados.filter(r => r.tipo === 'funcionalidade');
            const problemas = resultados.filter(r => r.tipo === 'problema_comum');
            const sistemas = resultados.filter(r => r.tipo === 'sistema');
            const faqs = resultados.filter(r => r.tipo === 'faq');

            let contexto = '📚 CONHECIMENTO DO SISTEMA TRYVIA:\n';
            let temInfo = false;

            if (funcionalidades.length > 0) {
                contexto += '\n--- FUNCIONALIDADES DETECTADAS ---\n';
                funcionalidades.forEach(f => {
                    contexto += `[${f.sistema}] ${f.nome}: ${f.descricao}\n`;
                    if (f.dicas) contexto += `Dica: ${f.dicas[0]}\n`;
                    if (f.como_acessar) contexto += `Acesso: ${f.como_acessar}\n`;
                });
                temInfo = true;
            }

            if (problemas.length > 0) {
                contexto += '\n--- SOLUÇÕES CONHECIDAS ---\n';
                problemas.forEach(p => {
                    contexto += `[${p.sistema}] Problema: ${p.descricao}\n`;
                    contexto += `Solução: ${p.solucoes.join(' OU ')}\n`;
                });
                temInfo = true;
            }

            if (faqs.length > 0) {
                contexto += '\n--- PERGUNTAS FREQUENTES ---\n';
                faqs.slice(0, 3).forEach(f => {
                    contexto += `P: ${f.pergunta}\nR: ${f.resposta}\n`;
                });
                temInfo = true;
            }

            // Buscar tickets similares se houver tickets carregados
            if (tickets && tickets.length > 0) {
                const similares = this.buscarTicketsSimilaresResolvidos(pergunta, tickets, 3);
                if (similares.length > 0) {
                    contexto += '\n--- TICKETS SIMILARES RESOLVIDOS ---\n';
                    similares.forEach(t => {
                        const resumo = t.description_text ? t.description_text.substring(0, 150) + '...' : 'Sem descrição';
                        contexto += `Ticket #${t.id} (${t.subject})\nResumo: ${resumo}\nSolução (Status ${t.status}): Verificar histórico detalhado.\n`;
                    });
                    temInfo = true;
                }
            }

            return temInfo ? contexto : '';
        },

        /**
         * Formata resposta com tickets similares
         */
        formatarRespostaComTickets(resposta, ticketsSimilares) {
            if (!ticketsSimilares || ticketsSimilares.length === 0) {
                return resposta;
            }

            let html = resposta;
            html += `<div style="margin-top: 16px; padding: 12px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2);">`;
            html += `<div style="font-weight: 600; color: #a78bfa; margin-bottom: 8px;">🎫 Tickets similares resolvidos:</div>`;

            ticketsSimilares.forEach((t, i) => {
                html += `<div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px;">`;
                html += `<a href="${t.link}" target="_blank" style="color: #60a5fa; text-decoration: none; font-weight: 500;">#${t.id}</a>`;
                html += ` - ${t.subject}`;
                if (t.tratativa) {
                    html += `<div style="font-size: 0.85em; color: #94a3b8; margin-top: 4px;">Resolvido por: ${t.tratativa}</div>`;
                }
                html += `</div>`;
            });

            html += `</div>`;
            return html;
        }
    };

    // Expor globalmente
    window.TryvianoKnowledge = TryvianoKnowledge;

    console.log('📚 TryvianoKnowledge loaded - Base de conhecimento disponível');

})();
