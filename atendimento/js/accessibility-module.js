/**
 * Accessibility Module (A11Y)
 * Implementa melhorias de acessibilidade WCAG 2.1 AA
 * @version 1.0.0
 */

(function () {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================

  const CONFIG = {
    // Ativar skip links
    skipLinks: true,
    // Ativar indicador de foco visível
    focusIndicator: true,
    // Ativar navegação por teclado em gráficos
    chartKeyboardNav: true,
    // Ativar modo alto contraste
    highContrastMode: false,
    // Ativar leitor de tela para gráficos
    chartScreenReader: true,
    // Tamanho mínimo de fonte (rem)
    minFontSize: 0.875,
    // Tempo para anúncios (ms)
    announceDelay: 100
  };

  // ============================================
  // ESTADO
  // ============================================

  const state = {
    isInitialized: false,
    currentFocusedChart: null,
    announceQueue: [],
    highContrast: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // ============================================
  // LIVE REGION PARA ANÚNCIOS
  // ============================================

  /**
   * Cria região live para anúncios de screen reader
   */
  function createLiveRegion() {
    if (document.getElementById('a11y-live-region')) return;

    const region = document.createElement('div');
    region.id = 'a11y-live-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(region);

    // Região assertiva para alertas urgentes
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'a11y-live-assertive';
    assertiveRegion.setAttribute('role', 'alert');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    assertiveRegion.style.cssText = region.style.cssText;
    document.body.appendChild(assertiveRegion);
  }

  /**
   * Anuncia mensagem para screen readers
   */
  function announce(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 'a11y-live-assertive' : 'a11y-live-region';
    const region = document.getElementById(regionId);

    if (!region) {
      createLiveRegion();
      return announce(message, priority);
    }

    // Limpa e anuncia com delay para garantir leitura
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, CONFIG.announceDelay);
  }

  // ============================================
  // SKIP LINKS
  // ============================================

  /**
   * Adiciona skip links para navegação rápida
   */
  function addSkipLinks() {
    if (!CONFIG.skipLinks) return;
    if (document.getElementById('a11y-skip-links')) return;

    const skipNav = document.createElement('nav');
    skipNav.id = 'a11y-skip-links';
    skipNav.setAttribute('aria-label', 'Links de navegação rápida');
    skipNav.innerHTML = `
      <a href="#mainContent" class="skip-link">Pular para conteúdo principal</a>
      <a href="#sidebar" class="skip-link">Pular para menu lateral</a>
      <a href="#biContainer" class="skip-link">Pular para BI Analytics</a>
    `;

    document.body.insertBefore(skipNav, document.body.firstChild);

    // Estilos para skip links
    const style = document.createElement('style');
    style.id = 'a11y-skip-styles';
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -100px;
        left: 50%;
        transform: translateX(-50%);
        background: #667eea;
        color: white;
        padding: 12px 24px;
        border-radius: 0 0 8px 8px;
        text-decoration: none;
        font-weight: 600;
        z-index: 100000;
        transition: top 0.2s ease;
      }
      .skip-link:focus {
        top: 0;
        outline: 3px solid #fbbf24;
        outline-offset: 2px;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // INDICADOR DE FOCO VISÍVEL
  // ============================================

  /**
   * Melhora visibilidade do foco
   */
  function enhanceFocusVisibility() {
    if (!CONFIG.focusIndicator) return;

    const style = document.createElement('style');
    style.id = 'a11y-focus-styles';
    style.textContent = `
      /* Foco visível para todos os elementos interativos */
      :focus-visible {
        outline: 3px solid #667eea !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 6px rgba(102, 126, 234, 0.3) !important;
      }
      
      /* Foco específico para botões */
      button:focus-visible,
      .sidebar-item:focus-visible,
      .btn:focus-visible {
        outline: 3px solid #667eea !important;
        outline-offset: 2px !important;
        background-color: rgba(102, 126, 234, 0.2) !important;
      }
      
      /* Foco para inputs */
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible {
        outline: 3px solid #667eea !important;
        outline-offset: 0 !important;
        border-color: #667eea !important;
      }
      
      /* Foco para cards e containers */
      .card:focus-visible,
      .chart-card:focus-visible {
        outline: 3px solid #667eea !important;
        outline-offset: 4px !important;
      }
      
      /* Foco para canvas (gráficos) */
      canvas:focus-visible {
        outline: 3px solid #667eea !important;
        outline-offset: 4px !important;
        border-radius: 8px;
      }
      
      /* Remove outline padrão quando não usando teclado */
      :focus:not(:focus-visible) {
        outline: none !important;
        box-shadow: none !important;
      }
      
      /* Indicador de foco para reduced motion */
      @media (prefers-reduced-motion: reduce) {
        :focus-visible {
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // ARIA LABELS AUTOMÁTICOS
  // ============================================

  /**
   * Adiciona ARIA labels aos elementos
   */
  function addAriaLabels() {
    // Sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.setAttribute('role', 'navigation');
      sidebar.setAttribute('aria-label', 'Menu principal');
    }

    // Sidebar items
    document.querySelectorAll('.sidebar-item').forEach((item, index) => {
      const text = item.textContent?.trim() || `Item ${index + 1}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', text);

      // Adiciona suporte a teclado
      if (!item.hasAttribute('data-a11y-keyboard')) {
        item.setAttribute('data-a11y-keyboard', 'true');
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
          }
        });
      }
    });

    // Top bar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      topbar.setAttribute('role', 'banner');
      topbar.setAttribute('aria-label', 'Barra superior');
    }

    // Main content
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.setAttribute('role', 'main');
      mainContent.setAttribute('aria-label', 'Conteúdo principal');
    }

    // BI Container
    const biContainer = document.getElementById('biContainer');
    if (biContainer) {
      biContainer.setAttribute('role', 'region');
      biContainer.setAttribute('aria-label', 'Painel de Business Intelligence');
    }

    // Cards
    document.querySelectorAll('.card, .chart-card').forEach((card, index) => {
      const title = card.querySelector('h3, h4, .card-title')?.textContent;
      card.setAttribute('role', 'region');
      card.setAttribute('aria-label', title || `Card ${index + 1}`);
    });

    // Botões sem label
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      const text = btn.textContent?.trim() || btn.title;
      if (text) {
        btn.setAttribute('aria-label', text);
      }
    });

    // Inputs sem label
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      const placeholder = input.placeholder;
      if (!label && placeholder) {
        input.setAttribute('aria-label', placeholder);
      }
    });

    // Selects
    document.querySelectorAll('select:not([aria-label])').forEach(select => {
      const label = document.querySelector(`label[for="${select.id}"]`);
      if (!label) {
        const title = select.title || select.name || 'Selecione uma opção';
        select.setAttribute('aria-label', title);
      }
    });

    // Imagens sem alt
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', '');
      img.setAttribute('role', 'presentation');
    });

    // Links externos
    document.querySelectorAll('a[target="_blank"]:not([aria-label])').forEach(link => {
      const text = link.textContent?.trim();
      if (text) {
        link.setAttribute('aria-label', `${text} (abre em nova janela)`);
      }
    });
  }

  // ============================================
  // NAVEGAÇÃO POR TECLADO EM GRÁFICOS
  // ============================================

  /**
   * Adiciona navegação por teclado aos gráficos
   */
  function addChartKeyboardNav() {
    if (!CONFIG.chartKeyboardNav) return;

    document.querySelectorAll('canvas').forEach(canvas => {
      if (canvas.hasAttribute('data-a11y-chart')) return;

      canvas.setAttribute('data-a11y-chart', 'true');
      canvas.setAttribute('tabindex', '0');
      canvas.setAttribute('role', 'img');

      // Tenta obter título do gráfico
      const parent = canvas.closest('.chart-card, .card');
      const title = parent?.querySelector('h3, h4, .chart-title')?.textContent || 'Gráfico';
      canvas.setAttribute('aria-label', `${title}. Use as teclas de seta para navegar pelos dados.`);

      // Descrição acessível para o gráfico
      const descId = `${canvas.id || 'chart'}-desc-${Date.now()}`;
      const desc = document.createElement('div');
      desc.id = descId;
      desc.className = 'sr-only';
      desc.textContent = `Gráfico interativo: ${title}`;
      canvas.parentNode?.insertBefore(desc, canvas.nextSibling);
      canvas.setAttribute('aria-describedby', descId);

      // Navegação por teclado
      canvas.addEventListener('keydown', (e) => {
        handleChartKeyboard(e, canvas);
      });

      canvas.addEventListener('focus', () => {
        state.currentFocusedChart = canvas;
        announce(`${title}. Use as teclas de seta para explorar os dados.`);
      });
    });
  }

  /**
   * Handler de teclado para gráficos
   */
  function handleChartKeyboard(e, canvas) {
    const chartData = canvas._chartData || [];
    let currentIndex = canvas._currentDataIndex || 0;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, chartData.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        currentIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        currentIndex = chartData.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Simula clique no ponto atual
        if (chartData[currentIndex]) {
          const data = chartData[currentIndex];
          announce(`Selecionado: ${data.label}, valor: ${data.value}`);
        }
        return;
      default:
        return;
    }

    canvas._currentDataIndex = currentIndex;

    if (chartData[currentIndex]) {
      const data = chartData[currentIndex];
      announce(`${data.label}: ${data.value}`);
    }
  }

  /**
   * Registra dados do gráfico para navegação acessível
   */
  function registerChartData(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      canvas._chartData = data;
      canvas._currentDataIndex = 0;
    }
  }

  // ============================================
  // ALTO CONTRASTE
  // ============================================

  /**
   * Toggle modo alto contraste
   */
  function toggleHighContrast() {
    state.highContrast = !state.highContrast;
    document.documentElement.classList.toggle('high-contrast', state.highContrast);

    if (!document.getElementById('a11y-high-contrast-styles')) {
      const style = document.createElement('style');
      style.id = 'a11y-high-contrast-styles';
      style.textContent = `
        .high-contrast {
          --bg-primary: #000000;
          --bg-secondary: #1a1a1a;
          --text-primary: #ffffff;
          --text-secondary: #e0e0e0;
          --accent: #00ffff;
          --warning: #ffff00;
          --error: #ff6666;
          --success: #66ff66;
        }
        
        .high-contrast body {
          background: #000000 !important;
          color: #ffffff !important;
        }
        
        .high-contrast .card,
        .high-contrast .sidebar,
        .high-contrast .topbar {
          background: #1a1a1a !important;
          border: 2px solid #ffffff !important;
        }
        
        .high-contrast a,
        .high-contrast button {
          color: #00ffff !important;
          text-decoration: underline !important;
        }
        
        .high-contrast :focus-visible {
          outline: 4px solid #ffff00 !important;
          outline-offset: 4px !important;
        }
        
        .high-contrast .sidebar-item.active {
          background: #ffffff !important;
          color: #000000 !important;
        }
      `;
      document.head.appendChild(style);
    }

    announce(state.highContrast ? 'Modo alto contraste ativado' : 'Modo alto contraste desativado');
    localStorage.setItem('a11y-high-contrast', state.highContrast);
  }

  // ============================================
  // REDUCED MOTION
  // ============================================

  /**
   * Aplica preferência de movimento reduzido
   */
  function applyReducedMotion() {
    if (!state.reducedMotion) return;

    const style = document.createElement('style');
    style.id = 'a11y-reduced-motion';
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // PAINEL DE ACESSIBILIDADE REMOVIDO
  // As opções foram movidas para o modal de Preferências do sistema

  // ============================================
  // AJUSTE DE FONTE
  // ============================================

  let currentFontScale = 1;

  function adjustFontSize(delta) {
    currentFontScale = Math.max(0.8, Math.min(1.5, currentFontScale + delta));
    document.documentElement.style.fontSize = `${currentFontScale * 16}px`;
    announce(`Tamanho do texto: ${Math.round(currentFontScale * 100)}%`);
    localStorage.setItem('a11y-font-scale', currentFontScale);
  }

  function resetFontSize() {
    currentFontScale = 1;
    document.documentElement.style.fontSize = '16px';
    announce('Tamanho do texto restaurado para padrão');
    localStorage.setItem('a11y-font-scale', 1);
  }

  // ============================================
  // CONTRASTE WCAG
  // ============================================

  /**
   * Verifica contraste entre duas cores
   */
  function checkContrast(foreground, background) {
    const getLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const parseColor = (color) => {
      const hex = color.replace('#', '');
      return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16)
      ];
    };

    const [r1, g1, b1] = parseColor(foreground);
    const [r2, g2, b2] = parseColor(background);

    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio: ratio.toFixed(2),
      passesAA: ratio >= 4.5,
      passesAALarge: ratio >= 3,
      passesAAA: ratio >= 7
    };
  }

  // ============================================
  // OBSERVER PARA NOVOS ELEMENTOS
  // ============================================

  /**
   * Observa DOM para aplicar A11Y em novos elementos
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldUpdate = true;
          break;
        }
      }

      if (shouldUpdate) {
        // Debounce para evitar múltiplas chamadas
        clearTimeout(state.updateTimeout);
        state.updateTimeout = setTimeout(() => {
          addAriaLabels();
          addChartKeyboardNav();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  function init() {
    if (state.isInitialized) return;

    console.log('♿ Inicializando módulo de acessibilidade...');

    // Cria estruturas base
    createLiveRegion();
    addSkipLinks();
    enhanceFocusVisibility();
    applyReducedMotion();

    // Adiciona ARIA labels
    addAriaLabels();

    // Navegação por teclado em gráficos
    addChartKeyboardNav();

    // Botão de acessibilidade removido - movido para configurações
    // createAccessibilityButton();

    // Observer para novos elementos
    setupMutationObserver();

    // Restaura preferências salvas
    const savedContrast = localStorage.getItem('a11y-high-contrast');
    if (savedContrast === 'true') {
      toggleHighContrast();
    }

    const savedFontScale = localStorage.getItem('a11y-font-scale');
    if (savedFontScale) {
      currentFontScale = parseFloat(savedFontScale);
      document.documentElement.style.fontSize = `${currentFontScale * 16}px`;
    }

    state.isInitialized = true;
    console.log('✅ Módulo de acessibilidade inicializado');
  }

  // ============================================
  // API PÚBLICA
  // ============================================

  window.A11y = {
    init,
    announce,
    toggleHighContrast,
    adjustFontSize,
    resetFontSize,
    checkContrast,
    registerChartData,
    addAriaLabels,
    // togglePanel removido - integração direta no sistema
    // togglePanel: toggleAccessibilityPanel,
    setConfig: (key, value) => {
      if (key in CONFIG) {
        CONFIG[key] = value;
        console.log(`♿ A11y config: ${key} = ${value}`);

        // Reaplica configurações
        if (key === 'chartKeyboardNav') {
          addChartKeyboardNav();
        }
      }
    },
    getConfig: () => ({ ...CONFIG }),
    isHighContrast: () => state.highContrast
  };

  // Auto-inicializa
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('♿ Accessibility module loaded');

})();
