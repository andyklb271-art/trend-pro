import { useEffect, useState } from "react";
import { apiGet, apiPost, API } from "../lib/api";

export default function AuthPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        const data = await apiGet("/me");
        if (!alive) return;
        setUser(data?.data?.user || null);
      } catch (e) {
        if (!alive) return;
        setUser(null);
        setErr(String(e?.message || e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleLogin = () => {
    window.location.href = `${API.API_URL}/auth/tiktok/login`;
  };

  const handleRefresh = async () => {
    try {
      setErr("");
      await apiPost("/auth/refresh");
      const data = await apiGet("/me");
      setUser(data?.data?.user || null);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  if (loading) return <div className="p-4">Lade…</div>;

  return (
    <div className="max-w-md mx-auto p-4 rounded-2xl shadow">
      <h1 className="text-xl font-semibold mb-3">TikTok Login</h1>

      {err && (
        <div className="mb-3 text-sm text-red-600">
          {err}<br />
          API: <code>{API.API_URL}</code>
        </div>
      )}

      {!user ? (
        <button onClick={handleLogin} className="px-4 py-2 rounded-xl shadow hover:opacity-90">
          Mit TikTok einloggen
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src={user.avatar_url} alt="avatar" className="w-12 h-12 rounded-full" />
            <div>
              <div className="font-medium">{user.display_name}</div>
              <div className="text-sm text-gray-500 break-all">open_id: {user.open_id}</div>
            </div>
          </div>
          <button onClick={handleRefresh} className="px-3 py-2 rounded-xl shadow hover:opacity-90">
            Token refreshen
          </button>
        </div>
      )}
    </div>
  );
}
