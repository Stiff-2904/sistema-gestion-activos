const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const { validarCambioRol } = require('../js/modificar-rol-validaciones.js');
const superusuario = { token: 'jwt.ok', role: 'SUPERUSER', id: 1, name: 'Directora', email: 'directora@ctposa.ac.cr' };
const basico = { token: 'jwt.basico', role: 'BASIC_USER', id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr' };
const valido = { id: 2, role: 'INTERMEDIATE_USER' };
const respuestaOk = { id: 2, name: 'Ana Perez', email: 'ana@institucion.cr', role: 'INTERMEDIATE_USER', active: true };
const enviar = ui => ui.dom['formulario-rol'].handlers.submit({ preventDefault() {} });
function llenar(ui, datos = valido) {
  ui.dom['id-usuario'].value = String(datos.id);
  ui.dom.rol.value = datos.role;
}

test('HU-GU-04 CA01 datos completos y correctos', () => assert.equal(validarCambioRol({ id: '2', role: 'BASIC_USER' }).valido, true));
test('HU-GU-04 CA01 envia PATCH autenticado y confirma respuesta', async () => {
  const ui = runPage('modificar-rol.js', { session: superusuario, response: jsonReply(200, respuestaOk) });
  llenar(ui); await enviar(ui);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].route, '/api/v1/users/2/role');
  assert.equal(ui.calls[0].options.method, 'PATCH');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer ' + superusuario.token);
  assert.deepEqual(JSON.parse(ui.calls[0].options.body), { role: 'INTERMEDIATE_USER' });
  assert.match(ui.dom['mensaje-rol'].textContent, /modificado correctamente a INTERMEDIATE_USER/);
  assert.equal(ui.dom['formulario-rol'].resetCount, 1);
  assert.equal(ui.storage.size, 1);
});
test('HU-GU-04 CA01 cambiar el rol de la propia cuenta cierra la sesion', async () => {
  const ui = runPage('modificar-rol.js', { session: superusuario, response: jsonReply(200, { ...respuestaOk, id: 1 }) });
  llenar(ui, { id: 1, role: 'INTERMEDIATE_USER' }); await enviar(ui);
  assert.equal(ui.storage.size, 0);
  assert.match(ui.dom['mensaje-rol'].textContent, /Inicie sesion nuevamente/);
});

test('HU-GU-04 CA02 cancelar limpia sin hacer PATCH', () => {
  const ui = runPage('modificar-rol.js', { session: superusuario });
  llenar(ui);
  ui.dom['cancelar-rol'].handlers.click();
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.dom['formulario-rol'].resetCount, 1);
  assert.deepEqual(ui.history, [['assign', 'panel.html']]);
});

test('HU-GU-04 CA03 sin rol seleccionado se rechaza', () => {
  const resultado = validarCambioRol({ id: '2', role: '' });
  assert.equal(resultado.valido, false);
  assert.match(resultado.errores.role, /Seleccione un rol/);
});
test('HU-GU-04 CA03 rol fuera de la lista se rechaza', () => assert.ok(validarCambioRol({ id: '2', role: 'OTRO' }).errores.role));
test('HU-GU-04 CA03 ID invalido se rechaza', () => {
  for (const id of ['', '0', '-3', '1.5', 'abc']) assert.ok(validarCambioRol({ id, role: 'BASIC_USER' }).errores.id, 'ID ' + id);
});
test('HU-GU-04 CA03 no envia PATCH sin rol y muestra el error', async () => {
  const ui = runPage('modificar-rol.js', { session: superusuario });
  llenar(ui, { id: 2, role: '' }); await enviar(ui);
  assert.equal(ui.calls.length, 0);
  assert.match(ui.dom['error-role'].textContent, /Seleccione un rol/);
  assert.equal(ui.dom.rol.attrs['aria-invalid'], 'true');
  assert.equal(ui.dom.rol.focusCount, 1);
  assert.match(ui.dom['mensaje-rol'].textContent, /Revise los campos/);
});

test('HU-GU-04 CA04 rechazo del ultimo superusuario muestra error sin declarar exito', async () => {
  const mensajeServidor = 'No se puede cambiar el rol: el sistema debe conservar al menos un superusuario activo';
  const ui = runPage('modificar-rol.js', { session: superusuario, response: jsonReply(400, { message: mensajeServidor }) });
  llenar(ui, { id: 1, role: 'BASIC_USER' }); await enviar(ui);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.dom['mensaje-rol'].textContent, mensajeServidor);
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
  const ui = runPage('modificar-rol.js', { session: basico });
  assert.deepEqual(ui.history, [['replace', 'panel.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GU-04 error 401 termina la sesion', async () => {
  const ui = runPage('modificar-rol.js', { session: superusuario, response: jsonReply(401, { message: 'No auth' }) });
  llenar(ui); await enviar(ui);
  assert.equal(ui.storage.size, 0);
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GU-04 error 403 no declara cambio de rol', async () => {
  const ui = runPage('modificar-rol.js', { session: superusuario, response: jsonReply(403, { message: 'Sin permisos' }) });
  llenar(ui); await enviar(ui);
  assert.match(ui.dom['mensaje-rol'].textContent, /Sin permisos/);
  assert.equal(ui.dom['formulario-rol'].resetCount, 0);
});
test('HU-GU-04 fallo de red no declara cambio de rol', async () => {
  const ui = runPage('modificar-rol.js', { session: superusuario, response: new Error('disconnect') });
  llenar(ui); await enviar(ui);
  assert.match(ui.dom['mensaje-rol'].textContent, /No se pudo conectar/);
  assert.equal(ui.dom['formulario-rol'].resetCount, 0);
});
test('HU-GU-04 el panel muestra el enlace de rol solo al superusuario', async () => {
  const comoSuper = runPage('panel.js', { session: superusuario, response: jsonReply(200, { id: 1, name: 'Ana', email: 'ana@ctposa.ac.cr', role: 'SUPERUSER' }) });
  await new Promise(setImmediate);
  assert.equal(comoSuper.dom['enlace-rol'].hidden, false);
  const comoBasico = runPage('panel.js', { session: basico, response: jsonReply(200, { id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr', role: 'BASIC_USER' }) });
  await new Promise(setImmediate);
  assert.equal(comoBasico.dom['enlace-rol'].hidden, true);
});
