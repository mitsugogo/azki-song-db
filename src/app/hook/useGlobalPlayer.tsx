"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Song } from "../types/song";

interface GlobalPlayerContextType {
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
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | undefined>(
  undefined,
);

export function GlobalPlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

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
      }}
    >
      {children}
    </GlobalPlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const context = useContext(GlobalPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalPlayer must be used within a GlobalPlayerProvider",
    );
  }
  return context;
}
