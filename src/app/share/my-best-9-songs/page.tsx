import type { Metadata } from "next";
import MyBestNineSongsPageClient from "./client";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";
import { decodeThemes, buildThemeQuery } from "@/app/lib/myBestNineSongs";
import { loadBestNineTopic } from "@/app/lib/server/bestNineTopics";
import { validTopicId } from "@/app/lib/bestNineTopics";

type Props = {
  searchParams: Promise<{
    title?: string | string[];
    themes?: string | string[];
    topic?: string | string[];
    revision?: string | string[];
    new?: string | string[];
  }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const rawTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  let normalizedTitle = rawTitle?.trim().slice(0, 50) || null;
  const topicId = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  if (validTopicId(topicId)) {
    try {
      normalizedTitle = (await loadBestNineTopic(topicId)).title;
    } catch {
      /* 取得不可時は一般メタデータを表示 */
    }
  }
  const rawThemes = Array.isArray(params.themes)
    ? params.themes[0]
    : params.themes;
  const themes = rawThemes ? decodeThemes(rawThemes) : null;
  const locale = await getLocale();
  const tMeta = await getTranslations({ namespace: "Metadata.share", locale });

  const pageTitle = normalizedTitle
    ? tMeta("myBest9WithTopic", {
        title: normalizedTitle,
        siteName: siteConfig.siteName,
      })
    : tMeta("myBest9TitleWithSite", { siteName: siteConfig.siteName });

  const ogTitle = normalizedTitle
    ? tMeta("myBest9OgWithTopic", { title: normalizedTitle })
    : tMeta("myBest9OgTitle");
  const description = tMeta("myBest9OgDescription");

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  const pageUrl = new URL("/share/my-best-9-songs", baseUrl);
  if (normalizedTitle) {
    pageUrl.search = buildThemeQuery(normalizedTitle, themes ?? undefined);
  }
  if (validTopicId(topicId))
    pageUrl.search = new URLSearchParams({ topic: topicId }).toString();
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url: pageUrl.toString(),
      type: "website",
      siteName: siteConfig.siteName,
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
      description,
      images: [ogImagePath],
    },
    alternates: {
      canonical: pageUrl.toString(),
    },
  };
}

export default async function MyBestNineSongsPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <MyBestNineSongsPageClient
      key={`${params.topic ?? "new"}:${params.revision ?? ""}:${params.new ?? ""}`}
    />
  );
}
