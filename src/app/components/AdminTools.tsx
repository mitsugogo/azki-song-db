"use client";

import {
  Alert,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaCheck,
  FaCircleExclamation,
  FaFloppyDisk,
  FaPlus,
} from "react-icons/fa6";
import { useAdminMode } from "../context/AdminModeContext";
import useChannels from "../hook/useChannels";
import type { YouTubeApiVideoResult } from "../types/api/yt/video";
import type { Song } from "../types/song";

type AdminToolsProps = {
  currentSong: Song | null;
  videoInfo?: YouTubeApiVideoResult | null;
  onSongUpdated?: (song: Song) => void;
};

type MetadataForm = {
  title: string;
  artist: string;
  album: string;
  singer: string;
  videoTitle: string;
  broadcastDate: string;
  tags: string;
  extra: string;
};

type Status = "idle" | "loading" | "success" | "error";

const emptyForm: MetadataForm = {
  title: "",
  artist: "",
  album: "",
  singer: "",
  videoTitle: "",
  broadcastDate: "",
  tags: "",
  extra: "",
};

const toInputDate = (value: string | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const parseTags = (value: string) =>
  value
    .split(/[,、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
};

export default function AdminTools(props: AdminToolsProps) {
  const { enabled } = useAdminMode();

  if (!enabled) return null;

  return <EnabledAdminTools {...props} />;
}

function EnabledAdminTools({
  currentSong,
  videoInfo,
  onSongUpdated,
}: AdminToolsProps) {
  const t = useTranslations("AdminTools");
  const { channels } = useChannels();
  const [channelStatus, setChannelStatus] = useState<Status>("idle");
  const [channelError, setChannelError] = useState("");
  const [metadataStatus, setMetadataStatus] = useState<Status>("idle");
  const [metadataError, setMetadataError] = useState("");
  const [form, setForm] = useState<MetadataForm>(emptyForm);
  const [resolvedChannelName, setResolvedChannelName] = useState("");
  const [channelStatusChannelId, setChannelStatusChannelId] = useState("");
  const channelContextVersionRef = useRef(0);

  const channelId = videoInfo?.snippet?.channelId?.trim() ?? "";
  const currentChannelIdRef = useRef(channelId);
  currentChannelIdRef.current = channelId;
  const channelName =
    resolvedChannelName || videoInfo?.snippet?.channelTitle?.trim() || "";
  const channelListed = useMemo(
    () =>
      Boolean(
        channelId &&
        channels.some((channel) => channel.youtubeId === channelId),
      ),
    [channelId, channels],
  );

  useEffect(() => {
    setResolvedChannelName("");
    setChannelStatus("idle");
    setChannelError("");
    setChannelStatusChannelId("");
    channelContextVersionRef.current += 1;
  }, [channelId]);

  const isCurrentChannelStatus = channelStatusChannelId === channelId;

  useEffect(() => {
    if (!currentSong) {
      setForm(emptyForm);
      return;
    }

    setForm({
      title: currentSong.hl?.ja?.title || currentSong.title || "",
      artist: currentSong.hl?.ja?.artist || currentSong.artist || "",
      album: currentSong.hl?.ja?.album || currentSong.album || "",
      singer: currentSong.hl?.ja?.sing || currentSong.sing || "",
      videoTitle:
        currentSong.video_title || videoInfo?.snippet?.title?.trim() || "",
      broadcastDate: toInputDate(currentSong.broadcast_at),
      tags: currentSong.tags.join("、"),
      extra: currentSong.extra || "",
    });
    setMetadataStatus("idle");
    setMetadataError("");
  }, [currentSong, videoInfo?.snippet?.title]);

  const updateField = (field: keyof MetadataForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMetadataStatus("idle");
    setMetadataError("");
  };

  const addChannel = async () => {
    if (!channelId || !channelName) return;
    const requestContextVersion = channelContextVersionRef.current;
    const requestChannelId = channelId;
    setChannelStatusChannelId(requestChannelId);
    setChannelStatus("loading");
    setChannelError("");

    try {
      const response = await fetch("/api/admin/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert-channel",
          channelId,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, t("error")));
      }
      const result = (await response.json()) as { channelName?: unknown };
      if (
        requestContextVersion !== channelContextVersionRef.current ||
        requestChannelId !== currentChannelIdRef.current
      ) {
        return;
      }
      if (typeof result.channelName === "string") {
        setResolvedChannelName(result.channelName.trim());
      }
      setChannelStatus("success");
    } catch (error) {
      if (
        requestContextVersion !== channelContextVersionRef.current ||
        requestChannelId !== currentChannelIdRef.current
      ) {
        return;
      }
      setChannelStatus("error");
      setChannelError(error instanceof Error ? error.message : t("error"));
    }
  };

  const saveMetadata = async () => {
    if (!currentSong?.video_id) return;
    setMetadataStatus("loading");
    setMetadataError("");

    try {
      const response = await fetch("/api/admin/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-song-metadata",
          videoId: currentSong.video_id,
          videoUri: currentSong.video_uri,
          start: currentSong.start,
          matchTitle: currentSong.hl?.ja?.title || currentSong.title,
          matchArtist: currentSong.hl?.ja?.artist || currentSong.artist,
          matchAlbum: currentSong.hl?.ja?.album || currentSong.album,
          albumListUri: currentSong.album_list_uri,
          ...form,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, t("error")));
      }

      const updatedSong: Song = {
        ...currentSong,
        title: form.title,
        artist: form.artist,
        artists: parseTags(form.artist),
        album: form.album,
        sing: form.singer,
        sings: parseTags(form.singer),
        video_title: form.videoTitle,
        broadcast_at: form.broadcastDate
          ? `${form.broadcastDate}T00:00:00.000Z`
          : "",
        year: form.broadcastDate ? Number(form.broadcastDate.slice(0, 4)) : 0,
        tags: parseTags(form.tags),
        extra: form.extra,
        hl: {
          ...currentSong.hl,
          ja: {
            ...currentSong.hl.ja,
            title: form.title,
            artist: form.artist,
            artists: parseTags(form.artist),
            album: form.album,
            sing: form.singer,
            sings: parseTags(form.singer),
          },
        },
      };
      onSongUpdated?.(updatedSong);
      setMetadataStatus("success");
    } catch (error) {
      setMetadataStatus("error");
      setMetadataError(error instanceof Error ? error.message : t("error"));
    }
  };

  return (
    <Paper
      data-testid="admin-tools"
      withBorder
      radius="md"
      p="sm"
      mt="sm"
      className="border-amber-300/60 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20"
    >
      <Stack gap="sm">
        <Text fw={700}>{t("title")}</Text>

        <div>
          <Text size="sm" fw={600} mb={4}>
            {t("channelTitle")}
          </Text>
          {channelId && channelName ? (
            <Stack gap={2}>
              <Text size="sm" className="break-all">
                {t("channelName")}: {channelName}
              </Text>
              <Text size="xs" c="dimmed" className="break-all">
                {t("channelId")}: {channelId}
              </Text>
              {channelListed ||
              (isCurrentChannelStatus && channelStatus === "success") ? (
                <Text size="sm" c="green" className="flex items-center gap-1">
                  <FaCheck aria-hidden /> {t("channelListed")}
                </Text>
              ) : (
                <>
                  <Text size="sm" c="orange">
                    {t("channelMissing")}
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    color="orange"
                    leftSection={<FaPlus aria-hidden />}
                    loading={
                      isCurrentChannelStatus && channelStatus === "loading"
                    }
                    onClick={() => void addChannel()}
                  >
                    {channelStatus === "loading"
                      ? t("addingChannel")
                      : t("addChannel")}
                  </Button>
                </>
              )}
              {isCurrentChannelStatus && channelStatus === "success" && (
                <Text size="xs" c="green">
                  {t("channelAdded")}
                </Text>
              )}
              {isCurrentChannelStatus && channelStatus === "error" && (
                <Alert
                  color="red"
                  icon={<FaCircleExclamation aria-hidden />}
                  p="xs"
                >
                  {channelError || t("error")}
                </Alert>
              )}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              {t("noChannel")}
            </Text>
          )}
        </div>

        <Divider />

        <div>
          <Text size="sm" fw={600} mb="xs">
            {t("metadataTitle")}
          </Text>
          {!currentSong ? (
            <Text size="sm" c="dimmed">
              {t("noSong")}
            </Text>
          ) : (
            <Stack gap="xs">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <TextInput
                  label={t("titleLabel")}
                  value={form.title}
                  onChange={(event) =>
                    updateField("title", event.currentTarget.value)
                  }
                />
                <TextInput
                  label={t("artist")}
                  value={form.artist}
                  onChange={(event) =>
                    updateField("artist", event.currentTarget.value)
                  }
                />
                <TextInput
                  label={t("album")}
                  value={form.album}
                  onChange={(event) =>
                    updateField("album", event.currentTarget.value)
                  }
                />
                <TextInput
                  label={t("singer")}
                  value={form.singer}
                  onChange={(event) =>
                    updateField("singer", event.currentTarget.value)
                  }
                />
                <TextInput
                  label={t("videoTitle")}
                  value={form.videoTitle}
                  onChange={(event) =>
                    updateField("videoTitle", event.currentTarget.value)
                  }
                />
                <TextInput
                  type="date"
                  label={t("broadcastDate")}
                  value={form.broadcastDate}
                  onChange={(event) =>
                    updateField("broadcastDate", event.currentTarget.value)
                  }
                />
              </div>
              <TextInput
                label={t("tags")}
                value={form.tags}
                onChange={(event) =>
                  updateField("tags", event.currentTarget.value)
                }
              />
              <Textarea
                label={t("extra")}
                value={form.extra}
                autosize
                minRows={2}
                onChange={(event) =>
                  updateField("extra", event.currentTarget.value)
                }
              />
              <Group justify="flex-end" align="center" gap="xs">
                {metadataStatus === "success" && (
                  <Text size="sm" c="green">
                    {t("saved")}
                  </Text>
                )}
                <Button
                  size="sm"
                  leftSection={<FaFloppyDisk aria-hidden />}
                  loading={metadataStatus === "loading"}
                  onClick={() => void saveMetadata()}
                >
                  {metadataStatus === "loading" ? t("saving") : t("save")}
                </Button>
              </Group>
              {metadataStatus === "error" && (
                <Alert
                  color="red"
                  icon={<FaCircleExclamation aria-hidden />}
                  p="xs"
                >
                  {metadataError || t("error")}
                </Alert>
              )}
            </Stack>
          )}
        </div>
      </Stack>
    </Paper>
  );
}
