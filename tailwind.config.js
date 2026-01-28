/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d0d1a',
        'bg-secondary': '#12121f',
        'bg-tertiary': '#1a1a2e',
        'accent-primary': '#00d26a',
        'accent-secondary': '#00b859',
        'text-primary': '#ffffff',
        'text-secondary': '#8a8a9a',
        'border-color': '#1f1f35',
      },
    },
  },
  plugins: [],
}
