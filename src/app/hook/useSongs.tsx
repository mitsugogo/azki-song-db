import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Song } from "../types/song";
import { fetchJsonDedup } from "../lib/fetchDedup";

let cachedSongsForUseSongs: Song[] | null = null;
let songsPromiseForUseSongs: Promise<any> | null = null;
let cachedSongsFetchedAt: string | null = null;

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
const useSongs = () => {
  const locale = useLocale();
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
    if (cachedSongsForUseSongs) {
      // キャッシュとstateの参照を分離し、外部の破壊的操作による汚染を防ぐ
      const sortedCached = sortSongsByBroadcastAtDesc(cachedSongsForUseSongs);
      cachedSongsForUseSongs = sortedCached;
      setAllSongs([...sortedCached]);
      // キャッシュから復元できる更新日時があれば反映する
      if (cachedSongsFetchedAt) setSongsFetchedAt(cachedSongsFetchedAt);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const handleData = (data: Song[] | null) => {
      if (!mounted || !Array.isArray(data)) return;

      const dataCopy = sortSongsByBroadcastAtDesc(data);

      cachedSongsForUseSongs = dataCopy;

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
      if (!songsPromiseForUseSongs) {
        songsPromiseForUseSongs = fetchJsonDedup<Song[]>(
          `/api/songs?hl=${encodeURIComponent(locale || "ja")}`,
        );
      }

      const p = songsPromiseForUseSongs;
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
          cachedSongsFetchedAt = toSet;
        }
      }).catch((e) => {
        console.error(e);
        if (mounted) setIsLoading(false);
      });

      // clear shared promise when done so future fetches can run
      p.finally(() => {
        if (songsPromiseForUseSongs === p) songsPromiseForUseSongs = null;
      });
    };

    startFetch();

    return () => {
      mounted = false;
    };
  }, [locale]);

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
