import { Header } from "@/app/components/Header";
import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";

export default function WhereMyRobocosanBeganLayout({
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
