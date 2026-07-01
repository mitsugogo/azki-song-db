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
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import ClientPage from "./ClientPage";
import { chooseReleaseRepresentative } from "../../utils/releaseVariants";

export async function generateStaticParams() {
  let songs: Song[] = [];

  try {
    songs = await fetchSongsFromApiCached();
  } catch (error) {
    console.warn(
      "Skipping static param generation for discography song pages during build.",
      error,
    );
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
  const songs: Song[] = await fetchSongsFromApiCached({ locale });
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
  const matchedForMeta = chooseReleaseRepresentative(metadataCandidates);
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
