/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss}"
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
