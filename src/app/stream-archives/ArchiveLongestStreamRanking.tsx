"use client";

import {
  Drawer,
  Progress,
  Text,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import ArchiveItemDetail from "./ArchiveItemDetail";
import ArchivePeriodSelect from "./ArchivePeriodSelect";
import type {
  ArchiveLongestStreamRankingItem,
  ArchiveStatsItem,
} from "./archiveStats";

type ArchiveLongestStreamRankingProps = {
  items: ArchiveLongestStreamRankingItem[];
  years: number[];
  selectedYear: string | null;
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    noData: string;
    allTimeOptionLabel: string;
    yearSelectAriaLabel: string;
    itemLabel: (rank: number, title: string, duration: string) => string;
    gauge: (title: string, duration: string) => string;
    thumbnail: (title: string) => string;
    detailCloseLabel: string;
    appWatchLabel: string;
    castLabel: string;
    timestampLabel: string;
  };
  formatDuration: (seconds: number) => string;
  onSelectedYearChange: (year: string | null) => void;
};

export default function ArchiveLongestStreamRanking({
  items,
  years,
  selectedYear,
  locale,
  labels,
  formatDuration,
  onSelectedYearChange,
}: ArchiveLongestStreamRankingProps) {
  const maxDuration = items[0]?.durationSeconds ?? 0;
  const [detailItem, setDetailItem] = useState<ArchiveStatsItem | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const handleOpenDetail = (item: ArchiveStatsItem) => {
    setDetailItem(item);
    openDrawer();
  };

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
        <ArchivePeriodSelect
          years={years}
          selectedYear={selectedYear}
          allTimeOptionLabel={labels.allTimeOptionLabel}
          ariaLabel={labels.yearSelectAriaLabel}
          className="w-full sm:w-32"
          onSelectedYearChange={onSelectedYearChange}
        />
      </div>

      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          {labels.noData}
        </Text>
      ) : (
        <ol className="space-y-3.5">
          {items.map((item, index) => {
            const rank = index + 1;
            const duration = formatDuration(item.durationSeconds);

            return (
              <li key={item.key}>
                <UnstyledButton
                  type="button"
                  aria-label={labels.itemLabel(rank, item.title, duration)}
                  className="group grid w-full grid-cols-[1.5rem_5rem_minmax(0,1fr)_auto] items-center gap-x-2 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
                  onClick={() => handleOpenDetail(item.item)}
                >
                  <Text
                    c="dimmed"
                    ta="right"
                    size="sm"
                    fw={600}
                    className="row-span-2"
                  >
                    {rank}
                  </Text>
                  <div className="row-span-2 aspect-video w-20 overflow-hidden rounded-md">
                    <YoutubeThumbnail
                      videoId={item.videoId}
                      alt={labels.thumbnail(item.title)}
                    />
                  </div>
                  <Text
                    lineClamp={2}
                    size="xs"
                    className="min-w-0 wrap-break-word leading-tight transition group-hover:text-primary dark:group-hover:text-primary-200"
                  >
                    {item.title}
                  </Text>
                  <Text
                    c="dimmed"
                    size="xs"
                    className="whitespace-nowrap tabular-nums"
                  >
                    {duration}
                  </Text>
                  <Progress
                    value={
                      maxDuration > 0
                        ? (item.durationSeconds / maxDuration) * 100
                        : 0
                    }
                    aria-label={labels.gauge(item.title, duration)}
                    color="hololive.2"
                    size="sm"
                    radius="xl"
                    className="col-start-3 col-end-5 mt-1 min-w-0"
                  />
                </UnstyledButton>
              </li>
            );
          })}
        </ol>
      )}

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        onExitTransitionEnd={() => setDetailItem(null)}
        position="right"
        size="lg"
        title={<VisuallyHidden>{detailItem?.title ?? ""}</VisuallyHidden>}
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
        ) : null}
      </Drawer>
    </section>
  );
}
