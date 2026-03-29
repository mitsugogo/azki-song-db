import type { Metadata } from "next";
import { metadata } from "../layout";
import SummaryPageClient from "./page.client";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.summary",
    locale,
  });
  const title = tMeta("title");
  const subtitle = tMeta("description");

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const canonical = new URL("/summary", baseUrl).toString();
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
  const activityStart = new Date(2018, 10, 15);
  const now = new Date();
  const activityDays =
    Math.floor(
      (now.getTime() - activityStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const avtivityDurationStr = (() => {
    let years = now.getFullYear() - activityStart.getFullYear();
    let months = now.getMonth() - activityStart.getMonth();
    let days = now.getDate() - activityStart.getDate();

    // 日がマイナスになった場合、1ヶ月分戻して日数を調整
    if (days < 0) {
      months -= 1;
      // 前月の末日を取得して、足りない日数を足す
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      days += previousMonthEnd.getDate();
    }

    // 月がマイナスになった場合、1年分戻して月数を調整
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    let result = "";
    if (years > 0) {
      result += `${years}年`;
    }
    result += `${months}ヶ月`;
    result += `${days}日`;
    return result;
  })();

  return <SummaryPageClient />;
}
