import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Song } from "../../../types/song";
import { LuFolder } from "react-icons/lu";
import slugify from "../../../lib/slugify";
import { findRouteForRelease } from "../../../config/timelineRoutes";
import { findVisualForRelease } from "../../../config/timelineVisuals";
import { FaPlay, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Breadcrumb, BreadcrumbItem } from "flowbite-react";
import { HiHome } from "react-icons/hi";
import { Badge } from "@mantine/core";
import { renderLinkedText } from "@/app/lib/textLinkify";

import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import ViewStat from "./viewStat";

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

  // OGP 画像生成を移植（app/page.tsx を参考）
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
  const songs: Song[] = await fetchSongsFromApi();

  let filteredSongs = [];
  switch (category) {
    case "collabo":
    case "collaborations":
      filteredSongs = songs.filter((s) => isCollaborationSong(s));
      break;
    case "covers":
      filteredSongs = songs.filter((s) => isCoverSong(s));
      break;
    case "originals":
    default:
      filteredSongs = songs.filter((s) => isPossibleOriginalSong(s));
      break;
  }

  const matched = filteredSongs.filter(
    (s) =>
      s.slug === slug ||
      s.slugv2 === slug ||
      (s.album && slugify(s.album) === slug),
  );

  console.log("filteredSongs", matched);
  if (!matched || matched.length === 0) {
    notFound();
  }
  const includeMVTagged = matched.some((s) =>
    s.tags?.some((t) => t.includes("MV")),
  );
  const song =
    matched.length > 1
      ? includeMVTagged
        ? matched.find((s) => s.tags?.some((t) => t.includes("MV")))
        : matched[0]
      : matched[0];

  console.log(matched.find((s) => s.tags?.some((t) => t.includes("MV"))));
  if (!song) {
    notFound();
  }

  // 発売日からルートと衣装を特定する
  const toYMD = (d?: string | null) => {
    if (!d) return null;
    const s = String(d);

    // 時刻・タイムゾーン情報を含む場合は UTC としてパースし、JST(+9h) に変換して日付を決定する
    const hasTime = /T|\d{2}:\d{2}:\d{2}|Z|[+-]\d{2}:?\d{2}/.test(s);
    if (hasTime) {
      try {
        const dt = new Date(s);
        if (isNaN(dt.getTime())) return null;
        // JST に変換
        const jst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
        const y = jst.getFullYear();
        const mo = String(jst.getMonth() + 1).padStart(2, "0");
        const da = String(jst.getDate()).padStart(2, "0");
        return `${y}-${mo}-${da}`;
      } catch (e) {
        // fallthrough to date-only parsing
      }
    }

    // 日付部分を直接抽出（YYYY-MM-DD や YYYY/MM/DD）
    const m = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) {
      const y = m[1];
      const mo = String(Number(m[2])).padStart(2, "0");
      const da = String(Number(m[3])).padStart(2, "0");
      return `${y}-${mo}-${da}`;
    }

    try {
      const dt = new Date(s);
      if (isNaN(dt.getTime())) return null;
      const y = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, "0");
      const da = String(dt.getDate()).padStart(2, "0");
      return `${y}-${mo}-${da}`;
    } catch (e) {
      return null;
    }
  };

  // ルート判定
  const matchedRoute = findRouteForRelease(song.album_release_at);

  // 衣装判定
  const matchedVisual = findVisualForRelease(song.album_release_at);

  // 関連動画: 同一アルバムの別動画を優先し、なければ同タイトルの別動画を候補とする。
  // 重複（同一video_id）は排除して最大8件取得する。
  const relatedAlbum = songs.filter(
    (s: Song) =>
      s.album &&
      song.album &&
      s.album === song.album &&
      s.video_id &&
      s.video_id !== song.video_id,
  );

  const relatedSameTitle = songs.filter(
    (s: Song) =>
      s.title &&
      song.title &&
      s.title === song.title &&
      s.video_id &&
      s.video_id !== song.video_id &&
      s.tags.includes("歌枠"),
  );

  return (
    <div className="p-6 w-full 2xl:max-w-7xl mx-auto">
      <Breadcrumb aria-label="Breadcrumb" className="mb-3">
        <BreadcrumbItem href="/">
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </BreadcrumbItem>
        <BreadcrumbItem href="/discography">楽曲一覧</BreadcrumbItem>
        <BreadcrumbItem
          href={`/discography/?category=${encodeURIComponent(category)}`}
        >
          {category === "originals"
            ? "オリジナル"
            : category === "covers"
              ? "カバー"
              : "コラボ"}{" "}
        </BreadcrumbItem>
        {song.album && (
          <BreadcrumbItem
            href={`/discography/?album=${encodeURIComponent(song.album)}`}
          >
            {song.album}
          </BreadcrumbItem>
        )}
        <BreadcrumbItem>{song.title ? song.title : song.album}</BreadcrumbItem>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="col-span-1">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img
              src={`https://i.ytimg.com/vi/${song.video_id}/maxresdefault.jpg`}
              alt={song.title}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="col-span-2">
          {song.album && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <LuFolder className="inline mr-1" />{" "}
              <Link
                href={`/discography/?album=${encodeURIComponent(song.album)}`}
              >
                {song.album}
              </Link>
            </p>
          )}
          <h1 className="text-3xl font-extrabold mb-2">{song.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {song.artist}
          </p>

          {song.lyricist && (
            <p className="text-sm">
              作詞:{" "}
              <Link
                href={`/search?q=lyricist:${encodeURIComponent(song.lyricist)}`}
                className="hover:underline text-primary dark:text-primary-300"
              >
                {song.lyricist}
              </Link>
            </p>
          )}
          {song.composer && (
            <p className="text-sm">
              作曲:{" "}
              <Link
                href={`/search?q=composer:${encodeURIComponent(song.composer)}`}
                className="hover:underline text-primary dark:text-primary-300"
              >
                {song.composer}
              </Link>
            </p>
          )}
          {song.arranger && (
            <p className="text-sm">
              編曲:{" "}
              <Link
                href={`/search?q=arranger:${encodeURIComponent(song.arranger)}`}
                className="hover:underline text-primary dark:text-primary-300"
              >
                {song.arranger}
              </Link>
            </p>
          )}

          {song.album_release_at && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              発売日:{" "}
              {new Date(song.album_release_at).toLocaleDateString("ja-JP")}
            </p>
          )}

          <div className="mt-4">
            <a
              href={`https://www.youtube.com/watch?v=${song.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red-600 text-white py-2 px-4 rounded-md"
            >
              <FaYoutube className="inline mr-1 -mt-1" /> YouTube
            </a>
            <Link
              href={
                song.album
                  ? `/?q=album:${song.album}&v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}s` : ""}`
                  : `/?q=video_id:${song.video_id}&v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}s` : ""}`
              }
              className="inline-block ml-3 bg-primary-600 text-white py-2 px-4 rounded-md"
            >
              <FaPlay className="inline mr-1 -mt-1" /> 再生
            </Link>

            {/** シェアボタン */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `${song.title} - ${song.artist} \nhttps://${process.env.PUBLIC_BASE_URL ? process.env.PUBLIC_BASE_URL : "azki-song-db.vercel.app"}/discography/${encodeURIComponent(
                  song.slug
                    ? song.slug
                    : `${song.album}/${encodeURIComponent(song.title)}`,
                )}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block ml-3 bg-sky-600 text-white py-2 px-4 rounded-md"
            >
              <FaXTwitter className="inline mr-1 -mt-1" /> シェア
            </a>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 space-y-3">
          <div className="mt-2">
            {/** 発売日からルートと衣装を特定 */}
            {matchedRoute && <Badge color="gray">{matchedRoute.label}</Badge>}
            {matchedVisual && (
              <Badge className="ml-2" color="gray">
                {matchedVisual.label}
              </Badge>
            )}
            {song.extra && (
              <div className="mt-1 whitespace-pre-wrap">
                {renderLinkedText(song.extra)}
              </div>
            )}
          </div>

          <div>
            {/** YouTubeの動画をiframeで配置 */}
            <div className="aspect-w-16 aspect-h-9 mt-3">
              <iframe
                src={`https://www.youtube.com/embed/${song.video_id}`}
                title={song.video_title}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full max-w-3xl aspect-video"
              ></iframe>
            </div>
          </div>

          <div>
            {/* 関連動画 */}
            {relatedAlbum && relatedAlbum.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-2">関連動画</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from(
                    new Map(relatedAlbum.map((s) => [s.video_id, s])).values(),
                  ).map((s) => {
                    const internalHref = s.slug
                      ? `/discography/${encodeURIComponent(s.slug)}`
                      : s.title
                        ? `/discography/${encodeURIComponent(slugify(s.title))}`
                        : "#";
                    return (
                      <div
                        key={s.video_id}
                        className="flex items-center gap-3 rounded-md overflow-hidden bg-gray-50/20 dark:bg-gray-800 p-2"
                      >
                        <img
                          src={`https://i.ytimg.com/vi/${s.video_id}/mqdefault.jpg`}
                          className="w-28 h-16 object-cover rounded"
                          alt={s.video_title}
                        />
                        <div className="text-sm flex-1">
                          <div className="font-medium">{s.video_title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {s.artist} - {s.sing}
                          </div>
                          <div className="mt-2 space-x-2">
                            <a
                              href={`https://www.youtube.com/watch?v=${s.video_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block bg-red-600 text-white py-1 px-3 rounded-md text-xs"
                            >
                              <FaYoutube className="inline mr-1 -mt-1" />{" "}
                              YouTube
                            </a>
                            <Link
                              href={`/?q=video_id:${s.video_id}&v=${s.video_id}${Number(s.start) > 0 ? `&t=${s.start}s` : ""}`}
                              className="inline-block ml-1 bg-primary-600 text-white py-1 px-3 rounded-md text-xs"
                            >
                              <FaPlay className="inline mr-1 -mt-1" /> 再生
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* この曲を歌った歌枠 */}
            {relatedSameTitle && relatedSameTitle.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-2 mt-4">
                  この曲を歌った歌枠
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Array.from(
                    new Map(
                      relatedSameTitle.map((s) => [s.video_id, s]),
                    ).values(),
                  ).map((s) => {
                    const internalHref = s.slug
                      ? `/discography/${encodeURIComponent(s.slug)}`
                      : s.title
                        ? `/discography/${encodeURIComponent(slugify(s.title))}`
                        : "#";
                    return (
                      <div
                        key={s.video_id}
                        className="flex items-center gap-2 rounded-md overflow-hidden bg-gray-50/20 dark:bg-gray-800 p-2"
                      >
                        <img
                          src={`https://i.ytimg.com/vi/${s.video_id}/mqdefault.jpg`}
                          className="w-28 h-16 object-cover rounded"
                          alt={s.video_title}
                        />
                        <div className="text-sm flex-1">
                          <div className="font-medium">{s.video_title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {new Date(s.broadcast_at).toLocaleDateString()} 配信
                          </div>
                          <div className="mt-2 space-x-2">
                            <a
                              href={`https://www.youtube.com/watch?v=${s.video_id}${Number(s.start) > 0 ? `&t=${s.start}s` : ""}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block bg-red-600 text-white py-1 px-3 rounded-md text-xs"
                            >
                              <FaYoutube className="inline mr-1 -mt-1" />{" "}
                              YouTube
                            </a>
                            <Link
                              href={`/?q=video_id:${s.video_id}&v=${s.video_id}${Number(s.start) > 0 ? `&t=${s.start}s` : ""}`}
                              className="inline-block ml-1 bg-primary-600 text-white py-1 px-3 rounded-md text-xs"
                            >
                              <FaPlay className="inline mr-1 -mt-1" /> 再生
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 動画の統計情報 */}
          <div className="pt-6">
            <ViewStat videoId={song.video_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
