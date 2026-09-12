// Only the allowlisted, normalized fields below are sent to the pixel.
const pixelText = value => typeof value === 'string' ? value : '';
const pixelName = value => pixelText(value).toLowerCase().replace(/[\s\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/gu, '');
function pixelPhone(value) {
  const digits = pixelText(value).replace(/[\s().-]/g, '').replace(/^\+/, '').replace(/^0+/, '');
  return /^[0-9]{8,15}$/.test(digits) ? digits : '';
}
const pixelLimit = (value, length) => Array.from(pixelText(value).trim()).slice(0, length).join('');
function pixelCustomerId(user) {
  const username = pixelText(user.username).trim().toLowerCase();
  if (!username) throw new Error('Missing member identifier');
  if (username === 'alexmorgan') return 'nm-demo-customer-001';
  const stored = JSON.parse(localStorage.getItem('nm_customer_ids') || '[]');
  const records = Array.isArray(stored) ? stored : [];
  const existing = records.find(record => record?.username === username);
  if (typeof existing?.id === 'string' && existing.id) return existing.id;
  const id = crypto.randomUUID();
  localStorage.setItem('nm_customer_ids', JSON.stringify([...records, { username, id }]));
  return id;
}
async function pixelSha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function buildPixelUser(user) {
  const identifiers = {
    email_sha256: pixelText(user.email).trim().toLowerCase(),
    phone_number_sha256: pixelPhone(user.phone),
    external_id_sha256: pixelCustomerId(user),
    first_name_sha256: pixelName(user.firstName),
    last_name_sha256: pixelName(user.lastName)
  };
  const result = {};
  await Promise.all(Object.entries(identifiers).map(async ([field, value]) => {
    if (value) result[field] = await pixelSha256(value);
  }));
  // This storefront currently supports US members/shipping only.
  const country = pixelText(user.country).trim().toUpperCase();
  if (country === 'US' || country === 'UNITED STATES') result.country = 'US';
  const city = pixelLimit(user.city, 128);
  const region = pixelLimit(user.state, 128);
  const postal = pixelLimit(user.zip, 32);
  if (city) result.city = city;
  if (region) result.region = region;
  if (postal && /^[A-Za-z0-9 -]+$/.test(postal)) result.postal_code = postal;
  return result;
}

let pixelIdentityKey = null;
let pixelIdentityRevision = 0;
let pixelIdentityPending = Promise.resolve(true);
function syncPixelUser(user) {
  if (typeof window.oaiq !== 'function') return Promise.resolve(false);
  const key = user?.username ? JSON.stringify([
    user.username, user.email, user.phone, user.firstName, user.lastName,
    user.country, user.city, user.state, user.zip
  ]) : null;
  // Every caller must wait for the same in-flight hashing operation.
  if (key === pixelIdentityKey) return pixelIdentityPending;
  const revision = ++pixelIdentityRevision;
  // Empty user replaces the previous SDK identity on logout or account changes.
  if (pixelIdentityKey !== null) window.oaiq('init', { user: {} });
  pixelIdentityKey = key;
  if (key === null) return (pixelIdentityPending = Promise.resolve(true));
  pixelIdentityPending = (async () => { try {
    const payload = await buildPixelUser(user);
    if (revision !== pixelIdentityRevision) return false;
    window.oaiq('init', { user: payload });
    console.log("user created: "+JSON.stringify(payload))
    return true;
  } catch {
    // Never fall back to transmitting unhashed identifiers or interrupt login.
    if (revision === pixelIdentityRevision) pixelIdentityKey = null;
    console.warn('Nano Motion: pixel user identification unavailable.');
    return false;
  } })();
  return pixelIdentityPending;
}
window.NanoMotionIdentity = { sync: syncPixelUser };
