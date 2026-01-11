/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./apps/dashboard/src/**/*.{html,ts}",
    "./apps/dashboard/src/app/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

