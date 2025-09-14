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
import { useMemo, useState } from "react";
import useDebounce from "../hook/useDebounce";
import Loading from "../loading";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { HiArrowsUpDown } from "react-icons/hi2";
import Link from "next/link";
import { BsPlayCircle } from "react-icons/bs";

export default function DataTable<
  T extends
    | { lastVideo?: { video_title: string; video_id: string } }
    | StatisticsItem,
>({
  data,
  caption,
  description,
  columns,
  loading,
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
  loading: boolean;
  initialSortColumnId?: string;
  initialSortDirection?: "asc" | "desc";
  onRowClick?: (id: string) => void;
  selectedVideoId?: string | null;
  songs?: Song[];
}) {
  const [inputValue, setInputValue] = useState("");
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const debouncedFilter = useDebounce(inputValue, 300);

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
                value={inputValue}
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
                      header.getContext(),
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
              <TableRow
                key={row.id}
                onClick={() =>
                  onRowClick?.(row.original.lastVideo?.video_id ?? "")
                }
                className="cursor-pointer"
              >
                {row.getVisibleCells().map((cell, idx) => (
                  <TableCell key={cell.id} className={`py-1 px-3`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    {selectedVideoId &&
                      idx === 0 &&
                      row.original.lastVideo?.video_id === selectedVideoId &&
                      songs && (
                        <div className="p-4 bg-gray-100 dark:bg-gray-800">
                          <h3 className="text-lg font-semibold mb-2">
                            セットリスト (
                            {
                              songs.filter(
                                (s) => s.video_id === selectedVideoId,
                              ).length
                            }
                            曲)
                          </h3>
                          <Table className="w-full">
                            <TableHead>
                              <TableHeadCell>再生</TableHeadCell>
                              <TableHeadCell>タイムスタンプ</TableHeadCell>
                              <TableHeadCell>曲名</TableHeadCell>
                              <TableHeadCell>アーティスト</TableHeadCell>
                              <TableHeadCell>タグ</TableHeadCell>
                            </TableHead>
                            <TableBody>
                              {songs
                                .filter((s) => s.video_id === selectedVideoId)
                                .sort(
                                  (a, b) =>
                                    parseInt(a.start) - parseInt(b.start),
                                )
                                .map((s) => (
                                  <TableRow key={`${s.video_id}-${s.start}`}>
                                    <TableCell className="text-center">
                                      <Link
                                        href={`/?v=${s.video_id}&t=${s.start}s&q=video_id:${s.video_id}`}
                                        className=" hover:text-primary-600 dark:hover:text-white"
                                      >
                                        <BsPlayCircle
                                          size={24}
                                          className="inline"
                                        />
                                      </Link>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {new Date(parseInt(s.start) * 1000)
                                        .toISOString()
                                        .substring(11, 19)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      <Link
                                        href={`/?q=title:${s.title}`}
                                        className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                                      >
                                        {s.title}
                                      </Link>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      <Link
                                        href={`/?q=artist:${s.artist}`}
                                        className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
                                      >
                                        {s.artist}
                                      </Link>
                                    </TableCell>
                                    <TableCell className="text-sm">
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
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
