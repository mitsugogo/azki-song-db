export interface Song {
  slug?: string;
  slugv2?: string;
  source_order?: number;
  title: string;
  title_en?: string;
  title_aliases?: string[];
  artist: string;
  artist_en?: string;
  artist_aliases?: string[];
  artists?: string[];
  artists_en?: string[];
  sing_aliases?: string[];
  hl: {
    ja: {
      title: string;
      artist: string;
      artists: string[];
      album?: string;
      sing?: string;
      sings?: string[];
    };
    en?: {
      title?: string;
      artist?: string;
      artists?: string[];
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
  album_id?: string;
  album_release_at: string;
  album_is_compilation: boolean;
  sing: string;
  sings: string[];
  video_title: string;
  video_uri: string;
  video_id: string;
  is_members_only?: boolean;
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
