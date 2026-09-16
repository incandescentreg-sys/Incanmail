const BASE = 'https://api.mail.tm';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

async function request(path, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(BASE + path, {
      ...opts,
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'application/ld+json',
        ...(opts.headers || {}),
      },
    });
    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) {
      throw new Error(data?.detail || data?.message || text || `${r.status} ${r.statusText}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export function listDomains() {
  return request('/domains').then(data => (data['hydra:member'] || []).map(d => d.domain));
}

export function createAccount(address, password) {
  return request('/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
}

export function getToken(address, password) {
  return request('/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
}

export function getMessages(token, page = 1) {
  return request(`/messages?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(data => (data['hydra:member'] || []).map(m => ({
    id: m['@id'],
    subject: m.subject || '(no subject)',
    from: m.from?.address || '?',
    createdAt: m.createdAt,
  })));
}

export function getMessage(token, id) {
  return request(`/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function deleteMessage(token, id) {
  return request(`/messages/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => true);
}
