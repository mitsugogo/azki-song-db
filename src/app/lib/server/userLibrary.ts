import "server-only";

import { createHash } from "node:crypto";
import { getPrisma } from "@/app/lib/prisma";
import type { Playlist, PlaylistEntry } from "@/app/lib/playlistUrl";
import { sanitizeLegacyEntries } from "@/app/lib/legacyLibrary";
import {
  canViewPlaylist,
  type PlaylistVisibility,
} from "@/app/lib/playlistVisibility";

export const MAX_PLAYLIST_SONGS = 300;
export const MAX_PLAYLIST_NAME = 200;

export type LibraryPayload = {
  playlists: Playlist[];
  favorites: PlaylistEntry[];
};

const validateVisibility = (value: unknown): PlaylistVisibility => {
  if (value === "PUBLIC" || value === "UNLISTED" || value === "PRIVATE") {
    return value;
  }
  return "PRIVATE";
};

const isEntry = (value: unknown): value is PlaylistEntry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.videoId === "string" &&
    entry.videoId.length > 0 &&
    entry.videoId.length <= 100 &&
    typeof entry.start === "string" &&
    entry.start.length > 0 &&
    entry.start.length <= 32
  );
};

export const validateEntries = (
  value: unknown,
  maxEntries = MAX_PLAYLIST_SONGS,
) => {
  if (!Array.isArray(value) || value.length > maxEntries) {
    throw new Error("INVALID_ENTRIES");
  }
  const entries = value.filter(isEntry);
  const unique = new Set(
    entries.map((entry) => `${entry.videoId}\0${entry.start}`),
  );
  if (entries.length !== value.length || unique.size !== entries.length) {
    throw new Error("INVALID_ENTRIES");
  }
  return entries;
};

export const validatePlaylistName = (value: unknown) => {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || name.length > MAX_PLAYLIST_NAME) throw new Error("INVALID_NAME");
  return name;
};

const toPlaylist = (row: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  visibility: PlaylistVisibility;
  entries: { videoId: string; start: string; position: number }[];
}): Playlist => ({
  id: row.id,
  name: row.name,
  songs: row.entries
    .toSorted((a, b) => a.position - b.position)
    .map(({ videoId, start }) => ({ videoId, start })),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  visibility: row.visibility,
});

export const loadLibrary = async (userId: string): Promise<LibraryPayload> => {
  const prisma = getPrisma();
  const [playlists, favorites] = await Promise.all([
    prisma.userPlaylist.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { entries: { orderBy: { position: "asc" } } },
    }),
    prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    }),
  ]);
  return {
    playlists: playlists.map(toPlaylist),
    favorites: favorites.map(({ videoId, start }) => ({ videoId, start })),
  };
};

export const createPlaylist = async (
  userId: string,
  body: { name?: unknown; songs?: unknown },
) => {
  const name = validatePlaylistName(body.name);
  const songs = validateEntries(body.songs ?? []);
  await getPrisma().userPlaylist.create({
    data: {
      userId,
      name,
      entries: {
        create: songs.map((entry, position) => ({ ...entry, position })),
      },
    },
  });
  return loadLibrary(userId);
};

export const replacePlaylist = async (
  userId: string,
  id: string,
  body: { name?: unknown; songs?: unknown; visibility?: unknown },
) => {
  const name = validatePlaylistName(body.name);
  const songs = validateEntries(body.songs);
  const visibility = validateVisibility(body.visibility);
  const prisma = getPrisma();
  const owned = await prisma.userPlaylist.findFirst({ where: { id, userId } });
  if (!owned) return null;
  await prisma.$transaction(async (tx) => {
    await tx.userPlaylistEntry.deleteMany({ where: { playlistId: id } });
    await tx.userPlaylist.update({
      where: { id },
      data: { name, visibility },
    });
    if (songs.length) {
      await tx.userPlaylistEntry.createMany({
        data: songs.map((entry, position) => ({
          playlistId: id,
          ...entry,
          position,
        })),
      });
    }
  });
  return loadLibrary(userId);
};

export const deletePlaylist = async (userId: string, id: string) => {
  const result = await getPrisma().userPlaylist.deleteMany({
    where: { id, userId },
  });
  return result.count ? loadLibrary(userId) : null;
};

export const loadSharedPlaylist = async (
  id: string,
  viewerUserId?: string | null,
) => {
  const playlist = await getPrisma().userPlaylist.findUnique({
    where: { id },
    include: { entries: { orderBy: { position: "asc" } } },
  });
  if (!playlist) return null;
  const isOwner = Boolean(viewerUserId && playlist.userId === viewerUserId);
  if (!canViewPlaylist(playlist.visibility, playlist.userId, viewerUserId)) {
    return null;
  }
  return { playlist: toPlaylist(playlist), isOwner };
};

export const replaceFavorites = async (userId: string, value: unknown) => {
  const favorites = validateEntries(value, 5000);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.userFavorite.deleteMany({ where: { userId } });
    if (favorites.length) {
      await tx.userFavorite.createMany({
        data: favorites.map((entry, position) => ({
          userId,
          ...entry,
          position,
        })),
      });
    }
  });
  return loadLibrary(userId);
};

const fingerprint = (playlist: Pick<Playlist, "name" | "songs">) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        playlist.name,
        playlist.songs.map((s) => [s.videoId, s.start]),
      ]),
    )
    .digest("hex");

const validDate = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
};

export const migrateLegacyLibrary = async (
  userId: string,
  body: { playlists?: unknown; favorites?: unknown },
) => {
  if (!Array.isArray(body.playlists) || !Array.isArray(body.favorites)) {
    throw new Error("INVALID_MIGRATION");
  }
  const legacyPlaylists = body.playlists.map((value) => {
    if (!value || typeof value !== "object")
      throw new Error("INVALID_MIGRATION");
    const raw = value as Record<string, unknown>;
    return {
      name: validatePlaylistName(raw.name),
      songs: sanitizeLegacyEntries(raw.songs),
      createdAt: validDate(raw.createdAt),
      updatedAt: validDate(raw.updatedAt),
    };
  });
  const legacyFavorites = sanitizeLegacyEntries(body.favorites, 5000);
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.userPlaylist.findMany({
      where: { userId },
      include: { entries: { orderBy: { position: "asc" } } },
    });
    const names = new Set(existing.map((item) => item.name));
    const existingByFingerprint = new Map(
      existing.map((item) => [fingerprint(toPlaylist(item)), item.id]),
    );

    for (const playlist of legacyPlaylists) {
      const hash = fingerprint(playlist);
      const imported = await tx.legacyPlaylistImport.findUnique({
        where: { userId_fingerprint: { userId, fingerprint: hash } },
      });
      if (imported) continue;

      let playlistId = existingByFingerprint.get(hash);
      if (!playlistId) {
        let name = playlist.name;
        for (let suffix = 2; names.has(name); suffix += 1) {
          const suffixText = ` (${suffix})`;
          name = `${playlist.name.slice(0, MAX_PLAYLIST_NAME - suffixText.length)}${suffixText}`;
        }
        names.add(name);
        const created = await tx.userPlaylist.create({
          data: {
            userId,
            name,
            createdAt: playlist.createdAt,
            updatedAt: playlist.updatedAt,
            entries: {
              create: playlist.songs.map((entry, position) => ({
                ...entry,
                position,
              })),
            },
          },
        });
        playlistId = created.id;
      }
      await tx.legacyPlaylistImport.create({
        data: { userId, fingerprint: hash, playlistId },
      });
    }

    const currentFavorites = await tx.userFavorite.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    });
    const seen = new Set(
      currentFavorites.map((f) => `${f.videoId}\0${f.start}`),
    );
    const additions = legacyFavorites.filter((entry) => {
      const key = `${entry.videoId}\0${entry.start}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (additions.length) {
      await tx.userFavorite.createMany({
        data: additions.map((entry, index) => ({
          userId,
          ...entry,
          position: currentFavorites.length + index,
        })),
      });
    }
  });
  return loadLibrary(userId);
};
