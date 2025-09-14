import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";

// titleタグ
export const metadata = {
  title: "統計情報 | AZKi Song Database",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider>
        <div className="flex flex-col h-lvh">
          <Header />
          <div>{children}</div>
          <Footer />
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </>
  );
}
