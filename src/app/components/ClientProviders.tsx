"use client";

import { Notifications } from "@mantine/notifications";
import { GlobalPlayerProvider } from "../hook/useGlobalPlayer";
import PageTransitionHandler from "./PageTransitionHandler";
import { LoadingProvider, useLoading } from "../context/LoadingContext";
import Loading from "../loading";
import { SharedYouTubePlayerProvider } from "./SharedYouTubePlayer";
import ServiceWorkerCleanup from "./ServiceWorkerCleanup";

// MiniPlayerを遅延読み込みし、初期レンダリングを高速化
import MiniPlayer from "./MiniPlayer";
import { SessionProvider } from "next-auth/react";
import { UserLibraryProvider } from "../context/UserLibraryContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <UserLibraryProvider>
        <GlobalPlayerProvider>
          <SharedYouTubePlayerProvider>
            <LoadingProvider>
              <Notifications position="top-right" zIndex={10000} limit={5} />
              {children}
              <MiniPlayer />
              <PageTransitionHandler />
              <LoadingOverlayIfNeeded />
              <ServiceWorkerCleanup />
            </LoadingProvider>
          </SharedYouTubePlayerProvider>
        </GlobalPlayerProvider>
      </UserLibraryProvider>
    </SessionProvider>
  );
}

function LoadingOverlayIfNeeded() {
  const { loading } = useLoading();
  if (!loading) return null;
  return <Loading />;
}
