const test = require('node:test');
const assert = require('node:assert/strict');
const {runPage,jsonReply}=require('./util.cjs');
const admin={token:'jwt.super',role:'SUPERUSER',id:1};
const model={id:5,assetNumber:'ACT-005',description:'Antes de editar',brand:'Dell',model:'Latitude',serial:'XA1',price:15000,
  statusId:1,status:'Activo',locationId:2,categoryId:3,acquisitionModeId:4,currentResponsibleId:null,notes:''};
const catalog={statuses:[{id:1,name:'Activo'}],locations:[{id:2,name:'Oficina'}],categories:[{id:3,name:'Equipo'}],acquisitionModes:[{id:4,name:'Compra'}],responsibles:[]};
const tick=()=>new Promise(setImmediate);

test('El listado aparece al entrar, y seleccionar Actualizar carga datos en la misma página',async()=>{
  const asset={...model};
  const ui=runPage('update-asset.js',{session:admin,response:(route)=>{
    if(route==='/api/v1/assets')return jsonReply(200,[asset]);
    if(route==='/api/v1/assets/catalog')return jsonReply(200,catalog);
    if(route==='/api/v1/assets/5')return jsonReply(200,asset);
    throw new Error('ruta inesperada '+route);
  }});
  await tick();
  assert.equal(ui.dom['table-editing-assets'].hidden,false);
  assert.equal(ui.dom['body-editing-assets'].children.length,1);
  const row=ui.dom['body-editing-assets'].children[0];
  assert.equal(row.children[2].textContent,'Antes de editar');
  row.children[4].children[0].handlers.click();
  await tick();
  assert.equal(ui.dom['section-editing'].hidden,false);
  assert.equal(ui.dom['id-editing'].value,'5');
  assert.equal(ui.dom['description-asset'].value,'Antes de editar');
  assert.equal(ui.history.length,0);
  assert.equal(row.classList.contains('view-row-selected'),true);
});

test('Guardar actualiza la tabla con los datos devueltos por el backend',async()=>{
  let asset={...model};
  const ui=runPage('update-asset.js',{session:admin,response:(route,options)=>{
    if(route==='/api/v1/assets')return jsonReply(200,[asset]);
    if(route==='/api/v1/assets/catalog')return jsonReply(200,catalog);
    if(route==='/api/v1/assets/5' && options.method==='GET')return jsonReply(200,asset);
    if(route==='/api/v1/assets/5' && options.method==='PUT'){
      asset={...asset,description:JSON.parse(options.body).description};
      return jsonReply(200,asset);
    }
    throw new Error('ruta inesperada '+route);
  }});
  await tick();
  ui.dom['body-editing-assets'].children[0].children[4].children[0].handlers.click();
  await tick();
  ui.dom['description-asset'].value='Descripción actualizada en tabla';
  await ui.dom['form-editing'].handlers.submit({preventDefault(){}});
  await tick();
  assert.equal(ui.calls.filter(x=>x.route==='/api/v1/assets').length,2);
  assert.equal(ui.dom['body-editing-assets'].children[0].children[2].textContent,'Descripción actualizada en tabla');
  assert.match(ui.dom['message-editing'].textContent,/actualizado correctamente/);
  assert.equal(ui.dom['section-editing'].hidden,false);
  assert.equal(ui.history.length,0);
});

test('Cancelar abandona edición sin PUT y conserva el listado dentro de la página',async()=>{
  const ui=runPage('update-asset.js',{session:admin,response:(route)=>{
    if(route==='/api/v1/assets')return jsonReply(200,[model]);
    if(route==='/api/v1/assets/catalog')return jsonReply(200,catalog);
    return jsonReply(200,model);
  }});
  await tick();
  ui.dom['body-editing-assets'].children[0].children[4].children[0].handlers.click();
  await tick();
  ui.dom['description-asset'].value='Sin guardar';
  ui.dom['cancel-editing'].handlers.click();
  assert.equal(ui.dom['section-editing'].hidden,true);
  assert.equal(ui.dom['table-editing-assets'].hidden,false);
  assert.equal(ui.dom['body-editing-assets'].children.length,1);
  assert.equal(ui.calls.filter(x=>x.options.method==='PUT').length,0);
  assert.equal(ui.history.length,0);
});

test('Sin activos muestra mensaje vacío y oculta la tabla',async()=>{
  const ui=runPage('update-asset.js',{session:admin,response:()=>jsonReply(200,[])});
  await tick();
  assert.equal(ui.dom['table-editing-assets'].hidden,true);
  assert.match(ui.dom['message-listing-editing'].textContent,/No hay activos registrados/);
});
