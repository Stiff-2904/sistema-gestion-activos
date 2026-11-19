const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runPage, jsonReply } = require('./util.cjs');

const admin = {token:'jwt.super',id:1,name:'Admin',email:'admin@ctposa.ac.cr',role:'SUPERUSER'};
const intermediate = {token:'jwt.user',id:2,name:'Auxiliar',email:'aux@ctposa.ac.cr',role:'INTERMEDIATE_USER'};
const tick = () => new Promise(setImmediate);

for (const html of [path.join(__dirname,'../dashboard.html'), path.join(__dirname,'../../backend/asset-management-api/src/main/resources/static/dashboard.html')]) {
  test('Panel muestra Consultar activo junto a Registrar activo: ' + path.basename(path.dirname(html)), () => {
    const source = fs.readFileSync(html,'utf8');
    const section = source.match(/<section aria-label="Gestión de activos"[^>]*>([\s\S]*?)<\/section>/);
    assert.ok(section, 'Debe existir la sección Gestión de activos');
    assert.match(section[1], /id="link-asset"[^>]*data-admin-link hidden/);
    assert.match(section[1], /id="link-view-asset"/);
    assert.ok(section[1].indexOf('id="link-asset"') < section[1].indexOf('id="link-view-asset"'));
    assert.equal((source.match(/id="link-view-asset"/g) || []).length, 1);
    assert.doesNotMatch(source, /aria-label="Consulta de activos"/);
    assert.match(section[1], /id="counter-functions-assets"/);
  });
}

test('SUPERUSER ve ambas tarjetas y el contador de 3 funciones', async () => {
  const ui = runPage('dashboard.js', {session:admin,response:jsonReply(200,admin)});
  await tick();
  assert.equal(ui.dom['link-asset'].hidden, false);
  assert.equal(ui.dom['counter-functions-assets'].textContent, '3 FUNCIONES');
});

test('INTERMEDIATE_USER consulta sin mostrar el registro y cuenta 1 función', async () => {
  const ui = runPage('dashboard.js', {session:intermediate,response:jsonReply(200,intermediate)});
  await tick();
  assert.equal(ui.dom['link-asset'].hidden, true);
  assert.equal(ui.dom['counter-functions-assets'].textContent, '1 FUNCIÓN');
});
