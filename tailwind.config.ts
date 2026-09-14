import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f8f9ff",
        "surface-dim": "#ccdbf3",
        "surface-lowest": "#ffffff",
        "surface-low": "#eff4ff",
        "surface-container": "#e6eeff",
        "surface-high": "#dce9ff",
        "surface-highest": "#d5e3fc",
        "on-surface": "#0d1c2e",
        "on-surface-variant": "#424754",
        primary: "#0058be",
        "primary-container": "#2170e4",
        "primary-fixed": "#d8e2ff",
        "primary-fixed-dim": "#adc6ff",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#001a42",
        secondary: "#855300",
        "secondary-container": "#fea619",
        "secondary-fixed": "#ffddb8",
        "secondary-fixed-dim": "#ffb95f",
        "on-secondary-fixed": "#2a1700",
        tertiary: "#006947",
        "tertiary-container": "#00855b",
        "tertiary-fixed": "#6ffbbe",
        "on-tertiary-fixed": "#002113",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        cream: "#FDFBF7",
        ink: "#1E293B",
        muted: "#64748B",
        stroke: "#E7E0D2",
        sky: "#3B82F6",
        sunny: "#F59E0B",
        mint: "#10B981",
        coral: "#F43F5E",
        cosmic: "#8B5CF6",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-hero": ["48px", { lineHeight: "56px", fontWeight: "800" }],
        "headline-lg": ["36px", { lineHeight: "44px", fontWeight: "800" }],
        "headline-md": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        instruction: ["24px", { lineHeight: "32px", fontWeight: "700" }],
        answer: ["22px", { lineHeight: "28px", fontWeight: "800" }],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
      },
      spacing: {
        "space-xs": "0.5rem",
        "space-sm": "0.75rem",
        "space-md": "1.25rem",
        "space-lg": "2rem",
        "space-xl": "3rem",
      },
      boxShadow: {
        pillow: "0 4px 0 #E2DAC8, 0 8px 16px rgba(180,160,130,0.12)",
        tactile: "0 6px 0 var(--btn-shade, #004395), 0 12px 20px rgba(180,160,130,0.16)",
        card: "0 8px 0 #d5e3fc, 0 16px 24px rgba(13,28,46,0.06)",
      },
      maxWidth: {
        game: "860px",
      },
      minHeight: {
        touch: "56px",
        "touch-lg": "68px",
      },
    },
  },
  plugins: [],
};

export default config;
