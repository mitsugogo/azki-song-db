export interface VideoInfo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}
