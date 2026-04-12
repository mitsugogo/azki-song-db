"use client";

import { Badge } from "@mantine/core";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import { Song } from "../types/song";
import { ViewMilestoneInfo } from "../types/viewMilestone";
import { Link } from "@/i18n/navigation";
import { FaYoutube } from "react-icons/fa6";
import { BsPlayCircleFill } from "react-icons/bs";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "./formatDate";

export const renderLastVideoCell = (
  lastVideo: Song,
  hiddenTitle = false,
  link = true,
) => {
  return (
    <LastVideoCell
      lastVideo={lastVideo}
      hiddenTitle={hiddenTitle}
      link={link}
    />
  );
};

function LastVideoCell({
  lastVideo,
  hiddenTitle,
  link,
}: {
  lastVideo: Song;
  hiddenTitle: boolean;
  link: boolean;
}) {
  const t = useTranslations("Statistics.renderers.lastVideoCell");
  const locale = useLocale();

  if (!lastVideo) return <span className="text-sm">{t("none")}</span>;

  const videoUrl = `${lastVideo.video_uri}`;
  const appPlayUrl = `/watch?v=${lastVideo.video_id}&q=video_id:${lastVideo.video_id}`;

  return (
    <div className="p-2">
      <div className="flex items-start gap-3">
        <div className="w-32 shrink-0 overflow-hidden rounded-sm">
          {link ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <YoutubeThumbnail
                key={lastVideo.video_id}
                videoId={lastVideo.video_id}
                alt={lastVideo.video_title}
              />
            </a>
          ) : (
            <YoutubeThumbnail
              key={lastVideo.video_id}
              videoId={lastVideo.video_id}
              alt={lastVideo.video_title}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`${hiddenTitle ? "hidden" : ""}`}>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-1 text-sm font-semibold text-light-gray-900 hover:text-primary-700 dark:text-light-gray-100 dark:hover:text-primary-500"
            >
              {lastVideo.video_title}
            </a>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(lastVideo.broadcast_at, locale)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              <FaYoutube size={12} />
              {t("youtube")}
            </a>
            <Link
              href={appPlayUrl}
              className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700"
            >
              <BsPlayCircleFill size={12} />
              {t("play")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatMilestoneDate = (
  date: string | null | undefined,
  locale?: string,
) => {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return null;
  return formatDate(parsedDate, locale || undefined);
};

export const renderViewCountCell = (
  viewCount: number,
  milestone?: ViewMilestoneInfo | null,
) => {
  return <ViewCountCell viewCount={viewCount} milestone={milestone} />;
};

function ViewCountCell({
  viewCount,
  milestone,
}: {
  viewCount: number;
  milestone?: ViewMilestoneInfo | null;
}) {
  const t = useTranslations("Statistics.renderers.viewCountCell");
  const locale = useLocale();

  const formatMilestone = (count: number) => {
    if (locale.startsWith("ja") && count >= 10000 && count % 10000 === 0) {
      return t("milestoneJa", {
        count: Math.floor(count / 10000).toLocaleString(locale),
      });
    }

    if (locale.startsWith("en")) {
      const compact = new Intl.NumberFormat("en", {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
      })
        .format(count)
        .replace(/\.0K$/, "k")
        .replace(/K$/, "k");

      return t("milestone", { count: compact });
    }

    return t("milestone", { count: count.toLocaleString(locale) });
  };

  const remain = getRemainCount(viewCount);
  if (remain) {
    const estimatedAt = formatMilestoneDate(milestone?.estimatedAt, locale);
    return (
      <div className="flex flex-col gap-1">
        <span>{t("remaining", { count: remain.toLocaleString(locale) })}</span>
        {estimatedAt && (
          <span className="text-xs text-muted-foreground">
            {t("estimatedAt", { date: estimatedAt })}
          </span>
        )}
      </div>
    );
  }

  const after = getAfterCount(viewCount);
  if (after) {
    const achievedAt = formatMilestoneDate(milestone?.achievedAt, locale);
    return (
      <div className="flex flex-col gap-1">
        <Badge
          color="pink"
          radius={`sm`}
          className="inline whitespace-nowrap w-fit"
        >
          {formatMilestone(after)}
        </Badge>
        {achievedAt && (
          <span className="text-xs text-muted-foreground">
            {t("achievedAt", { date: achievedAt })}
          </span>
        )}
      </div>
    );
  }

  return null;
}

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

const getAfterCount = (viewCount: number) => {
  // 100万台の処理
  if (viewCount >= 1000000) {
    const milestone = Math.floor(viewCount / 1000000) * 1000000;
    // +10000までの範囲
    if (viewCount <= milestone + 10000) {
      return milestone;
    }
  }
  // 30～90万台の処理
  else if (viewCount >= 300000) {
    const milestone = Math.floor(viewCount / 100000) * 100000;
    // +10000までの範囲
    if (viewCount <= milestone + 10000) {
      return milestone;
    }
  }
  // 10万台の処理
  else if (viewCount >= 100000) {
    const milestone = Math.floor(viewCount / 100000) * 100000;
    // +5000までの範囲
    if (viewCount <= milestone + 5000) {
      return milestone;
    }
  }
  // 10万までの処理
  else if (viewCount >= 10000) {
    const milestone = Math.floor(viewCount / 10000) * 10000;
    // +1000までの範囲
    if (viewCount <= milestone + 1000) {
      return milestone;
    }
  }

  // それ以外の場合はnullを返す
  return null;
};

export const viewCountSortFn = (rowA: any, rowB: any) => {
  const extractViewCount = (row: any) => {
    const fromEffective = Number(row.original?.effectiveViewCount);
    if (Number.isFinite(fromEffective) && fromEffective > 0) {
      return fromEffective;
    }

    const fromSong = Number(row.original?.song?.view_count);
    if (Number.isFinite(fromSong) && fromSong > 0) return fromSong;

    const fromVideoInfo = row.original?.videoInfo?.statistics?.viewCount;
    if (typeof fromVideoInfo === "string") {
      const parsed = parseInt(fromVideoInfo, 10);
      if (Number.isFinite(parsed)) return parsed;
    }

    return 0;
  };

  const viewCountA = extractViewCount(rowA);
  const viewCountB = extractViewCount(rowB);

  // viewCountAとBの残り再生数を計算
  const remainA = getRemainCount(viewCountA) || 0;
  const remainB = getRemainCount(viewCountB) || 0;

  if (remainA && remainB) {
    return remainA - remainB;
  }
  if (remainA) {
    return -1;
  }
  if (remainB) {
    return 1;
  }

  const afterA = getAfterCount(viewCountA) || 0;
  const afterB = getAfterCount(viewCountB) || 0;
  if (afterA && afterB) {
    return afterA - afterB;
  }
  if (afterA) {
    return -1;
  }
  if (afterB) {
    return 1;
  }

  if (afterA && afterB) {
    return afterA - afterB;
  }

  return viewCountB - viewCountA;
};
