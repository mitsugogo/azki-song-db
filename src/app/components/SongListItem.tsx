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
        className={`rounded relative cursor-pointer transition shadow-md ${
          isSelected
            ? "bg-primary-300 hover:bg-primary-400 dark:bg-primary-900 dark:hover:bg-primary-800 dark:text-gray-300"
            : "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
        }`}
        onClick={() => changeCurrentSong(song, false)}
        data-video-id={song.video_id}
        data-start-time={song.start}
        data-title={song.title}
      >
        <div className="block w-full mb-2 text-center">
          <div className="aspect-video">
            <YoutubeThumbnail
              videoId={song.video_id}
              alt={song.video_title}
              fill={true}
            />
          </div>
        </div>
        <div className="w-full p-3 pt-0">
          <div className="w-full text-sm font-semibold line-clamp-3">
            {song.title}
          </div>
          <div className="w-full text-xs text-muted-foreground line-clamp-3">
            {song.artist} - {song.sing}
          </div>
          <div className="flex gap-x-2 text-xs text-gray-600 dark:text-gray-500">
            {song.broadcast_at && (
              <>{new Date(song.broadcast_at).toLocaleDateString()}</>
            )}
          </div>
          <div className="flex w-full gap-x-2 mt-1 text-xs truncate">
            <div>
              <MilestoneBadge song={song} outClassName="mb-1.5" />
            </div>
          </div>
        </div>
      </li>
    );
  }
);

export default SongListItem;
