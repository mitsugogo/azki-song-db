"use client";

import { Avatar, Skeleton, Text, Tooltip } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { Link } from "../../i18n/navigation";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import { buildWatchHref } from "../lib/watchUrl";
import { formatDate } from "../lib/formatDate";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { Song } from "../types/song";
import { buildSingerAvatarsByVideoId, groupRecentUpdates } from "./homeData";

type RecentUpdatesSectionProps = {
  channels: ChannelEntry[];
  isLoading: boolean;
  songs: Song[];
};

export const RecentUpdatesSection = memo(function RecentUpdatesSection({
  channels,
  isLoading,
  songs,
}: RecentUpdatesSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const recentUpdates = useMemo(() => groupRecentUpdates(songs), [songs]);
  const singerAvatarsByVideoId = useMemo(
    () => buildSingerAvatarsByVideoId(recentUpdates, channels),
    [channels, recentUpdates],
  );

  return (
    <div className="mt-16 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          {t("recentUpdatesLabel")}
        </p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {t("recentUpdatesTitle")}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`update-skeleton-${index}`} height={60} />
          ))}
        </div>
      ) : recentUpdates.length > 0 ? (
        <div className="space-y-4">
          {recentUpdates.map((update) => {
            const singerAvatars =
              singerAvatarsByVideoId.get(update.videoId) ?? [];
            const watchHref = buildWatchHref({ videoId: update.videoId });

            return (
              <div
                key={update.videoId}
                className="rounded-lg border border-pink-200 bg-white p-4 hover-lift-animation transition hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] dark:hover:border-pink-300/30"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDate(update.date, locale)}{" "}
                  <Text
                    size="xs"
                    c="dimmed"
                    className="pl-2 text-gray-100"
                    component="span"
                  >
                    {t("recentUpdatesAddedCount", { count: update.count })}
                  </Text>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Link
                    href={watchHref}
                    className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-black"
                  >
                    <YoutubeThumbnail
                      videoId={update.videoId}
                      alt={update.videoTitle}
                      imageClassName="object-cover"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link href={watchHref} className="block">
                      <Text size="sm" className="line-clamp-2" component="div">
                        {update.videoTitle}
                      </Text>
                    </Link>
                    {singerAvatars.length > 0 ? (
                      <Avatar.Group className="ml-2 mt-1" spacing="xxs">
                        {singerAvatars.map((avatar) => {
                          const image = (
                            <Avatar
                              key={`${update.videoId}-${avatar.name}`}
                              src={avatar.iconUrl}
                              alt={avatar.name}
                              radius="xl"
                              size="md"
                              className="border-2 border-white dark:border-gray-900"
                            />
                          );

                          return (
                            <Tooltip
                              key={`${update.videoId}-${avatar.name}`}
                              label={avatar.name}
                              withArrow
                              arrowSize={8}
                            >
                              {avatar.channelUrl ? (
                                <Link
                                  href={avatar.channelUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(event) => event.stopPropagation()}
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
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("noRecentUpdates")}
        </p>
      )}
    </div>
  );
});
