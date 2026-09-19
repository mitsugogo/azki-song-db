"use client";

import { Badge, Button, SegmentedControl, Skeleton } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { formatDate } from "@/app/lib/formatDate";
import {
  isKaraokeArchiveTopic,
  keepUnitArchiveItem,
  type UnitKaraokeStream,
} from "@/app/lib/unitHistory";
import type { ArchiveItem } from "@/app/types/archiveItem";
import { useUnitArchives } from "./useUnitArchives";

type Category = "all" | "karaoke" | "3d" | "event";

const toKaraokeArchiveItem = (stream: UnitKaraokeStream): ArchiveItem => ({
  sequence: 0,
  topic: "歌枠",
  title: stream.title,
  video_id: stream.videoId,
  channel_id: "",
  video_url: stream.videoUrl,
  video_duration: "",
  description: "",
  published_at: stream.broadcastAt,
  stream_started_at: stream.broadcastAt,
  timestamp_comment: "",
});

const getArchiveTime = (item: ArchiveItem) =>
  new Date(item.stream_started_at || item.published_at).getTime() || 0;

const categoryMatches = (
  item: ArchiveItem,
  category: Category,
  karaokeVideoIds: Set<string>,
) => {
  if (category === "all") return true;
  if (category === "karaoke") {
    if (karaokeVideoIds.has(item.video_id)) return true;
    if (karaokeVideoIds.size > 0) return false;
    return isKaraokeArchiveTopic(item.topic);
  }
  const topic = item.topic.toLocaleLowerCase("ja");
  const matches: Record<Exclude<Category, "karaoke" | "all">, string[]> = {
    "3d": ["3d"],
    event: ["イベント", "event", "ライブ", "live"],
  };
  return matches[category].some((word) => topic.includes(word));
};

export default function UnitStreams({
  participants,
  karaokeVideoIds,
  karaokeStreams = [],
  unitName,
}: {
  participants: string[];
  karaokeVideoIds: string[];
  karaokeStreams?: UnitKaraokeStream[];
  unitName: string;
}) {
  const t = useTranslations("Units");
  const locale = useLocale();
  const { items, isLoading } = useUnitArchives(participants);
  const [category, setCategory] = useState<Category>("all");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [visibleCount, setVisibleCount] = useState(6);
  const karaokeVideoIdSet = useMemo(
    () => new Set(karaokeVideoIds),
    [karaokeVideoIds],
  );
  const mergedItems = useMemo(() => {
    const byVideoId = new Map<string, ArchiveItem>();
    karaokeStreams.forEach((stream) => {
      byVideoId.set(stream.videoId, toKaraokeArchiveItem(stream));
    });
    items.forEach((item) => {
      if (keepUnitArchiveItem(item, karaokeVideoIdSet)) {
        byVideoId.set(item.video_id, item);
      }
    });
    return [...byVideoId.values()];
  }, [items, karaokeStreams, karaokeVideoIdSet]);

  const filtered = useMemo(
    () =>
      mergedItems
        .filter((item) => categoryMatches(item, category, karaokeVideoIdSet))
        .sort((a, b) =>
          sort === "asc"
            ? getArchiveTime(a) - getArchiveTime(b)
            : getArchiveTime(b) - getArchiveTime(a),
        ),
    [category, karaokeVideoIdSet, mergedItems, sort],
  );
  const categoryOptions = (["all", "karaoke", "3d", "event"] as const).map(
    (value) => ({ value, label: t(`streamCategory.${value}`) }),
  );

  return (
    <section aria-labelledby="unit-streams-title" className="mt-12">
      <div>
        <h2
          id="unit-streams-title"
          className="text-xl font-bold text-gray-900 dark:text-gray-100"
        >
          {t("streamsTitle")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {t("streamsDescription", { name: unitName })}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={category}
          onChange={(value) => {
            setCategory(value as Category);
            setVisibleCount(6);
          }}
          data={categoryOptions}
          className="max-w-full overflow-x-auto"
          aria-label={t("streamCategoryLabel")}
        />
        <div className="ml-auto">
          <SegmentedControl
            value={sort}
            onChange={(value) => setSort(value as "asc" | "desc")}
            data={[
              { value: "desc", label: t("newestFirst") },
              { value: "asc", label: t("oldestFirst") },
            ]}
            aria-label={t("streamSortLabel")}
          />
        </div>
      </div>

      {isLoading && filtered.length === 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} height={250} radius="md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-5 rounded-md border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("streamsEmpty")}
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visibleCount).map((item) => (
              <article
                key={item.video_id}
                className="card-glassmorphism overflow-hidden border border-primary/10 shadow-none! dark:border-white/25 dark:shadow-none!"
              >
                <Link
                  href={item.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <YoutubeThumbnail videoId={item.video_id} alt={item.title} />
                </Link>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <time className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(
                        item.stream_started_at || item.published_at,
                        locale,
                      )}
                    </time>
                    {item.topic && <Badge variant="light">{item.topic}</Badge>}
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-gray-900 dark:text-gray-100">
                    <Link
                      href={item.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title}
                    </Link>
                  </h3>
                </div>
              </article>
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div className="mt-5 text-center">
              <Button
                variant="light"
                onClick={() => setVisibleCount((count) => count + 6)}
              >
                {t("showMore", { count: filtered.length - visibleCount })}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
