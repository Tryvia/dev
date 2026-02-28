  const setorUsuario = sessionStorage.getItem('setor');
        const RELEASE_SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
        const RELEASE_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIzMzAzNSwiZXhwIjoyMDYzODA5MDM1fQ.CVXkKh9yul_Mv2YMhPsDo4CmkQevxpkeI1CtitORpJ0';
        const releaseClient = supabase.createClient(RELEASE_SUPABASE_URL, RELEASE_SUPABASE_KEY);
        const SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc';
        
        // Exportar para escopo global para que portal.js e outros scripts possam acessar
        window.RELEASE_SUPABASE_URL = RELEASE_SUPABASE_URL;
        window.RELEASE_SUPABASE_KEY = RELEASE_SUPABASE_KEY;
        window.releaseClient = releaseClient;
        window.SUPABASE_URL = SUPABASE_URL;
        window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

        // Função para mostrar/ocultar abas
        function showTab(tabId) {
            console.log('Mostrando aba:', tabId);
            // Oculta todas as seções de conteúdo
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Mostra a seção selecionada
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.style.display = 'block';
                selectedTab.classList.add('active');
                console.log('Elemento encontrado e exibido:', tabId);
            } else {
                console.error('Elemento não encontrado:', tabId);
            }

            if (tabId === 'documents') {
                if (typeof loadDocuments === 'function') loadDocuments();
            }

            if (tabId === 'dashboard') {
                if (typeof fetchAndRenderDashboards === 'function') fetchAndRenderDashboards();
            }

            if (tabId === 'homologacao') {
                if (typeof fetchAndRenderHomologacoes === 'function') fetchAndRenderHomologacoes();
            }

            // Remove a classe active de todos os botões
            document.querySelectorAll('.nav-item button').forEach(button => {
                button.parentElement.classList.remove('active');
            });

            // Adiciona a classe active ao botão selecionado
            const selectedButton = document.querySelector(`button[onclick*="showTab('${tabId}')"]`);
            if (selectedButton) {
                selectedButton.parentElement.classList.add('active');
            }
        }