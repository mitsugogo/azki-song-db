"use client";

import MainPlayer from './layout/MainPlayer';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css';
import Link from 'next/link';
import { FaYoutube } from "react-icons/fa";
import { createTheme, ThemeProvider } from 'flowbite-react';

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


export default function Home() {

  return (
    <ThemeProvider theme={customTheme}>
      <div className="h-screen flex flex-col">
        <header className='flex-shrink-0 bg-background bg-primary text-white py-2 px-2'>
          <div className="flex items-center gap-2">

            <h1 className="text-lg lg:text-lg font-bold"><a href="/">AZKi Song Database</a></h1>
            <p className="text-xs hidden lg:inline">AZKiさんの歌枠データベース</p>
            <div className="ml-auto flex items-center gap-2">
              <Link href="https://www.youtube.com/@AZKi" target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                <span className="inline"><FaYoutube className='inline' size={16} /> AZKi Channel</span>
              </Link>
            </div>
          </div>
        </header>
        <MainPlayer />
        <footer className='flex-shrink-0 bg-gray-800 text-white py-2 px-4 text-center'>
          <p className="text-xs">本サイトは有志による非公式のファンサイトです。<span className="hidden lg:inline">動画はホロライブプロダクション様及びAZKi様が制作したものです。</span>動画の権利は制作者に帰属します。</p>
        </footer>
        <Analytics />
        <SpeedInsights />
      </div>
    </ThemeProvider>
  );
}