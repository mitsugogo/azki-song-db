// usePlaylistActions.tsx
import { useCallback } from "react";
import usePlaylists, { Playlist } from "./usePlaylists";
import { Song } from "../types/song";

type UsePlaylistActionsProps = {
  allSongs: Song[];
  setSongs: (songs: Song[]) => void;
  changeCurrentSong: (song: Song | null) => void;
  setSearchTerm: (term: string) => void;
};

export const usePlaylistActions = ({
  allSongs,
  setSongs,
  changeCurrentSong,
  setSearchTerm,
}: UsePlaylistActionsProps) => {
  const { isInPlaylist, encodePlaylistUrlParam, decodePlaylistUrlParam } =
    usePlaylists();

  // Plays a selected playlist
  const playPlaylist = useCallback(
    (playlist: Playlist) => {
      // パフォーマンス最適化: Setを使って高速ルックアップ
      const playlistSongSet = new Set(
        playlist.songs.map((entry) => `${entry.videoId}-${entry.start}`),
      );

      // ソート用のインデックスマップを事前に作成
      const songIndexMap = new Map(
        playlist.songs.map((entry, index) => [
          `${entry.videoId}-${entry.start}`,
          index,
        ]),
      );

      const songs = allSongs
        .slice()
        .filter((song) => playlistSongSet.has(`${song.video_id}-${song.start}`))
        .sort((a, b) => {
          const indexA = songIndexMap.get(`${a.video_id}-${a.start}`) ?? -1;
          const indexB = songIndexMap.get(`${b.video_id}-${b.start}`) ?? -1;
          return indexA - indexB;
        });

      setSongs(songs);
      if (songs.length > 0) {
        changeCurrentSong(songs[0]);
      }
      setSearchTerm("");

      const encoded = encodePlaylistUrlParam(playlist);
      const url = new URL(window.location.href);
      url.searchParams.set("playlist", encoded);
      url.searchParams.delete("q");
      // 履歴を増やさないようにreplaceStateを使う
      window.history.replaceState({}, "", url);
      // Headerなどに通知
      window.dispatchEvent(new Event("replacestate"));
    },
    [
      allSongs,
      setSongs,
      changeCurrentSong,
      setSearchTerm,
      encodePlaylistUrlParam,
    ],
  );

  // Disables playlist mode and resets the song list
  const disablePlaylistMode = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("playlist");
    // 履歴を増やさないようにreplaceStateを使う
    window.history.replaceState({}, "", url);
    // Headerなどに通知
    window.dispatchEvent(new Event("replacestate"));
    setSongs(allSongs);
  }, [allSongs, setSongs]);

  // Decodes a playlist from a URL parameter
  const decodePlaylistFromUrl = useCallback(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("playlist");
    if (param) {
      return decodePlaylistUrlParam(param);
    }
    return null;
  }, [decodePlaylistUrlParam]);

  return {
    playPlaylist,
    disablePlaylistMode,
    decodePlaylistFromUrl,
    isInPlaylist,
  };
};
