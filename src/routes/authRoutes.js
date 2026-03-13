const express = require('express');
const { adminUser, adminPassword, sessionToken } = require('../config/systemConfig');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser && password === adminPassword) {
    return res.json({ ok: true, token: sessionToken, user: { username: adminUser } });
  }
  return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
});

module.exports = router;
