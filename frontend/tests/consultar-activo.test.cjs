const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');

const intermedio = { token: 'jwt.intermedio', role: 'INTERMEDIATE_USER', id: 2,
  name: 'Auxiliar', email: 'auxiliar@ctposa.ac.cr' };
const activo = { id: 5, assetNumber: 'ACT-2026-0005', description: 'Computadora portatil',
  brand: 'Dell', model: 'Latitude 5440', serial: 'SN-005', price: 450000,
  status: 'Bueno', location: 'Laboratorio 1', category: 'Equipo de computo',
  acquisitionMode: 'Compra', currentResponsible: null, decommissioned: false,
  notes: 'Incluye cargador' };
const tick = () => new Promise(setImmediate);
const consultar = ui => ui.dom['formulario-consulta'].handlers.submit({ preventDefault() {} });
function servidor(respuesta) {
  return ruta => ruta === '/api/v1/assets' ? jsonReply(200, [activo]) : respuesta;
}

test('HU-GA-02 CA01 usuario intermedio consulta por GET y visualiza todos los datos', async () => {
  const ui = runPage('consultar-activo.js', {session: intermedio, response: servidor(jsonReply(200, activo))});
  await tick();
  assert.equal(ui.dom['tabla-activos'].hidden, false);
  ui.dom['id-consulta'].value = '5';
  await consultar(ui);
  await tick();
  assert.equal(ui.calls[1].route, '/api/v1/assets/5');
  assert.equal(ui.calls[1].options.method, 'GET');
  assert.equal(ui.calls[1].options.headers.Authorization, 'Bearer jwt.intermedio');
  assert.equal(ui.dom['seccion-detalle'].hidden, false);
  assert.match(ui.dom['resumen-activo'].textContent, /ACT-2026-0005/);
  assert.equal(ui.dom['datos-detalle'].children.length, 14);
  assert.match(ui.dom['mensaje-consulta'].textContent, /correctamente/);
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 CA01 el listado permite seleccionar Ver detalle', async () => {
  const ui = runPage('consultar-activo.js', {session: intermedio, response: servidor(jsonReply(200, activo))});
  await tick();
  const botonVer = ui.dom['cuerpo-activos'].children[0].children[4].children[0];
  botonVer.handlers.click();
  await tick();
  assert.equal(ui.dom['id-consulta'].value, '5');
  assert.equal(ui.calls.at(-1).route, '/api/v1/assets/5');
  assert.equal(ui.dom['seccion-detalle'].hidden, false);
});

test('HU-GA-02 CA02 un activo no existente muestra el 404 y no presenta detalle', async () => {
  const ui = runPage('consultar-activo.js', {session: intermedio,
    response: servidor(jsonReply(404, {message: 'El activo con ID 999 no existe.'}))});
  await tick();
  ui.dom['id-consulta'].value = '999';
  await consultar(ui);
  await tick();
  assert.equal(ui.dom['seccion-detalle'].hidden, true);
  assert.match(ui.dom['mensaje-consulta'].textContent, /ID 999 no existe/);
  assert.equal(ui.calls[1].route, '/api/v1/assets/999');
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 CA03 cancelar limpia la consulta sin enviar otra solicitud', async () => {
  const ui = runPage('consultar-activo.js', {session: intermedio, response: servidor(jsonReply(200, activo))});
  await tick();
  ui.dom['id-consulta'].value = '5';
  await consultar(ui);
  await tick();
  const antes = ui.calls.length;
  ui.dom['cancelar-consulta'].handlers.click();
  assert.equal(ui.calls.length, antes);
  assert.equal(ui.dom['formulario-consulta'].resetCount, 1);
  assert.equal(ui.dom['seccion-detalle'].hidden, true);
  assert.equal(ui.dom['datos-detalle'].children.length, 0);
  assert.match(ui.dom['mensaje-consulta'].textContent, /cancelada/);
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 CA03 cancelar durante una peticion ignora una respuesta tardia', async () => {
  let liberar;
  const detallePendiente = new Promise(resolver => { liberar = resolver; });
  const ui = runPage('consultar-activo.js', {session: intermedio,
    response: ruta => ruta === '/api/v1/assets' ? jsonReply(200, []) : detallePendiente});
  await tick();
  ui.dom['id-consulta'].value = '5';
  const pendiente = consultar(ui);
  ui.dom['cancelar-consulta'].handlers.click();
  liberar(jsonReply(200, activo));
  await pendiente;
  assert.equal(ui.dom['seccion-detalle'].hidden, true);
  assert.equal(ui.dom['datos-detalle'].children.length, 0);
  assert.match(ui.dom['mensaje-consulta'].textContent, /cancelada/);
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 no acepta un ID invalido ni envía GET de detalle', async () => {
  const ui = runPage('consultar-activo.js', {session: intermedio, response: servidor(jsonReply(200, activo))});
  await tick();
  ui.dom['id-consulta'].value = 'abc';
  await consultar(ui);
  await tick();
  assert.equal(ui.calls.length, 1);
  assert.match(ui.dom['error-id-consulta'].textContent, /numérico entero/);
  assert.equal(ui.dom['seccion-detalle'].hidden, true);
});

test('HU-GA-02 no permite entrar sin sesion', () => {
  const ui = runPage('consultar-activo.js');
  assert.deepEqual(ui.history, [['replace','index.html']]);
  assert.equal(ui.calls.length, 0);
});
