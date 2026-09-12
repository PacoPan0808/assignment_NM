const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const storage=new Map(),calls=[];
function boot(){
  const elements={};
  const ctx={URLSearchParams,Intl,TextEncoder,crypto:webcrypto,console:{log(){},info(){},warn(){}},CustomEvent:class{},setTimeout:()=>0,clearTimeout(){},
    location:{search:'?page=account'},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{setItem(){}},
    document:{querySelector:k=>elements[k]??={innerHTML:'',classList:{add(){},remove(){}}},addEventListener(){}},
    window:{oaiq:(...args)=>calls.push(args),dispatchEvent(){},addEventListener(){}}};
  vm.createContext(ctx);for(const file of ['data.js','pixel-user.js','pixel-events.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),ctx);
  return ctx;
}
let ctx=boot();const run=s=>vm.runInContext(s,ctx);
const settle=async()=>{await run('pixelIdentityPending');await Promise.resolve();};
const events=()=>calls.filter(c=>c[1]==='subscription_created');
(async()=>{
  assert.throws(()=>run("subscribeMember('monthly')"),/log in/);
  run('currentUser={...DEMO_USER}');assert.throws(()=>run("subscribeMember('invalid')"),/choose/);
  run("subscribeMember('monthly')");assert.equal(JSON.parse(storage.get('nm_memberships'))[0].plan,'monthly');
  await settle();assert.deepEqual(JSON.parse(JSON.stringify(events()[0])),['measure','subscription_created',{type:'plan_enrollment',plan_id:'premium_monthly',amount:1500,currency:'USD'}]);
  assert.equal(calls[0][0],'init');
  run("subscribeMember('monthly');subscribeMember('yearly')");await settle();assert.equal(events().length,1);
  await ctx.render();ctx=boot();await settle();assert.equal(events().length,1);
  run("currentUser={username:'annual_member',firstName:'Annual',country:'United States'};subscribeMember('yearly')");await settle();
  assert.deepEqual(JSON.parse(JSON.stringify(events()[1])),['measure','subscription_created',{type:'plan_enrollment',plan_id:'premium_yearly',amount:12000,currency:'USD'}]);
  run("currentUser={username:'failed_member'}");const original=ctx.localStorage.setItem;
  ctx.localStorage.setItem=(k,v)=>{if(k==='nm_memberships')throw new Error('blocked');original(k,v);};
  assert.throws(()=>run("subscribeMember('monthly')"),/could not save/);await settle();assert.equal(events().length,2);
  ctx.localStorage.setItem=original;
  // Failed SDK delivery must not undo a successfully saved membership.
  ctx.window.oaiq=()=>{throw new Error('SDK unavailable');};
  assert.doesNotThrow(()=>run("subscribeMember('monthly')"));await settle();assert.equal(run('membershipFor(currentUser).tier'),'premium');
  console.log('PASS: exact monthly/yearly subscription payloads, saved-before-event, identity ordering, repeat-click and refresh suppression, invalid/guest/save-failure guards, SDK failure isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
