const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runPage, jsonReply } = require('./util.cjs');

const admin = {token:'jwt.super',role:'SUPERUSER',id:1,email:'admin@ctposa.ac.cr'};
const intermedio = {token:'jwt.intermedio',role:'INTERMEDIATE_USER',id:2,email:'aux@ctposa.ac.cr'};
const activo = {id:5,assetNumber:'ACT-005',description:'Computadora antigua',brand:'Dell',model:'',serial:'',
  price:100000,statusId:1,status:'Bueno',locationId:2,location:'Laboratorio',categoryId:3,
  category:'Computo',acquisitionModeId:4,acquisitionMode:'Compra',currentResponsibleId:null,
  currentResponsible:null,notes:'',decommissioned:false};
const catalogo = {statuses:[{id:1,name:'Bueno'}],locations:[{id:2,name:'Laboratorio'}],
  categories:[{id:3,name:'Computo'}],acquisitionModes:[{id:4,name:'Compra'}],responsibles:[]};
const tick = () => new Promise(setImmediate);
const servidor = (ruta, opciones) => {
  if (ruta === '/api/v1/assets') return jsonReply(200,[activo]);
  if (ruta === '/api/v1/assets/catalog') return jsonReply(200,catalogo);
  if (ruta === '/api/v1/assets/5' && opciones.method === 'GET') return jsonReply(200,activo);
  if (ruta === '/api/v1/assets/5' && opciones.method === 'PUT') return jsonReply(200,{...activo,description:'Computadora actualizada'});
  throw new Error('Ruta inesperada: ' + ruta);
};
async function cargar(ui) {
  ui.dom['id-edicion'].value='5';
  await ui.dom['formulario-buscar-edicion'].handlers.submit({preventDefault(){}});
  await tick();
}
async function enviar(ui) {
  await ui.dom['formulario-edicion'].handlers.submit({preventDefault(){}});
  await tick();
}

test('HU-GA-03 CA01 carga el registro y envía PUT autenticado',async () => {
  const ui=runPage('actualizar-activo.js',{session:admin,response:servidor});
  await cargar(ui);
  assert.equal(ui.dom['seccion-edicion'].hidden,false);
  assert.equal(ui.dom['descripcion-activo'].value,'Computadora antigua');
  ui.dom['descripcion-activo'].value='Computadora actualizada';
  await enviar(ui);
  const puts=ui.calls.filter(c=>c.options.method==='PUT');
  assert.equal(puts.length,1);
  assert.equal(puts[0].route,'/api/v1/assets/5');
  assert.equal(puts[0].options.headers.Authorization,'Bearer jwt.super');
  assert.equal(JSON.parse(puts[0].options.body).description,'Computadora actualizada');
  assert.match(ui.dom['mensaje-edicion'].textContent,/actualizado correctamente/);
});

test('HU-GA-03 CA02 datos obligatorios incompletos bloquean PUT',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:servidor});
  await cargar(ui);
  ui.dom['descripcion-activo'].value='  ';
  await enviar(ui);
  assert.equal(ui.calls.filter(c=>c.options.method==='PUT').length,0);
  assert.match(ui.dom['error-descripcion-activo'].textContent,/obligatoria/);
});

test('HU-GA-03 CA03 un precio inválido impide guardar cambios',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:servidor});
  await cargar(ui);
  ui.dom['precio-activo'].value='1000.999';
  await enviar(ui);
  assert.equal(ui.calls.filter(c=>c.options.method==='PUT').length,0);
  assert.match(ui.dom['error-precio-activo'].textContent,/maximo 2 decimales/);
});

test('HU-GA-03 CA04 cancelar descarta los datos sin enviar PUT',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:servidor});
  await cargar(ui);
  ui.dom['descripcion-activo'].value='Modificación sin confirmar';
  const antes=ui.calls.length;
  ui.dom['cancelar-edicion'].handlers.click();
  assert.equal(ui.calls.length,antes);
  assert.equal(ui.dom['formulario-edicion'].resetCount,1);
  assert.equal(ui.dom['seccion-edicion'].hidden,true);
  assert.equal(ui.history.length,0);
  assert.equal(ui.dom['id-edicion'].value,'');
  assert.ok(ui.calls.every(c=>c.options.method==='GET'));
});

test('HU-GA-03 solo SUPERUSER accede a pantalla de actualización',()=>{
  const ui=runPage('actualizar-activo.js',{session:intermedio,response:servidor});
  assert.deepEqual(ui.history,[['replace','panel.html']]);
  assert.equal(ui.calls.length,0);
});

test('HU-GA-03 un activo inexistente no muestra formulario',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,
    response:(ruta)=>ruta==='/api/v1/assets' ? jsonReply(200,[activo])
      : ruta==='/api/v1/assets/catalog' ? jsonReply(200,catalogo)
      : jsonReply(404,{message:'No existe'})});
  await cargar(ui);
  assert.equal(ui.dom['seccion-edicion'].hidden,true);
  assert.match(ui.dom['mensaje-carga-edicion'].textContent,/no existe/);
  assert.ok(ui.calls.every(c=>c.options.method==='GET'));
});

test('HU-GA-03 SUPERUSER ve boton actualizar en la lista de consulta',async()=>{
  const ui=runPage('consultar-activo.js',{session:admin,
    response:(ruta)=>ruta==='/api/v1/assets' ? jsonReply(200,[activo]) : jsonReply(200,activo)});
  await tick();
  const botones=ui.dom['cuerpo-activos'].children[0].children[4].children;
  assert.equal(botones.length,2);
  assert.equal(botones[1].href,'actualizar-activo.html?id=5');
});

test('HU-GA-03 INTERMEDIATE_USER no ve boton actualizar',async()=>{
  const ui=runPage('consultar-activo.js',{session:intermedio,
    response:(ruta)=>ruta==='/api/v1/assets' ? jsonReply(200,[activo]) : jsonReply(200,activo)});
  await tick();
  assert.equal(ui.dom['cuerpo-activos'].children[0].children[4].children.length,1);
});

test('HU-GA-03 panel muestra tarjeta dentro de Gestión de activos',()=>{
  for (const carpeta of ['frontend','backend/asset-management-api/src/main/resources/static']) {
    const html=fs.readFileSync(path.join(__dirname,'../../',carpeta,'panel.html'),'utf8');
    const seccion=html.match(/<section aria-label="Gestión de activos"[^>]*>([\s\S]*?)<\/section>/)[1];
    assert.match(seccion,/id="enlace-actualizar-activo"/);
    assert.ok(seccion.indexOf('id="enlace-consulta-activo"')<seccion.indexOf('id="enlace-actualizar-activo"'));
  }
});


test('HU-GA-03 panel muestra actualización solamente al superusuario',async()=>{
  const a=runPage('panel.js',{session:admin,response:jsonReply(200,admin)});
  const i=runPage('panel.js',{session:intermedio,response:jsonReply(200,intermedio)});
  await tick();
  assert.equal(a.dom['enlace-actualizar-activo'].hidden,false);
  assert.equal(i.dom['enlace-actualizar-activo'].hidden,true);
  assert.equal(a.dom['contador-funciones-activos'].textContent,'3 FUNCIONES');
});
