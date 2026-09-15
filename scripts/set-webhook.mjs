import { readFileSync } from 'node:fs';

const envPath = new URL('../.env', import.meta.url);
let env = {};
try {
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env */ }

const BOT_TOKEN = process.env.BOT_TOKEN || env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || env.WEBHOOK_URL;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error('Need BOT_TOKEN and WEBHOOK_URL (env or .env)');
  process.exit(1);
}

const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: WEBHOOK_URL, allowed_updates: ['message'] }),
});
const data = await r.json();
console.log(JSON.stringify(data, null, 2));