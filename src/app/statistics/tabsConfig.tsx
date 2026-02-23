/* eslint @typescript-eslint/no-explicit-any: off */
import Link from "next/link";
import { Badge } from "flowbite-react";
import { HiMusicNote, HiUserCircle, HiPlay, HiTag } from "react-icons/hi";
import { FaStar, FaYoutube, FaCompactDisc, FaDatabase } from "react-icons/fa6";
import { ColumnDef } from "@tanstack/react-table";

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
import { FC, SVGProps } from "react";

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

export const TABS_CONFIG: TabConfig[] = [
  // 1. 曲名別
  {
    title: "曲名別",
    icon: HiMusicNote,
    dataKey: "songCounts",
    caption: "曲名別",
    description: "曲名ごとで歌った回数です",
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: "曲名",
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
      { accessorKey: "song.artist", header: "アーティスト名" },
      { accessorKey: "count", header: "回数" },
      {
        accessorKey: "lastVideo",
        header: "最新",
        cell: (info) => renderLastVideoCell(info.getValue<Song>(), true),
        minSize: 800,
      },
    ],
  },
  // 2. アーティスト名別
  {
    title: "アーティスト名別",
    icon: HiUserCircle,
    dataKey: "artistCounts",
    caption: "アーティスト名別",
    description: "アーティストごとで歌った回数です",
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: "アーティスト名",
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
      { accessorKey: "count", header: "回数" },
      {
        accessorKey: "lastVideo",
        header: "最新",
        cell: (info) => renderLastVideoCell(info.getValue<Song>()),
        size: 800,
      },
    ],
  },
  // 3. オリ曲 (回数)
  {
    title: "オリ曲",
    icon: HiPlay,
    dataKey: "originalSongCounts",
    caption: "オリ曲",
    description: "オリジナル楽曲の歌った回数です",
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: "曲名",
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
      { accessorKey: "count", header: "回数" },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo",
        header: "最新",
        cell: (info) => renderLastVideoCell(info.getValue<Song>(), true),
        size: 800,
      },
    ],
  },
  // 4. タグ
  {
    title: "タグ",
    icon: HiTag,
    dataKey: "tagCounts",
    caption: "タグ",
    description: "タグがつけられている動画です",
    initialSort: { id: "count", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: "タグ",
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
        header: "収録数",
        cell: (info) => info.getValue().toLocaleString(),
      },
      {
        accessorKey: "lastVideo",
        header: "最新",
        cell: (info) => renderLastVideoCell(info.getValue<Song>(), true),
        size: 800,
      },
    ],
  },
  // 5. マイルストーン
  {
    title: "マイルストーン",
    icon: FaStar,
    dataKey: "milestoneCounts",
    caption: "マイルストーン",
    description: "活動の節目となった配信",
    initialSort: { id: "broadcast_at", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        accessorKey: "key",
        header: "マイルストーン",
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
        header: "達成日",
        cell: (info) =>
          info.getValue<string>() &&
          new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: "lastVideo",
        header: "最新",
        cell: (info) => renderLastVideoCell(info.getValue<Song>(), true),
        size: 800,
      },
    ],
  },
  // 6. 収録動画
  {
    title: "収録動画",
    icon: FaYoutube,
    dataKey: "videoCounts",
    caption: "収録動画",
    description: "現在データベースに収録されている動画一覧です",
    initialSort: { id: "lastVideo.broadcast_at", direction: "desc" },
    minWidth: 1024,
    columns: [
      {
        id: "lastVideo.video_title",
        accessorKey: "lastVideo",
        header: "動画",
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
        accessorKey: "lastVideo",
        header: "再生",
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-center">
            <span className="inline-flex gap-x-2">
              <Link
                href={`https://www.youtube.com/watch?v=${
                  info.getValue<Song>().video_id
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
              >
                <FaYoutube size={18} />
              </Link>
              <Link
                href={`/?v=${info.getValue<Song>().video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
              >
                <FaDatabase size={18} />
              </Link>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "count",
        header: "曲数",
        cell: (info) => info.getValue<number>(),
      },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo.broadcast_at",
        header: "配信日",
        cell: (info) =>
          info.getValue<string>() &&
          new Date(info.getValue<string>()).toLocaleDateString(),
        size: 800,
      },
    ],
  },
  // 7. オリ曲 (リリース日)
  {
    title: "オリ曲",
    icon: FaCompactDisc,
    dataKey: "originalSongCountsByReleaseDate",
    caption: "オリ曲",
    description: "オリジナル楽曲のリリース日 または 動画初公開日 です",
    initialSort: { id: "broadcast_at", direction: "desc" },
    minWidth: 1700,
    columns: [
      {
        id: "discographyLink",
        header: "詳細",
        enableSorting: false,
        cell: (info) => {
          const href = getDiscographyLink(info.row.original.song);
          if (!href) return null;

          return (
            <Link
              href={href}
              className="inline-flex items-center whitespace-nowrap rounded-md border border-primary-300 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 dark:border-primary-700"
            >
              詳細
            </Link>
          );
        },
        size: 90,
      },
      {
        accessorKey: "song.title",
        header: "曲名",
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
        header: "アーティスト",
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
        accessorFn: (row) => row.song?.view_count ?? 0,
        header: "再生回数",
        cell: (info) => {
          return info.getValue<string>() ? (
            Number(info.getValue<string>()).toLocaleString()
          ) : (
            <div className="animate-pulse h-3 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
          );
        },
      },
      {
        id: "viewCountLbl",
        accessorFn: (row) => {
          return row.song?.view_count ?? 0;
        },
        header: "再生回数ラベル",
        cell: (info) =>
          renderViewCountCell(
            info.getValue<number>(),
            info.row.original.viewMilestone,
          ),
        sortingFn: viewCountSortFn,
      },
      {
        id: "broadcast_at",
        accessorKey: "firstVideo.broadcast_at",
        header: "リリース日/初公開日",
        cell: (info) => new Date(info.getValue<number>()).toLocaleDateString(),
      },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo",
        header: "最新",
        cell: (info) => renderLastVideoCell(info.getValue<Song>(), true),
        size: 600,
      },
    ],
  },
  // 8. カバー楽曲
  {
    title: "カバー楽曲",
    icon: HiMusicNote,
    dataKey: "coverSongCountsByReleaseDate",
    caption: "カバー楽曲",
    description: "カバー楽曲のリリース日 または 動画初公開日 です",
    initialSort: { id: "broadcast_at", direction: "desc" },
    minWidth: 1700,
    columns: [
      {
        id: "discographyLink",
        header: "詳細",
        enableSorting: false,
        cell: (info) => {
          const href = getDiscographyLink(info.row.original.song);
          if (!href) return null;

          return (
            <Link
              href={href}
              className="inline-flex items-center whitespace-nowrap rounded-md border border-primary-300 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 dark:border-primary-700"
            >
              詳細
            </Link>
          );
        },
        size: 90,
      },
      {
        accessorKey: "song.title",
        header: "曲名",
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
        header: "アーティスト",
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
        header: "歌った人",
        cell: (info) => info.getValue<string>(),
      },
      {
        id: "viewCount",
        accessorKey: "song.view_count",
        accessorFn: (row) => row.song?.view_count ?? 0,
        header: "再生回数",
        cell: (info) =>
          info.getValue<string>() ? (
            Number(info.getValue<string>()).toLocaleString()
          ) : (
            <div className="animate-pulse h-3 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
          ),
      },
      {
        id: "viewCountLbl",
        accessorFn: (row) => row.song?.view_count ?? 0,
        header: "再生回数ラベル",
        cell: (info) =>
          renderViewCountCell(
            info.getValue<number>(),
            info.row.original.viewMilestone,
          ),
        sortingFn: viewCountSortFn,
      },
      {
        id: "broadcast_at",
        accessorKey: "firstVideo.broadcast_at",
        header: "リリース日/初公開日",
        cell: (info) => new Date(info.getValue<number>()).toLocaleDateString(),
      },
      {
        id: "lastVideo.broadcast_at",
        accessorKey: "lastVideo",
        header: "最新",
        cell: (info) => renderLastVideoCell(info.getValue<Song>(), true),
        size: 500,
      },
    ],
  },
];
