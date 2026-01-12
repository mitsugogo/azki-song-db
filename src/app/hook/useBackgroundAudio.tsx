import { useCallback, useEffect, useRef, useState } from "react";

interface Meta {
  title?: string;
  artist?: string;
  artwork?: string;
}

export default function useBackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const setupMediaSession = useCallback((meta?: Meta, duration?: number) => {
    if (typeof window === "undefined") return;
    if ("mediaSession" in navigator) {
      try {
        (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
          title: meta?.title || "",
          artist: meta?.artist || "",
          artwork: meta?.artwork ? [{ src: meta.artwork, sizes: "512x512", type: "image/jpeg" }] : [],
        });

        (navigator as any).mediaSession.setActionHandler("play", () => audioRef.current?.play());
        (navigator as any).mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
        (navigator as any).mediaSession.setActionHandler("seekbackward", (details: any) => {
          if (!audioRef.current) return;
          const d = details?.seekOffset ?? 10;
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - d);
        });
        (navigator as any).mediaSession.setActionHandler("seekforward", (details: any) => {
          if (!audioRef.current) return;
          const d = details?.seekOffset ?? 10;
          audioRef.current.currentTime = Math.min(audioRef.current.duration || Infinity, audioRef.current.currentTime + d);
        });
        (navigator as any).mediaSession.setActionHandler("seekto", (details: any) => {
          if (!audioRef.current || details === undefined) return;
          audioRef.current.currentTime = details.seekTime;
        });
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const play = useCallback(async (videoId: string, startSeconds = 0, meta?: Meta) => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      // playsinline is important for iOS PWA — set as attribute to satisfy TS
      audio.setAttribute("playsinline", "true");
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;

      audio.addEventListener("play", () => setIsPlaying(true));
      audio.addEventListener("pause", () => setIsPlaying(false));
      audio.addEventListener("ended", () => setIsPlaying(false));
    }

    const link = `https://www.youtube.com/watch?v=${videoId}`;
    const src = `/api/stream?link=${encodeURIComponent(link)}&start=${startSeconds}`;
    audioRef.current.src = src;

    setupMediaSession(meta);

    // Dispatch event so embedded YouTube player can pause itself
    try {
      window.dispatchEvent(new Event("azki:backgroundPlay"));
    } catch (e) {
      // ignore
    }

    // try to play
    try {
      await audioRef.current.play();
      setCurrentVideoId(videoId);
      setIsPlaying(true);
    } catch (e) {
      console.error("Background audio play failed", e);
    }
  }, [setupMediaSession]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setCurrentVideoId(null);
      setIsPlaying(false);
    }
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    currentVideoId,
    play,
    stop,
  };
}
