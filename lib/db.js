// KV-backed storage for Incanmail
// Uses @upstash/redis — reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from env
// Also falls back to KV_REST_API_URL / KV_REST_API_TOKEN for Vercel backwards compat

import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

let kv;
if (url && token) {
  kv = new Redis({ url, token });
} else {
  // Local dev fallback — minimal in-memory store
  const map = new Map();
  kv = {
    get: k => Promise.resolve(map.get(k) ?? null),
    set: (k, v, opts) => { map.set(k, v); if (opts?.ex) setTimeout(() => map.delete(k), opts.ex * 1000); return Promise.resolve('OK'); },
    del: k => Promise.resolve(map.delete(k) ? 1 : 0),
    hset: (k, v) => { const h = map.get(k) ?? {}; Object.assign(h, v); map.set(k, h); return Promise.resolve(1); },
    hget: (k, f) => { const h = map.get(k); return Promise.resolve(h?.[f] ?? null); },
    hgetall: k => Promise.resolve(map.get(k) ?? null),
    sadd: (k, m) => { const s = map.get(k) ?? new Set(); s.add(m); map.set(k, s); return Promise.resolve(1); },
    smembers: k => { const s = map.get(k); return Promise.resolve(s ? [...s] : []); },
    srem: (k, m) => { const s = map.get(k); if (s) { s.delete(m); } return Promise.resolve(1); },
    incr: k => { const v = (map.get(k) ?? 0) + 1; map.set(k, v); return Promise.resolve(v); },
    expire: () => Promise.resolve(1),
  };
}

let counter = 0;

export async function addUser(tgId) {
  const key = `user:${tgId}`;
  const exists = await kv.get(key);
  if (!exists) {
    await kv.set(key, JSON.stringify({ tg_id: tgId, created_at: new Date().toISOString() }));
  }
}

export async function createAddress({ tgId, address, password, token: mailToken, mailtmId, ttlMinutes }) {
  counter = await kv.incr('addr:counter');
  const id = counter;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const createdAt = new Date().toISOString();
  const record = { id, tg_id: tgId, address, password, token: mailToken, mailtm_id: mailtmId ?? '', expires_at: expiresAt, created_at: createdAt };
  await kv.hset(`addr:${id}`, record);
  await kv.sadd(`addrs:${tgId}`, String(id));
  await kv.expire(`addr:${id}`, ttlMinutes * 60);
  return record;
}

export async function getAddress(id) {
  return kv.hgetall(`addr:${id}`);
}

export async function getActiveAddresses(tgId) {
  const ids = await kv.smembers(`addrs:${tgId}`);
  const now = new Date().toISOString();
  const results = [];
  for (const sid of ids) {
    const addr = await kv.hgetall(`addr:${sid}`);
    if (addr && addr.expires_at > now) results.push(addr);
  }
  return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function deleteAddress(id) {
  const addr = await kv.hgetall(`addr:${id}`);
  if (addr) {
    await kv.srem(`addrs:${addr.tg_id}`, String(id));
    await kv.del(`addr:${id}`);
  }
}