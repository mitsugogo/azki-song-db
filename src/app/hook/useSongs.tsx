import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocale } from "next-intl";
import { Song } from "../types/song";
import { fetchJsonDedup } from "../lib/fetchDedup";

type UseSongsOptions = {
  includeMembersOnly?: boolean;
};

const cachedSongsForUseSongs = new Map<string, Song[]>();
const songsPromiseForUseSongs = new Map<string, Promise<any>>();
const cachedSongsFetchedAt = new Map<string, string | null>();

const SongsQueryOptionsContext = createContext<UseSongsOptions>({});

export function SongsQueryOptionsProvider({
  value,
  children,
}: {
  value: UseSongsOptions;
  children: ReactNode;
}) {
  const mergedValue = useMemo(
    () => ({
      includeMembersOnly: value.includeMembersOnly ?? false,
    }),
    [value.includeMembersOnly],
  );

  return (
    <SongsQueryOptionsContext.Provider value={mergedValue}>
      {children}
    </SongsQueryOptionsContext.Provider>
  );
}

const buildSongsApiUrl = (locale: string, includeMembersOnly: boolean) => {
  const searchParams = new URLSearchParams({
    hl: locale || "ja",
  });

  if (includeMembersOnly) {
    searchParams.set("includeMembersOnly", "true");
  }

  return `/api/songs?${searchParams.toString()}`;
};

const getBroadcastAtTime = (song: Song): number => {
  const ts = new Date(song.broadcast_at).getTime();
  return Number.isFinite(ts) ? ts : Number.NEGATIVE_INFINITY;
};

const sortSongsByBroadcastAtDesc = (songs: Song[]): Song[] => {
  return [...songs].sort(
    (a, b) => getBroadcastAtTime(b) - getBroadcastAtTime(a),
  );
};

/**
 * 曲データの取得と管理を行うカスタムフック
 */
const useSongs = (options: UseSongsOptions = {}) => {
  const locale = useLocale();
  const inheritedOptions = useContext(SongsQueryOptionsContext);
  const includeMembersOnly =
    options.includeMembersOnly ?? inheritedOptions.includeMembersOnly ?? false;
  const requestUrl = buildSongsApiUrl(locale || "ja", includeMembersOnly);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableArtists, setAvailableArtists] = useState<string[]>([]);
  const [availableSingers, setAvailableSingers] = useState<string[]>([]);
  const [availableSongTitles, setAvailableSongTitles] = useState<string[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<string[]>([]);
  const [availableTitleAndArtists, setAvailableTitleAndArtists] = useState<
    { title: string; artist: string }[]
  >([]);
  const [availableLyricists, setAvailableLyricists] = useState<string[]>([]);
  const [availableComposers, setAvailableComposers] = useState<string[]>([]);
  const [availableArrangers, setAvailableArrangers] = useState<string[]>([]);
  const [songsFetchedAt, setSongsFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const cachedSongs = cachedSongsForUseSongs.get(requestUrl);
    if (cachedSongs) {
      // キャッシュとstateの参照を分離し、外部の破壊的操作による汚染を防ぐ
      const sortedCached = sortSongsByBroadcastAtDesc(cachedSongs);
      cachedSongsForUseSongs.set(requestUrl, sortedCached);
      setAllSongs([...sortedCached]);
      // キャッシュから復元できる更新日時があれば反映する
      const fetchedAt = cachedSongsFetchedAt.get(requestUrl);
      if (fetchedAt) setSongsFetchedAt(fetchedAt);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const handleData = (data: Song[] | null) => {
      if (!mounted || !Array.isArray(data)) return;

      const dataCopy = sortSongsByBroadcastAtDesc(data);

  cachedSongsForUseSongs.set(requestUrl, dataCopy);

      setAllSongs([...dataCopy]);

      const tags = [...new Set(dataCopy.flatMap((song) => song.tags))].sort();
      const songTitles = [
        ...new Set(dataCopy.map((song) => song.title)),
      ].sort();
      const singers = [
        ...new Set(
          dataCopy.flatMap((song) =>
            (song.sing ?? "").split(/、/).map((s) => s.trim()),
          ),
        ),
      ].sort();
      const artists = [
        ...new Set(
          dataCopy.flatMap((song) =>
            (song.artist ?? "").split(/、/).map((s) => s.trim()),
          ),
        ),
      ].sort();
      const lyricists = [
        ...new Set(
          dataCopy.flatMap((song) =>
            (song.lyricist ?? "").split(/、/).map((s) => s.trim()),
          ),
        ),
      ].sort();
      const composers = [
        ...new Set(
          dataCopy.flatMap((song) =>
            (song.composer ?? "").split(/、/).map((s) => s.trim()),
          ),
        ),
      ].sort();
      const arrangers = [
        ...new Set(
          dataCopy.flatMap((song) =>
            (song.arranger ?? "").split(/、/).map((s) => s.trim()),
          ),
        ),
      ].sort();
      const milestones = [
        ...new Set(dataCopy.flatMap((song) => song.milestones)),
      ].sort();

      const uniquedTitleAndArtists = Array.from(
        dataCopy.reduce((map, song) => {
          const key = `${song.title}|${song.artist}`;
          if (!map.has(key)) {
            map.set(key, {
              title: song.title,
              artist: song.artist,
            });
          }
          return map;
        }, new Map()),
      );

      setAvailableTags(tags);
      setAvailableSongTitles(songTitles);
      setAvailableSingers(singers);
      setAvailableArtists(artists);
      setAvailableLyricists(lyricists);
      setAvailableComposers(composers);
      setAvailableArrangers(arrangers);
      setAvailableMilestones(milestones);
      setAvailableTitleAndArtists(
        uniquedTitleAndArtists
          .map((item) => item[1])
          .sort((a, b) => a.title.localeCompare(b.title)),
      );
      setIsLoading(false);
    };
    // use shared dedup fetch util
    const startFetch = () => {
      if (!songsPromiseForUseSongs.has(requestUrl)) {
        songsPromiseForUseSongs.set(
          requestUrl,
          fetchJsonDedup<Song[]>(requestUrl),
        );
      }

      const p = songsPromiseForUseSongs.get(requestUrl)!;
      p.then((res: any) => {
        if (!mounted) return;
        if (!res) {
          setIsLoading(false);
          return;
        }

        handleData(res.data);

        // API のヘッダーから最終更新日時を復元してセットする
        const hdrs = res.headers ?? {};
        const maybeDate =
          hdrs["x-data-updated"] ||
          hdrs["last-modified"] ||
          hdrs["x-updated-at"] ||
          hdrs["x-last-updated"] ||
          null;

        if (maybeDate) {
          const dt = new Date(maybeDate);
          const toSet = !isNaN(dt.getTime()) ? dt.toISOString() : maybeDate;
          setSongsFetchedAt(toSet);
          cachedSongsFetchedAt.set(requestUrl, toSet);
        }
      }).catch((e) => {
        console.error(e);
        if (mounted) setIsLoading(false);
      });

      // clear shared promise when done so future fetches can run
      p.finally(() => {
        if (songsPromiseForUseSongs.get(requestUrl) === p) {
          songsPromiseForUseSongs.delete(requestUrl);
        }
      });
    };

    startFetch();

    return () => {
      mounted = false;
    };
  }, [requestUrl]);

  return {
    allSongs,
    isLoading,
    availableTags,
    availableArtists,
    availableSingers,
    availableSongTitles,
    availableMilestones,
    availableTitleAndArtists,
    availableLyricists,
    availableComposers,
    availableArrangers,
    songsFetchedAt,
  };
};

export default useSongs;
