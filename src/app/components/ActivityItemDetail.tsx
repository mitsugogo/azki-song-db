"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AspectRatio,
  Avatar,
  Badge,
  getDefaultZIndex,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import type { YouTubeEvent } from "react-youtube";
import { Link } from "@/i18n/navigation";
import { BsGeoAlt } from "react-icons/bs";
import { FaDatabase, FaYoutube } from "react-icons/fa6";
import { useOptionalGlobalPlayer } from "../hook/useGlobalPlayer";
import type { ActivityTimelineItem } from "../hook/useActivityTimeline";
import {
  buildActivityChannelIndexes,
  buildActivityItemPresentation,
} from "../lib/activityItemPresentation";
import { formatDate } from "../lib/formatDate";
import type { ChannelEntry } from "../types/api/yt/channels";
import { normalizeArchiveSeriesKey } from "../stream-archives/archiveSearch";
import TimestampComment from "../stream-archives/TimestampComment";
import ArchiveMembersOnlyNotice from "../stream-archives/ArchiveMembersOnlyNotice";
import YoutubeThumbnail from "./YoutubeThumbnail";
import {
  SharedYouTubePlayerSlot,
  useSharedYouTubePlayerSource,
} from "./SharedYouTubePlayer";

const ACTIVITY_DETAIL_PLAYER_SOURCE_ID = "activity-detail";
const ACTIVITY_DETAIL_PLAYER_Z_INDEX = getDefaultZIndex("modal") + 1;

const activityBadgeColors: Record<ActivityTimelineItem["kind"], string> = {
  song_update: "pink",
  archive: "cyan",
  view_milestone: "yellow",
  milestone: "violet",
  event: "blue",
  anniversary: "pink",
};

function isExternalHref(href: string | null | undefined) {
  return href?.startsWith("http://") || href?.startsWith("https://");
}

type ActivityDetailPlayerProps = {
  active: boolean;
  videoId: string;
  title: string;
  youtubeHref: string;
};

function ActivityDetailPlayer({
  active,
  videoId,
  title,
  youtubeHref,
}: ActivityDetailPlayerProps) {
  const t = useTranslations("Summary");
  const globalPlayer = useOptionalGlobalPlayer();
  const setCurrentSong = globalPlayer?.setCurrentSong;
  const setIsPlaying = globalPlayer?.setIsPlaying;
  const setIsMinimized = globalPlayer?.setIsMinimized;
  const [playerFailed, setPlayerFailed] = useState(false);

  useEffect(() => {
    if (!active) return;

    setIsPlaying?.(false);
    setCurrentSong?.(null);
    setIsMinimized?.(false);
  }, [active, setCurrentSong, setIsMinimized, setIsPlaying, videoId]);

  const handleReady = useCallback((event: YouTubeEvent<any>) => {
    event.target?.pauseVideo?.();
  }, []);
  const handleStateChange = useCallback((_event: YouTubeEvent<any>) => {}, []);
  const handleError = useCallback((_event: YouTubeEvent<any>) => {
    setPlayerFailed(true);
  }, []);
  const sharedPlayerSource = useMemo(
    () => ({
      sourceId: ACTIVITY_DETAIL_PLAYER_SOURCE_ID,
      active: active && !playerFailed,
      videoId,
      showNativeControls: true,
      autoPlay: false,
      zIndex: ACTIVITY_DETAIL_PLAYER_Z_INDEX,
      onReady: handleReady,
      onStateChange: handleStateChange,
      onError: handleError,
    }),
    [
      active,
      handleError,
      handleReady,
      handleStateChange,
      playerFailed,
      videoId,
    ],
  );

  useSharedYouTubePlayerSource(sharedPlayerSource);

  return (
    <AspectRatio
      ratio={16 / 9}
      className="w-full overflow-hidden bg-black"
      role="region"
      aria-label={t("calendarActivityPlayerLabel", { title })}
      data-testid="activity-detail-player"
      data-player-failed={playerFailed || undefined}
    >
      {playerFailed ? (
        <Link
          href={youtubeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block h-full w-full"
          aria-label={t("calendarActivityPlayerFallbackLink", { title })}
        >
          <YoutubeThumbnail
            videoId={videoId}
            alt={title}
            imageClassName="object-cover"
          />
          <span className="absolute inset-x-3 bottom-3 rounded-md bg-black/75 px-3 py-2 text-center text-sm font-semibold text-white">
            {t("calendarActivityPlayerFallback")}
          </span>
        </Link>
      ) : (
        <SharedYouTubePlayerSlot
          sourceId={ACTIVITY_DETAIL_PLAYER_SOURCE_ID}
          active={active}
          className="h-full w-full"
        />
      )}
    </AspectRatio>
  );
}

export type ActivityItemDetailProps = {
  item: ActivityTimelineItem;
  channels: ChannelEntry[];
  active: boolean;
};

export default function ActivityItemDetail({
  item,
  channels,
  active,
}: ActivityItemDetailProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const tArchives = useTranslations("Archives");
  const tDiscography = useTranslations("Discography");
  const tSummary = useTranslations("Summary");
  const channelIndexes = useMemo(
    () => buildActivityChannelIndexes(channels),
    [channels],
  );
  const presentation = buildActivityItemPresentation(
    item,
    t,
    locale,
    channelIndexes,
  );
  const titleIsExternal = isExternalHref(presentation.titleHref);
  const detailDescriptionHref =
    item.kind === "archive" ? undefined : presentation.timelineDescriptionHref;
  const descriptionIsExternal = isExternalHref(detailDescriptionHref);
  const archiveMetadataColumnCount =
    item.kind === "archive"
      ? 1 +
        Number(Boolean(item.archive.video_duration.trim())) +
        Number(Boolean(item.archive.topic.trim()))
      : 0;
  const archiveSeriesHref =
    item.kind === "archive" && item.archive.topic.trim()
      ? `/stream-archives?${new URLSearchParams({
          series: normalizeArchiveSeriesKey(item.archive.topic),
        }).toString()}`
      : null;

  return (
    <div data-testid="activity-item-detail" data-activity-kind={item.kind}>
      {item.videoId && presentation.youtubeHref ? (
        <ActivityDetailPlayer
          active={active}
          videoId={item.videoId}
          title={presentation.detailTitle}
          youtubeHref={presentation.youtubeHref}
        />
      ) : null}

      <Stack gap="md" className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0">
          <Badge
            size="sm"
            radius="sm"
            color={activityBadgeColors[item.kind]}
            variant="light"
            className="mb-2"
          >
            {presentation.badge}
          </Badge>
          {item.kind === "archive" && item.archive.member_only ? (
            <div className="mb-3">
              <ArchiveMembersOnlyNotice
                badgeLabel={tArchives("memberOnlyBadge")}
                publicInfoNote={tArchives("publicInfoOnlyNote")}
              />
            </div>
          ) : null}
          <Title
            order={2}
            className="w-full text-xl leading-snug text-gray-950 sm:text-2xl dark:text-white"
            data-testid="activity-detail-title"
          >
            {presentation.titleHref ? (
              <Link
                href={presentation.titleHref}
                target={titleIsExternal ? "_blank" : undefined}
                rel={titleIsExternal ? "noopener noreferrer" : undefined}
                className="block w-full transition hover:text-primary dark:hover:text-pink-200"
              >
                {presentation.detailTitle}
              </Link>
            ) : (
              presentation.detailTitle
            )}
          </Title>
        </div>

        {presentation.archiveChannel ? (
          <Group gap="sm" wrap="nowrap">
            {presentation.archiveChannel.iconUrl ? (
              <Avatar
                src={presentation.archiveChannel.iconUrl}
                alt={presentation.archiveChannel.name}
                size="lg"
                radius="xl"
              />
            ) : (
              <Avatar size="lg" radius="xl" color="red" variant="light">
                <FaYoutube />
              </Avatar>
            )}
            {presentation.archiveChannel.channelUrl ? (
              <Link
                href={presentation.archiveChannel.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 text-base font-semibold text-gray-900 hover:text-primary hover:underline dark:text-white dark:hover:text-pink-200"
              >
                {presentation.archiveChannel.name}
              </Link>
            ) : (
              <Text fw={600}>{presentation.archiveChannel.name}</Text>
            )}
          </Group>
        ) : null}

        {presentation.singers.length > 0 ? (
          <Group gap="sm">
            {presentation.singers.map((singer) => {
              const singerContent = (
                <Group key={singer.name} gap="xs" wrap="nowrap">
                  <Avatar
                    src={singer.iconUrl}
                    alt={singer.name}
                    size="md"
                    radius="xl"
                  />
                  <Text fw={600} size="sm">
                    {singer.name}
                  </Text>
                </Group>
              );

              return singer.channelUrl ? (
                <Link
                  key={singer.name}
                  href={singer.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full hover:text-primary dark:hover:text-pink-200"
                >
                  {singerContent}
                </Link>
              ) : (
                singerContent
              );
            })}
          </Group>
        ) : null}

        {item.kind === "archive" ? (
          <Paper
            radius="md"
            p="md"
            withBorder
            data-testid="activity-detail-archive-metadata"
          >
            <SimpleGrid
              cols={{ base: 1, sm: archiveMetadataColumnCount }}
              spacing="md"
            >
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={600}>
                  {tArchives("publishedAtLabel")}
                </Text>
                <Text size="sm" fw={600}>
                  {formatDate(item.occurredAt, locale)}
                </Text>
              </Stack>
              {item.archive.video_duration.trim() ? (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600}>
                    {tArchives("videoDurationLabel")}
                  </Text>
                  <Text size="sm" fw={600}>
                    {item.archive.video_duration}
                  </Text>
                </Stack>
              ) : null}
              {item.archive.topic.trim() ? (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600}>
                    {tArchives("topicLabel")}
                  </Text>
                  <Text size="sm" fw={600}>
                    <Link
                      href={archiveSeriesHref!}
                      className="text-primary hover:underline dark:text-pink-200"
                    >
                      {item.archive.topic}
                    </Link>
                  </Text>
                </Stack>
              ) : null}
            </SimpleGrid>
          </Paper>
        ) : null}

        <Stack gap={6}>
          <Group
            justify={item.kind === "archive" ? "flex-end" : "space-between"}
            align="center"
            gap="sm"
          >
            {item.kind !== "archive" ? (
              <Text size="sm" c="dimmed">
                {formatDate(item.occurredAt, locale)}
              </Text>
            ) : null}
            {presentation.youtubeHref ||
            (item.kind === "archive" && item.databaseHref) ? (
              <Group gap="md">
                {item.kind === "archive" && item.databaseHref ? (
                  <Link
                    href={item.databaseHref}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline dark:text-pink-200"
                  >
                    <FaDatabase aria-hidden="true" />
                    {tDiscography("buttons.viewInDatabase")}
                  </Link>
                ) : null}
                {presentation.youtubeHref ? (
                  <Link
                    href={presentation.youtubeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    <FaYoutube aria-hidden="true" />
                    {tSummary("calendarActivityOpenYoutube")}
                  </Link>
                ) : null}
              </Group>
            ) : null}
          </Group>
          {presentation.placeLabel ? (
            <Text component="div" size="sm" c="dimmed">
              <BsGeoAlt className="-mt-0.5 mr-1 inline" />
              {presentation.placeHref ? (
                <Link
                  href={presentation.placeHref}
                  target={
                    isExternalHref(presentation.placeHref)
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    isExternalHref(presentation.placeHref)
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="hover:underline"
                >
                  {presentation.placeLabel}
                </Link>
              ) : (
                presentation.placeLabel
              )}
            </Text>
          ) : null}
        </Stack>

        {presentation.detailDescription ? (
          <Paper
            radius="md"
            p="md"
            className="bg-light-gray-100/75 dark:bg-white/5"
            data-testid="activity-detail-description"
          >
            <Text
              component="div"
              size="md"
              className="whitespace-pre-wrap leading-7 text-gray-800 dark:text-gray-100"
            >
              {detailDescriptionHref ? (
                <Link
                  href={detailDescriptionHref}
                  target={descriptionIsExternal ? "_blank" : undefined}
                  rel={
                    descriptionIsExternal ? "noopener noreferrer" : undefined
                  }
                  className="hover:text-primary hover:underline dark:hover:text-pink-200"
                >
                  {presentation.detailDescription}
                </Link>
              ) : (
                presentation.detailDescription
              )}
            </Text>
          </Paper>
        ) : null}

        {item.kind === "archive" && item.archive.timestamp_comment.trim() ? (
          <Paper
            radius="md"
            p="md"
            withBorder
            data-testid="activity-detail-timestamps"
          >
            <Stack gap="xs">
              <Title order={3} size="h4">
                {tArchives("timestampLabel")}
              </Title>
              <TimestampComment
                comment={item.archive.timestamp_comment}
                videoId={item.archive.video_id}
              />
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </div>
  );
}
