"use client";

import { Select, Text } from "@mantine/core";
import { useMemo, useState } from "react";
import { HiArrowsUpDown } from "react-icons/hi2";
import type { ArchiveStatsItem } from "./archiveStats";
import ArchiveSeriesCard from "./ArchiveSeriesCard";
import {
  createArchiveSeriesGroups,
  formatArchiveDate,
  formatArchiveSeriesDuration,
} from "./archiveSeries";

type ArchiveSeriesSort = "duration" | "videos" | "recent";

type ArchiveSeriesOverviewProps = {
  items: ArchiveStatsItem[];
  locale: string;
  uncategorizedLabel: string;
  labels: {
    title: string;
    sortLabel: string;
    sortByDuration: string;
    sortByVideos: string;
    sortByRecent: string;
    itemsCount: (count: number) => string;
    openSeries: (title: string) => string;
    noData: string;
  };
};

export default function ArchiveSeriesOverview({
  items,
  locale,
  uncategorizedLabel,
  labels,
}: ArchiveSeriesOverviewProps) {
  const [sort, setSort] = useState<ArchiveSeriesSort>("recent");
  const groups = useMemo(() => {
    const collator = new Intl.Collator(locale, {
      numeric: true,
      sensitivity: "base",
    });

    return createArchiveSeriesGroups(items, uncategorizedLabel).sort(
      (left, right) => {
        const difference =
          sort === "duration"
            ? right.totalDurationSeconds - left.totalDurationSeconds
            : sort === "videos"
              ? right.items.length - left.items.length
              : right.latestStreamStartedAtMs - left.latestStreamStartedAtMs;

        return (
          difference ||
          right.latestStreamStartedAtMs - left.latestStreamStartedAtMs ||
          collator.compare(left.title, right.title)
        );
      },
    );
  }, [items, locale, sort, uncategorizedLabel]);

  return (
    <section className="min-w-0 rounded-xl border border-light-gray-200/50 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-gray-900/50">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {labels.title}
        </h2>
        <Select
          aria-label={labels.sortLabel}
          value={sort}
          onChange={(value) =>
            setSort((value as ArchiveSeriesSort) ?? "recent")
          }
          allowDeselect={false}
          leftSection={<HiArrowsUpDown aria-hidden="true" />}
          data={[
            { value: "duration", label: labels.sortByDuration },
            { value: "videos", label: labels.sortByVideos },
            { value: "recent", label: labels.sortByRecent },
          ]}
          className="w-full sm:w-64"
        />
      </div>

      {groups.length === 0 ? (
        <Text c="dimmed" size="sm">
          {labels.noData}
        </Text>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {groups.map((group) => (
            <ArchiveSeriesCard
              key={group.key}
              group={group}
              headingLevel="h3"
              itemsCountLabel={labels.itemsCount(group.items.length)}
              totalDurationLabel={formatArchiveSeriesDuration(
                group.totalDurationSeconds,
              )}
              latestDateLabel={formatArchiveDate(
                group.latestStreamStartedAt,
                locale,
              )}
              openSeriesLabel={labels.openSeries(group.title)}
              href={`/stream-archives/list?series=${encodeURIComponent(group.key)}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
