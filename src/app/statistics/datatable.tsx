"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Song } from "../types/song";
import { StatisticsItem } from "../types/statisticsItem";
import { useMemo, useRef, useState } from "react";
import useDebounce from "../hook/useDebounce";
import Loading from "../loading";
import { Badge, TextInput } from "flowbite-react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { HiArrowsUpDown } from "react-icons/hi2";
import Link from "next/link";
import { BsPlayCircle } from "react-icons/bs";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";

export default function DataTable<
  T extends
    | { lastVideo?: { video_title: string; video_id: string } }
    | StatisticsItem
>({
  data,
  caption,
  description,
  columns,
  initialSortColumnId,
  initialSortDirection,
  onRowClick,
  selectedVideoId,
  songs,
}: {
  data: T[];
  caption: string;
  description: string;
  columns: ColumnDef<T, unknown>[];
  initialSortColumnId?: string;
  initialSortDirection?: "asc" | "desc";
  onRowClick?: (id: string) => void;
  selectedVideoId?: string | null;
  songs?: Song[];
}) {
  const [inputValue, setInputValue] = useState("");
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const debouncedFilter = useDebounce(inputValue, 300);

  const tableContainerRef = useRef<OverlayScrollbarsComponentRef>(null);

  type ColumnSort = { id: string; desc: boolean };

  const initialSorting = useMemo(() => {
    if (typeof window === "undefined") return [] as ColumnSort[];

    const url = new URL(window.location.href);
    const sort = url.searchParams.get("sort");
    const order = url.searchParams.get("order");
    if (sort && order && columns.some((column) => column.id === sort)) {
      setSorting([{ id: sort, desc: order === "desc" }]);
      return [{ id: sort, desc: order === "desc" }];
    }

    setSorting([
      {
        id: initialSortColumnId as string,
        desc: initialSortDirection === "desc",
      },
    ]);
    return [
      { id: initialSortColumnId, desc: initialSortDirection === "desc" },
    ] as ColumnSort[];
  }, [columns, initialSortColumnId, initialSortDirection]);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      sorting: initialSorting,
    },
    state: { globalFilter: debouncedFilter, sorting },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onGlobalFilterChange: setInputValue,
    onSortingChange: (updater) => {
      const newSortingValue =
        updater instanceof Function ? updater(sorting) : updater;

      // URLに反映する
      const url = new URL(window.location.href);
      if (!newSortingValue[0]?.id) {
        url.searchParams.delete("sort");
        url.searchParams.delete("order");
      } else {
        url.searchParams.set("sort", newSortingValue[0].id);
        url.searchParams.set("order", newSortingValue[0].desc ? "desc" : "asc");
      }
      window.history.pushState(null, "", url.href);

      setSorting(updater);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const query = filterValue.toLowerCase();
      return row.getVisibleCells().some((cell) => {
        const value = cell.getValue();
        if (typeof value === "string" || typeof value === "number") {
          return String(value).toLowerCase().includes(query);
        }
        if (cell.column.id === "lastVideo") {
          return row.original?.lastVideo?.video_title
            ?.toLowerCase()
            .includes(query);
        }
        return false;
      });
    },
  });

  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () =>
      tableContainerRef.current?.osInstance()?.elements().viewport as Element,
    estimateSize: () => 86,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div>
      <div className="flex-grow">
        <div className="hidden md:block p-1 md:p-3 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-700">
          {caption} ({data.length})
          <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="px-3 py-2 lg:mb-3 lg:py-0 text-sm font-normal text-gray-500 dark:text-gray-400">
          <TextInput
            placeholder="検索..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <OverlayScrollbarsComponent
          ref={tableContainerRef}
          className="h-[calc(100vh-238px)] md:h-[calc(100vh-333px)] lg:h-[calc(100vh-366px)]"
        >
          <div className="relative">
            <div className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              {/* Header */}
              <div className="flex text-xs text-gray-700 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <div
                    key={headerGroup.id}
                    className="flex flex-1 bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
                  >
                    {headerGroup.headers.map((header) => (
                      <div
                        key={header.id}
                        className="relative px-6 py-3 min-w-0 flex-shrink-0"
                        style={{
                          width:
                            header.getSize() === Number.MAX_SAFE_INTEGER
                              ? "auto"
                              : header.getSize(),
                        }}
                      >
                        <div
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center cursor-pointer select-none whitespace-nowrap"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="ml-1 inline-block">
                              {{
                                asc: <HiChevronUp className="inline w-4 h-4" />,
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
                              header.column.getIsResizing() ? "bg-blue-500" : ""
                            }`}
                          ></div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Body */}
              <div
                className="relative"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
                {virtualRows.map((virtualRow, idx) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;

                  return (
                    <div key={row.id}>
                      <div
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={(el) => rowVirtualizer.measureElement(el)}
                        onClick={() =>
                          onRowClick?.(row.original.lastVideo?.video_id ?? "")
                        }
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={`flex ${
                          onRowClick ? "cursor-pointer select-none" : ""
                        } ${
                          idx % 2 === 0
                            ? "bg-gray-200/50 dark:bg-gray-800/70"
                            : ""
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <div
                            key={cell.id}
                            className="px-6 py-2 min-w-0 flex-shrink-0"
                            style={{
                              width:
                                cell.column.getSize() ===
                                Number.MAX_SAFE_INTEGER
                                  ? "auto"
                                  : cell.column.getSize(),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        ))}
                      </div>

                      {selectedVideoId &&
                        row.original.lastVideo?.video_id === selectedVideoId &&
                        songs && (
                          <div
                            className="p-4 bg-gray-100 dark:bg-gray-800 relative z-50 shadow-inner shadow-gray-500/50 dark:shadow-gray-900"
                            style={{
                              transform: `translateY(${virtualRow.end}px)`,
                            }}
                          >
                            <h3 className="text-lg font-semibold mb-2">
                              セットリスト (
                              {
                                songs.filter(
                                  (s) => s.video_id === selectedVideoId
                                ).length
                              }
                              曲)
                            </h3>
                            <div className="w-full">
                              {/* Inner Header */}
                              <div className="flex text-xs text-gray-700  bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <div className="flex-shrink-0 w-20 px-3 py-1">
                                  再生
                                </div>
                                <div className="flex-shrink-0 w-32 px-3 py-1">
                                  タイムスタンプ
                                </div>
                                <div className="flex-1 min-w-0 px-3 py-1">
                                  曲名
                                </div>
                                <div className="flex-1 min-w-0 px-3 py-1">
                                  アーティスト
                                </div>
                                <div className="flex-1 min-w-0 px-3 py-1 hidden md:block">
                                  タグ
                                </div>
                              </div>
                              {/* Inner Body */}
                              <div className="w-full">
                                {songs
                                  .filter((s) => s.video_id === selectedVideoId)
                                  .sort(
                                    (a, b) =>
                                      parseInt(a.start) - parseInt(b.start)
                                  )
                                  .map((s) => (
                                    <div
                                      key={`${s.video_id}-${s.start}`}
                                      className="flex items-center w-full border-b border-gray-200 dark:border-gray-700"
                                    >
                                      <div className="flex-shrink-0 w-20 px-3 py-1 text-center">
                                        <Link
                                          href={`/?v=${s.video_id}&t=${s.start}s&q=video_id:${s.video_id}`}
                                          className=" hover:text-primary-600 dark:hover:text-white"
                                        >
                                          <BsPlayCircle
                                            size={24}
                                            className="inline"
                                          />
                                        </Link>
                                      </div>
                                      <div className="flex-shrink-0 w-32 px-3 py-1 text-sm">
                                        {new Date(parseInt(s.start) * 1000)
                                          .toISOString()
                                          .substring(11, 19)}
                                      </div>
                                      <div className="flex-1 min-w-0 px-3 py-1 text-sm">
                                        <Link
                                          href={`/?q=title:${s.title}`}
                                          className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                                        >
                                          {s.title}
                                        </Link>
                                      </div>
                                      <div className="flex-1 min-w-0 px-3 py-1 text-sm">
                                        <Link
                                          href={`/?q=artist:${s.artist}`}
                                          className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                                        >
                                          {s.artist}
                                        </Link>
                                      </div>
                                      <div className="flex-1 min-w-0 px-3 py-1 text-sm hidden md:block">
                                        {s.tags.map((tag) => (
                                          <Badge
                                            key={tag}
                                            className="inline mr-1 lg:whitespace-nowrap"
                                          >
                                            <Link href={`/?q=tag:${tag}`}>
                                              {tag}
                                            </Link>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
}
