import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import JourneyClient from "./JourneyClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Journey.metadata", locale });
  const title = t("title");
  const description = t("description");
  const canonical = new URL("/journey", baseUrl).toString();
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: `${title} | ${siteConfig.siteName}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
  };
}

export default function JourneyPage() {
  return <JourneyClient />;
}
