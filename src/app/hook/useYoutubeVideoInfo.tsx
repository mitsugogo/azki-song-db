import { useEffect, useRef, useState } from "react";
import type { YouTubeApiVideoResult } from "../types/api/yt/video";

type YoutubeVideoInfoState = {
  videoInfo: YouTubeApiVideoResult | null;
  isLoading: boolean;
  error: Error | null;
};

const useYoutubeVideoInfo = (
  videoId?: string | null,
): YoutubeVideoInfoState => {
  const [videoInfo, setVideoInfo] = useState<YouTubeApiVideoResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isActive = true;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setVideoInfo(null);
    setError(null);

    if (!videoId) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);

    const fetchInfo = async (retryCount: number) => {
      try {
        const res = await fetch(`/api/yt/video/${videoId}`);
        if (!res.ok) {
          throw new Error(`API call failed: ${res.status}`);
        }
        const data = (await res.json()) as YouTubeApiVideoResult;
        if (!isActive) return;
        setVideoInfo(data);
        setIsLoading(false);
      } catch (err) {
        if (!isActive) return;
        if (retryCount < 1) {
          retryTimeoutRef.current = setTimeout(() => {
            fetchInfo(retryCount + 1);
          }, 300);
          return;
        }
        console.error("Error fetching video info:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    };

    fetchInfo(0);

    return () => {
      isActive = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [videoId]);

  return { videoInfo, isLoading, error };
};

export default useYoutubeVideoInfo;
