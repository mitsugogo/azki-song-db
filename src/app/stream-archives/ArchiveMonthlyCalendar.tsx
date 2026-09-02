"use client";

import {
  ActionIcon,
  Badge,
  Drawer,
  Text,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { HiCalendar, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { LuPartyPopper } from "react-icons/lu";
import { Link } from "@/i18n/navigation";
import ActivityItemDetail from "../components/ActivityItemDetail";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import useActivityTimeline, {
  type ActivityTimelineItem,
} from "../hook/useActivityTimeline";
import useAnniversaries from "../hook/useAnniversaries";
import { getActivityJstDateKey } from "../lib/activityCalendar";
import { buildAnniversaryActivityItems } from "../lib/activityAnniversaries";
import { getActivityItemLabel } from "../lib/activityItemPresentation";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { Song } from "../types/song";
import ArchiveItemDetail from "./ArchiveItemDetail";
import type { ArchiveCalendarDayStats, ArchiveStatsItem } from "./archiveStats";

const CALENDAR_THUMBNAIL_LIMIT = 2;
const CALENDAR_ITEM_LIMIT = 3;

type ArchiveMonthlyCalendarProps = {
  days: Map<string, ArchiveCalendarDayStats>;
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
    streams: (count: number) => string;
    duration: (duration: string) => string;
    more: (count: number) => string;
    openDate: (date: string) => string;
    empty: string;
    detailAriaLabel: (title: string) => string;
    detailCloseLabel: string;
    appWatchLabel: string;
    castLabel: string;
    timestampLabel: string;
  };
  formatDuration: (seconds: number) => string;
};

const buildCalendarCells = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  const startWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cellCount = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - startWeekday + 1;
    if (day < 1 || day > daysInMonth) {
      return null;
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
};

const getWeekdayLabels = (locale: string) => {
  const formatter = new Intl.DateTimeFormat(
    locale.startsWith("ja") ? "ja-JP" : locale,
    { weekday: "short", timeZone: "UTC" },
  );
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2024, 0, 7 + index))),
  );
};

const shiftMonth = (monthValue: string, offset: number) => {
  const [year, month] = monthValue.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
};

export default function ArchiveMonthlyCalendar({
  days,
  latestMonth,
  locale,
  songs,
  channels,
  labels,
  formatDuration,
}: ArchiveMonthlyCalendarProps) {
  const tHome = useTranslations("Home");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<ArchiveStatsItem | null>(null);
  const [activityDetailItem, setActivityDetailItem] =
    useState<ActivityTimelineItem | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const handleOpenDetail = (item: ArchiveStatsItem) => {
    setActivityDetailItem(null);
    setDetailItem(item);
    openDrawer();
  };
  const handleOpenActivityDetail = (item: ActivityTimelineItem) => {
    setDetailItem(null);
    setActivityDetailItem(item);
    openDrawer();
  };

  useEffect(() => {
    if (latestMonth) {
      setSelectedMonth((current) => current ?? `${latestMonth}-01`);
    }
  }, [latestMonth]);

  const monthValue = selectedMonth?.slice(0, 7) ?? latestMonth;
  const activityMonth = useMemo(() => {
    if (!monthValue) {
      return null;
    }
    const [year, month] = monthValue.split("-").map(Number);
    return { year, month };
  }, [monthValue]);
  const activityDateRange = useMemo(() => {
    if (!activityMonth) {
      return undefined;
    }
    return {
      start: new Date(activityMonth.year, activityMonth.month - 1, 1),
      endExclusive: new Date(activityMonth.year, activityMonth.month, 1),
    };
  }, [activityMonth]);
  const { items: anniversaries } = useAnniversaries();
  const { items: activityTimelineItems } = useActivityTimeline({
    songs,
    enabled: true,
    viewMilestonePeriod: "all",
    dateRange: activityDateRange,
  });
  const extraItemsByDate = useMemo(() => {
    const anniversaryItems = activityMonth
      ? buildAnniversaryActivityItems(anniversaries, activityMonth, locale)
      : [];
    const viewMilestoneItems = activityTimelineItems.filter(
      (item) => item.kind === "view_milestone",
    );
    const map = new Map<string, ActivityTimelineItem[]>();
    [...anniversaryItems, ...viewMilestoneItems].forEach((item) => {
      const dateKey = getActivityJstDateKey(item.occurredAt);
      if (!dateKey) {
        return;
      }
      const existing = map.get(dateKey) ?? [];
      existing.push(item);
      map.set(dateKey, existing);
    });
    return map;
  }, [activityMonth, activityTimelineItems, anniversaries, locale]);
  const calendarCells = useMemo(
    () => (monthValue ? buildCalendarCells(monthValue) : []),
    [monthValue],
  );
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  const availableDateKeys = useMemo(
    () => Array.from(days.keys()).sort(),
    [days],
  );
  const minDate = availableDateKeys[0]
    ? `${availableDateKeys[0].slice(0, 7)}-01`
    : undefined;
  const maxDate = availableDateKeys.at(-1)
    ? `${availableDateKeys.at(-1)!.slice(0, 7)}-01`
    : undefined;
  const minMonth = minDate?.slice(0, 7);
  const maxMonth = maxDate?.slice(0, 7);
  const isPreviousMonthDisabled =
    !monthValue || Boolean(minMonth && monthValue <= minMonth);
  const isNextMonthDisabled =
    !monthValue || Boolean(maxMonth && monthValue >= maxMonth);
  const handleMonthShift = (offset: number) => {
    if (!monthValue) {
      return;
    }

    setSelectedMonth(`${shiftMonth(monthValue, offset)}-01`);
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
            onChange={setSelectedMonth}
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

      {!monthValue ? (
        <Text c="dimmed" size="sm" mt="md">
          {labels.empty}
        </Text>
      ) : (
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="min-w-180">
            <div className="grid grid-cols-7 border-b border-light-gray-200 text-center text-xs font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400">
              {weekdayLabels.map((label) => (
                <span key={label} className="py-2">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-light-gray-200 dark:border-white/10">
              {calendarCells.map((dateKey, index) => {
                if (!dateKey) {
                  return (
                    <span
                      key={`empty-${index}`}
                      className="min-h-36 border-b border-r border-light-gray-200 bg-light-gray-50/50 dark:border-white/10 dark:bg-white/2"
                    />
                  );
                }

                const day = days.get(dateKey);
                const dayNumber = Number(dateKey.slice(-2));
                const dayHref = `/stream-archives/list?from=${dateKey}&to=${dateKey}`;
                const thumbnailItems =
                  day?.items.slice(0, CALENDAR_THUMBNAIL_LIMIT) ?? [];
                const textItems =
                  day?.items.slice(
                    CALENDAR_THUMBNAIL_LIMIT,
                    CALENDAR_ITEM_LIMIT,
                  ) ?? [];
                const remainingCount = day
                  ? day.items.length - CALENDAR_ITEM_LIMIT
                  : 0;
                const extraItems = extraItemsByDate.get(dateKey) ?? [];
                const anniversaryItems = extraItems.filter(
                  (item) => item.kind === "anniversary",
                );
                const otherExtraItems = extraItems.filter(
                  (item) => item.kind !== "anniversary",
                );
                const hasAnniversary = anniversaryItems.length > 0;
                return (
                  <div
                    key={dateKey}
                    className={`flex min-h-36 min-w-0 flex-col border-b border-r border-light-gray-200 p-1.5 dark:border-white/10 ${
                      hasAnniversary
                        ? "bg-linear-to-br from-pink-50/90 via-white/60 to-amber-50/80 dark:from-pink-400/10 dark:via-white/3 dark:to-amber-300/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        href={dayHref}
                        aria-label={labels.openDate(dateKey)}
                        className={`rounded px-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                          hasAnniversary
                            ? "rounded-full bg-pink-100 text-pink-700 ring-1 ring-pink-200 dark:bg-pink-300/15 dark:text-pink-200 dark:ring-pink-300/25"
                            : "hover:bg-light-gray-100 dark:hover:bg-white/10"
                        }`}
                      >
                        {dayNumber}
                      </Link>
                      {day ? (
                        <Badge size="xs" variant="light" color="cyan">
                          {labels.streams(day.streamCount)}
                        </Badge>
                      ) : null}
                    </div>

                    {anniversaryItems.length > 0 ||
                    otherExtraItems.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {anniversaryItems.map((item) => {
                          const label = getActivityItemLabel(
                            item,
                            tHome,
                            locale,
                          );
                          return (
                            <UnstyledButton
                              key={item.id}
                              type="button"
                              aria-label={labels.detailAriaLabel(label.title)}
                              className="flex w-full items-center gap-1 rounded border border-pink-200/90 bg-linear-to-r from-pink-100/95 to-amber-50/95 px-1.5 py-1 text-left text-[0.7rem] font-semibold leading-4 text-pink-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-pink-300/25 dark:from-pink-300/15 dark:to-amber-300/10 dark:text-pink-100"
                              onClick={() => handleOpenActivityDetail(item)}
                            >
                              <LuPartyPopper
                                className="h-3 w-3 shrink-0 text-pink-600 dark:text-pink-200"
                                aria-hidden="true"
                              />
                              <span className="truncate">{label.title}</span>
                            </UnstyledButton>
                          );
                        })}
                        {otherExtraItems.map((item) => {
                          const label = getActivityItemLabel(
                            item,
                            tHome,
                            locale,
                          );
                          return (
                            <UnstyledButton
                              key={item.id}
                              type="button"
                              aria-label={labels.detailAriaLabel(label.title)}
                              className="flex w-full items-center gap-1 rounded bg-light-gray-100/80 px-1.5 py-1 text-left text-[0.7rem] leading-4 text-gray-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 dark:bg-white/5 dark:text-gray-200"
                              onClick={() => handleOpenActivityDetail(item)}
                            >
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-yellow-500"
                                aria-hidden="true"
                              />
                              <span className="truncate">{label.title}</span>
                            </UnstyledButton>
                          );
                        })}
                      </div>
                    ) : null}

                    {day ? (
                      <>
                        {thumbnailItems.length > 0 ? (
                          <div
                            className={`mt-1 grid gap-1 ${
                              thumbnailItems.length === 1
                                ? "grid-cols-1"
                                : "grid-cols-2"
                            }`}
                          >
                            {thumbnailItems.map((item) => (
                              <UnstyledButton
                                key={item.video_id}
                                type="button"
                                title={item.title}
                                aria-label={labels.detailAriaLabel(item.title)}
                                className="block aspect-video min-w-0 overflow-hidden rounded bg-black focus:outline-none focus:ring-2 focus:ring-primary/40"
                                onClick={() => handleOpenDetail(item)}
                              >
                                <YoutubeThumbnail
                                  videoId={item.video_id}
                                  alt={item.title}
                                />
                              </UnstyledButton>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-1 space-y-1">
                          {textItems.map((item) => (
                            <UnstyledButton
                              key={item.video_id}
                              type="button"
                              aria-label={labels.detailAriaLabel(item.title)}
                              className="block w-full truncate rounded bg-light-gray-100/80 px-1.5 py-1 text-left text-[0.7rem] leading-4 text-gray-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 dark:bg-white/5 dark:text-gray-200"
                              onClick={() => handleOpenDetail(item)}
                            >
                              {item.title}
                            </UnstyledButton>
                          ))}
                          {remainingCount > 0 ? (
                            <Link
                              href={dayHref}
                              className="block px-1 text-[0.7rem] font-medium text-gray-500 hover:underline dark:text-gray-400"
                            >
                              {labels.more(remainingCount)}
                            </Link>
                          ) : null}
                        </div>
                        <Link
                          href={dayHref}
                          className="mt-auto truncate px-1 pt-1 text-[0.65rem] text-gray-500 hover:underline dark:text-gray-400"
                        >
                          {labels.duration(
                            formatDuration(day.totalDurationSeconds),
                          )}
                        </Link>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        onExitTransitionEnd={() => {
          setDetailItem(null);
          setActivityDetailItem(null);
        }}
        position="right"
        size="lg"
        title={
          <VisuallyHidden>
            {detailItem?.title ??
              (activityDetailItem
                ? getActivityItemLabel(activityDetailItem, tHome, locale).title
                : "")}
          </VisuallyHidden>
        }
        closeButtonProps={{ "aria-label": labels.detailCloseLabel }}
        overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
        styles={{ body: { padding: 0 } }}
      >
        {detailItem ? (
          <div data-testid="archive-detail-content">
            <ArchiveItemDetail
              key={detailItem.video_id}
              item={detailItem}
              locale={locale}
              labels={{
                appWatchLabel: labels.appWatchLabel,
                castLabel: labels.castLabel,
                timestampLabel: labels.timestampLabel,
              }}
            />
          </div>
        ) : activityDetailItem ? (
          <div data-testid="archive-activity-detail-content">
            <ActivityItemDetail
              key={activityDetailItem.id}
              item={activityDetailItem}
              channels={channels}
              active={drawerOpened}
            />
          </div>
        ) : null}
      </Drawer>
    </section>
  );
}
