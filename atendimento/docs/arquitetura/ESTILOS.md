# 🎨 Guia de Estilos

> Design System do BI Analytics
> Última atualização: Dezembro 2024

---

## 🎯 Paleta de Cores

### Cores Primárias

| Nome | Hex | Uso |
|------|-----|-----|
| Primary | `#3b82f6` | Botões, links, destaques |
| Secondary | `#8b5cf6` | Gradientes, acentos |
| Accent Purple | `#8b5cf6` | Hover, focus |

### Cores de Status

| Nome | Hex | Uso |
|------|-----|-----|
| Success | `#10b981` | Sucesso, resolvido, dentro do SLA |
| Warning | `#f59e0b` | Alerta, pendente, atenção |
| Danger | `#ef4444` | Erro, crítico, fora do SLA |
| Info | `#3b82f6` | Informação, aberto |

### Cores de Background

| Nome | Hex | Uso |
|------|-----|-----|
| Background | `#0f0f0f` | Fundo principal |
| Background Secondary | `#1a1a1a` | Fundo de seções |
| Card | `#1e1e1e` | Fundo de cards |
| Card Hover | `#252525` | Card em hover |
| Surface | `#2a2a3e` | Superfícies elevadas |
| Sidebar | `#141414` | Menu lateral |

### Cores de Texto

| Nome | Hex | Uso |
|------|-----|-----|
| Text Primary | `#e4e4e7` | Texto principal |
| Text Secondary | `#a1a1aa` | Texto secundário |
| Text Muted | `#71717a` | Texto desabilitado/sutil |

### Cores de Borda

| Nome | Hex | Uso |
|------|-----|-----|
| Border | `#27272a` | Bordas padrão |
| Border Light | `#3f3f46` | Bordas sutis |

---

## 📐 Espaçamentos

### Sistema de Espaçamento (rem)

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
```

### Uso Recomendado

| Contexto | Espaçamento |
|----------|-------------|
| Padding de cards | `1.5rem` (24px) |
| Gap entre cards | `1rem` a `1.5rem` |
| Margem de seção | `2rem` |
| Padding de botões | `0.75rem 1rem` |
| Gap em grids | `1rem` |

---

## 🔲 Border Radius

```css
--radius-sm: 6px;    /* Botões pequenos, badges */
--radius: 8px;       /* Padrão para inputs, botões */
--radius-lg: 12px;   /* Cards, modais */
--radius-xl: 16px;   /* Cards grandes, containers */
--radius-full: 50%;  /* Círculos, avatares */
```

---

## 🌊 Sombras

```css
/* Sombra padrão */
--shadow: 0 1px 3px 0 rgba(0,0,0,0.3), 
          0 1px 2px 0 rgba(0,0,0,0.4);

/* Sombra grande */
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.5), 
             0 4px 6px -2px rgba(0,0,0,0.3);

/* Sombra de hover (glow) */
box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);

/* Sombra de modais */
box-shadow: 0 25px 80px rgba(0,0,0,0.6);
```

---

## 🎭 Gradientes

### Gradientes Principais

```css
/* Gradiente padrão */
--gradient: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);

/* Gradiente de sucesso */
--gradient-success: linear-gradient(135deg, #10b981 0%, #34d399 100%);

/* Gradiente de alerta */
--gradient-warning: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);

/* Gradiente de erro */
--gradient-danger: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
```

### Gradientes para Gráficos

```javascript
const gradients = [
    ['#667eea', '#764ba2'],  // Roxo
    ['#f093fb', '#f5576c'],  // Rosa
    ['#4facfe', '#00f2fe'],  // Azul
    ['#43e97b', '#38f9d7'],  // Verde
    ['#fa709a', '#fee140'],  // Laranja
    ['#a8edea', '#fed6e3'],  // Pastel
    ['#ff0844', '#ffb199'],  // Vermelho
    ['#96fbc4', '#f9f586'],  // Lima
    ['#30cfd0', '#330867'],  // Ciano
    ['#ffecd2', '#fcb69f'],  // Pêssego
];
```

---

## ⏱️ Transições

```css
/* Transição rápida */
--transition-fast: 0.15s ease;

/* Transição padrão */
--transition: 0.3s ease;

/* Transição lenta */
--transition-slow: 0.5s ease;

/* Transição personalizada (cubic-bezier) */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 📝 Tipografia

### Família de Fontes

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Tamanhos

| Uso | Tamanho | Peso |
|-----|---------|------|
| H1 (Título de página) | `1.75rem` | 700 |
| H2 (Título de seção) | `1.5rem` | 600 |
| H3 (Título de card) | `1.25rem` | 600 |
| Body | `1rem` | 400 |
| Small | `0.875rem` | 400 |
| Caption | `0.75rem` | 400 |

### Exemplo

```css
/* Título de página */
h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
}

/* Título de card */
h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
}

/* Texto muted */
.text-muted {
    font-size: 0.875rem;
    color: var(--text-muted);
}
```

---

## 🃏 Cards

### Card Padrão

```css
.card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    transition: var(--transition);
}

.card:hover {
    background: var(--card-hover);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}
```

### Card de KPI

```css
.kpi-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    color: white;
    text-align: center;
}

.kpi-value {
    font-size: 2rem;
    font-weight: 700;
}

.kpi-label {
    font-size: 0.85rem;
    opacity: 0.9;
}
```

---

## 🔘 Botões

### Botão Primário

```css
.btn-primary {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius);
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.btn-primary:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
```

### Botão Secundário

```css
.btn-secondary {
    background: transparent;
    color: var(--primary);
    border: 1px solid var(--primary);
    border-radius: var(--radius);
    padding: 0.75rem 1.5rem;
}

.btn-secondary:hover {
    background: rgba(59, 130, 246, 0.1);
}
```

### Botão com Loading

```css
.btn-loading {
    pointer-events: none;
    opacity: 0.7;
}

.btn-loading::before {
    content: '';
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    margin-right: 8px;
    animation: spin 0.8s linear infinite;
}
```

---

## 📊 Chips/Badges

### Chip Selecionável

```css
.chip {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition);
}

.chip:hover {
    border-color: var(--primary);
    color: var(--text-primary);
}

.chip.selected {
    background: rgba(59, 130, 246, 0.2);
    border-color: var(--primary);
    color: var(--primary);
}
```

### Badge de Status

```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.badge-success {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
}

.badge-warning {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
}

.badge-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
}
```

---

## 📱 Responsividade

### Breakpoints

```css
/* Mobile first */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Desktop grande */ }
@media (min-width: 1920px) { /* 4K */ }

/* Desktop first (usado no projeto) */
@media (max-width: 1400px) { /* 2 colunas */ }
@media (max-width: 900px) { /* 1 coluna */ }
@media (max-width: 768px) { /* Mobile */ }
```

### Grid Responsivo

```css
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 1.5rem;
}

@media (max-width: 900px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
```

---

## ♿ Acessibilidade

### Focus Visible

```css
button:focus-visible,
input:focus-visible,
select:focus-visible,
[role="button"]:focus-visible {
    outline: 2px solid var(--accent-purple);
    outline-offset: 2px;
}
```

### Screen Reader Only

```css
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
```

### Skip Link

```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary);
    color: white;
    padding: 8px 16px;
    z-index: 100000;
    transition: top 0.3s;
}

.skip-link:focus {
    top: 0;
}
```

---

## 🎬 Animações

### Keyframes Disponíveis

```css
@keyframes fadeIn { /* Entrada suave */ }
@keyframes spin { /* Rotação (loading) */ }
@keyframes shimmer { /* Efeito shimmer */ }
@keyframes pulse { /* Pulsação */ }
@keyframes glow { /* Brilho */ }
@keyframes ripple { /* Efeito ripple */ }
```

### Classes de Animação

```css
.fade-in {
    animation: fadeIn 0.5s ease-out;
}

.slide-animation {
    animation: fadeInSlide 0.3s ease-out;
}
```

---

*Design System - Dezembro 2024*
