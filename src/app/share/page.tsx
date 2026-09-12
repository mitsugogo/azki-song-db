import type { Metadata } from "next";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import ShareIndexClient from "./client";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Share", locale });
  const tMeta = await getTranslations({ namespace: "Metadata.share", locale });
  const title = t("index.title");
  const pageTitle = `${title} | ${siteConfig.siteName}`;
  const description = tMeta("indexDescription");
  const canonical = new URL("/share", baseUrl).toString();
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImagePath],
    },
    alternates: { canonical },
  };
}

export default function ShareIndexPage() {
  return <ShareIndexClient />;
}
