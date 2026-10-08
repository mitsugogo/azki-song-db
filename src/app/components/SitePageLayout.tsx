"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { useLoading } from "../context/LoadingContext";
import PageNavigationLayout, {
  type PageNavigationScrollMode,
} from "./PageNavigationLayout";
import Footer from "./Footer";
import { AnalyticsWrapper } from "./AnalyticsWrapper";

const scrollModes: Record<string, PageNavigationScrollMode> = {
  search: "contained",
  activity: "scroll-area",
  anniversaries: "scroll-area",
  discography: "scroll-area",
  playlist: "scroll-area",
  share: "scroll-area",
  units: "scroll-area",
  "unlock-members": "scroll-area",
  data: "window",
  lives: "window",
  repertoire: "window",
  "seichi-map": "window",
  statistics: "window",
  "stream-archives": "window",
};

/** ルートの読み込み境界の外で、通常ページのヘッダーとメニューを維持する。 */
export default function SitePageLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading } = useLoading();
  const route = pathname?.split("/")[1] ?? "";
  const scrollMode = Object.hasOwn(scrollModes, route)
    ? scrollModes[route]
    : null;

  // TOP・再生画面・404 はそれぞれ専用のレイアウトを持つ。
  if (!scrollMode) return children;

  return (
    <>
      <div
        className={
          scrollMode === "window"
            ? "flex min-h-screen flex-col"
            : "flex h-dvh flex-col"
        }
      >
        <PageNavigationLayout scrollMode={scrollMode} loading={loading}>
          {children}
        </PageNavigationLayout>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
