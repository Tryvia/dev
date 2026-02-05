/**
 * Módulo de Gráficos Interativos
 * Permite clicar em gráficos para filtrar dados e ver detalhes
 */

(function() {
    'use strict';

    const InteractiveCharts = {
        activeFilters: [],
        filterHistory: [],
        maxHistory: 10,

        colors: {
            bg: '#1e1e2e',
            surface: '#2a2a3e',
            border: '#3f3f46',
            primary: '#3b82f6',
            text: '#e4e4e7',
            textMuted: '#a1a1aa'
        },

        init() {
            this.createFilterBar();
            this.createDetailsModal();
            console.log('📊 Interactive Charts inicializado');
        },

        createFilterBar() {
            const bar = document.createElement('div');
            bar.id = 'chartFilterBar';
            bar.innerHTML = `
                <div class="cfb-content">
                    <span class="cfb-label">🎯 Filtros ativos:</span>
                    <div class="cfb-filters" id="cfbFilters"></div>
                    <button class="cfb-clear" onclick="InteractiveCharts.clearAllFilters()" style="display:none;">
                        ✕ Limpar todos
                    </button>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                #chartFilterBar {
                    display: none;
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${this.colors.bg};
                    border: 1px solid ${this.colors.border};
                    border-radius: 12px;
                    padding: 0.75rem 1.25rem;
                    z-index: 9000;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                    animation: cfbSlideUp 0.3s ease-out;
                }
                #chartFilterBar.active {
                    display: block;
                }
                @keyframes cfbSlideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .cfb-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .cfb-label {
                    color: ${this.colors.textMuted};
                    font-size: 0.85rem;
                    white-space: nowrap;
                }
                .cfb-filters {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .cfb-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(59, 130, 246, 0.15);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: ${this.colors.primary};
                    padding: 0.4rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .cfb-chip:hover {
                    background: rgba(59, 130, 246, 0.25);
                }
                .cfb-chip-remove {
                    font-size: 0.7rem;
                    opacity: 0.7;
                }
                .cfb-chip-remove:hover {
                    opacity: 1;
                }
                .cfb-clear {
                    background: transparent;
                    border: 1px solid ${this.colors.border};
                    color: ${this.colors.textMuted};
                    padding: 0.4rem 0.75rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.15s;
                }
                .cfb-clear:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: #ef4444;
                    color: #ef4444;
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(bar);
        },

        createDetailsModal() {
            const modal = document.createElement('div');
            modal.id = 'chartDetailsModal';
            modal.innerHTML = `
                <div class="cdm-overlay" onclick="InteractiveCharts.closeDetails()"></div>
                <div class="cdm-container">
                    <div class="cdm-header">
                        <h3 class="cdm-title" id="cdmTitle">Detalhes</h3>
                        <button class="cdm-close" onclick="InteractiveCharts.closeDetails()">✕</button>
                    </div>
                    <div class="cdm-body" id="cdmBody"></div>
                    <div class="cdm-footer">
                        <button class="cdm-btn cdm-btn-primary" onclick="InteractiveCharts.applyFilterFromDetails()">
                            🎯 Aplicar como filtro
                        </button>
                        <button class="cdm-btn" onclick="InteractiveCharts.exportDetails()">
                            📥 Exportar
                        </button>
                    </div>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                #chartDetailsModal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 99999;
                }
                #chartDetailsModal.active {
                    display: block;
                }
                .cdm-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                }
                .cdm-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
                    background: ${this.colors.bg};
                    border: 1px solid ${this.colors.border};
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: cdmSlideIn 0.25s ease-out;
                }
                @keyframes cdmSlideIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                .cdm-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid ${this.colors.border};
                }
                .cdm-title {
                    margin: 0;
                    color: ${this.colors.text};
                    font-size: 1.1rem;
                }
                .cdm-close {
                    background: transparent;
                    border: none;
                    color: ${this.colors.textMuted};
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: all 0.15s;
                }
                .cdm-close:hover {
                    background: ${this.colors.surface};
                    color: ${this.colors.text};
                }
                .cdm-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }
                .cdm-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .cdm-stat {
                    background: ${this.colors.surface};
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                }
                .cdm-stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: ${this.colors.primary};
                }
                .cdm-stat-label {
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                    margin-top: 0.25rem;
                }
                .cdm-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .cdm-table th, .cdm-table td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid ${this.colors.border};
                }
                .cdm-table th {
                    background: ${this.colors.surface};
                    color: ${this.colors.textMuted};
                    font-weight: 500;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                }
                .cdm-table tr:hover {
                    background: rgba(59, 130, 246, 0.05);
                }
                .cdm-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid ${this.colors.border};
                }
                .cdm-btn {
                    padding: 0.6rem 1.25rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.15s;
                    border: 1px solid ${this.colors.border};
                    background: transparent;
                    color: ${this.colors.text};
                }
                .cdm-btn:hover {
                    background: ${this.colors.surface};
                }
                .cdm-btn-primary {
                    background: ${this.colors.primary};
                    border-color: ${this.colors.primary};
                    color: white;
                }
                .cdm-btn-primary:hover {
                    background: #2563eb;
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(modal);
        },

        // Método para registrar um gráfico como interativo
        registerChart(canvasId, options = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            canvas.style.cursor = 'pointer';
            canvas.dataset.interactive = 'true';

            // Adicionar indicador visual
            const wrapper = canvas.parentElement;
            if (wrapper && !wrapper.querySelector('.ic-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'ic-indicator';
                indicator.innerHTML = '👆 Clique para filtrar';
                indicator.style.cssText = `
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    background: rgba(59, 130, 246, 0.9);
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointer-events: none;
                `;
                
                if (wrapper.style.position !== 'absolute' && wrapper.style.position !== 'relative') {
                    wrapper.style.position = 'relative';
                }
                wrapper.appendChild(indicator);

                canvas.addEventListener('mouseenter', () => {
                    indicator.style.opacity = '1';
                });
                canvas.addEventListener('mouseleave', () => {
                    indicator.style.opacity = '0';
                });
            }

            return canvas;
        },

        // Chamado quando usuário clica em uma parte do gráfico
        onChartClick(chartType, data) {
            this.currentClickData = { chartType, data };
            this.showDetails(chartType, data);
        },

        showDetails(chartType, data) {
            const modal = document.getElementById('chartDetailsModal');
            const title = document.getElementById('cdmTitle');
            const body = document.getElementById('cdmBody');

            const tickets = this.getFilteredTickets(chartType, data);
            
            title.textContent = this.getDetailTitle(chartType, data);
            body.innerHTML = this.renderDetailsContent(chartType, data, tickets);

            modal.classList.add('active');
        },

        closeDetails() {
            document.getElementById('chartDetailsModal').classList.remove('active');
        },

        getDetailTitle(chartType, data) {
            const titles = {
                'status': `Status: ${data.label}`,
                'priority': `Prioridade: ${data.label}`,
                'person': `Pessoa: ${data.label}`,
                'team': `Time: ${data.label}`,
                'system': `Sistema: ${data.label}`,
                'month': `Mês: ${data.label}`,
                'sla': `SLA: ${data.label}`
            };
            return titles[chartType] || `Detalhes: ${data.label}`;
        },

        getFilteredTickets(chartType, data) {
            const tickets = window.allTicketsCache || window.ticketsData || [];
            
            switch(chartType) {
                case 'status':
                    return tickets.filter(t => t.status == data.value);
                case 'priority':
                    return tickets.filter(t => t.priority == data.value);
                case 'person':
                    return tickets.filter(t => (t.cf_tratativa || '').includes(data.label));
                case 'team':
                    return tickets.filter(t => (t.cf_grupo_tratativa || '').includes(data.label));
                case 'system':
                    return tickets.filter(t => (t.cf_teste || t.cf_sistema || '').includes(data.label));
                case 'sla':
                    if (data.value === 'within') {
                        return tickets.filter(t => {
                            if (!t.stats_first_responded_at || !t.created_at) return false;
                            const responseTime = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                            return responseTime <= 4;
                        });
                    } else {
                        return tickets.filter(t => {
                            if (!t.stats_first_responded_at || !t.created_at) return true;
                            const responseTime = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
                            return responseTime > 4;
                        });
                    }
                default:
                    return tickets;
            }
        },

        renderDetailsContent(chartType, data, tickets) {
            const total = tickets.length;
            const resolved = tickets.filter(t => [4,5].includes(Number(t.status))).length;
            const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

            // Calcular tempo médio
            let avgTime = 0;
            const timesArray = tickets
                .filter(t => t.stats_resolved_at && t.created_at)
                .map(t => (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60));
            if (timesArray.length > 0) {
                avgTime = (timesArray.reduce((a,b) => a+b, 0) / timesArray.length).toFixed(1);
            }

            return `
                <div class="cdm-stats">
                    <div class="cdm-stat">
                        <div class="cdm-stat-value">${total}</div>
                        <div class="cdm-stat-label">Total de Tickets</div>
                    </div>
                    <div class="cdm-stat">
                        <div class="cdm-stat-value">${resolved}</div>
                        <div class="cdm-stat-label">Resolvidos</div>
                    </div>
                    <div class="cdm-stat">
                        <div class="cdm-stat-value">${resolutionRate}%</div>
                        <div class="cdm-stat-label">Taxa de Resolução</div>
                    </div>
                    <div class="cdm-stat">
                        <div class="cdm-stat-value">${avgTime}h</div>
                        <div class="cdm-stat-label">Tempo Médio</div>
                    </div>
                </div>
                
                <table class="cdm-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Assunto</th>
                            <th>Status</th>
                            <th>Criado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tickets.slice(0, 20).map(t => `
                            <tr onclick="GlobalSearch && GlobalSearch.selectResult && GlobalSearch.selectResult(${tickets.indexOf(t)})" style="cursor:pointer;">
                                <td style="color:${this.colors.primary};font-weight:600;">#${t.id}</td>
                                <td>${this.escapeHtml((t.subject || '').slice(0, 50))}${(t.subject || '').length > 50 ? '...' : ''}</td>
                                <td>${this.getStatusBadge(t.status)}</td>
                                <td>${t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${tickets.length > 20 ? `<p style="text-align:center;color:${this.colors.textMuted};margin-top:1rem;">Mostrando 20 de ${tickets.length} tickets</p>` : ''}
            `;
        },

        getStatusBadge(status) {
            const badges = {
                2: '<span style="background:rgba(59,130,246,0.15);color:#3b82f6;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.75rem;">Aberto</span>',
                3: '<span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.75rem;">Pendente</span>',
                4: '<span style="background:rgba(16,185,129,0.15);color:#10b981;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.75rem;">Resolvido</span>',
                5: '<span style="background:rgba(107,114,128,0.15);color:#6b7280;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.75rem;">Fechado</span>'
            };
            return badges[status] || badges[2];
        },

        applyFilterFromDetails() {
            if (!this.currentClickData) return;
            
            this.addFilter(this.currentClickData.chartType, this.currentClickData.data);
            this.closeDetails();
        },

        addFilter(chartType, data) {
            // Verificar se filtro já existe
            const exists = this.activeFilters.some(f => 
                f.chartType === chartType && f.data.value === data.value
            );
            
            if (exists) return;

            this.activeFilters.push({ chartType, data });
            this.updateFilterBar();
            this.applyFilters();

            // Salvar no histórico
            this.filterHistory.unshift({ chartType, data, timestamp: Date.now() });
            this.filterHistory = this.filterHistory.slice(0, this.maxHistory);
        },

        removeFilter(index) {
            this.activeFilters.splice(index, 1);
            this.updateFilterBar();
            this.applyFilters();
        },

        clearAllFilters() {
            this.activeFilters = [];
            this.updateFilterBar();
            this.applyFilters();
        },

        updateFilterBar() {
            const bar = document.getElementById('chartFilterBar');
            const container = document.getElementById('cfbFilters');
            const clearBtn = bar.querySelector('.cfb-clear');

            if (this.activeFilters.length === 0) {
                bar.classList.remove('active');
                return;
            }

            bar.classList.add('active');
            clearBtn.style.display = this.activeFilters.length > 1 ? 'block' : 'none';

            container.innerHTML = this.activeFilters.map((f, i) => `
                <div class="cfb-chip" onclick="InteractiveCharts.removeFilter(${i})">
                    <span>${this.getFilterIcon(f.chartType)} ${f.data.label}</span>
                    <span class="cfb-chip-remove">✕</span>
                </div>
            `).join('');
        },

        getFilterIcon(chartType) {
            const icons = {
                status: '📊',
                priority: '🔥',
                person: '👤',
                team: '👥',
                system: '💻',
                month: '📅',
                sla: '⏱️'
            };
            return icons[chartType] || '🎯';
        },

        applyFilters() {
            const tickets = window.allTicketsCache || [];
            
            if (this.activeFilters.length === 0) {
                window.ticketsData = tickets;
                this.refreshCharts();
                return;
            }

            let filtered = [...tickets];

            this.activeFilters.forEach(f => {
                filtered = this.getFilteredTickets(f.chartType, f.data).filter(t => 
                    filtered.some(ft => ft.id === t.id)
                );
            });

            window.ticketsData = filtered;
            this.refreshCharts();

            // Disparar evento
            window.dispatchEvent(new CustomEvent('filtersApplied', {
                detail: { filters: this.activeFilters, ticketCount: filtered.length }
            }));
        },

        refreshCharts() {
            // Tentar atualizar via BIAnalytics
            if (window.biAnalytics && typeof window.biAnalytics.applyFilters === 'function') {
                window.biAnalytics.applyFilters();
            }
            
            // Disparar evento genérico
            window.dispatchEvent(new CustomEvent('chartsRefresh'));
        },

        exportDetails() {
            if (!this.currentClickData) return;

            const tickets = this.getFilteredTickets(
                this.currentClickData.chartType, 
                this.currentClickData.data
            );

            const data = tickets.map(t => ({
                ID: t.id,
                Assunto: t.subject,
                Status: t.status,
                Prioridade: t.priority,
                Criado: t.created_at,
                Resolvido: t.stats_resolved_at || '',
                Agente: t.cf_tratativa || '',
                Time: t.cf_grupo_tratativa || ''
            }));

            // Exportar como CSV
            const headers = Object.keys(data[0] || {});
            const csv = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tickets_${this.currentClickData.data.label}_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };

    // Expor globalmente
    window.InteractiveCharts = InteractiveCharts;

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => InteractiveCharts.init());
    } else {
        InteractiveCharts.init();
    }
})();
