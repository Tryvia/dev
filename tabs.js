// Função para alternar entre as subtabs da aba Início
window.showInicioTab = function(tabName) {
    // Atualiza aparência dos botões
    document.getElementById('btn-visao-geral').style.background = tabName === 'visao-geral' ? '#4fc3f7' : 'white';
    document.getElementById('btn-visao-geral').style.color = tabName === 'visao-geral' ? 'white' : '#333333';
    
    document.getElementById('btn-atividades').style.background = tabName === 'atividades' ? '#4fc3f7' : 'white';
    document.getElementById('btn-atividades').style.color = tabName === 'atividades' ? 'white' : '#333333';

    // Mostra/oculta conteúdo apropriado
    const metricsGrid = document.querySelector('.metrics-grid');
    const activityFeed = document.querySelector('.activities-section');
    const chartsSection = document.querySelector('.charts-section');
    const quickAccess = document.querySelector('.quick-access');
    const notifications = document.querySelector('.notifications');
    const clientsHighlight = document.querySelector('.clients-highlight');

    // Atualiza exibição elemento a elemento (algumas seções são opcionais)
    if (tabName === 'visao-geral') {
        if (metricsGrid) metricsGrid.style.display = 'grid';
        if (chartsSection) chartsSection.style.display = 'grid';
        if (quickAccess) quickAccess.style.display = 'block';
        if (notifications) notifications.style.display = 'block';
        if (clientsHighlight) clientsHighlight.style.display = 'block';
        if (activityFeed) activityFeed.style.display = 'none';
    } else {
        if (metricsGrid) metricsGrid.style.display = 'none';
        if (chartsSection) chartsSection.style.display = 'none';
        if (quickAccess) quickAccess.style.display = 'none';
        if (notifications) notifications.style.display = 'none';
        if (clientsHighlight) clientsHighlight.style.display = 'none';
        if (activityFeed) {
            activityFeed.style.display = 'block';
            // Carrega as atividades quando a aba é aberta
            if (typeof carregarAtividades === 'function') {
                carregarAtividades();
            }
        }
    }
}

// Função para carregar atividades recentes
async function carregarAtividades() {
    const activitiesList = document.getElementById('activitiesList');
    activitiesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-spinner fa-spin" style="font-size: 2em; margin-bottom: 15px;"></i><p>Carregando atividades...</p></div>';

    try {
        const data = await Promise.all([
            carregarNovasReunioes(),
            carregarNovasHomologacoes(),
            carregarNovosClientes(),
            carregarNovasReleases()
        ]);

        // Combina e ordena todas as atividades por data
        const todasAtividades = [].concat(...data)
            .sort((a, b) => new Date(b.data) - new Date(a.data));

        if (todasAtividades.length === 0) {
            activitiesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-clock" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <p>Nenhuma atividade recente encontrada</p>
                </div>
            `;
            return;
        }

        activitiesList.innerHTML = todasAtividades.map(atividade => `
            <div class="activity-item" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="${atividade.icone}" style="color: ${atividade.cor}; font-size: 1.2em;"></i>
                        <div>
                            <div style="font-weight: bold; color: #333;">${atividade.titulo}</div>
                            <div style="color: #666; font-size: 0.9em;">${atividade.descricao}</div>
                        </div>
                    </div>
                    <div style="color: #999; font-size: 0.8em;">
                        ${formatarDataAtividade(atividade.data)}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        activitiesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 15px; color: #f44336;"></i>
                <p>Erro ao carregar atividades. Por favor, tente novamente mais tarde.</p>
            </div>
        `;
    }
}

function formatarDataAtividade(data) {
    const dataAtividade = new Date(data);
    const agora = new Date();
    const diff = agora - dataAtividade;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 60) {
        return `${minutos} minutos atrás`;
    } else if (horas < 24) {
        return `${horas} horas atrás`;
    } else if (dias < 30) {
        return `${dias} dias atrás`;
    } else {
        return dataAtividade.toLocaleDateString('pt-BR');
    }
}

// Funções auxiliares para carregar diferentes tipos de atividades
async function carregarNovasReunioes() {
    try {
        const { data, error } = await releaseClient
            .from('reunioes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return data.map(reuniao => ({
            tipo: 'reuniao',
            titulo: 'Nova Reunião',
            descricao: `${reuniao.tipo} - ${reuniao.cliente || 'Cliente não especificado'}`,
            data: reuniao.created_at,
            icone: 'fas fa-users',
            cor: '#9c27b0'
        }));
    } catch (error) {
        console.error('Erro ao carregar reuniões:', error);
        return [];
    }
}

async function carregarNovasHomologacoes() {
    try {
        const { data, error } = await releaseClient
            .from('homologacoes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return data.map(homologacao => ({
            tipo: 'homologacao',
            titulo: 'Nova Homologação',
            descricao: `${homologacao.sistema} - Versão ${homologacao.versao}`,
            data: homologacao.created_at,
            icone: 'fas fa-clipboard-check',
            cor: '#4caf50'
        }));
    } catch (error) {
        console.error('Erro ao carregar homologações:', error);
        return [];
    }
}

async function carregarNovosClientes() {
    try {
        const { data, error } = await releaseClient
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return data.map(cliente => ({
            tipo: 'cliente',
            titulo: 'Novo Cliente',
            descricao: cliente.name,
            data: cliente.created_at,
            icone: 'fas fa-user-plus',
            cor: '#2196f3'
        }));
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        return [];
    }
}

async function carregarNovasReleases() {
    try {
        const { data, error } = await releaseClient
            .from('releases')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return data.map(release => ({
            tipo: 'release',
            titulo: 'Nova Release',
            descricao: `${release.sistema} - ${release.versao}`,
            data: release.created_at,
            icone: 'fas fa-rocket',
            cor: '#ff9800'
        }));
    } catch (error) {
        console.error('Erro ao carregar releases:', error);
        return [];
    }
}

// Quando a página carregar, exibir a visão geral por padrão
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('inicio').classList.contains('active')) {
        window.showInicioTab('visao-geral');
    }
});

// Função para integrar showTab com a mudança de abas
window.showTab = function(tabId) {
    // Oculta todas as seções de conteúdo
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Mostra a seção selecionada
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Remove a classe active de todos os botões
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Adiciona a classe active ao botão selecionado
    const navItemToActivate = document.querySelector(`.nav-item button[onclick="showTab('${tabId}')"]`);
    if (navItemToActivate) {
        navItemToActivate.parentElement.classList.add('active');
    }

    // Se estiver na aba início, mostrar visão geral por padrão
    if (tabId === 'inicio') {
        showInicioTab('visao-geral');
    }
};
