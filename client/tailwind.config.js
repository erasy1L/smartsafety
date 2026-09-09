/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          800: "#152544",
          900: "#0b192c",
          950: "#07101e",
        },
        corp: {
          navy: "#0f172a",
          blue: "#1e3a8a",
          accent: "#2563eb",
          slate: "#334155",
          graphite: "#1e293b",
          muted: "#64748b",
          border: "#e2e8f0",
          card: "#ffffff",
          bg: "#f8fafc",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.375rem" }],
        base: ["1.0625rem", { lineHeight: "1.625rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
        xl: ["1.3125rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.625rem", { lineHeight: "2rem" }],
        "3xl": ["2rem", { lineHeight: "2.375rem" }],
        "4xl": ["2.375rem", { lineHeight: "2.5rem" }],
        "5xl": ["3.25rem", { lineHeight: "1.15" }],
      },
      maxWidth: {
        app: "140rem",
      },
    },
  },
  plugins: [],
};
