import { Song } from "../types/song";
import type { YouTubeVideoData } from "../types/youtube";
import NowPlayingSongInfoDetail from "./NowPlayingSongInfoDetail";
import MilestoneBadge from "./MilestoneBadge";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Skeleton,
  Tooltip,
  TooltipGroup,
} from "@mantine/core";
import { useTextSelection } from "@mantine/hooks";
import { YouTubeApiVideoResult } from "../types/api/yt/video";
import Link from "next/link";
import { FaPlus, FaThumbsUp, FaUsers } from "react-icons/fa6";
import { FaPlay } from "react-icons/fa";
import { renderLinkedText } from "../lib/textLinkify";
import React, { use, useEffect, useMemo, useState, useRef } from "react";
import useChannels from "../hook/useChannels";
import { ChannelEntry } from "../types/api/yt/channels";
import { getCollabUnitName } from "../config/collabUnits";

type DescriptionCollapsibleProps = {
  text: string;
  viewCount?: string | number | null;
  uploadDate?: string | null;
  tags?: string[];
};

type MergedChannelInfo = {
  id: string | null;
  name: string;
  subscriberCount: number;
  artistname: string;
  thumbnails: Array<{
    url: string;
    width: null;
    height: null;
  }> | null;
  channelUrl: string;
};

/**
 * 動画のdescription表示コンポーネント（折りたたみ対応）
 * @param param0
 * @returns
 */
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

  // Mantine hook: 現在のテキスト選択を取得
  const selection = useTextSelection();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const preventToggleRef = useRef(false);

  // MouseDown の段階で選択状態を確認しておく（click が選択を消す前に判定するため）
  const handleMouseDown = (e: React.MouseEvent) => {
    const sel =
      selection ??
      (typeof window !== "undefined" ? window.getSelection() : null);
    if (sel && sel.toString().trim().length > 0) {
      const anchor = sel.anchorNode;
      const focus = sel.focusNode;
      const isInsideSelection =
        (anchor && containerRef.current?.contains(anchor)) ||
        (focus && containerRef.current?.contains(focus));
      if (isInsideSelection) {
        preventToggleRef.current = true;
        // クリック後にフラグをリセット（安全のため短時間で）
        setTimeout(() => {
          preventToggleRef.current = false;
        }, 0);
      }
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest("a")) return; // リンククリックは展開/折りたたみしない
    if (!isTruncatable) return;

    // MouseDown で判定したフラグが立っている場合はトグルしない
    if (preventToggleRef.current) {
      preventToggleRef.current = false;
      return;
    }

    // 最終チェック: 現在の選択がコンポーネント内にあるなら無視する
    const liveSelection =
      selection ??
      (typeof window !== "undefined" ? window.getSelection() : null);

    if (liveSelection && liveSelection.toString().trim().length > 0) {
      const anchor = liveSelection.anchorNode;
      const focus = liveSelection.focusNode;
      const isInsideSelection =
        (anchor && containerRef.current?.contains(anchor)) ||
        (focus && containerRef.current?.contains(focus));
      if (isInsideSelection) return;
    }

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
        ref={containerRef}
        onMouseDown={handleMouseDown}
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
              ? Number(viewCount ?? 0).toLocaleString() + " 回視聴"
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
        <div
          className={`${expanded ? "" : "line-clamp-3 select-none"} ${text.length > 200 ? "wrap-break-word" : "break-all"}`}
        >
          {renderLinkedText(expanded || !isTruncatable ? text : collapsedText)}
        </div>
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

/**
 * チャンネル情報表示 メインチャンネル + コラボ(合計3人まで)
 * @param param0
 * @returns
 */
const MainChannelInfo = ({
  ch,
  size = 36,
  collabChs = null,
}: {
  ch: MergedChannelInfo;
  size?: number;
  collabChs?: MergedChannelInfo[] | null;
}) => {
  // コラボチャンネルがある場合（最大2人まで受け付ける）
  if (collabChs && collabChs.length <= 2) {
    const collabs = collabChs.slice(0, 2);
    return (
      <div className="inline-flex items-start gap-x-2 gap-y-1 min-w-0">
        <div className="shrink-0 self-start">
          <TooltipGroup openDelay={100} closeDelay={100}>
            <AvatarGroup>
              {/** メインチャンネル */}
              <Tooltip
                label={`${ch.name ?? ""}`}
                key={ch.channelUrl ?? ch.id ?? ch.name ?? "channel"}
              >
                <Link
                  key={ch.channelUrl ?? ch.id ?? ch.name ?? "channel"}
                  href={ch.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Avatar
                    src={
                      ch.thumbnails?.sort(
                        (a, b) => (b?.width ?? 0) - (a?.width ?? 0),
                      )[0]?.url
                    }
                    alt={ch.name ?? "Channel Avatar"}
                    radius="xl"
                    size={size}
                  />
                </Link>
              </Tooltip>

              {/** コラボ相手（最大2） */}
              {collabs.map((c, idx) => (
                <Tooltip
                  label={`${c.name ?? ""}`}
                  key={c.channelUrl ?? c.id ?? c.name ?? `collab-${idx}`}
                >
                  <Link
                    key={c.channelUrl ?? c.id ?? c.name ?? `collab-${idx}`}
                    href={c.channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 min-w-0 rounded-md px-1 py-0.5 hover:bg-gray-50/30 dark:hover:bg-gray-800/60 basis-auto sm:basis-50 md:basis-65"
                    title={`${c.name ?? ""}`}
                  >
                    <Avatar
                      src={
                        c.thumbnails?.sort(
                          (a, b) => (b?.width ?? 0) - (a?.width ?? 0),
                        )[0]?.url
                      }
                      alt={c.name ?? "Channel Avatar"}
                      radius="xl"
                      size={size - 8}
                      top={5}
                    />
                  </Link>
                </Tooltip>
              ))}
            </AvatarGroup>
          </TooltipGroup>
        </div>

        <div
          className={
            `flex flex-col leading-tight min-w-0 ml-1 self-start` +
            (collabs.length > 0
              ? " lg:border-r pr-2 mr-2 border-gray-300 dark:border-gray-700"
              : "")
          }
        >
          <Link
            href={ch.channelUrl}
            target="_blank"
            className="block"
            rel="noopener noreferrer"
            title={`${ch.name ?? ""}`}
          >
            <div className="text-sm text-foreground dark:text-white font-medium truncate whitespace-nowrap">
              {ch.name ?? ""}
            </div>
            {ch.subscriberCount !== null && (
              <div className="text-xs text-muted-foreground truncate">
                チャンネル登録者 {formatSubscribersJP(ch.subscriberCount)}
              </div>
            )}
          </Link>
        </div>

        <div className="hidden lg:flex flex-nowrap items-center gap-x-4 ml-1 min-w-0 self-start overflow-hidden">
          {collabs.map((c, idx) => (
            <Link
              key={c.channelUrl ?? c.id ?? c.name ?? `collab-${idx}`}
              href={c.channelUrl}
              target="_blank"
              className={
                "flex flex-col min-w-0 gap-1 ml-1 items-start " +
                (idx > 0 ? "py-0" : "")
              }
              rel="noopener noreferrer"
              title={`${c.name ?? ""}`}
            >
              <div
                className={`block ${
                  idx > 0
                    ? "border-l border-gray-300 dark:border-gray-700 pl-3 "
                    : ""
                }`}
              >
                <div className="text-sm text-foreground dark:text-white font-medium truncate whitespace-nowrap">
                  {c.name ?? ""}
                </div>
                {c.subscriberCount !== null && (
                  <div className="text-xs text-muted-foreground truncate">
                    チャンネル登録者 {formatSubscribersJP(c.subscriberCount)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  return (
    <Tooltip
      label={`${ch.name ?? ""}`}
      key={ch.channelUrl ?? ch.id ?? ch.name ?? "channel"}
    >
      <Link
        key={ch.channelUrl ?? ch.id ?? ch.name ?? "channel"}
        href={ch.channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 min-w-0 rounded-md px-1 py-0.5 hover:bg-gray-50/30 dark:hover:bg-gray-800/60 basis-auto sm:basis-50 md:basis-65"
        title={`${ch.name ?? ""}`}
      >
        <Avatar
          src={
            ch.thumbnails?.sort((a, b) => (b?.width ?? 0) - (a?.width ?? 0))[0]
              ?.url
          }
          alt={ch.name ?? "Channel Avatar"}
          radius="xl"
          size={size}
        />
        <div className="flex flex-col leading-tight min-w-0 ml-1">
          <span className="text-sm text-foreground dark:text-white font-medium truncate whitespace-nowrap">
            {ch.name ?? ""}
          </span>
          {ch.subscriberCount !== null && (
            <span className="text-xs text-muted-foreground truncate">
              チャンネル登録者 {formatSubscribersJP(ch.subscriberCount)}
            </span>
          )}
        </div>
      </Link>
    </Tooltip>
  );
};

// 数値を日本語の "万人" 表示に整形
function formatSubscribersJP(count: number) {
  if (count == null) return count ?? "";
  const num = Number(count);
  if (!Number.isFinite(num)) return "";
  if (num < 10_000) return `${num.toLocaleString()}人`;
  const man = num / 10_000;
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

  // 動画の `author` が channelsRegistry にあるか調べる
  const authorRegistryEntry = useMemo(() => {
    const authorName = (videoInfo?.snippet?.channelTitle ?? "").trim();
    if (!authorName) return null;
    return (
      channelsRegistry.find((ch) => {
        const channelName = (ch.channelName ?? "").trim();
        const artistName = (ch.artistName ?? "").trim();
        return (
          (channelName && channelName === authorName) ||
          (artistName && artistName === authorName)
        );
      }) ??
      channelsRegistry.find((ch) => {
        const channelName = (ch.channelName ?? "").trim();
        return channelName && channelName === authorName;
      }) ??
      null
    );
  }, [channelsRegistry, videoInfo?.snippet?.channelTitle]);

  // アップロードチャンネル情報を構築
  const uploadChannel = useMemo(() => {
    const entry = authorRegistryEntry;
    const authorName = (videoInfo?.snippet?.channelTitle ?? "").trim();
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
      subscriberCount: entry.subscriberCount,
      artistname: entry.artistName || authorName,
      thumbnails: entry.iconUrl
        ? [{ url: entry.iconUrl || "", width: null, height: null }]
        : null,
      channelUrl,
    } satisfies MergedChannelInfo;
  }, [authorRegistryEntry, videoInfo?.snippet?.channelTitle]);

  // song.sing からチャンネル情報を構築
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
          subscriberCount: entry.subscriberCount,
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
    const a = (videoInfo?.snippet?.channelTitle ?? "").trim();
    if (!a) return false;
    return /-\s*(トピック|Topic)$/i.test(a);
  }, [videoInfo?.snippet?.channelTitle]);

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
              <div className="w-full flex-auto self-baseline min-w-0">
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
                  <div className="w-full min-w-0">
                    <div className="flex flex-wrap items-start gap-1">
                      {loading ? (
                        // Skeleton for channel
                        <div className="flex items-center gap-1">
                          <Skeleton circle height={28} width={28} />
                          <div className="flex flex-col leading-tight">
                            <Skeleton height={10} width={100} mb={4} />
                            <Skeleton height={8} width={64} />
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const maxShow = showAllChannels
                            ? dedupedChannels.length
                            : 1;
                          const shown = hasAuthorInRegistry
                            ? (dedupedChannels?.slice(0, maxShow) ?? [])
                            : isAutoGeneratedAuthor
                              ? (dedupedChannels?.slice(0, maxShow) ?? [])
                              : [];
                          const remaining =
                            (dedupedChannels?.length ?? 0) - shown.length;

                          // この組み合わせにユニット名があるか
                          const unitName = getCollabUnitName(
                            dedupedChannels.flatMap((ch) => [ch.artistname]),
                          );

                          return (
                            <>
                              <div
                                className={`flex flex-wrap items-center gap-2 ${unitName ? "border border-blue-300/30 dark:border-blue-900/30 px-2 py-1 rounded-md relative bg-blue-50 dark:bg-blue-950/30" : ""}`}
                              >
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                  {shown.map((ch) => (
                                    <MainChannelInfo
                                      key={
                                        ch.channelUrl ??
                                        ch.id ??
                                        ch.name ??
                                        "channel"
                                      }
                                      ch={ch}
                                      collabChs={
                                        remaining >= 1
                                          ? dedupedChannels.slice(
                                              shown.length,
                                              shown.length +
                                                Math.min(5, remaining),
                                            )
                                          : undefined
                                      }
                                    />
                                  ))}
                                </div>

                                {remaining > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowAllChannels((v) => !v)
                                    }
                                    className={`ml-auto flex flex-none text-nowrap ${remaining <= 2 ? "lg:hidden" : ""} items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50/30 dark:hover:bg-gray-800/60 self-center cursor-pointer`}
                                  >
                                    {showAllChannels
                                      ? `折りたたむ`
                                      : `他 ${remaining} チャンネル`}
                                    <Tooltip.Group
                                      openDelay={100}
                                      closeDelay={100}
                                    >
                                      <AvatarGroup>
                                        {dedupedChannels
                                          .slice(
                                            shown.length,
                                            shown.length +
                                              Math.min(3, remaining),
                                          )
                                          .map((ch) => (
                                            <Tooltip
                                              label={`${ch.name ?? ""}`}
                                              key={
                                                ch.channelUrl ??
                                                ch.id ??
                                                ch.name ??
                                                "channel_tip"
                                              }
                                            >
                                              <Avatar
                                                key={
                                                  ch.channelUrl ??
                                                  ch.id ??
                                                  ch.name ??
                                                  "channel"
                                                }
                                                src={
                                                  ch.thumbnails?.sort(
                                                    (a, b) =>
                                                      (b?.width ?? 0) -
                                                      (a?.width ?? 0),
                                                  )[0]?.url
                                                }
                                                alt={
                                                  ch.name ?? "Channel Avatar"
                                                }
                                                radius="xl"
                                                size={32}
                                              />
                                            </Tooltip>
                                          ))}
                                        {remaining > 3 && (
                                          <Avatar
                                            radius="xl"
                                            size={28}
                                            color="gray"
                                            top={4}
                                          >
                                            +{remaining - 3}
                                          </Avatar>
                                        )}
                                      </AvatarGroup>
                                    </Tooltip.Group>
                                  </button>
                                )}
                              </div>
                              <div className="self-center">
                                {unitName && (
                                  <Badge
                                    key={unitName}
                                    color={`indigo`}
                                    radius="sm"
                                    style={{ cursor: "pointer" }}
                                  >
                                    {unitName}
                                  </Badge>
                                )}
                              </div>
                            </>
                          );
                        })()
                      )}
                    </div>
                    {shouldShowChannels && showAllChannels && (
                      <button
                        type="button"
                        onClick={() => setShowAllChannels((v) => !v)}
                        className="mt-1 text-xs text-muted-foreground hover:underline cursor-pointer"
                      >
                        折りたたむ
                      </button>
                    )}
                  </div>

                  {hasAuthorInRegistry && videoInfo?.lastFetchedAt && (
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
                          label={`最終更新: ${new Date(videoInfo.lastFetchedAt).toLocaleString()}`}
                          withArrow
                        >
                          <div className="cursor-pointer">
                            {videoInfo.statistics?.viewCount != null && (
                              <div className="text-xs text-muted-foreground flex items-center truncate">
                                <FaPlay className="inline mr-1" />
                                {Number(
                                  videoInfo.statistics?.viewCount ?? 0,
                                ).toLocaleString()}
                              </div>
                            )}

                            {videoInfo.statistics?.likeCount != null && (
                              <div className="text-xs text-muted-foreground flex items-center truncate">
                                <FaThumbsUp className="inline mr-1" />
                                {Number(
                                  videoInfo.statistics?.likeCount ?? 0,
                                ).toLocaleString()}
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
            {videoInfo?.snippet?.localized?.description && (
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
                    text={videoInfo.snippet.localized.description}
                    viewCount={videoInfo.statistics?.viewCount}
                    uploadDate={videoInfo.snippet.publishedAt}
                    tags={videoInfo.snippet.tags || []}
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
