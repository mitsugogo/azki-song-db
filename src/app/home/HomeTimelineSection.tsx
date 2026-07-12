"use client";

import { Badge, Skeleton, Text } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { BsGeoAlt } from "react-icons/bs";
import { FaExternalLinkAlt } from "react-icons/fa";
import { LuArrowRight } from "react-icons/lu";
import { Link } from "../../i18n/navigation";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import type { MilestoneItem } from "../hook/useMilestones";
import { formatDate } from "../lib/formatDate";
import {
  buildMilestoneSearchHref,
  computeNextIsoForAnniversary,
  formatAnniversaryName,
  getDaysUntil,
  getFeaturedAnniversaries,
  getTodayTimelineMilestones,
} from "../lib/highlights";
import { buildWatchHref } from "../lib/watchUrl";
import type { AnniversaryItem } from "../types/anniversaryItem";
import type { Song } from "../types/song";

const FEATURED_ANNIVERSARIES_WINDOW_DAYS = 35;

type HomeTimelineSectionProps = {
  anniversaries: AnniversaryItem[];
  isAnniversariesLoading: boolean;
  isMilestonesLoading: boolean;
  isSongsLoading: boolean;
  milestones: MilestoneItem[];
  songs: Song[];
};

export const HomeTimelineSection = memo(function HomeTimelineSection({
  anniversaries,
  isAnniversariesLoading,
  isMilestonesLoading,
  isSongsLoading,
  milestones,
  songs,
}: HomeTimelineSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const tAnniversaries = useTranslations("Anniversaries");
  const tSummary = useTranslations("Summary");
  const featuredAnniversaries = useMemo(
    () =>
      getFeaturedAnniversaries(
        anniversaries,
        FEATURED_ANNIVERSARIES_WINDOW_DAYS,
      ),
    [anniversaries],
  );
  const todayMilestones = useMemo(
    () => getTodayTimelineMilestones(songs, milestones),
    [milestones, songs],
  );

  return (
    <div className="mt-16 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          {t("timelineLabel")}
        </p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {t("timelineTitle")}
        </h3>
      </div>
      <section>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {t("anniversariesTitle")}
              </h2>
              <Link
                href="/anniversaries"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
              >
                {t("viewAnniversaries")}
                <LuArrowRight className="shrink-0" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {isAnniversariesLoading ? (
                <div
                  className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                  aria-hidden="true"
                >
                  <Skeleton height={16} radius="sm" />
                  <Skeleton height={12} radius="sm" className="mt-2" />
                  <Skeleton
                    height={12}
                    width="55%"
                    radius="sm"
                    className="mt-2"
                  />
                </div>
              ) : featuredAnniversaries.length > 0 ? (
                featuredAnniversaries.map((item, index) => {
                  const nextIso = computeNextIsoForAnniversary(item);
                  const daysUntil = nextIso ? getDaysUntil(nextIso) : null;

                  return (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Text size="xs" c="dimmed">
                              {nextIso ? formatDate(nextIso, locale) : "-"}
                            </Text>
                            {daysUntil !== null ? (
                              <Badge
                                color="pink"
                                size="md"
                                radius="lg"
                                variant="outline"
                              >
                                {daysUntil === 0
                                  ? tAnniversaries("featuredTodayTitle")
                                  : tAnniversaries("daysUntil", {
                                      days: daysUntil,
                                    })}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                            {formatAnniversaryName(item, locale)}
                          </p>
                          {item.note ? (
                            <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-100">
                              {item.note}
                            </p>
                          ) : null}
                        </div>
                        {item.url ? (
                          <Link
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:text-pink-100"
                          >
                            <FaExternalLinkAlt className="text-[0.65rem]" />
                            {t("linkLabel")}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  {tAnniversaries("empty")}
                </p>
              )}
            </div>
          </section>

          {isSongsLoading ||
          isMilestonesLoading ||
          todayMilestones.length > 0 ? (
            <section className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {tSummary("todayMilestonesTitle")}
                </h2>
                <Link
                  href="/activity"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
                >
                  {t("viewSummary")}
                  <LuArrowRight className="shrink-0" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {isSongsLoading || isMilestonesLoading ? (
                  <div
                    className="rounded-xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                    aria-hidden="true"
                  >
                    <Skeleton height={12} width="25%" radius="sm" />
                    <Skeleton height={16} radius="sm" className="mt-2" />
                    <Skeleton
                      height={12}
                      width="65%"
                      radius="sm"
                      className="mt-2"
                    />
                  </div>
                ) : (
                  todayMilestones.map((milestone, index) => {
                    const milestoneContent = milestone.is_external ? (
                      milestone.url ? (
                        <Link
                          href={milestone.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:text-primary-700 dark:text-pink-200"
                        >
                          {milestone.text}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {milestone.text}
                        </span>
                      )
                    ) : (
                      <Link
                        href={buildMilestoneSearchHref(milestone.text)}
                        className="font-semibold text-primary hover:text-primary-700 dark:text-pink-200"
                      >
                        {milestone.text}
                      </Link>
                    );

                    return (
                      <div
                        key={`${milestone.date.toISOString()}-${milestone.text}-${index}`}
                        className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                      >
                        <Text size="xs" c="dimmed">
                          {formatDate(milestone.date, locale)}
                        </Text>
                        <div className="mt-1 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                          {milestoneContent}
                        </div>
                        {milestone.place ? (
                          <Text size="xs" c="dimmed" className="mt-1">
                            <BsGeoAlt className="-mt-0.5 mr-1 inline" />
                            {milestone.place_url ? (
                              <Link
                                href={milestone.place_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {milestone.place}
                              </Link>
                            ) : (
                              milestone.place
                            )}
                          </Text>
                        ) : null}
                        {milestone.note ? (
                          <Text
                            size="xs"
                            c="dimmed"
                            className="mt-1 whitespace-pre-line"
                          >
                            {milestone.note}
                          </Text>
                        ) : null}

                        {milestone.song ? (
                          <div className="mt-1 flex items-center gap-3">
                            <div className="relative aspect-video w-21 shrink-0 overflow-hidden rounded-md bg-black">
                              <YoutubeThumbnail
                                videoId={milestone.song.video_id}
                                alt={milestone.song.video_title}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                <Link
                                  href={buildWatchHref({
                                    videoId: milestone.song.video_id,
                                    start: milestone.song.start,
                                  })}
                                  className="text-primary hover:text-primary-600 dark:hover:text-pink-300"
                                >
                                  {milestone.song.video_title}
                                </Link>
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {formatDate(
                                  milestone.song.broadcast_at,
                                  locale,
                                )}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
});
