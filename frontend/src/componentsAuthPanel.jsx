import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;
const FRONTEND_ORIGIN = import.meta.env.VITE_FRONTEND_ORIGIN || "http://localhost:5173";

export default function AuthPanel() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  async function fetchMe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
      } else {
        const data = await res.json();
        const u = data?.tiktok?.data?.user;
        setUser(u ?? null);
      }
    } catch (e) {
      setError(e?.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  function login() {
    const returnTo = encodeURIComponent(FRONTEND_ORIGIN);
    window.location.href = `${API_BASE}/auth/tiktok?returnTo=${returnTo}`;
  }

  async function logout() {
    setLoading(true);
    await fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" });
    await fetchMe();
  }

  return (
    <div className="rounded-2xl shadow-xl bg-[#1d1630]/80 p-6 max-w-md w-full mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔐</span>
        <h3 className="text-xl font-semibold text-white">TikTok Login</h3>
      </div>

      {loading ? (
        <p className="text-slate-300">Lade Status…</p>
      ) : user ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full" />
            )}
            <div>
              <div className="text-white font-medium">{user?.display_name || "TikTok User"}</div>
              <div className="text-slate-400 text-sm">open_id: {user?.open_id}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 transition py-3 text-white font-semibold"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-300">
            Du bist nicht eingeloggt. Melde dich mit TikTok an, um die Features freizuschalten.
          </p>
          <button
            onClick={login}
            className="w-full rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] transition py-3 text-white font-semibold"
          >
            Mit TikTok anmelden
          </button>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
}
