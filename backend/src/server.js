// backend/src/server.js  (oder backend/server.js)
// — Trend Pro minimal OAuth server (bereinigt & Render-ready)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import {
  buildAuthUrl,
  exchangeCodeForToken,
  refreshToken as refreshTok,
  getUserInfo,
} from './tiktok.js';
import { loadTokens, saveTokens } from './store.js';

const app = express();

// Proxy/CORS/Basics
app.set('trust proxy', 1);
app.use(express.json());
app.use(
  cors({
    origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:5173'],
    credentials: true,
  })
);

// ---- Config aus ENV ----
const cfg = {
  clientKey: process.env.TIKTOK_CLIENT_KEY,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  scopes: process.env.TIKTOK_SCOPES || 'user.info.basic,user.info.profile',
  redirectUri:
    process.env.REDIRECT_URI || 'https://example.com/auth/tiktok/callback',
};

// ---- Token-Store + Auto-Refresh ----
let TOKENS = loadTokens();
let refreshTimer = null;

function scheduleAutoRefresh(expiresInSec = 86400) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const ms = Math.max(5 * 60 * 1000, (expiresInSec - 600) * 1000 || 12 * 60 * 60 * 1000);

  refreshTimer = setTimeout(async () => {
    try {
      if (!TOKENS?.refresh_token) return scheduleAutoRefresh(12 * 60 * 60);
      const json = await refreshTok({
        clientKey: cfg.clientKey,
        clientSecret: cfg.clientSecret,
        refreshToken: TOKENS.refresh_token,
      });
      TOKENS = {
        access_token: json.access_token,
        refresh_token: json.refresh_token || TOKENS.refresh_token,
      };
      saveTokens(TOKENS);
      scheduleAutoRefresh(Number(json.expires_in || 86400));
      console.log('✅ Token automatisch erneuert');
    } catch (e) {
      console.error('⚠️ Auto-Refresh fehlgeschlagen:', e?.message || e);
      scheduleAutoRefresh(60 * 60);
    }
  }, ms);
}
scheduleAutoRefresh(12 * 60 * 60);

// ---- Healthcheck für Render ----
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});


// ---- Root: Status + direkte Auth-URL ----
app.get('/', (_req, res) => {
  res.json({
    name: 'Trend Pro – TikTok Minimal Server',
    mode: cfg.redirectUri.includes('example.com') ? 'OFFLINE' : 'ONLINE',
    auth_url: buildAuthUrl({
      clientKey: cfg.clientKey,
      scopes: cfg.scopes,
      redirectUri: cfg.redirectUri,
    }),
  });
});

// ---- TikTok Login (offizieller Pfad) ----
app.get('/auth/tiktok/login', (_req, res) => {
  const url = buildAuthUrl({
    clientKey: cfg.clientKey,
    scopes: cfg.scopes,
    redirectUri: cfg.redirectUri,
  });
  return res.redirect(url);
});

// Alias, falls du irgendwo noch /auth/login verlinkt hast
app.get('/auth/login', (_req, res) => res.redirect('/auth/tiktok/login'));

// ---- TikTok Callback (offizieller Pfad) ----
app.get('/auth/tiktok/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const json = await exchangeCodeForToken({
      clientKey: cfg.clientKey,
      clientSecret: cfg.clientSecret,
      code: String(code),
      redirectUri: cfg.redirectUri,
    });

    TOKENS = { access_token: json.access_token, refresh_token: json.refresh_token };
    saveTokens(TOKENS);
    scheduleAutoRefresh(Number(json.expires_in || 86400));

    // nach Login einfache Zielseite
    return res.redirect('/me');
  } catch (e) {
    console.error('Callback error:', e);
    res.status(500).send(String(e));
  }
});

// Alias, falls in der TikTok-Konsole (noch) /auth/callback steht
app.get('/auth/callback', (req, res) => res.redirect('/auth/tiktok/callback' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')));

// ---- Tokens manuell setzen (OFFLINE) ----
app.post('/auth/set-tokens', (req, res) => {
  const { access_token, refresh_token, expires_in } = req.body || {};
  if (!access_token) return res.status(400).json({ error: 'access_token required' });

  TOKENS = {
    access_token,
    refresh_token: refresh_token || TOKENS?.refresh_token,
  };
  saveTokens(TOKENS);
  scheduleAutoRefresh(Number(expires_in || 86400));
  res.json({ ok: true });
});

// ---- Refresh Token (manuell) ----
app.post('/auth/refresh', async (_req, res) => {
  try {
    if (!TOKENS?.refresh_token) return res.status(400).json({ error: 'No refresh_token saved' });

    const json = await refreshTok({
      clientKey: cfg.clientKey,
      clientSecret: cfg.clientSecret,
      refreshToken: TOKENS.refresh_token,
    });

    TOKENS = {
      access_token: json.access_token,
      refresh_token: json.refresh_token || TOKENS.refresh_token,
    };
    saveTokens(TOKENS);
    scheduleAutoRefresh(Number(json.expires_in || 86400));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ---- User Info ----
app.get('/me', async (_req, res) => {
  try {
    if (!TOKENS?.access_token) return res.status(400).json({ error: 'No access_token saved' });
    const data = await getUserInfo({ accessToken: TOKENS.access_token });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ---- Mock-Trends ----
app.get('/trends', (req, res) => {
  const limit = Math.min(Number(req.query.limit || 15), 50);
  const q = (req.query.q || '').toLowerCase();

  const base = [
    { tag: 'fyp', score: 99 }, { tag: 'viral', score: 97 }, { tag: 'trending', score: 95 },
    { tag: 'music', score: 93 }, { tag: 'dance', score: 92 }, { tag: 'funny', score: 91 },
    { tag: 'tutorial', score: 90 }, { tag: 'fitness', score: 89 }, { tag: 'food', score: 88 },
    { tag: 'fashion', score: 87 }, { tag: 'gaming', score: 86 }, { tag: 'travel', score: 85 },
    { tag: 'beauty', score: 84 }, { tag: 'prank', score: 83 }, { tag: 'lifehack', score: 82 },
    { tag: 'motivation', score: 81 }, { tag: 'soccer', score: 80 },
  ];

  const scored = base
    .map((h) => ({ ...h, score: q && h.tag.includes(q) ? h.score + 5 : h.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({ items: scored });
});

// ---- Start ----
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Trend Pro listening on :${PORT}`);
  console.log(`   FRONTEND_ORIGIN: ${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}`);
  console.log(`   REDIRECT_URI   : ${cfg.redirectUri}`);
});
