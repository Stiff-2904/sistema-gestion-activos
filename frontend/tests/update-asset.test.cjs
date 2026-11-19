const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runPage, jsonReply } = require('./util.cjs');

const admin = {token:'jwt.super',role:'SUPERUSER',id:1,email:'admin@ctposa.ac.cr'};
const intermediate = {token:'jwt.intermedio',role:'INTERMEDIATE_USER',id:2,email:'aux@ctposa.ac.cr'};
const asset = {id:5,assetNumber:'ACT-005',description:'Computadora antigua',brand:'Dell',model:'',serial:'',
  price:100000,statusId:1,status:'Bueno',locationId:2,location:'Laboratorio',categoryId:3,
  category:'Computo',acquisitionModeId:4,acquisitionMode:'Compra',currentResponsibleId:null,
  currentResponsible:null,notes:'',decommissioned:false};
const catalog = {statuses:[{id:1,name:'Bueno'}],locations:[{id:2,name:'Laboratorio'}],
  categories:[{id:3,name:'Computo'}],acquisitionModes:[{id:4,name:'Compra'}],responsibles:[]};
const tick = () => new Promise(setImmediate);
const server = (route, options) => {
  if (route === '/api/v1/assets') return jsonReply(200,[asset]);
  if (route === '/api/v1/assets/catalog') return jsonReply(200,catalog);
  if (route === '/api/v1/assets/5' && options.method === 'GET') return jsonReply(200,asset);
  if (route === '/api/v1/assets/5' && options.method === 'PUT') return jsonReply(200,{...asset,description:'Computadora actualizada'});
  throw new Error('Ruta inesperada: ' + route);
};
async function loadData(ui) {
  ui.dom['id-editing'].value='5';
  await ui.dom['form-search-editing'].handlers.submit({preventDefault(){}});
  await tick();
}
async function submitData(ui) {
  await ui.dom['form-editing'].handlers.submit({preventDefault(){}});
  await tick();
}

test('HU-GA-03 CA01 carga el registro y envía PUT autenticado',async () => {
  const ui=runPage('update-asset.js',{session:admin,response:server});
  await loadData(ui);
  assert.equal(ui.dom['section-editing'].hidden,false);
  assert.equal(ui.dom['description-asset'].value,'Computadora antigua');
  ui.dom['description-asset'].value='Computadora actualizada';
  await submitData(ui);
  const puts=ui.calls.filter(c=>c.options.method==='PUT');
  assert.equal(puts.length,1);
  assert.equal(puts[0].route,'/api/v1/assets/5');
  assert.equal(puts[0].options.headers.Authorization,'Bearer jwt.super');
  assert.equal(JSON.parse(puts[0].options.body).description,'Computadora actualizada');
  assert.match(ui.dom['message-editing'].textContent,/actualizado correctamente/);
});

test('HU-GA-03 CA02 datos obligatorios incompletos bloquean PUT',async()=>{
  const ui=runPage('update-asset.js',{session:admin,response:server});
  await loadData(ui);
  ui.dom['description-asset'].value='  ';
  await submitData(ui);
  assert.equal(ui.calls.filter(c=>c.options.method==='PUT').length,0);
  assert.match(ui.dom['error-description-asset'].textContent,/obligatoria/);
});

test('HU-GA-03 CA03 un precio inválido impide guardar cambios',async()=>{
  const ui=runPage('update-asset.js',{session:admin,response:server});
  await loadData(ui);
  ui.dom['price-asset'].value='1000.999';
  await submitData(ui);
  assert.equal(ui.calls.filter(c=>c.options.method==='PUT').length,0);
  assert.match(ui.dom['error-price-asset'].textContent,/maximo 2 decimales/);
});

test('HU-GA-03 CA04 cancelar descarta los datos sin enviar PUT',async()=>{
  const ui=runPage('update-asset.js',{session:admin,response:server});
  await loadData(ui);
  ui.dom['description-asset'].value='Modificación sin confirmar';
  const before=ui.calls.length;
  ui.dom['cancel-editing'].handlers.click();
  assert.equal(ui.calls.length,before);
  assert.equal(ui.dom['form-editing'].resetCount,1);
  assert.equal(ui.dom['section-editing'].hidden,true);
  assert.equal(ui.history.length,0);
  assert.equal(ui.dom['id-editing'].value,'');
  assert.ok(ui.calls.every(c=>c.options.method==='GET'));
});

test('HU-GA-03 solo SUPERUSER accede a pantalla de actualización',()=>{
  const ui=runPage('update-asset.js',{session:intermediate,response:server});
  assert.deepEqual(ui.history,[['replace','dashboard.html']]);
  assert.equal(ui.calls.length,0);
});

test('HU-GA-03 un activo inexistente no muestra formulario',async()=>{
  const ui=runPage('update-asset.js',{session:admin,
    response:(route)=>route==='/api/v1/assets' ? jsonReply(200,[asset])
      : route==='/api/v1/assets/catalog' ? jsonReply(200,catalog)
      : jsonReply(404,{message:'No existe'})});
  await loadData(ui);
  assert.equal(ui.dom['section-editing'].hidden,true);
  assert.match(ui.dom['message-load-editing'].textContent,/no existe/);
  assert.ok(ui.calls.every(c=>c.options.method==='GET'));
});

test('HU-GA-03 SUPERUSER ve boton actualizar en la lista de consulta',async()=>{
  const ui=runPage('view-asset.js',{session:admin,
    response:(route)=>route==='/api/v1/assets' ? jsonReply(200,[asset]) : jsonReply(200,asset)});
  await tick();
  const buttons=ui.dom['body-assets'].children[0].children[4].children;
  assert.equal(buttons.length,2);
  assert.equal(buttons[1].href,'update-asset.html?id=5');
});

test('HU-GA-03 INTERMEDIATE_USER no ve boton actualizar',async()=>{
  const ui=runPage('view-asset.js',{session:intermediate,
    response:(route)=>route==='/api/v1/assets' ? jsonReply(200,[asset]) : jsonReply(200,asset)});
  await tick();
  assert.equal(ui.dom['body-assets'].children[0].children[4].children.length,1);
});

test('HU-GA-03 panel muestra tarjeta dentro de Gestión de activos',()=>{
  for (const folder of ['frontend','backend/asset-management-api/src/main/resources/static']) {
    const html=fs.readFileSync(path.join(__dirname,'../../',folder,'dashboard.html'),'utf8');
    const section=html.match(/<section aria-label="Gestión de activos"[^>]*>([\s\S]*?)<\/section>/)[1];
    assert.match(section,/id="link-update-asset"/);
    assert.ok(section.indexOf('id="link-view-asset"')<section.indexOf('id="link-update-asset"'));
  }
});


test('HU-GA-03 panel muestra actualización solamente al superusuario',async()=>{
  const a=runPage('dashboard.js',{session:admin,response:jsonReply(200,admin)});
  const i=runPage('dashboard.js',{session:intermediate,response:jsonReply(200,intermediate)});
  await tick();
  assert.equal(a.dom['link-update-asset'].hidden,false);
  assert.equal(i.dom['link-update-asset'].hidden,true);
  assert.equal(a.dom['counter-functions-assets'].textContent,'3 FUNCIONES');
});
