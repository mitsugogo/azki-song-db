"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { Song } from "../types/song";

export interface GlobalPlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  isMinimized: boolean;
  currentTime: number;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setCurrentTime: (time: number) => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
  seekTo: (absoluteSeconds: number) => void;
  setSeekTo: (fn: ((absoluteSeconds: number) => void) | null) => void;
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | undefined>(
  undefined,
);

export function GlobalPlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const seekToRef = useRef<((absoluteSeconds: number) => void) | null>(null);

  const setSeekTo = useCallback(
    (fn: ((absoluteSeconds: number) => void) | null) => {
      seekToRef.current = fn;
    },
    [],
  );

  const seekTo = useCallback((absoluteSeconds: number) => {
    seekToRef.current?.(absoluteSeconds);
  }, []);

  const minimizePlayer = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizePlayer = useCallback(() => {
    setIsMinimized(false);
  }, []);

  return (
    <GlobalPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        isMinimized,
        currentTime,
        setCurrentSong,
        setIsPlaying,
        setIsMinimized,
        setCurrentTime,
        minimizePlayer,
        maximizePlayer,
        seekTo,
        setSeekTo,
      }}
    >
      {children}
    </GlobalPlayerContext.Provider>
  );
}

export function useGlobalPlayer(): GlobalPlayerContextType {
  const context = useContext(GlobalPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalPlayer must be used within a GlobalPlayerProvider",
    );
  }
  return context;
}
