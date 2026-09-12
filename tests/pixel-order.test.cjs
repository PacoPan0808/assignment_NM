const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
async function scenario(restored) {
  const calls=[],handlers={},elements={},storage=new Map();
  const member={username:'alexmorgan',email:'alex.morgan@example.com',firstName:'Alex',lastName:'Morgan',country:'United States'};
  if(restored)storage.set('nm_session',JSON.stringify(member));
  const ctx={URLSearchParams,Intl,TextEncoder,crypto:webcrypto,console,CustomEvent:class{},
    setTimeout:()=>0,clearTimeout(){},location:{search:''},history:{pushState(_a,_b,url){ctx.location.search=url;}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{setItem(){}},
    document:{querySelector:k=>elements[k]??={innerHTML:'',textContent:'',classList:{add(){},remove(){}}},addEventListener:(k,fn)=>{handlers[k]=fn;}},
    window:{oaiq:(...args)=>calls.push(args),dispatchEvent(){},addEventListener(){},scrollTo(){}}};
  vm.createContext(ctx);
  for(const file of ['data.js','pixel-user.js','pixel-events.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),ctx);
  await vm.runInContext('pixelIdentityPending',ctx);await Promise.resolve();
  if(restored){assert.equal(calls[0][0],'init');assert.match(calls[0][1].user.email_sha256,/^[a-f0-9]{64}$/);assert.equal(calls[1][0],'measure');}
  else {assert.equal(calls[0][0],'measure');assert.equal(calls.length,1);
    handlers.click({target:{closest:tag=>tag==='button'?{id:'demo-login',dataset:{}}:null}});
    await vm.runInContext('pixelIdentityPending',ctx);await Promise.resolve();
    assert.equal(calls[1][0],'init');assert.equal(calls[2][0],'measure');
  }
  const promises=vm.runInContext('[syncPixelUser(currentUser),syncPixelUser(currentUser)]',ctx);
  assert.equal(promises[0],promises[1]);
  return ctx;
}
(async()=>{await scenario(true);await scenario(false);console.log('PASS: restored landing init before measure, guest landing, explicit demo login, shared identity promise');})().catch(e=>{console.error(e);process.exitCode=1;});
