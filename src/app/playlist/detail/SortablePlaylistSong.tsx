"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale, useTranslations } from "next-intl";
import { FaBars, FaYoutube } from "react-icons/fa6";
import { LuPlay } from "react-icons/lu";
import type { PlaylistEntry } from "../../lib/playlistUrl";
import type { Song } from "../../types/song";
import { formatDate } from "../../lib/formatDate";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";

export function playlistSongKey(entry: PlaylistEntry) {
  return `${entry.videoId}-${entry.start}`;
}

export default function SortablePlaylistSong({
  entry,
  song,
  index,
  desktop,
  selected,
  onSelect,
  onPreview,
}: {
  entry: PlaylistEntry;
  song?: Song;
  index: number;
  desktop: boolean;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const t = useTranslations("Playlist");
  const locale = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: playlistSongKey(entry) });
  const title = song?.title ?? t("detail.unavailable");
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: selected ? "var(--mantine-primary-color-light)" : undefined,
  };
  const handleLabel = t("detail.reorderNamed", { name: title });
  const handle = (
    <Tooltip label={handleLabel}>
      <ActionIcon
        ref={setActivatorNodeRef}
        variant="subtle"
        color="gray"
        size="lg"
        aria-label={handleLabel}
        {...attributes}
        {...listeners}
        style={{ touchAction: "none", cursor: "grab" }}
      >
        <FaBars />
      </ActionIcon>
    </Tooltip>
  );
  const checkbox = (
    <Checkbox
      aria-label={t("selectNamed", { name: title })}
      checked={selected}
      onChange={onSelect}
    />
  );
  const track = (
    <Stack gap={2} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
      <Text size="sm" fw={500}>
        {title}
      </Text>
      <Text size="xs" c="dimmed">
        {song?.artist ?? entry.videoId}
      </Text>
    </Stack>
  );
  const video = (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      {desktop && (
        <Box
          w={112}
          h={63}
          style={{
            flexShrink: 0,
            overflow: "hidden",
            borderRadius: "var(--mantine-radius-sm)",
          }}
        >
          <YoutubeThumbnail
            videoId={entry.videoId}
            alt={song?.video_title ?? entry.videoId}
            imageClassName="object-cover"
          />
        </Box>
      )}
      <Stack
        gap="xs"
        style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
      >
        {song && (
          <Text size="sm" lineClamp={2}>
            {song.video_title}
          </Text>
        )}
        {song?.broadcast_at && (
          <Text size="xs" c="dimmed">
            {formatDate(song.broadcast_at, locale)} {t("detail.streamed")}
          </Text>
        )}
        <Group gap="xs">
          <Badge
            component="a"
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(entry.videoId)}${Number(entry.start) > 0 ? `&t=${Number(entry.start)}s` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            color="red"
            radius="sm"
            size="lg"
            style={{ cursor: "pointer" }}
            leftSection={<FaYoutube />}
            aria-label={t("detail.youtubeNamed", { name: title })}
          >
            {t("detail.youtube")}
          </Badge>
          <Button
            variant="light"
            size="compact-sm"
            leftSection={<LuPlay />}
            disabled={!song}
            onClick={onPreview}
            aria-label={t("detail.previewNamed", { name: title })}
          >
            {t("detail.preview")}
          </Button>
        </Group>
      </Stack>
    </Group>
  );

  return desktop ? (
    <Table.Tr ref={setNodeRef} style={style}>
      <Table.Td>{handle}</Table.Td>
      <Table.Td>{checkbox}</Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {index + 1}
        </Text>
      </Table.Td>
      <Table.Td>{track}</Table.Td>
      <Table.Td>{video}</Table.Td>
    </Table.Tr>
  ) : (
    <Box
      component="li"
      ref={setNodeRef}
      style={{
        ...style,
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
      py="md"
    >
      <Group gap="xs" align="flex-start" wrap="nowrap">
        {handle}
        <Box pt={9}>{checkbox}</Box>
        <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            {index + 1}
          </Text>
          {track}
          {video}
        </Stack>
      </Group>
    </Box>
  );
}
