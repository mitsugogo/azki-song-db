export interface YouTubeVideoData {
  video_id?: string;
  title?: string;
  author?: string;
  video_quality?: string;
  allowLiveDvr?: boolean;
  eventId?: string;
  // プレイヤーが返すその他のプロパティを許容
  [key: string]: any;
}
