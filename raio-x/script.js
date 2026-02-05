if (!window.raioXApp) {
  window.raioXApp = {};

  // Supabase Configuration
  const SUPABASE_URL = 'https://obwgegvrtxrlombmkaej.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2dlZ3ZydHhybG9tYm1rYWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NDcxOTMsImV4cCI6MjA2NDAyMzE5M30.0Ng21Ywqrm6eDqbclFyeOhARpJCyWvX7b-0dJLE1QwM'; 

  if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  const supabase = window.supabaseClient;

// Options for checkboxes
const MODULOS_OPTIONS = ['SING', 'Telemetria', 'E-trip', 'Planilha Frota', 'BI-Telemetria', 'OPTZ-Frota', 'OPTZ-Motorista'];
const INTEGRACOES_OPTIONS = ['RJ', 'Sigla', 'Cittati', 'Praxio', 'Globus', 'YUV', 'Smartbus', 'Contartec', 'Detro', 'Impetus', 'Motora', 'ANTT', 'Outros'];
const OBJETIVOS_OPTIONS = ['Reduzir Custos', 'Controle de Processos', 'Gestão Operacional', 'Segurança'];
const RISCOS_OPTIONS = ['Resistente à mudança', 'Pouca Disponibilidade', 'Dados Desorganizados', 'Time não definido', 'Infraestrutura inadequada', 'Falta de apoio da gestão'];
const FASES_DEFAULT = ['KickOff', 'Parametrização', 'Treinamento', 'Validação', 'Go-Live'];

// State
let implantacoes = [];
let raioXData = null;
let selectedClient = '';
let responsaveis = [];

// DOM Elements
const loadingEl = document.getElementById('loading');
const emptyStateEl = document.getElementById('empty-state');
const contentEl = document.getElementById('content');
const clientHeaderEl = document.getElementById('client-header');
const progressSectionEl = document.getElementById('progress-section');
const cardsGridEl = document.getElementById('cards-grid');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const clientSelect = document.getElementById('client-select');
const btnCadastrar = document.getElementById('btn-cadastrar');
const btnCadastrarText = document.getElementById('btn-cadastrar-text');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const raioXForm = document.getElementById('raio-x-form');
const addResponsavelBtn = document.getElementById('add-responsavel');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  initCheckboxes();
  await fetchImplantacoes();
  setupEventListeners();
}

function initCheckboxes() {
  renderCheckboxGroup('objetivos-checkboxes', OBJETIVOS_OPTIONS, 'objetivo');
  renderCheckboxGroup('riscos-checkboxes', RISCOS_OPTIONS, 'risco');
  renderCheckboxGroup('modulos-checkboxes', MODULOS_OPTIONS, 'modulo');
  renderCheckboxGroup('integracoes-checkboxes', INTEGRACOES_OPTIONS, 'integracao');
}

function renderCheckboxGroup(containerId, options, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML = options.map((option, i) => `
    <div class="checkbox-item">
      <input type="checkbox" id="${prefix}-${i}" name="${prefix}" value="${option}">
      <label for="${prefix}-${i}">${option}</label>
    </div>
  `).join('');
}

function setupEventListeners() {
  searchInput.addEventListener('input', updateClientSelect);
  statusFilter.addEventListener('change', updateClientSelect);
  clientSelect.addEventListener('change', handleClientChange);
  btnCadastrar.addEventListener('click', openModal);
  document.getElementById('btn-gerar-pdf').addEventListener('click', gerarPDF);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  raioXForm.addEventListener('submit', handleFormSubmit);
  addResponsavelBtn.addEventListener('click', addResponsavel);
}

async function fetchImplantacoes() {
  showLoading(true);
  
  const { data, error } = await supabase
    .from('painel_implantacoes')
    .select('*')
    .order('empresa');

  if (error) {
    console.error('Error fetching implantacoes:', error);
    alert('Erro ao carregar implantações');
  } else {
    implantacoes = data || [];
    updateClientSelect();
  }
  
  showLoading(false);
}

function updateClientSelect() {
  const search = searchInput.value.toLowerCase();
  const status = statusFilter.value;
  
  const filtered = implantacoes.filter(imp => 
    imp.empresa.toLowerCase().includes(search) &&
    (status === 'all' || imp.status === status)
  );
  
  clientSelect.innerHTML = '<option value="">Selecione um cliente</option>' +
    filtered.map(imp => `
      <option value="${imp.id}">${imp.empresa} - ${imp.status}</option>
    `).join('');
  
  // Reset selection if current client not in filtered list
  if (selectedClient && !filtered.find(imp => imp.id.toString() === selectedClient)) {
    selectedClient = '';
    clientSelect.value = '';
    showEmptyState();
  }
}

async function handleClientChange(e) {
  selectedClient = e.target.value;
  
  if (!selectedClient) {
    showEmptyState();
    btnCadastrar.classList.add('hidden');
    document.getElementById('btn-gerar-pdf').classList.add('hidden');
    return;
  }
  
  await fetchRaioX();
  renderContent();
  btnCadastrar.classList.remove('hidden');
  document.getElementById('btn-gerar-pdf').classList.remove('hidden');
}

async function fetchRaioX() {
  const { data, error } = await supabase
    .from('raio_x')
    .select('*')
    .eq('implantacao_id', parseInt(selectedClient))
    .maybeSingle();

  if (error) {
    console.error('Error fetching raio_x:', error);
    raioXData = null;
  } else {
    raioXData = data;
  }
  
  btnCadastrarText.textContent = raioXData ? 'Editar Raio X' : 'Cadastrar Raio X';
}

function showLoading(show) {
  loadingEl.classList.toggle('hidden', !show);
  emptyStateEl.classList.add('hidden');
  contentEl.classList.add('hidden');
}

function showEmptyState() {
  loadingEl.classList.add('hidden');
  emptyStateEl.classList.remove('hidden');
  contentEl.classList.add('hidden');
}

function renderContent() {
  loadingEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
  
  const implantacao = implantacoes.find(imp => imp.id.toString() === selectedClient);
  if (!implantacao) return;
  
  renderHeader(implantacao);
  renderProgress(implantacao);
  renderCards();
}

function renderHeader(imp) {
  const statusClass = imp.status.toLowerCase().replace(' ', '-');
  const logoHtml = imp.logo_url 
    ? `<img src="${imp.logo_url}" alt="${imp.empresa}" class="client-logo">`
    : `<div class="client-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
        </svg>
      </div>`;

  const goLiveDate = imp.updated_at ? new Date(imp.updated_at).toLocaleDateString('pt-BR') : 'A definir';

  clientHeaderEl.innerHTML = `
    <div class="client-header-content">
      <div class="client-info">
        ${logoHtml}
        <div>
          <h1 class="client-name">${imp.empresa}</h1>
          <p class="client-project">${imp.projeto}</p>
          <div class="client-badges">
            <span class="badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Gestor: ${imp.gestor}
            </span>
            <span class="badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              ${imp.sistema}
            </span>
          </div>
        </div>
      </div>
      <div class="client-meta">
        <div class="go-live-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <div>
            <span>GO-LIVE</span>
            <strong>${goLiveDate}</strong>
          </div>
        </div>
        <span class="status-badge ${statusClass}">${imp.status.toUpperCase()}</span>
      </div>
    </div>
  `;
}

function renderProgress(imp) {
  const progresso = imp.progresso || 0;
  const fases = imp.fases;
  
  const getFaseStatus = (index) => {
    if (fases && fases[index]) {
      return fases[index].status;
    }
    const progressoFase = (progresso / 100) * FASES_DEFAULT.length;
    if (index < progressoFase - 1) return 'Concluído';
    if (index < progressoFase) return 'Em andamento';
    return 'Pendente';
  };
  
  const phasesHtml = FASES_DEFAULT.map((fase, index) => {
    const status = getFaseStatus(index);
    const statusClass = status.toLowerCase().replace(' ', '-');
    
    let iconHtml;
    if (status === 'Concluído') {
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (status === 'Em andamento') {
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    } else {
      iconHtml = `<span style="width: 12px; height: 12px; border-radius: 50%; background: rgba(0,0,0,0.1);"></span>`;
    }
    
    return `
      <div class="phase">
        <div class="phase-icon ${statusClass}">${iconHtml}</div>
        <span class="phase-name">${fase}</span>
        <span class="phase-status ${statusClass}">${status}</span>
      </div>
    `;
  }).join('');
  
  progressSectionEl.innerHTML = `
    <div class="progress-header">
      <div class="progress-header-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <h3>Status da Implantação</h3>
      </div>
      <span>${progresso}% concluído</span>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: ${progresso}%"></div>
    </div>
    <div class="phases-container">${phasesHtml}</div>
  `;
}

function renderCards() {
  const objetivos = raioXData?.objetivos_cliente || [];
  const riscos = raioXData?.riscos_alertas || [];
  const modulos = raioXData?.modulos_contratados || [];
  const integracoes = raioXData?.integracoes || [];
  const responsaveisData = raioXData?.responsaveis || [];
  const observacoes = raioXData?.observacoes_comerciais || '';
  
  const objetivosHtml = objetivos.length > 0 
    ? `<div class="tags-container">${objetivos.map((obj, i) => `<span class="tag objetivo-${(i % 4) + 1}">${obj}</span>`).join('')}</div>`
    : '<p class="empty-card-text">Nenhum objetivo cadastrado</p>';
  
  const riscosHtml = riscos.length > 0
    ? `<ul>${riscos.map(r => `<li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--warning);"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${r}</li>`).join('')}</ul>`
    : '<p class="empty-card-text">Nenhum risco cadastrado</p>';
  
  const modulosHtml = modulos.length > 0
    ? `<div class="tags-container">${modulos.map(m => `<span class="tag">${m}</span>`).join('')}</div>`
    : '<p class="empty-card-text">Nenhum módulo cadastrado</p>';
  
  const integracoesHtml = integracoes.length > 0
    ? `<ul>${integracoes.map(i => `<li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--success);"><polyline points="20 6 9 17 4 12"/></svg>${i}</li>`).join('')}</ul>`
    : '<p class="empty-card-text">Nenhuma integração cadastrada</p>';
  
  const responsaveisHtml = responsaveisData.length > 0
    ? responsaveisData.map(r => `
        <div class="responsavel-card">
          <div class="responsavel-name">${r.nome}</div>
          <div class="responsavel-cargo">${r.cargo}</div>
          <div class="responsavel-contact">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            ${r.email}
          </div>
          <div class="responsavel-contact">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${r.telefone}
          </div>
        </div>
      `).join('')
    : '<p class="empty-card-text">Nenhum responsável cadastrado</p>';
  
  const observacoesHtml = observacoes 
    ? `<p style="font-size: 0.875rem; color: var(--muted-foreground);">${observacoes}</p>`
    : '<p class="empty-card-text">Nenhuma observação cadastrada</p>';

  cardsGridEl.innerHTML = `
    <div class="info-card">
      <div class="info-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <h4>Objetivos do Cliente</h4>
      </div>
      ${objetivosHtml}
    </div>
    
    <div class="info-card">
      <div class="info-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <h4>Riscos e Alertas</h4>
      </div>
      ${riscosHtml}
    </div>
    
    <div class="info-card">
      <div class="info-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        <h4>Módulos Contratados</h4>
      </div>
      ${modulosHtml}
    </div>
    
    <div class="info-card">
      <div class="info-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <h4>Integrações</h4>
      </div>
      ${integracoesHtml}
    </div>
    
    <div class="info-card">
      <div class="info-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <h4>Responsáveis</h4>
      </div>
      ${responsaveisHtml}
    </div>
    
    <div class="info-card">
      <div class="info-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
        <h4>Observações Comerciais</h4>
      </div>
      ${observacoesHtml}
    </div>
  `;
}

function openModal() {
  modalTitle.textContent = raioXData ? 'Editar Raio X' : 'Cadastrar Raio X';
  
  // Reset form
  raioXForm.reset();
  
  // Populate form if editing
  if (raioXData) {
    // Check objetivos
    (raioXData.objetivos_cliente || []).forEach(obj => {
      const checkbox = document.querySelector(`input[name="objetivo"][value="${obj}"]`);
      if (checkbox) checkbox.checked = true;
    });
    
    // Check riscos
    (raioXData.riscos_alertas || []).forEach(risco => {
      const checkbox = document.querySelector(`input[name="risco"][value="${risco}"]`);
      if (checkbox) checkbox.checked = true;
    });
    
    // Check modulos
    (raioXData.modulos_contratados || []).forEach(modulo => {
      const checkbox = document.querySelector(`input[name="modulo"][value="${modulo}"]`);
      if (checkbox) checkbox.checked = true;
    });
    
    // Check integracoes
    (raioXData.integracoes || []).forEach(integracao => {
      const checkbox = document.querySelector(`input[name="integracao"][value="${integracao}"]`);
      if (checkbox) checkbox.checked = true;
    });
    
    // Set responsaveis
    responsaveis = raioXData.responsaveis || [];
    
    // Set observacoes
    document.getElementById('observacoes').value = raioXData.observacoes_comerciais || '';
  } else {
    responsaveis = [];
  }
  
  renderResponsaveisForm();
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

function addResponsavel() {
  responsaveis.push({ nome: '', cargo: '', email: '', telefone: '' });
  renderResponsaveisForm();
}

function removeResponsavel(index) {
  responsaveis.splice(index, 1);
  renderResponsaveisForm();
}

function renderResponsaveisForm() {
  const container = document.getElementById('responsaveis-container');
  container.innerHTML = responsaveis.map((resp, i) => `
    <div class="responsavel-form">
      <div class="responsavel-form-header">
        <span>Responsável ${i + 1}</span>
        <button type="button" class="btn-remove" onclick="removeResponsavel(${i})">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
      <div class="responsavel-form-grid">
        <input type="text" name="resp-nome-${i}" placeholder="Nome" value="${resp.nome}" onchange="updateResponsavel(${i}, 'nome', this.value)">
        <input type="text" name="resp-cargo-${i}" placeholder="Cargo" value="${resp.cargo}" onchange="updateResponsavel(${i}, 'cargo', this.value)">
        <input type="email" name="resp-email-${i}" placeholder="E-mail" value="${resp.email}" onchange="updateResponsavel(${i}, 'email', this.value)">
        <input type="tel" name="resp-telefone-${i}" placeholder="Telefone" value="${resp.telefone}" onchange="updateResponsavel(${i}, 'telefone', this.value)">
      </div>
    </div>
  `).join('');
}

function updateResponsavel(index, field, value) {
  responsaveis[index][field] = value;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const objetivos = Array.from(document.querySelectorAll('input[name="objetivo"]:checked')).map(el => el.value);
  const riscos = Array.from(document.querySelectorAll('input[name="risco"]:checked')).map(el => el.value);
  const modulos = Array.from(document.querySelectorAll('input[name="modulo"]:checked')).map(el => el.value);
  const integracoes = Array.from(document.querySelectorAll('input[name="integracao"]:checked')).map(el => el.value);
  const observacoes = document.getElementById('observacoes').value;
  
  const payload = {
    implantacao_id: parseInt(selectedClient),
    objetivos_cliente: objetivos,
    riscos_alertas: riscos,
    modulos_contratados: modulos,
    integracoes: integracoes,
    responsaveis: responsaveis,
    observacoes_comerciais: observacoes
  };
  
  let error;
  
  if (raioXData) {
    // Update
    const result = await supabase
      .from('raio_x')
      .update(payload)
      .eq('id', raioXData.id);
    error = result.error;
    
    if (!error) {
      raioXData = { ...raioXData, ...payload };
      alert('Raio X atualizado com sucesso!');
    }
  } else {
    // Insert
    const result = await supabase
      .from('raio_x')
      .insert(payload)
      .select()
      .single();
    error = result.error;
    
    if (!error) {
      raioXData = result.data;
      alert('Raio X cadastrado com sucesso!');
    }
  }
  
  if (error) {
    console.error('Error saving raio_x:', error);
    alert('Erro ao salvar Raio X');
  } else {
    btnCadastrarText.textContent = 'Editar Raio X';
    renderCards();
    closeModal();
  }
}

async function gerarPDF() {
  if (!selectedClient) {
    alert('Selecione um cliente primeiro');
    return;
  }

  const implantacao = implantacoes.find(imp => imp.id.toString() === selectedClient);
  if (!implantacao) return;

  const element = document.getElementById('content');
  const opt = {
    margin: 10,
    filename: `Raio_X_${implantacao.empresa.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  try {
    html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF');
  }
}

}
