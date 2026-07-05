import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { metadata } from "../../../layout";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import {
  formatActivityMonthLabel,
  getActivityMonthHref,
  getAdjacentActivityMonth,
  getCurrentActivityMonth,
  isActivityMonthInRange,
  padMonth,
  type ActivityMonth,
} from "../../monthActivity";
import SummaryMonthClient from "./SummaryMonthClient";

type Props = {
  params: Promise<{ year: string; month: string }>;
};

function normalizeDigits(value: string) {
  return value.replace(/[\uFF10-\uFF19]/g, (char) =>
    String(char.charCodeAt(0) - 0xff10),
  );
}

function parseActivityMonth(
  yearParam: string,
  monthParam: string,
): ActivityMonth | null {
  const normalizedYear = normalizeDigits(decodeURIComponent(yearParam)).trim();
  const normalizedMonth = normalizeDigits(
    decodeURIComponent(monthParam),
  ).trim();

  if (!/^\d{4}$/.test(normalizedYear) || !/^\d{1,2}$/.test(normalizedMonth)) {
    return null;
  }

  const year = Number(normalizedYear);
  const month = Number(normalizedMonth);

  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

export function generateStaticParams() {
  const params: Array<{ year: string; month: string }> = [];
  const current = getCurrentActivityMonth();

  for (let year = 2018; year <= current.year; year += 1) {
    const startMonth = year === 2018 ? 11 : 1;
    const endMonth = year === current.year ? current.month : 12;

    for (let month = startMonth; month <= endMonth; month += 1) {
      params.push({ year: String(year), month: padMonth(month) });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.summary",
    locale,
  });
  const resolvedParams = await params;
  const activityMonth = parseActivityMonth(
    resolvedParams.year,
    resolvedParams.month,
  );

  if (!activityMonth || !isActivityMonthInRange(activityMonth)) {
    return {
      ...metadata,
      title: `${tMeta("title")} | ${siteConfig.siteName}`,
      description: tMeta("description"),
    };
  }

  const monthLabel = formatActivityMonthLabel(activityMonth, locale);
  const title = tMeta("monthTitle", { month: monthLabel });
  const subtitle = tMeta("monthDescription", { month: monthLabel });
  const canonical = new URL(
    getActivityMonthHref(activityMonth),
    baseUrl,
  ).toString();
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
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

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const activityMonth = parseActivityMonth(
    resolvedParams.year,
    resolvedParams.month,
  );

  if (!activityMonth || !isActivityMonthInRange(activityMonth)) {
    notFound();
  }

  const canonicalMonth = padMonth(activityMonth.month);
  if (resolvedParams.month !== canonicalMonth) {
    permanentRedirect(getActivityMonthHref(activityMonth));
  }

  return (
    <SummaryMonthClient
      activityMonth={activityMonth}
      previousMonth={getAdjacentActivityMonth(activityMonth, -1)}
      nextMonth={getAdjacentActivityMonth(activityMonth, 1)}
    />
  );
}
