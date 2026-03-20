# 🎨 Guia do Sistema de Temas

## Arquitetura Atual

```
js/theme-colors-config.js    ← ÚNICA FONTE DE VERDADE para cores
styles/bi-dashboard.css      ← Overrides CSS por tema
styles/themes/               ← (sugerido) Pasta para CSS de cada tema
```

---

## ✅ REGRAS DE OURO

### 1. **NUNCA use cores hardcoded no JavaScript**
```javascript
// ❌ ERRADO
ctx.fillStyle = '#ffffff';
element.style.background = '#1e1e2e';

// ✅ CORRETO
ctx.fillStyle = this.colors.surface;
element.style.background = this.colors.dark;
```

### 2. **SEMPRE use `getThemeColors()` antes de renderizar**
```javascript
render() {
    this.colors = this.getThemeColors(); // Atualizar cores primeiro
    // ... resto do código
}
```

### 3. **CSS: Use variáveis CSS em vez de valores fixos**
```css
/* ❌ ERRADO */
.card {
    background: #ffffff;
    color: #1e293b;
}

/* ✅ CORRETO */
.card {
    background: var(--surface);
    color: var(--text-primary);
}
```

### 4. **Separe CSS por tema em seletores claros**
```css
/* ✅ CORRETO - Cada tema tem seu bloco */
[data-theme="dark"] .card {
    background: var(--surface);
}

[data-theme="tryvia-cyan"] .card {
    background: var(--surface);
}
```

---

## 📁 Estrutura Recomendada

```
styles/
├── base.css              # Reset, tipografia, layout base
├── components.css        # Componentes sem cor (estrutura)
├── themes/
│   ├── dark.css          # Variáveis e overrides do tema dark
│   ├── tryvia-cyan.css   # Variáveis e overrides do tema claro
│   └── _template.css     # Template para novos temas
└── bi-dashboard.css      # Específico do BI (usa variáveis)

js/
├── theme-colors-config.js  # Configuração de cores (única fonte)
└── theme-manager.js        # (opcional) Gerenciador de temas
```

---

## 🔧 Criando um Novo Tema

### Passo 1: Adicionar cores no `theme-colors-config.js`
```javascript
window.THEME_COLORS_CONFIG = {
    // ... temas existentes ...
    
    'meu-novo-tema': {
        primary: '#...',
        secondary: '#...',
        background: '#...',
        surface: '#...',
        text: '#...',
        textMuted: '#...',
        border: '#...',
        // ... outras cores
    }
};
```

### Passo 2: Adicionar variáveis CSS
```css
[data-theme="meu-novo-tema"] {
    --bg: #...;
    --bg-secondary: #...;
    --surface: #...;
    --text-primary: #...;
    --text-muted: #...;
    --border: #...;
    --primary: #...;
    /* ... */
}
```

### Passo 3: Testar TODOS os componentes
- [ ] BI Analytics (gráficos canvas)
- [ ] Modo Apresentação
- [ ] Modais
- [ ] Tabelas
- [ ] Formulários/Inputs
- [ ] Sidebar
- [ ] Topbar
- [ ] Toasts/Notificações

---

## 🚫 Anti-Patterns (O que NÃO fazer)

| ❌ Errado | ✅ Correto |
|-----------|-----------|
| `background: #fff !important` sem seletor de tema | `[data-theme="X"] .class { background: var(--surface) }` |
| Cores inline no HTML | Classes CSS ou variáveis JS |
| `!important` excessivo | Especificidade adequada |
| Misturar lógica de temas | Um arquivo/bloco por tema |
| Hardcode em canvas | `this.colors.propriedade` |

---

## 🔍 Checklist de Revisão de Tema

Antes de fazer merge de código relacionado a temas:

- [ ] Todas as cores vêm de `theme-colors-config.js` ou variáveis CSS?
- [ ] Não há cores hardcoded (`#fff`, `#000`, `rgb(...)`) sem fallback?
- [ ] Cada regra CSS tem seletor `[data-theme="X"]`?
- [ ] Canvas usa `this.colors.*` em vez de valores fixos?
- [ ] Testado em AMBOS os temas (dark e tryvia-cyan)?
- [ ] Texto é legível contra o fundo em ambos os temas?

---

## 📝 Convenções de Nomenclatura

| Variável | Uso |
|----------|-----|
| `--bg` | Fundo principal da página |
| `--bg-secondary` | Fundo secundário (seções) |
| `--surface` | Fundo de cards/painéis |
| `--text-primary` | Texto principal |
| `--text-muted` | Texto secundário/desabilitado |
| `--border` | Bordas de elementos |
| `--primary` | Cor de destaque/ação |
| `--success` | Verde (sucesso) |
| `--warning` | Amarelo (alerta) |
| `--danger` | Vermelho (erro) |

---

## 🛠️ Utilitários

### Função helper para obter cor do tema
```javascript
// Uso: getThemeColor('primary')
window.getThemeColor = function(colorName) {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const config = window.THEME_COLORS_CONFIG[theme];
    return config?.[colorName] || '#000000';
};
```

### Observer para mudança de tema
```javascript
const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') {
            this.colors = this.getThemeColors();
            this.render();
        }
    });
});
observer.observe(document.documentElement, { attributes: true });
```

---

## 📚 Referências

- `js/theme-colors-config.js` - Configuração central de cores
- `styles/bi-dashboard.css` - Overrides de tema para BI
- `styles/presentation-premium.css` - Estilos do modo apresentação
