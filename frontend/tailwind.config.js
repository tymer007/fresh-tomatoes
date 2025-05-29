// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tomRed: "#CA1B2B",
        tomDarkRed: "#B52330",
        tomGreen: "#19643A",
        tomDarkGreen: "#1E4E33",
        tomWhite: "#ECEDEB"
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}