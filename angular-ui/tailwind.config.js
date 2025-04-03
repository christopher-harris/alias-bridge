const PrimeUI = require('tailwindcss-primeui');
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    PrimeUI,
    plugin(function({ addBase, theme }) {
      addBase({
        'h1': { fontSize: '3.815rem', fontWeight: 'bold', lineHeight: '1.2' },
        'h2': { fontSize: '3.052rem', fontWeight: 'bold', lineHeight: '1.3' },
        'h3': { fontSize: '2.441rem', fontWeight: 'bold', lineHeight: '1.4' },
        'h4': { fontSize: '1.953rem', fontWeight: 'bold', lineHeight: '1.5' },
        'h5': { fontSize: '1.563rem', fontWeight: 'medium', lineHeight: '1.6' },
        'h6': { fontSize: '1.25rem', fontWeight: 'medium', lineHeight: '1.7' },
        'p': { fontSize: '1rem', fontWeight: 'medium', lineHeight: '1.6' },
        'small': { fontSize: '0.8rem', fontWeight: 'medium', lineHeight: '1.5' },
        'label': { fontSize: '1rem', fontWeight: 'bold', lineHeight: '1.5' },
      })
    })
  ],
}

