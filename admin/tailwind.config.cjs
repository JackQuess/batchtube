module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#050505',
          card: 'rgba(22, 22, 22, 0.7)',
          red: '#ea2a33'
        }
      }
    }
  },
  plugins: []
};
