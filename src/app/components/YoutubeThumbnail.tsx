// components/YoutubeThumbnail.tsx
import Image from "next/image";
import useYoutubeThumbnailFallback from "../hook/useYoutubeThumbnailFallback";

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

  if (fill) {
    return (
      <div className={`relative aspect-video ${outcontainerClassName || ""}`}>
        <Image
          src={imageUrl}
          alt={alt}
          fill={true}
          className={`outfit-image ${imageClassName || ""}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width, height }}>
      <Image src={imageUrl} alt={alt} layout="fill" onError={handleError} />
    </div>
  );
};

export default YoutubeThumbnail;
