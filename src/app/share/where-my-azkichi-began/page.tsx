import type { Metadata } from "next";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";
import WhereMyAzkichiBeganClient from "@/app/share/where-my-azkichi-began/client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tShare = await getTranslations({ namespace: "Share", locale });
  const tMeta = await getTranslations({ namespace: "Metadata.share", locale });

  const title = tMeta("whereMyAzkichiBeganTitleWithSite", {
    siteName: siteConfig.siteName,
  });
  const description = tMeta("whereMyAzkichiBeganDescription");

  const ogTitle = tMeta("whereMyAzkichiBeganOgTitle");
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set("subtitle", siteConfig.siteName);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  const pageUrl = new URL("/share/where-my-azkichi-began", baseUrl);
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
          alt: `${tShare("features.whereMyAzkichiBegan.title")} - ${siteConfig.siteName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImagePath],
    },
    alternates: {
      canonical: pageUrl.toString(),
    },
  };
}

export default function WhereMyAzkichiBeganPage() {
  return <WhereMyAzkichiBeganClient />;
}
