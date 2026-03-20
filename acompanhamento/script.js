// ============================================
// FRESHDESK TICKETS VIEWER - SCRIPT.JS
// Integração Supabase, filtros, gráficos
// ============================================

// Configurações Supabase
const SUPABASE_URL = 'https://ifzypptlhpzuydjeympr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8';

// Mapeamento de times por responder_id
const TEAM_MAPPING = {
    '154019571245': 'DEV SING Telemetria',
    '154019572764': 'DEV OPTZ',
    '154017677325': 'Time de Produto',
    '154015905185': 'Atendimento',
    '154019571587': 'Atendimento',
    '154019571377': 'Time Comercial',
    '154019571165': 'Time CS'
};

// Mapeamento de status
const STATUS_MAP = {
    1: { label: 'Aberto', class: 'status-open' },
    2: { label: 'Em Andamento', class: 'status-in-progress' },
    3: { label: 'Aguardando Cliente', class: 'status-waiting' },
    4: { label: 'Resolvido', class: 'status-resolved' }
};

// Mapeamento de prioridade
const PRIORITY_MAP = {
    1: { label: 'Baixa', class: 'priority-low' },
    2: { label: 'Média', class: 'priority-medium' },
    3: { label: 'Alta', class: 'priority-high' },
    4: { label: 'Urgente', class: 'priority-urgent' }
};

// Cores para gráficos
const TEAM_COLORS = {
    'DEV SING Telemetria': '#9c27b0',
    'DEV OPTZ': '#00d447',
    'Time de Produto': '#2874a7',
    'Atendimento': '#14cbf8',
    'Time Comercial': '#199e93',
    'Time CS': '#f97316',
    'Outros': '#9e9e9e'
};

// Estado da aplicação
let appState = {
    allTickets: [],
    filteredTickets: [],
    currentPage: 1,
    itemsPerPage: 50,
    selectedTeam: '',
    selectedStatus: '',
    barChart: null,
    pieChart: null,
    lastUpdate: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadTickets();
    // Atualização automática a cada 5 minutos
    setInterval(loadTickets, 5 * 60 * 1000);
});

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', loadTickets);
    document.getElementById('teamFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('prevPageBtn').addEventListener('click', previousPage);
    document.getElementById('nextPageBtn').addEventListener('click', nextPage);
    
    // Botão de voltar
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../melhorias/index.html';
        });
    }
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

async function loadTickets() {
    try {
        showLoadingState();
        const tickets = await fetchTicketsFromSupabase();
        appState.allTickets = tickets;
        applyFilters();
        updateLastUpdateTime();
        console.log(`✅ ${tickets.length} tickets carregados com sucesso`);
    } catch (error) {
        console.error('❌ Erro ao carregar tickets:', error);
        showErrorMessage('Erro ao carregar tickets. Verifique a conexão com o Supabase.');
    }
}

async function fetchTicketsFromSupabase() {
    // Construir query com filtros básicos
    let query = `${SUPABASE_URL}/rest/v1/tickets?select=*`;
    
    // Filtros obrigatórios:
    // 1. cf_acompanhamento_produto não nulo e não vazio
    // 2. status diferente de 5 (closed)
    query += '&cf_acompanhamento_produto=not.is.null';
    query += '&cf_acompanhamento_produto=neq.%22%22';
    query += '&status=neq.5';
    
    // Limitar resultados
    query += '&limit=1000';
    
    const response = await fetch(query, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tickets = await response.json();
    
    // Processar tickets para adicionar informações calculadas
    return tickets.map(ticket => ({
        ...ticket,
        teamName: getTeamName(ticket.responder_id),
        statusLabel: STATUS_MAP[ticket.status]?.label || 'Desconhecido',
        statusClass: STATUS_MAP[ticket.status]?.class || 'status-resolved',
        priorityLabel: PRIORITY_MAP[ticket.priority]?.label || 'Desconhecida',
        priorityClass: PRIORITY_MAP[ticket.priority]?.class || 'priority-medium'
    }));
}

// ============================================
// PROCESSAMENTO DE DADOS
// ============================================

function getTeamName(responderId) {
    return TEAM_MAPPING[responderId] || 'Outros';
}

function applyFilters() {
    appState.selectedTeam = document.getElementById('teamFilter').value;
    appState.selectedStatus = document.getElementById('statusFilter').value;
    appState.currentPage = 1;

    appState.filteredTickets = appState.allTickets.filter(ticket => {
        // Filtro por time
        if (appState.selectedTeam && ticket.teamName !== appState.selectedTeam) {
            return false;
        }

        // Filtro por status
        if (appState.selectedStatus && ticket.status !== parseInt(appState.selectedStatus)) {
            return false;
        }

        return true;
    });

    // Atualizar UI
    updateCounters();
    updateCharts();
    renderTable();
}

// ============================================
// ATUALIZAÇÃO DE CONTADORES
// ============================================

function updateCounters() {
    const totalTickets = appState.allTickets.length;
    document.getElementById('totalTickets').textContent = totalTickets;

    const teamCounts = countTicketsByTeam(appState.allTickets);
    
    document.getElementById('countTelemetria').textContent = teamCounts['DEV SING Telemetria'] || 0;
    document.getElementById('countOptz').textContent = teamCounts['DEV OPTZ'] || 0;
    document.getElementById('countProduct').textContent = teamCounts['Time de Produto'] || 0;
    document.getElementById('countSupport').textContent = teamCounts['Atendimento'] || 0;
    document.getElementById('countComercial').textContent = teamCounts['Time Comercial'] || 0;
    document.getElementById('countCS').textContent = teamCounts['Time CS'] || 0;
    document.getElementById('countOthers').textContent = teamCounts['Outros'] || 0;

    // Atualizar info de filtros
    const filteredCount = appState.filteredTickets.length;
    document.getElementById('filterInfo').textContent = `Exibindo ${filteredCount} de ${totalTickets}`;
}

function countTicketsByTeam(tickets) {
    const counts = {};
    tickets.forEach(ticket => {
        const team = ticket.teamName;
        counts[team] = (counts[team] || 0) + 1;
    });
    return counts;
}

// ============================================
// GRÁFICOS
// ============================================

function updateCharts() {
    updateBarChart();
    updatePieChart();
}

function updateBarChart() {
    const teamCounts = countTicketsByTeam(appState.allTickets);
    const teams = Object.keys(teamCounts);
    const counts = Object.values(teamCounts);

    const ctx = document.getElementById('barChart').getContext('2d');
    
    if (appState.barChart) {
        appState.barChart.destroy();
    }

    appState.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teams,
            datasets: [{
                label: 'Quantidade de Tickets',
                data: counts,
                backgroundColor: teams.map(team => TEAM_COLORS[team] || '#999'),
                borderColor: teams.map(team => TEAM_COLORS[team] || '#999'),
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.x} tickets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updatePieChart() {
    const teamCounts = countTicketsByTeam(appState.allTickets);
    const teams = Object.keys(teamCounts);
    const counts = Object.values(teamCounts);

    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (appState.pieChart) {
        appState.pieChart.destroy();
    }

    appState.pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: teams,
            datasets: [{
                data: counts,
                backgroundColor: teams.map(team => TEAM_COLORS[team] || '#999'),
                borderColor: '#ffffff',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12, weight: '600' },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// RENDERIZAÇÃO DA TABELA
// ============================================

function renderTable() {
    const tbody = document.getElementById('ticketsTableBody');
    const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
    const endIndex = startIndex + appState.itemsPerPage;
    const pageTickets = appState.filteredTickets.slice(startIndex, endIndex);

    if (pageTickets.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7" class="empty-message">
                    ${appState.filteredTickets.length === 0 && appState.allTickets.length > 0 
                        ? '🔍 Nenhum ticket encontrado com os filtros aplicados' 
                        : '⏳ Carregando tickets...'}
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    tbody.innerHTML = pageTickets.map(ticket => `
        <tr class="fade-in">
            <td><span class="id-link">#${ticket.id}</span></td>
            <td title="${ticket.subject}">${ticket.subject}</td>
            <td>
                <span class="team-badge ${getTeamClass(ticket.teamName)}">
                    ${ticket.teamName}
                </span>
            </td>
            <td>${ticket.responder_id}</td>
            <td>
                <span class="acompanhamento-text" title="${ticket.cf_acompanhamento_produto}">
                    ${ticket.cf_acompanhamento_produto}
                </span>
            </td>
            <td>
                <span class="status-badge ${ticket.statusClass}">
                    ${ticket.statusLabel}
                </span>
            </td>
            <td>
                <span class="priority-badge ${ticket.priorityClass}">
                    ${ticket.priorityLabel}
                </span>
            </td>
        </tr>
    `).join('');

    updatePagination();
}

function getTeamClass(teamName) {
    const classMap = {
        'DEV SING Telemetria': 'team-telemetria',
        'DEV OPTZ': 'team-optz',
        'Time de Produto': 'team-product',
        'Atendimento': 'team-support',
        'Time Comercial': 'team-comercial',
        'Time CS': 'team-cs',
        'Outros': 'team-others'
    };
    return classMap[teamName] || 'team-others';
}

// ============================================
// PAGINAÇÃO
// ============================================

function updatePagination() {
    const totalPages = Math.ceil(appState.filteredTickets.length / appState.itemsPerPage);
    const startIndex = (appState.currentPage - 1) * appState.itemsPerPage + 1;
    const endIndex = Math.min(appState.currentPage * appState.itemsPerPage, appState.filteredTickets.length);

    document.getElementById('pageInfo').textContent = 
        totalPages === 0 ? 'Página 1' : `Página ${appState.currentPage} de ${totalPages}`;

    document.getElementById('prevPageBtn').disabled = appState.currentPage === 1;
    document.getElementById('nextPageBtn').disabled = appState.currentPage === totalPages || totalPages === 0;
}

function previousPage() {
    if (appState.currentPage > 1) {
        appState.currentPage--;
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function nextPage() {
    const totalPages = Math.ceil(appState.filteredTickets.length / appState.itemsPerPage);
    if (appState.currentPage < totalPages) {
        appState.currentPage++;
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    appState.lastUpdate = now;
    document.getElementById('lastUpdate').textContent = `Atualizado às ${timeString}`;
}

function showLoadingState() {
    const tbody = document.getElementById('ticketsTableBody');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="7" class="loading-message">⏳ Carregando tickets...</td>
        </tr>
    `;
}

function showErrorMessage(message) {
    const tbody = document.getElementById('ticketsTableBody');
    tbody.innerHTML = `
        <tr class="empty-row">
            <td colspan="7" class="empty-message">❌ ${message}</td>
        </tr>
    `;
}

// Feedback visual ao atualizar
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalLoadTickets = loadTickets;
    
    loadTickets = async function() {
        refreshBtn.classList.add('spin');
        try {
            await originalLoadTickets();
        } finally {
            refreshBtn.classList.remove('spin');
        }
    };
});

console.log('✅ Freshdesk Tickets Viewer inicializado com sucesso!');

        (function() {
            // Verificar se o usuário veio de páginas permitidas
            const refererersPermitidos = ['melhorias/index.html', 'Portal.html'];
            const paginaLogin = `../login/index.html`;   
            
            // Obter o referrer atual
            const referrerAtual = document.referrer;
            
            // Verificar se o referrer é válido
            const referrerValido = refererersPermitidos.some(ref => referrerAtual.includes(ref));
            
            // Redirecionar para login apenas se não houver referrer válido
            if (!referrerAtual || !referrerValido) {
                if (!window.location.href.includes('login')) {
                    window.location.replace(paginaLogin);
                }
            }
        })();

