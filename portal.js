    (function(){
      emailjs.init("4DvVlBCto4HMC88CF");
   })();
const PDF_SERVER_URL = 'https://servis-pdf.onrender.com';
let permissoes = [];
try {
  permissoes = JSON.parse(localStorage.getItem('permissoes')) || [];
} catch (e) {
  permissoes = [];
}
if (!sessionStorage.getItem('tryvia_logged')) {
window.location.href = 'https://tryvia.github.io/dev/tryvia_portal_dev.html';
sessionStorage.setItem('tryvia_logged', 'true');
}
   // Função para exibir apenas a data (dd/mm/aaaa), ignorando horário UTC
function formatDateOnlyBR(dateString) {
    if (!dateString) return 'Não informada';
    const match = dateString.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) {
        const [ano, mes, dia] = match[0].split('-');
        return `${dia}/${mes}/${ano}`;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}
// Funções auxiliares para manipulação de datas sem problemas de fuso horário
function formatDateForInput(dateString) {
    if (!dateString) return "";
    
    // Se a data já está no formato YYYY-MM-DD, retorna diretamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    
    // Para datas ISO, extrair apenas a parte da data
    if (dateString.includes("T")) {
        return dateString.split("T")[0];
    }
    
    // Para outras datas, criar a data e extrair os componentes manualmente
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
}
let currentProducts = []; 
currentProducts = [];




// Função global para formatar data/hora com ajuste de fuso horário
function formatDateTimeForDisplay(dateString) {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
    });
}
// Função para popular responsáveis no formulário de nova reunião
function populateReuniaoResponsaveis() {
    const responsaveis = [
        "Julyana",
        "Marlos",
        "Renata",
        "Larissa",
    ];
    const select = document.getElementById('reuniaoResponsavel');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um responsável...</option>';
    responsaveis.forEach(resp => {
        select.innerHTML += `<option value="${resp}">${resp}</option>`;
    });
}
// Função para carregar tarefas do setor do usuário logado
async function carregarTarefas() {
    const setorUsuario = sessionStorage.getItem("setor");
    const { data, error } = await releaseClient
        .from('tarefas_painel_setor')
        .select('*')
        .eq('setor', setorUsuario);

    if (error) {
        console.error('Erro ao buscar tarefas:', error.message);
        return;
    }

    const grid = document.getElementById('tarefasGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color: #888; grid-column: 1 / -1; text-align: center;">Nenhuma tarefa encontrada para este setor.</p>';
        return;
    }
    
    const tipoMap = {
        'treinamentos': { icon: 'fa-graduation-cap', label: 'Treinamentos', id: 'treinamentos' },
        'migracoes': { icon: 'fa-exchange-alt', label: 'Migrações', id: 'migracoes' },
        'reunioes': { icon: 'fa-users', label: 'Reuniões', id: 'reunioes' },
        'mvp': { icon: 'fa-trophy', label: 'MVP', id: 'mvp' },
        'homologacoes': { icon: 'fa-check-circle', label: 'Homologações', id: 'homologacoes' },
        'acompanhamentos': { icon: 'fa-handshake', label: 'Acompanhamentos', id: 'acompanhamentos' },
        'implantacoes': { icon: 'fa-cogs', label: 'Implantações', id: 'implantacoes' },
        'projetos': { icon: 'fa-star', label: 'Projetos em andamento', id: 'projetos' },
        'tickets': { icon: 'fa-ticket-alt', label: 'Tickets', id: 'tickets' }
    };
    data.forEach(tarefa => {
        let tipo = tarefa.tipo ? tarefa.tipo.trim() : '';
        let info = tipoMap[tipo];
        let icon = info ? info.icon : 'fa-tasks';
        let label = info ? info.label : tipo || 'Tipo não informado';
        
        let id = info ? info.id : 'tarefa-' + tipo.toLowerCase().replace(/[^a-z0-9]/g, '-');
        grid.innerHTML += `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                    <i class="fas ${icon}" style="color: #4fc3f7; font-size: 1.5em; margin-right: 8px;"></i>
                    <span style="color: #4fc3f7; font-weight: bold;">${label}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <button onclick="alterarQuantidade('${id}','${tipo}', -1)" style="background: #f44336; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 14px;">-</button>
                    <div id="${id}-count" style="font-size: 2em; font-weight: bold; color: #000;">${tarefa.quantidade || 0}</div>
                    <button onclick="alterarQuantidade('${id}','${tipo}', 1)" style="background: #4caf50; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 14px;">+</button>
                </div>
            </div>
        `;
    });
}

// Função para carregar projetos do setor do usuário logado
async function carregarProjetos() {
    const setorUsuario = sessionStorage.getItem("setor");
    const { data, error } = await releaseClient
        .from('projetos_painel_setor')
        .select('*')
        .eq('setor', setorUsuario);

    if (error) {
        console.error('Erro ao buscar projetos:', error.message);
        return;
    }
    const container = document.getElementById('projetosList');
    if (!container) return;
    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: #888;">Nenhum projeto encontrado para este setor.</p>';
        return;
    }
    data.forEach(projeto => {
        container.innerHTML += `<div class="projeto-item"><strong>${projeto.nome}</strong><br>${projeto.descricao || ''}</div>`;
    });
}

function formatDateOnlyBR(dateString) {
    if (!dateString) return 'Não informada';
    const match = dateString.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) {
        const [ano, mes, dia] = match[0].split('-');
        return `${dia}/${mes}/${ano}`;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Exemplo de uso da função formatDateOnlyBR:
// const dataInicio = visita.data_inicio ? formatDateOnlyBR(visita.data_inicio) : 'Não informada';
// const dataFim = visita.data_fim ? formatDateOnlyBR(visita.data_fim) : 'Não informada';

let teamMembers = []; // Variável global para armazenar os membros da equipe

// Função para carregar membros do setor do usuário logado
async function carregarMembros() {
    const setorUsuario = sessionStorage.getItem("setor");
    const { data, error } = await releaseClient
        .from("membros")
        .select("*")
        .eq("setor", setorUsuario);

    if (error) {
        console.error("Erro ao buscar membros:", error.message);
        return;
    }
    const container = document.getElementById("membrosList");
    if (!container) return;
    container.innerHTML = "";
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: #888;">Nenhum membro encontrado para este setor.</p>';
        teamMembers = []; // Limpa a lista se não houver membros
        return;
    }
    teamMembers = data; // Armazena os membros na variável global
    data.forEach(membro => {
        container.innerHTML += `<div class="membro-item"><strong>${membro.nome}</strong><br>${membro.cargo || ""}</div>`;
    });
}

// Função para carregar visitas do setor do usuário logado
async function carregarVisitas() {
    const setorUsuario = sessionStorage.getItem("setor");
    const { data, error } = await releaseClient
        .from('visitas')
        .select('*')
        .eq('setor', setorUsuario);

    if (error) {
        console.error('Erro ao buscar visitas:', error.message);
        return;
    }
    const container = document.getElementById('visitasList');
    if (!container) return;
    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: #888;">Nenhuma visita encontrada para este setor.</p>';
        return;
    }
    data.forEach(visita => {
        container.innerHTML += `<div class="visita-item"><strong>${visita.titulo}</strong><br>${visita.descricao || ''}</div>`;
    });
}

// Função para carregar entregas do setor do usuário logado
async function carregarEntregas() {
    const setorUsuario = sessionStorage.getItem("setor");
    
    // Primeiro, garantir que os membros da equipe sejam carregados da tabela 'time'
    await loadTimeData();
    
    // Buscar entregas da tabela 'entregas' e os percentuais dos membros da 'entregas_membros'
    const { data: entregasData, error: entregasError } = await releaseClient
        .from("entregas_painel_setor")
        .select("id, mes, ano, percentual_setor, entregas_membros_painel_setor(membro_id, percentual)")
        .eq("setor", setorUsuario)
        .eq("ano", new Date().getFullYear());

    if (entregasError) {
        console.error("Erro ao buscar entregas:", entregasError.message);
        return;
    }
    
    // Verificar se há membros da equipe carregados
    if (!teamMembers || teamMembers.length === 0) {
        const tableHeader = document.getElementById("entregasTableHeader");
        const tableBody = document.getElementById("entregasTableBody");
        if (tableHeader) tableHeader.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">Nenhum membro da equipe encontrado para este setor.</td></tr>';
        if (tableBody) tableBody.innerHTML = '';
        return;
    }
    
    // Gerar cabeçalhos da tabela dinamicamente com base nos membros da equipe
    const tableHeader = document.getElementById("entregasTableHeader");
    const tableBody = document.getElementById("entregasTableBody");
    
    if (!tableHeader || !tableBody) return;
    
    let tableHeaders = '<tr><th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Mês</th>';
    let memberColumns = {};
    teamMembers.forEach(member => {
        const firstName = member.nome.split(' ')[0]; // Pega apenas o primeiro nome
        tableHeaders += `<th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${firstName}</th>`;
        memberColumns[member.id] = firstName; // Mapeia ID do membro para primeiro nome
    });
    tableHeaders += '<th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">% SETOR</th></tr>';
    
    tableHeader.innerHTML = tableHeaders;

    if (!entregasData || entregasData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="' + (Object.keys(memberColumns).length + 2) + '" style="text-align: center; padding: 20px; color: #888;">Nenhuma entrega encontrada para este setor.</td></tr>';
        return;
    }

    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const monthNumberMap = {
        1: 'JAN', 2: 'FEV', 3: 'MAR', 4: 'ABR', 5: 'MAI', 6: 'JUN',
        7: 'JUL', 8: 'AGO', 9: 'SET', 10: 'OUT', 11: 'NOV', 12: 'DEZ'
    };

    let tableRows = '';


    months.forEach((month, index) => {
        const entregaMes = entregasData.find(e => e.mes === (index + 1));
        tableRows += `<tr><td style="padding: 10px; font-weight: bold;">${month}</td>`;


        // Calcular média do setor
        let somaPercentuais = 0;
        let membrosComValor = 0;

        teamMembers.forEach(member => {
            const memberEntrega = entregaMes && entregaMes.entregas_membros_painel_setor ?
                entregaMes.entregas_membros_painel_setor.find(em => em.membro_id === member.id) : null;
            let percentage = '-';
            if (memberEntrega && memberEntrega.percentual !== null && memberEntrega.percentual !== undefined && memberEntrega.percentual !== '') {
                percentage = `${memberEntrega.percentual}%`;
                let valor = parseFloat(memberEntrega.percentual);
                if (!isNaN(valor)) {
                    somaPercentuais += valor;
                    membrosComValor++;
                }
            }
            tableRows += `<td style="padding: 10px; text-align: center;">${percentage}</td>`;
        });

        // Calcular média do setor
        let mediaSetor = 0;
        if (membrosComValor > 0) {
            mediaSetor = somaPercentuais / membrosComValor;
        }
        let setorPercentage = `${Math.round(mediaSetor)}%`;
        let setorStyle = 'padding: 10px; text-align: center;';
        if (mediaSetor > 0) {
            if (mediaSetor >= 90) {
                setorStyle += ' background-color: #4caf50; color: white; font-weight: bold;'; // Verde
            } else if (mediaSetor >= 70) {
                setorStyle += ' background-color: #ff9800; color: white; font-weight: bold;'; // Laranja
            } else {
                setorStyle += ' background-color: #f44336; color: white; font-weight: bold;'; // Vermelho
            }
        }
        tableRows += `<td style="${setorStyle}">${setorPercentage}</td>`;
        tableRows += '</tr>';
    });

    tableBody.innerHTML = tableRows;
}
// Função global para popular o select de clientes na aba reuniões
function populateReuniaoClientes() {
  const select = document.getElementById('reuniaoCliente');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione um cliente...</option>';
  if (!window.clients || !Array.isArray(window.clients)) return;
  const sortedClients = [...window.clients].sort((a, b) => a.name.localeCompare(b.name));
  sortedClients.forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

// Função para popular o select de clientes na aba release
function populateReleaseClientes() {
  const select = document.getElementById('releaseClient');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione um cliente...</option>';
  if (!window.clients || !Array.isArray(window.clients)) return;
  const sortedClients = [...window.clients].sort((a, b) => a.name.localeCompare(b.name));
  sortedClients.forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

// Função para buscar tickets do Freshdesk
async function fetchFreshdeskTickets(clientName) {
    try {
        const response = await fetch(`https://servis-tikctes.onrender.com/api/tickets/client-by-empresa?cf_empresa=${encodeURIComponent(clientName)}`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const tickets = await response.json();
        return tickets || [];
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        return [];
    }
}

// Variáveis globais para o sistema de drag-and-drop
let ticketsSelecionadosMultiEmpresa = [];
let empresasCarregadas = {};

// Função para buscar tickets por empresa
async function buscarTicketsEmpresa() {
    const empresaInput = document.getElementById('empresaSearch');
    const empresaNome = empresaInput.value.trim();
    
    if (!empresaNome) {
        alert('Digite o nome de uma empresa para buscar tickets.');
        return;
    }
    
    // Encontrar a empresa na lista de clientes
    const empresa = window.clients.find(c => 
        c.name.toLowerCase().includes(empresaNome.toLowerCase())
    );
    
    if (!empresa) {
        alert('Empresa não encontrada. Verifique o nome digitado.');
        return;
    }
    
    // Mostrar loading
    const ticketsDisponiveis = document.getElementById('ticketsDisponiveis');
    ticketsDisponiveis.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Carregando tickets...</div>';
    
    try {
        // Carregar tickets da empresa usando a mesma API
        const tickets = await fetchFreshdeskTickets(empresa.name);
        empresasCarregadas[empresa.name] = tickets;
        
        renderizarTicketsDisponiveis(tickets, empresa);
        
    } catch (error) {
        console.error('Erro ao carregar tickets:', error);
        ticketsDisponiveis.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Erro ao carregar tickets. Tente novamente.</div>';
    }
}

// Função para renderizar tickets disponíveis para seleção
function renderizarTicketsDisponiveis(tickets, empresa) {
    const ticketsDisponiveis = document.getElementById('ticketsDisponiveis');
    
    if (!tickets || tickets.length === 0) {
        ticketsDisponiveis.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6c757d;">
                Nenhum ticket encontrado para ${empresa.name}
            </div>
        `;
        return;
    }
    
    let html = `<h5 style="margin: 0 0 10px 0; color: #495057;">${empresa.name} (${tickets.length} tickets)</h5>`;
    
    tickets.forEach(ticket => {
        const statusText = getTicketStatusText(ticket.status);
        const createdDate = formatDateTimeForDisplay(ticket.created_at);
        const jaSelecionado = ticketsSelecionadosMultiEmpresa.some(t => t.id === ticket.id && t.clientName === empresa.name);
        
        html += `
            <div class="ticket-item" style="border: 1px solid #dee2e6; border-radius: 6px; padding: 10px; margin-bottom: 8px; background: ${jaSelecionado ? '#e8f5e8' : 'white'}; cursor: pointer;"
                 onclick="toggleTicketSelection(${ticket.id}, '${empresa.name}', this)">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" ${jaSelecionado ? 'checked' : ''} onclick="event.stopPropagation();" onchange="toggleTicketSelection(${ticket.id}, '${empresa.name}', this.parentElement.parentElement)">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #007bff; margin-bottom: 4px;">
                            #${ticket.id} - ${ticket.subject || 'Sem assunto'}
                        </div>
                        <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">
                            ${ticket.description_text ? ticket.description_text.substring(0, 100) + '...' : 'Sem descrição'}
                        </div>
                        <div style="font-size: 0.8em; color: #888;">
                            Status: <span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px;">${statusText}</span> | 
                            Criado: ${createdDate}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    ticketsDisponiveis.innerHTML = html;
}

// Função para alternar seleção de ticket
function toggleTicketSelection(ticketId, empresaNome, element) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    const isSelected = checkbox.checked;
    
    // Encontrar o ticket nos dados carregados
    const tickets = empresasCarregadas[empresaNome];
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) return;
    
    if (isSelected) {
        // Adicionar ticket à lista se não existir
        const jaExiste = ticketsSelecionadosMultiEmpresa.some(t => t.id === ticketId && t.clientName === empresaNome);
        if (!jaExiste) {
            const ticketComEmpresa = {
                ...ticket,
                clientName: empresaNome,
                classificacao: 'melhoria' // Classificação padrão
            };
            ticketsSelecionadosMultiEmpresa.push(ticketComEmpresa);
            
            // Adicionar ticket à zona de melhoria por padrão
            adicionarTicketNaZona(ticketComEmpresa, 'melhoria');
        }
        element.style.background = '#e8f5e8';
    } else {
        // Remover ticket da lista
        ticketsSelecionadosMultiEmpresa = ticketsSelecionadosMultiEmpresa.filter(t => 
            !(t.id === ticketId && t.clientName === empresaNome)
        );
        
        // Remover ticket das zonas de drag-and-drop
        removerTicketDasZonas(ticketId, empresaNome);
        element.style.background = 'white';
    }
    
    atualizarContadorTickets();
}

// Função para adicionar ticket na zona de classificação
function adicionarTicketNaZona(ticket, classificacao) {
    const container = document.getElementById(classificacao === 'bug' ? 'bugTickets' : 'melhoriaTickets');
    
    // Remover mensagem de placeholder se existir
    const placeholder = container.querySelector('div[style*="italic"]');
    if (placeholder) {
        placeholder.remove();
    }
    
    const ticketElement = document.createElement('div');
    ticketElement.className = 'draggable-ticket';
    ticketElement.draggable = true;
    ticketElement.setAttribute('data-ticket-id', ticket.id);
    ticketElement.setAttribute('data-client-name', ticket.clientName);
    ticketElement.style.cssText = `
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 5px;
        cursor: move;
        position: relative;
    `;
    
    ticketElement.innerHTML = `
        <div style="font-weight: bold; font-size: 0.9em; color: #495057; margin-bottom: 2px;">
            #${ticket.id} - ${ticket.subject || 'Sem assunto'}
        </div>
        <div style="font-size: 0.8em; color: #6c757d;">
            ${ticket.clientName}
        </div>
        <button onclick="removerTicket(${ticket.id}, '${ticket.clientName}')" 
                style="position: absolute; top: 5px; right: 5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">
            ×
        </button>
    `;
    
    // Adicionar eventos de drag
    ticketElement.addEventListener('dragstart', dragStart);
    ticketElement.addEventListener('dragend', dragEnd);
    
    container.appendChild(ticketElement);
}

// Função para remover ticket das zonas
function removerTicketDasZonas(ticketId, clientName) {
    const bugContainer = document.getElementById('bugTickets');
    const melhoriaContainer = document.getElementById('melhoriaTickets');
    
    [bugContainer, melhoriaContainer].forEach(container => {
        const ticketElement = container.querySelector(`[data-ticket-id="${ticketId}"][data-client-name="${clientName}"]`);
        if (ticketElement) {
            ticketElement.remove();
        }
        
        // Adicionar placeholder se não houver tickets
        if (container.children.length === 0) {
            const isBug = container.id === 'bugTickets';
            container.innerHTML = `
                <div style="text-align: center; color: ${isBug ? '#721c24' : '#155724'}; font-style: italic; margin-top: 50px;">
                    Arraste tickets aqui para classificar como ${isBug ? 'Bug' : 'Melhoria'}
                </div>
            `;
        }
    });
}

// Função para remover ticket completamente
function removerTicket(ticketId, clientName) {
    // Remover da lista global
    ticketsSelecionadosMultiEmpresa = ticketsSelecionadosMultiEmpresa.filter(t => 
        !(t.id === ticketId && t.clientName === clientName)
    );
    
    // Remover das zonas
    removerTicketDasZonas(ticketId, clientName);
    
    // Atualizar checkbox na lista de disponíveis
    const ticketItems = document.querySelectorAll('.ticket-item');
    ticketItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && item.onclick.toString().includes(`${ticketId}`) && item.onclick.toString().includes(clientName)) {
            checkbox.checked = false;
            item.style.background = 'white';
        }
    });
    
    atualizarContadorTickets();
}

// Funções de Drag and Drop
function dragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        ticketId: this.getAttribute('data-ticket-id'),
        clientName: this.getAttribute('data-client-name')
    }));
    this.style.opacity = '0.5';
}

function dragEnd(e) {
    this.style.opacity = '1';
}

function allowDrop(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#007bff';
    e.currentTarget.style.backgroundColor = e.currentTarget.id === 'bugZone' ? '#f5c6cb' : '#c3e6cb';
}

function dragLeave(e) {
    e.currentTarget.style.borderColor = e.currentTarget.id === 'bugZone' ? '#dc3545' : '#28a745';
    e.currentTarget.style.backgroundColor = e.currentTarget.id === 'bugZone' ? '#f8d7da' : '#d4edda';
}

function dropTicket(e, classificacao) {
    e.preventDefault();
    
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const ticketId = parseInt(data.ticketId);
    const clientName = data.clientName;
    
    // Encontrar o ticket na lista global
    const ticket = ticketsSelecionadosMultiEmpresa.find(t => t.id === ticketId && t.clientName === clientName);
    if (!ticket) return;
    
    // Atualizar classificação
    ticket.classificacao = classificacao;
    
    // Remover ticket da zona atual
    const ticketElement = document.querySelector(`[data-ticket-id="${ticketId}"][data-client-name="${clientName}"]`);
    if (ticketElement) {
        ticketElement.remove();
    }
    
    // Adicionar na nova zona
    adicionarTicketNaZona(ticket, classificacao);
    
    // Restaurar estilo da zona
    dragLeave(e);
    
    atualizarContadorTickets();
}

// Função para atualizar contador de tickets
function atualizarContadorTickets() {
    const total = ticketsSelecionadosMultiEmpresa.length;
    const bugs = ticketsSelecionadosMultiEmpresa.filter(t => t.classificacao === 'bug').length;
    const melhorias = ticketsSelecionadosMultiEmpresa.filter(t => t.classificacao === 'melhoria').length;
    
    document.getElementById('ticketCounter').textContent = 
        `${total} tickets selecionados (${bugs} bugs, ${melhorias} melhorias)`;
}

// Função para carregar tickets do cliente selecionado
async function carregarTicketsCliente() {
    const clienteId = document.getElementById('releaseClient').value;
    const ticketsSection = document.getElementById('ticketsSection');
    const ticketsDisponiveis = document.getElementById('ticketsDisponiveis');
    
    if (!clienteId) {
        ticketsSection.style.display = 'none';
        return;
    }
    
    // Mostrar seção de tickets
    ticketsSection.style.display = 'block';
    ticketsDisponiveis.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Carregando tickets...</div>';
    
    try {
        // Buscar cliente selecionado
        const cliente = window.clients.find(c => c.id == clienteId);
        if (!cliente) {
            throw new Error('Cliente não encontrado');
        }
        
        // Buscar tickets usando a mesma API
        const tickets = await fetchFreshdeskTickets(cliente.name);
        empresasCarregadas[cliente.name] = tickets;
        
        renderizarTicketsDisponiveis(tickets, cliente);
        
    } catch (error) {
        console.error('Erro ao carregar tickets:', error);
        ticketsDisponiveis.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Erro ao carregar tickets. Tente novamente.</div>';
    }
}

// Função para renderizar tickets de múltiplas empresas
function renderizarTicketsMultiEmpresa(ticketsEmpresaAtual, clienteAtual) {
    const ticketsList = document.getElementById('ticketsList');
    
    // Separar tickets já selecionados de outras empresas dos tickets da empresa atual
    const ticketsOutrasEmpresas = ticketsSelecionadosMultiEmpresa.filter(t => t.clientName !== clienteAtual.name);
    const ticketsEmpresaAtualSelecionados = ticketsSelecionadosMultiEmpresa.filter(t => t.clientName === clienteAtual.name);
    
    let htmlContent = '';
    
    // Renderizar tickets de outras empresas (já selecionados)
    if (ticketsOutrasEmpresas.length > 0) {
        htmlContent += `
            <div style="margin-bottom: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #4caf50;">
                <h4 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 1em;">
                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                    Tickets Selecionados de Outras Empresas (${ticketsOutrasEmpresas.length})
                </h4>
                ${ticketsOutrasEmpresas.map(ticket => {
                    const statusText = getTicketStatusText(ticket.status);
                    const createdDate = formatDateTimeForDisplay(ticket.created_at);
                    
                    return `
                        <div style="border: 1px solid #c8e6c9; border-radius: 6px; padding: 10px; margin-bottom: 8px; background: white;">
                            <div style="display: flex; align-items: flex-start; gap: 10px;">
                                <input type="checkbox" 
                                       checked
                                       style="margin-top: 2px;" 
                                       data-ticket='${JSON.stringify(ticket)}'
                                       data-client-name="${ticket.clientName}"
                                       onchange="atualizarTicketsSelecionados(this)">
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #2e7d32; margin-bottom: 4px;">
                                        <span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-right: 8px;">
                                            ${ticket.clientName}
                                        </span>
                                        #${ticket.id} - ${ticket.subject || 'Sem assunto'}
                                    </div>
                                    <div style="font-size: 0.85em; color: #666; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${ticket.description_text ? ticket.description_text.substring(0, 100) + '...' : 'Sem descrição'}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 8px;">
                                        <div style="font-size: 0.8em; color: #888;">
                                            Status: <span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px;">${statusText}</span> | 
                                            Criado: ${createdDate}
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <label style="font-size: 0.85em; font-weight: bold; color: #2e7d32;">Classificação:</label>
                                        <select style="padding: 4px 8px; border: 1px solid #4caf50; border-radius: 4px; font-size: 0.8em; background: white;" 
                                                data-ticket-id="${ticket.id}" 
                                                data-client-name="${ticket.clientName}"
                                                onchange="atualizarClassificacaoTicket(this)">
                                            <option value="bug" ${ticket.classificacao === 'bug' ? 'selected' : ''}> Bug</option>
                                            <option value="melhoria" ${ticket.classificacao === 'melhoria' ? 'selected' : ''}> Melhoria</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    // Renderizar tickets da empresa atual
    if (!ticketsEmpresaAtual || ticketsEmpresaAtual.length === 0) {
        htmlContent += `
            <div style="margin-bottom: 15px; padding: 15px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
                <h4 style="margin: 0 0 10px 0; color: #f57c00; font-size: 1em;">
                    <i class="fas fa-building" style="margin-right: 8px;"></i>
                    ${clienteAtual.name}
                </h4>
                <div style="text-align: center; padding: 20px; color: #666;">Nenhum ticket encontrado para este cliente.</div>
            </div>
        `;
    } else {
        htmlContent += `
            <div style="margin-bottom: 15px; padding: 15px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
                <h4 style="margin: 0 0 10px 0; color: #f57c00; font-size: 1em;">
                    <i class="fas fa-building" style="margin-right: 8px;"></i>
                    ${clienteAtual.name} (${ticketsEmpresaAtual.length} tickets)
                </h4>
                ${ticketsEmpresaAtual.map(ticket => {
                    const statusText = getTicketStatusText(ticket.status);
                    const createdDate = formatDateTimeForDisplay(ticket.created_at);
                    
                    // Verificar se este ticket já está selecionado
                    const jaSelecionado = ticketsEmpresaAtualSelecionados.some(t => t.id === ticket.id);
                    const ticketSelecionado = ticketsEmpresaAtualSelecionados.find(t => t.id === ticket.id);
                    
                    return `
                        <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin-bottom: 8px; background: white;">
                            <div style="display: flex; align-items: flex-start; gap: 10px;">
                                <input type="checkbox" 
                                       ${jaSelecionado ? 'checked' : ''}
                                       style="margin-top: 2px;" 
                                       data-ticket='${JSON.stringify({...ticket, clientName: clienteAtual.name})}'
                                       data-client-name="${clienteAtual.name}"
                                       onchange="atualizarTicketsSelecionados(this)">
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #4fc3f7; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        #${ticket.id} - ${ticket.subject || 'Sem assunto'}
                                    </div>
                                    <div style="font-size: 0.85em; color: #666; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${ticket.description_text ? ticket.description_text.substring(0, 100) + '...' : 'Sem descrição'}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 8px;">
                                        <div style="font-size: 0.8em; color: #888;">
                                            Status: <span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px;">${statusText}</span> | 
                                            Criado: ${createdDate}
                                        </div>
                                    </div>
                                    ${jaSelecionado ? `
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <label style="font-size: 0.85em; font-weight: bold; color: #f57c00;">Classificação:</label>
                                            <select style="padding: 4px 8px; border: 1px solid #ff9800; border-radius: 4px; font-size: 0.8em; background: white;" 
                                                    data-ticket-id="${ticket.id}" 
                                                    data-client-name="${clienteAtual.name}"
                                                    onchange="atualizarClassificacaoTicket(this)">
                                                <option value="bug" ${ticketSelecionado?.classificacao === 'bug' ? 'selected' : ''}> Bug</option>
                                                <option value="melhoria" ${ticketSelecionado?.classificacao === 'melhoria' ? 'selected' : ''}> Melhoria</option>
                                            </select>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    ticketsList.innerHTML = htmlContent;
    atualizarContadorTickets();
}

// Função para atualizar a lista de tickets selecionados
function atualizarTicketsSelecionados(checkbox) {
    const ticketData = JSON.parse(checkbox.getAttribute('data-ticket'));
    const clientName = checkbox.getAttribute('data-client-name');
    
    if (checkbox.checked) {
        // Adicionar ticket à lista se não existir
        const jaExiste = ticketsSelecionadosMultiEmpresa.some(t => t.id === ticketData.id && t.clientName === clientName);
        if (!jaExiste) {
            // Adicionar classificação padrão como 'melhoria'
            ticketsSelecionadosMultiEmpresa.push({
                ...ticketData, 
                clientName: clientName,
                classificacao: 'melhoria' // Classificação padrão
            });
        }
    } else {
        // Remover ticket da lista
        ticketsSelecionadosMultiEmpresa = ticketsSelecionadosMultiEmpresa.filter(t => 
            !(t.id === ticketData.id && t.clientName === clientName)
        );
    }
    
    atualizarContadorTickets();
    
    // Re-renderizar para mostrar/ocultar o seletor de classificação
    setTimeout(() => {
        const clienteAtual = window.clients.find(c => c.id == document.getElementById('releaseClient').value);
        if (clienteAtual) {
            const ticketsEmpresaAtual = []; // Será preenchido pela API, mas para re-render usamos vazio
            renderizarTicketsMultiEmpresa(ticketsEmpresaAtual, clienteAtual);
        }
    }, 100);
}

// Nova função para atualizar a classificação de um ticket
function atualizarClassificacaoTicket(selectElement) {
    const ticketId = parseInt(selectElement.getAttribute('data-ticket-id'));
    const clientName = selectElement.getAttribute('data-client-name');
    const novaClassificacao = selectElement.value;
    
    // Encontrar e atualizar o ticket na lista global
    const ticketIndex = ticketsSelecionadosMultiEmpresa.findIndex(t => 
        t.id === ticketId && t.clientName === clientName
    );
    
    if (ticketIndex !== -1) {
        ticketsSelecionadosMultiEmpresa[ticketIndex].classificacao = novaClassificacao;
        console.log(`Ticket #${ticketId} da empresa ${clientName} classificado como: ${novaClassificacao}`);
    }
}

// Função para atualizar contador de tickets selecionados
function atualizarContadorTickets() {
    document.getElementById('selectedTicketsCount').textContent = ticketsSelecionadosMultiEmpresa.length;
}

async function salvarContatoCS() {
            const nome = document.getElementById('csClientName').value.trim();
            const tipo = document.getElementById('csContactType').value;
            const data = document.getElementById('csContactDate').value;
            const obs = document.getElementById('csObservation').value.trim();

            if (!nome || !tipo || !data || !obs) {
                showAlert('Atenção', 'Preencha todos os campos para salvar o contato!');
                return;
            }

            try {
                const { data: result, error } = await releaseClient
                    .from('cs_contacts')
                    .insert([
                        {
                            client_name: nome,
                            contact_type: tipo,
                            contact_date: data,
                            observation: obs
                        }
                    ]);

                if (error) {
                    console.error('Erro ao salvar contato:', error.message);
                    showAlert('Erro', 'Erro ao salvar contato.');
                    return;
                }

                showAlert('Sucesso', 'Contato salvo com sucesso!');
                document.getElementById('csClientName').value = '';
                document.getElementById('csContactType').value = '';
                document.getElementById('csContactDate').value = '';
                document.getElementById('csObservation').value = '';
                // Se quiser atualizar a lista de contatos, chame aqui a função de renderização
                // fetchAndRenderContatosCS();
            } catch (e) {
                console.error('Erro inesperado ao salvar contato:', e);
                showAlert('Erro', 'Erro inesperado ao salvar contato.');
            }
        }


async function fetchAndRenderContatosCS() {
    const container = document.getElementById('csContactsList');
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Carregando contatos...</p></div>';
    try {
        const { data, error } = await releaseClient
            .from('cs_contacts')
            .select('*')
            .order('contact_date', { ascending: false });
        if (error) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro ao carregar contatos.</p></div>`;
            return;
        }
        if (!data || data.length === 0) {
            container.innerHTML = `<div class="empty-state"><div style="font-size: 4em; margin-bottom: 20px;">📞</div><h3>Nenhum contato registrado</h3><p>Os contatos com clientes aparecerão aqui quando forem registrados.</p></div>`;
            atualizarEstatisticasCS([]);
            return;
        }
        container.innerHTML = data.map(contato => `
            <div class="document-card" style="margin-bottom: 15px;">
                <div class="document-title">${contato.client_name}</div>
                <div class="document-author">${contato.contact_type} • ${new Date(contato.contact_date).toLocaleDateString('pt-BR')}</div>
                <div style="margin-top: 10px; color: #555; white-space: pre-wrap; word-break: break-word;">${contato.observation}</div>
            </div>
        `).join('');
        atualizarEstatisticasCS(data);
    } catch (e) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro inesperado ao carregar contatos.</p></div>`;
        atualizarEstatisticasCS([]);
    }
}

function atualizarEstatisticasCS(contatos) {
    const total = contatos.length;
    const hoje = new Date();
    const hojeStr = hoje.toISOString().slice(0, 10);
    const diaSemana = hoje.getDay();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    const inicioSemanaStr = inicioSemana.toISOString().slice(0, 10);

    let contatosHoje = 0;
    let contatosSemana = 0;
    contatos.forEach(c => {
        const dataContato = c.contact_date;
        if (dataContato === hojeStr) contatosHoje++;
        if (dataContato >= inicioSemanaStr && dataContato <= hojeStr) contatosSemana++;
    });
    document.getElementById('totalContatos').textContent = total;
    document.getElementById('contatosHoje').textContent = contatosHoje;
    document.getElementById('contatosSemana').textContent = contatosSemana;
}
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('csContactsList')) {
        fetchAndRenderContatosCS();
    }
    
    // Atualiza o select de autores quando abre a aba documentos
    if (document.getElementById('documents')) {
        updateDocumentAuthorsSelect();
    }
});

// Função para atualizar o select de autores baseado no setor atual
async function updateDocumentAuthorsSelect() {
    const setorUsuario = sessionStorage.getItem('setor');
    const selectAuthor = document.getElementById('documentAuthor');
    
    if (!selectAuthor) return;
    
    try {
        const { data: membros, error } = await releaseClient
            .from('membros')
            .select('nome')
            .eq('setor', setorUsuario);
            
        if (error) throw error;
        
        // Limpa o select
        selectAuthor.innerHTML = '<option value="">Selecione o autor</option>';
        
        // Adiciona os membros do setor como opções
        if (membros && membros.length > 0) {
            membros.forEach(membro => {
                selectAuthor.innerHTML += `<option value="${membro.nome}">${membro.nome}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar autores:', error);
    }
}



        let resolveModalPromise;

       
        function showAlert(title, message) {
            const modal = document.getElementById('customModal');
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;
            const buttonsContainer = document.getElementById('modalButtons');
            buttonsContainer.innerHTML = `<button class="modal-button ok">OK</button>`;
            
            const okButton = buttonsContainer.querySelector('.ok');
            okButton.onclick = () => {
                modal.classList.remove('visible');
            };
            modal.classList.add('visible');
        }

        
        function showConfirm(title, message) {
            return new Promise((resolve) => {
                resolveModalPromise = resolve;
                const modal = document.getElementById('customModal');
                document.getElementById('modalTitle').textContent = title;
                document.getElementById('modalMessage').textContent = message;
                const buttonsContainer = document.getElementById('modalButtons');
                buttonsContainer.innerHTML = `
                    <button class="modal-button confirm">Confirmar</button>
                    <button class="modal-button cancel">Cancelar</button>
                `;

                const confirmButton = buttonsContainer.querySelector('.confirm');
                const cancelButton = buttonsContainer.querySelector('.cancel');

                confirmButton.onclick = () => {
                    modal.classList.remove('visible');
                    resolveModalPromise(true);
                };
                cancelButton.onclick = () => {
                    modal.classList.remove('visible');
                    resolveModalPromise(false);
                };
                modal.classList.add('visible');
            });
        }

         
        
        if (!window.supabaseClient) {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        const supabase = window.supabaseClient;

        
        const tipoMap = {
            'suprimentos': 'suprimentos',
            'projetos': 'projetos',
            'tickets': 'tickets',
            'treinamentos': 'treinamento',
            'migracoes': 'migracao',
            'reunioes': 'reuniao',
            'mvp': 'mvp',
            'homologacoes': 'homologacao',
            'acompanhamentos': 'acompanhamento',
            'implantacoes': 'implantacao'
        };

        
       async function alterarQuantidade(idHtml, tipo, incremento) {
            if (!permissoes.includes('alterarQuantidade')) {
                showAlert('Atenção', 'Você não tem permissão para alterar a quantidade.');
                return;
            }

            const elemento = document.getElementById(idHtml + '-count');
            if (!elemento) {
                console.error('Elemento não encontrado:', idHtml + '-count');
                return;
            }
            let valorAtual = parseInt(elemento.textContent) || 0;
            let novoValor = Math.max(0, valorAtual + incremento);
            elemento.textContent = novoValor.toString().padStart(2, '0');

            
            try {
                const { error } = await releaseClient
                    .from('tarefas_painel_setor')
                    .upsert([
                        { tipo: tipo, quantidade: novoValor }
                    ], { onConflict: ['tipo'] });
                if (error) throw error;
                
            } catch (err) {
                console.error('Erro ao salvar quantidade:', err);
                showAlert('Erro', 'Erro ao salvar quantidade: ' + err.message);
            }
        }

        // Função para carregar contadores de tarefas
        async function carregarContadoresDeTarefas() {
            try {
                const { data, error } = await releaseClient
                    .from('tarefas_painel_setor')
                    .select('*');

                if (error) throw error;

                data.forEach(item => {
                
                    let tipo = item.tipo ? item.tipo.trim() : '';
                    let info = tipoMap[tipo];
                    let id = info ? info.id : 'tarefa-' + tipo.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const elemento = document.getElementById(id + '-count');
                    if (elemento) {
                        elemento.textContent = item.quantidade.toString().padStart(2, '0');
                    }
                });

            } catch (error) {
                console.error('Erro ao carregar contadores de tarefas:', error);
            }
        }

    
    async function saveTasks() {
    if (!permissoes.includes('saveTasks')) {
        showAlert('Atenção', 'Você não tem permissão para salvar as tarefas.');
        return;
    }

    try {
        const updates = [];

        for (const tipoHtml in tipoMap) {
            const element = document.getElementById(tipoHtml + '-count');
            if (element) {
                updates.push({
                    tipo: tipoMap[tipoHtml],
                    quantidade: parseInt(element.textContent) || 0
                });
            } else {
                console.warn('Elemento não encontrado para salvar:', tipoHtml + '-count');
            }
        }

        if (updates.length === 0) {
            showAlert('Aviso', 'Nenhum contador de tarefa encontrado para salvar.');
            return;
        }

                for (const update of updates) {
                    const { error } = await releaseClient
                        .from('tarefas_painel_setor')
                        .upsert([update], { onConflict: ['tipo'] });

                    if (error) throw error;
                }

                showAlert('Sucesso', 'Quantidades das tarefas salvas com sucesso!');
            } catch (error) {
                console.error('Erro ao salvar quantidades:', error);
                showAlert('Erro', 'Erro ao salvar as quantidades das tarefas.');
            }
        }

        
        let documents = [];
        
        let editingProducts = []; 
        let arquivosHomologacaoSelecionados = []; 
        let currentIntegrations = []; 
let editingIntegrations = []; 

function addIntegration() {
    if (!permissoes.includes('addIntegration')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar integrações.');
        return;
    }
    const type = document.getElementById('integrationType').value;
    const system = document.getElementById('integrationSystem').value;
    currentIntegrations.push({ type, system });
    renderIntegrations('currentIntegrations', 'integrationContainer', 'integrationList');
}

function addEditIntegration() {
    if (!permissoes.includes('addEditIntegration')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar/editar integrações.');
        return;
    }
    const type = document.getElementById('editIntegrationType').value;
    const system = document.getElementById('editIntegrationSystem').value;
    editingIntegrations.push({ type, system });
    renderIntegrations('editingIntegrations', 'editIntegrationContainer', 'editIntegrationList');
}

function renderIntegrations(listName, containerId, listDivId) {
  const list = listName === 'currentIntegrations' ? currentIntegrations : editingIntegrations;
  const container = document.getElementById(containerId);
  const listDiv = document.getElementById(listDivId);

  if (list.length === 0) {
    container.innerHTML = '<p style="color: rgba(0, 0, 0, 0.85);">Nenhuma integração adicionada ainda.</p>';
    listDiv.style.display = 'none';
    return;
  }
  listDiv.style.display = 'block';
  container.innerHTML = list.map((item, idx) => `
    <div class="product-item">
      <span>Tipo: ${item.type}, Sistema: ${item.system}</span>
      <button class="delete-btn" onclick="removeIntegration(${idx}, '${listName}')">X</button>
    </div>
  `).join('');
}

function removeIntegration(idx, listName) {
    if (!permissoes.includes('removeIntegration')) {
        showAlert('Atenção', 'Você não tem permissão para remover integrações.');
        return;
    }
    if (listName === 'currentIntegrations') {
        currentIntegrations.splice(idx, 1);
        renderIntegrations('currentIntegrations', 'integrationContainer', 'integrationList');
    } else {
        editingIntegrations.splice(idx, 1);
        renderIntegrations('editingIntegrations', 'editIntegrationContainer', 'editIntegrationList');
    }
}

        function hexToRgb(hex) {
            var bigint = parseInt(hex.slice(1), 16);
            var r = (bigint >> 16) & 255;
            var g = (bigint >> 8) & 255;
            var b = bigint & 255;
            return `${r}, ${g}, ${b}`;
        }

        
        document.documentElement.style.setProperty('--primary-color-rgb', hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--primary-color')));
        document.documentElement.style.setProperty('--text-color-rgb', hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--text-color')));

       
        function showTab(tabId) {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            const el = document.getElementById(tabId);
            if (el) { el.classList.add('active'); }

            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const navItemToActivate = document.querySelector(`.nav-item button[onclick="showTab('${tabId}')"]`);
            if (navItemToActivate) {
                 navItemToActivate.parentElement.classList.add('active');
            }

          
            if (tabId === 'inicio') {
                setTimeout(() => {
                    initializeInicio();
                }, 100);
            } else if (tabId === 'documents') {
                fetchAndRenderDocuments();
                updateDocumentAuthorsSelect();
            } else if (tabId === 'clients') {
                document.getElementById('editClientTabButton').style.display = 'none';
                showClientTab('view-clients');
                fetchAndRenderClients();
            } else if (tabId === 'homologacao') {
                openHomologacaoTab(null, 'formularioHomologacao'); 
                fetchAndRenderHomologacoes(); 
            } else if (tabId === 'dashboard') {
                fetchAndRenderDashboards(); 
            } else if (tabId === 'gestao') {
                fetchAndRenderFuncionarios();
            } else if (tabId === 'gerenciar-logins') {
                fetchAndRenderUsuarios();
            } else if (tabId === 'release') {
                carregarReleases();
                populateReleaseClientes();
            }else if (tabId === 'painel-setor') {
    carregarTarefas();
    carregarProjetos();
    carregarMembros();
    carregarVisitas();
    carregarEntregas();
            } else if (tabId === 'reunioes') {
                carregarReunioes();
            } else if (tabId === 'mvp') {
                carregarMVP();
            } else if (tabId === 'implantacao') {
                carregarImplantacoes();
            } else if (tabId === 'nova-implantacao') {
                inicializarNovaImplantacao();
            }

        }

      
        function showClientTab(tabId) {
            document.querySelectorAll('.client-tab-content').forEach(section => {
                section.style.display = 'none';
            });
            const el = document.getElementById(tabId);
            if (el) { el.style.display = 'block'; }

            document.querySelectorAll('.client-tab-button').forEach(button => {
                button.classList.remove('active');
            });
            const activeClientButton = document.querySelector(`.client-tab-button[onclick="showClientTab('${tabId}')"]`);
            if (activeClientButton) {
                activeClientButton.classList.add('active');
            }

            const addVideoButton = document.getElementById('addVideoBtn');
            const editButton = document.getElementById('editClientTabButton');
            if (editButton) {
                if (tabId === 'edit-client-tab') {
                    editButton.style.display = 'block';
                    editButton.classList.add('active');
                } else {
                    editButton.style.display = 'none';
                    editButton.classList.remove('active');
                }
            }

            if (tabId === 'view-clients') {
                fetchAndRenderClients();
            }
        }

       
        function previewLogo(input) {
            const logoPreview = document.getElementById('logoPreview');
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    logoPreview.innerHTML = `<img src="${e.target.result}" class="logo-preview" alt="Logo preview">`;
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                logoPreview.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                    <p>Clique para adicionar logo</p>
                `;
            }
        }

        
        function previewEditLogo(input) {
            const logoPreview = document.getElementById('editLogoPreview');
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    logoPreview.innerHTML = `<img src="${e.target.result}" class="logo-preview" alt="Logo preview">`;
                };
                reader.readAsDataURL(input.files[0]);
            } else {
                const clientId = document.getElementById('editClientId').value;
                const client = clients.find(c => c.id == clientId);
                if (client && client.logo_url) {
                    logoPreview.innerHTML = `<img src="${client.logo_url}" class="logo-preview" alt="Logo preview">`;
                } else {
                     logoPreview.innerHTML = `
                        <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                        <p>Clique para adicionar logo</p>
                    `;
                }
            }
        }

        function addProduct() {
    if (!permissoes.includes('addProduct')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar produtos.');
        return;
    }
    const productName = document.getElementById('productNameTreinamento').value;
    const productQuantity = document.getElementById('productQuantity').value;

    if (productName && productQuantity > 0) {
        currentProducts.push({ name: productName, quantity: parseInt(productQuantity) });
        updateProductsList('currentProducts', 'productsContainer');
        document.getElementById('productNameTreinamento').value = '';
        document.getElementById('productQuantity').value = '1';
        document.getElementById('productsList').style.display = 'block';
    } else {
        showAlert('Erro', 'Por favor, insira um nome e uma quantidade válida para o produto.');
    }
}

function removeProduct(index, listType) {
    if (!permissoes.includes('removeProduct')) {
        showAlert('Atenção', 'Você não tem permissão para remover produtos.');
        return;
    }
    if (listType === 'currentProducts') {
        currentProducts.splice(index, 1);
        updateProductsList('currentProducts', 'productsContainer');
    } else if (listType === 'editingProducts') {
        editingProducts.splice(index, 1);
        updateProductsList('editingProducts', 'editProductsContainer');
    }
}

function addEditProduct() {
    if (!permissoes.includes('addEditProduct')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar/editar produtos.');
        return;
    }
    const productName = document.getElementById('editProductName').value;
    const productQuantity = document.getElementById('editProductQuantity').value;

    if (productName && productQuantity > 0) {
        editingProducts.push({ name: productName, quantity: parseInt(productQuantity) });
        updateProductsList('editingProducts', 'editProductsContainer');
        document.getElementById('editProductName').value = '';
        document.getElementById('editProductQuantity').value = '1';
        document.getElementById('editProductsList').style.display = 'block';
    } else {
        showAlert('Erro', 'Por favor, insira um nome e uma quantidade válida para o produto.');
    }            
            productsListDiv.style.display = 'block'; 
            productsContainer.innerHTML = productsToRender.map((product, index) => `
                <div class="product-item">
                    <span>${product.name} (x${product.quantity})</span>
                    <button class="delete-btn" onclick="removeProduct(${index}, '${listName}')">X</button>
                </div>
            `).join('');
        }

        function updateProductsList(listName, containerId) {
    const products = listName === 'currentProducts' ? currentProducts : editingProducts;
    const container = document.getElementById(containerId);

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="color: rgba(0, 0, 0, 0.85);">Nenhum produto adicionado ainda.</p>';
        return;
    }

    container.innerHTML = products.map((product, index) => `
        <div class="product-item">
            <span>${product.name} (x${product.quantity})</span>
            <button class="delete-btn" onclick="removeProduct(${index}, '${listName}')">X</button>
        </div>
    `).join('');
}

        async function viewClientDocuments(clientId) {
            const clientName = clients.find(c => c.id === clientId)?.name || `Cliente ID: ${clientId}`;
            
            let clientDocumentsSection = document.getElementById('view-client-documents');
            if (!clientDocumentsSection) {
                const clientsDiv = document.getElementById('clients');
                clientsDiv.insertAdjacentHTML('beforeend', `<div id="view-client-documents" class="client-tab-content" style="display:none;"></div>`);
                clientDocumentsSection = document.getElementById('view-client-documents');
            }
            
            clientDocumentsSection.innerHTML = `
                <div class="form-container">
                    <h3 style="margin-bottom: 20px;">Documentos de: ${clientName}</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="clientDocumentTitle">Título</label>
                            <input type="text" id="clientDocumentTitle" placeholder="Título do documento...">
                        </div>
                        <div class="form-group">
                            <label for="clientDocumentType">Tipo</label>
                            <select id="clientDocumentType">
                                <option value="">Selecione o tipo</option>
                                <option value="apresentacao">Apresentação</option>
                                <option value="relatorio">Relatório de Visita</option>
                                <option value="atas">Atas</option>
                                <option value="planilha">Planilha</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label for="clientDocumentFile">Arquivo</label>
                            <div class="upload-area" onclick="document.getElementById('clientDocumentFile').click()">
                                <div class="upload-icon">📄</div>
                                <p>Arraste e solte ou clique para selecionar um arquivo</p>
                                <input type="file" id="clientDocumentFile" style="display: none;">
                            </div>
                        </div>
                    </div>
                    <button class="btn-secondary" onclick="addClientDocument(${clientId})">Adicionar Documento ao Cliente</button>
                    <button class="btn-secondary" onclick="showClientTab('view-clients')" style="margin-left: 10px;">Voltar aos Clientes</button>
                </div>

                <h3 style="margin-top: 40px; margin-bottom: 20px;">Documentos Existentes</h3>
                <div id="clientDocumentsList" class="documents-grid">
                    <div class="empty-state">
                        <div class="empty-state-icon">📁</div>
                        <p>Nenhum documento para este cliente.</p>
                    </div>
                </div>
            `;
            
            showClientTab('view-client-documents');
            await fetchAndRenderClientDocuments(clientId);
        }


        // --- Funcionarios  ---
        async function adicionarFuncionario() {
            const nome = document.getElementById('funcionarioNome').value;
            const funcao = document.getElementById('funcionarioCargo').value;
            const link = document.getElementById('funcionarioLink').value;
            const fotoInput = document.getElementById('funcionarioFoto');
            const foto = fotoInput.files[0];

            if (nome && funcao && link && foto) {
                const fotoPath = `funcionarios/${Date.now()}_${foto.name}`;
                const { data: uploadData, error: uploadError } = await releaseClient.storage
                    .from('funcionariofotos')
                    .upload(fotoPath, foto);

                if (uploadError) {
                    console.error('Erro ao fazer upload da foto:', uploadError.message);
                    showAlert('Erro', 'Erro ao fazer upload da foto.');
                    return;
                }

                const fotoUrl = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/funcionariofotos/${fotoPath}`;

                const { data, error } = await releaseClient
                    .from('gestao_funcionarios')
                    .insert([
                        { nome, funcao, foto_url: fotoUrl, foto_path: fotoPath, link }
                    ]);

                if (error) {
                    console.error('Erro ao adicionar funcionário no banco de dados:', error.message);
                    showAlert('Erro', 'Erro ao adicionar funcionário.');
                } else {
                    showAlert('Sucesso', 'Funcionário adicionado com sucesso!');
                    document.getElementById('funcionarioNome').value = '';
                    document.getElementById('funcionarioCargo').value = '';
                    document.getElementById('funcionarioLink').value = '';
                    fotoInput.value = '';
                    fetchAndRenderFuncionarios();
                }
            } else {
                showAlert('Atenção', 'Por favor, preencha todos os campos e selecione uma foto.');
            }
        }

        async function fetchAndRenderFuncionarios() {
            const { data, error } = await releaseClient
                .from('gestao_funcionarios')
                .select('*');

            const container = document.getElementById('funcionariosList');

            if (error) {
                console.error('Erro ao buscar funcionários:', error.message);
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro ao carregar funcionários.</p></div>`;
                return;
            }

            if (data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p>Nenhum funcionário encontrado</p>
                        <p>Adicione funcionários para começar</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.map(funcionario => `
                <div class="document-card" style="cursor: pointer;" onclick="redirecionarFuncionario('${funcionario.link}')">
                    <div class="document-header">
                        <span class="document-type">${funcionario.funcao}</span>
                        <button class="delete-btn" onclick="event.stopPropagation(); deleteFuncionario(${funcionario.id}, '${funcionario.foto_path}')">X</button>
                    </div>
                    <div style="text-align: center; margin-bottom: 15px;">
                        <img src="${funcionario.foto_url}" alt="Foto de ${funcionario.nome}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-color);">
                    </div>
                    <div class="document-title">${funcionario.nome}</div>
                    <div class="document-author">${funcionario.funcao}</div>
                    <div style="margin-top: 15px; text-align: center;">
                        <small style="color: #666;">Clique para acessar o link</small>
                    </div>
                </div>
            `).join('');
        }

        function redirecionarFuncionario(link) {
            if (link) {
                window.open(link, '_blank');
            }
        }

        async function deleteFuncionario(id, fotoPath) {
            const confirmed = await showConfirm('Confirmação', 'Tem certeza que deseja deletar este funcionário?');
            if (!confirmed) {
                return;
            }

            if (fotoPath) {
                const { error: storageError } = await releaseClient.storage
                    .from('funcionariofotos')
                    .remove([fotoPath]);

                if (storageError) {
                    console.warn('Aviso: Erro ao deletar foto do Storage:', storageError.message);
                }
            }

            const { error: dbError } = await releaseClient
                .from('gestao_funcionarios')
                .delete()
                .eq('id', id);

            if (dbError) {
                console.error('Erro ao deletar funcionário do banco de dados:', dbError.message);
                showAlert('Erro', 'Erro ao deletar funcionário do banco de dados.');
            } else {
                showAlert('Sucesso', 'Funcionário deletado com sucesso!');
                fetchAndRenderFuncionarios();
            }
        }

        // Função para filtrar clientes por grupo, subgrupo e nome
        function filterClientsByGroup() {
            const selectedGroup = document.getElementById('filterClientGroup').value;
            const selectedSubgroup = document.getElementById('filterClientSubgroup').value;
            const searchName = document.getElementById('filterClientName').value.trim().toLowerCase();
            let selectedStatus = document.getElementById('filterClientStatus').value.trim();
            const clientCards = document.querySelectorAll('#clientsList .client-card-vertical');
            let visibleCount = 0;
            clientCards.forEach(card => {
                const clientId = card.dataset.clientId;
                const client = clients.find(c => c.id == clientId);
                if (!client) return;

                const clientName = (client.name || '').toLowerCase();
                const clientGroupId = client.group_id ? String(client.group_id) : '';
                const clientSubgroupId = client.subgroup_id ? String(client.subgroup_id) : '';
                // Status pelo relacionamento
                let clientStatus = '';
                if (client.client_statuses && client.client_statuses.name) {
                    clientStatus = client.client_statuses.name;
                } else if (client.status) {
                    clientStatus = client.status;
                }
                const matchesGroup = selectedGroup === '' || clientGroupId === selectedGroup;
                const matchesSubgroup = selectedSubgroup === '' || clientSubgroupId === selectedSubgroup;
                const matchesName = searchName === '' || clientName.includes(searchName);
                // O filtro agora compara o status normalizado
                const matchesStatus = selectedStatus === '' || clientStatus.toLowerCase() === selectedStatus.toLowerCase();
                if (matchesGroup && matchesSubgroup && matchesName && matchesStatus) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Mostrar/esconder estado vazio
            const emptyState = document.querySelector('#clientsList .empty-state');
            if (emptyState) {
                if (visibleCount === 0 && clientCards.length > 0) {
                    emptyState.style.display = 'block';
                    emptyState.innerHTML = `
                        <div class="empty-state-icon">🔍</div>
                        <p>Nenhum cliente encontrado</p>
                        <p>Tente ajustar os filtros</p>
                    `;
                } else if (clientCards.length === 0) {
                    emptyState.style.display = 'block';
                    emptyState.innerHTML = `
                        <div class="empty-state-icon">👥</div>
                        <p>Nenhum cliente encontrado</p>
                        <p>Adicione clientes para começar</p>
                    `;
                } else {
                    emptyState.style.display = 'none';
                }
            }
        }
        
        // Função para limpar filtros
        function clearClientFilters() {
            document.getElementById('filterClientGroup').value = '';
            document.getElementById('filterClientSubgroup').value = '';
            document.getElementById('filterClientName').value = '';
            document.getElementById('filterClientStatus').value = '';
            filterClientsByGroup();
        }

        // --- Documentos  ---
        async function addDocument() {
    if (!permissoes.includes('addDocument')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar documentos do time.');
        return;
    }
            const title = document.getElementById('documentTitle').value;
            const author = document.getElementById('documentAuthor').value;
            const type = document.getElementById('documentType').value;
            const fileInput = document.getElementById('documentFile');
            const file = fileInput.files[0];

            if (title && author && type && file) {
                const filePath = `${Date.now()}_${file.name}`;
                const { data: uploadData, error: uploadError } = await releaseClient.storage
                    .from('documentfiles')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Erro ao fazer upload do arquivo:', uploadError.message);
                    showAlert('Erro', 'Erro ao fazer upload do documento.');
                    return;
                }

                const publicURL = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/documentfiles/${filePath}`;

    const setorUsuario = sessionStorage.getItem("setor");
    const { data, error } = await releaseClient
        .from("documents_setor")
        .insert([
            { title, author, type, file_url: publicURL, file_path: filePath, setor: setorUsuario }
        ]);

                if (error) {
                    console.error('Erro ao adicionar documento no banco de dados:', error.message);
                    showAlert('Erro', 'Erro ao adicionar documento.');
                } else {
                    showAlert('Sucesso', 'Documento adicionado com sucesso!');
                    document.getElementById('documentTitle').value = '';
                    document.getElementById('documentAuthor').value = '';
                    document.getElementById('documentType').value = '';
                    fileInput.value = '';
                    fetchAndRenderDocuments();
                }
            } else {
                showAlert('Atenção', 'Por favor, preencha todos os campos e selecione um arquivo.');
            }
        }

        async function fetchAndRenderDocuments() {
            // Obtém o setor do usuário logado do sessionStorage
            const setorUsuario = sessionStorage.getItem('setor');
            
            // Busca apenas documentos do setor do usuário
            const { data, error } = await releaseClient
                .from('documents_setor')
                .select('*')
                .eq('setor', setorUsuario);

            const container = document.getElementById('documentsList');

            if (error) {
                console.error('Erro ao buscar documentos:', error.message);
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro ao carregar documentos.</p></div>`;
                return;
            }

            documents = data;

            if (documents.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📁</div>
                        <p>Nenhum documento encontrado</p>
                        <p>Adicione documentos para começar</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = documents.map(doc => `
                <div class="document-card">
                    <div class="document-header">
                        <span class="document-type">${doc.type}</span>
                        <button class="delete-btn" onclick="deleteDocument(${doc.id}, '${doc.file_path}')">X</button>
                    </div>
                    <div class="document-title">${doc.title}</div>
                    <div class="document-author">${doc.author}</div>
                    <a href="${doc.file_url}" download="${doc.title}.${doc.file_url.split('.').pop()}" target="_blank" class="btn-secondary" style="margin-top: 15px; display: block; text-align: center;">Download</a>
                </div>
            `).join('');
        }

        async function deleteDocument(id, filePath) {
    if (!permissoes.includes('deleteDocument')) {
        showAlert('Atenção', 'Você não tem permissão para excluir documentos do time.');
        return;
    }
    const confirmed = await showConfirm('Confirmação', 'Tem certeza que deseja deletar este documento?');
    if (!confirmed) {
        return;
    }
            const { error: storageError } = await releaseClient.storage
                .from('documentfiles')
                .remove([filePath]);

            if (storageError) {
                console.error('Erro ao deletar arquivo do Storage:', storageError.message);
                showAlert('Erro', 'Erro ao deletar arquivo do Storage. Verifique as permissões do bucket.');
                return;
            }

            const { error: dbError } = await releaseClient
                .from('documents_setor')
                .delete()
                .eq('id', id);

            if (dbError) {
                console.error('Erro ao deletar documento do banco de dados:', dbError.message);
                showAlert('Erro', 'Erro ao deletar documento do banco de dados. Verifique as permissões da tabela.');
            } else {
                showAlert('Sucesso', 'Documento deletado com sucesso!');
                fetchAndRenderDocuments();
            }
        }

        // --- Client  ---
      async function saveClient() {
    if (!permissoes.includes('saveClient')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar clientes.');
        return;
    }
            const name = document.getElementById('clientName').value;
            const email = document.getElementById('clientEmail').value;
            const phone = document.getElementById('clientPhone').value;
            const cnpj = document.getElementById('clientCNPJ').value;
            const status = document.getElementById('clientStatus').value;
            let group_id = document.getElementById("clientGroup").value;
            let subgroup_id = document.getElementById("clientSubgroup").value;

            const biLink = document.getElementById('clientBiLink').value;

            let logoId = null;
            let logoFilePath = null;

            if (name && email && phone) {
                const logoFileInput = document.getElementById('clientLogo');
                if (logoFileInput && logoFileInput.files && logoFileInput.files[0]) {
                    const logoFile = logoFileInput.files[0];
                    logoFilePath = `clientlogos/${Date.now()}_${logoFile.name}`;
                    const { data: uploadData, error: uploadError } = await releaseClient.storage
                        .from('clientlogos')
                        .upload(logoFilePath, logoFile);
                    if (uploadError) {
                        console.error('Erro ao fazer upload do logo:', uploadError.message);
                        showAlert('Erro', 'Erro ao fazer upload do logo.');
                        return;
                    }
                    // Obter URL pública do logo
                    let logoUrl = null;
                    const { data: publicUrlData } = releaseClient.storage.from('clientlogos').getPublicUrl(logoFilePath);
                    if (publicUrlData && publicUrlData.publicUrl) {
                        logoUrl = publicUrlData.publicUrl;
                    }
                    // Inserir na tabela client_logos e pegar o id
                    const { data: logoData, error: logoError } = await releaseClient
                        .from('client_logos')
                        .insert([{ url: logoUrl, path: logoFilePath, file_type: logoFile.type }])
                        .select('id')
                        .single();
                    if (logoError) {
                        console.error('Erro ao inserir logo na tabela client_logos:', logoError.message);
                        showAlert('Erro', 'Erro ao salvar logo no banco.');
                        return;
                    }
                    logoId = logoData.id;
                }

                // Mapear status para status_id consultando a tabela client_statuses
                let status_id = null;
                try {
                    if (status && status !== '') {
                        const { data: statusRow, error: statusError } = await releaseClient
                            .from('client_statuses')
                            .select('id')
                            .eq('name', status)
                            .limit(1)
                            .single();
                        if (statusError) {
                            // se não encontrar, mantém null
                            console.warn('Não foi possível mapear status para status_id:', statusError.message || statusError);
                        } else if (statusRow && statusRow.id) {
                            status_id = statusRow.id;
                        }
                    }
                } catch (err) {
                    console.error('Erro ao buscar status_id:', err);
                    status_id = null;
                }

                // Inserir cliente e capturar o id retornado
                const { data: clientData, error: clientError } = await releaseClient
                    .from('clients')
                    .insert([
                        { name, email, phone, cnpj, status_id, group_id, subgroup_id, logo_id: logoId, bi_link: biLink }
                    ])
                    .select('id')
                    .single();

                if (clientError) { console.error(clientError); showAlert('Erro', 'Erro ao salvar cliente.'); return; }
                const clientId = clientData.id;

                // Inserir produtos vinculados
                if (currentProducts.length > 0) {
                    const productsToInsert = currentProducts.map(p => ({
                        client_id: clientId,
                        name: p.name,
                        quantity: p.quantity
                    }));
                    const { error: productsError } = await releaseClient
                        .from('products_cliente')
                        .insert(productsToInsert);
                    if (productsError) {
                        console.error('Erro ao salvar produtos:', productsError.message);
                        showAlert('Erro', 'Cliente salvo, mas erro ao salvar produtos. Verifique as permissões da tabela de produtos.');
                    }
                }

                showAlert('Sucesso', 'Cliente salvo com sucesso!');
                document.getElementById('clientName').value = '';
                document.getElementById('clientEmail').value = '';
                document.getElementById('clientPhone').value = '';
                document.getElementById('clientCNPJ').value = '';
                document.getElementById('clientStatus').value = 'Cliente Ativo';
                document.getElementById('clientGroup').value = 'Nenhum';
                document.getElementById('clientSubgroup').value = 'Nenhum';
                document.getElementById('clientBiLink').value = '';
                if (logoFileInput) { 
                    logoFileInput.value = ''; 
                }
                document.getElementById('logoPreview').innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                    <p>Clique para adicionar logo</p>
                `;
                currentProducts = [];
                updateProductsList('currentProducts', 'productsContainer');
                fetchAndRenderClients(); 
                showClientTab('view-clients'); 
            } else {
                showAlert('Atenção', 'Por favor, preencha todos os campos obrigatórios do cliente.');
            }
        }
async function fetchAndRenderClients() {
   const userType = localStorage.getItem('user_type');
   const clientId = sessionStorage.getItem('client_id');
     let query = releaseClient
     .from('clients')
     .select(`
          id, name, email, phone, bi_link, cnpj, group_id, status_id, logo_id, subgroup_id,
    client_groups:group_id(id, name, parent_group_id),
    client_statuses:status_id(name),
    client_logos:logo_id(id, url, path),
    products_cliente(id, name, quantity),
    integrations_cliente(id, type, system)
  `);

     // Carregar todos os grupos para o filtro de subgrupo
     if (!window.clientGroupsList) {
         const { data: allGroups } = await releaseClient.from('client_groups').select('id, name, parent_group_id');
         window.clientGroupsList = allGroups || [];
     }
   
   if (
     userType === 'client' &&
     clientId &&
     clientId !== 'null' &&
     clientId !== null &&
     clientId !== undefined &&
     clientId !== '' &&
     !isNaN(Number(clientId))
   ) {
     query = query.eq('id', Number(clientId));
   }
   const { data, error } = await query;
   

            const container = document.getElementById('clientsList');

            if (error) {
                console.error('Erro ao buscar clientes:', error.message);
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro ao carregar clientes.</p></div>`;
                return;
            }

          clients = data;       
clients.sort((a, b) => a.name.localeCompare(b.name));
window.clients = clients || []; 
atualizarMetricasClientes();
if (clients.length === 0) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <p>Nenhum cliente encontrado</p>
            <p>Adicione clientes para começar</p>
        </div>
    `;
    return;
}

            container.innerHTML = clients.map(client => `

  <div class="client-card-vertical" data-client-id="${client.id}">
    <div class="client-card-top">
      <button class="delete-btn-card" onclick="deleteClient(${client.id}, '${client.logo_path || ''}')"><span style="font-size: 16px;">X</span></button>
    </div>

    <div class="client-logo-vertical">
     ${client.client_logos?.url ? `<img src="${client.client_logos.url}" alt="Logo" class="logo-preview-vertical">` : client.name.charAt(0).toUpperCase()}
    </div>

    <p class="add-logo-text">${client.logo_url ? '' : 'Adicionar Logo'}</p>
    <h3 class="client-name-vertical">${client.name}</h3>
    <p class="client-status-text ${client.status === 'Cliente Inativo' ? 'inactive' : ''}">${client.status || 'Cliente Ativo'}</p>


    <!-- Produtos -->
    <div class="info-section">
      <div class="section-title">
        <span style="font-size: 18px;">📦</span>
        <span style="font-weight: bold;">Produtos</span> (<span id="productCount-${client.id}">${client.products ? client.products.length : 0}</span>)
      </div>
      ${
        client.products && client.products.length > 0
          ? client.products.map(p => `<p class="section-item">• ${p.name} (x${p.quantity})</p>`).join('')
          : '<p class="section-item muted">Nenhum produto</p>'
      }
    </div>

    <!-- Integrações -->
    <div class="info-section">
      <div class="section-title">
        <span style="font-size: 18px;">🔗</span>
        <span style="font-weight: bold;">Integrações</span>
      </div>
      ${
        client.integrations && client.integrations.length > 0
          ? client.integrations.map(i => `<p class="section-item">• ${i.type} (${i.system})</p>`).join('')
          : '<p class="section-item muted">Nenhuma integração</p>'
      }
    </div>

    <button class="btn-vertical" onclick="viewClientDocuments(${client.id})">Ver Documentos</button>
    <button class="btn-vertical edit" onclick="editClient(${client.id})">Editar Cliente</button>
    <button class="btn-tickets" onclick="viewClientTickets(${client.id}, '${client.name}', '${client.email}')">
      <i class="fas fa-ticket-alt"></i> Ver Tickets
    </button>
    <button class="btn-integracoes" onclick="viewClientIntegracoes(${client.id}, '${client.name}', '${client.cnpj || ''}')">
      <i class="fas fa-plug"></i> Integrações 
    </button>
  </div>

`).join('');

            
            setTimeout(() => {
                filterClientsByGroup();
            }, 100);

        
            populateClientDropdown();
            
        }
        async function deleteClient(id, logoPath) {
  if (!permissoes.includes('deleteClient')) {
    showAlert('Atenção', 'Você não tem permissão para excluir clientes.');
    return;
  }

            if (logoPath) {
                const { error: storageError } = await releaseClient.storage
                    .from('client_logos') 
                    .remove([logoPath]);

                if (storageError) {
                    console.warn('Aviso: Erro ao deletar logo do Storage (pode não existir ou caminho incorreto). Continuando com a exclusão do cliente no DB:', storageError.message);
                }
            }

            const { error: dbError } = await releaseClient
                .from('clients') 
                .delete()
                .eq('id', id);

            if (dbError) {
                console.error('Erro ao deletar cliente do banco de dados:', dbError.message);
                showAlert('Erro', 'Erro ao deletar cliente do banco de dados. Verifique as permissões da tabela ou as regras ON DELETE CASCADE.');
            } else {
                showAlert('Sucesso', 'Cliente deletado com sucesso!');
                fetchAndRenderClients(); 
            }
        }

        
        function populateClientDropdown() {
            const clientSelect = document.getElementById('rvEmpresa');
            if (!clientSelect || !clients) return;
            
            
            clientSelect.innerHTML = '<option value="">Selecione um cliente...</option>';
            
            
            clients
                .filter(client => client.status !== 'Cliente Inativo')
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.name;
                    option.textContent = client.name;
                    clientSelect.appendChild(option);
                });
        }

async function editClient(clientId) {
    if (!permissoes.includes('editClient')) {
        showAlert('Atenção', 'Você não tem permissão para editar clientes.');
        return;
    }

    const clientToEdit = clients.find(c => c.id === clientId);

    if (!clientToEdit) {
        showAlert('Erro', 'Cliente não encontrado para edição.');
        return;
    }

    document.getElementById('editClientId').value = clientToEdit.id;
    document.getElementById('editClientName').value = clientToEdit.name;
    document.getElementById('editClientEmail').value = clientToEdit.email;
    document.getElementById('editClientPhone').value = clientToEdit.phone;
    document.getElementById('editClientCNPJ').value = clientToEdit.cnpj || '';
    document.getElementById('editClientStatus').value = clientToEdit.status || 'Cliente Ativo';
    document.getElementById('editClientGroup').value = clientToEdit.group || 'Nenhum';
    document.getElementById('editClientSubgroup').value = clientToEdit.subgroup || 'Nenhum';
    document.getElementById('editClientBiLink').value = clientToEdit.bi_link || '';

    const editLogoPreview = document.getElementById('editLogoPreview');
    if (clientToEdit.logo_url) {
        editLogoPreview.innerHTML = `<img src="${clientToEdit.logo_url}" class="logo-preview" alt="Logo preview">`;
    } else {
        editLogoPreview.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
            <p>Clique para adicionar logo</p>
        `;
    }

    editingProducts = clientToEdit.products ? [...clientToEdit.products] : [];
    updateProductsList('editingProducts', 'editProductsContainer');

    showClientTab('edit-client-tab');
}

       async function updateClient() {
    if (!permissoes.includes('updateClient')) {
        showAlert('Atenção', 'Você não tem permissão para atualizar clientes.');
        return;
    }
            const clientId = document.getElementById('editClientId').value;
            const name = document.getElementById('editClientName').value;
            const email = document.getElementById('editClientEmail').value;
            const phone = document.getElementById('editClientPhone').value;
            const cnpj = document.getElementById('editClientCNPJ').value;
            let status_val = document.getElementById("editClientStatus").value;
            let group_id = document.getElementById('editClientGroup').value;
            let subgroup_id = document.getElementById("editClientSubgroup").value;
            // Normaliza group/subgroup
            group_id = group_id === "" ? null : Number(group_id);
            subgroup_id = subgroup_id === "" ? null : Number(subgroup_id);

            // Resolve status_id: pode ser já um id numérico ou um nome
            let status_id = null;
            if (status_val && status_val !== '') {
                if (!isNaN(Number(status_val))) {
                    status_id = Number(status_val);
                } else {
                    try {
                        const { data: statusRow, error: statusError } = await releaseClient
                            .from('client_statuses')
                            .select('id')
                            .eq('name', status_val)
                            .limit(1)
                            .single();
                        if (!statusError && statusRow && statusRow.id) status_id = statusRow.id;
                    } catch (err) {
                        console.error('Erro ao resolver status_id na edição:', err);
                    }
                }
            } else {
                status_id = null;
            }

            const biLink = document.getElementById('editClientBiLink').value;
            const logoFileInput = document.getElementById('editClientLogo');
            const newLogoFile = logoFileInput.files[0];

            if (!name || !email || !phone) {
                showAlert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            let logoUrl = null;
            let logoPath = null;
            const currentClient = clients.find(c => c.id == clientId);

            if (newLogoFile) {
                const newLogoPath = `logos/${Date.now()}_${newLogoFile.name}`;
                const { data: uploadData, error: uploadError } = await releaseClient.storage
                    .from('client_logos') 
                    .upload(newLogoPath, newLogoFile);

                if (uploadError) {
                    console.error('Erro ao fazer upload do novo logo:', uploadError.message);
                    showAlert('Erro', 'Erro ao fazer upload do novo logo.');
                    return;
                }
                logoUrl = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/client_logos/${newLogoPath}`;
                logoPath = newLogoPath;

                if (currentClient && currentClient.logo_path) {
                    const { error: deleteOldLogoError } = await releaseClient.storage
                        .from('client_logos')
                        .remove([currentClient.logo_path]);
                    if (deleteOldLogoError) {
                        console.warn('Aviso: Erro ao deletar logo antigo do Storage:', deleteOldLogoError.message);
                    }
                }
            } else {
                if (currentClient) {
                    logoUrl = currentClient.logo_url;
                    logoPath = currentClient.logo_path;
                }
            }

                        const { error: clientError } = await releaseClient
                                .from('clients')
                                .update({
        name,
        email,
        phone,
        cnpj,
        status_id,
        group_id,
        subgroup_id,
        logo_path: logoPath, // Atualiza o caminho do arquivo
        bi_link: biLink
    })
                                .eq('id', clientId);

            if (clientError) {
                console.error('Erro ao atualizar cliente no banco de dados:', clientError.message);
                showAlert('Erro', 'Erro ao atualizar cliente.');
                return;
            }
            await releaseClient.from('integrations_cliente').delete().eq('client_id', clientId);
if (editingIntegrations.length > 0) {
  const integrationsToInsert = editingIntegrations.map(i => ({
    client_id: parseInt(clientId),
    type: i.type,
    system: i.system
  }));
  await releaseClient.from('integrations_cliente').insert(integrationsToInsert);
}

            const { error: deleteProductsError } = await releaseClient
                .from('products_cliente')
                .delete()
                .eq('client_id', clientId);

            if (deleteProductsError) {
                console.error('Erro ao deletar produtos antigos:', deleteProductsError.message);
                showAlert('Erro', 'Cliente atualizado, mas erro ao limpar produtos antigos.');
            }

            if (editingProducts.length > 0) {
                const productsToInsert = editingProducts.map(p => ({
                    client_id: parseInt(clientId),
                    name: p.name,
                    quantity: p.quantity
                }));
                const { error: insertProductsError } = await releaseClient
                    .from('products_cliente')
                    .insert(productsToInsert);

                if (insertProductsError) {
                    console.error('Erro ao inserir novos produtos:', insertProductsError.message);
                    showAlert('Erro', 'Cliente atualizado, mas erro ao adicionar novos produtos.');
                }
            }

            showAlert('Sucesso', 'Cliente atualizado com sucesso!');
            logoFileInput.value = ''; 
            editingProducts = [];
            fetchAndRenderClients();
            showClientTab('view-clients');
        }

        async function addClientDocument(clientId) {
    if (!permissoes.includes('addClientDocument')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar documentos do cliente.');
        return;
    }
            const title = document.getElementById('clientDocumentTitle').value;
            const type = document.getElementById('clientDocumentType').value;
            const fileInput = document.getElementById('clientDocumentFile');
            const file = fileInput.files[0];

            if (title && type && file) {
                const filePath = `client_documents/${clientId}/${Date.now()}_${file.name}`;
                const { data: uploadData, error: uploadError } = await releaseClient.storage
                    .from('clientdocumentfiles') 
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Erro ao fazer upload do arquivo do cliente:', uploadError.message);
                    showAlert('Erro', 'Erro ao fazer upload do documento do cliente. Verifique as permissões do bucket.');
                    return;
                }

                const publicURL = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/clientdocumentfiles/${filePath}`;

                const { data, error } = await releaseClient
                    .from('client_documents') 
                   .select(`
    id, name, email, phone, bi_link, cnpj, group_id, status_id, logo_id, subgroup_id,
    client_groups:group_id(id, name, parent_group_id),
    client_statuses:status_id(name),
    client_logos:logo_id(id, url, path),
    products_cliente(id, name, quantity),
    integrations_cliente(id, type, system)
  `);

                if (error) {
                    console.error('Erro ao adicionar documento do cliente no banco de dados:', error.message);
                    showAlert('Erro', 'Erro ao adicionar documento do cliente. Verifique as permissões da tabela.');
                } else {
                    showAlert('Sucesso', 'Documento do cliente adicionado com sucesso!');
                    document.getElementById('clientDocumentTitle').value = '';
                    document.getElementById('clientDocumentType').value = '';
                    fileInput.value = '';
                    fetchAndRenderClientDocuments(clientId); 
                }
            } else {
                showAlert('Atenção', 'Por favor, preencha todos os campos e selecione um arquivo para o documento do cliente.');
            }
        }
        
     async function updateClientStatusCounts() {
  try {
        const { data: clients, error } = await releaseClient
            .from('clients')
            .select('id, name, status_id, client_statuses:status_id(name)');

    if (error) throw error;

    // Armazena globalmente para outras funções, se precisar
    clients.sort((a, b) => a.name.localeCompare(b.name));
    window.clients = clients;

    let activeCount = 0;
    let inactiveCount = 0;

    clients.forEach(client => {
      const statusName = client.client_statuses?.name?.toLowerCase() || '';
      if (statusName.includes('ativo')) activeCount++;
      else if (statusName.includes('inativo')) inactiveCount++;
    });

    // Atualiza a UI
    const elAtivos = document.getElementById('activeClientsCount');
const elInativos = document.getElementById('inactiveClientsCount');
if (elAtivos) elAtivos.textContent = activeCount;
if (elInativos) elInativos.textContent = inactiveCount;

  } catch (error) {
    console.error('Erro ao atualizar contadores de status de clientes:', error);
   const elAtivos = document.getElementById('activeClientsCount');
const elInativos = document.getElementById('inactiveClientsCount');
if (elAtivos) elAtivos.textContent = '-';
if (elInativos) elInativos.textContent = '-';
  }
}

document.addEventListener("DOMContentLoaded", function() {
    updateClientStatusCounts();
});



        // Função para verificar se um documento já foi avaliado
        async function isDocumentEvaluated(documentId) {
            try {
                const { data, error } = await releaseClient
                    .from('visit_evaluations')
                    .select('id')
                    .eq('document_id', documentId)
                    .limit(1);
                if (error) {
                    console.error('Erro ao verificar avaliação:', error);
                    return false;
                }
                return data && data.length > 0;
            } catch (error) {
                console.error('Erro ao verificar avaliação:', error);
                return false;
            }
        }

        async function fetchAndRenderClientDocuments(clientId) {
            const { data, error } = await releaseClient
                .from('client_documents') 
                .select('*')
                .eq('client_id', clientId);

            const container = document.getElementById('clientDocumentsList');

            if (error) {
                console.error('Erro ao buscar documentos do cliente:', error.message);
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro ao carregar documentos do cliente.</p></div>`;
                return;
            }

            if (data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📁</div>
                        <p>Nenhum documento para este cliente.</p>
                    </div>
                `;
                return;
            }

            
            const documentsWithEvaluationStatus = await Promise.all(
                data.map(async (doc) => {
                    const isEvaluated = await isDocumentEvaluated(doc.id);
                    return { ...doc, isEvaluated };
                })
            );

            container.innerHTML = documentsWithEvaluationStatus.map(doc => `
                <div class="document-card">
                    <div class="document-header">
                        <span class="document-type">${doc.type}</span>
                        <button class="delete-btn" onclick="deleteClientDocument(${doc.id}, '${doc.file_path}', ${clientId})">X</button>
                    </div>
                    <div class="document-title">${doc.title}</div>
                    <div class="document-author">ID do Cliente: ${doc.client_id}</div>
                    <a href="${doc.file_url}" download="${doc.title}.${doc.file_url.split('.').pop()}" target="_blank" class="btn-secondary" style="margin-top: 15px; display: block; text-align: center;">Download</a>
                    ${(doc.type === 'relatorio' || doc.title.toLowerCase().includes('relatório') || doc.title.toLowerCase().includes('relatorio') || doc.title.toLowerCase().includes('visita')) ? 
                        (doc.isEvaluated ? 
                            `<button class="btn-evaluated" style="margin-top: 10px; display: block; width: 100%; text-align: center; background: #6c757d; color: white; border: none; padding: 10px; border-radius: 5px; cursor: not-allowed;" disabled>
                                ✅ Visita Avaliada
                            </button>` :
                            `<button onclick="openEvaluationModal('${doc.id}', '${doc.title}', '${doc.client_id}')" class="btn-evaluation" style="margin-top: 10px; display: block; width: 100%; text-align: center; background: #28a745; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
                                ⭐ Avaliar Visita
                            </button>`
                        ) : ''
                    }
                </div>
            `).join('');
        }

       async function deleteClientDocument(documentId, filePath, clientId) {
    if (!permissoes.includes('deleteClientDocument')) {
        showAlert('Atenção', 'Você não tem permissão para excluir documentos do cliente.');
        return;
    }

    const confirmed = await showConfirm('Confirmação', 'Tem certeza que deseja deletar este documento do cliente?');
    if (!confirmed) {
        return;
    }
            const { error: storageError } = await releaseClient.storage
                .from('clientdocumentfiles') 
                .remove([filePath]);

            if (storageError) {
                console.error('Erro ao deletar arquivo do Storage do cliente:', storageError.message);
                showAlert('Erro', 'Erro ao deletar arquivo do Storage do cliente. Verifique as permissões do bucket.');
                return;
            }

            const { error: dbError } = await releaseClient
                .from('client_documents') 
                .delete()
                .eq('id', documentId);

            if (dbError) {
                console.error('Erro ao deletar documento do cliente do banco de dados:', dbError.message);
                showAlert('Erro', 'Erro ao deletar documento do cliente do banco de dados. Verifique as permissões da tabela.');
            } else {
                showAlert('Sucesso', 'Documento do cliente deletado com sucesso!');
                fetchAndRenderClientDocuments(clientId); 
            }
        }

        // --- Dashboard  ---
        async function fetchAndRenderDashboards() {
       const userType = localStorage.getItem('user_type');
const clientId = sessionStorage.getItem('client_id');
let query = releaseClient
  .from('clients')
  .select(`
          id, 
      name, 
      bi_link,
      client_logos:client_logos!clients_logo_path_fkey (url)
  `)
  .not('bi_link', 'is', null)
  .not('bi_link', 'eq', '');
if (
  userType === 'client' &&
  clientId &&
  clientId !== 'null' &&
  clientId !== null &&
  clientId !== undefined &&
  clientId !== '' &&
  !isNaN(Number(clientId))
) {
  query = query.eq('id', Number(clientId));
}
const { data, error } = await query;
            const container = document.getElementById('dashboardsList');

            if (error) {
                console.error('Erro ao buscar dashboards:', error.message);
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Erro ao carregar dashboards.</p></div>`;
                return;
            }

            if (data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p>Nenhum Dashboard de cliente encontrado.</p>
                        <p>Adicione clientes com links de BI para visualizá-los aqui.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.map(client => `
                <div class="dashboard-card">
                    <div class="client-logo-vertical">
                        ${client.client_logos?.url ? `<img src="${client.client_logos.url}" alt="Logo" class="logo-preview-vertical">` : client.name.charAt(0).toUpperCase()}
                    </div>
                    <h3>${client.name}</h3>
                    <a href="${client.bi_link}" target="_blank" class="btn-bi">
                        <i class="fas fa-external-link-alt"></i> Acessar
                    </a>
                </div>
            `).join('');
        }

        // --- Homologation  ---
       
        function openHomologacaoTab(evt, tabName) {
            document.querySelectorAll('#homologacao .tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            document.querySelectorAll('#homologacao .tab-button').forEach(button => {
                button.classList.remove('active');
            });

            const tab = document.getElementById(tabName);
            if (tab) {
                tab.style.display = 'block';
                tab.classList.add('active');
            }
            if (evt && evt.currentTarget) {
                evt.currentTarget.classList.add('active');
            }

            if (tabName === 'listaHomologacoes') {
                fetchAndRenderHomologacoes();
            }
        }

        async function fetchAndRenderHomologacoes() {
            const { data, error } = await releaseClient
                .from('homologacoes')
                .select('*')
                .order('data_liberacao', { ascending: false });

            const grid = document.getElementById('homologacoesGrid');
            const empty = document.getElementById('emptyStateHomologacao');

            if (error || !data || data.length === 0) {
                grid.innerHTML = '';
                empty.style.display = 'flex';
                return;
            }

            empty.style.display = 'none';
            grid.innerHTML = data.map(h => {
               
                const arquivosData = encodeURIComponent(JSON.stringify(h.arquivos || []));
                
                let html = "";
                html += '<div class="homologacao-card">';
                html += '<h4>Versão: ' + h.versao + '</h4>';
                html += '<p><strong>Especialista:</strong> ' + h.especialista + '</p>';
                html += '<p><strong>Sistema:</strong> ' + h.sistema + '</p>';
                html += '<p><strong>Liberação:</strong> ' + h.data_liberacao + '</p>';
                html += '<p><strong>Homologação:</strong> ' + (h.data_homologacao || '-') + '</p>';
                html += '<p><strong>Obs:</strong> ' + (h.observacao || '-') + '</p>';
                if (h.arquivos && h.arquivos.length) {
                    html += '<p><strong>Arquivos:</strong><br>' +
                        h.arquivos.map((file, i) =>
                            `<span>📄 ${file.nome}</span>`
                        ).join('<br>') +
                    '</p>';
                   
                    html += `<button class="btn-exportar" data-arquivos="${arquivosData}" onclick="baixarArquivosHomologacaoFromButton(this)">📥 Baixar Todos</button>`;
                }
                
                html += `<button class="btn-editar-homologacao" style="background-color: var(--accent-color); margin-right: 10px;" onclick="editHomologacaoFromButton(this, ${h.id})">✏️ Editar</button>`;
                html += `<button class="btn-exportar" style="background-color: var(--error-color); margin-right: 10px;" data-arquivos="${arquivosData}" onclick="deleteHomologacaoFromButton(this, ${h.id})">🗑️ Excluir</button>`;
                html += '</div>';
                return html;
            }).join('');
        }

        const uploadAreaHomologacao = document.getElementById('uploadAreaHomologacao');
        const fileInputHomologacao = document.getElementById('fileInputHomologacao');
        const fileListHomologacao = document.getElementById('fileListHomologacao');

        uploadAreaHomologacao.addEventListener('click', () => fileInputHomologacao.click());

        uploadAreaHomologacao.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadAreaHomologacao.classList.add('dragover');
        });

        uploadAreaHomologacao.addEventListener('dragleave', () => {
            uploadAreaHomologacao.classList.remove('dragover');
        });

        uploadAreaHomologacao.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadAreaHomologacao.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            adicionarArquivosHomologacao(files);
        });

        fileInputHomologacao.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            adicionarArquivosHomologacao(files);
        });

        
        function adicionarArquivosHomologacao(files) {
            files.forEach(file => {
                if (file.size > 10 * 1024 * 1024) {
                    showAlert('Atenção', `Arquivo ${file.name} é muito grande. Limite: 10MB`);
                    return;
                }
                
                if (!arquivosHomologacaoSelecionados.find(f => f.name === file.name)) {
                    arquivosHomologacaoSelecionados.push(file);
                    criarItemArquivoHomologacao(file);
                }
            });
        }

        
        function criarItemArquivoHomologacao(file) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">📄 ${file.name}</span>
                    <span class="file-size">(${formatarTamanho(file.size)})</span>
                </div>
                <button type="button" class="remove-file" onclick="removerArquivoHomologacao('${file.name}')">
                    ❌ Remover
                </button>
            `;
            fileListHomologacao.appendChild(fileItem);
        }

        
        function removerArquivoHomologacao(nomeArquivo) {
            arquivosHomologacaoSelecionados = arquivosHomologacaoSelecionados.filter(f => f.name !== nomeArquivo);
            const fileItems = fileListHomologacao.children;
            for (let item of fileItems) {
                if (item.querySelector('.file-name').textContent.includes(nomeArquivo)) {
                    fileListHomologacao.removeChild(item);
                    break;
                }
            }
        }

       
        function formatarTamanho(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Homologation
        document.getElementById('homologacaoForm').addEventListener('submit', async function (e) {
            e.preventDefault();
               if (!permissoes.includes('submitHomologacao')) {
        showAlert('Atenção', 'Você não tem permissão para enviar este formulário de homologação.');
        return;
    }

            const especialista = document.getElementById('especialista').value;
            const versao = document.getElementById('versao').value;
            const dataLiberacao = document.getElementById('dataLiberacao').value;
            const dataHomologacao = document.getElementById('dataHomologacao').value;
            const sistema = document.getElementById('sistema').value;
            const observacao = document.getElementById('observacao').value;

            const btn = document.querySelector('#homologacaoForm .btn-primary');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '⏳ Enviando...';
            btn.disabled = true;

            let arquivosParaSalvar = [];

            for (let file of arquivosHomologacaoSelecionados) {
                const path = `homologacoes/${Date.now()}_${file.name}`;
                const { data, error } = await releaseClient.storage.from('homologacaoarquivos').upload(path, file);
                if (error) {
                    showAlert('Erro', `Erro ao enviar o arquivo ${file.name}: ${error.message}`);
                    btn.innerHTML = textoOriginal;
                    btn.disabled = false;
                    return;
                }
                
                const { data: publicData } = releaseClient.storage.from('homologacaoarquivos').getPublicUrl(path);
                arquivosParaSalvar.push({ nome: file.name, path: path, url: publicData.publicUrl });
            }

            const { error: insertError } = await releaseClient.from('homologacoes').insert([{
                especialista,
                versao,
                data_liberacao: dataLiberacao,
                data_homologacao: dataHomologacao || null,
                sistema,
                observacao,
                arquivos: arquivosParaSalvar 
            }]);

            btn.innerHTML = textoOriginal;
            btn.disabled = false;

            if (insertError) {
                showAlert('Erro', 'Erro ao salvar homologação: ' + insertError.message);
                console.error(insertError);
            } else {
                showAlert('Sucesso', 'Homologação salva com sucesso!');
                limparHomologacaoForm();
                fetchAndRenderHomologacoes();
                openHomologacaoTab(null, 'listaHomologacoes'); 
            }
        });

        
        function filterClientsByGroup() {
            const selectedGroup = document.getElementById('filterClientGroup').value.toLowerCase();
            const selectedSubgroup = document.getElementById('filterClientSubgroup').value.toLowerCase();
            const searchName = document.getElementById('filterClientName').value.toLowerCase();
            const selectedStatus = document.getElementById('filterClientStatus').value;
            const clientCards = document.querySelectorAll('#clientsList .client-card-vertical');
            let visibleCount = 0;
            clientCards.forEach(card => {
                const clientId = card.dataset.clientId;
                const client = clients.find(c => c.id == clientId);
                if (!client) return;

                const clientName = (client.name || '').toLowerCase();
                const clientGroup = (client.client_groups?.name || '').toLowerCase();
                // Subgrupo: se usar hierarquia, pode ser o nome do grupo pai
                let clientSubgroup = '';
                if (client.client_groups && client.client_groups.parent_group_id && window.clientGroupsList) {
                    const parent = window.clientGroupsList.find(g => g.id === client.client_groups.parent_group_id);
                    clientSubgroup = (parent?.name || '').toLowerCase();
                }
                const clientStatus = (client.client_statuses?.name || '').toLowerCase();
                const matchesGroup = selectedGroup === '' || clientGroup === selectedGroup;
                const matchesSubgroup = selectedSubgroup === '' || clientSubgroup === selectedSubgroup;
                const matchesName = searchName === '' || clientName.includes(searchName);
                const matchesStatus = selectedStatus === '' || clientStatus.toLowerCase() === selectedStatus.toLowerCase();
                if (matchesGroup && matchesSubgroup && matchesName && matchesStatus) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            // Mostrar/esconder estado vazio
            const emptyState = document.querySelector('#clientsList .empty-state');
            if (emptyState) {
                if (visibleCount === 0 && clientCards.length > 0) {
                    emptyState.style.display = 'block';
                    emptyState.innerHTML = `
                        <div class="empty-state-icon">🔍</div>
                        <p>Nenhum cliente encontrado</p>
                        <p>Tente ajustar os filtros</p>
                    `;
                } else if (clientCards.length === 0) {
                    emptyState.style.display = 'block';
                    emptyState.innerHTML = `
                        <div class="empty-state-icon">👥</div>
                        <p>Nenhum cliente encontrado</p>
                        <p>Adicione clientes para começar</p>
                    `;
                } else {
                    emptyState.style.display = 'none';
                }
            }
        }
        

        
        async function filtrarHomologacoes() {
    const sistemaFiltro = document.getElementById('filtroSistema').value.toLowerCase();
    const especialistaFiltro = document.getElementById('filtroEspecialista').value.toLowerCase();
    const dataInicio = document.getElementById('filtroDataInicio')?.value;
    const dataFim = document.getElementById('filtroDataFim')?.value;

    const { data, error } = await releaseClient
        .from('homologacoes')
        .select('*')
        .order('data_liberacao', { ascending: false });

    if (error || !data) {
        console.error("Erro ao filtrar homologações:", error);
        return;
    }

    const filtradas = data.filter(h => {
        let matchSistema = !sistemaFiltro || h.sistema.toLowerCase().includes(sistemaFiltro);
        let matchEspecialista = !especialistaFiltro || h.especialista.toLowerCase().includes(especialistaFiltro);
        let matchData = true;
        if (dataInicio) {
            matchData = matchData && h.data_liberacao >= dataInicio;
        }
        if (dataFim) {
            matchData = matchData && h.data_liberacao <= dataFim;
        }
        return matchSistema && matchEspecialista && matchData;
    });

    const grid = document.getElementById('homologacoesGrid');
    const empty = document.getElementById('emptyStateHomologacao');
    const totalDiv = document.getElementById('totalHomologacoesFiltradas');

    if (filtradas.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        if (totalDiv) totalDiv.textContent = '0 homologações no período selecionado';
    } else {
        empty.style.display = 'none';
        grid.innerHTML = filtradas.map(h => {
            const arquivosData = encodeURIComponent(JSON.stringify(h.arquivos || []));
            let html = '';
            html += '<div class="homologacao-card">';
            html += '<h4>Versão: ' + h.versao + '</h4>';
            html += '<p><strong>Especialista:</strong> ' + h.especialista + '</p>';
            html += '<p><strong>Sistema:</strong> ' + h.sistema + '</p>';
            html += '<p><strong>Liberação:</strong> ' + h.data_liberacao + '</p>';
            html += '<p><strong>Homologação:</strong> ' + (h.data_homologacao || '-') + '</p>';
            html += '<p><strong>Obs:</strong> ' + (h.observacao || '-') + '</p>';
            if (h.arquivos && h.arquivos.length) {
                html += '<p><strong>Arquivos:</strong><br>' +
                    h.arquivos.map((file, i) =>
                        `<span>📄 ${file.nome}</span>`
                    ).join('<br>') +
                '</p>';
                html += `<button class="btn-exportar" data-arquivos="${arquivosData}" onclick="baixarArquivosHomologacaoFromButton(this)">📥 Baixar Todos</button>`;
            }
            html += `<button class="btn-editar-homologacao" style="background-color: var(--accent-color); margin-right: 10px;" onclick="editHomologacaoFromButton(this, ${h.id})">✏️ Editar</button>`;
            html += `<button class="btn-exportar" style="background-color: var(--error-color); margin-right: 10px;" data-arquivos="${arquivosData}" onclick="deleteHomologacaoFromButton(this, ${h.id})">🗑️ Excluir</button>`;
            html += '</div>';
            return html;
        }).join('');
        if (totalDiv) totalDiv.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'homologação' : 'homologações'} no período selecionado`;
    }
        }

     
        async function baixarArquivosHomologacao(arquivosJsonString) {
            const arquivos = JSON.parse(arquivosJsonString);

            if (!arquivos || arquivos.length === 0) {
                showAlert("Informação", "Nenhum arquivo para baixar.");
                return;
            }

            for (const arquivo of arquivos) {
                try {
                    
                    const { data, error } = await releaseClient
                        .storage
                        .from('homologacaoarquivos')
                        .createSignedUrl(arquivo.path, 60, { download: true }); 

                    if (error) {
                        console.error("Erro ao gerar URL assinada para", arquivo.nome, error);
                        showAlert("Erro", `Erro ao baixar o arquivo ${arquivo.nome}.`);
                        continue;
                    }

                    if (data?.signedUrl) {
                        const response = await fetch(data.signedUrl);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const blob = await response.blob();
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = arquivo.nome; 
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href); 
                    } else {
                        showAlert("Erro", `URL assinada não gerada para o arquivo ${arquivo.nome}.`);
                    }
                } catch (error) {
                    console.error("Erro ao baixar arquivo:", arquivo.nome, error);
                    showAlert("Erro", `Falha ao baixar o arquivo ${arquivo.nome}.`);
                }
            }
        }

       
        async function deleteHomologacao(id, arquivosJsonString) {
            const confirmed = await showConfirm('Confirmação', 'Tem certeza que deseja excluir esta homologação e seus arquivos?');
            if (!confirmed) {
                return;
            }

            const arquivos = JSON.parse(arquivosJsonString);
            
            if (arquivos && arquivos.length > 0) {
                const pathsToDelete = arquivos.map(a => a.path);
                const { error: storageError } = await releaseClient.storage
                    .from('homologacaoarquivos')
                    .remove(pathsToDelete);

                if (storageError) {
                    console.warn('Aviso: Erro ao deletar arquivos do Storage (podem não existir ou caminho incorreto):', storageError.message);
                   
                }
            }

            
            const { error: dbError } = await releaseClient
                .from('homologacoes')
                .delete()
                .eq('id', id);

            if (dbError) {
                console.error('Erro ao deletar homologação do banco de dados:', dbError.message);
                showAlert('Erro', 'Erro ao deletar homologação do banco de dados. Verifique as permissões da tabela.');
            } else {
                showAlert('Sucesso', 'Homologação excluída com sucesso!');
                fetchAndRenderHomologacoes(); 
            }
        }

       
        function baixarArquivosHomologacaoFromButton(button) {
            const arquivosJsonString = decodeURIComponent(button.dataset.arquivos);
            baixarArquivosHomologacao(arquivosJsonString);
        }

       
      async function deleteHomologacaoFromButton(button, homologacaoId) {
    if (!permissoes.includes('deleteHomologacao')) {
        showAlert('Atenção', 'Você não tem permissão para excluir homologações.');
        return;
    }

    const arquivosJsonString = decodeURIComponent(button.dataset.arquivos);
    await deleteHomologacao(homologacaoId, arquivosJsonString);
}

      // Função para abrir modal de edição de homologação
      async function editHomologacaoFromButton(button, homologacaoId) {
        try {
            // Buscar dados da homologação
            const { data, error } = await releaseClient
                .from('homologacoes')
                .select('*')
                .eq('id', homologacaoId)
                .single();

            if (error) throw error;

            // Preencher o formulário
            document.getElementById('editHomologacaoVersao').value = data.versao || '';
            document.getElementById('editHomologacaoEspecialista').value = data.especialista || '';
            document.getElementById('editHomologacaoSistema').value = data.sistema || '';
            document.getElementById('editHomologacaoDataLiberacao').value = data.data_liberacao || '';
            document.getElementById('editHomologacaoDataHomologacao').value = data.data_homologacao || '';
            document.getElementById('editHomologacaoObservacao').value = data.observacao || '';

            // Armazenar ID da homologação para uso no salvamento
            document.getElementById('formEditarHomologacao').dataset.homologacaoId = homologacaoId;

            // Abrir modal
            document.getElementById('modalEditarHomologacao').classList.add('visible');
        } catch (error) {
            console.error('Erro ao carregar homologação:', error);
            showAlert('Erro', 'Erro ao carregar dados da homologação.');
        }
      }

      // Função para fechar modal de edição de homologação
      function fecharModalEditarHomologacao() {
        document.getElementById('modalEditarHomologacao').classList.remove('visible');
        document.getElementById('formEditarHomologacao').reset();
      }

        
        document.addEventListener('DOMContentLoaded', () => {
            showTab('dashboard'); 
            
            fetchAndRenderClients();

            // Event listener para o formulário de edição de homologação
            document.getElementById('formEditarHomologacao').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const homologacaoId = this.dataset.homologacaoId;
                
                try {
                    // Dados básicos da homologação
                    const updateData = {
                        versao: document.getElementById('editHomologacaoVersao').value,
                        especialista: document.getElementById('editHomologacaoEspecialista').value,
                        sistema: document.getElementById('editHomologacaoSistema').value,
                        data_liberacao: document.getElementById('editHomologacaoDataLiberacao').value,
                        data_homologacao: document.getElementById('editHomologacaoDataHomologacao').value || null,
                        observacao: document.getElementById('editHomologacaoObservacao').value
                    };

                    // Atualizar homologação
                    const { error: updateError } = await releaseClient
                        .from('homologacoes')
                        .update(updateData)
                        .eq('id', homologacaoId);

                    if (updateError) throw updateError;

                    // Processar novos arquivos se houver
                    const files = document.getElementById('editHomologacaoFiles').files;
                    if (files.length > 0) {
                        // Buscar arquivos existentes
                        const { data: existingData } = await releaseClient
                            .from('homologacoes')
                            .select('arquivos')
                            .eq('id', homologacaoId)
                            .single();

                        let existingFiles = existingData?.arquivos || [];
                        
                        for (let file of files) {
                            const fileName = `homologacao_${homologacaoId}_${Date.now()}_${file.name}`;
                            
                            // Upload do arquivo
                            const { error: uploadError } = await releaseClient.storage
                                .from('homologacoes')
                                .upload(fileName, file);

                            if (uploadError) throw uploadError;

                            // Adicionar à lista de arquivos
                            existingFiles.push({
                                nome: file.name,
                                path: fileName,
                                size: file.size
                            });
                        }

                        // Atualizar lista de arquivos
                        const { error: filesError } = await releaseClient
                            .from('homologacoes')
                            .update({ arquivos: existingFiles })
                            .eq('id', homologacaoId);

                        if (filesError) throw filesError;
                    }

                    showAlert('Sucesso', 'Homologação atualizada com sucesso!');
                    fecharModalEditarHomologacao();
                    fetchAndRenderHomologacoes();
                } catch (error) {
                    console.error('Erro ao atualizar homologação:', error);
                    showAlert('Erro', 'Erro ao atualizar homologação: ' + error.message);
                }
            });
        });

let chartStatusVeiculos = null;
let chartComparativo = null;

function atualizarGraficoStatus() {
    const valores = {
        'Sem Report': parseInt(document.getElementById('inputSemReport').value || 0),
        'Reportando': parseInt(document.getElementById('inputReportando').value || 0),
        'Manutenção': parseInt(document.getElementById('inputManutencao').value || 0)
    };

    if (chartStatusVeiculos) {
        chartStatusVeiculos.destroy();
    }

    chartStatusVeiculos = new Chart(document.getElementById('chartVeiculos'), {
        type: 'bar',
        data: {
            labels: Object.keys(valores),
            datasets: [{
                label: 'Status dos Veículos',
                data: Object.values(valores),
                backgroundColor: ['#4caf50', '#ff9800', '#f44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

async function carregarGraficoComparativo() {
    const { data: visitas, error } = await releaseClient.from('visitas').select('*');
    if (error) {
        console.error('Erro ao buscar visitas:', error.message);
        return;
    }

    const empresaSelecionada = document.getElementById('filtroEmpresa')?.value || 'todas';
    const visitasFiltradas = empresaSelecionada === 'todas' ? visitas : visitas.filter(v => v.empresa === empresaSelecionada);

    const visitasPorMes = {};
    visitasFiltradas.forEach(v => {
        visitasPorMes[v.mes] = (visitasPorMes[v.mes] || 0) + v.quantidade;
    });

    if (chartComparativo) {
        chartComparativo.destroy();
    }

    chartComparativo = new Chart(document.getElementById('chartComparativo'), {
        type: 'line',
        data: {
            labels: Object.keys(visitasPorMes),
            datasets: [{
                label: 'Visitas por Mês',
                data: Object.values(visitasPorMes),
                borderColor: '#007bff',
                fill: false
            }]
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chartVeiculos')) {
        atualizarGraficoStatus();
    }
    if (document.getElementById('chartComparativo')) {
        carregarGraficoComparativo();
    }
});



async function gerarPDFVisita() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const img = new Image();
  img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAX0AAABYCAYAAAAZbydgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAADUxSURBVHhe7Z13fFzFufe/M2ebpFWXZcmWm9xt3I2Fu41xAQMJJSHvTSA3yU0CJDflJm8KBAi5Idy0exNSIC8kIaFcIEAIxjSDKTbuTbZl2cZNtmxLsrq0q21n5v1ji3dXxZIl20l0vnzmg7zn2XPOnvKbmWeeeUZorTUWFhYWFv0CmfyBhYWFhcU/L5boW1hYWPQjLNG3sLCw6EdYom9hYWHRj7BE38LCwqIfYYm+hYWFRT/CEn0LCwuLfoQl+hYWFhb9CEv0LSwsLPoRluhbWFhY9CMs0bewsLDoR1iib2FhYdGPsETfwsLCoh9hib6FhYVFP8ISfQsLC4t+hCX6FhYWFv0IS/QtLCws+hGW6FtYWFj0IyzRt7CwsOhHWKJvYWFh0Y+wRN/CwsKiH2GJvoWFhUU/whJ9CwsLi36EJfoWFhYW/QhL9P+J0IAJBDUEtSYU97dONu4jAhq8SuPTmuCFOohFl5w5c4b77ruPtWvXopRK3mxhkYDQWvfpq6oBj9I0a/Bq0BrsQpApIV2ATSR/o2/RWtPa2kpjYyN9/NN6hBCC1NRUcnNzaWlp6fH5CCEwDAO73Y7D4cDlcmG325Gy83raozSb/SblQQCBTQikABswywETHJK+vPxNpuaPHsVeP+QYmnEOyVynYJRdYERsGhsbaWlpQWtNamoqeXl5SXu58AQCAWprawmFQtjtdnJzczFNk9raWgCcTicDBgxAiN5dHZ/PR21tLUopXC4X2dnZ2O32ZLM+p6amhh//+McsW7aMpUuXdvmMWFj0uejvDyhWexWlIagwBSEkORImGYqVqYJZTom9d+9WlwQCAd555x1eeumlHolsXyOlZOrUqXzuc59j7dq1vPTSS5immWzWKYZh4HQ6ycjIIC8vj4EDBzJkyBCKiorIz8/H4XAkf4UQ8JdWkwea4aSWaBGuhaXQLDEUP881GNpHta6pNS97NQ+0wDETtBAIYKpN81CWYIJDoLVm9auv8sYbb+Lz+xgxYgTf+uY3sdlsybu7YCil2LNnD0888QQtLS0MHz6cT3/601RVVfH73/8epRTFxcV8/etf79V5mabJxo0beeaZZwiFQhQWFvLJT36SkSNH9royOReW6Fv0BOP73//+95M/PF/qTc0vWhS/9wj2hSSnlaBGC44r2BUUVJmaSXbINy7cSxAIBNi5cyfr16+npaXlkpb09HTmz5/Prl27eP/999tt76o0NTVRX1/P6dOnOXz4MKWlpZSWlnLs2DEaGxvJzMwkPT09QVAkMMgQ1CrBgZAghIhtr9GgNMxwgKsPROhYCH7XothuClRE8AE8GibbTC5zGAghqKuvZ8vWbZw6dYpTp04z6bJJDBw4MGlvF47W1lZef/11PvjgA1pbW7nsssuYPn06x44d46233qKxsRGbzcbSpUsxjGj/pOe0trby1FNPUV5eTktLC9XV1RQWFjJixIheVSbdwePx8MEHHzBy5MiLUslY/GPTZ6KvtObNNsWfvXAGAQKkEIBEIFAIzpiabKmZ5BA4L9CDqbWmurqa6upqMjMze1zS09NpbW1Fa43dbicvL4/c3Nx2ducqWVlZjBo1iunTp1NVVUV1dTUZGRnt7Dor6enpuFwuhBCEQiG01vj9fk6fPs3Bgwc5evQo+fn57QQ0VQoKJewNwikl0GgkENJwSkG+gIn2sNvnfGnTmr96FU+3gRcBcaKfJ+DfMyR5kYo9MyODgwc/5NSp05imSVNTE4sWLrwowqS15tSpUzz99NN4vV5ycnJYuXIlo0aNoqKigs2bN6OUIicnh2XLlvVK9MvLy3nhhRcwTRMhwr0cv9/P1KlTSU9PTzbvU6KiX1xcbIm+xTnpM/dORUjzw2bF39rCg4lhBCphrFgzyjD5aaZggUtGKoW+RWtNS0sLzc3N5+Xe8fl83H///TQ1NVFYWMhNN93EhAkTks3OiRCClJQUcnJyaG1tpampqcfno5QiGAxy5swZSktL2bFjB9XV1SilEEJQUFDAd77zHYqLixO+Z2rNS17FdxsFtRKkBhBINDPtcF86lLjO3wWwO6D5ZkOIrSEZFhghIseAr6Yo7so2Yj59rTVr1rzFn598ioaGBpxOJw8+8EPGjh0Tv8sLQigU4vnnn+fpp59Ga82cOXP413/9VwoLC3nnnXd46KGHCIVCjBw5kp/+9Kfn7X/XWvOzn/2M999/P0FwbTYbX/3qV5k3b16vKpRzEXXvLF26lGXLllnuHYsu6ZOWvqk1r3kVj3sEbRrOjhYKdNLQYYMO/3umU5Dem+ZmJwghYr7w5NZzd4rL5eK1116jra2NnJwc5s6dy7hx49rZnatkZGSQmpraq/PJysoiJyeHoqIipkyZwvz58zEMg4qKCgKBAK2trRw8eJAlS5YkiIoUgjF2yZGgyb6QgdbhnpdGUGWC0IppDoH7PK5/s9I86dG86JfoyPWOtvQHCMXvcgSpcfsVQjBgwAC2bt1GfX09pmmileKKK0oS9nsh8Hg8PPzww7S0tJCWlsZVV13FtGnTEEJw7NixPmvp19TU8PDDD6OUIjMzk5ycHLxeL6FQCJ/PR0lJSYdjMH2F5d6x6Al90iQ4HIQXvYo6IVDSQItokUQ0IVIECMnzbYKNPk2oZw3ffosQAofDQW5uLrfddhsf//jHY/78EydO8P777yd/BZuA72UbjJA6ElMVxhSCF/ywqk3hUz27AUpr9gc0f24FpUTk8ZGgBULDvWmCbKP9I5WRkcHskhJcdgdCaXbu2MnJkyeTzfqczZs3U11djRCC4uJiJkyY0OetYK01L774IsFgECEEI0eO5MYbb6SoqAiA0tJSTpw4kfy1vxu01u16oMn/jtLR5x19lkz0GMmlo21dobVGKdXOLnkfHe2ro8+S6cqmLz6Pnv+lptdvQJuGd/yKdaYR38SHuJ0ntzsUkoebNcct1e8xQghWrlzJ2LFjkVJimibr16/v8GEaIAUPZGjcSXfZi8EfWwVb/TrOFXdumrXg/3k0ZyK9tTDhvtwVdviYO/lOn2X+gnlkZWUB4PV6effd9zp8MfqKQCDA6tWrIRKSOW7cOIYNG5Zs1mvq6up49913EUKQlpbGpEmTmD17NmPGjIndn9WrV3d4fy4lpmlSWVnJzp072bVrF8ePH8fn8wFw5MiRdhVVU1MTFRUVeL3e2GdKKQ4cOEBFRUWn91JrzeHDhykrK0sox44dIxgMUlFRkfD5wYMHaWhoSLheoVCI06dPs2fPHnbs2JFgo7Xmww8/ZO/eve3K6dPhcSSlFIcPH+bQoUOdnidARUUFBw4caGcTDAY5duwYp06dSjgvv9/P0aNHqaysJBQKJXznyJEjVFZWQuRaV1dXs3v3bnbu3MmhQ4di1/pS0Cv3jgbKA4r/ahJUJdUfQmsWOqFNKbxaoOO7nAJOI3FokwUpsvc1Tx8SDAZZvXo1bW1tZGZmMm3aNAYNGpRsdkmx2WyEQiF27NgRCwOdO3cuqampyaaMsAsatGZ7ICrPYWq0oMnUXOEUZHTTzfOq1+SXrfJsRSHCJRN4IFMzytH5nXS73VTXVHPgwEGUUgQCAaZOnYrbnZZs2ids376dv/3tbwAUFRVx3XXXUVhYGNveF+4drTUvv/wyO3fuREpJUVERN998M/n5+bS1tXHw4EG8Xi9VVVXMnTuXjIyM5F30Cefj3tm3bx9//OMfKS8v58CBA+zdu5eBAweSl5fHAw88wMmTJ5k9e3bMfvPmzbz44osMGzYsNteisrKSu+++myNHjjBz5kxcLlfcEcKYpsmDDz7I2rVrOXLkCLt376a0tJS6ujrGjh3Lww8/zKpVq6ioqGDPnj1s3bqV48ePU1hYSGZmJqFQiA8++IDnnnuOjRs3sn//fjZv3kxlZSU5OTmkp6fz5JNPsmHDBjZt2sSqVas4ePAg5eXl2Gw2hg8fTm1tLT/84Q9Zu3YtCxcu7PA9Afjv//5vnn/+eWbMmEF2dnbs8/Lycn7zm9/Q0NDApEmTsNlsaK05evQoP//5zzl06BCjRo0iMzMz9p0f/OAHnDp1ilmzZnH06FH+93//l+3bt3PkyBE2bdpEfn7+JdOVzt/SbuBTmr+0acpMIKlrNFjADzPgjjSNFGc/j3ahtNY82SbZ4EusIS26x7hx42IPn9/vp7q6OtkEIrr8pTTJHEekyxkJ3RQI3vRLnvR0byZttan5n1aNX2s0GiL3VCK43gWznOd+lFYsX44rxYnWmurqGrZt29auVdUXhEIhXn75ZQAcDgejR49m1KhRyWa9pr6+nvXr16O1xmazMXHiRIYMGQLA5MmTGTZsGEIIfD4fr776avLXLylr166lra2NO+64gy9/+ctcddVVZGZmIiKRR8noDlwrr776Knl5ebS1tbFz584E+3gMw2Dy5Mncfvvt3H777dxxxx189KMfjUU1DR8+nDvuuIMvfvGLXHfddVRWVrJ582b8fj9btmzh8ccfZ9y4cXz+85/nS1/6EjfddBMNDQ288MIL1NXV8YlPfII777yTG264gfT0dG644QbuvPNO5s2bh8PhYP369eTk5AB06AqNorXG5/Px/PPPEwgEAGhubmbjxo2cOnUqwTYYDFJWVkYgEKClpYUPP/wwoRcQ/TsYDFJaWkptbS233HILX/nKV/jIRz4S6/VeCs79pnbBjoDmGU94Yk78YyKBf0tTjHMIbkkzWOLouGvbANzbpGnqoW/ZAnJzc2PRJqFQiJaWlmSTGAMM+KobCmUIhUITvl8hIfi9B95q69rJo7Tmt02asiAoodHibFqH4VLxiTTauZA6omhIESUls9CRCKvS0t00NDQkm/Waffv2ceDAAQDS09MpKSkhJSUl2azXbN68mZqaGoj0ZBYtWhRrZWdnZzN16lTS0sI9mXXr1nVaMV8K0tPT8Xg8HDt2DLfbTUlJCUVFRV32EuIF/8yZM6xbt45rrrmGkSNHsmvXLlpbWxPsowghyMjIYPjw4bFSUFAQ61mlpKQwdOhQhg8fzuTJkyksLKSpqYnW1lZWr17N+PHjufnmm5k0aRLDhw9n7ty5rFy5ktraWg4dOkRBQQHDhw+nsLAQu90e+3dOTg4NDQ3s2rWLhQsXMn/+fN577z08Hk/yKcYYM2YMhw4dYufOnWitOXDgANXV1bjd7oRr09LSwo4dO1iwYAHFxcWUlZXR2NiYsC8ikzRdLhcej4dTp04hpWT27NmMHDky2fSi0Y1XtWNMDT9thlqduAsNlDg0H00Lu23yJNzpluRL1S7/i0CwO2TwcEv8UKNFd0hOyRAMBhO2xyOByx2Cz6XZsInE+1WrBXc3CqqCHVfMAJt8ij+1qUQXHSBR3JiimGjv3oMkhOCGG27AMAyUUhw9epR9+8qTzXqF1po1a9YQCAQQQjBkyBCmTJmSbNZrPB4PGzZswO/3AzBx4kRGjBgR2y6EYPbs2TFXSHNzM2vXro1tv9Rcc801jB8/nieffJIf/ehHvP/++7Hf0h3effddXC4XCxYsYNasWZw4cYJDhw4lm0GkUVJaWspvf/tbfvvb3/LII49w7NixWI+/ra2NyspKKioq+OCDDzh8+DDDhg3D7/dTU1PDjBkzcDqdsf1JKRk2bBgZGRmcOnWqy2e/tLQU0zSZNm0a1157LXV1dWzfvj3ZLEZBQQHz5s3jtddeo7Kyku3btzN8+PBYr43IM1ZWVobH42Hx4sVMmDCBEydOcPLkyXa9JJvNRklJCdOmTeOVV17h/vvv5/XXX4/1JC4F3XlXO+QvXpP1oXAoYDwuobgzTTMoMjnHEIKpDsFnUxRGu8EsgRaSP/ihNGDJfk8IhUIJ3clz+aPdUvCRVMFSR/J1FhzVkm81CMzkTUBAa37aaNKoEntzANPsguUpRo9Cb4cPH87UaVMBqKmuYffu3V22vHrK4cOH2bdvH0op7HY78+fPvyCt/J07z0YgGYbBNddc027mbX5+PjNmzMDhcKCU4r333uuyR3Yxyc/P54477uC73/0ueXl5PPbYY2zatCk2RpQsXlGEEPj9ftasWUNJSQktLS04nU4cDgd79uzpMNVIVNjr6uqoq6ujvr4+Jnpaaw4ePMh//ud/ct999/HSSy+xbNkyFixYQEpKSsw9lkwwGMQ0TZxOZ6e9E6/Xy7Zt2ygsLMTv9yOEYNiwYbz77rsdnieRCmXFihV4PB4ef/xxzpw5k9BjI+K6Wbt2LQMHDsRut5OVlYXNZmPPnj20tbUl7E8IQW5uLp/+9Ke57777GD16NE899RQvvfRSgt3F5LxEv9FU/GdjuLUfxZRgCrjZqZlpFwmJ1dKl4FqXYK49BHEPU7Smrw9qft6saevkQbNoT0NDQ6yFYxhGt2Z9jjDg1jTNMBkE4ipgDW+GBH9oDcV/igaebtbsULZwK19IVKSkCM1HXDDZfnY2bneQUrJi+XKklLHu8+HDh5PNzgulFOvWraO5uRmArKwsFixYkGzWawKBAJs3b45150eOHMlll12WbIYQgiVLlsQGDhsbG1m3bl2y2SUhEAhgs9kYOnQot912G1OmTGH//v14PB7y8vI4duwYgUAArTXBYJDa2tpYPqhoSostW7Zwzz338Ktf/YqTJ09y8OBBKioqkg+F3W7niiuu4J577uGee+7hrrvuYsyYMTGxnjx5Mo888gjf+MY3cDgc6MgYSU5ODsOHD2fNmjW0RJL2aa0JhUKUlZXR0NDAyJEjO50DUV5ezsmTJyktLeWBBx7gnnvu4dSpU1RWVlJWVpZsHiMrK4v58+dTVlbGmDFjGDt2bML248ePU1payoEDB7j33nv59a9/zYkTJ9i6dWs7F4/WOjZLe8CAAdx+++1Mnz69y7GFC02PRT+k4bfNUJX0qhsKxgrNx1IlA+MUPyrjYxySW9JsDOjgiCaCrcFwsrCO61+LZMrLy2OtFafTSX5+frJJO4QQzHNKbkkzSBMCLSL3R4BPmzzsUWz3m7F7djSo+bNf0wRnbQnP8J1tFyxxgaMnih85h3HjxzF69Ci01hyvOM7+/ft75FrojKqqKvbu3RtrGV599dUdRpT0lvLyco4dO4Zpmkgpufnmm5NNYgwZMoSpU8M9G6/Xy6ZNm/q0Z3M+KKV4/PHHeeutt9i3bx/79u2jpaUllshvyZIl1NbW8sQTT1BaWsqaNWvYvHkzl112GRkZGaxbt46pU6fy6KOP8thjj/HYY4/xrW99i7a2Nj788MNOW9EdERV+EZnjsGTJEjZt2kRZWRlKKT7+8Y8D8OCDD7J9+3Z2797NqlWreO2117j88ssT3C7xBAKBWETSgw8+yKOPPsqjjz7KL37xC9LT09m0aVO7MMsoDoeDK664go997GPMnj273dyOv/71r4wePZqHH344tt/vfOc7mKbJ/v37E36/z+fjnXfe4cUXX4yFkp45c4bRo0cn7PNi0oEEd82egOI5f3J6BXCjuSkFpsTNZFfA+jaF0hqbEFyZIrg2VeMSut2NOqMEf/EKPgwku4AskmltbWXTpk2xCUEDBw4kNzc32axD3FJwUyrMdZhIodBCoSLt+xPKxi88UGlqPErzRJvmoBkOt42/XwOk5moXjO8iRLMrUlNTWLhoIYZhEAqF2LlzZ7voiJ6itWbr1q1UVVVBZCB18eLFyWa9xu/3U1payunTpwEYOnQol19+ebJZAtdeey12ux2tNSdPnmTXrl3JJhcVEUnhsXv3bp5++mnefvttRowYQUlJCS6XiyuuuIJbbrmFM2fO8Mwzz7Bt2zZmzZrFokWL8Pv95Ofns2LFioR9DhkyhDlz5kDkGkURQjBhwoRO50iMGzeOMWPCKTlSU1OZM2cO48aNo66uDr/fz+jRo/nyl79MQUEBr7zyCs8++ywHDhxg4cKFXHvttQlhkhkZGbFcR62trbhcLubPn58QfulyuVixYgUpKSkJcw4Axo8fH0tpkp+fz0033cTQoUMRQjBq1CiGDRuGUgqlFCtXrkzoYYwaNYo5c+bQ3NyMUopJkybFwmdTU1OprKzk2Wef5dlnn6WwsDBWmV0KepR7p0lp7m4wecFv4Iv7lhQwz6b4YaZgUlzo3qttIR5ohF/mCGY6wz7nDT6Tu5oVe4MSMxroHSFdaD6fCl/JEGT2wE/cl3g8Hu68807q6+sZOnQon/3sZ5kxY0ay2SXD7/fz2muv8dxzz9HS0oLNZuOLX/xiu5fwXKz2Ku5u1hxV4RZ89GrnCM3tbsE8m+AHLZpNoURhtwPXODUPZgoG9yJN87Fjx/jvn/8PR48dxel08IUvfIHFixefd/6b2tpaHnnkEbZs2YLWmhtvvJHPfOYzyWYxzjf3zqFDh3jssccoKytDCMGdd955zmuvlOL+++9nx44d2O12Fi1axOc+97kEP3FvON/cO4HIOgMOh4Ps7Ox240LR9QHcbncsnDMYDBIIBGIpRqJE3UBRP3v8OXi9Xmw2W4dumKgPPH7cxe/3Y5omLpcrth+tNQ0NDbHEeR3F2pumic/nw+VyobUmEAjgcDjajbUEg0GCwWC7bdEeYke9Q5/Ph4isceHz+UhJSWl3vQKBAKFQiJSUFNra2mKRO9Ft9fX1iIiPP/mcLibdezoivN1mss5PguBrNDlSsdKlGRfX1y8LKu5vgv1K8KtWQXMkLHOGU3KjS5AjkrPyQIsWvOKHzf72kT79HaUUFRUVPPXUU/z1r3+NhcdFWxg9ZXGK5EZXeLxFRlryQggakfzFqzkQVAwxwJF0J/KE5kZX7wQfYMCAAZRcMQshwi/5li1bYr7486GsrIwjR46gtSYtLY3ly5cnm/SaUCjE/v37OXr0KEIIBg8ezLRp05LN2iGl5MYbb4SI4Bw6dKjPxjF6g8PhYNCgQeTl5bUTMCLiV1RURFZWVkzg7XY7aWlp7XrqIpIqJCUlpV2lk5qa2qHgExH75IF2p9NJampqwn6EELE8VB0JPpGxrbS0NAzDwGazkZqa2qG42u32Dre5XK4OBZ/INqfTic1mw+12d3i9HA5HrDJMTU1N2JfD4aCgoICBAwe2O+7FptuiXxnSvOQVnFaJX7EhuNyAm9w27JEHwas19zUpDipBUMAHQcHznrB4OIXgk2k2pto7nol72BS86IUTXYQQ/qMRHczpSQkGg7S2tnL48GGef/557r33Xh588EFeffVV6uvrY+L2pS996bxmeqYKuCNdMskQGDqc/jo8JCs4qiRrg5KFTkGxPFs5G2jm2BVLU3on+ESEYMKECbFZsqWlpVRWVtKDjmeMxsZGysrKqKurA2D27NndGuPoKTU14WijaOt04cKF3Z5kM378+Fi21srKSnbv3t2pT9nC4kLSke62Q2vN622a9UFJMKmGHygVn0kT5Mbt6X8aTTYFwiN/AjijFM/4oTwSlplrwFfckN2BdigEf/XBB35N8DwE4O8N0zR5+eWXufXWW/nUpz7V7XLbbbfxb//2b9x111089dRTlJaWcvLkyZi/ND09nR//+Med+kq7wwBD8EAGuEgUH43gLb/GqzVXOjRpkbURsmQ4V35at56arhFCMGLECCZNmgSRLv277757XgO60Sn8SilsNhvLly/vsCXWG7TWVFZWxvzx2dnZsXDM7mCz2WJuoGAwyL59+zqMdLGwuNB06/UtD2pe9Zk0xIdbAkJoFtsVS1PP7sanNDtN8GoBSAwlMZTBHp/gOa8mENnHvBTJp1xBbEmx+1prAkh+16o5HEyI8PyHJOrrbG1t7XHxeDyxFL1EhCM62PXQQw91GrnQE6Y7BV9PERhahLNlmoApCCiDF9pgoRMGokCZ3OyAaec5eNsRWVlZTJw4MdZafu+992hqako26xKfz0d5eXksQdiMGTMoKCjo9XVJprm5mW3btsV8uyUlJT1aV1dKyZQpUxg6dCgABw8ePGcCsAtN8pF15HntCK3PzsImattJ6YlN1K4rko+djAKCWmN2cu50cPyOziX538l0ZNtZ6Y7dpeKcb3Cb1rzlM9ngj3b/wwhgiKH5j8wkv5gUfC1VUyRMZCTHiwACCN70wbttZ2/Of2TaGSVDRLK5JFAagv/1Krxd3Mh/FLKysiguLu5WKSoqIiMjo52YuFwu5s2bx09+8hO+/e1v9+kC41/PksyTCsPUcU4e2BUEH4I5TsFgA7557qkAPWbs2LGx6I1QKMRrr72WbNIlVVVVbN++PeZTnjdvHm63O9msV2itqaqqYuvWrRBJuTB9+vQeu9XS0tJYvHgxhmEQiCzrealSM5wOKbb5TGpC4UZXi9Ls9iu2+MORW/EENRwJhZMrepWmMmiyyafYEFc+iPv7eFAT0ppSvxnZFv7/hraz5WRIY2poMDUb20Kc6sKdWxFUbPaZ7dK1NJqKsqDmXa/JH5sCvNwUYrtfcSyUmD32TEizJe748ee62xeiNbLfvf7wtpMdJKOqCGq2tJn4lManFJvaQgm/P/73lUbGJE8GE39zfNnj6/z3Xmi6zLKpNOwOKH7RrDmlw2ueRjHQ3JMuuDKlfb0xxG5QFQqxPSgTMjvWKzBQTHdKMqTAKQUjbYLX/II2eXb1JQCEZH9IM9sOwy7kSupJBPs4y6aUkqFDh7Jw4UKuvPJKlixZ0mlZtGgR06dPp7CwkPT0dKSUsdw0aWlpzJo1iylTpiRMSe8LpBCMtWvW+sLpk6OYAvIMWOoQzHLAFSl96zIhIqB1dXV8+OGHBINBqqqqWLx4cacDavEEg0G2b9/Om2++idaaCRMmsGzZsoQQvc7oSZbNQCDAmjVr2LZtGwAzZ85k4cKFPRZ9wzBwOBzs2rULj8dDc3MzY8aMobCwsN3gZ084nyybz7aG+HajptiACU7JngB8u0nwixYoEJqpjrNhumeU5mctsMoLlztgmzfI422C9/2a1/3wUKvggyDsC5hs9GsyDBhlE/xLreK3XsFxU7HJp9noE2zww0Y/5NsExXbBRr/iE7WKQqGZ6er4+v+yPsi3PYJ5DhhmC1+nYyF4tDnE/Y0hPgga1JoG602D37WY7A1oJjsEAyJZAVZ7TL7YFF7DY09AsyGg2eAPl9NBk7F2QY4h+cwZkx97JbVBzRVOTVpcBOGvPYK7mxUfd0FIab7fEGJ9QPCGT/OYR/OWD8oCmi3+cMr4JSmSP7WE+FqjwQ6/pjQAmyK/faMfqpRgSR+MjZ0PXT5pzVrztzYo0zaIS6om0My3hfg/qR2ftABuT7czSSbmxFAC1gYEa9t0LAJoUarBbSka2UHStSYt+UkLNJuXrlbsC2w2G2lpabjd7i5LZmYmI0aM4JprruGrX/0qd955J4sWLUJKSVNTE2vWrGH79u2xmbh9yUSH5F/Twh3P6H8g2BeEyxxwU5wLry8RQjBt2jQGDx4MkZnG3c1R09LSwvr16wmFQtjtdmbMmMGAAQOSzXpNY2Mj77//Plpr3G43kyZNOq/jiMicilmzZkEkR/327dsvzWQtAYhony6MKcJJ+H7aqtkcH6IXdUlETJen2flZBvwqM7w8phvFdQ7NQ5mChzLhGme4x6+BdAG/zJD8Mkvwy2zNQ9maX2ZrrnRq7JFnDCkTziMZrUELGXP11pia37cqXvRJlqUYPJAJv87R/DRL8+V0wVi7TIgwDO9a8KlUxUPZ4fOOlv/IsDHEHnm2BdiE4PWA5vHWUMwVDUQSFYavQ67d4Gc5Nh7Kgm+6FcWGYpFT86Ms+GU2fCvWFhDk2jSfd6vY746Wr1+AXnN36fRNVkBpQPGXtvCi5iIurC9TKL6XZZDSRSz9IJvke1kGtnj3jBbUKoMnvIKKyAIqAvisWzDT1l7YhYZNQcEfWttXCP/sSCkZM2YMn/zkJ5kzZw5CCKqrq3njjTd6PZGpI3Qk6iri2keL8PWvDwnskV7ZhWLIkCGMHz8+1oN58803z5mjRkcW5ygvDydsGzJkCOPGjetWD6GnxE/6Gj58eCyt9fmQnp7O5MmTY5Pptm7dSk1NTae+9AtJco9AAAtdGqcU3N2gqehkomSG3WCw00aR08YgW3hsL8MmGOK0UeS0k2EzwsKiNYbWDHMaDHHaEkq6Eb9Gdvu8TvHEu5U1sNOvec1rck0qfCfLYHGKJN9uMMUp+fdMG/+RKZnabqq4JtcQFEXOO1ryHQaOuOvgFHC1S/O0V/Kq9+xZaR1uDkG4Yoh+v8Bm4ESQbggGOQyKnDYGOiLPhgivYDfQJtsdd0C0orkEdHrkgIbftUBNXBbNcL2s+GwaTHac7YrVm4pfNwf4rybFqThn2oJUG7e4FUTyskWv7a6g4LkWE0/kmRpiE/x7hiQ1aUVdLcLRPL/xCnb5+2d4W35+Ptddd10sg+OBAwfYtGlTu9mEveWEqfmzN7zu7Vk0triQzQuFzWZj9uzZsQHd6upqNm7cmGyWQCgUiuWEl1K2y3LZVyilWLVqFVprnE4n48ePj+XMPx9EJGppwoQJaK2pr69n8+bNfzfhmxMMuN8tKFOa77VoAvE98PByDB3Q+RPiRfBMq+I5j+ZZj+Y5j2KTT7UbN+iSs3UDHqXZHdQYAq50Ql7EhRPFDuTIxDMK16eCTUHJcx4dKy95FMfi/fcCHJh8I8NgkBT83qPZ6e+44osR6S2F35L2lahHa9b54S8eFSt/9ST2Ii42nYr+G16TN5IGVwwNEyR8MlUSdbMrYHsA/qdF8lArvOBVsYERG/CNdEkBZ/O5EOlGPuaHDyP7twvBHIfkX1JA6sRehRZQryU/qgezJw/KPwlSSkaPHs3SpUsxDINgMMirr75KbW1tsmmv+F2TSZ2pEh5bgaZYaroXlNg7xo4dS3FxMVJKlFK8+eabXbqxqqqq2LRpU8xlMnHixE4n7fSGDRs2cPr0aYQQFBYWMnny5G6HaXZGXl4el112GW63G601b775ZoeZJC8FhoLFKYJvueEdn+AXzeEp23HrIPWIViH4RhN8rQm+1qT5WqPmSa+mMWHJze7j01BrCrKR5IizfYA3PAFWnvJy9Uk/V5/0s/Kkj9/X+/CEzNga3c/4JV9vIla+1xzO+RVFa5BaM9Iu+FaW4HBI8YRHc6aj9LPdpFZpft8GX2/UsXJXk0p0P11kOhX9X7aamEgEGqnDSbacKL7k1hTFzcY8HdI83qKpQeARml+0mmwNqFiETqEBX8/QyEg+fYVGK02zMri3yYyt2jTAgI+lwkQjFLUKh2ppjdKaDRg85Qn/3d+w2+1MnTqVadOmIYSgoaGBt99++7xi2jviUEDxhF8SNBJbclJDiQNSL6BrJ4phGCxduhSnM7yyVlVVVWzgNBmtNa+88kos91BxcTETJ05MNus1SilefPFFiJzfiBEj+uQ4UkomTJgQW80rugLXxURr0PGNqLhbLAV8NcvGYpviWV94kZ3up1BLJFcrSgsEewpgb4FgT6HkwSxJQULURtdoraP+FRwCUg2TJhGkNe5pdUvJELuToS6DFLuN3Tg4LaNrToRdDT9wK3YXECvv58P18YOpGrQOZxW73CH4kluzqk3xchsEIp6OZMKnpjrZCkNt8KsMKC2UsfJBgb1H6cj7mk5F32kKbOpsTSoFLHfAHJeM+cCCwJs+xZtBgS3y3NRpg580K2oiT4lDhHOuL7GFr5COuG0ANgRs/KnlbMqFSQ7Bx9ME6Un9SA14FPzBqznUTxdTHzRoECUlJbFwxLfffpszZ84km/WYgNY82KLxJw3qAQw2BLNTbLgu0vM5ZcoUioqK0Frj8XhYv359h4tN1NfX88477yCEICsriylTpiQk3uorSktLY+kSsrOzKSkpOW9ffjLJYxCrV6/us0q8N4iIK9YA7s+VpBghHvZojobaPR7dwiDsgsmVZ0u6FBjdiDDqCLcUTLRJGkzJFr+OeRXmpth4ZIDBr3Js3JgmyBCaobbwgHKUdFTCeeQYAmcnp5EqBdem2ljqFDzRYrLVH3UT9YRwgzkz7pi5UpAje5aOvK/pVPS/mCFJMTRah6NuCqXiJjcJrfxjQXikRROSoKVECImB4MOQQUtcK6LQgNvcikKZ6Lc0EfzMIzgYcfOkSMGKFMliB5GR/bMoAR+GBI97oPkcbrZ/RqSUTJ48mXHjxiGEoLm5uU/WXd3kM3mjA7+lE82NqTDCduF9+lHsdjvXXnstRHz2hw8fji17GM/rr79OW1sbQggGDRrUrfw3PSUYDPL666+jtUZK2ecrcEkpmTZtWiwNRUVFRac9m0vFUJvk/6bZaFKCLee5yFEIOBoKh1geM8+WelPH1m7QaM4ozeGg5lBcqTET4+2JCNYMh2SBS/BMGzzhUewJaM6YcDik+ZtX8+dWmG4XXOGUCc/uGZV4DsdMOBFKzCUWz1Cb5Da3QYqQlAYEbZ3YdYaONIyrlG533IpeuIx6S6eivzzN4BanQmqNC801KVDiPJsvx9SaXzcrDoUEOpJugcgPvTpFxWJkiYx2z3IaXJ8qExN4CU2NFvy0JUQkNQ8j7IKbU2BoXMiuiLgavAje8sPGSzix4VJSUFDA1KlTY/Hh7777bizF7/nQbGr+nwe8OuzXEVogIv7byXbB1SmQdZG7oSUlJbHwzbq6OrZt25bQ2q+vr48tQOFyuZgyZcoFybNz6NAhysvLYwO4c+bM6fNJX6NGjWL06NGxMYJVq1Z1OY7Rp2iBjnfUR/6MnyhpAxa5DD6dJnBL1WmMTWf+foGgFck9TZrvNWq+13C2vOLVeFW4QWEKweqA4O5GzV1NZ8tfWsOTwaLPpIg0tYfZBV9w25jhkPymFb7dpLmvBb7bDA82KfKF5gtuGBUdeNQgFLzoF9zdoMKlUXN3o+a/mhUHY4O5GhE31iCAGU7Bp92aAqk6/J1nr4lu5+LRhJeT/ZNXcHej4q648sPmDnZ2keh0cpZNwDBDsNevyZVwp1swOm6VpLfaFD9pkWG3gDgb/jXOgG+6JcX28KSfKClS4JaCfSE4rWRsoBbglKkpEppJjnDNXGiX1IQ0e0KaYELAFngVFBmaK5zn30Xsir6enNWXiMgC0+Xl5dTW1hIIBDAMg+nTpyebdovXfYo/eSWeyIMuEEggB82nUzXLU40eL5LSW6J557dv304oFEIIwejRo8nJyQFgzZo1bNiwAaUUAwYM4NZbb+120rN4upqcZZomL7zwAvv370cpxeDBg7n11lv7PBw0mg2ytLQUr9cbm6zV0+ftfCZnGQIG22CWUzLAEAg0WQZMccAImyTaZnMKGGoTDDM0Mx2CiU5JStz+BZAtBFc4RYIXgEilMc0hKDRgkCEoMASFRvjfY+ww3C6xR9bRnmgXDLZBkXG2jLELiu0Sp4Biu2C2U5BphDWiwCaYbIfRdkmmDAeZDDY0K1IEn3RLpjgl0XajBAoMzUhb+NjxpciAiQ5BlhQYaKY5BJe7zvYQDBGOLhxsaKbYYLZLJriMADKlZorTYIRNxJJOEon5HyQFo23R3372uIMNKOnMt3SB6VT0BWFf1DBDM0JqlqRKbJEf1KQ0dzSYnDRlxAkYnr7vQHN7Glyd0v7CCCBPCrymYndQ0BYn5QEktSbMdWiyI3624TbY6FfhkNH4aB5gsqGY7wzHj/c1f8+iT2Rmbl1dHYcPHyYYDFJdXc3cuXN7nJu9XsHPWzR7gtFws/A9EmjmOxW3p0vyk8LhLhYFBQWsW7cOr9eL1+slPz+fMWPG4PF4eOKJJ6ipqcEwDObOncuVV17ZLZFLpivRP15xnFdWvUJ9fT0A119/PdOnTz+v45yL3Nxc9u7dS1VVFaZpEggEmDdvXo+OdT6in2cIJtkFA23h3nuqgLF2yTC7xBa39LUA0oVggkMyxi5JS/JHp0nJJEc41XZyI2yMHWY4YGYHZYRd4BCCTEMw1Q4zHaJdGWkXOIWg0C6Y5gzPmo0/rywpGGuPuHIcMNsZXo873wg3XqLk2AST7e33P9MhmOaU5ETsRzskUxzh84rHJQSj7ZLpLklaXAMXIEXAGIfBMFs4g3D8+eUbMD3yey93hAeHo2W6I66CuMh06t4BsAuYl2pwS4YNZ9wJPtysOBiMDt1GOjYC5jlgmUvg7mSvLgE3pAqm2ZPi8YE9IcGfW4lF54ywC+5wh1fkip+4kibCPYELOVno7xkpJQsXLoylGmhpaeHtt99ONjsnr3tNdgbC4yoxNAwSgutSDIZHprtfCtxud2zVK6/XS1lZWSz3zalTp9BaYxgGK1as6FX6gs7YvGUz1TXVaK1xOBwsW7asW0J6PjidThYuXIgjsjbswYMHOxzH6GtsIjxYGW0NG0LgEuE49+RfKkW4xe8U7QVDinAvviMBS5GCtE6KIyKQEtpti5aoiDqEIFUkCnkUG+CWkGWEB4g7Og8jMjCbvP80KUgR4e1E9KmzSDWHCFeM8d4L4q5b9PfEYxftjxctnR3nYtDRdUzAiIh/lF1+k6fbwC9ASY0WYT9YrtBc79KMO0eenME2yf9Jg0LjbEim1hqPhjeCgnWRcGUB3JBqsNSuEDo8nGOgmWbXXOUKL/zRXyksLGT69OnYbDZM02TdunWxHD3docrUvOYTVJkk+CElmplOuD5NcAmfSQzDYOHChaSnp6O1Zv/+/ezbt4+NGzfGZupOmjQptrRdX1JTU0NZWVksNcLy5csvSGRQPHPmzInN0G1ubo6lfLCwuBCcU/TjaVGaR5o11UkLqQghuMwW7gKdMDUVoa7LBBuMlSpWwxKRng+DmjU+TVvkgTeE4O4sSWFEgfIE3OBMXKGrv7J06dKYS6ehoYH169d3SyhMDW/5YEcwsvZtdIOGITa41S1I/zu4vDk5ObEVwRobG3nppZcoLy+P5cy/4YYbkr/Sa7TW7Nq1K5bnPiUlheuvvz7ZrM9xOBysXLkSIQSBQIB9+/Zx/PjxZDMLiz6hR6K/1qdYH9IkR04L4IgJP27WfKVedV7qTL5SZ/KtesVRs72yBITgQ1NzKi6yc4Rd8t10jRvFXKfi+rT23aj+yLBhw5g5cyZEXCBbt27tVi76E2a4Yq2Kpr2OjJU4pWC5U7Ogb8cqz5vU1NSEeQkVFRU0NjYCMHr0aC677LKkb/SehoYG9u7dG+s1lZSUMHDgwGSzC8KCBQtirf2amhq2b9+OSlprwsKiL+i26Jtas9GvqTHbzz5TWnMiBO8HBO8HZeclZMTKUVMkxOAKQCrwKhEL34xyc5rBZ1I0n3NLso1un/I/NUIIVq5cGVsEOn5Vp84IaNjg12wKapQALQQQDtOcbFd8IV3SN1OPek80JXV0Za34z6+77rpO0yCfLzqSwG3//v1orUlJSeGqq666YL78ZDIzM1myZAlEBmb37t1LTU1NspmFRa/pkYIqE1CJEx76EokgV0BWUkCsSwr+PVNyuT3h435PcXExM2bMgEgrddeuXV1mp6xTms1tJg1mpN4W4djnMVJxXzoU93Kx874mJyeHGTNmJOTUKS4uZvLkyQl2fUFraytlZWWxWc6TJk26IAncumLJkiVkZWWhtebo0aOUlZV1y2VnYdETui36hhAsTTUYZjfQ0dy7fYQgPAGjSCpWpAgGdRA5kidFLGT0QiKlJD8/n+zsbLKyskhJSUk2+btBSslHP/pRcnNzcbvdNDU1ddk6zJHw5Uwbf8gS3JumuMMV4h634tFcwWxX+2t+qbHb7YwdO5bJkyeTnZ1NdnY2K1as6HF4akdE1y+I7relpYXq6mrcbjd5eXlceeWVFySBW1fk5+cnCP+ZM2c6TEORTFpaGsuXL2fUqFEXrWdi8Y+L0D1oSphAmV/zXKvJByFJfWxSTzh0S0b/jvs/0W2R/OwJ2yOfK1MxztD8i1syw9k+TvZiorXG5/OhlEJKicPh6HNXQl+itaatrQ0dSRfQnfM1dTg7qorci/i47L83tNb4/X5MM+wMdDqdfZL/JhQKxXLdRFe0CgQCmKaJiCy92BfH6SmBQCA2K9dut2O3288p5FprlFIIIS5ICKvFPxc9En0LCwsLi39srGaBhYWFRT/CEn0LCwuLfoQl+hYWFhb9CEv0LSwsLPoRluhbWFhY9CMs0bewsLDoR1iib2FhYdGPsETfwsLCoh9hib6FhYVFP8ISfQsLC4t+hCX6FhYWFv0IS/QtLCws+hGW6FtYWFj0IyzRt7CwsOhHWKJvYWFh0Y+wRN/CwsKiH2GJvoWFhUU/whJ9CwsLi36EJfoWFhYW/QhL9C0sLCz6Ef8fe96N7svnL1QAAAAASUVORK5CYII=";
  await new Promise(resolve => {
    img.onload = () => resolve();
  });
  doc.addImage(img, 'PNG', 10, 10, 60, 20); 

 
  doc.setTextColor(0, 230, 253);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('Relatório de Visita', 80, 30); 

  let y = 45;
  doc.setDrawColor(0, 230, 253);
  doc.line(10, y - 5, 200, y - 5); 

  const campos = [
    ['Empresa', 'rvEmpresa'],
    ['Data', 'rvData'],
    ['Gestor', 'rvGestor'],
    ['Analista', 'rvAnalista'],
    ['Serviços Contratados', 'rvServicos'],
    ['Chamados Urgentes', 'rvChamados'],
    ['Local', 'rvLocal']
  ];

  doc.setFontSize(12);
  doc.setTextColor(0);
  campos.forEach(([label, id]) => {
    const el = document.getElementById(id);
    const valor = el ? el.value : '';
    const texto = doc.splitTextToSize(`${label}: ${valor}`, 180);
    doc.text(texto, 10, y);
    y += texto.length * 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  // Resumo em tabela
  const resumo = document.getElementById('rvResumo')?.value || '';
  const linhasResumo = resumo.split('\n').map(linha => [linha.trim()]);
  if (linhasResumo.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 230, 253);
    doc.text('Resumo da Visita (Tabela)', 10, 20);
    doc.autoTable({
      startY: 30,
      head: [['Conteúdo']],
      body: linhasResumo,
      styles: { fontSize: 10, halign: 'left' },
      headStyles: { fillColor: [0, 230, 253], textColor: 20, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1
    });
  }

  // Gráfico
  const canvas1 = document.getElementById('chartVeiculos');
  if (canvas1) {
    const imgData1 = canvas1.toDataURL('image/png');
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 230, 253);
    doc.text('Gráfico: Report de Veículos', 10, 20);
    doc.addImage(imgData1, 'PNG', 10, 30, 180, 90);
  }

  // Gráfico: Comparativo
  const canvas2 = document.getElementById('chartComparativo');
  if (canvas2) {
    const imgData2 = canvas2.toDataURL('image/png');
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 230, 253);
    doc.text('Gráfico: Comparativo de Visitas por Empresa', 10, 20);
    doc.addImage(imgData2, 'PNG', 10, 30, 180, 90);
  }

  
  doc.save('relatorio_visita_completo.pdf');

  // Salvar PDF no Storage do Supabase na pasta do cliente
  const clienteEmpresa = document.getElementById('rvEmpresa')?.value;
  if (clienteEmpresa) {
    const clienteId = await buscarClienteIdPorEmpresa(clienteEmpresa);
    if (clienteId) {
      const pdfBlob = doc.output('blob');
      // Nome do arquivo sanitizado
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const sanitizedFileName = sanitizeFileName(`Relatorio_Visita_${clienteEmpresa}_${dateStr}.pdf`);
      const filePath = `client_documents/${clienteId}/${Date.now()}_${sanitizedFileName}`;
      const file = new File([pdfBlob], sanitizedFileName, { type: 'application/pdf' });
      const { data: uploadData, error: uploadError } = await releaseClient.storage
        .from('clientdocumentfiles')
        .upload(filePath, file);
      if (uploadError) {
        console.error('Erro ao fazer upload do relatório de visita:', uploadError.message);
        showAlert('Erro', 'Erro ao salvar relatório de visita no cliente.');
      } else {
        // Gerar URL pública do arquivo
        const publicURL = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/clientdocumentfiles/${filePath}`;
        // Inserir registro na tabela client_documents
        const title = `Relatório de Visita - ${dateStr}`;
        const type = 'relatorio';
        const { data, error } = await releaseClient
          .from('client_documents')
          .insert([
            { client_id: clienteId, title, type, file_url: publicURL, file_path: filePath }
          ]);
        if (error) {
          console.error('Erro ao adicionar registro na tabela client_documents:', error.message);
          showAlert('Erro', 'Relatório salvo no Storage, mas não registrado na tabela client_documents.');
        } else {
          showAlert('Sucesso', 'Relatório de visita salvo na pasta do cliente!');
          if (typeof fetchAndRenderClientDocuments === 'function') {
            await fetchAndRenderClientDocuments(clienteId);
          }
        }
      }
    }
  }
}

function exibirRelease(d, url) {
  const c = document.createElement("div");
  c.className = "document-card";
  c.setAttribute("data-release-id", d.id);
  const arquivoJson = JSON.stringify([{ path: d.file_path }]).replace(/"/g, '&quot;');
  
  // Preparar informações dos tickets relacionados separados por classificação
  let ticketsInfo = '';
  if (d.tickets_relacionados && d.tickets_relacionados.length > 0) {
    // Separar tickets por classificação
    const ticketsBug = d.tickets_relacionados.filter(ticket => ticket.classificacao === 'bug');
    const ticketsMelhoria = d.tickets_relacionados.filter(ticket => ticket.classificacao === 'melhoria' || !ticket.classificacao);
    
    ticketsInfo = `
      <div style="margin-top: 10px; padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 4px solid #4fc3f7;">
        <strong style="color: #4fc3f7;">🎫 Tickets Relacionados (${d.tickets_relacionados.length}):</strong>
        
        ${ticketsBug.length > 0 ? `
          <div style="margin-top: 8px;">
            <div style="font-weight: bold; color: #dc3545; margin-bottom: 4px;"> Bugs (${ticketsBug.length}):</div>
            ${ticketsBug.map(ticket => `
              <div style="margin: 2px 0 2px 15px; font-size: 0.9em;">
                <a href="https://suportetryvia.freshdesk.com/a/tickets/${ticket.id}" target="_blank" style="color: #dc3545; text-decoration: none;">
                  #${ticket.id}
                </a> - ${ticket.subject || 'Sem assunto'}
                ${ticket.clientName ? `<span style="font-size: 0.8em; color: #666; margin-left: 8px;">(${ticket.clientName})</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${ticketsMelhoria.length > 0 ? `
          <div style="margin-top: 8px;">
            <div style="font-weight: bold; color: #28a745; margin-bottom: 4px;"> Melhorias (${ticketsMelhoria.length}):</div>
            ${ticketsMelhoria.map(ticket => `
              <div style="margin: 2px 0 2px 15px; font-size: 0.9em;">
                <a href="https://suportetryvia.freshdesk.com/a/tickets/${ticket.id}" target="_blank" style="color: #28a745; text-decoration: none;">
                  #${ticket.id}
                </a> - ${ticket.subject || 'Sem assunto'}
                ${ticket.clientName ? `<span style="font-size: 0.8em; color: #666; margin-left: 8px;">(${ticket.clientName})</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  c.innerHTML = `
    <div class="document-header"><span class="document-type">${d.tipo}</span></div>
    <div class="document-title">${d.sistema} - ${d.versao}</div>
    <div class="document-author">${d.analista}</div>
    <p>Status: ${d.status}</p>
    <p>Data Liberação: ${d.data_liberacao}</p>
    <p>Data Homologação: ${d.data_homologacao}</p>
    ${ticketsInfo}
    <div style="display:flex; justify-content:space-between; margin-top:10px;">
      <a href="${url}" class="btn-secondary" target="_blank">Ver Arquivo</a>
      <button class="btn-secondary" style="background-color:#dc3545;" onclick="deleteRelease(${d.id}, '${arquivoJson}')">Excluir</button>
    </div>`;
  document.getElementById("releaseList").appendChild(c);
}

async function carregarReleases() {
    const { data, error } = await releaseClient
        .from('releases')
        .select('*')
        .order('data_liberacao', { ascending: false });

    const container = document.getElementById("releaseList");
    container.innerHTML = "";

    if (error || !data || data.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>Nenhum release salvo</p></div>`;
        return;
    }

    data.forEach(d => {
        exibirRelease(d, d.file_url);
    });
}


async function deleteRelease(id, arquivosJsonString) {
    if (!permissoes.includes('deleteRelease')) {
        showAlert('Atenção', 'Você não tem permissão para excluir releases.');
        return;
    }

    const confirmed = await showConfirm('Confirmação', 'Tem certeza que deseja excluir este release e seu arquivo?');
    if (!confirmed) return;

    const arquivos = JSON.parse(arquivosJsonString);

    if (arquivos && arquivos.length > 0) {
        const pathsToDelete = arquivos.map(a => a.path);
        const { error: storageError } = await releaseClient.storage
            .from('releasefiles')
            .remove(pathsToDelete);

        if (storageError) {
            console.warn('Erro ao deletar arquivo do Storage:', storageError.message);
        }
    }

    const { error: dbError } = await releaseClient
        .from('releases')
        .delete()
        .eq('id', id);

    if (dbError) {
        console.error('Erro ao deletar release do banco:', dbError.message);
        showAlert('Erro', 'Erro ao deletar release.');
    } else {
        showAlert('Sucesso', 'Release excluído com sucesso!');
        document.querySelector(`[data-release-id="\${id}"]`)?.remove();
    }
}

async function salvarRelease() {
    if (!permissoes.includes('salvarRelease')) {
        showAlert('Atenção', 'Você não tem permissão para salvar uma release.');
        return;
    }
    
    // Validar campos obrigatórios
    const dataLiberacao = document.getElementById('releaseDate').value;
    const status = document.getElementById('releaseStatus').value;
    const sistema = document.getElementById('releaseSystem').value;
    const versao = document.getElementById('releaseVersion').value;
    const analista = document.getElementById('releaseAnalyst').value;
    const dataHomologacao = document.getElementById('releaseHomologDate').value;
    const tipo = document.getElementById('releaseType').value;
    const clienteId = document.getElementById('releaseClient').value;
    const arquivo = document.getElementById('releaseFile').files[0];
    
    if (!dataLiberacao || !status || !sistema || !versao || !analista || !tipo || !clienteId) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    if (!arquivo) {
        alert('Selecione um arquivo.');
        return;
    }
    
    // Preparar dados dos tickets - limpar dados desnecessários para evitar problemas no Supabase
    const ticketsSelecionados = ticketsSelecionadosMultiEmpresa.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject || 'Sem assunto',
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        clientName: ticket.clientName,
        classificacao: ticket.classificacao || 'melhoria', // Incluir classificação
        description_text: ticket.description_text ? ticket.description_text.substring(0, 500) : '' // Limitar tamanho
    }));
    
    try {
        // Upload do arquivo
        const nome = Date.now() + '_' + arquivo.name.replace(/\s+/g, "_");
        const { error: uploadError } = await releaseClient.storage.from('releasefiles').upload(nome, arquivo);
        
        if (uploadError) {
            console.error('Erro no upload:', uploadError);
            alert("Erro ao fazer upload do arquivo: " + uploadError.message);
            return;
        }
        
        const file_url = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/releasefiles/${nome}`;
        
        // Preparar dados para inserção
        const dadosParaInsert = {
            data_liberacao: dataLiberacao,
            status: status,
            sistema: sistema,
            versao: versao,
            analista: analista,
            data_homologacao: dataHomologacao,
            tipo: tipo,
            cliente_id: parseInt(clienteId),
            tickets_relacionados: ticketsSelecionados,
            file_url: file_url,
            file_path: nome
        };
        
        // Inserir no banco
        const { data, error: insertError } = await releaseClient
            .from("releases")
            .insert([dadosParaInsert])
            .select();
        
        if (insertError) {
            console.error('Erro na inserção:', insertError);
            alert("Erro ao salvar release: " + insertError.message);
            return;
        }
        
        const empresasCount = new Set(ticketsSelecionados.map(t => t.clientName)).size;
        const bugsCount = ticketsSelecionados.filter(t => t.classificacao === 'bug').length;
        const melhoriaCount = ticketsSelecionados.filter(t => t.classificacao === 'melhoria').length;
        
        showAlert('Sucesso', `Release salva com sucesso! ${ticketsSelecionados.length} tickets relacionados de ${empresasCount} empresa(s). Classificação: ${bugsCount} bugs, ${melhoriaCount} melhorias.`);
        
        exibirRelease(data[0], file_url);
        
        // Limpar formulário e resetar tickets selecionados
        document.getElementById('releaseClient').value = '';
        document.getElementById('ticketsSection').style.display = 'none';
        ticketsSelecionadosMultiEmpresa = [];
        atualizarContadorTickets();
        
        // Limpar outros campos
        document.getElementById('releaseDate').value = '';
        document.getElementById('releaseStatus').value = '';
        document.getElementById('releaseSystem').value = '';
        document.getElementById('releaseVersion').value = '';
        document.getElementById('releaseAnalyst').value = '';
        document.getElementById('releaseHomologDate').value = '';
        document.getElementById('releaseType').value = '';
        document.getElementById('releaseFile').value = '';
        
    } catch (error) {
        console.error('Erro inesperado:', error);
        alert("Erro inesperado ao salvar release: " + error.message);
    }
}

// ===== FUNÇÕES MODIFICADAS PARA FILTRO POR SETOR - ABA REUNIÕES =====

// Função para salvar reunião incluindo o setor do usuário logado
// Função para salvar reunião incluindo o setor do usuário logado
async function salvarReuniao() {
    if (!permissoes.includes('salvarReuniao')) {
        showAlert('Atenção', 'Você não tem permissão para salvar uma reunião.');
        return;
    }
    
    const clientId = document.getElementById("reuniaoCliente").value;
    let cliente = "";
    if (window.clients && clientId) {
        const obj = window.clients.find(c => String(c.id) === String(clientId));
        if (obj) cliente = obj.name;
    }
    
    const data = document.getElementById("reuniaoData").value;
    const horario = document.getElementById("reuniaoHorario").value;
    const tipo = document.getElementById("reuniaoTipo").value;
    const responsavel = document.getElementById("reuniaoResponsavel").value;
    const participantes = document.getElementById("reuniaoParticipantes").value;
    const file = document.getElementById("reuniaoFile").files[0];
    
    // Obter o setor do usuário logado
    const setorUsuario = sessionStorage.getItem('setor') || 'Time de implantação';

    let file_url = "", file_path = "";

    if (file) {
        file_path = Date.now() + '_' + file.name.replace(/\s+/g, "_");
        const { error } = await releaseClient.storage.from("reuniaofiles").upload(file_path, file);
        if (error) return alert("Erro ao fazer upload da ata");
        file_url = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/reuniaofiles/${file_path}`;
    }

    // Incluir o setor na inserção da reunião
    const { error: insertError } = await releaseClient.from("reunioes").insert([{ 
        client_id: clientId ? Number(clientId) : null, 
        cliente, 
        data, 
        horario, 
        tipo, 
        responsavel, 
        participantes, 
        file_url, 
        file_path,
        setor: setorUsuario  // Adicionar o setor do usuário logado
    }]);
    
    if (insertError) return alert("Erro ao salvar reunião.");
    
    // Limpar formulário após salvar
    document.getElementById("reuniaoCliente").value = "";
    document.getElementById("reuniaoData").value = "";
    document.getElementById("reuniaoHorario").value = "";
    document.getElementById("reuniaoTipo").value = "";
    document.getElementById("reuniaoResponsavel").value = "";
    document.getElementById("reuniaoParticipantes").value = "";
    document.getElementById("reuniaoFile").value = "";
    
    showAlert("Sucesso", "Reunião salva com sucesso!");
    carregarReunioes();
}

// Função para carregar reuniões com filtro por setor
async function carregarReunioes() {
    const userType = localStorage.getItem('user_type');
    const clientId = sessionStorage.getItem('client_id');
    const setorUsuario = sessionStorage.getItem("setor");
    
    let query = releaseClient.from("reunioes").select("*").order("data", { ascending: false });
    
    // Filtro por cliente (para usuários do tipo 'client')
    if (
        userType === 'client' &&
        clientId &&
        clientId !== 'null' &&
        clientId !== null &&
        clientId !== undefined &&
        clientId !== '' &&
        !isNaN(Number(clientId))
    ) {
        query = query.eq('client_id', Number(clientId));
    }
    
    // Filtro por setor (para usuários internos)
    // Aplica o filtro de setor apenas se o userType não for 'client' e o setorUsuario estiver definido
    if (setorUsuario && userType !== 'client') {
        query = query.eq("setor", setorUsuario);
    }
    
    const { data, error } = await query;
    if (error) return console.error("Erro ao carregar reuniões", error);

    const container = document.getElementById("listaReunioes");
    if (!container) return;
    
    container.innerHTML = "";

    // Verificar se há reuniões
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
                <h3>Nenhuma reunião encontrada</h3>
                <p>Não há reuniões cadastradas para ${setorUsuario ? `o setor "${setorUsuario}"` : 'este usuário'}.</p>
            </div>
        `;
        return;
    }

    const agrupado = {};
    data.forEach(r => {
        const cli = r.cliente ? r.cliente.toLowerCase() : (r.client_id ? String(r.client_id) : '');
        if (!agrupado[cli]) agrupado[cli] = [];
        agrupado[cli].push(r);
    });

    // Filtros ativos
    const filtroCliente = document.getElementById("filtroReuniaoCliente")?.value?.toLowerCase() || "";
    const filtroParticipante = document.getElementById("filtroReuniaoParticipante")?.value?.toLowerCase() || "";
    const filtroDataInicio = document.getElementById("filtroReuniaoDataInicio")?.value || "";
    const filtroDataFim = document.getElementById("filtroReuniaoDataFim")?.value || "";

    let totalReunioesFiltradas = 0;
    Object.keys(agrupado).forEach(cli => {
        const blocos = agrupado[cli];
        // Filtra as reuniões do cliente conforme os filtros ativos
        const blocosFiltrados = blocos.filter(r => {
            // Participante (busca exata, igual Excel)
            let matchParticipante = true;
            if (filtroParticipante) {
                // Divide os nomes da reunião e compara cada um
                const nomes = (r.participantes || "").split(/,|;| e |\n/gi).map(n => n.trim());
                matchParticipante = nomes.some(n => n.toLowerCase() === filtroParticipante.toLowerCase());
            }
            // Cliente
            let matchCliente = !filtroCliente || (r.cliente && r.cliente.toLowerCase().includes(filtroCliente));
            // Data
            let matchData = true;
            if (filtroDataInicio || filtroDataFim) {
                let dataISO = r.data;
                if (/\d{2}\/\d{2}\/\d{4}/.test(r.data)) {
                    const [d, m, y] = r.data.split("/");
                    dataISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
                if (filtroDataInicio && dataISO < filtroDataInicio) matchData = false;
                if (filtroDataFim && dataISO > filtroDataFim) matchData = false;
            }
            return matchCliente && matchParticipante && matchData;
        });
        
        totalReunioesFiltradas += blocosFiltrados.length;
        if (blocosFiltrados.length === 0) return; // Não mostra card se não houver reuniões filtradas
        
        const card = document.createElement("div");
        card.className = "document-card";
        card.setAttribute("data-cliente", cli);
        const responsavelPrimeiro = blocosFiltrados[0].responsavel ? blocosFiltrados[0].responsavel.toLowerCase() : "";
        card.setAttribute("data-responsavel", responsavelPrimeiro);
        card.innerHTML = `
            <div class="document-title">${blocosFiltrados[0].cliente}</div>
            <div class="document-author">Total de reuniões: ${blocosFiltrados.length}</div>
            ${setorUsuario && userType !== 'client' ? `<div class="document-sector" style="color: #666; font-size: 0.9em; margin-top: 5px;">Setor: ${blocosFiltrados[0].setor || 'Não informado'}</div>` : ''}
            <div style="margin-top: 10px;">
                ${blocosFiltrados.map(r => `
                    <div style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #336699;">
                        <p><strong>Data:</strong> ${r.data}</p>
                        ${r.horario ? `<p><strong>Horário:</strong> ${r.horario}</p>` : ''}
                        <p><strong>Tipo:</strong> ${r.tipo}</p>
                        ${r.responsavel ? `<p><strong>Responsável:</strong> ${r.responsavel}</p>` : ''}
                        <p><strong>Participantes:</strong> ${r.participantes}</p>
                        ${setorUsuario && userType !== 'client' ? `<p><strong>Setor:</strong> ${r.setor || 'Não informado'}</p>` : ''}
                        <div class="reuniao-actions">
                            ${r.file_url ? `<a class="btn-ver-ata" href="${r.file_url}" target="_blank">Ver Ata</a>` : "<em>Sem ata</em>"}
                            <button class="btn-editar-reuniao" onclick="abrirModalEditarReuniao('${r.id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-excluir-reuniao" onclick="excluirReuniao('${r.id}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
        container.appendChild(card);
    });

    // Exibe o total de reuniões filtradas no final da página
    let totalDiv = document.getElementById('totalReunioesFiltradas');
    if (!totalDiv) {
        totalDiv = document.createElement('div');
        totalDiv.id = 'totalReunioesFiltradas';
        totalDiv.style = 'margin: 30px 0 10px 0; font-weight: bold; font-size: 1.1em; text-align: right;';
        container.parentNode.appendChild(totalDiv);
    }
    
    const setorInfo = setorUsuario && userType !== 'client' ? ` (Setor: ${setorUsuario})` : '';
    totalDiv.textContent = `${totalReunioesFiltradas} ${totalReunioesFiltradas === 1 ? 'reunião' : 'reuniões'} no período selecionado${setorInfo}`;
}

// Função para abrir modal de edição de reunião
async function abrirModalEditarReuniao(reuniaoId) {
    try {
        // Buscar dados da reunião
        const { data, error } = await releaseClient
            .from('reunioes')
            .select('*')
            .eq('id', reuniaoId)
            .single();

        if (error) {
            console.error('Erro ao buscar reunião:', error);
            showAlert('Erro', 'Erro ao carregar dados da reunião.');
            return;
        }

        // Preencher formulário de edição
        document.getElementById('editReuniaoCliente').value = data.client_id || '';
        document.getElementById('editReuniaoData').value = data.data || '';
        document.getElementById('editReuniaoHorario').value = data.horario || '';
        document.getElementById('editReuniaoTipo').value = data.tipo || '';
        document.getElementById('editReuniaoResponsavel').value = data.responsavel || '';
        document.getElementById('editReuniaoParticipantes').value = data.participantes || '';

        // Armazenar ID da reunião no formulário
        document.getElementById('formEditarReuniao').dataset.reuniaoId = reuniaoId;

        // Mostrar modal
        document.getElementById('modalEditarReuniao').classList.add('visible');

    } catch (error) {
        console.error('Erro ao abrir modal de edição:', error);
        showAlert('Erro', 'Erro ao abrir formulário de edição.');
    }
}

// Função para fechar modal de edição de reunião
function fecharModalEditarReuniao() {
    document.getElementById('modalEditarReuniao').classList.remove('visible');
    document.getElementById('formEditarReuniao').reset();
    delete document.getElementById('formEditarReuniao').dataset.reuniaoId;
}

// Função para atualizar reunião (chamada pelo formulário de edição)
async function atualizarReuniao() {
    const reuniaoId = document.getElementById('formEditarReuniao').dataset.reuniaoId;
    if (!reuniaoId) {
        showAlert('Erro', 'ID da reunião não encontrado.');
        return;
    }

    if (!permissoes.includes('atualizarReuniao')) {
        showAlert('Atenção', 'Você não tem permissão para atualizar uma reunião.');
        return;
    }
    
    const clientId = document.getElementById("editReuniaoCliente").value;
    let cliente = "";
    if (window.clients && clientId) {
        const obj = window.clients.find(c => String(c.id) === String(clientId));
        if (obj) cliente = obj.name;
    }
    
    const data = document.getElementById("editReuniaoData").value;
    const horario = document.getElementById("editReuniaoHorario").value;
    const tipo = document.getElementById("editReuniaoTipo").value;
    const responsavel = document.getElementById("editReuniaoResponsavel").value;
    const participantes = document.getElementById("editReuniaoParticipantes").value;
    const file = document.getElementById("editReuniaoFile").files[0];
    
    // Obter o setor do usuário logado
    const setorUsuario = sessionStorage.getItem('setor') || 'Time de implantação';

    let updateData = {
        client_id: clientId ? Number(clientId) : null,
        cliente,
        data,
        horario,
        tipo,
        responsavel,
        participantes,
        setor: setorUsuario  // Manter o setor do usuário logado
    };

    // Se houver novo arquivo, fazer upload
    if (file) {
        const file_path = Date.now() + '_' + file.name.replace(/\s+/g, "_");
        const { error } = await releaseClient.storage.from("reuniaofiles").upload(file_path, file);
        if (error) {
            showAlert('Erro', 'Erro ao fazer upload da nova ata');
            return;
        }
        
        updateData.file_url = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/reuniaofiles/${file_path}`;
        updateData.file_path = file_path;
    }

    const { error: updateError } = await releaseClient
        .from("reunioes")
        .update(updateData)
        .eq('id', reuniaoId);
    
    if (updateError) {
        showAlert('Erro', 'Erro ao atualizar reunião.');
        return;
    }
    
    showAlert('Sucesso', 'Reunião atualizada com sucesso!');
    
    // Fechar modal e recarregar lista
    fecharModalEditarReuniao();
    carregarReunioes();
}

// Função para excluir reunião
async function excluirReuniao(reuniaoId) {
    if (!permissoes.includes('excluirReuniao')) {
        showAlert('Atenção', 'Você não tem permissão para excluir uma reunião.');
        return;
    }

    const confirmed = await showConfirm('Confirmação', 'Tem certeza que deseja excluir esta reunião?');
    if (!confirmed) return;

    try {
        // Buscar dados da reunião para deletar arquivo se existir
        const { data: reuniaoData } = await releaseClient
            .from('reunioes')
            .select('file_path')
            .eq('id', reuniaoId)
            .single();

        // Deletar arquivo se existir
        if (reuniaoData && reuniaoData.file_path) {
            await releaseClient.storage
                .from('reuniaofiles')
                .remove([reuniaoData.file_path]);
        }

        // Deletar reunião do banco
        const { error } = await releaseClient
            .from('reunioes')
            .delete()
            .eq('id', reuniaoId);

        if (error) {
            showAlert('Erro', 'Erro ao excluir reunião.');
            return;
        }

        showAlert('Sucesso', 'Reunião excluída com sucesso!');
        carregarReunioes();

    } catch (error) {
        console.error('Erro ao excluir reunião:', error);
        showAlert('Erro', 'Erro ao excluir reunião.');
    }
}

// Event listener para o formulário de edição de reunião
document.addEventListener('DOMContentLoaded', function() {
    const formEditarReuniao = document.getElementById('formEditarReuniao');
    if (formEditarReuniao) {
        formEditarReuniao.addEventListener('submit', function(e) {
            e.preventDefault();
            atualizarReuniao();
        });
    }
});

// ===== FIM DAS FUNÇÕES MODIFICADAS =====








// Função para popular dropdown de participantes no filtro
function populateFiltroParticipantes() {
  const select = document.getElementById('filtroReuniaoParticipante');
  if (!select) return;
  select.innerHTML = '<option value="">Todos os participantes</option>';
  // Coletar todos os nomes individuais de participantes das reuniões já carregadas
  const participantesSet = new Set();
  document.querySelectorAll("#listaReunioes .document-card p").forEach(p => {
    if (p.innerText.startsWith("Participantes:")) {
      const txt = p.innerText.replace("Participantes:", "").trim();
      // Suporta separadores: vírgula, ponto e vírgula, " e ", quebra de linha
      txt.split(/,|;| e |\n/gi).forEach(nome => {
        const nomeLimpo = nome.trim();
        if (nomeLimpo) participantesSet.add(nomeLimpo);
      });
    }
  });
  Array.from(participantesSet).sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(nome => {
    select.innerHTML += `<option value="${nome}">${nome}</option>`;
  });
}

// Função para popular dropdown de clientes no filtro
function populateFiltroClientes() {
  const select = document.getElementById('filtroReuniaoCliente');
  if (!select) return;
  select.innerHTML = '<option value="">Todos os clientes</option>';
  if (!window.clients || !Array.isArray(window.clients)) return;
  const sortedClients = [...window.clients].sort((a, b) => a.name.localeCompare(b.name));
  sortedClients.forEach(c => {
    select.innerHTML += `<option value="${c.name.toLowerCase()}">${c.name}</option>`;
  });
}

document.addEventListener("DOMContentLoaded", function() {
  if (typeof fetchAndRenderClients === 'function') {
    fetchAndRenderClients().then(() => {
      populateReuniaoClientes();
      populateFiltroClientes();
      populateReuniaoResponsaveis();
      carregarReunioes();
      setTimeout(populateFiltroParticipantes, 500); // Aguarda reuniões carregarem
    });
  } else {
    populateReuniaoResponsaveis();
    carregarReunioes();
    setTimeout(populateFiltroParticipantes, 500);
  }
});
function atualizarMetricasClientes() {
  if (!window.clients || !Array.isArray(window.clients)) return;

    const ativos = window.clients.filter(c => {
        if (c.client_statuses && c.client_statuses.name) {
            return c.client_statuses.name.toLowerCase().includes('ativo') && !c.client_statuses.name.toLowerCase().includes('inativo');
        }
        return c.status_id === 1 || c.status_id === 2; // IDs de Cliente Ativo
    }).length;
    const inativos = window.clients.filter(c => {
        if (c.client_statuses && c.client_statuses.name) {
            return c.client_statuses.name.toLowerCase().includes('inativo');
        }
        return c.status_id === 3; // ID de Cliente Inativo
    }).length;

const elAtivos = document.getElementById('activeClientsCount');
const elInativos = document.getElementById('inactiveClientsCount');
if (elAtivos) elAtivos.textContent = ativos;
if (elInativos) elInativos.textContent = inativos;
}

  document.addEventListener('DOMContentLoaded', function () {
    const nome = localStorage.getItem('username') || 'TRYVIA';
    document.getElementById('nomeUsuario').innerText = nome;
  });






// ===== FUNÇÕES DA ABA INÍCIO =====

let dashboardData = {
    totalClients: 0,
    totalHomologacoes: 0,
    totalReleases: 0,
    totalReunioes: 0,
    totalVisitas: 0,
    averageRating: 0.0,
    recentActivities: [],
    highlightClients: [],
    notifications: []
};

// Inicializar aba Início
async function initializeInicio() {
    updateDateTime();
    await loadDashboardMetrics();
    await loadRecentActivities();
    await loadHighlightClients();
    loadNotifications();
    createCharts();
    
    
    setInterval(async () => {
        await loadDashboardMetrics();
        await loadRecentActivities();
        updateDateTime();
    }, 300000);
}

// Atualizar data e hora
function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    document.getElementById('currentDate').textContent = dateStr;
    document.getElementById('lastUpdate').textContent = timeStr;
}

// Carregar métricas 
async function loadDashboardMetrics() {
    try {
        // Carregar contadores de cada tabela
        const [clientsResult, homologacoesResult, releasesResult, reunioesResult, evaluationsResult] = await Promise.all([
            releaseClient.from('clients').select('id', { count: 'exact', head: true }),
            releaseClient.from('homologacoes').select('id', { count: 'exact', head: true }),
            releaseClient.from('releases').select('id', { count: 'exact', head: true }),
            releaseClient.from('reunioes').select('id', { count: 'exact', head: true }),
            releaseClient.from('visit_evaluations').select('rating')
        ]);

        dashboardData.totalClients = clientsResult.count || 0;
        dashboardData.totalHomologacoes = homologacoesResult.count || 0;
        dashboardData.totalReleases = releasesResult.count || 0;
        dashboardData.totalReunioes = reunioesResult.count || 0;

        // Carregar total de visitas da API do Supabase de visitas
        await loadTotalVisitas();

        // Calcular avaliação média
        if (evaluationsResult.data && evaluationsResult.data.length > 0) {
            const totalRating = evaluationsResult.data.reduce((sum, evaluation) => sum + evaluation.rating, 0);
            dashboardData.averageRating = (totalRating / evaluationsResult.data.length).toFixed(1);
        } else {
            dashboardData.averageRating = '0.0';
        }

        // Atualizar UI
    const elHomologacoes = document.getElementById('totalHomologacoes');
    const elReleases = document.getElementById('totalReleases');
    const elReunioes = document.getElementById('totalReunioes');
    const elVisitas = document.getElementById('totalVisitas');
    const elRating = document.getElementById('averageRatingHome');
    if (elHomologacoes) elHomologacoes.textContent = dashboardData.totalHomologacoes;
    if (elReleases) elReleases.textContent = dashboardData.totalReleases;
    if (elReunioes) elReunioes.textContent = dashboardData.totalReunioes;
    if (elVisitas) elVisitas.textContent = dashboardData.totalVisitas;
    if (elRating) elRating.textContent = dashboardData.averageRating;

        // Adicionar animação aos cards
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 8px 25px rgba(41, 182, 246, 0.4)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 15px rgba(41, 182, 246, 0.3)';
            });
        });

    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        
        document.getElementById('totalClients').textContent = '0';
        document.getElementById('totalHomologacoes').textContent = '0';
        document.getElementById('totalReleases').textContent = '0';
        document.getElementById('totalReunioes').textContent = '0';
        document.getElementById('totalVisitas').textContent = '0';
        document.getElementById('averageRatingHome').textContent = '0.0';
    }
}

// Função para carregar total de visitas da API do Supabase de visitas
async function loadTotalVisitas() {
    try {
        // Usar o cliente Supabase de visitas já configurado
        if (!visitasClient) {
            console.error('Cliente Supabase de visitas não está disponível');
            dashboardData.totalVisitas = 0;
            return;
        }

        const { data, error, count } = await visitasClient
            .from('mapa_viagens')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error('Erro ao buscar total de visitas:', error);
            dashboardData.totalVisitas = 0;
        } else {
            dashboardData.totalVisitas = count || 0;
        }
    } catch (error) {
        console.error('Erro na função loadTotalVisitas:', error);
        dashboardData.totalVisitas = 0;
    }
}

// Carregar atividades recentes
async function loadRecentActivities() {
    try {
        const activitiesList = document.getElementById('activitiesList');
        activitiesList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';

        
        const [clientsData, homologacoesData, releasesData, reunioesData] = await Promise.all([
            releaseClient.from('clients').select('id, name, created_at').order('created_at', { ascending: false }).limit(3),
            releaseClient.from('homologacoes').select('id, especialista, versao, data_liberacao').order('data_liberacao', { ascending: false }).limit(3),
            releaseClient.from('releases').select('id, sistema, versao, data_liberacao').order('data_liberacao', { ascending: false }).limit(3),
            releaseClient.from('reunioes').select('id, cliente, data, tipo').order('data', { ascending: false }).limit(3)
        ]);

        let activities = [];

        // Processar clientes
        if (clientsData.data) {
            clientsData.data.forEach(client => {
                activities.push({
                    type: 'cliente',
                    icon: '👥',
                    color: '#4fc3f7',
                    title: 'Novo Cliente',
                    description: client.name,
                    date: client.created_at, // string ISO
                    action: () => showTab('clients')
                });
            });
        }

        // Processar homologações
        if (homologacoesData.data) {
            homologacoesData.data.forEach(homol => {
                activities.push({
                    type: 'homologacao',
                    icon: '✅',
                    color: '#66bb6a',
                    title: 'Homologação',
                    description: `${homol.versao} - ${homol.especialista}`,
                    date: homol.data_liberacao, // string ISO
                    action: () => showTab('homologacao')
                });
            });
        }

        // Processar releases
        if (releasesData.data) {
            releasesData.data.forEach(release => {
                activities.push({
                    type: 'release',
                    icon: '🚀',
                    color: '#ff7043',
                    title: 'Release',
                    description: `${release.sistema} ${release.versao}`,
                    date: release.data_liberacao, // string ISO
                    action: () => showTab('release')
                });
            });
        }

        // Processar reuniões
        if (reunioesData.data) {
            reunioesData.data.forEach(reuniao => {
                let dataReuniao = reuniao.data;
                let horarioReuniao = reuniao.horario || '';
                let dataHora;
                if (horarioReuniao) {
                    // Junta data e horário se ambos existirem
                    let dataStr = dataReuniao;
                    let horaStr = horarioReuniao;
                    // Se data estiver no formato ISO, junta corretamente
                    if (/^\d{4}-\d{2}-\d{2}/.test(dataStr) && /^\d{2}:\d{2}/.test(horaStr)) {
                        dataHora = dataStr + 'T' + horaStr;
                    } else {
                        // fallback: só data
                        dataHora = dataStr;
                    }
                } else {
                    dataHora = dataReuniao;
                }
                activities.push({
                    type: 'reuniao',
                    icon: '📅',
                    color: '#ab47bc',
                    title: 'Reunião',
                    description: `${reuniao.tipo} - ${reuniao.cliente}`,
                    date: dataHora, // string ISO
                    action: () => showTab('reunioes')
                });
            });
        }

        // Ordenar por data/hora decrescente (mais recente primeiro)
        activities.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        activities = activities.slice(0, 10);

        // Renderizar atividades
        if (activities.length === 0) {
            activitiesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 2em; margin-bottom: 15px;"></i>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
        } else {
            activitiesList.innerHTML = activities.map(activity => {
                let dataFormatada = 'Não informada';
                let hora = '';
                if (activity.date) {
                    try {
                        dataFormatada = formatDateOnlyBR(activity.date);
                        if (activity.date.length > 10 && activity.date.includes('T')) {
                            const d = new Date(activity.date);
                            if (!isNaN(d.getTime())) {
                                hora = ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            }
                        }
                    } catch (e) {
                        dataFormatada = 'Não informada';
                    }
                }
                return `
                <div class="activity-item" style="background: rgba(179, 229, 252, 0.95); border-left: 4px solid ${activity.color}; padding: 16px; margin-bottom: 12px; border-radius: 8px; cursor: pointer; transition: background-color 0.3s ease;" onclick="(${activity.action.toString()})()">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-size: 1.5em;">${activity.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #000; margin-bottom: 4px;">${activity.title}</div>
                            <div style="color: #333; margin-bottom: 4px;">${activity.description}</div>
                            <div style="font-size: 0.85em; color: #666;">${dataFormatada}${hora}</div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        document.getElementById('activitiesList').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f44336;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 15px;"></i>
                <p>Erro ao carregar atividades</p>
            </div>
        `;
    }
}

// Carregar clientes em destaque
async function loadHighlightClients() {
    try {
        const carousel = document.getElementById('clientsCarousel');
        carousel.innerHTML = '<div style="text-align: center; padding: 20px; min-width: 100%;"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';

       const { data: clients, error } = await releaseClient
  .from('clients')
  .select(`
      id, 
      name, 
      bi_link,
      client_logos:client_logos!clients_logo_path_fkey (url)
  `)
            .not('bi_link', 'is', null)
            .not('bi_link', 'eq', '')
            .limit(5);

        if (error) throw error;

        if (clients.length === 0) {
            carousel.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; min-width: 100%;">
                    <i class="fas fa-users" style="font-size: 2em; margin-bottom: 15px;"></i>
                    <p>Nenhum cliente com BI configurado</p>
                </div>
            `;
        } else {
            carousel.innerHTML = clients.map(client => `
                <div class="client-highlight-card" style="min-width: 200px; background: #ffffff; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transition: transform 0.3s ease; cursor: pointer;" onclick="window.open('${client.bi_link}', '_blank')">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; border-radius: 50%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        ${client.client_logos?.url ?
                            `<img src="${client.client_logos.url}" alt="${client.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                            `<span style="font-size: 2em; color: #29b6f6;">${client.name.charAt(0).toUpperCase()}</span>`
                        }
                    </div>
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 1.1em;">${client.name}</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9em;">Dashboard BI</p>
                    <div style="margin-top: 15px;">
                        <span style="background: #4fc3f7; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.8em;">Ativo</span>
                    </div>
                </div>
            `).join('');

            
            document.querySelectorAll('.client-highlight-card').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'scale(1.05)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'scale(1)';
                });
            });
        }

    } catch (error) {
        console.error('Erro ao carregar clientes em destaque:', error);
        document.getElementById('clientsCarousel').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f44336; min-width: 100%;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 15px;"></i>
                <p>Erro ao carregar clientes</p>
            </div>
        `;
    }
}

// Carregar notificações
function loadNotifications() {
    
   
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
            <i class="fas fa-check-circle" style="font-size: 2em; margin-bottom: 10px; color: #4caf50;"></i>
            <p>Ultima atualização 20/08/2025!</p>
            <p style="font-size: 0.9em; margin-top: 10px;">As melhorias solicitadas nos tickets #4883, #4882 e #4881 foram aplicadas e já estão disponíveis em produção.</p>
        </div>
    `;
}

// Criar gráficos
async function createCharts() {
    try {
        // Gráfico de Homologações por Mês
        await createHomologacoesChart();
        
        // Gráfico de Releases por Tipo
        await createReleasesChart();
        
    } catch (error) {
        console.error('Erro ao criar gráficos:', error);
    }
}

// Gráfico de Homologações por Mês
async function createHomologacoesChart() {
    try {
        const { data, error } = await releaseClient
            .from('homologacoes')
            .select('data_liberacao');

        if (error) throw error;

        // Processar dados por mês
        const monthCounts = {};
        const currentYear = new Date().getFullYear();
        
        // Inicializar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[key] = 0;
        }

        // Contar homologações por mês
        data.forEach(item => {
            const date = new Date(item.data_liberacao);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthCounts.hasOwnProperty(key)) {
                monthCounts[key]++;
            }
        });

        const labels = Object.keys(monthCounts).map(key => {
            const [year, month] = key.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        });

        const values = Object.values(monthCounts);

        const ctx = document.getElementById('homologacoesChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Homologações',
                    data: values,
                    backgroundColor: 'rgba(41, 182, 246, 0.8)',
                    borderColor: 'rgba(41, 182, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Erro ao criar gráfico de homologações:', error);
    }
}

// Gráfico de Releases por Tipo
async function createReleasesChart() {
    try {
        const { data, error } = await releaseClient
            .from('releases')
            .select('tipo');

        if (error) throw error;

        // Contar por tipo
        const typeCounts = {};
        data.forEach(item => {
            const tipo = item.tipo || 'Não especificado';
            typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
        });

        const labels = Object.keys(typeCounts);
        const values = Object.values(typeCounts);
        const colors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)'
        ];

        const ctx = document.getElementById('releasesChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

    } catch (error) {
        console.error('Erro ao criar gráfico de releases:', error);
    }
}

// Função para refresh manual das atividades
async function refreshActivities() {
    const button = event.target;
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    await loadRecentActivities();
    updateDateTime();
    
    setTimeout(() => {
        button.innerHTML = originalIcon;
        button.disabled = false;
    }, 1000);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  
    setTimeout(() => {
        showTab('inicio');
    }, 500);
});
async function viewClientTickets(clientId, clientName, clientEmail) {
    const modal = document.getElementById('ticketsModal');
    const title = document.getElementById('ticketsModalTitle');
    const content = document.getElementById('ticketsModalContent');
    
    title.textContent = `Tickets - ${clientName}`;
    content.innerHTML = `
        <div class="loading-tickets">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando tickets...</p>
        </div>
    `;
    
    modal.style.display = 'block';
    
    try {
        // Buscar tickets do cliente via API
        const response = await fetch(`https://servis-tikctes.onrender.com/api/tickets/client-by-empresa?cf_empresa=${encodeURIComponent(clientName)}`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const tickets = await response.json();
        
        if (!tickets || tickets.length === 0) {
            content.innerHTML = `
                <div class="no-tickets">
                    <i class="fas fa-inbox" style="font-size: 3em; margin-bottom: 20px; color: #ccc;"></i>
                    <h3>Nenhum ticket encontrado</h3>
                    <p>Este cliente não possui tickets registrados no Freshdesk.</p>
                </div>
            `;
            return;
        }
        
        // Renderizar tickets
        content.innerHTML = tickets.map(ticket => {
            const statusClass = getTicketStatusClass(ticket.status);
            const statusText = getTicketStatusText(ticket.status);
            const createdDate = formatDateTimeForDisplay(ticket.created_at);
            const updatedDate = formatDateTimeForDisplay(ticket.updated_at);
            
            return `
                <div class="ticket-item">
                    <div class="ticket-header">
                        <span class="ticket-id"><a href="https://suportetryvia.freshdesk.com/a/tickets/${ticket.id}" target="_blank">#${ticket.id}</a></span>
                        <span class="ticket-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="ticket-subject">${ticket.subject || 'Sem assunto'}</div>
                    <div class="ticket-description">${ticket.description_text ? ticket.description_text.substring(0, 200) + '...' : 'Sem descrição'}</div>
                    <div class="ticket-meta">
                        <strong>Criado:</strong> ${createdDate} | 
                        <strong>Atualizado:</strong> ${updatedDate} | 
                        <strong>Prioridade:</strong> ${getTicketPriorityText(ticket.priority)}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        content.innerHTML = `
            <div class="no-tickets">
                <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 20px; color: #f44336;"></i>
                <h3>Erro ao carregar tickets</h3>
                <p>Não foi possível conectar com o serviço de tickets. Verifique se a API está rodando.</p>
                <p style="font-size: 0.9em; color: #666;">Erro: ${error.message}</p>
            </div>
        `;
    }
}

// Função para fechar modal de tickets
function closeTicketsModal() {
    document.getElementById('ticketsModal').style.display = 'none';
}

// Função para fechar modal de integrações
function closeIntegracoesModal() {
    document.getElementById('integracoesModal').style.display = 'none';
}

// Função para visualizar integrações ativas do cliente
async function viewClientIntegracoes(clientId, clientName, cnpj) {
    // Buscar cliente no Supabase para obter o id_cliente
    try {
        const { data: clientData, error: clientError } = await releaseClient
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (clientError || !clientData) {
            showAlert("Erro", "Cliente não encontrado no Supabase");
            return;
        }
        
        if (!clientData.id_cliente) {
            showAlert("Atenção", "Cliente não possui ID Cliente cadastrado. Configure este campo para visualizar as integrações.");
            return;
        }
        
        showIntegracoesModal(clientName, clientId, clientData.id_cliente);
    } catch (error) {
        showAlert("Erro", "Erro ao buscar dados do cliente: " + error.message);
    }
}

// Função para mostrar modal de integrações do cliente
async function showIntegracoesModal(clientName, clientId, idCliente) {
    const modal = document.getElementById("integracoesModal");
    const title = document.getElementById("integracoesModalTitle");
    const content = document.getElementById("integracoesModalContent");
    
    title.textContent = `Integrações - ${clientName}`;
    content.innerHTML = `
        <div class="loading-tickets">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando integrações...</p>
        </div>
    `;
    
    modal.style.display = "block";
    
    try {
        // Buscar cliente no Supabase para obter dados completos
        const { data: clientData, error: clientError } = await releaseClient
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (clientError || !clientData) {
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro: Cliente não encontrado no Supabase</p>
                </div>
            `;
            return;
        }
        
        // Chamar a API de integrações usando id_cliente
        const integracoesData = await consultarIntegracoesPorIdCliente(idCliente);
        
        if (integracoesData.erro) {
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro: ${integracoesData.erro}</p>
                </div>
            `;
            return;
        }
        
        if (!integracoesData.integracoes || integracoesData.integracoes.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plug" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <p>Nenhuma integração ativa encontrada para este cliente.</p>
                </div>
            `;
            return;
        }
        
        // Renderizar as integrações com status baseado no campo 'erro' (API retorna 'erro', não 'error')
        const integracoesHtml = integracoesData.integracoes.map(integracao => {
            const status = integracao.erro === false ? 'Inativo' : 'Ativo';
            const statusIcon = status === 'Ativo' ? '✅' : '❌';
            const statusClass = status === 'Ativo' ? 'ativo' : 'erro';
            return `
                <div class="integracao-item ${statusClass}">
                    <div class="integracao-header">
                        <div class="integracao-sistema">
                            ${statusIcon} <strong>${integracao.sistema || 'Sistema não informado'}</strong>
                        </div>
                        <div class="integracao-status ${statusClass}">
                            ${status}
                        </div>
                    </div>
                    <div class="integracao-details">
                        <p><strong>Entidade:</strong> ${integracao.entidade || 'Não informado'}</p>
                        <p><strong>Última Integração:</strong> ${integracao.dataUltimaIntegracao ? new Date(integracao.dataUltimaIntegracao).toLocaleString('pt-BR') : 'Não informado'}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div class="integracoes-info">
                <p><strong>Cliente:</strong> ${integracoesData.cliente?.nome || clientName}</p>
                <p><strong>ID Cliente:</strong> ${integracoesData.cliente?.id_cliente || idCliente}</p>
                <p><strong>cnpj:</strong> ${integracoesData.cliente?.cnpj || clientData.cnpj || 'Não informado'}</p>
                <p><strong>Total de Integrações:</strong> ${integracoesData.total_integracoes || 0}</p>
                ${integracoesData.observacao ? `<p><em>${integracoesData.observacao}</em></p>` : ''}
            </div>
            <div class="integracoes-list">
                ${integracoesHtml}
            </div>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar integrações:', error);
        content.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar integrações. Verifique a conectividade.</p>
                <p style="font-size: 0.9em; color: #666;">Detalhes: ${error.message}</p>
            </div>
        `;
    }
}

// Função para consultar integrações por CNPJ
async function consultarIntegracoesPorcnpj(cnpj) {
    try {
        // Chamar a API Flask para obter as integrações
        const response = await fetch(`http://127.0.0.1:5000/api/integracoes/consultar-por-cnpj`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cnpj: cnpj })
        });
        
        if (!response.ok) {
            throw new Error(`Erro na resposta da API Flask: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            return {
                cnpj: cnpj,
                empresa_encontrada: false,
                erro: result.error
            };
        }
        
        return result.data;
        
    } catch (error) {
        console.error('Erro na consulta de integrações:', error);
        return {
            cnpj: cnpj,
            empresa_encontrada: false,
            erro: `Erro interno: ${error.message}`
        };
    }
}

// Função para consultar integrações por ID Cliente
async function consultarIntegracoesPorIdCliente(idCliente) {
    try {
        // Tenta buscar dados reais da API Flask
        const response = await fetch(`https://6c1b22afd688.ngrok-free.app/api/integracoes/${idCliente}`, {
    headers: {
        'ngrok-skip-browser-warning': 'true'
    }
});
        if (!response.ok) {
            throw new Error(`Erro na API Flask: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        if (result.erro) {
            return { erro: result.erro };
        }
        return result;
    } catch (error) {
        // Se falhar, retorna dados de demonstração
        console.error('Erro na consulta de integrações por ID Cliente:', error);
        const integracoesDemo = [
            {
                sistema: "Sistema Demo 1",
                entidade: "Entidade Demo 1",
                dataUltimaIntegracao: new Date().toISOString(),
                status: "Ativo"
            },
            {
                sistema: "Sistema Demo 2",
                entidade: "Entidade Demo 2",
                dataUltimaIntegracao: new Date(Date.now() - 86400000).toISOString(),
                status: "Ativo"
            }
        ];
        return {
            sucesso: false,
            cliente: null,
            integracoes: integracoesDemo,
            total_integracoes: integracoesDemo.length,
            observacao: "Dados de demonstração - API externa não disponível no momento"
        };
    }
}

// Função para obter classe CSS do status do ticket
function getTicketStatusClass(status) {
    const statusMap = {
        2: 'open',                  // Open
        3: 'pending',
        4: 'resolved',
        5: 'closed',
        6: 'in-homologation',
        7: 'awaiting-client',
        8: 'in-treatment',
        10: 'in-analysis',
        11: 'internal',
        12: 'awaiting-publish-hml',
        13: 'awaiting-publish-prod',
        14: 'mvp',
        15: 'validation-attendance',
        16: 'awaiting-partners',
        17: 'paused',
        18: 'validation-cs'
    };
    return statusMap[status] || 'unknown';
}

// Função para obter texto do status do ticket
function getTicketStatusText(status) {
    const statusMap = {
        2: 'Aberto',
        3: 'Pendente',
        4: 'Resolvido',
        5: 'Fechado',
        6: 'Em Homologação',
        7: 'Aguardando Cliente',
        8: 'Em tratativa',
        10: 'Em análise',
        11: 'Interno',
        12: 'Aguardando publicar HML',
        13: 'Aguardando publicar em PROD',
        14: 'MVP',
        15: 'Validação-Atendimento',
        16: 'Aguardando Parceiros',
        17: 'Pausado',
        18: 'Validação-CS'
    };
    return statusMap[status] || 'Desconhecido';
}

// Função para obter texto da prioridade do ticket
function getTicketPriorityText(priority) {
    const priorityMap = {
        1: 'Baixa',
        2: 'Média',
        3: 'Alta',
        4: 'Urgente'
    };
    return priorityMap[priority] || 'Não definida';
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('ticketsModal');
    if (event.target === modal) {
        closeTicketsModal();
    }
}

            // Função para visualizar tickets do cliente
            function viewClientTickets(clientId, clientName, cfEmpresa) {
                if (!cfEmpresa) {
                    showAlert("Atenção", "Cliente não possui campo cf_empresa configurado. Configure este campo para visualizar os tickets.");
                    return;
                }
                showTicketsModal(clientName, cfEmpresa);
            }

            // Função para mostrar modal de tickets do cliente
            async function showTicketsModal(clientName, cfEmpresa) {
                const modal = document.getElementById("ticketsModal");
                const title = document.getElementById("ticketsModalTitle");
                const content = document.getElementById("ticketsModalContent");
                
                title.textContent = `Tickets - ${clientName}`;
                content.innerHTML = `
                    <div class="loading-tickets">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2em; margin-bottom: 20px; color: #4fc3f7;"></i>
                        <p>Carregando tickets...</p>
                    </div>
                `;
                
                modal.style.display = "block";
                
                try {
                    // Buscar tickets do cliente via API usando cf_empresa
                    const response = await fetch(`https://servis-tikctes.onrender.com/api/tickets/client-by-empresa?cf_empresa=${encodeURIComponent(cfEmpresa)}`);
                    
                    if (!response.ok) {
                        throw new Error(`Erro na API: ${response.status}`);
                    }
                    const tickets = await response.json();
                    
                    if (!tickets || tickets.length === 0) {
                        content.innerHTML = `
                            <div class="no-tickets">
                                <i class="fas fa-info-circle" style="font-size: 3em; margin-bottom: 20px; color: #2196f3;"></i>
                                <h3>Nenhum ticket encontrado</h3>
                                <p>Não há tickets registrados para este cliente.</p>
                            </div>
                        `;
                        return;
                    }
                    
                    content.innerHTML = tickets.map(ticket => {
                        const createdDate = formatDateTimeForDisplay(ticket.created_at);
                        const updatedDate = formatDateTimeForDisplay(ticket.updated_at);
                        const statusClass = getTicketStatusClass(ticket.status);
                        const statusText = getTicketStatusText(ticket.status);
                        
                        return `
                            <div class="ticket-item">
                                <div class="ticket-header">
                                    <span class="ticket-id"><a href="https://suportetryvia.freshdesk.com/a/tickets/${ticket.id}" target="_blank">#${ticket.id}</a></span>
                                    <span class="ticket-status ${statusClass}">${statusText}</span>
                                </div>
                                <div class="ticket-subject">${ticket.subject || "Sem assunto"}</div>
                                <div class="ticket-description">${ticket.description_text ? ticket.description_text.substring(0, 200) + "..." : "Sem descrição"}</div>
                                <div class="ticket-meta">
                                    <strong>Criado:</strong> ${createdDate} | 
                                    <strong>Atualizado:</strong> ${updatedDate} | 
                                    <strong>Prioridade:</strong> ${getTicketPriorityText(ticket.priority)}
                                </div>
                            </div>
                        `;
                    }).join("");
                    
                } catch (error) {
                    console.error("Erro ao buscar tickets:", error);
                    content.innerHTML = `
                        <div class="no-tickets">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 20px; color: #f44336;"></i>
                            <h3>Erro ao carregar tickets</h3>
                            <p>Não foi possível conectar com o serviço de tickets. Verifique se a API está rodando.</p>
                            <p style="font-size: 0.9em; color: #666;">Erro: ${error.message}</p>
                        </div>
                    `;
                }
            }

            // Função para fechar modal de tickets
            function closeTicketsModal() {
                document.getElementById("ticketsModal").style.display = "none";
            }

            // Função para obter classe CSS do status do ticket
            function getTicketStatusClass(status) {
                const statusMap = {
                    2: "open",      // Open
                    3: "pending",   // Pending
                    4: "resolved",  // Resolved
                    5: "closed"     // Closed
                };
                return statusMap[status] || "open";
            }

            // Função para obter texto do status do ticket
            function getTicketStatusText(status) {
                const statusMap = {
                    2: "Aberto",
                    3: "Pendente",
                    4: "Resolvido",
                    5: "Fechado"
                };
                return statusMap[status] || "Desconhecido";
            }

            // Função para obter texto da prioridade do ticket
            function getTicketPriorityText(priority) {
                const priorityMap = {
                    1: "Baixa",
                    2: "Média",
                    3: "Alta",
                    4: "Urgente"
                };
                return priorityMap[priority] || "Não definida";
            }

            // Fechar modal ao clicar fora dele
            window.onclick = function(event) {
                const modal = document.getElementById("ticketsModal");
                if (event.target === modal) {
                    closeTicketsModal();
                }
            }
        
            // Função para visualizar tickets do cliente
            function viewClientTickets(clientId, clientName, cfEmpresa) {
                if (!cfEmpresa) {
                    showAlert("Atenção", "Cliente não possui campo cf_empresa configurado. Configure este campo para visualizar os tickets.");
                    return;
                }
                showTicketsModal(clientName, cfEmpresa);
            }

            // Função para mostrar modal de tickets do cliente
            async function showTicketsModal(clientName, cfEmpresa) {
                const modal = document.getElementById("ticketsModal");
                const title = document.getElementById("ticketsModalTitle");
                const content = document.getElementById("ticketsModalContent");
                
                title.textContent = `Tickets - ${clientName}`;
                content.innerHTML = `
                    <div class="loading-tickets">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2em; margin-bottom: 20px; color: #4fc3f7;"></i>
                        <p>Carregando tickets...</p>
                    </div>
                `;
                
                modal.style.display = "block";
                
                try {
                    // Buscar tickets do cliente via API usando cf_empresa
                    const response = await fetch(`https://servis-tikctes.onrender.com/api/tickets/client-by-empresa?cf_empresa=${encodeURIComponent(cfEmpresa)}`);
                    
                    if (!response.ok) {
                        throw new Error(`Erro na API: ${response.status}`);
                    }
                    const tickets = await response.json();
                    
                    if (!tickets || tickets.length === 0) {
                        content.innerHTML = `
                            <div class="no-tickets">
                                <i class="fas fa-info-circle" style="font-size: 3em; margin-bottom: 20px; color: #2196f3;"></i>
                                <h3>Nenhum ticket encontrado</h3>
                                <p>Não há tickets registrados para este cliente.</p>
                            </div>
                        `;
                        return;
                    }
                    
                    content.innerHTML = tickets.map(ticket => {
                        const createdDate = formatDateTimeForDisplay(ticket.created_at);
                        const updatedDate = formatDateTimeForDisplay(ticket.updated_at);
                        const statusClass = getTicketStatusClass(ticket.status);
                        const statusText = getTicketStatusText(ticket.status);
                        
                        return `
                            <div class="ticket-item">
                                <div class="ticket-header">
                                    <span class="ticket-id"><a href="https://suportetryvia.freshdesk.com/a/tickets/${ticket.id}" target="_blank">#${ticket.id}</a></span>
                                    <span class="ticket-status ${statusClass}">${statusText}</span>
                                </div>
                                <div class="ticket-subject">${ticket.subject || "Sem assunto"}</div>
                                <div class="ticket-description">${ticket.description_text ? ticket.description_text.substring(0, 200) + "..." : "Sem descrição"}</div>
                                <div class="ticket-meta">
                                    <strong>Criado:</strong> ${createdDate} | 
                                    <strong>Atualizado:</strong> ${updatedDate} | 
                                    <strong>Prioridade:</strong> ${getTicketPriorityText(ticket.priority)}
                                </div>
                            </div>
                        `;
                    }).join("");
                    
                } catch (error) {
                    console.error("Erro ao buscar tickets:", error);
                    content.innerHTML = `
                        <div class="no-tickets">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 20px; color: #f44336;"></i>
                            <h3>Erro ao carregar tickets</h3>
                            <p>Não foi possível conectar com o serviço de tickets. Verifique se a API está rodando.</p>
                            <p style="font-size: 0.9em; color: #666;">Erro: ${error.message}</p>
                        </div>
                    `;
                }
            }

            // Função para fechar modal de tickets
            function closeTicketsModal() {
                document.getElementById("ticketsModal").style.display = "none";
            }

            // Função para obter classe CSS do status do ticket
            function getTicketStatusClass(status) {
               const statusMap = {
        2: "open",      // Open
        3: "pending",   // Pending
        4: "resolved",  // Resolved
        5: "closed",    // Closed
        7: "aguardando-cliente",
        8: "em-tratativa",
        10: "em-analise",
        11: "interno",
        6: "em-homologacao",
        12: "aguardando-hml",
        13: "aguardando-prod",
        14: "mvp",
        15: "validacao-atendimento",
        16: "aguardando-parceiros",
        17: "pausado",
        18: "validacao-cs"
                };
                return statusMap[status] || "open";
            }

            // Função para obter texto do status do ticket
            function getTicketStatusText(status) {
                const statusMap = {
        2: "Aberto",
        3: "Pendente",
        4: "Atribuído",
        5: "Fechado",
        7: "Aguardando Cliente",
        8: "Em tratativa",
        10: "Em análise",
        11: "Interno",
        6: "Em Homologação",
        12: "Aguardando publicar HML",
        13: "Aguardando publicar em PROD",
        14: "MVP",
        15: "Validação-Atendimento",
        16: "Aguardando Parceiros",
        17: "Pausado",
        18: "Validação-CS"
                };
                return statusMap[status] || "Desconhecido";
            }

            // Função para obter texto da prioridade do ticket
            function getTicketPriorityText(priority) {
                const priorityMap = {
                    1: "Baixa",
                    2: "Média",
                    3: "Alta",
                    4: "Urgente"
                };
                return priorityMap[priority] || "Não definida";
            }

            // Fechar modal ao clicar fora dele
            window.onclick = function(event) {
                const modal = document.getElementById("ticketsModal");
                if (event.target === modal) {
                    closeTicketsModal();
                }
            }

    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const chatSendButton = document.getElementById("chat-send-button");
    const chatContainer = document.getElementById("chat-container");
    const chatToggleButton = document.getElementById("chat-toggle-button");
    const chatCloseButton = document.getElementById("chat-close-button");

    // Função para mostrar o chat
    function showChat() {
        chatContainer.style.display = "flex";
        chatToggleButton.style.display = "none";
    }

    // Função para esconder o chat
    function hideChat() {
        chatContainer.style.display = "none";
        chatToggleButton.style.display = "flex";
    }

    
    chatToggleButton.addEventListener("click", showChat);
    chatCloseButton.addEventListener("click", hideChat);

    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (message) {
            appendMessage("Você", message);
            chatInput.value = "";

            try {
                const response = await fetch("https://5000-i15r3x8k3k10fog7u69rk-619fe7be.manusvm.computer/api/supabase/query", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ query: message })
                });
                const data = await response.json();
                appendMessage("Assistente", data.response || `O número é: ${data.count}`);
            } catch (error) {
                console.error("Erro ao comunicar com o backend:", error);
                appendMessage("Assistente", "Desculpe, não consegui processar sua solicitação no momento.");
            }
         }
    });
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            chatSendButton.click();
        }
    });
    
    let chatInitialized = false;
    chatToggleButton.addEventListener("click", () => {
        if (!chatInitialized) {
            appendMessage("Assistente", "Olá! Como posso ajudar hoje?");
            chatInitialized = true;
        }
    });

    
let painelData = {
    tarefas: [],
    time: [],
    projetos: [],
    visitas: [],
    entregas: []
};

// Funções para mostrar modais
function showAddTaskModal() {
    if (!permissoes.includes('abrirModalTarefa')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar tarefas.');
        return;
    }
    document.getElementById('addTaskModal').classList.add('visible');
}

function showAddTeamMemberModal() {
    if (!permissoes.includes('abrirModalMembro')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar membros à equipe.');
        return;
    }
    document.getElementById('addTeamMemberModal').classList.add('visible');
}

function showAddProjectModal() {
    if (!permissoes.includes('abrirModalProjeto')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar projetos.');
        return;
    }
    document.getElementById('addProjectModal').classList.add('visible');
}

function showAddVisitModal() {
    if (!permissoes.includes('abrirModalVisita')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar visitas.');
        return;
    }
    document.getElementById('addVisitModal').classList.add('visible');
}

function showAddEntregaModal() {
    if (!permissoes.includes('abrirModalEntrega')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar entregas.');
        return;
    }
    
    // Gerar campos dinamicamente baseados nos membros da equipe
    const container = document.getElementById('entregaFieldsContainer');
    if (container && teamMembers && teamMembers.length > 0) {
        container.innerHTML = '';
        teamMembers.forEach(member => {
            const firstName = member.nome.split(' ')[0]; // Pega apenas o primeiro nome
            const fieldId = `entrega${firstName}`;
            container.innerHTML += `
                <div class="form-group">
                    <label for="${fieldId}">${firstName} (%)</label>
                    <input type="number" id="${fieldId}" min="0" max="100" placeholder="0-100">
                </div>
            `;
        });
    } else {
        // Se não há membros carregados, mostrar campos padrão ou mensagem
        if (container) {
            container.innerHTML = '<p style="color: #888;">Carregue os membros da equipe primeiro.</p>';
        }
    }
    
    document.getElementById('addEntregaModal').classList.add('visible');
}
// Função para fechar modais
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('visible');
}

// Funções para salvar dados
async function saveTask() {
    if (!permissoes.includes('saveTask')) {
        showAlert('Atenção', 'Você não tem permissão para salvar uma tarefa.');
        return;
    }
    const setorUsuario = sessionStorage.getItem("setor");
    const taskData = {
        tipo: document.getElementById('taskType').value,
        titulo: document.getElementById('taskTitle').value,
        descricao: document.getElementById('taskDescription').value,
        responsavel: document.getElementById('taskResponsible').value,
        prazo: document.getElementById('taskDeadline').value,
        status: 'pendente',
        setor: setorUsuario,
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await releaseClient
            .from('tarefas_painel_setor')
            .insert([taskData]);

        if (error) throw error;

        showAlert('Sucesso', 'Tarefa adicionada com sucesso!');
        closeModal('addTaskModal');
        clearTaskForm();
        loadPainelData();
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        showAlert('Erro', 'Erro ao salvar tarefa. Tente novamente.');
    }
}

async function saveTeamMember() {
    const setorUsuario = sessionStorage.getItem("setor");
    const memberData = {
        nome: document.getElementById('memberName').value,
        cargo: document.getElementById('memberRole').value,
        email: document.getElementById('memberEmail').value,
        ativo: true,
        setor: setorUsuario,
        created_at: new Date().toISOString()
    };

    // Upload da foto se fornecida
    const photoFile = document.getElementById('memberPhoto').files[0];
    if (photoFile) {
        const photoPath = `team/${Date.now()}_${photoFile.name}`;
        const { data: uploadData, error: uploadError } = await releaseClient.storage
            .from('team-photos')
            .upload(photoPath, photoFile);

        if (uploadError) {
            console.error('Erro ao fazer upload da foto:', uploadError);
        } else {
            memberData.foto_url = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/team-photos/${photoPath}`;
        }
    }

    try {
        const { data, error } = await releaseClient
            .from('time_painel_setor')
            .insert([memberData]);

        if (error) throw error;

        showAlert('Sucesso', 'Membro do time adicionado com sucesso!');
        closeModal('addTeamMemberModal');
        clearTeamMemberForm();
        loadPainelData();
    } catch (error) {
        console.error('Erro ao salvar membro do time:', error);
        showAlert('Erro', 'Erro ao salvar membro do time. Tente novamente.');
    }
}

async function saveProject() {
    if (!permissoes.includes('saveProject')) {
        showAlert('Atenção', 'Você não tem permissão para salvar um projeto.');
        return;
    }
    const setorUsuario = sessionStorage.getItem("setor");
    const projectData = {
        nome: document.getElementById('projectName').value,
        empresa: document.getElementById('projectCompany').value,
        especialista: document.getElementById('projectSpecialist').value,
        descricao: document.getElementById('projectDescription').value,
        status: document.getElementById('projectStatus').value,
        setor: setorUsuario,
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await releaseClient
            .from('projetos_painel_setor')
            .insert([projectData]);

        if (error) throw error;

        showAlert('Sucesso', 'Projeto adicionado com sucesso!');
        closeModal('addProjectModal');
        clearProjectForm();
        loadPainelData();
    } catch (error) {
        console.error('Erro ao salvar projeto:', error);
        showAlert('Erro', 'Erro ao salvar projeto. Tente novamente.');
    }
}

async function saveVisit() {
    const setorUsuario = sessionStorage.getItem("setor");
    const visitData = {
        empresa: document.getElementById('visitCompany').value,
        endereco: document.getElementById('visitAddress').value,
        cidade: document.getElementById('visitCity').value,
        estado: document.getElementById('visitState').value,
        data_visita: document.getElementById('visitDate').value,
        objetivo: document.getElementById('visitPurpose').value,
        setor: setorUsuario,
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await releaseClient
            .from('visitas_setor')
            .insert([visitData]);

        if (error) throw error;

        showAlert('Sucesso', 'Visita adicionada com sucesso!');
        closeModal('addVisitModal');
        clearVisitForm();
        loadPainelData();
    } catch (error) {
        console.error('Erro ao salvar visita:', error);
        showAlert('Erro', 'Erro ao salvar visita. Tente novamente.');
    }
}

async function saveEntrega() {
    const monthMap = {
        'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
        'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
    };

    const selectedMonth = document.getElementById('entregaMonth').value;
    const setorUsuario = sessionStorage.getItem("setor");
    const currentYear = new Date().getFullYear();

    try {
        // 1. Verificar se já existe uma entrada para o mês/ano/setor na tabela 'entregas'
        let { data: existingEntrega, error: selectEntregaError } = await releaseClient
            .from('entregas_painel_setor')
            .select('id')
            .eq('mes', monthMap[selectedMonth])
            .eq('ano', currentYear)
            .eq('setor', setorUsuario)
            .single();

        if (selectEntregaError && selectEntregaError.code !== 'PGRST116') {
            throw selectEntregaError;
        }

        let entregaId;
        if (existingEntrega) {
            entregaId = existingEntrega.id;
        } else {
            // Se não existe, criar uma nova entrada na tabela 'entregas'
            const { data: newEntrega, error: insertEntregaError } = await releaseClient
                .from('entregas_painel_setor')
                .insert([
                    {
                        mes: monthMap[selectedMonth],
                        ano: currentYear,
                        setor: setorUsuario,
                        created_at: new Date().toISOString()
                    }
                ])
                .select('id')
                .single();
            
            if (insertEntregaError) throw insertEntregaError;
            entregaId = newEntrega.id;
        }

        // 2. Salvar/Atualizar os percentuais de cada membro na tabela 'entregas_membros'
        let totalPercentage = 0;
        let memberCount = 0;
        
        if (teamMembers && teamMembers.length > 0) {
            for (const member of teamMembers) {
                const firstName = member.nome.split(' ')[0];
                const fieldId = `entrega${firstName}`;
                const input = document.getElementById(fieldId);
                if (input) {
                    const percentageValue = parseInt(input.value) || 0;

                    // Verificar se já existe uma entrada para este membro/entrega
                    const { data: existingMemberEntrega, error: selectMemberEntregaError } = await releaseClient
                        .from('entregas_membros_painel_setor')
                        .select('id')
                        .eq('entrega_id', entregaId)
                        .eq('membro_id', member.id)
                        .single();

                    if (selectMemberEntregaError && selectMemberEntregaError.code !== 'PGRST116') {
                        throw selectMemberEntregaError;
                    }

                    if (existingMemberEntrega) {
                        // Atualizar percentual existente
                        const { error: updateMemberEntregaError } = await releaseClient
                            .from('entregas_membros_painel_setor')
                            .update({ percentual: percentageValue })
                            .eq('id', existingMemberEntrega.id);
                        if (updateMemberEntregaError) throw updateMemberEntregaError;
                    } else {
                        // Inserir novo percentual
                        const { error: insertMemberEntregaError } = await releaseClient
                            .from('entregas_membros_painel_setor')
                            .insert([
                                {
                                    entrega_id: entregaId,
                                    membro_id: member.id,
                                    percentual: percentageValue,
                                    created_at: new Date().toISOString()
                                }
                            ]);
                        if (insertMemberEntregaError) throw insertMemberEntregaError;
                    }
                    totalPercentage += percentageValue;
                    memberCount++;
                }
            }
        }

        // 3. Atualizar o percentual do setor na tabela 'entregas'
        const setorPercentage = memberCount > 0 ? Math.round(totalPercentage / memberCount) : 0;
        console.log('Calculated setorPercentage:', setorPercentage, 'from totalPercentage:', totalPercentage, 'and memberCount:', memberCount);
        const { error: updateEntregaError } = await releaseClient
            .from("entregas_painel_setor")
            .update({ percentual_setor: setorPercentage })
            .eq("id", entregaId);
        if (updateEntregaError) throw updateEntregaError;

        showAlert('Sucesso', 'Entrega salva com sucesso!');
        closeModal('addEntregaModal');
        clearEntregaForm();
        loadPainelData();
    } catch (error) {
        console.error('Erro ao salvar entrega:', error);
        showAlert('Erro', 'Erro ao salvar entrega. Tente novamente: ' + error.message);
    }
}


function clearTaskForm() {
    document.getElementById('taskType').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskResponsible').value = '';
    document.getElementById('taskDeadline').value = '';
}

function clearTeamMemberForm() {
    document.getElementById('memberName').value = '';
    document.getElementById('memberRole').value = 'Gerente';
    document.getElementById('memberEmail').value = '';
    document.getElementById('memberPhoto').value = '';
}

function clearProjectForm() {
    document.getElementById('projectName').value = '';
    document.getElementById('projectCompany').value = '';
    document.getElementById('projectSpecialist').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectStatus').value = 'Planejamento';
}

function clearVisitForm() {
    document.getElementById('visitCompany').value = '';
    document.getElementById('visitAddress').value = '';
    document.getElementById('visitCity').value = '';
    document.getElementById('visitState').value = '';
    document.getElementById('visitDate').value = '';
    document.getElementById('visitPurpose').value = '';
}

function clearEntregaForm() {
    document.getElementById('entregaMonth').value = 'JAN';
    
    // Limpar campos dinâmicos baseados nos membros da equipe
    if (teamMembers && teamMembers.length > 0) {
        teamMembers.forEach(member => {
            const firstName = member.nome.split(' ')[0];
            const fieldId = `entrega${firstName}`;
            const input = document.getElementById(fieldId);
            if (input) {
                input.value = '';
            }
        });
    }
}

// Função para carregar dados do painel
async function loadPainelData() {
    try {
        // Carregar tarefas
        await carregarTarefas();

        // Carregar time
        await loadTimeData();
        
        // Carregar projetos
        await loadProjectsData();
        
        // Carregar entregas
        await loadEntregasData();
        
        // Atualizar contadores de tarefas
        await updateTaskCounters();
        
    } catch (error) {
        console.error('Erro ao carregar dados do painel:', error);
    }
}

// Carregar dados do time
async function loadTimeData() {
    try {
        const setorUsuario = sessionStorage.getItem("setor");
        const { data, error } = await releaseClient
            .from('time_painel_setor')
            .select('*')
            .eq('ativo', true)
            .eq('setor', setorUsuario)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Atualizar variável global teamMembers
        teamMembers = data || [];

        const timeList = document.getElementById('timeList');
        
        if (data.length === 0) {
            timeList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-users" style="font-size: 2em; margin-bottom: 10px;"></i>
                    <p>Nenhum membro cadastrado</p>
                </div>
            `;
        } else {
            timeList.innerHTML = data.map(member => `
                <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #4fc3f7; display: flex; align-items: center; justify-content: center; margin-right: 15px; overflow: hidden;">
                        ${member.foto_url ? 
                            `<img src="${member.foto_url}" alt="${member.nome}" style="width: 100%; height: 100%; object-fit: cover;">` :
                            `<span style="color: white; font-weight: bold; font-size: 1.2em;">${member.nome.charAt(0).toUpperCase()}</span>`
                        }
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: #4fc3f7; font-size: 1.1em;">${member.nome}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9em;">${member.cargo}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar dados do time:', error);
    }
}

// Carregar dados dos projetos
async function loadProjectsData() {
    try {
        const setorUsuario = sessionStorage.getItem("setor");
        const { data, error } = await releaseClient
            .from('projetos_painel_setor')
            .select('*')
            .eq('setor', setorUsuario)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tableBody = document.getElementById('projetosTableBody');
        
        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                        Nenhum projeto em andamento
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = data.map(project => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px; font-weight: bold; color: #333;">${project.nome}</td>
                    <td style="padding: 15px; color: #666;">${project.empresa}</td>
                    <td style="padding: 15px; color: #666;">${project.especialista}</td>
                    <td style="padding: 15px; text-align: center;">
                        <button onclick="excluirProjeto(${project.id})" style="background: #f44336; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 12px; transition: background 0.3s ease;" onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#f44336'">
                            <i class="fas fa-trash" style="margin-right: 4px;"></i>Excluir
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar dados dos projetos:', error);
    }
}

// Carregar dados das entregas
async function loadEntregasData() {
    // Usar a nova função carregarEntregas que é dinâmica
    await carregarEntregas();
}

// Atualizar contadores de tarefas
async function updateTaskCounters() {
    try {
        const { data, error } = await releaseClient
            .from('tarefas_painel_setor')
            .select('tipo');

        if (error) throw error;

        
        const counters = {
            treinamento: 0,
            migracao: 0,
            reuniao: 0,
            mvp: 0,
            homologacao: 0,
            acompanhamento: 0,
            implantacao: 0,
            projeto: 0,
            ticket: 0
        };

        data.forEach(tarefa => {
            if (counters.hasOwnProperty(tarefa.tipo)) {
                counters[tarefa.tipo]++;
            }
        });

       
    } catch (error) {
        console.error('Erro ao atualizar contadores de tarefas:', error);
    }
}



// Função para inicializar o carregamento de contadores 
document.addEventListener('DOMContentLoaded', () => {
    carregarContadoresDeTarefas();
});

// Adicionar funcionalidade específica para o painel do setor
document.addEventListener('DOMContentLoaded', function() {
    
 const painelButton = document.querySelector("button[onclick=\"showTab(\'painel-setor\')\"]");    if (painelButton) {
        painelButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            const painelSection = document.getElementById('painel-setor');
            if (painelSection) {
                painelSection.classList.add('active');
            }

            
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            painelButton.parentElement.classList.add('active');
            
            
            setTimeout(() => {
                loadPainelData();
                initializeMap();
            }, 100);
        });
    }
});

// Variável global para o mapa
let visitasMap = null;

// Função para inicializar o mapa real
async function initializeMap() {
    try {
        
        if (visitasMap) {
            visitasMap.remove(); 
        }
        
        visitasMap = L.map('mapContainer').setView([-14.2350, -51.9253], 4);

        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(visitasMap);

        
        await loadVisitasOnMap();
        
    } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        document.getElementById('mapContainer').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; border-radius: 10px;">
                <div style="text-align: center; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 10px;"></i>
                    <p>Erro ao carregar mapa</p>
                </div>
            </div>
        `;
    }
}

// Função para carregar visitas no mapa
async function loadVisitasOnMap() {
    try {
        const setorUsuario = sessionStorage.getItem("setor");
        const { data: visitas, error } = await releaseClient
            .from('visitas_setor')
            .select('*')
            .eq('setor', setorUsuario)
            .order('created_at', { ascending: false });

        if (error) throw error;

        
        visitasMap.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                visitasMap.removeLayer(layer);
            }
        });

        let empresasCount = 0;

       
        for (const visita of visitas) {
            let lat = visita.latitude;
            let lng = visita.longitude;

            
            if (!lat || !lng) {
                const coords = await geocodeAddress(`${visita.endereco}, ${visita.cidade}, ${visita.estado}, Brasil`);
                if (coords) {
                    lat = coords.lat;
                    lng = coords.lng;
                    
                    
                    await releaseClient
                        .from('visitas_setor')
                        .update({ latitude: lat, longitude: lng })
                        .eq('id', visita.id);
                }
            }

            if (lat && lng) {
               
                const marker = L.marker([lat, lng]).addTo(visitasMap);
                
             
                const popupContent = `
                    <div style="min-width: 200px;">
                        <h4 style="margin: 0 0 10px 0; color: #4fc3f7;">${visita.empresa}</h4>
                        <p style="margin: 5px 0;"><strong>Cidade:</strong> ${visita.cidade}, ${visita.estado}</p>
                        <p style="margin: 5px 0;"><strong>Data:</strong> ${visita.data_visita ? new Date(visita.data_visita).toLocaleDateString('pt-BR') : 'Não informada'}</p>
                        <p style="margin: 5px 0;"><strong>Objetivo:</strong> ${visita.objetivo || 'Não informado'}</p>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                empresasCount++;
            }
        }

        
        const empresasCountElement = document.getElementById('empresasCount');
        if (empresasCountElement) {
            empresasCountElement.textContent = empresasCount.toString().padStart(2, '0');
        }

       
        if (empresasCount > 0) {
            const group = new L.featureGroup();
            visitasMap.eachLayer(function (layer) {
                if (layer instanceof L.Marker) {
                    group.addLayer(layer);
                }
            });
            if (group.getLayers().length > 0) {
                visitasMap.fitBounds(group.getBounds().pad(0.1));
            }
        }

    } catch (error) {
        console.error('Erro ao carregar visitas no mapa:', error);
    }
}


async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Erro na geocodificação:', error);
        return null;
    }
}

//  função saveVisit para atualizar o mapa
async function saveVisit() {
    const setorUsuario = sessionStorage.getItem("setor");
    const visitData = {
        empresa: document.getElementById('visitCompany').value,
        endereco: document.getElementById('visitAddress').value,
        cidade: document.getElementById('visitCity').value,
        estado: document.getElementById('visitState').value,
        data_visita: document.getElementById('visitDate').value,
        objetivo: document.getElementById('visitPurpose').value,
        setor: setorUsuario,
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await releaseClient
            .from('visitas_setor')
            .insert([visitData]);

        if (error) throw error;

        showAlert('Sucesso', 'Visita adicionada com sucesso!');
        closeModal('addVisitModal');
        clearVisitForm();
        loadPainelData();

       
        if (visitasMap) {
            await loadVisitasOnMap();
        }

    } catch (error) {
        console.error('Erro ao salvar visita:', error);
        showAlert('Erro', 'Erro ao salvar visita. Tente novamente.');
    }
}

// Função para excluir projeto
async function excluirProjeto(projetoId) {
    if (!permissoes.includes('excluirProjeto')) {
        showAlert('Atenção', 'Você não tem permissão para excluir projetos.');
        return;
    }

    const confirmacao = await showConfirm(
        'Confirmar Exclusão',
        'Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.'
    );

    if (confirmacao) {
        try {
            const { error } = await releaseClient
                .from('projetos_painel_setor')
                .delete()
                .eq('id', projetoId);

            if (error) throw error;

            showAlert('Sucesso', 'Projeto excluído com sucesso!');
            
           
            await loadProjectsData();
            
          
            const elemento = document.getElementById('projetos-count');
            if (elemento) {
                let valorAtual = parseInt(elemento.textContent);
                let novoValor = Math.max(0, valorAtual - 1);
                elemento.textContent = novoValor.toString().padStart(2, '0');
            }
            
        } catch (error) {
            console.error('Erro ao excluir projeto:', error);
            showAlert('Erro', 'Erro ao excluir projeto. Tente novamente.');
        }
    }
}




  document.addEventListener('DOMContentLoaded', function() {
    const releaseDateInput = document.getElementById('releaseDate');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    releaseDateInput.value = `${year}-${month}-${day}`;
  });




  document.addEventListener("DOMContentLoaded", function() {
    const rvDateInput = document.getElementById("rvData");
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    rvDateInput.value = `${year}-${month}-${day}`;
  });

// Funções para abrir os modais
function enviarPorEmail() {
  
  const empresa = document.getElementById('rvEmpresa').value || 'Empresa não informada';
  document.getElementById('emailSubject').value = `Relatório de Visita - ${empresa}`;
  
  const defaultMessage = `Prezado(a),

Segue em anexo o Relatório de Visita da empresa ${empresa}.

Atenciosamente,
Equipe Tryvia`;
  
  document.getElementById('emailMessage').value = defaultMessage;
  
  // Mostrar modal
  document.getElementById('emailModal').classList.add('visible');
}

function enviarPorWhatsapp() {
  
  const empresa = document.getElementById('rvEmpresa').value || 'Empresa não informada';
  const data = document.getElementById('rvData').value || 'Data não informada';
  const resumo = document.getElementById('rvResumo').value || 'Resumo não informado';

  const defaultMessage = `*Relatório de Visita*

*Empresa:* ${empresa}
*Data:* ${data}
*Resumo:* ${resumo}

Gerado via Portal Tryvia.`;

  document.getElementById('whatsappMessage').value = defaultMessage;
  
  // Mostrar modal
  document.getElementById('whatsappModal').classList.add('visible');
}

// Funções para fechar os modais
function closeEmailModal() {
  document.getElementById('emailModal').classList.remove('visible');
}

function closeWhatsappModal() {
  document.getElementById('whatsappModal').classList.remove('visible');
}

// Função para enviar relatório por e-mail (executada após confirmação no modal)
async function enviarRelatorioPorEmail() {
  const emails = document.getElementById('emailRecipients').value.trim();
  const subject = document.getElementById('emailSubject').value.trim();
  const message = document.getElementById('emailMessage').value.trim();
  
  if (!emails) {
    showAlert('Atenção', 'Por favor, digite pelo menos um e-mail de destinatário.');
    return;
  }
  
  if (!subject) {
    showAlert('Atenção', 'Por favor, digite o assunto do e-mail.');
    return;
  }
  
  try {
    // Gerar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Adicionar título
    doc.setTextColor(0, 230, 253);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Visita', 80, 30);

    // Adicionar conteúdo
    let y = 45;
    doc.setDrawColor(0, 230, 253);
    doc.line(10, y - 5, 200, y - 5);

    const campos = [
      ['Empresa', 'rvEmpresa'],
      ['Data', 'rvData'],
      ['Gestor', 'rvGestor'],
      ['Analista', 'rvAnalista'],
      ['Serviços Contratados', 'rvServicos'],
      ['Chamados Urgentes', 'rvChamados'],
      ['Local', 'rvLocal']
    ];

    doc.setFontSize(12);
    doc.setTextColor(0);
    campos.forEach(([label, id]) => {
      const el = document.getElementById(id);
      const valor = el ? el.value : '';
      const texto = doc.splitTextToSize(`${label}: ${valor}`, 180);
      doc.text(texto, 10, y);
      y += texto.length * 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // Adicionar resumo em tabela
    const resumo = document.getElementById('rvResumo')?.value || '';
    const linhasResumo = resumo.split('\n').map(linha => [linha.trim()]);
    if (linhasResumo.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 230, 253);
      doc.text('Resumo da Visita (Tabela)', 10, 20);
      doc.autoTable({
        startY: 30,
        head: [['Conteúdo']],
        body: linhasResumo,
        styles: { fontSize: 10, halign: 'left' },
        headStyles: { fillColor: [0, 230, 253], textColor: 20, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.1
      });
    }

    // Adicionar gráficos
    const canvas1 = document.getElementById('chartVeiculos');
    if (canvas1) {
      const imgData1 = canvas1.toDataURL('image/png');
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 230, 253);
      doc.text('Gráfico: Report de Veículos', 10, 20);
      doc.addImage(imgData1, 'PNG', 10, 30, 180, 90);
    }

    const canvas2 = document.getElementById('chartComparativo');
    if (canvas2) {
      const imgData2 = canvas2.toDataURL('image/png');
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 230, 253);
      doc.text('Gráfico: Comparativo de Visitas por Empresa', 10, 20);
      doc.addImage(imgData2, 'PNG', 10, 30, 180, 90);
    }

 
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const empresa = document.getElementById('rvEmpresa').value || 'Empresa';
    const data = document.getElementById('rvData').value || new Date().toLocaleDateString('pt-BR');
    const fileName = `Relatorio_Visita_${empresa.replace(/\s+/g, '_')}_${data.replace(/\//g, '-')}.pdf`;
    
    let downloadLink = '';
    
    try {
     
      const response = await fetch(`${PDF_SERVER_URL}/api/pdf/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName,
          data: pdfBase64
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        downloadLink = `${PDF_SERVER_URL}/api/pdf/download/${result.id}`;
        console.log('PDF enviado para servidor:', downloadLink);
      } else {
        throw new Error('Servidor não disponível');
      }
    } catch (error) {
      console.warn('Servidor de PDF não disponível, usando fallback local:', error);
      
      const pdfBlob = doc.output('blob');
      downloadLink = URL.createObjectURL(pdfBlob);
    }
    
    // Processar lista de e-mails
    const emailList = emails.split(/[,\n]/).map(email => email.trim()).filter(email => email && email.includes('@'));
    
    if (emailList.length === 0) {
      showAlert('Erro', 'Nenhum e-mail válido foi encontrado. Verifique os endereços digitados.');
      return;
    }
    
    // Preparar corpo do e-mail em HTML com link clicável
    const emailBodyHTML = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <p>${message || `Prezado(a),<br><br>Segue o Relatório de Visita gerado pelo portal.`}</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #00e6fd; margin-top: 0;">📄 Relatório de Visita</h3>
        <p><strong>Empresa:</strong> ${empresa}</p>
        <p><strong>Data:</strong> ${data}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <h3 style="color: #00e6fd;">🔗 Download do PDF</h3>
    <a href="${downloadLink}"
   style="display:inline-block;
          background-color:#00e6fd;
          color:white;
          padding:15px 30px;
          text-decoration:none;
          border-radius:5px;
          font-weight:bold;">
  📥 CLIQUE AQUI PARA BAIXAR O PDF
</a></div>
      
      <p style="font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 30px;">
        Gerado automaticamente pelo Portal Tryvia
      </p>
    </div>`;
    
    const emailBodyText = `${message || `Prezado(a),

Segue o Relatório de Visita gerado pelo portal.`}

📄 Relatório de Visita
Empresa: ${empresa}
Data: ${data}

🔗 Para baixar o PDF, copie e cole o link abaixo no seu navegador:
${downloadLink}

---
Gerado automaticamente pelo Portal Tryvia`;

    
    let successCount = 0;
    let errorCount = 0;
    
    for (const email of emailList) {
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || email.trim() === '' || !emailRegex.test(email.trim())) {
          console.error(`Email inválido: "${email}"`);
          errorCount++;
          continue;
        }
        
        const cleanEmail = email.trim();
        console.log(`Tentando enviar para: "${cleanEmail}"`);
        
        const templateParams = {
          email: cleanEmail,
          subject: subject,
          message_html: emailBodyHTML,  
          message_text: emailBodyText   
        };

        const response = await emailjs.send('service_g3ln0jh', 'template_waamyv4', templateParams);
        
        if (response.status === 200) {
          successCount++;
          console.log(`Email enviado com sucesso para: ${cleanEmail}`);
        } else {
          errorCount++;
          console.error(`Erro ao enviar para ${email}:`, response);
        }
      } catch (error) {
        errorCount++;
        console.error(`Erro ao enviar para ${email}:`, error);
      }
    }
    
    closeEmailModal();
    
    if (successCount > 0) {
      if (errorCount === 0) {
        showAlert('Sucesso', `✅ E-mail enviado com sucesso para ${successCount} destinatário(s)! O link para download do PDF está clicável no e-mail e funcionará permanentemente.`);
      } else {
        showAlert('Parcial', `E-mail enviado para ${successCount} de ${emailList.length} destinatários. ${errorCount} falharam.`);
      }
    } else {
      showAlert('Erro', 'Falha ao enviar e-mail para todos os destinatários. Verifique os endereços e tente novamente.');
    }
    
  } catch (error) {
    console.error('Erro ao enviar por e-mail:', error);
    closeEmailModal();
    showAlert('Erro', 'Erro ao enviar e-mail. Verifique sua conexão e tente novamente.');
  }
}
// Função para enviar relatório por WhatsApp (executada após confirmação no modal)
function enviarRelatorioPorWhatsapp() {
  const number = document.getElementById('whatsappNumber').value.trim();
  const message = document.getElementById('whatsappMessage').value.trim();
  
  if (!number) {
    showAlert('Atenção', 'Por favor, digite o número do WhatsApp.');
    return;
  }
  
  if (!message) {
    showAlert('Atenção', 'Por favor, digite a mensagem.');
    return;
  }
  
  try {
    
    const cleanNumber = number.replace(/\D/g, '');
    let formattedNumber = cleanNumber;
    
    
    if (cleanNumber.length === 11 && cleanNumber.startsWith('11')) {
      formattedNumber = '55' + cleanNumber;
    } else if (cleanNumber.length === 10) {
      formattedNumber = '5511' + cleanNumber;
    } else if (!cleanNumber.startsWith('55')) {
      formattedNumber = '55' + cleanNumber;
    }
    
    // Gerar PDF para download
    gerarPDFVisita();
    
    // Abrir WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    closeWhatsappModal();
    showAlert('Sucesso', 'WhatsApp aberto com a mensagem. O PDF foi gerado para você anexar manualmente na conversa.');
    
  } catch (error) {
    console.error('Erro ao enviar por WhatsApp:', error);
    showAlert('Erro', 'Erro ao abrir WhatsApp. Verifique o número e tente novamente.');
  }
}

// Fechar modais ao clicar fora deles
document.addEventListener('click', function(event) {
  const emailModal = document.getElementById('emailModal');
  const whatsappModal = document.getElementById('whatsappModal');
  
  if (event.target === emailModal) {
    closeEmailModal();
  }
  
  if (event.target === whatsappModal) {
    closeWhatsappModal();
  }
});

// Fechar modais com a tecla ESC
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeEmailModal();
    closeWhatsappModal();
  }
});

async function buscarClienteIdPorEmpresa(nomeEmpresa) {
    try {
        const { data, error } = await releaseClient
            .from('clients')
            .select('id')
            .eq('name', nomeEmpresa)
            .single();

        if (error) {
            console.error('Erro ao buscar cliente por empresa:', error.message);
            return null;
        }

        return data ? data.id : null;
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return null;
    }
}

// Função para sanitizar nomes de arquivo removendo caracteres inválidos
function sanitizeFileName(fileName) {
    return fileName
        .replace(/[\/\\:*?"<>|]/g, '-') 
        .replace(/\s+/g, '_') 
        .replace(/[^\w\-_.]/g, '') 
        .replace(/_+/g, '_') 
        .replace(/-+/g, '-'); 
}

async function salvarPDFNoCliente(pdfBlob, clientId) {
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const title = `Relatório de Visita - ${dateStr}`;
    const type = 'relatorio';
    const sanitizedFileName = sanitizeFileName(`${title}.pdf`);
    const file = new File([pdfBlob], sanitizedFileName, { type: 'application/pdf' });

    if (title && type && file) {
        const filePath = `client_documents/${clientId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await releaseClient.storage
            .from('clientdocumentfiles')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Erro ao fazer upload do arquivo do cliente:', uploadError.message);
            showAlert('Erro', 'Erro ao fazer upload do documento do cliente. Verifique as permissões do bucket.');
            return;
        }

        const publicURL = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/clientdocumentfiles/${filePath}`;

        const { data, error } = await releaseClient
            .from('client_documents')
            .insert([
                { client_id: clientId, title, type, file_url: publicURL, file_path: filePath }
            ]);

        if (error) {
            console.error('Erro ao adicionar documento do cliente no banco de dados:', error.message);
            showAlert('Erro', 'Erro ao adicionar documento do cliente. Verifique as permissões da tabela.');
        } else {
            showAlert('Sucesso', 'Relatório de visita salvo automaticamente no cliente!');
            if (typeof fetchAndRenderClientDocuments === 'function') {
                await fetchAndRenderClientDocuments(clientId);
            }
        }
    } else {
        showAlert('Atenção', 'Não foi possível salvar o relatório, dados insuficientes.');
    }
}

let currentEvaluation = {
    documentId: null,
    documentTitle: null,
    clientId: null,
    rating: 0
};

// Função para abrir o modal de avaliação
function openEvaluationModal(documentId, documentTitle, clientId) {
    currentEvaluation.documentId = documentId;
    currentEvaluation.documentTitle = documentTitle;
    currentEvaluation.clientId = clientId;
    currentEvaluation.rating = 0;
    
    document.getElementById('evalDocumentTitle').textContent = documentTitle;
    document.getElementById('evaluationObservations').value = '';
    document.getElementById('ratingText').textContent = '';
    
    // Reset das estrelas
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.style.color = '#ddd';
    });
    
    document.getElementById('evaluationModal').style.display = 'block';
}

// Função para fechar o modal de avaliação
function closeEvaluationModal() {
    document.getElementById('evaluationModal').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.star');
    const ratingTexts = ['', 'Muito Ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            currentEvaluation.rating = rating;
            
            // Atualizar visual das estrelas
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#ffc107';
                } else {
                    s.style.color = '#ddd';
                }
            });
            
            // Atualizar texto da avaliação
            document.getElementById('ratingText').textContent = ratingTexts[rating];
        });
        
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#ffc107';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });
    
    // Restaurar avaliação atual ao sair do hover
    document.querySelector('.star-rating').addEventListener('mouseleave', function() {
        stars.forEach((s, index) => {
            if (index < currentEvaluation.rating) {
                s.style.color = '#ffc107';
            } else {
                s.style.color = '#ddd';
            }
        });
    });
});

// Função para salvar a avaliação
async function submitEvaluation() {
    if (currentEvaluation.rating === 0) {
        showAlert('Atenção', 'Por favor, selecione uma avaliação de 1 a 5 estrelas.');
        return;
    }
    
    const observations = document.getElementById('evaluationObservations').value.trim();
    
    const evaluation = {
        document_id: currentEvaluation.documentId,
        document_title: currentEvaluation.documentTitle,
        client_id: currentEvaluation.clientId,
        rating: currentEvaluation.rating,
        observations: observations,
        created_at: new Date().toISOString()
    };
    
    try {
        // Salvar no Supabase
        const { data, error } = await releaseClient
            .from('visit_evaluations')
            .insert([evaluation]);
        
        if (error) {
            console.error('Erro ao salvar avaliação:', error);
            showAlert('Erro', 'Erro ao salvar avaliação. Tente novamente.');
            return;
        }
        
        showAlert('Sucesso', 'Avaliação salva com sucesso!');
        closeEvaluationModal();
        
       
        if (currentSection === 'evaluations') {
            loadEvaluations();
        }
        
        
        if (currentSection === 'clients') {
           
            const currentClientId = getCurrentClientId();
            if (currentClientId) {
                viewClientDocuments(currentClientId);
            }
        }
        
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        showAlert('Erro', 'Erro ao salvar avaliação. Verifique sua conexão.');
    }
}

// Fechar modal ao clicar fora dele
window.addEventListener('click', function(event) {
    const modal = document.getElementById('evaluationModal');
    if (event.target === modal) {
        closeEvaluationModal();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const csContactDate = document.getElementById('csContactDate');
    if (csContactDate) {
        const hoje = new Date();
        const yyyy = hoje.getFullYear();
        const mm = String(hoje.getMonth() + 1).padStart(2, '0');
        const dd = String(hoje.getDate()).padStart(2, '0');
        csContactDate.value = `${yyyy}-${mm}-${dd}`;
    }
});

// Variável global para controlar a seção atual
let currentSection = 'inicio';


async function loadEvaluations() {
    currentSection = 'evaluations';
    const container = document.getElementById('evaluationsList');
    
    try {
        
        const { data: evaluations, error } = await releaseClient
            .from('visit_evaluations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Erro ao carregar avaliações:', error);
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 4em; margin-bottom: 20px;">❌</div>
                    <h3>Erro ao carregar avaliações</h3>
                    <p>Verifique sua conexão com o banco de dados.</p>
                </div>
            `;
            return;
        }
        
        // Atualizar estatísticas
        updateEvaluationStats(evaluations || []);
        
        // Carregar filtro de clientes
        loadClientFilter(evaluations || []);
        
        if (!evaluations || evaluations.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 4em; margin-bottom: 20px;">⭐</div>
                    <h3>Nenhuma avaliação encontrada</h3>
                    <p>As avaliações de visitas aparecerão aqui quando forem criadas.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = evaluations.map(evaluation => `
            <div class="evaluation-card" style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid ${getRatingColor(evaluation.rating)};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${evaluation.document_title}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9em;">${clients.find(c => c.id === evaluation.client_id)?.name || `Cliente ID: ${evaluation.client_id}`} • ${formatDateTimeForDisplay(evaluation.created_at)}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2em; color: #ffc107; margin-bottom: 5px;">
                            ${generateStars(evaluation.rating)}
                        </div>
                        <span style="font-size: 0.9em; color: #666;">${getRatingText(evaluation.rating)}</span>
                    </div>
                </div>
                ${evaluation.observations ? `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 3px solid #007bff;">
                        <strong style="color: #333;">Observações:</strong>
                        <p style="margin: 5px 0 0 0; color: #555; line-height: 1.5;">${evaluation.observations}</p>
                    </div>
                ` : ''}
                <div style="margin-top: 15px; text-align: right;">
                    <button onclick="deleteEvaluation(${evaluation.id})" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 4em; margin-bottom: 20px;">❌</div>
                <h3>Erro ao carregar avaliações</h3>
                <p>Verifique sua conexão com o banco de dados.</p>
            </div>
        `;
    }
}

// Função para atualizar estatísticas
function updateEvaluationStats(evaluations) {
    const total = evaluations.length;
    const average = total > 0 ? (evaluations.reduce((sum, e) => sum + e.rating, 0) / total).toFixed(1) : '0.0';
    
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthCount = evaluations.filter(e => new Date(e.date) >= lastMonth).length;
    
    document.getElementById('totalEvaluations').textContent = total;
    document.getElementById('averageRating').textContent = average;
    document.getElementById('lastMonthEvaluations').textContent = lastMonthCount;
}

// Função para carregar filtro de clientes
async function loadClientFilter(evaluations) {
    const clientIds = [...new Set(evaluations.map(e => e.client_id))].sort();
    const filterSelect = document.getElementById('filterClient');
    
    try {
       
        const { data: clients, error } = await releaseClient
            .from('clients')
            .select('id, name')
            .in('id', clientIds);
        
        if (error) {
            console.error('Erro ao carregar clientes:', error);
           
            filterSelect.innerHTML = '<option value="">Todos os clientes</option>' + 
                clientIds.map(id => `<option value="${id}">Cliente ${id}</option>`).join('');
            return;
        }
        
        // Criar um mapa de ID para nome
        const clientMap = {};
        clients.forEach(client => {
            clientMap[client.id] = client.name;
        });
        
        // Gerar as opções com os nomes dos clientes
        filterSelect.innerHTML = '<option value="">Todos os clientes</option>' + 
            clientIds.map(id => {
                const clientName = clientMap[id] || `Cliente ${id}`;
                return `<option value="${id}">${clientName}</option>`;
            }).join('');
            
    } catch (error) {
        console.error('Erro ao carregar filtro de clientes:', error);
        
        filterSelect.innerHTML = '<option value="">Todos os clientes</option>' + 
            clientIds.map(id => `<option value="${id}">Cliente ${id}</option>`).join('');
    }
}

// Função para filtrar avaliações
async function filterEvaluations() {
    const clientFilter = document.getElementById('filterClient').value;
    const ratingFilter = document.getElementById('filterRating').value;
    const searchTerm = document.getElementById('searchEvaluations').value.toLowerCase();
    
    try {
        
        let query = supabase
            .from('visit_evaluations')
            .select('*')
            .order('created_at', { ascending: false });
        
        
        if (clientFilter) {
            query = query.eq('client_id', clientFilter);
        }
        
        if (ratingFilter) {
            query = query.eq('rating', ratingFilter);
        }
        
        const { data: evaluations, error } = await query;
        
        if (error) {
            console.error('Erro ao filtrar avaliações:', error);
            return;
        }
        
        let filteredEvaluations = evaluations || [];
        
        
        if (searchTerm) {
            filteredEvaluations = filteredEvaluations.filter(e => 
                e.document_title.toLowerCase().includes(searchTerm) ||
                (e.observations && e.observations.toLowerCase().includes(searchTerm))
            );
        }
        
        
        const container = document.getElementById('evaluationsList');
        
        if (filteredEvaluations.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 4em; margin-bottom: 20px;">🔍</div>
                    <h3>Nenhuma avaliação encontrada</h3>
                    <p>Tente ajustar os filtros de busca.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredEvaluations.map(evaluation => `
            <div class="evaluation-card" style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid ${getRatingColor(evaluation.rating)};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${evaluation.document_title}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.9em;">${clients.find(c => c.id === evaluation.client_id)?.name || `Cliente ID: ${evaluation.client_id}`} • ${formatDateTimeForDisplay(evaluation.created_at)}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2em; color: #ffc107; margin-bottom: 5px;">
                            ${generateStars(evaluation.rating)}
                        </div>
                        <span style="font-size: 0.9em; color: #666;">${getRatingText(evaluation.rating)}</span>
                    </div>
                </div>
                ${evaluation.observations ? `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 3px solid #007bff;">
                        <strong style="color: #333;">Observações:</strong>
                        <p style="margin: 5px 0 0 0; color: #555; line-height: 1.5;">${evaluation.observations}</p>
                    </div>
                ` : ''}
                <div style="margin-top: 15px; text-align: right;">
                    <button onclick="deleteEvaluation(${evaluation.id})" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao filtrar avaliações:', error);
    }
}

// Funções auxiliares
function generateStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function getRatingText(rating) {
    const texts = ['', 'Muito Ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
    return texts[rating] || '';
}

function getRatingColor(rating) {
    const colors = ['', '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];
    return colors[rating] || '#6c757d';
}

// Função para excluir avaliação
async function deleteEvaluation(evaluationId) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
        return;
    }
    
    try {
        const { error } = await releaseClient
            .from('visit_evaluations')
            .delete()
            .eq('id', evaluationId);
        
        if (error) {
            console.error('Erro ao excluir avaliação:', error);
            showAlert('Erro', 'Erro ao excluir avaliação. Tente novamente.');
            return;
        }
        
        showAlert('Sucesso', 'Avaliação excluída com sucesso!');
        loadEvaluations();
        
    } catch (error) {
        console.error('Erro ao excluir avaliação:', error);
        showAlert('Erro', 'Erro ao excluir avaliação. Verifique sua conexão.');
    }
}

// Função para verificar se um documento já foi avaliado
async function isDocumentEvaluated(documentId) {
    try {
        const { data, error } = await releaseClient
            .from('visit_evaluations')
            .select('id')
            .eq('document_id', documentId)
            .limit(1);
        
        if (error) {
            console.error('Erro ao verificar avaliação:', error);
            return false;
        }
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Erro ao verificar avaliação:', error);
        return false;
    }
}


function getCurrentClientId() {
    
    const clientCards = document.querySelectorAll('.client-card');
    for (let card of clientCards) {
        if (card.style.display !== 'none') {
            
            const viewButton = card.querySelector('button[onclick*="viewClientDocuments"]');
            if (viewButton) {
                const match = viewButton.getAttribute('onclick').match(/viewClientDocuments\((\d+)\)/);
                if (match) {
                    return parseInt(match[1]);
                }
            }
        }
    }
    return null;
}


const originalShowTab = window.showTab;
window.showTab = function(tabId) {
    if (originalShowTab) {
        originalShowTab(tabId);
    }
    
    if (tabId === 'evaluations') {
        loadEvaluations();
    }
};



document.addEventListener('DOMContentLoaded', function() {
 
  let permissoes = [];
  try {
    permissoes = JSON.parse(localStorage.getItem('permissoes')) || [];
  } catch (e) {
    permissoes = [];
  }

  
  document.querySelectorAll('.nav-item button[data-permissao]').forEach(btn => {
    const perm = btn.getAttribute('data-permissao');
    if (!permissoes.includes(perm)) {
      btn.parentElement.style.display = 'none';
    }
  });
});


function logoutTryvia() {
    sessionStorage.removeItem('tryvia_logged');
    localStorage.removeItem('username');
    window.location.href = 'https://tryvia.github.io/dev/tryvia_portal_dev.html';
}

// ===== FUNÇÕES PARA GERENCIAR USUÁRIOS =====


let todosUsuarios = [];
let usuariosFiltrados = [];


async function fetchAndRenderUsuarios() {
    try {
       
        let query = releaseClient.from('usuarios').select('*').order('nome', { ascending: true });
        const userType = localStorage.getItem('user_type');
        const clientId = sessionStorage.getItem('client_id');
        
        if (
            userType === 'client' &&
            clientId &&
            clientId !== 'null' &&
            clientId !== null &&
            clientId !== undefined &&
            clientId !== '' &&
            !isNaN(Number(clientId))
        ) {
            query = query.eq('client_id', Number(clientId));
        }
        const { data: usuarios, error } = await query;

        if (error) {
            console.error('Erro ao buscar usuários:', error);
            showAlert('Erro', 'Erro ao carregar usuários: ' + error.message);
            return;
        }

        todosUsuarios = usuarios || [];
        usuariosFiltrados = [...todosUsuarios];
        renderUsuarios();
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        showAlert('Erro', 'Erro ao carregar usuários: ' + error.message);
    }
}

// Função para renderizar a tabela de usuários
function renderUsuarios() {
    const tbody = document.getElementById('usuariosTableBody');
    
    if (usuariosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-users" style="margin-right: 8px;"></i>
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usuariosFiltrados.map(usuario => {
        const nomeSeguro = String(usuario.nome).replace(/'/g, "'").replace(/\n/g, ' ');     return `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px; font-weight: bold;">${usuario.nome}</td>
            <td style="padding: 15px;">${usuario.email}</td>
            <td style="padding: 15px; text-align: center;">
                <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
                    ${usuario.permissoes.map(perm => `
                        <span style="background: #4fc3f7; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">
                            ${getPermissaoLabel(perm)}
                        </span>
                    `).join('')}
                </div>
            </td>
            <td style="padding: 15px; text-align: center;">
                <button onclick="editarUsuario('${usuario.id}')" style="background: #4fc3f7; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin-right: 5px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="excluirUsuario('${usuario.id}')" style="background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </td>
        </tr>
        `;
    }).join('');
}
// Função para obter o label da permissão
function getPermissaoLabel(permissao) {
    const labels = {
        'inicio': 'Início',
        'painel-setor': 'Painel do Setor',
        'dashboard': 'Dashboards',
        'clients': 'Clientes',
        'homologacao': 'Homologação',
        'release': 'Release',
        'reunioes': 'Reuniões',
        'documents': 'Time de Implantação',
        'evaluations': 'Avaliações',
        'relatorioVisita': 'Relatório de Visita',
        'gestao': 'Gestão'
    };
    return labels[permissao] || permissao;
}

// Função para adicionar usuário
async function adicionarUsuario() {
    const nome = document.getElementById('usuarioNome').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const senha = document.getElementById('usuarioSenha').value;
    const confirmarSenha = document.getElementById('usuarioConfirmarSenha').value;
     const setor = document.getElementById('usuarioSetor').value;

    // Validações
    if (!nome || !email || !senha || !confirmarSenha) {
        showAlert('Erro', 'Todos os campos são obrigatórios.');
        return;
    }

    if (senha !== confirmarSenha) {
        showAlert('Erro', 'As senhas não coincidem.');
        return;
    }

    if (senha.length < 6) {
        showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Erro', 'Por favor, insira um email válido.');
        return;
    }

    
    const permissoes = [];
    document.querySelectorAll('input[type="checkbox"][id^="perm-"]:checked').forEach(checkbox => {
        permissoes.push(checkbox.value);
    });

    if (permissoes.length === 0) {
        showAlert('Erro', 'Selecione pelo menos uma permissão.');
        return;
    }

    try {
        
        const { data: existingUser, error: checkError } = await releaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            showAlert('Erro', 'Já existe um usuário com este email.');
            return;
        }

       
        const { data, error } = await releaseClient
            .from('usuarios')
            .insert([{
                nome: nome,
                email: email,
                senha: senha, 
                permissoes: permissoes,
                setor: setor
            }])
            .select();

        if (error) {
            console.error('Erro ao adicionar usuário:', error);
            showAlert('Erro', 'Erro ao adicionar usuário: ' + error.message);
            return;
        }

        showAlert('Sucesso', 'Usuário adicionado com sucesso!');
        
        
        document.getElementById('usuarioNome').value = '';
        document.getElementById('usuarioEmail').value = '';
        document.getElementById('usuarioSenha').value = '';
        document.getElementById('usuarioConfirmarSenha').value = '';
        document.querySelectorAll('input[type="checkbox"][id^="perm-"]').forEach(checkbox => {
            checkbox.checked = checkbox.id === 'perm-inicio';
        });

        
        fetchAndRenderUsuarios();

    } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        showAlert('Erro', 'Erro ao adicionar usuário: ' + error.message);
    }
}


function filtrarUsuarios() {
    const filtroNome = document.getElementById('filtroNomeUsuario').value.toLowerCase();
    const filtroEmail = document.getElementById('filtroEmailUsuario').value.toLowerCase();

    usuariosFiltrados = todosUsuarios.filter(usuario => {
        const nomeMatch = usuario.nome.toLowerCase().includes(filtroNome);
        const emailMatch = usuario.email.toLowerCase().includes(filtroEmail);
        return nomeMatch && emailMatch;
    });

    renderUsuarios();
}

// Função para limpar filtros
function limparFiltrosUsuarios() {
    document.getElementById('filtroNomeUsuario').value = '';
    document.getElementById('filtroEmailUsuario').value = '';
    usuariosFiltrados = [...todosUsuarios];
    renderUsuarios();
}

async function salvarEdicaoUsuario(usuarioId) {
    const nome = document.getElementById('usuarioNome').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const senha = document.getElementById('usuarioSenha').value;
    const confirmarSenha = document.getElementById('usuarioConfirmarSenha').value;
     const setor = document.getElementById('usuarioSetor').value;

    
    if (!nome || !email) {
        showAlert('Erro', 'Nome e email são obrigatórios.');
        return;
    }

    if (senha && senha !== confirmarSenha) {
        showAlert('Erro', 'As senhas não coincidem.');
        return;
    }

    if (senha && senha.length < 6) {
        showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Erro', 'Por favor, insira um email válido.');
        return;
    }

   
    const permissoes = [];
    document.querySelectorAll('input[type="checkbox"][id^="perm-"]:checked').forEach(checkbox => {
        permissoes.push(checkbox.value);
    });

    if (permissoes.length === 0) {
        showAlert('Erro', 'Selecione pelo menos uma permissão.');
        return;
    }

    try {
        
        const { data: existingUser, error: checkError } = await releaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .neq('id', usuarioId);

        if (existingUser && existingUser.length > 0) {
            showAlert('Erro', 'Já existe outro usuário com este email.');
            return;
        }

        
        const updateData = {
            nome: nome,
            email: email,
            permissoes: permissoes,
            setor: setor
        };

        
        if (senha) {
            updateData.senha = senha;
        }

        
        console.log('Update usuário:', updateData);
        console.log('Dados de atualização para Supabase:', updateData);
        const { error } = await releaseClient
            .from('usuarios')
            .update(updateData)
            .eq('id', usuarioId);

        if (error) {
            console.error('Erro ao atualizar usuário no Supabase:', error);
            showAlert('Erro', 'Erro ao atualizar usuário: ' + error.message);
            return;
        }

        console.log('Usuário atualizado com sucesso no Supabase!');

        showAlert('Sucesso', 'Usuário atualizado com sucesso!');
        
       
        document.getElementById('usuarioNome').value = '';
        document.getElementById('usuarioEmail').value = '';
        document.getElementById('usuarioSenha').value = '';
        document.getElementById('usuarioConfirmarSenha').value = '';
        document.querySelectorAll('input[type="checkbox"][id^="perm-"]').forEach(checkbox => {
            checkbox.checked = checkbox.id === 'perm-inicio';
        });

        
        const botaoSalvar = document.querySelector('button[onclick^="salvarEdicaoUsuario"]');
        botaoSalvar.innerHTML = '<i class="fas fa-user-plus" style="margin-right: 8px;"></i>Adicionar Usuário';
        botaoSalvar.setAttribute('onclick', 'adicionarUsuario()');

        
        fetchAndRenderUsuarios();

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showAlert('Erro', 'Erro ao atualizar usuário: ' + error.message);
    }
}

// ===== FUNÇÕES PARA CRIAR LOGIN DE CLIENTE =====

// Função para carregar clientes no select
async function carregarClientesNoSelect() {
    try {
        const { data: clientes, error } = await releaseClient
            .from('clients')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erro ao carregar clientes:', error);
            return;
        }

        const select = document.getElementById('clienteSelect');
        select.innerHTML = '<option value="">Selecione um cliente</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função para criar login de cliente
async function criarLoginCliente() {
    const clienteId = document.getElementById('clienteSelect').value;
    const email = document.getElementById('clienteLoginEmail').value.trim();
    const senha = document.getElementById('clienteLoginSenha').value;
    const confirmarSenha = document.getElementById('clienteLoginConfirmarSenha').value;

    // Validações
    if (!clienteId) {
        showAlert('Erro', 'Por favor, selecione um cliente.');
        return;
    }

    if (!email || !senha || !confirmarSenha) {
        showAlert('Erro', 'Todos os campos são obrigatórios.');
        return;
    }

    if (senha !== confirmarSenha) {
        showAlert('Erro', 'As senhas não coincidem.');
        return;
    }

    if (senha.length < 6) {
        showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Erro', 'Por favor, insira um email válido.');
        return;
    }

    // Coletar permissões selecionadas para o cliente
    const permissoes = [];
    document.querySelectorAll('input[type="checkbox"][id^="cliente-perm-"]:checked').forEach(checkbox => {
        permissoes.push(checkbox.value);
    });

    console.log('Permissões coletadas:', permissoes); // Debug

    if (permissoes.length === 0) {
        showAlert('Erro', 'Selecione pelo menos uma permissão para o cliente.');
        return;
    }

    try {
        
        const { data: existingUser, error: checkError } = await releaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            showAlert('Erro', 'Já existe um usuário com este email.');
            return;
        }

        
        const { data: cliente, error: clientError } = await releaseClient
            .from('clients')
            .select('name')
            .eq('id', clienteId)
            .single();

        if (clientError) {
            console.error('Erro ao buscar cliente:', clientError);
            showAlert('Erro', 'Erro ao buscar dados do cliente.');
            return;
        }

        // Criar usuário com client_id
        const novoUsuario = {
            nome: `Cliente - ${cliente.name}`,
            email: email,
            senha: senha,
            permissoes: permissoes,
            client_id: parseInt(clienteId),
            user_type: 'client'
        };

        const { data, error } = await releaseClient
            .from('usuarios')
            .insert([novoUsuario])
            .select();

        if (error) {
            console.error('Erro ao criar login de cliente:', error);
            showAlert('Erro', 'Erro ao criar login de cliente: ' + error.message);
            return;
        }

        showAlert('Sucesso', 'Login de cliente criado com sucesso!');

        // Limpar formulário
        document.getElementById('clienteSelect').value = '';
        document.getElementById('clienteLoginEmail').value = '';
        document.getElementById('clienteLoginSenha').value = '';
        document.getElementById('clienteLoginConfirmarSenha').value = '';
        document.querySelectorAll('input[type="checkbox"][id^="cliente-perm-"]').forEach(checkbox => {
            checkbox.checked = checkbox.id === 'cliente-perm-inicio';
        });

        // Recarregar lista de usuários
        fetchAndRenderUsuarios();

    } catch (error) {
        console.error('Erro ao criar login de cliente:', error);
        showAlert('Erro', 'Erro ao criar login de cliente: ' + error.message);
    }
}

// Carregar clientes quando a aba de gerenciar logins for aberta
const originalShowTabFunction = window.showTab;
window.showTab = function(tabId) {
    if (originalShowTabFunction) {
        originalShowTabFunction(tabId);
    }
    
    if (tabId === 'gerenciar-logins') {
        fetchAndRenderUsuarios();
        carregarClientesNoSelect();
    }
};


function hasAccessToClient(clientId) {
    const userType = localStorage.getItem('user_type');
    const userClientId = localStorage.getItem('user_client_id');
    
   
    if (userType === 'internal') {
        return true;
    }
    
    // Utilizadores cliente veem apenas o seu próprio cliente
    if (userType === 'client') {
        return parseInt(userClientId) === parseInt(clientId);
    }
    
    return false;
}


function filterClientsByUserType(clients) {
    const userType = localStorage.getItem('user_type');
    const userClientId = localStorage.getItem('user_client_id');
    
    // Utilizadores internos veem todos
    if (userType === 'internal') {
        return clients;
    }
    
    // Utilizadores cliente veem apenas o seu
    if (userType === 'client' && userClientId) {
        return clients.filter(client => client.id === parseInt(userClientId));
    }
    
    return [];
}

// Interface Personalizada por Tipo de Utilizador
function customizeInterfaceByUserType() {
    const userType = localStorage.getItem('user_type');
    const clientName = localStorage.getItem('client_name');
    
    if (userType === 'client') {
        // Personalizar título
        document.title = `Portal ${clientName}`;
        
        // Adicionar logo do cliente no header
        const header = document.querySelector('.header');
        if (header && localStorage.getItem('client_logo')) {
            const logo = document.createElement('img');
            logo.src = localStorage.getItem('client_logo');
            logo.style.height = '40px';
            logo.style.marginRight = '10px';
            header.prepend(logo);
        }
        
        // Esconder opções não relevantes para clientes
        hideElementsForClientUser();
        
        // Mostrar mensagem de boas-vindas personalizada
        showClientWelcomeMessage(clientName);
    }
}

function hideElementsForClientUser() {
    // Esconder botões de adicionar/editar/excluir clientes
    const addClientBtn = document.querySelector('[onclick="openAddClientModal()"]');
    if (addClientBtn) addClientBtn.style.display = 'none';
    
    // Esconder filtros de grupo (não fazem sentido para cliente individual)
    const groupFilter = document.getElementById('filterClientGroup');
    if (groupFilter) groupFilter.closest('.form-group').style.display = 'none';
    
    // Esconder gestão de utilizadores
    const userManagementBtn = document.querySelector('[onclick="showUserManagement()"]');
    if (userManagementBtn) userManagementBtn.style.display = 'none';
}

function showClientWelcomeMessage(clientName) {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.innerHTML = `\n        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">\n            <h3 style="color: #1976d2; margin: 0;">Bem-vindo ao Portal ${clientName}</h3>\n            <p style="margin: 5px 0 0 0; color: #666;">Aqui pode consultar as informações da sua empresa</p>\n        </div>\n    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(welcomeDiv, mainContent.firstChild);
    }
}


// Variável global para armazenar usuários
let usuarios = [];

// Função para buscar e renderizar usuários
async function fetchAndRenderUsuarios() {
    try {
        const { data, error } = await releaseClient
            .from('usuarios')
            .select('*')
            .order('nome');

        if (error) {
            throw error;
        }

        usuarios = data || [];
        renderUsuarios(usuarios);

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        const tbody = document.getElementById('usuariosTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #f44336;">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                    Erro ao carregar usuários
                </td>
            </tr>
        `;
    }
}

// Função para renderizar usuários na tabela
function renderUsuarios(usuariosParaRender) {
    const tbody = document.getElementById('usuariosTableBody');
    
    if (usuariosParaRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-users" style="margin-right: 8px;"></i>
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        return;
    }

    console.log(usuariosParaRender);
    tbody.innerHTML = usuariosParaRender.map(usuario => {
        return `
            <tr>
                <td style="padding: 15px;">${usuario.nome || 'N/A'}</td>
                <td style="padding: 15px;">${usuario.email || 'N/A'}</td>
                <td style="padding: 15px;">${usuario.setor || 'N/A'}</td>
                <td style="padding: 15px; text-align: center;">
                    <span style="background: #4fc3f7; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">
                        ${(usuario.permissoes || []).length} permissões
                    </span>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <button onclick="editarUsuario('${usuario.id}')" style="background: #4fc3f7; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="excluirUsuario('${usuario.id}')" style="background: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Função para filtrar usuários
function filtrarUsuarios() {
    const filtroNome = document.getElementById('filtroNomeUsuario').value.toLowerCase();
    const filtroEmail = document.getElementById('filtroEmailUsuario').value.toLowerCase();
    
    const usuariosFiltrados = usuarios.filter(usuario => {
        const nomeMatch = !filtroNome || (usuario.nome || '').toLowerCase().includes(filtroNome);
        const emailMatch = !filtroEmail || (usuario.email || '').toLowerCase().includes(filtroEmail);
        return nomeMatch && emailMatch;
    });
    
    renderUsuarios(usuariosFiltrados);
}

// Função para limpar filtros
function limparFiltrosUsuarios() {
    document.getElementById('filtroNomeUsuario').value = '';
    document.getElementById('filtroEmailUsuario').value = '';
    renderUsuarios(usuarios);
}



// Função para excluir usuário
async function excluirUsuario(userId) {
    // Buscar o usuário na lista para obter o nome
    const usuario = usuarios.find(u => u.id === userId);
    const nomeUsuario = usuario ? usuario.nome : 'usuário';
    
    const confirmed = await showConfirm(
        'Confirmar Exclusão', 
        `Tem certeza que deseja excluir o usuário "${nomeUsuario}"? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmed) {
        return;
    }

    try {
        const { error } = await releaseClient
            .from('usuarios')
            .delete()
            .eq('id', userId);

        if (error) {
            throw error;
        }

        showAlert('Sucesso', 'Usuário excluído com sucesso!');
        fetchAndRenderUsuarios();

    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        showAlert('Erro', 'Erro ao excluir usuário: ' + error.message);
    }
}

// Função para adicionar usuário (já existente, mas vou melhorar)
async function adicionarUsuario() {
    const nome = document.getElementById('usuarioNome').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const senha = document.getElementById('usuarioSenha').value;
    const confirmarSenha = document.getElementById('usuarioConfirmarSenha').value;
    const setor = document.getElementById('usuarioSetor').value;

    // Validações
    if (!nome || !email || !senha || !confirmarSenha) {
        showAlert('Erro', 'Todos os campos são obrigatórios.');
        return;
    }

    if (senha !== confirmarSenha) {
        showAlert('Erro', 'As senhas não coincidem.');
        return;
    }

    // Coletar permissões selecionadas
    const permissoesSelecionadas = [];
    document.querySelectorAll('.permissions-grid input[type="checkbox"]:checked').forEach(checkbox => {
        permissoesSelecionadas.push(checkbox.value);
    });

    try {
        // Verificar se o email já existe
        const { data: existingUser } = await releaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            showAlert('Erro', 'Já existe um usuário com este email.');
            return;
        }

        // Inserir novo usuário
        const { error } = await releaseClient
            .from('usuarios')
            .insert([{
                nome: nome,
                email: email,
                senha: senha,
                setor: setor,
                permissoes: permissoesSelecionadas
            }]);

        if (error) {
            throw error;
        }

        showAlert('Sucesso', 'Usuário adicionado com sucesso!');
        
        // Limpar formulário
        document.getElementById('usuarioNome').value = '';
        document.getElementById('usuarioEmail').value = '';
        document.getElementById('usuarioSenha').value = '';
        document.getElementById('usuarioConfirmarSenha').value = '';
        document.getElementById('usuarioSetor').value = '';
        
        // Desmarcar todas as permissões
        document.querySelectorAll('.permissions-grid input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id !== 'perm-inicio') { // Manter início marcado
                checkbox.checked = false;
                checkbox.closest('.permission-item').classList.remove('checked');
            }
        });

        fetchAndRenderUsuarios();

    } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        showAlert('Erro', 'Erro ao adicionar usuário: ' + error.message);
    }
}

// Função para criar login de cliente
async function criarLoginCliente() {
    const clienteId = document.getElementById('clienteSelect').value;
    const email = document.getElementById('clienteLoginEmail').value.trim();
    const senha = document.getElementById('clienteLoginSenha').value;
    const confirmarSenha = document.getElementById('clienteLoginConfirmarSenha').value;

    // Validações
    if (!clienteId || !email || !senha || !confirmarSenha) {
        showAlert('Erro', 'Todos os campos são obrigatórios.');
        return;
    }

    if (senha !== confirmarSenha) {
        showAlert('Erro', 'As senhas não coincidem.');
        return;
    }

    // Coletar permissões selecionadas para cliente
    const permissoesSelecionadas = [];
    document.querySelectorAll('.client-permissions-grid input[type="checkbox"]:checked').forEach(checkbox => {
        permissoesSelecionadas.push(checkbox.value);
    });

    try {
        // Verificar se o email já existe
        const { data: existingUser } = await releaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            showAlert('Erro', 'Já existe um usuário com este email.');
            return;
        }

        // Buscar nome do cliente
        const cliente = clients.find(c => c.id == clienteId);
        const nomeCliente = cliente ? cliente.name : `Cliente ${clienteId}`;

        // Inserir novo usuário cliente
        const { error } = await releaseClient
            .from('usuarios')
            .insert([{
                nome: nomeCliente,
                email: email,
                senha: senha,
                setor: 'Cliente',
                permissoes: permissoesSelecionadas,
                client_id: parseInt(clienteId),
                user_type: 'client'
            }]);

        if (error) {
            throw error;
        }

        showAlert('Sucesso', 'Login de cliente criado com sucesso!');
        
        // Limpar formulário
        document.getElementById('clienteSelect').value = '';
        document.getElementById('clienteLoginEmail').value = '';
        document.getElementById('clienteLoginSenha').value = '';
        document.getElementById('clienteLoginConfirmarSenha').value = '';
        
        // Desmarcar permissões de cliente
        document.querySelectorAll('.client-permissions-grid input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id !== 'cliente-perm-inicio-cliente') {
                checkbox.checked = false;
                checkbox.closest('.client-permission-item').classList.remove('checked');
            }
        });

        fetchAndRenderUsuarios();

    } catch (error) {
        console.error('Erro ao criar login de cliente:', error);
        showAlert('Erro', 'Erro ao criar login de cliente: ' + error.message);
    }
}

// Carregar clientes no select quando a aba for aberta
function populateClientSelect() {
    const select = document.getElementById('clienteSelect');
    if (!select || !clients) return;
    
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
    });
}


// Função para carregar permissões no modal de edição
function carregarPermissoesEdicao(permissoesUsuario) {
    console.log('carregarPermissoesEdicao chamada com:', permissoesUsuario);
    
    // Tentar encontrar o container de permissões correto
    let container = document.getElementById('editPermissoesContainer');
    if (!container) {
        console.log('editPermissoesContainer não encontrado, tentando grids...');
        container = document.getElementById('editarPermissoesGrid2');
        if (!container) {
            container = document.getElementById('editarPermissoesGrid1');
        }
    }
    
    console.log('Container encontrado:', container);
    
    if (!container) {
        console.error('Nenhum container de permissões encontrado!');
        return;
    }
    
    // Lista de todas as permissões disponíveis
    const todasPermissoes = [
        // Permissões básicas
        { id: 'inicio', label: 'Início', checked: true },
        { id: 'painel-setor', label: 'Painel do Setor' },
        { id: 'dashboard', label: 'Dashboards' },
        { id: 'clients', label: 'Clientes' },
        { id: 'homologacao', label: 'Homologação' },
        { id: 'https://tryvia.github.io/TryviaBI/mapa_visitas.html', label: 'Visitas' },
        { id: 'https://tryvia.github.io/TryviaBI/calendario.html', label: 'Calendário' },
        { id: 'https://tryvia.github.io/TryviaBI/linha%20do%20tempo.html', label: 'MVP' },
        { id: 'https://tryvia.github.io/TryviaBI/implanta%C3%A7%C3%A3o.html', label: 'Implantações' },
        { id: 'release', label: 'Release' },
        { id: 'reunioes', label: 'Reuniões' },
        { id: 'relatorioVisita', label: 'Relatório de Visita' },
        { id: 'documents', label: 'Time de Implantação' },
        { id: 'evaluations', label: 'Avaliações' },
        { id: 'gestao', label: 'Gestão' },
        { id: 'gerenciar-logins', label: 'Gerenciar Logins' },
        
        // Funções específicas
        { id: 'saveClient', label: 'Salvar Cliente', categoria: 'Clientes' },
        { id: 'editClient', label: 'Editar Cliente', categoria: 'Clientes' },
        { id: 'updateClient', label: 'Atualizar Cliente', categoria: 'Clientes' },
        { id: 'deleteClient', label: 'Excluir Cliente', categoria: 'Clientes' },
        { id: 'addClientDocument', label: 'Adicionar Documento do Cliente', categoria: 'Clientes' },
        { id: 'deleteClientDocument', label: 'Excluir Documento do Cliente', categoria: 'Clientes' },
        { id: 'addProduct', label: 'Adicionar Produto', categoria: 'Clientes' },
        { id: 'removeProduct', label: 'Remover Produto', categoria: 'Clientes' },
        { id: 'addEditProduct', label: 'Adicionar/Editar Produto', categoria: 'Clientes' },
        { id: 'addIntegration', label: 'Adicionar Integração', categoria: 'Clientes' },
        { id: 'addEditIntegration', label: 'Adicionar/Editar Integração', categoria: 'Clientes' },
        { id: 'removeIntegration', label: 'Remover Integração', categoria: 'Clientes' },
        
        { id: 'addDocument', label: 'Adicionar Documento do time', categoria: 'Documentos' },
        { id: 'deleteDocument', label: 'Excluir Documento do time', categoria: 'Documentos' },
        
        { id: 'submitHomologacao', label: 'Adicionar homologação', categoria: 'Homologação' },
        { id: 'deleteHomologacao', label: 'Excluir Homologação', categoria: 'Homologação' },
        
        { id: 'salvarRelease', label: 'Salvar Release', categoria: 'Releases' },
        { id: 'deleteRelease', label: 'Excluir Release', categoria: 'Releases' },
        
        { id: 'salvarReuniao', label: 'Salvar Reunião', categoria: 'Reuniões' },
        
        { id: 'alterarQuantidade', label: 'Alterar Quantidade nas tarefas', categoria: 'Painel do Setor' },
        { id: 'saveTasks', label: 'Salvar Tarefas', categoria: 'Painel do Setor' },
        { id: 'abrirModalTarefa', label: 'Adicionar Tarefa', categoria: 'Painel do Setor' },
        { id: 'abrirModalMembro', label: 'Adicionar Membro do Time', categoria: 'Painel do Setor' },
        { id: 'abrirModalProjeto', label: 'Adicionar Projeto', categoria: 'Painel do Setor' },
        { id: 'abrirModalVisita', label: 'Adicionar Visita', categoria: 'Painel do Setor' },
        { id: 'abrirModalEntrega', label: 'Adicionar Entrega', categoria: 'Painel do Setor' },
        { id: 'saveTask', label: 'Salvar Tarefa', categoria: 'Painel do Setor' },
        { id: 'saveProject', label: 'Salvar Projeto', categoria: 'Painel do Setor' },
        { id: 'excluirProjeto', label: 'Excluir Projeto', categoria: 'Painel do Setor' }
    ];

    let html = '';
    let categoriaAtual = '';

    todasPermissoes.forEach(permissao => {
        // Adicionar título da categoria se mudou
        if (permissao.categoria && permissao.categoria !== categoriaAtual) {
            categoriaAtual = permissao.categoria;
            html += `<div class="subsection-title">Funções de ${categoriaAtual}</div>`;
        }

        const isChecked = permissoesUsuario.includes(permissao.id) || permissao.checked;
        const checkedClass = isChecked ? 'checked' : '';
        
        html += `
            <div class="permission-item ${checkedClass}">
                <input type="checkbox" id="edit-perm-${permissao.id}" value="${permissao.id}" ${isChecked ? 'checked' : ''}>
                <label for="edit-perm-${permissao.id}">${permissao.label}</label>
            </div>
        `;
    });

    console.log('HTML gerado:', html);
    container.innerHTML = html;
    console.log('HTML definido no container');
    console.log('Container após definir HTML:', container);
    console.log('Container style display:', container.style.display);
    console.log('Container offsetHeight:', container.offsetHeight);
    console.log('Container offsetWidth:', container.offsetWidth);
    
    // Forçar visibilidade do container
    container.style.display = 'grid';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    
    console.log('Forçando visibilidade do container...');
    console.log('Container após forçar visibilidade - offsetHeight:', container.offsetHeight);
    console.log('Container após forçar visibilidade - offsetWidth:', container.offsetWidth);

    // Adicionar event listeners para os checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.closest('.permission-item');
            if (this.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        });
    });
}



// Função para salvar as alterações do usuário
async function salvarEdicaoUsuario(event) {
    event.preventDefault();

    const userId = document.getElementById('editarIdUsuario2').value;
    const nome = document.getElementById('editarNomeUsuario2').value.trim();
    const email = document.getElementById('editarEmailUsuario2').value.trim();
    const novaSenha = document.getElementById('editarSenhaUsuario2').value;
    const confirmarSenha = document.getElementById('editarConfirmarSenhaUsuario2').value;
    const setor = document.getElementById('editarSetorUsuario2').value;

    // Validações
    if (!nome || !email) {
        showAlert('Erro', 'Nome e email são obrigatórios.');
        return;
    }

    if (novaSenha && novaSenha !== confirmarSenha) {
        showAlert('Erro', 'As senhas não coincidem.');
        return;
    }

    // Coletar permissões selecionadas
    const permissoesSelecionadas = [];
    document.querySelectorAll('#editarPermissoesGrid2 input[type="checkbox"]:checked').forEach(checkbox => {
        permissoesSelecionadas.push(checkbox.value);
    });

    try {
        // Preparar dados para atualização
        const dadosAtualizacao = {
            nome: nome,
            email: email,
            setor: setor,
            permissoes: permissoesSelecionadas
        };

        // Adicionar senha apenas se foi fornecida
        if (novaSenha) {
            dadosAtualizacao.senha = novaSenha;
        }

        // Atualizar no banco de dados
        const { error } = await releaseClient
            .from('usuarios')
            .update(dadosAtualizacao)
            .eq('id', userId);

        if (error) {
            throw error;
        }

        showAlert('Sucesso', 'Usuário atualizado com sucesso!');
        closeEditarUsuarioModal();
        fetchAndRenderUsuarios(); // Recarregar lista de usuários

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showAlert('Erro', 'Erro ao atualizar usuário: ' + error.message);
    }
}

// Adicionar event listener para o formulário de edição
const formEditarUsuario2 = document.getElementById('formEditarUsuario2');
if (formEditarUsuario2) {
    formEditarUsuario2.addEventListener('submit', salvarEdicaoUsuario);
}

// Event listeners para permissões
document.addEventListener('DOMContentLoaded', function() {
    // Permissões de usuário interno
    document.querySelectorAll('.permissions-grid .permission-item').forEach(item => {
        item.addEventListener('click', function() {
            const checkbox = this.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.disabled) {
                checkbox.checked = !checkbox.checked;
                if (checkbox.checked) {
                    this.classList.add('checked');
                } else {
                    this.classList.remove('checked');
                }
            }
        });
    });

    // Permissões de cliente
    document.querySelectorAll('.client-permissions-grid .client-permission-item').forEach(item => {
        item.addEventListener('click', function() {
            const checkbox = this.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.disabled) {
                checkbox.checked = !checkbox.checked;
                if (checkbox.checked) {
                    this.classList.add('checked');
                } else {
                    this.classList.remove('checked');
                }
            }
        });
    });
});

// ===== FUNCIONALIDADES DE TREINAMENTO =====

let currentProduct = 'sing';
let trainingVideos = {
    sing: [],
    telemetria: [],
    etrip: [],
    optz: [],
    portal: []
};

// Dados dos produtos (carregados do banco)
let trainingProducts = [];

// Função para carregar produtos do Supabase
async function loadTrainingProducts() {
    try {
        const { data, error } = await releaseClient
            .from('training_products')
            .select('*')
            .order('name');
            
        if (error) {
            console.error('Erro ao carregar produtos:', error);
            return;
        }
        
        trainingProducts = data || [];
        renderProductsList();
        
        // Selecionar primeiro produto se existir
        if (trainingProducts.length > 0) {
            selectTrainingProduct(trainingProducts[0].id);
        }
    } catch (error) {
        console.error('Erro ao conectar com Supabase:', error);
    }
}

// Função para renderizar lista de produtos
function renderProductsList() {
    const productsList = document.getElementById('productsList');
    
    if (trainingProducts.length === 0) {
        productsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-box" style="font-size: 2em; margin-bottom: 10px;"></i>
                <p>Nenhum produto cadastrado</p>
                <p>Clique em "Adicionar Produto" para começar</p>
            </div>
        `;
        return;
    }
    
    productsList.innerHTML = trainingProducts.map((product, index) => `
        <div class="product-item-training ${index === 0 ? 'active' : ''}" data-product="${product.id}" style="background: ${index === 0 ? '#4fc3f7' : 'white'}; color: ${index === 0 ? 'white' : '#333'}; padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center;">
            <i class="${product.icon}" style="margin-right: 10px; font-size: 1.2em;"></i>
            <span style="font-weight: bold;">${product.name}</span>
        </div>
    `).join('');
}

// Função para alternar entre produtos
function selectTrainingProduct(productId) {
    currentProduct = productId;
    
    // Encontrar produto atual
    const product = trainingProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Atualizar visual dos produtos
    document.querySelectorAll('.product-item-training').forEach(item => {
        item.classList.remove('active');
        item.style.background = 'white';
        item.style.color = '#333';
        
        if (item.dataset.product == productId) {
            item.classList.add('active');
            item.style.background = '#4fc3f7';
            item.style.color = 'white';
        }
    });
    
    // Atualizar título
    document.getElementById('currentProductTitle').innerHTML = 
        `<i class="${product.icon}" style="margin-right: 10px;"></i>Treinamentos - ${product.name}`;
    
    // Carregar vídeos do produto
    loadTrainingVideos(productId);
}

// Função para carregar vídeos do produto do Supabase
async function loadTrainingVideos(productId) {
    const videosList = document.getElementById('videosList');
    
    try {
        const { data, error } = await releaseClient
            .from('training_videos')
            .select('*')
            .eq('product_id', productId)
            .order('order_index', { ascending: true });
            
        if (error) {
            console.error('Erro ao carregar vídeos:', error);
            videosList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #f44336;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <p style="font-size: 1.2em;">Erro ao carregar vídeos</p>
                    <p>Tente novamente mais tarde</p>
                </div>
            `;
            return;
        }
        
        const videos = data || [];
        
        if (videos.length === 0) {
            videosList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-video" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <p style="font-size: 1.2em;">Nenhum vídeo encontrado para este produto</p>
                    <p>Clique em "Adicionar Vídeo" para começar</p>
                </div>
            `;
            return;
        }
        
        videosList.innerHTML = videos.map(video => `
            <div class="video-card" onclick="playTrainingVideo(${video.id})">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    <span class="video-level ${video.level}">${video.level.charAt(0).toUpperCase() + video.level.slice(1)}</span>
                    <span>${video.duration} min</span>
                </div>
                <div class="video-description">${video.description}</div>
                <div class="video-actions">
                    <button class="video-action-btn play-btn" onclick="event.stopPropagation(); playTrainingVideo(${video.id})">
                        <i class="fas fa-play"></i> Reproduzir
                    </button>
                    <button class="video-action-btn edit-btn" onclick="event.stopPropagation(); editTrainingVideo(${video.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="video-action-btn delete-video-btn" onclick="event.stopPropagation(); deleteTrainingVideo(${video.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao conectar com Supabase:', error);
        videosList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f44336;">
                <i class="fas fa-wifi" style="font-size: 3em; margin-bottom: 15px;"></i>
                <p style="font-size: 1.2em;">Erro de conexão</p>
                <p>Verifique sua conexão com a internet</p>
            </div>
        `;
    }
}

// Função para reproduzir vídeo
async function playTrainingVideo(videoId) {
    try {
        const { data, error } = await releaseClient
            .from('training_videos')
            .select('*')
            .eq('id', videoId)
            .single();
            
        if (error || !data) {
            console.error('Erro ao carregar vídeo:', error);
            return;
        }
        
        const video = data;
        
        // Remover classe playing de todos os cards
        document.querySelectorAll('.video-card').forEach(card => {
            card.classList.remove('playing');
        });
        
        // Adicionar classe playing ao card atual
        const cardAtual = document.querySelector(`.video-card[data-video-id="${videoId}"]`);
if (cardAtual) {
    cardAtual.classList.add('playing');
}
        
        // Atualizar player
        const playerContainer = document.getElementById('videoPlayerContainer');
        
        if (video.video_url) {
            // Se for YouTube ou Vimeo, usar embed
            if (/youtube\.com|youtu\.be/.test(video.video_url)) {
                // Extrai o ID do vídeo do YouTube
                let youtubeId = '';
                const match = video.video_url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/);
                if (match) youtubeId = match[1];
                if (!youtubeId) {
                    // Tenta pegar do youtu.be
                    const match2 = video.video_url.match(/youtu\.be\/([\w-]{11})/);
                    if (match2) youtubeId = match2[1];
                }
                if (youtubeId) {
                    playerContainer.innerHTML = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`;
                } else {
                    playerContainer.innerHTML = `<div style='color:red'>Link do YouTube inválido.</div>`;
                }
            } else if (/vimeo\.com/.test(video.video_url)) {
                // Extrai o ID do vídeo do Vimeo
                const match = video.video_url.match(/vimeo\.com\/(\d+)/);
                const vimeoId = match ? match[1] : '';
                if (vimeoId) {
                    playerContainer.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;
                } else {
                    playerContainer.innerHTML = `<div style='color:red'>Link do Vimeo inválido.</div>`;
                }
            } else if (/drive\.google\.com/.test(video.video_url)) {
                // Suporte para Google Drive
                // Extrai o ID do arquivo
                const match = video.video_url.match(/\/d\/([\w-]+)\/|id=([\w-]+)/);
                const fileId = match ? (match[1] || match[2]) : '';
                if (fileId) {
                    // Link embed do Google Drive
                    playerContainer.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" width="100%" height="400" allow="autoplay"></iframe>`;
                } else {
                    playerContainer.innerHTML = `<div style='color:red'>Link do Google Drive inválido.</div>`;
                }
            } else {
                // Link direto para arquivo de vídeo
                playerContainer.innerHTML = `
                    <video controls style="width: 100%; height: 100%; border-radius: 10px;" src="${video.video_url}">
                        Seu navegador não suporta o elemento de vídeo.
                    </video>
                `;
            }
        } else if (video.video_path) {
            // Vídeo do Supabase Storage
            const supabaseUrl = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '';
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${video.video_path}`;
            playerContainer.innerHTML = `
                <video controls style="width: 100%; height: 100%; border-radius: 10px;" src="${publicUrl}">
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            `;
        } else {
            // Placeholder se não há vídeo
            playerContainer.innerHTML = `
                <div style="text-align: center; color: white; padding: 40px;">
                    <i class="fas fa-play-circle" style="font-size: 4em; margin-bottom: 15px;"></i>
                    <h3 style="margin-bottom: 10px;">${video.title}</h3>
                    <p style="opacity: 0.8;">Duração: ${video.duration} minutos</p>
                    <p style="opacity: 0.6; font-size: 0.9em;">Vídeo não disponível</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao reproduzir vídeo:', error);
    }
}

// Função para mostrar modal de adicionar produto
function showAddProductModal() {
    if (!permissoes || !permissoes.includes('addProduct')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar produtos.');
        return;
    }
    document.getElementById('addProductModal').classList.add('visible');
}

// Função para fechar modal de adicionar produto
function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('visible');
    document.getElementById('addProductForm').reset();
}

// Função para adicionar produto
async function addTrainingProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('productNameTreinamento').value.trim();
    const icon = document.getElementById('productIcon').value;
    const description = document.getElementById('productDescription').value.trim();
    
    if (!name || !icon) {
        showAlert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    try {
        const { data, error } = await releaseClient
            .from('training_products')
            .insert([{
                name: name,
                icon: icon,
                description: description
            }])
            .select()
            .single();
            
        if (error) {
            console.error('Erro ao adicionar produto:', error);
            showAlert('Erro', 'Erro ao adicionar produto. Tente novamente.');
            return;
        }
        
        // Recarregar lista de produtos
        await loadTrainingProducts();
        closeAddProductModal();
        showAlert('Sucesso', 'Produto adicionado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao conectar com Supabase:', error);
        showAlert('Erro', 'Erro de conexão. Verifique sua internet.');
    }
}

// Função para mostrar modal de adicionar vídeo
function showAddVideoModal() {
    if (!permissoes || !permissoes.includes('showAddVideoModal')) {
        showAlert('Atenção', 'Você não tem permissão para adicionar vídeos.');
        return;
    }
    if (!currentProduct) {
        showAlert('Aviso', 'Selecione um produto primeiro.');
        return;
    }
    const modal = document.getElementById('addVideoModal');
    if (modal) {
        modal.style.display = 'flex';
        // Garantir que o formulário está limpo
        const form = document.getElementById('addVideoForm');
        if (form) {
            form.reset();
        }
    }
}

// Função para fechar modal de adicionar vídeo
function closeAddVideoModal() {
    document.getElementById('addVideoModal').style.display = 'none';
    document.getElementById('addVideoForm').reset();
    // Resetar área de upload
    const uploadArea = document.querySelector('#addVideoModal .upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="upload-icon">🎥</div>
            <p>Clique para selecionar o arquivo de vídeo</p>
            <small>Formatos suportados: MP4, AVI, MOV (máx. 500MB)</small>
            <input type="file" id="videoFile" style="display: none;" accept="video/*" required>
        `;
    }
}

// Função para adicionar vídeo
async function addTrainingVideo(event) {
    event.preventDefault();
    
    const title = document.getElementById('videoTitle')?.value?.trim();
    const description = document.getElementById('videoDescription')?.value?.trim();
    const level = document.getElementById('videoLevel')?.value;
    const duration = document.getElementById('videoDuration')?.value;
    const fileInput = document.getElementById('videoFile');
    const videoUrl = document.getElementById('videoUrl')?.value?.trim();

    // Exige pelo menos um dos dois: arquivo OU URL (ou ambos)
    if (!title || !level || !duration || (!fileInput?.files[0] && !videoUrl)) {
        showAlert('Erro', 'Preencha todos os campos obrigatórios e selecione um arquivo ou informe uma URL.');
        return;
    }
    // Permite envio de arquivo, URL ou ambos

    if (!currentProduct) {
        showAlert('Erro', 'Nenhum produto selecionado.');
        return;
    }

    let file = fileInput?.files[0];
    let videoUrlToSave = videoUrl;
    let videoPathToSave = null;
    let originalText = '';
let submitBtn = null;

    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;

        let urlData = null;
        if (file) {
            // Gerar nome único para o arquivo
            const fileExtension = file.name.split('.').pop();
            const fileName = `training-videos/${currentProduct}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
            // Upload do arquivo para Supabase Storage
            const { data: uploadData, error: uploadError } = await releaseClient.storage
                .from('training-videos')
                .upload(fileName, file);
            if (uploadError) {
                console.error('Erro no upload:', uploadError);
                showAlert('Erro', 'Erro ao fazer upload do vídeo. Tente novamente.');
                return;
            }
            // Obter URL pública do arquivo
            urlData = supabase.storage
                .from('training-videos')
                .getPublicUrl(fileName);
            videoUrlToSave = urlData.data.publicUrl;
            videoPathToSave = fileName;
        }

        // Obter próximo order_index
        const { data: maxOrderData } = await releaseClient
            .from('training_videos')
            .select('order_index')
            .eq('product_id', currentProduct)
            .order('order_index', { ascending: false })
            .limit(1);

        const nextOrderIndex = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].order_index + 1 : 1;

        // Inserir registro no banco
        const { data, error } = await releaseClient
            .from('training_videos')
            .insert([{
                product_id: currentProduct,
                title: title,
                description: description,
                video_url: videoUrlToSave,
                video_path: videoPathToSave,
                duration: parseInt(duration),
                level: level,
                order_index: nextOrderIndex
            }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao salvar vídeo:', error);
            // Remover arquivo do storage se falhou ao salvar no banco
            if (videoPathToSave) {
                await releaseClient.storage.from('training-videos').remove([videoPathToSave]);
            }
            showAlert('Erro', 'Erro ao salvar informações do vídeo. Tente novamente.');
            return;
        }

        // Recarregar lista de vídeos
        await loadTrainingVideos(currentProduct);
        closeAddVideoModal();
        showAlert('Sucesso', 'Vídeo adicionado com sucesso!');

    } catch (error) {
        console.error('Erro ao adicionar vídeo:', error);
        showAlert('Erro', 'Erro inesperado. Tente novamente.');
    } finally {
        // Restaurar botão
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Função para editar vídeo
function editTrainingVideo(videoId) {
    showAlert('Informação', 'Funcionalidade de edição será implementada em breve.');
}

// Função para excluir vídeo
async function deleteTrainingVideo(videoId) {
    if (!permissoes || !permissoes.includes('deleteTrainingVideo')) {
        showAlert('Atenção', 'Você não tem permissão para excluir vídeos.');
        return;
    }
    if (!confirm('Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        // Buscar informações do vídeo para obter o caminho do arquivo
        const { data: videoData, error: fetchError } = await releaseClient
            .from('training_videos')
            .select('video_path')
            .eq('id', videoId)
            .single();
            
        if (fetchError) {
            console.error('Erro ao buscar vídeo:', fetchError);
            showAlert('Erro', 'Erro ao buscar informações do vídeo.');
            return;
        }
        
        // Excluir registro do banco
        const { error: deleteError } = await releaseClient
            .from('training_videos')
            .delete()
            .eq('id', videoId);
            
        if (deleteError) {
            console.error('Erro ao excluir vídeo:', deleteError);
            showAlert('Erro', 'Erro ao excluir vídeo do banco de dados.');
            return;
        }
        
        // Excluir arquivo do storage
        if (videoData.video_path) {
            const { error: storageError } = await releaseClient.storage
                .from('training-videos')
                .remove([videoData.video_path]);
                
            if (storageError) {
                console.error('Erro ao excluir arquivo:', storageError);
                // Não mostrar erro para o usuário pois o registro já foi excluído
            }
        }
        
        // Recarregar lista de vídeos
        await loadTrainingVideos(currentProduct);
        showAlert('Sucesso', 'Vídeo excluído com sucesso!');
        
        // Limpar player se estava reproduzindo este vídeo
        const playerContainer = document.getElementById('videoPlayerContainer');
        playerContainer.innerHTML = `
            <div style="text-align: center; color: #666;">
                <i class="fas fa-play-circle" style="font-size: 4em; margin-bottom: 15px;"></i>
                <p style="font-size: 1.2em;">Selecione um vídeo para reproduzir</p>
            </div>
        `;
        
    } catch (error) {
        console.error('Erro ao excluir vídeo:', error);
        showAlert('Erro', 'Erro inesperado ao excluir vídeo.');
    }
}

// Event listeners e inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar produtos iniciais
    loadTrainingProducts();
    
    // Form de adicionar produto
    document.getElementById('addProductForm').addEventListener('submit', addTrainingProduct);
    
    // Form de adicionar vídeo
    const addVideoForm = document.getElementById('addVideoForm');
    if (addVideoForm) {
        addVideoForm.addEventListener('submit', addTrainingVideo);
    }
    
    // Event listener para cliques nos produtos (delegação de eventos)
    document.getElementById('productsList').addEventListener('click', function(e) {
        const productItem = e.target.closest('.product-item-training');
        if (productItem && productItem.dataset.product) {
            selectTrainingProduct(parseInt(productItem.dataset.product));
        }
    });
});

// Atualizar área de upload quando arquivo é selecionado
document.addEventListener('change', function(e) {
    if (e.target.id === 'videoFile') {
        const file = e.target.files[0];
        const uploadArea = e.target.parentElement;
        
        if (file) {
            uploadArea.innerHTML = `
                <div class="upload-icon">✅</div>
                <p><strong>Arquivo selecionado:</strong></p>
                <p>${file.name}</p>
                <small>Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                <input type="file" id="videoFile" style="display: none;" accept="video/*">
            `;
        }
    }
});

// Variáveis globais para gerenciamento de logins
let todosLoginsUsuarios = [];
let loginsFiltrados = [];
let usuarioEditandoLogin = null;


// Função para carregar usuários para gerenciamento de logins
async function carregarLoginsUsuarios() {
    try {
        const { data: usuarios, error } = await releaseClient
            .from('usuarios')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar usuários:', error);
            showAlert('Erro', 'Erro ao carregar usuários: ' + error.message);
            return;
        }

        todosLoginsUsuarios = usuarios || [];
        loginsFiltrados = [...todosLoginsUsuarios];
        renderLoginsUsuarios();
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        showAlert('Erro', 'Erro ao carregar usuários: ' + error.message);
    }
}

// Função para renderizar a tabela de usuários
function renderLoginsUsuarios() {
    const tbody = document.getElementById('loginsTableBody');
    
    if (loginsFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-users" style="margin-right: 8px;"></i>
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = loginsFiltrados.map(usuario => {
        const permissoesBadges = usuario.permissoes.map(perm => {
            const permissaoInfo = permissoesDisponiveis.find(p => p.value === perm);
            const label = permissaoInfo ? permissaoInfo.label : perm;
            return `<span class="permission-badge">${label}</span>`;
        }).join('');

        return `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px; font-weight: bold;">${usuario.nome}</td>
            <td style="padding: 15px;">${usuario.email}</td>
            <td style="padding: 15px;">${usuario.setor || 'Não informado'}</td>
            <td style="padding: 15px; text-align: center;">
                <div style="max-width: 300px;">
                    ${permissoesBadges}
                </div>
            </td>
            <td style="padding: 15px; text-align: center;">
                <button onclick="abrirModalEditarLogin(${usuario.id})" style="background: #4fc3f7; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin-right: 5px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Função para filtrar usuários
function filtrarLoginsUsuarios() {
    const filtroEmail = document.getElementById('filtroEmailLogin').value.toLowerCase();
    const filtroNome = document.getElementById('filtroNomeLogin').value.toLowerCase();

    loginsFiltrados = todosLoginsUsuarios.filter(usuario => {
        const emailMatch = usuario.email.toLowerCase().includes(filtroEmail);
        const nomeMatch = usuario.nome.toLowerCase().includes(filtroNome);
        return emailMatch && nomeMatch;
    });

    renderLoginsUsuarios();
}

// Função para limpar filtros
function limparFiltrosLogins() {
    document.getElementById('filtroEmailLogin').value = '';
    document.getElementById('filtroNomeLogin').value = '';
    loginsFiltrados = [...todosLoginsUsuarios];
    renderLoginsUsuarios();
}

// Função para abrir modal de edição
function abrirModalEditarLogin(usuarioId) {
    usuarioEditandoLogin = todosLoginsUsuarios.find(u => u.id === usuarioId);
    
    if (!usuarioEditandoLogin) {
        showAlert('Erro', 'Usuário não encontrado.');
        return;
    }

    // Preencher campos do formulário
    document.getElementById('editLoginNome').value = usuarioEditandoLogin.nome;
    document.getElementById('editLoginEmail').value = usuarioEditandoLogin.email;
    document.getElementById('editLoginSetor').value = usuarioEditandoLogin.setor || 'Comercial';
    document.getElementById('editLoginSenha').value = '';

    // Carregar permissões
    carregarPermissoesEdicaoLogin();

    // Mostrar modal
    document.getElementById('modalEditarLogin').style.display = 'flex';
}

// Função para carregar permissões no modal de edição
function carregarPermissoesEdicaoLogin() {
    const container = document.getElementById('editPermissoesContainer');
    if (!container || !usuarioEditandoLogin || !Array.isArray(usuarioEditandoLogin.permissoes)) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = permissoesDisponiveis.map(permissao => {
        const isChecked = usuarioEditandoLogin.permissoes.includes(permissao.value);
        return `
            <div class="permission-item">
                <input type="checkbox" id="edit-perm-${permissao.value}" value="${permissao.value}" ${isChecked ? 'checked' : ''}>
                <label for="edit-perm-${permissao.value}">${permissao.label}</label>
            </div>
        `;
    }).join('');
}

// Função para fechar modal de edição
function fecharModalEditarLogin() {
    document.getElementById('modalEditarLogin').style.display = 'none';
    usuarioEditandoLogin = null;
}

// Função para salvar alterações do usuário
async function salvarAlteracoesLogin(event) {
    event.preventDefault();

    if (!usuarioEditandoLogin) {
        showAlert('Erro', 'Nenhum usuário selecionado para edição.');
        return;
    }

    const nome = document.getElementById('editLoginNome').value.trim();
    const setor = document.getElementById('editLoginSetor').value;
    const novaSenha = document.getElementById('editLoginSenha').value;

    // Validações
    if (!nome) {
        showAlert('Erro', 'O nome é obrigatório.');
        return;
    }

    // Coletar permissões selecionadas
    const permissoes = [];
    document.querySelectorAll('#editPermissoesContainer input[type="checkbox"]:checked').forEach(checkbox => {
        permissoes.push(checkbox.value);
    });

    if (permissoes.length === 0) {
        showAlert('Erro', 'Selecione pelo menos uma permissão.');
        return;
    }

    try {
        // Preparar dados para atualização
        const dadosAtualizacao = {
            nome: nome,
            setor: setor,
            permissoes: permissoes
        };

        // Incluir senha apenas se foi fornecida
        if (novaSenha && novaSenha.trim() !== '') {
            if (novaSenha.length < 6) {
                showAlert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
                return;
            }
            dadosAtualizacao.senha = novaSenha;
        }

        // Atualizar no Supabase
        const { data, error } = await releaseClient
            .from('usuarios')
            .update(dadosAtualizacao)
            .eq('id', usuarioEditandoLogin.id)
            .select();

        if (error) {
            console.error('Erro ao atualizar usuário:', error);
            showAlert('Erro', 'Erro ao atualizar usuário: ' + error.message);
            return;
        }

        showAlert('Sucesso', 'Usuário atualizado com sucesso!');
        fecharModalEditarLogin();
        carregarLoginsUsuarios(); // Recarregar lista

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showAlert('Erro', 'Erro ao atualizar usuário: ' + error.message);
    }
}

// Event listener para o formulário de edição
document.addEventListener('DOMContentLoaded', function() {
    const formEditarLogin = document.getElementById('formEditarLogin');
    if (formEditarLogin) {
        formEditarLogin.addEventListener('submit', salvarAlteracoesLogin);
    }
    
    // Adicionar event listener para o formulário de implantação
    const formImplantacao = document.getElementById('implantacaoForm');
    if (formImplantacao) {
        formImplantacao.addEventListener('submit', salvarImplantacao);
    }
    
    // Adicionar event listener para o novo formulário de implantação
    const novaFormImplantacao = document.getElementById('novaImplantacaoForm');
    if (novaFormImplantacao) {
        novaFormImplantacao.addEventListener('submit', salvarNovaImplantacao);
    }
});

// Função para carregar dados quando a aba for aberta
function inicializarGerenciarLogins() {
    carregarLoginsUsuarios();
}

// Funções para o modal de implantação
function abrirModalImplantacao() {
    const modal = document.getElementById('implantacaoModal');
    if (modal) {
        modal.style.display = 'block';
        // Definir data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('implantacaoData').value = hoje;
    }
}

function fecharModalImplantacao() {
    const modal = document.getElementById('implantacaoModal');
    if (modal) {
        modal.style.display = 'none';
        // Limpar formulário
        document.getElementById('implantacaoForm').reset();
    }
}

// Fechar modal ao clicar fora dele
window.addEventListener('click', function(event) {
    const modal = document.getElementById('implantacaoModal');
    if (event.target === modal) {
        fecharModalImplantacao();
    }
});

async function salvarImplantacao(event) {
    event.preventDefault();
    
    const especialista = document.getElementById('implantacaoEspecialista').value.trim();
    const data = document.getElementById('implantacaoData').value;
    const cliente = document.getElementById('implantacaoCliente').value.trim();
    const projeto = document.getElementById('implantacaoProjeto').value.trim();
    const tipo = document.getElementById('implantacaoTipo').value;
    const tickets = parseInt(document.getElementById('implantacaoTickets').value) || 0;
    const resumo = document.getElementById('implantacaoResumo').value.trim();
    
    if (!especialista || !data || !cliente || !projeto || !tipo || !resumo) {
        showAlert('Atenção', 'Preencha todos os campos obrigatórios!');
        return;
    }
    
    // Desabilitar botão durante o salvamento
    const btnSalvar = document.querySelector('.btn-salvar-implantacao');
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Salvando...';
    
    try {
        const { data: result, error } = await releaseClient
            .from('status_projetos')
            .insert([
                {
                    especialista: especialista,
                    data: data,
                    cliente: cliente,
                    projeto: projeto,
                    tipo: tipo,
                    tickets_pendentes: tickets,
                    resumo: resumo,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error('Erro ao salvar implantação:', error.message);
            showAlert('Erro', 'Erro ao salvar implantação: ' + error.message);
            return;
        }

        showAlert('Sucesso', 'Implantação salva com sucesso!');
        fecharModalImplantacao();
        
        // Aqui você pode adicionar código para atualizar a lista de implantações se necessário
        // carregarImplantacoes();
        
    } catch (e) {
        console.error('Erro inesperado ao salvar implantação:', e);
        showAlert('Erro', 'Erro inesperado ao salvar implantação.');
    } finally {
        // Reabilitar botão
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = textoOriginal;
    }
}

// Função para salvar nova implantação (da nova tela)
async function salvarNovaImplantacao(event) {
    event.preventDefault();
    
    const especialista = document.getElementById('novaImplantacaoEspecialista').value.trim();
    const data = document.getElementById('novaImplantacaoData').value;
    const dataInicio = document.getElementById('novaImplantacaoInicio').value;
    const dataTermino = document.getElementById('novaImplantacaoTermino').value;
    const cliente = document.getElementById('novaImplantacaoCliente').value; // Agora é um select
    const projeto = document.getElementById('novaImplantacaoProjeto').value.trim();
    const tipo = document.getElementById('novaImplantacaoTipo').value;
    const tickets = parseInt(document.getElementById('novaImplantacaoTickets').value) || 0;
    const resumo = document.getElementById('novaImplantacaoResumo').value.trim();
    
    if (!especialista || !data || !cliente || !projeto || !tipo || !resumo) {
        showAlert('Atenção', 'Preencha todos os campos obrigatórios!');
        return;
    }
    
    // Desabilitar botão durante o salvamento
    const btnSalvar = document.querySelector('#novaImplantacaoForm .btn-salvar-implantacao');
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.disabled = true;
    
    const isEdicao = implantacaoEditando !== null;
    
    if (isEdicao) {
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Atualizando...';
    } else {
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Salvando...';
    }
    
    try {
        // Verificar se o cliente Supabase está disponível
        if (!window.supabaseClient) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        const dadosImplantacao = {
            especialista: especialista,
            data: data,
            data_inicio: dataInicio || null,
            data_termino: dataTermino || null,
            cliente: cliente,
            projeto: projeto,
            tipo: tipo,
            tickets_pendentes: tickets,
            resumo: resumo,
            setor: sessionStorage.getItem('setor') || 'default'
        };
        
        let result, error;
        
        if (isEdicao) {
            // Atualizar implantação existente
            const response = await window.supabaseClient
                .from('status_projetos')
                .update(dadosImplantacao)
                .eq('id', implantacaoEditando.id);
            
            result = response.data;
            error = response.error;
        } else {
            // Criar nova implantação
            dadosImplantacao.created_at = new Date().toISOString();
            
            const response = await window.supabaseClient
                .from('status_projetos')
                .insert([dadosImplantacao]);
            
            result = response.data;
            error = response.error;
        }

        if (error) {
            console.error('Erro ao salvar implantação:', error);
            const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
            showAlert('Erro', 'Erro ao salvar implantação: ' + errorMessage);
            return;
        }

        if (isEdicao) {
            showAlert('Sucesso', 'Implantação atualizada com sucesso!');
            // Cancelar edição
            cancelarEdicao();
        } else {
            showAlert('Sucesso', 'Implantação salva com sucesso!');
            // Limpar formulário
            document.getElementById('novaImplantacaoForm').reset();
            // Definir data atual novamente após limpar o formulário
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('novaImplantacaoData').value = hoje;
        }
        
        // Recarregar lista de implantações
        carregarImplantacoesLista();
        
    } catch (e) {
        console.error('Erro inesperado ao salvar implantação:', e);
        showAlert('Erro', 'Erro inesperado: ' + e.message);
    } finally {
        // Reabilitar botão
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = textoOriginal;
    }
}

// Função para inicializar a nova tela de implantação
function inicializarNovaImplantacao() {
    // Definir data atual como padrão
    const hoje = new Date().toISOString().split('T')[0];
    const dataInput = document.getElementById('novaImplantacaoData');
    if (dataInput) {
        dataInput.value = hoje;
    }
    
    // Popular select de clientes
    popularClientesNovaImplantacao();
    
    // Carregar lista de implantações
    carregarImplantacoesLista();
}

// Função para popular o select de clientes na nova implantação
function popularClientesNovaImplantacao() {
    const select = document.getElementById('novaImplantacaoCliente');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    if (!window.clients || !Array.isArray(window.clients)) {
        // Se não há clientes carregados, tentar carregar
        if (typeof fetchAndRenderClients === 'function') {
            fetchAndRenderClients().then(() => {
                popularClientesNovaImplantacao();
            });
        }
        return;
    }
    
    window.clients.forEach(cliente => {
        select.innerHTML += `<option value="${cliente.name}">${cliente.name}</option>`;
    });
}

// Variável global para armazenar todas as implantações
let todasImplantacoes = [];

// Função para carregar implantações do Supabase
async function carregarImplantacoesLista() {
    const container = document.getElementById('implantacoesContainer');
    const loading = document.getElementById('loadingImplantacoes');
    
    if (loading) loading.style.display = 'block';
    
    try {
        if (!window.supabaseClient) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        const { data, error } = await window.supabaseClient
            .from('status_projetos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao carregar implantações:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #f44336;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 15px;"></i>
                    <p>Erro ao carregar implantações: ${error.message || 'Erro desconhecido'}</p>
                </div>
            `;
            return;
        }

        todasImplantacoes = data || [];
        
        // Atualizar filtros com dados únicos
        atualizarFiltros();
        
        // Renderizar implantações
        renderizarImplantacoes(todasImplantacoes);
        
    } catch (e) {
        console.error('Erro inesperado ao carregar implantações:', e);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f44336;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 15px;"></i>
                <p>Erro inesperado: ${e.message}</p>
            </div>
        `;
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// Função para atualizar os filtros com dados únicos
function atualizarFiltros() {
    const especialistas = [...new Set(todasImplantacoes.map(imp => imp.especialista))].sort();
    const clientes = [...new Set(todasImplantacoes.map(imp => imp.cliente))].sort();
    
    // Atualizar filtro de especialistas
    const filtroEspecialista = document.getElementById('filtroEspecialista');
    if (filtroEspecialista) {
        const valorAtual = filtroEspecialista.value;
        filtroEspecialista.innerHTML = '<option value="">Todos os especialistas</option>';
        especialistas.forEach(esp => {
            filtroEspecialista.innerHTML += `<option value="${esp}" ${valorAtual === esp ? 'selected' : ''}>${esp}</option>`;
        });
    }
    
    // Atualizar filtro de clientes
    const filtroCliente = document.getElementById('filtroCliente');
    if (filtroCliente) {
        const valorAtual = filtroCliente.value;
        filtroCliente.innerHTML = '<option value="">Todos os clientes</option>';
        clientes.forEach(cli => {
            filtroCliente.innerHTML += `<option value="${cli}" ${valorAtual === cli ? 'selected' : ''}>${cli}</option>`;
        });
    }
}

// Função para renderizar as implantações
function renderizarImplantacoes(implantacoes) {
    const container = document.getElementById('implantacoesContainer');
    
    if (!implantacoes || implantacoes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 3em; margin-bottom: 20px; color: #ddd;"></i>
                <h3 style="color: #999; margin-bottom: 10px;">Nenhuma implantação encontrada</h3>
                <p style="color: #666;">Cadastre uma nova implantação usando o formulário acima.</p>
            </div>
        `;
        return;
    }
    
    const html = implantacoes.map(implantacao => {
        // Corrigir problema de fuso horário na exibição da data
        let dataFormatada;
        if (implantacao.data) {
            if (implantacao.data.includes('-') && implantacao.data.length === 10) {
                // Se a data já está no formato YYYY-MM-DD, criar Date sem problemas de fuso horário
                const [ano, mes, dia] = implantacao.data.split('-');
                const date = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses
                dataFormatada = date.toLocaleDateString('pt-BR');
            } else {
                dataFormatada = new Date(implantacao.data).toLocaleDateString('pt-BR');
            }
        } else {
            dataFormatada = 'Data não informada';
        }
        
        const criadoEm = formatDateTimeForDisplay(implantacao.created_at);
        
        return `
            <div style="
                background-color: rgba(179, 229, 252, 0.95); 
                border-radius: 15px; 
                padding: 25px; 
                margin-bottom: 20px; 
                box-shadow: 0 4px 15px rgba(41, 182, 246, 0.2); 
                border-left: 5px solid #4fc3f7;
                overflow: hidden;
                word-wrap: break-word;
                word-break: break-word;
                max-width: 100%;
            ">
                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start; 
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                    gap: 10px;
                ">
                    <div style="flex: 1; min-width: 0; margin-right: 10px;">
                        <h4 style="
                            color: #4fc3f7; 
                            margin: 0 0 5px 0; 
                            font-size: 1.3em;
                            word-wrap: break-word;
                            word-break: break-word;
                            overflow-wrap: break-word;
                        ">
                            <i class="fas fa-cogs" style="margin-right: 10px;"></i>
                            ${implantacao.projeto}
                        </h4>
                        <p style="
                            color: #666; 
                            margin: 0; 
                            font-size: 0.9em;
                            word-wrap: break-word;
                            word-break: break-word;
                        ">Cliente: <strong>${implantacao.cliente}</strong></p>
                    </div>
                    <div style="flex-shrink: 0;">
                        <span style="
                            background-color: #4fc3f7; 
                            color: white; 
                            padding: 5px 12px; 
                            border-radius: 20px; 
                            font-size: 0.8em; 
                            font-weight: bold;
                            white-space: nowrap;
                        ">
                            ${implantacao.tipo}
                        </span>
                    </div>
                </div>
                
                <div style="
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
                    gap: 15px; 
                    margin-bottom: 15px;
                ">
                    <div style="min-width: 0;">
                        <strong style="color: #4fc3f7;">Especialista:</strong><br>
                        <span style="
                            color: #333;
                            word-wrap: break-word;
                            word-break: break-word;
                        ">${implantacao.especialista}</span>
                    </div>
                    <div style="min-width: 0;">
                        <strong style="color: #4fc3f7;">Data de Atualização:</strong><br>
                        <span style="color: #333;">${dataFormatada}</span>
                    </div>
                    <div style="min-width: 0;">
                        <strong style="color: #4fc3f7;">Data de Início:</strong><br>
                        <span style="color: #333;">${formatDateOnlyBR(implantacao.data_inicio)}</span>
                    </div>
                    <div style="min-width: 0;">
                        <strong style="color: #4fc3f7;">Data de Término:</strong><br>
                        <span style="color: #333;">${formatDateOnlyBR(implantacao.data_termino)}</span>
                    </div>
                    <div style="min-width: 0;">
                        <strong style="color: #4fc3f7;">Tickets Pendentes:</strong><br>
                        <span style="color: #333; font-weight: bold;">${implantacao.tickets_pendentes || 0}</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong style="color: #4fc3f7;">Resumo:</strong><br>
                    <p style="
                        color: #333; 
                        margin: 5px 0 0 0; 
                        line-height: 1.5;
                        word-wrap: break-word;
                        word-break: break-word;
                        overflow-wrap: break-word;
                        white-space: pre-wrap;
                        max-width: 100%;
                    ">${implantacao.resumo}</p>
                </div>
                
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid rgba(79, 195, 247, 0.2);
                    padding-top: 15px;
                    margin-top: 15px;
                    flex-wrap: wrap;
                    gap: 10px;
                ">
                    <div style="
                        font-size: 0.8em; 
                        color: #888;
                    ">
                        <i class="fas fa-calendar" style="margin-right: 5px;"></i>
                        Cadastrado em: ${criadoEm}
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                        <button onclick="editarImplantacao('${implantacao.id}')" style="
                            background-color: #ff9800; 
                            color: white; 
                            border: none; 
                            padding: 8px 15px; 
                            border-radius: 6px; 
                            cursor: pointer; 
                            font-size: 0.8em;
                            font-weight: bold;
                            transition: background-color 0.3s ease;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        " onmouseover="this.style.backgroundColor='#f57c00'" onmouseout="this.style.backgroundColor='#ff9800'">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                                               <button onclick="excluirImplantacao("${implantacao.id}", "${implantacao.projeto}", "${implantacao.cliente}")" style="
                            background-color: #f44336; 
                            color: white; 
                            border: none; 
                            padding: 8px 15px; 
                            border-radius: 6px; 
                            cursor: pointer; 
                            font-size: 0.8em;
                            font-weight: bold;
                            transition: background-color 0.3s ease;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        " onmouseover="this.style.backgroundColor='#d32f2f'" onmouseout="this.style.backgroundColor='#f44336'">
                            <i class="fas fa-trash"></i>
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Função para filtrar implantações
function filtrarImplantacoes() {
    const filtroEspecialista = document.getElementById('filtroEspecialista').value;
    const filtroCliente = document.getElementById('filtroCliente').value;
    const filtroTipo = document.getElementById('filtroTipo').value;
    
    let implantacoesFiltradas = todasImplantacoes.filter(implantacao => {
        const matchEspecialista = !filtroEspecialista || implantacao.especialista === filtroEspecialista;
        const matchCliente = !filtroCliente || implantacao.cliente === filtroCliente;
        const matchTipo = !filtroTipo || implantacao.tipo === filtroTipo;
        
        return matchEspecialista && matchCliente && matchTipo;
    });
    
    renderizarImplantacoes(implantacoesFiltradas);
}

// Função para limpar filtros
function limparFiltros() {
    document.getElementById('filtroEspecialista').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroTipo').value = '';
    
    renderizarImplantacoes(todasImplantacoes);
}

// Função para excluir implantação
async function excluirImplantacao(id, projeto, cliente) {
    // Confirmar exclusão
    const confirmacao = confirm(`Tem certeza que deseja excluir a implantação "${projeto}" do cliente "${cliente}"?\n\nEsta ação não pode ser desfeita.`);
    
    if (!confirmacao) {
        return;
    }
    
    try {
        if (!window.supabaseClient) {
            throw new Error('Cliente Supabase não inicializado');
        }
        
        const { error } = await window.supabaseClient
            .from('status_projetos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir implantação:', error);
            const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
            showAlert('Erro', 'Erro ao excluir implantação: ' + errorMessage);
            return;
        }

        showAlert('Sucesso', 'Implantação excluída com sucesso!');
        
        // Recarregar lista de implantações
        carregarImplantacoesLista();
        
    } catch (e) {
        console.error('Erro inesperado ao excluir implantação:', e);
        showAlert('Erro', 'Erro inesperado: ' + e.message);
    }
}

// Variável global para controlar se está editando
let implantacaoEditando = null;

// Função para editar implantação
function editarImplantacao(id) {
    // Encontrar a implantação na lista
    const implantacao = todasImplantacoes.find(imp => imp.id === id);
    
    if (!implantacao) {
        showAlert('Erro', 'Implantação não encontrada');
        return;
    }
    
    // Preencher o formulário com os dados da implantação
    document.getElementById('novaImplantacaoEspecialista').value = implantacao.especialista;
    
    // Corrigir problema de fuso horário na data
    let dataCorrigida = implantacao.data;
    if (implantacao.data) {
        // Se a data vier no formato YYYY-MM-DD, usar diretamente
        if (implantacao.data.includes('-') && implantacao.data.length === 10) {
            dataCorrigida = implantacao.data;
        } else {
            // Se vier como timestamp ou outro formato, converter considerando fuso horário local
            const date = new Date(implantacao.data);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            dataCorrigida = localDate.toISOString().split('T')[0];
        }
    }
    document.getElementById('novaImplantacaoData').value = dataCorrigida;
    
    // Preencher datas de início e término usando as funções auxiliares
    document.getElementById("novaImplantacaoInicio").value = formatDateForInput(implantacao.data_inicio);
    document.getElementById("novaImplantacaoTermino").value = formatDateForInput(implantacao.data_termino);
    
    document.getElementById('novaImplantacaoCliente').value = implantacao.cliente;
    document.getElementById('novaImplantacaoProjeto').value = implantacao.projeto;
    document.getElementById('novaImplantacaoTipo').value = implantacao.tipo;
    document.getElementById('novaImplantacaoTickets').value = implantacao.tickets_pendentes || 0;
    document.getElementById('novaImplantacaoResumo').value = implantacao.resumo;
    
    // Definir que está editando
    implantacaoEditando = implantacao;
    
    // Alterar o texto do botão para "Atualizar"
    const btnSalvar = document.querySelector('#novaImplantacaoForm .btn-salvar-implantacao');
    btnSalvar.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i>Atualizar Implantação';
    btnSalvar.style.backgroundColor = '#ff9800';
    
    // Mostrar botão Cancelar
    const btnCancelar = document.getElementById('btnCancelarEdicao');
    btnCancelar.style.display = 'block';
    
    // Rolar para o topo do formulário
    document.getElementById('novaImplantacaoForm').scrollIntoView({ behavior: 'smooth' });
    
    showAlert('Info', `Editando implantação "${implantacao.projeto}". Faça as alterações e clique em "Atualizar Implantação".`);
}

// Função para cancelar edição
function cancelarEdicao() {
    implantacaoEditando = null;
    
    // Limpar formulário
    document.getElementById('novaImplantacaoForm').reset();
    
    // Restaurar botão
    const btnSalvar = document.querySelector('#novaImplantacaoForm .btn-salvar-implantacao');
    btnSalvar.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i>Salvar Implantação';
    btnSalvar.style.backgroundColor = '#4fc3f7';
    
    // Ocultar botão Cancelar
    const btnCancelar = document.getElementById('btnCancelarEdicao');
    btnCancelar.style.display = 'none';
    
    // Definir data atual novamente
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('novaImplantacaoData').value = hoje;
    
    showAlert('Info', 'Edição concluida. Formulário limpo para nova implantação.');
}

// Variável global para armazenar o ID da reunião sendo editada
let reuniaoEditandoId = null;

// Função para abrir o modal de editar reunião
async function abrirModalEditarReuniao(reuniaoId) {
    try {
        console.log('[abrirModalEditarReuniao] reuniaoId:', reuniaoId);
        // Buscar dados da reunião
        const { data: reuniao, error } = await releaseClient
            .from('reunioes')
            .select('*')
            .eq('id', reuniaoId)
            .single();

        if (error) {
            console.error('Erro ao buscar reunião:', error);
            showAlert('Erro', 'Erro ao carregar dados da reunião.');
            return;
        }

        // Armazenar ID da reunião sendo editada
        reuniaoEditandoId = reuniaoId;

        // Popular os campos do modal
        const clienteInput = document.getElementById('editReuniaoCliente');
        const dataInput = document.getElementById('editReuniaoData');
        const horarioInput = document.getElementById('editReuniaoHorario');
        const tipoInput = document.getElementById('editReuniaoTipo');
        const responsavelInput = document.getElementById('editReuniaoResponsavel');
        const participantesInput = document.getElementById('editReuniaoParticipantes');
        const modal = document.getElementById('modalEditarReuniao');

        if (!clienteInput || !dataInput || !horarioInput || !tipoInput || !responsavelInput || !participantesInput || !modal) {
            console.error('[abrirModalEditarReuniao] Algum elemento do modal não foi encontrado:', {
                clienteInput, dataInput, horarioInput, tipoInput, responsavelInput, participantesInput, modal
            });
            showAlert('Erro', 'Erro ao encontrar campos do modal.');
            return;
        }

        clienteInput.value = reuniao.client_id || '';
        dataInput.value = reuniao.data || '';
        horarioInput.value = reuniao.horario || '';
        tipoInput.value = reuniao.tipo || '';
        responsavelInput.value = reuniao.responsavel || '';
        participantesInput.value = reuniao.participantes || '';

        // Popular dropdowns
        try {
            populateEditReuniaoClientes();
        } catch (e) {
            console.error('[abrirModalEditarReuniao] Erro em populateEditReuniaoClientes:', e);
        }
        try {
            populateEditReuniaoResponsaveis();
        } catch (e) {
            console.error('[abrirModalEditarReuniao] Erro em populateEditReuniaoResponsaveis:', e);
        }

        // Mostrar modal
        modal.style.display = 'block';
        modal.classList.add('visible');
        console.log('[abrirModalEditarReuniao] Modal exibido');
    } catch (error) {
        console.error('Erro inesperado:', error);
        showAlert('Erro', 'Erro inesperado ao abrir modal de edição.');
    }
}

// Função para fechar o modal de editar reunião
function fecharModalEditarReuniao() {
    const modal = document.getElementById('modalEditarReuniao');
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); 
    reuniaoEditandoId = null;
    document.getElementById('formEditarReuniao').reset();
}

// Função para popular clientes no modal de edição
function populateEditReuniaoClientes() {
    const select = document.getElementById('editReuniaoCliente');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um cliente...</option>';
  if (!window.clients || !Array.isArray(window.clients)) return;
  const sortedClients = [...window.clients].sort((a, b) => a.name.localeCompare(b.name));
  sortedClients.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

// Função para popular responsáveis no modal de edição
function populateEditReuniaoResponsaveis() {
    const responsaveis = [
        "Julyana",
        "Marlos", 
        "Renata",
        "Larissa",
    ];
    
    const select = document.getElementById('editReuniaoResponsavel');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um responsável...</option>';
    responsaveis.forEach(resp => {
        select.innerHTML += `<option value="${resp}">${resp}</option>`;
    });
}

// Função para salvar alterações da reunião
document.getElementById('formEditarReuniao').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!reuniaoEditandoId) {
        showAlert('Erro', 'ID da reunião não encontrado.');
        return;
    }

    const clientId = document.getElementById('editReuniaoCliente').value;
    const data = document.getElementById('editReuniaoData').value;
    const horario = document.getElementById('editReuniaoHorario').value;
    const tipo = document.getElementById('editReuniaoTipo').value;
    const responsavel = document.getElementById('editReuniaoResponsavel').value;
    const participantes = document.getElementById('editReuniaoParticipantes').value;
    const fileInput = document.getElementById('editReuniaoFile');

    if (!data || !tipo || !responsavel || !participantes) {
        showAlert('Atenção', 'Preencha todos os campos obrigatórios.');
        return;
    }

    try {
        let updateData = {
            client_id: clientId ? Number(clientId) : null,
            data: data,
            horario: horario,
            tipo: tipo,
            responsavel: responsavel,
            participantes: participantes
        };

        // Se um novo arquivo foi selecionado, fazer upload
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = `reuniao_${Date.now()}_${file.name}`;
            
            const { data: uploadData, error: uploadError } = await releaseClient.storage
                .from('reuniaofiles')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Erro no upload:', uploadError);
                showAlert('Erro', 'Erro ao fazer upload do arquivo.');
                return;
            }

            const { data: urlData } = releaseClient.storage
                .from('reuniaofiles')
                .getPublicUrl(fileName);

            updateData.file_url = urlData.publicUrl;
            updateData.file_path = fileName;
        }

        // Buscar nome do cliente se clientId foi fornecido
        if (clientId) {
            const clienteEncontrado = window.clients?.find(c => c.id == clientId);
            if (clienteEncontrado) {
                updateData.cliente = clienteEncontrado.name;
            }
        }

        // Atualizar reunião no banco
        const { error: updateError } = await releaseClient
            .from('reunioes')
            .update(updateData)
            .eq('id', reuniaoEditandoId);

        if (updateError) {
            console.error('Erro ao atualizar reunião:', updateError);
            showAlert('Erro', 'Erro ao atualizar reunião.');
            return;
        }

        showAlert('Sucesso', 'Reunião atualizada com sucesso!');
        fecharModalEditarReuniao();
        carregarReunioes(); // Recarregar lista de reuniões
    } catch (error) {
        console.error('Erro inesperado:', error);
        showAlert('Erro', 'Erro inesperado ao salvar alterações.');
    }
});

// Função para excluir reunião
async function excluirReuniao(reuniaoId) {
    const confirmacao = await showConfirm('Confirmação', 'Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.');
    
    if (!confirmacao) {
        return;
    }

    try {
        // Buscar dados da reunião para excluir arquivo se existir
        const { data: reuniao, error: fetchError } = await releaseClient
            .from('reunioes')
            .select('file_path')
            .eq('id', reuniaoId)
            .single();

        if (fetchError) {
            console.error('Erro ao buscar reunião:', fetchError);
        }

        // Excluir arquivo se existir
        if (reuniao && reuniao.file_path) {
            const { error: deleteFileError } = await releaseClient.storage
                .from('reuniaofiles')
                .remove([reuniao.file_path]);

            if (deleteFileError) {
                console.error('Erro ao excluir arquivo:', deleteFileError);
            }
        }

        // Excluir reunião do banco
        const { error: deleteError } = await releaseClient
            .from('reunioes')
            .delete()
            .eq('id', reuniaoId);

        if (deleteError) {
            console.error('Erro ao excluir reunião:', deleteError);
            showAlert('Erro', 'Erro ao excluir reunião.');
            return;
        }

        showAlert('Sucesso', 'Reunião excluída com sucesso!');
        carregarReunioes(); // Recarregar lista de reuniões
    } catch (error) {
        console.error('Erro inesperado:', error);
        showAlert('Erro', 'Erro inesperado ao excluir reunião.');
    }
}

// Fechar modal ao clicar fora dele
document.getElementById('modalEditarReuniao').addEventListener('click', function(e) {
    if (e.target === this) {
        fecharModalEditarReuniao();
    }
});

// ===== FUNÇÕES DO PAINEL DE TICKETS =====

// Variável global para armazenar todos os tickets
let allTicketsData = [];

// Função para carregar todos os tickets de todos os clientes
async function loadAllTickets() {
    const ticketsList = document.getElementById('allTicketsList');
    const resultCount = document.getElementById('ticketsResultCount');
    
    ticketsList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2em; margin-bottom: 20px;"></i>
            <p>Carregando todos os tickets...</p>
        </div>
    `;
    
    try {
        // Buscar todos os clientes primeiro
        const { data: clients, error: clientsError } = await releaseClient
            .from('clients')
            .select('*');
            
        if (clientsError) {
            throw new Error('Erro ao buscar clientes: ' + clientsError.message);
        }
        
        if (!clients || clients.length === 0) {
            ticketsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users" style="font-size: 3em; margin-bottom: 20px; color: #ccc;"></i>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Cadastre clientes primeiro para visualizar seus tickets.</p>
                </div>
            `;
            return;
        }
        
        // Carregar tickets para cada cliente
        allTicketsData = [];
        const ticketPromises = clients.map(async (client) => {
            if (!client.email) return [];
            
            try {
                const response = await fetch(`https://servis-tikctes.onrender.com/api/tickets/client-by-empresa?cf_empresa=${encodeURIComponent(client.name )}`);
                if (!response.ok) return [];
                
                const tickets = await response.json();
              return tickets.map(ticket => ({
    ...ticket,
    clientName: client.name,
    clientEmail: client.email,
    clientId: client.id,
    // AQUI ESTÁ A CORREÇÃO: acesse cf_empresa via custom_fields
    cfEmpresa: ticket.custom_fields.cf_empresa // ou a propriedade correta que você precisa
}));

            } catch (error) {
                console.error(`Erro ao buscar tickets para ${client.name}:`, error);
                return [];
            }
        });
        
        const ticketsArrays = await Promise.all(ticketPromises);
        allTicketsData = ticketsArrays.flat();
        
        // Atualizar métricas
        updateTicketsMetrics();
        
        // Atualizar filtro de clientes
        updateClientFilter(clients);
        
        // Renderizar tickets
        renderTickets(allTicketsData);
        
        resultCount.textContent = `${allTicketsData.length} tickets encontrados`;
        
    } catch (error) {
        console.error('Erro ao carregar tickets:', error);
        ticketsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 20px; color: #f44336;"></i>
                <h3>Erro ao carregar tickets</h3>
                <p>Não foi possível conectar com o serviço de tickets.</p>
                <p style="font-size: 0.9em; color: #666;">Erro: ${error.message}</p>
            </div>
        `;
        resultCount.textContent = 'Erro ao carregar';
    }
}

// Função para atualizar as métricas dos tickets
function updateTicketsMetrics() {
    const total = allTicketsData.length;
    const open = allTicketsData.filter(t => t.status === 2).length;
    const pending = allTicketsData.filter(t => t.status === 3).length;
    const resolved = allTicketsData.filter(t => t.status === 4).length;
    
    document.getElementById('totalTicketsCount').textContent = total;
    document.getElementById('openTicketsCount').textContent = open;
    document.getElementById('pendingTicketsCount').textContent = pending;
    document.getElementById('resolvedTicketsCount').textContent = resolved;
}

// Função para atualizar o filtro de clientes
function updateClientFilter(clients) {
    const select = document.getElementById('filterByClient');
    select.innerHTML = '<option value="">Todos os clientes</option>';
    
    clients.forEach(client => {
        select.innerHTML += `<option value="${client.email}">${client.name}</option>`;
    });
}

// Função para renderizar a lista de tickets
function renderTickets(tickets) {
    const ticketsList = document.getElementById('allTicketsList');
    const resultCount = document.getElementById('ticketsResultCount');
    
    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 3em; margin-bottom: 20px; color: #ccc;"></i>
                <h3>Nenhum ticket encontrado</h3>
                <p>Não há tickets que correspondam aos filtros selecionados.</p>
            </div>
        `;
        resultCount.textContent = '0 tickets encontrados';
        return;
    }
    
    // Ordenar tickets por data de criação (mais recentes primeiro)
    tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    ticketsList.innerHTML = tickets.map(ticket => {
        const statusClass = getTicketStatusClass(ticket.status);
        const statusText = getTicketStatusText(ticket.status);
        const priorityText = getTicketPriorityText(ticket.priority);
        const createdDate = formatDateTimeForDisplay(ticket.created_at);
        const updatedDate = formatDateTimeForDisplay(ticket.updated_at);
        
        return `
            <div class="ticket-item" style="margin-bottom: 15px;">
                <div class="ticket-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="ticket-id"><a href="https://suportetryvia.freshdesk.com/a/tickets/${ticket.id}" target="_blank">#${ticket.id}</a></span>
                        <span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">
                            ${ticket.clientName}
                        </span>
                    </div>
                    <span class="ticket-status ${statusClass}">${statusText}</span>
                </div>
                <div class="ticket-subject">${ticket.subject || 'Sem assunto'}</div>
                <div class="ticket-description">${ticket.description_text ? ticket.description_text.substring(0, 200) + '...' : 'Sem descrição'}</div>
                <div class="ticket-meta">
                    <strong>Criado:</strong> ${createdDate} | 
                    <strong>Atualizado:</strong> ${updatedDate} | 
                    <strong>Prioridade:</strong> ${priorityText} |
                    <strong>Cliente:</strong> ${ticket.clientEmail}
                </div>
            </div>
        `;
    }).join('');
    
    resultCount.textContent = `${tickets.length} tickets encontrados`;
}

// Função para filtrar tickets
function filterTickets() {
    const clientFilter = document.getElementById('filterByClient').value;
    const statusFilter = document.getElementById('filterByStatus').value;
    const priorityFilter = document.getElementById('filterByPriority').value;
    const periodFilter = document.getElementById('filterByPeriod').value;
    
    let filteredTickets = [...allTicketsData];
    
    // Filtrar por cliente
    if (clientFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.clientEmail === clientFilter);
    }
    
    // Filtrar por status
    if (statusFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status.toString() === statusFilter);
    }
    
    // Filtrar por prioridade
    if (priorityFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority.toString() === priorityFilter);
    }
    
    // Filtrar por período
    if (periodFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filteredTickets = filteredTickets.filter(ticket => {
            const ticketDate = new Date(ticket.created_at);
            
            switch (periodFilter) {
                case 'today':
                    return ticketDate >= today;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    return ticketDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    return ticketDate >= monthAgo;
                case 'quarter':
                    const quarterAgo = new Date(today);
                    quarterAgo.setMonth(today.getMonth() - 3);
                    return ticketDate >= quarterAgo;
                default:
                    return true;
            }
        });
    }
    
    renderTickets(filteredTickets);
}

// Função para atualizar todos os tickets
function refreshAllTickets() {
    loadAllTickets();
}
// Carregar tickets quando a aba for aberta
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar listener para quando a aba de tickets for aberta
    const originalShowTab = window.showTab;
    window.showTab = function(tabName) {
        originalShowTab(tabName);
        if (tabName === 'painel-tickets') {
            setTimeout(() => {
                loadAllTickets();
            }, 100);
        }
        // Carregar visitas quando a aba painel-set    window.showTab = function(tabName) {
        originalShowTab(tabName);
        if (tabName === 'painel-tickets') {
            setTimeout(() => {
                loadAllTickets();
            }, 100);
        }
        // Carregar visitas quando a aba painel-setor for aberta
        if (tabName === 'painel-setor') {
            setTimeout(() => {
                atualizarSecaoVisitas();
            }, 100);
        }
    };
});

// Configuração da API Supabase para visitas
const VISITAS_SUPABASE_URL = 'https://obwgegvrtxrlombmkaej.supabase.co';
const VISITAS_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2dlZ3ZydHhybG9tYm1rYWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NDcxOTMsImV4cCI6MjA2NDAyMzE5M30.0Ng21Ywqrm6eDqbclFyeOhARpJCyWvX7b-0dJLE1QwM';
// Cliente Supabase para visitas

let visitasClient;
if (window.supabase && typeof window.supabase.createClient === 'function') {
    visitasClient = window.supabase.createClient(VISITAS_SUPABASE_URL, VISITAS_SUPABASE_KEY);
} else {
    console.error('Supabase não está disponível ou não foi carregado corretamente.');
}

// Função para carregar visitas do setor do usuário logado
async function carregarVisitasSetor() {
    try {
        if (!visitasClient) {
            throw new Error('visitasClient não inicializado');
        }
        const setorUsuario = sessionStorage.getItem("setor");
        
        if (!setorUsuario) {
            console.error('Setor do usuário não encontrado');
            return [];
        }

        console.log('Carregando visitas para o setor:', setorUsuario);

        const { data, error } = await visitasClient
            .from('mapa_viagens')
            .select('*')
            .eq('setor', setorUsuario)
            .order('data_inicio', { ascending: false });

        if (error) {
            console.error('Erro ao buscar visitas:', error.message);
            return [];
        }

        console.log('Visitas carregadas:', data);
        return data || [];
    } catch (error) {
        console.error('Erro na função carregarVisitasSetor:', error);
        return [];
    }
}

// Função para renderizar visitas no painel do setor
function renderizarVisitasPainel(visitas) {
    const container = document.getElementById('visitasList');
    if (!container) {
        console.error('Container visitasList não encontrado');
        return;
    }

    container.innerHTML = '';

    if (!visitas || visitas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-map-marker-alt" style="font-size: 2em; margin-bottom: 10px; color: #4fc3f7;"></i>
                <p style="margin: 0; font-size: 1.1em;">Nenhuma visita encontrada para este setor.</p>
            </div>
        `;
        return;
    }

    visitas.forEach(visita => {
    const dataInicio = visita.data_inicio ? formatDateTimeForDisplay(visita.data_inicio) : 'Não informada';
    const dataFim = visita.data_fim ? formatDateTimeForDisplay(visita.data_fim) : 'Não informada';
        const statusClass = getStatusClassVisitas(visita.status);
        
        const visitaElement = document.createElement('div');
        visitaElement.className = 'visita-item';
        visitaElement.style.cssText = `
            background: white;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-left: 4px solid #4fc3f7;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;

        visitaElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #4fc3f7; font-size: 1.1em;">
                        <i class="fas fa-building" style="margin-right: 8px;"></i>
                        ${visita.empresa || 'Empresa não informada'}
                    </h4>
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 0.9em;">
                        <i class="fas fa-user" style="margin-right: 5px;"></i>
                        <strong>Especialista:</strong> ${visita.especialista || 'Não informado'}
                    </p>
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 0.9em;">
                        <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                        <strong>Destino:</strong> ${visita.destino || 'Não informado'}
                    </p>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge ${statusClass}" style="
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 0.8em;
                        font-weight: bold;
                        text-transform: uppercase;
                    ">${visita.status || 'Não informado'}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 10px;">
                <p style="margin: 0; color: #333; font-size: 0.9em;">
                    <i class="fas fa-clipboard-list" style="margin-right: 5px;"></i>
                    <strong>Propósito:</strong> ${visita.proposito || 'Não informado'}
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                    <small style="color: #666; font-weight: bold;">Data Início</small>
                    <div style="color: #333;">${dataInicio}</div>
                </div>
                <div style="background: #f8f9fa; padding: 8px; border-radius: 6px;">
                    <small style="color: #666; font-weight: bold;">Data Fim</small>
                    <div style="color: #333;">${dataFim}</div>
                </div>
            </div>
            
            ${visita.latitude && visita.longitude ? `
                <div style="margin-top: 10px;">
                    <button onclick="mostrarLocalizacao(${visita.latitude}, ${visita.longitude}, '${visita.empresa}')" 
                            style="background: #4fc3f7; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8em;">
                        <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                        Ver no Mapa
                    </button>
                </div>
            ` : ''}
        `;

        // Adicionar efeito hover
        visitaElement.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
        });

        visitaElement.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });

        container.appendChild(visitaElement);
    });

    // Atualizar contador de visitas
    const contador = document.getElementById('visitasCount');
    if (contador) {
        contador.textContent = visitas.length.toString().padStart(2, '0');
    }

    // Atualizar o mapa com as visitas
    if (typeof atualizarMapaVisitas === 'function') {
        atualizarMapaVisitas(visitas);
    }
}

// Função para obter classe CSS do status
function getStatusClassVisitas(status) {
    if (!status) return 'status-default';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('concluída') || statusLower.includes('finalizada')) {
        return 'status-concluida';
    } else if (statusLower.includes('andamento') || statusLower.includes('progresso')) {
        return 'status-andamento';
    } else if (statusLower.includes('agendada') || statusLower.includes('planejada')) {
        return 'status-agendada';
    } else if (statusLower.includes('cancelada')) {
        return 'status-cancelada';
    }
    
    return 'status-default';
}

// Função para mostrar localização no mapa
function mostrarLocalizacao(latitude, longitude, empresa) {
    // Se existe um mapa no container, centralizar nele
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer && window.visitasMap) {
        window.visitasMap.setView([latitude, longitude], 15);
        
        // Adicionar popup temporário
        L.popup()
            .setLatLng([latitude, longitude])
            .setContent(`<strong>${empresa}</strong><br>Localização da visita`)
            .openOn(window.visitasMap);
    } else {
        // Abrir no Google Maps como fallback
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        window.open(url, '_blank');
    }
}

// Função para inicializar o mapa de visitas
function inicializarMapaVisitas() {
    console.log("Inicializando mapa de visitas...");
    
    // Encontrar o container pai onde o mapa deve ser inserido
    let mapContainerParent = document.getElementById("mapContainer");
    if (!mapContainerParent) {
        console.error('Container pai do mapa não encontrado');
        return null;
    }

    // Remove o mapa anterior, se existir
    if (window.visitasMap) {
        try {
            window.visitasMap.remove();
        } catch (e) {
            console.warn('Erro ao remover mapa anterior:', e);
        }
        window.visitasMap = null;
    }

    // Criar um novo elemento div para o mapa com ID único
    const mapId = 'mapContainer_' + Date.now();
    const newMapContainer = document.createElement('div');
    newMapContainer.id = mapId;
    newMapContainer.style.cssText = `
        width: 100%;
        height: 400px;
        background-color: #f0f0f0;
    `;

    // Limpar o container pai e adicionar o novo container
    mapContainerParent.innerHTML = '';
    mapContainerParent.appendChild(newMapContainer);

    // Verificar se o Leaflet está disponível
    if (typeof L === 'undefined') {
        console.error('Leaflet não está carregado');
        return null;
    }

    try {
        // Criar mapa centrado no Brasil usando o novo container
        window.visitasMap = L.map(mapId).setView([-14.235, -51.9253], 4);

        // Adicionar camada de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(window.visitasMap);

        console.log("Mapa inicializado com sucesso");
        return window.visitasMap;
    } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        return null;
    }
}

// Função para atualizar os marcadores no mapa
function atualizarMapaVisitas(map, visitas) {
    // Limpar marcadores existentes
    if (window.visitasMarkers) {
        window.visitasMarkers.forEach(marker => marker.remove());
    }
    window.visitasMarkers = [];

    if (visitas && visitas.length > 0) {
        visitas.forEach(visita => {
            if (visita.latitude && visita.longitude) {
                const marker = L.marker([visita.latitude, visita.longitude])
                    .addTo(map);
                
                const popupContent = `
                    <div style="min-width: 200px;">
                        <h4 style="margin: 0 0 8px 0; color: #4fc3f7;">${visita.empresa || 'Empresa'}</h4>
                        <p style="margin: 0 0 4px 0;"><strong>Especialista:</strong> ${visita.especialista || 'N/A'}</p>
                        <p style="margin: 0 0 4px 0;"><strong>Destino:</strong> ${visita.destino || 'N/A'}</p>
                        <p style="margin: 0;"><strong>Status:</strong> ${visita.status || 'N/A'}</p>
                        <p style="margin: 0;"><strong>Propósito:</strong> ${visita.proposito || 'N/A'}</p>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                window.visitasMarkers.push(marker);
            }
        });
    }
}

// Função para atualizar a seção de visitas no painel do setor
async function atualizarSecaoVisitas() {
    try {
        const visitas = await carregarVisitasSetor();
        renderizarVisitasPainel(visitas);

        // Aguardar um pequeno delay para garantir que o DOM esteja pronto
        setTimeout(() => {
            // Inicializar o mapa e adicionar os marcadores
            const map = inicializarMapaVisitas();
            if (map) {
                // Aguardar um pouco mais para garantir que o mapa esteja totalmente carregado
                setTimeout(() => {
                    atualizarMapaVisitas(map, visitas);
                }, 200);
            } else {
                console.error('Falha ao inicializar o mapa');
            }
        }, 100);

    } catch (error) {
        console.error("Erro ao atualizar seção de visitas:", error);
    }
}

// Estilos CSS para os status das visitas
const visitasStyles = document.createElement('style');
visitasStyles.textContent = `
.status-concluida {
    background-color: #28a745 !important;
    color: white !important;
}

.status-andamento {
    background-color: #ffc107 !important;
    color: #212529 !important;
}

.status-agendada {
    background-color: #17a2b8 !important;
    color: white !important;
}

.status-cancelada {
    background-color: #dc3545 !important;
    color: white !important;
}

.status-default {
    background-color: #6c757d !important;
    color: white !important;
}

.visita-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}
`;

// Adicionar estilos ao documento
if (!document.getElementById('visitas-styles')) {
    visitasStyles.id = 'visitas-styles';
    document.head.appendChild(visitasStyles);
}

// Exportar funções para uso global
window.carregarVisitasSetor = carregarVisitasSetor;
window.renderizarVisitasPainel = renderizarVisitasPainel;
window.atualizarSecaoVisitas = atualizarSecaoVisitas;
window.inicializarMapaVisitas = inicializarMapaVisitas;
window.mostrarLocalizacao = mostrarLocalizacao;

// Variáveis globais para o modal de edição de usuário
let usuarioAtualEditando = null;
let permissoesDisponiveis = [
    {"id": "dashboard", "nome": "Dashboards", "descricao": "Dashboards"},
    {"id": "gerenciar-logins", "nome": "Gerenciar Logins", "descricao": "Gerenciar Logins"},
    {"id": "painel-setor", "nome": "Painel do Setor", "descricao": "Painel do Setor"},
    {"id": "clients", "nome": "Clientes", "descricao": "Clientes"},
    {"id": "homologacao", "nome": "Homologação", "descricao": "Homologação"},
    {"id": "https://tryvia.github.io/TryviaBI/mapa_visitas.html", "nome": "Visitas", "descricao": "Visitas"},
    {"id": "https://tryvia.github.io/TryviaBI/calendario.html", "nome": "Calendário", "descricao": "Calendário"},
    {"id": "https://tryvia.github.io/TryviaBI/linha%20do%20tempo.html", "nome": "MVP", "descricao": "MVP"},
    {"id": "https://tryvia.github.io/TryviaBI/implanta%C3%A7%C3%A3o.html", "nome": "Implantações", "descricao": "Implantações"},
    {"id": "release", "nome": "Release", "descricao": "Release"},
    {"id": "treinamento", "nome": "Treinamento", "descricao": "Treinamento"},
    {"id": "reunioes", "nome": "Reuniões", "descricao": "Reuniões"},
    {"id": "relatorioVisita", "nome": "Relatório de Visita", "descricao": "Relatório de Visita"},
    {"id": "documents", "nome": "Time de Implantação", "descricao": "Time de Implantação"},
    {"id": "evaluations", "nome": "Avaliações", "descricao": "Avaliações"},
    {"id": "gestao", "nome": "Gestão", "descricao": "Gestão"},
    {"id": "cs", "nome": "cs", "descricao": "cs"},
    {"id": "saveClient", "nome": "Salvar Cliente", "descricao": "Salvar Cliente"},
    {"id": "editClient", "nome": "Editar Cliente", "descricao": "Editar Cliente"},
    {"id": "updateClient", "nome": "Atualizar Cliente", "descricao": "Atualizar Cliente"},
    {"id": "deleteClient", "nome": "Excluir Cliente", "descricao": "Excluir Cliente"},
    {"id": "addClientDocument", "nome": "Adicionar Documento do Cliente", "descricao": "Adicionar Documento do Cliente"},
    {"id": "deleteClientDocument", "nome": "Excluir Documento do Cliente", "descricao": "Excluir Documento do Cliente"},
    {"id": "addProduct", "nome": "Adicionar Produto", "descricao": "Adicionar Produto"},
    {"id": "removeProduct", "nome": "Remover Produto", "descricao": "Remover Produto"},
    {"id": "addEditProduct", "nome": "Adicionar/Editar Produto", "descricao": "Adicionar/Editar Produto"},
    {"id": "addIntegration", "nome": "Adicionar Integração", "descricao": "Adicionar Integração"},
    {"id": "addEditIntegration", "nome": "Adicionar/Editar Integração", "descricao": "Adicionar/Editar Integração"},
    {"id": "removeIntegration", "nome": "Remover Integração", "descricao": "Remover Integração"},
    {"id": "addDocument", "nome": "Adicionar Documento do time", "descricao": "Adicionar Documento do time"},
    {"id": "deleteDocument", "nome": "Excluir Documento do time", "descricao": "Excluir Documento do time"},
    {"id": "submitHomologacao", "nome": "Adicionar homologação", "descricao": "Adicionar homologação"},
    {"id": "deleteHomologacao", "nome": "Excluir Homologação", "descricao": "Excluir Homologação"},
    {"id": "salvarRelease", "nome": "Salvar Release", "descricao": "Salvar Release"},
    {"id": "deleteRelease", "nome": "Excluir Release", "descricao": "Excluir Release"},
    {"id": "salvarReuniao", "nome": "Salvar Reunião", "descricao": "Salvar Reunião"},
    {"id": "showAddVideoModal", "nome": "Adicionar Video", "descricao": "Adicionar Video"},
    {"id": "showAddProductModal", "nome": "Adicionar Produto", "descricao": "Adicionar Produto"},
    {"id": "deleteTrainingVideo", "nome": "Excluir Video", "descricao": "Excluir Video"},
    {"id": "alterarQuantidade", "nome": "Alterar Quantidade nas tarefas", "descricao": "Alterar Quantidade nas tarefas"},
    {"id": 'saveTasks', 'nome': 'Salvar Tarefas', 'descricao': 'Salvar Tarefas'},
    {"id": 'abrirModalTarefa', 'nome': 'Adicionar Tarefa', 'descricao': 'Adicionar Tarefa'},
    {"id": 'abrirModalMembro', 'nome': 'Adicionar Membro do Time', 'descricao': 'Adicionar Membro do Time'},
    {"id": 'abrirModalProjeto', 'nome': 'Adicionar Projeto', 'descricao': 'Adicionar Projeto'},
    {"id": 'abrirModalVisita', 'nome': 'Adicionar Visita', 'descricao': 'Adicionar Visita'},
    {"id": 'abrirModalEntrega', 'nome': 'Adicionar Entrega', 'descricao': 'Adicionar Entrega'},
    {"id": 'saveTask', 'nome': 'Salvar Tarefa', 'descricao': 'Salvar Tarefa'},
    {"id": 'saveProject', 'nome': 'Salvar Projeto', 'descricao': 'Salvar Projeto'},
    {"id": 'excluirProjeto', 'nome': 'Excluir Projeto', 'descricao': 'Excluir Projeto'}
];

// Função para abrir o modal de edição de usuário
async function editarUsuario(usuarioId) {
    try {
        // Buscar dados do usuário
        const { data: usuario, error } = await releaseClient
            .from('usuarios')
            .select('*')
            .eq('id', usuarioId)
            .single();

        if (error) {
            console.error('Erro ao buscar usuário:', error);
            showAlert('Erro', 'Erro ao carregar dados do usuário.');
            return;
        }

        usuarioAtualEditando = usuario;
        
        // Preencher informações do usuário
        document.getElementById('usuarioNome').textContent = usuario.nome || '-';
        document.getElementById('usuarioEmail').textContent = usuario.email || '-';
        document.getElementById('usuarioStatus').textContent = 'Ativo';
        document.getElementById('usuarioStatus').className = 'status-badge ativo';
        document.getElementById('usuarioUltimoAcesso').textContent = 'Não informado';

        // Carregar permissões
        carregarPermissoes();
        
        // Limpar campos de senha
        document.getElementById('novaSenha').value = '';
        document.getElementById('confirmarSenha').value = '';
        document.getElementById('forcarTrocaSenha').checked = false;
        
        // Resetar indicadores de força da senha
        resetPasswordStrength();
        
        // Mostrar modal
        document.getElementById('modalEditarUsuario').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao abrir modal de edição:', error);
        showAlert('Erro', 'Erro inesperado ao abrir modal de edição.');
    }
}

// Função para carregar permissões no modal
function carregarPermissoes() {
    const listaDisponiveis = document.getElementById('listaPermissoesDisponiveis');
    const listaUsuario = document.getElementById('listaPermissoesUsuario');
    
    const permissoesUsuario = usuarioAtualEditando.permissoes || [];
    
    // Carregar permissões disponíveis (que o usuário não possui)
    const permissoesNaoPossui = permissoesDisponiveis.filter(p => !permissoesUsuario.includes(p.id));
    listaDisponiveis.innerHTML = permissoesNaoPossui.map(permissao => `
        <div class="permissao-item">
            <div class="permissao-info">
                <div class="permissao-nome">${permissao.nome}</div>
                <div class="permissao-descricao">${permissao.descricao}</div>
            </div>
            <div class="permissao-actions">
                <button class="btn-adicionar" onclick="adicionarPermissao('${permissao.id}')">
                    <i class="fas fa-plus"></i> Adicionar
                </button>
            </div>
        </div>
    `).join('');
    
    // Carregar permissões do usuário
    const permissoesPossui = permissoesDisponiveis.filter(p => permissoesUsuario.includes(p.id));
    listaUsuario.innerHTML = permissoesPossui.map(permissao => `
        <div class="permissao-item">
            <div class="permissao-info">
                <div class="permissao-nome">${permissao.nome}</div>
                <div class="permissao-descricao">${permissao.descricao}</div>
            </div>
            <div class="permissao-actions">
                <button class="btn-remover" onclick="removerPermissao('${permissao.id}')">
                    <i class="fas fa-minus"></i> Remover
                </button>
            </div>
        </div>
    `).join('');
}

// Função para adicionar permissão
function adicionarPermissao(permissaoId) {
    if (!usuarioAtualEditando.permissoes) {
        usuarioAtualEditando.permissoes = [];
    }
    
    if (!usuarioAtualEditando.permissoes.includes(permissaoId)) {
        usuarioAtualEditando.permissoes.push(permissaoId);
        carregarPermissoes();
    }
}

// Função para remover permissão
function removerPermissao(permissaoId) {
    if (usuarioAtualEditando.permissoes) {
        usuarioAtualEditando.permissoes = usuarioAtualEditando.permissoes.filter(p => p !== permissaoId);
        carregarPermissoes();
    }
}

// Função para filtrar permissões
function filtrarPermissoes() {
    const termo = document.getElementById('searchPermissoes').value.toLowerCase();
    const items = document.querySelectorAll('#listaPermissoesDisponiveis .permissao-item');
    
    items.forEach(item => {
        const nome = item.querySelector('.permissao-nome').textContent.toLowerCase();
        const descricao = item.querySelector('.permissao-descricao').textContent.toLowerCase();
        
        if (nome.includes(termo) || descricao.includes(termo)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Função para alternar visibilidade da senha
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Função para verificar força da senha
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    switch (strength) {
        case 0:
        case 1:
            strengthFill.style.width = '20%';
            strengthFill.style.backgroundColor = '#f44336';
            feedback = 'Muito fraca';
            break;
        case 2:
            strengthFill.style.width = '40%';
            strengthFill.style.backgroundColor = '#ff9800';
            feedback = 'Fraca';
            break;
        case 3:
            strengthFill.style.width = '60%';
            strengthFill.style.backgroundColor = '#ffc107';
            feedback = 'Média';
            break;
        case 4:
            strengthFill.style.width = '80%';
            strengthFill.style.backgroundColor = '#4caf50';
            feedback = 'Forte';
            break;
        case 5:
            strengthFill.style.width = '100%';
            strengthFill.style.backgroundColor = '#2e7d32';
            feedback = 'Muito forte';
            break;
    }
    
    strengthText.textContent = feedback;
    strengthText.style.color = strengthFill.style.backgroundColor;
}

// Função para verificar se as senhas coincidem
function checkPasswordMatch() {
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const matchDiv = document.getElementById('passwordMatch');
    
    if (confirmarSenha === '') {
        matchDiv.textContent = '';
        matchDiv.className = 'password-match';
        return;
    }
    
    if (novaSenha === confirmarSenha) {
        matchDiv.textContent = '✓ Senhas coincidem';
        matchDiv.className = 'password-match match';
    } else {
        matchDiv.textContent = '✗ Senhas não coincidem';
        matchDiv.className = 'password-match no-match';
    }
}

// Função para resetar indicadores de senha
function resetPasswordStrength() {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const matchDiv = document.getElementById('passwordMatch');
    
    strengthFill.style.width = '0%';
    strengthFill.style.backgroundColor = '#e0e0e0';
    strengthText.textContent = 'Digite uma senha';
    strengthText.style.color = '#666';
    
    matchDiv.textContent = '';
    matchDiv.className = 'password-match';
}

// Função para fechar o modal
function fecharModalEditarUsuario() {
    document.getElementById('modalEditarUsuario').style.display = 'none';
    usuarioAtualEditando = null;
}

// Função para salvar alterações do usuário
async function salvarAlteracoesUsuario() {
    if (!usuarioAtualEditando) {
        showAlert('Erro', 'Nenhum usuário selecionado para edição.');
        return;
    }

    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const forcarTroca = document.getElementById('forcarTrocaSenha').checked;

    // Validações
    if (novaSenha && novaSenha !== confirmarSenha) {
        showAlert('Erro', 'As senhas não coincidem.');
        return;
    }

    if (novaSenha && novaSenha.length < 6) {
        showAlert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }

    if (!usuarioAtualEditando.permissoes || usuarioAtualEditando.permissoes.length === 0) {
        showAlert('Erro', 'O usuário deve ter pelo menos uma permissão.');
        return;
    }

    try {
        // Preparar dados para atualização
        const dadosAtualizacao = {
            permissoes: usuarioAtualEditando.permissoes
        };

        // Incluir senha apenas se foi fornecida
        if (novaSenha && novaSenha.trim() !== '') {
            dadosAtualizacao.senha = novaSenha;
        }

        // Atualizar no Supabase
        const { data, error } = await releaseClient
            .from('usuarios')
            .update(dadosAtualizacao)
            .eq('id', usuarioAtualEditando.id)
            .select();

        if (error) {
            console.error('Erro ao atualizar usuário:', error);
            showAlert('Erro', 'Erro ao atualizar usuário: ' + error.message);
            return;
        }

        showAlert('Sucesso', 'Usuário atualizado com sucesso!');
        fecharModalEditarUsuario();
        
        // Recarregar lista de usuários se a função existir
        if (typeof fetchAndRenderUsuarios === 'function') {
            fetchAndRenderUsuarios();
        }
        if (typeof carregarLoginsUsuarios === 'function') {
            carregarLoginsUsuarios();
        }

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showAlert('Erro', 'Erro inesperado ao atualizar usuário.');
    }
}

// Event listeners para os campos de senha
document.addEventListener('DOMContentLoaded', function() {
    const novaSenhaInput = document.getElementById('novaSenha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    const searchInput = document.getElementById('searchPermissoes');
    const modalClose = document.querySelector('.modal-editar-usuario-close');
    
    if (novaSenhaInput) {
        novaSenhaInput.addEventListener('input', function() {
            if (this.value) {
                checkPasswordStrength(this.value);
            } else {
                resetPasswordStrength();
            }
            checkPasswordMatch();
        });
    }
    
    if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener('input', checkPasswordMatch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filtrarPermissoes);
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', fecharModalEditarUsuario);
    }
    
    // Fechar modal ao clicar fora dele
    document.getElementById('modalEditarUsuario').addEventListener('click', function(e) {
        if (e.target === this) {
            fecharModalEditarUsuario();
        }
    });
});


// ===== FUNÇÕES ADICIONAIS PARA EDIÇÃO E EXCLUSÃO DE REUNIÕES =====

// Função para abrir modal de edição de reunião
async function abrirModalEditarReuniao(reuniaoId) {
    try {
        // Buscar dados da reunião
        const { data, error } = await releaseClient
            .from("reunioes")
            .select("*")
            .eq("id", reuniaoId)
            .single();

        if (error) {
            console.error("Erro ao buscar reunião:", error);
            showAlert("Erro", "Erro ao carregar dados da reunião.");
            return;
        }

        // Preencher formulário de edição
        document.getElementById("editReuniaoCliente").value = data.client_id || "";
        document.getElementById("editReuniaoData").value = data.data || "";
        document.getElementById("editReuniaoHorario").value = data.horario || "";
        document.getElementById("editReuniaoTipo").value = data.tipo || "";
        document.getElementById("editReuniaoResponsavel").value = data.responsavel || "";
        document.getElementById("editReuniaoParticipantes").value = data.participantes || "";

        // Armazenar ID da reunião no formulário
        document.getElementById("formEditarReuniao").dataset.reuniaoId = reuniaoId;

        // Mostrar modal
        document.getElementById("modalEditarReuniao").classList.add("visible");

    } catch (error) {
        console.error("Erro ao abrir modal de edição:", error);
        showAlert("Erro", "Erro ao abrir formulário de edição.");
    }
}

// Função para fechar modal de edição de reunião
function fecharModalEditarReuniao() {
    document.getElementById("modalEditarReuniao").classList.remove("visible");
    document.getElementById("formEditarReuniao").reset();
    delete document.getElementById("formEditarReuniao").dataset.reuniaoId;
}

// Função para atualizar reunião (chamada pelo formulário de edição)
async function atualizarReuniao() {
    const reuniaoId = document.getElementById("formEditarReuniao").dataset.reuniaoId;
    if (!reuniaoId) {
        showAlert("Erro", "ID da reunião não encontrado.");
        return;
    }

    if (!permissoes.includes("atualizarReuniao")) {
        showAlert("Atenção", "Você não tem permissão para atualizar uma reunião.");
        return;
    }
    
    const clientId = document.getElementById("editReuniaoCliente").value;
    let cliente = "";
    if (window.clients && clientId) {
        const obj = window.clients.find(c => String(c.id) === String(clientId));
        if (obj) cliente = obj.name;
    }
    
    const data = document.getElementById("editReuniaoData").value;
    const horario = document.getElementById("editReuniaoHorario").value;
    const tipo = document.getElementById("editReuniaoTipo").value;
    const responsavel = document.getElementById("editReuniaoResponsavel").value;
    const participantes = document.getElementById("editReuniaoParticipantes").value;
    const file = document.getElementById("editReuniaoFile").files[0];
    
    // Obter o setor do usuário logado
    const setorUsuario = sessionStorage.getItem("setor") || "Time de implantação";

    let updateData = {
        client_id: clientId ? Number(clientId) : null,
        cliente,
        data,
        horario,
        tipo,
        responsavel,
        participantes,
        setor: setorUsuario  // Manter o setor do usuário logado
    };

    // Se houver novo arquivo, fazer upload
    if (file) {
        const file_path = Date.now() + "_" + file.name.replace(/\s+/g, "_");
        const { error } = await releaseClient.storage.from("reuniaofiles").upload(file_path, file);
        if (error) {
            showAlert("Erro", "Erro ao fazer upload da nova ata");
            return;
        }
        
        updateData.file_url = `${RELEASE_SUPABASE_URL}/storage/v1/object/public/reuniaofiles/${file_path}`;
        updateData.file_path = file_path;
    }

    const { error: updateError } = await releaseClient
        .from("reunioes")
        .update(updateData)
        .eq("id", reuniaoId);
    
    if (updateError) {
        showAlert("Erro", "Erro ao atualizar reunião.");
        return;
    }
    
    showAlert("Sucesso", "Reunião atualizada com sucesso!");
    
    // Fechar modal e recarregar lista
    fecharModalEditarReuniao();
    carregarReunioes();
}

// Função para excluir reunião
async function excluirReuniao(reuniaoId) {
    if (!permissoes.includes("excluirReuniao")) {
        showAlert("Atenção", "Você não tem permissão para excluir uma reunião.");
        return;
    }

    const confirmed = await showConfirm("Confirmação", "Tem certeza que deseja excluir esta reunião?");
    if (!confirmed) return;

    try {
        // Buscar dados da reunião para deletar arquivo se existir
        const { data: reuniaoData } = await releaseClient
            .from("reunioes")
            .select("file_path")
            .eq("id", reuniaoId)
            .single();

        // Deletar arquivo se existir
        if (reuniaoData && reuniaoData.file_path) {
            await releaseClient.storage
                .from("reuniaofiles")
                .remove([reuniaoData.file_path]);
        }

        // Deletar reunião do banco
        const { error } = await releaseClient
            .from("reunioes")
            .delete()
            .eq("id", reuniaoId);

        if (error) {
            showAlert("Erro", "Erro ao excluir reunião.");
            return;
        }

        showAlert("Sucesso", "Reunião excluída com sucesso!");
        carregarReunioes();

    } catch (error) {
        console.error("Erro ao excluir reunião:", error);
        showAlert("Erro", "Erro ao excluir reunião.");
    }
}

// Event listener para o formulário de edição de reunião
document.addEventListener("DOMContentLoaded", function() {
    const formEditarReuniao = document.getElementById("formEditarReuniao");
    if (formEditarReuniao) {
        formEditarReuniao.addEventListener("submit", function(e) {
            e.preventDefault();
            atualizarReuniao();
        });
    }
});










async function loadAllDocuments() {
    const setorUsuario = sessionStorage.getItem("setor");
    let query = releaseClient
        .from("documents_setor")
        .select("*");

    if (setorUsuario) {
        query = query.eq("setor", setorUsuario);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao carregar documentos:", error.message);
        return;
    }

    const documentList = document.getElementById("documentList");
    if (!documentList) return;
    documentList.innerHTML = "";

    if (!data || data.length === 0) {
        documentList.innerHTML = "<p>Nenhum documento encontrado.</p>";
        return;
    }

    data.forEach(doc => {
        const docElement = document.createElement("div");
        docElement.className = "document-item";
        docElement.innerHTML = `
            <h4>${doc.title}</h4>
            <p>Autor: ${doc.author}</p>
            <p>Tipo: ${doc.type}</p>
            <a href="${doc.file_url}" target="_blank">Ver Documento</a>
        `;
        documentList.appendChild(docElement);
    });
}



// Função loadDocuments corrigida com debug e validações adicionais
async function loadDocuments() {
    const documentsList = document.getElementById('documentsList');
    const documentTypeFilter = document.getElementById('documentTypeFilter');
    const filterValue = documentTypeFilter.value;
    const setorUsuario = sessionStorage.getItem("setor");

    // Debug: Log do setor do usuário
    console.log('Setor do usuário logado:', setorUsuario);

    if (!setorUsuario) {
        console.error('Setor do usuário não definido no sessionStorage');
        documentsList.innerHTML = '<tr><td colspan="5">Setor do usuário não definido. Não é possível carregar documentos.</td></tr>';
        return;
    }

    // Construir query com filtro obrigatório por setor
    let query = releaseClient.from('documents_setor').select('*').eq('setor', setorUsuario);

    // Aplicar filtro adicional por tipo, se selecionado
    if (filterValue) {
        query = query.eq('type', filterValue);
        console.log('Filtro por tipo aplicado:', filterValue);
    }

    // Debug: Log da query que será executada
    console.log('Executando query para buscar documentos do setor:', setorUsuario);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar documentos:', error);
        documentsList.innerHTML = '<tr><td colspan="5">Erro ao carregar documentos.</td></tr>';
        return;
    }

    // Debug: Log dos documentos encontrados
    console.log('Documentos encontrados:', data.length);
    console.log('Dados dos documentos:', data);

    // Verificar se todos os documentos pertencem ao setor correto
    const documentosIncorretos = data.filter(doc => doc.setor !== setorUsuario);
    if (documentosIncorretos.length > 0) {
        console.error('ATENÇÃO: Encontrados documentos que não pertencem ao setor do usuário:', documentosIncorretos);
    }

    if (data.length === 0) {
        documentsList.innerHTML = '<tr><td colspan="5">Nenhum documento encontrado para o seu setor.</td></tr>';
        return;
    }

    // Filtrar novamente no frontend como medida de segurança adicional
    const documentosFiltrados = data.filter(doc => doc.setor === setorUsuario);
    
    if (documentosFiltrados.length !== data.length) {
        console.warn('Filtro adicional no frontend removeu documentos incorretos. Documentos antes:', data.length, 'Documentos depois:', documentosFiltrados.length);
    }

    documentsList.innerHTML = documentosFiltrados.map(doc => `
        <tr>
            <td>${doc.title}</td>
            <td>${doc.author}</td>
            <td>${doc.type}</td>
            <td>${new Date(doc.created_at).toLocaleDateString()}</td>
            <td>
                <a href="${doc.file_url}" target="_blank" class="btn-action">Ver</a>
                <button onclick="deleteDocument(${doc.id}, '${doc.file_path}')" class="btn-action delete">Excluir</button>
            </td>
        </tr>
    `).join('');

    // Debug: Log final
    console.log('Documentos exibidos na tela:', documentosFiltrados.length);
}
