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

function nowIso() {
  return new Date().toISOString();
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
  return Math.floor((target.getTime() - Date.now()) / 60000);
}

module.exports = {
  parseTimeToMinutes,
  calculateDelayMinutes,
  nowIso,
  minutesBetweenDates,
  combineDateAndTime,
  minutesUntilDateTime
};
