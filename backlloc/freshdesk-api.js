/**
 * Freshdesk API — Proxy via Edge Function
 * Todas as chamadas passam pelo proxy seguro do Lovable Cloud
 */

const SUPABASE_URL = 'https://izlrszfkukxvttrcbxec.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bHJzemZrdWt4dnR0cmNieGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDc2NjEsImV4cCI6MjA4ODcyMzY2MX0.gAFO5l96F4-Lp7FHXnq2fgWjnu6AAOph7LWM26CrgY8';

const STATUS_MAP = {
  2: 'Aberto',
  3: 'Pendente',
  4: 'Resolvido',
  5: 'Fechado',
  6: 'Aguardando Cliente',
  7: 'Em Progresso',
};

const PRIORITY_MAP = {
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
  4: 'Urgente',
};

const BACKLOG_IDS_KEY = 'backlog_ticket_ids';
const HISTORY_KEY = 'backlog_ticket_history';

// ---- API Call via Edge Function Proxy ----

async function callFreshdesk(endpoint, params) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/freshdesk-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ endpoint, params }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json();
}

// ---- Tickets ----

async function getTicketById(id) {
  try {
    return await callFreshdesk(`/api/v2/tickets/${id}`);
  } catch {
    return null;
  }
}

async function getTicketsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const results = await Promise.all(ids.map(id => getTicketById(id)));
  return results.filter(t => t !== null && t.id);
}

// ---- Agents, Groups, Companies ----

async function getAgents() {
  try {
    const data = await callFreshdesk('/api/v2/agents');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getGroups() {
  try {
    const data = await callFreshdesk('/api/v2/groups');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getCompanies() {
  try {
    const data = await callFreshdesk('/api/v2/companies');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ---- LocalStorage: Backlog IDs ----

function getBacklogIds() {
  const raw = localStorage.getItem(BACKLOG_IDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveBacklogIds(ids) {
  localStorage.setItem(BACKLOG_IDS_KEY, JSON.stringify(ids));
}

function addBacklogId(id) {
  const ids = getBacklogIds();
  if (!ids.includes(id)) {
    ids.push(id);
    saveBacklogIds(ids);
  }
}

function removeBacklogId(id) {
  const ids = getBacklogIds().filter(i => i !== id);
  saveBacklogIds(ids);
}

// ---- LocalStorage: History ----

function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

function addHistoryEntry(entry) {
  const history = getHistory();
  history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getTicketHistory(ticketId) {
  return getHistory().filter(e => e.ticketId === ticketId);
}

// ---- Week Range ----

function getWeekRange(offset) {
  offset = offset || 0;
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}
