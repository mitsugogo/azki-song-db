"use client";

import { Badge, Text } from "@mantine/core";
import { HiPlay } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import { formatDate } from "../lib/formatDate";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import ArchiveParticipantList from "./ArchiveParticipantList";
import TimestampComment from "./TimestampComment";
import type { ArchiveStatsItem } from "./archiveStats";

type ArchiveItemDetailProps = {
  item: ArchiveStatsItem;
  locale: string;
  labels: {
    appWatchLabel: string;
    castLabel: string;
    timestampLabel: string;
  };
};

const formatArchiveDetailDate = (value: string, locale: string) => {
  if (!value) {
    return "-";
  }

  return formatDate(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
};

export default function ArchiveItemDetail({
  item,
  locale,
  labels,
}: ArchiveItemDetailProps) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="overflow-hidden rounded-lg bg-black">
        <YoutubeThumbnail videoId={item.video_id} alt={item.title} />
      </div>

      <div>
        <h2 className="text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">
          {item.title}
        </h2>
        <Text className="mt-1" c="dimmed" fz="sm">
          {formatArchiveDetailDate(item.stream_started_at, locale)}
          {item.video_duration ? ` · ${item.video_duration}` : ""}
        </Text>
      </div>

      <Link
        href={item.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        <HiPlay className="h-4 w-4" />
        {labels.appWatchLabel}
      </Link>

      {item.topic ? (
        <Badge color="pink" variant="light" className="w-fit">
          {item.topic}
        </Badge>
      ) : null}

      {item.participantEntries.length > 0 ? (
        <div>
          <Text c="dimmed" fz="xs" fw={600}>
            {labels.castLabel}
          </Text>
          <div className="mt-1">
            <ArchiveParticipantList participants={item.participantEntries} />
          </div>
        </div>
      ) : null}

      {item.description ? (
        <p className="whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
          {item.description}
        </p>
      ) : null}

      {item.timestamp_comment ? (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {labels.timestampLabel}
          </p>
          <div className="mt-1">
            <TimestampComment
              comment={item.timestamp_comment}
              videoId={item.video_id}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
