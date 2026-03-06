/**
 * ============================================
 * CONFIGURAÇÃO DE MEMBROS DO TIME
 * ============================================
 * 
 * Este arquivo centraliza a configuração de membros por time.
 * Edite aqui para adicionar/remover pessoas dos times.
 */

window.TEAM_MEMBERS_CONFIG = {
    'Atendimento': [
        'Adriana Florencio',
        'Alianie Lanes',
        'Andreia Ribeiro',
        'Francisco Nascimento',
        'Gabriel Oliveira',
        'Gustavo Martins',
        'João Peres',
        'Jéssica Dias',
        'Marciele Quintanilha'
    ],
    'Acompanhamento': [
        'Adriana Florencio',
        'Alianie Lanes',
        'Andreia Ribeiro',
        'Francisco Nascimento',
        'Gabriel Oliveira',
        'Gustavo Martins',
        'João Peres',
        'Jéssica Dias',
        'Marciele Quintanilha'
    ]
};

/**
 * Obtém membros de um time específico
 * @param {string} teamName - Nome do time
 * @returns {string[]} Lista de membros
 */
window.getTeamMembers = function(teamName) {
    return window.TEAM_MEMBERS_CONFIG[teamName] || [];
};

/**
 * Obtém todos os times disponíveis
 * @returns {string[]} Lista de nomes de times
 */
window.getAvailableTeams = function() {
    return Object.keys(window.TEAM_MEMBERS_CONFIG);
};

/**
 * Verifica se uma pessoa pertence a um time
 * @param {string} personName - Nome da pessoa
 * @param {string} teamName - Nome do time
 * @returns {boolean}
 */
window.isPersonInTeam = function(personName, teamName) {
    const members = window.TEAM_MEMBERS_CONFIG[teamName];
    return members ? members.includes(personName) : false;
};

console.log('✅ Configuração de membros do time carregada.');
