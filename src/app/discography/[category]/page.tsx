import { notFound, redirect } from "next/navigation";
import slugify from "../../lib/slugify";
import { Song } from "../../types/song";
import { siteConfig } from "@/app/config/siteConfig";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import CategoryClient from "./client";

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
      // 一時的な失敗は次の候補へ
    }
  }

  try {
    const res = await fetch(new URL(`/api/songs`, siteConfig.siteUrl));
    if (res.ok) return (await res.json()) as Song[];
  } catch (e) {
    // ignore
  }

  throw new Error("Failed to fetch songs from any known base URL");
}

export default async function CategoryOrLegacyRedirect({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolved = await params;
  const possibleSlug = decodeURIComponent(resolved.category || "");
  const lower = possibleSlug.toLowerCase();

  // path ベースのカテゴリ要求であれば Discography のクライアントをレンダリング
  const originals = new Set(["originals", "original", "ori"]);
  const collabs = new Set(["collab", "collabo", "collaboration", "unit"]);
  const covers = new Set(["covers", "cover"]);

  if (originals.has(lower) || lower.includes("original")) {
    return <CategoryClient category="originals" />;
  }

  if (
    collabs.has(lower) ||
    lower.includes("collab") ||
    lower.includes("unit")
  ) {
    return <CategoryClient category="collab" />;
  }

  if (covers.has(lower) || lower.includes("cover")) {
    return <CategoryClient category="covers" />;
  }
  const songs: Song[] = await fetchSongsFromApi();

  let filteredSongs = songs.filter(
    (s) =>
      isCollaborationSong(s) || isCoverSong(s) || isPossibleOriginalSong(s),
  );

  // 旧URL の場合、category に slug(v1) が入っていることがあるため判定してリダイレクト
  const possibleSong = filteredSongs.find(
    (s) =>
      s.slug === possibleSlug ||
      s.slugv2 === possibleSlug ||
      (s.title && slugify(s.title) === possibleSlug) ||
      (s.album && slugify(s.album) === possibleSlug),
  );

  if (possibleSong) {
    const targetCategory = isPossibleOriginalSong(possibleSong)
      ? "originals"
      : isCollaborationSong(possibleSong)
        ? "collabo"
        : "covers";
    const targetSlug =
      possibleSong.slugv2 ||
      possibleSong.slug ||
      (possibleSong.title ? slugify(possibleSong.title) : "");
    if (!targetSlug) notFound();

    redirect(
      `/discography/${targetCategory}/${encodeURIComponent(targetSlug)}`,
    );
  }

  // 旧スラグでなければカテゴリ一覧ページ（404 相当）を表示
  notFound();
}
