import type { ReactNode } from "react";
import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";
import { Header } from "@/app/components/Header";

export default function JourneyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="min-h-0 grow">{children}</div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
