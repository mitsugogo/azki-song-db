import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";

// titleタグ
export const metadata = {
  title: "楽曲一覧 | AZKi Song Database",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider>
        <div className="flex flex-col h-dvh">
          <Header />
          <div className="flex flex-col flex-grow md:flex-row overflow-y-hidden w-full">
            {children}
          </div>
          <Footer />
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </>
  );
}
