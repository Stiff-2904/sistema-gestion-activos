const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pages = ['dashboard.html','create-user.html','update-user.html','change-role.html','user-status.html',
  'register-asset.html','view-asset.html','update-asset.html','catalogs.html'];

class Item {
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
function navigationFor(roleInput, route) {
  const nav=new Item('nav'), mobileToggle=new Item('button'), sidebar=new Item('aside');
  const document = {
    getElementById: id=>({'main-navigation':nav,'sidebar-menu-toggle':mobileToggle})[id]||null,
    querySelector: name=>name==='.sidebar'?sidebar:null,
    createElement: tag=>new Item(tag),
    createTextNode: text=>({textContent:text}),
  };
  const window = {AssetManagementAPI:{session:()=>roleInput ? {role:roleInput,token:'mock'} : null},location:{pathname:'/'+route}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/sidebar.js'),'utf8'),{window,document});
  return {nav,mobileToggle,sidebar};
}
const rows = nav=>{
  const result=[];
  function walk(n) { if(n.href) result.push(n); for(const child of (n.children||[])) walk(child); }
  walk(nav);return result;
};
const byHref = (nav,href) => rows(nav).find(el=>el.href===href);

test('Todas las páginas internas comparten la misma navegación y sus scripts',()=>{
  for(const prefix of [root, path.join(root,'../backend/asset-management-api/src/main/resources/static')]) {
    for(const html of pages) {
      const source=fs.readFileSync(path.join(prefix,html),'utf8');
      assert.match(source,/id="main-navigation"/);
      assert.match(source,/id="sidebar-menu-toggle"/);
      assert.match(source,/src="js\/sidebar.js"/);
      assert.equal((source.match(/class="nav-list"/g)||[]).length,1);
    }
  }
});

test('SUPERUSER ve panel independiente, cuatro funciones de usuarios y cuatro opciones de activos',()=>{
  const {nav}=navigationFor('SUPERUSER','dashboard.html');
  assert.deepEqual(rows(nav).map(i=>i.href),[
    'dashboard.html','create-user.html','update-user.html','change-role.html','user-status.html',
    'register-asset.html','view-asset.html','update-asset.html','catalogs.html'
  ]);
  assert.equal(nav.children[1].children[0].children[1].textContent,'Usuarios');
  assert.equal(nav.children[2].children[0].children[1].textContent,'Activos');
  assert.equal(byHref(nav,'dashboard.html').attrs['aria-current'],'page');
});

test('Usuarios se despliega, contrae y actualiza flecha accesible',()=>{
  const {nav}=navigationFor('SUPERUSER','dashboard.html');
  const group=nav.children[1],toggle=group.children[0],content=group.children[1];
  assert.equal(toggle.attrs['aria-expanded'],'false');assert.equal(content.hidden,true);
  toggle.handlers.click();assert.equal(toggle.attrs['aria-expanded'],'true');assert.equal(content.hidden,false);
  toggle.handlers.click();assert.equal(toggle.attrs['aria-expanded'],'false');assert.equal(content.hidden,true);
});

test('Activos abre categoría y marca enlace seleccionado',()=>{
  const {nav}=navigationFor('SUPERUSER','update-asset.html');
  const group=nav.children[2];
  assert.equal(group.children[0].attrs['aria-expanded'],'true');
  assert.equal(group.children[1].hidden,false);
  assert.equal(byHref(nav,'update-asset.html').attrs['aria-current'],'page');
  assert.match(byHref(nav,'update-asset.html').className,/active/);
  group.children[0].handlers.click();assert.equal(group.children[1].hidden,true);
});

test('INTERMEDIATE_USER no ve acciones restringidas pero sí Consultar y Catálogos',()=>{
  const {nav}=navigationFor('INTERMEDIATE_USER','view-asset.html');
  assert.deepEqual(rows(nav).map(i=>i.href),['dashboard.html','view-asset.html','catalogs.html']);
  assert.equal(nav.children.length,2);
  assert.equal(nav.children[1].children[0].attrs['aria-expanded'],'true');
});

test('BASIC_USER ve panel y consulta y no ve opciones reservadas',()=>{
  const {nav}=navigationFor('BASIC_USER','dashboard.html');
  assert.deepEqual(rows(nav).map(i=>i.href),['dashboard.html','view-asset.html']);
});

test('Menú móvil se abre y cierra sin afectar los submenús',()=>{
  const {mobileToggle,sidebar,nav}=navigationFor('SUPERUSER','dashboard.html');
  assert.equal(mobileToggle.getAttribute('aria-expanded'),null); // valor HTML inicial: false
  mobileToggle.handlers.click();
  assert.equal(mobileToggle.getAttribute('aria-expanded'),'true');
  assert.match(sidebar.className,/nav-mobile-open/);
  const user=nav.children[1].children[0];user.handlers.click();
  assert.equal(user.getAttribute('aria-expanded'),'true');
  mobileToggle.handlers.click();
  assert.equal(mobileToggle.getAttribute('aria-expanded'),'false');
  assert.equal(sidebar.className.includes('nav-mobile-open'),false);
});
