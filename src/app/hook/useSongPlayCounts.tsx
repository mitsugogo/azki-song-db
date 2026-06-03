"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { Song } from "../types/song";

export const SONG_PLAY_COUNTS_STORAGE_KEY = "song-play-counts";

export type SongPlayCountRecord = {
  title: string;
  artist: string;
  playCount: number;
  lastPlayedAt: string;
};

export type SongPlayCountState = {
  version: 1;
  records: Record<string, SongPlayCountRecord>;
};

export const createEmptySongPlayCountState = (): SongPlayCountState => ({
  version: 1,
  records: {},
});

export const getSongPlayCountKey = (
  songOrTitle: Song | string,
  artistArg?: string,
) => {
  if (typeof songOrTitle === "string") {
    return `${songOrTitle}::${artistArg ?? ""}`;
  }
  return `${songOrTitle.title}::${songOrTitle.artist}`;
};

export const isSongPlayCountThresholdMet = (
  playedSeconds: number,
  chapterDuration: number,
) => {
  if (!Number.isFinite(playedSeconds) || playedSeconds <= 0) {
    return false;
  }

  if (playedSeconds >= 180) {
    return true;
  }

  if (!Number.isFinite(chapterDuration) || chapterDuration <= 0) {
    return false;
  }

  return playedSeconds >= chapterDuration * 0.7;
};

export const deserializeSongPlayCountState = (
  value: string | null | undefined,
): SongPlayCountState => {
  if (!value) {
    return createEmptySongPlayCountState();
  }

  try {
    const parsed = JSON.parse(value);
    const recordsSource =
      parsed && typeof parsed === "object" && parsed.records
        ? parsed.records
        : {};

    const records = Object.fromEntries(
      Object.entries(recordsSource).flatMap(([key, record]) => {
        if (!record || typeof record !== "object") {
          return [];
        }

        const title = typeof record.title === "string" ? record.title : "";
        const artist =
          typeof record.artist === "string" ? record.artist : "";
        const playCountValue = Number(record.playCount ?? 0);
        const lastPlayedAt =
          typeof record.lastPlayedAt === "string" ? record.lastPlayedAt : "";

        if (!title || !artist || !Number.isFinite(playCountValue)) {
          return [];
        }

        return [
          [
            key,
            {
              title,
              artist,
              playCount: Math.max(0, Math.floor(playCountValue)),
              lastPlayedAt,
            },
          ],
        ];
      }),
    ) as Record<string, SongPlayCountRecord>;

    return {
      version: 1,
      records,
    };
  } catch (_) {
    return createEmptySongPlayCountState();
  }
};

export const incrementSongPlayCountState = (
  state: SongPlayCountState,
  song: Song,
  playedAt: string,
) => {
  const key = getSongPlayCountKey(song);
  const existing = state.records[key];

  return {
    version: 1,
    records: {
      ...state.records,
      [key]: {
        title: song.title,
        artist: song.artist,
        playCount: (existing?.playCount ?? 0) + 1,
        lastPlayedAt: playedAt,
      },
    },
  } satisfies SongPlayCountState;
};

export default function useSongPlayCounts() {
  const [playCountState, setPlayCountState] = useLocalStorage<SongPlayCountState>({
    key: SONG_PLAY_COUNTS_STORAGE_KEY,
    defaultValue: createEmptySongPlayCountState(),
    serialize: JSON.stringify,
    deserialize: deserializeSongPlayCountState,
  });

  const incrementPlayCount = useCallback(
    (song: Song, playedAt = new Date().toISOString()) => {
      setPlayCountState((prev) => incrementSongPlayCountState(prev, song, playedAt));
    },
    [setPlayCountState],
  );

  const getPlayCountForSong = useCallback(
    (song: Song | null | undefined) => {
      if (!song) return 0;
      return playCountState.records[getSongPlayCountKey(song)]?.playCount ?? 0;
    },
    [playCountState],
  );

  return {
    playCountState,
    incrementPlayCount,
    getPlayCountForSong,
  };
}