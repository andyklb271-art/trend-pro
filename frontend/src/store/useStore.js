import { create } from "zustand";

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Tokens (keine Secrets im Frontend speichern; nur Session-Flag)
  isAuthed: false,
  setAuthed: (v) => set({ isAuthed: v }),

  // UI
  loading: false,
  setLoading: (v) => set({ loading: v }),

  // Trends / Daten
  trends: [],
  setTrends: (trends) => set({ trends }),

  // Actions
  async fetchTrends() {
    set({ loading: true });
    try {
      const res = await fetch(
        import.meta.env.VITE_API_BASE + "/api/trends",
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Fehler beim Laden der Trends");
      const data = await res.json();
      set({ trends: data.trends || [] });
    } finally {
      set({ loading: false });
    }
  }
}));
