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
import React, { useEffect, useMemo, useState } from "react";
import { Tooltip } from "flowbite-react";
import useChannels from "../hook/useChannels";
import { ChannelEntry } from "../types/api/yt/channels";

type DescriptionCollapsibleProps = {
  text: string;
  viewCount?: string | number | null;
  uploadDate?: string | null;
  tags?: string[];
};

type MergedChannelInfo = {
  id: string | null;
  name: string;
  subscriberCount: string | null;
  artistname: string;
  thumbnails: Array<{
    url: string;
    width: null;
    height: null;
  }> | null;
  channelUrl: string;
};

const DescriptionCollapsible = ({
  text,
  viewCount,
  uploadDate,
  tags,
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

  // uploadDateがnew Date()で有効な日付文字列かどうか
  const isDateString = (s: string | null | undefined) => {
    if (!s) return false;
    const d = new Date(s);
    return !isNaN(d.getTime());
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
          <div
            className={`font-semibold text-muted-foreground mr-2 mb-1 ${expanded ? "" : "line-clamp-1"}`}
          >
            {expanded
              ? viewCount?.toLocaleString() + " 回視聴"
              : formatedViewCount}{" "}
            {uploadDate && "・"}{" "}
            {isDateString(uploadDate)
              ? new Date(uploadDate || "").toLocaleDateString()
              : uploadDate}
            {tags && tags.length > 0 && (
              <>
                <span className="mr-2"></span>
                {tags.map((tag) =>
                  expanded ? (
                    <Link
                      key={tag}
                      href={`https://www.youtube.com/hashtag/${encodeURIComponent(
                        tag,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-gray-300 dark:text-gray-200 mr-1 hover:text-gray-600 dark:hover:text-gray-100"
                    >
                      #{tag}
                    </Link>
                  ) : (
                    <span
                      key={tag}
                      className="inline-block text-sm text-gray-300 dark:text-gray-200 mr-1"
                    >
                      #{tag}
                    </span>
                  ),
                )}
              </>
            )}
          </div>
        )}
        {renderLinkedText(expanded || !isTruncatable ? text : collapsedText)}
      </div>

      {isTruncatable && (
        <div
          className="text-xs text-muted-foreground mt-1 cursor-pointer text-gray-200 dark:text-gray-100 hover:text-gray-50 dark:hover:text-gray-200"
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
  const { channels: channelsRegistry, isLoading: channelsLoading } =
    useChannels();

  const channelsByArtist = useMemo(() => {
    const map = new Map<string, ChannelEntry>();
    channelsRegistry.forEach((entry) => {
      const key = (entry.artistName ?? "").trim();
      if (!key) return;
      if (!map.has(key)) map.set(key, entry);
    });
    return map;
  }, [channelsRegistry]);

  // 動画の `author` が channelsRegistry にあるか調べる（channelName または artistName と照合）
  const authorRegistryEntry = useMemo(() => {
    const authorName = (videoInfo?.author ?? "").trim();
    if (!authorName) return null;
    return (
      channelsRegistry.find((ch) => {
        const channelName = (ch.channelName ?? "").trim();
        const artistName = (ch.artistName ?? "").trim();
        return (
          (channelName && channelName === authorName) ||
          (artistName && artistName === authorName)
        );
      }) ?? null
    );
  }, [channelsRegistry, videoInfo?.author]);

  const uploadChannel = useMemo(() => {
    const entry = authorRegistryEntry;
    const authorName = (videoInfo?.author ?? "").trim();
    if (!entry) return null;
    const handle = entry.handle
      ? entry.handle.startsWith("@")
        ? entry.handle
        : `@${entry.handle}`
      : "";
    const channelUrl = entry.youtubeId
      ? `https://www.youtube.com/channel/${entry.youtubeId}`
      : handle
        ? `https://www.youtube.com/${handle}`
        : "";
    if (!channelUrl) return null;
    return {
      id: entry.youtubeId || null,
      name: entry.channelName || entry.artistName || authorName,
      subscriberCount: entry.subscriberCount || null,
      artistname: entry.artistName || authorName,
      thumbnails: entry.iconUrl
        ? [{ url: entry.iconUrl || "", width: null, height: null }]
        : null,
      channelUrl,
    } satisfies MergedChannelInfo;
  }, [authorRegistryEntry, videoInfo?.author]);

  const channels: MergedChannelInfo[] = useMemo(() => {
    if (!currentSong?.video_id) return [];
    const singerNames = allSongs
      .filter((song) => song.video_id === currentSong.video_id)
      .flatMap((song) =>
        (song.sing ?? "")
          .split("、")
          .map((name) => name.trim())
          .filter(Boolean),
      )
      .filter((name, idx, arr) => arr.indexOf(name) === idx);

    const singerChannels = singerNames
      .map((name) => {
        const entry = channelsByArtist.get(name);
        if (!entry) return null;
        const handle = entry.handle
          ? entry.handle.startsWith("@")
            ? entry.handle
            : `@${entry.handle}`
          : "";
        const channelUrl = entry.youtubeId
          ? `https://www.youtube.com/channel/${entry.youtubeId}`
          : handle
            ? `https://www.youtube.com/${handle}`
            : "";
        if (!channelUrl) return null;
        return {
          id: entry.youtubeId || null,
          name: entry.channelName || entry.artistName || name,
          subscriberCount: entry.subscriberCount || null,
          artistname: entry.artistName || name,
          thumbnails: entry.iconUrl
            ? [{ url: entry.iconUrl || "", width: null, height: null }]
            : null,
          channelUrl,
        } satisfies MergedChannelInfo;
      })
      .filter((val): val is MergedChannelInfo => val !== null);

    return uploadChannel ? [uploadChannel, ...singerChannels] : singerChannels;
  }, [allSongs, currentSong?.video_id, channelsByArtist, uploadChannel]);

  const loading = !videoInfo || channelsLoading;
  const [showAllChannels, setShowAllChannels] = useState(false);
  useEffect(() => {
    setShowAllChannels(false);
  }, [currentSong?.video_id]);

  // 重複するチャンネルが入るケースがあるため、`id` で重複排除する
  const dedupedChannels = (() => {
    const arr = channels ?? [];
    const map = new Map<string, (typeof arr)[number]>();
    arr.forEach((c, i) => {
      const key = c.id || c.channelUrl || c.artistname || `__${i}`;
      if (!map.has(key)) map.set(key, c);
    });
    return Array.from(map.values());
  })();

  // channelsRegistry に videoInfo.author が存在するか（存在すれば先頭に表示）
  const hasAuthorInRegistry = Boolean(authorRegistryEntry);

  // 自動生成チャンネル（例: "AZKi - トピック" / "Artist - Topic"）かどうか
  const isAutoGeneratedAuthor = useMemo(() => {
    const a = (videoInfo?.author ?? "").trim();
    if (!a) return false;
    return /-\s*(トピック|Topic)$/i.test(a);
  }, [videoInfo?.author]);

  const shouldShowChannels =
    channelsLoading ||
    hasAuthorInRegistry ||
    (isAutoGeneratedAuthor && dedupedChannels.length > 0);

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
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white m-0 line-clamp-2">
                  {videoData?.title ?? videoTitle ?? currentSong.video_title}
                </h2>
              </div>
            </div>

            {shouldShowChannels && (
              <div className="channel-info">
                <div className="flex flex-col gap-2 mb-2 w-full sm:flex-row sm:items-start sm:gap-4">
                  <div className="w-full">
                    <div className="flex flex-wrap items-start gap-1">
                      {loading
                        ? // Skeleton for channel(s)
                          [0, 1, 2].slice(0, 1).map((i) => (
                            <div className="flex items-center gap-1" key={i}>
                              <Skeleton circle height={28} width={28} />
                              <div className="flex flex-col leading-tight">
                                <Skeleton height={10} width={100} mb={4} />
                                <Skeleton height={8} width={64} />
                              </div>
                            </div>
                          ))
                        : (() => {
                            const maxShow = showAllChannels
                              ? dedupedChannels.length
                              : dedupedChannels.length === 4
                                ? 4
                                : 3;
                            const shown = hasAuthorInRegistry
                              ? (dedupedChannels?.slice(0, maxShow) ?? [])
                              : isAutoGeneratedAuthor
                                ? (dedupedChannels?.slice(0, maxShow) ?? [])
                                : [];
                            const remaining =
                              (dedupedChannels?.length ?? 0) - shown.length;
                            return (
                              <>
                                {shown.map((ch) => (
                                  <Link
                                    key={
                                      ch.channelUrl ??
                                      ch.id ??
                                      ch.name ??
                                      "channel"
                                    }
                                    href={ch.channelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 min-w-0 rounded-md px-1 py-0.5 hover:bg-gray-50/30 dark:hover:bg-gray-800/60 basis-auto sm:basis-50 md:basis-65"
                                    title={`${ch.name ?? ""}`}
                                  >
                                    <Avatar
                                      src={
                                        ch.thumbnails?.sort(
                                          (a, b) =>
                                            (b?.width ?? 0) - (a?.width ?? 0),
                                        )[0]?.url
                                      }
                                      alt={ch.name ?? "Channel Avatar"}
                                      radius="xl"
                                      size={28}
                                    />
                                    <div className="flex flex-col leading-tight min-w-0 ml-1">
                                      <span className="text-sm text-foreground dark:text-white font-medium truncate whitespace-nowrap">
                                        {ch.name ?? ""}
                                      </span>
                                      {ch.subscriberCount !== null && (
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                          チャンネル登録者{" "}
                                          {formatSubscribersJP(
                                            parseSubscriberCount(
                                              ch.subscriberCount,
                                            ),
                                            ch.subscriberCount,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                ))}

                                {remaining > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowAllChannels((v) => !v)
                                    }
                                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50/30 dark:hover:bg-gray-800/60 self-center"
                                  >
                                    {showAllChannels
                                      ? `折りたたむ`
                                      : `他 ${remaining} チャンネル`}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                    </div>
                  </div>

                  {hasAuthorInRegistry && (
                    <div className="hidden md:flex flex-col items-start gap-1 self-start mr-1 bg-gray-50/20 dark:bg-gray-800 rounded-md px-6 py-1">
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
                          className="pointer-events-none"
                        >
                          <div className="cursor-pointer">
                            {videoInfo.viewCount != null && (
                              <div className="text-xs text-muted-foreground flex items-center whitespace-nowrap">
                                <FaPlay className="inline mr-1" />
                                {videoInfo.viewCount.toLocaleString()}
                              </div>
                            )}

                            {videoInfo.likeCount != null && (
                              <div className="text-xs text-muted-foreground flex items-center whitespace-nowrap">
                                <FaThumbsUp className="inline mr-1" />
                                {Number(videoInfo.likeCount).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    tags={videoInfo.tags}
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
