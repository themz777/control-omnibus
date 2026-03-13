function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').replace(/\+/g, '').trim();
}

function validateParaguayPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^\d{10,15}$/.test(normalized);
}

function validateRecordInput(data) {
  const errors = [];

  if (!data.empresa || String(data.empresa).trim() === '') errors.push('La empresa es obligatoria');
  if (!data.origen || String(data.origen).trim() === '') errors.push('El origen es obligatorio');
  if (!data.destino || String(data.destino).trim() === '') errors.push('El destino es obligatorio');
  if (!data.fechaViaje || String(data.fechaViaje).trim() === '') {
    errors.push('La fecha del viaje es obligatoria');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.fechaViaje).trim())) {
    errors.push('La fecha del viaje debe tener formato AAAA-MM-DD');
  } else {
    const parsedDate = new Date(data.fechaViaje + 'T00:00:00');
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('La fecha del viaje no es válida');
    }
  }
  if (!data.horaProgramada || !/^\d{2}:\d{2}$/.test(String(data.horaProgramada))) {
    errors.push('La hora programada es obligatoria y debe tener formato HH:mm');
  }
  if (!data.nombrePasajero || String(data.nombrePasajero).trim() === '') {
    errors.push('El nombre del pasajero es obligatorio');
  }
  if (!data.telefonoUsuario || !validateParaguayPhone(data.telefonoUsuario)) {
    errors.push('El teléfono del usuario es obligatorio y debe ser numérico');
  }
  if (
    data.origen && data.destino &&
    String(data.origen).trim().toLowerCase() === String(data.destino).trim().toLowerCase()
  ) {
    errors.push('El origen y destino no pueden ser iguales');
  }

  return errors;
}

module.exports = { normalizePhone, validateParaguayPhone, validateRecordInput };
