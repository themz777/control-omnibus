const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getAllRecords,
  getVisibleRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  toPublicRecord
} = require('../services/recordService');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true, data: getVisibleRecords().map(toPublicRecord) });
});

router.get('/all', requireAuth, (req, res) => {
  res.json({ ok: true, data: getAllRecords() });
});

router.post('/', requireAuth, (req, res, next) => {
  try {
    const record = createRecord(req.body);
    const io = req.app.get('io');
    io.emit('records:updated', getVisibleRecords().map(toPublicRecord));
    io.emit('dashboard:refresh');
    res.status(201).json({ ok: true, data: record });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, (req, res, next) => {
  try {
    const record = updateRecord(req.params.id, req.body);
    const io = req.app.get('io');
    io.emit('records:updated', getVisibleRecords().map(toPublicRecord));
    io.emit('dashboard:refresh');
    res.json({ ok: true, data: record });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, (req, res, next) => {
  try {
    const record = deleteRecord(req.params.id);
    const io = req.app.get('io');
    io.emit('records:updated', getVisibleRecords().map(toPublicRecord));
    io.emit('dashboard:refresh');
    res.json({ ok: true, data: record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
