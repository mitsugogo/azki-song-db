import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";
import PageNavigationLayout from "@/app/components/PageNavigationLayout";

export default function AcrosticSetlistLayout({
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
