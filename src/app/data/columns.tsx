import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Song } from "../types/song";
import { Badge } from "flowbite-react";
import MilestoneBadge from "../components/MilestoneBadge";
import { BsPlayCircle } from "react-icons/bs";

const formatDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString("ja-JP") : "-";
const formatTimeFromSeconds = (s?: string) => {
  if (!s) return "-";
  const n = parseInt(s || "0");
  if (Number.isNaN(n)) return "-";
  return new Date(n * 1000).toISOString().substring(11, 19);
};
const formatNumber = (n?: number) =>
  n != null && n !== 0 ? n.toLocaleString() : "-";

const renderArrayBadges = (items?: string[], queryKey?: string) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      {items.map((item, i) => (
        <Link
          key={i}
          href={`/search?q=${queryKey}:${encodeURIComponent(item)}`}
          className="hover:underline text-primary dark:text-primary-300 mr-2"
        >
          <Badge color="info" size="xs" className="inline-block">
            {item}
          </Badge>
        </Link>
      ))}
    </div>
  );
};

export const columns: ColumnDef<Song>[] = [
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
        href={`/?v=${info.row.original.video_id}${Number(info.row.original.start) > 0 ? `&t=${info.row.original.start}` : ""}`}
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
        href={`/search?q=title:${info.getValue<string>()}`}
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
        href={`/search?q=artist:${info.getValue<string>()}`}
        className="hover:underline text-primary dark:text-primary-300"
      >
        {info.getValue<string>()}
      </Link>
    ),
    size: 250,
    enableResizing: true,
  },
  {
    accessorKey: "lyricist",
    header: "作詞",
    cell: (info) => info.getValue<string>() || "",
    size: 200,
    enableResizing: true,
  },
  {
    accessorKey: "composer",
    header: "作曲",
    cell: (info) => info.getValue<string>() || "",
    size: 200,
    enableResizing: true,
  },
  {
    accessorKey: "arranger",
    header: "編曲",
    cell: (info) => info.getValue<string>() || "",
    size: 200,
    enableResizing: true,
  },
  {
    accessorKey: "sing",
    header: "歌った人",
    size: 300,
    cell: (info) => (
      <div>
        {(info.getValue<string>() || "").split("、").map((title, index) => (
          <Link
            key={index}
            href={`/search?q=sing:${encodeURIComponent(title)}`}
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
        href={`/search?q=album:${info.getValue<string>()}`}
        className="hover:underline text-primary dark:text-primary-300"
      >
        {info.getValue<string>()}
      </Link>
    ),
  },
  {
    accessorKey: "album_list_uri",
    header: "アルバム一覧URI",
    cell: (info) =>
      info.getValue<string>() ? (
        <Link href={info.getValue<string>()} target="_blank" rel="noreferrer">
          リンク
        </Link>
      ) : (
        ""
      ),
    size: 140,
  },
  {
    accessorKey: "album_release_at",
    header: "アルバム発売日",
    cell: (info) =>
      info.getValue() ? formatDate(info.getValue<string>()) : "",
    size: 150,
  },
  {
    accessorKey: "album_is_compilation",
    header: "コンピレーション",
    cell: (info) =>
      info.getValue<boolean>() ? (
        <Badge color="info" size="xs">
          Compilation
        </Badge>
      ) : (
        ""
      ),
    size: 120,
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
    cell: (info) => formatTimeFromSeconds(info.getValue<string>()),
    size: 120,
  },
  {
    accessorKey: "end",
    header: "終了タイムスタンプ",
    enableSorting: false,
    cell: (info) => formatTimeFromSeconds(info.getValue<string>()),
    size: 120,
  },
  {
    accessorKey: "tags",
    header: "タグ",
    cell: (info) => renderArrayBadges(info.getValue<string[]>(), "tag"),
    size: 350,
    enableResizing: true,
  },
  {
    accessorKey: "broadcast_at",
    header: "公開日",
    cell: (info) =>
      info.getValue() ? formatDate(info.getValue<string>()) : "-",
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
                href={`/search?q=milestone:${encodeURIComponent(m)}`}
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
  {
    accessorKey: "year",
    header: "年",
    cell: (info) =>
      info.getValue<number>() ? String(info.getValue<number>()) : "",
    size: 80,
  },
  {
    accessorKey: "view_count",
    header: "再生数",
    cell: (info) => formatNumber(info.getValue<number>()),
    size: 120,
  },
];

export default columns;
