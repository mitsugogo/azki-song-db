"use client";

import MainPlayer from './layout/MainPlayer';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';


export default function Home() {
  
  return (
    <div className="h-screen flex flex-col">
      <header className='flex-shrink-0 bg-background bg-primary text-white py-2 px-2'>
        <div className="flex items-center gap-2">
          <h1 className="text-lg lg:text-lg font-bold">AZKi Song Database</h1>
          <p className="text-xs hidden lg:inline">AZKiさんの歌枠データベース</p>
          <div className="ml-auto flex items-center gap-2">
            <a href="https://www.youtube.com/@AZKi" target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
              <span className="inline"><FontAwesomeIcon icon={faYoutube} /> AZKi Channel</span>
            </a>
          </div>
        </div>
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