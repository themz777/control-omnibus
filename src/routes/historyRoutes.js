const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getAllHistory } = require('../services/historyService');

const router = express.Router();
router.get('/', requireAuth, (req, res) => res.json({ ok: true, data: getAllHistory() }));
module.exports = router;
