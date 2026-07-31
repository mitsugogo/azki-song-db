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
  const title = t("title");
  const description = t("description");
  const canonical = new URL("/seichi-map/ranking", baseUrl).toString();

  return {
    ...metadata,
    title: `${title} | ${siteConfig.siteName}`,
    description,
    openGraph: {
      ...metadata.openGraph,
      title,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
