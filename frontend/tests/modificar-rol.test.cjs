const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const { validateRoleChange } = require('../js/modificar-rol-validaciones.js');
const isSuperuser = { token: 'jwt.ok', role: 'SUPERUSER', id: 1, name: 'Directora', email: 'directora@ctposa.ac.cr' };
const basic = { token: 'jwt.basico', role: 'BASIC_USER', id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr' };
const valid = { id: 2, role: 'INTERMEDIATE_USER' };
const successResponse = { id: 2, name: 'Ana Perez', email: 'ana@institucion.cr', role: 'INTERMEDIATE_USER', active: true };
const submitData = ui => ui.dom['formulario-rol'].handlers.submit({ preventDefault() {} });
function fill(ui, data = valid) {
  ui.dom['id-usuario'].value = String(data.id);
  ui.dom.rol.value = data.role;
}

test('HU-GU-04 CA01 datos completos y correctos', () => assert.equal(validateRoleChange({ id: '2', role: 'BASIC_USER' }).valid, true));
test('HU-GU-04 CA01 envia PATCH autenticado y confirma respuesta', async () => {
  const ui = runPage('modificar-rol.js', { session: isSuperuser, response: jsonReply(200, successResponse) });
  fill(ui); await submitData(ui);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].route, '/api/v1/users/2/role');
  assert.equal(ui.calls[0].options.method, 'PATCH');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer ' + isSuperuser.token);
  assert.deepEqual(JSON.parse(ui.calls[0].options.body), { role: 'INTERMEDIATE_USER' });
  assert.match(ui.dom['mensaje-rol'].textContent, /modificado correctamente a INTERMEDIATE_USER/);
  assert.equal(ui.dom['formulario-rol'].resetCount, 1);
  assert.equal(ui.storage.size, 1);
});
test('HU-GU-04 CA01 cambiar el rol de la propia cuenta cierra la sesion', async () => {
  const ui = runPage('modificar-rol.js', { session: isSuperuser, response: jsonReply(200, { ...successResponse, id: 1 }) });
  fill(ui, { id: 1, role: 'INTERMEDIATE_USER' }); await submitData(ui);
  assert.equal(ui.storage.size, 0);
  assert.match(ui.dom['mensaje-rol'].textContent, /Inicie sesion nuevamente/);
});

test('HU-GU-04 CA02 cancelar limpia sin hacer PATCH', () => {
  const ui = runPage('modificar-rol.js', { session: isSuperuser });
  fill(ui);
  ui.dom['cancelar-rol'].handlers.click();
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.dom['formulario-rol'].resetCount, 1);
  assert.deepEqual(ui.history, [['assign', 'panel.html']]);
});

test('HU-GU-04 CA03 sin rol seleccionado se rechaza', () => {
  const result = validateRoleChange({ id: '2', role: '' });
  assert.equal(result.valid, false);
  assert.match(result.errors.role, /Seleccione un rol/);
});
test('HU-GU-04 CA03 rol fuera de la lista se rechaza', () => assert.ok(validateRoleChange({ id: '2', role: 'OTRO' }).errors.role));
test('HU-GU-04 CA03 ID invalido se rechaza', () => {
  for (const id of ['', '0', '-3', '1.5', 'abc']) assert.ok(validateRoleChange({ id, role: 'BASIC_USER' }).errors.id, 'ID ' + id);
});
test('HU-GU-04 CA03 no envia PATCH sin rol y muestra el error', async () => {
  const ui = runPage('modificar-rol.js', { session: isSuperuser });
  fill(ui, { id: 2, role: '' }); await submitData(ui);
  assert.equal(ui.calls.length, 0);
  assert.match(ui.dom['error-role'].textContent, /Seleccione un rol/);
  assert.equal(ui.dom.rol.attrs['aria-invalid'], 'true');
  assert.equal(ui.dom.rol.focusCount, 1);
  assert.match(ui.dom['mensaje-rol'].textContent, /Revise los campos/);
});

test('HU-GU-04 CA04 rechazo del ultimo superusuario muestra error sin declarar exito', async () => {
  const serverMessage = 'No se puede cambiar el rol: el sistema debe conservar al menos un superusuario activo';
  const ui = runPage('modificar-rol.js', { session: isSuperuser, response: jsonReply(400, { message: serverMessage }) });
  fill(ui, { id: 1, role: 'BASIC_USER' }); await submitData(ui);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.dom['mensaje-rol'].textContent, serverMessage);
  assert.match(ui.dom['mensaje-rol'].className, /error/);
  assert.equal(ui.dom['formulario-rol'].resetCount, 0);
  assert.equal(ui.storage.size, 1);
});

test('HU-GU-04 exige sesion para entrar', () => {
  const ui = runPage('modificar-rol.js');
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GU-04 usuario que no es superusuario vuelve a la pantalla principal', () => {
  const ui = runPage('modificar-rol.js', { session: basic });
  assert.deepEqual(ui.history, [['replace', 'panel.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GU-04 error 401 termina la sesion', async () => {
  const ui = runPage('modificar-rol.js', { session: isSuperuser, response: jsonReply(401, { message: 'No auth' }) });
  fill(ui); await submitData(ui);
  assert.equal(ui.storage.size, 0);
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GU-04 error 403 no declara cambio de rol', async () => {
  const ui = runPage('modificar-rol.js', { session: isSuperuser, response: jsonReply(403, { message: 'Sin permisos' }) });
  fill(ui); await submitData(ui);
  assert.match(ui.dom['mensaje-rol'].textContent, /Sin permisos/);
  assert.equal(ui.dom['formulario-rol'].resetCount, 0);
});
test('HU-GU-04 fallo de red no declara cambio de rol', async () => {
  const ui = runPage('modificar-rol.js', { session: isSuperuser, response: new Error('disconnect') });
  fill(ui); await submitData(ui);
  assert.match(ui.dom['mensaje-rol'].textContent, /No se pudo conectar/);
  assert.equal(ui.dom['formulario-rol'].resetCount, 0);
});
test('HU-GU-04 el panel muestra el enlace de rol solo al superusuario', async () => {
  const asSuperuser = runPage('panel.js', { session: isSuperuser, response: jsonReply(200, { id: 1, name: 'Ana', email: 'ana@ctposa.ac.cr', role: 'SUPERUSER' }) });
  await new Promise(setImmediate);
  assert.equal(asSuperuser.dom['enlace-rol'].hidden, false);
  const asBasic = runPage('panel.js', { session: basic, response: jsonReply(200, { id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr', role: 'BASIC_USER' }) });
  await new Promise(setImmediate);
  assert.equal(asBasic.dom['enlace-rol'].hidden, true);
});
