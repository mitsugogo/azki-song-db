import { ThemeProvider } from "flowbite-react";
import { MantineProvider } from "@mantine/core";
import { theme, flowbiteTheme } from "../../theme";
import { siteConfig } from "@/app/config/siteConfig";

// titleタグ
export const metadata = {
  title: `プレイリスト | ${siteConfig.siteName}`,
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MantineProvider theme={theme}>
        <ThemeProvider theme={flowbiteTheme}>{children}</ThemeProvider>
      </MantineProvider>
    </>
  );
}
