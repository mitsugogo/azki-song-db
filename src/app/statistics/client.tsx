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
  TextInput,
  Button,
} from "flowbite-react";
import { HiMusicNote, HiPlay, HiTag, HiUserCircle } from "react-icons/hi";
import { HiChevronUp, HiChevronDown, HiArrowsUpDown } from "react-icons/hi2";

import { FaDatabase, FaStar, FaYoutube } from "react-icons/fa6";
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
      <div className="lg:flex lg:items-center lg:gap-2 flex flex-col lg:flex-row">
        <div className="flex w-full lg:w-24 max-w-[120px]">
          <YoutubeThumbnail
            videoId={lastVideo.video_id}
            alt={lastVideo.video_title}
            fill={true}
          />
        </div>
        <div className="flex flex-grow flex-col w-full gap-1 lg:gap-0">
          <span className={`text-xs ${hiddenTitle ? "hidden" : ""} lg:inline`}>
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
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    initialState: {
      sorting: initialSortColumnId
        ? [{ id: initialSortColumnId, desc: initialSortDirection === "desc" }]
        : [],
    },
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      // フィルターの対象となる列の値を全て文字列化して結合
      const allValues = row
        .getVisibleCells()
        .map((cell) => {
          // flexRenderでレンダリングされるHTMLやコンポーネントを取得
          const cellContent = flexRender(
            cell.column.columnDef.cell,
            cell.getContext()
          );
          // その内容からプレーンテキストを抽出
          if (
            typeof cellContent === "string" ||
            typeof cellContent === "number"
          ) {
            return String(cellContent);
          }
          // HTML要素が含まれる場合、テキストコンテンツを取得する
          const columnDef = cell.column.columnDef;

          if (
            "accessorKey" in columnDef &&
            columnDef.accessorKey === "lastVideo"
          ) {
            return row.original.lastVideo?.video_title;
          }
          return "";
        })
        .join(" ")
        .toLowerCase();

      // 抽出したテキストからHTMLタグを削除し、フィルター値をチェック
      const cleanedText = allValues.replace(/<[^>]*>/g, "");
      return cleanedText.includes(filterValue.toLowerCase());
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
      <Table hoverable striped>
        <caption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-900">
          {caption} ({data.length})
          <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
            {description}
          </p>
          <p className="mt-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            <TextInput
              placeholder="検索..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-xs"
            />
          </p>
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
        variant="default"
        ref={tabsRef}
        onActiveTabChange={setActiveTab}
      >
        {/* 曲名別 */}
        <TabItem title="曲名別" icon={HiMusicNote}>
          <DataTable
            loading={loading}
            data={songCounts}
            caption="曲名別"
            description="曲名ごとで歌った回数です"
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
                cell: (info) => renderLastVideoCell(info.getValue<Song>()),
              },
            ]}
          />
        </TabItem>

        {/* アーティスト名別 */}
        <TabItem title="アーティスト名別" icon={HiUserCircle}>
          <DataTable
            loading={loading}
            data={artistCounts}
            caption="アーティスト名別"
            description="アーティストごとで歌った回数です"
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
        </TabItem>

        {/* オリ曲 */}
        <TabItem title="オリ曲" icon={HiPlay}>
          <DataTable
            loading={loading}
            data={originalSongCounts}
            caption="オリ曲"
            description="オリジナル楽曲の歌った回数です"
            columns={[
              { accessorKey: "key", header: "曲名" },
              { accessorKey: "count", header: "回数" },
              {
                accessorKey: "lastVideo",
                header: "最新",
                cell: (info) => renderLastVideoCell(info.getValue<Song>()),
              },
            ]}
          />
        </TabItem>

        {/* タグ */}
        <TabItem title="タグ" icon={HiTag}>
          <DataTable
            loading={loading}
            data={tagCounts}
            caption="タグ"
            description="タグがつけられている動画です"
            columns={[
              {
                accessorKey: "key",
                header: "タグ",
                cell: (info) => (
                  <Badge className="inline lg:whitespace-nowrap">
                    {info.getValue<string>()}
                  </Badge>
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
        </TabItem>

        {/* マイルストーン */}
        <TabItem title="マイルストーン" icon={FaStar}>
          <DataTable
            loading={loading}
            data={milestoneCounts}
            caption="マイルストーン"
            description="活動の節目となった配信"
            columns={[
              {
                accessorKey: "key",
                header: "マイルストーン",
                cell: (info) => (
                  <Badge className="inline lg:whitespace-nowrap">
                    {info.getValue<string>()}
                  </Badge>
                ),
              },
              {
                accessorKey: "lastVideo.broadcast_at",
                header: "達成日",
                cell: (info) =>
                  info.getValue<string>() &&
                  new Date(info.getValue<string>()).toLocaleDateString(),
              },
              {
                accessorKey: "lastVideo",
                header: "最新",
                cell: (info) => renderLastVideoCell(info.getValue<Song>()),
              },
            ]}
          />
        </TabItem>

        <TabItem title="収録動画" icon={FaYoutube}>
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
        </TabItem>
      </Tabs>
    </OverlayScrollbarsComponent>
  );
}
