import { getUser } from '../lib/auth.js';
import { getAddress } from '../lib/db.js';
import { getMessage } from '../lib/mailtm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const addrId = req.query.addr;
  const msgId = req.query.msgId;
  if (!addrId || !msgId) { res.status(400).json({ error: 'addr and msgId required' }); return; }

  const addr = await getAddress(addrId);
  if (!addr || String(addr.tg_id) !== String(user.id)) { res.status(404).json({ error: 'not found' }); return; }

  try {
    const rawId = String(msgId).replace(/^\/messages\//, '');
    const msg = await getMessage(addr.token, rawId);
    res.status(200).json(msg);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}