"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Anchor,
  Breadcrumbs,
  Button,
  Checkbox,
  CopyButton,
  Table,
} from "@mantine/core";
import { useSelection } from "@mantine/hooks";
import usePlaylists, { Playlist } from "../../hook/usePlaylists";
import { Song } from "@/app/types/song";
import Link from "next/link";
import { Breadcrumb } from "flowbite-react";
import Loading from "@/app/loading";
import { FaRegTrashCan } from "react-icons/fa6";

type PlaylistWithSongs = {
  id: string;
  name: string;
  songs: {
    videoId: string;
    start: number;
    songinfo: Song;
  }[];
};

export default function PlaylistDetailPage() {
  const [id, setId] = useState("");
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<
    PlaylistWithSongs["songs"]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const { playlists, updatePlaylist, encodePlaylistUrlParam, clearAllSongs } =
    usePlaylists();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  const rowKeys = useMemo(
    () => playlistSongs.map((s) => `${s.videoId}-${s.start}`),
    [playlistSongs]
  );

  const [selection, handlers] = useSelection({
    data: rowKeys,
    defaultSelection: [],
  });

  const breadcrumbs = [
    { title: "プレイリスト", href: "/playlist" },
    {
      title: `#${playlist?.id} (${playlist?.name})`,
      href: `/playlist/detail?id=${playlist?.id}`,
    },
  ].map((item, index) => (
    <Anchor href={item.href} key={index} underline="hover" c="pink" size="sm">
      {item.title}
    </Anchor>
  ));

  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    setId(id || "");
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setAllSongs(data);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!id) return;
    const currentPlaylist = playlists.find((p) => p.id === id);
    if (!currentPlaylist) {
      setPlaylist(null);
      setPlaylistSongs([]);
      return;
    }
    setPlaylist(currentPlaylist);

    const songsWithInfo = currentPlaylist.songs
      .map((s) => {
        const songInfo = allSongs.find(
          (song) => song.video_id === s.videoId && song.start === s.start
        );
        return songInfo ? { ...s, songinfo: songInfo } : null;
      })
      .filter((s) => s !== null);

    setPlaylistSongs(songsWithInfo as PlaylistWithSongs["songs"]);
  }, [playlists, allSongs, id]);

  const handleDeleteSelected = () => {
    if (!playlist) return;
    const keysToDelete = selection;
    const updatedSongs = playlist.songs.filter(
      (s) => !keysToDelete.includes(`${s.videoId}-${s.start}`)
    );
    const updatedPlaylist = { ...playlist, songs: updatedSongs };
    updatePlaylist(updatedPlaylist);
    handlers.resetSelection();
  };

  if (isLoading) {
    return (
      <div className="flex-grow lg:p-6 lg:pb-0">
        <h1 className="font-extrabold text-2xl p-3">プレイリストの管理</h1>
        <Loading />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-grow lg:p-6 lg:pb-0">
        <h1 className="font-extrabold text-2xl p-3">プレイリストの管理</h1>
        <div className="p-3">
          <p>このIDのプレイリストは見つかりません</p>
        </div>
      </div>
    );
  }

  const rows = playlistSongs.map((s, index) => {
    const rowKey = `${s.videoId}-${s.start}`;
    const isSelected = selection.includes(rowKey);

    return (
      <Table.Tr
        key={rowKey}
        bg={isSelected ? "var(--mantine-color-blue-light)" : undefined}
      >
        <Table.Td>
          <Checkbox
            aria-label="Select row"
            checked={isSelected}
            onChange={(event) => {
              if (event.currentTarget.checked) {
                handlers.select(rowKey);
              } else {
                handlers.deselect(rowKey);
              }
            }}
          />
        </Table.Td>
        <Table.Td>{index + 1}</Table.Td>
        <Table.Td>{s.songinfo.title}</Table.Td>
        <Table.Td>{s.songinfo.artist}</Table.Td>
        <Table.Td>
          <Link
            href={`/?v=${s.videoId}&t=${
              s.start
            }&playlist=${encodePlaylistUrlParam(playlist)}`}
          >
            <Button>再生</Button>
          </Link>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <div className="flex-grow pt-3 p-1 lg:p-6 lg:pb-0">
      <Breadcrumbs>{breadcrumbs}</Breadcrumbs>

      <h1 className="font-extrabold text-2xl p-3 pl-0">プレイリストの管理</h1>

      <div className="flex justify-between items-center mb-3 sm:flex-row sm:items-baseline">
        <h2 className="hidden lg:flex font-semibold">{`#${id} のプレイリスト: ${playlist.name}`}</h2>
        <div className="flex items-center gap-2 sm:mt-0">
          <Button
            color="red"
            onClick={handleDeleteSelected}
            disabled={selection.length === 0}
            className="sm:hidden"
          >
            選択した曲を削除
          </Button>
          <Button
            color="red"
            onClick={() => clearAllSongs(playlist)}
            disabled={playlist.songs.length === 0}
            className="sm:hidden"
          >
            <FaRegTrashCan className="mr-2" />{" "}
            <span className="hidden lg:inline">プレイリスト内の曲を</span>
            すべて削除
          </Button>
        </div>
      </div>

      <Table striped highlightOnHover withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                aria-label="Select deselect all rows"
                indeterminate={handlers.isSomeSelected()}
                checked={handlers.isAllSelected()}
                onChange={() => {
                  if (handlers.isAllSelected()) {
                    handlers.resetSelection();
                  } else {
                    handlers.setSelection(rowKeys);
                  }
                }}
              />
            </Table.Th>
            <Table.Th>#</Table.Th>
            <Table.Th>曲名</Table.Th>
            <Table.Th>アーティスト名</Table.Th>
            <Table.Th>動画</Table.Th>
          </Table.Tr>
        </Table.Thead>
        {rows.length === 0 && (
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={5} className="text-center">
                プレイリスト内に曲がありません
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        )}
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </div>
  );
}
