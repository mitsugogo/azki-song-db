export const SONG_MODE_IDS = [
  "",
  "original-songs",
  "cover-songs",
  "collaboration-songs",
  "singing-stream",
  "collab-singing-stream",
  "special-live",
  "song-introduction-shorts",
  "ballad",
  "spring-song",
  "summer-song",
  "winter-song",
  "anime-songs",
  "hololive-songs",
  "vocaloid-songs",
] as const;

export type SongMode = (typeof SONG_MODE_IDS)[number];

export const SONG_MODE_METADATA_KEYS = {
  "original-songs": "original",
  "cover-songs": "cover",
  "collaboration-songs": "collab",
  "singing-stream": "karaoke",
  "collab-singing-stream": "collabKaraoke",
  "special-live": "specialLive",
  "song-introduction-shorts": "shorts",
  ballad: "ballad",
  "spring-song": "springSongs",
  "summer-song": "summerSongs",
  "winter-song": "winterSongs",
  "anime-songs": "animeSongs",
  "hololive-songs": "hololiveSongs",
  "vocaloid-songs": "vocaloidSongs",
} as const satisfies Record<Exclude<SongMode, "">, string>;

export type SongModeMetadataKey =
  (typeof SONG_MODE_METADATA_KEYS)[keyof typeof SONG_MODE_METADATA_KEYS];

export const getSongModeMetadataKey = (
  query?: string | null,
): SongModeMetadataKey | undefined => {
  const normalizedQuery = query?.trim().toLowerCase();
  if (normalizedQuery === "sololive2025") {
    return "original";
  }

  return SONG_MODE_METADATA_KEYS[
    normalizedQuery as keyof typeof SONG_MODE_METADATA_KEYS
  ];
};

const SONG_MODE_FILTER_QUERIES: Partial<Record<Exclude<SongMode, "">, string>> =
  {
    "singing-stream": "tag:歌枠",
    "collab-singing-stream": "tag:コラボ|tag:歌枠",
    "special-live": "tag:記念ライブ OR tag:企画ライブ",
    "song-introduction-shorts": "tag:楽曲紹介shorts",
    ballad: "tag:しっとり OR tag:バラード",
    "spring-song": "tag:春ソング",
    "summer-song": "tag:夏ソング",
    "winter-song": "tag:冬ソング",
    "anime-songs": "tag:アニソン",
    "hololive-songs": "tag:ホロライブ楽曲",
    "vocaloid-songs": "tag:VOCALOID",
  };

export const expandSongModeQuery = (query: string) =>
  query
    .split("|")
    .map((clause) => {
      const normalizedClause = clause.trim().toLowerCase() as Exclude<
        SongMode,
        ""
      >;

      return SONG_MODE_FILTER_QUERIES[normalizedClause] ?? clause;
    })
    .join("|");
