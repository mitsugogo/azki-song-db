"use client";

import { Skeleton } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { FaPlay } from "react-icons/fa6";
import { Link } from "../../i18n/navigation";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import { formatDate } from "../lib/formatDate";
import { buildWatchHref } from "../lib/watchUrl";
import type { Song } from "../types/song";
import { groupRecentUpdates } from "./homeData";
import { homeHighlightCardClasses } from "./homeHighlightCardStyles";

type HomeLatestVideoSectionProps = {
  isLoading: boolean;
  songs: Song[];
};

export const HomeLatestVideoSection = memo(function HomeLatestVideoSection({
  isLoading,
  songs,
}: HomeLatestVideoSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const latestVideo = useMemo(() => groupRecentUpdates(songs, 1)[0], [songs]);

  if (!isLoading && !latestVideo) {
    return null;
  }

  return (
    <section
      aria-label={t("latestVideoTitle")}
      aria-busy={isLoading}
      className="mx-auto mb-8 w-full max-w-3xl"
    >
      {isLoading ? (
        <Skeleton height={100} radius="xl" />
      ) : latestVideo ? (
        <Link
          href={buildWatchHref({ videoId: latestVideo.videoId })}
          aria-label={t("latestVideoPlay", { title: latestVideo.videoTitle })}
          className={`${homeHighlightCardClasses.card} ${homeHighlightCardClasses.interactive}`}
        >
          <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-black sm:w-28">
            <YoutubeThumbnail
              videoId={latestVideo.videoId}
              alt={latestVideo.videoTitle}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-primary dark:text-pink-200">
              {t("latestVideoTitle")}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
              {latestVideo.videoTitle}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-300">
              <time dateTime={latestVideo.date}>
                {formatDate(latestVideo.date, locale)}
              </time>
              {latestVideo.count > 1 ? (
                <span>
                  {t("latestVideoSongCount", { count: latestVideo.count })}
                </span>
              ) : null}
            </div>
          </div>
          <span className={homeHighlightCardClasses.action}>
            <FaPlay className="size-4" aria-hidden="true" />
          </span>
        </Link>
      ) : null}
    </section>
  );
});
