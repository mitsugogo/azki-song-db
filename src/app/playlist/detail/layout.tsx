import { ThemeProvider } from "flowbite-react";
import { MantineProvider } from "@mantine/core";
import { theme, flowbiteTheme } from "../../theme";

// titleタグ
export const metadata = {
  title: "プレイリスト | AZKi Song Database",
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
