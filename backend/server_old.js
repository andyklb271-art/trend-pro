// server.fixed.js — Express backend for TikTok OAuth v2 on Render
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fetch from 'node-fetch';

app.get('/health', (req, res) => res.send('ok'));

const {
  PORT = process.env.PORT || 3000,
  NODE_ENV = process.env.NODE_ENV || 'production',
  FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  REDIRECT_URI = process.env.REDIRECT_URI, // e.g. https://trend-pro.onrender.com/auth/tiktok/callback
  TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET,
  SESSION_SECRET = process.env.SESSION_SECRET || 'change-me',
} = process.env;

const app = express();

// Healthcheck, damit Render "healthy" sieht
app.get('/health', (_req, res) => res.send('ok'));

// TikTok Login -> Redirect zu TikTok
app.get('/auth/tiktok/login', (req, res) => {
  const url = buildAuthUrl();        // siehe Funktion unten
  return res.redirect(url);
});

function buildAuthUrl() {
  const state = 'trendpro'; // optional: randomisieren
  const u = new URL('https://www.tiktok.com/v2/auth/authorize/');
  u.searchParams.set('client_key', process.env.TIKTOK_CLIENT_KEY);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', process.env.TIKTOK_SCOPES || 'user.info.basic,user.info.profile');
  u.searchParams.set('redirect_uri', process.env.REDIRECT_URI);
  u.searchParams.set('state', state);
  return u.toString();
}

app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use(cors({
  origin: [FRONTEND_ORIGIN],
  credentials: true,
}));

// Basic security headers (lightweight)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Health
app.get('/health', (req, res) => res.status(200).send('ok'));

// In-memory session (replace with DB in production)
let SESSION = {
  user: null,
  access_token: null,
  refresh_token: null,
  expires_in: null,
};

const makeState = () => crypto.randomBytes(16).toString('hex');

// --- Start login ---
app.get('/auth/tiktok/login', (req, res) => {
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET || !REDIRECT_URI) {
    return res.status(500).send('TikTok client configuration missing');
  }
  const state = makeState();
  res.cookie('oauth_state', state, {
    httpOnly: true, secure: true, sameSite: 'none', maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    response_type: 'code',
    scope: 'user.info.basic,user.info.profile',
    redirect_uri: REDIRECT_URI,
    state
  });
  const url = 'https://www.tiktok.com/v2/auth/authorize/?' + params.toString();
  return res.redirect(url);
});

// --- Callback ---
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code, state } = req.query;
  const saved = req.cookies?.oauth_state;
  if (!code || !state || !saved || state !== saved) {
    return res.status(400).send('Invalid state or code');
  }

  try {
    const tokenResp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      })
    });
    const token = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error('Token error:', token);
      return res.status(400).send('Token exchange failed');
    }

    // Fetch user info
    const userResp = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    const userJson = await userResp.json();

    SESSION = {
      user: userJson?.data?.user || null,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_in: token.expires_in
    };

    res.cookie('trendpro_sid', crypto.randomBytes(8).toString('hex'), {
      httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 3600 * 1000,
    });

    return res.redirect(`${FRONTEND_ORIGIN}/me`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('OAuth failed');
  }
});

// Session endpoints
app.get('/me', (req, res) => {
  res.json({ user: SESSION.user });
});

app.post('/api/logout', (req, res) => {
  SESSION = { user: null, access_token: null, refresh_token: null, expires_in: null };
  res.clearCookie('trendpro_sid');
  res.json({ ok: true });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ API on :${PORT}`);
  console.log(`   FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
  console.log(`   REDIRECT_URI   : ${REDIRECT_URI}`);
});
