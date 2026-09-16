"use client";

import { Button, Progress, Skeleton, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FaYoutube } from "react-icons/fa";
import { FaChartBar } from "react-icons/fa6";
import { HiPlay } from "react-icons/hi";
import { fetchJsonDedup } from "@/app/lib/fetchDedup";
import { formatDate } from "@/app/lib/formatDate";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import {
  buildViewMilestoneAchievements,
  getNextViewMilestoneTarget,
} from "@/app/lib/viewMilestones";
import type { ViewCountStat } from "@/app/types/api/stat/views";

export type UnitAchievementWork = {
  title: string;
  videoId: string;
  youtubeHref: string;
  databaseHref: string;
  statsHref?: string;
  currentViewCount: number;
  publishedAt: string;
};

type StatisticsResponse = {
  statistics: Record<string, ViewCountStat[]>;
};

export default function UnitAchievements({
  works,
}: {
  works: UnitAchievementWork[];
}) {
  const t = useTranslations("Units");
  const locale = useLocale();
  const [statistics, setStatistics] = useState<Record<string, ViewCountStat[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(works.length > 0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (works.length === 0) return;
    let active = true;
    const ids = [...new Set(works.map((work) => work.videoId))];
    const endpoint = `/api/stat/views?videoIds=${encodeURIComponent(ids.join(","))}&period=all`;
    fetchJsonDedup<StatisticsResponse>(endpoint)
      .then(({ data }) => {
        if (active) setStatistics(data?.statistics ?? {});
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [works]);

  const cards = useMemo(
    () =>
      works
        .map((work) => {
          const history = statistics[work.videoId] ?? [];
          const historyLatest = history.at(-1)?.viewCount ?? 0;
          const currentViewCount = Math.max(
            work.currentViewCount,
            historyLatest,
          );
          return {
            ...work,
            currentViewCount,
            history,
            achievements: buildViewMilestoneAchievements(
              history,
              currentViewCount,
            ),
            nextTarget: getNextViewMilestoneTarget(currentViewCount),
          };
        })
        .filter((work) => work.currentViewCount > 0 || work.history.length > 0)
        .sort((a, b) => b.currentViewCount - a.currentViewCount),
    [statistics, works],
  );
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);

  return (
    <section aria-labelledby="unit-achievements-title" className="mt-12">
      <h2
        id="unit-achievements-title"
        className="text-xl font-bold text-gray-900 dark:text-gray-100"
      >
        {t("achievementsTitle")}
      </h2>
      <Text c="dimmed" size="sm" className="mt-1">
        {t("achievementsDescription")}
      </Text>
      {isLoading ? (
        <div className="mt-5 space-y-5">
          {Array.from({ length: Math.min(works.length, 4) }, (_, index) => (
            <Skeleton key={index} height={280} radius="md" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Text
          c="dimmed"
          size="sm"
          className="mt-5 rounded-md border border-dashed border-gray-300 p-5 dark:border-gray-700"
        >
          {t("achievementsEmpty")}
        </Text>
      ) : (
        <>
          <div className="mt-5 space-y-5">
            {(showAll ? cards : cards.slice(0, 4)).map((work) => {
              const progress = Math.min(
                100,
                (work.currentViewCount / work.nextTarget) * 100,
              );
              return (
                <article
                  key={work.videoId}
                  className="overflow-hidden rounded-2xl border border-primary/10 bg-white dark:border-white/25 dark:bg-gray-900"
                >
                  <div className="grid md:grid-cols-[minmax(18rem,40%)_minmax(0,1fr)]">
                    <Link
                      href={work.youtubeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block overflow-hidden bg-black md:h-full"
                    >
                      <YoutubeThumbnail
                        videoId={work.videoId}
                        alt={work.title}
                        imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </Link>
                    <div className="min-w-0 p-5 sm:p-6">
                      <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                        <Link
                          href={work.youtubeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-primary"
                        >
                          {work.title}
                        </Link>
                      </h3>
                      <Text c="dimmed" size="xs" className="mt-1">
                        {formatDate(work.publishedAt, locale, {
                          timeZone: "Asia/Tokyo",
                        })}{" "}
                        · {t("published")}
                      </Text>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          component={Link}
                          href={work.youtubeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="red"
                          variant="subtle"
                          size="xs"
                          leftSection={<FaYoutube className="h-4 w-4" />}
                        >
                          YouTube
                        </Button>
                        <Button
                          component={Link}
                          href={work.databaseHref}
                          variant="subtle"
                          size="xs"
                          leftSection={<HiPlay className="h-4 w-4" />}
                        >
                          {t("playInDatabase")}
                        </Button>
                        {work.statsHref ? (
                          <Button
                            component={Link}
                            href={work.statsHref}
                            variant="subtle"
                            size="xs"
                            leftSection={<FaChartBar className="h-4 w-4" />}
                          >
                            {t("viewStats")}
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-5 border-t border-gray-200 pt-5 dark:border-gray-800">
                        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                          <div>
                            <Text c="dimmed" size="xs" fw={600}>
                              {t("currentViews")}
                            </Text>
                            <p className="mt-0.5 text-3xl font-black tracking-tight tabular-nums text-gray-950 dark:text-white">
                              {number(work.currentViewCount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Text c="dimmed" size="xs">
                              {t("viewsRemaining", {
                                count: number(
                                  work.nextTarget - work.currentViewCount,
                                ),
                              })}
                            </Text>
                            <p className="mt-0.5 font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                              {number(work.nextTarget)} views
                            </p>
                          </div>
                        </div>
                        <Progress
                          value={progress}
                          color="azki"
                          size="sm"
                          radius="xl"
                          mt="md"
                          aria-label={t("achievementProgress", {
                            title: work.title,
                          })}
                        />
                      </div>

                      {work.achievements.length > 0 && (
                        <ol className="mt-4 flex flex-wrap gap-2">
                          {work.achievements.map((achievement) => (
                            <Text
                              component="li"
                              key={achievement.targetCount}
                              c="dimmed"
                              size="xs"
                              className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700"
                            >
                              <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                                {number(achievement.targetCount)} views
                              </span>
                              <Text
                                component="time"
                                c="dimmed"
                                size="xs"
                                className="ml-2"
                              >
                                {formatDate(achievement.achievedAt, locale, {
                                  timeZone: "Asia/Tokyo",
                                })}
                              </Text>
                            </Text>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {cards.length > 4 && (
            <div className="mt-5 text-center">
              <Button
                variant="light"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? t("showFeaturedOnly") : t("showAllAchievements")}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
