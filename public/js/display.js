const socket = io();
const displayTableBody = document.getElementById('displayTableBody');
const alertBanner = document.getElementById('alertBanner');

let companiesCache = [];

function getCompanyLogo(name) {
  const company = companiesCache.find((c) => c.name === name);
  return company && company.logo ? `/assets/logos/${company.logo}` : null;
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
    const response = await API.getVisibleRecords();
    const records = response.data || [];
    renderDisplayTable(records);
    renderDisplayKpis(records);
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
  renderDisplayTable(records || []);
  renderDisplayKpis(records || []);
});

socket.on('dashboard:refresh', async () => { await loadDisplay(); });
setInterval(updateClock, 1000);
updateClock();
loadDisplay();
