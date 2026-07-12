"use client";

import { Skeleton } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { Link } from "../../i18n/navigation";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import { formatDate } from "../lib/formatDate";
import { buildWatchHref } from "../lib/watchUrl";
import type { Song } from "../types/song";
import { pickRecommendedSongs } from "./homeData";

const RECOMMENDED_SONG_COUNT = 20;
const RECOMMENDED_SKELETON_COUNT = 20;

type HomeRecommendedSongsSectionProps = {
  isLoading: boolean;
  songs: Song[];
};

export const HomeRecommendedSongsSection = memo(
  function HomeRecommendedSongsSection({
    isLoading,
    songs,
  }: HomeRecommendedSongsSectionProps) {
    const locale = useLocale();
    const t = useTranslations("Home");
    const recommendedSongs = useMemo(
      () => pickRecommendedSongs(songs, RECOMMENDED_SONG_COUNT),
      [songs],
    );

    return (
      <>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              {t("recommendedLabel")}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {t("recommendedTitle")}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isLoading
            ? Array.from({ length: RECOMMENDED_SKELETON_COUNT }).map(
                (_, index) => (
                  <div
                    key={`recommended-skeleton-${index}`}
                    className="overflow-hidden rounded-xl border border-white/70 bg-white/85 p-0 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/50 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]"
                    aria-hidden="true"
                  >
                    <Skeleton height="100%" className="aspect-video" />
                    <div className="space-y-2 p-3">
                      <Skeleton height={16} radius="sm" />
                      <Skeleton height={12} width="70%" radius="sm" />
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Skeleton height={10} width="28%" radius="sm" />
                        <Skeleton height={10} width="42%" radius="sm" />
                      </div>
                    </div>
                  </div>
                ),
              )
            : recommendedSongs.map((song) => (
                <Link
                  key={`${song.video_id}-${song.start}-${song.title}`}
                  href={buildWatchHref({
                    videoId: song.video_id,
                    start: song.start,
                  })}
                  className="group overflow-hidden rounded-xl border border-white/70 bg-white/85 shadow-[0_16px_45px_rgba(15,23,42,0.08)] hover-lift-animation hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] dark:hover:border-pink-300/30"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <YoutubeThumbnail
                      videoId={song.video_id}
                      alt={song.title}
                      imageClassName="transition duration-500"
                    />
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                      {song.title}
                    </div>
                    <div className="line-clamp-1 text-xs text-gray-600 dark:text-gray-200">
                      {song.artist}
                    </div>
                    <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-300">
                      <span>{song.year}</span>
                      <span>{formatDate(song.broadcast_at, locale)}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </>
    );
  },
);
