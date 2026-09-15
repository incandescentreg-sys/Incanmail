# Incanmail — одноразовые email-адреса в Telegram Mini App

Временная почта для регистраций на подозрительных сайтах. Живёт 60 минут, самоуничтожается.

**Стек:** Vercel (serverless functions) · Node.js · Upstash Redis (KV) · Mail.tm API · Telegram Mini App

## Структура

```
api/
  bot.js            # Telegram webhook (обработка /start)
  domains.js        # GET /api/domains — список доменов Mail.tm
  address.js        # POST /api/address — создать адрес
  addresses.js      # GET /api/addresses — список адресов
  messages.js       # GET /api/messages?id=N — входящие
  message.js        # GET /api/message?addr=N&msgId=... — письмо
  address-delete.js # DELETE /api/address?id=N — удалить
lib/
  auth.js           # проверка initData (Telegram WebApp)
  db.js             # слой хранения на Upstash Redis
  mailtm.js         # клиент API Mail.tm
public/
  index.html        # Mini App (фронтенд)
scripts/
  set-webhook.mjs   # настройка вебхука бота
```

## Деплой на Vercel

1. **Создай бота** Incanmail в [@BotFather](https://t.me/BotFather) — получи токен.

2. **Подключи Redis**:
   - Vercel Dashboard → ваш проект → **Storage** → **Create Database** → **Upstash Redis**
   - Либо создай базу на [upstash.com](https://upstash.com) и добавь переменные вручную.

3. **Переменные окружения** (Vercel → Project → Settings → Environment Variables):

   | Переменная | Значение |
   |---|---|
   | `BOT_TOKEN` | токен от BotFather |
   | `APP_URL` | URL деплоя, напр. `https://incanmail.vercel.app` |
   | `UPSTASH_REDIS_REST_URL` | из дашборда Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | из дашборда Upstash |
   | `ADDRESS_TTL_MINUTES` | (опц.) время жизни адреса, по умолч. 60 |

4. **Деплой:**
   ```bash
   npm i
   vercel
   ```

5. **Настрой вебхук** (после деплоя):
   ```bash
   BOT_TOKEN=... WEBHOOK_URL=https://твой-проект.vercel.app/api/bot npm run webhook
   ```

6. **В BotFather:** `/mybots` → твой бот → **Bot Settings** → **Menu Button** → укажи URL `https://твой-проект.vercel.app`. Или просто отправь боту `/start` и нажми кнопку.

## Локальная разработка

Без Redis код падает обратно на in-memory хранилище (данные не переживают перезапуск).

```bash
BOT_TOKEN=... npm run webhook   # настройка вебхука (разово)
vercel dev                      # локальный сервер Vercel
```

Для проверки фронтенда вне Telegram можно открыть `public/index.html` — API будет требовать валидный initData.