// backend/src/tiktok.js
import fetch from 'node-fetch';

const BASE = 'https://open.tiktokapis.com/v2';
const AUTHZ = 'https://www.tiktok.com/v2/auth/authorize';

export function buildAuthUrl({ clientKey, redirectUri, state }) {
  const scopes = ['user.info.basic']; // nur basic!
  const p = new URLSearchParams({
    client_key: clientKey,
    scope: scopes.join(','),
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTHZ}?${p.toString()}`;
}

export async function exchangeCodeForToken({ clientKey, clientSecret, code, redirectUri }) {
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${BASE}/oauth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json',
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed ${res.status}: ${text}`);
  }
  const json = JSON.parse(text);
  if (!json.access_token) {
    throw new Error(`Token exchange returned no access_token: ${text}`);
  }
  return json;
}

export async function getUserInfo(accessToken) {
  const res = await fetch(`${BASE}/user/info/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`user/info failed ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}
