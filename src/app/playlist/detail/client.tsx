"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Menu,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery, useSelection } from "@mantine/hooks";
import {
  DndContext,
  closestCenter,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FaEllipsis, FaRegTrashCan } from "react-icons/fa6";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import usePlaylists from "../../hook/usePlaylists";
import useFavorites from "../../hook/useFavorites";
import useSongs from "../../hook/useSongs";
import { useGlobalPlayer } from "../../hook/useGlobalPlayer";
import type { Playlist } from "../../lib/playlistUrl";
import type { Song } from "../../types/song";
import Loading from "../../loading";
import SignedInOnly from "../../components/SignedInOnly";
import { pageClasses } from "../../theme";
import {
  DeleteConfirmation,
  PlaylistBreadcrumbs,
  PlaylistPlayButton,
  SelectionBar,
} from "../PlaylistControls";
import SortablePlaylistSong, { playlistSongKey } from "./SortablePlaylistSong";

export default function PlaylistDetailPage() {
  return (
    <SignedInOnly>
      <PlaylistDetailPageContent />
    </SignedInOnly>
  );
}

function PlaylistDetailPageContent() {
  const t = useTranslations("Playlist");
  const [id, setId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<"selected" | "all" | null>(null);
  const desktop = useMediaQuery("(min-width: 64em)", false);
  const { allSongs, isLoading } = useSongs();
  const { playlists, updatePlaylist, clearAllSongs, ready } = usePlaylists();
  const {
    favorites,
    reorderFavorites,
    clearAllFavorites,
    removeMultipleFavorites,
  } = useFavorites();
  const { setCurrentSong, setCurrentTime, setIsPlaying, setIsMinimized } =
    useGlobalPlayer();
  useEffect(() => {
    setId(new URL(window.location.href).searchParams.get("id") ?? "");
  }, []);
  const isFavorites = id === "system-favorites";
  const playlist: Playlist | undefined = isFavorites
    ? { id: "system-favorites", name: t("favoritesName"), songs: favorites }
    : playlists.find((p) => p.id === id);
  const rowKeys = playlist?.songs.map(playlistSongKey) ?? [];
  const [selection, handlers] = useSelection({ data: rowKeys });
  const selected = selection.filter((key) => rowKeys.includes(key));
  const allSelected = rowKeys.length > 0 && selected.length === rowKeys.length;
  const songIndex = useMemo(() => {
    const index = new Map<string, Song>();
    for (const song of allSongs) {
      const key = `${song.video_id}-${Number(song.start)}`;
      // Match the first catalog entry, as the previous Array.find lookup did.
      if (!index.has(key)) index.set(key, song);
    }
    return index;
  }, [allSongs]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!playlist || !over || active.id === over.id) return;
    const from = rowKeys.indexOf(String(active.id));
    const to = rowKeys.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    // Keep every stored entry, including songs no longer present in the catalog.
    const songs = arrayMove(playlist.songs, from, to);
    if (isFavorites) reorderFavorites(songs);
    else updatePlaylist({ ...playlist, songs });
  };
  const preview = (song?: Song) => {
    if (!song) return;
    setCurrentSong(song);
    setCurrentTime(Number(song.start));
    setIsMinimized(true);
    setIsPlaying(true);
  };
  const confirmDelete = () => {
    if (!playlist) return;
    if (deleteMode === "all") {
      if (isFavorites) clearAllFavorites();
      else clearAllSongs(playlist);
    } else if (deleteMode === "selected") {
      if (isFavorites)
        removeMultipleFavorites(
          favorites.filter((entry) =>
            selected.includes(playlistSongKey(entry)),
          ),
        );
      else
        updatePlaylist({
          ...playlist,
          songs: playlist.songs.filter(
            (entry) => !selected.includes(playlistSongKey(entry)),
          ),
        });
    }
    handlers.resetSelection();
    setDeleteMode(null);
  };
  const loading = !ready || isLoading || id === null;
  const rows = playlist?.songs.map((entry, index) => {
    const key = playlistSongKey(entry);
    const song = songIndex.get(`${entry.videoId}-${Number(entry.start)}`);
    return (
      <SortablePlaylistSong
        key={key}
        entry={entry}
        song={song}
        index={index}
        desktop={desktop}
        selected={selected.includes(key)}
        onSelect={() => handlers.toggle(key)}
        onPreview={() => preview(song)}
      />
    );
  });

  return (
    <div className={pageClasses.shell}>
      <PlaylistBreadcrumbs name={!loading ? playlist?.name : undefined} />
      {loading ? (
        <>
          <h1 className={pageClasses.heading}>{t("manageTitle")}</h1>
          <Loading />
        </>
      ) : !playlist ? (
        <Stack align="flex-start">
          <h1 className={pageClasses.heading}>{t("manageTitle")}</h1>
          <Text c="dimmed" size="sm">
            {t("detail.notFound")}
          </Text>
          <Button component={Link} href="/playlist" variant="default">
            {t("backToList")}
          </Button>
        </Stack>
      ) : (
        <>
          <Stack gap="sm" mb="lg">
            <h1
              className={pageClasses.heading}
              style={{ overflowWrap: "anywhere" }}
            >
              {playlist.name}
            </h1>
            <Group justify="space-between" align="flex-start">
              <Stack gap={4} style={{ flex: "1 1 240px", minWidth: 0 }}>
                <Text size="sm" c="dimmed">
                  {t("shared.songCount", { count: playlist.songs.length })}
                </Text>
                {playlist.songs.length > 1 && (
                  <Text size="xs" c="dimmed">
                    {t("detail.reorderHint")}
                  </Text>
                )}
              </Stack>
              <Group gap="xs">
                <PlaylistPlayButton playlist={playlist} />
                <Menu position="bottom-end" returnFocus>
                  <Menu.Target>
                    <Tooltip label={t("actions")}>
                      <ActionIcon
                        variant="default"
                        size="lg"
                        aria-label={t("actions")}
                      >
                        <FaEllipsis />
                      </ActionIcon>
                    </Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      color="red"
                      leftSection={<FaRegTrashCan />}
                      disabled={!playlist.songs.length}
                      onClick={() => setDeleteMode("all")}
                    >
                      {t("detail.clearAllSongs")}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Stack>
          {playlist.songs.length === 0 ? (
            <Text c="dimmed" size="sm" py="xl">
              {t("detail.table.empty")}
            </Text>
          ) : (
            <>
              <Checkbox
                label={t("selectAll")}
                checked={allSelected}
                indeterminate={selected.length > 0 && !allSelected}
                onChange={() =>
                  allSelected
                    ? handlers.resetSelection()
                    : handlers.setSelection(rowKeys)
                }
                mb="md"
              />
              <SelectionBar
                count={selected.length}
                onReset={handlers.resetSelection}
                onDelete={() => setDeleteMode("selected")}
              />
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={rowKeys}
                  strategy={verticalListSortingStrategy}
                >
                  {desktop ? (
                    <Table highlightOnHover verticalSpacing="sm" layout="fixed">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th w={56}>
                            <span className="sr-only">
                              {t("detail.table.sort")}
                            </span>
                          </Table.Th>
                          <Table.Th w={44}>
                            <span className="sr-only">
                              {t("selectionActions")}
                            </span>
                          </Table.Th>
                          <Table.Th w={44}>#</Table.Th>
                          <Table.Th w="30%">
                            {t("detail.table.trackArtist")}
                          </Table.Th>
                          <Table.Th>{t("detail.table.video")}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                  ) : (
                    <Stack
                      component="ul"
                      m={0}
                      p={0}
                      gap={0}
                      style={{ listStyle: "none" }}
                    >
                      {rows}
                    </Stack>
                  )}
                </SortableContext>
              </DndContext>
            </>
          )}
          <DeleteConfirmation
            opened={deleteMode !== null}
            message={t("detail.confirmDeleteSongs", {
              count:
                deleteMode === "all" ? playlist.songs.length : selected.length,
            })}
            onClose={() => setDeleteMode(null)}
            onConfirm={confirmDelete}
          />
        </>
      )}
    </div>
  );
}
