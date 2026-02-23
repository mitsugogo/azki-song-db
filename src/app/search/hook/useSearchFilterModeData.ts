import { useMemo } from "react";
import {
  getCollabUnitName,
  normalizeMemberNames,
} from "../../config/collabUnits";
import { Song } from "../../types/song";

export type FilterMode =
  | "categories"
  | "title"
  | "artist"
  | "tag"
  | "singer"
  | "collab"
  | "not-sung-for-a-year";

export interface TitleFilterItem {
  title: string;
  artist: string;
  count: number;
}

export interface ArtistFilterItem {
  artist: string;
  count: number;
}

export interface TagFilterItem {
  tag: string;
  count: number;
}

export interface SingerFilterItem {
  singer: string;
  count: number;
}

export interface CollabFilterItem {
  members: string;
  unitName: string | null;
  count: number;
}

export interface NotSungForYearFilterItem {
  title: string;
  artist: string;
  lastSung: string;
  count: number;
}

export interface FilterModeDataMap {
  categories: [];
  title: TitleFilterItem[];
  artist: ArtistFilterItem[];
  tag: TagFilterItem[];
  singer: SingerFilterItem[];
  collab: CollabFilterItem[];
  "not-sung-for-a-year": NotSungForYearFilterItem[];
}

export type SearchFilterModeResult = {
  [K in FilterMode]: {
    filterMode: K;
    data: FilterModeDataMap[K];
  };
}[FilterMode];

const sortJapaneseAndEnglish = (a: string, b: string): number => {
  return a.localeCompare(b, "ja");
};

const getTitleData = (allSongs: Song[]): TitleFilterItem[] => {
  const titleCountMap = new Map<string, number>();
  allSongs.forEach((song) => {
    const key = `${song.title}|||${song.artist}`;
    titleCountMap.set(key, (titleCountMap.get(key) || 0) + 1);
  });

  return Array.from(titleCountMap.entries())
    .map(([combined, count]) => {
      const [title, artist] = combined.split("|||");
      return { title, artist, count };
    })
    .sort((a, b) => sortJapaneseAndEnglish(a.title, b.title));
};

const getArtistData = (allSongs: Song[]): ArtistFilterItem[] => {
  const artistCountMap = new Map<string, number>();
  allSongs.forEach((song) => {
    if (song.artist !== "") {
      artistCountMap.set(
        song.artist,
        (artistCountMap.get(song.artist) || 0) + 1,
      );
    }
  });

  return Array.from(artistCountMap.entries())
    .map(([artist, count]) => ({ artist, count }))
    .sort((a, b) => sortJapaneseAndEnglish(a.artist, b.artist));
};

const getTagData = (allSongs: Song[]): TagFilterItem[] => {
  const tagCountMap = new Map<string, number>();
  allSongs.forEach((song) => {
    song.tags.forEach((tag) => {
      if (tag !== "") {
        tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
      }
    });
  });

  return Array.from(tagCountMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => sortJapaneseAndEnglish(a.tag, b.tag));
};

const getSingerData = (allSongs: Song[]): SingerFilterItem[] => {
  const singerCountMap = new Map<string, number>();
  allSongs.forEach((song) => {
    if (song.sing !== "") {
      const singers = song.sing
        .split("、")
        .map((singer) => singer.trim())
        .filter((singer) => singer !== "");
      singers.forEach((singer) => {
        singerCountMap.set(singer, (singerCountMap.get(singer) || 0) + 1);
      });
    }
  });

  return Array.from(singerCountMap.entries())
    .map(([singer, count]) => ({ singer, count }))
    .sort((a, b) => sortJapaneseAndEnglish(a.singer, b.singer));
};

const getCollabData = (allSongs: Song[]): CollabFilterItem[] => {
  const collabCountMap = new Map<string, CollabFilterItem>();
  allSongs.forEach((song) => {
    if (song.sing !== "") {
      const singers = song.sing
        .split("、")
        .map((singer) => singer.trim())
        .filter((singer) => singer !== "");
      if (singers.length >= 2) {
        const sortedSingers = normalizeMemberNames(singers);
        const normalizedCollab = sortedSingers.join("、");
        const unitName = getCollabUnitName(sortedSingers);

        const existing = collabCountMap.get(normalizedCollab);
        if (existing) {
          existing.count++;
        } else {
          collabCountMap.set(normalizedCollab, {
            members: normalizedCollab,
            unitName,
            count: 1,
          });
        }
      }
    }
  });

  return Array.from(collabCountMap.values()).sort((a, b) => b.count - a.count);
};

const getNotSungForYearData = (
  allSongs: Song[],
): NotSungForYearFilterItem[] => {
  const songLastSungMap = new Map<string, NotSungForYearFilterItem>();
  allSongs.forEach((song) => {
    const key = `${song.title} ${song.artist}`;
    const existing = songLastSungMap.get(key);
    if (existing) {
      existing.lastSung = new Date(
        Math.max(
          new Date(existing.lastSung).getTime(),
          new Date(song.broadcast_at).getTime(),
        ),
      ).toISOString();
      existing.count++;
    } else {
      songLastSungMap.set(key, {
        title: song.title,
        artist: song.artist,
        lastSung: song.broadcast_at,
        count: 1,
      });
    }
  });

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return Array.from(songLastSungMap.values())
    .filter((item) => new Date(item.lastSung) < oneYearAgo)
    .sort(
      (a, b) => new Date(b.lastSung).getTime() - new Date(a.lastSung).getTime(),
    );
};

const getFilterModeData = (
  allSongs: Song[],
  filterMode: FilterMode,
): SearchFilterModeResult => {
  switch (filterMode) {
    case "title": {
      return {
        filterMode,
        data: getTitleData(allSongs),
      };
    }
    case "artist": {
      return {
        filterMode,
        data: getArtistData(allSongs),
      };
    }
    case "tag": {
      return {
        filterMode,
        data: getTagData(allSongs),
      };
    }
    case "singer": {
      return {
        filterMode,
        data: getSingerData(allSongs),
      };
    }
    case "collab": {
      return {
        filterMode,
        data: getCollabData(allSongs),
      };
    }
    case "not-sung-for-a-year": {
      return {
        filterMode,
        data: getNotSungForYearData(allSongs),
      };
    }
    case "categories":
      return {
        filterMode,
        data: [],
      };
    default: {
      const _exhaustiveCheck: never = filterMode;
      return _exhaustiveCheck;
    }
  }
};

const useSearchFilterModeData = (
  allSongs: Song[],
  filterMode: FilterMode,
): SearchFilterModeResult => {
  return useMemo(
    () => getFilterModeData(allSongs, filterMode),
    [allSongs, filterMode],
  );
};

export default useSearchFilterModeData;
