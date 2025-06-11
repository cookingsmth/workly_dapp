module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(255, 255, 255, 0.6)' },
          '50%': { boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)' },
        },
        fadeInModal: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeInBackdrop: {
          '0%': { backgroundColor: 'rgba(0,0,0,0)' },
          '100%': { backgroundColor: 'rgba(0,0,0,0.5)' },
        },
        gradientMove: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
        fadeInModal: 'fadeInModal 0.3s ease-out forwards',
        fadeInBackdrop: 'fadeInBackdrop 0.3s ease-out forwards',
        'spin-slow': 'spin 6s linear infinite',
        'gradient-move': 'gradientMove 6s ease infinite',
      },
      backgroundSize: {
        'size-200': '200% 200%',
      }
    },
  },
  plugins: [],
}

