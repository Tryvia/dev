/**
 * Script principal — Painel de Backlog Semanal
 */

// ---- State ----
let tickets = [];
let agents = [];
let groups = [];
let companies = [];
let statusChart = null;
let agentChart = null;
let priorityChart = null;
let dailyChart = null;
let resolutionChart = null;
let currentView = 'list';

let currentActionTicket = null;
let currentActionType = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load theme preference
  loadThemePreference();
  setupThemeToggle();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  updateHeader();
  showLoading(true);

  try {
    const [agentsData, groupsData, companiesData] = await Promise.all([
      getAgents(),
      getGroups(),
      getCompanies(),
    ]);

    agents = agentsData;
    groups = groupsData;
    companies = companiesData;

    populateAgentFilter();
    await loadBacklogTickets();
    
    // Load saved filters
    loadSavedFilters();
  } catch (e) {
    showToast('Erro ao carregar dados: ' + e.message, 'error');
  }

  showLoading(false);

  // Auto-refresh every 10 minutes
  setInterval(handleRefresh, 10 * 60 * 1000);
}

// ---- Theme Management ----
function setupThemeToggle() {
  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', toggleTheme);
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

function loadThemePreference() {
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

function updateThemeIcon() {
  const isMoon = document.body.classList.contains('dark-mode');
  document.getElementById('themeToggle').textContent = isMoon ? '☀️' : '🌙';
}

// ---- Keyboard Shortcuts ----
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K: Focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
    // Cmd/Ctrl + Shift + L: Switch to List view
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'l') {
      e.preventDefault();
      switchView('list');
    }
    // Cmd/Ctrl + Shift + K: Switch to Kanban view
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
      e.preventDefault();
      switchView('kanban');
    }
    // Cmd/Ctrl + Shift + A: Switch to Analytics view
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
      e.preventDefault();
      switchView('analytics');
    }
    // Cmd/Ctrl + Shift + R: Refresh
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r') {
      e.preventDefault();
      handleRefresh();
    }
  });
}

// ---- View Switching ----
function switchView(view) {
  currentView = view;
  
  // Update button states
  document.querySelectorAll('.view-toggle').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.view === view) {
      btn.classList.add('active');
    }
  });
  
  // Show/hide sections
  document.getElementById('chartSection').style.display = view === 'list' ? 'block' : 'none';
  document.getElementById('listSection').style.display = view === 'list' ? 'block' : 'none';
  document.getElementById('kanbanSection').style.display = view === 'kanban' ? 'block' : 'none';
  document.getElementById('analyticsSection').style.display = view === 'analytics' ? 'block' : 'none';
  
  renderAll();
}

// ---- Loading ----
function showLoading(show) {
  document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
}

// ---- Header ----
function updateHeader() {
  const { start, end } = getWeekRange(0);
  const count = tickets.length;
  document.getElementById('headerSubtitle').textContent =
    `${formatDate(start)} — ${formatDate(end)} • ${count} ticket${count !== 1 ? 's' : ''} no backlog`;
}

// ---- Load Tickets ----
async function loadBacklogTickets() {
  const ids = getBacklogIds();
  tickets = await getTicketsByIds(ids);
  renderAll();
}

// ---- Add Tickets ----
async function handleAddTickets() {
  const input = document.getElementById('ticketIdsInput');
  const raw = input.value;

  const ids = raw
    .split(/[,;\s]+/)
    .map(s => s.replace(/^#/, '').trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => !isNaN(n) && n > 0);

  if (ids.length === 0) return;

  const btn = document.getElementById('addTicketsBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Adicionando...';

  for (const id of ids) {
    const existing = getBacklogIds();
    if (existing.includes(id)) {
      showToast(`Ticket #${id} já está no backlog.`, 'info');
      continue;
    }

    const ticket = await getTicketById(id);
    if (!ticket || !ticket.id) {
      showToast(`Ticket #${id} não encontrado no Freshdesk.`, 'error');
      continue;
    }

    addBacklogId(id);
    tickets.push(ticket);
    showToast(`Ticket #${id} adicionado ao backlog!`, 'success');
  }

  input.value = '';
  btn.disabled = false;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Adicionar ao Backlog';

  renderAll();
}

// ---- Remove Ticket ----
function handleRemoveTicket(id) {
  removeBacklogId(id);
  tickets = tickets.filter(t => t.id !== id);
  showToast(`Ticket #${id} removido do backlog.`, 'success');
  renderAll();
}

// ---- Refresh ----
async function handleRefresh() {
  showLoading(true);
  try {
    const [agentsData, groupsData, companiesData] = await Promise.all([
      getAgents(),
      getGroups(),
      getCompanies(),
    ]);
    agents = agentsData;
    groups = groupsData;
    companies = companiesData;

    await loadBacklogTickets();
    populateAgentFilter();
    showToast('Dados atualizados!', 'success');
  } catch (e) {
    showToast('Erro ao atualizar: ' + e.message, 'error');
  }
  showLoading(false);
}

// ---- Filters ----
function getFilteredTickets() {
  const agentFilter = document.getElementById('filterAgent').value;
  const priorityFilter = document.getElementById('filterPriority').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const search = document.getElementById('searchInput').value.toLowerCase();

  return tickets.filter(t => {
    if (agentFilter !== 'all' && t.responder_id !== Number(agentFilter)) return false;
    if (priorityFilter !== 'all' && t.priority !== Number(priorityFilter)) return false;
    if (statusFilter !== 'all' && t.status !== Number(statusFilter)) return false;
    if (search) {
      if (!t.subject.toLowerCase().includes(search) && !String(t.id).includes(search)) return false;
    }
    return true;
  });
}

function populateAgentFilter() {
  const select = document.getElementById('filterAgent');
  const current = select.value;
  select.innerHTML = '<option value="all">Todos Responsáveis</option>';
  agents.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.contact.name;
    select.appendChild(opt);
  });
  select.value = current;
  
  // Save filter when changed
  select.addEventListener('change', saveCurrentFilters);
}

// ---- Save/Load Filters ----
function saveCurrentFilters() {
  const filters = {
    agent: document.getElementById('filterAgent').value,
    priority: document.getElementById('filterPriority').value,
    status: document.getElementById('filterStatus').value,
    search: document.getElementById('searchInput').value,
  };
  localStorage.setItem('backlog_filters', JSON.stringify(filters));
}

function loadSavedFilters() {
  const saved = localStorage.getItem('backlog_filters');
  if (saved) {
    try {
      const filters = JSON.parse(saved);
      document.getElementById('filterAgent').value = filters.agent || 'all';
      document.getElementById('filterPriority').value = filters.priority || 'all';
      document.getElementById('filterStatus').value = filters.status || 'all';
      document.getElementById('searchInput').value = filters.search || '';
    } catch (e) {
      console.error('Erro ao carregar filtros salvos', e);
    }
  }
}

// Add save on filter change
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filterPriority').addEventListener('change', saveCurrentFilters);
  document.getElementById('filterStatus').addEventListener('change', saveCurrentFilters);
  document.getElementById('searchInput').addEventListener('input', saveCurrentFilters);
  document.getElementById('ticketIdsInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAddTickets();
  });
});
function renderAll() {
  const filtered = getFilteredTickets();
  renderStats(filtered);
  
  if (currentView === 'list') {
    renderChart(filtered);
    renderTable(filtered);
  } else if (currentView === 'kanban') {
    renderKanban(filtered);
  } else if (currentView === 'analytics') {
    renderAdvancedCharts(filtered);
  }
  
  updateHeader();
}

// ---- Stats ----
function renderStats(filtered) {
  document.getElementById('statTotal').textContent = filtered.length;
  document.getElementById('statOpen').textContent = filtered.filter(t => t.status === 2).length;
  document.getElementById('statProgress').textContent = filtered.filter(t => t.status === 7 || t.status === 3).length;
  document.getElementById('statResolved').textContent = filtered.filter(t => t.status === 4 || t.status === 5).length;
  document.getElementById('statHigh').textContent = filtered.filter(t => t.priority >= 3).length;
}

// ---- Chart ----
function renderChart(filtered) {
  const statusCount = {};
  filtered.forEach(t => {
    const label = STATUS_MAP[t.status] || 'Status ' + t.status;
    statusCount[label] = (statusCount[label] || 0) + 1;
  });

  const labels = Object.keys(statusCount);
  const data = Object.values(statusCount);

  const colors = [
    'hsl(199, 89%, 48%)',
    'hsl(45, 93%, 47%)',
    'hsl(142, 71%, 45%)',
    'hsl(215, 16%, 47%)',
    'hsl(0, 84%, 60%)',
    'hsl(217, 71%, 30%)',
  ];

  const ctx = document.getElementById('statusChart').getContext('2d');

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tickets',
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          grid: { color: 'hsl(214, 32%, 91%)' },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

// ---- Table ----
function renderTable(filtered) {
  const tbody = document.getElementById('ticketTableBody');
  const agentMap = {};
  agents.forEach(a => { agentMap[a.id] = a.contact.name; });
  const companyMap = {};
  companies.forEach(c => { companyMap[c.id] = c.name; });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhum ticket no backlog. Adicione tickets pelo ID acima.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(t => `
    <tr>
      <td class="ticket-id">#${t.id}</td>
      <td><span class="ticket-subject" title="${escapeHtml(t.subject)}">${escapeHtml(t.subject)}</span></td>
      <td class="text-muted">${t.company_id ? (companyMap[t.company_id] || '—') : '—'}</td>
      <td>${t.responder_id ? (agentMap[t.responder_id] || 'Não atribuído') : 'Não atribuído'}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusBadge(t.status)}</td>
      <td class="text-muted text-sm">${formatDate(new Date(t.created_at))}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-ghost" title="Registrar substituição" onclick="openActionModal(${t.id}, 'substitute')">🔄</button>
          <button class="btn btn-ghost" title="Registrar não realizado" onclick="openActionModal(${t.id}, 'not_realized')">❌</button>
          <button class="btn btn-ghost" title="Ver histórico" onclick="openHistoryModal(${t.id})">📋</button>
          <a class="btn btn-ghost" href="https://suportetryvia.freshdesk.com/a/tickets/${t.id}" target="_blank" rel="noopener" title="Abrir no Freshdesk">🔗</a>
          <button class="btn btn-ghost danger" title="Remover do backlog" onclick="handleRemoveTicket(${t.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- Kanban View ----
function renderKanban(filtered) {
  const agentMap = {};
  agents.forEach(a => { agentMap[a.id] = a.contact.name; });
  
  const columns = {
    'not-started': filtered.filter(t => t.status === 2), // Aberto
    'pending': filtered.filter(t => t.status === 3 || t.status === 6), // Pendente ou Aguardando
    'progress': filtered.filter(t => t.status === 7), // Em Progresso
    'resolved': filtered.filter(t => t.status === 4 || t.status === 5), // Resolvido ou Fechado
  };
  
  Object.entries(columns).forEach(([columnId, tickets]) => {
    const container = document.getElementById(`kanban-${columnId}`);
    container.innerHTML = tickets.map(t => `
      <div class="kanban-card">
        <div class="kanban-card-id">#${t.id}</div>
        <div class="kanban-card-title" title="${escapeHtml(t.subject)}">${escapeHtml(t.subject)}</div>
        <div class="kanban-card-meta">
          ${priorityBadge(t.priority)}
          ${agentMap[t.responder_id] ? `<span>${agentMap[t.responder_id].split(' ')[0]}</span>` : ''}
        </div>
      </div>
    `).join('');
  });
}

// ---- Advanced Charts ----
function renderAdvancedCharts(filtered) {
  renderAgentChart(filtered);
  renderPriorityChart(filtered);
  renderDailyChart(filtered);
  renderResolutionChart(filtered);
}

function renderAgentChart(filtered) {
  const agentStats = {};
  agents.forEach(a => { agentStats[a.contact.name] = 0; });
  
  filtered.forEach(t => {
    if (t.responder_id) {
      const agent = agents.find(a => a.id === t.responder_id);
      if (agent) {
        agentStats[agent.contact.name] = (agentStats[agent.contact.name] || 0) + 1;
      }
    }
  });

  const labels = Object.keys(agentStats);
  const data = Object.values(agentStats);

  const ctx = document.getElementById('agentChart').getContext('2d');
  if (agentChart) agentChart.destroy();

  agentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tickets Atribuídos',
        data,
        backgroundColor: 'hsl(217, 71%, 50%)',
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderPriorityChart(filtered) {
  const priorityCount = { Baixa: 0, Média: 0, Alta: 0, Urgente: 0 };
  filtered.forEach(t => {
    const label = PRIORITY_MAP[t.priority] || 'Desconhecido';
    if (priorityCount.hasOwnProperty(label)) {
      priorityCount[label]++;
    }
  });

  const ctx = document.getElementById('priorityChart').getContext('2d');
  if (priorityChart) priorityChart.destroy();

  priorityChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(priorityCount),
      datasets: [{
        data: Object.values(priorityCount),
        backgroundColor: [
          'hsl(142, 71%, 45%)',
          'hsl(45, 93%, 47%)',
          'hsl(0, 84%, 60%)',
          'hsl(0, 100%, 40%)',
        ],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  });
}

function renderDailyChart(filtered) {
  const dailyCount = {};
  filtered.forEach(t => {
    const date = new Date(t.created_at).toLocaleDateString('pt-BR');
    dailyCount[date] = (dailyCount[date] || 0) + 1;
  });

  const dates = Object.keys(dailyCount).sort();
  const counts = dates.map(d => dailyCount[d]);

  const ctx = document.getElementById('dailyChart').getContext('2d');
  if (dailyChart) dailyChart.destroy();

  dailyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Tickets Criados',
        data: counts,
        borderColor: 'hsl(217, 71%, 50%)',
        backgroundColor: 'hsla(217, 71%, 50%, 0.1)',
        tension: 0.4,
        fill: true,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function renderResolutionChart(filtered) {
  const total = filtered.length;
  const resolved = filtered.filter(t => t.status === 4 || t.status === 5).length;
  const pending = filtered.filter(t => [2, 3, 6, 7].includes(t.status)).length;
  const closed = total - resolved - pending;

  const ctx = document.getElementById('resolutionChart').getContext('2d');
  if (resolutionChart) resolutionChart.destroy();

  resolutionChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Resolvido', 'Pendente', 'Outros'],
      datasets: [{
        data: [resolved, pending, Math.max(0, closed)],
        backgroundColor: [
          'hsl(142, 71%, 45%)',
          'hsl(45, 93%, 47%)',
          'hsl(215, 16%, 47%)',
        ],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  });
}

// ---- Badges ----
function priorityBadge(priority) {
  const classes = { 1: 'badge-low', 2: 'badge-medium', 3: 'badge-high', 4: 'badge-urgent' };
  return `<span class="badge ${classes[priority] || ''}">${PRIORITY_MAP[priority] || priority}</span>`;
}

function statusBadge(status) {
  const classes = { 2: 'badge-open', 3: 'badge-pending', 4: 'badge-resolved', 5: 'badge-closed', 6: 'badge-waiting', 7: 'badge-progress' };
  return `<span class="badge ${classes[status] || ''}">${STATUS_MAP[status] || status}</span>`;
}

// ---- Action Modal ----
const SUBSTITUTE_REASONS = ['Substituído por outro ticket', 'Prioridade alterada', 'Escopo modificado'];
const NOT_REALIZED_REASONS = ['Não realizado', 'Bloqueado', 'Aguardando cliente', 'Dependência de API', 'Falta de recursos'];

function openActionModal(ticketId, type) {
  currentActionTicket = tickets.find(t => t.id === ticketId);
  currentActionType = type;
  if (!currentActionTicket) return;

  const modal = document.getElementById('actionModal');
  document.getElementById('actionModalTitle').textContent =
    type === 'substitute' ? `Registrar Substituição — #${ticketId}` : `Registrar Não Realizado — #${ticketId}`;
  document.getElementById('actionTicketInfo').textContent = `#${ticketId} — ${currentActionTicket.subject}`;

  // Reasons
  const reasons = type === 'substitute' ? SUBSTITUTE_REASONS : NOT_REALIZED_REASONS;
  const reasonSelect = document.getElementById('actionReason');
  reasonSelect.innerHTML = '<option value="">Selecione o motivo</option>' +
    reasons.map(r => `<option value="${r}">${r}</option>`).join('');

  // Replacement field
  document.getElementById('replacementGroup').style.display = type === 'substitute' ? 'block' : 'none';
  document.getElementById('actionReplacement').value = '';
  document.getElementById('actionComment').value = '';

  // Responsible
  const respSelect = document.getElementById('actionResponsible');
  respSelect.innerHTML = '<option value="">Selecione o responsável</option>' +
    agents.map(a => `<option value="${a.contact.name}">${a.contact.name}</option>`).join('');

  modal.style.display = 'flex';
}

function closeActionModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('actionModal').style.display = 'none';
  currentActionTicket = null;
  currentActionType = null;
}

function saveAction() {
  const reason = document.getElementById('actionReason').value;
  if (!reason) {
    showToast('Selecione um motivo.', 'error');
    return;
  }

  const entry = {
    ticketId: currentActionTicket.id,
    date: new Date().toISOString(),
    action: currentActionType === 'substitute' ? 'substituído' : 'não realizado',
    reason,
    comment: document.getElementById('actionComment').value,
    responsible: document.getElementById('actionResponsible').value || '—',
  };

  if (currentActionType === 'substitute') {
    const rep = document.getElementById('actionReplacement').value;
    if (rep) entry.replacementTicketId = Number(rep);
  }

  addHistoryEntry(entry);
  showToast('Registro salvo com sucesso!', 'success');
  closeActionModal();
}

// ---- History Modal ----
function openHistoryModal(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  const history = getTicketHistory(ticketId);
  const modal = document.getElementById('historyModal');
  document.getElementById('historyModalTitle').textContent = `Histórico — #${ticketId}`;

  const content = document.getElementById('historyContent');

  if (history.length === 0) {
    content.innerHTML = '<p class="empty-state">Nenhum registro encontrado para este ticket.</p>';
  } else {
    content.innerHTML = history.map(entry => `
      <div class="history-entry">
        <div style="flex:1">
          <div class="history-entry-header">
            <span class="history-date">${formatDate(new Date(entry.date))}</span>
            <span class="badge ${entry.action === 'substituído' ? 'badge-medium' : 'badge-high'}">${entry.action}</span>
          </div>
          <p class="text-muted text-sm">${escapeHtml(entry.reason)}</p>
          ${entry.comment ? `<p class="text-sm" style="margin-top:0.25rem">${escapeHtml(entry.comment)}</p>` : ''}
          ${entry.replacementTicketId ? `<p class="text-sm" style="margin-top:0.25rem;color:var(--primary)">Substituído pelo ticket #${entry.replacementTicketId}</p>` : ''}
          <p class="text-muted text-sm" style="margin-top:0.25rem">Responsável: ${escapeHtml(entry.responsible)}</p>
        </div>
      </div>
    `).join('');
  }

  modal.style.display = 'flex';
}

function closeHistoryModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('historyModal').style.display = 'none';
}

// ---- CSV Export ----
function exportCSV() {
  const filtered = getFilteredTickets();
  const agentMap = {};
  agents.forEach(a => { agentMap[a.id] = a.contact.name; });
  const companyMap = {};
  companies.forEach(c => { companyMap[c.id] = c.name; });

  const header = 'ID,Ticket,Cliente,Responsável,Prioridade,Status,Criado em\n';
  const rows = filtered.map(t =>
    [
      t.id,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.company_id ? (companyMap[t.company_id] || '') : '',
      t.responder_id ? (agentMap[t.responder_id] || '') : '',
      PRIORITY_MAP[t.priority] || t.priority,
      STATUS_MAP[t.status] || t.status,
      formatDate(new Date(t.created_at)),
    ].join(',')
  ).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backlog-semanal-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado!', 'success');
}

// ---- Utils ----
function formatDate(date) {
  return date.toLocaleDateString('pt-BR');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function showToast(message, type) {
  type = type || 'info';
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
