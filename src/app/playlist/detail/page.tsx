import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import PlaylistDetailPage from "./client";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const title = "プレイリスト";
  const subtitle = "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const canonical = new URL("/playlist/detail", baseUrl).toString();
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: `プレイリスト | ${siteConfig.siteName}`,
    description: "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲",
    openGraph: {
      title,
      description: subtitle,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: "ja_JP",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: subtitle,
      images: [ogImagePath],
    },
    alternates: {
      canonical,
    },
  };
}

export default function Page() {
  return <PlaylistDetailPage />;
}
