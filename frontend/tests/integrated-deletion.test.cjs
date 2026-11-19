const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const admin = { token: 'jwt.super', role: 'SUPERUSER', id: 1, email: 'admin@ctposa.ac.cr' };
const account = { id: 2, name: 'Ana', email: 'ana@ctposa.ac.cr', role: 'BASIC_USER', active: false };
const fetchStatus = async ui => {
  ui.dom['id-user'].value = '2';
  await ui.dom['view-status'].handlers.click();
};

test('el botón Eliminar usuario está en la misma pantalla de Estados y eliminación', async () => {
  const ui = runPage('user-status.js', { session: admin, response: (route, options) => {
    if (options.method === 'DELETE') return jsonReply(200, { id: 2 });
    if (route.endsWith('/deletion')) return jsonReply(200, { ...account, canDelete: true });
    return jsonReply(200, account);
  }});
  await fetchStatus(ui);
  await ui.dom['open-deletion'].handlers.click();
  assert.equal(ui.dom['dashboard-deletion'].hidden, false);
  assert.equal(ui.dom['section-delete'].hidden, false);
  assert.equal(ui.calls[1].route, '/api/v1/users/2/deletion');
  await ui.dom['form-delete'].handlers.submit({ preventDefault() {} });
  assert.equal(ui.calls[2].options.method, 'DELETE');
  assert.equal(ui.calls[2].route, '/api/v1/users/2');
  assert.equal(ui.confirmations.length, 1);
  assert.equal(ui.dom['card-user'].hidden, true);
  assert.match(ui.dom['message-status'].textContent, /eliminado definitivamente/);
});

test('no consulta eliminación de cuentas activas y solicita inactivarlas', async () => {
  const ui = runPage('user-status.js', { session: admin, response: jsonReply(200, { ...account, active: true }) });
  await fetchStatus(ui);
  await ui.dom['open-deletion'].handlers.click();
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.dom['section-delete'].hidden, true);
  assert.match(ui.dom['message-deletion'].textContent, /Primero debe inactivar/);
});

test('una cuenta inactiva con actividad histórica no habilita DELETE', async () => {
  const ui = runPage('user-status.js', { session: admin, response: route =>
    route.endsWith('/deletion') ? jsonReply(200, { ...account, canDelete: false, message: 'Tiene actividad histórica.' }) : jsonReply(200, account) });
  await fetchStatus(ui);
  await ui.dom['open-deletion'].handlers.click();
  assert.equal(ui.dom['section-delete'].hidden, true);
  assert.match(ui.dom['message-deletion'].textContent, /actividad histórica/);
});

test('cancelar eliminación integrada vuelve a la vista sin salir del panel', async () => {
  const ui = runPage('user-status.js', { session: admin, response: route =>
    route.endsWith('/deletion') ? jsonReply(200, { ...account, canDelete: true }) : jsonReply(200, account) });
  await fetchStatus(ui);
  await ui.dom['open-deletion'].handlers.click();
  ui.dom['cancel-deletion'].handlers.click();
  assert.equal(ui.dom['dashboard-deletion'].hidden, true);
  assert.equal(ui.dom['card-user'].hidden, false);
  assert.equal(ui.calls.length, 2);
});
