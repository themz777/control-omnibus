const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getAllNotifications } = require('../services/notificationService');

const router = express.Router();
router.get('/', requireAuth, (req, res) => res.json({ ok: true, data: getAllNotifications() }));
module.exports = router;
