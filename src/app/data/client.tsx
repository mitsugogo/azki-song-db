"use client";

import { useEffect, useState, useMemo } from "react";
import { Song } from "../types/song";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { HiChevronUp, HiChevronDown, HiArrowsUpDown } from "react-icons/hi2";
import Loading from "../loading";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react";
import { FaStar } from "react-icons/fa6";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

export default function ClientTable() {
  const [isLoading, setIsLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);

  const [filterQuery, setFilterQuery] = useState("");

  const columns = useMemo<ColumnDef<Song>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: (info) => info.row.index + 1,
      },
      {
        accessorKey: "title",
        header: "タイトル",
        cell: (info) => (
          <Link
            href={`/?q=title:${info.getValue<string>()}`}
            className="hover:underline text-primary dark:text-white font-semibold"
          >
            {info.getValue<string>()}
          </Link>
        ),
      },
      {
        accessorKey: "artist",
        header: "アーティスト",
        cell: (info) => (
          <Link
            href={`/?q=artist:${info.getValue<string>()}`}
            className="hover:underline text-primary dark:text-white"
          >
            {info.getValue<string>()}
          </Link>
        ),
      },
      {
        accessorKey: "sing",
        header: "歌った人",
      },
      {
        accessorKey: "album",
        header: "アルバム",
      },
      {
        accessorKey: "album_release_at",
        header: "アルバム発売日",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue<string>()).toLocaleDateString("ja-JP")
            : "",
      },
      {
        accessorKey: "video_title",
        header: "動画タイトル",
        cell: (info) => (
          <Link
            href={`https://www.youtube.com/watch?v=${info.row.original.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary dark:text-white"
          >
            {info.getValue<string>()}
          </Link>
        ),
      },
      {
        accessorKey: "start",
        header: "開始タイムスタンプ",
        enableSorting: false,
        cell: (info) => {
          {
            return new Date(parseInt(info.getValue<string>()) * 1000)
              .toISOString()
              .substring(11, 19);
          }
        },
      },
      {
        accessorKey: "tags",
        header: "タグ",
        cell: (info) => info.getValue<string[]>().join(", "),
      },
      {
        accessorKey: "broadcast_at",
        header: "公開日",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue<string>()).toLocaleDateString("ja-JP")
            : "-",
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
                    <Badge
                      className={`bg-primary-600 hover:bg-primary-500 dark:bg-primary-800 dark:hover:bg-primary-700 text-white dark:text-white inline px-1.5 rounded`}
                    >
                      <FaStar className="inline relative" style={{ top: -1 }} />
                      &nbsp;
                      {m}
                    </Badge>
                  </Link>
                </div>
              ))
            : "",
      },
    ],
    []
  );

  const table = useReactTable({
    data: songs,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      globalFilter: filterQuery,
    },
    onGlobalFilterChange: setFilterQuery,
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

  if (isLoading) {
    return (
      <div className="flex items-center w-full justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <OverlayScrollbarsComponent
        element="div"
        className="lg:p-6 flex flex-col w-full h-full"
        options={{ scrollbars: { autoHide: "leave" } }}
        defer
      >
        <h1 className="font-extrabold text-2xl p-3 mb-2 dark:text-gray-200">
          <span className="text-2xl font-bold">収録データ</span>
        </h1>

        <p className="mb-4 text-gray-500 dark:text-gray-400">
          本データベースの情報を表示しています。
        </p>

        <div className="space-y-4 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="max-h-[80vh]">
            <Table striped hoverable className="table-fixed">
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHeadCell
                        key={header.id}
                        className="sticky top-0 bg-white"
                        style={{
                          position: "relative",
                          width: header.getSize(),
                        }}
                      >
                        <div
                          onClick={header.column.getToggleSortingHandler()}
                          className="p-2 cursor-pointer select-none whitespace-nowrap"
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
                            className={`resizer ${
                              header.column.getIsResizing() ? "isResizing" : ""
                            }`}
                          ></div>
                        )}
                      </TableHeadCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>

              <TableBody>
                {table.getSortedRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={`${
                          index % 2 === 0 ? "bg-gray-100" : ""
                        } w-full text-wrap break-all`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </>
  );
}
