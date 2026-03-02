// ===== CONFIG =====
const SUPABASE_URL = 'https://lrtjdsyfsvaiulgbbprc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydGpkc3lmc3ZhaXVsZ2JicHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjUwNjEsImV4cCI6MjA4NjMwMTA2MX0.bJvSsc_Ho7wtSs-erOi15_MZa8TBfcH5k4TQkJViECA';

const DAY_WIDTH = 40;
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 72;

const MONTH_NAMES = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro'
];

const DAY_NAMES = ['dom','seg','ter','qua','qui','sex','sáb'];

const STATE_COLORS = {
  'New': 'state-new',
  'Active': 'state-active',
  'Resolved': 'state-resolved',
  'Closed': 'state-closed',
  'Removed': 'state-removed',
};

const STATE_CARD_CLASSES = {
  'Active': 'active',
  'Closed': 'closed',
  'Resolved': 'resolved',
  'New': 'new',
};

const SISTEMA_COLORS = {
  'SING': '#8A2BE2',
  'API': '#4DA6FF',
  'OPTz': '#0ab368',
  'SingServices': '#49dcd7',
  'Telemetria': '#d91919',
  'eTrip': '#0840a2'
};

// ===== STATE =====
let allWorkItems = [];
let filteredItems = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed
let loading = false;
let lastSync = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateMonthLabel();
  syncWorkItems();
});

// ===== SYNC =====
async function syncWorkItems() {
  if (loading) return;
  loading = true;
  updateSyncUI();

  const errorBanner = document.getElementById('errorBanner');
  errorBanner.classList.remove('visible');

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/azure-work-items`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    allWorkItems = (data.workItems || []).filter(wi => wi.startDate && wi.endDate);
    lastSync = new Date();
    document.getElementById('headerCount').textContent = `${allWorkItems.length} work items carregados`;

    populateFilterOptions();
    applyFilters();
  } catch (err) {
    console.error('Erro ao buscar work items:', err);
    errorBanner.classList.add('visible');
    document.getElementById('errorMsg').textContent = err.message;
  } finally {
    loading = false;
    updateSyncUI();
  }
}

function updateSyncUI() {
  const btn = document.getElementById('btnSync');
  const icon = document.getElementById('syncIcon');
  const text = document.getElementById('syncText');
  btn.disabled = loading;
  text.textContent = loading ? 'Sincronizando...' : 'Sincronizar';
  if (loading) icon.classList.add('spinning');
  else icon.classList.remove('spinning');

  if (lastSync) {
    document.getElementById('lastSyncLabel').textContent =
      `Última sincronização: ${lastSync.toLocaleTimeString('pt-BR')}`;
  }
}

// ===== FILTERS =====
function populateFilterOptions() {
  const states = [...new Set(allWorkItems.map(wi => wi.state))].sort();
  const assignees = [...new Set(allWorkItems.map(wi => wi.assignedTo))].sort();
  const types = [...new Set(allWorkItems.map(wi => wi.type))].sort();
  const boardColumns = [...new Set(allWorkItems.map(wi => wi.boardColumn).filter(Boolean))].sort();
  const sistemas = [...new Set(allWorkItems.map(wi => wi.sistema).filter(Boolean))].sort();

  fillSelect('filterState', states, 'Todos os Status');
  fillSelect('filterAssignee', assignees, 'Todos');
  fillSelect('filterType', types, 'Todos os Tipos');
  fillSelect('filterBoardColumn', boardColumns, 'Todas as Colunas');
  fillSelect('filterSistema', sistemas, 'Todos os Sistemas');
}

function fillSelect(id, options, allLabel) {
  const sel = document.getElementById(id);
  if (!sel) return; // Elemento não existe no HTML
  const current = sel.value;
  sel.innerHTML = `<option value="all">${allLabel}</option>`;
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    sel.appendChild(opt);
  });
  sel.value = current || 'all';
}

function applyFilters() {
  const search = document.getElementById('filterSearch')?.value.toLowerCase() || '';
  const state = document.getElementById('filterState')?.value || 'all';
  const assignee = document.getElementById('filterAssignee')?.value || 'all';
  const type = document.getElementById('filterType')?.value || 'all';
  const boardColumn = document.getElementById('filterBoardColumn')?.value || 'all';
  const sistema = document.getElementById('filterSistema')?.value || 'all';
  const dateRange = document.getElementById('filterDateRange')?.value || 'all';

  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);

  filteredItems = allWorkItems.filter(wi => {
    if (search && !wi.title.toLowerCase().includes(search) && !String(wi.id).includes(search)) return false;
    if (state !== 'all' && wi.state !== state) return false;
    if (assignee !== 'all' && wi.assignedTo !== assignee) return false;
    if (type !== 'all' && wi.type !== type) return false;
    if (boardColumn !== 'all' && wi.boardColumn !== boardColumn) return false;
    if (sistema !== 'all' && wi.sistema !== sistema) return false;

    if (wi.startDate && wi.endDate) {
      const wiStart = new Date(wi.startDate);
      const wiEnd = new Date(wi.endDate);
      if (dateRange === 'starts') {
        if (wiStart < monthStart || wiStart > monthEnd) return false;
      } else if (dateRange === 'ends') {
        if (wiEnd < monthStart || wiEnd > monthEnd) return false;
      } else {
        if (wiEnd < monthStart || wiStart > monthEnd) return false;
      }
    }
    return true;
  });

  renderStats();
  renderGantt();
}

// ===== MONTH NAV =====
function navigateMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  updateMonthLabel();
  applyFilters();
}

function updateMonthLabel() {
  document.getElementById('monthLabel').textContent =
    `${MONTH_NAMES[currentMonth]} ${currentYear}`;
}

// ===== STATS =====
function renderStats() {
  const grid = document.getElementById('statsGrid');
  const states = {};
  filteredItems.forEach(wi => { states[wi.state] = (states[wi.state] || 0) + 1; });
  const columns = {};
  filteredItems.forEach(wi => { if (wi.boardColumn) columns[wi.boardColumn] = (columns[wi.boardColumn] || 0) + 1; });

  let html = `<div class="stat-card"><p class="stat-label">Total de Itens</p><p class="stat-value">${filteredItems.length}</p></div>`;
  Object.entries(states).forEach(([state, count]) => {
    const cls = STATE_CARD_CLASSES[state] || '';
    //html += `<div class="stat-card ${cls}"><p class="stat-label">${state}</p><p class="stat-value">${count}</p></div>`;
  });

  // Board columns stats
  if (Object.keys(columns).length > 0) {
    html += `<div class="stat-section-label">Por Coluna</div>`;
    Object.entries(columns).sort((a, b) => b[1] - a[1]).forEach(([col, count]) => {
      html += `<div class="stat-card column-card"><p class="stat-label">${col}</p><p class="stat-value">${count}</p></div>`;
    });
  }

  grid.innerHTML = html;
}

// ===== GANTT =====
function renderGantt() {
  const container = document.getElementById('ganttContainer');
  const loadingEl = document.getElementById('loadingContainer');
  const emptyEl = document.getElementById('emptyMsg');

  loadingEl.style.display = 'none';

  if (filteredItems.length === 0) {
    container.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  container.style.display = 'block';

  const days = getDaysInMonth(currentYear, currentMonth);
  const totalDays = days.length;
  const minDate = days[0];
  const weeks = getWeeks(days);

  let html = '<div class="gantt-wrapper">';

  // Labels
  html += `<div class="gantt-labels">`;
  html += `<div class="gantt-labels-header">Work Item</div>`;
  filteredItems.forEach(wi => {
    const colBadge = wi.boardColumn ? `<span class="board-column-badge">${escapeHtml(wi.boardColumn)}</span>` : '';
    html += `<div class="gantt-label-row"><span class="wi-id">#${wi.id}</span><span class="wi-title">${escapeHtml(wi.title)}</span>${colBadge}</div>`;
  });
  html += `</div>`;

  // Timeline
  html += `<div class="gantt-timeline"><div style="width:${totalDays * DAY_WIDTH}px; min-width:100%">`;

  // Header
  html += `<div class="gantt-header">`;
  // Weeks
  html += `<div class="gantt-weeks-row">`;
  weeks.forEach(w => {
   // html += `<div class="gantt-week-cell" style="width:${w.span * DAY_WIDTH}px">Semana ${w.label}</div>`;
  });
  html += `</div>`;
  // Days
  html += `<div class="gantt-days-row">`;
  days.forEach(d => {
    const today = isToday(d) ? ' today' : '';
    const weekend = (d.getDay() === 0 || d.getDay() === 6) ? ' weekend' : '';
    html += `<div class="gantt-day-cell${today}${weekend}" style="width:${DAY_WIDTH}px">`;
    html += `<span>${DAY_NAMES[d.getDay()]}</span><span>${String(d.getDate()).padStart(2, '0')}</span>`;
    html += `</div>`;
  });
  html += `</div></div>`;

  // Rows
  filteredItems.forEach(wi => {
    const start = new Date(wi.startDate);
    const end = new Date(wi.endDate);
    const visibleStart = start < minDate ? minDate : startOfDay(start);
    const lastDay = days[days.length - 1];
    const visibleEnd = end > lastDay ? lastDay : startOfDay(end);
    const startOffset = diffDays(visibleStart, minDate);
    const duration = diffDays(visibleEnd, visibleStart) + 1;

    html += `<div class="gantt-row">`;
    // Grid cells
    html += `<div class="gantt-grid-cells">`;
    days.forEach(d => {
      const today = isToday(d) ? ' today' : '';
      const weekend = (d.getDay() === 0 || d.getDay() === 6) ? ' weekend' : '';
      html += `<div class="gantt-grid-cell${today}${weekend}" style="width:${DAY_WIDTH}px"></div>`;
    });
    html += `</div>`;

    // Bar
    const bgColor = SISTEMA_COLORS[wi.sistema] || '#4DA6FF';
    const left = startOffset * DAY_WIDTH + 2;
    const width = Math.max(duration * DAY_WIDTH - 4, 8);
    html += `<div class="gantt-bar" style="left:${left}px;width:${width}px;background-color:${bgColor}" `;
    html += `onmouseenter="showTooltip(event, ${wi.id})" onmouseleave="hideTooltip()" onmousemove="moveTooltip(event)">`;
    html += `<span>${escapeHtml(wi.title)}</span></div>`;

    // Today line
    days.forEach((d, i) => {
      if (isToday(d)) {
        html += `<div class="today-line" style="left:${i * DAY_WIDTH + DAY_WIDTH / 2}px"></div>`;
      }
    });

    html += `</div>`;
  });

  html += `</div></div>`; // close timeline inner + timeline
  html += `</div>`; // close wrapper

  container.innerHTML = html;
}

// ===== TOOLTIP =====
function showTooltip(event, id) {
  const wi = allWorkItems.find(w => w.id === id) || filteredItems.find(w => w.id === id);
  if (!wi) return;
  const tip = document.getElementById('tooltip');
  let html = `<p class="tooltip-title">#${wi.id} - ${escapeHtml(wi.title)}</p>`;
  //html += `<p>Status: ${wi.state}</p>`;
  if (wi.boardColumn) html += `<p>Coluna: ${wi.boardColumn}</p>`;
  html += `<p>Responsável: ${wi.assignedTo}</p>`;
  html += `<p>Início: ${formatDate(wi.startDate)}</p>`;
  html += `<p>Previsão: ${formatDate(wi.endDate)}</p>`;
  if (wi.empresa) html += `<p>Empresa: ${wi.empresa}</p>`;
  if (wi.sistema) html += `<p>Sistema: ${wi.sistema}</p>`;
  if (wi.tags) html += `<p>Tags: ${wi.tags}</p>`;
  tip.innerHTML = html;
  tip.classList.add('visible');
  moveTooltip(event);
}

function moveTooltip(event) {
  const tip = document.getElementById('tooltip');
  tip.style.left = (event.clientX + 12) + 'px';
  tip.style.top = (event.clientY - 10) + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}

// ===== HELPERS =====
function getDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getWeeks(days) {
  const weeks = [];
  let current = '';
  let count = 0;
  days.forEach(d => {
    const weekNum = getWeekNumber(d);
    if (weekNum !== current) {
      if (current) weeks.push({ label: current, span: count });
      current = weekNum;
      count = 1;
    } else {
      count++;
    }
  });
  if (current) weeks.push({ label: current, span: count });
  return weeks;
}

function getWeekNumber(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return String(1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7));
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
}

function isToday(d) {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

     (function() {
             // Verificar se o usuário veio da página Portal.html
            const referrerPermitido = '/Portal.html';  
            const paginaLogin = `/login/index.html`;  
            
             // Obter o referrer atual
             const referrerAtual = document.referrer;
            
             // Verificar se o referrer está vazio (acesso direto) ou não é o permitido
             if (!referrerAtual || !referrerAtual.includes(referrerPermitido)) {
                 // Verificar se não estamos já na página de login para evitar loop infinito
                 if (!window.location.pathname.endsWith(paginaLogin)) {
                   // Redirecionar para a página de login dentro do subdiretório `/dev`
                  window.location.replace(paginaLogin);
                 }
             }
         })();