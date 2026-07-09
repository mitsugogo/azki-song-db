"use client";

import type { MouseEvent, Ref } from "react";
import {
  Avatar,
  Badge,
  Button,
  Skeleton,
  Text,
  Timeline,
  Tooltip,
} from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BsGeoAlt } from "react-icons/bs";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import {
  LuArrowRight,
  LuMusic,
  LuSparkles,
  LuTrophy,
  LuVideo,
} from "react-icons/lu";
import YoutubeThumbnail from "./YoutubeThumbnail";
import { formatDate } from "../lib/formatDate";
import type { ActivityTimelineItem } from "../hook/useActivityTimeline";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { Song } from "../types/song";

type ActivityTimelineSectionProps = {
  items: ActivityTimelineItem[];
  isLoading: boolean;
  isViewMilestonesLoading?: boolean;
  shouldLoadViewStatistics: boolean;
  channels: ChannelEntry[];
  hasMoreItems?: boolean;
  showTitle?: boolean;
  onShowMore?: () => void;
  sectionRef?: Ref<HTMLElement>;
  className?: string;
  showArchivesLink?: boolean;
};

const activityTimelineColors: Record<ActivityTimelineItem["kind"], string> = {
  song_update: "pink",
  archive: "cyan",
  view_milestone: "yellow",
  milestone: "violet",
  event: "blue",
};

function formatActivityMilestoneCount(value: number, locale: string) {
  if (locale.startsWith("ja") && value >= 10000) {
    return `${Math.floor(value / 10000)}万`;
  }

  return new Intl.NumberFormat(locale, {
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function getActivityItemLabel(
  item: ActivityTimelineItem,
  t: ReturnType<typeof useTranslations>,
  locale: string,
) {
  if (item.kind === "song_update") {
    return {
      badge: t("activitySongUpdateBadge"),
      title: t("activitySongUpdateDescription", { count: item.count }),
      description: item.videoTitle || item.songs[0].title || "",
    };
  }

  if (item.kind === "archive") {
    return {
      badge: t("activityArchiveBadge"),
      title: t("activityArchiveTitle"),
      description: item.archive.title,
    };
  }

  if (item.kind === "milestone") {
    return {
      badge: t("activityMilestoneBadge"),
      title: item.milestone.content,
      description: item.milestone.note || "",
    };
  }

  if (item.kind === "event") {
    return {
      badge: t("activityEventBadge"),
      title: item.event.content,
      description: item.event.note || "",
    };
  }

  return {
    badge: t("activityViewMilestoneBadge"),
    title: t("activityViewMilestoneTitle", {
      title: item.song.title,
      count: formatActivityMilestoneCount(item.targetCount, locale),
    }),
    description: item.song.video_title || item.song.title,
  };
}

function getActivityItemBullet(kind: ActivityTimelineItem["kind"]) {
  if (kind === "song_update") {
    return <LuMusic size={14} />;
  }

  if (kind === "archive") {
    return <LuVideo size={14} />;
  }

  if (kind === "milestone") {
    return <LuSparkles size={14} />;
  }

  if (kind === "event") {
    return <BsGeoAlt size={14} />;
  }

  return <LuTrophy size={14} />;
}

function getActivityItemClasses(kind: ActivityTimelineItem["kind"]) {
  if (kind === "view_milestone") {
    return {
      item: "rounded-lg border border-yellow-300/50 bg-yellow-50/80 p-3 shadow-[0_12px_34px_rgba(202,138,4,0.16)] dark:border-yellow-300/25 dark:bg-yellow-300/10",
      title:
        "min-w-0 text-base font-bold leading-7 text-gray-950 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "w-32 sm:w-36",
      description: "font-medium text-gray-700 dark:text-gray-200",
    };
  }

  if (kind === "song_update") {
    return {
      item: "rounded-lg border border-primary/20 bg-primary/5 p-3 shadow-[0_8px_24px_rgba(190,24,93,0.1)] dark:border-pink-300/20 dark:bg-pink-300/10",
      title:
        "min-w-0 text-sm font-semibold leading-6 text-gray-900 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "w-28 sm:w-32",
      description: "font-medium text-gray-600 dark:text-gray-300",
    };
  }

  if (kind === "milestone" || kind === "event") {
    return {
      item: "py-1",
      title:
        "min-w-0 text-sm font-semibold leading-6 text-gray-800 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "",
      description: "text-xs text-gray-600 dark:text-gray-300",
    };
  }

  return {
    item: "py-1",
    title:
      "min-w-0 text-xs font-medium leading-5 text-gray-700 transition hover:text-primary dark:text-gray-200 dark:hover:text-pink-200",
    thumbnail: "w-16 opacity-80 sm:w-20",
    description: "text-xs text-gray-500 dark:text-gray-400",
  };
}

function getActivityTitleHref(item: ActivityTimelineItem) {
  return item.titleHref ?? item.href;
}

function getActivityDescriptionHref(item: ActivityTimelineItem) {
  if (
    item.kind === "archive" ||
    item.kind === "view_milestone" ||
    item.kind === "song_update"
  ) {
    return item.youtubeHref;
  }

  return undefined;
}

function getActivityPlaceHref(item: ActivityTimelineItem) {
  if (item.kind === "milestone") {
    return item.milestone.place_url || undefined;
  }

  if (item.kind === "event") {
    return item.event.place_url || undefined;
  }

  return undefined;
}

function getActivityPlaceLabel(item: ActivityTimelineItem) {
  if (item.kind === "milestone") {
    return item.milestone.place || "";
  }

  if (item.kind === "event") {
    return item.event.place || "";
  }

  return "";
}

function isExternalHref(href: string | undefined) {
  return href?.startsWith("http://") || href?.startsWith("https://");
}

function handleArchiveActivityLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string | undefined,
) {
  if (!href || typeof window === "undefined") {
    return;
  }

  event.preventDefault();
  const targetUrl = new URL(href, window.location.origin);
  window.location.assign(
    `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
  );
}

function getSingerNamesFromSong(song: Song) {
  const localizedSings = song.hl?.ja?.sings ?? [];
  if (localizedSings.length > 0) {
    return localizedSings.map((name) => name.trim()).filter(Boolean);
  }

  if (song.sings.length > 0) {
    return song.sings.map((name) => name.trim()).filter(Boolean);
  }

  return song.sing
    .split(/[、,]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function buildChannelUrl(entry: ChannelEntry) {
  if (entry.youtubeId) {
    return `https://www.youtube.com/channel/${entry.youtubeId}`;
  }

  const handle = (entry.handle ?? "").trim();
  if (!handle) {
    return null;
  }

  return `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`;
}

function buildChannelsBySingerName(channels: ChannelEntry[]) {
  const map = new Map<string, ChannelEntry>();

  channels.forEach((entry) => {
    const artistName = (entry.artistName ?? "").trim();
    if (artistName && !map.has(artistName)) {
      map.set(artistName, entry);
    }

    const channelName = (entry.channelName ?? "").trim();
    if (channelName && !map.has(channelName)) {
      map.set(channelName, entry);
    }
  });

  return map;
}

function getActivitySingerAvatars(
  item: ActivityTimelineItem,
  channelsBySingerName: Map<string, ChannelEntry>,
) {
  const activitySongs =
    item.kind === "song_update"
      ? item.songs
      : item.kind === "view_milestone"
        ? [item.song]
        : [];

  if (activitySongs.length === 0) {
    return [];
  }

  const avatars: Array<{
    name: string;
    iconUrl: string;
    channelUrl: string | null;
  }> = [];
  const seenChannels = new Set<string>();

  activitySongs.forEach((song) => {
    getSingerNamesFromSong(song).forEach((singerName) => {
      const entry = channelsBySingerName.get(singerName);
      const iconUrl = (entry?.iconUrl ?? "").trim();
      if (!iconUrl) {
        return;
      }

      const channelUrl = entry ? buildChannelUrl(entry) : null;
      const channelKey =
        (entry?.youtubeId ?? "").trim() ||
        channelUrl ||
        (entry?.channelName ?? "").trim() ||
        iconUrl;

      if (seenChannels.has(channelKey)) {
        return;
      }

      avatars.push({
        name: entry?.channelName || entry?.artistName || singerName,
        iconUrl,
        channelUrl,
      });
      seenChannels.add(channelKey);
    });
  });

  return avatars;
}

export default function ActivityTimelineSection({
  items,
  isLoading,
  isViewMilestonesLoading = false,
  shouldLoadViewStatistics,
  channels,
  hasMoreItems = false,
  showTitle = true,
  onShowMore,
  sectionRef,
  className = "mt-16",
  showArchivesLink = true,
}: ActivityTimelineSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const tDrawer = useTranslations("DrawerMenu");
  const channelsBySingerName = buildChannelsBySingerName(channels);

  return (
    <section ref={sectionRef} className={className}>
      {showTitle && (
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              {t("activityLabel")}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {t("activityTitle")}
            </h2>
          </div>
          {showArchivesLink ? (
            <Link
              href="/stream-archives"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
            >
              {tDrawer("archives")}
              <LuArrowRight className="shrink-0" />
            </Link>
          ) : null}
        </div>
      )}

      <div className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`activity-timeline-skeleton-${index}`}
                className="grid grid-cols-[32px_1fr] gap-3"
                aria-hidden="true"
              >
                <Skeleton height={28} circle />
                <div className="space-y-2">
                  <Skeleton height={14} width="45%" radius="sm" />
                  <Skeleton height={12} width="80%" radius="sm" />
                  <Skeleton height={10} width="28%" radius="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <Timeline
              active={items.length - 1}
              bulletSize={30}
              color="pink"
              lineWidth={2}
            >
              {items.map((item) => {
                const itemLabel = getActivityItemLabel(item, t, locale);
                const color = activityTimelineColors[item.kind];
                const itemClasses = getActivityItemClasses(item.kind);
                const titleHref = getActivityTitleHref(item);
                const thumbnailHref = item.youtubeHref ?? item.href;
                const descriptionHref = getActivityDescriptionHref(item);
                const placeHref = getActivityPlaceHref(item);
                const placeLabel = getActivityPlaceLabel(item);
                const titleIsExternal = isExternalHref(titleHref);
                const thumbnailIsExternal = isExternalHref(thumbnailHref);
                const descriptionIsExternal = isExternalHref(descriptionHref);
                const placeIsExternal = isExternalHref(placeHref);
                const activitySingerAvatars = getActivitySingerAvatars(
                  item,
                  channelsBySingerName,
                );
                const archiveLinkProps =
                  item.kind === "archive" && titleHref === item.href
                    ? {
                        onClick: (event: MouseEvent<HTMLAnchorElement>) =>
                          handleArchiveActivityLinkClick(event, item.href),
                      }
                    : {};

                return (
                  <Timeline.Item
                    key={item.id}
                    bullet={getActivityItemBullet(item.kind)}
                    title={
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          size="xs"
                          radius="sm"
                          color={color}
                          variant="light"
                          className="shrink-0"
                        >
                          {itemLabel.badge}
                        </Badge>
                        {titleHref ? (
                          <Link
                            href={titleHref}
                            className={itemClasses.title}
                            target={titleIsExternal ? "_blank" : undefined}
                            rel={
                              titleIsExternal
                                ? "noopener noreferrer"
                                : undefined
                            }
                            {...archiveLinkProps}
                          >
                            {itemLabel.title}
                          </Link>
                        ) : (
                          <span className={itemClasses.title}>
                            {itemLabel.title}
                          </span>
                        )}
                      </div>
                    }
                  >
                    <div className={`mt-2 ${itemClasses.item}`}>
                      <div className="flex items-start gap-3">
                        {item.videoId && thumbnailHref ? (
                          <Link
                            href={thumbnailHref}
                            className={`relative aspect-video shrink-0 overflow-hidden rounded-md bg-black ${itemClasses.thumbnail}`}
                            aria-label={itemLabel.title}
                            target={thumbnailIsExternal ? "_blank" : undefined}
                            rel={
                              thumbnailIsExternal
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            <YoutubeThumbnail
                              videoId={item.videoId}
                              alt={itemLabel.title}
                              imageClassName="object-cover transition duration-300"
                            />
                          </Link>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          {itemLabel.description ? (
                            <Text size="sm" className={itemClasses.description}>
                              {descriptionHref ? (
                                <Link
                                  href={descriptionHref}
                                  target={
                                    descriptionIsExternal ? "_blank" : undefined
                                  }
                                  rel={
                                    descriptionIsExternal
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                  className="transition hover:text-primary dark:hover:text-pink-200"
                                >
                                  {descriptionHref.includes("youtube.com") ||
                                  descriptionHref.includes("youtu.be") ? (
                                    <FaYoutube className="-mt-0.5 mr-1 w-3 h-3 inline text-[0.65rem] text-red-600 dark:text-red-500" />
                                  ) : descriptionHref.includes("twitter.com") ||
                                    descriptionHref.includes("x.com") ? (
                                    <FaXTwitter className="-mt-0.5 mr-1 w-3 h-3 inline text-[0.65rem] text-sky-600 dark:text-sky-500" />
                                  ) : null}
                                  {itemLabel.description}
                                </Link>
                              ) : (
                                itemLabel.description
                              )}
                            </Text>
                          ) : null}
                          {placeLabel ? (
                            <Text size="xs" c="dimmed" className="mt-1">
                              <BsGeoAlt className="-mt-0.5 mr-1 inline" />
                              {placeHref ? (
                                <Link
                                  href={placeHref}
                                  target={
                                    placeIsExternal ? "_blank" : undefined
                                  }
                                  rel={
                                    placeIsExternal
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                  className="hover:underline"
                                >
                                  {placeLabel}
                                </Link>
                              ) : (
                                placeLabel
                              )}
                            </Text>
                          ) : null}
                          {activitySingerAvatars.length > 0 ? (
                            <Avatar.Group className="mt-2" spacing="xxs">
                              {activitySingerAvatars.map((avatar) => {
                                const image = (
                                  <Avatar
                                    key={`${item.id}-${avatar.name}`}
                                    src={avatar.iconUrl}
                                    alt={avatar.name}
                                    radius="xl"
                                    size="sm"
                                    className="border-2 border-white dark:border-gray-900"
                                  />
                                );

                                return (
                                  <Tooltip
                                    key={`${item.id}-${avatar.name}`}
                                    label={avatar.name}
                                    withArrow
                                    arrowSize={8}
                                  >
                                    {avatar.channelUrl ? (
                                      <Link
                                        href={avatar.channelUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {image}
                                      </Link>
                                    ) : (
                                      image
                                    )}
                                  </Tooltip>
                                );
                              })}
                            </Avatar.Group>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <Text size="xs" c="dimmed" className="mt-1">
                      {formatDate(item.occurredAt, locale)}
                    </Text>
                  </Timeline.Item>
                );
              })}
            </Timeline>

            {shouldLoadViewStatistics && isViewMilestonesLoading ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <Skeleton height={20} width={20} circle />
                <Text size="xs" c="dimmed">
                  {t("activityViewMilestonesLoading")}
                </Text>
              </div>
            ) : null}

            {hasMoreItems && onShowMore ? (
              <div className="mt-5 flex justify-center">
                <Button
                  variant="light"
                  color="pink"
                  radius="xl"
                  onClick={onShowMore}
                >
                  {t("activityShowMore")}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("activityEmpty")}
          </p>
        )}
      </div>
    </section>
  );
}
