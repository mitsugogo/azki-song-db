"use client";

import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  Badge,
  Breadcrumbs,
  Button,
  Highlight,
  LoadingOverlay,
  Select,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";
import { Link } from "@/i18n/navigation";
import {
  HiCalendar,
  HiChartBar,
  HiCheck,
  HiChevronRight,
  HiHome,
  HiLink,
  HiSearch,
  HiX,
} from "react-icons/hi";
import { HiArrowsUpDown, HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { FaYoutube } from "react-icons/fa6";
import { useLocale, useTranslations } from "next-intl";
import useArchives from "../hook/useArchives";
import useChannels from "../hook/useChannels";
import { ArchiveItem } from "../types/archiveItem";
import type { ChannelEntry } from "../types/api/yt/channels";
import { formatDate } from "../lib/formatDate";
import historyHelper from "../lib/history";
import { breadcrumbClasses, pageClasses } from "../theme";
import Image from "next/image";
import TimestampComment from "./TimestampComment";
import { FaInfoCircle } from "react-icons/fa";
import { BiSolidVideos } from "react-icons/bi";
import ArchiveContributionHeatmap from "./ArchiveContributionHeatmap";
import {
  createArchiveActivitySummary,
  DateRangeValue,
  getJstDateKey,
  getStreamStartedAtMs,
  isInStreamStartedDateRange,
} from "./archiveActivity";
import {
  getArchiveAnchorId,
  getArchiveAnchorUrl,
  getArchiveVideoIdFromHash,
} from "./archiveAnchors";
import { parseVideoDurationSeconds } from "../lib/videoDuration";

type ArchiveGroup = {
  key: string;
  title: string;
  items: IndexedArchiveItem[];
  latestStreamStartedAt: string;
  latestStreamStartedAtMs: number;
};

type IndexedArchiveItem = ArchiveItem & {
  seriesKey: string;
  seriesTitle: string;
  channel: ChannelEntry | null;
  publishedAtMs: number;
  streamStartedAtMs: number;
  streamStartedDateKey: string;
  videoDurationSeconds: number;
  searchText: string;
};

type ArchiveFilterState = {
  query: string;
  seriesKey: string | null;
  dateRange: DateRangeValue;
};

type ArchiveSortKey =
  | "stream_started_at"
  | "video_duration"
  | "topic"
  | "title"
  | "description"
  | "timestamp_comment";
type ArchiveSortDirection = "asc" | "desc";
type ArchiveSortState = {
  key: ArchiveSortKey;
  direction: ArchiveSortDirection;
};

const DESKTOP_COLUMNS = "184px 150px 104px 160px 280px 320px 1fr";
const DESKTOP_TABLE_MIN_WIDTH = 1724;
const DESKTOP_STICKY_SUMMARY_HEIGHT = 144;
const DESKTOP_STICKY_SUMMARY_TOP = 32;
const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TEXT_QUERY_PARAM = "keyword";
const DEFAULT_ARCHIVE_SORT: ArchiveSortState = {
  key: "stream_started_at",
  direction: "desc",
};
const DESC_DEFAULT_SORT_KEYS = new Set<ArchiveSortKey>([
  "stream_started_at",
  "video_duration",
]);

const getThumbnailUrl = (videoId: string) =>
  `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;

const getChannelUrl = (channelId: string) =>
  `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`;

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const normalizeSeriesKey = (value: string) =>
  normalizeSearchText(value).replace(/[\s\-_.,，、:：!！?？#＃]/g, "");

const normalizeDateParam = (value: string | null) =>
  value && DATE_PARAM_PATTERN.test(value) ? value : null;

const getArchiveFilterStateFromUrl = (): ArchiveFilterState => {
  if (typeof window === "undefined") {
    return {
      query: "",
      seriesKey: null,
      dateRange: [null, null],
    };
  }

  const params = new URL(window.location.href).searchParams;
  const seriesKey = params.get("series") || null;

  return {
    query: params.get(TEXT_QUERY_PARAM) ?? "",
    seriesKey,
    dateRange: [
      normalizeDateParam(params.get("from")),
      normalizeDateParam(params.get("to")),
    ],
  };
};

const isInDateRange = (
  item: IndexedArchiveItem,
  [startDate, endDate]: DateRangeValue,
) => {
  return isInStreamStartedDateRange(item.streamStartedAtMs, [
    startDate,
    endDate,
  ]);
};

const updateArchiveFilterUrl = ({
  query,
  seriesKey,
  dateRange,
}: ArchiveFilterState) => {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const normalizedQuery = query.trim();
  const [fromDate, toDate] = dateRange;

  if (normalizedQuery) {
    url.searchParams.set(TEXT_QUERY_PARAM, normalizedQuery);
  } else {
    url.searchParams.delete(TEXT_QUERY_PARAM);
  }
  url.searchParams.delete("q");

  if (seriesKey) {
    url.searchParams.set("series", seriesKey);
  } else {
    url.searchParams.delete("series");
  }

  if (fromDate) {
    url.searchParams.set("from", fromDate);
  } else {
    url.searchParams.delete("from");
  }

  if (toDate) {
    url.searchParams.set("to", toDate);
  } else {
    url.searchParams.delete("to");
  }

  historyHelper.replaceUrlIfDifferent(url.href, { dispatchEvent: false });
};

const getArchiveSeriesTitle = (item: ArchiveItem) => {
  const bracketMatch = item.title.match(/^【([^】]+)】/);
  const titleLead = bracketMatch?.[1]
    ?.replace(/\s*[#＃][0-9０-９]+.*$/, "")
    .replace(/\s+$/, "");

  return titleLead || item.topic || "その他";
};

const formatArchiveDate = (value: string, locale: string) => {
  if (!value) {
    return "-";
  }

  return formatDate(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
};

const createIndexedArchives = (
  items: ArchiveItem[],
  channelsById: Map<string, ChannelEntry>,
) =>
  items.map((item) => {
    const seriesTitle = getArchiveSeriesTitle(item);
    const seriesKey = normalizeSeriesKey(seriesTitle) || "other";
    const channel = item.channel_id
      ? (channelsById.get(item.channel_id) ?? null)
      : null;
    const publishedAtMs = new Date(item.published_at).getTime();
    const streamStartedAtMs = getStreamStartedAtMs(item.stream_started_at);
    const streamStartedDateKey = getJstDateKey(item.stream_started_at);
    const videoDurationSeconds =
      parseVideoDurationSeconds(item.video_duration) ?? 0;
    const searchText = normalizeSearchText(
      [
        seriesTitle,
        item.topic,
        item.title,
        item.video_id,
        item.channel_id,
        channel?.channelName,
        channel?.artistName,
        item.video_duration,
        item.description,
        item.timestamp_comment,
        item.published_at,
        item.stream_started_at,
      ].join("\n"),
    );

    return {
      ...item,
      seriesKey,
      seriesTitle,
      channel,
      publishedAtMs: Number.isNaN(publishedAtMs) ? 0 : publishedAtMs,
      streamStartedAtMs,
      streamStartedDateKey,
      videoDurationSeconds,
      searchText,
    };
  });

const createArchiveGroups = (items: IndexedArchiveItem[]) => {
  const groups = new Map<string, ArchiveGroup>();

  items.forEach((item) => {
    const seriesTitle = item.seriesTitle;
    const key = item.seriesKey;
    const group = groups.get(key);

    if (group) {
      group.items.push(item);
      if (item.streamStartedAtMs > group.latestStreamStartedAtMs) {
        group.latestStreamStartedAt = item.stream_started_at;
        group.latestStreamStartedAtMs = item.streamStartedAtMs;
      }
      return;
    }

    groups.set(key, {
      key,
      title: seriesTitle,
      items: [item],
      latestStreamStartedAt: item.stream_started_at,
      latestStreamStartedAtMs: item.streamStartedAtMs,
    });
  });

  return Array.from(groups.values());
};

const compareText = (collator: Intl.Collator, left: string, right: string) =>
  collator.compare(left || "", right || "");

const compareArchiveItems = (
  left: IndexedArchiveItem,
  right: IndexedArchiveItem,
  sortState: ArchiveSortState,
  collator: Intl.Collator,
) => {
  let result = 0;

  switch (sortState.key) {
    case "stream_started_at":
      result = left.streamStartedAtMs - right.streamStartedAtMs;
      break;
    case "video_duration":
      result = left.videoDurationSeconds - right.videoDurationSeconds;
      break;
    case "topic":
      result = compareText(collator, left.topic, right.topic);
      break;
    case "title":
      result = compareText(collator, left.title, right.title);
      break;
    case "description":
      result = compareText(collator, left.description, right.description);
      break;
    case "timestamp_comment":
      result = compareText(
        collator,
        left.timestamp_comment,
        right.timestamp_comment,
      );
      break;
  }

  if (result !== 0) {
    return sortState.direction === "desc" ? -result : result;
  }

  return (
    right.streamStartedAtMs - left.streamStartedAtMs ||
    right.publishedAtMs - left.publishedAtMs ||
    left.sequence - right.sequence
  );
};

const SortableArchiveHeader = memo(function SortableArchiveHeader({
  columnKey,
  sortState,
  onSortChange,
  children,
}: {
  columnKey: ArchiveSortKey;
  sortState: ArchiveSortState;
  onSortChange: (columnKey: ArchiveSortKey) => void;
  children: ReactNode;
}) {
  const isActive = sortState.key === columnKey;

  return (
    <button
      type="button"
      onClick={() => onSortChange(columnKey)}
      className="inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold"
      aria-sort={
        isActive
          ? sortState.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <span>{children}</span>
      {isActive ? (
        sortState.direction === "asc" ? (
          <HiChevronUp className="h-4 w-4" />
        ) : (
          <HiChevronDown className="h-4 w-4" />
        )
      ) : (
        <HiArrowsUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  );
});

const createArchiveEntries = (groups: ArchiveGroup[]) =>
  groups.flatMap((group) => [
    {
      type: "group" as const,
      key: `group-${group.key}`,
      group,
    },
    ...group.items.map((item) => ({
      type: "item" as const,
      key: `item-${item.video_id}`,
      item,
    })),
  ]);

const ArchiveTextHighlight = memo(function ArchiveTextHighlight({
  children,
  className,
  highlight,
}: {
  children: string;
  className?: string;
  highlight: string;
}) {
  const normalizedHighlight = highlight.trim();

  if (!normalizedHighlight) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Highlight
      component="span"
      color="yellow"
      highlight={normalizedHighlight}
      className={className}
      style={{
        color: "inherit",
        font: "inherit",
        fontWeight: "inherit",
        lineHeight: "inherit",
      }}
      highlightStyles={{
        color: "inherit",
        font: "inherit",
        fontWeight: "inherit",
        lineHeight: "inherit",
      }}
    >
      {children}
    </Highlight>
  );
});

const YoutubeButton = memo(function YoutubeButton({
  item,
  size,
}: {
  item: IndexedArchiveItem;
  size: "sm" | "md";
}) {
  return (
    <Button
      component={Link}
      href={item.video_url}
      target="_blank"
      rel="noopener noreferrer"
      color="red"
      variant="light"
      size={size}
      leftSection={<FaYoutube className="h-4 w-4" />}
      className="shrink-0"
    >
      YouTube
    </Button>
  );
});

const copyTextToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

const ArchiveAnchorLink = memo(function ArchiveAnchorLink({
  videoId,
  label,
  copiedLabel,
}: {
  videoId: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(async () => {
    const didCopy = await copyTextToClipboard(
      getArchiveAnchorUrl(window.location.href, videoId),
    );
    if (!didCopy) {
      return;
    }

    setCopied(true);
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyResetTimerRef.current = null;
    }, 1600);
  }, [videoId]);

  return (
    <Tooltip label={copied ? copiedLabel : label} withArrow>
      <button
        type="button"
        aria-label={copied ? copiedLabel : label}
        onClick={handleClick}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:text-gray-300 dark:hover:text-primary-200"
      >
        {copied ? (
          <HiCheck className="h-4 w-4 text-teal-600 dark:text-teal-300" />
        ) : (
          <HiLink className="h-4 w-4" />
        )}
      </button>
    </Tooltip>
  );
});

const ArchiveChannelLink = memo(function ArchiveChannelLink({
  item,
}: {
  item: IndexedArchiveItem;
}) {
  if (!item.channel_id) {
    return null;
  }

  const channelName =
    item.channel?.channelName || item.channel?.artistName || item.channel_id;

  return (
    <Link
      href={getChannelUrl(item.channel_id)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 flex min-w-0 items-center gap-2 text-gray-800 hover:text-primary dark:text-gray-100 dark:hover:text-primary-300"
    >
      {item.channel?.iconUrl ? (
        <Image
          src={item.channel.iconUrl}
          width={32}
          height={32}
          alt={channelName}
          loading="lazy"
          decoding="async"
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
          <FaYoutube className="h-4 w-4" />
        </span>
      )}
      <Text className="min-w-0 leading-tight" c="dimmed" fz="xs" truncate>
        {channelName}
      </Text>
    </Link>
  );
});

const ThumbnailLink = memo(function ThumbnailLink({
  item,
  className,
}: {
  item: IndexedArchiveItem;
  className: string;
}) {
  return (
    <div className={className}>
      <Link
        href={item.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block overflow-hidden bg-black ${className ? "rounded-md" : ""}`}
      >
        <Image
          src={getThumbnailUrl(item.video_id)}
          width={320}
          height={180}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="aspect-video w-full object-contain"
        />
        {item.video_duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-semibold leading-none text-white shadow-sm">
            {item.video_duration}
          </span>
        )}
      </Link>
    </div>
  );
});

const MobileGroupHeader = memo(function MobileGroupHeader({
  group,
  locale,
  itemsCountLabel,
  highlightQuery,
}: {
  group: ArchiveGroup;
  locale: string;
  itemsCountLabel: string;
  highlightQuery: string;
}) {
  return (
    <div className="mb-3 mt-6 flex items-start justify-between gap-3 border-b-4 border-primary/15 pb-2">
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">
          <ArchiveTextHighlight highlight={highlightQuery}>
            {group.title}
          </ArchiveTextHighlight>
        </h2>
        <Text c="dimmed" fz="xs">
          {formatArchiveDate(group.latestStreamStartedAt, locale)}
        </Text>
      </div>
      <Badge color="pink" variant="light" className="shrink-0">
        {itemsCountLabel}
      </Badge>
    </div>
  );
});

const MobileArchiveCard = memo(function MobileArchiveCard({
  item,
  locale,
  timestampLabel,
  anchorLinkLabel,
  anchorCopiedLabel,
  highlightQuery,
  isAnchored,
  onTimestampResize,
}: {
  item: IndexedArchiveItem;
  locale: string;
  timestampLabel: string;
  anchorLinkLabel: string;
  anchorCopiedLabel: string;
  highlightQuery: string;
  isAnchored: boolean;
  onTimestampResize: () => void;
}) {
  const normalizedHighlightQuery = normalizeSearchText(highlightQuery);
  const shouldShowMatchedDescription =
    Boolean(normalizedHighlightQuery) &&
    Boolean(item.description) &&
    normalizeSearchText(item.description).includes(normalizedHighlightQuery);

  return (
    <article
      id={getArchiveAnchorId(item.video_id)}
      tabIndex={-1}
      className={`card-glassmorphism overflow-hidden border border-primary/10 focus:outline-none ${
        isAnchored ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <ThumbnailLink item={item} className="" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <ArchiveChannelLink item={item} />
            <Link
              href={item.video_url}
              className="mt-1 text-base font-bold leading-snug text-primary"
            >
              <ArchiveTextHighlight highlight={highlightQuery}>
                {item.title}
              </ArchiveTextHighlight>
            </Link>

            <Text className="mt-1" c="dimmed" fz="xs">
              {formatArchiveDate(item.stream_started_at, locale)}
            </Text>
          </div>
          <ArchiveAnchorLink
            videoId={item.video_id}
            label={anchorLinkLabel}
            copiedLabel={anchorCopiedLabel}
          />
        </div>

        {item.topic && (
          <Badge color="pink" variant="light" className="mt-3">
            <ArchiveTextHighlight highlight={highlightQuery}>
              {item.topic}
            </ArchiveTextHighlight>
          </Badge>
        )}
        {shouldShowMatchedDescription && (
          <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
            <ArchiveTextHighlight highlight={highlightQuery}>
              {item.description}
            </ArchiveTextHighlight>
          </p>
        )}
        {item.timestamp_comment && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {timestampLabel}
            </p>
            <div className="mt-1">
              <TimestampComment
                comment={item.timestamp_comment}
                highlight={highlightQuery}
                onContentResize={onTimestampResize}
                videoId={item.video_id}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
});

const DesktopGroupHeader = memo(function DesktopGroupHeader({
  group,
  locale,
  itemsCountLabel,
  highlightQuery,
}: {
  group: ArchiveGroup;
  locale: string;
  itemsCountLabel: string;
  highlightQuery: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-y border-primary/10 bg-primary/5 px-3 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0">
        <h2 className="text-xl font-bold leading-snug text-gray-900 dark:text-gray-100">
          <ArchiveTextHighlight highlight={highlightQuery}>
            {group.title}
          </ArchiveTextHighlight>
          <Badge
            color="pink"
            variant="light"
            size="md"
            className="ml-2 -top-0.5 relative"
          >
            {itemsCountLabel}
          </Badge>
        </h2>
        <Text className="mt-1" c="dimmed" fz="sm">
          {formatArchiveDate(group.latestStreamStartedAt, locale)}
        </Text>
      </div>
    </div>
  );
});

const DesktopStickyArchiveSummary = memo(function DesktopStickyArchiveSummary({
  item,
  locale,
  highlightQuery,
}: {
  item: IndexedArchiveItem;
  locale: string;
  highlightQuery: string;
}) {
  const cellClass =
    "h-36 bg-white/95 px-3 py-3 text-gray-800 shadow-sm dark:bg-gray-900/95 dark:text-gray-100";
  const mutedCellClass =
    "h-36 bg-white/95 px-3 py-3 text-gray-600 shadow-sm dark:bg-gray-900/95 dark:text-gray-300";

  return (
    <div
      className="grid text-sm"
      style={{
        gridTemplateColumns: DESKTOP_COLUMNS,
        height: DESKTOP_STICKY_SUMMARY_HEIGHT,
      }}
    >
      <div className={cellClass}>
        <ThumbnailLink item={item} className="w-40 rounded-md" />
      </div>
      <div className={`${cellClass} whitespace-nowrap`}>
        {formatArchiveDate(item.stream_started_at, locale)}
      </div>
      <div className={`${cellClass} whitespace-nowrap`}>
        {item.video_duration || "-"}
      </div>
      <div className={cellClass}>
        {item.topic ? (
          <Badge
            color="pink"
            variant="light"
            className="max-w-40 whitespace-normal py-1 leading-snug"
          >
            {item.topic}
          </Badge>
        ) : (
          "-"
        )}
      </div>
      <div className={`${cellClass} font-semibold`}>
        <FaYoutube className="h-4 w-4 inline text-red-600" />
        <Link
          href={item.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-primary hover:text-primary/80"
        >
          <ArchiveTextHighlight highlight={highlightQuery}>
            {item.title}
          </ArchiveTextHighlight>
        </Link>
      </div>
      <div className={mutedCellClass}>
        <p className="line-clamp-3 whitespace-pre-line leading-6">
          {item.description ? (
            <ArchiveTextHighlight highlight={highlightQuery}>
              {item.description}
            </ArchiveTextHighlight>
          ) : (
            "-"
          )}
        </p>
      </div>
      <div className={mutedCellClass} />
    </div>
  );
});

const DesktopArchiveRow = memo(function DesktopArchiveRow({
  item,
  locale,
  highlightQuery,
  anchorLinkLabel,
  anchorCopiedLabel,
  isAnchored,
  isTimestampExpanded,
  onTimestampResize,
  onTimestampExpandedChange,
}: {
  item: IndexedArchiveItem;
  locale: string;
  highlightQuery: string;
  anchorLinkLabel: string;
  anchorCopiedLabel: string;
  isAnchored: boolean;
  isTimestampExpanded: boolean;
  onTimestampResize: () => void;
  onTimestampExpandedChange: (videoId: string, expanded: boolean) => void;
}) {
  const handleTimestampExpandedChange = useCallback(
    (expanded: boolean) => {
      onTimestampExpandedChange(item.video_id, expanded);
    },
    [item.video_id, onTimestampExpandedChange],
  );

  return (
    <div
      id={getArchiveAnchorId(item.video_id)}
      tabIndex={-1}
      className={`grid border-b border-light-gray-200/50 bg-white/70 text-sm focus:outline-none dark:border-white/10 dark:bg-gray-900/50 ${
        isAnchored ? "ring-2 ring-inset ring-primary/40" : ""
      }`}
      style={{ gridTemplateColumns: DESKTOP_COLUMNS }}
    >
      <div className="px-3 py-3 align-top text-gray-800 dark:text-gray-100">
        <ThumbnailLink item={item} className="w-40 rounded-md" />
      </div>
      <div className="whitespace-nowrap px-3 py-3 align-top text-gray-800 dark:text-gray-100">
        {formatArchiveDate(item.stream_started_at, locale)}
      </div>
      <div className="whitespace-nowrap px-3 py-3 align-top text-gray-800 dark:text-gray-100">
        {item.video_duration || "-"}
      </div>
      <div className="px-3 py-3 align-top text-gray-800 dark:text-gray-100">
        {item.topic ? (
          <Badge
            color="pink"
            variant="light"
            className="max-w-40 whitespace-normal py-1 leading-snug"
          >
            {item.topic}
          </Badge>
        ) : (
          "-"
        )}
      </div>
      <div className="px-3 py-3 align-top font-semibold">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <FaYoutube className="h-4 w-4 inline text-red-600" />
            <Link
              href={item.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-primary hover:text-primary/80"
            >
              <ArchiveTextHighlight highlight={highlightQuery}>
                {item.title}
              </ArchiveTextHighlight>
            </Link>
            <ArchiveChannelLink item={item} />
          </div>
          <ArchiveAnchorLink
            videoId={item.video_id}
            label={anchorLinkLabel}
            copiedLabel={anchorCopiedLabel}
          />
        </div>
      </div>
      <div className="px-3 py-3 align-top text-gray-600 dark:text-gray-300">
        <p className="max-h-24 line-clamp-3 whitespace-pre-line leading-6">
          {item.description ? (
            <ArchiveTextHighlight highlight={highlightQuery}>
              {item.description}
            </ArchiveTextHighlight>
          ) : (
            "-"
          )}
        </p>
      </div>
      <div className="px-3 py-3 align-top text-gray-600 dark:text-gray-300">
        <div className="leading-6">
          {item.timestamp_comment ? (
            <TimestampComment
              comment={item.timestamp_comment}
              expanded={isTimestampExpanded}
              highlight={highlightQuery}
              onContentResize={onTimestampResize}
              onExpandedChange={handleTimestampExpandedChange}
              videoId={item.video_id}
            />
          ) : (
            "-"
          )}
        </div>
      </div>
    </div>
  );
});

export default function ArchivesPageClient() {
  const t = useTranslations("Archives");
  const locale = useLocale();
  const { items, isLoading } = useArchives();
  const { channels } = useChannels();
  const [filterQuery, setFilterQuery] = useState("");
  const [debouncedFilterQuery] = useDebouncedValue(filterQuery, 200);
  const deferredFilterQuery = useDeferredValue(debouncedFilterQuery);
  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<DateRangeValue>([null, null]);
  const [isUrlFilterReady, setIsUrlFilterReady] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [expandedTimestampVideoIds, setExpandedTimestampVideoIds] = useState<
    Set<string>
  >(() => new Set());
  const [selectedActivityYear, setSelectedActivityYear] = useState<
    string | null
  >(null);
  const [isActivityVisible, setIsActivityVisible] = useState(false);
  const [archiveScrollTop, setArchiveScrollTop] = useState(0);
  const [activeArchiveAnchorVideoId, setActiveArchiveAnchorVideoId] = useState<
    string | null
  >(null);
  const [sortState, setSortState] =
    useState<ArchiveSortState>(DEFAULT_ARCHIVE_SORT);
  const archiveScrollRef = useRef<OverlayScrollbarsComponentRef>(null);
  const isFilterInputFocusedRef = useRef(false);

  const normalizedQuery = useMemo(
    () => normalizeSearchText(deferredFilterQuery),
    [deferredFilterQuery],
  );

  const channelsById = useMemo(() => {
    const map = new Map<string, ChannelEntry>();
    channels.forEach((channel) => {
      if (channel.youtubeId) {
        map.set(channel.youtubeId, channel);
      }
    });
    return map;
  }, [channels]);

  const indexedItems = useMemo(
    () => createIndexedArchives(items, channelsById),
    [channelsById, items],
  );
  const archiveSortCollator = useMemo(
    () => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }),
    [locale],
  );
  const archiveActivitySummary = useMemo(
    () => createArchiveActivitySummary(indexedItems),
    [indexedItems],
  );

  const seriesOptions = useMemo(
    () =>
      createArchiveGroups(indexedItems)
        .sort((a, b) => b.latestStreamStartedAtMs - a.latestStreamStartedAtMs)
        .map((group) => ({
          value: group.key,
          label: `${group.title} (${group.items.length})`,
        })),
    [indexedItems],
  );

  const hasDateRange = Boolean(dateRange[0] || dateRange[1]);
  const hasDetailedFilters = Boolean(selectedSeriesKey) || hasDateRange;

  const filteredItems = useMemo(
    () =>
      indexedItems.filter(
        (item) =>
          (!normalizedQuery || item.searchText.includes(normalizedQuery)) &&
          (!selectedSeriesKey || item.seriesKey === selectedSeriesKey) &&
          isInDateRange(item, dateRange),
      ),
    [dateRange, indexedItems, normalizedQuery, selectedSeriesKey],
  );

  const sortedFilteredItems = useMemo(() => {
    return [...filteredItems].sort((left, right) =>
      compareArchiveItems(left, right, sortState, archiveSortCollator),
    );
  }, [archiveSortCollator, filteredItems, sortState]);

  const archiveGroups = useMemo(
    () => createArchiveGroups(sortedFilteredItems),
    [sortedFilteredItems],
  );

  const archiveEntries = useMemo(
    () => createArchiveEntries(archiveGroups),
    [archiveGroups],
  );

  const totalCount = items.length;
  const displayCount = filteredItems.length;
  const displayGroupCount = archiveGroups.length;

  useEffect(() => {
    if (archiveActivitySummary.years.length === 0) {
      setSelectedActivityYear(null);
      return;
    }

    setSelectedActivityYear((currentYear) => {
      if (
        currentYear &&
        archiveActivitySummary.years.includes(Number(currentYear))
      ) {
        return currentYear;
      }

      return archiveActivitySummary.latestYear
        ? String(archiveActivitySummary.latestYear)
        : String(archiveActivitySummary.years[0]);
    });
  }, [archiveActivitySummary]);

  const rowVirtualizer = useVirtualizer({
    count: archiveEntries.length,
    getScrollElement: () =>
      archiveScrollRef.current?.osInstance()?.elements().viewport as Element,
    estimateSize: (index) => {
      const entry = archiveEntries[index];
      if (entry?.type === "group") {
        return isDesktop ? 74 : 68;
      }
      return isDesktop ? 132 : 440;
    },
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const scrollToCurrentArchiveHash = useCallback(() => {
    if (isFilterInputFocusedRef.current) {
      return;
    }

    const videoId = getArchiveVideoIdFromHash(window.location.hash);
    if (!videoId) {
      setActiveArchiveAnchorVideoId(null);
      return;
    }

    const archiveEntryIndex = archiveEntries.findIndex(
      (entry) => entry.type === "item" && entry.item.video_id === videoId,
    );
    if (archiveEntryIndex === -1) {
      setActiveArchiveAnchorVideoId(null);
      return;
    }

    setActiveArchiveAnchorVideoId(videoId);
    rowVirtualizer.scrollToIndex(archiveEntryIndex, { align: "center" });

    window.setTimeout(() => {
      if (isFilterInputFocusedRef.current) {
        return;
      }

      document
        .getElementById(getArchiveAnchorId(videoId))
        ?.focus({ preventScroll: true });
    }, 80);
  }, [archiveEntries, rowVirtualizer]);

  const activeStickyArchiveItem = useMemo(() => {
    if (!isDesktop || expandedTimestampVideoIds.size === 0) {
      return null;
    }

    const stickyOffset = archiveScrollTop + DESKTOP_STICKY_SUMMARY_TOP;
    const activeVirtualRow = virtualRows.find((virtualRow) => {
      const entry = archiveEntries[virtualRow.index];
      return (
        entry?.type === "item" &&
        expandedTimestampVideoIds.has(entry.item.video_id) &&
        virtualRow.start <= stickyOffset &&
        virtualRow.end > stickyOffset
      );
    });

    const activeEntry =
      activeVirtualRow && archiveEntries[activeVirtualRow.index];
    return activeEntry?.type === "item" ? activeEntry.item : null;
  }, [
    archiveEntries,
    archiveScrollTop,
    expandedTimestampVideoIds,
    isDesktop,
    virtualRows,
  ]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateLayoutMode = () => setIsDesktop(mediaQuery.matches);

    updateLayoutMode();
    mediaQuery.addEventListener("change", updateLayoutMode);
    return () => mediaQuery.removeEventListener("change", updateLayoutMode);
  }, []);

  useEffect(() => {
    let viewport: HTMLElement | null = null;
    let bindFrameId: number | null = null;
    let animationFrameId: number | null = null;

    const updateScrollTop = () => {
      if (viewport) {
        const nextScrollTop = viewport.scrollTop;
        startTransition(() => {
          setArchiveScrollTop(nextScrollTop);
        });
      }
    };
    const scheduleUpdateScrollTop = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateScrollTop();
      });
    };

    const bindViewport = () => {
      const nextViewport = archiveScrollRef.current
        ?.osInstance()
        ?.elements().viewport;
      if (!(nextViewport instanceof HTMLElement)) {
        bindFrameId = window.requestAnimationFrame(bindViewport);
        return;
      }

      viewport = nextViewport;
      updateScrollTop();
      viewport.addEventListener("scroll", scheduleUpdateScrollTop, {
        passive: true,
      });
    };

    bindViewport();

    return () => {
      if (bindFrameId !== null) {
        window.cancelAnimationFrame(bindFrameId);
      }
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      viewport?.removeEventListener("scroll", scheduleUpdateScrollTop);
    };
  }, [isDesktop]);

  useEffect(() => {
    rowVirtualizer.measure();
  }, [archiveEntries.length, isDesktop, rowVirtualizer]);

  useEffect(() => {
    if (!isUrlFilterReady || isLoading || archiveEntries.length === 0) {
      return;
    }

    let frameId: number | null = null;
    const scheduleArchiveHashScroll = () => {
      if (isFilterInputFocusedRef.current) {
        return;
      }

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        scrollToCurrentArchiveHash();
      });
    };

    scheduleArchiveHashScroll();
    window.addEventListener("hashchange", scheduleArchiveHashScroll);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("hashchange", scheduleArchiveHashScroll);
    };
  }, [
    archiveEntries.length,
    isLoading,
    isUrlFilterReady,
    scrollToCurrentArchiveHash,
  ]);

  const handleTimestampExpandedChange = useCallback(
    (videoId: string, expanded: boolean) => {
      setExpandedTimestampVideoIds((currentVideoIds) => {
        const isAlreadyExpanded = currentVideoIds.has(videoId);
        if (isAlreadyExpanded === expanded) {
          return currentVideoIds;
        }

        const nextVideoIds = new Set(currentVideoIds);
        if (expanded) {
          nextVideoIds.add(videoId);
        } else {
          nextVideoIds.delete(videoId);
        }

        return nextVideoIds;
      });
    },
    [],
  );

  const handleActivityDateClick = useCallback((dateKey: string) => {
    startTransition(() => {
      setDateRange([dateKey, dateKey]);
    });
  }, []);

  const handleSortChange = useCallback((columnKey: ArchiveSortKey) => {
    startTransition(() => {
      setSortState((current) => {
        if (current.key === columnKey) {
          return {
            key: columnKey,
            direction: current.direction === "asc" ? "desc" : "asc",
          };
        }

        return {
          key: columnKey,
          direction: DESC_DEFAULT_SORT_KEYS.has(columnKey) ? "desc" : "asc",
        };
      });
    });
  }, []);

  const handleFilterQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilterQuery(event.currentTarget.value);
    },
    [],
  );

  const handleFilterQueryFocus = useCallback(() => {
    isFilterInputFocusedRef.current = true;
  }, []);

  const handleFilterQueryBlur = useCallback(() => {
    isFilterInputFocusedRef.current = false;
    if (!isUrlFilterReady) {
      return;
    }

    updateArchiveFilterUrl({
      query: filterQuery,
      seriesKey: selectedSeriesKey,
      dateRange,
    });
  }, [dateRange, filterQuery, isUrlFilterReady, selectedSeriesKey]);

  const handleSeriesKeyChange = useCallback((value: string | null) => {
    startTransition(() => {
      setSelectedSeriesKey(value);
    });
  }, []);

  const handleDateRangeChange = useCallback((value: DateRangeValue) => {
    startTransition(() => {
      setDateRange(value);
    });
  }, []);

  const handleClearDetailedFilters = useCallback(() => {
    startTransition(() => {
      setSelectedSeriesKey(null);
      setDateRange([null, null]);
    });
  }, []);

  useEffect(() => {
    if (!isUrlFilterReady) {
      return;
    }
    if (isFilterInputFocusedRef.current) {
      return;
    }

    updateArchiveFilterUrl({
      query: debouncedFilterQuery,
      seriesKey: selectedSeriesKey,
      dateRange,
    });
  }, [dateRange, debouncedFilterQuery, isUrlFilterReady, selectedSeriesKey]);

  useEffect(() => {
    const syncFiltersFromUrl = () => {
      const nextState = getArchiveFilterStateFromUrl();
      setFilterQuery(nextState.query);
      setSelectedSeriesKey(nextState.seriesKey);
      setDateRange(nextState.dateRange);
      setIsUrlFilterReady(true);
    };

    syncFiltersFromUrl();
    window.addEventListener("popstate", syncFiltersFromUrl);
    return () => window.removeEventListener("popstate", syncFiltersFromUrl);
  }, []);

  return (
    <div className={pageClasses.shellFlushBottom}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {t("homeLabel")}
        </Link>
        <Link href="/stream-archives" className={breadcrumbClasses.link}>
          {t("breadcrumb")}
        </Link>
      </Breadcrumbs>

      <div>
        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <p className={pageClasses.description}>{t("description")}</p>
      </div>

      <div className="mb-4 flex justify-end">
        <Button
          variant="light"
          color="green"
          leftSection={<HiChartBar />}
          onClick={() => setIsActivityVisible((current) => !current)}
        >
          {isActivityVisible ? t("activityHide") : t("activityShow")}
        </Button>
      </div>

      {!isLoading && isActivityVisible && (
        <ArchiveContributionHeatmap
          summary={archiveActivitySummary}
          selectedYear={selectedActivityYear}
          locale={locale}
          labels={{
            title: t("activityTitle"),
            totalDuration: (duration) =>
              t("activityTotalDuration", { duration }),
            yearLabel: t("activityYearLabel"),
            legendLess: t("activityLegendLess"),
            legendMore: t("activityLegendMore"),
            cellLabel: (date, duration, count) =>
              t("activityCellLabel", { date, duration, count }),
            emptyCellLabel: (date) => t("activityEmptyCellLabel", { date }),
            noData: t("activityNoData"),
          }}
          onSelectedYearChange={setSelectedActivityYear}
          onDateClick={handleActivityDateClick}
        />
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_minmax(260px,1fr)_minmax(260px,1fr)_auto]">
          <TextInput
            value={filterQuery}
            placeholder={t("searchPlaceholder")}
            leftSection={<HiSearch />}
            onChange={handleFilterQueryChange}
            onFocus={handleFilterQueryFocus}
            onBlur={handleFilterQueryBlur}
          />
          <Select
            data={seriesOptions}
            value={selectedSeriesKey}
            placeholder={t("seriesPlaceholder")}
            leftSection={<BiSolidVideos />}
            searchable
            clearable
            maxDropdownHeight={320}
            nothingFoundMessage={t("seriesNothingFound")}
            onChange={handleSeriesKeyChange}
          />
          <DatePickerInput
            type="range"
            value={dateRange}
            placeholder={t("dateRangePlaceholder")}
            leftSection={<HiCalendar />}
            clearable
            valueFormat="YYYY/MM/DD"
            onChange={handleDateRangeChange}
          />
          {hasDetailedFilters && (
            <Button
              variant="light"
              color="gray"
              leftSection={<HiX />}
              onClick={handleClearDetailedFilters}
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300 md:justify-end">
          <p>{t("resultCount", { count: displayCount, total: totalCount })}</p>
          <p>{t("seriesCount", { count: displayGroupCount })}</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: "pink", type: "bars" }}
        />
      ) : filteredItems.length === 0 ? (
        <p className="px-3 py-6 text-sm text-gray-600 dark:text-gray-300">
          {t("empty")}
        </p>
      ) : isDesktop ? (
        <div className="w-full max-w-full overflow-hidden rounded-xl border border-light-gray-200/50 bg-white/70 text-sm shadow-sm dark:border-white/10 dark:bg-gray-900/50">
          <OverlayScrollbarsComponent
            ref={archiveScrollRef}
            className="h-[calc(100dvh-280px)] md:h-[calc(100dvh-440px)] lg:h-[calc(100dvh-383px)]"
          >
            <div style={{ minWidth: DESKTOP_TABLE_MIN_WIDTH }}>
              <div
                className="sticky top-0 z-10 grid bg-light-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                style={{ gridTemplateColumns: DESKTOP_COLUMNS }}
              >
                <div className="px-3 py-2">{t("thumbnailLabel")}</div>
                <div className="px-3 py-2">
                  <SortableArchiveHeader
                    columnKey="stream_started_at"
                    sortState={sortState}
                    onSortChange={handleSortChange}
                  >
                    {t("publishedAtLabel")}
                  </SortableArchiveHeader>
                </div>
                <div className="px-3 py-2">
                  <SortableArchiveHeader
                    columnKey="video_duration"
                    sortState={sortState}
                    onSortChange={handleSortChange}
                  >
                    {t("videoDurationLabel")}
                  </SortableArchiveHeader>
                </div>
                <div className="px-3 py-2">
                  <SortableArchiveHeader
                    columnKey="topic"
                    sortState={sortState}
                    onSortChange={handleSortChange}
                  >
                    {t("topicLabel")}
                  </SortableArchiveHeader>
                </div>
                <div className="px-3 py-2">
                  <SortableArchiveHeader
                    columnKey="title"
                    sortState={sortState}
                    onSortChange={handleSortChange}
                  >
                    {t("titleLabel")}
                  </SortableArchiveHeader>
                </div>
                <div className="px-3 py-2">
                  <SortableArchiveHeader
                    columnKey="description"
                    sortState={sortState}
                    onSortChange={handleSortChange}
                  >
                    {t("descriptionLabel")}
                  </SortableArchiveHeader>
                </div>
                <div className="px-3 py-2">
                  <SortableArchiveHeader
                    columnKey="timestamp_comment"
                    sortState={sortState}
                    onSortChange={handleSortChange}
                  >
                    {t("timestampLabel")}{" "}
                    <Tooltip
                      withArrow
                      label={t("timestampTooltip")}
                      position="bottom"
                    >
                      <FaInfoCircle className="h-3 w-3 -mt-0.5 inline text-gray-300" />
                    </Tooltip>
                  </SortableArchiveHeader>
                </div>
              </div>
              {activeStickyArchiveItem && (
                <div className="pointer-events-none sticky top-8 z-9 h-0">
                  <div className="pointer-events-auto">
                    <DesktopStickyArchiveSummary
                      item={activeStickyArchiveItem}
                      locale={locale}
                      highlightQuery={deferredFilterQuery}
                    />
                  </div>
                </div>
              )}
              <div
                className="relative"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {virtualRows.map((virtualRow) => {
                  const entry = archiveEntries[virtualRow.index];
                  if (!entry) {
                    return null;
                  }

                  let rowElement: HTMLDivElement | null = null;
                  const measureRowElement = (
                    element: HTMLDivElement | null,
                  ) => {
                    rowElement = element;
                    if (element) {
                      rowVirtualizer.measureElement(element);
                    }
                  };
                  const scheduleRowMeasure = () => {
                    window.requestAnimationFrame(() => {
                      if (rowElement) {
                        rowVirtualizer.measureElement(rowElement);
                      }
                    });
                  };

                  return (
                    <div
                      key={entry.key}
                      ref={measureRowElement}
                      data-index={virtualRow.index}
                      className="absolute left-0 top-0 w-full"
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {entry.type === "group" ? (
                        <DesktopGroupHeader
                          group={entry.group}
                          locale={locale}
                          highlightQuery={deferredFilterQuery}
                          itemsCountLabel={t("itemsCount", {
                            count: entry.group.items.length,
                          })}
                        />
                      ) : (
                        <DesktopArchiveRow
                          item={entry.item}
                          locale={locale}
                          highlightQuery={deferredFilterQuery}
                          anchorLinkLabel={t("anchorLinkLabel")}
                          anchorCopiedLabel={t("anchorCopiedLabel")}
                          isAnchored={
                            activeArchiveAnchorVideoId === entry.item.video_id
                          }
                          isTimestampExpanded={expandedTimestampVideoIds.has(
                            entry.item.video_id,
                          )}
                          onTimestampResize={scheduleRowMeasure}
                          onTimestampExpandedChange={
                            handleTimestampExpandedChange
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </OverlayScrollbarsComponent>
        </div>
      ) : (
        <OverlayScrollbarsComponent
          ref={archiveScrollRef}
          className="h-[calc(100dvh-490px)] pr-1 md:h-[calc(100dvh-290px)]"
        >
          <div
            className="relative"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {virtualRows.map((virtualRow) => {
              const entry = archiveEntries[virtualRow.index];
              if (!entry) {
                return null;
              }

              let rowElement: HTMLDivElement | null = null;
              const measureRowElement = (element: HTMLDivElement | null) => {
                rowElement = element;
                if (element) {
                  rowVirtualizer.measureElement(element);
                }
              };
              const scheduleRowMeasure = () => {
                window.requestAnimationFrame(() => {
                  if (rowElement) {
                    rowVirtualizer.measureElement(rowElement);
                  }
                });
              };

              return (
                <div
                  key={entry.key}
                  ref={measureRowElement}
                  data-index={virtualRow.index}
                  className="absolute left-0 top-0 w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {entry.type === "group" ? (
                    <MobileGroupHeader
                      group={entry.group}
                      locale={locale}
                      highlightQuery={deferredFilterQuery}
                      itemsCountLabel={t("itemsCount", {
                        count: entry.group.items.length,
                      })}
                    />
                  ) : (
                    <MobileArchiveCard
                      item={entry.item}
                      locale={locale}
                      timestampLabel={t("timestampLabel")}
                      anchorLinkLabel={t("anchorLinkLabel")}
                      anchorCopiedLabel={t("anchorCopiedLabel")}
                      highlightQuery={deferredFilterQuery}
                      isAnchored={
                        activeArchiveAnchorVideoId === entry.item.video_id
                      }
                      onTimestampResize={scheduleRowMeasure}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </OverlayScrollbarsComponent>
      )}
    </div>
  );
}
