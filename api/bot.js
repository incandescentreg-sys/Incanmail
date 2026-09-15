// Telegram bot webhook handler — deployed as serverless function via Vercel
// Set BOT_TOKEN env var in Vercel dashboard

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN || ''}`;
const APP_URL = process.env.APP_URL || 'https://your-domain.vercel.app';

async function sendMessage(chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const r = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(200).end('ok'); return; }

  const update = req.body;
  const msg = update?.message;
  if (!msg) { res.status(200).end('ok'); return; }

  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (text === '/start') {
    await sendMessage(chatId, 'Привет! Нажми кнопку, чтобы получить временный email.\n\nОн живёт 60 минут и самоуничтожается.', {
      inline_keyboard: [[{ text: 'Открыть Incanmail', web_app: { url: APP_URL } }]],
    });
  } else {
    await sendMessage(chatId, 'Нажми /start, чтобы открыть Incanmail.');
  }

  res.status(200).end('ok');
}