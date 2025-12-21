/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        merri: ["var(--font-merri)"],
        sri: ["var(--font-sri)"]
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}
