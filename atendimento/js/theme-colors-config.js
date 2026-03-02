/**
 * ============================================
 * CONFIGURAÇÃO DE CORES DOS TEMAS
 * ============================================
 * 
 * EDITE ESTE ARQUIVO para alterar as cores do sistema.
 * As alterações serão aplicadas automaticamente.
 * 
 * Após editar, recarregue a página (F5) para ver as mudanças.
 */

window.THEME_COLORS_CONFIG = {
    
    // ============================================
    // TEMA TRYVIA CYAN (Tema Claro)
    // ============================================
    'tryvia-cyan': {
        // --- CORES PRINCIPAIS ---
        primary: '#00e4ff',           // Cor de destaque principal (cyan)
        secondary: '#059669',         // Verde escuro
        accent: '#d97706',            // Laranja/Amarelo escuro
        danger: '#dc2626',            // Vermelho para erros/alertas
        
        // --- FUNDOS ---
        background: '#f5f7fa',        // Fundo geral da página
        surface: '#ffffff',           // Fundo dos cards
        cardBg: '#ffffff',            // Fundo dos cards de gráficos
        canvasBg: '#ffffff',          // Fundo dos canvas
        
        // --- TEXTOS (IMPORTANTE: use cores escuras para legibilidade) ---
        text: '#0f172a',              // Texto principal - PRETO FORTE
        textMuted: '#475569',         // Texto secundário - Cinza escuro
        chartText: '#1e293b',         // Texto dentro dos gráficos
        chartLabel: '#334155',        // Labels dos eixos X/Y
        
        // --- BORDAS E GRID ---
        border: '#e2e8f0',            // Bordas dos cards
        chartGrid: '#e2e8f0',         // Linhas de grid nos gráficos
        
        // --- HEADER DO BI (Azul escuro igual sidebar) ---
        headerBg: 'hsl(215, 35%, 18%)',
        headerText: '#ffffff',
        headerBorder: 'hsl(215, 35%, 25%)',
        
        // --- SELETOR DE PESSOAS (Container externo azul escuro) ---
        selectorBg: 'hsl(215, 35%, 18%)',      // Fundo do container externo (azul escuro)
        selectorBorder: 'hsl(215, 35%, 25%)', // Borda do container
        selectorText: '#ffffff',              // Texto do título "Selecionar pessoas..."
        
        // --- CORES DOS GRÁFICOS ---
        chartColors: [
            '#3b82f6',  // Azul
            '#8b5cf6',  // Roxo
            '#06b6d4',  // Cyan
            '#10b981',  // Verde
            '#f59e0b',  // Amarelo
            '#ef4444',  // Vermelho
            '#ec4899',  // Rosa
            '#6366f1',  // Indigo
            '#14b8a6',  // Teal
            '#f97316'   // Laranja
        ]
    },
    
    // ============================================
    // TEMA DARK (Tema Escuro - Padrão)
    // ============================================
    'dark': {
        // --- CORES PRINCIPAIS ---
        primary: '#3b82f6',           // Azul
        secondary: '#10b981',         // Verde
        accent: '#f59e0b',            // Amarelo
        danger: '#ef4444',            // Vermelho
        
        // --- FUNDOS ---
        background: '#1e1e2e',        // Fundo geral
        surface: '#2a2a3e',           // Fundo dos cards
        cardBg: '#252536',            // Fundo dos cards
        canvasBg: '#1e1e2e',          // Fundo dos canvas
        
        // --- TEXTOS ---
        text: '#e5e7eb',              // Texto principal - Branco/Cinza claro
        textMuted: '#9ca3af',         // Texto secundário
        chartText: '#e5e7eb',         // Texto dentro dos gráficos
        chartLabel: '#9ca3af',        // Labels dos eixos
        
        // --- BORDAS E GRID ---
        border: '#374151',            // Bordas
        chartGrid: '#374151',         // Grid dos gráficos
        
        // --- HEADER ---
        headerBg: '#1e1e2e',
        headerText: '#e5e7eb',
        headerBorder: '#374151',
        
        // --- SELETOR DE PESSOAS (No tema dark usa cores escuras padrão) ---
        selectorBg: '#1e1e2e',        // Fundo do container externo
        selectorBorder: '#374151',    // Borda do container
        selectorText: '#e5e7eb',      // Texto do título
        
        // --- CORES DOS GRÁFICOS ---
        chartColors: [
            '#3b82f6',  // Azul
            '#8b5cf6',  // Roxo
            '#06b6d4',  // Cyan
            '#10b981',  // Verde
            '#f59e0b',  // Amarelo
            '#ef4444',  // Vermelho
            '#ec4899',  // Rosa
            '#6366f1',  // Indigo
            '#14b8a6',  // Teal
            '#f97316'   // Laranja
        ]
    }
};

/**
 * Função auxiliar para obter cores do tema atual
 * Use: getThemeColor('text') ou getThemeColor('primary')
 */
window.getThemeColor = function(colorName) {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const config = window.THEME_COLORS_CONFIG[theme] || window.THEME_COLORS_CONFIG['dark'];
    return config[colorName] || '#000000';
};

/**
 * Função para obter todas as cores do tema atual
 */
window.getCurrentThemeColors = function() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    return window.THEME_COLORS_CONFIG[theme] || window.THEME_COLORS_CONFIG['dark'];
};

/**
 * Função centralizada para BI Analytics
 * Retorna objeto com mapeamento de cores usado pelo BI
 */
window.getThemeColorsForBI = function() {
    const config = window.getCurrentThemeColors();
    return {
        primary: config.primary,
        secondary: config.secondary,
        accent: config.accent,
        danger: config.danger,
        dark: config.background,
        surface: config.surface,
        border: config.border,
        text: config.text,
        textMuted: config.textMuted,
        cardBg: config.cardBg,
        canvasBg: config.canvasBg,
        chartText: config.chartText || config.text,
        chartLabel: config.chartLabel || config.textMuted,
        chartGrid: config.chartGrid || config.border,
        selectorBg: config.selectorBg || config.background,
        selectorBorder: config.selectorBorder || config.border,
        selectorText: config.selectorText || config.text,
        chartColors: config.chartColors || []
    };
};

/**
 * Função para obter cores de gráficos
 */
window.getChartColors = function() {
    const config = window.getCurrentThemeColors();
    return config.chartColors || [
        '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
        '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'
    ];
};

console.log('✅ Configuração de cores dos temas carregada. Edite js/theme-colors-config.js para personalizar.');
