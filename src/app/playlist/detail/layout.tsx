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
  return <>{children}</>;
}
