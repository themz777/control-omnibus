const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');
const { generateId } = require('../utils/idGenerator');
const { nowIso } = require('../utils/timeUtils');

const NOTIFICATIONS_PATH = path.resolve(__dirname, '../data/notifications.json');

const MAX_NOTIFICATIONS = 500;

function addNotification(entry) {
  const notifications = readJson(NOTIFICATIONS_PATH, []);
  const newEntry = { id: generateId('notif'), timestamp: nowIso(), ...entry };
  notifications.push(newEntry);
  // Evitar crecimiento infinito del archivo
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.splice(0, notifications.length - MAX_NOTIFICATIONS);
  }
  writeJson(NOTIFICATIONS_PATH, notifications);
  return newEntry;
}

function getAllNotifications() {
  return readJson(NOTIFICATIONS_PATH, []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = { addNotification, getAllNotifications };
