import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { flowbiteTheme } from "../theme";

export default function AnniversariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider theme={flowbiteTheme}>
        <div className="flex flex-col h-dvh">
          <Header />
          <div className="flex flex-col grow md:flex-row overflow-y-auto w-full">
            {children}
          </div>
          <Footer />
        </div>
        <AnalyticsWrapper />
      </ThemeProvider>
    </>
  );
}
