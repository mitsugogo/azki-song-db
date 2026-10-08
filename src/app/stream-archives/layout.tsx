import PageNavigationLayout from "@/app/components/PageNavigationLayout";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { Viewport } from "next";
import StreamArchivesScrollControls from "./StreamArchivesScrollControls";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function ArchivesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <PageNavigationLayout scrollMode="window">
          {children}
        </PageNavigationLayout>
        <Footer />
      </div>
      <StreamArchivesScrollControls />
      <AnalyticsWrapper />
    </>
  );
}
