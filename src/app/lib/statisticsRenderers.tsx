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
    <div className="flex items-center gap-2 flex-row">
      <div className="flex w-24 max-w-[120px]">
        <YoutubeThumbnail
          key={lastVideo.video_id}
          videoId={lastVideo.video_id}
          alt={lastVideo.video_title}
          fill={true}
        />
      </div>
      <div className="flex flex-grow flex-col w-full gap-0">
        <span className={`text-xs ${hiddenTitle ? "hidden" : ""} inline`}>
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
  const remain = getRemainCount(viewCount);
  if (remain) return `あと ${remain.toLocaleString()} 再生`;
  return null;
};

const getRemainCount = (viewCount: number) => {
  if (viewCount < 100000) {
    const remaining = 10000 - (viewCount % 10000);
    if (remaining <= 3000) return remaining;
  }
  if (viewCount < 1000000) {
    const remaining = 100000 - (viewCount % 100000);
    if (remaining <= 10000) return remaining;
  }
  if (viewCount >= 1000000) {
    const remaining = 1000000 - (viewCount % 1000000);
    if (remaining <= 20000) return remaining;
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

  // viewCountAとBの残り再生数を計算
  const remainA = getRemainCount(viewCountA) || 0;
  const remainB = getRemainCount(viewCountB) || 0;

  return remainA - remainB;
};
