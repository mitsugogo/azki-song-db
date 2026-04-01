import { useMemo } from "react";
import {
  getCollabUnitName,
  normalizeMemberNames,
} from "../../config/collabUnits";
import { Song } from "../../types/song";
import { useLocale } from "next-intl";
import { Locale } from "@/app/types/locale";

export type FilterMode =
  | "categories"
  | "title"
  | "artist"
  | "tag"
  | "singer"
  | "collab"
  | "not-sung-for-a-year";

export type SearchBrowseSortMode = "count-desc" | "alpha-asc";

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

const sortByCountDescThen = (
  countA: number,
  countB: number,
  tieBreaker: number,
): number => {
  if (countA !== countB) {
    return countB - countA;
  }
  return tieBreaker;
};

const getTitleData = (
  allSongs: Song[],
  sortMode: SearchBrowseSortMode,
): TitleFilterItem[] => {
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
    .sort((a, b) => {
      const titleCompare = sortJapaneseAndEnglish(a.title, b.title);
      const artistCompare = sortJapaneseAndEnglish(a.artist, b.artist);
      if (sortMode === "count-desc") {
        return sortByCountDescThen(
          a.count,
          b.count,
          titleCompare || artistCompare,
        );
      }
      return titleCompare || artistCompare;
    });
};

const getArtistData = (
  allSongs: Song[],
  sortMode: SearchBrowseSortMode,
): ArtistFilterItem[] => {
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
    .sort((a, b) => {
      const artistCompare = sortJapaneseAndEnglish(a.artist, b.artist);
      if (sortMode === "count-desc") {
        return sortByCountDescThen(a.count, b.count, artistCompare);
      }
      return artistCompare;
    });
};

const getTagData = (
  allSongs: Song[],
  sortMode: SearchBrowseSortMode,
): TagFilterItem[] => {
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
    .sort((a, b) => {
      const tagCompare = sortJapaneseAndEnglish(a.tag, b.tag);
      if (sortMode === "count-desc") {
        return sortByCountDescThen(a.count, b.count, tagCompare);
      }
      return tagCompare;
    });
};

const getSingerData = (
  allSongs: Song[],
  sortMode: SearchBrowseSortMode,
): SingerFilterItem[] => {
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
    .sort((a, b) => {
      const singerCompare = sortJapaneseAndEnglish(a.singer, b.singer);
      if (sortMode === "count-desc") {
        return sortByCountDescThen(a.count, b.count, singerCompare);
      }
      return singerCompare;
    });
};

const getCollabData = (
  allSongs: Song[],
  sortMode: SearchBrowseSortMode,
  locale: Locale = "ja",
): CollabFilterItem[] => {
  const collabCountMap = new Map<string, CollabFilterItem>();
  allSongs.forEach((song) => {
    if (song.sing !== "") {
      const singers = song.sings
        .map((singer) => singer.trim())
        .filter((singer) => singer !== "");
      if (singers.length >= 2) {
        const sortedSingers = normalizeMemberNames(singers);
        const normalizedCollab = sortedSingers.join("、");
        const unitName = getCollabUnitName(sortedSingers, locale);

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

  return Array.from(collabCountMap.values()).sort((a, b) => {
    const collabA = a.unitName || a.members;
    const collabB = b.unitName || b.members;
    const collabCompare = sortJapaneseAndEnglish(collabA, collabB);
    if (sortMode === "count-desc") {
      return sortByCountDescThen(a.count, b.count, collabCompare);
    }
    return collabCompare;
  });
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
  sortMode: SearchBrowseSortMode,
  locale: Locale = "ja",
): SearchFilterModeResult => {
  switch (filterMode) {
    case "title": {
      return {
        filterMode,
        data: getTitleData(allSongs, sortMode),
      };
    }
    case "artist": {
      return {
        filterMode,
        data: getArtistData(allSongs, sortMode),
      };
    }
    case "tag": {
      return {
        filterMode,
        data: getTagData(allSongs, sortMode),
      };
    }
    case "singer": {
      return {
        filterMode,
        data: getSingerData(allSongs, sortMode),
      };
    }
    case "collab": {
      return {
        filterMode,
        data: getCollabData(allSongs, sortMode, locale),
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
  sortMode: SearchBrowseSortMode,
  locale: Locale = "ja",
): SearchFilterModeResult => {
  return useMemo(
    () => getFilterModeData(allSongs, filterMode, sortMode, locale),
    [allSongs, filterMode, sortMode, locale],
  );
};

export default useSearchFilterModeData;
