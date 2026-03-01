"use client";

import { useMemo } from "react";
import { Badge } from "@mantine/core";
import { FaCalendar, FaPlay, FaYoutube } from "react-icons/fa6";

import { StatisticsItem } from "../types/statisticsItem";
import YoutubeThumbnail from "../components/YoutubeThumbnail";

export type SongCountOverviewProps = {
  items: StatisticsItem[];
  primaryLabel: string;
  topLabel: string;
  totalCountLabel: string;
  countUnit: string;
  showMilestoneHighlights?: boolean;
  showTopTile?: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

type MilestoneHighlight = {
  key: string;
  title: string;
  artist: string;
  videoId: string;
  targetCount: number;
  currentViewCount: number;
  date: Date;
};

function formatMilestoneLabel(targetCount: number) {
  if (targetCount >= 10000 && targetCount % 10000 === 0) {
    return `${(targetCount / 10000).toLocaleString()}万再生達成`;
  }

  return `${targetCount.toLocaleString()}再生達成`;
}

export default function SongCountOverview({
  items,
  primaryLabel,
  topLabel,
  totalCountLabel,
  countUnit,
  showMilestoneHighlights = false,
  showTopTile = true,
}: SongCountOverviewProps) {
  const overview = useMemo(() => {
    const totalSongKinds = items.length;
    const totalSings = items.reduce((sum, item) => sum + item.count, 0);
    const topSong = items.reduce<StatisticsItem | null>((max, item) => {
      if (!max || item.count > max.count) return item;
      return max;
    }, null);

    const latestBroadcastAt = items
      .map((item) => item.lastVideo?.broadcast_at)
      .filter((date): date is string => Boolean(date))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return {
      totalSongKinds,
      totalSings,
      topSong,
      latestBroadcastAt,
    };
  }, [items]);

  const milestoneHighlights = useMemo(() => {
    if (!showMilestoneHighlights) {
      return {
        achievedInLast7Days: [] as MilestoneHighlight[],
        estimatedInNext7Days: [] as MilestoneHighlight[],
      };
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const sevenDaysLater = new Date(now.getTime() + 7 * DAY_MS);

    const achievedInLast7Days = items
      .filter((item) => item.viewMilestone?.achievedAt)
      .map((item) => {
        const achievedAt = new Date(item.viewMilestone!.achievedAt!);
        return {
          key: item.key,
          title: item.song?.title || item.key,
          artist: item.song?.artist || "",
          videoId: item.song?.video_id || "",
          targetCount: item.viewMilestone!.targetCount,
          currentViewCount: Number(item.song?.view_count ?? 0),
          date: achievedAt,
        };
      })
      .filter(
        (item) =>
          !Number.isNaN(item.date.getTime()) &&
          item.date >= sevenDaysAgo &&
          item.date <= now,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    const estimatedInNext7Days = items
      .filter((item) => item.viewMilestone?.estimatedAt)
      .map((item) => {
        const estimatedAt = new Date(item.viewMilestone!.estimatedAt!);
        return {
          key: item.key,
          title: item.song?.title || item.key,
          artist: item.song?.artist || "",
          videoId: item.song?.video_id || "",
          targetCount: item.viewMilestone!.targetCount,
          currentViewCount: Number(item.song?.view_count ?? 0),
          date: estimatedAt,
        };
      })
      .filter(
        (item) =>
          !Number.isNaN(item.date.getTime()) &&
          item.date >= startOfToday &&
          item.date <= sevenDaysLater,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);

    return {
      achievedInLast7Days,
      estimatedInNext7Days,
    };
  }, [items, showMilestoneHighlights]);

  if (items.length === 0) return null;

  return (
    <section className="pt-3 lg:pt-4">
      {!showMilestoneHighlights && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-light-gray-300 bg-light-gray-100/80 p-4 dark:border-gray-700 dark:bg-gray-800/70">
            <p className="text-xs text-light-gray-700 dark:text-light-gray-400">
              {primaryLabel}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-primary-600 dark:text-primary-500">
              {overview.totalSongKinds.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-light-gray-300 bg-light-gray-100/80 p-4 dark:border-gray-700 dark:bg-gray-800/70">
            <p className="text-xs text-light-gray-700 dark:text-light-gray-400">
              {totalCountLabel}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-primary-600 dark:text-primary-500">
              {overview.totalSings.toLocaleString()}
            </p>
          </div>
          {showTopTile && (
            <div className="rounded-lg border border-light-gray-300 bg-light-gray-100/80 p-4 dark:border-gray-700 dark:bg-gray-800/70">
              <p className="text-xs text-light-gray-700 dark:text-light-gray-400">
                {topLabel}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-light-gray-900 dark:text-light-gray-100">
                {overview.topSong?.key ?? "-"}
              </p>
              <p className="mt-1 text-xs text-light-gray-700 dark:text-light-gray-400">
                {overview.topSong?.count.toLocaleString() ?? "-"} {countUnit}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-light-gray-300 bg-light-gray-100/80 p-4 dark:border-gray-700 dark:bg-gray-800/70">
            <p className="text-xs text-light-gray-700 dark:text-light-gray-400">
              最新更新
            </p>
            <p className="mt-1 text-sm font-semibold text-light-gray-900 dark:text-light-gray-100">
              {overview.latestBroadcastAt
                ? new Date(overview.latestBroadcastAt).toLocaleDateString()
                : "-"}
            </p>
          </div>
        </div>
      )}
      {showMilestoneHighlights && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-light-gray-300 bg-light-gray-100/80 p-4 dark:border-gray-700 dark:bg-gray-800/70">
            <p className="text-xs text-light-gray-700 dark:text-light-gray-400">
              直近7日で達成
            </p>
            {milestoneHighlights.achievedInLast7Days.length === 0 ? (
              <p className="mt-2 text-xs text-light-gray-700 dark:text-light-gray-400">
                該当なし
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {milestoneHighlights.achievedInLast7Days.map((item) => (
                  <li
                    key={`achieved-${item.key}-${item.targetCount}`}
                    className="text-xs text-light-gray-900 dark:text-light-gray-100"
                  >
                    <div className="flex items-start gap-2">
                      {item.videoId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${item.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block w-16 shrink-0 overflow-hidden rounded"
                          aria-label={`${item.title} のサムネイルをYouTubeで開く`}
                        >
                          <YoutubeThumbnail
                            videoId={item.videoId}
                            alt={item.title}
                            className="aspect-video w-full"
                            imageClassName="object-cover rounded"
                          />
                        </a>
                      ) : (
                        <div className="mt-0.5 aspect-video w-16 shrink-0 rounded bg-light-gray-300 dark:bg-gray-700" />
                      )}
                      <div className="min-w-0">
                        {item.videoId ? (
                          <a
                            href={`https://www.youtube.com/watch?v=${item.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 leading-none font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
                          >
                            <FaYoutube className="h-3.5 w-3.5 shrink-0 align-middle" />
                            <span className="truncate">
                              {item.title} - {item.artist}
                            </span>
                          </a>
                        ) : (
                          <span className="font-semibold text-primary-600 dark:text-primary-500">
                            {item.title} - {item.artist}
                          </span>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-light-gray-700 dark:text-light-gray-300">
                          <span className="inline-flex items-center gap-1 leading-none">
                            <Badge
                              color="cyan"
                              size="xs"
                              className="align-middle"
                            >
                              {formatMilestoneLabel(item.targetCount)}
                            </Badge>
                          </span>
                          <span className="inline-flex items-center gap-1 leading-none">
                            <FaPlay className="h-3 w-3 shrink-0 align-middle" />
                            {item.currentViewCount.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 leading-none">
                            <FaCalendar className="h-3 w-3 shrink-0 align-middle" />
                            {item.date.toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-light-gray-300 bg-light-gray-100/80 p-4 dark:border-gray-700 dark:bg-gray-800/70">
            <p className="text-xs text-light-gray-700 dark:text-light-gray-400">
              達成見込み
            </p>
            {milestoneHighlights.estimatedInNext7Days.length === 0 ? (
              <p className="mt-2 text-xs text-light-gray-700 dark:text-light-gray-400">
                該当なし
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {milestoneHighlights.estimatedInNext7Days.map((item) => (
                  <li
                    key={`estimated-${item.key}-${item.targetCount}`}
                    className="text-xs text-light-gray-900 dark:text-light-gray-100"
                  >
                    <div className="flex items-start gap-2">
                      {item.videoId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${item.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block w-16 shrink-0 overflow-hidden rounded"
                          aria-label={`${item.title} のサムネイルをYouTubeで開く`}
                        >
                          <YoutubeThumbnail
                            videoId={item.videoId}
                            alt={item.title}
                            className="aspect-video w-full"
                            imageClassName="object-cover rounded"
                          />
                        </a>
                      ) : (
                        <div className="mt-0.5 aspect-video w-16 shrink-0 rounded bg-light-gray-300 dark:bg-gray-700" />
                      )}
                      <div className="min-w-0">
                        {item.videoId ? (
                          <a
                            href={`https://www.youtube.com/watch?v=${item.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 leading-none font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
                          >
                            <FaYoutube className="h-3.5 w-3.5 shrink-0 align-middle" />
                            <span className="truncate">
                              {item.title}
                              {item.artist ? ` - ${item.artist}` : ""}
                            </span>
                          </a>
                        ) : (
                          <span className="font-semibold text-primary-600 dark:text-primary-500">
                            {item.title}
                            {item.artist ? ` - ${item.artist}` : ""}
                          </span>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-light-gray-700 dark:text-light-gray-300">
                          <span className="inline-flex items-center gap-1 leading-none">
                            <Badge
                              color="cyan"
                              size="xs"
                              className="align-middle"
                            >
                              {formatMilestoneLabel(item.targetCount)}
                            </Badge>
                          </span>
                          <span className="inline-flex items-center gap-1 leading-none">
                            <FaPlay className="h-3 w-3 shrink-0 align-middle" />
                            {item.currentViewCount.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 leading-none">
                            <FaCalendar className="h-3 w-3 shrink-0 align-middle" />
                            {item.date.toLocaleDateString("ja-JP")} 達成見込み
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
