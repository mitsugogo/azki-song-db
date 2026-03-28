"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Breadcrumbs,
  Button,
  Checkbox,
  ScrollArea,
  Table,
} from "@mantine/core";
import { useSelection } from "@mantine/hooks";
import usePlaylists, { Playlist } from "../../hook/usePlaylists";
import useFavorites from "../../hook/useFavorites";
import { Song } from "@/app/types/song";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import Loading from "@/app/loading";
import { FaRegTrashCan, FaBars } from "react-icons/fa6";
import { formatDate } from "../../lib/formatDate";

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
import { HiHome, HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";
import useSongs from "../../hook/useSongs";
import { useGlobalPlayer } from "../../hook/useGlobalPlayer";
import { LuPlay } from "react-icons/lu";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import { FaYoutube } from "react-icons/fa6";

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
  isSelected,
  onCheckboxChange,
  onPreview,
}: {
  s: PlaylistWithSongs["songs"][0];
  index: number;
  isSelected: boolean;
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPreview: () => void;
}) => {
  const t = useTranslations("Playlist");
  const locale = useLocale();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `${s.videoId}-${s.start}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const youtubeUrl = `https://www.youtube.com/watch?v=${s.videoId}${
    Number(s.start) > 0 ? `&t=${s.start}s` : ""
  }`;

  const formattedBroadcastDate = s.songinfo.broadcast_at
    ? formatDate(s.songinfo.broadcast_at, locale)
    : null;

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
          aria-label={t("aria.selectRow")}
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
        <div className="flex items-start gap-3 p-2.5" style={{ minWidth: 260 }}>
          <div className="relative h-20 w-34 shrink-0 overflow-hidden rounded-lg bg-black">
            <YoutubeThumbnail
              videoId={s.videoId}
              alt={s.songinfo.video_title}
              fill={true}
              imageClassName="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900 dark:text-white">
              {s.songinfo.video_title}
            </div>
            {formattedBroadcastDate && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-200">
                {formattedBroadcastDate} {t("detail.streamed")}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                <FaYoutube className="mr-1" />
                {t("detail.youtube")}
              </a>
              <Button color="pink" size="compact-sm" onClick={onPreview}>
                <LuPlay className="mr-1" />
                {t("detail.preview")}
              </Button>
            </div>
          </div>
        </div>
      </Table.Td>
    </Table.Tr>
  );
};

export default function PlaylistDetailPage() {
  const t = useTranslations("Playlist");
  const g = useTranslations("DrawerMenu");

  const [id, setId] = useState("");
  const { allSongs, isLoading } = useSongs();
  const [playlistSongs, setPlaylistSongs] = useState<
    PlaylistWithSongs["songs"]
  >([]);
  const { playlists, updatePlaylist, clearAllSongs } = usePlaylists();
  const {
    favorites,
    reorderFavorites,
    clearAllFavorites,
    removeMultipleFavorites,
  } = useFavorites();
  const { setCurrentSong, setCurrentTime, setIsPlaying, setIsMinimized } =
    useGlobalPlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isFavoritesMode, setIsFavoritesMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const rowKeys = useMemo(
    () => playlistSongs.map((s) => `${s.videoId}-${s.start}`),
    [playlistSongs],
  );

  const [selection, handlers] = useSelection({
    data: rowKeys,
    defaultSelection: [],
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    setId(id || "");
    setIsFavoritesMode(id === "system-favorites");
  }, []);

  useEffect(() => {
    if (!id) return;

    // お気に入りモードの場合
    if (isFavoritesMode) {
      const favoritesPlaylist: Playlist = {
        id: "system-favorites",
        name: t("favoritesName"),
        songs: favorites,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlaylist(favoritesPlaylist);

      const songsWithInfo = favorites
        .map((s) => {
          const songInfo = allSongs.find(
            (song) =>
              song.video_id === s.videoId &&
              Number(String(song.start)) === Number(s.start),
          );
          return songInfo
            ? { ...s, start: Number(s.start), songinfo: songInfo }
            : null;
        })
        .filter((s) => s !== null);

      setPlaylistSongs(songsWithInfo as PlaylistWithSongs["songs"]);
      return;
    }

    // 通常のプレイリストの場合
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
            Number(String(song.start)) === Number(s.start),
        );
        return songInfo
          ? { ...s, start: Number(s.start), songinfo: songInfo }
          : null;
      })
      .filter((s) => s !== null);

    setPlaylistSongs(songsWithInfo as PlaylistWithSongs["songs"]);
  }, [playlists, allSongs, id, isFavoritesMode, favorites]);

  const handleDeleteSelected = () => {
    if (!playlist) return;
    const keysToDelete = selection;

    // お気に入りモードの場合
    if (isFavoritesMode) {
      const entriesToDelete = favorites.filter((s) =>
        keysToDelete.includes(`${s.videoId}-${s.start}`),
      );
      removeMultipleFavorites(entriesToDelete);
      handlers.resetSelection();
      return;
    }

    // 通常のプレイリストの場合
    const updatedSongs = playlist.songs.filter(
      (s) => !keysToDelete.includes(`${s.videoId}-${s.start}`),
    );
    console.log(keysToDelete);
    const updatedPlaylist = { ...playlist, songs: updatedSongs };
    updatePlaylist(updatedPlaylist);
    const updatedPlaylistSongsWithInfo = updatedSongs
      .map((s) => {
        const songInfo = allSongs.find(
          (song) =>
            song.video_id === s.videoId &&
            Number(song.start) === Number(s.start),
        );
        return songInfo
          ? { ...s, start: Number(s.start), songinfo: songInfo }
          : null;
      })
      .filter((s) => s !== null);

    setPlaylistSongs(
      updatedPlaylistSongsWithInfo as PlaylistWithSongs["songs"],
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

      // お気に入りモードの場合
      if (isFavoritesMode) {
        const updatedFavorites = newSongs.map((s) => ({
          videoId: s.videoId,
          start: String(s.start),
        }));
        reorderFavorites(updatedFavorites);
        return;
      }

      // 通常のプレイリストの場合
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

  const handlePreviewSong = (song: Song) => {
    setCurrentSong(song);
    setCurrentTime(Number(song.start));
    setIsMinimized(true);
    setIsPlaying(true);
  };

  if (isLoading) {
    return (
      <div className="grow lg:p-6 lg:pb-0">
        <h1 className="font-extrabold text-2xl p-3">{t("manageTitle")}</h1>
        <Loading />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="grow lg:p-6 lg:pb-0">
        <h1 className="font-extrabold text-2xl p-3">{t("manageTitle")}</h1>
        <div className="p-3">
          <p>{t("detail.notFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grow pt-3 p-1 lg:p-6 lg:pb-0">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {g("home")}
        </Link>
        <Link href="/playlist" className={breadcrumbClasses.link}>
          {t("title")}
        </Link>
        <span className={breadcrumbClasses.link}>
          {t("detail.breadcrumbTitle", {
            id: playlist?.id ?? "",
            name: playlist?.name ?? "",
          })}
        </span>
      </Breadcrumbs>

      <h1 className="font-extrabold text-2xl p-3 pl-0">{t("manageTitle")}</h1>

      <div className="flex justify-between items-center mb-3 sm:flex-row sm:items-baseline">
        <h2 className="hidden lg:flex font-semibold">
          {t("detail.header", { id, name: playlist.name })}
        </h2>
        <div className="flex items-center gap-2 sm:mt-0">
          <Button
            color="red"
            onClick={handleDeleteSelected}
            disabled={selection.length === 0}
          >
            {t("detail.deleteSelectedSongs")}
          </Button>
          <Button
            color="red"
            onClick={() =>
              isFavoritesMode ? clearAllFavorites() : clearAllSongs(playlist)
            }
            disabled={playlist.songs.length === 0}
          >
            <FaRegTrashCan className="mr-2" /> {t("detail.clearAllSongs")}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] lg:h-[calc(100vh-260px)]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("detail.table.sort")}</Table.Th>
                <Table.Th>
                  <Checkbox
                    aria-label={t("detail.table.selectAll")}
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
                <Table.Th>{t("detail.table.trackArtist")}</Table.Th>
                <Table.Th>{t("detail.table.video")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            {playlistSongs.length === 0 && (
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center">
                    {t("detail.table.empty")}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            )}
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
                      isSelected={isSelected}
                      onCheckboxChange={(event) => {
                        if (event.currentTarget.checked) {
                          handlers.select(rowKey);
                        } else {
                          handlers.deselect(rowKey);
                        }
                      }}
                      onPreview={() => handlePreviewSong(s.songinfo)}
                    />
                  );
                })}
              </Table.Tbody>
            </SortableContext>
          </Table>
        </DndContext>
      </ScrollArea>
    </div>
  );
}
