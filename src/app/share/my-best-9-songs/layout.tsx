import { ThemeProvider } from "flowbite-react";
import { Header } from "@/app/components/Header";
import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";
import { flowbiteTheme } from "@/app/theme";

export default function MyBestNineSongsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={flowbiteTheme}>
      <div className="flex flex-col h-dvh">
        <Header />
        <div className="flex flex-col grow md:flex-row overflow-y-hidden w-full">
          {children}
        </div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </ThemeProvider>
  );
}
