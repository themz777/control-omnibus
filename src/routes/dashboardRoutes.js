const express = require('express');
const { getVisibleRecords } = require('../services/recordService');
const { getAllNotifications } = require('../services/notificationService');
const { getActiveCompanies } = require('../services/companyService');
const { ESTADOS } = require('../config/constants');

const router = express.Router();

router.get('/summary', (req, res) => {
  const records = getVisibleRecords();
  const notifications = getAllNotifications();

  const total = records.length;
  const enHora = records.filter((r) => r.estado === ESTADOS.EN_HORA).length;
  const atrasados = records.filter((r) => r.estado === ESTADOS.ATRASADO).length;
  const cancelados = records.filter((r) => r.estado === ESTADOS.CANCELADO).length;
  const conPuntualidad = records.filter((r) => typeof r.puntualidadMin === 'number');
  const puntualidadPromedio = conPuntualidad.length
    ? Math.round(conPuntualidad.reduce((acc, item) => acc + item.puntualidadMin, 0) / conPuntualidad.length)
    : 0;

  res.json({
    ok: true,
    data: {
      total,
      enHora,
      atrasados,
      cancelados,
      puntualidadPromedio,
      totalAlertas: notifications.length
    }
  });
});

router.get('/companies', (req, res) => {
  res.json({ ok: true, data: getActiveCompanies() });
});

module.exports = router;
