const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const admin = { token: 'jwt.super', role: 'SUPERUSER', id: 1, email: 'admin@ctposa.ac.cr' };
const cuenta = { id: 2, name: 'Ana', email: 'ana@ctposa.ac.cr', role: 'BASIC_USER', active: false };
const consultarEstado = async ui => {
  ui.dom['id-usuario'].value = '2';
  await ui.dom['consultar-estado'].handlers.click();
};

test('el botón Eliminar usuario está en la misma pantalla de Estados y eliminación', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: (ruta, opciones) => {
    if (opciones.method === 'DELETE') return jsonReply(200, { id: 2 });
    if (ruta.endsWith('/deletion')) return jsonReply(200, { ...cuenta, canDelete: true });
    return jsonReply(200, cuenta);
  }});
  await consultarEstado(ui);
  await ui.dom['abrir-eliminacion'].handlers.click();
  assert.equal(ui.dom['panel-eliminacion'].hidden, false);
  assert.equal(ui.dom['seccion-eliminar'].hidden, false);
  assert.equal(ui.calls[1].route, '/api/v1/users/2/deletion');
  await ui.dom['formulario-eliminar'].handlers.submit({ preventDefault() {} });
  assert.equal(ui.calls[2].options.method, 'DELETE');
  assert.equal(ui.calls[2].route, '/api/v1/users/2');
  assert.equal(ui.confirmations.length, 1);
  assert.equal(ui.dom['ficha-usuario'].hidden, true);
  assert.match(ui.dom['mensaje-estado'].textContent, /eliminado definitivamente/);
});

test('no consulta eliminación de cuentas activas y solicita inactivarlas', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: jsonReply(200, { ...cuenta, active: true }) });
  await consultarEstado(ui);
  await ui.dom['abrir-eliminacion'].handlers.click();
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.dom['seccion-eliminar'].hidden, true);
  assert.match(ui.dom['mensaje-eliminacion'].textContent, /Primero debe inactivar/);
});

test('una cuenta inactiva con actividad histórica no habilita DELETE', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: ruta =>
    ruta.endsWith('/deletion') ? jsonReply(200, { ...cuenta, canDelete: false, message: 'Tiene actividad histórica.' }) : jsonReply(200, cuenta) });
  await consultarEstado(ui);
  await ui.dom['abrir-eliminacion'].handlers.click();
  assert.equal(ui.dom['seccion-eliminar'].hidden, true);
  assert.match(ui.dom['mensaje-eliminacion'].textContent, /actividad histórica/);
});

test('cancelar eliminación integrada vuelve a la vista sin salir del panel', async () => {
  const ui = runPage('estado-usuario.js', { session: admin, response: ruta =>
    ruta.endsWith('/deletion') ? jsonReply(200, { ...cuenta, canDelete: true }) : jsonReply(200, cuenta) });
  await consultarEstado(ui);
  await ui.dom['abrir-eliminacion'].handlers.click();
  ui.dom['cancelar-eliminacion'].handlers.click();
  assert.equal(ui.dom['panel-eliminacion'].hidden, true);
  assert.equal(ui.dom['ficha-usuario'].hidden, false);
  assert.equal(ui.calls.length, 2);
});
