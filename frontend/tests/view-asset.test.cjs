const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');

const intermediate = { token: 'jwt.intermedio', role: 'INTERMEDIATE_USER', id: 2,
  name: 'Auxiliar', email: 'auxiliar@ctposa.ac.cr' };
const asset = { id: 5, assetNumber: 'ACT-2026-0005', description: 'Computadora portatil',
  brand: 'Dell', model: 'Latitude 5440', serial: 'SN-005', price: 450000,
  status: 'Bueno', location: 'Laboratorio 1', category: 'Equipo de computo',
  acquisitionMode: 'Compra', currentResponsible: null, decommissioned: false,
  notes: 'Incluye cargador' };
const tick = () => new Promise(setImmediate);
const fetchDetails = ui => ui.dom['form-view'].handlers.submit({ preventDefault() {} });
function server(response) {
  return route => route === '/api/v1/assets' ? jsonReply(200, [asset]) : response;
}

test('HU-GA-02 CA01 usuario intermedio consulta por GET y visualiza todos los datos', async () => {
  const ui = runPage('view-asset.js', {session: intermediate, response: server(jsonReply(200, asset))});
  await tick();
  assert.equal(ui.dom['table-assets'].hidden, false);
  ui.dom['id-view'].value = '5';
  await fetchDetails(ui);
  await tick();
  assert.equal(ui.calls[1].route, '/api/v1/assets/5');
  assert.equal(ui.calls[1].options.method, 'GET');
  assert.equal(ui.calls[1].options.headers.Authorization, 'Bearer jwt.intermedio');
  assert.equal(ui.dom['section-detail'].hidden, false);
  assert.match(ui.dom['summary-asset'].textContent, /ACT-2026-0005/);
  assert.equal(ui.dom['data-detail'].children.length, 14);
  assert.match(ui.dom['message-view'].textContent, /correctamente/);
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 CA01 el listado permite seleccionar Ver detalle', async () => {
  const ui = runPage('view-asset.js', {session: intermediate, response: server(jsonReply(200, asset))});
  await tick();
  const viewButton = ui.dom['body-assets'].children[0].children[4].children[0];
  viewButton.handlers.click();
  await tick();
  assert.equal(ui.dom['id-view'].value, '5');
  assert.equal(ui.calls.at(-1).route, '/api/v1/assets/5');
  assert.equal(ui.dom['section-detail'].hidden, false);
});

test('HU-GA-02 CA02 un activo no existente muestra el 404 y no presenta detalle', async () => {
  const ui = runPage('view-asset.js', {session: intermediate,
    response: server(jsonReply(404, {message: 'El activo con ID 999 no existe.'}))});
  await tick();
  ui.dom['id-view'].value = '999';
  await fetchDetails(ui);
  await tick();
  assert.equal(ui.dom['section-detail'].hidden, true);
  assert.match(ui.dom['message-view'].textContent, /ID 999 no existe/);
  assert.equal(ui.calls[1].route, '/api/v1/assets/999');
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 CA03 cancelar limpia la consulta sin enviar otra solicitud', async () => {
  const ui = runPage('view-asset.js', {session: intermediate, response: server(jsonReply(200, asset))});
  await tick();
  ui.dom['id-view'].value = '5';
  await fetchDetails(ui);
  await tick();
  const before = ui.calls.length;
  ui.dom['cancel-view'].handlers.click();
  assert.equal(ui.calls.length, before);
  assert.equal(ui.dom['form-view'].resetCount, 1);
  assert.equal(ui.dom['section-detail'].hidden, true);
  assert.equal(ui.dom['data-detail'].children.length, 0);
  assert.match(ui.dom['message-view'].textContent, /cancelada/);
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 CA03 cancelar durante una peticion ignora una respuesta tardia', async () => {
  let release;
  const pendingDetail = new Promise(resolve => { release = resolve; });
  const ui = runPage('view-asset.js', {session: intermediate,
    response: route => route === '/api/v1/assets' ? jsonReply(200, []) : pendingDetail});
  await tick();
  ui.dom['id-view'].value = '5';
  const pending = fetchDetails(ui);
  ui.dom['cancel-view'].handlers.click();
  release(jsonReply(200, asset));
  await pending;
  assert.equal(ui.dom['section-detail'].hidden, true);
  assert.equal(ui.dom['data-detail'].children.length, 0);
  assert.match(ui.dom['message-view'].textContent, /cancelada/);
  assert.ok(ui.calls.every(x => x.options.method === 'GET'));
});

test('HU-GA-02 no acepta un ID invalido ni envía GET de detalle', async () => {
  const ui = runPage('view-asset.js', {session: intermediate, response: server(jsonReply(200, asset))});
  await tick();
  ui.dom['id-view'].value = 'abc';
  await fetchDetails(ui);
  await tick();
  assert.equal(ui.calls.length, 1);
  assert.match(ui.dom['error-id-view'].textContent, /numérico entero/);
  assert.equal(ui.dom['section-detail'].hidden, true);
});

test('HU-GA-02 no permite entrar sin sesion', () => {
  const ui = runPage('view-asset.js');
  assert.deepEqual(ui.history, [['replace','index.html']]);
  assert.equal(ui.calls.length, 0);
});
