import { Song } from "../types/song";

/**
 * オリジナル楽曲と定義する曲にフィルタリングする関数
 */
export function filterOriginalSongs(song: Song) {
  return isOriginalSong(song) || isFesOverallSong(song);
}

export const isPossibleOriginalSong = (s: Song) => {
  return isOriginalSong(s) || isFesOverallSong(s);
};

/**
 * (純粋な)オリジナル楽曲かどうか
 */
export const isOriginalSong = (s: Song) => {
  return (
    (s.tags.includes("オリ曲") ||
      s.tags.includes("オリ曲MV") ||
      s.tags.includes("ライブ予習")) &&
    s.artist.includes("AZKi") &&
    !s.title.includes("Maaya") &&
    !s.title.includes("Remix") &&
    !s.title.includes("あずいろ") &&
    !s.title.includes("Kiss me") &&
    !s.title.includes("The Last Frontier") &&
    !s.tags.includes("ゲスト参加")
  );
};

/**
 * コラボ曲かどうか
 */
export const isCollaborationSong = (s: Song) => {
  return (
    (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")) &&
    (s.tags.includes("ユニット曲") ||
      s.tags.includes("ゲスト参加") ||
      (s.tags.includes("fes全体曲") && s.sing.includes("AZKi")) ||
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

/**
 * fes全体曲かどうか
 * @param s
 * @returns
 */
export const isFesOverallSong = (s: Song) => {
  return s.tags.includes("fes全体曲") && s.sing.includes("AZKi");
};
