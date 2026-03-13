const socket = io();

const recordForm = document.getElementById('recordForm');
const formMessage = document.getElementById('formMessage');
const recordsTableBody = document.getElementById('recordsTableBody');
const historyList = document.getElementById('historyList');
const notificationList = document.getElementById('notificationList');
const logoutBtn = document.getElementById('logoutBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');
const filterEmpresa = document.getElementById('filterEmpresa');
const filterEstado = document.getElementById('filterEstado');
const empresaSelect = document.getElementById('empresa');

let allRecordsCache = [];
let companiesDataCache = [];

function getCompanyLogo(name) {
  const company = companiesDataCache.find((c) => c.name === name);
  return company && company.logo ? `/assets/logos/${company.logo}` : null;
}

function ensureAuth() {
  if (!localStorage.getItem('admin_token')) {
    window.location.href = '/login.html';
  }
}



function textCell(text) {
  return `<span>${escapeHtml(text)}</span>`;
}

function getFormData() {
  return {
    empresa: empresaSelect.value,
    origen: document.getElementById('origen').value.trim(),
    destino: document.getElementById('destino').value.trim(),
    fechaViaje: document.getElementById('fechaViaje').value,
    horaProgramada: document.getElementById('horaProgramada').value,
    horaReal: document.getElementById('horaReal').value,
    estado: document.getElementById('estado').value,
    minutosAtrasoManual: document.getElementById('minutosAtrasoManual').value,
    observacion: document.getElementById('observacion').value.trim(),
    nombrePasajero: document.getElementById('nombrePasajero').value.trim(),
    telefonoUsuario: document.getElementById('telefonoUsuario').value.trim()
  };
}

function resetForm() {
  recordForm.reset();
  document.getElementById('recordId').value = '';
  formTitle.textContent = 'Registrar viaje';
  formMessage.textContent = '';
  formMessage.className = 'message';
}

function showMessage(text, type = 'success') {
  formMessage.textContent = text;
  formMessage.className = 'message';
  formMessage.classList.add(type);
}

function renderKpis(summary) {
  document.getElementById('kpiTotal').textContent = summary.total ?? 0;
  document.getElementById('kpiEnHora').textContent = summary.enHora ?? 0;
  document.getElementById('kpiAtrasados').textContent = summary.atrasados ?? 0;
  document.getElementById('kpiCancelados').textContent = summary.cancelados ?? 0;
  document.getElementById('kpiPuntualidad').textContent = `${summary.puntualidadPromedio ?? 0} min`;
  document.getElementById('kpiAlertas').textContent = summary.totalAlertas ?? 0;
}



function applyFilters(records) {
  return records.filter((record) => {
    const companyOk = !filterEmpresa.value || record.empresa === filterEmpresa.value;
    const statusOk = !filterEstado.value || record.estado === filterEstado.value;
    return companyOk && statusOk;
  });
}

function renderTable(records) {
  const filtered = applyFilters(records);
  if (!filtered.length) {
    recordsTableBody.innerHTML = '<tr><td colspan="10" class="empty-cell">No hay viajes registrados.</td></tr>';
    return;
  }

  recordsTableBody.innerHTML = filtered.map((record) => {
    const logoUrl = getCompanyLogo(record.empresa);
    return `
      <tr>
        <td>
          <div class="company-info">
            ${logoUrl ? `<img src="${logoUrl}" class="company-logo" alt="${record.empresa}">` : ''}
            <span>${escapeHtml(record.empresa)}</span>
          </div>
        </td>
        <td>${textCell(`${record.origen} → ${record.destino}`)}</td>
        <td>${textCell(record.fechaViaje || '-')}</td>
        <td>${textCell(record.horaProgramada || '-')}</td>
        <td>${textCell(record.horaReal || '-')}</td>
        <td>${statusBadge(record.estado)}</td>
        <td>${textCell(record.nombrePasajero || '-')}</td>
        <td>${textCell(record.telefonoUsuario || '-')}</td>
        <td>${textCell(`${record.puntualidadMin ?? 0} min`)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-small btn-secondary" onclick="editRecord('${escapeHtml(record.id)}')">Editar</button>
            <button class="btn btn-small btn-danger" onclick="removeRecord('${escapeHtml(record.id)}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderHistory(items) {
  if (!items.length) {
    historyList.innerHTML = '<p class="empty-list">Sin historial.</p>';
    return;
  }
  historyList.innerHTML = items.slice(0, 10).map((item) => `
    <div class="list-item">
      <strong>${escapeHtml(item.accion)}</strong>
      <p>${escapeHtml(item.descripcion)}</p>
      <small>${escapeHtml(new Date(item.timestamp).toLocaleString())}</small>
    </div>
  `).join('');
}

function renderNotifications(items) {
  if (!items.length) {
    notificationList.innerHTML = '<p class="empty-list">Sin notificaciones.</p>';
    return;
  }
  notificationList.innerHTML = items.slice(0, 10).map((item) => `
    <div class="list-item">
      <strong>${escapeHtml(item.motivo)} - ${escapeHtml(item.estado)}</strong>
      <p>${escapeHtml(item.nombrePasajero || 'Usuario')} - ${escapeHtml(item.destinatario || '-')}</p>
      <small>${escapeHtml(new Date(item.timestamp).toLocaleString())}</small>
    </div>
  `).join('');
}

async function loadCompanies() {
  const response = await API.getCompanies();
  companiesDataCache = response.data || [];
  const companies = companiesDataCache;
  empresaSelect.innerHTML = '<option value="">Seleccione...</option>';
  filterEmpresa.innerHTML = '<option value="">Todas</option>';
  companies.forEach((company) => {
    const option1 = document.createElement('option');
    option1.value = company.name;
    option1.textContent = company.name;
    empresaSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = company.name;
    option2.textContent = company.name;
    filterEmpresa.appendChild(option2);
  });
}

async function loadRecords() {
  const response = await API.getAllRecords();
  allRecordsCache = response.data;
  renderTable(allRecordsCache);
}

async function loadSummary() {
  const response = await API.getSummary();
  renderKpis(response.data);
}

async function loadHistory() {
  const response = await API.getHistory();
  renderHistory(response.data);
}

async function loadNotifications() {
  const response = await API.getNotifications();
  renderNotifications(response.data);
}

async function loadAll() {
  try {
    await Promise.all([loadRecords(), loadSummary(), loadHistory(), loadNotifications()]);
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

window.editRecord = function editRecord(id) {
  const record = allRecordsCache.find((item) => item.id === id);
  if (!record) return;
  document.getElementById('recordId').value = record.id;
  empresaSelect.value = record.empresa || '';
  document.getElementById('origen').value = record.origen || '';
  document.getElementById('destino').value = record.destino || '';
  document.getElementById('fechaViaje').value = record.fechaViaje || '';
  document.getElementById('horaProgramada').value = record.horaProgramada || '';
  document.getElementById('horaReal').value = record.horaReal || '';
  document.getElementById('estado').value = record.estado || 'PROGRAMADO';
  document.getElementById('minutosAtrasoManual').value = record.minutosAtrasoManual || 0;
  document.getElementById('observacion').value = record.observacion || '';
  document.getElementById('nombrePasajero').value = record.nombrePasajero || '';
  document.getElementById('telefonoUsuario').value = record.telefonoUsuario || '';
  formTitle.textContent = 'Editar viaje';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.removeRecord = async function removeRecord(id) {
  if (!window.confirm('¿Deseas eliminar este viaje?')) return;
  try {
    await API.deleteRecord(id);
    showMessage('Viaje eliminado correctamente');
    await loadAll();
  } catch (error) {
    showMessage(error.message, 'error');
  }
};

recordForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('recordId').value;
  const payload = getFormData();
  try {
    if (id) {
      await API.updateRecord(id, payload);
      showMessage('Viaje actualizado correctamente');
    } else {
      await API.createRecord(payload);
      showMessage('Viaje registrado correctamente');
    }
    resetForm();
    await loadAll();
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

cancelEditBtn?.addEventListener('click', resetForm);
logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.href = '/login.html';
});
filterEmpresa?.addEventListener('change', () => renderTable(allRecordsCache));
filterEstado?.addEventListener('change', () => renderTable(allRecordsCache));
socket.on('records:updated', async () => { await loadAll(); });
socket.on('dashboard:refresh', async () => { await loadAll(); });

(async function init() {
  ensureAuth();
  try {
    await loadCompanies();
    await loadAll();
  } catch (error) {
    showMessage('Error al cargar datos iniciales: ' + error.message, 'error');
  }
})();
