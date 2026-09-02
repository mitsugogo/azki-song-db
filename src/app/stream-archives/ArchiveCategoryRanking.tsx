"use client";

import { Link } from "@/i18n/navigation";
import { Progress, SegmentedControl, Text } from "@mantine/core";
import { useMemo, useState } from "react";
import ArchivePeriodSelect from "./ArchivePeriodSelect";
import type { ArchiveCategoryStats } from "./archiveStats";

type RankingMetric = "streams" | "duration";

type ArchiveCategoryRankingProps = {
  items: ArchiveCategoryStats[];
  years: number[];
  selectedYear: string | null;
  labels: {
    title: string;
    subtitle: string;
    streams: (count: number) => string;
    duration: (duration: string) => string;
    streamGauge: (name: string, count: number) => string;
    durationGauge: (name: string, duration: string) => string;
    metricStreams: string;
    metricDuration: string;
    metricSwitchAriaLabel: string;
    noData: string;
    allTimeOptionLabel: string;
    yearSelectAriaLabel: string;
  };
  formatDuration: (seconds: number) => string;
  onSelectedYearChange: (year: string | null) => void;
};

export default function ArchiveCategoryRanking({
  items,
  years,
  selectedYear,
  labels,
  formatDuration,
  onSelectedYearChange,
}: ArchiveCategoryRankingProps) {
  const [metric, setMetric] = useState<RankingMetric>("streams");
  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) =>
        metric === "streams"
          ? right.streamCount - left.streamCount
          : right.totalDurationSeconds - left.totalDurationSeconds,
      ),
    [items, metric],
  );
  const maxStreams = Math.max(
    0,
    ...sortedItems.map((item) => item.streamCount),
  );
  const maxDuration = Math.max(
    0,
    ...sortedItems.map((item) => item.totalDurationSeconds),
  );

  return (
    <section className="h-full rounded-xl border border-light-gray-200/50 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-gray-900/50">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-gray-100">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {labels.subtitle}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {items.length > 0 ? (
            <SegmentedControl
              value={metric}
              onChange={(value) => setMetric(value as RankingMetric)}
              aria-label={labels.metricSwitchAriaLabel}
              size="sm"
              data={[
                { value: "streams", label: labels.metricStreams },
                { value: "duration", label: labels.metricDuration },
              ]}
            />
          ) : null}
          <ArchivePeriodSelect
            years={years}
            selectedYear={selectedYear}
            allTimeOptionLabel={labels.allTimeOptionLabel}
            ariaLabel={labels.yearSelectAriaLabel}
            className="min-w-0 flex-1 sm:w-32 sm:flex-none"
            onSelectedYearChange={onSelectedYearChange}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          {labels.noData}
        </Text>
      ) : (
        <ol className="space-y-3.5">
          {sortedItems.map((item, index) => {
            const duration = formatDuration(item.totalDurationSeconds);
            return (
              <li key={item.key}>
                <Link
                  href={`/stream-archives/list?series=${encodeURIComponent(item.key)}`}
                  className="group grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <Text c="dimmed" ta="right" size="sm" fw={600}>
                    {index + 1}
                  </Text>
                  <Text
                    fw={500}
                    className="min-w-0 wrap-break-word transition group-hover:text-primary dark:group-hover:text-primary-200"
                  >
                    {item.name}
                  </Text>
                  <div className="col-start-2 mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
                    {metric === "streams" ? (
                      <>
                        <Progress
                          value={
                            maxStreams > 0
                              ? (item.streamCount / maxStreams) * 100
                              : 0
                          }
                          aria-label={labels.streamGauge(
                            item.name,
                            item.streamCount,
                          )}
                          color="hololive.2"
                          size="sm"
                          radius="xl"
                        />
                        <Text
                          fw={600}
                          size="xs"
                          className="shrink-0 tabular-nums"
                        >
                          {labels.streams(item.streamCount)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Progress
                          value={
                            maxDuration > 0
                              ? (item.totalDurationSeconds / maxDuration) * 100
                              : 0
                          }
                          aria-label={labels.durationGauge(item.name, duration)}
                          color="hololive.2"
                          size="sm"
                          radius="xl"
                        />
                        <Text
                          fw={600}
                          size="xs"
                          className="shrink-0 tabular-nums"
                        >
                          {labels.duration(duration)}
                        </Text>
                      </>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
