"use client";

import { Link, useRouter } from "../i18n/navigation";
import { Zen_Maru_Gothic } from "next/font/google";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Burger,
  Button,
  CopyButton,
  Skeleton,
  Text,
  Timeline,
  Tooltip,
} from "@mantine/core";
import {
  useDisclosure,
  useIntersection,
  useSessionStorage,
} from "@mantine/hooks";
import { useLocale, useTranslations } from "next-intl";
import YouTube, { type YouTubeEvent, type YouTubeProps } from "react-youtube";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import DrawerMenu from "./components/DrawerMenu";
import SearchInput from "./components/SearchInput";
import Footer from "./components/Footer";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ThemeToggle from "./components/ThemeToggle";
import YoutubeThumbnail from "./components/YoutubeThumbnail";
import { SONG_MODE_MENU_ITEMS } from "./components/songModeMenu";
import { baseUrl, siteConfig } from "./config/siteConfig";
import useAnniversaries from "./hook/useAnniversaries";
import useChannels from "./hook/useChannels";
import useEvents from "./hook/useEvents";
import useMilestones from "./hook/useMilestones";
import useActivityTimeline, {
  type ActivityTimelineItem,
} from "./hook/useActivityTimeline";
import useSongs from "./hook/useSongs";
import { useStatistics } from "./hook/useStatistics";
import useStatViewCounts from "./hook/useStatViewCounts";
import { isCoverSong, isOriginalSong } from "./config/filters";
import SongCountOverview from "./statistics/SongCountOverview";
import { buildWatchHref } from "./lib/watchUrl";
import { formatDate } from "./lib/formatDate";
import { showAppNotification } from "./lib/notifications";
import { isAzkiBirthday } from "./lib/birthday";
import {
  buildMilestoneSearchHref,
  computeNextIsoForAnniversary,
  getFeaturedEvents,
  formatAnniversaryName,
  getDaysUntil,
  getFeaturedAnniversaries,
  getTodayTimelineMilestones,
  isEventActive,
  isAnniversaryToday,
  parseToJstDayStart,
} from "./lib/highlights";
import { buildViewMilestoneInfo } from "./lib/viewMilestone";
import {
  LuArrowRight,
  LuSearch,
  LuSparkles,
  LuCopy,
  LuCopyCheck,
  LuMusic,
  LuTrophy,
  LuVideo,
  LuVolumeX,
} from "react-icons/lu";
import { IoInformationSharp } from "react-icons/io5";
import { FaExternalLinkAlt } from "react-icons/fa";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { BsGeoAlt } from "react-icons/bs";
import type { Song } from "./types/song";
import type { StatisticsItem } from "./types/statisticsItem";
import type { ChannelEntry } from "./types/api/yt/channels";

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  display: "swap",
  weight: "700",
  preload: true,
  adjustFontFallback: false,
});

const RECOMMENDED_SONG_COUNT = 20;
const RECOMMENDED_SKELETON_COUNT = 20;
const ACTIVITY_TIMELINE_PAGE_SIZE = 20;

// 背景動画の選出において、最近の楽曲を優先するための期間（日数）と重みつけ
const HERO_BACKGROUND_RECENT_DAYS = 30;
const HERO_BACKGROUND_RECENT_WEIGHT = 10;
const ONGOING_EVENT_ALERT_DISMISSED_SESSION_KEY =
  "ongoing-event-alert-dismissed-id";
const ORIGINAL_SONG_MODE_ITEM =
  SONG_MODE_MENU_ITEMS.find((item) => item.mode === "original-songs") ??
  SONG_MODE_MENU_ITEMS[0];
const COVER_SONG_MODE_ITEM =
  SONG_MODE_MENU_ITEMS.find((item) => item.mode === "cover-songs") ??
  SONG_MODE_MENU_ITEMS[0];
const COLLABORATION_SONG_MODE_ITEM =
  SONG_MODE_MENU_ITEMS.find((item) => item.mode === "collaboration-songs") ??
  SONG_MODE_MENU_ITEMS[0];
const KARAOKE_SONG_MODE_ITEM =
  SONG_MODE_MENU_ITEMS.find((item) => item.mode === "tag:歌枠") ??
  SONG_MODE_MENU_ITEMS[0];
const BIRTHDAY_BALLOONS = [
  { x: "8%", delay: "0s", duration: "13s", color: "#f472b6", size: "2.9rem" },
  {
    x: "18%",
    delay: "-5s",
    duration: "15s",
    color: "#38bdf8",
    size: "2.4rem",
  },
  {
    x: "29%",
    delay: "-9s",
    duration: "14s",
    color: "#facc15",
    size: "2.7rem",
  },
  {
    x: "42%",
    delay: "-2s",
    duration: "16s",
    color: "#a78bfa",
    size: "2.2rem",
  },
  {
    x: "55%",
    delay: "-7s",
    duration: "13.5s",
    color: "#34d399",
    size: "2.8rem",
  },
  {
    x: "68%",
    delay: "-3.5s",
    duration: "15.5s",
    color: "#fb7185",
    size: "2.5rem",
  },
  {
    x: "80%",
    delay: "-10s",
    duration: "14.5s",
    color: "#60a5fa",
    size: "2.6rem",
  },
  {
    x: "91%",
    delay: "-6s",
    duration: "16.5s",
    color: "#f97316",
    size: "2.3rem",
  },
] as const;

const activityTimelineColors: Record<ActivityTimelineItem["kind"], string> = {
  song_update: "pink",
  archive: "cyan",
  view_milestone: "yellow",
  milestone: "violet",
  event: "blue",
};

type BuildInfo = {
  buildDate?: string;
  version?: string;
};

function pickRecommendedSongs<T>(items: Song[], count: number) {
  if (items.length <= count) {
    return items;
  }

  // 本人歌唱動画に限定する
  items = items.filter((item) => item.sing.includes(siteConfig.talentName));

  const pool = [...items];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, count);
}

function pickHeroBackgroundSong(items: Song[]) {
  const candidates = items.filter(
    // オリジナル楽曲のMVのみ
    (song) =>
      song.video_id &&
      song.tags.some((tag) => tag.includes("MV")) &&
      isOriginalSong(song),
  );

  if (candidates.length === 0) {
    return null;
  }

  const recentThreshold =
    Date.now() - HERO_BACKGROUND_RECENT_DAYS * 24 * 60 * 60 * 1000;
  const weightedCandidates = candidates.map((song) => {
    const broadcastTime = new Date(song.broadcast_at).getTime();
    const isRecent =
      Number.isFinite(broadcastTime) && broadcastTime >= recentThreshold;

    return {
      song,
      weight: isRecent ? HERO_BACKGROUND_RECENT_WEIGHT : 1,
    };
  });
  const totalWeight = weightedCandidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );
  let randomWeight = Math.random() * totalWeight;

  for (const candidate of weightedCandidates) {
    randomWeight -= candidate.weight;
    if (randomWeight < 0) {
      return candidate.song;
    }
  }

  return weightedCandidates.at(-1)?.song ?? null;
}

function buildHeroBackgroundVideoUrl(song: Song) {
  const fallbackUrl = `https://www.youtube.com/watch?v=${song.video_id}`;
  const baseVideoUrl = song.video_uri || fallbackUrl;

  if (Number(song.start) <= 0) {
    return baseVideoUrl;
  }

  const separator = baseVideoUrl.includes("?") ? "&" : "?";
  return `${baseVideoUrl}${separator}`;
}

function getSingerNamesFromSong(song: Song) {
  const localizedSings = song.hl?.ja?.sings ?? [];
  if (localizedSings.length > 0) {
    return localizedSings.map((name) => name.trim()).filter(Boolean);
  }

  if (song.sings.length > 0) {
    return song.sings.map((name) => name.trim()).filter(Boolean);
  }

  return song.sing
    .split(/[、,]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function buildChannelUrl(entry: ChannelEntry) {
  if (entry.youtubeId) {
    return `https://www.youtube.com/channel/${entry.youtubeId}`;
  }

  const handle = (entry.handle ?? "").trim();
  if (!handle) {
    return null;
  }

  return `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`;
}

// video_id基準で楽曲をグループ化し、直近3件を取得
function groupRecentUpdates(items: Song[], limit: number = 3) {
  // broadcast_at と video_id が存在する楽曲のみを対象
  const validItems = items.filter((item) => item.broadcast_at && item.video_id);

  // video_id でグループ化
  const grouped = new Map<string, Song[]>();
  validItems.forEach((song) => {
    if (!grouped.has(song.video_id)) {
      grouped.set(song.video_id, []);
    }
    grouped.get(song.video_id)!.push(song);
  });

  // 各グループの最新配信日でソート（新しい順）して、直近 limit 件を取得
  const sorted = Array.from(grouped.entries())
    .map(([videoId, songs]) => {
      // グループ内で最新の配信日を取得
      const latestDate = new Date(
        Math.max(...songs.map((s) => new Date(s.broadcast_at).getTime())),
      );
      // グループ内の最初の曲のタイトルを使用
      const videoTitle = songs[0].video_title;
      return {
        videoId,
        videoTitle,
        songs,
        count: songs.length,
        latestDate,
      };
    })
    .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())
    .slice(0, limit)
    .map(({ videoId, videoTitle, songs, count, latestDate }) => ({
      // ISO文字列で渡して、表示側でロケールに応じて整形する
      date: latestDate.toISOString(),
      videoId,
      videoTitle,
      songs,
      count,
    }));

  return sorted;
}

function formatActivityMilestoneCount(value: number, locale: string) {
  if (locale.startsWith("ja") && value >= 10000) {
    return `${Math.floor(value / 10000)}万`;
  }

  return new Intl.NumberFormat(locale, {
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function getActivityItemLabel(
  item: ActivityTimelineItem,
  t: ReturnType<typeof useTranslations>,
  locale: string,
) {
  if (item.kind === "song_update") {
    return {
      badge: t("activitySongUpdateBadge"),
      title: item.videoTitle,
      description: t("activitySongUpdateDescription", { count: item.count }),
    };
  }

  if (item.kind === "archive") {
    return {
      badge: t("activityArchiveBadge"),
      title: t("activityArchiveTitle"),
      description: item.archive.title,
    };
  }

  if (item.kind === "milestone") {
    return {
      badge: t("activityMilestoneBadge"),
      title: item.milestone.content,
      description: item.milestone.note || "",
    };
  }

  if (item.kind === "event") {
    return {
      badge: t("activityEventBadge"),
      title: item.event.content,
      description: item.event.place || "",
    };
  }

  return {
    badge: t("activityViewMilestoneBadge"),
    title: t("activityViewMilestoneTitle", {
      title: item.song.title,
      count: formatActivityMilestoneCount(item.targetCount, locale),
    }),
    description: item.song.video_title || item.song.title,
  };
}

function getActivityItemBullet(kind: ActivityTimelineItem["kind"]) {
  if (kind === "song_update") {
    return <LuMusic size={14} />;
  }

  if (kind === "archive") {
    return <LuVideo size={14} />;
  }

  if (kind === "milestone") {
    return <LuSparkles size={14} />;
  }

  if (kind === "event") {
    return <BsGeoAlt size={14} />;
  }

  return <LuTrophy size={14} />;
}

function getActivityItemClasses(kind: ActivityTimelineItem["kind"]) {
  if (kind === "view_milestone") {
    return {
      item: "rounded-lg border border-yellow-300/50 bg-yellow-50/80 p-3 shadow-[0_12px_34px_rgba(202,138,4,0.16)] dark:border-yellow-300/25 dark:bg-yellow-300/10",
      title:
        "min-w-0 text-base font-bold leading-7 text-gray-950 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "w-32 sm:w-36",
      description: "font-medium text-gray-700 dark:text-gray-200",
    };
  }

  if (kind === "song_update") {
    return {
      item: "rounded-lg border border-primary/20 bg-primary/5 p-3 shadow-[0_8px_24px_rgba(190,24,93,0.1)] dark:border-pink-300/20 dark:bg-pink-300/10",
      title:
        "min-w-0 text-sm font-semibold leading-6 text-gray-900 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "w-28 sm:w-32",
      description: "text-gray-600 dark:text-gray-300",
    };
  }

  if (kind === "milestone" || kind === "event") {
    return {
      item: "py-1",
      title:
        "min-w-0 text-sm font-semibold leading-6 text-gray-800 transition hover:text-primary dark:text-white dark:hover:text-pink-200",
      thumbnail: "",
      description: "text-xs text-gray-600 dark:text-gray-300",
    };
  }

  return {
    item: "py-1",
    title:
      "min-w-0 text-xs font-medium leading-5 text-gray-700 transition hover:text-primary dark:text-gray-200 dark:hover:text-pink-200",
    thumbnail: "w-16 opacity-80 sm:w-20",
    description: "text-xs text-gray-500 dark:text-gray-400",
  };
}

function getActivityTitleHref(item: ActivityTimelineItem) {
  if (item.kind === "song_update") {
    return item.youtubeHref ?? item.href;
  }

  return item.titleHref ?? item.href;
}

function getActivityDescriptionHref(item: ActivityTimelineItem) {
  if (item.kind === "archive" || item.kind === "view_milestone") {
    return item.youtubeHref;
  }

  return undefined;
}

function isExternalHref(href: string | undefined) {
  return href?.startsWith("http://") || href?.startsWith("https://");
}

function handleArchiveActivityLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string | undefined,
) {
  if (!href || typeof window === "undefined") {
    return;
  }

  event.preventDefault();
  const targetUrl = new URL(href, window.location.origin);
  window.location.assign(
    `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
  );
}

export default function ClientTop() {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { allSongs, songsFetchedAt, isLoading } = useSongs();
  const { channels: channelsRegistry } = useChannels();
  const { items: anniversaryItems, isLoading: isAnniversariesLoading } =
    useAnniversaries();
  const { items: eventItems, isLoading: isEventsLoading } = useEvents();
  const [dismissedOngoingEventAlertId, setDismissedOngoingEventAlertId] =
    useSessionStorage<string | null>({
      key: ONGOING_EVENT_ALERT_DISMISSED_SESSION_KEY,
      defaultValue: null,
      getInitialValueInEffect: false,
    });
  const { items: externalMilestones, isLoading: isMilestonesLoading } =
    useMilestones();
  const { ref: viewMilestonesRef, entry: viewMilestonesEntry } =
    useIntersection<HTMLElement>({
      rootMargin: "320px 0px",
      threshold: 0,
    });
  const { ref: activityTimelineRef, entry: activityTimelineEntry } =
    useIntersection<HTMLElement>({
      rootMargin: "420px 0px",
      threshold: 0,
    });
  const t = useTranslations("Home");
  const tStatistics = useTranslations("Statistics");
  const tHeader = useTranslations("Header");
  const tDrawer = useTranslations("DrawerMenu");
  const tAnniversaries = useTranslations("Anniversaries");
  const tSummary = useTranslations("Summary");
  const [searchValue, setSearchValue] = useState<string[]>([]);
  const [shouldLoadViewStatistics, setShouldLoadViewStatistics] =
    useState(false);
  const [
    shouldLoadActivityViewStatistics,
    setShouldLoadActivityViewStatistics,
  ] = useState(false);
  const [activityTimelineVisibleCount, setActivityTimelineVisibleCount] =
    useState(ACTIVITY_TIMELINE_PAGE_SIZE);
  const [isHeroBackgroundUnavailable, setHeroBackgroundUnavailable] =
    useState(false);
  const [showBirthdayHero, setShowBirthdayHero] = useState(false);
  const ongoingEventNotificationIdRef = useRef<string | null>(null);
  const [buildDate, setBuildDate] = useState("N/A");
  const [appVersion, setAppVersion] = useState("N/A");

  useEffect(() => {
    const updateHeaderState = () => {
      setIsScrolled(window.scrollY > 12);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
    };
  }, []);

  useEffect(() => {
    if (viewMilestonesEntry?.isIntersecting) {
      setShouldLoadViewStatistics(true);
    }
  }, [viewMilestonesEntry?.isIntersecting]);

  useEffect(() => {
    if (activityTimelineEntry?.isIntersecting) {
      setShouldLoadActivityViewStatistics(true);
    }
  }, [activityTimelineEntry?.isIntersecting]);

  useEffect(() => {
    setShowBirthdayHero(isAzkiBirthday());
  }, []);

  useEffect(() => {
    fetch("/build-info.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch build info: ${response.status}`);
        }
        return response.text().then((text) => {
          try {
            return JSON.parse(text);
          } catch {
            return {};
          }
        });
      })
      .then((data: BuildInfo) => {
        setBuildDate(data.buildDate ?? "N/A");
        setAppVersion(data.version ?? "N/A");
      })
      .catch((error) => {
        console.warn("Failed to fetch build info:", error);
        if (process.env.NODE_ENV === "development") {
          setBuildDate(new Date().toISOString());
          setAppVersion("dev");
        }
      });
  }, []);

  const recommendedSongs = useMemo(
    () => pickRecommendedSongs(allSongs, RECOMMENDED_SONG_COUNT),
    [allSongs],
  );

  const recentUpdates = useMemo(
    () => groupRecentUpdates(allSongs, 3),
    [allSongs],
  );

  const channelsBySingerName = useMemo(() => {
    const map = new Map<string, ChannelEntry>();

    channelsRegistry.forEach((entry) => {
      const artistName = (entry.artistName ?? "").trim();
      if (artistName && !map.has(artistName)) {
        map.set(artistName, entry);
      }

      const channelName = (entry.channelName ?? "").trim();
      if (channelName && !map.has(channelName)) {
        map.set(channelName, entry);
      }
    });

    return map;
  }, [channelsRegistry]);

  const singerAvatarsByVideoId = useMemo(() => {
    const avatarsByVideoId = new Map<
      string,
      Array<{ name: string; iconUrl: string; channelUrl: string | null }>
    >();

    recentUpdates.forEach((update) => {
      const avatars: Array<{
        name: string;
        iconUrl: string;
        channelUrl: string | null;
      }> = [];
      const seenChannels = new Set<string>();

      update.songs.forEach((song) => {
        getSingerNamesFromSong(song).forEach((singerName) => {
          const entry = channelsBySingerName.get(singerName);
          const iconUrl = (entry?.iconUrl ?? "").trim();
          if (!iconUrl) {
            return;
          }

          const channelUrl = entry ? buildChannelUrl(entry) : null;
          const channelKey =
            (entry?.youtubeId ?? "").trim() ||
            channelUrl ||
            (entry?.channelName ?? "").trim() ||
            iconUrl;

          if (seenChannels.has(channelKey)) {
            return;
          }

          avatars.push({
            name: entry?.channelName || entry?.artistName || singerName,
            iconUrl,
            channelUrl,
          });
          seenChannels.add(channelKey);
        });
      });

      avatarsByVideoId.set(update.videoId, avatars);
    });

    return avatarsByVideoId;
  }, [recentUpdates, channelsBySingerName]);

  const getActivitySingerAvatars = (item: ActivityTimelineItem) => {
    const activitySongs =
      item.kind === "song_update"
        ? item.songs
        : item.kind === "view_milestone"
          ? [item.song]
          : [];

    if (activitySongs.length === 0) {
      return [];
    }

    const avatars: Array<{
      name: string;
      iconUrl: string;
      channelUrl: string | null;
    }> = [];
    const seenChannels = new Set<string>();

    activitySongs.forEach((song) => {
      getSingerNamesFromSong(song).forEach((singerName) => {
        const entry = channelsBySingerName.get(singerName);
        const iconUrl = (entry?.iconUrl ?? "").trim();
        if (!iconUrl) {
          return;
        }

        const channelUrl = entry ? buildChannelUrl(entry) : null;
        const channelKey =
          (entry?.youtubeId ?? "").trim() ||
          channelUrl ||
          (entry?.channelName ?? "").trim() ||
          iconUrl;

        if (seenChannels.has(channelKey)) {
          return;
        }

        avatars.push({
          name: entry?.channelName || entry?.artistName || singerName,
          iconUrl,
          channelUrl,
        });
        seenChannels.add(channelKey);
      });
    });

    return avatars;
  };

  const heroBackgroundSong = useMemo(
    () => pickHeroBackgroundSong(allSongs),
    [allSongs],
  );

  const heroBackgroundVideoUrl = useMemo(
    () =>
      heroBackgroundSong
        ? buildHeroBackgroundVideoUrl(heroBackgroundSong)
        : null,
    [heroBackgroundSong],
  );

  const heroBackgroundWatchHref = useMemo(
    () =>
      heroBackgroundSong
        ? buildWatchHref({ videoId: heroBackgroundSong.video_id })
        : null,
    [heroBackgroundSong],
  );

  const heroBackgroundOptions = useMemo<YouTubeProps["opts"]>(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 1,
        playlist: heroBackgroundSong?.video_id,
        playsinline: 1,
        rel: 0,
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    }),
    [heroBackgroundSong?.video_id],
  );

  useEffect(() => {
    setHeroBackgroundUnavailable(false);
  }, [heroBackgroundSong?.video_id]);

  const featuredAnniversaries = useMemo(
    () => getFeaturedAnniversaries(anniversaryItems),
    [anniversaryItems],
  );

  const featuredEvents = useMemo(
    () => getFeaturedEvents(eventItems, 3),
    [eventItems],
  );

  const ongoingEvents = useMemo(
    () => eventItems.filter((item) => isEventActive(item)),
    [eventItems],
  );

  const todayMilestones = useMemo(
    () => getTodayTimelineMilestones(allSongs, externalMilestones),
    [allSongs, externalMilestones],
  );

  const statistics = useStatistics({
    songs: allSongs,
  });

  const viewLabelVideoIds = useMemo(
    () =>
      [
        ...statistics.originalSongCountsByReleaseDate,
        ...statistics.coverSongCountsByReleaseDate,
      ]
        .map(
          (item) =>
            item.song?.video_id ||
            item.firstVideo?.video_id ||
            item.lastVideo?.video_id,
        )
        .filter(Boolean),
    [
      statistics.originalSongCountsByReleaseDate,
      statistics.coverSongCountsByReleaseDate,
    ],
  );

  const { data: viewStatisticsByVideoId, loading: isViewStatisticsLoading } =
    useStatViewCounts(viewLabelVideoIds, "7d", shouldLoadViewStatistics);

  const milestoneStatistics = useMemo(() => {
    const attachMilestone = (items: StatisticsItem[]) =>
      items.map((item) => {
        const statVideoId =
          item.song?.video_id ||
          item.firstVideo?.video_id ||
          item.lastVideo?.video_id ||
          "";
        const history = viewStatisticsByVideoId[statVideoId] || [];
        const latestHistoryViewCount =
          history[history.length - 1]?.viewCount ?? 0;
        const songViewCount = Number(item.song?.view_count ?? 0);
        const effectiveViewCount =
          songViewCount > 0 ? songViewCount : latestHistoryViewCount;

        return {
          ...item,
          statVideoId,
          effectiveViewCount,
          viewMilestone: buildViewMilestoneInfo(effectiveViewCount, history),
        };
      });

    return {
      originalSongCountsByReleaseDate: attachMilestone(
        statistics.originalSongCountsByReleaseDate,
      ),
      coverSongCountsByReleaseDate: attachMilestone(
        statistics.coverSongCountsByReleaseDate,
      ),
    };
  }, [statistics, viewStatisticsByVideoId]);

  const {
    items: activityTimelineItems,
    isLoading: isActivityTimelineLoading,
    isViewMilestonesLoading: isActivityViewMilestonesLoading,
  } = useActivityTimeline({
    songs: allSongs,
    events: eventItems,
    milestones: externalMilestones,
    isSongsLoading: isLoading,
    isEventsLoading,
    isMilestonesLoading,
    limit: 160,
    songUpdateLimit: 80,
    archiveLimit: 80,
    enabled: shouldLoadActivityViewStatistics,
  });

  const visibleActivityTimelineItems = useMemo(
    () => activityTimelineItems.slice(0, activityTimelineVisibleCount),
    [activityTimelineItems, activityTimelineVisibleCount],
  );
  const hasMoreActivityTimelineItems =
    activityTimelineItems.length > visibleActivityTimelineItems.length;

  const hasFeaturedAnniversaryToday = useMemo(() => {
    if (featuredAnniversaries.length === 0) {
      return false;
    }

    return isAnniversaryToday(featuredAnniversaries[0]);
  }, [featuredAnniversaries]);

  const songsUpdatedLabel = useMemo(() => {
    if (!songsFetchedAt) {
      return null;
    }

    const date = new Date(songsFetchedAt);
    if (Number.isNaN(date.getTime())) {
      return songsFetchedAt;
    }

    return formatDate(date, locale);
  }, [songsFetchedAt]);

  const buildDateLabel = useMemo(() => {
    if (!buildDate || buildDate === "N/A") {
      return null;
    }

    const date = new Date(buildDate);
    if (Number.isNaN(date.getTime())) {
      return buildDate;
    }

    return formatDate(date, locale);
  }, [buildDate, locale]);

  const copyrightYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return currentYear <= 2025 ? "2025" : `2025-${currentYear}`;
  }, []);

  const originalSongsShareUrl = useMemo(
    () => new URL("/watch?q=original-songs", baseUrl).toString(),
    [],
  );

  const coverSongsShareUrl = useMemo(
    () => new URL("/watch?q=cover-songs", baseUrl).toString(),
    [],
  );

  const collaborationSongsShareUrl = useMemo(
    () => new URL("/watch?q=collaboration-songs", baseUrl).toString(),
    [],
  );

  const karaokeSongsShareUrl = useMemo(
    () => new URL("/watch?q=tag:%E6%AD%8C%E6%9E%A0", baseUrl).toString(),
    [],
  );

  const handleSearch = () => {
    const query = searchValue.join("|").trim();
    startTransition(() => {
      router.push(query ? `/search?q=${encodeURIComponent(query)}` : `/search`);
    });
  };

  const formatEventRange = (startAt: string, endAt: string) => {
    const startLabel = formatDate(startAt, locale);
    if (!endAt) {
      return startLabel;
    }

    const startDate = parseToJstDayStart(startAt);
    const endDate = parseToJstDayStart(endAt);
    if (!startDate || !endDate) {
      return startLabel;
    }

    if (startDate.getTime() === endDate.getTime()) {
      return startLabel;
    }

    const separator = locale === "ja" ? "〜" : " - ";
    return `${startLabel}${separator}${formatDate(endAt, locale)}`;
  };

  const showCopiedNotification = (
    type: "original" | "cover" | "collaboration" | "karaoke",
  ) => {
    const message =
      type === "cover"
        ? t("coverSongsLinkCopied")
        : type === "collaboration"
          ? t("collaborationSongsLinkCopied")
          : type === "karaoke"
            ? t("karaokeSongsLinkCopied")
            : t("originalSongsLinkCopied");

    showAppNotification({
      title: t("copied"),
      message,
      type: "success",
      autoClose: 5000,
    });
  };

  useEffect(() => {
    if (ongoingEvents.length === 0) {
      return;
    }

    const event = ongoingEvents[0];
    const notificationId = `ongoing-event-${event.content}`;
    if (dismissedOngoingEventAlertId === notificationId) {
      return;
    }

    if (ongoingEventNotificationIdRef.current === notificationId) {
      return;
    }
    ongoingEventNotificationIdRef.current = notificationId;

    showAppNotification({
      id: notificationId,
      title: t("eventOngoingTitle", {
        title: event.content,
      }),
      message: event.note ? (
        <div className="space-y-2">
          <Text size="sm" c="dimmed">
            {event.note}

            {event.url ? (
              <Link
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm ml-1 font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
              >
                <FaExternalLinkAlt className="text-[0.75rem]" />
                {t("linkLabel")}
              </Link>
            ) : null}
          </Text>
        </div>
      ) : (
        event.content
      ),
      type: "warning",
      icon: <IoInformationSharp />,
      autoClose: false,
      onClose: () => {
        setDismissedOngoingEventAlertId(notificationId);
        ongoingEventNotificationIdRef.current = null;
      },
    });
  }, [
    dismissedOngoingEventAlertId,
    ongoingEvents,
    setDismissedOngoingEventAlertId,
    t,
  ]);

  const handleHeroBackgroundReady = (event: YouTubeEvent) => {
    try {
      event.target.mute();
      event.target.playVideo();
    } catch {
      setHeroBackgroundUnavailable(true);
    }
  };

  const handleHeroBackgroundError = () => {
    setHeroBackgroundUnavailable(true);
  };

  return (
    <div className="min-h-dvh overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_38%),linear-gradient(180deg,#fffafc_0%,#fdf2f8_100%)] text-gray-900 dark:bg-[radial-gradient(circle_at_top,rgba(190,24,93,0.2),transparent_34%),linear-gradient(180deg,#111827_0%,#0f172a_100%)] dark:text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-24 pt-0 sm:px-6 lg:px-8">
        <header
          className={`sticky top-0 z-40 -mx-4 isolate px-4 py-4 transition-colors duration-200 before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:transition-colors before:duration-200 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${
            isScrolled
              ? "before:bg-white/80 before:backdrop-blur dark:before:bg-gray-900/70"
              : "border-transparent before:bg-transparent"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Burger
                opened={drawerOpened}
                onClick={toggleDrawer}
                aria-label="Toggle navigation"
              />
              <Link
                href={`/`}
                className="inline-block truncate text-base font-semibold tracking-[0.12em] text-primary dark:text-pink-200 sm:text-lg sm:tracking-[0.24em]"
              >
                {siteConfig.siteNameUpper}
              </Link>
            </div>

            <div className={`flex shrink-0 items-center justify-end sm:gap-2`}>
              <nav className="hidden items-center gap-5 text-sm text-gray-600 dark:text-gray-100 sm:flex">
                <Link href={`/search`} className="hover:text-primary-500">
                  <LuSearch className="mr-1 -mt-0.5 inline" />
                  {tDrawer("search")}
                </Link>
                <Link href={`/discography`} className="hover:text-primary-500">
                  {tDrawer("discography")}
                </Link>
                <Link href={`/summary`} className="hover:text-primary-500">
                  {tDrawer("activity")}
                </Link>
                <Link
                  href={`/anniversaries`}
                  className="hover:text-primary-500"
                >
                  {tDrawer("anniversaries")}
                </Link>
                <Link href={`/statistics`} className="hover:text-primary-500">
                  {tDrawer("statistics")}
                </Link>
              </nav>
              <LanguageSwitcher variant="light" />
              <ThemeToggle className="hover:text-primary-500 dark:hover:text-white dark:hover:bg-primary-800" />
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="relative left-1/2 isolate flex min-h-[48dvh] w-screen -translate-x-1/2 flex-col items-center justify-center overflow-hidden py-10 text-center sm:py-16">
            {heroBackgroundSong && !isHeroBackgroundUnavailable ? (
              <div
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 0%, black 50%, rgba(0, 0, 0, 0.62) 64%, rgba(0, 0, 0, 0.18) 76%, transparent 88%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, black 0%, black 50%, rgba(0, 0, 0, 0.62) 64%, rgba(0, 0, 0, 0.18) 76%, transparent 88%, transparent 100%)",
                }}
                aria-hidden="true"
              >
                <YouTube
                  videoId={heroBackgroundSong.video_id}
                  opts={heroBackgroundOptions}
                  className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-full min-w-[177.78dvh] -translate-x-1/2 -translate-y-1/2"
                  iframeClassName="h-full w-full"
                  title=""
                  onReady={handleHeroBackgroundReady}
                  onError={handleHeroBackgroundError}
                />
              </div>
            ) : null}
            <div
              className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.42)_42%,rgba(253,242,248,0.9)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.42),rgba(15,23,42,0.72)_50%,rgba(15,23,42,0.94)_100%)]"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 68%, rgba(0, 0, 0, 0.5) 80%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 68%, rgba(0, 0, 0, 0.5) 80%, transparent 100%)",
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-56 bg-linear-to-b from-transparent via-[#fffafc]/70 to-transparent dark:via-[#111827]/70 sm:h-72" />
            {showBirthdayHero ? (
              <div
                className="birthday-balloons pointer-events-none absolute inset-0 z-[2] overflow-hidden"
                aria-hidden="true"
              >
                {BIRTHDAY_BALLOONS.map((balloon, index) => (
                  <span
                    key={`${balloon.x}-${index}`}
                    className="birthday-balloon"
                    style={
                      {
                        "--balloon-x": balloon.x,
                        "--balloon-delay": balloon.delay,
                        "--balloon-duration": balloon.duration,
                        "--balloon-color": balloon.color,
                        "--balloon-size": balloon.size,
                      } as CSSProperties
                    }
                  >
                    <span className="birthday-balloon__shine" />
                  </span>
                ))}
              </div>
            ) : null}
            {heroBackgroundSong &&
            heroBackgroundVideoUrl &&
            heroBackgroundWatchHref ? (
              <div className="absolute right-3 top-1 z-20 flex max-w-[calc(100vw-2rem)] items-center gap-1.5 sm:right-6 sm:top-5">
                <Link
                  href={heroBackgroundVideoUrl}
                  target="_blank"
                  className="inline-flex min-w-0 text-nowrap items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold text-gray-800 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:border-gray/40 hover:bg-white dark:border-white/10 dark:bg-gray-900/70 dark:text-white dark:shadow-black/20 dark:hover:border-pink-200/30 dark:hover:bg-gray-900/85 sm:px-3 sm:py-1.5 sm:text-xs"
                  title={heroBackgroundSong.video_title}
                >
                  <Text
                    size="sm"
                    c="red"
                    className="mt-0.5 mr-1 shrink-0 dark:text-white!"
                  >
                    <FaYoutube />
                  </Text>
                  <Text size="xs" fw={500} truncate="end">
                    {heroBackgroundSong.title}
                  </Text>
                  <Text
                    c="dimmed"
                    size="xs"
                    className="ml-1 hidden sm:inline"
                    component="span"
                  >
                    {heroBackgroundSong.broadcast_at
                      ? formatDate(heroBackgroundSong.broadcast_at, locale)
                      : null}
                  </Text>
                </Link>
                <Link
                  href={heroBackgroundWatchHref}
                  aria-label={t("heroWatchFromBeginning")}
                  title={t("heroWatchFromBeginning")}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-gray-800 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:border-gray/40 hover:bg-white dark:border-white/10 dark:bg-gray-900/70 dark:text-white dark:shadow-black/20 dark:hover:border-pink-200/30 dark:hover:bg-gray-900/85 sm:size-8"
                >
                  <LuVolumeX className="text-sm sm:text-base" />
                </Link>
              </div>
            ) : null}
            <div className="relative z-10 flex w-full flex-col items-center px-4 sm:px-6 lg:px-8 select-none">
              <div className="relative flex max-w-5xl flex-col items-center px-2 py-2 before:pointer-events-none before:absolute before:-inset-x-5 before:-inset-y-3 before:-z-10 before:rounded-4xl before:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.78),rgba(255,255,255,0.42)_58%,transparent_78%)] before:blur-xl dark:before:bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.58),rgba(15,23,42,0.3)_58%,transparent_78%)] sm:before:-inset-x-10 sm:before:-inset-y-5">
                <p className="mb-3 text-xs font-semibold tracking-[0.35em] text-primary/65 drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] dark:text-pink-200/75 dark:drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)]">
                  {t("brand")}
                </p>
                <h1
                  className={`${zenMaruGothic.className} max-w-4xl text-balance text-4xl font-bold italic leading-tight text-light-gray-750/85 drop-shadow-[0_2px_18px_rgba(255,255,255,0.75)] dark:text-white/90 dark:drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-6xl`}
                  style={{ fontStyle: "italic" }}
                >
                  {t("heroLine1")}
                  <br />
                  <span className="hidden md:inline">{t("heroLine2")}</span>
                  <span className="inline md:hidden">
                    {t("heroLine2_short")}
                  </span>
                </h1>
                {showBirthdayHero ? (
                  <div
                    className="relative mt-4 inline-flex max-w-[min(100%,36rem)] items-center justify-center overflow-hidden rounded-full border border-pink-200/70 bg-white/78 px-4 py-2 text-sm font-bold text-primary shadow-[0_14px_40px_rgba(190,24,93,0.18)] backdrop-blur dark:border-pink-200/20 dark:bg-gray-900/72 dark:text-pink-100 sm:px-5 sm:text-base"
                    role="status"
                    aria-label={t("birthdayAriaLabel")}
                  >
                    <span
                      className="pointer-events-none absolute left-4 top-1 size-1.5 rounded-full bg-pink-300/80 motion-safe:animate-ping dark:bg-pink-200/70"
                      aria-hidden="true"
                    />
                    <span
                      className="pointer-events-none absolute right-6 bottom-1.5 size-1 rounded-full bg-primary/70 motion-safe:animate-pulse dark:bg-pink-100/80"
                      aria-hidden="true"
                    />
                    <LuSparkles
                      className="mr-2 shrink-0 text-base text-primary/80 dark:text-pink-200"
                      aria-hidden="true"
                    />
                    <span className="text-balance">{t("birthdayMessage")}</span>
                  </div>
                ) : null}
                <p className="mt-4 max-w-2xl text-sm font-medium text-gray-800/80 drop-shadow-[0_1px_12px_rgba(255,255,255,0.85)] dark:text-gray-100/80 dark:drop-shadow-[0_1px_12px_rgba(0,0,0,0.6)] sm:text-base">
                  {t("description")}
                </p>
              </div>

              <div className="mt-8 w-full max-w-3xl rounded-4xl border border-white/70 bg-white/60 p-4 shadow-[0_24px_80px_rgba(190,24,93,0.16)] backdrop-blur dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-5">
                <SearchInput
                  allSongs={allSongs}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  placeholder={tHeader("searchPlaceholder")}
                  className="[&_input]:h-12 [&_input]:text-base"
                />
                <div className="mt-4 flex items-center justify-center gap-3 flex-row">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex min-w-40 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    disabled={isPending}
                  >
                    {isPending ? (
                      t("searching")
                    ) : (
                      <>
                        <LuSearch className="mr-1 inline" />
                        {t("searchButton")}
                      </>
                    )}
                  </button>
                  <Tooltip
                    withArrow
                    arrowSize={8}
                    position="bottom"
                    transitionProps={{ transition: "fade", duration: 300 }}
                    label={
                      <>
                        <LuSparkles className="mr-1 inline" />
                        {t("surpriseTooltip")}
                      </>
                    }
                  >
                    <Link
                      href={`/watch`}
                      className="inline-flex min-w-40 items-center justify-center rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:bg-transparent dark:text-pink-100 dark:hover:bg-pink-200/10"
                      aria-label={t("aria.randomPlay")}
                    >
                      <LuSparkles className="mr-1 inline" />
                      {t("surpriseMe")}
                    </Link>
                  </Tooltip>
                </div>

                <hr className="my-3 border-t border-gray-300 dark:border-gray-700" />

                <div className="flex items-left justify-center gap-3">
                  <Text size="sm" color="dimmed">
                    {/* 楽曲モードで再生 */}
                    {t("songMode")}
                  </Text>
                </div>

                <div className="mt-2 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                  {/* オリジナル楽曲 */}
                  <Button.Group className="w-full">
                    <Button
                      component={Link}
                      href="/watch?q=original-songs"
                      className={`min-w-0 flex-1`}
                      leftSection={
                        <ORIGINAL_SONG_MODE_ITEM.icon className="w-4 h-4" />
                      }
                      color="tan"
                      variant="light"
                    >
                      {t("originalSongs")}
                    </Button>
                    {/* link copy button */}
                    <CopyButton value={originalSongsShareUrl}>
                      {({ copied, copy }) => (
                        <Tooltip
                          withArrow
                          arrowSize={8}
                          label={t("shareLinkTooltip")}
                        >
                          <Button
                            className={`shrink-0`}
                            color="tan"
                            variant="light"
                            onClick={() => {
                              copy();
                              showCopiedNotification("original");
                            }}
                          >
                            {copied ? (
                              <>
                                <LuCopyCheck className="mr-1 inline" />
                              </>
                            ) : (
                              <LuCopy className="mr-1 inline" />
                            )}
                          </Button>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Button.Group>

                  {/* カバー楽曲 */}
                  <Button.Group className="w-full">
                    <Button
                      component={Link}
                      href="/watch?q=cover-songs"
                      className={`min-w-0 flex-1`}
                      color="gray"
                      variant="light"
                      leftSection={
                        <COVER_SONG_MODE_ITEM.icon className="w-4 h-4" />
                      }
                    >
                      {t("coverSongs")}
                    </Button>
                    {/* link copy button */}
                    <CopyButton value={coverSongsShareUrl}>
                      {({ copied, copy }) => (
                        <Tooltip
                          withArrow
                          arrowSize={8}
                          label={t("shareLinkTooltip")}
                        >
                          <Button
                            className={`shrink-0`}
                            color="gray"
                            variant="light"
                            onClick={() => {
                              copy();
                              showCopiedNotification("cover");
                            }}
                          >
                            {copied ? (
                              <>
                                <LuCopyCheck className="mr-1 inline" />
                              </>
                            ) : (
                              <LuCopy className="mr-1 inline" />
                            )}
                          </Button>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Button.Group>

                  {/* ユニット・ゲスト参加曲 */}
                  <Button.Group className="w-full">
                    <Button
                      component={Link}
                      href="/watch?q=collaboration-songs"
                      className={`min-w-0 flex-1`}
                      color="gray"
                      variant="light"
                      leftSection={
                        <COLLABORATION_SONG_MODE_ITEM.icon className="w-4 h-4" />
                      }
                    >
                      {t("collaborationSongs")}
                    </Button>
                    {/* link copy button */}
                    <CopyButton value={collaborationSongsShareUrl}>
                      {({ copied, copy }) => (
                        <Tooltip
                          withArrow
                          arrowSize={8}
                          label={t("shareLinkTooltip")}
                        >
                          <Button
                            className={`shrink-0`}
                            color="gray"
                            variant="light"
                            onClick={() => {
                              copy();
                              showCopiedNotification("collaboration");
                            }}
                          >
                            {copied ? (
                              <>
                                <LuCopyCheck className="mr-1 inline" />
                              </>
                            ) : (
                              <LuCopy className="mr-1 inline" />
                            )}
                          </Button>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Button.Group>

                  {/* 歌枠 */}
                  <Button.Group className="w-full">
                    <Button
                      component={Link}
                      href="/watch?q=tag:歌枠"
                      className={`min-w-0 flex-1`}
                      color="gray"
                      variant="light"
                      leftSection={
                        <KARAOKE_SONG_MODE_ITEM.icon className="w-4 h-4" />
                      }
                    >
                      {t("karaokeSongs")}
                    </Button>
                    {/* link copy button */}
                    <CopyButton value={karaokeSongsShareUrl}>
                      {({ copied, copy }) => (
                        <Tooltip
                          withArrow
                          arrowSize={8}
                          label={t("shareLinkTooltip")}
                        >
                          <Button
                            className={`shrink-0`}
                            color="gray"
                            variant="light"
                            onClick={() => {
                              copy();
                              showCopiedNotification("karaoke");
                            }}
                          >
                            {copied ? (
                              <>
                                <LuCopyCheck className="mr-1 inline" />
                              </>
                            ) : (
                              <LuCopy className="mr-1 inline" />
                            )}
                          </Button>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Button.Group>
                </div>
              </div>
            </div>
          </section>

          <section className="pt-8 pb-10 sm:pt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  {t("recommendedLabel")}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {t("recommendedTitle")}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {isLoading
                ? Array.from({ length: RECOMMENDED_SKELETON_COUNT }).map(
                    (_, index) => (
                      <div
                        key={`recommended-skeleton-${index}`}
                        className="overflow-hidden rounded-xl border border-white/70 bg-white/85 p-0 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/50 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]"
                        aria-hidden="true"
                      >
                        <Skeleton height="100%" className="aspect-video" />
                        <div className="space-y-2 p-3">
                          <Skeleton height={16} radius="sm" />
                          <Skeleton height={12} width="70%" radius="sm" />
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <Skeleton height={10} width="28%" radius="sm" />
                            <Skeleton height={10} width="42%" radius="sm" />
                          </div>
                        </div>
                      </div>
                    ),
                  )
                : recommendedSongs.map((song) => (
                    <Link
                      key={`${song.video_id}-${song.start}-${song.title}`}
                      href={buildWatchHref({
                        videoId: song.video_id,
                        start: song.start,
                      })}
                      className="group overflow-hidden rounded-xl border border-white/70 bg-white/85 shadow-[0_16px_45px_rgba(15,23,42,0.08)] hover-lift-animation hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] dark:hover:border-pink-300/30"
                    >
                      <div className="relative aspect-video overflow-hidden bg-black">
                        <YoutubeThumbnail
                          videoId={song.video_id}
                          alt={song.title}
                          imageClassName="transition duration-500"
                        />
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {song.title}
                        </div>
                        <div className="line-clamp-1 text-xs text-gray-600 dark:text-gray-200">
                          {song.artist}
                        </div>
                        <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-300">
                          <span>{song.year}</span>
                          <span>{formatDate(song.broadcast_at, locale)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>

            {!isLoading && (
              <section ref={viewMilestonesRef} className="mt-16">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                      {t("viewMilestonesLabel")}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {t("viewMilestonesTitle")}
                    </h2>
                  </div>
                  <Link
                    href="/statistics?tab=originalSongCountsByReleaseDate"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
                  >
                    {tDrawer("statistics")}
                    <LuArrowRight className="shrink-0" />
                  </Link>
                </div>

                {!shouldLoadViewStatistics || isViewStatisticsLoading ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={`view-milestone-skeleton-${index}`}
                        className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-gray-900/40 dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                        aria-hidden="true"
                      >
                        <Skeleton height={14} width="35%" radius="sm" />
                        <div className="mt-3 space-y-3">
                          {Array.from({ length: 3 }).map((__, itemIndex) => (
                            <div
                              key={`view-milestone-skeleton-row-${index}-${itemIndex}`}
                              className="flex items-start gap-2"
                            >
                              <Skeleton
                                height={36}
                                width={64}
                                radius="sm"
                                className="shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <Skeleton height={14} radius="sm" />
                                <Skeleton
                                  height={12}
                                  width="70%"
                                  radius="sm"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <SongCountOverview
                    items={[
                      ...milestoneStatistics.originalSongCountsByReleaseDate,
                      ...milestoneStatistics.coverSongCountsByReleaseDate,
                    ]}
                    primaryLabel={tStatistics(
                      "overview.originalSongCountsByReleaseDate.primaryLabel",
                    )}
                    totalCountLabel={tStatistics(
                      "overview.originalSongCountsByReleaseDate.totalCountLabel",
                    )}
                    topLabel=""
                    countUnit={tStatistics(
                      "overview.originalSongCountsByReleaseDate.countUnit",
                    )}
                    showMilestoneHighlights
                    showTopTile={false}
                    className="pt-0"
                  />
                )}
              </section>
            )}

            {featuredEvents.length > 0 && (
              <div className="mt-16 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    EVENTS
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {t("eventsTitle")}
                  </h3>
                </div>
                <section className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
                  <div className="mt-4 space-y-3">
                    {isEventsLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`event-skeleton-${index}`}
                          className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                          aria-hidden="true"
                        >
                          <Skeleton height={12} width="30%" radius="sm" />
                          <Skeleton height={16} radius="sm" className="mt-2" />
                          <Skeleton
                            height={12}
                            width="65%"
                            radius="sm"
                            className="mt-2"
                          />
                        </div>
                      ))
                    ) : featuredEvents.length > 0 ? (
                      featuredEvents.map((event, index) => {
                        const active = isEventActive(event);
                        const daysUntilEvent = getDaysUntil(
                          active
                            ? event.end_at || event.start_at
                            : event.start_at,
                        );
                        const showDaysUntilEvent =
                          daysUntilEvent !== null &&
                          (!active || daysUntilEvent > 0);
                        return (
                          <div
                            key={`${event.start_at}-${event.content}-${index}`}
                            className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1">
                                  {active ? (
                                    <>
                                      <Badge
                                        color="pink"
                                        size="md"
                                        radius="lg"
                                        className="mr-1"
                                      >
                                        {t("eventOngoing")}
                                      </Badge>
                                      {showDaysUntilEvent ? (
                                        <Badge
                                          color="pink"
                                          size="md"
                                          radius="lg"
                                          variant="outline"
                                        >
                                          {tAnniversaries("daysUntil", {
                                            days: daysUntilEvent,
                                          })}
                                        </Badge>
                                      ) : null}
                                    </>
                                  ) : showDaysUntilEvent ? (
                                    <Badge
                                      color="pink"
                                      size="md"
                                      radius="lg"
                                      variant="outline"
                                    >
                                      {tAnniversaries("daysUntil", {
                                        days: daysUntilEvent,
                                      })}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Text size="xs" c="dimmed">
                                    {event.place ? (
                                      <>
                                        <BsGeoAlt className="mr-1 inline" />
                                        {event.place}
                                        <span className="mx-1">|</span>
                                      </>
                                    ) : null}
                                    {formatEventRange(
                                      event.start_at,
                                      event.end_at,
                                    )}
                                  </Text>
                                </div>
                                <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                                  {event.content}
                                </p>
                                {event.note ? (
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    className="mt-1 whitespace-pre-line"
                                  >
                                    {event.note}
                                  </Text>
                                ) : null}
                              </div>
                              {event.url ? (
                                <Link
                                  href={event.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:text-pink-100"
                                >
                                  <FaExternalLinkAlt className="text-[0.65rem]" />
                                  {t("linkLabel")}
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                        {t("eventsEmpty")}
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}

            <div className="mt-16 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  {t("timelineLabel")}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {t("timelineTitle")}
                </h3>
              </div>
              <section>
                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                          {t("anniversariesTitle")}
                        </h2>
                      </div>
                      <Link
                        href="/anniversaries"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
                      >
                        {t("viewAnniversaries")}
                        <LuArrowRight className="shrink-0" />
                      </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                      {isAnniversariesLoading ? (
                        Array.from({ length: 1 }).map((_, index) => (
                          <div
                            key={`anniversary-skeleton-${index}`}
                            className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                            aria-hidden="true"
                          >
                            <Skeleton height={16} radius="sm" />
                            <Skeleton
                              height={12}
                              radius="sm"
                              className="mt-2"
                            />
                            <Skeleton
                              height={12}
                              width="55%"
                              radius="sm"
                              className="mt-2"
                            />
                          </div>
                        ))
                      ) : featuredAnniversaries.length > 0 ? (
                        featuredAnniversaries.map((item, index) => {
                          const nextIso = computeNextIsoForAnniversary(item);
                          const daysUntil = nextIso
                            ? getDaysUntil(nextIso)
                            : null;

                          return (
                            <div
                              key={`${item.name}-${index}`}
                              className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Text size="xs" c="dimmed">
                                      {nextIso
                                        ? formatDate(nextIso, locale)
                                        : "-"}
                                    </Text>
                                    {daysUntil !== null ? (
                                      <Badge
                                        color="pink"
                                        size="md"
                                        radius="lg"
                                        variant="outline"
                                      >
                                        {daysUntil === 0
                                          ? tAnniversaries("featuredTodayTitle")
                                          : tAnniversaries("daysUntil", {
                                              days: daysUntil,
                                            })}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                                    {formatAnniversaryName(item, locale)}
                                  </p>
                                  {item.note ? (
                                    <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                      {item.note}
                                    </p>
                                  ) : null}
                                </div>
                                {item.url ? (
                                  <Link
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:text-pink-100"
                                  >
                                    <FaExternalLinkAlt className="text-[0.65rem]" />
                                    {t("linkLabel")}
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                          {tAnniversaries("empty")}
                        </p>
                      )}
                    </div>
                  </section>

                  {(isLoading ||
                    isMilestonesLoading ||
                    todayMilestones.length > 0) && (
                    <section className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                            {tSummary("todayMilestonesTitle")}
                          </h2>
                        </div>
                        <Link
                          href="/summary"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
                        >
                          {t("viewSummary")}
                          <LuArrowRight className="shrink-0" />
                        </Link>
                      </div>

                      <div className="mt-4 space-y-3">
                        {isLoading || isMilestonesLoading
                          ? Array.from({ length: 1 }).map((_, index) => (
                              <div
                                key={`milestone-skeleton-${index}`}
                                className="rounded-xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                                aria-hidden="true"
                              >
                                <Skeleton height={12} width="25%" radius="sm" />
                                <Skeleton
                                  height={16}
                                  radius="sm"
                                  className="mt-2"
                                />
                                <Skeleton
                                  height={12}
                                  width="65%"
                                  radius="sm"
                                  className="mt-2"
                                />
                              </div>
                            ))
                          : todayMilestones
                              .slice(0, 1)
                              .map((milestone, index) => {
                                const milestoneContent =
                                  milestone.is_external ? (
                                    milestone.url ? (
                                      <Link
                                        href={milestone.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-primary hover:text-primary-700 dark:text-pink-200"
                                      >
                                        {milestone.text}
                                      </Link>
                                    ) : (
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {milestone.text}
                                      </span>
                                    )
                                  ) : (
                                    <Link
                                      href={buildMilestoneSearchHref(
                                        milestone.text,
                                      )}
                                      className="font-semibold text-primary hover:text-primary-700 dark:text-pink-200"
                                    >
                                      {milestone.text}
                                    </Link>
                                  );

                                return (
                                  <div
                                    key={`${milestone.date.toISOString()}-${milestone.text}-${index}`}
                                    className="rounded-2xl border border-primary/10 bg-primary/5 p-3 dark:border-white/10 dark:bg-white/5"
                                  >
                                    <Text size="xs" c="dimmed">
                                      {formatDate(milestone.date, locale)}
                                    </Text>
                                    <div className="mt-1 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                                      {milestoneContent}
                                    </div>
                                    {milestone.note ? (
                                      <Text
                                        size="xs"
                                        c="dimmed"
                                        className="mt-1 whitespace-pre-line"
                                      >
                                        {milestone.note}
                                      </Text>
                                    ) : null}

                                    {/* 動画 */}
                                    {milestone?.song && (
                                      <div className="mt-1 flex items-center gap-3">
                                        <div className="relative aspect-video w-21 shrink-0 overflow-hidden rounded-md bg-black">
                                          <YoutubeThumbnail
                                            videoId={milestone.song.video_id}
                                            alt={milestone.song.video_title}
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                            <Link
                                              href={buildWatchHref({
                                                videoId:
                                                  milestone.song.video_id,
                                                start: milestone.song.start,
                                              })}
                                              className="text-primary hover:text-primary-600 dark:hover:text-pink-300"
                                            >
                                              {milestone.song.video_title}
                                            </Link>
                                          </p>
                                          <p className="text-xs text-gray-600 dark:text-gray-300">
                                            {formatDate(
                                              milestone.song.broadcast_at,
                                              locale,
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                      </div>
                    </section>
                  )}
                </div>
              </section>
            </div>

            <section ref={activityTimelineRef} className="mt-16">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    {t("activityLabel")}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {t("activityTitle")}
                  </h2>
                </div>
                <Link
                  href="/stream-archives"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
                >
                  {tDrawer("archives")}
                  <LuArrowRight className="shrink-0" />
                </Link>
              </div>

              <div className="rounded-xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]">
                {isActivityTimelineLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`activity-timeline-skeleton-${index}`}
                        className="grid grid-cols-[32px_1fr] gap-3"
                        aria-hidden="true"
                      >
                        <Skeleton height={28} circle />
                        <div className="space-y-2">
                          <Skeleton height={14} width="45%" radius="sm" />
                          <Skeleton height={12} width="80%" radius="sm" />
                          <Skeleton height={10} width="28%" radius="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : visibleActivityTimelineItems.length > 0 ? (
                  <>
                    <Timeline
                      active={visibleActivityTimelineItems.length - 1}
                      bulletSize={30}
                      color="pink"
                      lineWidth={2}
                    >
                      {visibleActivityTimelineItems.map((item) => {
                        const itemLabel = getActivityItemLabel(item, t, locale);
                        const color = activityTimelineColors[item.kind];
                        const itemClasses = getActivityItemClasses(item.kind);
                        const titleHref = getActivityTitleHref(item);
                        const thumbnailHref = item.youtubeHref ?? item.href;
                        const descriptionHref =
                          getActivityDescriptionHref(item);
                        const titleIsExternal = isExternalHref(titleHref);
                        const thumbnailIsExternal =
                          isExternalHref(thumbnailHref);
                        const descriptionIsExternal =
                          isExternalHref(descriptionHref);
                        const activitySingerAvatars =
                          getActivitySingerAvatars(item);
                        const archiveLinkProps =
                          item.kind === "archive" && titleHref === item.href
                            ? {
                                onClick: (
                                  event: MouseEvent<HTMLAnchorElement>,
                                ) =>
                                  handleArchiveActivityLinkClick(
                                    event,
                                    item.href,
                                  ),
                              }
                            : {};

                        return (
                          <Timeline.Item
                            key={item.id}
                            bullet={getActivityItemBullet(item.kind)}
                            title={
                              <div className="flex flex-wrap items-center gap-2">
                                {titleHref ? (
                                  <Link
                                    href={titleHref}
                                    className={itemClasses.title}
                                    target={
                                      titleIsExternal ? "_blank" : undefined
                                    }
                                    rel={
                                      titleIsExternal
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                    {...archiveLinkProps}
                                  >
                                    {itemLabel.title}
                                  </Link>
                                ) : (
                                  <span className={itemClasses.title}>
                                    {itemLabel.title}
                                  </span>
                                )}
                                <Badge
                                  size="xs"
                                  radius="sm"
                                  color={color}
                                  variant="light"
                                  className="shrink-0"
                                >
                                  {itemLabel.badge}
                                </Badge>
                              </div>
                            }
                          >
                            <div className={`mt-2 ${itemClasses.item}`}>
                              <div className="flex items-start gap-3">
                                {item.videoId && thumbnailHref ? (
                                  <Link
                                    href={thumbnailHref}
                                    className={`relative aspect-video shrink-0 overflow-hidden rounded-md bg-black ${itemClasses.thumbnail}`}
                                    aria-label={itemLabel.title}
                                    target={
                                      thumbnailIsExternal ? "_blank" : undefined
                                    }
                                    rel={
                                      thumbnailIsExternal
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                  >
                                    <YoutubeThumbnail
                                      videoId={item.videoId}
                                      alt={itemLabel.title}
                                      imageClassName="object-cover transition duration-300"
                                    />
                                  </Link>
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  {itemLabel.description ? (
                                    <Text
                                      size="sm"
                                      className={itemClasses.description}
                                    >
                                      {descriptionHref ? (
                                        <Link
                                          href={descriptionHref}
                                          target={
                                            descriptionIsExternal
                                              ? "_blank"
                                              : undefined
                                          }
                                          rel={
                                            descriptionIsExternal
                                              ? "noopener noreferrer"
                                              : undefined
                                          }
                                          className="transition hover:text-primary dark:hover:text-pink-200"
                                        >
                                          {itemLabel.description}
                                        </Link>
                                      ) : (
                                        itemLabel.description
                                      )}
                                    </Text>
                                  ) : null}
                                  <Text size="xs" c="dimmed" className="mt-1">
                                    {formatDate(item.occurredAt, locale)}
                                  </Text>
                                  {activitySingerAvatars.length > 0 ? (
                                    <Avatar.Group
                                      className="mt-2"
                                      spacing="xxs"
                                    >
                                      {activitySingerAvatars.map((avatar) => {
                                        const image = (
                                          <Avatar
                                            key={`${item.id}-${avatar.name}`}
                                            src={avatar.iconUrl}
                                            alt={avatar.name}
                                            radius="xl"
                                            size="sm"
                                            className="border-2 border-white dark:border-gray-900"
                                          />
                                        );

                                        return (
                                          <Tooltip
                                            key={`${item.id}-${avatar.name}`}
                                            label={avatar.name}
                                            withArrow
                                            arrowSize={8}
                                          >
                                            {avatar.channelUrl ? (
                                              <Link
                                                href={avatar.channelUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                {image}
                                              </Link>
                                            ) : (
                                              image
                                            )}
                                          </Tooltip>
                                        );
                                      })}
                                    </Avatar.Group>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </Timeline.Item>
                        );
                      })}
                    </Timeline>

                    {shouldLoadActivityViewStatistics &&
                    isActivityViewMilestonesLoading ? (
                      <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <Skeleton height={20} width={20} circle />
                        <Text size="xs" c="dimmed">
                          {t("activityViewMilestonesLoading")}
                        </Text>
                      </div>
                    ) : null}

                    {hasMoreActivityTimelineItems ? (
                      <div className="mt-5 flex justify-center">
                        <Button
                          variant="light"
                          color="pink"
                          radius="xl"
                          onClick={() =>
                            setActivityTimelineVisibleCount(
                              (count) => count + ACTIVITY_TIMELINE_PAGE_SIZE,
                            )
                          }
                        >
                          {t("activityShowMore")}
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("activityEmpty")}
                  </p>
                )}
              </div>
            </section>

            {/* 更新情報セクション */}
            <div className="mt-16 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  {t("recentUpdatesLabel")}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {t("recentUpdatesTitle")}
                </h3>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={`update-skeleton-${i}`} height={60} />
                  ))}
                </div>
              ) : recentUpdates.length > 0 ? (
                <div className="space-y-4">
                  {recentUpdates.map((update) => {
                    const singerAvatars =
                      singerAvatarsByVideoId.get(update.videoId) ?? [];

                    const watchHref = buildWatchHref({
                      videoId: update.videoId,
                    });

                    return (
                      <div
                        key={update.videoId}
                        className="rounded-lg border border-pink-200 bg-white p-4 hover-lift-animation transition hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] dark:hover:border-pink-300/30"
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(update.date, locale)}{" "}
                          <Text
                            size="xs"
                            c="dimmed"
                            className="pl-2 text-gray-100"
                            component="span"
                          >
                            {t("recentUpdatesAddedCount", {
                              count: update.count,
                            })}
                          </Text>
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Link
                            href={watchHref}
                            className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-black"
                          >
                            <YoutubeThumbnail
                              videoId={update.videoId}
                              alt={update.videoTitle}
                              imageClassName="object-cover"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link href={watchHref} className="block">
                              <Text
                                size="sm"
                                className="line-clamp-2"
                                component="div"
                              >
                                {update.videoTitle}
                              </Text>
                            </Link>
                            {singerAvatars.length > 0 ? (
                              <Avatar.Group className="ml-2 mt-1" spacing="xxs">
                                {singerAvatars.map((avatar) => {
                                  const image = (
                                    <Avatar
                                      key={`${update.videoId}-${avatar.name}`}
                                      src={avatar.iconUrl}
                                      alt={avatar.name}
                                      radius="xl"
                                      size="md"
                                      className="border-2 border-white dark:border-gray-900"
                                    />
                                  );

                                  return (
                                    <Tooltip
                                      key={`${update.videoId}-${avatar.name}`}
                                      label={avatar.name}
                                      withArrow
                                      arrowSize={8}
                                    >
                                      {avatar.channelUrl ? (
                                        <Link
                                          href={avatar.channelUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(event) =>
                                            event.stopPropagation()
                                          }
                                        >
                                          {image}
                                        </Link>
                                      ) : (
                                        image
                                      )}
                                    </Tooltip>
                                  );
                                })}
                              </Avatar.Group>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("noRecentUpdates")}
                </p>
              )}
            </div>

            {/* リンク集 */}
            <div className="mt-24 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={siteConfig.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-64 items-center justify-center rounded-full bg-red-600 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
              >
                <FaYoutube className="mr-2" />
                {siteConfig.channelName}
              </Link>
              <Link
                href={siteConfig.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-64 items-center justify-center rounded-full bg-gray-900 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                <FaXTwitter className="mr-2" />
                {siteConfig.xName}
              </Link>
              <Link
                href="https://hololive.hololivepro.com/talents/azki/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-64 items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-500 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition dark:bg-cyan-600 dark:text-white dark:hover:bg-cyan-500"
              >
                {t("hololiveOfficial")}
              </Link>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500/80 dark:text-gray-100/80">
              {isLoading
                ? t("statsLoading")
                : t("stats", {
                    count: allSongs.length.toLocaleString(),
                    date: songsUpdatedLabel
                      ? t("lastUpdated", { date: songsUpdatedLabel })
                      : "",
                  })}
              {!isLoading && buildDateLabel && songsUpdatedLabel ? (
                <>
                  <br />
                  Version{" "}
                  <Link
                    href={
                      appVersion === "dev"
                        ? "https://github.com/mitsugogo/azki-song-db"
                        : `https://github.com/mitsugogo/azki-song-db/releases/tag/v${appVersion}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-primary dark:hover:text-pink-300"
                  >
                    {appVersion === "dev" ? "dev" : `v${appVersion}`}
                  </Link>
                  <br />
                  Copylight © {copyrightYears} mitsugogo
                </>
              ) : null}
            </p>
          </section>
        </main>

        <Footer />
      </div>
      <DrawerMenu opened={drawerOpened} onClose={closeDrawer} />
      <AnalyticsWrapper />
    </div>
  );
}
