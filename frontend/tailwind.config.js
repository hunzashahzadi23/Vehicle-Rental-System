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
        border: "hsl(var(--border))",
        background: "var(--background)",
        card: "var(--card)",
        text: "var(--text)",
        primary: "var(--primary)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)"
        }
      }
    },
  },
  plugins: [],
}
