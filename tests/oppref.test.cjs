const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(search,storage=new Map()) {
  const location={search,pathname:'/assignment_NanoMotion/',hash:''},handlers={},nodes={};
  const app={innerHTML:'',links:[],querySelectorAll(){this.links=[...this.innerHTML.matchAll(/href="([^"]*)"/g)].map(m=>({href:m[1],getAttribute(){return this.href;},setAttribute(_k,v){this.href=v;}}));return this.links;}};
  const move=href=>{const u=new URL(href,'https://example.com'+location.pathname+location.search);location.search=u.search;location.pathname=u.pathname;location.hash=u.hash;};
  const ctx={URLSearchParams,Intl,console:{info(){},log(){},warn(){}},setTimeout:()=>0,clearTimeout(){},CustomEvent:class{},location,
    history:{state:null,pushState(_s,_t,href){move(href);},replaceState(_s,_t,href){move(href);}},
    localStorage:{getItem(){return null;},setItem(){}},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
    document:{querySelector:k=>k==='#app'?app:nodes[k]??={innerHTML:'',textContent:''},addEventListener:(k,f)=>handlers[k]=f},
    window:{oaiq(){},dispatchEvent(){},scrollTo(){},addEventListener:(k,f)=>handlers[k]=f}};
  vm.createContext(ctx);for(const f of ['data.js','pixel-user.js','pixel-events.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),ctx);
  return {ctx,app,storage,handlers};
}
const token='ref + / = & ? " < é';
const {ctx,app,storage,handlers}=boot('?oppref='+encodeURIComponent(token));
const check=()=>{
  assert.equal(new URLSearchParams(ctx.location.search).get('oppref'),token);
  for(const link of app.links)if(link.href.startsWith('?'))assert.equal(new URLSearchParams(link.href).get('oppref'),token);
};
check();
for(const href of ['?page=shop','?page=shop&category=Running+gear','?page=shop&q=tee&size=M&sort=low','?page=product&id=form-tee','?page=account&mode=register','?page=account','?page=cart','?page=checkout&mode=buy&id=form-tee&size=M&qty=2','?page=confirmation','?page=home']){ctx.navigate(href);check();}
assert.equal(new URLSearchParams(ctx.withOppref('?page=shop&oppref=other')).get('oppref'),token);
assert.equal(ctx.withOppref('https://other.example/path'),'https://other.example/path');
assert(ctx.withOppref('?page=shop#products').endsWith('#products'));
ctx.location.search='?page=shop';handlers.popstate();check();assert.equal(ctx.location.pathname,'/assignment_NanoMotion/');
const reloaded=boot('?page=shop',storage);assert.equal(new URLSearchParams(reloaded.ctx.location.search).get('oppref'),token);
reloaded.ctx.location.search='?page=home&oppref=new';reloaded.ctx.captureURL();reloaded.ctx.navigate('?page=cart');assert.equal(new URLSearchParams(reloaded.ctx.location.search).get('oppref'),'new');
const absent=boot('?page=home');absent.ctx.navigate('?page=cart');assert(!new URLSearchParams(absent.ctx.location.search).has('oppref'));
const empty=boot('?oppref=');empty.ctx.navigate('?page=shop');assert.equal(new URLSearchParams(empty.ctx.location.search).get('oppref'),'');
const blocked=boot('?oppref=keep');blocked.ctx.sessionStorage.setItem=()=>{throw new Error('blocked')};blocked.ctx.navigate('?page=cart');assert.equal(new URLSearchParams(blocked.ctx.location.search).get('oppref'),'keep');
console.log('PASS: all internal routes and rendered links, encoded values, history, session restore, new explicit value, empty/absent values, hash preservation, external links, blocked storage');
