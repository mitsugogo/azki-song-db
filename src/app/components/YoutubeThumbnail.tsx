// components/YoutubeThumbnail.tsx
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
      <div className={`relative aspect-video ${outcontainerClassName || ""}`}>
        {loading && (
          <>
            <Spinner />
          </>
        )}
        <Image
          src={imageUrl}
          alt={alt}
          fill={true}
          className={`outfit-image ${imageClassName || ""}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoadingComplete={() => setLoading(false)}
          onError={handleError}
          style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s" }}
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-video ${outcontainerClassName || ""}`}>
      {loading && (
        <>
          <Spinner />
        </>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        fill={true}
        className={`outfit-image ${imageClassName || ""}`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoadingComplete={() => setLoading(false)}
        onError={(e) => {
          setLoading(false);
          handleError(e);
        }}
        style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s" }}
      />
    </div>
  );
};

export default YoutubeThumbnail;
