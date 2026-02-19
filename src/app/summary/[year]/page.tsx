import type { Metadata } from "next";
import { metadata } from "../../layout";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

type Props = {
  params: Promise<{ year: string }>;
};

// Pre-render all available year pages so `generateMetadata` receives a concrete
// `params.year` during static generation.
export async function generateStaticParams() {
  try {
    const res = await fetch(`${baseUrl}/api/songs`, { cache: "no-store" });
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
  // incoming params

  // `params` may be a Promise in Next.js dynamic API handlers — await it before
  // accessing its properties to avoid the runtime error shown in dev logs.
  const resolvedParams = (await (params as unknown)) as
    | { year?: string | string[] }
    | undefined;

  // resolved params processed

  const rawYearParam = String(resolvedParams?.year ?? "");
  // If params.year is an array (shouldn't be for [year], but handle defensively)
  const paramStr = Array.isArray(resolvedParams?.year)
    ? resolvedParams.year.join("/")
    : rawYearParam;

  // Decode and normalize (also convert fullwidth digits to ASCII)
  const decoded = decodeURIComponent(String(paramStr)).trim();
  const normalized = decoded.replace(/[\uFF10-\uFF19]/g, (c) =>
    String(c.charCodeAt(0) - 0xff10),
  );

  // Try to extract a 4-digit year first, then fallback to any digit sequence
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

  const hasValidYear = Number.isFinite(yearNum) && !Number.isNaN(yearNum);
  const titleBase = hasValidYear
    ? `AZKiさんの${yearNum}年の歌の活動`
    : `まとめ`;

  const subtitle = hasValidYear
    ? `${yearNum}年の歌枠・カバー/オリ曲など歌に関連した活動をまとめました`
    : `AZKiさんの歌の活動まとめ`;

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", titleBase);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: `${titleBase} | ${siteConfig.siteName}`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

import YearSummaryClient from "./YearSummaryClient";
import { Breadcrumb, BreadcrumbItem } from "flowbite-react";
import { FaHome } from "react-icons/fa";

export default async function Page({ params }: Props) {
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
  const res = await fetch(`${baseUrl}/api/songs`, { cache: "no-store" });
  const songs = (await res.json()) as any[];

  const songsOfYear = Number.isNaN(yearNum)
    ? []
    : songs.filter((s) => Number(s.year) === yearNum);

  const displayYearServer = Number.isFinite(yearNum)
    ? yearNum
    : songsOfYear[0]
      ? Number(songsOfYear[0].year)
      : null;

  return (
    <div className="flex-grow p-2 lg:p-6 lg:pb-0 overflow-auto">
      <div className="mb-4">
        <Breadcrumb aria-label="Breadcrumb" className="mb-3">
          <BreadcrumbItem href="/">
            <FaHome className="inline mr-1" /> Home
          </BreadcrumbItem>
          <BreadcrumbItem href="/summary">活動記録</BreadcrumbItem>
          <BreadcrumbItem href={`/summary/${rawYearParam}`}>
            {displayYearServer ? `${displayYearServer}年` : `詳細`}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h1 className="font-extrabold text-2xl">
          {displayYearServer ? `${displayYearServer}年` : `まとめ`}
        </h1>
      </div>

      <YearSummaryClient
        initialSongs={songsOfYear}
        year={Number.isNaN(yearNum) ? NaN : yearNum}
        displayYearServer={displayYearServer}
      />
    </div>
  );
}
