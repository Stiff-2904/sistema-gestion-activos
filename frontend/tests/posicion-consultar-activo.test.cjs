const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runPage, jsonReply } = require('./util.cjs');

const admin = {token:'jwt.super',id:1,name:'Admin',email:'admin@ctposa.ac.cr',role:'SUPERUSER'};
const intermediate = {token:'jwt.user',id:2,name:'Auxiliar',email:'aux@ctposa.ac.cr',role:'INTERMEDIATE_USER'};
const tick = () => new Promise(setImmediate);

for (const html of [path.join(__dirname,'../panel.html'), path.join(__dirname,'../../backend/asset-management-api/src/main/resources/static/panel.html')]) {
  test('Panel muestra Consultar activo junto a Registrar activo: ' + path.basename(path.dirname(html)), () => {
    const source = fs.readFileSync(html,'utf8');
    const section = source.match(/<section aria-label="Gestión de activos"[^>]*>([\s\S]*?)<\/section>/);
    assert.ok(section, 'Debe existir la sección Gestión de activos');
    assert.match(section[1], /id="enlace-activo"[^>]*data-admin-link hidden/);
    assert.match(section[1], /id="enlace-consulta-activo"/);
    assert.ok(section[1].indexOf('id="enlace-activo"') < section[1].indexOf('id="enlace-consulta-activo"'));
    assert.equal((source.match(/id="enlace-consulta-activo"/g) || []).length, 1);
    assert.doesNotMatch(source, /aria-label="Consulta de activos"/);
    assert.match(section[1], /id="contador-funciones-activos"/);
  });
}

test('SUPERUSER ve ambas tarjetas y el contador de 3 funciones', async () => {
  const ui = runPage('panel.js', {session:admin,response:jsonReply(200,admin)});
  await tick();
  assert.equal(ui.dom['enlace-activo'].hidden, false);
  assert.equal(ui.dom['contador-funciones-activos'].textContent, '3 FUNCIONES');
});

test('INTERMEDIATE_USER consulta sin mostrar el registro y cuenta 1 función', async () => {
  const ui = runPage('panel.js', {session:intermediate,response:jsonReply(200,intermediate)});
  await tick();
  assert.equal(ui.dom['enlace-activo'].hidden, true);
  assert.equal(ui.dom['contador-funciones-activos'].textContent, '1 FUNCIÓN');
});
