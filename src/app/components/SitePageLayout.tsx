"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { useLoading } from "../context/LoadingContext";
import PageNavigationLayout from "./PageNavigationLayout";
import Footer from "./Footer";
import { AnalyticsWrapper } from "./AnalyticsWrapper";

const pageRoutes = new Set([
  "search",
  "activity",
  "anniversaries",
  "discography",
  "playlist",
  "share",
  "units",
  "unlock-members",
  "data",
  "lives",
  "repertoire",
  "seichi-map",
  "statistics",
  "stream-archives",
]);

/** ルートの読み込み境界の外で、通常ページのヘッダーとメニューを維持する。 */
export default function SitePageLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading } = useLoading();
  const route = pathname?.split("/")[1] ?? "";

  // TOP・再生画面・404 はそれぞれ専用のレイアウトを持つ。
  if (!pageRoutes.has(route)) return children;

  return (
    <>
      <div className="flex h-dvh flex-col overflow-hidden">
        <PageNavigationLayout loading={loading}>
          {children}
        </PageNavigationLayout>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
