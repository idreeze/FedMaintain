/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        semiconductor: {
          dark: '#0a0f1d',
          navy: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          cyan: '#06b6d4',
          accent: '#38bdf8',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      }
    },
  },
  plugins: [],
}
