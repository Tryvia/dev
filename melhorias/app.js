// ===== CONFIG =====
const SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc';

const FRESHDESK_DOMAIN = 'https://suportetryvia.freshdesk.com';
const FRESHDESK_API_KEY = 'lY550ILhbZ0qXXi3JPCj';

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

const FRESHDESK_STATUS_MAP = {
  2: 'Aberto',
  3: 'Pendente',
  4: 'Resolvido',
  5: 'Fechado',
};

// ===== STATE =====
let allWorkItems = [];
let filteredItems = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let loading = false;
let lastSync = null;
let currentModalWorkItemId = null;

// ===== LOCAL STORAGE HELPERS =====
function getAssociations() {
  try {
    return JSON.parse(localStorage.getItem('wi_associations') || '{}');
  } catch { return {}; }
}

function saveAssociations(data) {
  localStorage.setItem('wi_associations', JSON.stringify(data));
}

function getWorkItemData(wiId) {
  const assoc = getAssociations();
  return assoc[wiId] || { ticketId: null, annotations: [] };
}

function setWorkItemData(wiId, data) {
  const assoc = getAssociations();
  assoc[wiId] = data;
  saveAssociations(assoc);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateMonthLabel();
  syncWorkItems();

  // Close modal on overlay click
  document.getElementById('annotationModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAnnotationModal();
  });

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAnnotationModal();
  });
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
  if (!sel) return;
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
  });

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
    const wiData = getWorkItemData(wi.id);
    const colBadge = wi.boardColumn ? `<span class="board-column-badge">${escapeHtml(wi.boardColumn)}</span>` : '';
    const ticketBadge = wiData.ticketId ? `<span class="ticket-badge">T#${wiData.ticketId}</span>` : '';
    const annotCount = wiData.annotations ? wiData.annotations.length : 0;
    const annotBadge = annotCount > 0 ? `<span class="annotation-count-badge">${annotCount} nota${annotCount > 1 ? 's' : ''}</span>` : '';
    html += `<div class="gantt-label-row" onclick="openAnnotationModal(${wi.id})" style="cursor:pointer;"><span class="wi-id">#${wi.id}</span><span class="wi-title">${escapeHtml(wi.title)}</span>${colBadge}${ticketBadge}${annotBadge}</div>`;
  });
  html += `</div>`;

  // Timeline
  html += `<div class="gantt-timeline"><div style="width:${totalDays * DAY_WIDTH}px; min-width:100%">`;

  // Header
  html += `<div class="gantt-header">`;
  html += `<div class="gantt-weeks-row">`;
  weeks.forEach(w => {});
  html += `</div>`;
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
    html += `<div class="gantt-grid-cells">`;
    days.forEach(d => {
      const today = isToday(d) ? ' today' : '';
      const weekend = (d.getDay() === 0 || d.getDay() === 6) ? ' weekend' : '';
      html += `<div class="gantt-grid-cell${today}${weekend}" style="width:${DAY_WIDTH}px"></div>`;
    });
    html += `</div>`;

    const bgColor = SISTEMA_COLORS[wi.sistema] || '#4DA6FF';
    const left = startOffset * DAY_WIDTH + 2;
    const width = Math.max(duration * DAY_WIDTH - 4, 8);
    html += `<div class="gantt-bar" style="left:${left}px;width:${width}px;background-color:${bgColor}" `;
    html += `onclick="openAnnotationModal(${wi.id})" `;
    html += `onmouseenter="showTooltip(event, ${wi.id})" onmouseleave="hideTooltip()" onmousemove="moveTooltip(event)">`;
    html += `<span>${escapeHtml(wi.title)}</span></div>`;

    days.forEach((d, i) => {
      if (isToday(d)) {
        html += `<div class="today-line" style="left:${i * DAY_WIDTH + DAY_WIDTH / 2}px"></div>`;
      }
    });

    html += `</div>`;
  });

  html += `</div></div>`;
  html += `</div>`;

  container.innerHTML = html;
}

// ===== VERIFICAÇÃO DE ACESSO =====
function isUserFromProductTeam() {
  // Verificar se o setor é "Produto"
  const setor = sessionStorage.getItem('setor') || localStorage.getItem('setor') || '';
  
  // Comparação exata com o valor "Produto"
  if (setor === 'Produto') {
    return true;
  }

  // Se não é do time de produto, usuário não tem acesso ao modal de anotações
  return false;
}

function showAccessDeniedAlert() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
  
  const content = document.createElement('div');
  content.style.cssText = 'background:white;padding:30px;border-radius:10px;text-align:center;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.2);';
  content.innerHTML = `
    <h2 style="color:#d32f2f;margin-top:0;">Acesso Negado</h2>
    <p style="color:#666;font-size:1.05em;margin:15px 0;">Voçê não tem permissão para acessar esta funcionalidade.</p>
    <p style="color:#999;font-size:0.9em;">Para mais informações, contate o administrador.</p>
    <button onclick="this.closest('div').remove()" style="background:#4fc3f7;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-size:1em;margin-top:15px;">Fechar</button>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ===== ANNOTATION MODAL =====
function openAnnotationModal(wiId) {
  // Validação: apenas time de produto pode acessar anotações
  if (!isUserFromProductTeam()) {
    showAccessDeniedAlert();
    return;
  }

  currentModalWorkItemId = wiId;
  const wi = allWorkItems.find(w => w.id === wiId) || filteredItems.find(w => w.id === wiId);
  const modal = document.getElementById('annotationModal');

  document.getElementById('modalTitle').textContent = wi ? `#${wi.id} - ${wi.title}` : `Work Item #${wiId}`;
  document.getElementById('modalSubtitle').textContent = wi ? `${wi.assignedTo || ''} • ${wi.sistema || ''}` : '';

  // Load existing data
  const wiData = getWorkItemData(wiId);

  // Ticket
  const ticketInput = document.getElementById('ticketIdInput');
  ticketInput.value = '';
  const ticketInfo = document.getElementById('ticketInfo');

  if (wiData.ticketId) {
    ticketInfo.style.display = 'block';
    ticketInfo.innerHTML = '<p style="color:hsl(215,15%,50%);font-size:0.8rem;">Carregando ticket...</p>';
    fetchTicketInfo(wiData.ticketId);
    fetchTicketComments(wiData.ticketId);
  } else {
    ticketInfo.style.display = 'none';
  }

  // Annotations
  document.getElementById('annotationText').value = '';
  renderAnnotations();

  modal.classList.add('visible');
}

function closeAnnotationModal() {
  document.getElementById('annotationModal').classList.remove('visible');
  currentModalWorkItemId = null;
}

// ===== FRESHDESK =====
async function fetchTicketInfo(ticketId) {
  const ticketInfo = document.getElementById('ticketInfo');

  try {
    // Tentar passar por Supabase primeiro
    const res = await fetch(`${SUPABASE_URL}/functions/v1/freshdesk-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get-ticket',
        ticketId: ticketId,
      }),
    });

    if (!res.ok) {
      console.warn(`Supabase retornou ${res.status}, tentando fallback...`);
      throw new Error(`HTTP ${res.status}`);
    }

    const ticket = await res.json();
    const statusText = FRESHDESK_STATUS_MAP[ticket.status] || `Status ${ticket.status}`;

    ticketInfo.innerHTML = `
      <p class="ticket-subject">${escapeHtml(ticket.subject || 'Sem assunto')}</p>
      <p class="ticket-detail">Solicitante: ${escapeHtml(ticket.requester?.name || ticket.requester?.email || 'N/A')}</p>
      <p class="ticket-detail">Prioridade: ${['', 'Baixa', 'Média', 'Alta', 'Urgente'][ticket.priority] || ticket.priority}</p>
      <p class="ticket-detail">Criado em: ${formatDate(ticket.created_at)}</p>
      <span class="ticket-status-badge">${statusText}</span>
      <br/>
      <button class="btn-remove-ticket" onclick="removeTicketAssociation()">Remover associação</button>
    `;
    ticketInfo.style.display = 'block';
  } catch (err) {
    // Fallback: mostrar apenas que o ticket está associado, sem erro
    console.warn('Não conseguiu carregar detalhes do ticket, mostrando fallback');
    ticketInfo.innerHTML = `
      <p class="ticket-subject">Ticket #${ticketId}</p>
      <p class="ticket-detail" style="color: #999; font-size: 0.9em;">Detalhes não disponíveis no momento</p>
      <button class="btn-remove-ticket" onclick="removeTicketAssociation()">Remover associação</button>
    `;
    ticketInfo.style.display = 'block';
  }
}

function associateTicket() {
  if (!currentModalWorkItemId) return;
  const ticketId = document.getElementById('ticketIdInput').value.trim();
  if (!ticketId) return;

  const wiData = getWorkItemData(currentModalWorkItemId);
  wiData.ticketId = ticketId;
  setWorkItemData(currentModalWorkItemId, wiData);

  // Show ticket info
  const ticketInfo = document.getElementById('ticketInfo');
  ticketInfo.style.display = 'block';
  ticketInfo.innerHTML = '<p style="color:hsl(215,15%,50%);font-size:0.8rem;">Carregando ticket...</p>';
  
  // Carregar sequencialmente com delay para evitar rate limit
  fetchTicketInfo(ticketId).then(() => {
    // Aguardar 500ms antes de buscar comentários
    setTimeout(() => fetchTicketComments(ticketId), 500);
  });

  document.getElementById('ticketIdInput').value = '';
  renderGantt(); // Update badges
}

function removeTicketAssociation() {
  if (!currentModalWorkItemId) return;
  const wiData = getWorkItemData(currentModalWorkItemId);
  wiData.ticketId = null;
  wiData.freshdeskComments = [];
  setWorkItemData(currentModalWorkItemId, wiData);

  document.getElementById('ticketInfo').style.display = 'none';
  renderAnnotations();
  renderGantt();
}

// Buscar comentários do ticket no Freshdesk
async function fetchTicketComments(ticketId) {
  if (!currentModalWorkItemId) return;
  
  console.log(`🔍 Buscando comentários do ticket ${ticketId}...`);
  
  try {
    // Fazer a requisição via Supabase para evitar CORS e proteger a API key
    const res = await fetch(`${SUPABASE_URL}/functions/v1/freshdesk-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get-conversations',
        ticketId: ticketId,
      }),
    });

    console.log('Status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Erro na resposta:', errorText);
      throw new Error(`Erro ao buscar comentários (HTTP ${res.status})`);
    }

    const data = await res.json();
    console.log('Dados recebidos:', data);
    
    // A API retorna um Array diretamente, não dentro de 'results'
    const conversationsArray = Array.isArray(data) ? data : (data.results || data.conversations || []);
    console.log('Conversas encontradas:', conversationsArray.length);

    const comments = conversationsArray.map((conv, index) => ({
      id: conv.id || index,
      body: conv.body_text || conv.body || '',  // Use body_text primeiro (texto limpo)
      createdAt: conv.created_at || new Date().toISOString(),
      author: conv.user_name || conv.from_email || 'Agente',
      isPrivate: conv.private === true,
      incoming: conv.incoming || false,  // incoming = comentário do cliente
    }));

    console.log('Comentários processados:', comments);

    // Salvar comentários no localStorage
    const wiData = getWorkItemData(currentModalWorkItemId);
    wiData.freshdeskComments = comments;
    setWorkItemData(currentModalWorkItemId, wiData);

    console.log('✅ Comentários salvos:', comments.length);
    
    // Re-renderizar anotações para mostrar os comentários
    renderAnnotations();
  } catch (err) {
    console.error('❌ Erro ao buscar comentários do Freshdesk:', err);
  }
}

// ===== ANNOTATIONS =====
async function addAnnotation() {
  if (!currentModalWorkItemId) return;
  const text = document.getElementById('annotationText').value.trim();
  if (!text) return;

  const wiData = getWorkItemData(currentModalWorkItemId);
  if (!wiData.annotations) wiData.annotations = [];
  
  const annotation = {
    id: Date.now(),
    text: text,
    date: new Date().toISOString(),
    sentToAzure: false,
    sentToFreshdesk: false,
  };

  // Save locally first
  wiData.annotations.unshift(annotation);
  setWorkItemData(currentModalWorkItemId, wiData);
  document.getElementById('annotationText').value = '';
  renderAnnotations();
  renderGantt();

  // Send to Azure DevOps as a comment
  try {
    const payload = {
      action: 'add-comment',
      workItemId: currentModalWorkItemId,
      comment: text,
    };
   // console.log('📤 Enviando para Azure:', payload);
    
    const res = await fetch(`${SUPABASE_URL}/functions/v1/azure-work-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const errorText = await res.text();
    //console.log(`📥 Resposta Azure [${res.status}]:`, errorText);
    
    if (res.ok) {
      annotation.sentToAzure = true;
      setWorkItemData(currentModalWorkItemId, wiData);
      renderAnnotations();
      //console.log('✅ Comentário enviado para Azure com sucesso');
    } else {
    //  console.error(`❌ Erro ao enviar para Azure (${res.status}):`, errorText);
    }
  } catch (err) {
   // console.error('❌ Erro ao enviar comentário para Azure:', err);
  }

  // Send to Freshdesk ticket as a note (if ticket is associated)
  if (wiData.ticketId) {
    try {
      const res = await fetch(`${FRESHDESK_DOMAIN}/api/v2/tickets/${wiData.ticketId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(FRESHDESK_API_KEY + ':X'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: text,
          private: true,
        }),
      });
      if (res.ok) {
        annotation.sentToFreshdesk = true;
        setWorkItemData(currentModalWorkItemId, wiData);
        renderAnnotations();
      }
    } catch (err) {
      console.error('Erro ao enviar nota para Freshdesk:', err);
    }
  }
}

function deleteAnnotation(annotId) {
  if (!currentModalWorkItemId) return;
  const wiData = getWorkItemData(currentModalWorkItemId);
  wiData.annotations = (wiData.annotations || []).filter(a => a.id !== annotId);
  setWorkItemData(currentModalWorkItemId, wiData);
  renderAnnotations();
  renderGantt();
}

function renderAnnotations() {
  const list = document.getElementById('annotationsList');
  if (!currentModalWorkItemId) { list.innerHTML = ''; return; }

  const wiData = getWorkItemData(currentModalWorkItemId);
  const annotations = wiData.annotations || [];
  const freshdeskComments = wiData.freshdeskComments || [];

  let html = '';

  // Mostrar comentários do Freshdesk (apenas leitura)
  if (freshdeskComments.length > 0) {
    html += '<div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">';
    html += '<h4 style="margin: 0 0 10px 0; color: #4fc3f7; font-size: 0.95em;">Comentários do Ticket</h4>';
    html += freshdeskComments.map(c => `
      <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 8px; border-left: 3px solid #4fc3f7;">
        <p style="margin: 0 0 4px 0; font-size: 0.85em; color: #666;">
          <strong>${escapeHtml(c.author)}</strong> 
          <span style="color: #999; margin-left: 8px;">${formatDateTime(c.createdAt)}</span>
          ${c.isPrivate ? '<span style="background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 3px; font-size: 0.75em; margin-left: 8px;">Privado</span>' : ''}
        </p>
        <p style="margin: 0; color: #333; font-size: 0.9em; line-height: 1.3;">${escapeHtml(c.body).replace(/\n/g, '<br>')}</p>
      </div>
    `).join('');
    html += '</div>';
  }

  // Mostrar anotações locais
  if (annotations.length === 0) {
    html += '<p class="annotations-empty">Nenhuma anotação local criada ainda.</p>';
  } else {
    if (freshdeskComments.length > 0) {
      html += '<h4 style="margin: 15px 0 10px 0; color: #666; font-size: 0.95em;">✏️ Suas Anotações</h4>';
    }
    html += annotations.map(a => {
      const azureBadge = a.sentToAzure ? '<span class="badge-sent azure">Azure ✓</span>' : '<span class="badge-sent pending">Azure ✗</span>';
      const freshdeskBadge = a.sentToFreshdesk ? '<span class="badge-sent freshdesk">Freshdesk ✓</span>' : '';
      return `
      <div class="annotation-item" style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 8px; border: 1px solid #e0e0e0;">
        <p class="annotation-date" style="margin: 0 0 4px 0; font-size: 0.85em; color: #666;">${formatDateTime(a.date)} ${azureBadge} ${freshdeskBadge}</p>
        <p class="annotation-text" style="margin: 0 0 6px 0; color: #333; font-size: 0.9em; line-height: 1.3;">${escapeHtml(a.text)}</p>
        <button class="btn-delete-annotation" onclick="deleteAnnotation(${a.id})" style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8em;">Deletar</button>
      </div>
    `}).join('');
  }

  list.innerHTML = html;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ===== TOOLTIP =====
function showTooltip(event, id) {
  const wi = allWorkItems.find(w => w.id === id) || filteredItems.find(w => w.id === id);
  if (!wi) return;
  const tip = document.getElementById('tooltip');
  let html = `<p class="tooltip-title">#${wi.id} - ${escapeHtml(wi.title)}</p>`;
  if (wi.boardColumn) html += `<p>Coluna: ${wi.boardColumn}</p>`;
  html += `<p>Responsável: ${wi.assignedTo}</p>`;
  html += `<p>Início: ${formatDate(wi.startDate)}</p>`;
  html += `<p>Previsão: ${formatDate(wi.endDate)}</p>`;
  if (wi.empresa) html += `<p>Empresa: ${wi.empresa}</p>`;
  if (wi.sistema) html += `<p>Sistema: ${wi.sistema}</p>`;
  if (wi.tags) html += `<p>Tags: ${wi.tags}</p>`;

  // Show association info
  const wiData = getWorkItemData(wi.id);
  if (wiData.ticketId) html += `<p>Ticket: #${wiData.ticketId}</p>`;
  const annotCount = (wiData.annotations || []).length;
  if (annotCount > 0) html += `<p>📝 ${annotCount} anotação(ões)</p>`;

  tip.innerHTML = html;
  tip.classList.add('visible');
  moveTooltip(event);
}

function moveTooltip(event) {
  const tip = document.getElementById('tooltip');
  if (!tip) return;
  const padding = 8;
  let left = event.clientX + 12;
  let top = event.clientY - 10;

  const wasVisible = tip.classList.contains('visible');
  if (!wasVisible) tip.style.display = 'block';

  const tipW = tip.offsetWidth || 220;
  const tipH = tip.offsetHeight || 120;

  if (left + tipW + padding > window.innerWidth) left = window.innerWidth - tipW - padding;
  if (top + tipH + padding > window.innerHeight) top = event.clientY - tipH - 12;
  if (top < padding) top = padding;

  tip.style.left = left + 'px';
  tip.style.top = top + 'px';

  if (!wasVisible) tip.style.display = '';
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
            const paginaLogin = `../login/index.html`;   
            
            // Obter o referrer atual
            const referrerAtual = document.referrer;
            
            // Verificar se o referrer está vazio (acesso direto) ou não é o permitido
            if (!referrerAtual || !referrerAtual.includes(referrerPermitido)) {
                // Verificar se não estamos já na página de login para evitar loop infinito
                if (window.location.href !== paginaLogin) {
                    // Redirecionar para a página de login
                    window.location.replace(paginaLogin);
                }
            }
        })();

