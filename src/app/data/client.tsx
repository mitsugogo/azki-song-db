"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Song } from "../types/song";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { HiChevronUp, HiChevronDown, HiArrowsUpDown } from "react-icons/hi2";
import Loading from "../loading";
import { Badge, TextInput } from "flowbite-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { HiSearch } from "react-icons/hi";
import MilestoneBadge from "../components/MilestoneBadge";
import { BsPlayCircle } from "react-icons/bs";
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";

export default function ClientTable() {
  const [isLoading, setIsLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableContainerRef = useRef<OverlayScrollbarsComponentRef>(null);

  const columns = useMemo<ColumnDef<Song>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: (info) => info.row.index + 1,
        size: 80,
      },
      {
        header: "再生",
        cell: (info) => (
          <Link
            href={`/?v=${info.row.original.video_id}&t=${info.row.original.start}`}
            className="text-gray-400 hover:text-primary-600 dark:hover:text-white"
          >
            <BsPlayCircle className="inline w-5 h-5" />
          </Link>
        ),
        size: 60,
      },
      {
        accessorKey: "title",
        header: "タイトル",
        cell: (info) => (
          <Link
            href={`/?q=title:${info.getValue<string>()}`}
            className="hover:underline font-semibold text-primary dark:text-primary-300"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 250,
        enableResizing: true,
      },
      {
        accessorKey: "artist",
        header: "アーティスト",
        cell: (info) => (
          <Link
            href={`/?q=artist:${info.getValue<string>()}`}
            className="hover:underline text-primary dark:text-primary-300"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 250,
        enableResizing: true,
      },
      {
        accessorKey: "sing",
        header: "歌った人",
        size: 300,
        cell: (info) => (
          <div>
            {info
              .getValue<string>()
              .split("、")
              .map((title, index) => (
                <Link
                  key={index}
                  href={`/?q=sing:${encodeURIComponent(title)}`}
                  className="hover:underline text-primary dark:text-primary-300 mr-2"
                >
                  <Badge color="info" size="xs" className="inline-block">
                    {title}
                  </Badge>
                </Link>
              ))}
          </div>
        ),
        enableResizing: true,
      },
      {
        accessorKey: "album",
        header: "アルバム",
        size: 150,
        cell: (info) => (
          <Link
            href={`/?q=album:${info.getValue<string>()}`}
            className="hover:underline text-primary dark:text-primary-300"
          >
            {info.getValue<string>()}
          </Link>
        ),
      },
      {
        accessorKey: "album_release_at",
        header: "アルバム発売日",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue<string>()).toLocaleDateString("ja-JP")
            : "",
        size: 150,
      },
      {
        accessorKey: "video_title",
        header: "動画タイトル",
        cell: (info) => (
          <Link
            href={`https://www.youtube.com/watch?v=${info.row.original.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary dark:text-primary-300"
          >
            {info.getValue<string>()}
          </Link>
        ),
        size: 550,
        enableResizing: true,
      },
      {
        accessorKey: "start",
        header: "開始タイムスタンプ",
        enableSorting: false,
        cell: (info) => {
          return new Date(parseInt(info.getValue<string>()) * 1000)
            .toISOString()
            .substring(11, 19);
        },
        size: 120,
      },
      {
        accessorKey: "tags",
        header: "タグ",
        cell: (info) => (
          <div>
            {info.getValue<string[]>().map((tag, index) => (
              <Link
                key={index}
                href={`/?q=tag:${encodeURIComponent(tag)}`}
                className="hover:underline text-primary dark:text-primary-300 mr-2"
              >
                {tag}
              </Link>
            ))}
          </div>
        ),
        size: 350,
        enableResizing: true,
      },
      {
        accessorKey: "broadcast_at",
        header: "公開日",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue<string>()).toLocaleDateString("ja-JP")
            : "-",
        size: 120,
      },
      {
        accessorKey: "milestones",
        header: "マイルストーン",
        cell: (info) =>
          info.getValue<string[]>()?.length > 0
            ? info.getValue<string[]>()?.map((m, index) => (
                <div className={`align-center mb-1`} key={index}>
                  <Link
                    href={`/?q=milestone:${encodeURIComponent(m)}`}
                    className="hover:underline"
                  >
                    <MilestoneBadge song={info.row.original} inline />
                  </Link>
                </div>
              ))
            : "",
        size: 200,
        enableResizing: true,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: songs,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      globalFilter: filterQuery,
      sorting,
    },
    onGlobalFilterChange: setFilterQuery,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setIsLoading(false);
      });
  }, []);

  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () =>
      tableContainerRef.current?.osInstance()?.elements().viewport as Element,
    estimateSize: () => 86,
    overscan: 15,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  if (isLoading) {
    return (
      <div className="flex items-center w-full justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="flex-grow lg:p-6 lg:pb-0">
        <h1 className="font-extrabold text-2xl p-3">収録データ</h1>
        <p className="mb-4 px-3">本データベースの情報を表示しています。</p>
        <div className="p-2 block space-y-4 dark:border-gray-700 rounded-lg shadow-sm w-full">
          <TextInput
            icon={HiSearch}
            placeholder="検索..."
            onChange={(e) => setFilterQuery(e.target.value)}
          />
          <OverlayScrollbarsComponent
            ref={tableContainerRef}
            className="h-[calc(100dvh-230px)] md:h-[calc(100dvh-250px)] lg:h-[calc(100dvh-296px)]"
          >
            <div className="relative">
              <div className="w-full text-sm text-left">
                {/* ヘッダー部分 */}
                <div className="flex text-xs text-gray-700 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <div
                      key={headerGroup.id}
                      className="flex flex-1 bg-light-gray-200 dark:bg-gray-700 dark:text-white"
                    >
                      {headerGroup.headers.map((header) => (
                        <div
                          key={header.id}
                          className="relative px-6 py-3 min-w-0 flex-shrink-0"
                          style={{
                            width: header.getSize(),
                          }}
                        >
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center cursor-pointer select-none whitespace-nowrap"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <span className="ml-1 inline-block">
                                {{
                                  asc: (
                                    <HiChevronUp className="inline w-4 h-4" />
                                  ),
                                  desc: (
                                    <HiChevronDown className="inline w-4 h-4" />
                                  ),
                                }[header.column.getIsSorted() as string] ?? (
                                  <HiArrowsUpDown className="inline w-4 h-4 opacity-50" />
                                )}
                              </span>
                            )}
                          </div>
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={`resizer absolute top-0 right-0 h-full w-2 cursor-col-resize ${
                                header.column.getIsResizing()
                                  ? "bg-blue-500"
                                  : ""
                              }`}
                            ></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {/* ボディ部分 */}
                <div
                  className="relative"
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                  }}
                >
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;

                    return (
                      <div
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={(el) => rowVirtualizer.measureElement(el)}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          // height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={`flex border-b border-light-gray-200/80 dark:bg-gray-800 dark:border-gray-700 hover:bg-light-gray-100 dark:hover:bg-gray-600 ${
                          parseInt(row.id) % 2 === 0
                            ? "bg-light-gray-100/50 dark:bg-gray-800/50"
                            : "bg-white"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <div
                            key={cell.id}
                            className="px-6 py-2 min-w-0 flex-shrink-0"
                            style={{
                              width: cell.column.getSize(),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>
    </>
  );
}
