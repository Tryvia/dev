/**
 * Módulo de Busca Global
 * Permite buscar tickets por ID, assunto, cliente ou qualquer campo
 */

(function() {
    'use strict';

    const GlobalSearch = {
        isOpen: false,
        searchResults: [],
        selectedIndex: -1,
        recentSearches: [],
        maxRecent: 5,

        colors: {
            bg: '#1e1e2e',
            surface: '#2a2a3e',
            border: '#3f3f46',
            primary: '#3b82f6',
            text: '#e4e4e7',
            textMuted: '#a1a1aa',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444'
        },

        init() {
            this.createSearchModal();
            this.loadRecentSearches();
            this.bindKeyboardShortcut();
            console.log('🔍 Global Search inicializado');
        },

        createSearchModal() {
            const modal = document.createElement('div');
            modal.id = 'globalSearchModal';
            modal.innerHTML = `
                <div class="gs-overlay" onclick="GlobalSearch.close()"></div>
                <div class="gs-container">
                    <div class="gs-header">
                        <div class="gs-input-wrapper">
                            <span class="gs-icon">🔍</span>
                            <input type="text" id="globalSearchInput" 
                                placeholder="Buscar tickets por ID, assunto, cliente..." 
                                autocomplete="off"
                                onkeyup="GlobalSearch.onKeyUp(event)"
                                oninput="GlobalSearch.search(this.value)">
                            <div class="gs-shortcut">ESC</div>
                        </div>
                    </div>
                    <div class="gs-body" id="globalSearchBody">
                        <div class="gs-section">
                            <div class="gs-section-title">💡 Dicas de busca</div>
                            <div class="gs-tips">
                                <span class="gs-tip"><code>#123</code> Buscar por ID</span>
                                <span class="gs-tip"><code>@nome</code> Buscar por agente</span>
                                <span class="gs-tip"><code>!urgente</code> Por prioridade</span>
                                <span class="gs-tip"><code>status:aberto</code> Por status</span>
                            </div>
                        </div>
                        <div class="gs-section gs-recent" id="gsRecentSection" style="display:none;">
                            <div class="gs-section-title">🕐 Buscas recentes</div>
                            <div id="gsRecentList"></div>
                        </div>
                    </div>
                    <div class="gs-footer">
                        <span>↑↓ Navegar</span>
                        <span>↵ Selecionar</span>
                        <span>ESC Fechar</span>
                    </div>
                </div>
            `;

            // Estilos
            const style = document.createElement('style');
            style.textContent = `
                #globalSearchModal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 100000;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                #globalSearchModal.active {
                    display: block;
                }
                .gs-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                }
                .gs-container {
                    position: absolute;
                    top: 15%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 700px;
                    background: ${this.colors.bg};
                    border: 1px solid ${this.colors.border};
                    border-radius: 16px;
                    box-shadow: 0 25px 80px rgba(0,0,0,0.5);
                    overflow: hidden;
                    animation: gsSlideIn 0.2s ease-out;
                }
                @keyframes gsSlideIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .gs-header {
                    padding: 1rem;
                    border-bottom: 1px solid ${this.colors.border};
                }
                .gs-input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: ${this.colors.surface};
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                }
                .gs-icon {
                    font-size: 1.25rem;
                }
                .gs-input-wrapper input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: ${this.colors.text};
                    font-size: 1.1rem;
                }
                .gs-input-wrapper input::placeholder {
                    color: ${this.colors.textMuted};
                }
                .gs-shortcut {
                    background: ${this.colors.border};
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    color: ${this.colors.textMuted};
                }
                .gs-body {
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 1rem;
                }
                .gs-section {
                    margin-bottom: 1rem;
                }
                .gs-section-title {
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .gs-tips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .gs-tip {
                    background: ${this.colors.surface};
                    padding: 0.4rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    color: ${this.colors.textMuted};
                }
                .gs-tip code {
                    color: ${this.colors.primary};
                    font-weight: 600;
                }
                .gs-result {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .gs-result:hover, .gs-result.selected {
                    background: ${this.colors.surface};
                }
                .gs-result.selected {
                    border-left: 3px solid ${this.colors.primary};
                }
                .gs-result-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }
                .gs-result-icon.open { background: rgba(59,130,246,0.2); }
                .gs-result-icon.pending { background: rgba(245,158,11,0.2); }
                .gs-result-icon.resolved { background: rgba(16,185,129,0.2); }
                .gs-result-icon.closed { background: rgba(107,114,128,0.2); }
                .gs-result-content {
                    flex: 1;
                    min-width: 0;
                }
                .gs-result-title {
                    color: ${this.colors.text};
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .gs-result-meta {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                    margin-top: 0.25rem;
                }
                .gs-result-id {
                    color: ${this.colors.primary};
                    font-weight: 600;
                    font-size: 0.85rem;
                }
                .gs-no-results {
                    text-align: center;
                    padding: 2rem;
                    color: ${this.colors.textMuted};
                }
                .gs-no-results-icon {
                    font-size: 3rem;
                    margin-bottom: 0.5rem;
                }
                .gs-footer {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    padding: 0.75rem;
                    border-top: 1px solid ${this.colors.border};
                    background: ${this.colors.surface};
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                }
                .gs-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    gap: 0.5rem;
                    color: ${this.colors.textMuted};
                }
                .gs-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid ${this.colors.border};
                    border-top-color: ${this.colors.primary};
                    border-radius: 50%;
                    animation: gsSpin 0.8s linear infinite;
                }
                @keyframes gsSpin {
                    to { transform: rotate(360deg); }
                }
                .gs-recent-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                    cursor: pointer;
                    color: ${this.colors.textMuted};
                    transition: all 0.15s;
                }
                .gs-recent-item:hover {
                    background: ${this.colors.surface};
                    color: ${this.colors.text};
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(modal);
        },

        bindKeyboardShortcut() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+K ou Ctrl+/ para abrir
                if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === '/')) {
                    e.preventDefault();
                    this.open();
                }
                // ESC para fechar
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },

        open() {
            const modal = document.getElementById('globalSearchModal');
            modal.classList.add('active');
            this.isOpen = true;
            
            const input = document.getElementById('globalSearchInput');
            input.value = '';
            input.focus();
            
            this.showRecentSearches();
            this.resetResults();
        },

        close() {
            const modal = document.getElementById('globalSearchModal');
            modal.classList.remove('active');
            this.isOpen = false;
            this.searchResults = [];
            this.selectedIndex = -1;
        },

        search(query) {
            if (!query || query.length < 2) {
                this.resetResults();
                this.showRecentSearches();
                return;
            }

            const tickets = window.allTicketsCache || window.ticketsData || [];
            if (tickets.length === 0) {
                this.showNoData();
                return;
            }

            this.showLoading();

            // Debounce
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                const results = this.performSearch(query, tickets);
                this.searchResults = results;
                this.selectedIndex = results.length > 0 ? 0 : -1;
                this.renderResults(results, query);
            }, 150);
        },

        performSearch(query, tickets) {
            const q = query.toLowerCase().trim();
            let results = [];

            // Busca por ID (#123)
            if (q.startsWith('#')) {
                const id = q.slice(1);
                results = tickets.filter(t => String(t.id).includes(id));
            }
            // Busca por agente (@nome)
            else if (q.startsWith('@')) {
                const name = q.slice(1);
                results = tickets.filter(t => {
                    const agent = (t.cf_tratativa || t.responder_name || '').toLowerCase();
                    return agent.includes(name);
                });
            }
            // Busca por prioridade (!urgente)
            else if (q.startsWith('!')) {
                const prio = q.slice(1);
                const prioMap = { 'baixa': 1, 'media': 2, 'média': 2, 'alta': 3, 'urgente': 4 };
                const prioCode = prioMap[prio];
                if (prioCode) {
                    results = tickets.filter(t => t.priority == prioCode);
                }
            }
            // Busca por status (status:aberto)
            else if (q.startsWith('status:')) {
                const status = q.slice(7);
                const statusMap = { 'aberto': 2, 'pendente': 3, 'resolvido': 4, 'fechado': 5 };
                const statusCode = statusMap[status];
                if (statusCode) {
                    results = tickets.filter(t => t.status == statusCode);
                }
            }
            // Busca geral
            else {
                results = tickets.filter(t => {
                    const searchFields = [
                        String(t.id),
                        t.subject || '',
                        t.description || '',
                        t.requester_name || '',
                        t.cf_tratativa || '',
                        t.cf_grupo_tratativa || '',
                        t.type || '',
                        t.cf_teste || ''
                    ].join(' ').toLowerCase();
                    
                    return searchFields.includes(q);
                });
            }

            // Limitar resultados
            return results.slice(0, 20);
        },

        renderResults(results, query) {
            const body = document.getElementById('globalSearchBody');
            
            if (results.length === 0) {
                body.innerHTML = `
                    <div class="gs-no-results">
                        <div class="gs-no-results-icon">🔍</div>
                        <div>Nenhum resultado para "<strong>${this.escapeHtml(query)}</strong>"</div>
                        <div style="margin-top:0.5rem;font-size:0.85rem;">Tente buscar por ID, assunto ou cliente</div>
                    </div>
                `;
                return;
            }

            // Salvar busca recente
            this.addRecentSearch(query);

            body.innerHTML = `
                <div class="gs-section">
                    <div class="gs-section-title">📋 ${results.length} resultado${results.length > 1 ? 's' : ''}</div>
                    ${results.map((t, i) => this.renderResultItem(t, i)).join('')}
                </div>
            `;
        },

        renderResultItem(ticket, index) {
            const statusIcons = { 2: '🔵', 3: '🟡', 4: '✅', 5: '⬛' };
            const statusClasses = { 2: 'open', 3: 'pending', 4: 'resolved', 5: 'closed' };
            const statusNames = { 2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado' };
            
            const status = ticket.status || 2;
            const icon = statusIcons[status] || '🎫';
            const statusClass = statusClasses[status] || 'open';
            const statusName = statusNames[status] || 'Aberto';
            
            const date = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('pt-BR') : '';
            const agent = ticket.cf_tratativa || ticket.responder_name || 'Não atribuído';
            
            return `
                <div class="gs-result ${index === this.selectedIndex ? 'selected' : ''}" 
                     onclick="GlobalSearch.selectResult(${index})"
                     data-index="${index}">
                    <div class="gs-result-icon ${statusClass}">${icon}</div>
                    <div class="gs-result-content">
                        <div class="gs-result-title">${this.escapeHtml(ticket.subject || 'Sem assunto')}</div>
                        <div class="gs-result-meta">
                            <span class="gs-result-id">#${ticket.id}</span>
                            <span>${statusName}</span>
                            <span>👤 ${this.escapeHtml(agent)}</span>
                            <span>📅 ${date}</span>
                        </div>
                    </div>
                </div>
            `;
        },

        selectResult(index) {
            const ticket = this.searchResults[index];
            if (!ticket) return;

            console.log('Ticket selecionado:', ticket);
            
            // Disparar evento para outros módulos
            window.dispatchEvent(new CustomEvent('ticketSelected', { 
                detail: { ticket } 
            }));

            // Mostrar detalhes do ticket (se existir função)
            if (window.showTicketDetails) {
                window.showTicketDetails(ticket);
            } else {
                // Fallback: mostrar alert com info básica
                alert(`Ticket #${ticket.id}\n${ticket.subject}\nStatus: ${ticket.status}\nCriado: ${ticket.created_at}`);
            }

            this.close();
        },

        onKeyUp(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateResults(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateResults(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectResult(this.selectedIndex);
                }
            }
        },

        navigateResults(direction) {
            if (this.searchResults.length === 0) return;
            
            this.selectedIndex += direction;
            if (this.selectedIndex < 0) this.selectedIndex = this.searchResults.length - 1;
            if (this.selectedIndex >= this.searchResults.length) this.selectedIndex = 0;

            // Atualizar visual
            document.querySelectorAll('.gs-result').forEach((el, i) => {
                el.classList.toggle('selected', i === this.selectedIndex);
            });

            // Scroll para o item selecionado
            const selected = document.querySelector('.gs-result.selected');
            if (selected) {
                selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        },

        showLoading() {
            document.getElementById('globalSearchBody').innerHTML = `
                <div class="gs-loading">
                    <div class="gs-spinner"></div>
                    <span>Buscando...</span>
                </div>
            `;
        },

        showNoData() {
            document.getElementById('globalSearchBody').innerHTML = `
                <div class="gs-no-results">
                    <div class="gs-no-results-icon">📭</div>
                    <div>Nenhum dado carregado</div>
                    <div style="margin-top:0.5rem;font-size:0.85rem;">Carregue os tickets primeiro</div>
                </div>
            `;
        },

        resetResults() {
            const body = document.getElementById('globalSearchBody');
            body.innerHTML = `
                <div class="gs-section">
                    <div class="gs-section-title">💡 Dicas de busca</div>
                    <div class="gs-tips">
                        <span class="gs-tip"><code>#123</code> Buscar por ID</span>
                        <span class="gs-tip"><code>@nome</code> Buscar por agente</span>
                        <span class="gs-tip"><code>!urgente</code> Por prioridade</span>
                        <span class="gs-tip"><code>status:aberto</code> Por status</span>
                    </div>
                </div>
            `;
            this.showRecentSearches();
        },

        // Buscas recentes
        loadRecentSearches() {
            try {
                const saved = localStorage.getItem('globalSearchRecent');
                this.recentSearches = saved ? JSON.parse(saved) : [];
            } catch (e) {
                this.recentSearches = [];
            }
        },

        saveRecentSearches() {
            localStorage.setItem('globalSearchRecent', JSON.stringify(this.recentSearches));
        },

        addRecentSearch(query) {
            if (!query || query.length < 2) return;
            
            // Remover se já existe
            this.recentSearches = this.recentSearches.filter(s => s !== query);
            
            // Adicionar no início
            this.recentSearches.unshift(query);
            
            // Limitar quantidade
            this.recentSearches = this.recentSearches.slice(0, this.maxRecent);
            
            this.saveRecentSearches();
        },

        showRecentSearches() {
            const section = document.getElementById('gsRecentSection');
            const list = document.getElementById('gsRecentList');
            
            if (!section || !list) return;
            
            if (this.recentSearches.length === 0) {
                section.style.display = 'none';
                return;
            }

            section.style.display = 'block';
            list.innerHTML = this.recentSearches.map(q => `
                <div class="gs-recent-item" onclick="GlobalSearch.useRecentSearch('${this.escapeHtml(q)}')">
                    <span>🕐</span>
                    <span>${this.escapeHtml(q)}</span>
                </div>
            `).join('');
        },

        useRecentSearch(query) {
            const input = document.getElementById('globalSearchInput');
            input.value = query;
            this.search(query);
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Expor globalmente
    window.GlobalSearch = GlobalSearch;

    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GlobalSearch.init());
    } else {
        GlobalSearch.init();
    }
})();
