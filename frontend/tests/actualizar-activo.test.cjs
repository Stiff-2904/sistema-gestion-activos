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
async function cargar(ui) {
  ui.dom['id-edicion'].value='5';
  await ui.dom['formulario-buscar-edicion'].handlers.submit({preventDefault(){}});
  await tick();
}
async function submitData(ui) {
  await ui.dom['formulario-edicion'].handlers.submit({preventDefault(){}});
  await tick();
}

test('HU-GA-03 CA01 carga el registro y envía PUT autenticado',async () => {
  const ui=runPage('actualizar-activo.js',{session:admin,response:server});
  await cargar(ui);
  assert.equal(ui.dom['seccion-edicion'].hidden,false);
  assert.equal(ui.dom['descripcion-activo'].value,'Computadora antigua');
  ui.dom['descripcion-activo'].value='Computadora actualizada';
  await submitData(ui);
  const puts=ui.calls.filter(c=>c.options.method==='PUT');
  assert.equal(puts.length,1);
  assert.equal(puts[0].route,'/api/v1/assets/5');
  assert.equal(puts[0].options.headers.Authorization,'Bearer jwt.super');
  assert.equal(JSON.parse(puts[0].options.body).description,'Computadora actualizada');
  assert.match(ui.dom['mensaje-edicion'].textContent,/actualizado correctamente/);
});

test('HU-GA-03 CA02 datos obligatorios incompletos bloquean PUT',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:server});
  await cargar(ui);
  ui.dom['descripcion-activo'].value='  ';
  await submitData(ui);
  assert.equal(ui.calls.filter(c=>c.options.method==='PUT').length,0);
  assert.match(ui.dom['error-descripcion-activo'].textContent,/obligatoria/);
});

test('HU-GA-03 CA03 un precio inválido impide guardar cambios',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:server});
  await cargar(ui);
  ui.dom['precio-activo'].value='1000.999';
  await submitData(ui);
  assert.equal(ui.calls.filter(c=>c.options.method==='PUT').length,0);
  assert.match(ui.dom['error-precio-activo'].textContent,/maximo 2 decimales/);
});

test('HU-GA-03 CA04 cancelar descarta los datos sin enviar PUT',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:server});
  await cargar(ui);
  ui.dom['descripcion-activo'].value='Modificación sin confirmar';
  const before=ui.calls.length;
  ui.dom['cancelar-edicion'].handlers.click();
  assert.equal(ui.calls.length,before);
  assert.equal(ui.dom['formulario-edicion'].resetCount,1);
  assert.equal(ui.dom['seccion-edicion'].hidden,true);
  assert.equal(ui.history.length,0);
  assert.equal(ui.dom['id-edicion'].value,'');
  assert.ok(ui.calls.every(c=>c.options.method==='GET'));
});

test('HU-GA-03 solo SUPERUSER accede a pantalla de actualización',()=>{
  const ui=runPage('actualizar-activo.js',{session:intermediate,response:server});
  assert.deepEqual(ui.history,[['replace','panel.html']]);
  assert.equal(ui.calls.length,0);
});

test('HU-GA-03 un activo inexistente no muestra formulario',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,
    response:(route)=>route==='/api/v1/assets' ? jsonReply(200,[asset])
      : route==='/api/v1/assets/catalog' ? jsonReply(200,catalog)
      : jsonReply(404,{message:'No existe'})});
  await cargar(ui);
  assert.equal(ui.dom['seccion-edicion'].hidden,true);
  assert.match(ui.dom['mensaje-carga-edicion'].textContent,/no existe/);
  assert.ok(ui.calls.every(c=>c.options.method==='GET'));
});

test('HU-GA-03 SUPERUSER ve boton actualizar en la lista de consulta',async()=>{
  const ui=runPage('consultar-activo.js',{session:admin,
    response:(route)=>route==='/api/v1/assets' ? jsonReply(200,[asset]) : jsonReply(200,asset)});
  await tick();
  const buttons=ui.dom['cuerpo-activos'].children[0].children[4].children;
  assert.equal(buttons.length,2);
  assert.equal(buttons[1].href,'actualizar-activo.html?id=5');
});

test('HU-GA-03 INTERMEDIATE_USER no ve boton actualizar',async()=>{
  const ui=runPage('consultar-activo.js',{session:intermediate,
    response:(route)=>route==='/api/v1/assets' ? jsonReply(200,[asset]) : jsonReply(200,asset)});
  await tick();
  assert.equal(ui.dom['cuerpo-activos'].children[0].children[4].children.length,1);
});

test('HU-GA-03 panel muestra tarjeta dentro de Gestión de activos',()=>{
  for (const folder of ['frontend','backend/asset-management-api/src/main/resources/static']) {
    const html=fs.readFileSync(path.join(__dirname,'../../',folder,'panel.html'),'utf8');
    const section=html.match(/<section aria-label="Gestión de activos"[^>]*>([\s\S]*?)<\/section>/)[1];
    assert.match(section,/id="enlace-actualizar-activo"/);
    assert.ok(section.indexOf('id="enlace-consulta-activo"')<section.indexOf('id="enlace-actualizar-activo"'));
  }
});


test('HU-GA-03 panel muestra actualización solamente al superusuario',async()=>{
  const a=runPage('panel.js',{session:admin,response:jsonReply(200,admin)});
  const i=runPage('panel.js',{session:intermediate,response:jsonReply(200,intermediate)});
  await tick();
  assert.equal(a.dom['enlace-actualizar-activo'].hidden,false);
  assert.equal(i.dom['enlace-actualizar-activo'].hidden,true);
  assert.equal(a.dom['contador-funciones-activos'].textContent,'3 FUNCIONES');
});
