// Métodos adicionais de gráficos para BI Analytics

// Verificar se BIAnalytics existe antes de adicionar métodos
if (typeof BIAnalytics === 'undefined') {
    console.error('❌ BIAnalytics não está definido! bi-analytics.js deve ser carregado antes deste arquivo.');
} else {
    console.log('✅ Adicionando métodos de gráficos ao BIAnalytics...');
}

// Usar helper global definido em bi-analytics.js
const setupCanvas = window.setupCanvas;

// Adicionar métodos à classe BIAnalytics
if (typeof BIAnalytics !== 'undefined') {
Object.assign(BIAnalytics.prototype, {
    renderCharts(metrics) {
        console.log('🎨 Renderizando gráficos com métricas:', metrics);
        // guardar para re-render em hover
        this._lastMetrics = metrics;
        
        // Visão Geral
        this.renderTop10Chart(metrics);
        this.renderResolutionChart(metrics);
        this.renderStatusChart(metrics);
        this.renderPriorityChart(metrics);
        this.renderTimelineChart(metrics);
        this.renderSystemsChart(metrics);
        
        // Performance / SLA
        this.renderSLAChart(metrics);
        this.renderSLAByEntityChart(metrics);
        this.renderFirstResponseChart(metrics);
        
        // Produtividade
        this.renderByDayOfWeekChart(metrics);
        this.renderByHourChart(metrics);
        this.renderHeatmapChart(metrics);
        this.renderWorkloadChart(metrics);
        this.renderStatusStackedChart(metrics);
        
        // Comparativos
        this.renderComparativoMensalChart(metrics);
        this.renderTendenciaChart(metrics);
        
        // Rankings
        this.renderRankingSLAChart(metrics);
        this.renderRankingResolucaoChart(metrics);
        this.renderEficienciaChart(metrics);
        
        // Pipeline
        this.renderAgingHistogramChart(metrics);
        this.renderPipelineFunnelChart(metrics);
        this.renderParadosChart(metrics);
        this.renderAguardandoChart(metrics);
        this.renderFinalizedChart(metrics);
        
        // Business Hours Card (via módulo)
        this.renderBusinessHoursCard();
    },
    
    // Renderiza card de Business Hours
    renderBusinessHoursCard() {
        const container = document.getElementById('businessHoursCard');
        if (!container) return;
        
        if (window.BICSATModule && this.filteredData) {
            container.innerHTML = window.BICSATModule.renderBusinessHoursCard(this.filteredData);
        } else {
            container.innerHTML = `
                <div style="
                    background: ${this.colors.surface};
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid ${this.colors.border};
                    text-align: center;
                ">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🏢</div>
                    <div style="color: ${this.colors.textMuted};">Horário Comercial</div>
                    <div style="font-size: 0.8rem; color: ${this.colors.textMuted};">Carregando...</div>
                </div>
            `;
        }
    },
    
    renderStatusChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartStatus');
        if (!canvas) return;
        
        const { ctx, width, height } = setupCanvas(canvas, 280);
        
        // Usar módulo centralizado de status se disponível
        const statusData = {
            'Resolvido': 0,
            'Aberto': 0,
            'Pendente': 0,
            'Aguardando': 0,
            'Em Progresso': 0
        };
        
        this.filteredData.forEach(ticket => {
            if (window.FRESHDESK_STATUS) {
                const cat = window.FRESHDESK_STATUS.getSimplifiedCategory(ticket.status);
                if (statusData[cat] !== undefined) {
                    statusData[cat]++;
                } else {
                    statusData['Em Progresso']++;
                }
            } else {
                if (ticket.status === 4 || ticket.status === 5) {
                    statusData['Resolvido']++;
                } else if (ticket.status === 2) {
                    statusData['Aberto']++;
                } else if (ticket.status === 3 || ticket.status === 17) {
                    statusData['Pendente']++;
                } else if (ticket.status === 7 || ticket.status === 16) {
                    statusData['Aguardando']++;
                } else {
                    statusData['Em Progresso']++;
                }
            }
        });
        
        const total = Object.values(statusData).reduce((a, b) => a + b, 0);
        if (total === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados', width / 2, height / 2);
            return;
        }
        
        // Cores por status
        const colors = {
            'Resolvido': '#10b981',
            'Aberto': '#ef4444',
            'Pendente': '#f59e0b',
            'Aguardando': '#a855f7',
            'Em Progresso': '#3b82f6'
        };
        
        // Mapeamento de categoria para status IDs
        const statusIdMap = {
            'Resolvido': [4, 5],
            'Aberto': [2],
            'Pendente': [3, 17],
            'Aguardando': [7, 16],
            'Em Progresso': [6, 8, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21]
        };
        
        // Ordenar por quantidade (maior primeiro)
        const sortedStatus = Object.entries(statusData)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);
        
        // BARRAS HORIZONTAIS
        const padding = { top: 30, bottom: 20, left: 100, right: 80 };
        const barHeight = 28;
        const barGap = 8;
        const maxValue = Math.max(...sortedStatus.map(([, v]) => v));
        const maxBarWidth = width - padding.left - padding.right;
        const regions = [];
        
        // Título com total
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 13px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`Total: ${total.toLocaleString()} tickets`, padding.left, 18);
        
        sortedStatus.forEach(([status, count], index) => {
            const y = padding.top + index * (barHeight + barGap);
            const barWidth = (count / maxValue) * maxBarWidth;
            const percent = Math.round((count / total) * 100);
            const isHover = hoverIndex === index;
            const color = colors[status];
            
            // Barra
            ctx.save();
            if (isHover) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(padding.left, y, barWidth, barHeight, 4);
            ctx.fill();
            ctx.restore();
            
            // Label (nome do status)
            ctx.fillStyle = this.colors.text;
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(status, padding.left - 10, y + barHeight / 2 + 4);
            
            // Valor e percentual
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(`${count.toLocaleString()} (${percent}%)`, padding.left + barWidth + 8, y + barHeight / 2 + 4);
            
            // Região para tooltip e clique
            regions.push({
                contains: (mx, my) => mx >= padding.left && mx <= padding.left + barWidth && my >= y && my <= y + barHeight,
                data: {
                    label: status,
                    value: count,
                    percent: percent,
                    color: color,
                    index: index,
                    statusIds: statusIdMap[status] || []
                }
            });
        });
        
        // Tooltips + hover + clique
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value.toLocaleString()} (${d.percent}%)</span>
            </div>
            <div style="font-size:0.75rem;color:#a1a1aa;margin-top:4px;">Clique para ver tickets</div>
        `, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderStatusChart(this._lastMetrics, idx);
        }, (hit) => {
            if (hit && hit.data && hit.data.statusIds) {
                const ids = hit.data.statusIds;
                const tickets = (this.createdInPeriod || []).filter(t => ids.includes(Number(t.status)));
                this._showTicketsModal(tickets, 'Status: ' + hit.data.label, hit.data.label);
            }
        });
    },
    
    renderPriorityChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartPriority');
        if (!canvas) return;
        
        const { ctx, width, height } = setupCanvas(canvas, 250);
        
        // Calcular distribuição de prioridade
        const priorityData = {
            'Urgente': 0,
            'Alta': 0,
            'Média': 0,
            'Baixa': 0
        };
        
        this.filteredData.forEach(ticket => {
            const priority = ticket.priority || 1;
            if (priority === 4) priorityData['Urgente']++;
            else if (priority === 3) priorityData['Alta']++;
            else if (priority === 2) priorityData['Média']++;
            else priorityData['Baixa']++;
        });
        
        // Gráfico de barras horizontais
        const padding = { top: 30, bottom: 30, left: 80, right: 30 };
        const chartHeight = height - padding.top - padding.bottom;
        const barHeight = chartHeight / 4 - 10;
        
        const maxValue = Math.max(...Object.values(priorityData));
        const chartWidth = width - padding.left - padding.right;
        
        const colors = {
            'Urgente': '#ef4444',
            'Alta': '#f59e0b',
            'Média': '#3b82f6',
            'Baixa': '#10b981'
        };
        
        const regions = [];
        Object.entries(priorityData).forEach(([priority, count], index) => {
            const y = padding.top + index * (barHeight + 10);
            const barWidth = maxValue > 0 ? (count / maxValue) * chartWidth : 0;
            
            // Barra
            const gradient = ctx.createLinearGradient(padding.left, 0, padding.left + barWidth, 0);
            gradient.addColorStop(0, colors[priority]);
            gradient.addColorStop(1, colors[priority] + '80');
            
            const isHover = index === hoverIndex;
            ctx.save();
            if (isHover) { ctx.shadowColor = colors[priority]; ctx.shadowBlur = 14; }
            ctx.fillStyle = gradient;
            const h = isHover ? barHeight + 6 : barHeight;
            const yTop = isHover ? y - 3 : y;
            ctx.fillRect(padding.left, yTop, barWidth, h);
            if (isHover) {
                ctx.strokeStyle = '#ffffffaa';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(padding.left, yTop, barWidth, h);
            }
            ctx.restore();

            // Região para tooltip
            regions.push({
                contains: (mx, my) => mx >= padding.left && mx <= padding.left + barWidth && my >= y && my <= y + barHeight,
                data: { label: priority, value: count, color: colors[priority] }
            });
            
            // Label
            ctx.fillStyle = this.colors.text;
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(priority, padding.left - 10, y + barHeight / 2 + 4);
            
            // Valor
            if (count > 0) {
                ctx.fillStyle = this.colors.text;
                ctx.font = 'bold 12px system-ui';
                ctx.textAlign = 'left';
                ctx.fillText(count.toString(), padding.left + barWidth + 10, y + barHeight / 2 + 4);
            }
        });
        // Mapeamento de label para priority ID
        const prioIdMap = { 'Urgente': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value}</span>
            </div>
            <div style="font-size:0.75rem;color:#a1a1aa;margin-top:4px;">Clique para ver tickets</div>
        `, (hit) => {
            const idx = hit ? regions.indexOf(hit) : null;
            if (this._lastMetrics) this.renderPriorityChart(this._lastMetrics, idx);
        }, (hit) => {
            if (hit && hit.data && hit.data.label) {
                const prioId = prioIdMap[hit.data.label];
                const tickets = (this.createdInPeriod || []).filter(t => t.priority === prioId);
                this._showTicketsModal(tickets, 'Prioridade: ' + hit.data.label, hit.data.label);
            }
        });
    },
    
    renderTimelineChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartTimeline');
        if (!canvas) return;
        
        const { ctx, width, height } = setupCanvas(canvas, 250);
        
        // Agrupar por data de criação (created) e resolução (resolved)
        const createdByDate = {};
        const resolvedByDate = {};
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.filteredData.forEach(ticket => {
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
        if (sortedDates.length === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados dos últimos 30 dias', width / 2, height / 2);
            return;
        }
        
        const padding = { top: 30, bottom: 40, left: 50, right: 30 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...sortedDates.map(d => Math.max(createdByDate[d] || 0, resolvedByDate[d] || 0)), 1);
        const pointGap = chartWidth / (sortedDates.length - 1 || 1);
        
        // Desenhar grid
        ctx.strokeStyle = this.colors.border + '30';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i * chartHeight / 4);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            
            // Labels Y
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '10px system-ui';
            ctx.textAlign = 'right';
            const value = Math.round(maxValue - (i * maxValue / 4));
            ctx.fillText(value.toString(), padding.left - 10, y + 4);
        }
        // Guia vertical quando em hover (fora do loop)
        if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < sortedDates.length) {
            const hx = padding.left + hoverIndex * pointGap;
            ctx.save();
            ctx.strokeStyle = this.colors.border;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(hx, padding.top);
            ctx.lineTo(hx, height - padding.bottom);
            ctx.stroke();
            ctx.restore();
        }
        
        // Desenhar linha de Criados
        ctx.beginPath();
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        sortedDates.forEach((date, index) => {
            const x = padding.left + index * pointGap;
            const y = padding.top + chartHeight - ((createdByDate[date] || 0) / maxValue) * chartHeight;
            if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // Desenhar linha de Resolvidos
        ctx.beginPath();
        ctx.strokeStyle = this.colors.secondary;
        ctx.lineWidth = 2;
        sortedDates.forEach((date, index) => {
            const x = padding.left + index * pointGap;
            const y = padding.top + chartHeight - ((resolvedByDate[date] || 0) / maxValue) * chartHeight;
            if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Desenhar pontos e registrar regiões
        const regions = [];
        sortedDates.forEach((date, index) => {
            const x = padding.left + index * pointGap;
            const yC = padding.top + chartHeight - ((createdByDate[date] || 0) / maxValue) * chartHeight;
            const yR = padding.top + chartHeight - ((resolvedByDate[date] || 0) / maxValue) * chartHeight;

            // pontos
            const isHover = index === hoverIndex;
            const drawPoint = (x, y, color, big) => {
                ctx.beginPath();
                if (big) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 16; }
                ctx.arc(x, y, big ? 7 : 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                if (big) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
            };
            drawPoint(x, yC, this.colors.primary, isHover);
            drawPoint(x, yR, this.colors.secondary, isHover);

            // Região por banda vertical
            const half = Math.max(6, pointGap / 2);
            regions.push({
                contains: (mx, my) => mx >= x - half && mx <= x + half && my >= padding.top && my <= height - padding.bottom,
                data: {
                    label: date,
                    created: createdByDate[date] || 0,
                    resolved: resolvedByDate[date] || 0,
                    index
                }
            });
            
            // Label de data (mostrar apenas alguns)
            if (index % Math.ceil(sortedDates.length / 5) === 0) {
                ctx.save();
                ctx.translate(x, height - padding.bottom + 15);
                ctx.rotate(-45 * Math.PI / 180);
                ctx.fillStyle = this.colors.textMuted;
                ctx.font = '10px system-ui';
                ctx.textAlign = 'right';
                const dateObj = new Date(date);
                ctx.fillText(`${dateObj.getDate()}/${dateObj.getMonth() + 1}`, 0, 0);
                ctx.restore();
            }
        });
        // Ativar tooltip + re-render com hoverIndex
        this.setupCanvasTooltip(canvas, regions, (d) => {
            const dt = new Date(d.label);
            const dd = String(dt.getDate()).padStart(2,'0');
            const mm = String(dt.getMonth()+1).padStart(2,'0');
            const yy = String(dt.getFullYear()).slice(2);
            return `
              <div style="display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong>${dd}/${mm}/${yy}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${this.colors.primary};"></span>
                  Criados: <strong>${d.created}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${this.colors.secondary};"></span>
                  Resolvidos: <strong>${d.resolved}</strong>
                </div>
              </div>
            `;
        }, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderTimelineChart(this._lastMetrics, idx);
        });
    },

    // Sistemas - Barras
    renderSystemsChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartSystems');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);

        // Lista de sistemas válidos
        const sistemasValidos = new Set([
            'YUV', 'Telemetria', 'BI', 'SING', 'OPTZ', 'Light', 'Técnica', 
            'Suporte', 'Outros', 'E-trip', 'E-clock', 'App Motorista', 
            'SING/OPTZ', 'API', 'Portal', 'Videotelemetria'
        ]);
        
        // Agregar por sistema (extraindo de custom_fields.cf_teste)
        const counts = new Map();
        this.filteredData.forEach(t => {
            let sistema = null;
            
            // Tentar extrair de custom_fields (pode ser string JSON ou objeto)
            if (t.custom_fields) {
                let cf = t.custom_fields;
                if (typeof cf === 'string') {
                    try { cf = JSON.parse(cf); } catch(e) {}
                }
                if (cf && typeof cf === 'object') {
                    sistema = cf.cf_teste || cf.cf_sistema || null;
                }
            }
            
            // Fallback para campos diretos
            if (!sistema) sistema = t.cf_teste || t.cf_sistema || null;
            
            // Normalizar e validar
            if (sistema) {
                sistema = String(sistema).trim();
                if (sistemasValidos.has(sistema)) {
                    counts.set(sistema, (counts.get(sistema) || 0) + 1);
                } else {
                    counts.set('Outros', (counts.get('Outros') || 0) + 1);
                }
            }
        });
        let items = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10);
        if (items.length === 0) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign='center';
            ctx.fillText('Sem dados', width/2, height/2); return;
        }

        const padding = { top: 24, right: 24, bottom: 24, left: 140 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const gap = 6; const barHeight = Math.max(10, (chartHeight - gap*(items.length-1)) / items.length);
        const maxVal = Math.max(...items.map(i=>i[1]));

        const regions = [];
        items.forEach(([label, value], index) => {
            const y = padding.top + index * (barHeight + gap);
            const w = maxVal>0 ? (value/maxVal)*chartWidth : 0;
            const grad = ctx.createLinearGradient(padding.left,0,padding.left+w,0);
            const g = this.gradients[index % this.gradients.length];
            grad.addColorStop(0,g[0]); grad.addColorStop(1,g[1]);
            const isHover = index === hoverIndex;
            ctx.save(); if (isHover) { ctx.shadowColor=g[1]; ctx.shadowBlur=14; }
            ctx.fillStyle = grad;
            const yy = isHover ? y-3 : y; const hh = isHover ? barHeight+6 : barHeight;
            ctx.fillRect(padding.left, yy, w, hh);
            if (isHover) { ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth=1.2; ctx.strokeRect(padding.left, yy, w, hh); }
            ctx.restore();

            // labels
            ctx.fillStyle = this.colors.text; ctx.font = '12px system-ui'; ctx.textAlign='right';
            const disp = label.length>20 ? label.slice(0,20)+'..' : label;
            ctx.fillText(disp, padding.left-10, y + barHeight/2 + 4);
            if (value>0) { ctx.textAlign='left'; ctx.fillText(String(value), padding.left + w + 8, y + barHeight/2 + 4); }

            regions.push({
                contains: (mx,my)=> mx>=padding.left && mx<=padding.left+w && my>=y && my<=y+barHeight,
                data: { label, value, color: g[0], index }
            });
        });

        this.setupCanvasTooltip(canvas, regions, (d)=>`
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value}</span>
              <span style="font-size:0.7rem; opacity:0.6;">🔍 clique</span>
            </div>
        `, (hit)=>{
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderSystemsChart(this._lastMetrics, idx);
        }, (hit)=>{
            // Drill-down ao clicar
            if (hit && hit.data.label) {
                this.showDrillDown('system', hit.data.label, `Sistema: ${hit.data.label}`);
            }
        });
    },
    
    renderSLAChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartSLA');
        if (!canvas) return;
        
        const { ctx, width, height } = setupCanvas(canvas, 250);
        
        // Calcular SLA
        let withinSLA = 0;
        let outsideSLA = 0;
        let considered = 0;
        const SLA_LIMIT = 4 * 60 * 60 * 1000; // 4 horas em ms
        
        this.filteredData.forEach(ticket => {
            // Ignorar tipos definidos para SLA
            const typeNorm = (ticket.type || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
            if (this.ignoreTypesForSLA && this.ignoreTypesForSLA.has(typeNorm)) {
                return;
            }
            const first = ticket.stats_first_responded_at || ticket.stats_first_response_at;
            if (first && ticket.created_at) {
                considered++;
                const responseTime = new Date(first) - new Date(ticket.created_at);
                if (responseTime <= SLA_LIMIT) withinSLA++; else outsideSLA++;
            }
        });
        const total = withinSLA + outsideSLA;
        if (total === 0) {
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            const msg = considered === 0 ? 'Sem dados de 1ª resposta no filtro' : 'Sem dados de SLA';
            ctx.fillText(msg, width / 2, height / 2);
            return;
        }
        const slaPercentage = Math.round((withinSLA / total) * 100);
        
        const centerX = width / 2;
        const centerY = height / 2 + 20;
        const radius = Math.min(width, height) / 3;
        
        // Arco de fundo
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 20;
        ctx.stroke();
        
        // Arco de progresso
        const angle = Math.PI + (slaPercentage / 100) * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, angle);
        
        // Cor baseada no desempenho
        if (slaPercentage >= 90) {
            ctx.strokeStyle = this.colors.secondary;
        } else if (slaPercentage >= 70) {
            ctx.strokeStyle = this.colors.accent;
        } else {
            ctx.strokeStyle = this.colors.danger;
        }
        ctx.lineWidth = hoverIndex === 0 ? 26 : 20; // destacar 'dentro' quando hoverIndex=0
        if (hoverIndex === 0) { ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 18; }
        ctx.stroke();
        
        // Texto central
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 32px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${slaPercentage}%`, centerX, centerY);
        
        ctx.font = '12px system-ui';
        ctx.fillStyle = this.colors.textMuted;
        ctx.fillText('Dentro do SLA', centerX, centerY + 25);
        
        // Legenda
        ctx.font = '11px system-ui';
        ctx.fillText(`✓ ${withinSLA} no prazo`, centerX - 60, centerY + 60);
        ctx.fillText(`✗ ${outsideSLA} atrasados`, centerX + 60, centerY + 60);
        
        // Badge "Considerados"
        ctx.font = '10px system-ui';
        ctx.fillStyle = this.colors.textMuted;
        ctx.fillText(`Considerados: ${considered}`, centerX, centerY + 80);

        // Tooltips para o gauge (dentro x fora)
        const innerRadius = radius - 26; // considerar espessura no destaque
        const regions = [];
        const startGauge = Math.PI;
        const endGauge = 2 * Math.PI;
        const progressEnd = startGauge + (slaPercentage / 100) * Math.PI;
        const mkArcRegion = (startA, endA, label, value, color, idx) => ({
            contains: (mx, my) => {
                const dx = mx - centerX; const dy = my - centerY; const r = Math.sqrt(dx*dx + dy*dy);
                if (r < innerRadius || r > radius) return false;
                let ang = Math.atan2(dy, dx); if (ang < 0) ang += Math.PI * 2;
                let s = startA; let e = endA; if (s < 0) s += Math.PI * 2; if (e < 0) e += Math.PI * 2; if (e < s) e += Math.PI * 2; if (ang < s) ang += Math.PI * 2;
                return ang >= s && ang <= e;
            },
            data: { label, value, percent: label === 'Dentro do SLA' ? slaPercentage : 100 - slaPercentage, color, index: idx }
        });
        regions.push(mkArcRegion(startGauge, progressEnd, 'Dentro do SLA', withinSLA, this.colors.secondary, 0));
        regions.push(mkArcRegion(progressEnd, endGauge, 'Fora do SLA', outsideSLA, this.colors.danger, 1));
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color};"></span>
              <strong>${d.label}</strong>
              <span style="opacity:.8;">${d.value} (${d.percent}%)</span>
            </div>
        `, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderSLAChart(this._lastMetrics, idx);
        });
    },
    
    // Linha de tendência diária de SLA% (30 dias)
    renderSLATrendChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartSLATrend');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        
        const SLA_LIMIT = 4 * 60 * 60 * 1000;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30*24*60*60*1000);
        
        // Agregar por dia
        const byDate = {};
        this.filteredData.forEach(ticket => {
            const typeNorm = (ticket.type || '').toString().toLowerCase().replace(/\s+/g,' ').trim();
            if (this.ignoreTypesForSLA && this.ignoreTypesForSLA.has(typeNorm)) return;
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
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Sem dados de SLA nos últimos 30 dias', width/2, height/2); return;
        }
        
        // Calcular % por dia
        const dataPoints = sortedDates.map(d => {
            const t = byDate[d].within + byDate[d].outside;
            return { date: d, percent: t > 0 ? Math.round((byDate[d].within / t) * 100) : 0, within: byDate[d].within, outside: byDate[d].outside };
        });
        
        const padding = { top: 30, bottom: 40, left: 50, right: 30 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const pointGap = chartWidth / (dataPoints.length - 1 || 1);
        
        // Grid
        ctx.strokeStyle = this.colors.border + '30'; ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i * chartHeight / 4);
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(width - padding.right, y); ctx.stroke();
            ctx.fillStyle = this.colors.textMuted; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
            ctx.fillText((100 - i*25) + '%', padding.left - 10, y + 4);
        }
        // Linha meta 80%
        const metaY = padding.top + chartHeight - (80/100)*chartHeight;
        ctx.save(); ctx.strokeStyle = this.colors.accent; ctx.setLineDash([6,4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padding.left, metaY); ctx.lineTo(width - padding.right, metaY); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = this.colors.accent; ctx.font = '9px system-ui'; ctx.textAlign = 'left';
        ctx.fillText('Meta 80%', width - padding.right + 4, metaY + 3);
        
        // Guia vertical hover
        if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < dataPoints.length) {
            const hx = padding.left + hoverIndex * pointGap;
            ctx.save(); ctx.strokeStyle = this.colors.border; ctx.setLineDash([4,4]);
            ctx.beginPath(); ctx.moveTo(hx, padding.top); ctx.lineTo(hx, height - padding.bottom); ctx.stroke(); ctx.restore();
        }
        
        // Linha
        ctx.beginPath(); ctx.strokeStyle = this.colors.primary; ctx.lineWidth = 2;
        dataPoints.forEach((pt, i) => {
            const x = padding.left + i * pointGap;
            const y = padding.top + chartHeight - (pt.percent / 100) * chartHeight;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Pontos e regiões
        const regions = [];
        dataPoints.forEach((pt, i) => {
            const x = padding.left + i * pointGap;
            const y = padding.top + chartHeight - (pt.percent / 100) * chartHeight;
            const isHover = i === hoverIndex;
            ctx.beginPath();
            if (isHover) { ctx.save(); ctx.shadowColor = this.colors.primary; ctx.shadowBlur = 14; }
            ctx.arc(x, y, isHover ? 7 : 3, 0, Math.PI*2);
            ctx.fillStyle = pt.percent >= 80 ? this.colors.secondary : pt.percent >= 60 ? this.colors.accent : this.colors.danger;
            ctx.fill();
            if (isHover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
            const half = Math.max(6, pointGap/2);
            regions.push({ contains: (mx,my) => mx >= x-half && mx <= x+half && my >= padding.top && my <= height-padding.bottom, data: { date: pt.date, percent: pt.percent, within: pt.within, outside: pt.outside, index: i } });
        });
        // Labels X
        dataPoints.forEach((pt, i) => {
            if (i % Math.ceil(dataPoints.length/5) === 0) {
                const x = padding.left + i * pointGap;
                ctx.save(); ctx.translate(x, height - padding.bottom + 15); ctx.rotate(-45*Math.PI/180);
                ctx.fillStyle = this.colors.textMuted; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
                const dt = new Date(pt.date); ctx.fillText(`${dt.getDate()}/${dt.getMonth()+1}`, 0, 0); ctx.restore();
            }
        });
        this.setupCanvasTooltip(canvas, regions, (d) => {
            const dt = new Date(d.date);
            return `<div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()}</strong>
                <div>SLA: <strong style="color:${d.percent>=80?this.colors.secondary:d.percent>=60?this.colors.accent:this.colors.danger}">${d.percent}%</strong></div>
                <div>✓ ${d.within} no prazo</div>
                <div>✗ ${d.outside} atrasados</div>
            </div>`;
        }, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderSLATrendChart(this._lastMetrics, idx);
        });
    },
    
    // Barras SLA por Time/Pessoa (com paginação)
    renderSLAByEntityChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartSLAByEntity');
        if (!canvas) return;
        
        const SLA_LIMIT = 4 * 60 * 60 * 1000;
        const entityField = this.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
        
        // Agregar por entidade
        const byEntity = new Map();
        this.filteredData.forEach(ticket => {
            const typeNorm = (ticket.type || '').toString().toLowerCase().replace(/\s+/g,' ').trim();
            if (this.ignoreTypesForSLA && this.ignoreTypesForSLA.has(typeNorm)) return;
            const first = ticket.stats_first_responded_at || ticket.stats_first_response_at;
            if (!first || !ticket.created_at) return;
            const entities = ticket[entityField] ? ticket[entityField].split(/[,;\/]/).map(e=>e.trim()).filter(e=>e&&this.selectedEntities.has(e)) : [];
            const rt = new Date(first) - new Date(ticket.created_at);
            entities.forEach(ent => {
                if (!byEntity.has(ent)) byEntity.set(ent, { within: 0, outside: 0, times: [] });
                const d = byEntity.get(ent);
                d.times.push(rt);
                if (rt <= SLA_LIMIT) d.within++; else d.outside++;
            });
        });
        
        const allItems = Array.from(byEntity.entries()).map(([label, d]) => {
            const total = d.within + d.outside;
            const percent = total > 0 ? Math.round((d.within/total)*100) : 0;
            const avgH = d.times.length > 0 ? Math.round(d.times.reduce((a,b)=>a+b,0)/d.times.length/(1000*60*60)*10)/10 : 0;
            return { label, percent, avgH, within: d.within, outside: d.outside };
        }).sort((a,b) => b.percent - a.percent);
        
        // Altura e setup
        const { ctx, width, height } = setupCanvas(canvas, 300);
        
        if (allItems.length === 0) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Sem dados de SLA para entidades selecionadas', width/2, height/2); return;
        }
        
        // Paginação
        const perPage = this.pagination.slaByEntity.perPage;
        const totalPages = Math.ceil(allItems.length / perPage);
        const currentPage = Math.min(this.pagination.slaByEntity.page, totalPages - 1);
        this.pagination.slaByEntity.page = currentPage;
        const startIdx = currentPage * perPage;
        const items = allItems.slice(startIdx, startIdx + perPage);
        
        const padding = { top: 24, right: 60, bottom: 40, left: 120 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom - 20;
        const barHeight = 20;
        const gap = 4;
        
        // Linha meta 80%
        const metaX = padding.left + (80/100)*chartWidth;
        ctx.save(); ctx.strokeStyle = this.colors.accent; ctx.setLineDash([6,4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(metaX, padding.top); ctx.lineTo(metaX, padding.top + chartHeight); ctx.stroke(); ctx.restore();
        
        const regions = [];
        items.forEach((item, index) => {
            const globalIndex = startIdx + index;
            const y = padding.top + index * (barHeight + gap);
            const w = (item.percent / 100) * chartWidth;
            const color = item.percent >= 80 ? this.colors.secondary : item.percent >= 60 ? this.colors.accent : this.colors.danger;
            const isHover = index === hoverIndex;
            ctx.save();
            if (isHover) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
            ctx.fillStyle = color;
            const yy = isHover ? y - 3 : y; const hh = isHover ? barHeight + 6 : barHeight;
            ctx.fillRect(padding.left, yy, w, hh);
            if (isHover) { ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1.2; ctx.strokeRect(padding.left, yy, w, hh); }
            ctx.restore();
            
            // Labels
            ctx.fillStyle = this.colors.text; ctx.font = '12px system-ui'; ctx.textAlign = 'right';
            const disp = item.label.length > 14 ? item.label.slice(0,14)+'..' : item.label;
            ctx.fillText(`${globalIndex + 1}. ${disp}`, padding.left - 8, y + barHeight/2 + 4);
            ctx.textAlign = 'left';
            ctx.fillText(`${item.percent}%`, padding.left + w + 6, y + barHeight/2 + 4);
            
            regions.push({ contains: (mx,my) => mx >= padding.left && mx <= padding.left + w && my >= y && my <= y + barHeight, data: { ...item, index, globalIndex } });
        });
        
        // Controles de paginação
        if (totalPages > 1) {
            const btnY = height - 12;
            ctx.font = '12px system-ui';
            
            // Botão Anterior (esquerda)
            const btnPrevX = 20;
            ctx.fillStyle = currentPage > 0 ? this.colors.primary : this.colors.border;
            ctx.textAlign = 'left';
            ctx.fillText('◀', btnPrevX, btnY);
            
            // Info central compacta
            ctx.fillStyle = this.colors.textMuted;
            ctx.textAlign = 'center';
            ctx.fillText(`${currentPage + 1} / ${totalPages}`, width / 2, btnY);
            
            // Botão Próximo (direita)
            const btnNextX = width - 20;
            ctx.fillStyle = currentPage < totalPages - 1 ? this.colors.primary : this.colors.border;
            ctx.textAlign = 'right';
            ctx.fillText('▶', btnNextX, btnY);
            
            regions.push({
                contains: (mx, my) => mx >= btnPrevX - 10 && mx <= btnPrevX + 20 && my >= btnY - 12 && my <= btnY + 6,
                data: { action: 'prevPage', chart: 'slaByEntity' }
            });
            regions.push({
                contains: (mx, my) => mx >= btnNextX - 20 && mx <= btnNextX + 10 && my >= btnY - 12 && my <= btnY + 6,
                data: { action: 'nextPage', chart: 'slaByEntity' }
            });
        }
        
        this.setupCanvasTooltip(canvas, regions, (d) => {
            if (d.action) return null;
            return `<div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.label}</strong>
                <div>SLA: <strong style="color:${d.percent>=80?this.colors.secondary:d.percent>=60?this.colors.accent:this.colors.danger}">${d.percent}%</strong></div>
                <div>Tempo médio: ${d.avgH}h</div>
                <div>✓ ${d.within} no prazo | ✗ ${d.outside} atrasados</div>
            </div>`;
        }, (hit) => {
            // Apenas hover para barras (não para botões)
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderSLAByEntityChart(this._lastMetrics, idx);
        }, (hit) => {
            // Clique para paginação
            if (hit && hit.data.action) {
                if (hit.data.action === 'prevPage' && this.pagination.slaByEntity.page > 0) {
                    this.pagination.slaByEntity.page--;
                    this.renderSLAByEntityChart(this._lastMetrics);
                } else if (hit.data.action === 'nextPage' && this.pagination.slaByEntity.page < totalPages - 1) {
                    this.pagination.slaByEntity.page++;
                    this.renderSLAByEntityChart(this._lastMetrics);
                }
            }
        });
    },
    
    // Status Horizontal Bar Chart
    renderStatusStackedChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartStatusStacked');
        if (!canvas) return;
        
        const counts = metrics.statusCounts || {};
        const items = Object.entries(counts)
            .map(([s, c]) => ({
                status: parseInt(s), 
                label: this.getStatusLabel(s), 
                count: c, 
                color: this.getStatusColor(s)
            }))
            .filter(i => i.count > 0)
            .sort((a,b) => b.count - a.count);
        
        // Altura dinâmica baseada no número de itens
        const barHeight = 24;
        const gap = 8;
        const dynamicHeight = Math.max(200, items.length * (barHeight + gap) + 40);
        
        const { ctx, width, height } = setupCanvas(canvas, dynamicHeight);
        canvas.style.height = height + 'px';
        
        if (items.length === 0) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Sem dados de status', width/2, height/2); return;
        }
        
        const total = items.reduce((a,b) => a + b.count, 0);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const padding = { top: 15, bottom: 15, left: 100, right: 70 };
        const chartWidth = width - padding.left - padding.right;
        
        const regions = [];
        items.forEach((item, index) => {
            const y = padding.top + index * (barHeight + gap);
            const barW = (item.count / maxCount) * chartWidth;
            const rawPercent = (item.count/total)*100;
            const percent = rawPercent < 1 && rawPercent > 0 ? rawPercent.toFixed(1) : Math.round(rawPercent);
            const isHover = index === hoverIndex;
            
            // Barra
            ctx.save();
            if (isHover) { ctx.shadowColor = item.color; ctx.shadowBlur = 12; }
            ctx.fillStyle = item.color;
            const yy = isHover ? y - 2 : y;
            const hh = isHover ? barHeight + 4 : barHeight;
            ctx.fillRect(padding.left, yy, barW, hh);
            if (isHover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(padding.left, yy, barW, hh); }
            ctx.restore();
            
            // Label à esquerda
            ctx.fillStyle = this.colors.text; 
            ctx.font = '12px system-ui'; 
            ctx.textAlign = 'right';
            ctx.fillText(item.label, padding.left - 10, y + barHeight/2 + 4);
            
            // Valor e % à direita
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 11px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(`${item.count} (${percent}%)`, padding.left + barW + 8, y + barHeight/2 + 4);
            
            regions.push({ 
                contains: (mx,my) => mx >= padding.left && mx <= padding.left + barW && my >= y && my <= y + barHeight, 
                data: { ...item, percent, index } 
            });
        });
        
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${d.color};"></span>
                    <strong>${d.label}</strong>
                </div>
                <div>${d.count} tickets (${d.percent}% do total)</div>
            </div>
        `, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderStatusStackedChart(this._lastMetrics, idx);
        });
    },
    
    // Histograma de Idade do Backlog
    renderAgingHistogramChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartAgingHistogram');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        
        const buckets = metrics.agingBuckets || { '0-2d': 0, '3-7d': 0, '8-14d': 0, '15-30d': 0, '>30d': 0 };
        const bucketColors = {
            '0-2d': '#10b981', '3-7d': '#3b82f6', '8-14d': '#f59e0b', '15-30d': '#f97316', '>30d': '#ef4444'
        };
        const items = Object.entries(buckets).map(([label, count]) => ({ label, count, color: bucketColors[label] || this.colors.primary }));
        const total = items.reduce((a,b) => a + b.count, 0);
        
        if (total === 0) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Sem backlog para analisar', width/2, height/2); return;
        }
        
        const padding = { top: 40, bottom: 50, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const barWidth = chartWidth / items.length - 20;
        const gap = 20;
        const maxCount = Math.max(...items.map(i => i.count), 1);
        
        // Grid
        ctx.strokeStyle = this.colors.border + '30'; ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i * chartHeight / 4);
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(width - padding.right, y); ctx.stroke();
            ctx.fillStyle = this.colors.textMuted; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxCount - i*maxCount/4).toString(), padding.left - 8, y + 4);
        }
        
        // Barras
        const regions = [];
        items.forEach((item, i) => {
            const x = padding.left + i * (barWidth + gap) + gap/2;
            const h = (item.count / maxCount) * chartHeight;
            const y = padding.top + chartHeight - h;
            const isHover = i === hoverIndex;
            
            ctx.save();
            if (isHover) { ctx.shadowColor = item.color; ctx.shadowBlur = 14; }
            ctx.fillStyle = item.color;
            const xx = isHover ? x - 3 : x;
            const ww = isHover ? barWidth + 6 : barWidth;
            ctx.fillRect(xx, y, ww, h);
            if (isHover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(xx, y, ww, h); }
            ctx.restore();
            
            // Valor acima
            if (h > 20) {
                ctx.fillStyle = this.colors.text; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
                ctx.fillText(item.count.toString(), x + barWidth/2, y - 8);
            }
            
            // Label X
            ctx.fillStyle = this.colors.textMuted; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth/2, height - padding.bottom + 20);
            
            regions.push({ contains: (mx,my) => mx >= x && mx <= x + barWidth && my >= y && my <= y + h, data: { ...item, percent: Math.round((item.count/total)*100), index: i } });
        });
        
        // Título
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Idade do Backlog (dias)', width/2, 20);
        
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.label}</strong>
                <div>${d.count} tickets (${d.percent}%)</div>
                <div style="font-size:0.7rem;color:#a1a1aa;">Clique para ver tickets</div>
            </div>
        `, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderAgingHistogramChart(this._lastMetrics, idx);
        }, (hit) => {
            if (hit && hit.data && hit.data.label) {
                this.showStaleTickets(hit.data.label.replace(' dias', ''));
            }
        });
    },
    
    // Pipeline de Tickets ATIVOS (funil)
    renderPipelineFunnelChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartPipelineFunnel');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 220);
        
        // Apenas tickets ATIVOS (em andamento)
        const stages = [
            { label: 'Aberto', status: 2, color: '#ef4444' },
            { label: 'Em Progresso', status: 7, color: '#3b82f6' },
            { label: 'Aguardando', status: 6, color: '#8b5cf6' },
            { label: 'Pendente', status: 3, color: '#f59e0b' }
        ];
        
        const counts = metrics.statusCounts || {};
        const items = stages.map(s => ({ ...s, count: counts[s.status] || 0 })).filter(s => s.count > 0);
        const totalAtivos = items.reduce((a,b) => a + b.count, 0);
        
        if (items.length === 0) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Nenhum ticket ativo', width/2, height/2); return;
        }
        
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const padding = { top: 15, bottom: 15, left: 110, right: 60 };
        const chartWidth = width - padding.left - padding.right;
        const stageHeight = Math.min(45, (height - padding.top - padding.bottom) / items.length);
        
        const regions = [];
        items.forEach((item, i) => {
            const y = padding.top + i * stageHeight;
            const barWidth = (item.count / maxCount) * chartWidth;
            const isHover = i === hoverIndex;
            
            // Barra horizontal
            ctx.save();
            if (isHover) { ctx.shadowColor = item.color; ctx.shadowBlur = 12; }
            ctx.fillStyle = item.color;
            const hh = stageHeight - 6;
            const yy = isHover ? y - 2 : y;
            const hhh = isHover ? hh + 4 : hh;
            ctx.fillRect(padding.left, yy, barWidth, hhh);
            if (isHover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(padding.left, yy, barWidth, hhh); }
            ctx.restore();
            
            // Label esquerda
            ctx.fillStyle = this.colors.text; ctx.font = '12px system-ui'; ctx.textAlign = 'right';
            ctx.fillText(item.label, padding.left - 10, y + hh/2 + 4);
            
            // Valor à direita
            ctx.fillStyle = this.colors.text; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left';
            ctx.fillText(`${item.count} (${Math.round((item.count/totalAtivos)*100)}%)`, padding.left + barWidth + 8, y + hh/2 + 4);
            
            regions.push({
                contains: (mx, my) => mx >= padding.left && mx <= padding.left + barWidth && my >= y && my <= y + hh,
                data: { ...item, percent: Math.round((item.count/totalAtivos)*100), index: i }
            });
        });
        
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${d.color};"></span>
                    <strong>${d.label}</strong>
                </div>
                <div>${d.count} tickets (${d.percent}% dos ativos)</div>
                <div style="font-size:0.7rem;color:#a1a1aa;">Clique para ver tickets</div>
            </div>
        `, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderPipelineFunnelChart(this._lastMetrics, idx);
        }, (hit) => {
            if (hit && hit.data && hit.data.status !== undefined) {
                const tickets = (this.createdInPeriod || []).filter(t => Number(t.status) === hit.data.status);
                this._showTicketsModal(tickets, hit.data.label, hit.data.label);
            }
        });
    },
    
    // Tickets FINALIZADOS (Resolvido + Fechado)
    renderFinalizedChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartFinalized');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 150);
        
        const counts = metrics.statusCounts || {};
        const resolvido = counts[4] || 0;
        const fechado = counts[5] || 0;
        const total = resolvido + fechado;
        
        if (total === 0) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Nenhum ticket finalizado', width/2, height/2); return;
        }
        
        const padding = { top: 20, bottom: 20, left: 20, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const barHeight = 40;
        const centerY = height / 2;
        
        // Barra empilhada horizontal
        const resolvidoWidth = (resolvido / total) * chartWidth;
        const fechadoWidth = (fechado / total) * chartWidth;
        
        const regions = [];
        
        // Resolvido (esquerda)
        const isHoverResolvido = hoverIndex === 0;
        ctx.save();
        if (isHoverResolvido) { ctx.shadowColor = '#10b981'; ctx.shadowBlur = 12; }
        ctx.fillStyle = '#10b981';
        ctx.fillRect(padding.left, centerY - barHeight/2, resolvidoWidth, barHeight);
        ctx.restore();
        
        // Fechado (direita)
        const isHoverFechado = hoverIndex === 1;
        ctx.save();
        if (isHoverFechado) { ctx.shadowColor = '#059669'; ctx.shadowBlur = 12; }
        ctx.fillStyle = '#059669';
        ctx.fillRect(padding.left + resolvidoWidth, centerY - barHeight/2, fechadoWidth, barHeight);
        ctx.restore();
        
        // Labels dentro das barras
        ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        if (resolvidoWidth > 60) {
            ctx.fillText(`Resolvido: ${resolvido}`, padding.left + resolvidoWidth/2, centerY + 4);
        }
        if (fechadoWidth > 60) {
            ctx.fillText(`Fechado: ${fechado}`, padding.left + resolvidoWidth + fechadoWidth/2, centerY + 4);
        }
        
        // Total acima
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`Total Finalizados: ${total.toLocaleString()}`, width/2, padding.top);
        
        // Legenda abaixo
        ctx.font = '11px system-ui';
        const legendY = height - 15;
        ctx.fillStyle = '#10b981'; ctx.fillRect(width/2 - 100, legendY - 8, 10, 10);
        ctx.fillStyle = this.colors.text; ctx.textAlign = 'left';
        ctx.fillText(`Resolvido ${Math.round((resolvido/total)*100)}%`, width/2 - 85, legendY);
        
        ctx.fillStyle = '#059669'; ctx.fillRect(width/2 + 20, legendY - 8, 10, 10);
        ctx.fillStyle = this.colors.text;
        ctx.fillText(`Fechado ${Math.round((fechado/total)*100)}%`, width/2 + 35, legendY);
        
        regions.push({
            contains: (mx, my) => mx >= padding.left && mx <= padding.left + resolvidoWidth && my >= centerY - barHeight/2 && my <= centerY + barHeight/2,
            data: { label: 'Resolvido', count: resolvido, color: '#10b981', percent: Math.round((resolvido/total)*100), index: 0 }
        });
        regions.push({
            contains: (mx, my) => mx >= padding.left + resolvidoWidth && mx <= padding.left + resolvidoWidth + fechadoWidth && my >= centerY - barHeight/2 && my <= centerY + barHeight/2,
            data: { label: 'Fechado', count: fechado, color: '#059669', percent: Math.round((fechado/total)*100), index: 1 }
        });
        
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${d.color};"></span>
                    <strong>${d.label}</strong>
                </div>
                <div>${d.count.toLocaleString()} tickets (${d.percent}%)</div>
                <div style="font-size:0.7rem;color:#a1a1aa;">Clique para ver tickets</div>
            </div>
        `, (hit) => {
            const idx = hit ? hit.data.index : null;
            if (this._lastMetrics) this.renderFinalizedChart(this._lastMetrics, idx);
        }, (hit) => {
            if (hit && hit.data && hit.data.label) {
                const statusId = hit.data.label === 'Resolvido' ? 4 : 5;
                const tickets = (this.createdInPeriod || []).filter(t => Number(t.status) === statusId);
                this._showTicketsModal(tickets, hit.data.label, hit.data.label);
            }
        });
    },
    
    // ========== NOVOS GRÁFICOS ==========
    
    renderFirstResponseChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartFirstResponse');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        const ticketsWithFR = this.filteredData.filter(t => t.stats_first_responded_at && t.created_at);
        if (!ticketsWithFR.length) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Sem dados de First Response', width/2, height/2); return;
        }
        const faixas = [
            { label: '< 1h', min: 0, max: 1, color: '#10b981', count: 0 },
            { label: '1-4h', min: 1, max: 4, color: '#3b82f6', count: 0 },
            { label: '4-8h', min: 4, max: 8, color: '#f59e0b', count: 0 },
            { label: '8-24h', min: 8, max: 24, color: '#f97316', count: 0 },
            { label: '> 24h', min: 24, max: Infinity, color: '#ef4444', count: 0 }
        ];
        let totalHours = 0;
        ticketsWithFR.forEach(t => {
            const hours = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            if (hours > 0) { totalHours += hours; const f = faixas.find(fx => hours >= fx.min && hours < fx.max); if (f) f.count++; }
        });
        const avgHours = totalHours / ticketsWithFR.length;
        const items = faixas.filter(f => f.count > 0);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const total = items.reduce((s, i) => s + i.count, 0);
        const pad = { left: 50, right: 30, top: 45, bottom: 35 };
        const gap = 8;
        const barW = (width - pad.left - pad.right - gap * (items.length - 1)) / items.length;
        const chartH = height - pad.top - pad.bottom;
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`Média: ${avgHours.toFixed(1)}h`, width / 2, 22);
        const regions = [];
        items.forEach((item, i) => {
            const x = pad.left + i * (barW + gap);
            const barH = (item.count / maxCount) * chartH;
            const y = height - pad.bottom - barH;
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = item.color; ctx.shadowBlur = 12; }
            ctx.fillStyle = item.color;
            ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 4); ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(item.count.toString(), x + barW / 2, y - 5);
            ctx.font = '9px system-ui'; ctx.fillText(item.label, x + barW / 2, height - 12);
            regions.push({ contains: (mx, my) => mx >= x && mx <= x + barW && my >= y && my <= y + barH, data: { label: item.label, count: item.count, color: item.color, percent: Math.round((item.count/total)*100), index: i } });
        });
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${d.color};"></span>
                    <strong>${d.label}</strong>
                </div>
                <div>${d.count.toLocaleString()} tickets (${d.percent}%)</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderFirstResponseChart(this._lastMetrics, hit ? hit.data.index : null); });
    },
    
    async renderCSATChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartCSAT');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        
        // Tentar buscar dados do Supabase primeiro
        let ratings = [];
        let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let avg = 0;
        let total = 0;
        
        // Mostrar loading
        ctx.fillStyle = this.colors.textMuted; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('Carregando...', width/2, height/2);
        
        try {
            // Tentar buscar do Supabase via BICSATModule
            if (window.BICSATModule) {
                const csatData = await window.BICSATModule.loadCSATData();
                if (csatData && csatData.ratings && csatData.ratings.length > 0) {
                    ratings = csatData.ratings.map(r => r.ratings?.default || r.rating || 0).filter(r => r > 0);
                    total = csatData.totalRatings || ratings.length;
                    avg = csatData.csatPercent ? (csatData.csatPercent / 20) : (ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0);
                    
                    // Calcular distribuição
                    ratings.forEach(r => {
                        const score = Math.round(r);
                        if (distribution[score] !== undefined) distribution[score]++;
                    });
                }
            }
        } catch (e) {
            console.log('⚠️ CSAT Supabase fallback para dados locais:', e.message);
        }
        
        // Fallback para dados locais se Supabase não retornou
        if (ratings.length === 0) {
            ratings = this.filteredData.filter(t => t.satisfaction_rating).map(t => {
                const sr = t.satisfaction_rating;
                return typeof sr === 'object' ? sr.score : (typeof sr === 'number' ? sr : null);
            }).filter(r => r !== null && r > 0);
            
            if (ratings.length > 0) {
                avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                ratings.forEach(r => { if (distribution[r] !== undefined) distribution[r]++; });
                total = ratings.length;
            }
        }
        
        // Limpar canvas para re-renderizar
        ctx.clearRect(0, 0, width, height);
        
        if (!ratings.length && total === 0) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('Sem dados de satisfação', width/2, height/2); 
            ctx.font = '11px system-ui';
            ctx.fillText('Sincronize os dados do Freshdesk', width/2, height/2 + 20);
            return;
        }
        
        const cx = width / 2, cy = height / 2, r = Math.min(width, height) / 2 - 35;
        const color = avg >= 4 ? '#10b981' : avg >= 3 ? '#f59e0b' : '#ef4444';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (avg / 5) * Math.PI * 2);
        ctx.strokeStyle = color; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.stroke();
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 28px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`${avg.toFixed(1)}`, cx, cy + 8);
        ctx.font = '11px system-ui'; ctx.fillStyle = this.colors.textMuted;
        ctx.fillText(`${total} avaliações`, cx, cy + 30);
        const regions = [{ contains: (mx, my) => Math.sqrt((mx-cx)**2 + (my-cy)**2) <= r, data: { avg, total, distribution, color } }];
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong>CSAT: ${d.avg.toFixed(2)}</strong>
                <div>${d.total} avaliações</div>
                <div style="font-size:11px;color:#94a3b8;">⭐5: ${d.distribution[5]} | ⭐4: ${d.distribution[4]} | ⭐3: ${d.distribution[3]} | ⭐2: ${d.distribution[2]} | ⭐1: ${d.distribution[1]}</div>
            </div>
        `);
    },
    
    renderByDayOfWeekChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartByDayOfWeek');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const diasShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        this.filteredData.forEach(t => {
            const d = new Date(t.created_at);
            if (!isNaN(d.getTime())) counts[d.getDay()]++;
        });
        const maxVal = Math.max(...counts, 1);
        const total = counts.reduce((s, c) => s + c, 0);
        const pad = { left: 40, right: 20, top: 30, bottom: 35 };
        const barW = (width - pad.left - pad.right - 6 * 6) / 7;
        const chartH = height - pad.top - pad.bottom;
        const regions = [];
        counts.forEach((count, i) => {
            const x = pad.left + i * (barW + 6);
            const barH = (count / maxVal) * chartH;
            const y = height - pad.bottom - barH;
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = this.colors.primary; ctx.shadowBlur = 12; }
            ctx.fillStyle = this.colors.primary;
            ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 4); ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(count.toString(), x + barW / 2, y - 5);
            ctx.font = '9px system-ui'; ctx.fillText(diasShort[i], x + barW / 2, height - 12);
            regions.push({ contains: (mx, my) => mx >= x && mx <= x + barW && my >= y && my <= y + barH, data: { label: dias[i], count, color: this.colors.primary, percent: Math.round((count/total)*100), index: i } });
        });
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.label}</strong>
                <div>${d.count.toLocaleString()} tickets (${d.percent}%)</div>
                <div style="font-size:0.7rem;color:#a1a1aa;">Clique para ver tickets</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderByDayOfWeekChart(this._lastMetrics, hit ? hit.data.index : null); },
        (hit) => {
            if (hit && hit.data && hit.data.index !== undefined) {
                const dayIdx = hit.data.index;
                const tickets = (this.createdInPeriod || []).filter(t => {
                    const d = new Date(t.created_at);
                    return !isNaN(d.getTime()) && d.getDay() === dayIdx;
                });
                this._showTicketsModal(tickets, 'Dia: ' + hit.data.label, hit.data.label);
            }
        });
    },
    
    renderByHourChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartByHour');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        const counts = new Array(24).fill(0);
        this.filteredData.forEach(t => {
            const d = new Date(t.created_at);
            if (!isNaN(d.getTime())) counts[d.getHours()]++;
        });
        const maxVal = Math.max(...counts, 1);
        const total = counts.reduce((s, c) => s + c, 0);
        const pad = { left: 35, right: 15, top: 25, bottom: 30 };
        const barW = (width - pad.left - pad.right) / 24 - 1;
        const chartH = height - pad.top - pad.bottom;
        const regions = [];
        counts.forEach((count, i) => {
            const x = pad.left + i * (barW + 1);
            const barH = Math.max(2, (count / maxVal) * chartH);
            const y = height - pad.bottom - barH;
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = this.colors.primary; ctx.shadowBlur = 8; }
            ctx.fillStyle = this.colors.primary; ctx.fillRect(x, y, barW, barH);
            ctx.restore();
            regions.push({ contains: (mx, my) => mx >= x && mx <= x + barW && my >= pad.top && my <= height - pad.bottom, data: { label: `${i}:00 - ${i}:59`, count, percent: Math.round((count/total)*100), index: i } });
        });
        for (let h = 0; h < 24; h += 4) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '8px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(`${h}h`, pad.left + h * (barW + 1) + barW / 2, height - 10);
        }
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.label}</strong>
                <div>${d.count.toLocaleString()} tickets (${d.percent}%)</div>
                <div style="font-size:0.7rem;color:#a1a1aa;">Clique para ver tickets</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderByHourChart(this._lastMetrics, hit ? hit.data.index : null); },
        (hit) => {
            if (hit && hit.data && hit.data.index !== undefined) {
                const hourIdx = hit.data.index;
                const tickets = (this.createdInPeriod || []).filter(t => {
                    const d = new Date(t.created_at);
                    return !isNaN(d.getTime()) && d.getHours() === hourIdx;
                });
                this._showTicketsModal(tickets, 'Hora: ' + hit.data.label, hit.data.label);
            }
        });
    },
    
    renderHeatmapChart(metrics, hoverKey = null) {
        const canvas = document.getElementById('chartHeatmap');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 280);
        const heatmap = {};
        for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) heatmap[`${d}-${h}`] = 0;
        this.filteredData.forEach(t => {
            const date = new Date(t.created_at);
            if (!isNaN(date.getTime())) heatmap[`${date.getDay()}-${date.getHours()}`]++;
        });
        const maxVal = Math.max(...Object.values(heatmap), 1);
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const diasShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const pad = { left: 35, right: 10, top: 20, bottom: 10 };
        const cellW = (width - pad.left - pad.right) / 24;
        const cellH = (height - pad.top - pad.bottom) / 7;
        const regions = [];
        for (let d = 0; d < 7; d++) {
            ctx.fillStyle = this.colors.textMuted; ctx.font = '9px system-ui'; ctx.textAlign = 'right';
            ctx.fillText(diasShort[d], pad.left - 4, pad.top + d * cellH + cellH / 2 + 3);
            for (let hr = 0; hr < 24; hr++) {
                const key = `${d}-${hr}`;
                const val = heatmap[key];
                const intensity = val / maxVal;
                const x = pad.left + hr * cellW + 1, y = pad.top + d * cellH + 1, w = cellW - 2, h = cellH - 2;
                const isHover = hoverKey === key;
                ctx.save();
                if (isHover) { ctx.shadowColor = '#667eea'; ctx.shadowBlur = 10; }
                ctx.fillStyle = `rgba(102, 126, 234, ${0.1 + intensity * 0.9})`;
                ctx.fillRect(x, y, w, h);
                ctx.restore();
                regions.push({ contains: (mx, my) => mx >= x && mx <= x + w && my >= y && my <= y + h, data: { dia: dias[d], hora: `${hr}:00`, count: val, key } });
            }
        }
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.dia} às ${d.hora}</strong>
                <div>${d.count.toLocaleString()} tickets</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderHeatmapChart(this._lastMetrics, hit ? hit.data.key : null); });
    },
    
    renderWorkloadChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartWorkload');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 280);
        const statusMap = { 2: 'open', 3: 'pending', 6: 'pending', 7: 'pending', 8: 'open', 10: 'open', 11: 'open', 12: 'pending', 13: 'pending', 14: 'pending', 15: 'open', 16: 'pending', 17: 'pending', 18: 'open' };
        const openTickets = this.filteredData.filter(t => {
            const g = statusMap[t.status];
            return g === 'open' || g === 'pending';
        });
        const workload = {};
        const treatField = this.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
        openTickets.forEach(t => {
            const p = t.custom_fields?.[treatField] || t[treatField];
            if (p) String(p).split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(x => workload[x] = (workload[x] || 0) + 1);
        });
        const sorted = Object.entries(workload).sort((a, b) => b[1] - a[1]).slice(0, 6);
        if (!sorted.length) { ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Sem tickets em aberto', width/2, height/2); return; }
        const maxVal = sorted[0][1];
        const total = sorted.reduce((s, [, c]) => s + c, 0);
        const pad = { left: 100, right: 40, top: 20 };
        const barH = 24; const gap = 6;
        const regions = [];
        sorted.forEach(([name, count], i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (count / maxVal) * (width - pad.left - pad.right));
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 12; }
            const grad = ctx.createLinearGradient(pad.left, 0, pad.left + bw, 0);
            grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#ef4444');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 4); ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
            ctx.fillText(name.length > 18 ? name.slice(0, 16) + '..' : name, pad.left - 6, y + barH / 2 + 4);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
            ctx.fillText(count.toString(), pad.left + bw + 6, y + barH / 2 + 4);
            regions.push({ contains: (mx, my) => mx >= pad.left && mx <= pad.left + bw && my >= y && my <= y + barH, data: { name, count, percent: Math.round((count/total)*100), index: i } });
        });
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.name}</strong>
                <div>${d.count.toLocaleString()} tickets em aberto (${d.percent}%)</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderWorkloadChart(this._lastMetrics, hit ? hit.data.index : null); });
    },
    
    renderComparativoMensalChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartComparativoMensal');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 280);
        
        // Determinar período com base no filtro
        let period1Start, period1End, period2Start, period2End;
        let period1Label, period2Label, period1FullLabel, period2FullLabel;
        
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
            // Período personalizado: dividir ao meio
            const start = new Date(this.customDateRange.start);
            const end = new Date(this.customDateRange.end);
            const diffMs = end - start;
            const midDate = new Date(start.getTime() + diffMs / 2);
            
            period1Start = start;
            period1End = new Date(midDate.getTime() - 1);
            period2Start = midDate;
            period2End = end;
            
            const formatShort = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
            period1Label = formatShort(period1Start);
            period2Label = formatShort(period2Start);
            period1FullLabel = `${formatShort(period1Start)} - ${formatShort(period1End)}`;
            period2FullLabel = `${formatShort(period2Start)} - ${formatShort(period2End)}`;
        } else if (this.periodFilter !== 'all') {
            // Período pré-definido: comparar com período anterior igual
            const days = parseInt(this.periodFilter) || 30;
            const now = new Date();
            
            period2End = new Date(now);
            period2Start = new Date(now);
            period2Start.setDate(period2Start.getDate() - days);
            
            period1End = new Date(period2Start);
            period1End.setDate(period1End.getDate() - 1);
            period1Start = new Date(period1End);
            period1Start.setDate(period1Start.getDate() - days + 1);
            
            period1Label = `Anterior`;
            period2Label = `Atual`;
            period1FullLabel = `Período Anterior (${days}d)`;
            period2FullLabel = `Período Atual (${days}d)`;
        } else {
            // Sem filtro: comparar mês atual com anterior
            const now = new Date();
            const thisMonth = now.getMonth(), lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
            const thisYear = now.getFullYear(), lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
            
            period1Start = new Date(lastMonthYear, lastMonth, 1);
            period1End = new Date(thisYear, thisMonth, 0);
            period2Start = new Date(thisYear, thisMonth, 1);
            period2End = now;
            
            period1Label = monthsShort[lastMonth];
            period2Label = monthsShort[thisMonth];
            period1FullLabel = months[lastMonth];
            period2FullLabel = months[thisMonth];
        }
        
        // Contar tickets em cada período
        let period1Count = 0, period2Count = 0;
        this.filteredData.forEach(t => {
            const d = new Date(t.created_at);
            if (d >= period1Start && d <= period1End) period1Count++;
            else if (d >= period2Start && d <= period2End) period2Count++;
        });
        
        const items = [
            { label: period1Label, fullLabel: period1FullLabel, value: period1Count, color: '#64748b' }, 
            { label: period2Label, fullLabel: period2FullLabel, value: period2Count, color: '#667eea' }
        ];
        
        const maxVal = Math.max(...items.map(i => i.value), 1);
        const pad = { left: 60, right: 60, top: 50, bottom: 50 };
        const barW = (width - pad.left - pad.right - 40) / 2;
        const chartH = height - pad.top - pad.bottom;
        
        const diff = period1Count > 0 ? ((period2Count - period1Count) / period1Count * 100) : (period2Count > 0 ? 100 : 0);
        ctx.fillStyle = diff >= 0 ? '#10b981' : '#ef4444'; 
        ctx.font = 'bold 14px system-ui'; 
        ctx.textAlign = 'center';
        ctx.fillText(`${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, width / 2, 28);
        
        const regions = [];
        items.forEach((item, i) => {
            const x = pad.left + i * (barW + 40);
            const barH = (item.value / maxVal) * chartH;
            const y = height - pad.bottom - barH;
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = item.color; ctx.shadowBlur = 12; }
            ctx.fillStyle = item.color; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 6); ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(item.value.toString(), x + barW / 2, y - 8);
            ctx.font = '13px system-ui'; ctx.fillText(item.label, x + barW / 2, height - 22);
            regions.push({ contains: (mx, my) => mx >= x && mx <= x + barW && my >= y && my <= y + barH, data: { ...item, index: i } });
        });
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.fullLabel}</strong>
                <div>${d.value.toLocaleString()} tickets</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderComparativoMensalChart(this._lastMetrics, hit ? hit.data.index : null); });
    },
    
    renderTendenciaChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartTendencia');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        
        // Determinar período com base no filtro
        let periodStart, periodEnd;
        
        if (this.periodFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
            periodStart = new Date(this.customDateRange.start);
            periodEnd = new Date(this.customDateRange.end);
        } else if (this.periodFilter !== 'all') {
            const days = parseInt(this.periodFilter) || 30;
            periodEnd = new Date();
            periodStart = new Date();
            periodStart.setDate(periodStart.getDate() - days);
        } else {
            // Sem filtro: últimas 4 semanas
            periodEnd = new Date();
            periodStart = new Date();
            periodStart.setDate(periodStart.getDate() - 28);
        }
        
        // Calcular número de semanas no período
        const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        const numWeeks = Math.min(Math.max(Math.ceil(totalDays / 7), 2), 8); // 2-8 semanas
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
                label: totalDays <= 14 ? `${start.getDate()}/${start.getMonth()+1}` : `Sem ${i + 1}` 
            });
        }
        
        // Contar tickets em cada semana
        this.filteredData.forEach(t => { 
            const d = new Date(t.created_at); 
            weeks.forEach(w => { 
                if (d >= w.start && d <= w.end) w.count++; 
            }); 
        });
        
        const maxVal = Math.max(...weeks.map(w => w.count), 1);
        const pad = { left: 40, right: 20, top: 25, bottom: 40 };
        const chartW = width - pad.left - pad.right, chartH = height - pad.top - pad.bottom;
        const stepX = weeks.length > 1 ? chartW / (weeks.length - 1) : chartW / 2;
        
        // Desenhar linha
        ctx.strokeStyle = '#667eea'; ctx.lineWidth = 3; ctx.beginPath();
        weeks.forEach((wk, i) => {
            const x = pad.left + i * stepX, y = pad.top + chartH - (wk.count / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Desenhar pontos e labels
        const regions = [];
        weeks.forEach((wk, i) => {
            const x = pad.left + i * stepX, y = pad.top + chartH - (wk.count / maxVal) * chartH;
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = '#667eea'; ctx.shadowBlur = 12; }
            ctx.beginPath(); ctx.arc(x, y, isHover ? 8 : 6, 0, Math.PI * 2); ctx.fillStyle = '#667eea'; ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(wk.count.toString(), x, y - 12);
            ctx.font = '10px system-ui'; ctx.fillStyle = this.colors.textMuted;
            ctx.fillText(wk.label, x, height - 15);
            regions.push({ contains: (mx, my) => Math.sqrt((mx - x) ** 2 + (my - y) ** 2) <= 15, data: { ...wk, index: i } });
        });
        
        this.setupCanvasTooltip(canvas, regions, (d) => {
            const startStr = `${d.start.getDate()}/${d.start.getMonth() + 1}`;
            const endStr = `${d.end.getDate()}/${d.end.getMonth() + 1}`;
            return `<div style="display:flex;flex-direction:column;gap:4px;">
                <strong>${d.label}</strong>
                <div>${startStr} a ${endStr}</div>
                <div>${d.count.toLocaleString()} tickets</div>
            </div>`;
        }, (hit) => { if (this._lastMetrics) this.renderTendenciaChart(this._lastMetrics, hit ? hit.data.index : null); });
    },
    
    renderRankingSLAChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartRankingSLA');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 280);
        const SLA_LIMIT = 4 * 60 * 60 * 1000;
        const personSLA = {};
        const treatField = this.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
        this.filteredData.forEach(t => {
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
        const allSorted = Object.entries(personSLA).filter(([, v]) => v.total >= 5).map(([name, v]) => ({ name, rate: (v.within / v.total) * 100, total: v.total, within: v.within })).sort((a, b) => b.rate - a.rate);
        if (!allSorted.length) { ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Dados insuficientes', width/2, height/2); return; }
        
        // Paginação
        const pageSize = 5;
        const totalPages = Math.ceil(allSorted.length / pageSize);
        this._rankingSLAPage = this._rankingSLAPage || 0;
        if (this._rankingSLAPage >= totalPages) this._rankingSLAPage = 0;
        const start = this._rankingSLAPage * pageSize;
        const sorted = allSorted.slice(start, start + pageSize);
        
        this.renderRankingBarsInternal(ctx, width, height, sorted, '%', canvas, hoverIndex, 'SLA', (idx) => this.renderRankingSLAChart(this._lastMetrics, idx), this._rankingSLAPage, totalPages, allSorted.length, start,
            () => { this._rankingSLAPage = Math.max(0, this._rankingSLAPage - 1); this.renderRankingSLAChart(metrics); },
            () => { this._rankingSLAPage = Math.min(totalPages - 1, this._rankingSLAPage + 1); this.renderRankingSLAChart(metrics); }
        );
    },
    
    renderRankingResolucaoChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartRankingResolucao');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 280);
        const personRes = {};
        const treatField = this.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
        this.filteredData.forEach(t => {
            const p = t.custom_fields?.[treatField] || t[treatField];
            if (!p) return;
            const resolved = [4, 5].includes(Number(t.status));
            String(p).split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => {
                if (!personRes[name]) personRes[name] = { resolved: 0, total: 0 };
                personRes[name].total++;
                if (resolved) personRes[name].resolved++;
            });
        });
        const allSorted = Object.entries(personRes).filter(([, v]) => v.total >= 5).map(([name, v]) => ({ name, rate: (v.resolved / v.total) * 100, total: v.total })).sort((a, b) => b.rate - a.rate);
        if (!allSorted.length) { ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Dados insuficientes', width/2, height/2); return; }
        
        // Paginação
        const pageSize = 5;
        const totalPages = Math.ceil(allSorted.length / pageSize);
        this._rankingResPage = this._rankingResPage || 0;
        if (this._rankingResPage >= totalPages) this._rankingResPage = 0;
        const start = this._rankingResPage * pageSize;
        const sorted = allSorted.slice(start, start + pageSize);
        
        this.renderRankingBarsInternal(ctx, width, height, sorted, '%', canvas, hoverIndex, 'resolução', (idx) => this.renderRankingResolucaoChart(this._lastMetrics, idx), this._rankingResPage, totalPages, allSorted.length, start,
            () => { this._rankingResPage = Math.max(0, this._rankingResPage - 1); this.renderRankingResolucaoChart(metrics); },
            () => { this._rankingResPage = Math.min(totalPages - 1, this._rankingResPage + 1); this.renderRankingResolucaoChart(metrics); }
        );
    },
    
    renderEficienciaChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartEficiencia');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 280);
        
        // Usar resolvedInPeriod (tickets resolvidos no período selecionado)
        const resolvedData = this.resolvedInPeriod || [];
        
        // Calcular dias do período para média correta
        const periodDays = this.periodFilter === 'all' ? 365 : parseInt(this.periodFilter) || 30;
        
        const personEff = {};
        const treatField = this.currentView === 'pessoa' ? 'cf_tratativa' : 'cf_grupo_tratativa';
        
        resolvedData.forEach(t => {
            // Acessar campo diretamente (não nested em custom_fields)
            const p = t[treatField] || t.custom_fields?.[treatField];
            if (!p) return;
            String(p).split(/[,;\/]/).map(x => x.trim()).filter(x => x).forEach(name => { 
                personEff[name] = (personEff[name] || 0) + 1; 
            });
        });
        
        // Calcular taxa por dia e ordenar
        const allSorted = Object.entries(personEff)
            .map(([name, count]) => ({ name, rate: count / periodDays, total: count }))
            .sort((a, b) => b.total - a.total);
        
        if (!allSorted.length) { 
            ctx.fillStyle = this.colors.textMuted; 
            ctx.font = '14px system-ui'; 
            ctx.textAlign = 'center'; 
            ctx.fillText('Sem dados de resolução no período', width/2, height/2); 
            return; 
        }
        
        // Paginação
        const pageSize = 5;
        const totalPages = Math.ceil(allSorted.length / pageSize);
        this._rankingEffPage = this._rankingEffPage || 0;
        if (this._rankingEffPage >= totalPages) this._rankingEffPage = 0;
        const start = this._rankingEffPage * pageSize;
        const sorted = allSorted.slice(start, start + pageSize);
        
        this.renderRankingBarsInternal(ctx, width, height, sorted, '/dia', canvas, hoverIndex, 'eficiência', (idx) => this.renderEficienciaChart(this._lastMetrics, idx), this._rankingEffPage, totalPages, allSorted.length, start,
            () => { this._rankingEffPage = Math.max(0, this._rankingEffPage - 1); this.renderEficienciaChart(metrics); },
            () => { this._rankingEffPage = Math.min(totalPages - 1, this._rankingEffPage + 1); this.renderEficienciaChart(metrics); }
        );
    },
    
    renderRankingBarsInternal(ctx, width, height, items, suffix, canvas, hoverIndex, type, onHover, page = 0, totalPages = 1, totalItems = 0, startIndex = 0, onPrev = null, onNext = null) {
        const maxVal = Math.max(...items.map(i => i.rate), 1);
        const hasPagination = totalPages > 1;
        const pad = { left: 100, right: 50, top: hasPagination ? 35 : 20 };
        const barH = 26, gap = 8;
        const colors = ['#fbbf24', '#94a3b8', '#cd7f32', '#667eea', '#667eea'];
        const regions = [];
        
        // Controles de paginação se houver mais de uma página
        if (hasPagination) {
            const btnW = 24, btnH = 20;
            const paginationY = 8;
            
            // Botão anterior ◄
            const prevX = width / 2 - 60;
            ctx.fillStyle = page > 0 ? '#3b82f6' : '#4a5568';
            ctx.beginPath(); ctx.roundRect(prevX, paginationY, btnW, btnH, 4); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('◄', prevX + btnW/2, paginationY + 14);
            
            // Info da página
            ctx.fillStyle = this.colors.text; ctx.font = '11px system-ui';
            ctx.fillText(`${page + 1}/${totalPages}`, width / 2, paginationY + 14);
            
            // Botão próximo ►
            const nextX = width / 2 + 36;
            ctx.fillStyle = page < totalPages - 1 ? '#3b82f6' : '#4a5568';
            ctx.beginPath(); ctx.roundRect(nextX, paginationY, btnW, btnH, 4); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
            ctx.fillText('►', nextX + btnW/2, paginationY + 14);
            
            // Registrar regiões de clique para os botões
            if (page > 0 && onPrev) {
                regions.push({ contains: (mx, my) => mx >= prevX && mx <= prevX + btnW && my >= paginationY && my <= paginationY + btnH, data: { isPrev: true }, onClick: onPrev });
            }
            if (page < totalPages - 1 && onNext) {
                regions.push({ contains: (mx, my) => mx >= nextX && mx <= nextX + btnW && my >= paginationY && my <= paginationY + btnH, data: { isNext: true }, onClick: onNext });
            }
        }
        
        items.forEach((item, i) => {
            const globalIndex = startIndex + i;
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (item.rate / maxVal) * (width - pad.left - pad.right));
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = colors[i] || '#667eea'; ctx.shadowBlur = 12; }
            ctx.fillStyle = colors[i] || '#667eea';
            ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 4); ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
            // Mostrar posição no ranking global
            const displayName = `${globalIndex + 1}. ${item.name.length > 12 ? item.name.slice(0, 10) + '..' : item.name}`;
            ctx.fillText(displayName, pad.left - 6, y + barH / 2 + 4);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
            ctx.fillText(`${item.rate.toFixed(1)}${suffix}`, pad.left + bw + 6, y + barH / 2 + 4);
            regions.push({ contains: (mx, my) => mx >= pad.left && mx <= pad.left + bw && my >= y && my <= y + barH, data: { ...item, suffix, index: i } });
        });
        
        if (canvas) {
            // Remover handlers antigos
            const oldClickHandler = canvas._rankingClickHandler;
            if (oldClickHandler) canvas.removeEventListener('click', oldClickHandler);
            
            // Novo handler de clique para paginação
            const clickHandler = (e) => {
                const rect = canvas.getBoundingClientRect();
                const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
                const my = (e.clientY - rect.top) * (canvas.height / rect.height);
                for (const r of regions) {
                    if (r.onClick && r.contains(mx, my)) {
                        r.onClick();
                        return;
                    }
                }
            };
            canvas.addEventListener('click', clickHandler);
            canvas._rankingClickHandler = clickHandler;
            
            if (onHover) {
                this.setupCanvasTooltip(canvas, regions.filter(r => !r.onClick), (d) => `
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <strong>${d.name}</strong>
                        <div>${d.rate.toFixed(1)}${d.suffix}</div>
                        <div style="font-size:11px;color:#94a3b8;">${d.total} tickets analisados</div>
                    </div>
                `, (hit) => { if (this._lastMetrics) onHover(hit ? hit.data.index : null); });
            }
        }
    },
    
    renderParadosChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartParados');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        const now = new Date();
        const statusMap = { 2: 'open', 3: 'pending', 6: 'pending', 7: 'pending', 8: 'open', 10: 'open', 11: 'open', 12: 'pending', 13: 'pending', 14: 'pending', 15: 'open', 16: 'pending', 17: 'pending', 18: 'open' };
        const staleTickets = this.filteredData.filter(t => {
            const g = statusMap[t.status];
            if (!g || g === 'resolved' || g === 'closed') return false;
            const lastUpdate = new Date(t.updated_at || t.created_at);
            return (now - lastUpdate) / (1000 * 60 * 60 * 24) >= 3;
        });
        const faixas = [
            { label: '3-7 dias', min: 3, max: 7, color: '#f59e0b', count: 0 },
            { label: '7-15 dias', min: 7, max: 15, color: '#f97316', count: 0 },
            { label: '15-30 dias', min: 15, max: 30, color: '#ef4444', count: 0 },
            { label: '> 30 dias', min: 30, max: Infinity, color: '#dc2626', count: 0 }
        ];
        staleTickets.forEach(t => {
            const days = (now - new Date(t.updated_at || t.created_at)) / (1000 * 60 * 60 * 24);
            const f = faixas.find(fx => days >= fx.min && days < fx.max);
            if (f) f.count++;
        });
        const items = faixas.filter(f => f.count > 0);
        if (!items.length) { ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Nenhum ticket parado', width/2, height/2); return; }
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`Total parados: ${staleTickets.length}`, width / 2, 20);
        const total = items.reduce((s, i) => s + i.count, 0);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const pad = { left: 80, right: 40, top: 40, bottom: 20 };
        const barH = 26, gap = 8;
        const regions = [];
        items.forEach((item, i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (item.count / maxCount) * (width - pad.left - pad.right));
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = item.color; ctx.shadowBlur = 12; }
            ctx.fillStyle = item.color; ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 4); ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
            ctx.fillText(item.label, pad.left - 6, y + barH / 2 + 4);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
            ctx.fillText(item.count.toString(), pad.left + bw + 6, y + barH / 2 + 4);
            regions.push({ contains: (mx, my) => mx >= pad.left && mx <= pad.left + bw && my >= y && my <= y + barH, data: { ...item, percent: Math.round((item.count/total)*100), index: i } });
        });
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${d.color};"></span>
                    <strong>${d.label}</strong>
                </div>
                <div>${d.count.toLocaleString()} tickets (${d.percent}%)</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderParadosChart(this._lastMetrics, hit ? hit.data.index : null); });
    },
    
    renderAguardandoChart(metrics, hoverIndex = null) {
        const canvas = document.getElementById('chartAguardando');
        if (!canvas) return;
        const { ctx, width, height } = setupCanvas(canvas, 250);
        const aguardando = this.filteredData.filter(t => t.status === 7);
        const now = new Date();
        const faixas = [
            { label: '< 1 dia', min: 0, max: 1, color: '#10b981', count: 0 },
            { label: '1-3 dias', min: 1, max: 3, color: '#3b82f6', count: 0 },
            { label: '3-7 dias', min: 3, max: 7, color: '#f59e0b', count: 0 },
            { label: '> 7 dias', min: 7, max: Infinity, color: '#ef4444', count: 0 }
        ];
        aguardando.forEach(t => {
            const days = (now - new Date(t.updated_at || t.created_at)) / (1000 * 60 * 60 * 24);
            const f = faixas.find(fx => days >= fx.min && days < fx.max);
            if (f) f.count++;
        });
        const items = faixas.filter(f => f.count > 0);
        if (!items.length) { ctx.fillStyle = this.colors.textMuted; ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Nenhum aguardando cliente', width/2, height/2); return; }
        ctx.fillStyle = this.colors.text; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`Total aguardando: ${aguardando.length}`, width / 2, 20);
        const total = items.reduce((s, i) => s + i.count, 0);
        const maxCount = Math.max(...items.map(i => i.count), 1);
        const pad = { left: 70, right: 40, top: 40, bottom: 20 };
        const barH = 28, gap = 8;
        const regions = [];
        items.forEach((item, i) => {
            const y = pad.top + i * (barH + gap);
            const bw = Math.max(10, (item.count / maxCount) * (width - pad.left - pad.right));
            const isHover = hoverIndex === i;
            ctx.save();
            if (isHover) { ctx.shadowColor = item.color; ctx.shadowBlur = 12; }
            ctx.fillStyle = item.color; ctx.beginPath(); ctx.roundRect(pad.left, y, bw, barH, 4); ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.colors.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
            ctx.fillText(item.label, pad.left - 6, y + barH / 2 + 4);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
            ctx.fillText(item.count.toString(), pad.left + bw + 6, y + barH / 2 + 4);
            regions.push({ contains: (mx, my) => mx >= pad.left && mx <= pad.left + bw && my >= y && my <= y + barH, data: { ...item, percent: Math.round((item.count/total)*100), index: i } });
        });
        this.setupCanvasTooltip(canvas, regions, (d) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${d.color};"></span>
                    <strong>${d.label}</strong>
                </div>
                <div>${d.count.toLocaleString()} tickets (${d.percent}%)</div>
            </div>
        `, (hit) => { if (this._lastMetrics) this.renderAguardandoChart(this._lastMetrics, hit ? hit.data.index : null); });
    }
});
} // Fechamento do if (typeof BIAnalytics !== 'undefined')
