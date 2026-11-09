/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8ed",
          100: "#ffefd4",
          200: "#ffdba8",
          300: "#ffc070",
          400: "#ff9c37",
          500: "#fe7d11",
          600: "#ef6107",
          700: "#c64808",
          800: "#9d390f",
          900: "#7e3110",
          DEFAULT: "#f97316",
          hover: "#ea580c",
          deep: "#9d4300",
          soft: "#ffdbca",
          tint: "#fdf1e8",
        },
        accent: {
          DEFAULT: "#16a34a",
          bright: "#22c55e",
          deep: "#006e2d",
          soft: "#7cf994",
          tint: "rgba(22, 163, 74, 0.1)",
        },
        success: {
          DEFAULT: "#16a34a",
          bright: "#22c55e",
          deep: "#006e2d",
          soft: "#7cf994",
          tint: "rgba(22, 163, 74, 0.1)",
        },
        warning: {
          DEFAULT: "#d78900",
          soft: "#ffddb8",
          deep: "#855300",
          tint: "rgba(245, 158, 11, 0.12)",
        },
        danger: {
          DEFAULT: "#ba1a1a",
          soft: "#ffdad6",
          deep: "#93000a",
        },
        surface: {
          DEFAULT: "#f8f9ff",
          canvas: "#faf7f2",
          lowest: "#ffffff",
          low: "#eff4ff",
          container: "#e6eeff",
          high: "#dee9fc",
          highest: "#d9e3f6",
          inverse: "#27313f",
        },
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container-high": "#dee9fc",
        "surface-container-highest": "#d9e3f6",
        ink: {
          DEFAULT: "#121c2a",
          strong: "#1f2937",
        },
        muted: {
          DEFAULT: "#584237",
          slate: "#4b5563",
          soft: "#8c7164",
        },
        outline: {
          DEFAULT: "#8c7164",
          soft: "#e0c0b1",
        },
        hairline: "#e5e7eb",
        faint: "#d1d5db",
        mist: "#f3f4f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-hero": [
          "44px",
          { lineHeight: "52px", letterSpacing: "-0.03em", fontWeight: "800" },
        ],
        "display-hero-mobile": [
          "32px",
          { lineHeight: "38px", letterSpacing: "-0.025em", fontWeight: "800" },
        ],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.025em", fontWeight: "700" },
        ],
        "headline-lg-mobile": [
          "26px",
          { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "headline-md": [
          "24px",
          { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "headline-sm": [
          "18px",
          { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["15px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "20px", fontWeight: "400" }],
        "label-lg": ["15px", { lineHeight: "20px", fontWeight: "600" }],
        "label-md": ["13px", { lineHeight: "18px", fontWeight: "600" }],
        "label-sm": [
          "11px",
          { lineHeight: "14px", fontWeight: "600", letterSpacing: "0.02em" },
        ],
      },
      borderRadius: {
        control: "0.75rem",
        card: "1rem",
        panel: "1.5rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(31, 41, 55, 0.04), 0 1px 4px -1px rgba(249, 115, 22, 0.02)",
        floating:
          "0 12px 24px -4px rgba(31, 41, 55, 0.08), 0 4px 12px -2px rgba(31, 41, 55, 0.03)",
        header: "0 1px 8px rgba(0, 0, 0, 0.04)",
        footer: "0 -1px 6px rgba(0, 0, 0, 0.02)",
        inset: "inset 0 1px 3px rgba(18, 28, 42, 0.08)",
      },
      maxWidth: {
        content: "80rem",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(420%)" },
        },
        "progress-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        scan: "scan 2.6s ease-in-out infinite",
        "progress-pulse": "progress-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
