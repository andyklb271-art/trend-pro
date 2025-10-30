import crypto from 'crypto';
import fetch from 'node-fetch';

const {
  TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET,
  REDIRECT_URI
} = process.env;

// Passe SCOPES an, wenn nötig
const SCOPES = "user.info.basic,user.info.profile";

export function buildAuthUrl() {
  const state = crypto.randomBytes(8).toString('hex');
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    scope: SCOPES,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  // TikTok OAuth Token Endpoint (prüfe ggf. aktuelle Doku)
  const url = "https://open.tiktokapis.com/v2/oauth/token/";
  const body = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Token-Exchange fehlgeschlagen: " + text);
  }
  return res.json();
}

export async function refreshToken(refresh_token) {
  const url = "https://open.tiktokapis.com/v2/oauth/token/";
  const body = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Refresh fehlgeschlagen: " + text);
  }
  return res.json();
}

export async function getUserInfo(access_token) {
  // Beispiel-Endpunkt — passe an deine benötigten Felder an
  const url = "https://open.tiktokapis.com/v2/user/info/";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("UserInfo fehlgeschlagen: " + text);
  }
  const data = await res.json();
  // Map auf ein schlankes Objekt
  return {
    open_id: data?.data?.user?.open_id || null,
    display_name: data?.data?.user?.display_name || "Creator",
    avatar_url: data?.data?.user?.avatar_url || null
  };
}
