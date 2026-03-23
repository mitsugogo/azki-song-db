import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import PlaylistDetailPage from "./client";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.playlist",
    locale,
  });
  const title = tMeta("title") ?? "プレイリスト";
  const subtitle =
    tMeta("description") ?? "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const canonical = new URL("/playlist/detail", baseUrl).toString();
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: `${title} | ${siteConfig.siteName}`,
    description: subtitle,
    openGraph: {
      title,
      description: subtitle,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
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
