"use client";

import { Tooltip } from "@mantine/core";
import { useMemo } from "react";
import ArchivePeriodSelect from "./ArchivePeriodSelect";
import type { ArchiveTimeHeatmapCell } from "./archiveStats";

type ArchiveTimeHeatmapProps = {
  cells: ArchiveTimeHeatmapCell[];
  maxCount: number;
  years: number[];
  selectedYear: string | null;
  weekdayLabels: string[];
  labels: {
    title: string;
    subtitle: string;
    cell: (weekday: string, time: string, count: number) => string;
    less: string;
    more: string;
    allTimeOptionLabel: string;
    yearSelectAriaLabel: string;
  };
  onSelectedYearChange: (year: string | null) => void;
};

const LEVEL_CLASSES = [
  "bg-light-gray-100 dark:bg-gray-800",
  "bg-cyan-100 dark:bg-cyan-950",
  "bg-cyan-300 dark:bg-cyan-800",
  "bg-cyan-500 dark:bg-cyan-600",
  "bg-cyan-700 dark:bg-cyan-300",
];

const getLevel = (count: number, maxCount: number) =>
  count <= 0 || maxCount <= 0
    ? 0
    : Math.max(1, Math.ceil((count / maxCount) * 4));

export default function ArchiveTimeHeatmap({
  cells,
  maxCount,
  years,
  selectedYear,
  weekdayLabels,
  labels,
  onSelectedYearChange,
}: ArchiveTimeHeatmapProps) {
  const cellsByTime = useMemo(
    () =>
      new Map(
        cells.map((cell) => [
          `${cell.weekday}-${cell.startHour}`,
          cell.streamCount,
        ]),
      ),
    [cells],
  );

  return (
    <section className="h-full rounded-xl border border-light-gray-200/50 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-gray-900/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {labels.subtitle}
          </p>
        </div>
        <ArchivePeriodSelect
          years={years}
          selectedYear={selectedYear}
          allTimeOptionLabel={labels.allTimeOptionLabel}
          ariaLabel={labels.yearSelectAriaLabel}
          onSelectedYearChange={onSelectedYearChange}
        />
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="min-w-150">
          <div className="ml-12 grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-[2.5rem_repeat(7,minmax(3.5rem,1fr))] gap-1">
            {Array.from({ length: 12 }, (_, rowIndex) => {
              const startHour = rowIndex * 2;
              const timeLabel = `${String(startHour).padStart(2, "0")}:00`;
              return (
                <div key={startHour} className="contents">
                  <span className="self-center text-right text-xs text-gray-500 dark:text-gray-400">
                    {timeLabel}
                  </span>
                  {Array.from({ length: 7 }, (_, weekday) => {
                    const count =
                      cellsByTime.get(`${weekday}-${startHour}`) ?? 0;
                    const label = labels.cell(
                      weekdayLabels[weekday],
                      timeLabel,
                      count,
                    );
                    return (
                      <Tooltip
                        key={`${weekday}-${startHour}`}
                        label={label}
                        withArrow
                      >
                        <span
                          aria-label={label}
                          className={`h-7 rounded border border-black/5 dark:border-white/10 ${LEVEL_CLASSES[getLevel(count, maxCount)]}`}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{labels.less}</span>
            {LEVEL_CLASSES.map((className) => (
              <span
                key={className}
                className={`h-3 w-5 rounded ${className}`}
              />
            ))}
            <span>{labels.more}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
