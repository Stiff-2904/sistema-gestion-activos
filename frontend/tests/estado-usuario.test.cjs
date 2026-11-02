const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const admin = { token: 'jwt.super', role: 'SUPERUSER', id: 1, email: 'admin@ctposa.ac.cr' };
const user = { token: 'jwt.basic', role: 'BASIC_USER', id: 9, email: 'otro@ctposa.ac.cr' };
const activo = { id: 2, name: 'Ana', email: 'ana@ctposa.ac.cr', role: 'BASIC_USER', active: true };
const inactivo = { ...activo, active: false };
const consultar = async ui => { ui.dom['id-usuario'].value = '2'; await ui.dom['consultar-estado'].handlers.click(); };
const enviar = async ui => ui.dom['formulario-estado'].handlers.submit({ preventDefault() {} });

test('HU-GU-05 no permite entrar a un usuario sin sesion', () => {
  const ui = runPage('estado-usuario.js');
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GU-05 no permite entrar a usuario sin rol SUPERUSER', () => {
  const ui = runPage('estado-usuario.js', { session: user });
  assert.deepEqual(ui.history, [['replace', 'panel.html']]);
});
test('HU-GU-05 GET consulta estado real y muestra solo Inactivar', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: jsonReply(200, activo) });
  await consultar(ui);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].route, '/api/v1/users/2/status');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer ' + admin.token);
  assert.equal(ui.dom['boton-estado'].textContent, 'Inactivar usuario');
  assert.equal(ui.dom['estado-actual'].textContent, 'Activo');
  assert.equal(ui.dom['ficha-usuario'].hidden, false);
});
test('HU-GU-05 consulta inactivo muestra solo Activar', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: jsonReply(200, inactivo) });
  await consultar(ui);
  assert.equal(ui.dom['boton-estado'].textContent, 'Activar usuario');
});
test('HU-GU-05 CA01 inactivacion hace PATCH con motivo, confirma y actualiza la vista', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: (ruta, opciones) => opciones.method === 'PATCH' ? jsonReply(200, inactivo) : jsonReply(200, activo) });
  await consultar(ui);
  ui.dom['motivo-estado'].value = '  Acceso temporal suspendido  ';
  await enviar(ui);
  assert.equal(ui.calls.length, 2);
  assert.equal(ui.calls[1].route, '/api/v1/users/2/status');
  assert.equal(ui.calls[1].options.method, 'PATCH');
  assert.equal(ui.calls[1].options.headers.Authorization, 'Bearer ' + admin.token);
  assert.equal(JSON.parse(ui.calls[1].options.body).active, false);
  assert.equal(JSON.parse(ui.calls[1].options.body).reason, 'Acceso temporal suspendido');
  assert.equal(ui.dom['boton-estado'].textContent, 'Activar usuario');
  assert.match(ui.dom['mensaje-estado'].textContent, /inactivado correctamente/);
  assert.equal(ui.confirmations.length, 1);
});
test('HU-GU-05 CA02 activacion hace PATCH con active true', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: (ruta, opciones) => opciones.method === 'PATCH' ? jsonReply(200, activo) : jsonReply(200, inactivo) });
  await consultar(ui);
  ui.dom['motivo-estado'].value = 'Autorizado de nuevo';
  await enviar(ui);
  assert.deepEqual(JSON.parse(ui.calls[1].options.body), { active: true, reason: 'Autorizado de nuevo' });
  assert.match(ui.dom['mensaje-estado'].textContent, /activado correctamente/);
});
test('HU-GU-05 CA03 Cancelar no genera PATCH', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: jsonReply(200, activo) });
  await consultar(ui);
  ui.dom['cancelar-estado'].handlers.click();
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.dom['ficha-usuario'].hidden, true);
  assert.deepEqual(ui.history, [['assign', 'panel.html']]);
});
test('HU-GU-05 motivo vacio prohibe el PATCH', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: jsonReply(200, activo) });
  await consultar(ui);
  ui.dom['motivo-estado'].value = '   ';
  await enviar(ui);
  assert.equal(ui.calls.length, 1);
  assert.match(ui.dom['error-motivo'].textContent, /obligatorio/);
});
test('HU-GU-05 cancelacion de confirmacion no genera PATCH', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, confirmResult: false, response: jsonReply(200, activo) });
  await consultar(ui);
  ui.dom['motivo-estado'].value = 'Motivo';
  await enviar(ui);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.confirmations.length, 1);
});
test('HU-GU-05 rechaza ID invalido sin hacer consulta', async () => {
  const ui = runPage('estado-usuario.js', { session: admin });
  ui.dom['id-usuario'].value = '0';
  await ui.dom['consultar-estado'].handlers.click();
  assert.equal(ui.calls.length, 0);
  assert.match(ui.dom['error-id'].textContent, /ID de usuario valido/);
});
test('HU-GU-05 backend rechaza ultimo SUPERUSER sin mostrar exito', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: (ruta, opciones) => opciones.method === 'PATCH'
    ? jsonReply(400, { message: 'No se puede inactivar al ultimo superusuario activo' })
    : jsonReply(200, activo) });
  await consultar(ui);
  ui.dom['motivo-estado'].value = 'Motivo';
  await enviar(ui);
  assert.match(ui.dom['mensaje-estado'].textContent, /ultimo superusuario activo/);
  assert.match(ui.dom['mensaje-estado'].className, /error/);
});
test('HU-GU-05 401 elimina sesion y redirige a login', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: jsonReply(401, { message: 'Sin sesion' }) });
  await consultar(ui);
  assert.equal(ui.storage.size, 0);
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GU-05 el panel muestra enlace de estado solo al SUPERUSER', async () => {
  const ui = runPage('panel.js', { session: admin, response: jsonReply(200, { id: 1, name: 'Admin', email: 'admin@ctposa.ac.cr', role: 'SUPERUSER' }) });
  await new Promise(setImmediate);
  assert.equal(ui.dom['enlace-estado'].hidden, false);
  const simple = runPage('panel.js', { session: user, response: jsonReply(200, { id: 9, name: 'Basico', email: 'otro@ctposa.ac.cr', role: 'BASIC_USER' }) });
  await new Promise(setImmediate);
  assert.equal(simple.dom['enlace-estado'].hidden, true);
});
