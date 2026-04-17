const fs   = require('fs');
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
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
    return JSON.parse(content || JSON.stringify(defaultValue));
  } catch (err) {
    console.error(`[fileStore] JSON corrupto en ${filePath}, restaurando:`, err.message);
    return defaultValue;
  }
}

/**
 * Escritura atomica:
 *  1. Escribe en un archivo temporal (.tmp)
 *  2. rename() al destino final (operacion atomica en el SO)
 * Elimina la ventana de corrupcion que existia con writeFileSync directo
 * cuando dos operaciones async coincidian.
 */
function writeJson(filePath, data) {
  const absolutePath = path.resolve(filePath);
  const tmpPath = absolutePath + '.tmp';
  ensureFileExists(filePath, []);
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, absolutePath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
    throw err;
  }
}

module.exports = { ensureFileExists, readJson, writeJson };
