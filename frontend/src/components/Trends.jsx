import React, { useEffect } from "react";
import { useStore } from "../store/useStore.js";
import { Flame } from "lucide-react";

export default function Trends() {
  const { trends, fetchTrends, loading } = useStore();

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return (
    <div className="rounded-2xl glass p-6 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="text-primary" />
        <h2 className="text-xl font-semibold">Aktuelle Trends</h2>
      </div>

      {loading ? (
        <div className="text-mute">Lade Trends…</div>
      ) : trends.length === 0 ? (
        <div className="text-mute">Noch keine Trends gefunden.</div>
      ) : (
        <ul className="space-y-3">
          {trends.map((t) => (
            <li key={t.id} className="rounded-xl2 bg-surface p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-mute">{t.hashtags?.join(" ")}</div>
                </div>
                <div className="text-sm text-mute">Score: {t.score}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
