import PageNavigationLayout from "@/app/components/PageNavigationLayout";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { siteConfig } from "../config/siteConfig";

// titleタグ
export const metadata = {
  title: `プレイリスト | ${siteConfig.siteName}`,
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col h-dvh">
        <PageNavigationLayout scrollMode="scroll-area">
          {children}
        </PageNavigationLayout>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
