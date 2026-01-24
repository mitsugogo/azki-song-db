"use client";

import { GlobalPlayerProvider } from "../hook/useGlobalPlayer";
import MiniPlayer from "./MiniPlayer";
import PageTransitionHandler from "./PageTransitionHandler";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <GlobalPlayerProvider>
      {children}
      <MiniPlayer />
      <PageTransitionHandler />
    </GlobalPlayerProvider>
  );
}
