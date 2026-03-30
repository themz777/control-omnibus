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
        <td>${escapeHtml(`${record.origen} â†’ ${record.destino}`)}</td>
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
    showAlertBanner(`ALERTA: ${critical.empresa} | ${critical.origen} â†’ ${critical.destino} | ${critical.estado}`, critical.estado);
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
        console.error("No se pudo cargar schedules.json, usando backup vacÃ­o", e);
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
    e.stopPropagation(); // Evitar que el menÃº se cierre al cambiar de pestaÃ±a
    const targetTab = btn.getAttribute('data-tab');
    
    // Actualizar botones
    document.querySelectorAll('.mega-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Actualizar paneles
    document.querySelectorAll('.mega-tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(targetTab)?.classList.add('active');
  });
});


// --- MOBILE DRAWER ---
(function () {
  const drawer   = document.getElementById('mobileDrawer');
  const overlay  = document.getElementById('mobileOverlay');
  const openBtn  = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('mobCloseBtn');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  openBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);

  // Section tabs: Menu <-> Institucional
  document.querySelectorAll('.mob-section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mob-section-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.section;
      document.querySelectorAll('.mob-section').forEach(s => s.classList.add('hidden'));
      const targetSection = document.getElementById('mob-section-' + target);
      if (targetSection) targetSection.classList.remove('hidden');
    });
  });

  // Sub-tabs: Buscar / Info / Empresas
  // IMPORTANT: scope to #mob-section-menu only, never touch institucional panels
  const menuSection = document.getElementById('mob-section-menu');
  document.querySelectorAll('.mob-sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mob-sub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const panelId = btn.dataset.panel;
      // Only remove active from panels inside the menu section
      menuSection?.querySelectorAll('.mob-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
    });
  });

  // Search in mobile drawer (reuses pdfSchedules from main display.js scope)
  document.getElementById('mobBtnSearch')?.addEventListener('click', () => {
    const origin  = (document.getElementById('mobOrigin')?.value  || '').trim().toLowerCase();
    const dest    = (document.getElementById('mobDestination')?.value || '').trim().toLowerCase();
    const date    = (document.getElementById('mobDate')?.value || '').trim();
    const results = document.getElementById('mobSearchResults');
    if (!results) return;

    const filtered = (typeof pdfSchedules !== 'undefined' ? pdfSchedules : []).filter(s => {
      const matchOrig = !origin || (s.origen || '').toLowerCase().includes(origin);
      const matchDest = !dest   || (s.destino || '').toLowerCase().includes(dest);
      const matchDate = !date   || (s.fecha || '') === date;
      return matchOrig && matchDest && matchDate;
    });

    results.classList.remove('hidden');
    if (!filtered.length) {
      results.innerHTML = '<p style="color:#64748b;font-size:0.9rem;">Sin resultados para esa bÃºsqueda.</p>';
      return;
    }
    results.innerHTML = filtered.slice(0, 10).map(s => `
      <div style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;font-size:0.88rem;">
        <strong>${escapeHtml(s.empresa || '-')}</strong><br>
        ${escapeHtml(s.origen || '-')} &rarr; ${escapeHtml(s.destino || '-')}<br>
        <span style="color:#64748b">${escapeHtml(s.horaProgramada || '-')}</span>
      </div>
    `).join('');
  });

  // Populate mobile companies list when companies cache is loaded
  function populateMobCompanies() {
    const grid = document.getElementById('mobCompanyLinks');
    if (!grid || typeof companiesCache === 'undefined') return;
    grid.innerHTML = companiesCache.map(company => {
      if (!company.links?.length) return '';
      const name = company.name.split('(')[0].trim();
      const logo = company.logo ? `<img src="/assets/logos/${company.logo}" style="width:18px;height:18px;border-radius:3px;"> ` : '';
      const links = company.links.map(link => {
        let label = 'Web';
        if (link.includes('facebook'))    label = 'Facebook';
        if (link.includes('instagram'))   label = 'Instagram';
        if (link.includes('plataforma10'))label = 'Plataforma 10';
        return `<a href="${link}" target="_blank" style="color:#0f6fd8;font-size:0.8rem;margin-right:8px;">${label}</a>`;
      }).join('');
      return `<div style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:0.88rem;">
        ${logo}<strong>${escapeHtml(name)}</strong><br><span style="color:#64748b">${links}</span></div>`;
    }).join('');
  }

  // Hook into the existing fetchCompanies flow
  const origRenderModal = window.renderModalCompanyLinks;
  const checkInterval = setInterval(() => {
    if (typeof companiesCache !== 'undefined' && companiesCache.length) {
      populateMobCompanies();
      clearInterval(checkInterval);
    }
  }, 500);
})();
