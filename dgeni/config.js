const {resolve} = require('path');
const {readdirSync} = require('fs');

const PROJECT_PATH = resolve(__dirname, '..');
const DOCS_PATH = resolve(PROJECT_PATH, 'docs');
const DIST_PATH = resolve(PROJECT_PATH, 'dist');
const DGENI_PATH = resolve(PROJECT_PATH, 'dgeni');
const TEMPLATE_PATH = resolve(DGENI_PATH, 'template');

module.exports = {
  PROJECT_PATH,
  DOCS_PATH,
  DIST_PATH,
  DGENI_PATH,
  TEMPLATE_PATH
};
