import { useState, useEffect, useCallback } from "react";

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
  videoId: string
): YoutubeThumbnailFallbackResult => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>(
    getImageUrl(videoId, RESOLUTIONS[0])
  );

  useEffect(() => {
    // videoIdが変更されたら、ステートをリセット
    setCurrentUrlIndex(0);
    setImageUrl(getImageUrl(videoId, RESOLUTIONS[0]));
  }, [videoId]);

  const handleError = useCallback(() => {
    if (currentUrlIndex < RESOLUTIONS.length - 1) {
      // 次の解像度のURLに切り替え
      const nextIndex = currentUrlIndex + 1;
      setCurrentUrlIndex(nextIndex);
      setImageUrl(getImageUrl(videoId, RESOLUTIONS[nextIndex]));
    } else {
      // 全てのフォールバックを試しても見つからなかった場合
      console.error(
        `Failed to load YouTube thumbnail for video ID: ${videoId}`
      );
    }
  }, [currentUrlIndex, videoId]);

  return { imageUrl, handleError };
};

export default useYoutubeThumbnailFallback;
