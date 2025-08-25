"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Song } from "../types/song";
import {
  Badge,
  TabItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Tabs,
  TabsRef,
  ThemeProvider,
} from "flowbite-react";
import { HiMusicNote, HiPlay, HiTag, HiUserCircle } from "react-icons/hi";
import { FaStar } from "react-icons/fa6";
import Link from "next/link";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import Loading from "../loading";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

type StatisticsItem = {
  key: string;
  count: number;
  song: Song;
  lastVideo: Song;
};

const createStatistics = <T extends StatisticsItem>(
  songs: Song[],
  keyFn: (song: Song) => string | string[],
  sortFn?: (a: T, b: T) => number
) => {
  const countsMap = songs
    .slice()
    .sort(
      (a, b) =>
        new Date(a.broadcast_at).getTime() - new Date(b.broadcast_at).getTime()
    )
    .reduce((map: Map<string, T>, song: Song) => {
      const keys = Array.isArray(keyFn(song))
        ? (keyFn(song) as string[])
        : [keyFn(song) as string];

      keys.forEach((key) => {
        map.set(key, {
          key,
          count: (map.get(key)?.count || 0) + 1,
          song,
          lastVideo: song,
        } as T & {
          key: string;
          count: number;
          song: Song;
          lastVideo: Song;
        });
      });
      return map;
    }, new Map<string, T & { key: string; count: number; song: Song; lastVideo: Song }>());

  const sortedData = Array.from(countsMap.values()).sort(
    sortFn ||
      ((a, b) =>
        (b as { count: number }).count - (a as { count: number }).count)
  ) as Array<T & { key: string; count: number; song: Song; lastVideo: Song }>;

  return sortedData;
};

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);

  // APIから楽曲データを取得する
  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setLoading(false);
      });
  }, []);

  // URLのタブパラメータを初期状態に設定
  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get("tab");
    if (tabParam) {
      const tabIndex = Number(tabParam);
      setActiveTab(tabIndex);
      tabsRef.current?.setActiveTab(tabIndex);
    }
  }, []);

  const songCounts = useMemo(() => {
    return createStatistics(songs, (song) => song.title);
  }, [songs]);

  const artistCounts = useMemo(() => {
    return createStatistics(songs, (song) => song.artist);
  }, [songs]);

  const originalSongCounts = useMemo(() => {
    const originalSongs = songs.filter((song) =>
      song.artist.split("、").some((artist) => artist.includes("AZKi"))
    );
    return createStatistics(originalSongs, (song) => song.title);
  }, [songs]);

  const tagCounts = useMemo(() => {
    return createStatistics(songs, (song) => song.tags);
  }, [songs]);

  const milestoneCounts = useMemo(() => {
    return createStatistics(
      songs,
      (song) => song.milestones,
      (a: StatisticsItem, b: StatisticsItem) =>
        new Date(b.lastVideo?.broadcast_at || "").getTime() -
        new Date(a.lastVideo?.broadcast_at || "").getTime()
    );
  }, [songs]);

  const changeTab = (tabIdx: number) => {
    setActiveTab(tabIdx);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabIdx.toString());
    window.history.replaceState({}, "", url.toString());
  };

  // 統計テーブル
  const renderTable = <T extends StatisticsItem>(
    data: T[],
    caption: string,
    description: string,
    columns: string[],
    renderRow: (item: T) => React.ReactNode
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loading />
        </div>
      );
    }

    return (
      <div className="max-h-dvh">
        <Table striped hoverable className="w-full">
          <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-900">
            {caption} ({data.length})
            <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </caption>
          <TableHead className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-700">
            <TableRow>
              {columns.map((col, index) => (
                <TableHeadCell
                  key={index}
                  className={`text-nowrap ${
                    col === "アーティスト名" ? "hidden lg:table-cell" : ""
                  }`}
                >
                  {col}
                </TableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{data.map(renderRow)}</TableBody>
        </Table>
      </div>
    );
  };

  // 最新の動画のサムネイルと情報
  const renderLastVideoCell = (lastVideo: Song | null) => {
    if (!lastVideo) {
      return <span className="text-sm">なし</span>;
    }

    const videoUrl = `${lastVideo.video_uri}${
      lastVideo.start ? `&t=${lastVideo.start}s` : ""
    }`;

    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
      >
        <div className="lg:flex lg:items-center lg:gap-2 flex flex-col lg:flex-row">
          <div className="flex w-full lg:w-24 max-w-[120px]">
            <YoutubeThumbnail
              videoId={lastVideo.video_id}
              alt={lastVideo.video_title}
              fill={true}
            />
          </div>
          <div className="flex flex-grow flex-col w-full gap-1 lg:gap-0">
            <span className="text-sm hidden lg:inline">
              <span className="">{lastVideo.video_title}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(lastVideo.broadcast_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </a>
    );
  };

  return (
    <OverlayScrollbarsComponent
      element="div"
      className="lg:p-6 flex flex-col w-full h-full"
      options={{ scrollbars: { autoHide: "leave" } }}
      defer
    >
      <div>
        <h1 className="font-extrabold text-2xl mb-3 sm:p-3 dark:text-gray-200">
          統計情報
        </h1>
      </div>
      <Tabs
        aria-label="Default tabs"
        variant="default"
        ref={tabsRef}
        onActiveTabChange={(i) => {
          changeTab(i);
        }}
      >
        <TabItem title="曲名別" icon={HiMusicNote}>
          {renderTable(
            songCounts,
            "曲名別",
            "全曲で、曲名別に歌唱した回数をまとめています。\nデータ上、表記揺れした場合に別の曲としてカウントされる場合がありますので、ご了承ください。",
            ["曲名", "アーティスト名", "回数", "最新"],
            (songCount) => (
              <TableRow key={songCount.key} className="max-h-6">
                <TableCell>
                  <Link
                    href={`/?q=title:${songCount.key}`}
                    className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                  >
                    {songCount.key}
                  </Link>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {songCount.song.artist}
                </TableCell>
                <TableCell>{songCount.count}</TableCell>
                <TableCell className="p-3">
                  {renderLastVideoCell(songCount.lastVideo)}
                </TableCell>
              </TableRow>
            )
          )}
        </TabItem>
        <TabItem title="アーティスト名別" icon={HiUserCircle}>
          {renderTable(
            artistCounts,
            "アーティスト名別",
            "全アーティストで、アーティスト名別に歌唱した回数をまとめています。\nデータ上、表記揺れした場合に別のアーティストとしてカウントされる場合がありますので、ご了承ください。",
            ["アーティスト名", "回数", "最新"],
            (artistCount) => (
              <TableRow key={artistCount.key} className="max-h-6">
                <TableCell>
                  <Link
                    href={`/?q=artist:${artistCount.key}`}
                    className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                  >
                    {artistCount.key}
                  </Link>
                </TableCell>
                <TableCell>{artistCount.count}</TableCell>
                <TableCell className="p-3">
                  {renderLastVideoCell(artistCount.lastVideo)}
                </TableCell>
              </TableRow>
            )
          )}
        </TabItem>
        <TabItem title="オリ曲" icon={HiPlay}>
          {renderTable(
            originalSongCounts,
            "オリ曲",
            "オリジナル楽曲のみの回数をまとめています。\nデータ上、表記揺れした場合に別のオリ曲としてカウントされる場合がありますので、ご了承ください。",
            ["曲名", "回数", "最新"],
            (originalSongCount) => (
              <TableRow key={originalSongCount.key} className="max-h-6">
                <TableCell>
                  <Link
                    href={`/?q=title:${originalSongCount.key}`}
                    className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                  >
                    {originalSongCount.key}
                  </Link>
                </TableCell>
                <TableCell>{originalSongCount.count}</TableCell>
                <TableCell className="p-3">
                  {renderLastVideoCell(originalSongCount.lastVideo)}
                </TableCell>
              </TableRow>
            )
          )}
        </TabItem>
        <TabItem title="タグ" icon={HiTag}>
          {renderTable(
            tagCounts,
            "タグ",
            "全タグで、回数をまとめています。\nタグについては手動で主観に基づいてつけているので、結構ざっくりです。",
            ["タグ", "回数", "最新"],
            (tag) => (
              <TableRow key={tag.key} className="max-h-6">
                <TableCell>
                  <Link href={`/?q=tag:${tag.key}`}>
                    <Badge className="inline lg:whitespace-nowrap">
                      {tag.key}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell>{tag.count}</TableCell>
                <TableCell className="p-3">
                  {renderLastVideoCell(tag.lastVideo)}
                </TableCell>
              </TableRow>
            )
          )}
        </TabItem>
        <TabItem title="マイルストーン" icon={FaStar}>
          {renderTable(
            milestoneCounts,
            "マイルストーン",
            "これまでの活動において、節目となった配信をまとめています。",
            ["マイルストーン", "達成日", "最新"],
            (milestone) => (
              <TableRow key={milestone.key} className="max-h-6">
                <TableCell>
                  <Link href={`/?q=milestone:${milestone.key}`}>
                    <Badge className="inline lg:whitespace-nowrap">
                      {milestone.key}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell>
                  {milestone.lastVideo &&
                    new Date(
                      milestone.lastVideo.broadcast_at
                    ).toLocaleDateString()}
                </TableCell>
                <TableCell className="p-3">
                  {renderLastVideoCell(milestone.lastVideo)}
                </TableCell>
              </TableRow>
            )
          )}
        </TabItem>
      </Tabs>
    </OverlayScrollbarsComponent>
  );
}
