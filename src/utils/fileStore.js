const fs = require('fs');
const path = require('path');

function ensureFileExists(filePath, defaultValue = []) {
  const absolutePath = path.resolve(filePath);
  const dir = path.dirname(absolutePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(absolutePath)) {
    fs.writeFileSync(absolutePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
  }
}

function readJson(filePath, defaultValue = []) {
  ensureFileExists(filePath, defaultValue);
  const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
  return JSON.parse(content || JSON.stringify(defaultValue));
}

function writeJson(filePath, data) {
  ensureFileExists(filePath, []);
  fs.writeFileSync(path.resolve(filePath), JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { ensureFileExists, readJson, writeJson };
