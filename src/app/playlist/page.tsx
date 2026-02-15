import PlaylistDetailPage from "./client";
import type { Metadata } from "next";
import { metadata } from "../layout";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

export async function generateMetadata(): Promise<Metadata> {
  const title = "プレイリスト";
  const subtitle = "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: `${title} | ${siteConfig.siteName}`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default function Page() {
  return <PlaylistDetailPage />;
}
