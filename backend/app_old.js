import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();

const PORT = Number(process.env.PORT || 3000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(express.json());

// CORS: Frontend zulassen + Cookies erlauben
app.use(cors({
  origin: [FRONTEND_ORIGIN],
  credentials: true,
}));

app.use(cookieParser(process.env.SESSION_SECRET));

// einfache In-Memory-Session
let SESSION = { user: null, access_token: null, refresh_token: null };

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// TikTok: Login -> redirect zu TikTok
app.get('/auth/tiktok/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const scope = encodeURIComponent('user.info.basic,user.info.profile');
  const url = `https://www.tiktok.com/v2/auth/authorize/` +
              `?client_key=${CLIENT_KEY}` +
              `&response_type=code` +
              `&scope=${scope}` +
              `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
              `&state=${state}`;
  res.redirect(url);
});

// TikTok: Callback -> Code eintauschen
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenResp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:
        `client_key=${encodeURIComponent(CLIENT_KEY)}` +
        `&client_secret=${encodeURIComponent(CLIENT_SECRET)}` +
        `&code=${encodeURIComponent(code)}` +
        `&grant_type=authorization_code` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    });
    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error(tokenData);
      return res.status(400).send('Token exchange failed');
    }

    const { access_token, refresh_token, expires_in } = tokenData.data;

    // Userinfo holen
    const meResp = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const meData = await meResp.json();

    SESSION = {
      user: meData.data?.user,
      access_token,
      refresh_token,
      expires_at: Date.now() + (expires_in * 1000)
    };

    // Signierte Cookie-Session (SameSite=Lax reicht für localhost)
    res.cookie('trendpro_sid', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // zurück ins Frontend
    res.redirect(FRONTEND_ORIGIN + '/me');
  } catch (e) {
    console.error(e);
    res.status(500).send('Callback error');
  }
});

// Session-Endpunkte fürs Frontend
app.get('/api/session', (req, res) => {
  res.json({ user: SESSION.user ?? null });
});

app.post('/api/logout', (req, res) => {
  SESSION = { user: null, access_token: null, refresh_token: null };
  res.clearCookie('trendpro_sid');
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API on http://localhost:${PORT}`);
});
