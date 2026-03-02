/**
 * Glossário - Módulo de Documentação de Cálculos e Métricas
 * Explica todas as métricas, cálculos e onde são utilizados no sistema
 */

window.glossaryModule = {
    getColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'tryvia-cyan') {
            return {
                bg: '#f5f7fa',
                card: '#ffffff',
                text: '#1e293b',
                textMuted: '#64748b',
                primary: '#00e4ff',
                success: '#059669',
                warning: '#d97706',
                danger: '#dc2626',
                purple: '#7c3aed',
                pink: '#db2777',
                border: '#e2e8f0',
                codeBg: '#f1f5f9'
            };
        }
        return {
            bg: '#1e1e2e',
            card: '#252536',
            text: '#e4e4e7',
            textMuted: '#a1a1aa',
            primary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            purple: '#8b5cf6',
            pink: '#ec4899',
            border: '#3f3f5a',
            codeBg: '#3f3f5a'
        };
    },
    
    get colors() {
        return this.getColors();
    },
    
    // Dados do glossário organizados por categoria
    glossaryData: window.GLOSSARY_DATA || {},

    initialize() {
        const container = document.getElementById('glossaryContainer');
        if (!container) return;
        
        container.innerHTML = this.generateHTML();
        this.setupInteractions();
    },
    
    generateHTML() {
        const categories = Object.entries(this.glossaryData);
        
        return `
            <div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
                <!-- Header -->
                <div style="margin-bottom: 2rem;">
                    <h1 style="color: ${this.colors.text}; font-size: 2rem; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 12px;">
                        <span>📖</span> Glossário de Métricas e Cálculos
                    </h1>
                    <p style="color: ${this.colors.textMuted}; margin: 0; font-size: 1rem;">
                        Documentação completa de todas as métricas, fórmulas e onde são utilizadas no sistema
                    </p>
                </div>
                
                <!-- Search -->
                <div style="margin-bottom: 2rem;">
                    <input type="text" id="glossarySearch" placeholder="🔍 Buscar métrica..." 
                        style="width: 100%; max-width: 400px; padding: 12px 16px; border-radius: 8px; 
                               border: 1px solid ${this.colors.border}; background: ${this.colors.card}; 
                               color: ${this.colors.text}; font-size: 14px; outline: none;"
                        oninput="glossaryModule.filterItems(this.value)">
                </div>
                
                <!-- Categories Navigation -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 2rem;">
                    ${categories.map(([key, cat]) => `
                        <button onclick="glossaryModule.scrollToCategory('${key}')" 
                            style="padding: 8px 16px; border-radius: 20px; border: 1px solid ${this.colors.border}; 
                                   background: ${this.colors.card}; color: ${this.colors.text}; cursor: pointer;
                                   font-size: 13px; transition: all 0.2s;">
                            ${cat.title}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Categories Content -->
                <div id="glossaryContent">
                    ${categories.map(([key, category]) => this.generateCategoryHTML(key, category)).join('')}
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 3rem; padding: 1.5rem; background: ${this.colors.card}; border-radius: 12px; border-left: 4px solid ${this.colors.primary};">
                    <h3 style="color: ${this.colors.text}; margin: 0 0 0.5rem 0; font-size: 1rem;">💡 Dica</h3>
                    <p style="color: ${this.colors.textMuted}; margin: 0; font-size: 14px; line-height: 1.6;">
                        Se alguma métrica aparecer zerada ou sem dados, verifique se os campos necessários estão sendo 
                        retornados pela API do Freshdesk. Os campos mais importantes são: <code style="background: ${this.colors.codeBg || this.colors.border}; padding: 2px 6px; border-radius: 4px; color: ${this.colors.text};">stats_resolved_at</code>, 
                        <code style="background: ${this.colors.codeBg || this.colors.border}; padding: 2px 6px; border-radius: 4px; color: ${this.colors.text};">stats_first_responded_at</code> e 
                        <code style="background: ${this.colors.codeBg || this.colors.border}; padding: 2px 6px; border-radius: 4px; color: ${this.colors.text};">cf_tratativa</code>.
                    </p>
                </div>
            </div>
        `;
    },
    
    generateCategoryHTML(key, category) {
        return `
            <div id="category-${key}" class="glossary-category" style="margin-bottom: 2rem;">
                <div style="background: ${this.colors.card}; border-radius: 12px; padding: 1.5rem; border: 1px solid ${this.colors.border};">
                    <h2 style="color: ${this.colors.text}; margin: 0 0 0.5rem 0; font-size: 1.25rem;">
                        ${category.title}
                    </h2>
                    <p style="color: ${this.colors.textMuted}; margin: 0 0 1.5rem 0; font-size: 14px;">
                        ${category.description}
                    </p>
                    
                    <div style="display: grid; gap: 1rem;">
                        ${category.items.map((item, i) => this.generateItemHTML(item, key, i)).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    generateItemHTML(item, categoryKey, index) {
        const hasDetails = item.details;
        const hasExtraDetails = item.extraDetails;
        
        return `
            <div class="glossary-item" data-search="${item.name.toLowerCase()} ${item.formula.toLowerCase()}"
                style="background: ${this.colors.bg}; border-radius: 8px; padding: 1rem; border: 1px solid ${this.colors.border}; transition: all 0.2s;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <span style="font-size: 1.5rem; flex-shrink: 0;">${item.icon}</span>
                    <div style="flex: 1; min-width: 0;">
                        <h3 style="color: ${this.colors.text}; margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600;">
                            ${item.name}
                        </h3>
                        
                        <div style="display: grid; gap: 8px; font-size: 13px;">
                            <div>
                                <span style="color: ${this.colors.primary}; font-weight: 500;">Fórmula:</span>
                                <span style="color: ${this.colors.text}; margin-left: 8px; font-family: monospace; background: ${this.colors.codeBg || this.colors.border}; padding: 2px 8px; border-radius: 4px;">
                                    ${item.formula}
                                </span>
                            </div>
                            
                            <div>
                                <span style="color: ${this.colors.success}; font-weight: 500;">Onde é usado:</span>
                                <span style="color: ${this.colors.textMuted}; margin-left: 8px;">${item.where}</span>
                            </div>
                            
                            <div>
                                <span style="color: ${this.colors.warning}; font-weight: 500;">Interpretação:</span>
                                <span style="color: ${this.colors.textMuted}; margin-left: 8px;">${item.interpretation}</span>
                            </div>
                            
                            ${hasDetails || hasExtraDetails ? `
                                <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${hasDetails ? `
                                        <button onclick="glossaryModule.toggleDetails('${categoryKey}-${index}')" 
                                            style="background: transparent; border: 1px solid ${this.colors.border}; color: ${this.colors.primary}; 
                                                   padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            ▶ Ver detalhes técnicos
                                        </button>
                                    ` : ''}
                                    ${hasExtraDetails ? `
                                        <button onclick="glossaryModule.toggleExtraDetails('${categoryKey}-${index}')" 
                                            style="background: ${this.colors.purple}20; border: 1px solid ${this.colors.purple}; color: ${this.colors.purple}; 
                                                   padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
                                            🎓 Explicação Avançada
                                        </button>
                                    ` : ''}
                                </div>
                                ${hasDetails ? `
                                    <div id="details-${categoryKey}-${index}" style="display: none; margin-top: 12px; padding: 12px; 
                                         background: ${this.colors.card}; border-radius: 6px; font-size: 13px; color: ${this.colors.textMuted}; line-height: 1.6;">
                                        ${item.details}
                                    </div>
                                ` : ''}
                                ${hasExtraDetails ? `
                                    <div id="extra-${categoryKey}-${index}" style="display: none; margin-top: 12px; padding: 16px; 
                                         background: linear-gradient(135deg, ${this.colors.purple}15, ${this.colors.primary}10); 
                                         border-radius: 8px; font-size: 13px; color: ${this.colors.text}; line-height: 1.7;
                                         border: 1px solid ${this.colors.purple}40;">
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid ${this.colors.border};">
                                            <span style="font-size: 1.25rem;">🎓</span>
                                            <span style="font-weight: 600; color: ${this.colors.purple};">Explicação Avançada</span>
                                        </div>
                                        ${item.extraDetails}
                                    </div>
                                ` : ''}
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupInteractions() {
        // Add hover effects
        document.querySelectorAll('.glossary-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = this.colors.primary;
                item.style.transform = 'translateX(4px)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.borderColor = this.colors.border;
                item.style.transform = 'translateX(0)';
            });
        });
    },
    
    filterItems(query) {
        const items = document.querySelectorAll('.glossary-item');
        const q = query.toLowerCase().trim();
        
        items.forEach(item => {
            const searchText = item.getAttribute('data-search') || '';
            const matches = !q || searchText.includes(q);
            item.style.display = matches ? 'block' : 'none';
        });
        
        // Show/hide categories based on visible items
        document.querySelectorAll('.glossary-category').forEach(cat => {
            const visibleItems = cat.querySelectorAll('.glossary-item[style*="display: block"], .glossary-item:not([style*="display: none"])');
            const hasVisible = Array.from(cat.querySelectorAll('.glossary-item')).some(i => i.style.display !== 'none');
            cat.style.display = hasVisible ? 'block' : 'none';
        });
    },
    
    scrollToCategory(key) {
        const el = document.getElementById(`category-${key}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    toggleDetails(id) {
        const details = document.getElementById(`details-${id}`);
        if (details) {
            const isHidden = details.style.display === 'none';
            details.style.display = isHidden ? 'block' : 'none';
            
            // Update button text
            const container = details.parentElement;
            const btn = container?.querySelector('button[onclick*="toggleDetails"]');
            if (btn) {
                btn.textContent = isHidden ? '▼ Ocultar detalhes técnicos' : '▶ Ver detalhes técnicos';
            }
        }
    },
    
    toggleExtraDetails(id) {
        const extra = document.getElementById(`extra-${id}`);
        if (extra) {
            const isHidden = extra.style.display === 'none';
            extra.style.display = isHidden ? 'block' : 'none';
            
            // Update button text
            const container = extra.parentElement;
            const btn = container?.querySelector('button[onclick*="toggleExtraDetails"]');
            if (btn) {
                btn.innerHTML = isHidden ? '🎓 Ocultar Explicação' : '🎓 Explicação Avançada';
            }
        }
    }
};

console.log('✅ Glossary Module carregado');

