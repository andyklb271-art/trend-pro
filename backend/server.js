import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { buildAuthUrl, exchangeCodeForToken /*, getUserInfo*/ } from './src/tiktok.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();

app.use(pinoHttp({ logger: log }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*', credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, node: process.version, env: process.env.NODE_ENV || 'dev' });
});

app.get('/auth/tiktok', (req, res) => {
  const url = buildAuthUrl();
  return res.redirect(url);
});

app.get('/auth/tiktok/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).send('Callback-Fehler: ' + error);
  try {
    const token = await exchangeCodeForToken(code);
    if (!token?.access_token) return res.status(500).send('Interner Fehler beim Callback (kein Access Token).');
    return res.send('OK – Token erhalten.');
  } catch (e) {
    req.log.error({ err: e }, 'Callback failed');
    return res.status(500).send('Interner Fehler beim Callback');
  }
});

app.get('/api/me', async (_req, res) => {
  // Hier würdest du aus deinem Store den Token laden und getUserInfo(token) aufrufen.
  res.json({ error: 'No access_token saved' });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  log.info({ PORT, FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN, REDIRECT_URI: process.env.REDIRECT_URI }, 'API started');
});
