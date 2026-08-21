import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import AcrosticSetlistPageClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Metadata.share", locale });
  const tShare = await getTranslations({
    namespace: "Share.acrosticSetlist",
    locale,
  });
  const title = t("acrosticSetlistTitleWithSite", {
    siteName: siteConfig.siteName,
  });
  const description = tShare("lead");
  const ogTitle = t("acrosticSetlistOgTitle");
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  const pageUrl = new URL("/share/acrostic-setlist", baseUrl);
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
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
          alt: `${ogTitle} - ${siteConfig.siteName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
    alternates: { canonical: pageUrl.toString() },
  };
}

export default function AcrosticSetlistPage() {
  return <AcrosticSetlistPageClient />;
}
