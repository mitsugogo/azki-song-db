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
      const songs = allSongs
        .slice()
        .filter((song) => isInPlaylist(playlist, song))
        .sort((a, b) => {
          return (
            playlist.songs.findIndex(
              (entry) =>
                entry.videoId === a.video_id &&
                Number(String(entry.start)) === Number(a.start),
            ) -
            playlist.songs.findIndex(
              (entry) =>
                entry.videoId === b.video_id &&
                Number(String(entry.start)) === Number(b.start),
            )
          );
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
    [allSongs, isInPlaylist, setSongs, changeCurrentSong, setSearchTerm],
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
