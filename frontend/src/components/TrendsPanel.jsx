import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export default function TrendsPanel() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setLoading(true); setErr("");
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("limit", String(limit));
      const data = await apiGet(`/trends/personalized?${params}`);
      setItems(data.items || []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-xl mx-auto p-4 rounded-2xl shadow mt-8">
      <h2 className="text-lg font-semibold mb-3">Für dich im Trend</h2>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-sm text-gray-500">Filter (q)</label>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="z.B. deep house, soccer…"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500">Limit</label>
          <input
            type="number" min={1} max={50}
            value={limit} onChange={e => setLimit(Number(e.target.value))}
            className="w-20 border rounded-lg px-3 py-2"
          />
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl shadow">
          Laden
        </button>
      </div>

      {loading && <div className="mt-3 text-sm">Lade Trends…</div>}
      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

      <ul className="mt-4 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex justify-between border rounded-xl px-3 py-2">
            <span>#{it.tag}</span>
            <span className="text-gray-600">{it.score}</span>
          </li>
        ))}
        {!loading && items.length === 0 && <li className="text-sm text-gray-500">Keine Einträge</li>}
      </ul>
    </div>
  );
}
