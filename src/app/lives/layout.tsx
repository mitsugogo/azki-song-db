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

export default function LivesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex grow flex-col">{children}</div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
