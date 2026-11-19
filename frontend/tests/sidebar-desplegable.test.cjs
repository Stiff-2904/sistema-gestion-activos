const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pages = ['panel.html','crear-usuario.html','update_user.html','modificar-rol.html','estado-usuario.html',
  'registrar-activo.html','consultar-activo.html','actualizar-activo.html','catalogos.html'];

class Elemento {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attrs = {};
    this.className = '';
    this.hidden = false;
    this.handlers = {};
    this.classList = {
      add: (...names) => { const set=new Set(this.className.split(' ').filter(Boolean)); names.forEach(name=>set.add(name)); this.className=[...set].join(' '); },
      toggle: (name, flag) => {const s=new Set(this.className.split(' ').filter(Boolean)); if(flag ?? !s.has(name)) s.add(name); else s.delete(name); this.className=[...s].join(' ');},
    };
  }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name,value) { this.attrs[name]=value; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  addEventListener(name, fn) { this.handlers[name]=fn; }
}
function navPara(rol, ruta) {
  const nav=new Elemento('nav'), movil=new Elemento('button'), barra=new Elemento('aside');
  const document = {
    getElementById: id=>({'navegacion-principal':nav,'sidebar-menu-toggle':movil})[id]||null,
    querySelector: name=>name==='.sidebar'?barra:null,
    createElement: tag=>new Elemento(tag),
    createTextNode: text=>({textContent:text}),
  };
  const window = {SGAAPI:{sesion:()=>rol ? {role:rol,token:'mock'} : null},location:{pathname:'/'+ruta}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/sidebar.js'),'utf8'),{window,document});
  return {nav,movil,barra};
}
const filas = nav=>{
  const result=[];
  function walk(n) { if(n.href) result.push(n); for(const child of (n.children||[])) walk(child); }
  walk(nav);return result;
};
const porHref = (nav,href) => filas(nav).find(el=>el.href===href);

test('Todas las páginas internas comparten la misma navegación y sus scripts',()=>{
  for(const prefix of [root, path.join(root,'../backend/asset-management-api/src/main/resources/static')]) {
    for(const html of pages) {
      const source=fs.readFileSync(path.join(prefix,html),'utf8');
      assert.match(source,/id="navegacion-principal"/);
      assert.match(source,/id="sidebar-menu-toggle"/);
      assert.match(source,/src="js\/sidebar.js"/);
      assert.equal((source.match(/class="nav-list"/g)||[]).length,1);
    }
  }
});

test('SUPERUSER ve panel independiente, cuatro funciones de usuarios y cuatro opciones de activos',()=>{
  const {nav}=navPara('SUPERUSER','panel.html');
  assert.deepEqual(filas(nav).map(i=>i.href),[
    'panel.html','crear-usuario.html','update_user.html','modificar-rol.html','estado-usuario.html',
    'registrar-activo.html','consultar-activo.html','actualizar-activo.html','catalogos.html'
  ]);
  assert.equal(nav.children[1].children[0].children[1].textContent,'Usuarios');
  assert.equal(nav.children[2].children[0].children[1].textContent,'Activos');
  assert.equal(porHref(nav,'panel.html').attrs['aria-current'],'page');
});

test('Usuarios se despliega, contrae y actualiza flecha accesible',()=>{
  const {nav}=navPara('SUPERUSER','panel.html');
  const grupo=nav.children[1],toggle=grupo.children[0],contenido=grupo.children[1];
  assert.equal(toggle.attrs['aria-expanded'],'false');assert.equal(contenido.hidden,true);
  toggle.handlers.click();assert.equal(toggle.attrs['aria-expanded'],'true');assert.equal(contenido.hidden,false);
  toggle.handlers.click();assert.equal(toggle.attrs['aria-expanded'],'false');assert.equal(contenido.hidden,true);
});

test('Activos abre categoría y marca enlace seleccionado',()=>{
  const {nav}=navPara('SUPERUSER','actualizar-activo.html');
  const grupo=nav.children[2];
  assert.equal(grupo.children[0].attrs['aria-expanded'],'true');
  assert.equal(grupo.children[1].hidden,false);
  assert.equal(porHref(nav,'actualizar-activo.html').attrs['aria-current'],'page');
  assert.match(porHref(nav,'actualizar-activo.html').className,/active/);
  grupo.children[0].handlers.click();assert.equal(grupo.children[1].hidden,true);
});

test('INTERMEDIATE_USER no ve acciones restringidas pero sí Consultar y Catálogos',()=>{
  const {nav}=navPara('INTERMEDIATE_USER','consultar-activo.html');
  assert.deepEqual(filas(nav).map(i=>i.href),['panel.html','consultar-activo.html','catalogos.html']);
  assert.equal(nav.children.length,2);
  assert.equal(nav.children[1].children[0].attrs['aria-expanded'],'true');
});

test('BASIC_USER ve panel y consulta y no ve opciones reservadas',()=>{
  const {nav}=navPara('BASIC_USER','panel.html');
  assert.deepEqual(filas(nav).map(i=>i.href),['panel.html','consultar-activo.html']);
});

test('Menú móvil se abre y cierra sin afectar los submenús',()=>{
  const {movil,barra,nav}=navPara('SUPERUSER','panel.html');
  assert.equal(movil.getAttribute('aria-expanded'),null); // valor HTML inicial: false
  movil.handlers.click();
  assert.equal(movil.getAttribute('aria-expanded'),'true');
  assert.match(barra.className,/nav-mobile-open/);
  const usuario=nav.children[1].children[0];usuario.handlers.click();
  assert.equal(usuario.getAttribute('aria-expanded'),'true');
  movil.handlers.click();
  assert.equal(movil.getAttribute('aria-expanded'),'false');
  assert.equal(barra.className.includes('nav-mobile-open'),false);
});
