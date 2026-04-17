// Zona horaria de Paraguay — Ciudad del Este usa America/Asuncion (GMT-4 / GMT-3 en verano)
const TZ_PARAGUAY = 'America/Asuncion';

function parseTimeToMinutes(timeString) {
  if (!timeString || !/^\d{2}:\d{2}$/.test(String(timeString))) {
    return null;
  }
  const [hours, minutes] = String(timeString).split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function calculateDelayMinutes(horaProgramada, horaReal) {
  const p = parseTimeToMinutes(horaProgramada);
  const r = parseTimeToMinutes(horaReal);
  if (p === null || r === null) return 0;
  return r - p;
}

/** Timestamp ISO del momento actual (UTC). */
function nowIso() {
  return new Date().toISOString();
}

/**
 * Devuelve un objeto Date ajustado a la zona horaria de Paraguay.
 * Usar esta funcion para toda logica de negocio sensible al tiempo
 * (scheduler, recordatorios WhatsApp, transiciones de estado)
 * para garantizar el comportamiento correcto si el servidor
 * se despliega fuera de Paraguay.
 */
function nowParaguay() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ_PARAGUAY }));
}

/**
 * Hora actual en Paraguay formateada como "HH:mm".
 * Util para comparar con horaProgramada/horaReal de los registros.
 */
function currentTimeParaguay() {
  return new Date().toLocaleString('es-PY', {
    timeZone: TZ_PARAGUAY,
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function minutesBetweenDates(dateA, dateB) {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.floor((b - a) / 60000);
}

function combineDateAndTime(fecha, hora) {
  if (!fecha || !hora) return null;
  const date = new Date(`${fecha}T${hora}:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function minutesUntilDateTime(fecha, hora) {
  const target = combineDateAndTime(fecha, hora);
  if (!target) return null;
  return Math.floor((target.getTime() - nowParaguay().getTime()) / 60000);
}

module.exports = {
  TZ_PARAGUAY,
  parseTimeToMinutes,
  calculateDelayMinutes,
  nowIso,
  nowParaguay,
  currentTimeParaguay,
  minutesBetweenDates,
  combineDateAndTime,
  minutesUntilDateTime,
};
