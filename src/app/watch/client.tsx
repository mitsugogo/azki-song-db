"use client";

import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import { Header } from "../components/Header";
import MainPlayer from "../components/MainPlayer";
import Footer from "../components/Footer";
import FoldableToggle from "../components/FoldableToggle";
import { SongsQueryOptionsProvider } from "../hook/useSongs";
import useWatchLayout from "../hook/useWatchLayout";

export default function WatchPageClient() {
  const layout = useWatchLayout();
  const hideHeader = layout.mode === "tabletop";
  const showFooter = layout.mode === "landscape-columns";

  return (
    <SongsQueryOptionsProvider value={{ includeMembersOnly: true }}>
      <div
        className="h-dvh flex flex-col"
        data-watch-layout={layout.mode}
        data-device-posture={layout.posture}
        data-viewport-segments={layout.segments.length}
        data-tabletop-variant={layout.tabletopVariant ?? undefined}
      >
        {!hideHeader && <Header />}
        <main
          className={`grow p-0 dark:bg-gray-900 ${
            layout.mode === "landscape-columns"
              ? "flex min-h-0 overflow-hidden lg:p-4 lg:pb-0"
              : layout.mode === "tabletop"
                ? "relative h-dvh overflow-hidden"
                : "min-h-0 overflow-y-auto"
          }`}
        >
          <MainPlayer layout={layout} />
        </main>
        {showFooter && <Footer />}
      </div>
      {layout.mode === "tabletop" && !layout.supportsDevicePosture && (
        <FoldableToggle floating forceVisible />
      )}
      <AnalyticsWrapper />
    </SongsQueryOptionsProvider>
  );
}
