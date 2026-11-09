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
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(420%)" },
        },
      },
      animation: {
        scan: "scan 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
