import Link from "next/link";
import type { Metadata } from "next";
import { metadata } from "../../layout";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ year: string }>;
};

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

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
  // Debug: log incoming params so we can see what value Next is passing here
  try {
    // eslint-disable-next-line no-console
    console.debug("generateMetadata params (raw):", { params });
  } catch (e) {
    // ignore logging errors
  }

  // `params` may be a Promise in Next.js dynamic API handlers — await it before
  // accessing its properties to avoid the runtime error shown in dev logs.
  const resolvedParams = (await (params as unknown)) as
    | { year?: string | string[] }
    | undefined;

  // Debug resolved params
  try {
    // eslint-disable-next-line no-console
    console.debug("generateMetadata params (resolved):", { resolvedParams });
  } catch (e) {
    // ignore
  }

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
    title: `${titleBase} | AZKi Song Database`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

import YearSummaryClient from "./YearSummaryClient";
import React from "react";
import { Anchor, Breadcrumbs } from "@mantine/core";

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
    : songs.filter(
        (s) => Number(s.year) === yearNum && s.sing.includes("AZKi"),
      );

  const displayYearServer = Number.isFinite(yearNum)
    ? yearNum
    : songsOfYear[0]
      ? Number(songsOfYear[0].year)
      : null;

  const breadcrumbItems = [
    {
      title: React.createElement(
        "span",
        null,
        React.createElement("span", { className: "inline-block mr-1" }, "Home"),
      ),
      href: "/",
    },
    { title: "年ごとの活動記録", href: "/summary" },
    { title: displayYearServer ? `${displayYearServer}年` : `詳細` },
  ].map((item, index) => (
    <Anchor href={item.href} key={index}>
      {item.title}
    </Anchor>
  ));

  return (
    <div className="flex-grow p-2 lg:p-6 lg:pb-0 overflow-auto">
      <div className="mb-4">
        <Breadcrumbs separator="›">{breadcrumbItems}</Breadcrumbs>
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
