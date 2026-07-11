import { Song } from "../types/song";
import { useCallback } from "react";
import { useUserLibrary } from "../context/UserLibraryContext";
import type { Playlist } from "@/app/lib/playlistUrl";
import {
  decodePlaylistUrlParam as decodePlaylistUrlParamCore,
  encodePlaylistUrlParam as encodePlaylistUrlParamCore,
} from "@/app/lib/playlistUrl";

export type { Playlist, PlaylistEntry } from "@/app/lib/playlistUrl";

/**
 * プレイリストへの出し入れをするカスタムフック
 * @returns
 */
const usePlaylists = () => {
  const library = useUserLibrary();
  const playlists = library.playlists;

  const isSamePlaylist = (a: Playlist, b: Playlist) => {
    if (a.id && b.id) {
      return a.id === b.id;
    }
    return a.name === b.name;
  };

  // プレイリストを保存
  const savePlaylist = (playlist: Playlist) => {
    const isNew = !playlists.find((p) => p.name === playlist.name);
    if (isNew) {
      playlist.createdAt = new Date().toISOString();
    }
    playlist.updatedAt = new Date().toISOString();
    library.savePlaylist(playlist);
  };

  // 該当のプレイリストに入っているかチェック
  const isInPlaylist = useCallback((playlist: Playlist, song: Song) => {
    const find = playlist.songs.find(
      (entry) =>
        entry.videoId == song?.video_id && entry.start == String(song?.start),
    );
    return !!find;
  }, []);

  // すべてのプレイリストの中のどれかにsongが入っているか
  const isInAnyPlaylist = useCallback(
    (song: Song) => {
      return !!playlists.find((p) => isInPlaylist(p, song));
    },
    [playlists, isInPlaylist],
  );

  const isDuplicate = useCallback(
    (name: string) => {
      return !!playlists.find((p) => p.name === name);
    },
    [playlists],
  );

  const isLimit = (playlist: Playlist) => {
    // 300曲までを上限とする
    return playlist.songs.length >= getMaxLimit();
  };

  // 1プレイリストあたりの曲数上限
  const getMaxLimit = () => {
    return 300;
  };

  // プレイリストを削除
  const deletePlaylist = (playlist: Playlist) => {
    library.deletePlaylist(playlist);
  };

  // プレイリストに追加
  const addToPlaylist = (playlist: Playlist, song: Song) => {
    const videoId = song.video_id;
    const start = String(song.start);

    // 上限判定
    if (isLimit(playlist)) return;

    if (isInPlaylist(playlist, song)) return;

    library.updatePlaylist({
      ...playlist,
      songs: [...playlist.songs, { videoId, start }],
    });
  };

  // プレイリストから削除
  const removeFromPlaylist = (playlist: Playlist, song: Song) => {
    const videoId = song.video_id;
    const start = String(song.start);
    library.updatePlaylist({
      ...playlist,
      songs: playlist.songs.filter(
        (entry) => entry.videoId !== videoId || entry.start !== start,
      ),
    });
  };

  // プレイリストを更新
  const updatePlaylist = (playlist: Playlist) => {
    playlist.updatedAt = new Date().toISOString();
    library.updatePlaylist(playlist);
  };

  // プレイリストの名前を変更
  const renamePlaylist = (playlist: Playlist, newName: string) => {
    library.updatePlaylist({ ...playlist, name: newName });
  };

  // プレイリスト内の曲をすべて削除
  const clearAllSongs = (playlist: Playlist) => {
    library.updatePlaylist({ ...playlist, songs: [] });
  };

  const decodePlaylistUrlParam = useCallback(decodePlaylistUrlParamCore, []);

  const encodePlaylistUrlParam = useCallback(encodePlaylistUrlParamCore, []);

  const isNowPlayingPlaylist = useCallback(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("playlist");
    return !!param;
  }, []);

  return {
    playlists,
    savePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    renamePlaylist,
    clearAllSongs,
    getMaxLimit,
    isInPlaylist,
    isDuplicate,
    isInAnyPlaylist,
    isNowPlayingPlaylist,
    decodePlaylistUrlParam,
    encodePlaylistUrlParam,
    authenticated: library.authenticated,
    ready: library.ready,
    requestSignIn: library.requestSignIn,
  };
};

export default usePlaylists;
