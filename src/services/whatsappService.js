const { whatsappEnabled, whatsappToken, whatsappPhoneNumberId } = require('../config/systemConfig');

async function sendWhatsAppText(to, body) {
  if (!whatsappEnabled) {
    return { ok: true, simulated: true, message: 'WhatsApp deshabilitado, envío simulado' };
  }

  if (!whatsappToken || !whatsappPhoneNumberId) {
    throw new Error('Faltan credenciales de WhatsApp');
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${whatsappToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Error al enviar WhatsApp');
  }

  return data;
}

function buildReminderMessage(record) {
  return `Hola ${record.nombrePasajero}, le recordamos su viaje con ${record.empresa} desde ${record.origen} hacia ${record.destino} el ${record.fechaViaje} a las ${record.horaProgramada}. Andén: ${record.anden || 'Por confirmar'}.`;
}

function buildDelayMessage(record) {
  return `Hola ${record.nombrePasajero}, su viaje con ${record.empresa} desde ${record.origen} hacia ${record.destino} presenta un atraso de ${record.puntualidadMin} minutos. Salida programada: ${record.fechaViaje} ${record.horaProgramada}.`;
}

function buildCancellationMessage(record) {
  return `Hola ${record.nombrePasajero}, le informamos que su viaje con ${record.empresa} desde ${record.origen} hacia ${record.destino}, programado para el ${record.fechaViaje} a las ${record.horaProgramada}, ha sido cancelado.`;
}

module.exports = {
  sendWhatsAppText,
  buildReminderMessage,
  buildDelayMessage,
  buildCancellationMessage
};
