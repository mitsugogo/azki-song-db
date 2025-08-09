import type { createTheme } from 'flowbite-react';

const customTheme = createTheme({
  button: {
    color: {
      // Tailwindで定義した `primary` を使用
      primary: 'bg-primary-600 text-white hover:bg-primary-700',
      
      // Tailwindで定義した `secondary` を使用
      secondary: 'bg-secondary text-white hover:bg-secondary-darken',
    },
    // ボタンの共通スタイル
    base: 'inline-flex items-center justify-center font-medium rounded-lg',
  },

  modal: {
    content: {
      base: 'relative h-full w-full p-4 md:h-auto',
      // 背景色に `background` カラーを適用
      inner: 'relative rounded-lg bg-background-light shadow dark:bg-background-dark',
    },
    header: {
      base: 'flex items-start justify-between rounded-t border-b p-5 dark:border-gray-600',
      // テキストカラーに `foreground` カラーを適用
      title: 'text-xl font-medium text-foreground-light dark:text-foreground-dark',
      close: {
        base: 'ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white',
      },
    },
  },
});

export default customTheme;