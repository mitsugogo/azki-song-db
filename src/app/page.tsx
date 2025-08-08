"use client";

import { useState, useEffect } from 'react';
import { Song } from './types/song'; // 型定義をインポート
import MainPlayer from './layout/MainPlayer';
import YouTubePlayer from './components/YouTubePlayer';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'; // スタイルシートをインポート


export default function Home() {
  return (
    <div className="h-screen flex flex-col text-foreground bg-background">
      <header className='flex-shrink-0 bg-background bg-primary text-white py-2 px-2'>
        <h1 className="text-lg lg:text-3xl font-bold">AZKi Song Database</h1>
      </header>
      <MainPlayer />
      <footer className='flex-shrink-0 bg-gray-800 text-white py-2 px-4 text-center'>
        <p className="text-xs">本サイトは有志による非公式のファンサイトです。<span className="hidden lg:inline">動画はホロライブプロダクション様及びAZKi様が制作したものです。</span>動画の権利は制作者に帰属します。</p>
        <p className="text-xs hidden lg:inline">© 2025 AZKi Song Database</p>
      </footer>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}