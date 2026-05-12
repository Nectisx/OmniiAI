/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // OmniAI Design System
        background: {
          DEFAULT: '#0D1B2A',
          secondary: '#0f2035',
          tertiary: '#132540',
          elevated: '#1a3050',
        },
        cyan: {
          DEFAULT: '#00B4CC',
          light: '#00d4f0',
          dark: '#008fa3',
        },
        violet: {
          DEFAULT: '#7B4FD4',
          light: '#a57ef5',
          dark: '#5c35a8',
        },
        border: {
          DEFAULT: '#1e3a52',
          secondary: '#2a4a6a',
          focus: '#00B4CC',
        },
        text: {
          primary: '#e8f4f8',
          secondary: '#8aacbe',
          muted: '#4a7a9b',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease forwards',
        'fade-in': 'fadeIn 0.2s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-dot': 'bounceDot 0.9s infinite',
        'stream': 'stream 0.7s step-end infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        bounceDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
        },
        stream: {
          '0%, 100%': { borderColor: '#00B4CC' },
          '50%': { borderColor: 'transparent' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-omni': 'linear-gradient(135deg, #00B4CC, #7B4FD4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
