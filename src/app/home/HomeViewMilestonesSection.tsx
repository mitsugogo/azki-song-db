"use client";

import { Skeleton } from "@mantine/core";
import { useIntersection } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { memo, useEffect, useMemo, useState } from "react";
import { LuArrowRight } from "react-icons/lu";
import { Link } from "../../i18n/navigation";
import useReleaseViewCounts from "../hook/useReleaseViewCounts";
import { useStatistics } from "../hook/useStatistics";
import { buildViewMilestoneInfo } from "../lib/viewMilestone";
import SongCountOverview from "../statistics/SongCountOverview";
import type { Song } from "../types/song";
import type { StatisticsItem } from "../types/statisticsItem";

type HomeViewMilestonesSectionProps = {
  isSongsLoading: boolean;
  songs: Song[];
};

export const HomeViewMilestonesSection = memo(
  function HomeViewMilestonesSection({
    isSongsLoading,
    songs,
  }: HomeViewMilestonesSectionProps) {
    const t = useTranslations("Home");
    const tDrawer = useTranslations("DrawerMenu");
    const tStatistics = useTranslations("Statistics");
    const [shouldLoadStatistics, setShouldLoadStatistics] = useState(false);
    const { ref, entry } = useIntersection<HTMLElement>({
      rootMargin: "320px 0px",
      threshold: 0,
    });
    const statistics = useStatistics({ songs });
    const { data: viewStatisticsByVideoId, loading: isViewStatisticsLoading } =
      useReleaseViewCounts("7d", shouldLoadStatistics);

    useEffect(() => {
      if (entry?.isIntersecting) {
        setShouldLoadStatistics(true);
      }
    }, [entry?.isIntersecting]);

    const milestoneStatistics = useMemo(() => {
      const attachMilestone = (items: StatisticsItem[]) =>
        items.map((item) => {
          const statVideoId =
            item.song?.video_id ||
            item.firstVideo?.video_id ||
            item.lastVideo?.video_id ||
            "";
          const history = viewStatisticsByVideoId[statVideoId] || [];
          const latestHistoryViewCount =
            history[history.length - 1]?.viewCount ?? 0;
          const songViewCount = Number(item.song?.view_count ?? 0);
          const effectiveViewCount =
            songViewCount > 0 ? songViewCount : latestHistoryViewCount;

          return {
            ...item,
            statVideoId,
            effectiveViewCount,
            viewMilestone: buildViewMilestoneInfo(effectiveViewCount, history),
          };
        });

      return [
        ...attachMilestone(statistics.originalSongCountsByReleaseDate),
        ...attachMilestone(statistics.coverSongCountsByReleaseDate),
      ];
    }, [statistics, viewStatisticsByVideoId]);

    if (isSongsLoading) {
      return null;
    }

    return (
      <section ref={ref} className="mt-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              {t("viewMilestonesLabel")}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {t("viewMilestonesTitle")}
            </h2>
          </div>
          <Link
            href="/statistics?tab=originalSongCountsByReleaseDate"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
          >
            {tDrawer("statistics")}
            <LuArrowRight className="shrink-0" />
          </Link>
        </div>

        {!shouldLoadStatistics || isViewStatisticsLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`view-milestone-skeleton-${index}`}
                className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-gray-900/40 dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                aria-hidden="true"
              >
                <Skeleton height={14} width="35%" radius="sm" />
                <div className="mt-3 space-y-3">
                  {Array.from({ length: 3 }).map((__, itemIndex) => (
                    <div
                      key={`view-milestone-skeleton-row-${index}-${itemIndex}`}
                      className="flex items-start gap-2"
                    >
                      <Skeleton
                        height={36}
                        width={64}
                        radius="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <Skeleton height={14} radius="sm" />
                        <Skeleton
                          height={12}
                          width="70%"
                          radius="sm"
                          className="mt-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SongCountOverview
            items={milestoneStatistics}
            primaryLabel={tStatistics(
              "overview.originalSongCountsByReleaseDate.primaryLabel",
            )}
            totalCountLabel={tStatistics(
              "overview.originalSongCountsByReleaseDate.totalCountLabel",
            )}
            topLabel=""
            countUnit={tStatistics(
              "overview.originalSongCountsByReleaseDate.countUnit",
            )}
            showMilestoneHighlights
            showTopTile={false}
            className="pt-0"
          />
        )}
      </section>
    );
  },
);
