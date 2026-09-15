import { getUser } from '../lib/auth.js';
import { addUser, createAddress } from '../lib/db.js';
import { createAccount, getToken } from '../lib/mailtm.js';

const TTL = Number(process.env.ADDRESS_TTL_MINUTES || 60);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  let body = {};
  try { body = req.body ?? {}; } catch { /* ignore */ }
  const domain = body.domain;
  if (!domain) { res.status(400).json({ error: 'domain required' }); return; }

  try {
    const local = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const address = `${local}@${domain}`;
    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    await addUser(user.id);
    await createAccount(address, password);
    const tokenData = await getToken(address, password);
    const token = tokenData.token || tokenData.id;

    const record = await createAddress({
      tgId: user.id,
      address,
      password,
      token,
      mailtmId: tokenData.id || null,
      ttlMinutes: TTL,
    });

    res.status(201).json({ id: record.id, address, expiresAt: record.expires_at });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}