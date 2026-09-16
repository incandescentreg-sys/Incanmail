const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

const inMem = new Map();

async function rawCmd(...args) {
  if (url && token) {
    const r = await fetch(`${url}/${args.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json().catch(() => null);
    if (data && data.error) throw new Error(data.error);
    return data ? data.result : null;
  }
  // in-memory fallback for local dev
  const [cmd, k, ...rest] = args;
  switch (cmd) {
    case 'GET': return inMem.get(k) ?? null;
    case 'SET': { inMem.set(k, rest[0]); if (Number(rest[1]) > 0) setTimeout(() => inMem.delete(k), rest[1] * 1000); return 'OK'; }
    case 'DEL': return inMem.delete(k) ? 1 : 0;
    case 'INCR': { const v = (Number(inMem.get(k)) || 0) + 1; inMem.set(k, String(v)); return v; }
    case 'HSET': { const h = inMem.get(k) || {}; for (let i = 0; i < rest.length; i += 2) h[rest[i]] = rest[i + 1]; inMem.set(k, h); return rest.length / 2; }
    case 'HGETALL': { const h = inMem.get(k); return h ? Object.entries(h).map(([f, v]) => [f, v]).flat() : null; }
    case 'SADD': { const s = inMem.get(k) || new Set(); s.add(rest[0]); inMem.set(k, s); return 1; }
    case 'SMEMBERS': { const s = inMem.get(k); return s ? [...s] : []; }
    case 'SREM': { const s = inMem.get(k); if (s) s.delete(rest[0]); return 1; }
    case 'EXPIRE': return 1;
    default: return null;
  }
}

function hgetallToObj(pairs) {
  const obj = {};
  if (Array.isArray(pairs)) {
    for (let i = 0; i < pairs.length; i += 2) obj[pairs[i]] = pairs[i + 1];
  }
  return obj;
}

export async function addUser(tgId) {
  const key = `user:${tgId}`;
  const exists = await rawCmd('GET', key);
  if (!exists) {
    await rawCmd('SET', key, JSON.stringify({ tg_id: tgId, created_at: new Date().toISOString() }));
  }
}

export async function createAddress({ tgId, address, password, token: mailToken, mailtmId, ttlMinutes }) {
  const id = await rawCmd('INCR', 'addr:counter');
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const createdAt = new Date().toISOString();
  await rawCmd(
    'HSET', `addr:${id}`,
    'id', String(id),
    'tg_id', String(tgId),
    'address', address,
    'password', password,
    'token', mailToken,
    'mailtm_id', mailtmId ?? '',
    'expires_at', expiresAt,
    'created_at', createdAt,
  );
  await rawCmd('SADD', `addrs:${tgId}`, String(id));
  await rawCmd('EXPIRE', `addr:${id}`, String(ttlMinutes * 60));
  return { id, tg_id: tgId, address, password, token: mailToken, mailtm_id: mailtmId ?? '', expires_at: expiresAt, created_at: createdAt };
}

export async function getAddress(id) {
  const pairs = await rawCmd('HGETALL', `addr:${id}`);
  const obj = hgetallToObj(pairs);
  return Object.keys(obj).length ? obj : null;
}

export async function getActiveAddresses(tgId) {
  const ids = (await rawCmd('SMEMBERS', `addrs:${tgId}`)) || [];
  const now = new Date().toISOString();
  const results = [];
  for (const sid of ids) {
    const addr = await getAddress(sid);
    if (addr && addr.expires_at > now) results.push(addr);
  }
  results.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return results;
}

export async function deleteAddress(id) {
  const addr = await getAddress(id);
  if (addr) {
    await rawCmd('SREM', `addrs:${addr.tg_id}`, String(id));
    await rawCmd('DEL', `addr:${id}`);
  }
}