import type { Viewport } from "next";
import PageNavigationLayout from "@/app/components/PageNavigationLayout";
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
        <PageNavigationLayout scrollMode="scroll-area">
          {children}
        </PageNavigationLayout>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
