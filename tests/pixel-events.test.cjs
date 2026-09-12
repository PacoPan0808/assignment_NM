const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const calls = [], handlers = {}, elements = {};
const context = {
  URLSearchParams, Intl, console, setTimeout, clearTimeout,
  location: { search: '' },
  history: { pushState(_state, _title, url) { context.location.search = url; } },
  document: { querySelector: key => elements[key] ??= { innerHTML: '' }, addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  sessionStorage: { setItem() {} }, CustomEvent: class {},
  window: { oaiq: (...args) => calls.push(args), scrollTo() {}, dispatchEvent() {}, addEventListener: (name, fn) => handlers[name] = fn }
};
(async () => {
vm.createContext(context);
for (const file of ['data.js', 'pixel-user.js', 'pixel-events.js', 'app.js']) vm.runInContext(fs.readFileSync(`dist/${file}`, 'utf8'), context);
await Promise.resolve();
const plain = value => JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(calls[0]), ['measure','page_viewed',{type:'contents',contents:[{id:'home',name:'Nano Motion home page',content_type:'page'}]}]);
await vm.runInContext('render(false);render(false);',context); assert.equal(calls.length,1);
context.navigate('?page=shop');await Promise.resolve();assert.equal(calls.at(-1)[2].contents[0].id,'product-list');
context.navigate('?page=shop&category=Running+gear');await Promise.resolve();assert.equal(calls.at(-1)[2].contents[0].id,'category-running-gear');
context.navigate('?page=shop&q=private-search');await Promise.resolve();assert.equal(calls.at(-1)[2].contents[0].id,'search-results');
assert(!JSON.stringify(calls).includes('private-search'));
context.navigate('?page=shop&q=private-search&size=M');await Promise.resolve();assert.equal(calls.length,5);
for (const page of ['product','cart','checkout','account','confirmation','unknown']) context.navigate(`?page=${page}`);
assert.equal(calls.length,5);
context.location.search='?page=home';handlers.popstate();await Promise.resolve();assert.equal(calls.length,6);
context.navigate('?page=shop');context.navigate('?page=home');await Promise.resolve();await Promise.resolve();assert.equal(calls.length,8);
context.navigate('?page=product&id=stride-runner');await Promise.resolve();
assert.deepEqual(plain(calls.at(-1)), ['measure','contents_viewed',{type:'contents',contents:[{id:'stride-runner',name:'Stride Runner',content_type:'product'}]}]);
assert.equal(calls.length,9);
await context.render();await context.render(false);assert.equal(calls.length,9);
context.navigate('?page=product&id=missing');await Promise.resolve();assert.equal(calls.length,9);
context.navigate('?page=product&id=form-tee');await Promise.resolve();assert.equal(calls.at(-1)[2].contents[0].name,'Form Training Tee');
context.location.search='?page=product&id=stride-runner';handlers.popstate();await Promise.resolve();assert.equal(calls.length,11);
context.window.oaiq=undefined;context.navigate('?page=shop');await Promise.resolve();assert.equal(calls.length,11);
context.window.oaiq=()=>{throw new Error('SDK failure');};await Promise.resolve();assert.doesNotThrow(()=>context.navigate('?page=home'));
console.log('PASS: initial landing, exact payload, category/search, filtering, back/forward handler, revisit, no rerender duplicates, excluded views, missing/failing SDK');

})().catch(error=>{console.error(error);process.exitCode=1;});
