"use client";

import Image from "next/image";
import useYoutubeThumbnailFallback from "../hook/useYoutubeThumbnailFallback";
import { useState } from "react";
import { Spinner } from "flowbite-react";

interface YoutubeThumbnailProps {
  videoId: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  imageClassName?: string;
  outcontainerClassName?: string;
}

const YoutubeThumbnail: React.FC<YoutubeThumbnailProps> = ({
  videoId,
  alt,
  fill,
  width,
  height,
  imageClassName,
  outcontainerClassName,
}) => {
  const { imageUrl, handleError } = useYoutubeThumbnailFallback(videoId);
  const [loading, setLoading] = useState(true);

  if (fill) {
    return (
      <div
        className={`relative flex w-full items-center justify-center aspect-video ${
          outcontainerClassName || ""
        }`}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill={true}
          className={`outfit-image ${imageClassName || ""}`}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => setLoading(false)}
          onError={handleError}
          style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s" }}
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
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
        onLoad={() => setLoading(false)}
        onError={handleError}
        style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s" }}
      />
    </div>
  );
};

export default YoutubeThumbnail;
