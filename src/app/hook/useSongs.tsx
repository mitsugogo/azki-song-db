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
        const milestones = [
          ...new Set(data.flatMap((song) => song.milestones)),
        ].sort();

        setAvailableTags(tags);
        setAvailableSongTitles(songTitles);
        setAvailableSingers(singers);
        setAvailableArtists(artists);
        setAvailableMilestones(milestones);
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
  };
};

export default useSongs;
