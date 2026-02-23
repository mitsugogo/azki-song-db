"use client";

import { FaCompactDisc, FaMusic, FaPlay } from "react-icons/fa6";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import MilestoneBadge from "../components/MilestoneBadge";
import { StatisticsItem } from "./createStatistics";

const SongItem = ({
  song,
  isVisible,
  groupByAlbum,
  onClick,
}: {
  song: StatisticsItem;
  isVisible: boolean;
  groupByAlbum?: boolean;
  onClick: (key: string) => void;
}) => {
  return (
    <div
      className={`group relative cursor-pointer shadow-lg transition-all duration-500 overflow-hidden ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      title={
        song.isAlbum && groupByAlbum
          ? `${song.firstVideo.album}${
              song.song.album_is_compilation
                ? ""
                : " / " + song.firstVideo.artist
            } (${new Date(song.firstVideo.album_release_at).toLocaleDateString()})`
          : `${song.firstVideo.title} - ${song.firstVideo.artist} (${new Date(
              song.firstVideo.broadcast_at,
            ).toLocaleDateString()})`
      }
      onClick={() => onClick(song.key)}
      style={{
        userSelect: "none",
      }}
    >
      <div className="group-hover:blur-[2px] transition-all duration-300">
        <YoutubeThumbnail
          videoId={song.firstVideo.video_id}
          alt={song.firstVideo.video_title}
          fill={true}
        />
      </div>
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 opacity-0 group-hover:opacity-80 transition-opacity duration-300 dark:bg-opacity-50">
        <div className="flex items-center justify-center h-full text-white text-center">
          <div className="flex-row text-sm">
            <div>
              <MilestoneBadge song={song.song} />
            </div>
            <div>
              {song.isAlbum && groupByAlbum ? (
                <FaCompactDisc className="inline mr-2" />
              ) : (
                <FaMusic className="inline mr-2" />
              )}
              {song.isAlbum && groupByAlbum
                ? `${song.firstVideo.album}${
                    song.song.album_is_compilation
                      ? ""
                      : " / " + song.firstVideo.artist
                  }`
                : `${song.firstVideo.title} / ${song.firstVideo.artist}`}
              <br />
              {song.isAlbum && groupByAlbum
                ? `${new Date(song.firstVideo.album_release_at).toLocaleDateString()}`
                : `${new Date(song.firstVideo.broadcast_at).toLocaleDateString()}`}
              {song.isAlbum && groupByAlbum ? ` (${song.count}曲)` : ""}

              {song.videos.length == 1 && song.videos[0].view_count && (
                <div className="mt-2 text-xs">
                  <FaPlay className="inline mr-2 -mt-1" />
                  {song.videos[0].view_count.toLocaleString()}回再生
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongItem;
