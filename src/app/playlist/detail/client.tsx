"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Anchor,
  Breadcrumbs,
  Button,
  Checkbox,
  ScrollArea,
  Table,
} from "@mantine/core";
import { useSelection } from "@mantine/hooks";
import usePlaylists, { Playlist } from "../../hook/usePlaylists";
import { Song } from "@/app/types/song";
import Link from "next/link";
import Loading from "@/app/loading";
import { FaRegTrashCan, FaBars } from "react-icons/fa6"; // FaBarsを追加

import {
  DndContext,
  closestCenter,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PlaylistWithSongs = {
  id: string;
  name: string;
  songs: {
    videoId: string;
    start: number;
    songinfo: Song;
  }[];
};

const SortableRow = ({
  s,
  index,
  playlist,
  encodePlaylistUrlParam,
  isSelected,
  onCheckboxChange,
}: {
  s: PlaylistWithSongs["songs"][0];
  index: number;
  playlist: Playlist;
  encodePlaylistUrlParam: (playlist: Playlist) => string;
  isSelected: boolean;
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `${s.videoId}-${s.start}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Table.Tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      bg={isSelected ? "var(--mantine-color-blue-light)" : undefined}
    >
      <Table.Td>
        {/* ドラッグハンドル */}
        <div {...listeners} className="cursor-grab hover:text-blue-500">
          <FaBars />
        </div>
      </Table.Td>
      <Table.Td>
        <Checkbox
          aria-label="Select row"
          checked={isSelected}
          onChange={onCheckboxChange}
        />
      </Table.Td>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>
        <div className="line-clamp-2">{s.songinfo.title}</div>
        <div className="line-clamp-1 text-xs text-light-gray-400 dark:text-gray-200">
          {s.songinfo.artist}
        </div>
      </Table.Td>
      <Table.Td>
        <Link
          href={`/?v=${s.videoId}&t=${
            s.start
          }&playlist=${encodePlaylistUrlParam(playlist)}`}
        >
          <Button color="gray">再生</Button>
        </Link>
      </Table.Td>
    </Table.Tr>
  );
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
          (song) =>
            song.video_id === s.videoId &&
            Number(String(song.start)) === Number(s.start)
        );
        return songInfo
          ? { ...s, start: Number(s.start), songinfo: songInfo }
          : null;
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
    console.log(keysToDelete);
    const updatedPlaylist = { ...playlist, songs: updatedSongs };
    updatePlaylist(updatedPlaylist);
    const updatedPlaylistSongsWithInfo = updatedSongs
      .map((s) => {
        const songInfo = allSongs.find(
          (song) =>
            song.video_id === s.videoId &&
            Number(song.start) === Number(s.start)
        );
        return songInfo
          ? { ...s, start: Number(s.start), songinfo: songInfo }
          : null;
      })
      .filter((s) => s !== null);

    setPlaylistSongs(
      updatedPlaylistSongsWithInfo as PlaylistWithSongs["songs"]
    );

    // Reset the selection
    handlers.resetSelection();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over?.id) {
      const oldIndex = rowKeys.indexOf(active.id as string);
      const newIndex = rowKeys.indexOf(over.id as string);

      const newSongs = arrayMove(playlistSongs, oldIndex, newIndex);

      setPlaylistSongs(newSongs);

      if (playlist) {
        const updatedPlaylist = {
          ...playlist,
          songs: newSongs.map((s) => ({
            videoId: s.videoId,
            start: String(s.start),
          })),
        };
        updatePlaylist(updatedPlaylist);
      }
    }
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

      <ScrollArea className="h-[calc(100vh-200px)] lg:h-[calc(100vh-260px)]">
        <Table striped highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>並べ替え</Table.Th>
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
              <Table.Th>曲/アーティスト</Table.Th>
              <Table.Th>動画</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {playlistSongs.length === 0 && (
            <Table.Tbody>
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center">
                  プレイリスト内に曲がありません
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={rowKeys}>
              <Table.Tbody>
                {playlistSongs.map((s, index) => {
                  const rowKey = `${s.videoId}-${s.start}`;
                  const isSelected = selection.includes(rowKey);
                  return (
                    <SortableRow
                      key={rowKey}
                      s={s}
                      index={index}
                      playlist={playlist}
                      encodePlaylistUrlParam={encodePlaylistUrlParam}
                      isSelected={isSelected}
                      onCheckboxChange={(event) => {
                        console.log(rowKey);
                        if (event.currentTarget.checked) {
                          handlers.select(rowKey);
                        } else {
                          handlers.deselect(rowKey);
                        }
                      }}
                    />
                  );
                })}
              </Table.Tbody>
            </SortableContext>
          </DndContext>
        </Table>
      </ScrollArea>
    </div>
  );
}
