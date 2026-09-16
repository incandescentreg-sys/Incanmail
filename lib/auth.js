import { createHmac } from 'node:crypto';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

export function verifyTelegramInitData(raw) {
  if (!raw || !BOT_TOKEN) return null;

  // Keep values URL-encoded exactly as received — decoding here breaks the HMAC
  const pairs = raw.split('&').map(p => {
    const idx = p.indexOf('=');
    return [p.slice(0, idx), p.slice(idx + 1)];
  });

  const hashEntry = pairs.find(([k]) => k === 'hash');
  if (!hashEntry) return null;

  const checkString = pairs
    .filter(([k]) => k !== 'hash')
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = createHmac('sha256', secret).update(checkString).digest('hex');

  if (calc !== hashEntry[1]) return null;

  const userEntry = pairs.find(([k]) => k === 'user');
  if (!userEntry) return null;
  try { return JSON.parse(decodeURIComponent(userEntry[1])); } catch { return null; }
}

export function getUser(req) {
  const raw = req.headers['x-telegram-init-data'];
  if (!raw) return null;
  return verifyTelegramInitData(raw);
}