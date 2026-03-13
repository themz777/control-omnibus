const { sessionToken } = require('../config/systemConfig');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token !== sessionToken) {
    return res.status(401).json({ ok: false, message: 'No autorizado' });
  }
  next();
}

module.exports = { requireAuth };
