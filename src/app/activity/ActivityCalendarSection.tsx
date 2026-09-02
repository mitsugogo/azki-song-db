"use client";

import { useMemo, useState } from "react";
import {
  Drawer,
  Skeleton,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useLocale, useTranslations } from "next-intl";
import { LuPartyPopper } from "react-icons/lu";
import ActivityItemDetail from "../components/ActivityItemDetail";
import ActivityTimelineSection from "../components/ActivityTimelineSection";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import {
  buildActivityCalendarDays,
  getActivityCalendarCellPreview,
  getActivityJstDateKey,
  getInitialActivityCalendarDateKey,
  groupActivityItemsByJstDate,
} from "../lib/activityCalendar";
import { getActivityItemLabel } from "../lib/activityItemPresentation";
import type { ActivityTimelineItem } from "../hook/useActivityTimeline";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { ActivityMonth } from "./monthActivity";

const CALENDAR_ITEM_LIMIT = 3;

const activityKindDotClasses: Record<ActivityTimelineItem["kind"], string> = {
  song_update: "bg-pink-500",
  archive: "bg-cyan-500",
  view_milestone: "bg-yellow-500",
  milestone: "bg-violet-500",
  event: "bg-blue-500",
  anniversary: "bg-pink-500 ring-1 ring-amber-300",
};

type ActivityCalendarSectionProps = {
  activityMonth: ActivityMonth;
  items: ActivityTimelineItem[];
  isLoading: boolean;
  isViewMilestonesLoading: boolean;
  channels: ChannelEntry[];
};

function formatCalendarDate(dateKey: string, locale: string) {
  const resolvedLocale = locale.startsWith("ja") ? "ja-JP" : locale;
  return new Intl.DateTimeFormat(resolvedLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${dateKey}T00:00:00+09:00`));
}

function getWeekdayLabels(locale: string) {
  const resolvedLocale = locale.startsWith("ja") ? "ja-JP" : locale;
  const formatter = new Intl.DateTimeFormat(resolvedLocale, {
    weekday: "short",
    timeZone: "UTC",
  });

  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2024, 0, 7 + index))),
  );
}

function getCalendarItemTitle(
  item: ActivityTimelineItem,
  tHome: ReturnType<typeof useTranslations>,
  locale: string,
) {
  const label = getActivityItemLabel(item, tHome, locale);

  if (item.kind === "song_update" || item.kind === "archive") {
    return label.description || label.title;
  }

  return label.title;
}

type CalendarTextPreviewProps = {
  item: ActivityTimelineItem;
  title: string;
  ariaLabel: string;
  onClick: () => void;
};

function CalendarTextPreview({
  item,
  title,
  ariaLabel,
  onClick,
}: CalendarTextPreviewProps) {
  return (
    <UnstyledButton
      type="button"
      data-activity-kind={item.kind}
      className={`pointer-events-auto flex w-full min-w-0 items-center gap-1 rounded px-1.5 py-1 text-left text-[0.7rem] leading-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        item.kind === "anniversary"
          ? "border border-pink-200/90 bg-gradient-to-r from-pink-100/95 to-amber-50/95 font-semibold text-pink-800 shadow-sm dark:border-pink-300/25 dark:from-pink-300/15 dark:to-amber-300/10 dark:text-pink-100"
          : "bg-light-gray-100/80 text-gray-700 dark:bg-white/5 dark:text-gray-200"
      }`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {item.kind === "anniversary" ? (
        <LuPartyPopper
          className="h-3 w-3 shrink-0 text-pink-600 dark:text-pink-200"
          aria-hidden="true"
        />
      ) : (
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${activityKindDotClasses[item.kind]}`}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{title}</span>
    </UnstyledButton>
  );
}

export default function ActivityCalendarSection({
  activityMonth,
  items,
  isLoading,
  isViewMilestonesLoading,
  channels,
}: ActivityCalendarSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Summary");
  const tHome = useTranslations("Home");
  const [userSelectedDateKey, setUserSelectedDateKey] = useState<string | null>(
    null,
  );
  const [drawerItem, setDrawerItem] = useState<ActivityTimelineItem | null>(
    null,
  );
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const isDesktop = useMediaQuery("(min-width: 40em)", false);
  const calendarDays = useMemo(
    () => buildActivityCalendarDays(activityMonth),
    [activityMonth],
  );
  const groupedItems = useMemo(
    () => groupActivityItemsByJstDate(items),
    [items],
  );
  const initialDateKey = useMemo(
    () => getInitialActivityCalendarDateKey(activityMonth, groupedItems),
    [activityMonth, groupedItems],
  );
  const selectedDateKey = userSelectedDateKey ?? initialDateKey;
  const selectedItems = selectedDateKey
    ? (groupedItems.get(selectedDateKey) ?? [])
    : [];
  const detailItems = isDesktop ? items : selectedItems;
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  const monthLabel = new Intl.DateTimeFormat(
    locale.startsWith("ja") ? "ja-JP" : locale,
    { year: "numeric", month: "long" },
  ).format(new Date(activityMonth.year, activityMonth.month - 1, 1));
  const drawerTitle = drawerItem
    ? getCalendarItemTitle(drawerItem, tHome, locale)
    : "";
  const getItemSelectAriaLabel = (item: ActivityTimelineItem) =>
    t("calendarOpenActivityDetail", {
      title: getCalendarItemTitle(item, tHome, locale),
    });
  const handleOpenActivityDetail = (
    item: ActivityTimelineItem,
    dateKey = getActivityJstDateKey(item.occurredAt),
  ) => {
    if (dateKey) {
      setUserSelectedDateKey(dateKey);
    }
    setDrawerItem(item);
    openDrawer();
  };

  return (
    <section
      className="mt-6"
      aria-label={t("calendarLabel", { month: monthLabel })}
    >
      <div
        className="overflow-hidden rounded-xl border border-white/70 bg-white/85 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]"
        data-testid="activity-calendar"
        aria-busy={isLoading}
      >
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">
            {t("calendarLabel", { month: monthLabel })}
          </caption>
          <thead>
            <tr>
              {weekdayLabels.map((weekday, index) => (
                <th
                  key={weekday}
                  scope="col"
                  className={`border-b border-light-gray-200/80 px-1 py-2 text-center text-xs font-semibold dark:border-white/10 sm:text-sm ${
                    index === 0
                      ? "text-red-600 dark:text-red-300"
                      : index === 6
                        ? "text-blue-600 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: calendarDays.length / 7 }, (_, rowIndex) => (
              <tr key={`calendar-week-${rowIndex}`}>
                {calendarDays
                  .slice(rowIndex * 7, rowIndex * 7 + 7)
                  .map((day, weekdayIndex) => {
                    if (!day) {
                      return (
                        <td
                          key={`calendar-empty-${rowIndex}-${weekdayIndex}`}
                          className="h-16 border-b border-r border-light-gray-200/70 bg-light-gray-100/60 dark:border-white/10 dark:bg-black/10 sm:h-36"
                          aria-hidden="true"
                        />
                      );
                    }

                    const dayItems = groupedItems.get(day.dateKey) ?? [];
                    const hasAnniversary = dayItems.some(
                      (item) => item.kind === "anniversary",
                    );
                    const isSelected = day.dateKey === selectedDateKey;
                    const { thumbnailItems, textItems, remainingCount } =
                      getActivityCalendarCellPreview(
                        dayItems,
                        CALENDAR_ITEM_LIMIT,
                      );
                    const anniversaryTextItems = textItems.filter(
                      (item) => item.kind === "anniversary",
                    );
                    const otherTextItems = textItems.filter(
                      (item) => item.kind !== "anniversary",
                    );

                    const renderTextPreview = (item: ActivityTimelineItem) => {
                      const title = getCalendarItemTitle(item, tHome, locale);

                      return (
                        <CalendarTextPreview
                          key={item.id}
                          item={item}
                          title={title}
                          ariaLabel={getItemSelectAriaLabel(item)}
                          onClick={() =>
                            handleOpenActivityDetail(item, day.dateKey)
                          }
                        />
                      );
                    };

                    return (
                      <td
                        key={day.dateKey}
                        data-date-cell={day.dateKey}
                        className="relative border-b border-r border-light-gray-200/70 p-0 align-top dark:border-white/10"
                      >
                        <div className="min-h-16 sm:min-h-36">
                          <button
                            type="button"
                            data-date={day.dateKey}
                            className={`absolute inset-0 w-full text-left transition focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                              isSelected
                                ? "bg-primary/10 ring-2 ring-inset ring-primary dark:bg-primary/15"
                                : hasAnniversary
                                  ? "bg-linear-to-br from-pink-50/90 via-white/60 to-amber-50/80 hover:from-pink-100/90 hover:to-amber-100/70 dark:from-pink-400/10 dark:via-white/3 dark:to-amber-300/10 dark:hover:from-pink-400/15 dark:hover:to-amber-300/15"
                                  : "hover:bg-light-gray-100/50 dark:hover:bg-white/5"
                            }`}
                            aria-label={t("calendarDayAriaLabel", {
                              date: formatCalendarDate(day.dateKey, locale),
                              count: dayItems.length,
                            })}
                            aria-pressed={isSelected}
                            disabled={isLoading}
                            onClick={() => setUserSelectedDateKey(day.dateKey)}
                          />
                          <div className="pointer-events-none relative z-10 flex min-h-16 w-full min-w-0 flex-col p-1 text-left sm:min-h-36 sm:p-2">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${
                                hasAnniversary
                                  ? "bg-pink-100 text-pink-700 ring-1 ring-pink-200 dark:bg-pink-300/15 dark:text-pink-200 dark:ring-pink-300/25"
                                  : weekdayIndex === 0
                                    ? "text-red-600 dark:text-red-300"
                                    : weekdayIndex === 6
                                      ? "text-blue-600 dark:text-blue-300"
                                      : "text-gray-700 dark:text-gray-200"
                              }`}
                            >
                              {day.day}
                            </span>

                            {isLoading ? (
                              <div className="mt-1 hidden w-full space-y-1.5 sm:block">
                                <Skeleton height={9} width="85%" radius="sm" />
                                <Skeleton height={9} width="65%" radius="sm" />
                              </div>
                            ) : (
                              <>
                                <div className="mt-1 hidden w-full min-w-0 space-y-1 sm:block">
                                  {anniversaryTextItems.map(renderTextPreview)}
                                  {thumbnailItems.length > 0 ? (
                                    <div
                                      className={`grid w-full gap-1 ${
                                        thumbnailItems.length === 1
                                          ? "grid-cols-1"
                                          : "grid-cols-2"
                                      }`}
                                      data-testid="activity-calendar-thumbnails"
                                    >
                                      {thumbnailItems.map((item) => {
                                        const title = getCalendarItemTitle(
                                          item,
                                          tHome,
                                          locale,
                                        );

                                        return (
                                          <UnstyledButton
                                            key={item.id}
                                            type="button"
                                            className="pointer-events-auto aspect-video min-w-0 overflow-hidden rounded bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                            data-testid="activity-calendar-thumbnail"
                                            data-video-id={item.videoId}
                                            title={title}
                                            aria-label={getItemSelectAriaLabel(
                                              item,
                                            )}
                                            onClick={() =>
                                              handleOpenActivityDetail(
                                                item,
                                                day.dateKey,
                                              )
                                            }
                                          >
                                            <YoutubeThumbnail
                                              videoId={item.videoId}
                                              alt={title}
                                            />
                                          </UnstyledButton>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                  {otherTextItems.map(renderTextPreview)}
                                  {remainingCount > 0 ? (
                                    <div className="px-1 text-[0.7rem] font-medium text-gray-500 dark:text-gray-400">
                                      {t("calendarMoreItems", {
                                        count: remainingCount,
                                      })}
                                    </div>
                                  ) : null}
                                </div>

                                {dayItems.length > 0 ? (
                                  <div className="mt-auto flex w-full items-center justify-between gap-1 px-0.5 pb-0.5 sm:hidden">
                                    <span
                                      className="flex min-w-0 flex-wrap gap-0.5"
                                      aria-hidden="true"
                                    >
                                      {Array.from(
                                        new Set(
                                          dayItems.map((item) => item.kind),
                                        ),
                                      ).map((kind) => (
                                        <span
                                          key={kind}
                                          data-activity-kind={kind}
                                          className={`${
                                            kind === "anniversary"
                                              ? "h-2 w-2"
                                              : "h-1.5 w-1.5"
                                          } rounded-full ${activityKindDotClasses[kind]}`}
                                        />
                                      ))}
                                    </span>
                                    <span className="shrink-0 text-[0.65rem] font-semibold text-gray-600 dark:text-gray-300">
                                      {t("calendarActivityCount", {
                                        count: dayItems.length,
                                      })}
                                    </span>
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoading ? (
        <ActivityTimelineSection
          items={[]}
          isLoading
          shouldLoadViewStatistics
          channels={channels}
          showTitle={false}
          showFilter={false}
          className="mt-6"
        />
      ) : isDesktop || selectedDateKey ? (
        <div
          className="mt-6"
          data-testid="activity-selected-day-details"
          data-activity-scope={isDesktop ? "month" : "day"}
        >
          <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
            {isDesktop
              ? t("calendarMonthActivityTitle", { month: monthLabel })
              : t("calendarSelectedDateTitle", {
                  date: formatCalendarDate(selectedDateKey!, locale),
                })}
          </h2>
          <ActivityTimelineSection
            items={detailItems}
            isLoading={false}
            isViewMilestonesLoading={isViewMilestonesLoading}
            shouldLoadViewStatistics
            channels={channels}
            showTitle={false}
            showFilter={false}
            className="mt-0"
            onItemSelect={handleOpenActivityDetail}
            getItemSelectAriaLabel={getItemSelectAriaLabel}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {t("calendarSelectDay")}
        </p>
      )}

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        onExitTransitionEnd={() => setDrawerItem(null)}
        position="right"
        size="lg"
        title={<VisuallyHidden>{drawerTitle}</VisuallyHidden>}
        closeButtonProps={{
          "aria-label": t("calendarActivityDetailClose"),
        }}
        overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
        styles={{ body: { padding: 0 } }}
        data-testid="activity-detail-drawer"
        data-activity-id={drawerItem?.id}
      >
        {drawerItem ? (
          <div
            data-testid="activity-detail-content"
            data-activity-id={drawerItem.id}
          >
            <ActivityItemDetail
              key={drawerItem.id}
              item={drawerItem}
              channels={channels}
              active={drawerOpened}
            />
          </div>
        ) : null}
      </Drawer>
    </section>
  );
}
