import type { Metadata } from "next";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";
import { metadata } from "../../layout";
import { pageClasses } from "../../theme";
import SeichiMapRankingBreadcrumb from "./SeichiMapRankingBreadcrumb";
import SeichiMapRankingClient from "./client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "SeichiMapRanking", locale });
  const tMetadata = await getTranslations({
    namespace: "Metadata.seichiMapRanking",
    locale,
  });
  const title = t("title");
  const description = tMetadata("description");
  const pageTitle = `${title} | ${siteConfig.siteName}`;
  const canonical = new URL("/seichi-map/ranking", baseUrl).toString();
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", description);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...metadata,
    title: pageTitle,
    description,
    openGraph: {
      ...metadata.openGraph,
      title: pageTitle,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
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

export default function SeichiMapRankingPage() {
  return (
    <div className={pageClasses.shell}>
      <SeichiMapRankingBreadcrumb />
      <SeichiMapRankingClient />
    </div>
  );
}
