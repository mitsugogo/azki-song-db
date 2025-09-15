import { ThemeProvider } from "flowbite-react";
import { Header } from "../components/Header";
import { AnalyticsWrapper } from "../components/AnalyticsWrapper";
import Footer from "../components/Footer";
import { MantineProvider } from "@mantine/core";
import { theme, flowbiteTheme } from "../theme";

// titleタグ
export const metadata = {
  title: "収録データ | AZKi Song Database",
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
          <div className="flex flex-col min-h-screen">
            <Header />
            <div>{children}</div>
            <Footer />
          </div>
          <AnalyticsWrapper />
        </ThemeProvider>
      </MantineProvider>
    </>
  );
}
