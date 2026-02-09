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

export interface YouTubeApiVideoResult {
  id: string;
  title: string | null;
  author: string | null;
  uploadDate: string | null;
  viewCount: number | null;
  isLiveContent: boolean;
  thumbnails: Thumbnail[] | null;
  likeCount?: number | null;
  tags: string[];
  description: string | null;
  duration: number | null;
  chapters: Chapter[];
  music?: MusicInfo | null;
  lastFetchedAt: string;

  // その他の未知のプロパティを許容
  [key: string]: any;
}
