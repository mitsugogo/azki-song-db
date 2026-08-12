"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  isCollaborationSong,
  isCoverSong,
  isOverallSong,
  isPossibleOriginalSong,
} from "@/app/config/filters";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { useGlobalPlayer } from "@/app/hook/useGlobalPlayer";
import { formatDate } from "@/app/lib/formatDate";
import slugify from "@/app/lib/slugify";
import { LuPlay } from "react-icons/lu";
import type { Song } from "@/app/types/song";
import { useLocale, useTranslations } from "next-intl";
import ReleaseVariantSwitcher from "./ReleaseVariantSwitcher";
import type { StatisticsItem } from "../createStatistics";
import {
  findReleaseVariantByInstanceKey,
  getSongInstanceKey,
  groupReleaseVariants,
  isArtTrack,
} from "../utils/releaseVariants";
import { normalizeSongTitle } from "../utils/normalizeSongTitle";
import { getDiscographyRepresentativeYear } from "../utils/representativeDate";
import { getAlbumThumbnailSong } from "../utils/albumThumbnail";

type DiscographySongListProps = {
  data: StatisticsItem[];
  groupByAlbum: boolean;
  groupByYear: boolean;
  visibleItems: boolean[];
};

function getSongHref(song: Song) {
  const slug = song.slugv2 || song.slug || slugify(song.title);
  if (!slug) return null;

  const category = isCollaborationSong(song)
    ? "collab"
    : isPossibleOriginalSong(song)
      ? "originals"
      : isOverallSong(song)
        ? "overall"
        : isCoverSong(song)
          ? "covers"
          : null;

  return category
    ? `/discography/${category}/${encodeURIComponent(slug)}`
    : null;
}

function DiscographySongListItem({
  item,
  isVisible,
  groupByAlbum,
}: {
  item: StatisticsItem;
  isVisible: boolean;
  groupByAlbum: boolean;
}) {
  const t = useTranslations("Discography");
  const locale = useLocale();
  const { setCurrentSong, setCurrentTime, setIsMinimized, setIsPlaying } =
    useGlobalPlayer();
  const [selectedVariantKeys, setSelectedVariantKeys] = useState<
    Record<string, string>
  >({});
  const isAlbum =
    groupByAlbum && item.isAlbum && Boolean(item.firstVideo.album);
  const title = isAlbum
    ? item.firstVideo.album
    : normalizeSongTitle(item.firstVideo.title, item.firstVideo.artist);
  const date = isAlbum
    ? item.firstVideo.album_release_at
    : item.firstVideo.broadcast_at;
  const trackGroups = groupReleaseVariants(
    [...item.videos].sort(
      (left, right) =>
        (left.source_order ?? Number.MAX_SAFE_INTEGER) -
        (right.source_order ?? Number.MAX_SAFE_INTEGER),
    ),
  );
  const thumbnailSong = isAlbum
    ? getAlbumThumbnailSong(item.videos, item.firstVideo)
    : item.firstVideo;
  const usesAlbumArtwork = isAlbum && isArtTrack(thumbnailSong);
  const headingHref = isAlbum
    ? `/discography/album/${encodeURIComponent(slugify(item.firstVideo.album))}`
    : getSongHref(item.firstVideo);

  return (
    <article
      className={`overflow-hidden rounded-sm border border-light-gray-100 bg-white/85 shadow-sm transition-all duration-500 dark:border-white/10 dark:bg-gray-900/50 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div className="flex flex-col gap-4 p-3 sm:flex-row sm:p-4">
        {headingHref ? (
          <Link
            href={headingHref}
            aria-label={title}
            className={`block w-full shrink-0 overflow-hidden rounded-md bg-gray-100 sm:w-52 lg:w-64 dark:bg-gray-800 ${
              usesAlbumArtwork ? "self-start" : ""
            }`}
          >
            <YoutubeThumbnail
              videoId={thumbnailSong.video_id}
              alt={title}
              outcontainerClassName="bg-gray-100 dark:bg-gray-800"
              imageClassName="object-contain"
              objectFit={usesAlbumArtwork ? "cover" : "contain"}
              objectPosition={usesAlbumArtwork ? "top" : undefined}
              aspectRatio={usesAlbumArtwork ? "square" : "video"}
            />
          </Link>
        ) : (
          <div
            className={`w-full shrink-0 overflow-hidden rounded-md bg-gray-100 sm:w-52 lg:w-64 dark:bg-gray-800 ${
              usesAlbumArtwork ? "self-start" : ""
            }`}
          >
            <YoutubeThumbnail
              videoId={thumbnailSong.video_id}
              alt={title}
              outcontainerClassName="bg-gray-100 dark:bg-gray-800"
              imageClassName="object-contain"
              objectFit={usesAlbumArtwork ? "cover" : "contain"}
              objectPosition={usesAlbumArtwork ? "top" : undefined}
              aspectRatio={usesAlbumArtwork ? "square" : "video"}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {headingHref ? (
            <Link
              href={headingHref}
              className="block text-lg font-bold leading-snug text-gray-950 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 sm:text-xl"
            >
              {title}
            </Link>
          ) : (
            <h2 className="text-lg font-bold leading-snug text-gray-950 dark:text-white sm:text-xl">
              {title}
            </h2>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-light-gray-500">
            {item.firstVideo.artist} · {formatDate(date, locale)} ·{" "}
            {t("tracksCount", { count: trackGroups.length })}
          </p>

          <ol className="mt-3 overflow-hidden text-sm dark:border-white/10">
            {trackGroups.map((group, index) => {
              const track =
                findReleaseVariantByInstanceKey(
                  group.variants,
                  selectedVariantKeys[group.key] ?? null,
                ) ?? group.representative;
              const trackHref = getSongHref(track);
              const trackTitle = normalizeSongTitle(track.title, track.artist);
              const subtitle =
                track.sing && track.sing !== track.artist
                  ? track.sing
                  : track.artist;
              const rowClassName =
                "grid min-w-0 flex-1 grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-2 px-3 py-1.5 transition-colors sm:grid-cols-[2.5rem_minmax(0,1fr)]";
              const rowContent = (
                <>
                  <span className="text-right tabular-nums text-gray-400 dark:text-light-gray-500">
                    {index + 1}
                  </span>
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {trackTitle}
                    </span>
                    {subtitle && (
                      <span className="ml-2 text-gray-500 dark:text-light-gray-500">
                        [{subtitle}]
                      </span>
                    )}
                  </span>
                </>
              );

              return (
                <li
                  key={group.key}
                  className="odd:bg-light-gray-100 dark:odd:bg-gray-800"
                >
                  <div className="flex min-w-0 items-center">
                    {track.video_uri.trim() ? (
                      <button
                        type="button"
                        aria-label={t("buttons.play")}
                        className="ml-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary-600 transition-colors hover:bg-primary-100 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-950/50 dark:hover:text-primary-300"
                        onClick={() => {
                          setCurrentSong(track);
                          setCurrentTime(Number(track.start));
                          setIsMinimized(true);
                          setIsPlaying(true);
                        }}
                      >
                        <LuPlay aria-hidden="true" className="size-4" />
                      </button>
                    ) : (
                      <span className="ml-1 inline-block size-7 shrink-0" />
                    )}
                    {trackHref ? (
                      <Link
                        href={trackHref}
                        className={`${rowClassName} hover:bg-primary-50 dark:hover:bg-primary-950/30`}
                      >
                        {rowContent}
                      </Link>
                    ) : (
                      <div className={rowClassName}>{rowContent}</div>
                    )}
                    <ReleaseVariantSwitcher
                      variants={group.variants}
                      value={getSongInstanceKey(track)}
                      onChange={(value) => {
                        setSelectedVariantKeys((current) => ({
                          ...current,
                          [group.key]: value,
                        }));
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </article>
  );
}

export default function DiscographySongList({
  data,
  groupByAlbum,
  groupByYear,
  visibleItems,
}: DiscographySongListProps) {
  const t = useTranslations("Discography");
  const groups = groupByYear
    ? data.reduce((map, item, index) => {
        const year = getDiscographyRepresentativeYear(
          item.firstVideo,
          groupByAlbum,
        );
        const key = year === null ? t("unknownYear") : String(year);
        const items = map.get(key) ?? [];
        items.push({ item, index });
        map.set(key, items);
        return map;
      }, new Map<string, Array<{ item: StatisticsItem; index: number }>>())
    : new Map([["", data.map((item, index) => ({ item, index }))]]);

  return (
    <div className="space-y-5">
      {Array.from(groups.entries())
        .sort(([left], [right]) => Number(right) - Number(left))
        .map(([year, items]) => (
          <section key={year || "all"} className="space-y-3">
            {groupByYear && (
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("yearHeader", {
                    year,
                    count: items.reduce((sum, { item }) => sum + item.count, 0),
                  })}
                </h2>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
            )}
            {items.map(({ item, index }) => (
              <DiscographySongListItem
                key={`${item.key}-${index}`}
                item={item}
                isVisible={visibleItems[index] || false}
                groupByAlbum={groupByAlbum}
              />
            ))}
          </section>
        ))}
    </div>
  );
}
