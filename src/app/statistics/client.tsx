"use client";

import { useEffect, useRef, useState, useMemo, useDeferredValue } from "react";
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
  TextInput,
} from "flowbite-react";
import { HiMusicNote, HiPlay, HiTag, HiUserCircle } from "react-icons/hi";
import { HiChevronUp, HiChevronDown, HiArrowsUpDown } from "react-icons/hi2";

import { FaCompactDisc, FaDatabase, FaStar, FaYoutube } from "react-icons/fa6";
import Link from "next/link";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import Loading from "../loading";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

import useDebounce from "../hook/useDebounce";

type StatisticsItem = {
  key: string;
  count: number;
  song: Song;
  firstVideo: Song;
  lastVideo: Song;
};

const createStatistics = <T extends StatisticsItem>(
  songs: Song[],
  keyFn: (song: Song) => string | string[],
  sortFn?: (a: T, b: T) => number
) => {
  const countsMap = songs.reduce((map: Map<string, T>, song: Song) => {
    const keys = Array.isArray(keyFn(song))
      ? (keyFn(song) as string[])
      : [keyFn(song) as string];
    keys.forEach((key) => {
      map.set(key, {
        key,
        count: (map.get(key)?.count || 0) + 1,
        song,
        firstVideo:
          (map.get(key)?.firstVideo?.broadcast_at ?? 0) < song.broadcast_at
            ? map.get(key)?.firstVideo
            : song,
        lastVideo:
          (map.get(key)?.lastVideo?.broadcast_at ?? 0) > song.broadcast_at
            ? map.get(key)?.lastVideo
            : song,
      } as T & StatisticsItem);
    });
    return map;
  }, new Map<string, T & StatisticsItem>());

  const sortedData = Array.from(countsMap.values()).sort(
    sortFn || ((a, b) => b.count - a.count)
  );
  return sortedData as Array<T & StatisticsItem>;
};

const renderLastVideoCell = (lastVideo: Song | null, hiddenTitle = false) => {
  if (!lastVideo) return <span className="text-sm">なし</span>;
  const videoUrl = `${lastVideo.video_uri}`;
  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
    >
      <div className="md:flex md:items-center md:gap-2 flex flex-col md:flex-row">
        <div className="flex w-full lg:w-24 max-w-[120px]">
          <YoutubeThumbnail
            videoId={lastVideo.video_id}
            alt={lastVideo.video_title}
            fill={true}
          />
        </div>
        <div className="flex flex-grow flex-col w-full gap-1 lg:gap-0">
          <span className={`text-xs ${hiddenTitle ? "hidden" : ""} md:inline`}>
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

function DataTable<
  T extends { lastVideo?: { video_title: string } } | StatisticsItem
>({
  data,
  caption,
  description,
  columns,
  loading,
  initialSortColumnId,
  initialSortDirection,
}: {
  data: T[];
  caption: string;
  description: string;
  columns: ColumnDef<T, unknown>[];
  loading: boolean;
  initialSortColumnId?: string;
  initialSortDirection?: "asc" | "desc";
}) {
  const [inputValue, setInputValue] = useState("");
  const debouncedFilter = useDebounce(inputValue, 300);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      sorting: initialSortColumnId
        ? [{ id: initialSortColumnId, desc: initialSortDirection === "desc" }]
        : [],
    },
    state: {
      globalFilter: debouncedFilter,
    },
    onGlobalFilterChange: setInputValue,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      // 検索文字列を小文字に変換
      const lowercasedFilterValue = filterValue.toLowerCase();

      // 行内の全てのセルを対象にループ
      return row.getVisibleCells().some((cell) => {
        // セルの生のデータ値を取得
        const cellValue = cell.getValue();

        // 値が文字列または数値の場合、検索を実行
        if (typeof cellValue === "string" || typeof cellValue === "number") {
          return String(cellValue)
            .toLowerCase()
            .includes(lowercasedFilterValue);
        }

        // lastVideo列の場合、video_titleを検索対象に追加
        if (cell.column.id === "lastVideo") {
          const videoTitle = row.original?.lastVideo?.video_title;
          if (typeof videoTitle === "string") {
            return videoTitle.toLowerCase().includes(lowercasedFilterValue);
          }
        }
        return false;
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table hoverable striped>
          <caption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-900">
            {caption} ({data.length})
            <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
              {description}
            </p>
            <div className="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              <TextInput
                placeholder="検索..."
                value={inputValue ?? ""}
                onChange={(e) => setInputValue(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </caption>

          <TableHead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHeadCell
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none whitespace-nowrap"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanSort() && (
                      <span className="ml-1 inline-block">
                        {{
                          asc: <HiChevronUp className="inline w-4 h-4" />,
                          desc: <HiChevronDown className="inline w-4 h-4" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <HiArrowsUpDown className="inline w-4 h-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </TableHeadCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`py-1 px-3 ${
                      typeof cell.getValue() === "number" ? "text-center" : ""
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {/* <div className="flex items-center justify-between">
        <span className="text-sm">
          ページ {table.getState().pagination.pageIndex + 1} /{" "}
          {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <Button
            size="xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            前へ
          </Button>
          <Button
            size="xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            次へ
          </Button>
        </div>
      </div> */}
    </div>
  );
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);

  // useDeferredValueでactiveTabを遅延させる
  const deferredActiveTab = useDeferredValue(activeTab);

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setLoading(false);
      });
  }, []);

  // 統計データ
  const songCounts = useMemo(
    () => createStatistics(songs, (s) => s.title),
    [songs]
  );
  const artistCounts = useMemo(
    () => createStatistics(songs, (s) => s.artist),
    [songs]
  );
  const originalSongCounts = useMemo(() => {
    const originals = songs.filter((s) =>
      s.artist.split("、").some((a) => a.includes("AZKi"))
    );
    return createStatistics(originals, (s) => s.title);
  }, [songs]);
  const tagCounts = useMemo(
    () => createStatistics(songs, (s) => s.tags),
    [songs]
  );
  const milestoneCounts = useMemo(
    () =>
      createStatistics(
        songs,
        (s) => s.milestones,
        (a, b) =>
          new Date(b.lastVideo?.broadcast_at || "").getTime() -
          new Date(a.lastVideo?.broadcast_at || "").getTime()
      ),
    [songs]
  );
  const videoCounts = useMemo(
    () => createStatistics(songs, (s) => s.video_id),
    [songs]
  );

  const originalSongCountsByReleaseDate = useMemo(() => {
    const originals = songs.filter(
      (s) =>
        (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
        s.sing.includes("AZKi") &&
        (s.artist.includes("AZKi") ||
          s.artist.includes("瀬名航") ||
          s.artist.includes("Star Flower") ||
          s.artist.includes("SorAZ"))
    );
    return createStatistics(
      originals,
      (s) => s.title,
      (a, b) =>
        new Date(b.firstVideo.broadcast_at).getTime() -
        new Date(a.firstVideo.broadcast_at).getTime()
    );
  }, [songs]);

  const coverSongCountsByReleaseDate = useMemo(() => {
    const covers = songs.filter((s) => s.tags.includes("カバー曲"));
    return createStatistics(
      covers,
      (s) => s.title,
      (a, b) =>
        new Date(b.firstVideo.broadcast_at).getTime() -
        new Date(a.firstVideo.broadcast_at).getTime()
    );
  }, [songs]);

  // タブ切り替えによってURLを書き換える
  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    if (tab) {
      tabsRef.current?.setActiveTab(parseInt(tab, 10));
      setActiveTab(parseInt(tab, 10));
    }

    const handlePopState = () => {
      const newUrl = new URL(window.location.href);
      const newTab = newUrl.searchParams.get("tab");
      if (newTab) {
        tabsRef.current?.setActiveTab(parseInt(newTab, 10));
        setActiveTab(parseInt(newTab, 10));
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (tabsRef.current) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", `${deferredActiveTab}`);
      window.history.replaceState(null, "", url.toString());
    }
  }, [deferredActiveTab]);

  return (
    <OverlayScrollbarsComponent
      element="div"
      className="lg:p-6 flex flex-col w-full h-full"
      options={{ scrollbars: { autoHide: "leave" } }}
      defer
    >
      <h1 className="font-extrabold text-2xl p-3 dark:text-gray-200">
        統計情報
      </h1>

      <Tabs
        aria-label="統計タブ"
        variant="underline"
        ref={tabsRef}
        onActiveTabChange={setActiveTab}
      >
        {/* 曲名別 */}
        <TabItem title="曲名別" icon={HiMusicNote}>
          {deferredActiveTab === 0 && (
            <DataTable
              loading={loading}
              data={songCounts}
              caption="曲名別"
              description="曲名ごとで歌った回数です"
              initialSortColumnId="count"
              initialSortDirection="desc"
              columns={[
                {
                  accessorKey: "key",
                  header: "曲名",
                  cell: (info) => (
                    <Link
                      href={`/?q=title:${info.getValue<string>()}`}
                      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                    >
                      {info.getValue<string>()}
                    </Link>
                  ),
                },
                { accessorKey: "song.artist", header: "アーティスト名" },
                { accessorKey: "count", header: "回数" },
                {
                  accessorKey: "lastVideo",
                  header: "最新",
                  cell: (info) =>
                    renderLastVideoCell(info.getValue<Song>(), true),
                },
              ]}
            />
          )}
        </TabItem>

        {/* アーティスト名別 */}
        <TabItem title="アーティスト名別" icon={HiUserCircle}>
          {deferredActiveTab === 1 && (
            <DataTable
              loading={loading}
              data={artistCounts}
              caption="アーティスト名別"
              description="アーティストごとで歌った回数です"
              initialSortColumnId="count"
              initialSortDirection="desc"
              columns={[
                {
                  accessorKey: "key",
                  header: "アーティスト名",
                  cell: (info) => (
                    <Link
                      href={`/?q=artist:${info.getValue<string>()}`}
                      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                    >
                      {info.getValue<string>()}
                    </Link>
                  ),
                },
                { accessorKey: "count", header: "回数" },
                {
                  accessorKey: "lastVideo",
                  header: "最新",
                  cell: (info) => renderLastVideoCell(info.getValue<Song>()),
                },
              ]}
            />
          )}
        </TabItem>

        {/* オリ曲 */}
        <TabItem title="オリ曲" icon={HiPlay}>
          {deferredActiveTab === 2 && (
            <DataTable
              loading={loading}
              data={originalSongCounts}
              caption="オリ曲"
              description="オリジナル楽曲の歌った回数です"
              initialSortColumnId="count"
              initialSortDirection="desc"
              columns={[
                {
                  accessorKey: "key",
                  header: "曲名",
                  cell: (info) => (
                    <Link
                      href={`/?q=title:${info.getValue<string>()}`}
                      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                    >
                      {info.getValue<string>()}
                    </Link>
                  ),
                },
                { accessorKey: "count", header: "回数" },
                {
                  id: "lastVideo.broadcast_at",
                  accessorKey: "lastVideo",
                  header: "最新",
                  cell: (info) =>
                    renderLastVideoCell(info.getValue<Song>(), true),
                },
              ]}
            />
          )}
        </TabItem>

        {/* タグ */}
        <TabItem title="タグ" icon={HiTag}>
          {deferredActiveTab === 3 && (
            <DataTable
              loading={loading}
              data={tagCounts}
              caption="タグ"
              description="タグがつけられている動画です"
              initialSortColumnId="count"
              initialSortDirection="desc"
              columns={[
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
                },
                { accessorKey: "count", header: "収録数" },
                {
                  accessorKey: "lastVideo",
                  header: "最新",
                  cell: (info) =>
                    renderLastVideoCell(info.getValue<Song>(), true),
                },
              ]}
            />
          )}
        </TabItem>

        {/* マイルストーン */}
        <TabItem title="マイルストーン" icon={FaStar}>
          {deferredActiveTab === 4 && (
            <DataTable
              loading={loading}
              data={milestoneCounts}
              caption="マイルストーン"
              description="活動の節目となった配信"
              initialSortColumnId="broadcast_at"
              initialSortDirection="desc"
              columns={[
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
                  cell: (info) =>
                    renderLastVideoCell(info.getValue<Song>(), true),
                },
              ]}
            />
          )}
        </TabItem>

        <TabItem title="収録動画" icon={FaYoutube}>
          {deferredActiveTab === 5 && (
            <DataTable
              loading={loading}
              data={videoCounts}
              caption="収録動画"
              description="現在データベースに収録されている動画一覧です"
              initialSortColumnId="lastVideo.broadcast_at"
              initialSortDirection="desc"
              columns={[
                {
                  id: "lastVideo.video_title",
                  accessorKey: "lastVideo",
                  header: "動画",
                  sortingFn: (rowA, rowB, columnId) => {
                    const a = rowA.original.lastVideo?.video_title || "";
                    const b = rowB.original.lastVideo?.video_title || "";
                    return a.localeCompare(b);
                  },
                  cell: (info) =>
                    renderLastVideoCell(info.getValue<Song>(), false),
                },
                {
                  accessorKey: "lastVideo",
                  header: "再生",
                  enableSorting: false,
                  cell: (info) => (
                    <div className="flex items-center justify-center">
                      <span className="inline-flex gap-x-1">
                        <Link
                          href={`https://www.youtube.com/watch?v=${
                            info.getValue<Song>().video_id
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                        >
                          <FaYoutube />
                        </Link>
                        &nbsp;
                        <Link
                          href={`/?v=${info.getValue<Song>().video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                        >
                          <FaDatabase />
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
                },
              ]}
            />
          )}
        </TabItem>

        {/* Discography */}
        <TabItem title="Discography" icon={FaCompactDisc}>
          {deferredActiveTab === 6 && (
            <DataTable
              loading={loading}
              data={originalSongCountsByReleaseDate}
              caption="Discography"
              description="オリジナル楽曲のリリース日 または 動画初公開日 です"
              initialSortColumnId="broadcast_at"
              initialSortDirection="desc"
              columns={[
                {
                  accessorKey: "song.title",
                  header: "曲名",
                  cell: (info) => (
                    <Link
                      href={`/?q=title:${info.getValue<string>()}`}
                      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500 font-semibold"
                    >
                      {info.getValue<string>()}
                    </Link>
                  ),
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
                },
                {
                  id: "broadcast_at",
                  accessorKey: "firstVideo.broadcast_at",
                  header: "リリース日/初公開日",
                  cell: (info) =>
                    new Date(info.getValue<number>()).toLocaleDateString(),
                },
                {
                  id: "lastVideo.broadcast_at",
                  accessorKey: "lastVideo",
                  header: "最新",
                  cell: (info) =>
                    renderLastVideoCell(info.getValue<Song>(), true),
                },
              ]}
            />
          )}
        </TabItem>

        {/* カバー楽曲 */}
        <TabItem title="カバー楽曲" icon={HiMusicNote}>
          {deferredActiveTab === 7 && (
            <DataTable
              loading={loading}
              data={coverSongCountsByReleaseDate}
              caption="カバー楽曲"
              description="カバー楽曲のリリース日 または 動画初公開日 です"
              initialSortColumnId="broadcast_at"
              initialSortDirection="desc"
              columns={[
                {
                  accessorKey: "song.title",
                  header: "曲名",
                  cell: (info) => (
                    <Link
                      href={`/?q=title:${info.getValue<string>()}`}
                      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500 font-semibold"
                    >
                      {info.getValue<string>()}
                    </Link>
                  ),
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
                },
                {
                  id: "broadcast_at",
                  accessorKey: "firstVideo.broadcast_at",
                  header: "リリース日/初公開日",
                  cell: (info) =>
                    new Date(info.getValue<number>()).toLocaleDateString(),
                },
                {
                  id: "lastVideo.broadcast_at",
                  accessorKey: "lastVideo",
                  header: "最新",
                  cell: (info) =>
                    renderLastVideoCell(info.getValue<Song>(), true),
                },
              ]}
            />
          )}
        </TabItem>
      </Tabs>
    </OverlayScrollbarsComponent>
  );
}
