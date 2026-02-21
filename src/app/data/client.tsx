"use client";

import { useEffect, useState, useRef } from "react";
import { Song } from "../types/song";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { HiChevronUp, HiChevronDown, HiArrowsUpDown } from "react-icons/hi2";
import Loading from "../loading";
import useSongs from "../hook/useSongs";
import { TextInput } from "flowbite-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { HiSearch } from "react-icons/hi";
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";
import columns from "./columns";

export default function ClientTable() {
  const { allSongs, isLoading } = useSongs();
  const songs = allSongs;
  const [filterQuery, setFilterQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableContainerRef = useRef<OverlayScrollbarsComponentRef>(null);

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
    // songs and isLoading are provided by useSongs
  }, [allSongs, isLoading]);

  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () =>
      tableContainerRef.current?.osInstance()?.elements().viewport as Element,
    estimateSize: () => 86,
    overscan: 15,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // 再描画されないケース（ブラウザバックなど）に備えて仮想化の再計測
  useEffect(() => {
    rowVirtualizer.measure();
  }, [rows.length]);

  // ブラウザの戻る/進む（popstate）で来たときに再計測
  useEffect(() => {
    const handlePop = () => {
      // OverlayScrollbars の再初期化が終わるまで少し待つ
      setTimeout(() => {
        try {
          rowVirtualizer.measure();
        } catch (e) {
          // 念のためエラーは無視しておく
        }
      }, 50);
    };

    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center w-full justify-center h-screen relative">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="grow p-0 lg:pb-0">
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
            className="h-[calc(100dvh-280px)] md:h-[calc(100dvh-290px)] lg:h-[calc(100dvh-353px)]"
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
