"use client";

import { memo, useMemo } from "react";
import { Select, Tooltip } from "@mantine/core";
import {
  ArchiveActivitySummary,
  buildArchiveActivityYear,
  formatActivityDuration,
  getArchiveActivityLevel,
} from "./archiveActivity";

type ArchiveContributionHeatmapLabels = {
  title: string;
  totalDuration: (duration: string) => string;
  yearLabel: string;
  legendLess: string;
  legendMore: string;
  cellLabel: (date: string, duration: string, count: number) => string;
  emptyCellLabel: (date: string) => string;
  noData: string;
};

type ArchiveContributionHeatmapProps = {
  summary: ArchiveActivitySummary;
  selectedYear: string | null;
  labels: ArchiveContributionHeatmapLabels;
  locale: string;
  onSelectedYearChange: (year: string | null) => void;
  onDateClick: (dateKey: string) => void;
};

const LEVEL_CLASSES = [
  "border-light-gray-100/70 bg-light-gray-100 dark:border-white/10 dark:bg-gray-800",
  "border-pink-200/70 bg-pink-200/70 dark:border-pink-950 dark:bg-pink-950",
  "border-pink-300 bg-pink-300 dark:border-pink-800 dark:bg-pink-800",
  "border-pink-600 bg-pink-600 dark:border-pink-500 dark:bg-pink-500",
  "border-pink-800 bg-pink-800 dark:border-pink-300 dark:bg-pink-300",
];

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const getMonthLabel = (year: number, month: number, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

const ArchiveContributionHeatmap = memo(function ArchiveContributionHeatmap({
  summary,
  selectedYear,
  labels,
  locale,
  onSelectedYearChange,
  onDateClick,
}: ArchiveContributionHeatmapProps) {
  const numericSelectedYear = selectedYear ? Number(selectedYear) : null;
  const yearData = useMemo(
    () =>
      numericSelectedYear
        ? buildArchiveActivityYear(summary, numericSelectedYear)
        : null,
    [numericSelectedYear, summary],
  );
  const yearOptions = useMemo(
    () =>
      summary.years.map((year) => ({
        value: String(year),
        label: String(year),
      })),
    [summary.years],
  );

  if (!yearData || !numericSelectedYear) {
    return (
      <section className="h-full rounded-xl border border-light-gray-200/50 bg-white/70 p-4 text-sm text-gray-600 shadow-sm dark:border-white/10 dark:bg-gray-900/50 dark:text-gray-300">
        {labels.noData}
      </section>
    );
  }

  return (
    <section className="h-full min-w-0 max-w-full rounded-xl border border-light-gray-200/50 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-gray-900/50">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-gray-100">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {labels.totalDuration(
              formatActivityDuration(yearData.totalActiveSeconds),
            )}
          </p>
        </div>
        <Select
          aria-label={labels.yearLabel}
          data={yearOptions}
          value={selectedYear}
          onChange={onSelectedYearChange}
          className="w-full sm:w-32"
          allowDeselect={false}
        />
      </div>

      <div
        role="region"
        aria-label={labels.title}
        className="w-full min-w-0 max-w-full pb-1"
      >
        <div className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-x-1.5 sm:grid-cols-[1.75rem_minmax(0,1fr)] sm:gap-x-2">
          <div
            className="col-start-2 mb-1 grid h-4 min-w-0 gap-px text-[0.55rem] text-gray-500 dark:text-gray-400 sm:h-5 sm:gap-0.75 sm:text-xs"
            style={{
              gridTemplateColumns: `repeat(${yearData.weeks.length}, minmax(0, 1fr))`,
            }}
          >
            {yearData.monthLabels.map((monthLabel) => (
              <span
                key={`${numericSelectedYear}-${monthLabel.month}`}
                className="truncate leading-4 sm:leading-5"
                style={{
                  gridColumn: `${monthLabel.weekIndex + 1} / span 4`,
                }}
              >
                {getMonthLabel(numericSelectedYear, monthLabel.month, locale)}
              </span>
            ))}
          </div>
          <div className="grid min-w-0 grid-rows-7 gap-px text-[0.5rem] leading-none text-gray-500 dark:text-gray-400 sm:gap-0.75 sm:text-xs sm:leading-3">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index} className="flex min-w-0 items-center">
                {label}
              </span>
            ))}
          </div>
          <div
            className="grid min-w-0 gap-px sm:gap-0.75"
            style={{
              gridTemplateColumns: `repeat(${yearData.weeks.length}, minmax(0, 1fr))`,
            }}
          >
            {yearData.weeks.map((week, weekIndex) => (
              <div
                key={`${numericSelectedYear}-week-${weekIndex}`}
                className="grid min-w-0 grid-rows-7 gap-px sm:gap-0.75"
              >
                {week.map((day, dayIndex) => {
                  if (!day.dateKey) {
                    return (
                      <span
                        key={`${weekIndex}-${dayIndex}`}
                        className="aspect-square w-full min-w-0"
                      />
                    );
                  }

                  const level = getArchiveActivityLevel(
                    day.activeSeconds,
                    summary.maxActiveSeconds,
                  );
                  const label =
                    day.activeSeconds > 0
                      ? labels.cellLabel(
                          day.dateKey,
                          formatActivityDuration(day.activeSeconds),
                          day.streamCount,
                        )
                      : labels.emptyCellLabel(day.dateKey);
                  const className = `aspect-square w-full min-w-0 rounded-[1px] border p-0 sm:rounded-xs ${LEVEL_CLASSES[level]}`;

                  return (
                    <Tooltip
                      key={day.dateKey}
                      label={label}
                      withArrow
                      openDelay={200}
                    >
                      {day.activeSeconds > 0 ? (
                        <button
                          type="button"
                          aria-label={label}
                          className={`${className} transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900`}
                          onClick={() => onDateClick(day.dateKey)}
                        />
                      ) : (
                        <span aria-label={label} className={className} />
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="col-span-2 mt-3 flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{labels.legendLess}</span>
            {LEVEL_CLASSES.map((className, index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-xs border ${className}`}
              />
            ))}
            <span>{labels.legendMore}</span>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ArchiveContributionHeatmap;
