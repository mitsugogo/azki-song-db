/* eslint @typescript-eslint/no-explicit-any: off */
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import { Song } from "../types/song";

export const renderLastVideoCell = (
  lastVideo: Song,
  hiddenTitle = false,
  link = true,
) => {
  if (!lastVideo) return <span className="text-sm">なし</span>;

  const videoUrl = `${lastVideo.video_uri}`;

  const content = (
    <div className="md:flex md:items-center md:gap-2 flex flex-col md:flex-row">
      <div className="flex w-full lg:w-24 max-w-[120px]">
        <YoutubeThumbnail
          videoId={lastVideo.video_id}
          alt={lastVideo.video_title}
          fill={true}
        />
      </div>
      <div className="flex flex-grow flex-col w-full gap-1 lg:gap-0">
        <span className={`text-xs ${hiddenTitle ? "hidden" : ""} md:inline`}>
          <span>{lastVideo.video_title}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(lastVideo.broadcast_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
  return link ? (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary-700 dark:text-pink-400 dark:hover:text-pink-500"
    >
      {content}
    </a>
  ) : (
    content
  );
};

export const renderViewCountCell = (viewCount: number) => {
  return getViewCountLabel(viewCount);
};

/**
 * 再生回数ラベルを返す共通関数
 */
export const getViewCountLabel = (viewCount: number) => {
  if (viewCount < 100000) {
    const remaining = 10000 - (viewCount % 10000);
    if (remaining <= 3000) return `あと ${remaining.toLocaleString()} 再生`;
  }
  if (viewCount < 1000000) {
    const remaining = 100000 - (viewCount % 100000);
    if (remaining <= 10000) return `あと ${remaining.toLocaleString()} 再生`;
  }
  if (viewCount >= 1000000) {
    const remaining = 1000000 - (viewCount % 1000000);
    if (remaining <= 20000) return `あと ${remaining.toLocaleString()} 再生`;
  }
  return null;
};

export const viewCountSortFn = (rowA: any, rowB: any) => {
  const viewCountA =
    typeof rowA.original.videoInfo?.statistics?.viewCount === "string"
      ? parseInt(rowA.original.videoInfo.statistics.viewCount, 10)
      : 0;
  const viewCountB =
    typeof rowB.original.videoInfo?.statistics?.viewCount === "string"
      ? parseInt(rowB.original.videoInfo.statistics.viewCount, 10)
      : 0;

  const labelA =
    (viewCountA < 100000 && 10000 - (viewCountA % 10000) <= 3000) ||
    (viewCountA < 1000000 && 100000 - (viewCountA % 100000) <= 10000) ||
    (viewCountA >= 1000000 && 1000000 - (viewCountA % 1000000) <= 20000)
      ? 1
      : 0;
  const labelB =
    (viewCountB < 100000 && 10000 - (viewCountB % 10000) <= 3000) ||
    (viewCountB < 1000000 && 100000 - (viewCountB % 100000) <= 10000) ||
    (viewCountB >= 1000000 && 1000000 - (viewCountB % 1000000) <= 20000)
      ? 1
      : 0;

  const labelSort = labelB - labelA;
  if (labelSort !== 0) return labelSort;

  return viewCountB - viewCountA;
};
