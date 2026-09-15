import { getUser } from '../lib/auth.js';
import { addUser, getActiveAddresses } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const user = getUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  await addUser(user.id);
  const list = await getActiveAddresses(user.id);
  res.status(200).json(list.map(a => ({ id: a.id, address: a.address, expiresAt: a.expires_at })));
}