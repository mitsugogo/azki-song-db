"use client";

import { useMemo, useState, type MouseEvent, type Ref } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Menu,
  Skeleton,
  Text,
  Timeline,
  Tooltip,
  UnstyledButton,
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
import { MdFilterAlt } from "react-icons/md";
import YoutubeThumbnail from "./YoutubeThumbnail";
import {
  getActivityImportanceItemClassName,
  getActivityImportanceTitleClassName,
} from "../lib/activityImportance";
import { formatDate } from "../lib/formatDate";
import {
  filterActivityTimelineItemsForDisplay,
  type ActivityTimelineDisplayFilters,
} from "../lib/activityTimelineFilters";
import {
  buildActivityChannelIndexes,
  buildActivityItemPresentation,
} from "../lib/activityItemPresentation";
import type { ActivityTimelineItem } from "../hook/useActivityTimeline";
import type { ChannelEntry } from "../types/api/yt/channels";

export { getActivityItemLabel } from "../lib/activityItemPresentation";

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
  showFilter?: boolean;
  onItemSelect?: (item: ActivityTimelineItem) => void;
  getItemSelectAriaLabel?: (item: ActivityTimelineItem) => string;
};

export const DEFAULT_ACTIVITY_TIMELINE_DISPLAY_FILTERS: ActivityTimelineDisplayFilters =
  {
    includeShorts: false,
    includeArchives: true,
    includeSongUpdates: true,
    includeViewMilestones: true,
  };

const activityTimelineColors: Record<ActivityTimelineItem["kind"], string> = {
  song_update: "pink",
  archive: "cyan",
  view_milestone: "yellow",
  milestone: "violet",
  event: "blue",
};

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
      description: "font-medium text-gray-700 dark:text-gray-100",
    };
  }

  if (kind === "song_update") {
    return {
      item: "rounded-lg border border-primary/20 bg-primary/5 p-3 shadow-[0_8px_24px_rgba(190,24,93,0.1)] dark:border-pink-300/20 dark:bg-pink-300/10",
      title:
        "min-w-0 text-sm font-semibold leading-6 text-gray-900 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "w-28 sm:w-32",
      description: "font-medium text-gray-600 dark:text-gray-100",
    };
  }

  if (kind === "milestone" || kind === "event") {
    return {
      item: "py-1",
      title:
        "min-w-0 text-sm font-semibold leading-6 text-gray-800 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "",
      description: "text-xs text-gray-600 dark:text-gray-200",
    };
  }

  return {
    item: "py-1",
    title:
      "min-w-0 text-xs font-medium leading-5 text-gray-700 transition hover:text-primary dark:text-gray-200 dark:hover:text-pink-200",
    thumbnail: "w-16 opacity-80 sm:w-20",
    description: "text-xs text-gray-500 dark:text-gray-200",
  };
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

type ActivityTimelineFilterMenuProps = {
  filters: ActivityTimelineDisplayFilters;
  onChange: (filters: ActivityTimelineDisplayFilters) => void;
};

export function ActivityTimelineFilterMenu({
  filters,
  onChange,
}: ActivityTimelineFilterMenuProps) {
  const t = useTranslations("Home");

  return (
    <Menu withinPortal={false} position="bottom-end" withArrow shadow="md">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={t("activityFilterLabel")}
          title={t("activityFilterLabel")}
        >
          <MdFilterAlt size={20} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("activityFilterTitle")}</Menu.Label>
        <div className="space-y-2 px-2 pb-1">
          <Checkbox
            size="sm"
            checked={filters.includeShorts}
            label={t("activityFilterShorts")}
            onChange={(event) =>
              onChange({
                ...filters,
                includeShorts: event.currentTarget.checked,
              })
            }
          />
          <Checkbox
            size="sm"
            checked={filters.includeArchives}
            label={t("activityFilterArchives")}
            onChange={(event) =>
              onChange({
                ...filters,
                includeArchives: event.currentTarget.checked,
              })
            }
          />
          <Checkbox
            size="sm"
            checked={filters.includeSongUpdates}
            label={t("activityFilterSongUpdates")}
            onChange={(event) =>
              onChange({
                ...filters,
                includeSongUpdates: event.currentTarget.checked,
              })
            }
          />
          <Checkbox
            size="sm"
            checked={filters.includeViewMilestones}
            label={t("activityFilterViewMilestones")}
            onChange={(event) =>
              onChange({
                ...filters,
                includeViewMilestones: event.currentTarget.checked,
              })
            }
          />
        </div>
      </Menu.Dropdown>
    </Menu>
  );
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
  showFilter = true,
  onItemSelect,
  getItemSelectAriaLabel,
}: ActivityTimelineSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const tDrawer = useTranslations("DrawerMenu");
  const channelIndexes = useMemo(
    () => buildActivityChannelIndexes(channels),
    [channels],
  );
  const [filters, setFilters] = useState<ActivityTimelineDisplayFilters>(
    DEFAULT_ACTIVITY_TIMELINE_DISPLAY_FILTERS,
  );
  const filteredItems = useMemo(
    () =>
      showFilter
        ? filterActivityTimelineItemsForDisplay(items, filters)
        : items,
    [filters, items, showFilter],
  );

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
          <div className="flex items-center gap-2">
            {showFilter ? (
              <ActivityTimelineFilterMenu
                filters={filters}
                onChange={setFilters}
              />
            ) : null}
            {showArchivesLink ? (
              <Link
                href="/activity"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
              >
                {tDrawer("activity")}
                <LuArrowRight className="shrink-0" />
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {!showTitle && showFilter ? (
        <div className="mb-3 flex justify-end">
          <ActivityTimelineFilterMenu filters={filters} onChange={setFilters} />
        </div>
      ) : null}

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
        ) : filteredItems.length > 0 ? (
          <>
            <Timeline
              active={filteredItems.length - 1}
              bulletSize={30}
              color="azki"
              lineWidth={2}
            >
              {filteredItems.map((item) => {
                const presentation = buildActivityItemPresentation(
                  item,
                  t,
                  locale,
                  channelIndexes,
                );
                const itemLabel = {
                  badge: presentation.badge,
                  title: presentation.timelineTitle,
                  description: presentation.timelineDescription,
                };
                const color = activityTimelineColors[item.kind];
                const itemClasses = getActivityItemClasses(item.kind);
                const importanceItemClassName =
                  getActivityImportanceItemClassName(item.importance);
                const baseImportanceTitleClassName =
                  getActivityImportanceTitleClassName(item.importance);
                const titleHref = presentation.titleHref;
                const thumbnailHref = presentation.youtubeHref ?? item.href;
                const descriptionHref = presentation.timelineDescriptionHref;
                const placeHref = presentation.placeHref;
                const placeLabel = presentation.placeLabel;
                const titleIsExternal = isExternalHref(titleHref);
                const thumbnailIsExternal = isExternalHref(thumbnailHref);
                const descriptionIsExternal = isExternalHref(descriptionHref);
                const placeIsExternal = isExternalHref(placeHref);
                const activitySingerAvatars = presentation.singers;
                const archiveChannel = presentation.archiveChannel;
                const archiveChannelName = archiveChannel?.name || "";
                const archiveChannelUrl = archiveChannel?.channelUrl ?? null;
                const hasArchiveChannel = Boolean(archiveChannelName);
                const hasActivityDetails = Boolean(
                  (item.videoId && thumbnailHref) ||
                  itemLabel.description ||
                  placeLabel ||
                  activitySingerAvatars.length > 0 ||
                  hasArchiveChannel,
                );
                const isVideoActivity = Boolean(item.videoId && thumbnailHref);
                const importanceTitleClassName = [
                  baseImportanceTitleClassName,
                  !isVideoActivity && item.importance === "extra_high"
                    ? "text-base leading-7 sm:text-lg"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const archiveLinkProps =
                  item.kind === "archive" && titleHref === item.href
                    ? {
                        onClick: (event: MouseEvent<HTMLAnchorElement>) =>
                          handleArchiveActivityLinkClick(event, item.href),
                      }
                    : {};
                const itemSelectAriaLabel = getItemSelectAriaLabel?.(item);
                const handleItemSelect = () => onItemSelect?.(item);
                const descriptionPlatformIcon = descriptionHref ? (
                  descriptionHref.includes("youtube.com") ||
                  descriptionHref.includes("youtu.be") ? (
                    <FaYoutube className="-mt-0.5 mr-1 w-3 h-3 inline text-[0.65rem] text-red-600 dark:text-red-500" />
                  ) : descriptionHref.includes("twitter.com") ||
                    descriptionHref.includes("x.com") ? (
                    <FaXTwitter className="-mt-0.5 mr-1 w-3 h-3 inline text-[0.65rem] text-sky-600 dark:text-sky-500" />
                  ) : null
                ) : null;
                const archiveChannelIcon = archiveChannel?.iconUrl ? (
                  <Avatar
                    src={archiveChannel.iconUrl}
                    alt={archiveChannelName}
                    radius="xl"
                    size="xs"
                    className="shrink-0"
                  />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    <FaYoutube className="h-3 w-3" />
                  </span>
                );

                return (
                  <Timeline.Item
                    key={item.id}
                    data-importance={item.importance}
                    bullet={getActivityItemBullet(item.kind)}
                    title={
                      onItemSelect ? (
                        <UnstyledButton
                          type="button"
                          className="flex flex-wrap items-center gap-2 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          data-importance={item.importance}
                          aria-label={itemSelectAriaLabel}
                          onClick={handleItemSelect}
                        >
                          <Badge
                            size="xs"
                            radius="sm"
                            color={color}
                            variant="light"
                            className="shrink-0"
                          >
                            {itemLabel.badge}
                          </Badge>
                          <span
                            className={`${itemClasses.title} ${importanceTitleClassName}`}
                          >
                            {itemLabel.title}
                          </span>
                        </UnstyledButton>
                      ) : (
                        <div
                          className="flex flex-wrap items-center gap-2"
                          data-importance={item.importance}
                        >
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
                              className={`${itemClasses.title} ${importanceTitleClassName}`}
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
                            <span
                              className={`${itemClasses.title} ${importanceTitleClassName}`}
                            >
                              {itemLabel.title}
                            </span>
                          )}
                        </div>
                      )
                    }
                  >
                    {hasActivityDetails ? (
                      <div
                        className={`mt-2 ${itemClasses.item} ${isVideoActivity ? importanceItemClassName : ""}`}
                        data-importance={item.importance}
                      >
                        <div className="flex items-start gap-3">
                          {item.videoId && thumbnailHref ? (
                            onItemSelect ? (
                              <UnstyledButton
                                type="button"
                                className={`relative aspect-video shrink-0 overflow-hidden rounded-md bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${itemClasses.thumbnail}`}
                                aria-label={itemSelectAriaLabel}
                                onClick={handleItemSelect}
                              >
                                <YoutubeThumbnail
                                  videoId={item.videoId}
                                  alt={itemLabel.title}
                                  imageClassName="object-cover transition duration-300"
                                />
                              </UnstyledButton>
                            ) : (
                              <Link
                                href={thumbnailHref}
                                className={`relative aspect-video shrink-0 overflow-hidden rounded-md bg-black ${itemClasses.thumbnail}`}
                                aria-label={itemLabel.title}
                                target={
                                  thumbnailIsExternal ? "_blank" : undefined
                                }
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
                            )
                          ) : null}
                          <div className="min-w-0 flex-1">
                            {itemLabel.description ? (
                              <Text
                                size="sm"
                                className={itemClasses.description}
                              >
                                {onItemSelect ? (
                                  <UnstyledButton
                                    type="button"
                                    className="block rounded-sm text-left transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:text-pink-200"
                                    aria-label={itemSelectAriaLabel}
                                    onClick={handleItemSelect}
                                  >
                                    {descriptionPlatformIcon}
                                    {itemLabel.description}
                                  </UnstyledButton>
                                ) : descriptionHref ? (
                                  <Link
                                    href={descriptionHref}
                                    target={
                                      descriptionIsExternal
                                        ? "_blank"
                                        : undefined
                                    }
                                    rel={
                                      descriptionIsExternal
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                    className="transition hover:text-primary dark:hover:text-pink-200"
                                  >
                                    {descriptionPlatformIcon}
                                    {itemLabel.description}
                                  </Link>
                                ) : (
                                  itemLabel.description
                                )}
                              </Text>
                            ) : null}
                            {hasArchiveChannel ? (
                              onItemSelect ? (
                                <UnstyledButton
                                  type="button"
                                  className="mt-1.5 flex min-w-0 items-center gap-1.5 rounded-sm text-left text-xs text-gray-200/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-400"
                                  aria-label={itemSelectAriaLabel}
                                  onClick={handleItemSelect}
                                >
                                  {archiveChannelIcon}
                                  <span className="min-w-0 truncate">
                                    {archiveChannelName}
                                  </span>
                                </UnstyledButton>
                              ) : (
                                <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-gray-200/70 dark:text-gray-400">
                                  {archiveChannelIcon}
                                  {archiveChannelUrl ? (
                                    <Link
                                      href={archiveChannelUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="min-w-0 truncate hover:text-primary hover:underline dark:hover:text-primary-300"
                                    >
                                      {archiveChannelName}
                                    </Link>
                                  ) : (
                                    <span className="min-w-0 truncate">
                                      {archiveChannelName}
                                    </span>
                                  )}
                                </div>
                              )
                            ) : null}
                            {placeLabel ? (
                              onItemSelect ? (
                                <UnstyledButton
                                  type="button"
                                  className="mt-1 block rounded-sm text-left text-xs text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-400"
                                  aria-label={itemSelectAriaLabel}
                                  onClick={handleItemSelect}
                                >
                                  <BsGeoAlt className="-mt-0.5 mr-1 inline" />
                                  {placeLabel}
                                </UnstyledButton>
                              ) : (
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
                              )
                            ) : null}
                            {activitySingerAvatars.length > 0 ? (
                              <Avatar.Group
                                className="mt-2 flex-wrap gap-y-1"
                                spacing="xxs"
                              >
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
                                      {onItemSelect ? (
                                        <UnstyledButton
                                          type="button"
                                          aria-label={itemSelectAriaLabel}
                                          onClick={handleItemSelect}
                                        >
                                          {image}
                                        </UnstyledButton>
                                      ) : avatar.channelUrl ? (
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
                    ) : null}
                    {onItemSelect ? (
                      <UnstyledButton
                        type="button"
                        className="mt-1 block rounded-sm text-left text-xs text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-400"
                        aria-label={itemSelectAriaLabel}
                        onClick={handleItemSelect}
                      >
                        {formatDate(item.occurredAt, locale)}
                      </UnstyledButton>
                    ) : (
                      <Text size="xs" c="dimmed" className="mt-1">
                        {formatDate(item.occurredAt, locale)}
                      </Text>
                    )}
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
