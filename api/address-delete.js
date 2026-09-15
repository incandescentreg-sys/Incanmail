import { getUser } from '../lib/auth.js';
import { getAddress, deleteAddress } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'DELETE') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const id = req.query.id;
  if (!id) { res.status(400).json({ error: 'id required' }); return; }

  const addr = await getAddress(id);
  if (!addr || String(addr.tg_id) !== String(user.id)) { res.status(404).json({ error: 'not found' }); return; }

  await deleteAddress(id);
  res.status(200).json({ ok: true });
}