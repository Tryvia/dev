// ===== CONFIGURAÇÃO SUPABASE =====
const SUPABASE_URL = "https://mzjdmhgkrroajmsfwryu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc";

// ===== DATA & MAPPINGS =====
const feelingEmoji = { 1: "😡", 2: "😟", 3: "😐", 4: "😊", 5: "😍" };
const feelingLabels = { 1: "Muito Insatisfeito", 2: "Insatisfeito", 3: "Neutro", 4: "Satisfeito", 5: "Muito Satisfeito" };

let contacts = [];
let currentPage = 1;
const itemsPerPage = 50;

// ===== API CALLS =====
async function fetchContacts() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cs_contacts?select=*&order=contact_date.desc`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) throw new Error("Erro ao buscar dados do Supabase");
        const data = await response.json();
        
        contacts = data.map(c => ({
            id: c.id,
            cliente: c.client_name,
            tipo: c.contact_type,
            data: c.contact_date,
            observacoes: c.observation,
            feeling: c.feeling_note || 3
        }));
        
        updateClientOptions();
        updateYearOptions();
        refresh();
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao carregar dados do banco de dados.");
    }
}

async function saveContact() {
    const cl = document.getElementById("nc-cliente-input").value;
    const tp = document.getElementById("nc-tipo").value;
    const dt = document.getElementById("nc-data").value;
    const ob = document.getElementById("nc-obs").value;
    const fl = document.getElementById("nc-feeling").value;

    if (!cl || !tp || !fl) {
        alert("Preencha Cliente, Tipo e Feeling!");
        return;
    }

    const newContact = {
        client_name: cl,
        contact_type: tp,
        contact_date: dt || new Date().toISOString().split("T")[0],
        observation: ob,
        feeling_note: Number(fl)
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cs_contacts`, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(newContact)
        });

        if (!response.ok) throw new Error("Erro ao salvar no banco");
        
        document.getElementById("nc-cliente-input").value = "";
        document.getElementById("nc-tipo").value = "";
        document.getElementById("nc-obs").value = "";
        document.getElementById("nc-feeling").value = "";
        
        await fetchContacts();
        updateYearOptions();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar o contato.");
    }
}

function updateClientOptions() {
    const clients = [...new Set(contacts.map(c => c.cliente))].sort();
    const datalist = document.getElementById("clients-list");
    if (datalist) {
        datalist.innerHTML = clients.map(c => `<option value="${c}">`).join("");
    }
}

function updateYearOptions() {
    const anos = [...new Set(contacts.map(c => new Date(c.data).getFullYear()))].sort((a, b) => b - a);
    const selectAno = document.getElementById("f-ano");
    if (selectAno) {
        const currentValue = selectAno.value;
        selectAno.innerHTML = '<option value="">Todos os anos</option>';
        selectAno.innerHTML += anos.map(a => `<option value="${a}">${a}</option>`).join("");
        selectAno.value = currentValue;
    }
}

// ===== RENDER =====
function renderStats(list) {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split("T")[0];
    const total = list.length;
    const hoje = list.filter(c => c.data === today).length;
    const semana = list.filter(c => c.data >= weekAgo).length;
    const avg = total > 0 ? (list.reduce((s, c) => s + c.feeling, 0) / total).toFixed(1) : "0";
    
    document.getElementById("stats").innerHTML = `
        <div class="stat-card blue"><div class="stat-value">${total}</div><div class="stat-label">Total de Contatos</div></div>
        <div class="stat-card purple"><div class="stat-value">${hoje}</div><div class="stat-label">Contatos Hoje</div></div>
        <div class="stat-card green"><div class="stat-value">${semana}</div><div class="stat-label">Esta Semana</div></div>
        <div class="stat-card orange"><div class="stat-value">${avg}</div><div class="stat-label">Feeling Médio</div></div>`;
}

function renderTable(list) {
    const totalPages = Math.ceil(list.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedList = list.slice(startIdx, endIdx);
    
    const rows = paginatedList.map((c, idx) => `<tr onclick="openModal(${JSON.stringify(c).replace(/"/g, '&quot;')})">
        <td style="font-weight:600">${c.cliente}</td>
        <td>${c.tipo}</td>
        <td>${new Date(c.data).toLocaleDateString("pt-BR")}</td>
        <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${c.observacoes}">${c.observacoes}</td>
        <td><span class="feeling-badge feeling-${c.feeling}">${feelingEmoji[c.feeling]} ${feelingLabels[c.feeling]}</span></td>
        <td onclick="event.stopPropagation()">
            <div class="action-buttons">
                <button class="btn-edit" onclick="openEditModal(${JSON.stringify(c).replace(/"/g, '&quot;')})" title="Editar registro">✏️ Editar</button>
                <button class="btn-delete" onclick="deleteContact(${c.id})" title="Deletar registro">🗑️ Deletar</button>
            </div>
        </td>
    </tr>`).join("");
    
    // Gerar botões de paginação
    let paginationHTML = "";
    if (totalPages > 1) {
        paginationHTML = `<div class="pagination">`;
        
        // Botão anterior
        if (currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">← Anterior</button>`;
        } else {
            paginationHTML += `<button class="page-btn" disabled>← Anterior</button>`;
        }
        
        // Números de página
        const maxButtons = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
            if (startPage > 2) paginationHTML += `<span class="page-dots">...</span>`;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                paginationHTML += `<button class="page-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="page-btn" onclick="goToPage(${i})">${i}</button>`;
            }
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationHTML += `<span class="page-dots">...</span>`;
            paginationHTML += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        // Botão próximo
        if (currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Próximo →</button>`;
        } else {
            paginationHTML += `<button class="page-btn" disabled>Próximo →</button>`;
        }
        
        paginationHTML += `</div>`;
    }
    
    const info = `Mostrando ${startIdx + 1} a ${Math.min(endIdx, list.length)} de ${list.length} registros (página ${currentPage}/${totalPages})`;
    
    document.getElementById("table-section").innerHTML = `
        <div class="card">
            <div class="card-title">Registro de Contatos</div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Cliente</th><th>Tipo</th><th>Data</th><th>Observações</th><th>Feeling</th><th>Ações</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="table-footer">${info}</div>
            ${paginationHTML}
        </div>`;
}

function getFiltered() {
    let r = [...contacts];
    const cf = document.getElementById("f-cliente").value.toLowerCase();
    const tf = document.getElementById("f-tipo").value;
    const df = document.getElementById("f-data").value;
    const ff = document.getElementById("f-feeling").value;
    const af = document.getElementById("f-ano").value;
    const ord = document.getElementById("f-ordem").value;

    if (cf) r = r.filter(c => c.cliente.toLowerCase().includes(cf));
    if (tf) r = r.filter(c => c.tipo.toLowerCase() === tf.toLowerCase());
    if (df) r = r.filter(c => c.data === df);
    if (ff) r = r.filter(c => c.feeling === Number(ff));
    if (af) r = r.filter(c => new Date(c.data).getFullYear() === Number(af));
    
    r.sort((a, b) => ord === "desc" ? b.data.localeCompare(a.data) : a.data.localeCompare(b.data));
    return r;
}

function refresh() {
    currentPage = 1;  // Reset para primeira página ao filtrar
    const f = getFiltered();
    renderStats(f);
    renderTable(f);
    renderCharts(f);
}

function goToPage(page) {
    currentPage = page;
    const f = getFiltered();
    renderStats(f);
    renderTable(f);
    renderCharts(f);
    // Scroll para o topo da tabela
    document.getElementById("table-section").scrollIntoView({ behavior: "smooth" });
}

// ===== CHARTS (Canvas) =====
const COLORS = ["#1d9bf0", "#00ba7c", "#f5a623", "#f4212e", "#7856ff", "#e058a0", "#17bf63", "#ff6f00"];

// ===== TOOLTIP SYSTEM =====
let tooltipData = {};

function showTooltip(canvas, text, x, y) {
    let tooltip = document.getElementById("chart-tooltip");
    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "chart-tooltip";
        tooltip.style.cssText = `
            position: fixed;
            background: #1a2733;
            color: #e8edf2;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid #2f3e4e;
            pointer-events: none;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            white-space: nowrap;
        `;
        document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = text;
    tooltip.style.left = (x + 10) + "px";
    tooltip.style.top = (y - 30) + "px";
    tooltip.style.display = "block";
}

function hideTooltip() {
    const tooltip = document.getElementById("chart-tooltip");
    if (tooltip) tooltip.style.display = "none";
}

function setupPieInteractivity(id, data, cx, cy, r, total) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const entries = Object.entries(data);
    let angle = -Math.PI / 2;
    const slices = [];
    
    entries.forEach(([name, val]) => {
        const slice = val / total * Math.PI * 2;
        slices.push({ name, val, angle, slice, percentage: Math.round(val / total * 100) });
        angle += slice;
    });
    
    canvas.addEventListener("mousemove", (e) => {
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > r * 0.3 && dist < r * 1.1) {
            let ang = Math.atan2(dy, dx) + Math.PI / 2;
            if (ang < 0) ang += Math.PI * 2;
            
            for (let s of slices) {
                const start = s.angle;
                const end = s.angle + s.slice;
                if (ang >= start && ang <= end) {
                    showTooltip(canvas, `${s.name}: ${s.val} (${s.percentage}%)`, e.clientX, e.clientY);
                    return;
                }
            }
        }
        hideTooltip();
    });
    
    canvas.addEventListener("mouseleave", hideTooltip);
}

function setupBarInteractivity(id, bars) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.addEventListener("mousemove", (e) => {
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        
        for (let bar of bars) {
            if (x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h) {
                showTooltip(canvas, `${bar.name}: ${bar.val}`, e.clientX, e.clientY);
                return;
            }
        }
        hideTooltip();
    });
    
    canvas.addEventListener("mouseleave", hideTooltip);
}

function setupLineInteractivity(id, dots) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.addEventListener("mousemove", (e) => {
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        
        for (let dot of dots) {
            const dist = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
            if (dist < 15) {
                showTooltip(canvas, `${dot.date}: ${dot.val}`, e.clientX, e.clientY);
                return;
            }
        }
        hideTooltip();
    });
    
    canvas.addEventListener("mouseleave", hideTooltip);
}

function setupHBarInteractivity(id, bars) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.addEventListener("mousemove", (e) => {
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        
        for (let bar of bars) {
            if (x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h) {
                showTooltip(canvas, `${bar.name}: ${bar.val}`, e.clientX, e.clientY);
                return;
            }
        }
        hideTooltip();
    });
    
    canvas.addEventListener("mouseleave", hideTooltip);
}


function setupCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Definir tamanho interno do canvas para alta resolução
    canvas.width = rect.width * dpr;
    canvas.height = 350 * dpr; // Altura fixa aumentada
    ctx.scale(dpr, dpr);
    
    return { ctx, w: rect.width, h: 350 };
}

function renderCharts(list) {
    drawPieChart("chart-tipo", countBy(list, "tipo"));
    drawBarChart("chart-feeling", countFeeling(list));
    drawLineChart("chart-week", countByWeek(list));
    drawBarChart("chart-month", countByMonth(list));
    drawHBarChart("chart-top", topClientes(list));
}

function countBy(arr, key) {
    const m = {};
    arr.forEach(c => { 
        const val = c[key] || "Não Informado";
        m[val] = (m[val] || 0) + 1;
    });
    return m;
}

function countByMonth(arr) {
    const yearFilter = document.getElementById("f-ano").value;
    let filtered = arr;
    
    if (yearFilter) {
        filtered = arr.filter(c => new Date(c.data).getFullYear() === Number(yearFilter));
    }
    
    const m = {};
    filtered.forEach(c => {
        if (!c.data) return;
        const d = new Date(c.data);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        m[key] = (m[key] || 0) + 1;
    });

    const ordered = Object.keys(m).sort().map(key => {
        const [year, month] = key.split("-");
        const label = `${new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", { month: "short" })}${yearFilter ? `` : `/${year}`}`;
        return [label, m[key]];
    });

    return Object.fromEntries(ordered);
}

function countFeeling(arr) {
    const m = {};
    for (let i = 1; i <= 5; i++) m[feelingEmoji[i] + " " + feelingLabels[i]] = 0;
    arr.forEach(c => { m[feelingEmoji[c.feeling] + " " + feelingLabels[c.feeling]]++ });
    return m;
}

function countByWeek(arr) {
    const m = {};
    const sorted = [...arr].sort((a, b) => a.data.localeCompare(b.data));
    sorted.forEach(c => {
        const d = new Date(c.data);
        const ws = new Date(d);
        ws.setDate(d.getDate() - d.getDay());
        const k = ws.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        m[k] = (m[k] || 0) + 1;
    });
    return m;
}

function topClientes(arr) {
    const m = {};
    arr.forEach(c => { m[c.cliente] = (m[c.cliente] || 0) + 1 });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).reduce((o, [k, v]) => (o[k] = v, o), {});
}

function drawPieChart(id, data) {
    const setup = setupCanvas(id); if (!setup) return;
    const { ctx, w, h } = setup;
    const entries = Object.entries(data); const total = entries.reduce((s, e) => s + e[1], 0);
    if (!total) return;
    
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 80;
    let angle = -Math.PI / 2;
    const slices = [];
    
    entries.forEach(([name, val], i) => {
        const slice = val / total * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + slice); ctx.closePath();
        ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
        
        slices.push({ name, val, angle, slice, color: COLORS[i % COLORS.length], percentage: Math.round(val / total * 100) });
        angle += slice;
    });
    
    // Desenha legenda abaixo
    const legendY = h - 40;
    const legendX = 20;
    let currentX = legendX;
    ctx.font = "bold 11px Inter";
    
    slices.forEach((s, i) => {
        const text = `${s.name} (${s.percentage}%)`;
        const metrics = ctx.measureText(text);
        const textW = metrics.width + 20;
        
        if (currentX + textW > w - 20 && i > 0) {
            currentX = legendX;
        }
        
        ctx.fillStyle = s.color;
        ctx.fillRect(currentX, legendY - 8, 12, 12);
        
        ctx.fillStyle = "#e8edf2";
        ctx.textAlign = "left";
        ctx.fillText(text, currentX + 16, legendY);
        
        currentX += textW + 10;
    });
    
    // Armazena dados para interatividade
    setupPieInteractivity(id, data, cx, cy, r, total);
}

function drawBarChart(id, data) {
    const setup = setupCanvas(id); if (!setup) return;
    const { ctx, w, h } = setup;
    const entries = Object.entries(data); const max = Math.max(...entries.map(e => e[1]), 1);
    const barW = (w - 100) / entries.length - 15; const baseY = h - 100;
    
    const bars = [];
    entries.forEach(([name, val], i) => {
        const barH = (val / max) * (baseY - 40);
        const x = 60 + i * (barW + 15);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.beginPath();
        ctx.roundRect(x, baseY - barH, barW, barH, 8); ctx.fill();
        
        bars.push({ x, y: baseY - barH, w: barW, h: barH, name, val, color: COLORS[i % COLORS.length] });
        
        // Desenhar valor acima da barra
        ctx.fillStyle = "#e8edf2"; ctx.font = "bold 14px Inter"; ctx.textAlign = "center";
        ctx.fillText(val, x + barW / 2, baseY - barH - 10);
        
        // Rotacionar e desenhar rótulo abaixo da barra
        ctx.save();
        ctx.translate(x + barW / 2, baseY + 10);
        ctx.rotate(Math.PI / 4); // 45 graus
        ctx.fillStyle = "#8899a6"; ctx.font = "11px Inter"; ctx.textAlign = "center";
        const label = name.length > 15 ? name.substring(0, 13) + ".." : name;
        ctx.fillText(label, 0, 0);
        ctx.restore();
    });
    
    setupBarInteractivity(id, bars);
}

function drawLineChart(id, data) {
    const setup = setupCanvas(id); if (!setup) return;
    const { ctx, w, h } = setup;
    const entries = Object.entries(data).slice(-10); if (!entries.length) return;
    const max = Math.max(...entries.map(e => e[1]), 1);
    const baseY = h - 60; const topY = 40;
    const stepX = (w - 100) / (entries.length - 1 || 1);
    
    ctx.strokeStyle = "#2f3e4e"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { 
        const y = topY + (baseY - topY) / 4 * i; 
        ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(w - 50, y); ctx.stroke();
        ctx.fillStyle = "#8899a6"; ctx.font = "10px Inter"; ctx.textAlign = "right";
        ctx.fillText(Math.round(max - (max/4*i)), 45, y + 4);
    }
    
    ctx.beginPath(); ctx.strokeStyle = "#1d9bf0"; ctx.lineWidth = 4; ctx.lineJoin = "round";
    const points = entries.map(([, val], i) => [60 + i * stepX, baseY - (val / max) * (baseY - topY)]);
    points.forEach(([x, y], i) => { i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }); ctx.stroke();
    
    const dots = [];
    points.forEach(([x, y], i) => { 
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = "#1d9bf0"; ctx.fill(); 
        ctx.strokeStyle = "#0f1923"; ctx.lineWidth = 2; ctx.stroke();
        dots.push({ x, y, val: entries[i][1], date: entries[i][0] });
    });
    
    entries.forEach(([name], i) => { 
        ctx.fillStyle = "#8899a6"; ctx.font = "bold 11px Inter"; ctx.textAlign = "center"; 
        ctx.fillText(name, 60 + i * stepX, baseY + 25); 
    });
    
    setupLineInteractivity(id, dots);
}


function drawHBarChart(id, data) {
    const setup = setupCanvas(id); if (!setup) return;
    const { ctx, w, h } = setup;
    const entries = Object.entries(data); const max = Math.max(...entries.map(e => e[1]), 1);
    const barH = (h - 40) / entries.length - 10;
    
    const bars = [];
    entries.forEach(([name, val], i) => {
        const y = 20 + i * (barH + 10); const barW = (val / max) * (w - 220);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.beginPath(); ctx.roundRect(160, y, barW, barH, 6); ctx.fill();
        
        bars.push({ x: 160, y, w: barW, h: barH, name, val, color: COLORS[i % COLORS.length] });
        
        ctx.fillStyle = "#8899a6"; ctx.font = "bold 12px Inter"; ctx.textAlign = "right";
        ctx.fillText(name.length > 18 ? name.substring(0, 16) + "..." : name, 150, y + barH / 2 + 5);
        
        ctx.fillStyle = "#e8edf2"; ctx.font = "bold 13px Inter"; ctx.textAlign = "left";
        ctx.fillText(val, 170 + barW, y + barH / 2 + 5);
    });
    
    setupHBarInteractivity(id, bars);
}

// ===== MODAL FUNCTIONS =====
function openModal(contact) {
    document.getElementById("modal-cliente").textContent = contact.cliente;
    document.getElementById("modal-tipo").textContent = contact.tipo;
    document.getElementById("modal-data").textContent = new Date(contact.data).toLocaleDateString("pt-BR");
    document.getElementById("modal-obs").textContent = contact.observacoes || "—";
    
    const feelingText = `${feelingEmoji[contact.feeling]} ${feelingLabels[contact.feeling]}`;
    document.getElementById("modal-feeling").textContent = feelingText;
    
    const modal = document.getElementById("contact-modal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    const modal = document.getElementById("contact-modal");
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
}

// ===== EDIT MODAL FUNCTIONS =====
let editingContactId = null;

function openEditModal(contact) {
    editingContactId = contact.id;
    document.getElementById("edit-cliente").value = contact.cliente;
    document.getElementById("edit-tipo").value = contact.tipo;
    document.getElementById("edit-data").value = contact.data;
    document.getElementById("edit-obs").value = contact.observacoes || "";
    document.getElementById("edit-feeling").value = contact.feeling;
    
    const modal = document.getElementById("edit-modal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeEditModal() {
    const modal = document.getElementById("edit-modal");
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
    editingContactId = null;
}

async function saveEditedContact() {
    const cliente = document.getElementById("edit-cliente").value;
    const tipo = document.getElementById("edit-tipo").value;
    const data = document.getElementById("edit-data").value;
    const obs = document.getElementById("edit-obs").value;
    const feeling = document.getElementById("edit-feeling").value;

    if (!cliente || !tipo || !feeling) {
        alert("Preencha Cliente, Tipo e Feeling!");
        return;
    }

    const updatedContact = {
        client_name: cliente,
        contact_type: tipo,
        contact_date: data,
        observation: obs,
        feeling_note: Number(feeling)
    };

    try {
        console.log("=== INICIANDO EDIÇÃO ===");
        console.log("ID:", editingContactId);
        console.log("Tipo do ID:", typeof editingContactId);
        console.log("Dados a atualizar:", updatedContact);
        
        // Tentar com diferentes sintaxes de filtro
        let url = `${SUPABASE_URL}/rest/v1/cs_contacts?id=eq.${editingContactId}`;
        console.log("URL (tentativa 1):", url);
        
        let response = await fetch(url, {
            method: "PATCH",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(updatedContact)
        });

        console.log("Status da resposta:", response.status);
        const responseData = await response.json();
        console.log("Dados retornados:", responseData);
        console.log("Tamanho do array retornado:", responseData.length);
        
        // Se retornou vazio, pode ser problema de RLS
        if (Array.isArray(responseData) && responseData.length === 0) {
            console.warn("⚠️ A atualização retornou vazio (array.length = 0)");
            console.warn("Possíveis causas:");
            console.warn("1. RLS (Row Level Security) está bloqueando");
            console.warn("2. O registro com ID " + editingContactId + " não existe");
            console.warn("3. O tipo do ID é diferente do esperado");
            
            // Tentar debug: fazer um GET para ver se o registro existe
            console.log("Tentando fazer GET para verificar se registro existe...");
            const getUrl = `${SUPABASE_URL}/rest/v1/cs_contacts?id=eq.${editingContactId}&select=*`;
            const getResponse = await fetch(getUrl, {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            });
            const getData = await getResponse.json();
            console.log("GET result:", getData);
            
            if (getData.length === 0) {
                throw new Error("Registro com ID " + editingContactId + " não foi encontrado no banco de dados");
            } else {
                throw new Error("Problema de RLS ou permissão - registro existe mas não pode ser atualizado");
            }
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        closeEditModal();
        alert("✅ Registro atualizado com sucesso!");
        await fetchContacts();
    } catch (error) {
        console.error("❌ Erro ao editar:", error);
        alert("Erro: " + error.message + "\n\nVerifique o console para mais detalhes.");
    }
}

async function deleteContact(id) {
    if (!confirm("Tem certeza que deseja deletar este registro? Esta ação não pode ser desfeita.")) {
        return;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cs_contacts?id=eq.${id}`, {
            method: "DELETE",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) throw new Error("Erro ao deletar registro");
        
        alert("Registro deletado com sucesso!");
        await fetchContacts();
    } catch (error) {
        console.error("Erro ao deletar:", error);
        alert("Erro ao deletar o registro.");
    }
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    // Setup modal close
    const modal = document.getElementById("contact-modal");
    const editModal = document.getElementById("edit-modal");
    
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
        if (event.target === editModal) {
            closeEditModal();
        }
    });
    
    // Setup filters e fetch
    document.querySelectorAll(".filter-input").forEach(el => el.addEventListener("input", refresh));
    document.querySelectorAll(".filter-input").forEach(el => el.addEventListener("change", refresh));
    fetchContacts();
    window.addEventListener("resize", () => refresh());
});

        (function() {
            // Verificar se o usuário veio de páginas permitidas
            const refererersPermitidos = ['Portal.html'];//, 'acompanhamento/index.html'];
            const paginaLogin = `../login/index.html`;   
            
            // Obter o referrer atual
            const referrerAtual = document.referrer;
            
            // Verificar se o referrer é válido
            const referrerValido = refererersPermitidos.some(ref => referrerAtual.includes(ref));
            
            // Redirecionar para login apenas se não houver referrer válido
            if (!referrerAtual || !referrerValido) {
                if (!window.location.href.includes('login')) {
                    window.location.replace(paginaLogin);
                }
            }
        })();