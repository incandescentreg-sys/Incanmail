// One-time webhook setup endpoint.
// Protects the bot from takeover: only works when a secret SETUP_KEY is provided.
// Usage: https://<your-app>.vercel.app/api/setup?key=<SETUP_KEY>

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const SETUP_KEY = process.env.SETUP_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!BOT_TOKEN) return res.status(500).json({ error: 'BOT_TOKEN env var not set' });
  if (!SETUP_KEY) return res.status(500).json({ error: 'SETUP_KEY env var not set' });

  if (req.query.key !== SETUP_KEY) return res.status(403).json({ error: 'forbidden' });

  const webhookUrl = `https://${req.headers.host}/api/bot`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] }),
    });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}