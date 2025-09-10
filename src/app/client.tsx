"use client";

import MainPlayer from "./components/MainPlayer";
import "./globals.css";
import { createTheme, ThemeProvider } from "flowbite-react";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import { Header } from "./components/Header";
import Footer from "./components/Footer";
import { CustomFlowbiteTheme } from "flowbite-react/types";

const customTheme: CustomFlowbiteTheme = createTheme({
  modal: {
    root: {
      base: "fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
      show: {
        on: "flex bg-gray-900/50 dark:bg-gray-900/80",
        off: "hidden",
      },
    },
    header: {
      base: "flex items-start justify-between rounded-t border-b py-3 px-5 dark:border-gray-600",
      popup: "border-b-0 p-2",
      title: "text-xl font-semibold text-gray-900 dark:text-white",
      close: {
        base: "ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white",
        icon: "h-5 w-5",
      },
    },
    footer: {
      base: "flex items-center space-x-2 rounded-b border-gray-200 p-3 dark:border-gray-600",
      popup: "border-t",
    },
  },
});

export default function ClientTop() {
  return (
    <ThemeProvider theme={customTheme}>
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
