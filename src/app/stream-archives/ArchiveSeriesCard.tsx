"use client";

import { Link } from "@/i18n/navigation";
import { Text } from "@mantine/core";
import Image from "next/image";
import { BiSolidVideos } from "react-icons/bi";
import type { ArchiveSeriesGroup } from "./archiveSeries";

type ArchiveSeriesCardProps = {
  group: ArchiveSeriesGroup;
  itemsCountLabel: string;
  totalDurationLabel: string;
  latestDateLabel: string;
  openSeriesLabel: string;
  headingLevel?: "h2" | "h3";
  href?: string;
  onSelect?: (seriesKey: string) => void;
};

const getThumbnailUrl = (videoId: string) =>
  `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;

export default function ArchiveSeriesCard({
  group,
  itemsCountLabel,
  totalDurationLabel,
  latestDateLabel,
  openSeriesLabel,
  headingLevel: Heading = "h2",
  href,
  onSelect,
}: ArchiveSeriesCardProps) {
  const content = (
    <>
      <div className="relative pt-2">
        <span className="absolute inset-x-7 top-0 h-3 rounded-t-lg bg-gray-300/70 dark:bg-gray-700/80" />
        <span className="absolute inset-x-4 top-1 h-3 rounded-t-lg bg-gray-400/70 dark:bg-gray-600/80" />
        <div className="relative overflow-hidden rounded-lg bg-black shadow-sm ring-1 ring-black/10 transition group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary/50 dark:ring-white/10">
          <Image
            src={getThumbnailUrl(group.latestItem.video_id)}
            width={320}
            height={180}
            alt={group.latestItem.title}
            loading="lazy"
            decoding="async"
            className="aspect-video w-full object-cover transition duration-200 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <span className="absolute bottom-2 right-2 flex flex-col items-end gap-0.5 rounded bg-black/75 px-2 py-1 text-xs font-semibold leading-none text-white shadow-sm">
            <span className="inline-flex items-center gap-1">
              <BiSolidVideos aria-hidden="true" className="h-3.5 w-3.5" />
              {itemsCountLabel}
            </span>
            <span className="tabular-nums">{totalDurationLabel}</span>
          </span>
        </div>
      </div>
      <Heading className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition group-hover:text-primary dark:text-gray-100 dark:group-hover:text-primary-200">
        {group.title}
      </Heading>
      <Text className="mt-1" c="dimmed" fz="xs">
        {latestDateLabel}
      </Text>
    </>
  );
  const className =
    "group block min-w-0 cursor-pointer text-left focus:outline-none";

  if (href) {
    return (
      <Link href={href} aria-label={openSeriesLabel} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={openSeriesLabel}
      onClick={() => onSelect?.(group.key)}
      className={className}
    >
      {content}
    </button>
  );
}
