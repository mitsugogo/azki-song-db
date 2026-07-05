"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, Button } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { FaHome } from "react-icons/fa";
import { HiChevronRight } from "react-icons/hi";
import ActivityTimelineSection from "../../../components/ActivityTimelineSection";
import { ScrollToTopButton } from "../../../components/ScrollToTopButton";
import useActivityTimeline from "../../../hook/useActivityTimeline";
import useChannels from "../../../hook/useChannels";
import useEvents from "../../../hook/useEvents";
import useMilestones from "../../../hook/useMilestones";
import useSongs from "../../../hook/useSongs";
import { breadcrumbClasses, pageClasses } from "../../../theme";
import {
  formatActivityMonthLabel,
  getActivityMonthHref,
  type ActivityMonth,
} from "../../monthActivity";

const MONTH_ACTIVITY_LIMIT = 1000;

type SummaryMonthClientProps = {
  activityMonth: ActivityMonth;
  previousMonth: ActivityMonth | null;
  nextMonth: ActivityMonth | null;
};

export default function SummaryMonthClient({
  activityMonth,
  previousMonth,
  nextMonth,
}: SummaryMonthClientProps) {
  const locale = useLocale();
  const t = useTranslations("Summary");
  const { allSongs, isLoading: isSongsLoading } = useSongs();
  const { items: eventItems, isLoading: isEventsLoading } = useEvents();
  const { items: milestoneItems, isLoading: isMilestonesLoading } =
    useMilestones();
  const { channels } = useChannels();

  const monthLabel = formatActivityMonthLabel(activityMonth, locale);
  const previousMonthLabel = previousMonth
    ? formatActivityMonthLabel(previousMonth, locale)
    : null;
  const nextMonthLabel = nextMonth
    ? formatActivityMonthLabel(nextMonth, locale)
    : null;
  const dateRange = useMemo(
    () => ({
      start: new Date(activityMonth.year, activityMonth.month - 1, 1),
      endExclusive: new Date(activityMonth.year, activityMonth.month, 1),
    }),
    [activityMonth.month, activityMonth.year],
  );

  const {
    items: activityItems,
    isLoading: isActivityLoading,
    isViewMilestonesLoading,
  } = useActivityTimeline({
    songs: allSongs,
    events: eventItems,
    milestones: milestoneItems,
    isSongsLoading,
    isEventsLoading,
    isMilestonesLoading,
    enabled: true,
    limit: MONTH_ACTIVITY_LIMIT,
    songUpdateLimit: MONTH_ACTIVITY_LIMIT,
    archiveLimit: MONTH_ACTIVITY_LIMIT,
    viewMilestonePeriod: "all",
    dateRange,
  });

  const reverseActivityItems = useMemo(
    () => [...activityItems].reverse(),
    [activityItems],
  );

  return (
    <div className={pageClasses.shell}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <FaHome className="inline mr-1" /> {t("homeLabel")}
        </Link>
        <Link href="/activity" className={breadcrumbClasses.link}>
          {t("page.title")}
        </Link>
        <Link
          href={`/activity/${activityMonth.year}`}
          className={breadcrumbClasses.link}
        >
          {activityMonth.year}
          {t("yearSuffix")}
        </Link>
        <Link
          href={getActivityMonthHref(activityMonth)}
          className={breadcrumbClasses.link}
        >
          {monthLabel}
        </Link>
      </Breadcrumbs>

      <div className="mb-4 flex w-full items-center justify-between gap-3">
        {previousMonth && previousMonthLabel ? (
          <Button
            component={Link}
            href={getActivityMonthHref(previousMonth)}
            variant="light"
            size="sm"
            radius="md"
          >
            {t("previousMonth", { month: previousMonthLabel })}
          </Button>
        ) : (
          <div className="h-9 min-w-px" aria-hidden="true" />
        )}

        {/* 年 ジャンプ */}
        <Button
          component={Link}
          href={`/activity/${activityMonth.year}`}
          variant="light"
          size="sm"
          radius="md"
        >
          {t("jumpToYear", { year: activityMonth.year })}
        </Button>

        {nextMonth && nextMonthLabel ? (
          <Button
            component={Link}
            href={getActivityMonthHref(nextMonth)}
            variant="light"
            size="sm"
            radius="md"
          >
            {t("nextMonth", { month: nextMonthLabel })}
          </Button>
        ) : (
          <div className="h-9 min-w-px" aria-hidden="true" />
        )}
      </div>

      <h1 className={pageClasses.heading}>
        {t("monthActivityTitle", { month: monthLabel })}
      </h1>
      <p className="mb-8 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {t("monthActivityDescription", { month: monthLabel })}
      </p>

      <ActivityTimelineSection
        items={reverseActivityItems}
        isLoading={isActivityLoading}
        isViewMilestonesLoading={isViewMilestonesLoading}
        shouldLoadViewStatistics
        channels={channels}
        showTitle={false}
        className="mt-8"
      />
      {/* 翌月 のアクティビティがある場合は、ページ下部にリンクを表示 */}
      {nextMonth && nextMonthLabel && (
        <div className="mt-8">
          <Button
            component={Link}
            href={getActivityMonthHref(nextMonth)}
            variant="light"
            size="sm"
            radius="md"
          >
            {t("nextMonth", { month: nextMonthLabel })}
          </Button>
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
}
