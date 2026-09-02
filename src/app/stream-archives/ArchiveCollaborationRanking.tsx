"use client";

import {
  Avatar,
  Progress,
  SegmentedControl,
  Select,
  Text,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { memo, useId, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { HiUser, HiUserGroup } from "react-icons/hi";
import type { ArchiveCollaborationRankingItem } from "./archiveCollaborationData";

const ALL_TIME_VALUE = "all";
const MAX_VISIBLE_AVATARS = 3;

export type ArchiveCollaborationRankingMode = "member" | "combination";

type ArchiveCollaborationRankingProps = {
  items: ArchiveCollaborationRankingItem[];
  years: number[];
  selectedYear: string | null;
  mode: ArchiveCollaborationRankingMode;
  labels: {
    title: string;
    subtitle: string;
    count: (count: number) => string;
    itemLabel: (rank: number, name: string, count: number) => string;
    noData: string;
    allTimeOptionLabel: string;
    yearSelectAriaLabel: string;
    modeSwitchAriaLabel: string;
    memberModeLabel: string;
    combinationModeLabel: string;
    firstCollaboration: (date: string, duration: string) => string;
  };
  formatDuration: (seconds: number) => string;
  formatDate: (dateKey: string) => string;
  getHref?: (name: string) => string;
  onSelectedYearChange: (year: string | null) => void;
  onModeChange: (mode: ArchiveCollaborationRankingMode) => void;
};

const getArchiveCastHref = (castNames: string[]) => {
  const params = new URLSearchParams();
  castNames.forEach((name) => params.append("cast", name));
  return `/stream-archives/list?${params.toString()}`;
};

const ArchiveCollaborationRanking = memo(function ArchiveCollaborationRanking({
  items,
  years,
  selectedYear,
  mode,
  labels,
  formatDuration,
  formatDate,
  getHref,
  onSelectedYearChange,
  onModeChange,
}: ArchiveCollaborationRankingProps) {
  const rankingId = useId();
  const maxCount = items[0]?.count ?? 0;
  const yearOptions = useMemo(
    () => [
      { value: ALL_TIME_VALUE, label: labels.allTimeOptionLabel },
      ...years.map((year) => ({ value: String(year), label: String(year) })),
    ],
    [labels.allTimeOptionLabel, years],
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
          <SegmentedControl
            aria-label={labels.modeSwitchAriaLabel}
            value={mode}
            onChange={(value) =>
              onModeChange(value as ArchiveCollaborationRankingMode)
            }
            size="sm"
            data={[
              {
                value: "member",
                label: (
                  <Tooltip label={labels.memberModeLabel} withArrow>
                    <span className="flex items-center justify-center">
                      <HiUser className="h-4 w-4" aria-hidden="true" />
                      <VisuallyHidden>{labels.memberModeLabel}</VisuallyHidden>
                    </span>
                  </Tooltip>
                ),
              },
              {
                value: "combination",
                label: (
                  <Tooltip label={labels.combinationModeLabel} withArrow>
                    <span className="flex items-center justify-center">
                      <HiUserGroup className="h-4 w-4" aria-hidden="true" />
                      <VisuallyHidden>
                        {labels.combinationModeLabel}
                      </VisuallyHidden>
                    </span>
                  </Tooltip>
                ),
              },
            ]}
          />
          <Select
            aria-label={labels.yearSelectAriaLabel}
            data={yearOptions}
            value={selectedYear ?? ALL_TIME_VALUE}
            onChange={(value) =>
              onSelectedYearChange(
                !value || value === ALL_TIME_VALUE ? null : value,
              )
            }
            allowDeselect={false}
            className="min-w-0 flex-1 sm:w-32 sm:flex-none"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          {labels.noData}
        </Text>
      ) : (
        <ol className="space-y-3.5">
          {items.map((item, index) => {
            const rank = index + 1;
            const itemLabel = labels.itemLabel(rank, item.name, item.count);
            const detailId = `${rankingId}-${index}-details`;
            const showFirstCollaboration =
              selectedYear === null && item.firstCollaborationDate;

            return (
              <li key={item.key}>
                <Link
                  href={
                    getHref?.(item.name) ?? getArchiveCastHref(item.castNames)
                  }
                  aria-label={itemLabel}
                  aria-describedby={detailId}
                  className={`group grid items-center gap-x-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    mode === "combination"
                      ? "grid-cols-[1.5rem_4rem_minmax(0,1fr)_auto]"
                      : "grid-cols-[1.5rem_1.625rem_minmax(0,1fr)_auto]"
                  }`}
                >
                  <Text c="dimmed" ta="right" size="sm" fw={600}>
                    {rank}
                  </Text>
                  <Avatar.Group spacing="sm">
                    {item.participantEntries
                      .slice(0, MAX_VISIBLE_AVATARS)
                      .map((participant) => (
                        <Avatar
                          key={
                            participant.channel?.youtubeId || participant.name
                          }
                          src={participant.channel?.iconUrl || null}
                          alt={participant.name}
                          size="sm"
                          radius="xl"
                        >
                          {participant.name.slice(0, 1)}
                        </Avatar>
                      ))}
                    {item.participantEntries.length > MAX_VISIBLE_AVATARS ? (
                      <Avatar size="sm" radius="xl">
                        +{item.participantEntries.length - MAX_VISIBLE_AVATARS}
                      </Avatar>
                    ) : null}
                  </Avatar.Group>
                  <Text
                    truncate
                    fw={500}
                    className="transition group-hover:text-primary group-hover:underline dark:group-hover:text-primary-200"
                  >
                    {item.name}
                  </Text>
                  <Text fw={600} className="tabular-nums">
                    {labels.count(item.count)}
                  </Text>
                  <div
                    id={detailId}
                    className="col-start-3 col-end-5 mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 text-[0.7rem] leading-tight text-gray-500 dark:text-gray-400"
                  >
                    <span>
                      {showFirstCollaboration
                        ? labels.firstCollaboration(
                            formatDate(item.firstCollaborationDate!),
                            formatDuration(item.totalDurationSeconds),
                          )
                        : formatDuration(item.totalDurationSeconds)}
                    </span>
                  </div>
                  <Progress
                    value={maxCount > 0 ? (item.count / maxCount) * 100 : 0}
                    aria-label={itemLabel}
                    color="cyan"
                    size="sm"
                    radius="xl"
                    className="col-start-3 col-end-5 mt-1"
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
});

export default ArchiveCollaborationRanking;
