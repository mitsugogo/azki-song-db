export interface Song {
  slug?: string;
  slugv2?: string;
  source_order?: number;
  title: string;
  artist: string;
  album: string;
  lyricist: string;
  composer: string;
  arranger: string;
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
  year: number;
  tags: string[];
  milestones: string[];
  extra?: string;
  live_call?: string;
  live_note?: string;
  view_count?: number;
}
