import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { siteConfig } from "../config/siteConfig";

// titleタグ
export const metadata = {
  title: `タグで検索 | ${siteConfig.siteName}`,
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col h-dvh">
        <Header />
        <div className="flex flex-col grow md:flex-row overflow-y-hidden w-full">
          {children}
        </div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
