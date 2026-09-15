import { createHmac } from 'node:crypto';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

export function verifyTelegramInitData(raw) {
  if (!raw || !BOT_TOKEN) return null;
  const pairs = raw.split('&').reduce((acc, p) => {
    const idx = p.indexOf('=');
    if (idx === -1) return acc;
    acc[p.slice(0, idx)] = p.slice(idx + 1);
    return acc;
  }, {});
  const hash = pairs.hash;
  delete pairs.hash;

  const sorted = Object.keys(pairs).sort().map(k => `${k}=${pairs[k]}`).join('\n');
  const secret = createHmac('sha256', BOT_TOKEN).update('WebAppData').digest();
  const calc = createHmac('sha256', secret).update(sorted).digest('hex');

  if (calc !== hash) return null;
  try { return JSON.parse(decodeURIComponent(pairs.user)); } catch { return null; }
}

export function getUser(req) {
  const raw = req.headers['x-telegram-init-data'];
  if (!raw) return null;
  return verifyTelegramInitData(raw);
}