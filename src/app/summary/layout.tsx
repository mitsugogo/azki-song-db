import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { MantineProvider } from "@mantine/core";
import { theme, flowbiteTheme } from "../theme";

// titleタグ
export const metadata = {
  title: "年ごとの活動記録 | AZKi Song Database",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MantineProvider theme={theme}>
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
      </MantineProvider>
    </>
  );
}
