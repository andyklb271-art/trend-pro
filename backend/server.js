// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import {
  buildAuthUrl,
  exchangeCodeForToken,
  refreshToken,
  getUserInfo,
} from './tiktok.js';
import { loadTokens, saveTokens } from './store.js';

// ===== Config =====
const {
  NODE_ENV = 'production',
  FRONTEND_ORIGIN = 'http://localhost:5173',
  REDIRECT_URI,
  SESSION_SECRET = 'change-me',
  PORT = process.env.PORT || 3000,
} = process.env;

const logger = pino({ level: NODE_ENV === 'production' ? 'info' : 'debug' });
const app = express();
app.set('trust proxy', 1);

// Quick sanity log, helps bei Redirect-Fehlern
logger.info({
  FRONTEND_ORIGIN,
  REDIRECT_URI,
  NODE_ENV,
}, 'Boot config');

// ===== Middleware =====
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use(pinoHttp({ logger }));
app.use(cors({
  origin: [FRONTEND_ORIGIN],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limits
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use('/auth', rateLimit({ windowMs: 5 * 60 * 1000, max: 50 }));

// ===== Session (im RAM) + Persistenz =====
let SESSION = {
  user: null,           // { open_id, display_name, avatar_url }
  access_token: null,
  refresh_token: null,
  expires_at: 0,        // ms epoch
};

// Persistierte Tokens laden
const persisted = loadTokens();
if (persisted) {
  SESSION = { ...SESSION, ...persisted };
  logger.info({ has_refresh: !!SESSION.refresh_token }, 'Loaded persisted tokens');
}

// ===== Auto-Refresh =====
let refreshTimer = null;
function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (!SESSION.refresh_token || !SESSION.expires_at) return;

  const msToExpiry = Math.max(0, SESSION.expires_at - Date.now());
  const delay = Math.max(5 * 60 * 1000, msToExpiry - 10 * 60 * 1000); // 10 Min vorher, min 5 Min

  refreshTimer = setTimeout(async () => {
    try {
      const next = await refreshToken(SESSION.refresh_token);
      if (next?.access_token) {
        SESSION.access_token = next.access_token;
        SESSION.refresh_token = next.refresh_token || SESSION.refresh_token;
        SESSION.expires_at = Date.now() + (next.expires_in || 86400) * 1000;
        saveTokens(SESSION);
        logger.info('✅ Token automatisch erneuert');
        scheduleRefresh();
      } else {
        logger.warn({ next }, 'Refresh returned no access_token');
      }
    } catch (err) {
      logger.error({ err }, '❌ Token-Refresh fehlgeschlagen');
    }
  }, delay);
}
if (SESSION.refresh_token && SESSION.expires_at) scheduleRefresh();

// ===== Health / Debug =====
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/debug/session', (_req, res) => {
  res.json({
    has_user: !!SESSION.user,
    has_access_token: !!SESSION.access_token,
    has_refresh_token: !!SESSION.refresh_token,
    expires_at: SESSION.expires_at,
    now: Date.now(),
  });
});

// ===== OAuth Start =====
app.get('/auth/tiktok', (_req, res) => {
  try {
    if (!REDIRECT_URI) {
      logger.error('REDIRECT_URI fehlt in Environment!');
      return res.status(500).send('Serverfehler: REDIRECT_URI fehlt (Env).');
    }
    const url = buildAuthUrl(); // benutzt REDIRECT_URI aus Env
    return res.redirect(url);
  } catch (e) {
    logger.error({ e }, 'buildAuthUrl failed');
    return res.status(500).send('Auth init failed');
  }
});

// ===== OAuth Callback =====
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    logger.error({ error, error_description }, 'TikTok returned error in callback');
    return res
      .status(400)
      .send(`TikTok Fehler: ${error}${error_description ? ' - ' + error_description : ''}`);
  }
  if (!code) {
    logger.error('No "code" in TikTok callback');
    return res.status(400).send('Fehler: Kein Code im Callback.');
  }

  try {
    const token = await exchangeCodeForToken(code);
    if (!token?.access_token) {
      logger.error({ token }, 'Token exchange returned no access_token');
      return res.status(500).send('Interner Fehler beim Callback (kein Access Token).');
    }

    SESSION.access_token = token.access_token;
    SESSION.refresh_token = token.refresh_token;
    SESSION.expires_at = Date.now() + (token.expires_in || 86400) * 1000;

    const me = await getUserInfo(SESSION.access_token);
    SESSION.user = me || null;

    saveTokens(SESSION);
    scheduleRefresh();

    res.cookie('tp_session', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
    });

    // zurück ins Frontend
    return res.redirect(FRONTEND_ORIGIN);
  } catch (e) {
    // Zeige Ursache im Log & eine klare Meldung im Browser
    logger.error({ e }, 'Callback-Fehler (exchange/userinfo)');
    return res.status(500).send('Interner Fehler beim Callback');
  }
});

// ===== Logout =====
app.post('/auth/logout', (_req, res) => {
  SESSION = { user: null, access_token: null, refresh_token: null, expires_at: 0 };
  saveTokens(SESSION);
  res.clearCookie('tp_session');
  return res.json({ ok: true });
});

// ===== API =====
app.get('/api/me', (_req, res) => {
  if (!SESSION.access_token) return res.json({ error: 'No access_token saved' });
  return res.json({ user: SESSION.user });
});

app.get('/api/trends', (_req, res) => {
  const demo = [
    { id: 't1', title: 'Cozy Morning Routine', hashtags: ['#cozy', '#morning', '#aesthetic'], score: 78 },
    { id: 't2', title: 'POV Filter Mashup',   hashtags: ['#pov', '#filter', '#viral'],       score: 73 },
    { id: 't3', title: 'Workout 12-min Hit',  hashtags: ['#fitness', '#12min', '#music'],    score: 69 },
  ];
  res.json({ trends: demo });
});

// ===== Start (Render-kompatibel) =====
app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`✅ API on :${PORT}`);
  logger.info(`   FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
  logger.info(`   REDIRECT_URI   : ${REDIRECT_URI}`);
});
