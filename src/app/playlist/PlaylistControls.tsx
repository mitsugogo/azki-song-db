"use client";

import {
  Breadcrumbs,
  Button,
  CopyButton,
  Group,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { FaPlay } from "react-icons/fa6";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { breadcrumbClasses } from "../theme";
import { encodePlaylistUrlParam, type Playlist } from "../lib/playlistUrl";

export function usePlaylistVisibilityLabels() {
  const t = useTranslations("Playlist");
  return {
    PUBLIC: t("visibility.public"),
    UNLISTED: t("visibility.unlisted"),
    PRIVATE: t("visibility.private"),
  };
}

export function PlaylistBreadcrumbs({ name }: { name?: string }) {
  const t = useTranslations("Playlist");
  const g = useTranslations("DrawerMenu");
  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="w-4 h-4 mr-1.5" />
        {g("home")}
      </Link>
      {name ? (
        <Link href="/playlist" className={breadcrumbClasses.link}>
          {t("title")}
        </Link>
      ) : (
        <span className={breadcrumbClasses.link} aria-current="page">
          {t("title")}
        </span>
      )}
      {name && (
        <span className={breadcrumbClasses.link} aria-current="page">
          {name}
        </span>
      )}
    </Breadcrumbs>
  );
}

export function PlaylistPlayButton({
  playlist,
  compact = false,
}: {
  playlist: Playlist;
  compact?: boolean;
}) {
  const t = useTranslations("Playlist");
  const label = t("playNamed", { name: playlist.name });
  return playlist.songs.length === 0 ? (
    <Button
      size="sm"
      variant={compact ? "default" : "filled"}
      disabled
      leftSection={<FaPlay />}
      aria-label={label}
    >
      {t("head.play")}
    </Button>
  ) : (
    <Button
      component={Link}
      href={{
        pathname: "/",
        query: { playlist: encodePlaylistUrlParam(playlist) },
      }}
      size="sm"
      variant={compact ? "default" : "filled"}
      leftSection={<FaPlay />}
      aria-label={label}
    >
      {t("head.play")}
    </Button>
  );
}

export function SelectionBar({
  count,
  onReset,
  onDelete,
}: {
  count: number;
  onReset: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Playlist");
  if (!count) return null;
  return (
    <Group gap="sm" my="md" role="group" aria-label={t("selectionActions")}>
      <Text size="sm" aria-live="polite">
        {t("selectedCount", { count })}
      </Text>
      <Button size="sm" variant="subtle" color="gray" onClick={onReset}>
        {t("resetSelection")}
      </Button>
      <Button size="sm" variant="light" color="red" onClick={onDelete}>
        {t("deleteSelection")}
      </Button>
    </Group>
  );
}

export function DeleteConfirmation({
  opened,
  message,
  onClose,
  onConfirm,
}: {
  opened: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Playlist");
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("confirmTitle")}
      closeButtonProps={{ "aria-label": t("close") }}
      centered
    >
      <Stack>
        <Text size="sm">{message}</Text>
        <Group justify="flex-end">
          <Button variant="default" data-autofocus onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button color="red" onClick={onConfirm}>
            {t("delete")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function PlaylistDate({ value }: { value?: string }) {
  const locale = useLocale();
  if (!value || Number.isNaN(Date.parse(value))) return <>—</>;
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(value),
      )}
    </time>
  );
}

export function PlaylistShareModal({
  playlist,
  onClose,
  onUpdate,
}: {
  playlist: Playlist | null;
  onClose: () => void;
  onUpdate: (playlist: Playlist) => void;
}) {
  const t = useTranslations("Playlist");
  const locale = useLocale();
  const visibility = playlist?.visibility ?? "PRIVATE";
  const labels = usePlaylistVisibilityLabels();
  const canCopy = Boolean(
    playlist?.id && playlist.songs.length && visibility !== "PRIVATE",
  );
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const url =
    playlist?.id && typeof window !== "undefined"
      ? `${window.location.origin}${prefix}/playlist/shared/${encodeURIComponent(playlist.id)}`
      : "";
  return (
    <Modal
      opened={Boolean(playlist)}
      onClose={onClose}
      title={t("share")}
      closeButtonProps={{ "aria-label": t("close") }}
      centered
    >
      {playlist && (
        <Stack>
          <Text fw={500} style={{ overflowWrap: "anywhere" }}>
            {playlist.name}
          </Text>
          <Select
            label={t("visibility.label")}
            description={t("visibility.autoSave")}
            value={visibility}
            allowDeselect={false}
            data={Object.entries(labels).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(value) => {
              if (
                value === "PRIVATE" ||
                value === "UNLISTED" ||
                value === "PUBLIC"
              )
                onUpdate({ ...playlist, visibility: value });
            }}
          />
          <Text size="sm" c="dimmed">
            {t(`visibility.description.${visibility}`)}
          </Text>
          <CopyButton value={url} timeout={3000}>
            {({ copied, copy }) => (
              <Button variant="default" disabled={!canCopy} onClick={copy}>
                {copied ? t("copied") : t("copyUrl")}
              </Button>
            )}
          </CopyButton>
          {!canCopy && (
            <Text size="sm" c="dimmed">
              {t(
                visibility === "PRIVATE"
                  ? "visibility.privateCopyHint"
                  : "visibility.emptyCopyHint",
              )}
            </Text>
          )}
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              {t("head.createdAt")}: <PlaylistDate value={playlist.createdAt} />
            </Text>
            <Text size="xs" c="dimmed">
              {t("head.updatedAt")}: <PlaylistDate value={playlist.updatedAt} />
            </Text>
          </Stack>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t("close")}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
