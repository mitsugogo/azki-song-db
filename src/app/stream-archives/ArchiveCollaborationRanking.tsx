"use client";

import {
  Avatar,
  Badge,
  Progress,
  SegmentedControl,
  Select,
  Text,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { memo, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { HiUser, HiUserGroup } from "react-icons/hi";
import type { ArchiveParticipantEntry } from "../lib/archiveParticipants";
import {
  getArchiveHololiveMemberMetadata,
  type ArchiveCollaborationRankingItem,
} from "./archiveCollaborationData";

const ALL_TIME_VALUE = "all";
const MAX_VISIBLE_AVATARS = 3;

export type ArchiveCollaborationRankingMode = "member" | "combination";

type ArchiveCollaborationRankingProps = {
  items: ArchiveCollaborationRankingItem[];
  membersWithoutCollaboration: ArchiveParticipantEntry[];
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
    noCollaboration: string;
  };
  formatDuration: (seconds: number) => string;
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
  membersWithoutCollaboration,
  years,
  selectedYear,
  mode,
  labels,
  formatDuration,
  getHref,
  onSelectedYearChange,
  onModeChange,
}: ArchiveCollaborationRankingProps) {
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
            const memberMetadata =
              mode === "member"
                ? getArchiveHololiveMemberMetadata(item.participantEntries[0])
                : { generation: "", status: null };
            const duration = formatDuration(item.totalDurationSeconds);
            const accessibleLabel = [
              itemLabel,
              memberMetadata.generation ? `[${memberMetadata.generation}]` : "",
              memberMetadata.status ? `(${memberMetadata.status})` : "",
              duration,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={item.key}>
                <Link
                  href={
                    getHref?.(item.name) ?? getArchiveCastHref(item.castNames)
                  }
                  aria-label={accessibleLabel}
                  className={`group grid items-center gap-x-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    mode === "combination"
                      ? "grid-cols-[1.5rem_7.25rem_minmax(0,1fr)]"
                      : "grid-cols-[1.5rem_2.5rem_minmax(0,1fr)]"
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
                          size="md"
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
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <Text
                        component="span"
                        fw={500}
                        className="min-w-0 break-words transition group-hover:text-primary group-hover:underline dark:group-hover:text-primary-200"
                      >
                        {item.name}
                      </Text>
                      {memberMetadata.generation ? (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="hololive.2"
                          autoContrast
                        >
                          {memberMetadata.generation}
                        </Badge>
                      ) : null}
                      {memberMetadata.status ? (
                        <Text component="span" c="dimmed" size="xs">
                          {memberMetadata.status}
                        </Text>
                      ) : null}
                      <Text
                        component="span"
                        c="dimmed"
                        size="xs"
                        className="whitespace-nowrap tabular-nums"
                      >
                        {duration}
                      </Text>
                    </div>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <Progress
                        value={maxCount > 0 ? (item.count / maxCount) * 100 : 0}
                        aria-label={itemLabel}
                        color="hololive.2"
                        size="sm"
                        radius="xl"
                        className="min-w-0 flex-1"
                      />
                      <Text
                        fw={600}
                        size="xs"
                        className="shrink-0 tabular-nums"
                      >
                        {labels.count(item.count)}
                      </Text>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {mode === "member" && membersWithoutCollaboration.length > 0 ? (
        <div
          role="group"
          aria-label={labels.noCollaboration}
          className="mt-4 min-w-0 border-t border-light-gray-200/70 pt-3 dark:border-white/10"
        >
          <Text c="dimmed" size="xs" fw={500} mb={8}>
            {labels.noCollaboration}
          </Text>
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-1">
            <Avatar.Group spacing="none" className="w-max py-0.5">
              {membersWithoutCollaboration.map((participant, idx) => (
                <Tooltip
                  key={`${participant.channel?.youtubeId || participant.name}-${idx}`}
                  label={participant.name}
                  withArrow
                >
                  <Avatar
                    src={participant.channel?.iconUrl || null}
                    alt={participant.name}
                    size="md"
                    radius="xl"
                    color="pink"
                  >
                    {participant.name.slice(0, 1)}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          </div>
        </div>
      ) : null}
    </section>
  );
});

export default ArchiveCollaborationRanking;
