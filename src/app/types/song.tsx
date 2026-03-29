export interface Song {
  slug?: string;
  slugv2?: string;
  source_order?: number;
  title: string;
  title_en?: string;
  artist: string;
  artist_en?: string;
  artists?: string[];
  artists_en?: string[];
  hl: {
    ja: {
      title: string;
      artist: string;
      album?: string;
      sing?: string;
      sings?: string[];
    };
    en?: {
      title?: string;
      artist?: string;
      album?: string;
      sing?: string;
      sings?: string[];
    };
  };
  album: string;
  lyricist: string;
  composer: string;
  arranger: string;
  album_list_uri: string;
  album_release_at: string;
  album_is_compilation: boolean;
  sing: string;
  sings: string[];
  video_title: string;
  video_uri: string;
  video_id: string;
  start: number;
  end: number;
  broadcast_at: string;
  year: number;
  tags: string[];
  milestones: string[];
  extra?: string;
  live_call?: string;
  live_note?: string;
  view_count?: number;
}
