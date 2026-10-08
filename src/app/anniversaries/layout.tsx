import PageNavigationLayout from "@/app/components/PageNavigationLayout";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function AnniversariesLayout({
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
