"use client";

import dynamic from "next/dynamic";
import { GlobalPlayerProvider } from "../hook/useGlobalPlayer";
import PageTransitionHandler from "./PageTransitionHandler";

// MiniPlayerを遅延読み込みし、初期レンダリングを高速化
const MiniPlayer = dynamic(() => import("./MiniPlayer"), {
  ssr: false,
  loading: () => null,
});

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalPlayerProvider>
      {children}
      <MiniPlayer />
      <PageTransitionHandler />
    </GlobalPlayerProvider>
  );
}
