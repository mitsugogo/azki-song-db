"use client";

import MainPlayer from './components/MainPlayer';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css';
import Link from 'next/link';
import { FaInfoCircle, FaYoutube } from "react-icons/fa";
import { Button, DarkThemeToggle, Modal, ModalBody, ModalFooter, ModalHeader, ThemeProvider } from 'flowbite-react';
import { useState } from 'react';
import Acknowledgment from './components/Acknowledgment';

export default function Home() {
  // 謝辞
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  return (
    <ThemeProvider>
      <div className="h-screen flex flex-col">
        <header className='flex-shrink-0 bg-background bg-primary text-white py-2 px-2'>
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-lg font-bold"><a href="/">AZKi Song Database</a></h1>
            <p className="text-xs hidden lg:inline">AZKiさんの歌を楽しむためのデータベース</p>
            <FaInfoCircle className='inline cursor-pointer' size={16} onClick={() => setShowAcknowledgment(true)} />

            <div className="ml-auto flex items-center gap-2">
              <Link href="https://www.youtube.com/@AZKi" target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                <span className="inline"><FaYoutube className='inline' size={16} /> AZKi Channel</span>
              </Link>
              <DarkThemeToggle 
                className='outline-none forcus:ring-0 text-primary-200 dark:text-primary-200 bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-700 focus:border-primary-700 forcus:ring-primary-700 dark:forcus:ring-primary-700' />
            </div>
          </div>
        </header>
        <MainPlayer />
        <footer className='flex-shrink-0 bg-gray-800 text-white py-2 px-4 text-center hidden lg:block'>
          <p className="text-xs">本サイトは有志による非公式のファンサイトです。<span className="hidden lg:inline">動画はホロライブプロダクション様及びAZKi様が制作したものです。</span>動画の権利は制作者に帰属します。</p>
        </footer>
        <Analytics />
        <SpeedInsights />
      </div>
      <Modal show={showAcknowledgment} onClose={() => setShowAcknowledgment(false)}>
        <ModalHeader className='bg-white dark:bg-gray-800 dark:text-white'>謝辞</ModalHeader>
        <ModalBody className='bg-white dark:bg-gray-800 dark:text-white'>
          <Acknowledgment />
        </ModalBody>
        <ModalFooter className='bg-white dark:bg-gray-800 dark:text-white'>
          <Button className='bg-primary hover:bg-primary text-white transition text-sm' onClick={() => setShowAcknowledgment(false)}>閉じる</Button>
        </ModalFooter>
      </Modal>
    </ThemeProvider>
  );
}