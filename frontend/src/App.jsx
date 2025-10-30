import React, { lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "./store/useStore.js";
import { LogIn, Sparkles, BarChart3 } from "lucide-react";

const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const Trends = lazy(() => import("./components/Trends.jsx"));

const Loading = () => (
  <div className="flex items-center justify-center h-[60vh] text-mute">
    Lädt…
  </div>
);

export default function App() {
  const { user, setUser, isAuthed, setAuthed } = useStore();

  useEffect(() => {
    // Check Session
    (async () => {
      try {
        const res = await fetch(
          import.meta.env.VITE_API_BASE + "/api/me",
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
            setAuthed(true);
          }
        }
      } catch {}
    })();
  }, [setUser, setAuthed]);

  const handleLogin = () => {
    window.location.href = import.meta.env.VITE_API_BASE + "/auth/tiktok";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary" />
            <span className="font-semibold tracking-wide">Trend&nbsp;Pro</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthed ? (
              <div className="text-sm text-mute">
                Eingeloggt als <span className="text-foreground">{user?.display_name || "Creator"}</span>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-xl2 bg-primary hover:bg-primaryDim transition-colors text-black font-medium"
              >
                <div className="flex items-center gap-2">
                  <LogIn size={18} />
                  <span>TikTok Login</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass p-6 shadow-soft"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-primary" />
            <h1 className="text-2xl font-semibold">Dein TikTok Trend-Cockpit</h1>
          </div>
          <p className="text-mute">
            Trends erkennen, Inhalte planen, Wachstum steigern – alles in einer App.
          </p>
        </motion.div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Suspense fallback={<Loading />}>
            <div className="lg:col-span-2">
              <Dashboard />
            </div>
            <div className="lg:col-span-1">
              <Trends />
            </div>
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-sm text-mute">
        © {new Date().getFullYear()} Trend Pro
      </footer>
    </div>
  );
}

