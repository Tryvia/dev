/**
 * BI Analytics Module - Unified Business Intelligence Dashboard
 * Combina análises de Pessoas e Times em uma única interface moderna
 */

// ========== CONFIGURAÇÃO DE MEMBROS POR TIME (Whitelist) ==========
// Define quais pessoas pertencem oficialmente a cada time
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
    // Acompanhamento usa a mesma lista do Atendimento (modo Tags)
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
    // Adicione outros times conforme necessário:
    // 'OutroTime': ['Pessoa1', 'Pessoa2', ...]
};

// ========== ESTADO DE EXPANSÃO DE GRÁFICOS (encapsulado) ==========
// Estado movido para dentro do biAnalytics quando disponível
// Fallback para objeto global caso biAnalytics não esteja inicializado
window._biExpandState = {
    page: 0,
    chartId: null
};

window.expandChart = function(chartId, title) {
    // Buscar o canvas original
    const originalCanvas = document.getElementById(chartId);
    if (!originalCanvas) {
        console.warn(`Canvas ${chartId} não encontrado`);
        return;
    }
    
    // Usar estado do biAnalytics se disponível, senão usar estado global
    const state = window.biAnalytics?._expandState || window._biExpandState;
    state.chartId = chartId;
    state.page = 0;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'chartExpandModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.92);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        animation: fadeIn 0.2s ease;
    `;
    
    // Adicionar style de animação se não existir
    if (!document.getElementById('expandChartStyles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'expandChartStyles';
        styleEl.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .expand-nav-btn { 
                background: rgba(102,126,234,0.2); border: 1px solid rgba(102,126,234,0.4);
                color: #a5b4fc; width: 50px; height: 50px; border-radius: 50%;
                font-size: 1.5rem; cursor: pointer; transition: all 0.2s;
                display: flex; align-items: center; justify-content: center;
            }
            .expand-nav-btn:hover { background: rgba(102,126,234,0.4); transform: scale(1.1); }
            .expand-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Verificar se o gráfico tem paginação
    const hasPagination = ['chartTop10', 'chartResolution', 'chartSLAByEntity'].includes(chartId);
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 20px;
            max-width: 95vw;
            max-height: 92vh;
            width: 1300px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 80px rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.1);
            animation: scaleIn 0.25s ease;
        ">
            <div style="
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h2 style="margin: 0; color: white; font-size: 1.4rem; display: flex; align-items: center; gap: 0.75rem;">
                    ${title}
                </h2>
                <button onclick="const m=document.getElementById('chartExpandModal'); if(m && m._restoreChatbot) m._restoreChatbot(); m.remove();" style="
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(239,68,68,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    ✕
                </button>
            </div>
            <div style="
                padding: 1.5rem 2rem 2rem 2rem;
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            ">
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; position: relative;">
                    <canvas id="expandedChart"></canvas>
                    <div id="expandedChartTooltip" style="
                        position: absolute;
                        display: none;
                        background: rgba(15, 23, 42, 0.95);
                        color: white;
                        padding: 10px 14px;
                        border-radius: 8px;
                        font-size: 0.9rem;
                        pointer-events: none;
                        z-index: 1000;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                        border: 1px solid rgba(102,126,234,0.4);
                        max-width: 280px;
                    "></div>
                </div>
                ${hasPagination ? `
                <div id="expandedPagination" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                ">
                    <button class="expand-nav-btn" onclick="window.expandChartNavigate(-1)">◀</button>
                    <span id="expandedPageInfo" style="color: #94a3b8; font-size: 1rem; min-width: 80px; text-align: center;">1 / 1</span>
                    <button class="expand-nav-btn" onclick="window.expandChartNavigate(1)">▶</button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Esconder chatbot IA durante modo expandido (imersão)
    const chatbotElements = document.querySelectorAll('#chatbotContainer, #chatbotToggle, .chatbot-toggle, .ai-assistant-btn, [id*="chatbot"], [class*="chatbot"]');
    chatbotElements.forEach(el => {
        if (el) {
            el._previousDisplay = el.style.display;
            el.style.display = 'none';
        }
    });
    
    // Função para restaurar chatbot
    const restoreChatbot = () => {
        chatbotElements.forEach(el => {
            if (el) el.style.display = el._previousDisplay || '';
        });
    };
    
    // Fechar ao clicar fora
    modal.onclick = (e) => { 
        if (e.target === modal) { 
            modal.remove(); 
            restoreChatbot();
        } 
    };
    
    // Navegação com teclado
    const handleKey = (e) => {
        if (e.key === 'Escape') { 
            modal.remove(); 
            document.removeEventListener('keydown', handleKey); 
            restoreChatbot();
        }
        if (e.key === 'ArrowLeft') window.expandChartNavigate(-1);
        if (e.key === 'ArrowRight') window.expandChartNavigate(1);
    };
    document.addEventListener('keydown', handleKey);
    
    // Também restaurar ao clicar no botão X
    modal._restoreChatbot = restoreChatbot;
    
    document.body.appendChild(modal);
    
    // Renderizar gráfico expandido
    setTimeout(() => window.renderExpandedChart(), 50);
};

// Navegação de páginas no gráfico expandido
window.expandChartNavigate = function(direction) {
    const state = window.biAnalytics?._expandState || window._biExpandState;
    const chartId = state.chartId;
    if (!chartId || !window.biAnalytics) return;
    
    const metrics = window.biAnalytics._lastMetrics;
    if (!metrics) return;
    
    // Obter dados e total de páginas baseado no tipo de gráfico
    let dataLength = 0;
    
    if (chartId === 'chartTop10' || chartId === 'chartResolution') {
        if (metrics.entityMap) {
            dataLength = metrics.entityMap.size || 0;
        }
    } else if (chartId === 'chartSLAByEntity') {
        if (metrics.entityMap) {
            dataLength = metrics.entityMap.size || 0;
        }
    }
    
    const totalPages = Math.max(1, Math.ceil(dataLength / 10));
    
    // Navegar usando estado encapsulado
    state.page = Math.max(0, Math.min(totalPages - 1, state.page + direction));
    
    // Atualizar info
    const pageInfo = document.getElementById('expandedPageInfo');
    if (pageInfo) pageInfo.textContent = `${state.page + 1} / ${totalPages}`;
    
    // Re-renderizar
    window.renderExpandedChart();
};

// Renderizar gráfico em alta resolução no modal
window.renderExpandedChart = function() {
    const canvas = document.getElementById('expandedChart');
    const state = window.biAnalytics?._expandState || window._biExpandState;
    const chartId = state.chartId;
    if (!canvas || !chartId || !window.biAnalytics) return;
    
    const bi = window.biAnalytics;
    const metrics = bi._lastMetrics;
    
    // Gráficos de produtividade usam métricas diferentes
    const prodCharts = ['chartByDayOfWeek', 'chartByHour', 'chartProductivityRanking', 'chartTicketsPerDay'];
    const hasProdMetrics = bi._lastDayOfWeekMetrics || bi._lastByHourMetrics || bi._productivityTableMetrics;
    
    // Permitir gráficos de produtividade mesmo sem _lastMetrics
    if (!metrics && !hasProdMetrics && !prodCharts.includes(chartId)) return;
    
    // Tamanho grande para alta resolução
    const dpr = window.devicePixelRatio || 1;
    const width = Math.min(1200, window.innerWidth - 150);
    const height = Math.min(550, window.innerHeight - 250);
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    
    const colors = bi.colors;
    const gradients = bi.gradients;
    const page = state.page;
    
    // Renderizar baseado no tipo
    switch(chartId) {
        case 'chartTop10':
            renderExpandedRanking(ctx, width, height, metrics, colors, gradients, page, 'total');
            break;
        case 'chartResolution':
            renderExpandedRanking(ctx, width, height, metrics, colors, gradients, page, 'resolution');
            break;
        case 'chartSLAByEntity':
            renderExpandedSLAByEntityFixed(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartStatus':
            renderExpandedStatus(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartPriority':
            renderExpandedPriority(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartTimeline':
            renderExpandedTimeline(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartSLA':
            renderExpandedSLA(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartSystems':
            renderExpandedSystems(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartSLATrend':
            renderExpandedSLATrend(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartStatusStacked':
            renderExpandedStatusStacked(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartAgingHistogram':
            renderExpandedAgingHistogram(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartPipelineFunnel':
            renderExpandedPipelineFunnel(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartFinalized':
            renderExpandedFinalized(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartProductivityRanking':
            renderExpandedProductivityRanking(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartTicketsPerDay':
            renderExpandedTicketsPerDay(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartByDayOfWeek':
            renderExpandedByDayOfWeek(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartByHour':
            renderExpandedByHour(ctx, width, height, metrics, colors, bi);
            break;
        case 'chartFirstResponse':
            renderExpandedFirstResponse(ctx, width, height, bi);
            break;
        case 'chartCSAT':
            renderExpandedCSAT(ctx, width, height, bi);
            break;
        case 'chartHeatmap':
            renderExpandedHeatmap(ctx, width, height, bi);
            break;
        case 'chartWorkload':
            renderExpandedWorkload(ctx, width, height, bi);
            break;
        case 'chartComparativoMensal':
            renderExpandedComparativoMensal(ctx, width, height, bi);
            break;
        case 'chartTendencia':
            renderExpandedTendencia(ctx, width, height, bi);
            break;
        case 'chartRankingSLA':
            renderExpandedRankingSLA(ctx, width, height, bi);
            break;
        case 'chartRankingResolucao':
            renderExpandedRankingResolucao(ctx, width, height, bi);
            break;
        case 'chartEficiencia':
            renderExpandedEficiencia(ctx, width, height, bi);
            break;
        case 'chartParados':
            renderExpandedParados(ctx, width, height, bi);
            break;
        case 'chartAguardando':
            renderExpandedAguardando(ctx, width, height, bi);
            break;
        default:
            // Fallback: copiar original com melhor qualidade
            const orig = document.getElementById(chartId);
            if (orig) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(orig, 0, 0, width, height);
            }
    }
    
    // Atualizar info de página (para gráficos com paginação)
    let dataLength = 0;
    if (metrics && metrics.entityMap) {
        dataLength = metrics.entityMap.size || 0;
    }
    const totalPages = Math.max(1, Math.ceil(dataLength / 10));
    
    const pageInfo = document.getElementById('expandedPageInfo');
    if (pageInfo) pageInfo.textContent = `${page + 1} / ${totalPages}`;
};

// ========== HELPERS GENÉRICOS PARA GRÁFICOS EXPANDIDOS ==========

/**
 * Configura tooltip interativo para gráficos expandidos
 */
window.setupExpandedTooltip = function(canvas, regions, formatFn) {
    const tooltip = document.getElementById('expandedChartTooltip');
    if (!tooltip || !canvas) return;
    
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        
        let found = null;
        for (const region of regions) {
            if (region.contains(mx, my)) {
                found = region;
                break;
            }
        }
        
        if (found) {
            tooltip.innerHTML = formatFn(found.data);
            tooltip.style.display = 'block';
            // Posicionar tooltip relativo ao container
            const containerRect = canvas.parentElement.getBoundingClientRect();
            let left = e.clientX - containerRect.left + 15;
            let top = e.clientY - containerRect.top - 10;
            // Ajustar se sair da tela
            if (left + 280 > containerRect.width) left = e.clientX - containerRect.left - 290;
            if (top + 100 > containerRect.height) top = e.clientY - containerRect.top - 80;
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.style.display = 'none';
            canvas.style.cursor = 'default';
        }
    };
    
    canvas.onmouseleave = () => {
        tooltip.style.display = 'none';
        canvas.style.cursor = 'default';
    };
};

/**
 * Renderiza mensagem de "sem dados" centralizada
 */
function renderNoDataMessage(ctx, width, height, message, colors) {
    ctx.fillStyle = colors?.textMuted || '#94a3b8';
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(message || 'Sem dados disponíveis', width/2, height/2);
}

/**
 * Renderiza grid horizontal para gráficos de linha/barra
 */
function renderGrid(ctx, padding, width, height, divisions, colors) {
    const chartHeight = height - padding.top - padding.bottom;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= divisions; i++) {
        const y = padding.top + (chartHeight / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }
}

/**
 * Renderiza barras horizontais com visual PREMIUM
 */
function renderHorizontalBars(ctx, items, options) {
    const { 
        padding = { top: 40, right: 100, bottom: 40, left: 180 },
        width, height, colors, gradients,
        barHeight = 38, gap = 10, showRank = true
    } = options;
    
    if (!items.length) return;
    
    const maxVal = Math.max(...items.map(i => i.value), 1);
    const chartWidth = width - padding.left - padding.right;
    const borderRadius = 8;
    
    // Paleta premium
    const premiumColors = [
        { main: '#6366f1', glow: '#818cf8', dark: '#4f46e5' },
        { main: '#8b5cf6', glow: '#a78bfa', dark: '#7c3aed' },
        { main: '#3b82f6', glow: '#60a5fa', dark: '#2563eb' },
        { main: '#06b6d4', glow: '#22d3ee', dark: '#0891b2' },
        { main: '#10b981', glow: '#34d399', dark: '#059669' },
        { main: '#f59e0b', glow: '#fbbf24', dark: '#d97706' },
        { main: '#ec4899', glow: '#f472b6', dark: '#db2777' },
        { main: '#f97316', glow: '#fb923c', dark: '#ea580c' },
    ];
    
    items.forEach((item, i) => {
        const y = padding.top + i * (barHeight + gap);
        const w = Math.max(12, (item.value / maxVal) * chartWidth);
        const colorSet = premiumColors[i % premiumColors.length];
        
        ctx.save();
        
        // Fundo (track)
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.roundRect(padding.left, y, chartWidth, barHeight, borderRadius);
        ctx.fill();
        
        // Sombra premium
        ctx.shadowColor = colorSet.glow;
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 2;
        
        // Gradiente premium
        const gradient = ctx.createLinearGradient(padding.left, y, padding.left + w, y);
        gradient.addColorStop(0, colorSet.dark);
        gradient.addColorStop(0.3, colorSet.main);
        gradient.addColorStop(0.7, colorSet.main);
        gradient.addColorStop(1, colorSet.glow);
        
        // Barra principal
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, w, barHeight, borderRadius);
        ctx.fill();
        
        // Glass effect
        const glassGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        glassGradient.addColorStop(0, 'rgba(255,255,255,0.25)');
        glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        glassGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = glassGradient;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, w, barHeight, borderRadius);
        ctx.fill();
        
        ctx.restore();
        
        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '500 14px system-ui';
        ctx.textAlign = 'right';
        const label = item.label.length > 20 ? item.label.slice(0, 18) + '..' : item.label;
        ctx.fillText(showRank ? `${i + 1}. ${label}` : label, padding.left - 12, y + barHeight/2 + 5);
        
        // Valor
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left';
        const valueText = item.suffix ? `${item.value}${item.suffix}` : item.value.toLocaleString();
        ctx.fillText(valueText, padding.left + w + 12, y + barHeight/2 + 5);
    });
}

// ========== FUNÇÕES DE RENDERIZAÇÃO EXPANDIDA ==========

// Ranking expandido em alta resolução - VISUAL PREMIUM
function renderExpandedRanking(ctx, width, height, metrics, colors, gradients, page, mode) {
    // Obter dados do entityMap (mesmo que o gráfico original)
    if (!metrics.entityMap || metrics.entityMap.size === 0) {
        renderNoDataMessage(ctx, width, height, 'Sem dados disponíveis', colors);
        return;
    }
    
    // Converter Map para array ordenado
    const allSorted = Array.from(metrics.entityMap.entries())
        .filter(([, d]) => d.total >= 1)
        .sort((a, b) => {
            if (mode === 'resolution') {
                return parseFloat(b[1].resolutionRate || 0) - parseFloat(a[1].resolutionRate || 0);
            }
            return b[1].total - a[1].total;
        });
    
    const itemsPerPage = 10;
    const start = page * itemsPerPage;
    const pageData = allSorted.slice(start, start + itemsPerPage);
    
    if (!pageData.length) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = '18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados disponíveis', width/2, height/2);
        return;
    }
    
    const maxVal = mode === 'resolution' ? 100 : Math.max(...allSorted.map(([, d]) => d.total || 0), 1);
    
    // Paleta premium para volume
    const premiumColors = [
        { main: '#6366f1', glow: '#818cf8', dark: '#4f46e5' },  // Indigo
        { main: '#8b5cf6', glow: '#a78bfa', dark: '#7c3aed' },  // Violet
        { main: '#3b82f6', glow: '#60a5fa', dark: '#2563eb' },  // Blue
        { main: '#06b6d4', glow: '#22d3ee', dark: '#0891b2' },  // Cyan
        { main: '#10b981', glow: '#34d399', dark: '#059669' },  // Emerald
    ];
    
    // Paleta para taxa de resolução (semântica)
    const rateColors = {
        excellent: { main: '#10b981', glow: '#34d399', dark: '#059669' },
        good: { main: '#f59e0b', glow: '#fbbf24', dark: '#d97706' },
        low: { main: '#ef4444', glow: '#f87171', dark: '#dc2626' }
    };
    
    const padding = { left: 220, right: 100, top: 30, bottom: 30 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = Math.min(45, (height - padding.top - padding.bottom) / pageData.length - 10);
    const borderRadius = 8;
    
    pageData.forEach(([entity, data], i) => {
        const globalIndex = start + i;
        const y = padding.top + i * (barHeight + 10);
        const value = mode === 'resolution' ? parseFloat(data.resolutionRate || 0) : (data.total || 0);
        const barWidth = Math.max(12, (value / maxVal) * chartWidth);
        
        // Selecionar cor
        let colorSet;
        if (mode === 'resolution') {
            colorSet = value >= 80 ? rateColors.excellent : value >= 50 ? rateColors.good : rateColors.low;
        } else {
            colorSet = premiumColors[globalIndex % premiumColors.length];
        }
        
        ctx.save();
        
        // Fundo da barra (track) - visual premium
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.roundRect(padding.left, y, chartWidth, barHeight, borderRadius);
        ctx.fill();
        
        // Sombra premium
        ctx.shadowColor = colorSet.glow;
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 2;
        
        // Gradiente premium horizontal
        const gradient = ctx.createLinearGradient(padding.left, y, padding.left + barWidth, y);
        gradient.addColorStop(0, colorSet.dark);
        gradient.addColorStop(0.3, colorSet.main);
        gradient.addColorStop(0.7, colorSet.main);
        gradient.addColorStop(1, colorSet.glow);
        
        // Barra principal
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, barWidth, barHeight, borderRadius);
        ctx.fill();
        
        // Brilho interno (glass effect)
        const glassGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        glassGradient.addColorStop(0, 'rgba(255,255,255,0.25)');
        glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        glassGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = glassGradient;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, barWidth, barHeight, borderRadius);
        ctx.fill();
        
        ctx.restore();
        
        // Posição e nome - estilo premium
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '600 15px system-ui';
        ctx.textAlign = 'right';
        const displayName = entity.length > 22 ? entity.substring(0, 20) + '..' : entity;
        ctx.fillText(`${globalIndex + 1}. ${displayName}`, padding.left - 15, y + barHeight/2 + 5);
        
        // Valor - destacado
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px system-ui';
        ctx.textAlign = 'left';
        const displayVal = mode === 'resolution' ? `${value.toFixed(1)}%` : value.toLocaleString();
        ctx.fillText(displayVal, padding.left + barWidth + 15, y + barHeight/2 + 5);
    });
}

// SLA por Entidade expandido
function renderExpandedSLAByEntity(ctx, width, height, metrics, colors, page) {
    // Obter dados do entityMap
    if (!metrics.entityMap || metrics.entityMap.size === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = '18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados de SLA disponíveis', width/2, height/2);
        return;
    }
    
    // Converter Map para array ordenado por SLA
    const allSorted = Array.from(metrics.entityMap.entries())
        .filter(([, d]) => d.slaPercent !== undefined)
        .sort((a, b) => (b[1].slaPercent || 0) - (a[1].slaPercent || 0));
    
    const itemsPerPage = 10;
    const start = page * itemsPerPage;
    const pageData = allSorted.slice(start, start + itemsPerPage);
    
    if (!pageData.length) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = '18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados de SLA disponíveis', width/2, height/2);
        return;
    }
    
    const padding = { left: 220, right: 100, top: 30, bottom: 30 };
    const barHeight = Math.min(45, (height - padding.top - padding.bottom) / pageData.length - 8);
    
    pageData.forEach(([entity, data], i) => {
        const globalIndex = start + i;
        const y = padding.top + i * (barHeight + 8);
        const sla = data.slaPercent || 0;
        const barWidth = Math.max(5, (sla / 100) * (width - padding.left - padding.right));
        
        // Cor baseada no SLA
        const barColor = sla >= 90 ? '#10b981' : sla >= 70 ? '#f59e0b' : '#ef4444';
        
        // Sombra
        ctx.shadowColor = barColor;
        ctx.shadowBlur = 10;
        
        // Barra
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, barWidth, barHeight, 8);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Nome
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'right';
        const displayName = entity.length > 24 ? entity.substring(0, 22) + '..' : entity;
        ctx.fillText(`${globalIndex + 1}. ${displayName}`, padding.left - 15, y + barHeight/2 + 6);
        
        // Percentual
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`${sla.toFixed(0)}%`, padding.left + barWidth + 15, y + barHeight/2 + 6);
    });
}

// Status expandido em alta resolução (Barras Horizontais)
function renderExpandedStatus(ctx, width, height, metrics, colors, bi) {
    const statusData = { 'Resolvido': 0, 'Aberto': 0, 'Pendente': 0, 'Aguardando': 0, 'Em Progresso': 0 };
    
    bi.filteredData.forEach(ticket => {
        if (window.FRESHDESK_STATUS) {
            const cat = window.FRESHDESK_STATUS.getSimplifiedCategory(ticket.status);
            if (statusData[cat] !== undefined) statusData[cat]++;
            else statusData['Em Progresso']++;
        } else {
            if (ticket.status === 4 || ticket.status === 5) statusData['Resolvido']++;
            else if (ticket.status === 2) statusData['Aberto']++;
            else if (ticket.status === 3 || ticket.status === 17) statusData['Pendente']++;
            else if (ticket.status === 7 || ticket.status === 16) statusData['Aguardando']++;
            else statusData['Em Progresso']++;
        }
    });
    
    const total = Object.values(statusData).reduce((a, b) => a + b, 0);
    if (total === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados', width / 2, height / 2);
        return;
    }
    
    const statusColors = {
        'Resolvido': '#10b981',
        'Aberto': '#ef4444',
        'Pendente': '#f59e0b',
        'Aguardando': '#a855f7',
        'Em Progresso': '#3b82f6'
    };
    
    // Ordenar por quantidade (maior primeiro)
    const sortedStatus = Object.entries(statusData)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
    
    // BARRAS HORIZONTAIS
    const padding = { top: 70, bottom: 30, left: 150, right: 150 };
    const barHeight = Math.min(50, (height - padding.top - padding.bottom) / sortedStatus.length - 15);
    const barGap = 15;
    const maxValue = Math.max(...sortedStatus.map(([, v]) => v));
    const maxBarWidth = width - padding.left - padding.right;
    
    // Título com total
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`Total: ${total.toLocaleString()} tickets`, width / 2, 40);
    
    sortedStatus.forEach(([status, count], index) => {
        const y = padding.top + index * (barHeight + barGap);
        const barWidth = (count / maxValue) * maxBarWidth;
        const percent = Math.round((count / total) * 100);
        const color = statusColors[status];
        
        // Sombra
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        
        // Barra
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, barWidth, barHeight, 8);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Label (nome do status)
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(status, padding.left - 15, y + barHeight / 2 + 6);
        
        // Valor e percentual
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`${count.toLocaleString()} (${percent}%)`, padding.left + barWidth + 15, y + barHeight / 2 + 6);
    });
}

// Priority expandido em alta resolução
function renderExpandedPriority(ctx, width, height, metrics, colors, bi) {
    const priorityData = { 'Urgente': 0, 'Alta': 0, 'Média': 0, 'Baixa': 0 };
    
    bi.filteredData.forEach(ticket => {
        const p = ticket.priority;
        if (p === 4) priorityData['Urgente']++;
        else if (p === 3) priorityData['Alta']++;
        else if (p === 2) priorityData['Média']++;
        else priorityData['Baixa']++;
    });
    
    const entries = Object.entries(priorityData).filter(([, v]) => v > 0);
    if (!entries.length) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados', width / 2, height / 2);
        return;
    }
    
    const maxVal = Math.max(...entries.map(([, v]) => v));
    const priorityColors = { 'Urgente': '#ef4444', 'Alta': '#f59e0b', 'Média': '#3b82f6', 'Baixa': '#10b981' };
    
    const padding = { left: 150, right: 120, top: 50, bottom: 50 };
    const barHeight = Math.min(60, (height - padding.top - padding.bottom) / entries.length - 20);
    
    entries.forEach(([priority, count], i) => {
        const y = padding.top + i * (barHeight + 20);
        const barWidth = (count / maxVal) * (width - padding.left - padding.right);
        
        ctx.shadowColor = priorityColors[priority];
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = priorityColors[priority];
        ctx.beginPath();
        ctx.roundRect(padding.left, y, barWidth, barHeight, 10);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Label
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(priority, padding.left - 20, y + barHeight/2 + 7);
        
        // Valor
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(count.toLocaleString(), padding.left + barWidth + 20, y + barHeight/2 + 7);
    });
}

// Timeline expandido em alta resolução (igual ao original: últimos 30 dias, 2 linhas)
function renderExpandedTimeline(ctx, width, height, metrics, colors, bi) {
    // Agrupar por data de criação e resolução (mesma lógica do original)
    const createdByDate = {};
    const resolvedByDate = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    bi.filteredData.forEach(ticket => {
        if (ticket.created_at) {
            const d = new Date(ticket.created_at);
            if (d >= thirtyDaysAgo) {
                const k = d.toISOString().split('T')[0];
                createdByDate[k] = (createdByDate[k] || 0) + 1;
            }
        }
        const res = ticket.stats_resolved_at;
        if (res) {
            const r = new Date(res);
            if (r >= thirtyDaysAgo) {
                const k2 = r.toISOString().split('T')[0];
                resolvedByDate[k2] = (resolvedByDate[k2] || 0) + 1;
            }
        }
    });
    
    const dateSet = new Set([...Object.keys(createdByDate), ...Object.keys(resolvedByDate)]);
    const sortedDates = Array.from(dateSet).sort();
    
    if (sortedDates.length < 2) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados dos últimos 30 dias', width / 2, height / 2);
        return;
    }
    
    const padding = { left: 70, right: 50, top: 50, bottom: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxVal = Math.max(...sortedDates.map(d => Math.max(createdByDate[d] || 0, resolvedByDate[d] || 0)), 1);
    const stepX = chartWidth / (sortedDates.length - 1 || 1);
    
    // Grid horizontal
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Label Y
        ctx.fillStyle = colors.textMuted;
        ctx.font = '14px system-ui';
        ctx.textAlign = 'right';
        const val = Math.round(maxVal * (1 - i / 4));
        ctx.fillText(val.toString(), padding.left - 15, y + 5);
    }
    
    // Função para desenhar linha
    const drawLine = (data, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        sortedDates.forEach((date, i) => {
            const count = data[date] || 0;
            const x = padding.left + i * stepX;
            const y = padding.top + chartHeight - (count / maxVal) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Pontos
        sortedDates.forEach((date, i) => {
            const count = data[date] || 0;
            const x = padding.left + i * stepX;
            const y = padding.top + chartHeight - (count / maxVal) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        });
    };
    
    // Linha de tickets criados (verde)
    drawLine(createdByDate, '#10b981');
    
    // Linha de tickets resolvidos (azul)
    drawLine(resolvedByDate, '#3b82f6');
    
    // Labels X
    sortedDates.forEach((date, i) => {
        if (i % Math.ceil(sortedDates.length / 12) === 0 || i === sortedDates.length - 1) {
            const x = padding.left + i * stepX;
            ctx.save();
            ctx.translate(x, height - padding.bottom + 20);
            ctx.rotate(-Math.PI / 4);
            ctx.fillStyle = colors.textMuted;
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            const d = new Date(date);
            ctx.fillText(`${d.getDate()}/${d.getMonth()+1}`, 0, 0);
            ctx.restore();
        }
    });
    
    // Legenda
    ctx.font = '14px system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.fillRect(width - 180, 20, 12, 12);
    ctx.fillText('Criados', width - 160, 31);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(width - 180, 40, 12, 12);
    ctx.fillText('Resolvidos', width - 160, 51);
    
    // Configurar tooltip
    const canvas = document.getElementById('expandedChart');
    const regions = sortedDates.map((date, i) => {
        const x = padding.left + i * stepX;
        const created = createdByDate[date] || 0;
        const resolved = resolvedByDate[date] || 0;
        const y = padding.top + chartHeight - (Math.max(created, resolved) / maxVal) * chartHeight;
        return {
            contains: (mx, my) => Math.abs(mx - x) < 20 && my >= padding.top && my <= padding.top + chartHeight,
            data: { date, created, resolved }
        };
    });
    
    window.setupExpandedTooltip(canvas, regions, (d) => {
        const dt = new Date(d.date);
        return `
            <strong>${dt.toLocaleDateString('pt-BR')}</strong><br>
            <span style="color:#10b981">● Criados: ${d.created}</span><br>
            <span style="color:#3b82f6">● Resolvidos: ${d.resolved}</span>
        `;
    });
}

// Sistemas expandido em alta resolução
function renderExpandedSystems(ctx, width, height, metrics, colors, bi) {
    const sistemasValidos = new Set([
        'YUV', 'Telemetria', 'BI', 'SING', 'OPTZ', 'Light', 'Técnica', 
        'Suporte', 'Outros', 'E-trip', 'E-clock', 'App Motorista', 
        'SING/OPTZ', 'API', 'Portal', 'Videotelemetria'
    ]);
    
    const counts = new Map();
    bi.filteredData.forEach(t => {
        let sistema = null;
        if (t.custom_fields) {
            let cf = t.custom_fields;
            if (typeof cf === 'string') try { cf = JSON.parse(cf); } catch(e) {}
            if (cf && typeof cf === 'object') sistema = cf.cf_teste || cf.cf_sistema || null;
        }
        if (!sistema) sistema = t.cf_teste || t.cf_sistema || null;
        if (sistema) {
            sistema = String(sistema).trim();
            if (sistemasValidos.has(sistema)) counts.set(sistema, (counts.get(sistema) || 0) + 1);
            else counts.set('Outros', (counts.get('Outros') || 0) + 1);
        }
    });
    
    let items = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,12);
    if (items.length === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign='center';
        ctx.fillText('Sem dados de sistemas', width/2, height/2); return;
    }

    const padding = { top: 40, right: 120, bottom: 40, left: 180 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = Math.min(40, (height - padding.top - padding.bottom) / items.length - 10);
    const maxVal = Math.max(...items.map(i=>i[1]));
    const gradients = bi.gradients;

    const regions = [];
    const total = items.reduce((acc, [,v]) => acc + v, 0);
    
    items.forEach(([label, value], i) => {
        const y = padding.top + i * (barHeight + 10);
        const w = (value/maxVal)*chartWidth;
        const gColors = gradients[i % gradients.length];
        const grad = ctx.createLinearGradient(padding.left,0,padding.left+w,0);
        grad.addColorStop(0, gColors[0]); grad.addColorStop(1, gColors[1]);
        
        ctx.shadowColor = gColors[0]; ctx.shadowBlur = 12;
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(padding.left, y, w, barHeight, 8); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign='right';
        ctx.fillText(label, padding.left - 15, y + barHeight/2 + 6);
        ctx.fillStyle = '#fff'; ctx.textAlign='left';
        ctx.fillText(value.toLocaleString(), padding.left + w + 15, y + barHeight/2 + 6);
        
        regions.push({
            contains: (mx, my) => mx >= padding.left && mx <= padding.left + w && my >= y && my <= y + barHeight,
            data: { label, value, percent: ((value/total)*100).toFixed(1), color: gColors[0] }
        });
    });
    
    // Configurar tooltip
    const canvas = document.getElementById('expandedChart');
    window.setupExpandedTooltip(canvas, regions, (d) => `
        <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:${d.color};"></span>
            <strong>${d.label}</strong>
        </div>
        <div style="margin-top:4px;">
            Tickets: <strong>${d.value.toLocaleString()}</strong> (${d.percent}%)
        </div>
    `);
}

// SLA Trend expandido em alta resolução
function renderExpandedSLATrend(ctx, width, height, metrics, colors, bi) {
    const SLA_LIMIT = 4 * 60 * 60 * 1000;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30*24*60*60*1000);
    
    const byDate = {};
    bi.filteredData.forEach(ticket => {
        const typeNorm = (ticket.type || '').toString().toLowerCase().replace(/\s+/g,' ').trim();
        if (bi.ignoreTypesForSLA && bi.ignoreTypesForSLA.has(typeNorm)) return;
        const first = ticket.stats_first_responded_at || ticket.stats_first_response_at;
        if (!first || !ticket.created_at) return;
        const d = new Date(ticket.created_at);
        if (d < thirtyDaysAgo) return;
        const k = d.toISOString().split('T')[0];
        if (!byDate[k]) byDate[k] = { within: 0, outside: 0 };
        const rt = new Date(first) - new Date(ticket.created_at);
        if (rt <= SLA_LIMIT) byDate[k].within++; else byDate[k].outside++;
    });
    
    const sortedDates = Object.keys(byDate).sort();
    if (sortedDates.length === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados de SLA nos últimos 30 dias', width/2, height/2); return;
    }
    
    const dataPoints = sortedDates.map(d => {
        const t = byDate[d].within + byDate[d].outside;
        return { date: d, percent: t > 0 ? Math.round((byDate[d].within / t) * 100) : 0 };
    });
    
    const padding = { top: 50, bottom: 80, left: 80, right: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const pointGap = chartWidth / (dataPoints.length - 1 || 1);
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i * chartHeight / 4);
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(width - padding.right, y); ctx.stroke();
        ctx.fillStyle = colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'right';
        ctx.fillText((100 - i*25) + '%', padding.left - 15, y + 5);
    }
    
    // Linha meta 80%
    const metaY = padding.top + chartHeight - (80/100)*chartHeight;
    ctx.save(); ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([8,4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padding.left, metaY); ctx.lineTo(width - padding.right, metaY); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#f59e0b'; ctx.font = '14px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('Meta 80%', width - padding.right + 10, metaY + 5);
    
    // Linha
    ctx.beginPath(); ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
    dataPoints.forEach((pt, i) => {
        const x = padding.left + i * pointGap;
        const y = padding.top + chartHeight - (pt.percent / 100) * chartHeight;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Pontos coloridos
    dataPoints.forEach((pt, i) => {
        const x = padding.left + i * pointGap;
        const y = padding.top + chartHeight - (pt.percent / 100) * chartHeight;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2);
        ctx.fillStyle = pt.percent >= 80 ? '#10b981' : pt.percent >= 60 ? '#f59e0b' : '#ef4444';
        ctx.fill();
    });
    
    // Labels X
    dataPoints.forEach((pt, i) => {
        if (i % Math.ceil(dataPoints.length/10) === 0 || i === dataPoints.length - 1) {
            const x = padding.left + i * pointGap;
            ctx.save(); ctx.translate(x, height - padding.bottom + 20); ctx.rotate(-Math.PI/4);
            ctx.fillStyle = colors.textMuted; ctx.font = '12px system-ui'; ctx.textAlign = 'right';
            const dt = new Date(pt.date); ctx.fillText(`${dt.getDate()}/${dt.getMonth()+1}`, 0, 0);
            ctx.restore();
        }
    });
    
    // Configurar tooltip
    const canvas = document.getElementById('expandedChart');
    const regions = dataPoints.map((pt, i) => {
        const x = padding.left + i * pointGap;
        return {
            contains: (mx, my) => Math.abs(mx - x) < 20 && my >= padding.top && my <= padding.top + chartHeight,
            data: { date: pt.date, percent: pt.percent, within: byDate[pt.date].within, outside: byDate[pt.date].outside }
        };
    });
    
    window.setupExpandedTooltip(canvas, regions, (d) => {
        const dt = new Date(d.date);
        const color = d.percent >= 80 ? '#10b981' : d.percent >= 60 ? '#f59e0b' : '#ef4444';
        return `
            <strong>${dt.toLocaleDateString('pt-BR')}</strong><br>
            <span style="color:${color}; font-size:1.2rem; font-weight:bold;">${d.percent}%</span> no SLA<br>
            <span style="color:#10b981">✓ Dentro: ${d.within}</span><br>
            <span style="color:#ef4444">✗ Fora: ${d.outside}</span>
        `;
    });
}

// SLA por Entidade expandido (corrigido para usar dados reais)
function renderExpandedSLAByEntityFixed(ctx, width, height, metrics, colors, bi) {
    const SLA_LIMIT = 4 * 60 * 60 * 1000;
    const entityField = bi.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
    
    const byEntity = new Map();
    bi.filteredData.forEach(ticket => {
        const first = ticket.stats_first_responded_at || ticket.stats_first_response_at;
        if (!first || !ticket.created_at) return;
        const entities = ticket[entityField] ? ticket[entityField].split(/[,;\/]/).map(e=>e.trim()).filter(e=>e&&bi.selectedEntities.has(e)) : [];
        const rt = new Date(first) - new Date(ticket.created_at);
        entities.forEach(ent => {
            if (!byEntity.has(ent)) byEntity.set(ent, { within: 0, outside: 0 });
            const d = byEntity.get(ent);
            if (rt <= SLA_LIMIT) d.within++; else d.outside++;
        });
    });
    
    const items = Array.from(byEntity.entries()).map(([label, d]) => {
        const total = d.within + d.outside;
        return { label, percent: total > 0 ? Math.round((d.within/total)*100) : 0, total };
    }).sort((a,b) => b.percent - a.percent).slice(0, 15);
    
    if (items.length === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados de SLA para as entidades selecionadas', width/2, height/2); return;
    }
    
    const padding = { top: 40, right: 100, bottom: 40, left: 200 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = Math.min(38, (height - padding.top - padding.bottom) / items.length - 8);
    
    // Linha meta 80%
    const metaX = padding.left + (80/100)*chartWidth;
    ctx.save(); ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([6,4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(metaX, padding.top - 10); ctx.lineTo(metaX, height - padding.bottom + 10); ctx.stroke();
    ctx.restore();
    
    const regions = [];
    
    items.forEach((item, i) => {
        const y = padding.top + i * (barHeight + 8);
        const w = (item.percent / 100) * chartWidth;
        const color = item.percent >= 80 ? '#10b981' : item.percent >= 60 ? '#f59e0b' : '#ef4444';
        
        ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(padding.left, y, Math.max(5, w), barHeight, 6); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = colors.text; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'right';
        const disp = item.label.length > 20 ? item.label.slice(0,18)+'..' : item.label;
        ctx.fillText(`${i+1}. ${disp}`, padding.left - 12, y + barHeight/2 + 5);
        
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        ctx.fillText(`${item.percent}%`, padding.left + w + 12, y + barHeight/2 + 5);
        
        const entityData = byEntity.get(item.label);
        regions.push({
            contains: (mx, my) => mx >= padding.left && mx <= padding.left + Math.max(5, w) && my >= y && my <= y + barHeight,
            data: { label: item.label, percent: item.percent, total: item.total, within: entityData?.within || 0, outside: entityData?.outside || 0, color }
        });
    });
    
    // Configurar tooltip
    const canvas = document.getElementById('expandedChart');
    window.setupExpandedTooltip(canvas, regions, (d) => `
        <strong>${d.label}</strong><br>
        <span style="color:${d.color}; font-size:1.2rem; font-weight:bold;">${d.percent}%</span> no SLA<br>
        <span style="color:#10b981">✓ Dentro: ${d.within}</span><br>
        <span style="color:#ef4444">✗ Fora: ${d.outside}</span><br>
        <span style="color:#94a3b8">Total: ${d.total} tickets</span>
    `);
}

// Status Stacked expandido
function renderExpandedStatusStacked(ctx, width, height, metrics, colors, bi) {
    // Usar statusCounts das métricas calculadas (mesma fonte do gráfico normal)
    const counts = metrics.statusCounts || {};
    const items = Object.entries(counts)
        .map(([s, c]) => ({
            status: parseInt(s),
            label: bi.getStatusLabel ? bi.getStatusLabel(s) : `Status ${s}`,
            count: c,
            color: bi.getStatusColor ? bi.getStatusColor(s) : bi.gradients[0][0]
        }))
        .filter(i => i.count > 0)
        .sort((a, b) => b.count - a.count);
    
    const total = items.reduce((sum, i) => sum + i.count, 0);
    
    if (items.length === 0 || total === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados de status', width/2, height/2); return;
    }
    
    const padding = { top: 40, right: 120, bottom: 40, left: 220 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = Math.min(35, (height - padding.top - padding.bottom) / items.length - 8);
    const maxVal = Math.max(...items.map(i => i.count));
    
    items.forEach((item, i) => {
        const y = padding.top + i * (barHeight + 8);
        const w = (item.count / maxVal) * chartWidth;
        const pct = ((item.count / total) * 100).toFixed(1);
        
        ctx.shadowColor = item.color; ctx.shadowBlur = 8;
        ctx.fillStyle = item.color;
        ctx.beginPath(); ctx.roundRect(padding.left, y, Math.max(5, w), barHeight, 6); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = colors.text; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'right';
        const disp = item.label.length > 22 ? item.label.slice(0,20)+'..' : item.label;
        ctx.fillText(disp, padding.left - 12, y + barHeight/2 + 5);
        
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        ctx.fillText(`${item.count} (${pct}%)`, padding.left + w + 12, y + barHeight/2 + 5);
    });
}

// Aging Histogram expandido
function renderExpandedAgingHistogram(ctx, width, height, metrics, colors, bi) {
    const buckets = metrics.agingBuckets || { '0-2d': 0, '3-7d': 0, '8-14d': 0, '15-30d': 0, '>30d': 0 };
    const bucketColors = { '0-2d': '#10b981', '3-7d': '#3b82f6', '8-14d': '#f59e0b', '15-30d': '#f97316', '>30d': '#ef4444' };
    const items = Object.entries(buckets).map(([label, count]) => ({ label, count, color: bucketColors[label] || '#3b82f6' }));
    const total = items.reduce((a,b) => a + b.count, 0);
    
    if (total === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem backlog para analisar', width/2, height/2); return;
    }
    
    const padding = { top: 60, bottom: 80, left: 80, right: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / items.length - 30;
    const maxCount = Math.max(...items.map(i => i.count), 1);
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i * chartHeight / 4);
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(width - padding.right, y); ctx.stroke();
        ctx.fillStyle = colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxCount - i*maxCount/4).toString(), padding.left - 15, y + 5);
    }
    
    // Barras
    items.forEach((item, i) => {
        const x = padding.left + i * (barWidth + 30) + 15;
        const h = (item.count / maxCount) * chartHeight;
        const y = padding.top + chartHeight - h;
        
        ctx.shadowColor = item.color; ctx.shadowBlur = 12;
        ctx.fillStyle = item.color;
        ctx.beginPath(); ctx.roundRect(x, y, barWidth, h, 8); ctx.fill();
        ctx.shadowBlur = 0;
        
        // Valor
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(item.count.toString(), x + barWidth/2, y - 12);
        
        // Label
        ctx.fillStyle = colors.text; ctx.font = '14px system-ui';
        ctx.fillText(item.label, x + barWidth/2, height - padding.bottom + 25);
    });
    
    // Título
    ctx.fillStyle = colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Idade dos Tickets em Aberto', width/2, 30);
}

// Pipeline/Funnel expandido (mesma visualização do normal)
function renderExpandedPipelineFunnel(ctx, width, height, metrics, colors, bi) {
    // Usar mesmas categorias do gráfico normal
    const stages = [
        { label: 'Aberto', status: 2, color: '#ef4444' },
        { label: 'Em Progresso', status: 7, color: '#3b82f6' },
        { label: 'Aguardando', status: 6, color: '#8b5cf6' },
        { label: 'Pendente', status: 3, color: '#f59e0b' }
    ];
    
    const counts = metrics.statusCounts || {};
    const items = stages.map(s => ({ ...s, count: counts[s.status] || 0 })).filter(s => s.count > 0);
    const total = items.reduce((a,b) => a + b.count, 0);
    
    if (total === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Nenhum ticket ativo', width/2, height/2); return;
    }
    
    // Título
    ctx.fillStyle = colors.text; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`Total Ativos: ${total.toLocaleString()}`, width/2, 35);
    
    const padding = { top: 70, bottom: 50, left: 180, right: 150 };
    const barHeight = Math.min(55, (height - padding.top - padding.bottom) / items.length - 12);
    const maxVal = Math.max(...items.map(i => i.count), 1);
    const chartWidth = width - padding.left - padding.right;
    
    items.forEach((item, i) => {
        const y = padding.top + i * (barHeight + 12);
        const barWidth = (item.count / maxVal) * chartWidth;
        
        ctx.shadowColor = item.color; ctx.shadowBlur = 12;
        ctx.fillStyle = item.color;
        ctx.beginPath(); ctx.roundRect(padding.left, y, barWidth, barHeight, 8); ctx.fill();
        ctx.shadowBlur = 0;
        
        // Label esquerda
        ctx.fillStyle = colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(item.label, padding.left - 15, y + barHeight/2 + 6);
        
        // Valor à direita
        ctx.fillStyle = colors.text; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(`${item.count.toLocaleString()} (${Math.round((item.count/total)*100)}%)`, padding.left + barWidth + 15, y + barHeight/2 + 6);
    });
}

// Finalized expandido (barra empilhada horizontal - mesma visualização do normal)
function renderExpandedFinalized(ctx, width, height, metrics, colors, bi) {
    const counts = metrics.statusCounts || {};
    const resolvido = counts[4] || 0;
    const fechado = counts[5] || 0;
    const total = resolvido + fechado;
    
    if (total === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Nenhum ticket finalizado', width/2, height/2); return;
    }
    
    // Título
    ctx.fillStyle = colors.text; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`Total Finalizados: ${total.toLocaleString()}`, width/2, 50);
    
    const padding = { left: 100, right: 100 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = 70;
    const centerY = height / 2;
    
    // Barra empilhada horizontal
    const resolvidoWidth = (resolvido / total) * chartWidth;
    const fechadoWidth = (fechado / total) * chartWidth;
    
    // Resolvido (esquerda)
    ctx.shadowColor = '#10b981'; ctx.shadowBlur = 15;
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.roundRect(padding.left, centerY - barHeight/2, resolvidoWidth, barHeight, [10, 0, 0, 10]); ctx.fill();
    ctx.shadowBlur = 0;
    
    // Fechado (direita)
    ctx.shadowColor = '#059669'; ctx.shadowBlur = 15;
    ctx.fillStyle = '#059669';
    ctx.beginPath(); ctx.roundRect(padding.left + resolvidoWidth, centerY - barHeight/2, fechadoWidth, barHeight, [0, 10, 10, 0]); ctx.fill();
    ctx.shadowBlur = 0;
    
    // Labels dentro das barras
    ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    if (resolvidoWidth > 100) {
        ctx.fillText(`Resolvido: ${resolvido.toLocaleString()}`, padding.left + resolvidoWidth/2, centerY + 6);
    }
    if (fechadoWidth > 100) {
        ctx.fillText(`Fechado: ${fechado.toLocaleString()}`, padding.left + resolvidoWidth + fechadoWidth/2, centerY + 6);
    }
    
    // Legenda abaixo
    const legendY = height - 60;
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.roundRect(width/2 - 150, legendY - 10, 18, 18, 3); ctx.fill();
    ctx.fillStyle = colors.text; ctx.textAlign = 'left';
    ctx.fillText(`Resolvido ${Math.round((resolvido/total)*100)}%`, width/2 - 125, legendY + 4);
    
    ctx.fillStyle = '#059669'; ctx.beginPath(); ctx.roundRect(width/2 + 40, legendY - 10, 18, 18, 3); ctx.fill();
    ctx.fillStyle = colors.text;
    ctx.fillText(`Fechado ${Math.round((fechado/total)*100)}%`, width/2 + 65, legendY + 4);
}

// Productivity Ranking expandido
function renderExpandedProductivityRanking(ctx, width, height, metrics, colors, bi) {
    const prodMetrics = bi._lastProductivityMetrics || [];
    if (!prodMetrics.length) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados de produtividade', width/2, height/2); return;
    }
    
    const top15 = prodMetrics.slice(0, 15);
    const padding = { top: 40, right: 100, bottom: 40, left: 200 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = Math.min(35, (height - padding.top - padding.bottom) / top15.length - 8);
    
    top15.forEach((m, i) => {
        const y = padding.top + i * (barHeight + 8);
        const barWidth = (m.productivityIndex / 100) * chartWidth;
        const color = m.productivityIndex >= 70 ? '#10b981' : m.productivityIndex >= 40 ? '#f59e0b' : '#ef4444';
        
        ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(padding.left, y, barWidth, barHeight, 6); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = colors.text; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'right';
        const name = m.name.length > 22 ? m.name.substring(0, 20) + '..' : m.name;
        ctx.fillText(`${i+1}. ${name}`, padding.left - 12, y + barHeight/2 + 5);
        
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        ctx.fillText(`${m.productivityIndex}`, padding.left + barWidth + 12, y + barHeight/2 + 5);
    });
}

// Tickets por Dia expandido
function renderExpandedTicketsPerDay(ctx, width, height, metrics, colors, bi) {
    const prodMetrics = bi._lastProductivityMetrics || [];
    if (!prodMetrics.length) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados', width/2, height/2); return;
    }
    
    const top12 = prodMetrics.slice(0, 12);
    const padding = { top: 50, bottom: 100, left: 60, right: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / top12.length - 15;
    const maxVal = Math.max(...top12.map(m => parseFloat(m.ticketsPerDay)), 1);
    const gradients = bi.gradients;
    
    top12.forEach((m, i) => {
        const x = padding.left + i * (barWidth + 15) + 7;
        const barH = (parseFloat(m.ticketsPerDay) / maxVal) * chartHeight;
        const y = padding.top + chartHeight - barH;
        const gColors = gradients[i % gradients.length];
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, gColors[0]); grad.addColorStop(1, gColors[1]);
        
        ctx.shadowColor = gColors[0]; ctx.shadowBlur = 10;
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(x, y, barWidth, barH, 6); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(m.ticketsPerDay, x + barWidth/2, y - 10);
        
        ctx.save();
        ctx.translate(x + barWidth/2, height - padding.bottom + 15);
        ctx.rotate(-Math.PI/4);
        ctx.fillStyle = colors.textMuted; ctx.font = '12px system-ui'; ctx.textAlign = 'right';
        const name = m.name.length > 12 ? m.name.substring(0, 10) + '..' : m.name;
        ctx.fillText(name, 0, 0);
        ctx.restore();
    });
}

// By Day of Week expandido
function renderExpandedByDayOfWeek(ctx, width, height, metrics, colors, bi) {
    // Calcular diretamente de filteredData (mesma lógica do gráfico normal)
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const daysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    
    bi.filteredData.forEach(t => {
        const d = new Date(t.created_at);
        if (!isNaN(d.getTime())) totals[d.getDay()]++;
    });
    
    const total = totals.reduce((s, c) => s + c, 0);
    if (total === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados no período', width/2, height/2); return;
    }
    
    const padding = { top: 60, bottom: 70, left: 80, right: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / 7 - 20;
    const maxVal = Math.max(...totals, 1);
    
    // Título
    ctx.fillStyle = colors.text; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Tickets por Dia da Semana', width/2, 30);
    
    totals.forEach((val, i) => {
        const x = padding.left + i * (barWidth + 20) + 10;
        const barH = (val / maxVal) * chartHeight;
        const y = padding.top + chartHeight - barH;
        const color = i === 0 || i === 6 ? '#8b5cf6' : '#3b82f6';
        const percent = Math.round((val / total) * 100);
        
        ctx.shadowColor = color; ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(x, y, barWidth, barH, 8); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(val.toString(), x + barWidth/2, y - 12);
        
        ctx.fillStyle = colors.text; ctx.font = 'bold 14px system-ui';
        ctx.fillText(daysShort[i], x + barWidth/2, height - 35);
        ctx.font = '12px system-ui'; ctx.fillStyle = colors.textMuted;
        ctx.fillText(`${percent}%`, x + barWidth/2, height - 18);
    });
}

// By Hour expandido
function renderExpandedByHour(ctx, width, height, metrics, colors, bi) {
    // Calcular diretamente de filteredData (mesma lógica do gráfico normal)
    const totals = new Array(24).fill(0);
    
    bi.filteredData.forEach(t => {
        const d = new Date(t.created_at);
        if (!isNaN(d.getTime())) totals[d.getHours()]++;
    });
    
    const total = totals.reduce((s, c) => s + c, 0);
    if (total === 0) {
        ctx.fillStyle = colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados no período', width/2, height/2); return;
    }
    
    const padding = { top: 60, bottom: 70, left: 80, right: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / 24 - 4;
    const maxVal = Math.max(...totals, 1);
    
    // Título
    ctx.fillStyle = colors.text; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Tickets por Hora do Dia', width/2, 30);
    
    totals.forEach((val, i) => {
        const x = padding.left + i * (barWidth + 4) + 2;
        const barH = Math.max(2, (val / maxVal) * chartHeight);
        const y = padding.top + chartHeight - barH;
        const color = i >= 8 && i <= 18 ? '#10b981' : '#3b82f6';
        
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(x, y, barWidth, barH, 3); ctx.fill();
        
        // Mostrar valor no topo das barras maiores
        if (val > 0 && val >= maxVal * 0.3) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(val.toString(), x + barWidth/2, y - 5);
        }
        
        if (i % 3 === 0) {
            ctx.fillStyle = colors.textMuted; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(`${i}h`, x + barWidth/2, height - 40);
        }
    });
    
    // Linha de horário comercial
    const startX = padding.left + 8 * (barWidth + 4);
    const endX = padding.left + 18 * (barWidth + 4);
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([5,5]);
    ctx.beginPath(); ctx.moveTo(startX, padding.top); ctx.lineTo(startX, height - padding.bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(endX, padding.top); ctx.lineTo(endX, height - padding.bottom); ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#f59e0b'; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Horário Comercial (8h-18h)', (startX + endX)/2, padding.top - 15);
}

// SLA expandido em alta resolução
function renderExpandedSLA(ctx, width, height, metrics, colors, bi) {
    const SLA_LIMIT = 4 * 60 * 60 * 1000;
    let slaWithin = 0, slaOutside = 0;
    
    bi.filteredData.forEach(ticket => {
        const first = ticket.stats_first_responded_at || ticket.stats_first_response_at;
        if (first && ticket.created_at) {
            const rt = new Date(first) - new Date(ticket.created_at);
            if (rt <= SLA_LIMIT) slaWithin++; else slaOutside++;
        }
    });
    
    const total = slaWithin + slaOutside;
    if (total === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados de SLA', width / 2, height / 2);
        return;
    }
    
    const slaPercent = (slaWithin / total) * 100;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;
    const innerRadius = radius * 0.7;
    
    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(239,68,68,0.3)';
    ctx.fill();
    
    // SLA arc
    const slaAngle = (slaPercent / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + slaAngle);
    ctx.arc(centerX, centerY, innerRadius, -Math.PI/2 + slaAngle, -Math.PI/2, true);
    ctx.closePath();
    ctx.fillStyle = slaPercent >= 80 ? '#10b981' : slaPercent >= 60 ? '#f59e0b' : '#ef4444';
    ctx.fill();
    
    // Centro
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 56px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${slaPercent.toFixed(0)}%`, centerX, centerY + 10);
    ctx.font = '18px system-ui';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('Conformidade SLA', centerX, centerY + 45);
    
    // Legenda
    ctx.font = '14px system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`✓ Dentro: ${slaWithin}`, width/2 - 80, height - 40);
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`✗ Fora: ${slaOutside}`, width/2 + 20, height - 40);
    
    // Configurar tooltip para donut
    const canvas = document.getElementById('expandedChart');
    const regions = [
        {
            contains: (mx, my) => {
                const dx = mx - centerX, dy = my - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < innerRadius || dist > radius) return false;
                let angle = Math.atan2(dy, dx) + Math.PI/2;
                if (angle < 0) angle += Math.PI * 2;
                return angle <= slaAngle;
            },
            data: { type: 'within', value: slaWithin, percent: ((slaWithin/total)*100).toFixed(1) }
        },
        {
            contains: (mx, my) => {
                const dx = mx - centerX, dy = my - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < innerRadius || dist > radius) return false;
                let angle = Math.atan2(dy, dx) + Math.PI/2;
                if (angle < 0) angle += Math.PI * 2;
                return angle > slaAngle;
            },
            data: { type: 'outside', value: slaOutside, percent: ((slaOutside/total)*100).toFixed(1) }
        }
    ];
    
    window.setupExpandedTooltip(canvas, regions, (d) => d.type === 'within' ? `
        <span style="color:#10b981; font-weight:bold;">✓ Dentro do SLA</span><br>
        <strong>${d.value}</strong> tickets (${d.percent}%)<br>
        <span style="color:#94a3b8">Respondidos em até 4h</span>
    ` : `
        <span style="color:#ef4444; font-weight:bold;">✗ Fora do SLA</span><br>
        <strong>${d.value}</strong> tickets (${d.percent}%)<br>
        <span style="color:#94a3b8">Respondidos após 4h</span>
    `);
}

// ========== FUNÇÕES DE RENDERIZAÇÃO EXPANDIDA PARA NOVOS GRÁFICOS ==========

function renderExpandedFirstResponse(ctx, width, height, bi) {
    const ticketsWithFR = bi.filteredData.filter(t => t.stats_first_responded_at && t.created_at);
    if (!ticketsWithFR.length) {
        ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados de First Response', width/2, height/2); return;
    }
    const faixas = [
        { label: '< 1 hora', min: 0, max: 1, color: '#10b981', count: 0 },
        { label: '1 - 4 horas', min: 1, max: 4, color: '#3b82f6', count: 0 },
        { label: '4 - 8 horas', min: 4, max: 8, color: '#f59e0b', count: 0 },
        { label: '8 - 24 horas', min: 8, max: 24, color: '#f97316', count: 0 },
        { label: '> 24 horas', min: 24, max: Infinity, color: '#ef4444', count: 0 }
    ];
    let totalHours = 0;
    ticketsWithFR.forEach(t => {
        const hours = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
        if (hours > 0) { totalHours += hours; const f = faixas.find(fx => hours >= fx.min && hours < fx.max); if (f) f.count++; }
    });
    const avgHours = totalHours / ticketsWithFR.length;
    const items = faixas.filter(f => f.count > 0);
    const maxCount = Math.max(...items.map(i => i.count), 1);
    const pad = { left: 160, right: 80, top: 80, bottom: 50 };
    const barH = Math.min(50, (height - pad.top - pad.bottom) / items.length - 15);
    
    ctx.fillStyle = bi.colors.text; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`Média: ${avgHours.toFixed(1)} horas`, width / 2, 45);
    
    items.forEach((item, i) => {
        const y = pad.top + i * (barH + 15);
        const bw = Math.max(20, (item.count / maxCount) * (width - pad.left - pad.right));
        ctx.shadowColor = item.color; ctx.shadowBlur = 12;
        ctx.fillStyle = item.color;
        ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 8); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = bi.colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(item.label, pad.left - 15, y + barH / 2 + 6);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(item.count.toString(), pad.left + bw + 15, y + barH / 2 + 6);
    });
}

function renderExpandedCSAT(ctx, width, height, bi) {
    const ratings = bi.filteredData.filter(t => t.satisfaction_rating).map(t => {
        const sr = t.satisfaction_rating;
        return typeof sr === 'object' ? sr.score : (typeof sr === 'number' ? sr : null);
    }).filter(r => r !== null && r > 0);
    if (!ratings.length) {
        ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados de satisfação', width/2, height/2); return;
    }
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { if (distribution[r] !== undefined) distribution[r]++; });
    
    const cx = width / 2, cy = height / 2 - 30, r = Math.min(width, height) / 3;
    const color = avg >= 4 ? '#10b981' : avg >= 3 ? '#f59e0b' : '#ef4444';
    
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (avg / 5) * Math.PI * 2);
    ctx.strokeStyle = color; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.stroke();
    
    ctx.fillStyle = bi.colors.text; ctx.font = 'bold 64px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`${avg.toFixed(1)}`, cx, cy + 20);
    ctx.font = '18px system-ui'; ctx.fillStyle = bi.colors.textMuted;
    ctx.fillText(`${ratings.length} avaliações`, cx, cy + 55);
    
    // Distribuição
    ctx.font = '16px system-ui'; ctx.textAlign = 'center';
    const distY = height - 50;
    [5, 4, 3, 2, 1].forEach((score, i) => {
        const x = width / 2 - 200 + i * 100;
        ctx.fillStyle = score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444';
        ctx.fillText(`⭐${score}: ${distribution[score]}`, x, distY);
    });
}

function renderExpandedHeatmap(ctx, width, height, bi) {
    const heatmap = {};
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) heatmap[`${d}-${h}`] = 0;
    bi.filteredData.forEach(t => {
        const date = new Date(t.created_at);
        if (!isNaN(date.getTime())) heatmap[`${date.getDay()}-${date.getHours()}`]++;
    });
    const maxVal = Math.max(...Object.values(heatmap), 1);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const pad = { left: 100, right: 30, top: 50, bottom: 40 };
    const cellW = (width - pad.left - pad.right) / 24;
    const cellH = (height - pad.top - pad.bottom) / 7;
    
    ctx.fillStyle = bi.colors.text; ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Heatmap de Tickets por Dia/Hora', width / 2, 30);
    
    for (let d = 0; d < 7; d++) {
        ctx.fillStyle = bi.colors.text; ctx.font = '14px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(dias[d], pad.left - 10, pad.top + d * cellH + cellH / 2 + 5);
        for (let hr = 0; hr < 24; hr++) {
            const val = heatmap[`${d}-${hr}`];
            const intensity = val / maxVal;
            ctx.fillStyle = `rgba(102, 126, 234, ${0.1 + intensity * 0.9})`;
            ctx.fillRect(pad.left + hr * cellW + 1, pad.top + d * cellH + 1, cellW - 2, cellH - 2);
            if (val > 0 && cellW > 25) {
                ctx.fillStyle = intensity > 0.5 ? '#fff' : bi.colors.text;
                ctx.font = '10px system-ui'; ctx.textAlign = 'center';
                ctx.fillText(val.toString(), pad.left + hr * cellW + cellW/2, pad.top + d * cellH + cellH/2 + 4);
            }
        }
    }
    for (let h = 0; h < 24; h += 2) {
        ctx.fillStyle = bi.colors.textMuted; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`${h}h`, pad.left + h * cellW + cellW/2, height - 15);
    }
}

function renderExpandedWorkload(ctx, width, height, bi) {
    const statusMap = { 2: 'open', 3: 'pending', 6: 'pending', 7: 'pending', 8: 'open', 10: 'open', 11: 'open', 12: 'pending', 13: 'pending', 14: 'pending', 15: 'open', 16: 'pending', 17: 'pending', 18: 'open' };
    const openTickets = bi.filteredData.filter(t => {
        const g = statusMap[t.status];
        return g === 'open' || g === 'pending';
    });
    const workload = {};
    const treatField = bi.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
    openTickets.forEach(t => {
        const p = t.custom_fields?.[treatField] || t[treatField];
        if (p) String(p).split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(x => workload[x] = (workload[x] || 0) + 1);
    });
    const sorted = Object.entries(workload).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (!sorted.length) { ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Sem tickets em aberto', width/2, height/2); return; }
    
    const maxVal = sorted[0][1];
    const pad = { left: 200, right: 80, top: 50, bottom: 30 };
    const barH = Math.min(40, (height - pad.top - pad.bottom) / sorted.length - 10);
    
    ctx.fillStyle = bi.colors.text; ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Carga de Trabalho por Pessoa', width / 2, 30);
    
    sorted.forEach(([name, count], i) => {
        const y = pad.top + i * (barH + 10);
        const bw = Math.max(20, (count / maxVal) * (width - pad.left - pad.right));
        const grad = ctx.createLinearGradient(pad.left, 0, pad.left + bw, 0);
        grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#ef4444');
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10;
        ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 6); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = bi.colors.text; ctx.font = '14px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(name.length > 25 ? name.slice(0, 23) + '..' : name, pad.left - 15, y + barH / 2 + 5);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(count.toString(), pad.left + bw + 15, y + barH / 2 + 5);
    });
}

function renderExpandedComparativoMensal(ctx, width, height, bi) {
    // Usar mesma lógica do gráfico normal
    let period1Start, period1End, period2Start, period2End;
    let period1Label, period2Label;
    
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    if (bi.periodFilter === 'custom' && bi.customDateRange && bi.customDateRange.start && bi.customDateRange.end) {
        const start = new Date(bi.customDateRange.start);
        const end = new Date(bi.customDateRange.end);
        const diffMs = end - start;
        const midDate = new Date(start.getTime() + diffMs / 2);
        
        period1Start = start;
        period1End = new Date(midDate.getTime() - 1);
        period2Start = midDate;
        period2End = end;
        
        const formatShort = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
        period1Label = `${formatShort(period1Start)} - ${formatShort(period1End)}`;
        period2Label = `${formatShort(period2Start)} - ${formatShort(period2End)}`;
    } else if (bi.periodFilter !== 'all') {
        const days = parseInt(bi.periodFilter) || 30;
        const now = new Date();
        
        period2End = new Date(now);
        period2Start = new Date(now);
        period2Start.setDate(period2Start.getDate() - days);
        
        period1End = new Date(period2Start);
        period1End.setDate(period1End.getDate() - 1);
        period1Start = new Date(period1End);
        period1Start.setDate(period1Start.getDate() - days + 1);
        
        period1Label = `Anterior (${days}d)`;
        period2Label = `Atual (${days}d)`;
    } else {
        const now = new Date();
        const thisMonth = now.getMonth(), lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const thisYear = now.getFullYear(), lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        
        period1Start = new Date(lastMonthYear, lastMonth, 1);
        period1End = new Date(thisYear, thisMonth, 0);
        period2Start = new Date(thisYear, thisMonth, 1);
        period2End = now;
        
        period1Label = months[lastMonth];
        period2Label = months[thisMonth];
    }
    
    let period1Count = 0, period2Count = 0;
    bi.filteredData.forEach(t => {
        const d = new Date(t.created_at);
        if (d >= period1Start && d <= period1End) period1Count++;
        else if (d >= period2Start && d <= period2End) period2Count++;
    });
    
    const items = [{ label: period1Label, value: period1Count, color: '#64748b' }, { label: period2Label, value: period2Count, color: '#667eea' }];
    const maxVal = Math.max(...items.map(i => i.value), 1);
    
    const diff = period1Count > 0 ? ((period2Count - period1Count) / period1Count * 100) : (period2Count > 0 ? 100 : 0);
    ctx.fillStyle = diff >= 0 ? '#10b981' : '#ef4444'; ctx.font = 'bold 32px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, width / 2, 55);
    ctx.fillStyle = bi.colors.textMuted; ctx.font = '16px system-ui';
    ctx.fillText('variação em relação ao período anterior', width / 2, 85);
    
    const pad = { left: 150, right: 150, top: 130, bottom: 90 };
    const barW = (width - pad.left - pad.right - 120) / 2;
    const chartH = height - pad.top - pad.bottom;
    
    items.forEach((item, i) => {
        const x = pad.left + i * (barW + 120);
        const barH = Math.max(20, (item.value / maxVal) * chartH);
        const y = height - pad.bottom - barH;
        ctx.shadowColor = item.color; ctx.shadowBlur = 15;
        ctx.fillStyle = item.color; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 10); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = bi.colors.text; ctx.font = 'bold 36px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(item.value.toLocaleString(), x + barW / 2, y - 18);
        ctx.font = '18px system-ui'; ctx.fillText(item.label, x + barW / 2, height - 40);
    });
}

function renderExpandedTendencia(ctx, width, height, bi) {
    // Usar mesma lógica do gráfico normal (respeitar período selecionado)
    let periodStart, periodEnd;
    
    if (bi.periodFilter === 'custom' && bi.customDateRange && bi.customDateRange.start && bi.customDateRange.end) {
        periodStart = new Date(bi.customDateRange.start);
        periodEnd = new Date(bi.customDateRange.end);
    } else if (bi.periodFilter !== 'all') {
        const days = parseInt(bi.periodFilter) || 30;
        periodEnd = new Date();
        periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - days);
    } else {
        periodEnd = new Date();
        periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - 56); // 8 semanas
    }
    
    // Calcular número de semanas no período
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const numWeeks = Math.min(Math.max(Math.ceil(totalDays / 7), 2), 8);
    const daysPerWeek = Math.ceil(totalDays / numWeeks);
    
    const weeks = [];
    for (let i = 0; i < numWeeks; i++) {
        const start = new Date(periodStart);
        start.setDate(start.getDate() + i * daysPerWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + daysPerWeek - 1);
        if (end > periodEnd) end.setTime(periodEnd.getTime());
        
        weeks.push({ 
            start, 
            end, 
            count: 0, 
            label: `Sem ${i + 1}`,
            dateLabel: `${start.getDate()}/${start.getMonth() + 1}`
        });
    }
    
    // Contar tickets por semana
    bi.filteredData.forEach(t => { 
        const d = new Date(t.created_at); 
        weeks.forEach(w => { 
            if (d >= w.start && d <= w.end) w.count++; 
        }); 
    });
    
    const maxVal = Math.max(...weeks.map(w => w.count), 1);
    const total = weeks.reduce((s, w) => s + w.count, 0);
    
    if (total === 0) {
        ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Sem dados no período', width/2, height/2); return;
    }
    
    const pad = { left: 100, right: 80, top: 70, bottom: 90 };
    const chartW = width - pad.left - pad.right, chartH = height - pad.top - pad.bottom;
    const stepX = weeks.length > 1 ? chartW / (weeks.length - 1) : chartW;
    
    // Título
    ctx.fillStyle = bi.colors.text; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Tendência Semanal', width/2, 35);
    
    // Área sob a linha
    ctx.beginPath();
    ctx.moveTo(pad.left, height - pad.bottom);
    weeks.forEach((wk, i) => {
        const x = pad.left + i * stepX, y = pad.top + chartH - (wk.count / maxVal) * chartH;
        ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + (weeks.length - 1) * stepX, height - pad.bottom);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
    grad.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    grad.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
    ctx.fillStyle = grad; ctx.fill();
    
    // Linha
    ctx.strokeStyle = '#667eea'; ctx.lineWidth = 4; ctx.beginPath();
    weeks.forEach((wk, i) => {
        const x = pad.left + i * stepX, y = pad.top + chartH - (wk.count / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Pontos e labels
    weeks.forEach((wk, i) => {
        const x = pad.left + i * stepX, y = pad.top + chartH - (wk.count / maxVal) * chartH;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fillStyle = '#667eea'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(wk.count.toLocaleString(), x, y - 22);
        ctx.font = '14px system-ui'; ctx.fillStyle = bi.colors.text;
        ctx.fillText(wk.label, x, height - 50);
        ctx.font = '12px system-ui'; ctx.fillStyle = bi.colors.textMuted;
        ctx.fillText(wk.dateLabel, x, height - 30);
    });
}

function renderExpandedRankingSLA(ctx, width, height, bi) {
    const SLA_LIMIT = 4 * 60 * 60 * 1000;
    const personSLA = {};
    const treatField = bi.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
    bi.filteredData.forEach(t => {
        const p = t.custom_fields?.[treatField] || t[treatField];
        const fr = t.stats_first_responded_at || t.first_responded_at;
        if (!p || !fr || !t.created_at) return;
        const time = new Date(fr) - new Date(t.created_at);
        String(p).split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => {
            if (!personSLA[name]) personSLA[name] = { within: 0, total: 0 };
            personSLA[name].total++;
            if (time <= SLA_LIMIT) personSLA[name].within++;
        });
    });
    const sorted = Object.entries(personSLA).filter(([, v]) => v.total >= 3).map(([name, v]) => ({ name, rate: (v.within / v.total) * 100, total: v.total })).sort((a, b) => b.rate - a.rate).slice(0, 10);
    if (!sorted.length) { ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Dados insuficientes', width/2, height/2); return; }
    
    renderExpandedRankingBars(ctx, width, height, sorted, '%', bi, 'Ranking por SLA');
}

function renderExpandedRankingResolucao(ctx, width, height, bi) {
    const personRes = {};
    const treatField = bi.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
    bi.filteredData.forEach(t => {
        const p = t.custom_fields?.[treatField] || t[treatField];
        if (!p) return;
        const resolved = [4, 5].includes(Number(t.status));
        String(p).split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => {
            if (!personRes[name]) personRes[name] = { resolved: 0, total: 0 };
            personRes[name].total++;
            if (resolved) personRes[name].resolved++;
        });
    });
    const sorted = Object.entries(personRes).filter(([, v]) => v.total >= 3).map(([name, v]) => ({ name, rate: (v.resolved / v.total) * 100, total: v.total })).sort((a, b) => b.rate - a.rate).slice(0, 10);
    if (!sorted.length) { ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Dados insuficientes', width/2, height/2); return; }
    
    renderExpandedRankingBars(ctx, width, height, sorted, '%', bi, 'Ranking por Resolução');
}

function renderExpandedEficiencia(ctx, width, height, bi) {
    // Usar resolvedInPeriod (tickets resolvidos no período selecionado)
    const resolvedData = bi.resolvedInPeriod || [];
    
    // Calcular dias do período para média correta
    const periodDays = bi.periodFilter === 'all' ? 365 : parseInt(bi.periodFilter) || 30;
    
    const personEff = {};
    const treatField = bi.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
    
    resolvedData.forEach(t => {
        // Acessar campo diretamente (não nested em custom_fields)
        const p = t[treatField] || t.custom_fields?.[treatField];
        if (!p) return;
        String(p).split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => { 
            personEff[name] = (personEff[name] || 0) + 1; 
        });
    });
    
    // Calcular taxa por dia e ordenar
    const sorted = Object.entries(personEff)
        .map(([name, count]) => ({ name, rate: count / periodDays, total: count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    
    if (!sorted.length) { 
        ctx.fillStyle = bi.colors.textMuted; 
        ctx.font = '20px system-ui'; 
        ctx.textAlign = 'center'; 
        ctx.fillText('Sem dados de resolução no período', width/2, height/2); 
        return; 
    }
    
    renderExpandedRankingBars(ctx, width, height, sorted, '/dia', bi, 'Índice de Eficiência');
}

function renderExpandedRankingBars(ctx, width, height, items, suffix, bi, title) {
    const maxVal = Math.max(...items.map(i => i.rate), 1);
    const pad = { left: 200, right: 100, top: 60, bottom: 30 };
    const chartWidth = width - pad.left - pad.right;
    const barH = Math.min(42, (height - pad.top - pad.bottom) / items.length - 12);
    const borderRadius = 8;
    
    // Paleta premium
    const premiumColors = [
        { main: '#fbbf24', glow: '#fcd34d', dark: '#f59e0b' },  // Gold (1º)
        { main: '#94a3b8', glow: '#cbd5e1', dark: '#64748b' },  // Silver (2º)
        { main: '#cd7f32', glow: '#d4a574', dark: '#b8860b' },  // Bronze (3º)
        { main: '#6366f1', glow: '#818cf8', dark: '#4f46e5' },  // Indigo
        { main: '#8b5cf6', glow: '#a78bfa', dark: '#7c3aed' },  // Violet
        { main: '#3b82f6', glow: '#60a5fa', dark: '#2563eb' },  // Blue
        { main: '#06b6d4', glow: '#22d3ee', dark: '#0891b2' },  // Cyan
        { main: '#10b981', glow: '#34d399', dark: '#059669' },  // Emerald
        { main: '#ec4899', glow: '#f472b6', dark: '#db2777' },  // Pink
        { main: '#f97316', glow: '#fb923c', dark: '#ea580c' },  // Orange
    ];
    
    // Título
    ctx.fillStyle = bi.colors.text;
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 35);
    
    items.forEach((item, i) => {
        const y = pad.top + i * (barH + 12);
        const bw = Math.max(20, (item.rate / maxVal) * chartWidth);
        const colorSet = premiumColors[i % premiumColors.length];
        
        ctx.save();
        
        // Fundo (track)
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.roundRect(pad.left, y, chartWidth, barH, borderRadius);
        ctx.fill();
        
        // Sombra premium
        ctx.shadowColor = colorSet.glow;
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 2;
        
        // Gradiente premium
        const gradient = ctx.createLinearGradient(pad.left, y, pad.left + bw, y);
        gradient.addColorStop(0, colorSet.dark);
        gradient.addColorStop(0.3, colorSet.main);
        gradient.addColorStop(0.7, colorSet.main);
        gradient.addColorStop(1, colorSet.glow);
        
        // Barra principal
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(pad.left, y, bw, barH, borderRadius);
        ctx.fill();
        
        // Glass effect
        const glassGradient = ctx.createLinearGradient(0, y, 0, y + barH);
        glassGradient.addColorStop(0, 'rgba(255,255,255,0.25)');
        glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        glassGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = glassGradient;
        ctx.beginPath();
        ctx.roundRect(pad.left, y, bw, barH, borderRadius);
        ctx.fill();
        
        ctx.restore();
        
        // Nome
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '500 14px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(`${i + 1}. ${item.name.length > 22 ? item.name.slice(0, 20) + '..' : item.name}`, pad.left - 15, y + barH / 2 + 5);
        
        // Valor
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.rate.toFixed(1)}${suffix}`, pad.left + bw + 15, y + barH / 2 + 5);
    });
}

function renderExpandedParados(ctx, width, height, bi) {
    const now = new Date();
    const statusMap = { 2: 'open', 3: 'pending', 6: 'pending', 7: 'pending', 8: 'open', 10: 'open', 11: 'open', 12: 'pending', 13: 'pending', 14: 'pending', 15: 'open', 16: 'pending', 17: 'pending', 18: 'open' };
    const staleTickets = bi.filteredData.filter(t => {
        const g = statusMap[t.status];
        if (!g || g === 'resolved' || g === 'closed') return false;
        const lastUpdate = new Date(t.updated_at || t.created_at);
        return (now - lastUpdate) / (1000 * 60 * 60 * 24) >= 3;
    });
    const faixas = [
        { label: '3 a 7 dias', min: 3, max: 7, color: '#f59e0b', count: 0 },
        { label: '7 a 15 dias', min: 7, max: 15, color: '#f97316', count: 0 },
        { label: '15 a 30 dias', min: 15, max: 30, color: '#ef4444', count: 0 },
        { label: 'Mais de 30 dias', min: 30, max: Infinity, color: '#dc2626', count: 0 }
    ];
    staleTickets.forEach(t => {
        const days = (now - new Date(t.updated_at || t.created_at)) / (1000 * 60 * 60 * 24);
        const f = faixas.find(fx => days >= fx.min && days < fx.max);
        if (f) f.count++;
    });
    const items = faixas.filter(f => f.count > 0);
    if (!items.length) { ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Nenhum ticket parado', width/2, height/2); return; }
    
    ctx.fillStyle = bi.colors.text; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`Total de Tickets Parados: ${staleTickets.length}`, width / 2, 45);
    
    const maxCount = Math.max(...items.map(i => i.count), 1);
    const pad = { left: 180, right: 80, top: 80, bottom: 50 };
    const barH = Math.min(50, (height - pad.top - pad.bottom) / items.length - 15);
    
    items.forEach((item, i) => {
        const y = pad.top + i * (barH + 15);
        const bw = Math.max(20, (item.count / maxCount) * (width - pad.left - pad.right));
        ctx.shadowColor = item.color; ctx.shadowBlur = 12;
        ctx.fillStyle = item.color;
        ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 8); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = bi.colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(item.label, pad.left - 15, y + barH / 2 + 6);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(item.count.toString(), pad.left + bw + 15, y + barH / 2 + 6);
    });
}

function renderExpandedAguardando(ctx, width, height, bi) {
    const aguardando = bi.filteredData.filter(t => t.status === 7);
    const now = new Date();
    const faixas = [
        { label: 'Menos de 1 dia', min: 0, max: 1, color: '#10b981', count: 0 },
        { label: '1 a 3 dias', min: 1, max: 3, color: '#3b82f6', count: 0 },
        { label: '3 a 7 dias', min: 3, max: 7, color: '#f59e0b', count: 0 },
        { label: 'Mais de 7 dias', min: 7, max: Infinity, color: '#ef4444', count: 0 }
    ];
    aguardando.forEach(t => {
        const days = (now - new Date(t.updated_at || t.created_at)) / (1000 * 60 * 60 * 24);
        const f = faixas.find(fx => days >= fx.min && days < fx.max);
        if (f) f.count++;
    });
    const items = faixas.filter(f => f.count > 0);
    if (!items.length) { ctx.fillStyle = bi.colors.textMuted; ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Nenhum aguardando cliente', width/2, height/2); return; }
    
    ctx.fillStyle = bi.colors.text; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`Aguardando Cliente: ${aguardando.length} tickets`, width / 2, 45);
    
    const maxCount = Math.max(...items.map(i => i.count), 1);
    const pad = { left: 180, right: 80, top: 80, bottom: 50 };
    const barH = Math.min(50, (height - pad.top - pad.bottom) / items.length - 15);
    
    items.forEach((item, i) => {
        const y = pad.top + i * (barH + 15);
        const bw = Math.max(20, (item.count / maxCount) * (width - pad.left - pad.right));
        ctx.shadowColor = item.color; ctx.shadowBlur = 12;
        ctx.fillStyle = item.color;
        ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 8); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = bi.colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(item.label, pad.left - 15, y + barH / 2 + 6);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(item.count.toString(), pad.left + bw + 15, y + barH / 2 + 6);
    });
}

// Helper para criar card de gráfico com botão de expansão - Premium SaaS
window.createChartCard = function(chartId, title, canvasHeight = 250, extraStyles = '') {
    // Remover emoji do título para usar ícone SVG
    const cleanTitle = title.replace(/^[^\w\s]+\s*/, '');
    return `
        <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); position: relative; ${extraStyles}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #e4e4e7; font-size: 0.9rem; font-weight: 600;">${cleanTitle}</h3>
                <button onclick="expandChart('${chartId}', '${title}')" title="Expandir gráfico" style="
                    background: rgba(99,102,241,0.1);
                    border: 1px solid rgba(99,102,241,0.2);
                    color: #a5b4fc;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(99,102,241,0.25)'; this.style.borderColor='rgba(99,102,241,0.4)'" onmouseout="this.style.background='rgba(99,102,241,0.1)'; this.style.borderColor='rgba(99,102,241,0.2)'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
            </div>
            <canvas id="${chartId}" height="${canvasHeight}"></canvas>
        </div>
    `;
};

// Helper global para setup de canvas com DPR correto (evita problema de re-render)
// Disponível para todos os módulos de charts
window.setupCanvas = function(canvas, height = 250) {
    const dpr = window.devicePixelRatio || 1;
    
    // Determinar largura - prioridade: salva > parent > offsetWidth > 400
    let width = canvas._savedWidth;
    if (!width || width <= 0) {
        width = canvas.offsetWidth;
    }
    if (!width || width <= 0) {
        // Tentar pegar do parent
        const parent = canvas.parentElement;
        if (parent) {
            width = parent.offsetWidth - 32; // padding
        }
    }
    if (!width || width <= 0) {
        width = 400; // fallback
    }
    
    // Salvar para re-renders
    canvas._savedWidth = width;
    canvas._savedHeight = height;
    
    // Definir tamanho do canvas (interno = pixels * DPR)
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // IMPORTANTE: Definir tamanho visual (CSS) para manter coordenadas corretas
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform antes de scale
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    
    return { ctx, width, height, dpr };
};

class BIAnalytics {
    constructor() {
        this.currentView = 'pessoa'; // 'pessoa' ou 'time'
        this.selectedEntities = new Set(); // Múltipla seleção
        // Manter seleções separadas por view para persistência
        this.selectedPessoas = new Set();
        this.selectedTimes = new Set();
        this.allPessoas = new Set();
        this.allTimes = new Set();
        this.ticketsData = [];
        this.filteredData = [];
        
        // PRÉ-FILTRO de time para aba Pessoas
        this.pessoasTeamFilter = 'all'; // 'all' ou nome do time
        this.pessoasByTeam = {}; // Mapeamento time -> Set de pessoas
        
        // Filtro de período
        this.periodFilter = 'all'; // 'all', '7', '30', '90', '365', 'custom'
        this.customDateRange = { start: null, end: null }; // Para período personalizado
        
        // Paginação para gráficos
        this.pagination = {
            top10: { page: 0, perPage: 10 },
            slaByEntity: { page: 0, perPage: 10 }
        };
        
        // Estado de expansão de gráficos (encapsulado na instância)
        this._expandState = {
            page: 0,
            chartId: null
        };
        
        // Mapeamento global de status (números e strings) - Freshdesk Tryvia
        // Usar módulo centralizado se disponível
        this.statusLabels = window.FRESHDESK_STATUS?.MAP ? 
            Object.fromEntries(Object.entries(window.FRESHDESK_STATUS.MAP).map(([k, v]) => [k, v.label])) : {
            // IDs do Freshdesk Tryvia
            2: 'Aberto',
            3: 'Pendente',
            4: 'Resolvido',
            5: 'Fechado',
            6: 'Em Homologação',
            7: 'Aguardando Cliente',
            8: 'Em Tratativa',
            10: 'Em Análise',
            11: 'Interno',
            12: 'Aguardando Publicar HML',
            13: 'Aguardando Publicar PROD',
            14: 'MVP',
            15: 'Validação-Atendimento',
            16: 'Aguardando Parceiros',
            17: 'Pausado',
            18: 'Validação-CS',
            19: 'Levantamento de Esforço',
            20: 'Em Fila DEV',
            21: 'Em Produção',
            // Strings (Freshdesk padrão em inglês)
            'Open': 'Aberto',
            'Pending': 'Pendente',
            'Resolved': 'Resolvido',
            'Closed': 'Fechado'
        };
        
        this.statusColors = window.FRESHDESK_STATUS?.MAP ?
            Object.fromEntries(Object.entries(window.FRESHDESK_STATUS.MAP).map(([k, v]) => [k, v.color])) : {
            2: '#3b82f6',  // Aberto - azul
            3: '#f59e0b',  // Pendente - amarelo
            4: '#10b981',  // Resolvido - verde
            5: '#6b7280',  // Fechado - cinza
            6: '#8b5cf6',  // Em Homologação - roxo
            7: '#f59e0b',  // Aguardando Cliente - laranja
            8: '#06b6d4',  // Em Tratativa - ciano
            10: '#06b6d4', // Em Análise - ciano
            11: '#64748b', // Interno - cinza
            12: '#3b82f6', // Aguardando Publicar HML - azul
            13: '#8b5cf6', // Aguardando Publicar PROD - roxo
            14: '#ec4899', // MVP - rosa
            15: '#f97316', // Validação-Atendimento - laranja
            16: '#a855f7', // Aguardando Parceiros - roxo
            17: '#64748b', // Pausado - cinza
            18: '#f97316', // Validação-CS - laranja
            19: '#6366f1', // Levantamento de Esforço - indigo
            20: '#ef4444', // Em Fila DEV - vermelho
            21: '#10b981'  // Em Produção - verde
        };
        
        // Design System
        this.colors = {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#f59e0b',
            danger: '#ef4444',
            dark: '#1e1e2e',
            surface: '#2a2a3e',
            border: '#374151',
            text: '#e5e7eb',
            textMuted: '#9ca3af'
        };
        
        // Gradientes para gráficos
        this.gradients = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#30cfd0', '#330867'],
            ['#a8edea', '#fed6e3'],
            ['#ffecd2', '#fcb69f'],
            ['#ff9a9e', '#fecfef'],
            ['#fbc2eb', '#a6c1ee']
        ];
        
        // Tipos a ignorar em cálculos de SLA (normalizados para minúsculas e espaços simples)
        this.ignoreTypesForSLA = new Set([
            'melhoria',
            'melhoria api',
            'melhoria app motorista',
            'melhoria bi',
            'melhoria etrip',
            'melhoria optz',
            'melhoria sing',
            'melhoria telemetria',
            'melhoria yuv'
        ].map(s => s.toLowerCase().replace(/\s+/g, ' ').trim()));
    }
    
    initialize() {
        console.log('🚀 Inicializando BI Analytics');
        
        // Verificar dados disponíveis
        if (!window.allTicketsCache || window.allTicketsCache.length === 0) {
            this.showNoDataMessage();
            return;
        }
        
        this.ticketsData = window.allTicketsCache;
        this.extractEntities();
        this.injectStyles();
        
        // Restaurar seleções da view atual
        if (this.currentView === 'pessoa' && this.selectedPessoas.size > 0) {
            this.selectedEntities = new Set(this.selectedPessoas);
        } else if (this.currentView === 'time' && this.selectedTimes.size > 0) {
            this.selectedEntities = new Set(this.selectedTimes);
        }
        
        // Se já tem entidades selecionadas, re-analisar os dados
        if (this.selectedEntities.size > 0) {
            console.log(`📊 Restaurando filtros: ${this.selectedEntities.size} entidade(s) selecionada(s) [${this.currentView}]`);
            this.render();
            // Re-analisar dados para renderizar gráficos corretamente
            setTimeout(() => this.analyzeData(), 100);
        } else {
            this.render();
        }
    }
    
    // Helper para obter pessoa do ticket (com fallback)
    getTicketPessoa(ticket) {
        // Prioridade: cf_tratativa > responder_name > Agente ID
        const tratativa = ticket.cf_tratativa || ticket.cf_tratativa1684353202918;
        if (tratativa && tratativa.trim()) return tratativa;
        
        const responder = ticket.responder_name;
        if (responder && responder.trim()) return responder;
        
        // Fallback: resolver nome do agente pelo ID
        if (ticket.responder_id && window.resolveAgentName) {
            const agentName = window.resolveAgentName(ticket.responder_id);
            if (agentName && !agentName.startsWith('Agente ')) return agentName;
        }
        
        return null;
    }
    
    // Helper para obter time do ticket (com fallback)
    getTicketTime(ticket) {
        // Prioridade: cf_grupo_tratativa > group_name > Group ID
        const grupoTratativa = ticket.cf_grupo_tratativa || ticket.cf_grupo_tratativa1684353202918;
        if (grupoTratativa && grupoTratativa.trim()) return grupoTratativa;
        
        const groupName = ticket.group_name;
        if (groupName && groupName.trim()) return groupName;
        
        // Fallback: resolver nome do grupo pelo ID
        if (ticket.group_id && window.resolveGroupName) {
            const gName = window.resolveGroupName(ticket.group_id);
            if (gName && !gName.startsWith('Grupo ')) return gName;
        }
        
        return null;
    }
    
    extractEntities() {
        // Extrair todas as pessoas únicas
        // IMPORTANTE: Usar APENAS cf_tratativa e cf_grupo_tratativa (sem fallback)
        // Isso garante que só aparecem pessoas/times que realmente têm tratativa preenchida
        this.allPessoas.clear();
        this.allTimes.clear();
        this.pessoasByTeam = {};
        
        this.ticketsData.forEach(ticket => {
            // Pessoas: APENAS cf_tratativa (sem fallback para responder_name)
            // Isso garante que só mostra pessoas que realmente trabalharam em tickets
            const pessoaField = ticket.cf_tratativa;
            if (pessoaField) {
                const pessoas = pessoaField.split(/[,;\/]/).map(p => p.trim()).filter(p => p);
                pessoas.forEach(p => this.allPessoas.add(p));
            }
            
            // Times: APENAS cf_grupo_tratativa (sem fallback para group_name)
            const timeField = ticket.cf_grupo_tratativa;
            if (timeField) {
                const times = timeField.split(/[,;\/]/).map(t => t.trim()).filter(t => t);
                times.forEach(t => this.allTimes.add(t));
                
                // Mapear pessoas por time
                if (pessoaField) {
                    const pessoas = pessoaField.split(/[,;\/]/).map(p => p.trim()).filter(p => p);
                    times.forEach(time => {
                        if (!this.pessoasByTeam[time]) {
                            this.pessoasByTeam[time] = new Set();
                        }
                        pessoas.forEach(p => this.pessoasByTeam[time].add(p));
                    });
                }
            }
        });
        
        // Aplicar whitelist de membros por time (se configurado)
        const teamConfig = window.TEAM_MEMBERS_CONFIG || {};
        Object.keys(teamConfig).forEach(team => {
            if (this.pessoasByTeam[team]) {
                // Filtrar apenas membros que estão na whitelist
                const whitelist = new Set(teamConfig[team]);
                const filteredMembers = new Set();
                this.pessoasByTeam[team].forEach(pessoa => {
                    if (whitelist.has(pessoa)) {
                        filteredMembers.add(pessoa);
                    }
                });
                this.pessoasByTeam[team] = filteredMembers;
                console.log(`✅ Time "${team}" filtrado: ${filteredMembers.size} membros válidos`);
            }
        });
        
        console.log(`📊 Encontrados: ${this.allPessoas.size} pessoas, ${this.allTimes.size} times`);
        console.log('👥 Pessoas por time:', Object.keys(this.pessoasByTeam).map(t => `${t}: ${this.pessoasByTeam[t].size}`));
    }
    
    injectStyles() {
        if (document.getElementById('bi-analytics-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'bi-analytics-styles';
        styles.textContent = `
            .bi-analytics-container {
                background: ${this.colors.dark};
                color: ${this.colors.text};
                min-height: 100vh;
                padding: 1.5rem;
            }
            
            /* Header */
            .bi-header {
                background: ${this.colors.surface};
                border-radius: 16px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .bi-title {
                font-size: 2rem;
                font-weight: 700;
                margin: 0 0 0.5rem 0;
                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.accent});
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            /* Sub-tabs - Estilo simples com borda inferior */
            .bi-tabs {
                display: flex;
                gap: 0.5rem;
                padding: 0;
                background: transparent;
                border-bottom: 1px solid rgba(63,63,90,0.3);
                margin-bottom: 1rem;
            }
            
            .bi-tab {
                padding: 0.6rem 1rem;
                border: none;
                border-bottom: 2px solid transparent;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.15s ease;
                background: transparent !important;
                color: #71717a;
                margin-bottom: -1px;
            }
            
            .bi-tab:hover {
                color: #a1a1aa;
            }
            
            .bi-tab.active {
                background: transparent !important;
                color: #e4e4e7;
                border-bottom-color: #3b82f6;
            }
            
            /* Entity Selector */
            .bi-selector-container {
                background: ${this.colors.surface};
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .bi-entity-chip {
                padding: 0.75rem 1rem;
                border: 2px solid ${this.colors.border};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                font-size: 0.875rem;
                position: relative;
                overflow: hidden;
                background: ${this.colors.surface};
            }
            
            .bi-entity-chip:hover {
                border-color: ${this.colors.primary};
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                background: ${this.colors.surface}dd;
            }
            
            .bi-entity-chip.selected {
                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.accent});
                border-color: transparent;
                color: white;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
            
            /* Cards */
            .bi-card {
                background: ${this.colors.surface};
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                border: 1px solid transparent;
                transition: box-shadow 0.3s ease, border-color 0.3s ease;
            }
            
            .bi-card:hover {
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
                border-color: ${this.colors.primary}44;
            }
            
            /* Productivity KPI Cards */
            .prod-kpi-card {
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            
            .prod-kpi-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            
            .prod-kpi-card:hover::before {
                left: 100%;
            }
            
            .prod-kpi-card:hover {
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
                filter: brightness(1.1);
            }
            
            .prod-kpi-value {
                font-variant-numeric: tabular-nums;
            }
            
            /* Scrollbar */
            .bi-entities-grid::-webkit-scrollbar {
                width: 8px;
            }
            
            .bi-entities-grid::-webkit-scrollbar-track {
                background: ${this.colors.dark};
                border-radius: 4px;
            }
            
            .bi-entities-grid::-webkit-scrollbar-thumb {
                background: ${this.colors.border};
                border-radius: 4px;
            }
            
            .bi-entities-grid::-webkit-scrollbar-thumb:hover {
                background: ${this.colors.primary};
            }
            
            /* Tooltip for charts */
            .bi-tooltip {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                background: rgba(17, 24, 39, 0.95); /* slate-900 */
                color: #e5e7eb; /* text */
                border: 1px solid #374151; /* border */
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 12px;
                line-height: 1.2;
                box-shadow: 0 6px 24px rgba(0,0,0,0.35);
                display: none;
                white-space: nowrap;
                max-width: 260px;
            }
        `;
        document.head.appendChild(styles);
    }
    
    render() {
        const container = document.getElementById('biAnalyticsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <!-- Header -->
            <div class="bi-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid rgba(63,63,90,0.3); margin-bottom: 1rem;">
                <div>
                    <h1 class="bi-title" style="display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; color: #f4f4f5; margin: 0 0 0.5rem 0;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                        BI Analytics
                    </h1>
                    <p style="color: #a1a1aa; margin: 0; font-size: 0.9rem;">
                        Análise completa de performance por Pessoas e Times
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span id="biLastUpdate" style="font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.35rem;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Atualizado: --
                        </span>
                        <button onclick="window.biAnalytics.refreshData()" style="
                            padding: 0.45rem 0.9rem;
                            border: 1px solid rgba(59,130,246,0.3);
                            border-radius: 6px;
                            background: rgba(59,130,246,0.1);
                            color: #60a5fa;
                            cursor: pointer;
                            font-size: 0.8rem;
                            display: flex;
                            align-items: center;
                            gap: 0.4rem;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='rgba(59,130,246,0.2)';this.style.borderColor='rgba(59,130,246,0.5)'"
                           onmouseout="this.style.background='rgba(59,130,246,0.1)';this.style.borderColor='rgba(59,130,246,0.3)'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                            Atualizar
                        </button>
                    </div>
                    <div id="biSyncStatus" style="font-size: 0.75rem; color: ${this.colors.textMuted};"></div>
                </div>
            </div>
            
            <!-- Sub-tabs -->
            <div class="bi-tabs" style="display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.5rem 0; margin-bottom: 1rem; border-bottom: 1px solid rgba(63,63,90,0.3);">
                <button class="bi-tab ${this.currentView === 'pessoa' ? 'active' : ''}" 
                        onclick="window.biAnalytics.switchView('pessoa')"
                        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border: none; border-bottom: 2px solid ${this.currentView === 'pessoa' ? '#3b82f6' : 'transparent'}; background: transparent; color: ${this.currentView === 'pessoa' ? '#e4e4e7' : '#71717a'}; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; margin-bottom: -1px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Pessoas
                </button>
                <button class="bi-tab ${this.currentView === 'time' ? 'active' : ''}"
                        onclick="window.biAnalytics.switchView('time')"
                        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border: none; border-bottom: 2px solid ${this.currentView === 'time' ? '#3b82f6' : 'transparent'}; background: transparent; color: ${this.currentView === 'time' ? '#e4e4e7' : '#71717a'}; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; margin-bottom: -1px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Times
                </button>
                <button class="bi-tab ${this.currentView === 'produtividade' ? 'active' : ''}"
                        onclick="window.biAnalytics.switchView('produtividade')"
                        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border: none; border-bottom: 2px solid ${this.currentView === 'produtividade' ? '#3b82f6' : 'transparent'}; background: transparent; color: ${this.currentView === 'produtividade' ? '#e4e4e7' : '#71717a'}; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; margin-bottom: -1px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    Produtividade
                </button>
                <button class="bi-tab ${this.currentView === 'csat' ? 'active' : ''}"
                        onclick="window.biAnalytics.switchView('csat')"
                        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border: none; border-bottom: 2px solid ${this.currentView === 'csat' ? '#f59e0b' : 'transparent'}; background: transparent; color: ${this.currentView === 'csat' ? '#e4e4e7' : '#71717a'}; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; margin-bottom: -1px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    CSAT
                </button>
                <button class="bi-tab ${this.currentView === 'tempo' ? 'active' : ''}"
                        onclick="window.biAnalytics.switchView('tempo')"
                        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border: none; border-bottom: 2px solid ${this.currentView === 'tempo' ? '#3b82f6' : 'transparent'}; background: transparent; color: ${this.currentView === 'tempo' ? '#e4e4e7' : '#71717a'}; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; margin-bottom: -1px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Tempo
                </button>
                <button class="bi-tab ${this.currentView === 'acompanhamento' ? 'active' : ''}"
                        onclick="window.biAnalytics.switchView('acompanhamento')"
                        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border: none; border-bottom: 2px solid ${this.currentView === 'acompanhamento' ? '#8b5cf6' : 'transparent'}; background: transparent; color: ${this.currentView === 'acompanhamento' ? '#e4e4e7' : '#71717a'}; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; margin-bottom: -1px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    Acompanhamento
                </button>
            </div>
            
            ${this.currentView === 'produtividade' ? `
                ${this.renderProductivitySelector()}
            ` : this.currentView === 'csat' ? `
                <!-- CSAT Content - Carregado via módulo -->
                <div id="biCSATContent" style="padding: 1rem;">
                    <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                        <div style="margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>
                        <p style="font-size: 0.9rem;">Carregando dados de CSAT...</p>
                    </div>
                </div>
            ` : this.currentView === 'tempo' ? `
                <!-- Time Entries Content - Carregado via módulo -->
                <div id="biTimeContent" style="padding: 1rem;">
                    <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                        <div style="margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>
                        <p style="font-size: 0.9rem;">Carregando dados de tempo...</p>
                    </div>
                </div>
            ` : this.currentView === 'acompanhamento' ? `
                <!-- Acompanhamento Content - BI por Tags -->
                <div id="biAcompanhamentoContent" style="padding: 1rem;">
                    <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                        <div style="margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>
                        <p style="font-size: 0.9rem;">Carregando dados de acompanhamento...</p>
                    </div>
                </div>
            ` : `
                <!-- Entity Selector -->
                <div class="bi-selector-container">
                    ${this.currentView === 'pessoa' ? `
                    <!-- FILTRO POR TIME (Simplificado) -->
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <span style="color: #e4e4e7; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 0.4rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                Filtrar por Time:
                            </span>
                            <select id="teamPreFilter" onchange="window.biAnalytics.setTeamPreFilterAndApply(this.value)" style="
                                padding: 0.6rem 1.25rem;
                                background: ${this.colors.surface};
                                border: 1px solid ${this.colors.border};
                                border-radius: 8px;
                                color: ${this.colors.text};
                                font-size: 0.95rem;
                                cursor: pointer;
                                min-width: 250px;
                            ">
                                <option value="all" ${this.pessoasTeamFilter === 'all' ? 'selected' : ''}>Todos os Times (${this.allPessoas.size} pessoas)</option>
                                ${Array.from(this.allTimes).sort().map(team => `
                                    <option value="${team}" ${this.pessoasTeamFilter === team ? 'selected' : ''}>
                                        ${team} (${this.pessoasByTeam[team]?.size || 0} pessoas)
                                    </option>
                                `).join('')}
                            </select>
                            ${this.pessoasTeamFilter !== 'all' ? `
                                <span style="background: ${this.colors.secondary}22; padding: 0.5rem 0.85rem; border-radius: 8px; font-size: 0.9rem; color: ${this.colors.secondary}; font-weight: 500;">
                                    ✓ ${this.selectedEntities.size} de ${this.pessoasByTeam[this.pessoasTeamFilter]?.size || 0} selecionadas
                                </span>
                            ` : `
                                <span style="background: ${this.colors.primary}22; padding: 0.5rem 0.85rem; border-radius: 8px; font-size: 0.9rem; color: ${this.colors.primary}; font-weight: 500;">
                                    ${this.allPessoas.size} pessoas no total
                                </span>
                            `}
                        </div>
                        <button onclick="window.biAnalytics.clearSelectionAndReload()" style="
                            padding: 0.5rem 1rem;
                            border: 1px solid ${this.colors.border};
                            border-radius: 8px;
                            background: transparent;
                            color: ${this.colors.textMuted};
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">Limpar</button>
                    </div>
                    
                    ${this.pessoasTeamFilter !== 'all' ? `
                    <!-- SELETOR DE PESSOAS DO TIME -->
                    <div style="background: ${this.colors.dark}; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; border: 1px solid ${this.colors.border};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <span style="color: ${this.colors.textMuted}; font-size: 0.85rem;">
                                Selecionar pessoas específicas do time <strong style="color: ${this.colors.primary}">${this.pessoasTeamFilter}</strong>:
                            </span>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="window.biAnalytics.selectAllTeamPessoas()" style="
                                    padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;
                                    background: ${this.colors.surface}; color: ${this.colors.text}; border: 1px solid ${this.colors.border};
                                ">✓ Todas</button>
                                <button onclick="window.biAnalytics.clearTeamPessoas()" style="
                                    padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;
                                    background: ${this.colors.surface}; color: ${this.colors.text}; border: 1px solid ${this.colors.border};
                                ">✗ Nenhuma</button>
                            </div>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; max-height: 150px; overflow-y: auto;">
                            ${Array.from(this.pessoasByTeam[this.pessoasTeamFilter] || []).sort().map(pessoa => {
                                const isSelected = this.selectedEntities.has(pessoa);
                                return `
                                    <button onclick="window.biAnalytics.togglePessoaSelection('${pessoa.replace(/'/g, "\\'")}')" style="
                                        padding: 0.4rem 0.75rem;
                                        border-radius: 20px;
                                        font-size: 0.8rem;
                                        cursor: pointer;
                                        transition: all 0.2s;
                                        border: 1px solid ${isSelected ? this.colors.primary : this.colors.border};
                                        background: ${isSelected ? this.colors.primary + '22' : this.colors.surface};
                                        color: ${isSelected ? this.colors.primary : this.colors.textMuted};
                                    ">
                                        ${isSelected ? '✓ ' : ''}${pessoa}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ` : `
                    <!-- SELETOR DE TIMES -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div style="font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                            👥 Selecionar Times
                            <span style="background: ${this.colors.primary}22; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.8rem;">
                                ${this.selectedEntities.size} selecionado(s)
                            </span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="window.biAnalytics.selectAll()" style="
                                padding: 0.5rem 1rem;
                                border: 1px solid ${this.colors.border};
                                border-radius: 8px;
                                background: transparent;
                                color: ${this.colors.text};
                                cursor: pointer;
                            ">Selecionar Todos</button>
                            <button onclick="window.biAnalytics.clearSelection()" style="
                                padding: 0.5rem 1rem;
                                border: 1px solid ${this.colors.border};
                                border-radius: 8px;
                                background: transparent;
                                color: ${this.colors.text};
                                cursor: pointer;
                            ">Limpar</button>
                            <button onclick="window.biAnalytics.applyFilters()" style="
                                padding: 0.5rem 1rem;
                                border: none;
                                border-radius: 8px;
                                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.accent});
                                color: white;
                                cursor: pointer;
                                font-weight: 600;
                            ">🔍 Aplicar Filtros</button>
                        </div>
                    </div>
                    
                    <!-- Search Box -->
                    <div style="position: relative; margin-bottom: 1rem;">
                        <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: ${this.colors.textMuted};">🔍</span>
                        <input type="text" 
                               placeholder="Buscar time..."
                               onkeyup="window.biAnalytics.filterEntities(this.value)"
                               style="
                                   width: 100%;
                                   padding: 0.75rem 1rem 0.75rem 2.5rem;
                                   background: ${this.colors.dark};
                                   border: 1px solid ${this.colors.border};
                                   border-radius: 8px;
                                   color: ${this.colors.text};
                                   font-size: 0.875rem;
                               ">
                    </div>
                    
                    <!-- Entity Chips (Times) -->
                    <div class="bi-entities-grid" id="entitiesGrid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                        gap: 0.75rem;
                        max-height: 300px;
                        overflow-y: auto;
                        padding: 0.5rem;
                        background: ${this.colors.dark};
                        border-radius: 8px;
                    ">
                        ${this.renderEntityChips()}
                    </div>
                    `}
                </div>
                
                <!-- Content Area -->
                <div id="biContent">
                    ${this.selectedEntities.size > 0 ? this.renderAnalytics() : this.renderEmptyState()}
                </div>
            `}
        `;
        
        // Se é produtividade, carregar entidades e dados automaticamente
        if (this.currentView === 'produtividade') {
            setTimeout(() => this.loadProductivityEntities(), 100);
        }
        
        // Se é CSAT, carregar dados do módulo
        if (this.currentView === 'csat') {
            setTimeout(async () => {
                const container = document.getElementById('biCSATContent');
                if (container && window.BICSATModule) {
                    try {
                        container.innerHTML = await window.BICSATModule.renderCSATSection();
                    } catch (error) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                                <p>Erro ao carregar dados de CSAT</p>
                                <p style="font-size: 0.85rem; color: #a1a1aa;">${error.message}</p>
                            </div>
                        `;
                    }
                }
            }, 100);
        }
        
        // Se é Tempo, carregar dados do módulo
        if (this.currentView === 'tempo') {
            setTimeout(async () => {
                const container = document.getElementById('biTimeContent');
                if (container && window.BICSATModule) {
                    try {
                        container.innerHTML = await window.BICSATModule.renderTimeSection();
                    } catch (error) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                                <p>Erro ao carregar dados de tempo</p>
                                <p style="font-size: 0.85rem; color: #a1a1aa;">${error.message}</p>
                            </div>
                        `;
                    }
                }
            }, 100);
        }
        
        // Se é Acompanhamento, carregar dados do módulo
        if (this.currentView === 'acompanhamento') {
            setTimeout(async () => {
                const container = document.getElementById('biAcompanhamentoContent');
                if (container && window.BIAcompanhamentoModule) {
                    try {
                        await window.BIAcompanhamentoModule.renderAcompanhamentoSection();
                    } catch (error) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                                <p>Erro ao carregar dados de acompanhamento</p>
                                <p style="font-size: 0.85rem; color: #a1a1aa;">${error.message}</p>
                            </div>
                        `;
                    }
                }
            }, 100);
        }
    }
    
    renderEntityChips() {
        let entities;
        
        if (this.currentView === 'pessoa') {
            // Aplicar pré-filtro de time se selecionado
            if (this.pessoasTeamFilter !== 'all' && this.pessoasByTeam[this.pessoasTeamFilter]) {
                entities = Array.from(this.pessoasByTeam[this.pessoasTeamFilter]).sort();
            } else {
                entities = Array.from(this.allPessoas).sort();
            }
        } else {
            entities = Array.from(this.allTimes).sort();
        }
        
        return entities.map(entity => `
            <div class="bi-entity-chip ${this.selectedEntities.has(entity) ? 'selected' : ''}"
                 onclick="window.biAnalytics.toggleEntity('${entity.replace(/'/g, "\\'")}')"
                 title="${entity}">
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${entity}
                </div>
            </div>
        `).join('');
    }
    
    // Definir pré-filtro de time para aba Pessoas
    setTeamPreFilter(team) {
        this.pessoasTeamFilter = team;
        console.log(`👥 Pré-filtro de time definido: ${team}`);
        
        // Re-renderizar apenas a área de seleção
        this.render();
    }
    
    // Definir filtro de time E aplicar automaticamente
    setTeamPreFilterAndApply(team) {
        this.pessoasTeamFilter = team;
        console.log(`👥 Filtro de time: ${team}`);
        
        // Selecionar todas as pessoas do time automaticamente
        this.selectedEntities.clear();
        
        if (team === 'all') {
            // Selecionar todas as pessoas
            this.allPessoas.forEach(p => this.selectedEntities.add(p));
        } else {
            // Selecionar apenas pessoas do time
            const teamPessoas = this.pessoasByTeam[team];
            if (teamPessoas) {
                teamPessoas.forEach(p => this.selectedEntities.add(p));
            }
        }
        
        this.selectedPessoas = new Set(this.selectedEntities);
        console.log(`✅ ${this.selectedEntities.size} pessoas selecionadas`);
        
        // Re-renderizar toda a interface para mostrar os chips
        this.render();
        
        // Aplicar filtros após re-render
        setTimeout(() => {
            if (this.selectedEntities.size > 0) {
                this.applyFilters();
            }
        }, 50);
    }
    
    // Limpar seleção e recarregar
    clearSelectionAndReload() {
        this.pessoasTeamFilter = 'all';
        this.selectedEntities.clear();
        this.selectedPessoas.clear();
        this.render();
    }
    
    // Selecionar todas as pessoas do time atual
    selectTeamPessoas() {
        if (this.pessoasTeamFilter === 'all') return;
        
        const teamPessoas = this.pessoasByTeam[this.pessoasTeamFilter];
        if (!teamPessoas) return;
        
        // Limpar seleção anterior e selecionar todas do time
        this.selectedEntities.clear();
        teamPessoas.forEach(p => this.selectedEntities.add(p));
        this.selectedPessoas = new Set(this.selectedEntities);
        
        console.log(`✅ ${teamPessoas.size} pessoas do time ${this.pessoasTeamFilter} selecionadas`);
        
        // Aplicar filtros automaticamente
        this.applyFilters();
    }
    
    // Toggle seleção de uma pessoa específica
    togglePessoaSelection(pessoa) {
        if (this.selectedEntities.has(pessoa)) {
            this.selectedEntities.delete(pessoa);
            console.log(`➖ ${pessoa} removida da seleção`);
        } else {
            this.selectedEntities.add(pessoa);
            console.log(`➕ ${pessoa} adicionada à seleção`);
        }
        this.selectedPessoas = new Set(this.selectedEntities);
        
        // Re-renderizar para atualizar visualmente os chips
        this.render();
        
        // Aplicar filtros automaticamente após toggle
        setTimeout(() => {
            if (this.selectedEntities.size > 0) {
                this.applyFilters();
            }
        }, 50);
    }
    
    // Selecionar todas as pessoas do time atual (botão "✓ Todas")
    selectAllTeamPessoas() {
        if (this.pessoasTeamFilter === 'all') return;
        
        const teamPessoas = this.pessoasByTeam[this.pessoasTeamFilter];
        if (!teamPessoas) return;
        
        this.selectedEntities.clear();
        teamPessoas.forEach(p => this.selectedEntities.add(p));
        this.selectedPessoas = new Set(this.selectedEntities);
        
        console.log(`✅ ${teamPessoas.size} pessoas selecionadas`);
        
        // Re-renderizar para atualizar visualmente os chips
        this.render();
        
        // Aplicar filtros após re-render
        setTimeout(() => {
            this.applyFilters();
        }, 50);
    }
    
    // Limpar seleção de pessoas do time (botão "✗ Nenhuma")
    clearTeamPessoas() {
        this.selectedEntities.clear();
        this.selectedPessoas.clear();
        console.log(`🗑️ Seleção de pessoas limpa`);
        this.render();
    }
    
    renderEmptyState() {
        return `
            <div style="text-align: center; padding: 3rem; color: ${this.colors.textMuted};">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                <p style="font-size: 1.1rem;">
                    Selecione ${this.currentView === 'pessoa' ? 'pessoas' : 'times'} para visualizar análises
                </p>
            </div>
        `;
    }
    
    renderAnalytics() {
        const metrics = this.calculateMetrics();
        const alerts = this.checkSLAAlerts(metrics);
        
        // Verificar se não há dados
        const totalAssigned = (this.allAssignedTickets || []).length;
        const resolvedInPeriod = (this.resolvedInPeriod || []).length;
        
        let noDataWarning = '';
        if (totalAssigned === 0) {
            // Nenhum ticket com tratativa para as pessoas selecionadas
            noDataWarning = `
                <div style="background: linear-gradient(135deg, #ef444420, #f9731620); border: 1px solid #ef444440; 
                            border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1rem; display: flex; 
                            align-items: center; gap: 1rem;">
                    <span style="font-size: 1.5rem;">⚠️</span>
                    <div style="flex: 1;">
                        <p style="margin: 0; color: #ef4444; font-weight: 600;">Nenhum ticket com tratativa encontrado</p>
                        <p style="margin: 0.25rem 0 0; color: #fca5a5; font-size: 0.85rem;">
                            As ${this.selectedEntities.size} ${this.currentView === 'pessoa' ? 'pessoas selecionadas' : 'times selecionados'} 
                            não possuem tickets com campo <strong>tratativa</strong> preenchido.
                            ${this.pessoasTeamFilter !== 'all' ? '<br>💡 Tente selecionar <strong>"Todos os Times"</strong> no filtro.' : ''}
                        </p>
                    </div>
                </div>
            `;
        } else if (resolvedInPeriod === 0 && this.periodFilter !== 'all') {
            // Tem tickets atribuídos, mas nenhum foi resolvido no período
            noDataWarning = `
                <div style="background: linear-gradient(135deg, #f59e0b20, #eab30820); border: 1px solid #f59e0b40; 
                            border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1rem; display: flex; 
                            align-items: center; gap: 1rem;">
                    <span style="font-size: 1.5rem;">📋</span>
                    <div style="flex: 1;">
                        <p style="margin: 0; color: #f59e0b; font-weight: 600;">Nenhum ticket resolvido neste período</p>
                        <p style="margin: 0.25rem 0 0; color: #fbbf24; font-size: 0.85rem;">
                            As ${this.selectedEntities.size} ${this.currentView === 'pessoa' ? 'pessoas' : 'times'} têm 
                            <strong>${totalAssigned} tickets atribuídos</strong> no total, 
                            mas nenhum foi <strong>resolvido</strong> no período selecionado.
                            <br>💡 Os dados abaixo mostram o histórico completo de atribuições.
                        </p>
                    </div>
                </div>
            `;
        }
        
        return `
            <!-- Aviso de sem dados -->
            ${noDataWarning}
            
            <!-- SLA Alerts -->
            ${this.renderSLAAlerts(alerts)}
            
            <!-- Period Filter & Info Bar -->
            <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <span style="color: #94a3b8; font-size: 0.9rem;">📅 Período:</span>
                    
                    <!-- Atalhos de período -->
                    <div style="display: flex; gap: 0.25rem;">
                        <button onclick="biAnalytics.setPeriodFilter('7')" class="period-btn ${this.periodFilter === '7' ? 'active' : ''}" 
                            style="padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                            background: ${this.periodFilter === '7' ? '#3b82f6' : '#334155'}; 
                            color: ${this.periodFilter === '7' ? 'white' : '#94a3b8'}; border: 1px solid ${this.periodFilter === '7' ? '#3b82f6' : '#475569'};">7d</button>
                        <button onclick="biAnalytics.setPeriodFilter('30')" class="period-btn ${this.periodFilter === '30' ? 'active' : ''}"
                            style="padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                            background: ${this.periodFilter === '30' ? '#3b82f6' : '#334155'}; 
                            color: ${this.periodFilter === '30' ? 'white' : '#94a3b8'}; border: 1px solid ${this.periodFilter === '30' ? '#3b82f6' : '#475569'};">30d</button>
                        <button onclick="biAnalytics.setPeriodFilter('90')" class="period-btn ${this.periodFilter === '90' ? 'active' : ''}"
                            style="padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                            background: ${this.periodFilter === '90' ? '#3b82f6' : '#334155'}; 
                            color: ${this.periodFilter === '90' ? 'white' : '#94a3b8'}; border: 1px solid ${this.periodFilter === '90' ? '#3b82f6' : '#475569'};">90d</button>
                        <button onclick="biAnalytics.setPeriodFilter('365')" class="period-btn ${this.periodFilter === '365' ? 'active' : ''}"
                            style="padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                            background: ${this.periodFilter === '365' ? '#3b82f6' : '#334155'}; 
                            color: ${this.periodFilter === '365' ? 'white' : '#94a3b8'}; border: 1px solid ${this.periodFilter === '365' ? '#3b82f6' : '#475569'};">1 ano</button>
                        <button onclick="biAnalytics.setPeriodFilter('all')" class="period-btn ${this.periodFilter === 'all' ? 'active' : ''}"
                            style="padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                            background: ${this.periodFilter === 'all' ? '#3b82f6' : '#334155'}; 
                            color: ${this.periodFilter === 'all' ? 'white' : '#94a3b8'}; border: 1px solid ${this.periodFilter === 'all' ? '#3b82f6' : '#475569'};">Tudo</button>
                    </div>
                    
                    <!-- Separador -->
                    <span style="color: #475569;">|</span>
                    
                    <!-- Seletor de datas personalizadas -->
                    <div id="biDateRangeContainer" style="display: flex; align-items: center; gap: 0.5rem;">
                        <button id="biDateRangeBtn" onclick="biAnalytics.openDateRangePicker()" 
                            style="padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                            background: ${this.periodFilter === 'custom' ? '#8b5cf6' : '#334155'}; 
                            color: ${this.periodFilter === 'custom' ? 'white' : '#94a3b8'}; border: 1px solid ${this.periodFilter === 'custom' ? '#8b5cf6' : '#475569'};
                            display: flex; align-items: center; gap: 0.5rem;">
                            <span>📅</span>
                            <span id="biDateRangeText">${this.getDateRangeDisplayText()}</span>
                        </button>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <span id="biTrendInfo" style="background: #334155; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; color: #94a3b8;">
                        📈 Tendências: ${this.getTrendBadgeText ? this.getTrendBadgeText() : '30d vs anterior'}
                    </span>
                    <span id="biPeriodInfo" style="background: #1e3a5f; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; color: #60a5fa;">
                        📊 ${this.getPeriodInfoText()}
                    </span>
                </div>
            </div>
            
            <!-- KPIs Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                ${this.renderKPICards(metrics)}
            </div>
            
            <!-- Charts Grid - Visão Geral -->
            <div style="margin: 1.5rem 1rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
                <h3 style="color: #e4e4e7; font-size: 1rem; font-weight: 600; margin: 0;">Visão Geral</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 0 1rem;">
                ${createChartCard('chartTop10', '🏆 Ranking: Volume de Tickets', 300)}
                ${createChartCard('chartResolution', '📊 Taxa de Resolução (%)', 250)}
                ${createChartCard('chartStatus', '📋 Status Agrupado dos Tickets', 280)}
                ${createChartCard('chartPriority', '⚡ Distribuição por Prioridade', 250)}
                ${createChartCard('chartTimeline', '📈 Criados vs Resolvidos (30d)', 250)}
                ${createChartCard('chartSystems', '💻 Volume por Sistema', 250)}
            </div>
            
            <!-- Charts Grid - Performance / SLA -->
            <div style="margin: 1.5rem 1rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <h3 style="color: #e4e4e7; font-size: 1rem; font-weight: 600; margin: 0;">Performance / SLA</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 0 1rem;">
                ${createChartCard('chartSLA', '🎯 SLA 1ª Resposta: Dentro vs Fora', 250)}
                ${createChartCard('chartSLAByEntity', '📊 % SLA Cumprido por ' + (this.currentView === 'pessoa' ? 'Pessoa' : 'Time'), 300)}
                ${createChartCard('chartFirstResponse', '⏱️ Tempo Médio 1ª Resposta', 250)}
            </div>
            
            <!-- Charts Grid - Produtividade -->
            <div style="margin: 1.5rem 1rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                <h3 style="color: #e4e4e7; font-size: 1rem; font-weight: 600; margin: 0;">Produtividade</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 0 1rem;">
                ${createChartCard('chartByDayOfWeek', '📅 Tickets por Dia da Semana', 250)}
                ${createChartCard('chartByHour', '🕐 Tickets por Hora do Dia', 250)}
                ${createChartCard('chartHeatmap', '🔥 Mapa de Calor: Dia vs Hora', 280)}
                ${createChartCard('chartWorkload', '📦 Carga de Trabalho Atual', 280)}
                ${createChartCard('chartStatusStacked', '📋 Status Detalhado (Todos)', 280)}
            </div>
            
            <!-- Charts Grid - Comparativos -->
            <div style="margin: 1.5rem 1rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <h3 style="color: #e4e4e7; font-size: 1rem; font-weight: 600; margin: 0;">Comparativos</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 0 1rem;">
                ${createChartCard('chartComparativoMensal', '📊 Comparativo: Mês Atual vs Anterior', 280)}
                ${createChartCard('chartTendencia', '📈 Tendência das Últimas 4 Semanas', 250)}
            </div>
            
            <!-- Charts Grid - Rankings -->
            <div style="margin: 1.5rem 1rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <h3 style="color: #e4e4e7; font-size: 1rem; font-weight: 600; margin: 0;">Rankings</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 0 1rem;">
                ${createChartCard('chartRankingSLA', '🥇 Ranking: Melhor SLA', 280)}
                ${createChartCard('chartRankingResolucao', '🥈 Ranking: Mais Resoluções', 280)}
                ${createChartCard('chartEficiencia', '⚡ Índice de Eficiência', 280)}
            </div>
            
            <!-- Charts Grid - Pipeline -->
            <div style="margin: 1.5rem 1rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <h3 style="color: #e4e4e7; font-size: 1rem; font-weight: 600; margin: 0;">Pipeline</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1rem; margin-bottom: 2rem; padding: 0 1rem;">
                ${createChartCard('chartAgingHistogram', '⏳ Idade do Backlog (dias parado)', 250)}
                ${createChartCard('chartPipelineFunnel', '🔄 Funil: Tickets em Andamento', 280)}
                ${createChartCard('chartParados', '🚨 Tickets Parados > 7 dias', 250)}
                ${createChartCard('chartAguardando', '⏸️ Aguardando Resposta Cliente', 250)}
                ${createChartCard('chartFinalized', '✅ Total Resolvido + Fechado', 150)}
                <!-- Business Hours Card -->
                <div id="businessHoursCard"></div>
            </div>
            
            <!-- Advanced Metrics -->
            ${this.renderAdvancedMetricsCards ? this.renderAdvancedMetricsCards() : ''}
            
            <!-- Table - Premium -->
            <div class="bi-card" style="background: #1a1a2e; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-top: 2rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    <h3 style="margin: 0; color: #e4e4e7; font-size: 0.95rem; font-weight: 600;">Tabela Detalhada</h3>
                </div>
                <div style="overflow-x: auto;">
                    ${this.renderTable(metrics)}
                </div>
            </div>
        `;
    }
    
    // Continua em bi-analytics-methods.js
}

// NÃO instanciar aqui - será feito após carregar todos os métodos
