import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
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
  const locale = await getLocale();
  const tMeta = await getTranslations({ namespace: "Metadata.search", locale });
  const messages = (await import(`../../messages/${locale}.json`)).default;

  let ogTitle = messages.SearchBrowse?.title ?? "検索";
  let ogSubtitle = tMeta("ogSubtitle", { siteName: siteConfig.siteName });
  let displayTerm = searchTerm;

  if (searchTerm) {
    // プレフィックスを検出
    let matched = false;
    for (const [prefix, { icon }] of Object.entries(prefixMap)) {
      if (searchTerm.startsWith(prefix)) {
        displayTerm = searchTerm.replace(prefix, "");
        const label = messages.SearchResults?.labelWithQuery
          ? messages.SearchResults.labelWithQuery.replace("{term}", displayTerm)
          : `「${displayTerm}」の検索結果`;
        ogTitle = `${icon} ${label}`;
        ogSubtitle = `${siteConfig.siteName}`;
        matched = true;
        break;
      }
    }

    if (!matched) {
      ogTitle = messages.SearchResults?.labelWithQuery
        ? messages.SearchResults.labelWithQuery.replace("{term}", displayTerm)
        : `「${displayTerm}」の検索結果`;
      ogSubtitle = `${siteConfig.siteName}`;
    }
  }

  const canonical = new URL("/search", baseUrl);
  if (searchTerm) {
    canonical.searchParams.set("q", searchTerm);
  }
  const ogImagePath = `/api/og?title=${encodeURIComponent(ogTitle)}&subtitle=${encodeURIComponent(ogSubtitle)}&w=1200&h=630`;

  return {
    title: searchTerm
      ? `${messages.SearchResults?.labelWithQuery ? messages.SearchResults.labelWithQuery.replace("{term}", displayTerm) : `${displayTerm}の検索結果`} | ${siteConfig.siteName}`
      : `${messages.SearchBrowse?.title ?? "検索"} | ${siteConfig.siteName}`,
    description:
      messages.SearchBrowse?.summary ??
      "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
    openGraph: {
      title: ogTitle,
      description:
        messages.SearchBrowse?.summary ??
        "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
      url: canonical.toString(),
      type: "website",
      siteName: `${siteConfig.siteName}`,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: `${siteConfig.siteName} - ${ogTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description:
        messages.SearchBrowse?.summary ??
        "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
      images: [ogImagePath],
    },
    alternates: {
      canonical: canonical.toString(),
    },
  };
}

export default function SearchPage() {
  return <SearchPageClient />;
}
