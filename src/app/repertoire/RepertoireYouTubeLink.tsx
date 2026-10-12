"use client";

import { Button, HoverCard } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { FaYoutube } from "react-icons/fa6";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { formatDate } from "@/app/lib/formatDate";
import type { Song } from "@/app/types/song";

export default function RepertoireYouTubeLink({
  song,
  href,
  previewEnabled,
}: {
  song: Song;
  href: string;
  previewEnabled: boolean;
}) {
  const t = useTranslations("Repertoire");
  const locale = useLocale();
  const button = (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      size="compact-xs"
      variant="light"
      leftSection={<FaYoutube aria-hidden="true" />}
      aria-label={t("youtubeLabel", { title: song.title })}
    >
      {t("youtube")}
    </Button>
  );
  if (!previewEnabled) return button;

  return (
    <HoverCard
      width={320}
      shadow="md"
      withArrow
      openDelay={200}
      closeDelay={100}
      position="top"
      withinPortal
    >
      <HoverCard.Target>{button}</HoverCard.Target>
      <HoverCard.Dropdown
        role="tooltip"
        aria-label={t("videoPreview")}
        className="overflow-hidden"
        style={{ backgroundColor: "var(--mantine-color-body)" }}
      >
        <div className="aspect-video overflow-hidden rounded-md">
          <YoutubeThumbnail
            videoId={song.video_id}
            alt={song.video_title || song.title}
          />
        </div>
        <h3 className="mt-2 break-words text-sm font-semibold leading-5 text-gray-900 dark:text-gray-100">
          {song.video_title || song.title}
        </h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          {t("broadcastDate")}:{" "}
          {Number.isFinite(Date.parse(song.broadcast_at)) ? (
            <time dateTime={song.broadcast_at}>
              {formatDate(song.broadcast_at, locale, {
                timeZone: "Asia/Tokyo",
              })}
            </time>
          ) : (
            t("unknownDate")
          )}
        </p>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
