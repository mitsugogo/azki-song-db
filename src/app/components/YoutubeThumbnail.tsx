"use client";

import { Skeleton } from "@mantine/core";
import useYoutubeThumbnailFallback from "../hook/useYoutubeThumbnailFallback";
import { useState, useEffect } from "react";

interface YoutubeThumbnailProps {
  videoId: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  outcontainerClassName?: string;
}

const YoutubeThumbnail: React.FC<YoutubeThumbnailProps> = ({
  videoId,
  alt,
  className,
  imageClassName,
  outcontainerClassName,
}) => {
  const { imageUrl, handleError, isExhausted } =
    useYoutubeThumbnailFallback(videoId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // videoId が変わったら読み込み状態をリセットする
    setLoading(true);
  }, [videoId]);

  useEffect(() => {
    if (isExhausted) {
      setLoading(false);
    }
  }, [isExhausted]);

  const handleOnLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 画像の幅を確認して、0または120(YouTubeがサムネがないときに返す幅)になった場合は、フォールバックを試す
    if (
      e.currentTarget.naturalWidth === 0 ||
      (e.currentTarget.naturalWidth === 120 &&
        e.currentTarget.naturalHeight === 90)
    ) {
      handleError();
      return;
    }
    setLoading(false);
  };

  return (
    <div
      className={`relative flex w-full h-full items-center justify-center aspect-video ${
        outcontainerClassName || ""
      } ${className || ""}`}
    >
      <Skeleton
        visible={loading}
        className="absolute inset-0 h-full w-full"
        radius={0}
      >
        <img
          key={videoId}
          src={imageUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover outfit-image ${imageClassName || ""}`}
          loading="lazy"
          decoding="async"
          onLoad={handleOnLoad}
          onError={handleError}
          style={{
            opacity: loading ? 0 : 1,
            transition: "opacity 0.5s",
          }}
        />
      </Skeleton>
    </div>
  );
};

export default YoutubeThumbnail;
