import { youtube_v3 } from "googleapis/build/src/apis/youtube/v3";

// 詳細な API 用型定義 — /api/yt/video が返す構造に対応
export interface Thumbnail {
  url: string | null;
  width: number | null;
  height: number | null;
}

export interface MusicInfo {
  imageUrl?: string | null;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
}

export interface Chapter {
  title?: string | null;
  startTime?: number | null;
  endTime?: number | null;
}

export interface YouTubeApiVideoResult extends youtube_v3.Schema$Video {
  lastFetchedAt: string;
}
