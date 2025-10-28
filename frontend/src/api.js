// api.js

// ✅ Funktioniert sowohl mit Vite (import.meta.env) als auch ohne Build-Tool
const isProd = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.PROD;

const API_BASE = isProd
  ? "https://trend-pro.onrender.com"           // live
  : (["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "http://localhost:3000"                // DEV: lokales Backend
      : "https://trend-pro.onrender.com");     // Fallback

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",                     // wichtig für Cookies/Session
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  // robustes JSON-Parsing
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

// 🔹 User-Daten (Session)
export async function getUserData() {
  return apiFetch("/me");
}

// 🔹 TikTok-Login starten (richtiger Pfad!)
export function loginWithTikTok() {
  window.location.href = `${API_BASE}/auth/tiktok/login`;
}

// 🔹 Logout
export async function logout() {
  return apiFetch("/api/logout", { method: "POST" });
}

// optional exportieren für Debug
export { API_BASE };
