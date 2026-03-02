/**
 * Funções de Navegação do Sistema
 * Corrige problemas de funções não definidas
 */

// Função para alternar sidebar
window.toggleSidebar = function (forceState) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    if (forceState === 'show') {
        sidebar.classList.remove('collapsed');
    } else if (forceState === 'hide') {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.toggle('collapsed');
    }

    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);

    // Force recalculation of layouts if needed
    setTimeout(() => {
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('resize'));
        }
    }, 300);

    // Redraw BI charts after sidebar animation completes
    const biContainer = document.getElementById('biContainer');
    if (biContainer && biContainer.classList.contains('active')) {
        if (typeof refreshBICharts === 'function') {
            setTimeout(() => refreshBICharts(), 400);
        }
    }
};

// Sidebar hover reveal - aparece ao encostar o mouse no canto esquerdo
(function initSidebarHoverReveal() {
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Esconder botão de toggle
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) toggleBtn.style.display = 'none';

        // Criar zona de detecção invisível no canto esquerdo
        let hoverZone = document.getElementById('sidebarHoverZone');
        if (!hoverZone) {
            hoverZone = document.createElement('div');
            hoverZone.id = 'sidebarHoverZone';
            hoverZone.style.cssText = `
                position: fixed;
                left: 0;
                top: 0;
                width: 8px;
                height: 100vh;
                z-index: 9999;
                background: transparent;
            `;
            document.body.appendChild(hoverZone);
        }

        let hideTimeout = null;

        // Mostrar sidebar ao entrar na zona de hover
        hoverZone.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            window.toggleSidebar('show');
        });

        // Manter sidebar visível enquanto mouse estiver nela
        sidebar.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });

        // Esconder sidebar ao sair (com delay)
        sidebar.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                window.toggleSidebar('hide');
            }, 300);
        });

        // Iniciar com sidebar escondida
        sidebar.classList.add('collapsed');
    });
})();

// Helper: esconder BI Analytics quando sair da aba
window.hideBIAnalyticsContainer = function () {
    const bi = document.getElementById('biAnalyticsContainer');
    if (bi) {
        bi.style.display = 'none';
    }
};

// Helper: mostrar/esconder topbar
window.showTopbar = function (show = true) {
    const topbar = document.querySelector('.topbar');
    if (topbar) {
        topbar.style.display = show ? 'flex' : 'none';
    }
};

// Função para mostrar Tickets
window.showTickets = function () {
    console.log('🎫 Abrindo Tickets...');

    // Mostrar topbar (só aparece na aba Tickets)
    window.showTopbar(true);

    // Esconder todos os containers
    const containers = [
        'mainContent', 'biContainer', 'presentationSetup', 'presentationContainer', 'presentation-container',
        'comparativeContainer', 'reportsSetup', 'analyticsContainer',
        'biPessoaContainer', 'biTimeContainer', 'insightsContainer', 'glossaryContainer', 'reportsContainer'
    ];

    containers.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'biContainer') {
                elem.classList.remove('active');
            } else if (id === 'mainContent') {
                elem.classList.add('hidden');
            } else {
                elem.style.display = 'none';
            }
        }
    });

    // Esconder BI Analytics se estiver visível
    window.hideBIAnalyticsContainer();

    // Mostrar Tickets
    const ticketsContainer = document.getElementById('ticketsContainer');
    if (ticketsContainer) {
        ticketsContainer.style.display = 'block';
    }

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    const ticketsMenuItem = document.querySelector('[onclick="showTickets()"]');
    if (ticketsMenuItem) ticketsMenuItem.classList.add('active');

    // Usar cache se disponível, senão carregar
    if (window.allTicketsCache && window.allTicketsCache.length > 0) {
        console.log('✅ Usando cache existente');
        if (typeof filterTicketsFromCache === 'function') {
            filterTicketsFromCache();
        }
    } else if (!window.ticketsLoaded && !window.isLoadingTickets && typeof loadTicketsFromSupabase === 'function') {
        console.log('📦 Carregando do Supabase...');
        loadTicketsFromSupabase();
    }
};

// Função para mostrar BI Analytics (única aba com sub-abas)
window.showBIAnalytics = function () {
    console.log('📊 Abrindo BI Analytics...');
    console.log('Dados disponíveis - allTicketsCache:', window.allTicketsCache?.length || 0, 'tickets');

    // Esconder topbar (não precisa nesta aba)
    window.showTopbar(false);

    // Esconder todos os containers
    const containers = [
        'mainContent', 'biContainer', 'presentationSetup', 'presentationContainer', 'presentation-container',
        'comparativeContainer', 'reportsSetup', 'ticketsContainer',
        'analyticsContainer', 'biPessoaContainer', 'biTimeContainer', 'insightsContainer', 'glossaryContainer', 'reportsContainer'
    ];

    containers.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'biContainer') {
                elem.classList.remove('active');
            } else if (id === 'mainContent') {
                elem.classList.add('hidden');
            } else {
                elem.style.display = 'none';
            }
        }
    });
    // Criar ou mostrar container do BI Analytics
    let biAnalyticsContainer = document.getElementById('biAnalyticsContainer');
    if (!biAnalyticsContainer) {
        biAnalyticsContainer = document.createElement('div');
        biAnalyticsContainer.id = 'biAnalyticsContainer';
        biAnalyticsContainer.className = 'bi-analytics-container';
        // Importante: não usar absolute/z-index alto aqui para não cobrir a sidebar
        // Mantemos o container no fluxo normal do main-wrapper
        biAnalyticsContainer.style.cssText = 'position: relative; background: #1e1e2e; overflow: auto; width: 100%; height: auto; min-height: 100%;';
        const mainContainer = document.querySelector('.main-wrapper') || document.querySelector('.main-content') || document.body;
        if (mainContainer) {
            mainContainer.appendChild(biAnalyticsContainer);
        } else {
            console.error('Não foi possível encontrar container principal');
            document.body.appendChild(biAnalyticsContainer);
        }
    }
    biAnalyticsContainer.style.display = 'block';

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    const menuItem = document.querySelector('[onclick="showBIAnalytics()"]');
    if (menuItem) menuItem.classList.add('active');

    // Inicializar BI Analytics
    if (window.biAnalytics) {
        console.log('✅ BI Analytics encontrado, inicializando...');
        window.biAnalytics.initialize();
    } else {
        console.warn('⚠️ BI Analytics não encontrado. Certifique-se de que os scripts foram carregados.');
    }
};

// Manter compatibilidade temporária
window.showAnalytics = window.showBIAnalytics;
window.showBIPessoa = window.showBIAnalytics;
window.showBITime = window.showBIAnalytics;

// Função para mostrar Insights
window.showInsights = function () {
    console.log('💡 Abrindo Insights...');

    // Esconder topbar (não precisa nesta aba)
    window.showTopbar(false);

    // Esconder todos os containers
    const containers = [
        'mainContent', 'biContainer', 'presentationSetup', 'presentationContainer', 'presentation-container',
        'comparativeContainer', 'reportsSetup', 'ticketsContainer',
        'analyticsContainer', 'biPessoaContainer', 'biTimeContainer', 'biAnalyticsContainer', 'glossaryContainer', 'reportsContainer'
    ];

    containers.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'biContainer') {
                elem.classList.remove('active');
            } else if (id === 'mainContent') {
                elem.classList.add('hidden');
            } else {
                elem.style.display = 'none';
            }
        }
    });

    // Criar ou mostrar container de Insights
    let insightsContainer = document.getElementById('insightsContainer');
    if (!insightsContainer) {
        insightsContainer = document.createElement('div');
        insightsContainer.id = 'insightsContainer';
        insightsContainer.className = 'insights-container';
        insightsContainer.style.cssText = 'position: relative; background: #1e1e2e; overflow: auto; width: 100%; height: auto; min-height: 100%;';
        const mainContainer = document.querySelector('.main-wrapper') || document.querySelector('.main-content') || document.body;
        if (mainContainer) {
            mainContainer.appendChild(insightsContainer);
        } else {
            document.body.appendChild(insightsContainer);
        }
    }
    insightsContainer.style.display = 'block';

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    const menuItem = document.querySelector('[onclick="showInsights()"]');
    if (menuItem) menuItem.classList.add('active');

    // Inicializar Insights
    if (window.insightsModule) {
        console.log('✅ Insights Module encontrado, inicializando...');
        window.insightsModule.initialize();
    } else {
        console.warn('⚠️ Insights Module não encontrado.');
        insightsContainer.innerHTML = '<div style="padding: 2rem; color: #ef4444;">Erro: Módulo de Insights não carregado.</div>';
    }
};

// Função para mostrar Glossário
window.showGlossary = function () {
    console.log('📖 Abrindo Glossário...');

    // Esconder topbar (não precisa nesta aba)
    window.showTopbar(false);

    // Esconder todos os containers
    const containers = [
        'mainContent', 'biContainer', 'presentationSetup', 'presentationContainer', 'presentation-container',
        'comparativeContainer', 'reportsSetup', 'ticketsContainer',
        'analyticsContainer', 'biPessoaContainer', 'biTimeContainer', 'biAnalyticsContainer', 'insightsContainer', 'reportsContainer'
    ];

    containers.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'biContainer') {
                elem.classList.remove('active');
            } else if (id === 'mainContent') {
                elem.classList.add('hidden');
            } else {
                elem.style.display = 'none';
            }
        }
    });

    // Criar ou mostrar container de Glossário
    let glossaryContainer = document.getElementById('glossaryContainer');
    if (!glossaryContainer) {
        glossaryContainer = document.createElement('div');
        glossaryContainer.id = 'glossaryContainer';
        glossaryContainer.className = 'glossary-container';
        glossaryContainer.style.cssText = 'position: relative; background: #1e1e2e; overflow: auto; width: 100%; height: auto; min-height: 100%;';
        const mainContainer = document.querySelector('.main-wrapper') || document.querySelector('.main-content') || document.body;
        if (mainContainer) {
            mainContainer.appendChild(glossaryContainer);
        } else {
            document.body.appendChild(glossaryContainer);
        }
    }
    glossaryContainer.style.display = 'block';

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    const menuItem = document.querySelector('[onclick="showGlossary()"]');
    if (menuItem) menuItem.classList.add('active');

    // Inicializar Glossário
    if (window.glossaryModule) {
        console.log('✅ Glossary Module encontrado, inicializando...');
        window.glossaryModule.initialize();
    } else {
        console.warn('⚠️ Glossary Module não encontrado.');
        glossaryContainer.innerHTML = '<div style="padding: 2rem; color: #ef4444;">Erro: Módulo de Glossário não carregado.</div>';
    }
};

// Função para mostrar Relatórios
window.showReports = function () {
    console.log('📋 Abrindo Relatórios...');

    // Esconder topbar (não precisa nesta aba)
    window.showTopbar(false);

    // Esconder todos os containers
    const containers = [
        'mainContent', 'biContainer', 'presentationSetup', 'presentationContainer', 'presentation-container',
        'comparativeContainer', 'reportsSetup', 'ticketsContainer',
        'analyticsContainer', 'biPessoaContainer', 'biTimeContainer', 'biAnalyticsContainer', 'insightsContainer', 'glossaryContainer'
    ];

    containers.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (id === 'biContainer') {
                elem.classList.remove('active');
            } else if (id === 'mainContent') {
                elem.classList.add('hidden');
            } else {
                elem.style.display = 'none';
            }
        }
    });

    // Criar ou mostrar container de Relatórios
    let reportsContainer = document.getElementById('reportsContainer');
    if (!reportsContainer) {
        reportsContainer = document.createElement('div');
        reportsContainer.id = 'reportsContainer';
        reportsContainer.className = 'reports-container';
        reportsContainer.style.cssText = 'position: relative; background: #1e1e2e; overflow: auto; width: 100%; height: auto; min-height: 100%;';
        const mainContainer = document.querySelector('.main-wrapper') || document.querySelector('.main-content') || document.body;
        if (mainContainer) {
            mainContainer.appendChild(reportsContainer);
        } else {
            document.body.appendChild(reportsContainer);
        }
    }
    reportsContainer.style.display = 'block';

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    const menuItem = document.querySelector('[onclick="showReports()"]');
    if (menuItem) menuItem.classList.add('active');

    // Inicializar Relatórios
    if (window.reportsModule) {
        console.log('✅ Reports Module encontrado, inicializando...');
        window.reportsModule.initialize();
    } else {
        console.warn('⚠️ Reports Module não encontrado.');
        reportsContainer.innerHTML = '<div style="padding: 2rem; color: #ef4444;">Erro: Módulo de Relatórios não carregado.</div>';
    }
};

console.log('✅ Funções de navegação carregadas com sucesso');
