"use client";

import React from "react";
import { Song } from "../types/song";
import YoutubeThumbnail from "./YoutubeThumbnail";
import MilestoneBadge from "./MilestoneBadge";

// SongListItem コンポーネントのプロパティを定義します。
interface SongListItemProps {
  song: Song;
  isSelected: boolean;
  changeCurrentSong: (song: Song, isRandom: boolean) => void;
}

// React.memo を使用して、props が変更されない限りコンポーネントの再レンダリングを防止します。
const SongListItem = React.memo(
  ({ song, isSelected, changeCurrentSong }: SongListItemProps) => {
    return (
      <li
        // 選択状態に応じて Tailwind CSS のクラスを動的に適用します。
        className={`rounded relative cursor-pointer transition shadow-md flex md:block ${
          isSelected
            ? "bg-primary-300 hover:bg-primary-400 dark:bg-primary-900 dark:hover:bg-primary-800 dark:text-gray-300"
            : "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
        }`}
        onClick={() => {
          changeCurrentSong(song, false);
        }}
        data-video-id={song.video_id}
        data-start-time={song.start}
        data-title={song.title}
        key={`${song.video_id}-${song.start}`}
      >
        <div className="flex md:block md:w-full mb-0 md:mb-2 text-center">
          <div className="aspect-video w-26 md:w-full">
            <YoutubeThumbnail
              videoId={song.video_id}
              alt={song.video_title}
              fill={true}
            />
          </div>
        </div>
        <div className="w-full p-0 pl-2 pt-1 md:pl-3 md:p-3 md:pt-0 truncate">
          <div className="w-full text-sm font-semibold line-clamp-1 md:line-clamp-3 truncate">
            {song.title}
          </div>
          <div className="w-full text-xs text-muted-foreground line-clamp-1 md:line-clamp-3 truncate">
            {song.artist} - {song.sing}
          </div>
          <div className="flex gap-x-2 text-xs text-gray-600 dark:text-gray-500">
            {song.broadcast_at && (
              <>{new Date(song.broadcast_at).toLocaleDateString()}</>
            )}
          </div>
          <div className="absolute bottom-0 right-2 md:top-0 md:left-0 text-xs truncate">
            <div>
              <MilestoneBadge song={song} outClassName="mb-1.5" />
            </div>
          </div>
        </div>
      </li>
    );
  }
);

SongListItem.displayName = "SongListItem";

export default SongListItem;
