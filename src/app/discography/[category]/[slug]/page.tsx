import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Song } from "../../../types/song";
import slugify from "../../../lib/slugify";

import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import ClientPage from "./ClientPage";

async function fetchSongsFromApi(locale = "ja"): Promise<Song[]> {
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
      const songsUrl = new URL(`/api/songs`, base);
      songsUrl.searchParams.set("hl", locale);
      const res = await fetch(songsUrl);
      if (res.ok) {
        return (await res.json()) as Song[];
      }
    } catch (e) {
      // 一時的な失敗は次の候補へフォールバック
    }
  }

  // 最後の手段として production を試す
  try {
    const songsUrl = new URL(`/api/songs`, siteConfig.siteUrl);
    songsUrl.searchParams.set("hl", locale);
    const res = await fetch(songsUrl);
    if (res.ok) {
      return (await res.json()) as Song[];
    }
  } catch (e) {
    // ignore
  }

  throw new Error("Failed to fetch songs from any known base URL");
}

export async function generateStaticParams() {
  let songs: Song[] = [];
  try {
    songs = await fetchSongsFromApi();
  } catch (error) {
    console.error("Failed to fetch songs in generateStaticParams:", error);
    return [];
  }

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
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Discography", locale });
  const resolved = await params;
  const songs: Song[] = await fetchSongsFromApi(locale);
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
  const canonical = new URL(
    `/discography/${encodeURIComponent(resolved.category)}/${encodeURIComponent(slug)}`,
    baseUrl,
  ).toString();

  if (!matchedForMeta)
    return {
      title: slug,
      openGraph: {
        title: slug,
        description: siteConfig.siteName,
        url: canonical,
        siteName: siteConfig.siteName,
        locale: locale === "ja" ? "ja_JP" : "en_US",
        type: "website",
      },
      alternates: {
        canonical,
      },
    };
  const title = matchedForMeta.title
    ? `${matchedForMeta.title} | ${matchedForMeta.artist} | Discography | ${siteConfig.siteName}`
    : `${matchedForMeta.album} | ${matchedForMeta.artist} | Discography | ${siteConfig.siteName}`;
  const description =
    matchedForMeta.extra ??
    (matchedForMeta.title
      ? t("entryDescription", {
          title: matchedForMeta.title,
          artist: matchedForMeta.artist,
        })
      : matchedForMeta.album
        ? t("entryDescription", {
            title: matchedForMeta.album,
            artist: matchedForMeta.artist,
          })
        : siteConfig.siteName);

  // OGP 画像生成
  let ogImageUrl = new URL("/api/og/thumb", baseUrl);
  ogImageUrl.searchParams.set("v", matchedForMeta.video_id);
  ogImageUrl.searchParams.set("t", matchedForMeta.start?.toString() ?? "0");
  ogImageUrl.searchParams.set("hl", locale);

  const ogTitle = matchedForMeta.title
    ? `${matchedForMeta.title} / ${matchedForMeta.artist}`
    : matchedForMeta.album
      ? `${matchedForMeta.album} / ${matchedForMeta.artist}`
      : siteConfig.siteName;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
      images: [
        { url: ogImageUrl.toString(), width: 1200, height: 630, alt: ogTitle },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl.toString()],
    },
    alternates: {
      canonical,
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
