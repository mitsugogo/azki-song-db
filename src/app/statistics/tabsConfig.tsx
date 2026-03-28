/* eslint @typescript-eslint/no-explicit-any: off */
import { Link } from "@/i18n/navigation";
import { Badge } from "flowbite-react";
import { HiMusicNote, HiUserCircle, HiPlay, HiTag } from "react-icons/hi";
import { FaStar, FaYoutube, FaCompactDisc, FaDatabase } from "react-icons/fa6";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "../lib/formatDate";

import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "../config/filters";
import {
  renderLastVideoCell,
  renderViewCountCell,
  viewCountSortFn,
} from "../lib/statisticsRenderers";
import { Song } from "../types/song";
import { StatisticsItem } from "../types/statisticsItem";
import { FC, SVGProps, use } from "react";

type TabConfig = {
  title: string;
  icon: FC<SVGProps<SVGSVGElement>>;
  dataKey: keyof ReturnType<
    typeof import("../hook/useStatistics").useStatistics
  >;
  caption: string;
  description: string;
  initialSort: { id: string; direction: "asc" | "desc" };
  minWidth?: number | string;
  columns: ColumnDef<StatisticsItem, any>[];
};

type Translate = (key: string) => string;

const getDiscographyLink = (song: Song) => {
  if (!song?.slugv2) return null;

  if (isPossibleOriginalSong(song)) {
    return `/discography/originals/${encodeURIComponent(song.slugv2)}`;
  }
  if (isCollaborationSong(song)) {
    return `/discography/collaborations/${encodeURIComponent(song.slugv2)}`;
  }
  if (isCoverSong(song)) {
    return `/discography/covers/${encodeURIComponent(song.slugv2)}`;
  }
  return null;
};

export const getTabsConfig = (t: Translate): TabConfig[] => [
  // 1. 曲名別
  {
    title: t("tabs.songCounts.title"),
    icon: HiMusicNote,
    dataKey: "songCounts",
    caption: t("tabs.songCounts.caption"),
    description: t("tabs.songCounts.description"),
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: t("columns.songName"),
        cell: (info) => (
          <Link
            href={`/?q=title:${info.getValue<string>()}`}
            className="font-semibold text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 300,
      },
      { accessorKey: "song.artist", header: t("columns.artistName") },
      { accessorKey: "count", header: t("columns.count") },
      {
        accessorKey: "lastVideo",
        header: t("columns.latest"),
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        minSize: 800,
      },
    ],
  },
  // 2. アーティスト名別
  {
    title: t("tabs.artistCounts.title"),
    icon: HiUserCircle,
    dataKey: "artistCounts",
    caption: t("tabs.artistCounts.caption"),
    description: t("tabs.artistCounts.description"),
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: t("columns.artistName"),
        cell: (info) => (
          <Link
            href={`/?q=artist:${info.getValue<string>()}`}
            className="font-semibold text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 300,
      },
      { accessorKey: "count", header: t("columns.count") },
      {
        accessorKey: "lastVideo",
        header: t("columns.latest"),
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        size: 800,
      },
    ],
  },
  // 3. オリ曲 (回数)
  {
    title: t("tabs.originalSongCounts.title"),
    icon: HiPlay,
    dataKey: "originalSongCounts",
    caption: t("tabs.originalSongCounts.caption"),
    description: t("tabs.originalSongCounts.description"),
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: t("columns.songName"),
        cell: (info) => (
          <Link
            href={`/?q=title:${info.getValue<string>()}`}
            className="font-semibold text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 300,
      },
      { accessorKey: "count", header: t("columns.count") },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo",
        header: t("columns.latest"),
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        size: 800,
      },
    ],
  },
  // 4. タグ
  {
    title: t("tabs.tagCounts.title"),
    icon: HiTag,
    dataKey: "tagCounts",
    caption: t("tabs.tagCounts.caption"),
    description: t("tabs.tagCounts.description"),
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: t("columns.tag"),
        cell: (info) => (
          <Link
            href={`/?q=tag:${info.getValue<string>()}`}
            className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            <Badge className="inline lg:whitespace-nowrap">
              {info.getValue<string>()}
            </Badge>
          </Link>
        ),
        size: 200,
      },
      {
        accessorKey: "count",
        header: t("columns.recordedCount"),
        cell: (info) => info.getValue().toLocaleString(),
      },
      {
        accessorKey: "lastVideo",
        header: t("columns.latest"),
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        size: 800,
      },
    ],
  },
  // 5. マイルストーン
  {
    title: t("tabs.milestoneCounts.title"),
    icon: FaStar,
    dataKey: "milestoneCounts",
    caption: t("tabs.milestoneCounts.caption"),
    description: t("tabs.milestoneCounts.description"),
    initialSort: { id: "broadcast_at", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: t("columns.milestone"),
        cell: (info) => (
          <Link
            href={`/?q=milestone:${info.getValue<string>()}`}
            className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            <Badge className="inline lg:whitespace-nowrap">
              {info.getValue<string>()}
            </Badge>
          </Link>
        ),
        size: 300,
      },
      {
        id: "broadcast_at",
        accessorKey: "lastVideo.broadcast_at",
        header: t("columns.achievedDate"),
        cell: (info) =>
          info.getValue<string>() && formatDate(info.getValue<string>()),
      },
      {
        accessorKey: "lastVideo",
        header: t("columns.latest"),
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        size: 800,
      },
    ],
  },
  // 6. 収録動画
  {
    title: t("tabs.videoCounts.title"),
    icon: FaYoutube,
    dataKey: "videoCounts",
    caption: t("tabs.videoCounts.caption"),
    description: t("tabs.videoCounts.description"),
    initialSort: { id: "lastVideo.broadcast_at", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        id: "lastVideo.video_title",
        accessorKey: "lastVideo",
        header: t("columns.video"),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.lastVideo?.video_title || "";
          const b = rowB.original.lastVideo?.video_title || "";
          return a.localeCompare(b);
        },
        cell: (info) =>
          renderLastVideoCell(info.getValue<Song>(), false, false),
        size: 800,
      },
      {
        accessorKey: "count",
        header: t("columns.songCount"),
        cell: (info) => info.getValue<number>(),
      },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo.broadcast_at",
        header: t("columns.broadcastDate"),
        cell: (info) =>
          info.getValue<string>() && formatDate(info.getValue<string>()),
        size: 800,
      },
    ],
  },
  // 7. オリ曲 (リリース日)
  {
    title: t("tabs.originalByRelease.title"),
    icon: FaCompactDisc,
    dataKey: "originalSongCountsByReleaseDate",
    caption: t("tabs.originalByRelease.caption"),
    description: t("tabs.originalByRelease.description"),
    initialSort: { id: "broadcast_at", direction: "desc" },
    minWidth: 1700,
    columns: [
      {
        id: "discographyLink",
        header: t("columns.detail"),
        enableSorting: false,
        cell: (info) => {
          const href = getDiscographyLink(info.row.original.song);
          if (!href) return null;

          return (
            <Link
              href={href}
              className="inline-flex items-center whitespace-nowrap rounded-md border border-primary-300 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 dark:border-primary-700"
            >
              {t("columns.detail")}
            </Link>
          );
        },
        size: 90,
      },
      {
        accessorKey: "song.title",
        header: t("columns.songName"),
        cell: (info) => (
          <Link
            href={`/?q=title:${info.getValue<string>()}`}
            className="font-semibold text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 300,
      },
      {
        accessorKey: "song.artist",
        header: t("columns.artist"),
        cell: (info) => (
          <Link
            href={`/?q=artist:${info.getValue<string>()}`}
            className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 200,
      },
      {
        id: "viewCount",
        accessorKey: "song.view_count",
        accessorFn: (row) =>
          row.effectiveViewCount ?? row.song?.view_count ?? 0,
        header: t("columns.viewCount"),
        cell: (info) => {
          const value = Number(info.getValue<number>() ?? 0);
          return value > 0 ? value.toLocaleString() : "-";
        },
      },
      {
        id: "viewCountLbl",
        accessorFn: (row) =>
          row.effectiveViewCount ?? row.song?.view_count ?? 0,
        header: t("columns.viewCountLabel"),
        cell: (info) =>
          renderViewCountCell(
            info.getValue<number>(),
            info.row.original.viewMilestone,
          ),
        sortingFn: viewCountSortFn,
        size: 180,
      },
      {
        id: "broadcast_at",
        accessorKey: "firstVideo.broadcast_at",
        header: t("columns.releaseOrPremiereDate"),
        cell: (info) => formatDate(info.getValue<number>()),
      },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo",
        header: t("columns.latest"),
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        size: 600,
      },
    ],
  },
  // 8. カバー楽曲
  {
    title: t("tabs.coverByRelease.title"),
    icon: HiMusicNote,
    dataKey: "coverSongCountsByReleaseDate",
    caption: t("tabs.coverByRelease.caption"),
    description: t("tabs.coverByRelease.description"),
    initialSort: { id: "broadcast_at", direction: "desc" },
    minWidth: 1700,
    columns: [
      {
        id: "discographyLink",
        header: t("columns.detail"),
        enableSorting: false,
        cell: (info) => {
          const href = getDiscographyLink(info.row.original.song);
          if (!href) return null;

          return (
            <Link
              href={href}
              className="inline-flex items-center whitespace-nowrap rounded-md border border-primary-300 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 dark:border-primary-700"
            >
              {t("columns.detail")}
            </Link>
          );
        },
        size: 90,
      },
      {
        accessorKey: "song.title",
        header: t("columns.songName"),
        cell: (info) => (
          <Link
            href={`/?q=title:${info.getValue<string>()}`}
            className="font-semibold text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 300,
      },
      {
        accessorKey: "song.artist",
        header: t("columns.artist"),
        cell: (info) => (
          <Link
            href={`/?q=artist:${info.getValue<string>()}`}
            className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 300,
      },
      {
        accessorKey: "song.sing",
        header: t("columns.singers"),
        cell: (info) => info.getValue<string>(),
      },
      {
        id: "viewCount",
        accessorKey: "song.view_count",
        accessorFn: (row) =>
          row.effectiveViewCount ?? row.song?.view_count ?? 0,
        header: t("columns.viewCount"),
        cell: (info) =>
          Number(info.getValue<number>() ?? 0) > 0
            ? Number(info.getValue<number>()).toLocaleString()
            : "-",
      },
      {
        id: "viewCountLbl",
        accessorFn: (row) =>
          row.effectiveViewCount ?? row.song?.view_count ?? 0,
        header: t("columns.viewCountLabel"),
        cell: (info) =>
          renderViewCountCell(
            info.getValue<number>(),
            info.row.original.viewMilestone,
          ),
        sortingFn: viewCountSortFn,
        size: 180,
      },
      {
        id: "broadcast_at",
        accessorKey: "firstVideo.broadcast_at",
        header: t("columns.releaseOrPremiereDate"),
        cell: (info) => formatDate(info.getValue<number>()),
      },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo",
        header: t("columns.latest"),
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        size: 500,
      },
    ],
  },
];
