import { Song } from "../types/song";
import type { YouTubeVideoData } from "../types/youtube";
import NowPlayingSongInfoDetail from "./NowPlayingSongInfoDetail";
import MilestoneBadge from "./MilestoneBadge";
import { Avatar, Skeleton } from "@mantine/core";
import { YouTubeApiVideoResult } from "../types/api/yt/video";
import Link from "next/link";
import { FaThumbsUp } from "react-icons/fa6";
import { FaPlay } from "react-icons/fa";
import { renderLinkedText } from "../lib/textLinkify";
import React, { useState } from "react";
import { Tooltip } from "flowbite-react";

type DescriptionCollapsibleProps = {
  text: string;
  viewCount?: string | number | null;
  uploadDate?: string | null;
};

const DescriptionCollapsible = ({
  text,
  viewCount,
  uploadDate,
}: DescriptionCollapsibleProps) => {
  const [expanded, setExpanded] = useState(false);

  const lines = text.split(/\r\n|\n/);
  const isTruncatable = lines.length > 3;
  const collapsedText = lines.slice(0, 3).join("\n");
  const formatedViewCount = formatViewCountJP(viewCount);

  const handleToggle = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest("a")) return; // リンククリックは展開/折りたたみしない
    if (!isTruncatable) return;
    setExpanded((v) => !v);
  };

  return (
    <div>
      <div
        onClick={handleToggle}
        aria-expanded={expanded}
        className={`cursor-pointer rounded transition-colors p-0`}
        style={{ lineHeight: "1.25rem" }}
      >
        {formatedViewCount && (
          <div className="font-semibold text-muted-foreground mr-2 mb-1">
            {expanded
              ? viewCount?.toLocaleString() + " 回視聴"
              : formatedViewCount}{" "}
            {uploadDate && "・"} {uploadDate}
          </div>
        )}
        {renderLinkedText(expanded || !isTruncatable ? text : collapsedText)}
      </div>

      {isTruncatable && (
        <div
          className="text-xs text-muted-foreground mt-1 cursor-pointer text-gray-200 dark:text-gray-600 hover:text-gray-50 dark:hover:text-gray-200"
          onClick={handleToggle}
        >
          {expanded ? "折りたたむ" : "続きを表示"}
        </div>
      )}
    </div>
  );
};

// サブスクライバー数文字列をパースして数値に変換
function parseSubscriberCount(input?: string | null): number | null {
  if (!input) return null;
  const s = input.replace(/[\u200e\u200f\u202a\u202c]/g, "").trim();

  // 例: "チャンネル登録者数 299万人"
  const jpManMatch = s.match(/([\d.,]+)\s*万人/);
  if (jpManMatch) {
    const num = parseFloat(jpManMatch[1].replace(/,/g, ""));
    if (isNaN(num)) return null;
    return Math.round(num * 10_000);
  }

  // 例: "チャンネル登録者数 9,876人"
  const jpPeopleMatch = s.match(/([\d.,]+)\s*人/);
  if (jpPeopleMatch) {
    const num = parseFloat(jpPeopleMatch[1].replace(/,/g, ""));
    if (isNaN(num)) return null;
    return Math.round(num);
  }

  // 数字+単位(K, M, B) を探す
  const m = s.match(/([\d.,]+)\s*([KMB]?)/i);
  if (m) {
    const num = parseFloat(m[1].replace(/,/g, ""));
    const unit = (m[2] || "").toUpperCase();
    if (isNaN(num)) return null;
    switch (unit) {
      case "K":
        return Math.round(num * 1_000);
      case "M":
        return Math.round(num * 1_000_000);
      case "B":
        return Math.round(num * 1_000_000_000);
      default:
        // 単位なし: そのまま整数とみなす
        return Math.round(num);
    }
  }

  // 例: "1,310,000 subscribers" のようなカンマ区切りの数値を探す
  const m2 = s.match(/([0-9]{1,3}(?:,[0-9]{3})+)/);
  if (m2) {
    return parseInt(m2[1].replace(/,/g, ""), 10);
  }

  return null;
}

// 数値を日本語の "万人" 表示に整形
function formatSubscribersJP(count: number | null, fallback?: string | null) {
  if (count == null) return fallback ?? "";
  if (count < 10_000) return `${count.toLocaleString()}人`;
  const man = count / 10_000;
  // 100万以上は整数表示、それ以外は小数1位まで表示（末尾.0は省略）
  const display =
    man >= 100 ? `${Math.round(man)}` : `${Math.round(man * 10) / 10}`;
  return `${display.replace(/\.0$/, "")}万人`;
}

// 再生回数を日本語の万単位に整形
function formatViewCountJP(count?: string | number | null) {
  if (count == null) return "";
  const value = typeof count === "string" ? Number(count) : count;
  if (!Number.isFinite(value)) return "";
  if (value < 10_000) return `${Math.round(value).toLocaleString()} 回視聴`;
  const man = Math.floor(value / 10_000);
  return `${man}万 回視聴`;
}

interface NowPlayingSongInfoProps {
  currentSong: Song | null;
  allSongs: Song[];
  searchTerm: string;
  isPlaying: boolean;
  hideFutureSongs: boolean;
  setHideFutureSongs: (value: boolean) => void;
  setSearchTerm: (value: string) => void;
  setOpenShereModal: (value: boolean) => void;
  changeCurrentSong: (
    song: Song | null,
    videoId?: string,
    startTime?: number,
  ) => void;
  videoTitle?: string | null;
  videoData?: YouTubeVideoData | null;
  videoInfo?: YouTubeApiVideoResult | null;
}

/**
 * 再生中の曲情報を表示するコンポーネント
 */
const NowPlayingSongInfo = ({
  currentSong,
  allSongs,
  searchTerm,
  isPlaying,
  hideFutureSongs,
  setHideFutureSongs,
  setSearchTerm,
  setOpenShereModal,
  changeCurrentSong,
  videoTitle,
  videoData,
  videoInfo,
}: NowPlayingSongInfoProps) => {
  const channels =
    videoInfo?.channels || (videoInfo?.channel ? [videoInfo.channel] : []);
  const loading = !videoInfo;

  return (
    <>
      <div className="flex mt-2 flex-col py-2 pt-0 px-2 lg:p-0 lg:pt-1 text-sm text-foreground">
        {currentSong && (
          <div className="song-info">
            <div className="flex items-center gap-2 pb-2">
              <div className="w-full flex-auto self-baseline">
                {currentSong.milestones && (
                  <div className="flex items-center gap-1">
                    <MilestoneBadge
                      song={currentSong}
                      onClick={(event, song, milestone) => {
                        setSearchTerm(`milestone:${milestone}`);
                      }}
                    />
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0 line-clamp-2">
                  {videoData?.title ?? videoTitle ?? currentSong.video_title}
                </h2>
              </div>
            </div>

            <div className="channel-info">
              <div className="flex flex-col gap-2 mb-2 w-full sm:flex-row sm:items-start sm:gap-4">
                <div className="w-full">
                  <div className="flex flex-wrap items-start gap-3">
                    {loading
                      ? // Skeleton for channel(s)
                        [0, 1, 2].slice(0, 1).map((i) => (
                          <div className="flex items-center gap-3" key={i}>
                            <Skeleton circle height={36} width={36} />
                            <div className="flex flex-col leading-tight">
                              <Skeleton height={12} width={120} mb={6} />
                              <Skeleton height={10} width={80} />
                            </div>
                          </div>
                        ))
                      : channels?.slice(0, 8).map((ch) => (
                          <Link
                            key={ch.id}
                            href={`https://www.youtube.com/channel/${ch.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 min-w-0 rounded-md px-2 py-1 hover:bg-gray-50/30 dark:hover:bg-gray-800/60 basis-[calc(50%-0.375rem)] sm:basis-[220px]"
                            title={`${ch.name ?? ""}`}
                          >
                            <Avatar
                              src={
                                ch.thumbnails?.sort(
                                  (a, b) => (b?.width ?? 0) - (a?.width ?? 0),
                                )[0]?.url
                              }
                              alt={ch.name ?? "Channel Avatar"}
                              radius="xl"
                              size={36}
                            />
                            <div className="flex flex-col leading-tight min-w-0">
                              <span className="text-sm text-foreground dark:text-white font-medium truncate">
                                {ch.name ?? ""}
                              </span>
                              {ch.subscriberCount !== null && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  チャンネル登録者{" "}
                                  {formatSubscribersJP(
                                    parseSubscriberCount(ch.subscriberCount),
                                    ch.subscriberCount,
                                  )}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-start gap-1 self-center mt-2 mr-1">
                  {loading ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Skeleton height={12} width={80} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton height={12} width={60} />
                      </div>
                    </div>
                  ) : (
                    <Tooltip
                      content={`最終更新: ${new Date(videoInfo.lastFetchedAt).toLocaleString()}`}
                      placement="top"
                      className="cursor-pointer"
                    >
                      {videoInfo.viewCount != null && (
                        <div className="text-xs text-muted-foreground flex items-center cursor-pointer whitespace-nowrap">
                          <FaPlay className="inline mr-1" />
                          {videoInfo.viewCount}
                        </div>
                      )}

                      {videoInfo.likeCount != null && (
                        <div className="text-xs text-muted-foreground flex items-center cursor-pointer whitespace-nowrap">
                          <FaThumbsUp className="inline mr-1" />
                          {Number(videoInfo.likeCount).toLocaleString()}
                        </div>
                      )}
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {/** description */}
            {videoInfo?.description && (
              <div className="grow mb-5 bg-gray-50/20 dark:bg-gray-800 rounded-md p-2 pt-1 dark:text-gray-50 hover:bg-primary-50 dark:hover:bg-gray-700">
                <div
                  role="button"
                  aria-expanded={undefined}
                  onClick={(e) => {
                    const el = e.target as HTMLElement;
                    if (el.closest("a")) return;
                  }}
                  className={
                    "whitespace-pre-wrap wrap-break-word text-sm text-foreground dark:text-white mt-2"
                  }
                >
                  <DescriptionCollapsible
                    text={videoInfo.description}
                    viewCount={videoInfo.viewCount}
                    uploadDate={videoInfo.uploadDate}
                  />
                </div>
              </div>
            )}

            <div>
              <NowPlayingSongInfoDetail
                currentSong={currentSong}
                allSongs={allSongs}
                searchTerm={searchTerm}
                isPlaying={isPlaying}
                hideFutureSongs={hideFutureSongs}
                setSearchTerm={setSearchTerm}
                changeCurrentSong={changeCurrentSong}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NowPlayingSongInfo;
