import type { Viewport } from "next";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function UnitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex h-dvh flex-col">
        <Header />
        <div className="flex w-full grow flex-col overflow-y-auto md:flex-row">
          {children}
        </div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
