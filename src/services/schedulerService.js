const { schedulerIntervalSeconds, autoHideSalioMin, autoHideCanceladoMin } = require('../config/systemConfig');
const { getAllRecords, saveAllRecords, toPublicRecord } = require('./recordService');
const { processReminder, processDelay, processCancellation } = require('./alertService');
const { applyAutoCleanup } = require('./cleanupService');

let started = false;

async function schedulerTick(io) {
  let records = getAllRecords();
  let changed = false;

  for (const record of records) {
    try {
      const reminderResult = await processReminder(record);
      if (reminderResult.field) {
        record[reminderResult.field] = true;
        changed = true;
      }

      const delayResult = await processDelay(record);
      if (delayResult.field) {
        record[delayResult.field] = true;
        changed = true;
      }

      const cancelResult = await processCancellation(record);
      if (cancelResult.field) {
        record[cancelResult.field] = true;
        changed = true;
      }
    } catch (error) {
      console.error('Error procesando alertas:', error.message);
    }
  }

  const cleanupResult = applyAutoCleanup(records, autoHideSalioMin, autoHideCanceladoMin);
  if (cleanupResult.changed) {
    records = cleanupResult.records;
    changed = true;
  }

  if (changed) {
    saveAllRecords(records);
    io.emit('records:updated', records.filter((r) => r.visibleEnPanel !== false).map(toPublicRecord));
    io.emit('dashboard:refresh');
  }
}

function startScheduler(io) {
  if (started) return;
  started = true;
  setInterval(() => {
    schedulerTick(io).catch((error) => console.error('Error en scheduler:', error.message));
  }, schedulerIntervalSeconds * 1000);
}

module.exports = { startScheduler, schedulerTick };
