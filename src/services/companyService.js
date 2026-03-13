const companies = require('../config/companies.json');

function getActiveCompanies() {
  return companies.filter((company) => company.active);
}

function isValidCompany(name) {
  return getActiveCompanies().some((company) => company.name === name);
}

module.exports = { getActiveCompanies, isValidCompany };
