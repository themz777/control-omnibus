const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');
const { generateId } = require('../utils/idGenerator');
const { nowIso } = require('../utils/timeUtils');

const HISTORY_PATH = path.resolve(__dirname, '../data/history.json');

function addHistoryEntry(entry) {
  const history = readJson(HISTORY_PATH, []);
  const newEntry = { id: generateId('hist'), timestamp: nowIso(), ...entry };
  history.push(newEntry);
  writeJson(HISTORY_PATH, history);
  return newEntry;
}

function getAllHistory() {
  return readJson(HISTORY_PATH, []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = { addHistoryEntry, getAllHistory };
