const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const calls=[],handlers={},elements={},storage=new Map();
const ctx={URLSearchParams,Intl,console,CustomEvent:class{},setTimeout:()=>0,clearTimeout(){},
  FormData:class{constructor(form){this.form=form;}*[Symbol.iterator](){yield* Object.entries(this.form.values||{});}},
  location:{search:'?page=product&id=form-tee'},history:{pushState(_a,_b,url){ctx.location.search=url;}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{setItem(){}},
  document:{querySelector:k=>elements[k]??={innerHTML:'',textContent:'',value:'2',classList:{add(){},remove(){}}},addEventListener:(key,fn)=>handlers[key]=fn},
  window:{oaiq:(...args)=>calls.push(args),dispatchEvent(){},scrollTo(){},addEventListener(){}}};
vm.createContext(ctx);
for(const file of ['data.js','pixel-user.js','pixel-events.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),ctx);
const flush=()=>new Promise(setImmediate),run=source=>vm.runInContext(source,ctx);
const click=dataset=>handlers.click({target:{closest:tag=>tag==='button'?{dataset}:null}});
const events=name=>calls.filter(call=>call[1]===name);
const plain=value=>JSON.parse(JSON.stringify(value));
const data={firstName:'Demo',lastName:'Member',phone:'+1 202-555-0147',address:'123 Example Avenue',city:'Portland',email:'demo@example.com',state:'OR',zip:'97205',country:'United States'};
const form=values=>({id:'checkout-form',dataset:{},values});
const submit=f=>handlers.submit({target:f,preventDefault(){}});
(async()=>{
  await flush();
  click({add:'form-tee'});await flush();assert.equal(events('items_added').length,0);
  run("selectedSize='M'");click({add:'form-tee'});await flush();
  assert.deepEqual(plain(events('items_added')[0]),['measure','items_added',{type:'contents',amount:8400,currency:'USD',contents:[{id:'form-tee',name:'Form Training Tee',content_type:'product',quantity:2,amount:4200,currency:'USD'}]}]);
  click({qty:'0',delta:'1'});await flush();assert.equal(events('items_added').at(-1)[2].amount,4200);
  click({qty:'0',delta:'-1'});await flush();assert.equal(events('items_added').length,2);
  run('cart[0].qty=98');click({add:'form-tee'});await flush();assert.equal(events('items_added').at(-1)[2].contents[0].quantity,1);
  click({add:'form-tee'});await flush();assert.equal(events('items_added').length,3);
  run('cart[0].qty=2');ctx.navigate('?page=checkout');await flush();
  assert.deepEqual(plain(events('checkout_started')[0]),['measure','checkout_started',{type:'contents',amount:8400,currency:'USD',contents:[{id:'form-tee',name:'Form Training Tee',content_type:'product',quantity:2}]}]);
  await ctx.render();await flush();assert.equal(events('checkout_started').length,1);
  await submit(form({...data,firstName:' '}));await flush();assert.equal(events('order_created').length,0);
  const cartForm=form(data);await submit(cartForm);await flush();
  assert.equal(events('order_created').length,1);assert.equal(events('order_created')[0][2].amount,8400);
  assert.equal(run('cart.length'),0);await submit(cartForm);ctx.navigate('?page=confirmation');await flush();assert.equal(events('order_created').length,1);
  ctx.navigate('?page=checkout');await flush();assert.equal(events('checkout_started').length,1);
  run("cart=[{id:'stride-runner',size:'9',qty:1}]");ctx.navigate('?page=product&id=form-tee');run("selectedSize='M'");elements['#product-qty'].value='1';click({buy:'form-tee'});await flush();
  assert.equal(events('checkout_started').length,2);assert.equal(events('checkout_started').at(-1)[2].amount,4900);
  assert.equal(events('checkout_started').at(-1)[2].contents[0].quantity,1);
  const directForm=form(data);await submit(directForm);await flush();assert.equal(events('order_created').at(-1)[2].amount,4900);assert.equal(run('cart[0].id'),'stride-runner');
  await submit(directForm);await flush();assert.equal(events('order_created').length,2);
  ctx.navigate('?page=checkout&mode=buy&id=missing&size=M&qty=1');await flush();assert.equal(events('checkout_started').length,2);
  const items=[{id:'form-tee',qty:1}],pending=ctx.trackPixelCommerceEvent('items_added',items);items[0].qty=9;await pending;assert.equal(events('items_added').at(-1)[2].contents[0].quantity,1);
  assert.equal(ctx.pixelCommercePayload('items_added',[{id:'form-tee',qty:0}]),null);
  const multi=ctx.pixelCommercePayload('checkout_started',[{id:'form-tee',qty:2},{id:'stride-runner',qty:1}],212);assert.equal(multi.amount,21200);assert.equal(multi.contents.length,2);
  console.log('PASS: exact commerce schemas, cents, quantity deltas/caps, cart and direct checkout, shipping, invalid/empty actions, duplicate submission/confirmation, snapshot integrity, multi-item payloads');
})().catch(e=>{console.error(e);process.exitCode=1;});
