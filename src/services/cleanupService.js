const { ESTADOS } = require('../config/constants');
const { minutesBetweenDates, minutesUntilDateTime } = require('../utils/timeUtils');

function applyAutoCleanup(records, autoHideSalioMin, autoHideCanceladoMin) {
  const now = new Date().toISOString();
  let changed = false;
  
  const cleaned = records.map((record) => {
    // 1) Auto-Transitions — respetar decisiones manuales del administrador
    const puedeAutoTransicionar = !record.estadoForzadoManual &&
      record.estado !== ESTADOS.SALIO &&
      record.estado !== ESTADOS.CANCELADO;

    if (puedeAutoTransicionar) {
      const remaining = minutesUntilDateTime(record.fechaViaje, record.horaProgramada);
      if (remaining !== null) {
        let targetStatus = record.estado;
        
        if (remaining <= 10 && remaining > 0) {
          targetStatus = ESTADOS.EMBARCANDO;
        } else if (remaining <= 0 && remaining > -5) {
          targetStatus = ESTADOS.EN_HORA;
        } else if (remaining <= -5) {
          targetStatus = ESTADOS.SALIO;
        }

        if (record.estado !== targetStatus) {
          record.estado = targetStatus;
          record.updatedAt = now;
          changed = true;
        }
      }
    }

    // 2) Auto-Hide records that are SALIO or CANCELADO and have passed their grace period
    if (record.visibleEnPanel !== false) {
      if (record.estado === ESTADOS.SALIO && minutesBetweenDates(record.updatedAt, now) >= autoHideSalioMin) {
        changed = true;
        return { ...record, visibleEnPanel: false };
      }
      if (record.estado === ESTADOS.CANCELADO && minutesBetweenDates(record.updatedAt, now) >= autoHideCanceladoMin) {
        changed = true;
        return { ...record, visibleEnPanel: false };
      }
    }
    return record;
  });
  
  return { records: cleaned, changed };
}

module.exports = { applyAutoCleanup };
