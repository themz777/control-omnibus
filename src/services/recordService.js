const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');
const { generateId } = require('../utils/idGenerator');
const { nowIso, calculateDelayMinutes } = require('../utils/timeUtils');
const { validateRecordInput, normalizePhone } = require('../utils/validators');
const { ESTADOS, EVENTOS } = require('../config/constants');
const { delayThresholdMinutes } = require('../config/systemConfig');
const { addHistoryEntry } = require('./historyService');
const { isValidCompany } = require('./companyService');

const RECORDS_PATH = path.resolve(__dirname, '../data/records.json');

function getAllRecords() {
  return readJson(RECORDS_PATH, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getVisibleRecords() {
  return getAllRecords().filter((record) => record.visibleEnPanel !== false);
}

function getRecordById(id) {
  return getAllRecords().find((record) => record.id === id) || null;
}

function toPublicRecord(record) {
  return {
    id: record.id,
    empresa: record.empresa,
    origen: record.origen,
    destino: record.destino,
    fechaViaje: record.fechaViaje || '',
    horaProgramada: record.horaProgramada,
    horaReal: record.horaReal,
    anden: record.anden,
    estado: record.estado,
    evento: record.evento,
    observacion: record.observacion,
    puntualidadMin: record.puntualidadMin,
    minutosAtrasoManual: record.minutosAtrasoManual || 0,
    visibleEnPanel: record.visibleEnPanel,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function normalizeRecordPayload(data, existingRecord = null) {
  const horaProgramada = String(data.horaProgramada || '').trim();
  const horaReal = String(data.horaReal || '').trim();
  const fechaViaje = String(data.fechaViaje || '').trim();
  const minutosAtrasoManual = Number(data.minutosAtrasoManual || 0);

  let puntualidadMin = 0;
  if (horaProgramada && horaReal) {
    puntualidadMin = calculateDelayMinutes(horaProgramada, horaReal);
  } else if (minutosAtrasoManual > 0) {
    puntualidadMin = minutosAtrasoManual;
  }

  let estado = String(data.estado || '').trim().toUpperCase();
  let evento = EVENTOS.NINGUNO;

  if (!estado) estado = ESTADOS.PROGRAMADO;

  if (estado === ESTADOS.CANCELADO) {
    evento = EVENTOS.CANCELACION;
  } else if (estado === ESTADOS.ATRASADO || puntualidadMin >= delayThresholdMinutes) {
    estado = ESTADOS.ATRASADO;
    evento = EVENTOS.ATRASO;
  } else if (horaReal && puntualidadMin <= 0) {
    estado = ESTADOS.EN_HORA;
  }

  return {
    empresa: String(data.empresa || '').trim(),
    origen: String(data.origen || '').trim(),
    destino: String(data.destino || '').trim(),
    fechaViaje,
    horaProgramada,
    horaReal,
    anden: String(data.anden || '').trim(),
    estado,
    evento,
    observacion: String(data.observacion || '').trim(),
    puntualidadMin,
    minutosAtrasoManual,
    visibleEnPanel: true,
    nombrePasajero: String(data.nombrePasajero || '').trim(),
    telefonoUsuario: normalizePhone(data.telefonoUsuario),
    recordatorioEnviado: existingRecord ? existingRecord.recordatorioEnviado : false,
    alertaAtrasoEnviada: existingRecord ? existingRecord.alertaAtrasoEnviada : false,
    alertaCancelacionEnviada: existingRecord ? existingRecord.alertaCancelacionEnviada : false
  };
}

function assertValidPayload(data) {
  const errors = validateRecordInput(data);
  if (!isValidCompany(data.empresa)) {
    errors.push('La empresa no está habilitada en el sistema');
  }
  if (errors.length) {
    const err = new Error(errors.join('. '));
    err.status = 400;
    throw err;
  }
}

function createRecord(data) {
  assertValidPayload(data);
  const records = getAllRecords();
  const normalized = normalizeRecordPayload(data);
  const timestamp = nowIso();
  const record = {
    id: generateId('trip'),
    ...normalized,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  records.push(record);
  writeJson(RECORDS_PATH, records);
  addHistoryEntry({
    recordId: record.id,
    accion: 'CREACION_VIAJE',
    descripcion: `Se creó el viaje ${record.empresa} ${record.origen} → ${record.destino}`,
    usuario: 'admin'
  });
  return record;
}

function updateRecord(id, data) {
  const records = getAllRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) {
    const err = new Error('Viaje no encontrado');
    err.status = 404;
    throw err;
  }

  const current = records[index];
  const merged = { ...current, ...data };
  assertValidPayload(merged);
  const normalized = normalizeRecordPayload(merged, current);

  const updated = {
    ...current,
    ...normalized,
    updatedAt: nowIso()
  };

  records[index] = updated;
  writeJson(RECORDS_PATH, records);
  addHistoryEntry({
    recordId: updated.id,
    accion: 'ACTUALIZACION_VIAJE',
    descripcion: `Se actualizó el viaje ${updated.empresa} ${updated.origen} → ${updated.destino}`,
    usuario: 'admin'
  });
  return updated;
}

function deleteRecord(id) {
  const records = getAllRecords();
  const record = records.find((item) => item.id === id);
  if (!record) {
    const err = new Error('Viaje no encontrado');
    err.status = 404;
    throw err;
  }

  const filtered = records.filter((item) => item.id !== id);
  writeJson(RECORDS_PATH, filtered);
  addHistoryEntry({
    recordId: id,
    accion: 'ELIMINACION_VIAJE',
    descripcion: `Se eliminó el viaje ${record.empresa} ${record.origen} → ${record.destino}`,
    usuario: 'admin'
  });
  return record;
}

function saveAllRecords(records) {
  writeJson(RECORDS_PATH, records);
}

module.exports = {
  getAllRecords,
  getVisibleRecords,
  getRecordById,
  toPublicRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  saveAllRecords
};
