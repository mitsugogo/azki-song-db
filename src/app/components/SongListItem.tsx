"use client";

import React from "react";
import { Song } from "../types/song";
import YoutubeThumbnail from "./YoutubeThumbnail";
import MilestoneBadge from "./MilestoneBadge";
import { Indicator, Badge } from "@mantine/core";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../lib/formatDate";
import { Link } from "@/i18n/navigation";
import { FaStar } from "react-icons/fa6";
import { color } from "motion/react";

interface SongListItemProps {
  song: Song;
  isSelected: boolean;
  isHide: boolean;
  changeCurrentSong: (song: Song) => void;
  isInOverlay?: boolean;
  onSelectSong?: () => void;
}

const SongListItem = React.memo(
  React.forwardRef<HTMLLIElement, SongListItemProps>(
    (
      {
        song,
        isSelected,
        isHide,
        changeCurrentSong,
        isInOverlay = false,
        onSelectSong,
      }: SongListItemProps,
      ref,
    ) => {
      const url = new URL(window.location.href);
      const isOriginalSongsMode =
        url.searchParams.get("q") === "sololive2025" ||
        url.searchParams.get("q") === "original-songs";

      const isNewSong =
        new Date(song.broadcast_at) >
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const t = useTranslations("Watch.nowPlayingSongInfoDetail");
      const locale = useLocale();

      return (
        <li
          ref={ref}
          className={`relative cursor-pointer transition flex lg:block dark:text-gray-50 rounded-xl ${
            isSelected
              ? "bg-primary-300 hover:bg-primary-400 dark:inset-ring dark:inset-ring-primary dark:bg-gray-700 dark:hover:bg-primary-600/40 dark:shadow-md dark:shadow-primary-500/50 transition-colors duration-200 shadow-md"
              : "card-glassmorphism hover-shadow-md"
          }`}
          onClick={() => {
            try {
              // ハンドラ内で重い処理があるとINP悪化の原因になるため
              // 再描画の後に実行するよう次フレームへスケジューリングする。
              // これによりブラウザがインタラクション応答を描画する余地を得る。
              if (
                typeof window !== "undefined" &&
                typeof window.requestAnimationFrame === "function"
              ) {
                window.requestAnimationFrame(() => changeCurrentSong(song));
              } else {
                setTimeout(() => changeCurrentSong(song), 0);
              }
            } catch (_) {
              // フォールバック
              changeCurrentSong(song);
            }
            if (isInOverlay) {
              onSelectSong?.();
            }
          }}
          data-video-id={song.video_id}
          data-start-time={song.start}
          data-title={song.title}
          data-index={`${song.video_id}-${song.start}-${song.title}`}
        >
          <Link
            href={`/watch?v=${song.video_id}${Number(song.start) > 0 ? `&t=${song.start}` : ""}`}
            className="flex lg:block lg:w-full"
            onClick={(e) => {
              // デフォルトのLinkナビゲーションを防ぎ、
              // `changeCurrentSong` 側で履歴を管理する（不要な全体再レンダリングを防止）
              try {
                e.preventDefault();
              } catch (_) {}
            }}
          >
            <div className="flex lg:block lg:w-full mb-0 lg:mb-2 text-center relative">
              <Indicator
                color="cyan"
                size={8}
                disabled={!isNewSong}
                offset={8}
                zIndex={50}
              >
                <div className="aspect-video h-15 min-h-15 max-h-15 lg:w-[calc(100%-2px)] lg:h-auto lg:max-h-full mx-auto mt-[1px]">
                  <YoutubeThumbnail
                    videoId={song.video_id}
                    alt={song.video_title}
                    className="w-[calc(100%-2px)]"
                    imageClassName="rounded-l-sm lg:rounded-t-sm"
                  />
                </div>
              </Indicator>

              <div className="absolute top-0 left-0 z-20 text-xs truncate">
                {song.milestones && song.milestones.length > 0 && (
                  <MilestoneBadge
                    song={song}
                    badgeOptions={{ size: "xs", radius: "xs" }}
                  />
                )}
                {song.is_members_only && (
                  <span className="text-xs lg:hidden">
                    <Badge
                      color="green"
                      size="xs"
                      radius="xs"
                      className="text-[0.5rem]"
                      variant="light"
                      leftSection={<FaStar />}
                    >
                      {t("membersOnlyBadge")}
                    </Badge>
                  </span>
                )}
              </div>
            </div>
            <div className="w-full space-y-0.5 px-3 pt-0.5 lg:pt-0 lg:pb-2 lg:space-y-1">
              <div
                className={`line-clamp-1 lg:line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white break-all`}
              >
                {song.is_members_only && (
                  <div className="text-xs hidden lg:block">
                    <Badge
                      color="green"
                      size="xs"
                      radius="xs"
                      className="text-[0.5rem]"
                      variant="light"
                    >
                      <FaStar className="inline -mt-0.5" />{" "}
                      {t("membersOnlyBadge")}
                    </Badge>
                  </div>
                )}
                <span
                  className={`${
                    isHide
                      ? `h-3.5 bg-light-gray-300 rounded-sm dark:bg-gray-700 block`
                      : ""
                  }`}
                >
                  <span className={`${isHide ? "opacity-0" : ""}`}>
                    {song.title}
                  </span>
                </span>
              </div>
              <div
                className={`line-clamp-1 lg:line-clamp-2 text-xs text-gray-600 dark:text-gray-100`}
              >
                <span
                  className={`${
                    isHide
                      ? `h-1.5 bg-light-gray-300 rounded-sm dark:bg-gray-700 block`
                      : ""
                  }`}
                >
                  <span className={`${isHide ? "opacity-0" : ""}`}>
                    {song.artist}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[0.7rem] uppercase  text-gray-400 dark:text-gray-300">
                <span>
                  {song.broadcast_at && formatDate(song.broadcast_at, locale)}
                </span>
                {song.live_call && (
                  <span className="text-xs">
                    <Badge
                      color="cyan"
                      size="xs"
                      className="text-[0.5rem]"
                      variant="light"
                    >
                      {t("callBadge")}
                    </Badge>
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      );
    },
  ),
);

SongListItem.displayName = "SongListItem";

export default SongListItem;
