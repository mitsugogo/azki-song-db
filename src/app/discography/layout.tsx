import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { siteConfig } from "../config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";
import { Viewport } from "next";

// titleタグ
export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({
    namespace: "Metadata.discography",
    locale,
  });
  return {
    title: t("title", { siteName: siteConfig.siteName }),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function StatsLayout({
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
