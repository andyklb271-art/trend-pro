import React from "react";
import { useStore } from "../store/useStore.js";
import { LineChart } from "lucide-react";

export default function Dashboard() {
  const { user, isAuthed } = useStore();
  return (
    <div className="rounded-2xl glass p-6 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <LineChart className="text-primary" />
        <h2 className="text-xl font-semibold">Übersicht</h2>
      </div>

      {!isAuthed ? (
        <p className="text-mute">
          Melde dich mit TikTok an, um Statistiken und Empfehlungen zu sehen.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <CardStat label="Views (7d)" value="—" />
            <CardStat label="Likes (7d)" value="—" />
            <CardStat label="Comments (7d)" value="—" />
            <CardStat label="TrendScore" value="—" />
          </div>
          <div className="text-mute text-sm">
            Willkommen {user?.display_name || "Creator"} – hier entsteht dein Analytics-Bereich.
          </div>
        </div>
      )}
    </div>
  );
}

function CardStat({ label, value }) {
  return (
    <div className="rounded-xl2 bg-surface p-4 border border-white/5">
      <div className="text-mute text-xs">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
