import { useEffect, useState, useCallback } from "react";
import { getUserData, loginWithTikTok, logout } from "./api";
// Wenn du ein eigenes Panel hast, kannst du es später wieder einbauen.

export default function App() {
  const [user, setUser] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });

  const loadUser = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const data = await getUserData();
      // akzeptiert beide Shapes: {user} ODER {data:{user}}
      const u = data?.user ?? data?.data?.user ?? null;
      setUser(u);
      setState({ loading: false, error: "" });
    } catch (e) {
      setUser(null);
      setState({ loading: false, error: e?.message || "Unbekannter Fehler" });
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const onLogin = () => {
    // direkte Weiterleitung — kein extra State nötig
    loginWithTikTok();
  };

  const onLogout = async () => {
    try {
      await logout();
      await loadUser();
    } catch (e) {
      setState(s => ({ ...s, error: e?.message || "Logout fehlgeschlagen" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white p-6">
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
          🚀 AI-Powered Trend Analyzer
        </h1>
        <p className="text-purple-300">Advanced Machine Learning & Neural Networks</p>
      </header>

      {/* Statusleiste */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <img
                  src={user.avatar_url}
                  alt={user.display_name || "Avatar"}
                  className="w-10 h-10 rounded-full border border-purple-500"
                />
                <div>
                  <div className="font-semibold">{user.display_name}</div>
                  <div className="text-xs text-slate-400">Eingeloggt</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-700" />
                <div>
                  <div className="font-semibold">Gast</div>
                  <div className="text-xs text-slate-400">
                    Nicht eingeloggt
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUser}
              className="px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-700 transition"
            >
              Aktualisieren
            </button>
            {user ? (
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 transition"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition"
              >
                Mit TikTok anmelden
              </button>
            )}
          </div>
        </div>

        {/* Lade-/Fehlerzustände */}
        {state.loading && (
          <div className="mt-3 text-sm text-slate-300">Lade Status…</div>
        )}
        {!state.loading && state.error && (
          <div className="mt-3 text-sm text-red-300">
            Fehler: {state.error}
          </div>
        )}
      </div>

      {/* Haupt-Karten (statisch, funktionieren auch ohne Login) */}
      <main className="max-w-7xl mx-auto grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {/* Content Booster */}
        <section className="bg-slate-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-md border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">⚡ AI Content Booster</h2>
          <div className="space-y-3">
            <input
              className="w-full bg-slate-900 p-2 rounded-lg border border-slate-700"
              placeholder="Thema / Nische"
            />
            <select className="w-full bg-slate-900 p-2 rounded-lg border border-slate-700">
              <option>Viral & Trendy</option>
              <option>Motivational</option>
              <option>Informativ</option>
            </select>
            <button className="w-full bg-purple-600 hover:bg-purple-500 transition font-semibold py-2 rounded-lg">
              Content generieren
            </button>
          </div>
        </section>

        {/* Hashtag Generator */}
        <section className="bg-slate-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-md border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-pink-400"># Hashtag Generator</h2>
          <textarea
            className="w-full bg-slate-900 p-2 rounded-lg border border-slate-700 h-24"
            placeholder="Video-Beschreibung..."
          />
          <button className="mt-3 w-full bg-pink-600 hover:bg-pink-500 transition font-semibold py-2 rounded-lg">
            Hashtags generieren
          </button>
        </section>

        {/* Sentiment Analysis */}
        <section className="bg-slate-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-md border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">💬 Sentiment-Analyse</h2>
          <textarea
            className="w-full bg-slate-900 p-2 rounded-lg border border-slate-700 h-24"
            placeholder="Kommentar-Text hier eingeben..."
          />
          <button className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 transition font-semibold py-2 rounded-lg">
            Analyse starten
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center mt-16 text-slate-500 text-sm">
        <p>© 2025 Trend Pro • Built with 💜 by Andreas</p>
      </footer>
    </div>
  );
}
