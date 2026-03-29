import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { flowbiteTheme } from "../theme";
import { siteConfig } from "../config/siteConfig";
import { Viewport } from "next";
import { getTranslations } from "next-intl/server";

const t = await getTranslations("Data");

// titleタグ
export const metadata = {
  title: `${t("title")} | ${siteConfig.siteName}`,
};

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
      <ThemeProvider theme={flowbiteTheme}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div>{children}</div>
          <Footer />
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </>
  );
}
