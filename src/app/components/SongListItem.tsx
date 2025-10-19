"use client";

import React from "react";
import { Song } from "../types/song";
import YoutubeThumbnail from "./YoutubeThumbnail";
import MilestoneBadge from "./MilestoneBadge";
import { Badge } from "flowbite-react";
import { Indicator } from "@mantine/core";

interface SongListItemProps {
  song: Song;
  isSelected: boolean;
  isHide: boolean;
  changeCurrentSong: (song: Song, isRandom: boolean) => void;
}

const SongListItem = React.memo(
  React.forwardRef<HTMLLIElement, SongListItemProps>(
    (
      { song, isSelected, isHide, changeCurrentSong }: SongListItemProps,
      ref
    ) => {
      const url = new URL(window.location.href);
      const isSololive2025 = url.searchParams.get("q") === "sololive2025";

      const isNewSong =
        new Date(song.broadcast_at) >
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      return (
        <li
          ref={ref}
          className={`rounded relative cursor-pointer transition shadow-md flex lg:block dark:text-gray-50 ${
            isSelected
              ? "bg-primary-300 hover:bg-primary-400 dark:inset-ring dark:inset-ring-primary dark:bg-gray-700 dark:hover:bg-primary-600/40 dark:shadow-md dark:shadow-primary-500/50 transition-colors duration-200"
              : "bg-gray-50/50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          onClick={() => {
            changeCurrentSong(song, false);
          }}
          data-video-id={song.video_id}
          data-start-time={song.start}
          data-title={song.title}
          data-index={`${song.video_id}-${song.start}-${song.title}`}
        >
          <div className="flex lg:block lg:w-full mb-0 lg:mb-2 text-center ">
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
          </div>
          <div className="w-full p-0 pl-2 pt-1 lg:pl-3 lg:p-3 lg:pt-0">
            <div
              className={`w-full text-sm font-semibold line-clamp-1 ${
                isHide ? "truncate" : "lg:line-clamp-3"
              }`}
            >
              <span
                className={`${
                  isHide
                    ? `h-4 bg-light-gray-300 rounded-lg dark:bg-gray-700 mb-1`
                    : ""
                }`}
              >
                <span className={`${isHide ? "opacity-0" : ""}`}>
                  {song.title}
                </span>
              </span>
            </div>
            <div
              className={`w-full text-xs text-gray-600 dark:text-gray-200 line-clamp-1 ${
                isHide ? "mt-1 truncate" : "lg:line-clamp-3"
              }`}
            >
              <span
                className={`${
                  isHide
                    ? `h-2 bg-light-gray-300 rounded-lg dark:bg-gray-700 mb-1`
                    : ""
                }`}
              >
                <span className={`${isHide ? "opacity-0" : ""}`}>
                  {song.artist} - {song.sing}
                </span>
              </span>
            </div>
            <div className="flex gap-x-2 text-xs text-gray-600 dark:text-gray-200">
              {song.broadcast_at && (
                <>{new Date(song.broadcast_at).toLocaleDateString()}</>
              )}
              {song.live_call && (
                <span className="text-xs lg:hidden">
                  <Badge className="inline text-[0.5rem] bg-cyan-500 dark:bg-cyan-700 text-white dark:text-white">
                    コール
                  </Badge>
                </span>
              )}
            </div>
            {song.live_call && isSololive2025 && (
              <div className="hidden lg:flex gap-x-2 text-xs text-gray-600 dark:text-gray-200 mt-2">
                <span className="text-xs">
                  <Badge className="inline text-xs bg-cyan-500 dark:bg-cyan-700 text-white dark:text-white">
                    コーレス
                  </Badge>
                </span>
              </div>
            )}
            {song.milestones && song.milestones.length > 0 && (
              <div className="absolute bottom-0 right-2 lg:top-0 lg:left-0 text-xs truncate">
                <div>
                  <MilestoneBadge song={song} outClassName="mb-1.5" />
                </div>
              </div>
            )}
          </div>
        </li>
      );
    }
  )
);

SongListItem.displayName = "SongListItem";

export default SongListItem;
