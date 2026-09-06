const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getAllNotifications, clearNotifications } = require('../services/notificationService');

const router = express.Router();
router.get('/', requireAuth, (req, res) => res.json({ ok: true, data: getAllNotifications() }));

router.delete('/', requireAuth, (req, res) => {
  const deleted = clearNotifications();
  const io = req.app.get('io');
  io.emit('dashboard:refresh');
  res.json({ ok: true, data: { deleted } });
});

module.exports = router;
