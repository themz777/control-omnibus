const path = require('path');
const { ensureFileExists } = require('../utils/fileStore');

function ensureDataFiles() {
  ensureFileExists(path.resolve(__dirname, '../data/records.json'), []);
  ensureFileExists(path.resolve(__dirname, '../data/history.json'), []);
  ensureFileExists(path.resolve(__dirname, '../data/notifications.json'), []);
}

module.exports = { ensureDataFiles };
