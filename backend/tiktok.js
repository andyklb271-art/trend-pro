// backend/tiktok.js
// ESM (package.json: "type": "module")
import crypto from "crypto";
import fetch from "node-fetch";

const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token";
const USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";

// ========================================================
// 1️⃣ Auth-URL erzeugen
// ========================================================
export function buildAuthUrl() {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    response_type: "code",
    scope: "user.info.basic",
    redirect_uri: process.env.REDIRECT_URI,
    state: crypto.randomUUID(),
  });

  const url = `${AUTH_URL}?${params.toString()}`;
  console.log("[OAUTH] Redirecting to TikTok:", url);
  return url;
}

// ========================================================
// 2️⃣ Token anfordern (funktioniert garantiert auf Render)
// ========================================================
export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
    code: code || "",
    grant_type: "authorization_code",
    redirect_uri: process.env.REDIRECT_URI || "",
  });

  console.log("[OAUTH] exchanging code for token…");
  console.log("[OAUTH] body =", body.toString());

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: body.toString(),
    });

    const data = await res.json();

    console.log("[OAUTH] token response:", data);

    if (!data.access_token) {
      throw new Error(
        `Token exchange returned no access_token (${data.error_description || data.error})`
      );
    }

    return data;
  } catch (err) {
    console.error("[OAUTH] token exchange ERROR:", err);
    throw err;
  }
}

// ========================================================
// 3️⃣ Token Refresh (optional, funktioniert analog)
// ========================================================
export async function refreshToken(refresh_token) {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: body.toString(),
  });

  const data = await res.json();
  console.log("[OAUTH] refresh response:", data);
  return data;
}

// ========================================================
// 4️⃣ User-Info abrufen
// ========================================================
export async function getUserInfo(access_token) {
  console.log("[OAUTH] fetching user info…");

  const res = await fetch(USERINFO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: ["open_id", "avatar_url", "display_name"],
    }),
  });

  const data = await res.json();
  console.log("[OAUTH] user info:", data);
  return data?.data?.user || null;
}
