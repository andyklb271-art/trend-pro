// backend/src/server.js
// ================ Setup ================
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

// ---- App einmalig anlegen (wichtig!) ----
const app = express();
app.set('trust proxy', 1);

const FRONTEND_ALLOW = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(cors({
  origin: FRONTEND_ALLOW,
  credentials: true,
}));
app.use(express.json());

// ---- Healthcheck für Render ----
app.get('/health', (_req, res) => res.status(200).send('ok'));

// ================ Config & Token-State ================
const cfg = {
  clientKey:    process.env.TIKTOK_CLIENT_KEY,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  scopes:       process.env.TIKTOK_SCOPES || 'user.info.basic,user.info.profile',
  // TikTok erwartet EXAKT die gleiche Redirect-URL wie in der Dev Console
  redirectUri:  process.env.REDIRECT_URI || 'https://example.com/auth/tiktok/callback',
};

let TOKENS = loadTokens();          // { access_token?, refresh_token? }
let refreshTimer = null;

// Access-Token automatisch erneuern
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
        access_token:  json.access_token,
        refresh_token: json.refresh_token || TOKENS.refresh_token,
      };
      saveTokens(TOKENS);
      scheduleAutoRefresh(Number(json.expires_in || 86400));
      console.log('✅ Token automatisch erneuert');
    } catch (e) {
      console.error('⚠️ Auto-Refresh fehlgeschlagen:', e?.message || e);
      scheduleAutoRefresh(60 * 60); // in 1h erneut versuchen
    }
  }, ms);
}
// Beim Start: Fallback alle 12h
scheduleAutoRefresh(12 * 60 * 60);

// ================ Routen ================

// Info-Route
app.get('/', (req, res) => {
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

// ---- Login: unterstütze beide Pfade (/auth/login UND /auth/tiktok/login) ----
function redirectToTikTok(_req, res) {
  const url = buildAuthUrl({
    clientKey:   cfg.clientKey,
    scopes:      cfg.scopes,
    redirectUri: cfg.redirectUri,
  });
  return res.redirect(url);
}
app.get('/auth/login', redirectToTikTok);
app.get('/auth/tiktok/login', redirectToTikTok);

// ---- Callback: unterstütze beide Pfade (je nach REDIRECT_URI) ----
async function handleCallback(req, res) {
  try {
    const { code, error, error_description } = req.query;
    if (error) return res.status(400).send(`${error}: ${error_description || ''}`);
    if (!code) return res.status(400).send('Missing code');

    const json = await exchangeCodeForToken({
      clientKey:   cfg.clientKey,
      clientSecret: cfg.clientSecret,
      code,
      redirectUri: cfg.redirectUri, // muss exakt zu TikTok Console passen
    });

    TOKENS = { access_token: json.access_token, refresh_token: json.refresh_token };
    saveTokens(TOKENS);
    scheduleAutoRefresh(Number(json.expires_in || 86400));

    // zurück zur einfachen Profil-Ansicht
    return res.redirect('/me');
  } catch (e) {
    console.error('Callback-Fehler:', e);
    return res.status(500).send(String(e));
  }
}
app.get('/auth/callback', handleCallback);
app.get('/auth/tiktok/callback', handleCallback);

// ---- Tokens manuell setzen (Offline-Test) ----
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

// ---- Refresh-Route ----
app.post('/auth/refresh', async (_req, res) => {
  try {
    if (!TOKENS?.refresh_token) return res.status(400).json({ error: 'No refresh_token saved' });

    const json = await refreshTok({
      clientKey: cfg.clientKey,
      clientSecret: cfg.clientSecret,
      refreshToken: TOKENS.refresh_token,
    });

    TOKENS = {
      access_token:  json.access_token,
      refresh_token: json.refresh_token || TOKENS.refresh_token,
    };
    saveTokens(TOKENS);
    scheduleAutoRefresh(Number(json.expires_in || 86400));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ---- User-Info ----
app.get('/me', async (_req, res) => {
  try {
    if (!TOKENS?.access_token) return res.status(400).json({ error: 'No access_token saved' });
    const data = await getUserInfo({ accessToken: TOKENS.access_token });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ---- einfache Mock-Route für Trends (Demo) ----
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
  const items = base
    .map(h => ({ ...h, score: q && h.tag.includes(q) ? h.score + 5 : h.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  res.json({ items });
});

// ================ Start ================
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`Trend Pro server listening on http://localhost:${port}`);
});
