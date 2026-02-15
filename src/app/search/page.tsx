import { Metadata } from "next";
import SearchPageClient from "./client";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const searchTerm = params.q || "";

  // プレフィックスとアイコンのマッピング
  const prefixMap: Record<string, { icon: string }> = {
    "unit:": { icon: "👥" },
    "artist:": { icon: "🎤" },
    "sing:": { icon: "🎤" },
    "tag:": { icon: "🏷️" },
    "title:": { icon: "🎵" },
    "milestone:": { icon: "⭐" },
    "year:": { icon: "📅" },
    "season:": { icon: "🌸" },
  };

  // OG画像のタイトルを生成
  let ogTitle = "検索";
  let ogSubtitle = "楽曲を検索できます";
  let displayTerm = searchTerm;

  if (searchTerm) {
    // プレフィックスを検出
    let matched = false;
    for (const [prefix, { icon }] of Object.entries(prefixMap)) {
      if (searchTerm.startsWith(prefix)) {
        displayTerm = searchTerm.replace(prefix, "");
        ogTitle = `${icon} ${displayTerm}の検索結果`;
        ogSubtitle = `${siteConfig.siteName}`;
        matched = true;
        break;
      }
    }

    if (!matched) {
      ogTitle = `「${displayTerm}」の検索結果`;
      ogSubtitle = `${siteConfig.siteName}`;
    }
  }

  return {
    title: searchTerm
      ? `${displayTerm}の検索結果 | ${siteConfig.siteName}`
      : `検索 | ${siteConfig.siteName}`,
    description: "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
    openGraph: {
      title: ogTitle,
      description:
        "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
      url: `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}search${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`,
      type: "website",
      siteName: `${siteConfig.siteName}`,
      locale: "ja_JP",
      images: [
        {
          url: `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}api/og?title=${encodeURIComponent(ogTitle)}&subtitle=${encodeURIComponent(ogSubtitle)}&w=1200&h=630`,
          width: 1200,
          height: 630,
          alt: `${siteConfig.siteName} - ${ogTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default function SearchPage() {
  return <SearchPageClient />;
}
