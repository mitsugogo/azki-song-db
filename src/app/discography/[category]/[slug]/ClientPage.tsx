"use client";

import Link from "next/link";
import { Song } from "../../../types/song";
import { LuFolder } from "react-icons/lu";
import slugify from "../../../lib/slugify";
import { findRouteForRelease } from "../../../config/timelineRoutes";
import { findVisualForRelease } from "../../../config/timelineVisuals";
import { FaPlay, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../../../theme";
import { Badge, LoadingOverlay } from "@mantine/core";
import { renderLinkedText } from "../../../lib/textLinkify";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "../../../config/filters";
import useSongs from "../../../hook/useSongs";
import ViewStat from "./viewStat";
import { getCollabUnitName } from "@/app/config/collabUnits";

export default function ClientPage({
  category,
  slug,
}: {
  category: string;
  slug: string;
}) {
  const { allSongs, isLoading } = useSongs();

  if (isLoading) {
    return (
      <div className="p-6 w-full 2xl:max-w-7xl mx-auto">
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  const songs: Song[] = allSongs ?? [];
  const matched = songs.filter(
    (s) =>
      s.slug === slug ||
      s.slugv2 === slug ||
      (s.album && slugify(s.album) === slug),
  );

  if (!matched || matched.length === 0) {
    return (
      <div className="p-6 w-full 2xl:max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">楽曲が見つかりません</h1>
        <p className="text-sm text-gray-600">指定された楽曲は存在しません。</p>
      </div>
    );
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

  if (!song) {
    return (
      <div className="p-6 w-full 2xl:max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">楽曲が見つかりません</h1>
      </div>
    );
  }

  const matchedRoute = findRouteForRelease(
    song.album_release_at || song.broadcast_at,
  );
  const matchedVisual = findVisualForRelease(
    song.album_release_at || song.broadcast_at,
  );

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
      s.video_id !== song.video_id,
  );

  const unitName = getCollabUnitName(song.sing.split("、"));

  return (
    <div className="p-6 w-full  mx-auto">
      <nav aria-label="Breadcrumb" className={breadcrumbClasses.root}>
        <div className="flex items-center">
          <Link href="/" className={breadcrumbClasses.link}>
            <HiHome className="w-4 h-4 mr-1.5" /> Home
          </Link>
          <HiChevronRight className={breadcrumbClasses.separator} />
          <Link href="/discography" className={breadcrumbClasses.link}>
            楽曲一覧
          </Link>
          <HiChevronRight className={breadcrumbClasses.separator} />
          <Link
            href={`/discography/${encodeURIComponent(category)}`}
            className={breadcrumbClasses.link}
          >
            {category === "originals"
              ? "オリジナル楽曲"
              : category === "covers"
                ? "カバー"
                : "コラボ"}
          </Link>
          {song.album && (
            <>
              <HiChevronRight className={breadcrumbClasses.separator} />
              <Link
                href={`/discography/${encodeURIComponent(category)}?album=${encodeURIComponent(
                  song.album,
                )}`}
                className={breadcrumbClasses.link}
              >
                <LuFolder className="inline mr-1" /> {song.album}
              </Link>
            </>
          )}
          <HiChevronRight className={breadcrumbClasses.separator} />
          <span className={breadcrumbClasses.link}>
            {song.title ? song.title : song.album}
          </span>
        </div>
      </nav>

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
                href={`/discography/${encodeURIComponent(category)}?album=${encodeURIComponent(song.album)}`}
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
          {song.sing && song.sing.length > 1 && (
            <p className="text-sm">
              歌:{" "}
              {song.sing.split("、").map((s, idx) => (
                <span key={idx}>
                  <Link
                    href={`/search?q=sing:${encodeURIComponent(s)}`}
                    className="hover:underline text-primary dark:text-primary-300"
                  >
                    {s}
                  </Link>
                  {idx < song.sing.split("、").length - 1 && "、"}
                </span>
              ))}
              {unitName && (
                <>
                  {" "}
                  -{" "}
                  <Badge
                    color="indigo"
                    radius="sm"
                    component="a"
                    href={`/search?q=unit:${encodeURIComponent(unitName)}`}
                    className="cursor-pointer"
                  >
                    {unitName}
                  </Badge>
                </>
              )}
            </p>
          )}
          {song.album_release_at && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              発売日:{" "}
              {new Date(song.album_release_at).toLocaleDateString("ja-JP")}
            </p>
          )}
          {!song.album_release_at && song.broadcast_at && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              配信日: {new Date(song.broadcast_at).toLocaleDateString("ja-JP")}
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
                  : `/?v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}s` : ""}`
              }
              className="inline-block ml-3 bg-primary-600 text-white py-2 px-4 rounded-md"
            >
              <FaPlay className="inline mr-1 -mt-1" /> 再生
            </Link>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${song.title} - ${song.artist} \nhttps://${process.env.PUBLIC_BASE_URL ? process.env.PUBLIC_BASE_URL : "azki-song-db.vercel.app"}/discography/${encodeURIComponent(song.slug ? song.slug : `${song.album}/${encodeURIComponent(song.title)}`)}`)}`}
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
            {matchedRoute && (
              <Badge color="gray" radius="sm">
                {matchedRoute.label}
              </Badge>
            )}
            {matchedVisual && (
              <Badge className="ml-2" color="gray" radius="sm">
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

            {relatedSameTitle && relatedSameTitle.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-2 mt-4">
                  この曲を歌った歌枠 ({relatedSameTitle.length})
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

          <div className="pt-6">
            <ViewStat videoId={song.video_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
