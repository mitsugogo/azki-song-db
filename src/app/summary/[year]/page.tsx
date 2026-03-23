import type { Metadata } from "next";
import { metadata } from "../../layout";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ year: string }>;
};

export async function generateStaticParams() {
  try {
    const res = await fetch(`${baseUrl}/api/songs?hl=ja`, {
      cache: "no-store",
    });
    const songs = (await res.json()) as any[];
    const years = Array.from(
      new Set(songs.map((s) => Number(s.year)).filter((y) => !Number.isNaN(y))),
    ).sort((a, b) => b - a);

    return years.map((y) => ({ year: String(y) }));
  } catch (e) {
    // If fetching fails, return no params to avoid build breakage
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = (await (params as unknown)) as
    | { year?: string | string[] }
    | undefined;

  const rawYearParam = String(resolvedParams?.year ?? "");
  const paramStr = Array.isArray(resolvedParams?.year)
    ? resolvedParams.year.join("/")
    : rawYearParam;

  const decoded = decodeURIComponent(String(paramStr)).trim();
  const normalized = decoded.replace(/[\uFF10-\uFF19]/g, (c) =>
    String(c.charCodeAt(0) - 0xff10),
  );

  let yearNum = NaN;
  const fourDigit = normalized.match(/(\d{4})/);
  if (fourDigit) {
    yearNum = Number(fourDigit[1]);
  } else {
    const digits = normalized.match(/(\d+)/);
    if (digits) {
      yearNum = Number(digits[1]);
    } else {
      yearNum = Number.parseInt(normalized, 10);
    }
  }

  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.summary",
    locale,
  });

  const hasValidYear = Number.isFinite(yearNum) && !Number.isNaN(yearNum);
  const titleBase = hasValidYear
    ? tMeta("yearTitle", { year: String(yearNum) })
    : tMeta("title");

  const subtitle = hasValidYear
    ? tMeta("yearDescription", { year: String(yearNum) })
    : tMeta("description");

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", titleBase);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const canonical = hasValidYear
    ? new URL(`/summary/${yearNum}`, baseUrl).toString()
    : new URL("/summary", baseUrl).toString();
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...metadata,
    title: `${titleBase} | ${siteConfig.siteName}`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
      title: titleBase,
      description: subtitle,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: titleBase }],
    },
    twitter: {
      card: "summary_large_image",
      title: titleBase,
      description: subtitle,
      images: [ogImagePath],
    },
    alternates: {
      canonical,
    },
  };
}

import YearSummaryClient from "./YearSummaryClient";
import SummaryYearClient from "./SummaryYearClient";

export default async function Page({ params }: Props) {
  const locale = await getLocale();
  const resolvedParams = await params;
  const rawYearParam = resolvedParams.year;

  let yearNum: number = NaN;
  const fourDigitMatch = rawYearParam.match(/(\d{4})/);
  if (fourDigitMatch) {
    yearNum = Number(fourDigitMatch[1]);
  } else {
    // Fallback: remove non-digits and parse, then try a direct parse
    yearNum = parseInt(rawYearParam.replace(/\D/g, ""), 10);
    if (Number.isNaN(yearNum)) {
      yearNum = parseInt(rawYearParam, 10);
    }
  }
  // Fetch songs
  const res = await fetch(
    `${baseUrl}/api/songs?hl=${encodeURIComponent(locale)}`,
    {
      cache: "no-store",
    },
  );
  const songs = (await res.json()) as any[];

  const songsOfYear = Number.isNaN(yearNum)
    ? []
    : songs.filter((s) => Number(s.year) === yearNum);

  const displayYearServer = Number.isFinite(yearNum)
    ? yearNum
    : songsOfYear[0]
      ? Number(songsOfYear[0].year)
      : null;

  // Render client component for UI translations; metadata remains server-side.
  return (
    <SummaryYearClient
      initialSongs={songsOfYear}
      year={Number.isNaN(yearNum) ? NaN : yearNum}
      displayYearServer={displayYearServer}
      rawYearParam={rawYearParam}
    />
  );
}
