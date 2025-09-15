"use client";

import MainPlayer from "./components/MainPlayer";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import { Header } from "./components/Header";
import Footer from "./components/Footer";
import { MantineProvider } from "@mantine/core";
import { theme, flowbiteTheme } from "./theme";
import { ThemeProvider } from "flowbite-react";
export default function ClientTop() {
  return (
    <MantineProvider theme={theme}>
      <ThemeProvider theme={flowbiteTheme}>
        <div className="h-dvh flex flex-col">
          <Header />
          <main className="flex flex-col md:flex-row flex-grow overflow-hidden p-0 lg:p-4 lg:pb-0 mb:pb-0 dark:bg-gray-900">
            <MainPlayer />
          </main>
          <Footer />
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </MantineProvider>
  );
}
