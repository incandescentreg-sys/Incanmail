import { listDomains } from '../lib/mailtm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }
  try {
    const domains = await listDomains();
    res.status(200).json(domains);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}