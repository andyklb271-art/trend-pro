// backend/src/tiktok.js
import fetch from "node-fetch";

const BASE = "https://open.tiktokapis.com/v2";
const AUTHZ = "https://www.tiktok.com/v2/auth/authorize";

export function buildAuthUrl({ clientKey, redirectUri, state }) {
  const scopes = ["user.info.basic"];
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scopes.join(","),
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTHZ}?${params.toString()}`;
}

export async function exchangeCodeForToken({ clientKey, clientSecret, code, redirectUri }) {
  // TikTok akzeptiert NUR x-www-form-urlencoded, keine JSON!
  const params = new URLSearchParams();
  params.append("client_key", clientKey);
  params.append("client_secret", clientSecret);
  params.append("code", code);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", redirectUri);

  const res = await fetch(`${BASE}/oauth/token/`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(), // <— explizit als String
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
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`user/info failed ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}
