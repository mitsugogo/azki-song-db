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
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={`py-1 px-3`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
