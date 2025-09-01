export interface Song {
  title: string;
  artist: string;
  album: string;
  album_list_uri: string;
  album_release_at: string;
  album_is_compilation: boolean;
  sing: string;
  video_title: string;
  video_uri: string;
  video_id: string;
  start: string;
  end: string;
  broadcast_at: string;
  tags: string[];
  milestones: string[];
  extra?: string;
}
