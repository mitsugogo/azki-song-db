import { Song } from "../types/song";

/**
 * オリジナル楽曲と定義する曲にフィルタリングする関数
 */
export function filterOriginalSongs(song: Song, excludeTag = false) {
  return isOriginalSong(song, excludeTag);
}

export const isPossibleOriginalSong = (s: Song, excludeTag = false) => {
  return isOriginalSong(s, excludeTag);
};

/**
 * fes全体曲かどうか
 */
export const isFesOverallSong = (s: Song) => {
  return s.tags.includes("fes全体曲") && s.sing.includes("AZKi");
};

/**
 * AZKiが参加する全体曲かどうか
 */
export const isOverallSong = (s: Song) => {
  return (
    ((s.tags.includes("全体曲") || s.tags.includes("公式ソング")) &&
      s.sing.includes("AZKi")) ||
    isFesOverallSong(s)
  );
};

/**
 * (純粋な)オリジナル楽曲かどうか
 */
export const isOriginalSong = (s: Song, excludeTag = false) => {
  return (
    (excludeTag ||
      s.tags.includes("オリ曲") ||
      s.tags.includes("オリ曲MV") ||
      s.tags.includes("ライブ予習")) &&
    (s.artist.includes("AZKi") ||
      s.title.includes("feat. AZKi") ||
      s.title.includes("feat.AZKi")) &&
    !s.title.includes("Maaya") &&
    !s.title.includes("Remix") &&
    !s.title.includes("あずいろ") &&
    !s.title.includes("Kiss me") &&
    !s.title.includes("The Last Frontier") &&
    !s.tags.includes("ゲスト参加") &&
    !isOverallSong(s)
  );
};

/**
 * コラボ曲かどうか
 */
export const isCollaborationSong = (s: Song) => {
  return (
    (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
    !isOverallSong(s) &&
    (s.tags.includes("ユニット曲") ||
      s.tags.includes("ゲスト参加") ||
      s.title.includes("feat. AZKi") ||
      s.title.includes("feat.AZKi") ||
      s.title.includes("The Last Frontier"))
  );
};

/**
 * カバー曲かどうか
 */
export const isCoverSong = (s: Song) => {
  return s.tags.includes("カバー曲");
};
