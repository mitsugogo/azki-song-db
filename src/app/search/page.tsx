import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import SearchPageClient from "./client";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";

const getSearchSummary = async (locale: string): Promise<string | null> => {
  try {
    const songs = await fetchSongsFromApiCached({ locale });
    const countSongs = songs.length.toLocaleString(locale);
    const countVideos = new Set(
      songs.map((song) => song.video_id).filter(Boolean),
    ).size.toLocaleString(locale);
    const tMetadata = await getTranslations({
      namespace: "Metadata.search",
      locale,
    });

    return tMetadata("summary", {
      countSongs,
      countVideos,
    });
  } catch {
    return null;
  }
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tab?: string | string[] }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const readParam = (value?: string | string[]): string => {
    if (Array.isArray(value)) {
      return value[0] ?? "";
    }
    return value ?? "";
  };

  const searchTerm = readParam(params.q);
  const tab = readParam(params.tab);

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

  const tabLabelKeyMap = {
    categories: "category",
    title: "title",
    artist: "artist",
    tag: "tag",
    "song-tag": "songTag",
    singer: "singer",
    collab: "collab",
    "related-artists": "relatedArtists",
    "not-sung-for-a-year": "notSungForYear",
  } as const;

  const tabIconMap: Partial<Record<keyof typeof tabLabelKeyMap, string>> = {
    title: "🎵",
    artist: "🎤",
    singer: "🎤",
    tag: "🏷️",
    "song-tag": "🏷️",
    collab: "👥",
    "related-artists": "📊",
  };

  // OG画像のタイトルを生成
  const locale = await getLocale();
  const tMeta = await getTranslations({ namespace: "Metadata.search", locale });
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const summary = (await getSearchSummary(locale)) ?? tMeta("description");

  const normalizedTab = Object.prototype.hasOwnProperty.call(
    tabLabelKeyMap,
    tab,
  )
    ? (tab as keyof typeof tabLabelKeyMap)
    : "categories";

  let ogTitle = messages.SearchBrowse?.title ?? "検索";
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
        matched = true;
        break;
      }
    }

    if (!matched) {
      ogTitle = messages.SearchResults?.labelWithQuery
        ? messages.SearchResults.labelWithQuery.replace("{term}", displayTerm)
        : `「${displayTerm}」の検索結果`;
    }
  } else if (normalizedTab !== "categories") {
    const tabLabelKey = tabLabelKeyMap[normalizedTab];
    const tabLabel = messages.SearchBrowse?.filters?.[tabLabelKey];
    if (tabLabel) {
      const tabIcon = tabIconMap[normalizedTab] ?? "";
      ogTitle = tabIcon ? `${tabIcon} ${tabLabel}` : tabLabel;
    }
  }

  const canonical = new URL("/search", baseUrl);
  if (searchTerm) {
    canonical.searchParams.set("q", searchTerm);
  }
  if (normalizedTab !== "categories") {
    canonical.searchParams.set("tab", normalizedTab);
  }

  const tabLabelForTitle =
    normalizedTab !== "categories"
      ? messages.SearchBrowse?.filters?.[tabLabelKeyMap[normalizedTab]]
      : "";
  const pageTitle = searchTerm
    ? `${messages.SearchResults?.labelWithQuery ? messages.SearchResults.labelWithQuery.replace("{term}", displayTerm) : `${displayTerm}の検索結果`} | ${siteConfig.siteName}`
    : tabLabelForTitle
      ? `${tabLabelForTitle} | ${siteConfig.siteName}`
      : `${messages.SearchBrowse?.title ?? "検索"} | ${siteConfig.siteName}`;
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", summary);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: pageTitle,
    description: summary,
    openGraph: {
      title: pageTitle,
      description: summary,
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
      title: pageTitle,
      description: summary,
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
