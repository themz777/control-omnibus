const { EVENTOS, ESTADOS } = require('../config/constants');
const { reminderMinutesBefore, delayThresholdMinutes } = require('../config/systemConfig');
const { minutesUntilDateTime } = require('../utils/timeUtils');
const { addNotification } = require('./notificationService');
const { sendWhatsAppText, buildReminderMessage, buildDelayMessage, buildCancellationMessage } = require('./whatsappService');

async function attemptNotification(record, motivo, message, sentField) {
  try {
    const result = await sendWhatsAppText(record.telefonoUsuario, message);
    addNotification({
      recordId: record.id,
      tipo: 'WHATSAPP',
      motivo,
      destinatario: record.telefonoUsuario,
      nombrePasajero: record.nombrePasajero,
      estado: result.simulated ? 'SIMULADO' : 'ENVIADO',
      mensaje: message
    });
    return { sent: true, field: sentField };
  } catch (error) {
    addNotification({
      recordId: record.id,
      tipo: 'WHATSAPP',
      motivo,
      destinatario: record.telefonoUsuario,
      nombrePasajero: record.nombrePasajero,
      estado: 'ERROR',
      mensaje: error.message
    });
    return { sent: false, field: sentField };
  }
}

async function processReminder(record) {
  if (!record.telefonoUsuario || record.recordatorioEnviado) return { sent: false };
  if (record.estado === ESTADOS.CANCELADO || record.estado === ESTADOS.SALIO) return { sent: false };

  const remaining = minutesUntilDateTime(record.fechaViaje, record.horaProgramada);
  if (remaining === null) return { sent: false };
  if (remaining <= reminderMinutesBefore && remaining >= 0) {
    return attemptNotification(record, EVENTOS.RECORDATORIO, buildReminderMessage(record), 'recordatorioEnviado');
  }
  return { sent: false };
}

async function processDelay(record) {
  if (!record.telefonoUsuario || record.alertaAtrasoEnviada) return { sent: false };
  if (record.estado === ESTADOS.ATRASADO && Number(record.puntualidadMin || 0) >= delayThresholdMinutes) {
    return attemptNotification(record, EVENTOS.ATRASO, buildDelayMessage(record), 'alertaAtrasoEnviada');
  }
  return { sent: false };
}

async function processCancellation(record) {
  if (!record.telefonoUsuario || record.alertaCancelacionEnviada) return { sent: false };
  if (record.estado === ESTADOS.CANCELADO) {
    return attemptNotification(record, EVENTOS.CANCELACION, buildCancellationMessage(record), 'alertaCancelacionEnviada');
  }
  return { sent: false };
}

module.exports = { processReminder, processDelay, processCancellation };
