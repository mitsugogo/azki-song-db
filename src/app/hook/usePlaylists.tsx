import { Song } from "../types/song";
import { useLocalStorage } from "@mantine/hooks";

export type Playlist = {
  id?: string;
  name: string;
  songs: PlaylistEntry[];
  createdAt?: string;
  updatedAt?: string;
  author?: string;
};

export type PlaylistEntry = {
  videoId: string;
  start: string;
};

/**
 * プレイリストへの出し入れをするカスタムフック
 * @returns
 */
const usePlaylists = () => {
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>({
    key: "playlists",
    defaultValue: [],
  });

  // プレイリストを保存
  const savePlaylist = (playlist: Playlist) => {
    const isNew = !playlists.find((p) => p.name === playlist.name);
    if (isNew) {
      playlist.id = String(Date.now());
      playlist.createdAt = new Date().toISOString();
    }
    playlist.updatedAt = new Date().toISOString();
    setPlaylists((prev) => [...prev, playlist]);
  };

  // 該当のプレイリストに入っているかチェック
  const isInPlaylist = (playlist: Playlist, song: Song) => {
    const find = playlist.songs.find(
      (entry) => entry.videoId == song?.video_id && entry.start == song?.start,
    );
    return !!find;
  };

  // すべてのプレイリストの中のどれかにsongが入っているか
  const isInAnyPlaylist = (song: Song) => {
    return !!playlists.find((p) => isInPlaylist(p, song));
  };

  const isDuplicate = (name: string) => {
    return !!playlists.find((p) => p.name === name);
  };

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
    setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
  };

  // プレイリストに追加
  const addToPlaylist = (playlist: Playlist, song: Song) => {
    const videoId = song.video_id;
    const start = song.start;

    // 上限判定
    if (isLimit(playlist)) return;

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlist.id
          ? {
              ...p,
              songs: [...p.songs, { videoId, start }],
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  };

  // プレイリストから削除
  const removeFromPlaylist = (playlist: Playlist, song: Song) => {
    const videoId = song.video_id;
    const start = song.start;
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlist.id
          ? {
              ...p,
              songs: p.songs.filter(
                (entry) => entry.videoId !== videoId && entry.start !== start,
              ),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  };

  // プレイリストを更新
  const updatePlaylist = (playlist: Playlist) => {
    playlist.updatedAt = new Date().toISOString();
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlist.id ? playlist : p)),
    );
  };

  // プレイリストの名前を変更
  const renamePlaylist = (playlist: Playlist, newName: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlist.id
          ? { ...p, name: newName, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  };

  // プレイリスト内の曲をすべて削除
  const clearAllSongs = (playlist: Playlist) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlist.id
          ? { ...p, songs: [], updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  };

  const decodePlaylistUrlParam = (param: string) => {
    const binaryString = atob(param);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    const decoded = decoder.decode(bytes);
    const compressedJson = JSON.parse(decoded);

    const playlist: Playlist = {
      id: compressedJson.id,
      name: compressedJson.name,
      songs: compressedJson.songs.map((entry: { v: string; s: number }) => ({
        videoId: entry.v,
        start: entry.s,
      })),
      createdAt: compressedJson?.createdAt,
      updatedAt: compressedJson?.updatedAt,
      author: compressedJson?.author,
    };
    return playlist;
  };

  const encodePlaylistUrlParam = (playlist: Playlist) => {
    const compressedSongs = playlist.songs.map((entry) => ({
      v: entry.videoId,
      s: entry.start,
    }));
    const compressedJson = {
      id: playlist.id,
      name: playlist.name,
      songs: compressedSongs,
      createdAt: playlist?.createdAt,
      updatedAt: playlist?.updatedAt,
      author: playlist?.author,
    };
    const jsonString = JSON.stringify(compressedJson);
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(jsonString);

    const encoded = btoa(String.fromCharCode(...utf8Bytes));

    return encoded;
  };

  const isNowPlayingPlaylist = () => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("playlist");
    return !!param;
  };

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
  };
};

export default usePlaylists;
