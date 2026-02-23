import type { Metadata } from "next";
import { Song } from "../../../types/song";
import slugify from "../../../lib/slugify";

import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import ClientPage from "./ClientPage";

async function fetchSongsFromApi(): Promise<Song[]> {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.NODE_ENV === "development"
        ? `http://127.0.0.1:${process.env.PORT ?? 3001}`
        : undefined),
  ].filter(Boolean) as string[];

  for (const base of candidates) {
    try {
      const res = await fetch(new URL(`/api/songs`, base));
      if (res.ok) {
        return (await res.json()) as Song[];
      }
    } catch (e) {
      // 一時的な失敗は次の候補へフォールバック
    }
  }

  // 最後の手段として production を試す
  try {
    const res = await fetch(new URL(`/api/songs`, siteConfig.siteUrl));
    if (res.ok) {
      return (await res.json()) as Song[];
    }
  } catch (e) {
    // ignore
  }

  throw new Error("Failed to fetch songs from any known base URL");
}

export async function generateStaticParams() {
  const songs: Song[] = await fetchSongsFromApi();

  // 各楽曲についてカテゴリを決定し、カテゴリ+スラグの組合せで静的パスを生成する
  const paramSet = new Set<string>();

  const getCategory = (s: Song) =>
    isPossibleOriginalSong(s)
      ? "originals"
      : isCollaborationSong(s)
        ? "collaborations"
        : "covers";

  songs.forEach((s) => {
    const category = getCategory(s);
    const candidates: string[] = [];
    if (s.slug) candidates.push(s.slug);
    if (s.title) candidates.push(slugify(s.title));
    if (s.album) candidates.push(slugify(s.album));

    candidates.forEach((slug) => {
      if (!slug) return;
      paramSet.add(`${category}|||${slug}`);
    });
  });

  return Array.from(paramSet).map((entry) => {
    const [category, slug] = entry.split("|||");
    return { category, slug };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug?: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const songs: Song[] = await fetchSongsFromApi();
  const slug = decodeURIComponent(resolved.slug || "");

  const originals = songs.filter(
    (s) =>
      isPossibleOriginalSong(s) || isCollaborationSong(s) || isCoverSong(s),
  );
  const metadataCandidates = originals.filter(
    (s) =>
      s.slug === slug ||
      s.slugv2 === slug ||
      (s.title && slugify(s.title) === slug) ||
      (s.album && slugify(s.album) === slug),
  );
  const matchedForMeta =
    metadataCandidates.length > 1
      ? (metadataCandidates.find((s) =>
          // タグ配列内の要素に "MV" を含むものを優先（部分一致）
          s.tags?.some((t) => t.includes("MV")),
        ) ?? metadataCandidates[0])
      : metadataCandidates[0];
  if (!matchedForMeta) return { title: slug };
  const title = matchedForMeta.title
    ? `${matchedForMeta.title} | ${matchedForMeta.artist} | Discography | ${siteConfig.siteName}`
    : `${matchedForMeta.album} | ${matchedForMeta.artist} | Discography | ${siteConfig.siteName}`;
  const description =
    matchedForMeta.extra ??
    `${matchedForMeta.title} - ${matchedForMeta.artist}の楽曲情報`;

  // OGP 画像生成
  let ogImageUrl = new URL("/api/og", baseUrl);
  const ogTitle = matchedForMeta.title
    ? `${matchedForMeta.title} / ${matchedForMeta.artist}`
    : matchedForMeta.album
      ? `${matchedForMeta.album} / ${matchedForMeta.artist}`
      : siteConfig.siteName;
  const ogSubtitle = matchedForMeta.extra ?? siteConfig.siteName;

  ogImageUrl.searchParams.set("title", ogTitle);
  ogImageUrl.searchParams.set(
    "subtitle",
    Array.from(ogSubtitle).slice(0, 100).join(""),
  );
  ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const resolved = await params;
  const category = decodeURIComponent(resolved.category);
  const slug = decodeURIComponent(resolved.slug);

  return <ClientPage category={category} slug={slug} />;
}
