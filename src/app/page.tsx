"use client";

import MainPlayer from "./components/MainPlayer";
import "./globals.css";
import { ThemeProvider } from "flowbite-react";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import { Header } from "./components/Header";

export default function Home() {
  return (
    <ThemeProvider>
      <div className="h-dvh flex flex-col">
        <Header />
        <main className="flex flex-col md:flex-row flex-grow overflow-hidden 4xl:container 4xl:mx-auto p-0 lg:p-4 dark:bg-gray-900">
          <MainPlayer />
        </main>
        <footer className="flex-shrink-0 bg-gray-800 text-white py-2 px-4 text-center hidden lg:block">
          <p className="text-xs">
            本サイトは有志による非公式のファンサイトです。
            <span className="hidden lg:inline">
              動画はホロライブプロダクション様及びAZKi様が制作したものです。
            </span>
            動画の権利は制作者に帰属します。
          </p>
        </footer>
      </div>
      <AnalyticsWrapper />
    </ThemeProvider>
  );
}
