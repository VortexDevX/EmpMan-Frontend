// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecfdf9",
          100: "#ccfbef",
          200: "#99f6df",
          300: "#5eeace",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0f766e",
          700: "#0f5f59",
          800: "#11504c",
          900: "#13423f",
        },
        background: {
          light: "#f8fafc",
          dark: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
