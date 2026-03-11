import { ThemeProvider } from "flowbite-react";
import { Header } from "@/app/components/Header";
import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";
import { MantineProvider } from "@mantine/core";
import { theme, flowbiteTheme } from "@/app/theme";

export default function MyBestNineSongsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
