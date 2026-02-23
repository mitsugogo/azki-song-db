"use client";

import dynamic from "next/dynamic";
import { GlobalPlayerProvider } from "../hook/useGlobalPlayer";
import PageTransitionHandler from "./PageTransitionHandler";
import { LoadingProvider, useLoading } from "../context/LoadingContext";
import Loading from "../loading";

// MiniPlayerを遅延読み込みし、初期レンダリングを高速化
import MiniPlayer from "./MiniPlayer";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalPlayerProvider>
      <LoadingProvider>
        {children}
        <MiniPlayer />
        <PageTransitionHandler />
        <LoadingOverlayIfNeeded />
      </LoadingProvider>
    </GlobalPlayerProvider>
  );
}

function LoadingOverlayIfNeeded() {
  const { loading } = useLoading();
  if (!loading) return null;
  return <Loading />;
}
