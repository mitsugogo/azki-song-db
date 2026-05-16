"use client";

import { ThemeProvider } from "flowbite-react";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import { Header } from "../components/Header";
import MainPlayer from "../components/MainPlayer";
import Footer from "../components/Footer";
import { SongsQueryOptionsProvider } from "../hook/useSongs";
import { flowbiteTheme } from "../theme";

export default function WatchPageClient() {
  return (
    <SongsQueryOptionsProvider value={{ includeMembersOnly: true }}>
      <ThemeProvider theme={flowbiteTheme}>
        <div className="h-dvh flex flex-col">
          <Header />
          <main className="flex flex-col md:flex-row md:foldable:flex-row grow md:overflow-hidden p-0 lg:p-4 lg:pb-0 mb:pb-0 dark:bg-gray-900">
            <MainPlayer />
          </main>
          <Footer />
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </SongsQueryOptionsProvider>
  );
}
