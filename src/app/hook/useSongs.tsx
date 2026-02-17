import { useEffect, useState } from "react";
import { Song } from "../types/song";
import { fetchJsonDedup } from "../lib/fetchDedup";

let cachedSongsForUseSongs: Song[] | null = null;
let songsPromiseForUseSongs: Promise<Song[] | null> | null = null;

/**
 * 曲データの取得と管理を行うカスタムフック
 */
const useSongs = () => {
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
      setAllSongs(cachedSongsForUseSongs);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const handleData = (data: Song[] | null) => {
      if (!mounted || !Array.isArray(data)) return;

      const dataCopy = [...data];
      dataCopy.sort((a, b) => {
        return (
          new Date(b.broadcast_at).getTime() -
          new Date(a.broadcast_at).getTime()
        );
      });

      cachedSongsForUseSongs = dataCopy;

      setAllSongs(dataCopy);
      setSongsFetchedAt(null);

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
    fetchJsonDedup<Song[]>("/api/songs")
      .then((d) => handleData(d))
      .catch((e) => {
        console.error(e);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
