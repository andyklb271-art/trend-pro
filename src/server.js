import 'dotenv/config';
import express from 'express';
import {
  buildAuthUrl,
  exchangeCodeForToken,
  refreshToken as refreshTok,
  getUserInfo,
} from './tiktok.js';
import { loadTokens, saveTokens } from './store.js';

const app = express();
app.use(express.json());

const cfg = {
  clientKey: process.env.TIKTOK_CLIENT_KEY,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  scopes: process.env.TIKTOK_SCOPES || 'user.info.basic,user.info.profile',
  redirectUri: process.env.REDIRECT_URI || 'https://example.com/auth/tiktok',
};

let TOKENS = loadTokens();
let refreshTimer = null;

function scheduleAutoRefresh(expiresInSec = 86400) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const ms = Math.max(5 * 60 * 1000, (expiresInSec - 600) * 1000 || 12 * 60 * 60 * 1000);

  refreshTimer = setTimeout(async () => {
    try {
      if (!TOKENS.refresh_token) return scheduleAutoRefresh(12 * 60 * 60);
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

// Beim Start: Fallback alle 12h
scheduleAutoRefresh(12 * 60 * 60);

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

// 1) Build Auth URL (ONLINE)
app.get('/auth/login', (req, res) => {
  const url = buildAuthUrl({
    clientKey: cfg.clientKey,
    scopes: cfg.scopes,
    redirectUri: cfg.redirectUri,
  });
  res.redirect(url);
});

// 2) OAuth callback (ONLINE)
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const json = await exchangeCodeForToken({
      clientKey: cfg.clientKey,
      clientSecret: cfg.clientSecret,
      code,
      redirectUri: cfg.redirectUri,
    });

    TOKENS = { access_token: json.access_token, refresh_token: json.refresh_token };
    saveTokens(TOKENS);
    scheduleAutoRefresh(Number(json.expires_in || 86400));
    res.redirect('/me');
  } catch (e) {
    res.status(500).send(String(e));
  }
});

// 3) Tokens manuell setzen (OFFLINE)
app.post('/auth/set-tokens', (req, res) => {
  const { access_token, refresh_token, expires_in } = req.body || {};
  if (!access_token) return res.status(400).json({ error: 'access_token required' });

  TOKENS = {
    access_token,
    refresh_token: refresh_token || TOKENS.refresh_token,
  };
  saveTokens(TOKENS);
  scheduleAutoRefresh(Number(expires_in || 86400));
  res.json({ ok: true });
});

// 4) Refresh token
app.post('/auth/refresh', async (req, res) => {
  try {
    if (!TOKENS.refresh_token) return res.status(400).json({ error: 'No refresh_token saved' });

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

// 5) User Info
app.get('/me', async (req, res) => {
  try {
    if (!TOKENS.access_token) return res.status(400).json({ error: 'No access_token saved' });
    const data = await getUserInfo({ accessToken: TOKENS.access_token });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () =>
  console.log(`Trend Pro server listening on http://localhost:${port}`)
);
