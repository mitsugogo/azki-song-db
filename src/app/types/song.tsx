export interface Song {
  title: string;
  artist: string;
  sing: string;
  video_title: string;
  video_uri: string;
  video_id: string;
  start: string;
  end: string;
  broadcast_at: string;
  tags: string[];
  extra?: string;
  milestones?: string[];
}
