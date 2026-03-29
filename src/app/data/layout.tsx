import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { flowbiteTheme } from "../theme";
import { Viewport } from "next";

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
