"use client";

import { useEffect, useRef, useState, type UIEvent } from "react";
import { ScrollToTopButton } from "../components/ScrollToTopButton";
import { flexRender, useTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { HiChevronUp, HiChevronDown, HiArrowsUpDown } from "react-icons/hi2";
import Loading from "../loading";
import useSongs from "../hook/useSongs";
import { usePageScrollVirtualizer } from "../hook/usePageScrollVirtualizer";
import { usePageNavigationViewport } from "../components/PageNavigationLayoutContext";
import { HiSearch } from "react-icons/hi";
import { ScrollArea, TextInput } from "@mantine/core";
import { getColumns } from "./columns";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { pageClasses } from "../theme";
import { appTableFeatures } from "../lib/tanstackTable";

export default function ClientTable() {
  const { allSongs, isLoading } = useSongs();
  const songs = allSongs;
  const [filterQuery, setFilterQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const viewportRef = usePageNavigationViewport();
  const listRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("Data");
  const locale = useLocale();

  const table = useTable({
    features: appTableFeatures,
    data: songs,
    columns: getColumns(t, locale),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      globalFilter: filterQuery,
      sorting,
    },
    onGlobalFilterChange: setFilterQuery,
    onSortingChange: setSorting,
  });

  const rows = table.getRowModel().rows;

  const rowVirtualizer = usePageScrollVirtualizer(listRef, {
    count: rows.length,
    estimateSize: () => 86,
    overscan: 15,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const tableWidth = table.getTotalSize();

  // 横方向だけを表内でスクロールし、列見出しと本文の位置を揃える。
  const syncHorizontalScroll = (
    event: UIEvent<HTMLDivElement>,
    target: HTMLDivElement | null,
  ) => {
    const scrollLeft = event.currentTarget.scrollLeft;
    if (target && Math.abs(target.scrollLeft - scrollLeft) >= 1) {
      target.scrollLeft = scrollLeft;
    }
  };

  // 再描画されないケース（ブラウザバックなど）に備えて仮想化の再計測
  useEffect(() => {
    rowVirtualizer.measure();
  }, [rows.length]);

  // ブラウザの戻る/進む（popstate）で来たときに再計測
  useEffect(() => {
    const handlePop = () => {
      // 描画の反映後に再計測する
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
      <div className="grow min-w-0 w-full lg:pb-0">
        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <p className={pageClasses.description}>{t("description")}</p>
        <div className="block w-full rounded-lg shadow-sm dark:border-gray-700">
          <div className="sticky top-0 z-20 space-y-4 bg-white/95 py-2 backdrop-blur dark:bg-gray-900/95">
            <TextInput
              placeholder={t("searchPlaceholder")}
              leftSection={<HiSearch />}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            <ScrollArea
              viewportRef={headerScrollRef}
              type="auto"
              scrollbars="x"
              scrollbarSize={8}
              offsetScrollbars="present"
              viewportProps={{
                onScroll: (event) =>
                  syncHorizontalScroll(event, bodyScrollRef.current),
              }}
            >
              {/* ヘッダー部分 */}
              <div
                className="flex text-xs text-gray-700"
                style={{ width: tableWidth }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <div
                    key={headerGroup.id}
                    className="flex flex-1 bg-white/30 dark:bg-gray-900/40 border-b border-white/20 dark:border-white/10 backdrop-blur-sm shadow-[0_4px_12px_rgba(15,23,42,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:text-white"
                  >
                    {headerGroup.headers.map((header) => (
                      <div
                        key={header.id}
                        className="relative px-6 py-3 min-w-0 shrink-0"
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
            </ScrollArea>
          </div>
          <div
            ref={bodyScrollRef}
            className="overflow-x-auto text-sm text-left"
            onScroll={(event) =>
              syncHorizontalScroll(event, headerScrollRef.current)
            }
          >
            {/* ボディ部分 */}
            <div
              ref={listRef}
              className="relative"
              style={{
                width: tableWidth,
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
                      transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                    }}
                    className={`flex border-b border-light-gray-200/30 dark:border-gray-700/50 bg-white/15 dark:bg-gray-900/15 hover:bg-white/30 dark:hover:bg-gray-800/30 transition duration-150 ${
                      parseInt(row.id) % 2 === 0 ? "" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        className="px-6 py-2 min-w-0 shrink-0"
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
      </div>
      <ScrollToTopButton scrollElement={viewportRef?.current} />
    </>
  );
}
