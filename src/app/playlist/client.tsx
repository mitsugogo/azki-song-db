"use client";

import { useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Checkbox,
  Group,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useSelection } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { FaPlus, FaStar } from "react-icons/fa6";
import { Link } from "@/i18n/navigation";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import SignedInOnly from "../components/SignedInOnly";
import usePlaylists from "../hook/usePlaylists";
import useFavorites from "../hook/useFavorites";
import type { Playlist } from "../lib/playlistUrl";
import { pageClasses } from "../theme";
import Loading from "../loading";
import {
  DeleteConfirmation,
  PlaylistBreadcrumbs,
  PlaylistDate,
  PlaylistPlayButton,
  PlaylistShareModal,
  SelectionBar,
  usePlaylistVisibilityLabels,
} from "./PlaylistControls";

function PlaylistName({ playlist }: { playlist: Playlist }) {
  return (
    <Anchor
      component={Link}
      href={{ pathname: "/playlist/detail", query: { id: playlist.id } }}
      fw={500}
      style={{ overflowWrap: "anywhere" }}
    >
      {playlist.id === "system-favorites" && (
        <FaStar
          aria-hidden
          style={{
            display: "inline",
            marginRight: 8,
            color: "var(--mantine-color-yellow-6)",
          }}
        />
      )}
      {playlist.name}
    </Anchor>
  );
}

function PlaylistActions({
  playlist,
  onShare,
}: {
  playlist: Playlist;
  onShare: () => void;
}) {
  const t = useTranslations("Playlist");
  return (
    <Group gap="xs" wrap="wrap">
      <PlaylistPlayButton playlist={playlist} compact />
      {playlist.id !== "system-favorites" && (
        <Button
          size="sm"
          variant="subtle"
          disabled={!playlist.id}
          onClick={onShare}
          aria-label={t("shareNamed", { name: playlist.name })}
        >
          {t("share")}
        </Button>
      )}
    </Group>
  );
}

export default function PlaylistPage() {
  return (
    <SignedInOnly>
      <PlaylistPageContent />
    </SignedInOnly>
  );
}

function PlaylistPageContent() {
  const t = useTranslations("Playlist");
  const visibilityLabels = usePlaylistVisibilityLabels();
  const { playlists, deletePlaylist, updatePlaylist, getMaxLimit, ready } =
    usePlaylists();
  const { favorites } = useFavorites();
  const [createOpened, setCreateOpened] = useState(false);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const selectableIds = playlists.flatMap((p) =>
    p.id && p.id !== "system-favorites" ? [p.id] : [],
  );
  const [selection, handlers] = useSelection({ data: selectableIds });
  const selected = selection.filter((id) => selectableIds.includes(id));
  const allSelected =
    selectableIds.length > 0 && selected.length === selectableIds.length;
  const allPlaylists: Playlist[] = favorites.length
    ? [
        {
          id: "system-favorites",
          name: t("favoritesName"),
          songs: favorites,
          visibility: "PRIVATE",
        },
        ...playlists,
      ]
    : playlists;
  const visibilityLabel = (playlist: Playlist) => (
    <Badge
      variant="light"
      radius="sm"
      color={
        playlist.visibility === "PUBLIC"
          ? "green"
          : playlist.visibility === "UNLISTED"
            ? "blue"
            : "gray"
      }
      styles={{
        root: { maxWidth: "100%", height: "auto", paddingBlock: 4 },
        label: { whiteSpace: "normal", overflowWrap: "anywhere" },
      }}
    >
      {visibilityLabels[playlist.visibility ?? "PRIVATE"]}
    </Badge>
  );
  const toggleAll = () =>
    allSelected
      ? handlers.resetSelection()
      : handlers.setSelection(selectableIds);
  const checkbox = (playlist: Playlist) =>
    playlist.id !== "system-favorites" && (
      <Checkbox
        aria-label={t("selectNamed", { name: playlist.name })}
        checked={selected.includes(playlist.id ?? "")}
        disabled={!playlist.id}
        onChange={() => playlist.id && handlers.toggle(playlist.id)}
      />
    );
  const songCount = (playlist: Playlist) =>
    `${playlist.songs.length}${playlist.id === "system-favorites" ? "" : ` / ${getMaxLimit()}`}`;

  return (
    <div className={pageClasses.shell}>
      <PlaylistBreadcrumbs />
      <Group justify="space-between" align="center" mb="lg">
        <h1 className={pageClasses.heading}>{t("manageTitle")}</h1>
        <Button
          leftSection={<FaPlus />}
          onClick={() => setCreateOpened(true)}
          disabled={!ready}
        >
          {t("createNew")}
        </Button>
      </Group>
      <CreatePlaylistModal
        onenModal={createOpened}
        setOpenModal={setCreateOpened}
      />
      {!ready ? (
        <Loading />
      ) : allPlaylists.length === 0 ? (
        <Text c="dimmed" size="sm" py="xl">
          {t("empty")}
        </Text>
      ) : (
        <>
          <Checkbox
            label={t("selectAll")}
            checked={allSelected}
            indeterminate={selected.length > 0 && !allSelected}
            disabled={!selectableIds.length}
            onChange={toggleAll}
            mb="md"
          />
          <SelectionBar
            count={selected.length}
            onReset={handlers.resetSelection}
            onDelete={() => setDeleteOpened(true)}
          />
          <div className="hidden lg:block">
            <Table highlightOnHover verticalSpacing="sm" layout="fixed">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={44}>
                    <span className="sr-only">{t("selectionActions")}</span>
                  </Table.Th>
                  <Table.Th>{t("head.name")}</Table.Th>
                  <Table.Th w="10%">{t("head.songs")}</Table.Th>
                  <Table.Th w="15%">{t("head.updatedAt")}</Table.Th>
                  <Table.Th w="20%">{t("visibility.label")}</Table.Th>
                  <Table.Th w={195}>{t("actions")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {allPlaylists.map((playlist) => (
                  <Table.Tr
                    key={playlist.id}
                    bg={
                      selected.includes(playlist.id ?? "")
                        ? "var(--mantine-primary-color-light)"
                        : undefined
                    }
                  >
                    <Table.Td>{checkbox(playlist)}</Table.Td>
                    <Table.Td>
                      <PlaylistName playlist={playlist} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{songCount(playlist)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        <PlaylistDate value={playlist.updatedAt} />
                      </Text>
                    </Table.Td>
                    <Table.Td>{visibilityLabel(playlist)}</Table.Td>
                    <Table.Td>
                      <PlaylistActions
                        playlist={playlist}
                        onShare={() => setShareId(playlist.id ?? null)}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
          <Stack
            component="ul"
            gap={0}
            className="lg:hidden"
            m={0}
            p={0}
            style={{ listStyle: "none" }}
          >
            {allPlaylists.map((playlist) => (
              <li
                key={playlist.id}
                style={{
                  borderBottom: "1px solid var(--mantine-color-default-border)",
                  padding: "var(--mantine-spacing-md) 0",
                  background: selected.includes(playlist.id ?? "")
                    ? "var(--mantine-primary-color-light)"
                    : undefined,
                }}
              >
                <Group wrap="nowrap" align="flex-start" gap="sm">
                  {checkbox(playlist)}
                  <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    <PlaylistName playlist={playlist} />
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        {t("songsLabel")} {songCount(playlist)}
                      </Text>
                      {visibilityLabel(playlist)}
                    </Group>
                    {playlist.updatedAt && (
                      <Text size="xs" c="dimmed">
                        {t("updatedLabel")}{" "}
                        <PlaylistDate value={playlist.updatedAt} />
                      </Text>
                    )}
                    <PlaylistActions
                      playlist={playlist}
                      onShare={() => setShareId(playlist.id ?? null)}
                    />
                  </Stack>
                </Group>
              </li>
            ))}
          </Stack>
        </>
      )}
      <PlaylistShareModal
        playlist={playlists.find((p) => p.id === shareId) ?? null}
        onClose={() => setShareId(null)}
        onUpdate={updatePlaylist}
      />
      <DeleteConfirmation
        opened={deleteOpened}
        message={t("confirmDelete", { count: selected.length })}
        onClose={() => setDeleteOpened(false)}
        onConfirm={() => {
          playlists
            .filter((p) => p.id && selected.includes(p.id))
            .forEach(deletePlaylist);
          handlers.resetSelection();
          setDeleteOpened(false);
        }}
      />
    </div>
  );
}
