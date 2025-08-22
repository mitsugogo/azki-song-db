import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider>
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex-grow container mx-auto">{children}</div>
          <footer className="flex-shrink-0 bg-gray-800 text-white py-2 px-4 text-center hidden lg:block">
            <p className="text-xs">
              本サイトは有志による非公式のファンサイトです。
              <span className="hidden lg:inline">
                動画はホロライブプロダクション様及びAZKi様が制作したものです。
              </span>
              動画の権利は制作者に帰属します。
            </p>
          </footer>
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </>
  );
}
