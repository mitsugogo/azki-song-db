"use client";

import Image from "next/image";
import useYoutubeThumbnailFallback from "../hook/useYoutubeThumbnailFallback";
import { useState, useEffect } from "react";

interface YoutubeThumbnailProps {
  videoId: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  outcontainerClassName?: string;
}

const YoutubeThumbnail: React.FC<YoutubeThumbnailProps> = ({
  videoId,
  alt,
  fill,
  width,
  height,
  className,
  imageClassName,
  outcontainerClassName,
}) => {
  const { imageUrl, handleError } = useYoutubeThumbnailFallback(videoId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // videoId が変わったら読み込み状態をリセットする
    setLoading(true);
  }, [videoId]);

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

  if (fill) {
    return (
      <div
        className={`relative flex w-full h-full items-center justify-center aspect-video ${
          outcontainerClassName || ""
        } ${className || ""}`}
      >
        <Image
          key={videoId}
          src={imageUrl}
          alt={alt}
          fill={true}
          className={`outfit-image ${imageClassName || ""}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={handleOnLoad}
          onError={handleError}
          style={{
            opacity: loading ? 0 : 1,
            transition: "opacity 0.5s",
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-video ${outcontainerClassName || ""}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill={true}
        className={`outfit-image ${imageClassName || ""} ${
          loading ? "hidden" : ""
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoad={handleOnLoad}
        onError={handleError}
        style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s" }}
      />
    </div>
  );
};

export default YoutubeThumbnail;
