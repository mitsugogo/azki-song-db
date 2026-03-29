import StatisticsPage from "./client";

import type { Metadata } from "next";
import { metadata } from "../layout";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getTranslations, getLocale } from "next-intl/server";
import StatisticsBreadcrumb from "./StatisticsBreadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Statistics.page");
  const title = t("title");
  const subtitle = t("description");

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const canonical = new URL("/statistics", baseUrl).toString();
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...metadata,
    title: `${title} | ${siteConfig.siteName}`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
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

export default async function Page() {
  return (
    <div className="grow p-2 lg:p-6 lg:pb-10">
      <StatisticsBreadcrumb />
      <StatisticsPage />
    </div>
  );
}
