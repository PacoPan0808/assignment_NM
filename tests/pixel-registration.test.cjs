const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const storage=new Map(),calls=[],handlers={},elements={};
const ctx={URLSearchParams,Intl,TextEncoder,crypto:webcrypto,console:{log(){},info(){},warn(){}},CustomEvent:class{},setTimeout:()=>0,clearTimeout(){},
  FormData:class{constructor(form){this.form=form;}*[Symbol.iterator](){yield* Object.entries(this.form.values);}},
  location:{search:'?page=account&mode=register'},history:{pushState(_a,_b,url){ctx.location.search=url;}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{setItem(){}},
  document:{querySelector:k=>elements[k]??={innerHTML:'',textContent:'',classList:{add(){},remove(){}}},addEventListener:(key,fn)=>handlers[key]=fn},
  window:{oaiq:(...args)=>calls.push(args),dispatchEvent(){},scrollTo(){},addEventListener(){}}};
vm.createContext(ctx);for(const file of ['data.js','pixel-user.js','pixel-events.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
const events=()=>calls.filter(c=>c[1]==='registration_completed');
const settle=async()=>{await run('pixelIdentityPending');await Promise.resolve();};
const values={firstName:'Test',lastName:'Member',username:'test_registration',email:'test.registration@example.com',phone:' +1 (202) 555-0147 ',password:'DemoOnly2026!'};
function form(data){const button={disabled:false};return {id:'auth-form',values:data,querySelector:()=>button};}
const submit=f=>handlers.submit({target:f,preventDefault(){}});
(async()=>{
  const initialHtml=elements['#app'].innerHTML;
  for(const name of ['firstName','lastName','username','email','phone','password']) assert.match(initialHtml,new RegExp('<input[^>]*name="'+name+'"[^>]*\\brequired\\b'));
  for(const name of ['address','city','state','zip','country']) {
    const tag=initialHtml.match(new RegExp('<(?:input|select)[^>]*name="'+name+'"[^>]*>'))[0];
    assert(!/\brequired\b/.test(tag));
  }
  for(const phone of ['', '123', 'invalid']) {
    await submit(form({...values,phone}));await settle();
    assert.equal(events().length,0);assert.equal(storage.has('nm_accounts'),false);
  }
  const f=form(values);const first=submit(f);await submit(f);await first;await settle();
  assert.equal(JSON.parse(storage.get('nm_accounts')).length,1);
  assert.equal(JSON.parse(storage.get('nm_accounts'))[0].phone,'+1 (202) 555-0147');
  assert.deepEqual(JSON.parse(JSON.stringify(events())),[['measure','registration_completed',{type:'customer_action'}]]);
  assert.equal(calls[0][0],'init');assert.match(calls[0][1].user.email_sha256,/^[a-f0-9]{64}$/);
  assert.equal(calls[0][1].user.phone_number_sha256,require('node:crypto').createHash('sha256').update('12025550147').digest('hex'));
  await submit(f);await ctx.render();await settle();assert.equal(events().length,1);
  run('currentUser=null');ctx.navigate('?page=account');
  await submit(form({identity:values.username,password:values.password}));await settle();assert.equal(events().length,1);
  run('currentUser=null');ctx.navigate('?page=account&mode=register');await submit(form(values));await settle();assert.equal(events().length,1);
  assert.match(elements['#auth-error'].textContent,/already registered/);
  const set=ctx.localStorage.setItem;ctx.localStorage.setItem=(k,v)=>{if(k==='nm_accounts')throw new Error('blocked');set(k,v);};
  await submit(form({...values,username:'failed_registration',email:'failed@example.com'}));await settle();
  assert.equal(events().length,1);assert.equal(run('currentUser'),null);assert.match(elements['#auth-error'].textContent,/could not save/);
  ctx.localStorage.setItem=set;ctx.navigate('?page=account');
  handlers.click({target:{closest:tag=>tag==='button'?{id:'demo-login',dataset:{}}:null}});await settle();assert.equal(events().length,1);
  run('currentUser=null');ctx.navigate('?page=account&mode=register');
  const withAddress={...values,username:'address_member',email:'address@example.com',address:' 123 Example Avenue ',city:' Portland ',state:'OR',zip:'97205-1234',country:'United States'};
  await submit(form({...withAddress,zip:'invalid'}));await settle();assert.equal(events().length,1);
  await submit(form(withAddress));await settle();assert.equal(events().length,2);
  const saved=JSON.parse(storage.get('nm_accounts')).find(a=>a.username==='address_member');
  assert.equal(saved.address,'123 Example Avenue');assert.equal(saved.city,'Portland');assert.equal(saved.zip,'97205-1234');
  run('currentUser=null');ctx.navigate('?page=account');
  await submit(form({identity:'address_member',password:values.password}));await settle();
  assert.equal(run('currentUser.address'),'123 Example Avenue');
  assert.equal(run('currentUser.phone'),'+1 (202) 555-0147');
  assert.match(elements['#app'].innerHTML,/123 Example Avenue/);
  run("cart=[{id:'form-tee',size:'M',qty:1}]");ctx.navigate('?page=checkout');
  assert.match(elements['#app'].innerHTML,/name="address"[^>]*value="123 Example Avenue"[^>]*required/);
  assert.match(elements['#app'].innerHTML,/name="zip"[^>]*value="97205-1234"/);
  assert.match(elements['#app'].innerHTML,/name="phone"[^>]*value="\+1 \(202\) 555-0147"/);
  console.log('PASS: required account fields, optional empty/complete addresses, ZIP validation, trimmed persistence, login restoration and checkout prefill');
  console.log('PASS: exact registration event, identity ordering, successful persistence, double-submit guard, no login/demo/refresh/duplicate/failure events');
})().catch(e=>{console.error(e);process.exitCode=1;});
