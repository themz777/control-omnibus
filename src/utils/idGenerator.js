const { v4: uuidv4 } = require('uuid');

function generateId(prefix = 'id') {
  return `${prefix}_${uuidv4()}`;
}

module.exports = { generateId };
