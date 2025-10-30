// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { buildAuthUrl, exchangeCodeForToken, refreshToken, getUserInfo } from './tiktok.js';
import { loadTokens, saveTokens } from './store.js';

const {
  NODE_ENV = 'production',
  FRONTEND_ORIGIN = 'http://localhost:5173',
  REDIRECT_URI,
  SESSION_SECRET = 'change-me'
} = process.env;

const logger = pino({ level: NODE_ENV === 'production' ? 'info' : 'debug' });

const app = express();
app.set('trust proxy', 1); // wichtig hinter Render/Proxies

// ---------- Security & Parsers ----------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use(pinoHttp({ logger }));

// ---------- CORS ----------
app.use(
  cors({
    origin: [FRONTEND_ORIGIN],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------- Rate Limit (schützt /api & /auth) ----------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/api', '/auth'], limiter);

// ---------- In-Memory Session + Persistenz ----------
let SESSION = {
  user: null,            // { open_id, display_name, avatar_url }
  access_token: null,
  refresh_token: null,
  expires_at: 0,
};

// beim Start evtl. persistierte Tokens laden
const persisted = loadTokens();
if (persisted) {
  SESSION = { ...SESSION, ...persisted };
}

// ---------- Auto-Refresh ----------
let refreshTimer = null;
function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (!SESSION?.refresh_token || !SESSION?.expires_at) return;

  const msToExpiry = Math.max(0, SESSION.expires_at - Date.now());
  // 10 Minuten vor Ablauf refreshen, min. 5 Minuten
  const delay = Math.max(5 * 60 * 1000, msToExpiry - 10 * 60 * 1000);

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
        logger.warn('⚠️ Refresh lieferte keinen access_token');
      }
    } catch (err) {
      logger.error({ err }, '❌ Token-Refresh fehlgeschlagen');
    }
  }, delay);
}
scheduleRefresh();

// ---------- Health ----------
app.get('/health', (_req, res) => res.json({ ok: true }));

// ---------- TikTok Login ----------
app.get('/auth/tiktok', (_req, res) => {
  try {
    const url = buildAuthUrl();
    return res.redirect(url);
  } catch (err) {
    logger.error({ err }, 'Fehler beim buildAuthUrl');
    return res.status(500).json({ error: 'auth_init_failed' });
  }
});

// ---------- TikTok Callback ----------
app.get('/auth/tiktok/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    logger.warn({ error }, 'TikTok Callback mit Fehler');
    return res.status(400).send('Auth-Fehler: ' + error);
  }
  if (!code) return res.status(400).send('Auth-Fehler: code fehlt');

  try {
    const token = await exchangeCodeForToken(code, REDIRECT_URI);
    SESSION.access_token = token.access_token;
    SESSION.refresh_token = token.refresh_token;
    SESSION.expires_at = Date.now() + (token.expires_in || 86400) * 1000;

    const me = await getUserInfo(SESSION.access_token);
    SESSION.user = me;

    saveTokens(SESSION);
    scheduleRefresh();

    // kleines Session-Flag
    res.cookie('tp_session', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
    });

    // zurück ins Frontend
    return res.redirect(FRONTEND_ORIGIN);
  } catch (err) {
    logger.error({ err }, 'Callback-Fehler');
    return res.status(500).send('Interner Fehler beim Callback');
  }
});

// ---------- Session/User ----------
function userPayload() {
  if (!SESSION?.access_token) return { error: 'No access_token saved' };
  return { user: SESSION.user || null };
}

app.get('/me', (_req, res) => res.json(userPayload()));
app.get('/api/me', (_req, res) => res.json(userPayload())); // Alias

// ---------- Debug (optional) ----------
app.get('/debug/session', (_req, res) => {
  const { user, access_token, refresh_token, expires_at } = SESSION;
  res.json({
    user,
    has_access_token: Boolean(access_token),
    has_refresh_token: Boolean(refresh_token),
    expires_at,
  });
});

app.post('/auth/logout', (_req, res) => {
  SESSION = { user: null, access_token: null, refresh_token: null, expires_at: 0 };
  saveTokens(SESSION);
  if (refreshTimer) clearTimeout(refreshTimer);
  res.clearCookie('tp_session');
  return res.json({ ok: true });
});

// ---------- Start ----------
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ API on :${PORT}`);
  logger.info(`   FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
  logger.info(`   REDIRECT_URI   : ${REDIRECT_URI}`);
});