import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";
import { Header } from "@/app/components/Header";

export default function AcrosticSetlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex h-dvh flex-col">
        <Header />
        <div className="flex w-full grow flex-col overflow-y-hidden md:flex-row">
          {children}
        </div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}
