const socket = io();
const displayTableBody = document.getElementById('displayTableBody');
const alertBanner = document.getElementById('alertBanner');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeModal = document.getElementById('closeModal');
const modalCompanyLinks = document.getElementById('modalCompanyLinks');
const sidebarCompanyLinks = document.getElementById('sidebarCompanyLinks');

let companiesCache = [];
let activeRecords = [];
let pdfSchedules = [];

function getCompanyLogo(name) {
  const company = companiesCache.find((c) => c.name === name || c.name.includes(name));
  return company && company.logo ? `/assets/logos/${company.logo}` : null;
}

function renderModalCompanyLinks() {
  const html = companiesCache.map((company) => {
    if (!company.links || !company.links.length) return '';
    const nameOnly = company.name.split('(')[0].trim();
    return `
      <div class="sidebar-company-item">
        <div class="sidebar-company-head">
          ${company.logo ? `<img src="/assets/logos/${company.logo}" class="company-logo" style="width:18px; height:18px;">` : ''}
          <span>${escapeHtml(nameOnly)}</span>
        </div>
        <div class="sidebar-company-links">
          ${company.links.map((link) => {
            let label = 'Sitio Web';
            if (link.includes('facebook')) label = 'Facebook';
            if (link.includes('instagram')) label = 'Instagram';
            if (link.includes('plataforma10')) label = 'Plataforma 10';
            if (link.includes('destinos')) label = 'Destinos';
            if (link.includes('agencias')) label = 'Agencias';
            return `<a href="${link}" class="btn-link" target="_blank">${label}</a>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  if (modalCompanyLinks) modalCompanyLinks.innerHTML = html;
  if (sidebarCompanyLinks) sidebarCompanyLinks.innerHTML = html;
}





function showAlertBanner(message, estado) {
  alertBanner.textContent = message;
  alertBanner.className = 'alert-banner';
  alertBanner.classList.add(estado === 'CANCELADO' ? 'alert-danger' : 'alert-warning');
}

function hideAlertBanner() {
  alertBanner.textContent = '';
  alertBanner.className = 'alert-banner hidden';
}

function renderDisplayTable(records) {
  if (!records.length) {
    displayTableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No hay salidas activas en este momento.</td></tr>';
    hideAlertBanner();
    return;
  }
  displayTableBody.innerHTML = records.map((record) => {
    const logoUrl = getCompanyLogo(record.empresa);
    return `
      <tr>
        <td>
          <div class="company-info">
            ${logoUrl ? `<img src="${logoUrl}" class="company-logo" alt="${record.empresa}">` : ''}
            <span>${escapeHtml(record.empresa)}</span>
          </div>
        </td>
        <td>${escapeHtml(`${record.origen} → ${record.destino}`)}</td>
        <td>${escapeHtml(record.fechaViaje || '-')}</td>
        <td>${escapeHtml(record.horaProgramada || '-')}</td>
        <td>${escapeHtml(record.horaReal || '-')}</td>
        <td>${statusBadge(record.estado)}</td>
        <td>${escapeHtml(record.observacion || '-')}</td>
      </tr>
    `;
  }).join('');

  const critical = records.find((r) => r.estado === 'CANCELADO' || r.estado === 'ATRASADO');
  if (critical) {
    showAlertBanner(`ALERTA: ${critical.empresa} | ${critical.origen} → ${critical.destino} | ${critical.estado}`, critical.estado);
  } else {
    hideAlertBanner();
  }
}

function renderDisplayKpis(records) {
  document.getElementById('displayKpiTotal').textContent = records.length;
  document.getElementById('displayKpiEnHora').textContent = records.filter((r) => r.estado === 'EN_HORA').length;
  document.getElementById('displayKpiAtrasados').textContent = records.filter((r) => r.estado === 'ATRASADO').length;
  document.getElementById('displayKpiCancelados').textContent = records.filter((r) => r.estado === 'CANCELADO').length;
}

async function loadDisplay() {
  try {
    if (!companiesCache.length) {
      const compRes = await API.getCompanies();
      companiesCache = compRes.data || [];
    }
    // Cargar horarios del PDF
    if (!pdfSchedules.length) {
      try {
        const schRes = await fetch('/schedules.json'); // Cambiado a /schedules.json
        pdfSchedules = await schRes.json();
        console.log("PDF Schedules cargados:", pdfSchedules.length);
      } catch (e) {
        console.error("No se pudo cargar schedules.json, usando backup vacío", e);
      }
    }
    const response = await API.getVisibleRecords();
    activeRecords = response.data || [];
    renderDisplayTable(activeRecords);
    renderDisplayKpis(activeRecords);
    renderModalCompanyLinks();
  } catch (error) {
    console.error(error.message);
  }
}

function updateClock() {
  const now = new Date();
  document.getElementById('displayClock').textContent = now.toLocaleTimeString('es-PY', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  document.getElementById('displayDate').textContent = now.toLocaleDateString('es-PY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

socket.on('records:updated', (records) => {
  activeRecords = records || [];
  renderDisplayTable(activeRecords);
  renderDisplayKpis(activeRecords);
});

socket.on('dashboard:refresh', async () => { await loadDisplay(); });
infoBtn?.addEventListener('click', () => infoModal.classList.add('active'));
closeModal?.addEventListener('click', () => infoModal.classList.remove('active'));
window.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.remove('active'); });

// --- Buscador Logic (Basado en PDF) ---
function handleSearch() {
  // En el layout premium, usamos el campo 'searchInputDestination' para buscar en el PDF
  const searchTerm = document.getElementById('searchInputDestination').value.toLowerCase().trim();
  const resultsContainer = document.getElementById('searchPdfResults');
  const resultsList = document.getElementById('pdfResultsList');

  if (!searchTerm) {
    resultsContainer.classList.add('hidden');
    return;
  }

  // Filtrar en la base de datos del PDF
  const filtered = pdfSchedules.filter(item => 
    item.destino.toLowerCase().includes(searchTerm) || 
    item.empresa.toLowerCase().includes(searchTerm)
  );

  if (filtered.length > 0) {
    resultsContainer.classList.remove('hidden');
    resultsList.innerHTML = filtered.map(item => `
      <div class="pdf-result-card">
        <span class="res-empresa">${escapeHtml(item.empresa)}</span>
        <span class="res-destino">${escapeHtml(item.destino)}</span>
        <div class="res-horarios">
          ${item.horarios.map(h => `<span class="res-time-badge">${h}</span>`).join('')}
        </div>
      </div>
    `).join('');
  } else {
    resultsList.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #64748b;">
        No se encontraron horarios para "${escapeHtml(searchTerm)}" en el cronograma oficial.
        <br>Por favor, consulte el PDF completo.
      </div>
    `;
    resultsContainer.classList.remove('hidden');
  }
}

document.getElementById('btnSearch')?.addEventListener('click', handleSearch);

// Eventos para todos los inputs del buscador premium
[
  'searchInputOrigin', 
  'searchInputDestination', 
  'searchInputDate'
].forEach(id => {
  document.getElementById(id)?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
});

setInterval(updateClock, 1000);
updateClock();
loadDisplay();

// --- Mega-Menu Tab Switching ---
document.querySelectorAll('.mega-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evitar que el menú se cierre al cambiar de pestaña
    const targetTab = btn.getAttribute('data-tab');
    
    // Actualizar botones
    document.querySelectorAll('.mega-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Actualizar paneles
    document.querySelectorAll('.mega-tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(targetTab)?.classList.add('active');
  });
});

// Evitar que el click dentro del mega-menu lo cierre si usamos hover
document.querySelector('.mega-menu')?.addEventListener('click', (e) => {
  e.stopPropagation();
});

// --- Mobile Menu Toggle ---
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('mobile-active');
    document.body.style.overflow = navLinks.classList.contains('mobile-active') ? 'hidden' : '';
  }
});

document.getElementById('closeMenuBtn')?.addEventListener('click', () => {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.remove('mobile-active');
    document.body.style.overflow = '';
  }
});

// Toggle sub-menus on mobile clicking the link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    if (window.innerWidth <= 992) {
      e.preventDefault();
      const parent = link.parentElement;
      if (parent) {
        // Close others
        document.querySelectorAll('.nav-item').forEach(item => {
          if (item !== parent) item.classList.remove('mobile-open');
        });
        parent.classList.toggle('mobile-open');
      }
    }
  });
});
