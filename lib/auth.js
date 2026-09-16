import { createHmac } from 'node:crypto';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

export function verifyTelegramInitData(raw) {
  if (!raw || !BOT_TOKEN) return null;

  const params = new URLSearchParams(raw);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const checkString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = createHmac('sha256', secret).update(checkString).digest('hex');

  if (calc !== hash) return null;
  try { return JSON.parse(params.get('user')); } catch { return null; }
}

export function getUser(req) {
  const raw = req.headers['x-telegram-init-data'];
  if (!raw) return null;
  return verifyTelegramInitData(raw);
}
