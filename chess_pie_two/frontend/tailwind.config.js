/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode:'media',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss}",
    // include files under src/ (project uses src/app and src/components)
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
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
