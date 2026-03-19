"use client";

import React from "react";
import { Song } from "../types/song";
import YoutubeThumbnail from "./YoutubeThumbnail";
import MilestoneBadge from "./MilestoneBadge";
import { Badge } from "flowbite-react";
import { Indicator } from "@mantine/core";
import Link from "next/link";

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

      return (
        <li
          ref={ref}
          className={`relative cursor-pointer transition flex lg:block dark:text-gray-50 rounded-xl ${
            isSelected
              ? "bg-primary-300 hover:bg-primary-400 dark:inset-ring dark:inset-ring-primary dark:bg-gray-700 dark:hover:bg-primary-600/40 dark:shadow-md dark:shadow-primary-500/50 transition-colors duration-200 shadow-md"
              : "card-glassmorphism hover-lift-shadow"
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
                    fill={true}
                    className="w-[calc(100%-2px)]"
                    imageClassName="rounded-l-sm lg:rounded-t-sm"
                  />
                </div>
              </Indicator>
              {song.milestones && song.milestones.length > 0 && (
                <div className="absolute top-0 left-0 z-20 text-xs truncate">
                  <div>
                    <MilestoneBadge song={song} outClassName="mb-1.5" />
                  </div>
                </div>
              )}
            </div>
            <div className="w-full space-y-0.5 px-3 pb-3 lg:pb-2 lg:space-y-1">
              <div
                className={`line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white`}
              >
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
                className={`line-clamp-1 text-xs text-gray-600 dark:text-gray-100`}
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
                  {song.broadcast_at &&
                    new Date(song.broadcast_at).toLocaleDateString()}
                </span>
                {song.live_call && (
                  <span className="text-xs">
                    <Badge className="inline text-[0.5rem] bg-cyan-500 dark:bg-cyan-700 text-white dark:text-white">
                      コール
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
