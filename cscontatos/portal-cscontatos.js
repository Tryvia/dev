// ===== PORTAL CONTATOS SIDEBAR INTEGRATION =====
// Lê as permissões do usuário que foram armazenadas no localStorage pelo Portal
// durante o login

// Tentar ler as permissões do localStorage (definidas pelo Portal após login)
let permissoes = [];
try {
    const permissoesStr = localStorage.getItem('permissoes');
    if (permissoesStr) {
        permissoes = JSON.parse(permissoesStr);
        console.log('✓ Permissões lidas do localStorage:', permissoes);
    }
} catch (e) {
    console.warn('Erro ao ler permissões do localStorage:', e);
    permissoes = [];
}

// Array de TODAS as abas disponíveis no Portal (com EXATAMENTE os data-permissao do Portal.html)
const PORTAL_TABS = [
    { id: 'inicio', label: 'Início', icon: 'fas fa-home', permission: 'inicio', type: 'tab' },
    { id: 'painel-setor', label: 'Painel do Setor', icon: 'fas fa-chart-pie', permission: 'painel-setor', type: 'tab' },
    { id: 'atendimento', label: 'Atendimento', icon: 'fas fa-chart-bar', permission: 'bi-analytics', type: 'link', href: 'atendimento/BI_por_Time(2).html' },
    { id: 'telemetria', label: 'Dashboards', icon: 'fas fa-chart-line', permission: 'telemetria', type: 'tab' },
    { id: 'melhorias', label: 'Melhorias', icon: 'fas fa-chart-area', permission: 'dashmelhorias', type: 'link', href: 'melhorias/index.html' },
    { id: 'clients', label: 'Clientes', icon: 'fas fa-users', permission: 'clients', type: 'tab' },
    { id: 'painel-tickets', label: 'Painel de Tickets', icon: 'fas fa-ticket-alt', permission: 'painel-tickets', type: 'tab' },
    { id: 'visitas', label: 'Visitas', icon: 'fas fa-calendar-check', permission: 'https://tryvia.github.io/TryviaBI/mapa_visitas.html', type: 'link', href: 'mapa_de_visitas/index.html' },
    { id: 'relatorioVisita', label: 'Relatório de Visita', icon: 'fas fa-file-signature', permission: 'relatorioVisita', type: 'tab' },
    { id: 'raio-x', label: 'Raio X', icon: 'fas fa-bolt', permission: 'raio-x', type: 'tab' },
    { id: 'homologacao', label: 'Homologação', icon: 'fas fa-clipboard-check', permission: 'homologacao', type: 'tab' },
    { id: 'release', label: 'Release', icon: 'fas fa-rocket', permission: 'release', type: 'tab' },
    { id: 'reunioes', label: 'Reuniões', icon: 'fas fa-users', permission: 'reunioes', type: 'tab' },
    { id: 'documents', label: 'Documentos', icon: 'fas fa-file-alt', permission: 'documents', type: 'tab' },
    { id: 'treinamento', label: 'Treinamento', icon: 'fas fa-graduation-cap', permission: 'treinamento', type: 'tab' },
    { id: 'evaluations', label: 'Avaliações', icon: 'fas fa-star', permission: 'evaluations', type: 'tab' },
    { id: 'cs', label: 'CS', icon: 'fas fa-headset', permission: 'cs', type: 'link', href: 'cscontatos/index.html' },
    { id: 'calendario', label: 'Calendário', icon: 'fas fa-calendar', permission: 'https://tryvia.github.io/TryviaBI/calendario.html', type: 'link', href: 'calendario/index.html' },
    { id: 'mvp', label: 'MVP', icon: 'fas fa-clock', permission: 'https://tryvia.github.io/TryviaBI/linha%20do%20tempo.html', type: 'link', href: 'linha_do_tempo/index.html' },
    { id: 'implantacoes', label: 'Implantações', icon: 'fas fa-cogs', permission: 'implanta%C3%A7%C3%A3o.html', type: 'link', href: 'implantacao/index.html' },
    { id: 'gestao', label: 'Gestão', icon: 'fas fa-users-cog', permission: 'gestao', type: 'tab' },
    { id: 'gerenciar-logins', label: 'Gerenciar Logins', icon: 'fas fa-user-shield', permission: 'gerenciar-logins', type: 'tab' },
    { id: 'audit-log', label: 'Log de Auditoria', icon: 'fas fa-history', permission: 'audit-log', type: 'tab' }
];

// Renderiza APENAS os tabs que o usuário tem permissão (igual ao Portal.js)
function renderAccessibleTabs() {
    const navList = document.querySelector('.nav-list');
    if (!navList) return;

    // Limpar tabs anteriores (manter apenas CS Contatos)
    const allItems = navList.querySelectorAll('.nav-item');
    const csItem = Array.from(allItems).find(item => 
        item.querySelector('button').textContent.includes('CS')
    );
    
    // Remover todos os itens exceto CS
    allItems.forEach(item => {
        if (item !== csItem) item.remove();
    });

    console.log(' Renderizando tabs. Usuário tem', permissoes.length, 'permissões');

    let tabsAdicionados = 0;
    // Renderizar tabs baseado em permissões
    PORTAL_TABS.forEach(tab => {
        // Só renderizar se o usuário tem a permissão
        if (permissoes.includes(tab.permission)) {
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-permissao', tab.permission);
            button.innerHTML = `<i class="${tab.icon}"></i> ${tab.label}`;
            
            // Diferente tratamento para abas internas (showTab) vs links externos
            if (tab.type === 'tab') {
                // Para abas internas: navega via Portal.html?tab=
                button.onclick = function(e) {
                    e.preventDefault();
                    navigateToPortalTab(tab.id);
                    return false;
                };
            } else if (tab.type === 'link') {
                // Para links externos: navega direto
                button.onclick = function(e) {
                    e.preventDefault();
                    window.location.href = '../' + tab.href;
                    return false;
                };
            }
            
            navItem.appendChild(button);
            navList.insertBefore(navItem, csItem);
            tabsAdicionados++;
            console.log('  ✓ Adicionado:', tab.label, '(' + tab.permission + ') - Tipo:', tab.type);
        }
    });

    console.log('✓ Total de tabs renderizados:', tabsAdicionados);
}

// Navega para um tab do Portal COM suporte a navegação direta
function navigateToPortalTab(tabId) {
    // Redirecionar para Portal.html passando o tab como parâmetro URL (?tab=)
    console.log('→ Navegando para tab:', tabId);
    window.location.href = '../Portal.html?tab=' + tabId;
}

// Mostra/esconde tabs locais (atualmente apenas CS funciona localmente)
function showTab(tabId) {
    // Se em futuro houver mais abas locais, implementar aqui
    console.log('📍 Mostrando tab local:', tabId);
}

// Volta ao Portal
function goBackToPortal() {
    window.location.href = '../Portal.html';
}

// Logout - limpa dados e volta ao login
function logoutTryvia() {
    console.log('🚪 Logout realizado');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../login/index.html';
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ Portal-CS Contatos inicializado');
    console.log('✓ Permissões do usuário:', permissoes);
    console.log('✓ Total de permissões:', permissoes.length);
    
    // Preencher nome do usuário (igual ao Portal)
    const nome = localStorage.getItem('username') || 'TRYVIA';
    const nomeUserElement = document.getElementById('nomeUsuario');
    if (nomeUserElement) {
        nomeUserElement.innerText = nome;
    }
    
    // Renderizar os tabs acessíveis
    renderAccessibleTabs();
    
    // Inicializar theme toggle
    initializeThemeToggle();
});

// ===== THEME TOGGLE FUNCTIONALITY =====
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Carregar tema salvo no localStorage
    const savedTheme = localStorage.getItem('cs-theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        updateThemeIcon(true);
    } else {
        updateThemeIcon(false);
    }
    
    // Event listener para o botão
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isLightMode = body.classList.contains('light-mode');
            
            if (isLightMode) {
                // Mudar para dark mode
                body.classList.remove('light-mode');
                localStorage.setItem('cs-theme', 'dark');
                updateThemeIcon(false);
                console.log('✓ Modo escuro ativado');
            } else {
                // Mudar para light mode
                body.classList.add('light-mode');
                localStorage.setItem('cs-theme', 'light');
                updateThemeIcon(true);
                console.log('✓ Modo claro ativado');
            }
        });
    }
}

function updateThemeIcon(isLightMode) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (isLightMode) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }
}
