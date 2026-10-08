import { siteConfig } from "../config/siteConfig";
import { Viewport } from "next";

// titleタグ
export const metadata = {
  title: `統計情報 | ${siteConfig.siteName}`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
