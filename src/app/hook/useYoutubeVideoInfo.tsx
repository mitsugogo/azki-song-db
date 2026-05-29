import { useEffect, useRef, useState } from "react";
import type { YouTubeApiVideoResult } from "../types/api/yt/video";

const DYNAMIC_VIDEO_INFO_POLL_MS = 30_000;

function shouldPollVideoInfo(videoInfo: YouTubeApiVideoResult | null) {
  const liveBroadcastContent = videoInfo?.snippet?.liveBroadcastContent;
  return liveBroadcastContent === "upcoming" || liveBroadcastContent === "live";
}

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
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isActive = true;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
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

    const fetchInfo = async (retryCount: number, isPoll = false) => {
      try {
        const res = await fetch(`/api/yt/video/${videoId}`);
        if (!res.ok) {
          throw new Error(`API call failed: ${res.status}`);
        }
        const data = (await res.json()) as YouTubeApiVideoResult;
        if (!isActive) return;
        setVideoInfo(data);
        setIsLoading(false);
        setError(null);

        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }

        if (shouldPollVideoInfo(data)) {
          pollTimeoutRef.current = setTimeout(() => {
            fetchInfo(0, true);
          }, DYNAMIC_VIDEO_INFO_POLL_MS);
        }
      } catch (err) {
        if (!isActive) return;
        if (retryCount < 1) {
          retryTimeoutRef.current = setTimeout(() => {
            fetchInfo(retryCount + 1, isPoll);
          }, 300);
          return;
        }
        console.error("Error fetching video info:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        if (!isPoll) {
          setIsLoading(false);
        }
      }
    };

    fetchInfo(0);

    return () => {
      isActive = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [videoId]);

  return { videoInfo, isLoading, error };
};

export default useYoutubeVideoInfo;
