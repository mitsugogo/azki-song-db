import type { Metadata } from "next";
import MyBestNineSongsPageClient from "./client";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";

type Props = {
  searchParams: Promise<{ title?: string | string[] }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const rawTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const normalizedTitle = rawTitle?.trim().slice(0, 50) || null;
  const locale = await getLocale();
  const tMeta = await getTranslations({ namespace: "Metadata.share", locale });

  const pageTitle = normalizedTitle
    ? `${tMeta("myBest9WithTopic", {
        title: normalizedTitle,
        siteName: siteConfig.siteName,
      })}
    `
    : tMeta("myBest9TitleWithSite", { siteName: siteConfig.siteName });

  const ogTitle = normalizedTitle
    ? tMeta("myBest9OgWithTopic", { title: normalizedTitle })
    : tMeta("myBest9OgTitle");
  const ogDescription = tMeta("myBest9OgDescription");

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", tMeta("myBest9OgTitle"));
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  const pageUrl = new URL("/share/my-best-9-songs", baseUrl);
  if (normalizedTitle) {
    pageUrl.searchParams.set("title", normalizedTitle);
  }
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: pageTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
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
      title: ogTitle,
      description: ogDescription,
      images: [ogImagePath],
    },
    alternates: {
      canonical: pageUrl.toString(),
    },
  };
}

export default function MyBestNineSongsPage() {
  return <MyBestNineSongsPageClient />;
}
