"use client";

import { FaCompactDisc, FaMusic, FaPlay } from "react-icons/fa6";
import { useRouter } from "@/i18n/navigation";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import MilestoneBadge from "../components/MilestoneBadge";
import { StatisticsItem } from "./createStatistics";
import slugify from "../lib/slugify";
import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "../config/filters";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../lib/formatDate";
import { normalizeSongTitle } from "./utils/normalizeSongTitle";

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
  const router = useRouter();
  const t = useTranslations("Discography");
  const locale = useLocale();
  const albumSlug = song.firstVideo.album ? slugify(song.firstVideo.album) : "";
  const displayTitle = normalizeSongTitle(
    song.firstVideo.title,
    song.firstVideo.artist,
  );

  const getSongPath = (target?: typeof song.firstVideo) => {
    const video = target ?? song.firstVideo;
    const slug = video.slugv2 || video.slug || slugify(video.title);
    if (!slug) return null;

    const category = isPossibleOriginalSong(video)
      ? "originals"
      : isCollaborationSong(video)
        ? "collab"
        : isCoverSong(video)
          ? "covers"
          : null;

    if (!category) return null;
    return `/discography/${category}/${encodeURIComponent(slug)}`;
  };

  const handleClick = () => {
    if (song.isAlbum && groupByAlbum && albumSlug) {
      router.push(`/discography/album/${encodeURIComponent(albumSlug)}`);
      return;
    }

    if (!song.isAlbum) {
      if (song.videos.length > 1) {
        onClick(song.key);
        return;
      }
      const songPath = getSongPath();
      if (songPath) {
        router.push(songPath);
        return;
      }
    }

    onClick(song.key);
  };

  return (
    <div
      className={`group relative cursor-pointer rounded-sm border border-white/60 bg-white/85 dark:border-white/10 dark:bg-gray-900/50 shadow-lg transition-all duration-500 overflow-hidden hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:hover:border-pink-300/30 dark:hover:shadow-[0_18px_52px_rgba(0,0,0,0.35)] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      title={
        song.isAlbum && groupByAlbum
          ? `${song.firstVideo.album}${
              song.song.album_is_compilation
                ? ""
                : " / " + song.firstVideo.artist
            } (${formatDate(song.firstVideo.album_release_at, locale)})`
          : `${displayTitle} - ${song.firstVideo.artist} (${formatDate(
              song.firstVideo.broadcast_at,
              locale,
            )})`
      }
      onClick={handleClick}
      style={{
        userSelect: "none",
      }}
    >
      <div className="group-hover:blur-[2px] transition-all duration-300">
        <YoutubeThumbnail
          videoId={song.firstVideo.video_id}
          alt={song.firstVideo.video_title}
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
                : `${displayTitle} / ${song.firstVideo.artist}`}
              <br />
              {song.isAlbum && groupByAlbum
                ? `${formatDate(song.firstVideo.album_release_at, locale)}`
                : `${formatDate(song.firstVideo.broadcast_at, locale)}`}
              {song.isAlbum && groupByAlbum
                ? ` (${song.count}${t("songsSuffix")})`
                : ""}
              {song.videos.length === 1 &&
                (song?.videos[0]?.view_count ?? 0) > 0 && (
                  <div className="mt-2 text-xs">
                    <FaPlay className="inline mr-2 -mt-1" />
                    {song?.videos[0]?.view_count?.toLocaleString() ?? 0}
                    {t("viewsSuffix")}
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
