"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { Breadcrumbs, LoadingOverlay } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { siteConfig } from "../config/siteConfig";
import useArchives from "../hook/useArchives";
import useChannels from "../hook/useChannels";
import useSongs from "../hook/useSongs";
import {
  createChannelsByParticipantName,
  resolveArchiveParticipants,
} from "../lib/archiveParticipants";
import { breadcrumbClasses, pageClasses } from "../theme";
import ArchiveCategoryRanking from "./ArchiveCategoryRanking";
import ArchiveCollaborationRanking, {
  type ArchiveCollaborationRankingMode,
} from "./ArchiveCollaborationRanking";
import ArchiveContributionHeatmap from "./ArchiveContributionHeatmap";
import ArchiveLongestStreamRanking from "./ArchiveLongestStreamRanking";
import ArchiveMonthlyCalendar from "./ArchiveMonthlyCalendar";
import ArchiveOverviewCards from "./ArchiveOverviewCards";
import ArchiveTimeHeatmap from "./ArchiveTimeHeatmap";
import { formatActivityDuration } from "./archiveActivity";
import {
  createArchiveCollaborationCombinationRanking,
  createArchiveCollaborationRanking,
  createArchiveMembersWithoutCollaboration,
} from "./archiveCollaborationData";
import { getLegacyArchiveListUrl } from "./archiveFilters";
import {
  createArchiveLongestStreamRanking,
  createArchiveStatsSummary,
} from "./archiveStats";
import StreamArchivesNavigation from "./StreamArchivesNavigation";

const getWeekdayLabels = (locale: string) => {
  const formatter = new Intl.DateTimeFormat(
    locale.startsWith("ja") ? "ja-JP" : locale,
    { weekday: "short", timeZone: "UTC" },
  );
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2024, 0, 7 + index))),
  );
};

const formatCompactActivityDuration = (seconds: number) =>
  formatActivityDuration(seconds).replaceAll(" ", "");

export default function ArchiveStatsClient() {
  const t = useTranslations("Archives");
  const locale = useLocale();
  const router = useRouter();
  const { items, isLoading: areArchivesLoading } = useArchives();
  const { channels, isLoading: areChannelsLoading } = useChannels();
  const { allSongs } = useSongs();
  const [selectedActivityYear, setSelectedActivityYear] = useState<
    string | null
  >(null);
  const [selectedCollaborationYear, setSelectedCollaborationYear] = useState<
    string | null
  >(null);
  const [selectedCategoryYear, setSelectedCategoryYear] = useState<
    string | null
  >(null);
  const [selectedLongestStreamYear, setSelectedLongestStreamYear] = useState<
    string | null
  >(null);
  const [selectedTimeHeatmapYear, setSelectedTimeHeatmapYear] = useState<
    string | null
  >(null);
  const [collaborationMode, setCollaborationMode] =
    useState<ArchiveCollaborationRankingMode>("member");
  const [isLegacyRedirecting, setIsLegacyRedirecting] = useState(false);

  useEffect(() => {
    const redirectUrl = getLegacyArchiveListUrl(window.location.href);
    if (!redirectUrl) {
      return;
    }

    setIsLegacyRedirecting(true);
    window.location.replace(redirectUrl);
  }, []);

  const channelsByParticipantName = useMemo(
    () => createChannelsByParticipantName(channels),
    [channels],
  );
  const statsItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        participantEntries: resolveArchiveParticipants(
          item.participants ?? [],
          channelsByParticipantName,
        ),
      })),
    [channelsByParticipantName, items],
  );
  const azkiParticipant = useMemo(
    () =>
      resolveArchiveParticipants(
        [siteConfig.talentName],
        channelsByParticipantName,
      )[0],
    [channelsByParticipantName],
  );
  const summary = useMemo(
    () =>
      createArchiveStatsSummary(statsItems, locale, {
        uncategorizedLabel: t("uncategorized"),
      }),
    [locale, statsItems, t],
  );
  const categorySummary = useMemo(
    () =>
      selectedCategoryYear
        ? createArchiveStatsSummary(summary.items, locale, {
            uncategorizedLabel: t("uncategorized"),
            year: Number(selectedCategoryYear),
          })
        : summary,
    [locale, selectedCategoryYear, summary, t],
  );
  const timeHeatmapSummary = useMemo(
    () =>
      selectedTimeHeatmapYear
        ? createArchiveStatsSummary(summary.items, locale, {
            uncategorizedLabel: t("uncategorized"),
            year: Number(selectedTimeHeatmapYear),
          })
        : summary,
    [locale, selectedTimeHeatmapYear, summary, t],
  );
  const longestStreams = useMemo(
    () =>
      createArchiveLongestStreamRanking(
        summary.items,
        selectedLongestStreamYear,
        locale,
      ),
    [locale, selectedLongestStreamYear, summary.items],
  );
  const collaborationRanking = useMemo(() => {
    if (collaborationMode === "combination") {
      return createArchiveCollaborationCombinationRanking(
        summary.items,
        selectedCollaborationYear,
        locale,
        azkiParticipant,
      );
    }

    return createArchiveCollaborationRanking(
      summary.items,
      selectedCollaborationYear,
      locale,
    );
  }, [
    azkiParticipant,
    collaborationMode,
    locale,
    selectedCollaborationYear,
    summary.items,
  ]);
  const membersWithoutCollaboration = useMemo(
    () =>
      createArchiveMembersWithoutCollaboration(summary.items, channels, locale),
    [channels, locale, summary.items],
  );
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);

  useEffect(() => {
    if (summary.activity.years.length === 0) {
      setSelectedActivityYear(null);
      return;
    }

    setSelectedActivityYear((current) =>
      current && summary.activity.years.includes(Number(current))
        ? current
        : String(summary.activity.latestYear ?? summary.activity.years[0]),
    );
  }, [summary.activity]);

  const handleActivityDateClick = useCallback(
    (dateKey: string) => {
      router.push(
        `/stream-archives/list?from=${encodeURIComponent(dateKey)}&to=${encodeURIComponent(dateKey)}`,
      );
    },
    [router],
  );

  const isLoading =
    areArchivesLoading || areChannelsLoading || isLegacyRedirecting;

  return (
    <div className={pageClasses.shell}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {t("homeLabel")}
        </Link>
        <span className={breadcrumbClasses.link} aria-current="page">
          {t("breadcrumb")}
        </span>
      </Breadcrumbs>

      <h1 className={pageClasses.heading}>{t("title")}</h1>
      <p className={pageClasses.description}>{t("description")}</p>
      <StreamArchivesNavigation active="stats" />

      <div className="relative min-h-48">
        <LoadingOverlay
          visible={isLoading}
          zIndex={10}
          overlayProps={{ radius: "md", blur: 2 }}
          loaderProps={{ color: "pink", type: "bars" }}
        />

        {!isLoading && summary.streamCount === 0 ? (
          <p className="rounded-xl border border-light-gray-200/50 bg-white/70 p-6 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-900/50 dark:text-gray-300">
            {t("statsNoData")}
          </p>
        ) : (
          <div className="space-y-4">
            <ArchiveOverviewCards
              values={{
                streamCount: t("overviewStreamCountValue", {
                  count: summary.streamCount,
                }),
                totalDuration: formatActivityDuration(
                  summary.totalDurationSeconds,
                ),
                averageDuration: formatActivityDuration(
                  summary.averageDurationSeconds,
                ),
              }}
              labels={{
                streamCount: t("overviewStreamCount"),
                totalDuration: t("overviewTotalDuration"),
                averageDuration: t("overviewAverageDuration"),
              }}
            />

            <ArchiveMonthlyCalendar
              days={summary.calendarDays}
              archives={summary.items}
              latestMonth={summary.latestMonth}
              locale={locale}
              songs={allSongs}
              channels={channels}
              labels={{
                title: t("monthlyCalendarTitle"),
                subtitle: t("monthlyCalendarSubtitle"),
                monthLabel: t("monthlyCalendarMonthLabel"),
                previousMonth: t("monthlyCalendarPreviousMonth"),
                nextMonth: t("monthlyCalendarNextMonth"),
                empty: t("statsNoData"),
              }}
            />

            <ArchiveContributionHeatmap
              summary={summary.activity}
              selectedYear={selectedActivityYear}
              locale={locale}
              labels={{
                title: t("activityLabel"),
                totalDuration: (duration) =>
                  t("activityTotalDuration", { duration }),
                yearLabel: t("activityYearLabel"),
                legendLess: t("activityLegendLess"),
                legendMore: t("activityLegendMore"),
                cellLabel: (date, duration, count) =>
                  t("activityCellLabel", { date, duration, count }),
                emptyCellLabel: (date) => t("activityEmptyCellLabel", { date }),
                noData: t("activityNoData"),
              }}
              onSelectedYearChange={setSelectedActivityYear}
              onDateClick={handleActivityDateClick}
            />

            <div className="grid items-stretch gap-4 xl:grid-cols-3">
              <ArchiveCollaborationRanking
                items={collaborationRanking}
                membersWithoutCollaboration={membersWithoutCollaboration}
                years={summary.activity.years}
                selectedYear={selectedCollaborationYear}
                mode={collaborationMode}
                formatDuration={formatCompactActivityDuration}
                labels={{
                  title: t("collaborationRankingTitle"),
                  subtitle: t("collaborationRankingSubtitle"),
                  count: (count) => t("collaborationCount", { count }),
                  itemLabel: (rank, name, count) =>
                    t("collaborationRankingItemLabel", { rank, name, count }),
                  noData: t("collaborationRankingNoData"),
                  allTimeOptionLabel: t("collaborationRankingAllTime"),
                  yearSelectAriaLabel: t("activityYearLabel"),
                  modeSwitchAriaLabel: t(
                    "collaborationRankingModeSwitchAriaLabel",
                  ),
                  memberModeLabel: t("collaborationRankingMemberMode"),
                  combinationModeLabel: t(
                    "collaborationRankingCombinationMode",
                  ),
                  noCollaboration: t("collaborationNoHistory"),
                }}
                onSelectedYearChange={setSelectedCollaborationYear}
                onModeChange={setCollaborationMode}
              />
              <ArchiveCategoryRanking
                items={categorySummary.categories}
                years={summary.activity.years}
                selectedYear={selectedCategoryYear}
                formatDuration={formatActivityDuration}
                labels={{
                  title: t("categoryRankingTitle"),
                  subtitle: t("categoryRankingSubtitle"),
                  streams: (count) => t("statsStreamCount", { count }),
                  duration: (duration) => duration,
                  streamGauge: (name, count) =>
                    t("categoryStreamGauge", { name, count }),
                  durationGauge: (name, duration) =>
                    t("categoryDurationGauge", { name, duration }),
                  metricStreams: t("categoryRankingMetricStreams"),
                  metricDuration: t("categoryRankingMetricDuration"),
                  metricSwitchAriaLabel: t(
                    "categoryRankingMetricSwitchAriaLabel",
                  ),
                  noData: t("categoryRankingNoData"),
                  allTimeOptionLabel: t("collaborationRankingAllTime"),
                  yearSelectAriaLabel: t("categoryRankingPeriodLabel"),
                }}
                onSelectedYearChange={setSelectedCategoryYear}
              />
              <ArchiveLongestStreamRanking
                items={longestStreams}
                years={summary.activity.years}
                selectedYear={selectedLongestStreamYear}
                locale={locale}
                formatDuration={formatCompactActivityDuration}
                labels={{
                  title: t("longestStreamRankingTitle"),
                  subtitle: t("longestStreamRankingSubtitle"),
                  noData: t("longestStreamRankingNoData"),
                  allTimeOptionLabel: t("collaborationRankingAllTime"),
                  yearSelectAriaLabel: t("longestStreamRankingPeriodLabel"),
                  itemLabel: (rank, title, duration) =>
                    t("longestStreamRankingItemLabel", {
                      rank,
                      title,
                      duration,
                    }),
                  gauge: (title, duration) =>
                    t("longestStreamRankingGauge", { title, duration }),
                  thumbnail: (title) =>
                    t("longestStreamRankingThumbnail", { title }),
                  detailCloseLabel: t("monthlyCalendarDetailClose"),
                  appWatchLabel: t("appWatchLabel"),
                  castLabel: t("castLabel"),
                  timestampLabel: t("timestampLabel"),
                }}
                onSelectedYearChange={setSelectedLongestStreamYear}
              />
            </div>

            <ArchiveTimeHeatmap
              cells={timeHeatmapSummary.timeHeatmap}
              maxCount={timeHeatmapSummary.maxTimeHeatmapCount}
              years={summary.activity.years}
              selectedYear={selectedTimeHeatmapYear}
              weekdayLabels={weekdayLabels}
              labels={{
                title: t("timeHeatmapTitle"),
                subtitle: t("timeHeatmapSubtitle"),
                cell: (weekday, time, count) =>
                  t("timeHeatmapCell", { weekday, time, count }),
                less: t("activityLegendLess"),
                more: t("activityLegendMore"),
                allTimeOptionLabel: t("collaborationRankingAllTime"),
                yearSelectAriaLabel: t("timeHeatmapPeriodLabel"),
              }}
              onSelectedYearChange={setSelectedTimeHeatmapYear}
            />
          </div>
        )}
      </div>
    </div>
  );
}
