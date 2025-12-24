/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'trading-green': '#10b981',
        'trading-red': '#ef4444',
        'trading-blue': '#3b82f6',
      },
    },
  },
  plugins: [],
}










