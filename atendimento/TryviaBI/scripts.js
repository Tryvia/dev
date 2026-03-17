// Global Modal Functions (FROM YOUR ORIGINAL FILE)
function showAlert(title, message, callback) {
    const modal = document.getElementById('customModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    const buttonsDiv = document.getElementById('modalButtons');
    buttonsDiv.innerHTML = `<button class="btn-primary" onclick="closeModal()">OK</button>`;
    modal.classList.add('visible');

    if (callback) {
        modal.querySelector('.btn-primary').onclick = () => {
            closeModal();
            callback();
        };
    }
}

function showConfirm(title, message, onConfirm, onCancel) {
    const modal = document.getElementById('customModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    const buttonsDiv = document.getElementById('modalButtons');
    buttonsDiv.innerHTML = `
        <button class="btn-primary confirm-btn">Confirmar</button>
        <button class="btn-secondary cancel-btn">Cancelar</button>
    `;
    modal.classList.add('visible');

    modal.querySelector('.confirm-btn').onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
    modal.querySelector('.cancel-btn').onclick = () => {
        closeModal();
        if (onCancel) onCancel();
    };
}

function showPrompt(title, message, onConfirm, onCancel) {
    const modal = document.getElementById('customModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    const buttonsDiv = document.getElementById('modalButtons');
    buttonsDiv.innerHTML = `
        <input type="text" id="promptInput" placeholder="Digite aqui...">
        <button class="btn-primary confirm-btn">OK</button>
        <button class="btn-secondary cancel-btn">Cancelar</button>
    `;
    modal.classList.add('visible');

    modal.querySelector('.confirm-btn').onclick = () => {
        const input = document.getElementById('promptInput').value;
        closeModal();
        if (onConfirm) onConfirm(input);
    };
    modal.querySelector('.cancel-btn').onclick = () => {
        closeModal();
        if (onCancel) onCancel();
    };
}

function closeModal() {
    document.getElementById('customModal').classList.remove('visible');
    // Limpa os listeners para evitar múltiplos disparos
    const buttonsDiv = document.getElementById('modalButtons');
    buttonsDiv.innerHTML = '';
}


// Client Integrations Logic (FROM YOUR ORIGINAL FILE)
let currentIntegrations = [];
let editingIntegrations = [];

function addIntegration(listType, typeInputId, systemInputId) {
    const integrationType = document.getElementById(typeInputId).value;
    const integrationSystem = document.getElementById(systemInputId).value;

    if (integrationType && integrationSystem) {
        const newIntegration = { type: integrationType, system: integrationSystem };
        if (listType === "currentIntegrations") {
            currentIntegrations.push(newIntegration);
            updateIntegrationList("currentIntegrations", "integrationsContainer", "integrationsList");
        } else if (listType === "editingIntegrations") {
            editingIntegrations.push(newIntegration);
            updateIntegrationList("editingIntegrations", "editIntegrationsContainer", "editIntegrationsList");
        }
        document.getElementById(typeInputId).value = "";
        document.getElementById(systemInputId).value = "";
    } else {
        showAlert("Erro", "Selecione o tipo e o sistema da integração.");
    }
}

function removeIntegration(index, listType) {
    if (listType === "currentIntegrations") {
        currentIntegrations.splice(index, 1);
        updateIntegrationList("currentIntegrations", "integrationsContainer", "integrationsList");
    } else if (listType === "editingIntegrations") {
        editingIntegrations.splice(index, 1);
        updateIntegrationList("editingIntegrations", "editIntegrationsContainer", "editIntegrationsList");
    }
}

function updateIntegrationList(listName, containerId, wrapperId) {
    const list = listName === "currentIntegrations" ? currentIntegrations : editingIntegrations;
    const container = document.getElementById(containerId);
    const wrapper = document.getElementById(wrapperId);

    if (!container || !wrapper) return;

    if (list.length === 0) {
        container.innerHTML = '<p style="color: rgba(0, 0, 0, 0.85);">Nenhuma integração adicionada ainda.</p>';
        wrapper.style.display = "none";
        return;
    }

    wrapper.style.display = "block";
    container.innerHTML = list.map((item, i) => `
        <div class="product-item">
            <span>${item.type} - ${item.system}</span>
            <button class="delete-btn" onclick="removeIntegration(${i}, '${listName}')">x</button>
        </div>
    `).join('');
}

// Email Validation (FROM YOUR ORIGINAL FILE)
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Active Tab Handling (FROM YOUR ORIGINAL FILE)
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname.split('/').pop();

    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('href').split('/').pop() === currentPath) {
            item.classList.add('active');
        }
    });

    // Seções de conteúdo
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        // Inicialmente, todas as seções são ocultas por CSS
        // A lógica do index.html (se for o caso) ou de cada página individual
        // deve mostrar a seção apropriada.
        // Se a lógica era baseada em IDs de hash (#), isso precisa ser adaptado
        // para a navegação entre arquivos HTML.
    });

    // Client Tab Logic (FROM YOUR ORIGINAL FILE - moved from main script to here for context)
    // Removed specific client tab logic as it will be in clients.html
});