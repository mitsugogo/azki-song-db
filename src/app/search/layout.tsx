import { siteConfig } from "../config/siteConfig";

// titleタグ
export const metadata = {
  title: `タグで検索 | ${siteConfig.siteName}`,
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
