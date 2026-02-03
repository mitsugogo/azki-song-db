import { useEffect, useState } from "react";
import { Song } from "../types/song";

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

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data: Song[]) => {
        data.sort((a, b) => {
          return (
            new Date(b.broadcast_at).getTime() -
            new Date(a.broadcast_at).getTime()
          );
        });
        setAllSongs(data);

        // 検索用のサジェストワードを抽出
        const tags = [...new Set(data.flatMap((song) => song.tags))].sort();
        const songTitles = [...new Set(data.map((song) => song.title))].sort();
        const singers = [
          ...new Set(
            data.flatMap((song) => song.sing.split(/、/).map((s) => s.trim())),
          ),
        ].sort();
        const artists = [
          ...new Set(
            data.flatMap((song) =>
              song.artist.split(/、/).map((s) => s.trim()),
            ),
          ),
        ].sort();
        const lyricists = [
          ...new Set(
            data.flatMap((song) =>
              song.lyricist.split(/、/).map((s) => s.trim()),
            ),
          ),
        ].sort();
        const composers = [
          ...new Set(
            data.flatMap((song) =>
              song.composer.split(/、/).map((s) => s.trim()),
            ),
          ),
        ].sort();
        const arrangers = [
          ...new Set(
            data.flatMap((song) =>
              song.arranger.split(/、/).map((s) => s.trim()),
            ),
          ),
        ].sort();
        const milestones = [
          ...new Set(data.flatMap((song) => song.milestones)),
        ].sort();

        const uniquedTitleAndArtists = Array.from(
          data.reduce((map, song) => {
            // ユニークキーとして titleとartist を結合
            const key = `${song.title}|${song.artist}`;

            // keyが存在しなければ、その曲のオブジェクトをMapに追加
            if (!map.has(key)) {
              map.set(key, {
                title: song.title,
                artist: song.artist,
                // 必要に応じて、元のオブジェクトの他のプロパティも保持できます
                // 例: duration: song.duration,
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
      });
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
  };
};

export default useSongs;
