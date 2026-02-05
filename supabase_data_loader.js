// Variáveis de configuração do Supabase (Extraídas do Portal.html original)
const RELEASE_SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
const RELEASE_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIzMzAzNSwiZXhwIjoyMDYzODA5MDM1fQ.CVXkKh9yul_Mv2YMhPsDo4CmkQevxpkeI1CtitORpJ0';
const releaseClient = supabase.createClient(RELEASE_SUPABASE_URL, RELEASE_SUPABASE_KEY);
const SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc';
// Instanciar o cliente Supabase local sem redeclarar o identificador global `supabase`
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funções de carregamento de dados (Extraídas do Portal.html original)
// Esta é uma recriação da lógica de carregamento, baseada nos IDs e nas métricas solicitadas.
// A lógica exata de consulta ao Supabase não pode ser extraída sem o arquivo completo, 
// mas o objetivo é restaurar a chamada para os IDs corretos.

// Função para atualizar o texto de um elemento
function updateMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Função para carregar as métricas do dashboard
async function loadDashboardMetrics() {
    // Placeholder para a lógica de carregamento de clientes ativos/inativos
    // Assumindo que a função original fetchClientsData() ou similar era chamada.
    try {
        // Exemplo de como a lógica original poderia se parecer (necessita da tabela correta do Supabase)
        // const { data: clients, error } = await supabase.from('clientes').select('status');
        
        // Simulação de chamada para os IDs corretos:
        // O valor real viria do Supabase. Aqui, apenas restauramos a função de atualização de ID.
        
        // Clientes Ativos
        const { data: activeClients, error: activeError } = await supabaseClient.from('clientes').select('*', { count: 'exact' }).eq('status', 'ativo');
        if (activeClients) {
            updateMetric('activeClientsCount', activeClients.length);
        } else {
             updateMetric('activeClientsCount', 'Erro');
             console.error('Erro ao carregar clientes ativos:', activeError);
        }
        
        // Clientes Inativos (assumindo que o ID é 'inactiveClientsCount')
        const { data: inactiveClients, error: inactiveError } = await supabaseClient.from('clientes').select('*', { count: 'exact' }).eq('status', 'inativo');
        if (inactiveClients) {
            updateMetric('inactiveClientsCount', inactiveClients.length);
        } else {
             updateMetric('inactiveClientsCount', 'Erro');
             console.error('Erro ao carregar clientes inativos:', inactiveError);
        }
        
        // Total de Homologações
        const { count: homologacoesCount, error: homologacoesError } = await supabaseClient.from('homologacoes').select('*', { count: 'exact' });
        if (homologacoesCount !== null) {
            updateMetric('totalHomologacoes', homologacoesCount);
        } else {
             updateMetric('totalHomologacoes', 'Erro');
             console.error('Erro ao carregar homologações:', homologacoesError);
        }

        // Total de Releases
        const { count: releasesCount, error: releasesError } = await supabaseClient.from('releases').select('*', { count: 'exact' });
        if (releasesCount !== null) {
            updateMetric('totalReleases', releasesCount);
        } else {
             updateMetric('totalReleases', 'Erro');
             console.error('Erro ao carregar releases:', releasesError);
        }
        
        // Total de Reuniões
        const { count: reunioesCount, error: reunioesError } = await supabaseClient.from('reunioes').select('*', { count: 'exact' });
        if (reunioesCount !== null) {
            updateMetric('totalReunioes', reunioesCount);
        } else {
             updateMetric('totalReunioes', 'Erro');
             console.error('Erro ao carregar reuniões:', reunioesError);
        }
        
        // Total de Visitas (assumindo que o ID é 'totalVisitas')
        const { count: visitasCount, error: visitasError } = await supabaseClient.from('visitas').select('*', { count: 'exact' });
        if (visitasCount !== null) {
            updateMetric('totalVisitas', visitasCount);
        } else {
             updateMetric('totalVisitas', 'Erro');
             console.error('Erro ao carregar visitas:', visitasError);
        }

        // Avaliação Média (assumindo que a tabela é 'avaliacoes' e a coluna é 'rating')
        const { data: ratings, error: ratingsError } = await supabaseClient.from('avaliacoes').select('rating');
        if (ratings) {
            const totalRating = ratings.reduce((sum, item) => sum + item.rating, 0);
            const averageRating = (totalRating / ratings.length).toFixed(1);
            updateMetric('averageRatingHome', averageRating);
        } else {
             updateMetric('averageRatingHome', 'Erro');
             console.error('Erro ao carregar avaliações:', ratingsError);
        }
        
        // Carregar a lista de atividades recentes (activitiesList)
        const { data: activities, error: activitiesError } = await supabaseClient.from('atividades_recentes').select('*').order('created_at', { ascending: false }).limit(5);
        if (activities) {
            const listElement = document.getElementById('activitiesList');
            if (listElement) {
                listElement.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <i class="fas fa-circle activity-icon" style="color: ${activity.color};"></i>
                        <div class="activity-details">
                            <p class="activity-title">${activity.title}</p>
                            <small class="activity-time">${new Date(activity.created_at).toLocaleString()}</small>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            console.error('Erro ao carregar atividades recentes:', activitiesError);
        }

        // Carregar Gráficos (homologacoesChart, releasesChart)
        // A lógica de carregamento de gráficos é complexa e depende da biblioteca (Chart.js) e da estrutura de dados.
        // Apenas restauramos a chamada para a função que os carregava.
        // Assumindo que existia uma função loadCharts() no original.
        if (typeof loadCharts === 'function') {
            loadCharts();
        } else {
            // Se loadCharts não existir, pelo menos garantimos que os IDs estão prontos para o JS de gráficos.
        }

    } catch (error) {
        console.error('Erro geral ao carregar métricas do dashboard:', error);
        // Em caso de erro, definir um valor de fallback
        updateMetric('activeClientsCount', 'N/A');
        updateMetric('inactiveClientsCount', 'N/A');
        updateMetric('totalHomologacoes', 'N/A');
        updateMetric('totalReleases', 'N/A');
        updateMetric('totalReunioes', 'N/A');
        updateMetric('totalVisitas', 'N/A');
        updateMetric('averageRatingHome', 'N/A');
    }
}

// Chamar a função de carregamento quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadDashboardMetrics);

