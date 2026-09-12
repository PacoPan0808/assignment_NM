const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto, createHash } = require('node:crypto');
const sha = value => createHash('sha256').update(value).digest('hex');
const storage = new Map();
const calls = [];
const context = {
  crypto: webcrypto, TextEncoder, console: { warn() {}, info() {}, log() {} },
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
  window: { oaiq: (...args) => calls.push(args) }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('dist/pixel-user.js', 'utf8'), context);
const evaluate = source => vm.runInContext(source, context);
const member = { username: 'test_member', email: '  Test@Example.COM ', phone: '+00 (1) 202-555.0147', firstName: ' A-n.n_e! ', lastName: ' D’Ángelo_ 张 ', country: 'United States', city: ' Portland ', state: 'OR', zip: '97205-1234', password: 'never-send', address: 'never-send' };
(async () => {
  const payload = await context.buildPixelUser(member);
  assert.equal(payload.email_sha256, sha('test@example.com'));
  assert.equal(payload.phone_number_sha256, sha('12025550147'));
  assert.equal(payload.first_name_sha256, sha('anne'));
  assert.equal(payload.last_name_sha256, sha('d’ángelo张'));
  assert.equal(payload.country, 'US');
  assert.equal(payload.city, 'Portland');
  assert.equal(payload.region, 'OR');
  assert.equal(payload.postal_code, '97205-1234');
  for (const [key,value] of Object.entries(payload)) if (key.endsWith('_sha256')) assert.match(value, /^[a-f0-9]{64}$/);
  assert.equal(payload.external_id_sha256, sha(JSON.parse(storage.get('nm_customer_ids'))[0].id));
  assert.equal((await context.buildPixelUser(member)).external_id_sha256, payload.external_id_sha256);
  assert.notEqual((await context.buildPixelUser({...member,username:'another_member'})).external_id_sha256,payload.external_id_sha256);
  for (const field of ['email','phone','firstName','lastName','address','password','username']) assert.equal(payload[field],undefined);
  for (const invalid of ['1234567','1234567890123456','1-800-FLOWERS','++12025550147','123/456789']) assert.equal(context.pixelPhone(invalid),'');
  assert.equal(context.pixelPhone('00012345678'),'12345678');
  assert.equal(context.pixelPhone('123456789012345'),'123456789012345');
  const minimal = await context.buildPixelUser({username:'minimal',phone:'invalid',city:'x'.repeat(140),state:'y'.repeat(140),zip:'invalid!'});
  assert.equal(minimal.email_sha256,undefined); assert.equal(minimal.phone_number_sha256,undefined);
  assert.equal(minimal.first_name_sha256,undefined); assert.equal(minimal.postal_code,undefined);
  assert.equal(minimal.city.length,128); assert.equal(minimal.region.length,128);
  await context.syncPixelUser(null); assert.equal(calls.length,0);
  await context.syncPixelUser(member); assert.equal(calls.length,1);
  assert.equal(calls[0][0],'init'); assert.equal(calls[0][1].user.email_sha256,payload.email_sha256);
  await context.syncPixelUser({...member}); assert.equal(calls.length,1);
  await context.syncPixelUser(null); assert.equal(Object.keys(calls.at(-1)[1].user).length,0);
  const pending = context.syncPixelUser(member);
  await context.syncPixelUser(null); const countAfterLogout = calls.length;
  await pending; assert.equal(calls.length,countAfterLogout);
  const pendingA = context.syncPixelUser(member);
  await context.syncPixelUser({...member,username:'another_member',email:'another@example.com'});
  await pendingA; assert.equal(calls.at(-1)[1].user.email_sha256,sha('another@example.com'));
  await context.syncPixelUser(null);
  const oldCrypto = context.crypto;
  context.crypto = {subtle:{digest:async()=>{throw new Error('unavailable')}}};
  const beforeFailure = calls.length;
  await context.syncPixelUser(member); assert.equal(calls.length,beforeFailure);
  context.crypto = oldCrypto;
  // A fresh document can identify a restored session with the same ID.
  const restored = {...context,window:{oaiq:(...args)=>calls.push(args)}};
  vm.createContext(restored);vm.runInContext(fs.readFileSync('dist/pixel-user.js','utf8'),restored);
  await restored.syncPixelUser(member);assert.equal(calls.at(-1)[1].user.external_id_sha256,payload.external_id_sha256);
  assert.match(fs.readFileSync('dist/app.js','utf8'),/function render\([^)]*\)\{const identityReady=syncPixelUser\(currentUser\)/);
  console.log('PASS: normalization, SHA-256, field allowlist, bounds, stable IDs, restored sessions, deduplication, logout, account-switch races, hash failure');
})().catch(error=>{console.error(error);process.exitCode=1;});
