1) Node 18+ installieren.
2) Projekt anlegen:
- Erstelle Dateien gemäß dieser Canvas.
- `npm install`
- `.env` aus `.env.example` kopieren und deine Werte setzen.
3) OFFLINE sofort testen (mit Tokens aus deinem PowerShell-Flow):
- In `.env` ACCESS_TOKEN + REFRESH_TOKEN eintragen oder mit POST /auth/set-tokens setzen.
- `npm run dev`
- `GET http://localhost:3000/me` → sollte User-Daten liefern.
4) ONLINE nutzen:
- In TikTok Developer Console **REDIRECT_URI** setzen (z. B. `https://yourdomain.com/auth/callback`).
- Dieselbe URI in `.env` (REDIRECT_URI) eintragen.
- Server öffentlich deployen (Render/Railway/Vercel Edge + adapter), dann `/auth/login` öffnen und den Flow normal durchlaufen.
5) Nächste Schritte (optional):
- Routen für Video-Listen/Stats ergänzen (abhängig von freigeschalteten Produkten/Scopes deiner App).
- Frontend (React/Vite) anbinden → ruft `/me`, `/auth/login`, `/auth/refresh`.
*/