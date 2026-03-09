const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const STORAGE_PATH = path.join(__dirname, '..', 'storage', 'templates.json');

function ensureStorage() {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORAGE_PATH)) fs.writeFileSync(STORAGE_PATH, '[]');
}

function readAll() {
  ensureStorage();
  return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
}

function writeAll(templates) {
  ensureStorage();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(templates, null, 2));
}

function getAll() {
  return readAll();
}

function getById(id) {
  return readAll().find(t => t.id === id) || null;
}

function create(data) {
  const templates = readAll();
  const template = {
    id: uuidv4(),
    name: data.name || 'Untitled Template',
    headline: data.headline || '',
    body_text: data.body_text || '',
    description: data.description || '',
    link_url: data.link_url || '',
    cta_type: data.cta_type || 'LEARN_MORE',
    page_id: data.page_id || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  templates.push(template);
  writeAll(templates);
  return template;
}

function update(id, data) {
  const templates = readAll();
  const idx = templates.findIndex(t => t.id === id);
  if (idx === -1) return null;
  templates[idx] = { ...templates[idx], ...data, id, updated_at: new Date().toISOString() };
  writeAll(templates);
  return templates[idx];
}

function remove(id) {
  const templates = readAll();
  const idx = templates.findIndex(t => t.id === id);
  if (idx === -1) return false;
  templates.splice(idx, 1);
  writeAll(templates);
  return true;
}

module.exports = { getAll, getById, create, update, remove };
