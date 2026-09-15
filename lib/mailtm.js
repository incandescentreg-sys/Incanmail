const BASE = 'https://api.mail.tm';

async function sendJson(res) {
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(data?.detail || data?.message || text || res.statusText);
  return data;
}

export async function listDomains() {
  const r = await fetch(`${BASE}/domains`);
  const data = await sendJson(r);
  return (data['hydra:member'] || []).map(d => d.domain);
}

export async function createAccount(address, password) {
  const r = await fetch(`${BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  return sendJson(r);
}

export async function getToken(address, password) {
  const r = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  return sendJson(r);
}

export async function getMessages(token, page = 1) {
  const r = await fetch(`${BASE}/messages?page=${page}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
  });
  const data = await sendJson(r);
  return (data['hydra:member'] || []).map(m => ({
    id: m['@id'],
    subject: m.subject || '(no subject)',
    from: m.from?.address || '?',
    createdAt: m.createdAt,
  }));
}

export async function getMessage(token, id) {
  const r = await fetch(`${BASE}/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
  });
  return sendJson(r);
}

export async function deleteMessage(token, id) {
  const r = await fetch(`${BASE}/messages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  return r.ok;
}