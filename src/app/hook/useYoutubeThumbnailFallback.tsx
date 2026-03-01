import { useState, useEffect, useCallback, useMemo } from "react";

const RESOLUTIONS = [
  "maxresdefault",
  "sddefault",
  "hqdefault",
  "mqdefault",
  "default",
] as const;

type Resolution = (typeof RESOLUTIONS)[number];

const getImageUrl = (videoId: string, resolution: Resolution): string => {
  return `https://img.youtube.com/vi/${videoId}/${resolution}.jpg`;
};

interface YoutubeThumbnailFallbackResult {
  imageUrl: string;
  handleError: () => void;
}

/**
 * YouTubeのサムネイルをfallbackしながら取得する
 * @param videoId
 * @returns {imageUrl, handleError}
 */
const useYoutubeThumbnailFallback = (
  videoId: string,
): YoutubeThumbnailFallbackResult => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const imageUrl = useMemo(() => {
    const baseUrl = getImageUrl(videoId, RESOLUTIONS[currentUrlIndex]);
    if (retryCount === 0) {
      return baseUrl;
    }
    return `${baseUrl}?retry=${retryCount}`;
  }, [videoId, currentUrlIndex, retryCount]);

  useEffect(() => {
    // videoIdが変更されたら、ステートをリセット
    setCurrentUrlIndex(0);
    setRetryCount(0);
  }, [videoId]);

  const handleError = useCallback(() => {
    setCurrentUrlIndex((prevIndex) => {
      if (retryCount === 0) {
        // 一時的なネットワーク失敗を考慮して、現在解像度を1回だけ再試行
        setRetryCount(1);
        return prevIndex;
      }

      setRetryCount(0);

      if (prevIndex < RESOLUTIONS.length - 1) {
        // 次の解像度のURLに切り替え
        return prevIndex + 1;
      }

      // 全てのフォールバックを試しても見つからなかった場合
      console.error(
        `Failed to load YouTube thumbnail for video ID: ${videoId}`,
      );
      return prevIndex;
    });
  }, [retryCount, videoId]);

  return { imageUrl, handleError };
};

export default useYoutubeThumbnailFallback;
