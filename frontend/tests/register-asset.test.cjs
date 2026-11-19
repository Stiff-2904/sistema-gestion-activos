const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const { validateAsset } = require('../js/asset-registration-validations.js');
const isSuperuser = { token: 'jwt.ok', role: 'SUPERUSER', id: 1, name: 'Directora', email: 'directora@ctposa.ac.cr' };
const basic = { token: 'jwt.basico', role: 'BASIC_USER', id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr' };
const catalog = {
  statuses: [{ id: 1, name: 'Bueno' }],
  locations: [{ id: 2, name: 'Laboratorio 1 - Edificio A' }],
  categories: [{ id: 3, name: 'Equipo de computo' }],
  acquisitionModes: [{ id: 4, name: 'Compra' }],
  responsibles: [{ id: 7, name: 'Ana Perez (ana@ctposa.ac.cr)' }],
};
const valid = {
  assetNumber: 'ACT-2026-0001', description: 'Computadora portatil', brand: 'Dell', model: '', serial: '',
  price: '125000.50', statusId: '1', locationId: '2', categoryId: '3', acquisitionModeId: '4',
  currentResponsibleId: '', notes: '',
};
const successResponse = { id: 5, assetNumber: 'ACT-2026-0001', description: 'Computadora portatil', status: 'Bueno', decommissioned: false };
const getField = {
  assetNumber: 'number-asset', description: 'description-asset', brand: 'brand-asset', model: 'model-asset',
  serial: 'serial-asset', price: 'price-asset', statusId: 'status-asset', locationId: 'location-asset',
  categoryId: 'category-asset', acquisitionModeId: 'mode-asset', currentResponsibleId: 'responsible-asset',
  notes: 'notes-asset',
};
const submitData = ui => ui.dom['form-asset'].handlers.submit({ preventDefault() {} });
const wait = () => new Promise(setImmediate);
function fill(ui, data = valid) {
  for (const [key, id] of Object.entries(getField)) ui.dom[id].value = data[key];
}
// El catalogo responde GET y el registro responde el POST con la respuesta indicada.
function server(postResponse) {
  return (route) => route === '/api/v1/assets/catalog' ? jsonReply(200, catalog) : postResponse;
}
const postCalls = ui => ui.calls.filter(call => call.options.method === 'POST');

test('HU-GA-01 CA01 datos completos y correctos', () => {
  const result = validateAsset(valid);
  assert.equal(result.valid, true);
  assert.equal(result.data.price, 125000.5);
  assert.equal(result.data.model, null);
});
test('HU-GA-01 CA01 solo con los datos obligatorios tambien es valido', () => {
  const minimum = { assetNumber: 'A1', description: 'Silla', statusId: '1', locationId: '2', categoryId: '3', acquisitionModeId: '4' };
  const result = validateAsset(minimum);
  assert.equal(result.valid, true);
  assert.equal(result.data.price, null);
  assert.equal(result.data.currentResponsibleId, null);
});
test('HU-GA-01 CA01 carga las listas desplegables desde el catalogo', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(null) });
  await wait();
  assert.equal(ui.calls[0].route, '/api/v1/assets/catalog');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer ' + isSuperuser.token);
  assert.equal(ui.dom['status-asset'].children.length, 1);
  assert.equal(ui.dom['status-asset'].children[0].textContent, 'Bueno');
  assert.equal(ui.dom['location-asset'].children[0].value, '2');
  assert.equal(ui.dom['responsible-asset'].children.length, 1);
});
test('HU-GA-01 CA01 envia POST autenticado y confirma respuesta', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(jsonReply(201, successResponse)) });
  await wait();
  fill(ui); await submitData(ui);
  const posts = postCalls(ui);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].route, '/api/v1/assets');
  assert.equal(posts[0].options.headers.Authorization, 'Bearer ' + isSuperuser.token);
  assert.deepEqual(JSON.parse(posts[0].options.body), {
    assetNumber: 'ACT-2026-0001', description: 'Computadora portatil', brand: 'Dell', model: null, serial: null,
    price: 125000.5, statusId: 1, locationId: 2, categoryId: 3, acquisitionModeId: 4,
    currentResponsibleId: null, notes: null,
  });
  assert.match(ui.dom['message-asset'].textContent, /Activo ACT-2026-0001 registrado correctamente con ID 5/);
  assert.equal(ui.dom['form-asset'].resetCount, 1);
});
test('HU-GA-01 CA01 respuesta que no coincide no declara exito', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(jsonReply(201, { id: 9, assetNumber: 'OTRO' })) });
  await wait();
  fill(ui); await submitData(ui);
  assert.match(ui.dom['message-asset'].textContent, /no confirmo/);
  assert.equal(ui.dom['form-asset'].resetCount, 0);
});

test('HU-GA-01 CA02 campos obligatorios vacios se rechazan', () => {
  const result = validateAsset({});
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(),
    ['acquisitionModeId', 'assetNumber', 'categoryId', 'description', 'locationId', 'statusId']);
});
test('HU-GA-01 CA02 textos con solo espacios cuentan como vacios', () => {
  const result = validateAsset({ ...valid, assetNumber: '   ', description: '   ' });
  assert.ok(result.errors.assetNumber);
  assert.ok(result.errors.description);
});
test('HU-GA-01 CA02 no envia POST con datos incompletos y senala los campos', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(null) });
  await wait();
  await submitData(ui);
  assert.equal(postCalls(ui).length, 0);
  assert.match(ui.dom['error-number-asset'].textContent, /obligatorio/);
  assert.match(ui.dom['error-status-asset'].textContent, /Seleccione/);
  assert.equal(ui.dom['number-asset'].attrs['aria-invalid'], 'true');
  assert.equal(ui.dom['number-asset'].focusCount, 1);
  assert.match(ui.dom['message-asset'].textContent, /Revise los campos/);
});

test('HU-GA-01 CA03 numero de identificacion con formato invalido', () => {
  for (const number of ['ACT 001', '-ACT001', 'ACT#001', 'ACT@001', 'A'.repeat(51)]) {
    assert.ok(validateAsset({ ...valid, assetNumber: number }).errors.assetNumber, number);
  }
});
test('HU-GA-01 CA03 el mensaje de formato incluye un ejemplo de entrada', () => {
  assert.match(validateAsset({ ...valid, assetNumber: 'ACT 001' }).errors.assetNumber, /Ejemplo: ACT-2026-0001/);
});
test('HU-GA-01 CA03 precio con formato invalido', () => {
  for (const price of ['abc', '-5', '10,50', '10.123', '12345678901', '1e5']) {
    assert.ok(validateAsset({ ...valid, price: price }).errors.price, price);
  }
});
test('HU-GA-01 CA03 textos mas largos que la base de datos se rechazan', () => {
  const result = validateAsset({
    ...valid, description: 'D'.repeat(501), brand: 'M'.repeat(51), model: 'M'.repeat(51),
    serial: 'S'.repeat(51), notes: 'O'.repeat(1001),
  });
  assert.deepEqual(Object.keys(result.errors).sort(), ['brand', 'description', 'model', 'notes', 'serial']);
});
test('HU-GA-01 CA03 opcion de lista que no es un numero positivo se rechaza', () => {
  assert.ok(validateAsset({ ...valid, statusId: '0' }).errors.statusId);
  assert.ok(validateAsset({ ...valid, locationId: 'abc' }).errors.locationId);
  assert.ok(validateAsset({ ...valid, currentResponsibleId: '-3' }).errors.currentResponsibleId);
});
test('HU-GA-01 CA03 no envia POST con formato invalido', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(null) });
  await wait();
  fill(ui, { ...valid, assetNumber: 'ACT 001', price: '10,50' });
  await submitData(ui);
  assert.equal(postCalls(ui).length, 0);
  assert.match(ui.dom['error-number-asset'].textContent, /sin espacios/);
  assert.match(ui.dom['error-price-asset'].textContent, /punto decimal/);
});

test('HU-GA-01 CA04 activo existente muestra el error del servidor sin declarar exito', async () => {
  const serverMessage = 'Ya existe un activo con ese numero de identificacion';
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(jsonReply(400, { message: serverMessage })) });
  await wait();
  fill(ui); await submitData(ui);
  assert.equal(postCalls(ui).length, 1);
  assert.equal(ui.dom['message-asset'].textContent, serverMessage);
  assert.match(ui.dom['message-asset'].className, /error/);
  assert.equal(ui.dom['form-asset'].resetCount, 0);
  assert.equal(ui.storage.size, 1);
});

test('HU-GA-01 CA05 cancelar limpia sin hacer POST', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(null) });
  await wait();
  fill(ui);
  ui.dom['cancel-asset'].handlers.click();
  assert.equal(postCalls(ui).length, 0);
  assert.equal(ui.dom['form-asset'].resetCount, 1);
  assert.deepEqual(ui.history, [['assign', 'dashboard.html']]);
});

test('HU-GA-01 exige sesion para entrar', () => {
  const ui = runPage('register-asset.js');
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GA-01 usuario que no es superusuario vuelve a la pantalla principal', () => {
  const ui = runPage('register-asset.js', { session: basic });
  assert.deepEqual(ui.history, [['replace', 'dashboard.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GA-01 error 401 al registrar termina la sesion', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(jsonReply(401, { message: 'No auth' })) });
  await wait();
  fill(ui); await submitData(ui);
  assert.equal(ui.storage.size, 0);
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GA-01 error 403 al registrar no declara registro', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: server(jsonReply(403, { message: 'Sin permisos' })) });
  await wait();
  fill(ui); await submitData(ui);
  assert.match(ui.dom['message-asset'].textContent, /Sin permisos/);
  assert.equal(ui.dom['form-asset'].resetCount, 0);
});
test('HU-GA-01 fallo de red no declara registro', async () => {
  const ui = runPage('register-asset.js', { session: isSuperuser, response: new Error('disconnect') });
  await wait();
  fill(ui); await submitData(ui);
  assert.match(ui.dom['message-asset'].textContent, /No se pudo conectar/);
  assert.equal(ui.dom['form-asset'].resetCount, 0);
});
test('HU-GA-01 catalogo vacio avisa que faltan datos en la base de datos', async () => {
  const emptyCatalog = { statuses: [], locations: [], categories: [], acquisitionModes: [], responsibles: [] };
  const ui = runPage('register-asset.js', { session: isSuperuser, response: () => jsonReply(200, emptyCatalog) });
  await wait();
  assert.match(ui.dom['message-asset'].textContent, /No hay estados, ubicaciones, categorias, modos de adquisicion/);
});
