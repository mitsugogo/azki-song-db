export type Playlist = {
  id?: string;
  name: string;
  songs: PlaylistEntry[];
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  visibility?: "PRIVATE" | "UNLISTED" | "PUBLIC";
};

export type PlaylistEntry = {
  videoId: string;
  start: string;
};

export type PlaylistOgPayload = {
  n: string;
  c: number;
  s: { v: string; s: string }[];
};

type EncodedPlaylistEntry = {
  v: string;
  s: string | number;
};

type EncodedPlaylist = {
  id?: string;
  name?: string;
  songs?: EncodedPlaylistEntry[];
  createdAt?: string;
  updatedAt?: string;
  author?: string;
};

const encodeUtf8Base64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const decodeUtf8Base64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
};

const toBase64Url = (value: string) =>
  value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return base64;
};

const parsePlaylist = (value: EncodedPlaylist): Playlist => {
  if (!value.name || !Array.isArray(value.songs)) {
    throw new Error("Invalid playlist payload");
  }

  return {
    id: value.id,
    name: value.name,
    songs: value.songs.map((entry) => ({
      videoId: entry.v,
      start: String(entry.s),
    })),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    author: value.author,
  };
};

export const encodePlaylistUrlParam = (playlist: Playlist) => {
  const compressedJson: EncodedPlaylist = {
    id: playlist.id,
    name: playlist.name,
    songs: playlist.songs.map((entry) => ({
      v: entry.videoId,
      s: entry.start,
    })),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    author: playlist.author,
  };

  return encodeUtf8Base64(JSON.stringify(compressedJson));
};

export const decodePlaylistUrlParam = (param: string): Playlist => {
  const decoded = decodeUtf8Base64(param);
  return parsePlaylist(JSON.parse(decoded) as EncodedPlaylist);
};

export const tryDecodePlaylistUrlParam = (param: string) => {
  try {
    return decodePlaylistUrlParam(param);
  } catch {
    return null;
  }
};

export const getPlaylistOgGridSize = (count: number) => {
  if (count <= 3) return 1;
  return 2;
};

const getPlaylistOgEntryLimit = (count: number) => {
  if (count <= 3) return 1;
  return 4;
};

export const encodePlaylistOgPayload = (playlist: Playlist) => {
  const entryLimit = getPlaylistOgEntryLimit(playlist.songs.length);
  const payload: PlaylistOgPayload = {
    n: playlist.name,
    c: playlist.songs.length,
    s: playlist.songs.slice(0, entryLimit).map((entry) => ({
      v: entry.videoId,
      s: String(entry.start),
    })),
  };

  return toBase64Url(encodeUtf8Base64(JSON.stringify(payload)));
};

export const decodePlaylistOgPayload = (param: string) => {
  try {
    const decoded = decodeUtf8Base64(fromBase64Url(param));
    const payload = JSON.parse(decoded) as PlaylistOgPayload;

    if (
      typeof payload.n !== "string" ||
      !Number.isFinite(payload.c) ||
      !Array.isArray(payload.s)
    ) {
      return null;
    }

    const entryLimit = getPlaylistOgEntryLimit(payload.c);

    return {
      n: payload.n,
      c: payload.c,
      s: payload.s
        .filter(
          (entry) =>
            entry && typeof entry.v === "string" && typeof entry.s === "string",
        )
        .slice(0, entryLimit),
    } satisfies PlaylistOgPayload;
  } catch {
    return null;
  }
};
