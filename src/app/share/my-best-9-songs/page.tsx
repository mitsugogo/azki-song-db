import type { Metadata } from "next";
import MyBestNineSongsPageClient from "./client";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

type Props = {
  searchParams: Promise<{ title?: string | string[] }>;
};

const getTitle = (titleParam?: string | null) => {
  if (titleParam) {
    return `お題:「${titleParam}」 | 究極の9曲ジェネレーター | ${siteConfig.siteName}`;
  }
  return `究極の9曲ジェネレーター | ${siteConfig.siteName}`;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const rawTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const normalizedTitle = rawTitle?.trim().slice(0, 50) || null;
  const pageTitle = getTitle(normalizedTitle);

  const ogTitle = normalizedTitle
    ? `お題:「${normalizedTitle}」`
    : "究極の9曲ジェネレーター";
  const ogDescription = "AZKiさんの楽曲で究極の9曲を作成して共有しましょう！";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", "究極の9曲ジェネレーター");
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  const pageUrl = new URL("/share/my-best-9-songs", baseUrl);
  if (normalizedTitle) {
    pageUrl.searchParams.set("title", normalizedTitle);
  }

  return {
    title: pageTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: pageUrl.toString(),
      type: "website",
      siteName: siteConfig.siteName,
      locale: "ja_JP",
      images: [
        {
          url: ogImageUrl.toString(),
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
      images: [ogImageUrl.toString()],
    },
  };
}

export default function MyBestNineSongsPage() {
  return <MyBestNineSongsPageClient />;
}
