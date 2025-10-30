/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0f14",
        surface: "#121821",
        surfaceAlt: "#0f141c",
        foreground: "#e8edf4",
        mute: "#9aa7b2",
        primary: "#6aa7ff",
        primaryDim: "#3c79e6",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        glass: "rgba(255,255,255,0.06)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
}
