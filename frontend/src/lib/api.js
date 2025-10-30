const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export async function apiGet(path, opts = {}) {
  const r = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function apiPost(path, body, opts = {}) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export const API = { API_URL };
