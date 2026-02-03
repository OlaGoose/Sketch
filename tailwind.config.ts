import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        loft: {
          yellow: '#FEDC00',
          black: '#1A1A1A',
          gray: '#F3F3F3',
          text: '#333333',
        },
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', 'sans-serif'],
        display: ['"Noto Sans JP"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        loft: '8px 8px 0px 0px rgba(0,0,0,1)',
        'loft-sm': '4px 4px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
};

export default config;
