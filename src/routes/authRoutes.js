const express = require('express');
const { adminUser, adminPassword, sessionToken } = require('../config/systemConfig');

const router = express.Router();

// Rate limiter simple en memoria (sin dependencias externas)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minuto

function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  loginAttempts.set(ip, entry);

  if (entry.count > MAX_ATTEMPTS) {
    return res.status(429).json({ ok: false, message: 'Demasiados intentos. Intente en 1 minuto.' });
  }
  next();
}

router.post('/login', rateLimitLogin, (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser && password === adminPassword) {
    return res.json({ ok: true, token: sessionToken, user: { username: adminUser } });
  }
  return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
});

module.exports = router;
