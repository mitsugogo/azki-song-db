import type { Song } from "@/app/types/song";

export type RepertoireSource = "singing" | "collaboration" | "other";

export type RepertoireEntry = {
  key: string;
  title: string;
  artist: string;
  sources: RepertoireSource[];
  tags: string[];
  count: number;
  latest: Song;
  searchText: string;
};

const normalize = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");

export function getRepertoireSources(song: Song): RepertoireSource[] {
  const tags = song.tags ?? [];
  const singing = tags.includes("歌枠");
  const collaboration =
    tags.some((tag) => /コラボ|ゲスト/.test(tag)) ||
    tags.some((tag) =>
      /^(?:ライブ|3Dライブ|記念ライブ|全体ライブ|公式ライブ|現地ライブ|アコースティックライブ|企画ライブ|カウントダウンライブ|fes|\d+th fes|fes全体曲)$/.test(
        tag,
      ),
    ) ||
    new Set(song.hl?.ja?.sings ?? song.sings ?? []).size > 1;
  const sources: RepertoireSource[] = [];
  if (singing) sources.push("singing");
  if (collaboration) sources.push("collaboration");
  if (sources.length === 0) sources.push("other");
  return sources;
}

const sungByAzki = (song: Song) => {
  const singers = song.hl?.ja?.sings ?? song.sings ?? [];
  return singers.some((singer) => normalize(singer) === "azki");
};

const dateValue = (song: Song) => {
  const value = Date.parse(song.broadcast_at);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
};

export function buildRepertoire(songs: Song[]): RepertoireEntry[] {
  const groups = new Map<
    string,
    {
      entry: RepertoireEntry;
      tags: Set<string>;
      sources: Set<RepertoireSource>;
      performances: Set<string>;
      search: Set<string>;
    }
  >();
  for (const song of songs) {
    if (!sungByAzki(song) || song.is_members_only || !song.title.trim())
      continue;
    // Use the original names so grouping stays the same in Japanese and English.
    const key = JSON.stringify([
      normalize(song.hl?.ja?.title || song.title),
      normalize(song.hl?.ja?.artist || song.artist),
    ]);
    let group = groups.get(key);
    if (!group) {
      group = {
        entry: {
          key,
          title: song.title,
          artist: song.artist,
          sources: [],
          tags: [],
          count: 0,
          latest: song,
          searchText: "",
        },
        tags: new Set(),
        sources: new Set(),
        performances: new Set(),
        search: new Set(),
      };
      groups.set(key, group);
    }
    for (const tag of [...(song.tags ?? []), ...(song.song_tags ?? [])]) {
      if (tag.trim()) group.tags.add(tag);
    }
    for (const source of getRepertoireSources(song)) group.sources.add(source);
    group.performances.add(
      JSON.stringify([song.video_id || song.video_uri, song.start]),
    );
    for (const text of [
      song.title,
      song.artist,
      song.hl?.ja?.title,
      song.hl?.ja?.artist,
      song.hl?.en?.title,
      song.hl?.en?.artist,
      ...(song.title_aliases ?? []),
      ...(song.artist_aliases ?? []),
    ]) {
      if (text) group.search.add(normalize(text));
    }
    const latest = group.entry.latest;
    if (
      dateValue(song) > dateValue(latest) ||
      (dateValue(song) === dateValue(latest) &&
        song.video_id === latest.video_id &&
        song.start > latest.start)
    ) {
      group.entry.latest = song;
      group.entry.title = song.title;
      group.entry.artist = song.artist;
    }
  }
  return Array.from(
    groups.values(),
    ({ entry, tags, sources, performances, search }) => ({
      ...entry,
      sources: (["singing", "collaboration", "other"] as const).filter(
        (source) => sources.has(source),
      ),
      tags: Array.from(tags).sort((a, b) => a.localeCompare(b, "ja")),
      count: performances.size,
      searchText: [...search, ...Array.from(tags, normalize)].join("\n"),
    }),
  );
}

export function filterRepertoire(
  entries: RepertoireEntry[],
  query: string,
  source: string,
  tags: string[],
) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return entries.filter(
    (entry) =>
      (!source || entry.sources.includes(source as RepertoireSource)) &&
      tags.every((tag) => entry.tags.includes(tag)) &&
      terms.every((term) => entry.searchText.includes(term)),
  );
}

export type RepertoireSort =
  "title" | "artist" | "source" | "tags" | "count" | "latest";
export type RepertoireSortDirection = "asc" | "desc";

export const getDefaultRepertoireSortDirection = (
  sort: string,
): RepertoireSortDirection =>
  sort === "latest" || sort === "count" ? "desc" : "asc";

export function sortRepertoire(
  entries: RepertoireEntry[],
  sort: string,
  locale: string,
  direction: RepertoireSortDirection = getDefaultRepertoireSortDirection(sort),
) {
  const factor = direction === "desc" ? -1 : 1;
  const sourceRank = (entry: RepertoireEntry) =>
    entry.sources.includes("singing")
      ? 0
      : entry.sources.includes("collaboration")
        ? 1
        : 2;
  return [...entries].sort((a, b) => {
    const titleOrder =
      a.title.localeCompare(b.title, locale) ||
      a.artist.localeCompare(b.artist, locale);
    let order = 0;
    switch (sort) {
      case "artist":
        order = a.artist.localeCompare(b.artist, locale);
        break;
      case "source":
        order = sourceRank(a) - sourceRank(b);
        break;
      case "tags":
        order = a.tags.join("\n").localeCompare(b.tags.join("\n"), locale);
        break;
      case "count":
        order = a.count - b.count;
        break;
      case "latest": {
        const aTime = dateValue(a.latest);
        const bTime = dateValue(b.latest);
        // Unknown dates stay at the end in either direction.
        if (!Number.isFinite(aTime) && Number.isFinite(bTime)) return 1;
        if (Number.isFinite(aTime) && !Number.isFinite(bTime)) return -1;
        order = aTime === bTime ? 0 : aTime > bTime ? 1 : -1;
        break;
      }
      default:
        return factor * titleOrder;
    }
    return factor * order || titleOrder;
  });
}

export function getRepertoirePlaybackLinks(song: Song) {
  if (!/^[\w-]{11}$/.test(song.video_id)) return null;
  const start = Number.isFinite(song.start)
    ? Math.max(0, Math.floor(song.start))
    : 0;
  return {
    youtube: `https://www.youtube.com/watch?v=${song.video_id}&t=${start}s`,
    songDb: `/watch?v=${song.video_id}&t=${start}`,
  };
}
