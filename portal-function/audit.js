
// Configuração do Supabase para o banco de auditoria fornecido pelo usuário
const AUDIT_SUPABASE_URL = 'https://qmdmlbxjiuykfoptamfv.supabase.co';
const AUDIT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZG1sYnhqaXV5a2ZvcHRhbWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTcwMzEsImV4cCI6MjA4Nzc3MzAzMX0.ALYoN2FaahkLAiropeBBYHiH-LTPwK7x4j_By_nJDRA';

// Cliente específico para operações de auditoria
const auditClient = supabase.createClient(AUDIT_SUPABASE_URL, AUDIT_SUPABASE_KEY);

const auditState = {
    pageSize: 30,
    currentPage: 1,
    totalPages: 1,
    filters: {
        startDate: null,
        endDate: null,
        user: '',
        table: '',
        search: ''
    }
};

// tabela de auditoria que será utilizada; valor inicial e possível fallback
let AUDIT_TABLE = 'audit_log';

// Somente essas tabelas serão exibidas na seção de auditoria
const ALLOWED_TABLES = ['client_documents','clients','cs_contacts','documents_setor','homologacoes','releases','reunioes','status_projetos','tarefas_painel_setor','training_videos'];

// Rótulos amigáveis para exibição
const TABLE_LABELS = {
    client_documents: 'Documentos do Cliente',
    clients: 'Clientes',
    cs_contacts: 'CS',
    documents_setor: 'Documentos do Setor',
    homologacoes: 'Homologações',
    releases: 'Releases',
    reunioes: 'Reuniões',
    status_projetos: 'Status de Projetos',
    tarefas_painel_setor: 'Tarefas do Painel',
    training_videos: 'Vídeos de Treinamento'
};


async function populateAuditFilters() {
    try {
        const userSelect = document.getElementById('auditFilterUser');
        const tableSelect = document.getElementById('auditFilterTable');
        if (!userSelect || !tableSelect) return;

        // Limpa e adiciona opções padrão
        userSelect.innerHTML = '<option value="">Todos</option>';
        tableSelect.innerHTML = '<option value="">Todas</option>';

        // Preenche select de tabelas apenas com as permitidas (rótulos amigáveis)
        ALLOWED_TABLES.slice().sort().forEach(t => {
            const opt = document.createElement('option'); opt.value = t; opt.textContent = TABLE_LABELS[t] || t; tableSelect.appendChild(opt);
        });

        // Busca usuários apenas das tabelas permitidas
        // tenta buscar usuários na tabela atual
        let { data, error } = await auditClient
            .from(AUDIT_TABLE)
            .select('actor_name,actor_identifier')
            .in('table_name', ALLOWED_TABLES)
            .limit(5000);
        if (error && /does not exist/.test(error.message)) {
            // tabela não existe, trocar para system_logs e tentar novamente
            AUDIT_TABLE = 'system_logs';
            ({ data, error } = await auditClient
                .from(AUDIT_TABLE)
                .select('actor_name,actor_identifier')
                .in('table_name', ALLOWED_TABLES)
                .limit(5000));
        }
        if (error) throw error;    
        if (error) throw error;

        const userSet = new Set();
        data.forEach(d => {
            if (d.actor_name) userSet.add(String(d.actor_name).trim());
            if (d.actor_identifier) userSet.add(String(d.actor_identifier).trim());
        });

        const users = [...userSet].filter(Boolean).sort((a,b)=>a.localeCompare(b, 'pt-BR', {sensitivity:'base'}));
        users.forEach(u => {
            const opt = document.createElement('option'); opt.value = u; opt.textContent = u; userSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Erro ao popular filtros de auditoria', err);
    }
} 

async function carregarAuditLogs(page = 1) {
    auditState.currentPage = page;
    const container = document.getElementById('auditLogList');
    const loading = document.getElementById('auditLoading');
    if (!container) return;

    loading.style.display = 'block';
    container.innerHTML = '';

    const startDateEl = document.getElementById('auditFilterStart');
    const endDateEl = document.getElementById('auditFilterEnd');
    const userEl = document.getElementById('auditFilterUser');
    const tableEl = document.getElementById('auditFilterTable');
    const searchEl = document.getElementById('auditFilterSearch');

    auditState.filters.startDate = startDateEl && startDateEl.value ? startDateEl.value : null;
    auditState.filters.endDate = endDateEl && endDateEl.value ? endDateEl.value : null;
    auditState.filters.user = userEl ? userEl.value : '';
    auditState.filters.table = tableEl ? tableEl.value : '';
    auditState.filters.search = searchEl ? searchEl.value.trim() : '';

    try {
        let query = auditClient
            .from(AUDIT_TABLE)
            .select('*', { count: 'exact' })
            .order('changed_at', { ascending: false });

        // Somente registros das tabelas permitidas
        query = query.in('table_name', ALLOWED_TABLES);
        if (auditState.filters.table) {
            // se o usuário escolheu uma tabela específica, usa eq (garantido que esteja dentro das permitidas)
            query = query.eq('table_name', auditState.filters.table);
        }

        if (auditState.filters.startDate) {
            const isoStart = new Date(auditState.filters.startDate).toISOString();
            query = query.gte('changed_at', isoStart);
        }
        if (auditState.filters.endDate) {
            const isoEnd = new Date(auditState.filters.endDate);
            isoEnd.setHours(23,59,59,999);
            query = query.lte('changed_at', isoEnd.toISOString());
        }
        if (auditState.filters.user) {
            // Filtra por actor_name ou actor_identifier para cobrir ambas as possibilidades
            const userValue = auditState.filters.user.replace(/'/g, "''");
            query = query.or(`actor_name.eq.${userValue},actor_identifier.eq.${userValue}`);
        }
        if (auditState.filters.table) {
            query = query.eq('table_name', auditState.filters.table);
        }
        if (auditState.filters.search) {
            const s = `%${auditState.filters.search}%`;
            query = query.or(`actor_name.ilike.${s},table_name.ilike.${s},operation.ilike.${s}`);
        }

        const start = (auditState.currentPage - 1) * auditState.pageSize;
        const end = start + auditState.pageSize - 1;
        const { data, error, count } = await query.range(start, end);

        if (error) throw error;
        loading.style.display = 'none';

        if (!data || data.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Nenhum registro de alteração encontrado.</td></tr>';
            auditState.totalPages = 1;
            renderAuditPagination();
            return;
        }

        auditState.totalPages = Math.max(1, Math.ceil((count || data.length) / auditState.pageSize));

        data.forEach(log => {
            const row = document.createElement('tr');
            const dataFormatada = log.changed_at ? new Date(log.changed_at).toLocaleString('pt-BR') : '---';
            let opBadge = '';
            switch ((log.operation || '').toUpperCase()) {
                case 'INSERT': opBadge = '<span class="badge-op badge-insert">INSERÇÃO</span>'; break;
                case 'UPDATE': opBadge = '<span class="badge-op badge-update">ALTERAÇÃO</span>'; break;
                case 'DELETE': opBadge = '<span class="badge-op badge-delete">EXCLUSÃO</span>'; break;
                default: opBadge = `<span class="badge-op">${log.operation}</span>`;
            }
            row.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${TABLE_LABELS[log.table_name] || log.table_name || '---'}</td>
                <td>${opBadge}</td>
                <td>${log.actor_name || log.actor_identifier || 'Sistema'}</td>
                <td>${log.record_id || '---'}</td>
                <td>
                    <button class="btn-ver-detalhes" onclick='verDetalhesAudit(${JSON.stringify(log).replace(/'/g, "&apos;")})'>
                        <i class="fas fa-eye"></i> Detalhes
                    </button>
                </td>
            `;
            container.appendChild(row);
        });

        renderAuditPagination();
    } catch (error) {
        console.error('Erro ao carregar logs de auditoria:', error);
        loading.style.display = 'none';
        container.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: red;">Erro ao carregar dados: ${error.message}</td></tr>`;
    }
}

function renderAuditPagination() {
    const info = document.getElementById('auditPageInfo');
    const prev = document.getElementById('auditPrevPage');
    const next = document.getElementById('auditNextPage');
    if (info) info.textContent = `Página ${auditState.currentPage} de ${auditState.totalPages}`;
    if (prev) prev.disabled = auditState.currentPage <= 1;
    if (next) next.disabled = auditState.currentPage >= auditState.totalPages;
}

function setupAuditControls() {
    if (auditState.controlsSetup) return; // evita múltiplas binds
    const prev = document.getElementById('auditPrevPage');
    const next = document.getElementById('auditNextPage');
    if (prev) prev.addEventListener('click', () => { if (auditState.currentPage > 1) carregarAuditLogs(auditState.currentPage - 1); });
    if (next) next.addEventListener('click', () => { if (auditState.currentPage < auditState.totalPages) carregarAuditLogs(auditState.currentPage + 1); });

    ['auditFilterStart','auditFilterEnd','auditFilterUser','auditFilterTable','auditFilterSearch'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => carregarAuditLogs(1));
            el.addEventListener('keyup', (e)=> { if (e.key === 'Enter') carregarAuditLogs(1); });
        }
    });

    const clear = document.getElementById('auditClearFilters');
    if (clear) clear.addEventListener('click', () => {
        ['auditFilterStart','auditFilterEnd','auditFilterSearch'].forEach(id=>{ const el = document.getElementById(id); if (el) el.value=''; });
        const selUser = document.getElementById('auditFilterUser'); if (selUser) selUser.value='';
        const selTable = document.getElementById('auditFilterTable'); if (selTable) selTable.value='';
        carregarAuditLogs(1);
    });
    auditState.controlsSetup = true;
} 

function verDetalhesAudit(log) {
    const modal = document.getElementById('auditDetailModal');
    const content = document.getElementById('auditDetailContent');

    if (!modal || !content) return;

    let html = `
        <div class="audit-detail-grid">
            <div class="audit-detail-item"><strong>Tabela:</strong> ${log.table_name}</div>
            <div class="audit-detail-item"><strong>Operação:</strong> ${log.operation}</div>
            <div class="audit-detail-item"><strong>ID do Registro:</strong> ${log.record_id}</div>
            <div class="audit-detail-item"><strong>Realizado por:</strong> ${log.actor_name || log.actor_identifier || 'N/A'}</div>
            <div class="audit-detail-item"><strong>Data/Hora:</strong> ${new Date(log.changed_at).toLocaleString('pt-BR')}</div>
        </div>
        <div class="audit-payloads">
            <div class="payload-box">
                <h4>Dados Anteriores</h4>
                <pre>${log.payload_old ? JSON.stringify(log.payload_old, null, 2) : 'Nenhum dado anterior'}</pre>
            </div>
            <div class="payload-box">
                <h4>Novos Dados</h4>
                <pre>${log.payload_new ? JSON.stringify(log.payload_new, null, 2) : 'Nenhum dado novo'}</pre>
            </div>
        </div>
    `;

    content.innerHTML = html;
    modal.style.display = 'block';
}

function fecharModalAudit() {
    const modal = document.getElementById('auditDetailModal');
    if (modal) modal.style.display = 'none';
}

// Fechar modal ao clicar fora dele
window.onclick = function (event) {
    const modal = document.getElementById('auditDetailModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

(function () {
    // Integrar com a função showTab existente (isolado para evitar conflitos globais)
    const originalShowTab = window.showTab;
    window.showTab = function (tabId) {
        if (typeof originalShowTab === 'function') {
            originalShowTab(tabId);
        }

        if (tabId === 'audit-log') {
            populateAuditFilters();
            setupAuditControls();
            carregarAuditLogs(1);
        }
    };
})();
