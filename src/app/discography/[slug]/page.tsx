import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Song } from "../../types/song";
import { LuAlbum, LuFolder } from "react-icons/lu";
import slugify from "../../lib/slugify";
import { ROUTE_RANGES } from "../../config/timelineRoutes";
import { VISUAL_CHANGES } from "../../config/timelineVisuals";
import { FaPlay, FaTwitter, FaX, FaYoutube } from "react-icons/fa6";
import { Breadcrumb, BreadcrumbItem } from "flowbite-react";
import { HiHome } from "react-icons/hi";
import { Badge, Button } from "@mantine/core";

const baseUrl =
  process.env.PUBLIC_BASE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://azki-song-db.vercel.app/");

export async function generateStaticParams() {
  const res = await fetch(new URL(`/api/songs`, baseUrl));
  const songs: Song[] = await res.json();

  // オリジナル楽曲（`オリ曲` または `オリ曲MV`）のみを対象にする
  const originals = songs.filter(
    (s) => s.tags && (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")),
  );

  const slugs = new Set<string>();

  originals.forEach((s) => {
    if (s.slug) slugs.add(s.slug);
    else if (s.title) slugs.add(slugify(s.title));
    if (s.album) slugs.add(slugify(s.album));
  });

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const res = await fetch(new URL(`/api/songs`, baseUrl));
  const songs: Song[] = await res.json();
  const slug = decodeURIComponent(resolved.slug);
  // slugify は共通ユーティリティを使用
  // オリジナル楽曲（`オリ曲` または `オリ曲MV`）のみを対象にする
  const originals = songs.filter(
    (s) => s.tags && (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")),
  );
  const matched = originals.find(
    (s) =>
      s.slug === slug ||
      (s.title && slugify(s.title) === slug) ||
      (s.album && slugify(s.album) === slug),
  );
  if (!matched) return { title: slug };
  const title = matched.title
    ? `${matched.title} | ${matched.artist} | Discography | AZKi Song Database`
    : `${matched.album} | ${matched.artist} | Discography | AZKi Song Database`;
  const description =
    matched.extra ?? `${matched.title} - ${matched.artist}の楽曲情報`;

  // OGP 画像生成を移植（app/page.tsx を参考）
  let ogImageUrl = new URL("/api/og", baseUrl);
  const ogTitle = matched.title
    ? `${matched.title} / ${matched.artist}`
    : matched.album
      ? `${matched.album} / ${matched.artist}`
      : "AZKi Song Database";
  const ogSubtitle = matched.extra ?? "AZKi Song Database";

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
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const slug = decodeURIComponent(resolved.slug);
  const res = await fetch(new URL(`/api/songs`, baseUrl));
  const songs: Song[] = await res.json();

  // オリジナル楽曲（`オリ曲` または `オリ曲MV`）のみを対象にする
  const originals = songs.filter(
    (s) => s.tags && (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")),
  );
  // slugify は共通ユーティリティを使用

  const matched = originals.filter(
    (s) =>
      s.slug === slug ||
      (s.title && slugify(s.title) === slug) ||
      (s.album && slugify(s.album) === slug),
  );
  if (!matched || matched.length === 0) {
    notFound();
  }

  const first = matched[0];

  // 発売日からルートと衣装を特定する
  const toYMD = (d?: string | null) => {
    if (!d) return null;
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch (e) {
      return null;
    }
  };

  const releaseYMD = toYMD(first.album_release_at);

  const matchedRoute =
    releaseYMD && ROUTE_RANGES
      ? ROUTE_RANGES.find(
          (r) => r.from <= releaseYMD && (r.to === null || releaseYMD <= r.to),
        ) || null
      : null;

  const matchedVisual =
    releaseYMD && VISUAL_CHANGES
      ? VISUAL_CHANGES.find(
          (v) => v.from <= releaseYMD && (v.to === null || releaseYMD <= v.to),
        ) || null
      : null;

  // 関連動画: 同一アルバムの別動画を優先し、なければ同タイトルの別動画を候補とする。
  // 重複（同一video_id）は排除して最大8件取得する。
  const relatedAlbum = songs.filter(
    (s: Song) =>
      s.album &&
      first.album &&
      s.album === first.album &&
      s.video_id &&
      s.video_id !== first.video_id,
  );

  const relatedSameTitle = songs.filter(
    (s: Song) =>
      s.title &&
      first.title &&
      s.title === first.title &&
      s.video_id &&
      s.video_id !== first.video_id &&
      s.tags.includes("歌枠"),
  );

  return (
    <div className="p-6 w-full 2xl:max-w-7xl mx-auto">
      <Breadcrumb aria-label="Breadcrumb" className="mb-3">
        <BreadcrumbItem href="/">
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </BreadcrumbItem>
        <BreadcrumbItem href="/discography">楽曲一覧</BreadcrumbItem>
        {first.album && (
          <BreadcrumbItem
            href={`/discography/?album=${encodeURIComponent(first.album)}`}
          >
            {first.album}
          </BreadcrumbItem>
        )}
        <BreadcrumbItem>
          {first.title ? first.title : first.album}
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="col-span-1">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img
              src={`https://i.ytimg.com/vi/${first.video_id}/maxresdefault.jpg`}
              alt={first.video_title}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="col-span-2">
          {first.album && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <LuFolder className="inline mr-1" />{" "}
              <Link
                href={`/discography/?album=${encodeURIComponent(first.album)}`}
              >
                {first.album}
              </Link>
            </p>
          )}
          <h1 className="text-3xl font-extrabold mb-2">{first.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {first.artist}
          </p>

          {first.lyricist && <p className="text-sm">作詞: {first.lyricist}</p>}
          {first.composer && <p className="text-sm">作曲: {first.composer}</p>}
          {first.arranger && <p className="text-sm">編曲: {first.arranger}</p>}

          {first.album_release_at && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              発売日: {new Date(first.album_release_at).toLocaleDateString()}
            </p>
          )}

          <div className="mt-4 space-y-3">
            <div>
              <a
                href={`https://www.youtube.com/watch?v=${first.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-red-600 text-white py-2 px-4 rounded-md"
              >
                <FaYoutube className="inline mr-1 -mt-1" /> YouTube
              </a>
              <Link
                href={
                  first.album
                    ? `/?q=album:${first.album}&v=${first.video_id}&t=${first.start}s`
                    : `/?q=video_id:${first.video_id}&v=${first.video_id}&t=${first.start}s`
                }
                className="inline-block ml-3 bg-primary-600 text-white py-2 px-4 rounded-md"
              >
                <FaPlay className="inline mr-1 -mt-1" /> 再生
              </Link>

              {/** シェアボタン */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `${first.title} - ${first.artist} \nhttps://${process.env.PUBLIC_BASE_URL ? process.env.PUBLIC_BASE_URL : "azki-song-db.vercel.app"}/discography/${encodeURIComponent(
                    first.slug
                      ? first.slug
                      : `${first.album}/${encodeURIComponent(first.title)}`,
                  )}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block ml-3 bg-sky-600 text-white py-2 px-4 rounded-md"
              >
                <FaX className="inline mr-1 -mt-1" /> シェア
              </a>
            </div>

            <div className="mt-6">
              {/** 発売日からルートと衣装を特定 */}
              {matchedRoute && <Badge color="gray">{matchedRoute.label}</Badge>}
              {matchedVisual && (
                <Badge className="ml-2" color="gray">
                  {matchedVisual.label}
                </Badge>
              )}
              {first.extra && (
                <div className="mt-1 whitespace-pre-wrap">
                  {first.extra
                    .split(/(\bhttps?:\/\/[^\s]+|\n)/g)
                    .map((part, index) =>
                      part.match(/^https?:\/\//) ? (
                        <a
                          key={index}
                          href={part}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline"
                        >
                          {part}
                        </a>
                      ) : part === "\n" ? (
                        <br key={index} />
                      ) : (
                        <span key={index}>{part}</span>
                      ),
                    )}
                </div>
              )}
            </div>

            <div>
              {/** YouTubeの動画をiframeで配置 */}
              <div className="aspect-w-16 aspect-h-9 mt-3">
                <iframe
                  src={`https://www.youtube.com/embed/${first.video_id}`}
                  title={first.video_title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full max-w-2xl aspect-video shadow-lg"
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
                      new Map(
                        relatedAlbum.map((s) => [s.video_id, s]),
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
                                href={`/?q=video_id:${s.video_id}&v=${s.video_id}&t=${s.start}s`}
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
                              {s.artist}
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
                                href={`/?q=video_id:${s.video_id}&v=${s.video_id}&t=${s.start}s`}
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
          </div>
        </div>
      </div>
    </div>
  );
}
