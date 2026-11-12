const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const admin = { token: 'jwt.super', role: 'SUPERUSER', id: 1, email: 'admin@ctposa.ac.cr' };
const user = { token: 'jwt.basic', role: 'BASIC_USER', id: 9, email: 'otro@ctposa.ac.cr' };
const elegible = { id: 2, name: 'Ana', email: 'ana@ctposa.ac.cr', role: 'BASIC_USER', active: false, canDelete: true, message: 'La cuenta puede eliminarse definitivamente.' };
const buscar = async ui => { ui.dom['id-usuario'].value = '2'; await ui.dom['consultar-eliminacion'].handlers.click(); };
const borrar = async ui => ui.dom['formulario-eliminar'].handlers.submit({ preventDefault() {} });

test('HU-GU-06 requiere sesión y SUPERUSER en la interfaz', () => {
  assert.deepEqual(runPage('eliminar-usuario.js').history, [['replace', 'index.html']]);
  assert.deepEqual(runPage('eliminar-usuario.js', { session: user }).history, [['replace', 'panel.html']]);
});
test('CA01 cuenta inactiva sin historial permite DELETE tras confirmar', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin, response: (ruta, opciones) =>
    opciones.method === 'DELETE' ? jsonReply(200, { id: 2, message: 'Usuario eliminado' }) : jsonReply(200, elegible) });
  await buscar(ui);
  assert.equal(ui.calls[0].route, '/api/v1/users/2/deletion');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer ' + admin.token);
  assert.equal(ui.dom['seccion-eliminar'].hidden, false);
  await borrar(ui);
  assert.equal(ui.calls.length, 2);
  assert.equal(ui.calls[1].route, '/api/v1/users/2');
  assert.equal(ui.calls[1].options.method, 'DELETE');
  assert.equal(ui.calls[1].options.headers.Authorization, 'Bearer ' + admin.token);
  assert.equal(ui.confirmations.length, 1);
  assert.match(ui.dom['mensaje-eliminacion'].textContent, /eliminado definitivamente/);
  assert.equal(ui.dom['ficha-eliminar'].hidden, true);
});
test('CA02 cancelar en la confirmación no envía DELETE', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin, confirmResult: false, response: jsonReply(200, elegible) });
  await buscar(ui);
  await borrar(ui);
  assert.equal(ui.calls.length, 1);
  assert.match(ui.dom['mensaje-eliminacion'].textContent, /cancelada/);
});
test('CA02 cancelar en formulario regresa al panel sin DELETE', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin, response: jsonReply(200, elegible) });
  await buscar(ui);
  ui.dom['cancelar-eliminacion'].handlers.click();
  assert.equal(ui.calls.length, 1);
  assert.deepEqual(ui.history, [['assign', 'panel.html']]);
});
test('CA03 usuario habilitado bloqueado por la comprobación del backend', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin, response: jsonReply(200, { ...elegible, active: true, canDelete: false, message: 'Usuario habilitado: primero debe inactivar la cuenta.' }) });
  await buscar(ui);
  await borrar(ui);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.dom['seccion-eliminar'].hidden, true);
  assert.match(ui.dom['mensaje-eliminacion'].textContent, /Usuario habilitado/);
});
test('CA04 usuario con actividad histórica no se puede borrar', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin, response: jsonReply(200, { ...elegible, canDelete: false, message: 'Usuario con actividad histórica.' }) });
  await buscar(ui);
  await borrar(ui);
  assert.equal(ui.calls.length, 1);
  assert.match(ui.dom['mensaje-eliminacion'].textContent, /actividad histórica/);
});
test('un ID inválido nunca provoca una consulta', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin });
  ui.dom['id-usuario'].value = '0';
  await ui.dom['consultar-eliminacion'].handlers.click();
  assert.equal(ui.calls.length, 0);
  assert.match(ui.dom['error-id'].textContent, /ID de usuario válido/);
});
test('409 tras consultar cancela la operación y evita falsos éxitos', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin, response: (_, opciones) =>
    opciones.method === 'DELETE' ? jsonReply(409, { message: 'Usuario con actividad histórica' }) : jsonReply(200, elegible) });
  await buscar(ui);
  await borrar(ui);
  assert.equal(ui.dom['seccion-eliminar'].hidden, true);
  assert.match(ui.dom['mensaje-eliminacion'].textContent, /actividad histórica/);
});
test('401 invalida sesión y retorna a login', async () => {
  const ui = runPage('eliminar-usuario.js', { session: admin, response: jsonReply(401, { message: 'Sin sesión' }) });
  await buscar(ui);
  assert.equal(ui.storage.size, 0);
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('el panel oculta el acceso de borrado a roles no SUPERUSER', async () => {
  const superPanel = runPage('panel.js', { session: admin, response: jsonReply(200, { id: 1, name: 'Admin', email: admin.email, role: 'SUPERUSER' }) });
  await new Promise(setImmediate);
  assert.equal(superPanel.dom['enlace-eliminar'].hidden, false);
  const basicPanel = runPage('panel.js', { session: user, response: jsonReply(200, { id: 9, name: 'Basic', email: user.email, role: 'BASIC_USER' }) });
  await new Promise(setImmediate);
  assert.equal(basicPanel.dom['enlace-eliminar'].hidden, true);
});
