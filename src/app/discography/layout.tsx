import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { flowbiteTheme } from "../theme";
import { siteConfig } from "../config/siteConfig";

// titleタグ
export const metadata = {
  title: `楽曲一覧 | ${siteConfig.siteName}`,
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider theme={flowbiteTheme}>
        <div className="flex flex-col h-dvh">
          <Header />
          <div className="flex flex-col grow md:flex-row overflow-y-hidden w-full">
            {children}
          </div>
          <Footer />
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </>
  );
}
