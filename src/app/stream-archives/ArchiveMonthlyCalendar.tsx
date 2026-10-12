"use client";

import { ActionIcon, Text } from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { useEffect, useMemo, useState } from "react";
import { HiCalendar, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import ActivityCalendarSection from "../activity/ActivityCalendarSection";
import { isActivityMonthInRange } from "../activity/monthActivity";
import {
  ActivityTimelineFilterMenu,
  DEFAULT_ACTIVITY_TIMELINE_DISPLAY_FILTERS,
} from "../components/ActivityTimelineSection";
import useActivityTimeline, {
  buildArchiveActivityItems,
  filterActivityTimelineItems,
  sortActivityTimelineItems,
} from "../hook/useActivityTimeline";
import useAnniversaries from "../hook/useAnniversaries";
import useEvents from "../hook/useEvents";
import useMilestones from "../hook/useMilestones";
import { buildAnniversaryActivityItems } from "../lib/activityAnniversaries";
import { getActivityJstDateKey } from "../lib/activityCalendar";
import { filterActivityTimelineItemsForDisplay } from "../lib/activityTimelineFilters";
import historyHelper from "../lib/history";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { Song } from "../types/song";
import type { ArchiveCalendarDayStats, ArchiveStatsItem } from "./archiveStats";

const MONTH_ACTIVITY_LIMIT = 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

type ArchiveMonthlyCalendarProps = {
  days: Map<string, ArchiveCalendarDayStats>;
  archives: ArchiveStatsItem[];
  latestMonth: string | null;
  locale: string;
  songs: Song[];
  channels: ChannelEntry[];
  labels: {
    title: string;
    subtitle: string;
    monthLabel: string;
    previousMonth: string;
    nextMonth: string;
    scheduledTime: (time: string) => string;
    empty: string;
    includeExternalChannels: string;
  };
};

const shiftMonth = (monthValue: string, offset: number) => {
  const [year, month] = monthValue.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
};

export default function ArchiveMonthlyCalendar({
  days,
  archives,
  latestMonth,
  locale,
  songs,
  channels,
  labels,
}: ArchiveMonthlyCalendarProps) {
  const { items: anniversaries, isLoading: isAnniversariesLoading } =
    useAnniversaries();
  const { items: eventItems, isLoading: isEventsLoading } = useEvents();
  const { items: milestoneItems, isLoading: isMilestonesLoading } =
    useMilestones();
  const availableDateKeys = useMemo(
    () =>
      [
        ...days.keys(),
        ...eventItems.map((item) => getActivityJstDateKey(item.start_at)),
        ...milestoneItems.map((item) => getActivityJstDateKey(item.date)),
      ]
        .filter(Boolean)
        .sort(),
    [days, eventItems, milestoneItems],
  );
  const todayDateKey = getActivityJstDateKey(new Date());
  const todayMonth = todayDateKey.slice(0, 7);
  const firstDataMonth = availableDateKeys[0]?.slice(0, 7);
  const lastDataMonth = availableDateKeys.at(-1)?.slice(0, 7);
  const minMonth = firstDataMonth
    ? firstDataMonth < todayMonth
      ? firstDataMonth
      : todayMonth
    : undefined;
  const maxMonth = lastDataMonth
    ? lastDataMonth > todayMonth
      ? lastDataMonth
      : todayMonth
    : undefined;
  const minDate = minMonth ? `${minMonth}-01` : undefined;
  const maxDate = maxMonth ? `${maxMonth}-01` : undefined;
  const defaultMonth =
    latestMonth || availableDateKeys.length ? todayMonth : null;
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [displayFilters, setDisplayFilters] = useState(
    DEFAULT_ACTIVITY_TIMELINE_DISPLAY_FILTERS,
  );
  const [includeExternalChannels, setIncludeExternalChannels] = useState(true);

  useEffect(() => {
    const restoreMonth = () => {
      const monthParam = new URL(window.location.href).searchParams.get(
        "month",
      );
      const match = monthParam?.match(/^(\d{4})-(\d{2})$/);
      const monthFromUrl =
        match &&
        isActivityMonthInRange({
          year: Number(match[1]),
          month: Number(match[2]),
        })
          ? match[0]
          : null;

      setSelectedMonth(
        monthFromUrl
          ? `${monthFromUrl}-01`
          : defaultMonth
            ? `${defaultMonth}-01`
            : null,
      );
    };

    restoreMonth();
    window.addEventListener("popstate", restoreMonth);
    return () => window.removeEventListener("popstate", restoreMonth);
  }, [defaultMonth]);

  const monthValue = selectedMonth?.slice(0, 7) ?? defaultMonth;
  const activityMonth = useMemo(() => {
    if (!monthValue) {
      return null;
    }

    const [year, month] = monthValue.split("-").map(Number);
    return { year, month };
  }, [monthValue]);
  const dateRange = useMemo(() => {
    if (!activityMonth) {
      return undefined;
    }

    return {
      start: new Date(
        Date.UTC(activityMonth.year, activityMonth.month - 1, 1) -
          JST_OFFSET_MS,
      ),
      endExclusive: new Date(
        Date.UTC(activityMonth.year, activityMonth.month, 1) - JST_OFFSET_MS,
      ),
    };
  }, [activityMonth]);
  const {
    items: activityItems,
    isLoading: isActivityLoading,
    isViewMilestonesLoading,
  } = useActivityTimeline({
    songs,
    events: eventItems,
    milestones: milestoneItems,
    isEventsLoading,
    isMilestonesLoading,
    enabled: Boolean(activityMonth),
    limit: MONTH_ACTIVITY_LIMIT,
    songUpdateLimit: MONTH_ACTIVITY_LIMIT,
    archiveLimit: MONTH_ACTIVITY_LIMIT,
    viewMilestonePeriod: "all",
    dateRange,
    includeFutureScheduledItems: true,
  });
  const archiveItems = useMemo(
    () => buildArchiveActivityItems(archives, Number.POSITIVE_INFINITY, songs),
    [archives, songs],
  );
  const anniversaryItems = useMemo(
    () =>
      activityMonth
        ? buildAnniversaryActivityItems(anniversaries, activityMonth, locale)
        : [],
    [activityMonth, anniversaries, locale],
  );
  const orderedActivityItems = useMemo(
    () =>
      sortActivityTimelineItems(
        [
          ...filterActivityTimelineItems(
            [
              ...activityItems.filter((item) => item.kind !== "archive"),
              ...anniversaryItems,
            ],
            { dateRange, includeFutureScheduledItems: true },
          ),
          ...filterActivityTimelineItems(archiveItems, {
            dateRange,
            now: Number.POSITIVE_INFINITY,
          }),
        ],
        "asc",
      ),
    [activityItems, anniversaryItems, archiveItems, dateRange],
  );
  const filteredActivityItems = useMemo(
    () =>
      filterActivityTimelineItemsForDisplay(
        orderedActivityItems.filter((item) => {
          if (includeExternalChannels || item.kind !== "archive") {
            return true;
          }
          const azkiChannelId = channels.find(
            (channel) => channel.channelName === "AZKi Channel",
          )?.youtubeId;
          return !azkiChannelId || item.archive.channel_id === azkiChannelId;
        }),
        displayFilters,
      ),
    [channels, displayFilters, includeExternalChannels, orderedActivityItems],
  );
  const isPreviousMonthDisabled =
    !monthValue || Boolean(minMonth && monthValue <= minMonth);
  const isNextMonthDisabled =
    !monthValue || Boolean(maxMonth && monthValue >= maxMonth);
  const handleMonthChange = (value: string | null) => {
    setSelectedMonth(value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("month", value.slice(0, 7));
    } else {
      url.searchParams.delete("month");
    }
    historyHelper.replaceUrlIfDifferent(url.href, { dispatchEvent: false });
  };
  const handleMonthShift = (offset: number) => {
    if (!monthValue) {
      return;
    }

    handleMonthChange(`${shiftMonth(monthValue, offset)}-01`);
  };

  return (
    <section className="rounded-xl border border-light-gray-200/50 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-gray-900/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {labels.subtitle}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="flex shrink-0">
            <ActionIcon
              variant="transparent"
              radius="md"
              aria-label={labels.previousMonth}
              disabled={isPreviousMonthDisabled}
              onClick={() => handleMonthShift(-1)}
              styles={{ root: { backgroundColor: "transparent" } }}
            >
              <HiChevronLeft
                aria-hidden="true"
                className={
                  isPreviousMonthDisabled
                    ? "text-gray-300 dark:text-gray-700"
                    : "text-gray-600 dark:text-gray-300"
                }
              />
            </ActionIcon>
            <ActionIcon
              variant="transparent"
              radius="md"
              aria-label={labels.nextMonth}
              disabled={isNextMonthDisabled}
              onClick={() => handleMonthShift(1)}
              styles={{ root: { backgroundColor: "transparent" } }}
            >
              <HiChevronRight
                aria-hidden="true"
                className={
                  isNextMonthDisabled
                    ? "text-gray-300 dark:text-gray-700"
                    : "text-gray-600 dark:text-gray-300"
                }
              />
            </ActionIcon>
          </div>
          <MonthPickerInput
            aria-label={labels.monthLabel}
            value={selectedMonth}
            onChange={handleMonthChange}
            leftSection={<HiCalendar />}
            minDate={minDate}
            maxDate={maxDate}
            valueFormat={locale.startsWith("ja") ? "YYYY年M月" : "MMM YYYY"}
            monthsListFormat={locale.startsWith("ja") ? "M月" : "MMM"}
            allowDeselect={false}
            className="min-w-0 flex-1 sm:w-44 sm:flex-none"
          />
        </div>
      </div>

      {!activityMonth ? (
        <Text c="dimmed" size="sm" mt="md">
          {labels.empty}
        </Text>
      ) : (
        <div className="mt-4">
          <div className="flex justify-end">
            <ActivityTimelineFilterMenu
              filters={displayFilters}
              onChange={setDisplayFilters}
              showAnniversaries
              includeExternalChannels={includeExternalChannels}
              externalChannelsLabel={labels.includeExternalChannels}
              onExternalChannelsChange={setIncludeExternalChannels}
            />
          </div>
          <ActivityCalendarSection
            activityMonth={activityMonth}
            items={filteredActivityItems}
            isLoading={
              isActivityLoading ||
              isAnniversariesLoading ||
              isEventsLoading ||
              isMilestonesLoading
            }
            isViewMilestonesLoading={isViewMilestonesLoading}
            channels={channels}
            showDetails={false}
            defaultSelectedDateKey={
              monthValue === todayMonth ? todayDateKey : undefined
            }
            upcomingArchiveTimeLabel={labels.scheduledTime}
          />
        </div>
      )}
    </section>
  );
}
