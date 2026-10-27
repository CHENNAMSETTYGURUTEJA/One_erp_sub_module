
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        sky: {
          50: '#edf8f3',
          100: '#d8f0e4',
          200: '#b5e3cd',
          300: '#85d0af',
          400: '#53b98d',
          500: '#2b9b70',
          600: '#207d5b',
          700: '#1d644a',
          800: '#1c503d',
          900: '#194333',
          950: '#0d261c',
        },
        cyan: {
          50: '#eef9f5',
          100: '#d7f1e6',
          200: '#b1e4d0',
          300: '#7ed2b3',
          400: '#4bbd93',
          500: '#289d75',
          600: '#1d7f5e',
          700: '#1c664d',
          800: '#1b523f',
          900: '#184435',
          950: '#0c281e',
        },
        brand: {
          50: '#edf8f3',
          100: '#d8f0e4',
          500: '#2b9b70',
          600: '#207d5b',
          700: '#1d644a',
          800: '#1c503d',
          900: '#194333',
        },
      },
    },
  },
  plugins: [],
};

