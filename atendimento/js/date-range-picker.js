/**
 * Date Range Picker Customizado
 * Comportamento: Clique (âncora) → Hover (preview) → Clique (confirma)
 */

class DateRangePicker {
    constructor() {
        this.isOpen = false;
        this.anchorDate = null;      // Data âncora (primeiro clique)
        this.hoverDate = null;       // Data sob o mouse
        this.startDate = null;       // Data início confirmada
        this.endDate = null;         // Data fim confirmada
        this.currentMonth = new Date();
        this.targetInputs = null;    // { start: input, end: input }
        this.onRangeSelect = null;   // Callback quando intervalo é selecionado
        this.pickerElement = null;
        
        this.colors = {
            bg: '#1e1e2e',
            surface: '#2a2a3e',
            border: '#3f3f46',
            primary: '#3b82f6',
            primaryHover: '#2563eb',
            text: '#e4e4e7',
            textMuted: '#a1a1aa',
            range: 'rgba(59, 130, 246, 0.2)',
            rangeHover: 'rgba(59, 130, 246, 0.3)',
            today: '#10b981',
            anchor: '#f59e0b'
        };
        
        this.monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        this.dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        this.init();
    }
    
    init() {
        // Criar elemento do picker
        this.createPickerElement();
        
        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.isOpen && this.pickerElement && !this.pickerElement.contains(e.target)) {
                const isTargetInput = this.targetInputs && 
                    (e.target === this.targetInputs.start || e.target === this.targetInputs.end);
                if (!isTargetInput) {
                    this.close();
                }
            }
        });
        
        // Tecla ESC fecha
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    createPickerElement() {
        this.pickerElement = document.createElement('div');
        this.pickerElement.id = 'dateRangePicker';
        this.pickerElement.style.cssText = `
            position: absolute;
            z-index: 10000;
            background: ${this.colors.bg};
            border: 1px solid ${this.colors.border};
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            padding: 1rem;
            display: none;
            min-width: 320px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        document.body.appendChild(this.pickerElement);
    }
    
    // Aplicar a um par de inputs de data
    attachTo(startInput, endInput, callback) {
        const startEl = typeof startInput === 'string' ? document.getElementById(startInput) : startInput;
        const endEl = typeof endInput === 'string' ? document.getElementById(endInput) : endInput;
        
        if (!startEl || !endEl) return;
        
        // Verificar se já foi inicializado
        if (startEl.dataset.drpAttached) return;
        startEl.dataset.drpAttached = 'true';
        
        // Criar wrapper visual
        const wrapper = this.createWrapper(startEl, endEl);
        
        // Click no wrapper abre o picker
        wrapper.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.open(startEl, endEl, callback, wrapper);
        });
    }
    
    createWrapper(startEl, endEl) {
        // Encontrar container pai
        const parentContainer = startEl.parentElement.parentElement || startEl.parentElement;
        
        // Criar wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'drp-wrapper';
        wrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 0.875rem;
            background: ${this.colors.surface};
            border: 1px solid ${this.colors.border};
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        `;
        
        wrapper.addEventListener('mouseenter', () => {
            wrapper.style.borderColor = this.colors.primary;
            wrapper.style.boxShadow = `0 0 0 2px ${this.colors.range}`;
        });
        
        wrapper.addEventListener('mouseleave', () => {
            wrapper.style.borderColor = this.colors.border;
            wrapper.style.boxShadow = 'none';
        });
        
        // Criar display visual
        const display = document.createElement('div');
        display.className = 'drp-display';
        display.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: ${this.colors.text};
            font-size: 0.9rem;
            flex: 1;
        `;
        
        const updateDisplay = () => {
            const start = startEl.value ? this.formatDisplayDate(startEl.value) : 'Início';
            const end = endEl.value ? this.formatDisplayDate(endEl.value) : 'Fim';
            display.innerHTML = `
                <span style="color: ${this.colors.primary}">📅</span>
                <span style="font-weight: 500;">${start}</span>
                <span style="color: ${this.colors.textMuted}">→</span>
                <span style="font-weight: 500;">${end}</span>
                <span style="color: ${this.colors.textMuted}; margin-left: auto; font-size: 0.8rem;">▼</span>
            `;
        };
        
        updateDisplay();
        
        // Listener para changes nos inputs
        startEl.addEventListener('change', updateDisplay);
        endEl.addEventListener('change', updateDisplay);
        
        // Esconder inputs originais
        startEl.style.display = 'none';
        endEl.style.display = 'none';
        
        wrapper.appendChild(display);
        
        // Inserir wrapper no lugar dos inputs
        parentContainer.innerHTML = '';
        parentContainer.appendChild(wrapper);
        parentContainer.appendChild(startEl);
        parentContainer.appendChild(endEl);
        
        return wrapper;
    }
    
    formatDisplayDate(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    
    open(startInput, endInput, callback, positionRef) {
        this.targetInputs = { start: startInput, end: endInput };
        this.onRangeSelect = callback;
        
        // Carregar valores atuais
        if (startInput.value) {
            this.startDate = new Date(startInput.value + 'T00:00:00');
        }
        if (endInput.value) {
            this.endDate = new Date(endInput.value + 'T00:00:00');
        }
        
        // Resetar estado de seleção
        this.anchorDate = null;
        this.hoverDate = null;
        
        // Definir mês atual baseado na data início ou hoje
        this.currentMonth = this.startDate ? new Date(this.startDate) : new Date();
        
        this.render();
        
        // Posicionar (usando coordenadas do documento, não da viewport)
        const rect = positionRef.getBoundingClientRect();
        this.pickerElement.style.display = 'block';
        
        const pickerRect = this.pickerElement.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Converter coordenadas da viewport para coordenadas do documento
        let top = rect.bottom + scrollY + 8;
        let left = rect.left + scrollX;
        
        // Verificar se cabe abaixo (na viewport atual)
        const fitsBelow = (rect.bottom + pickerRect.height + 8) <= window.innerHeight;
        // Verificar se cabe acima
        const fitsAbove = (rect.top - pickerRect.height - 8) >= 0;
        
        if (!fitsBelow) {
            if (fitsAbove) {
                // Colocar acima
                top = rect.top + scrollY - pickerRect.height - 8;
            } else {
                // Não cabe nem acima nem abaixo - posicionar no topo visível
                top = scrollY + 8;
            }
        }
        
        // Garantir que top nunca seja negativo
        top = Math.max(scrollY + 8, top);
        
        // Ajustar left se sair da tela
        if (rect.left + pickerRect.width > window.innerWidth) {
            left = scrollX + window.innerWidth - pickerRect.width - 16;
        }
        left = Math.max(scrollX + 8, left);
        
        this.pickerElement.style.top = `${top}px`;
        this.pickerElement.style.left = `${left}px`;
        
        this.isOpen = true;
    }
    
    close() {
        this.isOpen = false;
        this.pickerElement.style.display = 'none';
        this.anchorDate = null;
        this.hoverDate = null;
    }
    
    render() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        this.pickerElement.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <!-- Header com navegação -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button class="drp-nav-btn" data-action="prev-year" title="Ano anterior" style="
                        background: transparent;
                        border: 1px solid ${this.colors.border};
                        color: ${this.colors.textMuted};
                        padding: 0.35rem 0.5rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.8rem;
                    ">◀◀</button>
                    <button class="drp-nav-btn" data-action="prev-month" title="Mês anterior" style="
                        background: transparent;
                        border: 1px solid ${this.colors.border};
                        color: ${this.colors.text};
                        padding: 0.35rem 0.75rem;
                        border-radius: 6px;
                        cursor: pointer;
                    ">◀</button>
                    
                    <span style="font-weight: 600; color: ${this.colors.text}; font-size: 1rem;">
                        ${this.monthNames[month]} ${year}
                    </span>
                    
                    <button class="drp-nav-btn" data-action="next-month" title="Próximo mês" style="
                        background: transparent;
                        border: 1px solid ${this.colors.border};
                        color: ${this.colors.text};
                        padding: 0.35rem 0.75rem;
                        border-radius: 6px;
                        cursor: pointer;
                    ">▶</button>
                    <button class="drp-nav-btn" data-action="next-year" title="Próximo ano" style="
                        background: transparent;
                        border: 1px solid ${this.colors.border};
                        color: ${this.colors.textMuted};
                        padding: 0.35rem 0.5rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.8rem;
                    ">▶▶</button>
                </div>
                
                <!-- Status da seleção -->
                <div id="drpStatus" style="
                    text-align: center;
                    padding: 0.5rem;
                    background: ${this.colors.surface};
                    border-radius: 6px;
                    margin-bottom: 0.75rem;
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                ">
                    ${this.getStatusText()}
                </div>
                
                <!-- Dias da semana -->
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 0.5rem;">
                    ${this.dayNames.map(d => `
                        <div style="
                            text-align: center;
                            font-size: 0.75rem;
                            color: ${this.colors.textMuted};
                            padding: 0.25rem;
                            font-weight: 600;
                        ">${d}</div>
                    `).join('')}
                </div>
                
                <!-- Grid de dias -->
                <div id="drpDaysGrid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
                    ${this.renderDays(year, month)}
                </div>
            </div>
            
            <!-- Atalhos rápidos -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; padding-top: 0.75rem; border-top: 1px solid ${this.colors.border};">
                <button class="drp-quick-btn" data-range="7">Últimos 7 dias</button>
                <button class="drp-quick-btn" data-range="30">Últimos 30 dias</button>
                <button class="drp-quick-btn" data-range="90">Últimos 90 dias</button>
                <button class="drp-quick-btn" data-range="month">Este mês</button>
                <button class="drp-quick-btn" data-range="year">Este ano</button>
            </div>
            
            <!-- Botões de ação -->
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button id="drpClear" style="
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: 1px solid ${this.colors.border};
                    color: ${this.colors.textMuted};
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                ">Limpar</button>
                <button id="drpCancel" style="
                    padding: 0.5rem 1rem;
                    background: transparent;
                    border: 1px solid ${this.colors.border};
                    color: ${this.colors.text};
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                ">Cancelar</button>
                <button id="drpApply" style="
                    padding: 0.5rem 1rem;
                    background: ${this.colors.primary};
                    border: none;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                ">Aplicar</button>
            </div>
        `;
        
        this.attachEvents();
        this.styleQuickButtons();
    }
    
    getStatusText() {
        if (this.anchorDate) {
            return `🎯 Âncora: ${this.formatDisplayDate(this.dateToString(this.anchorDate))} — Clique em outro dia para definir o intervalo`;
        }
        if (this.startDate && this.endDate) {
            const days = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
            return `✅ ${this.formatDisplayDate(this.dateToString(this.startDate))} → ${this.formatDisplayDate(this.dateToString(this.endDate))} (${days} dias)`;
        }
        return '👆 Clique em um dia para iniciar a seleção';
    }
    
    renderDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let html = '';
        
        // Padding inicial
        for (let i = 0; i < startPadding; i++) {
            html += `<div style="padding: 0.5rem;"></div>`;
        }
        
        // Dias do mês
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.dateToString(date);
            const isToday = date.getTime() === today.getTime();
            const isAnchor = this.anchorDate && date.getTime() === this.anchorDate.getTime();
            const isInRange = this.isDateInRange(date);
            const isStart = this.startDate && date.getTime() === this.startDate.getTime();
            const isEnd = this.endDate && date.getTime() === this.endDate.getTime();
            
            let bgColor = 'transparent';
            let textColor = this.colors.text;
            let borderColor = 'transparent';
            let fontWeight = 'normal';
            
            if (isInRange) {
                bgColor = this.colors.range;
            }
            
            if (isStart || isEnd) {
                bgColor = this.colors.primary;
                textColor = 'white';
                fontWeight = '600';
            }
            
            if (isAnchor) {
                bgColor = this.colors.anchor;
                textColor = 'white';
                fontWeight = '600';
            }
            
            if (isToday) {
                borderColor = this.colors.today;
            }
            
            html += `
                <div class="drp-day" data-date="${dateStr}" style="
                    text-align: center;
                    padding: 0.5rem;
                    cursor: pointer;
                    border-radius: 6px;
                    background: ${bgColor};
                    color: ${textColor};
                    font-weight: ${fontWeight};
                    border: 2px solid ${borderColor};
                    transition: all 0.15s ease;
                    font-size: 0.9rem;
                ">${day}</div>
            `;
        }
        
        return html;
    }
    
    isDateInRange(date) {
        // Durante seleção com hover
        if (this.anchorDate && this.hoverDate) {
            const min = this.anchorDate < this.hoverDate ? this.anchorDate : this.hoverDate;
            const max = this.anchorDate < this.hoverDate ? this.hoverDate : this.anchorDate;
            return date >= min && date <= max;
        }
        
        // Intervalo confirmado
        if (this.startDate && this.endDate) {
            return date >= this.startDate && date <= this.endDate;
        }
        
        return false;
    }
    
    attachEvents() {
        // Navegação
        this.pickerElement.querySelectorAll('.drp-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                
                if (action === 'prev-month') {
                    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
                } else if (action === 'next-month') {
                    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
                } else if (action === 'prev-year') {
                    this.currentMonth.setFullYear(this.currentMonth.getFullYear() - 1);
                } else if (action === 'next-year') {
                    this.currentMonth.setFullYear(this.currentMonth.getFullYear() + 1);
                }
                
                this.render();
            });
            
            btn.addEventListener('mouseenter', () => {
                btn.style.background = this.colors.surface;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'transparent';
            });
        });
        
        // Clique nos dias
        this.pickerElement.querySelectorAll('.drp-day').forEach(dayEl => {
            const dateStr = dayEl.dataset.date;
            const date = new Date(dateStr + 'T00:00:00');
            
            dayEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDayClick(date);
            });
            
            dayEl.addEventListener('mouseenter', () => {
                if (this.anchorDate) {
                    this.hoverDate = date;
                    this.updateDaysHighlight();
                    this.updateStatus();
                } else {
                    dayEl.style.background = this.colors.surface;
                }
            });
            
            dayEl.addEventListener('mouseleave', () => {
                if (!this.anchorDate) {
                    const isStart = this.startDate && date.getTime() === this.startDate.getTime();
                    const isEnd = this.endDate && date.getTime() === this.endDate.getTime();
                    const isInRange = this.isDateInRange(date);
                    
                    if (!isStart && !isEnd && !isInRange) {
                        dayEl.style.background = 'transparent';
                    }
                }
            });
        });
        
        // Atalhos rápidos
        this.pickerElement.querySelectorAll('.drp-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyQuickRange(btn.dataset.range);
            });
        });
        
        // Botões de ação
        document.getElementById('drpClear')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startDate = null;
            this.endDate = null;
            this.anchorDate = null;
            this.hoverDate = null;
            this.render();
        });
        
        document.getElementById('drpCancel')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });
        
        document.getElementById('drpApply')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.applySelection();
        });
    }
    
    styleQuickButtons() {
        this.pickerElement.querySelectorAll('.drp-quick-btn').forEach(btn => {
            btn.style.cssText = `
                padding: 0.35rem 0.75rem;
                background: ${this.colors.surface};
                border: 1px solid ${this.colors.border};
                color: ${this.colors.text};
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.75rem;
                transition: all 0.15s ease;
            `;
            
            btn.addEventListener('mouseenter', () => {
                btn.style.borderColor = this.colors.primary;
                btn.style.background = this.colors.range;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.borderColor = this.colors.border;
                btn.style.background = this.colors.surface;
            });
        });
    }
    
    handleDayClick(date) {
        if (!this.anchorDate) {
            // Primeiro clique - define âncora
            this.anchorDate = date;
            this.startDate = null;
            this.endDate = null;
            this.render();
        } else {
            // Segundo clique - confirma intervalo
            if (date < this.anchorDate) {
                this.startDate = date;
                this.endDate = this.anchorDate;
            } else {
                this.startDate = this.anchorDate;
                this.endDate = date;
            }
            this.anchorDate = null;
            this.hoverDate = null;
            this.render();
        }
    }
    
    updateDaysHighlight() {
        const grid = document.getElementById('drpDaysGrid');
        if (!grid) return;
        
        grid.querySelectorAll('.drp-day').forEach(dayEl => {
            const dateStr = dayEl.dataset.date;
            const date = new Date(dateStr + 'T00:00:00');
            const isInRange = this.isDateInRange(date);
            const isAnchor = this.anchorDate && date.getTime() === this.anchorDate.getTime();
            const isHover = this.hoverDate && date.getTime() === this.hoverDate.getTime();
            
            if (isAnchor) {
                dayEl.style.background = this.colors.anchor;
                dayEl.style.color = 'white';
            } else if (isHover) {
                dayEl.style.background = this.colors.primary;
                dayEl.style.color = 'white';
            } else if (isInRange) {
                dayEl.style.background = this.colors.rangeHover;
                dayEl.style.color = this.colors.text;
            } else {
                dayEl.style.background = 'transparent';
                dayEl.style.color = this.colors.text;
            }
        });
    }
    
    updateStatus() {
        const statusEl = document.getElementById('drpStatus');
        if (!statusEl) return;
        
        if (this.anchorDate && this.hoverDate) {
            const min = this.anchorDate < this.hoverDate ? this.anchorDate : this.hoverDate;
            const max = this.anchorDate < this.hoverDate ? this.hoverDate : this.anchorDate;
            const days = Math.ceil((max - min) / (1000 * 60 * 60 * 24)) + 1;
            statusEl.innerHTML = `📍 ${this.formatDisplayDate(this.dateToString(min))} → ${this.formatDisplayDate(this.dateToString(max))} (${days} dias)`;
            statusEl.style.color = this.colors.primary;
        }
    }
    
    applyQuickRange(range) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.endDate = new Date(today);
        
        switch (range) {
            case '7':
                this.startDate = new Date(today);
                this.startDate.setDate(today.getDate() - 6);
                break;
            case '30':
                this.startDate = new Date(today);
                this.startDate.setDate(today.getDate() - 29);
                break;
            case '90':
                this.startDate = new Date(today);
                this.startDate.setDate(today.getDate() - 89);
                break;
            case 'month':
                this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'year':
                this.startDate = new Date(today.getFullYear(), 0, 1);
                break;
        }
        
        this.anchorDate = null;
        this.hoverDate = null;
        this.currentMonth = new Date(this.startDate);
        this.render();
    }
    
    applySelection() {
        if (!this.startDate || !this.endDate) {
            alert('Selecione um intervalo de datas');
            return;
        }
        
        // Atualizar inputs
        if (this.targetInputs) {
            this.targetInputs.start.value = this.dateToString(this.startDate);
            this.targetInputs.end.value = this.dateToString(this.endDate);
            
            // Disparar evento change
            this.targetInputs.start.dispatchEvent(new Event('change', { bubbles: true }));
            this.targetInputs.end.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Callback
        if (this.onRangeSelect) {
            this.onRangeSelect(this.startDate, this.endDate);
        }
        
        this.close();
    }
    
    dateToString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Método estático para aplicar a todos os pares de inputs de data
    static applyToAll() {
        const picker = new DateRangePicker();
        
        // Procurar todos os pares de inputs de data no documento
        const datePairs = [
            // Relatórios
            { start: 'reportStartDate', end: 'reportEndDate' },
            // Apresentação
            { start: 'filterStartDate', end: 'filterEndDate' },
            // BI Analytics
            { start: 'biStartDate', end: 'biEndDate' },
            // Comparativo
            { start: 'compStartDate', end: 'compEndDate' },
            // Adicione mais pares conforme necessário
        ];
        
        datePairs.forEach(pair => {
            const startEl = document.getElementById(pair.start);
            const endEl = document.getElementById(pair.end);
            
            if (startEl && endEl) {
                picker.attachTo(startEl, endEl, (start, end) => {
                    console.log(`📅 Range selecionado: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
                });
            }
        });
        
        return picker;
    }
}

// Instância global
window.dateRangePicker = new DateRangePicker();

// Auto-aplicar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que todos os elementos foram criados
    setTimeout(() => {
        DateRangePicker.applyToAll();
    }, 500);
});

// Método para substituir qualquer select de período por um date picker unificado
DateRangePicker.replaceSelectWithPicker = function(selectId, onRangeChange) {
    const select = document.getElementById(selectId);
    if (!select || select.dataset.drpReplaced) return;
    
    select.dataset.drpReplaced = 'true';
    
    // Criar container do wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'drp-select-wrapper';
    wrapper.style.cssText = `
        position: relative;
        flex: 1;
        min-width: 200px;
    `;
    
    // Criar botão que parece com o select
    const btn = document.createElement('button');
    btn.id = `${selectId}Btn`;
    btn.className = 'drp-select-btn bi-select';
    btn.style.cssText = `
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.875rem;
        background: #2a2a3e;
        border: 1px solid #3f3f46;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        color: #e4e4e7;
        font-size: 0.9rem;
        text-align: left;
    `;
    
    // Estado interno
    let currentRange = { start: null, end: null, preset: '30' };
    
    const updateButtonText = () => {
        if (currentRange.start && currentRange.end) {
            const start = currentRange.start.toLocaleDateString('pt-BR');
            const end = currentRange.end.toLocaleDateString('pt-BR');
            const days = Math.ceil((currentRange.end - currentRange.start) / (1000 * 60 * 60 * 24)) + 1;
            btn.innerHTML = `<span>📅 ${start} → ${end} (${days}d)</span><span style="color:#6b7280;">▼</span>`;
        } else if (currentRange.preset === 'all') {
            btn.innerHTML = `<span>📅 Todo período</span><span style="color:#6b7280;">▼</span>`;
        } else {
            const presetLabels = {
                '7': 'Últimos 7 dias',
                '30': 'Últimos 30 dias',
                '90': 'Últimos 3 meses',
                '180': 'Últimos 6 meses',
                '365': 'Último ano'
            };
            btn.innerHTML = `<span>📅 ${presetLabels[currentRange.preset] || 'Últimos 30 dias'}</span><span style="color:#6b7280;">▼</span>`;
        }
    };
    
    updateButtonText();
    
    // Criar picker popup
    const createPopup = () => {
        const existing = document.getElementById(`${selectId}Popup`);
        if (existing) { existing.remove(); return null; }
        
        const popup = document.createElement('div');
        popup.id = `${selectId}Popup`;
        popup.style.cssText = `
            position: absolute;
            z-index: 10001;
            background: #1e1e2e;
            border: 1px solid #3f3f46;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            min-width: 320px;
        `;
        
        const picker = new DateRangePicker();
        
        popup.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4 style="color: white; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">📅 Selecionar Período</h4>
                
                <!-- Atalhos rápidos -->
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <button class="drp-quick" data-preset="7" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 7 dias</button>
                    <button class="drp-quick" data-preset="30" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 30 dias</button>
                    <button class="drp-quick" data-preset="90" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Últimos 90 dias</button>
                    <button class="drp-quick" data-preset="365" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Último ano</button>
                    <button class="drp-quick" data-preset="all" style="padding:0.4rem 0.75rem;background:#334155;border:1px solid #475569;border-radius:6px;color:#94a3b8;cursor:pointer;font-size:0.8rem;">Todo período</button>
                </div>
                
                <div style="border-top: 1px solid #3f3f46; padding-top: 1rem; margin-top: 0.5rem;">
                    <p style="color: #94a3b8; font-size: 0.8rem; margin: 0 0 0.75rem 0;">Ou selecione um período personalizado:</p>
                    <div id="${selectId}Calendar"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Posicionar popup (usando coordenadas do documento, não da viewport)
        const rect = btn.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        let top = rect.bottom + scrollY + 8;
        let left = rect.left + scrollX;
        
        popup.style.display = 'block';
        const popupRect = popup.getBoundingClientRect();
        
        if (rect.bottom + popupRect.height + 8 > window.innerHeight) {
            top = Math.max(scrollY + 8, rect.top + scrollY - popupRect.height - 8);
        }
        if (rect.left + popupRect.width > window.innerWidth) {
            left = scrollX + window.innerWidth - popupRect.width - 16;
        }
        top = Math.max(scrollY + 8, top);
        left = Math.max(scrollX + 8, left);
        
        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
        
        // Criar calendário dentro do popup
        const calendarContainer = document.getElementById(`${selectId}Calendar`);
        const inlinePicker = new DateRangePicker();
        inlinePicker.currentMonth = new Date();
        if (currentRange.start) inlinePicker.startDate = new Date(currentRange.start);
        if (currentRange.end) inlinePicker.endDate = new Date(currentRange.end);
        
        const renderCalendar = () => {
            const year = inlinePicker.currentMonth.getFullYear();
            const month = inlinePicker.currentMonth.getMonth();
            
            calendarContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <button class="cal-nav" data-dir="-1" style="background:transparent;border:1px solid #3f3f46;color:#e4e4e7;padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;">◀</button>
                    <span style="color: white; font-weight: 600;">${inlinePicker.monthNames[month]} ${year}</span>
                    <button class="cal-nav" data-dir="1" style="background:transparent;border:1px solid #3f3f46;color:#e4e4e7;padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;">▶</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 0.5rem;">
                    ${inlinePicker.dayNames.map(d => `<div style="text-align:center;font-size:0.7rem;color:#6b7280;padding:0.25rem;">${d}</div>`).join('')}
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
                    ${renderDaysGrid(year, month)}
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #3f3f46;">
                    <button id="${selectId}Cancel" style="padding:0.5rem 1rem;background:#334155;border:1px solid #475569;border-radius:6px;color:white;cursor:pointer;">Cancelar</button>
                    <button id="${selectId}Apply" style="padding:0.5rem 1rem;background:#3b82f6;border:none;border-radius:6px;color:white;cursor:pointer;font-weight:600;">Aplicar</button>
                </div>
            `;
            
            // Navegação
            calendarContainer.querySelectorAll('.cal-nav').forEach(nav => {
                nav.onclick = (e) => {
                    e.stopPropagation();
                    inlinePicker.currentMonth.setMonth(inlinePicker.currentMonth.getMonth() + parseInt(nav.dataset.dir));
                    renderCalendar();
                };
            });
            
            // Clique nos dias
            calendarContainer.querySelectorAll('.cal-day').forEach(day => {
                day.onclick = (e) => {
                    e.stopPropagation();
                    const date = new Date(day.dataset.date + 'T00:00:00');
                    
                    if (!inlinePicker.anchorDate) {
                        inlinePicker.anchorDate = date;
                        inlinePicker.startDate = null;
                        inlinePicker.endDate = null;
                    } else {
                        if (date < inlinePicker.anchorDate) {
                            inlinePicker.startDate = date;
                            inlinePicker.endDate = inlinePicker.anchorDate;
                        } else {
                            inlinePicker.startDate = inlinePicker.anchorDate;
                            inlinePicker.endDate = date;
                        }
                        inlinePicker.anchorDate = null;
                    }
                    renderCalendar();
                };
            });
            
            // Botões
            document.getElementById(`${selectId}Cancel`).onclick = () => popup.remove();
            document.getElementById(`${selectId}Apply`).onclick = () => {
                if (inlinePicker.startDate && inlinePicker.endDate) {
                    currentRange = { start: inlinePicker.startDate, end: inlinePicker.endDate, preset: 'custom' };
                    updateButtonText();
                    if (onRangeChange) onRangeChange(currentRange);
                }
                popup.remove();
            };
        };
        
        const renderDaysGrid = (year, month) => {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startPadding = firstDay.getDay();
            const totalDays = lastDay.getDate();
            const today = new Date(); today.setHours(0,0,0,0);
            
            let html = '';
            for (let i = 0; i < startPadding; i++) html += `<div></div>`;
            
            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(year, month, day);
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const isToday = date.getTime() === today.getTime();
                const isAnchor = inlinePicker.anchorDate && date.getTime() === inlinePicker.anchorDate.getTime();
                const isStart = inlinePicker.startDate && date.getTime() === inlinePicker.startDate.getTime();
                const isEnd = inlinePicker.endDate && date.getTime() === inlinePicker.endDate.getTime();
                const isInRange = inlinePicker.startDate && inlinePicker.endDate && date >= inlinePicker.startDate && date <= inlinePicker.endDate;
                
                let bg = 'transparent', color = '#e4e4e7', border = 'transparent';
                if (isInRange) bg = 'rgba(59,130,246,0.2)';
                if (isStart || isEnd) { bg = '#3b82f6'; color = 'white'; }
                if (isAnchor) { bg = '#f59e0b'; color = 'white'; }
                if (isToday) border = '#10b981';
                
                html += `<div class="cal-day" data-date="${dateStr}" style="
                    text-align:center;padding:0.4rem;cursor:pointer;border-radius:6px;
                    background:${bg};color:${color};border:2px solid ${border};
                    font-size:0.85rem;transition:all 0.1s;
                ">${day}</div>`;
            }
            return html;
        };
        
        renderCalendar();
        
        // Atalhos rápidos
        popup.querySelectorAll('.drp-quick').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const preset = btn.dataset.preset;
                const today = new Date(); today.setHours(0,0,0,0);
                
                if (preset === 'all') {
                    currentRange = { start: null, end: null, preset: 'all' };
                } else {
                    const days = parseInt(preset);
                    const end = new Date(today);
                    const start = new Date(today); start.setDate(start.getDate() - days + 1);
                    currentRange = { start, end, preset };
                }
                
                updateButtonText();
                if (onRangeChange) onRangeChange(currentRange);
                popup.remove();
            };
            
            btn.onmouseenter = () => { btn.style.borderColor = '#3b82f6'; btn.style.background = 'rgba(59,130,246,0.2)'; };
            btn.onmouseleave = () => { btn.style.borderColor = '#475569'; btn.style.background = '#334155'; };
        });
        
        // Fechar ao clicar fora
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!popup.contains(e.target) && e.target !== btn) {
                    popup.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);
        
        return popup;
    };
    
    btn.onclick = (e) => {
        e.stopPropagation();
        createPopup();
    };
    
    btn.onmouseenter = () => { btn.style.borderColor = '#3b82f6'; btn.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.2)'; };
    btn.onmouseleave = () => { btn.style.borderColor = '#3f3f46'; btn.style.boxShadow = 'none'; };
    
    // Substituir select
    select.style.display = 'none';
    select.parentElement.insertBefore(wrapper, select);
    wrapper.appendChild(btn);
    wrapper.appendChild(select);
    
    // Método para obter o range atual
    btn.getRange = () => currentRange;
    btn.setPreset = (preset) => {
        currentRange.preset = preset;
        if (preset !== 'custom') {
            currentRange.start = null;
            currentRange.end = null;
        }
        updateButtonText();
    };
    
    return btn;
};

// Exportar
window.DateRangePicker = DateRangePicker;

console.log('📅 Date Range Picker carregado');
