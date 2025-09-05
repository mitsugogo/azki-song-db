"use client";

import MainPlayer from "./components/MainPlayer";
import "./globals.css";
import { ThemeProvider } from "flowbite-react";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import { Header } from "./components/Header";
import Footer from "./components/Footer";

export default function ClientTop() {
  return (
    <ThemeProvider>
      <div className="h-dvh flex flex-col">
        <Header />
        <main className="flex flex-col md:flex-row flex-grow overflow-hidden p-0 lg:p-4 lg:pb-0 mb:pb-0 dark:bg-gray-900">
          <MainPlayer />
        </main>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </ThemeProvider>
  );
}
