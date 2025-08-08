// tailwind.config.js
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // `dark`クラスの有無でダークモードを切り替える
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tailwindのカラーパレットを参考に、数字で濃淡を定義
        primary: {
          50: '#fdf2f8',    // 最も明るい色 (e.g. bg-primary-50)
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#d11c76',  // デフォルトの`primary`として使用 (e.g. bg-primary-600)
          700: '#be185d',  // ホバー時などに使う暗い色 (e.g. hover:bg-primary-700)
          800: '#9d174d',
          900: '#831843',
          950: '#500724',   // 最も暗い色
          DEFAULT: '#d11c76', // `bg-primary`として使用
        },
        secondary: {
          DEFAULT: '#ea7eaf', // `bg-secondary`として使用
          darken: '#e0609b',  // `bg-secondary-darken`として使用
        },
        background: {
          light: colors.white, // 標準の白
          dark: colors.gray[900], // 標準の濃いグレー
        },
        foreground: {
          light: colors.black, // 標準の黒
          dark: colors.gray[100], // 標準の明るいグレー
        },
        muted: colors.gray[500], // 標準のグレー
      },
    },
  },
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};