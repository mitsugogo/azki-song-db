import {
  isCollaborationSong,
  isCoverSong,
  isPossibleOriginalSong,
} from "../config/filters";
import { Song } from "../types/song";

/**
 * 楽曲の詳細ページへのリンクを取得
 */
export const getDiscographyLink = (song: Song) => {
  if (!song?.slugv2) return null;

  if (isPossibleOriginalSong(song)) {
    return `/discography/originals/${encodeURIComponent(song.slugv2)}`;
  }
  if (isCollaborationSong(song)) {
    return `/discography/collaborations/${encodeURIComponent(song.slugv2)}`;
  }
  if (isCoverSong(song)) {
    return `/discography/covers/${encodeURIComponent(song.slugv2)}`;
  }
  return null;
};
