"use client";

import { Link } from "@/i18n/navigation";
import { Song } from "../../../types/song";
import { LuFolder } from "react-icons/lu";
import slugify from "../../../lib/slugify";
import { findRouteForRelease } from "../../../config/timelineRoutes";
import { findVisualForRelease } from "../../../config/timelineVisuals";
import { FaPlay, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Badge, LoadingOverlay, Modal } from "@mantine/core";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../../../lib/formatDate";
import { renderLinkedText } from "../../../lib/textLinkify";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "../../../config/filters";
import useSongs from "../../../hook/useSongs";
import ViewStat from "./viewStat";
import { getCollabUnitName } from "@/app/config/collabUnits";
import DiscographyBreadcrumbs from "../../components/DiscographyBreadcrumbs";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";

export default function ClientPage({
  category,
  slug,
}: {
  category: string;
  slug: string;
}) {
  const t = useTranslations("Discography");
  const locale = useLocale();
  const tLabels = useTranslations("labels");
  const { allSongs, isLoading } = useSongs();
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);

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
        <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
        <p className="text-sm text-gray-600">{t("notFoundDescription")}</p>
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

  const isCover = isCoverSong(song);

  // 現在のページのURL
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="p-6 w-full mx-auto h-full overflow-y-auto">
      <DiscographyBreadcrumbs
        items={[
          {
            label:
              category === "originals"
                ? t("originalsLabel")
                : category === "covers"
                  ? t("coversLabel")
                  : t("unitLabel"),
            href: `/discography/${encodeURIComponent(category)}`,
          },
          ...(song.album
            ? [
                {
                  label: (
                    <>
                      <LuFolder className="inline mr-1" /> {song.album}
                    </>
                  ),
                  href: `/discography/album/${encodeURIComponent(slugify(song.album))}`,
                },
              ]
            : []),
          {
            label: song.title
              ? isCover
                ? `${song.title} - ${song.artist}`
                : song.title
              : song.album,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="col-span-1">
          <div
            className="overflow-hidden shadow-lg cursor-zoom-in"
            onClick={() => setThumbnailModalOpen(true)}
            title={t("thumbnailClickTitle")}
          >
            <YoutubeThumbnail
              videoId={song.video_id}
              className="w-full h-auto object-cover"
              alt={song.video_title}
            />
          </div>
          <Modal
            opened={thumbnailModalOpen}
            onClose={() => setThumbnailModalOpen(false)}
            title={song.video_title}
            fullScreen
            centered
          >
            <YoutubeThumbnail
              videoId={song.video_id}
              className="w-full h-auto"
              alt={song.video_title}
            />
          </Modal>
        </div>

        <div className="col-span-2">
          {song.album && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <LuFolder className="inline mr-1" />{" "}
              <Link
                href={`/discography/album/${encodeURIComponent(slugify(song.album))}`}
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
              発売日: {formatDate(song.album_release_at, "ja")}
            </p>
          )}
          {!song.album_release_at && song.broadcast_at && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              配信日: {formatDate(song.broadcast_at, "ja")}
            </p>
          )}

          <div className="mt-4">
            <a
              href={`https://www.youtube.com/watch?v=${song.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red-600 text-white py-2 px-4 rounded-md"
            >
              <FaYoutube className="inline mr-1 -mt-1" />{" "}
              {t("buttons.watchOnYouTube")}
            </a>
            <Link
              href={
                song.album
                  ? `/watch?q=album:${song.album}&v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}` : ""}`
                  : `/watch?v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}` : ""}`
              }
              className="inline-block ml-3 bg-primary-600 text-white py-2 px-4 rounded-md"
            >
              <FaPlay className="inline mr-1 -mt-1" /> {t("buttons.play")}
            </Link>

            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(`${song.title} - ${song.artist} \n${currentUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block ml-3 bg-sky-600 text-white py-2 px-4 rounded-md"
            >
              <FaXTwitter className="inline mr-1 -mt-1" /> {t("buttons.share")}
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
                <h2 className="text-lg font-semibold mb-2">
                  {t("relatedVideos")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from(
                    new Map(relatedAlbum.map((s) => [s.video_id, s])).values(),
                  ).map((s) => {
                    const internalHref = s.slugv2
                      ? `/discography/${category}/${encodeURIComponent(s.slugv2)}`
                      : s.title
                        ? `/discography/${category}/${encodeURIComponent(slugify(s.title))}`
                        : "#";
                    return (
                      <div
                        key={s.video_id}
                        className="flex items-center gap-3 rounded-md overflow-hidden bg-gray-50/20 dark:bg-gray-800 p-2"
                      >
                        <div className="w-28 h-16 overflow-hidden rounded">
                          <YoutubeThumbnail
                            videoId={s.video_id}
                            alt={s.video_title}
                            fill={false}
                            className="w-full h-full"
                            imageClassName="object-cover"
                          />
                        </div>
                        <div className="text-sm flex-1">
                          <div className="font-medium">
                            <Link href={internalHref}>{s.title}</Link>
                          </div>
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
                              href={`/watch?q=video_id:${s.video_id}&v=${s.video_id}${Number(s.start) > 0 ? `&t=${s.start}` : ""}`}
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
                  {t("relatedStreamsTitle", { count: relatedSameTitle.length })}
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
                        <div className="w-28 h-16 overflow-hidden rounded">
                          <YoutubeThumbnail
                            videoId={s.video_id}
                            alt={s.video_title}
                            fill={false}
                            className="w-full h-full"
                            imageClassName="object-cover"
                          />
                        </div>
                        <div className="text-sm flex-1">
                          <div className="font-medium">{s.video_title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {formatDate(s.broadcast_at, locale)} 配信
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
                              href={`/watch?q=video_id:${s.video_id}&v=${s.video_id}${Number(s.start) > 0 ? `&t=${s.start}` : ""}`}
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
