const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const { validarActivo } = require('../js/registrar-activo-validaciones.js');
const superusuario = { token: 'jwt.ok', role: 'SUPERUSER', id: 1, name: 'Directora', email: 'directora@ctposa.ac.cr' };
const basico = { token: 'jwt.basico', role: 'BASIC_USER', id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr' };
const catalogo = {
  statuses: [{ id: 1, name: 'Bueno' }],
  locations: [{ id: 2, name: 'Laboratorio 1 - Edificio A' }],
  categories: [{ id: 3, name: 'Equipo de computo' }],
  acquisitionModes: [{ id: 4, name: 'Compra' }],
  responsibles: [{ id: 7, name: 'Ana Perez (ana@ctposa.ac.cr)' }],
};
const valido = {
  assetNumber: 'ACT-2026-0001', description: 'Computadora portatil', brand: 'Dell', model: '', serial: '',
  price: '125000.50', statusId: '1', locationId: '2', categoryId: '3', acquisitionModeId: '4',
  currentResponsibleId: '', notes: '',
};
const respuestaOk = { id: 5, assetNumber: 'ACT-2026-0001', description: 'Computadora portatil', status: 'Bueno', decommissioned: false };
const campoDe = {
  assetNumber: 'numero-activo', description: 'descripcion-activo', brand: 'marca-activo', model: 'modelo-activo',
  serial: 'serie-activo', price: 'precio-activo', statusId: 'estado-activo', locationId: 'ubicacion-activo',
  categoryId: 'categoria-activo', acquisitionModeId: 'modo-activo', currentResponsibleId: 'responsable-activo',
  notes: 'observaciones-activo',
};
const enviar = ui => ui.dom['formulario-activo'].handlers.submit({ preventDefault() {} });
const esperar = () => new Promise(setImmediate);
function llenar(ui, datos = valido) {
  for (const [clave, id] of Object.entries(campoDe)) ui.dom[id].value = datos[clave];
}
// El catalogo responde GET y el registro responde el POST con la respuesta indicada.
function servidor(respuestaPost) {
  return (ruta) => ruta === '/api/v1/assets/catalog' ? jsonReply(200, catalogo) : respuestaPost;
}
const llamadasPost = ui => ui.calls.filter(llamada => llamada.options.method === 'POST');

test('HU-GA-01 CA01 datos completos y correctos', () => {
  const resultado = validarActivo(valido);
  assert.equal(resultado.valido, true);
  assert.equal(resultado.datos.price, 125000.5);
  assert.equal(resultado.datos.model, null);
});
test('HU-GA-01 CA01 solo con los datos obligatorios tambien es valido', () => {
  const minimo = { assetNumber: 'A1', description: 'Silla', statusId: '1', locationId: '2', categoryId: '3', acquisitionModeId: '4' };
  const resultado = validarActivo(minimo);
  assert.equal(resultado.valido, true);
  assert.equal(resultado.datos.price, null);
  assert.equal(resultado.datos.currentResponsibleId, null);
});
test('HU-GA-01 CA01 carga las listas desplegables desde el catalogo', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(null) });
  await esperar();
  assert.equal(ui.calls[0].route, '/api/v1/assets/catalog');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer ' + superusuario.token);
  assert.equal(ui.dom['estado-activo'].children.length, 1);
  assert.equal(ui.dom['estado-activo'].children[0].textContent, 'Bueno');
  assert.equal(ui.dom['ubicacion-activo'].children[0].value, '2');
  assert.equal(ui.dom['responsable-activo'].children.length, 1);
});
test('HU-GA-01 CA01 envia POST autenticado y confirma respuesta', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(jsonReply(201, respuestaOk)) });
  await esperar();
  llenar(ui); await enviar(ui);
  const posts = llamadasPost(ui);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].route, '/api/v1/assets');
  assert.equal(posts[0].options.headers.Authorization, 'Bearer ' + superusuario.token);
  assert.deepEqual(JSON.parse(posts[0].options.body), {
    assetNumber: 'ACT-2026-0001', description: 'Computadora portatil', brand: 'Dell', model: null, serial: null,
    price: 125000.5, statusId: 1, locationId: 2, categoryId: 3, acquisitionModeId: 4,
    currentResponsibleId: null, notes: null,
  });
  assert.match(ui.dom['mensaje-activo'].textContent, /Activo ACT-2026-0001 registrado correctamente con ID 5/);
  assert.equal(ui.dom['formulario-activo'].resetCount, 1);
});
test('HU-GA-01 CA01 respuesta que no coincide no declara exito', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(jsonReply(201, { id: 9, assetNumber: 'OTRO' })) });
  await esperar();
  llenar(ui); await enviar(ui);
  assert.match(ui.dom['mensaje-activo'].textContent, /no confirmo/);
  assert.equal(ui.dom['formulario-activo'].resetCount, 0);
});

test('HU-GA-01 CA02 campos obligatorios vacios se rechazan', () => {
  const resultado = validarActivo({});
  assert.equal(resultado.valido, false);
  assert.deepEqual(Object.keys(resultado.errores).sort(),
    ['acquisitionModeId', 'assetNumber', 'categoryId', 'description', 'locationId', 'statusId']);
});
test('HU-GA-01 CA02 textos con solo espacios cuentan como vacios', () => {
  const resultado = validarActivo({ ...valido, assetNumber: '   ', description: '   ' });
  assert.ok(resultado.errores.assetNumber);
  assert.ok(resultado.errores.description);
});
test('HU-GA-01 CA02 no envia POST con datos incompletos y senala los campos', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(null) });
  await esperar();
  await enviar(ui);
  assert.equal(llamadasPost(ui).length, 0);
  assert.match(ui.dom['error-numero-activo'].textContent, /obligatorio/);
  assert.match(ui.dom['error-estado-activo'].textContent, /Seleccione/);
  assert.equal(ui.dom['numero-activo'].attrs['aria-invalid'], 'true');
  assert.equal(ui.dom['numero-activo'].focusCount, 1);
  assert.match(ui.dom['mensaje-activo'].textContent, /Revise los campos/);
});

test('HU-GA-01 CA03 numero de identificacion con formato invalido', () => {
  for (const numero of ['ACT 001', '-ACT001', 'ACT#001', 'ACT@001', 'A'.repeat(51)]) {
    assert.ok(validarActivo({ ...valido, assetNumber: numero }).errores.assetNumber, numero);
  }
});
test('HU-GA-01 CA03 el mensaje de formato incluye un ejemplo de entrada', () => {
  assert.match(validarActivo({ ...valido, assetNumber: 'ACT 001' }).errores.assetNumber, /Ejemplo: ACT-2026-0001/);
});
test('HU-GA-01 CA03 precio con formato invalido', () => {
  for (const precio of ['abc', '-5', '10,50', '10.123', '12345678901', '1e5']) {
    assert.ok(validarActivo({ ...valido, price: precio }).errores.price, precio);
  }
});
test('HU-GA-01 CA03 textos mas largos que la base de datos se rechazan', () => {
  const resultado = validarActivo({
    ...valido, description: 'D'.repeat(501), brand: 'M'.repeat(51), model: 'M'.repeat(51),
    serial: 'S'.repeat(51), notes: 'O'.repeat(1001),
  });
  assert.deepEqual(Object.keys(resultado.errores).sort(), ['brand', 'description', 'model', 'notes', 'serial']);
});
test('HU-GA-01 CA03 opcion de lista que no es un numero positivo se rechaza', () => {
  assert.ok(validarActivo({ ...valido, statusId: '0' }).errores.statusId);
  assert.ok(validarActivo({ ...valido, locationId: 'abc' }).errores.locationId);
  assert.ok(validarActivo({ ...valido, currentResponsibleId: '-3' }).errores.currentResponsibleId);
});
test('HU-GA-01 CA03 no envia POST con formato invalido', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(null) });
  await esperar();
  llenar(ui, { ...valido, assetNumber: 'ACT 001', price: '10,50' });
  await enviar(ui);
  assert.equal(llamadasPost(ui).length, 0);
  assert.match(ui.dom['error-numero-activo'].textContent, /sin espacios/);
  assert.match(ui.dom['error-precio-activo'].textContent, /punto decimal/);
});

test('HU-GA-01 CA04 activo existente muestra el error del servidor sin declarar exito', async () => {
  const mensajeServidor = 'Ya existe un activo con ese numero de identificacion';
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(jsonReply(400, { message: mensajeServidor })) });
  await esperar();
  llenar(ui); await enviar(ui);
  assert.equal(llamadasPost(ui).length, 1);
  assert.equal(ui.dom['mensaje-activo'].textContent, mensajeServidor);
  assert.match(ui.dom['mensaje-activo'].className, /error/);
  assert.equal(ui.dom['formulario-activo'].resetCount, 0);
  assert.equal(ui.storage.size, 1);
});

test('HU-GA-01 CA05 cancelar limpia sin hacer POST', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(null) });
  await esperar();
  llenar(ui);
  ui.dom['cancelar-activo'].handlers.click();
  assert.equal(llamadasPost(ui).length, 0);
  assert.equal(ui.dom['formulario-activo'].resetCount, 1);
  assert.deepEqual(ui.history, [['assign', 'panel.html']]);
});

test('HU-GA-01 exige sesion para entrar', () => {
  const ui = runPage('registrar-activo.js');
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GA-01 usuario que no es superusuario vuelve a la pantalla principal', () => {
  const ui = runPage('registrar-activo.js', { session: basico });
  assert.deepEqual(ui.history, [['replace', 'panel.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GA-01 error 401 al registrar termina la sesion', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(jsonReply(401, { message: 'No auth' })) });
  await esperar();
  llenar(ui); await enviar(ui);
  assert.equal(ui.storage.size, 0);
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GA-01 error 403 al registrar no declara registro', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: servidor(jsonReply(403, { message: 'Sin permisos' })) });
  await esperar();
  llenar(ui); await enviar(ui);
  assert.match(ui.dom['mensaje-activo'].textContent, /Sin permisos/);
  assert.equal(ui.dom['formulario-activo'].resetCount, 0);
});
test('HU-GA-01 fallo de red no declara registro', async () => {
  const ui = runPage('registrar-activo.js', { session: superusuario, response: new Error('disconnect') });
  await esperar();
  llenar(ui); await enviar(ui);
  assert.match(ui.dom['mensaje-activo'].textContent, /No se pudo conectar/);
  assert.equal(ui.dom['formulario-activo'].resetCount, 0);
});
test('HU-GA-01 catalogo vacio avisa que faltan datos en la base de datos', async () => {
  const vacio = { statuses: [], locations: [], categories: [], acquisitionModes: [], responsibles: [] };
  const ui = runPage('registrar-activo.js', { session: superusuario, response: () => jsonReply(200, vacio) });
  await esperar();
  assert.match(ui.dom['mensaje-activo'].textContent, /No hay estados, ubicaciones, categorias, modos de adquisicion/);
});
