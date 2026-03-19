/**
 * Glossário - Módulo de Documentação de Cálculos e Métricas
 * Formato de documento técnico - legível e didático
 */

window.glossaryModule = {
    getColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'tryvia-cyan') {
            return {
                bg: '#f8fafc',
                card: '#ffffff',
                cardAlt: '#f1f5f9',
                text: '#1e293b',
                textMuted: '#64748b',
                textLight: '#94a3b8',
                primary: '#0891b2',
                primaryLight: '#e0f7fa',
                success: '#059669',
                successLight: '#d1fae5',
                warning: '#d97706',
                warningLight: '#fef3c7',
                danger: '#dc2626',
                dangerLight: '#fee2e2',
                purple: '#7c3aed',
                purpleLight: '#ede9fe',
                pink: '#db2777',
                border: '#e2e8f0',
                borderLight: '#f1f5f9',
                codeBg: '#f1f5f9',
                codeText: '#0f172a',
                highlight: '#fef9c3',
                shadow: 'rgba(0,0,0,0.08)'
            };
        }
        return {
            bg: '#0f0f1a',
            card: '#1a1a2e',
            cardAlt: '#252538',
            text: '#e4e4e7',
            textMuted: '#a1a1aa',
            textLight: '#71717a',
            primary: '#3b82f6',
            primaryLight: '#1e3a5f',
            success: '#10b981',
            successLight: '#064e3b',
            warning: '#f59e0b',
            warningLight: '#78350f',
            danger: '#ef4444',
            dangerLight: '#7f1d1d',
            purple: '#8b5cf6',
            purpleLight: '#4c1d95',
            pink: '#ec4899',
            border: '#2d2d44',
            borderLight: '#3f3f5a',
            codeBg: '#252538',
            codeText: '#e4e4e7',
            highlight: '#422006',
            shadow: 'rgba(0,0,0,0.4)'
        };
    },
    
    get colors() {
        return this.getColors();
    },
    
    glossaryData: window.GLOSSARY_DATA || {},
    currentSection: null,
    tocExpanded: true,

    initialize() {
        const container = document.getElementById('glossaryContainer');
        if (!container) return;
        
        container.innerHTML = this.generateDocumentHTML();
        this.setupInteractions();
        this.setupScrollSpy();
    },
    
    generateDocumentHTML() {
        const categories = Object.entries(this.glossaryData);
        const c = this.colors;
        
        return `
            <div class="glossary-document" style="min-height:100vh;background:${c.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;position:relative;">
                
                <!-- Sidebar / Índice (DIREITA - FIXO) -->
                <aside id="glossaryToc" style="width:240px;position:fixed;right:0;top:0;height:100vh;overflow-y:auto;background:${c.card};border-left:1px solid ${c.border};padding:1rem;z-index:100;box-shadow:-2px 0 15px ${c.shadow};">
                    <div style="margin-bottom:1rem;">
                        <h2 style="color:${c.text};font-size:0.95rem;margin:0 0 0.5rem 0;display:flex;align-items:center;gap:6px;">
                            <span style="font-size:1rem;">�</span> Índice
                        </h2>
                    </div>
                    
                    <!-- Busca -->
                    <div style="margin-bottom:1rem;">
                        <input type="text" id="glossarySearch" placeholder="🔍 Buscar..." 
                            style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid ${c.border};
                                   background:${c.cardAlt};color:${c.text};font-size:11px;outline:none;box-sizing:border-box;"
                            oninput="glossaryModule.filterItems(this.value)">
                    </div>
                    
                    <!-- Índice navegável -->
                    <nav style="font-size:11px;">
                        ${categories.map(([key, cat], catIndex) => `
                            <div class="toc-section" style="margin-bottom:0.5rem;">
                                <div onclick="glossaryModule.toggleCategory('${key}');glossaryModule.scrollToCategory('${key}')" 
                                    class="toc-category" data-key="${key}"
                                    style="color:${c.text};font-weight:600;padding:5px 8px;border-radius:4px;cursor:pointer;
                                           display:flex;align-items:center;gap:4px;transition:all 0.2s;font-size:11px;"
                                    onmouseover="this.style.background='${c.cardAlt}'"
                                    onmouseout="this.style.background='transparent'">
                                    <span class="toc-arrow" style="font-size:8px;transition:transform 0.2s;">▶</span>
                                    <span style="font-size:0.85rem;">${cat.title.split(' ')[0]}</span>
                                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">${cat.title.split(' ').slice(1).join(' ')}</span>
                                </div>
                                <div class="toc-items" style="margin-left:1rem;border-left:2px solid ${c.border};padding-left:0.5rem;max-height:0;overflow:hidden;transition:max-height 0.3s ease;" data-category="${key}">
                                    ${cat.items.map((item, i) => `
                                        <div onclick="event.stopPropagation();glossaryModule.scrollToItem('${key}-${i}')" 
                                            class="toc-item" data-id="${key}-${i}"
                                            style="color:${c.textMuted};padding:3px 6px;border-radius:3px;cursor:pointer;
                                                   font-size:10px;transition:all 0.15s;margin:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                                            onmouseover="this.style.background='${c.cardAlt}';this.style.color='${c.text}'"
                                            onmouseout="this.style.background='transparent';this.style.color='${c.textMuted}'">
                                            ${item.icon} ${item.name.length > 18 ? item.name.slice(0,18)+'...' : item.name}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </nav>
                </aside>
                
                <!-- Conteúdo Principal (com margem para não ficar atrás do sidebar) -->
                <main style="margin-right:260px;padding:2rem 2.5rem;">
                    
                    <!-- Header do Documento -->
                    <header style="margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:2px solid ${c.border};">
                        <h1 style="color:${c.text};font-size:1.8rem;margin:0 0 0.75rem 0;font-weight:700;letter-spacing:-0.5px;">
                            📖 Glossário de Métricas e Cálculos
                        </h1>
                        <p style="color:${c.textMuted};font-size:1rem;margin:0 0 1rem 0;line-height:1.5;">
                            Documentação completa de todas as métricas, fórmulas e cálculos do sistema BI.
                        </p>
                        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
                            <span style="background:${c.primaryLight};color:${c.primary};padding:5px 10px;border-radius:16px;font-size:11px;font-weight:500;">
                                📊 ${categories.reduce((acc, [,cat]) => acc + cat.items.length, 0)} itens
                            </span>
                            <span style="background:${c.successLight};color:${c.success};padding:5px 10px;border-radius:16px;font-size:11px;font-weight:500;">
                                📁 ${categories.length} categorias
                            </span>
                        </div>
                    </header>
                    
                    <!-- Seções do Documento -->
                    <div id="glossaryContent">
                        ${categories.map(([key, category], catIndex) => this.generateSectionHTML(key, category, catIndex)).join('')}
                    </div>
                    
                    <!-- Rodapé -->
                    <footer style="margin-top:3rem;padding:1.5rem;background:${c.card};border-radius:10px;border:1px solid ${c.border};">
                        <h3 style="color:${c.text};font-size:0.95rem;margin:0 0 0.75rem 0;display:flex;align-items:center;gap:8px;">
                            💡 Dicas Importantes
                        </h3>
                        <div style="color:${c.textMuted};font-size:13px;line-height:1.6;">
                            <p style="margin:0 0 0.75rem 0;">
                                <strong style="color:${c.text};">Campos essenciais:</strong> 
                                <code style="background:${c.codeBg};padding:2px 5px;border-radius:3px;font-size:11px;color:${c.codeText};">stats_resolved_at</code>, 
                                <code style="background:${c.codeBg};padding:2px 5px;border-radius:3px;font-size:11px;color:${c.codeText};">stats_first_responded_at</code>, 
                                <code style="background:${c.codeBg};padding:2px 5px;border-radius:3px;font-size:11px;color:${c.codeText};">cf_tratativa</code>
                            </p>
                        </div>
                    </footer>
                </main>
            </div>
        `;
    },
    
    toggleCategory(key) {
        const items = document.querySelector(`.toc-items[data-category="${key}"]`);
        const arrow = document.querySelector(`.toc-category[data-key="${key}"] .toc-arrow`);
        if (items && arrow) {
            const isOpen = items.style.maxHeight !== '0px' && items.style.maxHeight !== '';
            items.style.maxHeight = isOpen ? '0px' : '500px';
            arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        }
    },
    
    generateSectionHTML(key, category, catIndex) {
        const c = this.colors;
        const sectionNumber = catIndex + 1;
        
        return `
            <section id="category-${key}" class="glossary-category" style="margin-bottom:4rem;">
                <!-- Título da Seção -->
                <div style="margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid ${c.border};">
                    <h2 style="color:${c.text};font-size:1.5rem;margin:0 0 0.5rem 0;font-weight:600;display:flex;align-items:center;gap:12px;">
                        <span style="background:${c.primary};color:white;width:32px;height:32px;border-radius:8px;
                                     display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">
                            ${sectionNumber}
                        </span>
                        ${category.title}
                    </h2>
                    <p style="color:${c.textMuted};margin:0;font-size:15px;line-height:1.5;">
                        ${category.description}
                    </p>
                </div>
                
                <!-- Itens da Seção -->
                <div style="display:flex;flex-direction:column;gap:2rem;">
                    ${category.items.map((item, i) => this.generateItemDocHTML(item, key, i, sectionNumber)).join('')}
                </div>
            </section>
        `;
    },
    
    generateItemDocHTML(item, categoryKey, index, sectionNumber) {
        const c = this.colors;
        const itemNumber = `${sectionNumber}.${index + 1}`;
        
        return `
            <article id="item-${categoryKey}-${index}" class="glossary-item" 
                data-search="${item.name.toLowerCase()} ${item.formula.toLowerCase()} ${item.interpretation.toLowerCase()}"
                style="background:${c.card};border-radius:12px;border:1px solid ${c.border};overflow:hidden;transition:all 0.3s;">
                
                <!-- Cabeçalho do Item -->
                <div style="padding:1.5rem;border-bottom:1px solid ${c.borderLight};">
                    <div style="display:flex;align-items:flex-start;gap:1rem;">
                        <span style="font-size:2rem;line-height:1;">${item.icon}</span>
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:0.5rem;">
                                <span style="background:${c.cardAlt};color:${c.textMuted};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">
                                    ${itemNumber}
                                </span>
                                <h3 style="color:${c.text};font-size:1.2rem;margin:0;font-weight:600;">
                                    ${item.name}
                                </h3>
                            </div>
                            <p style="color:${c.textMuted};margin:0;font-size:14px;line-height:1.5;">
                                ${item.interpretation}
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Informações Técnicas -->
                <div style="padding:1.5rem;background:${c.cardAlt};">
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:1rem;">
                        <!-- Fórmula -->
                        <div style="background:${c.card};padding:1rem;border-radius:8px;border:1px solid ${c.border};">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                                <span style="color:${c.primary};font-size:14px;">📐</span>
                                <span style="color:${c.primary};font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Fórmula / Campos</span>
                            </div>
                            <code style="display:block;background:${c.codeBg};padding:10px;border-radius:6px;font-size:12px;color:${c.codeText};word-break:break-all;line-height:1.5;">
                                ${item.formula}
                            </code>
                        </div>
                        
                        <!-- Onde é usado -->
                        <div style="background:${c.card};padding:1rem;border-radius:8px;border:1px solid ${c.border};">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                                <span style="color:${c.success};font-size:14px;">📍</span>
                                <span style="color:${c.success};font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Onde é Usado</span>
                            </div>
                            <p style="color:${c.textMuted};font-size:13px;margin:0;line-height:1.5;">
                                ${item.where}
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Detalhes Expandidos (sempre visível) -->
                ${item.details ? `
                    <div style="padding:1.5rem;border-top:1px solid ${c.borderLight};">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;">
                            <span style="color:${c.purple};font-size:16px;">📚</span>
                            <span style="color:${c.text};font-weight:600;font-size:14px;">Explicação Detalhada</span>
                        </div>
                        <div style="color:${c.textMuted};font-size:14px;line-height:1.8;">
                            ${item.details}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Explicação Avançada (se houver) -->
                ${item.extraDetails ? `
                    <div style="padding:1.5rem;background:linear-gradient(135deg, ${c.purpleLight}40, ${c.primaryLight}40);border-top:1px solid ${c.purple}30;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;">
                            <span style="font-size:16px;">🎓</span>
                            <span style="color:${c.purple};font-weight:600;font-size:14px;">Explicação Avançada</span>
                        </div>
                        <div style="color:${c.text};font-size:14px;line-height:1.8;">
                            ${item.extraDetails}
                        </div>
                    </div>
                ` : ''}
            </article>
        `;
    },
    
    setupInteractions() {
        const c = this.colors;
        document.querySelectorAll('.glossary-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.boxShadow = `0 4px 20px ${c.shadow}`;
                item.style.borderColor = c.primary;
            });
            item.addEventListener('mouseleave', () => {
                item.style.boxShadow = 'none';
                item.style.borderColor = c.border;
            });
        });
    },
    
    setupScrollSpy() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id.replace('item-', '');
                    this.highlightTocItem(id);
                }
            });
        }, { threshold: 0.3, rootMargin: '-100px 0px -60% 0px' });
        
        document.querySelectorAll('.glossary-item').forEach(item => {
            observer.observe(item);
        });
    },
    
    highlightTocItem(id) {
        const c = this.colors;
        document.querySelectorAll('.toc-item').forEach(item => {
            if (item.dataset.id === id) {
                item.style.background = c.primaryLight;
                item.style.color = c.primary;
                item.style.fontWeight = '600';
                item.style.borderLeft = `2px solid ${c.primary}`;
                item.style.marginLeft = '-2px';
            } else {
                item.style.background = 'transparent';
                item.style.color = c.textMuted;
                item.style.fontWeight = 'normal';
                item.style.borderLeft = 'none';
                item.style.marginLeft = '0';
            }
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
        
        document.querySelectorAll('.glossary-category').forEach(cat => {
            const hasVisible = Array.from(cat.querySelectorAll('.glossary-item')).some(i => i.style.display !== 'none');
            cat.style.display = hasVisible ? 'block' : 'none';
        });
    },
    
    scrollToCategory(key) {
        const el = document.getElementById(`category-${key}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    
    scrollToItem(id) {
        const el = document.getElementById(`item-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.animation = 'highlightPulse 1s ease-out';
            setTimeout(() => el.style.animation = '', 1000);
        }
    }
};

// CSS para animação de destaque
const style = document.createElement('style');
style.textContent = `
    @keyframes highlightPulse {
        0% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); }
        100% { box-shadow: none; }
    }
    .glossary-document::-webkit-scrollbar { width: 8px; }
    .glossary-document::-webkit-scrollbar-track { background: transparent; }
    .glossary-document::-webkit-scrollbar-thumb { background: #3f3f5a; border-radius: 4px; }
    #glossaryToc::-webkit-scrollbar { width: 6px; }
    #glossaryToc::-webkit-scrollbar-thumb { background: #3f3f5a; border-radius: 3px; }
`;
document.head.appendChild(style);

console.log('✅ Glossary Module (Document Format) carregado');

