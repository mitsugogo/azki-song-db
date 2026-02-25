import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Song } from "../../../types/song";
import slugify from "../../../lib/slugify";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import AlbumClient from "../../[category]/AlbumClient";

type AlbumEntry = {
  album: string;
  slug: string;
  songs: Song[];
  representativeSong: Song;
};

function buildAlbumEntries(songs: Song[]): AlbumEntry[] {
  const grouped = new Map<string, Song[]>();

  for (const song of songs) {
    const album = song.album?.trim();
    if (!album) continue;
    const list = grouped.get(album) ?? [];
    list.push(song);
    grouped.set(album, list);
  }

  const slugCounts = new Map<string, number>();
  const entries: AlbumEntry[] = [];

  for (const album of Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b, "ja"),
  )) {
    const baseSlug = slugify(album) || "album";
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);
    const resolvedSlug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
    const albumSongs = grouped.get(album) ?? [];
    if (albumSongs.length === 0) continue;

    entries.push({
      album,
      slug: resolvedSlug,
      songs: albumSongs,
      representativeSong: albumSongs[0],
    });
  }

  return entries;
}

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

  return buildAlbumEntries(songs).map((entry) => ({
    slug: entry.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const albumSlug = decodeURIComponent(resolved.slug);
  const songs: Song[] = await fetchSongsFromApi();
  const matched = buildAlbumEntries(songs).find(
    (entry) => entry.slug === albumSlug,
  );

  if (!matched) {
    return {
      title: `アルバムが見つかりません | ${siteConfig.siteName}`,
      description: "指定されたアルバムは存在しません。",
    };
  }

  const title = `${matched.album} | Discography | ${siteConfig.siteName}`;
  const description = `${matched.album} の収録曲 ${matched.songs.length} 曲を表示します。`;

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set(
    "title",
    `${matched.album} / ${matched.representativeSong.artist}`,
  );
  ogImageUrl.searchParams.set("subtitle", `${matched.songs.length} tracks`);
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

export default async function DiscographyAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const albumSlug = decodeURIComponent(resolved.slug);
  const songs = await fetchSongsFromApi();
  const matched = buildAlbumEntries(songs).find(
    (entry) => entry.slug === albumSlug,
  );

  if (!matched) {
    notFound();
  }

  return (
    <AlbumClient
      albumName={matched.album}
      coverVideoId={matched.representativeSong.video_id}
    />
  );
}
